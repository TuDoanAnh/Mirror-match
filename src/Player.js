import Phaser from 'phaser';
import BaseCharacter from './BaseCharacter';
import Projectile from './Projectile';
import { GAME_CONFIG } from './gameConfig';
import { playSkillSFX } from './soundManager';
import { MAP_OBSTACLES } from './mapObstacles';
import { MAP_POLYGONS } from './mapPolygons';
import { isPointInAnyPolygon } from './polygonCollision';

export default class Player extends BaseCharacter {
  constructor(scene, x, y, isBot = false, color = 0x0088ff) {
    const heroId = isBot ? 'ezreal' : (scene.registry.get('selectedHero') || 'ezreal');
    const heroData = GAME_CONFIG.CHARACTERS[heroId] || GAME_CONFIG.CHARACTERS.ezreal;

    super(scene, x, y, isBot, isBot ? 0xff0000 : heroData.color, heroId);

    this.heroId = heroId;
    this.heroData = heroData;
    this.setupHeroTexture(isBot ? 0xff0000 : heroData.color);

    // Load Base Stats from Hero Config
    this.maxHp = heroData.baseStats.hp;
    this.hp = this.maxHp;
    this.speed = heroData.baseStats.speed;
    this.armor = heroData.baseStats.armor;
    this.lifesteal = heroData.baseStats.lifesteal;
    this.critChance = heroData.baseStats.critChance;
    this.armorPen = heroData.baseStats.armorPen;

    // Load Skills from Hero Config
    this.skills = JSON.parse(JSON.stringify(heroData.skills));
    Object.keys(this.skills).forEach(k => {
      this.skills[k].lastUsed = -999999;
    });

    if (!isBot && scene.registry.has('playerStats')) {
      const stats = scene.registry.get('playerStats');
      this.maxHp += (stats.bonusHP || 0);
      this.hp = this.maxHp;
      this.speed += (stats.bonusSpeed || 0);
      this.armor += (stats.armor || 0);
      this.lifesteal += (stats.lifesteal || 0);
      this.critChance += (stats.critChance || 0);
      this.armorPen += (stats.armorPen || 0);
      
      const cdrMult = Math.max(0.1, 1 - (stats.cdr || 0));
      Object.values(this.skills).forEach(skill => {
        if (skill.cooldown) skill.cooldown *= cdrMult;
        if (skill.config && skill.config.damage) skill.config.damage += (stats.bonusDamage || 0);
      });
    }

    if (!isBot) {
      this.keys = scene.input.keyboard.addKeys('W,A,S,D,SPACE,ONE,TWO,THREE');
      this.keys.ONE.on('down', () => this.useActiveItem('zhonya'));
      this.keys.TWO.on('down', () => this.useActiveItem('qss'));
      this.keys.THREE.on('down', () => this.useActiveItem('rocketbelt'));
    }
  }

  useActiveItem(itemId) {
    if (this.hp <= 0 || this.isStasis || this.isBot) return;
    const inv = this.scene.registry.get('inventory') || [];
    const hasItem = inv.some(item => item.id === itemId);
    if (!hasItem) return;

    if (itemId === 'zhonya') {
      if (this.canUseActiveItem('zhonya', 30000)) {
        this.applyStasis(2000);
      }
    } else if (itemId === 'qss') {
      if (this.canUseActiveItem('qss', 20000)) {
        this.isRooted = false;
        this.isCharmed = false;
        if (this.scene) {
          showDamageText(this.scene, this.x, this.y - 15, 'CLEANSED', 'heal');
        }
      }
    } else if (itemId === 'rocketbelt') {
      if (this.canUseActiveItem('rocketbelt', 20000)) {
        const ptr = this.scene.input.activePointer;
        const angle = Phaser.Math.Angle.Between(this.x, this.y, ptr.worldX, ptr.worldY);
        this.executeDash('E', ptr.worldX, ptr.worldY, angle);
        this.shootSpreadProjectiles('Q', angle);
      }
    }
  }

  canUseActiveItem(itemId, cooldown = 20000) {
    if (!this.activeCooldowns) this.activeCooldowns = {};
    const now = this.scene.time.now;
    if (now >= (this.activeCooldowns[itemId] || 0)) {
      this.activeCooldowns[itemId] = now + cooldown;
      return true;
    }
    return false;
  }

  update(time, delta) {
    if (this.hp <= 0) return;

    if (!this.isBot) {
      this.handleInput();
      this.handleAim(this.scene.input.activePointer.worldX, this.scene.input.activePointer.worldY);
    }

    super.update(time, delta);
  }

  handleInput() {
    if (this.isChanneling || this.isRooted) {
      this.setVelocity(0, 0);
      return;
    }

    let vx = 0;
    let vy = 0;

    if (this.keys.A.isDown) vx = -1;
    if (this.keys.D.isDown) vx = 1;
    if (this.keys.W.isDown) vy = -1;
    if (this.keys.S.isDown) vy = 1;

    if (vx !== 0 || vy !== 0) {
      const angle = Math.atan2(vy, vx);
      this.setVelocity(Math.cos(angle) * this.speed, Math.sin(angle) * this.speed);
    } else {
      this.setVelocity(0, 0);
    }
  }

  executeQ(targetX, targetY, fireAngle) {
    this.executeSkillByType('Q', targetX, targetY, fireAngle);
  }

  executeE(targetX, targetY, fireAngle) {
    this.executeSkillByType('E', targetX, targetY, fireAngle);
  }

  executeSpace(targetX, targetY, fireAngle) {
    this.executeSkillByType('SPACE', targetX, targetY, fireAngle);
  }

  executeSkillByType(skillKey, targetX, targetY, fireAngle) {
    const skill = this.skills[skillKey];
    if (!skill) return;

    // Play skill SFX
    playSkillSFX(this.scene, this.heroId, skillKey);

    const channelTime = (skill.config && skill.config.channelTime) || 0;

    if (skill.type === 'LUX_BEAM') {
      this.executeLuxBeam(skillKey, targetX, targetY, fireAngle);
      return;
    }

    if (channelTime > 0) {
      this.isChanneling = true;
      this.setVelocity(0, 0);
      this.setRotation(fireAngle);

      // Charging aura ring at player position
      const auraCircle = this.scene.add.circle(this.x, this.y, 40);
      auraCircle.setStrokeStyle(3, this.heroData.color || 0xffaa00);
      auraCircle.setBlendMode('ADD');

      const auraTween = this.scene.tweens.add({
        targets: auraCircle,
        scale: 0.1,
        alpha: { start: 1, end: 0.2 },
        duration: channelTime,
        ease: 'Linear'
      });

      // Targeting sight line
      const indicator = this.scene.add.graphics();
      const beamLength = 1000;
      const curEndX = this.x + Math.cos(fireAngle) * beamLength;
      const curEndY = this.y + Math.sin(fireAngle) * beamLength;
      indicator.lineStyle(2, this.heroData.color || 0xffaa00, 0.6);
      indicator.beginPath();
      indicator.moveTo(this.x, this.y);
      indicator.lineTo(curEndX, curEndY);
      indicator.strokePath();

      this.scene.time.delayedCall(channelTime, () => {
        this.isChanneling = false;
        indicator.destroy();
        auraTween.stop();
        auraCircle.destroy();

        if (!this.active || this.hp <= 0) return;

        if (skill.type === 'PROJECTILE') {
          this.shootProjectile(skillKey, fireAngle);
        } else if (skill.type === 'SPREAD_SHOT') {
          this.shootSpreadProjectiles(skillKey, fireAngle);
        } else if (skill.type === 'DASH') {
          this.executeDash(skillKey, targetX, targetY, fireAngle);
        } else if (skill.type === 'SHIELD') {
          this.addShield(skill.config.shieldHp, skill.config.duration);
        } else if (skill.type === 'YASUO_Q') {
          this.executeYasuoQ(skillKey, fireAngle);
        } else if (skill.type === 'YASUO_WINDWALL') {
          this.executeYasuoWindWall(skillKey, targetX, targetY, fireAngle);
        } else if (skill.type === 'ZED_SHURIKEN') {
          this.executeZedShuriken(skillKey, fireAngle);
        } else if (skill.type === 'ZED_SHADOW') {
          this.executeZedShadow(skillKey, targetX, targetY);
        } else if (skill.type === 'ZED_DEATHMARK') {
          this.executeZedDeathMark(skillKey, targetX, targetY, fireAngle);
        } else if (skill.type === 'RIVEN_Q') {
          this.executeRivenQ(skillKey, targetX, targetY, fireAngle);
        } else if (skill.type === 'RIVEN_E') {
          this.executeRivenE(skillKey, targetX, targetY, fireAngle);
        } else if (skill.type === 'RIVEN_WINDSLASH') {
          this.executeRivenWindSlash(skillKey, targetX, targetY, fireAngle);
        }
      });
    } else {
      if (skill.type === 'PROJECTILE') {
        this.shootProjectile(skillKey, fireAngle);
      } else if (skill.type === 'SPREAD_SHOT') {
        this.shootSpreadProjectiles(skillKey, fireAngle);
      } else if (skill.type === 'DASH') {
        this.executeDash(skillKey, targetX, targetY, fireAngle);
      } else if (skill.type === 'SHIELD') {
        this.addShield(skill.config.shieldHp, skill.config.duration);
      } else if (skill.type === 'YASUO_Q') {
        this.executeYasuoQ(skillKey, fireAngle);
      } else if (skill.type === 'YASUO_WINDWALL') {
        this.executeYasuoWindWall(skillKey, targetX, targetY, fireAngle);
      } else if (skill.type === 'ZED_SHURIKEN') {
        this.executeZedShuriken(skillKey, fireAngle);
      } else if (skill.type === 'ZED_SHADOW') {
        this.executeZedShadow(skillKey, targetX, targetY);
      } else if (skill.type === 'ZED_DEATHMARK') {
        this.executeZedDeathMark(skillKey, targetX, targetY, fireAngle);
      } else if (skill.type === 'RIVEN_Q') {
        this.executeRivenQ(skillKey, targetX, targetY, fireAngle);
      } else if (skill.type === 'RIVEN_E') {
        this.executeRivenE(skillKey, targetX, targetY, fireAngle);
      } else if (skill.type === 'RIVEN_WINDSLASH') {
        this.executeRivenWindSlash(skillKey, targetX, targetY, fireAngle);
      }
    }
  }

  executeYasuoQ(skillKey, angle) {
    const skillConfig = this.skills[skillKey].config;
    this.yasuoQStacks = (this.yasuoQStacks || 0) + 1;

    if (this.yasuoQStacks < 3) {
      const thrustProj = new Projectile(this.scene, this.x, this.y, skillKey, {
        damage: skillConfig.damage,
        speed: skillConfig.speed,
        isPiercing: false
      }, this, this.heroId);
      this.projectileGroup.add(thrustProj);
      thrustProj.fire(angle);
    } else {
      this.yasuoQStacks = 0;
      const tornadoProj = new Projectile(this.scene, this.x, this.y, skillKey, {
        damage: (skillConfig.damage || 130) * 1.4,
        speed: 550,
        isPiercing: true,
        rootDuration: 800
      }, this, this.heroId);
      tornadoProj.isTornado = true;
      this.projectileGroup.add(tornadoProj);
      tornadoProj.fire(angle);

      if (this.scene) {
        showDamageText(this.scene, this.x, this.y - 20, 'TORNADO!', 'crit');
      }
    }
  }

  executeYasuoWindWall(skillKey, targetX, targetY, angle) {
    const skillConfig = this.skills[skillKey].config;
    const wallWidth = skillConfig.wallWidth || 160;
    const wallHeight = skillConfig.wallHeight || 28;
    const spawnDist = 60;
    const wallX = this.x + Math.cos(angle) * spawnDist;
    const wallY = this.y + Math.sin(angle) * spawnDist;

    if (this.scene && typeof this.scene.createWindWall === 'function') {
      this.scene.createWindWall(wallX, wallY, angle, wallWidth, wallHeight, skillConfig.duration || 3000, this);
    }
  }

  canUseSkill(skillKey, time) {
    if (this.heroId === 'zed' && skillKey === 'E' && this.activeShadow && this.activeShadow.active) {
      return true; // Allow instant recast to swap positions with shadow!
    }
    if (this.heroId === 'riven' && skillKey === 'Q' && (this.rivenQCombo || 0) > 0 && (this.rivenQCombo || 0) < 3) {
      return true; // Allow instant recast during Q combo!
    }
    return super.canUseSkill(skillKey, time);
  }

  executeRivenQ(skillKey, targetX, targetY, angle) {
    const skillConfig = this.skills[skillKey].config;
    const damage = skillConfig.damage || 110;
    
    this.rivenQCombo = (this.rivenQCombo || 0) + 1;
    const comboStep = this.rivenQCombo;

    if (this.rivenQTimer) this.rivenQTimer.remove();
    this.rivenQTimer = this.scene.time.delayedCall(3500, () => {
      this.rivenQCombo = 0;
    });

    if (comboStep < 3) {
      this.executeDash(skillKey, targetX, targetY, angle);

      if (this.scene) {
        const arcGraphics = this.scene.add.graphics();
        arcGraphics.lineStyle(6, 0x10b981, 0.9);
        arcGraphics.beginPath();
        arcGraphics.arc(this.x, this.y, 75, angle - Math.PI / 3, angle + Math.PI / 3, false);
        arcGraphics.strokePath();

        this.scene.tweens.add({
          targets: arcGraphics,
          alpha: 0,
          scale: 1.25,
          duration: 250,
          onComplete: () => arcGraphics.destroy()
        });
      }

      this.applyMeleeAreaDamage(this.x, this.y, angle, 120, Math.PI / 3, damage, false);

      if (this.skills && this.skills.Q) {
        this.skills.Q.lastUsed = this.scene.time.now - (this.skills.Q.cooldown - 400);
      }
    } else {
      this.rivenQCombo = 0;
      if (this.rivenQTimer) this.rivenQTimer.remove();

      this.executeDash(skillKey, targetX, targetY, angle);

      if (this.scene) {
        import('./FloatingDamage').then(m => {
          if (m.showDamageText) m.showDamageText(this.scene, this.x, this.y - 20, 'KNOCKUP SLAM!', 'crit');
        }).catch(() => {});
        
        const shockwave = this.scene.add.circle(this.x, this.y, 40, 0x10b981, 0.6);
        shockwave.setStrokeStyle(4, 0x34d399, 1);
        this.scene.tweens.add({
          targets: shockwave,
          scale: 3.2,
          alpha: 0,
          duration: 400,
          onComplete: () => shockwave.destroy()
        });
      }

      this.applyMeleeRadiusDamage(this.x, this.y, 130, damage * 1.4, true, true);

      if (this.skills && this.skills.Q) {
        this.skills.Q.lastUsed = this.scene.time.now;
      }
    }
  }

  executeRivenE(skillKey, targetX, targetY, angle) {
    const skillConfig = this.skills[skillKey].config;
    this.executeDash(skillKey, targetX, targetY, angle);
    this.addShield(skillConfig.shieldHp || 220, skillConfig.duration || 2500);
  }

  executeRivenWindSlash(skillKey, targetX, targetY, angle) {
    const skillConfig = this.skills[skillKey].config;
    const baseDamage = skillConfig.damage || 480;
    const range = skillConfig.range || 360;

    if (this.scene) {
      for (let i = -1; i <= 1; i++) {
        const waveAngle = angle + (i * 0.25);
        const waveGraphics = this.scene.add.graphics();
        waveGraphics.lineStyle(8, 0x34d399, 0.95);
        waveGraphics.beginPath();
        waveGraphics.arc(this.x, this.y, 60, waveAngle - 0.2, waveAngle + 0.2, false);
        waveGraphics.strokePath();

        this.scene.tweens.add({
          targets: waveGraphics,
          x: Math.cos(waveAngle) * (range * 0.7),
          y: Math.sin(waveAngle) * (range * 0.7),
          alpha: 0,
          scale: 2.2,
          duration: 380,
          ease: 'Cubic.easeOut',
          onComplete: () => waveGraphics.destroy()
        });
      }
    }

    this.applyConeWindSlashDamage(this.x, this.y, angle, range, Math.PI / 5, baseDamage);
  }

  getOpponentTargets() {
    const targets = [];
    if (!this.isBot) {
      if (this.scene.bot && this.scene.bot.active && this.scene.bot.hp > 0) {
        targets.push(this.scene.bot);
      }
      if (this.scene.creeps) {
        this.scene.creeps.getChildren().forEach(c => {
          if (c.active && c.hp > 0) targets.push(c);
        });
      }
    } else {
      if (this.scene.player && this.scene.player.active && this.scene.player.hp > 0) {
        targets.push(this.scene.player);
      }
    }
    return targets;
  }

  applyMeleeAreaDamage(originX, originY, faceAngle, maxDist, halfArc, damage, isCrit = false) {
    const targets = this.getOpponentTargets();
    targets.forEach(target => {
      const dist = Phaser.Math.Distance.Between(originX, originY, target.x, target.y);
      if (dist <= maxDist) {
        const angleToTarget = Phaser.Math.Angle.Between(originX, originY, target.x, target.y);
        let angleDiff = Math.abs(Phaser.Math.Angle.Normalize(angleToTarget - faceAngle));
        if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
        if (angleDiff <= halfArc) {
          target.takeDamage(damage, isCrit);
        }
      }
    });
  }

  applyMeleeRadiusDamage(originX, originY, radius, damage, isCrit = false, doKnockup = false) {
    const targets = this.getOpponentTargets();
    targets.forEach(target => {
      const dist = Phaser.Math.Distance.Between(originX, originY, target.x, target.y);
      if (dist <= radius) {
        target.takeDamage(damage, isCrit);
        if (doKnockup && typeof target.applyKnockup === 'function') {
          target.applyKnockup(600);
        }
      }
    });
  }

  applyConeWindSlashDamage(originX, originY, faceAngle, maxRange, halfArc, baseDamage) {
    const targets = this.getOpponentTargets();
    targets.forEach(target => {
      const dist = Phaser.Math.Distance.Between(originX, originY, target.x, target.y);
      if (dist <= maxRange) {
        const angleToTarget = Phaser.Math.Angle.Between(originX, originY, target.x, target.y);
        let angleDiff = Math.abs(Phaser.Math.Angle.Normalize(angleToTarget - faceAngle));
        if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;

        if (angleDiff <= halfArc) {
          const missingHpRatio = Math.max(0, 1 - (target.hp / target.maxHp));
          const finalDamage = Math.round(baseDamage * (1 + missingHpRatio * 1.2));
          target.takeDamage(finalDamage, true);
        }
      }
    });
  }

  executeZedShuriken(skillKey, angle) {
    this.shootProjectile(skillKey, angle);

    if (this.activeShadow && this.activeShadow.active) {
      const shadowProj = new Projectile(this.scene, this.activeShadow.x, this.activeShadow.y, skillKey, this.skills[skillKey].config, this, this.heroId);
      this.projectileGroup.add(shadowProj);
      shadowProj.fire(angle);
    }
  }

  executeZedShadow(skillKey, targetX, targetY) {
    const now = this.scene.time.now;

    // Recast E: Swap positions with Active Shadow Clone!
    if (this.activeShadow && this.activeShadow.active) {
      const oldPlayerX = this.x;
      const oldPlayerY = this.y;
      const shadowX = this.activeShadow.x;
      const shadowY = this.activeShadow.y;

      this.x = shadowX;
      this.y = shadowY;
      if (this.body) this.body.reset(shadowX, shadowY);

      if (this.scene) {
        const burst1 = this.scene.add.circle(oldPlayerX, oldPlayerY, 30, 0x991b1b, 0.7);
        this.scene.tweens.add({ targets: burst1, scale: 2, alpha: 0, duration: 300, onComplete: () => burst1.destroy() });

        const burst2 = this.scene.add.circle(shadowX, shadowY, 30, 0x991b1b, 0.7);
        this.scene.tweens.add({ targets: burst2, scale: 2, alpha: 0, duration: 300, onComplete: () => burst2.destroy() });
      }

      this.activeShadow.destroy();
      this.activeShadow = null;

      // Trigger full E cooldown after position swap
      if (this.skills && this.skills.E) {
        this.skills.E.lastUsed = now;
      }
      return;
    }

    // 1st Cast E: Place Shadow Clone
    const dist = Phaser.Math.Distance.Between(this.x, this.y, targetX, targetY);
    const maxDist = 280;
    const actualDist = Math.min(dist, maxDist);
    const angle = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);
    const shadowX = this.x + Math.cos(angle) * actualDist;
    const shadowY = this.y + Math.sin(angle) * actualDist;

    const shadow = this.scene.add.sprite(shadowX, shadowY, this.texture.key);
    shadow.setTint(0x222222);
    shadow.setAlpha(0.85);
    shadow.setDepth(9);

    this.activeShadow = shadow;

    // Temporary 300ms delay so button isn't instantly double-pressed
    if (this.skills && this.skills.E) {
      this.skills.E.lastUsed = now - (this.skills.E.cooldown - 300);
    }

    // Shadow lasts 5 seconds
    this.scene.time.delayedCall(5000, () => {
      if (this.activeShadow === shadow) {
        this.activeShadow = null;
        if (this.skills && this.skills.E) {
          this.skills.E.lastUsed = this.scene.time.now;
        }
      }
      if (shadow && shadow.active) shadow.destroy();
    });
  }

  executeZedDeathMark(skillKey, targetX, targetY, angle) {
    const skillConfig = this.skills[skillKey].config;
    const target = this.isBot ? this.scene.player : this.scene.bot;
    const castRange = skillConfig.castRange || 380;
    const baseDamage = skillConfig.damage || 250;
    const markDuration = skillConfig.markDuration || 5000;

    if (target && target.active && target.hp > 0) {
      const dist = Phaser.Math.Distance.Between(this.x, this.y, target.x, target.y);

      if (dist <= castRange) {
        // Teleport behind target
        const behindAngle = Phaser.Math.Angle.Between(target.x, target.y, this.x, this.y);
        const newX = target.x + Math.cos(behindAngle) * 45;
        const newY = target.y + Math.sin(behindAngle) * 45;

        if (this.scene) {
          const burst1 = this.scene.add.circle(this.x, this.y, 35, 0x991b1b, 0.7);
          this.scene.tweens.add({ targets: burst1, scale: 2, alpha: 0, duration: 300, onComplete: () => burst1.destroy() });

          const burst2 = this.scene.add.circle(newX, newY, 40, 0xff0000, 0.7);
          this.scene.tweens.add({ targets: burst2, scale: 2, alpha: 0, duration: 300, onComplete: () => burst2.destroy() });
        }

        this.x = newX;
        this.y = newY;
        if (this.body) this.body.reset(newX, newY);

        // Apply Death Mark for 5s (Fixed Base DMG + 35% of stored DMG dealt during 5s)
        target.applyDeathMark(baseDamage, markDuration);
      } else {
        if (this.scene) {
          showDamageText(this.scene, this.x, this.y - 15, 'OUT OF RANGE', 'shield');
        }
      }
    }
  }

  getSafeDashPosition(startX, startY, fireAngle, maxDist) {
    let safeX = startX;
    let safeY = startY;
    const stepSize = 8;
    const totalSteps = Math.floor(maxDist / stepSize);

    for (let i = 1; i <= totalSteps; i++) {
      const testDist = i * stepSize;
      const testX = startX + Math.cos(fireAngle) * testDist;
      const testY = startY + Math.sin(fireAngle) * testDist;

      // Active playable arena bounds check
      if (testX < 190 || testX > 1230 || testY < 130 || testY > 880) {
        break;
      }

      // Check collision against MAP_POLYGONS
      if (isPointInAnyPolygon(testX, testY, MAP_POLYGONS)) {
        break;
      }

      // Check collision against MAP_OBSTACLES
      let isBlocked = false;
      for (let j = 0; j < MAP_OBSTACLES.length; j++) {
        const obs = MAP_OBSTACLES[j];
        if (obs.isPassable) continue;

        const margin = 28;
        const left = obs.x - obs.w / 2 - margin;
        const right = obs.x + obs.w / 2 + margin;
        const top = obs.y - obs.h / 2 - margin;
        const bottom = obs.y + obs.h / 2 + margin;

        if (testX >= left && testX <= right && testY >= top && testY <= bottom) {
          isBlocked = true;
          break;
        }
      }

      if (isBlocked) {
        break;
      }

      safeX = testX;
      safeY = testY;
    }

    return { x: safeX, y: safeY };
  }

  executeDash(skillKey, targetX, targetY, fireAngle) {
    const skill = this.skills[skillKey];
    const dashDist = skill.config ? skill.config.dashDistance : (skill.dashDistance || 150);
    const dist = Phaser.Math.Distance.Between(this.x, this.y, targetX, targetY);
    const actualDist = Math.min(dist, dashDist);
    
    const startX = this.x;
    const startY = this.y;
    
    const safePos = this.getSafeDashPosition(startX, startY, fireAngle, actualDist);
    this.x = safePos.x;
    this.y = safePos.y;
    if (this.body) {
      this.body.reset(this.x, this.y);
    }

    const endX = this.x;
    const endY = this.y;

    // Create 4 ghost afterimages along the dash path
    for (let i = 0; i <= 4; i++) {
      const ghostX = Phaser.Math.Linear(startX, endX, i / 4);
      const ghostY = Phaser.Math.Linear(startY, endY, i / 4);
      
      const ghost = this.scene.add.sprite(ghostX, ghostY, this.texture.key);
      ghost.setRotation(this.rotation);
      ghost.setTint(this.heroData.color || 0x00ffff);
      ghost.setBlendMode('ADD');
      ghost.alpha = 0.6;
      
      this.scene.tweens.add({
        targets: ghost,
        alpha: 0,
        scale: 1.3,
        duration: 200 + (i * 50),
        onComplete: () => ghost.destroy()
      });
    }
  }

  shootProjectile(skillKey, angle) {
    const skillConfig = this.skills[skillKey].config;
    const spawnX = this.x + Math.cos(angle) * 20;
    const spawnY = this.y + Math.sin(angle) * 20;

    const proj = new Projectile(this.scene, spawnX, spawnY, skillKey, skillConfig, this, this.heroId);
    this.projectileGroup.add(proj);
    proj.fire(angle);
  }

  shootSpreadProjectiles(skillKey, angle) {
    const skill = this.skills[skillKey];
    const count = (skill.config && skill.config.count) || 3;
    const spreadAngle = (skill.config && skill.config.spreadAngle) || 0.25;

    const startAngle = angle - (spreadAngle * (count - 1)) / 2;

    for (let i = 0; i < count; i++) {
      const currentAngle = startAngle + i * spreadAngle;
      const spawnX = this.x + Math.cos(currentAngle) * 20;
      const spawnY = this.y + Math.sin(currentAngle) * 20;

      const proj = new Projectile(this.scene, spawnX, spawnY, skillKey, skill.config, this, this.heroId);
      this.projectileGroup.add(proj);
      proj.fire(currentAngle);
    }
  }

  executeLuxBeam(skillKey, targetX, targetY, fireAngle) {
    const skill = this.skills[skillKey];
    const damage = (skill.config && skill.config.damage) || 650;
    const channelTime = (skill.config && skill.config.channelTime) || 1000;
    const beamWidth = (skill.config && skill.config.beamWidth) || 50;

    this.isChanneling = true;
    this.setVelocity(0, 0);
    this.setRotation(fireAngle);

    const beamLength = 2000;
    const indicator = this.scene.add.graphics();
    
    // Charging aura ring at player position
    const auraCircle = this.scene.add.circle(this.x, this.y, 45);
    auraCircle.setStrokeStyle(3, 0xffdd00);
    auraCircle.setBlendMode('ADD');

    const auraTween = this.scene.tweens.add({
      targets: auraCircle,
      scale: 0.1,
      alpha: { start: 1, end: 0.2 },
      duration: channelTime,
      ease: 'Linear'
    });

    const updateIndicator = () => {
      if (!indicator || !indicator.active) return;
      indicator.clear();

      // Pulsing thin red laser sight line
      const alpha = 0.5 + Math.sin(this.scene.time.now / 40) * 0.3;
      const curEndX = this.x + Math.cos(fireAngle) * beamLength;
      const curEndY = this.y + Math.sin(fireAngle) * beamLength;

      // Outer wide warning beam (subtle red zone)
      indicator.lineStyle(beamWidth, 0xff0000, 0.15);
      indicator.beginPath();
      indicator.moveTo(this.x, this.y);
      indicator.lineTo(curEndX, curEndY);
      indicator.strokePath();

      // Inner sharp targeting line
      indicator.lineStyle(3, 0xff3333, alpha);
      indicator.beginPath();
      indicator.moveTo(this.x, this.y);
      indicator.lineTo(curEndX, curEndY);
      indicator.strokePath();

      auraCircle.setPosition(this.x, this.y);
    };

    const indicatorTimer = this.scene.time.addEvent({
      delay: 30,
      callback: updateIndicator,
      loop: true
    });

    // Fire Beam after 1 second channel
    this.scene.time.delayedCall(channelTime, () => {
      this.isChanneling = false;

      // Cleanup indicator graphics & timer
      indicatorTimer.remove();
      indicator.destroy();
      auraTween.stop();
      auraCircle.destroy();

      if (!this.active || this.hp <= 0) return;

      const laserStartX = this.x;
      const laserStartY = this.y;
      const laserEndX = laserStartX + Math.cos(fireAngle) * beamLength;
      const laserEndY = laserStartY + Math.sin(fireAngle) * beamLength;

      // Multi-layer laser beam graphic / sprite
      if (this.scene.textures.exists('lux_space_beam')) {
        const beamSprite = this.scene.add.sprite(laserStartX, laserStartY, 'lux_space_beam');
        beamSprite.setOrigin(0.05, 0.5);
        beamSprite.setRotation(fireAngle);
        beamSprite.setScale(1.1, 0.75);
        beamSprite.setBlendMode('ADD');
        beamSprite.setDepth(20);

        this.scene.tweens.add({
          targets: beamSprite,
          alpha: 0,
          scaleY: 0.05,
          duration: 450,
          ease: 'Quad.easeOut',
          onComplete: () => {
            beamSprite.destroy();
          }
        });
      } else {
        const beamGraphics = this.scene.add.graphics();
        beamGraphics.setBlendMode('ADD');

        // Outer glowing golden laser
        beamGraphics.lineStyle(beamWidth, 0xffdd00, 0.9);
        beamGraphics.beginPath();
        beamGraphics.moveTo(laserStartX, laserStartY);
        beamGraphics.lineTo(laserEndX, laserEndY);
        beamGraphics.strokePath();

        // Core white laser
        beamGraphics.lineStyle(beamWidth * 0.4, 0xffffff, 1.0);
        beamGraphics.beginPath();
        beamGraphics.moveTo(laserStartX, laserStartY);
        beamGraphics.lineTo(laserEndX, laserEndY);
        beamGraphics.strokePath();

        // Flash circle at origin
        const flashCircle = this.scene.add.circle(laserStartX, laserStartY, beamWidth * 0.8, 0xffffff);
        flashCircle.setBlendMode('ADD');

        this.scene.tweens.add({
          targets: [beamGraphics, flashCircle],
          alpha: 0,
          duration: 350,
          ease: 'Quad.easeOut',
          onComplete: () => {
            beamGraphics.destroy();
            flashCircle.destroy();
          }
        });
      }

      // Point to segment distance helper
      const pointToSegmentDist = (px, py, x1, y1, x2, y2) => {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const lenSq = dx * dx + dy * dy;
        if (lenSq === 0) return Phaser.Math.Distance.Between(px, py, x1, y1);
        let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
        t = Math.max(0, Math.min(1, t));
        const projX = x1 + t * dx;
        const projY = y1 + t * dy;
        return Phaser.Math.Distance.Between(px, py, projX, projY);
      };

      // Hit detection on targets
      const targets = [];
      if (!this.isBot) {
        if (this.scene.bot && this.scene.bot.active && this.scene.bot.hp > 0) {
          targets.push(this.scene.bot);
        }
        if (this.scene.creeps) {
          this.scene.creeps.getChildren().forEach(c => {
            if (c.active && c.hp > 0) targets.push(c);
          });
        }
      } else {
        if (this.scene.player && this.scene.player.active && this.scene.player.hp > 0) {
          targets.push(this.scene.player);
        }
      }

      targets.forEach(target => {
        const dist = pointToSegmentDist(target.x, target.y, laserStartX, laserStartY, laserEndX, laserEndY);
        const targetRadius = (target.body && target.body.radius) ? target.body.radius : 16;

        if (dist <= (beamWidth / 2 + targetRadius)) {
          const isCrit = (Math.random() * 100) < (this.critChance || 0);
          let finalDmg = damage;
          if (isCrit) finalDmg *= 1.5;

          const effectiveArmor = Math.max(0, target.armor * (1 - (this.armorPen || 0) / 100));
          const dmgReduction = 100 / (100 + effectiveArmor);
          finalDmg = Math.round(finalDmg * dmgReduction);

          target.takeDamage(finalDmg, isCrit);

          if (this.lifesteal > 0 && finalDmg > 0) {
            const healAmt = Math.round(finalDmg * (this.lifesteal / 100));
            this.heal(healAmt);
          }

          // Hit visual explosion effect
          const hitBurst = this.scene.add.circle(target.x, target.y, 35, 0xffffff);
          hitBurst.setBlendMode('ADD');
          this.scene.tweens.add({
            targets: hitBurst,
            scale: 2.2,
            alpha: 0,
            duration: 300,
            onComplete: () => hitBurst.destroy()
          });
        }
      });
    });
  }
}

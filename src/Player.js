import Phaser from 'phaser';
import BaseCharacter, { getParticleTexture } from './BaseCharacter';
import Projectile from './Projectile';
import { GAME_CONFIG } from './gameConfig';
import { playSkillSFX } from './soundManager';
import { MAP_OBSTACLES } from './mapObstacles';
import { MAP_POLYGONS } from './mapPolygons';
import { isPointInAnyPolygon } from './polygonCollision';
import { showDamageText } from './FloatingDamage';

export default class Player extends BaseCharacter {
  constructor(scene, x, y, isBot = false, color = 0x0088ff, customHeroId = null) {
    let heroId = 'ezreal';
    if (customHeroId) {
      heroId = customHeroId;
    } else if (isBot) {
      heroId = scene.registry.get('selectedBotHero') || 'ezreal';
    } else {
      heroId = scene.registry.get('selectedHero') || 'ezreal';
    }

    const heroData = GAME_CONFIG.CHARACTERS[heroId] || GAME_CONFIG.CHARACTERS.ezreal;

    super(scene, x, y, isBot, isBot ? (heroData.color || 0xff0000) : (color || heroData.color), heroId);

    this.heroId = heroId;
    this.heroData = heroData;
    this.setupHeroTexture(isBot ? (heroData.color || 0xff0000) : heroData.color);

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

    const caps = GAME_CONFIG.STAT_CAPS || { MAX_CDR: 0.60, MAX_ARMOR_PEN: 60, MAX_CRIT_CHANCE: 100, MAX_LIFESTEAL: 60 };

    if (!isBot && scene.registry.has('playerStats')) {
      const stats = scene.registry.get('playerStats');
      this.maxHp += (stats.bonusHP || 0);
      this.hp = this.maxHp;
      this.speed += (stats.bonusSpeed || 0);
      this.armor += (stats.armor || 0);
      this.lifesteal = Math.min(caps.MAX_LIFESTEAL, heroData.baseStats.lifesteal + (stats.lifesteal || 0));
      this.critChance = Math.min(caps.MAX_CRIT_CHANCE, heroData.baseStats.critChance + (stats.critChance || 0));
      this.armorPen = Math.min(caps.MAX_ARMOR_PEN, heroData.baseStats.armorPen + (stats.armorPen || 0));

      const cappedCdr = Math.min(caps.MAX_CDR, stats.cdr || 0);
      const cdrMult = Math.max(1 - caps.MAX_CDR, 1 - cappedCdr);
      Object.values(this.skills).forEach(skill => {
        if (skill.cooldown) skill.cooldown = Math.max(500, Math.round(skill.cooldown * cdrMult));
        if (skill.config && skill.config.damage) skill.config.damage += (stats.bonusDamage || 0);
      });
    } else {
      this.lifesteal = Math.min(caps.MAX_LIFESTEAL, this.lifesteal);
      this.critChance = Math.min(caps.MAX_CRIT_CHANCE, this.critChance);
      this.armorPen = Math.min(caps.MAX_ARMOR_PEN, this.armorPen);
    }

    // Parse Owned Augments
    this.ownedAugments = [];
    if (!isBot && scene.registry.has('augments')) {
      const augs = scene.registry.get('augments') || [];
      this.ownedAugments = augs.map(a => a.id || a);
    }

    this.hasMysticSplit = this.ownedAugments.includes('mysticSplit');
    this.hasArcaneMine = this.ownedAugments.includes('arcaneMine');
    this.hasBulletTime = this.ownedAugments.includes('bulletTime');
    this.hasAdrenaline = this.ownedAugments.includes('adrenaline');
    this.hasStaticShock = this.ownedAugments.includes('staticShock');
    this.hasGlassCannon = this.ownedAugments.includes('glassCannon');
    this.hasBladeFury = this.ownedAugments.includes('bladeFury');
    this.hasGiantSlayer = this.ownedAugments.includes('giantSlayer');
    this.hasVampiricSoul = this.ownedAugments.includes('vampiricSoul');
    this.hasRunicShield = this.ownedAugments.includes('runicShield');

    // Parse Inventory Passives
    const inv = (!isBot && scene.registry.has('inventory')) ? (scene.registry.get('inventory') || []) : [];
    this.hasRylai = inv.some(item => item.id === 'rylai');
    this.hasThornmail = inv.some(item => item.id === 'thornmail');

    if (this.hasGlassCannon) {
      this.maxHp = Math.round(this.maxHp * 0.8);
      this.hp = this.maxHp;
    }

    this.staticShockHits = 0;
    this.adrenalineTriggered = false;
    this.lastBulletTimeTrigger = 0;

    if (!isBot) {
      this.keys = scene.input.keyboard.addKeys('W,A,S,D,SPACE,ONE,TWO,THREE,FOUR,FIVE,SIX,NUMPAD_ONE,NUMPAD_TWO,NUMPAD_THREE,NUMPAD_FOUR,NUMPAD_FIVE,NUMPAD_SIX');

      this.keys.ONE.on('down', () => this.useActiveItemBySlot(0));
      this.keys.NUMPAD_ONE.on('down', () => this.useActiveItemBySlot(0));
      this.keys.TWO.on('down', () => this.useActiveItemBySlot(1));
      this.keys.NUMPAD_TWO.on('down', () => this.useActiveItemBySlot(1));
      this.keys.THREE.on('down', () => this.useActiveItemBySlot(2));
      this.keys.NUMPAD_THREE.on('down', () => this.useActiveItemBySlot(2));
      this.keys.FOUR.on('down', () => this.useActiveItemBySlot(3));
      this.keys.NUMPAD_FOUR.on('down', () => this.useActiveItemBySlot(3));
      this.keys.FIVE.on('down', () => this.useActiveItemBySlot(4));
      this.keys.NUMPAD_FIVE.on('down', () => this.useActiveItemBySlot(4));
      this.keys.SIX.on('down', () => this.useActiveItemBySlot(5));
      this.keys.NUMPAD_SIX.on('down', () => this.useActiveItemBySlot(5));
    }
  }

  addShield(amount, duration = 3000) {
    let finalAmount = amount;
    if (this.hasRunicShield) {
      finalAmount += 150;
      this.applySpeedBoost(1.30, 3000);
      if (this.scene) {
        showDamageText(this.scene, this.x, this.y - 25, 'RUNIC VALOR!', 'heal');
      }
    }
    super.addShield(finalAmount, duration);
  }

  applyDamageToTarget(target, rawDamage, isCrit = false) {
    if (!target || typeof target.takeDamage !== 'function') return;

    let finalDamage = rawDamage;

    // Giant Slayer Augment: Deal +30% bonus damage if target has higher max HP
    if (this.hasGiantSlayer && target.maxHp > this.maxHp) {
      finalDamage = Math.round(finalDamage * 1.30);
    }

    // Apply damage to target
    target.takeDamage(finalDamage, isCrit, this);

    // Rylai's Crystal Scepter Passive: 25% slow for 1.5s
    if (this.hasRylai && typeof target.applySlow === 'function') {
      target.applySlow(0.25, 1500);
    }

    // Vampiric Soul Augment: Heal for 18% of damage dealt
    if (this.hasVampiricSoul && this.hp > 0 && finalDamage > 0) {
      this.heal(Math.round(finalDamage * 0.18));
    }

    // Blade Resonance Augment: Skill hit grants +25% Speed for 4s
    if (this.hasBladeFury && typeof this.applySpeedBoost === 'function') {
      this.applySpeedBoost(1.25, 4000);
    }
  }

  useActiveItemBySlot(slotIdx) {
    if (this.hp <= 0 || this.isStasis || this.isBot) return false;
    const inv = this.scene.registry.get('inventory') || [];
    if (slotIdx >= 0 && slotIdx < inv.length) {
      const item = inv[slotIdx];
      if (item && item.id) {
        return this.useActiveItem(item.id, slotIdx);
      }
    }
    return false;
  }

  useActiveItem(itemId, slotIdx = -1) {
    if (this.hp <= 0 || this.isStasis || this.isBot) return false;
    const inv = this.scene.registry.get('inventory') || [];

    let targetIndex = slotIdx;
    if (targetIndex < 0 || targetIndex >= inv.length || inv[targetIndex].id !== itemId) {
      targetIndex = inv.findIndex(item => item.id === itemId);
    }
    if (targetIndex === -1) return false;

    if (itemId === 'zhonya') {
      if (this.canUseActiveItem('zhonya', 30000)) {
        this.applyStasis(2500);
        return true;
      }
    } else if (itemId === 'qss') {
      if (this.canUseActiveItem('qss', 20000)) {
        this.isRooted = false;
        this.isCharmed = false;
        this.isSlowed = false;
        this.applySpeedBoost(1.35, 2500);
        if (this.scene) {
          showDamageText(this.scene, this.x, this.y - 15, 'CLEANSED!', 'heal');

          // Silver / Cyan Expanding Shockwave Explosion Ring
          const aura = this.scene.add.circle(this.x, this.y, 25, 0x38bdf8, 0.7);
          aura.setStrokeStyle(3, 0xffffff, 1.0);
          this.scene.tweens.add({ targets: aura, scale: 2.5, alpha: 0, duration: 450, onComplete: () => aura.destroy() });

          // Silver sparkle trail under feet during boost
          this.scene.time.addEvent({
            delay: 60,
            callback: () => {
              if (!this.active || this.hp <= 0 || !this.isSpeedBoosted) return;
              const p = this.scene.add.circle(this.x + Phaser.Math.Between(-10, 10), this.y + 12, Phaser.Math.Between(2, 4), 0xe2e8f0, 0.8);
              this.scene.tweens.add({ targets: p, y: p.y - 12, alpha: 0, duration: 300, onComplete: () => p.destroy() });
            },
            repeat: 35
          });
        }
        return true;
      }
    } else if (itemId === 'rocketbelt') {
      if (this.canUseActiveItem('rocketbelt', 20000)) {
        const ptr = this.scene.input.activePointer;
        const angle = Phaser.Math.Angle.Between(this.x, this.y, ptr.worldX, ptr.worldY);

        // Dash Ghost Trail (3 images trailing behind)
        if (this.scene) {
          for (let g = 0; g < 3; g++) {
            this.scene.time.delayedCall(g * 40, () => {
              if (!this.active || this.hp <= 0) return;
              const ghost = this.scene.add.sprite(this.x, this.y, this.texture.key, this.frame.name);
              ghost.setOrigin(this.originX, this.originY);
              ghost.setScale(this.scaleX, this.scaleY);
              ghost.setFlipX(this.flipX);
              ghost.setTint(0xec4899);
              ghost.setAlpha(0.65);
              this.scene.tweens.add({ targets: ghost, alpha: 0, scale: 1.2, duration: 250, onComplete: () => ghost.destroy() });
            });
          }
        }

        // Rocket Dash forward 180px
        const dashDist = 180;
        const targetX = Phaser.Math.Clamp(this.x + Math.cos(angle) * dashDist, 50, 1486);
        const targetY = Phaser.Math.Clamp(this.y + Math.sin(angle) * dashDist, 50, 974);

        this.setPosition(targetX, targetY);
        if (this.body) this.body.reset(targetX, targetY);

        this.applySpeedBoost(1.25, 2000);

        // Fire 5 Hextech rocket spread projectiles
        for (let i = -2; i <= 2; i++) {
          const rocketAngle = angle + (i * 0.15);
          const proj = new Projectile(
            this.scene,
            this.x,
            this.y,
            rocketAngle,
            750,
            110,
            false,
            0xec4899,
            this
          );
          proj.setDisplaySize(16, 16);
          this.scene.playerProjectiles.add(proj);
        }

        if (this.scene) {
          showDamageText(this.scene, this.x, this.y - 15, 'HEX DASH!', 'crit');
          const ring = this.scene.add.circle(this.x, this.y, 40, 0xec4899, 0.7);
          ring.setStrokeStyle(2, 0xffffff);
          this.scene.tweens.add({ targets: ring, scale: 2.2, alpha: 0, duration: 350, onComplete: () => ring.destroy() });
        }
        return true;
      }
    } else if (itemId === 'healthPotion') {
      if (this.canUseActiveItem('healthPotion', 10000)) {
        // Remove 1 potion from inventory
        const potIdx = inv.findIndex(item => item.id === 'healthPotion');
        if (potIdx !== -1) {
          inv.splice(potIdx, 1);
          this.scene.registry.set('inventory', inv);
        }

        showDamageText(this.scene, this.x, this.y - 15, 'HEALTH POTION!', 'heal');

        // Green rising particle bubbles for 5 seconds
        if (this.scene) {
          const potBubbleTimer = this.scene.time.addEvent({
            delay: 100,
            callback: () => {
              if (!this.active || this.hp <= 0) return;
              const px = this.x + Phaser.Math.Between(-16, 16);
              const py = this.y + Phaser.Math.Between(-10, 15);
              const bubble = this.scene.add.circle(px, py, Phaser.Math.Between(2, 4), 0x22c55e, 0.85);
              this.scene.tweens.add({
                targets: bubble,
                y: py - Phaser.Math.Between(25, 45),
                alpha: 0,
                scale: 0.3,
                duration: 600,
                onComplete: () => bubble.destroy()
              });
            },
            repeat: 50
          });
        }

        let ticks = 5;
        const regenTimer = this.scene.time.addEvent({
          delay: 1000,
          callback: () => {
            if (this.active && this.hp > 0) {
              this.heal(50);
              ticks--;
              if (ticks <= 0) regenTimer.remove();
            } else {
              regenTimer.remove();
            }
          },
          loop: true
        });
        return true;
      }
    }
    return false;
  }

  canUseActiveItem(itemId, cooldown = 20000) {
    if (!this.activeCooldowns) this.activeCooldowns = {};
    if (!this.activeCooldownData) this.activeCooldownData = {};

    const now = this.scene.time.now;
    if (now >= (this.activeCooldowns[itemId] || 0)) {
      this.activeCooldowns[itemId] = now + cooldown;
      this.activeCooldownData[itemId] = {
        start: now,
        duration: cooldown,
        end: now + cooldown
      };
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

    let channelTime = (skill.config && skill.config.channelTime) || 0;

    // Riven Q3 Cast Time: 0.5s (500ms) windup for 3rd step of Q combo!
    if (this.heroId === 'riven' && skillKey === 'Q' && (this.rivenQCombo || 0) === 2) {
      channelTime = 500;
    }

    if (skill.type === 'LUX_BEAM') {
      this.executeLuxBeam(skillKey, targetX, targetY, fireAngle);
      return;
    }

    if (channelTime > 0) {
      this.isChanneling = true;
      this.setVelocity(0, 0);
      this.setRotation(0);

      // Charging aura ring at player position
      const auraColor = (this.heroId === 'riven') ? 0x10b981 : (this.heroData.color || 0xffaa00);
      const auraCircle = this.scene.add.circle(this.x, this.y, 45, auraColor, 0.8);
      auraCircle.setStrokeStyle(4, 0xffffff, 1);
      auraCircle.setBlendMode('ADD');

      const auraTween = this.scene.tweens.add({
        targets: auraCircle,
        scale: { start: 0.2, end: 2.4 },
        alpha: { start: 1, end: 0 },
        duration: channelTime,
        ease: 'Linear'
      });

      // Show windup text notification
      if (this.scene) {
        import('./FloatingDamage').then(m => {
          if (m.showDamageText) {
            const label = (this.heroId === 'riven' && skillKey === 'Q') ? 'SLAM WINDUP (0.5s)...' : 'WIND SLASH (0.5s)...';
            m.showDamageText(this.scene, this.x, this.y - 30, label, 'crit');
          }
        }).catch(() => {});
      }

      // Targeting sight line
      const indicator = this.scene.add.graphics();
      const beamLength = (skill.config && skill.config.range) || 360;
      const curEndX = this.x + Math.cos(fireAngle) * beamLength;
      const curEndY = this.y + Math.sin(fireAngle) * beamLength;
      indicator.lineStyle(3, auraColor, 0.85);
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
        } else if (skill.type === 'JINX_SPEED_BUFF') {
          this.executeJinxSpeedBuff(skillKey);
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
      } else if (skill.type === 'JINX_SPEED_BUFF') {
        this.executeJinxSpeedBuff(skillKey);
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
      return time >= ((this.lastRivenQStepTime || 0) + 1000); // Require 1000ms (1s) delay between Q combo steps!
    }

    if (this.heroId === 'zed' && skillKey === 'SPACE') {
      const target = this.isBot ? this.scene.player : this.scene.bot;
      const castRange = (this.skills.SPACE && this.skills.SPACE.config && this.skills.SPACE.config.castRange) || 280;
      if (!target || !target.active || target.hp <= 0) return false;

      const dist = Phaser.Math.Distance.Between(this.x, this.y, target.x, target.y);
      if (dist > castRange) {
        if (!this.isBot && this.scene) {
          import('./FloatingDamage').then(m => {
            if (m.showDamageText) m.showDamageText(this.scene, this.x, this.y - 15, 'OUT OF RANGE', 'shield');
          }).catch(() => {});
        }
        return false; // Out of range! Do NOT cast, do NOT consume cooldown!
      }
    }

    return super.canUseSkill(skillKey, time);
  }

  executeRivenQ(skillKey, targetX, targetY, angle) {
    const skillConfig = this.skills[skillKey].config;
    const damage = skillConfig.damage || 110;

    this.rivenQCombo = (this.rivenQCombo || 0) + 1;
    this.lastRivenQStepTime = this.scene ? this.scene.time.now : Date.now();
    const comboStep = this.rivenQCombo;

    if (this.rivenQTimer) this.rivenQTimer.remove();
    this.rivenQTimer = this.scene.time.delayedCall(3500, () => {
      this.rivenQCombo = 0;
    });

    playSkillSFX(this.scene, 'riven', 'Q', { comboStep });

    // Orient character sprite facing direction & reset rotation
    this.setRotation(0);
    if (Math.abs(Math.cos(angle)) >= Math.abs(Math.sin(angle))) {
      if (Math.cos(angle) < 0) {
        this.setFlipX(false);
        if (this.anims && this.anims.exists('riven_walk_left')) this.play('riven_walk_left', true);
      } else {
        this.setFlipX(false);
        if (this.anims && this.anims.exists('riven_walk_right')) this.play('riven_walk_right', true);
      }
    } else {
      this.setFlipX(false);
      if (Math.sin(angle) < 0) {
        if (this.anims && this.anims.exists('riven_walk_up')) this.play('riven_walk_up', true);
      } else {
        if (this.anims && this.anims.exists('riven_walk_down')) this.play('riven_walk_down', true);
      }
    }

    if (comboStep < 3) {
      this.executeDash(skillKey, targetX, targetY, angle);

      if (this.scene) {
        // Multi-layered Crescent Slash Arc pointing along 'angle'
        const slashG = this.scene.add.graphics();
        slashG.setPosition(this.x, this.y);
        slashG.setRotation(angle);
        slashG.setDepth(15);
        slashG.setBlendMode('ADD');

        // 1. Filled arc sector locally pointing right (0 rad)
        slashG.fillStyle(0x10b981, 0.45);
        slashG.beginPath();
        slashG.moveTo(0, 0);
        slashG.arc(0, 0, 110, -Math.PI / 3, Math.PI / 3, false);
        slashG.closePath();
        slashG.fillPath();

        // 2. Thick Outer Emerald Arc
        slashG.lineStyle(12, 0x10b981, 0.95);
        slashG.beginPath();
        slashG.arc(0, 0, 110, -Math.PI / 3, Math.PI / 3, false);
        slashG.strokePath();

        // 3. Bright Core White Arc
        slashG.lineStyle(5, 0xffffff, 1.0);
        slashG.beginPath();
        slashG.arc(0, 0, 105, -Math.PI / 3.5, Math.PI / 3.5, false);
        slashG.strokePath();

        const dashForwardX = this.x + Math.cos(angle) * 45;
        const dashForwardY = this.y + Math.sin(angle) * 45;

        this.scene.tweens.add({
          targets: slashG,
          x: dashForwardX,
          y: dashForwardY,
          alpha: 0,
          scale: 1.4,
          duration: 250,
          ease: 'Quad.easeOut',
          onComplete: () => slashG.destroy()
        });

        // Slash Particle Burst
        const pTex = getParticleTexture(this.scene);
        const particles = this.scene.add.particles(this.x, this.y, pTex, {
          speed: { min: 180, max: 350 },
          angle: { min: Phaser.Math.RadToDeg(angle) - 45, max: Phaser.Math.RadToDeg(angle) + 45 },
          scale: { start: 0.6, end: 0 },
          tint: [0x10b981, 0x34d399, 0xffffff],
          alpha: { start: 1, end: 0 },
          blendMode: 'ADD',
          lifespan: 250
        });
        particles.explode(12);

        // Micro Camera Shake for impact
        this.scene.cameras.main.shake(100, 0.003);
      }

      this.applyMeleeAreaDamage(this.x, this.y, angle, 120, Math.PI / 3, damage, false);

      if (this.skills && this.skills.Q) {
        const nowTime = this.scene ? this.scene.time.now : Date.now();
        this.skills.Q.lastUsed = nowTime - (this.skills.Q.cooldown - 1000);
      }
    } else {
      this.rivenQCombo = 0;
      if (this.rivenQTimer) this.rivenQTimer.remove();

      this.executeDash(skillKey, targetX, targetY, angle);

      if (this.scene) {
        import('./FloatingDamage').then(m => {
          if (m.showDamageText) m.showDamageText(this.scene, this.x, this.y - 25, 'KNOCKUP SLAM!', 'crit');
        }).catch(() => { });

        // Heavy Ground Slam Shockwave Ring
        const shockwave = this.scene.add.circle(this.x, this.y, 45, 0x10b981, 0.7);
        shockwave.setStrokeStyle(6, 0xffffff, 1);
        shockwave.setBlendMode('ADD');
        this.scene.tweens.add({
          targets: shockwave,
          scale: 3.5,
          alpha: 0,
          duration: 380,
          ease: 'Quad.easeOut',
          onComplete: () => shockwave.destroy()
        });

        // 8 Energy Fissure Spikes outward
        const fissures = this.scene.add.graphics();
        fissures.setPosition(this.x, this.y);
        fissures.lineStyle(4, 0x34d399, 0.95);
        fissures.setBlendMode('ADD');
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
          fissures.beginPath();
          fissures.moveTo(0, 0);
          fissures.lineTo(Math.cos(a) * 110, Math.sin(a) * 110);
          fissures.strokePath();
        }
        this.scene.tweens.add({
          targets: fissures,
          alpha: 0,
          scale: 1.3,
          duration: 350,
          onComplete: () => fissures.destroy()
        });

        // Ground Slam Particles
        const pTex = getParticleTexture(this.scene);
        const particles = this.scene.add.particles(this.x, this.y, pTex, {
          speed: { min: 150, max: 320 },
          scale: { start: 0.8, end: 0 },
          tint: [0x10b981, 0x34d399, 0xffffff],
          alpha: { start: 1, end: 0 },
          blendMode: 'ADD',
          lifespan: 350
        });
        particles.explode(20);

        this.scene.cameras.main.shake(180, 0.008);
      }

      this.applyMeleeRadiusDamage(this.x, this.y, 130, damage * 1.4, true, true);

      if (this.skills && this.skills.Q) {
        this.skills.Q.lastUsed = this.scene.time.now;
      }
    }
  }

  executeRivenE(skillKey, targetX, targetY, angle) {
    const skillConfig = this.skills[skillKey].config;
    if (this.scene) playSkillSFX(this.scene, 'riven', 'E');
    if (this.hasArcaneMine) this.dropArcaneMine(this.x, this.y);
    this.addShield(skillConfig.shieldHp || 220, skillConfig.duration || 2500);
  }

  executeRivenWindSlash(skillKey, targetX, targetY, angle) {
    this.setRotation(0);
    const skillConfig = this.skills[skillKey].config;
    const baseDamage = skillConfig.damage || 480;
    const range = skillConfig.range || 360;

    if (this.scene) {
      // 1. Cast Flash Aura around Riven
      const auraCircle = this.scene.add.circle(this.x, this.y, 50, 0x10b981, 0.8);
      auraCircle.setStrokeStyle(4, 0xffffff, 1);
      auraCircle.setBlendMode('ADD');
      this.scene.tweens.add({
        targets: auraCircle,
        scale: 2.2,
        alpha: 0,
        duration: 300,
        onComplete: () => auraCircle.destroy()
      });

      // 2. Spawn 3 Crescent Energy Waves travelling in a 40° fan
      const waveOffsets = [-0.28, 0, 0.28];
      const waveTexKeys = ['riven_r_wave1', 'riven_r_wave2', 'riven_r_wave3'];
      const startX = this.x;
      const startY = this.y;

      waveOffsets.forEach((offset, idx) => {
        const waveAngle = angle + offset;
        const texKey = waveTexKeys[idx % waveTexKeys.length];

        const destX = startX + Math.cos(waveAngle) * range;
        const destY = startY + Math.sin(waveAngle) * range;

        if (this.scene.textures.exists(texKey)) {
          // Layer 1: Solid crisp core texture (NORMAL blend mode, crystal clear contrast)
          const coreSprite = this.scene.add.sprite(startX, startY, texKey);
          coreSprite.setRotation(waveAngle);
          coreSprite.setDepth(15);
          coreSprite.setBlendMode('NORMAL');
          coreSprite.setScale(0.12);

          // Layer 2: Radiant emerald energy aura (ADD blend mode, glowing rim)
          const glowSprite = this.scene.add.sprite(startX, startY, texKey);
          glowSprite.setRotation(waveAngle);
          glowSprite.setDepth(16);
          glowSprite.setBlendMode('ADD');
          glowSprite.setTint(0x34d399);
          glowSprite.setScale(0.13);

          this.scene.tweens.add({
            targets: [coreSprite, glowSprite],
            x: destX,
            y: destY,
            scaleX: 0.22,
            scaleY: 0.22,
            duration: 420,
            ease: 'Cubic.easeOut'
          });

          this.scene.tweens.add({
            targets: coreSprite,
            alpha: { start: 1.0, end: 0.2 },
            duration: 420,
            ease: 'Cubic.easeOut',
            onComplete: () => coreSprite.destroy()
          });

          this.scene.tweens.add({
            targets: glowSprite,
            alpha: { start: 0.85, end: 0 },
            duration: 420,
            ease: 'Cubic.easeOut',
            onComplete: () => glowSprite.destroy()
          });
        } else {
          // Dynamic graphics fallback if texture doesn't exist
          const waveG = this.scene.add.graphics();
          waveG.setPosition(startX, startY);
          waveG.setRotation(waveAngle);
          waveG.setDepth(15);
          waveG.setBlendMode('ADD');

          waveG.fillStyle(0x10b981, 0.5);
          waveG.beginPath();
          waveG.arc(0, 0, 80, -0.42, 0.42, false);
          waveG.arc(0, 0, 55, 0.42, -0.42, true);
          waveG.closePath();
          waveG.fillPath();

          waveG.lineStyle(9, 0x34d399, 1.0);
          waveG.beginPath();
          waveG.arc(0, 0, 80, -0.42, 0.42, false);
          waveG.strokePath();

          waveG.lineStyle(4, 0xffffff, 1.0);
          waveG.beginPath();
          waveG.arc(0, 0, 76, -0.38, 0.38, false);
          waveG.strokePath();

          this.scene.tweens.add({
            targets: waveG,
            x: destX,
            y: destY,
            scaleX: 1.7,
            scaleY: 1.7,
            alpha: { start: 1, end: 0 },
            duration: 400,
            ease: 'Cubic.easeOut',
            onComplete: () => waveG.destroy()
          });
        }
      });

      // Camera Shake for Ultimate
      this.scene.cameras.main.shake(220, 0.009);
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
          this.applyDamageToTarget(target, damage, isCrit);
        }
      }
    });
  }

  applyMeleeRadiusDamage(originX, originY, radius, damage, isCrit = false, doKnockup = false) {
    const targets = this.getOpponentTargets();
    targets.forEach(target => {
      const dist = Phaser.Math.Distance.Between(originX, originY, target.x, target.y);
      if (dist <= radius) {
        this.applyDamageToTarget(target, damage, isCrit);
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
          this.applyDamageToTarget(target, finalDamage, true);
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
        playSkillSFX(this.scene, 'zed', 'E', { isSwap: true });

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
    const rawShadowX = this.x + Math.cos(angle) * actualDist;
    const rawShadowY = this.y + Math.sin(angle) * actualDist;

    // Shift shadow if inside obstacle to nearest unblocked safe position
    const safePos = this.findNearestUnblockedPosition(rawShadowX, rawShadowY, this.x, this.y);
    const shadowX = safePos.x;
    const shadowY = safePos.y;

    const currentFrame = (this.frame && this.frame.name !== undefined) ? this.frame.name : 0;
    const shadow = this.scene.add.sprite(shadowX, shadowY, this.texture.key, currentFrame);
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
    const castRange = skillConfig.castRange || 280;
    const baseDamage = skillConfig.damage || 250;
    const markDuration = skillConfig.markDuration || 4150;

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

  isPositionBlocked(x, y, margin = 28) {
    if (x < 190 || x > 1230 || y < 130 || y > 880) return true;
    if (isPointInAnyPolygon(x, y, MAP_POLYGONS)) return true;

    for (let j = 0; j < MAP_OBSTACLES.length; j++) {
      const obs = MAP_OBSTACLES[j];
      if (obs.isPassable) continue;

      const left = obs.x - obs.w / 2 - margin;
      const right = obs.x + obs.w / 2 + margin;
      const top = obs.y - obs.h / 2 - margin;
      const bottom = obs.y + obs.h / 2 + margin;

      if (x >= left && x <= right && y >= top && y <= bottom) {
        return true;
      }
    }
    return false;
  }

  findNearestUnblockedPosition(targetX, targetY, startX, startY) {
    if (!this.isPositionBlocked(targetX, targetY)) {
      return { x: targetX, y: targetY };
    }

    const angle = Phaser.Math.Angle.Between(targetX, targetY, startX, startY);
    const maxRetractDist = Phaser.Math.Distance.Between(targetX, targetY, startX, startY);

    for (let r = 8; r <= maxRetractDist; r += 8) {
      const testX = targetX + Math.cos(angle) * r;
      const testY = targetY + Math.sin(angle) * r;
      if (!this.isPositionBlocked(testX, testY)) {
        return { x: testX, y: testY };
      }
    }

    for (let radius = 15; radius <= 150; radius += 15) {
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
        const testX = targetX + Math.cos(a) * radius;
        const testY = targetY + Math.sin(a) * radius;
        if (!this.isPositionBlocked(testX, testY)) {
          return { x: testX, y: testY };
        }
      }
    }

    return { x: startX, y: startY };
  }

  getSafeDashPosition(startX, startY, fireAngle, maxDist) {
    let safeX = Phaser.Math.Clamp(startX, 190, 1230);
    let safeY = Phaser.Math.Clamp(startY, 130, 880);
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

  executeDash(skillKey, targetX, targetY, fireAngle, dashDuration = 120, showTrail = true) {
    const skill = this.skills[skillKey];
    const dashDist = skill.config ? skill.config.dashDistance : (skill.dashDistance || 150);
    const dist = Phaser.Math.Distance.Between(this.x, this.y, targetX, targetY);
    const actualDist = Math.min(dist, dashDist);

    const startX = this.x;
    const startY = this.y;

    if (this.hasArcaneMine) {
      this.dropArcaneMine(startX, startY);
    }

    const safePos = this.getSafeDashPosition(startX, startY, fireAngle, actualDist);
    const endX = safePos.x;
    const endY = safePos.y;

    const isInstant = (this.heroId === 'ezreal');

    if (isInstant || !this.scene) {
      this.x = endX;
      this.y = endY;
      if (this.body) this.body.reset(endX, endY);
    } else {
      this.scene.tweens.add({
        targets: this,
        x: endX,
        y: endY,
        duration: dashDuration,
        ease: 'Cubic.easeOut',
        onUpdate: () => {
          if (this.body) this.body.reset(this.x, this.y);
        },
        onComplete: () => {
          if (this.body) this.body.reset(this.x, this.y);
        }
      });
    }

    const isRivenE = (this.heroId === 'riven' && skillKey === 'E');

    const currentFrame = (this.frame && this.frame.name !== undefined) ? this.frame.name : 0;

    // Create 5 ghost afterimages along the dash path (Disabled for Riven E)
    if (showTrail && !isRivenE) {
      for (let i = 0; i <= 5; i++) {
        const ghostX = Phaser.Math.Linear(startX, endX, i / 5);
        const ghostY = Phaser.Math.Linear(startY, endY, i / 5);

        const ghost = this.scene.add.sprite(ghostX, ghostY, this.texture.key, currentFrame);
        ghost.setRotation(this.rotation);
        ghost.setTint(this.heroData.color || 0x10b981);
        ghost.setBlendMode('ADD');
        ghost.setDepth(12);
        ghost.alpha = 0.75;

        this.scene.tweens.add({
          targets: ghost,
          alpha: 0,
          scale: 1.25,
          duration: 220 + (i * 40),
          onComplete: () => ghost.destroy()
        });
      }
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

  executeJinxSpeedBuff(skillKey) {
    const skillConfig = (this.skills[skillKey] && this.skills[skillKey].config) || {};
    const speedBonus = skillConfig.speedBonus || 60;
    const duration = skillConfig.duration || 4000;

    if (this.isJinxSpeedBuffActive) return;
    this.isJinxSpeedBuffActive = true;
    this.isJinxEnraged = true;

    if (this.hasArcaneMine) this.dropArcaneMine(this.x, this.y);

    this.speed += speedBonus;

    if (this.scene) {
      playSkillSFX(this.scene, 'jinx', 'E');

      import('./FloatingDamage').then(m => {
        if (m.showDamageText) m.showDamageText(this.scene, this.x, this.y - 20, 'GET EXCITED!', 'crit');
      }).catch(() => { });

      // Magenta/Pink speed aura ring following player for 4s (smaller size: radius 18, alpha 0.3)
      const auraCircle = this.scene.add.circle(this.x, this.y, 18, 0xff00ff, 0.3);
      auraCircle.setStrokeStyle(2, 0xffffff, 0.8);
      auraCircle.setBlendMode('ADD');

      const auraTimer = this.scene.time.addEvent({
        delay: 20,
        callback: () => {
          if (auraCircle && auraCircle.active) {
            auraCircle.setPosition(this.x, this.y);
          }
        },
        loop: true
      });

      this.scene.time.delayedCall(duration, () => {
        this.speed = Math.max(150, this.speed - speedBonus);
        this.isJinxSpeedBuffActive = false;
        this.isJinxEnraged = false;
        auraTimer.remove();
        if (auraCircle && auraCircle.active) auraCircle.destroy();
      });
    } else {
      this.scene.time.delayedCall(duration, () => {
        this.speed = Math.max(150, this.speed - speedBonus);
        this.isJinxSpeedBuffActive = false;
        this.isJinxEnraged = false;
      });
    }
  }

  shootSpreadProjectiles(skillKey, angle) {
    const skill = this.skills[skillKey];
    let count = (skill.config && skill.config.count) || 3;
    let spreadAngle = (skill.config && skill.config.spreadAngle) || 0.25;

    // During Jinx E Speed Boost (isJinxEnraged), Q shoots 5 rockets instead of 3!
    if (this.heroId === 'jinx' && this.isJinxEnraged) {
      count = 5;
      spreadAngle = 0.18;
    }

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
    this.setRotation(0);

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

  dropArcaneMine(x, y) {
    if (!this.scene) return;
    const mine = this.scene.add.circle(x, y, 16, 0xef4444, 0.85);
    mine.setStrokeStyle(3, 0xffffff, 1);
    mine.setBlendMode('ADD');
    mine.setDepth(10);

    this.scene.tweens.add({
      targets: mine,
      scale: 1.35,
      duration: 400,
      yoyo: true,
      repeat: -1
    });

    const isBotMine = this.isBot;
    const checkTimer = this.scene.time.addEvent({
      delay: 50,
      callback: () => {
        if (!mine || !mine.active) {
          checkTimer.remove();
          return;
        }

        const enemies = isBotMine ? [this.scene.player] : [this.scene.bot];
        enemies.forEach(target => {
          if (target && target.active && target.hp > 0) {
            const dist = Phaser.Math.Distance.Between(mine.x, mine.y, target.x, target.y);
            if (dist <= 60) {
              checkTimer.remove();
              target.takeDamage(180, true);
              if (this.scene) {
                const exp = this.scene.add.circle(mine.x, mine.y, 60, 0xef4444, 0.8);
                exp.setBlendMode('ADD');
                this.scene.tweens.add({ targets: exp, scale: 2.2, alpha: 0, duration: 300, onComplete: () => exp.destroy() });
                import('./FloatingDamage').then(m => {
                  if (m.showDamageText) m.showDamageText(this.scene, mine.x, mine.y - 20, '180 MINE BOOM!', 'crit');
                }).catch(() => {});
              }
              mine.destroy();
            }
          }
        });
      },
      loop: true
    });

    this.scene.time.delayedCall(5000, () => {
      checkTimer.remove();
      if (mine && mine.active) {
        const exp = this.scene.add.circle(mine.x, mine.y, 35, 0xef4444, 0.5);
        this.scene.tweens.add({ targets: exp, scale: 1.5, alpha: 0, duration: 250, onComplete: () => exp.destroy() });
        mine.destroy();
      }
    });
  }

  triggerBulletTime(time) {
    this.lastBulletTimeTrigger = time;
    const speedBonus = Math.round(this.speed * 0.4);
    this.speed += speedBonus;

    if (this.scene) {
      import('./FloatingDamage').then(m => {
        if (m.showDamageText) m.showDamageText(this.scene, this.x, this.y - 25, 'BULLET TIME! +40% SPEED', 'crit');
      }).catch(() => {});

      const speedAura = this.scene.add.circle(this.x, this.y, 25, 0xfacc15, 0.4);
      speedAura.setStrokeStyle(3, 0xffffff, 1);
      speedAura.setBlendMode('ADD');

      const timer = this.scene.time.addEvent({
        delay: 20,
        callback: () => {
          if (speedAura && speedAura.active) speedAura.setPosition(this.x, this.y);
        },
        loop: true
      });

      this.scene.time.delayedCall(3000, () => {
        this.speed = Math.max(150, this.speed - speedBonus);
        timer.remove();
        if (speedAura && speedAura.active) speedAura.destroy();
      });
    }
  }

  onSkillshotHit(target) {
    if (this.hasStaticShock) {
      this.staticShockHits = (this.staticShockHits || 0) + 1;
      if (this.staticShockHits >= 3) {
        this.staticShockHits = 0;
        this.triggerStaticShockNova();
      }
    }
  }

  triggerStaticShockNova() {
    if (!this.scene) return;
    const enemies = this.isBot ? [this.scene.player] : [this.scene.bot];

    const nova = this.scene.add.circle(this.x, this.y, 30, 0xa855f7, 0.85);
    nova.setStrokeStyle(5, 0xffffff, 1);
    nova.setBlendMode('ADD');
    this.scene.tweens.add({
      targets: nova,
      scale: 4,
      alpha: 0,
      duration: 350,
      onComplete: () => nova.destroy()
    });

    import('./FloatingDamage').then(m => {
      if (m.showDamageText) m.showDamageText(this.scene, this.x, this.y - 25, 'STATIC SHOCK NOVA!', 'crit');
    }).catch(() => {});

    enemies.forEach(target => {
      if (target && target.active && target.hp > 0) {
        const dist = Phaser.Math.Distance.Between(this.x, this.y, target.x, target.y);
        if (dist <= 180) {
          target.takeDamage(120, true);
        }
      }
    });
  }
}

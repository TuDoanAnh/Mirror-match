import Phaser from 'phaser';
import BaseCharacter from './BaseCharacter';
import Projectile from './Projectile';
import { GAME_CONFIG } from './gameConfig';

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
      this.keys = scene.input.keyboard.addKeys('W,A,S,D,SPACE');
    }
  }

  update(time, delta) {
    super.update(time, delta);
    if (this.hp <= 0) return;

    if (!this.isBot) {
      this.handleInput();
      this.handleAim(this.scene.input.activePointer.worldX, this.scene.input.activePointer.worldY);
    }
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

    if (skill.type === 'PROJECTILE') {
      this.shootProjectile(skillKey, fireAngle);
    } else if (skill.type === 'SPREAD_SHOT') {
      this.shootSpreadProjectiles(skillKey, fireAngle);
    } else if (skill.type === 'DASH') {
      this.executeDash(skillKey, targetX, targetY, fireAngle);
    } else if (skill.type === 'SHIELD') {
      this.addShield(skill.config.shieldHp, skill.config.duration);
    } else if (skill.type === 'LUX_BEAM') {
      this.executeLuxBeam(skillKey, targetX, targetY, fireAngle);
    }
  }

  executeDash(skillKey, targetX, targetY, fireAngle) {
    const skill = this.skills[skillKey];
    const dashDist = skill.config ? skill.config.dashDistance : (skill.dashDistance || 150);
    const dist = Phaser.Math.Distance.Between(this.x, this.y, targetX, targetY);
    const actualDist = Math.min(dist, dashDist);
    
    const startX = this.x;
    const startY = this.y;
    
    this.x += Math.cos(fireAngle) * actualDist;
    this.y += Math.sin(fireAngle) * actualDist;

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

      // Multi-layer laser beam graphic
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

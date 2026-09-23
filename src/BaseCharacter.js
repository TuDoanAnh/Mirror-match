import Phaser from 'phaser';
import { GAME_CONFIG } from './gameConfig';
import { showDamageText } from './FloatingDamage';
import { playHitSFX, playCustomSFX, playZedDeathMarkSFX } from './soundManager';

export function getParticleTexture(scene) {
  if (!scene || !scene.textures) return 'proj_particle';
  if (!scene.textures.exists('proj_particle')) {
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xffffff, 1);
    g.fillCircle(8, 8, 8);
    g.generateTexture('proj_particle', 16, 16);
    g.destroy();
  }
  return 'proj_particle';
}

export default class BaseCharacter extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, isBot = false, color = 0x0088ff, heroId = null) {
    super(scene, x, y, '');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.isBot = isBot;
    this.heroId = heroId;

    // Default Base Stats from GAME_CONFIG
    const baseStats = GAME_CONFIG.BASE_STATS || { HP: 1000, SPEED: 200, ARMOR: 0, LIFESTEAL: 0, CRIT_CHANCE: 0, ARMOR_PEN: 0 };
    this.maxHp = baseStats.HP || 1000;
    this.hp = this.maxHp;
    this.shieldHp = 0;
    this.speed = baseStats.SPEED || 200;
    this.aimAngle = 0;

    this.armor = baseStats.ARMOR || 0;
    this.lifesteal = baseStats.LIFESTEAL || 0;
    this.critChance = baseStats.CRIT_CHANCE || 0;
    this.armorPen = baseStats.ARMOR_PEN || 0;

    // Skills definition (Q, E, SPACE)
    this.skills = {};

    this.setDepth(10);

    // Character Drop Shadow under feet
    this.shadow = scene.add.ellipse(x, y + 18, 30, 12, 0x000000, 0.45);
    this.shadow.setDepth(4);

    // Glowing Hero Base Ring Indicator
    if (['ezreal', 'lux', 'jinx', 'riven', 'zed'].includes(this.heroId)) {
      const ringColor = this.isBot ? 0xff2255 : (this.heroId === 'riven' ? 0x10b981 : (this.heroId === 'zed' ? 0xef4444 : 0x00e5ff));
      this.baseRing = scene.add.ellipse(x, y + 18, 34, 14);
      this.baseRing.setStrokeStyle(2, ringColor, 0.85);
      this.baseRing.setDepth(5);

      scene.tweens.add({
        targets: this.baseRing,
        alpha: { start: 0.85, end: 0.35 },
        scaleX: { start: 1.0, end: 1.08 },
        scaleY: { start: 1.0, end: 1.08 },
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    // HP Bar
    this.hpBar = scene.add.graphics();
    this.hpBar.setDepth(15);
    this.updateHpBar();

    // Reference to projectile group
    this.projectileGroup = isBot ? scene.enemyProjectiles : scene.playerProjectiles;
  }

  update(time, delta) {
    if (this.hp <= 0) return;

    // Follow Character Position for Shadow & Base Ring
    if (this.shadow) {
      this.shadow.setPosition(this.x, this.y + 18);
    }
    if (this.baseRing) {
      this.baseRing.setPosition(this.x, this.y + 18);
    }

    // HP Bar Follow
    if (this.hpBar) {
      this.hpBar.x = this.x - 25;
      this.hpBar.y = this.y - 30;
    }

    this.updateAnimation();
  }

  setupHeroTexture(color = 0x0088ff) {
    let sheetKey = `${this.heroId}_spritesheet`;
    if (!this.scene.textures.exists(sheetKey)) {
      sheetKey = (this.heroId === 'riven') ? 'ezreal_spritesheet' : 'lux_spritesheet';
    }

    if (this.scene.textures.exists(sheetKey)) {
      this.setTexture(sheetKey, this.heroId === 'ezreal' ? 4 : 0);
      this.setOrigin(0.5, 0.6);
      if (this.heroId === 'ezreal') {
        this.setScale(0.36);
        this.body.setCircle(45, 28, 57);
      } else {
        this.setScale(1.1);
        this.body.setCircle(16, 8, 12);
      }
      this.clearTint();

      const animPrefix = ['ezreal', 'lux', 'jinx', 'riven', 'zed'].includes(this.heroId) ? this.heroId : 'ezreal';
      const idleKey = `${animPrefix}_idle`;
      if (this.scene.anims && this.scene.anims.exists(idleKey)) {
        this.play(idleKey);
      }
    }
  }

  updateAnimation() {
    if (!this.active || this.hp <= 0) return;
    if (this.isHurtAnimating) return;

    const animPrefix = ['ezreal', 'lux', 'jinx', 'riven', 'zed'].includes(this.heroId) ? this.heroId : 'ezreal';
    const vx = this.body ? this.body.velocity.x : 0;
    const vy = this.body ? this.body.velocity.y : 0;
    const currentSpeed = Math.sqrt(vx * vx + vy * vy);

    const needsFlipRight = ['lux', 'jinx'].includes(animPrefix);

    if (currentSpeed > 10) {
      const baseSpeed = this.speed || 200;
      const animScale = Math.min(2.8, Math.max(0.6, currentSpeed / baseSpeed));
      if (this.anims) {
        this.anims.timeScale = animScale;
      }

      if (Math.abs(vx) >= Math.abs(vy)) {
        if (vx < 0) {
          this.setFlipX(false);
          if (this.anims.currentAnim?.key !== `${animPrefix}_walk_left`) {
            this.play(`${animPrefix}_walk_left`, true);
          }
        } else {
          this.setFlipX(needsFlipRight);
          if (this.anims.currentAnim?.key !== `${animPrefix}_walk_right`) {
            this.play(`${animPrefix}_walk_right`, true);
          }
        }
      } else {
        this.setFlipX(false);
        if (vy < 0) {
          if (this.anims.currentAnim?.key !== `${animPrefix}_walk_up`) {
            this.play(`${animPrefix}_walk_up`, true);
          }
        } else {
          if (this.anims.currentAnim?.key !== `${animPrefix}_walk_down`) {
            this.play(`${animPrefix}_walk_down`, true);
          }
        }
      }
    } else {
      this.setFlipX(false);
      if (this.anims) {
        this.anims.timeScale = 1.0;
      }
      if (this.anims.currentAnim?.key !== `${animPrefix}_idle`) {
        this.play(`${animPrefix}_idle`, true);
      }
    }
  }

  handleAim(targetX, targetY) {
    if (this.isChanneling) return;
    this.aimAngle = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);
    this.setRotation(0);
  }

  canUseSkill(skillKey, time) {
    if (this.isChanneling) return false;
    if (!this.skills[skillKey]) return false;
    return time >= this.skills[skillKey].lastUsed + this.skills[skillKey].cooldown;
  }

  useSkill(skillKey, time, targetX, targetY) {
    if (!this.canUseSkill(skillKey, time)) return false;

    this.skills[skillKey].lastUsed = time;

    const fireAngle = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);
    this.setRotation(0);

    if (skillKey === 'Q') {
      this.executeQ(targetX, targetY, fireAngle);
    } else if (skillKey === 'E') {
      this.executeE(targetX, targetY, fireAngle);
    } else if (skillKey === 'SPACE') {
      this.executeSpace(targetX, targetY, fireAngle);
    }

    return true;
  }

  executeQ(targetX, targetY, fireAngle) { }
  executeE(targetX, targetY, fireAngle) { }
  executeSpace(targetX, targetY, fireAngle) { }

  addShield(amount, duration = 3000) {
    this.shieldHp = (this.shieldHp || 0) + amount;
    this.updateHpBar();

    if (amount > 0 && this.scene) {
      showDamageText(this.scene, this.x, this.y - 15, `${amount} SHIELD`, 'shield');
    }

    // Visual Shield Pulse Ring
    const shieldRing = this.scene.add.circle(this.x, this.y, 24);
    shieldRing.setStrokeStyle(3, 0xffff00);
    this.scene.tweens.add({
      targets: shieldRing,
      scale: 1.8,
      alpha: 0,
      duration: 400,
      onComplete: () => shieldRing.destroy()
    });

    if (this.shieldTimer) this.shieldTimer.remove();
    this.shieldTimer = this.scene.time.delayedCall(duration, () => {
      this.shieldHp = 0;
      this.updateHpBar();
    });
  }

  applyKnockup(duration = 600) {
    if (this.isStasis || this.hp <= 0) return;
    this.isRooted = true;
    this.setVelocity(0, 0);

    if (this.scene) {
      showDamageText(this.scene, this.x, this.y - 15, 'KNOCKED UP!', 'crit');
    }

    const startY = this.y;
    this.scene.tweens.add({
      targets: this,
      y: startY - 24,
      duration: duration / 2,
      yoyo: true,
      ease: 'Quad.easeOut',
      onComplete: () => {
        if (this.body) this.body.reset(this.x, startY);
      }
    });

    if (this.rootTimer) this.rootTimer.remove();
    this.rootTimer = this.scene.time.delayedCall(duration, () => {
      this.isRooted = false;
    });
  }

  applyRoot(duration = 1000) {
    if (this.isStasis || this.hp <= 0) return;
    this.isRooted = true;
    this.setVelocity(0, 0);

    if (this.scene) {
      showDamageText(this.scene, this.x, this.y - 15, 'ROOTED', 'root');
    }

    // Visual Light Binding Root Snare Effect
    let rootEffect;
    if (this.scene.textures.exists('lux_root_skill')) {
      rootEffect = this.scene.add.sprite(this.x, this.y, 'lux_root_skill');
      rootEffect.setDepth(15);
      rootEffect.setScale(0.55);
      if (this.scene.anims.exists('lux_root_anim')) {
        rootEffect.play('lux_root_anim');
      }
    } else {
      rootEffect = this.scene.add.circle(this.x, this.y, 22);
      rootEffect.setStrokeStyle(3, 0xffff00, 0.9);
      rootEffect.setDepth(15);
    }

    const updatePosition = () => {
      if (rootEffect && rootEffect.active) {
        rootEffect.setPosition(this.x, this.y);
      }
    };

    const ringTimer = this.scene.time.addEvent({
      delay: 20,
      callback: updatePosition,
      loop: true
    });

    if (this.rootTimer) this.rootTimer.remove();
    this.rootTimer = this.scene.time.delayedCall(duration, () => {
      this.isRooted = false;
      ringTimer.remove();
      if (rootEffect && rootEffect.active) rootEffect.destroy();
    });
  }

  applyCharm(duration = 1200, charmer = null) {
    if (this.isStasis || this.hp <= 0) return;
    this.isCharmed = true;
    this.charmerTarget = charmer;

    if (this.scene) {
      showDamageText(this.scene, this.x, this.y - 15, 'CHARMED', 'root');
    }

    const heartIcon = this.scene.add.text(this.x, this.y - 45, '💖', { fontSize: '20px' }).setOrigin(0.5).setDepth(20);

    const updateTimer = this.scene.time.addEvent({
      delay: 20,
      callback: () => {
        if (!this.active || !this.isCharmed) return;
        if (heartIcon && heartIcon.active) heartIcon.setPosition(this.x, this.y - 45);
        if (this.charmerTarget && this.charmerTarget.active) {
          const angle = Phaser.Math.Angle.Between(this.x, this.y, this.charmerTarget.x, this.charmerTarget.y);
          this.setVelocity(Math.cos(angle) * (this.speed * 0.55), Math.sin(angle) * (this.speed * 0.55));
        }
      },
      loop: true
    });

    if (this.charmTimer) this.charmTimer.remove();
    this.charmTimer = this.scene.time.delayedCall(duration, () => {
      this.isCharmed = false;
      this.charmerTarget = null;
      updateTimer.remove();
      if (heartIcon && heartIcon.active) heartIcon.destroy();
    });
  }

  applyStasis(duration = 2500) {
    if (this.hp <= 0) return;
    this.isStasis = true;
    this.setVelocity(0, 0);

    this.setTint(0xfacc15); // Gold Stasis tint
    if (this.scene) {
      showDamageText(this.scene, this.x, this.y - 15, 'GOLDEN STASIS', 'shield');

      const aura = this.scene.add.circle(this.x, this.y, 28, 0xfacc15, 0.4);
      aura.setStrokeStyle(3, 0xffffff, 0.9);

      // Floating golden sparkles particle effect
      const particleTimer = this.scene.time.addEvent({
        delay: 80,
        callback: () => {
          if (!this.active || !this.isStasis) return;
          const px = this.x + Phaser.Math.Between(-20, 20);
          const py = this.y + Phaser.Math.Between(-15, 20);
          const spark = this.scene.add.circle(px, py, Phaser.Math.Between(2, 4), 0xfef08a, 0.9);
          this.scene.tweens.add({
            targets: spark,
            y: py - Phaser.Math.Between(20, 40),
            alpha: 0,
            scale: 0.2,
            duration: 500,
            onComplete: () => spark.destroy()
          });
        },
        loop: true
      });

      const updateTimer = this.scene.time.addEvent({
        delay: 20,
        callback: () => {
          if (aura && aura.active) aura.setPosition(this.x, this.y);
        },
        loop: true
      });

      this.scene.time.delayedCall(duration, () => {
        this.isStasis = false;
        if (this.active) this.clearTint();
        if (aura && aura.active) aura.destroy();
        particleTimer.remove();
        updateTimer.remove();
      });
    }
  }

  heal(amount) {
    if (this.hp <= 0) return;
    const actualHeal = Math.min(amount, this.maxHp - this.hp);
    if (actualHeal <= 0) return;
    this.hp += actualHeal;
    this.updateHpBar();

    if (this.scene) {
      showDamageText(this.scene, this.x, this.y - 20, `+${actualHeal}`, 'heal');
      const healRing = this.scene.add.circle(this.x, this.y, 20);
      healRing.setStrokeStyle(2, 0x34d399, 0.9);
      this.scene.tweens.add({
        targets: healRing,
        scale: 1.6,
        alpha: 0,
        duration: 400,
        onComplete: () => healRing.destroy()
      });
    }
  }

  applySpeedBoost(multiplier = 1.30, duration = 3000) {
    if (this.hp <= 0) return;
    if (this.isSpeedBoosted) return;
    this.isSpeedBoosted = true;
    const originalSpeed = this.speed;
    this.speed = Math.round(originalSpeed * multiplier);

    if (this.scene) {
      showDamageText(this.scene, this.x, this.y - 15, 'SPEED BOOST!', 'heal');
    }

    if (this.speedBoostTimer) this.speedBoostTimer.remove();
    this.speedBoostTimer = this.scene.time.delayedCall(duration, () => {
      this.speed = originalSpeed;
      this.isSpeedBoosted = false;
    });
  }

  applySlow(slowPercent = 0.25, duration = 1500) {
    if (this.isStasis || this.hp <= 0) return;
    if (this.isSlowed) return;
    this.isSlowed = true;
    const originalSpeed = this.speed;
    this.speed = Math.round(originalSpeed * (1 - slowPercent));

    if (this.scene) {
      showDamageText(this.scene, this.x, this.y - 15, 'SLOWED!', 'root');
    }

    const icyRing = this.scene.add.circle(this.x, this.y, 22, 0x0284c7, 0.4);
    icyRing.setStrokeStyle(2, 0x38bdf8, 0.9);

    const updateTimer = this.scene.time.addEvent({
      delay: 20,
      callback: () => {
        if (icyRing && icyRing.active) icyRing.setPosition(this.x, this.y);
      },
      loop: true
    });

    if (this.slowTimer) this.slowTimer.remove();
    this.slowTimer = this.scene.time.delayedCall(duration, () => {
      this.speed = originalSpeed;
      this.isSlowed = false;
      updateTimer.remove();
      if (icyRing && icyRing.active) icyRing.destroy();
    });
  }

  applyDeathMark(baseDamage = 250, duration = 4150) {
    if (this.isStasis || this.hp <= 0) return;
    this.isDeathMarked = true;
    this.deathMarkBaseDamage = baseDamage;
    this.deathMarkStoredDamage = 0;

    if (this.deathMarkSFX && this.deathMarkSFX.isPlaying) {
      this.deathMarkSFX.stop();
    }

    if (this.scene) {
      this.deathMarkSFX = playZedDeathMarkSFX(this.scene, 5125);
      showDamageText(this.scene, this.x, this.y - 15, 'DEATH MARKED', 'crit');
    }

    const markIcon = this.scene.add.text(this.x, this.y - 45, '❌', { fontSize: '24px', fill: '#ff0000' }).setOrigin(0.5).setDepth(20);
    this.scene.tweens.add({
      targets: markIcon,
      scale: 1.4,
      duration: 350,
      yoyo: true,
      repeat: -1
    });

    const updateTimer = this.scene.time.addEvent({
      delay: 20,
      callback: () => {
        if (markIcon && markIcon.active) markIcon.setPosition(this.x, this.y - 45);
      },
      loop: true
    });

    if (this.deathMarkTimer) this.deathMarkTimer.remove();
    this.deathMarkTimer = this.scene.time.delayedCall(duration, () => {
      updateTimer.remove();
      if (markIcon && markIcon.active) markIcon.destroy();

      if (this.active && this.hp > 0 && !this.isStasis && this.isDeathMarked) {
        const bonusDmg = Math.round((this.deathMarkStoredDamage || 0) * 0.35);
        const totalDetonation = this.deathMarkBaseDamage + bonusDmg;

        this.isDeathMarked = false;
        this.takeDamage(totalDetonation, true);

        if (this.scene) {
          showDamageText(this.scene, this.x, this.y - 25, `${totalDetonation} DETONATED!`, 'crit');
          const exp = this.scene.add.circle(this.x, this.y, 45, 0xff0000, 0.7);
          this.scene.tweens.add({ targets: exp, scale: 2.2, alpha: 0, duration: 400, onComplete: () => exp.destroy() });
        }
      } else {
        this.isDeathMarked = false;
      }
    });
  }

  takeDamage(amount, isCrit = false) {
    if (this.isStasis) return; // Completely invulnerable during Zhonya Golden Stasis!

    let remainingDamage = amount;

    // Track stored damage dealt during Death Mark duration for detonation bonus
    if (this.isDeathMarked && remainingDamage > 0) {
      this.deathMarkStoredDamage = (this.deathMarkStoredDamage || 0) + remainingDamage;
    }

    // Absorb into shield first if active
    if (this.shieldHp > 0) {
      if (this.shieldHp >= remainingDamage) {
        this.shieldHp -= remainingDamage;
        remainingDamage = 0;
      } else {
        remainingDamage -= this.shieldHp;
        this.shieldHp = 0;
      }
    }

    this.hp = Math.max(0, this.hp - remainingDamage);
    this.updateHpBar();

    // Adrenaline Rush Augment: HP < 25% resets cooldowns + 300 shield
    if (this.hasAdrenaline && !this.adrenalineTriggered && this.hp > 0 && this.hp <= this.maxHp * 0.25) {
      this.adrenalineTriggered = true;
      if (this.skills) {
        Object.keys(this.skills).forEach(k => {
          this.skills[k].lastUsed = -999999;
        });
      }
      this.addShield(300, 5000);
      if (this.scene) {
        showDamageText(this.scene, this.x, this.y - 30, 'ADRENALINE RUSH!', 'crit');
        const flash = this.scene.add.circle(this.x, this.y, 45, 0xec4899, 0.8);
        flash.setBlendMode('ADD');
        this.scene.tweens.add({ targets: flash, scale: 2.5, alpha: 0, duration: 400, onComplete: () => flash.destroy() });
      }
    }

    if (amount > 0 && this.scene) {
      playHitSFX(this.scene, this.heroId);
      showDamageText(this.scene, this.x, this.y - 15, amount, isCrit ? 'crit' : 'normal');
    }

    this.setTint(isCrit ? 0xffa500 : 0xff0000);
    this.scene.time.delayedCall(150, () => {
      if (this.active) this.clearTint();
    });

    const hurtKey = `${this.heroId}_hurt`;
    if (['ezreal', 'lux', 'jinx', 'riven', 'zed'].includes(this.heroId) && this.scene.anims && this.scene.anims.exists(hurtKey)) {
      this.isHurtAnimating = true;
      this.play(hurtKey);
      this.once(`animationcomplete-${hurtKey}`, () => {
        this.isHurtAnimating = false;
      });
    }

    if (this.hp <= 0) {
      this.die();
    }
  }

  heal(amount) {
    if (this.hp <= 0) return;
    this.hp = Math.min(this.maxHp, this.hp + amount);
    this.updateHpBar();

    if (amount > 0 && this.scene) {
      showDamageText(this.scene, this.x, this.y - 15, amount, 'heal');
    }

    this.setTint(0x00ff00);
    this.scene.time.delayedCall(150, () => {
      if (this.active) this.clearTint();
    });
  }

  updateHpBar() {
    if (!this.hpBar) return;
    this.hpBar.clear();

    const barW = 52;
    const barH = 8;
    const radius = 4;

    // Dark Rounded Background Container with Border
    this.hpBar.fillStyle(0x0f172a, 0.85);
    this.hpBar.fillRoundedRect(0, 0, barW, barH, radius);
    this.hpBar.lineStyle(1, 0x334155, 0.9);
    this.hpBar.strokeRoundedRect(0, 0, barW, barH, radius);

    // HP Fill (Light softer red for bot, vibrant green for player)
    const fillPercent = Math.max(0, Math.min(1, this.hp / this.maxHp));
    if (fillPercent > 0) {
      const hpColor = this.isBot ? 0xff4d4d : 0x34d399; // Softer light red vs vibrant green
      const fillW = Math.max(4, (barW - 2) * fillPercent);
      this.hpBar.fillStyle(hpColor, 1);
      this.hpBar.fillRoundedRect(1, 1, fillW, barH - 2, Math.min(3, fillW / 2));
    }

    // Shield Overlay Fill
    if (this.shieldHp > 0) {
      const shieldPercent = Math.min(1, this.shieldHp / this.maxHp);
      const shieldW = Math.max(4, (barW - 2) * shieldPercent);
      this.hpBar.fillStyle(0xfacc15, 0.95);
      this.hpBar.fillRoundedRect(1, 1, shieldW, barH - 2, Math.min(3, shieldW / 2));
    }
  }

  die() {
    if (this.shadow) this.shadow.destroy();
    if (this.baseRing) this.baseRing.destroy();
    if (this.hpBar) this.hpBar.destroy();
    this.disableBody(true, true);

    // Shockwave ring
    const ring = this.scene.add.circle(this.x, this.y, 16);
    ring.setStrokeStyle(4, this.isBot ? 0xff0000 : 0x0088ff);
    this.scene.tweens.add({
      targets: ring,
      scale: 6,
      alpha: 0,
      duration: 500,
      ease: 'Quad.easeOut',
      onComplete: () => ring.destroy()
    });

    const pTex = getParticleTexture(this.scene);
    const particles = this.scene.add.particles(this.x, this.y, pTex, {
      speed: { min: 100, max: 300 },
      scale: { start: 1, end: 0 },
      blendMode: 'ADD',
      lifespan: 500,
      alpha: { start: 1, end: 0 }
    });
    particles.explode(15);
  }

  destroy(fromScene) {
    this.isRooted = false;
    if (this.shadow) {
      this.shadow.destroy();
      this.shadow = null;
    }
    if (this.baseRing) {
      this.baseRing.destroy();
      this.baseRing = null;
    }
    if (this.hpBar) {
      this.hpBar.destroy();
      this.hpBar = null;
    }
    if (this.shieldTimer) {
      this.shieldTimer.remove();
      this.shieldTimer = null;
    }
    if (this.rootTimer) {
      this.rootTimer.remove();
      this.rootTimer = null;
    }
    super.destroy(fromScene);
  }
}

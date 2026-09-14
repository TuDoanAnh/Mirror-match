import Phaser from 'phaser';
import { GAME_CONFIG } from './gameConfig';
import { showDamageText } from './FloatingDamage';
import { playHitSFX, playCustomSFX, playZedDeathMarkSFX } from './soundManager';

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
    if (['ezreal', 'lux', 'jinx', 'riven'].includes(this.heroId)) {
      const ringColor = this.isBot ? 0xff2255 : (this.heroId === 'riven' ? 0x10b981 : 0x00e5ff);
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
    if (['ezreal', 'lux', 'jinx'].includes(this.heroId)) {
      const sheetKey = `${this.heroId}_spritesheet`;
      if (this.scene.textures.exists(sheetKey)) {
        this.setTexture(sheetKey, 0);
      }
      this.setOrigin(0.5, 0.6);
      this.body.setCircle(16, 8, 12);
      this.setScale(1.1);
      const idleKey = `${this.heroId}_idle`;
      if (this.scene.anims && this.scene.anims.exists(idleKey)) {
        this.play(idleKey);
      }
    } else {
      const texKey = this.isBot ? 'bot_tex' : `player_tex_${color}`;
      if (!this.scene.textures.exists(texKey)) {
        const graphics = this.scene.make.graphics({ x: 0, y: 0, add: false });
        graphics.fillStyle(this.isBot ? 0xff0000 : color, 1);
        graphics.lineStyle(2, 0xffffff, 1);
        graphics.beginPath();
        graphics.moveTo(32, 16);
        graphics.lineTo(0, 32);
        graphics.lineTo(8, 16);
        graphics.lineTo(0, 0);
        graphics.closePath();
        graphics.fillPath();
        graphics.strokePath();

        graphics.fillStyle(this.isBot ? 0xff5555 : 0x00ffff, 1);
        graphics.fillCircle(6, 16, 4);

        graphics.generateTexture(texKey, 32, 32);
        graphics.destroy();
      }

      this.setTexture(texKey);
      this.setOrigin(0.5, 0.5);
      this.body.setCircle(16);
    }
  }

  updateAnimation() {
    if (!['ezreal', 'lux', 'jinx', 'creep'].includes(this.heroId) || !this.active || this.hp <= 0) return;
    if (this.isHurtAnimating) return;

    const prefix = this.heroId;
    const vx = this.body ? this.body.velocity.x : 0;
    const vy = this.body ? this.body.velocity.y : 0;
    const currentSpeed = Math.sqrt(vx * vx + vy * vy);

    // Heroes whose walk_right frames face left in the raw PNG require flipX(true) when moving right
    const needsFlipRight = ['lux', 'jinx'].includes(prefix);

    if (currentSpeed > 10) {
      // Dynamically scale animation playback speed with movement speed
      const baseSpeed = this.speed || 200;
      const animScale = Math.min(2.8, Math.max(0.6, currentSpeed / baseSpeed));
      if (this.anims) {
        this.anims.timeScale = animScale;
      }

      if (Math.abs(vx) >= Math.abs(vy)) {
        if (vx < 0) {
          this.setFlipX(false);
          if (this.anims.currentAnim?.key !== `${prefix}_walk_left`) {
            this.play(`${prefix}_walk_left`, true);
          }
        } else {
          this.setFlipX(needsFlipRight);
          if (this.anims.currentAnim?.key !== `${prefix}_walk_right`) {
            this.play(`${prefix}_walk_right`, true);
          }
        }
      } else {
        this.setFlipX(false);
        if (vy < 0) {
          if (this.anims.currentAnim?.key !== `${prefix}_walk_up`) {
            this.play(`${prefix}_walk_up`, true);
          }
        } else {
          if (this.anims.currentAnim?.key !== `${prefix}_walk_down`) {
            this.play(`${prefix}_walk_down`, true);
          }
        }
      }
    } else {
      this.setFlipX(false);
      if (this.anims) {
        this.anims.timeScale = 1.0;
      }
      if (this.anims.currentAnim?.key !== `${prefix}_idle`) {
        this.play(`${prefix}_idle`, true);
      }
    }
  }

  handleAim(targetX, targetY) {
    if (this.isChanneling) return;
    this.aimAngle = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);
    // Animated top-down characters keep 0 rotation (use directional animations)
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
    if (!['ezreal', 'lux', 'jinx'].includes(this.heroId)) {
      this.setRotation(fireAngle);
    }

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

  applyStasis(duration = 2000) {
    if (this.hp <= 0) return;
    this.isStasis = true;
    this.setVelocity(0, 0);

    this.setTint(0xffd700); // Gold Stasis tint
    if (this.scene) {
      showDamageText(this.scene, this.x, this.y - 15, 'GOLDEN STASIS', 'shield');
    }

    const aura = this.scene.add.circle(this.x, this.y, 26, 0xffd700, 0.4);
    aura.setStrokeStyle(3, 0xffffff);

    this.scene.time.delayedCall(duration, () => {
      this.isStasis = false;
      if (this.active) this.clearTint();
      if (aura && aura.active) aura.destroy();
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
    if (['ezreal', 'lux', 'jinx'].includes(this.heroId) && this.scene.anims && this.scene.anims.exists(hurtKey)) {
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

    const particles = this.scene.add.particles(this.x, this.y, this.texture.key, {
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

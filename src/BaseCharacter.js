import Phaser from 'phaser';
import { GAME_CONFIG } from './gameConfig';

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

    this.setupHeroTexture(color);
    this.setCollideWorldBounds(true);

    // HP Bar
    this.hpBar = scene.add.graphics();
    this.updateHpBar();

    // Reference to projectile group
    this.projectileGroup = isBot ? scene.enemyProjectiles : scene.playerProjectiles;
  }

  update(time, delta) {
    if (this.hp <= 0) return;

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
    if (!['ezreal', 'lux', 'jinx'].includes(this.heroId) || !this.active || this.hp <= 0) return;
    if (this.isHurtAnimating) return;

    const prefix = this.heroId;
    const vx = this.body ? this.body.velocity.x : 0;
    const vy = this.body ? this.body.velocity.y : 0;
    const currentSpeed = Math.sqrt(vx * vx + vy * vy);

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
          // If hero/creep has dedicated walk_right animation, do not flipX
          if (this.heroId === 'creep' || this.anims.exists(`${prefix}_walk_right`)) {
            this.setFlipX(false);
          } else {
            this.setFlipX(true);
          }
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

  executeQ(targetX, targetY, fireAngle) {}
  executeE(targetX, targetY, fireAngle) {}
  executeSpace(targetX, targetY, fireAngle) {}

  addShield(amount, duration = 3000) {
    this.shieldHp = (this.shieldHp || 0) + amount;
    this.updateHpBar();

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

  applyRoot(duration = 1000) {
    this.isRooted = true;
    this.setVelocity(0, 0);

    // Visual Binding Ring Effect
    const rootRing = this.scene.add.circle(this.x, this.y, 22);
    rootRing.setStrokeStyle(3, 0xffff00, 0.9);
    rootRing.setDepth(15);
    
    const pulseTween = this.scene.tweens.add({
      targets: rootRing,
      scale: 1.25,
      alpha: 0.6,
      duration: 250,
      repeat: -1,
      yoyo: true
    });

    const updateRing = () => {
      if (rootRing && rootRing.active) {
        rootRing.setPosition(this.x, this.y);
      }
    };

    const ringTimer = this.scene.time.addEvent({
      delay: 20,
      callback: updateRing,
      loop: true
    });

    if (this.rootTimer) this.rootTimer.remove();
    this.rootTimer = this.scene.time.delayedCall(duration, () => {
      this.isRooted = false;
      ringTimer.remove();
      pulseTween.stop();
      if (rootRing && rootRing.active) rootRing.destroy();
    });
  }

  takeDamage(amount, isCrit = false) {
    let remainingDamage = amount;

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

    this.setTint(isCrit ? 0xffa500 : 0xff0000); 
    this.scene.time.delayedCall(150, () => {
      if(this.active) this.clearTint();
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
    
    this.setTint(0x00ff00);
    this.scene.time.delayedCall(150, () => {
      if(this.active) this.clearTint();
    });
  }

  updateHpBar() {
    if (!this.hpBar) return;
    this.hpBar.clear();

    // Background bar
    this.hpBar.fillStyle(0x000000, 0.8);
    this.hpBar.fillRect(0, 0, 50, 6);

    // HP Fill
    const fillPercent = Math.max(0, this.hp / this.maxHp);
    this.hpBar.fillStyle(this.isBot ? 0xff0000 : 0x00ff00, 1);
    this.hpBar.fillRect(1, 1, 48 * fillPercent, 4);

    // Shield Overlay Fill
    if (this.shieldHp > 0) {
      const shieldPercent = Math.min(1, this.shieldHp / this.maxHp);
      this.hpBar.fillStyle(0xffff00, 0.9);
      this.hpBar.fillRect(1, 1, 48 * shieldPercent, 4);
    }
  }

  die() {
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

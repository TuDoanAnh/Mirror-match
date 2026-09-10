import Phaser from 'phaser';
import { GAME_CONFIG } from './gameConfig';

export default class BaseCharacter extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, isBot = false, color = 0x0088ff) {
    super(scene, x, y, ''); 

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.isBot = isBot;
    
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

    // Generate Texture
    const texKey = isBot ? 'bot_tex' : `player_tex_${color}`;
    if (!scene.textures.exists(texKey)) {
      const graphics = scene.make.graphics({ x: 0, y: 0, add: false });
      // Draw a sleek sci-fi ship pointing right
      graphics.fillStyle(isBot ? 0xff0000 : color, 1);
      graphics.lineStyle(2, 0xffffff, 1);
      graphics.beginPath();
      graphics.moveTo(32, 16); // Nose
      graphics.lineTo(0, 32);  // Bottom wing
      graphics.lineTo(8, 16);  // Back engine indent
      graphics.lineTo(0, 0);   // Top wing
      graphics.closePath();
      graphics.fillPath();
      graphics.strokePath();
      
      // Engine glow
      graphics.fillStyle(isBot ? 0xff5555 : 0x00ffff, 1);
      graphics.fillCircle(6, 16, 4);
      
      graphics.generateTexture(texKey, 32, 32);
      graphics.destroy();
    }

    this.setTexture(texKey);
    this.setOrigin(0.5, 0.5);
    this.body.setCircle(16);
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
    this.hpBar.x = this.x - 25;
    this.hpBar.y = this.y - 30;
  }

  handleAim(targetX, targetY) {
    this.aimAngle = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);
    this.setRotation(this.aimAngle);
  }

  canUseSkill(skillKey, time) {
    if (!this.skills[skillKey]) return false;
    return time >= this.skills[skillKey].lastUsed + this.skills[skillKey].cooldown;
  }

  useSkill(skillKey, time, targetX, targetY) {
    if (!this.canUseSkill(skillKey, time)) return false;

    this.skills[skillKey].lastUsed = time;
    
    const fireAngle = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);
    this.setRotation(fireAngle);

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
    if (this.hpBar) {
      this.hpBar.destroy();
      this.hpBar = null;
    }
    if (this.shieldTimer) {
      this.shieldTimer.remove();
      this.shieldTimer = null;
    }
    super.destroy(fromScene);
  }
}

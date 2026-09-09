import Phaser from 'phaser';

export default class BaseCharacter extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, isBot = false, color = 0x0088ff) {
    super(scene, x, y, ''); 

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.isBot = isBot;
    
    // Default Base Stats
    this.maxHp = 1000;
    this.hp = this.maxHp;
    this.speed = 200;
    this.aimAngle = 0;
    
    this.armor = 0;
    this.lifesteal = 0;
    this.critChance = 0;
    this.armorPen = 0;

    // Skills definition (Q, E, SPACE)
    // To be populated by subclass
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
      graphics.fillStyle(0x00ffff, 1);
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

  takeDamage(amount, isCrit = false) {
    this.hp = Math.max(0, this.hp - amount);
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
    this.hpBar.clear();
    this.hpBar.fillStyle(0x000000, 0.8);
    this.hpBar.fillRect(0, 0, 50, 6);
    const fillPercent = this.hp / this.maxHp;
    this.hpBar.fillStyle(this.isBot ? 0xff0000 : 0x00ff00, 1);
    this.hpBar.fillRect(1, 1, 48 * fillPercent, 4);
  }

  die() {
    this.hpBar.destroy();
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
}

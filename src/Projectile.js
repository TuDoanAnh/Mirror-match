import Phaser from 'phaser';
import { GAME_CONFIG } from './gameConfig';

export default class Projectile extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, type, config, attacker = null, heroId = 'ezreal') {
    super(scene, x, y, ''); // Empty texture key because we will generate it dynamically

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.attacker = attacker;
    this.heroId = heroId;

    this.type = type; // 'Q', 'E', 'SPACE'
    this.damage = config.damage;
    this.speed = config.speed;
    this.passesThrough = config.isPiercing || false;
    this.isPiercing = this.passesThrough;
    this.rootDuration = config.rootDuration || 0;
    this.isExplosive = config.isExplosive || false;
    this.explosionRadius = config.explosionRadius || 90;
    this.maxRange = config.maxRange || 0;

    const heroData = GAME_CONFIG.CHARACTERS[heroId] || GAME_CONFIG.CHARACTERS.ezreal;
    const projColor = (type === 'SPACE') ? (heroData.ultColor || 0xffaa00) : (heroData.projColor || 0x00ffff);
    this.particleColor = projColor;

    // Use Ezreal / Lux / Jinx / Zed Skill Spritesheets if available
    const isEzrealOrFallback = (heroId === 'ezreal');
    const isLux = (heroId === 'lux');
    const isJinx = (heroId === 'jinx');
    const isZed = (heroId === 'zed');

    if (this.type === 'Q' && isZed && scene.textures.exists('zed_q_skill')) {
      this.setTexture('zed_q_skill', 0);
      if (scene.anims.exists('zed_q_anim')) {
        this.play('zed_q_anim');
      }
      this.setScale(0.22);
      this.setOrigin(0.5, 0.5);
      this.body.setSize(32, 32);
    } else if (this.type === 'Q' && isLux && scene.textures.exists('lux_q_skill')) {
      this.setTexture('lux_q_skill');
      this.setScale(0.55);
      this.setOrigin(0.5, 0.5);
      this.body.setSize(48, 48);
    } else if (this.type === 'SPACE' && isLux && scene.textures.exists('lux_space_beam')) {
      this.setTexture('lux_space_beam');
      this.setScale(0.6, 0.65);
      this.setOrigin(0.05, 0.5); // Beam starts at character's position
      this.body.setSize(1000, 100);
    } else if (this.type === 'Q' && isJinx && scene.textures.exists('jinx_q_skill')) {
      this.setTexture('jinx_q_skill');
      this.setScale(0.45);
      this.setOrigin(0.5, 0.5);
      this.body.setSize(60, 24);
    } else if (this.type === 'SPACE' && isJinx && scene.textures.exists('jinx_space_skill')) {
      this.setTexture('jinx_space_skill');
      this.setScale(0.55);
      this.setOrigin(0.5, 0.5);
      this.body.setSize(120, 48);
    } else if (this.type === 'Q' && scene.textures.exists('ezreal_q_skill') && isEzrealOrFallback) {
      this.setTexture('ezreal_q_skill', 0);
      if (scene.anims.exists('ezreal_q_anim')) {
        this.play('ezreal_q_anim');
      }
      this.setScale(0.55);
      this.setOrigin(0.5, 0.5);
      this.body.setSize(90, 36);
    } else if (this.type === 'SPACE' && scene.textures.exists('ezreal_space_skill') && isEzrealOrFallback) {
      this.setTexture('ezreal_space_skill', 0);
      if (scene.anims.exists('ezreal_space_anim')) {
        this.play('ezreal_space_anim');
      }
      this.setScale(0.65);
      this.setOrigin(0.5, 0.5);
      this.body.setSize(220, 110);
    } else {
      // Build dynamic fallback graphics texture
      const texKey = `proj_${heroId}_${this.type}`;
      if (!scene.textures.exists(texKey)) {
        const graphics = scene.make.graphics({ x: 0, y: 0, add: false });
        
        if (this.type === 'Q') {
          graphics.fillStyle(projColor, 1);
          graphics.beginPath();
          graphics.moveTo(20, 10);
          graphics.lineTo(0, 20);
          graphics.lineTo(5, 10);
          graphics.lineTo(0, 0);
          graphics.closePath();
          graphics.fillPath();
          graphics.generateTexture(texKey, 20, 20);
        } else if (this.type === 'SPACE') {
          graphics.fillStyle(projColor, 1);
          graphics.fillEllipse(40, 60, 80, 120);
          graphics.fillStyle(0xffffff, 1);
          graphics.fillEllipse(40, 60, 40, 100);
          graphics.generateTexture(texKey, 80, 120);
        }
        graphics.destroy();
      }

      this.setTexture(texKey);
      this.setOrigin(0.5, 0.5);

      if (this.type === 'Q') {
        this.body.setSize(20, 20);
      } else if (this.type === 'SPACE') {
        this.body.setSize(80, 120);
      }
    }
  }

  fire(angle) {
    this.startX = this.x;
    this.startY = this.y;
    this.setRotation(angle);
    this.scene.physics.velocityFromRotation(angle, this.speed, this.body.velocity);

    // Particle Trail Effect
    const trailTex = this.scene.textures.exists('proj_particle') ? 'proj_particle' : this.texture.key;
    const trailScale = this.type === 'SPACE' ? { start: 0.8, end: 0 } : { start: 0.4, end: 0 };
    
    // Emitter base position at 0,0 so startFollow(this) centers particles on the projectile
    this.trail = this.scene.add.particles(0, 0, trailTex, {
      speed: 0,
      scale: trailScale,
      tint: this.particleColor,
      alpha: { start: 0.8, end: 0 },
      blendMode: 'ADD',
      lifespan: 250
    });
    this.trail.startFollow(this);
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);

    if (this.maxRange > 0 && !this.isBoomerang && this.startX !== undefined) {
      const traveled = Phaser.Math.Distance.Between(this.startX, this.startY, this.x, this.y);
      if (traveled >= this.maxRange) {
        this.destroy();
        return;
      }
    }

    // Mystic Split Augment: Split Q projectile after 350px into 2 diagonal bolts
    if (this.type === 'Q' && !this.hasSplit && !this.isSplitChild && this.attacker && this.attacker.hasMysticSplit && this.startX !== undefined) {
      const dist = Phaser.Math.Distance.Between(this.startX, this.startY, this.x, this.y);
      if (dist >= 350) {
        this.splitMysticProjectiles();
      }
    }
    
    if (this.isBoomerang && !this.isReturning && this.startPoint) {
      const traveled = Phaser.Math.Distance.Between(this.x, this.y, this.startPoint.x, this.startPoint.y);
      if (traveled >= (this.maxRange || 450)) {
        this.isReturning = true;
      }
    }

    if (this.isReturning && this.attacker && this.attacker.active) {
      const returnAngle = Phaser.Math.Angle.Between(this.x, this.y, this.attacker.x, this.attacker.y);
      this.setRotation(returnAngle);
      this.scene.physics.velocityFromRotation(returnAngle, this.speed, this.body.velocity);

      const distToOwner = Phaser.Math.Distance.Between(this.x, this.y, this.attacker.x, this.attacker.y);
      if (distToOwner < 30) {
        this.destroy();
        return;
      }
    }

    // Destroy if projectile leaves the screen bounds
    const width = 1536;
    const height = 1024;

    if (
      this.x < 0 || 
      this.x > width || 
      this.y < 0 || 
      this.y > height
    ) {
      this.destroy();
    }
  }

  splitMysticProjectiles() {
    this.hasSplit = true;
    const currentAngle = this.rotation;
    const angles = [currentAngle - 0.35, currentAngle + 0.35];

    let targetGroup = null;
    if (this.attacker && this.attacker.projectileGroup) {
      targetGroup = this.attacker.projectileGroup;
    } else if (this.scene) {
      targetGroup = (this.attacker && this.attacker.isBot) ? this.scene.enemyProjectiles : this.scene.playerProjectiles;
    }

    angles.forEach(ang => {
      const childConfig = {
        damage: Math.round(this.damage * 0.75),
        speed: this.speed,
        isPiercing: this.isPiercing,
        maxRange: 450
      };
      const child = new Projectile(this.scene, this.x, this.y, this.type, childConfig, this.attacker, this.heroId);
      child.isSplitChild = true;
      child.hasSplit = true;
      if (targetGroup) {
        targetGroup.add(child);
      }
      child.fire(ang);
    });

    if (this.scene) {
      const flash = this.scene.add.circle(this.x, this.y, 25, 0x38bdf8, 0.8);
      flash.setBlendMode('ADD');
      this.scene.tweens.add({ targets: flash, scale: 2, alpha: 0, duration: 250, onComplete: () => flash.destroy() });
    }

    this.destroy();
  }

  destroy() {
    // Override default destroy to ensure trail is removed
    this.destroyProjectile();
  }

  destroyProjectile() {
    if (this.trail) {
      this.trail.stopFollow();
      if (typeof this.trail.stop === 'function') {
        this.trail.stop();
      }
      // Let particles fade naturally
      this.scene.time.delayedCall(300, () => {
        if (this.trail) this.trail.destroy();
      });
      this.trail = null;
    }
    super.destroy();
  }
}

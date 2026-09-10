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

    const heroData = GAME_CONFIG.CHARACTERS[heroId] || GAME_CONFIG.CHARACTERS.ezreal;
    const projColor = (type === 'SPACE') ? (heroData.ultColor || 0xffaa00) : (heroData.projColor || 0x00ffff);
    this.particleColor = projColor;

    // Build the dynamic texture if it doesn't exist yet
    const texKey = `proj_${heroId}_${this.type}`;
    if (!scene.textures.exists(texKey)) {
      const graphics = scene.make.graphics({ x: 0, y: 0, add: false });
      
      if (this.type === 'Q') {
        // Glowing Arrow/Bolt
        graphics.fillStyle(projColor, 1);
        graphics.beginPath();
        graphics.moveTo(20, 10); // tip
        graphics.lineTo(0, 20);  // bottom tail
        graphics.lineTo(5, 10);  // inner tail
        graphics.lineTo(0, 0);   // top tail
        graphics.closePath();
        graphics.fillPath();
        graphics.generateTexture(texKey, 20, 20);
      } else if (this.type === 'SPACE') {
        // Massive Energy Wave/Beam
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

    // Setup physics body based on texture bounds
    if (this.type === 'Q') {
      this.body.setSize(20, 20);
    } else if (this.type === 'SPACE') {
      this.body.setSize(80, 120);
    }
  }

  fire(angle) {
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
    
    // Destroy if projectile leaves the screen bounds
    const width = this.scene.scale ? this.scene.scale.width : (this.scene.cameras.main ? this.scene.cameras.main.width : 1024);
    const height = this.scene.scale ? this.scene.scale.height : (this.scene.cameras.main ? this.scene.cameras.main.height : 768);

    if (
      this.x < 0 || 
      this.x > width || 
      this.y < 0 || 
      this.y > height
    ) {
      this.destroy();
    }
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

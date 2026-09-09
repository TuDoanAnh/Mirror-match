import Phaser from 'phaser';

export default class Projectile extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, type, config, attacker = null) {
    super(scene, x, y, ''); // Empty texture key because we will generate it dynamically

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.attacker = attacker;

    this.type = type; // 'Q', 'E', 'SPACE'
    this.damage = config.damage;
    this.speed = config.speed;
    this.passesThrough = config.isPiercing || false;

    // Build the dynamic texture if it doesn't exist yet
    const texKey = `proj_${this.type}`;
    if (!scene.textures.exists(texKey)) {
      const graphics = scene.make.graphics({ x: 0, y: 0, add: false });
      
      if (this.type === 'Q') {
        // Glowing Arrow/Bolt
        graphics.fillStyle(0x00ffff, 1);
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
        graphics.fillStyle(0xffaa00, 1);
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
    const particleColor = this.type === 'Q' ? 0x00ffff : 0xffaa00;
    this.trail = this.scene.add.particles(0, 0, this.texture.key, { // dynamically use the projectile's own texture
      speed: 0,
      scale: { start: (this.type === 'SPACE' ? 1.5 : 0.5), end: 0 },
      alpha: { start: 0.8, end: 0 },
      blendMode: 'ADD',
      lifespan: 300
    });
    // Create a circular particle texture if needed, but we can just use setEmitter to track this object
    this.trail.startFollow(this);
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    
    // Destroy if out of bounds
    const camera = this.scene.cameras.main;
    if (
      this.x < -100 || 
      this.x > camera.width + 100 || 
      this.y < -100 || 
      this.y > camera.height + 100
    ) {
      this.destroyProjectile();
    }
  }

  destroy() {
    // Override default destroy to ensure trail is removed
    this.destroyProjectile();
  }

  destroyProjectile() {
    if (this.trail) {
      this.trail.stopFollow();
      // Let particles fade naturally
      this.scene.time.delayedCall(300, () => {
        if (this.trail) this.trail.destroy();
      });
      this.trail = null;
    }
    super.destroy();
  }
}

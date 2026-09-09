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
        graphics.fillStyle(0xffff00, 1);
        graphics.fillCircle(10, 10, 10);
        graphics.generateTexture(texKey, 20, 20);
      } else if (this.type === 'W') {
        graphics.fillStyle(0x00aaff, 1);
        graphics.fillEllipse(15, 10, 30, 20); // Width 30, Height 20
        graphics.generateTexture(texKey, 30, 20);
      } else if (this.type === 'R') {
        graphics.fillStyle(0xffcc00, 1);
        graphics.fillRect(0, 0, 80, 120);
        graphics.generateTexture(texKey, 80, 120);
      }
      graphics.destroy();
    }

    this.setTexture(texKey);
    this.setOrigin(0.5, 0.5);

    // Setup physics body based on texture bounds
    if (this.type === 'Q') {
      this.body.setCircle(10);
    } else if (this.type === 'W') {
      this.body.setSize(30, 20);
    } else if (this.type === 'R') {
      this.body.setSize(80, 120);
    }
  }

  fire(angle) {
    this.setRotation(angle);
    this.scene.physics.velocityFromRotation(angle, this.speed, this.body.velocity);
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    
    // Destroy if out of bounds
    const camera = this.scene.cameras.main;
    if (
      this.x < 0 || 
      this.x > camera.width || 
      this.y < 0 || 
      this.y > camera.height
    ) {
      this.destroy();
    }
  }
}

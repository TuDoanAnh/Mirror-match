import Phaser from 'phaser';
import BaseCharacter from './BaseCharacter';
import Projectile from './Projectile';

export default class Player extends BaseCharacter {
  constructor(scene, x, y, isBot = false, color = 0x0088ff) {
    super(scene, x, y, isBot, color);

    this.skills = {
      Q: { cooldown: 2000, lastUsed: 0, config: { damage: 100, speed: 600, isPiercing: false } },
      E: { cooldown: 8000, lastUsed: 0, dashDistance: 150 },
      SPACE: { cooldown: 20000, lastUsed: 0, config: { damage: 500, speed: 1000, isPiercing: true } }
    };

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
    this.shootProjectile('Q', fireAngle);
  }

  executeE(targetX, targetY, fireAngle) {
    const dist = Phaser.Math.Distance.Between(this.x, this.y, targetX, targetY);
    const actualDist = Math.min(dist, this.skills.E.dashDistance);
    
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
      ghost.setTint(0x00ffff);
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

  executeSpace(targetX, targetY, fireAngle) {
    this.shootProjectile('SPACE', fireAngle);
  }

  shootProjectile(skillKey, angle) {
    const skillConfig = this.skills[skillKey].config;
    const spawnX = this.x + Math.cos(angle) * 20;
    const spawnY = this.y + Math.sin(angle) * 20;

    const proj = new Projectile(this.scene, spawnX, spawnY, skillKey, skillConfig, this);
    this.projectileGroup.add(proj);
    proj.fire(angle);
  }
}

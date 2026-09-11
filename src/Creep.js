import Phaser from 'phaser';
import BaseCharacter from './BaseCharacter';
import { GAME_CONFIG } from './gameConfig';

export default class Creep extends BaseCharacter {
  constructor(scene, x, y) {
    super(scene, x, y, true, GAME_CONFIG.CREEP_STATS.color || 0xcc3333);

    const stats = GAME_CONFIG.CREEP_STATS;

    this.maxHp = stats.hp;
    this.hp = this.maxHp;
    this.speed = stats.speed;
    this.armor = stats.armor;
    this.damage = stats.atk;
    this.goldReward = stats.goldReward;

    this.lastShootTime = 0;
    this.shootCooldown = 2500; // Shoots every 2.5s

    // Generate unique compact creep texture
    const texKey = 'creep_minion_tex';
    if (!scene.textures.exists(texKey)) {
      const graphics = scene.make.graphics({ x: 0, y: 0, add: false });
      // Red mechanical spider/drone body
      graphics.fillStyle(0xaa1111, 1);
      graphics.lineStyle(2, 0xff5555, 1);
      graphics.fillCircle(12, 12, 10);
      graphics.strokeCircle(12, 12, 10);
      
      // Glowing eye core
      graphics.fillStyle(0xffff00, 1);
      graphics.fillCircle(16, 12, 4);

      graphics.generateTexture(texKey, 24, 24);
      graphics.destroy();
    }

    this.setTexture(texKey);
    this.setOrigin(0.5, 0.5);
    this.body.setCircle(10);
    this.setCollideWorldBounds(true);

    this.updateHpBar();
  }

  update(time, delta) {
    if (this.hp <= 0) return;

    // HP Bar follow
    if (this.hpBar) {
      this.hpBar.x = this.x - 25;
      this.hpBar.y = this.y - 20;
    }

    if (this.isRooted) {
      this.setVelocity(0, 0);
      return;
    }

    const player = this.scene.player;
    if (!player || player.hp <= 0) {
      this.setVelocity(0, 0);
      return;
    }

    // Aim towards player
    this.handleAim(player.x, player.y);
    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

    if (dist > 160) {
      // 1. Target vector towards player
      let targetX = Math.cos(this.aimAngle);
      let targetY = Math.sin(this.aimAngle);

      // 2. Anti-Clumping Separation vector from other creeps
      let sepX = 0;
      let sepY = 0;
      if (this.scene.creeps) {
        const creeps = this.scene.creeps.getChildren();
        for (let i = 0; i < creeps.length; i++) {
          const other = creeps[i];
          if (other !== this && other.active && other.hp > 0) {
            const d = Phaser.Math.Distance.Between(this.x, this.y, other.x, other.y);
            if (d < 45 && d > 0) {
              sepX += (this.x - other.x) / d;
              sepY += (this.y - other.y) / d;
            }
          }
        }
      }

      // Combine target direction + separation force
      const moveX = targetX + sepX * 1.5;
      const moveY = targetY + sepY * 1.5;
      const desiredAngle = Math.atan2(moveY, moveX);

      // 3. Feeler ray obstacle avoidance
      const safeAngle = this.findSafeDirection(desiredAngle);

      if (safeAngle !== null) {
        this.scene.physics.velocityFromRotation(safeAngle, this.speed, this.body.velocity);
      } else {
        this.setVelocity(0, 0);
      }
    } else {
      this.setVelocity(0, 0);
    }

    // Fire ranged creep bullet
    if (dist < 400 && time >= this.lastShootTime + this.shootCooldown) {
      this.lastShootTime = time;
      this.shootCreepBullet(player.x, player.y);
    }
  }

  findSafeDirection(desiredAngle, lookAhead = 55) {
    const candidateOffsets = [0, 0.45, -0.45, 0.9, -0.9, 1.35, -1.35, Math.PI];

    for (let i = 0; i < candidateOffsets.length; i++) {
      const testAngle = desiredAngle + candidateOffsets[i];
      const testX = this.x + Math.cos(testAngle) * lookAhead;
      const testY = this.y + Math.sin(testAngle) * lookAhead;

      // Map bounds check
      if (testX < 35 || testX > 989 || testY < 35 || testY > 733) {
        continue;
      }

      // Obstacles collision ray check
      if (this.isPositionBlockedByObstacle(testX, testY)) {
        continue;
      }

      return testAngle;
    }

    return null;
  }

  isPositionBlockedByObstacle(x, y, margin = 16) {
    if (!this.scene.obstacles) return false;

    const obstacles = this.scene.obstacles.getChildren();
    for (let i = 0; i < obstacles.length; i++) {
      const obs = obstacles[i];
      const left = obs.x - obs.displayWidth / 2 - margin;
      const right = obs.x + obs.displayWidth / 2 + margin;
      const top = obs.y - obs.displayHeight / 2 - margin;
      const bottom = obs.y + obs.displayHeight / 2 + margin;

      if (x >= left && x <= right && y >= top && y <= bottom) {
        return true;
      }
    }

    return false;
  }

  shootCreepBullet(targetX, targetY) {
    const angle = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);
    const spawnX = this.x + Math.cos(angle) * 15;
    const spawnY = this.y + Math.sin(angle) * 15;

    // Texture for creep bullet
    const bulletKey = 'creep_bullet_tex';
    if (!this.scene.textures.exists(bulletKey)) {
      const g = this.scene.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xff3333, 1);
      g.fillCircle(5, 5, 5);
      g.generateTexture(bulletKey, 10, 10);
      g.destroy();
    }

    const bullet = this.scene.physics.add.sprite(spawnX, spawnY, bulletKey);
    bullet.damage = this.damage;
    bullet.attacker = this;
    bullet.isPiercing = false;
    bullet.passesThrough = false;

    this.scene.creepProjectiles.add(bullet);
    this.scene.physics.velocityFromRotation(angle, 400, bullet.body.velocity);

    // Auto cleanup out of bounds
    bullet.preUpdate = (time, delta) => {
      if (bullet.x < 0 || bullet.x > 1024 || bullet.y < 0 || bullet.y > 768) {
        bullet.destroy();
      }
    };
  }

  die() {
    // Award gold reward to player
    if (this.scene.registry.has('gold')) {
      const currentGold = this.scene.registry.get('gold') || 0;
      const newGold = currentGold + (this.goldReward || 30);
      this.scene.registry.set('gold', newGold);

      // Floating "+30G" text
      const goldTxt = this.scene.add.text(this.x, this.y - 10, `+${this.goldReward}G`, {
        fontSize: '16px',
        fill: '#ffd700',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      this.scene.tweens.add({
        targets: goldTxt,
        y: this.y - 40,
        alpha: 0,
        duration: 800,
        onComplete: () => goldTxt.destroy()
      });
    }

    super.die();
  }
}

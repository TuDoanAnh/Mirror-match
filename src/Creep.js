import Phaser from 'phaser';
import BaseCharacter from './BaseCharacter';
import { GAME_CONFIG } from './gameConfig';
import { MAP_OBSTACLES } from './mapObstacles';

export default class Creep extends BaseCharacter {
  constructor(scene, x, y) {
    super(scene, x, y, true, GAME_CONFIG.CREEP_STATS.color || 0xcc3333, 'creep');

    const stats = GAME_CONFIG.CREEP_STATS;

    this.maxHp = stats.hp;
    this.hp = this.maxHp;
    this.speed = stats.speed;
    this.armor = stats.armor;
    this.damage = stats.atk;
    this.goldReward = stats.goldReward;

    this.lastShootTime = 0;
    this.shootCooldown = 2500; // Shoots every 2.5s
    this.lastChosenSign = 1; // Hysteresis flag for Creep steering

    if (scene.textures.exists('creep_spritesheet')) {
      this.setTexture('creep_spritesheet', 0);
    }
    this.setScale(0.65);
    this.setOrigin(0.5, 0.5);
    this.body.setSize(22, 22);
    this.body.setOffset(13, 17);
    this.setCollideWorldBounds(true);

    if (this.anims && scene.anims.exists('creep_idle')) {
      this.play('creep_idle', true);
    }

    this.updateHpBar();
  }

  smoothSetVelocity(targetVx, targetVy, lerpFactor = 0.22) {
    if (!this.body) return;
    this.body.velocity.x = Phaser.Math.Linear(this.body.velocity.x, targetVx, lerpFactor);
    this.body.velocity.y = Phaser.Math.Linear(this.body.velocity.y, targetVy, lerpFactor);
  }

  update(time, delta) {
    if (this.hp <= 0) return;

    // HP Bar follow
    if (this.hpBar) {
      this.hpBar.x = this.x - 25;
      this.hpBar.y = this.y - 18;
    }

    this.updateAnimation('creep');

    if (this.isRooted) {
      this.smoothSetVelocity(0, 0, 0.3);
      return;
    }

    const player = this.scene.player;
    if (!player || player.hp <= 0) {
      this.smoothSetVelocity(0, 0, 0.3);
      return;
    }

    // Aim towards player
    this.handleAim(player.x, player.y);
    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

    // Wall Recovery: Unstick if touching a wall
    if (this.handleWallUnsticking()) {
      return;
    }

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

      // Strong repulsion from Enemy Bot to prevent crowding or trapping Bot
      if (this.scene.bot && this.scene.bot.active && this.scene.bot.hp > 0) {
        const bd = Phaser.Math.Distance.Between(this.x, this.y, this.scene.bot.x, this.scene.bot.y);
        if (bd < 60 && bd > 0) {
          sepX += (this.x - this.scene.bot.x) / bd * 2.5;
          sepY += (this.y - this.scene.bot.y) / bd * 2.5;
        }
      }

      // Combine target direction + separation force
      const moveX = targetX + sepX * 1.5;
      const moveY = targetY + sepY * 1.5;
      const desiredAngle = Math.atan2(moveY, moveX);

      // 3. Feeler ray obstacle avoidance
      const safeAngle = this.findSafeDirection(desiredAngle);

      if (safeAngle !== null) {
        const targetVx = Math.cos(safeAngle) * this.speed;
        const targetVy = Math.sin(safeAngle) * this.speed;
        this.smoothSetVelocity(targetVx, targetVy, 0.22);
      } else {
        this.smoothSetVelocity(0, 0, 0.3);
      }
    } else {
      this.smoothSetVelocity(0, 0, 0.3);
    }

    // Fire ranged creep bullet
    if (dist < 400 && time >= this.lastShootTime + this.shootCooldown) {
      this.lastShootTime = time;
      this.shootCreepBullet(player.x, player.y);
    }
  }

  handleWallUnsticking() {
    if (!this.body) return false;

    // Instant un-embedding if body ever gets embedded inside a static collider
    if (this.body.embedded) {
      const popAngle = Phaser.Math.Angle.Between(this.x, this.y, 768, 512);
      this.x += Math.cos(popAngle) * 8;
      this.y += Math.sin(popAngle) * 8;
      this.body.reset(this.x, this.y);
      return true;
    }

    // Emergency boundary pocket rescue (If trapped in right/left base alcoves or outer walls)
    if (this.x > 1230 || this.x < 190 || this.y < 130 || this.y > 880) {
      const centerAngle = Phaser.Math.Angle.Between(this.x, this.y, 768, 512);
      const safeCenterAngle = this.findSafeDirection(centerAngle);
      const finalAngle = safeCenterAngle !== null ? safeCenterAngle : centerAngle;
      this.smoothSetVelocity(Math.cos(finalAngle) * this.speed, Math.sin(finalAngle) * this.speed, 0.35);
      return true;
    }

    const isBlocked = this.body.blocked.left || this.body.blocked.right || this.body.blocked.up || this.body.blocked.down;
    
    if (isBlocked) {
      let pushX = 0;
      let pushY = 0;

      MAP_OBSTACLES.forEach(obs => {
        if (obs.isPassable) return;
        const dx = this.x - obs.x;
        const dy = this.y - obs.y;
        const distSq = dx * dx + dy * dy;
        const maxThreshold = (Math.max(obs.w, obs.h) / 2 + 45) ** 2;

        if (distSq < maxThreshold && distSq > 0) {
          const len = Math.sqrt(distSq);
          pushX += (dx / len);
          pushY += (dy / len);
        }
      });

      if (pushX !== 0 || pushY !== 0) {
        const pushAngle = Math.atan2(pushY, pushX);
        this.smoothSetVelocity(Math.cos(pushAngle) * this.speed, Math.sin(pushAngle) * this.speed, 0.4);
        return true;
      }
    }

    return false;
  }

  findSafeDirection(desiredAngle, lookAhead = 70) {
    let candidateOffsets;
    if (this.lastChosenSign >= 0) {
      candidateOffsets = [0, 0.4, 0.8, 1.2, 1.6, -0.4, -0.8, -1.2, -1.6, Math.PI];
    } else {
      candidateOffsets = [0, -0.4, -0.8, -1.2, -1.6, 0.4, 0.8, 1.2, 1.6, Math.PI];
    }

    for (let i = 0; i < candidateOffsets.length; i++) {
      const offset = candidateOffsets[i];
      const testAngle = desiredAngle + offset;
      const testX = this.x + Math.cos(testAngle) * lookAhead;
      const testY = this.y + Math.sin(testAngle) * lookAhead;

      // Active arena bounds check (190..1230, 130..880)
      if (testX < 190 || testX > 1230 || testY < 130 || testY > 880) {
        continue;
      }

      // Check entire line segment raycast
      if (this.isSegmentBlockedByObstacle(this.x, this.y, testX, testY)) {
        continue;
      }

      // Record steer direction sign for hysteresis persistence
      if (offset > 0.05) this.lastChosenSign = 1;
      else if (offset < -0.05) this.lastChosenSign = -1;

      return testAngle;
    }

    return null;
  }

  // Checks multiple sample points along the ray segment from (x1,y1) to (x2,y2)
  isSegmentBlockedByObstacle(x1, y1, x2, y2, margin = 18) {
    const steps = 4;
    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      const px = x1 + (x2 - x1) * t;
      const py = y1 + (y2 - y1) * t;
      if (this.isPositionBlockedByObstacle(px, py, margin)) {
        return true;
      }
    }
    return false;
  }

  isPositionBlockedByObstacle(x, y, margin = 18) {
    for (let i = 0; i < MAP_OBSTACLES.length; i++) {
      const obs = MAP_OBSTACLES[i];
      if (obs.isPassable) continue;

      const left = obs.x - obs.w / 2 - margin;
      const right = obs.x + obs.w / 2 + margin;
      const top = obs.y - obs.h / 2 - margin;
      const bottom = obs.y + obs.h / 2 + margin;

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

    // Auto cleanup out of bounds (1536 x 1024)
    bullet.preUpdate = (time, delta) => {
      if (bullet.x < 0 || bullet.x > 1536 || bullet.y < 0 || bullet.y > 1024) {
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

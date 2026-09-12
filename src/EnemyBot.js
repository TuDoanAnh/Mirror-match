import Phaser from 'phaser';
import Player from './Player';
import { GAME_CONFIG } from './gameConfig';
import { MAP_OBSTACLES } from './mapObstacles';

export default class EnemyBot extends Player {
  constructor(scene, x, y, level = 1) {
    super(scene, x, y, true); 
    
    this.target = null; 
    
    this.orbitTimer = 0;
    this.orbitDirection = 1; // 1 = clockwise, -1 = counter-clockwise
    this.lastChosenSign = 1; // Steering hysteresis: 1 for right turn, -1 for left turn

    this.setLevel(level);
  }

  setLevel(level) {
    const scale = GAME_CONFIG.BOT_SCALING[level] || GAME_CONFIG.BOT_SCALING[1];
    const ezrealData = GAME_CONFIG.CHARACTERS.ezreal;

    this.speed = ezrealData.baseStats.speed * scale.speedMult;
    this.maxHp = ezrealData.baseStats.hp * scale.hpMult;
    this.hp = this.maxHp;
    this.armor = scale.armor;
    this.armorPen = scale.armorPen;
    this.critChance = scale.critChance;
    this.lifesteal = scale.lifesteal;

    this.skills.Q.config.damage = ezrealData.skills.Q.config.damage * scale.dmgMult;
    this.skills.SPACE.config.damage = ezrealData.skills.SPACE.config.damage * scale.dmgMult;

    this.skills.Q.cooldown = ezrealData.skills.Q.cooldown * scale.cdrMult;
    this.skills.E.cooldown = ezrealData.skills.E.cooldown * scale.cdrMult;
    this.skills.SPACE.cooldown = ezrealData.skills.SPACE.cooldown * scale.cdrMult;

    this.skills.Q.config.speed = ezrealData.skills.Q.config.speed * scale.projSpeedMult;
    this.skills.SPACE.config.speed = ezrealData.skills.SPACE.config.speed * scale.projSpeedMult;
  }

  setTarget(target) {
    this.target = target;
  }

  update(time, delta) {
    if (this.hp <= 0) return;
    
    // HP Bar Follow
    if (this.hpBar) {
      this.hpBar.x = this.x - 25;
      this.hpBar.y = this.y - 30;
    }

    if (this.isChanneling || this.isRooted || !this.target || this.target.hp <= 0) {
      this.smoothSetVelocity(0, 0, 0.3);
      return;
    }

    // 1. Aiming & Lead Prediction (Clamped inside 1536x1024 map bounds)
    const targetVelX = (this.target.body && this.target.body.velocity) ? this.target.body.velocity.x : 0;
    const targetVelY = (this.target.body && this.target.body.velocity) ? this.target.body.velocity.y : 0;
    
    const dist = Phaser.Math.Distance.Between(this.x, this.y, this.target.x, this.target.y);
    const qSpeed = (this.skills.Q && this.skills.Q.config) ? this.skills.Q.config.speed : 600;
    const leadTime = dist / qSpeed;

    const aimX = Phaser.Math.Clamp(this.target.x + targetVelX * leadTime * 0.5, 120, 1416);
    const aimY = Phaser.Math.Clamp(this.target.y + targetVelY * leadTime * 0.5, 120, 900);

    this.handleAim(aimX, aimY);

    // 2. Wall Un-sticking Check (Emergency Recovery if touching wall)
    if (this.handleWallUnsticking()) {
      return;
    }

    // 3. Skillshot Dodging & Threat Evasion
    const isDodging = this.handleSkillshotDodging(time);

    // 4. Movement & Obstacle Avoidance (if not dodging emergency threat)
    if (!isDodging) {
      this.updateSmartMovement(delta, dist);
    }

    // 5. Smart Skill Usage
    this.updateSkillCasting(time, dist, aimX, aimY);
  }

  // Smooth velocity helper to prevent instant jerky movement changes
  smoothSetVelocity(targetVx, targetVy, lerpFactor = 0.2) {
    if (!this.body) return;
    this.body.velocity.x = Phaser.Math.Linear(this.body.velocity.x, targetVx, lerpFactor);
    this.body.velocity.y = Phaser.Math.Linear(this.body.velocity.y, targetVy, lerpFactor);
  }

  // Wall Recovery: Detects physical collision against obstacle/boundary & repels away smoothly
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
        const maxThreshold = (Math.max(obs.w, obs.h) / 2 + 55) ** 2;

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

  // Detects incoming player projectiles & sidesteps or E-dashes out of danger
  handleSkillshotDodging(time) {
    if (!this.scene.playerProjectiles) return false;

    const projectiles = this.scene.playerProjectiles.getChildren();
    let closestThreat = null;
    let minThreatDist = 260;

    for (let i = 0; i < projectiles.length; i++) {
      const p = projectiles[i];
      if (!p.active || !p.body) continue;

      const pDist = Phaser.Math.Distance.Between(this.x, this.y, p.x, p.y);
      if (pDist < minThreatDist) {
        const pVel = p.body.velocity;
        const toBotX = this.x - p.x;
        const toBotY = this.y - p.y;
        const dot = (pVel.x * toBotX + pVel.y * toBotY);

        if (dot > 0) { // Moving towards bot
          closestThreat = p;
          minThreatDist = pDist;
        }
      }
    }

    if (closestThreat) {
      const pAngle = Math.atan2(closestThreat.body.velocity.y, closestThreat.body.velocity.x);
      const dodgeOption1 = pAngle + Math.PI / 2;
      const dodgeOption2 = pAngle - Math.PI / 2;

      let chosenDodgeAngle = this.findSafeDirection(dodgeOption1);
      if (chosenDodgeAngle === null) {
        chosenDodgeAngle = this.findSafeDirection(dodgeOption2);
      }

      if (chosenDodgeAngle !== null) {
        const isDangerous = closestThreat.type === 'SPACE' || minThreatDist < 140;
        if (isDangerous && this.canUseSkill('E', time)) {
          const dashTargetX = this.x + Math.cos(chosenDodgeAngle) * 150;
          const dashTargetY = this.y + Math.sin(chosenDodgeAngle) * 150;
          this.useSkill('E', time, dashTargetX, dashTargetY);
        } else {
          this.smoothSetVelocity(Math.cos(chosenDodgeAngle) * this.speed, Math.sin(chosenDodgeAngle) * this.speed, 0.3);
        }
        return true;
      }
    }

    return false;
  }

  // Orbital strafing around player with obstacle avoidance
  updateSmartMovement(delta, dist) {
    this.orbitTimer -= delta;
    if (this.orbitTimer <= 0) {
      this.orbitDirection = Math.random() < 0.5 ? 1 : -1;
      this.orbitTimer = Phaser.Math.Between(1500, 3000);
    }

    const angleToPlayer = Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y);
    
    // Radial component (in / out)
    let radialX = 0;
    let radialY = 0;
    if (dist < 280) {
      radialX = -Math.cos(angleToPlayer);
      radialY = -Math.sin(angleToPlayer);
    } else if (dist > 480) {
      radialX = Math.cos(angleToPlayer);
      radialY = Math.sin(angleToPlayer);
    }

    // Tangential component (Orbiting around player)
    const perpAngle = angleToPlayer + (Math.PI / 2) * this.orbitDirection;
    let tangX = Math.cos(perpAngle) * 0.85;
    let tangY = Math.sin(perpAngle) * 0.85;

    // Creep Repulsion (Avoid getting crowded or blocked by creeps)
    if (this.scene.creeps) {
      const creeps = this.scene.creeps.getChildren();
      for (let i = 0; i < creeps.length; i++) {
        const c = creeps[i];
        if (c.active && c.hp > 0) {
          const cd = Phaser.Math.Distance.Between(this.x, this.y, c.x, c.y);
          if (cd < 50 && cd > 0) {
            radialX += (this.x - c.x) / cd * 1.5;
            radialY += (this.y - c.y) / cd * 1.5;
          }
        }
      }
    }

    // Combined desired direction
    const combinedX = radialX + tangX;
    const combinedY = radialY + tangY;
    const desiredAngle = Math.atan2(combinedY, combinedX);

    // Pass through feeler ray obstacle avoidance!
    const safeAngle = this.findSafeDirection(desiredAngle);

    if (safeAngle !== null) {
      this.smoothSetVelocity(Math.cos(safeAngle) * this.speed, Math.sin(safeAngle) * this.speed, 0.22);
    } else {
      // Emergency escape vector away from nearest obstacle
      this.smoothSetVelocity(-Math.cos(angleToPlayer) * this.speed, -Math.sin(angleToPlayer) * this.speed, 0.22);
    }
  }

  // Cast skills intelligently
  updateSkillCasting(time, dist, aimX, aimY) {
    if (dist < 520 && Phaser.Math.Between(1, 100) > 90) {
      this.useSkill('Q', time, aimX, aimY);
    }

    if (dist < 680 && Phaser.Math.Between(1, 100) > 97) {
      this.useSkill('SPACE', time, aimX, aimY);
    }
  }

  // Multi-step Segment Raycasting with Steering Hysteresis
  findSafeDirection(desiredAngle) {
    const lookAhead = Math.max(85, (this.speed || 200) * 0.4);
    
    // Steering Hysteresis: Maintain previous steering bias (turn left or turn right) to avoid 60FPS oscillation
    let candidateOffsets;
    if (this.lastChosenSign >= 0) {
      candidateOffsets = [0, 0.35, 0.7, 1.05, 1.4, 1.8, -0.35, -0.7, -1.05, -1.4, -1.8, Math.PI];
    } else {
      candidateOffsets = [0, -0.35, -0.7, -1.05, -1.4, -1.8, 0.35, 0.7, 1.05, 1.4, 1.8, Math.PI];
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

      // Check entire line segment from current position to lookAhead destination
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
}

import Phaser from 'phaser';
import Player from './Player';
import { GAME_CONFIG } from './gameConfig';

export default class EnemyBot extends Player {
  constructor(scene, x, y, level = 1) {
    super(scene, x, y, true); 
    
    this.target = null; 
    
    this.orbitTimer = 0;
    this.orbitDirection = 1; // 1 = clockwise, -1 = counter-clockwise

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
      this.setVelocity(0, 0);
      return;
    }

    // 1. Aiming & Lead Prediction
    const targetVelX = (this.target.body && this.target.body.velocity) ? this.target.body.velocity.x : 0;
    const targetVelY = (this.target.body && this.target.body.velocity) ? this.target.body.velocity.y : 0;
    
    const dist = Phaser.Math.Distance.Between(this.x, this.y, this.target.x, this.target.y);
    const qSpeed = (this.skills.Q && this.skills.Q.config) ? this.skills.Q.config.speed : 600;
    const leadTime = dist / qSpeed;

    const aimX = Phaser.Math.Clamp(this.target.x + targetVelX * leadTime * 0.5, 40, 984);
    const aimY = Phaser.Math.Clamp(this.target.y + targetVelY * leadTime * 0.5, 40, 728);

    this.handleAim(aimX, aimY);

    // 2. Skillshot Dodging & Threat Evasion
    const isDodging = this.handleSkillshotDodging(time);

    // 3. Movement & Obstacle Avoidance (if not dodging emergency threat)
    if (!isDodging) {
      this.updateSmartMovement(delta, dist);
    }

    // 4. Smart Skill Usage
    this.updateSkillCasting(time, dist, aimX, aimY);
  }

  // Detects incoming player projectiles & sidesteps or E-dashes out of danger
  handleSkillshotDodging(time) {
    if (!this.scene.playerProjectiles) return false;

    const projectiles = this.scene.playerProjectiles.getChildren();
    let closestThreat = null;
    let minThreatDist = 240;

    for (let i = 0; i < projectiles.length; i++) {
      const p = projectiles[i];
      if (!p.active || !p.body) continue;

      const pDist = Phaser.Math.Distance.Between(this.x, this.y, p.x, p.y);
      if (pDist < minThreatDist) {
        // Check if projectile is moving towards bot
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
      // Calculate perpendicular dodge angle
      const pAngle = Math.atan2(closestThreat.body.velocity.y, closestThreat.body.velocity.x);
      const dodgeOption1 = pAngle + Math.PI / 2;
      const dodgeOption2 = pAngle - Math.PI / 2;

      let chosenDodgeAngle = this.findSafeDirection(dodgeOption1);
      if (chosenDodgeAngle === null) {
        chosenDodgeAngle = this.findSafeDirection(dodgeOption2);
      }

      if (chosenDodgeAngle !== null) {
        // High danger: Ult or close Q -> E dash if off cooldown!
        const isDangerous = closestThreat.type === 'SPACE' || minThreatDist < 140;
        if (isDangerous && this.canUseSkill('E', time)) {
          const dashTargetX = this.x + Math.cos(chosenDodgeAngle) * 150;
          const dashTargetY = this.y + Math.sin(chosenDodgeAngle) * 150;
          this.useSkill('E', time, dashTargetX, dashTargetY);
        } else {
          // Sidestep dodge
          this.setVelocity(Math.cos(chosenDodgeAngle) * this.speed, Math.sin(chosenDodgeAngle) * this.speed);
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
      // Retreat
      radialX = -Math.cos(angleToPlayer);
      radialY = -Math.sin(angleToPlayer);
    } else if (dist > 450) {
      // Advance
      radialX = Math.cos(angleToPlayer);
      radialY = Math.sin(angleToPlayer);
    }

    // Tangential component (Orbiting around player)
    const perpAngle = angleToPlayer + (Math.PI / 2) * this.orbitDirection;
    const tangX = Math.cos(perpAngle) * 0.85;
    const tangY = Math.sin(perpAngle) * 0.85;

    // Combined desired direction
    const combinedX = radialX + tangX;
    const combinedY = radialY + tangY;
    const desiredAngle = Math.atan2(combinedY, combinedX);

    // Pass through feeler ray obstacle avoidance!
    const safeAngle = this.findSafeDirection(desiredAngle);

    if (safeAngle !== null) {
      this.setVelocity(Math.cos(safeAngle) * this.speed, Math.sin(safeAngle) * this.speed);
    } else {
      // Emergency escape vector away from nearest obstacle
      this.setVelocity(-Math.cos(angleToPlayer) * this.speed, -Math.sin(angleToPlayer) * this.speed);
    }
  }

  // Cast skills intelligently
  updateSkillCasting(time, dist, aimX, aimY) {
    if (dist < 500 && Phaser.Math.Between(1, 100) > 90) {
      this.useSkill('Q', time, aimX, aimY);
    }

    if (dist < 650 && Phaser.Math.Between(1, 100) > 97) {
      this.useSkill('SPACE', time, aimX, aimY);
    }
  }

  // Feeler raycasting: Tests candidate angles to avoid walls & map bounds
  findSafeDirection(desiredAngle, lookAhead = 70) {
    const candidateOffsets = [0, 0.52, -0.52, 1.05, -1.05, 1.57, -1.57, 2.36, -2.36, Math.PI];

    for (let i = 0; i < candidateOffsets.length; i++) {
      const testAngle = desiredAngle + candidateOffsets[i];
      const testX = this.x + Math.cos(testAngle) * lookAhead;
      const testY = this.y + Math.sin(testAngle) * lookAhead;

      // Map bounds check
      if (testX < 40 || testX > 984 || testY < 40 || testY > 728) {
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

  isPositionBlockedByObstacle(x, y, margin = 20) {
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
}

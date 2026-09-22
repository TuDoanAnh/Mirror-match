import Phaser from 'phaser';
import Player from './Player';
import { GAME_CONFIG, getBotEquipmentForLevel } from './gameConfig';
import { MAP_OBSTACLES } from './mapObstacles';
import { MAP_POLYGONS } from './mapPolygons';
import { isPointInAnyPolygon, isSegmentIntersectingAnyPolygon } from './polygonCollision';

export default class EnemyBot extends Player {
  constructor(scene, x, y, level = 1, botHeroId = null) {
    const defaultHero = GAME_CONFIG.DEFAULT_BOT_HERO_BY_LEVEL[level] || 'ezreal';
    const finalHeroId = botHeroId || defaultHero;

    super(scene, x, y, true, 0xff0000, finalHeroId); 
    
    this.target = null; 
    
    this.orbitTimer = 0;
    this.orbitDirection = 1; // 1 = clockwise, -1 = counter-clockwise
    this.lastChosenSign = 1; // Steering hysteresis: 1 for right turn, -1 for left turn

    this.setLevel(level);
  }

  setLevel(level) {
    const scale = GAME_CONFIG.BOT_SCALING[level] || GAME_CONFIG.BOT_SCALING[1];
    const heroData = GAME_CONFIG.CHARACTERS[this.heroId] || GAME_CONFIG.CHARACTERS.ezreal;
    const caps = GAME_CONFIG.STAT_CAPS || { MAX_CDR: 0.60, MAX_ARMOR_PEN: 60, MAX_CRIT_CHANCE: 100, MAX_LIFESTEAL: 60 };

    this.speed = heroData.baseStats.speed * scale.speedMult;
    this.maxHp = heroData.baseStats.hp * scale.hpMult;
    this.hp = this.maxHp;
    this.armor = scale.armor;
    this.armorPen = Math.min(caps.MAX_ARMOR_PEN, scale.armorPen);
    this.critChance = Math.min(caps.MAX_CRIT_CHANCE, scale.critChance);
    this.lifesteal = Math.min(caps.MAX_LIFESTEAL, scale.lifesteal);

    const botCdrMult = Math.max(1 - caps.MAX_CDR, scale.cdrMult);

    if (this.skills.Q && this.skills.Q.config) {
      this.skills.Q.config.damage = (heroData.skills.Q.config.damage || 100) * scale.dmgMult;
      this.skills.Q.cooldown = Math.max(500, Math.round(heroData.skills.Q.cooldown * botCdrMult));
      if (this.skills.Q.config.speed) this.skills.Q.config.speed *= scale.projSpeedMult;
    }
    if (this.skills.E) {
      this.skills.E.cooldown = Math.max(500, Math.round(heroData.skills.E.cooldown * botCdrMult));
    }
    if (this.skills.SPACE && this.skills.SPACE.config) {
      this.skills.SPACE.config.damage = (heroData.skills.SPACE.config.damage || 400) * scale.dmgMult;
      this.skills.SPACE.cooldown = Math.max(500, Math.round(heroData.skills.SPACE.cooldown * botCdrMult));
      if (this.skills.SPACE.config.speed) this.skills.SPACE.config.speed *= scale.projSpeedMult;
    }

    // Equip items & apply item stats for higher level bots
    this.inventory = getBotEquipmentForLevel(level);
    this.inventory.forEach(item => {
      if (item.statsDict) {
        if (item.statsDict.bonusHP) {
          this.maxHp += item.statsDict.bonusHP;
          this.hp = this.maxHp;
        }
        if (item.statsDict.bonusSpeed) this.speed += item.statsDict.bonusSpeed;
        if (item.statsDict.armor) this.armor += item.statsDict.armor;
        if (item.statsDict.lifesteal) this.lifesteal = Math.min(caps.MAX_LIFESTEAL, this.lifesteal + item.statsDict.lifesteal);
        if (item.statsDict.critChance) this.critChance = Math.min(caps.MAX_CRIT_CHANCE, this.critChance + item.statsDict.critChance);
        if (item.statsDict.armorPen) this.armorPen = Math.min(caps.MAX_ARMOR_PEN, this.armorPen + item.statsDict.armorPen);
        if (item.statsDict.bonusDamage && this.skills.Q && this.skills.Q.config) {
          this.skills.Q.config.damage += item.statsDict.bonusDamage;
        }
      }
    });

    // Late Game Bot Power Boost (Level >= 5) to match player's full-build + elixir scaling
    if (level >= 5) {
      const bonusDmg = (level - 4) * 25;
      const bonusHp = (level - 4) * 350;
      this.maxHp += bonusHp;
      this.hp = this.maxHp;

      if (this.skills.Q && this.skills.Q.config) {
        this.skills.Q.config.damage += bonusDmg;
      }
      if (this.skills.SPACE && this.skills.SPACE.config) {
        this.skills.SPACE.config.damage += bonusDmg * 2;
      }
    }
  }

  setTarget(target) {
    this.target = target;
  }

  update(time, delta) {
    if (this.hp <= 0) return;
    
    super.update(time, delta);

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
    
    let minDistThreshold = 280;
    let maxDistThreshold = 480;

    if (this.heroId === 'riven') {
      minDistThreshold = 80;
      maxDistThreshold = 200;
    } else if (this.heroId === 'zed') {
      minDistThreshold = 140;
      maxDistThreshold = 300;
    } else if (this.heroId === 'lux') {
      minDistThreshold = 320;
      maxDistThreshold = 520;
    } else if (this.heroId === 'jinx') {
      minDistThreshold = 260;
      maxDistThreshold = 450;
    }

    const isMelee = (this.heroId === 'riven' || this.heroId === 'zed');

    // Radial component (in / out)
    let radialX = 0;
    let radialY = 0;
    if (dist < minDistThreshold) {
      radialX = -Math.cos(angleToPlayer);
      radialY = -Math.sin(angleToPlayer);
    } else if (dist > maxDistThreshold) {
      radialX = Math.cos(angleToPlayer);
      radialY = Math.sin(angleToPlayer);
    }

    // Tangential component (Orbiting around player)
    const perpAngle = angleToPlayer + (Math.PI / 2) * this.orbitDirection;
    let tangX = Math.cos(perpAngle) * (isMelee ? 0.4 : 0.85);
    let tangY = Math.sin(perpAngle) * (isMelee ? 0.4 : 0.85);

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

  // Cast skills intelligently for all 5 champions
  updateSkillCasting(time, dist, aimX, aimY) {
    const chance = Phaser.Math.Between(1, 100);

    // 1. RIVEN AI (Smart Combo Brawler & Gap-Closer)
    if (this.heroId === 'riven') {
      const qCombo = this.rivenQCombo || 0;
      const lastQTime = this.lastRivenQStepTime || 0;

      // Real-time aim coordinates at player position
      const realTargetX = this.target.x;
      const realTargetY = this.target.y;

      // Ongoing Q Combo (Q2 or Q3): Recast Q directly aiming at target's current location!
      if (qCombo > 0 && qCombo < 3) {
        if (time >= lastQTime + 480) { // 480ms pacing between combo steps
          this.useSkill('Q', time, realTargetX, realTargetY);
        }
      }
      // Initiate Q1: Use Q to gap-close & charge target if in range (80px .. 480px)
      else if (dist > 80 && dist < 480 && chance > 35) {
        this.useSkill('Q', time, realTargetX, realTargetY);
      }

      // E Valor Dash: Use E to gap-close or shield when engaging
      if (dist > 120 && dist < 450 && chance > 60) {
        this.useSkill('E', time, realTargetX, realTargetY);
      }

      // Space Wind Slash Ultimate: Fire 3-wave fan finisher if target in range (< 420px)
      if (dist < 420 && (this.target.isRooted || this.target.hp < this.target.maxHp * 0.6 || chance > 75)) {
        this.useSkill('SPACE', time, realTargetX, realTargetY);
      }
      return;
    }

    // 2. ZED AI (Shadow Assassin)
    if (this.heroId === 'zed') {
      // Place Living Shadow near target if ready
      if (dist < 400 && chance > 70 && !this.zedShadow) {
        this.useSkill('E', time, aimX, aimY);
      }
      // Swap to shadow if active and far from target
      if (this.zedShadow && dist > 180 && chance > 80) {
        this.useSkill('E', time, aimX, aimY);
      }
      // Fire Shurikens
      if (dist < 500 && chance > 60) {
        this.useSkill('Q', time, aimX, aimY);
      }
      // Death Mark
      if (dist < 280 && chance > 80) {
        this.useSkill('SPACE', time, aimX, aimY);
      }
      return;
    }

    // 3. LUX AI (Ranged Burst Mage)
    if (this.heroId === 'lux') {
      // Light Binding Q (Root)
      if (dist < 550 && chance > 65) {
        this.useSkill('Q', time, aimX, aimY);
      }
      // Prismatic Barrier E (Shield) if low HP or in combat
      if ((this.hp < this.maxHp * 0.75 || dist < 300) && chance > 75) {
        this.useSkill('E', time, aimX, aimY);
      }
      // Final Spark Beam SPACE
      if ((dist < 650 && (this.target.isRooted || chance > 90))) {
        this.useSkill('SPACE', time, aimX, aimY);
      }
      return;
    }

    // 4. JINX AI (Aggressive Gunner)
    if (this.heroId === 'jinx') {
      // Get Excited E (Speed Boost)
      if (dist < 550 && chance > 75) {
        this.useSkill('E', time, aimX, aimY);
      }
      // Fishbones Rockets Q
      if (dist < 520 && chance > 65) {
        this.useSkill('Q', time, aimX, aimY);
      }
      // Super Mega Death Rocket SPACE
      if ((dist < 700 || this.target.hp < this.target.maxHp * 0.35) && chance > 85) {
        this.useSkill('SPACE', time, aimX, aimY);
      }
      return;
    }

    // 5. EZREAL AI (Ranged Kiter)
    if (dist < 520 && chance > 65) {
      this.useSkill('Q', time, aimX, aimY);
    }
    if (dist < 180 && chance > 85) {
      this.useSkill('E', time, aimX, aimY);
    }
    if (dist < 680 && chance > 88) {
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
    if (isSegmentIntersectingAnyPolygon(x1, y1, x2, y2, MAP_POLYGONS)) {
      return true;
    }

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
    if (isPointInAnyPolygon(x, y, MAP_POLYGONS)) {
      return true;
    }

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

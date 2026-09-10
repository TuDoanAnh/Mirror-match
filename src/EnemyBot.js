import Phaser from 'phaser';
import Player from './Player';
import { GAME_CONFIG } from './gameConfig';

export default class EnemyBot extends Player {
  constructor(scene, x, y, level = 1) {
    super(scene, x, y, true); 
    
    this.target = null; 
    
    this.moveTimer = 0;
    this.moveDirection = new Phaser.Math.Vector2(0, 0);

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
    // We do NOT call super.update(time, delta) because Player.update handles player input
    // But we need BaseCharacter.update to follow HP bar. Since Player is the super class,
    // calling Player.update would trigger player input for the bot!
    // Let's call the prototype method directly or copy the hp logic:
    if (this.hp <= 0) return;
    
    // HP Bar Follow
    this.hpBar.x = this.x - 25;
    this.hpBar.y = this.y - 30;

    if (!this.target || this.target.hp <= 0) {
      this.setVelocity(0, 0);
      return;
    }

    this.handleAim(this.target.x, this.target.y);
    const dist = Phaser.Math.Distance.Between(this.x, this.y, this.target.x, this.target.y);

    this.moveTimer -= delta;
    if (this.moveTimer <= 0) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      this.moveDirection.set(Math.cos(angle), Math.sin(angle));
      this.moveTimer = Phaser.Math.Between(500, 1500);
    }

    if (dist < 250) {
      const runAwayAngle = Phaser.Math.Angle.Between(this.target.x, this.target.y, this.x, this.y);
      this.setVelocity(Math.cos(runAwayAngle) * this.speed, Math.sin(runAwayAngle) * this.speed);
    } else if (dist > 450) {
      const runAngle = Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y);
      this.setVelocity(Math.cos(runAngle) * this.speed, Math.sin(runAngle) * this.speed);
    } else {
      this.setVelocity(this.moveDirection.x * this.speed, this.moveDirection.y * this.speed);
    }

    // Skill usage logic
    if (dist < 450 && Phaser.Math.Between(1, 100) > 95) {
      this.useSkill('Q', time, this.target.x, this.target.y);
    }
    
    if (dist > 500 && Phaser.Math.Between(1, 100) > 98) {
      this.useSkill('E', time, this.target.x, this.target.y);
    }

    if (dist < 600 && Phaser.Math.Between(1, 100) > 99) {
      this.useSkill('SPACE', time, this.target.x, this.target.y);
    }
  }
}

import Phaser from 'phaser';
import Player from './Player';

export default class EnemyBot extends Player {
  constructor(scene, x, y, level = 1) {
    super(scene, x, y, true); 
    
    this.target = null; 
    
    this.moveTimer = 0;
    this.moveDirection = new Phaser.Math.Vector2(0, 0);

    this.setLevel(level);
  }

  setLevel(level) {
    // Base level 1 stats
    this.armor = 0;
    this.critChance = 0;
    this.lifesteal = 0;
    this.armorPen = 0;

    if (level === 2) {
      this.speed *= 1.2;
      this.maxHp *= 1.2;
      this.hp = this.maxHp;
      this.armor = 25;
      this.skills.Q.config.damage *= 1.2;
      this.skills.SPACE.config.damage *= 1.2;
      this.skills.Q.cooldown *= 0.85;
      this.skills.E.cooldown *= 0.85;
      this.skills.SPACE.cooldown *= 0.85;
    } else if (level === 3) {
      this.speed *= 1.5;
      this.maxHp *= 1.5;
      this.hp = this.maxHp;
      this.armor = 50;
      this.armorPen = 10;
      this.skills.Q.config.damage *= 1.5;
      this.skills.SPACE.config.damage *= 1.5;
      this.skills.Q.cooldown *= 0.70;
      this.skills.E.cooldown *= 0.70;
      this.skills.SPACE.cooldown *= 0.70;
      this.skills.Q.config.speed *= 1.3;
      this.skills.SPACE.config.speed *= 1.3;
    } else if (level === 4) {
      this.speed *= 1.8;
      this.maxHp *= 2;
      this.hp = this.maxHp;
      this.armor = 75;
      this.armorPen = 20;
      this.critChance = 10;
      this.skills.Q.config.damage *= 2;
      this.skills.SPACE.config.damage *= 2;
      this.skills.Q.cooldown *= 0.60;
      this.skills.E.cooldown *= 0.60;
      this.skills.SPACE.cooldown *= 0.60;
      this.skills.Q.config.speed *= 1.5;
      this.skills.SPACE.config.speed *= 1.5;
    } else if (level === 5) {
      this.speed *= 2.5;
      this.maxHp *= 3.5;
      this.hp = this.maxHp;
      this.armor = 100;
      this.armorPen = 30;
      this.critChance = 25;
      this.lifesteal = 10;
      this.skills.Q.config.damage *= 3;
      this.skills.SPACE.config.damage *= 3;
      this.skills.Q.cooldown *= 0.3;
      this.skills.E.cooldown *= 0.3;
      this.skills.SPACE.cooldown *= 0.3;
      this.skills.Q.config.speed *= 2;
      this.skills.SPACE.config.speed *= 2;
    }
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

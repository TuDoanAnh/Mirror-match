import Phaser from 'phaser';
import Player from './Player';
import EnemyBot from './EnemyBot';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  init(data) {
    this.playerColor = data.color || 0x0088ff;
    this.level = data.level || 1;
  }

  create() {
    // Groups for projectiles
    this.playerProjectiles = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Sprite,
      runChildUpdate: true
    });
    
    this.enemyProjectiles = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Sprite,
      runChildUpdate: true
    });

    // Map Obstacles
    this.obstacles = this.physics.add.staticGroup();
    this.createObstacles();

    // Create entities
    this.player = new Player(this, 200, 384, false, this.playerColor);
    this.bot = new EnemyBot(this, 824, 384, this.level);
    this.bot.setTarget(this.player);

    // Entity Collisions
    this.physics.add.overlap(this.playerProjectiles, this.bot, this.handleProjectileHit, null, this);
    this.physics.add.overlap(this.enemyProjectiles, this.player, this.handleProjectileHit, null, this);

    // Obstacle Collisions
    this.physics.add.collider(this.player, this.obstacles);
    this.physics.add.collider(this.bot, this.obstacles);
    this.physics.add.collider(this.playerProjectiles, this.obstacles, this.handleProjectileObstacleHit, null, this);
    this.physics.add.collider(this.enemyProjectiles, this.obstacles, this.handleProjectileObstacleHit, null, this);

    // Ensure player/bot collide with bounds
    this.physics.world.setBounds(0, 0, 1024, 768);
    
    // UI Setup
    this.createUI();

    // Input listeners for skills
    this.input.keyboard.on('keydown-Q', () => this.tryUsePlayerSkill('Q', this.time.now));
    this.input.keyboard.on('keydown-E', () => this.tryUsePlayerSkill('E', this.time.now));
    this.input.keyboard.on('keydown-SPACE', () => this.tryUsePlayerSkill('SPACE', this.time.now));
  }

  update(time, delta) {
    if (this.player.hp > 0) this.player.update(time, delta);
    if (this.bot.hp > 0) this.bot.update(time, delta);
    
    this.updateUI(time);
    
    // Check Game Over
    if (this.player.hp <= 0 || this.bot.hp <= 0) {
      this.physics.pause();
      this.time.delayedCall(500, () => {
        const result = this.player.hp > 0 ? 'win' : 'lose';
        this.scene.start('GameOverScene', { result, level: this.level });
      });
    }
  }

  createObstacles() {
    const obstacleData = [
      { x: 312, y: 234, w: 50, h: 100 },
      { x: 712, y: 234, w: 50, h: 100 },
      { x: 312, y: 534, w: 50, h: 100 },
      { x: 712, y: 534, w: 50, h: 100 },
      { x: 512, y: 384, w: 100, h: 50 } // Center block
    ];

    obstacleData.forEach(obs => {
      const rect = this.add.rectangle(obs.x, obs.y, obs.w, obs.h, 0x4a5568, 1);
      rect.setStrokeStyle(2, 0xffffff);
      rect.setDepth(10);
      this.physics.add.existing(rect, true);
      this.obstacles.add(rect);
    });
  }

  handleProjectileObstacleHit(projectile, obstacle) {
    if (!projectile.passesThrough) {
      projectile.destroy();
    }
  }

  handleProjectileHit(entity, projectile) {
    if (!projectile.hitEntities) projectile.hitEntities = new Set();
    if (projectile.hitEntities.has(entity)) return; 
    projectile.hitEntities.add(entity);

    const attacker = projectile.attacker;
    
    let baseDamage = projectile.damage;
    let isCrit = false;

    // 1. Crit Logic
    if (attacker && Phaser.Math.Between(1, 100) <= attacker.critChance) {
      baseDamage *= 2;
      isCrit = true;
    }

    // 2. Armor & ArmorPen Logic
    const armorPen = attacker ? attacker.armorPen : 0;
    const effectiveArmor = Math.max(0, entity.armor * (1 - armorPen / 100));
    const finalDamage = baseDamage * (100 / (100 + effectiveArmor));

    // 3. Apply Damage
    entity.takeDamage(finalDamage, isCrit);

    // 4. Lifesteal Logic
    if (attacker && attacker.lifesteal > 0 && attacker.hp > 0) {
      const healAmt = finalDamage * (attacker.lifesteal / 100);
      attacker.heal(healAmt);
    }

    if (!projectile.passesThrough) {
      projectile.destroy();
    }
  }

  tryUsePlayerSkill(skillKey, time) {
    if (this.player.hp <= 0) return;
    const ptr = this.input.activePointer;
    this.player.useSkill(skillKey, time, ptr.worldX, ptr.worldY);
  }

  createUI() {
    this.uiContainer = this.add.container(512, 720);
    this.uiContainer.setDepth(100); // Draw above everything

    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.7);
    bg.fillRect(-200, -30, 400, 60);
    this.uiContainer.add(bg);

    this.cooldownTexts = {};
    const skills = ['Q', 'E', 'SPACE'];
    skills.forEach((skill, index) => {
      const x = -100 + (index * 100);
      const text = this.add.text(x, 0, `${skill}: RDY`, {
        fontSize: '20px',
        fill: '#ffffff',
        fontFamily: 'monospace'
      }).setOrigin(0.5);
      this.cooldownTexts[skill] = text;
      this.uiContainer.add(text);
    });
  }

  updateUI(time) {
    if (!this.player || this.player.hp <= 0) return;

    ['Q', 'E', 'SPACE'].forEach(skill => {
      const s = this.player.skills[skill];
      const remaining = s.lastUsed + s.cooldown - time;
      
      if (remaining > 0) {
        this.cooldownTexts[skill].setText(`${skill}: ${(remaining/1000).toFixed(1)}s`);
        this.cooldownTexts[skill].setColor('#ff0000');
      } else {
        this.cooldownTexts[skill].setText(`${skill}: RDY`);
        this.cooldownTexts[skill].setColor('#00ff00');
      }
    });
  }
}

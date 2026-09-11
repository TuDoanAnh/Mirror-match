import Phaser from 'phaser';
import Player from './Player';
import EnemyBot from './EnemyBot';
import { GAME_CONFIG } from './gameConfig';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  init(data) {
    this.playerColor = data.color || 0x0088ff;
    this.level = data.level || 1;
    this.isGameOver = false;
  }

  create() {
    this.isGameOver = false;

    // Generate texture assets isolated at x=0, y=0 with immediate graphics destruction
    this.createProjectilesTextures();

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
    
    // Use overlap instead of collider for projectiles so they don't get physically blocked!
    this.physics.add.overlap(this.playerProjectiles, this.obstacles, this.handleProjectileObstacleHit, null, this);
    this.physics.add.overlap(this.enemyProjectiles, this.obstacles, this.handleProjectileObstacleHit, null, this);

    // Ensure player/bot collide with bounds
    this.physics.world.setBounds(0, 0, 1024, 768);
    
    // UI Setup
    this.createUI();

    // Input listeners for skills
    this.input.keyboard.removeAllListeners();
    this.input.keyboard.on('keydown-Q', () => this.tryUsePlayerSkill('Q', this.time.now));
    this.input.keyboard.on('keydown-E', () => this.tryUsePlayerSkill('E', this.time.now));
    this.input.keyboard.on('keydown-SPACE', () => this.tryUsePlayerSkill('SPACE', this.time.now));

    // Fade In
    this.cameras.main.fadeIn(500, 0, 0, 0);
  }

  update(time, delta) {
    if (this.player.hp > 0) {
      this.player.update(time, delta);
    }
    if (this.bot.hp > 0 && this.player.hp > 0) {
      this.bot.update(time, delta);
    }
    
    this.updateUI(time);
    
    // Check Game Over
    if (!this.isGameOver && (this.player.hp <= 0 || this.bot.hp <= 0)) {
      this.isGameOver = true;
      const result = this.player.hp > 0 ? 'win' : 'lose';
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.time.delayedCall(500, () => {
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
    if (projectile.isExplosive) {
      this.triggerExplosion(projectile);
      projectile.destroy();
      return;
    }

    if (!projectile.passesThrough && !projectile.isPiercing) {
      projectile.destroy();
    }
  }

  handleProjectileHit(entity, projectile) {
    if (!projectile.hitEntities) projectile.hitEntities = new Set();
    if (projectile.hitEntities.has(entity)) return; 
    projectile.hitEntities.add(entity);

    // Apply Root status effect if projectile has rootDuration (e.g. Lux Q)
    if (projectile.rootDuration > 0 && typeof entity.applyRoot === 'function') {
      entity.applyRoot(projectile.rootDuration);
    }

    // Trigger explosive rocket blast if explosive (e.g. Jinx Ult)
    if (projectile.isExplosive) {
      this.triggerExplosion(projectile, entity);
      projectile.destroy();
      return;
    }

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

    if (!projectile.passesThrough && !projectile.isPiercing) {
      projectile.destroy();
    }
  }

  triggerExplosion(projectile, primaryTarget = null) {
    const x = projectile.x;
    const y = projectile.y;
    const radius = projectile.explosionRadius || 100;
    const attacker = projectile.attacker;
    const damage = projectile.damage;

    // 1. Fireball Visual Expansion
    const fireball = this.add.circle(x, y, 12, 0xff3300);
    fireball.setBlendMode('ADD');
    this.tweens.add({
      targets: fireball,
      radius: radius,
      alpha: 0,
      duration: 350,
      ease: 'Quad.easeOut',
      onComplete: () => fireball.destroy()
    });

    // 2. Inner White Core Flash
    const core = this.add.circle(x, y, 6, 0xffffff);
    core.setBlendMode('ADD');
    this.tweens.add({
      targets: core,
      radius: radius * 0.5,
      alpha: 0,
      duration: 250,
      ease: 'Quad.easeOut',
      onComplete: () => core.destroy()
    });

    // 3. Expanding Shockwave Ring
    const ring = this.add.circle(x, y, 10);
    ring.setStrokeStyle(4, 0xff0066);
    ring.setBlendMode('ADD');
    this.tweens.add({
      targets: ring,
      scale: radius / 8,
      alpha: 0,
      duration: 400,
      ease: 'Cubic.easeOut',
      onComplete: () => ring.destroy()
    });

    // 4. Spark Particles
    const particles = this.add.particles(x, y, projectile.texture.key, {
      speed: { min: 150, max: 400 },
      scale: { start: 0.6, end: 0 },
      blendMode: 'ADD',
      lifespan: 400,
      alpha: { start: 1, end: 0 }
    });
    particles.explode(25);

    // 5. Camera Shake Impact
    this.cameras.main.shake(200, 0.015);

    // 6. AOE Damage Application
    const targets = [];
    if (attacker && !attacker.isBot) {
      if (this.bot && this.bot.active && this.bot.hp > 0) targets.push(this.bot);
    } else {
      if (this.player && this.player.active && this.player.hp > 0) targets.push(this.player);
    }

    targets.forEach(ent => {
      const dist = Phaser.Math.Distance.Between(x, y, ent.x, ent.y);
      const entRadius = ent.body ? (ent.body.radius || 16) : 16;
      if (dist <= radius + entRadius) {
        let baseDamage = damage;
        let isCrit = false;

        if (attacker && Phaser.Math.Between(1, 100) <= (attacker.critChance || 0)) {
          baseDamage *= 2;
          isCrit = true;
        }

        const armorPen = attacker ? attacker.armorPen : 0;
        const effectiveArmor = Math.max(0, ent.armor * (1 - armorPen / 100));
        const finalDamage = Math.round(baseDamage * (100 / (100 + effectiveArmor)));

        ent.takeDamage(finalDamage, isCrit);

        if (attacker && attacker.lifesteal > 0 && attacker.hp > 0) {
          const healAmt = Math.round(finalDamage * (attacker.lifesteal / 100));
          attacker.heal(healAmt);
        }
      }
    });
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
    bg.fillRect(-220, -30, 440, 60);
    this.uiContainer.add(bg);

    this.cooldownTexts = {};
    const skills = ['Q', 'E', 'SPACE'];
    skills.forEach((skill, index) => {
      const x = -130 + (index * 130);
      const text = this.add.text(x, 0, `${skill}: RDY`, {
        fontSize: '18px',
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
      if (!s) return;
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

  createProjectilesTextures() {
    // Generate Trail Particle Texture ('proj_particle')
    if (!this.textures.exists('proj_particle')) {
      const gPart = this.make.graphics({ x: 0, y: 0, add: false });
      gPart.fillStyle(0xffffff, 1);
      gPart.fillCircle(8, 8, 8);
      gPart.generateTexture('proj_particle', 16, 16);
      gPart.destroy();
    }

    // Generate Q Projectile Texture ('proj_Q')
    if (!this.textures.exists('proj_Q')) {
      const gQ = this.make.graphics({ x: 0, y: 0, add: false });
      gQ.fillStyle(0x00ffff, 1);
      gQ.beginPath();
      gQ.moveTo(20, 10);
      gQ.lineTo(0, 20);
      gQ.lineTo(5, 10);
      gQ.lineTo(0, 0);
      gQ.closePath();
      gQ.fillPath();
      gQ.generateTexture('proj_Q', 20, 20);
      gQ.destroy();
    }

    // Generate Ultimate Projectile Texture ('proj_SPACE')
    if (!this.textures.exists('proj_SPACE')) {
      const gUlt = this.make.graphics({ x: 0, y: 0, add: false });
      gUlt.fillStyle(0xffaa00, 1);
      gUlt.fillEllipse(40, 60, 80, 120);
      gUlt.fillStyle(0xffffff, 1);
      gUlt.fillEllipse(40, 60, 40, 100);
      gUlt.generateTexture('proj_SPACE', 80, 120);
      gUlt.destroy();
    }
  }
}

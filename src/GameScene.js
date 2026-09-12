import Phaser from 'phaser';
import Player from './Player';
import EnemyBot from './EnemyBot';
import Creep from './Creep';
import { GAME_CONFIG } from './gameConfig';
import { preloadLuxAssets, createLuxAnimations } from './luxAnimations';
import { preloadCharacterSFX, playHitSFX } from './soundManager';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  preload() {
    preloadLuxAssets(this);
    preloadCharacterSFX(this);
  }

  init(data) {
    this.playerColor = data.color || 0x0088ff;
    this.level = data.level || 1;
    this.isGameOver = false;
  }

  create() {
    createLuxAnimations(this);
    this.isGameOver = false;

    // Generate texture assets isolated at x=0, y=0 with immediate graphics destruction
    this.createProjectilesTextures();

    // Groups for projectiles & creeps
    this.playerProjectiles = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Sprite,
      runChildUpdate: true
    });
    
    this.enemyProjectiles = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Sprite,
      runChildUpdate: true
    });

    this.creeps = this.physics.add.group({
      runChildUpdate: true
    });

    this.creepProjectiles = this.physics.add.group({
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
    
    // Creep Collisions
    this.physics.add.overlap(this.playerProjectiles, this.creeps, this.handleProjectileHit, null, this);
    this.physics.add.overlap(this.creepProjectiles, this.player, this.handleProjectileHit, null, this);

    // Obstacle & Creep Collisions
    this.physics.add.collider(this.player, this.obstacles);
    this.physics.add.collider(this.bot, this.obstacles);
    this.physics.add.collider(this.creeps, this.obstacles);
    this.physics.add.collider(this.creeps, this.creeps);
    
    // Use overlap instead of collider for projectiles so they don't get physically blocked!
    this.physics.add.overlap(this.playerProjectiles, this.obstacles, this.handleProjectileObstacleHit, null, this);
    this.physics.add.overlap(this.enemyProjectiles, this.obstacles, this.handleProjectileObstacleHit, null, this);
    this.physics.add.overlap(this.creepProjectiles, this.obstacles, this.handleProjectileObstacleHit, null, this);

    // Ensure player/bot collide with bounds
    this.physics.world.setBounds(0, 0, 1024, 768);
    
    // Creep Spawner for Level 4+
    if (this.level >= (GAME_CONFIG.CREEP_STATS.spawnMinLevel || 4)) {
      // Spawn initial 2 creeps
      this.time.delayedCall(1000, () => this.spawnCreepAroundBot());
      this.time.delayedCall(2000, () => this.spawnCreepAroundBot());

      // Spawner timer loop
      this.time.addEvent({
        delay: GAME_CONFIG.CREEP_STATS.spawnInterval || 6000,
        callback: this.spawnCreepAroundBot,
        callbackScope: this,
        loop: true
      });
    }
    
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

  handleProjectileHit(obj1, obj2) {
    let projectile = obj1;
    let entity = obj2;

    if (obj1 && typeof obj1.takeDamage === 'function') {
      entity = obj1;
      projectile = obj2;
    } else if (obj2 && typeof obj2.takeDamage === 'function') {
      entity = obj2;
      projectile = obj1;
    }

    if (!entity || !projectile || typeof entity.takeDamage !== 'function') return;

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
    
    let baseDamage = projectile.damage || 0;
    let isCrit = false;

    // 1. Crit Logic
    if (attacker && Phaser.Math.Between(1, 100) <= (attacker.critChance || 0)) {
      baseDamage *= 2;
      isCrit = true;
    }

    // 2. Armor & ArmorPen Logic
    const armorPen = attacker ? (attacker.armorPen || 0) : 0;
    const effectiveArmor = Math.max(0, (entity.armor || 0) * (1 - armorPen / 100));
    const finalDamage = baseDamage * (100 / (100 + effectiveArmor));

    // 3. Apply Damage
    entity.takeDamage(finalDamage, isCrit);
    playHitSFX(this, attacker ? attacker.heroId : 'ezreal');

    // 4. Lifesteal Logic
    if (attacker && attacker.lifesteal > 0 && attacker.hp > 0) {
      const healAmt = finalDamage * (attacker.lifesteal / 100);
      attacker.heal(healAmt);
    }

    if (!projectile.passesThrough && !projectile.isPiercing) {
      projectile.destroy();
    }
  }

  spawnCreepAroundBot() {
    if (this.isGameOver || !this.bot || !this.bot.active || this.bot.hp <= 0) return;
    if (!this.creeps) return;

    const maxCreeps = GAME_CONFIG.CREEP_STATS.maxCreeps || 3;
    if (this.creeps.countActive(true) >= maxCreeps) return;

    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const dist = Phaser.Math.Between(40, 90);
    let spawnX = this.bot.x + Math.cos(angle) * dist;
    let spawnY = this.bot.y + Math.sin(angle) * dist;

    spawnX = Phaser.Math.Clamp(spawnX, 50, 974);
    spawnY = Phaser.Math.Clamp(spawnY, 50, 718);

    const creep = new Creep(this, spawnX, spawnY);
    this.creeps.add(creep);
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
      if (this.creeps) {
        this.creeps.getChildren().forEach(c => {
          if (c.active && c.hp > 0) targets.push(c);
        });
      }
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
    this.createSkillIconsTextures();

    const heroId = this.registry.get('selectedHero') || 'ezreal';
    const heroData = GAME_CONFIG.CHARACTERS[heroId] || GAME_CONFIG.CHARACTERS.ezreal;

    this.uiContainer = this.add.container(512, 715);
    this.uiContainer.setDepth(100);

    // Frame background (Sleek dark HUD panel)
    const bg = this.add.graphics();
    bg.fillStyle(0x0f172a, 0.9);
    bg.fillRoundedRect(-145, -36, 290, 72, 8);
    bg.lineStyle(2, 0xd4af37, 0.8);
    bg.strokeRoundedRect(-145, -36, 290, 72, 8);
    this.uiContainer.add(bg);

    // Hero title badge at top of HUD
    const heroBadgeText = this.add.text(0, -26, heroData.name.toUpperCase(), {
      fontSize: '10px',
      fill: '#d4af37',
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5);
    this.uiContainer.add(heroBadgeText);

    this.skillSlots = {};
    const skills = [
      { key: 'Q', label: 'Q', x: -85 },
      { key: 'E', label: 'E', x: 0 },
      { key: 'SPACE', label: 'R', x: 85 }
    ];

    skills.forEach(skill => {
      const iconKey = `icon_${heroId}_${skill.key}`;

      // Box Background
      const boxBg = this.add.rectangle(skill.x, 3, 56, 56, 0x1e293b).setOrigin(0.5);
      
      // Icon Sprite
      const iconSprite = this.add.sprite(skill.x, 3, iconKey).setOrigin(0.5);

      // Dark Overlay (Visible during cooldown)
      const darkOverlay = this.add.rectangle(skill.x, 3, 56, 56, 0x000000, 0.5).setOrigin(0.5);
      darkOverlay.setVisible(false);

      // Border Graphics (For ready/cooldown frame border)
      const borderGraphics = this.add.graphics();
      
      // Radial Sweep Graphics (For clockwise circular clock cooldown sweep)
      const sweepGraphics = this.add.graphics();

      // Hotkey badge (Bottom-left corner of the skill square box)
      const badgeBg = this.add.rectangle(skill.x - 19, 21, 16, 14, 0x0f172a, 0.95).setOrigin(0.5);
      const badgeBorder = this.add.graphics();
      badgeBorder.lineStyle(1, 0xd4af37, 0.8);
      badgeBorder.strokeRect(skill.x - 27, 14, 16, 14);

      const badgeText = this.add.text(skill.x - 19, 21, skill.label, {
        fontSize: '11px',
        fill: '#fde047',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      // Remaining Seconds Countdown Text (Centered over box)
      const cdText = this.add.text(skill.x, 3, '', {
        fontSize: '20px',
        fill: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 5
      }).setOrigin(0.5);
      cdText.setVisible(false);

      this.uiContainer.add([
        boxBg,
        iconSprite,
        darkOverlay,
        sweepGraphics,
        borderGraphics,
        badgeBg,
        badgeBorder,
        badgeText,
        cdText
      ]);

      this.skillSlots[skill.key] = {
        x: skill.x,
        y: 3,
        boxBg,
        iconSprite,
        darkOverlay,
        borderGraphics,
        sweepGraphics,
        cdText
      };
    });
  }

  updateUI(time) {
    if (!this.player || this.player.hp <= 0) return;

    ['Q', 'E', 'SPACE'].forEach(skillKey => {
      const slot = this.skillSlots[skillKey];
      const s = this.player.skills[skillKey];
      if (!slot || !s) return;

      const remaining = s.lastUsed + s.cooldown - time;
      const totalCd = s.cooldown || 1000;

      slot.sweepGraphics.clear();
      slot.borderGraphics.clear();

      if (remaining > 0) {
        // --- ON COOLDOWN ---
        slot.darkOverlay.setVisible(true);

        // Frame border when cooling down (dim grey/blue)
        slot.borderGraphics.lineStyle(2, 0x475569, 1);
        slot.borderGraphics.strokeRect(slot.x - 28, slot.y - 28, 56, 56);

        // Clockwise Radial Sweep Pie Slice Overlay
        const progress = Math.min(1, Math.max(0, remaining / totalCd));
        const radius = 38; // Large enough to cover the 56x56 square box
        const startAngle = -Math.PI / 2; // Top (12 o'clock)
        const endAngle = startAngle + (progress * Math.PI * 2);

        slot.sweepGraphics.fillStyle(0x000000, 0.65);
        slot.sweepGraphics.beginPath();
        slot.sweepGraphics.moveTo(slot.x, slot.y);
        slot.sweepGraphics.arc(slot.x, slot.y, radius, startAngle, endAngle, false);
        slot.sweepGraphics.closePath();
        slot.sweepGraphics.fillPath();

        // Remaining seconds text (e.g. "6.2", "1.5", "0.4")
        const sec = (remaining / 1000).toFixed(1);
        slot.cdText.setText(sec);
        slot.cdText.setVisible(true);

      } else {
        // --- READY ---
        slot.darkOverlay.setVisible(false);

        // Frame border when READY (bright gold / cyan)
        slot.borderGraphics.lineStyle(2, 0xf59e0b, 1);
        slot.borderGraphics.strokeRect(slot.x - 28, slot.y - 28, 56, 56);

        // Glowing outer stroke corners
        slot.borderGraphics.lineStyle(1, 0xffffff, 0.8);
        slot.borderGraphics.strokeRect(slot.x - 29, slot.y - 29, 58, 58);

        slot.cdText.setVisible(false);
      }
    });
  }

  createSkillIconsTextures() {
    const size = 56;

    const makeIcon = (key, drawFn) => {
      if (this.textures.exists(key)) return;
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      drawFn(g, size);
      g.generateTexture(key, size, size);
      g.destroy();
    };

    // 1. Ezreal Q - Mystic Shot (Cyan Bolt)
    makeIcon('icon_ezreal_Q', (g, s) => {
      g.fillStyle(0x0a192f, 1);
      g.fillRect(0, 0, s, s);
      g.lineStyle(2, 0x38bdf8, 1);
      g.strokeRect(1, 1, s - 2, s - 2);
      g.fillStyle(0x00ffff, 1);
      g.beginPath();
      g.moveTo(s * 0.75, s * 0.25);
      g.lineTo(s * 0.25, s * 0.55);
      g.lineTo(s * 0.45, s * 0.75);
      g.closePath();
      g.fillPath();
      g.lineStyle(3, 0x38bdf8, 0.8);
      g.beginPath();
      g.moveTo(s * 0.2, s * 0.8);
      g.lineTo(s * 0.5, s * 0.5);
      g.strokePath();
    });

    // 2. Ezreal E - Arcane Shift (Golden Wings / Teleport)
    makeIcon('icon_ezreal_E', (g, s) => {
      g.fillStyle(0x1e1b4b, 1);
      g.fillRect(0, 0, s, s);
      g.lineStyle(2, 0xf59e0b, 1);
      g.strokeRect(1, 1, s - 2, s - 2);
      g.fillStyle(0xfbbf24, 1);
      g.beginPath();
      g.moveTo(s * 0.5, s * 0.2);
      g.lineTo(s * 0.8, s * 0.5);
      g.lineTo(s * 0.65, s * 0.5);
      g.lineTo(s * 0.5, s * 0.35);
      g.lineTo(s * 0.35, s * 0.5);
      g.lineTo(s * 0.2, s * 0.5);
      g.closePath();
      g.fillPath();

      g.fillStyle(0xf59e0b, 1);
      g.beginPath();
      g.moveTo(s * 0.5, s * 0.45);
      g.lineTo(s * 0.8, s * 0.75);
      g.lineTo(s * 0.65, s * 0.75);
      g.lineTo(s * 0.5, s * 0.6);
      g.lineTo(s * 0.35, s * 0.75);
      g.lineTo(s * 0.2, s * 0.75);
      g.closePath();
      g.fillPath();
    });

    // 3. Ezreal SPACE - Trueshot Barrage (Golden Crescent Wave)
    makeIcon('icon_ezreal_SPACE', (g, s) => {
      g.fillStyle(0x2d1202, 1);
      g.fillRect(0, 0, s, s);
      g.lineStyle(2, 0xf59e0b, 1);
      g.strokeRect(1, 1, s - 2, s - 2);
      g.fillStyle(0xfde047, 1);
      g.beginPath();
      g.arc(s * 0.5, s * 0.5, s * 0.35, -Math.PI * 0.6, Math.PI * 0.6, false);
      g.lineTo(s * 0.5, s * 0.5);
      g.closePath();
      g.fillPath();
    });

    // 4. Lux Q - Light Binding (Star Sphere)
    makeIcon('icon_lux_Q', (g, s) => {
      g.fillStyle(0x2e2300, 1);
      g.fillRect(0, 0, s, s);
      g.lineStyle(2, 0xfacc15, 1);
      g.strokeRect(1, 1, s - 2, s - 2);
      g.fillStyle(0xfffde7, 1);
      g.fillCircle(s * 0.5, s * 0.5, s * 0.25);
      g.lineStyle(3, 0xfacc15, 0.9);
      g.beginPath();
      g.moveTo(s * 0.15, s * 0.5); g.lineTo(s * 0.85, s * 0.5);
      g.moveTo(s * 0.5, s * 0.15); g.lineTo(s * 0.5, s * 0.85);
      g.strokePath();
    });

    // 5. Lux E - Prismatic Barrier (Prism Shield)
    makeIcon('icon_lux_E', (g, s) => {
      g.fillStyle(0x032b2b, 1);
      g.fillRect(0, 0, s, s);
      g.lineStyle(2, 0x2dd4bf, 1);
      g.strokeRect(1, 1, s - 2, s - 2);
      g.fillStyle(0x99f6e4, 0.9);
      g.beginPath();
      g.moveTo(s * 0.5, s * 0.18);
      g.lineTo(s * 0.82, s * 0.4);
      g.lineTo(s * 0.5, s * 0.82);
      g.lineTo(s * 0.18, s * 0.4);
      g.closePath();
      g.fillPath();
    });

    // 6. Lux SPACE - Final Spark (Mega Beam)
    makeIcon('icon_lux_SPACE', (g, s) => {
      g.fillStyle(0x3b3300, 1);
      g.fillRect(0, 0, s, s);
      g.lineStyle(2, 0xfef08a, 1);
      g.strokeRect(1, 1, s - 2, s - 2);
      g.fillStyle(0xfde047, 0.6);
      g.fillRect(0, s * 0.3, s, s * 0.4);
      g.fillStyle(0xffffff, 1);
      g.fillRect(0, s * 0.42, s, s * 0.16);
      g.fillCircle(s * 0.5, s * 0.5, s * 0.28);
    });

    // 7. Jinx Q - Fishbones Rockets (Triple Rocket Spread)
    makeIcon('icon_jinx_Q', (g, s) => {
      g.fillStyle(0x3b072c, 1);
      g.fillRect(0, 0, s, s);
      g.lineStyle(2, 0xf43f5e, 1);
      g.strokeRect(1, 1, s - 2, s - 2);
      [0.3, 0.5, 0.7].forEach(ratio => {
        g.fillStyle(0xf43f5e, 1);
        g.fillRect(s * ratio - 3, s * 0.35, 6, 18);
        g.beginPath();
        g.moveTo(s * ratio, s * 0.2);
        g.lineTo(s * ratio - 4, s * 0.35);
        g.lineTo(s * ratio + 4, s * 0.35);
        g.closePath();
        g.fillPath();
      });
    });

    // 8. Jinx E - Zap / Speed Rush (Lightning Bolt)
    makeIcon('icon_jinx_E', (g, s) => {
      g.fillStyle(0x062c43, 1);
      g.fillRect(0, 0, s, s);
      g.lineStyle(2, 0x06b6d4, 1);
      g.strokeRect(1, 1, s - 2, s - 2);
      g.fillStyle(0x22d3ee, 1);
      g.beginPath();
      g.moveTo(s * 0.55, s * 0.15);
      g.lineTo(s * 0.25, s * 0.52);
      g.lineTo(s * 0.48, s * 0.52);
      g.lineTo(s * 0.42, s * 0.85);
      g.lineTo(s * 0.75, s * 0.45);
      g.lineTo(s * 0.52, s * 0.45);
      g.closePath();
      g.fillPath();
    });

    // 9. Jinx SPACE - Super Mega Death Rocket (Giant Rocket Tip)
    makeIcon('icon_jinx_SPACE', (g, s) => {
      g.fillStyle(0x450a0a, 1);
      g.fillRect(0, 0, s, s);
      g.lineStyle(2, 0xef4444, 1);
      g.strokeRect(1, 1, s - 2, s - 2);
      g.fillStyle(0xd97706, 1);
      g.fillRect(s * 0.35, s * 0.4, s * 0.3, s * 0.45);
      g.fillStyle(0xdc2626, 1);
      g.beginPath();
      g.moveTo(s * 0.5, s * 0.15);
      g.lineTo(s * 0.28, s * 0.42);
      g.lineTo(s * 0.72, s * 0.42);
      g.closePath();
      g.fillPath();
      g.fillStyle(0xffffff, 1);
      g.fillCircle(s * 0.42, s * 0.5, 3);
      g.fillCircle(s * 0.58, s * 0.5, 3);
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

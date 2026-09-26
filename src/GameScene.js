import Phaser from 'phaser';
import Player from './Player';
import EnemyBot from './EnemyBot';
import Creep from './Creep';
import { GAME_CONFIG, getBotHeroForCampaignLevel } from './gameConfig';
import { preloadLuxAssets, createLuxAnimations } from './luxAnimations';
import { preloadEzrealSkillAssets, createEzrealSkillAnimations } from './ezrealSkillAnimations';
import { preloadJinxAssets, createJinxAnimations } from './jinxAnimations';
import { preloadZedSkillAssets, createZedSkillAnimations } from './zedAnimations';
import { preloadRivenSkillAssets, createRivenSkillAnimations } from './rivenAnimations';
import { preloadCharacterSFX, playHitSFX, playCustomSFX, playBattleBGM, stopBattleBGM } from './soundManager';
import { createTopRightBar } from './topRightBar';
import mapImageUrl from './assets/image/Map.png';
import { MAP_OBSTACLES } from './mapObstacles';
import { MAP_POLYGONS } from './mapPolygons';
import { handleCharacterPolygonCollision, isPointInPolygon } from './polygonCollision';
import { ALL_AUGMENTS, getRandomAugments } from './AugmentManager';
import { preloadShopItemAssets } from './shopItemLoader';
import { preloadSkillIconAssets, createSkillIconTextures } from './skillIconLoader';
import { showDamageText } from './FloatingDamage';
import { preloadAugmentFrameAssets, getAugmentFrameKey, getAugmentTierBadgeText } from './augmentFrameLoader';
import { saveGameProgress } from './playgamaSDK';
import endlessWindowUrl from './assets/image/Endless_Window.png';
import endlessReturnBtnUrl from './assets/image/Endless_Return_to_preparation.png';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  preload() {
    preloadLuxAssets(this);
    preloadEzrealSkillAssets(this);
    preloadJinxAssets(this);
    preloadZedSkillAssets(this);
    preloadRivenSkillAssets(this);
    preloadShopItemAssets(this);
    preloadCharacterSFX(this);
    preloadSkillIconAssets(this);
    preloadAugmentFrameAssets(this);
    if (!this.textures.exists('battle_map')) {
      this.load.image('battle_map', mapImageUrl);
    }
    if (!this.textures.exists('endless_window_bg')) {
      this.load.image('endless_window_bg', endlessWindowUrl);
    }
    if (!this.textures.exists('endless_return_btn')) {
      this.load.image('endless_return_btn', endlessReturnBtnUrl);
    }
  }

  init(data) {
    this.playerColor = data.color || 0x0088ff;
    this.level = data.level || 1;
    this.gameMode = data.mode || this.registry.get('gameMode') || 'campaign';
    this.isGameOver = false;
    this.skillsFired = 0;
    this.skillsHit = 0;
    this.totalDamageDealt = 0;
    this.totalDamageTaken = 0;
    this.matchStartTime = 0;
    this.isHitStopActive = false;
  }

  create() {
    createLuxAnimations(this);
    createEzrealSkillAnimations(this);
    createJinxAnimations(this);
    createZedSkillAnimations(this);
    createRivenSkillAnimations(this);
    createSkillIconTextures(this);
    this.isGameOver = false;
    this.isRespawningBot = false;
    this.isWaveIntermission = false;
    if (this.intermissionModal) {
      this.intermissionModal.destroy();
      this.intermissionModal = null;
    }
    this.matchStartTime = this.time.now;
    playBattleBGM(this);
    createTopRightBar(this);

    // Map Image Background (1536 x 1024) with soft contrast tinting
    this.add.image(768, 512, 'battle_map').setDepth(-20).setTint(0xf0f0f0);

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

    // Create Player 1 at left spawn point
    this.player = new Player(this, 280, 512, false, this.playerColor);

    if (this.gameMode === 'pvp') {
      // Setup Player 2 (P2)
      const p2Hero = this.registry.get('selectedBotHero') || 'lux';
      this.player2 = new Player(this, 1180, 512, false, 0xef4444);
      this.player2.heroId = p2Hero;
      this.player2.setupHeroTexture();

      this.physics.add.overlap(this.playerProjectiles, this.player2, this.handleProjectileHit, null, this);
      this.physics.add.overlap(this.enemyProjectiles, this.player, this.handleProjectileHit, null, this);
      this.physics.add.collider(this.player, this.obstacles);
      this.physics.add.collider(this.player2, this.obstacles);

      // Setup Player 2 Keyboard Controls (Arrow keys + U/I/O)
      this.p2Keys = this.input.keyboard.addKeys({
        up: Phaser.Input.Keyboard.KeyCodes.UP,
        down: Phaser.Input.Keyboard.KeyCodes.DOWN,
        left: Phaser.Input.Keyboard.KeyCodes.LEFT,
        right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
        u: Phaser.Input.Keyboard.KeyCodes.U,
        i: Phaser.Input.Keyboard.KeyCodes.I,
        o: Phaser.Input.Keyboard.KeyCodes.O
      });

      this.p2Keys.u.on('down', () => this.tryUseP2Skill('Q', this.time.now));
      this.p2Keys.i.on('down', () => this.tryUseP2Skill('E', this.time.now));
      this.p2Keys.o.on('down', () => this.tryUseP2Skill('SPACE', this.time.now));

    } else if (this.gameMode === 'infinity') {
      // Infinity Survival Mode Setup
      const survivalLevel = this.registry.get('survivalLevel') || 1;
      const defaultBot = GAME_CONFIG.DEFAULT_BOT_HERO_BY_LEVEL[survivalLevel] || 'ezreal';
      const selectedBotHero = this.registry.get('selectedBotHero') || defaultBot;

      this.bot = new EnemyBot(this, 1180, 512, survivalLevel, selectedBotHero);
      this.bot.setTarget(this.player);

      this.physics.add.overlap(this.playerProjectiles, this.bot, this.handleProjectileHit, null, this);
      this.physics.add.overlap(this.enemyProjectiles, this.player, this.handleProjectileHit, null, this);
      this.physics.add.overlap(this.playerProjectiles, this.creeps, this.handleProjectileHit, null, this);
      this.physics.add.overlap(this.creepProjectiles, this.player, this.handleProjectileHit, null, this);
      this.physics.add.collider(this.player, this.obstacles);
      this.physics.add.collider(this.bot, this.obstacles);
      this.physics.add.collider(this.creeps, this.obstacles);
      this.physics.add.collider(this.creeps, this.creeps);

      this.infinityWave = survivalLevel;
      this.infinityScore = this.registry.get('infinityScore') || 0;
      this.infinityKills = this.registry.get('infinityKills') || 0;

      // Spawner timer for wave creeps (only runs if survivalLevel >= 3)
      if (survivalLevel >= 3) {
        this.time.addEvent({
          delay: 6000,
          callback: () => this.spawnInfinityWave(),
          callbackScope: this,
          loop: true
        });
      }

    } else {
      // Classic Campaign Mode Setup
      const playerHero = this.registry.get('selectedHero') || 'ezreal';
      const chosenBotHero = getBotHeroForCampaignLevel(playerHero, this.level);
      this.bot = new EnemyBot(this, 1180, 512, this.level, chosenBotHero);
      this.bot.setTarget(this.player);

      this.physics.add.overlap(this.playerProjectiles, this.bot, this.handleProjectileHit, null, this);
      this.physics.add.overlap(this.enemyProjectiles, this.player, this.handleProjectileHit, null, this);
      this.physics.add.overlap(this.playerProjectiles, this.creeps, this.handleProjectileHit, null, this);
      this.physics.add.overlap(this.creepProjectiles, this.player, this.handleProjectileHit, null, this);
      this.physics.add.collider(this.player, this.obstacles);
      this.physics.add.collider(this.bot, this.obstacles);
      this.physics.add.collider(this.creeps, this.obstacles);
      this.physics.add.collider(this.creeps, this.creeps);

      if (this.level >= (GAME_CONFIG.CREEP_STATS.spawnMinLevel || 4)) {
        this.time.delayedCall(1000, () => this.spawnCreepAroundBot());
        this.time.delayedCall(2000, () => this.spawnCreepAroundBot());
        this.time.addEvent({
          delay: GAME_CONFIG.CREEP_STATS.spawnInterval || 6000,
          callback: this.spawnCreepAroundBot,
          callbackScope: this,
          loop: true
        });
      }
    }

    // Use overlap for projectiles so they don't get physically blocked
    this.physics.add.overlap(this.playerProjectiles, this.obstacles, this.handleProjectileObstacleHit, null, this);
    this.physics.add.overlap(this.enemyProjectiles, this.obstacles, this.handleProjectileObstacleHit, null, this);
    this.physics.add.overlap(this.creepProjectiles, this.obstacles, this.handleProjectileObstacleHit, null, this);

    this.physics.world.setBounds(0, 0, 1536, 1024);

    // Wind Wall Group setup for Yasuo
    this.windWalls = this.physics.add.group();
    this.physics.add.overlap(this.playerProjectiles, this.windWalls, (proj, wall) => {
      if (proj && wall && proj.attacker !== wall.owner) proj.destroy();
    });
    this.physics.add.overlap(this.enemyProjectiles, this.windWalls, (proj, wall) => {
      if (proj && wall && proj.attacker !== wall.owner) proj.destroy();
    });

    // UI Setup
    this.createUI();

    // Input listeners for skills
    this.input.keyboard.removeAllListeners();
    this.input.keyboard.on('keydown-Q', () => this.tryUsePlayerSkill('Q', this.time.now));
    this.input.keyboard.on('keydown-E', () => this.tryUsePlayerSkill('E', this.time.now));
    this.input.keyboard.on('keydown-SPACE', () => this.tryUsePlayerSkill('SPACE', this.time.now));

    // Reset camera effects & Fade In
    this.cameras.main.resetFX();
    this.cameras.main.fadeIn(300, 0, 0, 0);
  }

  update(time, delta) {
    if (this.player && this.player.hp > 0) {
      this.player.update(time, delta);
      handleCharacterPolygonCollision(this.player, MAP_POLYGONS);
      this.updateOcclusion(this.player);
      this.checkBulletTimeDodge(time);
    }

    if (this.gameMode === 'pvp') {
      if (this.player2 && this.player2.hp > 0) {
        this.handleP2Input();
        this.player2.update(time, delta);
        handleCharacterPolygonCollision(this.player2, MAP_POLYGONS);
        this.updateOcclusion(this.player2);
      }
    } else {
      if (this.bot && this.bot.hp > 0 && this.player && this.player.hp > 0) {
        this.bot.update(time, delta);
        handleCharacterPolygonCollision(this.bot, MAP_POLYGONS);
        this.updateOcclusion(this.bot);
      }
    }

    if (this.creeps) {
      this.creeps.getChildren().forEach(creep => {
        if (creep.active && creep.hp > 0) {
          handleCharacterPolygonCollision(creep, MAP_POLYGONS);
        }
      });
    }

    // Infinity Mode Wave Clear & Intermission on Boss Kill
    if (this.gameMode === 'infinity' && !this.isGameOver && this.bot && this.bot.hp <= 0 && !this.isRespawningBot && !this.isWaveIntermission) {
      this.isRespawningBot = true;
      this.isWaveIntermission = true;
      this.infinityKills = (this.infinityKills || 0) + 1;
      this.infinityScore = (this.infinityScore || 0) + 1000;

      const waveGold = 500 + (this.infinityWave || 1) * 100;
      const curGold = this.registry.get('gold') || 0;
      this.registry.set('gold', curGold + waveGold);

      showDamageText(this, 768, 250, `WAVE ${this.infinityWave || 1} CLEARED! +${waveGold}G!`, 'heal');

      // Clear all active creeps on map
      if (this.creeps) this.creeps.clear(true, true);
      if (this.creepProjectiles) this.creepProjectiles.clear(true, true);

      this.time.delayedCall(1200, () => {
        if (this.isGameOver) return;
        this.showSurvivalIntermissionModal();
      });
    }

    this.updateUI(time);

    // Check Game Over Condition
    let isGameOverCondition = false;
    if (this.gameMode === 'pvp') {
      isGameOverCondition = (this.player.hp <= 0 || (this.player2 && this.player2.hp <= 0));
    } else if (this.gameMode === 'infinity') {
      isGameOverCondition = (this.player.hp <= 0);
    } else {
      isGameOverCondition = (this.player.hp <= 0 || (this.bot && this.bot.hp <= 0));
    }

    if (!this.isGameOver && isGameOverCondition) {
      this.isGameOver = true;
      stopBattleBGM(this);

      const durationSec = Math.max(1, Math.round((this.time.now - this.matchStartTime) / 1000));
      const accuracy = this.skillsFired > 0 ? Math.round((this.skillsHit / this.skillsFired) * 100) : 100;

      this.time.timeScale = 0.35;
      if (this.physics && this.physics.world) {
        this.physics.world.timeScale = 2.86;
      }

      this.time.delayedCall(180, () => {
        this.cameras.main.fadeOut(250, 0, 0, 0);
        this.time.delayedCall(100, () => {
          this.time.timeScale = 1.0;
          if (this.physics && this.physics.world) {
            this.physics.world.timeScale = 1.0;
          }

          if (this.gameMode === 'pvp') {
            const winner = this.player.hp > 0 ? 'PLAYER 1' : 'PLAYER 2';
            this.scene.start('GameOverScene', {
              mode: 'pvp',
              winner,
              result: this.player.hp > 0 ? 'win' : 'lose',
              stats: { accuracy, durationSec, damageDealt: Math.round(this.totalDamageDealt), damageTaken: Math.round(this.totalDamageTaken) }
            });
          } else if (this.gameMode === 'infinity') {
            this.scene.start('GameOverScene', {
              mode: 'infinity',
              finalWave: this.infinityWave || 1,
              finalScore: this.infinityScore || 0,
              finalKills: this.infinityKills || 0,
              result: 'lose',
              stats: { accuracy, durationSec, damageDealt: Math.round(this.totalDamageDealt), damageTaken: Math.round(this.totalDamageTaken) }
            });
          } else {
            const isWin = this.player.hp > 0;
            this.scene.start('GameOverScene', {
              mode: 'campaign',
              result: isWin ? 'win' : 'lose',
              level: this.level,
              stats: { accuracy, durationSec, damageDealt: Math.round(this.totalDamageDealt), damageTaken: Math.round(this.totalDamageTaken) }
            });
          }
        });
      });
    }
  }

  updateOcclusion(entity) {
    if (!entity || !entity.active || entity.hp <= 0) return;

    let isOccluded = false;

    MAP_OBSTACLES.forEach(obs => {
      // Check if entity X/Y is within obstacle bounds
      const inX = entity.x >= (obs.x - obs.w / 2) && entity.x <= (obs.x + obs.w / 2);
      const inY = entity.y >= (obs.y - obs.h / 2 - 10) && entity.y <= (obs.y + obs.h / 2 + 10);

      if (inX && inY) {
        // If object allows hiding behind or is passable:
        if (obs.hideWhenBehind || obs.isPassable) {
          // If entity is ABOVE (behind) the center Y of the object
          if (entity.y < obs.y) {
            isOccluded = true;
          }
        }
      }
    });

    const targetAlpha = isOccluded ? 0.35 : 1.0;
    if (Math.abs(entity.alpha - targetAlpha) > 0.01) {
      entity.setAlpha(targetAlpha);
    }
  }

  createObstacles() {
    this.obstacleRects = [];

    MAP_OBSTACLES.forEach(obs => {
      const rect = this.add.rectangle(obs.x, obs.y, obs.w, obs.h, 0x000000, 0);
      rect.obstacleData = obs;

      // Only add to static physics group if NOT passable!
      if (!obs.isPassable) {
        this.physics.add.existing(rect, true);
        this.obstacles.add(rect);
      }

      this.obstacleRects.push(rect);
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
    const maxArmPen = GAME_CONFIG.STAT_CAPS ? GAME_CONFIG.STAT_CAPS.MAX_ARMOR_PEN : 60;
    const rawPen = attacker ? (attacker.armorPen || 0) : 0;
    const armorPen = Math.min(maxArmPen, rawPen);
    const effectiveArmor = Math.max(0, (entity.armor || 0) * (1 - armorPen / 100));
    const finalDamage = baseDamage * (100 / (100 + effectiveArmor));

    // 3. Apply Damage
    if (attacker && typeof attacker.applyDamageToTarget === 'function') {
      attacker.applyDamageToTarget(entity, finalDamage, isCrit);
    } else {
      entity.takeDamage(finalDamage, isCrit);
    }
    playHitSFX(this, attacker ? attacker.heroId : 'ezreal');

    // Track statistics & hit stop
    if (attacker === this.player) {
      this.skillsHit++;
      this.totalDamageDealt += finalDamage;
      if (this.player && typeof this.player.onSkillshotHit === 'function') {
        this.player.onSkillshotHit(entity);
      }
    } else if (entity === this.player) {
      this.totalDamageTaken += finalDamage;
    }

    if (projectile.type === 'SPACE' || projectile.isExplosive || isCrit) {
      this.triggerHitStop(45);
    }

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

    spawnX = Phaser.Math.Clamp(spawnX, 200, 1220);
    spawnY = Phaser.Math.Clamp(spawnY, 150, 880);

    const creep = new Creep(this, spawnX, spawnY, this.level);

    // Red summon ring visual effect at spawn point
    const spawnPuff = this.add.circle(spawnX, spawnY, 18, 0xef4444, 0.7);
    this.tweens.add({
      targets: spawnPuff,
      scale: 1.6,
      alpha: 0,
      duration: 350,
      onComplete: () => spawnPuff.destroy()
    });

    this.creeps.add(creep);
  }

  triggerExplosion(projectile, primaryTarget = null) {
    const x = projectile.x;
    const y = projectile.y;
    const radius = projectile.explosionRadius || 100;
    const attacker = projectile.attacker;
    const damage = projectile.damage;

    // 0. Jinx Explosion Animated Sprite
    if (this.textures.exists('jinx_explosion_spritesheet')) {
      playCustomSFX(this, 'jinx_sfx_RHit', 2.0);
      const expSprite = this.add.sprite(x, y, 'jinx_explosion_spritesheet');
      expSprite.setDepth(20);
      expSprite.setScale(radius / 90);
      if (this.anims.exists('jinx_explosion_anim')) {
        expSprite.play('jinx_explosion_anim');
      }
      expSprite.on('animationcomplete', () => expSprite.destroy());
    }

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

  triggerHitStop(durationMs = 50) {
    if (this.isHitStopActive) return;
    this.isHitStopActive = true;
    if (this.physics && this.physics.world) {
      this.physics.pause();
    }
    this.time.delayedCall(durationMs, () => {
      if (this.physics && this.physics.world) {
        this.physics.resume();
      }
      this.isHitStopActive = false;
    });
  }

  createWindWall(x, y, angle, width, height, duration = 3000, owner = null) {
    if (!this.windWalls) {
      this.windWalls = this.physics.add.group();
    }

    const wallGraphic = this.add.rectangle(x, y, width, height, 0x38bdf8, 0.65);
    wallGraphic.setRotation(angle);
    wallGraphic.setStrokeStyle(3, 0xffffff, 0.95);
    wallGraphic.setDepth(12);

    this.physics.add.existing(wallGraphic);
    wallGraphic.owner = owner;

    this.windWalls.add(wallGraphic);

    this.tweens.add({
      targets: wallGraphic,
      alpha: { start: 0.75, end: 0.25 },
      duration: 400,
      yoyo: true,
      repeat: -1
    });

    this.time.delayedCall(duration, () => {
      if (wallGraphic && wallGraphic.active) wallGraphic.destroy();
    });
  }

  tryUsePlayerSkill(skillKey, time) {
    if (this.player.hp <= 0) return;
    if (this.player.canUseSkill(skillKey, time)) {
      this.skillsFired++;
    }
    const ptr = this.input.activePointer;
    this.player.useSkill(skillKey, time, ptr.worldX, ptr.worldY);
  }

  handleP2Input() {
    if (!this.player2 || this.player2.hp <= 0 || !this.p2Keys) return;

    let vx = 0;
    let vy = 0;
    if (this.p2Keys.left.isDown) vx -= 1;
    if (this.p2Keys.right.isDown) vx += 1;
    if (this.p2Keys.up.isDown) vy -= 1;
    if (this.p2Keys.down.isDown) vy += 1;

    if (vx !== 0 && vy !== 0) {
      vx *= 0.7071;
      vy *= 0.7071;
    }

    const speed = this.player2.speed || 200;
    this.player2.setVelocity(vx * speed, vy * speed);

    if (this.player && this.player.active) {
      const angle = Phaser.Math.Angle.Between(this.player2.x, this.player2.y, this.player.x, this.player.y);
      if (Math.abs(angle) > Math.PI / 2) {
        this.player2.setFlipX(true);
      } else {
        this.player2.setFlipX(false);
      }
    }
  }

  tryUseP2Skill(skillType, time) {
    if (!this.player2 || this.player2.hp <= 0) return;
    const targetX = this.player ? this.player.x : 280;
    const targetY = this.player ? this.player.y : 512;
    const angle = Phaser.Math.Angle.Between(this.player2.x, this.player2.y, targetX, targetY);

    if (skillType === 'Q') {
      const qDamage = (this.player2.skills && this.player2.skills.Q && this.player2.skills.Q.config.damage) || 100;
      const proj = new Projectile(this, this.player2.x, this.player2.y, angle, 800, qDamage, false, 0xef4444, this.player2);
      proj.setDisplaySize(20, 20);
      this.enemyProjectiles.add(proj);
    } else if (skillType === 'E') {
      const dashDist = 180;
      const tx = Phaser.Math.Clamp(this.player2.x + Math.cos(angle) * dashDist, 50, 1486);
      const ty = Phaser.Math.Clamp(this.player2.y + Math.sin(angle) * dashDist, 50, 974);
      this.player2.setPosition(tx, ty);
      if (this.player2.body) this.player2.body.reset(tx, ty);
    } else if (skillType === 'SPACE') {
      const ultDamage = 250;
      const proj = new Projectile(this, this.player2.x, this.player2.y, angle, 950, ultDamage, true, 0xef4444, this.player2);
      proj.setDisplaySize(36, 36);
      this.enemyProjectiles.add(proj);
    }
  }

  spawnInfinityWave() {
    if (this.isGameOver || this.gameMode !== 'infinity') return;
    const survivalLevel = this.registry.get('survivalLevel') || 1;

    // Levels 1 and 2 have ZERO creeps (1v1 Pure Duel against Bot Champion)
    if (survivalLevel <= 2) return;

    // Levels 3+ capped creep spawning logic
    const maxCreeps = Math.min(5, Math.floor((survivalLevel - 1) / 2) + 1);
    const activeCreeps = this.creeps ? this.creeps.countActive() : 0;
    if (activeCreeps >= maxCreeps) return;

    const waveMult = 1 + (survivalLevel - 1) * 0.10;
    
    // Spawn creep around the enemy bot champion
    let cx = 1180, cy = 512;
    if (this.bot && this.bot.active && this.bot.hp > 0) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const dist = Phaser.Math.Between(45, 95);
      cx = this.bot.x + Math.cos(angle) * dist;
      cy = this.bot.y + Math.sin(angle) * dist;
    } else {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const dist = Phaser.Math.Between(45, 95);
      cx = 1180 + Math.cos(angle) * dist;
      cy = 512 + Math.sin(angle) * dist;
    }

    cx = Phaser.Math.Clamp(cx, 200, 1220);
    cy = Phaser.Math.Clamp(cy, 150, 880);

    const creep = new Creep(this, cx, cy);
    creep.maxHp = Math.floor(creep.maxHp * waveMult);
    creep.hp = creep.maxHp;
    creep.damage = Math.floor(creep.damage * waveMult);
    if (creep.updateHpBar) creep.updateHpBar();

    // Red summon ring visual effect at spawn point
    const spawnPuff = this.add.circle(cx, cy, 18, 0xef4444, 0.7);
    this.tweens.add({
      targets: spawnPuff,
      scale: 1.6,
      alpha: 0,
      duration: 350,
      onComplete: () => spawnPuff.destroy()
    });

    this.creeps.add(creep);
  }

  showSurvivalIntermissionModal() {
    if (this.intermissionModal) this.intermissionModal.destroy();

    const width = GAME_CONFIG.CANVAS.WIDTH;
    const height = GAME_CONFIG.CANVAS.HEIGHT;
    const centerX = width / 2;
    const centerY = height / 2;

    this.intermissionModal = this.add.container(0, 0).setDepth(5000).setScrollFactor(0);

    // Dark Glassmorphism Overlay
    const overlay = this.add.rectangle(0, 0, width, height, 0x090d16, 0.92).setOrigin(0).setInteractive();

    const survivalLevel = this.registry.get('survivalLevel') || 1;
    const isAugmentWave = (survivalLevel % 4 === 0);

    // Main Window Frame Image (Endless_Window.png) - Maximize to 1526x990 for grand full-screen scale
    const boxWidth = 1526;
    const boxHeight = 990;
    let mainBox;
    if (this.textures.exists('endless_window_bg')) {
      mainBox = this.add.image(centerX, centerY, 'endless_window_bg');
      mainBox.setDisplaySize(boxWidth, boxHeight);
    } else {
      mainBox = this.add.rectangle(centerX, centerY, boxWidth, boxHeight, 0x0f172a, 0.98);
      mainBox.setStrokeStyle(3, isAugmentWave ? 0xa855f7 : 0x38bdf8);
    }

    // Title positioned cleanly at top of inner cavity
    const titleY = isAugmentWave ? (centerY - 315) : (centerY - 170);
    const titleTxt = this.add.text(centerX, titleY, `SURVIVAL LEVEL ${survivalLevel} CLEARED!`, {
      fontSize: isAugmentWave ? '32px' : '36px',
      fill: '#facc15',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5);

    const goldEarned = 500 + survivalLevel * 100;
    let currentGold = this.registry.get('gold') || 0;
    const subTxt = this.add.text(centerX, titleY + (isAugmentWave ? 44 : 58), `Reward: +${goldEarned}G  •  Total Gold: ${currentGold}G  •  Score: ${this.infinityScore || 0}`, {
      fontSize: isAugmentWave ? '18px' : '20px',
      fill: '#38bdf8',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.intermissionModal.add([overlay, mainBox, titleTxt, subTxt]);

    let selectedAugmentObj = null;

    if (isAugmentWave) {
      // Augment Perk Selection Section (Every 4 Waves)
      const perksTitle = this.add.text(centerX, titleY + 84, "CHOOSE 1 FREE AUGMENT PERK", {
        fontSize: '22px',
        fill: '#a855f7',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4
      }).setOrigin(0.5);
      this.intermissionModal.add(perksTitle);

      const heroId = this.player ? this.player.heroId : 'ezreal';
      const ownedAugments = this.registry.get('augments') || [];
      const randomAugments = getRandomAugments(3, ownedAugments, heroId);

      // Enlarged Card proportions (375 wide x 440 tall) to fill out the inner cavity generously
      const cardWidth = 375;
      const cardHeight = 440;
      const cardY = centerY + 18;
      const cardGap = 395;
      const startCardX = centerX - cardGap;

      const cardItems = [];

      randomAugments.forEach((aug, idx) => {
        const cardX = startCardX + (idx * cardGap);
        const cardContainer = this.add.container(cardX, cardY);

        // Interactive Card Frame Box
        const cardBg = this.add.rectangle(0, 0, cardWidth, cardHeight, 0x0f172a, 0.95).setInteractive({ useHandCursor: true });
        cardBg.setStrokeStyle(2, aug.color || 0x38bdf8, 0.8);

        // Frame Image Overlay (Silver / Gold / Diamond PNG frame)
        const frameKey = getAugmentFrameKey(aug);
        let frameImg = null;
        if (this.textures.exists(frameKey)) {
          frameImg = this.add.image(0, 0, frameKey);
          frameImg.setDisplaySize(cardWidth, cardHeight);
        }

        // Augment Tier Badge (Silver / Gold / Diamond)
        const tierBadgeStr = getAugmentTierBadgeText(aug);
        const tierTxt = this.add.text(0, -cardHeight / 2 + 36, tierBadgeStr, {
          fontSize: '15px',
          fill: '#fde047',
          fontStyle: 'bold',
          stroke: '#000000',
          strokeThickness: 4
        }).setOrigin(0.5);

        // Augment Icon Display
        const iconBg = this.add.circle(0, -100, 38, aug.color || 0x38bdf8, 0.25);
        iconBg.setStrokeStyle(2.5, aug.color || 0x38bdf8, 0.9);
        const iconTxt = this.add.text(0, -100, aug.icon || '⚡', { fontSize: '42px' }).setOrigin(0.5);

        // Augment Name
        const nameTxt = this.add.text(0, -22, aug.name, {
          fontSize: '21px',
          fill: '#ffffff',
          fontStyle: 'bold',
          stroke: '#000000',
          strokeThickness: 4
        }).setOrigin(0.5);

        // Divider Line
        const divLine = this.add.rectangle(0, 16, 260, 2, 0x38bdf8, 0.6);

        // Augment Description Text
        const descTxt = this.add.text(0, 32, aug.desc, {
          fontSize: '15px',
          fill: '#cbd5e1',
          align: 'center',
          wordWrap: { width: 290 },
          lineSpacing: 4
        }).setOrigin(0.5, 0);

        const elements = [cardBg];
        if (frameImg) elements.push(frameImg);
        elements.push(tierTxt, iconBg, iconTxt, nameTxt, divLine, descTxt);

        cardContainer.add(elements);
        this.intermissionModal.add(cardContainer);

        // Highlight selection helper
        const setCardHighlight = (isSelected) => {
          if (isSelected) {
            cardBg.setStrokeStyle(4, 0xfacc15, 1.0);
            cardBg.setFillStyle(0x1e293b, 1.0);
            cardContainer.setScale(1.04);
          } else {
            cardBg.setStrokeStyle(2, aug.color || 0x38bdf8, 0.6);
            cardBg.setFillStyle(0x0f172a, 0.95);
            cardContainer.setScale(1.0);
          }
        };

        // Default select first card
        if (idx === 0) {
          selectedAugmentObj = aug;
          setCardHighlight(true);
        }

        cardBg.on('pointerdown', () => {
          selectedAugmentObj = aug;
          cardItems.forEach(ci => ci.setHighlight(ci.augObj === aug));
        });

        cardBg.on('pointerover', () => {
          if (selectedAugmentObj !== aug) {
            cardBg.setStrokeStyle(3, 0xffffff, 0.9);
            this.tweens.killTweensOf(cardContainer);
            this.tweens.add({ targets: cardContainer, scale: 1.02, duration: 100 });
          }
        });
        cardBg.on('pointerout', () => {
          if (selectedAugmentObj !== aug) {
            cardBg.setStrokeStyle(2, aug.color || 0x38bdf8, 0.6);
            this.tweens.killTweensOf(cardContainer);
            this.tweens.add({ targets: cardContainer, scale: 1.0, duration: 100 });
          }
        });

        cardItems.push({ augObj: aug, setHighlight: setCardHighlight });
      });

    } else {
      // Non-Augment Wave Intermission (Waves 1, 2, 3, 5, 6, 7...)
      const nextAugmentWaveCount = 4 - (survivalLevel % 4);
      const infoTxt = this.add.text(centerX, centerY + 20, `Next Augment Perk choice available in ${nextAugmentWaveCount} wave(s)`, {
        fontSize: '24px',
        fill: '#cbd5e1',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      this.intermissionModal.add(infoTxt);
    }

    // Return to Preparation Image Button (Endless_Return_to_preparation.png)
    const btnY = isAugmentWave ? (centerY + 300) : (centerY + 200);
    let returnBtn;
    let returnTxt;

    if (this.textures.exists('endless_return_btn')) {
      returnBtn = this.add.image(centerX, btnY, 'endless_return_btn').setInteractive({ useHandCursor: true });
      returnBtn.setDisplaySize(440, 56);
      returnTxt = this.add.text(centerX, btnY, `RETURN TO PREPARATION`, {
        fontSize: '18px',
        fill: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 5
      }).setOrigin(0.5);
    } else {
      returnBtn = this.add.rectangle(centerX, btnY, 440, 54, 0x22c55e).setInteractive({ useHandCursor: true });
      returnBtn.setStrokeStyle(2, 0xffffff);
      returnTxt = this.add.text(centerX, btnY, `RETURN TO PREPARATION`, {
        fontSize: '18px',
        fill: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4
      }).setOrigin(0.5);
    }

    const baseBtnScaleX = returnBtn.scaleX;
    const baseBtnScaleY = returnBtn.scaleY;

    returnBtn.on('pointerover', () => {
      this.tweens.killTweensOf(returnBtn);
      this.tweens.add({ targets: returnBtn, scaleX: baseBtnScaleX * 1.05, scaleY: baseBtnScaleY * 1.05, duration: 100 });
      this.tweens.killTweensOf(returnTxt);
      this.tweens.add({ targets: returnTxt, scale: 1.05, duration: 100 });
    });

    returnBtn.on('pointerout', () => {
      this.tweens.killTweensOf(returnBtn);
      this.tweens.add({ targets: returnBtn, scaleX: baseBtnScaleX, scaleY: baseBtnScaleY, duration: 100 });
      this.tweens.killTweensOf(returnTxt);
      this.tweens.add({ targets: returnTxt, scale: 1.0, duration: 100 });
    });

    returnBtn.on('pointerdown', () => {
      // Save selected augment if on augment wave
      if (isAugmentWave && selectedAugmentObj) {
        const augList = this.registry.get('augments') || [];
        if (selectedAugmentObj.isRepeatable) {
          augList.push(selectedAugmentObj);
          this.registry.set('augments', augList);

          let stats = this.registry.get('playerStats') || {};
          if (selectedAugmentObj.statsDict) {
            Object.keys(selectedAugmentObj.statsDict).forEach(k => {
              stats[k] = (stats[k] || 0) + selectedAugmentObj.statsDict[k];
            });
          }
          this.registry.set('playerStats', stats);
        } else {
          if (!augList.some(a => (a.id || a) === selectedAugmentObj.id)) {
            augList.push(selectedAugmentObj);
            this.registry.set('augments', augList);
          }
        }
      }

      // Advance to next survival level
      const nextLevel = survivalLevel + 1;
      this.registry.set('survivalLevel', nextLevel);
      this.registry.set('infinityScore', this.infinityScore || 0);
      this.registry.set('infinityKills', this.infinityKills || 0);
      saveGameProgress(this);

      stopBattleBGM(this);
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('PreparationScene');
      });
    });

    this.intermissionModal.add([returnBtn, returnTxt]);
  }

  createUI() {
    createSkillIconTextures(this);

    if (this.gameMode === 'infinity') {
      const survivalLevel = this.registry.get('survivalLevel') || 1;
      this.modeBannerTxt = this.add.text(768, 22, `SURVIVAL LEVEL ${survivalLevel}  •  SCORE: ${this.infinityScore || 0}  •  KILLS: ${this.infinityKills || 0}`, {
        fontSize: '16px',
        fill: '#facc15',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4
      }).setOrigin(0.5).setScrollFactor(0).setDepth(200);
    } else if (this.gameMode === 'pvp') {
      this.modeBannerTxt = this.add.text(768, 22, "⚔️ 1v1 LOCAL PVP ARENA ⚔️", {
        fontSize: '16px',
        fill: '#ef4444',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4
      }).setOrigin(0.5).setScrollFactor(0).setDepth(200);
    }

    const heroId = this.registry.get('selectedHero') || 'ezreal';
    const heroData = GAME_CONFIG.CHARACTERS[heroId] || GAME_CONFIG.CHARACTERS.ezreal;

    this.uiContainer = this.add.container(768, 968);
    this.uiContainer.setDepth(100);

    // Active Augments HUD Badges (Top-Left Corner)
    const ownedAugs = this.registry.get('augments') || [];
    if (ownedAugs.length > 0) {
      const augHud = this.add.container(20, 20);
      augHud.setScrollFactor(0);
      augHud.setDepth(200);

      const titleTxt = this.add.text(0, 0, "AUGMENTS:", {
        fontSize: '10px',
        fill: '#fde047',
        fontStyle: 'bold'
      });
      augHud.add(titleTxt);

      ownedAugs.forEach((aug, i) => {
        const augData = typeof aug === 'string' ? ALL_AUGMENTS.find(a => a.id === aug) : aug;
        if (!augData) return;

        const x = i * 38;
        const y = 14;

        const box = this.add.rectangle(x + 14, y + 14, 30, 30, 0x0f172a, 0.9).setInteractive({ useHandCursor: true });
        box.setStrokeStyle(1.5, augData.color || 0x38bdf8);

        const icon = this.add.text(x + 14, y + 14, augData.icon || '⚡', { fontSize: '15px' }).setOrigin(0.5);

        augHud.add([box, icon]);

        box.on('pointerover', (ptr) => {
          this.showAugmentTooltip(augData, ptr.worldX, ptr.worldY);
        });
        box.on('pointerout', () => {
          this.hideAugmentTooltip();
        });
      });
    }

    // Frame background (Sleek dark HUD panel accommodating skills & 6 item slots)
    const bg = this.add.graphics();
    bg.fillStyle(0x0f172a, 0.9);
    bg.fillRoundedRect(-145, -36, 545, 72, 8);
    bg.lineStyle(2, 0xd4af37, 0.8);
    bg.strokeRoundedRect(-145, -36, 545, 72, 8);
    this.uiContainer.add(bg);

    // Hero title badge at top of HUD
    const heroBadgeText = this.add.text(-25, -26, heroData.name.toUpperCase(), {
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
      iconSprite.setDisplaySize(52, 52);

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

    // 6 Active & Inventory Item HUD Slots (Keys 1, 2, 3, 4, 5, 6)
    this.itemSlots = [];
    const activeHotkeys = ['1', '2', '3', '4', '5', '6'];
    const itemStartX = 152;
    const itemGap = 41;

    for (let i = 0; i < 6; i++) {
      const ix = itemStartX + (i * itemGap);
      const iy = 3;

      // Divider line between skills and items
      if (i === 0) {
        const div = this.add.rectangle(ix - 23, iy, 1.5, 50, 0x38bdf8, 0.5);
        this.uiContainer.add(div);
      }

      // Slot Box Background
      const itemBoxBg = this.add.rectangle(ix, iy, 36, 36, 0x0f172a, 0.95).setOrigin(0.5).setInteractive({ useHandCursor: true });
      itemBoxBg.setStrokeStyle(1.5, 0x334155);

      // Item Icon Image
      const itemIcon = this.add.image(ix, iy, 'item_doransBlade').setOrigin(0.5).setVisible(false);
      itemIcon.setDisplaySize(28, 28);

      // Dark Overlay on Cooldown
      const itemDarkOverlay = this.add.rectangle(ix, iy, 36, 36, 0x000000, 0.4).setOrigin(0.5).setVisible(false);

      // Radial Pie Cooldown Arc Sweep Graphics
      const itemSweepGfx = this.add.graphics();

      // Border Graphics
      const itemBorderGfx = this.add.graphics();

      // Hotkey Badge
      const itemBadgeBg = this.add.rectangle(ix - 11, iy + 12, 13, 11, 0x0f172a, 0.95).setOrigin(0.5);
      const itemBadgeTxt = this.add.text(ix - 11, iy + 12, activeHotkeys[i], {
        fontSize: '9px',
        fill: '#fde047',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      // Cooldown text
      const itemCdTxt = this.add.text(ix, iy, '', {
        fontSize: '11px',
        fill: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3
      }).setOrigin(0.5).setVisible(false);

      this.uiContainer.add([itemBoxBg, itemIcon, itemDarkOverlay, itemSweepGfx, itemBorderGfx, itemBadgeBg, itemBadgeTxt, itemCdTxt]);

      itemBoxBg.on('pointerdown', () => {
        if (this.player && this.player.active) {
          this.player.useActiveItemBySlot(i);
        }
      });

      this.itemSlots.push({
        boxBg: itemBoxBg,
        icon: itemIcon,
        darkOverlay: itemDarkOverlay,
        sweepGfx: itemSweepGfx,
        borderGfx: itemBorderGfx,
        cdTxt: itemCdTxt,
        index: i
      });
    }
  }

  updateUI(time) {
    if (!this.player || this.player.hp <= 0) return;

    if (this.gameMode === 'infinity' && this.modeBannerTxt) {
      const survivalLevel = this.registry.get('survivalLevel') || 1;
      this.modeBannerTxt.setText(`SURVIVAL LEVEL ${survivalLevel}  •  SCORE: ${this.infinityScore || 0}  •  KILLS: ${this.infinityKills || 0}`);
    }

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

    // Update 6 Inventory & Active Items HUD Slots
    const inv = this.registry.get('inventory') || [];
    if (this.itemSlots) {
      this.itemSlots.forEach((slot, i) => {
        if (slot.sweepGfx) slot.sweepGfx.clear();
        if (slot.borderGfx) slot.borderGfx.clear();

        if (i < inv.length) {
          const item = inv[i];
          const iconKey = `item_${item.id}`;
          if (this.textures.exists(iconKey)) {
            slot.icon.setTexture(iconKey).setDisplaySize(28, 28).setVisible(true);
          } else {
            slot.icon.setVisible(false);
          }

          const isActiveItem = ['zhonya', 'qss', 'rocketbelt', 'healthPotion'].includes(item.id);
          const cdData = (isActiveItem && this.player.activeCooldownData) ? this.player.activeCooldownData[item.id] : null;
          const cdMs = (isActiveItem && this.player.activeCooldowns && this.player.activeCooldowns[item.id]) ? (this.player.activeCooldowns[item.id] - time) : 0;

          if (cdMs > 0 && cdData) {
            slot.darkOverlay.setVisible(true);

            // Clockwise Radial Sweep Pie Slice Overlay for Active Item
            const totalCd = cdData.duration || 20000;
            const progress = Math.min(1, Math.max(0, cdMs / totalCd));
            const radius = 24;
            const startAngle = -Math.PI / 2;
            const endAngle = startAngle + (progress * Math.PI * 2);

            slot.sweepGfx.fillStyle(0x000000, 0.65);
            slot.sweepGfx.beginPath();
            slot.sweepGfx.moveTo(slot.boxBg.x, slot.boxBg.y);
            slot.sweepGfx.arc(slot.boxBg.x, slot.boxBg.y, radius, startAngle, endAngle, false);
            slot.sweepGfx.closePath();
            slot.sweepGfx.fillPath();

            // Border stroke during cooldown (dim slate)
            slot.borderGfx.lineStyle(1.5, 0x475569, 1);
            slot.borderGfx.strokeRect(slot.boxBg.x - 18, slot.boxBg.y - 18, 36, 36);

            // Remaining seconds text
            const sec = (cdMs / 1000).toFixed(1);
            slot.cdTxt.setText(sec).setVisible(true);

          } else if (isActiveItem) {
            slot.darkOverlay.setVisible(false);

            // Bright Cyan Glowing Border stroke when READY
            slot.borderGfx.lineStyle(2, 0x38bdf8, 1);
            slot.borderGfx.strokeRect(slot.boxBg.x - 18, slot.boxBg.y - 18, 36, 36);
            slot.borderGfx.lineStyle(1, 0xffffff, 0.7);
            slot.borderGfx.strokeRect(slot.boxBg.x - 19, slot.boxBg.y - 19, 38, 38);

            slot.cdTxt.setVisible(false);
          } else {
            slot.darkOverlay.setVisible(false);
            slot.borderGfx.lineStyle(1, 0x64748b, 0.8);
            slot.borderGfx.strokeRect(slot.boxBg.x - 18, slot.boxBg.y - 18, 36, 36);
            slot.cdTxt.setVisible(false);
          }
        } else {
          slot.icon.setVisible(false);
          slot.darkOverlay.setVisible(false);
          slot.cdTxt.setVisible(false);
          slot.borderGfx.lineStyle(1, 0x1e293b, 0.5);
          slot.borderGfx.strokeRect(slot.boxBg.x - 18, slot.boxBg.y - 18, 36, 36);
        }
      });
    }
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

  checkBulletTimeDodge(time) {
    if (!this.player || !this.player.active || !this.player.hasBulletTime) return;
    if (time - (this.player.lastBulletTimeTrigger || 0) < 5000) return;

    if (!this.enemyProjectiles) return;
    const enemyProjs = this.enemyProjectiles.getChildren();
    enemyProjs.forEach(proj => {
      if (proj.attacker === this.bot && proj.active) {
        const dist = Phaser.Math.Distance.Between(proj.x, proj.y, this.player.x, this.player.y);
        if (dist > 28 && dist < 75) {
          this.player.triggerBulletTime(time);
        }
      }
    });
  }

  showAugmentTooltip(augData, x, y) {
    this.hideAugmentTooltip();

    this.activeAugTooltip = this.add.container(x + 10, y + 10);
    this.activeAugTooltip.setScrollFactor(0);
    this.activeAugTooltip.setDepth(2500);

    const bg = this.add.rectangle(0, 0, 220, 70, 0x090d16, 0.95).setOrigin(0);
    bg.setStrokeStyle(1.5, augData.color || 0x38bdf8);

    const title = this.add.text(10, 8, `${augData.icon} ${augData.name}`, {
      fontSize: '13px',
      fill: '#ffffff',
      fontStyle: 'bold'
    });

    const desc = this.add.text(10, 28, augData.desc, {
      fontSize: '11px',
      fill: '#cbd5e1',
      wordWrap: { width: 200 }
    });

    this.activeAugTooltip.add([bg, title, desc]);
  }

  hideAugmentTooltip() {
    if (this.activeAugTooltip) {
      this.activeAugTooltip.destroy();
      this.activeAugTooltip = null;
    }
  }
}

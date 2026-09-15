import Phaser from 'phaser';
import Player from './Player';
import EnemyBot from './EnemyBot';
import Creep from './Creep';
import { GAME_CONFIG } from './gameConfig';
import { preloadLuxAssets, createLuxAnimations } from './luxAnimations';
import { preloadEzrealSkillAssets, createEzrealSkillAnimations } from './ezrealSkillAnimations';
import { preloadJinxAssets, createJinxAnimations } from './jinxAnimations';
import { preloadZedSkillAssets, createZedSkillAnimations } from './zedAnimations';
import { preloadRivenSkillAssets, createRivenSkillAnimations } from './rivenAnimations';
import { preloadCharacterSFX, playHitSFX, playCustomSFX, playBattleBGM, stopBattleBGM } from './soundManager';
import mapImageUrl from './assets/image/Map.png';
import { MAP_OBSTACLES } from './mapObstacles';
import { MAP_POLYGONS } from './mapPolygons';
import { handleCharacterPolygonCollision, isPointInPolygon } from './polygonCollision';
import { ALL_AUGMENTS } from './AugmentManager';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
    this.isDebugMode = false;
  }

  preload() {
    preloadLuxAssets(this);
    preloadEzrealSkillAssets(this);
    preloadJinxAssets(this);
    preloadZedSkillAssets(this);
    preloadRivenSkillAssets(this);
    preloadCharacterSFX(this);
    if (!this.textures.exists('battle_map')) {
      this.load.image('battle_map', mapImageUrl);
    }
  }

  init(data) {
    this.playerColor = data.color || 0x0088ff;
    this.level = data.level || 1;
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
    this.isGameOver = false;
    this.matchStartTime = this.time.now;
    playBattleBGM(this);

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

    // Create entities at map spawn points
    this.player = new Player(this, 280, 512, false, this.playerColor);
    
    // Bot Hero Selection: uses selectedBotHero or default level bot hero
    const defaultBot = GAME_CONFIG.DEFAULT_BOT_HERO_BY_LEVEL[this.level] || 'ezreal';
    const chosenBotHero = this.registry.get('selectedBotHero') || defaultBot;
    this.bot = new EnemyBot(this, 1180, 512, this.level, chosenBotHero);

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

    // Ensure player/bot collide with bounds (1536 x 1024)
    this.physics.world.setBounds(0, 0, 1536, 1024);
    
    // Wind Wall Group setup for Yasuo
    this.windWalls = this.physics.add.group();
    this.physics.add.overlap(this.playerProjectiles, this.windWalls, (proj, wall) => {
      if (proj && wall && proj.attacker !== wall.owner) proj.destroy();
    });
    this.physics.add.overlap(this.enemyProjectiles, this.windWalls, (proj, wall) => {
      if (proj && wall && proj.attacker !== wall.owner) proj.destroy();
    });

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
    this.createDebugToggleButton();

    // Input listeners for skills & debug toggle (Press 'B' to toggle debug colliders)
    this.input.keyboard.removeAllListeners();
    this.input.keyboard.on('keydown-Q', () => this.tryUsePlayerSkill('Q', this.time.now));
    this.input.keyboard.on('keydown-E', () => this.tryUsePlayerSkill('E', this.time.now));
    this.input.keyboard.on('keydown-SPACE', () => this.tryUsePlayerSkill('SPACE', this.time.now));
    this.input.keyboard.on('keydown-B', () => this.toggleDebugMode());

    // Reset camera effects & Fade In
    this.cameras.main.resetFX();
    this.cameras.main.fadeIn(300, 0, 0, 0);
  }

  update(time, delta) {
    if (this.player.hp > 0) {
      this.player.update(time, delta);
      handleCharacterPolygonCollision(this.player, MAP_POLYGONS);
      this.updateOcclusion(this.player);
      this.checkBulletTimeDodge(time);
    }
    if (this.bot.hp > 0 && this.player.hp > 0) {
      this.bot.update(time, delta);
      handleCharacterPolygonCollision(this.bot, MAP_POLYGONS);
      this.updateOcclusion(this.bot);
    }

    if (this.creeps) {
      this.creeps.getChildren().forEach(creep => {
        if (creep.active && creep.hp > 0) {
          handleCharacterPolygonCollision(creep, MAP_POLYGONS);
        }
      });
    }
    
    this.updateUI(time);
    
    // Check Game Over
    if (!this.isGameOver && (this.player.hp <= 0 || this.bot.hp <= 0)) {
      this.isGameOver = true;
      stopBattleBGM(this);
      const isWin = this.player.hp > 0;
      const result = isWin ? 'win' : 'lose';
      const loser = isWin ? this.bot : this.player;

      // Snappy Slow-Motion Finish & Fast Camera Zoom
      this.time.timeScale = 0.35;
      if (this.physics && this.physics.world) {
        this.physics.world.timeScale = 2.86;
      }

      if (loser && loser.active) {
        this.cameras.main.pan(loser.x, loser.y, 350, 'Power2');
        this.cameras.main.zoomTo(1.25, 350, 'Power2');
      }

      this.cameras.main.shake(200, 0.015);

      const durationSec = Math.max(1, Math.round((this.time.now - this.matchStartTime) / 1000));
      const accuracy = this.skillsFired > 0 ? Math.round((this.skillsHit / this.skillsFired) * 100) : 100;

      // Fast transition (180ms scaled = ~500ms real time)
      this.time.delayedCall(180, () => {
        this.cameras.main.fadeOut(250, 0, 0, 0);
        this.time.delayedCall(100, () => {
          this.time.timeScale = 1.0;
          if (this.physics && this.physics.world) {
            this.physics.world.timeScale = 1.0;
          }
          this.cameras.main.setZoom(1.0);
          this.scene.start('GameOverScene', {
            result,
            level: this.level,
            stats: {
              skillsFired: this.skillsFired,
              skillsHit: this.skillsHit,
              accuracy,
              durationSec,
              damageDealt: Math.round(this.totalDamageDealt),
              damageTaken: Math.round(this.totalDamageTaken)
            }
          });
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

    // Handle map click for drawing new polygon points in drawing mode
    this.input.on('pointerdown', (pointer) => {
      if (this.isDebugMode && this.isDrawingPolygonMode && this.activeDrawingPolygon) {
        if (pointer.y < 65) return; // Skip clicking on UI toolbar buttons at top
        const wx = Math.round(pointer.worldX);
        const wy = Math.round(pointer.worldY);
        this.activeDrawingPolygon.points.push({ x: wx, y: wy });
        this.renderDebugOverlay();
      }
    });
  }

  createDebugToggleButton() {
    // Top Debug Bar Container
    const toolbar = this.add.container(0, 0);
    toolbar.setScrollFactor(0);
    toolbar.setDepth(2000);

    // 1. Toggle Debug Mode Button (x=130, y=28)
    const bg = this.add.rectangle(130, 28, 230, 36, 0x0f172a, 0.95).setInteractive({ useHandCursor: true });
    bg.setStrokeStyle(2, 0x38bdf8);

    const txt = this.add.text(130, 28, '🛠️ DEBUG COLLIDER (Key B)', {
      fontSize: '11px',
      fill: '#38bdf8',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    bg.on('pointerdown', () => this.toggleDebugMode());
    bg.on('pointerover', () => bg.setFillStyle(0x1e293b, 1));
    bg.on('pointerout', () => bg.setFillStyle(0x0f172a, 0.95));

    // 2. Draw New Polygon Button (x=330, y=28)
    const drawBtnBg = this.add.rectangle(330, 28, 155, 36, 0x1e1b4b, 0.95).setInteractive({ useHandCursor: true });
    drawBtnBg.setStrokeStyle(2, 0x818cf8);

    const drawBtnTxt = this.add.text(330, 28, '➕ DRAW NEW POLYGON', {
      fontSize: '11px',
      fill: '#a5b4fc',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    drawBtnBg.on('pointerdown', () => this.togglePolygonDrawingMode());
    drawBtnBg.on('pointerover', () => drawBtnBg.setFillStyle(0x312e81, 1));
    drawBtnBg.on('pointerout', () => drawBtnBg.setFillStyle(this.isDrawingPolygonMode ? 0x065f46 : 0x1e1b4b, 0.95));

    // 3. Copy Polygon Coordinates Button (x=505, y=28)
    const copyPolyBg = this.add.rectangle(505, 28, 175, 36, 0x064e3b, 0.95).setInteractive({ useHandCursor: true });
    copyPolyBg.setStrokeStyle(2, 0x34d399);

    const copyPolyTxt = this.add.text(505, 28, '📋 COPY MAP_POLYGONS', {
      fontSize: '11px',
      fill: '#6ee7b7',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    copyPolyBg.on('pointerdown', () => this.exportPolygonCoordinates());
    copyPolyBg.on('pointerover', () => copyPolyBg.setFillStyle(0x065f46, 1));
    copyPolyBg.on('pointerout', () => copyPolyBg.setFillStyle(0x064e3b, 0.95));

    // 4. Undo Point Button (x=650, y=28)
    const undoBg = this.add.rectangle(650, 28, 95, 36, 0x7c2d12, 0.95).setInteractive({ useHandCursor: true });
    undoBg.setStrokeStyle(2, 0xf97316);

    const undoTxt = this.add.text(650, 28, '↩️ UNDO POINT', {
      fontSize: '10px',
      fill: '#ffedd5',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    undoBg.on('pointerdown', () => this.undoLastPolygonPoint());

    toolbar.add([bg, txt, drawBtnBg, drawBtnTxt, copyPolyBg, copyPolyTxt, undoBg, undoTxt]);

    this.debugBtnText = txt;
    this.drawBtnBg = drawBtnBg;
    this.drawBtnTxt = drawBtnTxt;
  }

  togglePolygonDrawingMode() {
    if (!this.isDebugMode) {
      this.toggleDebugMode();
    }

    this.isDrawingPolygonMode = !this.isDrawingPolygonMode;

    if (this.isDrawingPolygonMode) {
      const newPolyName = `Polygon_${MAP_POLYGONS.length + 1}`;
      this.activeDrawingPolygon = {
        name: newPolyName,
        points: []
      };
      MAP_POLYGONS.push(this.activeDrawingPolygon);

      if (this.drawBtnBg) this.drawBtnBg.setFillStyle(0x065f46, 1);
      if (this.drawBtnTxt) this.drawBtnTxt.setText('✅ FINISH DRAWING');
    } else {
      // Remove active polygon if it has fewer than 3 points
      if (this.activeDrawingPolygon && this.activeDrawingPolygon.points.length < 3) {
        const idx = MAP_POLYGONS.indexOf(this.activeDrawingPolygon);
        if (idx !== -1) MAP_POLYGONS.splice(idx, 1);
      }
      this.activeDrawingPolygon = null;

      if (this.drawBtnBg) this.drawBtnBg.setFillStyle(0x1e1b4b, 0.95);
      if (this.drawBtnTxt) this.drawBtnTxt.setText('➕ DRAW NEW POLYGON');
    }

    this.renderDebugOverlay();
  }

  undoLastPolygonPoint() {
    if (this.activeDrawingPolygon && this.activeDrawingPolygon.points.length > 0) {
      this.activeDrawingPolygon.points.pop();
      this.renderDebugOverlay();
    } else if (MAP_POLYGONS.length > 0) {
      const lastPoly = MAP_POLYGONS[MAP_POLYGONS.length - 1];
      if (lastPoly.points.length > 0) {
        lastPoly.points.pop();
        if (lastPoly.points.length === 0) {
          MAP_POLYGONS.pop();
        }
        this.renderDebugOverlay();
      }
    }
  }

  toggleDebugMode() {
    this.isDebugMode = !this.isDebugMode;

    if (this.debugBtnText) {
      this.debugBtnText.setText(this.isDebugMode ? '✅ DEBUG: ON (DRAG/DRAW)' : '🛠️ DEBUG COLLIDER (Key B)');
      this.debugBtnText.setColor(this.isDebugMode ? '#4ade80' : '#38bdf8');
    }

    if (this.debugGraphics) {
      this.debugGraphics.destroy();
      this.debugGraphics = null;
    }
    if (this.debugTextsContainer) {
      this.debugTextsContainer.destroy();
      this.debugTextsContainer = null;
    }

    // Toggle interactive drag on AABB obstacles
    this.obstacles.getChildren().forEach(rect => {
      if (this.isDebugMode) {
        rect.setInteractive({ draggable: true });
        rect.off('drag');
        rect.on('drag', (pointer, dragX, dragY) => {
          if (!rect.obstacleData) return;
          const obs = rect.obstacleData;
          obs.x = Math.round(dragX);
          obs.y = Math.round(dragY);

          rect.setPosition(obs.x, obs.y);
          rect.body.reset(obs.x - obs.w / 2, obs.y - obs.h / 2);

          this.renderDebugOverlay();
        });
      } else {
        rect.disableInteractive();
      }
    });

    if (this.isDebugMode) {
      this.renderDebugOverlay();
    }
  }

  redrawPolygonShapes() {
    if (!this.debugGraphics) return;
    this.debugGraphics.clear();

    // 1. Draw 100px Grid Lines
    this.debugGraphics.lineStyle(1, 0xffff00, 0.18);
    for (let x = 0; x <= 1536; x += 100) {
      this.debugGraphics.moveTo(x, 0);
      this.debugGraphics.lineTo(x, 1024);
    }
    for (let y = 0; y <= 1024; y += 100) {
      this.debugGraphics.moveTo(0, y);
      this.debugGraphics.lineTo(1536, y);
    }
    this.debugGraphics.strokePath();

    // 2. Draw Rectangular Obstacle Bounding Boxes
    MAP_OBSTACLES.forEach(obs => {
      this.debugGraphics.fillStyle(0xff0000, 0.2);
      this.debugGraphics.fillRect(obs.x - obs.w / 2, obs.y - obs.h / 2, obs.w, obs.h);
      
      this.debugGraphics.lineStyle(1, 0xff4444, 0.7);
      this.debugGraphics.strokeRect(obs.x - obs.w / 2, obs.y - obs.h / 2, obs.w, obs.h);
    });

    // 3. Draw Custom Polygon Colliders Fill & Stroke
    MAP_POLYGONS.forEach((poly) => {
      if (!poly.points || poly.points.length === 0) return;

      const isCurrentActive = (poly === this.activeDrawingPolygon);
      const fillColor = isCurrentActive ? 0xec4899 : 0x0284c7;
      const strokeColor = isCurrentActive ? 0xf472b6 : 0x38bdf8;

      if (poly.points.length >= 3) {
        this.debugGraphics.fillStyle(fillColor, 0.35);
        this.debugGraphics.beginPath();
        this.debugGraphics.moveTo(poly.points[0].x, poly.points[0].y);
        for (let i = 1; i < poly.points.length; i++) {
          this.debugGraphics.lineTo(poly.points[i].x, poly.points[i].y);
        }
        this.debugGraphics.closePath();
        this.debugGraphics.fillPath();
      }

      this.debugGraphics.lineStyle(3, strokeColor, 1.0);
      this.debugGraphics.beginPath();
      this.debugGraphics.moveTo(poly.points[0].x, poly.points[0].y);
      for (let i = 1; i < poly.points.length; i++) {
        this.debugGraphics.lineTo(poly.points[i].x, poly.points[i].y);
      }
      if (poly.points.length >= 3) {
        this.debugGraphics.closePath();
      }
      this.debugGraphics.strokePath();
    });
  }

  renderDebugOverlay() {
    if (this.debugGraphics) this.debugGraphics.destroy();
    if (this.debugTextsContainer) this.debugTextsContainer.destroy();

    this.debugGraphics = this.add.graphics();
    this.debugGraphics.setDepth(1500);

    this.debugTextsContainer = this.add.container(0, 0);
    this.debugTextsContainer.setDepth(1501);

    // Draw lines and shapes first
    this.redrawPolygonShapes();

    // Add static grid labels
    for (let x = 0; x <= 1536; x += 100) {
      const t = this.add.text(x + 2, 5, `${x}`, { fontSize: '10px', fill: '#ffff00' });
      this.debugTextsContainer.add(t);
    }
    for (let y = 0; y <= 1024; y += 100) {
      const t = this.add.text(5, y + 2, `${y}`, { fontSize: '10px', fill: '#ffff00' });
      this.debugTextsContainer.add(t);
    }

    // Add rectangular obstacle labels
    MAP_OBSTACLES.forEach(obs => {
      const label = this.add.text(obs.x, obs.y - obs.h / 2 - 2, `${obs.name}`, {
        fontSize: '9px',
        fill: '#fca5a5',
        backgroundColor: '#000000a0'
      }).setOrigin(0.5, 1);

      this.debugTextsContainer.add(label);
    });

    // Draw Custom Polygon Center Labels & Interactive Draggable Handles
    MAP_POLYGONS.forEach((poly) => {
      if (!poly.points || poly.points.length === 0) return;

      const isCurrentActive = (poly === this.activeDrawingPolygon);
      const handleColor = isCurrentActive ? 0xf43f5e : 0x0ea5e9;

      // Polygon Center Name Label
      let sumX = 0, sumY = 0;
      poly.points.forEach(p => { sumX += p.x; sumY += p.y; });
      const centerX = Math.round(sumX / poly.points.length);
      const centerY = Math.round(sumY / poly.points.length);

      const polyLabel = this.add.text(centerX, centerY, `🔷 ${poly.name}`, {
        fontSize: '11px',
        fill: isCurrentActive ? '#fbcfe8' : '#e0f2fe',
        fontStyle: 'bold',
        backgroundColor: '#0f172ac0',
        padding: { x: 4, y: 2 }
      }).setOrigin(0.5);
      this.debugTextsContainer.add(polyLabel);

      // Render Draggable Vertex Handles (No coordinate text popups, sleek 4.5px circle)
      if (this.isDebugMode) {
        poly.points.forEach((pt) => {
          const nodeHandle = this.add.circle(pt.x, pt.y, 4.5, handleColor, 1.0);
          nodeHandle.setStrokeStyle(1.5, 0xffffff);
          nodeHandle.setInteractive({ draggable: true, useHandCursor: true });

          nodeHandle.on('drag', (pointer, dragX, dragY) => {
            pt.x = Math.round(dragX);
            pt.y = Math.round(dragY);
            nodeHandle.setPosition(pt.x, pt.y);
            this.redrawPolygonShapes();
          });

          nodeHandle.on('dragend', () => {
            this.renderDebugOverlay();
          });

          this.debugTextsContainer.add(nodeHandle);
        });
      }
    });
  }

  exportPolygonCoordinates() {
    const polyCode = MAP_POLYGONS.map(poly => {
      const pts = poly.points.map(p => `      { x: ${p.x}, y: ${p.y} }`).join(',\n');
      return `  {\n    name: '${poly.name}',\n    points: [\n${pts}\n    ]\n  }`;
    }).join(',\n');

    const code = `export const MAP_POLYGONS = [\n${polyCode}\n];`;

    console.log('--- TOẠ ĐỘ MAP_POLYGONS MỚI ---');
    console.log(code);

    if (navigator.clipboard) {
      navigator.clipboard.writeText(code).catch(() => {});
    }

    // Toast notification
    const toast = this.add.container(768, 80);
    toast.setScrollFactor(0);
    toast.setDepth(3000);

    const toastBg = this.add.rectangle(0, 0, 500, 42, 0x065f46, 0.95);
    toastBg.setStrokeStyle(2, 0x34d399);

    const toastTxt = this.add.text(0, 0, '✅ MAP_POLYGONS Copied to Clipboard & Console!', {
      fontSize: '12px',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    toast.add([toastBg, toastTxt]);

    this.tweens.add({
      targets: toast,
      y: 105,
      alpha: 0,
      duration: 2600,
      ease: 'Power2',
      onComplete: () => toast.destroy()
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

    const creep = new Creep(this, spawnX, spawnY);
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

  createUI() {
    this.createSkillIconsTextures();

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

  checkBulletTimeDodge(time) {
    if (!this.player || !this.player.active || !this.player.hasBulletTime) return;
    if (time - (this.player.lastBulletTimeTrigger || 0) < 5000) return;

    const enemyProjs = this.projectileGroup.getChildren();
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

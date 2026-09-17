import Phaser from 'phaser';
import { GAME_CONFIG } from './gameConfig';
import { preloadCharacterSFX, playPreparationBGM, stopPreparationBGM } from './soundManager';
import bgMainUrl from './assets/image/Background.png';

export default class StartScene extends Phaser.Scene {
  constructor() {
    super('StartScene');
  }

  preload() {
    preloadCharacterSFX(this);
    if (!this.textures.exists('bg_start_main')) this.load.image('bg_start_main', bgMainUrl);
  }

  create() {
    playPreparationBGM(this);

    const width = GAME_CONFIG.CANVAS.WIDTH;
    const height = GAME_CONFIG.CANVAS.HEIGHT;
    const centerX = width / 2;

    // Background Image using Background.png with floating motion
    this.bg = this.add.image(centerX, height / 2, 'bg_start_main');
    const scaleX = width / this.bg.width;
    const scaleY = height / this.bg.height;
    const scale = Math.max(scaleX, scaleY) * 1.05;
    this.bg.setScale(scale);

    this.tweens.add({
      targets: this.bg,
      y: height / 2 - 12,
      duration: 3500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Dark Glassmorphism Overlay
    this.add.rectangle(0, 0, width, height, 0x090d16, 0.65).setOrigin(0);

    // Floating Ambient Sparkles
    for (let i = 0; i < 25; i++) {
      const px = Phaser.Math.Between(50, width - 50);
      const py = Phaser.Math.Between(50, height - 50);
      const color = Phaser.Math.RND.pick([0x38bdf8, 0xfacc15, 0xec4899, 0xa855f7]);
      const spark = this.add.circle(px, py, Phaser.Math.Between(2, 4), color, Phaser.Math.FloatBetween(0.3, 0.8));
      this.tweens.add({
        targets: spark,
        y: py - Phaser.Math.Between(30, 80),
        alpha: 0,
        scale: 0.2,
        duration: Phaser.Math.Between(2000, 4500),
        repeat: -1,
        delay: Phaser.Math.Between(0, 2000)
      });
    }

    // Title Section
    const titleText = this.add.text(centerX, 110, "MIRROR MATCH", {
      fontSize: '52px',
      fill: '#facc15',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6
    }).setOrigin(0.5);

    this.add.text(centerX, 160, "⚡ 2D ACTION ARENA SHOWDOWN ⚡", {
      fontSize: '16px',
      fill: '#38bdf8',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    // Title Pulsing Effect
    this.tweens.add({
      targets: titleText,
      scale: 1.04,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // 2 Mode Selection Cards (Campaign & Infinity)
    const cardY = 410;
    const cardsData = [
      {
        id: 'campaign',
        title: '🗡️ CAMPAIGN MODE',
        subtitle: '10 Progressive Boss Levels',
        details: ['• 10 Scaling Boss Levels', '• Shop & Augments System', '• Progressive AI Champion Difficulty'],
        btnText: 'START CAMPAIGN',
        color: 0x38bdf8,
        x: centerX - 220
      },
      {
        id: 'infinity',
        title: '♾️ INFINITY SURVIVAL',
        subtitle: 'Endless Wave Survival',
        details: ['• Endless Creep & Bot Spawns', '• High Score & Survival Time', '• Dynamic Gold & Wave Scaling'],
        btnText: 'SURVIVE NOW',
        color: 0xa855f7,
        x: centerX + 220
      }
    ];

    cardsData.forEach(card => {
      this.createModeCard(card, cardY);
    });

    // Bottom Controls & Sound Buttons
    const bottomY = height - 50;

    // How to Play Modal Button
    const helpBtn = this.add.rectangle(centerX - 120, bottomY, 200, 40, 0x1e293b).setInteractive({ useHandCursor: true });
    helpBtn.setStrokeStyle(1.5, 0x38bdf8);
    const helpTxt = this.add.text(centerX - 120, bottomY, "❓ CONTROLS & INFO", { fontSize: '13px', fill: '#38bdf8', fontStyle: 'bold' }).setOrigin(0.5);

    helpBtn.on('pointerover', () => this.tweens.add({ targets: [helpBtn, helpTxt], scale: 1.05, duration: 100 }));
    helpBtn.on('pointerout', () => this.tweens.add({ targets: [helpBtn, helpTxt], scale: 1.0, duration: 100 }));
    helpBtn.on('pointerdown', () => this.showControlsModal());

    // Music BGM Toggle Button
    let isMusicOn = true;
    const musicBtn = this.add.rectangle(centerX + 120, bottomY, 180, 40, 0x1e293b).setInteractive({ useHandCursor: true });
    musicBtn.setStrokeStyle(1.5, 0xfacc15);
    const musicTxt = this.add.text(centerX + 120, bottomY, "🔊 MUSIC: ON", { fontSize: '13px', fill: '#facc15', fontStyle: 'bold' }).setOrigin(0.5);

    musicBtn.on('pointerover', () => this.tweens.add({ targets: [musicBtn, musicTxt], scale: 1.05, duration: 100 }));
    musicBtn.on('pointerout', () => this.tweens.add({ targets: [musicBtn, musicTxt], scale: 1.0, duration: 100 }));
    musicBtn.on('pointerdown', () => {
      isMusicOn = !isMusicOn;
      if (isMusicOn) {
        musicTxt.setText("🔊 MUSIC: ON").setColor('#facc15');
        playPreparationBGM(this);
      } else {
        musicTxt.setText("🔇 MUSIC: OFF").setColor('#94a3b8');
        stopPreparationBGM(this);
      }
    });
  }

  createModeCard(card, cardY) {
    const cardWidth = 300;
    const cardHeight = 340;

    const cardContainer = this.add.container(card.x, cardY);

    // Card Box Background
    const cardBg = this.add.rectangle(0, 0, cardWidth, cardHeight, 0x0f172a, 0.92).setInteractive({ useHandCursor: true });
    cardBg.setStrokeStyle(2, card.color, 0.7);

    // Top Header Bar
    const headerBg = this.add.rectangle(0, -cardHeight / 2 + 30, cardWidth, 60, card.color, 0.15);
    const title = this.add.text(0, -cardHeight / 2 + 22, card.title, {
      fontSize: '18px',
      fill: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    const subtitle = this.add.text(0, -cardHeight / 2 + 45, card.subtitle, {
      fontSize: '11px',
      fill: '#94a3b8'
    }).setOrigin(0.5);

    // Details List
    const detailsText = this.add.text(-125, -50, card.details.join('\n\n'), {
      fontSize: '12px',
      fill: '#cbd5e1',
      wordWrap: { width: 250 }
    });

    // Start Button
    const btnY = cardHeight / 2 - 40;
    const btnBg = this.add.rectangle(0, btnY, 240, 44, card.color, 0.9).setInteractive({ useHandCursor: true });
    btnBg.setStrokeStyle(1.5, 0xffffff);
    const btnTxt = this.add.text(0, btnY, card.btnText, {
      fontSize: '14px',
      fill: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    cardContainer.add([cardBg, headerBg, title, subtitle, detailsText, btnBg, btnTxt]);

    // Hover Animation
    cardBg.on('pointerover', () => {
      this.tweens.killTweensOf(cardContainer);
      this.tweens.add({ targets: cardContainer, scale: 1.05, y: cardY - 8, duration: 150, ease: 'Power2' });
      cardBg.setStrokeStyle(3, card.color, 1.0);
    });

    cardBg.on('pointerout', () => {
      this.tweens.killTweensOf(cardContainer);
      this.tweens.add({ targets: cardContainer, scale: 1.0, y: cardY, duration: 150, ease: 'Power2' });
      cardBg.setStrokeStyle(2, card.color, 0.7);
    });

    const launchMode = () => {
      this.registry.set('gameMode', card.id);
      if (card.id === 'infinity') {
        this.registry.set('survivalLevel', 1);
        this.registry.set('gold', GAME_CONFIG.ECONOMY.STARTING_GOLD || 1000);
        this.registry.set('inventory', []);
        this.registry.set('augments', []);
      }
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('PreparationScene');
      });
    };

    cardBg.on('pointerdown', launchMode);
    btnBg.on('pointerdown', launchMode);
    btnTxt.on('pointerdown', launchMode);
  }

  showControlsModal() {
    if (this.controlsModal) this.controlsModal.destroy();

    const width = GAME_CONFIG.CANVAS.WIDTH;
    const height = GAME_CONFIG.CANVAS.HEIGHT;

    this.controlsModal = this.add.container(0, 0);
    this.controlsModal.setDepth(4000);

    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.8).setOrigin(0).setInteractive();
    const box = this.add.rectangle(width / 2, height / 2, 600, 420, 0x0f172a, 0.98);
    box.setStrokeStyle(2, 0x38bdf8);

    const title = this.add.text(width / 2, height / 2 - 170, "🎮 CONTROLS & HOW TO PLAY", {
      fontSize: '20px',
      fill: '#facc15',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const infoStr = 
      "GAME CONTROLS:\n" +
      "• Move Character: W, A, S, D\n" +
      "• Aim Skill Direction: Mouse Cursor\n" +
      "• Q Skill: Left Mouse Click / Q Key\n" +
      "• E Skill (Dash / Utility): E Key\n" +
      "• Space Skill (Ultimate): Spacebar\n" +
      "• Active Items (HUD): Keys 1 to 6 (mapped to inventory 1-6)\n\n" +
      "GAMEPLAY TIPS:\n" +
      "• Buy items in Preparation Phase to boost Attack, HP, Armor & Crit.\n" +
      "• Use Active Items (Zhonya, Rocketbelt, Potion, QSS) strategically in battle!";

    const content = this.add.text(width / 2 - 250, height / 2 - 110, infoStr, {
      fontSize: '13px',
      fill: '#cbd5e1',
      lineSpacing: 6
    });

    const closeBtn = this.add.rectangle(width / 2, height / 2 + 175, 140, 36, 0xef4444).setInteractive({ useHandCursor: true });
    closeBtn.setStrokeStyle(1.5, 0xffffff);
    const closeTxt = this.add.text(width / 2, height / 2 + 175, "CLOSE", { fontSize: '13px', fill: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);

    closeBtn.on('pointerdown', () => this.controlsModal.destroy());
    overlay.on('pointerdown', () => this.controlsModal.destroy());

    this.controlsModal.add([overlay, box, title, content, closeBtn, closeTxt]);
  }
}

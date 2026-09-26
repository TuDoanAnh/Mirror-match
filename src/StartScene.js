import Phaser from 'phaser';
import { GAME_CONFIG } from './gameConfig';
import { preloadCharacterSFX, playPreparationBGM, stopPreparationBGM } from './soundManager';
import { createTopRightBar } from './topRightBar';
import { loadGameProgress, hasSavedGame, resetGameProgress } from './playgamaSDK';
import bgMainUrl from './assets/image/Background.png';
import logoUrl from './assets/image/Logo.png';
import campaignBtnUrl from './assets/image/campaign.png';
import endlessBtnUrl from './assets/image/Endless.png';
import newGameBtnUrl from './assets/image/New_Game.png';

export default class StartScene extends Phaser.Scene {
  constructor() {
    super('StartScene');
  }

  preload() {
    preloadCharacterSFX(this);
    if (!this.textures.exists('bg_start_main')) this.load.image('bg_start_main', bgMainUrl);
    if (!this.textures.exists('logo_main')) this.load.image('logo_main', logoUrl);
    if (!this.textures.exists('btn_campaign')) this.load.image('btn_campaign', campaignBtnUrl);
    if (!this.textures.exists('btn_endless')) this.load.image('btn_endless', endlessBtnUrl);
    if (!this.textures.exists('btn_new_game')) this.load.image('btn_new_game', newGameBtnUrl);
  }

  async create() {
    await loadGameProgress(this);
    playPreparationBGM(this);

    const width = GAME_CONFIG.CANVAS.WIDTH;
    const height = GAME_CONFIG.CANVAS.HEIGHT;
    const centerX = width / 2;
    const centerY = height / 2;

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

    // Title Section: Enlarged Logo Image placed at center
    const logoY = centerY - 110;
    const logo = this.add.image(centerX, logoY, 'logo_main');
    const targetLogoWidth = 1060;
    logo.setScale(targetLogoWidth / logo.width);

    // Title Pulsing Effect
    const baseLogoScale = logo.scaleX || 1;
    this.tweens.add({
      targets: logo,
      scale: baseLogoScale * 1.04,
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Check if saved game data exists
    const saveExists = await hasSavedGame();

    // Mode Selection Image Buttons (placed clearly below enlarged Logo)
    const btnY = centerY + 175;
    const campX = centerX - 150;
    const infX = centerX + 150;

    const startMode = (modeId) => {
      this.registry.set('gameMode', modeId);
      if (modeId === 'infinity') {
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

    // Button 1: Campaign Mode Image Button
    const campBtn = this.add.image(campX, btnY, 'btn_campaign').setInteractive({ useHandCursor: true });
    const targetBtnWidth = 250;
    if (campBtn.width > targetBtnWidth) {
      campBtn.setScale(targetBtnWidth / campBtn.width);
    } else if (campBtn.width < 150) {
      campBtn.setScale(1.2);
    }
    const campBaseScale = campBtn.scaleX;

    campBtn.on('pointerover', () => {
      this.tweens.killTweensOf(campBtn);
      this.tweens.add({ targets: campBtn, scale: campBaseScale * 1.08, duration: 120, ease: 'Power2' });
    });
    campBtn.on('pointerout', () => {
      this.tweens.killTweensOf(campBtn);
      this.tweens.add({ targets: campBtn, scale: campBaseScale, duration: 120, ease: 'Power2' });
    });
    campBtn.on('pointerdown', () => startMode('campaign'));

    // Button 2: Endless / Infinity Mode Image Button
    const infBtn = this.add.image(infX, btnY, 'btn_endless').setInteractive({ useHandCursor: true });
    if (infBtn.width > targetBtnWidth) {
      infBtn.setScale(targetBtnWidth / infBtn.width);
    } else if (infBtn.width < 150) {
      infBtn.setScale(1.2);
    }
    const infBaseScale = infBtn.scaleX;

    infBtn.on('pointerover', () => {
      this.tweens.killTweensOf(infBtn);
      this.tweens.add({ targets: infBtn, scale: infBaseScale * 1.08, duration: 120, ease: 'Power2' });
    });
    infBtn.on('pointerout', () => {
      this.tweens.killTweensOf(infBtn);
      this.tweens.add({ targets: infBtn, scale: infBaseScale, duration: 120, ease: 'Power2' });
    });
    infBtn.on('pointerdown', () => startMode('infinity'));

    // If save data exists, show NEW GAME button
    if (saveExists) {
      // NEW GAME Image Button (placed cleanly below mode buttons)
      const newGameY = btnY + 130;
      const newGameBtn = this.add.image(centerX, newGameY, 'btn_new_game').setInteractive({ useHandCursor: true });
      const targetWidth = 220;
      if (newGameBtn.width > targetWidth) {
        newGameBtn.setScale(targetWidth / newGameBtn.width);
      } else {
        newGameBtn.setScale(1.0);
      }
      const newGameBaseScale = newGameBtn.scaleX;

      newGameBtn.on('pointerover', () => {
        this.tweens.killTweensOf(newGameBtn);
        this.tweens.add({ targets: newGameBtn, scale: newGameBaseScale * 1.08, duration: 120, ease: 'Power2' });
      });
      newGameBtn.on('pointerout', () => {
        this.tweens.killTweensOf(newGameBtn);
        this.tweens.add({ targets: newGameBtn, scale: newGameBaseScale, duration: 120, ease: 'Power2' });
      });

      newGameBtn.on('pointerdown', () => {
        this.showNewGameConfirmModal();
      });
    }

    // Top-Right Action Icon Buttons (? and Music Speaker) with persistent mute state
    createTopRightBar(this);
  }

  showNewGameConfirmModal() {
    const width = GAME_CONFIG.CANVAS.WIDTH;
    const height = GAME_CONFIG.CANVAS.HEIGHT;
    const centerX = width / 2;
    const centerY = height / 2;

    const modal = this.add.container(0, 0).setDepth(9999);

    // Dark background mask
    const bgMask = this.add.rectangle(0, 0, width, height, 0x000000, 0.85).setOrigin(0).setInteractive();

    // Box panel
    const box = this.add.rectangle(centerX, centerY, 520, 260, 0x0f172a).setStrokeStyle(3, 0xef4444);

    const title = this.add.text(centerX, centerY - 80, "⚠️ RESET PROGRESS & NEW GAME?", {
      fontSize: '20px',
      fill: '#f87171',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const desc = this.add.text(centerX, centerY - 30, "This will delete your saved levels, gold, equipment, and augments.\nAre you sure you want to start a completely fresh game?", {
      fontSize: '14px',
      fill: '#94a3b8',
      align: 'center',
      wordWrap: { width: 460 }
    }).setOrigin(0.5);

    // Confirm Button
    const yesBg = this.add.rectangle(centerX - 110, centerY + 55, 200, 44, 0xd97706).setInteractive({ useHandCursor: true });
    yesBg.setStrokeStyle(2, 0xfbbf24);
    const yesTxt = this.add.text(centerX - 110, centerY + 55, "🎮 YES, START NEW", {
      fontSize: '13px',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    yesBg.on('pointerover', () => this.tweens.add({ targets: [yesBg, yesTxt], scale: 1.05, duration: 100 }));
    yesBg.on('pointerout', () => this.tweens.add({ targets: [yesBg, yesTxt], scale: 1.0, duration: 100 }));
    yesBg.on('pointerdown', async () => {
      modal.destroy();
      await resetGameProgress(this);
      this.registry.set('gameMode', 'campaign');
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('PreparationScene');
      });
    });

    // Cancel Button
    const noBg = this.add.rectangle(centerX + 110, centerY + 55, 160, 44, 0x334155).setInteractive({ useHandCursor: true });
    noBg.setStrokeStyle(2, 0x64748b);
    const noTxt = this.add.text(centerX + 110, centerY + 55, "❌ CANCEL", {
      fontSize: '13px',
      fill: '#e2e8f0',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    noBg.on('pointerover', () => this.tweens.add({ targets: [noBg, noTxt], scale: 1.05, duration: 100 }));
    noBg.on('pointerout', () => this.tweens.add({ targets: [noBg, noTxt], scale: 1.0, duration: 100 }));
    noBg.on('pointerdown', () => {
      modal.destroy();
    });

    modal.add([bgMask, box, title, desc, yesBg, yesTxt, noBg, noTxt]);

    modal.setScale(0.8);
    modal.alpha = 0;
    this.tweens.add({
      targets: modal,
      scale: 1,
      alpha: 1,
      duration: 200,
      ease: 'Back.easeOut'
    });
  }
}

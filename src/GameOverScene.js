import Phaser from 'phaser';
import { GAME_CONFIG } from './gameConfig';
import { createTopRightBar } from './topRightBar';
import { showRewardedAd, saveGameProgress, showInterstitialAd } from './playgamaSDK';
import watchAdBtnUrl from './assets/image/Watch_ad.png';
import mainMenuBtnUrl from './assets/image/main_menu.png';
import readyBtnUrl from './assets/image/Ready.png';

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  preload() {
    if (!this.textures.exists('btn_ready')) this.load.image('btn_ready', readyBtnUrl);
    if (!this.textures.exists('btn_watch_ad')) this.load.image('btn_watch_ad', watchAdBtnUrl);
    if (!this.textures.exists('btn_main_menu')) this.load.image('btn_main_menu', mainMenuBtnUrl);
  }

  init(data) {
    this.mode = data.mode || this.registry.get('gameMode') || 'campaign';
    this.result = data.result || 'lose'; // 'win' or 'lose'
    this.level = data.level || 1;
    this.winner = data.winner || 'PLAYER 1';
    this.finalWave = data.finalWave || 1;
    this.finalScore = data.finalScore || 0;
    this.finalKills = data.finalKills || 0;
    this.stats = data.stats || {
      skillsFired: 0,
      skillsHit: 0,
      accuracy: 100,
      durationSec: 0,
      damageDealt: 0,
      damageTaken: 0
    };
  }

  calculateGrade() {
    if (this.result !== 'win') {
      return { grade: 'D', color: '#ef4444', label: 'DEFEAT' };
    }

    let score = 70;
    score += (this.stats.accuracy || 0) * 0.25;

    if (this.stats.durationSec < 25) score += 15;
    else if (this.stats.durationSec < 40) score += 10;
    else if (this.stats.durationSec < 60) score += 5;

    if (this.stats.damageTaken < 300) score += 10;

    if (score >= 100) return { grade: 'S+', color: '#fbbf24', label: 'PERFECT' };
    if (score >= 90) return { grade: 'S', color: '#34d399', label: 'EXCELLENT' };
    if (score >= 80) return { grade: 'A', color: '#38bdf8', label: 'GREAT' };
    if (score >= 70) return { grade: 'B', color: '#facc15', label: 'GOOD' };
    return { grade: 'C', color: '#9ca3af', label: 'AVERAGE' };
  }

  create() {
    createTopRightBar(this);
    showInterstitialAd('game_over');

    const width = GAME_CONFIG.CANVAS.WIDTH;
    const height = GAME_CONFIG.CANVAS.HEIGHT;
    const centerX = width / 2;
    const centerY = height / 2;

    this.add.rectangle(0, 0, width, height, 0x090d16, 0.92).setOrigin(0);

    const isWin = this.result === 'win';
    const gradeInfo = this.calculateGrade();

    let titleStr = "DEFEAT";
    let titleColor = "#ef4444";
    let subStr = "No Gold Reward Earned";

    if (this.mode === 'pvp') {
      titleStr = `${this.winner} VICTORY!`;
      titleColor = this.winner === 'PLAYER 1' ? "#38bdf8" : "#ef4444";
      subStr = "Epic 1v1 Local Showdown!";
    } else if (this.mode === 'infinity') {
      titleStr = `SURVIVED ${this.finalWave} WAVES!`;
      titleColor = "#a855f7";
      subStr = `Final Score: ${this.finalScore} Points  •  Bot Kills: ${this.finalKills}`;

      const bestScore = this.registry.get('infinityScore') || 0;
      if (this.finalScore > bestScore) {
        this.registry.set('infinityScore', this.finalScore);
        this.registry.set('infinityKills', this.finalKills);
      }
      saveGameProgress(this);
    } else if (isWin) {
      const rewardsTable = GAME_CONFIG.ECONOMY.LEVEL_WIN_REWARDS || {};
      const goldEarned = rewardsTable[this.level] || (this.level * 500);
      let currentGold = this.registry.get('gold') || 0;
      this.registry.set('gold', currentGold + goldEarned);

      titleStr = "VICTORY!";
      titleColor = "#34d399";
      subStr = `Reward +${goldEarned} Gold!`;

      const maxLevel = GAME_CONFIG.ECONOMY.MAX_LEVEL || 20;
      const nextLevel = Math.min(this.level + 1, maxLevel);
      let unlocked = this.registry.get('unlockedLevel') || 1;
      if (nextLevel > unlocked) {
        unlocked = nextLevel;
        this.registry.set('unlockedLevel', unlocked);
        subStr += ` • UNLOCKED LEVEL ${unlocked}!`;
      }
      this.registry.set('selectedLevel', nextLevel);
      saveGameProgress(this);
    }

    // Title Header Text
    this.add.text(centerX, 160, titleStr, {
      fontSize: '52px',
      fill: titleColor,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center'
    }).setOrigin(0.5);

    this.add.text(centerX, 220, subStr, {
      fontSize: '16px',
      fill: '#fde047',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Panels Layout Alignment (Shared Y & Height)
    const panelY = centerY + 30;
    const panelHeight = 230;

    // Rank Badge Display Panel (Left Center)
    const rankBoxX = centerX - 195;

    const rankBg = this.add.rectangle(rankBoxX, panelY, 230, panelHeight, 0x0f172a, 0.9);
    rankBg.setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(gradeInfo.color).color, 0.8);

    this.add.text(rankBoxX, panelY - 88, "MATCH RANK", { fontSize: '13px', fill: '#94a3b8', fontStyle: 'bold' }).setOrigin(0.5);

    const gradeText = this.add.text(rankBoxX, panelY - 15, gradeInfo.grade, {
      fontSize: '72px',
      fill: gradeInfo.color,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    this.add.text(rankBoxX, panelY + 65, gradeInfo.label, {
      fontSize: '16px',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Pulsing animation for Rank Badge
    if (['S+', 'S'].includes(gradeInfo.grade)) {
      this.tweens.add({
        targets: gradeText,
        scale: 1.12,
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    // Match Stats Summary Panel (Right Center)
    const statsBoxX = centerX + 130;

    const statsBg = this.add.rectangle(statsBoxX, panelY, 360, panelHeight, 0x0f172a, 0.9);
    statsBg.setStrokeStyle(2, 0x334155, 0.8);

    this.add.text(statsBoxX, panelY - 88, "COMBAT STATISTICS", { fontSize: '15px', fill: '#38bdf8', fontStyle: 'bold' }).setOrigin(0.5);

    const leftColX = statsBoxX - 150;
    const rightColX = statsBoxX + 150;
    let statY = panelY - 48;

    const statRows = [
      { label: "Skillshot Accuracy:", val: `${this.stats.accuracy || 100}%`, color: '#38bdf8' },
      { label: "Total Skills Cast:", val: `${this.stats.skillsFired || 0}`, color: '#ffffff' },
      { label: "Damage Dealt:", val: `${this.stats.damageDealt || 0}`, color: '#f87171' },
      { label: "Damage Taken:", val: `${this.stats.damageTaken || 0}`, color: '#fb923c' },
      { label: "Match Duration:", val: `${this.stats.durationSec || 0}s`, color: '#facc15' }
    ];

    statRows.forEach(row => {
      this.add.text(leftColX, statY, row.label, { fontSize: '12px', fill: '#94a3b8' }).setOrigin(0, 0.5);
      this.add.text(rightColX, statY, row.val, { fontSize: '12px', fill: row.color, fontStyle: 'bold' }).setOrigin(1, 0.5);
      statY += 27;
    });

    // Action Buttons Area (Bottom)
    const btnY = panelY + 185;
    const isAugmentRound = (this.level % 4 === 0);

    const onPrimaryAction = () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        if (this.mode === 'infinity') {
          this.registry.set('survivalLevel', 1);
          this.registry.set('gold', 1000);
          this.registry.set('inventory', []);
          this.registry.set('augments', []);
          this.scene.start('PreparationScene');
        } else if (this.mode === 'campaign' && isWin && isAugmentRound) {
          const maxLevel = GAME_CONFIG.ECONOMY.MAX_LEVEL || 20;
          const nextLevel = Math.min(this.level + 1, maxLevel);
          this.scene.start('AugmentSelectScene', { nextLevel });
        } else {
          this.scene.start('PreparationScene');
        }
      });
    };

    // --- 1. LEFT BUTTON: BATTLE READY (on Win) OR WATCH AD TO RETRY (on Lose) ---
    const leftBtnKey = isWin ? 'btn_ready' : 'btn_watch_ad';
    const leftBtn = this.add.image(centerX - 145, btnY, leftBtnKey).setInteractive({ useHandCursor: true });
    leftBtn.setDisplaySize(240, 52);
    const leftBaseScaleX = leftBtn.scaleX;
    const leftBaseScaleY = leftBtn.scaleY;

    leftBtn.on('pointerover', () => {
      this.tweens.killTweensOf(leftBtn);
      this.tweens.add({ targets: leftBtn, scaleX: leftBaseScaleX * 1.06, scaleY: leftBaseScaleY * 1.06, duration: 120, ease: 'Power2' });
    });
    leftBtn.on('pointerout', () => {
      this.tweens.killTweensOf(leftBtn);
      this.tweens.add({ targets: leftBtn, scaleX: leftBaseScaleX, scaleY: leftBaseScaleY, duration: 120, ease: 'Power2' });
    });

    const onLeftBtnAction = () => {
      if (isWin) {
        onPrimaryAction();
      } else {
        showRewardedAd(this, 'revive_rebattle').then(rewarded => {
          if (rewarded) {
            onPrimaryAction();
          }
        });
      }
    };

    leftBtn.on('pointerdown', onLeftBtnAction);
    this.input.keyboard.once('keydown-ENTER', onLeftBtnAction);

    // --- 2. RIGHT BUTTON: MAIN MENU (main_menu.png) ---
    const mainMenuBtn = this.add.image(centerX + 145, btnY, 'btn_main_menu').setInteractive({ useHandCursor: true });
    mainMenuBtn.setDisplaySize(240, 52);
    const menuBaseScaleX = mainMenuBtn.scaleX;
    const menuBaseScaleY = mainMenuBtn.scaleY;

    mainMenuBtn.on('pointerover', () => {
      this.tweens.killTweensOf(mainMenuBtn);
      this.tweens.add({ targets: mainMenuBtn, scaleX: menuBaseScaleX * 1.06, scaleY: menuBaseScaleY * 1.06, duration: 120, ease: 'Power2' });
    });
    mainMenuBtn.on('pointerout', () => {
      this.tweens.killTweensOf(mainMenuBtn);
      this.tweens.add({ targets: mainMenuBtn, scaleX: menuBaseScaleX, scaleY: menuBaseScaleY, duration: 120, ease: 'Power2' });
    });

    const onMainMenu = () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('StartScene');
      });
    };

    mainMenuBtn.on('pointerdown', onMainMenu);

    this.cameras.main.fadeIn(400, 0, 0, 0);
  }
}

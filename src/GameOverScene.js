import Phaser from 'phaser';
import { GAME_CONFIG } from './gameConfig';
import { createTopRightBar } from './topRightBar';

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
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
    } else if (isWin) {
      const rewardsTable = GAME_CONFIG.ECONOMY.LEVEL_WIN_REWARDS || {};
      const goldEarned = rewardsTable[this.level] || (this.level * 500);
      let currentGold = this.registry.get('gold') || 0;
      this.registry.set('gold', currentGold + goldEarned);

      titleStr = "VICTORY!";
      titleColor = "#34d399";
      subStr = `Reward +${goldEarned} Gold!`;

      let unlocked = this.registry.get('unlockedLevel') || 1;
      if (this.level === unlocked && unlocked < (GAME_CONFIG.ECONOMY.MAX_LEVEL || 10)) {
        this.registry.set('unlockedLevel', unlocked + 1);
        subStr += ` • UNLOCKED LEVEL ${unlocked + 1}!`;
      }
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

    // Rank Badge Display Panel (Left Center)
    const rankBoxX = centerX - 180;
    const rankBoxY = centerY + 30;

    const rankBg = this.add.rectangle(rankBoxX, rankBoxY, 200, 220, 0x0f172a, 0.9);
    rankBg.setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(gradeInfo.color).color, 0.8);

    this.add.text(rankBoxX, rankBoxY - 80, "MATCH RANK", { fontSize: '13px', fill: '#94a3b8', fontStyle: 'bold' }).setOrigin(0.5);

    const gradeText = this.add.text(rankBoxX, rankBoxY - 15, gradeInfo.grade, {
      fontSize: '72px',
      fill: gradeInfo.color,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    this.add.text(rankBoxX, rankBoxY + 55, gradeInfo.label, {
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
    const statsBoxX = centerX + 120;
    const statsBoxY = centerY + 30;

    const statsBg = this.add.rectangle(statsBoxX, statsBoxY, 320, 220, 0x0f172a, 0.9);
    statsBg.setStrokeStyle(2, 0x334155, 0.8);

    this.add.text(statsBoxX, statsBoxY - 85, "COMBAT STATISTICS", { fontSize: '15px', fill: '#38bdf8', fontStyle: 'bold' }).setOrigin(0.5);

    const leftColX = statsBoxX - 135;
    const rightColX = statsBoxX + 135;
    let statY = statsBoxY - 45;

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
      statY += 28;
    });

    // Action Buttons Area
    const btnY = centerY + 185;

    // Primary Action Button (Play Again / Choose Augment)
    let btnLabel = "RETRY LEVEL (ENTER)";
    if (this.mode === 'pvp') btnLabel = "PLAY AGAIN (ENTER)";
    else if (this.mode === 'infinity') btnLabel = "SURVIVE AGAIN (ENTER)";
    else if (isWin) btnLabel = "CHOOSE AUGMENT (ENTER)";

    const btn1Bg = this.add.rectangle(centerX - 120, btnY, 220, 46, 0x1e293b).setInteractive({ useHandCursor: true });
    btn1Bg.setStrokeStyle(2, 0x38bdf8);
    const btn1Txt = this.add.text(centerX - 120, btnY, btnLabel, { fontSize: '13px', fill: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);

    btn1Bg.on('pointerover', () => {
      this.tweens.add({ targets: [btn1Bg, btn1Txt], scale: 1.05, duration: 150 });
      btn1Bg.setFillStyle(0x0284c7);
    });
    btn1Bg.on('pointerout', () => {
      this.tweens.add({ targets: [btn1Bg, btn1Txt], scale: 1.0, duration: 150 });
      btn1Bg.setFillStyle(0x1e293b);
    });

    const onPrimaryAction = () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        if (this.mode === 'infinity') {
          this.registry.set('survivalLevel', 1);
          this.registry.set('gold', 1000);
          this.registry.set('inventory', []);
          this.registry.set('augments', []);
          this.scene.start('PreparationScene');
        } else if (this.mode === 'campaign' && isWin) {
          this.scene.start('AugmentSelectScene', { nextLevel: this.level + 1 });
        } else {
          this.scene.start('PreparationScene');
        }
      });
    };

    btn1Bg.on('pointerdown', onPrimaryAction);
    this.input.keyboard.once('keydown-ENTER', onPrimaryAction);

    // Main Menu Button
    const btn2Bg = this.add.rectangle(centerX + 120, btnY, 200, 46, 0x1e293b).setInteractive({ useHandCursor: true });
    btn2Bg.setStrokeStyle(2, 0xfacc15);
    const btn2Txt = this.add.text(centerX + 120, btnY, "🏠 MAIN MENU", { fontSize: '13px', fill: '#facc15', fontStyle: 'bold' }).setOrigin(0.5);

    btn2Bg.on('pointerover', () => {
      this.tweens.add({ targets: [btn2Bg, btn2Txt], scale: 1.05, duration: 150 });
      btn2Bg.setFillStyle(0xd97706);
    });
    btn2Bg.on('pointerout', () => {
      this.tweens.add({ targets: [btn2Bg, btn2Txt], scale: 1.0, duration: 150 });
      btn2Bg.setFillStyle(0x1e293b);
    });

    const onMainMenu = () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('StartScene');
      });
    };

    btn2Bg.on('pointerdown', onMainMenu);

    this.cameras.main.fadeIn(400, 0, 0, 0);
  }
}


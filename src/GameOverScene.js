import Phaser from 'phaser';
import { GAME_CONFIG } from './gameConfig';

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  init(data) {
    this.result = data.result || 'lose'; // 'win' or 'lose'
    this.level = data.level || 1;
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
    
    if (isWin) {
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
    this.add.text(centerX, 180, titleStr, {
      fontSize: '56px',
      fill: titleColor,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center'
    }).setOrigin(0.5);

    this.add.text(centerX, 240, subStr, {
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

    // Pulsing animation for Rank Badge S+ / S
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

    // Return to Menu Button
    const btnY = centerY + 200;
    const btnBg = this.add.rectangle(centerX, btnY, 280, 52, 0x1e293b).setInteractive({ useHandCursor: true });
    btnBg.setStrokeStyle(2, 0x38bdf8);

    const btnTxt = this.add.text(centerX, btnY, "RETURN TO MENU (ENTER)", {
      fontSize: '18px',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const onReturn = () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('PreparationScene');
      });
    };

    btnBg.on('pointerover', () => {
      this.tweens.add({ targets: [btnBg, btnTxt], scale: 1.05, duration: 150, ease: 'Power2' });
      btnBg.setFillStyle(0x0284c7);
    });

    btnBg.on('pointerout', () => {
      this.tweens.add({ targets: [btnBg, btnTxt], scale: 1.0, duration: 150, ease: 'Power2' });
      btnBg.setFillStyle(0x1e293b);
    });

    btnBg.on('pointerdown', onReturn);
    this.input.keyboard.once('keydown-ENTER', onReturn);

    this.cameras.main.fadeIn(400, 0, 0, 0);
  }
}

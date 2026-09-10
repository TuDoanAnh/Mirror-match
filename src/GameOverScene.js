import Phaser from 'phaser';
import { GAME_CONFIG } from './gameConfig';

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  init(data) {
    this.result = data.result || 'lose'; // 'win' or 'lose'
    this.level = data.level || 1;
  }

  create() {
    this.add.rectangle(0, 0, GAME_CONFIG.CANVAS.WIDTH, GAME_CONFIG.CANVAS.HEIGHT, 0x000000, 0.8).setOrigin(0);

    const isWin = this.result === 'win';
    
    let textStr = "DEFEAT!\nNO GOLD EARNED";
    let colorStr = "#ff0000";
    
    if (isWin) {
      const goldEarned = this.level * GAME_CONFIG.ECONOMY.GOLD_PER_LEVEL_WIN;
      let currentGold = this.registry.get('gold');
      this.registry.set('gold', currentGold + goldEarned);
      
      textStr = `VICTORY!\nEARNED ${goldEarned} GOLD`;
      colorStr = "#00ff00";
      
      let unlocked = this.registry.get('unlockedLevel');
      if (this.level === unlocked && unlocked < GAME_CONFIG.ECONOMY.MAX_LEVEL) {
        this.registry.set('unlockedLevel', unlocked + 1);
        textStr += `\nNEW LEVEL UNLOCKED!`;
      }
    }

    this.add.text(512, 300, textStr, {
      fontSize: '48px',
      fill: colorStr,
      fontStyle: 'bold',
      stroke: '#ffffff',
      strokeThickness: 2,
      align: 'center'
    }).setOrigin(0.5);

    this.cameras.main.fadeIn(500, 0, 0, 0);

    const btnBg = this.add.rectangle(512, 500, 300, 60, 0x333333).setInteractive({ useHandCursor: true });
    const btnTxt = this.add.text(512, 500, "RETURN TO MENU", {
      fontSize: '28px',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    btnBg.on('pointerover', () => {
      this.tweens.add({ targets: [btnBg, btnTxt], scale: 1.1, duration: 150, ease: 'Power2' });
      btnBg.setFillStyle(0x555555);
    });
    
    btnBg.on('pointerout', () => {
      this.tweens.add({ targets: [btnBg, btnTxt], scale: 1.0, duration: 150, ease: 'Power2' });
      btnBg.setFillStyle(0x333333);
    });

    btnBg.on('pointerdown', () => {
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('PreparationScene');
      });
    });
  }
}

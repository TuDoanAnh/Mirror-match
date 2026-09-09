import Phaser from 'phaser';

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  init(data) {
    this.result = data.result || 'lose'; // 'win' or 'lose'
    this.level = data.level || 1;
  }

  create() {
    this.add.rectangle(0, 0, 1024, 768, 0x000000, 0.8).setOrigin(0);

    const isWin = this.result === 'win';
    
    let textStr = "DEFEAT!\nNO GOLD EARNED";
    let colorStr = "#ff0000";
    
    if (isWin) {
      const goldEarned = this.level * 50;
      let currentGold = this.registry.get('gold');
      this.registry.set('gold', currentGold + goldEarned);
      
      textStr = `VICTORY!\nEARNED ${goldEarned} GOLD`;
      colorStr = "#00ff00";
      
      let unlocked = this.registry.get('unlockedLevel');
      if (this.level === unlocked && unlocked < 5) {
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

    const btn = this.add.text(512, 500, "RETURN TO MENU", {
      fontSize: '32px',
      fill: '#ffffff',
      backgroundColor: '#333333',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setBackgroundColor('#555555'));
    btn.on('pointerout', () => btn.setBackgroundColor('#333333'));

    btn.on('pointerdown', () => {
      this.scene.start('PreparationScene');
    });
  }
}

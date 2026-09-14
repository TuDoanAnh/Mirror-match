import Phaser from 'phaser';
import { GAME_CONFIG } from './gameConfig';
import { getRandomAugments } from './AugmentManager';

export default class AugmentSelectScene extends Phaser.Scene {
  constructor() {
    super('AugmentSelectScene');
  }

  init(data) {
    this.nextLevel = data.nextLevel || 1;
  }

  create() {
    const width = GAME_CONFIG.CANVAS.WIDTH;
    const height = GAME_CONFIG.CANVAS.HEIGHT;
    const centerX = width / 2;
    const centerY = height / 2;

    this.add.rectangle(0, 0, width, height, 0x090d16, 0.94).setOrigin(0);

    // Title Header
    this.add.text(centerX, 120, "CHOOSE AN AUGMENT", {
      fontSize: '42px',
      fill: '#fde047',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    this.add.text(centerX, 170, "Enhance your skillshot abilities for the upcoming battles", {
      fontSize: '15px',
      fill: '#94a3b8'
    }).setOrigin(0.5);

    const owned = this.registry.get('augments') || [];
    const augments = getRandomAugments(3, owned);

    const cardWidth = 240;
    const cardHeight = 320;
    const cardGap = 270;
    const startX = centerX - cardGap;

    augments.forEach((aug, index) => {
      const cardX = startX + (index * cardGap);
      const cardY = centerY + 30;

      // Container for card elements
      const container = this.add.container(cardX, cardY);

      // Card Background (interactive)
      const cardBg = this.add.rectangle(0, 0, cardWidth, cardHeight, 0x0f172a).setInteractive({ useHandCursor: true });
      cardBg.setStrokeStyle(3, aug.color || 0x38bdf8, 0.9);

      // Icon Circle
      const iconBg = this.add.circle(0, -80, 36, aug.color || 0x38bdf8, 0.2);
      iconBg.setStrokeStyle(2, aug.color || 0x38bdf8);

      const iconTxt = this.add.text(0, -80, aug.icon, { fontSize: '32px' }).setOrigin(0.5);

      // Augment Name
      const nameTxt = this.add.text(0, -15, aug.name, {
        fontSize: '18px',
        fill: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      // Description Box
      const descTxt = this.add.text(0, 45, aug.desc, {
        fontSize: '13px',
        fill: '#cbd5e1',
        align: 'center',
        wordWrap: { width: 200 }
      }).setOrigin(0.5, 0);

      // Select Button Visual
      const selectBtn = this.add.rectangle(0, 120, 160, 36, 0x1e293b);
      selectBtn.setStrokeStyle(1.5, aug.color || 0x38bdf8);

      const selectTxt = this.add.text(0, 120, "SELECT", {
        fontSize: '14px',
        fill: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      container.add([cardBg, iconBg, iconTxt, nameTxt, descTxt, selectBtn, selectTxt]);

      // Card Hover Tweens (absolute Y positioning with killTweensOf)
      cardBg.on('pointerover', () => {
        this.tweens.killTweensOf(container);
        this.tweens.add({
          targets: container,
          y: cardY - 12,
          duration: 150,
          ease: 'Power2'
        });
        cardBg.setFillStyle(0x1e293b);
        selectBtn.setFillStyle(Phaser.Display.Color.HexStringToColor(aug.color || '#38bdf8').color);
      });

      cardBg.on('pointerout', () => {
        this.tweens.killTweensOf(container);
        this.tweens.add({
          targets: container,
          y: cardY,
          duration: 150,
          ease: 'Power2'
        });
        cardBg.setFillStyle(0x0f172a);
        selectBtn.setFillStyle(0x1e293b);
      });

      const onSelect = () => {
        let currentAugments = this.registry.get('augments') || [];
        currentAugments.push(aug);
        this.registry.set('augments', currentAugments);

        // Apply Glass Cannon immediately if selected
        if (aug.id === 'glassCannon') {
          let stats = this.registry.get('playerStats') || {};
          stats.bonusDamage = (stats.bonusDamage || 0) + 40;
          this.registry.set('playerStats', stats);
        }

        this.cameras.main.fadeOut(400, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('PreparationScene');
        });
      };

      cardBg.on('pointerdown', onSelect);
    });

    this.cameras.main.fadeIn(400, 0, 0, 0);
  }
}

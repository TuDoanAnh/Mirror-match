import Phaser from 'phaser';
import { GAME_CONFIG } from './gameConfig';
import { getRandomAugments } from './AugmentManager';
import { createTopRightBar } from './topRightBar';

export default class AugmentSelectScene extends Phaser.Scene {
  constructor() {
    super('AugmentSelectScene');
  }

  init(data) {
    this.nextLevel = data.nextLevel || 1;
    this.freeRerolls = 1; // 1 Free reroll per round victory
  }

  create() {
    createTopRightBar(this);
    const width = GAME_CONFIG.CANVAS.WIDTH;
    const height = GAME_CONFIG.CANVAS.HEIGHT;
    this.centerX = width / 2;
    this.centerY = height / 2;

    this.add.rectangle(0, 0, width, height, 0x090d16, 0.94).setOrigin(0);

    // Title Header
    this.add.text(this.centerX, 100, "CHOOSE AN AUGMENT", {
      fontSize: '42px',
      fill: '#fde047',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    this.add.text(this.centerX, 150, "Enhance your skillshot abilities for the upcoming battles", {
      fontSize: '15px',
      fill: '#94a3b8'
    }).setOrigin(0.5);

    // Current Gold Header Display
    this.gold = this.registry.get('gold') || 500;
    this.goldText = this.add.text(this.centerX, 185, `💰 GOLD: ${this.gold}G`, {
      fontSize: '16px',
      fill: '#fbbf24',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.cardContainers = [];
    this.rollNewAugments();
    this.createRerollButton();

    this.cameras.main.fadeIn(400, 0, 0, 0);
  }

  rollNewAugments() {
    // Clear previous card containers if rerolling
    if (this.cardContainers) {
      this.cardContainers.forEach(c => {
        if (c && c.active) c.destroy();
      });
    }
    this.cardContainers = [];

    const owned = this.registry.get('augments') || [];
    const heroId = this.registry.get('selectedHero') || 'ezreal';
    const augments = getRandomAugments(3, owned, heroId);

    const cardWidth = 240;
    const cardHeight = 320;
    const cardGap = 270;
    const startX = this.centerX - cardGap;

    augments.forEach((aug, index) => {
      const cardX = startX + (index * cardGap);
      const cardY = this.centerY + 30;

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

      // Pop in animation for cards
      container.setScale(0.8);
      container.alpha = 0;
      this.tweens.add({
        targets: container,
        scale: 1,
        alpha: 1,
        duration: 250 + (index * 70),
        ease: 'Back.easeOut'
      });

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
        const hoverColor = typeof aug.color === 'string' ? Phaser.Display.Color.HexStringToColor(aug.color).color : (aug.color || 0x38bdf8);
        selectBtn.setFillStyle(hoverColor);
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
      this.cardContainers.push(container);
    });
  }

  createRerollButton() {
    const rerollY = GAME_CONFIG.CANVAS.HEIGHT - 75;

    this.rerollBtnBg = this.add.rectangle(this.centerX, rerollY, 280, 48, 0x1e1b4b).setInteractive({ useHandCursor: true });
    this.rerollBtnBg.setStrokeStyle(2, 0x818cf8);

    this.rerollBtnTxt = this.add.text(this.centerX, rerollY, "", {
      fontSize: '15px',
      fill: '#a5b4fc',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.updateRerollButtonUI();

    this.rerollBtnBg.on('pointerover', () => {
      this.tweens.add({ targets: [this.rerollBtnBg, this.rerollBtnTxt], scale: 1.06, duration: 120 });
    });
    this.rerollBtnBg.on('pointerout', () => {
      this.tweens.add({ targets: [this.rerollBtnBg, this.rerollBtnTxt], scale: 1.0, duration: 120 });
    });
    this.rerollBtnBg.on('pointerdown', () => this.handleReroll());

    // Keyboard shortcut (R key)
    this.input.keyboard.on('keydown-R', () => this.handleReroll());
  }

  updateRerollButtonUI() {
    const cost = 50;
    if (this.freeRerolls > 0) {
      this.rerollBtnTxt.setText(`🎲 REROLL (FREE - ${this.freeRerolls} LEFT) [R]`);
      this.rerollBtnBg.setFillStyle(0x065f46, 0.95);
      this.rerollBtnBg.setStrokeStyle(2, 0x34d399);
      this.rerollBtnTxt.setColor('#6ee7b7');
    } else if (this.gold >= cost) {
      this.rerollBtnTxt.setText(`🎲 REROLL (${cost}G) [R]`);
      this.rerollBtnBg.setFillStyle(0x312e81, 0.95);
      this.rerollBtnBg.setStrokeStyle(2, 0x818cf8);
      this.rerollBtnTxt.setColor('#a5b4fc');
    } else {
      this.rerollBtnTxt.setText(`🎲 REROLL (${cost}G - NEED GOLD)`);
      this.rerollBtnBg.setFillStyle(0x334155, 0.6);
      this.rerollBtnBg.setStrokeStyle(2, 0x64748b);
      this.rerollBtnTxt.setColor('#94a3b8');
    }
  }

  handleReroll() {
    const cost = 50;
    if (this.freeRerolls > 0) {
      this.freeRerolls--;
      this.rollNewAugments();
      this.updateRerollButtonUI();
    } else if (this.gold >= cost) {
      this.gold -= cost;
      this.registry.set('gold', this.gold);
      this.goldText.setText(`💰 GOLD: ${this.gold}G`);
      this.rollNewAugments();
      this.updateRerollButtonUI();
    } else {
      // Shake camera if insufficient gold
      this.cameras.main.shake(150, 0.005);
    }
  }
}

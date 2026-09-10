import Phaser from 'phaser';
import EnemyBot from './EnemyBot';

export default class PreparationScene extends Phaser.Scene {
  constructor() {
    super('PreparationScene');
  }

  create() {
    // Registry initialization
    if (!this.registry.has('unlockedLevel')) {
      this.registry.set('unlockedLevel', 1);
      this.registry.set('gold', 350);
      this.registry.set('playerStats', { 
        bonusDamage: 0, bonusSpeed: 0, bonusHP: 0, cdr: 0, 
        armor: 0, lifesteal: 0, critChance: 0, armorPen: 0 
      });
      this.registry.set('inventory', []);
    }

    this.add.rectangle(0, 0, 1024, 768, 0x111111).setOrigin(0);

    // Ambient BG Grid
    const grid = this.add.grid(512, 384, 1024, 768, 64, 64, 0x000000, 0, 0x222222, 0.5);
    this.tweens.add({
      targets: grid,
      y: 384 + 64,
      duration: 3000,
      repeat: -1,
      yoyo: true,
      ease: 'Sine.easeInOut'
    });

    this.selectedItem = null;

    this.drawLeftPanel();
    this.drawCenterPanel();
    this.drawRightPanel();

    // Fade In
    this.cameras.main.fadeIn(500, 0, 0, 0);
  }

  drawLeftPanel() {
    // Left Panel bounds: x = 50 to 300 (width 250), Center X = 175
    const centerX = 175;
    let currentY = 50;

    // Background
    this.add.rectangle(50, 50, 250, 668, 0x1a1a1a).setOrigin(0, 0);

    // Title
    currentY += 40;
    this.add.text(centerX, currentY, "ENEMY STATUS", { fontSize: '24px', fill: '#ff5555', fontStyle: 'bold' }).setOrigin(0.5);

    // Level
    currentY += 40;
    const level = this.registry.get('unlockedLevel');
    this.add.text(centerX, currentY, `LEVEL ${level}`, { fontSize: '20px', fill: '#ffffff' }).setOrigin(0.5);

    // Graphic
    currentY += 60;
    this.add.circle(centerX, currentY, 32, 0xff0000);

    // Stats (2 Columns)
    currentY += 60;
    
    // Pure stats calculation based on level (no sprite creation needed)
    const enemyStats = {
      maxHp: 1000,
      atk: 100,
      armor: 0,
      speed: 200,
      critChance: 0,
      cdr: 0,
      lifesteal: 0,
      armorPen: 0
    };

    if (level === 2) {
      enemyStats.speed *= 1.2; enemyStats.maxHp *= 1.2; enemyStats.armor = 25;
      enemyStats.atk *= 1.2; enemyStats.cdr = 15;
    } else if (level === 3) {
      enemyStats.speed *= 1.5; enemyStats.maxHp *= 1.5; enemyStats.armor = 50;
      enemyStats.armorPen = 10; enemyStats.atk *= 1.5; enemyStats.cdr = 30;
    } else if (level === 4) {
      enemyStats.speed *= 1.8; enemyStats.maxHp *= 2; enemyStats.armor = 75;
      enemyStats.armorPen = 20; enemyStats.critChance = 10; enemyStats.atk *= 2; enemyStats.cdr = 40;
    } else if (level === 5) {
      enemyStats.speed *= 2.5; enemyStats.maxHp *= 3.5; enemyStats.armor = 100;
      enemyStats.armorPen = 30; enemyStats.critChance = 25; enemyStats.lifesteal = 10;
      enemyStats.atk *= 3; enemyStats.cdr = 70;
    }
    
    const col1X = 65;
    const col2X = 175;

    this.add.text(col1X, currentY, `HP: ${Math.round(enemyStats.maxHp)}`, { fontSize: '14px', fill: '#aaaaaa' });
    this.add.text(col1X, currentY + 25, `ATK: ${Math.round(enemyStats.atk)}`, { fontSize: '14px', fill: '#aaaaaa' });
    this.add.text(col1X, currentY + 50, `Armor: ${Math.round(enemyStats.armor)}`, { fontSize: '14px', fill: '#aaaaaa' });
    this.add.text(col1X, currentY + 75, `Speed: ${Math.round(enemyStats.speed)}`, { fontSize: '14px', fill: '#aaaaaa' });

    this.add.text(col2X, currentY, `Crit: ${Math.round(enemyStats.critChance)}%`, { fontSize: '14px', fill: '#aaaaaa' });
    this.add.text(col2X, currentY + 25, `CDR: ${Math.round(enemyStats.cdr)}%`, { fontSize: '14px', fill: '#aaaaaa' });
    this.add.text(col2X, currentY + 50, `Lifesteal: ${Math.round(enemyStats.lifesteal)}%`, { fontSize: '14px', fill: '#aaaaaa' });
    this.add.text(col2X, currentY + 75, `Arm Pen: ${Math.round(enemyStats.armorPen)}%`, { fontSize: '14px', fill: '#aaaaaa' });
  }

  drawCenterPanel() {
    // Center Panel bounds: x = 350 to 650 (width 300), Center X = 500
    const centerX = 500;
    let currentY = 50;

    // Background
    this.add.rectangle(350, 50, 300, 668, 0x1a1a1a).setOrigin(0, 0);

    // Title
    currentY += 40;
    this.add.text(centerX, currentY, "SHOP", { fontSize: '24px', fill: '#ffcc00', fontStyle: 'bold' }).setOrigin(0.5);

    this.shopItems = [
      { id: 'bonusDamage', name: 'Long Sword', statStr: '+10 Damage', val: 10, cost: 350, color: 0x8888ff },
      { id: 'armor', name: 'Cloth Armor', statStr: '+15 Armor', val: 15, cost: 300, color: 0x88ff88 },
      { id: 'lifesteal', name: 'Vamp Scepter', statStr: '+10% Lifesteal', val: 10, cost: 400, color: 0xff0000 },
      { id: 'critChance', name: "Brawler Gloves", statStr: '+10% Crit Chance', val: 10, cost: 400, color: 0xffa500 },
      { id: 'armorPen', name: 'Last Whisper', statStr: '+20% Armor Pen', val: 20, cost: 900, color: 0x00ffff }
    ];

    // Grid properties
    currentY += 70;
    let row = 0;
    let col = 0;
    const paddingX = 90;
    const paddingY = 110;
    // 3 columns means centers at 410, 500, 590
    
    this.itemButtons = [];

    this.shopItems.forEach((item, index) => {
      const x = 410 + (col * paddingX);
      const y = currentY + (row * paddingY);

      const box = this.add.rectangle(x, y, 64, 64, item.color).setInteractive({ useHandCursor: true });
      const priceText = this.add.text(x, y + 45, `${item.cost}G`, { fontSize: '16px', fill: '#ffff00' }).setOrigin(0.5);

      box.on('pointerover', () => {
        this.tweens.add({ targets: [box, priceText], scale: 1.15, duration: 150, ease: 'Power2' });
      });
      box.on('pointerout', () => {
        this.tweens.add({ targets: [box, priceText], scale: 1.0, duration: 150, ease: 'Power2' });
      });

      box.on('pointerdown', () => {
        this.selectedItem = item;
        this.updateRightPanel();
      });

      this.itemButtons.push(box);

      col++;
      if (col > 2) {
        col = 0;
        row++;
      }
    });
  }

  drawRightPanel() {
    // Right Panel bounds: x = 700 to 1000 (width 300), Center X = 850
    const centerX = 850;
    let currentY = 50;

    // Background
    this.add.rectangle(700, 50, 300, 668, 0x1a1a1a).setOrigin(0, 0);

    // Gold
    currentY += 40;
    this.goldText = this.add.text(980, currentY, `GOLD: ${this.registry.get('gold')}`, { fontSize: '24px', fill: '#ffff00', fontStyle: 'bold' }).setOrigin(1, 0.5);

    // Inventory Title
    currentY += 50;
    this.add.text(centerX, currentY, "INVENTORY", { fontSize: '20px', fill: '#ffffff' }).setOrigin(0.5);

    // Inventory Slots (2 rows of 3 slots)
    currentY += 40;
    this.inventorySlots = [];
    for(let i=0; i<6; i++) {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const x = 790 + (col * 60);
      const y = currentY + (row * 60);
      
      const slotBg = this.add.rectangle(x, y, 50, 50, 0x333333);
      this.inventorySlots.push(slotBg);
    }

    // Player Stats Title
    currentY += 110;
    this.add.text(centerX, currentY, "PLAYER STATS", { fontSize: '18px', fill: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);

    // Detailed Stats (2 columns)
    currentY += 30;
    const stats = this.registry.get('playerStats');
    const col1X = 720;
    const col2X = 850;
    
    // To allow dynamic updating of the UI when an item is bought, store these texts
    this.statTexts = {
      hp: this.add.text(col1X, currentY, `HP: ${1000 + stats.bonusHP}`, { fontSize: '14px', fill: '#aaaaaa' }),
      atk: this.add.text(col1X, currentY + 20, `ATK: ${100 + stats.bonusDamage}`, { fontSize: '14px', fill: '#aaaaaa' }),
      armor: this.add.text(col1X, currentY + 40, `Armor: ${stats.armor}`, { fontSize: '14px', fill: '#aaaaaa' }),
      speed: this.add.text(col1X, currentY + 60, `Speed: ${200 + stats.bonusSpeed}`, { fontSize: '14px', fill: '#aaaaaa' }),

      crit: this.add.text(col2X, currentY, `Crit: ${stats.critChance}%`, { fontSize: '14px', fill: '#aaaaaa' }),
      cdr: this.add.text(col2X, currentY + 20, `CDR: ${stats.cdr * 100}%`, { fontSize: '14px', fill: '#aaaaaa' }),
      lifesteal: this.add.text(col2X, currentY + 40, `Lifesteal: ${stats.lifesteal}%`, { fontSize: '14px', fill: '#aaaaaa' }),
      armPen: this.add.text(col2X, currentY + 60, `Arm Pen: ${stats.armorPen}%`, { fontSize: '14px', fill: '#aaaaaa' })
    };

    // Item Description Box
    currentY += 120;
    this.descBox = this.add.rectangle(centerX, currentY + 30, 260, 90, 0x222222);
    this.descName = this.add.text(centerX, currentY, "SELECT AN ITEM", { fontSize: '18px', fill: '#ffffff' }).setOrigin(0.5);
    this.descStat = this.add.text(centerX, currentY + 30, "", { fontSize: '16px', fill: '#00ff00' }).setOrigin(0.5);
    this.descCost = this.add.text(centerX, currentY + 60, "", { fontSize: '18px', fill: '#ffff00' }).setOrigin(0.5);

    // BUY Button
    currentY += 120;
    this.buyBtnBg = this.add.rectangle(centerX, currentY, 150, 40, 0x555555).setInteractive({ useHandCursor: true });
    this.buyBtnText = this.add.text(centerX, currentY, "BUY", { fontSize: '20px', fill: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
    
    this.buyBtnBg.on('pointerover', () => this.tweens.add({ targets: [this.buyBtnBg, this.buyBtnText], scale: 1.1, duration: 150, ease: 'Power2' }));
    this.buyBtnBg.on('pointerout', () => this.tweens.add({ targets: [this.buyBtnBg, this.buyBtnText], scale: 1.0, duration: 150, ease: 'Power2' }));
    this.buyBtnBg.on('pointerdown', () => this.buyItem());

    // READY Button
    currentY += 80;
    const readyBtn = this.add.rectangle(centerX, currentY, 200, 60, 0x00aa00).setInteractive({ useHandCursor: true });
    const readyTxt = this.add.text(centerX, currentY, "READY", { fontSize: '28px', fill: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);

    readyBtn.on('pointerover', () => this.tweens.add({ targets: [readyBtn, readyTxt], scale: 1.05, duration: 150, ease: 'Power2' }));
    readyBtn.on('pointerout', () => this.tweens.add({ targets: [readyBtn, readyTxt], scale: 1.0, duration: 150, ease: 'Power2' }));

    readyBtn.on('pointerdown', () => {
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('GameScene', {
          level: this.registry.get('unlockedLevel'),
          color: 0x0088ff
        });
      });
    });

    this.updateInventoryView();
  }

  updateRightPanel() {
    if (!this.selectedItem) return;

    this.descName.setText(this.selectedItem.name);
    this.descStat.setText(this.selectedItem.statStr);
    this.descCost.setText(`${this.selectedItem.cost}G`);

    this.buyBtnBg.setFillStyle(0x0055ff);
  }

  updatePlayerStatsUI() {
    const stats = this.registry.get('playerStats');
    this.statTexts.hp.setText(`HP: ${1000 + stats.bonusHP}`);
    this.statTexts.atk.setText(`ATK: ${100 + stats.bonusDamage}`);
    this.statTexts.armor.setText(`Armor: ${stats.armor}`);
    this.statTexts.speed.setText(`Speed: ${200 + stats.bonusSpeed}`);
    this.statTexts.crit.setText(`Crit: ${stats.critChance}%`);
    this.statTexts.cdr.setText(`CDR: ${stats.cdr * 100}%`);
    this.statTexts.lifesteal.setText(`Lifesteal: ${stats.lifesteal}%`);
    this.statTexts.armPen.setText(`Arm Pen: ${stats.armorPen}%`);
  }

  buyItem() {
    if (!this.selectedItem) return;

    let gold = this.registry.get('gold');
    let inv = this.registry.get('inventory');

    if (gold >= this.selectedItem.cost && inv.length < 6) {
      // Deduct gold
      gold -= this.selectedItem.cost;
      this.registry.set('gold', gold);

      // Add to inventory
      inv.push(this.selectedItem);
      this.registry.set('inventory', inv);

      // Update global stats
      let stats = this.registry.get('playerStats');
      stats[this.selectedItem.id] += this.selectedItem.val;
      this.registry.set('playerStats', stats);

      this.goldText.setText(`GOLD: ${gold}`);
      this.updateInventoryView();
      this.updatePlayerStatsUI();

      // Flash effect
      this.buyBtnBg.setFillStyle(0xffffff);
      this.time.delayedCall(100, () => this.buyBtnBg.setFillStyle(0x0055ff));
    } else {
      // Error effect
      this.buyBtnBg.setFillStyle(0xff0000);
      this.time.delayedCall(100, () => this.buyBtnBg.setFillStyle(0x0055ff));
    }
  }

  updateInventoryView() {
    const inv = this.registry.get('inventory');
    this.inventorySlots.forEach((slot, index) => {
      if (index < inv.length) {
        slot.setFillStyle(inv[index].color);
      } else {
        slot.setFillStyle(0x333333);
      }
    });
  }
}

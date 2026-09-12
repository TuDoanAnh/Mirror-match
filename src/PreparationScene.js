import Phaser from 'phaser';
import EnemyBot from './EnemyBot';
import { GAME_CONFIG } from './gameConfig';
import { preloadLuxAssets, createLuxAnimations } from './luxAnimations';
import { preloadCharacterSFX, playPreparationBGM, stopPreparationBGM } from './soundManager';

export default class PreparationScene extends Phaser.Scene {
  constructor() {
    super('PreparationScene');
  }

  preload() {
    preloadLuxAssets(this);
    preloadCharacterSFX(this);
  }

  create() {
    createLuxAnimations(this);
    playPreparationBGM(this);

    // Registry initialization
    if (!this.registry.has('unlockedLevel')) {
      this.registry.set('unlockedLevel', 4);
      this.registry.set('gold', GAME_CONFIG.ECONOMY.STARTING_GOLD);
      this.registry.set('playerStats', { 
        bonusDamage: 0, bonusSpeed: 0, bonusHP: 0, cdr: 0, 
        armor: 0, lifesteal: 0, critChance: 0, armorPen: 0 
      });
      this.registry.set('inventory', []);
    }

    if (!this.registry.has('selectedHero')) {
      this.registry.set('selectedHero', 'lux');
    }

    const width = GAME_CONFIG.CANVAS.WIDTH;
    const height = GAME_CONFIG.CANVAS.HEIGHT;

    this.add.rectangle(0, 0, width, height, 0x111111).setOrigin(0);

    // Ambient BG Grid
    const grid = this.add.grid(width / 2, height / 2, width, height, 64, 64, 0x000000, 0, 0x222222, 0.5);
    this.tweens.add({
      targets: grid,
      y: (height / 2) + 64,
      duration: 3000,
      repeat: -1,
      yoyo: true,
      ease: 'Sine.easeInOut'
    });

    this.selectedItem = null;
    this.selectedInventoryIndex = null;

    this.drawLeftPanel();
    this.drawCenterPanel();
    this.drawRightPanel();

    // Fade In
    this.cameras.main.fadeIn(500, 0, 0, 0);
  }

  drawLeftPanel() {
    // Left Panel bounds: startX = 293, width = 250, Center X = 418, topY = 178
    const startX = 293;
    const topY = 178;
    const centerX = startX + 125;
    let currentY = topY;

    // Background
    this.add.rectangle(startX, topY, 250, 668, 0x1a1a1a).setOrigin(0, 0);

    // Title
    currentY += 30;
    this.add.text(centerX, currentY, "ENEMY STATUS", { fontSize: '20px', fill: '#ff5555', fontStyle: 'bold' }).setOrigin(0.5);

    // Level
    currentY += 30;
    const level = this.registry.get('unlockedLevel');
    this.add.text(centerX, currentY, `LEVEL ${level} (EZREAL BOT)`, { fontSize: '13px', fill: '#ffffff' }).setOrigin(0.5);

    // Graphic (Ezreal Bot Sprite)
    currentY += 45;
    this.add.circle(centerX, currentY, 26, 0xffffff, 0.25);
    const ezrealBotSprite = this.add.sprite(centerX, currentY, 'ezreal_spritesheet', 0);
    ezrealBotSprite.setScale(1.2);
    if (this.anims.exists('ezreal_idle')) {
      ezrealBotSprite.play('ezreal_idle');
    }

    // Stats (2 Columns)
    currentY += 45;
    
    const scale = GAME_CONFIG.BOT_SCALING[level] || GAME_CONFIG.BOT_SCALING[1];
    const enemyStats = {
      maxHp: GAME_CONFIG.CHARACTERS.ezreal.baseStats.hp * scale.hpMult,
      atk: GAME_CONFIG.CHARACTERS.ezreal.skills.Q.config.damage * scale.dmgMult,
      armor: scale.armor,
      speed: GAME_CONFIG.CHARACTERS.ezreal.baseStats.speed * scale.speedMult,
      critChance: scale.critChance,
      cdr: Math.round((1 - scale.cdrMult) * 100),
      lifesteal: scale.lifesteal,
      armorPen: scale.armorPen
    };
    
    const col1X = centerX - 110;
    const col2X = centerX;

    this.add.text(col1X, currentY, `HP: ${Math.round(enemyStats.maxHp)}`, { fontSize: '13px', fill: '#aaaaaa' });
    this.add.text(col1X, currentY + 20, `ATK: ${Math.round(enemyStats.atk)}`, { fontSize: '13px', fill: '#aaaaaa' });
    this.add.text(col1X, currentY + 40, `Armor: ${Math.round(enemyStats.armor)}`, { fontSize: '13px', fill: '#aaaaaa' });
    this.add.text(col1X, currentY + 60, `Speed: ${Math.round(enemyStats.speed)}`, { fontSize: '13px', fill: '#aaaaaa' });

    this.add.text(col2X, currentY, `Crit: ${Math.round(enemyStats.critChance)}%`, { fontSize: '13px', fill: '#aaaaaa' });
    this.add.text(col2X, currentY + 20, `CDR: ${Math.round(enemyStats.cdr)}%`, { fontSize: '13px', fill: '#aaaaaa' });
    this.add.text(col2X, currentY + 40, `Lifesteal: ${Math.round(enemyStats.lifesteal)}%`, { fontSize: '13px', fill: '#aaaaaa' });
    this.add.text(col2X, currentY + 60, `Arm Pen: ${Math.round(enemyStats.armorPen)}%`, { fontSize: '13px', fill: '#aaaaaa' });

    // Hero Selection Section
    this.drawHeroSelection(centerX, currentY + 105);
  }

  drawHeroSelection(centerX, startY) {
    let currentY = startY;
    const unlockedLevel = this.registry.get('unlockedLevel');

    this.add.text(centerX, currentY, "HERO SELECT", { fontSize: '18px', fill: '#00ffff', fontStyle: 'bold' }).setOrigin(0.5);
    
    currentY += 40;
    const heroes = ['ezreal', 'lux', 'jinx'];
    const currentHero = this.registry.get('selectedHero') || 'ezreal';

    const selectHeroById = (hId) => {
      const current = this.registry.get('selectedHero');
      if (current !== hId) {
        this.registry.set('selectedHero', hId);
        this.scene.restart();
      }
    };

    const keys = this.input.keyboard.addKeys({
      one: Phaser.Input.Keyboard.KeyCodes.ONE,
      two: Phaser.Input.Keyboard.KeyCodes.TWO,
      three: Phaser.Input.Keyboard.KeyCodes.THREE,
      numOne: Phaser.Input.Keyboard.KeyCodes.NUMPAD_ONE,
      numTwo: Phaser.Input.Keyboard.KeyCodes.NUMPAD_TWO,
      numThree: Phaser.Input.Keyboard.KeyCodes.NUMPAD_THREE
    });

    keys.one.on('down', () => selectHeroById('ezreal'));
    keys.numOne.on('down', () => selectHeroById('ezreal'));
    keys.two.on('down', () => selectHeroById('lux'));
    keys.numTwo.on('down', () => selectHeroById('lux'));
    keys.three.on('down', () => selectHeroById('jinx'));
    keys.numThree.on('down', () => selectHeroById('jinx'));

    heroes.forEach((hId, index) => {
      const heroData = GAME_CONFIG.CHARACTERS[hId];
      const x = (centerX - 85) + (index * 85);
      const isSelected = hId === currentHero;

      const btnColor = isSelected ? heroData.color : 0x333333;
      const btn = this.add.rectangle(x, currentY, 75, 32, btnColor).setInteractive({ useHandCursor: true });
      if (isSelected) btn.setStrokeStyle(2, 0xffffff);

      const txtColor = isSelected ? '#000000' : '#ffffff';
      const txt = this.add.text(x, currentY, heroData.name, { fontSize: '13px', fill: txtColor, fontStyle: 'bold' }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      btn.on('pointerdown', () => selectHeroById(hId));
      txt.on('pointerdown', () => selectHeroById(hId));
    });

    // Hero Avatar Graphic
    currentY += 55;
    const selectedData = GAME_CONFIG.CHARACTERS[currentHero];
    
    // Outer ring & inner color circle or character sprite
    this.add.circle(centerX, currentY, 26, 0xffffff, 0.25);
    if (['ezreal', 'lux', 'jinx'].includes(currentHero)) {
      const sheetKey = `${currentHero}_spritesheet`;
      const idleKey = `${currentHero}_idle`;
      const heroSprite = this.add.sprite(centerX, currentY, sheetKey, 0);
      heroSprite.setScale(1.2);
      if (this.anims.exists(idleKey)) {
        heroSprite.play(idleKey);
      }
    } else {
      this.add.circle(centerX, currentY, 22, selectedData.color);
    }

    // Hero Description Info
    currentY += 50;
    this.add.text(centerX, currentY, `${selectedData.name} - ${selectedData.title}`, { fontSize: '13px', fill: '#ffff00', fontStyle: 'bold' }).setOrigin(0.5);

    currentY += 25;
    this.add.text(centerX, currentY, selectedData.description, { fontSize: '11px', fill: '#aaaaaa', align: 'center', wordWrap: { width: 230 } }).setOrigin(0.5, 0);

    // Reset Progress Button (Always available for convenience)
    currentY += 105;
    const resetBtn = this.add.rectangle(centerX, currentY, 200, 30, 0x661111).setInteractive({ useHandCursor: true });
    this.add.text(centerX, currentY, "RESET TO LEVEL 1", { fontSize: '13px', fill: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);

    resetBtn.on('pointerdown', () => {
      this.registry.set('unlockedLevel', 1);
      this.registry.set('gold', GAME_CONFIG.ECONOMY.STARTING_GOLD);
      this.registry.set('playerStats', { bonusDamage: 0, bonusSpeed: 0, bonusHP: 0, cdr: 0, armor: 0, lifesteal: 0, critChance: 0, armorPen: 0 });
      this.registry.set('inventory', []);
      this.scene.restart();
    });
  }

  drawCenterPanel() {
    // Center Panel bounds: startX = 593, width = 300, Center X = 743, topY = 178
    const startX = 593;
    const topY = 178;
    const centerX = startX + 150;
    let currentY = topY;

    // Background
    this.add.rectangle(startX, topY, 300, 668, 0x1a1a1a).setOrigin(0, 0);

    // Title
    currentY += 40;
    this.add.text(centerX, currentY, "SHOP", { fontSize: '24px', fill: '#ffcc00', fontStyle: 'bold' }).setOrigin(0.5);

    this.shopItems = GAME_CONFIG.SHOP_ITEMS;

    // Grid properties
    currentY += 70;
    let row = 0;
    let col = 0;
    const paddingX = 90;
    const paddingY = 110;
    
    this.itemButtons = [];

    this.shopItems.forEach((item, index) => {
      const x = (centerX - 90) + (col * paddingX);
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
        this.selectedInventoryIndex = null;
        this.updateRightPanel();
        this.updateInventoryView();
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
    // Right Panel bounds: startX = 943, width = 300, Center X = 1093, topY = 178
    const startX = 943;
    const topY = 178;
    const centerX = startX + 150;
    let currentY = topY;

    // Background
    this.add.rectangle(startX, topY, 300, 668, 0x1a1a1a).setOrigin(0, 0);

    // Gold
    currentY += 40;
    this.goldText = this.add.text(startX + 280, currentY, `GOLD: ${this.registry.get('gold')}`, { fontSize: '24px', fill: '#ffff00', fontStyle: 'bold' }).setOrigin(1, 0.5);

    // Inventory Title
    currentY += 50;
    this.add.text(centerX, currentY, "INVENTORY", { fontSize: '20px', fill: '#ffffff' }).setOrigin(0.5);

    // Inventory Slots (2 rows of 3 slots)
    currentY += 40;
    this.inventorySlots = [];
    for(let i=0; i<6; i++) {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const x = (centerX - 60) + (col * 60);
      const y = currentY + (row * 60);
      
      const slotBg = this.add.rectangle(x, y, 50, 50, 0x333333).setInteractive({ useHandCursor: true });
      
      slotBg.on('pointerover', () => {
        const inv = this.registry.get('inventory');
        if (i < inv.length) {
          this.tweens.add({ targets: slotBg, scale: 1.1, duration: 100, ease: 'Power2' });
        }
      });
      slotBg.on('pointerout', () => {
        this.tweens.add({ targets: slotBg, scale: 1.0, duration: 100, ease: 'Power2' });
      });
      slotBg.on('pointerdown', () => {
        const inv = this.registry.get('inventory');
        if (i < inv.length) {
          this.selectedInventoryIndex = i;
          this.selectedItem = null;
          this.updateRightPanel();
          this.updateInventoryView();
        }
      });

      this.inventorySlots.push(slotBg);
    }

    // Player Stats Title
    currentY += 110;
    this.add.text(centerX, currentY, "PLAYER STATS", { fontSize: '18px', fill: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);

    // Detailed Stats (2 columns)
    currentY += 30;
    const stats = this.registry.get('playerStats');
    const col1X = centerX - 130;
    const col2X = centerX;
    
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

    // BUY & SELL Buttons
    currentY += 120;
    const btnY = currentY;

    // BUY Button (Left)
    this.buyBtnBg = this.add.rectangle(centerX - 65, btnY, 110, 40, 0x555555).setInteractive({ useHandCursor: true });
    this.buyBtnText = this.add.text(centerX - 65, btnY, "BUY", { fontSize: '18px', fill: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
    
    this.buyBtnBg.on('pointerover', () => this.tweens.add({ targets: [this.buyBtnBg, this.buyBtnText], scale: 1.08, duration: 150, ease: 'Power2' }));
    this.buyBtnBg.on('pointerout', () => this.tweens.add({ targets: [this.buyBtnBg, this.buyBtnText], scale: 1.0, duration: 150, ease: 'Power2' }));
    this.buyBtnBg.on('pointerdown', () => this.buyItem());

    // SELL Button (Right)
    this.sellBtnBg = this.add.rectangle(centerX + 65, btnY, 110, 40, 0x555555).setInteractive({ useHandCursor: true });
    this.sellBtnText = this.add.text(centerX + 65, btnY, "SELL", { fontSize: '18px', fill: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);

    this.sellBtnBg.on('pointerover', () => this.tweens.add({ targets: [this.sellBtnBg, this.sellBtnText], scale: 1.08, duration: 150, ease: 'Power2' }));
    this.sellBtnBg.on('pointerout', () => this.tweens.add({ targets: [this.sellBtnBg, this.sellBtnText], scale: 1.0, duration: 150, ease: 'Power2' }));
    this.sellBtnBg.on('pointerdown', () => this.sellItem());

    // READY Button
    currentY += 80;
    const readyBtn = this.add.rectangle(centerX, currentY, 200, 60, 0x00aa00).setInteractive({ useHandCursor: true });
    const readyTxt = this.add.text(centerX, currentY, "READY", { fontSize: '28px', fill: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    const onReady = () => {
      stopPreparationBGM(this);
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('GameScene', {
          level: this.registry.get('unlockedLevel'),
          color: 0x0088ff
        });
      });
    };

    readyBtn.on('pointerover', () => this.tweens.add({ targets: [readyBtn, readyTxt], scale: 1.05, duration: 150, ease: 'Power2' }));
    readyBtn.on('pointerout', () => this.tweens.add({ targets: [readyBtn, readyTxt], scale: 1.0, duration: 150, ease: 'Power2' }));
    readyBtn.on('pointerdown', onReady);
    readyTxt.on('pointerdown', onReady);
    this.input.keyboard.once('keydown-ENTER', onReady);

    this.updateInventoryView();
  }

  updateRightPanel() {
    if (this.selectedItem) {
      // Shop item selected
      this.descName.setText(this.selectedItem.name);
      this.descStat.setText(this.selectedItem.statStr);
      this.descCost.setText(`Buy: ${this.selectedItem.cost}G`);
      this.descCost.setColor('#ffff00');

      this.buyBtnBg.setFillStyle(0x0055ff);
      this.sellBtnBg.setFillStyle(0x555555);
    } else if (this.selectedInventoryIndex !== null) {
      // Inventory item selected
      const inv = this.registry.get('inventory');
      if (this.selectedInventoryIndex < inv.length) {
        const item = inv[this.selectedInventoryIndex];
        const sellPrice = Math.floor(item.cost * GAME_CONFIG.ECONOMY.SELL_REFUND_RATIO);

        this.descName.setText(`${item.name} (Owned)`);
        this.descStat.setText(item.statStr);
        this.descCost.setText(`Sell: +${sellPrice}G (${Math.round(GAME_CONFIG.ECONOMY.SELL_REFUND_RATIO * 100)}%)`);
        this.descCost.setColor('#ffaa00');

        this.buyBtnBg.setFillStyle(0x555555);
        this.sellBtnBg.setFillStyle(0xd35400);
      }
    } else {
      this.descName.setText("SELECT AN ITEM");
      this.descStat.setText("");
      this.descCost.setText("");

      this.buyBtnBg.setFillStyle(0x555555);
      this.sellBtnBg.setFillStyle(0x555555);
    }
  }

  updatePlayerStatsUI() {
    const stats = this.registry.get('playerStats');
    const heroId = this.registry.get('selectedHero') || 'ezreal';
    const heroData = GAME_CONFIG.CHARACTERS[heroId] || GAME_CONFIG.CHARACTERS.ezreal;

    const baseHp = heroData.baseStats.hp;
    const baseAtk = heroData.skills.Q.config.damage;
    const baseSpeed = heroData.baseStats.speed;

    this.statTexts.hp.setText(`HP: ${baseHp + stats.bonusHP}`);
    this.statTexts.atk.setText(`ATK: ${baseAtk + stats.bonusDamage}`);
    this.statTexts.armor.setText(`Armor: ${heroData.baseStats.armor + stats.armor}`);
    this.statTexts.speed.setText(`Speed: ${baseSpeed + stats.bonusSpeed}`);
    this.statTexts.crit.setText(`Crit: ${heroData.baseStats.critChance + stats.critChance}%`);
    this.statTexts.cdr.setText(`CDR: ${Math.round(stats.cdr * 100)}%`);
    this.statTexts.lifesteal.setText(`Lifesteal: ${heroData.baseStats.lifesteal + stats.lifesteal}%`);
    this.statTexts.armPen.setText(`Arm Pen: ${heroData.baseStats.armorPen + stats.armorPen}%`);
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

  sellItem() {
    if (this.selectedInventoryIndex === null) return;

    let inv = this.registry.get('inventory');
    if (this.selectedInventoryIndex < 0 || this.selectedInventoryIndex >= inv.length) return;

    const item = inv[this.selectedInventoryIndex];
    const sellPrice = Math.floor(item.cost * GAME_CONFIG.ECONOMY.SELL_REFUND_RATIO);

    // Refund gold
    let gold = this.registry.get('gold') + sellPrice;
    this.registry.set('gold', gold);

    // Deduct player stats
    let stats = this.registry.get('playerStats');
    stats[item.id] = Math.max(0, stats[item.id] - item.val);
    this.registry.set('playerStats', stats);

    // Remove item from inventory
    inv.splice(this.selectedInventoryIndex, 1);
    this.registry.set('inventory', inv);

    // Reset selection
    this.selectedInventoryIndex = null;
    this.updateRightPanel();

    // Update UI
    this.goldText.setText(`GOLD: ${gold}`);
    this.updateInventoryView();
    this.updatePlayerStatsUI();

    // Flash effect
    this.sellBtnBg.setFillStyle(0xffffff);
    this.time.delayedCall(100, () => this.sellBtnBg.setFillStyle(0x555555));
  }

  updateInventoryView() {
    const inv = this.registry.get('inventory');
    this.inventorySlots.forEach((slot, index) => {
      if (index < inv.length) {
        slot.setFillStyle(inv[index].color);
        if (index === this.selectedInventoryIndex) {
          slot.setStrokeStyle(3, 0xffffff);
        } else {
          slot.setStrokeStyle(1, 0x444444);
        }
      } else {
        slot.setFillStyle(0x333333);
        slot.setStrokeStyle(1, 0x222222);
      }
    });
  }
}

import Phaser from 'phaser';
import EnemyBot from './EnemyBot';
import { GAME_CONFIG } from './gameConfig';
import { preloadLuxAssets, createLuxAnimations } from './luxAnimations';
import { preloadEzrealSkillAssets, createEzrealSkillAnimations } from './ezrealSkillAnimations';
import { preloadJinxAssets, createJinxAnimations } from './jinxAnimations';
import { preloadCharacterSFX, playPreparationBGM, stopPreparationBGM } from './soundManager';

export default class PreparationScene extends Phaser.Scene {
  constructor() {
    super('PreparationScene');
  }

  preload() {
    preloadLuxAssets(this);
    preloadEzrealSkillAssets(this);
    preloadJinxAssets(this);
    preloadCharacterSFX(this);
  }

  create() {
    createLuxAnimations(this);
    createEzrealSkillAnimations(this);
    createJinxAnimations(this);
    playPreparationBGM(this);

    // Registry initialization
    if (!this.registry.has('unlockedLevel')) {
      this.registry.set('unlockedLevel', 1);
    }
    if (!this.registry.has('selectedLevel')) {
      this.registry.set('selectedLevel', this.registry.get('unlockedLevel'));
    }
    if (!this.registry.has('gold')) {
      this.registry.set('gold', GAME_CONFIG.ECONOMY.STARTING_GOLD);
    }
    if (!this.registry.has('playerStats')) {
      this.registry.set('playerStats', { 
        bonusDamage: 0, bonusSpeed: 0, bonusHP: 0, cdr: 0, 
        armor: 0, lifesteal: 0, critChance: 0, armorPen: 0 
      });
    }
    if (!this.registry.has('inventory')) {
      this.registry.set('inventory', []);
    }
    if (!this.registry.has('selectedHero')) {
      this.registry.set('selectedHero', 'ezreal');
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

    // Selected Level Text
    currentY += 28;
    const unlockedLevel = this.registry.get('unlockedLevel') || 1;
    let selectedLevel = this.registry.get('selectedLevel') || unlockedLevel;
    if (selectedLevel > unlockedLevel) {
      selectedLevel = unlockedLevel;
      this.registry.set('selectedLevel', selectedLevel);
    }

    this.levelTitleText = this.add.text(centerX, currentY, `LEVEL ${selectedLevel} (EZREAL BOT)`, { fontSize: '13px', fill: '#ffff00', fontStyle: 'bold' }).setOrigin(0.5);

    // Level Selector 1..10 (2 Rows of 5 Buttons)
    currentY += 35;
    this.levelButtons = [];
    const btnSize = 36;
    const gapX = 44;

    for (let i = 1; i <= 10; i++) {
      const row = i <= 5 ? 0 : 1;
      const col = (i - 1) % 5;
      const bx = (centerX - 88) + (col * gapX);
      const by = currentY + (row * 38);

      const isUnlocked = i <= unlockedLevel;
      const isSelected = i === selectedLevel;

      let bgColor = 0x333333;
      let strokeColor = 0x555555;
      if (isSelected) {
        bgColor = 0x0088ff;
        strokeColor = 0xffffff;
      } else if (isUnlocked) {
        bgColor = 0x1e293b;
        strokeColor = 0x38bdf8;
      }

      const btnBox = this.add.rectangle(bx, by, btnSize, 30, bgColor).setOrigin(0.5);
      btnBox.setStrokeStyle(1.5, strokeColor);

      const labelTxt = isUnlocked ? `${i}` : '🔒';
      const labelColor = isSelected ? '#ffffff' : (isUnlocked ? '#38bdf8' : '#666666');
      const btnTxt = this.add.text(bx, by, labelTxt, { fontSize: '12px', fill: labelColor, fontStyle: 'bold' }).setOrigin(0.5);

      if (isUnlocked) {
        btnBox.setInteractive({ useHandCursor: true });
        btnTxt.setInteractive({ useHandCursor: true });

        const selectLvl = () => {
          this.registry.set('selectedLevel', i);
          this.scene.restart();
        };

        btnBox.on('pointerdown', selectLvl);
        btnTxt.on('pointerdown', selectLvl);
      }

      this.levelButtons.push(btnBox);
    }

    currentY += 85;

    // Graphic (Ezreal Bot Sprite)
    this.add.circle(centerX, currentY, 24, 0xffffff, 0.25);
    const ezrealBotSprite = this.add.sprite(centerX, currentY, 'ezreal_spritesheet', 0);
    ezrealBotSprite.setScale(1.1);
    if (this.anims.exists('ezreal_idle')) {
      ezrealBotSprite.play('ezreal_idle');
    }

    // Stats (2 Columns)
    currentY += 40;
    
    const scale = GAME_CONFIG.BOT_SCALING[selectedLevel] || GAME_CONFIG.BOT_SCALING[1];
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

    this.add.text(col1X, currentY, `HP: ${Math.round(enemyStats.maxHp)}`, { fontSize: '12px', fill: '#aaaaaa' });
    this.add.text(col1X, currentY + 18, `ATK: ${Math.round(enemyStats.atk)}`, { fontSize: '12px', fill: '#aaaaaa' });
    this.add.text(col1X, currentY + 36, `Armor: ${Math.round(enemyStats.armor)}`, { fontSize: '12px', fill: '#aaaaaa' });
    this.add.text(col1X, currentY + 54, `Speed: ${Math.round(enemyStats.speed)}`, { fontSize: '12px', fill: '#aaaaaa' });

    this.add.text(col2X, currentY, `Crit: ${Math.round(enemyStats.critChance)}%`, { fontSize: '12px', fill: '#aaaaaa' });
    this.add.text(col2X, currentY + 18, `CDR: ${Math.round(enemyStats.cdr)}%`, { fontSize: '12px', fill: '#aaaaaa' });
    this.add.text(col2X, currentY + 36, `Lifesteal: ${Math.round(enemyStats.lifesteal)}%`, { fontSize: '12px', fill: '#aaaaaa' });
    this.add.text(col2X, currentY + 54, `Arm Pen: ${Math.round(enemyStats.armorPen)}%`, { fontSize: '12px', fill: '#aaaaaa' });

    // Hero Selection Section
    this.drawHeroSelection(centerX, currentY + 90);
  }

  drawHeroSelection(centerX, startY) {
    let currentY = startY;

    this.add.text(centerX, currentY, "HERO SELECT", { fontSize: '16px', fill: '#00ffff', fontStyle: 'bold' }).setOrigin(0.5);
    
    currentY += 32;
    const heroes = ['ezreal', 'lux', 'jinx', 'ahri', 'zed'];
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
      four: Phaser.Input.Keyboard.KeyCodes.FOUR,
      five: Phaser.Input.Keyboard.KeyCodes.FIVE,
      numOne: Phaser.Input.Keyboard.KeyCodes.NUMPAD_ONE,
      numTwo: Phaser.Input.Keyboard.KeyCodes.NUMPAD_TWO,
      numThree: Phaser.Input.Keyboard.KeyCodes.NUMPAD_THREE,
      numFour: Phaser.Input.Keyboard.KeyCodes.NUMPAD_FOUR,
      numFive: Phaser.Input.Keyboard.KeyCodes.NUMPAD_FIVE
    });

    keys.one.on('down', () => selectHeroById('ezreal'));
    keys.numOne.on('down', () => selectHeroById('ezreal'));
    keys.two.on('down', () => selectHeroById('lux'));
    keys.numTwo.on('down', () => selectHeroById('lux'));
    keys.three.on('down', () => selectHeroById('jinx'));
    keys.numThree.on('down', () => selectHeroById('jinx'));
    keys.four.on('down', () => selectHeroById('ahri'));
    keys.numFour.on('down', () => selectHeroById('ahri'));
    keys.five.on('down', () => selectHeroById('zed'));
    keys.numFive.on('down', () => selectHeroById('zed'));

    const btnWidth = 44;
    const btnGap = 48;
    const startBtnX = centerX - ((heroes.length - 1) * btnGap) / 2;

    heroes.forEach((hId, index) => {
      const heroData = GAME_CONFIG.CHARACTERS[hId];
      const x = startBtnX + (index * btnGap);
      const isSelected = hId === currentHero;

      const btnColor = isSelected ? heroData.color : 0x333333;
      const btn = this.add.rectangle(x, currentY, btnWidth, 26, btnColor).setInteractive({ useHandCursor: true });
      if (isSelected) btn.setStrokeStyle(2, 0xffffff);

      const txtColor = isSelected ? '#000000' : '#ffffff';
      const shortName = heroData.name.slice(0, 4);
      const txt = this.add.text(x, currentY, shortName, { fontSize: '11px', fill: txtColor, fontStyle: 'bold' }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      btn.on('pointerdown', () => selectHeroById(hId));
      txt.on('pointerdown', () => selectHeroById(hId));
    });

    // Hero Avatar Graphic
    currentY += 45;
    const selectedData = GAME_CONFIG.CHARACTERS[currentHero] || GAME_CONFIG.CHARACTERS.ezreal;
    
    this.add.circle(centerX, currentY, 24, 0xffffff, 0.25);
    if (['ezreal', 'lux', 'jinx', 'ahri', 'zed'].includes(currentHero)) {
      const sheetKey = `${currentHero}_spritesheet`;
      const idleKey = `${currentHero}_idle`;
      if (this.textures.exists(sheetKey)) {
        const heroSprite = this.add.sprite(centerX, currentY, sheetKey, 0);
        heroSprite.setScale(1.1);
        if (this.anims.exists(idleKey)) {
          heroSprite.play(idleKey);
        }
      } else {
        this.add.circle(centerX, currentY, 20, selectedData.color);
      }
    } else {
      this.add.circle(centerX, currentY, 20, selectedData.color);
    }

    // Hero Description Info
    currentY += 42;
    this.add.text(centerX, currentY, `${selectedData.name} - ${selectedData.title}`, { fontSize: '12px', fill: '#ffff00', fontStyle: 'bold' }).setOrigin(0.5);

    currentY += 22;
    this.add.text(centerX, currentY, selectedData.description, { fontSize: '11px', fill: '#aaaaaa', align: 'center', wordWrap: { width: 230 } }).setOrigin(0.5, 0);

    // Reset Progress Button
    currentY += 85;
    const resetBtn = this.add.rectangle(centerX, currentY, 200, 28, 0x661111).setInteractive({ useHandCursor: true });
    this.add.text(centerX, currentY, "RESET TO LEVEL 1", { fontSize: '12px', fill: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);

    resetBtn.on('pointerdown', () => {
      this.registry.set('unlockedLevel', 1);
      this.registry.set('selectedLevel', 1);
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
    currentY += 32;
    this.add.text(centerX, currentY, "LoL ITEM SHOP", { fontSize: '22px', fill: '#ffcc00', fontStyle: 'bold' }).setOrigin(0.5);

    this.shopItems = GAME_CONFIG.SHOP_ITEMS;

    // Grid properties for 15 items (3 cols x 5 rows)
    currentY += 55;
    let row = 0;
    let col = 0;
    const paddingX = 85;
    const paddingY = 86;
    
    this.itemButtons = [];

    this.shopItems.forEach((item, index) => {
      const x = (centerX - 85) + (col * paddingX);
      const y = currentY + (row * paddingY);

      const box = this.add.rectangle(x, y, 56, 56, item.color).setInteractive({ useHandCursor: true });
      box.setStrokeStyle(1.5, 0xffffff, 0.6);

      // Short item initials or name
      const nameParts = item.name.split(' ');
      const shortName = nameParts.length > 1 ? `${nameParts[0][0]}${nameParts[1][0]}` : item.name.slice(0, 3);
      this.add.text(x, y - 8, shortName, { fontSize: '13px', fill: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);

      const priceText = this.add.text(x, y + 16, `${item.cost}G`, { fontSize: '11px', fill: '#ffff00', fontStyle: 'bold' }).setOrigin(0.5);

      box.on('pointerover', () => {
        this.tweens.add({ targets: [box, priceText], scale: 1.12, duration: 150, ease: 'Power2' });
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
    currentY += 35;
    this.goldText = this.add.text(startX + 280, currentY, `GOLD: ${this.registry.get('gold')}`, { fontSize: '22px', fill: '#ffff00', fontStyle: 'bold' }).setOrigin(1, 0.5);

    // Inventory Title
    currentY += 45;
    this.add.text(centerX, currentY, "INVENTORY", { fontSize: '18px', fill: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);

    // Inventory Slots (2 rows of 3 slots)
    currentY += 38;
    this.inventorySlots = [];
    for (let i = 0; i < 6; i++) {
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
    this.add.text(centerX, currentY, "PLAYER STATS", { fontSize: '16px', fill: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);

    // Detailed Stats (2 columns)
    currentY += 28;
    const stats = this.registry.get('playerStats');
    const heroId = this.registry.get('selectedHero') || 'ezreal';
    const heroData = GAME_CONFIG.CHARACTERS[heroId] || GAME_CONFIG.CHARACTERS.ezreal;

    const col1X = centerX - 130;
    const col2X = centerX;
    
    this.statTexts = {
      hp: this.add.text(col1X, currentY, `HP: ${heroData.baseStats.hp + stats.bonusHP}`, { fontSize: '13px', fill: '#aaaaaa' }),
      atk: this.add.text(col1X, currentY + 18, `ATK: ${heroData.skills.Q.config.damage + stats.bonusDamage}`, { fontSize: '13px', fill: '#aaaaaa' }),
      armor: this.add.text(col1X, currentY + 36, `Armor: ${heroData.baseStats.armor + stats.armor}`, { fontSize: '13px', fill: '#aaaaaa' }),
      speed: this.add.text(col1X, currentY + 54, `Speed: ${heroData.baseStats.speed + stats.bonusSpeed}`, { fontSize: '13px', fill: '#aaaaaa' }),

      crit: this.add.text(col2X, currentY, `Crit: ${heroData.baseStats.critChance + stats.critChance}%`, { fontSize: '13px', fill: '#aaaaaa' }),
      cdr: this.add.text(col2X, currentY + 18, `CDR: ${Math.round(stats.cdr * 100)}%`, { fontSize: '13px', fill: '#aaaaaa' }),
      lifesteal: this.add.text(col2X, currentY + 36, `Lifesteal: ${heroData.baseStats.lifesteal + stats.lifesteal}%`, { fontSize: '13px', fill: '#aaaaaa' }),
      armPen: this.add.text(col2X, currentY + 54, `Arm Pen: ${stats.armorPen}%`, { fontSize: '13px', fill: '#aaaaaa' })
    };

    // Item Description Box
    currentY += 105;
    this.descBox = this.add.rectangle(centerX, currentY + 28, 260, 85, 0x222222);
    this.descName = this.add.text(centerX, currentY, "SELECT AN ITEM", { fontSize: '16px', fill: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
    this.descStat = this.add.text(centerX, currentY + 26, "", { fontSize: '13px', fill: '#00ff00', align: 'center', wordWrap: { width: 240 } }).setOrigin(0.5);
    this.descCost = this.add.text(centerX, currentY + 52, "", { fontSize: '15px', fill: '#ffff00', fontStyle: 'bold' }).setOrigin(0.5);

    // BUY & SELL Buttons
    currentY += 105;
    const btnY = currentY;

    // BUY Button (Left)
    this.buyBtnBg = this.add.rectangle(centerX - 65, btnY, 110, 36, 0x555555).setInteractive({ useHandCursor: true });
    this.buyBtnText = this.add.text(centerX - 65, btnY, "BUY", { fontSize: '16px', fill: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
    
    this.buyBtnBg.on('pointerover', () => this.tweens.add({ targets: [this.buyBtnBg, this.buyBtnText], scale: 1.08, duration: 150, ease: 'Power2' }));
    this.buyBtnBg.on('pointerout', () => this.tweens.add({ targets: [this.buyBtnBg, this.buyBtnText], scale: 1.0, duration: 150, ease: 'Power2' }));
    this.buyBtnBg.on('pointerdown', () => this.buyItem());

    // SELL Button (Right)
    this.sellBtnBg = this.add.rectangle(centerX + 65, btnY, 110, 36, 0x555555).setInteractive({ useHandCursor: true });
    this.sellBtnText = this.add.text(centerX + 65, btnY, "SELL", { fontSize: '16px', fill: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);

    this.sellBtnBg.on('pointerover', () => this.tweens.add({ targets: [this.sellBtnBg, this.sellBtnText], scale: 1.08, duration: 150, ease: 'Power2' }));
    this.sellBtnBg.on('pointerout', () => this.tweens.add({ targets: [this.sellBtnBg, this.sellBtnText], scale: 1.0, duration: 150, ease: 'Power2' }));
    this.sellBtnBg.on('pointerdown', () => this.sellItem());

    // READY Button
    currentY += 68;
    const readyBtn = this.add.rectangle(centerX, currentY, 200, 50, 0x00aa00).setInteractive({ useHandCursor: true });
    const readyTxt = this.add.text(centerX, currentY, "BATTLE READY", { fontSize: '22px', fill: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    const onReady = () => {
      stopPreparationBGM(this);
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('GameScene', {
          level: this.registry.get('selectedLevel') || this.registry.get('unlockedLevel') || 1,
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

      // Update global stats using statsDict
      let stats = this.registry.get('playerStats');
      if (this.selectedItem.statsDict) {
        Object.keys(this.selectedItem.statsDict).forEach(k => {
          stats[k] = (stats[k] || 0) + this.selectedItem.statsDict[k];
        });
      }
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

    // Deduct player stats using statsDict
    let stats = this.registry.get('playerStats');
    if (item.statsDict) {
      Object.keys(item.statsDict).forEach(k => {
        stats[k] = Math.max(0, (stats[k] || 0) - item.statsDict[k]);
      });
    }
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

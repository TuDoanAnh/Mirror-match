import Phaser from 'phaser';
import EnemyBot from './EnemyBot';
import { GAME_CONFIG } from './gameConfig';
import { preloadLuxAssets, createLuxAnimations } from './luxAnimations';
import { preloadEzrealSkillAssets, createEzrealSkillAnimations } from './ezrealSkillAnimations';
import { preloadJinxAssets, createJinxAnimations } from './jinxAnimations';
import { preloadZedSkillAssets, createZedSkillAnimations } from './zedAnimations';
import { preloadRivenSkillAssets, createRivenSkillAnimations } from './rivenAnimations';
import { preloadCharacterSFX, playPreparationBGM, stopPreparationBGM } from './soundManager';
import { ALL_AUGMENTS } from './AugmentManager';
import { preloadShopItemAssets } from './shopItemLoader';

import buyBtnUrl from './assets/image/Buy.png';
import sellBtnUrl from './assets/image/Sell.png';
import readyBtnUrl from './assets/image/Ready.png';
import bg1Url from './assets/image/BG_1.png';
import bg2Url from './assets/image/BG_2.png';

export default class PreparationScene extends Phaser.Scene {
  constructor() {
    super('PreparationScene');
  }

  preload() {
    preloadLuxAssets(this);
    preloadEzrealSkillAssets(this);
    preloadJinxAssets(this);
    preloadZedSkillAssets(this);
    preloadRivenSkillAssets(this);
    preloadShopItemAssets(this);
    preloadCharacterSFX(this);

    this.load.image('btn_buy', buyBtnUrl);
    this.load.image('btn_sell', sellBtnUrl);
    this.load.image('btn_ready', readyBtnUrl);
    this.load.image('bg_panel_1', bg1Url);
    this.load.image('bg_panel_2', bg2Url);
  }

  create() {
    createLuxAnimations(this);
    createEzrealSkillAnimations(this);
    createJinxAnimations(this);
    createZedSkillAnimations(this);
    createRivenSkillAnimations(this);
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
    // Left Panel bounds: startX = 258, width = 300, Center X = 408, topY = 178
    const startX = 258;
    const topY = 178;
    const centerX = startX + 150;
    let currentY = topY;

    // Background (BG_2.png frame image - Width 300px)
    this.add.image(startX, topY, 'bg_panel_2').setOrigin(0, 0).setDisplaySize(300, 668).setTint(0xcccccc);
    this.add.rectangle(startX, topY, 300, 668, 0x000000, 0.1).setOrigin(0, 0);

    // Header Title (Shifted down to fit frame ornament)
    currentY += 48;
    this.add.text(centerX, currentY, "ENEMY STATUS", {
      fontSize: '18px',
      fill: '#ff5555',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    // Level Header
    currentY += 25;
    const unlockedLevel = this.registry.get('unlockedLevel') || 1;
    let selectedLevel = this.registry.get('selectedLevel') || unlockedLevel;
    if (selectedLevel > unlockedLevel) {
      selectedLevel = unlockedLevel;
      this.registry.set('selectedLevel', selectedLevel);
    }

    const defaultBotHero = GAME_CONFIG.DEFAULT_BOT_HERO_BY_LEVEL[selectedLevel] || 'ezreal';
    const currentBotHero = this.registry.get('selectedBotHero') || defaultBotHero;
    const botHeroData = GAME_CONFIG.CHARACTERS[currentBotHero] || GAME_CONFIG.CHARACTERS.ezreal;

    this.levelTitleText = this.add.text(centerX, currentY, `LEVEL ${selectedLevel} (${botHeroData.name.toUpperCase()} BOT)`, {
      fontSize: '12px',
      fill: '#facc15',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    // Compact Level Selector Bar (1 Single Row of 10 circular pills)
    currentY += 24;
    this.levelButtons = [];
    for (let i = 1; i <= 10; i++) {
      const bx = (centerX - 112.5) + ((i - 1) * 25);
      const isUnlocked = i <= unlockedLevel;
      const isSelected = i === selectedLevel;

      let bgColor = isSelected ? 0x0088ff : (isUnlocked ? 0x1e293b : 0x0f172a);
      let strokeColor = isSelected ? 0xffffff : (isUnlocked ? 0x38bdf8 : 0x334155);

      const btnCircle = this.add.circle(bx, currentY, 10, bgColor).setInteractive({ useHandCursor: isUnlocked });
      btnCircle.setStrokeStyle(1.5, strokeColor);

      const labelTxt = isUnlocked ? `${i}` : '🔒';
      const labelColor = isSelected ? '#ffffff' : (isUnlocked ? '#38bdf8' : '#666666');
      const btnTxt = this.add.text(bx, currentY, labelTxt, { fontSize: '10px', fill: labelColor, fontStyle: 'bold' }).setOrigin(0.5);

      if (isUnlocked) {
        btnTxt.setInteractive({ useHandCursor: true });
        const selectLvl = () => {
          this.registry.set('selectedLevel', i);
          this.registry.set('selectedBotHero', GAME_CONFIG.DEFAULT_BOT_HERO_BY_LEVEL[i] || 'ezreal');
          this.scene.restart();
        };
        btnCircle.on('pointerdown', selectLvl);
        btnTxt.on('pointerdown', selectLvl);
      }

      this.levelButtons.push(btnCircle);
    }

    // Bot Champion Selector (Sleek Circular Avatar Badges)
    currentY += 32;
    this.add.text(centerX, currentY, "BOT CHAMPION", { fontSize: '11px', fill: '#ff8888', fontStyle: 'bold', stroke: '#000000', strokeThickness: 2 }).setOrigin(0.5);

    currentY += 24;
    const botHeroes = ['ezreal', 'lux', 'jinx', 'zed', 'riven'];
    const botBtnGap = 48;
    const startBotBtnX = centerX - ((botHeroes.length - 1) * botBtnGap) / 2;

    botHeroes.forEach((bId, idx) => {
      const bData = GAME_CONFIG.CHARACTERS[bId] || GAME_CONFIG.CHARACTERS.ezreal;
      const bx = startBotBtnX + (idx * botBtnGap);
      const isBotSelected = bId === currentBotHero;

      const badgeBg = this.add.circle(bx, currentY, 16, isBotSelected ? bData.color : 0x1e293b).setInteractive({ useHandCursor: true });
      badgeBg.setStrokeStyle(isBotSelected ? 2.5 : 1.5, isBotSelected ? 0xffffff : bData.color);

      const shortName = bData.name.slice(0, 3).toUpperCase();
      const txtColor = isBotSelected ? '#000000' : '#ffffff';
      const badgeTxt = this.add.text(bx, currentY, shortName, { fontSize: '10px', fill: txtColor, fontStyle: 'bold' }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      const selectBot = () => {
        this.registry.set('selectedBotHero', bId);
        this.scene.restart();
      };
      badgeBg.on('pointerdown', selectBot);
      badgeTxt.on('pointerdown', selectBot);

      badgeBg.on('pointerover', () => this.tweens.add({ targets: badgeBg, scale: 1.15, duration: 100 }));
      badgeBg.on('pointerout', () => this.tweens.add({ targets: badgeBg, scale: 1.0, duration: 100 }));
    });

    // Bot Graphic & Stats Section (Side-by-Side to save vertical space)
    currentY += 46;

    // Bot Champion Sprite (Left Side)
    const botSpriteX = centerX - 85;
    this.add.circle(botSpriteX, currentY + 15, 24, botHeroData.color || 0xffffff, 0.3);
    const botSpriteKey = `${currentBotHero}_spritesheet`;
    if (this.textures.exists(botSpriteKey)) {
      const botSprite = this.add.sprite(botSpriteX, currentY + 15, botSpriteKey, 0);
      botSprite.setScale(1.0);
      const animKey = `${currentBotHero}_idle`;
      if (this.anims.exists(animKey)) {
        botSprite.play(animKey);
      }
    }

    // Bot Stats (Right Side of Bot Sprite)
    const scale = GAME_CONFIG.BOT_SCALING[selectedLevel] || GAME_CONFIG.BOT_SCALING[1];
    const qDamage = (botHeroData.skills.Q && botHeroData.skills.Q.config && botHeroData.skills.Q.config.damage) || 100;
    const enemyStats = {
      maxHp: botHeroData.baseStats.hp * scale.hpMult,
      atk: qDamage * scale.dmgMult,
      armor: scale.armor,
      speed: botHeroData.baseStats.speed * scale.speedMult,
      critChance: scale.critChance,
      cdr: Math.round((1 - scale.cdrMult) * 100),
      lifesteal: scale.lifesteal,
      armorPen: scale.armorPen
    };

    const statsX1 = centerX - 35;
    const statsX2 = centerX + 55;
    const statsY = currentY - 10;

    this.add.text(statsX1, statsY, `HP: ${Math.round(enemyStats.maxHp)}`, { fontSize: '11px', fill: '#ffffff', stroke: '#000000', strokeThickness: 2 });
    this.add.text(statsX1, statsY + 16, `ATK: ${Math.round(enemyStats.atk)}`, { fontSize: '11px', fill: '#ffffff', stroke: '#000000', strokeThickness: 2 });
    this.add.text(statsX1, statsY + 32, `Armor: ${Math.round(enemyStats.armor)}`, { fontSize: '11px', fill: '#ffffff', stroke: '#000000', strokeThickness: 2 });
    this.add.text(statsX1, statsY + 48, `Speed: ${Math.round(enemyStats.speed)}`, { fontSize: '11px', fill: '#ffffff', stroke: '#000000', strokeThickness: 2 });

    this.add.text(statsX2, statsY, `Crit: ${Math.round(enemyStats.critChance)}%`, { fontSize: '11px', fill: '#cbd5e1', stroke: '#000000', strokeThickness: 2 });
    this.add.text(statsX2, statsY + 16, `CDR: ${Math.round(enemyStats.cdr)}%`, { fontSize: '11px', fill: '#cbd5e1', stroke: '#000000', strokeThickness: 2 });
    this.add.text(statsX2, statsY + 32, `Lifesteal: ${Math.round(enemyStats.lifesteal)}%`, { fontSize: '11px', fill: '#cbd5e1', stroke: '#000000', strokeThickness: 2 });
    this.add.text(statsX2, statsY + 48, `ArmPen: ${Math.round(enemyStats.armorPen)}%`, { fontSize: '11px', fill: '#cbd5e1', stroke: '#000000', strokeThickness: 2 });

    // Hero Selection Section
    this.drawHeroSelection(centerX, currentY + 75);
  }

  drawHeroSelection(centerX, startY) {
    let currentY = startY;

    // Divider Line
    this.add.rectangle(centerX, currentY, 250, 1.5, 0x38bdf8, 0.6);

    currentY += 20;
    this.add.text(centerX, currentY, "SELECT YOUR HERO", {
      fontSize: '16px',
      fill: '#00ffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    currentY += 28;
    const heroes = ['ezreal', 'lux', 'jinx', 'zed', 'riven'];
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
    keys.four.on('down', () => selectHeroById('zed'));
    keys.numFour.on('down', () => selectHeroById('zed'));
    keys.five.on('down', () => selectHeroById('riven'));
    keys.numFive.on('down', () => selectHeroById('riven'));

    const btnGap = 48;
    const startBtnX = centerX - ((heroes.length - 1) * btnGap) / 2;

    heroes.forEach((hId, index) => {
      const heroData = GAME_CONFIG.CHARACTERS[hId];
      const x = startBtnX + (index * btnGap);
      const isSelected = hId === currentHero;

      const badgeBg = this.add.circle(x, currentY, 16, isSelected ? heroData.color : 0x1e293b).setInteractive({ useHandCursor: true });
      badgeBg.setStrokeStyle(isSelected ? 2.5 : 1.5, isSelected ? 0xffffff : heroData.color);

      const shortName = heroData.name.slice(0, 3).toUpperCase();
      const txtColor = isSelected ? '#000000' : '#ffffff';
      const badgeTxt = this.add.text(x, currentY, shortName, { fontSize: '10px', fill: txtColor, fontStyle: 'bold' }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      badgeBg.on('pointerdown', () => selectHeroById(hId));
      badgeTxt.on('pointerdown', () => selectHeroById(hId));

      badgeBg.on('pointerover', () => this.tweens.add({ targets: badgeBg, scale: 1.15, duration: 100 }));
      badgeBg.on('pointerout', () => this.tweens.add({ targets: badgeBg, scale: 1.0, duration: 100 }));
    });

    // Hero Avatar Graphic
    currentY += 45;
    const selectedData = GAME_CONFIG.CHARACTERS[currentHero] || GAME_CONFIG.CHARACTERS.ezreal;

    this.add.circle(centerX, currentY, 24, selectedData.color || 0xffffff, 0.3);
    if (['ezreal', 'lux', 'jinx', 'zed', 'riven'].includes(currentHero)) {
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
    this.add.text(centerX, currentY, `${selectedData.name} - ${selectedData.title}`, { fontSize: '13px', fill: '#facc15', fontStyle: 'bold', stroke: '#000000', strokeThickness: 2 }).setOrigin(0.5);

    currentY += 22;
    this.add.text(centerX, currentY, selectedData.description, { fontSize: '11px', fill: '#ffffff', align: 'center', wordWrap: { width: 230 } }).setOrigin(0.5, 0);

    // Reset Progress Button
    currentY += 85;
    const resetBtn = this.add.rectangle(centerX, currentY, 180, 26, 0x881111).setInteractive({ useHandCursor: true });
    resetBtn.setStrokeStyle(1.5, 0xef4444);
    this.add.text(centerX, currentY, "RESET TO LEVEL 1", { fontSize: '11px', fill: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);

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
    // Center Panel bounds: startX = 618, width = 300, Center X = 768, topY = 178
    const startX = 618;
    const topY = 178;
    const centerX = startX + 150;
    let currentY = topY;

    // Background
    this.add.image(startX, topY, 'bg_panel_2').setOrigin(0, 0).setDisplaySize(300, 668).setTint(0xcccccc);
    this.add.rectangle(startX, topY, 300, 668, 0x000000, 0.1).setOrigin(0, 0);

    // Title (Shifted down slightly to fit frame ornament)
    currentY += 54;
    this.add.text(centerX, currentY, "ITEM SHOP", {
      fontSize: '22px',
      fill: '#ffcc00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    this.shopItems = GAME_CONFIG.SHOP_ITEMS;

    // Grid properties for 20 items (3 cols x 7 rows)
    currentY += 60;
    let row = 0;
    let col = 0;
    const paddingX = 85;
    const paddingY = 74;

    this.itemButtons = [];

    this.shopItems.forEach((item, index) => {
      const x = (centerX - 85) + (col * paddingX);
      const y = currentY + (row * paddingY);

      const itemContainer = this.add.container(x, y);

      // 3D Drop Shadow for Pop-out effect
      const shadow = this.add.rectangle(3, 3, 62, 62, 0x000000, 0.6);

      // Main Item Box
      const box = this.add.rectangle(0, 0, 62, 62, 0x0f172a).setInteractive({ useHandCursor: true });
      box.setStrokeStyle(2, item.color || 0x38bdf8, 1);

      // Enlarged Icon (50x50)
      const itemKey = `item_${item.id}`;
      const icon = this.add.image(0, -5, itemKey);
      icon.setDisplaySize(50, 50);

      // Price Tag Badge
      const priceBg = this.add.rectangle(0, 20, 48, 15, 0x090d16, 0.85);
      priceBg.setStrokeStyle(1, 0x334155, 0.8);
      const priceText = this.add.text(0, 20, `${item.cost}G`, {
        fontSize: '11px',
        fill: '#facc15',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0.5);

      itemContainer.add([shadow, box, icon, priceBg, priceText]);

      box.on('pointerover', () => {
        this.tweens.killTweensOf(itemContainer);
        this.tweens.add({ targets: itemContainer, scale: 1.15, duration: 120, ease: 'Power2' });
      });
      box.on('pointerout', () => {
        this.tweens.killTweensOf(itemContainer);
        this.tweens.add({ targets: itemContainer, scale: 1.0, duration: 120, ease: 'Power2' });
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
    // Right Panel bounds: startX = 978, width = 300, Center X = 1128, topY = 178
    const startX = 978;
    const topY = 178;
    const centerX = startX + 150;
    let currentY = topY;

    // Background
    this.add.image(startX, topY, 'bg_panel_2').setOrigin(0, 0).setDisplaySize(300, 668).setTint(0xcccccc);
    this.add.rectangle(startX, topY, 300, 668, 0x000000, 0.1).setOrigin(0, 0);

    // Gold
    currentY += 35;
    this.goldText = this.add.text(startX + 280, currentY, `GOLD: ${this.registry.get('gold')}`, { fontSize: '22px', fill: '#ffff00', fontStyle: 'bold' }).setOrigin(1, 0.5);

    // Inventory Title
    currentY += 45;
    this.add.text(centerX, currentY, "INVENTORY", { fontSize: '18px', fill: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);

    // Inventory Slots (2 rows of 3 slots)
    currentY += 38;
    this.inventorySlots = [];
    this.inventorySlotIcons = [];

    for (let i = 0; i < 6; i++) {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const x = (centerX - 60) + (col * 60);
      const y = currentY + (row * 60);

      const slotContainer = this.add.container(x, y);

      const slotBg = this.add.rectangle(0, 0, 50, 50, 0x1e293b).setInteractive({ useHandCursor: true });
      slotBg.setStrokeStyle(1.5, 0x334155);

      const slotIcon = this.add.image(0, 0, 'item_doransBlade').setVisible(false);
      slotIcon.setDisplaySize(42, 42);

      slotContainer.add([slotBg, slotIcon]);

      slotBg.on('pointerover', () => {
        const inv = this.registry.get('inventory');
        if (i < inv.length) {
          this.tweens.killTweensOf(slotContainer);
          this.tweens.add({ targets: slotContainer, scale: 1.1, duration: 100, ease: 'Power2' });
        }
      });
      slotBg.on('pointerout', () => {
        this.tweens.killTweensOf(slotContainer);
        this.tweens.add({ targets: slotContainer, scale: 1.0, duration: 100, ease: 'Power2' });
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
      this.inventorySlotIcons.push(slotIcon);
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

    // Active Augments Section
    currentY += 80;
    currentY = this.drawAugmentsSection(centerX, currentY);

    // Item Description Box
    currentY += 25;
    this.descBox = this.add.rectangle(centerX, currentY + 28, 260, 85, 0x0f172a);
    this.descBox.setStrokeStyle(1.5, 0x334155);
    this.descIcon = this.add.image(centerX - 95, currentY + 28, 'item_doransBlade').setVisible(false);
    this.descIcon.setDisplaySize(54, 54);

    this.descName = this.add.text(centerX + 15, currentY + 2, "SELECT AN ITEM", { fontSize: '15px', fill: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
    this.descStat = this.add.text(centerX + 15, currentY + 26, "", { fontSize: '12px', fill: '#34d399', align: 'center', wordWrap: { width: 170 } }).setOrigin(0.5);
    this.descCost = this.add.text(centerX + 15, currentY + 52, "", { fontSize: '14px', fill: '#facc15', fontStyle: 'bold' }).setOrigin(0.5);

    // BUY & SELL Buttons
    currentY += 105;
    const btnY = currentY;

    // BUY Button (Left)
    this.buyBtn = this.add.image(centerX - 65, btnY, 'btn_buy').setInteractive({ useHandCursor: true });
    this.buyBtn.setDisplaySize(116, 42);
    this.buyBtn.baseScaleX = this.buyBtn.scaleX;
    this.buyBtn.baseScaleY = this.buyBtn.scaleY;

    this.buyBtn.on('pointerover', () => this.tweens.add({ targets: this.buyBtn, scaleX: this.buyBtn.baseScaleX * 1.08, scaleY: this.buyBtn.baseScaleY * 1.08, duration: 150, ease: 'Power2' }));
    this.buyBtn.on('pointerout', () => this.tweens.add({ targets: this.buyBtn, scaleX: this.buyBtn.baseScaleX, scaleY: this.buyBtn.baseScaleY, duration: 150, ease: 'Power2' }));
    this.buyBtn.on('pointerdown', () => this.buyItem());

    // SELL Button (Right)
    this.sellBtn = this.add.image(centerX + 65, btnY, 'btn_sell').setInteractive({ useHandCursor: true });
    this.sellBtn.setDisplaySize(116, 42);
    this.sellBtn.baseScaleX = this.sellBtn.scaleX;
    this.sellBtn.baseScaleY = this.sellBtn.scaleY;

    this.sellBtn.on('pointerover', () => this.tweens.add({ targets: this.sellBtn, scaleX: this.sellBtn.baseScaleX * 1.08, scaleY: this.sellBtn.baseScaleY * 1.08, duration: 150, ease: 'Power2' }));
    this.sellBtn.on('pointerout', () => this.tweens.add({ targets: this.sellBtn, scaleX: this.sellBtn.baseScaleX, scaleY: this.sellBtn.baseScaleY, duration: 150, ease: 'Power2' }));
    this.sellBtn.on('pointerdown', () => this.sellItem());

    // READY Button
    currentY += 68;
    this.readyBtn = this.add.image(centerX, currentY, 'btn_ready').setInteractive({ useHandCursor: true });
    this.readyBtn.setDisplaySize(210, 56);
    this.readyBtn.baseScaleX = this.readyBtn.scaleX;
    this.readyBtn.baseScaleY = this.readyBtn.scaleY;

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

    this.readyBtn.on('pointerover', () => this.tweens.add({ targets: this.readyBtn, scaleX: this.readyBtn.baseScaleX * 1.05, scaleY: this.readyBtn.baseScaleY * 1.05, duration: 150, ease: 'Power2' }));
    this.readyBtn.on('pointerout', () => this.tweens.add({ targets: this.readyBtn, scaleX: this.readyBtn.baseScaleX, scaleY: this.readyBtn.baseScaleY, duration: 150, ease: 'Power2' }));
    this.readyBtn.on('pointerdown', onReady);
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

      if (this.descIcon) {
        this.descIcon.setTexture(`item_${this.selectedItem.id}`);
        this.descIcon.setDisplaySize(54, 54);
        this.descIcon.setVisible(true);
      }

      if (this.buyBtn) this.buyBtn.setAlpha(1.0).clearTint();
      if (this.sellBtn) this.sellBtn.setAlpha(0.45).setTint(0x666666);
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

        if (this.descIcon) {
          this.descIcon.setTexture(`item_${item.id}`);
          this.descIcon.setDisplaySize(54, 54);
          this.descIcon.setVisible(true);
        }

        if (this.buyBtn) this.buyBtn.setAlpha(0.45).setTint(0x666666);
        if (this.sellBtn) this.sellBtn.setAlpha(1.0).clearTint();
      }
    } else {
      this.descName.setText("SELECT AN ITEM");
      this.descStat.setText("");
      this.descCost.setText("");
      if (this.descIcon) this.descIcon.setVisible(false);

      if (this.buyBtn) this.buyBtn.setAlpha(0.45).setTint(0x666666);
      if (this.sellBtn) this.sellBtn.setAlpha(0.45).setTint(0x666666);
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
      if (this.buyBtn) this.buyBtn.setTint(0x00ff88);
      this.time.delayedCall(120, () => this.updateRightPanel());
    } else {
      // Error effect
      if (this.buyBtn) this.buyBtn.setTint(0xff3333);
      this.time.delayedCall(120, () => this.updateRightPanel());
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
    if (this.sellBtn) this.sellBtn.setTint(0xffaa00);
    this.time.delayedCall(120, () => this.updateRightPanel());
  }

  updateInventoryView() {
    const inv = this.registry.get('inventory') || [];
    this.inventorySlots.forEach((slot, index) => {
      const slotIcon = this.inventorySlotIcons ? this.inventorySlotIcons[index] : null;
      if (index < inv.length) {
        const item = inv[index];
        const frameIdx = (item.iconFrame !== undefined) ? item.iconFrame : 0;
        slot.setFillStyle(0x0f172a);

        if (slotIcon) {
          slotIcon.setTexture(`item_${item.id}`);
          slotIcon.setDisplaySize(42, 42);
          slotIcon.setVisible(true);
        }

        if (index === this.selectedInventoryIndex) {
          slot.setStrokeStyle(2.5, 0xfacc15);
        } else {
          slot.setStrokeStyle(1.5, item.color || 0x38bdf8);
        }
      } else {
        slot.setFillStyle(0x1e293b);
        slot.setStrokeStyle(1.5, 0x334155);
        if (slotIcon) slotIcon.setVisible(false);
      }
    });
  }

  drawAugmentsSection(centerX, startY) {
    const ownedAugs = this.registry.get('augments') || [];
    if (ownedAugs.length === 0) return startY;

    let currentY = startY;
    this.add.text(centerX, currentY, "⚡ ACTIVE AUGMENTS", {
      fontSize: '13px',
      fill: '#fde047',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    currentY += 22;
    const startX = centerX - ((ownedAugs.length - 1) * 22);

    ownedAugs.forEach((aug, i) => {
      const augData = typeof aug === 'string' ? ALL_AUGMENTS.find(a => a.id === aug) : aug;
      if (!augData) return;

      const x = startX + (i * 44);

      const box = this.add.rectangle(x, currentY + 12, 34, 34, 0x0f172a).setInteractive({ useHandCursor: true });
      box.setStrokeStyle(1.5, augData.color || 0x38bdf8);

      const icon = this.add.text(x, currentY + 12, augData.icon || '⚡', { fontSize: '18px' }).setOrigin(0.5);

      box.on('pointerover', (ptr) => {
        this.showAugmentTooltip(augData, ptr.worldX, ptr.worldY);
      });
      box.on('pointerout', () => {
        this.hideAugmentTooltip();
      });
    });

    return currentY + 38;
  }

  showAugmentTooltip(augData, x, y) {
    this.hideAugmentTooltip();

    this.activeAugTooltip = this.add.container(x + 10, y + 10);
    this.activeAugTooltip.setDepth(3000);

    const bg = this.add.rectangle(0, 0, 220, 70, 0x090d16, 0.95).setOrigin(0);
    bg.setStrokeStyle(1.5, augData.color || 0x38bdf8);

    const title = this.add.text(10, 8, `${augData.icon} ${augData.name}`, {
      fontSize: '13px',
      fill: '#ffffff',
      fontStyle: 'bold'
    });

    const desc = this.add.text(10, 28, augData.desc, {
      fontSize: '11px',
      fill: '#cbd5e1',
      wordWrap: { width: 200 }
    });

    this.activeAugTooltip.add([bg, title, desc]);
  }

  hideAugmentTooltip() {
    if (this.activeAugTooltip) {
      this.activeAugTooltip.destroy();
      this.activeAugTooltip = null;
    }
  }
}

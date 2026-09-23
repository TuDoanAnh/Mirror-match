import Phaser from 'phaser';
import EnemyBot from './EnemyBot';
import { GAME_CONFIG, getBotEquipmentForLevel, getBotHeroForCampaignLevel } from './gameConfig';
import { preloadLuxAssets, createLuxAnimations } from './luxAnimations';
import { preloadEzrealSkillAssets, createEzrealSkillAnimations } from './ezrealSkillAnimations';
import { preloadJinxAssets, createJinxAnimations } from './jinxAnimations';
import { preloadZedSkillAssets, createZedSkillAnimations } from './zedAnimations';
import { preloadRivenSkillAssets, createRivenSkillAnimations } from './rivenAnimations';
import { preloadCharacterSFX, playPreparationBGM, stopPreparationBGM } from './soundManager';
import { createTopRightBar } from './topRightBar';
import { ALL_AUGMENTS } from './AugmentManager';
import { preloadShopItemAssets } from './shopItemLoader';
import { preloadSkillIconAssets, createSkillIconTextures } from './skillIconLoader';
import { preloadAugmentFrameAssets, getAugmentFrameKey, getAugmentTierBadgeText } from './augmentFrameLoader';

import buyBtnUrl from './assets/image/Buy.png';
import sellBtnUrl from './assets/image/Sell.png';
import readyBtnUrl from './assets/image/Ready.png';
import backBtnUrl from './assets/image/Back.png';
import equipBtnUrl from './assets/image/Equip.png';
import elixirBtnUrl from './assets/image/Elixir.png';
import bg1Url from './assets/image/BG_1.png';
import bg2Url from './assets/image/BG_2.png';
import bgMainUrl from './assets/image/Background.png';

import iconHpUrl from './assets/image/hp.png';
import iconAtkUrl from './assets/image/Atk.png';
import iconArmorUrl from './assets/image/Armor.png';
import iconSpeedUrl from './assets/image/speed.png';
import iconCritUrl from './assets/image/Crit.png';
import iconCdrUrl from './assets/image/cooldown.png';
import iconLifestealUrl from './assets/image/healthsteal.png';
import iconArmPenUrl from './assets/image/pen armor.png';

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
    preloadSkillIconAssets(this);
    preloadAugmentFrameAssets(this);

    this.load.image('btn_buy', buyBtnUrl);
    this.load.image('btn_sell', sellBtnUrl);
    this.load.image('btn_ready', readyBtnUrl);
    this.load.image('btn_back', backBtnUrl);
    this.load.image('btn_equip', equipBtnUrl);
    this.load.image('btn_elixir', elixirBtnUrl);
    this.load.image('bg_panel_1', bg1Url);
    this.load.image('bg_panel_2', bg2Url);
    this.load.image('bg_main', bgMainUrl);

    this.load.image('stat_hp', iconHpUrl);
    this.load.image('stat_atk', iconAtkUrl);
    this.load.image('stat_armor', iconArmorUrl);
    this.load.image('stat_speed', iconSpeedUrl);
    this.load.image('stat_crit', iconCritUrl);
    this.load.image('stat_cdr', iconCdrUrl);
    this.load.image('stat_lifesteal', iconLifestealUrl);
    this.load.image('stat_armPen', iconArmPenUrl);
  }

  create() {
    createLuxAnimations(this);
    createEzrealSkillAnimations(this);
    createJinxAnimations(this);
    createZedSkillAnimations(this);
    createRivenSkillAnimations(this);
    createSkillIconTextures(this);
    playPreparationBGM(this);
    createTopRightBar(this);

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

    // Main Scene Background Image with Dimming and Up & Down Floating Motion
    if (this.textures.exists('bg_main')) {
      const bgMain = this.add.image(width / 2, height / 2, 'bg_main').setOrigin(0.5);
      const scaleX = width / bgMain.width;
      const scaleY = height / bgMain.height;
      const scale = Math.max(scaleX, scaleY) * 1.08; // Slightly larger scale to prevent edge clipping during Y movement
      bgMain.setScale(scale);
      bgMain.setTint(0x777777); // Dim background slightly

      // Subtle dark overlay to make UI panels stand out even more
      this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.25).setOrigin(0.5);

      // Smooth floating up and down motion effect
      this.tweens.add({
        targets: bgMain,
        y: (height / 2) + 18,
        duration: 3200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    } else {
      this.add.rectangle(0, 0, width, height, 0x111111).setOrigin(0);
    }

    this.selectedItem = null;
    this.selectedInventoryIndex = null;

    // Main Menu Back Button (Back.png)
    const backBtn = this.add.image(120, 45, 'btn_back').setInteractive({ useHandCursor: true });
    backBtn.setDisplaySize(140, 40);
    const backScaleX = backBtn.scaleX;
    const backScaleY = backBtn.scaleY;

    backBtn.on('pointerover', () => this.tweens.add({ targets: backBtn, scaleX: backScaleX * 1.06, scaleY: backScaleY * 1.06, duration: 100 }));
    backBtn.on('pointerout', () => this.tweens.add({ targets: backBtn, scaleX: backScaleX, scaleY: backScaleY, duration: 100 }));
    backBtn.on('pointerdown', () => {
      stopPreparationBGM(this);
      this.scene.start('StartScene');
    });

    // Top Mode Title Banner
    const mode = this.registry.get('gameMode') || 'campaign';
    let modeTitleStr = "";
    let modeColorStr = "#38bdf8";
    if (mode === 'pvp') {
      modeTitleStr = "⚔️ 1v1 LOCAL PVP ARENA";
      modeColorStr = "#ef4444";
    } else if (mode === 'infinity') {
      modeTitleStr = "♾️ INFINITY SURVIVAL PREPARATION";
      modeColorStr = "#a855f7";
    }

    if (modeTitleStr) {
      this.add.text(width / 2, 45, modeTitleStr, {
        fontSize: '22px',
        fill: modeColorStr,
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4
      }).setOrigin(0.5);
    }

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
    currentY += 44;
    this.add.text(centerX, currentY, "ENEMY STATUS", {
      fontSize: '18px',
      fill: '#ff5555',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    // Level Header / Mode Header
    currentY += 24;
    const isInfinityMode = (this.registry.get('gameMode') === 'infinity');
    const unlockedLevel = this.registry.get('unlockedLevel') || 1;
    let selectedLevel = this.registry.get('selectedLevel') || unlockedLevel;
    if (selectedLevel > unlockedLevel) {
      selectedLevel = unlockedLevel;
      this.registry.set('selectedLevel', selectedLevel);
    }

    const currentHero = this.registry.get('selectedHero') || 'ezreal';
    let currentBotHero = 'ezreal';
    if (isInfinityMode) {
      const survivalLevel = this.registry.get('survivalLevel') || 1;
      selectedLevel = survivalLevel;
      currentBotHero = getBotHeroForCampaignLevel(currentHero, survivalLevel);
    } else {
      currentBotHero = getBotHeroForCampaignLevel(currentHero, selectedLevel);
    }
    this.registry.set('selectedBotHero', currentBotHero);

    const botHeroData = GAME_CONFIG.CHARACTERS[currentBotHero] || GAME_CONFIG.CHARACTERS.ezreal;

    if (!isInfinityMode) {
      const stageNum = Math.floor((selectedLevel - 1) / 5) + 1;
      this.levelTitleText = this.add.text(centerX, currentY, `LEVEL ${selectedLevel}: VS ${botHeroData.name.toUpperCase()} (STAGE ${stageNum}/5)`, {
        fontSize: '12px',
        fill: '#facc15',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0.5);

      currentY += 16;
    }

    // Bot Inventory Section Header & 6-Slot Item Grid
    currentY += 24;

    this.add.text(centerX, currentY, "BOT INVENTORY GEAR", {
      fontSize: '11px',
      fill: '#a855f7',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const botEquip = getBotEquipmentForLevel(selectedLevel);
    const gridY = currentY + 28;
    const slotWidth = 36;
    const slotGap = 42;
    const startSlotX = centerX - ((6 - 1) * slotGap) / 2;

    for (let s = 0; s < 6; s++) {
      const sx = startSlotX + (s * slotGap);
      const slotBox = this.add.rectangle(sx, gridY, slotWidth, slotWidth, 0x0f172a, 0.95);
      const equippedItem = botEquip[s];
      const strokeColor = equippedItem ? (equippedItem.color || 0xa855f7) : 0x334155;
      slotBox.setStrokeStyle(1.2, strokeColor, equippedItem ? 0.9 : 0.4);

      if (equippedItem) {
        const iconKey = `item_${equippedItem.id}`;
        if (this.textures.exists(iconKey)) {
          const iconImg = this.add.image(sx, gridY, iconKey);
          iconImg.setDisplaySize(26, 26);
        }
      } else {
        this.add.text(sx, gridY, "—", { fontSize: '11px', fill: '#475569' }).setOrigin(0.5);
      }
    }

    currentY += 60;

    // Bot Stats Section (2 Columns)
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

    botEquip.forEach(item => {
      if (item.statsDict) {
        if (item.statsDict.bonusHP) enemyStats.maxHp += item.statsDict.bonusHP;
        if (item.statsDict.bonusDamage) enemyStats.atk += item.statsDict.bonusDamage;
        if (item.statsDict.bonusSpeed) enemyStats.speed += item.statsDict.bonusSpeed;
        if (item.statsDict.armor) enemyStats.armor += item.statsDict.armor;
        if (item.statsDict.lifesteal) enemyStats.lifesteal += item.statsDict.lifesteal;
        if (item.statsDict.critChance) enemyStats.critChance += item.statsDict.critChance;
        if (item.statsDict.armorPen) enemyStats.armorPen += item.statsDict.armorPen;
      }
    });

    const col1IconX = centerX - 120;
    const col1TextX = centerX - 100;
    const col2IconX = centerX + 12;
    const col2TextX = centerX + 32;
    const rowGap = 20;

    // Row 1: HP & Crit
    this.add.image(col1IconX, currentY + 7, 'stat_hp').setDisplaySize(16, 16).setOrigin(0.5);
    this.add.text(col1TextX, currentY, `HP: ${Math.round(enemyStats.maxHp)}`, { fontSize: '11px', fill: '#ffffff', stroke: '#000000', strokeThickness: 2 });

    this.add.image(col2IconX, currentY + 7, 'stat_crit').setDisplaySize(16, 16).setOrigin(0.5);
    this.add.text(col2TextX, currentY, `Crit: ${Math.round(enemyStats.critChance)}%`, { fontSize: '11px', fill: '#cbd5e1', stroke: '#000000', strokeThickness: 2 });

    // Row 2: ATK & CDR
    this.add.image(col1IconX, currentY + rowGap + 7, 'stat_atk').setDisplaySize(16, 16).setOrigin(0.5);
    this.add.text(col1TextX, currentY + rowGap, `ATK: ${Math.round(enemyStats.atk)}`, { fontSize: '11px', fill: '#ffffff', stroke: '#000000', strokeThickness: 2 });

    this.add.image(col2IconX, currentY + rowGap + 7, 'stat_cdr').setDisplaySize(16, 16).setOrigin(0.5);
    this.add.text(col2TextX, currentY + rowGap, `CDR: ${Math.round(enemyStats.cdr)}%`, { fontSize: '11px', fill: '#cbd5e1', stroke: '#000000', strokeThickness: 2 });

    // Row 3: Armor & Lifesteal
    this.add.image(col1IconX, currentY + rowGap * 2 + 7, 'stat_armor').setDisplaySize(16, 16).setOrigin(0.5);
    this.add.text(col1TextX, currentY + rowGap * 2, `Armor: ${Math.round(enemyStats.armor)}`, { fontSize: '11px', fill: '#ffffff', stroke: '#000000', strokeThickness: 2 });

    this.add.image(col2IconX, currentY + rowGap * 2 + 7, 'stat_lifesteal').setDisplaySize(16, 16).setOrigin(0.5);
    this.add.text(col2TextX, currentY + rowGap * 2, `Lifesteal: ${Math.round(enemyStats.lifesteal)}%`, { fontSize: '11px', fill: '#cbd5e1', stroke: '#000000', strokeThickness: 2 });

    // Row 4: Speed & ArmPen
    this.add.image(col1IconX, currentY + rowGap * 3 + 7, 'stat_speed').setDisplaySize(16, 16).setOrigin(0.5);
    this.add.text(col1TextX, currentY + rowGap * 3, `Speed: ${Math.round(enemyStats.speed)}`, { fontSize: '11px', fill: '#ffffff', stroke: '#000000', strokeThickness: 2 });

    this.add.image(col2IconX, currentY + rowGap * 3 + 7, 'stat_armPen').setDisplaySize(16, 16).setOrigin(0.5);
    this.add.text(col2TextX, currentY + rowGap * 3, `Arm Pen: ${Math.round(enemyStats.armorPen)}%`, { fontSize: '11px', fill: '#cbd5e1', stroke: '#000000', strokeThickness: 2 });

    // Hero Selection Section
    this.drawHeroSelection(centerX, currentY + 85);
  }

  drawHeroSelection(centerX, startY) {
    let currentY = startY;

    // Divider Line
    this.add.rectangle(centerX, currentY, 250, 1.5, 0x38bdf8, 0.6);

    currentY += 26;
    this.add.text(centerX, currentY, "SELECT YOUR HERO", {
      fontSize: '16px',
      fill: '#00ffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    const heroes = ['ezreal', 'lux', 'jinx', 'zed', 'riven'];
    const currentHero = this.registry.get('selectedHero') || 'ezreal';
    const currentIndex = heroes.indexOf(currentHero) !== -1 ? heroes.indexOf(currentHero) : 0;

    const selectHeroByIndex = (idx) => {
      const targetId = heroes[(idx + heroes.length) % heroes.length];
      if (targetId !== currentHero) {
        this.registry.set('selectedHero', targetId);
        this.scene.restart();
      }
    };

    const selectPrevHero = () => selectHeroByIndex(currentIndex - 1);
    const selectNextHero = () => selectHeroByIndex(currentIndex + 1);

    const keys = this.input.keyboard.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
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

    keys.left.on('down', selectPrevHero);
    keys.right.on('down', selectNextHero);
    keys.one.on('down', () => selectHeroByIndex(0));
    keys.numOne.on('down', () => selectHeroByIndex(0));
    keys.two.on('down', () => selectHeroByIndex(1));
    keys.numTwo.on('down', () => selectHeroByIndex(1));
    keys.three.on('down', () => selectHeroByIndex(2));
    keys.numThree.on('down', () => selectHeroByIndex(2));
    keys.four.on('down', () => selectHeroByIndex(3));
    keys.numFour.on('down', () => selectHeroByIndex(3));
    keys.five.on('down', () => selectHeroByIndex(4));
    keys.numFive.on('down', () => selectHeroByIndex(4));

    // Slide Carousel Center Y
    currentY += 50;
    const slideY = currentY;

    // PREVIOUS Button (◄)
    const prevX = centerX - 105;
    const prevBg = this.add.circle(prevX, slideY, 18, 0x1e293b).setInteractive({ useHandCursor: true });
    prevBg.setStrokeStyle(1.2, 0x38bdf8, 0.7);
    const prevTxt = this.add.text(prevX, slideY - 1, '◄', { fontSize: '16px', fill: '#00ffff', fontStyle: 'bold' }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    prevBg.on('pointerdown', selectPrevHero);
    prevTxt.on('pointerdown', selectPrevHero);
    prevBg.on('pointerover', () => this.tweens.add({ targets: [prevBg, prevTxt], scale: 1.2, duration: 100 }));
    prevBg.on('pointerout', () => this.tweens.add({ targets: [prevBg, prevTxt], scale: 1.0, duration: 100 }));

    // NEXT Button (►)
    const nextX = centerX + 105;
    const nextBg = this.add.circle(nextX, slideY, 18, 0x1e293b).setInteractive({ useHandCursor: true });
    nextBg.setStrokeStyle(1.2, 0x38bdf8, 0.7);
    const nextTxt = this.add.text(nextX, slideY - 1, '►', { fontSize: '16px', fill: '#00ffff', fontStyle: 'bold' }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    nextBg.on('pointerdown', selectNextHero);
    nextTxt.on('pointerdown', selectNextHero);
    nextBg.on('pointerover', () => this.tweens.add({ targets: [nextBg, nextTxt], scale: 1.2, duration: 100 }));
    nextBg.on('pointerout', () => this.tweens.add({ targets: [nextBg, nextTxt], scale: 1.0, duration: 100 }));

    // Center Hero Avatar Display with Snug Circle Mask & Outer Ring Border
    const selectedData = GAME_CONFIG.CHARACTERS[currentHero] || GAME_CONFIG.CHARACTERS.ezreal;
    this.add.circle(centerX, slideY, 34, selectedData.color || 0xffffff, 0.25);
    const heroInnerCircle = this.add.circle(centerX, slideY, 30, 0x0f172a);
    heroInnerCircle.setStrokeStyle(1.0, selectedData.color || 0x38bdf8, 0.5);

    if (['ezreal', 'lux', 'jinx', 'zed', 'riven'].includes(currentHero)) {
      const sheetKey = `${currentHero}_spritesheet`;
      const idleKey = `${currentHero}_idle`;
      if (this.textures.exists(sheetKey)) {
        const heroSprite = this.add.sprite(centerX, slideY, sheetKey, currentHero === 'ezreal' ? 4 : 0);
        heroSprite.setScale(currentHero === 'ezreal' ? 0.33 : 1.0);

        // Geometry Mask to contain sprite strictly inside circle frame
        const heroMaskGfx = this.make.graphics();
        heroMaskGfx.fillStyle(0xffffff, 1.0);
        heroMaskGfx.fillCircle(centerX, slideY, 30);
        heroSprite.setMask(heroMaskGfx.createGeometryMask());

        if (this.anims.exists(idleKey)) {
          heroSprite.play(idleKey);
        }
      } else {
        this.add.circle(centerX, slideY, 26, selectedData.color);
      }
    } else {
      this.add.circle(centerX, slideY, 26, selectedData.color);
    }

    // Colored Border Ring overlay over sprite (Thinner stroke 1.0px & softer alpha 0.6)
    const heroBorder = this.add.circle(centerX, slideY, 30);
    heroBorder.setStrokeStyle(1.0, selectedData.color || 0x38bdf8, 0.6);

    // Hero Description Info
    currentY += 46;
    this.add.text(centerX, currentY, `${selectedData.name} - ${selectedData.title}`, { fontSize: '13px', fill: '#facc15', fontStyle: 'bold', stroke: '#000000', strokeThickness: 2 }).setOrigin(0.5);

    currentY += 22;
    this.add.text(centerX, currentY, selectedData.description, { fontSize: '11px', fill: '#ffffff', align: 'center', wordWrap: { width: 240 } }).setOrigin(0.5, 0);

    // Player Stats Section (Icons & Values positioned directly below Select Your Hero description)
    currentY += 40;
    const stats = this.registry.get('playerStats');
    const pCol1IconX = centerX - 120;
    const pCol1TextX = centerX - 100;
    const pCol2IconX = centerX + 12;
    const pCol2TextX = centerX + 32;
    const pRowGap = 20;

    // Col 1 Stat Icons
    this.add.image(pCol1IconX, currentY + 7, 'stat_hp').setDisplaySize(16, 16).setOrigin(0.5);
    this.add.image(pCol1IconX, currentY + pRowGap + 7, 'stat_atk').setDisplaySize(16, 16).setOrigin(0.5);
    this.add.image(pCol1IconX, currentY + pRowGap * 2 + 7, 'stat_armor').setDisplaySize(16, 16).setOrigin(0.5);
    this.add.image(pCol1IconX, currentY + pRowGap * 3 + 7, 'stat_speed').setDisplaySize(16, 16).setOrigin(0.5);

    // Col 2 Stat Icons
    this.add.image(pCol2IconX, currentY + 7, 'stat_crit').setDisplaySize(16, 16).setOrigin(0.5);
    this.add.image(pCol2IconX, currentY + pRowGap + 7, 'stat_cdr').setDisplaySize(16, 16).setOrigin(0.5);
    this.add.image(pCol2IconX, currentY + pRowGap * 2 + 7, 'stat_lifesteal').setDisplaySize(16, 16).setOrigin(0.5);
    this.add.image(pCol2IconX, currentY + pRowGap * 3 + 7, 'stat_armPen').setDisplaySize(16, 16).setOrigin(0.5);

    const txtStyle = { fontSize: '11px', fill: '#ffffff', stroke: '#000000', strokeThickness: 2 };

    this.statTexts = {
      hp: this.add.text(pCol1TextX, currentY, `HP: ${selectedData.baseStats.hp + stats.bonusHP}`, txtStyle),
      atk: this.add.text(pCol1TextX, currentY + pRowGap, `ATK: ${selectedData.skills.Q.config.damage + stats.bonusDamage}`, txtStyle),
      armor: this.add.text(pCol1TextX, currentY + pRowGap * 2, `Armor: ${selectedData.baseStats.armor + stats.armor}`, txtStyle),
      speed: this.add.text(pCol1TextX, currentY + pRowGap * 3, `Speed: ${selectedData.baseStats.speed + stats.bonusSpeed}`, txtStyle),

      crit: this.add.text(pCol2TextX, currentY, `Crit: ${selectedData.baseStats.critChance + stats.critChance}%`, txtStyle),
      cdr: this.add.text(pCol2TextX, currentY + pRowGap, `CDR: ${Math.round(stats.cdr * 100)}%`, txtStyle),
      lifesteal: this.add.text(pCol2TextX, currentY + pRowGap * 2, `Lifesteal: ${selectedData.baseStats.lifesteal + stats.lifesteal}%`, txtStyle),
      armPen: this.add.text(pCol2TextX, currentY + pRowGap * 3, `Arm Pen: ${stats.armorPen}%`, txtStyle)
    };
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

    // Title
    currentY += 36;
    this.add.text(centerX, currentY, "ITEM SHOP", {
      fontSize: '20px',
      fill: '#ffcc00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    // Shop Category Tabs (Equip.png vs Elixir.png)
    currentY += 28;
    this.shopTab = 'gear';

    const tabWidth = 125;
    const tabHeight = 36;

    const gearTabBtn = this.add.image(centerX - 68, currentY, 'btn_equip').setInteractive({ useHandCursor: true });
    gearTabBtn.setDisplaySize(tabWidth, tabHeight);

    const elixirTabBtn = this.add.image(centerX + 68, currentY, 'btn_elixir').setInteractive({ useHandCursor: true });
    elixirTabBtn.setDisplaySize(tabWidth, tabHeight);

    this.gearContainer = this.add.container(0, 0);
    this.elixirContainer = this.add.container(0, 0).setVisible(false);

    const switchTab = (tab) => {
      this.shopTab = tab;
      if (tab === 'gear') {
        gearTabBtn.setAlpha(1.0).clearTint();
        elixirTabBtn.setAlpha(0.5).setTint(0x777777);
        this.gearContainer.setVisible(true);
        this.elixirContainer.setVisible(false);
      } else {
        elixirTabBtn.setAlpha(1.0).clearTint();
        gearTabBtn.setAlpha(0.5).setTint(0x777777);
        this.gearContainer.setVisible(false);
        this.elixirContainer.setVisible(true);
      }
    };

    switchTab('gear');

    gearTabBtn.on('pointerdown', () => switchTab('gear'));
    elixirTabBtn.on('pointerdown', () => switchTab('elixirs'));

    gearTabBtn.on('pointerover', () => { if (this.shopTab !== 'gear') gearTabBtn.setAlpha(0.85); });
    gearTabBtn.on('pointerout', () => { if (this.shopTab !== 'gear') gearTabBtn.setAlpha(0.5); });
    elixirTabBtn.on('pointerover', () => { if (this.shopTab !== 'elixirs') elixirTabBtn.setAlpha(0.85); });
    elixirTabBtn.on('pointerout', () => { if (this.shopTab !== 'elixirs') elixirTabBtn.setAlpha(0.5); });

    // --- 1. GEAR ITEMS GRID ---
    this.shopItems = GAME_CONFIG.SHOP_ITEMS;
    let gridStartY = currentY + 52;
    let row = 0;
    let col = 0;
    const paddingX = 85;
    const paddingY = 74;

    this.itemButtons = [];

    this.shopItems.forEach((item) => {
      const x = (centerX - 85) + (col * paddingX);
      const y = gridStartY + (row * paddingY);

      const itemContainer = this.add.container(x, y);

      const shadow = this.add.rectangle(3, 3, 62, 62, 0x000000, 0.6);
      const box = this.add.rectangle(0, 0, 62, 62, 0x0f172a).setInteractive({ useHandCursor: true });
      box.setStrokeStyle(2, item.color || 0x38bdf8, 1);

      const itemKey = `item_${item.id}`;
      const icon = this.add.image(0, -5, itemKey);
      icon.setDisplaySize(50, 50);

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
      this.gearContainer.add(itemContainer);

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

    // --- 2. STAT ELIXIRS GRID (Infinite Stat Training) ---
    const elixirItems = GAME_CONFIG.ELIXIR_ITEMS || [];
    let eRow = 0;
    let eCol = 0;
    const ePaddingX = 125;
    const ePaddingY = 120;
    const eStartY = gridStartY + 30;
    this.elixirPriceTexts = [];

    elixirItems.forEach((elixir) => {
      const x = (centerX - 62) + (eCol * ePaddingX);
      const y = eStartY + (eRow * ePaddingY);

      const eContainer = this.add.container(x, y);

      const shadow = this.add.rectangle(4, 4, 110, 105, 0x000000, 0.6);
      const box = this.add.rectangle(0, 0, 110, 105, 0x0f172a).setInteractive({ useHandCursor: true });
      box.setStrokeStyle(2, elixir.color || 0xfacc15, 0.9);

      const iconKey = `item_${elixir.id}`;
      let iconObj;
      if (this.textures.exists(iconKey)) {
        iconObj = this.add.image(0, -22, iconKey);
        iconObj.setDisplaySize(44, 44);
      } else {
        iconObj = this.add.text(0, -28, elixir.icon || '🧪', { fontSize: '28px' }).setOrigin(0.5);
      }

      const nameTxt = this.add.text(0, 7, elixir.name, {
        fontSize: '10px',
        fill: '#ffffff',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: 100 }
      }).setOrigin(0.5);

      const curCost = this.getElixirCost();
      const priceBg = this.add.rectangle(0, 32, 70, 18, 0x090d16, 0.9);
      priceBg.setStrokeStyle(1, 0x334155, 0.8);
      const priceText = this.add.text(0, 32, `${curCost}G`, {
        fontSize: '11px',
        fill: '#facc15',
        fontStyle: 'bold'
      }).setOrigin(0.5);
      this.elixirPriceTexts.push(priceText);

      eContainer.add([shadow, box, iconObj, nameTxt, priceBg, priceText]);
      this.elixirContainer.add(eContainer);

      box.on('pointerover', () => {
        this.tweens.killTweensOf(eContainer);
        this.tweens.add({ targets: eContainer, scale: 1.10, duration: 120, ease: 'Power2' });
      });
      box.on('pointerout', () => {
        this.tweens.killTweensOf(eContainer);
        this.tweens.add({ targets: eContainer, scale: 1.0, duration: 120, ease: 'Power2' });
      });

      box.on('pointerdown', () => {
        const cost = this.getElixirCost();
        this.selectedItem = {
          ...elixir,
          cost: cost,
          isElixir: true,
          statStr: `${elixir.desc} (+100G per purchase)`
        };
        this.selectedInventoryIndex = null;
        this.updateRightPanel();
        this.updateInventoryView();
      });

      eCol++;
      if (eCol > 1) {
        eCol = 0;
        eRow++;
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
    currentY += 42;
    this.inventorySlots = [];
    this.inventorySlotIcons = [];

    for (let i = 0; i < 6; i++) {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const x = (centerX - 66) + (col * 66);
      const y = currentY + (row * 64);

      const slotContainer = this.add.container(x, y);

      const slotBg = this.add.rectangle(0, 0, 54, 54, 0x1e293b).setInteractive({ useHandCursor: true });
      slotBg.setStrokeStyle(1.5, 0x334155);

      const slotIcon = this.add.image(0, 0, 'item_doransBlade').setVisible(false);
      slotIcon.setDisplaySize(46, 46);

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

    // Advance past inventory slots
    currentY += 130;

    // Active Augments Section
    currentY = this.drawAugmentsSection(centerX, currentY);

    // Item Description Box (Expanded size & left-aligned text next to icon)
    currentY += 35;
    const descBoxY = currentY + 54;
    this.descBoxCenterX = centerX;
    this.descBoxCenterY = descBoxY;

    this.descBox = this.add.rectangle(centerX, descBoxY, 274, 112, 0x0f172a);
    this.descBox.setStrokeStyle(1.5, 0x334155);

    this.descIcon = this.add.image(centerX - 98, descBoxY, 'item_doransBlade').setVisible(false);
    this.descIcon.setDisplaySize(58, 58);

    this.descName = this.add.text(centerX, descBoxY, "SELECT AN ITEM", {
      fontSize: '14px',
      fill: '#ffffff',
      fontStyle: 'bold',
      wordWrap: { width: 185 }
    }).setOrigin(0.5, 0.5);

    this.descStat = this.add.text(centerX - 58, descBoxY - 8, "", {
      fontSize: '11px',
      fill: '#34d399',
      align: 'left',
      wordWrap: { width: 185 }
    }).setOrigin(0, 0);

    this.descCost = this.add.text(centerX - 58, descBoxY + 44, "", {
      fontSize: '13px',
      fill: '#facc15',
      fontStyle: 'bold'
    }).setOrigin(0, 1);

    // BUY & SELL Buttons
    currentY += 145;
    const btnY = currentY;

    // BUY Button (Left)
    this.buyBtn = this.add.image(centerX - 68, btnY, 'btn_buy').setInteractive({ useHandCursor: true });
    this.buyBtn.setDisplaySize(120, 44);
    this.buyBtn.baseScaleX = this.buyBtn.scaleX;
    this.buyBtn.baseScaleY = this.buyBtn.scaleY;

    this.buyBtn.on('pointerover', () => this.tweens.add({ targets: this.buyBtn, scaleX: this.buyBtn.baseScaleX * 1.08, scaleY: this.buyBtn.baseScaleY * 1.08, duration: 150, ease: 'Power2' }));
    this.buyBtn.on('pointerout', () => this.tweens.add({ targets: this.buyBtn, scaleX: this.buyBtn.baseScaleX, scaleY: this.buyBtn.baseScaleY, duration: 150, ease: 'Power2' }));
    this.buyBtn.on('pointerdown', () => this.buyItem());

    // SELL Button (Right)
    this.sellBtn = this.add.image(centerX + 68, btnY, 'btn_sell').setInteractive({ useHandCursor: true });
    this.sellBtn.setDisplaySize(120, 44);
    this.sellBtn.baseScaleX = this.sellBtn.scaleX;
    this.sellBtn.baseScaleY = this.sellBtn.scaleY;

    this.sellBtn.on('pointerover', () => this.tweens.add({ targets: this.sellBtn, scaleX: this.sellBtn.baseScaleX * 1.08, scaleY: this.sellBtn.baseScaleY * 1.08, duration: 150, ease: 'Power2' }));
    this.sellBtn.on('pointerout', () => this.tweens.add({ targets: this.sellBtn, scaleX: this.sellBtn.baseScaleX, scaleY: this.sellBtn.baseScaleY, duration: 150, ease: 'Power2' }));
    this.sellBtn.on('pointerdown', () => this.sellItem());

    // READY Button
    currentY += 78;
    this.readyBtn = this.add.image(centerX, currentY, 'btn_ready').setInteractive({ useHandCursor: true });
    this.readyBtn.setDisplaySize(220, 58);
    this.readyBtn.baseScaleX = this.readyBtn.scaleX;
    this.readyBtn.baseScaleY = this.readyBtn.scaleY;

    const onReady = () => {
      stopPreparationBGM(this);
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('GameScene', {
          level: this.registry.get('selectedLevel') || this.registry.get('unlockedLevel') || 1,
          color: 0x0088ff,
          mode: this.registry.get('gameMode') || 'campaign'
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
    const cX = this.descBoxCenterX;
    const cY = this.descBoxCenterY;

    const alignDescText = () => {
      this.descName.setOrigin(0, 0);
      this.descStat.setOrigin(0, 0);
      this.descCost.setOrigin(0, 0);

      const nameH = this.descName.height || 16;
      const statH = this.descStat.height || 12;
      const costH = this.descCost.height || 16;
      const gap = 4;
      const totalH = nameH + gap + statH + gap + costH;
      const startY = cY - (totalH / 2);

      const textX = cX - 58;
      this.descName.setPosition(textX, startY);
      this.descStat.setPosition(textX, startY + nameH + gap);
      this.descCost.setPosition(textX, startY + nameH + gap + statH + gap);
    };

    if (this.selectedItem) {
      // Shop item selected
      this.descName.setText(this.selectedItem.name);
      this.descStat.setText(this.selectedItem.statStr);
      this.descCost.setText(`Buy: ${this.selectedItem.cost}G`).setColor('#ffff00');
      alignDescText();

      if (this.descIcon) {
        this.descIcon.setTexture(`item_${this.selectedItem.id}`);
        this.descIcon.setDisplaySize(58, 58);
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
        this.descCost.setText(`Sell: +${sellPrice}G (${Math.round(GAME_CONFIG.ECONOMY.SELL_REFUND_RATIO * 100)}%)`).setColor('#ffaa00');
        alignDescText();

        if (this.descIcon) {
          this.descIcon.setTexture(`item_${item.id}`);
          this.descIcon.setDisplaySize(58, 58);
          this.descIcon.setVisible(true);
        }

        if (this.buyBtn) this.buyBtn.setAlpha(0.45).setTint(0x666666);
        if (this.sellBtn) this.sellBtn.setAlpha(1.0).clearTint();
      }
    } else {
      this.descName.setText("SELECT AN ITEM")
        .setOrigin(0.5, 0.5)
        .setPosition(cX, cY);
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
    const caps = GAME_CONFIG.STAT_CAPS || { MAX_CDR: 0.60, MAX_ARMOR_PEN: 60, MAX_CRIT_CHANCE: 100, MAX_LIFESTEAL: 60 };

    const baseHp = heroData.baseStats.hp;
    const baseAtk = heroData.skills.Q.config.damage;
    const baseSpeed = heroData.baseStats.speed;

    const rawCrit = heroData.baseStats.critChance + stats.critChance;
    const cappedCrit = Math.min(caps.MAX_CRIT_CHANCE, rawCrit);

    const rawCdrPct = Math.round((stats.cdr || 0) * 100);
    const maxCdrPct = Math.round(caps.MAX_CDR * 100);
    const cappedCdrPct = Math.min(maxCdrPct, rawCdrPct);

    const rawLifesteal = heroData.baseStats.lifesteal + stats.lifesteal;
    const cappedLifesteal = Math.min(caps.MAX_LIFESTEAL, rawLifesteal);

    const rawArmPen = stats.armorPen || 0;
    const cappedArmPen = Math.min(caps.MAX_ARMOR_PEN, rawArmPen);

    this.statTexts.hp.setText(`HP: ${baseHp + stats.bonusHP}`);
    this.statTexts.atk.setText(`ATK: ${baseAtk + stats.bonusDamage}`);
    this.statTexts.armor.setText(`Armor: ${heroData.baseStats.armor + stats.armor}`);
    this.statTexts.speed.setText(`Speed: ${baseSpeed + stats.bonusSpeed}`);

    this.statTexts.crit.setText(`Crit: ${cappedCrit}%${rawCrit >= caps.MAX_CRIT_CHANCE ? ' (MAX)' : ''}`);
    this.statTexts.cdr.setText(`CDR: ${cappedCdrPct}%${rawCdrPct >= maxCdrPct ? ' (MAX)' : ''}`);
    this.statTexts.lifesteal.setText(`Lifesteal: ${cappedLifesteal}%${rawLifesteal >= caps.MAX_LIFESTEAL ? ' (MAX)' : ''}`);
    this.statTexts.armPen.setText(`Arm Pen: ${cappedArmPen}%${rawArmPen >= caps.MAX_ARMOR_PEN ? ' (MAX)' : ''}`);
  }

  getElixirCost() {
    const count = this.registry.get('elixirBuyCount') || 0;
    const baseCost = 500;
    const increment = 100;
    return baseCost + (count * increment);
  }

  updateElixirPriceTexts() {
    if (!this.elixirPriceTexts) return;
    const curCost = this.getElixirCost();
    this.elixirPriceTexts.forEach(txt => {
      txt.setText(`${curCost}G`);
    });
  }

  buyItem() {
    if (!this.selectedItem) return;

    let gold = this.registry.get('gold');
    let inv = this.registry.get('inventory');

    if (this.selectedItem.isElixir) {
      const currentCost = this.getElixirCost();
      if (gold >= currentCost) {
        gold -= currentCost;
        this.registry.set('gold', gold);

        const buyCount = this.registry.get('elixirBuyCount') || 0;
        this.registry.set('elixirBuyCount', buyCount + 1);

        let stats = this.registry.get('playerStats');
        if (this.selectedItem.statsDict) {
          Object.keys(this.selectedItem.statsDict).forEach(k => {
            stats[k] = (stats[k] || 0) + this.selectedItem.statsDict[k];
          });
        }
        this.registry.set('playerStats', stats);

        this.goldText.setText(`GOLD: ${gold}`);
        this.updatePlayerStatsUI();
        this.updateElixirPriceTexts();

        this.selectedItem.cost = this.getElixirCost();

        if (this.buyBtn) this.buyBtn.setTint(0x00ff88);
        this.time.delayedCall(120, () => this.updateRightPanel());
      } else {
        if (this.buyBtn) this.buyBtn.setTint(0xff3333);
        this.time.delayedCall(120, () => this.updateRightPanel());
      }
      return;
    }

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
    this.add.text(centerX, currentY, `⚡ ACTIVE AUGMENTS (${ownedAugs.length})`, {
      fontSize: '13px',
      fill: '#fde047',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    currentY += 24;

    const maxPerRow = 6;
    const itemGapX = 40;
    const itemGapY = 40;
    const totalRows = Math.ceil(ownedAugs.length / maxPerRow);

    ownedAugs.forEach((aug, i) => {
      const augData = typeof aug === 'string' ? ALL_AUGMENTS.find(a => a.id === aug) : aug;
      if (!augData) return;

      const rowIndex = Math.floor(i / maxPerRow);
      const colIndex = i % maxPerRow;
      const rowCount = Math.min(maxPerRow, ownedAugs.length - (rowIndex * maxPerRow));

      const rowStartX = centerX - ((rowCount - 1) * (itemGapX / 2));
      const x = rowStartX + (colIndex * itemGapX);
      const y = currentY + (rowIndex * itemGapY);

      const box = this.add.rectangle(x, y, 32, 32, 0x0f172a, 0.9).setInteractive({ useHandCursor: true });
      box.setStrokeStyle(1.5, augData.color || 0x38bdf8);

      const icon = this.add.text(x, y, augData.icon || '⚡', { fontSize: '18px' }).setOrigin(0.5);

      box.on('pointerover', (ptr) => {
        this.showAugmentTooltip(augData, ptr.worldX, ptr.worldY);
      });
      box.on('pointerout', () => {
        this.hideAugmentTooltip();
      });
    });

    const totalHeight = (totalRows * itemGapY);
    return currentY + totalHeight + 10;
  }

  showAugmentTooltip(augData, x, y) {
    this.hideAugmentTooltip();

    this.activeAugTooltip = this.add.container(x + 10, y + 10);
    this.activeAugTooltip.setDepth(3000);

    const bg = this.add.rectangle(0, 0, 230, 76, 0x090d16, 0.95).setOrigin(0);
    bg.setStrokeStyle(1.5, augData.color || 0x38bdf8);

    const tierBadge = getAugmentTierBadgeText(augData);
    const title = this.add.text(10, 8, `${augData.icon} ${augData.name} (${tierBadge})`, {
      fontSize: '12px',
      fill: '#ffffff',
      fontStyle: 'bold'
    });

    const desc = this.add.text(10, 30, augData.desc, {
      fontSize: '11px',
      fill: '#cbd5e1',
      wordWrap: { width: 210 }
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

import Phaser from 'phaser';
import { GAME_CONFIG } from './gameConfig';
import endlessWindowUrl from './assets/image/Endless_Window.png';

const TUTORIAL_SLIDES = [
  {
    slideNumber: "1 / 5",
    category: "GAME MODES",
    title: "EXPLORE THE 2 GAMEPLAY MODES",
    themeColor: 0x38bdf8,
    textColor: "#38bdf8",
    sections: [
      {
        badge: "CAMPAIGN MODE",
        badgeColor: "#38bdf8",
        content:
          "• Battle through 5 main Levels, each featuring 5 intense Stages against enemy Champions & Creeps.\n" +
          "• Hero selection is LOCKED after Level 1 Stage 1. (To switch Hero later, start a New Game).\n" +
          "• Defeat stage bosses to earn Gold rewards & unlock higher challenge tiers."
      },
      {
        badge: "INFINITY SURVIVAL MODE",
        badgeColor: "#a855f7",
        content:
          "• Endless arena battle against infinitely scaling waves of monster hordes & enemy heroes.\n" +
          "• Test your ultimate equipment & augment builds to achieve maximum Kills & Survival Duration.\n" +
          "• Track your personal High Scores and rank up on the survival leaderboard!"
      }
    ]
  },
  {
    slideNumber: "2 / 5",
    category: "PREPARATION & STATS",
    title: "HERO SELECTION & STATS OVERVIEW",
    themeColor: 0xfacc15,
    textColor: "#facc15",
    sections: [
      {
        badge: "HERO SELECTION & ROLES",
        badgeColor: "#facc15",
        content:
          "• Choose between 5 unique Champions: Kira, Lumina, Elion, Kage, and Rivia.\n" +
          "• Each Champion possesses unique Skill combos (Q, E, Space Ultimate) & core stat growth."
      },
      {
        badge: "DETAILED STATISTICAL INDICATORS",
        badgeColor: "#38bdf8",
        content:
          "• HP & Armor: Total Health & Physical damage reduction percentage.\n" +
          "• ATK & Armor Pen: Attack damage power & piercing through enemy armor defense.\n" +
          "• Speed & CDR: Movement swiftness & Cooldown Reduction (Max CDR cap: 60%).\n" +
          "• Crit & Lifesteal: Critical strike chance (100% max) & Health restoration per hit."
      }
    ]
  },
  {
    slideNumber: "3 / 5",
    category: "SHOP & ELIXIRS",
    title: "EQUIPMENT SHOP & STAT ELIXIRS",
    themeColor: 0xec4899,
    textColor: "#ec4899",
    sections: [
      {
        badge: "EQUIPMENT & ACTIVE ITEMS",
        badgeColor: "#ec4899",
        content:
          "• Purchase Weapons, Armor, Boots, and powerful Active Gear in the Shop.\n" +
          "• Active Items: Zhonya (Golden Invulnerability), Rocketbelt (Hex Dash), QSS (Cleanse), Health Potion.\n" +
          "• Manage 6 Inventory Slots: Drag or click to Equip / Sell items for a 70% Gold refund."
      },
      {
        badge: "STAT ELIXIRS (UP TO 10 STACKS EACH)",
        badgeColor: "#34d399",
        content:
          "• Consume Elixirs (Might, Iron, Vampirism, Haste) to gain permanent combat stat boosts.\n" +
          "• Stack up to 10 Elixirs of each type to maximize your hero's end-game power spikes!"
      }
    ]
  },
  {
    slideNumber: "4 / 5",
    category: "CONTROLS & BATTLE",
    title: "KEYBOARD CONTROLS & COMBAT TACTICS",
    themeColor: 0xa855f7,
    textColor: "#a855f7",
    sections: [
      {
        badge: "COMPLETE KEYBOARD CONTROLS",
        badgeColor: "#a855f7",
        content:
          "• Move Character: W, A, S, D keys  |  Aim Direction: Mouse Pointer\n" +
          "• Q Skill: Left Mouse Click / Q Key  |  E Skill (Utility / Dash): E Key\n" +
          "• Ultimate Skill: Spacebar  |  Active Items (HUD Slots 1-6): Keys 1, 2, 3, 4, 5, 6"
      },
      {
        badge: "IN-MATCH COMBAT & PICKUPS",
        badgeColor: "#fbbf24",
        content:
          "• Aim skillshots accurately while continuously dodging enemy projectile waves.\n" +
          "• Defeat enemy creeps to drop Gold coins & Health restoration items on the battlefield."
      }
    ]
  },
  {
    slideNumber: "5 / 5",
    category: "AUGMENTS SYSTEM",
    title: "AUGMENT TIERS & BUILD SYNERGIES",
    themeColor: 0x34d399,
    textColor: "#34d399",
    sections: [
      {
        badge: "TIERED AUGMENT SELECTION",
        badgeColor: "#34d399",
        content:
          "• Unlock & select Augments across 3 Tiers: Silver 🥈, Gold 🥇, and Diamond 💎.\n" +
          "• Augments grant permanent passive superpowers that transform your champion's combat capabilities."
      },
      {
        badge: "GAME-CHANGING PASSIVES & COMBOS",
        badgeColor: "#facc15",
        content:
          "• Mystic Split: Skill projectiles split into 2 extra homing energy bolts.\n" +
          "• Arcane Mine: Dashing drops explosive landmines behind you.\n" +
          "• Adrenaline Rush: Dropping below 25% HP resets skill cooldowns & grants a massive shield.\n" +
          "• Combine Augments with Shop Equipment to create unstoppable combat synergies!"
      }
    ]
  }
];

/**
 * Renders graphical illustrations (hero sprites, item icons, skill icons, key badges) on right side of scaled cards.
 */
function renderSlideVisuals(scene, slideIndex, bodyContainer, centerX, modalW, bodyStartY) {
  const cardW = modalW - 60; // 1140px
  const cardH = 210; // 210px
  const cardGap = 16;
  const rightAreaX = centerX + cardW / 2 - 160;

  if (slideIndex === 0) {
    // Slide 1: Game Mode Banners
    const card1Y = bodyStartY + cardH / 2;
    if (scene.textures.exists('btn_campaign')) {
      const img = scene.add.image(rightAreaX, card1Y, 'btn_campaign');
      img.setScale(180 / img.width);
      bodyContainer.add(img);
    }

    const card2Y = bodyStartY + cardH + cardGap + cardH / 2;
    if (scene.textures.exists('btn_endless')) {
      const img = scene.add.image(rightAreaX, card2Y, 'btn_endless');
      img.setScale(180 / img.width);
      bodyContainer.add(img);
    }
  } else if (slideIndex === 1) {
    // Slide 2: Hero Sprites Showcase & Stat Icons
    const card1Y = bodyStartY + cardH / 2;
    const heroes = [
      { key: 'jinx_spritesheet', frame: 0, name: 'Kira', scale: 0.9 },
      { key: 'lux_spritesheet', frame: 0, name: 'Lumina', scale: 0.9 },
      { key: 'ezreal_spritesheet', frame: 4, name: 'Elion', scale: 0.65 },
      { key: 'zed_spritesheet', frame: 0, name: 'Kage', scale: 0.9 },
      { key: 'riven_spritesheet', frame: 0, name: 'Rivia', scale: 0.9 }
    ];

    const heroStartX = rightAreaX - 100;
    heroes.forEach((h, idx) => {
      const hx = heroStartX + idx * 50;
      const circ = scene.add.circle(hx, card1Y - 10, 20, 0x0f172a);
      circ.setStrokeStyle(2, 0x38bdf8);
      bodyContainer.add(circ);

      if (scene.textures.exists(h.key)) {
        const spr = scene.add.sprite(hx, card1Y - 10, h.key, h.frame);
        spr.setScale(h.scale || 0.9);
        bodyContainer.add(spr);
      }

      const label = scene.add.text(hx, card1Y + 22, h.name, { fontSize: '11px', fill: '#facc15', fontStyle: 'bold' }).setOrigin(0.5);
      bodyContainer.add(label);
    });

    // Card 2: 2x4 Stat Icons Grid
    const card2Y = bodyStartY + cardH + cardGap + cardH / 2;
    const statKeys = [
      { key: 'stat_hp', label: 'HP' },
      { key: 'stat_atk', label: 'ATK' },
      { key: 'stat_armor', label: 'ARMOR' },
      { key: 'stat_speed', label: 'SPEED' },
      { key: 'stat_crit', label: 'CRIT' },
      { key: 'stat_cdr', label: 'CDR' },
      { key: 'stat_lifesteal', label: 'STEAL' },
      { key: 'stat_armPen', label: 'PEN' }
    ];

    statKeys.forEach((st, idx) => {
      const col = idx % 4;
      const row = Math.floor(idx / 4);
      const sx = rightAreaX - 75 + col * 50;
      const sy = card2Y - 24 + row * 46;

      const bg = scene.add.rectangle(sx, sy, 38, 38, 0x0f172a).setStrokeStyle(1.5, 0x334155);
      bodyContainer.add(bg);

      if (scene.textures.exists(st.key)) {
        const icon = scene.add.image(sx, sy, st.key);
        icon.setDisplaySize(28, 28);
        bodyContainer.add(icon);
      }
    });
  } else if (slideIndex === 2) {
    // Slide 3: Active Items & Elixirs Icons
    const card1Y = bodyStartY + cardH / 2;
    const activeItems = [
      { key: 'item_zhonya', slot: '1' },
      { key: 'item_rocketbelt', slot: '2' },
      { key: 'item_qss', slot: '3' },
      { key: 'item_healthPotion', slot: '4' }
    ];

    activeItems.forEach((item, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const ix = rightAreaX - 45 + col * 80;
      const iy = card1Y - 26 + row * 52;

      const bg = scene.add.rectangle(ix, iy, 46, 46, 0x0f172a).setStrokeStyle(2, 0xec4899);
      bodyContainer.add(bg);

      if (scene.textures.exists(item.key)) {
        const img = scene.add.image(ix, iy, item.key);
        img.setDisplaySize(36, 36);
        bodyContainer.add(img);
      }

      const badgeBg = scene.add.circle(ix + 18, iy - 18, 10, 0x38bdf8);
      const badgeTxt = scene.add.text(ix + 18, iy - 18, item.slot, { fontSize: '11px', fill: '#000', fontStyle: 'bold' }).setOrigin(0.5);
      bodyContainer.add([badgeBg, badgeTxt]);
    });

    // Card 2: 4 Elixir Icons Grid
    const card2Y = bodyStartY + cardH + cardGap + cardH / 2;
    const elixirs = [
      { key: 'item_elixir_strength', name: 'Might' },
      { key: 'item_elixir_titan', name: 'Iron' },
      { key: 'item_elixir_vamp', name: 'Vampirism' },
      { key: 'item_elixir_agility', name: 'Haste' }
    ];

    elixirs.forEach((el, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const ex = rightAreaX - 45 + col * 80;
      const ey = card2Y - 26 + row * 52;

      const bg = scene.add.rectangle(ex, ey, 46, 46, 0x0f172a).setStrokeStyle(2, 0x34d399);
      bodyContainer.add(bg);

      if (scene.textures.exists(el.key)) {
        const img = scene.add.image(ex, ey, el.key);
        img.setDisplaySize(36, 36);
        bodyContainer.add(img);
      }

      const stackTxt = scene.add.text(ex + 16, ey + 14, "x10", { fontSize: '11px', fill: '#facc15', fontStyle: 'bold' }).setOrigin(0.5);
      bodyContainer.add(stackTxt);
    });
  } else if (slideIndex === 3) {
    // Slide 4: Key Badges & Skill Icons
    const card1Y = bodyStartY + cardH / 2;
    const keysData = [
      { label: 'W A S D', desc: 'MOVE', color: 0x38bdf8 },
      { label: 'Q   E   SPACE', desc: 'SKILLS', color: 0xa855f7 },
      { label: '1 - 6', desc: 'ITEMS', color: 0xec4899 }
    ];

    keysData.forEach((kd, idx) => {
      const ky = card1Y - 48 + idx * 48;
      const kbox = scene.add.rectangle(rightAreaX, ky, 220, 32, 0x0f172a).setStrokeStyle(2, kd.color);
      const ktxt = scene.add.text(rightAreaX, ky, `[ ${kd.label} ]   ${kd.desc}`, {
        fontSize: '13px',
        fill: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5);
      bodyContainer.add([kbox, ktxt]);
    });

    // Card 2: Lumina Skill Icons Showcase
    const card2Y = bodyStartY + cardH + cardGap + cardH / 2;
    const skillIcons = [
      { key: 'icon_lux_Q', label: 'Q' },
      { key: 'icon_lux_E', label: 'E' },
      { key: 'icon_lux_SPACE', label: 'SPACE' }
    ];

    skillIcons.forEach((sk, idx) => {
      const sx = rightAreaX - 65 + idx * 65;
      const sy = card2Y - 8;

      const bg = scene.add.rectangle(sx, sy, 46, 46, 0x0f172a).setStrokeStyle(2, 0xfacc15);
      bodyContainer.add(bg);

      if (scene.textures.exists(sk.key)) {
        const img = scene.add.image(sx, sy, sk.key);
        img.setDisplaySize(38, 38);
        bodyContainer.add(img);
      }

      const ltxt = scene.add.text(sx, sy + 32, sk.label, { fontSize: '11px', fill: '#38bdf8', fontStyle: 'bold' }).setOrigin(0.5);
      bodyContainer.add(ltxt);
    });
  } else if (slideIndex === 4) {
    // Slide 5: Augment Frames & Tier Badges
    const card1Y = bodyStartY + cardH / 2;
    const augFrames = [
      { key: 'frame_augment_silver', name: 'SILVER 🥈' },
      { key: 'frame_augment_gold', name: 'GOLD 🥇' },
      { key: 'frame_augment_diamond', name: 'DIAMOND 💎' }
    ];

    augFrames.forEach((af, idx) => {
      const ax = rightAreaX - 70 + idx * 70;
      const ay = card1Y - 10;

      if (scene.textures.exists(af.key)) {
        const img = scene.add.image(ax, ay, af.key);
        img.setDisplaySize(54, 54);
        bodyContainer.add(img);
      } else {
        const box = scene.add.rectangle(ax, ay, 46, 46, 0x0f172a).setStrokeStyle(2, 0x38bdf8);
        bodyContainer.add(box);
      }

      const txt = scene.add.text(ax, ay + 36, af.name, { fontSize: '11px', fill: '#cbd5e1', fontStyle: 'bold' }).setOrigin(0.5);
      bodyContainer.add(txt);
    });

    // Card 2: Synergy Badges
    const card2Y = bodyStartY + cardH + cardGap + cardH / 2;
    const synBadges = [
      { text: '✨ MYSTIC SPLIT', color: '#38bdf8' },
      { text: '💣 ARCANE MINE', color: '#facc15' },
      { text: '⚡ ADRENALINE RUSH', color: '#ec4899' }
    ];

    synBadges.forEach((sb, idx) => {
      const sy = card2Y - 44 + idx * 44;
      const box = scene.add.rectangle(rightAreaX, sy, 220, 30, 0x0f172a).setStrokeStyle(2, 0x34d399);
      const txt = scene.add.text(rightAreaX, sy, sb.text, { fontSize: '12px', fill: sb.color, fontStyle: 'bold' }).setOrigin(0.5);
      bodyContainer.add([box, txt]);
    });
  }
}

/**
 * Shows the tutorial & slideshow modal with enlarged vector frame and scaled up content.
 */
export function showTutorialSlideshowModal(scene, initialSlideIndex = 0, onClose = null) {
  if (scene.tutorialModal) {
    scene.tutorialModal.destroy();
    scene.tutorialModal = null;
  }

  const width = GAME_CONFIG.CANVAS.WIDTH;
  const height = GAME_CONFIG.CANVAS.HEIGHT;
  const centerX = width / 2;
  const centerY = height / 2;

  let currentSlide = Math.max(0, Math.min(TUTORIAL_SLIDES.length - 1, initialSlideIndex));

  const container = scene.add.container(0, 0).setDepth(9000);

  // Dark translucent background overlay
  const overlay = scene.add.rectangle(0, 0, width, height, 0x000000, 0.86).setOrigin(0).setInteractive();

  // Outer Vector Modal Frame (Width: 1200px, Height: 760px)
  const modalW = 1200;
  const modalH = 760;

  const modalBg = scene.add.rectangle(centerX, centerY, modalW, modalH, 0x0b1329, 0.98);
  modalBg.setStrokeStyle(3, 0x38bdf8);

  // Inner inset border frame for sleek gaming look
  const innerOutline = scene.add.rectangle(centerX, centerY, modalW - 16, modalH - 16, 0x000000, 0);
  innerOutline.setStrokeStyle(1.5, 0x1e293b);

  // Header Box (Y: centerY - modalH / 2 + 52)
  const headerY = centerY - modalH / 2 + 52;
  const headerBox = scene.add.rectangle(centerX, headerY, modalW - 40, 68, 0x1e293b, 0.95);
  headerBox.setStrokeStyle(2, 0x38bdf8);

  const categoryTxt = scene.add.text(centerX - modalW / 2 + 40, headerY - 15, "", {
    fontSize: '13px',
    fontStyle: 'bold',
    stroke: '#000000',
    strokeThickness: 3
  }).setOrigin(0, 0.5);

  const titleTxt = scene.add.text(centerX - modalW / 2 + 40, headerY + 12, "", {
    fontSize: '18px',
    fill: '#ffffff',
    fontStyle: 'bold',
    stroke: '#000000',
    strokeThickness: 3
  }).setOrigin(0, 0.5);

  const slideCounterTxt = scene.add.text(centerX + modalW / 2 - 100, headerY, "", {
    fontSize: '16px',
    fill: '#94a3b8',
    fontStyle: 'bold'
  }).setOrigin(1, 0.5);

  // Close Button (Top Right ✕ - inside header bar)
  const closeBtnBg = scene.add.circle(centerX + modalW / 2 - 45, headerY, 20, 0xef4444).setInteractive({ useHandCursor: true });
  closeBtnBg.setStrokeStyle(2, 0xffffff);
  const closeBtnTxt = scene.add.text(centerX + modalW / 2 - 45, headerY, "✕", {
    fontSize: '16px',
    fill: '#ffffff',
    fontStyle: 'bold'
  }).setOrigin(0.5).setInteractive({ useHandCursor: true });

  // Body Container for Slide Content
  const bodyContainer = scene.add.container(0, 0);

  // Navigation Bar at Bottom (Y: centerY + modalH / 2 - 50)
  const navY = centerY + modalH / 2 - 50;

  // Prev Button
  const prevBtnBg = scene.add.rectangle(centerX - 420, navY, 180, 46, 0x1e293b).setInteractive({ useHandCursor: true });
  prevBtnBg.setStrokeStyle(2, 0x475569);
  const prevBtnTxt = scene.add.text(centerX - 420, navY, "◀ PREVIOUS", {
    fontSize: '16px',
    fill: '#ffffff',
    fontStyle: 'bold'
  }).setOrigin(0.5);

  // Next / Got It Button
  const nextBtnBg = scene.add.rectangle(centerX + 420, navY, 190, 46, 0x0284c7).setInteractive({ useHandCursor: true });
  nextBtnBg.setStrokeStyle(2, 0x38bdf8);
  const nextBtnTxt = scene.add.text(centerX + 420, navY, "NEXT ▶", {
    fontSize: '16px',
    fill: '#ffffff',
    fontStyle: 'bold'
  }).setOrigin(0.5);

  // Indicator Dots Container
  const dotsContainer = scene.add.container(0, 0);

  const destroyModal = () => {
    try {
      localStorage.setItem('has_seen_tutorial', 'true');
    } catch (e) { }
    container.destroy();
    scene.tutorialModal = null;
    if (typeof onClose === 'function') {
      onClose();
    }
  };

  closeBtnBg.on('pointerdown', destroyModal);
  closeBtnTxt.on('pointerdown', destroyModal);
  overlay.on('pointerdown', destroyModal);

  // Render Slide Function
  const renderSlide = (index) => {
    currentSlide = index;
    const slideData = TUTORIAL_SLIDES[currentSlide];

    categoryTxt.setText(slideData.category);
    categoryTxt.setStyle({ fill: slideData.textColor });

    titleTxt.setText(slideData.title);
    slideCounterTxt.setText(slideData.slideNumber);

    modalBg.setStrokeStyle(3, slideData.themeColor);
    headerBox.setStrokeStyle(2, slideData.themeColor);

    // Clear Body Container
    bodyContainer.removeAll(true);

    // Render Sections
    const bodyStartY = centerY - 250; // Starting Y for body content
    let cardY = bodyStartY;
    const cardW = modalW - 60; // 1140px
    const cardH = 210; // 210px
    const cardGap = 16;

    slideData.sections.forEach((sec) => {
      const cardBox = scene.add.rectangle(centerX, cardY + cardH / 2, cardW, cardH, 0x0f172a, 0.9);
      cardBox.setStrokeStyle(2, 0x334155);

      const badgeText = scene.add.text(centerX - cardW / 2 + 25, cardY + 22, sec.badge, {
        fontSize: '17px',
        fill: sec.badgeColor,
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3
      });

      const bodyText = scene.add.text(centerX - cardW / 2 + 25, cardY + 54, sec.content, {
        fontSize: '15px',
        fill: '#cbd5e1',
        lineSpacing: 7,
        wordWrap: { width: cardW - 360 }
      });

      bodyContainer.add([cardBox, badgeText, bodyText]);
      cardY += cardH + cardGap;
    });

    // Render Visual Illustrations (Images, Sprites, Icons, Badges)
    renderSlideVisuals(scene, currentSlide, bodyContainer, centerX, modalW, bodyStartY);

    // Update Nav Buttons State
    if (currentSlide === 0) {
      prevBtnBg.setFillStyle(0x0f172a, 0.5);
      prevBtnBg.setStrokeStyle(1, 0x334155);
      prevBtnTxt.setStyle({ fill: 0x64748b });
      prevBtnBg.disableInteractive();
    } else {
      prevBtnBg.setFillStyle(0x1e293b, 1);
      prevBtnBg.setStrokeStyle(2, 0x475569);
      prevBtnTxt.setStyle({ fill: '#ffffff' });
      prevBtnBg.setInteractive({ useHandCursor: true });
    }

    if (currentSlide === TUTORIAL_SLIDES.length - 1) {
      nextBtnBg.setFillStyle(0x16a34a, 1);
      nextBtnBg.setStrokeStyle(2, 0x4ade80);
      nextBtnTxt.setText("GOT IT!");
    } else {
      nextBtnBg.setFillStyle(0x0284c7, 1);
      nextBtnBg.setStrokeStyle(2, 0x38bdf8);
      nextBtnTxt.setText("NEXT ▶");
    }

    // Render Indicator Dots
    dotsContainer.removeAll(true);
    const dotSpacing = 40;
    const startDotX = centerX - ((TUTORIAL_SLIDES.length - 1) * dotSpacing) / 2;

    for (let d = 0; d < TUTORIAL_SLIDES.length; d++) {
      const dx = startDotX + d * dotSpacing;
      const isActive = (d === currentSlide);
      const dot = scene.add.circle(dx, navY, isActive ? 10 : 6, isActive ? slideData.themeColor : 0x475569).setInteractive({ useHandCursor: true });

      if (isActive) {
        dot.setStrokeStyle(2, 0xffffff);
      }

      const slideIdx = d;
      dot.on('pointerdown', () => renderSlide(slideIdx));
      dotsContainer.add(dot);
    }
  };

  // Nav Handlers
  prevBtnBg.on('pointerdown', () => {
    if (currentSlide > 0) renderSlide(currentSlide - 1);
  });

  nextBtnBg.on('pointerdown', () => {
    if (currentSlide < TUTORIAL_SLIDES.length - 1) {
      renderSlide(currentSlide + 1);
    } else {
      destroyModal();
    }
  });

  // Keyboard Arrow Listeners
  const keyLeft = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
  const keyRight = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
  const keyEsc = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

  const leftListener = () => {
    if (currentSlide > 0) renderSlide(currentSlide - 1);
  };
  const rightListener = () => {
    if (currentSlide < TUTORIAL_SLIDES.length - 1) {
      renderSlide(currentSlide + 1);
    } else {
      destroyModal();
    }
  };

  keyLeft.on('down', leftListener);
  keyRight.on('down', rightListener);
  keyEsc.on('down', destroyModal);

  // Clean up keyboard listeners on modal destroy
  container.on('destroy', () => {
    keyLeft.off('down', leftListener);
    keyRight.off('down', rightListener);
    keyEsc.off('down', destroyModal);
  });

  // Assemble Main Container
  container.add([
    overlay,
    modalBg,
    innerOutline,
    headerBox,
    categoryTxt,
    titleTxt,
    slideCounterTxt,
    closeBtnBg,
    closeBtnTxt,
    bodyContainer,
    prevBtnBg,
    prevBtnTxt,
    nextBtnBg,
    nextBtnTxt,
    dotsContainer
  ]);

  scene.tutorialModal = container;

  // Initial render
  renderSlide(currentSlide);
}

// Backward compatibility alias for showControlsModal
export function showControlsModal(scene) {
  showTutorialSlideshowModal(scene, 0);
}

/**
 * Creates top-right action buttons (❓ Controls & 🔊/🔇 Music toggle) in any scene.
 * Keeps global sound mute state in scene.registry & scene.sound.mute across scenes.
 */
export function createTopRightBar(scene) {
  const width = GAME_CONFIG.CANVAS.WIDTH;
  const trY = 42;
  const helpIconX = width - 95;
  const musicIconX = width - 45;

  // Sync initial mute state from registry
  if (!scene.registry.has('isMuted')) {
    scene.registry.set('isMuted', false);
  }
  const isMutedInitially = !!scene.registry.get('isMuted');
  if (scene.sound) {
    scene.sound.mute = isMutedInitially;
  }

  // 1. Controls & Info Icon Button (?)
  const helpBg = scene.add.circle(helpIconX, trY, 20, 0x0f172a, 0.88).setInteractive({ useHandCursor: true });
  helpBg.setStrokeStyle(2, 0x38bdf8);
  helpBg.setDepth(2500);

  const helpTxt = scene.add.text(helpIconX, trY, "❓", { fontSize: '18px' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
  helpTxt.setDepth(2501);

  const animateHelpOver = () => {
    scene.tweens.add({ targets: [helpBg, helpTxt], scale: 1.15, duration: 100 });
    helpBg.setStrokeStyle(2.5, 0x00ffff);
  };
  const animateHelpOut = () => {
    scene.tweens.add({ targets: [helpBg, helpTxt], scale: 1.0, duration: 100 });
    helpBg.setStrokeStyle(2, 0x38bdf8);
  };

  helpBg.on('pointerover', animateHelpOver);
  helpTxt.on('pointerover', animateHelpOver);
  helpBg.on('pointerout', animateHelpOut);
  helpTxt.on('pointerout', animateHelpOut);
  helpBg.on('pointerdown', () => showTutorialSlideshowModal(scene, 0));
  helpTxt.on('pointerdown', () => showTutorialSlideshowModal(scene, 0));

  // 2. Music / Mute Toggle Speaker Icon Button (🔊 / 🔇)
  const musicBg = scene.add.circle(musicIconX, trY, 20, 0x0f172a, 0.88).setInteractive({ useHandCursor: true });
  musicBg.setDepth(2500);

  const musicTxt = scene.add.text(musicIconX, trY, isMutedInitially ? "🔇" : "🔊", { fontSize: '18px' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
  musicTxt.setDepth(2501);

  const updateMusicStyle = (muted) => {
    musicTxt.setText(muted ? "🔇" : "🔊");
    musicBg.setStrokeStyle(2, muted ? 0x64748b : 0xfacc15);
  };
  updateMusicStyle(isMutedInitially);

  const animateMusicOver = () => {
    scene.tweens.add({ targets: [musicBg, musicTxt], scale: 1.15, duration: 100 });
    musicBg.setStrokeStyle(2.5, 0xffea00);
  };
  const animateMusicOut = () => {
    scene.tweens.add({ targets: [musicBg, musicTxt], scale: 1.0, duration: 100 });
    const currentMuted = !!scene.registry.get('isMuted');
    musicBg.setStrokeStyle(2, currentMuted ? 0x64748b : 0xfacc15);
  };

  musicBg.on('pointerover', animateMusicOver);
  musicTxt.on('pointerover', animateMusicOver);
  musicBg.on('pointerout', animateMusicOut);
  musicTxt.on('pointerout', animateMusicOut);

  const toggleMute = () => {
    const nextMuted = !scene.registry.get('isMuted');
    scene.registry.set('isMuted', nextMuted);
    if (scene.sound) {
      scene.sound.mute = nextMuted;
    }
    updateMusicStyle(nextMuted);
  };

  musicBg.on('pointerdown', toggleMute);
  musicTxt.on('pointerdown', toggleMute);

  return { helpBg, helpTxt, musicBg, musicTxt };
}

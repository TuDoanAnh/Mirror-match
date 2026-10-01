import Phaser from 'phaser';

/**
 * Detects if the current device supports touch input or is a mobile/tablet browser.
 */
export function isTouchDevice(scene) {
  if (!scene || !scene.sys || !scene.sys.game) return false;
  const isTouch = scene.sys.game.device.input.touch;
  const isMobileAgent = typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isSmallScreen = typeof window !== 'undefined' && (window.innerWidth <= 1024 || window.innerHeight <= 600);
  return isTouch || isMobileAgent || isSmallScreen;
}

/**
 * Helper to find closest valid enemy (Bot, Player2, or Creep) for mobile Auto-Aiming.
 */
export function getAutoAimTarget(scene, player) {
  if (!scene || !player) return null;

  const targets = [];
  if (scene.bot && scene.bot.active && scene.bot.hp > 0) {
    targets.push(scene.bot);
  }
  if (scene.player2 && scene.player2.active && scene.player2.hp > 0) {
    targets.push(scene.player2);
  }
  if (scene.creeps) {
    scene.creeps.getChildren().forEach(c => {
      if (c.active && c.hp > 0) targets.push(c);
    });
  }

  if (targets.length === 0) return null;

  let closest = null;
  let minDist = Infinity;

  targets.forEach(t => {
    const dist = Phaser.Math.Distance.Between(player.x, player.y, t.x, t.y);
    if (dist < minDist) {
      minDist = dist;
      closest = t;
    }
  });

  return closest;
}

export class MobileControls {
  constructor(scene) {
    this.scene = scene;
    this.container = null;
    this.joystickBase = null;
    this.joystickThumb = null;
    this.joystickPointer = null;
    this.moveVector = { x: 0, y: 0 };

    this.skillButtons = {};
    this.itemButtons = [];

    // Aiming Graphic Indicator rendered on the world stage
    this.aimGraphics = scene.add.graphics().setDepth(99);

    // Multi-touch support (up to 3 pointers)
    if (scene.input && scene.input.addPointer) {
      scene.input.addPointer(3);
    }

    this.createControls();
  }

  createControls() {
    const scene = this.scene;
    const width = scene.cameras.main.width;
    const height = scene.cameras.main.height;

    this.container = scene.add.container(0, 0).setDepth(10000).setScrollFactor(0);

    // ==========================================
    // 1. DYNAMIC FLOATING VIRTUAL JOYSTICK (Landscape Bottom-Left Zone)
    // ==========================================
    const defaultJoyBaseX = 140;
    const defaultJoyBaseY = height - 140;
    const maxRadius = 60;
    const deadZone = 6;

    this.currentJoyBaseX = defaultJoyBaseX;
    this.currentJoyBaseY = defaultJoyBaseY;

    this.joystickBase = scene.add.circle(defaultJoyBaseX, defaultJoyBaseY, 65, 0x0f172a, 0.4);
    this.joystickBase.setStrokeStyle(3, 0x38bdf8, 0.6);

    this.joystickThumb = scene.add.circle(defaultJoyBaseX, defaultJoyBaseY, 28, 0x38bdf8, 0.6);
    this.joystickThumb.setStrokeStyle(2, 0xffffff, 0.8);

    this.container.add([this.joystickBase, this.joystickThumb]);

    // Update Joystick thumb position and analog movement vector calculation
    const updateJoystick = (pointer) => {
      if (!this.joystickPointer || this.joystickPointer.id !== pointer.id) return;

      const dist = Phaser.Math.Distance.Between(this.currentJoyBaseX, this.currentJoyBaseY, pointer.x, pointer.y);
      const angle = Phaser.Math.Angle.Between(this.currentJoyBaseX, this.currentJoyBaseY, pointer.x, pointer.y);

      const clampedDist = Math.min(dist, maxRadius);
      const thumbX = this.currentJoyBaseX + Math.cos(angle) * clampedDist;
      const thumbY = this.currentJoyBaseY + Math.sin(angle) * clampedDist;

      this.joystickThumb.setPosition(thumbX, thumbY);

      if (dist > deadZone) {
        const intensity = Math.min(1.0, (dist - deadZone) / (maxRadius - deadZone));
        this.moveVector.x = Math.cos(angle) * intensity;
        this.moveVector.y = Math.sin(angle) * intensity;
      } else {
        this.moveVector.x = 0;
        this.moveVector.y = 0;
      }

      if (scene.player) {
        scene.player.mobileMoveVector = this.moveVector;
      }
    };

    const resetJoystick = (pointer) => {
      if (this.joystickPointer && this.joystickPointer.id === pointer.id) {
        this.joystickPointer = null;
        this.currentJoyBaseX = defaultJoyBaseX;
        this.currentJoyBaseY = defaultJoyBaseY;

        this.joystickBase.setPosition(defaultJoyBaseX, defaultJoyBaseY);
        this.joystickThumb.setPosition(defaultJoyBaseX, defaultJoyBaseY);
        this.joystickBase.setAlpha(0.4);
        this.joystickThumb.setAlpha(0.6);

        this.moveVector.x = 0;
        this.moveVector.y = 0;
        if (scene.player) {
          scene.player.mobileMoveVector = null;
        }
      }
    };

    // Global touch listener for left-screen zone touch (Dynamic Floating Joystick)
    scene.input.on('pointerdown', (pointer) => {
      // Touch must be on the left 45% of the screen and below top bar (y > 65)
      if (pointer.x > width * 0.45 || pointer.y < 65) return;
      if (this.joystickPointer) return;

      this.joystickPointer = pointer;
      this.currentJoyBaseX = pointer.x;
      this.currentJoyBaseY = pointer.y;

      this.joystickBase.setPosition(pointer.x, pointer.y);
      this.joystickThumb.setPosition(pointer.x, pointer.y);
      this.joystickBase.setAlpha(0.85);
      this.joystickThumb.setAlpha(1.0);

      updateJoystick(pointer);
    });

    scene.input.on('pointermove', (pointer) => {
      if (this.joystickPointer && this.joystickPointer.id === pointer.id) {
        updateJoystick(pointer);
      }
    });

    scene.input.on('pointerup', (pointer) => resetJoystick(pointer));
    scene.input.on('pointerupoutside', (pointer) => resetJoystick(pointer));

    // ==========================================
    // 2. RIGHT TOUCH SKILL BUTTONS (Landscape Arc Layout)
    // ==========================================
    const heroId = (scene.player && scene.player.heroId) ? scene.player.heroId : 'ezreal';

    const skillConfigs = [
      { key: 'Q', label: 'Q', x: width - 240, y: height - 120, color: 0x38bdf8, iconKey: `icon_${heroId}_Q`, range: 500, radius: 42 },
      { key: 'E', label: 'E', x: width - 160, y: height - 210, color: 0xa855f7, iconKey: `icon_${heroId}_E`, range: 350, radius: 42 },
      { key: 'SPACE', label: 'ULT', x: width - 80, y: height - 290, color: 0xec4899, iconKey: `icon_${heroId}_SPACE`, range: 800, radius: 48 }
    ];

    skillConfigs.forEach(cfg => {
      const radius = cfg.radius;

      const btnContainer = scene.add.container(cfg.x, cfg.y);

      const btnBg = scene.add.circle(0, 0, radius, 0x0f172a, 0.88);
      btnBg.setStrokeStyle(3, cfg.color, 0.95);
      btnBg.setInteractive({ useHandCursor: true });

      let btnVisual;
      if (scene.textures.exists(cfg.iconKey)) {
        btnVisual = scene.add.image(0, 0, cfg.iconKey);
        btnVisual.setDisplaySize(radius * 1.25, radius * 1.25);
      } else {
        btnVisual = scene.add.text(0, 0, cfg.label, {
          fontSize: cfg.key === 'SPACE' ? '16px' : '18px',
          fill: '#ffffff',
          fontStyle: 'bold'
        }).setOrigin(0.5);
      }

      const badgeBg = scene.add.circle(radius - 10, -radius + 10, 10, cfg.color);
      const badgeTxt = scene.add.text(radius - 10, -radius + 10, cfg.label, {
        fontSize: '10px',
        fill: '#000000',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      const cdOverlay = scene.add.circle(0, 0, radius, 0x000000, 0.65).setVisible(false);
      const cdText = scene.add.text(0, 0, '', {
        fontSize: '14px',
        fill: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3
      }).setOrigin(0.5).setVisible(false);

      btnContainer.add([btnBg, btnVisual, badgeBg, badgeTxt, cdOverlay, cdText]);
      this.container.add(btnContainer);

      let activePointer = null;
      let isDragging = false;
      let dragAngle = 0;
      let dragDist = 0;

      btnBg.on('pointerdown', (pointer) => {
        if (cdOverlay.visible) return;
        activePointer = pointer;
        isDragging = true;
        dragDist = 0;
        if (scene.player) scene.player.isSkillAiming = true;
        scene.tweens.add({ targets: btnContainer, scale: 0.88, duration: 60 });
      });

      scene.input.on('pointermove', (pointer) => {
        if (!isDragging || !activePointer || activePointer.id !== pointer.id) return;

        dragDist = Phaser.Math.Distance.Between(cfg.x, cfg.y, pointer.x, pointer.y);
        dragAngle = Phaser.Math.Angle.Between(cfg.x, cfg.y, pointer.x, pointer.y);

        if (dragDist > 15 && scene.player && scene.player.hp > 0) {
          this.drawAimIndicator(scene.player, dragAngle, cfg.range || 500, cfg.color);
        } else {
          this.clearAimIndicator();
        }
      });

      const handlePointerUp = (pointer) => {
        if (!isDragging || !activePointer || activePointer.id !== pointer.id) return;
        isDragging = false;
        activePointer = null;
        if (scene.player) scene.player.isSkillAiming = false;
        scene.tweens.add({ targets: btnContainer, scale: 1.0, duration: 80 });
        this.clearAimIndicator();

        if (dragDist > 18) {
          this.triggerSkillAtAngle(cfg.key, dragAngle, cfg.range || 500);
        } else {
          this.triggerSkill(cfg.key);
        }
      };

      scene.input.on('pointerup', handlePointerUp);
      scene.input.on('pointerupoutside', handlePointerUp);

      this.skillButtons[cfg.key] = {
        container: btnContainer,
        bg: btnBg,
        visual: btnVisual,
        badgeBg,
        badgeTxt,
        cdOverlay,
        cdText,
        config: cfg
      };
    });

    // ==========================================
    // 3. ACTIVE ITEMS QUICK SLOT BAR (Bottom Center-Right)
    // ==========================================
    this.createItemSlotsBar(width, height);
  }

  drawAimIndicator(player, angle, maxRange, colorHex = 0x38bdf8) {
    if (!this.aimGraphics || !player) return;
    this.aimGraphics.clear();

    const startX = player.x;
    const startY = player.y;
    const targetX = startX + Math.cos(angle) * maxRange;
    const targetY = startY + Math.sin(angle) * maxRange;

    // Outer trajectory line
    this.aimGraphics.lineStyle(4, colorHex, 0.85);
    this.aimGraphics.beginPath();
    this.aimGraphics.moveTo(startX, startY);
    this.aimGraphics.lineTo(targetX, targetY);
    this.aimGraphics.strokePath();

    // Inner bright core line
    this.aimGraphics.lineStyle(2, 0xffffff, 0.95);
    this.aimGraphics.beginPath();
    this.aimGraphics.moveTo(startX, startY);
    this.aimGraphics.lineTo(targetX, targetY);
    this.aimGraphics.strokePath();

    // Targeting circle reticle at destination
    this.aimGraphics.fillStyle(colorHex, 0.35);
    this.aimGraphics.fillCircle(targetX, targetY, 24);
    this.aimGraphics.lineStyle(2, 0xffffff, 0.9);
    this.aimGraphics.strokeCircle(targetX, targetY, 24);
  }

  clearAimIndicator() {
    if (this.aimGraphics) {
      this.aimGraphics.clear();
    }
  }

  createItemSlotsBar(width, height) {
    const scene = this.scene;
    const inv = scene.registry.get('inventory') || [];

    // Centered horizontally along bottom for mobile landscape thumbs
    const totalW = 6 * 54;
    const itemStartX = (width / 2) - (totalW / 2) + 27;
    const itemY = height - 45;

    this.itemButtons = [];

    for (let i = 0; i < 6; i++) {
      const ix = itemStartX + i * 54;

      const slotContainer = scene.add.container(ix, itemY);
      const slotBg = scene.add.rectangle(0, 0, 44, 44, 0x0f172a, 0.85);
      slotBg.setStrokeStyle(1.5, 0x334155);

      const slotBadge = scene.add.text(-15, -15, `${i + 1}`, {
        fontSize: '10px',
        fill: '#94a3b8',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      let itemImg = null;
      if (inv[i] && inv[i].id) {
        const key = `item_${inv[i].id}`;
        if (scene.textures.exists(key)) {
          itemImg = scene.add.image(0, 0, key);
          itemImg.setDisplaySize(34, 34);
        }
        slotBg.setStrokeStyle(2, 0xec4899);
        slotBg.setInteractive({ useHandCursor: true });

        const slotIndex = i;
        slotBg.on('pointerdown', () => {
          scene.tweens.add({ targets: slotContainer, scale: 0.9, duration: 80, yoyo: true });
          if (scene.player) {
            scene.player.useActiveItemBySlot(slotIndex);
          }
        });
      }

      // Item Cooldown Overlay & Text
      const cdOverlay = scene.add.rectangle(0, 0, 44, 44, 0x000000, 0.65).setVisible(false);
      const cdText = scene.add.text(0, 0, '', {
        fontSize: '11px',
        fill: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0.5).setVisible(false);

      const elements = [slotBg, slotBadge];
      if (itemImg) elements.push(itemImg);
      elements.push(cdOverlay, cdText);

      slotContainer.add(elements);
      this.container.add(slotContainer);
      this.itemButtons.push({ container: slotContainer, bg: slotBg, img: itemImg, badge: slotBadge, cdOverlay, cdText, slotIndex: i, itemData: inv[i] });
    }
  }

  triggerSkillAtAngle(skillKey, angle, range = 500) {
    const scene = this.scene;
    if (!scene || !scene.player || scene.player.hp <= 0) return;

    const targetX = scene.player.x + Math.cos(angle) * range;
    const targetY = scene.player.y + Math.sin(angle) * range;

    scene.player.handleAim(targetX, targetY);
    scene.tryUsePlayerSkill(skillKey, scene.time.now, targetX, targetY);
  }

  triggerSkill(skillKey) {
    const scene = this.scene;
    if (!scene || !scene.player || scene.player.hp <= 0) return;

    // Auto-Aim targeting
    const target = getAutoAimTarget(scene, scene.player);
    let targetX, targetY;

    if (target) {
      targetX = target.x;
      targetY = target.y;
    } else {
      // If no target exists, aim in current facing direction
      const facingAngle = scene.player.aimAngle || scene.player.rotation || 0;
      targetX = scene.player.x + Math.cos(facingAngle) * 350;
      targetY = scene.player.y + Math.sin(facingAngle) * 350;
    }

    scene.player.handleAim(targetX, targetY);
    scene.tryUsePlayerSkill(skillKey, scene.time.now, targetX, targetY);
  }

  update() {
    const scene = this.scene;
    if (!scene || !scene.player) return;

    const now = scene.time.now;
    const player = scene.player;

    // Update Skill Cooldown Visual Overlays
    Object.keys(this.skillButtons).forEach(key => {
      const btn = this.skillButtons[key];
      const skill = player.skills ? player.skills[key] : null;

      if (skill && skill.cooldown && skill.lastUsed) {
        const cdRemaining = (skill.lastUsed + skill.cooldown) - now;
        if (cdRemaining > 0) {
          btn.cdOverlay.setVisible(true);
          btn.cdText.setVisible(true);
          const sec = (cdRemaining / 1000).toFixed(1);
          btn.cdText.setText(`${sec}s`);
        } else {
          if (btn.cdOverlay.visible) {
            btn.cdOverlay.setVisible(false);
            btn.cdText.setVisible(false);
            // Flash effect when coming off cooldown
            scene.tweens.add({ targets: [btn.container], scale: 1.15, duration: 100, yoyo: true });
          }
        }
      }
    });

    // Update Active Item Cooldown Overlays
    if (player.activeCooldowns) {
      this.itemButtons.forEach(slot => {
        if (slot.itemData && slot.itemData.id) {
          const itemId = slot.itemData.id;
          const cdEnd = player.activeCooldowns[itemId] || 0;
          const remaining = cdEnd - now;
          if (remaining > 0) {
            slot.cdOverlay.setVisible(true);
            slot.cdText.setVisible(true);
            slot.cdText.setText(`${Math.ceil(remaining / 1000)}s`);
          } else {
            slot.cdOverlay.setVisible(false);
            slot.cdText.setVisible(false);
          }
        }
      });
    }
  }

  destroy() {
    this.clearAimIndicator();
    if (this.aimGraphics) {
      this.aimGraphics.destroy();
      this.aimGraphics = null;
    }
    if (this.container) {
      this.container.destroy();
      this.container = null;
    }
  }
}

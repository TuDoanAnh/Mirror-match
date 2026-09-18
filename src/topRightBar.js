import { GAME_CONFIG } from './gameConfig';

/**
 * Shows the global controls & how-to-play modal in any scene.
 */
export function showControlsModal(scene) {
  if (scene.controlsModal) {
    scene.controlsModal.destroy();
    scene.controlsModal = null;
  }

  const width = GAME_CONFIG.CANVAS.WIDTH;
  const height = GAME_CONFIG.CANVAS.HEIGHT;

  const container = scene.add.container(0, 0);
  container.setDepth(4000);

  const overlay = scene.add.rectangle(0, 0, width, height, 0x000000, 0.8).setOrigin(0).setInteractive();
  const box = scene.add.rectangle(width / 2, height / 2, 600, 420, 0x0f172a, 0.98);
  box.setStrokeStyle(2, 0x38bdf8);

  const title = scene.add.text(width / 2, height / 2 - 170, "🎮 CONTROLS & HOW TO PLAY", {
    fontSize: '20px',
    fill: '#facc15',
    fontStyle: 'bold'
  }).setOrigin(0.5);

  const infoStr =
    "GAME CONTROLS:\n" +
    "• Move Character: W, A, S, D\n" +
    "• Aim Skill Direction: Mouse Cursor\n" +
    "• Q Skill: Left Mouse Click / Q Key\n" +
    "• E Skill (Dash / Utility): E Key\n" +
    "• Space Skill (Ultimate): Spacebar\n" +
    "• Active Items (HUD): Keys 1 to 6 (mapped to inventory 1-6)\n\n" +
    "GAMEPLAY TIPS:\n" +
    "• Buy items in Preparation Phase to boost Attack, HP, Armor & Crit.\n" +
    "• Use Active Items (Zhonya, Rocketbelt, Potion, QSS) strategically in battle!";

  const content = scene.add.text(width / 2 - 250, height / 2 - 110, infoStr, {
    fontSize: '13px',
    fill: '#cbd5e1',
    lineSpacing: 6
  });

  const closeBtn = scene.add.rectangle(width / 2, height / 2 + 175, 140, 36, 0xef4444).setInteractive({ useHandCursor: true });
  closeBtn.setStrokeStyle(1.5, 0xffffff);
  const closeTxt = scene.add.text(width / 2, height / 2 + 175, "CLOSE", { fontSize: '13px', fill: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);

  const destroyModal = () => {
    container.destroy();
    scene.controlsModal = null;
  };

  closeBtn.on('pointerdown', destroyModal);
  overlay.on('pointerdown', destroyModal);

  container.add([overlay, box, title, content, closeBtn, closeTxt]);
  scene.controlsModal = container;
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
  helpBg.on('pointerdown', () => showControlsModal(scene));
  helpTxt.on('pointerdown', () => showControlsModal(scene));

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

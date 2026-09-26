/**
 * Playgama Bridge SDK Integration Helper
 * Supports Playgama Bridge (https://bridge.playgama.com/v2/stable/playgama-bridge.js)
 * Supports Storage (Cloud Saves) & Rewarded/Interstitial Ads
 * Includes simulated ad & storage fallback for local testing & offline environments.
 */

let isBridgeInitialized = false;
let initPromise = null;

export async function initPlaygamaSDK() {
  if (isBridgeInitialized) return true;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    if (typeof window !== 'undefined' && window.bridge) {
      try {
        await window.bridge.initialize();
        isBridgeInitialized = true;
        console.log('Playgama Bridge SDK initialized successfully!');
        return true;
      } catch (err) {
        console.warn('Playgama Bridge SDK running in local/standalone mode. Using local fallback storage & ad simulation.');
        isBridgeInitialized = false;
        return false;
      }
    } else {
      console.log('Playgama Bridge SDK not detected in window. Fallback simulation mode enabled.');
      return false;
    }
  })();

  return initPromise;
}

/**
 * Save Game State using Playgama Bridge Storage (with localStorage backup)
 * @param {Phaser.Scene} scene - Active Phaser scene with registry
 */
export async function saveGameProgress(scene) {
  if (!scene || !scene.registry) return;

  const saveData = {
    version: 1,
    gold: scene.registry.get('gold') || 1000,
    unlockedLevel: scene.registry.get('unlockedLevel') || 1,
    selectedLevel: scene.registry.get('selectedLevel') || 1,
    selectedHero: scene.registry.get('selectedHero') || 'ezreal',
    inventory: scene.registry.get('inventory') || [],
    augments: scene.registry.get('augments') || [],
    playerStats: scene.registry.get('playerStats') || {},
    survivalLevel: scene.registry.get('survivalLevel') || 1,
    infinityScore: scene.registry.get('infinityScore') || 0,
    infinityKills: scene.registry.get('infinityKills') || 0,
    elixirBuyCount: scene.registry.get('elixirBuyCount') || 0,
    isMuted: scene.registry.get('isMuted') || false,
    updatedAt: Date.now()
  };

  // 1. Playgama Bridge Storage Save (if SDK fully initialized)
  if (isBridgeInitialized && typeof window !== 'undefined' && window.bridge && window.bridge.storage) {
    try {
      await window.bridge.storage.set('mirror_match_save', saveData);
      console.log('Game saved to Playgama Bridge Storage:', saveData);
    } catch (e) {
      console.warn('Playgama Bridge Storage save warning, using localStorage fallback:', e);
    }
  }

  // 2. Always backup to localStorage
  try {
    localStorage.setItem('mirror_match_save', JSON.stringify(saveData));
  } catch (e) {
    console.warn('localStorage save failed:', e);
  }
}

/**
 * Load Game State from Playgama Bridge Storage (or localStorage fallback)
 * @param {Phaser.Scene} scene - Active Phaser scene with registry
 */
export async function loadGameProgress(scene) {
  if (!scene || !scene.registry) return null;

  let loadedData = null;

  // 1. Try loading from Playgama Bridge Storage (if SDK fully initialized)
  if (isBridgeInitialized && typeof window !== 'undefined' && window.bridge && window.bridge.storage) {
    try {
      const data = await window.bridge.storage.get('mirror_match_save');
      if (data) {
        loadedData = typeof data === 'string' ? JSON.parse(data) : data;
        console.log('Loaded game progress from Playgama Bridge Storage:', loadedData);
      }
    } catch (e) {
      console.warn('Playgama Bridge Storage load warning:', e);
    }
  }

  // 2. Fallback to localStorage if no cloud save found
  if (!loadedData) {
    try {
      const localStr = localStorage.getItem('mirror_match_save');
      if (localStr) {
        loadedData = JSON.parse(localStr);
        console.log('Loaded game progress from localStorage:', loadedData);
      }
    } catch (e) {
      console.warn('localStorage load warning:', e);
    }
  }

  // Apply loaded data to scene registry
  if (loadedData) {
    if (typeof loadedData.gold === 'number') scene.registry.set('gold', loadedData.gold);
    if (typeof loadedData.unlockedLevel === 'number') scene.registry.set('unlockedLevel', loadedData.unlockedLevel);
    if (typeof loadedData.selectedLevel === 'number') scene.registry.set('selectedLevel', loadedData.selectedLevel);
    if (loadedData.selectedHero) scene.registry.set('selectedHero', loadedData.selectedHero);
    if (Array.isArray(loadedData.inventory)) scene.registry.set('inventory', loadedData.inventory);
    if (Array.isArray(loadedData.augments)) scene.registry.set('augments', loadedData.augments);
    if (loadedData.playerStats) scene.registry.set('playerStats', loadedData.playerStats);
    if (typeof loadedData.survivalLevel === 'number') scene.registry.set('survivalLevel', loadedData.survivalLevel);
    if (typeof loadedData.infinityScore === 'number') scene.registry.set('infinityScore', loadedData.infinityScore);
    if (typeof loadedData.infinityKills === 'number') scene.registry.set('infinityKills', loadedData.infinityKills);
    if (typeof loadedData.elixirBuyCount === 'number') scene.registry.set('elixirBuyCount', loadedData.elixirBuyCount);
    if (typeof loadedData.isMuted === 'boolean') scene.registry.set('isMuted', loadedData.isMuted);
  }

  return loadedData;
}

/**
 * Check if a saved game exists in Playgama Bridge Storage or localStorage
 * @returns {Promise<boolean>}
 */
export async function hasSavedGame() {
  if (isBridgeInitialized && typeof window !== 'undefined' && window.bridge && window.bridge.storage) {
    try {
      const data = await window.bridge.storage.get('mirror_match_save');
      if (data) return true;
    } catch (e) {
      console.warn('Playgama Storage check warning:', e);
    }
  }
  try {
    const localStr = localStorage.getItem('mirror_match_save');
    if (localStr) return true;
  } catch (e) {
    console.warn('localStorage check warning:', e);
  }
  return false;
}

/**
 * Reset Game Progress (New Game)
 * Clears cloud storage and localStorage save data and resets registry to defaults.
 * @param {Phaser.Scene} scene
 */
export async function resetGameProgress(scene) {
  if (isBridgeInitialized && typeof window !== 'undefined' && window.bridge && window.bridge.storage) {
    try {
      if (window.bridge.storage.delete) {
        await window.bridge.storage.delete('mirror_match_save');
      } else {
        await window.bridge.storage.set('mirror_match_save', null);
      }
      console.log('Game save deleted from Playgama Storage');
    } catch (e) {
      console.warn('Playgama Storage delete warning:', e);
    }
  }

  try {
    localStorage.removeItem('mirror_match_save');
    console.log('Game save removed from localStorage');
  } catch (e) {
    console.warn('localStorage removal warning:', e);
  }

  if (scene && scene.registry) {
    scene.registry.set('gold', 1000);
    scene.registry.set('unlockedLevel', 1);
    scene.registry.set('selectedLevel', 1);
    scene.registry.set('selectedHero', 'ezreal');
    scene.registry.set('inventory', []);
    scene.registry.set('augments', []);
    scene.registry.set('playerStats', {
      bonusDamage: 0, bonusSpeed: 0, bonusHP: 0, cdr: 0,
      armor: 0, lifesteal: 0, critChance: 0, armorPen: 0
    });
    scene.registry.set('survivalLevel', 1);
    scene.registry.set('infinityScore', 0);
    scene.registry.set('infinityKills', 0);
    scene.registry.set('elixirBuyCount', 0);
  }
}

/**
 * Show Rewarded Ad
 * @param {Phaser.Scene} scene - Active Phaser scene for rendering simulated ad if bridge unavailable
 * @param {string} placementName - Placement identifier (e.g. 'get_gold', 'revive_rebattle')
 * @returns {Promise<boolean>} - Resolves to true if user completed watching ad and earned reward
 */
export function showRewardedAd(scene, placementName = 'rewarded_ad') {
  return new Promise((resolve) => {
    // If real Playgama Bridge SDK is active and initialized in browser environment
    if (isBridgeInitialized && typeof window !== 'undefined' && window.bridge && window.bridge.advertisement) {
      let isRewarded = false;

      const stateHandler = (state) => {
        if (state === 'rewarded') {
          isRewarded = true;
        } else if (state === 'closed' || state === 'failed') {
          if (window.bridge.advertisement.off) {
            window.bridge.advertisement.off('rewarded_state_changed', stateHandler);
          }
          resolve(isRewarded);
        }
      };

      try {
        if (window.bridge.advertisement.on) {
          window.bridge.advertisement.on('rewarded_state_changed', stateHandler);
        }
        window.bridge.advertisement.showRewarded(placementName);
        return;
      } catch (e) {
        console.warn('Playgama Bridge showRewarded error, using fallback simulation:', e);
      }
    }

    // --- FALLBACK AD SIMULATION MODAL (For local testing & platforms without active Bridge) ---
    showSimulatedAdModal(scene, placementName, resolve);
  });
}

/**
 * Show Interstitial Ad (Level transitions, game over natural breaks)
 * @param {string} placementName
 */
export function showInterstitialAd(placementName = 'interstitial') {
  if (isBridgeInitialized && typeof window !== 'undefined' && window.bridge && window.bridge.advertisement) {
    try {
      window.bridge.advertisement.showInterstitial(placementName);
    } catch (e) {
      console.warn('Playgama showInterstitial error:', e);
    }
  }
}

/**
 * Renders an interactive simulated advertisement modal overlay for testing
 */
function showSimulatedAdModal(scene, placementName, resolve) {
  if (!scene || !scene.add) {
    resolve(true);
    return;
  }

  const width = scene.cameras.main.width || 1536;
  const height = scene.cameras.main.height || 1024;
  const centerX = width / 2;
  const centerY = height / 2;

  const modalContainer = scene.add.container(0, 0).setDepth(9999).setScrollFactor(0);

  // Dark Overlay
  const bgOverlay = scene.add.rectangle(0, 0, width, height, 0x030712, 0.95).setOrigin(0).setInteractive();

  // Ad Card Box
  const adBox = scene.add.rectangle(centerX, centerY, 560, 360, 0x0f172a, 0.98);
  adBox.setStrokeStyle(3, 0xfacc15);

  // Ad Header
  const titleTxt = scene.add.text(centerX, centerY - 130, "📺 PLAYGAMA SPONSORED ADVERTISEMENT", {
    fontSize: '18px',
    fill: '#fde047',
    fontStyle: 'bold',
    stroke: '#000000',
    strokeThickness: 4
  }).setOrigin(0.5);

  const subTxt = scene.add.text(centerX, centerY - 90, `Placement: ${placementName.toUpperCase()} • Watch to receive reward!`, {
    fontSize: '13px',
    fill: '#94a3b8'
  }).setOrigin(0.5);

  // Video Mock Screen Graphic
  const screenGfx = scene.add.rectangle(centerX, centerY - 10, 480, 120, 0x1e293b);
  screenGfx.setStrokeStyle(1.5, 0x3b82f6);

  const playIcon = scene.add.text(centerX, centerY - 10, "▶️ PLAYING VIDEO AD...", {
    fontSize: '16px',
    fill: '#38bdf8',
    fontStyle: 'bold'
  }).setOrigin(0.5);

  // Progress Bar Container
  const barWidth = 440;
  const barHeight = 14;
  const barBg = scene.add.rectangle(centerX, centerY + 75, barWidth, barHeight, 0x334155).setOrigin(0.5);
  const barFill = scene.add.rectangle(centerX - barWidth / 2, centerY + 75, 0, barHeight, 0x22c55e).setOrigin(0, 0.5);

  // Timer Countdown Text
  let countdownSec = 3;
  const timerTxt = scene.add.text(centerX, centerY + 115, `Reward in ${countdownSec} seconds...`, {
    fontSize: '15px',
    fill: '#ffffff',
    fontStyle: 'bold'
  }).setOrigin(0.5);

  modalContainer.add([bgOverlay, adBox, titleTxt, subTxt, screenGfx, playIcon, barBg, barFill, timerTxt]);

  // Animate progress bar over 3 seconds
  scene.tweens.add({
    targets: barFill,
    width: barWidth,
    duration: 3000,
    ease: 'Linear'
  });

  const countdownEvent = scene.time.addEvent({
    delay: 1000,
    repeat: 2,
    callback: () => {
      countdownSec--;
      if (countdownSec > 0) {
        timerTxt.setText(`Reward in ${countdownSec} seconds...`);
      } else {
        timerTxt.setText("🎉 REWARD GRANTED!");
        timerTxt.setColor('#34d399');
      }
    }
  });

  // Finish after 3.2 seconds
  scene.time.delayedCall(3200, () => {
    countdownEvent.remove();
    modalContainer.destroy();
    resolve(true);
  });
}

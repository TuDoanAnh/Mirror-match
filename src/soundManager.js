// Import Background Music
import bgMusicAudio from './assets/music/Background.mp3';

// Import Ezreal SFX
import ezrealQAudio from './assets/sfx/Ezreal/Q-sfx.mp3';
import ezrealEAudio from './assets/sfx/Ezreal/E-sfx.mp3';
import ezrealSpaceAudio from './assets/sfx/Ezreal/Space-sfx.mp3';
import ezrealHitAudio from './assets/sfx/Ezreal/Hit-sfx.mp3';

// Import Lux SFX
import luxQAudio from './assets/sfx/Lux/Q-sfx.ogg';
import luxEAudio from './assets/sfx/Lux/E-sfx.ogg';
import luxSpaceAudio from './assets/sfx/Lux/Space-sfx.mp3';

// Import Zed SFX
import zedQAudio from './assets/sfx/Zed/Q_Zed.mp3';
import zedE1Audio from './assets/sfx/Zed/E1_Zed.mp3';
import zedE2Audio from './assets/sfx/Zed/E2_Zed.mp3';
import zedSpaceAudio from './assets/sfx/Zed/Space_Zed.mp3';
import zedDeathMarkAudio from './assets/sfx/Zed/DeathMark_Zed.mp3';
import zedHitAudio from './assets/sfx/Zed/Hit_Zed.mp3';

// Import Riven SFX
import rivenQ1Q2Audio from './assets/sfx/Riven/Q1_Q2_Riven.mp3';
import rivenQ3Audio from './assets/sfx/Riven/Q3_Riven.mp3';
import rivenEAudio from './assets/sfx/Riven/E_Riven.mp3';
import rivenSpaceAudio from './assets/sfx/Riven/Space_Riven.mp3';
import rivenHitAudio from './assets/sfx/Riven/Hit_Riven.mp3';

// Import Jinx SFX
import jinxQAudio from './assets/sfx/Jinx/Q_Jinx.mp3';
import jinxQHitAudio from './assets/sfx/Jinx/Q_Hit_Jinx.mp3';
import jinxEAudio from './assets/sfx/Jinx/E_Jinx.mp3';
import jinxRAudio from './assets/sfx/Jinx/R_Jinx.mp3';
import jinxRHitAudio from './assets/sfx/Jinx/R_Hit_Jinx.mp3';

export const SFX_KEYS = {
  ezreal: {
    Q: 'ezreal_sfx_Q',
    E: 'ezreal_sfx_E',
    SPACE: 'ezreal_sfx_SPACE',
    Hit: 'ezreal_sfx_Hit'
  },
  jinx: {
    Q: 'jinx_sfx_Q',
    E: 'jinx_sfx_E',
    SPACE: 'jinx_sfx_SPACE',
    Hit: 'jinx_sfx_QHit'
  },
  lux: {
    Q: 'lux_sfx_Q',
    E: 'lux_sfx_E',
    SPACE: 'lux_sfx_SPACE',
    Hit: 'ezreal_sfx_Hit'
  },
  zed: {
    Q: 'zed_sfx_Q',
    E: 'zed_sfx_E1',
    SPACE: 'zed_sfx_SPACE',
    Hit: 'zed_sfx_Hit'
  },
  riven: {
    Q: 'riven_sfx_Q1Q2',
    E: 'riven_sfx_E',
    SPACE: 'riven_sfx_SPACE',
    Hit: 'riven_sfx_Hit'
  }
};

export function preloadCharacterSFX(scene) {
  if (!scene || !scene.load) return;

  // Background Music
  if (!scene.cache.audio.exists('bg_prep_music')) {
    scene.load.audio('bg_prep_music', bgMusicAudio);
  }

  // Ezreal
  if (!scene.cache.audio.exists('ezreal_sfx_Q')) scene.load.audio('ezreal_sfx_Q', ezrealQAudio);
  if (!scene.cache.audio.exists('ezreal_sfx_E')) scene.load.audio('ezreal_sfx_E', ezrealEAudio);
  if (!scene.cache.audio.exists('ezreal_sfx_SPACE')) scene.load.audio('ezreal_sfx_SPACE', ezrealSpaceAudio);
  if (!scene.cache.audio.exists('ezreal_sfx_Hit')) scene.load.audio('ezreal_sfx_Hit', ezrealHitAudio);

  // Lux
  if (!scene.cache.audio.exists('lux_sfx_Q')) scene.load.audio('lux_sfx_Q', luxQAudio);
  if (!scene.cache.audio.exists('lux_sfx_E')) scene.load.audio('lux_sfx_E', luxEAudio);
  if (!scene.cache.audio.exists('lux_sfx_SPACE')) scene.load.audio('lux_sfx_SPACE', luxSpaceAudio);

  // Zed
  if (!scene.cache.audio.exists('zed_sfx_Q')) scene.load.audio('zed_sfx_Q', zedQAudio);
  if (!scene.cache.audio.exists('zed_sfx_E1')) scene.load.audio('zed_sfx_E1', zedE1Audio);
  if (!scene.cache.audio.exists('zed_sfx_E2')) scene.load.audio('zed_sfx_E2', zedE2Audio);
  if (!scene.cache.audio.exists('zed_sfx_SPACE')) scene.load.audio('zed_sfx_SPACE', zedSpaceAudio);
  if (!scene.cache.audio.exists('zed_sfx_DeathMark')) scene.load.audio('zed_sfx_DeathMark', zedDeathMarkAudio);
  if (!scene.cache.audio.exists('zed_sfx_Hit')) scene.load.audio('zed_sfx_Hit', zedHitAudio);

  // Riven
  if (!scene.cache.audio.exists('riven_sfx_Q1Q2')) scene.load.audio('riven_sfx_Q1Q2', rivenQ1Q2Audio);
  if (!scene.cache.audio.exists('riven_sfx_Q3')) scene.load.audio('riven_sfx_Q3', rivenQ3Audio);
  if (!scene.cache.audio.exists('riven_sfx_E')) scene.load.audio('riven_sfx_E', rivenEAudio);
  if (!scene.cache.audio.exists('riven_sfx_SPACE')) scene.load.audio('riven_sfx_SPACE', rivenSpaceAudio);
  if (!scene.cache.audio.exists('riven_sfx_Hit')) scene.load.audio('riven_sfx_Hit', rivenHitAudio);

  // Jinx
  if (!scene.cache.audio.exists('jinx_sfx_Q')) scene.load.audio('jinx_sfx_Q', jinxQAudio);
  if (!scene.cache.audio.exists('jinx_sfx_QHit')) scene.load.audio('jinx_sfx_QHit', jinxQHitAudio);
  if (!scene.cache.audio.exists('jinx_sfx_E')) scene.load.audio('jinx_sfx_E', jinxEAudio);
  if (!scene.cache.audio.exists('jinx_sfx_SPACE')) scene.load.audio('jinx_sfx_SPACE', jinxRAudio);
  if (!scene.cache.audio.exists('jinx_sfx_RHit')) scene.load.audio('jinx_sfx_RHit', jinxRHitAudio);
}

export const HERO_VOLUME_MULTIPLIERS = {
  ezreal: 0.4,
  lux: 0.7,
  zed: 2.0,
  riven: 1.5,
  jinx: 2.0
};

// Custom volume override for specific skills (e.g. jinx_E, zed_Q, etc.)
export const SKILL_VOLUME_OVERRIDES = {
  jinx_E: 0.8 // Âm lượng riêng cho E của Jinx (chỉnh từ 0.0 tới 2.0)
};

export function playSkillSFX(scene, heroId, skillKey, extraData = null, customVol = null) {
  if (!scene || !scene.sound) return;

  let key = null;
  if (heroId === 'riven' && skillKey === 'Q') {
    key = (extraData && extraData.comboStep === 3) ? 'riven_sfx_Q3' : 'riven_sfx_Q1Q2';
  } else if (heroId === 'zed' && skillKey === 'E') {
    key = (extraData && extraData.isSwap) ? 'zed_sfx_E2' : 'zed_sfx_E1';
  } else {
    const heroSFX = SFX_KEYS[heroId] || SFX_KEYS.ezreal;
    key = heroSFX ? heroSFX[skillKey] : null;
  }

  let vol = HERO_VOLUME_MULTIPLIERS[heroId] || 1.0;
  const overrideKey = `${heroId}_${skillKey}`;
  if (customVol !== null && customVol !== undefined) {
    vol = customVol;
  } else if (SKILL_VOLUME_OVERRIDES[overrideKey] !== undefined) {
    vol = SKILL_VOLUME_OVERRIDES[overrideKey];
  }

  if (key && scene.cache.audio.exists(key)) {
    scene.sound.play(key, { volume: Math.min(2.0, vol) });
  }
}

export function playHitSFX(scene, heroId) {
  if (!scene || !scene.sound) return;
  const heroSFX = SFX_KEYS[heroId] || SFX_KEYS.ezreal;
  const key = heroSFX ? heroSFX.Hit : 'ezreal_sfx_Hit';

  let vol = (HERO_VOLUME_MULTIPLIERS[heroId] || 1.0) * 0.85;

  // Specific lower hit volume for Ezreal and Lux as requested
  if (heroId === 'ezreal') {
    vol = 0.22;
  } else if (heroId === 'lux') {
    vol = 0.28;
  }

  if (key && scene.cache.audio.exists(key)) {
    scene.sound.play(key, { volume: Math.min(2.0, vol) });
  }
}

export function playCustomSFX(scene, key, volume = 1.0, rate = 1.0) {
  if (!scene || !scene.sound) return;
  if (key && scene.cache.audio.exists(key)) {
    scene.sound.play(key, { volume: Math.min(2.0, volume), rate });
  }
}

export function playZedDeathMarkSFX(scene, durationMs = 4150) {
  if (!scene || !scene.sound) return null;
  const key = 'zed_sfx_DeathMark';
  if (!scene.cache.audio.exists(key)) return null;

  const targetDurationSec = durationMs / 1000;
  let audioDuration = 3.15;

  try {
    const tempSound = scene.sound.add(key);
    if (tempSound && tempSound.duration && tempSound.duration > 0) {
      audioDuration = tempSound.duration;
    }
    tempSound.destroy();
  } catch (e) { }

  let rate = audioDuration / targetDurationSec;
  if (rate <= 0 || isNaN(rate)) rate = 1.0;

  const soundInstance = scene.sound.add(key, { volume: 2.0, rate: rate });
  soundInstance.play();
  return soundInstance;
}

export function stopCustomSFX(scene, key) {
  if (!scene || !scene.sound) return;
  if (key && scene.cache.audio.exists(key)) {
    scene.sound.stopByKey(key);
  }
}

export function playPreparationBGM(scene) {
  if (!scene || !scene.sound) return;
  if (!scene.cache.audio.exists('bg_prep_music')) return;

  const startMusic = () => {
    let existing = scene.sound.get('bg_prep_music');
    if (!existing) {
      existing = scene.sound.add('bg_prep_music', { loop: true, volume: 1 });
    }
    if (!existing.isPlaying) {
      existing.play({ loop: true, volume: 1 });
    }
  };

  startMusic();

  if (scene.sound.context && scene.sound.context.state === 'suspended') {
    const unlockHandler = () => {
      if (scene.sound.context.state === 'suspended') {
        scene.sound.context.resume().then(() => startMusic());
      } else {
        startMusic();
      }
    };
    scene.input.once('pointerdown', unlockHandler);
  }
}

export function stopPreparationBGM(scene) {
  if (!scene || !scene.sound) return;
  const existing = scene.sound.get('bg_prep_music');
  if (existing && existing.isPlaying) {
    existing.stop();
  }
}

export function playBattleBGM(scene) {
  if (!scene || !scene.sound) return;
  if (!scene.cache.audio.exists('bg_prep_music')) return;

  let existing = scene.sound.get('bg_prep_music');
  if (!existing) {
    existing = scene.sound.add('bg_prep_music', { loop: true, volume: 0.75 });
  }
  if (!existing.isPlaying) {
    existing.play({ loop: true, volume: 0.75 });
  }
}

export function stopBattleBGM(scene) {
  if (!scene || !scene.sound) return;
  const existing = scene.sound.get('bg_prep_music');
  if (existing && existing.isPlaying) {
    existing.stop();
  }
}

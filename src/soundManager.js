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
    Hit: 'jinx_sfx_Hit'
  },
  lux: {
    Q: 'lux_sfx_Q',
    E: 'lux_sfx_E',
    SPACE: 'lux_sfx_SPACE',
    Hit: 'lux_sfx_Hit'
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

  // Jinx (Fallback to Ezreal SFX as requested)
  if (!scene.cache.audio.exists('jinx_sfx_Q')) scene.load.audio('jinx_sfx_Q', ezrealQAudio);
  if (!scene.cache.audio.exists('jinx_sfx_E')) scene.load.audio('jinx_sfx_E', ezrealEAudio);
  if (!scene.cache.audio.exists('jinx_sfx_SPACE')) scene.load.audio('jinx_sfx_SPACE', ezrealSpaceAudio);
  if (!scene.cache.audio.exists('jinx_sfx_Hit')) scene.load.audio('jinx_sfx_Hit', ezrealHitAudio);

  // Lux
  if (!scene.cache.audio.exists('lux_sfx_Q')) scene.load.audio('lux_sfx_Q', luxQAudio);
  if (!scene.cache.audio.exists('lux_sfx_E')) scene.load.audio('lux_sfx_E', luxEAudio);
  if (!scene.cache.audio.exists('lux_sfx_SPACE')) scene.load.audio('lux_sfx_SPACE', luxSpaceAudio);
  if (!scene.cache.audio.exists('lux_sfx_Hit')) scene.load.audio('lux_sfx_Hit', ezrealHitAudio);
}

export function playSkillSFX(scene, heroId, skillKey) {
  if (!scene || !scene.sound) return;
  const heroSFX = SFX_KEYS[heroId] || SFX_KEYS.ezreal;
  const key = heroSFX[skillKey];
  if (key && scene.cache.audio.exists(key)) {
    scene.sound.play(key, { volume: 0.6 });
  }
}

export function playHitSFX(scene, heroId) {
  if (!scene || !scene.sound) return;
  const heroSFX = SFX_KEYS[heroId] || SFX_KEYS.ezreal;
  const key = heroSFX.Hit;
  if (key && scene.cache.audio.exists(key)) {
    scene.sound.play(key, { volume: 0.5 });
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

  // If audio context is suspended by browser autoplay policy, resume on first pointer click
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


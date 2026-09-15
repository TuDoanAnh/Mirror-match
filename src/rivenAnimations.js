import rivenWave1Url from './assets/image/riven_r_wave1.png';
import rivenWave2Url from './assets/image/riven_r_wave2.png';
import rivenWave3Url from './assets/image/riven_r_wave3.png';

export function preloadRivenSkillAssets(scene) {
  if (!scene.textures.exists('riven_r_wave1')) {
    scene.load.image('riven_r_wave1', rivenWave1Url);
  }
  if (!scene.textures.exists('riven_r_wave2')) {
    scene.load.image('riven_r_wave2', rivenWave2Url);
  }
  if (!scene.textures.exists('riven_r_wave3')) {
    scene.load.image('riven_r_wave3', rivenWave3Url);
  }
}

export function createRivenSkillAnimations(scene) {
  // Riven skill animation hooks if needed in the future
}

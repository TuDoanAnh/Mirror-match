import { preloadCharacterAssets, createCharacterAnimations } from './characterAnimations';
import luxQSkillUrl from './assets/image/lux_q_single.png';
import luxRootSkillUrl from './assets/image/lux_root_spritesheet.png';
import luxSpaceBeamUrl from './assets/image/lux_space_beam.png';

export function preloadLuxAssets(scene) {
  preloadCharacterAssets(scene);

  if (!scene.textures.exists('lux_q_skill')) {
    scene.load.image('lux_q_skill', luxQSkillUrl);
  }
  if (!scene.textures.exists('lux_root_skill')) {
    scene.load.spritesheet('lux_root_skill', luxRootSkillUrl, { frameWidth: 210, frameHeight: 210 });
  }
  if (!scene.textures.exists('lux_space_beam')) {
    scene.load.image('lux_space_beam', luxSpaceBeamUrl);
  }
}

export function createLuxAnimations(scene) {
  createCharacterAnimations(scene);

  if (!scene.anims.exists('lux_root_anim') && scene.textures.exists('lux_root_skill')) {
    scene.anims.create({
      key: 'lux_root_anim',
      frames: scene.anims.generateFrameNumbers('lux_root_skill', { start: 0, end: 7 }),
      frameRate: 15,
      repeat: -1
    });
  }
}


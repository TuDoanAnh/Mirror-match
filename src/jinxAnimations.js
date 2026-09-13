import { preloadCharacterAssets, createCharacterAnimations } from './characterAnimations';
import jinxRocketUrl from './assets/image/jinx_rocket_projectile.png';
import jinxSpaceRocketUrl from './assets/image/jinx_space_rocket.png';
import jinxExplosionUrl from './assets/image/jinx_explosion_spritesheet.png';

export function preloadJinxAssets(scene) {
  preloadCharacterAssets(scene);

  if (!scene.textures.exists('jinx_q_skill')) {
    scene.load.image('jinx_q_skill', jinxRocketUrl);
  }
  if (!scene.textures.exists('jinx_space_skill')) {
    scene.load.image('jinx_space_skill', jinxSpaceRocketUrl);
  }
  if (!scene.textures.exists('jinx_explosion_spritesheet')) {
    scene.load.spritesheet('jinx_explosion_spritesheet', jinxExplosionUrl, { frameWidth: 220, frameHeight: 220 });
  }
}

export function createJinxAnimations(scene) {
  createCharacterAnimations(scene);

  if (!scene.anims.exists('jinx_explosion_anim') && scene.textures.exists('jinx_explosion_spritesheet')) {
    scene.anims.create({
      key: 'jinx_explosion_anim',
      frames: scene.anims.generateFrameNumbers('jinx_explosion_spritesheet', { start: 0, end: 5 }),
      frameRate: 18,
      repeat: 0
    });
  }
}

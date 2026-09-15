import zedQSkillUrl from './assets/image/zed_q_spritesheet.png';

export function preloadZedSkillAssets(scene) {
  if (!scene.textures.exists('zed_q_skill')) {
    scene.load.spritesheet('zed_q_skill', zedQSkillUrl, { frameWidth: 180, frameHeight: 180 });
  }
}

export function createZedSkillAnimations(scene) {
  if (!scene.anims.exists('zed_q_anim') && scene.textures.exists('zed_q_skill')) {
    scene.anims.create({
      key: 'zed_q_anim',
      frames: scene.anims.generateFrameNumbers('zed_q_skill', { start: 0, end: 3 }),
      frameRate: 20,
      repeat: -1
    });
  }
}

import ezrealQSkillUrl from './assets/image/ezreal_q_spritesheet.png';
import ezrealSpaceSkillUrl from './assets/image/ezreal_space_spritesheet.png';

export function preloadEzrealSkillAssets(scene) {
  if (!scene.textures.exists('ezreal_q_skill')) {
    scene.load.spritesheet('ezreal_q_skill', ezrealQSkillUrl, { frameWidth: 204, frameHeight: 64 });
  }
  if (!scene.textures.exists('ezreal_space_skill')) {
    scene.load.spritesheet('ezreal_space_skill', ezrealSpaceSkillUrl, { frameWidth: 424, frameHeight: 208 });
  }
}

export function createEzrealSkillAnimations(scene) {
  if (!scene.anims.exists('ezreal_q_anim') && scene.textures.exists('ezreal_q_skill')) {
    scene.anims.create({
      key: 'ezreal_q_anim',
      frames: scene.anims.generateFrameNumbers('ezreal_q_skill', { start: 0, end: 4 }),
      frameRate: 20,
      repeat: 0 // Plays F12 -> F8 once and holds at F8 Max size!
    });
  }
  if (!scene.anims.exists('ezreal_space_anim') && scene.textures.exists('ezreal_space_skill')) {
    scene.anims.create({
      key: 'ezreal_space_anim',
      frames: scene.anims.generateFrameNumbers('ezreal_space_skill', { start: 0, end: 6 }),
      frameRate: 18,
      repeat: 0 // Plays F12 -> F6 once and holds at F6 Max size!
    });
  }
}

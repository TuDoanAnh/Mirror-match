import luxSpritesheetUrl from './assets/image/lux_spritesheet.png';

export function preloadLuxAssets(scene) {
  if (!scene.textures.exists('lux_spritesheet')) {
    scene.load.spritesheet('lux_spritesheet', luxSpritesheetUrl, {
      frameWidth: 48,
      frameHeight: 56
    });
  }
}

export function createLuxAnimations(scene) {
  if (!scene.anims) return;
  if (scene.anims.exists('lux_idle')) return;

  scene.anims.create({
    key: 'lux_idle',
    frames: scene.anims.generateFrameNumbers('lux_spritesheet', { start: 0, end: 3 }),
    frameRate: 6,
    repeat: -1
  });

  scene.anims.create({
    key: 'lux_walk_down',
    frames: scene.anims.generateFrameNumbers('lux_spritesheet', { start: 4, end: 7 }),
    frameRate: 8,
    repeat: -1
  });

  scene.anims.create({
    key: 'lux_walk_up',
    frames: scene.anims.generateFrameNumbers('lux_spritesheet', { start: 8, end: 11 }),
    frameRate: 8,
    repeat: -1
  });

  scene.anims.create({
    key: 'lux_walk_left',
    frames: scene.anims.generateFrameNumbers('lux_spritesheet', { start: 12, end: 15 }),
    frameRate: 8,
    repeat: -1
  });

  scene.anims.create({
    key: 'lux_walk_right',
    frames: scene.anims.generateFrameNumbers('lux_spritesheet', { start: 16, end: 19 }),
    frameRate: 8,
    repeat: -1
  });

  scene.anims.create({
    key: 'lux_hurt',
    frames: scene.anims.generateFrameNumbers('lux_spritesheet', { start: 20, end: 23 }),
    frameRate: 10,
    repeat: 0
  });
}

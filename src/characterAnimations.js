import luxSpritesheetUrl from './assets/image/lux_spritesheet.png';
import ezrealSpritesheetUrl from './assets/image/ezreal_spritesheet.png';
import jinxSpritesheetUrl from './assets/image/jinx_spritesheet.png';
import creepSpritesheetUrl from './assets/image/creep_spritesheet.png';
import rivenSpritesheetUrl from './assets/image/riven_spritesheet.png';
import zedSpritesheetUrl from './assets/image/zed_spritesheet.png';

const HERO_URLS = {
  lux: luxSpritesheetUrl,
  ezreal: ezrealSpritesheetUrl,
  jinx: jinxSpritesheetUrl,
  riven: rivenSpritesheetUrl,
  zed: zedSpritesheetUrl,
  creep: creepSpritesheetUrl
};

export function preloadCharacterAssets(scene) {
  Object.keys(HERO_URLS).forEach(heroId => {
    const key = `${heroId}_spritesheet`;
    if (!scene.textures.exists(key)) {
      scene.load.spritesheet(key, HERO_URLS[heroId], {
        frameWidth: 48,
        frameHeight: 56
      });
    }
  });
}

export function createCharacterAnimations(scene) {
  if (!scene.anims) return;

  const heroes = ['ezreal', 'lux', 'jinx', 'riven', 'zed'];
  heroes.forEach(heroId => {
    const keyPrefix = heroId;
    const sheetKey = `${heroId}_spritesheet`;

    if (scene.anims.exists(`${keyPrefix}_idle`)) return;

    scene.anims.create({
      key: `${keyPrefix}_idle`,
      frames: scene.anims.generateFrameNumbers(sheetKey, { start: 0, end: 3 }),
      frameRate: 6,
      repeat: -1
    });

    scene.anims.create({
      key: `${keyPrefix}_walk_down`,
      frames: scene.anims.generateFrameNumbers(sheetKey, { start: 4, end: 7 }),
      frameRate: 8,
      repeat: -1
    });

    scene.anims.create({
      key: `${keyPrefix}_walk_up`,
      frames: scene.anims.generateFrameNumbers(sheetKey, { start: 8, end: 11 }),
      frameRate: 8,
      repeat: -1
    });

    scene.anims.create({
      key: `${keyPrefix}_walk_left`,
      frames: scene.anims.generateFrameNumbers(sheetKey, { start: 12, end: 15 }),
      frameRate: 8,
      repeat: -1
    });

    scene.anims.create({
      key: `${keyPrefix}_walk_right`,
      frames: scene.anims.generateFrameNumbers(sheetKey, { start: 16, end: 19 }),
      frameRate: 8,
      repeat: -1
    });

    scene.anims.create({
      key: `${keyPrefix}_hurt`,
      frames: scene.anims.generateFrameNumbers(sheetKey, { start: 20, end: 23 }),
      frameRate: 10,
      repeat: 0
    });
  });

  // Create Creep (Frog) Animations
  if (!scene.anims.exists('creep_idle')) {
    scene.anims.create({
      key: 'creep_idle',
      frames: scene.anims.generateFrameNumbers('creep_spritesheet', { start: 0, end: 4 }),
      frameRate: 6,
      repeat: -1
    });

    scene.anims.create({
      key: 'creep_walk_down',
      frames: scene.anims.generateFrameNumbers('creep_spritesheet', { start: 6, end: 10 }),
      frameRate: 8,
      repeat: -1
    });

    scene.anims.create({
      key: 'creep_walk_up',
      frames: scene.anims.generateFrameNumbers('creep_spritesheet', { start: 12, end: 17 }),
      frameRate: 8,
      repeat: -1
    });

    scene.anims.create({
      key: 'creep_walk_left',
      frames: scene.anims.generateFrameNumbers('creep_spritesheet', { start: 18, end: 22 }),
      frameRate: 8,
      repeat: -1
    });

    scene.anims.create({
      key: 'creep_walk_right',
      frames: scene.anims.generateFrameNumbers('creep_spritesheet', { start: 24, end: 28 }),
      frameRate: 8,
      repeat: -1
    });

    scene.anims.create({
      key: 'creep_hurt',
      frames: scene.anims.generateFrameNumbers('creep_spritesheet', { start: 30, end: 34 }),
      frameRate: 10,
      repeat: 0
    });
  }
}

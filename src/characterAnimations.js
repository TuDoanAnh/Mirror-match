import luxSpritesheetUrl from './assets/image/lux_spritesheet.png';
import ezrealSpritesheetUrl from './assets/image/ezreal_spritesheet.png';
import jinxSpritesheetUrl from './assets/image/jinx_spritesheet.png';

const HERO_URLS = {
  lux: luxSpritesheetUrl,
  ezreal: ezrealSpritesheetUrl,
  jinx: jinxSpritesheetUrl
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

  const heroes = ['ezreal', 'lux', 'jinx'];
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
}

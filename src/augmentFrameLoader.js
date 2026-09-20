import silverAugmentUrl from './assets/image/Silver_augment.png';
import goldAugmentUrl from './assets/image/Gold_augment.png';
import diamondAugmentUrl from './assets/image/Diamond_augment.png';

export function preloadAugmentFrameAssets(scene) {
  if (!scene.textures.exists('frame_augment_silver')) {
    scene.load.image('frame_augment_silver', silverAugmentUrl);
  }
  if (!scene.textures.exists('frame_augment_gold')) {
    scene.load.image('frame_augment_gold', goldAugmentUrl);
  }
  if (!scene.textures.exists('frame_augment_diamond')) {
    scene.load.image('frame_augment_diamond', diamondAugmentUrl);
  }
}

export function getAugmentFrameKey(aug) {
  const tier = (aug && aug.tier) ? aug.tier.toLowerCase() : 'silver';
  if (tier === 'diamond' || tier === 'prismatic') return 'frame_augment_diamond';
  if (tier === 'gold') return 'frame_augment_gold';
  return 'frame_augment_silver';
}

export function getAugmentTierBadgeText(aug) {
  const tier = (aug && aug.tier) ? aug.tier.toUpperCase() : 'SILVER';
  if (tier === 'DIAMOND' || tier === 'PRISMATIC') return '💎 DIAMOND';
  if (tier === 'GOLD') return '🥇 GOLD';
  return '🥈 SILVER';
}

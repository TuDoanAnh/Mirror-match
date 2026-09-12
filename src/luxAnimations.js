import { preloadCharacterAssets, createCharacterAnimations } from './characterAnimations';

export function preloadLuxAssets(scene) {
  preloadCharacterAssets(scene);
}

export function createLuxAnimations(scene) {
  createCharacterAnimations(scene);
}

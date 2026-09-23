import doransBladeUrl from './assets/image/item_doransBlade.png';
import bootsUrl from './assets/image/item_boots.png';
import longSwordUrl from './assets/image/item_longSword.png';
import clothArmorUrl from './assets/image/item_clothArmor.png';
import berserkersUrl from './assets/image/item_berserkers.png';
import vampScepterUrl from './assets/image/item_vampScepter.png';
import lastWhisperUrl from './assets/image/item_lastWhisper.png';
import cloakAgilityUrl from './assets/image/item_cloakAgility.png';
import fiendishCodexUrl from './assets/image/item_fiendishCodex.png';
import infinityEdgeUrl from './assets/image/item_infinityEdge.png';
import bloodthirsterUrl from './assets/image/item_bloodthirster.png';
import lordDominikUrl from './assets/image/item_lordDominik.png';
import thornmailUrl from './assets/image/item_thornmail.png';
import trinityForceUrl from './assets/image/item_trinityForce.png';
import navoriUrl from './assets/image/item_navori.png';
import healthPotionUrl from './assets/image/item_healthPotion.png';
import zhonyaUrl from './assets/image/item_zhonya.png';
import qssUrl from './assets/image/item_qss.png';
import rylaiUrl from './assets/image/item_rylai.png';
import rocketbeltUrl from './assets/image/item_rocketbelt.png';
import elixirMightUrl from './assets/image/Might.png';
import elixirIronUrl from './assets/image/Iron.png';
import elixirVampirismUrl from './assets/image/Vampirism.png';
import elixirHasteUrl from './assets/image/Haste.png';

const ITEM_URLS = {
  doransBlade: doransBladeUrl,
  boots: bootsUrl,
  longSword: longSwordUrl,
  clothArmor: clothArmorUrl,
  berserkers: berserkersUrl,
  vampScepter: vampScepterUrl,
  lastWhisper: lastWhisperUrl,
  cloakAgility: cloakAgilityUrl,
  fiendishCodex: fiendishCodexUrl,
  infinityEdge: infinityEdgeUrl,
  bloodthirster: bloodthirsterUrl,
  lordDominik: lordDominikUrl,
  thornmail: thornmailUrl,
  trinityForce: trinityForceUrl,
  navori: navoriUrl,
  healthPotion: healthPotionUrl,
  zhonya: zhonyaUrl,
  qss: qssUrl,
  rylai: rylaiUrl,
  rocketbelt: rocketbeltUrl,
  elixir_strength: elixirMightUrl,
  elixir_titan: elixirIronUrl,
  elixir_vamp: elixirVampirismUrl,
  elixir_agility: elixirHasteUrl
};

export function preloadShopItemAssets(scene) {
  Object.keys(ITEM_URLS).forEach(itemId => {
    const key = `item_${itemId}`;
    if (!scene.textures.exists(key)) {
      scene.load.image(key, ITEM_URLS[itemId]);
    }
  });
}

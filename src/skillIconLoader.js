// Import Q Skill Icons
import qEzrealUrl from './assets/image/Q_Ezreal_skill_icon.png';
import qLuxUrl from './assets/image/Q_Lux_skill_icon.png';
import qJinxUrl from './assets/image/Q_Jinx_skill_icon.png';
import qZedUrl from './assets/image/Q_Zed_skill_icon.png';
import qRivenUrl from './assets/image/Q_Riven_skill_icon.png';

// Import E Skill Icons
import eEzrealUrl from './assets/image/E_Ezreal_skill_icon.png';
import eLuxUrl from './assets/image/E_Lux_skill_icon.png';
import eJinxUrl from './assets/image/E_Jinx_skill_icon.png';
import eZedUrl from './assets/image/E_Zed_skill_icon.png';
import eRivenUrl from './assets/image/E_Riven_skill_icon.png';

// Import Space Skill Icons
import spaceEzrealUrl from './assets/image/Space_Ezreal_skill_icon.png';
import spaceLuxUrl from './assets/image/Space_Lux_skill_icon.png';
import spaceJinxUrl from './assets/image/Space_Jinx_skill_icon.png';
import spaceZedUrl from './assets/image/Space_Zed_skill_icon.png';
import spaceRivenUrl from './assets/image/Space_Riven_skill_icon.png';

const SKILL_ICONS = {
  ezreal: { Q: qEzrealUrl, E: eEzrealUrl, SPACE: spaceEzrealUrl },
  lux: { Q: qLuxUrl, E: eLuxUrl, SPACE: spaceLuxUrl },
  jinx: { Q: qJinxUrl, E: eJinxUrl, SPACE: spaceJinxUrl },
  zed: { Q: qZedUrl, E: eZedUrl, SPACE: spaceZedUrl },
  riven: { Q: qRivenUrl, E: eRivenUrl, SPACE: spaceRivenUrl }
};

export function preloadSkillIconAssets(scene) {
  Object.keys(SKILL_ICONS).forEach(heroId => {
    const heroSkills = SKILL_ICONS[heroId];
    Object.keys(heroSkills).forEach(sKey => {
      const textureKey = `icon_${heroId}_${sKey}`;
      if (!scene.textures.exists(textureKey)) {
        scene.load.image(textureKey, heroSkills[sKey]);
      }
    });
  });
}

export function createSkillIconTextures(scene) {
  // Skill icons are loaded directly as individual textures in preloadSkillIconAssets.
}

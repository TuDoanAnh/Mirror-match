export function getBotHeroForCampaignLevel(playerHero = 'ezreal', level = 1) {
  if (level >= 21) {
    return playerHero === 'riven' ? 'ezreal' : 'riven';
  }
  const allHeroes = ['ezreal', 'lux', 'jinx', 'zed', 'riven'];
  const opponents = allHeroes.filter(h => h !== playerHero);
  const oppIndex = Math.min(3, Math.max(0, Math.floor((level - 1) / 5)));
  return opponents[oppIndex] || 'lux';
}

export function getBotEquipmentForLevel(level) {
  const findItem = (id) => GAME_CONFIG.SHOP_ITEMS.find(i => i.id === id);
  const items = [];

  if (level >= 2) items.push(findItem('doransBlade'));
  if (level >= 4) items.push(findItem('berserkers'));
  if (level >= 6) items.push(findItem('vampScepter'));
  if (level >= 8) items.push(findItem('infinityEdge'));
  if (level >= 10) items.push(findItem('bloodthirster'));
  if (level >= 13) items.push(findItem('zhonya'));
  if (level >= 16) items.push(findItem('lordDominik'));
  if (level >= 18) items.push(findItem('trinityForce'));

  return items.filter(Boolean).slice(0, 6);
}

export function getCreepStatsForLevel(level = 4) {
  const base = GAME_CONFIG.CREEP_STATS;
  const l = Math.max(1, level);
  const scaleFactor = Math.max(0, l - 4);

  return {
    hp: Math.round(base.hp * (1 + scaleFactor * 0.35)),
    atk: Math.round(base.atk * (1 + scaleFactor * 0.25)),
    armor: Math.round(base.armor + scaleFactor * 6),
    speed: Math.round(base.speed * (1 + scaleFactor * 0.015)),
    bulletSpeed: Math.round(400 * (1 + scaleFactor * 0.025)),
    shootCooldown: Math.max(1200, Math.round(2500 - scaleFactor * 50)),
    color: base.color,
    goldReward: base.goldReward
  };
}

export const GAME_CONFIG = {
  CANVAS: {
    WIDTH: 1536,
    HEIGHT: 1024
  },
  BASE_STATS: {
    HP: 1000,
    SPEED: 200,
    ARMOR: 0,
    LIFESTEAL: 0,
    CRIT_CHANCE: 0,
    ARMOR_PEN: 0
  },
  STAT_CAPS: {
    MAX_CDR: 0.60,         // Max 60% CDR (Giảm thời gian hồi chiêu tối đa 60%)
    MAX_ARMOR_PEN: 60,     // Max 60% Armor Pen (Xuyên giáp tối đa 60%)
    MAX_CRIT_CHANCE: 100,  // Max 100% Crit Chance (Tỷ lệ chí mạng tối đa 100%)
    MAX_LIFESTEAL: 60      // Max 60% Lifesteal (Hút máu tối đa 60%)
  },
  ECONOMY: {
    STARTING_GOLD: 1000,
    SELL_REFUND_RATIO: 0.7,
    MAX_LEVEL: 25,
    LEVEL_WIN_REWARDS: {
      1: 600,
      2: 700,
      3: 800,
      4: 900,
      5: 1100,
      6: 1300,
      7: 1500,
      8: 1700,
      9: 1900,
      10: 2200,
      11: 2500,
      12: 2800,
      13: 3100,
      14: 3400,
      15: 3800,
      16: 4200,
      17: 4600,
      18: 5000,
      19: 5500,
      20: 6500,
      21: 7200,
      22: 8000,
      23: 8800,
      24: 9600,
      25: 11000
    }
  },
  CREEP_STATS: {
    hp: 250,
    atk: 25,
    armor: 10,
    speed: 120,
    spawnInterval: 6000,
    maxCreeps: 3,
    spawnMinLevel: 4,
    color: 0xcc3333,
    goldReward: 0 // Creep gold removed per instructions
  },
  SHOP_ITEMS: [
    // Starter / Basic Items
    { id: 'doransBlade', iconFrame: 0, name: "Traveler's Blade", statStr: '+15 ATK, +100 HP, +3% Vamp', cost: 450, color: 0xef4444, statsDict: { bonusDamage: 15, bonusHP: 100, lifesteal: 3 } },
    { id: 'boots', iconFrame: 1, name: 'Boots of Speed', statStr: '+30 Speed', cost: 300, color: 0x94a3b8, statsDict: { bonusSpeed: 30 } },
    { id: 'longSword', iconFrame: 2, name: 'Long Sword', statStr: '+15 ATK', cost: 350, color: 0xf87171, statsDict: { bonusDamage: 15 } },
    { id: 'clothArmor', iconFrame: 3, name: 'Cloth Armor', statStr: '+15 Armor', cost: 300, color: 0x22c55e, statsDict: { armor: 15 } },

    // Epic / Mid-Tier Items
    { id: 'berserkers', iconFrame: 4, name: "Warlord's Greaves", statStr: '+50 Speed, +10 ATK', cost: 1100, color: 0xfbbf24, statsDict: { bonusSpeed: 50, bonusDamage: 10 } },
    { id: 'vampScepter', iconFrame: 5, name: 'Bloodfang Scepter', statStr: '+10% Lifesteal, +15 ATK', cost: 900, color: 0xdc2626, statsDict: { lifesteal: 10, bonusDamage: 15 } },
    { id: 'lastWhisper', iconFrame: 6, name: 'Phantom Bow', statStr: '+18% Armor Pen, +20 ATK', cost: 1450, color: 0x06b6d4, statsDict: { armorPen: 18, bonusDamage: 20 } },
    { id: 'cloakAgility', iconFrame: 7, name: 'Cloak of Agility', statStr: '+15% Crit Chance', cost: 600, color: 0xa855f7, statsDict: { critChance: 15 } },
    { id: 'fiendishCodex', iconFrame: 8, name: 'Arcane Codex', statStr: '+10% CDR, +20 ATK', cost: 900, color: 0x8b5cf6, statsDict: { cdr: 0.10, bonusDamage: 20 } },

    // Legendary / Core Masterpieces
    { id: 'infinityEdge', iconFrame: 9, name: 'Edge of Eternity', statStr: '+70 ATK, +25% Crit', cost: 3400, color: 0xf59e0b, statsDict: { bonusDamage: 70, critChance: 25 } },
    { id: 'bloodthirster', iconFrame: 10, name: 'Bloodbound Saber', statStr: '+18% Lifesteal, +55 ATK', cost: 3200, color: 0xb91c1c, statsDict: { lifesteal: 18, bonusDamage: 55 } },
    { id: 'lordDominik', iconFrame: 11, name: "Vanquisher's Crossbow", statStr: '+35% Armor Pen, +45 ATK', cost: 3000, color: 0x0284c7, statsDict: { armorPen: 35, bonusDamage: 45 } },
    { id: 'thornmail', iconFrame: 12, name: 'Spike Cuirass', statStr: '+60 Armor, +250 HP', cost: 2700, color: 0x15803d, statsDict: { armor: 60, bonusHP: 250 } },
    { id: 'trinityForce', iconFrame: 13, name: 'Triumvirate Core', statStr: '+300 HP, +40 ATK, +30 Speed, +10% CDR', cost: 3333, color: 0xeab308, statsDict: { bonusHP: 300, bonusDamage: 40, bonusSpeed: 30, cdr: 0.10 } },
    { id: 'navori', iconFrame: 14, name: 'Swiftblade Essence', statStr: '+25% Crit, +60 ATK, +15% CDR', cost: 3400, color: 0xec4899, statsDict: { critChance: 25, bonusDamage: 60, cdr: 0.15 } },

    // Active & Utility Items
    { id: 'healthPotion', iconFrame: 15, name: 'Health Potion', statStr: 'Consumable: Restores 250 HP over 5s', cost: 50, color: 0xef4444, statsDict: { bonusHP: 50 } },
    { id: 'zhonya', iconFrame: 16, name: "Stasis Hourglass", statStr: 'Active (Slot Key): Golden Stasis (2s Invulnerable)', cost: 2800, color: 0xfacc15, statsDict: { bonusDamage: 55, cdr: 0.10 } },
    { id: 'qss', iconFrame: 17, name: 'Cleansing Sash', statStr: 'Active (Slot Key): Cleanse CC & +35% Speed', cost: 1300, color: 0x38bdf8, statsDict: { armor: 30 } },
    { id: 'rylai', iconFrame: 18, name: "Frost Crystal Staff", statStr: 'Passive: Skillshots Slow 25% for 1.5s', cost: 2600, color: 0x0284c7, statsDict: { bonusHP: 250, bonusDamage: 30 } },
    { id: 'rocketbelt', iconFrame: 19, name: 'Arcane Rocket Belt', statStr: 'Active (Slot Key): Rocket Dash & Arcane Bolts', cost: 2600, color: 0xec4899, statsDict: { bonusHP: 300, bonusSpeed: 25 } }
  ],
  ELIXIR_ITEMS: [
    { id: 'elixir_strength', name: 'Elixir of Might', desc: '+15 ATK (Bonus Damage)', cost: 500, color: 0xef4444, icon: '🗡️', statsDict: { bonusDamage: 15 } },
    { id: 'elixir_titan', name: 'Elixir of Iron', desc: '+150 Max HP, +15 Armor', cost: 500, color: 0x22c55e, icon: '🛡️', statsDict: { bonusHP: 150, armor: 15 } },
    { id: 'elixir_vamp', name: 'Elixir of Vampirism', desc: '+5% Lifesteal, +5% Armor Pen', cost: 500, color: 0xdc2626, icon: '🩸', statsDict: { lifesteal: 5, armorPen: 5 } },
    { id: 'elixir_agility', name: 'Elixir of Haste', desc: '+15 Speed, +5% CDR', cost: 500, color: 0x38bdf8, icon: '⚡', statsDict: { bonusSpeed: 15, cdr: 0.05 } }
  ],
  BOT_SCALING: {
    1:  { speedMult: 1.0,  hpMult: 1.0,  armor: 0,   armorPen: 0,  critChance: 0,  lifesteal: 0,  dmgMult: 1.0,  cdrMult: 1.0,  projSpeedMult: 1.0 },
    2:  { speedMult: 1.05, hpMult: 1.12, armor: 10,  armorPen: 0,  critChance: 0,  lifesteal: 0,  dmgMult: 1.08, cdrMult: 0.95, projSpeedMult: 1.02 },
    3:  { speedMult: 1.1,  hpMult: 1.25, armor: 20,  armorPen: 0,  critChance: 0,  lifesteal: 0,  dmgMult: 1.16, cdrMult: 0.90, projSpeedMult: 1.05 },
    4:  { speedMult: 1.15, hpMult: 1.40, armor: 30,  armorPen: 5,  critChance: 5,  lifesteal: 5,  dmgMult: 1.26, cdrMult: 0.85, projSpeedMult: 1.08 },
    5:  { speedMult: 1.2,  hpMult: 1.60, armor: 42,  armorPen: 8,  critChance: 8,  lifesteal: 6,  dmgMult: 1.38, cdrMult: 0.80, projSpeedMult: 1.10 },
    6:  { speedMult: 1.22, hpMult: 1.85, armor: 55,  armorPen: 12, critChance: 10, lifesteal: 8,  dmgMult: 1.52, cdrMult: 0.78, projSpeedMult: 1.12 },
    7:  { speedMult: 1.25, hpMult: 2.15, armor: 68,  armorPen: 15, critChance: 12, lifesteal: 10, dmgMult: 1.68, cdrMult: 0.75, projSpeedMult: 1.15 },
    8:  { speedMult: 1.28, hpMult: 2.45, armor: 80,  armorPen: 18, critChance: 15, lifesteal: 12, dmgMult: 1.85, cdrMult: 0.72, projSpeedMult: 1.18 },
    9:  { speedMult: 1.3,  hpMult: 2.80, armor: 92,  armorPen: 20, critChance: 18, lifesteal: 14, dmgMult: 2.05, cdrMult: 0.70, projSpeedMult: 1.20 },
    10: { speedMult: 1.32, hpMult: 3.15, armor: 105, armorPen: 22, critChance: 20, lifesteal: 15, dmgMult: 2.25, cdrMult: 0.68, projSpeedMult: 1.22 },
    11: { speedMult: 1.35, hpMult: 3.55, armor: 118, armorPen: 25, critChance: 25, lifesteal: 16, dmgMult: 2.50, cdrMult: 0.65, projSpeedMult: 1.25 },
    12: { speedMult: 1.38, hpMult: 4.00, armor: 130, armorPen: 28, critChance: 30, lifesteal: 18, dmgMult: 2.75, cdrMult: 0.62, projSpeedMult: 1.28 },
    13: { speedMult: 1.4,  hpMult: 4.45, armor: 142, armorPen: 30, critChance: 35, lifesteal: 20, dmgMult: 3.05, cdrMult: 0.60, projSpeedMult: 1.30 },
    14: { speedMult: 1.42, hpMult: 4.95, armor: 155, armorPen: 32, critChance: 40, lifesteal: 22, dmgMult: 3.35, cdrMult: 0.58, projSpeedMult: 1.32 },
    15: { speedMult: 1.45, hpMult: 5.45, armor: 168, armorPen: 35, critChance: 45, lifesteal: 24, dmgMult: 3.70, cdrMult: 0.55, projSpeedMult: 1.35 },
    16: { speedMult: 1.48, hpMult: 6.00, armor: 180, armorPen: 38, critChance: 50, lifesteal: 26, dmgMult: 4.05, cdrMult: 0.52, projSpeedMult: 1.38 },
    17: { speedMult: 1.5,  hpMult: 6.55, armor: 192, armorPen: 40, critChance: 55, lifesteal: 28, dmgMult: 4.45, cdrMult: 0.50, projSpeedMult: 1.40 },
    18: { speedMult: 1.52, hpMult: 7.15, armor: 205, armorPen: 42, critChance: 60, lifesteal: 30, dmgMult: 4.85, cdrMult: 0.48, projSpeedMult: 1.43 },
    19: { speedMult: 1.55, hpMult: 7.75, armor: 218, armorPen: 45, critChance: 65, lifesteal: 32, dmgMult: 5.30, cdrMult: 0.45, projSpeedMult: 1.46 },
    20: { speedMult: 1.58, hpMult: 8.40, armor: 230, armorPen: 48, critChance: 70, lifesteal: 34, dmgMult: 5.75, cdrMult: 0.43, projSpeedMult: 1.48 },
    21: { speedMult: 1.60, hpMult: 9.10, armor: 242, armorPen: 50, critChance: 75, lifesteal: 36, dmgMult: 6.25, cdrMult: 0.42, projSpeedMult: 1.50 },
    22: { speedMult: 1.62, hpMult: 9.85, armor: 255, armorPen: 52, critChance: 80, lifesteal: 38, dmgMult: 6.80, cdrMult: 0.41, projSpeedMult: 1.52 },
    23: { speedMult: 1.64, hpMult: 10.6, armor: 268, armorPen: 55, critChance: 85, lifesteal: 40, dmgMult: 7.40, cdrMult: 0.40, projSpeedMult: 1.54 },
    24: { speedMult: 1.66, hpMult: 11.4, armor: 280, armorPen: 58, critChance: 90, lifesteal: 42, dmgMult: 8.00, cdrMult: 0.40, projSpeedMult: 1.56 },
    25: { speedMult: 1.70, hpMult: 12.5, armor: 300, armorPen: 60, critChance: 100, lifesteal: 45, dmgMult: 8.80, cdrMult: 0.40, projSpeedMult: 1.60 }
  },
  DEFAULT_BOT_HERO_BY_LEVEL: {
    1: 'ezreal',
    2: 'lux',
    3: 'jinx',
    4: 'zed',
    5: 'riven',
    6: 'ezreal',
    7: 'lux',
    8: 'jinx',
    9: 'zed',
    10: 'riven'
  },
  CHARACTERS: {
    ezreal: {
      id: 'ezreal',
      name: 'Elion',
      title: 'The Starbound Explorer',
      color: 0x0088ff,
      projColor: 0x00ffff,
      ultColor: 0xffaa00,
      description: 'High mobility explorer with precision skillshots & global ultimate.',
      baseStats: { hp: 1000, speed: 200, armor: 0, lifesteal: 0, critChance: 0, armorPen: 0 },
      skills: {
        Q: { type: 'PROJECTILE', name: 'Mystic Pulse', cooldown: 2000, config: { damage: 100, speed: 600, isPiercing: false } },
        E: { type: 'DASH', name: 'Flash Step', cooldown: 8000, config: { dashDistance: 150 } },
        SPACE: { type: 'PROJECTILE', name: 'Starshot Barrage', cooldown: 16000, config: { damage: 400, speed: 600, isPiercing: true, channelTime: 500 } }
      }
    },
    lux: {
      id: 'lux',
      name: 'Lumina',
      title: 'The Radiant Lightweaver',
      color: 0xffdd00,
      projColor: 0xffff88,
      ultColor: 0xffffff,
      description: 'Long-range mage with piercing light bolts & prismatic barrier shield.',
      baseStats: { hp: 900, speed: 190, armor: 0, lifesteal: 0, critChance: 0, armorPen: 0 },
      skills: {
        Q: { type: 'PROJECTILE', name: 'Radiant Binding', cooldown: 2000, config: { damage: 140, speed: 550, isPiercing: true, rootDuration: 1000 } },
        E: { type: 'SHIELD', name: 'Prismatic Shield', cooldown: 7000, config: { shieldHp: 250, duration: 3000 } },
        SPACE: { type: 'LUX_BEAM', name: 'Lumina Beam', cooldown: 14000, config: { damage: 750, channelTime: 500, beamWidth: 50 } }
      }
    },
    jinx: {
      id: 'jinx',
      name: 'Kira',
      title: 'The Rebel Cannon',
      color: 0xff00ff,
      projColor: 0xff0088,
      ultColor: 0xff0044,
      description: 'Aggressive maniac firing rocket spreads & hyper speed boosts.',
      baseStats: { hp: 950, speed: 210, armor: 0, lifesteal: 0, critChance: 5, armorPen: 0 },
      skills: {
        Q: { type: 'SPREAD_SHOT', name: 'Chaos Rockets', cooldown: 2000, config: { count: 3, spreadAngle: 0.25, damage: 70, speed: 650 } },
        E: { type: 'JINX_SPEED_BUFF', name: 'Adrenaline Rush', cooldown: 8000, config: { speedBonus: 60, duration: 4000 } },
        SPACE: { type: 'PROJECTILE', name: 'Doom Rocket', cooldown: 15000, config: { damage: 650, speed: 1000, isPiercing: false, isExplosive: true, explosionRadius: 165, channelTime: 200 } }
      }
    },
    zed: {
      id: 'zed',
      name: 'Kage',
      title: 'Master of Shadows',
      color: 0x991b1b,
      projColor: 0xef4444,
      ultColor: 0x7f1d1d,
      description: 'Shadow assassin swapping places with shadow clones & detonating Death Marks.',
      baseStats: { hp: 980, speed: 215, armor: 5, lifesteal: 0, critChance: 5, armorPen: 10 },
      skills: {
        Q: { type: 'ZED_SHURIKEN', name: 'Shadow Shuriken', cooldown: 2500, config: { damage: 135, speed: 750, isPiercing: true, maxRange: 550 } },
        E: { type: 'ZED_SHADOW', name: 'Shadow Clone', cooldown: 8000, config: { maxDistance: 280 } },
        SPACE: { type: 'ZED_DEATHMARK', name: 'Mark of Death', cooldown: 15000, config: { damage: 250, markDuration: 4150, castRange: 280 } }
      }
    },
    riven: {
      id: 'riven',
      name: 'Rivia',
      title: 'The Swordmaster Exile',
      color: 0x10b981,
      projColor: 0x34d399,
      ultColor: 0x059669,
      description: 'Melee combo swordmistress with short dashes, knockup slashes & wind wave shockwaves.',
      baseStats: { hp: 1050, speed: 220, armor: 15, lifesteal: 0, critChance: 5, armorPen: 0 },
      skills: {
        Q: { type: 'RIVEN_Q', name: 'Rune Slashes', cooldown: 4000, config: { damage: 110, dashDistance: 110, slashArc: 110, knockupDuration: 600 } },
        E: { type: 'RIVEN_E', name: 'Valiant Shield', cooldown: 6000, config: { dashDistance: 160, shieldHp: 220, duration: 2500 } },
        SPACE: { type: 'RIVEN_WINDSLASH', name: 'Windwave Slash', cooldown: 14000, config: { damage: 480, range: 360, angleWidth: 60, channelTime: 500 } }
      }
    }
  }
};

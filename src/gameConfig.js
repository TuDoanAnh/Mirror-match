export function getBotHeroForCampaignLevel(playerHero = 'ezreal', level = 1) {
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
  ECONOMY: {
    STARTING_GOLD: 1000,
    SELL_REFUND_RATIO: 0.7,
    MAX_LEVEL: 20,
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
      20: 6500
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
    { id: 'doransBlade', iconFrame: 0, name: "Doran's Blade", statStr: '+15 ATK, +100 HP, +3% Vamp', cost: 450, color: 0xef4444, statsDict: { bonusDamage: 15, bonusHP: 100, lifesteal: 3 } },
    { id: 'boots', iconFrame: 1, name: 'Boots of Speed', statStr: '+30 Speed', cost: 300, color: 0x94a3b8, statsDict: { bonusSpeed: 30 } },
    { id: 'longSword', iconFrame: 2, name: 'Long Sword', statStr: '+15 ATK', cost: 350, color: 0xf87171, statsDict: { bonusDamage: 15 } },
    { id: 'clothArmor', iconFrame: 3, name: 'Cloth Armor', statStr: '+15 Armor', cost: 300, color: 0x22c55e, statsDict: { armor: 15 } },

    // Epic / Mid-Tier Items
    { id: 'berserkers', iconFrame: 4, name: "Berserker's Greaves", statStr: '+50 Speed, +10 ATK', cost: 1100, color: 0xfbbf24, statsDict: { bonusSpeed: 50, bonusDamage: 10 } },
    { id: 'vampScepter', iconFrame: 5, name: 'Vampiric Scepter', statStr: '+10% Lifesteal, +15 ATK', cost: 900, color: 0xdc2626, statsDict: { lifesteal: 10, bonusDamage: 15 } },
    { id: 'lastWhisper', iconFrame: 6, name: 'Last Whisper', statStr: '+18% Armor Pen, +20 ATK', cost: 1450, color: 0x06b6d4, statsDict: { armorPen: 18, bonusDamage: 20 } },
    { id: 'cloakAgility', iconFrame: 7, name: 'Cloak of Agility', statStr: '+15% Crit Chance', cost: 600, color: 0xa855f7, statsDict: { critChance: 15 } },
    { id: 'fiendishCodex', iconFrame: 8, name: 'Fiendish Codex', statStr: '+10% CDR, +20 ATK', cost: 900, color: 0x8b5cf6, statsDict: { cdr: 0.10, bonusDamage: 20 } },

    // Legendary / Core LoL Masterpieces
    { id: 'infinityEdge', iconFrame: 9, name: 'Infinity Edge', statStr: '+70 ATK, +25% Crit', cost: 3400, color: 0xf59e0b, statsDict: { bonusDamage: 70, critChance: 25 } },
    { id: 'bloodthirster', iconFrame: 10, name: 'Bloodthirster', statStr: '+18% Lifesteal, +55 ATK', cost: 3200, color: 0xb91c1c, statsDict: { lifesteal: 18, bonusDamage: 55 } },
    { id: 'lordDominik', iconFrame: 11, name: "Lord Dominik's Regards", statStr: '+35% Armor Pen, +45 ATK', cost: 3000, color: 0x0284c7, statsDict: { armorPen: 35, bonusDamage: 45 } },
    { id: 'thornmail', iconFrame: 12, name: 'Thornmail', statStr: '+60 Armor, +250 HP', cost: 2700, color: 0x15803d, statsDict: { armor: 60, bonusHP: 250 } },
    { id: 'trinityForce', iconFrame: 13, name: 'Trinity Force', statStr: '+300 HP, +40 ATK, +30 Speed, +10% CDR', cost: 3333, color: 0xeab308, statsDict: { bonusHP: 300, bonusDamage: 40, bonusSpeed: 30, cdr: 0.10 } },
    { id: 'navori', iconFrame: 14, name: 'Navori Quickblades', statStr: '+25% Crit, +60 ATK, +15% CDR', cost: 3400, color: 0xec4899, statsDict: { critChance: 25, bonusDamage: 60, cdr: 0.15 } },

    // Active & Utility Items
    { id: 'healthPotion', iconFrame: 15, name: 'Health Potion', statStr: 'Consumable: Restores 250 HP over 5s', cost: 50, color: 0xef4444, statsDict: { bonusHP: 50 } },
    { id: 'zhonya', iconFrame: 16, name: "Zhonya's Hourglass", statStr: 'Active (Slot Key): Golden Stasis (2s Invulnerable)', cost: 2800, color: 0xfacc15, statsDict: { bonusDamage: 55, cdr: 0.10 } },
    { id: 'qss', iconFrame: 17, name: 'Quicksilver Sash (QSS)', statStr: 'Active (Slot Key): Cleanse CC & +35% Speed', cost: 1300, color: 0x38bdf8, statsDict: { armor: 30 } },
    { id: 'rylai', iconFrame: 18, name: "Rylai's Crystal Scepter", statStr: 'Passive: Skillshots Slow 25% for 1.5s', cost: 2600, color: 0x0284c7, statsDict: { bonusHP: 250, bonusDamage: 30 } },
    { id: 'rocketbelt', iconFrame: 19, name: 'Hextech Rocketbelt', statStr: 'Active (Slot Key): Rocket Dash & Hextech Bolts', cost: 2600, color: 0xec4899, statsDict: { bonusHP: 300, bonusSpeed: 25 } }
  ],
  ELIXIR_ITEMS: [
    { id: 'elixir_strength', name: 'Dược Phẩm Sức Mạnh', desc: '+15 ATK (Bonus Damage)', cost: 500, color: 0xef4444, icon: '🗡️', statsDict: { bonusDamage: 15 } },
    { id: 'elixir_titan', name: 'Dược Phẩm Vệ Thần', desc: '+150 Max HP, +15 Armor', cost: 500, color: 0x22c55e, icon: '🛡️', statsDict: { bonusHP: 150, armor: 15 } },
    { id: 'elixir_vamp', name: 'Dược Phẩm Tẩy Tủy', desc: '+5% Lifesteal, +5% Armor Pen', cost: 500, color: 0xdc2626, icon: '🩸', statsDict: { lifesteal: 5, armorPen: 5 } },
    { id: 'elixir_agility', name: 'Dược Phẩm Cuồng Thần', desc: '+15 Speed, +5% CDR', cost: 500, color: 0x38bdf8, icon: '⚡', statsDict: { bonusSpeed: 15, cdr: 0.05 } }
  ],
  BOT_SCALING: {
    1: { speedMult: 1.0, hpMult: 1.0, armor: 0, armorPen: 0, critChance: 0, lifesteal: 0, dmgMult: 1.0, cdrMult: 1.0, projSpeedMult: 1.0 },
    2: { speedMult: 1.05, hpMult: 1.1, armor: 10, armorPen: 0, critChance: 0, lifesteal: 0, dmgMult: 1.08, cdrMult: 0.95, projSpeedMult: 1.02 },
    3: { speedMult: 1.1, hpMult: 1.2, armor: 20, armorPen: 0, critChance: 0, lifesteal: 0, dmgMult: 1.15, cdrMult: 0.90, projSpeedMult: 1.05 },
    4: { speedMult: 1.15, hpMult: 1.3, armor: 30, armorPen: 5, critChance: 0, lifesteal: 5, dmgMult: 1.22, cdrMult: 0.88, projSpeedMult: 1.08 },
    5: { speedMult: 1.2, hpMult: 1.45, armor: 40, armorPen: 5, critChance: 5, lifesteal: 5, dmgMult: 1.30, cdrMult: 0.85, projSpeedMult: 1.10 },
    6: { speedMult: 1.22, hpMult: 1.6, armor: 50, armorPen: 10, critChance: 5, lifesteal: 8, dmgMult: 1.38, cdrMult: 0.82, projSpeedMult: 1.12 },
    7: { speedMult: 1.25, hpMult: 1.75, armor: 60, armorPen: 10, critChance: 10, lifesteal: 10, dmgMult: 1.46, cdrMult: 0.80, projSpeedMult: 1.15 },
    8: { speedMult: 1.28, hpMult: 1.9, armor: 70, armorPen: 15, critChance: 10, lifesteal: 10, dmgMult: 1.54, cdrMult: 0.78, projSpeedMult: 1.18 },
    9: { speedMult: 1.3, hpMult: 2.1, armor: 80, armorPen: 15, critChance: 15, lifesteal: 12, dmgMult: 1.62, cdrMult: 0.75, projSpeedMult: 1.20 },
    10: { speedMult: 1.32, hpMult: 2.3, armor: 90, armorPen: 20, critChance: 15, lifesteal: 12, dmgMult: 1.70, cdrMult: 0.72, projSpeedMult: 1.22 },
    11: { speedMult: 1.35, hpMult: 2.5, armor: 100, armorPen: 20, critChance: 20, lifesteal: 15, dmgMult: 1.80, cdrMult: 0.70, projSpeedMult: 1.25 },
    12: { speedMult: 1.38, hpMult: 2.75, armor: 110, armorPen: 25, critChance: 20, lifesteal: 15, dmgMult: 1.90, cdrMult: 0.68, projSpeedMult: 1.28 },
    13: { speedMult: 1.4, hpMult: 3.0, armor: 120, armorPen: 25, critChance: 25, lifesteal: 18, dmgMult: 2.00, cdrMult: 0.65, projSpeedMult: 1.30 },
    14: { speedMult: 1.42, hpMult: 3.25, armor: 130, armorPen: 30, critChance: 25, lifesteal: 18, dmgMult: 2.12, cdrMult: 0.62, projSpeedMult: 1.32 },
    15: { speedMult: 1.45, hpMult: 3.5, armor: 140, armorPen: 30, critChance: 30, lifesteal: 20, dmgMult: 2.25, cdrMult: 0.60, projSpeedMult: 1.35 },
    16: { speedMult: 1.48, hpMult: 3.8, armor: 150, armorPen: 35, critChance: 30, lifesteal: 22, dmgMult: 2.40, cdrMult: 0.58, projSpeedMult: 1.38 },
    17: { speedMult: 1.5, hpMult: 4.1, armor: 160, armorPen: 35, critChance: 35, lifesteal: 25, dmgMult: 2.55, cdrMult: 0.55, projSpeedMult: 1.40 },
    18: { speedMult: 1.52, hpMult: 4.4, armor: 170, armorPen: 40, critChance: 35, lifesteal: 25, dmgMult: 2.70, cdrMult: 0.52, projSpeedMult: 1.43 },
    19: { speedMult: 1.55, hpMult: 4.8, armor: 185, armorPen: 40, critChance: 40, lifesteal: 28, dmgMult: 2.85, cdrMult: 0.50, projSpeedMult: 1.46 },
    20: { speedMult: 1.6, hpMult: 5.2, armor: 200, armorPen: 45, critChance: 45, lifesteal: 30, dmgMult: 3.00, cdrMult: 0.45, projSpeedMult: 1.50 }
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
      name: 'Ezreal',
      title: 'The Prodigal Explorer',
      color: 0x0088ff,
      projColor: 0x00ffff,
      ultColor: 0xffaa00,
      description: 'High mobility explorer with precision skillshots & global ultimate.',
      baseStats: { hp: 1000, speed: 200, armor: 0, lifesteal: 0, critChance: 0, armorPen: 0 },
      skills: {
        Q: { type: 'PROJECTILE', name: 'Mystic Shot', cooldown: 2000, config: { damage: 100, speed: 600, isPiercing: false } },
        E: { type: 'DASH', name: 'Arcane Shift', cooldown: 8000, config: { dashDistance: 150 } },
        SPACE: { type: 'PROJECTILE', name: 'Trueshot Barrage', cooldown: 16000, config: { damage: 400, speed: 600, isPiercing: true, channelTime: 500 } }
      }
    },
    lux: {
      id: 'lux',
      name: 'Lux',
      title: 'Lady of Luminosity',
      color: 0xffdd00,
      projColor: 0xffff88,
      ultColor: 0xffffff,
      description: 'Long-range mage with piercing light bolts & prismatic barrier shield.',
      baseStats: { hp: 900, speed: 190, armor: 0, lifesteal: 0, critChance: 0, armorPen: 0 },
      skills: {
        Q: { type: 'PROJECTILE', name: 'Light Binding', cooldown: 2000, config: { damage: 140, speed: 550, isPiercing: true, rootDuration: 1000 } },
        E: { type: 'SHIELD', name: 'Prismatic Barrier', cooldown: 7000, config: { shieldHp: 250, duration: 3000 } },
        SPACE: { type: 'LUX_BEAM', name: 'Final Spark', cooldown: 14000, config: { damage: 750, channelTime: 500, beamWidth: 50 } }
      }
    },
    jinx: {
      id: 'jinx',
      name: 'Jinx',
      title: 'The Loose Cannon',
      color: 0xff00ff,
      projColor: 0xff0088,
      ultColor: 0xff0044,
      description: 'Aggressive maniac firing rocket spreads & hyper speed boosts.',
      baseStats: { hp: 950, speed: 210, armor: 0, lifesteal: 0, critChance: 5, armorPen: 0 },
      skills: {
        Q: { type: 'SPREAD_SHOT', name: 'Fishbones Rockets', cooldown: 2000, config: { count: 3, spreadAngle: 0.25, damage: 70, speed: 650 } },
        E: { type: 'JINX_SPEED_BUFF', name: 'Get Excited! / Speed Boost', cooldown: 8000, config: { speedBonus: 60, duration: 4000 } },
        SPACE: { type: 'PROJECTILE', name: 'Super Mega Death Rocket', cooldown: 15000, config: { damage: 650, speed: 1000, isPiercing: false, isExplosive: true, explosionRadius: 165, channelTime: 200 } }
      }
    },
    zed: {
      id: 'zed',
      name: 'Zed',
      title: 'The Master of Shadows',
      color: 0x991b1b,
      projColor: 0xef4444,
      ultColor: 0x7f1d1d,
      description: 'Shadow assassin swapping places with shadow clones & detonating Death Marks.',
      baseStats: { hp: 980, speed: 215, armor: 5, lifesteal: 0, critChance: 5, armorPen: 10 },
      skills: {
        Q: { type: 'ZED_SHURIKEN', name: 'Razor Shuriken', cooldown: 2500, config: { damage: 135, speed: 750, isPiercing: true, maxRange: 550 } },
        E: { type: 'ZED_SHADOW', name: 'Living Shadow', cooldown: 8000, config: { maxDistance: 280 } },
        SPACE: { type: 'ZED_DEATHMARK', name: 'Death Mark', cooldown: 15000, config: { damage: 250, markDuration: 4150, castRange: 280 } }
      }
    },
    riven: {
      id: 'riven',
      name: 'Riven',
      title: 'The Exile',
      color: 0x10b981,
      projColor: 0x34d399,
      ultColor: 0x059669,
      description: 'Melee combo swordmistress with short dashes, knockup slashes & wind wave shockwaves.',
      baseStats: { hp: 1050, speed: 220, armor: 15, lifesteal: 0, critChance: 5, armorPen: 0 },
      skills: {
        Q: { type: 'RIVEN_Q', name: 'Broken Wings', cooldown: 4000, config: { damage: 110, dashDistance: 110, slashArc: 110, knockupDuration: 600 } },
        E: { type: 'RIVEN_E', name: 'Valor', cooldown: 6000, config: { dashDistance: 160, shieldHp: 220, duration: 2500 } },
        SPACE: { type: 'RIVEN_WINDSLASH', name: 'Wind Slash', cooldown: 14000, config: { damage: 480, range: 360, angleWidth: 60, channelTime: 500 } }
      }
    }
  }
};

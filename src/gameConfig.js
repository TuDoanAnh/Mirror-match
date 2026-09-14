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
    MAX_LEVEL: 10,
    LEVEL_WIN_REWARDS: {
      1: 600,
      2: 800,
      3: 1000,
      4: 1200,
      5: 1500,
      6: 1800,
      7: 2200,
      8: 2600,
      9: 3000,
      10: 4000
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
    { id: 'doransBlade', name: "Doran's Blade", statStr: '+15 ATK, +100 HP, +3% Vamp', cost: 450, color: 0xef4444, statsDict: { bonusDamage: 15, bonusHP: 100, lifesteal: 3 } },
    { id: 'boots', name: 'Boots of Speed', statStr: '+30 Speed', cost: 300, color: 0x94a3b8, statsDict: { bonusSpeed: 30 } },
    { id: 'longSword', name: 'Long Sword', statStr: '+15 ATK', cost: 350, color: 0xf87171, statsDict: { bonusDamage: 15 } },
    { id: 'clothArmor', name: 'Cloth Armor', statStr: '+15 Armor', cost: 300, color: 0x22c55e, statsDict: { armor: 15 } },

    // Epic / Mid-Tier Items
    { id: 'berserkers', name: "Berserker's Greaves", statStr: '+50 Speed, +10 ATK', cost: 1100, color: 0xfbbf24, statsDict: { bonusSpeed: 50, bonusDamage: 10 } },
    { id: 'vampScepter', name: 'Vampiric Scepter', statStr: '+10% Lifesteal, +15 ATK', cost: 900, color: 0xdc2626, statsDict: { lifesteal: 10, bonusDamage: 15 } },
    { id: 'lastWhisper', name: 'Last Whisper', statStr: '+18% Armor Pen, +20 ATK', cost: 1450, color: 0x06b6d4, statsDict: { armorPen: 18, bonusDamage: 20 } },
    { id: 'cloakAgility', name: 'Cloak of Agility', statStr: '+15% Crit Chance', cost: 600, color: 0xa855f7, statsDict: { critChance: 15 } },
    { id: 'fiendishCodex', name: 'Fiendish Codex', statStr: '+10% CDR, +20 ATK', cost: 900, color: 0x8b5cf6, statsDict: { cdr: 0.10, bonusDamage: 20 } },

    // Legendary / Core LoL Masterpieces
    { id: 'infinityEdge', name: 'Infinity Edge', statStr: '+70 ATK, +25% Crit', cost: 3400, color: 0xf59e0b, statsDict: { bonusDamage: 70, critChance: 25 } },
    { id: 'bloodthirster', name: 'Bloodthirster', statStr: '+18% Lifesteal, +55 ATK', cost: 3200, color: 0xb91c1c, statsDict: { lifesteal: 18, bonusDamage: 55 } },
    { id: 'lordDominik', name: "Lord Dominik's Regards", statStr: '+35% Armor Pen, +45 ATK', cost: 3000, color: 0x0284c7, statsDict: { armorPen: 35, bonusDamage: 45 } },
    { id: 'thornmail', name: 'Thornmail', statStr: '+60 Armor, +250 HP', cost: 2700, color: 0x15803d, statsDict: { armor: 60, bonusHP: 250 } },
    { id: 'trinityForce', name: 'Trinity Force', statStr: '+300 HP, +40 ATK, +30 Speed, +10% CDR', cost: 3333, color: 0xeab308, statsDict: { bonusHP: 300, bonusDamage: 40, bonusSpeed: 30, cdr: 0.10 } },
    { id: 'navori', name: 'Navori Quickblades', statStr: '+25% Crit, +60 ATK, +15% CDR', cost: 3400, color: 0xec4899, statsDict: { critChance: 25, bonusDamage: 60, cdr: 0.15 } },

    // Active & Utility Items
    { id: 'healthPotion', name: 'Health Potion', statStr: 'Restores 250 HP over 5s', cost: 50, color: 0xef4444, statsDict: { bonusHP: 50 } },
    { id: 'zhonya', name: "Zhonya's Hourglass", statStr: 'Active [Key 1]: Golden Stasis (2s Invulnerable)', cost: 2800, color: 0xfacc15, statsDict: { bonusDamage: 55, cdr: 0.10 } },
    { id: 'qss', name: 'Quicksilver Sash (QSS)', statStr: 'Active [Key 2]: Cleanse Root/Charm, +30 Armor', cost: 1300, color: 0x38bdf8, statsDict: { armor: 30 } },
    { id: 'rylai', name: "Rylai's Crystal Scepter", statStr: 'Passive: Skillshots Slow 25% for 1.5s', cost: 2600, color: 0x0284c7, statsDict: { bonusHP: 250, bonusDamage: 30 } },
    { id: 'rocketbelt', name: 'Hextech Rocketbelt', statStr: 'Active [Key 3]: Rocket Dash, +25 Speed', cost: 2600, color: 0xec4899, statsDict: { bonusHP: 300, bonusSpeed: 25 } }
  ],
  BOT_SCALING: {
    1: { speedMult: 1.0, hpMult: 1.0, armor: 0, armorPen: 0, critChance: 0, lifesteal: 0, dmgMult: 1.0, cdrMult: 1.0, projSpeedMult: 1.0 },
    2: { speedMult: 1.1, hpMult: 1.2, armor: 15, armorPen: 0, critChance: 0, lifesteal: 0, dmgMult: 1.15, cdrMult: 0.90, projSpeedMult: 1.05 },
    3: { speedMult: 1.2, hpMult: 1.4, armor: 30, armorPen: 5, critChance: 0, lifesteal: 5, dmgMult: 1.25, cdrMult: 0.85, projSpeedMult: 1.10 },
    4: { speedMult: 1.25, hpMult: 1.6, armor: 45, armorPen: 10, critChance: 10, lifesteal: 10, dmgMult: 1.35, cdrMult: 0.80, projSpeedMult: 1.15 },
    5: { speedMult: 1.3, hpMult: 1.9, armor: 60, armorPen: 15, critChance: 15, lifesteal: 12, dmgMult: 1.50, cdrMult: 0.75, projSpeedMult: 1.20 },
    6: { speedMult: 1.35, hpMult: 2.2, armor: 75, armorPen: 20, critChance: 20, lifesteal: 15, dmgMult: 1.65, cdrMult: 0.70, projSpeedMult: 1.25 },
    7: { speedMult: 1.4, hpMult: 2.6, armor: 90, armorPen: 25, critChance: 25, lifesteal: 18, dmgMult: 1.80, cdrMult: 0.65, projSpeedMult: 1.30 },
    8: { speedMult: 1.45, hpMult: 3.0, armor: 110, armorPen: 30, critChance: 30, lifesteal: 20, dmgMult: 2.00, cdrMult: 0.60, projSpeedMult: 1.35 },
    9: { speedMult: 1.5, hpMult: 3.5, armor: 130, armorPen: 35, critChance: 35, lifesteal: 25, dmgMult: 2.25, cdrMult: 0.55, projSpeedMult: 1.40 },
    10: { speedMult: 1.55, hpMult: 4.2, armor: 150, armorPen: 40, critChance: 40, lifesteal: 30, dmgMult: 2.50, cdrMult: 0.50, projSpeedMult: 1.50 }
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
        SPACE: { type: 'PROJECTILE', name: 'Super Mega Death Rocket', cooldown: 15000, config: { damage: 650, speed: 1000, isPiercing: false, isExplosive: true, explosionRadius: 100, channelTime: 500 } }
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
        Q: { type: 'RIVEN_Q', name: 'Broken Wings', cooldown: 3500, config: { damage: 110, dashDistance: 110, slashArc: 110, knockupDuration: 600 } },
        E: { type: 'RIVEN_E', name: 'Valor', cooldown: 6000, config: { dashDistance: 160, shieldHp: 220, duration: 2500 } },
        SPACE: { type: 'RIVEN_WINDSLASH', name: 'Wind Slash', cooldown: 14000, config: { damage: 480, range: 360, angleWidth: 60, channelTime: 250 } }
      }
    }
  }
};

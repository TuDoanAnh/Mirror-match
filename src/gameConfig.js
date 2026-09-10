export const GAME_CONFIG = {
  CANVAS: {
    WIDTH: 1024,
    HEIGHT: 768
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
    STARTING_GOLD: 350,
    GOLD_PER_LEVEL_WIN: 50,
    SELL_REFUND_RATIO: 0.7,
    MAX_LEVEL: 5
  },
  SHOP_ITEMS: [
    { id: 'bonusDamage', name: 'Long Sword', statStr: '+10 Damage', val: 10, cost: 350, color: 0x8888ff },
    { id: 'armor', name: 'Cloth Armor', statStr: '+15 Armor', val: 15, cost: 300, color: 0x88ff88 },
    { id: 'lifesteal', name: 'Vamp Scepter', statStr: '+10% Lifesteal', val: 10, cost: 400, color: 0xff0000 },
    { id: 'critChance', name: 'Brawler Gloves', statStr: '+10% Crit Chance', val: 10, cost: 400, color: 0xffa500 },
    { id: 'armorPen', name: 'Last Whisper', statStr: '+20% Armor Pen', val: 20, cost: 900, color: 0x00ffff }
  ],
  BOT_SCALING: {
    1: { speedMult: 1.0, hpMult: 1.0, armor: 0, armorPen: 0, critChance: 0, lifesteal: 0, dmgMult: 1.0, cdrMult: 1.0, projSpeedMult: 1.0 },
    2: { speedMult: 1.2, hpMult: 1.2, armor: 25, armorPen: 0, critChance: 0, lifesteal: 0, dmgMult: 1.2, cdrMult: 0.85, projSpeedMult: 1.0 },
    3: { speedMult: 1.5, hpMult: 1.5, armor: 50, armorPen: 10, critChance: 0, lifesteal: 0, dmgMult: 1.5, cdrMult: 0.70, projSpeedMult: 1.3 },
    4: { speedMult: 1.8, hpMult: 2.0, armor: 75, armorPen: 20, critChance: 10, lifesteal: 0, dmgMult: 2.0, cdrMult: 0.60, projSpeedMult: 1.5 },
    5: { speedMult: 2.5, hpMult: 3.5, armor: 100, armorPen: 30, critChance: 25, lifesteal: 10, dmgMult: 3.0, cdrMult: 0.30, projSpeedMult: 2.0 }
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
        SPACE: { type: 'PROJECTILE', name: 'Trueshot Barrage', cooldown: 20000, config: { damage: 500, speed: 1000, isPiercing: true } }
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
        Q: { type: 'PROJECTILE', name: 'Light Binding', cooldown: 3000, config: { damage: 140, speed: 550, isPiercing: true } },
        E: { type: 'SHIELD', name: 'Prismatic Barrier', cooldown: 7000, config: { shieldHp: 250, duration: 3000 } },
        SPACE: { type: 'PROJECTILE', name: 'Final Spark', cooldown: 18000, config: { damage: 650, speed: 1200, isPiercing: true } }
      }
    },
    jinx: {
      id: 'jinx',
      name: 'Jinx',
      title: 'The Loose Cannon',
      color: 0xff00ff,
      projColor: 0xff0088,
      ultColor: 0xff0044,
      description: 'Aggressive maniac firing 3-way rocket spreads & mega rockets.',
      baseStats: { hp: 950, speed: 210, armor: 0, lifesteal: 0, critChance: 5, armorPen: 0 },
      skills: {
        Q: { type: 'SPREAD_SHOT', name: 'Fishbones Rockets', cooldown: 2500, config: { count: 3, spreadAngle: 0.25, damage: 70, speed: 650 } },
        E: { type: 'DASH', name: 'Zap / Speed Rush', cooldown: 6000, config: { dashDistance: 180 } },
        SPACE: { type: 'PROJECTILE', name: 'Super Mega Death Rocket', cooldown: 22000, config: { damage: 700, speed: 1100, isPiercing: true } }
      }
    }
  }
};

export const GAME_CONFIG = {
  CANVAS: {
    WIDTH: 1024,
    HEIGHT: 768
  },
  ECONOMY: {
    STARTING_GOLD: 350,
    GOLD_PER_LEVEL_WIN: 50,
    SELL_REFUND_RATIO: 0.7,
    MAX_LEVEL: 5
  },
  BASE_STATS: {
    HP: 1000,
    SPEED: 200,
    ARMOR: 0,
    LIFESTEAL: 0,
    CRIT_CHANCE: 0,
    ARMOR_PEN: 0
  },
  SKILLS: {
    Q: {
      cooldown: 2000,
      config: { damage: 100, speed: 600, isPiercing: false }
    },
    E: {
      cooldown: 8000,
      dashDistance: 150
    },
    SPACE: {
      cooldown: 20000,
      config: { damage: 500, speed: 1000, isPiercing: true }
    }
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
  }
};

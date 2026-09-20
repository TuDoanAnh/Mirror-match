export const ALL_AUGMENTS = [
  {
    id: 'mysticSplit',
    tier: 'gold',
    name: 'Mystic Split',
    desc: 'Skillshot Q splits into 2 diagonal bolts after traveling 350px.',
    icon: '⚡',
    color: 0x38bdf8,
    incompatibleHeroes: ['riven'] // Riven Q is a 3-step melee slash combo, NOT a projectile
  },
  {
    id: 'arcaneMine',
    tier: 'diamond',
    name: 'Arcane Mine',
    desc: 'Dash E leaves an explosive mine at your departure point.',
    icon: '💣',
    color: 0xef4444,
    applicableHeroes: ['ezreal', 'zed'] // Only champions with Dash/Teleport E skills
  },
  {
    id: 'bladeFury',
    tier: 'gold',
    name: 'Blade Resonance',
    desc: 'Hitting enemies with skills grants +25% Speed & 15% Lifesteal for 4s.',
    icon: '⚔️',
    color: 0xf59e0b
  },
  {
    id: 'giantSlayer',
    tier: 'silver',
    name: 'Giant Slayer',
    desc: 'Deal +30% bonus damage against enemies with higher max HP.',
    icon: '🏹',
    color: 0x10b981
  },
  {
    id: 'vampiricSoul',
    tier: 'gold',
    name: 'Vampiric Soul',
    desc: 'Gain 18% Spell Vamp & heal for 15% of all skill damage dealt.',
    icon: '🩸',
    color: 0xec4899
  },
  {
    id: 'runicShield',
    tier: 'silver',
    name: 'Runic Valor',
    desc: 'Using E or Shield skills grants +30% Speed & +150 extra Shield.',
    icon: '🛡️',
    color: 0x6366f1
  },
  {
    id: 'bulletTime',
    tier: 'silver',
    name: 'Bullet Time',
    desc: 'Dodging close skillshots grants +40% Speed & instant reaction.',
    icon: '⏱️',
    color: 0xfacc15
  },
  {
    id: 'adrenaline',
    tier: 'gold',
    name: 'Adrenaline Rush',
    desc: 'Falling below 25% HP instantly resets cooldowns & grants 300 Shield.',
    icon: '💔',
    color: 0xec4899
  },
  {
    id: 'glassCannon',
    tier: 'diamond',
    name: 'Glass Cannon',
    desc: 'Deal +40% Damage, but your Max HP is reduced by 20%.',
    icon: '🗡️',
    color: 0xf87171
  },
  {
    id: 'staticShock',
    tier: 'diamond',
    name: 'Static Shock',
    desc: 'Every 3 skillshot hits releases a chain lightning nova dealing 120 DMG.',
    icon: '⚡',
    color: 0xa855f7
  }
];

export const REPEATABLE_STAT_AUGMENTS = [
  {
    id: 'stat_masteryOfArms',
    tier: 'silver',
    isRepeatable: true,
    name: 'Tối Thượng Vũ Khí',
    desc: 'Tăng vĩnh viễn +25 ATK & +5% Crit Chance.',
    icon: '🗡️',
    color: 0xef4444,
    statsDict: { bonusDamage: 25, critChance: 5 }
  },
  {
    id: 'stat_colossusHeart',
    tier: 'silver',
    isRepeatable: true,
    name: 'Trái Tim Dũng Sĩ',
    desc: 'Tăng vĩnh viễn +300 Max HP & +20 Armor.',
    icon: '❤️',
    color: 0x22c55e,
    statsDict: { bonusHP: 300, armor: 20 }
  },
  {
    id: 'stat_overdriveEnergy',
    tier: 'silver',
    isRepeatable: true,
    name: 'Overdrive Energy',
    desc: 'Tăng vĩnh viễn +20 Speed & +8% Cooldown Reduction.',
    icon: '⚡',
    color: 0x38bdf8,
    statsDict: { bonusSpeed: 20, cdr: 0.08 }
  },
  {
    id: 'stat_eternalThirst',
    tier: 'gold',
    isRepeatable: true,
    name: 'Khát Máu Trường Sống',
    desc: 'Tăng vĩnh viễn +8% Lifesteal & +10% Armor Pen.',
    icon: '🩸',
    color: 0xdc2626,
    statsDict: { lifesteal: 8, armorPen: 10 }
  }
];

export function getRandomAugments(count = 3, ownedAugments = [], heroId = 'ezreal') {
  const ownedIds = ownedAugments.map(a => a.id || a);
  const available = ALL_AUGMENTS.filter(a => {
    // 1. Filter out already owned augments
    if (ownedIds.includes(a.id)) return false;

    // 2. Filter out explicitly incompatible heroes
    if (a.incompatibleHeroes && a.incompatibleHeroes.includes(heroId)) return false;

    // 3. Filter allowed applicable heroes (if applicableHeroes specified)
    if (a.applicableHeroes && !a.applicableHeroes.includes(heroId)) return false;

    return true;
  });

  // Shuffle available unique augments
  const shuffled = [...available].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, count);

  // Fill remaining slots with Repeatable Stat Augments if needed
  if (selected.length < count) {
    const repeatableShuffled = [...REPEATABLE_STAT_AUGMENTS].sort(() => 0.5 - Math.random());
    let repIdx = 0;
    while (selected.length < count) {
      const repItem = repeatableShuffled[repIdx % repeatableShuffled.length];
      selected.push({
        ...repItem,
        instanceId: `${repItem.id}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
      });
      repIdx++;
    }
  }

  return selected;
}

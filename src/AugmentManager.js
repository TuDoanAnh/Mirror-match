export const ALL_AUGMENTS = [
  {
    id: 'mysticSplit',
    name: 'Mystic Split',
    desc: 'Skillshot Q splits into 2 diagonal bolts after traveling 350px.',
    icon: '⚡',
    color: 0x38bdf8,
    incompatibleHeroes: ['riven'] // Riven Q is a 3-step melee slash combo, NOT a projectile
  },
  {
    id: 'arcaneMine',
    name: 'Arcane Mine',
    desc: 'Dash E leaves an explosive mine at your departure point.',
    icon: '💣',
    color: 0xef4444,
    applicableHeroes: ['ezreal', 'zed'] // Only champions with Dash/Teleport E skills
  },
  {
    id: 'bladeFury',
    name: 'Blade Resonance',
    desc: 'Hitting enemies with skills grants +25% Speed & 15% Lifesteal for 4s.',
    icon: '⚔️',
    color: 0xf59e0b
  },
  {
    id: 'giantSlayer',
    name: 'Giant Slayer',
    desc: 'Deal +30% bonus damage against enemies with higher max HP.',
    icon: '🏹',
    color: 0x10b981
  },
  {
    id: 'vampiricSoul',
    name: 'Vampiric Soul',
    desc: 'Gain 18% Spell Vamp & heal for 15% of all skill damage dealt.',
    icon: '🩸',
    color: 0xec4899
  },
  {
    id: 'runicShield',
    name: 'Runic Valor',
    desc: 'Using E or Shield skills grants +30% Speed & +150 extra Shield.',
    icon: '🛡️',
    color: 0x6366f1
  },
  {
    id: 'bulletTime',
    name: 'Bullet Time',
    desc: 'Dodging close skillshots grants +40% Speed & instant reaction.',
    icon: '⏱️',
    color: 0xfacc15
  },
  {
    id: 'adrenaline',
    name: 'Adrenaline Rush',
    desc: 'Falling below 25% HP instantly resets cooldowns & grants 300 Shield.',
    icon: '💔',
    color: 0xec4899
  },
  {
    id: 'glassCannon',
    name: 'Glass Cannon',
    desc: 'Deal +40% Damage, but your Max HP is reduced by 20%.',
    icon: '🗡️',
    color: 0xf87171
  },
  {
    id: 'staticShock',
    name: 'Static Shock',
    desc: 'Every 3 skillshot hits releases a chain lightning nova dealing 120 DMG.',
    icon: '⚡',
    color: 0xa855f7
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

  // Shuffle available augments
  const shuffled = [...available].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

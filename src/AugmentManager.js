export const ALL_AUGMENTS = [
  {
    id: 'mysticSplit',
    name: 'Mystic Split',
    desc: 'Skillshot Q splits into 2 diagonal bolts after traveling 350px.',
    icon: '⚡',
    color: 0x38bdf8
  },
  {
    id: 'arcaneMine',
    name: 'Arcane Mine',
    desc: 'Dash E leaves an explosive mine at your departure point.',
    icon: '💣',
    color: 0xef4444
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

export function getRandomAugments(count = 3, ownedAugments = []) {
  const ownedIds = ownedAugments.map(a => a.id || a);
  const available = ALL_AUGMENTS.filter(a => !ownedIds.includes(a.id));
  
  // Shuffle available
  const shuffled = [...available].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

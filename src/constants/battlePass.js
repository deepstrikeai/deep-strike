// Season 1: "THE ZERO DIRECTIVE"
// 20 tiers, 500 XP each

export const CURRENT_SEASON = {
  id: 'season_01',
  name: 'THE ZERO DIRECTIVE',
  icon: '🤖',
  subtitle: 'SEASON 1',
  // Season end: 90 days from a fixed anchor date
  endDate: new Date('2026-06-08T00:00:00Z').getTime(),
  xpPerTier: 500,
  totalTiers: 20,
};

// reward types: shards, title, theme, xp_boost
export const SEASON_TIERS = [
  { tier: 1,  free: { type: 'shards',   label: '10 Shards',        icon: '🔹', amount: 10,  commanderId: null },  premium: { type: 'title',    label: 'RECRUIT.EXE',     icon: '🏷' } },
  { tier: 2,  free: { type: 'xp_boost', label: '+25 Commander XP', icon: '⚡', amount: 25 },                       premium: { type: 'shards',   label: '20 Shards',        icon: '🔷', amount: 20 } },
  { tier: 3,  free: { type: 'shards',   label: '15 Shards',        icon: '🔹', amount: 15,  commanderId: null },  premium: { type: 'shards',   label: '30 Shards',        icon: '🔷', amount: 30 } },
  { tier: 4,  free: { type: 'title',    label: 'NAVIGATOR',        icon: '🏷' },                                   premium: { type: 'xp_boost', label: '+50 Commander XP', icon: '⚡', amount: 50 } },
  { tier: 5,  free: { type: 'shards',   label: '20 Shards',        icon: '🔹', amount: 20,  commanderId: null },  premium: { type: 'shards',   label: '50 Shards',        icon: '💎', amount: 50 } },
  { tier: 6,  free: { type: 'xp_boost', label: '+30 Commander XP', icon: '⚡', amount: 30 },                       premium: { type: 'title',    label: 'GHOST PROTOCOL',   icon: '🏷' } },
  { tier: 7,  free: { type: 'shards',   label: '20 Shards',        icon: '🔹', amount: 20,  commanderId: null },  premium: { type: 'shards',   label: '40 Shards',        icon: '🔷', amount: 40 } },
  { tier: 8,  free: { type: 'title',    label: 'DEPTH HUNTER',     icon: '🏷' },                                   premium: { type: 'xp_boost', label: '+75 Commander XP', icon: '⚡', amount: 75 } },
  { tier: 9,  free: { type: 'shards',   label: '25 Shards',        icon: '🔹', amount: 25,  commanderId: null },  premium: { type: 'shards',   label: '60 Shards',        icon: '💎', amount: 60 } },
  { tier: 10, free: { type: 'shards',   label: '30 Shards',        icon: '🔹', amount: 30,  commanderId: null },  premium: { type: 'title',    label: 'IRON ADMIRAL',     icon: '🏷' } },
  { tier: 11, free: { type: 'xp_boost', label: '+40 Commander XP', icon: '⚡', amount: 40 },                       premium: { type: 'shards',   label: '50 Shards',        icon: '💎', amount: 50 } },
  { tier: 12, free: { type: 'shards',   label: '25 Shards',        icon: '🔹', amount: 25,  commanderId: null },  premium: { type: 'shards',   label: '75 Shards',        icon: '💎', amount: 75 } },
  { tier: 13, free: { type: 'title',    label: 'WAVE BREAKER',     icon: '🏷' },                                   premium: { type: 'xp_boost', label: '+100 XP',          icon: '⚡', amount: 100 } },
  { tier: 14, free: { type: 'shards',   label: '30 Shards',        icon: '🔹', amount: 30,  commanderId: null },  premium: { type: 'shards',   label: '80 Shards',        icon: '💎', amount: 80 } },
  { tier: 15, free: { type: 'shards',   label: '40 Shards',        icon: '🔹', amount: 40,  commanderId: null },  premium: { type: 'title',    label: 'ZERO OPERATIVE',   icon: '🏷' } },
  { tier: 16, free: { type: 'xp_boost', label: '+50 Commander XP', icon: '⚡', amount: 50 },                       premium: { type: 'shards',   label: '100 Shards',       icon: '💎', amount: 100 } },
  { tier: 17, free: { type: 'shards',   label: '35 Shards',        icon: '🔹', amount: 35,  commanderId: null },  premium: { type: 'xp_boost', label: '+150 XP',          icon: '⚡', amount: 150 } },
  { tier: 18, free: { type: 'title',    label: 'TIDAL FORCE',      icon: '🏷' },                                   premium: { type: 'shards',   label: '100 Shards',       icon: '💎', amount: 100 } },
  { tier: 19, free: { type: 'shards',   label: '50 Shards',        icon: '🔹', amount: 50,  commanderId: null },  premium: { type: 'title',    label: 'DIRECTOR ZERO',    icon: '🏷' } },
  { tier: 20, free: { type: 'shards',   label: '60 Shards',        icon: '🔹', amount: 60,  commanderId: null },  premium: { type: 'shards',   label: '200 Shards',       icon: '💎', amount: 200 } },
];

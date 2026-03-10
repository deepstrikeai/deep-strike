import AsyncStorage from '@react-native-async-storage/async-storage';
import { addBattlePassXP } from './battlePassService';

// ── Week key ──────────────────────────────────────────────────────────────────

const getWeekKey = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const weekNum = Math.floor((now - start) / (7 * 24 * 60 * 60 * 1000));
  return `week_${now.getFullYear()}_${weekNum}`;
};

// ── Stats keys ────────────────────────────────────────────────────────────────

const STATS_KEY = (weekKey) => `@deepstrike_challenge_stats_${weekKey}`;
const CLAIMED_KEY = (weekKey) => `@deepstrike_challenge_claimed_${weekKey}`;

// ── Challenge pool ────────────────────────────────────────────────────────────

const CHALLENGE_POOL = [
  { id: 'win_2',       stat: 'wins',       target: 2,  label: 'Win 2 battles',              icon: '🏆', bpXP: 100 },
  { id: 'win_3',       stat: 'wins',       target: 3,  label: 'Win 3 battles',              icon: '🏆', bpXP: 150 },
  { id: 'win_5',       stat: 'wins',       target: 5,  label: 'Win 5 battles',              icon: '🏆', bpXP: 250 },
  { id: 'play_3',      stat: 'games',      target: 3,  label: 'Play 3 games',               icon: '⚓', bpXP: 75  },
  { id: 'play_5',      stat: 'games',      target: 5,  label: 'Play 5 games',               icon: '⚓', bpXP: 100 },
  { id: 'play_7',      stat: 'games',      target: 7,  label: 'Play 7 games',               icon: '⚓', bpXP: 150 },
  { id: 'campaign_1',  stat: 'missions',   target: 1,  label: 'Complete a campaign mission', icon: '📖', bpXP: 125 },
  { id: 'campaign_2',  stat: 'missions',   target: 2,  label: 'Complete 2 campaign missions',icon: '📖', bpXP: 200 },
  { id: 'daily_1',     stat: 'daily',      target: 1,  label: 'Complete the daily challenge',icon: '📅', bpXP: 125 },
  { id: 'win_streak_2',stat: 'win_streak', target: 2,  label: 'Win 2 games in a row',       icon: '🔥', bpXP: 175 },
];

// Pick 3 challenges for the current week (seeded by week number)
const seededRand = (seed) => {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xFFFFFFFF;
    return (s >>> 0) / 0xFFFFFFFF;
  };
};

export const getWeeklyChallenges = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const weekNum = Math.floor((now - start) / (7 * 24 * 60 * 60 * 1000));
  const rand = seededRand(weekNum * 31337);

  const pool = [...CHALLENGE_POOL];
  const selected = [];
  while (selected.length < 3 && pool.length > 0) {
    const idx = Math.floor(rand() * pool.length);
    selected.push(pool.splice(idx, 1)[0]);
  }
  return selected;
};

// ── Stats ─────────────────────────────────────────────────────────────────────

export const getWeeklyStats = async () => {
  const weekKey = getWeekKey();
  try {
    const raw = await AsyncStorage.getItem(STATS_KEY(weekKey));
    return raw ? JSON.parse(raw) : { wins: 0, games: 0, missions: 0, daily: 0, win_streak: 0 };
  } catch {
    return { wins: 0, games: 0, missions: 0, daily: 0, win_streak: 0 };
  }
};

export const incrementStat = async (stat, amount = 1) => {
  const weekKey = getWeekKey();
  try {
    const stats = await getWeeklyStats();
    stats[stat] = (stats[stat] || 0) + amount;
    // Win streak: reset on loss
    if (stat === 'loss') { stats.win_streak = 0; }
    await AsyncStorage.setItem(STATS_KEY(weekKey), JSON.stringify(stats));
    return stats;
  } catch { return null; }
};

// ── Claimed ───────────────────────────────────────────────────────────────────

export const getClaimedChallenges = async () => {
  const weekKey = getWeekKey();
  try {
    const raw = await AsyncStorage.getItem(CLAIMED_KEY(weekKey));
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};

export const claimChallengeReward = async (challengeId) => {
  const weekKey = getWeekKey();
  try {
    const claimed = await getClaimedChallenges();
    if (claimed.includes(challengeId)) return { alreadyClaimed: true };
    const challenge = CHALLENGE_POOL.find(c => c.id === challengeId);
    if (!challenge) return null;
    claimed.push(challengeId);
    await AsyncStorage.setItem(CLAIMED_KEY(weekKey), JSON.stringify(claimed));
    await addBattlePassXP(challenge.bpXP);
    return { alreadyClaimed: false, bpXP: challenge.bpXP };
  } catch { return null; }
};

// ── Full status ───────────────────────────────────────────────────────────────

export const getWeeklyChallengeStatus = async () => {
  const [challenges, stats, claimed] = await Promise.all([
    Promise.resolve(getWeeklyChallenges()),
    getWeeklyStats(),
    getClaimedChallenges(),
  ]);
  // Days until Monday reset
  const now = new Date();
  const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
  return challenges.map(c => ({
    ...c,
    progress: Math.min(c.target, stats[c.stat] || 0),
    completed: (stats[c.stat] || 0) >= c.target,
    claimed:   claimed.includes(c.id),
    daysLeft:  daysUntilMonday,
  }));
};

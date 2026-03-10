import AsyncStorage from '@react-native-async-storage/async-storage';
import { CURRENT_SEASON, SEASON_TIERS } from '../constants/battlePass';
import { addCommanderShards } from './commanderService';
import { addCommanderXP } from './commanderService';

const XP_KEY      = `@deepstrike_bp_xp_${CURRENT_SEASON.id}`;
const CLAIMED_KEY = `@deepstrike_bp_claimed_${CURRENT_SEASON.id}`;
const PASS_KEY    = `@deepstrike_bp_unlocked_${CURRENT_SEASON.id}`;

// ── XP ────────────────────────────────────────────────────────────────────────

export const getBattlePassXP = async () => {
  try {
    const raw = await AsyncStorage.getItem(XP_KEY);
    return raw ? parseInt(raw, 10) : 0;
  } catch { return 0; }
};

export const addBattlePassXP = async (amount) => {
  try {
    const current = await getBattlePassXP();
    const newXP = current + amount;
    await AsyncStorage.setItem(XP_KEY, String(newXP));
    const oldTier = getTierFromXP(current);
    const newTier = getTierFromXP(newXP);
    return { newXP, oldTier, newTier, tierUp: newTier > oldTier };
  } catch { return { newXP: 0, oldTier: 0, newTier: 0, tierUp: false }; }
};

export const getTierFromXP = (xp) => {
  return Math.min(
    CURRENT_SEASON.totalTiers,
    Math.floor(xp / CURRENT_SEASON.xpPerTier) + 1
  );
};

export const getXPProgressInTier = (xp) => {
  const tierXP = xp % CURRENT_SEASON.xpPerTier;
  return { current: tierXP, total: CURRENT_SEASON.xpPerTier, pct: tierXP / CURRENT_SEASON.xpPerTier };
};

// ── Premium Pass ──────────────────────────────────────────────────────────────

export const isBattlePassUnlocked = async () => {
  try {
    const val = await AsyncStorage.getItem(PASS_KEY);
    return val === 'true';
  } catch { return false; }
};

export const unlockBattlePass = async () => {
  await AsyncStorage.setItem(PASS_KEY, 'true');
};

// ── Claimed Rewards ───────────────────────────────────────────────────────────

export const getClaimedRewards = async () => {
  try {
    const raw = await AsyncStorage.getItem(CLAIMED_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
};

// claimKey format: `${tier}_free` or `${tier}_premium`
export const claimReward = async (tier, track, commanderId = null) => {
  try {
    const tierData = SEASON_TIERS.find(t => t.tier === tier);
    if (!tierData) return null;
    const reward = tierData[track];
    if (!reward) return null;

    const claimed = await getClaimedRewards();
    const key = `${tier}_${track}`;
    if (claimed[key]) return { alreadyClaimed: true };

    claimed[key] = true;
    await AsyncStorage.setItem(CLAIMED_KEY, JSON.stringify(claimed));

    // Apply reward
    if (reward.type === 'shards' && commanderId) {
      await addCommanderShards(commanderId, reward.amount);
    } else if (reward.type === 'xp_boost' && commanderId) {
      await addCommanderXP(commanderId, reward.amount);
    }
    // Titles are cosmetic — stored in claimed state, displayed in profile

    return { alreadyClaimed: false, reward };
  } catch { return null; }
};

// ── Days Remaining ────────────────────────────────────────────────────────────

export const getDaysRemaining = () => {
  const diff = CURRENT_SEASON.endDate - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

// ── Full Status ───────────────────────────────────────────────────────────────

export const getBattlePassStatus = async () => {
  const [xp, claimed, passUnlocked] = await Promise.all([
    getBattlePassXP(),
    getClaimedRewards(),
    isBattlePassUnlocked(),
  ]);
  const currentTier = getTierFromXP(xp);
  const progress    = getXPProgressInTier(xp);
  const daysLeft    = getDaysRemaining();
  return { xp, currentTier, progress, claimed, passUnlocked, daysLeft };
};

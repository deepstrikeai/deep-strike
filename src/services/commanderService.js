import AsyncStorage from '@react-native-async-storage/async-storage';
import { COMMANDERS, RARITY } from '../constants/gameConstants';

const OWNED_KEY = '@deepstrike_owned_commanders';
const XP_KEY = '@deepstrike_commander_xp';
const ROTATION_KEY = '@deepstrike_free_rotation';

// ── Free Rotation ────────────────────────────────────────────────────────────

const getWeekNumber = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now - start;
  return Math.floor(diff / (7 * 24 * 60 * 60 * 1000));
};

const ROTATION_POOLS = {
  week1: ['admiral_nova', 'commander_zero', 'captain_coral'],
  week2: ['captain_bubbles', 'admiral_blackwood', 'commander_zero'],
  week3: ['admiral_nova', 'captain_coral', 'admiral_blackwood'],
  week4: ['captain_bubbles', 'commander_zero', 'admiral_nova'],
};

export const getFreeRotation = async () => {
  const weekNum = getWeekNumber();
  const poolKey = `week${(weekNum % 4) + 1}`;
  return ['gruffbeard', ...ROTATION_POOLS[poolKey]]; // Gruffbeard always free
};

// ── Commander Ownership ──────────────────────────────────────────────────────

export const getOwnedCommanders = async () => {
  try {
    const raw = await AsyncStorage.getItem(OWNED_KEY);
    return raw ? JSON.parse(raw) : ['gruffbeard']; // Gruffbeard is always owned
  } catch {
    return ['gruffbeard'];
  }
};

export const unlockCommander = async (commanderId) => {
  try {
    const owned = await getOwnedCommanders();
    if (!owned.includes(commanderId)) {
      owned.push(commanderId);
      await AsyncStorage.setItem(OWNED_KEY, JSON.stringify(owned));
    }
  } catch {}
};

export const isCommanderOwned = async (commanderId) => {
  const owned = await getOwnedCommanders();
  return owned.includes(commanderId);
};

export const isCommanderAvailable = async (commanderId) => {
  // Available = owned OR in free rotation OR premium unlocked
  const owned = await isCommanderOwned(commanderId);
  if (owned) return true;

  const rotation = await getFreeRotation();
  if (rotation.includes(commanderId)) return true;

  // Check premium unlock (all commanders unlocked if premium)
  const premiumKey = '@deepstrike_premium';
  const isPremium = await AsyncStorage.getItem(premiumKey);
  return isPremium === 'true';
};

// ── Commander XP & Leveling ──────────────────────────────────────────────────

export const XP_PER_LEVEL = [0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700, 3250]; // Level 0-10

export const getCommanderXP = async (commanderId) => {
  try {
    const raw = await AsyncStorage.getItem(XP_KEY);
    const all = raw ? JSON.parse(raw) : {};
    return all[commanderId] || { xp: 0, level: 1 };
  } catch {
    return { xp: 0, level: 1 };
  }
};

export const addCommanderXP = async (commanderId, xpAmount) => {
  try {
    const raw = await AsyncStorage.getItem(XP_KEY);
    const all = raw ? JSON.parse(raw) : {};
    const current = all[commanderId] || { xp: 0, level: 1 };

    current.xp += xpAmount;

    // Calculate new level
    let newLevel = current.level;
    while (newLevel < 10 && current.xp >= XP_PER_LEVEL[newLevel + 1]) {
      newLevel++;
    }

    const leveledUp = newLevel > current.level;
    current.level = newLevel;

    all[commanderId] = current;
    await AsyncStorage.setItem(XP_KEY, JSON.stringify(all));

    return { newLevel, leveledUp, xp: current.xp };
  } catch {
    return { newLevel: 1, leveledUp: false, xp: 0 };
  }
};

export const getCommanderLevel = async (commanderId) => {
  const data = await getCommanderXP(commanderId);
  return data.level;
};

export const getXPForNextLevel = (currentLevel) => {
  if (currentLevel >= 10) return 0;
  return XP_PER_LEVEL[currentLevel + 1];
};

// ── Commander Shards (for unlocking via gameplay) ────────────────────────────

const SHARDS_KEY = '@deepstrike_commander_shards';
const SHARDS_TO_UNLOCK = 50;

export const getCommanderShards = async (commanderId) => {
  try {
    const raw = await AsyncStorage.getItem(SHARDS_KEY);
    const all = raw ? JSON.parse(raw) : {};
    return all[commanderId] || 0;
  } catch {
    return 0;
  }
};

export const addCommanderShards = async (commanderId, amount) => {
  try {
    const raw = await AsyncStorage.getItem(SHARDS_KEY);
    const all = raw ? JSON.parse(raw) : {};
    all[commanderId] = (all[commanderId] || 0) + amount;
    await AsyncStorage.setItem(SHARDS_KEY, JSON.stringify(all));

    // Auto-unlock if reached threshold
    if (all[commanderId] >= SHARDS_TO_UNLOCK) {
      await unlockCommander(commanderId);
      return { unlocked: true, shards: all[commanderId] };
    }

    return { unlocked: false, shards: all[commanderId] };
  } catch {
    return { unlocked: false, shards: 0 };
  }
};

// ── Helper Functions ─────────────────────────────────────────────────────────

export const getCommanderById = (id) => COMMANDERS.find(c => c.id === id);

export const getCommandersByRarity = (rarity) => COMMANDERS.filter(c => c.rarity === rarity);

export const getAllCommandersStatus = async () => {
  const owned = await getOwnedCommanders();
  const rotation = await getFreeRotation();

  return Promise.all(COMMANDERS.map(async (cmd) => {
    const isOwned = owned.includes(cmd.id);
    const inRotation = rotation.includes(cmd.id);
    const { xp, level } = await getCommanderXP(cmd.id);
    const shards = await getCommanderShards(cmd.id);

    return {
      ...cmd,
      owned: isOwned,
      available: isOwned || inRotation,
      inRotation,
      xp,
      level,
      shards,
    };
  }));
};

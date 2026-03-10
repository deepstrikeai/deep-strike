import AsyncStorage from '@react-native-async-storage/async-storage';

const PREMIUM_KEY = '@deepstrike_premium';
const PLAYER_ID_KEY = '@deepstrike_player_id';

const generatePlayerId = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return 'ds_' + Array.from({ length: 16 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

export const getOrCreatePlayerId = async () => {
  try {
    let id = await AsyncStorage.getItem(PLAYER_ID_KEY);
    if (!id) {
      id = generatePlayerId();
      await AsyncStorage.setItem(PLAYER_ID_KEY, id);
    }
    return id;
  } catch {
    return generatePlayerId();
  }
};

export const isPremiumUnlocked = async () => {
  try {
    const val = await AsyncStorage.getItem(PREMIUM_KEY);
    return val === 'true';
  } catch {
    return false;
  }
};

export const setPremiumUnlocked = async () => {
  try {
    await AsyncStorage.setItem(PREMIUM_KEY, 'true');
  } catch {}
};

export const clearAllLocalData = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const deepStrikeKeys = keys.filter(k => k.startsWith('@deepstrike'));
    if (deepStrikeKeys.length > 0) await AsyncStorage.multiRemove(deepStrikeKeys);
  } catch {}
};

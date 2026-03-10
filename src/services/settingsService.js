import AsyncStorage from '@react-native-async-storage/async-storage';

const VOICE_ONLY_KEY = '@deepstrike_voice_only_mode';

export const getVoiceOnlyMode = async () => {
  try {
    const val = await AsyncStorage.getItem(VOICE_ONLY_KEY);
    return val === 'true';
  } catch { return false; }
};

export const setVoiceOnlyMode = async (enabled) => {
  await AsyncStorage.setItem(VOICE_ONLY_KEY, enabled ? 'true' : 'false');
};

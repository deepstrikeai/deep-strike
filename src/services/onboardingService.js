import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@deepstrike_onboarding_done';

export const isOnboardingDone = async () => {
  try {
    const val = await AsyncStorage.getItem(KEY);
    return val === 'true';
  } catch {
    return false;
  }
};

export const markOnboardingDone = async () => {
  try {
    await AsyncStorage.setItem(KEY, 'true');
  } catch {}
};

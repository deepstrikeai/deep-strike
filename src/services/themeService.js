import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = '@deepstrike_grid_theme';

export const GRID_THEMES = [
  {
    id: 'deep_ocean',
    name: 'DEEP OCEAN',
    icon: '🌊',
    free: true,
    bg: ['#06080E', '#09111D', '#06080E'],
    gridTint: 'rgba(0,229,255,0.06)',
    gridBorder: 'rgba(0,229,255,0.15)',
    accentColor: '#00E5FF',
  },
  {
    id: 'arctic',
    name: 'ARCTIC ICE',
    icon: '❄️',
    free: false,
    bg: ['#080E14', '#0B1A28', '#080E14'],
    gridTint: 'rgba(147,220,255,0.05)',
    gridBorder: 'rgba(147,220,255,0.2)',
    accentColor: '#93DCFF',
  },
  {
    id: 'volcanic',
    name: 'VOLCANIC',
    icon: '🌋',
    free: false,
    bg: ['#120806', '#1A0E08', '#120806'],
    gridTint: 'rgba(255,80,30,0.04)',
    gridBorder: 'rgba(255,100,50,0.2)',
    accentColor: '#FF6432',
  },
];

export const getActiveTheme = async () => {
  try {
    const id = await AsyncStorage.getItem(THEME_KEY);
    return GRID_THEMES.find(t => t.id === id) || GRID_THEMES[0];
  } catch {
    return GRID_THEMES[0];
  }
};

export const setActiveTheme = async (themeId) => {
  try {
    await AsyncStorage.setItem(THEME_KEY, themeId);
  } catch {}
};

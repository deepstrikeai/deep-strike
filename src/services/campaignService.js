import AsyncStorage from '@react-native-async-storage/async-storage';

const PROGRESS_KEY = '@deepstrike_campaign_progress';

// stars: 1-3 based on accuracy thresholds
export const calcStars = (shots, shipCells) => {
  const accuracy = shipCells / shots;
  if (accuracy >= 0.7) return 3;
  if (accuracy >= 0.4) return 2;
  return 1;
};

export const getCampaignProgress = async () => {
  try {
    const raw = await AsyncStorage.getItem(PROGRESS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

// progress[campaignId][missionId] = { stars, shots, completed }
export const saveMissionResult = async (campaignId, missionId, stars, shots) => {
  try {
    const progress = await getCampaignProgress();
    if (!progress[campaignId]) progress[campaignId] = {};
    const existing = progress[campaignId][missionId];
    // Keep best stars
    progress[campaignId][missionId] = {
      stars: existing ? Math.max(existing.stars, stars) : stars,
      shots,
      completed: true,
    };
    await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    return progress[campaignId][missionId];
  } catch {
    return null;
  }
};

export const getMissionResult = async (campaignId, missionId) => {
  const progress = await getCampaignProgress();
  return progress[campaignId]?.[missionId] || null;
};

export const isMissionUnlocked = async (campaignId, missions, missionIndex) => {
  if (missionIndex === 0) return true;
  const progress = await getCampaignProgress();
  const prevMission = missions[missionIndex - 1];
  return !!progress[campaignId]?.[prevMission.id]?.completed;
};

export const getAllMissionStatuses = async (campaignId, missions) => {
  const progress = await getCampaignProgress();
  const camp = progress[campaignId] || {};
  return missions.map((m, i) => {
    const prev = i === 0 ? null : missions[i - 1];
    const unlocked = i === 0 || !!camp[prev.id]?.completed;
    return {
      ...m,
      unlocked,
      result: camp[m.id] || null,
    };
  });
};

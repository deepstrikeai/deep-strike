import { useEffect, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';

const SOUNDS = {
  hit:  require('../../assets/sounds/hit.wav'),
  miss: require('../../assets/sounds/miss.wav'),
  sunk: require('../../assets/sounds/sunk.wav'),
  win:  require('../../assets/sounds/win.wav'),
  lose: require('../../assets/sounds/lose.wav'),
};

export const useSoundEffects = () => {
  const soundRefs = useRef({});

  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    });

    const loadAll = async () => {
      for (const [key, source] of Object.entries(SOUNDS)) {
        try {
          const { sound } = await Audio.Sound.createAsync(source, { volume: 1.0 });
          soundRefs.current[key] = sound;
        } catch (e) {
          // silently skip if a file is missing
        }
      }
    };

    loadAll();

    return () => {
      for (const sound of Object.values(soundRefs.current)) {
        sound?.unloadAsync();
      }
    };
  }, []);

  const play = useCallback(async (key) => {
    try {
      const sound = soundRefs.current[key];
      if (!sound) return;
      await sound.setPositionAsync(0);
      await sound.playAsync();
    } catch (e) {
      // ignore playback errors
    }
  }, []);

  return { play };
};

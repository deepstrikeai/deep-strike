// attService.js
// App Tracking Transparency (iOS 14.5+)
//
// Must be called BEFORE initialising AdMob.
// On Android or older iOS this is a no-op.
// Returns true if tracking is authorised (or not applicable),
// false if the user denied — callers can switch to non-personalised ads.

import { Platform } from 'react-native';

let _requestPermission = null;
let _getStatus = null;

// Lazy-load so the module is not imported on Android (where it's a no-op)
const _load = async () => {
  if (Platform.OS !== 'ios') return;
  if (_requestPermission) return;
  try {
    const mod = await import('expo-tracking-transparency');
    _requestPermission = mod.requestTrackingPermissionsAsync;
    _getStatus = mod.getTrackingPermissionsAsync;
  } catch {
    // Module unavailable (e.g. Expo Go) — treat as authorised
  }
};

/**
 * Request ATT permission on iOS 14.5+.
 * Returns true if personalised ads are allowed, false otherwise.
 */
export const requestATT = async () => {
  if (Platform.OS !== 'ios') return true;

  await _load();
  if (!_requestPermission) return true; // Expo Go fallback

  try {
    const { status } = await _requestPermission();
    return status === 'authorized';
  } catch {
    return true; // Don't block app on unexpected error
  }
};

/**
 * Check existing ATT status without showing the prompt.
 * Useful to decide ad personalisation on subsequent launches.
 */
export const getATTStatus = async () => {
  if (Platform.OS !== 'ios') return 'authorized';

  await _load();
  if (!_getStatus) return 'authorized';

  try {
    const { status } = await _getStatus();
    return status; // 'authorized' | 'denied' | 'restricted' | 'undetermined'
  } catch {
    return 'authorized';
  }
};

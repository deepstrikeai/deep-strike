import AsyncStorage from '@react-native-async-storage/async-storage';
import { InterstitialAd, AdEventType, TestIds } from 'react-native-google-mobile-ads';
import { Platform } from 'react-native';
import { isPremiumUnlocked } from './premiumService';
import { captureException } from './sentryService';

// ── Ad Unit IDs ───────────────────────────────────────────────────────────────
// Replace TEST_IDS with real Ad Unit IDs from AdMob console before production build.
// Create separate ad units for iOS and Android in AdMob → Apps → Ad units.
// Create one Interstitial unit + one Banner unit per platform (4 units total).
//
// Real IDs look like: ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX
//
// App IDs (go in app.json, NOT here):
//   iOS:     ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX
//   Android: ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX

const AD_UNIT_ID = __DEV__
  ? TestIds.INTERSTITIAL  // Test ad — always use in dev/TestFlight
  : Platform.select({
      ios:     'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',  // TODO: replace with real iOS interstitial ad unit ID
      android: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',  // TODO: replace with real Android interstitial ad unit ID
    });

// Banner ad unit ID — used by AdBanner component on HomeScreen / GameOverScreen
export const BANNER_AD_UNIT_ID = __DEV__
  ? TestIds.BANNER
  : Platform.select({
      ios:     'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',  // TODO: replace with real iOS banner ad unit ID
      android: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',  // TODO: replace with real Android banner ad unit ID
    });

// ── Config ────────────────────────────────────────────────────────────────────

const GAMES_KEY      = '@deepstrike_games_played';
const AD_INTERVAL    = 5;  // Show ad every N games for free users

// ── Internal state ────────────────────────────────────────────────────────────

let _ad = null;
let _adLoaded = false;
let _loading = false;

// ── Load ad ───────────────────────────────────────────────────────────────────

function _loadAd() {
  if (_loading || _adLoaded) return;
  _loading = true;

  try {
    _ad = InterstitialAd.createForAdRequest(AD_UNIT_ID, {
      requestNonPersonalizedAdsOnly: false,
    });

    _ad.addAdEventListener(AdEventType.LOADED, () => {
      _adLoaded = true;
      _loading = false;
    });

    _ad.addAdEventListener(AdEventType.CLOSED, () => {
      _adLoaded = false;
      _loading = false;
      _ad = null;
      // Pre-load next ad immediately after close
      _loadAd();
    });

    _ad.addAdEventListener(AdEventType.ERROR, (error) => {
      _adLoaded = false;
      _loading = false;
      _ad = null;
      captureException(new Error(`AdMob load error: ${error?.message}`));
    });

    _ad.load();
  } catch (e) {
    _loading = false;
    captureException(e);
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Call once at app startup to pre-load the first ad.
 * Safe to call multiple times — only loads if not already loading/loaded.
 */
export const initAds = () => {
  _loadAd();
};

/**
 * Increment game count and, if free tier + interval hit, show an interstitial.
 * Returns a Promise that resolves when the ad closes (or immediately if no ad shown).
 * Always call this before navigating to the next game.
 *
 * Usage in GameOverScreen:
 *   await maybeShowAd();
 *   onPlayAgain();
 */
export const maybeShowAd = async () => {
  // Premium users never see ads
  const premium = await isPremiumUnlocked();
  if (premium) return;

  // Increment game count
  let count = 0;
  try {
    const stored = await AsyncStorage.getItem(GAMES_KEY);
    count = stored ? parseInt(stored, 10) : 0;
    count += 1;
    await AsyncStorage.setItem(GAMES_KEY, String(count));
  } catch {
    return;
  }

  // Only show on every Nth game
  if (count % AD_INTERVAL !== 0) return;

  // Show ad if loaded
  if (_adLoaded && _ad) {
    return new Promise((resolve) => {
      // Override close listener to resolve the promise
      _ad.addAdEventListener(AdEventType.CLOSED, () => {
        resolve();
      });
      _ad.addAdEventListener(AdEventType.ERROR, () => {
        resolve(); // Don't block on ad error
      });
      try {
        _ad.show();
      } catch {
        resolve();
      }
    });
  }
  // Ad wasn't ready — start loading for next time, don't block user
  _loadAd();
};

/**
 * Get total games played (for analytics / debug).
 */
export const getGamesPlayed = async () => {
  try {
    const stored = await AsyncStorage.getItem(GAMES_KEY);
    return stored ? parseInt(stored, 10) : 0;
  } catch {
    return 0;
  }
};

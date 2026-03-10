// analyticsService.js
// Lightweight event tracker for Deep Strike.
//
// In dev:  all events are logged to the console.
// In prod: events are buffered locally (AsyncStorage) so we don't lose them,
//          and flushed to a Firestore 'analytics' collection in small batches.
//          Swap the flush function for Mixpanel / Amplitude / PostHog as needed.
//
// Key design choice: every public function is fire-and-forget (returns void).
// No screen should await analytics calls.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const QUEUE_KEY = '@deepstrike_analytics';
const MAX_QUEUE  = 30;   // flush when we hit this many queued events
const FLUSH_INTERVAL_MS = 60_000; // also flush on a 60-second timer

// ── Event name constants ───────────────────────────────────────────────────────

export const EVENTS = {
  // Navigation / sessions
  APP_OPEN:              'app_open',

  // Gameplay
  GAME_START:            'game_start',         // { mode, commander, difficulty }
  GAME_END:              'game_end',            // { mode, winner, shots, commander }
  DAILY_COMPLETED:       'daily_completed',     // { shots, stars }
  CAMPAIGN_COMPLETED:    'campaign_completed',  // { campaignId, missionId, stars }

  // Monetisation
  PAYWALL_SHOWN:         'paywall_shown',       // { source }
  IAP_INITIATED:         'iap_initiated',       // { productId }
  IAP_COMPLETED:         'iap_completed',       // { productId }
  IAP_CANCELLED:         'iap_cancelled',       // { productId }
  IAP_FAILED:            'iap_failed',          // { productId, error }
  IAP_RESTORED:          'iap_restored',        // { count }

  // Engagement
  COMMANDER_SELECTED:    'commander_selected',  // { commanderId, isPremium }
  BP_TIER_CLAIMED:       'bp_tier_claimed',     // { tier, track }
  CHALLENGE_CLAIMED:     'challenge_claimed',   // { challengeId, bpXP }
  VOICE_COMMAND:         'voice_command',       // { type }

  // Errors (non-fatal)
  ERROR:                 'error',               // { screen, message }
};

// ── Internal queue ─────────────────────────────────────────────────────────────

let _queue   = [];
let _timer   = null;
let _flushing = false;
let _playerId = null; // set once during app init

export const setAnalyticsUser = (id) => {
  _playerId = id;
};

// ── Public API ─────────────────────────────────────────────────────────────────

export const track = (eventName, params = {}) => {
  const event = {
    event:     eventName,
    params,
    ts:        Date.now(),
    playerId:  _playerId,
  };

  if (__DEV__) {
    console.log(`[Analytics] ${eventName}`, params);
    return; // don't write to Firestore in dev
  }

  _queue.push(event);

  if (_queue.length >= MAX_QUEUE) {
    _flush();
  } else if (!_timer) {
    _timer = setTimeout(_flush, FLUSH_INTERVAL_MS);
  }
};

// Flush immediately (call on app backgrounding)
export const flushAnalytics = () => _flush();

// ── Internal flush ─────────────────────────────────────────────────────────────

const _flush = async () => {
  if (_flushing || _queue.length === 0) return;
  _flushing = true;

  clearTimeout(_timer);
  _timer = null;

  const batch = _queue.splice(0, MAX_QUEUE);

  try {
    const ref = collection(db, 'analytics');
    await Promise.allSettled(
      batch.map(ev =>
        addDoc(ref, { ...ev, serverTs: serverTimestamp() })
      )
    );
  } catch {
    // Silently drop — analytics must never crash the app
    // Persist failed batch to AsyncStorage for next launch retry
    try {
      const saved = await AsyncStorage.getItem(QUEUE_KEY);
      const prev  = saved ? JSON.parse(saved) : [];
      const combined = [...prev, ...batch].slice(-MAX_QUEUE);
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(combined));
    } catch {}
  }

  _flushing = false;
};

// On init: replay any events that failed to flush in a previous session
export const initAnalytics = async (playerId) => {
  if (playerId) _playerId = playerId;
  if (__DEV__) return;

  try {
    const saved = await AsyncStorage.getItem(QUEUE_KEY);
    if (saved) {
      const stale = JSON.parse(saved);
      if (stale.length > 0) {
        _queue = [...stale, ..._queue];
        await AsyncStorage.removeItem(QUEUE_KEY);
        _flush();
      }
    }
  } catch {}

  // Track app open
  track(EVENTS.APP_OPEN);
};

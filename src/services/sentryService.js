// sentryService.js
// Crash reporting via Sentry.
//
// Setup steps:
//   1. Create a free project at https://sentry.io (React Native / Expo type)
//   2. Copy your DSN and paste it in the SENTRY_DSN constant below.
//   3. Run `eas build` — Sentry will auto-upload source maps so stack traces
//      show original source instead of minified bundle.
//
// The initSentry() call in App.js is a no-op if DSN is empty,
// so the app works fine before you add a real DSN.

import * as Sentry from '@sentry/react-native';

// ── Replace with your real DSN from sentry.io ─────────────────────────────────
const SENTRY_DSN = 'https://2350d78683673788788300ea0095a4b9@o4511046639878144.ingest.us.sentry.io/4511046643417088';
// Example: 'https://abcdef1234567890@o123456.ingest.sentry.io/1234567'
// ─────────────────────────────────────────────────────────────────────────────

let _initialized = false;

export const initSentry = () => {
  if (!SENTRY_DSN || _initialized) return;

  Sentry.init({
    dsn: SENTRY_DSN,
    // Don't send events in dev — use console instead
    enabled: !__DEV__,
    // Sample 20% of performance transactions to stay on free tier
    tracesSampleRate: 0.2,
    // Don't send sensitive URL params
    sendDefaultPii: false,
  });

  _initialized = true;
};

// Report a caught error (e.g. from a try/catch you care about)
export const captureException = (error, context = {}) => {
  if (!_initialized) {
    if (__DEV__) console.warn('[Sentry] captureException (not initialized):', error);
    return;
  }
  Sentry.withScope(scope => {
    Object.entries(context).forEach(([k, v]) => scope.setExtra(k, v));
    Sentry.captureException(error);
  });
};

// Log a custom message (low-severity, e.g. "IAP product not found")
export const captureMessage = (msg, level = 'warning') => {
  if (!_initialized) {
    if (__DEV__) console.warn(`[Sentry] captureMessage (${level}):`, msg);
    return;
  }
  Sentry.captureMessage(msg, level);
};

// Add a breadcrumb — handy for tracing the steps leading to a crash
export const addBreadcrumb = (category, message, data = {}) => {
  if (!_initialized) return;
  Sentry.addBreadcrumb({ category, message, data, level: 'info' });
};

// Identify the current player so crash reports show their ID
export const setUser = (playerId) => {
  if (!_initialized) return;
  Sentry.setUser(playerId ? { id: playerId } : null);
};

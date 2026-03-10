# Deep Strike — Session Notes
_Last updated: March 10, 2026_

> **When starting a new session:** Read this file top to bottom, then check `APP_STORE_CHECKLIST.md` to see what's left before submitting.

---

## Session: March 10, 2026 — Instagram Logo + GitHub Setup

### Instagram Profile Logo
- Created `assets/logo-instagram.svg` — 1080×1080px Instagram-ready SVG
- Design: dark navy `#06080E` bg, electric cyan `#00E5FF`, gold `#FFB300`
- Elements: targeting reticle, torpedo, HUD corner brackets, scanline texture, dot-grid, tactical readouts, glow filters
- Fonts: Orbitron 900 (title) + Share Tech Mono (subtitle/HUD)
- Tagline on logo: "NAVAL COMBAT COMMAND"

### Social Copy (drafted, not yet posted)
- **Instagram bio:** `Naval combat. 6 commanders. Your move. ⚓ Deep Strike — dropping soon.`
  - Link: App Store / landing page
  - Highlights: Commanders | Game Modes | Ranked | Updates
- **TikTok bio:** `Naval combat game dropping soon ⚓ | 6 commanders | Voice commands | Real-time battles`
  - Username options: `@deepstrikeapp` / `@playdeepstrike`

### GitHub — Both repos initialized and pushed (private)
- `git config` set: Shantanu Govindjiwala / shantanu1508@gmail.com
- Both repos are private under GitHub account `govindjiwalashantanu`
- Repo URLs:
  - App: `https://github.com/govindjiwalashantanu/deep-strike`
  - Reel Generator: `https://github.com/govindjiwalashantanu/deep-strike-videos`
- To clone on another machine:
  ```bash
  git clone https://github.com/govindjiwalashantanu/deep-strike.git
  git clone https://github.com/govindjiwalashantanu/deep-strike-videos.git
  cd deep-strike && npm install
  cd ../deep-strike-videos && npm install
  ```

---

## Session: March 10, 2026 — Reel Generator v2

### Reel Generator (`deep-strike-videos/`) — 8 templates, autopilot rotation, white UI

**8 animation templates (5 new ✦):**
| Key | Name | Frames | Music | Vibe |
|---|---|---|---|---|
| `grid-reveal` | Launch Reel | 330 | combat-beat | Military march |
| `commander` | Commander Showcase | 330 | dark-atmospheric | Serious character |
| `victory` | Victory Screen | 360 | epic-ambient | Triumphant |
| `chaos-torpedo` ✦ | Chaos Torpedo | 330 | electronic-crypto | Unhinged comedy |
| `voice-command` ✦ | Voice Command | 360 | cinematic-tension | Pre-launch cinematic |
| `elo-drop` ✦ | ELO Drop | 420 | electronic-crypto | Ranked comedy |
| `sonar-reveal` ✦ | Sonar Reveal | 360 | tension-gathering | Nova intelligence |
| `commander-lineup` ✦ | Commander Lineup | 390 | dark-atmospheric | Ensemble hype |

**New templates:**
- `chaos-torpedo` — Captain Bubbles: 3 shots, 1 flies off-grid 💀. "1/3 unaccounted for. She has no regrets 🫧"
- `voice-command` — Terminal types "FIRE B7" → explosion → "USE ABILITY" → 3-column broadside → "COMMAND BY VOICE. / DEEP STRIKE / COMING SOON"
- `elo-drop` — Ranked match: 1,247 vs 2,100. Chaos Torpedo strategy. All 3 miss. "−32 ELO. Pro tip: Easy mode."
- `sonar-reveal` — Admiral Nova sonar ping, 3×3 reveal zone shows hidden ships. "THEY THOUGHT THEY COULD HIDE."
- `commander-lineup` — All 6 commanders slam in with abilities. Free vs Premium split. "$2.99 UNLOCK ALL."
- `grid-reveal` CTA updated: "FREE — APP STORE & PLAY STORE"

**UI redesign (`public/index.html`):**
- **WHITE BACKGROUND** — main area pure white, dark text, high readability
- **Platform TILES** — no tabs. All platforms visible at once with colored headers (Instagram pink, TikTok black, YouTube red, Twitter dark)
- **Bigger fonts** — minimum 11px body text, everything readable at a glance
- **AUTOPILOT v2** — intelligent 8-preset rotation. Checks library, picks freshest template, auto-chains renders. Runs continuously until stopped. Shows "NEXT UP" preview.
- Dark sidebar (control panel) + bright main area (content preview)
- Music auto-syncs when template changes

**8 viral presets** in autopilot rotation:
1. Voice Command (IG+TikTok, pre-launch)
2. Chaos Torpedo (IG+TikTok, concept teaser)
3. Commander Showcase (IG+YouTube, tactical)
4. Grid Reveal (IG+TikTok+Twitter, general)
5. Victory Screen (IG+TikTok, comeback)
6. ELO Drop (IG+TikTok, comedy)
7. Sonar Reveal (IG+TikTok, Nova showcase)
8. Commander Lineup (IG+TikTok+YouTube, ensemble)

**Library cleanup:**
- Deleted 7 redundant/orphan videos
- Fresh start: autopilot will build clean rotation library

---

## Current State: App-complete, pre-submission

The game is fully implemented. All gameplay, monetisation, social, and analytics code is written. The remaining work is **external setup** (App Store Connect, IAP registration, screenshots, Sentry DSN) — no more feature code needed before v1.0.

---

## Full Feature Inventory (implemented)

### Core Gameplay
- Classic and Salvo game modes
- AI opponent (difficulty: easy / medium / hard)
- Ship placement (drag + rotate + auto-place)
- 6 commanders with unique special abilities
- Voice command support (`"B7"`, `"use ability"`, `"switch grid"`, emotes)
- Voice-only mode (disables tap input)
- Grid themes (Deep Ocean free; Arctic Ice + Volcanic premium)

### Multiplayer
- Real-time 2-player via Firebase Firestore
- Room code (create / join) flow
- Global ELO matchmaking queue (`matchmaking/` collection)
- ELO rating system (K=32, persisted to `players/` collection)
- Ranked leaderboard (top 20, pull-to-refresh)
- Turn-based push notifications (push token stored per game)
- Post-game replay (step through `moves[]` array from Firestore)

### Commanders (6)
| Commander | Ability |
|---|---|
| Captain Gruffbeard 🏴‍☠️ | Broadside — 3-column burst |
| Admiral Nova 🌟 | Sonar Sweep — 3×3 reveal (no turn used) |
| Captain Bubbles 🫧 | Chaos Torpedo — 3 random shots |
| Commander Zero 🤖 | Radar Ping — scan entire row (no turn used) |
| Admiral Blackwood 🎩 | Full Broadside — odd columns across row |
| Captain Coral 🪸 | Depth Charge — target + 4 orthogonal cells |

Free: Gruffbeard + weekly rotation (3 commanders rotate weekly, seeded by week number).
Premium: all 6 owned permanently.

### Progression & Retention
- Commander XP/leveling (10 levels, XP thresholds in `commanderService.js`)
- Commander shards system (50 shards = unlock via Armory)
- Armory / Store screen (3 shard packs; daily free shard claim)
- Battle Pass — Season 1 "The Zero Directive" (20 tiers, free + premium tracks, ends June 8 2026)
- Weekly Challenges — seeded pool of 10, 3 active per week, BP XP reward on claim
- Story Campaigns — 2 campaigns × 5 missions, seeded fleets, 1-3 star rating
- Daily Challenge — same seeded fleet for all players that day, shot-count scoring

### Monetisation
- Free tier: Gruffbeard, Classic mode, single-player, weekly rotation
- Premium ($2.99 `com.deepstrike.app.premium`): all 6 commanders, Salvo, multiplayer, daily, campaigns
- Battle Pass ($4.99 `com.deepstrike.app.battlepass`): premium seasonal reward track
- Shard Packs: small $0.99 / medium $1.99 / large $4.99
- Real IAP via `expo-iap`; restore purchases implemented
- Paywall screen with real price fetch + loading states

### Ads (Freemium Monetisation)
- `src/services/adService.js` — AdMob interstitial + banner integration
- Free users: interstitial ad shown every 5 completed games (classic + campaign + daily)
- Free users: persistent banner ad at bottom of HomeScreen and GameOverScreen
- Premium users: ads completely skipped (`isPremiumUnlocked` check)
- Ad pre-loaded at startup (`initAds()` in `App.js`), reloaded after each close
- Graceful fallback: if ad not ready, game continues immediately (never blocks user)
- `GameOverScreen.js` — "DEPLOY AGAIN" intercepts with `maybeShowAd()` before navigating
- `src/components/AdBanner.js` — reusable banner component; checks premium async, renders nothing for premium users
- Uses `TestIds.INTERSTITIAL` / `TestIds.BANNER` in dev/TestFlight; real Ad Unit IDs in production
- `getGamesPlayed()` exported for analytics/debug

### Analytics & Crash Reporting
- `src/services/analyticsService.js` — event queue → Firestore `analytics/` collection (batched, fire-and-forget). Tracks: `app_open`, `game_start`, `game_end`, `daily_completed`, `campaign_completed`, `paywall_shown` (with source), all 4 IAP outcomes, `commander_selected`.
- `src/services/sentryService.js` — Sentry crash reporting. **Needs a DSN** (see below).
- `ErrorBoundary.js` calls `captureException` on render crashes.
- IAP failures call `captureException`.
- Sentry init runs before component tree mounts in `App.js`.

### Onboarding
- `src/screens/OnboardingScreen.js` — 5-slide carousel shown on first launch only.
- Slides: Welcome → Deploy Fleet → Fire → Voice Commands → Commanders.
- AsyncStorage key `@deepstrike_onboarding_done` tracks completion.

### App Store Readiness
- App icon (1024×1024), adaptive icon, splash (1284×2778), favicon, notification icon — generated by `scripts/generate-assets.js` using `sharp`.
- Privacy policy HTML → `privacy-policy/index.html` (needs to be hosted publicly).
- `APP_STORE_COPY.md` — full App Store description, keywords, promo text, Google Play copy, social posts.
- `APP_STORE_CHECKLIST.md` — 10-step submission checklist.
- `screenshots/SCREENSHOT_GUIDE.md` — how to capture the 6 required screens.
- `scripts/generate-screenshot-frames.js` — adds marketing text overlays to raw screenshots.

---

## Files Added / Changed (cumulative across all sessions)

### New files
```
src/constants/gameConstants.js          — COMMANDERS (6), GAME_MODES, SHIPS, GRID_SIZE
src/constants/campaigns.js              — 2 campaigns × 5 missions with seeded fleets
src/constants/battlePass.js             — Season 1 definition, 20 tiers
src/services/commanderService.js        — ownership, XP/leveling, shards, free rotation
src/services/premiumService.js          — AsyncStorage premium flag + anonymous player ID
src/services/iapService.js              — expo-iap: connect, purchase, restore, analytics hooks
src/services/storeService.js            — shard packs, daily free claim
src/services/themeService.js            — 3 grid themes (Deep Ocean free, 2 premium)
src/services/campaignService.js         — mission progress, star calc, AsyncStorage
src/services/battlePassService.js       — XP tracking, tier calc, reward claims
src/services/challengeService.js        — seeded weekly pool, stat tracking, claim
src/services/eloService.js              — Firestore ELO calc + leaderboard fetch
src/services/notificationService.js     — push token request + send turn notification
src/services/settingsService.js         — voice-only mode toggle (AsyncStorage)
src/services/onboardingService.js       — first-launch flag (AsyncStorage)
src/services/adService.js               — AdMob interstitial (every 5th game) + banner ad unit ID export
src/services/analyticsService.js        — event queue → Firestore
src/services/sentryService.js           — Sentry crash reporting (NEW this session)
src/utils/dailyChallenge.js             — seeded daily fleet, star calc, best score
src/components/ErrorBoundary.js         — catches render errors, shows recovery UI, reports to Sentry
src/components/AdBanner.js              — AdMob anchored adaptive banner; shown to free users on HomeScreen + GameOverScreen
src/screens/PaywallScreen.js            — premium unlock UI (real IAP)
src/screens/StoreScreen.js              — Armory: shard packs + commander picker
src/screens/CampaignScreen.js           — campaign list
src/screens/CampaignBattleScreen.js     — puzzle battle (no AI turns)
src/screens/BattlePassScreen.js         — tier list, claim UI, pass unlock
src/screens/ChallengesScreen.js         — weekly challenge list + claim
src/screens/DailyScreen.js              — daily puzzle battle
src/screens/DailyResultScreen.js        — stars + share result
src/screens/LeaderboardScreen.js        — top 20 ELO, pull-to-refresh
src/screens/ReplayScreen.js             — step-through replay from Firestore moves[]
src/screens/OnboardingScreen.js         — 5-slide first-launch tutorial (NEW this session)
src/screens/SettingsScreen.js           — theme picker, voice-only toggle, privacy, delete account
src/screens/PrivacyPolicyScreen.js      — in-app WebView of privacy policy
src/screens/DeleteAccountScreen.js      — wipe AsyncStorage + player record
privacy-policy/index.html               — full GDPR/CCPA privacy policy
privacy-policy/README.md                — deployment instructions (GitHub Pages / Netlify / Vercel)
scripts/generate-assets.js              — generates all icon/splash PNGs from SVG via sharp
scripts/generate-screenshot-frames.js  — adds marketing text overlays to raw screenshots
APP_STORE_COPY.md                       — full listing copy, keywords, Google Play, social posts
APP_STORE_CHECKLIST.md                  — 10-step submission checklist
```

---

## What Still Needs Doing (external / one-time setup)

### Before building
1. **Add Sentry DSN** — `src/services/sentryService.js` line 10.
   - Create free project at https://sentry.io (React Native type)
   - Copy DSN, paste into `SENTRY_DSN` constant

2. **Set up AdMob ads** — free users see an interstitial every 5 games + persistent banner; premium users see nothing.
   - Create AdMob account at https://admob.google.com
   - Add app for iOS AND Android → get two App IDs (ca-app-pub-XXXX~XXXX)
   - Create **4 ad units total** (Interstitial + Banner, for iOS + Android)
   - Update `app.json` → replace the two placeholder `androidAppId` / `iosAppId` values
   - Update `src/services/adService.js`:
     - Replace interstitial `ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX` × 2 (iOS + Android)
     - Replace banner `ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX` × 2 (iOS + Android)
   - For iOS: also add `SKAdNetworkItems` to `app.json` infoPlist (AdMob provides the list)
   - Uses `TestIds.INTERSTITIAL` / `TestIds.BANNER` automatically in dev builds (`__DEV__ === true`)
   - Interstitial logic: `adService.js` — tracks game count in AsyncStorage, shows every 5th game
   - Banner logic: `AdBanner.js` — `ANCHORED_ADAPTIVE_BANNER` at bottom of HomeScreen + GameOverScreen

3. **Run `eas init`** — generates `projectId` in `app.json`
   ```bash
   eas init
   ```

### Before App Store submission
3. **Register IAP products** in App Store Connect + Google Play Console
   - `com.deepstrike.app.premium` — Non-Consumable — $2.99
   - `com.deepstrike.app.battlepass` — Non-Consumable — $4.99
   - `com.deepstrike.app.shards_small` — Consumable — $0.99
   - `com.deepstrike.app.shards_medium` — Consumable — $1.99
   - `com.deepstrike.app.shards_large` — Consumable — $4.99

4. **Host privacy policy** — `privacy-policy/index.html` → GitHub Pages or Netlify
   - Update `privacy@deepstrike.app` placeholder email
   - Update `[Your Company Name]` placeholder

5. **Capture screenshots** — run app in iOS Simulator (iPhone 15 Pro Max for 6.7")
   ```bash
   npx expo start --ios
   ```
   Screens needed: Home, Commander Select, Battle (mid-game), Campaign, Battle Pass, Victory

6. **Build**
   ```bash
   eas build --platform all --profile production
   ```

7. **Fill App Store Connect** — use content from `APP_STORE_COPY.md`

8. **Submit**
   ```bash
   eas submit --platform all --profile production
   ```

### Optional / post-launch
- Add Sentry source maps to EAS build for readable stack traces
- Add Firebase Analytics native SDK for richer retention data
- Set up TestFlight beta before full release
- App preview video (30-sec gameplay clip)
- Localized descriptions (Spanish, French)
- Push notification setup for iOS (requires Apple Developer APNs key via `eas credentials`)

---

## Key Constants / IDs to Know

| Thing | Value |
|---|---|
| Bundle ID (iOS + Android) | `com.deepstrike.app` |
| GitHub — App repo | `github.com/govindjiwalashantanu/deep-strike` (private) |
| GitHub — Reel Generator repo | `github.com/govindjiwalashantanu/deep-strike-videos` (private) |
| Firebase project | `battleshipai-c1de7` |
| Premium IAP | `com.deepstrike.app.premium` |
| Battle Pass IAP | `com.deepstrike.app.battlepass` |
| Season 1 end date | June 8, 2026 |
| XP per BP tier | 500 |
| Shards to unlock commander | 50 |
| Commander levels | 1–10 |
| ELO starting rating | 1000 |
| ELO K-factor | 32 |

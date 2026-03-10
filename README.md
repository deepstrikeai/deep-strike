# ⚓ Battleship AI

A reimagined mobile Battleship game powered by AI — voice commands, personality-driven commanders, and live battle narration. Built with React Native (Expo).

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- Expo Go app on your phone ([iOS](https://apps.apple.com/app/expo-go/id982107779) / [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))

### 1. Install dependencies
```bash
cd battleship-ai
npm install
```

### 2. Add your Anthropic API key (for AI narration)
Open `src/hooks/useAINarration.js` and replace:
```js
const API_KEY = 'YOUR_ANTHROPIC_API_KEY';
```
with your real key from [console.anthropic.com](https://console.anthropic.com).

> **Without a key**: The app works perfectly using the built-in fallback narration library. The API key only unlocks richer, more dynamic AI-generated lines.

### 3. Run the app
```bash
npx expo start
```
Then scan the QR code with Expo Go on your phone.

---

## 🎮 Features

### v1.0 MVP
| Feature | Status |
|---|---|
| 🎙️ Voice Commands | ✅ Web (Speech API) / 🔧 Native (see below) |
| 🧠 AI Commander Personas | ✅ 3 commanders with unique personalities |
| 🎬 Dynamic Battle Narration | ✅ Fallback library + Claude API |
| 🚢 Classic Battleship Gameplay | ✅ Full 10x10 grid, 5 ships |
| 🎲 Auto Ship Placement | ✅ One-tap random placement |
| ⚔️ 3 Difficulty Levels | ✅ Easy / Medium / Hard AI |
| 🎖️ Post-Game Stats & Rank | ✅ Accuracy, shots, rank system |

---

## 🎙️ Voice Commands — Native Setup

For native iOS/Android voice recognition, install the voice library:

```bash
npx expo install @react-native-voice/voice
```

Then update `src/hooks/useVoiceRecognition.js` to use the native module:

```js
import Voice from '@react-native-voice/voice';

// Replace the native branch in startListening() with:
Voice.onSpeechResults = (e) => {
  const text = e.value[0];
  const coord = parseVoiceCoord(text);
  if (coord) onCoordRecognized(coord, text);
  else setError(`Couldn't understand "${text}". Try "Fire at B7".`);
  setIsListening(false);
};
await Voice.start('en-US');
```

> Voice works out-of-the-box on web (Chrome/Safari). On native, the package above is needed.

---

## 🤖 AI Commanders

| Commander | Personality | Best For |
|---|---|---|
| 🏴‍☠️ Captain Gruffbeard | Grumpy pirate | Classic Battleship feel |
| 🌟 Admiral Nova | Theatrical drama queen | Kids who love flair |
| 🐙 Captain Bubbles | Chaotic & silly | Younger kids / family fun |

---

## 📁 Project Structure

```
battleship-ai/
├── App.js                          # Root + screen navigation state machine
├── app.json                        # Expo configuration
├── src/
│   ├── constants/
│   │   └── gameConstants.js        # Ships, commanders, narration templates
│   ├── hooks/
│   │   ├── useAINarration.js       # Claude API + fallback narration
│   │   └── useVoiceRecognition.js  # Speech recognition hook
│   ├── screens/
│   │   ├── HomeScreen.js           # Landing/menu screen
│   │   ├── CommanderScreen.js      # Commander + difficulty selection
│   │   ├── PlacementScreen.js      # Ship placement UI
│   │   ├── BattleScreen.js         # Main gameplay screen
│   │   └── GameOverScreen.js       # Results + stats screen
│   └── utils/
│       └── gameLogic.js            # Pure game logic (no UI)
```

---

## 🗺️ Roadmap

### v2.0 (Post-Launch)
- [ ] Real-time online multiplayer
- [ ] Predictive AI heatmaps (probability overlay)
- [ ] Procedurally generated maps with obstacles
- [ ] Fleet evolution system
- [ ] Global leaderboards

---

## 💡 Customization Tips

**Add a new commander:** Edit `gameConstants.js` and add an entry to the `COMMANDERS` array with your own `hitReactions`, `missReactions`, `sunkReactions`, etc.

**Change narration style:** Edit the `AI_SYSTEM_PROMPT` function in `gameConstants.js` to change the tone and instructions sent to Claude.

**Adjust AI difficulty:** Edit `getAIShot()` in `gameLogic.js` to tune the hard mode probability algorithm.

---

## 📋 PRD Reference

This codebase was built from the Battleship AI Product Requirements Document (PRD v1.0).
Key decisions implemented:
- React Native (Expo) for cross-platform iOS + Android
- On-device voice (no server-side audio processing)  
- COPPA-safe: no user accounts, no data collection
- Claude API with offline fallback narration pool
- Single player + pass-and-play modes only (multiplayer deferred to v2.0)

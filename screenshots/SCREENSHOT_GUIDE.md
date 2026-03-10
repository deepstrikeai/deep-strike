# App Store Screenshot Guide

## Required Sizes

### iOS (Minimum 3 screenshots per size, maximum 10)
- **6.7" Display (iPhone 15 Pro Max):** 1290×2796 or 1284×2778 ✅ **REQUIRED**
- **6.5" Display (iPhone 11 Pro Max):** 1242×2688 ✅ **REQUIRED**
- **5.5" Display (iPhone 8 Plus):** 1242×2208 (Optional but recommended)

### Android (Minimum 2 screenshots, maximum 8)
- **Phone:** 1080×1920 or higher
- **Tablet (optional):** 1920×1080 or higher (7" and 10")

---

## How to Capture Screenshots

### Method 1: iOS Simulator (Best for iOS screenshots)

1. **Start the app:**
   ```bash
   npx expo start --ios
   ```

2. **Choose the correct simulator:**
   - For 6.7": iPhone 15 Pro Max
   - For 6.5": iPhone 11 Pro Max or iPhone XS Max
   - For 5.5": iPhone 8 Plus

3. **Navigate to key screens and capture:**
   - **Cmd + S** to save screenshot (auto-saves to Desktop)
   - Or use Simulator menu → File → Save Screen

4. **Recommended screens to capture:**
   1. **Home screen** (shows game title, mode selector)
   2. **Commander selection** (shows premium commanders with abilities)
   3. **Battle screen** (mid-game with voice UI, grid, intel panel)
   4. **Campaign screen** (shows mission list with stars)
   5. **Battle Pass screen** (shows seasonal content)
   6. **Store/Armory** (shows monetization)
   7. **Leaderboard** (shows competitive element)
   8. **Game Over / Victory** (shows XP rewards)

### Method 2: Real Device (Best for Android + iOS)

1. **Enable developer mode** (Android only):
   - Settings → About → Tap "Build number" 7 times
   - Settings → Developer options → USB debugging ON

2. **Connect device and launch:**
   ```bash
   npx expo start
   # Scan QR code on device
   ```

3. **Take screenshots:**
   - **iOS:** Power + Volume Up
   - **Android:** Power + Volume Down

4. **Transfer to computer:**
   - **iOS:** AirDrop or plug in and use Image Capture app
   - **Android:** USB transfer or Google Photos sync

---

## Screenshot Best Practices

### Content Tips
- **No personal data:** Don't show real player names/emails
- **Show features:** Highlight unique selling points (voice commands, AI narration, commanders)
- **Action shots:** Mid-game is better than empty menus
- **Variety:** Mix gameplay, features, and results screens
- **Text overlays:** Consider adding marketing text (see framing script below)

### Technical Requirements
- **Format:** PNG or JPG
- **Color space:** RGB (not CMYK)
- **No transparency:** Must have opaque background
- **Status bar:** Clean (full battery, strong signal, 9:41 AM time)

### Order Matters
First 2-3 screenshots show in App Store search results — make them compelling!

**Recommended order:**
1. Battle screen (core gameplay)
2. Commander selection (shows variety/depth)
3. Campaign or Battle Pass (shows content)
4. Victory/rewards (shows progression)
5. Additional features (voice, multiplayer, etc.)

---

## Quick Capture Checklist

Run the app and capture these 6 screens (minimum):

- [ ] **Home screen** — Shows "DEEP STRIKE" title, mode chips, CTA buttons
- [ ] **Commander screen** — Shows all 6 commanders with rarity/abilities
- [ ] **Battle screen (Player Turn)** — Shows attack grid, intel panel, voice button
- [ ] **Campaign screen** — Shows Operation North Star mission list with stars
- [ ] **Battle Pass screen** — Shows Season 1 tiers and rewards
- [ ] **Game Over screen** — Shows victory banner + commander XP gained

---

## Adding Marketing Frames (Optional)

You can add text overlays and frames to make screenshots more appealing:

### Tools:
- **Figma** (free) — Import screenshots, add text/shapes
- **Canva** (free) — Screenshot templates
- **Photoshop/Sketch** — Manual design
- **App Store Screenshot Generator** — https://www.appstorescreenshot.com/

### Frame Ideas:
- Top banner: "TACTICAL NAVAL WARFARE"
- Highlight callout: "6 UNIQUE COMMANDERS" → pointing to commander grid
- Feature badge: "🎙 VOICE COMMANDS" on battle screen
- Bottom text: "COMMAND YOUR FLEET · SINK THEIRS"

---

## Using the Auto-Capture Script (Advanced)

If you want to automate screenshot capture:

1. Install dependencies:
   ```bash
   npm install --save-dev expo-screenshot
   ```

2. Run the capture script:
   ```bash
   node scripts/capture-screenshots.js
   ```

(Script not yet created — let me know if you want this)

---

## After Capturing

1. **Rename files clearly:**
   - `1_home_6.7.png`
   - `2_commanders_6.7.png`
   - `3_battle_6.7.png`
   - etc.

2. **Check dimensions:**
   ```bash
   sips -g pixelWidth -g pixelHeight *.png
   ```

3. **Optimize file size** (App Store has upload limits):
   ```bash
   # Install if needed: brew install pngquant
   pngquant --quality=80-95 *.png --ext .png --force
   ```

4. **Upload to App Store Connect:**
   - App Information → App Store tab → Screenshots
   - Drag files to each device size category
   - Reorder as needed

---

## Common Issues

**❌ "Image dimensions are invalid"**
- Check exact pixel dimensions match requirements
- iOS Simulator sometimes adds extra padding — crop if needed

**❌ "Status bar looks messy"**
- Simulator → Features → Toggle Appearance (switches Dark/Light)
- Use iPhone simulators with clean status bars (full battery, Wi-Fi)

**❌ "Screenshots look pixelated"**
- Ensure you're using @3x or @2x Retina simulators, not scaled-down versions
- Simulator → Window → Physical Size (not "Fit Screen")

**❌ "Can't capture all required sizes"**
- You only NEED 6.7" and 6.5" for iOS App Store
- 5.5" is optional but recommended for older device support
- Apple will auto-scale between similar sizes if missing

---

## Pro Tip: Use Video Previews

App Store also supports 30-second app preview videos. Consider recording gameplay:
1. Simulator → File → Record Screen
2. Stop recording (CMD+S)
3. Trim to 15-30 seconds
4. Export as .m4v or .mp4
5. Upload to App Store Connect → App Previews

Videos significantly increase conversion rates!

---

## Need Help?

If you want me to:
- Generate a screenshot automation script
- Create marketing frames/templates
- Review your screenshots before submission

Just ask!

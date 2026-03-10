# Deep Strike — App Store Submission Checklist

## ✅ Completed

- [x] App icon (1024×1024)
- [x] Splash screen (1284×2778)
- [x] Adaptive icon (Android)
- [x] Notification icon
- [x] Real IAP integration (expo-iap)
- [x] Product IDs defined
- [x] Restore purchases flow
- [x] Privacy policy document created
- [x] Screenshot guide created
- [x] Screenshot frame generator script
- [x] EAS build config
- [x] Bundle IDs configured

---

## 🔶 In Progress (Your Action Required)

### 1. Host Privacy Policy
**Priority: HIGH — App Store rejects without this**

Location: `privacy-policy/index.html`

Deploy options (pick one):
- **GitHub Pages** (recommended): See `privacy-policy/README.md`
- **Netlify Drop**: Drag & drop at app.netlify.com/drop
- **Vercel**: `cd privacy-policy && vercel --prod`

Once hosted:
- Update placeholder email (`privacy@deepstrike.app`) with your real email
- Add URL to App Store Connect → App Information → Privacy Policy URL
- Add same URL to Google Play Console → App content → Privacy Policy

---

### 2. Register IAP Products
**Priority: HIGH — Purchases won't work without this**

**Apple App Store Connect:**
1. Log in → My Apps → Your App → In-App Purchases
2. Create products (use exact IDs from code):
   - `com.deepstrike.app.premium` — **Non-Consumable** — $2.99
   - `com.deepstrike.app.battlepass` — **Non-Consumable** — $4.99
   - `com.deepstrike.app.shards_small` — **Consumable** — $0.99
   - `com.deepstrike.app.shards_medium` — **Consumable** — $1.99
   - `com.deepstrike.app.shards_large` — **Consumable** — $4.99
3. Add localized descriptions and pricing for each

**Google Play Console:**
1. Your App → Monetize → In-app products → Create
2. Create same 5 products (same IDs)
3. Set pricing and descriptions

---

### 3. Capture Screenshots
**Priority: HIGH — App Store requires minimum 3 screenshots**

Guide: `screenshots/SCREENSHOT_GUIDE.md`

**Quick steps:**
1. Run app in iOS Simulator:
   ```bash
   npx expo start --ios
   ```
2. Choose "iPhone 15 Pro Max" simulator
3. Navigate to 6 key screens and press **Cmd+S** to screenshot:
   - Home screen
   - Commander selection
   - Battle screen (mid-game)
   - Campaign screen
   - Battle Pass screen
   - Victory/Game Over

4. Optional: Add marketing frames:
   ```bash
   # Move screenshots to screenshots/raw/
   node scripts/generate-screenshot-frames.js
   # Framed versions output to screenshots/framed/
   ```

5. Upload to App Store Connect → Screenshots section

---

### 4. Initialize EAS & Get Project ID
**Priority: HIGH — Needed before building**

```bash
eas init
```

This generates your project ID and updates `app.json` → `extra.eas.projectId`.

---

### 5. Build the App
**Priority: HIGH — Get .ipa and .aab files**

**Preview build (for testing):**
```bash
eas build --platform all --profile preview
```

**Production build (for App Store submission):**
```bash
eas build --platform all --profile production
```

Builds take 10-20 minutes. You'll get download links when done.

---

### 6. Test IAP in Sandbox
**Priority: MEDIUM — Validate purchases work**

**iOS Sandbox:**
1. App Store Connect → Users and Access → Sandbox Testers → Add tester
2. Install preview build on device
3. Settings → App Store → Sandbox Account → Sign in with test account
4. Try purchasing (no real charges in sandbox)

**Android Test Track:**
1. Google Play Console → Testing → Internal testing → Create release
2. Upload .aab from EAS build
3. Add testers → Install via test link
4. Try purchasing

---

### 7. App Store Connect Setup
**Priority: MEDIUM — Required before submission**

Fill out:
- App name: **Deep Strike**
- Subtitle: **Tactical Naval Warfare**
- Category: **Games → Strategy**
- Age rating: **4+** (mild competitive content)
- Keywords: battleship, navy, strategy, commander, voice, AI
- Description (2-3 paragraphs + bullet points)
- Support URL: (your website or GitHub repo)
- Marketing URL (optional)
- Screenshots (from step 3)
- Privacy Policy URL (from step 1)

---

### 8. Google Play Console Setup
**Priority: MEDIUM — Required for Android**

Fill out:
- App name, description, category (same as iOS)
- Graphic assets: Feature graphic (1024×500), icon
- Content rating questionnaire
- Target audience and content
- Data safety form (what data you collect — see privacy policy)
- Store listing

---

### 9. Update eas.json Submit Config
**Priority: LOW — Only needed for auto-submit via EAS**

Edit `eas.json` → `submit.production`:
- Replace `YOUR_APPLE_ID@example.com`
- Replace `YOUR_APP_STORE_CONNECT_APP_ID`
- Replace `YOUR_APPLE_TEAM_ID`

Or skip this and manually upload builds.

---

### 10. Submit for Review
**Priority: LOW — Final step**

**Manual upload:**
- iOS: Xcode Transporter or App Store Connect web UI
- Android: Google Play Console → upload .aab

**Or use EAS submit:**
```bash
eas submit --platform ios --profile production
eas submit --platform android --profile production
```

---

## 📝 Optional Enhancements

- [ ] App preview video (30 sec gameplay clip)
- [ ] Localized descriptions (Spanish, French, etc.)
- [ ] A/B test different screenshots
- [ ] Add App Store optimization keywords
- [ ] Set up TestFlight beta program
- [ ] Create press kit / landing page
- [ ] Prepare launch social media posts

---

## 🛠️ Useful Commands

```bash
# Start dev server
npx expo start

# Run on iOS simulator
npx expo start --ios

# Run on Android emulator
npx expo start --android

# Clear cache and restart
npx expo start --clear

# Initialize EAS
eas init

# Build preview (for testing)
eas build --platform all --profile preview

# Build production (for store)
eas build --platform all --profile production

# Submit to stores
eas submit --platform all --profile production

# Check build status
eas build:list

# View logs
eas build:view <build-id>
```

---

## 🆘 Common Issues & Fixes

**"expo-iap plugin not configured"**
- Run `npx expo prebuild --clean` to regenerate native projects

**"Product IDs not found"**
- Ensure products are created in App Store Connect / Play Console
- Wait 1-2 hours after creating products
- Use exact IDs from code

**"Build failed on EAS"**
- Check build logs: `eas build:view`
- Common fix: Update dependencies, clear cache, rebuild

**"App rejected for missing privacy policy"**
- Ensure URL is publicly accessible
- Test in incognito browser
- URL must use HTTPS

**"Screenshots rejected for wrong dimensions"**
- Use exact sizes: 1290×2796 or 1284×2778
- Check with: `sips -g pixelWidth -g pixelHeight file.png`

---

## 📞 Need Help?

- Expo docs: https://docs.expo.dev
- EAS Build docs: https://docs.expo.dev/build/introduction/
- IAP docs: https://hyochan.github.io/expo-iap/
- App Store Connect: https://appstoreconnect.apple.com
- Google Play Console: https://play.google.com/console

Good luck with your launch! 🚀

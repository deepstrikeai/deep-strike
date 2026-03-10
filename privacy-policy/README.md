# Deep Strike Privacy Policy - Hosting Guide

## Quick Deploy (Choose One)

### Option 1: GitHub Pages (Recommended)
**Free, fast, perfect for App Store requirements**

1. Create a new repo on GitHub (public or private):
   ```bash
   cd privacy-policy
   git init
   git add index.html
   git commit -m "Add privacy policy"
   gh repo create deep-strike-privacy --public --source=. --push
   ```

2. Enable GitHub Pages:
   - Go to repo Settings → Pages
   - Source: Deploy from branch → `main` → `/root` → Save
   - Your URL will be: `https://[your-username].github.io/deep-strike-privacy/`

3. Done! Use this URL in App Store Connect.

---

### Option 2: Netlify Drop
**No git required, drag & drop**

1. Go to [app.netlify.com/drop](https://app.netlify.com/drop)
2. Drag the `privacy-policy` folder onto the page
3. Netlify gives you a URL like: `https://[random-name].netlify.app`
4. Optional: Change the subdomain in Site settings → Domain management

---

### Option 3: Vercel
**Similar to Netlify**

1. Install Vercel CLI: `npm i -g vercel`
2. Deploy:
   ```bash
   cd privacy-policy
   vercel --prod
   ```
3. Follow prompts, get URL: `https://[project-name].vercel.app`

---

## Custom Domain (Optional)

If you own a domain (e.g., `deepstrike.app`):

1. **GitHub Pages:**
   - Add a CNAME file: `echo "privacy.deepstrike.app" > CNAME`
   - Add DNS record: `CNAME privacy → [username].github.io`

2. **Netlify/Vercel:**
   - Domain settings → Add custom domain
   - Follow DNS instructions

---

## Before Submitting to App Store

1. **Update the privacy policy:**
   - Replace `[Your Company Name]` at the bottom
   - Replace `privacy@deepstrike.app` with your real email
   - Review all sections for accuracy

2. **Test the URL:**
   - Verify it loads in a browser
   - Test on mobile

3. **Add to App Store Connect:**
   - App Information → Privacy Policy URL → paste your URL
   - This URL will be publicly visible on your App Store listing

---

## For Google Play

Google Play also requires a privacy policy URL. Use the same URL in:
- Play Console → App content → Privacy Policy → Add/Update

---

## Maintenance

- Keep the "Last updated" date current
- If you add new features that collect data, update the policy
- Re-deploy the updated file (GitHub: commit + push, Netlify/Vercel: re-upload/re-deploy)

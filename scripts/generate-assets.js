const sharp = require('sharp');
const path  = require('path');
const fs    = require('fs');

const ASSETS = path.join(__dirname, '..', 'assets');

// ── SVG definitions ───────────────────────────────────────────────────────────

const iconSVG = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bg" cx="50%" cy="50%" r="70%">
      <stop offset="0%"   stop-color="#0D2040"/>
      <stop offset="100%" stop-color="#06080E"/>
    </radialGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%"   stop-color="#00E5FF" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="#00E5FF" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Background -->
  <rect width="1024" height="1024" fill="url(#bg)"/>
  <rect width="1024" height="1024" fill="url(#glow)"/>

  <!-- Grid lines (subtle) -->
  <line x1="0"    y1="512" x2="1024" y2="512" stroke="#00E5FF" stroke-width="1" opacity="0.06"/>
  <line x1="512"  y1="0"   x2="512"  y2="1024" stroke="#00E5FF" stroke-width="1" opacity="0.06"/>

  <!-- Sonar rings -->
  <circle cx="512" cy="512" r="430" fill="none" stroke="#00E5FF" stroke-width="1.5" opacity="0.08"/>
  <circle cx="512" cy="512" r="340" fill="none" stroke="#00E5FF" stroke-width="1.5" opacity="0.12"/>
  <circle cx="512" cy="512" r="248" fill="none" stroke="#00E5FF" stroke-width="2"   opacity="0.18"/>
  <circle cx="512" cy="512" r="155" fill="none" stroke="#00E5FF" stroke-width="2"   opacity="0.28"/>
  <circle cx="512" cy="512" r="62"  fill="none" stroke="#00E5FF" stroke-width="2"   opacity="0.5"/>

  <!-- Crosshair arms -->
  <line x1="512" y1="52"  x2="512" y2="390" stroke="#00E5FF" stroke-width="2" opacity="0.35"/>
  <line x1="512" y1="634" x2="512" y2="972" stroke="#00E5FF" stroke-width="2" opacity="0.35"/>
  <line x1="52"  y1="512" x2="390" y2="512" stroke="#00E5FF" stroke-width="2" opacity="0.35"/>
  <line x1="634" y1="512" x2="972" y2="512" stroke="#00E5FF" stroke-width="2" opacity="0.35"/>

  <!-- Corner tick marks -->
  <line x1="180" y1="180" x2="220" y2="180" stroke="#00E5FF" stroke-width="2.5" opacity="0.4"/>
  <line x1="180" y1="180" x2="180" y2="220" stroke="#00E5FF" stroke-width="2.5" opacity="0.4"/>
  <line x1="844" y1="180" x2="804" y2="180" stroke="#00E5FF" stroke-width="2.5" opacity="0.4"/>
  <line x1="844" y1="180" x2="844" y2="220" stroke="#00E5FF" stroke-width="2.5" opacity="0.4"/>
  <line x1="180" y1="844" x2="220" y2="844" stroke="#00E5FF" stroke-width="2.5" opacity="0.4"/>
  <line x1="180" y1="844" x2="180" y2="804" stroke="#00E5FF" stroke-width="2.5" opacity="0.4"/>
  <line x1="844" y1="844" x2="804" y2="844" stroke="#00E5FF" stroke-width="2.5" opacity="0.4"/>
  <line x1="844" y1="844" x2="844" y2="804" stroke="#00E5FF" stroke-width="2.5" opacity="0.4"/>

  <!-- Center ping dot -->
  <circle cx="512" cy="512" r="10" fill="#00E5FF" opacity="1"/>
  <circle cx="512" cy="512" r="22" fill="none" stroke="#00E5FF" stroke-width="2.5" opacity="0.7"/>

  <!-- "DS" monogram -->
  <text
    x="512" y="498"
    font-family="'Courier New', Courier, monospace"
    font-size="320"
    font-weight="900"
    fill="#00E5FF"
    text-anchor="middle"
    dominant-baseline="middle"
    letter-spacing="-10"
    opacity="0.92"
  >DS</text>

  <!-- Bottom label -->
  <text
    x="512" y="820"
    font-family="'Courier New', Courier, monospace"
    font-size="58"
    font-weight="700"
    fill="#00E5FF"
    text-anchor="middle"
    letter-spacing="22"
    opacity="0.55"
  >DEEP STRIKE</text>

  <!-- Top label -->
  <text
    x="512" y="224"
    font-family="'Courier New', Courier, monospace"
    font-size="34"
    font-weight="400"
    fill="#00E5FF"
    text-anchor="middle"
    letter-spacing="16"
    opacity="0.35"
  >TACTICAL · NAVAL · A·I</text>
</svg>`;

const splashSVG = `
<svg width="1284" height="2778" viewBox="0 0 1284 2778" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="sbg" cx="50%" cy="42%" r="60%">
      <stop offset="0%"   stop-color="#0D2040"/>
      <stop offset="100%" stop-color="#06080E"/>
    </radialGradient>
  </defs>

  <rect width="1284" height="2778" fill="url(#sbg)"/>

  <!-- Subtle grid lines -->
  <line x1="0" y1="1389" x2="1284" y2="1389" stroke="#00E5FF" stroke-width="1" opacity="0.05"/>
  <line x1="642" y1="0"  x2="642"  y2="2778" stroke="#00E5FF" stroke-width="1" opacity="0.05"/>

  <!-- Sonar rings centred at ~42% height -->
  <circle cx="642" cy="1160" r="600" fill="none" stroke="#00E5FF" stroke-width="1.5" opacity="0.06"/>
  <circle cx="642" cy="1160" r="460" fill="none" stroke="#00E5FF" stroke-width="1.5" opacity="0.09"/>
  <circle cx="642" cy="1160" r="320" fill="none" stroke="#00E5FF" stroke-width="2"   opacity="0.14"/>
  <circle cx="642" cy="1160" r="180" fill="none" stroke="#00E5FF" stroke-width="2"   opacity="0.22"/>

  <!-- Header line -->
  <line x1="120" y1="920" x2="1164" y2="920" stroke="#00E5FF" stroke-width="1.5" opacity="0.3"/>

  <!-- DEEP STRIKE title -->
  <text
    x="642" y="1080"
    font-family="'Courier New', Courier, monospace"
    font-size="148"
    font-weight="900"
    fill="#FFFFFF"
    text-anchor="middle"
    letter-spacing="28"
    opacity="0.95"
  >DEEP</text>
  <text
    x="642" y="1240"
    font-family="'Courier New', Courier, monospace"
    font-size="148"
    font-weight="900"
    fill="#FFFFFF"
    text-anchor="middle"
    letter-spacing="28"
    opacity="0.95"
  >STRIKE</text>

  <!-- Divider with A·I -->
  <line x1="120"  y1="1310" x2="530"  y2="1310" stroke="#00E5FF" stroke-width="1.5" opacity="0.4"/>
  <text
    x="642" y="1322"
    font-family="'Courier New', Courier, monospace"
    font-size="52"
    font-weight="700"
    fill="#00E5FF"
    text-anchor="middle"
    letter-spacing="24"
    opacity="0.8"
  >A · I</text>
  <line x1="754" y1="1310" x2="1164" y2="1310" stroke="#00E5FF" stroke-width="1.5" opacity="0.4"/>

  <!-- Tagline -->
  <text
    x="642" y="1410"
    font-family="'Courier New', Courier, monospace"
    font-size="36"
    fill="#00E5FF"
    text-anchor="middle"
    letter-spacing="12"
    opacity="0.4"
  >TACTICAL NAVAL WARFARE</text>
</svg>`;

const notificationSVG = `
<svg width="96" height="96" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
  <rect width="96" height="96" fill="#06080E"/>
  <circle cx="48" cy="48" r="36" fill="none" stroke="#00E5FF" stroke-width="2" opacity="0.6"/>
  <circle cx="48" cy="48" r="20" fill="none" stroke="#00E5FF" stroke-width="2" opacity="0.8"/>
  <circle cx="48" cy="48" r="5"  fill="#00E5FF"/>
  <line x1="48" y1="10" x2="48" y2="38" stroke="#00E5FF" stroke-width="2" opacity="0.6"/>
  <line x1="48" y1="58" x2="48" y2="86" stroke="#00E5FF" stroke-width="2" opacity="0.6"/>
  <line x1="10" y1="48" x2="38" y2="48" stroke="#00E5FF" stroke-width="2" opacity="0.6"/>
  <line x1="58" y1="48" x2="86" y2="48" stroke="#00E5FF" stroke-width="2" opacity="0.6"/>
</svg>`;

// ── Generate ──────────────────────────────────────────────────────────────────

async function generate() {
  console.log('Generating Deep Strike assets...\n');

  // Icon 1024×1024
  await sharp(Buffer.from(iconSVG))
    .resize(1024, 1024)
    .png()
    .toFile(path.join(ASSETS, 'icon.png'));
  console.log('✓ icon.png (1024×1024)');

  // Adaptive icon (Android foreground — same design, no extra padding needed)
  await sharp(Buffer.from(iconSVG))
    .resize(1024, 1024)
    .png()
    .toFile(path.join(ASSETS, 'adaptive-icon.png'));
  console.log('✓ adaptive-icon.png (1024×1024)');

  // Favicon 64×64
  await sharp(Buffer.from(iconSVG))
    .resize(64, 64)
    .png()
    .toFile(path.join(ASSETS, 'favicon.png'));
  console.log('✓ favicon.png (64×64)');

  // Splash — iPhone 15 Pro Max native: 1284×2778
  await sharp(Buffer.from(splashSVG))
    .resize(1284, 2778)
    .png()
    .toFile(path.join(ASSETS, 'splash.png'));
  console.log('✓ splash.png (1284×2778)');

  // Notification icon (white/monochrome for Android)
  await sharp(Buffer.from(notificationSVG))
    .resize(96, 96)
    .png()
    .toFile(path.join(ASSETS, 'notification-icon.png'));
  console.log('✓ notification-icon.png (96×96)');

  console.log('\nAll assets generated successfully.');
}

generate().catch(err => { console.error(err); process.exit(1); });

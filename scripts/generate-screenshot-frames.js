const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Creates marketing frames for screenshots
// Usage: Place your actual screenshots in screenshots/raw/
//        Run: node scripts/generate-screenshot-frames.js
//        Output: screenshots/framed/

const SCREENSHOTS_DIR = path.join(__dirname, '..', 'screenshots');
const RAW_DIR = path.join(SCREENSHOTS_DIR, 'raw');
const OUTPUT_DIR = path.join(SCREENSHOTS_DIR, 'framed');

// Ensure directories exist
if (!fs.existsSync(RAW_DIR)) {
  fs.mkdirSync(RAW_DIR, { recursive: true });
  console.log('Created screenshots/raw/ directory');
  console.log('Place your iPhone screenshots there, then run this script again.');
  process.exit(0);
}
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Marketing text overlays
const OVERLAYS = {
  home: {
    top: 'TACTICAL NAVAL WARFARE',
    bottom: 'COMMAND YOUR FLEET',
  },
  commanders: {
    top: '6 UNIQUE COMMANDERS',
    bottom: 'SPECIAL ABILITIES · LEVEL UP',
  },
  battle: {
    top: 'VOICE COMMAND SUPPORT',
    bottom: 'CALL OUT COORDINATES BY VOICE',
  },
  campaign: {
    top: 'STORY MISSIONS',
    bottom: '2 CAMPAIGNS · 10 MISSIONS',
  },
  battlepass: {
    top: 'SEASONAL CONTENT',
    bottom: 'EARN REWARDS · UNLOCK COMMANDERS',
  },
  victory: {
    top: 'LEVEL UP YOUR COMMANDERS',
    bottom: 'EARN XP · CLIMB THE RANKS',
  },
};

async function addFrame(inputPath, outputPath, overlay) {
  try {
    const image = sharp(inputPath);
    const metadata = await image.metadata();
    const { width, height } = metadata;

    // Create text overlay SVG
    const topTextHeight = 80;
    const bottomTextHeight = 60;
    const padding = 20;

    const svg = `
      <svg width="${width}" height="${height}">
        <!-- Top banner -->
        <rect x="0" y="0" width="${width}" height="${topTextHeight}" fill="rgba(6, 8, 14, 0.85)"/>
        <text
          x="${width / 2}"
          y="${topTextHeight / 2 + 5}"
          font-family="'Courier New', Courier, monospace"
          font-size="20"
          font-weight="700"
          fill="#00E5FF"
          text-anchor="middle"
          letter-spacing="4"
        >${overlay.top}</text>

        <!-- Bottom banner -->
        <rect x="0" y="${height - bottomTextHeight}" width="${width}" height="${bottomTextHeight}" fill="rgba(6, 8, 14, 0.85)"/>
        <text
          x="${width / 2}"
          y="${height - bottomTextHeight / 2 + 5}"
          font-family="'Courier New', Courier, monospace"
          font-size="16"
          font-weight="400"
          fill="#00E5FF"
          text-anchor="middle"
          letter-spacing="3"
          opacity="0.8"
        >${overlay.bottom}</text>
      </svg>
    `;

    await image
      .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
      .toFile(outputPath);

    console.log(`✓ Framed: ${path.basename(outputPath)}`);
  } catch (err) {
    console.error(`✗ Failed: ${path.basename(inputPath)} - ${err.message}`);
  }
}

async function processScreenshots() {
  const files = fs.readdirSync(RAW_DIR).filter(f => /\.(png|jpg|jpeg)$/i.test(f));

  if (files.length === 0) {
    console.log('No screenshots found in screenshots/raw/');
    console.log('Add your iPhone screenshots there and run again.');
    return;
  }

  console.log(`Processing ${files.length} screenshot(s)...\n`);

  for (const file of files) {
    const inputPath = path.join(RAW_DIR, file);
    const outputPath = path.join(OUTPUT_DIR, file);

    // Detect type from filename
    let overlay = OVERLAYS.home; // default
    const lower = file.toLowerCase();
    if (lower.includes('commander')) overlay = OVERLAYS.commanders;
    else if (lower.includes('battle')) overlay = OVERLAYS.battle;
    else if (lower.includes('campaign')) overlay = OVERLAYS.campaign;
    else if (lower.includes('pass') || lower.includes('season')) overlay = OVERLAYS.battlepass;
    else if (lower.includes('victory') || lower.includes('gameover')) overlay = OVERLAYS.victory;

    await addFrame(inputPath, outputPath, overlay);
  }

  console.log(`\n✅ Done! Framed screenshots saved to: screenshots/framed/`);
  console.log('Upload these to App Store Connect.');
}

processScreenshots().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

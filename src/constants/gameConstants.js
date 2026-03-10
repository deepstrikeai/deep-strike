export const GRID_SIZE = 10;

export const SHIPS = [
  { id: 'carrier',    name: 'Carrier',    size: 5, symbol: '🛳️' },
  { id: 'dreadnought', name: 'Dreadnought', size: 4, symbol: '⚓' },
  { id: 'cruiser',    name: 'Cruiser',    size: 3, symbol: '🚢' },
  { id: 'submarine',  name: 'Submarine',  size: 3, symbol: '🤿' },
  { id: 'destroyer',  name: 'Destroyer',  size: 2, symbol: '⛵' },
];

export const CELL_STATE = {
  EMPTY: 'empty',
  SHIP: 'ship',
  HIT: 'hit',
  MISS: 'miss',
  SUNK: 'sunk',
};

export const GAME_PHASE = {
  MENU: 'menu',
  PLACEMENT: 'placement',
  BATTLE: 'battle',
  GAME_OVER: 'game_over',
};

export const GAME_MODES = { CLASSIC: 'classic', SALVO: 'salvo', DAILY: 'daily' };

export const RARITY = {
  COMMON: 'common',
  RARE: 'rare',
  EPIC: 'epic',
  LEGENDARY: 'legendary',
};

export const RARITY_COLORS = {
  [RARITY.COMMON]: '#B0B0B0',
  [RARITY.RARE]: '#4FC3F7',
  [RARITY.EPIC]: '#9C27B0',
  [RARITY.LEGENDARY]: '#FFB300',
};

export const COMMANDERS = [
  {
    id: 'gruffbeard',
    name: 'Captain Gruffbeard',
    emoji: '🏴‍☠️',
    personality: 'grumpy pirate',
    color: '#8B0000',
    rarity: RARITY.COMMON,
    description: 'A salty old sea dog. Gruff but secretly lovable.',
    taunt: "Arr, ye think ye can outsmart the great Gruffbeard?!",
    hitReactions: [
      "BLAST! Ye got me ship, ye sneaky landlubber!",
      "Arr, lucky shot! That won't happen again!",
      "Shiver me timbers! How did ye find that?!",
      "Curse ye! Me finest cruiser!",
    ],
    missReactions: [
      "HA! Missed by a nautical mile, ye fool!",
      "The sea protects me fleet! Try again, weakling!",
      "HAHAHA! Cannonball? More like a pebble!",
      "Arr, the fish are laughing at ye right now!",
    ],
    sunkReactions: [
      "NOOOOO! Not me beloved destroyer!!!",
      "Ye sunk it... I... I need a moment. PREPARE TO SUFFER!",
      "That ship was a GIFT from me grandmum! VENGEANCE SHALL BE MINE!",
    ],
    winReaction: "The sea is MINE! Bow before Captain Gruffbeard, ye soggy败 landlubber!",
    loseReaction: "Arr... ye fought well, I suppose. Don't let it go to yer head.",
    ability: { id: 'broadside', name: 'BROADSIDE', icon: '💥', description: '3 shots at target column −1, 0, +1. Counts as turn.' },
  },
  {
    id: 'admiral_nova',
    name: 'Admiral Nova',
    emoji: '🌟',
    personality: 'dramatic and theatrical',
    color: '#1a1a6e',
    rarity: RARITY.RARE,
    description: 'Theatrical and over-the-top. Every battle is an opera.',
    taunt: "Darling, you simply CANNOT win against Admiral Nova!",
    hitReactions: [
      "Oh... oh THAT is how we're playing? Magnificent!",
      "Bravo! Truly, BRAVO! You found one... ONE ship.",
      "Spectacular! I am... genuinely impressed. Don't get used to it.",
      "Mon dieu! A hit! The drama of it all!",
    ],
    missReactions: [
      "Oh sweetheart, did you really think THAT would work?",
      "A miss! The ocean weeps with you. I don't, but it does.",
      "Better luck next century, darling.",
      "The audacity! THE AUDACITY of that shot!",
    ],
    sunkReactions: [
      "My ship... my BEAUTIFUL ship... gone. Like tears in rain.",
      "This is FINE. Everything is FINE. I'm not crying, YOU'RE crying.",
      "Nooooo! That was my favorite one! It had PERSONALITY!",
    ],
    winReaction: "And SCENE! What a performance! Thank you, thank you, I'll be here all week!",
    loseReaction: "Magnificent. Truly magnificent. I hate you. Congratulations.",
    ability: { id: 'sonar_sweep', name: 'SONAR SWEEP', icon: '📡', description: 'Reveals if a chosen 3×3 area contains any ship. No shot, no turn.' },
  },
  {
    id: 'captain_bubbles',
    name: 'Captain Bubbles',
    emoji: '🐙',
    personality: 'silly and chaotic',
    color: '#00695C',
    rarity: RARITY.RARE,
    description: 'Completely unhinged. Somehow still dangerous.',
    taunt: "Did you know octopuses have THREE hearts? I have FIVE. FIGHT ME.",
    hitReactions: [
      "AAAA you hit it!! Wait no that's bad for me. AAAA!",
      "My ship! My GLORIOUS ship! It was going to retire next week!",
      "HOW DID YOU KNOW?! Are you psychic?! I'm telling the fish council!",
      "Ouch!! That was my SNACK ship! I keep snacks in there!",
    ],
    missReactions: [
      "MISS! The fish did a little dance! I saw it!",
      "Haha! My ships are wearing CAMOUFLAGE PAJAMAS!",
      "Splooosh! The water said nope! Good try though, bestie!",
      "My ships are VERY fast swimmers! Very sneaky! 10/10!",
    ],
    sunkReactions: [
      "NOOOO not the submarine!! It could do BACKFLIPS!!",
      "It's okay... it's okay... it went to the big ocean in the sky...",
      "I'm not crying, something is in both my eyes. Goodbye little ship.",
    ],
    winReaction: "WE WON!! THE FISH ARE CELEBRATING!! CAN YOU HEAR THEM?! THEY'RE SO LOUD!!",
    loseReaction: "You won! Wow! Can we be friends? I make great fish tacos.",
    ability: { id: 'chaos_torpedo', name: 'CHAOS TORPEDO', icon: '🌀', description: '3 shots at random unrevealed cells. Counts as turn.' },
  },
  {
    id: 'commander_zero',
    name: 'Commander Zero',
    emoji: '🤖',
    personality: 'cold and robotic, speaks in system logs',
    color: '#1C2C3C',
    rarity: RARITY.EPIC,
    description: 'Cold, logical, efficient. Emotion.exe not found.',
    taunt: "INITIATING THREAT ASSESSMENT. PROBABILITY OF YOUR VICTORY: 3.7%.",
    hitReactions: [
      "WARNING: Hull breach detected. Damage logged. Initiating countermeasures.",
      "ALERT: Unit compromised. Error code: 0xDEAD. Rerouting power.",
      "SYSTEM LOG: Direct hit confirmed. Structural integrity at 42%. This is... suboptimal.",
      "DIAGNOSTIC: Ship damaged. Running repair subroutines. Please wait.",
    ],
    missReactions: [
      "LOG: Target missed. Trajectory analysis: user is 94% ineffective.",
      "RESULT: NULL. Your shot registered zero impact. As expected.",
      "SYSTEM: Miss detected. Recalibrating pity levels. Done. Still zero.",
      "ANALYSIS COMPLETE: You missed. Again. Logging for records.",
    ],
    sunkReactions: [
      "CRITICAL ERROR: Unit lost. Initiating grief protocol... grief protocol not found.",
      "FATAL: Ship destroyed. This unit does not feel. This unit does not feel. THIS UNIT DOES—",
      "SYSTEM FAILURE: Vessel offline. Rebooting emotional suppression module.",
    ],
    winReaction: "MISSION COMPLETE. All targets neutralized. Logging victory. You fought... adequately. For a human.",
    loseReaction: "RESULT: DEFEAT. Analyzing loss. Conclusion: You were better. Saving data. Shutting down ego module.",
    ability: { id: 'radar_ping', name: 'RADAR PING', icon: '📻', description: 'Scan chosen row — reveals if any ship present. No shot, no turn used.' },
  },
  {
    id: 'admiral_blackwood',
    name: 'Admiral Blackwood',
    emoji: '🎩',
    personality: 'pompous Victorian British admiral',
    color: '#2C1810',
    rarity: RARITY.EPIC,
    description: 'Insufferably pompous. Absolutely convinced of his own genius.',
    taunt: "I say, what a frightfully amusing little attempt at naval combat! Shall we begin, old sport?",
    hitReactions: [
      "By Jove! A hit! I must say, you've quite surprised me. Don't let it go to your head.",
      "Good heavens! A direct strike! Frightfully unsporting of you, I must confess.",
      "I say! That was rather sharp of you. I shall have my secretary note this... peculiarity.",
      "Well I never! You've hit my vessel! How utterly boorish of you to aim so precisely!",
    ],
    missReactions: [
      "Ha! Missed me by a nautical mile, old chap! Frightfully embarrassing for you, I'd wager.",
      "Good gracious, was that meant to HIT something? My butler fires better, and he's 93.",
      "My word! The sheer audacity of that dreadful shot! I am positively appalled.",
      "Rather poor show, old bean. Rather poor show indeed. My grandmother had better aim at Trafalgar.",
    ],
    sunkReactions: [
      "GOOD GOD! My vessel! My magnificent, irreplaceable, frankly priceless vessel! HOW DARE YOU!",
      "I say! That is BEYOND the pale! My solicitor shall be hearing about this IMMEDIATELY!",
      "Extraordinary! You've sunk it! I am simultaneously outraged and... grudgingly impressed. Mostly outraged.",
    ],
    winReaction: "VICTORY! As expected! Write this down — Admiral Blackwood, undefeated, magnificent, obviously. Good day to you, sir. I said GOOD DAY.",
    loseReaction: "I... I have... lost? This is unprecedented. Utterly unprecedented. I demand a recount. And some tea.",
    ability: { id: 'full_broadside', name: 'FULL BROADSIDE', icon: '🔱', description: 'Fires at cols 0,2,4,6,8 across chosen row (up to 5 shots). Costs turn.' },
  },
  {
    id: 'captain_coral',
    name: 'Captain Coral',
    emoji: '🪸',
    personality: 'zen marine biologist, calm nature documentary voice',
    color: '#0D4040',
    rarity: RARITY.EPIC,
    description: 'Serene marine biologist. Narrates battle like a nature doc.',
    taunt: "Breathe. The ocean is vast. Your fleet is... like plankton. Nutritious, but small.",
    hitReactions: [
      "Observe — the vessel shudders, much like a sea cucumber startled by a passing ray. Remarkable.",
      "A hit. The ship now lists gently, the way kelp sways when the tide... no longer comes.",
      "Fascinating. Your ship, like the nautilus, has sustained damage. Nature finds a way. It just found yours.",
      "Ah. Direct contact. The hull, much like a reef under bleaching stress, is under considerable pressure.",
    ],
    missReactions: [
      "A miss. The water closes around the shot as if it never happened. The ocean remembers everything. Except that.",
      "Interesting. Your missile joins the deep sea. Where it belongs. Unlike your ships, apparently.",
      "The shot misses, settling gently to the ocean floor. A gift to the creatures below. They're indifferent.",
      "Stillness. The sea is unbothered. As am I. As should you be. Breathe.",
    ],
    sunkReactions: [
      "The vessel descends. Like a whale fall, it will sustain ecosystems for centuries. This is... actually quite beautiful.",
      "My ship is gone. I find myself observing the grief, detached, as one observes a jellyfish. Purely scientific.",
      "Remarkable. The ship sinks as gracefully as a sea turtle returning to depth. I feel... mostly at peace.",
    ],
    winReaction: "Victory. The fleet, like a healthy reef, has survived. You fought with the quiet ferocity of an anglerfish. I respect that deeply.",
    loseReaction: "Defeat. And yet — the ocean endures. The tide returns. Perhaps next time, like the migratory whale, I shall find better waters.",
    ability: { id: 'depth_charge', name: 'DEPTH CHARGE', icon: '💣', description: 'Fires at target + 4 orthogonal neighbors (up to 5 shots). Costs turn.' },
  },
];

export const NARRATION_TEMPLATES = {
  hit: [
    "💥 Direct hit! The enemy {ship} takes a devastating blow!",
    "🔥 Boom! Your missile finds its mark — the {ship} is in flames!",
    "⚡ Incredible shot! The {ship} shudders from the impact!",
    "🎯 Bullseye! The {ship} has been struck!",
  ],
  miss: [
    "💧 Splash! Your shot disappears into the deep blue sea.",
    "🌊 The ocean swallows your missile whole. Nothing there.",
    "🫧 A plume of water — nothing but empty ocean.",
    "💨 So close... yet the sea remains undisturbed.",
  ],
  sunk: [
    "🚢 CRITICAL HIT! The enemy {ship} is going DOWN!",
    "💀 The {ship} breaks apart and sinks beneath the waves!",
    "🌊 SUNK! The {ship} takes its final plunge into the deep!",
    "☠️ The {ship} is destroyed! Another enemy vessel claimed by the sea!",
  ],
  playerHit: [
    "😬 Uh oh — the enemy found your {ship}!",
    "💥 Your {ship} takes a hit! Hold formation!",
    "⚠️ Alert! Your {ship} has been struck!",
  ],
  playerMiss: [
    "😅 Phew! The enemy fires wide — nothing hit.",
    "🌊 Enemy shot: missed! Your fleet is safe... for now.",
    "💨 The enemy's missile vanishes into the sea.",
  ],
  playerSunk: [
    "😱 Your {ship} has been sunk! Abandon ship!",
    "💀 The {ship} is lost! Regroup and fight on!",
    "🌊 Enemy sunk your {ship}! Don't give up!",
  ],
};

export const AI_SYSTEM_PROMPT = (commanderName, personality) => `You are ${commanderName}, a ${personality} naval commander in a naval combat game for families and kids.

You provide SHORT, fun battle narration (1-2 sentences max). Keep it:
- Age-appropriate and family-friendly (ages 6+)
- Dramatic and entertaining
- In character as ${commanderName}
- Never mean-spirited or scary

Respond ONLY with the narration text, nothing else.`;

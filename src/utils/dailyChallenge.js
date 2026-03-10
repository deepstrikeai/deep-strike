import AsyncStorage from '@react-native-async-storage/async-storage';
import { GRID_SIZE, SHIPS } from '../constants/gameConstants';

// ── Seeded RNG (LCG) ──────────────────────────────────────────────────────────

const LCG_A = 1664525;
const LCG_C = 1013904223;
const LCG_M = 2 ** 32;

export const getDailySeed = () => Math.floor(Date.now() / 86400000);

// Returns a stateful seeded PRNG function
export const seededRandom = (seed) => {
  let state = seed >>> 0;
  return () => {
    state = (LCG_A * state + LCG_C) % LCG_M;
    return state / LCG_M;
  };
};

// ── Fleet placement with seeded RNG ──────────────────────────────────────────

const isValidPlacement = (grid, ship, row, col, horizontal) => {
  for (let i = 0; i < ship.size; i++) {
    const r = horizontal ? row : row + i;
    const c = horizontal ? col + i : col;
    if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) return false;
    if (grid[r][c] !== null) return false;
  }
  return true;
};

const placeShip = (grid, ship, row, col, horizontal) => {
  const next = grid.map(r => [...r]);
  for (let i = 0; i < ship.size; i++) {
    const r = horizontal ? row : row + i;
    const c = horizontal ? col + i : col;
    next[r][c] = ship.id;
  }
  return next;
};

export const buildDailyFleet = (seed) => {
  const rng = seededRandom(seed);
  let shipGrid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
  const placements = {};

  for (const ship of SHIPS) {
    let placed = false;
    let attempts = 0;
    while (!placed && attempts < 200) {
      const horizontal = rng() < 0.5;
      const row = Math.floor(rng() * GRID_SIZE);
      const col = Math.floor(rng() * GRID_SIZE);
      if (isValidPlacement(shipGrid, ship, row, col, horizontal)) {
        shipGrid = placeShip(shipGrid, ship, row, col, horizontal);
        placements[ship.id] = { row, col, horizontal, size: ship.size, hits: 0, sunk: false };
        placed = true;
      }
      attempts++;
    }
  }
  return { shipGrid, placements };
};

// ── Scoring ───────────────────────────────────────────────────────────────────

export const calculateStars = (shots) => {
  if (shots <= 18) return 3;
  if (shots <= 25) return 2;
  return 1;
};

// ── AsyncStorage persistence ──────────────────────────────────────────────────

const recordKey = (seed) => `@deepstrike_daily_${seed}`;

export const getDailyRecord = async (seed) => {
  try {
    const raw = await AsyncStorage.getItem(recordKey(seed));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const saveDailyRecord = async (seed, shots) => {
  try {
    const existing = await getDailyRecord(seed);
    const stars = calculateStars(shots);
    const record = {
      shots,
      stars,
      completed: true,
      bestShots: existing ? Math.min(existing.bestShots ?? shots, shots) : shots,
    };
    await AsyncStorage.setItem(recordKey(seed), JSON.stringify(record));
    return record;
  } catch {
    return null;
  }
};

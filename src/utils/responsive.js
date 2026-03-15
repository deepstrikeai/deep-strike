// responsive.js
// Central responsive layout utilities for Deep Strike.
//
// Design base: iPhone 14 (390 x 844)
// Supported: iPhone SE → iPhone Pro Max → iPad mini → iPad Air → iPad Pro 12.9"

import { Dimensions } from 'react-native';

const { width: W, height: H } = Dimensions.get('window');

export const SCREEN_W = W;
export const SCREEN_H = H;

// Device class
export const isTablet     = W >= 768;
export const isLargePhone = W >= 414;

const BASE_W = 390;
const BASE_H = 844;

// Linear scale — use for layout dimensions, padding, icon sizes
export const scale = (n) => (W / BASE_W) * n;

// Moderate scale — use for font sizes. Prevents extreme sizes on large screens.
// factor 0.0 = no scaling, 1.0 = full linear scaling
export const ms = (n, f = 0.4) => Math.round(n + (scale(n) - n) * f);

// Vertical scale
export const vs = (n) => (H / BASE_H) * n;

// Width / height as percentage of screen
export const wp = (pct) => W * (pct / 100);
export const hp = (pct) => H * (pct / 100);

// Max content width — constrains layouts on tablets so content doesn't stretch
// too wide. Use as maxWidth on your root content container.
export const MAX_CONTENT_W = isTablet ? Math.min(580, W * 0.76) : W;

// ── Grid constants ───────────────────────────────────────────────────────────
//
// PlacementScreen layout (portrait):
//   [padding 16] [axis 20] [10 cells × (size + 2px margin)] [padding 16]
//
const PLACEMENT_PADDING = 32; // 16 × 2
const PLACEMENT_AXIS_W  = 20;
const PLACEMENT_CELL_MARGIN = 2; // 1px marginHorizontal each side

export const PLACEMENT_CELL_SIZE   = Math.min(68, Math.floor((W - PLACEMENT_PADDING - PLACEMENT_AXIS_W) / 10) - PLACEMENT_CELL_MARGIN);
export const PLACEMENT_CELL_STRIDE = PLACEMENT_CELL_SIZE + PLACEMENT_CELL_MARGIN;
export const PLACEMENT_ROW_STRIDE  = PLACEMENT_CELL_SIZE + PLACEMENT_CELL_MARGIN;
export const PLACEMENT_AXIS_WIDTH  = PLACEMENT_AXIS_W;

// BattleScreen layout (portrait):
//   Axis label width = CELL_SIZE + 2 (matches cell stride)
//   Total = 11 × (CELL_SIZE + 2) + 24px padding
//
const BATTLE_PADDING = 24; // 12 × 2
export const BATTLE_CELL_SIZE = Math.min(58, Math.floor((W - BATTLE_PADDING) / 11) - 2);

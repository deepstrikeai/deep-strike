import { Platform } from 'react-native';

// ─── DEEP STRIKE Design System ───────────────────────────────────────────────
// Phosphor-cyan on near-black. Military precision meets premium esports.

export const C = {
  BG:           '#06080E',
  BG_CARD:      'rgba(0,229,255,0.04)',
  BG_SURFACE:   '#0C1018',

  CYAN:         '#00E5FF',
  CYAN_DIM:     'rgba(0,229,255,0.14)',
  CYAN_BORDER:  'rgba(0,229,255,0.28)',
  CYAN_GLOW:    'rgba(0,229,255,0.45)',

  RED:          '#FF2B2B',
  RED_DIM:      'rgba(255,43,43,0.18)',
  RED_BORDER:   'rgba(255,43,43,0.5)',

  GREEN:        '#00FF7F',
  GREEN_DIM:    'rgba(0,255,127,0.12)',
  GREEN_BORDER: 'rgba(0,255,127,0.4)',

  AMBER:        '#FFB300',
  AMBER_DIM:    'rgba(255,179,0,0.14)',
  AMBER_BORDER: 'rgba(255,179,0,0.4)',

  // Grid cell states
  CELL_HIT:   '#FF2B2B',
  CELL_MISS:  '#112233',
  CELL_SUNK:  '#6B0000',

  TEXT:       '#FFFFFF',
  TEXT_DIM:   'rgba(255,255,255,0.5)',
  TEXT_MUTED: 'rgba(255,255,255,0.2)',

  BORDER:     'rgba(0,229,255,0.15)',
  BORDER_MED: 'rgba(0,229,255,0.32)',
};

export const FONT = {
  MONO: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
};

export const GLOW = {
  cyan: {
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 14,
    elevation: 8,
  },
  red: {
    shadowColor: '#FF2B2B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 6,
  },
  green: {
    shadowColor: '#00FF7F',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
  },
};

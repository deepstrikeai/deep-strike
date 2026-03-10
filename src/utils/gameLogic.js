import { GRID_SIZE, SHIPS, CELL_STATE } from '../constants/gameConstants';

export const createEmptyGrid = () =>
  Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(CELL_STATE.EMPTY));

export const createEmptyShipGrid = () =>
  Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));

export const isValidPlacement = (grid, ship, row, col, horizontal) => {
  for (let i = 0; i < ship.size; i++) {
    const r = horizontal ? row : row + i;
    const c = horizontal ? col + i : col;
    if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) return false;
    if (grid[r][c] !== null) return false;
  }
  return true;
};

export const placeShip = (shipGrid, ship, row, col, horizontal) => {
  const newGrid = shipGrid.map(r => [...r]);
  for (let i = 0; i < ship.size; i++) {
    const r = horizontal ? row : row + i;
    const c = horizontal ? col + i : col;
    newGrid[r][c] = ship.id;
  }
  return newGrid;
};

export const autoPlaceShips = () => {
  let shipGrid = createEmptyShipGrid();
  const placements = {};

  for (const ship of SHIPS) {
    let placed = false;
    let attempts = 0;
    while (!placed && attempts < 100) {
      const horizontal = Math.random() < 0.5;
      const row = Math.floor(Math.random() * GRID_SIZE);
      const col = Math.floor(Math.random() * GRID_SIZE);
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

export const checkSunk = (placements, shipId) => {
  const p = placements[shipId];
  return p && p.hits >= p.size;
};

export const processShot = (shipGrid, displayGrid, placements, row, col) => {
  const newDisplay = displayGrid.map(r => [...r]);
  const newPlacements = JSON.parse(JSON.stringify(placements));
  const shipId = shipGrid[row][col];

  if (shipId) {
    newDisplay[row][col] = CELL_STATE.HIT;
    newPlacements[shipId].hits += 1;
    const sunk = newPlacements[shipId].hits >= newPlacements[shipId].size;
    if (sunk) {
      newPlacements[shipId].sunk = true;
      // Mark all cells of sunk ship
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          if (shipGrid[r][c] === shipId) {
            newDisplay[r][c] = CELL_STATE.SUNK;
          }
        }
      }
    }
    return { newDisplay, newPlacements, hit: true, sunk, shipId };
  } else {
    newDisplay[row][col] = CELL_STATE.MISS;
    return { newDisplay, newPlacements, hit: false, sunk: false, shipId: null };
  }
};

export const checkWin = (placements) =>
  Object.values(placements).every(p => p.sunk);

export const getAIShot = (difficulty, opponentDisplayGrid) => {
  if (difficulty === 'easy') {
    return getRandomShot(opponentDisplayGrid);
  } else if (difficulty === 'medium') {
    return getHuntTargetShot(opponentDisplayGrid);
  } else {
    return getProbabilityShot(opponentDisplayGrid);
  }
};

const getRandomShot = (grid) => {
  const available = [];
  for (let r = 0; r < GRID_SIZE; r++)
    for (let c = 0; c < GRID_SIZE; c++)
      if (grid[r][c] === CELL_STATE.EMPTY || grid[r][c] === CELL_STATE.SHIP)
        available.push([r, c]);
  return available[Math.floor(Math.random() * available.length)];
};

const getHuntTargetShot = (grid) => {
  // Find adjacent cells to existing hits
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] === CELL_STATE.HIT) {
        const neighbors = [[r-1,c],[r+1,c],[r,c-1],[r,c+1]];
        for (const [nr, nc] of neighbors) {
          if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
            if (grid[nr][nc] === CELL_STATE.EMPTY || grid[nr][nc] === CELL_STATE.SHIP)
              return [nr, nc];
          }
        }
      }
    }
  }
  return getRandomShot(grid);
};

const getProbabilityShot = (grid) => {
  // Simple probability density - prefer center and hunt hits
  const huntResult = getHuntTargetShot(grid);
  if (huntResult) return huntResult;
  
  // Checkerboard pattern for efficiency
  const available = [];
  for (let r = 0; r < GRID_SIZE; r++)
    for (let c = 0; c < GRID_SIZE; c++)
      if ((grid[r][c] === CELL_STATE.EMPTY || grid[r][c] === CELL_STATE.SHIP) && (r + c) % 2 === 0)
        available.push([r, c]);
  
  if (available.length === 0) return getRandomShot(grid);
  return available[Math.floor(Math.random() * available.length)];
};

export const coordToLabel = (row, col) => {
  const letters = 'ABCDEFGHIJ';
  return `${letters[row]}${col + 1}`;
};

export const parseVoiceCoord = (text) => {
  if (!text) return null;
  const cleaned = text.toUpperCase().replace(/[^A-J0-9]/g, '');
  const match = cleaned.match(/([A-J])(\d{1,2})/);
  if (!match) return null;
  const row = 'ABCDEFGHIJ'.indexOf(match[1]);
  const col = parseInt(match[2]) - 1;
  if (row < 0 || col < 0 || col >= GRID_SIZE) return null;
  return [row, col];
};

// Parses a voice utterance into a structured command.
// Returns one of:
//   { type: 'coord',       coord: [row, col] }
//   { type: 'multi_coord', coords: [[row, col], ...] }   — salvo mode
//   { type: 'ability' }
//   { type: 'switch_grid' }
//   { type: 'taunt' }
//   null  — unrecognized
export const parseVoiceCommand = (text) => {
  if (!text) return null;
  const lower = text.toLowerCase().trim();

  // Ability triggers
  if (/\b(ability|special|use ability|fire ability|activate|unleash|deploy ability)\b/.test(lower)) {
    return { type: 'ability' };
  }

  // Grid switch triggers
  if (/\b(switch|flip|toggle|show fleet|my fleet|show attack|attack grid|switch grid|other side)\b/.test(lower)) {
    return { type: 'switch_grid' };
  }

  // Emotes
  if (/\b(taunt|laugh|boast|mock|challenge|bring it)\b/.test(lower)) {
    return { type: 'emote', emote: 'taunt' };
  }
  if (/\b(cheer|celebrate|yeah|victory|woo|yes|nice shot)\b/.test(lower)) {
    return { type: 'emote', emote: 'cheer' };
  }
  if (/\b(groan|ugh|darn|miss|dang|oh no)\b/.test(lower)) {
    return { type: 'emote', emote: 'groan' };
  }
  if (/\b(battle cry|war cry|charge|attack|fire at will)\b/.test(lower)) {
    return { type: 'emote', emote: 'battle_cry' };
  }

  // Multi-coordinate (salvo): find all coords in the utterance
  const upper = text.toUpperCase();
  const coordPattern = /([A-J])[\s-]?(\d{1,2})/g;
  const coords = [];
  let m;
  while ((m = coordPattern.exec(upper)) !== null) {
    const row = 'ABCDEFGHIJ'.indexOf(m[1]);
    const col = parseInt(m[2]) - 1;
    if (row >= 0 && col >= 0 && col < GRID_SIZE) {
      coords.push([row, col]);
    }
  }
  if (coords.length > 1) return { type: 'multi_coord', coords };
  if (coords.length === 1) return { type: 'coord', coord: coords[0] };

  return null;
};

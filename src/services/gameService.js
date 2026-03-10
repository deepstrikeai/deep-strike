import { doc, setDoc, getDoc, updateDoc, onSnapshot, runTransaction, deleteDoc, arrayUnion, collection, query, where, getDocs, limit, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { GRID_SIZE, CELL_STATE } from '../constants/gameConstants';
import { sendTurnNotification } from './notificationService';

const emptyGrid = () =>
  Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(CELL_STATE.EMPTY));

// Firestore does not support nested arrays (arrays of arrays).
// Store all grids as flat 1-D arrays of length GRID_SIZE*GRID_SIZE and
// reconstruct the 2-D form on the client side.
const flattenGrid = (grid) => grid.flat();
export const unflattenGrid = (flat) => {
  const out = [];
  for (let r = 0; r < GRID_SIZE; r++)
    out.push(flat.slice(r * GRID_SIZE, (r + 1) * GRID_SIZE));
  return out;
};

const generateCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

export const createGame = async (gameMode = 'classic') => {
  const roomCode = generateCode();
  await setDoc(doc(db, 'games', roomCode), {
    status: 'waiting',
    currentTurn: 1,
    winner: null,
    createdAt: Date.now(),
    gameMode,
    p1Ready: false,
    p2Ready: false,
    p1ShipGrid: null,
    p1Placements: null,
    p2ShipGrid: null,
    p2Placements: null,
    p1AttackGrid: flattenGrid(emptyGrid()),
    p2AttackGrid: flattenGrid(emptyGrid()),
    p1AbilityUsed: false,
    p2AbilityUsed: false,
    p1Commander: null,
    p2Commander: null,
    p1PushToken: null,
    p2PushToken: null,
    p1PlayerId: null,
    p2PlayerId: null,
    moves: [],
  });
  return roomCode;
};

export const joinGame = async (roomCode) => {
  const code = roomCode.toUpperCase().trim();
  const ref = doc(db, 'games', code);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Room not found');
  const data = snap.data();
  if (data.status !== 'waiting') throw new Error('Game already in progress');
  await updateDoc(ref, { status: 'placing' });
  return code;
};

export const submitPlacement = async (roomCode, playerNum, shipGrid, placements, commanderId = null, pushToken = null, playerId = null) => {
  const ref = doc(db, 'games', roomCode);
  const otherNum = playerNum === 1 ? 2 : 1;
  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref);
    const data = snap.data();
    const updates = {
      [`p${playerNum}ShipGrid`]: flattenGrid(shipGrid),
      [`p${playerNum}Placements`]: placements,
      [`p${playerNum}Ready`]: true,
    };
    if (commanderId) updates[`p${playerNum}Commander`] = commanderId;
    if (pushToken) updates[`p${playerNum}PushToken`] = pushToken;
    if (playerId) updates[`p${playerNum}PlayerId`] = playerId;
    if (data[`p${otherNum}Ready`]) {
      updates.status = 'battle';
    }
    transaction.update(ref, updates);
  });
};

// Internal: process a single shot and return updated grids/placements without writing to Firestore.
// Returns null if the cell was already fired upon.
const _applyShotLogic = (row, col, opponentShipGrid, attackGrid, opponentPlacements) => {
  if (attackGrid[row][col] !== CELL_STATE.EMPTY) return null;
  const workAttack = attackGrid.map(r => [...r]);
  const workPlacements = JSON.parse(JSON.stringify(opponentPlacements));
  const shipId = opponentShipGrid[row][col];
  const hit = !!shipId;
  let sunk = false;
  if (hit) {
    workPlacements[shipId].hits += 1;
    if (workPlacements[shipId].hits >= workPlacements[shipId].size) {
      sunk = true;
      workPlacements[shipId].sunk = true;
      for (let r = 0; r < GRID_SIZE; r++)
        for (let c = 0; c < GRID_SIZE; c++)
          if (opponentShipGrid[r][c] === shipId)
            workAttack[r][c] = CELL_STATE.SUNK;
    } else {
      workAttack[row][col] = CELL_STATE.HIT;
    }
  } else {
    workAttack[row][col] = CELL_STATE.MISS;
  }
  return { attackGrid: workAttack, placements: workPlacements, hit, sunk, shipId };
};

// gameData passed here already has 2D grids (unflattened by MultiplayerBattleScreen).
// We process them as 2D and flatten back before writing to Firestore.
// isLastSalvoShot: when true (or classic mode) flip currentTurn to opponent.
export const fireShot = async (roomCode, shooterNum, row, col, gameData, isLastSalvoShot = true) => {
  const opponentNum = shooterNum === 1 ? 2 : 1;
  const opponentShipGrid = gameData[`p${opponentNum}ShipGrid`];
  const opponentPlacements = gameData[`p${opponentNum}Placements`];
  const myAttackGrid = gameData[`p${shooterNum}AttackGrid`];

  const result = _applyShotLogic(row, col, opponentShipGrid, myAttackGrid, opponentPlacements);
  if (!result) return { hit: false, sunk: false, shipId: null, winner: null };

  const { attackGrid, placements, hit, sunk, shipId } = result;
  const allSunk = Object.values(placements).every(p => p.sunk);

  const shouldFlipTurn = isLastSalvoShot || gameData.gameMode === 'classic';
  const updates = {
    [`p${shooterNum}AttackGrid`]: flattenGrid(attackGrid),
    [`p${opponentNum}Placements`]: placements,
    moves: arrayUnion({ playerNum: shooterNum, row, col, hit, sunk, shipId: shipId || null, timestamp: Date.now() }),
  };
  if (shouldFlipTurn) updates.currentTurn = opponentNum;
  if (allSunk) {
    updates.winner = shooterNum;
    updates.status = 'finished';
  }

  await updateDoc(doc(db, 'games', roomCode), updates);

  // Send push notification to opponent when it's now their turn
  if (shouldFlipTurn && !allSunk) {
    const opponentToken = gameData[`p${opponentNum}PushToken`];
    sendTurnNotification(opponentToken, roomCode).catch(() => {});
  }

  return { hit, sunk, shipId, winner: allSunk ? shooterNum : null };
};

// Fire a commander special ability.
// Returns { results: [...], winner } where results is an array of shot outcomes.
export const fireAbility = async (roomCode, playerNum, abilityId, targetRow, targetCol, gameData) => {
  const opponentNum = playerNum === 1 ? 2 : 1;
  const ref = doc(db, 'games', roomCode);

  if (abilityId === 'sonar_sweep' || abilityId === 'radar_ping') {
    // No shots, no turn change — just mark ability as used
    await updateDoc(ref, { [`p${playerNum}AbilityUsed`]: true });
    return { results: [], winner: null };
  }

  const opponentShipGrid = gameData[`p${opponentNum}ShipGrid`];
  const opponentPlacements = gameData[`p${opponentNum}Placements`];
  let myAttackGrid = gameData[`p${playerNum}AttackGrid`];

  let shotCoords = [];
  if (abilityId === 'broadside') {
    const cols = [targetCol - 1, targetCol, targetCol + 1]
      .map(c => Math.max(0, Math.min(GRID_SIZE - 1, c)));
    shotCoords = [...new Set(cols)].map(c => [targetRow, c]);
  } else if (abilityId === 'chaos_torpedo') {
    const empty = [];
    for (let r = 0; r < GRID_SIZE; r++)
      for (let c = 0; c < GRID_SIZE; c++)
        if (myAttackGrid[r][c] === CELL_STATE.EMPTY) empty.push([r, c]);
    for (let i = empty.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [empty[i], empty[j]] = [empty[j], empty[i]];
    }
    shotCoords = empty.slice(0, 3);
  } else if (abilityId === 'full_broadside') {
    shotCoords = [0, 2, 4, 6, 8].map(c => [targetRow, c]);
  } else if (abilityId === 'depth_charge') {
    shotCoords = [
      [targetRow, targetCol],
      [targetRow - 1, targetCol], [targetRow + 1, targetCol],
      [targetRow, targetCol - 1], [targetRow, targetCol + 1],
    ].filter(([r, c]) => r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE);
  }

  let currentAttack = myAttackGrid.map(r => [...r]);
  let currentPlacements = JSON.parse(JSON.stringify(opponentPlacements));
  const results = [];

  for (const [r, c] of shotCoords) {
    const res = _applyShotLogic(r, c, opponentShipGrid, currentAttack, currentPlacements);
    if (res) {
      currentAttack = res.attackGrid;
      currentPlacements = res.placements;
      results.push({ row: r, col: c, hit: res.hit, sunk: res.sunk, shipId: res.shipId });
    }
  }

  const allSunk = Object.values(currentPlacements).every(p => p.sunk);
  const moveEntries = results.map(r => ({
    playerNum,
    row: r.row,
    col: r.col,
    hit: r.hit,
    sunk: r.sunk,
    shipId: r.shipId || null,
    timestamp: Date.now(),
  }));
  const updates = {
    [`p${playerNum}AttackGrid`]: flattenGrid(currentAttack),
    [`p${opponentNum}Placements`]: currentPlacements,
    [`p${playerNum}AbilityUsed`]: true,
    currentTurn: opponentNum,
  };
  if (moveEntries.length > 0) updates.moves = arrayUnion(...moveEntries);
  if (allSunk) {
    updates.winner = playerNum;
    updates.status = 'finished';
  }

  await updateDoc(ref, updates);

  if (!allSunk) {
    const opponentToken = gameData[`p${opponentNum}PushToken`];
    sendTurnNotification(opponentToken, roomCode).catch(() => {});
  }

  return { results, winner: allSunk ? playerNum : null };
};

// ── Global Matchmaking (collection-based — one document per waiting player) ──
// Each player writes their own doc: matchmaking/{playerId}
// findOpponent queries for another waiting player, then runs a transaction to match.

const STALE_MS = 60_000;

const _buildGameDoc = (now, resolvedGameMode) => ({
  status: 'waiting',
  currentTurn: 1,
  winner: null,
  createdAt: now,
  gameMode: resolvedGameMode,
  p1Ready: false,
  p2Ready: false,
  p1ShipGrid: null,
  p1Placements: null,
  p2ShipGrid: null,
  p2Placements: null,
  p1AttackGrid: flattenGrid(emptyGrid()),
  p2AttackGrid: flattenGrid(emptyGrid()),
  p1AbilityUsed: false,
  p2AbilityUsed: false,
  p1Commander: null,
  p2Commander: null,
  p1PushToken: null,
  p2PushToken: null,
  p1PlayerId: null,
  p2PlayerId: null,
  moves: [],
});

export const findOpponent = async (playerId, gameMode = 'classic') => {
  const now = Date.now();
  const cutoff = now - STALE_MS;
  const myRef = doc(db, 'matchmaking', playerId);

  // Register ourselves first so we're visible to others
  await setDoc(myRef, {
    playerId,
    gameMode,
    timestamp: now,
    status: 'waiting',
    roomCode: null,
  });

  // Query for another waiting player for the same game mode
  // Simplified query to avoid requiring deployed index
  const q = query(
    collection(db, 'matchmaking'),
    where('status', '==', 'waiting'),
    where('gameMode', '==', gameMode),
    limit(10)
  );

  const snap = await getDocs(q);
  // Filter out ourselves and stale entries client-side
  const candidates = snap.docs.filter(d =>
    d.id !== playerId &&
    d.data().timestamp > cutoff
  );

  if (candidates.length === 0) {
    return { action: 'waiting' };
  }

  // Try to atomically claim the first candidate
  const opponent = candidates[0];
  const oppRef = doc(db, 'matchmaking', opponent.id);

  try {
    const result = await runTransaction(db, async (transaction) => {
      const oppSnap = await transaction.get(oppRef);
      // Bail if opponent was already matched or doc disappeared
      if (!oppSnap.exists() || oppSnap.data().status !== 'waiting') {
        return null;
      }

      const roomCode = generateCode();
      const resolvedGameMode = oppSnap.data().gameMode || gameMode;
      const gameRef = doc(db, 'games', roomCode);

      transaction.set(gameRef, _buildGameDoc(now, resolvedGameMode));
      transaction.update(oppRef, { status: 'matched', roomCode });
      transaction.update(myRef,  { status: 'matched', roomCode });

      return { action: 'matched', roomCode, gameMode: resolvedGameMode };
    });

    if (result) return result;
  } catch {
    // Transaction aborted — opponent was claimed by someone else; stay waiting
  }

  return { action: 'waiting' };
};

export const cancelMatchmaking = async (playerId) => {
  try {
    await deleteDoc(doc(db, 'matchmaking', playerId));
  } catch {}
};

export const listenToMatchmaking = (playerId, callback) =>
  onSnapshot(doc(db, 'matchmaking', playerId), snap => {
    if (snap.exists()) callback(snap.data());
  });

export const listenToGame = (roomCode, callback) =>
  onSnapshot(doc(db, 'games', roomCode), snap => {
    if (snap.exists()) callback(snap.data());
  });

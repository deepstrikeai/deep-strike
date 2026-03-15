import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
  ScrollView, SafeAreaView, Alert, Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { GRID_SIZE, CELL_STATE, SHIPS, GAME_MODES } from '../constants/gameConstants';
import { autoPlaceShips, processShot, checkWin, getAIShot } from '../utils/gameLogic';
import { useAINarration } from '../hooks/useAINarration';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';
import { useSoundEffects } from '../hooks/useSoundEffects';
import { C, FONT, GLOW } from '../theme';
import { BATTLE_CELL_SIZE as CELL_SIZE, ms } from '../utils/responsive';

const CELL_BG = {
  [CELL_STATE.EMPTY]: 'rgba(255,255,255,0.03)',
  [CELL_STATE.SHIP]:  'rgba(255,255,255,0.03)',
  [CELL_STATE.HIT]:   C.CELL_HIT,
  [CELL_STATE.MISS]:  C.CELL_MISS,
  [CELL_STATE.SUNK]:  C.CELL_SUNK,
};
const CELL_ICONS = {
  [CELL_STATE.HIT]:  '💥',
  [CELL_STATE.MISS]: '·',
  [CELL_STATE.SUNK]: '☠',
};

const GridCell = React.memo(({ cell, onPress, isAttackGrid, highlighted }) => {
  const scaleAnim   = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim  = useRef(new Animated.Value(0)).current;
  const prevCell    = useRef(cell);

  useEffect(() => {
    if (prevCell.current === cell) return;
    prevCell.current = cell;
    if (cell === CELL_STATE.SUNK) {
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scaleAnim,  { toValue: 0.3, duration: 60,  useNativeDriver: true }),
          Animated.spring(scaleAnim,  { toValue: 1.4, tension: 380, friction: 3, useNativeDriver: true }),
          Animated.spring(scaleAnim,  { toValue: 1,   tension: 200, friction: 8, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(rotateAnim, { toValue: 1,  duration: 90,  useNativeDriver: true }),
          Animated.timing(rotateAnim, { toValue: -1, duration: 90,  useNativeDriver: true }),
          Animated.spring(rotateAnim, { toValue: 0,  tension: 200, friction: 8, useNativeDriver: true }),
        ]),
      ]).start();
    } else if (cell === CELL_STATE.HIT) {
      opacityAnim.setValue(0.2);
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scaleAnim,  { toValue: 1.8, duration: 55,  useNativeDriver: true }),
          Animated.spring(scaleAnim,  { toValue: 1,   tension: 220, friction: 5, useNativeDriver: true }),
        ]),
        Animated.timing(opacityAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]).start();
    } else if (cell === CELL_STATE.MISS) {
      scaleAnim.setValue(0.4);
      opacityAnim.setValue(0);
      Animated.parallel([
        Animated.spring(scaleAnim,  { toValue: 1, tension: 160, friction: 7, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
      ]).start();
    }
  }, [cell]);

  const isHit  = cell === CELL_STATE.HIT;
  const isSunk = cell === CELL_STATE.SUNK;
  const isMiss = cell === CELL_STATE.MISS;
  const rotate = rotateAnim.interpolate({ inputRange: [-1, 0, 1], outputRange: ['-18deg', '0deg', '18deg'] });

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }, { rotate }], opacity: opacityAnim }}>
      <TouchableOpacity
        style={[
          s.cell,
          { backgroundColor: CELL_BG[cell] || CELL_BG[CELL_STATE.EMPTY] },
          isHit  && { borderColor: C.RED_BORDER },
          isSunk && { borderColor: C.RED_BORDER },
          isMiss && { borderColor: 'rgba(30,80,120,0.6)' },
          highlighted && { borderColor: C.AMBER, backgroundColor: 'rgba(255,179,0,0.15)' },
        ]}
        onPress={onPress}
        activeOpacity={isAttackGrid ? 0.7 : 1}
        disabled={!isAttackGrid || !onPress}
      >
        {CELL_ICONS[cell] ? (
          <Text style={[
            s.cellIcon,
            isMiss && { color: 'rgba(100,160,200,0.6)', fontSize: 16 },
            isSunk && { color: '#FF8888' },
          ]}>{CELL_ICONS[cell]}</Text>
        ) : cell === CELL_STATE.SHIP && !isAttackGrid ? (
          <View style={s.shipDot} />
        ) : null}
      </TouchableOpacity>
    </Animated.View>
  );
});

export default function BattleScreen({ playerShipGrid, playerPlacements, commander, difficulty, gameMode = GAME_MODES.CLASSIC, gridTheme, voiceOnlyMode = false, onGameOver, onQuit }) {
  const aiInit = useRef(autoPlaceShips());
  const [aiShipGrid]       = useState(aiInit.current.shipGrid);
  const [aiPlacements,      setAIPlacements]    = useState(aiInit.current.placements);
  const [playerAttackGrid,  setPlayerAttackGrid] = useState(() => Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(CELL_STATE.EMPTY)));
  const [aiAttackGrid,      setAIAttackGrid]     = useState(() => Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(CELL_STATE.EMPTY)));
  const [playerDefenseGrid, setPlayerDefenseGrid]= useState(() => playerShipGrid.map(r => r.map(c => c ? CELL_STATE.SHIP : CELL_STATE.EMPTY)));
  const [playerPlacements2, setPlayerPlacements2]= useState(playerPlacements);
  const [isPlayerTurn,      setIsPlayerTurn]    = useState(true);
  const [gameOver,          setGameOver]        = useState(false);
  const [narrationText,     setNarrationText]   = useState(commander ? `${commander.emoji}  "${commander.taunt}"` : '');
  const [commanderText,     setCommanderText]   = useState('');
  const [showingAttack,     setShowingAttack]   = useState(true);
  const [shotCount,         setShotCount]       = useState({ player: 0, ai: 0 });
  const [hitCount,          setHitCount]        = useState({ player: 0, ai: 0 });
  // Refs so doAITurn always reads current totals (state updates are async/batched)
  const shotCountRef = useRef({ player: 0, ai: 0 });
  const hitCountRef  = useRef({ player: 0, ai: 0 });

  // Salvo mode
  const [salvoShotsFired,   setSalvoShotsFired] = useState(0);

  // Ability
  const [abilityUsed,       setAbilityUsed]     = useState(false);
  const [pendingAbility,    setPendingAbility]  = useState(false);
  const [sonarResult,       setSonarResult]     = useState(null); // null | 'found' | 'clear'
  const [radarResult,       setRadarResult]     = useState(null); // null | { found, row }
  const pendingAbilityRef = useRef(false);

  const narrationAnim  = useRef(new Animated.Value(0)).current;
  const narrationSlide = useRef(new Animated.Value(10)).current;
  const shakeAnim      = useRef(new Animated.Value(0)).current;
  const flashAnim      = useRef(new Animated.Value(0)).current;
  const bannerAnim     = useRef(new Animated.Value(0)).current;
  const [flashColor, setFlashColor] = useState('rgba(0,0,0,0)');
  const [bannerMsg,  setBannerMsg]  = useState('');
  const { getNarration }  = useAINarration(commander);
  const { play }          = useSoundEffects();

  const getSunkCount = pl => Object.values(pl).filter(p => p.sunk).length;
  const playerShotsAllowed = gameMode === GAME_MODES.SALVO
    ? Math.max(1, SHIPS.length - getSunkCount(playerPlacements2))
    : 1;

  const triggerFlash = useCallback((color) => {
    setFlashColor(color);
    flashAnim.setValue(1);
    Animated.timing(flashAnim, { toValue: 0, duration: 500, useNativeDriver: true }).start();
  }, [flashAnim]);

  const showBanner = useCallback((msg) => {
    setBannerMsg(msg);
    bannerAnim.setValue(0);
    Animated.sequence([
      Animated.spring(bannerAnim, { toValue: 1, tension: 200, friction: 7, useNativeDriver: true }),
      Animated.delay(750),
      Animated.timing(bannerAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start();
  }, [bannerAnim]);

  const animateNarration = useCallback((text, cmdText = '') => {
    narrationAnim.setValue(0);
    narrationSlide.setValue(10);
    setNarrationText(text);
    setCommanderText(cmdText);
    Animated.parallel([
      Animated.spring(narrationAnim,  { toValue: 1, useNativeDriver: true, tension: 120, friction: 8 }),
      Animated.spring(narrationSlide, { toValue: 0, useNativeDriver: true, tension: 140, friction: 9 }),
    ]).start();
  }, [narrationAnim, narrationSlide]);

  const shakeGrid = useCallback(() => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 9,  duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -9, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6,  duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,  duration: 55, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  // ── AI Turn (handles salvo) ──
  // Uses refs to always have latest state when called from setTimeout
  const aiAttackGridRef    = useRef(aiAttackGrid);
  const playerPl2Ref       = useRef(playerPlacements2);
  const aiPlacementsRef    = useRef(aiPlacements);
  const gameModeRef        = useRef(gameMode);
  useEffect(() => { aiAttackGridRef.current    = aiAttackGrid; },    [aiAttackGrid]);
  useEffect(() => { playerPl2Ref.current       = playerPlacements2; }, [playerPlacements2]);
  useEffect(() => { aiPlacementsRef.current    = aiPlacements; },    [aiPlacements]);
  useEffect(() => { gameModeRef.current        = gameMode; },        [gameMode]);

  const doAITurn = useCallback(async () => {
    const numShots = gameModeRef.current === GAME_MODES.SALVO
      ? Math.max(1, SHIPS.length - getSunkCount(aiPlacementsRef.current))
      : 1;
    let currentGrid = aiAttackGridRef.current;
    let currentPl   = playerPl2Ref.current;

    for (let i = 0; i < numShots; i++) {
      if (i > 0) await new Promise(r => setTimeout(r, 450));

      const [aiRow, aiCol] = getAIShot(difficulty, currentGrid);
      const { newDisplay, newPlacements, hit, sunk, shipId } =
        processShot(playerShipGrid, currentGrid, currentPl, aiRow, aiCol);
      currentGrid = newDisplay;
      currentPl   = newPlacements;

      setAIAttackGrid(newDisplay);
      setPlayerPlacements2(newPlacements);
      setPlayerDefenseGrid(prev => {
        const u = prev.map(r => [...r]);
        if (sunk) {
          for (let r = 0; r < GRID_SIZE; r++)
            for (let c = 0; c < GRID_SIZE; c++)
              if (playerShipGrid[r][c] === shipId) u[r][c] = CELL_STATE.SUNK;
        } else if (hit) { u[aiRow][aiCol] = CELL_STATE.HIT; }
        else { u[aiRow][aiCol] = CELL_STATE.MISS; }
        return u;
      });
      shotCountRef.current = { ...shotCountRef.current, ai: shotCountRef.current.ai + 1 };
      setShotCount({ ...shotCountRef.current });
      if (hit) {
        hitCountRef.current = { ...hitCountRef.current, ai: hitCountRef.current.ai + 1 };
        setHitCount({ ...hitCountRef.current });
      }

      if (sunk) {
        play('sunk'); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        triggerFlash('rgba(180,0,0,0.35)');
      } else if (hit) {
        play('hit'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        triggerFlash('rgba(180,0,0,0.22)');
      } else {
        play('miss');
      }
      if (hit) shakeGrid();

      const event = sunk ? 'playerSunk' : hit ? 'playerHit' : 'playerMiss';
      const { narration, reaction } = await getNarration(event, shipId);
      animateNarration(narration, reaction);

      if (checkWin(newPlacements)) {
        setGameOver(true);
        setTimeout(() => onGameOver({ winner: 'ai', shots: shotCountRef.current.ai, hits: hitCountRef.current.ai }), 1500);
        return;
      }
    }
    setIsPlayerTurn(true);
    setSalvoShotsFired(0);
  }, [difficulty, playerShipGrid, getNarration, animateNarration, shakeGrid, triggerFlash, play]);

  // Keep a stable ref to doAITurn to avoid stale closures in setTimeout
  const doAITurnRef = useRef(doAITurn);
  doAITurnRef.current = doAITurn;

  // ── Player shot (handles salvo) ──
  const playerAttackGridRef = useRef(playerAttackGrid);
  useEffect(() => { playerAttackGridRef.current = playerAttackGrid; }, [playerAttackGrid]);

  const handlePlayerShot = useCallback(async (row, col) => {
    if (!isPlayerTurn || gameOver) return;

    // If a targeted ability is pending, consume tap as ability target
    if (pendingAbilityRef.current && commander?.ability) {
      pendingAbilityRef.current = false;
      setPendingAbility(false);

      const abilityId = commander.ability.id;
      if (abilityId === 'broadside') {
        const cols = [...new Set([col - 1, col, col + 1].map(c => Math.max(0, Math.min(GRID_SIZE - 1, c))))];
        let grid = playerAttackGridRef.current;
        let placements = aiPlacementsRef.current;
        for (let i = 0; i < cols.length; i++) {
          const c = cols[i];
          if (i > 0) await new Promise(r => setTimeout(r, 220));
          if (grid[row][c] !== CELL_STATE.EMPTY) continue;
          const { newDisplay, newPlacements, hit, sunk, shipId } =
            processShot(aiShipGrid, grid, placements, row, c);
          grid = newDisplay; placements = newPlacements;
          setPlayerAttackGrid(newDisplay);
          setAIPlacements(newPlacements);
          if (sunk) { play('sunk'); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); triggerFlash('rgba(255,200,0,0.28)'); showBanner('☠  SUNK!'); }
          else if (hit) { play('hit'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); triggerFlash('rgba(255,60,60,0.22)'); }
          else { play('miss'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); triggerFlash('rgba(30,100,220,0.18)'); }
          if (hit) shakeGrid();
          if (checkWin(newPlacements)) {
            setGameOver(true); setAbilityUsed(true);
            setTimeout(() => onGameOver({ winner: 'player', shots: shotCount.player + i + 1, hits: hitCount.player }), 1500);
            return;
          }
        }
        setAbilityUsed(true);
        setIsPlayerTurn(false); setSalvoShotsFired(0);
        setTimeout(() => doAITurnRef.current(), 1300);
      } else if (abilityId === 'sonar_sweep') {
        // No shot, no turn flip — just check 3x3 area in AI ship grid
        let found = false;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const r = row + dr, c = col + dc;
            if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE && aiShipGrid[r][c]) {
              found = true; break;
            }
          }
          if (found) break;
        }
        setSonarResult(found ? 'found' : 'clear');
        setAbilityUsed(true);
        // Turn does NOT change
      } else if (abilityId === 'radar_ping') {
        // Scan entire row for any ship — no shot, no turn used
        let found = false;
        for (let c = 0; c < GRID_SIZE; c++) {
          if (aiShipGrid[row][c]) { found = true; break; }
        }
        setRadarResult({ found, row });
        setAbilityUsed(true);
      } else if (abilityId === 'full_broadside') {
        // Fire at cols 0,2,4,6,8 of chosen row — costs turn
        const bsCols = [0, 2, 4, 6, 8];
        let grid = playerAttackGridRef.current;
        let placements = aiPlacementsRef.current;
        for (let i = 0; i < bsCols.length; i++) {
          const c = bsCols[i];
          if (i > 0) await new Promise(res => setTimeout(res, 220));
          if (grid[row][c] !== CELL_STATE.EMPTY) continue;
          const { newDisplay, newPlacements, hit, sunk } = processShot(aiShipGrid, grid, placements, row, c);
          grid = newDisplay; placements = newPlacements;
          setPlayerAttackGrid(newDisplay);
          setAIPlacements(newPlacements);
          if (sunk) { play('sunk'); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); triggerFlash('rgba(255,200,0,0.28)'); showBanner('☠  SUNK!'); }
          else if (hit) { play('hit'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); triggerFlash('rgba(255,60,60,0.22)'); }
          else { play('miss'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); triggerFlash('rgba(30,100,220,0.18)'); }
          if (hit) shakeGrid();
          if (checkWin(newPlacements)) {
            setGameOver(true); setAbilityUsed(true);
            setTimeout(() => onGameOver({ winner: 'player', shots: shotCount.player + i + 1, hits: hitCount.player }), 1500);
            return;
          }
        }
        setAbilityUsed(true);
        setIsPlayerTurn(false); setSalvoShotsFired(0);
        setTimeout(() => doAITurnRef.current(), 1300);
      } else if (abilityId === 'depth_charge') {
        // Fire at target + 4 orthogonal neighbors clamped to grid — costs turn
        const dcTargets = [
          [row, col],
          [row - 1, col], [row + 1, col],
          [row, col - 1], [row, col + 1],
        ].filter(([r, c]) => r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE);
        let grid = playerAttackGridRef.current;
        let placements = aiPlacementsRef.current;
        for (let i = 0; i < dcTargets.length; i++) {
          const [tr, tc] = dcTargets[i];
          if (i > 0) await new Promise(res => setTimeout(res, 220));
          if (grid[tr][tc] !== CELL_STATE.EMPTY) continue;
          const { newDisplay, newPlacements, hit, sunk } = processShot(aiShipGrid, grid, placements, tr, tc);
          grid = newDisplay; placements = newPlacements;
          setPlayerAttackGrid(newDisplay);
          setAIPlacements(newPlacements);
          if (sunk) { play('sunk'); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); triggerFlash('rgba(255,200,0,0.28)'); showBanner('☠  SUNK!'); }
          else if (hit) { play('hit'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); triggerFlash('rgba(255,60,60,0.22)'); }
          else { play('miss'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); triggerFlash('rgba(30,100,220,0.18)'); }
          if (hit) shakeGrid();
          if (checkWin(newPlacements)) {
            setGameOver(true); setAbilityUsed(true);
            setTimeout(() => onGameOver({ winner: 'player', shots: shotCount.player + i + 1, hits: hitCount.player }), 1500);
            return;
          }
        }
        setAbilityUsed(true);
        setIsPlayerTurn(false); setSalvoShotsFired(0);
        setTimeout(() => doAITurnRef.current(), 1300);
      }
      return;
    }

    if (playerAttackGridRef.current[row][col] !== CELL_STATE.EMPTY) return;

    const { newDisplay, newPlacements, hit, sunk, shipId } =
      processShot(aiShipGrid, playerAttackGridRef.current, aiPlacementsRef.current, row, col);
    setPlayerAttackGrid(newDisplay);
    setAIPlacements(newPlacements);
    setShotCount(sc => ({ ...sc, player: sc.player + 1 }));
    if (hit) setHitCount(hc => ({ ...hc, player: hc.player + 1 }));

    if (sunk) {
      play('sunk'); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      triggerFlash('rgba(255,200,0,0.28)'); showBanner('☠  SUNK!');
    } else if (hit) {
      play('hit'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      triggerFlash('rgba(255,60,60,0.22)');
    } else {
      play('miss'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      triggerFlash('rgba(30,100,220,0.18)');
    }
    if (hit) shakeGrid();

    const event = sunk ? 'sunk' : hit ? 'hit' : 'miss';
    const { narration, reaction } = await getNarration(event, shipId);
    animateNarration(narration, reaction);

    if (checkWin(newPlacements)) {
      setGameOver(true);
      const { narration: winNarration, reaction: winReaction } = await getNarration('lose', null);
      animateNarration(winNarration, winReaction);
      setTimeout(() => onGameOver({ winner: 'player', shots: shotCount.player + 1, hits: hitCount.player + (hit ? 1 : 0) }), 1500);
      return;
    }

    const nextFired = salvoShotsFired + 1;
    if (gameMode === GAME_MODES.SALVO && nextFired < playerShotsAllowed) {
      setSalvoShotsFired(nextFired);
      // Stay on player's turn — more salvo shots remaining
    } else {
      setSalvoShotsFired(0);
      setIsPlayerTurn(false);
      setTimeout(() => doAITurnRef.current(), 1300);
    }
  }, [isPlayerTurn, gameOver, aiShipGrid, getNarration, animateNarration, shakeGrid, triggerFlash, showBanner, play, gameMode, salvoShotsFired, playerShotsAllowed, commander, shotCount, hitCount]);

  // ── Ability button ──
  const handleAbilityPress = useCallback(() => {
    if (abilityUsed || !isPlayerTurn || gameOver) return;
    const ability = commander?.ability;
    if (!ability) return;

    if (ability.id === 'chaos_torpedo') {
      // Fire immediately at 3 random unrevealed cells
      const grid = playerAttackGridRef.current;
      const empty = [];
      for (let r = 0; r < GRID_SIZE; r++)
        for (let c = 0; c < GRID_SIZE; c++)
          if (grid[r][c] === CELL_STATE.EMPTY) empty.push([r, c]);
      for (let i = empty.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [empty[i], empty[j]] = [empty[j], empty[i]];
      }
      const targets = empty.slice(0, 3);

      (async () => {
        let currentGrid = grid;
        let currentPl = aiPlacementsRef.current;
        for (let i = 0; i < targets.length; i++) {
          if (i > 0) await new Promise(r => setTimeout(r, 300));
          const [row, col] = targets[i];
          const { newDisplay, newPlacements, hit, sunk, shipId } =
            processShot(aiShipGrid, currentGrid, currentPl, row, col);
          currentGrid = newDisplay; currentPl = newPlacements;
          setPlayerAttackGrid(newDisplay);
          setAIPlacements(newPlacements);
          if (sunk) { play('sunk'); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); triggerFlash('rgba(255,200,0,0.28)'); showBanner('☠  SUNK!'); }
          else if (hit) { play('hit'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); triggerFlash('rgba(255,60,60,0.22)'); }
          else { play('miss'); }
          if (checkWin(newPlacements)) {
            setGameOver(true); setAbilityUsed(true);
            setTimeout(() => onGameOver({ winner: 'player', shots: shotCount.player + i + 1, hits: hitCount.player }), 1500);
            return;
          }
        }
        setAbilityUsed(true);
        setIsPlayerTurn(false); setSalvoShotsFired(0);
        setTimeout(() => doAITurnRef.current(), 1300);
      })();
    } else {
      // broadside and sonar_sweep need a target tap
      pendingAbilityRef.current = true;
      setPendingAbility(true);
    }
  }, [abilityUsed, isPlayerTurn, gameOver, commander, aiShipGrid, play, triggerFlash, showBanner, shotCount, hitCount]);

  const handleQuit = useCallback(() => {
    Alert.alert(
      'Quit Game?',
      'Return to the main menu? Your progress will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Quit to Menu', style: 'destructive', onPress: onQuit },
      ]
    );
  }, [onQuit]);

  const onVoiceCoord = useCallback(([row, col]) => handlePlayerShot(row, col), [handlePlayerShot]);

  const onVoiceCommand = useCallback((cmd) => {
    switch (cmd.type) {
      case 'coord':
        handlePlayerShot(cmd.coord[0], cmd.coord[1]);
        break;
      case 'multi_coord':
        // Salvo: fire each coord in sequence (one per tick so state updates don't race)
        cmd.coords.forEach((c, i) => {
          setTimeout(() => handlePlayerShot(c[0], c[1]), i * 400);
        });
        break;
      case 'ability':
        handleAbilityPress();
        break;
      case 'switch_grid':
        setShowingAttack(prev => !prev);
        break;
      case 'emote': {
        if (!commander) break;
        let reactions;
        if (cmd.emote === 'cheer')       reactions = commander.winReaction ? [commander.winReaction] : commander.hitReactions;
        else if (cmd.emote === 'groan')  reactions = commander.sunkReactions || commander.missReactions;
        else                             reactions = commander.missReactions || commander.hitReactions;
        if (reactions) {
          const r = reactions[Math.floor(Math.random() * reactions.length)];
          animateNarration(`${commander.emoji}  "${r}"`, null);
        }
        break;
      }
    }
  }, [handlePlayerShot, handleAbilityPress, setShowingAttack, commander, animateNarration]);

  const { isListening, error: voiceError, startListening } = useVoiceRecognition(onVoiceCoord, onVoiceCommand);

  const renderGrid = (grid, isAttackGrid, onPress) => (
    <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
      <View style={s.colLabels}>
        <View style={{ width: CELL_SIZE + 2 }} />
        {[...Array(GRID_SIZE)].map((_, i) => (
          <Text key={i} style={s.axisLabel}>{i + 1}</Text>
        ))}
      </View>
      {grid.map((row, rIdx) => (
        <View key={rIdx} style={s.gridRow}>
          <Text style={s.axisLabel}>{'ABCDEFGHIJ'[rIdx]}</Text>
          {row.map((cell, cIdx) => (
            <GridCell
              key={cIdx}
              cell={cell}
              onPress={isAttackGrid && onPress && !gameOver ? () => onPress(rIdx, cIdx) : null}
              isAttackGrid={isAttackGrid}
            />
          ))}
        </View>
      ))}
    </Animated.View>
  );

  const shotsLeft = playerShotsAllowed - salvoShotsFired;

  return (
    <SafeAreaView style={s.root}>
      <LinearGradient colors={gridTheme?.bg ?? ['#06080E', '#09111D', '#06080E']} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* HUD bar */}
        <View style={s.hud}>
          <View style={s.hudFleet}>
            <Text style={s.hudLabel}>YOUR FLEET</Text>
            <Text style={s.hudCount}>{SHIPS.length - getSunkCount(playerPlacements2)}<Text style={s.hudTotal}>/{SHIPS.length}</Text></Text>
          </View>
          <View style={{ alignItems: 'center', gap: 4 }}>
            <View style={[s.turnBadge, !isPlayerTurn && s.turnBadgeEnemy]}>
              {isPlayerTurn
                ? <><View style={s.turnDot} /><Text style={s.turnText}>YOUR TURN</Text></>
                : <><Text style={s.turnText}>{commander?.emoji}</Text><Text style={s.turnText}> FIRING</Text></>
              }
            </View>
            {gameMode === GAME_MODES.SALVO && isPlayerTurn && (
              <View style={s.shotsBadge}>
                <Text style={s.shotsBadgeText}>SHOTS: {shotsLeft}</Text>
              </View>
            )}
          </View>
          <View style={s.hudFleet}>
            <Text style={[s.hudLabel, { textAlign: 'right' }]}>ENEMY FLEET</Text>
            <Text style={[s.hudCount, { textAlign: 'right' }]}>{SHIPS.length - getSunkCount(aiPlacements)}<Text style={s.hudTotal}>/{SHIPS.length}</Text></Text>
          </View>
        </View>

        {/* Intel report */}
        <Animated.View style={[s.intel, { opacity: narrationAnim, transform: [{ scale: narrationAnim.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1] }) }, { translateY: narrationSlide }] }]}>
          <View style={s.intelHeader}>
            <View style={s.intelDot} />
            <Text style={s.intelTitle}>INTEL REPORT</Text>
            <View style={{ flex: 1 }} />
            <Text style={[s.intelCmd, { opacity: commanderText ? 1 : 0 }]}>{commander?.emoji}</Text>
          </View>
          <Text style={s.intelText} numberOfLines={3}>{narrationText}</Text>
          <Text style={[s.intelReaction, { opacity: commanderText ? 1 : 0 }]}>"{commanderText}"</Text>
        </Animated.View>

        {/* Pending ability hint */}
        {pendingAbility && (
          <View style={s.abilityHint}>
            <Text style={s.abilityHintText}>
              {commander?.ability?.id === 'sonar_sweep'
                ? '📡  TAP A CELL TO SCAN 3×3 AREA'
                : commander?.ability?.id === 'radar_ping'
                ? '📻  TAP A CELL — SCANS ENTIRE ROW FOR SHIPS'
                : commander?.ability?.id === 'full_broadside'
                ? '🔱  TAP A CELL — FIRES COLS 0,2,4,6,8 IN THAT ROW'
                : commander?.ability?.id === 'depth_charge'
                ? '💣  TAP A CELL — DEPTH CHARGE FIRES IN CROSS PATTERN'
                : '💥  TAP A CELL — BROADSIDE FIRES AT ±1 COLUMN'}
            </Text>
            <TouchableOpacity onPress={() => { pendingAbilityRef.current = false; setPendingAbility(false); }} style={s.abilityHintCancel}>
              <Text style={s.abilityHintCancelText}>CANCEL</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Grid tabs */}
        <View style={s.tabs}>
          <TouchableOpacity style={[s.tab, showingAttack && s.tabActive]} onPress={() => setShowingAttack(true)} activeOpacity={0.8}>
            <Text style={[s.tabText, showingAttack && s.tabTextActive]}>⚔  ATTACK</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.tab, !showingAttack && s.tabActive]} onPress={() => setShowingAttack(false)} activeOpacity={0.8}>
            <Text style={[s.tabText, !showingAttack && s.tabTextActive]}>🛡  DEFENSE</Text>
          </TouchableOpacity>
        </View>

        {/* Grid */}
        <View style={s.gridContainer}>
          <Text style={s.gridLabel}>
            {pendingAbility
              ? 'SELECT ABILITY TARGET'
              : showingAttack
                ? (voiceOnlyMode && isPlayerTurn ? '🎙 VOICE ONLY — SAY A COORDINATE' : isPlayerTurn ? 'SELECT TARGET — TAP TO FIRE' : 'ENEMY IS TARGETING...')
                : 'YOUR SHIPS · DEFEND THEM'}
          </Text>
          {showingAttack
            ? renderGrid(playerAttackGrid, true, isPlayerTurn && !voiceOnlyMode ? handlePlayerShot : null)
            : renderGrid(playerDefenseGrid, false, null)}
        </View>

        {/* Ability button */}
        {commander?.ability && (
          <TouchableOpacity
            style={[
              s.abilityBtn,
              (abilityUsed || !isPlayerTurn || gameOver) && s.abilityBtnDisabled,
              pendingAbility && s.abilityBtnPending,
            ]}
            onPress={handleAbilityPress}
            disabled={abilityUsed || !isPlayerTurn || gameOver}
            activeOpacity={0.8}
          >
            <Text style={s.abilityBtnIcon}>{commander.ability.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[s.abilityBtnName, (abilityUsed || !isPlayerTurn || gameOver) && { color: C.TEXT_MUTED }]}>
                {commander.ability.name}
              </Text>
              <Text style={s.abilityBtnDesc}>{abilityUsed ? 'ABILITY USED' : commander.ability.description}</Text>
            </View>
            {abilityUsed && <Text style={s.abilityUsedTag}>USED</Text>}
          </TouchableOpacity>
        )}

        {/* Voice */}
        <View style={s.voiceRow}>
          <TouchableOpacity
            style={[s.voiceBtn, isListening && s.voiceBtnActive, (!isPlayerTurn || gameOver) && { opacity: 0.35 }]}
            onPress={startListening}
            disabled={!isPlayerTurn || gameOver || isListening}
            activeOpacity={0.8}
          >
            <Text style={s.voiceIcon}>{isListening ? '🔴' : '🎙'}</Text>
            <Text style={s.voiceBtnText}>{isListening ? 'LISTENING...' : 'VOICE FIRE'}</Text>
          </TouchableOpacity>
          {voiceError && <Text style={s.voiceError}>{voiceError}</Text>}
        </View>

        {/* Stats */}
        <View style={s.statsRow}>
          {[
            { n: shotCount.player, l: 'SHOTS' },
            { n: hitCount.player,  l: 'HITS'  },
            { n: getSunkCount(aiPlacements), l: 'SUNK' },
          ].map(stat => (
            <View key={stat.l} style={s.statCard}>
              <Text style={s.statNum}>{stat.n}</Text>
              <Text style={s.statLabel}>{stat.l}</Text>
            </View>
          ))}
        </View>

        {/* Quit */}
        <TouchableOpacity onPress={handleQuit} style={s.quitRow} activeOpacity={0.7} disabled={gameOver}>
          <Text style={s.quitText}>✕  QUIT TO MENU</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Full-screen event flash */}
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: flashColor, opacity: flashAnim }]}
      />

      {/* Center sunk banner */}
      <Animated.View
        pointerEvents="none"
        style={[s.banner, {
          opacity: bannerAnim,
          transform: [{ scale: bannerAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }],
        }]}
      >
        <Text style={s.bannerText}>{bannerMsg}</Text>
      </Animated.View>

      {/* Sonar / Radar result modal */}
      <Modal transparent visible={!!sonarResult || !!radarResult} animationType="fade" onRequestClose={() => { setSonarResult(null); setRadarResult(null); }}>
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            {sonarResult ? (
              <>
                <Text style={s.modalIcon}>{sonarResult === 'found' ? '⚡' : '✓'}</Text>
                <Text style={s.modalTitle}>{sonarResult === 'found' ? 'SHIPS DETECTED' : 'ALL CLEAR'}</Text>
                <Text style={s.modalSub}>{sonarResult === 'found' ? 'Enemy vessels present in scanned area!' : 'No ships in the scanned 3×3 zone.'}</Text>
              </>
            ) : radarResult ? (
              <>
                <Text style={s.modalIcon}>{radarResult.found ? '📻' : '✓'}</Text>
                <Text style={s.modalTitle}>{radarResult.found ? `SHIPS IN ROW ${'ABCDEFGHIJ'[radarResult.row]}` : `ROW ${'ABCDEFGHIJ'[radarResult.row]} CLEAR`}</Text>
                <Text style={s.modalSub}>{radarResult.found ? 'Enemy vessels detected in that row!' : 'No ships in the scanned row.'}</Text>
              </>
            ) : null}
            <TouchableOpacity style={s.modalBtn} onPress={() => { setSonarResult(null); setRadarResult(null); }} activeOpacity={0.8}>
              <Text style={s.modalBtnText}>ACKNOWLEDGED</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: C.BG },
  scroll:       { padding: 12, paddingBottom: 40 },

  hud:          { flexDirection: 'row', alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: C.BORDER, backgroundColor: C.BG_CARD, padding: 10 },
  hudFleet:     { flex: 1 },
  hudLabel:     { fontFamily: FONT.MONO, fontSize: ms(8), color: C.TEXT_MUTED, letterSpacing: 1.5, marginBottom: 2 },
  hudCount:     { fontSize: ms(22), fontWeight: '900', color: C.TEXT },
  hudTotal:     { fontSize: ms(13), color: C.TEXT_MUTED },
  turnBadge:    { backgroundColor: C.CYAN_DIM, borderWidth: 1, borderColor: C.CYAN, paddingHorizontal: ms(12), paddingVertical: ms(6), flexDirection: 'row', alignItems: 'center', gap: 5 },
  turnBadgeEnemy:{ backgroundColor: C.RED_DIM, borderColor: C.RED_BORDER },
  turnDot:      { width: 6, height: 6, backgroundColor: C.CYAN, borderRadius: 3 },
  turnText:     { fontFamily: FONT.MONO, fontSize: ms(10), color: C.TEXT, letterSpacing: 1 },
  shotsBadge:   { backgroundColor: 'rgba(255,179,0,0.14)', borderWidth: 1, borderColor: C.AMBER_BORDER, paddingHorizontal: ms(10), paddingVertical: 3 },
  shotsBadgeText:{ fontFamily: FONT.MONO, fontSize: ms(9), color: C.AMBER, letterSpacing: 1.5 },
  quitRow:      { padding: ms(16), alignItems: 'center', marginTop: 4 },
  quitText:     { fontFamily: FONT.MONO, fontSize: ms(11), color: C.TEXT_MUTED, letterSpacing: 2 },

  intel:        { borderWidth: 1, borderColor: C.BORDER, backgroundColor: C.BG_CARD, marginBottom: 12, minHeight: ms(94) },
  intelHeader:  { flexDirection: 'row', alignItems: 'center', gap: 7, padding: 8, borderBottomWidth: 1, borderBottomColor: C.BORDER },
  intelDot:     { width: 5, height: 5, backgroundColor: C.CYAN },
  intelTitle:   { fontFamily: FONT.MONO, fontSize: ms(8), color: C.CYAN, letterSpacing: 2 },
  intelCmd:     { fontSize: ms(14) },
  intelText:    { fontSize: ms(13), color: C.TEXT, padding: 12, paddingBottom: 6, fontWeight: '500', lineHeight: ms(19) },
  intelReaction:{ fontFamily: FONT.MONO, fontSize: ms(11), color: C.CYAN, paddingHorizontal: 12, paddingBottom: 10, fontStyle: 'italic' },

  abilityHint:  { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,179,0,0.1)', borderWidth: 1, borderColor: C.AMBER_BORDER, padding: 10, marginBottom: 10, gap: 8 },
  abilityHintText:{ fontFamily: FONT.MONO, fontSize: ms(9), color: C.AMBER, letterSpacing: 1, flex: 1 },
  abilityHintCancel:{ padding: 4 },
  abilityHintCancelText:{ fontFamily: FONT.MONO, fontSize: ms(9), color: C.TEXT_MUTED, letterSpacing: 1 },

  tabs:         { flexDirection: 'row', gap: 6, marginBottom: 10 },
  tab:          { flex: 1, backgroundColor: C.BG_CARD, borderWidth: 1, borderColor: C.BORDER, padding: ms(10), alignItems: 'center' },
  tabActive:    { borderColor: C.CYAN, backgroundColor: C.CYAN_DIM },
  tabText:      { fontFamily: FONT.MONO, fontSize: ms(10), color: C.TEXT_MUTED, letterSpacing: 1.5 },
  tabTextActive:{ color: C.CYAN },

  gridContainer:{ alignItems: 'center', marginBottom: 14 },
  gridLabel:    { fontFamily: FONT.MONO, fontSize: ms(8), color: C.TEXT_MUTED, letterSpacing: 1.5, marginBottom: 8, textAlign: 'center' },
  colLabels:    { flexDirection: 'row', marginBottom: 2 },
  gridRow:      { flexDirection: 'row', alignItems: 'center', marginBottom: 1 },
  axisLabel:    { width: CELL_SIZE + 2, fontFamily: FONT.MONO, fontSize: ms(8), color: C.TEXT_MUTED, textAlign: 'center' },
  cell:         { width: CELL_SIZE, height: CELL_SIZE, marginHorizontal: 1, borderWidth: 1, borderColor: C.BORDER, alignItems: 'center', justifyContent: 'center' },
  cellIcon:     { fontSize: ms(13) },
  shipDot:      { width: ms(8), height: ms(8), backgroundColor: 'rgba(0,229,255,0.3)' },

  abilityBtn:   { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: C.AMBER_BORDER, backgroundColor: 'rgba(255,179,0,0.08)', padding: ms(14), marginBottom: 14 },
  abilityBtnDisabled:{ opacity: 0.4 },
  abilityBtnPending:{ borderColor: C.AMBER, backgroundColor: 'rgba(255,179,0,0.18)' },
  abilityBtnIcon:{ fontSize: ms(22) },
  abilityBtnName:{ fontFamily: FONT.MONO, fontSize: ms(11), fontWeight: '900', color: C.AMBER, letterSpacing: 2 },
  abilityBtnDesc:{ fontFamily: FONT.MONO, fontSize: ms(9), color: C.TEXT_MUTED, marginTop: 2 },
  abilityUsedTag:{ fontFamily: FONT.MONO, fontSize: ms(9), color: C.TEXT_MUTED, letterSpacing: 1 },

  voiceRow:     { alignItems: 'center', marginBottom: 12 },
  voiceBtn:     { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: C.CYAN, paddingVertical: ms(11), paddingHorizontal: ms(26), backgroundColor: C.CYAN_DIM },
  voiceBtnActive:{ borderColor: C.RED, backgroundColor: C.RED_DIM },
  voiceIcon:    { fontSize: ms(18) },
  voiceBtnText: { fontFamily: FONT.MONO, fontSize: ms(12), color: C.CYAN, letterSpacing: 2 },
  voiceError:   { fontFamily: FONT.MONO, fontSize: ms(10), color: C.RED, marginTop: 6, textAlign: 'center', paddingHorizontal: 20 },

  statsRow:     { flexDirection: 'row', gap: 8 },
  statCard:     { flex: 1, backgroundColor: C.BG_CARD, borderWidth: 1, borderColor: C.BORDER, padding: 12, alignItems: 'center' },
  statNum:      { fontFamily: FONT.MONO, fontSize: 26, fontWeight: '900', color: C.CYAN },
  statLabel:    { fontFamily: FONT.MONO, fontSize: 8, color: C.TEXT_MUTED, marginTop: 3, letterSpacing: 1.5 },

  banner:       { position: 'absolute', alignSelf: 'center', top: '38%', backgroundColor: 'rgba(6,8,14,0.92)', borderWidth: 1, borderColor: C.AMBER, paddingVertical: 14, paddingHorizontal: 32 },
  bannerText:   { fontFamily: FONT.MONO, fontSize: 20, fontWeight: '900', color: C.AMBER, letterSpacing: 5 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', alignItems: 'center', justifyContent: 'center', padding: 32 },
  modalBox:     { backgroundColor: C.BG_CARD, borderWidth: 1, borderColor: C.AMBER_BORDER, padding: 28, alignItems: 'center', gap: 10, width: '100%' },
  modalIcon:    { fontSize: 36 },
  modalTitle:   { fontFamily: FONT.MONO, fontSize: 16, fontWeight: '900', color: C.AMBER, letterSpacing: 4 },
  modalSub:     { fontFamily: FONT.MONO, fontSize: 10, color: C.TEXT_DIM, textAlign: 'center', letterSpacing: 1, lineHeight: 16 },
  modalBtn:     { marginTop: 8, borderWidth: 1, borderColor: C.AMBER_BORDER, paddingVertical: 12, paddingHorizontal: 28 },
  modalBtnText: { fontFamily: FONT.MONO, fontSize: 11, color: C.AMBER, letterSpacing: 3 },
});

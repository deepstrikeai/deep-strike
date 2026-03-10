import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
  ScrollView, SafeAreaView, ActivityIndicator, Alert, Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { GRID_SIZE, CELL_STATE, SHIPS, GAME_MODES, COMMANDERS } from '../constants/gameConstants';
import { listenToGame, fireShot, fireAbility, unflattenGrid } from '../services/gameService';
import { fetchPlayerElo, updateEloAfterGame } from '../services/eloService';
import { useSoundEffects } from '../hooks/useSoundEffects';
import { C, FONT, GLOW } from '../theme';

const CELL_SIZE = 30;

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

const GridCell = React.memo(({ cell, onPress, isAttackGrid }) => {
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
          Animated.timing(scaleAnim, { toValue: 0.3, duration: 60,  useNativeDriver: true }),
          Animated.spring(scaleAnim, { toValue: 1.4, tension: 380, friction: 3, useNativeDriver: true }),
          Animated.spring(scaleAnim, { toValue: 1,   tension: 200, friction: 8, useNativeDriver: true }),
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
          Animated.timing(scaleAnim, { toValue: 1.8, duration: 55,  useNativeDriver: true }),
          Animated.spring(scaleAnim, { toValue: 1,   tension: 220, friction: 5, useNativeDriver: true }),
        ]),
        Animated.timing(opacityAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]).start();
    } else if (cell === CELL_STATE.MISS) {
      scaleAnim.setValue(0.4);
      opacityAnim.setValue(0);
      Animated.parallel([
        Animated.spring(scaleAnim,   { toValue: 1, tension: 160, friction: 7, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
      ]).start();
    }
  }, [cell]);

  const isHit = cell === CELL_STATE.HIT, isSunk = cell === CELL_STATE.SUNK, isMiss = cell === CELL_STATE.MISS;
  const rotate = rotateAnim.interpolate({ inputRange: [-1, 0, 1], outputRange: ['-18deg', '0deg', '18deg'] });

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }, { rotate }], opacity: opacityAnim }}>
      <TouchableOpacity
        style={[
          s.cell,
          { backgroundColor: CELL_BG[cell] || CELL_BG[CELL_STATE.EMPTY] },
          (isHit || isSunk) && { borderColor: C.RED_BORDER },
          isMiss && { borderColor: 'rgba(30,80,120,0.6)' },
        ]}
        onPress={onPress}
        activeOpacity={isAttackGrid ? 0.7 : 1}
        disabled={!isAttackGrid || !onPress}
      >
        {CELL_ICONS[cell] ? (
          <Text style={[s.cellIcon, isMiss && { color: 'rgba(100,160,200,0.6)', fontSize: 16 }, isSunk && { color: '#FF8888' }]}>
            {CELL_ICONS[cell]}
          </Text>
        ) : cell === CELL_STATE.SHIP && !isAttackGrid ? <View style={s.shipDot} /> : null}
      </TouchableOpacity>
    </Animated.View>
  );
});

export default function MultiplayerBattleScreen({ roomCode, playerNum, commander, myPlayerId, onGameOver, onQuit }) {
  const [game,          setGame]         = useState(null);
  const [showingAttack, setShowingAttack]= useState(true);
  const [statusMsg,     setStatusMsg]    = useState('');
  const [myElo,         setMyElo]        = useState(null);
  const eloUpdatedRef   = useRef(false);
  const myPlayerIdRef   = useRef(myPlayerId);
  useEffect(() => { myPlayerIdRef.current = myPlayerId; }, [myPlayerId]);
  const [isFiring,      setIsFiring]     = useState(false);
  const [mySalvoFired,  setMySalvoFired] = useState(0);
  const [pendingAbility,setPendingAbility]= useState(false);
  const [sonarResult,   setSonarResult]  = useState(null);
  const [radarResult,   setRadarResult]  = useState(null);
  const pendingAbilityRef = useRef(false);
  const narrationAnim  = useRef(new Animated.Value(1)).current;
  const shakeAnim      = useRef(new Animated.Value(0)).current;
  const flashAnim      = useRef(new Animated.Value(0)).current;
  const bannerAnim     = useRef(new Animated.Value(0)).current;
  const [flashColor, setFlashColor] = useState('rgba(0,0,0,0)');
  const [bannerMsg,  setBannerMsg]  = useState('');
  const { play }       = useSoundEffects();
  const prevGameRef    = useRef(null);

  const triggerFlash = useCallback((color) => {
    setFlashColor(color);
    flashAnim.setValue(1);
    Animated.timing(flashAnim, { toValue: 0, duration: 500, useNativeDriver: true }).start();
  }, [flashAnim]);
  const triggerFlashRef = useRef(triggerFlash);
  triggerFlashRef.current = triggerFlash;

  const showBanner = useCallback((msg) => {
    setBannerMsg(msg);
    bannerAnim.setValue(0);
    Animated.sequence([
      Animated.spring(bannerAnim, { toValue: 1, tension: 200, friction: 7, useNativeDriver: true }),
      Animated.delay(750),
      Animated.timing(bannerAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start();
  }, [bannerAnim]);

  const opponentNum = playerNum === 1 ? 2 : 1;
  const isMyTurn    = game?.currentTurn === playerNum;
  const gameMode    = game?.gameMode || GAME_MODES.CLASSIC;

  const getSunk = pl => Object.values(pl).filter(p => p.sunk).length;

  // Resolve commander from game data (use prop if available, else from Firestore field)
  const myPlacements  = game ? (game[`p${playerNum}Placements`]  || {}) : {};
  const shotsAllowed  = gameMode === GAME_MODES.SALVO
    ? Math.max(1, SHIPS.length - getSunk(myPlacements))
    : 1;
  const abilityUsed   = game ? !!game[`p${playerNum}AbilityUsed`] : false;
  const commanderId   = game?.[`p${playerNum}Commander`] || commander?.id;
  const myCommander   = COMMANDERS.find(c => c.id === commanderId) || null;

  // Reset salvo counter when turn changes to me
  const prevTurnRef = useRef(null);
  useEffect(() => {
    if (game && game.currentTurn === playerNum && prevTurnRef.current !== playerNum) {
      setMySalvoFired(0);
    }
    prevTurnRef.current = game?.currentTurn;
  }, [game?.currentTurn, playerNum]);

  useEffect(() => {
    if (myPlayerId) fetchPlayerElo(myPlayerId).then(elo => setMyElo(elo));
  }, [myPlayerId]);

  useEffect(() => {
    const unsub = listenToGame(roomCode, rawData => {
      const data = {
        ...rawData,
        p1AttackGrid: rawData.p1AttackGrid ? unflattenGrid(rawData.p1AttackGrid) : null,
        p2AttackGrid: rawData.p2AttackGrid ? unflattenGrid(rawData.p2AttackGrid) : null,
        p1ShipGrid:   rawData.p1ShipGrid   ? unflattenGrid(rawData.p1ShipGrid)   : null,
        p2ShipGrid:   rawData.p2ShipGrid   ? unflattenGrid(rawData.p2ShipGrid)   : null,
      };
      const prev = prevGameRef.current;
      if (prev) {
        const oppKey = `p${opponentNum}AttackGrid`;
        if (prev[oppKey] && data[oppKey]) {
          for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
              if (prev[oppKey][r][c] !== data[oppKey][r][c]) {
                const ns = data[oppKey][r][c];
                if (ns === CELL_STATE.SUNK) {
                  play('sunk'); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                  triggerFlashRef.current('rgba(180,0,0,0.35)');
                } else if (ns === CELL_STATE.HIT) {
                  play('hit'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  triggerFlashRef.current('rgba(180,0,0,0.22)');
                } else if (ns === CELL_STATE.MISS) {
                  play('miss');
                }
              }
            }
          }
        }
      }
      prevGameRef.current = data;
      setGame(data);
      if (data.status === 'finished') {
        const currentMyId = myPlayerIdRef.current;
        if (!eloUpdatedRef.current && currentMyId) {
          eloUpdatedRef.current = true;
          const iWon = data.winner === playerNum;
          const oppPlayerId = data[`p${playerNum === 1 ? 2 : 1}PlayerId`];
          if (oppPlayerId) {
            updateEloAfterGame(currentMyId, oppPlayerId, iWon)
              .then(() => fetchPlayerElo(currentMyId).then(elo => setMyElo(elo)))
              .catch(() => {});
          }
        }
        setTimeout(() => onGameOver({ winner: data.winner, playerNum }), 800);
      }
    });
    return () => unsub();
  }, [roomCode, playerNum]);

  const shakeGrid = useCallback(() => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 9,  duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -9, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6,  duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,  duration: 55, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  const handleShot = useCallback(async (row, col) => {
    if (!isMyTurn || isFiring || game?.status !== 'battle') return;
    if (game[`p${playerNum}AttackGrid`][row][col] !== CELL_STATE.EMPTY) return;

    // Handle pending ability tap
    if (pendingAbilityRef.current && myCommander?.ability) {
      pendingAbilityRef.current = false;
      setPendingAbility(false);
      const abilityId = myCommander.ability.id;
      if (abilityId === 'sonar_sweep') {
        // Calculate result client-side from opponent ship grid
        const oppShipGrid = game[`p${opponentNum}ShipGrid`];
        let found = false;
        for (let dr = -1; dr <= 1 && !found; dr++)
          for (let dc = -1; dc <= 1 && !found; dc++) {
            const r = row + dr, c = col + dc;
            if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE && oppShipGrid?.[r]?.[c]) found = true;
          }
        setSonarResult(found ? 'found' : 'clear');
        // Mark ability used in Firestore (no shot, no turn change)
        fireAbility(roomCode, playerNum, 'sonar_sweep', row, col, game).catch(() => {});
      } else if (abilityId === 'radar_ping') {
        // Scan entire row client-side — no shot, no turn change
        const oppShipGrid = game[`p${opponentNum}ShipGrid`];
        let found = false;
        for (let c = 0; c < GRID_SIZE; c++) {
          if (oppShipGrid?.[row]?.[c]) { found = true; break; }
        }
        setRadarResult({ found, row });
        // Mark ability used in Firestore (no shot, no turn change)
        fireAbility(roomCode, playerNum, 'radar_ping', row, col, game).catch(() => {});
      } else {
        setIsFiring(true);
        try {
          const { results, winner } = await fireAbility(roomCode, playerNum, abilityId, row, col, game);
          results.forEach(r => {
            if (r.sunk) { play('sunk'); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); triggerFlash('rgba(255,200,0,0.28)'); showBanner('☠  SUNK!'); }
            else if (r.hit) { play('hit'); shakeGrid(); }
            else { play('miss'); }
          });
          if (winner) setStatusMsg('🏆  VICTORY!');
          else setStatusMsg(`${myCommander.ability.icon}  ABILITY FIRED`);
        } catch { setStatusMsg('CONNECTION ERROR — RETRY'); }
        setIsFiring(false);
        narrationAnim.setValue(0);
        Animated.spring(narrationAnim, { toValue: 1, useNativeDriver: true, tension: 120, friction: 8 }).start();
      }
      return;
    }

    setIsFiring(true);
    try {
      const nextFired = mySalvoFired + 1;
      const isLast = gameMode !== GAME_MODES.SALVO || nextFired >= shotsAllowed;
      const result = await fireShot(roomCode, playerNum, row, col, game, isLast);
      if (result.sunk) {
        play('sunk'); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setStatusMsg('☠  SUNK!'); shakeGrid();
        triggerFlash('rgba(255,200,0,0.28)'); showBanner('☠  SUNK!');
      } else if (result.hit) {
        play('hit'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        setStatusMsg('💥  DIRECT HIT!'); shakeGrid();
        triggerFlash('rgba(255,60,60,0.22)');
      } else {
        play('miss'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setStatusMsg('· · ·  MISS');
        triggerFlash('rgba(30,100,220,0.18)');
      }
      if (!isLast) setMySalvoFired(nextFired);
      narrationAnim.setValue(0);
      Animated.spring(narrationAnim, { toValue: 1, useNativeDriver: true, tension: 120, friction: 8 }).start();
    } catch { setStatusMsg('CONNECTION ERROR — RETRY'); }
    setIsFiring(false);
  }, [isMyTurn, isFiring, game, roomCode, playerNum, triggerFlash, showBanner, mySalvoFired, shotsAllowed, gameMode, myCommander]);

  const handleAbilityPress = useCallback(() => {
    if (abilityUsed || !isMyTurn || isFiring || game?.status !== 'battle') return;
    if (!myCommander?.ability) return;

    if (myCommander.ability.id === 'chaos_torpedo') {
      // Fire immediately
      setIsFiring(true);
      const myAttackGrid = game[`p${playerNum}AttackGrid`];
      const empty = [];
      for (let r = 0; r < GRID_SIZE; r++)
        for (let c = 0; c < GRID_SIZE; c++)
          if (myAttackGrid[r][c] === CELL_STATE.EMPTY) empty.push([r, c]);
      const target = empty.length > 0 ? empty[0] : [0, 0]; // chaos_torpedo uses server-side randomness
      fireAbility(roomCode, playerNum, 'chaos_torpedo', target[0], target[1], game)
        .then(({ results, winner }) => {
          results.forEach(r => {
            if (r.sunk) { play('sunk'); showBanner('☠  SUNK!'); triggerFlash('rgba(255,200,0,0.28)'); }
            else if (r.hit) { play('hit'); shakeGrid(); }
            else { play('miss'); }
          });
          setStatusMsg(`${myCommander.ability.icon}  CHAOS TORPEDO FIRED`);
          narrationAnim.setValue(0);
          Animated.spring(narrationAnim, { toValue: 1, useNativeDriver: true, tension: 120, friction: 8 }).start();
        })
        .catch(() => setStatusMsg('CONNECTION ERROR'))
        .finally(() => setIsFiring(false));
    } else {
      pendingAbilityRef.current = true;
      setPendingAbility(true);
    }
  }, [abilityUsed, isMyTurn, isFiring, game, myCommander, roomCode, playerNum, play, showBanner, triggerFlash, shakeGrid]);

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

  if (!game) {
    return (
      <SafeAreaView style={s.root}>
        <LinearGradient colors={['#06080E', '#09111D', '#06080E']} style={StyleSheet.absoluteFill} />
        <View style={s.loading}>
          <ActivityIndicator color={C.CYAN} size="large" />
          <Text style={s.loadingText}>CONNECTING...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const myAttackGrid  = game[`p${playerNum}AttackGrid`]  || [];
  const myShipGrid    = game[`p${playerNum}ShipGrid`]    || [];
  const oppAttackGrid = game[`p${opponentNum}AttackGrid`]|| [];
  const oppPlacements = game[`p${opponentNum}Placements`]|| {};

  const myDefenseGrid = myShipGrid.map((row, rIdx) =>
    row.map((cell, cIdx) => {
      const shot = oppAttackGrid[rIdx]?.[cIdx];
      if (shot && shot !== CELL_STATE.EMPTY) return shot;
      return cell ? CELL_STATE.SHIP : CELL_STATE.EMPTY;
    })
  );

  const shotsLeft = shotsAllowed - mySalvoFired;

  const renderGrid = (grid, isAttack, onPress) => (
    <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
      <View style={s.colLabels}>
        <View style={{ width: 18 }} />
        {[...Array(GRID_SIZE)].map((_, i) => <Text key={i} style={s.axisLabel}>{i + 1}</Text>)}
      </View>
      {grid.map((row, rIdx) => (
        <View key={rIdx} style={s.gridRow}>
          <Text style={s.axisLabel}>{'ABCDEFGHIJ'[rIdx]}</Text>
          {row.map((cell, cIdx) => (
            <GridCell key={cIdx} cell={cell} onPress={isAttack && onPress ? () => onPress(rIdx, cIdx) : null} isAttackGrid={isAttack} />
          ))}
        </View>
      ))}
    </Animated.View>
  );

  return (
    <SafeAreaView style={s.root}>
      <LinearGradient colors={['#06080E', '#09111D', '#06080E']} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* HUD */}
        <View style={s.hud}>
          <View style={s.hudFleet}>
            <Text style={s.hudLabel}>YOUR FLEET</Text>
            <Text style={s.hudCount}>{SHIPS.length - getSunk(myPlacements)}<Text style={s.hudTotal}>/{SHIPS.length}</Text></Text>
          </View>
          <View style={{ alignItems: 'center', gap: 4 }}>
            <View style={[s.turnBadge, !isMyTurn && s.turnBadgeOpp]}>
              {isFiring
                ? <><ActivityIndicator color={C.CYAN} size="small" /><Text style={s.turnText}> FIRING</Text></>
                : isMyTurn
                  ? <><View style={s.turnDot} /><Text style={s.turnText}>YOUR TURN</Text></>
                  : <Text style={s.turnText}>P{opponentNum} FIRING</Text>
              }
            </View>
            {gameMode === GAME_MODES.SALVO && isMyTurn && (
              <View style={s.shotsBadge}>
                <Text style={s.shotsBadgeText}>SHOTS: {shotsLeft}/{shotsAllowed}</Text>
              </View>
            )}
            {myElo != null && (
              <View style={s.eloBadge}>
                <Text style={s.eloBadgeText}>ELO: {myElo}</Text>
              </View>
            )}
          </View>
          <View style={s.hudFleet}>
            <Text style={[s.hudLabel, { textAlign: 'right' }]}>ENEMY FLEET</Text>
            <Text style={[s.hudCount, { textAlign: 'right' }]}>{SHIPS.length - getSunk(oppPlacements)}<Text style={s.hudTotal}>/{SHIPS.length}</Text></Text>
          </View>
        </View>

        {/* Intel */}
        <Animated.View style={[s.intel, { opacity: narrationAnim }]}>
          <View style={s.intelHeader}>
            <View style={s.intelDot} />
            <Text style={s.intelTitle}>BATTLE STATUS</Text>
            <Text style={s.roomTag}>#{roomCode}  ·  P{playerNum}</Text>
          </View>
          <Text style={s.intelText}>
            {statusMsg || (isMyTurn ? '🎯  SELECT TARGET AND FIRE' : `⏳  PLAYER ${opponentNum} IS TARGETING...`)}
          </Text>
        </Animated.View>

        {/* Pending ability hint */}
        {pendingAbility && (
          <View style={s.abilityHint}>
            <Text style={s.abilityHintText}>
              {myCommander?.ability?.id === 'sonar_sweep'
                ? '📡  TAP A CELL TO SCAN 3×3 AREA'
                : myCommander?.ability?.id === 'radar_ping'
                ? '📻  TAP A CELL — SCANS ENTIRE ROW FOR SHIPS'
                : myCommander?.ability?.id === 'full_broadside'
                ? '🔱  TAP A CELL — FIRES COLS 0,2,4,6,8 IN THAT ROW'
                : myCommander?.ability?.id === 'depth_charge'
                ? '💣  TAP A CELL — DEPTH CHARGE FIRES IN CROSS PATTERN'
                : '💥  TAP A CELL — BROADSIDE FIRES AT ±1 COLUMN'}
            </Text>
            <TouchableOpacity onPress={() => { pendingAbilityRef.current = false; setPendingAbility(false); }} style={s.abilityHintCancel}>
              <Text style={s.abilityHintCancelText}>CANCEL</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Tabs */}
        <View style={s.tabs}>
          <TouchableOpacity style={[s.tab, showingAttack && s.tabActive]} onPress={() => setShowingAttack(true)} activeOpacity={0.8}>
            <Text style={[s.tabText, showingAttack && s.tabTextActive]}>⚔  ATTACK</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.tab, !showingAttack && s.tabActive]} onPress={() => setShowingAttack(false)} activeOpacity={0.8}>
            <Text style={[s.tabText, !showingAttack && s.tabTextActive]}>🛡  DEFENSE</Text>
          </TouchableOpacity>
        </View>

        <View style={s.gridContainer}>
          <Text style={s.gridLabel}>
            {pendingAbility ? 'SELECT ABILITY TARGET'
              : showingAttack ? (isMyTurn ? 'TAP TO FIRE' : 'YOUR SHOTS SO FAR') : 'YOUR SHIPS'}
          </Text>
          {showingAttack
            ? renderGrid(myAttackGrid, true, isMyTurn && !isFiring ? handleShot : null)
            : renderGrid(myDefenseGrid, false, null)}
        </View>

        {/* Ability button */}
        {myCommander?.ability && (
          <TouchableOpacity
            style={[
              s.abilityBtn,
              (abilityUsed || !isMyTurn || isFiring || game?.status !== 'battle') && s.abilityBtnDisabled,
              pendingAbility && s.abilityBtnPending,
            ]}
            onPress={handleAbilityPress}
            disabled={abilityUsed || !isMyTurn || isFiring || game?.status !== 'battle'}
            activeOpacity={0.8}
          >
            <Text style={s.abilityBtnIcon}>{myCommander.ability.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[s.abilityBtnName, (abilityUsed || !isMyTurn) && { color: C.TEXT_MUTED }]}>
                {myCommander.ability.name}
              </Text>
              <Text style={s.abilityBtnDesc}>{abilityUsed ? 'ABILITY USED' : myCommander.ability.description}</Text>
            </View>
            {abilityUsed && <Text style={s.abilityUsedTag}>USED</Text>}
          </TouchableOpacity>
        )}

        <View style={s.statsRow}>
          <View style={s.statCard}>
            <Text style={s.statNum}>{getSunk(oppPlacements)}</Text>
            <Text style={s.statLabel}>YOU SUNK</Text>
          </View>
          <View style={s.statCard}>
            <Text style={[s.statNum, { color: C.RED }]}>{getSunk(myPlacements)}</Text>
            <Text style={s.statLabel}>THEY SUNK</Text>
          </View>
        </View>

        {/* Quit */}
        <TouchableOpacity onPress={handleQuit} style={s.quitRow} activeOpacity={0.7}>
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
  loading:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  loadingText:  { fontFamily: FONT.MONO, fontSize: 12, color: C.TEXT_DIM, letterSpacing: 3 },

  hud:          { flexDirection: 'row', alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: C.BORDER, backgroundColor: C.BG_CARD, padding: 10 },
  hudFleet:     { flex: 1 },
  hudLabel:     { fontFamily: FONT.MONO, fontSize: 8, color: C.TEXT_MUTED, letterSpacing: 1.5, marginBottom: 2 },
  hudCount:     { fontSize: 22, fontWeight: '900', color: C.TEXT },
  hudTotal:     { fontSize: 13, color: C.TEXT_MUTED },
  turnBadge:    { backgroundColor: C.CYAN_DIM, borderWidth: 1, borderColor: C.CYAN, paddingHorizontal: 10, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 5 },
  turnBadgeOpp: { backgroundColor: C.AMBER_DIM, borderColor: C.AMBER_BORDER },
  turnDot:      { width: 6, height: 6, backgroundColor: C.CYAN, borderRadius: 3 },
  turnText:     { fontFamily: FONT.MONO, fontSize: 9, color: C.TEXT, letterSpacing: 1 },
  shotsBadge:   { backgroundColor: 'rgba(255,179,0,0.14)', borderWidth: 1, borderColor: C.AMBER_BORDER, paddingHorizontal: 10, paddingVertical: 3 },
  shotsBadgeText:{ fontFamily: FONT.MONO, fontSize: 9, color: C.AMBER, letterSpacing: 1.5 },
  eloBadge:     { backgroundColor: 'rgba(0,229,255,0.08)', borderWidth: 1, borderColor: C.CYAN_BORDER, paddingHorizontal: 8, paddingVertical: 2 },
  eloBadgeText: { fontFamily: FONT.MONO, fontSize: 8, color: C.CYAN, letterSpacing: 1 },
  quitRow:      { padding: 16, alignItems: 'center', marginTop: 4 },
  quitText:     { fontFamily: FONT.MONO, fontSize: 11, color: C.TEXT_MUTED, letterSpacing: 2 },

  intel:        { borderWidth: 1, borderColor: C.BORDER, backgroundColor: C.BG_CARD, marginBottom: 12, minHeight: 72 },
  intelHeader:  { flexDirection: 'row', alignItems: 'center', gap: 7, padding: 8, borderBottomWidth: 1, borderBottomColor: C.BORDER },
  intelDot:     { width: 5, height: 5, backgroundColor: C.CYAN },
  intelTitle:   { fontFamily: FONT.MONO, fontSize: 8, color: C.CYAN, letterSpacing: 2 },
  roomTag:      { marginLeft: 'auto', fontFamily: FONT.MONO, fontSize: 8, color: C.TEXT_MUTED, letterSpacing: 1 },
  intelText:    { fontSize: 13, color: C.TEXT, padding: 12, fontWeight: '500' },

  abilityHint:  { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,179,0,0.1)', borderWidth: 1, borderColor: C.AMBER_BORDER, padding: 10, marginBottom: 10, gap: 8 },
  abilityHintText:{ fontFamily: FONT.MONO, fontSize: 9, color: C.AMBER, letterSpacing: 1, flex: 1 },
  abilityHintCancel:{ padding: 4 },
  abilityHintCancelText:{ fontFamily: FONT.MONO, fontSize: 9, color: C.TEXT_MUTED, letterSpacing: 1 },

  tabs:         { flexDirection: 'row', gap: 6, marginBottom: 10 },
  tab:          { flex: 1, backgroundColor: C.BG_CARD, borderWidth: 1, borderColor: C.BORDER, padding: 10, alignItems: 'center' },
  tabActive:    { borderColor: C.CYAN, backgroundColor: C.CYAN_DIM },
  tabText:      { fontFamily: FONT.MONO, fontSize: 10, color: C.TEXT_MUTED, letterSpacing: 1.5 },
  tabTextActive:{ color: C.CYAN },

  gridContainer:{ alignItems: 'center', marginBottom: 14 },
  gridLabel:    { fontFamily: FONT.MONO, fontSize: 8, color: C.TEXT_MUTED, letterSpacing: 1.5, marginBottom: 8, textAlign: 'center' },
  colLabels:    { flexDirection: 'row', marginBottom: 2 },
  gridRow:      { flexDirection: 'row', alignItems: 'center', marginBottom: 1 },
  axisLabel:    { width: 18, fontFamily: FONT.MONO, fontSize: 8, color: C.TEXT_MUTED, textAlign: 'center' },
  cell:         { width: CELL_SIZE, height: CELL_SIZE, marginHorizontal: 1, borderWidth: 1, borderColor: C.BORDER, alignItems: 'center', justifyContent: 'center' },
  cellIcon:     { fontSize: 13 },
  shipDot:      { width: 8, height: 8, backgroundColor: 'rgba(0,229,255,0.3)' },

  abilityBtn:   { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: C.AMBER_BORDER, backgroundColor: 'rgba(255,179,0,0.08)', padding: 14, marginBottom: 14 },
  abilityBtnDisabled:{ opacity: 0.4 },
  abilityBtnPending:{ borderColor: C.AMBER, backgroundColor: 'rgba(255,179,0,0.18)' },
  abilityBtnIcon:{ fontSize: 22 },
  abilityBtnName:{ fontFamily: FONT.MONO, fontSize: 11, fontWeight: '900', color: C.AMBER, letterSpacing: 2 },
  abilityBtnDesc:{ fontFamily: FONT.MONO, fontSize: 9, color: C.TEXT_MUTED, marginTop: 2 },
  abilityUsedTag:{ fontFamily: FONT.MONO, fontSize: 9, color: C.TEXT_MUTED, letterSpacing: 1 },

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

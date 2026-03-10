import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
  SafeAreaView, ScrollView, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { GRID_SIZE, CELL_STATE, SHIPS } from '../constants/gameConstants';
import { processShot, checkWin } from '../utils/gameLogic';
import { useSoundEffects } from '../hooks/useSoundEffects';
import { C, FONT } from '../theme';

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

const GridCell = React.memo(({ cell, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const prevCell  = useRef(cell);

  useEffect(() => {
    if (prevCell.current === cell) return;
    prevCell.current = cell;
    if (cell === CELL_STATE.HIT || cell === CELL_STATE.SUNK) {
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.6, duration: 55, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, tension: 220, friction: 5, useNativeDriver: true }),
      ]).start();
    }
  }, [cell]);

  const isSunk = cell === CELL_STATE.SUNK;
  const isMiss = cell === CELL_STATE.MISS;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[
          s.cell,
          { backgroundColor: CELL_BG[cell] || CELL_BG[CELL_STATE.EMPTY] },
          (cell === CELL_STATE.HIT || isSunk) && { borderColor: C.RED_BORDER },
          isMiss && { borderColor: 'rgba(30,80,120,0.6)' },
        ]}
        onPress={onPress}
        activeOpacity={0.7}
        disabled={!onPress}
      >
        {CELL_ICONS[cell] ? (
          <Text style={[
            s.cellIcon,
            isMiss && { color: 'rgba(100,160,200,0.6)', fontSize: 16 },
            isSunk && { color: '#FF8888' },
          ]}>{CELL_ICONS[cell]}</Text>
        ) : null}
      </TouchableOpacity>
    </Animated.View>
  );
});

export default function DailyScreen({ dailyFleet, onComplete, onQuit }) {
  const { shipGrid, placements: initialPlacements } = dailyFleet;

  const [attackGrid,  setAttackGrid]  = useState(() =>
    Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(CELL_STATE.EMPTY))
  );
  const [placements,  setPlacements]  = useState(initialPlacements);
  const [shotCount,   setShotCount]   = useState(0);
  const [gameOver,    setGameOver]    = useState(false);

  const attackGridRef  = useRef(attackGrid);
  const placementsRef  = useRef(placements);
  useEffect(() => { attackGridRef.current  = attackGrid; },  [attackGrid]);
  useEffect(() => { placementsRef.current  = placements; }, [placements]);

  const flashAnim  = useRef(new Animated.Value(0)).current;
  const bannerAnim = useRef(new Animated.Value(0)).current;
  const [flashColor, setFlashColor] = useState('rgba(0,0,0,0)');
  const [bannerMsg,  setBannerMsg]  = useState('');
  const { play } = useSoundEffects();

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
      Animated.delay(700),
      Animated.timing(bannerAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start();
  }, [bannerAnim]);

  const getSunkCount = pl => Object.values(pl).filter(p => p.sunk).length;

  const handleShot = useCallback((row, col) => {
    if (gameOver || attackGridRef.current[row][col] !== CELL_STATE.EMPTY) return;

    const { newDisplay, newPlacements, hit, sunk } = processShot(
      shipGrid, attackGridRef.current, placementsRef.current, row, col
    );
    setAttackGrid(newDisplay);
    setPlacements(newPlacements);
    const nextShots = shotCount + 1;
    setShotCount(nextShots);

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

    if (checkWin(newPlacements)) {
      setGameOver(true);
      setTimeout(() => onComplete(nextShots), 1200);
    }
  }, [gameOver, shipGrid, shotCount, triggerFlash, showBanner, play, onComplete]);

  const handleQuit = useCallback(() => {
    Alert.alert(
      'Quit Daily Challenge?',
      'Your progress will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Quit', style: 'destructive', onPress: onQuit },
      ]
    );
  }, [onQuit]);

  const sunkCount = getSunkCount(placements);

  return (
    <SafeAreaView style={s.root}>
      <LinearGradient colors={['#06080E', '#09111D', '#06080E']} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.header}>
          <View style={s.headerLine} />
          <Text style={s.headerText}>📅  DAILY CHALLENGE</Text>
          <View style={s.headerLine} />
        </View>

        {/* HUD */}
        <View style={s.hud}>
          <View style={s.hudStat}>
            <Text style={s.hudNum}>{shotCount}</Text>
            <Text style={s.hudLabel}>SHOTS</Text>
          </View>
          <View style={s.hudStat}>
            <Text style={s.hudNum}>{sunkCount}</Text>
            <Text style={s.hudLabel}>SUNK</Text>
          </View>
          <View style={s.hudStat}>
            <Text style={s.hudNum}>{SHIPS.length - sunkCount}</Text>
            <Text style={s.hudLabel}>REMAINING</Text>
          </View>
        </View>

        {/* Scoring legend */}
        <View style={s.legend}>
          <Text style={s.legendText}>⭐⭐⭐ ≤18  ·  ⭐⭐ ≤25  ·  ⭐ 26+</Text>
        </View>

        {/* Grid */}
        <View style={s.gridContainer}>
          <Text style={s.gridLabel}>
            {gameOver ? 'FLEET DESTROYED!' : 'TAP TO FIRE — FIND ALL 5 SHIPS'}
          </Text>
          <View style={s.colLabels}>
            <View style={{ width: 18 }} />
            {[...Array(GRID_SIZE)].map((_, i) => (
              <Text key={i} style={s.axisLabel}>{i + 1}</Text>
            ))}
          </View>
          {attackGrid.map((row, rIdx) => (
            <View key={rIdx} style={s.gridRow}>
              <Text style={s.axisLabel}>{'ABCDEFGHIJ'[rIdx]}</Text>
              {row.map((cell, cIdx) => (
                <GridCell
                  key={cIdx}
                  cell={cell}
                  onPress={!gameOver ? () => handleShot(rIdx, cIdx) : null}
                />
              ))}
            </View>
          ))}
        </View>

        <TouchableOpacity onPress={handleQuit} style={s.quitRow} activeOpacity={0.7} disabled={gameOver}>
          <Text style={s.quitText}>✕  QUIT CHALLENGE</Text>
        </TouchableOpacity>

      </ScrollView>

      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: flashColor, opacity: flashAnim }]}
      />
      <Animated.View
        pointerEvents="none"
        style={[s.banner, {
          opacity: bannerAnim,
          transform: [{ scale: bannerAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }],
        }]}
      >
        <Text style={s.bannerText}>{bannerMsg}</Text>
      </Animated.View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: C.BG },
  scroll:       { padding: 14, paddingBottom: 40 },

  header:       { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  headerLine:   { flex: 1, height: 1, backgroundColor: C.BORDER_MED },
  headerText:   { fontFamily: FONT.MONO, fontSize: 11, color: C.AMBER, letterSpacing: 3 },

  hud:          { flexDirection: 'row', gap: 10, marginBottom: 10 },
  hudStat:      { flex: 1, backgroundColor: C.BG_CARD, borderWidth: 1, borderColor: C.BORDER, padding: 12, alignItems: 'center' },
  hudNum:       { fontFamily: FONT.MONO, fontSize: 28, fontWeight: '900', color: C.CYAN },
  hudLabel:     { fontFamily: FONT.MONO, fontSize: 8, color: C.TEXT_MUTED, letterSpacing: 1.5, marginTop: 2 },

  legend:       { backgroundColor: 'rgba(255,179,0,0.06)', borderWidth: 1, borderColor: C.AMBER_BORDER, padding: 8, marginBottom: 14, alignItems: 'center' },
  legendText:   { fontFamily: FONT.MONO, fontSize: 9, color: C.AMBER, letterSpacing: 1.5 },

  gridContainer:{ alignItems: 'center', marginBottom: 14 },
  gridLabel:    { fontFamily: FONT.MONO, fontSize: 8, color: C.TEXT_MUTED, letterSpacing: 1.5, marginBottom: 8, textAlign: 'center' },
  colLabels:    { flexDirection: 'row', marginBottom: 2 },
  gridRow:      { flexDirection: 'row', alignItems: 'center', marginBottom: 1 },
  axisLabel:    { width: 18, fontFamily: FONT.MONO, fontSize: 8, color: C.TEXT_MUTED, textAlign: 'center' },
  cell:         { width: CELL_SIZE, height: CELL_SIZE, marginHorizontal: 1, borderWidth: 1, borderColor: C.BORDER, alignItems: 'center', justifyContent: 'center' },
  cellIcon:     { fontSize: 13 },

  quitRow:      { padding: 16, alignItems: 'center' },
  quitText:     { fontFamily: FONT.MONO, fontSize: 11, color: C.TEXT_MUTED, letterSpacing: 2 },

  banner:       { position: 'absolute', alignSelf: 'center', top: '38%', backgroundColor: 'rgba(6,8,14,0.92)', borderWidth: 1, borderColor: C.AMBER, paddingVertical: 14, paddingHorizontal: 32 },
  bannerText:   { fontFamily: FONT.MONO, fontSize: 20, fontWeight: '900', color: C.AMBER, letterSpacing: 5 },
});

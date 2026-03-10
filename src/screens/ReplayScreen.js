import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  ActivityIndicator, Share, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { unflattenGrid } from '../services/gameService';
import { GRID_SIZE, CELL_STATE } from '../constants/gameConstants';
import { C, FONT } from '../theme';

const CELL_SIZE = 28;
const CELL_BG = {
  [CELL_STATE.EMPTY]: 'rgba(255,255,255,0.03)',
  [CELL_STATE.HIT]:   C.CELL_HIT,
  [CELL_STATE.MISS]:  C.CELL_MISS,
  [CELL_STATE.SUNK]:  C.CELL_SUNK,
};
const CELL_ICONS = {
  [CELL_STATE.HIT]:  '💥',
  [CELL_STATE.MISS]: '·',
  [CELL_STATE.SUNK]: '☠',
};

const emptyGrid = () =>
  Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(CELL_STATE.EMPTY));

const applyMoveToGrid = (grid, shipGrid, move) => {
  const next = grid.map(r => [...r]);
  const { row, col, hit, sunk, shipId } = move;
  if (sunk && shipId && shipGrid) {
    for (let r = 0; r < GRID_SIZE; r++)
      for (let c = 0; c < GRID_SIZE; c++)
        if (shipGrid[r][c] === shipId) next[r][c] = CELL_STATE.SUNK;
  } else if (hit) {
    next[row][col] = CELL_STATE.HIT;
  } else {
    next[row][col] = CELL_STATE.MISS;
  }
  return next;
};

const MiniGrid = ({ grid, label }) => (
  <View style={mg.wrapper}>
    <Text style={mg.label}>{label}</Text>
    <View style={mg.colLabels}>
      <View style={{ width: 14 }} />
      {[...Array(GRID_SIZE)].map((_, i) => (
        <Text key={i} style={mg.axisLabel}>{i + 1}</Text>
      ))}
    </View>
    {grid.map((row, rIdx) => (
      <View key={rIdx} style={mg.row}>
        <Text style={mg.axisLabel}>{'ABCDEFGHIJ'[rIdx]}</Text>
        {row.map((cell, cIdx) => (
          <View
            key={cIdx}
            style={[mg.cell, { backgroundColor: CELL_BG[cell] || CELL_BG[CELL_STATE.EMPTY] }]}
          >
            {CELL_ICONS[cell] ? (
              <Text style={[mg.cellIcon, cell === CELL_STATE.MISS && { color: 'rgba(100,160,200,0.6)', fontSize: 10 }]}>
                {CELL_ICONS[cell]}
              </Text>
            ) : null}
          </View>
        ))}
      </View>
    ))}
  </View>
);

const mg = StyleSheet.create({
  wrapper:   { alignItems: 'center', marginBottom: 12 },
  label:     { fontFamily: FONT.MONO, fontSize: 8, color: C.TEXT_MUTED, letterSpacing: 2, marginBottom: 6 },
  colLabels: { flexDirection: 'row', marginBottom: 1 },
  row:       { flexDirection: 'row', alignItems: 'center', marginBottom: 1 },
  axisLabel: { width: 14, fontFamily: FONT.MONO, fontSize: 7, color: C.TEXT_MUTED, textAlign: 'center' },
  cell:      { width: CELL_SIZE, height: CELL_SIZE, marginHorizontal: 1, borderWidth: 1, borderColor: C.BORDER, alignItems: 'center', justifyContent: 'center' },
  cellIcon:  { fontSize: 10 },
});

export default function ReplayScreen({ roomCode, onBack }) {
  const [loading,  setLoading]  = useState(true);
  const [game,     setGame]     = useState(null);
  const [step,     setStep]     = useState(0);
  const [copied,   setCopied]   = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'games', roomCode));
        if (snap.exists()) {
          const raw = snap.data();
          setGame({
            ...raw,
            p1ShipGrid: raw.p1ShipGrid ? unflattenGrid(raw.p1ShipGrid) : null,
            p2ShipGrid: raw.p2ShipGrid ? unflattenGrid(raw.p2ShipGrid) : null,
          });
        }
      } catch {}
      setLoading(false);
    })();
  }, [roomCode]);

  const moves = game?.moves || [];

  // Reconstruct grid states up to current step
  const { p1Grid, p2Grid } = (() => {
    let p1 = emptyGrid(); // P1's attack (what P1 shot at P2's fleet)
    let p2 = emptyGrid(); // P2's attack (what P2 shot at P1's fleet)
    const p2ShipGrid = game?.p2ShipGrid;
    const p1ShipGrid = game?.p1ShipGrid;
    for (let i = 0; i < step && i < moves.length; i++) {
      const mv = moves[i];
      if (mv.playerNum === 1) {
        p1 = applyMoveToGrid(p1, p2ShipGrid, mv);
      } else {
        p2 = applyMoveToGrid(p2, p1ShipGrid, mv);
      }
    }
    return { p1Grid: p1, p2Grid: p2 };
  })();

  const currentMove = step > 0 ? moves[step - 1] : null;

  const handleShare = useCallback(async () => {
    const text = `Watch my Deep Strike battle: Room #${roomCode}`;
    try {
      await Share.share({ message: text });
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }, [roomCode]);

  if (loading) {
    return (
      <SafeAreaView style={s.root}>
        <LinearGradient colors={['#06080E', '#09111D', '#06080E']} style={StyleSheet.absoluteFill} />
        <View style={s.loading}>
          <ActivityIndicator color={C.CYAN} size="large" />
          <Text style={s.loadingText}>LOADING REPLAY...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!game || moves.length === 0) {
    return (
      <SafeAreaView style={s.root}>
        <LinearGradient colors={['#06080E', '#09111D', '#06080E']} style={StyleSheet.absoluteFill} />
        <View style={s.loading}>
          <Text style={s.loadingText}>NO REPLAY DATA</Text>
          <TouchableOpacity onPress={onBack} style={s.backBtn}><Text style={s.backBtnText}>← BACK</Text></TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.root}>
      <LinearGradient colors={['#06080E', '#09111D', '#06080E']} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={onBack} style={s.backBtn} activeOpacity={0.7}>
            <Text style={s.backBtnText}>← BACK</Text>
          </TouchableOpacity>
          <View style={s.headerTitleRow}>
            <View style={s.headerLine} />
            <Text style={s.headerText}>📽  REPLAY  #{roomCode}</Text>
            <View style={s.headerLine} />
          </View>
        </View>

        {/* Step info */}
        <View style={s.stepInfo}>
          <Text style={s.stepText}>
            MOVE {step}/{moves.length}
            {currentMove ? `  ·  P${currentMove.playerNum} → ${('ABCDEFGHIJ')[currentMove.row]}${currentMove.col + 1}  ·  ${currentMove.sunk ? 'SUNK' : currentMove.hit ? 'HIT' : 'MISS'}` : '  ·  START'}
          </Text>
        </View>

        {/* Grids */}
        <MiniGrid grid={p1Grid} label="P1 ATTACK — P2'S WATERS" />
        <MiniGrid grid={p2Grid} label="P2 ATTACK — P1'S WATERS" />

        {/* Controls */}
        <View style={s.controls}>
          <TouchableOpacity
            style={[s.controlBtn, step === 0 && s.controlBtnDisabled]}
            onPress={() => setStep(0)}
            disabled={step === 0}
            activeOpacity={0.7}
          >
            <Text style={s.controlBtnText}>⏮</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.controlBtn, step === 0 && s.controlBtnDisabled]}
            onPress={() => setStep(s => Math.max(0, s - 1))}
            disabled={step === 0}
            activeOpacity={0.7}
          >
            <Text style={s.controlBtnText}>◀ PREV</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.controlBtn, step === moves.length && s.controlBtnDisabled]}
            onPress={() => setStep(s => Math.min(moves.length, s + 1))}
            disabled={step === moves.length}
            activeOpacity={0.7}
          >
            <Text style={s.controlBtnText}>NEXT ▶</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.controlBtn, step === moves.length && s.controlBtnDisabled]}
            onPress={() => setStep(moves.length)}
            disabled={step === moves.length}
            activeOpacity={0.7}
          >
            <Text style={s.controlBtnText}>⏭</Text>
          </TouchableOpacity>
        </View>

        {/* Share */}
        <TouchableOpacity onPress={handleShare} activeOpacity={0.8} style={s.shareBtn}>
          <Text style={s.shareBtnText}>{copied ? '✓  SHARED!' : '📤  SHARE REPLAY'}</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: C.BG },
  scroll:       { padding: 14, paddingBottom: 40 },
  loading:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  loadingText:  { fontFamily: FONT.MONO, fontSize: 11, color: C.TEXT_DIM, letterSpacing: 2 },

  header:       { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 10 },
  backBtn:      { paddingRight: 4 },
  backBtnText:  { fontFamily: FONT.MONO, fontSize: 12, color: C.TEXT_DIM, letterSpacing: 1 },
  headerTitleRow:{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerLine:   { flex: 1, height: 1, backgroundColor: C.BORDER_MED },
  headerText:   { fontFamily: FONT.MONO, fontSize: 10, color: C.CYAN, letterSpacing: 2 },

  stepInfo:     { backgroundColor: C.BG_CARD, borderWidth: 1, borderColor: C.BORDER, padding: 10, marginBottom: 14, alignItems: 'center' },
  stepText:     { fontFamily: FONT.MONO, fontSize: 9, color: C.AMBER, letterSpacing: 1 },

  controls:     { flexDirection: 'row', gap: 8, marginBottom: 14 },
  controlBtn:   { flex: 1, backgroundColor: C.BG_CARD, borderWidth: 1, borderColor: C.BORDER, padding: 12, alignItems: 'center' },
  controlBtnDisabled:{ opacity: 0.3 },
  controlBtnText:{ fontFamily: FONT.MONO, fontSize: 11, color: C.CYAN, letterSpacing: 1 },

  shareBtn:     { borderWidth: 1, borderColor: C.CYAN_BORDER, padding: 14, alignItems: 'center', marginBottom: 12 },
  shareBtnText: { fontFamily: FONT.MONO, fontSize: 12, color: C.CYAN, letterSpacing: 3 },
});

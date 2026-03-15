import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, PanResponder, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SHIPS, GRID_SIZE } from '../constants/gameConstants';
import { createEmptyShipGrid, isValidPlacement, placeShip, autoPlaceShips } from '../utils/gameLogic';
import { C, FONT, GLOW } from '../theme';

const CELL_SIZE  = 31;
const CELL_STRIDE = 33; // CELL_SIZE + marginHorizontal(1) * 2
const ROW_STRIDE  = 33; // CELL_SIZE + marginBottom(2)
const AXIS_WIDTH  = 20;

const SHIP_COLORS = {
  carrier:    '#1a6b8a',
  dreadnought: '#1a6b3a',
  cruiser:    '#7a4a10',
  submarine:  '#5a2080',
  destroyer:  '#1a3a6a',
};

export default function PlacementScreen({ onReady, commander, headerOverride, onBack, onHome }) {
  const [shipGrid,      setShipGrid]      = useState(createEmptyShipGrid());
  const [selectedShip,  setSelectedShip]  = useState(SHIPS[0]);
  const [horizontal,    setHorizontal]    = useState(true);
  const [placedShips,   setPlacedShips]   = useState({});
  const [previewAnchor, setPreviewAnchor] = useState(null);

  const scrollRef   = useRef(null);
  const gridRowsRef = useRef(null);

  // Keeps latest state accessible inside the stable PanResponder/commitRef closures
  const latestRef = useRef({});
  latestRef.current = { shipGrid, selectedShip, horizontal, placedShips };

  // Stable function ref updated each render — safe to call from PanResponder release
  const commitPlacementRef = useRef(null);
  commitPlacementRef.current = (row, col) => {
    const { shipGrid: grid, selectedShip: ship, horizontal: horiz, placedShips: placed } = latestRef.current;
    const existingId = grid[row][col];
    if (existingId) {
      // Tap-to-move: lift the placed ship back into the player's hand
      const existingShip = SHIPS.find(s => s.id === existingId);
      const newGrid = grid.map(r => r.map(c => (c === existingId ? null : c)));
      const newPlaced = { ...placed };
      delete newPlaced[existingId];
      setShipGrid(newGrid);
      setPlacedShips(newPlaced);
      setSelectedShip(existingShip);
      return;
    }
    if (!ship) return;
    if (!isValidPlacement(grid, ship, row, col, horiz)) return;
    const newGrid   = placeShip(grid, ship, row, col, horiz);
    const newPlaced = { ...placed, [ship.id]: { row, col, horizontal: horiz, size: ship.size, hits: 0, sunk: false } };
    setShipGrid(newGrid);
    setPlacedShips(newPlaced);
    const remaining = SHIPS.filter(sh => !newPlaced[sh.id]);
    setSelectedShip(remaining[0] || null);
  };

  // PanResponder created once; refs give access to current state at event time
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,
      onPanResponderGrant: (evt) => {
        scrollRef.current?.setNativeProps({ scrollEnabled: false });
        const { pageX, pageY } = evt.nativeEvent;
        gridRowsRef.current?.measureInWindow((x, y) => {
          const col = Math.floor((pageX - x - AXIS_WIDTH) / CELL_STRIDE);
          const row = Math.floor((pageY - y) / ROW_STRIDE);
          if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
            setPreviewAnchor({ row, col });
          }
        });
      },
      onPanResponderMove: (evt) => {
        const { pageX, pageY } = evt.nativeEvent;
        gridRowsRef.current?.measureInWindow((x, y) => {
          const col = Math.floor((pageX - x - AXIS_WIDTH) / CELL_STRIDE);
          const row = Math.floor((pageY - y) / ROW_STRIDE);
          if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
            setPreviewAnchor({ row, col });
          }
        });
      },
      onPanResponderRelease: (evt) => {
        scrollRef.current?.setNativeProps({ scrollEnabled: true });
        const { pageX, pageY } = evt.nativeEvent;
        gridRowsRef.current?.measureInWindow((x, y) => {
          const col = Math.floor((pageX - x - AXIS_WIDTH) / CELL_STRIDE);
          const row = Math.floor((pageY - y) / ROW_STRIDE);
          setPreviewAnchor(null);
          if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
            commitPlacementRef.current(row, col);
          }
        });
      },
      onPanResponderTerminate: () => {
        scrollRef.current?.setNativeProps({ scrollEnabled: true });
        setPreviewAnchor(null);
      },
    })
  ).current;

  // Compute ghost preview cells and validity
  const preview = useMemo(() => {
    if (!previewAnchor || !selectedShip) return null;
    const { row, col } = previewAnchor;
    const cells = new Set();
    for (let i = 0; i < selectedShip.size; i++) {
      const r = horizontal ? row : row + i;
      const c = horizontal ? col + i : col;
      cells.add(`${r},${c}`);
    }
    const valid = isValidPlacement(shipGrid, selectedShip, row, col, horizontal);
    return { cells, valid };
  }, [previewAnchor, selectedShip, horizontal, shipGrid]);

  const handleAutoPlace = useCallback(() => {
    const { shipGrid: g, placements } = autoPlaceShips();
    setShipGrid(g);
    setPlacedShips(placements);
    setSelectedShip(null);
    setPreviewAnchor(null);
  }, []);

  const handleReset = useCallback(() => {
    setShipGrid(createEmptyShipGrid());
    setPlacedShips({});
    setSelectedShip(SHIPS[0]);
    setPreviewAnchor(null);
  }, []);

  const allPlaced = SHIPS.every(sh => placedShips[sh.id]);

  return (
    <SafeAreaView style={s.root}>
      <LinearGradient colors={['#06080E', '#09111D', '#06080E']} style={StyleSheet.absoluteFill} />

      <ScrollView ref={scrollRef} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.header}>
          <View style={s.headerLine} />
          <Text style={s.headerText}>
            {headerOverride ? headerOverride.toUpperCase() : 'DEPLOY FLEET'}
          </Text>
          <View style={s.headerLine} />
        </View>
        {commander && (
          <Text style={s.headerSub}>{commander.emoji}  VS {commander.name.toUpperCase()}</Text>
        )}

        {/* Grid */}
        <View style={s.gridWrap}>
          <View style={s.colLabels}>
            <View style={{ width: AXIS_WIDTH }} />
            {[...Array(GRID_SIZE)].map((_, i) => (
              <Text key={i} style={s.colLabel}>{i + 1}</Text>
            ))}
          </View>
          {/* PanResponder wraps only the grid rows, not the col labels */}
          <View ref={gridRowsRef} {...panResponder.panHandlers}>
            {[...Array(GRID_SIZE)].map((_, row) => (
              <View key={row} style={s.gridRow}>
                <Text style={s.axisLabel}>{'ABCDEFGHIJ'[row]}</Text>
                {[...Array(GRID_SIZE)].map((_, col) => {
                  const key      = `${row},${col}`;
                  const isPreview = preview?.cells.has(key);
                  const shipId   = shipGrid[row][col];

                  let bg, border;
                  if (isPreview) {
                    bg     = preview.valid ? 'rgba(0,229,255,0.25)' : 'rgba(255,43,43,0.3)';
                    border = preview.valid ? C.CYAN : C.RED_BORDER;
                  } else if (shipId) {
                    bg     = SHIP_COLORS[shipId] || C.CYAN_DIM;
                    border = 'transparent';
                  } else {
                    bg     = 'rgba(255,255,255,0.03)';
                    border = C.BORDER;
                  }

                  return (
                    <View
                      key={col}
                      style={[s.cell, { backgroundColor: bg, borderColor: border }]}
                    />
                  );
                })}
              </View>
            ))}
          </View>
        </View>

        {/* Controls */}
        <View style={s.controls}>
          {(onBack || onHome) && (
            <TouchableOpacity
              style={s.ctrl}
              onPress={() => {
                Alert.alert(
                  'Leave Deployment?',
                  'Your fleet placement will be lost.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    ...(onBack ? [{ text: 'Back to Commanders', onPress: onBack }] : []),
                    ...(onHome ? [{ text: 'Main Menu', style: 'destructive', onPress: onHome }] : []),
                  ]
                );
              }}
              activeOpacity={0.8}
            >
              <Text style={[s.ctrlText, { color: C.TEXT_MUTED }]}>← BACK</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[s.ctrl, horizontal && s.ctrlActive]} onPress={() => setHorizontal(h => !h)} activeOpacity={0.8}>
            <Text style={[s.ctrlText, horizontal && { color: C.CYAN }]}>{horizontal ? '↔ HORIZ' : '↕ VERT'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.ctrl} onPress={handleAutoPlace} activeOpacity={0.8}>
            <Text style={s.ctrlText}>🎲 AUTO</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.ctrl} onPress={handleReset} activeOpacity={0.8}>
            <Text style={[s.ctrlText, { color: C.TEXT_DIM }]}>↺ RESET</Text>
          </TouchableOpacity>
        </View>

        {/* Ship list */}
        <View style={s.fleetSection}>
          <View style={s.sectionLabel}>
            <View style={s.sectionDot} />
            <Text style={s.sectionText}>YOUR FLEET</Text>
          </View>
          {SHIPS.map(ship => {
            const isSelected = selectedShip?.id === ship.id;
            const isPlaced   = !!placedShips[ship.id];
            return (
              <TouchableOpacity
                key={ship.id}
                style={[s.shipRow, isSelected && s.shipRowSelected, isPlaced && s.shipRowPlaced]}
                onPress={() => !isPlaced && setSelectedShip(ship)}
                disabled={isPlaced}
                activeOpacity={0.8}
              >
                <Text style={s.shipSymbol}>{ship.symbol}</Text>
                <Text style={s.shipName}>{ship.name.toUpperCase()}</Text>
                <View style={s.shipBlocks}>
                  {[...Array(ship.size)].map((_, i) => (
                    <View key={i} style={[s.block, isPlaced && s.blockPlaced, isSelected && s.blockSelected]} />
                  ))}
                </View>
                <Text style={[s.shipStatus, isPlaced && { color: C.GREEN }]}>
                  {isPlaced ? '✓' : isSelected ? '▶' : ''}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Ready button */}
        <TouchableOpacity
          style={[s.readyBtn, !allPlaced && s.readyBtnOff, allPlaced && GLOW.cyan]}
          onPress={() => allPlaced && onReady(shipGrid, placedShips)}
          disabled={!allPlaced}
          activeOpacity={0.85}
        >
          {allPlaced && (
            <LinearGradient colors={['rgba(0,229,255,0.25)', 'rgba(0,229,255,0.08)']} style={StyleSheet.absoluteFill} />
          )}
          <Text style={[s.readyBtnText, !allPlaced && { color: C.TEXT_MUTED }]}>
            {allPlaced
              ? '⚔  BATTLE STATIONS'
              : `PLACE ${SHIPS.filter(sh => !placedShips[sh.id]).length} MORE SHIP${SHIPS.filter(sh => !placedShips[sh.id]).length > 1 ? 'S' : ''}`}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:           { flex: 1, backgroundColor: C.BG },
  scroll:         { padding: 16, paddingBottom: 44 },

  header:         { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  headerLine:     { flex: 1, height: 1, backgroundColor: C.BORDER_MED },
  headerText:     { fontFamily: FONT.MONO, fontSize: 11, color: C.CYAN, letterSpacing: 3 },
  headerSub:      { fontFamily: FONT.MONO, fontSize: 10, color: C.TEXT_MUTED, letterSpacing: 1.5, textAlign: 'center', marginBottom: 16 },

  gridWrap:       { alignSelf: 'center', marginBottom: 14 },
  colLabels:      { flexDirection: 'row', marginBottom: 2 },
  gridRow:        { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  axisLabel:      { width: AXIS_WIDTH, fontFamily: FONT.MONO, fontSize: 9, color: C.TEXT_MUTED, textAlign: 'center' },
  colLabel:       { width: CELL_STRIDE, fontFamily: FONT.MONO, fontSize: 9, color: C.TEXT_MUTED, textAlign: 'center' },
  cell:           { width: CELL_SIZE, height: CELL_SIZE, borderWidth: 1, marginHorizontal: 1 },

  controls:       { flexDirection: 'row', gap: 8, marginBottom: 20 },
  ctrl:           { flex: 1, backgroundColor: C.BG_CARD, borderWidth: 1, borderColor: C.BORDER, padding: 10, alignItems: 'center' },
  ctrlActive:     { borderColor: C.CYAN, backgroundColor: C.CYAN_DIM },
  ctrlText:       { fontFamily: FONT.MONO, fontSize: 11, color: C.TEXT_DIM, letterSpacing: 1 },

  fleetSection:   { marginBottom: 20 },
  sectionLabel:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  sectionDot:     { width: 4, height: 4, backgroundColor: C.CYAN },
  sectionText:    { fontFamily: FONT.MONO, fontSize: 10, color: C.CYAN, letterSpacing: 2 },

  shipRow:        { flexDirection: 'row', alignItems: 'center', padding: 10, backgroundColor: C.BG_CARD, borderWidth: 1, borderColor: 'transparent', marginBottom: 6 },
  shipRowSelected:{ borderColor: C.CYAN, backgroundColor: C.CYAN_DIM },
  shipRowPlaced:  { opacity: 0.45 },
  shipSymbol:     { fontSize: 17, marginRight: 10 },
  shipName:       { flex: 1, fontFamily: FONT.MONO, fontSize: 11, color: C.TEXT, letterSpacing: 1 },
  shipBlocks:     { flexDirection: 'row', gap: 3, marginRight: 10 },
  block:          { width: 10, height: 10, backgroundColor: C.TEXT_MUTED },
  blockPlaced:    { backgroundColor: C.GREEN },
  blockSelected:  { backgroundColor: C.CYAN },
  shipStatus:     { fontFamily: FONT.MONO, fontSize: 13, color: C.CYAN, width: 14, textAlign: 'right' },

  readyBtn:       { borderWidth: 1, borderColor: C.CYAN, padding: 20, alignItems: 'center', overflow: 'hidden', position: 'relative' },
  readyBtnOff:    { borderColor: C.BORDER, backgroundColor: C.BG_CARD },
  readyBtnText:   { fontSize: 15, fontWeight: '900', color: C.CYAN, letterSpacing: 4 },
});

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Animated, SafeAreaView, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COMMANDERS, RARITY_COLORS } from '../constants/gameConstants';
import { getAllCommandersStatus, XP_PER_LEVEL } from '../services/commanderService';
import { C, FONT, GLOW } from '../theme';
import { ms, MAX_CONTENT_W } from '../utils/responsive';

export default function CommanderScreen({ onSelect, onBack, onPaywall, mpMode = false, isPremium = true }) {
  const [selected, setSelected]     = useState(null);
  const [difficulty, setDifficulty] = useState('medium');
  const [commanderStatus, setCommanderStatus] = useState([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    // Load commander ownership/rotation status
    getAllCommandersStatus().then(status => setCommanderStatus(status));
  }, []);

  const difficulties = [
    { id: 'easy',   label: 'CADET',   emoji: '🌊', desc: 'Relaxed' },
    { id: 'medium', label: 'OFFICER', emoji: '⚓', desc: 'Skilled' },
    { id: 'hard',   label: 'ADMIRAL', emoji: '🎖', desc: 'Ruthless' },
  ];

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#06080E', '#09111D', '#06080E']} style={StyleSheet.absoluteFill} />

      <Animated.View style={[s.inner, { opacity: fadeAnim }]}>
        {/* Header */}
        <View style={s.header}>
          <View style={s.headerLine} />
          <Text style={s.headerText}>SELECT OPPONENT</Text>
          <View style={s.headerLine} />
        </View>
        <Text style={s.headerSub}>{mpMode ? 'CHOOSE YOUR COMMANDER' : 'CHOOSE YOUR ENEMY COMMANDER'}</Text>

        {/* Scrollable commander list only */}
        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
          {commanderStatus.map((cmd) => {
            const isLocked = !cmd.available && !isPremium;
            const isSelected = selected?.id === cmd.id;
            return (
              <TouchableOpacity
                key={cmd.id}
                onPress={() => {
                  if (isLocked) { onPaywall?.(); return; }
                  setSelected(cmd);
                }}
                activeOpacity={0.8}
                style={[
                  s.card,
                  isSelected && { borderColor: C.CYAN, borderWidth: 1.5, ...GLOW.cyan },
                  isLocked && { opacity: 0.55 },
                ]}
              >
                {isSelected && (
                  <LinearGradient
                    colors={['rgba(0,229,255,0.1)', 'transparent']}
                    style={StyleSheet.absoluteFill}
                  />
                )}
                <View style={[s.cardAccent, { backgroundColor: cmd.color }]} />
                <View style={[s.cardEmoji, { backgroundColor: cmd.color + '22' }]}>
                  <Text style={s.cmdEmoji}>{cmd.emoji}</Text>
                </View>
                <View style={s.cardBody}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <Text style={s.cmdName}>{cmd.name.toUpperCase()}</Text>
                    {cmd.rarity && (
                      <View style={[s.rarityBadge, { borderColor: RARITY_COLORS[cmd.rarity] }]}>
                        <Text style={[s.rarityText, { color: RARITY_COLORS[cmd.rarity] }]}>
                          {cmd.rarity.toUpperCase()}
                        </Text>
                      </View>
                    )}
                  </View>
                  {cmd.owned && (() => {
                    const lvl = cmd.level || 1;
                    const xp  = cmd.xp  || 0;
                    const atMax = lvl >= 10;
                    const cur = XP_PER_LEVEL[lvl]     || 0;
                    const nxt = XP_PER_LEVEL[lvl + 1] || 1;
                    const pct = atMax ? 100 : Math.min(100, Math.round(((xp - cur) / (nxt - cur)) * 100));
                    return (
                      <View style={s.xpRow}>
                        <Text style={s.levelText}>LVL {lvl}{atMax ? ' · MAX' : ''}</Text>
                        {!atMax && (
                          <View style={s.xpBarBg}>
                            <View style={[s.xpBarFill, { width: `${pct}%` }]} />
                          </View>
                        )}
                      </View>
                    );
                  })()}
                  {cmd.inRotation && !cmd.owned && (
                    <View style={s.rotationBadge}>
                      <Text style={s.rotationText}>🔄 FREE THIS WEEK</Text>
                    </View>
                  )}
                  <Text style={s.cmdDesc}>{cmd.description}</Text>
                  <Text style={s.cmdTaunt}>"{cmd.taunt}"</Text>
                  {mpMode && cmd.ability && (
                    <View style={s.abilityCard}>
                      <Text style={s.abilityIcon}>{cmd.ability.icon}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={s.abilityName}>{cmd.ability.name}</Text>
                        <Text style={s.abilityDesc}>{cmd.ability.description}</Text>
                      </View>
                    </View>
                  )}
                </View>
                {isLocked && (
                  <View style={s.lockBadge}>
                    <Text style={s.lockIcon}>🔒</Text>
                  </View>
                )}
                {isSelected && !isLocked && (
                  <View style={[s.selectedBadge, { backgroundColor: C.CYAN }]}>
                    <Text style={s.selectedTick}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Sticky footer — always visible regardless of scroll position */}
        <View style={s.footer}>
          {/* Difficulty — hidden in MP mode */}
          {!mpMode && (
            <View style={s.section}>
              <View style={s.sectionLabel}>
                <View style={s.sectionDot} />
                <Text style={s.sectionText}>DIFFICULTY</Text>
              </View>
              <View style={s.diffRow}>
                {difficulties.map(d => (
                  <TouchableOpacity
                    key={d.id}
                    onPress={() => setDifficulty(d.id)}
                    style={[s.diffBtn, difficulty === d.id && s.diffBtnActive]}
                    activeOpacity={0.8}
                  >
                    <Text style={s.diffEmoji}>{d.emoji}</Text>
                    <Text style={[s.diffLabel, difficulty === d.id && { color: C.CYAN }]}>{d.label}</Text>
                    <Text style={s.diffDesc}>{d.desc}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Buttons */}
          <View style={s.btnRow}>
            <TouchableOpacity onPress={onBack} style={s.backBtn} activeOpacity={0.7}>
              <Text style={s.backBtnText}>← BACK</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => selected && (mpMode ? onSelect(selected) : onSelect(selected, difficulty))}
              disabled={!selected}
              activeOpacity={0.8}
              style={[s.battleBtn, !selected && s.battleBtnOff, selected && GLOW.cyan]}
            >
              {selected && (
                <LinearGradient colors={['rgba(0,229,255,0.22)', 'rgba(0,229,255,0.08)']} style={StyleSheet.absoluteFill} />
              )}
              <Text style={[s.battleBtnText, !selected && { color: C.TEXT_MUTED }]}>
                {selected
                  ? mpMode ? `SELECT ${selected.name.split(' ').slice(-1)[0].toUpperCase()}` : `BATTLE ${selected.name.split(' ')[1].toUpperCase()}`
                  : 'PICK COMMANDER'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:           { flex: 1, backgroundColor: C.BG },
  inner:          { flex: 1, paddingHorizontal: 16, paddingTop: 12, maxWidth: MAX_CONTENT_W, alignSelf: 'center', width: '100%' },

  header:         { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  headerLine:     { flex: 1, height: 1, backgroundColor: C.BORDER_MED },
  headerText:     { fontFamily: FONT.MONO, fontSize: ms(11), color: C.CYAN, letterSpacing: 3 },
  headerSub:      { fontFamily: FONT.MONO, fontSize: ms(9), color: C.TEXT_MUTED, letterSpacing: 2, textAlign: 'center', marginBottom: 18 },

  card:           { flexDirection: 'row', alignItems: 'center', backgroundColor: C.BG_CARD, borderWidth: 1, borderColor: C.BORDER, marginBottom: 10, overflow: 'hidden', position: 'relative' },
  cardAccent:     { width: 3, alignSelf: 'stretch' },
  cardEmoji:      { width: ms(72), alignItems: 'center', justifyContent: 'center', paddingVertical: ms(18) },
  cmdEmoji:       { fontSize: ms(34) },
  cardBody:       { flex: 1, padding: ms(12) },
  cmdName:        { fontSize: ms(14), fontWeight: '900', color: C.TEXT, letterSpacing: 2 },
  rarityBadge:    { borderWidth: 1, paddingHorizontal: 5, paddingVertical: 1 },
  rarityText:     { fontFamily: FONT.MONO, fontSize: ms(7), letterSpacing: 1, fontWeight: '900' },
  levelText:      { fontFamily: FONT.MONO, fontSize: ms(9), color: C.AMBER, letterSpacing: 1 },
  xpRow:          { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  xpBarBg:        { flex: 1, height: 3, backgroundColor: 'rgba(255,179,0,0.2)', overflow: 'hidden' },
  xpBarFill:      { height: '100%', backgroundColor: C.AMBER },
  rotationBadge:  { alignSelf: 'flex-start', backgroundColor: 'rgba(0,229,255,0.1)', borderWidth: 1, borderColor: C.CYAN_BORDER, paddingHorizontal: 6, paddingVertical: 2, marginBottom: 4 },
  rotationText:   { fontFamily: FONT.MONO, fontSize: ms(7), color: C.CYAN, letterSpacing: 1 },
  cmdDesc:        { fontSize: ms(11), color: C.TEXT_DIM, marginBottom: 5 },
  cmdTaunt:       { fontSize: ms(10), color: C.CYAN, fontStyle: 'italic', fontFamily: FONT.MONO },
  selectedBadge:  { position: 'absolute', top: 8, right: 8, width: ms(22), height: ms(22), alignItems: 'center', justifyContent: 'center' },
  selectedTick:   { color: '#000', fontWeight: '900', fontSize: ms(12) },
  lockBadge:      { position: 'absolute', top: 8, right: 8, width: ms(28), height: ms(28), alignItems: 'center', justifyContent: 'center' },
  lockIcon:       { fontSize: ms(16) },

  abilityCard:    { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 8, backgroundColor: 'rgba(255,179,0,0.08)', borderWidth: 1, borderColor: 'rgba(255,179,0,0.3)', padding: 7 },
  abilityIcon:    { fontSize: ms(16) },
  abilityName:    { fontFamily: FONT.MONO, fontSize: ms(9), fontWeight: '900', color: '#FFB300', letterSpacing: 1.5 },
  abilityDesc:    { fontFamily: FONT.MONO, fontSize: ms(8), color: C.TEXT_MUTED, marginTop: 2 },

  footer:         { paddingTop: 10, paddingBottom: 4 },
  section:        { marginBottom: 12 },
  sectionLabel:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  sectionDot:     { width: 4, height: 4, backgroundColor: C.CYAN },
  sectionText:    { fontFamily: FONT.MONO, fontSize: ms(10), color: C.CYAN, letterSpacing: 2 },
  diffRow:        { flexDirection: 'row', gap: 8 },
  diffBtn:        { flex: 1, backgroundColor: C.BG_CARD, borderWidth: 1, borderColor: C.BORDER, padding: ms(12), alignItems: 'center' },
  diffBtnActive:  { borderColor: C.CYAN, backgroundColor: C.CYAN_DIM },
  diffEmoji:      { fontSize: ms(20), marginBottom: 4 },
  diffLabel:      { fontSize: ms(11), fontWeight: '900', color: C.TEXT_DIM, letterSpacing: 1 },
  diffDesc:       { fontFamily: FONT.MONO, fontSize: ms(9), color: C.TEXT_MUTED, marginTop: 2 },

  btnRow:         { flexDirection: 'row', gap: 10, marginBottom: 8 },
  backBtn:        { flex: 1, backgroundColor: C.BG_CARD, borderWidth: 1, borderColor: C.BORDER, padding: ms(16), alignItems: 'center' },
  backBtnText:    { fontFamily: FONT.MONO, fontSize: ms(12), color: C.TEXT_DIM, letterSpacing: 2 },
  battleBtn:      { flex: 2, borderWidth: 1, borderColor: C.CYAN, padding: ms(16), alignItems: 'center', overflow: 'hidden', position: 'relative' },
  battleBtnOff:   { borderColor: C.BORDER },
  battleBtnText:  { fontSize: ms(13), fontWeight: '900', color: C.CYAN, letterSpacing: 2 },
});

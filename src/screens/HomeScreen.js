import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
  SafeAreaView, StatusBar, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C, FONT, GLOW } from '../theme';
import { GAME_MODES } from '../constants/gameConstants';
import AdBanner from '../components/AdBanner';

const { width, height } = Dimensions.get('window');

const SonarRing = ({ delay, size }) => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const run = () => {
      anim.setValue(0);
      Animated.timing(anim, { toValue: 1, duration: 3000, useNativeDriver: true }).start(() => run());
    };
    const t = setTimeout(run, delay);
    return () => clearTimeout(t);
  }, []);
  const s = size;
  return (
    <Animated.View pointerEvents="none" style={{
      position: 'absolute',
      width: s, height: s,
      borderRadius: s / 2,
      borderWidth: 1,
      borderColor: C.CYAN,
      top: height * 0.32 - s / 2,
      left: width / 2 - s / 2,
      opacity: anim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 0.35, 0] }),
      transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] }) }],
    }} />
  );
};

const GridBg = () => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    {Array.from({ length: 18 }).map((_, i) => (
      <View key={`h${i}`} style={{ position: 'absolute', left: 0, right: 0, top: i * (height / 18), height: 1, backgroundColor: 'rgba(0,229,255,0.04)' }} />
    ))}
    {Array.from({ length: 12 }).map((_, i) => (
      <View key={`v${i}`} style={{ position: 'absolute', top: 0, bottom: 0, left: i * (width / 12), width: 1, backgroundColor: 'rgba(0,229,255,0.04)' }} />
    ))}
  </View>
);

export default function HomeScreen({ onStart, onMultiplayer, onLeaderboard, onSettings, onStore, onCampaign, onBattlePass, onChallenges, isPremium = false }) {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(28)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scanAnim  = useRef(new Animated.Value(0)).current;
  const [selectedMode, setSelectedMode] = useState(GAME_MODES.CLASSIC);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 900,  useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 900,  useNativeDriver: true }),
    ]).start();

    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.025, duration: 1600, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1,     duration: 1600, useNativeDriver: true }),
    ])).start();

    Animated.loop(Animated.timing(scanAnim, { toValue: 1, duration: 4000, useNativeDriver: true })).start();
  }, []);

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#06080E', '#09111D', '#06080E']} style={StyleSheet.absoluteFill} />
      <GridBg />

      {/* Sonar rings */}
      <SonarRing delay={0}    size={width * 0.55} />
      <SonarRing delay={1000} size={width * 0.85} />
      <SonarRing delay={2000} size={width * 1.15} />

      <Animated.View style={[s.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

        {/* Settings icon */}
        {onSettings && (
          <TouchableOpacity onPress={onSettings} style={s.settingsBtn} activeOpacity={0.7}>
            <Text style={s.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        )}

        {/* Top tag */}
        <View style={s.topTag}>
          <View style={s.tagDot} />
          <Text style={s.tagText}>TACTICAL NAVAL WARFARE SYSTEM</Text>
          <View style={s.tagDot} />
        </View>

        {/* Main title block */}
        <View style={s.titleBlock}>
          <Text style={s.titleMain}>DEEP</Text>
          <Text style={s.titleMain}>STRIKE</Text>
          <View style={s.titleDivider}>
            <View style={s.divLine} />
            <Text style={s.titleAI}>A · I</Text>
            <View style={s.divLine} />
          </View>
        </View>

        {/* Feature chips */}
        <View style={s.chips}>
          {[
            { icon: '🎙', label: 'VOICE' },
            { icon: '🧠', label: 'AI CMD' },
            { icon: '🌊', label: 'LIVE FX' },
          ].map(f => (
            <View key={f.label} style={s.chip}>
              <Text style={s.chipIcon}>{f.icon}</Text>
              <Text style={s.chipLabel}>{f.label}</Text>
            </View>
          ))}
        </View>

        {/* Mode toggle */}
        <View style={s.modeRow}>
          {[
            { mode: GAME_MODES.CLASSIC, label: 'CLASSIC', icon: '🎯', locked: false },
            { mode: GAME_MODES.SALVO,   label: 'SALVO',   icon: '🔥', locked: !isPremium },
            { mode: GAME_MODES.DAILY,   label: 'DAILY',   icon: '📅', locked: !isPremium },
          ].map(({ mode, label, icon, locked }) => (
            <TouchableOpacity
              key={mode}
              style={[s.modeChip, selectedMode === mode && s.modeChipActive]}
              onPress={() => setSelectedMode(mode)}
              activeOpacity={0.8}
            >
              <Text style={s.modeChipIcon}>{icon}</Text>
              <Text style={[s.modeChipLabel, selectedMode === mode && s.modeChipLabelActive]}>{label}</Text>
              {locked && <Text style={s.modeLock}>🔒</Text>}
            </TouchableOpacity>
          ))}
        </View>

        {/* Primary CTA */}
        <View style={s.btnGroup}>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity onPress={() => onStart(selectedMode)} activeOpacity={0.8} style={[s.btnPrimary, GLOW.cyan]}>
              <LinearGradient
                colors={['rgba(0,229,255,0.2)', 'rgba(0,229,255,0.08)']}
                style={s.btnGrad}
              >
                <Text style={s.btnPrimaryIcon}>⚡</Text>
                <Text style={s.btnPrimaryText}>DEPLOY VS AI</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity onPress={() => onMultiplayer(selectedMode)} activeOpacity={0.8} style={s.btnSecondary}>
            <Text style={s.btnSecondaryIcon}>{isPremium ? '👥' : '🔒'}</Text>
            <Text style={s.btnSecondaryText}>2-PLAYER STRIKE</Text>
          </TouchableOpacity>

          {onCampaign && (
            <TouchableOpacity onPress={onCampaign} activeOpacity={0.8} style={s.btnCampaign}>
              <Text style={s.btnCampaignIcon}>📖</Text>
              <Text style={s.btnCampaignText}>CAMPAIGN</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={s.tagline}>ALL HANDS ON DECK · COMMANDER</Text>

        <View style={s.bottomLinks}>
          {onLeaderboard && (
            <TouchableOpacity onPress={onLeaderboard} activeOpacity={0.7} style={s.bottomLink}>
              <Text style={s.leaderboardLinkText}>🏆 LEADERBOARD</Text>
            </TouchableOpacity>
          )}
          {onStore && (
            <TouchableOpacity onPress={onStore} activeOpacity={0.7} style={s.bottomLink}>
              <Text style={s.storeLinkText}>🛒 ARMORY</Text>
            </TouchableOpacity>
          )}
          {onBattlePass && (
            <TouchableOpacity onPress={onBattlePass} activeOpacity={0.7} style={s.bottomLink}>
              <Text style={s.bpLinkText}>🎖 PASS</Text>
            </TouchableOpacity>
          )}
          {onChallenges && (
            <TouchableOpacity onPress={onChallenges} activeOpacity={0.7} style={s.bottomLink}>
              <Text style={s.challengeLinkText}>⚡ MISSIONS</Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>

      {/* Banner ad — shown at bottom for free users only */}
      <AdBanner />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:            { flex: 1, backgroundColor: C.BG },
  content:         { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },

  settingsBtn:     { position: 'absolute', top: 20, right: 24, padding: 8 },
  settingsIcon:    { fontSize: 22 },

  topTag:          { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 32 },
  tagDot:          { width: 4, height: 4, borderRadius: 2, backgroundColor: C.CYAN },
  tagText:         { fontFamily: FONT.MONO, fontSize: 9, color: C.CYAN, letterSpacing: 2 },

  titleBlock:      { alignItems: 'center', marginBottom: 28 },
  titleMain:       { fontSize: 72, fontWeight: '900', color: C.TEXT, letterSpacing: 10, lineHeight: 78 },
  titleDivider:    { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 },
  divLine:         { flex: 1, height: 1, backgroundColor: C.CYAN_BORDER },
  titleAI:         { fontSize: 20, fontWeight: '700', color: C.CYAN, letterSpacing: 14, fontFamily: FONT.MONO },

  chips:           { flexDirection: 'row', gap: 10, marginBottom: 44 },
  chip:            { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.BG_CARD, borderWidth: 1, borderColor: C.BORDER, paddingVertical: 7, paddingHorizontal: 12 },
  chipIcon:        { fontSize: 13 },
  chipLabel:       { fontFamily: FONT.MONO, fontSize: 10, color: C.TEXT_DIM, letterSpacing: 1.5 },

  modeRow:         { flexDirection: 'row', gap: 10, marginBottom: 18 },
  modeChip:        { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: C.BG_CARD, borderWidth: 1, borderColor: C.BORDER, paddingVertical: 10 },
  modeChipActive:  { borderColor: C.CYAN, backgroundColor: C.CYAN_DIM },
  modeChipIcon:    { fontSize: 14 },
  modeChipLabel:   { fontFamily: FONT.MONO, fontSize: 11, fontWeight: '900', color: C.TEXT_DIM, letterSpacing: 2 },
  modeChipLabelActive: { color: C.CYAN },
  modeLock:        { fontSize: 9, marginLeft: 2 },

  btnGroup:        { width: '100%', gap: 12, marginBottom: 28 },
  btnPrimary:      { borderWidth: 1, borderColor: C.CYAN, overflow: 'hidden' },
  btnGrad:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18 },
  btnPrimaryIcon:  { fontSize: 18 },
  btnPrimaryText:  { fontSize: 16, fontWeight: '900', color: C.CYAN, letterSpacing: 4 },
  btnSecondary:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderWidth: 1, borderColor: C.GREEN_BORDER, paddingVertical: 16, backgroundColor: C.GREEN_DIM },
  btnSecondaryIcon:{ fontSize: 16 },
  btnSecondaryText:{ fontSize: 15, fontWeight: '900', color: C.GREEN, letterSpacing: 3 },

  btnCampaign:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderWidth: 1, borderColor: C.AMBER_BORDER, paddingVertical: 14, backgroundColor: C.AMBER_DIM },
  btnCampaignIcon: { fontSize: 16 },
  btnCampaignText: { fontSize: 14, fontWeight: '900', color: C.AMBER, letterSpacing: 3 },

  tagline:         { fontFamily: FONT.MONO, fontSize: 10, color: C.TEXT_MUTED, letterSpacing: 3 },
  bottomLinks:     { flexDirection: 'row', gap: 20, marginTop: 12 },
  bottomLink:      { padding: 8, alignItems: 'center' },
  leaderboardLinkText: { fontFamily: FONT.MONO, fontSize: 10, color: C.AMBER, letterSpacing: 2 },
  storeLinkText:   { fontFamily: FONT.MONO, fontSize: 10, color: C.CYAN, letterSpacing: 2 },
  bpLinkText:      { fontFamily: FONT.MONO, fontSize: 10, color: C.AMBER, letterSpacing: 2 },
  challengeLinkText: { fontFamily: FONT.MONO, fontSize: 10, color: C.GREEN, letterSpacing: 2 },
});

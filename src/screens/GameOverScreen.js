import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, SafeAreaView, ScrollView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSoundEffects } from '../hooks/useSoundEffects';
import { requestRating } from '../services/ratingService';
import { maybeShowAd } from '../services/adService';
import { C, FONT, GLOW } from '../theme';
import AdBanner from '../components/AdBanner';

export default function GameOverScreen({ result, commander, xpResult, onPlayAgain, onHome, onReplay, roomCode }) {
  const { winner, shots, hits } = result;
  const playerWon  = winner === 'player';
  const accuracy   = shots > 0 ? Math.round((hits / shots) * 100) : 0;
  const reaction   = commander ? (playerWon ? commander.loseReaction : commander.winReaction) : null;

  const scaleAnim  = useRef(new Animated.Value(0)).current;
  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const pulseAnim  = useRef(new Animated.Value(1)).current;
  const { play }   = useSoundEffects();
  const [adLoading, setAdLoading] = useState(false);

  const handlePlayAgain = async () => {
    setAdLoading(true);
    try {
      await maybeShowAd(); // no-op for premium users; shows ad every 5th game for free users
    } finally {
      setAdLoading(false);
      onPlayAgain();
    }
  };

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, tension: 55, friction: 7, useNativeDriver: true }),
      Animated.timing(fadeAnim,  { toValue: 1, duration: 700, useNativeDriver: true }),
    ]).start();

    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.04, duration: 1400, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1,    duration: 1400, useNativeDriver: true }),
    ])).start();

    setTimeout(() => play(playerWon ? 'win' : 'lose'), 500);

    // Request rating after a win (70%+ accuracy)
    if (playerWon && accuracy >= 70) {
      setTimeout(() => requestRating(), 2000);
    }
  }, [playerWon, accuracy]);

  const rank = accuracy >= 70 ? { label: 'ADMIRAL', stars: '★★★', color: '#FFD700' }
             : accuracy >= 40 ? { label: 'CAPTAIN', stars: '★★☆', color: '#C0C0C0' }
             :                  { label: 'RECRUIT',  stars: '★☆☆', color: '#CD7F32' };

  const accentColor = playerWon ? C.GREEN : C.RED;
  const accentDim   = playerWon ? C.GREEN_DIM : C.RED_DIM;

  return (
    <SafeAreaView style={s.root}>
      <LinearGradient
        colors={playerWon ? ['#06080E', '#071408', '#06080E'] : ['#06080E', '#140806', '#06080E']}
        style={StyleSheet.absoluteFill}
      />

      {/* Accent lines */}
      <View style={[s.topLine, { backgroundColor: accentColor }]} />
      <View style={[s.bottomLine, { backgroundColor: accentColor }]} />

      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
      <Animated.View style={[s.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>

        {/* Result badge */}
        <View style={[s.resultBadge, { borderColor: accentColor, backgroundColor: accentDim }]}>
          <Text style={s.resultEmoji}>{playerWon ? '🏆' : '💀'}</Text>
        </View>

        <Text style={[s.resultText, { color: accentColor }]}>
          {playerWon ? 'VICTORY' : 'MISSION FAILED'}
        </Text>
        <Text style={s.resultSub}>
          {playerWon ? 'ENEMY FLEET DESTROYED' : 'YOUR FLEET HAS BEEN SUNK'}
        </Text>

        {/* Commander reaction */}
        {commander && reaction && (
          <View style={s.intelBox}>
            <View style={s.intelHeader}>
              <View style={[s.intelDot, { backgroundColor: accentColor }]} />
              <Text style={[s.intelTitle, { color: accentColor }]}>ENEMY REPORT</Text>
            </View>
            <View style={s.intelBody}>
              <Text style={s.cmdEmoji}>{commander.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.cmdName}>{commander.name.toUpperCase()}</Text>
                <Text style={s.cmdReaction}>"{reaction}"</Text>
              </View>
            </View>
          </View>
        )}

        {/* Stats — MISSION DEBRIEF */}
        <View style={s.debrief}>
          <View style={s.debriefHeader}>
            <View style={s.sectionDot} />
            <Text style={s.debriefTitle}>MISSION DEBRIEF</Text>
          </View>
          <View style={s.statsRow}>
            {[
              { label: 'SHOTS FIRED', value: shots,        icon: '💣' },
              { label: 'DIRECT HITS', value: hits,         icon: '💥' },
              { label: 'ACCURACY',    value: `${accuracy}%`, icon: '🎯' },
            ].map(stat => (
              <View key={stat.label} style={s.statCard}>
                <Text style={s.statIcon}>{stat.icon}</Text>
                <Text style={[s.statValue, { fontFamily: FONT.MONO }]}>{stat.value}</Text>
                <Text style={s.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Rank */}
        <View style={[s.rankBox, { borderColor: rank.color + '55' }]}>
          <Text style={[s.rankStars, { color: rank.color }]}>{rank.stars}</Text>
          <Text style={[s.rankLabel, { color: rank.color }]}>{rank.label}</Text>
          <Text style={s.rankSub}>{accuracy >= 70 ? 'LEGENDARY PRECISION' : accuracy >= 40 ? 'SOLID PERFORMANCE' : 'KEEP TRAINING, CADET'}</Text>
        </View>

        {/* Commander XP */}
        {xpResult && commander && (
          <View style={s.xpBox}>
            <View style={s.xpHeader}>
              <View style={s.sectionDot} />
              <Text style={s.xpTitle}>COMMANDER PROGRESS</Text>
            </View>
            <View style={s.xpRow}>
              <Text style={s.cmdEmojiSmall}>{commander.emoji}</Text>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={s.xpEarned}>+{xpResult.xpEarned} XP</Text>
                  {xpResult.leveledUp
                    ? <Text style={s.levelUp}>LEVEL UP! LVL {xpResult.newLevel}</Text>
                    : <Text style={s.xpLevel}>LVL {xpResult.newLevel}</Text>}
                </View>
                {xpResult.newLevel < 10 && (
                  <View style={s.xpBarBg}>
                    <View style={[s.xpBarFill, {
                      width: `${Math.min(100, Math.round((xpResult.xp / [0,100,250,450,700,1000,1350,1750,2200,2700,3250][xpResult.newLevel + 1]) * 100))}%`
                    }]} />
                  </View>
                )}
                {xpResult.newLevel >= 10 && (
                  <Text style={s.xpMax}>MAX LEVEL</Text>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Buttons */}
        <View style={s.btnGroup}>
          <Animated.View style={[{ width: '100%' }, { transform: [{ scale: pulseAnim }] }]}>
            <TouchableOpacity onPress={handlePlayAgain} disabled={adLoading} activeOpacity={0.8} style={[s.playAgainBtn, { borderColor: accentColor }, playerWon ? GLOW.green : GLOW.red]}>
              <LinearGradient colors={[accentDim, 'transparent']} style={StyleSheet.absoluteFill} />
              {adLoading
                ? <ActivityIndicator color={accentColor} />
                : <Text style={[s.playAgainText, { color: accentColor }]}>⚔  DEPLOY AGAIN</Text>
              }
            </TouchableOpacity>
          </Animated.View>
          {onReplay && roomCode && (
            <TouchableOpacity onPress={onReplay} activeOpacity={0.8} style={s.replayBtn}>
              <Text style={s.replayBtnText}>📽  WATCH REPLAY</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={onHome} activeOpacity={0.7} style={s.homeBtn}>
            <Text style={s.homeBtnText}>← MAIN MENU</Text>
          </TouchableOpacity>
        </View>

      </Animated.View>
      </ScrollView>

      {/* Banner ad — shown at bottom for free users only */}
      <AdBanner />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: C.BG },
  topLine:       { height: 2, position: 'absolute', top: 0, left: 0, right: 0 },
  bottomLine:    { height: 2, position: 'absolute', bottom: 0, left: 0, right: 0 },
  scrollContent: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 22 },
  content:       { width: '100%', alignItems: 'center' },

  resultBadge:   { width: 90, height: 90, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  resultEmoji:   { fontSize: 44 },
  resultText:    { fontSize: 36, fontWeight: '900', letterSpacing: 6, marginBottom: 6 },
  resultSub:     { fontFamily: FONT.MONO, fontSize: 10, color: C.TEXT_MUTED, letterSpacing: 2, marginBottom: 20 },

  intelBox:      { width: '100%', borderWidth: 1, borderColor: C.BORDER, backgroundColor: C.BG_CARD, marginBottom: 16 },
  intelHeader:   { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 8, borderBottomWidth: 1, borderBottomColor: C.BORDER },
  intelDot:      { width: 6, height: 6 },
  intelTitle:    { fontFamily: FONT.MONO, fontSize: 9, letterSpacing: 2 },
  intelBody:     { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  cmdEmoji:      { fontSize: 28 },
  cmdName:       { fontFamily: FONT.MONO, fontSize: 9, color: C.TEXT_MUTED, letterSpacing: 1, marginBottom: 4 },
  cmdReaction:   { fontSize: 12, color: C.TEXT_DIM, fontStyle: 'italic', lineHeight: 18 },

  debrief:       { width: '100%', marginBottom: 14 },
  debriefHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  sectionDot:    { width: 4, height: 4, backgroundColor: C.CYAN },
  debriefTitle:  { fontFamily: FONT.MONO, fontSize: 9, color: C.CYAN, letterSpacing: 2 },
  statsRow:      { flexDirection: 'row', gap: 8 },
  statCard:      { flex: 1, backgroundColor: C.BG_CARD, borderWidth: 1, borderColor: C.BORDER, padding: 12, alignItems: 'center' },
  statIcon:      { fontSize: 18, marginBottom: 5 },
  statValue:     { fontSize: 22, fontWeight: '900', color: C.CYAN, marginBottom: 3 },
  statLabel:     { fontFamily: FONT.MONO, fontSize: 8, color: C.TEXT_MUTED, letterSpacing: 1, textAlign: 'center' },

  rankBox:       { width: '100%', borderWidth: 1, padding: 14, alignItems: 'center', marginBottom: 20, backgroundColor: C.BG_CARD },
  rankStars:     { fontSize: 22, marginBottom: 3 },
  rankLabel:     { fontSize: 18, fontWeight: '900', letterSpacing: 4, marginBottom: 4 },
  rankSub:       { fontFamily: FONT.MONO, fontSize: 9, color: C.TEXT_MUTED, letterSpacing: 1 },

  xpBox:         { width: '100%', borderWidth: 1, borderColor: C.BORDER, backgroundColor: C.BG_CARD, padding: 12, marginBottom: 14 },
  xpHeader:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  xpTitle:       { fontFamily: FONT.MONO, fontSize: 9, color: C.CYAN, letterSpacing: 2 },
  xpRow:         { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cmdEmojiSmall: { fontSize: 22 },
  xpEarned:      { fontFamily: FONT.MONO, fontSize: 11, color: C.CYAN, fontWeight: '900' },
  xpLevel:       { fontFamily: FONT.MONO, fontSize: 10, color: C.TEXT_MUTED, letterSpacing: 1 },
  levelUp:       { fontFamily: FONT.MONO, fontSize: 10, color: '#FFB300', fontWeight: '900', letterSpacing: 1 },
  xpBarBg:       { height: 4, backgroundColor: C.BORDER, overflow: 'hidden' },
  xpBarFill:     { height: '100%', backgroundColor: C.CYAN },
  xpMax:         { fontFamily: FONT.MONO, fontSize: 9, color: '#FFB300', letterSpacing: 2, marginTop: 2 },

  btnGroup:      { width: '100%', gap: 10 },
  playAgainBtn:  { borderWidth: 1, padding: 18, alignItems: 'center', overflow: 'hidden', position: 'relative' },
  playAgainText: { fontSize: 15, fontWeight: '900', letterSpacing: 4 },
  replayBtn:     { borderWidth: 1, borderColor: C.BORDER, padding: 14, alignItems: 'center', width: '100%' },
  replayBtnText: { fontFamily: FONT.MONO, fontSize: 13, color: C.TEXT_DIM, letterSpacing: 2 },
  homeBtn:       { padding: 14, alignItems: 'center' },
  homeBtnText:   { fontFamily: FONT.MONO, fontSize: 12, color: C.TEXT_MUTED, letterSpacing: 2 },
});

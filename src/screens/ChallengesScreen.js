import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Animated, SafeAreaView, StatusBar, Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C, FONT } from '../theme';
import { getWeeklyChallengeStatus, claimChallengeReward } from '../services/challengeService';

export default function ChallengesScreen({ onBack }) {
  const [challenges, setChallenges] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const status = await getWeeklyChallengeStatus();
      setChallenges(status);
    } catch {}
    setLoading(false);
  };

  const handleClaim = async (challenge) => {
    if (!challenge.completed) {
      Alert.alert('Not Complete', `${challenge.progress}/${challenge.target} — keep playing!`);
      return;
    }
    if (challenge.claimed) {
      Alert.alert('Already Claimed', 'You already collected this reward.');
      return;
    }
    const result = await claimChallengeReward(challenge.id);
    if (!result) return;
    Alert.alert('Reward Claimed!', `+${result.bpXP} Battle Pass XP!`);
    load();
  };

  const daysLeft = challenges[0]?.daysLeft ?? 7;

  if (loading) {
    return (
      <SafeAreaView style={s.root}>
        <LinearGradient colors={['#06080E', '#09111D', '#06080E']} style={StyleSheet.absoluteFill} />
        <View style={s.loadingWrap}>
          <ActivityIndicator color={C.CYAN} size="large" />
          <Text style={s.loadingText}>LOADING MISSIONS...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#06080E', '#09111D', '#06080E']} style={StyleSheet.absoluteFill} />

      <Animated.View style={[s.inner, { opacity: fadeAnim }]}>
        <View style={s.header}>
          <TouchableOpacity onPress={onBack} activeOpacity={0.7}>
            <Text style={s.backText}>← BACK</Text>
          </TouchableOpacity>
          <View style={s.headerLine} />
          <Text style={s.headerTitle}>WEEKLY CHALLENGES</Text>
          <View style={s.headerLine} />
        </View>

        <View style={s.resetRow}>
          <View style={s.resetDot} />
          <Text style={s.resetText}>RESETS IN {daysLeft} DAY{daysLeft !== 1 ? 'S' : ''}</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
          {challenges.map(c => {
            const pct = Math.min(100, Math.round((c.progress / c.target) * 100));
            return (
              <View key={c.id} style={[s.card, c.claimed && { opacity: 0.55 }]}>
                {c.completed && !c.claimed && (
                  <LinearGradient
                    colors={['rgba(0,229,255,0.08)', 'transparent']}
                    style={StyleSheet.absoluteFill}
                  />
                )}
                <Text style={s.cardIcon}>{c.icon}</Text>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                    <Text style={s.cardLabel}>{c.label.toUpperCase()}</Text>
                    {c.claimed && <Text style={s.claimedBadge}>✓ DONE</Text>}
                  </View>
                  <View style={s.barBg}>
                    <View style={[s.barFill, { width: `${pct}%` }]} />
                  </View>
                  <Text style={s.progressText}>{c.progress} / {c.target}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleClaim(c)}
                  activeOpacity={0.8}
                  style={[
                    s.claimBtn,
                    c.completed && !c.claimed && s.claimBtnReady,
                    c.claimed && s.claimBtnDone,
                  ]}
                >
                  <Text style={[s.claimBtnText, c.completed && !c.claimed && { color: '#000' }]}>
                    {c.claimed ? '✓' : `+${c.bpXP} XP`}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}

          <View style={s.bpNote}>
            <Text style={s.bpNoteText}>
              Battle Pass XP counts toward your tier rewards. Complete challenges to earn bonuses each week.
            </Text>
          </View>

          <View style={{ height: 32 }} />
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: C.BG },
  inner:        { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
  loadingWrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  loadingText:  { fontFamily: FONT.MONO, fontSize: 11, color: C.TEXT_DIM, letterSpacing: 2 },

  header:       { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  backText:     { fontFamily: FONT.MONO, fontSize: 11, color: C.TEXT_DIM, letterSpacing: 1 },
  headerLine:   { flex: 1, height: 1, backgroundColor: C.BORDER_MED },
  headerTitle:  { fontFamily: FONT.MONO, fontSize: 11, color: C.CYAN, letterSpacing: 3 },

  resetRow:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  resetDot:     { width: 4, height: 4, backgroundColor: C.GREEN },
  resetText:    { fontFamily: FONT.MONO, fontSize: 9, color: C.GREEN, letterSpacing: 2 },

  card:         { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.BG_CARD, borderWidth: 1, borderColor: C.BORDER, padding: 14, marginBottom: 10, overflow: 'hidden', position: 'relative' },
  cardIcon:     { fontSize: 26, width: 32, textAlign: 'center' },
  cardLabel:    { fontSize: 12, fontWeight: '900', color: C.TEXT, letterSpacing: 1.5 },
  claimedBadge: { fontFamily: FONT.MONO, fontSize: 8, color: C.GREEN, letterSpacing: 1 },
  barBg:        { height: 4, backgroundColor: C.BORDER, overflow: 'hidden', marginBottom: 4 },
  barFill:      { height: '100%', backgroundColor: C.CYAN },
  progressText: { fontFamily: FONT.MONO, fontSize: 8, color: C.TEXT_MUTED, letterSpacing: 1 },

  claimBtn:     { borderWidth: 1, borderColor: C.BORDER, paddingHorizontal: 10, paddingVertical: 8, alignItems: 'center' },
  claimBtnReady:{ backgroundColor: C.CYAN, borderColor: C.CYAN },
  claimBtnDone: { backgroundColor: 'transparent', opacity: 0.4 },
  claimBtnText: { fontFamily: FONT.MONO, fontSize: 9, color: C.TEXT_DIM, letterSpacing: 1, fontWeight: '900' },

  bpNote:       { backgroundColor: 'rgba(0,229,255,0.05)', borderWidth: 1, borderColor: C.CYAN_BORDER, padding: 12, marginTop: 8 },
  bpNoteText:   { fontFamily: FONT.MONO, fontSize: 8, color: C.TEXT_MUTED, lineHeight: 14, letterSpacing: 0.5 },
});

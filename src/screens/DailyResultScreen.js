import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  Animated, Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { calculateStars } from '../utils/dailyChallenge';
import { C, FONT, GLOW } from '../theme';

const STAR_FILLED = '⭐';
const STAR_EMPTY  = '☆';

const getMsToMidnightUTC = () => {
  const now = new Date();
  const midnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  return midnight - now;
};

const formatCountdown = (ms) => {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

export default function DailyResultScreen({ shots, previousBest, isFirstAttempt = true, onHome }) {
  const stars     = calculateStars(shots);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const [countdown, setCountdown] = useState(getMsToMidnightUTC());
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, tension: 55, friction: 7, useNativeDriver: true }),
      Animated.timing(fadeAnim,  { toValue: 1, duration: 700, useNativeDriver: true }),
    ]).start();

    const timer = setInterval(() => setCountdown(getMsToMidnightUTC()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleShare = async () => {
    const starStr = Array.from({ length: 3 }, (_, i) => i < stars ? STAR_FILLED : STAR_EMPTY).join('');
    const text = `I found the Deep Strike fleet in ${shots} shots! ${starStr} #DeepStrike`;
    try {
      await Share.share({ message: text });
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const starDisplay = Array.from({ length: 3 }, (_, i) =>
    i < stars ? STAR_FILLED : STAR_EMPTY
  ).join('');

  return (
    <SafeAreaView style={s.root}>
      <LinearGradient colors={['#06080E', '#0A1A08', '#06080E']} style={StyleSheet.absoluteFill} />

      <View style={[s.topLine, { backgroundColor: C.AMBER }]} />

      <Animated.View style={[s.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>

        {/* Header */}
        <View style={s.headerRow}>
          <View style={s.headerLine} />
          <Text style={s.headerText}>📅  DAILY RESULT</Text>
          <View style={s.headerLine} />
        </View>

        {/* Stars */}
        <View style={s.starsBox}>
          <Text style={s.starsText}>{starDisplay}</Text>
          <Text style={s.shotsText}>{shots} SHOTS</Text>
          <Text style={s.shotsLabel}>TO FIND THE FLEET</Text>
        </View>

        {/* Personal best */}
        {!isFirstAttempt && previousBest != null && (
          <View style={s.bestBox}>
            <Text style={s.bestLabel}>PERSONAL BEST</Text>
            <Text style={s.bestShots}>{previousBest} shots</Text>
          </View>
        )}

        {/* Countdown */}
        <View style={s.countdownBox}>
          <Text style={s.countdownLabel}>NEXT CHALLENGE IN</Text>
          <Text style={s.countdownTime}>{formatCountdown(countdown)}</Text>
        </View>

        {/* Share */}
        <TouchableOpacity onPress={handleShare} activeOpacity={0.8} style={[s.shareBtn, GLOW.cyan]}>
          <LinearGradient colors={['rgba(0,229,255,0.18)', 'rgba(0,229,255,0.06)']} style={StyleSheet.absoluteFill} />
          <Text style={s.shareBtnText}>{copied ? '✓  SHARED!' : '📤  SHARE RESULT'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onHome} activeOpacity={0.7} style={s.homeBtn}>
          <Text style={s.homeBtnText}>← MAIN MENU</Text>
        </TouchableOpacity>

      </Animated.View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: C.BG, padding: 22, justifyContent: 'center' },
  topLine:       { height: 2, position: 'absolute', top: 0, left: 0, right: 0 },
  content:       { alignItems: 'center', gap: 16 },

  headerRow:     { flexDirection: 'row', alignItems: 'center', gap: 10, width: '100%' },
  headerLine:    { flex: 1, height: 1, backgroundColor: C.BORDER_MED },
  headerText:    { fontFamily: FONT.MONO, fontSize: 11, color: C.AMBER, letterSpacing: 3 },

  starsBox:      { alignItems: 'center', borderWidth: 1, borderColor: C.AMBER_BORDER, backgroundColor: 'rgba(255,179,0,0.07)', padding: 24, width: '100%' },
  starsText:     { fontSize: 40, letterSpacing: 6, marginBottom: 8 },
  shotsText:     { fontSize: 48, fontWeight: '900', color: C.AMBER, fontFamily: FONT.MONO },
  shotsLabel:    { fontFamily: FONT.MONO, fontSize: 9, color: C.TEXT_MUTED, letterSpacing: 2, marginTop: 4 },

  bestBox:       { borderWidth: 1, borderColor: C.BORDER, backgroundColor: C.BG_CARD, padding: 14, width: '100%', alignItems: 'center' },
  bestLabel:     { fontFamily: FONT.MONO, fontSize: 8, color: C.TEXT_MUTED, letterSpacing: 2, marginBottom: 4 },
  bestShots:     { fontFamily: FONT.MONO, fontSize: 16, color: C.CYAN, fontWeight: '900' },

  countdownBox:  { alignItems: 'center', width: '100%', borderWidth: 1, borderColor: C.BORDER, backgroundColor: C.BG_CARD, padding: 14 },
  countdownLabel:{ fontFamily: FONT.MONO, fontSize: 8, color: C.TEXT_MUTED, letterSpacing: 2, marginBottom: 6 },
  countdownTime: { fontFamily: FONT.MONO, fontSize: 28, fontWeight: '900', color: C.CYAN, letterSpacing: 4 },

  shareBtn:      { width: '100%', borderWidth: 1, borderColor: C.CYAN, padding: 16, alignItems: 'center', overflow: 'hidden', position: 'relative' },
  shareBtnText:  { fontSize: 14, fontWeight: '900', color: C.CYAN, letterSpacing: 3 },

  homeBtn:       { padding: 14, alignItems: 'center' },
  homeBtnText:   { fontFamily: FONT.MONO, fontSize: 12, color: C.TEXT_MUTED, letterSpacing: 2 },
});

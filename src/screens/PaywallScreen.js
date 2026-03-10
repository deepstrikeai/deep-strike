import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  ScrollView, Animated, Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { isPremiumUnlocked } from '../services/premiumService';
import { purchaseProduct, restoreIAPPurchases, fetchIAPProducts, PRODUCT_IDS } from '../services/iapService';
import { C, FONT, GLOW } from '../theme';

const FREE_FEATURES = [
  { icon: '🏴‍☠️', text: 'Captain Gruffbeard (Broadside ability)' },
  { icon: '🎯', text: 'Classic mode' },
  { icon: '⚔️', text: 'Single player vs AI' },
];

const PREMIUM_FEATURES = [
  { icon: '🤖', text: 'Commander Zero — Radar Ping' },
  { icon: '🎩', text: 'Admiral Blackwood — Full Broadside' },
  { icon: '🪸', text: 'Captain Coral — Depth Charge' },
  { icon: '🌟', text: 'Admiral Nova — Sonar Sweep' },
  { icon: '🐙', text: 'Captain Bubbles — Chaos Torpedo' },
  { icon: '🔥', text: 'Salvo mode' },
  { icon: '👥', text: 'Live 2-player multiplayer' },
  { icon: '📅', text: 'Daily challenges' },
  { icon: '🏆', text: 'Ranked ELO leaderboard' },
];

export default function PaywallScreen({ onUnlock, onBack }) {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [loading,      setLoading]      = useState(false);
  const [priceLabel,   setPriceLabel]   = useState('$2.99');
  const [restoring,    setRestoring]    = useState(false);

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.03, duration: 1400, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1,    duration: 1400, useNativeDriver: true }),
    ])).start();

    // Fetch real price from store
    fetchIAPProducts([PRODUCT_IDS.PREMIUM]).then(products => {
      const p = products.find(p => p.productId === PRODUCT_IDS.PREMIUM);
      if (p?.localizedPrice) setPriceLabel(p.localizedPrice);
    }).catch(() => {});
  }, []);

  const handleUnlock = async () => {
    setLoading(true);
    const result = await purchaseProduct(PRODUCT_IDS.PREMIUM);
    setLoading(false);
    if (result.success) {
      onUnlock();
    } else if (!result.cancelled) {
      Alert.alert('Purchase Failed', result.error || 'Something went wrong. Please try again.', [{ text: 'OK' }]);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    const { restoredProducts } = await restoreIAPPurchases();
    setRestoring(false);
    if (restoredProducts.includes(PRODUCT_IDS.PREMIUM)) {
      Alert.alert('Restored!', 'Your purchase has been restored.', [{ text: 'OK', onPress: onUnlock }]);
    } else {
      const alreadyPremium = await isPremiumUnlocked();
      if (alreadyPremium) { onUnlock(); return; }
      Alert.alert(
        'No Purchase Found',
        'No previous purchase was found for this Apple ID. If you purchased on a different account, sign in with that Apple ID and try again.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <SafeAreaView style={s.root}>
      <LinearGradient colors={['#06080E', '#09111D', '#06080E']} style={StyleSheet.absoluteFill} />

      <Animated.View style={[s.inner, { opacity: fadeAnim }]}>
        {/* Header */}
        <View style={s.header}>
          <View style={s.headerLine} />
          <Text style={s.headerText}>DEEP STRIKE COMMAND</Text>
          <View style={s.headerLine} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
          {/* Hero */}
          <View style={s.hero}>
            <Text style={s.heroIcon}>🎖</Text>
            <Text style={s.heroTitle}>UNLOCK FULL COMMAND</Text>
            <Text style={s.heroPrice}>{priceLabel}  ONE-TIME</Text>
            <Text style={s.heroSub}>No subscription. Own it forever.</Text>
          </View>

          {/* Free tier */}
          <View style={s.tierBox}>
            <View style={s.tierHeader}>
              <View style={[s.tierDot, { backgroundColor: C.TEXT_MUTED }]} />
              <Text style={s.tierLabel}>FREE</Text>
            </View>
            {FREE_FEATURES.map(f => (
              <View key={f.text} style={s.featureRow}>
                <Text style={s.featureIcon}>{f.icon}</Text>
                <Text style={s.featureText}>{f.text}</Text>
              </View>
            ))}
          </View>

          {/* Premium tier */}
          <View style={[s.tierBox, s.tierBoxPremium]}>
            <View style={s.tierHeader}>
              <View style={[s.tierDot, { backgroundColor: C.AMBER }]} />
              <Text style={[s.tierLabel, { color: C.AMBER }]}>DEEP STRIKE COMMAND</Text>
            </View>
            <Text style={s.tierSubtext}>Everything in Free, plus:</Text>
            {PREMIUM_FEATURES.map(f => (
              <View key={f.text} style={s.featureRow}>
                <Text style={s.featureIcon}>{f.icon}</Text>
                <Text style={[s.featureText, { color: C.TEXT }]}>{f.text}</Text>
              </View>
            ))}
          </View>

          {/* CTA */}
          <Animated.View style={[{ width: '100%', marginBottom: 12 }, { transform: [{ scale: pulseAnim }] }]}>
            <TouchableOpacity
              onPress={handleUnlock}
              disabled={loading}
              activeOpacity={0.85}
              style={[s.unlockBtn, GLOW.cyan]}
            >
              <LinearGradient colors={['rgba(0,229,255,0.22)', 'rgba(0,229,255,0.08)']} style={StyleSheet.absoluteFill} />
              {loading
                ? <ActivityIndicator color={C.CYAN} />
                : <Text style={s.unlockBtnText}>UNLOCK — {priceLabel}</Text>}
            </TouchableOpacity>
          </Animated.View>

          <Text style={s.disclaimer}>One-time purchase. No subscription. Synced to your Apple ID / Google account.</Text>

          <TouchableOpacity onPress={handleRestore} disabled={restoring} activeOpacity={0.7} style={s.restoreBtn}>
            {restoring
              ? <ActivityIndicator color={C.TEXT_DIM} size="small" />
              : <Text style={s.restoreBtnText}>RESTORE PURCHASES</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={onBack} style={s.backBtn} activeOpacity={0.7}>
            <Text style={s.backBtnText}>← BACK</Text>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: C.BG },
  inner:        { flex: 1, paddingHorizontal: 16, paddingTop: 12 },

  header:       { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  headerLine:   { flex: 1, height: 1, backgroundColor: C.BORDER_MED },
  headerText:   { fontFamily: FONT.MONO, fontSize: 11, color: C.AMBER, letterSpacing: 3 },

  hero:         { alignItems: 'center', marginBottom: 20, gap: 4 },
  heroIcon:     { fontSize: 48, marginBottom: 4 },
  heroTitle:    { fontSize: 22, fontWeight: '900', color: C.TEXT, letterSpacing: 4 },
  heroPrice:    { fontFamily: FONT.MONO, fontSize: 20, color: C.AMBER, fontWeight: '900', letterSpacing: 2, marginTop: 6 },
  heroSub:      { fontFamily: FONT.MONO, fontSize: 9, color: C.TEXT_MUTED, letterSpacing: 1 },

  tierBox:      { borderWidth: 1, borderColor: C.BORDER, backgroundColor: C.BG_CARD, padding: 14, marginBottom: 12 },
  tierBoxPremium:{ borderColor: C.AMBER_BORDER, backgroundColor: 'rgba(255,179,0,0.05)' },
  tierHeader:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  tierDot:      { width: 6, height: 6 },
  tierLabel:    { fontFamily: FONT.MONO, fontSize: 10, color: C.TEXT_DIM, letterSpacing: 2, fontWeight: '900' },
  tierSubtext:  { fontFamily: FONT.MONO, fontSize: 9, color: C.TEXT_MUTED, letterSpacing: 1, marginBottom: 8 },

  featureRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 5 },
  featureIcon:  { fontSize: 16, width: 24 },
  featureText:  { fontFamily: FONT.MONO, fontSize: 10, color: C.TEXT_DIM, flex: 1 },

  unlockBtn:    { borderWidth: 1, borderColor: C.CYAN, padding: 18, alignItems: 'center', overflow: 'hidden', position: 'relative' },
  unlockBtnText:{ fontSize: 18, fontWeight: '900', color: C.CYAN, letterSpacing: 4 },

  disclaimer:   { fontFamily: FONT.MONO, fontSize: 9, color: C.TEXT_MUTED, textAlign: 'center', letterSpacing: 1, marginBottom: 14 },

  restoreBtn:   { padding: 12, alignItems: 'center', marginBottom: 4 },
  restoreBtnText:{ fontFamily: FONT.MONO, fontSize: 10, color: C.TEXT_DIM, letterSpacing: 2, textDecorationLine: 'underline' },

  backBtn:      { padding: 16, alignItems: 'center', marginBottom: 20 },
  backBtnText:  { fontFamily: FONT.MONO, fontSize: 12, color: C.TEXT_DIM, letterSpacing: 2 },
});

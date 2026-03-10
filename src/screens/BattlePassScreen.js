import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Animated, SafeAreaView, StatusBar, Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C, FONT, GLOW } from '../theme';
import { CURRENT_SEASON, SEASON_TIERS } from '../constants/battlePass';
import { getBattlePassStatus, claimReward } from '../services/battlePassService';
import { purchaseProduct, PRODUCT_IDS } from '../services/iapService';
import { getAllCommandersStatus } from '../services/commanderService';

const TRACK_COLORS = {
  free:    { border: C.BORDER,       text: C.TEXT_DIM,  bg: C.BG_CARD },
  premium: { border: C.AMBER_BORDER, text: C.AMBER,     bg: 'rgba(255,179,0,0.06)' },
};

export default function BattlePassScreen({ onBack, isPremium }) {
  const [status,     setStatus]     = useState(null);
  const [commanders, setCommanders] = useState([]);
  const [pickerFor,  setPickerFor]  = useState(null); // { tier, track } for shard/xp reward
  const [loading,    setLoading]    = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    refresh();
  }, []);

  const refresh = async () => {
    setLoading(true);
    try {
      const [s, cmds] = await Promise.all([getBattlePassStatus(), getAllCommandersStatus()]);
      setStatus(s);
      setCommanders(cmds);
    } catch {}
    setLoading(false);
  };

  const handleClaim = async (tier, track) => {
    const tierData = SEASON_TIERS.find(t => t.tier === tier)?.[track];
    if (!tierData) return;
    if (track === 'premium' && !status?.passUnlocked) {
      Alert.alert('Premium Pass Required', 'Unlock the premium pass to claim premium rewards.');
      return;
    }
    if (tier > (status?.currentTier || 0)) {
      Alert.alert('Not Reached Yet', 'Keep playing to reach this tier!');
      return;
    }
    if (tierData.type === 'shards' || tierData.type === 'xp_boost') {
      // Need a commander for shard/xp rewards
      const locked = commanders.filter(c => !c.owned);
      if (locked.length > 0) {
        setPickerFor({ tier, track });
        return;
      }
      // All owned — just claim with first commander
      await finalizeClaim(tier, track, commanders[0]?.id || null);
    } else {
      await finalizeClaim(tier, track, null);
    }
  };

  const finalizeClaim = async (tier, track, commanderId) => {
    setPickerFor(null);
    const result = await claimReward(tier, track, commanderId);
    if (!result) return;
    if (result.alreadyClaimed) {
      Alert.alert('Already Claimed', 'You already collected this reward.');
    } else {
      Alert.alert('Reward Claimed!', `${result.reward.icon} ${result.reward.label} added!`);
    }
    refresh();
  };

  const handleUnlockPass = async () => {
    const result = await purchaseProduct(PRODUCT_IDS.BATTLE_PASS);
    if (result.success) {
      refresh();
      Alert.alert('Pass Unlocked!', 'You now have access to all premium rewards this season!');
    } else if (!result.cancelled) {
      Alert.alert('Purchase Failed', result.error || 'Please try again.', [{ text: 'OK' }]);
    }
  };

  if (!status) return null;
  const { currentTier, progress, claimed, passUnlocked, daysLeft } = status;

  // Commander picker modal
  if (pickerFor) {
    const locked = commanders.filter(c => !c.owned);
    return (
      <SafeAreaView style={s.root}>
        <LinearGradient colors={['#06080E', '#09111D', '#06080E']} style={StyleSheet.absoluteFill} />
        <View style={s.pickerWrap}>
          <Text style={s.pickerTitle}>SEND REWARD TO</Text>
          <Text style={s.pickerSub}>Choose a commander to receive this reward</Text>
          {commanders.map(cmd => (
            <TouchableOpacity
              key={cmd.id}
              onPress={() => finalizeClaim(pickerFor.tier, pickerFor.track, cmd.id)}
              activeOpacity={0.8}
              style={s.pickerRow}
            >
              <Text style={s.pickerEmoji}>{cmd.emoji}</Text>
              <Text style={s.pickerName}>{cmd.name.toUpperCase()}</Text>
              {!cmd.owned && <Text style={s.pickerShardsLabel}>{cmd.shards}/50 shards</Text>}
            </TouchableOpacity>
          ))}
          <TouchableOpacity onPress={() => setPickerFor(null)} style={s.pickerCancel}>
            <Text style={s.pickerCancelText}>CANCEL</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={s.root}>
        <LinearGradient colors={['#06080E', '#09111D', '#06080E']} style={StyleSheet.absoluteFill} />
        <View style={s.loadingWrap}>
          <ActivityIndicator color={C.AMBER} size="large" />
          <Text style={s.loadingText}>LOADING BATTLE PASS...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#06080E', '#09111D', '#06080E']} style={StyleSheet.absoluteFill} />

      <Animated.View style={[s.inner, { opacity: fadeAnim }]}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={onBack} activeOpacity={0.7}>
            <Text style={s.backText}>← BACK</Text>
          </TouchableOpacity>
          <View style={s.headerLine} />
          <Text style={s.headerTitle}>BATTLE PASS</Text>
          <View style={s.headerLine} />
        </View>

        {/* Season card */}
        <View style={s.seasonCard}>
          <LinearGradient colors={['rgba(255,179,0,0.15)', 'rgba(255,179,0,0.04)']} style={StyleSheet.absoluteFill} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Text style={s.seasonIcon}>{CURRENT_SEASON.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.seasonSub}>{CURRENT_SEASON.subtitle}</Text>
              <Text style={s.seasonName}>{CURRENT_SEASON.name}</Text>
              <Text style={s.seasonDays}>{daysLeft} DAYS REMAINING</Text>
            </View>
            <View style={s.tierBadge}>
              <Text style={s.tierBadgeLabel}>TIER</Text>
              <Text style={s.tierBadgeNum}>{currentTier}</Text>
            </View>
          </View>
          {/* XP bar */}
          <View style={s.xpSection}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={s.xpLabel}>TIER {currentTier} → {currentTier + 1}</Text>
              <Text style={s.xpLabel}>{progress.current}/{progress.total} XP</Text>
            </View>
            <View style={s.xpBarBg}>
              <View style={[s.xpBarFill, { width: `${Math.round(progress.pct * 100)}%` }]} />
            </View>
          </View>
        </View>

        {/* Premium unlock */}
        {!passUnlocked && (
          <TouchableOpacity onPress={handleUnlockPass} activeOpacity={0.85} style={s.unlockCard}>
            <LinearGradient colors={['rgba(255,179,0,0.2)', 'rgba(255,179,0,0.06)']} style={StyleSheet.absoluteFill} />
            <Text style={s.unlockIcon}>👑</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.unlockTitle}>UNLOCK PREMIUM PASS</Text>
              <Text style={s.unlockSub}>Access all premium tier rewards this season</Text>
            </View>
            <Text style={s.unlockPrice}>$4.99</Text>
          </TouchableOpacity>
        )}

        {/* Tier labels */}
        <View style={s.trackLabels}>
          <View style={{ width: 40 }} />
          <View style={[s.trackLabelBox, { flex: 1 }]}>
            <Text style={s.trackLabelText}>FREE</Text>
          </View>
          <View style={[s.trackLabelBox, { flex: 1, borderColor: C.AMBER_BORDER, backgroundColor: 'rgba(255,179,0,0.08)' }]}>
            <Text style={[s.trackLabelText, { color: C.AMBER }]}>PREMIUM {passUnlocked ? '✓' : '🔒'}</Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
          {SEASON_TIERS.map(tierData => {
            const reached  = currentTier >= tierData.tier;
            const freeClaimed    = !!claimed[`${tierData.tier}_free`];
            const premClaimed    = !!claimed[`${tierData.tier}_premium`];
            return (
              <View key={tierData.tier} style={[s.tierRow, !reached && { opacity: 0.45 }]}>
                <View style={s.tierNumBox}>
                  <Text style={[s.tierNum, reached && { color: C.CYAN }]}>{tierData.tier}</Text>
                </View>

                {/* Free reward */}
                <TouchableOpacity
                  onPress={() => handleClaim(tierData.tier, 'free')}
                  disabled={freeClaimed || !reached}
                  activeOpacity={0.8}
                  style={[
                    s.rewardCard,
                    freeClaimed && s.rewardClaimed,
                    reached && !freeClaimed && s.rewardReady,
                  ]}
                >
                  <Text style={s.rewardIcon}>{freeClaimed ? '✓' : tierData.free.icon}</Text>
                  <Text style={[s.rewardLabel, freeClaimed && { color: C.TEXT_MUTED }]} numberOfLines={2}>
                    {tierData.free.label}
                  </Text>
                </TouchableOpacity>

                {/* Premium reward */}
                <TouchableOpacity
                  onPress={() => handleClaim(tierData.tier, 'premium')}
                  disabled={premClaimed || !reached || !passUnlocked}
                  activeOpacity={0.8}
                  style={[
                    s.rewardCard,
                    s.rewardPremium,
                    premClaimed && s.rewardClaimed,
                    reached && passUnlocked && !premClaimed && s.rewardPremiumReady,
                  ]}
                >
                  <Text style={s.rewardIcon}>{premClaimed ? '✓' : tierData.premium.icon}</Text>
                  <Text style={[s.rewardLabel, { color: premClaimed ? C.TEXT_MUTED : C.AMBER }]} numberOfLines={2}>
                    {tierData.premium.label}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
          <View style={{ height: 32 }} />
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:            { flex: 1, backgroundColor: C.BG },
  inner:           { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
  loadingWrap:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  loadingText:     { fontFamily: FONT.MONO, fontSize: 11, color: C.TEXT_DIM, letterSpacing: 2 },

  header:          { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  backText:        { fontFamily: FONT.MONO, fontSize: 11, color: C.TEXT_DIM, letterSpacing: 1 },
  headerLine:      { flex: 1, height: 1, backgroundColor: C.BORDER_MED },
  headerTitle:     { fontFamily: FONT.MONO, fontSize: 11, color: C.CYAN, letterSpacing: 3 },

  seasonCard:      { borderWidth: 1, borderColor: C.AMBER_BORDER, backgroundColor: C.BG_CARD, padding: 14, marginBottom: 12, overflow: 'hidden', position: 'relative' },
  seasonIcon:      { fontSize: 32 },
  seasonSub:       { fontFamily: FONT.MONO, fontSize: 8, color: C.AMBER, letterSpacing: 2 },
  seasonName:      { fontFamily: FONT.MONO, fontSize: 13, fontWeight: '900', color: C.TEXT, letterSpacing: 1.5, marginBottom: 2 },
  seasonDays:      { fontFamily: FONT.MONO, fontSize: 8, color: C.TEXT_MUTED, letterSpacing: 1 },
  tierBadge:       { alignItems: 'center', borderWidth: 1, borderColor: C.CYAN, backgroundColor: C.CYAN_DIM, paddingHorizontal: 10, paddingVertical: 4 },
  tierBadgeLabel:  { fontFamily: FONT.MONO, fontSize: 7, color: C.CYAN, letterSpacing: 1 },
  tierBadgeNum:    { fontFamily: FONT.MONO, fontSize: 22, fontWeight: '900', color: C.CYAN },
  xpSection:       { marginTop: 12 },
  xpLabel:         { fontFamily: FONT.MONO, fontSize: 8, color: C.TEXT_MUTED, letterSpacing: 1 },
  xpBarBg:         { height: 4, backgroundColor: C.BORDER, overflow: 'hidden' },
  xpBarFill:       { height: '100%', backgroundColor: C.AMBER },

  unlockCard:      { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: C.AMBER_BORDER, padding: 12, marginBottom: 12, overflow: 'hidden', position: 'relative' },
  unlockIcon:      { fontSize: 24 },
  unlockTitle:     { fontFamily: FONT.MONO, fontSize: 11, fontWeight: '900', color: C.AMBER, letterSpacing: 1, marginBottom: 2 },
  unlockSub:       { fontFamily: FONT.MONO, fontSize: 8, color: C.TEXT_MUTED },
  unlockPrice:     { fontFamily: FONT.MONO, fontSize: 16, fontWeight: '900', color: C.AMBER },

  trackLabels:     { flexDirection: 'row', gap: 4, marginBottom: 6 },
  trackLabelBox:   { borderWidth: 1, borderColor: C.BORDER, backgroundColor: C.BG_CARD, padding: 6, alignItems: 'center' },
  trackLabelText:  { fontFamily: FONT.MONO, fontSize: 8, color: C.TEXT_DIM, letterSpacing: 2 },

  tierRow:         { flexDirection: 'row', gap: 4, marginBottom: 4, alignItems: 'stretch' },
  tierNumBox:      { width: 40, backgroundColor: C.BG_CARD, borderWidth: 1, borderColor: C.BORDER, alignItems: 'center', justifyContent: 'center' },
  tierNum:         { fontFamily: FONT.MONO, fontSize: 12, fontWeight: '900', color: C.TEXT_MUTED },
  rewardCard:      { flex: 1, backgroundColor: C.BG_CARD, borderWidth: 1, borderColor: C.BORDER, padding: 8, alignItems: 'center', gap: 3, minHeight: 56 },
  rewardClaimed:   { opacity: 0.5 },
  rewardReady:     { borderColor: C.CYAN_BORDER, backgroundColor: 'rgba(0,229,255,0.04)' },
  rewardPremium:   { borderColor: C.AMBER_BORDER, backgroundColor: 'rgba(255,179,0,0.04)' },
  rewardPremiumReady: { backgroundColor: 'rgba(255,179,0,0.1)' },
  rewardIcon:      { fontSize: 16 },
  rewardLabel:     { fontFamily: FONT.MONO, fontSize: 7, color: C.TEXT_DIM, letterSpacing: 0.5, textAlign: 'center' },

  pickerWrap:      { flex: 1, padding: 24, justifyContent: 'center' },
  pickerTitle:     { fontFamily: FONT.MONO, fontSize: 12, color: C.CYAN, letterSpacing: 3, textAlign: 'center', marginBottom: 6 },
  pickerSub:       { fontFamily: FONT.MONO, fontSize: 9, color: C.TEXT_MUTED, textAlign: 'center', marginBottom: 20 },
  pickerRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.BG_CARD, borderWidth: 1, borderColor: C.BORDER, padding: 14, marginBottom: 8 },
  pickerEmoji:     { fontSize: 24 },
  pickerName:      { flex: 1, fontSize: 13, fontWeight: '900', color: C.TEXT, letterSpacing: 1.5 },
  pickerShardsLabel: { fontFamily: FONT.MONO, fontSize: 9, color: C.TEXT_MUTED },
  pickerCancel:    { padding: 16, alignItems: 'center', marginTop: 8 },
  pickerCancelText:{ fontFamily: FONT.MONO, fontSize: 11, color: C.TEXT_MUTED, letterSpacing: 2 },
});

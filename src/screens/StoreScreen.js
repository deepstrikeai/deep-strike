import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Animated, SafeAreaView, StatusBar, Alert, Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C, FONT, GLOW } from '../theme';
import { RARITY_COLORS } from '../constants/gameConstants';
import { getAllCommandersStatus, XP_PER_LEVEL } from '../services/commanderService';
import { SHARD_PACKS, purchaseShardPack, claimDailyFreeShards, hasDailyFreeBeenClaimed, fetchShardPackPrices } from '../services/storeService';
import { setPremiumUnlocked } from '../services/premiumService';

const SHARDS_TO_UNLOCK = 50;

export default function StoreScreen({ onBack, onPaywall, isPremium }) {
  const [commanders, setCommanders] = useState([]);
  const [dailyClaimed, setDailyClaimed] = useState(false);
  const [selectedPack, setSelectedPack] = useState(null); // for shard pack modal
  const [purchasing, setPurchasing] = useState(false);
  const [pricesLoaded, setPricesLoaded] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    refresh();
    fetchShardPackPrices().then(() => setPricesLoaded(true)).catch(() => {});
  }, []);

  const refresh = async () => {
    const [status, claimed] = await Promise.all([
      getAllCommandersStatus(),
      hasDailyFreeBeenClaimed(),
    ]);
    setCommanders(status);
    setDailyClaimed(claimed);
  };

  const handleDailyFree = async (commanderId) => {
    setLoading(true);
    const result = await claimDailyFreeShards(commanderId);
    setLoading(false);
    if (result.alreadyClaimed) {
      Alert.alert('Already Claimed', 'Come back tomorrow for more free shards!');
      return;
    }
    if (result.unlocked) {
      Alert.alert('Commander Unlocked!', `You collected enough shards to unlock this commander!`);
    } else {
      Alert.alert('Shards Claimed!', `+5 shards added. ${SHARDS_TO_UNLOCK - result.shards} more needed to unlock.`);
    }
    refresh();
  };

  const handlePackPurchase = async (commanderId) => {
    if (!selectedPack) return;
    setPurchasing(true);
    const result = await purchaseShardPack(selectedPack.id, commanderId);
    setPurchasing(false);
    setSelectedPack(null);
    if (!result) return;
    if (result.unlocked) {
      Alert.alert('Commander Unlocked!', `You collected enough shards!`);
    } else {
      Alert.alert('Shards Added!', `+${selectedPack.shards} shards added. ${Math.max(0, SHARDS_TO_UNLOCK - result.shards)} more needed.`);
    }
    refresh();
  };

  const lockedCommanders = commanders.filter(c => !c.owned && !c.inRotation);

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#06080E', '#09111D', '#06080E']} style={StyleSheet.absoluteFill} />

      <Animated.View style={[s.inner, { opacity: fadeAnim }]}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={onBack} style={s.backBtn} activeOpacity={0.7}>
            <Text style={s.backText}>← BACK</Text>
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <View style={s.headerLine} />
            <Text style={s.headerText}>ARMORY</Text>
            <View style={s.headerLine} />
          </View>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>

          {/* Premium card */}
          {!isPremium && (
            <TouchableOpacity onPress={onPaywall} activeOpacity={0.85} style={s.premiumCard}>
              <LinearGradient colors={['rgba(255,179,0,0.18)', 'rgba(255,179,0,0.06)']} style={StyleSheet.absoluteFill} />
              <View style={s.premiumRow}>
                <Text style={s.premiumIcon}>👑</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.premiumTitle}>DEEP STRIKE COMMAND</Text>
                  <Text style={s.premiumSub}>All 6 commanders · Salvo · Multiplayer · Daily Challenges</Text>
                </View>
                <Text style={s.premiumPrice}>$2.99</Text>
              </View>
              <Text style={s.premiumCta}>UNLOCK ALL →</Text>
            </TouchableOpacity>
          )}

          {/* Shard packs */}
          <View style={s.section}>
            <View style={s.sectionLabel}>
              <View style={s.sectionDot} />
              <Text style={s.sectionText}>SHARD PACKS</Text>
            </View>
            <Text style={s.sectionSub}>Select a pack, then choose a commander to receive the shards</Text>
            <View style={s.packRow}>
              {SHARD_PACKS.map(pack => (
                <TouchableOpacity
                  key={pack.id}
                  onPress={() => setSelectedPack(selectedPack?.id === pack.id ? null : pack)}
                  activeOpacity={0.8}
                  style={[
                    s.packCard,
                    pack.highlight && s.packCardHighlight,
                    selectedPack?.id === pack.id && s.packCardSelected,
                  ]}
                >
                  {pack.highlight && (
                    <View style={s.packBestBadge}>
                      <Text style={s.packBestText}>BEST VALUE</Text>
                    </View>
                  )}
                  <Text style={s.packIcon}>{pack.icon}</Text>
                  <Text style={[s.packShards, selectedPack?.id === pack.id && { color: C.CYAN }]}>
                    {pack.shards}
                  </Text>
                  <Text style={s.packShardsLabel}>SHARDS</Text>
                  <Text style={s.packName}>{pack.name}</Text>
                  <Text style={[s.packPrice, selectedPack?.id === pack.id && { color: C.CYAN }]}>
                    {pack.price}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {selectedPack && (
              <Text style={s.packHint}>Now tap a commander below to send them {selectedPack.shards} shards</Text>
            )}
          </View>

          {/* Commander shard progress */}
          {lockedCommanders.length > 0 && (
            <View style={s.section}>
              <View style={s.sectionLabel}>
                <View style={s.sectionDot} />
                <Text style={s.sectionText}>LOCKED COMMANDERS</Text>
              </View>
              {lockedCommanders.map(cmd => {
                const pct = Math.min(100, Math.round((cmd.shards / SHARDS_TO_UNLOCK) * 100));
                return (
                  <TouchableOpacity
                    key={cmd.id}
                    onPress={() => selectedPack ? handlePackPurchase(cmd.id) : null}
                    activeOpacity={selectedPack ? 0.8 : 1}
                    style={[s.cmdCard, selectedPack && s.cmdCardSelectable]}
                  >
                    {selectedPack && (
                      <LinearGradient
                        colors={['rgba(0,229,255,0.08)', 'transparent']}
                        style={StyleSheet.absoluteFill}
                      />
                    )}
                    <View style={[s.cmdAccent, { backgroundColor: cmd.color }]} />
                    <View style={[s.cmdEmoji, { backgroundColor: cmd.color + '22' }]}>
                      <Text style={s.cmdEmojiText}>{cmd.emoji}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <Text style={s.cmdName}>{cmd.name.toUpperCase()}</Text>
                        {cmd.rarity && (
                          <View style={[s.rarityBadge, { borderColor: RARITY_COLORS[cmd.rarity] }]}>
                            <Text style={[s.rarityText, { color: RARITY_COLORS[cmd.rarity] }]}>
                              {cmd.rarity.toUpperCase()}
                            </Text>
                          </View>
                        )}
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={s.shardBarBg}>
                          <View style={[s.shardBarFill, { width: `${pct}%`, backgroundColor: cmd.color }]} />
                        </View>
                        <Text style={s.shardCount}>{cmd.shards}/{SHARDS_TO_UNLOCK}</Text>
                      </View>
                    </View>
                    {selectedPack && (
                      <View style={s.sendBadge}>
                        <Text style={s.sendText}>+{selectedPack.shards}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Rotation commanders (reminder) */}
          {commanders.filter(c => c.inRotation && !c.owned).length > 0 && (
            <View style={s.section}>
              <View style={s.sectionLabel}>
                <View style={[s.sectionDot, { backgroundColor: C.CYAN }]} />
                <Text style={s.sectionText}>FREE THIS WEEK</Text>
              </View>
              {commanders.filter(c => c.inRotation && !c.owned).map(cmd => (
                <View key={cmd.id} style={[s.cmdCard, { opacity: 0.7 }]}>
                  <View style={[s.cmdAccent, { backgroundColor: cmd.color }]} />
                  <View style={[s.cmdEmoji, { backgroundColor: cmd.color + '22' }]}>
                    <Text style={s.cmdEmojiText}>{cmd.emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.cmdName}>{cmd.name.toUpperCase()}</Text>
                    <Text style={s.rotationNote}>🔄 Available free until Sunday</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Daily free */}
          <View style={[s.section, { marginBottom: 32 }]}>
            <View style={s.sectionLabel}>
              <View style={[s.sectionDot, { backgroundColor: C.GREEN }]} />
              <Text style={s.sectionText}>DAILY FREE</Text>
            </View>
            <View style={s.dailyCard}>
              <View style={s.dailyLeft}>
                <Text style={s.dailyIcon}>🎁</Text>
                <View>
                  <Text style={s.dailyTitle}>5 FREE SHARDS</Text>
                  <Text style={s.dailySub}>Claim once per day. Pick any locked commander.</Text>
                </View>
              </View>
              {lockedCommanders.length === 0 ? (
                <Text style={s.dailyAllUnlocked}>ALL UNLOCKED</Text>
              ) : dailyClaimed ? (
                <Text style={s.dailyClaimed}>CLAIMED ✓</Text>
              ) : (
                <View style={s.dailyBtnGroup}>
                  {lockedCommanders.slice(0, 3).map(cmd => (
                    <TouchableOpacity
                      key={cmd.id}
                      onPress={() => handleDailyFree(cmd.id)}
                      disabled={loading}
                      activeOpacity={0.8}
                      style={[s.dailyBtn, { borderColor: cmd.color }]}
                    >
                      <Text style={s.dailyBtnEmoji}>{cmd.emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>

        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:            { flex: 1, backgroundColor: C.BG },
  inner:           { flex: 1, paddingHorizontal: 16, paddingTop: 12 },

  header:          { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  backBtn:         { width: 60 },
  backText:        { fontFamily: FONT.MONO, fontSize: 11, color: C.TEXT_DIM, letterSpacing: 1 },
  headerCenter:    { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerLine:      { flex: 1, height: 1, backgroundColor: C.BORDER_MED },
  headerText:      { fontFamily: FONT.MONO, fontSize: 11, color: C.CYAN, letterSpacing: 3 },

  premiumCard:     { borderWidth: 1, borderColor: C.AMBER_BORDER, backgroundColor: C.BG_CARD, padding: 14, marginBottom: 20, overflow: 'hidden', position: 'relative' },
  premiumRow:      { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  premiumIcon:     { fontSize: 24 },
  premiumTitle:    { fontFamily: FONT.MONO, fontSize: 11, fontWeight: '900', color: C.AMBER, letterSpacing: 2, marginBottom: 3 },
  premiumSub:      { fontFamily: FONT.MONO, fontSize: 8, color: C.TEXT_MUTED, letterSpacing: 0.5 },
  premiumPrice:    { fontFamily: FONT.MONO, fontSize: 18, fontWeight: '900', color: C.AMBER },
  premiumCta:      { fontFamily: FONT.MONO, fontSize: 10, color: C.AMBER, letterSpacing: 3, textAlign: 'right' },

  section:         { marginBottom: 20 },
  sectionLabel:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  sectionDot:      { width: 4, height: 4, backgroundColor: C.AMBER },
  sectionText:     { fontFamily: FONT.MONO, fontSize: 10, color: C.AMBER, letterSpacing: 2 },
  sectionSub:      { fontFamily: FONT.MONO, fontSize: 8, color: C.TEXT_MUTED, letterSpacing: 0.5, marginBottom: 10 },

  packRow:         { flexDirection: 'row', gap: 8 },
  packCard:        { flex: 1, backgroundColor: C.BG_CARD, borderWidth: 1, borderColor: C.BORDER, padding: 12, alignItems: 'center', position: 'relative' },
  packCardHighlight: { borderColor: C.AMBER_BORDER },
  packCardSelected:{ borderColor: C.CYAN, ...GLOW.cyan },
  packBestBadge:   { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: C.AMBER_DIM, alignItems: 'center', paddingVertical: 2 },
  packBestText:    { fontFamily: FONT.MONO, fontSize: 7, color: C.AMBER, letterSpacing: 1 },
  packIcon:        { fontSize: 22, marginBottom: 4, marginTop: 10 },
  packShards:      { fontSize: 22, fontWeight: '900', color: C.TEXT },
  packShardsLabel: { fontFamily: FONT.MONO, fontSize: 8, color: C.TEXT_MUTED, letterSpacing: 1, marginBottom: 4 },
  packName:        { fontFamily: FONT.MONO, fontSize: 8, color: C.TEXT_DIM, letterSpacing: 1, textAlign: 'center', marginBottom: 6 },
  packPrice:       { fontFamily: FONT.MONO, fontSize: 12, fontWeight: '900', color: C.AMBER },
  packHint:        { fontFamily: FONT.MONO, fontSize: 9, color: C.CYAN, letterSpacing: 1, textAlign: 'center', marginTop: 8 },

  cmdCard:         { flexDirection: 'row', alignItems: 'center', backgroundColor: C.BG_CARD, borderWidth: 1, borderColor: C.BORDER, marginBottom: 8, overflow: 'hidden', position: 'relative' },
  cmdCardSelectable: { borderColor: C.CYAN_BORDER },
  cmdAccent:       { width: 3, alignSelf: 'stretch' },
  cmdEmoji:        { width: 52, alignItems: 'center', justifyContent: 'center', paddingVertical: 14 },
  cmdEmojiText:    { fontSize: 26 },
  cmdName:         { fontSize: 11, fontWeight: '900', color: C.TEXT, letterSpacing: 1.5 },
  rarityBadge:     { borderWidth: 1, paddingHorizontal: 4, paddingVertical: 1 },
  rarityText:      { fontFamily: FONT.MONO, fontSize: 7, letterSpacing: 1 },
  shardBarBg:      { flex: 1, height: 4, backgroundColor: C.BORDER, overflow: 'hidden' },
  shardBarFill:    { height: '100%' },
  shardCount:      { fontFamily: FONT.MONO, fontSize: 9, color: C.TEXT_MUTED, letterSpacing: 1 },
  sendBadge:       { marginRight: 12, backgroundColor: C.CYAN_DIM, borderWidth: 1, borderColor: C.CYAN, paddingHorizontal: 8, paddingVertical: 4 },
  sendText:        { fontFamily: FONT.MONO, fontSize: 10, color: C.CYAN, fontWeight: '900' },
  rotationNote:    { fontFamily: FONT.MONO, fontSize: 8, color: C.CYAN, letterSpacing: 1, marginTop: 2 },

  dailyCard:       { flexDirection: 'row', alignItems: 'center', backgroundColor: C.BG_CARD, borderWidth: 1, borderColor: C.GREEN_BORDER, padding: 14, gap: 12 },
  dailyLeft:       { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  dailyIcon:       { fontSize: 26 },
  dailyTitle:      { fontFamily: FONT.MONO, fontSize: 11, fontWeight: '900', color: C.GREEN, letterSpacing: 2, marginBottom: 3 },
  dailySub:        { fontFamily: FONT.MONO, fontSize: 8, color: C.TEXT_MUTED },
  dailyClaimed:    { fontFamily: FONT.MONO, fontSize: 9, color: C.GREEN, letterSpacing: 1 },
  dailyAllUnlocked:{ fontFamily: FONT.MONO, fontSize: 9, color: C.CYAN, letterSpacing: 1 },
  dailyBtnGroup:   { flexDirection: 'row', gap: 6 },
  dailyBtn:        { width: 36, height: 36, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  dailyBtnEmoji:   { fontSize: 18 },
});

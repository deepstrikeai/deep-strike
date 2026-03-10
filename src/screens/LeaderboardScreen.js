import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  FlatList, ActivityIndicator, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { fetchLeaderboard } from '../services/eloService';
import { C, FONT } from '../theme';

const RANK_ICONS = ['🥇', '🥈', '🥉'];

export default function LeaderboardScreen({ myPlayerId, onBack }) {
  const [entries,     setEntries]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const data = await fetchLeaderboard(20);
      setEntries(data);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, []);

  const renderItem = ({ item }) => {
    const isMe = item.playerId === myPlayerId;
    const rankIcon = item.rank <= 3 ? RANK_ICONS[item.rank - 1] : null;
    const wl = item.wins + item.losses > 0
      ? `${item.wins}W · ${item.losses}L`
      : '—';

    return (
      <View style={[s.row, isMe && s.rowMe]}>
        <View style={s.rankCol}>
          {rankIcon
            ? <Text style={s.rankIcon}>{rankIcon}</Text>
            : <Text style={[s.rankNum, isMe && { color: C.AMBER }]}>#{item.rank}</Text>
          }
        </View>
        <View style={s.idCol}>
          <Text style={[s.playerId, isMe && { color: C.AMBER }]} numberOfLines={1}>
            {isMe ? '▶ YOU' : item.playerId.slice(0, 12) + '…'}
          </Text>
          <Text style={s.wlText}>{wl}</Text>
        </View>
        <Text style={[s.eloText, isMe && { color: C.AMBER }]}>{item.elo}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={s.root}>
      <LinearGradient colors={['#06080E', '#09111D', '#06080E']} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={onBack} style={s.backBtn} activeOpacity={0.7}>
          <Text style={s.backBtnText}>← BACK</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={s.headerLine} />
          <Text style={s.headerText}>🏆 LEADERBOARD</Text>
          <View style={s.headerLine} />
        </View>
      </View>

      {loading ? (
        <View style={s.loading}>
          <ActivityIndicator color={C.CYAN} size="large" />
          <Text style={s.loadingText}>LOADING RANKINGS...</Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={item => item.playerId}
          renderItem={renderItem}
          contentContainerStyle={s.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor={C.CYAN}
            />
          }
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyText}>NO RANKINGS YET</Text>
              <Text style={s.emptySubText}>Play multiplayer to earn your ELO rating.</Text>
            </View>
          }
          ListHeaderComponent={
            <View style={s.columnHeaders}>
              <Text style={[s.colHeader, { width: 44 }]}>RANK</Text>
              <Text style={[s.colHeader, { flex: 1 }]}>PLAYER</Text>
              <Text style={[s.colHeader, { width: 60, textAlign: 'right' }]}>ELO</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: C.BG },

  header:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  headerLine:    { flex: 1, height: 1, backgroundColor: C.BORDER_MED },
  headerText:    { fontFamily: FONT.MONO, fontSize: 11, color: C.AMBER, letterSpacing: 2 },
  backBtn:       { paddingRight: 8 },
  backBtnText:   { fontFamily: FONT.MONO, fontSize: 12, color: C.TEXT_DIM, letterSpacing: 1 },

  loading:       { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText:   { fontFamily: FONT.MONO, fontSize: 11, color: C.TEXT_DIM, letterSpacing: 2 },

  list:          { paddingHorizontal: 16, paddingBottom: 40 },

  columnHeaders: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.BORDER, marginBottom: 4 },
  colHeader:     { fontFamily: FONT.MONO, fontSize: 8, color: C.TEXT_MUTED, letterSpacing: 1.5 },

  row:           { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.BORDER },
  rowMe:         { backgroundColor: 'rgba(255,179,0,0.07)', borderColor: C.AMBER_BORDER },

  rankCol:       { width: 44, alignItems: 'center' },
  rankIcon:      { fontSize: 18 },
  rankNum:       { fontFamily: FONT.MONO, fontSize: 13, fontWeight: '900', color: C.TEXT_DIM },

  idCol:         { flex: 1, gap: 2 },
  playerId:      { fontFamily: FONT.MONO, fontSize: 11, color: C.TEXT_DIM },
  wlText:        { fontFamily: FONT.MONO, fontSize: 9, color: C.TEXT_MUTED },

  eloText:       { width: 60, textAlign: 'right', fontFamily: FONT.MONO, fontSize: 16, fontWeight: '900', color: C.CYAN },

  empty:         { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyText:     { fontFamily: FONT.MONO, fontSize: 12, color: C.TEXT_DIM, letterSpacing: 2 },
  emptySubText:  { fontFamily: FONT.MONO, fontSize: 9, color: C.TEXT_MUTED, textAlign: 'center' },
});

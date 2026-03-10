import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { clearAllLocalData, getOrCreatePlayerId } from '../services/premiumService';
import { C, FONT } from '../theme';

export default function DeleteAccountScreen({ onDeleted, onBack }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = () => {
    Alert.alert(
      'Delete All Data?',
      'This will permanently delete your ELO rating, win/loss record, premium unlock, and daily challenge history. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: confirmDelete,
        },
      ]
    );
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      const playerId = await getOrCreatePlayerId();
      // Delete Firestore player document
      if (playerId) {
        await deleteDoc(doc(db, 'players', playerId)).catch(() => {});
      }
      // Clear all local AsyncStorage data
      await clearAllLocalData();
    } catch {}
    setDeleting(false);
    onDeleted();
  };

  return (
    <SafeAreaView style={s.root}>
      <LinearGradient colors={['#06080E', '#14060A', '#06080E']} style={StyleSheet.absoluteFill} />

      <View style={s.inner}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={onBack} style={s.backBtn} activeOpacity={0.7}>
            <Text style={s.backBtnText}>← BACK</Text>
          </TouchableOpacity>
          <View style={s.headerTitleRow}>
            <View style={s.headerLine} />
            <Text style={s.headerText}>DELETE DATA</Text>
            <View style={s.headerLine} />
          </View>
        </View>

        <View style={s.content}>
          <Text style={s.warningIcon}>⚠️</Text>
          <Text style={s.title}>DELETE ACCOUNT DATA</Text>
          <Text style={s.sub}>This will permanently erase:</Text>

          <View style={s.itemList}>
            {[
              'ELO rating and rank',
              'Win / loss record',
              'Premium unlock',
              'Daily challenge history',
              'Player ID',
            ].map(item => (
              <View key={item} style={s.item}>
                <Text style={s.itemDot}>·</Text>
                <Text style={s.itemText}>{item}</Text>
              </View>
            ))}
          </View>

          <Text style={s.note}>
            Required by Apple App Store guidelines. Your data is stored locally and in Firebase — both will be erased.
          </Text>

          {deleting ? (
            <View style={s.loadingRow}>
              <ActivityIndicator color={C.RED} size="small" />
              <Text style={s.loadingText}>DELETING...</Text>
            </View>
          ) : (
            <TouchableOpacity onPress={handleDelete} activeOpacity={0.8} style={s.deleteBtn}>
              <Text style={s.deleteBtnText}>DELETE ALL MY DATA</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: C.BG },
  inner:        { flex: 1, padding: 16 },

  header:       { flexDirection: 'row', alignItems: 'center', marginBottom: 32, gap: 10 },
  backBtn:      { paddingRight: 4 },
  backBtnText:  { fontFamily: FONT.MONO, fontSize: 12, color: C.TEXT_DIM, letterSpacing: 1 },
  headerTitleRow:{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerLine:   { flex: 1, height: 1, backgroundColor: 'rgba(255,43,43,0.3)' },
  headerText:   { fontFamily: FONT.MONO, fontSize: 11, color: C.RED, letterSpacing: 3 },

  content:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  warningIcon:  { fontSize: 48 },
  title:        { fontSize: 18, fontWeight: '900', color: C.RED, letterSpacing: 4 },
  sub:          { fontFamily: FONT.MONO, fontSize: 10, color: C.TEXT_DIM, letterSpacing: 1 },

  itemList:     { width: '100%', borderWidth: 1, borderColor: 'rgba(255,43,43,0.3)', backgroundColor: 'rgba(255,43,43,0.05)', padding: 16, gap: 8 },
  item:         { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  itemDot:      { fontFamily: FONT.MONO, fontSize: 12, color: C.RED },
  itemText:     { fontFamily: FONT.MONO, fontSize: 10, color: C.TEXT_DIM, flex: 1 },

  note:         { fontFamily: FONT.MONO, fontSize: 9, color: C.TEXT_MUTED, textAlign: 'center', lineHeight: 14, paddingHorizontal: 8 },

  loadingRow:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  loadingText:  { fontFamily: FONT.MONO, fontSize: 11, color: C.RED, letterSpacing: 2 },

  deleteBtn:    { width: '100%', borderWidth: 1, borderColor: C.RED, padding: 18, alignItems: 'center', backgroundColor: 'rgba(255,43,43,0.08)' },
  deleteBtnText:{ fontFamily: FONT.MONO, fontSize: 14, fontWeight: '900', color: C.RED, letterSpacing: 3 },
});

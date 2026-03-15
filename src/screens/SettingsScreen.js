import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C, FONT } from '../theme';
import { GRID_THEMES, getActiveTheme, setActiveTheme } from '../services/themeService';
import { getVoiceOnlyMode, setVoiceOnlyMode } from '../services/settingsService';

const Row = ({ icon, label, sub, onPress, danger = false }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.75} style={s.row}>
    <Text style={s.rowIcon}>{icon}</Text>
    <View style={s.rowBody}>
      <Text style={[s.rowLabel, danger && { color: C.RED }]}>{label}</Text>
      {sub ? <Text style={s.rowSub}>{sub}</Text> : null}
    </View>
    <Text style={s.rowChevron}>›</Text>
  </TouchableOpacity>
);

export default function SettingsScreen({ onBack, onPrivacy, onTerms, onDeleteAccount, isPremium, onPaywall, myPlayerId, onThemeChange, onVoiceOnlyChange }) {
  const [activeThemeId, setActiveThemeId] = useState('deep_ocean');
  const [voiceOnly, setVoiceOnly] = useState(false);

  useEffect(() => {
    getActiveTheme().then(t => setActiveThemeId(t.id));
    getVoiceOnlyMode().then(v => setVoiceOnly(v));
  }, []);

  const handleVoiceOnlyToggle = async (val) => {
    setVoiceOnly(val);
    await setVoiceOnlyMode(val);
    onVoiceOnlyChange?.(val);
  };

  const handleThemeSelect = async (theme) => {
    if (!theme.free && !isPremium) { onPaywall?.(); return; }
    await setActiveTheme(theme.id);
    setActiveThemeId(theme.id);
    onThemeChange?.(theme);
  };

  return (
    <SafeAreaView style={s.root}>
      <LinearGradient colors={['#06080E', '#09111D', '#06080E']} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={onBack} style={s.backBtn} activeOpacity={0.7}>
          <Text style={s.backBtnText}>← BACK</Text>
        </TouchableOpacity>
        <View style={s.headerTitleRow}>
          <View style={s.headerLine} />
          <Text style={s.headerText}>SETTINGS</Text>
          <View style={s.headerLine} />
        </View>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Appearance */}
        <Text style={s.groupLabel}>APPEARANCE</Text>
        <View style={s.group}>
          <View style={s.row}>
            <Text style={s.rowIcon}>🎨</Text>
            <View style={s.rowBody}>
              <Text style={s.rowLabel}>Grid Theme</Text>
              <View style={s.themeRow}>
                {GRID_THEMES.map(theme => (
                  <TouchableOpacity
                    key={theme.id}
                    onPress={() => handleThemeSelect(theme)}
                    activeOpacity={0.8}
                    style={[s.themeChip, activeThemeId === theme.id && s.themeChipActive, { borderColor: theme.accentColor + '88' }]}
                  >
                    <Text style={s.themeIcon}>{theme.icon}</Text>
                    <Text style={[s.themeLabel, activeThemeId === theme.id && { color: theme.accentColor }]}>
                      {theme.name}
                    </Text>
                    {!theme.free && !isPremium && <Text style={s.themeLock}>🔒</Text>}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
          <View style={s.divider} />
          <View style={s.row}>
            <Text style={s.rowIcon}>🎙</Text>
            <View style={s.rowBody}>
              <Text style={s.rowLabel}>Voice-Only Mode</Text>
              <Text style={s.rowSub}>Disable grid taps — fire only by voice</Text>
            </View>
            <Switch
              value={voiceOnly}
              onValueChange={handleVoiceOnlyToggle}
              trackColor={{ false: C.BORDER, true: C.CYAN }}
              thumbColor={voiceOnly ? C.CYAN : C.TEXT_MUTED}
            />
          </View>
        </View>

        {/* Account */}
        <Text style={s.groupLabel}>ACCOUNT</Text>
        <View style={s.group}>
          <View style={s.row}>
            <Text style={s.rowIcon}>🪪</Text>
            <View style={s.rowBody}>
              <Text style={s.rowLabel}>Player ID</Text>
              <Text style={s.rowSub} numberOfLines={1}>
                {myPlayerId ? myPlayerId : 'Loading...'}
              </Text>
            </View>
          </View>
          <View style={s.divider} />
          <View style={s.row}>
            <Text style={s.rowIcon}>{isPremium ? '🎖' : '🔒'}</Text>
            <View style={s.rowBody}>
              <Text style={s.rowLabel}>Deep Strike Command</Text>
              <Text style={[s.rowSub, { color: isPremium ? C.AMBER : C.TEXT_MUTED }]}>
                {isPremium ? 'UNLOCKED' : 'FREE TIER'}
              </Text>
            </View>
            {!isPremium && (
              <TouchableOpacity onPress={onPaywall} style={s.upgradeBtn} activeOpacity={0.8}>
                <Text style={s.upgradeBtnText}>UPGRADE</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Legal */}
        <Text style={s.groupLabel}>LEGAL</Text>
        <View style={s.group}>
          <Row
            icon="📄"
            label="Privacy Policy"
            sub="How we handle your data"
            onPress={onPrivacy}
          />
          <View style={s.divider} />
          <Row
            icon="📋"
            label="Terms of Service"
            sub="Rules and conditions of use"
            onPress={onTerms}
          />
        </View>

        {/* Danger zone */}
        <Text style={s.groupLabel}>DATA</Text>
        <View style={s.group}>
          <Row
            icon="🗑️"
            label="Delete Account Data"
            sub="Erase all data and reset to free tier"
            onPress={onDeleteAccount}
            danger
          />
        </View>

        <Text style={s.version}>Deep Strike v1.0.0</Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:           { flex: 1, backgroundColor: C.BG },

  header:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  backBtn:        { paddingRight: 4 },
  backBtnText:    { fontFamily: FONT.MONO, fontSize: 12, color: C.TEXT_DIM, letterSpacing: 1 },
  headerTitleRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerLine:     { flex: 1, height: 1, backgroundColor: C.BORDER_MED },
  headerText:     { fontFamily: FONT.MONO, fontSize: 11, color: C.CYAN, letterSpacing: 3 },

  scroll:         { padding: 16, paddingBottom: 40 },

  groupLabel:     { fontFamily: FONT.MONO, fontSize: 8, color: C.TEXT_MUTED, letterSpacing: 2, marginBottom: 6, marginTop: 18 },
  group:          { borderWidth: 1, borderColor: C.BORDER, backgroundColor: C.BG_CARD, overflow: 'hidden' },
  divider:        { height: 1, backgroundColor: C.BORDER },

  row:            { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  rowIcon:        { fontSize: 20, width: 28, textAlign: 'center' },
  rowBody:        { flex: 1, gap: 2 },
  rowLabel:       { fontSize: 14, fontWeight: '600', color: C.TEXT },
  rowSub:         { fontFamily: FONT.MONO, fontSize: 9, color: C.TEXT_MUTED, letterSpacing: 1 },
  rowChevron:     { fontSize: 20, color: C.TEXT_MUTED },

  themeRow:       { flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' },
  themeChip:      { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, paddingVertical: 6, paddingHorizontal: 10, backgroundColor: C.BG },
  themeChipActive:{ backgroundColor: 'rgba(255,255,255,0.06)' },
  themeIcon:      { fontSize: 14 },
  themeLabel:     { fontFamily: FONT.MONO, fontSize: 8, color: C.TEXT_DIM, letterSpacing: 1 },
  themeLock:      { fontSize: 9, marginLeft: 2 },

  upgradeBtn:     { borderWidth: 1, borderColor: C.AMBER_BORDER, paddingVertical: 6, paddingHorizontal: 12, backgroundColor: 'rgba(255,179,0,0.08)' },
  upgradeBtnText: { fontFamily: FONT.MONO, fontSize: 9, color: C.AMBER, letterSpacing: 1.5 },

  version:        { fontFamily: FONT.MONO, fontSize: 9, color: C.TEXT_MUTED, textAlign: 'center', marginTop: 32, letterSpacing: 1 },
});

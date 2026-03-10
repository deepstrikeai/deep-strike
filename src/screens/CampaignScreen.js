import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Animated, SafeAreaView, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C, FONT, GLOW } from '../theme';
import { CAMPAIGNS } from '../constants/campaigns';
import { getAllMissionStatuses } from '../services/campaignService';

const StarRow = ({ stars }) => (
  <View style={{ flexDirection: 'row', gap: 2 }}>
    {[1, 2, 3].map(n => (
      <Text key={n} style={{ fontSize: 10, color: n <= (stars || 0) ? '#FFD700' : '#2A3040' }}>★</Text>
    ))}
  </View>
);

export default function CampaignScreen({ onSelectMission, onBack, isPremium }) {
  const [statuses, setStatuses] = useState({});
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    loadStatuses();
  }, []);

  const loadStatuses = async () => {
    const result = {};
    for (const campaign of CAMPAIGNS) {
      result[campaign.id] = await getAllMissionStatuses(campaign.id, campaign.missions);
    }
    setStatuses(result);
  };

  const activeCampaign = selectedCampaign
    ? CAMPAIGNS.find(c => c.id === selectedCampaign)
    : null;
  const activeMissions = activeCampaign ? (statuses[activeCampaign.id] || []) : [];

  if (activeCampaign) {
    return (
      <SafeAreaView style={s.root}>
        <StatusBar barStyle="light-content" />
        <LinearGradient colors={['#06080E', '#09111D', '#06080E']} style={StyleSheet.absoluteFill} />

        <Animated.View style={[s.inner, { opacity: fadeAnim }]}>
          <View style={s.header}>
            <TouchableOpacity onPress={() => setSelectedCampaign(null)} style={{ marginRight: 8 }} activeOpacity={0.7}>
              <Text style={s.backText}>← CAMPAIGNS</Text>
            </TouchableOpacity>
            <View style={s.headerLine} />
          </View>

          <View style={s.campHeader}>
            <Text style={s.campIcon}>{activeCampaign.commanderEmoji}</Text>
            <View>
              <Text style={s.campTitle}>{activeCampaign.name}</Text>
              <Text style={s.campDesc}>{activeCampaign.description}</Text>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {activeMissions.map((mission, idx) => {
              const done = mission.result?.completed;
              const locked = !mission.unlocked;
              return (
                <TouchableOpacity
                  key={mission.id}
                  onPress={() => !locked && onSelectMission(activeCampaign, mission)}
                  activeOpacity={locked ? 1 : 0.8}
                  style={[
                    s.missionCard,
                    done && s.missionCardDone,
                    locked && s.missionCardLocked,
                  ]}
                >
                  {done && (
                    <LinearGradient
                      colors={['rgba(0,229,255,0.07)', 'transparent']}
                      style={StyleSheet.absoluteFill}
                    />
                  )}
                  <View style={[s.missionNum, done && { backgroundColor: C.CYAN }]}>
                    <Text style={[s.missionNumText, done && { color: '#000' }]}>
                      {locked ? '🔒' : String(mission.number).padStart(2, '0')}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.missionName, locked && { color: C.TEXT_MUTED }]}>
                      {mission.name}
                    </Text>
                    <Text style={s.missionDesc}>{mission.desc}</Text>
                    {mission.result?.shots && (
                      <Text style={s.missionBest}>Best: {mission.result.shots} shots</Text>
                    )}
                  </View>
                  <StarRow stars={mission.result?.stars || 0} />
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Animated.View>
      </SafeAreaView>
    );
  }

  // Campaign list
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
          <Text style={s.headerTitle}>CAMPAIGNS</Text>
          <View style={s.headerLine} />
        </View>

        <Text style={s.subtitle}>STORY MISSIONS · SOLO CHALLENGE</Text>

        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
          {CAMPAIGNS.map((campaign, idx) => {
            const missions = statuses[campaign.id] || [];
            const completed = missions.filter(m => m.result?.completed).length;
            const totalStars = missions.reduce((sum, m) => sum + (m.result?.stars || 0), 0);
            const isLocked = idx > 0 && !isPremium;
            return (
              <TouchableOpacity
                key={campaign.id}
                onPress={() => !isLocked && setSelectedCampaign(campaign.id)}
                activeOpacity={isLocked ? 1 : 0.85}
                style={[s.campCard, isLocked && { opacity: 0.5 }]}
              >
                <LinearGradient
                  colors={['rgba(0,229,255,0.06)', 'transparent']}
                  style={StyleSheet.absoluteFill}
                />
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                  <Text style={s.campCardIcon}>{campaign.commanderEmoji}</Text>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <Text style={s.campCardTitle}>{campaign.name}</Text>
                      {isLocked && <Text style={{ fontSize: 12 }}>🔒</Text>}
                    </View>
                    <Text style={s.campCardDesc}>{campaign.description}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 6 }}>
                      <Text style={s.campProgress}>
                        {completed}/{campaign.missions.length} MISSIONS
                      </Text>
                      <View style={{ flexDirection: 'row', gap: 2 }}>
                        {Array.from({ length: Math.min(totalStars, 15) }).map((_, i) => (
                          <Text key={i} style={{ fontSize: 8, color: '#FFD700' }}>★</Text>
                        ))}
                      </View>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:            { flex: 1, backgroundColor: C.BG },
  inner:           { flex: 1, paddingHorizontal: 16, paddingTop: 12 },

  header:          { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  backText:        { fontFamily: FONT.MONO, fontSize: 11, color: C.TEXT_DIM, letterSpacing: 1 },
  headerLine:      { flex: 1, height: 1, backgroundColor: C.BORDER_MED },
  headerTitle:     { fontFamily: FONT.MONO, fontSize: 11, color: C.CYAN, letterSpacing: 3 },
  subtitle:        { fontFamily: FONT.MONO, fontSize: 9, color: C.TEXT_MUTED, letterSpacing: 2, textAlign: 'center', marginBottom: 18 },

  campHeader:      { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  campIcon:        { fontSize: 36 },
  campTitle:       { fontFamily: FONT.MONO, fontSize: 12, fontWeight: '900', color: C.CYAN, letterSpacing: 2, marginBottom: 3 },
  campDesc:        { fontFamily: FONT.MONO, fontSize: 8, color: C.TEXT_MUTED, maxWidth: 240 },

  missionCard:     { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.BG_CARD, borderWidth: 1, borderColor: C.BORDER, padding: 14, marginBottom: 8, overflow: 'hidden', position: 'relative' },
  missionCardDone: { borderColor: C.CYAN_BORDER },
  missionCardLocked: { opacity: 0.45 },
  missionNum:      { width: 32, height: 32, borderWidth: 1, borderColor: C.BORDER, alignItems: 'center', justifyContent: 'center' },
  missionNumText:  { fontFamily: FONT.MONO, fontSize: 12, fontWeight: '900', color: C.CYAN },
  missionName:     { fontSize: 13, fontWeight: '900', color: C.TEXT, letterSpacing: 1.5, marginBottom: 3 },
  missionDesc:     { fontFamily: FONT.MONO, fontSize: 8, color: C.TEXT_MUTED },
  missionBest:     { fontFamily: FONT.MONO, fontSize: 8, color: C.CYAN, marginTop: 3, letterSpacing: 1 },

  campCard:        { borderWidth: 1, borderColor: C.BORDER, backgroundColor: C.BG_CARD, padding: 16, marginBottom: 14, overflow: 'hidden', position: 'relative' },
  campCardIcon:    { fontSize: 36 },
  campCardTitle:   { fontFamily: FONT.MONO, fontSize: 11, fontWeight: '900', color: C.CYAN, letterSpacing: 2 },
  campCardDesc:    { fontFamily: FONT.MONO, fontSize: 8, color: C.TEXT_MUTED },
  campProgress:    { fontFamily: FONT.MONO, fontSize: 8, color: C.TEXT_MUTED, letterSpacing: 1 },
});

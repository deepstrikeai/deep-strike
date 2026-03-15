import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C, FONT } from '../theme';

const SECTIONS = [
  {
    title: 'What We Collect',
    body: `Deep Strike collects the following data to operate the game:

• A randomly generated player ID (stored on your device and in Firebase)
• Your ELO rating, wins, and losses (stored in Firebase Firestore)
• Multiplayer game state (grid positions, shots, turn data — stored temporarily in Firebase)
• Daily challenge completion records (stored locally on your device)
• Premium unlock status (stored locally on your device)

We do not collect your name, email, phone number, location, or any personally identifiable information.`,
  },
  {
    title: 'How We Use It',
    body: `Your player ID and game data are used solely to:

• Enable real-time multiplayer gameplay
• Display the ELO leaderboard
• Track daily challenge progress
• Restore your premium purchase on the same device`,
  },
  {
    title: 'Third-Party Services',
    body: `Deep Strike uses the following third-party services:

• Firebase (Google) — real-time multiplayer and leaderboard data. Firebase may collect usage and diagnostic data per Google's privacy policy.

• Google AdMob — displays ads to free users. AdMob may collect your device advertising identifier (IDFA/GAID) to serve relevant ads. You can opt out via your device settings. Premium users see no ads.

• Sentry — anonymous crash reporting to help us fix bugs. No personal information is sent. Crash reports contain only technical data and your anonymous player ID.

• Apple Push Notification Service (APNs) / Firebase Cloud Messaging (FCM) — used for multiplayer turn notifications. No message content is stored by us.`,
  },
  {
    title: 'Data Retention',
    body: `Multiplayer game documents are retained in Firebase for up to 30 days after completion. ELO and leaderboard data is retained until you delete your account. Local device data is retained until you delete the app or use the Delete Data option in Settings.`,
  },
  {
    title: 'Your Rights',
    body: `You can delete all your data at any time through Settings → Delete Account Data. This removes your Firebase player record and all locally stored data from your device.`,
  },
  {
    title: 'Children',
    body: `Deep Strike is rated 9+ on the App Store and is not directed at children under 13. We do not knowingly collect personal data from children under 13.`,
  },
  {
    title: 'Contact',
    body: `Questions about this policy? Contact us at: sendyourfeedbackhere@gmail.com`,
  },
];

export default function PrivacyPolicyScreen({ onBack }) {
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
          <Text style={s.headerText}>PRIVACY POLICY</Text>
          <View style={s.headerLine} />
        </View>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.updated}>Last updated: March 2026</Text>

        {SECTIONS.map(section => (
          <View key={section.title} style={s.section}>
            <Text style={s.sectionTitle}>{section.title.toUpperCase()}</Text>
            <Text style={s.sectionBody}>{section.body}</Text>
          </View>
        ))}
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
  updated:        { fontFamily: FONT.MONO, fontSize: 9, color: C.TEXT_MUTED, letterSpacing: 1, marginBottom: 20 },

  section:        { marginBottom: 22 },
  sectionTitle:   { fontFamily: FONT.MONO, fontSize: 10, color: C.CYAN, letterSpacing: 2, fontWeight: '900', marginBottom: 8 },
  sectionBody:    { fontSize: 13, color: C.TEXT_DIM, lineHeight: 20 },
});

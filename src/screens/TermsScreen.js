import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C, FONT } from '../theme';

const SECTIONS = [
  {
    title: 'Acceptance',
    body: `By downloading or playing Deep Strike, you agree to these Terms. If you do not agree, do not use the app.`,
  },
  {
    title: 'License',
    body: `We grant you a personal, non-transferable, non-exclusive license to use Deep Strike for personal entertainment. You may not copy, modify, distribute, sell, or reverse-engineer any part of the app.`,
  },
  {
    title: 'In-App Purchases',
    body: `Deep Strike offers optional purchases including a Premium unlock and Commander Shards. All purchases are final and processed by Apple (App Store) or Google (Play Store) under their respective refund policies.

Shard packs are consumable — once applied to a commander they cannot be transferred or refunded. The Premium unlock is non-consumable and tied to your Apple ID or Google account.`,
  },
  {
    title: 'Multiplayer Conduct',
    body: `Deep Strike offers real-time player vs player gameplay. You agree not to:

• Use cheats, bots, or exploits to gain an unfair advantage
• Attempt to manipulate the ELO ranking system
• Interfere with other players' connections or gameplay

We reserve the right to reset rankings or suspend access for violations.`,
  },
  {
    title: 'User Data',
    body: `We collect minimal anonymous data as described in our Privacy Policy. You can delete all your data at any time via Settings → Delete Account Data.`,
  },
  {
    title: 'Disclaimers',
    body: `Deep Strike is provided "as is" without warranties of any kind. We do not guarantee uninterrupted or error-free service, particularly for multiplayer features which depend on internet connectivity and third-party services (Firebase).`,
  },
  {
    title: 'Limitation of Liability',
    body: `To the maximum extent permitted by law, Deep Strike and its developer shall not be liable for any indirect, incidental, or consequential damages arising from your use of the app.`,
  },
  {
    title: 'Changes',
    body: `We may update these Terms at any time. Continued use of the app after changes constitutes acceptance of the updated Terms.`,
  },
  {
    title: 'Contact',
    body: `Questions about these Terms? Contact us at: sendyourfeedbackhere@gmail.com`,
  },
];

export default function TermsScreen({ onBack }) {
  return (
    <SafeAreaView style={s.root}>
      <LinearGradient colors={['#06080E', '#09111D', '#06080E']} style={StyleSheet.absoluteFill} />

      <View style={s.header}>
        <TouchableOpacity onPress={onBack} style={s.backBtn} activeOpacity={0.7}>
          <Text style={s.backBtnText}>← BACK</Text>
        </TouchableOpacity>
        <View style={s.headerTitleRow}>
          <View style={s.headerLine} />
          <Text style={s.headerText}>TERMS OF SERVICE</Text>
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

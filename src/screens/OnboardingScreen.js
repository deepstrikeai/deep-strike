import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  Dimensions, Animated, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C, FONT } from '../theme';
import { markOnboardingDone } from '../services/onboardingService';

const { width: W } = Dimensions.get('window');

const SLIDES = [
  {
    icon: '⚓',
    title: 'WELCOME,\nADMIRAL',
    body: 'Deep Strike is a tactical naval warfare game. Command your fleet, sink the enemy, and rise through the ranks.',
    accent: C.CYAN,
  },
  {
    icon: '🚢',
    title: 'DEPLOY\nYOUR FLEET',
    body: 'Drag ships onto the grid to position them. Tap a ship to rotate it. Long-press to auto-place your whole fleet at once.',
    accent: C.CYAN,
  },
  {
    icon: '💥',
    title: 'FIRE\nAT WILL',
    body: 'Tap the enemy grid to fire. Hit every cell of a ship to sink it. Use your commander\'s special ability when the meter fills.',
    accent: '#FF6432',
  },
  {
    icon: '🎙',
    title: 'VOICE\nCOMMAND',
    body: 'Say a coordinate to fire hands-free. "B7" fires at B7. "Use ability" activates your commander\'s power. "Switch grid" flips views.',
    accent: C.CYAN,
  },
  {
    icon: '🎖',
    title: '6 UNIQUE\nCOMMANDERS',
    body: 'Each commander has a distinct personality and special ability — from sonar sweeps to chaos torpedoes. Unlock them all to master the seas.',
    accent: C.AMBER,
  },
];

export default function OnboardingScreen({ onDone }) {
  const [slide, setSlide] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const goTo = (index) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }).start(() => {
      setSlide(index);
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  };

  const handleNext = () => {
    if (slide < SLIDES.length - 1) {
      goTo(slide + 1);
    } else {
      handleDone();
    }
  };

  const handleDone = async () => {
    await markOnboardingDone();
    onDone();
  };

  const current = SLIDES[slide];
  const isLast  = slide === SLIDES.length - 1;

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#06080E', '#09111D', '#06080E']}
        style={StyleSheet.absoluteFill}
      />

      {/* Skip button */}
      <TouchableOpacity onPress={handleDone} style={s.skipBtn} activeOpacity={0.7} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
        <Text style={s.skipText}>SKIP</Text>
      </TouchableOpacity>

      {/* Main content */}
      <Animated.View style={[s.content, { opacity: fadeAnim }]}>

        {/* Icon */}
        <View style={[s.iconWrap, { borderColor: current.accent + '40' }]}>
          <Text style={s.icon}>{current.icon}</Text>
        </View>

        {/* Text */}
        <View style={s.textBlock}>
          <Text style={[s.title, { color: current.accent }]}>{current.title}</Text>
          <View style={[s.divider, { backgroundColor: current.accent + '40' }]} />
          <Text style={s.body}>{current.body}</Text>
        </View>
      </Animated.View>

      {/* Dots */}
      <View style={s.dots}>
        {SLIDES.map((_, i) => (
          <TouchableOpacity key={i} onPress={() => goTo(i)} activeOpacity={0.7}>
            <View
              style={[
                s.dot,
                i === slide
                  ? { backgroundColor: current.accent, width: 20 }
                  : { backgroundColor: 'rgba(255,255,255,0.2)', width: 8 },
              ]}
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* Next / Done button */}
      <TouchableOpacity onPress={handleNext} style={[s.nextBtn, { borderColor: current.accent }]} activeOpacity={0.8}>
        <LinearGradient
          colors={[current.accent + '22', current.accent + '08']}
          style={StyleSheet.absoluteFill}
        />
        <Text style={[s.nextBtnText, { color: current.accent }]}>
          {isLast ? 'START MISSION' : 'NEXT  →'}
        </Text>
      </TouchableOpacity>

      {/* Slide counter */}
      <Text style={s.counter}>{slide + 1} / {SLIDES.length}</Text>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:       { flex: 1, backgroundColor: C.BG, alignItems: 'center' },

  skipBtn:    { alignSelf: 'flex-end', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  skipText:   { fontFamily: FONT.MONO, fontSize: 10, color: C.TEXT_MUTED, letterSpacing: 2 },

  content:    {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 28,
  },

  iconWrap:   {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,229,255,0.04)',
  },
  icon:       { fontSize: 56 },

  textBlock:  { alignItems: 'center', gap: 12 },
  title:      {
    fontFamily: FONT.MONO,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 4,
    textAlign: 'center',
    lineHeight: 38,
  },
  divider:    { width: 48, height: 1, marginVertical: 4 },
  body:       {
    fontFamily: FONT.MONO,
    fontSize: 13,
    color: C.TEXT_DIM,
    textAlign: 'center',
    lineHeight: 22,
    letterSpacing: 0.5,
  },

  dots:       { flexDirection: 'row', gap: 8, marginBottom: 24, alignItems: 'center' },
  dot:        { height: 8, borderRadius: 4 },

  nextBtn:    {
    width: W - 64,
    height: 56,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    overflow: 'hidden',
  },
  nextBtnText:{ fontFamily: FONT.MONO, fontSize: 14, fontWeight: '900', letterSpacing: 4 },

  counter:    { fontFamily: FONT.MONO, fontSize: 9, color: C.TEXT_MUTED, letterSpacing: 2, marginBottom: 16 },
});

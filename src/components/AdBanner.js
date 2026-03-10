import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { BANNER_AD_UNIT_ID } from '../services/adService';
import { isPremiumUnlocked } from '../services/premiumService';
import { C } from '../theme';

/**
 * Renders an anchored adaptive banner ad for free-tier users.
 * Renders nothing for premium users — safe to drop anywhere.
 *
 * Usage:
 *   <AdBanner />
 */
export default function AdBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    isPremiumUnlocked().then(premium => {
      if (!premium) setShow(true);
    });
  }, []);

  if (!show) return null;

  return (
    <View style={s.container}>
      <BannerAd
        unitId={BANNER_AD_UNIT_ID}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: false }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
    backgroundColor: C.BG,
  },
});

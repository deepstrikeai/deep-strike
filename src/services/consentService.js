// consentService.js
// Google UMP (User Messaging Platform) — GDPR consent for EU/EEA users.
//
// Must be called BEFORE initAds(). On non-EU users it resolves immediately
// with canRequestAds: true. On EU users it shows the Google consent form.
//
// Returns true if ads can be requested (personalised or not).

import { AdsConsent, AdsConsentStatus } from 'react-native-google-mobile-ads';

export const requestConsent = async () => {
  try {
    // Fetch latest consent info from Google
    const consentInfo = await AdsConsent.requestInfoUpdate();

    // Show the consent form if required and available
    if (
      consentInfo.isConsentFormAvailable &&
      (consentInfo.status === AdsConsentStatus.REQUIRED ||
        consentInfo.status === AdsConsentStatus.UNKNOWN)
    ) {
      await AdsConsent.showForm();
    }

    // Re-read after potential form interaction
    const { canRequestAds } = await AdsConsent.getConsentInfo();
    return canRequestAds ?? true;
  } catch {
    // Never block the app on a consent failure
    return true;
  }
};

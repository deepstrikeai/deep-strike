// Rating prompt service — requires expo-store-review package
// Install: npx expo install expo-store-review

let StoreReview = null;

try {
  // Dynamically require expo-store-review if available
  StoreReview = require('expo-store-review');
} catch {
  // Package not installed — no-op
}

export const requestRating = async () => {
  if (!StoreReview) return; // Package not installed
  try {
    const isAvailable = await StoreReview.isAvailableAsync();
    if (isAvailable) {
      await StoreReview.requestReview();
    }
  } catch {}
};

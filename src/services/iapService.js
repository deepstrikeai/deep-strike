import {
  initConnection,
  endConnection,
  getProducts,
  requestPurchase,
  getAvailablePurchases,
  finishTransaction,
  ErrorCode,
} from 'expo-iap';
import { Platform } from 'react-native';
import { setPremiumUnlocked } from './premiumService';
import { unlockBattlePass } from './battlePassService';
import { addCommanderShards } from './commanderService';
import { track, EVENTS } from './analyticsService';
import { captureException } from './sentryService';

// ── Product IDs ───────────────────────────────────────────────────────────────
// These must be registered in App Store Connect and Google Play Console
// before real purchases will work.

export const PRODUCT_IDS = {
  PREMIUM:        'com.deepstrike.app.premium',       // $2.99 — all commanders + modes
  BATTLE_PASS:    'com.deepstrike.app.battlepass',    // $4.99 — Season 1 Battle Pass
  SHARDS_SMALL:   'com.deepstrike.app.shards_small',  // $0.99 — 15 shards
  SHARDS_MEDIUM:  'com.deepstrike.app.shards_medium', // $1.99 — 40 shards
  SHARDS_LARGE:   'com.deepstrike.app.shards_large',  // $4.99 — 100 shards
};

// Shard amounts per product
const SHARD_AMOUNTS = {
  [PRODUCT_IDS.SHARDS_SMALL]:  15,
  [PRODUCT_IDS.SHARDS_MEDIUM]: 40,
  [PRODUCT_IDS.SHARDS_LARGE]:  100,
};

let _connected = false;

// ── Connection ────────────────────────────────────────────────────────────────

export const connectIAP = async () => {
  if (_connected) return true;
  try {
    await initConnection();
    _connected = true;
    return true;
  } catch (e) {
    console.warn('IAP: initConnection failed', e);
    return false;
  }
};

export const disconnectIAP = async () => {
  if (!_connected) return;
  try {
    await endConnection();
    _connected = false;
  } catch {}
};

// ── Fetch products ────────────────────────────────────────────────────────────

export const fetchIAPProducts = async (productIds) => {
  try {
    await connectIAP();
    return await getProducts(productIds, 'in-app');
  } catch (e) {
    console.warn('IAP: fetchProducts failed', e);
    return [];
  }
};

// ── Purchase ──────────────────────────────────────────────────────────────────

// Returns { success, cancelled, error }
export const purchaseProduct = async (productId, commanderId = null) => {
  track(EVENTS.IAP_INITIATED, { productId });
  try {
    await connectIAP();
    const purchase = await requestPurchase({ sku: productId });
    if (!purchase) {
      track(EVENTS.IAP_CANCELLED, { productId });
      return { success: false, cancelled: true };
    }

    // Acknowledge / finish the transaction
    await finishTransaction({ purchase, isConsumable: _isConsumable(productId) });

    // Apply the reward locally
    await _applyPurchaseReward(productId, commanderId);

    track(EVENTS.IAP_COMPLETED, { productId });
    return { success: true, cancelled: false };
  } catch (e) {
    if (e?.code === ErrorCode.UserCancelled) {
      track(EVENTS.IAP_CANCELLED, { productId });
      return { success: false, cancelled: true };
    }
    console.warn('IAP: purchaseProduct failed', e);
    track(EVENTS.IAP_FAILED, { productId, error: e?.message });
    captureException(e, { productId });
    return { success: false, cancelled: false, error: e?.message || 'Purchase failed' };
  }
};

// ── Restore ───────────────────────────────────────────────────────────────────

// Returns { restoredProducts: string[] }
export const restoreIAPPurchases = async () => {
  try {
    await connectIAP();
    const purchases = await getAvailablePurchases();
    const restored = [];

    for (const purchase of purchases) {
      const id = purchase.productId;
      await _applyPurchaseReward(id, null);
      restored.push(id);
    }

    track(EVENTS.IAP_RESTORED, { count: restored.length });
    return { restoredProducts: restored };
  } catch (e) {
    console.warn('IAP: restorePurchases failed', e);
    captureException(e, { context: 'restoreIAPPurchases' });
    return { restoredProducts: [] };
  }
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const _isConsumable = (productId) => {
  // Shard packs are consumable; premium and battle pass are non-consumable
  return productId.includes('shard');
};

const _applyPurchaseReward = async (productId, commanderId) => {
  switch (productId) {
    case PRODUCT_IDS.PREMIUM:
      await setPremiumUnlocked();
      break;
    case PRODUCT_IDS.BATTLE_PASS:
      await unlockBattlePass();
      break;
    case PRODUCT_IDS.SHARDS_SMALL:
    case PRODUCT_IDS.SHARDS_MEDIUM:
    case PRODUCT_IDS.SHARDS_LARGE:
      if (commanderId) {
        await addCommanderShards(commanderId, SHARD_AMOUNTS[productId]);
      }
      break;
  }
};

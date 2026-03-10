import AsyncStorage from '@react-native-async-storage/async-storage';
import { addCommanderShards } from './commanderService';
import { purchaseProduct, fetchIAPProducts, PRODUCT_IDS } from './iapService';

export const SHARD_PACKS = [
  { id: 'shard_small',  iapId: PRODUCT_IDS.SHARDS_SMALL,  name: 'RECRUIT PACK',  shards: 15,  price: '$0.99', icon: '🔹', highlight: false },
  { id: 'shard_medium', iapId: PRODUCT_IDS.SHARDS_MEDIUM, name: 'CAPTAIN PACK',  shards: 40,  price: '$1.99', icon: '🔷', highlight: true  },
  { id: 'shard_large',  iapId: PRODUCT_IDS.SHARDS_LARGE,  name: 'ADMIRAL PACK',  shards: 100, price: '$4.99', icon: '💎', highlight: false },
];

// Fetch real prices from store (updates the price field on each pack)
export const fetchShardPackPrices = async () => {
  try {
    const productIds = SHARD_PACKS.map(p => p.iapId);
    const products = await fetchIAPProducts(productIds);
    products.forEach(p => {
      const pack = SHARD_PACKS.find(sp => sp.iapId === p.productId);
      if (pack && p.localizedPrice) pack.price = p.localizedPrice;
    });
  } catch {}
};

const DAILY_SHARD_KEY = () => `@deepstrike_daily_free_${new Date().toDateString()}`;

export const claimDailyFreeShards = async (commanderId) => {
  const key = DAILY_SHARD_KEY();
  const claimed = await AsyncStorage.getItem(key);
  if (claimed === 'true') return { alreadyClaimed: true };
  const result = await addCommanderShards(commanderId, 5);
  await AsyncStorage.setItem(key, 'true');
  return { alreadyClaimed: false, ...result };
};

export const hasDailyFreeBeenClaimed = async () => {
  const val = await AsyncStorage.getItem(DAILY_SHARD_KEY());
  return val === 'true';
};

export const purchaseShardPack = async (packId, commanderId) => {
  const pack = SHARD_PACKS.find(p => p.id === packId);
  if (!pack || !commanderId) return null;
  const result = await purchaseProduct(pack.iapId, commanderId);
  if (!result.success) return null;
  // Reward already applied inside iapService._applyPurchaseReward
  // Return current shard count for UI feedback
  const { getCommanderShards } = require('./commanderService');
  const shards = await getCommanderShards(commanderId);
  return { shards, unlocked: shards >= 50 };
};

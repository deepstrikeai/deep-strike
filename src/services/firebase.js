import { initializeApp } from 'firebase/app';
import { initializeFirestore, memoryLocalCache } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCwy0Ee848z_GFcvY1z1EOh6yjmEgbK09A",
  authDomain: "battleshipai-c1de7.firebaseapp.com",
  projectId: "battleshipai-c1de7",
  storageBucket: "battleshipai-c1de7.firebasestorage.app",
  messagingSenderId: "787462994793",
  appId: "1:787462994793:web:163184777231b840d59bf8",
};

const app = initializeApp(firebaseConfig);
// React Native has no IndexedDB, so use in-memory cache only.
// Force long-polling instead of the default gRPC/WebSocket transport,
// which does not work reliably in the React Native JS environment.
export const db = initializeFirestore(app, {
  localCache: memoryLocalCache(),
  experimentalForceLongPolling: true,
});

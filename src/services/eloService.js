import {
  doc, getDoc, setDoc, runTransaction,
  collection, query, orderBy, limit as fsLimit, getDocs,
} from 'firebase/firestore';
import { db } from './firebase';

const K = 32;
const DEFAULT_ELO = 1000;

export const calculateElo = (myElo, opponentElo, won) => {
  const expected = 1 / (1 + Math.pow(10, (opponentElo - myElo) / 400));
  const actual = won ? 1 : 0;
  return Math.round(myElo + K * (actual - expected));
};

export const fetchPlayerElo = async (playerId) => {
  try {
    const snap = await getDoc(doc(db, 'players', playerId));
    if (snap.exists()) return snap.data().elo ?? DEFAULT_ELO;
    return DEFAULT_ELO;
  } catch {
    return DEFAULT_ELO;
  }
};

export const updateEloAfterGame = async (myId, oppId, myWon) => {
  if (!myId || !oppId || myId === oppId) return;
  const myRef  = doc(db, 'players', myId);
  const oppRef = doc(db, 'players', oppId);

  await runTransaction(db, async (transaction) => {
    const [mySnap, oppSnap] = await Promise.all([
      transaction.get(myRef),
      transaction.get(oppRef),
    ]);

    const myData  = mySnap.exists()  ? mySnap.data()  : { elo: DEFAULT_ELO, wins: 0, losses: 0, createdAt: Date.now() };
    const oppData = oppSnap.exists() ? oppSnap.data() : { elo: DEFAULT_ELO, wins: 0, losses: 0, createdAt: Date.now() };

    const newMyElo  = calculateElo(myData.elo,  oppData.elo, myWon);
    const newOppElo = calculateElo(oppData.elo, myData.elo,  !myWon);

    transaction.set(myRef, {
      elo:       newMyElo,
      wins:      (myData.wins  || 0) + (myWon  ? 1 : 0),
      losses:    (myData.losses || 0) + (myWon ? 0 : 1),
      createdAt: myData.createdAt || Date.now(),
    });
    transaction.set(oppRef, {
      elo:       newOppElo,
      wins:      (oppData.wins  || 0) + (!myWon ? 1 : 0),
      losses:    (oppData.losses || 0) + (!myWon ? 0 : 1),
      createdAt: oppData.createdAt || Date.now(),
    });
  });
};

export const fetchLeaderboard = async (limitCount = 20) => {
  try {
    const q = query(
      collection(db, 'players'),
      orderBy('elo', 'desc'),
      fsLimit(limitCount)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d, i) => ({
      rank: i + 1,
      playerId: d.id,
      elo: d.data().elo ?? DEFAULT_ELO,
      wins: d.data().wins ?? 0,
      losses: d.data().losses ?? 0,
    }));
  } catch {
    return [];
  }
};

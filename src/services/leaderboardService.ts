import {
  collection,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  query,
  where,
  limit,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';

export interface LeaderboardEntry {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userTitle: string;
  userLevel: number;
  gameId: string;
  gameName: string;
  score: number;
  accuracy: number;
  streak: number;
  date: string;
  createdAt?: any;
  updatedAt?: any;
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const LOCAL_LEADERBOARD_CACHE_KEY = 'mindlabz_leaderboard_today_cache';

// Seed mock champions for initial visual richness & immediate competitive feel
export const SEED_LEADERBOARD_CHAMPIONS: LeaderboardEntry[] = [
  {
    id: 'champion_1_today',
    userId: 'uid_neuro_master_1',
    userName: '林澜 · 认知神经科学家',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
    userTitle: '深邃神经元导师',
    userLevel: 28,
    gameId: 'all',
    gameName: '今日综合总榜',
    score: 14850,
    accuracy: 98,
    streak: 42,
    date: getTodayDateString(),
  },
  {
    id: 'champion_2_today',
    userId: 'uid_speed_thinker_2',
    userName: '苏清越 · 逻辑哲学学者',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80',
    userTitle: '前额叶理性宗师',
    userLevel: 24,
    gameId: 'all',
    gameName: '今日综合总榜',
    score: 13920,
    accuracy: 96,
    streak: 31,
    date: getTodayDateString(),
  },
  {
    id: 'champion_3_today',
    userId: 'uid_mind_sage_3',
    userName: '周言蹊 · 行为金融研究员',
    userAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=160&q=80',
    userTitle: '概率与去偏见领航人',
    userLevel: 22,
    gameId: 'all',
    gameName: '今日综合总榜',
    score: 12760,
    accuracy: 94,
    streak: 19,
    date: getTodayDateString(),
  },
  {
    id: 'champion_4_today',
    userId: 'uid_focus_pro_4',
    userName: '陈子敬',
    userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80',
    userTitle: '微习惯筑基者',
    userLevel: 18,
    gameId: 'all',
    gameName: '今日综合总榜',
    score: 11480,
    accuracy: 92,
    streak: 14,
    date: getTodayDateString(),
  },
  {
    id: 'champion_5_today',
    userId: 'uid_zen_observer_5',
    userName: '方知夏',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80',
    userTitle: '元认知觉察学者',
    userLevel: 16,
    gameId: 'all',
    gameName: '今日综合总榜',
    score: 10350,
    accuracy: 95,
    streak: 9,
    date: getTodayDateString(),
  },
  {
    id: 'champion_6_today',
    userId: 'uid_heuristics_6',
    userName: '赵博文',
    userAvatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=160&q=80',
    userTitle: '启发式破局者',
    userLevel: 15,
    gameId: 'all',
    gameName: '今日综合总榜',
    score: 9620,
    accuracy: 89,
    streak: 8,
    date: getTodayDateString(),
  },
];

/**
 * Real-time listener for today's leaderboard scores from Firebase Firestore.
 * Automatically filters by gameId and sorts by highest score.
 */
export function subscribeTodayLeaderboard(
  selectedGameId: string,
  onUpdate: (entries: LeaderboardEntry[]) => void,
  onError?: (err: Error) => void
): () => void {
  const today = getTodayDateString();
  const collectionPath = 'gameLeaderboards';

  try {
    const q = query(
      collection(db, collectionPath),
      where('date', '==', today),
      limit(100)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const firestoreList: LeaderboardEntry[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as LeaderboardEntry;
          firestoreList.push({
            ...data,
            id: docSnap.id,
          });
        });

        // Filter by game category if not 'all'
        let relevantList = firestoreList;
        if (selectedGameId !== 'all') {
          relevantList = firestoreList.filter(
            (entry) => entry.gameId === selectedGameId
          );
        }

        // Cache Firestore results locally for offline resilience
        try {
          localStorage.setItem(
            LOCAL_LEADERBOARD_CACHE_KEY,
            JSON.stringify(firestoreList)
          );
        } catch {
          // ignore
        }

        // If firestore is still empty today, merge with seed champions
        const combinedMap = new Map<string, LeaderboardEntry>();

        // Add seed champions first
        SEED_LEADERBOARD_CHAMPIONS.forEach((seed) => {
          if (selectedGameId === 'all' || seed.gameId === selectedGameId) {
            combinedMap.set(seed.id, seed);
          }
        });

        // Overlay with real Firestore entries (real users take precedence)
        relevantList.forEach((entry) => {
          combinedMap.set(entry.id, entry);
        });

        const sorted = Array.from(combinedMap.values()).sort(
          (a, b) => b.score - a.score
        );

        onUpdate(sorted);
      },
      (error) => {
        console.warn('Leaderboard onSnapshot notice:', error.message);
        // Fallback to local cache + seed entries on connectivity/permission issues
        const cached = getLocalLeaderboardFallback(selectedGameId);
        onUpdate(cached);
        if (onError) onError(error);
      }
    );

    return unsubscribe;
  } catch (err: any) {
    console.error('Failed to subscribe to leaderboard:', err);
    const cached = getLocalLeaderboardFallback(selectedGameId);
    onUpdate(cached);
    if (onError) onError(err);
    return () => {};
  }
}

/**
 * Returns cached leaderboard entries or fallback seeds.
 */
export function getLocalLeaderboardFallback(
  selectedGameId: string
): LeaderboardEntry[] {
  let cachedEntries: LeaderboardEntry[] = [];
  try {
    const raw = localStorage.getItem(LOCAL_LEADERBOARD_CACHE_KEY);
    if (raw) {
      cachedEntries = JSON.parse(raw);
    }
  } catch {
    // ignore
  }

  const combinedMap = new Map<string, LeaderboardEntry>();
  SEED_LEADERBOARD_CHAMPIONS.forEach((s) => combinedMap.set(s.id, s));
  cachedEntries.forEach((c) => combinedMap.set(c.id, c));

  let list = Array.from(combinedMap.values());
  if (selectedGameId !== 'all') {
    list = list.filter((item) => item.gameId === selectedGameId);
  }
  return list.sort((a, b) => b.score - a.score);
}

/**
 * Submits a completed game score to Firestore's real-time leaderboard.
 * Also keeps an aggregated daily total score entry for the user.
 */
export async function submitGameScoreToLeaderboard(params: {
  userId: string;
  userName: string;
  userAvatar: string;
  userTitle: string;
  userLevel: number;
  gameId: string;
  gameName: string;
  score: number;
  accuracy: number;
  streak: number;
}): Promise<{ success: boolean; isNewBest?: boolean; entryId?: string }> {
  const today = getTodayDateString();
  const safeUserId = (params.userId || auth.currentUser?.uid || 'guest_user')
    .replace(/[^a-zA-Z0-9_\-]/g, '_')
    .slice(0, 128);
  const safeGameId = params.gameId.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 60);
  const docId = `${safeUserId}_${today}_${safeGameId}`;

  const cleanEntry: LeaderboardEntry = {
    id: docId,
    userId: safeUserId,
    userName: (params.userName || '匿名探索者').trim().slice(0, 100),
    userAvatar: (params.userAvatar || '').slice(0, 1000),
    userTitle: (params.userTitle || '认知研习者').slice(0, 60),
    userLevel: Math.max(1, Math.min(1000, Number(params.userLevel || 1))),
    gameId: safeGameId,
    gameName: (params.gameName || '心理学小游戏').slice(0, 100),
    score: Math.max(0, Math.min(10000000, Math.round(params.score))),
    accuracy: Math.max(0, Math.min(100, Math.round(params.accuracy || 100))),
    streak: Math.max(0, Math.min(10000, Number(params.streak || 1))),
    date: today,
  };

  // Always update local cache immediately so the user sees their score right away
  try {
    const raw = localStorage.getItem(LOCAL_LEADERBOARD_CACHE_KEY);
    const existingList: LeaderboardEntry[] = raw ? JSON.parse(raw) : [];
    const index = existingList.findIndex((e) => e.id === docId);
    if (index >= 0) {
      if (cleanEntry.score >= existingList[index].score) {
        existingList[index] = cleanEntry;
      }
    } else {
      existingList.push(cleanEntry);
    }
    localStorage.setItem(
      LOCAL_LEADERBOARD_CACHE_KEY,
      JSON.stringify(existingList)
    );
  } catch {
    // ignore
  }

  // Check if authenticated in Firebase to push live to Firestore
  if (!auth.currentUser) {
    return { success: true, isNewBest: true, entryId: docId };
  }

  const docRef = doc(db, 'gameLeaderboards', docId);

  try {
    const existingSnap = await getDoc(docRef);
    let isNewBest = true;

    if (existingSnap.exists()) {
      const existingData = existingSnap.data() as LeaderboardEntry;
      if (existingData.score >= cleanEntry.score) {
        isNewBest = false;
        // Keep existing higher score, only update timestamp if desired
        return { success: true, isNewBest: false, entryId: docId };
      }
    }

    const payload = {
      ...cleanEntry,
      userId: auth.currentUser.uid,
      createdAt: existingSnap.exists()
        ? (existingSnap.data().createdAt ?? serverTimestamp())
        : serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(docRef, payload, { merge: true });

    // Also update/sync the daily total score entry for this user
    void syncDailyTotalScore(
      auth.currentUser.uid,
      cleanEntry.userName,
      cleanEntry.userAvatar,
      cleanEntry.userTitle,
      cleanEntry.userLevel,
      cleanEntry.streak
    );

    return { success: true, isNewBest, entryId: docId };
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.WRITE, `gameLeaderboards/${docId}`);
    } catch {
      // Return gracefully with local success
    }
    return { success: false, entryId: docId };
  }
}

/**
 * Computes and syncs a user's cumulative daily total score entry on the global leaderboard
 */
async function syncDailyTotalScore(
  userId: string,
  userName: string,
  userAvatar: string,
  userTitle: string,
  userLevel: number,
  streak: number
) {
  try {
    const today = getTodayDateString();
    const safeUserId = userId.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 128);
    const totalDocId = `${safeUserId}_${today}_all`;
    const totalRef = doc(db, 'gameLeaderboards', totalDocId);

    // Sum local high scores for today
    let sumScore = 0;
    try {
      const raw = localStorage.getItem(LOCAL_LEADERBOARD_CACHE_KEY);
      if (raw) {
        const list: LeaderboardEntry[] = JSON.parse(raw);
        list
          .filter(
            (e) =>
              e.userId === safeUserId && e.date === today && e.gameId !== 'all'
          )
          .forEach((e) => {
            sumScore += e.score;
          });
      }
    } catch {
      // ignore
    }

    if (sumScore <= 0) return;

    const existingSnap = await getDoc(totalRef);
    const totalPayload: LeaderboardEntry = {
      id: totalDocId,
      userId: safeUserId,
      userName: userName.slice(0, 100),
      userAvatar: userAvatar.slice(0, 1000),
      userTitle: userTitle.slice(0, 60),
      userLevel,
      gameId: 'all',
      gameName: '今日综合总榜',
      score: sumScore,
      accuracy: 96,
      streak,
      date: today,
      createdAt: existingSnap.exists()
        ? (existingSnap.data()?.createdAt ?? serverTimestamp())
        : serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(totalRef, totalPayload, { merge: true });
  } catch (e) {
    console.warn('syncDailyTotalScore notice:', e);
  }
}

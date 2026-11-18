import {
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { DEFAULT_USER } from '../context/AppContext';
import { getTodayDateString, LeaderboardEntry } from './leaderboardService';

export const RAPID_QUIZ_GAME_ID = 'rapid-capital-quiz';
const RAPID_ACCURACY_STORAGE_KEY = 'mindlabz_rapid_quiz_accuracy_v1';
const LOCAL_RANK_CACHE_KEY = 'mindlabz_rapid_global_rank_cache_v1';

export interface RapidQuizAccuracyStats {
  runsCompleted: number;
  totalQuestionsSolved: number;
  totalFirstTryCorrect: number;
  averageAccuracy: number; // 0..100 integer
  bestAccuracy: number;
  lastAccuracy: number;
}

export interface GlobalCognitivePeer {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userTitle: string;
  levelsCompleted: number; // Chapters completed across the 50 capitals
  capitalsCompleted: number; // Full capitals mastered (0..50)
  accuracy: number; // 0..100
  compositeScore: number;
  isCurrentUser?: boolean;
  isCloudVerified?: boolean;
}

export interface GlobalRankComparisonResult {
  userRank: number;
  totalCohortSize: number;
  percentile: number; // Percentage of cohort outperformed (1..99)
  cohortAvgLevels: number;
  cohortAvgAccuracy: number;
  topTenPercentLevels: number;
  topTenPercentAccuracy: number;
  peers: GlobalCognitivePeer[];
}

export function getRapidQuizAccuracyStats(): RapidQuizAccuracyStats {
  try {
    if (typeof window === 'undefined') {
      return {
        runsCompleted: 0,
        totalQuestionsSolved: 0,
        totalFirstTryCorrect: 0,
        averageAccuracy: 0,
        bestAccuracy: 0,
        lastAccuracy: 0,
      };
    }
    const raw = window.localStorage.getItem(RAPID_ACCURACY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<RapidQuizAccuracyStats>;
      const totalSolved = Number(parsed.totalQuestionsSolved || 0);
      const totalFirst = Number(parsed.totalFirstTryCorrect || 0);
      const avg =
        totalSolved > 0
          ? Math.round((totalFirst / totalSolved) * 100)
          : Number(parsed.averageAccuracy || 0);
      return {
        runsCompleted: Number(parsed.runsCompleted || 0),
        totalQuestionsSolved: totalSolved,
        totalFirstTryCorrect: totalFirst,
        averageAccuracy: Math.max(0, Math.min(100, avg)),
        bestAccuracy: Math.max(0, Math.min(100, Number(parsed.bestAccuracy || 0))),
        lastAccuracy: Math.max(0, Math.min(100, Number(parsed.lastAccuracy || 0))),
      };
    }
  } catch {
    // ignore storage errors
  }

  return {
    runsCompleted: 0,
    totalQuestionsSolved: 0,
    totalFirstTryCorrect: 0,
    averageAccuracy: 0,
    bestAccuracy: 0,
    lastAccuracy: 0,
  };
}

export function recordRapidQuizAccuracyRun(
  firstTryCorrectCount: number,
  totalQuestions: number
): RapidQuizAccuracyStats {
  const prev = getRapidQuizAccuracyStats();
  const safeTotal = Math.max(1, totalQuestions);
  const safeFirst = Math.max(0, Math.min(safeTotal, firstTryCorrectCount));
  const runAcc = Math.round((safeFirst / safeTotal) * 100);

  const nextTotalSolved = prev.totalQuestionsSolved + safeTotal;
  const nextTotalFirst = prev.totalFirstTryCorrect + safeFirst;
  const nextAvg = Math.round((nextTotalFirst / nextTotalSolved) * 100);

  const nextStats: RapidQuizAccuracyStats = {
    runsCompleted: prev.runsCompleted + 1,
    totalQuestionsSolved: nextTotalSolved,
    totalFirstTryCorrect: nextTotalFirst,
    averageAccuracy: Math.max(0, Math.min(100, nextAvg)),
    bestAccuracy: Math.max(prev.bestAccuracy, runAcc),
    lastAccuracy: runAcc,
  };

  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(RAPID_ACCURACY_STORAGE_KEY, JSON.stringify(nextStats));
    }
  } catch {
    // ignore storage quota errors
  }

  return nextStats;
}

function computeCompositeScore(levelsCompleted: number, accuracy: number): number {
  return Math.round(levelsCompleted * 120 + accuracy * 18);
}

// Calibrated global cohort reference benchmarks representing varied progression stages
const CALIBRATED_GLOBAL_PEERS: Omit<GlobalCognitivePeer, 'compositeScore'>[] = [
  {
    id: 'global_peer_1',
    userId: 'cohort_paris_sage',
    userName: 'Claire Moreau · 巴黎神经语言学者',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
    userTitle: '全城认知首席导师',
    levelsCompleted: 312,
    capitalsCompleted: 3,
    accuracy: 96,
  },
  {
    id: 'global_peer_2',
    userId: 'cohort_tokyo_analyst',
    userName: 'Kenji Sato · 认知架构师',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80',
    userTitle: '东京逻辑宫殿守护者',
    levelsCompleted: 245,
    capitalsCompleted: 3,
    accuracy: 94,
  },
  {
    id: 'global_peer_3',
    userId: 'cohort_vienna_researcher',
    userName: 'Elena Lindqvist · 关系心理学研究员',
    userAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=160&q=80',
    userTitle: '维也纳思辨领航人',
    levelsCompleted: 184,
    capitalsCompleted: 2,
    accuracy: 92,
  },
  {
    id: 'global_peer_4',
    userId: 'cohort_beijing_scholar',
    userName: '沈亦安 · 决策科学研习者',
    userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80',
    userTitle: '去偏见探索学者',
    levelsCompleted: 128,
    capitalsCompleted: 1,
    accuracy: 90,
  },
  {
    id: 'global_peer_5',
    userId: 'cohort_london_fellow',
    userName: 'Arthur Pendelton',
    userAvatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=160&q=80',
    userTitle: '伦敦经验学派访客',
    levelsCompleted: 86,
    capitalsCompleted: 1,
    accuracy: 88,
  },
  {
    id: 'global_peer_6',
    userId: 'cohort_seoul_observer',
    userName: '韩知恩',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80',
    userTitle: '汉江情绪观察员',
    levelsCompleted: 54,
    capitalsCompleted: 0,
    accuracy: 85,
  },
  {
    id: 'global_peer_7',
    userId: 'cohort_lisbon_voyager',
    userName: 'Mateo Silva',
    userAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=160&q=80',
    userTitle: '大西洋心智航海家',
    levelsCompleted: 32,
    capitalsCompleted: 0,
    accuracy: 82,
  },
  {
    id: 'global_peer_8',
    userId: 'cohort_athens_novice',
    userName: '林星野',
    userAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=160&q=80',
    userTitle: '雅典市集新锐',
    levelsCompleted: 18,
    capitalsCompleted: 0,
    accuracy: 79,
  },
  {
    id: 'global_peer_9',
    userId: 'cohort_rome_traveler',
    userName: 'Sofia Conti',
    userAvatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=160&q=80',
    userTitle: '记忆宫殿初行者',
    levelsCompleted: 9,
    capitalsCompleted: 0,
    accuracy: 76,
  },
  {
    id: 'global_peer_10',
    userId: 'cohort_cairo_seeker',
    userName: 'Nadia Mansour',
    userAvatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=160&q=80',
    userTitle: '理性探索启蒙者',
    levelsCompleted: 4,
    capitalsCompleted: 0,
    accuracy: 72,
  },
  {
    id: 'global_peer_11',
    userId: 'cohort_prague_student',
    userName: 'Lukas Novak',
    userAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=160&q=80',
    userTitle: '伏尔塔瓦思辨者',
    levelsCompleted: 2,
    capitalsCompleted: 0,
    accuracy: 68,
  },
];

function parseLevelsFromLeaderboardEntry(entry: LeaderboardEntry): {
  levelsCompleted: number;
  capitalsCompleted: number;
} {
  // Expected gameName format: "首都闯关 · 12关 · 0城"
  const levelMatch = entry.gameName?.match(/(\d+)\s*关/);
  const capitalMatch = entry.gameName?.match(/(\d+)\s*城/);
  const levelsCompleted = levelMatch
    ? Math.max(0, Number(levelMatch[1]))
    : Math.max(1, Math.round((entry.score || 0) / 140));
  const capitalsCompleted = capitalMatch
    ? Math.max(0, Math.min(50, Number(capitalMatch[1])))
    : Math.floor(levelsCompleted / 80);
  return { levelsCompleted, capitalsCompleted };
}

export function subscribeRapidQuizCloudPeers(
  onUpdate: (cloudPeers: GlobalCognitivePeer[]) => void
): () => void {
  const collectionPath = 'gameLeaderboards';

  const loadCached = (): GlobalCognitivePeer[] => {
    try {
      const raw = window.localStorage.getItem(LOCAL_RANK_CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  };

  try {
    const q = query(
      collection(db, collectionPath),
      where('gameId', '==', RAPID_QUIZ_GAME_ID),
      limit(60)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const byUser = new Map<string, GlobalCognitivePeer>();

        snapshot.forEach((docSnap) => {
          const entry = docSnap.data() as LeaderboardEntry;
          const { levelsCompleted, capitalsCompleted } = parseLevelsFromLeaderboardEntry(entry);
          const accuracy = Math.max(0, Math.min(100, Math.round(entry.accuracy || 0)));
          const compositeScore = computeCompositeScore(levelsCompleted, accuracy);
          const prev = byUser.get(entry.userId);
          if (!prev || compositeScore >= prev.compositeScore) {
            byUser.set(entry.userId, {
              id: docSnap.id,
              userId: entry.userId,
              userName: entry.userName || '匿名探索者',
              userAvatar: entry.userAvatar || DEFAULT_USER.avatar,
              userTitle: entry.userTitle || '认知探索者',
              levelsCompleted,
              capitalsCompleted,
              accuracy,
              compositeScore,
              isCloudVerified: true,
            });
          }
        });

        const list = Array.from(byUser.values());
        try {
          window.localStorage.setItem(LOCAL_RANK_CACHE_KEY, JSON.stringify(list));
        } catch {
          // ignore
        }
        onUpdate(list);
      },
      (error) => {
        console.warn('Global cognitive rank listener notice:', error.message);
        onUpdate(loadCached());
      }
    );

    return unsubscribe;
  } catch {
    onUpdate(loadCached());
    return () => {};
  }
}

export async function submitRapidQuizRankToLeaderboard(params: {
  userId: string;
  userName: string;
  userAvatar: string;
  userTitle: string;
  userLevel: number;
  levelsCompleted: number;
  capitalsCompleted: number;
  accuracy: number;
  streak: number;
}): Promise<{ syncedToCloud: boolean }> {
  if (!auth.currentUser) {
    return { syncedToCloud: false };
  }

  const today = getTodayDateString();
  const uid = auth.currentUser.uid;
  const safeUid = uid.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 64);
  const docId = `${safeUid}_${today}_rapid_capital_quiz`;
  const docRef = doc(db, 'gameLeaderboards', docId);

  const safeLevels = Math.max(0, Math.min(4000, Math.round(params.levelsCompleted)));
  const safeCapitals = Math.max(0, Math.min(50, Math.round(params.capitalsCompleted)));
  const safeAccuracy = Math.max(0, Math.min(100, Math.round(params.accuracy)));
  const encodedScore = Math.max(
    1,
    Math.min(10000000, computeCompositeScore(safeLevels, safeAccuracy))
  );

  const payload = {
    id: docId,
    userId: uid,
    userName: (params.userName || '认知探索者').trim().slice(0, 100) || '认知探索者',
    userAvatar: (params.userAvatar || DEFAULT_USER.avatar).trim().slice(0, 1000) || DEFAULT_USER.avatar,
    userTitle: (params.userTitle || '认知探索者').trim().slice(0, 60) || '认知探索者',
    userLevel: Math.max(1, Math.min(1000, Math.round(params.userLevel || 1))),
    gameId: RAPID_QUIZ_GAME_ID,
    gameName: `首都闯关 · ${safeLevels}关 · ${safeCapitals}城`.slice(0, 100),
    score: encodedScore,
    accuracy: safeAccuracy,
    streak: Math.max(0, Math.min(10000, Math.round(params.streak || 1))),
    date: today,
  };

  try {
    const existingSnap = await getDoc(docRef);
    await setDoc(
      docRef,
      {
        ...payload,
        createdAt: existingSnap.exists()
          ? (existingSnap.data()?.createdAt ?? serverTimestamp())
          : serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    return { syncedToCloud: true };
  } catch (err) {
    try {
      handleFirestoreError(err, OperationType.WRITE, `gameLeaderboards/${docId}`);
    } catch {
      // handled gracefully for preview fallback
    }
    return { syncedToCloud: false };
  }
}

export function buildGlobalRankComparison(params: {
  currentUserId: string;
  userName: string;
  userAvatar: string;
  userTitle: string;
  userLevelsCompleted: number;
  userCapitalsCompleted: number;
  userAccuracy: number;
  cloudPeers: GlobalCognitivePeer[];
  sortMode: 'composite' | 'levels' | 'accuracy';
}): GlobalRankComparisonResult {
  const peerMap = new Map<string, GlobalCognitivePeer>();

  for (const base of CALIBRATED_GLOBAL_PEERS) {
    peerMap.set(base.userId, {
      ...base,
      compositeScore: computeCompositeScore(base.levelsCompleted, base.accuracy),
    });
  }

  for (const cloud of params.cloudPeers) {
    if (cloud.userId === params.currentUserId) continue;
    peerMap.set(cloud.userId, cloud);
  }

  const currentUserEntry: GlobalCognitivePeer = {
    id: 'current-user-rank',
    userId: params.currentUserId,
    userName: params.userName || '认知探索者',
    userAvatar: params.userAvatar || DEFAULT_USER.avatar,
    userTitle: params.userTitle || '认知探索者',
    levelsCompleted: Math.max(0, params.userLevelsCompleted),
    capitalsCompleted: Math.max(0, params.userCapitalsCompleted),
    accuracy: Math.max(0, Math.min(100, params.userAccuracy)),
    compositeScore: computeCompositeScore(
      Math.max(0, params.userLevelsCompleted),
      Math.max(0, Math.min(100, params.userAccuracy))
    ),
    isCurrentUser: true,
    isCloudVerified: Boolean(auth.currentUser),
  };

  peerMap.set(params.currentUserId, currentUserEntry);

  const allPeers = Array.from(peerMap.values());

  const comparator = (a: GlobalCognitivePeer, b: GlobalCognitivePeer): number => {
    if (params.sortMode === 'levels') {
      if (b.levelsCompleted !== a.levelsCompleted) return b.levelsCompleted - a.levelsCompleted;
      if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
      return b.compositeScore - a.compositeScore;
    }
    if (params.sortMode === 'accuracy') {
      if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
      if (b.levelsCompleted !== a.levelsCompleted) return b.levelsCompleted - a.levelsCompleted;
      return b.compositeScore - a.compositeScore;
    }
    if (b.compositeScore !== a.compositeScore) return b.compositeScore - a.compositeScore;
    return b.levelsCompleted - a.levelsCompleted;
  };

  const sorted = [...allPeers].sort(comparator);
  const rankIdx = sorted.findIndex((p) => p.isCurrentUser);
  const userRank = rankIdx >= 0 ? rankIdx + 1 : sorted.length;
  const totalCohortSize = sorted.length;

  const outperformedCount = Math.max(0, totalCohortSize - userRank);
  const percentile =
    totalCohortSize > 1
      ? Math.max(1, Math.min(99, Math.round((outperformedCount / (totalCohortSize - 1)) * 100)))
      : 50;

  const avgLevels = Math.round(
    allPeers.reduce((sum, p) => sum + p.levelsCompleted, 0) / Math.max(1, allPeers.length)
  );
  const avgAccuracy = Math.round(
    allPeers.reduce((sum, p) => sum + p.accuracy, 0) / Math.max(1, allPeers.length)
  );

  const levelsSorted = [...allPeers].sort((a, b) => b.levelsCompleted - a.levelsCompleted);
  const accSorted = [...allPeers].sort((a, b) => b.accuracy - a.accuracy);
  const topIndex = Math.max(0, Math.floor(allPeers.length * 0.1));

  return {
    userRank,
    totalCohortSize,
    percentile,
    cohortAvgLevels: avgLevels,
    cohortAvgAccuracy: avgAccuracy,
    topTenPercentLevels: levelsSorted[topIndex]?.levelsCompleted ?? 245,
    topTenPercentAccuracy: accSorted[topIndex]?.accuracy ?? 94,
    peers: sorted,
  };
}

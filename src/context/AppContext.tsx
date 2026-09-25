import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import {
  auth,
  db,
  signInWithGoogle,
  logOutFirebase,
  handleFirestoreError,
  OperationType,
} from '../firebase';
import { UserProfile, GameResult, PsychologyLaw, Badge } from '../types';
import { INITIAL_PSYCHOLOGY_LAWS } from '../data/laws';
import { BADGES_DATA } from '../data/badges';

interface AppContextType {
  user: UserProfile;
  firebaseUser: FirebaseUser | null;
  authReady: boolean;
  isSyncing: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateGoals: (goals: string[]) => void;
  laws: PsychologyLaw[];
  badges: Badge[];
  addXP: (amount: number, reason?: string) => void;
  toggleBookmark: (lawId: string) => void;
  isBookmarked: (lawId: string) => boolean;
  recordGameResult: (gameId: string, result: GameResult) => void;
  recordQuizCompletion: (correctCount: number, total: number, earnedXp: number) => void;
  updateLawMastery: (lawId: string, newMastery: number) => void;
  completeDailyChallenge: () => void;
  isDailyChallengeCompleted: boolean;
  completeOnboarding: (goals: string[]) => void;
  resetProgress: () => void;
  triggerConfetti: () => void;
  aiTutorOpen: boolean;
  setAiTutorOpen: (open: boolean) => void;
  activeContextLaw: PsychologyLaw | null;
  setActiveContextLaw: (law: PsychologyLaw | null) => void;
}

const STORAGE_KEY = 'mindlabz_user_profile_v1';

// Validation constants synchronized with firebase-blueprint.json & firestore.rules
const MAX_NAME_LEN = 100;
const MAX_AVATAR_LEN = 1000;
const MAX_TITLE_LEN = 60;
const MAX_STRING_LIST_ITEM_LEN = 100;

const DEFAULT_USER: UserProfile = {
  name: 'Alex Chen',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
  title: '认知探索者',
  level: 12,
  xp: 1250,
  streak: 7,
  lastActiveDate: new Date().toISOString().split('T')[0],
  totalGames: 86,
  totalQuizzes: 42,
  quizPoints: 1860,
  lawsMastered: ['zeigarnik-effect', 'confirmation-bias', 'anchoring-effect', 'loss-aversion', 'peak-end-rule'],
  lawMasteryMap: {
    'zeigarnik-effect': 85,
    'confirmation-bias': 90,
    'anchoring-effect': 75,
    'loss-aversion': 80,
    'peak-end-rule': 88,
    'choice-overload': 65,
    'sunk-cost-fallacy': 92,
    'halo-effect': 84,
    'bystander-effect': 85,
    'spotlight-effect': 91,
    'ikea-effect': 93,
    'dunning-kruger-effect': 88,
  },
  bookmarks: ['zeigarnik-effect', 'confirmation-bias', 'loss-aversion'],
  gameHighScores: {
    'memory-lab': 8450,
    'mind-trap': 5210,
    'brain-rush': 12050,
    'mind-detective': 6800,
    'psych-experiment': 9200,
  },
  unlockedBadges: ['streak-7', 'cognitive-hunter', 'speed-quiz-master'],
  selectedGoals: ['空间与序列记忆 (Memory)', '专注力与抗干扰 (Attention)', '理性决策与去偏见 (Decision)'],
  hasCompletedOnboarding: true,
  stats: {
    memory: 82,
    attention: 88,
    reasoning: 75,
    knowledge: 90,
    decision: 84,
  },
  weeklyActivity: [
    { day: '周一', date: '08-24', minutes: 12, xp: 240, completed: true },
    { day: '周二', date: '08-25', minutes: 15, xp: 320, completed: true },
    { day: '周三', date: '08-26', minutes: 10, xp: 180, completed: true },
    { day: '周四', date: '08-27', minutes: 18, xp: 390, completed: true },
    { day: '周五', date: '08-28', minutes: 14, xp: 280, completed: true },
    { day: '周六', date: '08-29', minutes: 20, xp: 450, completed: true },
    { day: '周日', date: '08-30', minutes: 16, xp: 350, completed: true },
  ],
};

function sanitizeStringList(list: unknown, maxItems: number): string[] {
  if (!Array.isArray(list)) return [];
  return list
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .map((item) => item.trim().slice(0, MAX_STRING_LIST_ITEM_LEN))
    .slice(0, maxItems);
}

function buildSanitizedBaseFields(
  uid: string,
  profile: UserProfile,
  isDailyChallengeCompleted: boolean
) {
  const safeName = (profile.name || '认知探索者').trim().slice(0, MAX_NAME_LEN) || '认知探索者';
  const safeAvatar = (profile.avatar || DEFAULT_USER.avatar).trim().slice(0, MAX_AVATAR_LEN) || DEFAULT_USER.avatar;
  const safeTitle = (profile.title || '认知探索者').trim().slice(0, MAX_TITLE_LEN) || '认知探索者';
  const safeDate = (profile.lastActiveDate || new Date().toISOString().split('T')[0]).slice(0, 20);

  return {
    uid: uid.slice(0, 128),
    name: safeName,
    avatar: safeAvatar,
    title: safeTitle,
    level: Math.max(1, Math.min(1000, Math.round(profile.level || 1))),
    xp: Math.max(0, Math.min(10000000, Math.round(profile.xp || 0))),
    streak: Math.max(0, Math.min(10000, Math.round(profile.streak || 0))),
    lastActiveDate: safeDate,
    totalGames: Math.max(0, Math.min(1000000, Math.round(profile.totalGames || 0))),
    totalQuizzes: Math.max(0, Math.min(1000000, Math.round(profile.totalQuizzes || 0))),
    quizPoints: Math.max(0, Math.min(10000000, Math.round(profile.quizPoints || 0))),
    lawsMastered: sanitizeStringList(profile.lawsMastered, 120),
    lawMasteryMap: profile.lawMasteryMap || {},
    bookmarks: sanitizeStringList(profile.bookmarks, 120),
    gameHighScores: profile.gameHighScores || {},
    unlockedBadges: sanitizeStringList(profile.unlockedBadges, 50),
    selectedGoals: sanitizeStringList(profile.selectedGoals, 20),
    hasCompletedOnboarding: Boolean(profile.hasCompletedOnboarding),
    isDailyChallengeCompleted: Boolean(isDailyChallengeCompleted),
    stats: {
      memory: Math.max(0, Math.min(100, Math.round(profile.stats?.memory ?? 80))),
      attention: Math.max(0, Math.min(100, Math.round(profile.stats?.attention ?? 80))),
      reasoning: Math.max(0, Math.min(100, Math.round(profile.stats?.reasoning ?? 80))),
      knowledge: Math.max(0, Math.min(100, Math.round(profile.stats?.knowledge ?? 80))),
      decision: Math.max(0, Math.min(100, Math.round(profile.stats?.decision ?? 80))),
    },
    weeklyActivity: (profile.weeklyActivity || []).slice(0, 14).map((item) => ({
      day: String(item.day || '周一').slice(0, 20),
      date: String(item.date || '08-30').slice(0, 20),
      minutes: Math.max(0, Math.min(1440, Math.round(item.minutes || 0))),
      xp: Math.max(0, Math.min(100000, Math.round(item.xp || 0))),
      completed: Boolean(item.completed),
    })),
  };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load user state from localStorage', e);
    }
    return DEFAULT_USER;
  });

  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const [laws] = useState<PsychologyLaw[]>(INITIAL_PSYCHOLOGY_LAWS);
  const [badges] = useState<Badge[]>(BADGES_DATA);
  const [isDailyChallengeCompleted, setIsDailyChallengeCompleted] = useState<boolean>(false);
  const [aiTutorOpen, setAiTutorOpen] = useState<boolean>(false);
  const [activeContextLaw, setActiveContextLaw] = useState<PsychologyLaw | null>(null);

  const userRef = useRef<UserProfile>(user);
  userRef.current = user;
  const dailyCompletedRef = useRef<boolean>(isDailyChallengeCompleted);
  dailyCompletedRef.current = isDailyChallengeCompleted;

  // Persist to localStorage as instant offline cache
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } catch (e) {
      console.error('Failed to save user state to localStorage', e);
    }
  }, [user]);

  // Listen to Firebase Auth state & attach Firestore onSnapshot listener when signed in
  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setFirebaseUser(currentUser);
      setAuthReady(true);

      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      if (currentUser) {
        const userDocPath = `users/${currentUser.uid}`;
        const userDocRef = doc(db, 'users', currentUser.uid);
        setIsSyncing(true);

        unsubscribeSnapshot = onSnapshot(
          userDocRef,
          async (snapshot) => {
            if (snapshot.exists()) {
              const data = snapshot.data();
              setUser((prev) => ({
                ...prev,
                name: typeof data.name === 'string' ? data.name : prev.name,
                avatar: typeof data.avatar === 'string' ? data.avatar : prev.avatar,
                title: typeof data.title === 'string' ? data.title : prev.title,
                level: typeof data.level === 'number' ? data.level : prev.level,
                xp: typeof data.xp === 'number' ? data.xp : prev.xp,
                streak: typeof data.streak === 'number' ? data.streak : prev.streak,
                lastActiveDate:
                  typeof data.lastActiveDate === 'string' ? data.lastActiveDate : prev.lastActiveDate,
                totalGames: typeof data.totalGames === 'number' ? data.totalGames : prev.totalGames,
                totalQuizzes: typeof data.totalQuizzes === 'number' ? data.totalQuizzes : prev.totalQuizzes,
                quizPoints: typeof data.quizPoints === 'number' ? data.quizPoints : prev.quizPoints,
                lawsMastered: Array.isArray(data.lawsMastered) ? data.lawsMastered : prev.lawsMastered,
                lawMasteryMap:
                  data.lawMasteryMap && typeof data.lawMasteryMap === 'object'
                    ? data.lawMasteryMap
                    : prev.lawMasteryMap,
                bookmarks: Array.isArray(data.bookmarks) ? data.bookmarks : prev.bookmarks,
                gameHighScores:
                  data.gameHighScores && typeof data.gameHighScores === 'object'
                    ? data.gameHighScores
                    : prev.gameHighScores,
                unlockedBadges: Array.isArray(data.unlockedBadges) ? data.unlockedBadges : prev.unlockedBadges,
                selectedGoals: Array.isArray(data.selectedGoals) ? data.selectedGoals : prev.selectedGoals,
                hasCompletedOnboarding:
                  typeof data.hasCompletedOnboarding === 'boolean'
                    ? data.hasCompletedOnboarding
                    : prev.hasCompletedOnboarding,
                stats:
                  data.stats && typeof data.stats === 'object'
                    ? { ...prev.stats, ...data.stats }
                    : prev.stats,
                weeklyActivity: Array.isArray(data.weeklyActivity)
                  ? data.weeklyActivity
                  : prev.weeklyActivity,
              }));
              if (typeof data.isDailyChallengeCompleted === 'boolean') {
                setIsDailyChallengeCompleted(data.isDailyChallengeCompleted);
              }
              setIsSyncing(false);
            } else {
              // Initialize new cloud document for this Google user
              const initialProfile: UserProfile = {
                ...userRef.current,
                name: currentUser.displayName || userRef.current.name,
                avatar: currentUser.photoURL || userRef.current.avatar,
              };
              const baseFields = buildSanitizedBaseFields(
                currentUser.uid,
                initialProfile,
                dailyCompletedRef.current
              );
              try {
                await setDoc(userDocRef, {
                  ...baseFields,
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp(),
                });
              } catch (err) {
                handleFirestoreError(err, OperationType.CREATE, userDocPath);
              } finally {
                setIsSyncing(false);
              }
            }
          },
          (error) => {
            setIsSyncing(false);
            handleFirestoreError(error, OperationType.GET, userDocPath);
          }
        );
      } else {
        setIsSyncing(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
      }
    };
  }, []);

  // Helper to persist updated UserProfile to Firestore when user is authenticated
  const syncProfileToFirestore = async (
    nextProfile: UserProfile,
    nextDailyCompleted: boolean = dailyCompletedRef.current
  ) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const userDocPath = `users/${currentUser.uid}`;
    const userDocRef = doc(db, 'users', currentUser.uid);
    const baseFields = buildSanitizedBaseFields(currentUser.uid, nextProfile, nextDailyCompleted);
    // Exclude immutable `uid` so affectedKeys() only contains mutable fields
    const { uid: _uid, ...mutableFields } = baseFields;

    setIsSyncing(true);
    try {
      await updateDoc(userDocRef, {
        ...mutableFields,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, userDocPath);
    } finally {
      setIsSyncing(false);
    }
  };

  const loginWithGoogle = async () => {
    await signInWithGoogle();
  };

  const logout = async () => {
    await logOutFirebase();
  };

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6C4CF1', '#FFB72B', '#00A699', '#532CD8', '#FFFFFF'],
      });
    } catch (e) {
      // ignore in environments without canvas
    }
  };

  const updateUserAndSync = (updater: (prev: UserProfile) => UserProfile) => {
    setUser((prev) => {
      const next = updater(prev);
      void syncProfileToFirestore(next, dailyCompletedRef.current);
      return next;
    });
  };

  const addXP = (amount: number, _reason?: string) => {
    updateUserAndSync((prev) => {
      const newXp = prev.xp + amount;
      const newLevel = Math.max(prev.level, Math.floor(newXp / 400) + 1);
      return {
        ...prev,
        xp: newXp,
        level: newLevel,
      };
    });
  };

  const toggleBookmark = (lawId: string) => {
    updateUserAndSync((prev) => {
      const alreadyBookmarked = prev.bookmarks.includes(lawId);
      const newBookmarks = alreadyBookmarked
        ? prev.bookmarks.filter((id) => id !== lawId)
        : [...prev.bookmarks, lawId];
      return { ...prev, bookmarks: newBookmarks };
    });
  };

  const isBookmarked = (lawId: string) => user.bookmarks.includes(lawId);

  const recordGameResult = (gameId: string, result: GameResult) => {
    updateUserAndSync((prev) => {
      const currentHigh = prev.gameHighScores[gameId] || 0;
      const newHigh = Math.max(currentHigh, result.score);
      const newTotalGames = prev.totalGames + 1;

      const updatedStats = { ...prev.stats };
      if (gameId === 'memory-lab') {
        updatedStats.memory = Math.min(100, Math.round(updatedStats.memory * 0.9 + result.accuracy * 0.1));
      } else if (gameId === 'mind-trap') {
        updatedStats.reasoning = Math.min(100, Math.round(updatedStats.reasoning * 0.9 + result.accuracy * 0.1));
      } else if (gameId === 'brain-rush') {
        updatedStats.attention = Math.min(100, Math.round(updatedStats.attention * 0.9 + result.accuracy * 0.1));
      } else if (gameId === 'mind-detective') {
        updatedStats.knowledge = Math.min(100, Math.round(updatedStats.knowledge * 0.9 + result.accuracy * 0.1));
      } else if (gameId === 'psych-experiment') {
        updatedStats.decision = Math.min(100, Math.round(updatedStats.decision * 0.9 + result.accuracy * 0.1));
      }

      const unlockedBadges = [...prev.unlockedBadges];
      if (gameId === 'psych-experiment' && !unlockedBadges.includes('lab-experimenter')) {
        unlockedBadges.push('lab-experimenter');
      }
      if (gameId === 'memory-lab' && result.score >= 10000 && !unlockedBadges.includes('memory-palace-grandmaster')) {
        unlockedBadges.push('memory-palace-grandmaster');
      }

      const newXp = prev.xp + result.xpGained;
      const newLevel = Math.max(prev.level, Math.floor(newXp / 400) + 1);

      return {
        ...prev,
        xp: newXp,
        level: newLevel,
        totalGames: newTotalGames,
        gameHighScores: {
          ...prev.gameHighScores,
          [gameId]: newHigh,
        },
        stats: updatedStats,
        unlockedBadges,
      };
    });

    triggerConfetti();
  };

  const recordQuizCompletion = (correctCount: number, total: number, earnedXp: number) => {
    updateUserAndSync((prev) => {
      const accuracy = (correctCount / total) * 100;
      const unlockedBadges = [...prev.unlockedBadges];
      if (accuracy >= 90 && !unlockedBadges.includes('speed-quiz-master')) {
        unlockedBadges.push('speed-quiz-master');
      }

      const newXp = prev.xp + earnedXp;
      const newLevel = Math.max(prev.level, Math.floor(newXp / 400) + 1);

      return {
        ...prev,
        xp: newXp,
        level: newLevel,
        totalQuizzes: prev.totalQuizzes + 1,
        quizPoints: prev.quizPoints + earnedXp,
        unlockedBadges,
        stats: {
          ...prev.stats,
          knowledge: Math.min(100, Math.round(prev.stats.knowledge * 0.9 + accuracy * 0.1)),
        },
      };
    });

    triggerConfetti();
  };

  const updateLawMastery = (lawId: string, newMastery: number) => {
    updateUserAndSync((prev) => {
      const currentMastery = prev.lawMasteryMap[lawId] || 0;
      const finalMastery = Math.max(currentMastery, newMastery);
      const isMastered = finalMastery >= 80;
      const lawsMastered =
        isMastered && !prev.lawsMastered.includes(lawId)
          ? [...prev.lawsMastered, lawId]
          : prev.lawsMastered;

      return {
        ...prev,
        lawsMastered,
        lawMasteryMap: {
          ...prev.lawMasteryMap,
          [lawId]: finalMastery,
        },
      };
    });
  };

  const completeDailyChallenge = () => {
    if (isDailyChallengeCompleted) return;
    setIsDailyChallengeCompleted(true);
    dailyCompletedRef.current = true;
    setUser((prev) => {
      const newXp = prev.xp + 500;
      const newLevel = Math.max(prev.level, Math.floor(newXp / 400) + 1);
      const next = {
        ...prev,
        xp: newXp,
        level: newLevel,
      };
      void syncProfileToFirestore(next, true);
      return next;
    });
    triggerConfetti();
  };

  const completeOnboarding = (goals: string[]) => {
    updateUserAndSync((prev) => ({
      ...prev,
      hasCompletedOnboarding: true,
      selectedGoals: goals,
    }));
  };

  const updateGoals = (goals: string[]) => {
    updateUserAndSync((prev) => ({
      ...prev,
      selectedGoals: goals,
    }));
  };

  const resetProgress = () => {
    localStorage.removeItem(STORAGE_KEY);
    const resetProfile: UserProfile = {
      ...DEFAULT_USER,
      name: firebaseUser?.displayName || DEFAULT_USER.name,
      avatar: firebaseUser?.photoURL || DEFAULT_USER.avatar,
    };
    setIsDailyChallengeCompleted(false);
    dailyCompletedRef.current = false;
    setUser(resetProfile);
    void syncProfileToFirestore(resetProfile, false);
  };

  return (
    <AppContext.Provider
      value={{
        user,
        firebaseUser,
        authReady,
        isSyncing,
        loginWithGoogle,
        logout,
        updateGoals,
        laws,
        badges,
        addXP,
        toggleBookmark,
        isBookmarked,
        recordGameResult,
        recordQuizCompletion,
        updateLawMastery,
        completeDailyChallenge,
        isDailyChallengeCompleted,
        completeOnboarding,
        resetProgress,
        triggerConfetti,
        aiTutorOpen,
        setAiTutorOpen,
        activeContextLaw,
        setActiveContextLaw,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

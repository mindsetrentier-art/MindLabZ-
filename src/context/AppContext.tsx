import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { UserProfile, GameResult, PsychologyLaw, Badge } from '../types';
import { INITIAL_PSYCHOLOGY_LAWS } from '../data/laws';
import { BADGES_DATA } from '../data/badges';

interface AppContextType {
  user: UserProfile;
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
    'dunning-kruger-effect': 88
  },
  bookmarks: ['zeigarnik-effect', 'confirmation-bias', 'loss-aversion'],
  gameHighScores: {
    'memory-lab': 8450,
    'mind-trap': 5210,
    'brain-rush': 12050,
    'mind-detective': 6800,
    'psych-experiment': 9200
  },
  unlockedBadges: ['streak-7', 'cognitive-hunter', 'speed-quiz-master'],
  selectedGoals: ['Memory', 'Attention', 'Decision Making', 'Psychology Knowledge'],
  hasCompletedOnboarding: true,
  stats: {
    memory: 82,
    attention: 88,
    reasoning: 75,
    knowledge: 90,
    decision: 84
  },
  weeklyActivity: [
    { day: '周一', date: '08-24', minutes: 12, xp: 240, completed: true },
    { day: '周二', date: '08-25', minutes: 15, xp: 320, completed: true },
    { day: '周三', date: '08-26', minutes: 10, xp: 180, completed: true },
    { day: '周四', date: '08-27', minutes: 18, xp: 390, completed: true },
    { day: '周五', date: '08-28', minutes: 14, xp: 280, completed: true },
    { day: '周六', date: '08-29', minutes: 20, xp: 450, completed: true },
    { day: '周日', date: '08-30', minutes: 16, xp: 350, completed: true },
  ]
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Failed to load user state from localStorage", e);
    }
    return DEFAULT_USER;
  });

  const [laws, setLaws] = useState<PsychologyLaw[]>(INITIAL_PSYCHOLOGY_LAWS);
  const [badges, setBadges] = useState<Badge[]>(BADGES_DATA);
  const [isDailyChallengeCompleted, setIsDailyChallengeCompleted] = useState<boolean>(false);
  const [aiTutorOpen, setAiTutorOpen] = useState<boolean>(false);
  const [activeContextLaw, setActiveContextLaw] = useState<PsychologyLaw | null>(null);

  // Sync with localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } catch (e) {
      console.error("Failed to save user state to localStorage", e);
    }
  }, [user]);

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6C4CF1', '#FFB72B', '#00A699', '#532CD8', '#FFFFFF']
      });
    } catch (e) {
      // ignore in environments without canvas
    }
  };

  const addXP = (amount: number, reason?: string) => {
    setUser(prev => {
      const newXp = prev.xp + amount;
      // Level formula: level = Math.floor(newXp / 500) + 1
      const newLevel = Math.max(prev.level, Math.floor(newXp / 400) + 1);
      
      return {
        ...prev,
        xp: newXp,
        level: newLevel
      };
    });
  };

  const toggleBookmark = (lawId: string) => {
    setUser(prev => {
      const isBookmarked = prev.bookmarks.includes(lawId);
      const newBookmarks = isBookmarked
        ? prev.bookmarks.filter(id => id !== lawId)
        : [...prev.bookmarks, lawId];
      return { ...prev, bookmarks: newBookmarks };
    });
  };

  const isBookmarked = (lawId: string) => user.bookmarks.includes(lawId);

  const recordGameResult = (gameId: string, result: GameResult) => {
    setUser(prev => {
      const currentHigh = prev.gameHighScores[gameId] || 0;
      const newHigh = Math.max(currentHigh, result.score);
      const newTotalGames = prev.totalGames + 1;

      // Update related stats
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

      // Check experimenter badge
      let unlockedBadges = [...prev.unlockedBadges];
      if (gameId === 'psych-experiment' && !unlockedBadges.includes('lab-experimenter')) {
        unlockedBadges.push('lab-experimenter');
      }
      if (gameId === 'memory-lab' && result.score >= 10000 && !unlockedBadges.includes('memory-palace-grandmaster')) {
        unlockedBadges.push('memory-palace-grandmaster');
      }

      return {
        ...prev,
        totalGames: newTotalGames,
        gameHighScores: {
          ...prev.gameHighScores,
          [gameId]: newHigh
        },
        stats: updatedStats,
        unlockedBadges
      };
    });

    addXP(result.xpGained);
    triggerConfetti();
  };

  const recordQuizCompletion = (correctCount: number, total: number, earnedXp: number) => {
    setUser(prev => {
      const accuracy = (correctCount / total) * 100;
      let unlockedBadges = [...prev.unlockedBadges];
      if (accuracy >= 90 && !unlockedBadges.includes('speed-quiz-master')) {
        unlockedBadges.push('speed-quiz-master');
      }

      return {
        ...prev,
        totalQuizzes: prev.totalQuizzes + 1,
        quizPoints: prev.quizPoints + earnedXp,
        unlockedBadges,
        stats: {
          ...prev.stats,
          knowledge: Math.min(100, Math.round(prev.stats.knowledge * 0.9 + accuracy * 0.1))
        }
      };
    });

    addXP(earnedXp);
    triggerConfetti();
  };

  const updateLawMastery = (lawId: string, newMastery: number) => {
    setUser(prev => {
      const currentMastery = prev.lawMasteryMap[lawId] || 0;
      const finalMastery = Math.max(currentMastery, newMastery);
      const isMastered = finalMastery >= 80;
      const lawsMastered = isMastered && !prev.lawsMastered.includes(lawId)
        ? [...prev.lawsMastered, lawId]
        : prev.lawsMastered;

      return {
        ...prev,
        lawsMastered,
        lawMasteryMap: {
          ...prev.lawMasteryMap,
          [lawId]: finalMastery
        }
      };
    });
  };

  const completeDailyChallenge = () => {
    if (isDailyChallengeCompleted) return;
    setIsDailyChallengeCompleted(true);
    addXP(500, '今日挑战达成');
    triggerConfetti();
  };

  const completeOnboarding = (goals: string[]) => {
    setUser(prev => ({
      ...prev,
      hasCompletedOnboarding: true,
      selectedGoals: goals
    }));
  };

  const resetProgress = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(DEFAULT_USER);
  };

  return (
    <AppContext.Provider
      value={{
        user,
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
        setActiveContextLaw
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

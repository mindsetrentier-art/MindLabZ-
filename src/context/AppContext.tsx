import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import {
  auth,
  db,
  signInWithGoogle,
  signInWithGoogleRedirect,
  signInAsGuestCloud,
  checkPendingRedirectSignIn,
  logOutFirebase,
  diagnoseFirebaseAuthError,
  AuthErrorDiagnostic,
  isMobileBrowser,
  handleFirestoreError,
  OperationType,
} from '../firebase';
import { UserProfile, GameResult, PsychologyLaw, Badge, CognitiveJournalEntry } from '../types';
import { INITIAL_PSYCHOLOGY_LAWS } from '../data/laws';
import { BADGES_DATA } from '../data/badges';
import {
  subscribeToJournals,
  saveJournalEntry,
  deleteJournalEntry,
  loadLocalJournals,
} from '../services/journalService';
import { submitGameScoreToLeaderboard } from '../services/leaderboardService';
import { evaluateAndUnlockBadges } from '../services/badgeService';

export interface LocalUserAccount {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

interface AppContextType {
  user: UserProfile;
  firebaseUser: FirebaseUser | null;
  activeAccountEmail: string | null;
  savedAccounts: LocalUserAccount[];
  authReady: boolean;
  isSyncing: boolean;
  authDiagnostic: AuthErrorDiagnostic | null;
  setAuthDiagnostic: (diag: AuthErrorDiagnostic | null) => void;
  authLoading: boolean;
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  authToastMessage: string | null;
  setAuthToastMessage: (msg: string | null) => void;
  loginWithGoogle: (mode?: 'popup' | 'redirect') => Promise<void>;
  loginWithGoogleRedirect: () => Promise<void>;
  loginAsGuestCloud: () => Promise<void>;
  switchGoogleAccount: () => Promise<void>;
  loginAsCustomUser: (name: string, email: string) => void;
  switchSavedAccount: (account: LocalUserAccount) => void;
  exportProfileDataJson: () => string;
  importProfileDataJson: (jsonStr: string) => boolean;
  logout: () => Promise<void>;
  updateGoals: (goals: string[]) => void;
  laws: PsychologyLaw[];
  badges: Badge[];
  newUnlockedBadge: Badge | null;
  setNewUnlockedBadge: (badge: Badge | null) => void;
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
  journals: CognitiveJournalEntry[];
  saveJournal: (entry: Omit<CognitiveJournalEntry, 'createdAt' | 'updatedAt'>) => Promise<CognitiveJournalEntry>;
  deleteJournal: (entryId: string) => Promise<void>;
  composerOpen: boolean;
  setComposerOpen: (open: boolean) => void;
  composerPreload: Partial<CognitiveJournalEntry> | null;
  openComposerWithPreload: (preload?: Partial<CognitiveJournalEntry>) => void;
  breathingOpen: boolean;
  setBreathingOpen: (open: boolean) => void;
  pwaModalOpen: boolean;
  setPwaModalOpen: (open: boolean) => void;
  openPwaModal: () => void;
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
  completedGames: [],
  gameCompletionCount: {},
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
    completedGames: sanitizeStringList(profile.completedGames, 100),
    gameCompletionCount: profile.gameCompletionCount || {},
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
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return {
            ...DEFAULT_USER,
            ...parsed,
            stats: { ...DEFAULT_USER.stats, ...(parsed.stats || {}) },
            gameHighScores: { ...DEFAULT_USER.gameHighScores, ...(parsed.gameHighScores || {}) },
            unlockedBadges: Array.isArray(parsed.unlockedBadges) ? parsed.unlockedBadges : DEFAULT_USER.unlockedBadges,
            lawsMastered: Array.isArray(parsed.lawsMastered) ? parsed.lawsMastered : DEFAULT_USER.lawsMastered,
            bookmarks: Array.isArray(parsed.bookmarks) ? parsed.bookmarks : DEFAULT_USER.bookmarks,
            selectedGoals: Array.isArray(parsed.selectedGoals) ? parsed.selectedGoals : DEFAULT_USER.selectedGoals,
            weeklyActivity: Array.isArray(parsed.weeklyActivity) ? parsed.weeklyActivity : DEFAULT_USER.weeklyActivity,
          };
        }
      }
    } catch (e) {
      console.error('Failed to load user state from localStorage', e);
    }
    return DEFAULT_USER;
  });

  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [activeAccountEmail, setActiveAccountEmail] = useState<string | null>(() => {
    return localStorage.getItem('mindlabz_active_email_v1') || null;
  });
  const [savedAccounts, setSavedAccounts] = useState<LocalUserAccount[]>(() => {
    try {
      const raw = localStorage.getItem('mindlabz_saved_accounts_v1');
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    return [
      {
        id: 'alex-chen',
        name: 'Alex Chen',
        email: 'alex.chen@mindlabz.app',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
      },
    ];
  });
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [authDiagnostic, setAuthDiagnostic] = useState<AuthErrorDiagnostic | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authToastMessage, setAuthToastMessage] = useState<string | null>(null);

  const openAuthModal = () => setAuthModalOpen(true);
  const closeAuthModal = () => setAuthModalOpen(false);

  const [laws] = useState<PsychologyLaw[]>(INITIAL_PSYCHOLOGY_LAWS);
  const [badges] = useState<Badge[]>(BADGES_DATA);
  const [newUnlockedBadge, setNewUnlockedBadge] = useState<Badge | null>(null);
  const [isDailyChallengeCompleted, setIsDailyChallengeCompleted] = useState<boolean>(false);
  const [aiTutorOpen, setAiTutorOpen] = useState<boolean>(false);
  const [activeContextLaw, setActiveContextLaw] = useState<PsychologyLaw | null>(null);

  // Cognitive Journal State
  const [journals, setJournals] = useState<CognitiveJournalEntry[]>(() => {
    return loadLocalJournals(null);
  });
  const [composerOpen, setComposerOpen] = useState<boolean>(false);
  const [composerPreload, setComposerPreload] = useState<Partial<CognitiveJournalEntry> | null>(null);

  // Focused Breathing State
  const [breathingOpen, setBreathingOpen] = useState<boolean>(false);

  // PWA & Desktop App Icon Installation Modal
  const [pwaModalOpen, setPwaModalOpen] = useState<boolean>(false);
  const openPwaModal = () => setPwaModalOpen(true);

  const openComposerWithPreload = (preload?: Partial<CognitiveJournalEntry>) => {
    setComposerPreload(preload || null);
    setComposerOpen(true);
  };

  const userRef = useRef<UserProfile>(user);
  userRef.current = user;
  const dailyCompletedRef = useRef<boolean>(isDailyChallengeCompleted);
  dailyCompletedRef.current = isDailyChallengeCompleted;
  const cloudDocExistsRef = useRef<boolean>(false);

  // Persist to localStorage as instant offline cache (and per-account storage)
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      if (activeAccountEmail) {
        localStorage.setItem(`mindlabz_profile_${activeAccountEmail.toLowerCase()}`, JSON.stringify(user));
      }
    } catch (e) {
      console.error('Failed to save user state to localStorage', e);
    }
  }, [user, activeAccountEmail]);

  const registerSavedAccount = (account: LocalUserAccount) => {
    setSavedAccounts((prev) => {
      const filtered = prev.filter((a) => a.email.toLowerCase() !== account.email.toLowerCase());
      const next = [account, ...filtered].slice(0, 10);
      try {
        localStorage.setItem('mindlabz_saved_accounts_v1', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Listen to Firebase Auth state & attach Firestore onSnapshot listener when signed in
  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | null = null;
    let isMounted = true;

    // Process any pending OAuth redirect result on startup with full diagnostic capture
    void (async () => {
      try {
        const outcome = await checkPendingRedirectSignIn();
        if (!isMounted) return;
        if (outcome.error) {
          const diag = diagnoseFirebaseAuthError(outcome.error);
          setAuthDiagnostic(diag);
          setAuthToastMessage(`Authentification : ${diag.titleFr}`);
        } else if (outcome.credential) {
          setAuthToastMessage('Connexion Google réussie ! Vos données sont synchronisées.');
          triggerConfetti();
        }
      } catch (err) {
        if (!isMounted) return;
        const diag = diagnoseFirebaseAuthError(err);
        setAuthDiagnostic(diag);
      }
    })();

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setFirebaseUser(currentUser);
      setAuthReady(true);
      cloudDocExistsRef.current = false;

      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      if (currentUser) {
        const isAnon = currentUser.isAnonymous;
        const fallbackName = isAnon
          ? 'Explorateur Cloud (Mobile/Web)'
          : (currentUser.displayName ||
             (currentUser.email ? currentUser.email.split('@')[0] : 'Explorateur MindLabZ'));
        const fallbackAvatar = currentUser.photoURL || DEFAULT_USER.avatar;

        if (currentUser.email) {
          setActiveAccountEmail(currentUser.email);
          localStorage.setItem('mindlabz_active_email_v1', currentUser.email);
          registerSavedAccount({
            id: currentUser.uid,
            name: fallbackName,
            email: currentUser.email,
            avatar: fallbackAvatar,
          });
        }


        const userDocPath = `users/${currentUser.uid}`;
        const userDocRef = doc(db, 'users', currentUser.uid);
        setIsSyncing(true);

        unsubscribeSnapshot = onSnapshot(
          userDocRef,
          async (snapshot) => {
            if (snapshot.exists()) {
              cloudDocExistsRef.current = true;
              const data = snapshot.data();
              setUser((prev) => ({
                ...prev,
                name: typeof data.name === 'string' && data.name.trim() ? data.name : fallbackName,
                avatar: typeof data.avatar === 'string' && data.avatar.trim() ? data.avatar : fallbackAvatar,
                title: typeof data.title === 'string' ? data.title : prev.title,
                level: typeof data.level === 'number' ? data.level : prev.level,
                xp: typeof data.xp === 'number' ? data.xp : prev.xp,
                streak: typeof data.streak === 'number' ? data.streak : prev.streak,
                lastActiveDate:
                  typeof data.lastActiveDate === 'string' ? data.lastActiveDate : prev.lastActiveDate,
                totalGames: typeof data.totalGames === 'number' ? data.totalGames : prev.totalGames,
                totalQuizzes: typeof data.totalQuizzes === 'number' ? data.totalQuizzes : prev.totalQuizzes,
                quizPoints: typeof data.quizPoints === 'number' ? data.quizPoints : prev.quizPoints,
                lawsMastered: Array.isArray(data.lawsMastered) ? data.lawsMastered : (prev?.lawsMastered || DEFAULT_USER.lawsMastered),
                lawMasteryMap:
                  data.lawMasteryMap && typeof data.lawMasteryMap === 'object'
                    ? data.lawMasteryMap
                    : (prev?.lawMasteryMap || DEFAULT_USER.lawMasteryMap),
                bookmarks: Array.isArray(data.bookmarks) ? data.bookmarks : (prev?.bookmarks || DEFAULT_USER.bookmarks),
                gameHighScores:
                  data.gameHighScores && typeof data.gameHighScores === 'object'
                    ? data.gameHighScores
                    : (prev?.gameHighScores || DEFAULT_USER.gameHighScores),
                unlockedBadges: Array.isArray(data.unlockedBadges) ? data.unlockedBadges : (prev?.unlockedBadges || DEFAULT_USER.unlockedBadges),
                selectedGoals: Array.isArray(data.selectedGoals) ? data.selectedGoals : (prev?.selectedGoals || DEFAULT_USER.selectedGoals),
                hasCompletedOnboarding:
                  typeof data.hasCompletedOnboarding === 'boolean'
                    ? data.hasCompletedOnboarding
                    : (prev?.hasCompletedOnboarding ?? true),
                stats:
                  data.stats && typeof data.stats === 'object'
                    ? { ...DEFAULT_USER.stats, ...(prev?.stats || {}), ...data.stats }
                    : (prev?.stats || DEFAULT_USER.stats),
                weeklyActivity: Array.isArray(data.weeklyActivity)
                  ? data.weeklyActivity
                  : (prev?.weeklyActivity || DEFAULT_USER.weeklyActivity),
              }));
              if (typeof data.isDailyChallengeCompleted === 'boolean') {
                setIsDailyChallengeCompleted(data.isDailyChallengeCompleted);
              }
              setIsSyncing(false);
            } else {
              // Initialize new cloud document for this Google user cleanly
              const initialProfile: UserProfile = {
                ...DEFAULT_USER,
                name: fallbackName,
                avatar: fallbackAvatar,
              };
              setUser(initialProfile);
              const baseFields = buildSanitizedBaseFields(
                currentUser.uid,
                initialProfile,
                false
              );
              try {
                await setDoc(userDocRef, {
                  ...baseFields,
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp(),
                });
                cloudDocExistsRef.current = true;
              } catch (err) {
                console.warn('Firestore initial profile creation warning:', err);
              } finally {
                setIsSyncing(false);
              }
            }
          },
          (error) => {
            setIsSyncing(false);
            console.warn('Firestore snapshot listener warning:', error);
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
    const { uid: _uid, ...mutableFields } = baseFields;

    setIsSyncing(true);
    try {
      if (!cloudDocExistsRef.current) {
        await setDoc(userDocRef, {
          ...baseFields,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        cloudDocExistsRef.current = true;
      } else {
        await updateDoc(userDocRef, {
          ...mutableFields,
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.UPDATE, userDocPath);
      } catch {
        // Logged by handleFirestoreError; avoid crashing UI
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const loginWithGoogle = async (mode?: 'popup' | 'redirect') => {
    setAuthDiagnostic(null);
    setAuthLoading(true);
    try {
      if (mode === 'redirect' || (!mode && isMobileBrowser())) {
        await signInWithGoogleRedirect();
      } else {
        try {
          await signInWithGoogle();
          setAuthToastMessage('Connexion Google réussie !');
          triggerConfetti();
        } catch (popupErr: any) {
          const errCode = String(popupErr?.code || popupErr?.message || '');
          if (errCode.includes('popup-blocked') || isMobileBrowser()) {
            console.warn('Popup bloqué ou mobile détecté, bascule vers redirection...', popupErr);
            await signInWithGoogleRedirect();
            return;
          }
          throw popupErr;
        }
      }
    } catch (err: any) {
      const diag = diagnoseFirebaseAuthError(err);
      setAuthDiagnostic(diag);
      throw err;
    } finally {
      setAuthLoading(false);
    }
  };

  const loginWithGoogleRedirect = async () => {
    setAuthDiagnostic(null);
    setAuthLoading(true);
    try {
      await signInWithGoogleRedirect();
    } catch (err: any) {
      const diag = diagnoseFirebaseAuthError(err);
      setAuthDiagnostic(diag);
      setAuthLoading(false);
      throw err;
    }
  };

  const loginAsGuestCloud = async () => {
    setAuthDiagnostic(null);
    setAuthLoading(true);
    try {
      await signInAsGuestCloud();
      setAuthToastMessage('Session Cloud Firestore instantanée activée !');
      triggerConfetti();
    } catch (err: any) {
      const diag = diagnoseFirebaseAuthError(err);
      setAuthDiagnostic(diag);
      throw err;
    } finally {
      setAuthLoading(false);
    }
  };

  const switchGoogleAccount = async () => {
    await loginWithGoogle('popup');
  };

  const exportProfileDataJson = (): string => {
    const payload = {
      mindlabzVersion: '1.0',
      exportedAt: new Date().toISOString(),
      user,
      journals,
      activeAccountEmail,
    };
    return JSON.stringify(payload, null, 2);
  };

  const importProfileDataJson = (jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (!parsed || typeof parsed !== 'object') return false;
      if (parsed.user && typeof parsed.user === 'object') {
        const nextUser: UserProfile = {
          ...DEFAULT_USER,
          ...parsed.user,
          stats: {
            ...DEFAULT_USER.stats,
            ...(parsed.user.stats || {}),
          },
        };
        setUser(nextUser);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
        if (activeAccountEmail) {
          localStorage.setItem(`mindlabz_profile_${activeAccountEmail.toLowerCase()}`, JSON.stringify(nextUser));
        }
        if (auth.currentUser) {
          void syncProfileToFirestore(nextUser);
        }
      }
      if (Array.isArray(parsed.journals) && parsed.journals.length > 0) {
        setJournals(parsed.journals);
        parsed.journals.forEach((entry: any) => {
          void saveJournalEntry(auth.currentUser?.uid, entry);
        });
      }
      setAuthToastMessage('Profil et données importés avec succès !');
      triggerConfetti();
      return true;
    } catch (e) {
      console.error('Failed to import user profile JSON:', e);
      return false;
    }
  };

  const loginAsCustomUser = (name: string, email: string) => {
    const cleanName = name.trim() || email.split('@')[0] || 'Utilisateur MindLabZ';
    const cleanEmail = email.trim().toLowerCase() || `${cleanName.toLowerCase().replace(/\s+/g, '.')}@gmail.com`;
    const avatarUrl = `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(cleanEmail)}`;

    // Check if this user already has a saved profile in localStorage
    const existingRaw = localStorage.getItem(`mindlabz_profile_${cleanEmail}`);
    let nextProfile: UserProfile;
    if (existingRaw) {
      try {
        const parsed = JSON.parse(existingRaw);
        nextProfile = {
          ...DEFAULT_USER,
          ...parsed,
          name: cleanName,
          stats: { ...DEFAULT_USER.stats, ...(parsed?.stats || {}) },
          unlockedBadges: Array.isArray(parsed?.unlockedBadges) ? parsed.unlockedBadges : DEFAULT_USER.unlockedBadges,
          lawsMastered: Array.isArray(parsed?.lawsMastered) ? parsed.lawsMastered : DEFAULT_USER.lawsMastered,
          gameHighScores: { ...DEFAULT_USER.gameHighScores, ...(parsed?.gameHighScores || {}) },
        };
      } catch {
        nextProfile = { ...DEFAULT_USER, name: cleanName, avatar: avatarUrl };
      }
    } else {
      nextProfile = {
        ...DEFAULT_USER,
        name: cleanName,
        avatar: avatarUrl,
      };
    }

    setActiveAccountEmail(cleanEmail);
    localStorage.setItem('mindlabz_active_email_v1', cleanEmail);
    setUser(nextProfile);
    registerSavedAccount({
      id: cleanEmail,
      name: cleanName,
      email: cleanEmail,
      avatar: nextProfile.avatar,
    });
  };

  const switchSavedAccount = (account: LocalUserAccount) => {
    const cleanEmail = account.email.toLowerCase();
    const existingRaw = localStorage.getItem(`mindlabz_profile_${cleanEmail}`);
    if (existingRaw) {
      try {
        const parsed = JSON.parse(existingRaw);
        setUser({
          ...DEFAULT_USER,
          ...parsed,
          name: account.name,
          avatar: account.avatar,
          stats: { ...DEFAULT_USER.stats, ...(parsed?.stats || {}) },
          unlockedBadges: Array.isArray(parsed?.unlockedBadges) ? parsed.unlockedBadges : DEFAULT_USER.unlockedBadges,
          lawsMastered: Array.isArray(parsed?.lawsMastered) ? parsed.lawsMastered : DEFAULT_USER.lawsMastered,
          gameHighScores: { ...DEFAULT_USER.gameHighScores, ...(parsed?.gameHighScores || {}) },
        });
      } catch {
        setUser({ ...DEFAULT_USER, name: account.name, avatar: account.avatar });
      }
    } else {
      setUser({ ...DEFAULT_USER, name: account.name, avatar: account.avatar });
    }
    setActiveAccountEmail(account.email);
    localStorage.setItem('mindlabz_active_email_v1', account.email);
  };

  const logout = async () => {
    await logOutFirebase();
    setActiveAccountEmail(null);
    localStorage.removeItem('mindlabz_active_email_v1');
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

      // Track completion for 10 mini-games rule
      const completedGames = prev.completedGames ? [...prev.completedGames] : [];
      const gameCompletionCount = { ...(prev.gameCompletionCount || {}) };
      const prevCount = gameCompletionCount[gameId] || 0;
      const isFirstTime = prevCount === 0 || !completedGames.includes(gameId);

      if (!completedGames.includes(gameId)) {
        completedGames.push(gameId);
      }
      gameCompletionCount[gameId] = prevCount + 1;

      // Calculate XP according to prompt requirements:
      // First time: +30–45 XP (default 38-40 XP, or result.xpGained if higher)
      // Repeat: original reward's 25% (+8–11 XP)
      let actualXpGained = result.xpGained;
      if (isFirstTime) {
        actualXpGained = Math.max(35, Math.min(60, result.xpGained || 38));
      } else {
        actualXpGained = Math.max(8, Math.min(15, Math.round((result.xpGained || 38) * 0.25)));
      }

      const updatedStats = { ...prev.stats };
      if (gameId === 'memory-lab' || gameId === 'first-impression' || gameId === 'peak-end') {
        updatedStats.memory = Math.min(100, Math.round(updatedStats.memory * 0.9 + result.accuracy * 0.1));
      } else if (gameId === 'mind-trap' || gameId === 'falsification-challenge' || gameId === 'micro-habit') {
        updatedStats.reasoning = Math.min(100, Math.round(updatedStats.reasoning * 0.9 + result.accuracy * 0.1));
      } else if (gameId === 'brain-rush' || gameId === 'emotion-detective') {
        updatedStats.attention = Math.min(100, Math.round(updatedStats.attention * 0.9 + result.accuracy * 0.1));
      } else if (gameId === 'mind-detective' || gameId === 'attribution-shift' || gameId === 'bystander-breaker') {
        updatedStats.knowledge = Math.min(100, Math.round(updatedStats.knowledge * 0.9 + result.accuracy * 0.1));
      } else if (gameId === 'psych-experiment' || gameId === 'anchoring-lab' || gameId === 'majority-answer' || gameId === 'zero-price-trap') {
        updatedStats.decision = Math.min(100, Math.round(updatedStats.decision * 0.9 + result.accuracy * 0.1));
      }

      const candidateUser: UserProfile = {
        ...prev,
        xp: prev.xp + actualXpGained,
        level: Math.max(prev.level, Math.floor((prev.xp + actualXpGained) / 400) + 1),
        totalGames: newTotalGames,
        gameHighScores: {
          ...prev.gameHighScores,
          [gameId]: newHigh,
        },
        completedGames,
        gameCompletionCount,
        stats: updatedStats,
      };

      // Automatically evaluate and unlock cognitive medals
      const { updatedUser: profileWithBadges, newBadges } = evaluateAndUnlockBadges(candidateUser);
      if (newBadges.length > 0) {
        setNewUnlockedBadge(newBadges[0]);
      }

      return profileWithBadges;
    });

    // Automatically submit score to Firestore daily leaderboard
    void submitGameScoreToLeaderboard({
      userId: auth.currentUser?.uid || 'guest_user',
      userName: user.name || '智心探索者',
      userAvatar: user.avatar,
      userTitle: user.title,
      userLevel: user.level,
      gameId,
      gameName: gameId,
      score: result.score,
      accuracy: result.accuracy,
      streak: user.streak,
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

      const tentativeUser: UserProfile = {
        ...prev,
        xp: prev.xp + earnedXp,
        level: Math.max(prev.level, Math.floor((prev.xp + earnedXp) / 400) + 1),
        totalQuizzes: prev.totalQuizzes + 1,
        quizPoints: prev.quizPoints + earnedXp,
        unlockedBadges,
        stats: {
          ...prev.stats,
          knowledge: Math.min(100, Math.round(prev.stats.knowledge * 0.9 + accuracy * 0.1)),
        },
      };

      const { updatedUser: profileWithBadges, newBadges } = evaluateAndUnlockBadges(tentativeUser);
      if (newBadges.length > 0) {
        setNewUnlockedBadge(newBadges[0]);
      }

      return profileWithBadges;
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

      const tentativeUser: UserProfile = {
        ...prev,
        lawsMastered,
        lawMasteryMap: {
          ...prev.lawMasteryMap,
          [lawId]: finalMastery,
        },
      };

      const { updatedUser: profileWithBadges, newBadges } = evaluateAndUnlockBadges(tentativeUser);
      if (newBadges.length > 0) {
        setNewUnlockedBadge(newBadges[0]);
      }

      return profileWithBadges;
    });
  };

  const completeDailyChallenge = () => {
    if (isDailyChallengeCompleted) return;
    setIsDailyChallengeCompleted(true);
    dailyCompletedRef.current = true;
    setUser((prev) => {
      const newStreak = prev.streak + 1;
      const newXp = prev.xp + 500;
      const newLevel = Math.max(prev.level, Math.floor(newXp / 400) + 1);
      const tentative = {
        ...prev,
        streak: newStreak,
        xp: newXp,
        level: newLevel,
      };
      const { updatedUser: profileWithBadges, newBadges } = evaluateAndUnlockBadges(tentative);
      if (newBadges.length > 0) {
        setNewUnlockedBadge(newBadges[0]);
      }
      void syncProfileToFirestore(profileWithBadges, true);
      return profileWithBadges;
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

  // Subscribe to Firestore cognitive journals when user changes
  useEffect(() => {
    const unsub = subscribeToJournals(
      firebaseUser?.uid,
      (latestEntries) => {
        setJournals(latestEntries);
      },
      (err) => {
        console.warn('Subscription error to journals:', err);
      }
    );
    return () => unsub();
  }, [firebaseUser?.uid]);

  const saveJournal = async (entry: Omit<CognitiveJournalEntry, 'createdAt' | 'updatedAt'>) => {
    const saved = await saveJournalEntry(firebaseUser?.uid, entry);
    // Award XP for metacognitive reflection
    addXP(50, '完成认知觉察手记');
    triggerConfetti();
    return saved;
  };

  const deleteJournal = async (entryId: string) => {
    await deleteJournalEntry(firebaseUser?.uid, entryId);
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
        activeAccountEmail,
        savedAccounts,
        authReady,
        isSyncing,
        authDiagnostic,
        setAuthDiagnostic,
        authLoading,
        authModalOpen,
        setAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        authToastMessage,
        setAuthToastMessage,
        loginWithGoogle,
        loginWithGoogleRedirect,
        loginAsGuestCloud,
        switchGoogleAccount,
        loginAsCustomUser,
        switchSavedAccount,
        exportProfileDataJson,
        importProfileDataJson,
        logout,
        updateGoals,
        laws,
        badges,
        newUnlockedBadge,
        setNewUnlockedBadge,
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
        journals,
        saveJournal,
        deleteJournal,
        composerOpen,
        setComposerOpen,
        composerPreload,
        openComposerWithPreload,
        breathingOpen,
        setBreathingOpen,
        pwaModalOpen,
        setPwaModalOpen,
        openPwaModal,
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

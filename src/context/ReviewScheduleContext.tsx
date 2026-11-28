import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useApp } from './AppContext';
import {
  LawReviewScheduleRecord,
  RecallRating,
  HOUR_MS,
  classifyReviewDueStatus,
  computeSuggestedMastery,
  isReviewNotificationEligible,
  sortReviewSchedules,
  syncFavoritesWithSchedules,
} from '../utils/lawSpacedRepetition';
import {
  deleteLawReviewSchedule,
  loadLocalReviewSchedules,
  setLawReviewNotificationPreference,
  snoozeLawReviewSchedule,
  submitLawSpacedReview,
  subscribeToLawReviewSchedules,
  upsertLawReviewSchedule,
} from '../services/lawReviewScheduleService';

const BROWSER_NOTIFY_PREF_KEY = 'mindlabz_review_browser_notify_v1';
const TOAST_SNOOZE_KEY = 'mindlabz_review_toast_snoozed_until_v1';
const BROWSER_SENT_KEY = 'mindlabz_review_browser_sent_ids_v1';

export type BrowserNotificationSupport = NotificationPermission | 'unsupported';

interface ReviewScheduleContextValue {
  schedules: LawReviewScheduleRecord[];
  dueSchedules: LawReviewScheduleRecord[];
  upcomingSchedules: LawReviewScheduleRecord[];
  masteredSchedules: LawReviewScheduleRecord[];
  eligibleNotificationSchedules: LawReviewScheduleRecord[];
  dueCount: number;
  notificationCount: number;
  reviewNowMs: number;
  schedulesReady: boolean;
  browserPermission: BrowserNotificationSupport;
  browserNotificationsEnabled: boolean;
  toastSnoozedUntilMs: number;
  getScheduleForLaw: (lawId: string) => LawReviewScheduleRecord | undefined;
  submitReview: (
    lawId: string,
    rating: RecallRating
  ) => Promise<LawReviewScheduleRecord | null>;
  snoozeLaw: (lawId: string, hours?: number) => Promise<void>;
  snoozeAllEligible: (hours?: number) => Promise<void>;
  toggleLawNotifications: (lawId: string, enabled: boolean) => Promise<void>;
  requestBrowserNotifications: () => Promise<BrowserNotificationSupport>;
  setBrowserNotificationsEnabled: (enabled: boolean) => void;
  dismissToastForHours: (hours?: number) => void;
  clearToastDismissal: () => void;
}

const ReviewScheduleContext = createContext<ReviewScheduleContextValue | undefined>(
  undefined
);

function readBrowserPermission(): BrowserNotificationSupport {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return window.Notification.permission;
}

function readStoredNumber(key: string): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = window.localStorage.getItem(key);
    const val = raw ? Number(raw) : 0;
    return Number.isFinite(val) ? val : 0;
  } catch {
    return 0;
  }
}

export const ReviewScheduleProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, firebaseUser, laws, addXP, updateLawMastery } = useApp();
  const userId = firebaseUser?.uid || null;

  const [schedules, setSchedules] = useState<LawReviewScheduleRecord[]>(() =>
    loadLocalReviewSchedules(userId)
  );
  const [schedulesReady, setSchedulesReady] = useState(false);
  const [reviewNowMs, setReviewNowMs] = useState(() => Date.now());
  const [browserPermission, setBrowserPermission] = useState<BrowserNotificationSupport>(
    () => readBrowserPermission()
  );
  const [browserNotificationsEnabled, setBrowserNotificationsEnabledState] = useState<boolean>(
    () => {
      if (typeof window === 'undefined') return false;
      try {
        return window.localStorage.getItem(BROWSER_NOTIFY_PREF_KEY) === '1';
      } catch {
        return false;
      }
    }
  );
  const [toastSnoozedUntilMs, setToastSnoozedUntilMs] = useState<number>(() =>
    readStoredNumber(TOAST_SNOOZE_KEY)
  );

  const pendingSyncRef = useRef<Set<string>>(new Set());
  const prevFavoritesRef = useRef<string[] | null>(null);

  // Tick every 60 seconds to re-evaluate optimal spaced-repetition due windows
  useEffect(() => {
    const interval = window.setInterval(() => {
      setReviewNowMs(Date.now());
    }, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  // Subscribe to cloud/local review schedules
  useEffect(() => {
    setSchedulesReady(false);
    pendingSyncRef.current.clear();
    const unsub = subscribeToLawReviewSchedules(
      userId,
      (records) => {
        setSchedules(records);
        setSchedulesReady(true);
      },
      (err) => {
        console.warn('Review schedule subscription warning:', err);
        setSchedulesReady(true);
      }
    );
    return () => unsub();
  }, [userId]);

  // Synchronize favorited laws (`user.bookmarks`) with spaced-repetition schedules
  useEffect(() => {
    if (!schedulesReady) return;
    const favorites = Array.isArray(user?.bookmarks) ? user.bookmarks : [];
    const { toCreate, toDeleteIds } = syncFavoritesWithSchedules(
      favorites,
      laws,
      schedules,
      userId,
      Date.now()
    );

    toCreate.forEach((sched) => {
      if (pendingSyncRef.current.has(`create:${sched.lawId}`)) return;
      pendingSyncRef.current.add(`create:${sched.lawId}`);
      void upsertLawReviewSchedule(userId, sched)
        .then((saved) => {
          setSchedules((prev) =>
            sortReviewSchedules([
              saved,
              ...prev.filter((item) => item.lawId !== saved.lawId),
            ])
          );
        })
        .catch((err) => {
          console.warn('Failed to create spaced repetition schedule:', err);
        })
        .finally(() => {
          pendingSyncRef.current.delete(`create:${sched.lawId}`);
        });
    });

    // Only delete schedules for laws explicitly removed from favorites during the active session
    const prevFavorites = prevFavoritesRef.current;
    if (prevFavorites !== null) {
      const removedDuringSession = prevFavorites.filter(
        (id) => !favorites.includes(id)
      );
      toDeleteIds
        .filter((id) => removedDuringSession.includes(id))
        .forEach((lawId) => {
          if (pendingSyncRef.current.has(`del:${lawId}`)) return;
          pendingSyncRef.current.add(`del:${lawId}`);
          void deleteLawReviewSchedule(userId, lawId)
            .then(() => {
              setSchedules((prev) => prev.filter((item) => item.lawId !== lawId));
            })
            .catch((err) => {
              console.warn('Failed to delete unfavorited review schedule:', err);
            })
            .finally(() => {
              pendingSyncRef.current.delete(`del:${lawId}`);
            });
        });
    }
    prevFavoritesRef.current = favorites;
  }, [schedulesReady, user?.bookmarks, laws, schedules, userId]);

  const sortedSchedules = useMemo(
    () => sortReviewSchedules(schedules, reviewNowMs),
    [schedules, reviewNowMs]
  );

  const dueSchedules = useMemo(
    () =>
      sortedSchedules.filter(
        (s) => classifyReviewDueStatus(s, reviewNowMs) === 'due'
      ),
    [sortedSchedules, reviewNowMs]
  );

  const upcomingSchedules = useMemo(
    () =>
      sortedSchedules.filter(
        (s) => classifyReviewDueStatus(s, reviewNowMs) === 'upcoming'
      ),
    [sortedSchedules, reviewNowMs]
  );

  const masteredSchedules = useMemo(
    () =>
      sortedSchedules.filter(
        (s) => classifyReviewDueStatus(s, reviewNowMs) === 'mastered'
      ),
    [sortedSchedules, reviewNowMs]
  );

  const eligibleNotificationSchedules = useMemo(
    () =>
      dueSchedules.filter((s) =>
        isReviewNotificationEligible(s, reviewNowMs)
      ),
    [dueSchedules, reviewNowMs]
  );

  // Dispatch Web Notification API prompt ONLY if user explicitly opted in (`granted` + enabled)
  useEffect(() => {
    if (
      !browserNotificationsEnabled ||
      browserPermission !== 'granted' ||
      typeof window === 'undefined' ||
      !('Notification' in window) ||
      eligibleNotificationSchedules.length === 0
    ) {
      return;
    }

    const first = eligibleNotificationSchedules[0];
    const marker = `${first.lawId}:${Math.floor(reviewNowMs / (6 * HOUR_MS))}`;
    try {
      const lastMarker = window.sessionStorage.getItem(BROWSER_SENT_KEY);
      if (lastMarker === marker) return;
      window.sessionStorage.setItem(BROWSER_SENT_KEY, marker);

      const notif = new window.Notification(
        `MindLabZ · ${eligibleNotificationSchedules.length} 条收藏定律待复习`,
        {
          body: `最佳记忆回溯节点：《${first.lawNameZh}》（${first.categoryZh}心理学）已到期，点击进入间隔复习。`,
          icon: '/app-icon.png',
          tag: 'mindlabz-spaced-review',
        }
      );
      notif.onclick = () => {
        window.focus();
      };
    } catch {
      // Ignore Notification constructor errors inside sandboxed iframes
    }
  }, [browserNotificationsEnabled, browserPermission, eligibleNotificationSchedules, reviewNowMs]);

  const getScheduleForLaw = useCallback(
    (lawId: string) => schedules.find((s) => s.lawId === lawId),
    [schedules]
  );

  const submitReview = useCallback(
    async (
      lawId: string,
      rating: RecallRating
    ): Promise<LawReviewScheduleRecord | null> => {
      const target = schedules.find((s) => s.lawId === lawId);
      if (!target) return null;
      const now = Date.now();
      const updated = await submitLawSpacedReview(userId, target, rating, now);
      setSchedules((prev) =>
        sortReviewSchedules(
          [updated, ...prev.filter((item) => item.lawId !== updated.lawId)],
          now
        )
      );
      setReviewNowMs(now);

      const xpBonus = rating === 'easy' ? 25 : rating === 'good' ? 20 : rating === 'hard' ? 15 : 10;
      addXP(xpBonus, `间隔复习《${target.lawNameZh}》`);
      if (rating !== 'again') {
        updateLawMastery(lawId, computeSuggestedMastery(updated));
      }
      return updated;
    },
    [schedules, userId, addXP, updateLawMastery]
  );

  const snoozeLaw = useCallback(
    async (lawId: string, hours = 2) => {
      const target = schedules.find((s) => s.lawId === lawId);
      if (!target) return;
      const now = Date.now();
      const updated = await snoozeLawReviewSchedule(
        userId,
        target,
        hours * HOUR_MS,
        now
      );
      setSchedules((prev) =>
        sortReviewSchedules(
          [updated, ...prev.filter((item) => item.lawId !== updated.lawId)],
          now
        )
      );
      setReviewNowMs(now);
    },
    [schedules, userId]
  );

  const snoozeAllEligible = useCallback(
    async (hours = 2) => {
      const now = Date.now();
      const targets = eligibleNotificationSchedules;
      if (targets.length === 0) return;
      const updatedList = await Promise.all(
        targets.map((t) =>
          snoozeLawReviewSchedule(userId, t, hours * HOUR_MS, now)
        )
      );
      const updatedMap = new Map(updatedList.map((u) => [u.lawId, u]));
      setSchedules((prev) =>
        sortReviewSchedules(
          prev.map((item) => updatedMap.get(item.lawId) || item),
          now
        )
      );
      setReviewNowMs(now);
    },
    [eligibleNotificationSchedules, userId]
  );

  const toggleLawNotifications = useCallback(
    async (lawId: string, enabled: boolean) => {
      const target = schedules.find((s) => s.lawId === lawId);
      if (!target) return;
      const updated = await setLawReviewNotificationPreference(
        userId,
        target,
        enabled
      );
      setSchedules((prev) =>
        sortReviewSchedules(
          [updated, ...prev.filter((item) => item.lawId !== updated.lawId)],
          reviewNowMs
        )
      );
    },
    [schedules, userId, reviewNowMs]
  );

  const setBrowserNotificationsEnabled = useCallback((enabled: boolean) => {
    setBrowserNotificationsEnabledState(enabled);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(BROWSER_NOTIFY_PREF_KEY, enabled ? '1' : '0');
      } catch {
        // ignore storage quota errors
      }
    }
  }, []);

  const requestBrowserNotifications =
    useCallback(async (): Promise<BrowserNotificationSupport> => {
      if (typeof window === 'undefined' || !('Notification' in window)) {
        setBrowserPermission('unsupported');
        return 'unsupported';
      }
      try {
        const perm = await window.Notification.requestPermission();
        setBrowserPermission(perm);
        if (perm === 'granted') {
          setBrowserNotificationsEnabled(true);
        }
        return perm;
      } catch {
        const current = readBrowserPermission();
        setBrowserPermission(current);
        return current;
      }
    }, [setBrowserNotificationsEnabled]);

  const dismissToastForHours = useCallback((hours = 2) => {
    const until = Date.now() + hours * HOUR_MS;
    setToastSnoozedUntilMs(until);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(TOAST_SNOOZE_KEY, String(until));
      } catch {
        // ignore
      }
    }
  }, []);

  const clearToastDismissal = useCallback(() => {
    setToastSnoozedUntilMs(0);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(TOAST_SNOOZE_KEY);
      } catch {
        // ignore
      }
    }
  }, []);

  return (
    <ReviewScheduleContext.Provider
      value={{
        schedules: sortedSchedules,
        dueSchedules,
        upcomingSchedules,
        masteredSchedules,
        eligibleNotificationSchedules,
        dueCount: dueSchedules.length,
        notificationCount: eligibleNotificationSchedules.length,
        reviewNowMs,
        schedulesReady,
        browserPermission,
        browserNotificationsEnabled,
        toastSnoozedUntilMs,
        getScheduleForLaw,
        submitReview,
        snoozeLaw,
        snoozeAllEligible,
        toggleLawNotifications,
        requestBrowserNotifications,
        setBrowserNotificationsEnabled,
        dismissToastForHours,
        clearToastDismissal,
      }}
    >
      {children}
    </ReviewScheduleContext.Provider>
  );
};

export function useReviewSchedule(): ReviewScheduleContextValue {
  const ctx = useContext(ReviewScheduleContext);
  if (!ctx) {
    throw new Error('useReviewSchedule must be used within a ReviewScheduleProvider');
  }
  return ctx;
}

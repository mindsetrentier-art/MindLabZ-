import { useState, useEffect, useCallback, useRef } from 'react';
import {
  WORLD_CAPITALS,
  POINTS_PER_CITY,
  CHAPTERS_PER_POINT,
} from '../data/worldCapitals';

export const WORLD_CITY_PROGRESS_STORAGE_KEY = 'mindlabz_world_city_progress_v2';
const SYNC_EVENT_NAME = 'mindlabz:world-city-progress-updated';

export interface WorldCityProgressState {
  activeCityIndex: number;
  activePointIndex: number;
  activeChapterIndex: number;
  /** Map of `${cityIndex}:${pointIndex}` -> sorted unique array of completed chapter indices (0..9) */
  completedChaptersByPoint: Record<string, number[]>;
}

const DEFAULT_STATE: WorldCityProgressState = {
  activeCityIndex: 0,
  activePointIndex: 0,
  activeChapterIndex: 0,
  completedChaptersByPoint: {},
};

const makePointKey = (cityIdx: number, pointIdx: number) => `${cityIdx}:${pointIdx}`;

const clampIndex = (val: unknown, maxExclusive: number) => {
  const num = Number(val);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, Math.min(maxExclusive - 1, Math.floor(num)));
};

const sanitizeState = (
  raw: Partial<WorldCityProgressState> | null | undefined
): WorldCityProgressState => {
  if (!raw || typeof raw !== 'object') return DEFAULT_STATE;

  const cleanMap: Record<string, number[]> = {};
  if (raw.completedChaptersByPoint && typeof raw.completedChaptersByPoint === 'object') {
    for (const [key, arr] of Object.entries(raw.completedChaptersByPoint)) {
      if (!Array.isArray(arr)) continue;
      const validChapters = Array.from(
        new Set(
          arr
            .map((n) => Number(n))
            .filter((n) => Number.isInteger(n) && n >= 0 && n < CHAPTERS_PER_POINT)
        )
      ).sort((a, b) => a - b);
      if (validChapters.length > 0) {
        cleanMap[key] = validChapters;
      }
    }
  }

  return {
    activeCityIndex: clampIndex(raw.activeCityIndex ?? 0, WORLD_CAPITALS.length),
    activePointIndex: clampIndex(raw.activePointIndex ?? 0, POINTS_PER_CITY),
    activeChapterIndex: clampIndex(raw.activeChapterIndex ?? 0, CHAPTERS_PER_POINT),
    completedChaptersByPoint: cleanMap,
  };
};

const areProgressStatesEqual = (
  a: WorldCityProgressState,
  b: WorldCityProgressState
): boolean => {
  if (a === b) return true;
  if (
    a.activeCityIndex !== b.activeCityIndex ||
    a.activePointIndex !== b.activePointIndex ||
    a.activeChapterIndex !== b.activeChapterIndex
  ) {
    return false;
  }
  const keysA = Object.keys(a.completedChaptersByPoint);
  const keysB = Object.keys(b.completedChaptersByPoint);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    const arrA = a.completedChaptersByPoint[key];
    const arrB = b.completedChaptersByPoint[key];
    if (!arrB || arrA.length !== arrB.length) return false;
    for (let i = 0; i < arrA.length; i++) {
      if (arrA[i] !== arrB[i]) return false;
    }
  }
  return true;
};

const readStoredProgress = (): WorldCityProgressState => {
  try {
    const raw = localStorage.getItem(WORLD_CITY_PROGRESS_STORAGE_KEY);
    if (raw) {
      return sanitizeState(JSON.parse(raw) as Partial<WorldCityProgressState>);
    }
  } catch {
    // ignore storage read errors
  }
  return DEFAULT_STATE;
};

// Pure helper predicates for strict sequential locking across Cities -> Points -> Chapters
export const getCompletedChaptersList = (
  state: WorldCityProgressState,
  cityIdx: number,
  pointIdx: number
): number[] => {
  return state.completedChaptersByPoint[makePointKey(cityIdx, pointIdx)] || [];
};

export const checkChapterCompleted = (
  state: WorldCityProgressState,
  cityIdx: number,
  pointIdx: number,
  chapterIdx: number
): boolean => {
  return getCompletedChaptersList(state, cityIdx, pointIdx).includes(chapterIdx);
};

export const checkPointCompleted = (
  state: WorldCityProgressState,
  cityIdx: number,
  pointIdx: number
): boolean => {
  return getCompletedChaptersList(state, cityIdx, pointIdx).length >= CHAPTERS_PER_POINT;
};

export const checkCityCompleted = (state: WorldCityProgressState, cityIdx: number): boolean => {
  for (let p = 0; p < POINTS_PER_CITY; p++) {
    if (!checkPointCompleted(state, cityIdx, p)) return false;
  }
  return true;
};

export const checkCityUnlocked = (state: WorldCityProgressState, cityIdx: number): boolean => {
  if (cityIdx <= 0) return true;
  if (cityIdx >= WORLD_CAPITALS.length) return false;
  return checkCityCompleted(state, cityIdx - 1);
};

export const checkPointUnlocked = (
  state: WorldCityProgressState,
  cityIdx: number,
  pointIdx: number
): boolean => {
  if (!checkCityUnlocked(state, cityIdx)) return false;
  if (pointIdx <= 0) return true;
  if (pointIdx >= POINTS_PER_CITY) return false;
  return checkPointCompleted(state, cityIdx, pointIdx - 1);
};

export const checkChapterUnlocked = (
  state: WorldCityProgressState,
  cityIdx: number,
  pointIdx: number,
  chapterIdx: number
): boolean => {
  if (!checkPointUnlocked(state, cityIdx, pointIdx)) return false;
  if (chapterIdx <= 0) return true;
  if (chapterIdx >= CHAPTERS_PER_POINT) return false;
  return checkChapterCompleted(state, cityIdx, pointIdx, chapterIdx - 1);
};

export const getUnlockedPointIndexForCity = (
  state: WorldCityProgressState,
  cityIdx: number
): number => {
  if (!checkCityUnlocked(state, cityIdx)) return -1;
  let highest = 0;
  for (let p = 0; p < POINTS_PER_CITY; p++) {
    if (checkPointUnlocked(state, cityIdx, p)) {
      highest = p;
    } else {
      break;
    }
  }
  return highest;
};

export const getCompletedPointsForCity = (
  state: WorldCityProgressState,
  cityIdx: number
): number[] => {
  const completed: number[] = [];
  for (let p = 0; p < POINTS_PER_CITY; p++) {
    if (checkPointCompleted(state, cityIdx, p)) {
      completed.push(p);
    }
  }
  return completed;
};

export const getUnlockedCityCount = (state: WorldCityProgressState): number => {
  let count = 1;
  for (let c = 1; c < WORLD_CAPITALS.length; c++) {
    if (checkCityUnlocked(state, c)) {
      count = c + 1;
    } else {
      break;
    }
  }
  return count;
};

export const getTotalCompletedChapters = (state: WorldCityProgressState): number => {
  return Object.values(state.completedChaptersByPoint).reduce(
    (sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0),
    0
  );
};

const computeChapterCompletion = (
  prev: WorldCityProgressState,
  cityIdx: number,
  pointIdx: number,
  chapterIdx: number
): {
  nextState: WorldCityProgressState;
  unlockedNextChapter: number | null;
  unlockedNextPoint: number | null;
  unlockedNextCity: number | null;
} => {
  if (!checkChapterUnlocked(prev, cityIdx, pointIdx, chapterIdx)) {
    return {
      nextState: prev,
      unlockedNextChapter: null,
      unlockedNextPoint: null,
      unlockedNextCity: null,
    };
  }

  const key = makePointKey(cityIdx, pointIdx);
  const existing = getCompletedChaptersList(prev, cityIdx, pointIdx);
  const wasAlreadyCompleted = existing.includes(chapterIdx);
  const updatedList = Array.from(new Set([...existing, chapterIdx])).sort((a, b) => a - b);

  const nextMap = {
    ...prev.completedChaptersByPoint,
    [key]: updatedList,
  };

  let nextCity = cityIdx;
  let nextPoint = pointIdx;
  let nextChapter = chapterIdx;
  let unlockedNextChapter: number | null = null;
  let unlockedNextPoint: number | null = null;
  let unlockedNextCity: number | null = null;

  if (chapterIdx < CHAPTERS_PER_POINT - 1) {
    nextChapter = chapterIdx + 1;
    if (!wasAlreadyCompleted) {
      unlockedNextChapter = nextChapter;
    }
  } else if (pointIdx < POINTS_PER_CITY - 1) {
    nextPoint = pointIdx + 1;
    nextChapter = 0;
    if (!wasAlreadyCompleted) {
      unlockedNextPoint = nextPoint;
    }
  } else if (cityIdx < WORLD_CAPITALS.length - 1) {
    nextCity = cityIdx + 1;
    nextPoint = 0;
    nextChapter = 0;
    if (!wasAlreadyCompleted) {
      unlockedNextCity = nextCity;
    }
  }

  return {
    nextState: {
      completedChaptersByPoint: nextMap,
      activeCityIndex: nextCity,
      activePointIndex: nextPoint,
      activeChapterIndex: nextChapter,
    },
    unlockedNextChapter,
    unlockedNextPoint,
    unlockedNextCity,
  };
};

interface SyncEventDetail {
  state: WorldCityProgressState;
  sourceId: string;
}

export const useCityQuizProgress = () => {
  const [progress, setProgressState] = useState<WorldCityProgressState>(readStoredProgress);
  const [newlyUnlockedPointIndex, setNewlyUnlockedPointIndex] = useState<number | null>(null);
  const [newlyUnlockedCityIndex, setNewlyUnlockedCityIndex] = useState<number | null>(null);

  const instanceIdRef = useRef<string>(
    `city-progress-${Math.random().toString(36).slice(2)}-${Date.now()}`
  );
  const progressRef = useRef<WorldCityProgressState>(progress);
  progressRef.current = progress;
  const pendingBroadcastRef = useRef<WorldCityProgressState | null>(null);

  // Persist to localStorage & notify sibling hook instances AFTER React commits state
  useEffect(() => {
    const stateToBroadcast = pendingBroadcastRef.current;
    if (!stateToBroadcast) return;
    pendingBroadcastRef.current = null;

    try {
      localStorage.setItem(WORLD_CITY_PROGRESS_STORAGE_KEY, JSON.stringify(stateToBroadcast));
      window.dispatchEvent(
        new CustomEvent<SyncEventDetail>(SYNC_EVENT_NAME, {
          detail: {
            state: stateToBroadcast,
            sourceId: instanceIdRef.current,
          },
        })
      );
    } catch {
      // ignore storage write errors
    }
  }, [progress]);

  const updateProgress = useCallback(
    (updater: (prev: WorldCityProgressState) => WorldCityProgressState) => {
      setProgressState((prev) => {
        const next = sanitizeState(updater(prev));
        if (areProgressStatesEqual(prev, next)) {
          return prev;
        }
        pendingBroadcastRef.current = next;
        return next;
      });
    },
    []
  );

  useEffect(() => {
    const handleSync = (event: Event) => {
      const customEvent = event as CustomEvent<SyncEventDetail | WorldCityProgressState>;
      const rawDetail = customEvent.detail;
      if (rawDetail && typeof rawDetail === 'object' && 'sourceId' in rawDetail) {
        if (rawDetail.sourceId === instanceIdRef.current) {
          return;
        }
        const incoming = sanitizeState(rawDetail.state);
        setProgressState((prev) => (areProgressStatesEqual(prev, incoming) ? prev : incoming));
      } else if (rawDetail) {
        const incoming = sanitizeState(rawDetail as WorldCityProgressState);
        setProgressState((prev) => (areProgressStatesEqual(prev, incoming) ? prev : incoming));
      } else {
        const incoming = readStoredProgress();
        setProgressState((prev) => (areProgressStatesEqual(prev, incoming) ? prev : incoming));
      }
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === WORLD_CITY_PROGRESS_STORAGE_KEY) {
        const incoming = readStoredProgress();
        setProgressState((prev) => (areProgressStatesEqual(prev, incoming) ? prev : incoming));
      }
    };

    window.addEventListener(SYNC_EVENT_NAME, handleSync);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener(SYNC_EVENT_NAME, handleSync);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const selectCity = useCallback(
    (cityIdx: number) => {
      updateProgress((prev) => {
        if (!checkCityUnlocked(prev, cityIdx)) return prev;
        const unlockedPt = Math.max(0, getUnlockedPointIndexForCity(prev, cityIdx));
        const targetPt = Math.min(unlockedPt, POINTS_PER_CITY - 1);
        const completedChs = getCompletedChaptersList(prev, cityIdx, targetPt);
        const nextCh = Math.min(CHAPTERS_PER_POINT - 1, completedChs.length);
        return {
          ...prev,
          activeCityIndex: cityIdx,
          activePointIndex: targetPt,
          activeChapterIndex: nextCh,
        };
      });
    },
    [updateProgress]
  );

  const selectPoint = useCallback(
    (pointIdx: number) => {
      updateProgress((prev) => {
        if (!checkPointUnlocked(prev, prev.activeCityIndex, pointIdx)) return prev;
        const completedChs = getCompletedChaptersList(prev, prev.activeCityIndex, pointIdx);
        const nextCh = Math.min(CHAPTERS_PER_POINT - 1, completedChs.length);
        return {
          ...prev,
          activePointIndex: pointIdx,
          activeChapterIndex: nextCh,
        };
      });
    },
    [updateProgress]
  );

  const selectChapter = useCallback(
    (chapterIdx: number) => {
      updateProgress((prev) => {
        if (
          !checkChapterUnlocked(
            prev,
            prev.activeCityIndex,
            prev.activePointIndex,
            chapterIdx
          )
        ) {
          return prev;
        }
        return {
          ...prev,
          activeChapterIndex: chapterIdx,
        };
      });
    },
    [updateProgress]
  );

  const setActiveCoordinates = useCallback(
    (cityIdx: number, pointIdx: number, chapterIdx: number) => {
      updateProgress((prev) => {
        if (!checkChapterUnlocked(prev, cityIdx, pointIdx, chapterIdx)) return prev;
        return {
          ...prev,
          activeCityIndex: cityIdx,
          activePointIndex: pointIdx,
          activeChapterIndex: chapterIdx,
        };
      });
    },
    [updateProgress]
  );

  /**
   * Called after answering all 20 questions of (cityIdx, pointIdx, chapterIdx).
   * Unlocks the next chapter, or next point (on chapter 10), or next World Capital (on point 8 ch 10).
   */
  const completeChapter = useCallback(
    (
      cityIdx: number,
      pointIdx: number,
      chapterIdx: number,
      onUnlockEffect?: () => void
    ): {
      unlockedNextChapter: number | null;
      unlockedNextPoint: number | null;
      unlockedNextCity: number | null;
    } => {
      const outcome = computeChapterCompletion(
        progressRef.current,
        cityIdx,
        pointIdx,
        chapterIdx
      );

      updateProgress((prev) => computeChapterCompletion(prev, cityIdx, pointIdx, chapterIdx).nextState);

      if (outcome.unlockedNextPoint !== null) {
        setNewlyUnlockedPointIndex(outcome.unlockedNextPoint);
        window.setTimeout(() => setNewlyUnlockedPointIndex(null), 2200);
      }
      if (outcome.unlockedNextCity !== null) {
        setNewlyUnlockedCityIndex(outcome.unlockedNextCity);
        window.setTimeout(() => setNewlyUnlockedCityIndex(null), 3200);
      }
      onUnlockEffect?.();

      return {
        unlockedNextChapter: outcome.unlockedNextChapter,
        unlockedNextPoint: outcome.unlockedNextPoint,
        unlockedNextCity: outcome.unlockedNextCity,
      };
    },
    [updateProgress]
  );

  const resetAllProgress = useCallback(() => {
    setNewlyUnlockedPointIndex(null);
    setNewlyUnlockedCityIndex(null);
    updateProgress(() => DEFAULT_STATE);
  }, [updateProgress]);

  const clearNewlyUnlocked = useCallback(() => {
    setNewlyUnlockedPointIndex(null);
    setNewlyUnlockedCityIndex(null);
  }, []);

  return {
    progress,
    newlyUnlockedPointIndex,
    newlyUnlockedCityIndex,
    selectCity,
    selectPoint,
    selectChapter,
    setActiveCoordinates,
    completeChapter,
    resetAllProgress,
    clearNewlyUnlocked,
  };
};


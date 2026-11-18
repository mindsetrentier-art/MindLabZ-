const COGNITIVE_STREAK_STORAGE_KEY = 'mindlabz_rapid_cognitive_streak_v1';

export interface CognitiveStreakDay {
  dateKey: string;
  shortDayLabel: string;
  dayOfMonth: string;
  completed: boolean;
  isToday: boolean;
}

export interface CognitiveStreakSummary {
  currentStreak: number;
  bestStreak: number;
  completedToday: boolean;
  totalActiveDays: number;
  lastCompletedDate: string | null;
  last7Days: CognitiveStreakDay[];
}

interface StoredStreakState {
  completedDates: string[];
  bestStreak: number;
}

const WEEKDAY_LABELS_ZH = ['日', '一', '二', '三', '四', '五', '六'];

export function toLocalDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseLocalDateKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split('-').map((n) => Number(n));
  return new Date(y || 2026, (m || 1) - 1, d || 1);
}

function shiftLocalDateKey(dateKey: string, deltaDays: number): string {
  const base = parseLocalDateKey(dateKey);
  base.setDate(base.getDate() + deltaDays);
  return toLocalDateKey(base);
}

function isValidDateKey(val: unknown): val is string {
  return typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val);
}

function loadStoredStreak(): StoredStreakState {
  try {
    if (typeof window === 'undefined') {
      return { completedDates: [], bestStreak: 0 };
    }
    const raw = window.localStorage.getItem(COGNITIVE_STREAK_STORAGE_KEY);
    if (!raw) {
      return { completedDates: [], bestStreak: 0 };
    }
    const parsed = JSON.parse(raw) as Partial<StoredStreakState>;
    const uniqueDates = Array.from(
      new Set((parsed.completedDates || []).filter(isValidDateKey))
    ).sort();
    return {
      completedDates: uniqueDates,
      bestStreak: Math.max(0, Number(parsed.bestStreak || 0)),
    };
  } catch {
    return { completedDates: [], bestStreak: 0 };
  }
}

function saveStoredStreak(state: StoredStreakState): void {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(COGNITIVE_STREAK_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage quota errors
  }
}

function computeStreakSummary(state: StoredStreakState): CognitiveStreakSummary {
  const dateSet = new Set(state.completedDates);
  const todayKey = toLocalDateKey(new Date());
  const yesterdayKey = shiftLocalDateKey(todayKey, -1);
  const completedToday = dateSet.has(todayKey);

  // Consecutive days count: anchor on today if completed today, otherwise yesterday
  let currentStreak = 0;
  let cursor = completedToday ? todayKey : dateSet.has(yesterdayKey) ? yesterdayKey : null;
  while (cursor && dateSet.has(cursor)) {
    currentStreak += 1;
    cursor = shiftLocalDateKey(cursor, -1);
  }

  // Compute true longest historical consecutive run from completedDates
  let historicalMax = 0;
  let running = 0;
  let prevKey: string | null = null;
  for (const key of state.completedDates) {
    if (prevKey && shiftLocalDateKey(prevKey, 1) === key) {
      running += 1;
    } else {
      running = 1;
    }
    if (running > historicalMax) historicalMax = running;
    prevKey = key;
  }

  const bestStreak = Math.max(state.bestStreak, currentStreak, historicalMax);

  const last7Days: CognitiveStreakDay[] = [];
  for (let offset = -6; offset <= 0; offset++) {
    const key = shiftLocalDateKey(todayKey, offset);
    const dt = parseLocalDateKey(key);
    last7Days.push({
      dateKey: key,
      shortDayLabel: offset === 0 ? '今' : WEEKDAY_LABELS_ZH[dt.getDay()],
      dayOfMonth: String(dt.getDate()),
      completed: dateSet.has(key),
      isToday: offset === 0,
    });
  }

  const lastCompletedDate =
    state.completedDates.length > 0
      ? state.completedDates[state.completedDates.length - 1]
      : null;

  return {
    currentStreak,
    bestStreak,
    completedToday,
    totalActiveDays: state.completedDates.length,
    lastCompletedDate,
    last7Days,
  };
}

export function getCognitiveStreakSummary(): CognitiveStreakSummary {
  const stored = loadStoredStreak();
  return computeStreakSummary(stored);
}

export function recordDailyQuizLevelForStreak(): CognitiveStreakSummary {
  const stored = loadStoredStreak();
  const todayKey = toLocalDateKey(new Date());
  const nextDates = Array.from(new Set([...stored.completedDates, todayKey])).sort();
  const nextSummary = computeStreakSummary({
    completedDates: nextDates,
    bestStreak: stored.bestStreak,
  });
  saveStoredStreak({
    completedDates: nextDates,
    bestStreak: nextSummary.bestStreak,
  });
  return nextSummary;
}

import type { PsychologyLaw } from '../types';
import { isValidPageBookmarkId, resolveBookLawById } from './lawReadingBookmarkHelpers';

export type RecallRating = 'again' | 'hard' | 'good' | 'easy';
export type LastReviewRating = 'none' | RecallRating;
export type ReviewDueStatus = 'due' | 'upcoming' | 'mastered';

export const MIN_EASE_FACTOR = 1.3;
export const DEFAULT_EASE_FACTOR = 2.5;
export const MAX_EASE_FACTOR = 3.5;
export const MAX_INTERVAL_DAYS = 3650;
export const MAX_EPOCH_MS = 4102444800000;
export const DAY_MS = 24 * 60 * 60 * 1000;
export const HOUR_MS = 60 * 60 * 1000;

export interface LawReviewScheduleInput {
  id?: string;
  userId?: string;
  lawId: string;
  lawNameZh: string;
  lawNameEn?: string;
  categoryZh?: string;
  easeFactor?: number;
  intervalDays?: number;
  repetitions?: number;
  lapses?: number;
  totalReviews?: number;
  lastRating?: LastReviewRating;
  nextReviewAtMs: number;
  lastReviewedAtMs?: number;
  snoozedUntilMs?: number;
  notificationsEnabled?: boolean;
}

export interface SanitizedLawReviewSchedule {
  id: string;
  userId: string;
  lawId: string;
  lawNameZh: string;
  lawNameEn: string;
  categoryZh: string;
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  lapses: number;
  totalReviews: number;
  lastRating: LastReviewRating;
  nextReviewAtMs: number;
  lastReviewedAtMs: number;
  snoozedUntilMs: number;
  notificationsEnabled: boolean;
}

export interface LawReviewScheduleRecord extends SanitizedLawReviewSchedule {
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface IntervalPreview {
  rating: RecallRating;
  labelZh: string;
  hintZh: string;
  intervalDays: number;
  intervalLabel: string;
  nextReviewAtMs: number;
}

export const RECALL_RATING_OPTIONS: ReadonlyArray<{
  rating: RecallRating;
  labelZh: string;
  hintZh: string;
}> = [
  { rating: 'again', labelZh: '遗忘重学', hintZh: '未想起核心机制，重置间隔' },
  { rating: 'hard', labelZh: '稍显吃力', hintZh: '经提示回忆起来，缩短增益' },
  { rating: 'good', labelZh: '清晰掌握', hintZh: '准确说出原理与防御边界' },
  { rating: 'easy', labelZh: '轻松内化', hintZh: '瞬时调用并延伸现实场景' },
];

export function clampEaseFactor(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_EASE_FACTOR;
  const clamped = Math.max(MIN_EASE_FACTOR, Math.min(MAX_EASE_FACTOR, value));
  return Math.round(clamped * 100) / 100;
}

export function clampIntervalDays(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  const clamped = Math.min(MAX_INTERVAL_DAYS, value);
  return Math.round(clamped * 10) / 10;
}

export function clampBoundedInt(value: number | undefined, min: number, max: number, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, Math.round(value)));
}

export function clampEpochMs(value: number | undefined, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.max(0, Math.min(MAX_EPOCH_MS, Math.round(value)));
}

export function isValidReviewRating(value: unknown): value is LastReviewRating {
  return value === 'none' || value === 'again' || value === 'hard' || value === 'good' || value === 'easy';
}

export function sanitizeLawReviewScheduleInput(
  input: LawReviewScheduleInput
): SanitizedLawReviewSchedule | null {
  const safeLawId = isValidPageBookmarkId(input.lawId) ? input.lawId : '';
  if (!safeLawId) return null;

  const safeNameZh =
    typeof input.lawNameZh === 'string' ? input.lawNameZh.trim().slice(0, 120) : '';
  if (!safeNameZh) return null;

  const safeNameEn =
    typeof input.lawNameEn === 'string' ? input.lawNameEn.trim().slice(0, 160) : '';

  const safeCategoryZh =
    typeof input.categoryZh === 'string' && input.categoryZh.trim()
      ? input.categoryZh.trim().slice(0, 40)
      : '心理学';

  const safeUserId = isValidPageBookmarkId(input.userId) ? input.userId : 'guest_user';

  return {
    id: safeLawId,
    userId: safeUserId,
    lawId: safeLawId,
    lawNameZh: safeNameZh,
    lawNameEn: safeNameEn,
    categoryZh: safeCategoryZh,
    easeFactor: clampEaseFactor(input.easeFactor ?? DEFAULT_EASE_FACTOR),
    intervalDays: clampIntervalDays(input.intervalDays ?? 0),
    repetitions: clampBoundedInt(input.repetitions, 0, 1000, 0),
    lapses: clampBoundedInt(input.lapses, 0, 1000, 0),
    totalReviews: clampBoundedInt(input.totalReviews, 0, 5000, 0),
    lastRating: isValidReviewRating(input.lastRating) ? input.lastRating : 'none',
    nextReviewAtMs: clampEpochMs(input.nextReviewAtMs, Date.now()),
    lastReviewedAtMs: clampEpochMs(input.lastReviewedAtMs, 0),
    snoozedUntilMs: clampEpochMs(input.snoozedUntilMs, 0),
    notificationsEnabled: input.notificationsEnabled ?? true,
  };
}

export function createInitialReviewSchedule(
  law: Pick<PsychologyLaw, 'id' | 'nameZh' | 'nameEn' | 'categoryZh'>,
  userId?: string | null,
  nowMs: number = Date.now()
): SanitizedLawReviewSchedule {
  const safeId = isValidPageBookmarkId(law.id) ? law.id : 'law';
  const safeUserId = isValidPageBookmarkId(userId) ? userId : 'guest_user';
  return {
    id: safeId,
    userId: safeUserId,
    lawId: safeId,
    lawNameZh: (law.nameZh || '心理学定律').trim().slice(0, 120),
    lawNameEn: (law.nameEn || '').trim().slice(0, 160),
    categoryZh: (law.categoryZh || '心理学').trim().slice(0, 40),
    easeFactor: DEFAULT_EASE_FACTOR,
    intervalDays: 0,
    repetitions: 0,
    lapses: 0,
    totalReviews: 0,
    lastRating: 'none',
    nextReviewAtMs: clampEpochMs(nowMs, Date.now()),
    lastReviewedAtMs: 0,
    snoozedUntilMs: 0,
    notificationsEnabled: true,
  };
}

/**
 * Pure SM-2 spaced repetition state transition.
 * - `again`: resets consecutive repetitions to 0, increments lapses, schedules 12h re-check, drops easeFactor by 0.20.
 * - `hard`: keeps or gently nudges interval (1d -> 3d -> interval * 1.2), eases -0.15.
 * - `good`: classic SM-2 cadence (1d -> 6d -> round(interval * easeFactor)).
 * - `easy`: accelerated cadence (3d -> 9d -> round(interval * easeFactor * 1.3)), eases +0.15.
 */
export function computeNextSpacedReview(
  current: SanitizedLawReviewSchedule,
  rating: RecallRating,
  nowMs: number = Date.now()
): SanitizedLawReviewSchedule {
  const prevEase = clampEaseFactor(current.easeFactor);
  const prevInterval = Math.max(0, current.intervalDays);
  const prevReps = Math.max(0, current.repetitions);
  const prevLapses = Math.max(0, current.lapses);
  const prevTotal = Math.max(0, current.totalReviews);

  let nextEase = prevEase;
  let nextInterval = 1;
  let nextReps = prevReps;
  let nextLapses = prevLapses;

  if (rating === 'again') {
    nextReps = 0;
    nextLapses = Math.min(1000, prevLapses + 1);
    nextInterval = 0.5; // 12 hours optimal consolidation check
    nextEase = clampEaseFactor(prevEase - 0.2);
  } else if (rating === 'hard') {
    nextEase = clampEaseFactor(prevEase - 0.15);
    if (prevReps === 0) {
      nextInterval = 1;
    } else if (prevReps === 1) {
      nextInterval = 3;
    } else {
      nextInterval = Math.max(2, Math.round(Math.max(1, prevInterval) * 1.2));
    }
    nextReps = Math.min(1000, prevReps + 1);
  } else if (rating === 'good') {
    nextEase = clampEaseFactor(prevEase);
    if (prevReps === 0) {
      nextInterval = 1;
    } else if (prevReps === 1) {
      nextInterval = 6;
    } else {
      nextInterval = Math.max(prevInterval + 1, Math.round(prevInterval * nextEase));
    }
    nextReps = Math.min(1000, prevReps + 1);
  } else {
    // easy
    nextEase = clampEaseFactor(prevEase + 0.15);
    if (prevReps === 0) {
      nextInterval = 3;
    } else if (prevReps === 1) {
      nextInterval = 9;
    } else {
      nextInterval = Math.max(prevInterval + 2, Math.round(prevInterval * nextEase * 1.3));
    }
    nextReps = Math.min(1000, prevReps + 1);
  }

  nextInterval = clampIntervalDays(nextInterval);
  const nextReviewAtMs = clampEpochMs(nowMs + Math.round(nextInterval * DAY_MS), nowMs + DAY_MS);

  return {
    ...current,
    easeFactor: nextEase,
    intervalDays: nextInterval,
    repetitions: nextReps,
    lapses: nextLapses,
    totalReviews: Math.min(5000, prevTotal + 1),
    lastRating: rating,
    nextReviewAtMs,
    lastReviewedAtMs: clampEpochMs(nowMs, Date.now()),
    snoozedUntilMs: 0,
  };
}

export function formatIntervalDuration(intervalDays: number): string {
  if (!Number.isFinite(intervalDays) || intervalDays <= 0) return '立即可复习';
  if (intervalDays < 1) {
    const hours = Math.max(1, Math.round(intervalDays * 24));
    return `${hours} 小时后`;
  }
  if (intervalDays < 30) {
    return `${Math.round(intervalDays)} 天后`;
  }
  if (intervalDays < 365) {
    const months = Math.round((intervalDays / 30) * 10) / 10;
    return `${months} 个月后`;
  }
  const years = Math.round((intervalDays / 365) * 10) / 10;
  return `${years} 年后`;
}

export function previewNextIntervals(
  record: SanitizedLawReviewSchedule,
  nowMs: number = Date.now()
): IntervalPreview[] {
  return RECALL_RATING_OPTIONS.map((opt) => {
    const simulated = computeNextSpacedReview(record, opt.rating, nowMs);
    return {
      rating: opt.rating,
      labelZh: opt.labelZh,
      hintZh: opt.hintZh,
      intervalDays: simulated.intervalDays,
      intervalLabel: formatIntervalDuration(simulated.intervalDays),
      nextReviewAtMs: simulated.nextReviewAtMs,
    };
  });
}

export function classifyReviewDueStatus(
  record: Pick<SanitizedLawReviewSchedule, 'nextReviewAtMs' | 'repetitions' | 'intervalDays'>,
  nowMs: number = Date.now()
): ReviewDueStatus {
  if (record.nextReviewAtMs <= nowMs) {
    return 'due';
  }
  if (record.repetitions >= 3 && record.intervalDays >= 14) {
    return 'mastered';
  }
  return 'upcoming';
}

export function isReviewNotificationEligible(
  record: Pick<SanitizedLawReviewSchedule, 'notificationsEnabled' | 'nextReviewAtMs' | 'snoozedUntilMs'>,
  nowMs: number = Date.now()
): boolean {
  if (!record.notificationsEnabled) return false;
  if (record.nextReviewAtMs > nowMs) return false;
  if (record.snoozedUntilMs > nowMs) return false;
  return true;
}

export function formatReviewCountdown(
  nextReviewAtMs: number,
  nowMs: number = Date.now()
): string {
  const diffMs = nextReviewAtMs - nowMs;
  if (diffMs <= 0) {
    const overdueHours = Math.floor(Math.abs(diffMs) / HOUR_MS);
    if (overdueHours < 1) return '今日待复习';
    if (overdueHours < 24) return `已到期 · ${overdueHours} 小时`;
    const overdueDays = Math.floor(overdueHours / 24);
    return `已逾期 ${overdueDays} 天`;
  }
  const hours = Math.ceil(diffMs / HOUR_MS);
  if (hours < 24) {
    return `${hours} 小时后`;
  }
  const days = Math.ceil(diffMs / DAY_MS);
  if (days < 30) {
    return `${days} 天后`;
  }
  const months = Math.round((days / 30) * 10) / 10;
  return `${months} 个月后`;
}

export function computeSuggestedMastery(record: SanitizedLawReviewSchedule): number {
  const base = 60 + Math.min(35, record.repetitions * 9);
  const easeBonus = Math.round((record.easeFactor - MIN_EASE_FACTOR) * 4);
  return Math.max(60, Math.min(100, base + easeBonus));
}

export function sortReviewSchedules<T extends SanitizedLawReviewSchedule>(
  records: T[],
  nowMs: number = Date.now()
): T[] {
  const rank = (r: T) => {
    const status = classifyReviewDueStatus(r, nowMs);
    if (status === 'due') return 0;
    if (status === 'upcoming') return 1;
    return 2;
  };
  return [...records].sort((a, b) => {
    const ra = rank(a);
    const rb = rank(b);
    if (ra !== rb) return ra - rb;
    return a.nextReviewAtMs - b.nextReviewAtMs;
  });
}

/**
 * Computes diff between user.bookmarks (favorited law IDs) and stored review schedules.
 * Every favorited law gets an initial optimal spaced repetition schedule; laws removed
 * from favorites are pruned from active review schedules.
 */
export function syncFavoritesWithSchedules(
  favoriteIds: string[],
  corpusLaws: PsychologyLaw[],
  existingSchedules: LawReviewScheduleRecord[],
  userId?: string | null,
  nowMs: number = Date.now()
): {
  toCreate: SanitizedLawReviewSchedule[];
  toDeleteIds: string[];
} {
  const uniqueFavSet = new Set(
    favoriteIds.filter((id) => isValidPageBookmarkId(id))
  );
  const existingMap = new Map(existingSchedules.map((s) => [s.lawId, s]));

  const toCreate: SanitizedLawReviewSchedule[] = [];
  uniqueFavSet.forEach((favId) => {
    if (!existingMap.has(favId)) {
      const resolved = resolveBookLawById(corpusLaws, favId);
      if (resolved) {
        toCreate.push(createInitialReviewSchedule(resolved, userId, nowMs));
      }
    }
  });

  const toDeleteIds: string[] = [];
  existingSchedules.forEach((sched) => {
    if (!uniqueFavSet.has(sched.lawId)) {
      toDeleteIds.push(sched.lawId);
    }
  });

  return { toCreate, toDeleteIds };
}

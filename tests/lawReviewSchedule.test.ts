import test from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_PSYCHOLOGY_LAWS } from '../src/data/laws';
import {
  DAY_MS,
  DEFAULT_EASE_FACTOR,
  HOUR_MS,
  MAX_EASE_FACTOR,
  MIN_EASE_FACTOR,
  classifyReviewDueStatus,
  computeNextSpacedReview,
  createInitialReviewSchedule,
  formatIntervalDuration,
  formatReviewCountdown,
  isReviewNotificationEligible,
  previewNextIntervals,
  sanitizeLawReviewScheduleInput,
  sortReviewSchedules,
  syncFavoritesWithSchedules,
} from '../src/utils/lawSpacedRepetition';

const NOW = 1_760_000_000_000;

test('createInitialReviewSchedule initializes SM-2 defaults immediately due for first recall', () => {
  const sched = createInitialReviewSchedule(
    {
      id: 'zeigarnik-effect',
      nameZh: '蔡格尼克效应',
      nameEn: 'Zeigarnik Effect',
      categoryZh: '记忆',
    },
    'user_123',
    NOW
  );

  assert.equal(sched.id, 'zeigarnik-effect');
  assert.equal(sched.lawId, 'zeigarnik-effect');
  assert.equal(sched.userId, 'user_123');
  assert.equal(sched.easeFactor, DEFAULT_EASE_FACTOR);
  assert.equal(sched.intervalDays, 0);
  assert.equal(sched.repetitions, 0);
  assert.equal(sched.lapses, 0);
  assert.equal(sched.totalReviews, 0);
  assert.equal(sched.lastRating, 'none');
  assert.equal(sched.nextReviewAtMs, NOW);
  assert.equal(sched.notificationsEnabled, true);
  assert.equal(classifyReviewDueStatus(sched, NOW), 'due');
  assert.equal(isReviewNotificationEligible(sched, NOW), true);
});

test('SM-2 computeNextSpacedReview follows 1d -> 6d -> EF progression for good ratings', () => {
  let sched = createInitialReviewSchedule(
    {
      id: 'anchoring-effect',
      nameZh: '锚定效应',
      nameEn: 'Anchoring Effect',
      categoryZh: '决策',
    },
    'user_123',
    NOW
  );

  // Round 1: good -> 1 day
  sched = computeNextSpacedReview(sched, 'good', NOW);
  assert.equal(sched.repetitions, 1);
  assert.equal(sched.intervalDays, 1);
  assert.equal(sched.nextReviewAtMs, NOW + DAY_MS);
  assert.equal(sched.totalReviews, 1);
  assert.equal(sched.lastRating, 'good');

  // Round 2: good -> 6 days
  const t2 = NOW + DAY_MS;
  sched = computeNextSpacedReview(sched, 'good', t2);
  assert.equal(sched.repetitions, 2);
  assert.equal(sched.intervalDays, 6);
  assert.equal(sched.nextReviewAtMs, t2 + 6 * DAY_MS);

  // Round 3: good -> 6 * 2.5 = 15 days -> mastered status before due
  const t3 = t2 + 6 * DAY_MS;
  sched = computeNextSpacedReview(sched, 'good', t3);
  assert.equal(sched.repetitions, 3);
  assert.equal(sched.intervalDays, 15);
  assert.equal(classifyReviewDueStatus(sched, t3 + DAY_MS), 'mastered');
});

test('SM-2 resets repetitions and schedules 12h check on again, while clamping easeFactor', () => {
  let sched = createInitialReviewSchedule(
    {
      id: 'loss-aversion',
      nameZh: '损失厌恶',
      nameEn: 'Loss Aversion',
      categoryZh: '决策',
    },
    'user_123',
    NOW
  );

  // Boost ease repeatedly and ensure it caps at MAX_EASE_FACTOR (3.5)
  for (let i = 0; i < 12; i += 1) {
    sched = computeNextSpacedReview(sched, 'easy', NOW + i * DAY_MS);
  }
  assert.equal(sched.easeFactor, MAX_EASE_FACTOR);

  // Trigger again -> resets repetitions to 0, increments lapses, intervalDays = 0.5
  sched = computeNextSpacedReview(sched, 'again', NOW + 20 * DAY_MS);
  assert.equal(sched.repetitions, 0);
  assert.equal(sched.lapses, 1);
  assert.equal(sched.intervalDays, 0.5);
  assert.equal(sched.nextReviewAtMs, NOW + 20 * DAY_MS + Math.round(0.5 * DAY_MS));

  // Repeated again ratings never drop below MIN_EASE_FACTOR (1.3)
  for (let i = 0; i < 15; i += 1) {
    sched = computeNextSpacedReview(sched, 'again', NOW + (21 + i) * DAY_MS);
  }
  assert.equal(sched.easeFactor, MIN_EASE_FACTOR);
});

test('previewNextIntervals returns 4 ordered rating options with human-readable labels', () => {
  const sched = createInitialReviewSchedule(
    {
      id: 'halo-effect',
      nameZh: '光环效应',
      nameEn: 'Halo Effect',
      categoryZh: '认知',
    },
    'user_123',
    NOW
  );
  const previews = previewNextIntervals(sched, NOW);
  assert.equal(previews.length, 4);
  assert.deepEqual(
    previews.map((p) => p.rating),
    ['again', 'hard', 'good', 'easy']
  );
  assert.equal(previews[0].intervalLabel, '12 小时后');
  assert.equal(previews[2].intervalLabel, '1 天后');
  assert.equal(previews[3].intervalLabel, '3 天后');
  assert.equal(formatIntervalDuration(45), '1.5 个月后');
});

test('isReviewNotificationEligible respects disabled flag, future dates, and snooze window', () => {
  const base = createInitialReviewSchedule(
    {
      id: 'spot-1',
      nameZh: '焦点效应',
      nameEn: 'Spotlight Effect',
      categoryZh: '认知',
    },
    'user_123',
    NOW
  );

  assert.equal(isReviewNotificationEligible(base, NOW), true);
  assert.equal(
    isReviewNotificationEligible({ ...base, notificationsEnabled: false }, NOW),
    false
  );
  assert.equal(
    isReviewNotificationEligible({ ...base, snoozedUntilMs: NOW + 2 * HOUR_MS }, NOW),
    false
  );
  assert.equal(
    isReviewNotificationEligible({ ...base, snoozedUntilMs: NOW + 2 * HOUR_MS }, NOW + 3 * HOUR_MS),
    true
  );
  assert.equal(
    isReviewNotificationEligible({ ...base, nextReviewAtMs: NOW + DAY_MS }, NOW),
    false
  );
  assert.equal(formatReviewCountdown(NOW - 3 * HOUR_MS, NOW), '已到期 · 3 小时');
});

test('syncFavoritesWithSchedules bridges both corpus laws and emotional library laws', () => {
  const existing = [
    createInitialReviewSchedule(
      {
        id: 'obsolete-favorite',
        nameZh: '旧收藏',
        nameEn: 'Obsolete',
        categoryZh: '认知',
      },
      'user_123',
      NOW
    ),
  ];

  const { toCreate, toDeleteIds } = syncFavoritesWithSchedules(
    ['zeigarnik-effect', 'emo-01'],
    INITIAL_PSYCHOLOGY_LAWS,
    existing,
    'user_123',
    NOW
  );

  assert.equal(toCreate.length, 2);
  assert.ok(toCreate.some((item) => item.lawId === 'zeigarnik-effect'));
  assert.ok(toCreate.some((item) => item.lawId === 'emo-01'));
  assert.deepEqual(toDeleteIds, ['obsolete-favorite']);
});

test('sanitizeLawReviewScheduleInput rejects invalid IDs and clamps out-of-range metrics', () => {
  assert.equal(
    sanitizeLawReviewScheduleInput({
      lawId: 'bad id with spaces!',
      lawNameZh: '非法ID',
      nextReviewAtMs: NOW,
    }),
    null
  );

  const sanitized = sanitizeLawReviewScheduleInput({
    lawId: 'emo-02',
    userId: 'user_abc',
    lawNameZh: '  吊桥效应  ',
    easeFactor: 9.9,
    intervalDays: 99999,
    repetitions: -5,
    lapses: 2000,
    nextReviewAtMs: NOW,
  });

  assert.ok(sanitized);
  assert.equal(sanitized.lawNameZh, '吊桥效应');
  assert.equal(sanitized.easeFactor, MAX_EASE_FACTOR);
  assert.equal(sanitized.intervalDays, 3650);
  assert.equal(sanitized.repetitions, 0);
  assert.equal(sanitized.lapses, 1000);
});

test('sortReviewSchedules orders due items before upcoming and mastered items', () => {
  const due = createInitialReviewSchedule(
    { id: 'law-due', nameZh: '到期定律', nameEn: 'Due', categoryZh: '认知' },
    'u1',
    NOW - HOUR_MS
  );
  const upcoming = {
    ...createInitialReviewSchedule(
      { id: 'law-up', nameZh: '即将定律', nameEn: 'Upcoming', categoryZh: '认知' },
      'u1',
      NOW
    ),
    repetitions: 1,
    intervalDays: 1,
    nextReviewAtMs: NOW + DAY_MS,
  };
  const mastered = {
    ...createInitialReviewSchedule(
      { id: 'law-mas', nameZh: '精通定律', nameEn: 'Mastered', categoryZh: '认知' },
      'u1',
      NOW
    ),
    repetitions: 4,
    intervalDays: 24,
    nextReviewAtMs: NOW + 24 * DAY_MS,
  };

  const sorted = sortReviewSchedules([mastered, upcoming, due], NOW);
  assert.deepEqual(
    sorted.map((s) => s.lawId),
    ['law-due', 'law-up', 'law-mas']
  );
});

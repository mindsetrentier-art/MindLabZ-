import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildBookmarkSegmentFromSnapshot,
  clampSessionTimestamp,
  cognitiveFocusAudio,
  computeRemainingFromElapsed,
  formatSessionTimestamp,
  MAX_BOOKMARK_LABEL_LEN,
  sanitizeBookmarkLabel,
} from '../src/utils/cognitiveFocusAudio';
import {
  isValidFirestoreId,
  sanitizeFocusBookmarkInput,
  sortFocusBookmarks,
} from '../src/utils/focusBookmarkHelpers';

test('formatSessionTimestamp & clampSessionTimestamp handle seconds and hours cleanly', () => {
  assert.equal(formatSessionTimestamp(0), '00:00');
  assert.equal(formatSessionTimestamp(75), '01:15');
  assert.equal(formatSessionTimestamp(3661), '1:01:01');
  assert.equal(clampSessionTimestamp(-25), 0);
  assert.equal(clampSessionTimestamp(999999), 86400);
});

test('computeRemainingFromElapsed computes accurate remaining countdown or continuous mode', () => {
  assert.equal(computeRemainingFromElapsed(300, 0), 0);
  assert.equal(computeRemainingFromElapsed(0, 1500), 1500);
  assert.equal(computeRemainingFromElapsed(312, 1500), 1188);
  assert.equal(computeRemainingFromElapsed(1500, 1500), 1500);
});

test('sanitizeBookmarkLabel enforces maxLength and fallback', () => {
  assert.equal(sanitizeBookmarkLabel('   ', 'Default Marker'), 'Default Marker');
  const longLabel = 'A'.repeat(120);
  assert.equal(sanitizeBookmarkLabel(longLabel).length, MAX_BOOKMARK_LABEL_LEN);
});

test('buildBookmarkSegmentFromSnapshot captures acoustic state and generates fallback label', () => {
  const segment = buildBookmarkSegmentFromSnapshot({
    isPlaying: true,
    binauralPresetId: 'smr-14',
    naturePresetId: 'alpine-stream',
    beatHz: 14,
    carrierHz: 180,
    masterVolume: 0.7,
    binauralMix: 0.45,
    natureMix: 0.8,
    isMuted: false,
    timerDurationSec: 1500,
    timerRemainingSec: 1188,
    sessionElapsedSec: 312,
  });

  assert.equal(segment.timestampSec, 312);
  assert.equal(segment.binauralPresetId, 'smr-14');
  assert.equal(segment.naturePresetId, 'alpine-stream');
  assert.equal(segment.beatHz, 14);
  assert.equal(segment.carrierHz, 180);
  assert.ok(segment.label.includes('05:12'));
});

test('sanitizeFocusBookmarkInput enforces Firestore rule boundaries', () => {
  const sanitized = sanitizeFocusBookmarkInput({
    id: 'bad id with spaces!',
    userId: 'user_123',
    label: '  Deep   Flow   Session  ',
    timestampSec: -50,
    beatHz: 120,
    carrierHz: 50,
    binauralMix: 2.5,
    natureMix: -0.5,
    masterVolume: 1.8,
    timerDurationSec: 99999,
    binauralPresetId: 'non-existent' as any,
    naturePresetId: 'unknown' as any,
  });

  assert.equal(isValidFirestoreId(sanitized.id), true);
  assert.equal(sanitized.userId, 'user_123');
  assert.equal(sanitized.label, 'Deep Flow Session');
  assert.equal(sanitized.timestampSec, 0);
  assert.equal(sanitized.beatHz, 45);
  assert.equal(sanitized.carrierHz, 100);
  assert.equal(sanitized.binauralMix, 1);
  assert.equal(sanitized.natureMix, 0);
  assert.equal(sanitized.masterVolume, 1);
  assert.equal(sanitized.timerDurationSec, 14400);
  assert.equal(sanitized.binauralPresetId, 'gamma-40');
  assert.equal(sanitized.naturePresetId, 'canopy-rain');
});

test('sortFocusBookmarks supports newest and timestamp ordering', () => {
  const items = [
    sanitizeFocusBookmarkInput({ id: 'bm_1', userId: 'u1', label: 'Mid', timestampSec: 420 }),
    sanitizeFocusBookmarkInput({ id: 'bm_2', userId: 'u1', label: 'Start', timestampSec: 60 }),
    sanitizeFocusBookmarkInput({ id: 'bm_3', userId: 'u1', label: 'Late', timestampSec: 900 }),
  ].map((item, idx) => ({
    ...item,
    createdAt: new Date(1700000000000 + idx * 1000).toISOString(),
  }));

  const byTimestamp = sortFocusBookmarks(items, 'timestamp');
  assert.deepEqual(
    byTimestamp.map((i) => i.timestampSec),
    [60, 420, 900]
  );

  const byNewest = sortFocusBookmarks(items, 'newest');
  assert.deepEqual(
    byNewest.map((i) => i.id),
    ['bm_3', 'bm_2', 'bm_1']
  );
});

test('cognitiveFocusAudio.seekSessionTimestamp & applySessionBookmark restore exact segment state', () => {
  cognitiveFocusAudio.setTimerDuration(25);
  cognitiveFocusAudio.seekSessionTimestamp(245);
  const afterSeek = cognitiveFocusAudio.getSnapshot();
  assert.equal(afterSeek.sessionElapsedSec, 245);
  assert.equal(afterSeek.timerRemainingSec, 1500 - 245);

  cognitiveFocusAudio.applySessionBookmark(
    {
      timestampSec: 615,
      binauralPresetId: 'theta-6',
      naturePresetId: 'ocean-tide',
      beatHz: 6.5,
      carrierHz: 136,
      binauralMix: 0.55,
      natureMix: 0.65,
      masterVolume: 0.72,
      timerDurationSec: 45 * 60,
    },
    { autoPlay: false }
  );

  const restored = cognitiveFocusAudio.getSnapshot();
  assert.equal(restored.sessionElapsedSec, 615);
  assert.equal(restored.timerDurationSec, 2700);
  assert.equal(restored.timerRemainingSec, 2700 - 615);
  assert.equal(restored.binauralPresetId, 'theta-6');
  assert.equal(restored.naturePresetId, 'ocean-tide');
  assert.equal(restored.beatHz, 6.5);
  assert.equal(restored.carrierHz, 136);
  assert.equal(restored.binauralMix, 0.55);
  assert.equal(restored.natureMix, 0.65);
  assert.equal(restored.masterVolume, 0.72);
});

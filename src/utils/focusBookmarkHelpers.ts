import {
  BINAURAL_PRESETS,
  NATURE_PRESETS,
  BinauralPresetId,
  NaturePresetId,
  FocusSessionBookmark,
  FocusSessionBookmarkInput,
  MAX_BOOKMARK_LABEL_LEN,
  MAX_SESSION_TIMESTAMP_SEC,
  MAX_TIMER_DURATION_SEC,
  clampSessionTimestamp,
  formatSessionTimestamp,
  sanitizeBookmarkLabel,
} from './cognitiveFocusAudio';

export function createFocusBookmarkId(): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `bm_${Date.now()}_${rand}`;
}

export function isValidFirestoreId(id: string): boolean {
  return (
    typeof id === 'string' &&
    id.length >= 1 &&
    id.length <= 128 &&
    /^[a-zA-Z0-9_-]+$/.test(id)
  );
}

export function sanitizeFocusBookmarkInput(
  raw: Partial<FocusSessionBookmarkInput> & { userId?: string }
): FocusSessionBookmarkInput {
  const validBinaural = BINAURAL_PRESETS.some((p) => p.id === raw.binauralPresetId)
    ? (raw.binauralPresetId as BinauralPresetId)
    : 'gamma-40';
  const validNature = NATURE_PRESETS.some((n) => n.id === raw.naturePresetId)
    ? (raw.naturePresetId as NaturePresetId)
    : 'canopy-rain';

  const binauralMeta =
    BINAURAL_PRESETS.find((p) => p.id === validBinaural) || BINAURAL_PRESETS[0];
  const natureMeta =
    NATURE_PRESETS.find((n) => n.id === validNature) || NATURE_PRESETS[0];

  const timestampSec = clampSessionTimestamp(Number(raw.timestampSec ?? 0));
  const beatHz = Math.max(
    4,
    Math.min(45, Number((Number(raw.beatHz ?? binauralMeta.beatHz) || binauralMeta.beatHz).toFixed(1)))
  );
  const carrierHz = Math.max(
    100,
    Math.min(320, Math.round(Number(raw.carrierHz ?? binauralMeta.carrierHz) || binauralMeta.carrierHz))
  );
  const binauralMix = Math.max(
    0,
    Math.min(1, Number((Number(raw.binauralMix ?? 0.42) || 0).toFixed(2)))
  );
  const natureMix = Math.max(
    0,
    Math.min(1, Number((Number(raw.natureMix ?? 0.72) || 0).toFixed(2)))
  );
  const masterVolume = Math.max(
    0,
    Math.min(1, Number((Number(raw.masterVolume ?? 0.68) || 0).toFixed(2)))
  );
  const timerDurationSec = Math.max(
    0,
    Math.min(MAX_TIMER_DURATION_SEC, Math.round(Number(raw.timerDurationSec ?? 1500) || 0))
  );

  const safeId = isValidFirestoreId(String(raw.id || ''))
    ? String(raw.id)
    : createFocusBookmarkId();
  const safeUserId = isValidFirestoreId(String(raw.userId || ''))
    ? String(raw.userId)
    : 'guest_user';

  const defaultLabel = `${binauralMeta.nameZh} · ${natureMeta.nameZh} @ ${formatSessionTimestamp(timestampSec)}`;

  return {
    id: safeId,
    userId: safeUserId,
    label: sanitizeBookmarkLabel(String(raw.label || ''), defaultLabel).slice(
      0,
      MAX_BOOKMARK_LABEL_LEN
    ),
    timestampSec: Math.max(0, Math.min(MAX_SESSION_TIMESTAMP_SEC, timestampSec)),
    binauralPresetId: validBinaural,
    naturePresetId: validNature,
    beatHz,
    carrierHz,
    binauralMix,
    natureMix,
    masterVolume,
    timerDurationSec,
  };
}

function resolveTimestampMs(value: unknown): number {
  if (!value) return 0;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  if (typeof value === 'object' && value !== null) {
    const maybeTs = value as { toMillis?: () => number; seconds?: number };
    if (typeof maybeTs.toMillis === 'function') {
      return maybeTs.toMillis();
    }
    if (typeof maybeTs.seconds === 'number') {
      return maybeTs.seconds * 1000;
    }
  }
  return 0;
}

export function sortFocusBookmarks(
  bookmarks: FocusSessionBookmark[],
  mode: 'newest' | 'timestamp' = 'newest'
): FocusSessionBookmark[] {
  const copy = [...bookmarks];
  if (mode === 'timestamp') {
    copy.sort((a, b) => a.timestampSec - b.timestampSec);
    return copy;
  }
  copy.sort((a, b) => {
    const timeDiff = resolveTimestampMs(b.createdAt) - resolveTimestampMs(a.createdAt);
    if (timeDiff !== 0) return timeDiff;
    return b.id.localeCompare(a.id);
  });
  return copy;
}

export type MarginaliaInkColor = 'sepia' | 'crimson' | 'indigo' | 'emerald';

export type MarginaliaHandwritingStyle = 'cursive' | 'running' | 'archival';

export type MarginaliaAnchorZone = 'top-margin' | 'side-margin' | 'bottom-margin';

export type MarginaliaSourceMode = 'typed' | 'dictated';

export const MAX_MARGINALIA_CONTENT_LENGTH = 800;
export const MAX_MARGINALIA_PAGE_INDEX = 11;
export const MAX_MARGINALIA_TILT_DEG = 5;

export interface LawMarginaliaNoteInput {
  id?: string;
  userId?: string;
  lawId: string;
  pageIndex: number;
  content: string;
  inkColor?: MarginaliaInkColor;
  handwritingStyle?: MarginaliaHandwritingStyle;
  anchorZone?: MarginaliaAnchorZone;
  tiltDeg?: number;
  sourceMode?: MarginaliaSourceMode;
}

export interface SanitizedLawMarginaliaNote {
  id: string;
  userId: string;
  lawId: string;
  pageIndex: number;
  content: string;
  inkColor: MarginaliaInkColor;
  handwritingStyle: MarginaliaHandwritingStyle;
  anchorZone: MarginaliaAnchorZone;
  tiltDeg: number;
  sourceMode: MarginaliaSourceMode;
}

export interface LawMarginaliaNoteRecord extends SanitizedLawMarginaliaNote {
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface MarginaliaInkPreset {
  id: MarginaliaInkColor;
  labelZh: string;
  textHex: string;
  swatchHex: string;
  borderRgba: string;
  tintRgba: string;
}

export const MARGINALIA_INK_PRESETS: MarginaliaInkPreset[] = [
  {
    id: 'sepia',
    labelZh: '古铜棕墨',
    textHex: '#5C3A16',
    swatchHex: '#7C4D1E',
    borderRgba: 'rgba(142, 91, 19, 0.34)',
    tintRgba: 'rgba(250, 241, 224, 0.92)',
  },
  {
    id: 'crimson',
    labelZh: '朱砂印泥',
    textHex: '#8C1D35',
    swatchHex: '#A82442',
    borderRgba: 'rgba(168, 36, 66, 0.32)',
    tintRgba: 'rgba(253, 242, 245, 0.92)',
  },
  {
    id: 'indigo',
    labelZh: '靛青墨迹',
    textHex: '#273A7A',
    swatchHex: '#344B96',
    borderRgba: 'rgba(52, 75, 150, 0.32)',
    tintRgba: 'rgba(241, 244, 253, 0.92)',
  },
  {
    id: 'emerald',
    labelZh: '松烟石绿',
    textHex: '#165B46',
    swatchHex: '#1D7359',
    borderRgba: 'rgba(29, 115, 89, 0.32)',
    tintRgba: 'rgba(239, 249, 244, 0.92)',
  },
];

export interface MarginaliaScriptPreset {
  id: MarginaliaHandwritingStyle;
  labelZh: string;
  className: string;
}

export const MARGINALIA_SCRIPT_PRESETS: MarginaliaScriptPreset[] = [
  {
    id: 'cursive',
    labelZh: '行草手书',
    className: 'font-handwriting-cursive',
  },
  {
    id: 'running',
    labelZh: '楷行朱笔',
    className: 'font-handwriting-running',
  },
  {
    id: 'archival',
    labelZh: '细毫札记',
    className: 'font-handwriting-archival',
  },
];

export interface MarginaliaZonePreset {
  id: MarginaliaAnchorZone;
  labelZh: string;
  shortZh: string;
}

export const MARGINALIA_ZONE_PRESETS: MarginaliaZonePreset[] = [
  {
    id: 'top-margin',
    labelZh: '天头眉批',
    shortZh: '眉批',
  },
  {
    id: 'side-margin',
    labelZh: '侧栏旁批',
    shortZh: '旁批',
  },
  {
    id: 'bottom-margin',
    labelZh: '卷尾跋语',
    shortZh: '跋语',
  },
];

const VALID_ID_REGEX = /^[a-zA-Z0-9_-]{1,128}$/;

export function isValidMarginaliaId(id: string | undefined | null): id is string {
  return typeof id === 'string' && VALID_ID_REGEX.test(id);
}

export function generateMarginaliaId(): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `mn_${Date.now().toString(36)}_${rand}`;
}

export function getInkPreset(inkColor: MarginaliaInkColor): MarginaliaInkPreset {
  return (
    MARGINALIA_INK_PRESETS.find((item) => item.id === inkColor) ||
    MARGINALIA_INK_PRESETS[0]
  );
}

export function getScriptPreset(
  style: MarginaliaHandwritingStyle
): MarginaliaScriptPreset {
  return (
    MARGINALIA_SCRIPT_PRESETS.find((item) => item.id === style) ||
    MARGINALIA_SCRIPT_PRESETS[0]
  );
}

export function getZonePreset(zone: MarginaliaAnchorZone): MarginaliaZonePreset {
  return (
    MARGINALIA_ZONE_PRESETS.find((item) => item.id === zone) ||
    MARGINALIA_ZONE_PRESETS[1]
  );
}

/**
 * Deterministic natural handwriting tilt between -2.2deg and +2.2deg based on ID.
 */
export function computeNaturalTilt(seedId: string): number {
  let hash = 0;
  for (let i = 0; i < seedId.length; i += 1) {
    hash = (hash * 31 + seedId.charCodeAt(i)) | 0;
  }
  const normalized = ((Math.abs(hash) % 45) - 22) / 10; // -2.2 .. +2.2
  return Number(normalized.toFixed(1));
}

export function clampMarginaliaPageIndex(pageIndex: number): number {
  if (!Number.isFinite(pageIndex)) return 0;
  return Math.max(0, Math.min(MAX_MARGINALIA_PAGE_INDEX, Math.round(pageIndex)));
}

export function clampMarginaliaTilt(tiltDeg: number | undefined, seedId: string): number {
  if (typeof tiltDeg !== 'number' || !Number.isFinite(tiltDeg)) {
    return computeNaturalTilt(seedId);
  }
  const clamped = Math.max(-MAX_MARGINALIA_TILT_DEG, Math.min(MAX_MARGINALIA_TILT_DEG, tiltDeg));
  return Number(clamped.toFixed(2));
}

export function sanitizeMarginaliaContent(content: string): string {
  if (typeof content !== 'string') return '';
  return content.trim().slice(0, MAX_MARGINALIA_CONTENT_LENGTH);
}

export function sanitizeInkColor(inkColor: unknown): MarginaliaInkColor {
  if (
    inkColor === 'sepia' ||
    inkColor === 'crimson' ||
    inkColor === 'indigo' ||
    inkColor === 'emerald'
  ) {
    return inkColor;
  }
  return 'sepia';
}

export function sanitizeHandwritingStyle(style: unknown): MarginaliaHandwritingStyle {
  if (style === 'cursive' || style === 'running' || style === 'archival') {
    return style;
  }
  return 'cursive';
}

export function sanitizeAnchorZone(zone: unknown): MarginaliaAnchorZone {
  if (zone === 'top-margin' || zone === 'side-margin' || zone === 'bottom-margin') {
    return zone;
  }
  return 'side-margin';
}

export function sanitizeSourceMode(mode: unknown): MarginaliaSourceMode {
  if (mode === 'dictated') return 'dictated';
  return 'typed';
}

/**
 * Validates and normalizes any raw note payload so it conforms strictly to
 * `LawMarginaliaNote` rules in `firestore.rules` & `firebase-blueprint.json`.
 */
export function sanitizeLawMarginaliaInput(
  input: LawMarginaliaNoteInput
): SanitizedLawMarginaliaNote | null {
  const safeContent = sanitizeMarginaliaContent(input.content);
  if (!safeContent) return null;

  const safeLawId = isValidMarginaliaId(input.lawId) ? input.lawId : '';
  if (!safeLawId) return null;

  const safeId = isValidMarginaliaId(input.id) ? input.id : generateMarginaliaId();
  const safeUserId = isValidMarginaliaId(input.userId) ? input.userId : 'guest_user';

  return {
    id: safeId,
    userId: safeUserId,
    lawId: safeLawId,
    pageIndex: clampMarginaliaPageIndex(input.pageIndex),
    content: safeContent,
    inkColor: sanitizeInkColor(input.inkColor),
    handwritingStyle: sanitizeHandwritingStyle(input.handwritingStyle),
    anchorZone: sanitizeAnchorZone(input.anchorZone),
    tiltDeg: clampMarginaliaTilt(input.tiltDeg, safeId),
    sourceMode: sanitizeSourceMode(input.sourceMode),
  };
}

/**
 * Combines existing draft text with newly dictated speech cleanly, avoiding awkward spacing.
 */
export function appendDictatedPhrase(existingText: string, spokenText: string): string {
  const cleanSpoken = typeof spokenText === 'string' ? spokenText.trim() : '';
  if (!cleanSpoken) return existingText.slice(0, MAX_MARGINALIA_CONTENT_LENGTH);

  const trimmedExisting = existingText.trimEnd();
  if (!trimmedExisting) {
    return cleanSpoken.slice(0, MAX_MARGINALIA_CONTENT_LENGTH);
  }

  const endsWithCjkPunctOrChar = /[\u4e00-\u9fff，。！？；：、]$/u.test(trimmedExisting);
  const startsWithCjk = /^[\u4e00-\u9fff，。！？；：、]/u.test(cleanSpoken);
  const separator = endsWithCjkPunctOrChar && startsWithCjk ? '' : ' ';

  return `${trimmedExisting}${separator}${cleanSpoken}`.slice(
    0,
    MAX_MARGINALIA_CONTENT_LENGTH
  );
}

function getTimestampMillis(ts: unknown): number {
  if (!ts) return 0;
  if (typeof ts === 'number') return ts;
  if (typeof ts === 'string') {
    const parsed = Date.parse(ts);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (typeof ts === 'object' && ts !== null && 'toMillis' in ts) {
    const maybeFn = (ts as { toMillis?: () => number }).toMillis;
    if (typeof maybeFn === 'function') return maybeFn();
  }
  return 0;
}

export function sortMarginaliaNotes(
  notes: LawMarginaliaNoteRecord[]
): LawMarginaliaNoteRecord[] {
  return [...notes].sort((a, b) => {
    const diff = getTimestampMillis(b.createdAt) - getTimestampMillis(a.createdAt);
    if (diff !== 0) return diff;
    return b.id.localeCompare(a.id);
  });
}

export function filterMarginaliaForPage(
  notes: LawMarginaliaNoteRecord[],
  lawId: string,
  pageIndex: number
): LawMarginaliaNoteRecord[] {
  const targetPage = clampMarginaliaPageIndex(pageIndex);
  return notes.filter((note) => note.lawId === lawId && note.pageIndex === targetPage);
}

export function countMarginaliaForLaw(
  notes: LawMarginaliaNoteRecord[],
  lawId: string
): number {
  return notes.filter((note) => note.lawId === lawId).length;
}

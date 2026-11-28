import { BOOK_SPREAD_DEFINITIONS } from './lawBookFolioBuilder';
import { EMOTIONAL_PSYCHOLOGY_LAWS, EmotionalPsychologyLaw } from '../data/emotionalLaws';
import type { PsychologyLaw } from '../types';

export type LawPageBookmarkKind = 'progress' | 'page-pin';

export const LAW_BOOK_TOTAL_PAGES = 12;
export const MAX_LAW_BOOK_PAGE_INDEX = LAW_BOOK_TOTAL_PAGES - 1; // 11
export const MAX_BOOKMARK_NOTE_LENGTH = 240;

const VALID_ID_REGEX = /^[a-zA-Z0-9_-]{1,128}$/;

export interface LawPageBookmarkInput {
  id?: string;
  userId?: string;
  lawId: string;
  lawNameZh: string;
  lawNameEn?: string;
  categoryZh?: string;
  pageIndex: number;
  pageTitle?: string;
  bookmarkKind?: LawPageBookmarkKind;
  note?: string;
}

export interface SanitizedLawPageBookmark {
  id: string;
  userId: string;
  lawId: string;
  lawNameZh: string;
  lawNameEn: string;
  categoryZh: string;
  pageIndex: number;
  pageTitle: string;
  bookmarkKind: LawPageBookmarkKind;
  note: string;
}

export interface LawPageBookmarkRecord extends SanitizedLawPageBookmark {
  createdAt?: unknown;
  updatedAt?: unknown;
}

export function isValidPageBookmarkId(id: string | undefined | null): id is string {
  return typeof id === 'string' && VALID_ID_REGEX.test(id);
}

/**
 * Deterministic ID for a law's continuous reading-progress bookmark (`prog_{lawId}`).
 */
export function buildProgressBookmarkId(lawId: string): string {
  const safeLawId = isValidPageBookmarkId(lawId) ? lawId : 'law';
  return `prog_${safeLawId}`.slice(0, 128);
}

export function generatePagePinBookmarkId(): string {
  const rand = Math.random().toString(36).slice(2, 9);
  return `lpb_${Date.now().toString(36)}_${rand}`;
}

export function clampLawBookPageIndex(pageIndex: number): number {
  if (!Number.isFinite(pageIndex)) return 0;
  return Math.max(0, Math.min(MAX_LAW_BOOK_PAGE_INDEX, Math.round(pageIndex)));
}

/**
 * Resolves 1-based `?page=1..12` URL query string cleanly into zero-based pageIndex (0..11).
 */
export function parsePageQueryParam(pageParam: string | null | undefined): number | undefined {
  if (!pageParam) return undefined;
  const numeric = Number(pageParam);
  if (!Number.isFinite(numeric)) return undefined;
  return clampLawBookPageIndex(Math.round(numeric) - 1);
}

export function getBookPageMeta(pageIndex: number): {
  pageIndex: number;
  pageNumber: number;
  spreadIndex: number;
  roman: string;
  titleZh: string;
} {
  const clamped = clampLawBookPageIndex(pageIndex);
  const spreadIndex = Math.floor(clamped / 2);
  const spread = BOOK_SPREAD_DEFINITIONS[spreadIndex] || BOOK_SPREAD_DEFINITIONS[0];
  return {
    pageIndex: clamped,
    pageNumber: clamped + 1,
    spreadIndex,
    roman: spread.roman,
    titleZh: spread.titleZh,
  };
}

export function computeReadingProgressPercent(pageIndex: number): number {
  const clamped = clampLawBookPageIndex(pageIndex);
  return Math.round(((clamped + 1) / LAW_BOOK_TOTAL_PAGES) * 100);
}

export function sanitizeLawPageBookmarkInput(
  input: LawPageBookmarkInput
): SanitizedLawPageBookmark | null {
  const safeLawId = isValidPageBookmarkId(input.lawId) ? input.lawId : '';
  if (!safeLawId) return null;

  const safeLawNameZh =
    typeof input.lawNameZh === 'string' ? input.lawNameZh.trim().slice(0, 120) : '';
  if (!safeLawNameZh) return null;

  const safeLawNameEn =
    typeof input.lawNameEn === 'string' ? input.lawNameEn.trim().slice(0, 160) : '';

  const safeCategoryZh =
    typeof input.categoryZh === 'string' && input.categoryZh.trim()
      ? input.categoryZh.trim().slice(0, 40)
      : '心理学';

  const safeKind: LawPageBookmarkKind =
    input.bookmarkKind === 'page-pin' ? 'page-pin' : 'progress';

  const safePageIndex = clampLawBookPageIndex(input.pageIndex);
  const defaultMeta = getBookPageMeta(safePageIndex);
  const safePageTitle =
    typeof input.pageTitle === 'string' && input.pageTitle.trim()
      ? input.pageTitle.trim().slice(0, 80)
      : `FOL. ${defaultMeta.roman} · ${defaultMeta.titleZh}`;

  const safeNote =
    typeof input.note === 'string'
      ? input.note.trim().slice(0, MAX_BOOKMARK_NOTE_LENGTH)
      : '';

  const safeId = isValidPageBookmarkId(input.id)
    ? input.id
    : safeKind === 'progress'
    ? buildProgressBookmarkId(safeLawId)
    : generatePagePinBookmarkId();

  const safeUserId = isValidPageBookmarkId(input.userId) ? input.userId : 'guest_user';

  return {
    id: safeId,
    userId: safeUserId,
    lawId: safeLawId,
    lawNameZh: safeLawNameZh,
    lawNameEn: safeLawNameEn,
    categoryZh: safeCategoryZh,
    pageIndex: safePageIndex,
    pageTitle: safePageTitle,
    bookmarkKind: safeKind,
    note: safeNote,
  };
}

function getMillis(ts: unknown): number {
  if (!ts) return 0;
  if (typeof ts === 'number') return ts;
  if (typeof ts === 'string') {
    const parsed = Date.parse(ts);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (typeof ts === 'object' && ts !== null && 'toMillis' in ts) {
    const fn = (ts as { toMillis?: () => number }).toMillis;
    if (typeof fn === 'function') return fn();
  }
  return 0;
}

export function sortLawPageBookmarks(
  bookmarks: LawPageBookmarkRecord[]
): LawPageBookmarkRecord[] {
  return [...bookmarks].sort((a, b) => {
    const diff =
      getMillis(b.updatedAt || b.createdAt) - getMillis(a.updatedAt || a.createdAt);
    if (diff !== 0) return diff;
    return b.id.localeCompare(a.id);
  });
}

export function findReadingProgressForLaw(
  bookmarks: LawPageBookmarkRecord[],
  lawId: string
): LawPageBookmarkRecord | null {
  return (
    bookmarks.find((b) => b.lawId === lawId && b.bookmarkKind === 'progress') ||
    null
  );
}

export function filterPagePinsForLaw(
  bookmarks: LawPageBookmarkRecord[],
  lawId: string
): LawPageBookmarkRecord[] {
  return bookmarks.filter(
    (b) => b.lawId === lawId && b.bookmarkKind === 'page-pin'
  );
}

/**
 * Adapts an EmotionalPsychologyLaw (emo-01..emo-50) to a full PsychologyLaw book object
 * so every law in EmotionalLawsLibraryPage opens cleanly inside LawBookReader.
 */
export function adaptEmotionalLawToPsychologyLaw(
  emo: EmotionalPsychologyLaw
): PsychologyLaw {
  const insightsText = emo.deepBreakdown.insights.join('；');
  const points = emo.practicalTakeaways.actionablePoints;

  return {
    id: emo.id,
    codeId: `EMO-${String(emo.order).padStart(2, '0')}`,
    chapter: `${emo.sectionTitle} · ${emo.sectionEn}`,
    xpReward: 30,
    evidenceLevel: 'A',
    nameZh: emo.titleZh,
    nameEn: emo.titleEn,
    category: 'emotion',
    categoryZh: '情绪',
    shortExplanation: emo.corePrinciple,
    detailedExplanation: emo.deepBreakdown.mechanism,
    whyItHappens: insightsText || emo.corePrinciple,
    realLifeExample: emo.lifeCase.scenario,
    relationshipCase: emo.lifeCase.analysis || emo.lifeCase.scenario,
    recognitionSignals:
      emo.deepBreakdown.insights.length > 0
        ? emo.deepBreakdown.insights.slice(0, 3)
        : [emo.corePrinciple],
    antiManipulation:
      points.length > 0 ? points : [emo.practicalTakeaways.summary],
    keyTakeaway: emo.practicalTakeaways.summary,
    healthyBoundary: emo.boundary || emo.practicalTakeaways.summary,
    question: `关于【${emo.titleZh}】，以下哪项行动策略最符合心智成熟与健康边界原则？`,
    answers: [
      points[0] || emo.practicalTakeaways.summary,
      '完全顺从冲动情绪，不加觉察地立即放大矛盾',
      '压抑所有感受并彻底回避任何深度沟通',
      '将所有心理投射归咎于伴侣的单一性格缺陷',
    ],
    correctAnswer: 0,
    difficulty: 'Medium',
    mastery: 0,
    relatedGame: 'memory-lab',
    icon: 'Heart',
  };
}

/**
 * Resolves any law ID or codeId across both the primary 1,348-law corpus
 * and the 50 Emotional Archive deep-dive laws.
 */
export function resolveBookLawById(
  corpusLaws: PsychologyLaw[],
  rawId: string | undefined
): PsychologyLaw | undefined {
  if (!rawId) return undefined;
  const normalized = rawId.toLowerCase();

  const direct = corpusLaws.find(
    (l) =>
      l.id.toLowerCase() === normalized ||
      (l.codeId && l.codeId.toLowerCase() === normalized)
  );
  if (direct) return direct;

  const emo = EMOTIONAL_PSYCHOLOGY_LAWS.find(
    (e) => e.id.toLowerCase() === normalized
  );
  if (!emo) return undefined;

  if (emo.isDuplicateOfCore && emo.duplicateCoreId) {
    const coreMatch = corpusLaws.find(
      (l) =>
        l.id.toLowerCase() === emo.duplicateCoreId!.toLowerCase() ||
        (l.codeId && l.codeId.toLowerCase() === emo.duplicateCoreId!.toLowerCase())
    );
    if (coreMatch) return coreMatch;
  }

  return adaptEmotionalLawToPsychologyLaw(emo);
}

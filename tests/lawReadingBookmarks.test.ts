import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LAW_BOOK_TOTAL_PAGES,
  MAX_BOOKMARK_NOTE_LENGTH,
  MAX_LAW_BOOK_PAGE_INDEX,
  adaptEmotionalLawToPsychologyLaw,
  buildProgressBookmarkId,
  clampLawBookPageIndex,
  computeReadingProgressPercent,
  filterPagePinsForLaw,
  findReadingProgressForLaw,
  getBookPageMeta,
  parsePageQueryParam,
  resolveBookLawById,
  sanitizeLawPageBookmarkInput,
  sortLawPageBookmarks,
  type LawPageBookmarkRecord,
} from '../src/utils/lawReadingBookmarkHelpers.ts';
import { INITIAL_PSYCHOLOGY_LAWS } from '../src/data/laws.ts';
import { EMOTIONAL_PSYCHOLOGY_LAWS } from '../src/data/emotionalLaws.ts';

test('clampLawBookPageIndex and parsePageQueryParam enforce 1-based query to 0..11 mapping', () => {
  assert.equal(clampLawBookPageIndex(-4), 0);
  assert.equal(clampLawBookPageIndex(0), 0);
  assert.equal(clampLawBookPageIndex(7.4), 7);
  assert.equal(clampLawBookPageIndex(99), MAX_LAW_BOOK_PAGE_INDEX);

  assert.equal(parsePageQueryParam(null), undefined);
  assert.equal(parsePageQueryParam(''), undefined);
  assert.equal(parsePageQueryParam('abc'), undefined);
  assert.equal(parsePageQueryParam('1'), 0);
  assert.equal(parsePageQueryParam('6'), 5);
  assert.equal(parsePageQueryParam('12'), 11);
  assert.equal(parsePageQueryParam('99'), 11);
  assert.equal(parsePageQueryParam('-2'), 0);
});

test('getBookPageMeta and computeReadingProgressPercent compute spread roman numerals and percentages', () => {
  const first = getBookPageMeta(0);
  assert.equal(first.pageNumber, 1);
  assert.equal(first.spreadIndex, 0);
  assert.equal(first.roman, 'I');
  assert.equal(computeReadingProgressPercent(0), Math.round((1 / LAW_BOOK_TOTAL_PAGES) * 100));

  const sixth = getBookPageMeta(5);
  assert.equal(sixth.pageNumber, 6);
  assert.equal(sixth.spreadIndex, 2);
  assert.equal(sixth.roman, 'III');
  assert.equal(computeReadingProgressPercent(5), 50);

  const last = getBookPageMeta(11);
  assert.equal(last.pageNumber, 12);
  assert.equal(last.spreadIndex, 5);
  assert.equal(last.roman, 'VI');
  assert.equal(computeReadingProgressPercent(11), 100);
});

test('buildProgressBookmarkId produces deterministic IDs within 128 chars across all corpus and emotional laws', () => {
  assert.equal(buildProgressBookmarkId('zeigarnik-effect'), 'prog_zeigarnik-effect');

  for (const law of INITIAL_PSYCHOLOGY_LAWS) {
    const progId = buildProgressBookmarkId(law.id);
    assert.ok(progId.startsWith('prog_'));
    assert.ok(progId.length <= 128, `Exceeded 128 chars for ${law.id}`);
  }

  for (const emo of EMOTIONAL_PSYCHOLOGY_LAWS) {
    const progId = buildProgressBookmarkId(emo.id);
    assert.ok(progId.startsWith('prog_'));
    assert.ok(progId.length <= 128, `Exceeded 128 chars for ${emo.id}`);
  }
});

test('sanitizeLawPageBookmarkInput normalizes valid payloads, clamps pages/notes, and rejects invalid ids', () => {
  const progress = sanitizeLawPageBookmarkInput({
    userId: 'user_01',
    lawId: 'anchoring-effect',
    lawNameZh: '  锚定效应  ',
    lawNameEn: 'Anchoring Effect',
    categoryZh: '决策',
    pageIndex: 4,
    bookmarkKind: 'progress',
    note: 'N'.repeat(MAX_BOOKMARK_NOTE_LENGTH + 40),
  });

  assert.ok(progress);
  assert.equal(progress.id, 'prog_anchoring-effect');
  assert.equal(progress.lawNameZh, '锚定效应');
  assert.equal(progress.pageIndex, 4);
  assert.equal(progress.bookmarkKind, 'progress');
  assert.equal(progress.pageTitle, 'FOL. III · 全景实案');
  assert.equal(progress.note.length, MAX_BOOKMARK_NOTE_LENGTH);

  const pin = sanitizeLawPageBookmarkInput({
    id: 'lpb_custom_1',
    lawId: 'emo-01',
    lawNameZh: '吊桥效应',
    pageIndex: 42, // clamps to 11
    bookmarkKind: 'page-pin',
    note: '  情绪归因错误案例  ',
  });
  assert.ok(pin);
  assert.equal(pin.id, 'lpb_custom_1');
  assert.equal(pin.pageIndex, 11);
  assert.equal(pin.bookmarkKind, 'page-pin');
  assert.equal(pin.note, '情绪归因错误案例');

  assert.equal(
    sanitizeLawPageBookmarkInput({
      lawId: 'invalid id with spaces',
      lawNameZh: 'Test',
      pageIndex: 1,
    }),
    null
  );
  assert.equal(
    sanitizeLawPageBookmarkInput({
      lawId: 'valid-id',
      lawNameZh: '   ',
      pageIndex: 1,
    }),
    null
  );
});

test('sortLawPageBookmarks, findReadingProgressForLaw, and filterPagePinsForLaw partition accurately', () => {
  const sample: LawPageBookmarkRecord[] = [
    {
      id: 'prog_emo-01',
      userId: 'u1',
      lawId: 'emo-01',
      lawNameZh: '吊桥效应',
      lawNameEn: 'Suspension Bridge Effect',
      categoryZh: '情绪',
      pageIndex: 3,
      pageTitle: 'FOL. II · 实证边界与档案',
      bookmarkKind: 'progress',
      note: '',
      updatedAt: '2026-06-01T08:00:00.000Z',
    },
    {
      id: 'lpb_1',
      userId: 'u1',
      lawId: 'emo-01',
      lawNameZh: '吊桥效应',
      lawNameEn: 'Suspension Bridge Effect',
      categoryZh: '情绪',
      pageIndex: 6,
      pageTitle: 'FOL. IV · 识别信号与防御',
      bookmarkKind: 'page-pin',
      note: '三大识别信号重点页',
      updatedAt: '2026-06-01T10:00:00.000Z',
    },
    {
      id: 'prog_halo-effect',
      userId: 'u1',
      lawId: 'halo-effect',
      lawNameZh: '光环效应',
      lawNameEn: 'Halo Effect',
      categoryZh: '认知',
      pageIndex: 8,
      pageTitle: 'FOL. V · 博弈实验与思辨',
      bookmarkKind: 'progress',
      note: '',
      updatedAt: '2026-06-01T12:00:00.000Z',
    },
  ];

  const sorted = sortLawPageBookmarks(sample);
  assert.deepEqual(
    sorted.map((item) => item.id),
    ['prog_halo-effect', 'lpb_1', 'prog_emo-01']
  );

  const emoProg = findReadingProgressForLaw(sample, 'emo-01');
  assert.ok(emoProg);
  assert.equal(emoProg.pageIndex, 3);

  const emoPins = filterPagePinsForLaw(sample, 'emo-01');
  assert.equal(emoPins.length, 1);
  assert.equal(emoPins[0].id, 'lpb_1');
  assert.equal(findReadingProgressForLaw(sample, 'non-existent'), null);
});

test('resolveBookLawById resolves all core corpus laws and all 50 emotional archive laws into valid books', () => {
  const coreBySlug = resolveBookLawById(INITIAL_PSYCHOLOGY_LAWS, 'zeigarnik-effect');
  assert.ok(coreBySlug);
  assert.equal(coreBySlug.id, 'zeigarnik-effect');

  for (const emo of EMOTIONAL_PSYCHOLOGY_LAWS) {
    const resolved = resolveBookLawById(INITIAL_PSYCHOLOGY_LAWS, emo.id);
    assert.ok(resolved, `Failed to resolve emotional law ${emo.id}`);
    assert.ok(resolved.nameZh.length > 0);
    assert.ok(resolved.shortExplanation.length > 0);
    assert.ok(resolved.answers.length >= 2);
  }

  const adapted = adaptEmotionalLawToPsychologyLaw(EMOTIONAL_PSYCHOLOGY_LAWS[0]);
  assert.equal(adapted.id, EMOTIONAL_PSYCHOLOGY_LAWS[0].id);
  assert.equal(adapted.categoryZh, '情绪');

  assert.equal(resolveBookLawById(INITIAL_PSYCHOLOGY_LAWS, 'definitely-missing-law'), undefined);
});

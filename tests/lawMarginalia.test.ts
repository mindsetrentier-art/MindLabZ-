import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MARGINALIA_INK_PRESETS,
  MARGINALIA_SCRIPT_PRESETS,
  MARGINALIA_ZONE_PRESETS,
  MAX_MARGINALIA_CONTENT_LENGTH,
  appendDictatedPhrase,
  computeNaturalTilt,
  countMarginaliaForLaw,
  filterMarginaliaForPage,
  sanitizeLawMarginaliaInput,
  sortMarginaliaNotes,
  type LawMarginaliaNoteRecord,
} from '../src/utils/lawMarginaliaHelpers.ts';

test('sanitizeLawMarginaliaInput normalizes valid payloads and clamps fields cleanly', () => {
  const sanitized = sanitizeLawMarginaliaInput({
    id: 'note_abc_123',
    userId: 'user_xyz',
    lawId: 'confirmation-bias',
    pageIndex: 25, // clamps to 11
    content: '  当先入为主时，大脑只搜集支持既有假设的证据。  ',
    inkColor: 'crimson',
    handwritingStyle: 'running',
    anchorZone: 'top-margin',
    tiltDeg: -12, // clamps to -5
    sourceMode: 'dictated',
  });

  assert.ok(sanitized);
  assert.equal(sanitized.id, 'note_abc_123');
  assert.equal(sanitized.userId, 'user_xyz');
  assert.equal(sanitized.lawId, 'confirmation-bias');
  assert.equal(sanitized.pageIndex, 11);
  assert.equal(sanitized.content, '当先入为主时，大脑只搜集支持既有假设的证据。');
  assert.equal(sanitized.inkColor, 'crimson');
  assert.equal(sanitized.handwritingStyle, 'running');
  assert.equal(sanitized.anchorZone, 'top-margin');
  assert.equal(sanitized.tiltDeg, -5);
  assert.equal(sanitized.sourceMode, 'dictated');
});

test('sanitizeLawMarginaliaInput rejects empty content or invalid lawId and applies defaults for unknown enums', () => {
  assert.equal(
    sanitizeLawMarginaliaInput({
      lawId: 'anchoring-effect',
      pageIndex: 1,
      content: '   ',
    }),
    null
  );

  assert.equal(
    sanitizeLawMarginaliaInput({
      lawId: 'bad law id with spaces',
      pageIndex: 1,
      content: 'Valid note text',
    }),
    null
  );

  const fallback = sanitizeLawMarginaliaInput({
    lawId: 'anchoring-effect',
    pageIndex: -3,
    content: 'X'.repeat(MAX_MARGINALIA_CONTENT_LENGTH + 90),
    inkColor: 'neon-pink' as never,
    handwritingStyle: 'comic-sans' as never,
    anchorZone: 'center' as never,
    sourceMode: 'telepathy' as never,
  });

  assert.ok(fallback);
  assert.equal(fallback.pageIndex, 0);
  assert.equal(fallback.content.length, MAX_MARGINALIA_CONTENT_LENGTH);
  assert.equal(fallback.inkColor, 'sepia');
  assert.equal(fallback.handwritingStyle, 'cursive');
  assert.equal(fallback.anchorZone, 'side-margin');
  assert.equal(fallback.sourceMode, 'typed');
  assert.ok(fallback.tiltDeg >= -2.2 && fallback.tiltDeg <= 2.2);
});

test('filterMarginaliaForPage and countMarginaliaForLaw partition notes per law and book page', () => {
  const sample: LawMarginaliaNoteRecord[] = [
    {
      id: 'n1',
      userId: 'u1',
      lawId: 'dunning-kruger-effect',
      pageIndex: 0,
      content: '卷首眉批',
      inkColor: 'sepia',
      handwritingStyle: 'cursive',
      anchorZone: 'top-margin',
      tiltDeg: -1.1,
      sourceMode: 'typed',
      createdAt: '2026-01-01T10:00:00.000Z',
    },
    {
      id: 'n2',
      userId: 'u1',
      lawId: 'dunning-kruger-effect',
      pageIndex: 3,
      content: '第四页口述批注',
      inkColor: 'indigo',
      handwritingStyle: 'archival',
      anchorZone: 'side-margin',
      tiltDeg: 1.4,
      sourceMode: 'dictated',
      createdAt: '2026-01-01T12:00:00.000Z',
    },
    {
      id: 'n3',
      userId: 'u1',
      lawId: 'halo-effect',
      pageIndex: 3,
      content: '另一条定律的批注',
      inkColor: 'emerald',
      handwritingStyle: 'running',
      anchorZone: 'bottom-margin',
      tiltDeg: 0.5,
      sourceMode: 'typed',
      createdAt: '2026-01-01T13:00:00.000Z',
    },
  ];

  assert.equal(countMarginaliaForLaw(sample, 'dunning-kruger-effect'), 2);
  assert.equal(countMarginaliaForLaw(sample, 'halo-effect'), 1);

  const page3Notes = filterMarginaliaForPage(sample, 'dunning-kruger-effect', 3);
  assert.equal(page3Notes.length, 1);
  assert.equal(page3Notes[0].id, 'n2');

  const sorted = sortMarginaliaNotes(sample);
  assert.deepEqual(
    sorted.map((s) => s.id),
    ['n3', 'n2', 'n1']
  );
});

test('appendDictatedPhrase joins CJK and Latin segments cleanly within content limit', () => {
  assert.equal(appendDictatedPhrase('', '  注意锚定效应  '), '注意锚定效应');
  assert.equal(
    appendDictatedPhrase('核心结论：', '先设定独立基准线'),
    '核心结论：先设定独立基准线'
  );
  assert.equal(
    appendDictatedPhrase('Compare baseline first', 'before judging.'),
    'Compare baseline first before judging.'
  );
  const longResult = appendDictatedPhrase(
    'A'.repeat(MAX_MARGINALIA_CONTENT_LENGTH - 5),
    'exceeds boundary'
  );
  assert.equal(longResult.length, MAX_MARGINALIA_CONTENT_LENGTH);
});

test('computeNaturalTilt stays deterministic and presets expose expected archival options', () => {
  const tiltA = computeNaturalTilt('mn_test_seed_01');
  const tiltB = computeNaturalTilt('mn_test_seed_01');
  assert.equal(tiltA, tiltB);
  assert.ok(tiltA >= -2.2 && tiltA <= 2.2);

  assert.equal(MARGINALIA_INK_PRESETS.length, 4);
  assert.equal(MARGINALIA_SCRIPT_PRESETS.length, 3);
  assert.equal(MARGINALIA_ZONE_PRESETS.length, 3);
});

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_PSYCHOLOGY_LAWS } from '../src/data/laws';
import {
  BOOK_SPREAD_DEFINITIONS,
  buildLawBookCodex,
  getAdjacentLaws,
  resolveLawCollectionTheme,
} from '../src/utils/lawBookFolioBuilder';
import type { StructuredLawData } from '../src/types';

describe('Law Book Codex Reader & Corpus Coverage', () => {
  it('covers all 1,348+ psychology laws across every collection and builds complete 6-spread (12-page) archival books', () => {
    assert.ok(
      INITIAL_PSYCHOLOGY_LAWS.length >= 1348,
      `Expected >= 1348 laws, got ${INITIAL_PSYCHOLOGY_LAWS.length}`
    );

    const seenThemeIds = new Set<string>();

    for (const law of INITIAL_PSYCHOLOGY_LAWS) {
      const codex = buildLawBookCodex(law);
      seenThemeIds.add(codex.theme.id);

      assert.equal(codex.spreads.length, 6, `Law ${law.id} must have 6 book spreads`);
      assert.deepEqual(codex.spreads, BOOK_SPREAD_DEFINITIONS);

      assert.ok(codex.volumeNumberLabel.length > 0, `Law ${law.id} missing volumeNumberLabel`);
      assert.ok(codex.displayDefinition.length > 0, `Law ${law.id} missing displayDefinition`);
      assert.ok(codex.displayMechanism.length > 0, `Law ${law.id} missing displayMechanism`);
      assert.ok(codex.keyTakeaway.length > 0, `Law ${law.id} missing keyTakeaway`);

      assert.ok(codex.cases.life.length > 0, `Law ${law.id} missing life case`);
      assert.ok(codex.cases.workplace.length > 0, `Law ${law.id} missing workplace case`);
      assert.ok(codex.cases.relationship.length > 0, `Law ${law.id} missing relationship case`);
      assert.ok(codex.cases.business.length > 0, `Law ${law.id} missing business case`);

      assert.ok(
        codex.recognitionSignals.length >= 1,
        `Law ${law.id} missing recognitionSignals`
      );
      assert.ok(
        codex.antiManipulation.length >= 1,
        `Law ${law.id} missing antiManipulation`
      );

      assert.ok(codex.quizList.length >= 1, `Law ${law.id} missing quiz items`);
      assert.ok(
        codex.quizList[0].question.length > 0 && codex.quizList[0].options.length >= 2,
        `Law ${law.id} invalid quiz item`
      );

      assert.ok(codex.game.title.length > 0, `Law ${law.id} missing game title`);
      assert.ok(codex.game.scenario.length > 0, `Law ${law.id} missing game scenario`);
      assert.ok(codex.game.option_a.length > 0, `Law ${law.id} missing game option_a`);
      assert.ok(codex.game.option_b.length > 0, `Law ${law.id} missing game option_b`);
      assert.ok(codex.game.insight.length > 0, `Law ${law.id} missing game insight`);
    }

    assert.ok(
      seenThemeIds.size >= 8,
      `Expected multiple archival collection themes across corpus, found: ${[...seenThemeIds].join(', ')}`
    );
  });

  it('resolves collection-specific themes and boundary notices cleanly', () => {
    const micro = INITIAL_PSYCHOLOGY_LAWS.find((l) => l.isMicroexpression);
    const criminal = INITIAL_PSYCHOLOGY_LAWS.find((l) => l.isCriminalPsychology);
    const reverse = INITIAL_PSYCHOLOGY_LAWS.find((l) => l.isReversePsychology);
    const sexual = INITIAL_PSYCHOLOGY_LAWS.find((l) => l.isSexualPsychology);
    const intimate = INITIAL_PSYCHOLOGY_LAWS.find((l) => l.isIntimateRelationship);
    const love100 = INITIAL_PSYCHOLOGY_LAWS.find((l) => l.isLove100Psychology);
    const loveCodex = INITIAL_PSYCHOLOGY_LAWS.find((l) => l.isLoveCodex);

    assert.ok(micro && resolveLawCollectionTheme(micro).id === 'microexpression');
    assert.ok(criminal && resolveLawCollectionTheme(criminal).id === 'criminal');
    assert.ok(reverse && resolveLawCollectionTheme(reverse).id === 'reverse');
    assert.ok(sexual && resolveLawCollectionTheme(sexual).id === 'sexual');
    assert.ok(intimate && resolveLawCollectionTheme(intimate).id === 'intimate');
    assert.ok(love100 && resolveLawCollectionTheme(love100).id === 'love100');
    assert.ok(loveCodex && resolveLawCollectionTheme(loveCodex).id === 'love-codex');

    const criminalCodex = buildLawBookCodex(criminal!);
    assert.equal(criminalCodex.boundaryNotice?.tone, 'rose');

    const sexualCodex = buildLawBookCodex(sexual!);
    assert.equal(sexualCodex.boundaryNotice?.tone, 'indigo');
  });

  it('merges structured AI overrides over default law content', () => {
    const sampleLaw = INITIAL_PSYCHOLOGY_LAWS[0];
    const structured: StructuredLawData = {
      id: sampleLaw.id,
      title_zh: sampleLaw.nameZh,
      title_en: sampleLaw.nameEn,
      category: sampleLaw.categoryZh,
      difficulty: sampleLaw.difficulty,
      evidence_level: 'A+',
      definition: '结构化 AI 重构后的权威定义。',
      mechanism: '结构化神经认知机制剖析。',
      real_life_case: '生活真实重构案例。',
      workplace_case: '职场重构案例。',
      relationship_case: '亲密关系重构案例。',
      business_case: '商业博弈重构案例。',
      recognition_signals: ['信号一', '信号二', '信号三'],
      anti_manipulation: ['对策一', '对策二'],
      quiz: [
        {
          question: '测试题干？',
          options: ['选项A', '选项B', '选项C', '选项D'],
          answer_index: 1,
          explanation: '解析内容。',
        },
      ],
      game: {
        title: 'AI 博弈试验',
        type: 'scenario_choice',
        scenario: '高压力实验情境',
        option_a: '直觉反应',
        option_b: '元认知暂停',
        rational_choice: 'B',
        insight: '实验总结',
      },
      xp: 35,
    };

    const codex = buildLawBookCodex(sampleLaw, structured);
    assert.equal(codex.displayDefinition, '结构化 AI 重构后的权威定义。');
    assert.equal(codex.displayMechanism, '结构化神经认知机制剖析。');
    assert.equal(codex.cases.workplace, '职场重构案例。');
    assert.deepEqual(codex.recognitionSignals, ['信号一', '信号二', '信号三']);
    assert.equal(codex.quizList[0].question, '测试题干？');
    assert.equal(codex.game.title, 'AI 博弈试验');
  });

  it('computes previous and next adjacent volumes accurately across the corpus', () => {
    const first = INITIAL_PSYCHOLOGY_LAWS[0];
    const second = INITIAL_PSYCHOLOGY_LAWS[1];
    const last = INITIAL_PSYCHOLOGY_LAWS[INITIAL_PSYCHOLOGY_LAWS.length - 1];

    const firstAdj = getAdjacentLaws(INITIAL_PSYCHOLOGY_LAWS, first.id);
    assert.equal(firstAdj.currentIndex, 0);
    assert.equal(firstAdj.prevLaw, null);
    assert.equal(firstAdj.nextLaw?.id, second.id);

    const secondAdj = getAdjacentLaws(INITIAL_PSYCHOLOGY_LAWS, second.id);
    assert.equal(secondAdj.currentIndex, 1);
    assert.equal(secondAdj.prevLaw?.id, first.id);

    const lastAdj = getAdjacentLaws(INITIAL_PSYCHOLOGY_LAWS, last.id);
    assert.equal(lastAdj.currentIndex, INITIAL_PSYCHOLOGY_LAWS.length - 1);
    assert.equal(lastAdj.nextLaw, null);
    assert.ok(lastAdj.prevLaw !== null);

    const missingAdj = getAdjacentLaws(INITIAL_PSYCHOLOGY_LAWS, 'non-existent-id-xyz');
    assert.equal(missingAdj.currentIndex, -1);
    assert.equal(missingAdj.prevLaw, null);
    assert.equal(missingAdj.nextLaw, null);

    const emptyAdj = getAdjacentLaws([], first.id);
    assert.equal(emptyAdj.totalCount, 0);
  });
});

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  BRAIN_GYM_GAMES,
  computeBrainGymSummary,
  generateChronoSpanTargets,
  generateGoNoGoTrials,
  generateNBackSequence,
  getReflexEvaluationBand,
  sanitizeBrainGymSessionInput,
  scoreChronoSpanSession,
  scoreGoNoGoSession,
  scoreNBackSession,
  scoreReflexPulseSession,
} from '../src/utils/brainGymHelpers';
import { generateCognitiveAssessment } from '../src/services/assessmentService';
import type { UserProfile } from '../src/types';

function makeBaseUser(gameHighScores: Record<string, number> = {}): UserProfile {
  return {
    name: '测试探索者',
    avatar: '🧠',
    title: '认知学徒',
    level: 1,
    xp: 0,
    streak: 1,
    lastActiveDate: '2026-11-28',
    lawsMastered: [],
    lawMasteryMap: {},
    totalQuizzes: 0,
    quizPoints: 0,
    totalGames: 0,
    gameHighScores,
    unlockedBadges: [],
    bookmarks: [],
    selectedGoals: [],
    hasCompletedOnboarding: true,
    stats: {
      memory: 70,
      attention: 70,
      reasoning: 70,
      knowledge: 70,
      decision: 70,
    },
    weeklyActivity: [],
  };
}

describe('Brain Gym Training Engine & Assessment Integration', () => {
  it('generates valid N-Back sequences with exact match truth flags and guaranteed targets', () => {
    for (const nLevel of [1, 2, 3]) {
      const steps = generateNBackSequence(16, nLevel, 9, 0.35);
      assert.equal(steps.length, 16);

      for (let i = 0; i < steps.length; i++) {
        assert.ok(steps[i].cell >= 0 && steps[i].cell < 9);
        if (i < nLevel) {
          assert.equal(steps[i].isMatch, false);
        } else {
          assert.equal(steps[i].isMatch, steps[i].cell === steps[i - nLevel].cell);
        }
      }

      const matchCount = steps.filter((s) => s.isMatch).length;
      assert.ok(matchCount >= 2, `Expected at least 2 matches for ${nLevel}-Back`);
    }
  });

  it('generates unique Chrono-Span cell indices within grid bounds', () => {
    const targets = generateChronoSpanTargets(6, 16);
    assert.equal(targets.length, 6);
    assert.equal(new Set(targets).size, 6);
    targets.forEach((cell) => {
      assert.ok(cell >= 0 && cell < 16);
    });
  });

  it('generates balanced Go / No-Go trials with both shape and label modalities', () => {
    const trials = generateGoNoGoTrials(20, 0.65);
    assert.equal(trials.length, 20);
    const goCount = trials.filter((t) => t.type === 'go').length;
    const noGoCount = trials.filter((t) => t.type === 'nogo').length;
    assert.equal(goCount, 13);
    assert.equal(noGoCount, 7);
    trials.forEach((t) => {
      assert.equal(t.symbol, t.type === 'go' ? 'circle' : 'diamond');
      assert.ok(t.label.length > 0);
    });
  });

  it('scores N-Back, Chrono-Span, Reflex Pulse, and Go/No-Go sessions within expected bounds', () => {
    const nbackStandard = scoreNBackSession({
      hits: 5,
      correctRejections: 9,
      misses: 0,
      falseAlarms: 0,
      nLevel: 1,
      avgReactionMs: 520,
      difficulty: 'standard',
    });
    const nbackMaster = scoreNBackSession({
      hits: 5,
      correctRejections: 9,
      misses: 0,
      falseAlarms: 0,
      nLevel: 3,
      avgReactionMs: 520,
      difficulty: 'master',
    });
    assert.equal(nbackStandard.accuracy, 100);
    assert.ok(nbackMaster.score > nbackStandard.score);

    const spanResult = scoreChronoSpanSession({
      maxSpan: 7,
      roundsCleared: 4,
      totalAttempts: 5,
      avgReactionMs: 640,
      difficulty: 'intense',
    });
    assert.equal(spanResult.accuracy, 80);
    assert.ok(spanResult.score > 4000);

    const fastReflex = scoreReflexPulseSession({
      latenciesMs: [185, 195, 205, 190, 200],
      falseStarts: 0,
      difficulty: 'standard',
    });
    const slowReflex = scoreReflexPulseSession({
      latenciesMs: [340, 360, 355, 345, 350],
      falseStarts: 2,
      difficulty: 'standard',
    });
    assert.equal(fastReflex.avgReactionMs, 195);
    assert.equal(fastReflex.bestReactionMs, 185);
    assert.equal(fastReflex.accuracy, 100);
    assert.ok(fastReflex.score > slowReflex.score);
    assert.ok(slowReflex.accuracy < 100);

    const emptyReflex = scoreReflexPulseSession({
      latenciesMs: [],
      falseStarts: 1,
      difficulty: 'standard',
    });
    assert.equal(emptyReflex.score, 0);
    assert.equal(emptyReflex.accuracy, 0);

    const goNoGo = scoreGoNoGoSession({
      goLatenciesMs: [310, 340, 325, 295],
      goHits: 12,
      totalGo: 13,
      correctWithholds: 6,
      totalNoGo: 7,
      difficulty: 'intense',
    });
    assert.equal(goNoGo.accuracy, 90);
    assert.equal(goNoGo.bestReactionMs, 295);
    assert.ok(goNoGo.score > 4000);
  });

  it('sanitizes arbitrary Brain Gym session inputs safely and computes ledger summaries', () => {
    const clean = sanitizeBrainGymSessionInput({
      id: 'bg test!@#',
      userId: 'user_abc',
      gameId: 'reflex-pulse',
      score: 999999999,
      accuracy: 140,
      avgReactionMs: -12,
      bestReactionMs: 188,
      maxSpan: 99,
      roundsCompleted: 5,
      xpEarned: 9999,
    });
    assert.match(clean.id, /^bg_/);
    assert.equal(clean.userId, 'user_abc');
    assert.equal(clean.category, 'reaction');
    assert.equal(clean.difficulty, 'standard');
    assert.equal(clean.score, 1_000_000);
    assert.equal(clean.accuracy, 100);
    assert.equal(clean.avgReactionMs, 0);
    assert.equal(clean.maxSpan, 32);
    assert.equal(clean.xpEarned, 500);

    const emptySummary = computeBrainGymSummary([]);
    assert.equal(emptySummary.totalSessions, 0);
    assert.equal(emptySummary.bestReflexMs, null);

    const summary = computeBrainGymSummary([
      {
        ...sanitizeBrainGymSessionInput({
          userId: 'u1',
          gameId: 'chrono-span',
          category: 'memory',
          score: 5200,
          accuracy: 92,
          maxSpan: 7,
          xpEarned: 55,
        }),
      },
      {
        ...sanitizeBrainGymSessionInput({
          userId: 'u1',
          gameId: 'reflex-pulse',
          category: 'reaction',
          score: 7900,
          accuracy: 100,
          avgReactionMs: 210,
          bestReactionMs: 178,
          xpEarned: 48,
        }),
      },
    ]);

    assert.equal(summary.totalSessions, 2);
    assert.equal(summary.memorySessions, 1);
    assert.equal(summary.reactionSessions, 1);
    assert.equal(summary.bestReflexMs, 178);
    assert.equal(summary.peakSpan, 7);
    assert.equal(summary.averageAccuracy, 96);
    assert.equal(summary.highestScoreByGame['chrono-span'], 5200);
    assert.equal(summary.highestScoreByGame['reflex-pulse'], 7900);
  });

  it('maps reaction speed bands accurately and elevates Cognitive Assessment radar scores', () => {
    assert.equal(getReflexEvaluationBand(0).label, '尚未校准');
    assert.equal(getReflexEvaluationBand(180).label, '竞技级神经传导');
    assert.equal(getReflexEvaluationBand(240).label, '敏捷稳定状态');
    assert.equal(getReflexEvaluationBand(310).label, '日常稳健区间');
    assert.equal(getReflexEvaluationBand(420).label, '热身恢复期');

    const baselineReport = generateCognitiveAssessment(makeBaseUser({}));
    const trainedReport = generateCognitiveAssessment(
      makeBaseUser({
        'nback-sequence': 4500,
        'chrono-span': 5500,
        'reflex-pulse': 8500,
        'go-nogo-gate': 6500,
      })
    );

    const getDomain = (report: typeof baselineReport, id: string) =>
      report.domains.find((d) => d.id === id)!;

    assert.ok(getDomain(trainedReport, 'memory').score > getDomain(baselineReport, 'memory').score);
    assert.ok(getDomain(trainedReport, 'speed').score > getDomain(baselineReport, 'speed').score);
    assert.ok(getDomain(trainedReport, 'focus').score > getDomain(baselineReport, 'focus').score);

    const speedGames = getDomain(trainedReport, 'speed').contributingGames;
    const reflexEntry = speedGames.find((g) => g.gameId === 'reflex-pulse');
    assert.ok(reflexEntry, 'Speed domain should include reflex-pulse');
    assert.equal(
      reflexEntry.gameNameZh,
      BRAIN_GYM_GAMES.find((g) => g.id === 'reflex-pulse')?.titleZh
    );
    assert.equal(reflexEntry.percentage, 100);
  });
});

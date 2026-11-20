import { getRapidQuizAccuracyStats } from '../services/globalCognitiveRankService';

export type ScenarioComplexityLevel = 'basic' | 'intermediate' | 'advanced';

export interface AdaptiveDifficultyProfile {
  recentAccuracy: number; // 0..100 integer
  sampleSize: number;
  source: 'recent-window' | 'run-history' | 'baseline';
  difficultyCoefficient: number; // 0.40..1.00
  scenarioComplexity: ScenarioComplexityLevel;
  distractorCount: number; // 2..5 AU distractors (total options = 1 + distractorCount)
  cueCount: number; // 2..4 observable facial cues
  tierLabelZh: string;
  complexitySummaryZh: string;
}

const RECENT_OUTCOMES_STORAGE_KEY = 'mindlabz_rapid_recent_outcomes_v1';
const ROLLING_WINDOW_SIZE = 20;
const BASELINE_ACCURACY = 72;

function loadRecentOutcomes(): boolean[] {
  try {
    if (typeof window === 'undefined') return [];
    const raw = window.localStorage.getItem(RECENT_OUTCOMES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(-ROLLING_WINDOW_SIZE).map((item) => Boolean(item));
  } catch {
    return [];
  }
}

function saveRecentOutcomes(outcomes: boolean[]): void {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(
      RECENT_OUTCOMES_STORAGE_KEY,
      JSON.stringify(outcomes.slice(-ROLLING_WINDOW_SIZE))
    );
  } catch {
    // ignore storage quota errors
  }
}

/**
 * Records a single question's first-try outcome into the rolling 20-question accuracy window
 * and returns the refreshed recent accuracy snapshot.
 */
export function recordRecentQuizQuestionOutcome(firstTryCorrect: boolean): {
  recentAccuracy: number;
  sampleSize: number;
  source: 'recent-window' | 'run-history' | 'baseline';
} {
  const outcomes = [...loadRecentOutcomes(), Boolean(firstTryCorrect)].slice(-ROLLING_WINDOW_SIZE);
  saveRecentOutcomes(outcomes);
  return getRecentQuizAccuracy();
}

/**
 * Computes the user's recent accuracy from the rolling 20-question window,
 * blending with persisted RapidQuiz run history when fewer than 3 live answers exist.
 */
export function getRecentQuizAccuracy(): {
  recentAccuracy: number;
  sampleSize: number;
  source: 'recent-window' | 'run-history' | 'baseline';
} {
  const outcomes = loadRecentOutcomes();
  const runStats = getRapidQuizAccuracyStats();

  if (outcomes.length >= 3) {
    const hits = outcomes.filter(Boolean).length;
    const windowAcc = Math.round((hits / outcomes.length) * 100);
    return {
      recentAccuracy: Math.max(0, Math.min(100, windowAcc)),
      sampleSize: outcomes.length,
      source: 'recent-window',
    };
  }

  if (runStats.runsCompleted > 0) {
    const historyAcc = Math.round(runStats.lastAccuracy * 0.65 + runStats.averageAccuracy * 0.35);
    if (outcomes.length > 0) {
      const liveHits = outcomes.filter(Boolean).length;
      const liveAcc = Math.round((liveHits / outcomes.length) * 100);
      const blended = Math.round(historyAcc * 0.6 + liveAcc * 0.4);
      return {
        recentAccuracy: Math.max(0, Math.min(100, blended)),
        sampleSize: outcomes.length,
        source: 'run-history',
      };
    }
    return {
      recentAccuracy: Math.max(0, Math.min(100, historyAcc)),
      sampleSize: runStats.totalQuestionsSolved,
      source: 'run-history',
    };
  }

  if (outcomes.length > 0) {
    const liveHits = outcomes.filter(Boolean).length;
    const liveAcc = Math.round((liveHits / outcomes.length) * 100);
    const blended = Math.round(BASELINE_ACCURACY * 0.5 + liveAcc * 0.5);
    return {
      recentAccuracy: Math.max(0, Math.min(100, blended)),
      sampleSize: outcomes.length,
      source: 'recent-window',
    };
  }

  return {
    recentAccuracy: BASELINE_ACCURACY,
    sampleSize: 0,
    source: 'baseline',
  };
}

/**
 * Converts recent accuracy (0..100) into a continuous difficulty coefficient (0.40..1.00),
 * scenario complexity tier, and dynamic AU distractor count (2..5 distractors).
 */
export function computeAdaptiveDifficultyProfile(
  recentAccuracyInput?: number,
  sampleSizeInput?: number,
  sourceInput?: 'recent-window' | 'run-history' | 'baseline'
): AdaptiveDifficultyProfile {
  const snapshot =
    typeof recentAccuracyInput === 'number'
      ? {
          recentAccuracy: Math.max(0, Math.min(100, Math.round(recentAccuracyInput))),
          sampleSize: sampleSizeInput ?? 0,
          source: sourceInput ?? ('recent-window' as const),
        }
      : getRecentQuizAccuracy();

  const acc = snapshot.recentAccuracy;

  let rawCoefficient: number;
  let scenarioComplexity: ScenarioComplexityLevel;
  let distractorCount: number;
  let cueCount: number;
  let tierLabelZh: string;
  let complexitySummaryZh: string;

  if (acc < 60) {
    rawCoefficient = 0.4 + (acc / 60) * 0.18;
    scenarioComplexity = 'basic';
    distractorCount = 2; // 3 options total (1 correct + 2 AU distractors)
    cueCount = 2;
    tierLabelZh = '基础单线索';
    complexitySummaryZh = '精简背景噪声与单一肌肉定位，每题配置 2 个 AU 干扰项（3 选 1）';
  } else if (acc < 82) {
    rawCoefficient = 0.6 + ((acc - 60) / 22) * 0.19;
    scenarioComplexity = 'intermediate';
    distractorCount = 3; // 4 options total (1 correct + 3 AU distractors)
    cueCount = 3;
    tierLabelZh = '标准双线索';
    complexitySummaryZh = '包含环境或生理混淆因子的中等情感冲突，配置 3 个 AU 干扰项（4 选 1）';
  } else if (acc < 92) {
    rawCoefficient = 0.8 + ((acc - 82) / 10) * 0.11;
    scenarioComplexity = 'advanced';
    distractorCount = 4; // 5 options total (1 correct + 4 AU distractors)
    cueCount = 4;
    tierLabelZh = '高阶复合伪装';
    complexitySummaryZh = '多重情绪掩饰、复合肌肉诱饵与从众干扰，配置 4 个高相似 AU 干扰项（5 选 1）';
  } else {
    rawCoefficient = 0.92 + ((acc - 92) / 8) * 0.08;
    scenarioComplexity = 'advanced';
    distractorCount = 5; // 6 options total (1 correct + 5 AU distractors)
    cueCount = 4;
    tierLabelZh = '巅峰多重博弈';
    complexitySummaryZh = '高压力社交伪装与复合面部诱饵极限辨析，配置 5 个高混淆 AU 干扰项（6 选 1）';
  }

  const difficultyCoefficient = Math.max(0.4, Math.min(1.0, Number(rawCoefficient.toFixed(2))));

  return {
    recentAccuracy: acc,
    sampleSize: snapshot.sampleSize,
    source: snapshot.source,
    difficultyCoefficient,
    scenarioComplexity,
    distractorCount,
    cueCount,
    tierLabelZh,
    complexitySummaryZh,
  };
}

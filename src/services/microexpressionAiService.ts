import type { MicroexpressionCatalogEntry } from '../data/microexpressionCatalog';
import {
  InjectedMicroexpressionQuestion,
  buildShuffledOptionsWithIndex,
} from '../data/microexpressionQuizScenarios';
import { cryptoRandom } from '../utils/aleatoricEngine';
import type { ScenarioComplexityLevel } from '../utils/adaptiveDifficulty';

export interface GenerateAiMicroexpressionParams {
  lawId?: string;
  excludeLawIds?: string[];
  cityContext?: string;
  qIdx?: number;
  difficultyCoefficient?: number;
  recentAccuracy?: number;
  scenarioComplexity?: ScenarioComplexityLevel;
  distractorCount?: number;
}

interface ServerScenarioResponse {
  law: MicroexpressionCatalogEntry;
  model: string;
  adaptiveDifficulty?: {
    difficultyCoefficient: number;
    recentAccuracy: number;
    scenarioComplexity: ScenarioComplexityLevel;
    distractorCount: number;
    cueCount: number;
  };
  scenario: {
    narrativeTitle: string;
    setting: string;
    conflictActors: string;
    actorAction: string;
    observableFacialCues: string[];
    questionPrompt: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
    scientificLimitation: string;
    socraticQuestion?: string;
    socraticClue?: string;
  };
}

export class AiScenarioError extends Error {
  status: number;
  code: string;

  constructor(message: string, status = 500, code = 'AI_GENERATION_FAILED') {
    super(message);
    this.name = 'AiScenarioError';
    this.status = status;
    this.code = code;
  }
}

/**
 * Calls server-side Gemini endpoint to randomly select one of ML001-ML010
 * (unless lawId is specified) and generate a character emotional-conflict
 * diagnostic scenario scaled by difficultyCoefficient and recentAccuracy.
 * Never silently fabricates fake AI data on error.
 */
export async function generateAiMicroexpressionQuestion(
  params: GenerateAiMicroexpressionParams = {}
): Promise<InjectedMicroexpressionQuestion> {
  const response = await fetch('/api/microexpressions/generate-scenario', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      lawId: params.lawId,
      excludeLawIds: params.excludeLawIds || [],
      cityContext: params.cityContext || '',
      difficultyCoefficient: params.difficultyCoefficient,
      recentAccuracy: params.recentAccuracy,
      scenarioComplexity: params.scenarioComplexity,
      distractorCount: params.distractorCount,
    }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new AiScenarioError(
      payload?.message || payload?.error || `生成失败 (HTTP ${response.status})`,
      response.status,
      payload?.error || 'AI_GENERATION_FAILED'
    );
  }

  const data = payload as ServerScenarioResponse;
  const { law, scenario, adaptiveDifficulty } = data;

  const correctOptionText =
    scenario.options[scenario.correctAnswer] ?? scenario.options[0] ?? '';
  const distractorTexts = scenario.options.filter(
    (_, idx) => idx !== scenario.correctAnswer
  );
  const targetDistractorCount =
    adaptiveDifficulty?.distractorCount ??
    params.distractorCount ??
    Math.max(2, Math.min(5, distractorTexts.length));

  // Additional client-side CSPRNG Fisher-Yates option shuffle preserving exact distractor count
  const { options: shuffledOptions, correctAnswer } = buildShuffledOptionsWithIndex(
    correctOptionText,
    distractorTexts,
    cryptoRandom,
    targetDistractorCount
  );

  const uniqueSuffix = Math.floor(cryptoRandom() * 1_000_000);
  const resolvedComplexity =
    adaptiveDifficulty?.scenarioComplexity ?? params.scenarioComplexity ?? 'intermediate';
  const resolvedDifficulty =
    resolvedComplexity === 'basic'
      ? 'Easy'
      : resolvedComplexity === 'advanced'
      ? 'Hard'
      : law.difficulty;

  return {
    id: `ai-micro-${law.lawId}-${Date.now()}-${uniqueSuffix}`,
    category: law.category,
    question: scenario.questionPrompt,
    options: shuffledOptions,
    correctAnswer,
    explanation: scenario.explanation,
    difficulty: resolvedDifficulty,
    relatedLawId: law.lawId,
    chapterTheme: `AI 情感冲突实案诊断 (${law.codeId} · ${law.category} #${law.categoryRank})`,
    cityTag: params.cityContext
      ? `${params.cityContext} · AI 微表情诊断`
      : 'AI Interactive Microexpression Lab · 情感冲突诊断',
    subTag: `AI 微表情 · ${law.actionUnitCode}`,
    sequenceToken: `${law.lawId}::ai-${uniqueSuffix}`,
    microScenario: {
      codeId: law.codeId,
      actionUnitCode: law.actionUnitCode,
      categoryZh: law.category,
      categoryRank: law.categoryRank,
      narrativeTitle: scenario.narrativeTitle,
      setting: scenario.setting,
      conflictActors: scenario.conflictActors,
      actorAction: scenario.actorAction,
      observableFacialCues:
        scenario.observableFacialCues?.length > 0
          ? scenario.observableFacialCues
          : law.observableSigns,
      scientificLimitation: scenario.scientificLimitation || law.limitations,
      isAiGenerated: true,
      socraticQuestion: scenario.socraticQuestion,
      socraticClue: scenario.socraticClue,
      difficultyCoefficient:
        adaptiveDifficulty?.difficultyCoefficient ?? params.difficultyCoefficient,
      scenarioComplexity: resolvedComplexity,
      distractorCount: Math.max(2, shuffledOptions.length - 1),
      recentAccuracy: adaptiveDifficulty?.recentAccuracy ?? params.recentAccuracy,
    },
  };
}

export interface QuestionAttemptRecord {
  questionId: string;
  lawId: string;
  codeId: string;
  actionUnitCode: string;
  category: string;
  titleZh: string;
  isMicroexpression: boolean;
  wrongAttemptsCount: number;
  wrongOptionTexts: string[];
  correctOptionText: string;
  firstTryCorrect: boolean;
  usedCognitiveHint: boolean;
}

export interface LawErrorDistributionItem {
  lawId: string;
  codeId: string;
  actionUnitCode: string;
  category: string;
  titleZh: string;
  attemptsCount: number;
  firstTryCorrectCount: number;
  totalWrongAttempts: number;
  usedHintCount: number;
  wrongOptionsSample: string[];
}

export interface RecommendedReviewLaw {
  lawId: string;
  codeId: string;
  titleZh: string;
  priority: 'high' | 'medium' | 'consolidation';
  reason: string;
  reviewAction: string;
}

export interface MicroexpressionDiagnosticSummary {
  overallLevelLabel: string;
  performanceHeadline: string;
  diagnosticAnalysis: string;
  categoryStrengths: string[];
  errorPatternInsights: string[];
  recommendedLaws: RecommendedReviewLaw[];
  nextStepAdvice: string;
}

export interface MicroexpressionDiagnosticResponse {
  model: string;
  generatedAt: string;
  errorDistribution: LawErrorDistributionItem[];
  summary: MicroexpressionDiagnosticSummary;
}

export async function generateMicroexpressionDiagnosticSummary(payload: {
  attempts: QuestionAttemptRecord[];
  metrics: {
    quizMode: string;
    totalQuestions: number;
    firstTryCorrectCount: number;
    totalWrongClicks: number;
    accuracyPercent: number;
    elapsedSeconds: number;
    score: number;
    maxCombo: number;
  };
  userMasteryMap?: Record<string, number>;
}): Promise<MicroexpressionDiagnosticResponse> {
  const response = await fetch('/api/microexpressions/diagnostic-summary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new AiScenarioError(
      data?.message || data?.error || `生成诊断总结失败 (HTTP ${response.status})`,
      response.status,
      data?.error || 'AI_DIAGNOSTIC_FAILED'
    );
  }

  return data as MicroexpressionDiagnosticResponse;
}


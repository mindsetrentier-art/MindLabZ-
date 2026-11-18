import type { MicroexpressionCatalogEntry } from '../data/microexpressionCatalog';
import {
  InjectedMicroexpressionQuestion,
  buildShuffledOptionsWithIndex,
} from '../data/microexpressionQuizScenarios';
import { cryptoRandom } from '../utils/aleatoricEngine';

export interface GenerateAiMicroexpressionParams {
  lawId?: string;
  excludeLawIds?: string[];
  cityContext?: string;
  qIdx?: number;
}

interface ServerScenarioResponse {
  law: MicroexpressionCatalogEntry;
  model: string;
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
 * diagnostic scenario. Never silently fabricates fake AI data on error.
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
  const { law, scenario } = data;

  const correctOptionText =
    scenario.options[scenario.correctAnswer] ?? scenario.options[0] ?? '';
  const distractorTexts = scenario.options.filter(
    (_, idx) => idx !== scenario.correctAnswer
  );

  // Additional client-side CSPRNG Fisher-Yates option shuffle
  const { options: shuffledOptions, correctAnswer } = buildShuffledOptionsWithIndex(
    correctOptionText,
    distractorTexts,
    cryptoRandom
  );

  const uniqueSuffix = Math.floor(cryptoRandom() * 1_000_000);

  return {
    id: `ai-micro-${law.lawId}-${Date.now()}-${uniqueSuffix}`,
    category: law.category,
    question: scenario.questionPrompt,
    options: shuffledOptions,
    correctAnswer,
    explanation: scenario.explanation,
    difficulty: law.difficulty,
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
    },
  };
}

import { PsychologyLaw } from '../types';
import {
  LOVE_DOMAIN_MAP,
  LOVE_DOMAINS,
  RawLoveConceptRecord,
} from './lovePsychologyTypes';
import { LOVE_PSYCHOLOGY_PART_1 } from './lovePsychologyDataPart1';
import { LOVE_PSYCHOLOGY_PART_2 } from './lovePsychologyDataPart2';
import { WORLD_CAPITALS } from './worldCapitals';

export const ALL_RAW_LOVE_CONCEPTS: RawLoveConceptRecord[] = [
  ...LOVE_PSYCHOLOGY_PART_1,
  ...LOVE_PSYCHOLOGY_PART_2,
];

function getIconForSubTag(subTag: string): string {
  switch (subTag) {
    case '依恋':
    case '亲密':
    case '吸引':
      return 'heart';
    case '沟通':
    case '积极关系':
    case '互动':
      return 'message-circle';
    case '认知':
    case '记忆':
      return 'brain';
    case '情绪':
    case '冲突':
    case '修复':
      return 'heart-pulse';
    case '边界':
    case '安全':
    case '信任':
      return 'shield-alert';
    default:
      return 'sparkles';
  }
}

export const LOVE_PSYCHOLOGY_LAWS: PsychologyLaw[] = ALL_RAW_LOVE_CONCEPTS.map((rec, idx) => {
  const domain = LOVE_DOMAIN_MAP[rec.domainId];
  const city = WORLD_CAPITALS[rec.assignedCityIndex] || WORLD_CAPITALS[0];
  const xpReward = rec.difficulty === 'Easy' ? 280 : rec.difficulty === 'Medium' ? 350 : 440;

  // Pick 3 real contrasting distractors from other entries far apart in index
  const d1 = ALL_RAW_LOVE_CONCEPTS[(idx + 73) % ALL_RAW_LOVE_CONCEPTS.length];
  const d2 = ALL_RAW_LOVE_CONCEPTS[(idx + 197) % ALL_RAW_LOVE_CONCEPTS.length];
  const d3 = ALL_RAW_LOVE_CONCEPTS[(idx + 349) % ALL_RAW_LOVE_CONCEPTS.length];

  return {
    id: rec.id,
    codeId: rec.codeId,
    chapter: `爱情心理 · ${domain.shortTitle}`,
    xpReward,
    evidenceLevel: 'A',
    nameZh: rec.nameZh,
    nameEn: rec.nameEn,
    category: domain.category,
    categoryZh: domain.categoryZh,
    shortExplanation: rec.fullExplanation,
    detailedExplanation: `【${rec.nameZh}（${rec.nameEn}）】属于爱情心理学「${domain.titleZh}」体系下的【${rec.subTag}】核心议题（难度等级：${rec.difficulty === 'Easy' ? '初级启蒙' : rec.difficulty === 'Medium' ? '中阶思辨' : '高阶防御'}，驻守世界首都：${city.cityZh} · ${city.cityFr}）。核心发现：${rec.corePrinciple}`,
    whyItHappens: `科学边界与深层逻辑：${rec.healthyBoundary} ${domain.description}`,
    realLifeExample: `在日常亲密互动中，当双方涉及「${rec.subTag}」议题时，【${rec.nameZh}】常决定对话走向合作共赢还是误解升级。`,
    relationshipCase: `【亲密关系实景】${rec.corePrinciple} 因此，在真实相处中必须牢记：${rec.healthyBoundary}`,
    workplaceCase: `【人际协作延伸】${rec.nameZh}揭示的「${rec.subTag}」心理规律同样适用于搭档信任建立、团队情绪共振与边界协商。`,
    businessCase: `【长期关系经营】任何持久健康的契约或用户联结，都不能仅靠短期情绪刺激，而需遵循「${rec.nameZh}」的长期可持续准则。`,
    recognitionSignals: [
      `在「${rec.subTag}」相关议题出现时，是否混淆了主观想象与持续可观察行为`,
      `是否忽略了关键前提：${rec.healthyBoundary}`,
      `在压力或不安状态下，是否用「${rec.nameZh}」给自己或伴侣强行贴标签`,
    ],
    antiManipulation: [
      rec.healthyBoundary,
      `回到「${rec.corePrinciple}」本身，用具体行为与坦诚协商替代猜测`,
      '时刻核对个人边界、自由意志与双方真实的长期福祉',
    ],
    keyTakeaway: rec.healthyBoundary,
    question: `关于爱情心理学中的「${rec.nameZh}（${rec.nameEn}）」，以下哪项最准确地概括了其核心原理与健康边界？`,
    answers: [
      rec.fullExplanation,
      d1.fullExplanation,
      d2.fullExplanation,
      d3.fullExplanation,
    ],
    correctAnswer: 0,
    difficulty: rec.difficulty,
    mastery: 0,
    relatedGame: 'love-aleatoric-arena',
    icon: getIconForSubTag(rec.subTag),
    isLoveCodex: true,
    loveDomainId: rec.domainId,
    loveDomainTitle: domain.titleZh,
    subTag: rec.subTag,
    assignedCityIndex: rec.assignedCityIndex,
    assignedCityZh: `${city.cityZh} (${city.cityFr})`,
    healthyBoundary: rec.healthyBoundary,
    experimentSetup: {
      scenario: `在「${city.cityZh} · ${domain.shortTitle}」心理实验站，面对【${rec.nameZh}】情境考验时，你会优先采取哪种应对方式？`,
      optionA: {
        label: '忽略科学边界，凭单一事件冲动定论或被动迎合',
        biasDescription: `忽略了【${rec.nameZh}】的关键提醒：${rec.healthyBoundary}`,
      },
      optionB: {
        label: `践行健康策略：${rec.healthyBoundary}`,
        rationalDescription: `准确理解「${rec.nameZh}」的科学机理与自主边界`,
      },
      globalChoicePercentageA: rec.difficulty === 'Easy' ? 58 : rec.difficulty === 'Medium' ? 68 : 76,
      insight: `【${rec.nameZh}】的核心在于理解「${rec.corePrinciple}」，同时坚守「${rec.healthyBoundary}」。`,
    },
  };
});

export const LOVE_LAWS_BY_CITY: Record<number, PsychologyLaw[]> = (() => {
  const grouped: Record<number, PsychologyLaw[]> = {};
  for (let i = 0; i < 50; i++) {
    grouped[i] = [];
  }
  for (const law of LOVE_PSYCHOLOGY_LAWS) {
    const idx = law.assignedCityIndex ?? 0;
    if (!grouped[idx]) grouped[idx] = [];
    grouped[idx].push(law);
  }
  return grouped;
})();

export function getLoveLawsForCity(cityIndex: number): PsychologyLaw[] {
  return LOVE_LAWS_BY_CITY[cityIndex] || [];
}

export const LOVE_SUBTAGS: Array<{ tag: string; count: number }> = (() => {
  const counts = new Map<string, number>();
  for (const rec of ALL_RAW_LOVE_CONCEPTS) {
    counts.set(rec.subTag, (counts.get(rec.subTag) || 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([tag, count]) => ({ tag, count }));
})();

export { LOVE_DOMAINS, LOVE_DOMAIN_MAP };

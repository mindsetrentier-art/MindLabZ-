import { CategoryType, CategoryZh, DifficultyLevel, GameType, PsychologyLaw } from '../types';
import intimatePack from './intimateRelationshipsPack.json';

interface RawIntimateLaw {
  id: string;
  title_zh: string;
  title_en: string;
  category: string;
  chapter: string;
  difficulty: string;
  xp: number;
  summary: string;
  application_context: string;
  learning_note: string;
}

export interface IntimatePillarMeta {
  id: string;
  label: string;
  enLabel: string;
  color: string;
  description: string;
  categories: string[];
  count: number;
}

export interface IntimateCategoryMeta {
  id: string;
  label: string;
  pillarId: string;
  color: string;
  description: string;
  count: number;
}

export interface IntimateContextMeta {
  id: string;
  label: string;
  shortLabel: string;
  enLabel: string;
  color: string;
  description: string;
  count: number;
}

export interface IntimateTopicMeta {
  id: string;
  chapter: string;
  titleZh: string;
  titleEn: string;
  category: string;
  pillarId: string;
  color: string;
  count: number;
}

export const INTIMATE_PSYCHOLOGY_NOTE: string =
  intimatePack.note ||
  '本资料将亲密关系研究中的理论、模型与实证概念整理为100张学习卡，并非100条对所有人都成立的绝对定律。';

const PILLAR_CONFIG: Array<{
  id: string;
  label: string;
  enLabel: string;
  color: string;
  description: string;
  categories: string[];
}> = [
  {
    id: '依恋联结与安全基地',
    label: '依恋联结与安全基地',
    enLabel: 'Attachment & Secure Base',
    color: '#BE123C',
    description: '依恋与安全感、安全基地与探索、依恋焦虑的确认循环，以及依恋回避的边界保护倾向',
    categories: ['依恋与情感联结'],
  },
  {
    id: '情绪可及与共同调节',
    label: '情绪可及与共同调节',
    enLabel: 'Emotional Availability & Co-Regulation',
    color: '#0F766E',
    description: '情绪可获得性信号、情绪回应品质、双向共同调节（Co-regulation）与先于讲道理的情绪验证',
    categories: ['情绪与支持'],
  },
  {
    id: '倾听理解与回应感知',
    label: '倾听理解与回应感知',
    enLabel: 'Listening, Disclosure & Responsiveness',
    color: '#4338CA',
    description: '积极共情倾听、循序自我表露、伴侣回应性感知（理解/接纳/关心）及非暴力沟通四要素',
    categories: ['沟通与理解'],
  },
  {
    id: '冲突降级、修复与归因',
    label: '冲突降级、修复与归因',
    enLabel: 'Conflict Repair, De-escalation & Attribution',
    color: '#B45309',
    description: '温和开场、修复尝试、暂停降温，识别批评、轻蔑、防御与石墙等升级模式及归因偏差去偏',
    categories: ['冲突与修复', '认知与期待'],
  },
];

const INTIMATE_CATEGORY_PALETTE: Record<
  string,
  {
    pillarId: string;
    color: string;
    description: string;
    mappedZh: CategoryZh;
    mappedEn: CategoryType;
  }
> = {
  '依恋与情感联结': {
    pillarId: '依恋联结与安全基地',
    color: '#BE123C',
    description: '理解成人依恋动态、安全基地支持探索、焦虑确认机制与回避退缩保护之间的互动规律',
    mappedZh: '情绪',
    mappedEn: 'emotion',
  },
  '情绪与支持': {
    pillarId: '情绪可及与共同调节',
    color: '#0F766E',
    description: '观察脆弱时刻是否接住彼此信号、及时回应、通过安抚共同降温及先验证感受再谈方案',
    mappedZh: '情绪',
    mappedEn: 'emotion',
  },
  '沟通与理解': {
    pillarId: '倾听理解与回应感知',
    color: '#4338CA',
    description: '通过复述核对的积极倾听、适度自我表露、提升被理解的回应感知与非暴力表达框架减少误读',
    mappedZh: '社会',
    mappedEn: 'social',
  },
  '冲突与修复': {
    pillarId: '冲突降级、修复与归因',
    color: '#B45309',
    description: '掌握温和开场、有效修复尝试与生理降温约定，识别并打断批评、轻蔑、防御和石墙退缩循环',
    mappedZh: '行为',
    mappedEn: 'behavior',
  },
  '认知与期待': {
    pillarId: '冲突降级、修复与归因',
    color: '#7C3AED',
    description: '觉察顺境与冲突中的归因方式偏差，区分一时情境压力与持久人格品质标签',
    mappedZh: '认知',
    mappedEn: 'cognitive',
  },
};

const CONTEXT_DISPATCH_MAP: Record<
  string,
  {
    shortLabel: string;
    enLabel: string;
    color: string;
    description: string;
    games: GameType[];
    relatedGame: GameType;
  }
> = {
  '自我觉察': {
    shortLabel: '自我觉察',
    enLabel: 'Self-Awareness',
    color: '#BE123C',
    description: '记录触发情境、自动念头、生理唤起与应对动作，比急于给自己或伴侣贴标签更客观可靠',
    games: ['intimate-aleatoric-arena', 'attribution-shift', 'emotion-detective', 'micro-habit'],
    relatedGame: 'attribution-shift',
  },
  '日常沟通': {
    shortLabel: '日常沟通',
    enLabel: 'Daily Dialogue',
    color: '#0F766E',
    description: '把理论概念拆成日常具体问题与明确请求，先复述确认彼此理解，再合作讨论解决方案',
    games: ['intimate-aleatoric-arena', 'majority-answer', 'first-impression', 'micro-habit'],
    relatedGame: 'majority-answer',
  },
  '冲突情境': {
    shortLabel: '冲突情境',
    enLabel: 'Conflict Dynamics',
    color: '#B45309',
    description: '优先降低情绪激活强度并保护彼此尊严与安全，避免在生理淹没或高压对抗中作出极端判断',
    games: ['intimate-aleatoric-arena', 'emotion-detective', 'bystander-breaker', 'mind-trap'],
    relatedGame: 'emotion-detective',
  },
  '长期关系': {
    shortLabel: '长期关系',
    enLabel: 'Long-Term Evolution',
    color: '#4338CA',
    description: '长期伴侣关系会随双方回应方式、共同生活压力与边界协商能力演化，而非一次性格测试写死',
    games: ['intimate-aleatoric-arena', 'peak-end', 'anchoring-lab', 'love100-aleatoric-arena'],
    relatedGame: 'peak-end',
  },
  '关系复盘': {
    shortLabel: '关系复盘',
    enLabel: 'Relational Review',
    color: '#7C3AED',
    description: '复盘时重点考察可重复的互动行为序列、实际修复动作与持续尊重，而非单凭印象或单点承诺',
    games: ['intimate-aleatoric-arena', 'falsification-challenge', 'psych-experiment', 'love100-aleatoric-arena'],
    relatedGame: 'falsification-challenge',
  },
};

const CONTEXT_SPLIT_MARKERS = [
  '用于自我观察时，',
  '在日常互动中，',
  '发生分歧时，',
  '长期关系会随',
  '复盘时关注',
];

function mapDifficulty(diffZh: string): DifficultyLevel {
  if (diffZh === '初级') return 'Easy';
  if (diffZh === '中级') return 'Medium';
  return 'Hard';
}

function splitIntimateSummary(summary: string): {
  coreConcept: string;
  appliedAngle: string;
} {
  for (const marker of CONTEXT_SPLIT_MARKERS) {
    const idx = summary.indexOf(marker);
    if (idx !== -1) {
      return {
        coreConcept: summary.slice(0, idx).trim(),
        appliedAngle: summary.slice(idx).trim(),
      };
    }
  }
  return {
    coreConcept: summary.trim(),
    appliedAngle: summary.trim(),
  };
}

const rawLaws = intimatePack.laws as RawIntimateLaw[];

export const INTIMATE_RELATIONSHIPS_LAWS: PsychologyLaw[] = rawLaws.map((item) => {
  const uniqueCodeId = item.id.toUpperCase();
  const uniqueId = item.id.toLowerCase().replace(/^int/, 'int-');
  const topicName = item.title_zh.split('：')[0]?.trim() || item.title_zh;
  const contextLabel = (item.application_context || '自我觉察').trim();

  const catMeta =
    INTIMATE_CATEGORY_PALETTE[item.category] || INTIMATE_CATEGORY_PALETTE['依恋与情感联结'];
  const ctxMeta = CONTEXT_DISPATCH_MAP[contextLabel] || CONTEXT_DISPATCH_MAP['自我觉察'];

  const { coreConcept, appliedAngle } = splitIntimateSummary(item.summary);
  const enBase = item.title_en.split(':')[0]?.trim() || 'Intimate Relationship Concept';
  const difficulty = mapDifficulty(item.difficulty);

  return {
    id: uniqueId,
    codeId: uniqueCodeId,
    chapter: `${item.chapter} · ${contextLabel}`,
    xpReward: item.xp || 10,
    evidenceLevel: 'A',
    nameZh: item.title_zh,
    nameEn: `${enBase} — ${ctxMeta.enLabel}`,
    category: catMeta.mappedEn,
    categoryZh: catMeta.mappedZh,
    subTag: `${catMeta.pillarId} · ${item.category} · ${contextLabel}`,
    shortExplanation: item.summary,
    detailedExplanation: `【${catMeta.pillarId} / ${item.category} · ${topicName}（${contextLabel}）】理论核心：${coreConcept} 在「${contextLabel}」维度的实践启示：${appliedAngle}`,
    whyItHappens: coreConcept,
    realLifeExample: `【${contextLabel}应用要点】${appliedAngle}`,
    workplaceCase: `在长期协作搭档与高压力项目沟通中，「${topicName}」揭示的温和开场、情绪降温和就事论事归因同样有助于防止防御性冲突升级。`,
    relationshipCase: appliedAngle,
    businessCase: `在重要合作方的长期信任维系中，主动提供清晰回应、践行情绪验证并建立修复机制，远比单次承诺更能稳定伙伴关系。`,
    recognitionSignals: [
      `觉察沟通是否正从具体事件诉求滑向指责性格缺陷或泛化批评`,
      `核对当下情绪反应是否因生理过载、未被倾听或猜测动机而被放大`,
      `检查复盘是否只依赖单次冲突切片，而忽略了长期持续回应与修复行为`,
    ],
    antiManipulation: [
      `场景践行要点：${appliedAngle}`,
      `科学科普与安全边界：${item.learning_note}`,
      '安全与自主底线：尊重双方自主、隐私、平等与持续有效同意；若存在暴力、威胁或强制控制，优先考虑人身安全并寻求专业支持',
    ],
    healthyBoundary: `${item.learning_note} ${appliedAngle}`,
    keyTakeaway: appliedAngle,
    question: `在「${contextLabel}」维度下运用亲密关系心理学「${topicName}（${item.category}）」时，哪项理解与做法最科学可靠？`,
    answers: [
      appliedAngle,
      '只要观察一两次冲突表现，就能彻底判定对方的依恋人格与一段关系的最终结局',
      '在生理情绪激烈淹没时必须立即辩出绝对对错，不能约定暂停冷静',
      '亲密关系只要互相爱着就不需要温和开场、情绪验证或主动修复尝试',
    ],
    correctAnswer: 0,
    difficulty,
    mastery: 0,
    relatedGame: ctxMeta.relatedGame,
    dispatchedGames: ctxMeta.games,
    icon: 'heart-handshake',
    limitations: `${item.learning_note} ${INTIMATE_PSYCHOLOGY_NOTE}`,
    isIntimateRelationship: true,
    intimatePillar: catMeta.pillarId,
    intimateCategory: item.category,
    intimateContext: contextLabel,
    intimateTopicName: topicName,
    intimateCoreConcept: coreConcept,
    intimateAppliedAngle: appliedAngle,
    intimateLearningNote: item.learning_note,
    experimentSetup: {
      scenario: `在「${contextLabel}」情境中面对与「${topicName}」相关的亲密关系交互时：`,
      optionA: {
        label: '凭直觉给伴侣贴固定人格标签，或在激烈对峙中升级批评与防御',
        biasDescription: '易触发情绪淹没与负面归因恶性循环，削弱关系修复窗口',
      },
      optionB: {
        label: '区分具体事实与长期互动模式，通过温和开场、情绪验证与修复降温来核对回应',
        rationalDescription: `践行「${topicName}」核心指引：${appliedAngle}`,
      },
      globalChoicePercentageA: 64,
      insight: `亲密关系心理学研究表明：决定长期满意度的关键并非完全不发生分歧，而是双方能否识别防御退缩信号并有效启动温和沟通与修复尝试。`,
    },
  };
});

export const INTIMATE_PILLARS: IntimatePillarMeta[] = PILLAR_CONFIG.map((pillar) => ({
  ...pillar,
  count: INTIMATE_RELATIONSHIPS_LAWS.filter((l) => l.intimatePillar === pillar.id).length,
}));

export const INTIMATE_CATEGORIES: IntimateCategoryMeta[] = Object.entries(INTIMATE_CATEGORY_PALETTE).map(
  ([label, meta]) => ({
    id: label,
    label,
    pillarId: meta.pillarId,
    color: meta.color,
    description: meta.description,
    count: INTIMATE_RELATIONSHIPS_LAWS.filter((l) => l.intimateCategory === label).length,
  })
);

export const INTIMATE_CONTEXTS: IntimateContextMeta[] = Object.entries(CONTEXT_DISPATCH_MAP).map(
  ([label, meta]) => ({
    id: label,
    label,
    shortLabel: meta.shortLabel,
    enLabel: meta.enLabel,
    color: meta.color,
    description: meta.description,
    count: INTIMATE_RELATIONSHIPS_LAWS.filter((l) => l.intimateContext === label).length,
  })
);

export const INTIMATE_TOPICS: IntimateTopicMeta[] = (intimatePack.chapters || []).map((ch) => {
  const titleZh = ch.chapter.replace(/^\d+\.\s*/, '').trim();
  const matched = INTIMATE_RELATIONSHIPS_LAWS.filter((l) => l.intimateTopicName === titleZh);
  const catMeta = INTIMATE_CATEGORY_PALETTE[ch.category] || INTIMATE_CATEGORY_PALETTE['依恋与情感联结'];
  const firstEn = matched[0]?.nameEn.split(' — ')[0]?.trim() || titleZh;
  return {
    id: titleZh,
    chapter: ch.chapter,
    titleZh,
    titleEn: firstEn,
    category: ch.category,
    pillarId: catMeta.pillarId,
    color: catMeta.color,
    count: matched.length,
  };
});

export function getIntimateLawsForGame(gameId: GameType): PsychologyLaw[] {
  return INTIMATE_RELATIONSHIPS_LAWS.filter(
    (law) =>
      law.relatedGame === gameId ||
      (Array.isArray(law.dispatchedGames) && law.dispatchedGames.includes(gameId))
  );
}

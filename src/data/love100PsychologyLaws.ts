import { CategoryType, CategoryZh, DifficultyLevel, GameType, PsychologyLaw } from '../types';
import love100Pack from './love100PsychologyPack.json';

interface RawLove100Law {
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

export interface Love100PillarMeta {
  id: string;
  label: string;
  enLabel: string;
  color: string;
  description: string;
  categories: string[];
  count: number;
}

export interface Love100CategoryMeta {
  id: string;
  label: string;
  pillarId: string;
  color: string;
  description: string;
  count: number;
}

export interface Love100ContextMeta {
  id: string;
  label: string;
  shortLabel: string;
  enLabel: string;
  color: string;
  description: string;
  count: number;
}

export interface Love100TopicMeta {
  id: string;
  chapter: string;
  titleZh: string;
  titleEn: string;
  category: string;
  pillarId: string;
  color: string;
  count: number;
}

export const LOVE100_PSYCHOLOGY_NOTE: string =
  love100Pack.note ||
  '本资料将20个恋爱与亲密关系心理学核心概念分别放入5种应用情境，形成100张学习卡；并非100条独立、适用于所有人的科学定律。';

const PILLAR_CONFIG: Array<{
  id: string;
  label: string;
  enLabel: string;
  color: string;
  description: string;
  categories: string[];
}> = [
  {
    id: '依恋安全与情感联结',
    label: '依恋安全与情感联结',
    enLabel: 'Attachment & Secure Base',
    color: '#E11D48',
    description: '依恋理论、成人安全/焦虑/回避倾向动态观察与亲密关系安全基地建构',
    categories: ['依恋与安全感'],
  },
  {
    id: '共情沟通与情绪调节',
    label: '共情沟通与情绪调节',
    enLabel: 'Communication & Emotion Regulation',
    color: '#DB2777',
    description: '情绪回应性、自我表露、积极倾听、非暴力沟通、嫉妒识别与情绪自我调节',
    categories: ['沟通与情绪', '情绪与自我调节'],
  },
  {
    id: '信任承诺与冲突修复',
    label: '信任承诺与冲突修复',
    enLabel: 'Trust, Commitment & Repair',
    color: '#BE185D',
    description: '冲突降温修复、个人需求与边界协商、可信赖行为积累、关系投入与公平感',
    categories: ['冲突与关系维护', '信任与承诺'],
  },
  {
    id: '吸引机制与认知去偏',
    label: '吸引机制与认知去偏',
    enLabel: 'Attraction & Cognitive Debiasing',
    color: '#9F1239',
    description: '相似性与互补吸引、熟悉效应、互惠好感，及识别光环效应、确认偏误与过度理想化',
    categories: ['吸引与择偶', '认知偏差与判断'],
  },
];

const LOVE100_CATEGORY_PALETTE: Record<
  string,
  {
    pillarId: string;
    color: string;
    description: string;
    mappedZh: CategoryZh;
    mappedEn: CategoryType;
  }
> = {
  '依恋与安全感': {
    pillarId: '依恋安全与情感联结',
    color: '#E11D48',
    description: '理解早期经验与成年依恋倾如何随安全互动而演变，建立稳定而不控制的安全基地',
    mappedZh: '情绪',
    mappedEn: 'emotion',
  },
  '沟通与情绪': {
    pillarId: '共情沟通与情绪调节',
    color: '#DB2777',
    description: '情绪回应性、循序渐进的自我表露、复述共情倾听与非暴力沟通表达框架',
    mappedZh: '情绪',
    mappedEn: 'emotion',
  },
  '情绪与自我调节': {
    pillarId: '共情沟通与情绪调节',
    color: '#EC4899',
    description: '识别嫉妒情绪的威胁信号、区分事实与猜想，运用暂停与认知重评稳定互动',
    mappedZh: '情绪',
    mappedEn: 'emotion',
  },
  '冲突与关系维护': {
    pillarId: '信任承诺与冲突修复',
    color: '#BE185D',
    description: '冲突后的及时情绪降温与修复尝试，以及用“我”句式清晰表达需求与健康边界',
    mappedZh: '行为',
    mappedEn: 'behavior',
  },
  '信任与承诺': {
    pillarId: '信任承诺与冲突修复',
    color: '#B91C1C',
    description: '由言行一致积累出的信任、共同面对选择的承诺投入及长期互动互惠公平感',
    mappedZh: '社会',
    mappedEn: 'social',
  },
  '吸引与择偶': {
    pillarId: '吸引机制与认知去偏',
    color: '#9F1239',
    description: '价值观相似与日常兼容度、反复接触熟悉感以及互惠好感背后的现实匹配检验',
    mappedZh: '社会',
    mappedEn: 'social',
  },
  '认知偏差与判断': {
    pillarId: '吸引机制与认知去偏',
    color: '#7C3AED',
    description: '警惕恋爱初期的光环以偏概全、确认偏误滤镜与脱离真实性格的理想化投射',
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
  '自我认识': {
    shortLabel: '自我认识',
    enLabel: 'Self-Awareness',
    color: '#E11D48',
    description: '观察自身的亲密期待、触发点与行为模式，把单次情绪波动与长期依恋规律区分开',
    games: ['love100-aleatoric-arena', 'attribution-shift', 'emotion-detective', 'micro-habit'],
    relatedGame: 'attribution-shift',
  },
  '恋爱初期': {
    shortLabel: '恋爱初期',
    enLabel: 'Early Dating',
    color: '#DB2777',
    description: '在好感与浪漫滤镜升温期保持好奇与事实核对，不因短期热情过早推断长期匹配',
    games: ['love100-aleatoric-arena', 'first-impression', 'anchoring-lab', 'mind-trap'],
    relatedGame: 'first-impression',
  },
  '稳定关系': {
    shortLabel: '稳定关系',
    enLabel: 'Long-Term Bond',
    color: '#BE185D',
    description: '将心理学洞察转化为日常具体协商与持续回应，关注双方边界与人生阶段演变',
    games: ['love100-aleatoric-arena', 'peak-end', 'micro-habit', 'love-aleatoric-arena'],
    relatedGame: 'peak-end',
  },
  '冲突情境': {
    shortLabel: '冲突情境',
    enLabel: 'Conflict & Repair',
    color: '#9F1239',
    description: '分歧升温时先降情绪强度再澄清事实与诉求；遇威胁或强制控制优先保障安全',
    games: ['love100-aleatoric-arena', 'emotion-detective', 'bystander-breaker', 'attribution-shift'],
    relatedGame: 'emotion-detective',
  },
  '关系复盘': {
    shortLabel: '关系复盘',
    enLabel: 'Relational Review',
    color: '#6D28D9',
    description: '回顾一段关系时考察持续行为、尊重边界与真实改善，而非仅凭口头承诺做判断',
    games: ['love100-aleatoric-arena', 'falsification-challenge', 'psych-experiment', 'love-aleatoric-arena'],
    relatedGame: 'falsification-challenge',
  },
};

const CONTEXT_SPLIT_MARKERS = [
  '可用这一概念',
  '在关系发展早期，',
  '在长期相处中，',
  '发生分歧时，',
  '回顾关系时，',
];

function mapDifficulty(diffZh: string): DifficultyLevel {
  if (diffZh === '初级') return 'Easy';
  if (diffZh === '中级') return 'Medium';
  return 'Hard';
}

function splitLove100Summary(summary: string): {
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

const rawLaws = love100Pack.laws as RawLove100Law[];

export const LOVE100_PSYCHOLOGY_LAWS: PsychologyLaw[] = rawLaws.map((item) => {
  const uniqueCodeId = item.id.toUpperCase();
  const uniqueId = item.id.toLowerCase().replace(/^lovepsy/, 'lovepsy-');
  const topicName = item.title_zh.split('：')[0]?.trim() || item.title_zh;
  const contextLabel = (item.application_context || '自我认识').trim();

  const catMeta =
    LOVE100_CATEGORY_PALETTE[item.category] || LOVE100_CATEGORY_PALETTE['依恋与安全感'];
  const ctxMeta = CONTEXT_DISPATCH_MAP[contextLabel] || CONTEXT_DISPATCH_MAP['自我认识'];

  const { coreConcept, appliedAngle } = splitLove100Summary(item.summary);
  const enBase = item.title_en.split(':')[0]?.trim() || 'Romantic Psychology Concept';
  const difficulty = mapDifficulty(item.difficulty);

  return {
    id: uniqueId,
    codeId: uniqueCodeId,
    chapter: `${item.chapter} · ${contextLabel}`,
    xpReward: item.xp || 15,
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
    workplaceCase: `在职场搭档与高信任协作关系中，同样可迁移「${topicName}」的沟通回应、边界澄清与情绪降噪原则，防止投射误读。`,
    relationshipCase: appliedAngle,
    businessCase: `在长期伙伴协同与信任经营中，坚持透明沟通、言行一致与公平互惠，避免仅凭首因或短期承诺作出长期绑定。`,
    recognitionSignals: [
      `觉察当前感受是否混入了单次情绪激动与长期稳定互动模式的混淆`,
      `核查自己是否仅凭片段好感、光环印象或脑补猜测就替对方下定性结论`,
      `在分歧发生时观察沟通是否滑向指责标签而非具体感受、需求与边界协商`,
    ],
    antiManipulation: [
      `场景践行要点：${appliedAngle}`,
      `关系安全与非诊断提示：${item.learning_note}`,
      '健康边界底线：真正的安全感来自双方持续的尊重、自由空间与可协商沟通，而非控制或强迫证明',
    ],
    healthyBoundary: `${item.learning_note} ${appliedAngle}`,
    keyTakeaway: appliedAngle,
    question: `在「${contextLabel}」视角下运用恋爱心理学「${topicName}（${item.category}）」时，哪项认知与实践最科学健康？`,
    answers: [
      appliedAngle,
      '只要凭借一次强烈心动或一次争执表现，就能立刻给人贴上固定人格或依恋标签',
      '安全感和信任应当通过高频查岗、猜测试探和要求随时回应来单方面证明',
      '只要彼此真心相爱，就不需要明确讨论个人边界或面对分歧降温沟通',
    ],
    correctAnswer: 0,
    difficulty,
    mastery: 0,
    relatedGame: ctxMeta.relatedGame,
    dispatchedGames: ctxMeta.games,
    icon: 'heart',
    limitations: `${item.learning_note} ${LOVE100_PSYCHOLOGY_NOTE}`,
    isLove100Psychology: true,
    love100Pillar: catMeta.pillarId,
    love100Category: item.category,
    love100Context: contextLabel,
    love100TopicName: topicName,
    love100CoreConcept: coreConcept,
    love100AppliedAngle: appliedAngle,
    love100LearningNote: item.learning_note,
    experimentSetup: {
      scenario: `在「${contextLabel}」情境中面对与「${topicName}」相关的亲密关系互动时：`,
      optionA: {
        label: '急于凭直觉贴标签或用试探、控制换取确定感',
        biasDescription: '易放大光环偏差与防御性冲突，削弱关系安全基地与真实理解',
      },
      optionB: {
        label: '结合情境先稳住情绪，依据持续行为、边界尊重与具体沟通来核对认识',
        rationalDescription: `遵循「${topicName}」实践启示：${appliedAngle}`,
      },
      globalChoicePercentageA: 66,
      insight: `恋爱心理学实证表明：将抽象概念落实为“观察持续行为、区隔单次波动与协商具体需求”，能显著提升伴侣信任与冲突修复质量。`,
    },
  };
});

export const LOVE100_PILLARS: Love100PillarMeta[] = PILLAR_CONFIG.map((pillar) => ({
  ...pillar,
  count: LOVE100_PSYCHOLOGY_LAWS.filter((l) => l.love100Pillar === pillar.id).length,
}));

export const LOVE100_CATEGORIES: Love100CategoryMeta[] = Object.entries(LOVE100_CATEGORY_PALETTE).map(
  ([label, meta]) => ({
    id: label,
    label,
    pillarId: meta.pillarId,
    color: meta.color,
    description: meta.description,
    count: LOVE100_PSYCHOLOGY_LAWS.filter((l) => l.love100Category === label).length,
  })
);

export const LOVE100_CONTEXTS: Love100ContextMeta[] = Object.entries(CONTEXT_DISPATCH_MAP).map(
  ([label, meta]) => ({
    id: label,
    label,
    shortLabel: meta.shortLabel,
    enLabel: meta.enLabel,
    color: meta.color,
    description: meta.description,
    count: LOVE100_PSYCHOLOGY_LAWS.filter((l) => l.love100Context === label).length,
  })
);

export const LOVE100_TOPICS: Love100TopicMeta[] = (love100Pack.chapters || []).map((ch) => {
  const titleZh = ch.chapter.replace(/^\d+\.\s*/, '').trim();
  const matched = LOVE100_PSYCHOLOGY_LAWS.filter((l) => l.love100TopicName === titleZh);
  const catMeta = LOVE100_CATEGORY_PALETTE[ch.category] || LOVE100_CATEGORY_PALETTE['依恋与安全感'];
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

export function getLove100LawsForGame(gameId: GameType): PsychologyLaw[] {
  return LOVE100_PSYCHOLOGY_LAWS.filter(
    (law) =>
      law.relatedGame === gameId ||
      (Array.isArray(law.dispatchedGames) && law.dispatchedGames.includes(gameId))
  );
}

import { CategoryType, CategoryZh, DifficultyLevel, GameType, PsychologyLaw } from '../types';
import sexualPack from './sexualPsychologyPack.json';

interface RawSexualLaw {
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

export interface SexualPillarMeta {
  id: string;
  label: string;
  enLabel: string;
  color: string;
  description: string;
  categories: string[];
  count: number;
}

export interface SexualCategoryMeta {
  id: string;
  label: string;
  pillarId: string;
  color: string;
  description: string;
  count: number;
}

export interface SexualContextMeta {
  id: string;
  label: string;
  shortLabel: string;
  enLabel: string;
  color: string;
  description: string;
  count: number;
}

export interface SexualTopicMeta {
  id: string;
  chapter: string;
  titleZh: string;
  titleEn: string;
  category: string;
  pillarId: string;
  color: string;
  count: number;
}

export const SEXUAL_PSYCHOLOGY_NOTE: string =
  sexualPack.note ||
  '这100条是基于性心理学、性健康、关系心理学及社会心理学概念制作的学习卡，强调非露骨、科学教育、多样性、知情同意、健康与相互尊重。';

const PILLAR_CONFIG: Array<{
  id: string;
  label: string;
  enLabel: string;
  color: string;
  description: string;
  categories: string[];
}> = [
  {
    id: '生理唤起与欲望机制',
    label: '生理唤起与欲望机制',
    enLabel: 'Arousal & Desire Mechanisms',
    color: '#7E22CE',
    description: '性反应周期、双因素兴奋/抑制模型、欲望个体差异、自发与回应性欲望、唤起非一致性',
    categories: ['生理与性反应', '性欲与唤起', '性欲与动机'],
  },
  {
    id: '同意边界与亲密关系',
    label: '同意边界与亲密关系',
    enLabel: 'Consent & Relational Intimacy',
    color: '#BE185D',
    description: '持续自愿的性同意协商、依恋安全感、尊重而不羞辱的亲密沟通与多维性满意度',
    categories: ['同意与边界', '关系与亲密'],
  },
  {
    id: '自我认同与多元尊重',
    label: '自我认同与多元尊重',
    enLabel: 'Identity, Body Image & Diversity',
    color: '#6D28D9',
    description: '身体意象与自信、去羞耻与内化规范反思、性取向与性别认同多样性、幻想与现实区分',
    categories: ['自我认知与情绪', '身份与多样性', '性认知与想象'],
  },
  {
    id: '身心健康与社会文化',
    label: '身心健康与社会文化',
    enLabel: 'Health Literacy & Social Scripts',
    color: '#0F766E',
    description: '慢性压力与身心健康、自我探索、性媒介素养辨析、科学风控与性别社会脚本观察',
    categories: ['身心健康', '性健康与自我认识', '性健康与安全', '社会与文化'],
  },
];

const SEXUAL_CATEGORY_PALETTE: Record<
  string,
  {
    pillarId: string;
    color: string;
    description: string;
    mappedZh: CategoryZh;
    mappedEn: CategoryType;
  }
> = {
  '生理与性反应': {
    pillarId: '生理唤起与欲望机制',
    color: '#7E22CE',
    description: '兴奋/平台/高潮/消退模型及生理唤起与主观意愿的非一致性原理',
    mappedZh: '认知',
    mappedEn: 'cognitive',
  },
  '性欲与唤起': {
    pillarId: '生理唤起与欲望机制',
    color: '#9333EA',
    description: '兴奋系统与抑制系统交互作用下的安全感、压力与环境调节机制',
    mappedZh: '情绪',
    mappedEn: 'emotion',
  },
  '性欲与动机': {
    pillarId: '生理唤起与欲望机制',
    color: '#6B21A8',
    description: '欲望强度频率的天然差异及自发性、回应性双通道欲望模型',
    mappedZh: '行为',
    mappedEn: 'behavior',
  },
  '同意与边界': {
    pillarId: '同意边界与亲密关系',
    color: '#BE185D',
    description: '自愿、清晰、具体且可随时撤回的持续性同意与身体自主原则',
    mappedZh: '决策',
    mappedEn: 'decision',
  },
  '关系与亲密': {
    pillarId: '同意边界与亲密关系',
    color: '#DB2777',
    description: '依恋安全、非羞辱沟通、情感联结以及多维满意度共建机制',
    mappedZh: '情绪',
    mappedEn: 'emotion',
  },
  '自我认知与情绪': {
    pillarId: '自我认同与多元尊重',
    color: '#6D28D9',
    description: '身体意象接纳、破解不实外貌标准与剥离污名化性羞耻感',
    mappedZh: '情绪',
    mappedEn: 'emotion',
  },
  '身份与多样性': {
    pillarId: '自我认同与多元尊重',
    color: '#4F46E5',
    description: '尊重性取向、性别认同、称谓隐私与非病态化多元发展光谱',
    mappedZh: '社会',
    mappedEn: 'social',
  },
  '性认知与想象': {
    pillarId: '自我认同与多元尊重',
    color: '#7C3AED',
    description: '区分内在性幻想、知情同意与现实法律安全边界的元认知能力',
    mappedZh: '认知',
    mappedEn: 'cognitive',
  },
  '身心健康': {
    pillarId: '身心健康与社会文化',
    color: '#0D9488',
    description: '慢性压力、睡眠不足与心理焦虑对欲望及功能的综合调节影响',
    mappedZh: '行为',
    mappedEn: 'behavior',
  },
  '性健康与自我认识': {
    pillarId: '身心健康与社会文化',
    color: '#0F766E',
    description: '以非评判科学视角认识身体偏好、正常化自我探索与失控辨别',
    mappedZh: '认知',
    mappedEn: 'cognitive',
  },
  '性健康与安全': {
    pillarId: '身心健康与社会文化',
    color: '#059669',
    description: '基于可靠医学信息的避孕、感染检测、安全保护与去污名沟通',
    mappedZh: '决策',
    mappedEn: 'decision',
  },
  '社会与文化': {
    pillarId: '身心健康与社会文化',
    color: '#0284C7',
    description: '隐性性脚本、社会学习塑形与辨识色情媒介商业表演虚构期待',
    mappedZh: '社会',
    mappedEn: 'social',
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
  '个人自我认识': {
    shortLabel: '自我认识',
    enLabel: 'Self-Knowledge',
    color: '#7E22CE',
    description: '结合日常情境、压力与身体状态理解自身感受，摆脱单一刻板标尺',
    games: ['sexual-aleatoric-arena', 'micro-habit', 'attribution-shift', 'emotion-detective'],
    relatedGame: 'micro-habit',
  },
  '伴侣关系': {
    shortLabel: '伴侣关系',
    enLabel: 'Partner Intimacy',
    color: '#BE185D',
    description: '以双方自愿与坦诚沟通为前提，询问感受与边界而不将其视作义务',
    games: ['sexual-aleatoric-arena', 'love-aleatoric-arena', 'emotion-detective', 'peak-end'],
    relatedGame: 'love-aleatoric-arena',
  },
  '青春期与成年教育': {
    shortLabel: '科普教育',
    enLabel: 'Lifespan Education',
    color: '#0284C7',
    description: '采用适龄、科学、非羞辱语言，强调身体自主、隐私保护与持续同意',
    games: ['sexual-aleatoric-arena', 'psych-experiment', 'falsification-challenge', 'bystander-breaker'],
    relatedGame: 'psych-experiment',
  },
  '社会文化观察': {
    shortLabel: '文化观察',
    enLabel: 'Cultural Lens',
    color: '#6D28D9',
    description: '敏锐识别媒体、家庭与同伴如何塑造期待，同时尊重文化与个体差异',
    games: ['sexual-aleatoric-arena', 'majority-answer', 'first-impression', 'mind-detective'],
    relatedGame: 'majority-answer',
  },
  '心理咨询与健康支持': {
    shortLabel: '咨询支持',
    enLabel: 'Health & Support',
    color: '#0F766E',
    description: '将概念作为专业支持探索线索而非诊断，持续困扰应由合格人员评估',
    games: ['sexual-aleatoric-arena', 'attribution-shift', 'emotion-detective', 'psych-experiment'],
    relatedGame: 'attribution-shift',
  },
};

const CONTEXT_SPLIT_MARKERS = [
  '在个人层面，',
  '在伴侣互动中，',
  '用于教育时，',
  '观察社会规范时，',
  '在专业支持场景中，',
];

function mapDifficulty(diffZh: string): DifficultyLevel {
  if (diffZh === '初级') return 'Easy';
  if (diffZh === '中级') return 'Medium';
  return 'Hard';
}

function splitSexualSummary(summary: string): {
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

const rawLaws = sexualPack.laws as RawSexualLaw[];

export const SEXUAL_PSYCHOLOGY_LAWS: PsychologyLaw[] = rawLaws.map((item) => {
  const uniqueCodeId = item.id.toUpperCase();
  const uniqueId = item.id.toLowerCase().replace(/^sex/, 'sex-');
  const topicName = item.title_zh.split('：')[0]?.trim() || item.title_zh;
  const contextLabel = (item.application_context || '个人自我认识').trim();

  const catMeta =
    SEXUAL_CATEGORY_PALETTE[item.category] || SEXUAL_CATEGORY_PALETTE['生理与性反应'];
  const ctxMeta = CONTEXT_DISPATCH_MAP[contextLabel] || CONTEXT_DISPATCH_MAP['个人自我认识'];

  const { coreConcept, appliedAngle } = splitSexualSummary(item.summary);
  const enBase = item.title_en.split(':')[0]?.trim() || 'Sexual Psychology Concept';
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
    detailedExplanation: `【${catMeta.pillarId} / ${item.category} · ${topicName}（${contextLabel}）】科学机制核心：${coreConcept} 在「${contextLabel}」维度的实践应用：${appliedAngle}`,
    whyItHappens: coreConcept,
    realLifeExample: `【${contextLabel}应用要点】${appliedAngle}`,
    workplaceCase: `在职场健康政策与公共科普环境中，尊重隐私边界、多元身份与知情同意规范，杜绝刻板标签与性羞辱。`,
    relationshipCase:
      contextLabel === '伴侣关系'
        ? appliedAngle
        : `${topicName}提示伴侣以双方自愿、安全感和无羞辱沟通为核心，尊重彼此反应节奏与边界。`,
    businessCase: `在心理科普、教育媒体与健康产品设计中，坚持循证、适龄、去污名化和知情自主原则。`,
    recognitionSignals: [
      `审视当前困惑是否源自把单一社会/媒介标准误当作普遍自然定律`,
      `区分主观意愿、身体反应与持续知情同意之间的真实边界`,
      `觉察压力、关系氛围或羞耻观念是否正在干扰坦诚沟通与舒适感`,
    ],
    antiManipulation: [
      `场景践行要点：${appliedAngle}`,
      `科学敬畏与支持边界：${item.learning_note}`,
      '核心原则：任何亲密互动都必须建立在自愿、清晰、具体且可随时撤回的同意之上',
    ],
    healthyBoundary: `${item.learning_note} ${appliedAngle}`,
    keyTakeaway: appliedAngle,
    question: `在「${contextLabel}」视角下理解「${topicName}（${item.category}）」时，哪项认识与实践最科学尊重？`,
    answers: [
      appliedAngle,
      '只要伴侣曾表达过好感或发生生理反应，就自动代表长期且不可撤回的同意',
      '所有人在欲望强度、反应周期与偏好上都必须符合单一标准，否则就是功能障碍或道德缺陷',
      '色情商业作品与刻板社会脚本可以直接作为衡量现实亲密关系的科学准则',
    ],
    correctAnswer: 0,
    difficulty,
    mastery: 0,
    relatedGame: ctxMeta.relatedGame,
    dispatchedGames: ctxMeta.games,
    icon: 'heart-handshake',
    limitations: `${item.learning_note} ${SEXUAL_PSYCHOLOGY_NOTE}`,
    isSexualPsychology: true,
    sexualPillar: catMeta.pillarId,
    sexualCategory: item.category,
    sexualContext: contextLabel,
    sexualTopicName: topicName,
    sexualCoreConcept: coreConcept,
    sexualAppliedAngle: appliedAngle,
    sexualLearningNote: item.learning_note,
    experimentSetup: {
      scenario: `在「${contextLabel}」情境中面对与「${topicName}」相关的认知与沟通议题时：`,
      optionA: {
        label: '沿用单一模板或默许推论，忽视个体差异与持续同意',
        biasDescription: '易将文化脚本、生理反应或羞耻感误判为个人义务或缺陷，损害信任与自主感',
      },
      optionB: {
        label: '结合情境与科学认知，以自愿沟通、尊重多样性与安全边界为准绳',
        rationalDescription: `遵循「${topicName}」核心启示：${appliedAngle}`,
      },
      globalChoicePercentageA: 64,
      insight: `性心理学与健康科普研究表明：接纳个体多样性、区分生理反应与主观同意、开展无羞辱沟通，能显著提升心理安全感与亲密关系质量。`,
    },
  };
});

export const SEXUAL_PILLARS: SexualPillarMeta[] = PILLAR_CONFIG.map((pillar) => ({
  ...pillar,
  count: SEXUAL_PSYCHOLOGY_LAWS.filter((l) => l.sexualPillar === pillar.id).length,
}));

export const SEXUAL_CATEGORIES: SexualCategoryMeta[] = Object.entries(SEXUAL_CATEGORY_PALETTE).map(
  ([label, meta]) => ({
    id: label,
    label,
    pillarId: meta.pillarId,
    color: meta.color,
    description: meta.description,
    count: SEXUAL_PSYCHOLOGY_LAWS.filter((l) => l.sexualCategory === label).length,
  })
);

export const SEXUAL_CONTEXTS: SexualContextMeta[] = Object.entries(CONTEXT_DISPATCH_MAP).map(
  ([label, meta]) => ({
    id: label,
    label,
    shortLabel: meta.shortLabel,
    enLabel: meta.enLabel,
    color: meta.color,
    description: meta.description,
    count: SEXUAL_PSYCHOLOGY_LAWS.filter((l) => l.sexualContext === label).length,
  })
);

export const SEXUAL_TOPICS: SexualTopicMeta[] = (sexualPack.chapters || []).map((ch) => {
  const titleZh = ch.chapter.replace(/^\d+\.\s*/, '').trim();
  const matched = SEXUAL_PSYCHOLOGY_LAWS.filter((l) => l.sexualTopicName === titleZh);
  const catMeta = SEXUAL_CATEGORY_PALETTE[ch.category] || SEXUAL_CATEGORY_PALETTE['生理与性反应'];
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

export function getSexualLawsForGame(gameId: GameType): PsychologyLaw[] {
  return SEXUAL_PSYCHOLOGY_LAWS.filter(
    (law) =>
      law.relatedGame === gameId ||
      (Array.isArray(law.dispatchedGames) && law.dispatchedGames.includes(gameId))
  );
}

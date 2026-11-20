import { CategoryType, CategoryZh, DifficultyLevel, GameType, PsychologyLaw } from '../types';
import reversePack from './reversePsychologyPack.json';

interface RawReverseChapter {
  chapter: string;
  concept: string;
  concept_en: string;
}

interface RawReverseLaw {
  id: string;
  title_zh: string;
  title_en: string;
  category: string;
  chapter: string;
  difficulty: string;
  xp: number;
  summary: string;
}

export interface ReverseCategoryMeta {
  id: string;
  label: string;
  color: string;
  description: string;
  count: number;
}

export interface ReverseScenarioMeta {
  id: string;
  label: string;
  shortLabel: string;
  color: string;
  description: string;
  count: number;
}

export interface ReverseChapterMeta {
  chapter: string;
  concept: string;
  conceptEn: string;
  count: number;
}

export const REVERSE_PSYCHOLOGY_NOTE: string =
  reversePack.note ||
  '本知识包将日常所称的逆向心理学与心理抗拒、自由威胁、说服沟通、动机及认知偏差等研究概念联系起来。并非100条学界公认的独立定律；逆向心理不是稳定、可保证奏效的操控技术。请以诚实沟通、尊重自主权和伦理边界为原则。';

const REVERSE_CATEGORY_PALETTE: Record<string, { color: string; description: string; mappedZh: CategoryZh; mappedEn: CategoryType }> = {
  '核心机制': {
    color: '#4338CA',
    description: '心理抗拒、自由威胁、禁果与逆反效果等核心触发机制',
    mappedZh: '认知',
    mappedEn: 'cognitive',
  },
  '说服与信息': {
    color: '#0891B2',
    description: '劝说强度、双面信息平衡与理性信息传递策略',
    mappedZh: '行为',
    mappedEn: 'behavior',
  },
  '沟通方式': {
    color: '#0D9488',
    description: '命令式语言、建议式语言与自主支持型沟通方式',
    mappedZh: '行为',
    mappedEn: 'behavior',
  },
  '框架效应': {
    color: '#6366F1',
    description: '反向框架、选项表达结构与认知视角的转化规律',
    mappedZh: '认知',
    mappedEn: 'cognitive',
  },
  '决策偏差': {
    color: '#059669',
    description: '损失规避等决策心理与非对称风险权重偏误',
    mappedZh: '决策',
    mappedEn: 'decision',
  },
  '说服与营销': {
    color: '#10B981',
    description: '稀缺性感知、心理抗拒与真实供需沟通边界',
    mappedZh: '决策',
    mappedEn: 'decision',
  },
  '动机与关系': {
    color: '#E11D48',
    description: '心理所有权、参与感共建与自主关系联结',
    mappedZh: '情绪',
    mappedEn: 'emotion',
  },
  '认知与动机': {
    color: '#7C3AED',
    description: '努力正当化、认知失调与内在动机合理化机制',
    mappedZh: '认知',
    mappedEn: 'cognitive',
  },
  '应用边界': {
    color: '#D97706',
    description: '反向挑战的失灵条件、适得其反风险与适用限度',
    mappedZh: '社会',
    mappedEn: 'social',
  },
  '关系与团队': {
    color: '#BE123C',
    description: '心理安全感、自主表达空间与组织协作氛围',
    mappedZh: '情绪',
    mappedEn: 'emotion',
  },
  '助人沟通': {
    color: '#0284C7',
    description: '动机访谈中的自主支持、非对抗式引导与改变意愿',
    mappedZh: '行为',
    mappedEn: 'behavior',
  },
  '伦理与边界': {
    color: '#B45309',
    description: '诚实沟通、尊重拒绝与反操控的科学伦理底线',
    mappedZh: '社会',
    mappedEn: 'social',
  },
};

const SCENARIO_DISPATCH_MAP: Record<string, { color: string; shortLabel: string; description: string; games: GameType[]; relatedGame: GameType }> = {
  '亲子沟通': {
    color: '#D97706',
    shortLabel: '亲子教育',
    description: '兼顾规则安全底线与年龄适宜自主选项的家庭对话策略',
    games: ['reverse-aleatoric-arena', 'micro-habit', 'peak-end', 'first-impression'],
    relatedGame: 'micro-habit',
  },
  '伴侣与亲密关系': {
    color: '#E11D48',
    shortLabel: '伴侣亲密',
    description: '告别试探与反话消耗，以坦诚需求与尊重边界建立信任',
    games: ['reverse-aleatoric-arena', 'emotion-detective', 'love-aleatoric-arena'],
    relatedGame: 'emotion-detective',
  },
  '销售与客户沟通': {
    color: '#059669',
    shortLabel: '销售商业',
    description: '摒弃虚假稀缺与激将逼单，以透明信息和真实决策空间成交',
    games: ['reverse-aleatoric-arena', 'anchoring-lab', 'zero-price-trap', 'psych-experiment'],
    relatedGame: 'anchoring-lab',
  },
  '团队管理与领导': {
    color: '#4338CA',
    shortLabel: '团队管理',
    description: '用目标阐释、共同方案与心理安全取代控制压迫或反向激将',
    games: ['reverse-aleatoric-arena', 'majority-answer', 'bystander-breaker', 'attribution-shift'],
    relatedGame: 'majority-answer',
  },
  '教育与自我成长': {
    color: '#0891B2',
    shortLabel: '教育成长',
    description: '借开放式提问与自主挑战点燃学习内驱力与元认知自觉',
    games: ['reverse-aleatoric-arena', 'falsification-challenge', 'mind-trap', 'mind-detective', 'brain-rush', 'memory-lab'],
    relatedGame: 'falsification-challenge',
  },
};

function mapDifficulty(diffZh: string): DifficultyLevel {
  if (diffZh === '基础') return 'Easy';
  if (diffZh === '专业') return 'Hard';
  return 'Medium';
}

function splitSummary(summary: string, scenarioLabel: string): { principle: string; application: string } {
  const marker = `在${scenarioLabel}中的应用：`;
  const idx = summary.indexOf(marker);
  if (idx !== -1) {
    return {
      principle: summary.slice(0, idx).trim(),
      application: summary.slice(idx + marker.length).trim(),
    };
  }
  const regexMatch = summary.match(/在([^：]+?)中的应用：/);
  if (regexMatch && regexMatch.index !== undefined) {
    return {
      principle: summary.slice(0, regexMatch.index).trim(),
      application: summary.slice(regexMatch.index + regexMatch[0].length).trim(),
    };
  }
  return {
    principle: summary.trim(),
    application: summary.trim(),
  };
}

function deriveRedlineAndPrescription(application: string): { prescription: string; redline: string } {
  const parts = application.split(/[；;。]/).map((s) => s.trim()).filter(Boolean);
  const redline =
    parts.find((p) => p.includes('不要') || p.includes('避免') || p.includes('切忌')) ||
    '避免使用羞辱、欺骗性稀缺或故意剥夺自主选择权来强迫服从。';
  const prescription =
    parts.filter((p) => !p.includes('不要')).join('；') || application;
  return { prescription, redline };
}

const rawLaws = reversePack.laws as RawReverseLaw[];
const rawChapters = reversePack.chapters as RawReverseChapter[];

export const REVERSE_PSYCHOLOGY_LAWS: PsychologyLaw[] = rawLaws.map((item) => {
  const [conceptName, scenarioFromTitle] = item.title_zh.split('：');
  const scenarioLabel = (scenarioFromTitle || '教育与自我成长').trim();
  const conceptEn = (item.title_en.split(':')[0] || item.title_en).trim();

  const catMeta = REVERSE_CATEGORY_PALETTE[item.category] || REVERSE_CATEGORY_PALETTE['核心机制'];
  const scenMeta = SCENARIO_DISPATCH_MAP[scenarioLabel] || SCENARIO_DISPATCH_MAP['教育与自我成长'];

  const { principle, application } = splitSummary(item.summary, scenarioLabel);
  const { prescription, redline } = deriveRedlineAndPrescription(application);
  const difficulty = mapDifficulty(item.difficulty);

  return {
    id: item.id.toLowerCase(),
    codeId: item.id,
    chapter: item.chapter,
    xpReward: item.xp || 10,
    evidenceLevel: 'B+',
    nameZh: item.title_zh,
    nameEn: `${conceptEn} — ${scenMeta.shortLabel}`,
    category: catMeta.mappedEn,
    categoryZh: catMeta.mappedZh,
    subTag: `${item.category} · ${scenarioLabel}`,
    shortExplanation: item.summary,
    detailedExplanation: `【${item.chapter} · ${conceptName}】属于「${item.category}」专题。底层心理机制：${principle} 在「${scenarioLabel}」实战应用中：${application}`,
    whyItHappens: principle,
    realLifeExample: `【${scenarioLabel}实战】${application}`,
    relationshipCase:
      scenarioLabel === '伴侣与亲密关系' || scenarioLabel === '亲子沟通'
        ? application
        : `${conceptName}在亲密沟通中提醒我们：避免情绪化反话试探，清晰表达需求并尊重对方自主空间。`,
    workplaceCase:
      scenarioLabel === '团队管理与领导'
        ? application
        : `${conceptName}在团队协作中要求管理者阐明目标与边界，而非采用命令压迫或反向激将。`,
    businessCase:
      scenarioLabel === '销售与客户沟通'
        ? application
        : `${conceptName}在客户沟通中强调透明信息与真实对比选项，摒弃伪造紧迫感与胁迫话术。`,
    recognitionSignals: [
      `对话双方在「${scenarioLabel}」场景下陷入控制感与反抗感拉锯`,
      `原本关注的任务目标被“我是否有权自己决定”的自尊博弈所取代`,
      `对方出现拖延、沉默抵触或刻意朝指令相反方向行动的自由恢复倾向`,
    ],
    antiManipulation: [
      `正向实操：${prescription}`,
      `伦理底线：${redline}`,
      '科学提醒：逆向心理并非稳定奏效的操控术，诚实沟通与自主支持才具有长期复利',
    ],
    healthyBoundary: `${redline}；坚持诚实表达需求并尊重对方的真实选择权。`,
    keyTakeaway: `${prescription}（边界警示：${redline}）`,
    question: `在「${scenarioLabel}」情境中运用「${conceptName}（${item.category}）」时，哪项实践最符合科学心理学与沟通伦理？`,
    answers: [
      prescription,
      `刻意采用高压羞辱、制造虚假紧迫感或反话激将来强迫对方屈服`,
      `把逆向心理视作百试百灵的操控公式，完全无需告知真实意图与规则边界`,
      `彻底放弃任何规则底线或真实信息说明，任由局势在情绪试探中升级对抗`,
    ],
    correctAnswer: 0,
    difficulty,
    mastery: 0,
    relatedGame: scenMeta.relatedGame,
    dispatchedGames: scenMeta.games,
    icon: 'shuffle',
    isReversePsychology: true,
    reverseCategory: item.category,
    reverseScenario: scenarioLabel,
    reversePrinciple: principle,
    reverseApplication: application,
    experimentSetup: {
      scenario: `在「${scenarioLabel}」互动观察中，当运用不同方式应对与「${conceptName}」相关的抵触情绪时：`,
      optionA: {
        label: '控制型 / 反向试探组：用强迫命令或故意反话施压',
        biasDescription: `易激发心理抗拒与自由恢复动机，短期看似逼迫表态却破坏长期信任`,
      },
      optionB: {
        label: '自主支持与诚实沟通组：阐明原因并提供真实有效选项',
        rationalDescription: `贯彻「${conceptName}」科学转化准则：${prescription}`,
      },
      globalChoicePercentageA: 64,
      insight: `沟通研究表明：尊重选择自主权与清晰解释理由的沟通方式，比反向激将或高压控制更能降低防御性抗拒并提升长期配合度。`,
    },
  };
});

export const REVERSE_CATEGORIES: ReverseCategoryMeta[] = Object.entries(REVERSE_CATEGORY_PALETTE).map(
  ([label, meta]) => ({
    id: label,
    label,
    color: meta.color,
    description: meta.description,
    count: REVERSE_PSYCHOLOGY_LAWS.filter((l) => l.reverseCategory === label).length,
  })
);

export const REVERSE_SCENARIOS: ReverseScenarioMeta[] = Object.entries(SCENARIO_DISPATCH_MAP).map(
  ([label, meta]) => ({
    id: label,
    label,
    shortLabel: meta.shortLabel,
    color: meta.color,
    description: meta.description,
    count: REVERSE_PSYCHOLOGY_LAWS.filter((l) => l.reverseScenario === label).length,
  })
);

export const REVERSE_CHAPTERS: ReverseChapterMeta[] = rawChapters.map((c) => ({
  chapter: c.chapter,
  concept: c.concept,
  conceptEn: c.concept_en,
  count: REVERSE_PSYCHOLOGY_LAWS.filter((l) => l.chapter === c.chapter).length,
}));

export function getReverseLawsForGame(gameId: GameType): PsychologyLaw[] {
  return REVERSE_PSYCHOLOGY_LAWS.filter(
    (law) =>
      law.relatedGame === gameId ||
      (Array.isArray(law.dispatchedGames) && law.dispatchedGames.includes(gameId))
  );
}

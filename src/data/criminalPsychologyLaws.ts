import { CategoryType, CategoryZh, DifficultyLevel, GameType, PsychologyLaw } from '../types';
import criminalPack from './criminalPsychologyPack.json';

interface RawCriminalLaw {
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

export interface CriminalCategoryMeta {
  id: string;
  label: string;
  color: string;
  description: string;
  count: number;
}

export interface CriminalContextMeta {
  id: string;
  label: string;
  shortLabel: string;
  enLabel: string;
  color: string;
  description: string;
  count: number;
}

export interface CriminalTheoryTopicMeta {
  id: string;
  titleZh: string;
  titleEn: string;
  category: string;
  color: string;
  count: number;
}

export const CRIMINAL_PSYCHOLOGY_NOTE: string =
  criminalPack.note ||
  '本资料为学习型知识卡合集。内容涵盖犯罪心理学及相关学科的理论和研究概念，并非100条学界公认的独立定律；不能用于单独诊断、预测、画像定罪或替代法律程序。';

const CRIMINAL_CATEGORY_PALETTE: Record<
  string,
  { color: string; description: string; mappedZh: CategoryZh; mappedEn: CategoryType }
> = {
  '基础理论': {
    color: '#9F1239',
    description: '多因素犯罪模型、社会学习、差别交往、社会控制、紧张、理性选择、日常活动与生命历程框架',
    mappedZh: '社会',
    mappedEn: 'social',
  },
  '暴力与攻击': {
    color: '#B91C1C',
    description: '挫折—攻击假说、敌意归因偏差、情绪失调、道德脱离与去人性化攻击升级机制',
    mappedZh: '情绪',
    mappedEn: 'emotion',
  },
  '人格与个体差异': {
    color: '#7C2D12',
    description: '精神病态特质研究维度、认知扭曲与合理化、物质使用对抑制控制的风险边界',
    mappedZh: '认知',
    mappedEn: 'cognitive',
  },
  '群体犯罪': {
    color: '#4338CA',
    description: '从众与群体压力、旁观者效应与责任分散下的集体行为动力学',
    mappedZh: '行为',
    mappedEn: 'behavior',
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
  '理论核心': {
    shortLabel: '理论机制',
    enLabel: 'Core Theory',
    color: '#9F1239',
    description: '厘清犯罪心理学核心研究模型、影响因子与非决定论科学认识边界',
    games: ['criminal-aleatoric-arena', 'psych-experiment', 'falsification-challenge', 'mind-detective'],
    relatedGame: 'psych-experiment',
  },
  '家庭与成长': {
    shortLabel: '家庭成长',
    enLabel: 'Family & Growth',
    color: '#B45309',
    description: '聚焦关系质量、照护稳定性、冲突处理与早期支持资源，拒绝贫困或结构污名化',
    games: ['criminal-aleatoric-arena', 'attribution-shift', 'micro-habit', 'peak-end'],
    relatedGame: 'attribution-shift',
  },
  '亲密关系': {
    shortLabel: '亲密关系',
    enLabel: 'Intimate Safety',
    color: '#BE123C',
    description: '区分偶发争执与持续控制/威胁模式，优先评估人身安全、个人边界与专业支持',
    games: ['criminal-aleatoric-arena', 'emotion-detective', 'love-aleatoric-arena'],
    relatedGame: 'emotion-detective',
  },
  '学校与青少年': {
    shortLabel: '学校青少年',
    enLabel: 'School & Youth',
    color: '#0369A1',
    description: '兼顾发展阶段、同伴影响与校园归属感，杜绝过早给青少年贴上固定标签',
    games: ['criminal-aleatoric-arena', 'majority-answer', 'bystander-breaker', 'first-impression'],
    relatedGame: 'majority-answer',
  },
  '职场与组织': {
    shortLabel: '职场组织',
    enLabel: 'Workplace & Org',
    color: '#4338CA',
    description: '审查权力结构、监督制度、组织规范与举报保护，以事实调查替代主观性格臆测',
    games: ['criminal-aleatoric-arena', 'mind-detective', 'bystander-breaker', 'falsification-challenge'],
    relatedGame: 'mind-detective',
  },
};

const THEORY_EN_NAMES: Record<string, string> = {
  '多因素犯罪模型': 'Multifactor Crime Model',
  '社会学习理论': 'Social Learning Theory',
  '差别交往理论': 'Differential Association Theory',
  '社会控制理论': 'Social Control Theory',
  '紧张理论': 'General Strain Theory',
  '自我控制理论': 'Self-Control Theory',
  '理性选择理论': 'Rational Choice Theory',
  '日常活动理论': 'Routine Activity Theory',
  '标签理论': 'Labeling Theory',
  '生命历程观点': 'Life-Course Perspective',
  '挫折—攻击假说': 'Frustration–Aggression Hypothesis',
  '敌意归因偏差': 'Hostile Attribution Bias',
  '情绪失调与攻击': 'Emotion Dysregulation & Aggression',
  '道德脱离机制': 'Moral Disengagement Mechanism',
  '去人性化': 'Dehumanization',
  '精神病态特质研究': 'Psychopathic Traits Research',
  '认知扭曲与合理化': 'Cognitive Distortions & Rationalization',
  '物质使用与犯罪风险': 'Substance Use & Risk Mechanisms',
  '从众与群体压力': 'Conformity & Group Pressure',
  '责任分散效应': 'Diffusion of Responsibility',
};

function mapDifficulty(diffZh: string, idx: number): DifficultyLevel {
  if (diffZh === '基础') return 'Easy';
  if (diffZh === '进阶') return 'Medium';
  // 80 applied entries spread across Medium and Hard so arena difficulty tiers filter richly
  return idx % 2 === 0 ? 'Medium' : 'Hard';
}

function splitCriminalSummary(summary: string): {
  coreTheory: string;
  appliedAngle: string;
} {
  const coreMarker = '核心理论：';
  const coreIdx = summary.indexOf(coreMarker);
  if (coreIdx !== -1) {
    const before = summary.slice(0, coreIdx).trim();
    const core = summary.slice(coreIdx + coreMarker.length).trim();
    const cleanApplied = before.replace(/^应用视角（[^）]+）：\s*/, '').trim();
    return {
      coreTheory: core,
      appliedAngle: cleanApplied || before,
    };
  }
  return {
    coreTheory: summary.trim(),
    appliedAngle: summary.trim(),
  };
}

function extractBoundaryRule(appliedAngle: string): string {
  const sentences = appliedAngle
    .split(/[；。]/)
    .map((s) => s.trim())
    .filter(Boolean);
  const caution =
    sentences.find(
      (s) =>
        s.includes('不能') ||
        s.includes('避免') ||
        s.includes('优先') ||
        s.includes('区分') ||
        s.includes('不可')
    ) || sentences[sentences.length - 1];
  return caution || '用于理解风险机制和预防，不可单独作为诊断、定罪或预测依据。';
}

const rawLaws = criminalPack.laws as RawCriminalLaw[];

export const CRIMINAL_PSYCHOLOGY_LAWS: PsychologyLaw[] = rawLaws.map((item, idx) => {
  // Normalize sequential deterministic IDs (resolves duplicate CRIM011-014 codes in raw JSON)
  const seqNum = String(idx + 1).padStart(3, '0');
  const uniqueCodeId = `CRIM${seqNum}`;
  const uniqueId = `crim-${seqNum}`;

  const theoryName = item.title_zh.split('：')[0]?.trim() || item.title_zh;
  const contextLabel = (item.application_context || '理论核心').trim();

  const catMeta = CRIMINAL_CATEGORY_PALETTE[item.category] || CRIMINAL_CATEGORY_PALETTE['基础理论'];
  const ctxMeta = CONTEXT_DISPATCH_MAP[contextLabel] || CONTEXT_DISPATCH_MAP['理论核心'];
  const theoryEn = THEORY_EN_NAMES[theoryName] || 'Criminal Psychology Concept';

  const { coreTheory, appliedAngle } = splitCriminalSummary(item.summary);
  const boundaryRule = extractBoundaryRule(appliedAngle);
  const difficulty = mapDifficulty(item.difficulty, idx);

  const isCoreCard = contextLabel === '理论核心';
  const practicalPrescription = isCoreCard
    ? `${coreTheory}（研究原则：${item.learning_note}）`
    : `${appliedAngle}`;

  return {
    id: uniqueId,
    codeId: uniqueCodeId,
    chapter: `${item.chapter} · ${contextLabel}`,
    xpReward: item.xp || 15,
    evidenceLevel: 'A-',
    nameZh: item.title_zh,
    nameEn: `${theoryEn} — ${ctxMeta.enLabel}`,
    category: catMeta.mappedEn,
    categoryZh: catMeta.mappedZh,
    subTag: `${item.category} · ${contextLabel}`,
    shortExplanation: item.summary,
    detailedExplanation: `【${item.category} · ${theoryName}（${contextLabel}）】底层研究机制：${coreTheory}${
      isCoreCard ? '' : ` 在「${contextLabel}」场景下的风险识别与预防视角：${appliedAngle}`
    }`,
    whyItHappens: coreTheory,
    realLifeExample: isCoreCard
      ? `【概念核心 · ${theoryName}】${coreTheory}`
      : `【${contextLabel}观察与预防】${appliedAngle}`,
    workplaceCase:
      contextLabel === '职场与组织'
        ? appliedAngle
        : `${theoryName}在职场与组织中提醒管理者检查权力结构、监督制度、组织规范与举报保护，不以主观人格猜测代替事实调查。`,
    relationshipCase:
      contextLabel === '亲密关系' || contextLabel === '家庭与成长'
        ? appliedAngle
        : `${theoryName}在人际与亲密关系中强调区分偶发矛盾与持续伤害控制模式，优先保障安全感、边界与专业求助渠道。`,
    businessCase: `${theoryName}用于评估制度漏洞、激励错配与环境机会结构，避免将制度管理问题简化为个人标签。`,
    recognitionSignals: [
      `评估场景中是否存在「${theoryName}」所描述的环境诱因、压力源或机会结构变化`,
      `区分单一表面特征（如家庭结构、物质状态或偶发情绪）与真实持续的行为风险模式`,
      `识别是否存在通过合理化、外归因或贴标签削弱预防支持的行为倾向`,
    ],
    antiManipulation: [
      `风险预防焦点：${appliedAngle}`,
      `科学使用边界：${item.learning_note}`,
      '核心原则：研究概念仅用于理解机制、早期支持与环境改善，不能替代法律程序与客观事实核查',
    ],
    healthyBoundary: `${item.learning_note} ${boundaryRule}`,
    keyTakeaway: practicalPrescription,
    question: isCoreCard
      ? `关于犯罪心理学研究概念「${theoryName}（${item.category}）」，以下哪项科学理解与预防原则最准确？`
      : `在「${contextLabel}」情境下应用「${theoryName}（${item.category}）」进行观察与预防时，哪项做法最科学合规？`,
    answers: [
      appliedAngle,
      `仅凭该概念即可直接对某人进行定性画像或确定性犯罪预测，无需事实调查`,
      `把家庭经济条件、年龄标签或偶发一次冲动直接等同于必然违法的铁证`,
      `用主观人格猜测替代组织监督制度建设、安全边界核查与专业支持资源`,
    ],
    correctAnswer: 0,
    difficulty,
    mastery: 0,
    relatedGame: ctxMeta.relatedGame,
    dispatchedGames: ctxMeta.games,
    icon: 'shield-alert',
    limitations: `${item.learning_note} ${CRIMINAL_PSYCHOLOGY_NOTE}`,
    isCriminalPsychology: true,
    criminalCategory: item.category,
    criminalContext: contextLabel,
    criminalTheoryName: theoryName,
    criminalCoreTheory: coreTheory,
    criminalAppliedAngle: appliedAngle,
    criminalLearningNote: item.learning_note,
    experimentSetup: {
      scenario: `在「${contextLabel}」安全与风险研判分析中，面对与「${theoryName}」相关的行为线索：`,
      optionA: {
        label: '标签化与单一因果推断：凭单一点断定个人犯罪倾向',
        biasDescription: '违背多因素研究共识，容易引发污名化误判并掩盖真正的环境与制度支持缺口',
      },
      optionB: {
        label: '系统预防与实证核查：分析机制、支持资源与边界事实',
        rationalDescription: `遵循「${theoryName}」科学应用原则：${appliedAngle}`,
      },
      globalChoicePercentageA: 61,
      insight: `犯罪心理学实证研究表明：区分相关性与因果机制、关注保护因素与环境预防，远比贴标签或性格猜测更能有效降低实际风险。`,
    },
  };
});

export const CRIMINAL_CATEGORIES: CriminalCategoryMeta[] = Object.entries(
  CRIMINAL_CATEGORY_PALETTE
).map(([label, meta]) => ({
  id: label,
  label,
  color: meta.color,
  description: meta.description,
  count: CRIMINAL_PSYCHOLOGY_LAWS.filter((l) => l.criminalCategory === label).length,
}));

export const CRIMINAL_CONTEXTS: CriminalContextMeta[] = Object.entries(CONTEXT_DISPATCH_MAP).map(
  ([label, meta]) => ({
    id: label,
    label,
    shortLabel: meta.shortLabel,
    enLabel: meta.enLabel,
    color: meta.color,
    description: meta.description,
    count: CRIMINAL_PSYCHOLOGY_LAWS.filter((l) => l.criminalContext === label).length,
  })
);

export const CRIMINAL_THEORY_TOPICS: CriminalTheoryTopicMeta[] = Object.entries(
  THEORY_EN_NAMES
).map(([titleZh, titleEn]) => {
  const matched = CRIMINAL_PSYCHOLOGY_LAWS.filter((l) => l.criminalTheoryName === titleZh);
  const category = matched[0]?.criminalCategory || '基础理论';
  const color = CRIMINAL_CATEGORY_PALETTE[category]?.color || '#9F1239';
  return {
    id: titleZh,
    titleZh,
    titleEn,
    category,
    color,
    count: matched.length,
  };
});

export function getCriminalLawsForGame(gameId: GameType): PsychologyLaw[] {
  return CRIMINAL_PSYCHOLOGY_LAWS.filter(
    (law) =>
      law.relatedGame === gameId ||
      (Array.isArray(law.dispatchedGames) && law.dispatchedGames.includes(gameId))
  );
}

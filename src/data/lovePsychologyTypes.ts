import { CategoryType, CategoryZh, DifficultyLevel, LoveDomainId } from '../types';

export interface LoveDomainMeta {
  id: LoveDomainId;
  titleZh: string;
  shortTitle: string;
  enTitle: string;
  description: string;
  color: string;
  badgeClass: string;
  category: CategoryType;
  categoryZh: CategoryZh;
  rawTags: string[];
}

export const LOVE_DOMAINS: LoveDomainMeta[] = [
  {
    id: 'attachment-attraction',
    titleZh: '吸引机制与依恋联结',
    shortTitle: '吸引与依恋',
    enTitle: 'Attraction & Attachment',
    description: '剖析好感产生、安全基地、亲密暴露与依恋风格如何塑造早中期的情感吸引。',
    color: '#EC4899',
    badgeClass: 'bg-pink-50 text-pink-700 border-pink-200',
    category: 'emotion',
    categoryZh: '情绪',
    rawTags: ['依恋', '吸引', '亲密'],
  },
  {
    id: 'communication-resonance',
    titleZh: '沟通表达与共情共振',
    shortTitle: '沟通与共情',
    enTitle: 'Communication & Resonance',
    description: '探索非暴力倾听、积极回应、交互循环与日常表达对关系温度的持续塑造。',
    color: '#8B5CF6',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    category: 'social',
    categoryZh: '社会',
    rawTags: ['沟通', '积极关系', '互动'],
  },
  {
    id: 'cognition-bias',
    titleZh: '恋爱认知偏误与迷思',
    shortTitle: '认知与迷思',
    enTitle: 'Cognition, Memory & Myths',
    description: '识别热恋投射、读心幻想、记忆重构与归因错觉，破除不切实际的浪漫迷思。',
    color: '#4F46E5',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    category: 'cognitive',
    categoryZh: '认知',
    rawTags: ['认知', '记忆'],
  },
  {
    id: 'emotion-repair',
    titleZh: '情绪调节与冲突修复',
    shortTitle: '情绪与修复',
    enTitle: 'Emotion, Conflict & Repair',
    description: '拆解情绪感染、需求-退缩死结、有效道歉与科学修复关系的黄金窗口。',
    color: '#E11D48',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    category: 'emotion',
    categoryZh: '情绪',
    rawTags: ['情绪', '冲突', '修复'],
  },
  {
    id: 'boundary-safety',
    titleZh: '个人边界与关系安全',
    shortTitle: '边界与安全',
    enTitle: 'Boundaries, Trust & Safety',
    description: '划定健康心理边界，预警控制操纵与信任透支，守护身心自主与尊严安全。',
    color: '#0D9488',
    badgeClass: 'bg-teal-50 text-teal-700 border-teal-200',
    category: 'decision',
    categoryZh: '决策',
    rawTags: ['边界', '安全', '信任'],
  },
  {
    id: 'mate-dynamics',
    titleZh: '择偶匹配与关系动力',
    shortTitle: '择偶与动力',
    enTitle: 'Mate Selection & Dynamics',
    description: '评估核心价值观契合度、原生家庭代际传递、社会期待与伴侣动态博弈。',
    color: '#059669',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    category: 'social',
    categoryZh: '社会',
    rawTags: ['关系', '择偶', '社会', '家庭'],
  },
  {
    id: 'growth-autonomy',
    titleZh: '个人成长与自主支持',
    shortTitle: '成长与自主',
    enTitle: 'Growth, Support & Autonomy',
    description: '平衡伴侣支持与个体分化，建立财务共识、互赖而不丧失自我的成熟爱恋。',
    color: '#D97706',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    category: 'behavior',
    categoryZh: '行为',
    rawTags: ['个人成长', '支持', '金钱'],
  },
];

export const LOVE_DOMAIN_MAP: Record<LoveDomainId, LoveDomainMeta> = LOVE_DOMAINS.reduce(
  (acc, item) => {
    acc[item.id] = item;
    return acc;
  },
  {} as Record<LoveDomainId, LoveDomainMeta>
);

export interface RawLoveConceptRecord {
  order: number; // 1..696
  codeId: string; // LOVE001..LOVE696
  id: string; // love-001..love-696
  nameZh: string;
  nameEn: string;
  subTag: string;
  domainId: LoveDomainId;
  difficulty: DifficultyLevel;
  assignedCityIndex: number; // 0..49
  corePrinciple: string;
  healthyBoundary: string;
  fullExplanation: string;
}

export function getCityLoveDifficultyTier(cityIndex: number): {
  difficulty: DifficultyLevel;
  labelZh: string;
  labelEn: string;
  badgeColor: string;
} {
  if (cityIndex < 17) {
    return {
      difficulty: 'Easy',
      labelZh: '初级 · 启蒙基础',
      labelEn: 'Easy',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    };
  }
  if (cityIndex < 34) {
    return {
      difficulty: 'Medium',
      labelZh: '中阶 · 关系思辨',
      labelEn: 'Medium',
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
    };
  }
  return {
    difficulty: 'Hard',
    labelZh: '高阶 · 深度防御',
    labelEn: 'Hard',
    badgeColor: 'bg-rose-50 text-rose-800 border-rose-200',
  };
}

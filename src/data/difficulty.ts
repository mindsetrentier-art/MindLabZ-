export type GameDifficulty = '低' | '中' | '高' | '高级';

export interface DifficultyConfig {
  id: GameDifficulty;
  name: string;
  nameEn: string;
  badge: string;
  multiplierText: string;
  scoreMultiplier: number;
  xpMultiplier: number;
  description: string;
  colorClass: string;
  borderClass: string;
  bgLightClass: string;
  accentHex: string;
}

export const DIFFICULTY_CONFIGS: Record<GameDifficulty, DifficultyConfig> = {
  '低': {
    id: '低',
    name: '低难度 · 入门探索',
    nameEn: 'Introductory',
    badge: '低',
    multiplierText: '1.0×',
    scoreMultiplier: 1.0,
    xpMultiplier: 1.0,
    description: '基础测试节奏，刺激窗口与思考时间充裕，适合初识心理学实验规律与快速热身。',
    colorClass: 'text-emerald-700 dark:text-emerald-400',
    borderClass: 'border-emerald-200 dark:border-emerald-800',
    bgLightClass: 'bg-emerald-50/80 dark:bg-emerald-950/40',
    accentHex: '#10B981',
  },
  '中': {
    id: '中',
    name: '中难度 · 标准挑战',
    nameEn: 'Standard',
    badge: '中',
    multiplierText: '1.3×',
    scoreMultiplier: 1.3,
    xpMultiplier: 1.25,
    description: '标准认知实验参数，典型斯特鲁普冲突与中等工作记忆负荷，兼顾速度与准确度。',
    colorClass: 'text-blue-700 dark:text-blue-400',
    borderClass: 'border-blue-200 dark:border-blue-800',
    bgLightClass: 'bg-blue-50/80 dark:bg-blue-950/40',
    accentHex: '#3B82F6',
  },
  '高': {
    id: '高',
    name: '高难度 · 高压进阶',
    nameEn: 'Advanced',
    badge: '高',
    multiplierText: '1.7×',
    scoreMultiplier: 1.7,
    xpMultiplier: 1.6,
    description: '时间窗口高度压缩，高比例认知冲突与复杂干扰项，强化抑制控制与反思速度。',
    colorClass: 'text-amber-700 dark:text-amber-400',
    borderClass: 'border-amber-200 dark:border-amber-800',
    bgLightClass: 'bg-amber-50/80 dark:bg-amber-950/40',
    accentHex: '#D97706',
  },
  '高级': {
    id: '高级',
    name: '高级 · 巅峰博弈',
    nameEn: 'Master / Expert',
    badge: '高级',
    multiplierText: '2.2×',
    scoreMultiplier: 2.2,
    xpMultiplier: 2.0,
    description: '极限神经竞技！逆向干扰、瞬时记忆闪烁与高深认知陷阱，专为追求极致心智掌控者设计。',
    colorClass: 'text-purple-700 dark:text-purple-400',
    borderClass: 'border-purple-200 dark:border-purple-800',
    bgLightClass: 'bg-purple-50/80 dark:bg-purple-950/40',
    accentHex: '#8B5CF6',
  },
};

export const DIFFICULTY_LIST: GameDifficulty[] = ['低', '中', '高', '高级'];

export const DEFAULT_DIFFICULTY: GameDifficulty = '中';

/**
 * Utility to shuffle an array immutably using Fisher-Yates algorithm
 */
export function shuffleArray<T>(items: readonly T[] | T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

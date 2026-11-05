import { Badge } from '../types';

export interface ValuationAchievement extends Badge {
  levelRequirement?: '初级' | '中级' | '高级' | '任意';
  targetConditionText: string;
  breakthroughQuote: string;
  accentGradient: string;
  iconSymbol: string;
}

/**
 * 01 · 第一眼判断 · 极速估值专属成就徽章体系
 * 覆盖 初级 (5题)、中级 (25题)、高级 (50题) 以及神准量感与超频连击
 */
export const VALUATION_ACHIEVEMENTS: ValuationAchievement[] = [
  {
    id: 'valuation-novice',
    name: '破锚先锋 · 初窥门道',
    description: '在初级（5题）极速估值对决中突破 2,500 分，识破日供低价与微额锚定假象。',
    icon: 'eye',
    iconSymbol: '👁️',
    unlocked: false,
    category: 'game',
    tier: 'bronze',
    rarity: '基础',
    criteriaType: 'game-score',
    targetGameId: 'first-impression-beginner',
    targetGameName: '第一眼判断 (初级)',
    targetScore: 2500,
    xpBonus: 350,
    color: '#10B981',
    levelRequirement: '初级',
    targetConditionText: '初级对决得分 ≥ 2,500 分',
    breakthroughQuote: '「水滴乘三十，日供现真容。」你已打破第一眼日费的微小锚点！',
    accentGradient: 'from-emerald-500 via-teal-400 to-emerald-600',
  },
  {
    id: 'valuation-adept',
    name: '估值行家 · 实战洞察',
    description: '在中级（25题）攻坚对决中突破 15,000 分，从容心算折上折连乘与复利72法则。',
    icon: 'zap',
    iconSymbol: '⚡',
    unlocked: false,
    category: 'game',
    tier: 'silver',
    rarity: '精良',
    criteriaType: 'game-score',
    targetGameId: 'first-impression-intermediate',
    targetGameName: '第一眼判断 (中级)',
    targetScore: 15000,
    xpBonus: 700,
    color: '#F59E0B',
    levelRequirement: '中级',
    targetConditionText: '中级（25题）得分 ≥ 15,000 分',
    breakthroughQuote: '「五八四十折率定，七二除利复利清。」折上折与理财陷阱已被你一一击破！',
    accentGradient: 'from-amber-500 via-yellow-400 to-amber-600',
  },
  {
    id: 'valuation-master',
    name: '心算宗师 · 绝顶洞悉',
    description: '在高级（50题）极限马拉松中突破 50,000 分，全量无重复题库极速通关！',
    icon: 'crown',
    iconSymbol: '👑',
    unlocked: false,
    category: 'game',
    tier: 'diamond',
    rarity: '史诗',
    criteriaType: 'game-score',
    targetGameId: 'first-impression-advanced',
    targetGameName: '第一眼判断 (高级)',
    targetScore: 50000,
    xpBonus: 1600,
    color: '#EC4899',
    levelRequirement: '高级',
    targetConditionText: '高级（50题）得分 ≥ 50,000 分',
    breakthroughQuote: '「五十关横扫，万般假象尽伏诛。」你已炼就直觉与理性统一的心算火眼金睛！',
    accentGradient: 'from-purple-500 via-pink-400 to-indigo-600',
  },
  {
    id: 'valuation-perfect',
    name: '绝对理性 · 零失误神算',
    description: '在任一挑战对决中保持 100% 满分正确率，无懈可击穿透全部商业营销包装。',
    icon: 'shield-check',
    iconSymbol: '🛡️',
    unlocked: false,
    category: 'game',
    tier: 'gold',
    rarity: '稀有',
    criteriaType: 'game-score',
    targetGameId: 'first-impression',
    targetGameName: '第一眼判断 (满分)',
    targetScore: 3000,
    xpBonus: 800,
    color: '#3B82F6',
    levelRequirement: '任意',
    targetConditionText: '单局准确率达到 100%（至少 5 题）',
    breakthroughQuote: '「心智如明镜，不著半点尘。」全场零失误，理性护盾百分百防御！',
    accentGradient: 'from-blue-500 via-cyan-400 to-indigo-500',
  },
  {
    id: 'valuation-combo-storm',
    name: '闪击超频 · 连击狂潮',
    description: '在极速估值挑战中达成 Combo ≥ 8 题连续秒答全对，进入神经超频心流境界。',
    icon: 'flame',
    iconSymbol: '🔥',
    unlocked: false,
    category: 'game',
    tier: 'gold',
    rarity: '稀有',
    criteriaType: 'game-score',
    targetGameId: 'first-impression',
    targetGameName: '第一眼判断 (连击)',
    targetScore: 4000,
    xpBonus: 650,
    color: '#EA580C',
    levelRequirement: '任意',
    targetConditionText: '单局最大连击 Combo ≥ 8 连胜',
    breakthroughQuote: '「八连破局，雷霆闪击。」你的系统二反应已提速至亚秒级直觉！',
    accentGradient: 'from-orange-500 via-amber-400 to-red-600',
  },
  {
    id: 'valuation-calibration-sage',
    name: '神准量感 · 天平之眸',
    description: '在滑块量感练习模式中完成 5 题练习且平均误差率 ≤ 5%，直觉量感与真值合二为一。',
    icon: 'compass',
    iconSymbol: '⚖️',
    unlocked: false,
    category: 'game',
    tier: 'master',
    rarity: '传说',
    criteriaType: 'game-score',
    targetGameId: 'first-impression',
    targetGameName: '第一眼判断 (量感)',
    targetScore: 5000,
    xpBonus: 1200,
    color: '#8B5CF6',
    levelRequirement: '任意',
    targetConditionText: '量感练习累计 5 题神准校准（误差 ≤ 5%）',
    breakthroughQuote: '「无需草稿纸，心中有天平。」你的估值量感已达到大师级公允定格！',
    accentGradient: 'from-amber-400 via-purple-400 to-yellow-300',
  },
];

export interface ValuationGameStats {
  level: '初级' | '中级' | '高级';
  score: number;
  accuracy: number;
  comboMax: number;
  questionCount: number;
  precisePracticeCount?: number;
}

/**
 * 评估本局游戏是否达成全新的极速估值成就突破
 */
export function evaluateValuationBreakthroughs(
  stats: ValuationGameStats,
  alreadyUnlockedBadgeIds: string[]
): ValuationAchievement[] {
  const unlockedSet = new Set(alreadyUnlockedBadgeIds);
  const newBreakthroughs: ValuationAchievement[] = [];

  VALUATION_ACHIEVEMENTS.forEach((achievement) => {
    if (unlockedSet.has(achievement.id)) return;

    let satisfied = false;

    switch (achievement.id) {
      case 'valuation-novice':
        if (stats.level === '初级' && stats.score >= 2500) {
          satisfied = true;
        }
        break;

      case 'valuation-adept':
        if (stats.level === '中级' && stats.score >= 15000) {
          satisfied = true;
        }
        break;

      case 'valuation-master':
        if (stats.level === '高级' && stats.score >= 50000) {
          satisfied = true;
        }
        break;

      case 'valuation-perfect':
        if (stats.accuracy === 100 && stats.questionCount >= 5) {
          satisfied = true;
        }
        break;

      case 'valuation-combo-storm':
        if (stats.comboMax >= 8) {
          satisfied = true;
        }
        break;

      case 'valuation-calibration-sage':
        if (stats.precisePracticeCount && stats.precisePracticeCount >= 5) {
          satisfied = true;
        }
        break;
    }

    if (satisfied) {
      newBreakthroughs.push({
        ...achievement,
        unlocked: true,
        unlockedAt: new Date().toISOString().split('T')[0],
      });
    }
  });

  return newBreakthroughs;
}

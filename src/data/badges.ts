import { Badge } from '../types';

export const BADGES_DATA: Badge[] = [
  {
    id: 'streak-7',
    name: '7日连学',
    description: '连续 7 天坚持完成每日大脑认知训练',
    icon: 'flame',
    unlocked: true,
    unlockedAt: '2026-08-28',
    category: 'streak',
    xpBonus: 300,
    color: '#FFB72B'
  },
  {
    id: 'cognitive-hunter',
    name: '认知猎手',
    description: '深度掌握并解锁 5 个认知与决策偏差定律',
    icon: 'target',
    unlocked: true,
    unlockedAt: '2026-08-29',
    category: 'knowledge',
    xpBonus: 250,
    color: '#6C4CF1'
  },
  {
    id: 'speed-quiz-master',
    name: '快答王',
    description: '在心理快问快答中实现 5 连击并保持 90% 以上正确率',
    icon: 'zap',
    unlocked: true,
    unlockedAt: '2026-08-30',
    category: 'quiz',
    xpBonus: 400,
    color: '#00A699'
  },
  {
    id: 'lab-experimenter',
    name: '实验家',
    description: '亲身完成所有 5 大互动心理学实验模拟',
    icon: 'flask-conical',
    unlocked: false,
    category: 'game',
    xpBonus: 500,
    color: '#3B82F6'
  },
  {
    id: 'memory-palace-grandmaster',
    name: '记忆大师',
    description: '在 Memory Lab 中达到 10,000 分以上高分',
    icon: 'crown',
    unlocked: false,
    category: 'game',
    xpBonus: 600,
    color: '#EC4899'
  },
  {
    id: 'bias-breaker',
    name: '理性先锋',
    description: '全部 20 项心理学定律掌握度达到 80% 以上',
    icon: 'shield-check',
    unlocked: false,
    category: 'mastery',
    xpBonus: 1000,
    color: '#10B981'
  }
];

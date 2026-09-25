import { Badge } from '../types';

export const BADGES_DATA: Badge[] = [
  {
    id: 'streak-3',
    name: '初心启航',
    description: '连续 3 天完成认知实验室每日研习',
    icon: 'flame',
    unlocked: true,
    unlockedAt: '2026-08-25',
    category: 'streak',
    xpBonus: 150,
    color: '#F59E0B'
  },
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
    id: 'streak-14',
    name: '双周自律者',
    description: '连续 14 天保持神经认知激活与节律打卡',
    icon: 'flame',
    unlocked: false,
    category: 'streak',
    xpBonus: 600,
    color: '#EA580C'
  },
  {
    id: 'streak-30',
    name: '心智磐石',
    description: '连续 30 天不间断研习，形成稳固元认知习惯',
    icon: 'flame',
    unlocked: false,
    category: 'streak',
    xpBonus: 1200,
    color: '#DC2626'
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
    id: 'chapter-pioneer',
    name: '偏误洞察者',
    description: '完成「01 认知偏误与思维捷径」章节全部定律研习',
    icon: 'target',
    unlocked: false,
    category: 'knowledge',
    xpBonus: 400,
    color: '#4F46E5'
  },
  {
    id: 'memory-architect',
    name: '记忆建筑师',
    description: '掌握「02 记忆机制与注意力科学」全部 10 项定律',
    icon: 'target',
    unlocked: false,
    category: 'knowledge',
    xpBonus: 450,
    color: '#7C3AED'
  },
  {
    id: 'decision-strategist',
    name: '博弈策略家',
    description: '掌握「03 决策心理学与风险博弈」全部 10 项定律',
    icon: 'target',
    unlocked: false,
    category: 'knowledge',
    xpBonus: 500,
    color: '#2563EB'
  },
  {
    id: 'social-decoder',
    name: '人际解码者',
    description: '掌握「04 社会影响与人际说服」全部核心心理定律',
    icon: 'target',
    unlocked: false,
    category: 'knowledge',
    xpBonus: 500,
    color: '#059669'
  },
  {
    id: 'business-sage',
    name: '商业洞察家',
    description: '洞悉「05 消费心理与商业定价」背后的行为经济学规律',
    icon: 'target',
    unlocked: false,
    category: 'knowledge',
    xpBonus: 550,
    color: '#D97706'
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
    id: 'quiz-centurion',
    name: '百题斩将',
    description: '累计完成 100 道心理学结构化测验题',
    icon: 'zap',
    unlocked: false,
    category: 'quiz',
    xpBonus: 500,
    color: '#0D9488'
  },
  {
    id: 'quiz-grandmaster',
    name: '300题库通关者',
    description: '通关智心堂 100 定律配套的全部 300 道精选题库',
    icon: 'zap',
    unlocked: false,
    category: 'quiz',
    xpBonus: 1000,
    color: '#0891B2'
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
    id: 'stroop-destroyer',
    name: '抗干扰精英',
    description: '在斯特鲁普心智陷阱实验中达到 95% 准确率',
    icon: 'flask-conical',
    unlocked: false,
    category: 'game',
    xpBonus: 550,
    color: '#8B5CF6'
  },
  {
    id: 'anti-manipulation-shield',
    name: '反操控之盾',
    description: '在 20 个定律的互动博弈场景中做出系统2理性抉择',
    icon: 'shield-check',
    unlocked: false,
    category: 'mastery',
    xpBonus: 650,
    color: '#10B981'
  },
  {
    id: 'halfway-sage',
    name: '半百通识者',
    description: '累计 50 项心理学定律内化掌握度达到 80% 以上',
    icon: 'crown',
    unlocked: false,
    category: 'mastery',
    xpBonus: 800,
    color: '#6366F1'
  },
  {
    id: 'bias-breaker',
    name: '理性先锋',
    description: '累计 80 项心理学定律内化掌握度达到 80% 以上',
    icon: 'shield-check',
    unlocked: false,
    category: 'mastery',
    xpBonus: 1000,
    color: '#059669'
  },
  {
    id: 'mindlabz-omniscient',
    name: '智心宗师 · 100定律圆满',
    description: '完整掌握 LAW001 至 LAW100 全部 100 条心理学定律',
    icon: 'crown',
    unlocked: false,
    category: 'mastery',
    xpBonus: 2500,
    color: '#F59E0B'
  }
];

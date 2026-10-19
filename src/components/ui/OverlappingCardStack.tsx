import React, { useState, useId } from 'react';
import {
  Layers,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  BookOpen,
  Bookmark,
  Award,
  BookMarked,
  GraduationCap,
  ArrowUpRight,
  Brain,
  Zap,
  Flame,
} from 'lucide-react';
import { gameAudio } from '../../utils/gameAudio';

export interface OverlappingCardItem {
  id: string;
  name: string; // 名称
  subname?: string; // 英文名或简短副标
  category?: string; // 分类标签
  badge?: string; // 状态/等级徽标
  description?: string; // 核心概述
  meta?: string; // 附加属性 (如 "12节课" / "已掌握")
  colorGradient?: string; // 背景渐变 Tailwind 类别
  accentColor?: string; // 重点装饰色
  icon?: React.ReactNode;
  image?: string;
  onClick?: (item: OverlappingCardItem) => void;
}

export type OverlappingScenario = 'courses' | 'favorites' | 'vocabulary' | 'profile';

export interface OverlappingCardStackProps {
  /** Array of card items */
  items?: OverlappingCardItem[];
  /** Preconfigured scenario if items not fully provided */
  scenario?: OverlappingScenario;
  /** Number of cards visible when collapsed (strictly 3 as per requirement) */
  maxVisible?: number;
  /** Overlap ratio (strictly 1/3 as per requirement: 0.33333) */
  overlapRatio?: number;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Layout when expanded */
  layout?: 'row' | 'wrap';
  /** Title for the group */
  title?: string;
  /** Subtitle for the group */
  subtitle?: string;
  /** Show scenario switcher tabs */
  showScenarioTabs?: boolean;
  /** Allow clicking individual card to trigger action */
  onCardSelect?: (item: OverlappingCardItem) => void;
  /** Extra class names */
  className?: string;
  /** Whether initially expanded */
  defaultExpanded?: boolean;
}

// 1. 课程分类 (Course Categories) Preset
export const COURSE_CATEGORIES: OverlappingCardItem[] = [
  {
    id: 'course-cognition',
    name: '认知理性与决策哲学',
    subname: 'Cognitive Science & Rational Choice',
    category: '核心研习',
    badge: '8 讲进阶',
    meta: '已更新至第 8 讲 · 1.2k 人修读',
    description: '破除系统一启发式直觉陷阱，重构批判性元认知与思维框架。',
    colorGradient: 'from-indigo-600 via-indigo-700 to-indigo-950 text-white',
    accentColor: '#4F46E5',
    icon: <Brain className="w-5 h-5 text-indigo-300" />,
  },
  {
    id: 'course-memory',
    name: '记忆宫殿与遗忘神经学',
    subname: 'Memory Architecture & Neuroplasticity',
    category: '心智工程',
    badge: '6 讲实战',
    meta: '艾宾浩斯曲线与组块记忆术',
    description: '基于突触可塑性与空间联想，打造永久存储的高速认知索引。',
    colorGradient: 'from-cyan-600 via-teal-700 to-slate-900 text-white',
    accentColor: '#0891B2',
    icon: <Sparkles className="w-5 h-5 text-cyan-300" />,
  },
  {
    id: 'course-behavior',
    name: '行为经济与决策博弈',
    subname: 'Behavioral Economics & Game Theory',
    category: '社会科学',
    badge: '10 讲完结',
    meta: '前景理论与纳什均衡实操',
    description: '拆解心理账户、损失厌恶与禀赋效应，洞悉非理性决策暗流。',
    colorGradient: 'from-emerald-600 via-emerald-800 to-stone-950 text-white',
    accentColor: '#059669',
    icon: <Zap className="w-5 h-5 text-emerald-300" />,
  },
  {
    id: 'course-social',
    name: '社会动力与群体心理学',
    subname: 'Social Dynamics & Group Mind',
    category: '前沿思辨',
    badge: '7 讲完结',
    meta: '阿希从众与破窗效应解析',
    description: '解析群体极化、旁观者冷漠与社会认同，掌握逆向思维独立性。',
    colorGradient: 'from-purple-600 via-violet-800 to-stone-950 text-white',
    accentColor: '#7C3AED',
    icon: <Layers className="w-5 h-5 text-purple-300" />,
  },
  {
    id: 'course-emotion',
    name: '情绪体验与去中心觉察',
    subname: 'Affective Neuroscience & ACT',
    category: '心理韧性',
    badge: '9 讲精读',
    meta: '接纳承诺与自主神经调节',
    description: '借助多迷走神经理论与身体扫描，化解情绪反刍重获内心秩序。',
    colorGradient: 'from-rose-600 via-rose-800 to-stone-950 text-white',
    accentColor: '#E11D48',
    icon: <Flame className="w-5 h-5 text-rose-300" />,
  },
  {
    id: 'course-meta',
    name: '多元思维格栅心智模型',
    subname: 'Latticework of Mental Models',
    category: '大师工坊',
    badge: '12 讲专题',
    meta: '查理·芒格跨学科智慧集',
    description: '融汇物理、生物、数学与工程学第一性原理，终身精进认知格栅。',
    colorGradient: 'from-amber-600 via-amber-800 to-stone-950 text-white',
    accentColor: '#D97706',
    icon: <GraduationCap className="w-5 h-5 text-amber-300" />,
  },
];

// 2. 学习收藏 (Learning Favorites) Preset
export const FAVORITES_COLLECTION: OverlappingCardItem[] = [
  {
    id: 'fav-confirmation',
    name: '确认偏误',
    subname: 'Confirmation Bias',
    category: '思维陷阱',
    badge: '已收藏 · 极高频',
    meta: '掌握度 95% · 3次复盘',
    description: '只寻找印证先入观的证据，自动视而不见反面客观事实。',
    colorGradient: 'from-indigo-600 via-blue-700 to-slate-900 text-white',
    accentColor: '#4F46E5',
    icon: <BookMarked className="w-5 h-5 text-indigo-300" />,
  },
  {
    id: 'fav-anchoring',
    name: '锚定效应',
    subname: 'Anchoring Effect',
    category: '决策偏差',
    badge: '已收藏 · 经典',
    meta: '掌握度 88% · 2次训练',
    description: '第一接收的初始数值信息，如锚一样牢牢钳制后续全部推测。',
    colorGradient: 'from-violet-600 via-purple-700 to-slate-900 text-white',
    accentColor: '#7C3AED',
    icon: <Brain className="w-5 h-5 text-violet-300" />,
  },
  {
    id: 'fav-loss-aversion',
    name: '损失厌恶',
    subname: 'Loss Aversion',
    category: '前景理论',
    badge: '重点心法',
    meta: '卡尼曼 & 特沃斯基定理',
    description: '同等金额的损失带来的痛苦，约为获得同等收益快乐的2至2.5倍。',
    colorGradient: 'from-rose-600 via-pink-700 to-slate-900 text-white',
    accentColor: '#E11D48',
    icon: <Zap className="w-5 h-5 text-rose-300" />,
  },
  {
    id: 'fav-peak-end',
    name: '峰终定律',
    subname: 'Peak-End Rule',
    category: '记忆体验',
    badge: '设计心智',
    meta: '掌握度 92% · 体验架构',
    description: '人们对体验的记忆仅取决于峰值高峰与终点结束时的主观感受。',
    colorGradient: 'from-amber-600 via-yellow-600 to-stone-900 text-white',
    accentColor: '#D97706',
    icon: <Sparkles className="w-5 h-5 text-amber-300" />,
  },
  {
    id: 'fav-sunk-cost',
    name: '沉没成本谬误',
    subname: 'Sunk Cost Fallacy',
    category: '非理性决策',
    badge: '止损反思',
    meta: '掌握度 84% · 实战案例',
    description: '因为前期已投入不可挽回的时间金钱，而在错误的方向继续追加投入。',
    colorGradient: 'from-red-600 via-rose-700 to-stone-950 text-white',
    accentColor: '#DC2626',
    icon: <Flame className="w-5 h-5 text-red-300" />,
  },
  {
    id: 'fav-dunning-kruger',
    name: '邓宁-克鲁格效应',
    subname: 'Dunning-Kruger Effect',
    category: '元认知',
    badge: '愚昧之巅',
    meta: '破除自负 · 持续精进',
    description: '能力欠缺者沉浸在自我膨胀中，而真正通晓者反因见识浩瀚而倍感敬畏。',
    colorGradient: 'from-cyan-600 via-teal-700 to-stone-900 text-white',
    accentColor: '#0891B2',
    icon: <Award className="w-5 h-5 text-cyan-300" />,
  },
  {
    id: 'fav-bystander',
    name: '旁观者效应',
    subname: 'Bystander Effect',
    category: '责任分散',
    badge: '紧急警示',
    meta: '达利 & 拉塔内实验',
    description: '在场旁观的人数越多，个体挺身而出施以援手的概率反而急剧下降。',
    colorGradient: 'from-stone-700 via-stone-800 to-stone-950 text-white',
    accentColor: '#57534E',
    icon: <Layers className="w-5 h-5 text-stone-300" />,
  },
];

// 3. 词汇集 (Vocabulary Sets) Preset
export const VOCABULARY_SET: OverlappingCardItem[] = [
  {
    id: 'vocab-dissonance',
    name: '认知失调',
    subname: 'Cognitive Dissonance',
    category: '核心概念',
    badge: '心理学经典',
    meta: '利昂·费斯汀格 1957',
    description: '当态度与行为产生内在冲突时，心智会本能地扭曲信念来缓解心理张力。',
    colorGradient: 'from-blue-600 via-indigo-700 to-slate-900 text-white',
    accentColor: '#2563EB',
    icon: <BookOpen className="w-5 h-5 text-blue-300" />,
  },
  {
    id: 'vocab-dopamine',
    name: '多巴胺奖赏预测误差',
    subname: 'Reward Prediction Error (RPE)',
    category: '神经机制',
    badge: '神经递质',
    meta: '舒尔茨突触动力学',
    description: '多巴胺并不等于快乐本身，而是驱动心智对未知的期待与渴望。',
    colorGradient: 'from-purple-600 via-pink-700 to-slate-950 text-white',
    accentColor: '#9333EA',
    icon: <Zap className="w-5 h-5 text-purple-300" />,
  },
  {
    id: 'vocab-neuroplasticity',
    name: '神经可塑性',
    subname: 'Neuroplasticity',
    category: '大脑进化',
    badge: '赫布突触理论',
    meta: 'Neurons fire together, wire together',
    description: '成年人的大脑神经突触回路仍可伴随专注训练而终生重组改造。',
    colorGradient: 'from-teal-600 via-emerald-700 to-stone-900 text-white',
    accentColor: '#0D9488',
    icon: <Brain className="w-5 h-5 text-teal-300" />,
  },
  {
    id: 'vocab-self-serving',
    name: '自利性归因偏差',
    subname: 'Self-Serving Bias',
    category: '归因心理',
    badge: '心智防御',
    meta: '内归因与外归因失衡',
    description: '成功归结为自身天赋才智，失败则归咎于恶劣外部环境或坏运气。',
    colorGradient: 'from-amber-600 via-orange-700 to-stone-900 text-white',
    accentColor: '#D97706',
    icon: <Sparkles className="w-5 h-5 text-amber-300" />,
  },
  {
    id: 'vocab-zeigarnik',
    name: '蔡格尼克记忆效应',
    subname: 'Zeigarnik Effect',
    category: '记忆张力',
    badge: '任务闭环',
    meta: '未竟之事的潜意识侵入',
    description: '未完成的事务会在大脑中维持持续张力，远比已完成的事件记得更牢。',
    colorGradient: 'from-fuchsia-600 via-pink-700 to-stone-900 text-white',
    accentColor: '#C026D3',
    icon: <BookMarked className="w-5 h-5 text-fuchsia-300" />,
  },
  {
    id: 'vocab-priming',
    name: '潜意识启动效应',
    subname: 'Subconscious Priming',
    category: '感知联想',
    badge: '隐性激活',
    meta: '语义网络激活',
    description: '先前微弱的感官或语词刺激，会在无意识层面显著左右后续的行为与决策。',
    colorGradient: 'from-sky-600 via-blue-800 to-slate-950 text-white',
    accentColor: '#0284C7',
    icon: <Layers className="w-5 h-5 text-sky-300" />,
  },
  {
    id: 'vocab-spotlight',
    name: '聚光灯效应',
    subname: 'Spotlight Effect',
    category: '社会认知',
    badge: '去焦虑',
    meta: '自我中心投射偏差',
    description: '我们总高估他人对自己外表、尴尬过失或言行的注意程度，其实他人毫不在意。',
    colorGradient: 'from-emerald-600 via-teal-800 to-stone-950 text-white',
    accentColor: '#059669',
    icon: <Award className="w-5 h-5 text-emerald-300" />,
  },
  {
    id: 'vocab-wallenda',
    name: '瓦伦达心态',
    subname: 'Wallenda Effect',
    category: '抗压专注',
    badge: '心流临界',
    meta: '过度患得患失致失误',
    description: '越害怕失败、全神贯注于可能犯错的后果，往往越容易触发神经失误。',
    colorGradient: 'from-stone-700 via-stone-800 to-stone-950 text-white',
    accentColor: '#44403C',
    icon: <Flame className="w-5 h-5 text-stone-300" />,
  },
];

// 4. 个人资料 (Personal Profile Achievements & Badges) Preset
export const PROFILE_ACHIEVEMENTS: OverlappingCardItem[] = [
  {
    id: 'badge-streak-7',
    name: '连续七日禅定专注勋章',
    subname: '7-Day Mindful Resonance Badge',
    category: '意志力进阶',
    badge: '黄金荣耀',
    meta: '连续 7 天完成呼吸与冥想',
    description: '已构建深层副交感神经自主调节反射，心率变异性(HRV)显著增强。',
    colorGradient: 'from-amber-500 via-yellow-600 to-amber-900 text-stone-900',
    accentColor: '#F59E0B',
    icon: <Award className="w-5 h-5 text-amber-950" />,
  },
  {
    id: 'badge-critical-thinker',
    name: '批判思辨学者典章',
    subname: 'Master of Cognitive Laws',
    category: '智识巅峰',
    badge: 'Lv.7 哲思者',
    meta: '掌握 25 项经典心理学定律',
    description: '在日常决策中熟练识别确认偏误、损失厌恶与锚定陷阱，建立理性直觉。',
    colorGradient: 'from-indigo-600 via-violet-700 to-slate-900 text-white',
    accentColor: '#4F46E5',
    icon: <Brain className="w-5 h-5 text-indigo-300" />,
  },
  {
    id: 'badge-journal-alchemist',
    name: '心智炼金士日记勋章',
    subname: 'Mental Alchemist Journal',
    category: '自省觉知',
    badge: '30 篇手记',
    meta: 'AI 深度情感洞察累计15篇',
    description: '将生活中的无序焦虑与负面情绪，通过结构化书写转化为澄澈理性洞察。',
    colorGradient: 'from-emerald-600 via-teal-700 to-stone-900 text-white',
    accentColor: '#059669',
    icon: <BookMarked className="w-5 h-5 text-emerald-300" />,
  },
  {
    id: 'badge-game-grandmaster',
    name: '认知博弈大师奖牌',
    subname: 'Cognitive Arena Grandmaster',
    category: '竞技排位',
    badge: '胜率 92%',
    meta: '战胜 15 个认知实验陷阱',
    description: '在有限时间与高压诱导下保持严密逻辑推理，敏捷击溃虚假启发式。',
    colorGradient: 'from-rose-600 via-red-700 to-stone-950 text-white',
    accentColor: '#E11D48',
    icon: <Zap className="w-5 h-5 text-rose-300" />,
  },
  {
    id: 'badge-speed-runner',
    name: '极速神经反应闪电勋章',
    subname: 'Neural Reflex Lightning',
    category: '神经敏捷',
    badge: '前 3% 顶尖',
    meta: '平均响应时延 < 280ms',
    description: '抑制优势反应通道，前额叶皮层与眼动执行系统实现毫秒级超敏协同。',
    colorGradient: 'from-purple-600 via-indigo-700 to-stone-950 text-white',
    accentColor: '#7C3AED',
    icon: <Sparkles className="w-5 h-5 text-purple-300" />,
  },
  {
    id: 'badge-zen-master',
    name: '正念心流导师卡牌',
    subname: 'Zen Flow Resonator',
    category: '情绪稳态',
    badge: '圆满达成',
    meta: '累计 180 分钟自然环境冥想',
    description: '如林间清泉、山中细雨，随时随地进入心无挂碍的安住状态。',
    colorGradient: 'from-stone-700 via-stone-800 to-stone-950 text-white',
    accentColor: '#78716C',
    icon: <Layers className="w-5 h-5 text-stone-300" />,
  },
];

const SCENARIO_PRESETS: Record<
  OverlappingScenario,
  {
    title: string;
    subtitle: string;
    items: OverlappingCardItem[];
    kicker: string;
    icon: React.ReactNode;
  }
> = {
  courses: {
    title: '课程分类体系',
    subtitle: '结构化认知进化学院',
    items: COURSE_CATEGORIES,
    kicker: '01 · Course Categories',
    icon: <GraduationCap className="w-4 h-4 text-indigo-600" />,
  },
  favorites: {
    title: '我的学习收藏',
    subtitle: '高频研习法则与思维模型',
    items: FAVORITES_COLLECTION,
    kicker: '02 · Learning Bookmarks',
    icon: <Bookmark className="w-4 h-4 text-emerald-600" />,
  },
  vocabulary: {
    title: '认知心理词汇集',
    subtitle: '心智机制与神经科学专业术语',
    items: VOCABULARY_SET,
    kicker: '03 · Vocabulary Index',
    icon: <BookOpen className="w-4 h-4 text-amber-600" />,
  },
  profile: {
    title: '个人荣誉与成就档案',
    subtitle: '认知训练段位与专属艺术徽章',
    items: PROFILE_ACHIEVEMENTS,
    kicker: '04 · Personal Profile',
    icon: <Award className="w-4 h-4 text-rose-600" />,
  },
};

const SIZE_CONFIGS = {
  sm: {
    cardWidth: 150,
    cardHeight: 200,
    widthClass: 'w-[150px] min-w-[150px]',
    heightClass: 'h-[200px]',
    titleClass: 'text-xs font-bold',
    subnameClass: 'text-[10px]',
    descClass: 'text-[10px] line-clamp-2',
    iconSizeClass: 'w-7 h-7',
    paddingClass: 'p-3',
  },
  md: {
    cardWidth: 180,
    cardHeight: 236,
    widthClass: 'w-[180px] min-w-[180px]',
    heightClass: 'h-[236px]',
    titleClass: 'text-sm font-bold',
    subnameClass: 'text-[11px]',
    descClass: 'text-[11px] line-clamp-3',
    iconSizeClass: 'w-8 h-8',
    paddingClass: 'p-4',
  },
  lg: {
    cardWidth: 210,
    cardHeight: 260,
    widthClass: 'w-[210px] min-w-[210px]',
    heightClass: 'h-[260px]',
    titleClass: 'text-base font-bold',
    subnameClass: 'text-xs',
    descClass: 'text-xs line-clamp-3',
    iconSizeClass: 'w-9 h-9',
    paddingClass: 'p-5',
  },
};

export const OverlappingCardStack: React.FC<OverlappingCardStackProps> = ({
  items: customItems,
  scenario = 'courses',
  maxVisible = 3, // Exactly 3 visible cards when collapsed as strictly required!
  overlapRatio = 1 / 3, // Exactly 1/3 overlap between cards!
  size = 'md',
  layout = 'row',
  title: customTitle,
  subtitle: customSubtitle,
  showScenarioTabs = true,
  onCardSelect,
  className = '',
  defaultExpanded = false,
}) => {
  const [activeScenario, setActiveScenario] = useState<OverlappingScenario>(scenario);
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedCard, setSelectedCard] = useState<OverlappingCardItem | null>(null);
  const componentId = useId();

  // Determine current active dataset
  const currentScenarioConfig = SCENARIO_PRESETS[activeScenario];
  const items = customItems || currentScenarioConfig.items;
  const currentTitle = customTitle || currentScenarioConfig.title;
  const currentSubtitle = customSubtitle || currentScenarioConfig.subtitle;

  const totalCount = items.length;
  // Requirement: "收起时显示前三张和 +N 剩余数量"
  const visibleCards = isExpanded ? items : items.slice(0, maxVisible);
  const remainingCount = totalCount - maxVisible;
  const hasRemainder = !isExpanded && remainingCount > 0;

  const config = SIZE_CONFIGS[size];
  // Overlap calculation: each card covers approximately one-third (1/3) of previous card
  // Overlap distance in px = cardWidth * overlapRatio
  const overlapDistancePx = Math.round(config.cardWidth * overlapRatio);

  const handleToggle = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      gameAudio.playTap();
    } catch {
      // ignore
    }
    setIsExpanded((prev) => !prev);
  };

  const handleCardClick = (item: OverlappingCardItem, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      gameAudio.playTap();
    } catch {
      // ignore
    }
    setSelectedCard(item);
    if (onCardSelect) {
      onCardSelect(item);
    }
  };

  const handleScenarioChange = (s: OverlappingScenario) => {
    try {
      gameAudio.playTap();
    } catch {
      // ignore
    }
    setActiveScenario(s);
  };

  return (
    <div className={`space-y-3.5 select-none ${className}`}>
      {/* 1. Header with Scenario Tabs and Collapse/Expand Hint */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Scenario Switcher Tabs */}
        {showScenarioTabs && !customItems && (
          <div className="flex items-center gap-1 p-1 bg-stone-100/90 rounded-xl border border-stone-200/80 shadow-2xs overflow-x-auto scrollbar-none">
            {(
              [
                { key: 'courses', label: '课程分类' },
                { key: 'favorites', label: '学习收藏' },
                { key: 'vocabulary', label: '词汇集' },
                { key: 'profile', label: '个人资料' },
              ] as const
            ).map((tab) => {
              const active = activeScenario === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => handleScenarioChange(tab.key)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-white text-stone-900 shadow-xs border border-stone-200/80'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Title or Details Info */}
        <div className="flex items-center gap-2">
          <span className="font-serif-editorial text-base sm:text-lg font-bold text-stone-900 tracking-tight">
            {currentTitle}
          </span>
          <span className="text-xs text-stone-500 font-sans hidden md:inline">
            · {currentSubtitle}
          </span>
        </div>

        {/* Smooth Expand / Collapse Trigger Indicator */}
        <button
          type="button"
          onClick={handleToggle}
          className="inline-flex items-center gap-2 self-start sm:self-auto px-3.5 py-1.5 text-xs font-semibold text-stone-800 bg-stone-100 hover:bg-stone-200/80 border border-stone-200/90 rounded-xl transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400"
          aria-expanded={isExpanded}
          aria-label={isExpanded ? '点击平滑收回重叠卡片' : '点击依次展开卡片并显示名称'}
        >
          <Layers className="w-3.5 h-3.5 text-stone-600" />
          <span>
            {isExpanded
              ? '再次点击平滑收回 (1/3重叠)'
              : `点击依次展开并显示名称 (共 ${totalCount} 张)`}
          </span>
          <span
            className={`inline-block transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              isExpanded ? 'rotate-90' : 'rotate-0'
            }`}
          >
            <ChevronRight className="w-3.5 h-3.5 text-stone-500" />
          </span>
        </button>
      </div>

      {/* 2. Overlapping Card Area: Click entire stack to expand / Click again to collapse */}
      <div
        role="region"
        aria-label="重叠式卡片交互展示区"
        className={`relative p-3 sm:p-4 rounded-3xl transition-all duration-400 border ${
          isExpanded
            ? 'bg-stone-50/80 border-stone-200/80 shadow-xs'
            : 'bg-stone-50/40 border-stone-200/50 hover:bg-stone-50/70 hover:border-stone-300/80'
        }`}
      >
        {/* Instruction subtext */}
        <div className="flex items-center justify-between text-[11px] text-stone-500 mb-3 px-1">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
            <span>
              {isExpanded
                ? '已全部展开 · 再次点击任意空白处或收起按钮平滑收拢'
                : '当前重叠 1/3 · 展示前 3 张 + 剩余卡片 · 点击展开'}
            </span>
          </div>
          <span className="text-[10px] font-mono text-stone-400">
            {isExpanded ? `EXPANDED · ${totalCount}` : `COLLAPSED · 3 + ${Math.max(0, remainingCount)}`}
          </span>
        </div>

        {/* The Card Track */}
        <div
          id={`${componentId}-card-track`}
          onClick={() => {
            // Clicking background also smoothly toggles expansion
            handleToggle();
          }}
          className={`relative transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer ${
            isExpanded
              ? layout === 'wrap'
                ? 'flex flex-wrap gap-4 sm:gap-5'
                : 'flex flex-row overflow-x-auto pb-4 gap-4 scrollbar-none items-stretch'
              : 'flex flex-row items-center overflow-x-auto sm:overflow-visible pb-2'
          }`}
        >
          {visibleCards.map((card, index) => {
            // Stagger animation timing:
            // Stagger outwards sequentially on expansion (index * 45ms)
            // Retract smoothly on collapse
            const transitionDelayMs = isExpanded
              ? index * 45
              : (visibleCards.length - 1 - index) * 25;

            const isHovered = hoveredIndex === index;
            // Overlap margin: When collapsed, each card starting from index 1 has a negative left margin
            // corresponding to 1/3 of the card width (covering approx 1/3 of preceding card)
            const marginLeft = !isExpanded && index > 0 ? `-${overlapDistancePx}px` : '0px';

            return (
              <div
                key={card.id}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={(e) => {
                  if (isExpanded) {
                    // When expanded, clicking a card opens its details/action
                    handleCardClick(card, e);
                  } else {
                    // When collapsed, clicking expands the stack
                    handleToggle(e);
                  }
                }}
                style={{
                  marginLeft,
                  zIndex: isExpanded ? 10 : index + 1,
                  transitionDelay: `${transitionDelayMs}ms`,
                }}
                className={`group relative rounded-2xl transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] shrink-0 flex flex-col justify-between overflow-hidden shadow-sm border border-black/10 select-none ${
                  config.widthClass
                } ${config.heightClass} ${config.paddingClass} ${
                  card.colorGradient || 'bg-gradient-to-br from-stone-800 to-stone-950 text-white'
                } ${
                  isHovered && !isExpanded
                    ? 'scale-105 -translate-y-2 shadow-xl z-40 ring-2 ring-white/60'
                    : isHovered && isExpanded
                    ? 'scale-[1.03] -translate-y-1 shadow-lg ring-2 ring-stone-900/30'
                    : ''
                }`}
              >
                {/* Background decorative watermark */}
                <div className="absolute -right-4 -bottom-4 opacity-10 pointer-events-none transform rotate-12 scale-150">
                  {card.icon || <Sparkles className="w-24 h-24" />}
                </div>

                {/* Card Top: Category / Kicker & Icon */}
                <div className="relative z-10 flex items-start justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-wider font-semibold opacity-75">
                      {card.category || '智识卡'}
                    </span>
                    {/* Index Indicator */}
                    <span className="font-mono text-[10px] opacity-60">
                      #{String(index + 1).padStart(2, '0')}
                    </span>
                  </div>

                  <div className="w-8 h-8 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/20 shadow-2xs">
                    {card.icon}
                  </div>
                </div>

                {/* Card Middle: Primary Name (名称) & Subname */}
                <div className="relative z-10 space-y-1 my-auto">
                  <h4
                    className={`font-serif-editorial leading-snug tracking-tight text-white ${config.titleClass}`}
                  >
                    {card.name}
                  </h4>

                  {card.subname && (
                    <p
                      className={`text-white/80 font-sans tracking-normal font-normal line-clamp-1 ${config.subnameClass}`}
                    >
                      {card.subname}
                    </p>
                  )}

                  {/* Expanded description (revealed clearly upon clicking expand) */}
                  <div
                    style={{
                      transitionDelay: isExpanded ? `${transitionDelayMs + 30}ms` : '0ms',
                    }}
                    className={`transition-all duration-400 ease-out ${
                      isExpanded
                        ? 'opacity-90 max-h-20 translate-y-0 mt-2 text-white/85'
                        : 'opacity-0 max-h-0 -translate-y-2 pointer-events-none overflow-hidden'
                    }`}
                  >
                    <p className={config.descClass}>{card.description}</p>
                  </div>
                </div>

                {/* Card Bottom: Badge or Meta Tag */}
                <div className="relative z-10 pt-2 border-t border-white/15 flex items-center justify-between text-[10px]">
                  <span className="font-medium text-white/90 truncate max-w-[110px]">
                    {card.badge || card.meta}
                  </span>

                  {isExpanded ? (
                    <span className="inline-flex items-center gap-0.5 text-white/80 group-hover:text-white transition-colors">
                      <span className="text-[9px]">详情</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </span>
                  ) : (
                    <span className="text-[9px] text-white/60">1/3 叠放</span>
                  )}
                </div>

                {/* Collapsed Hover Tooltip */}
                {!isExpanded && isHovered && (
                  <div className="absolute top-2 left-2 right-2 p-1.5 rounded-lg bg-stone-900/95 text-white text-[10px] font-medium backdrop-blur-md shadow-lg z-50 pointer-events-none animate-fadeIn border border-white/20">
                    <p className="font-bold truncate">{card.name}</p>
                    <p className="text-stone-300 text-[9px] line-clamp-2 mt-0.5">
                      {card.description}
                    </p>
                  </div>
                )}
              </div>
            );
          })}

          {/* 3. Tail Remainder Card: "收起时显示前三张和 +N 剩余数量" */}
          {hasRemainder && (
            <div
              onClick={handleToggle}
              style={{
                // Continuous 1/3 overlap with the 3rd card!
                marginLeft: `-${overlapDistancePx}px`,
                zIndex: maxVisible + 1,
              }}
              className={`group relative rounded-2xl flex flex-col items-center justify-center p-3 transition-all duration-300 hover:scale-105 -translate-y-0 hover:-translate-y-1 cursor-pointer bg-white border border-stone-300/90 shadow-md shrink-0 ${
                config.widthClass
              } ${config.heightClass}`}
              title={`点击展开剩余 ${remainingCount} 张卡片并显示名称`}
            >
              <div className="w-11 h-11 rounded-full bg-stone-100 flex items-center justify-center text-stone-700 font-bold font-numeric text-base group-hover:bg-stone-900 group-hover:text-white transition-colors shadow-2xs border border-stone-200">
                +{remainingCount}
              </div>

              <span className="text-xs font-bold text-stone-900 mt-2.5">
                +{remainingCount} 剩余未展
              </span>

              <span className="text-[10px] text-stone-500 font-medium text-center mt-1">
                点击依次展开
              </span>

              <span className="mt-3 px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 text-[9px] font-medium border border-stone-200 group-hover:bg-stone-200">
                1/3 叠层
              </span>
            </div>
          )}

          {/* 4. Retraction Card when Expanded: Smooth collapse */}
          {isExpanded && (
            <div
              onClick={handleToggle}
              style={{
                transitionDelay: `${visibleCards.length * 45}ms`,
              }}
              className={`group relative rounded-2xl flex flex-col items-center justify-center p-4 transition-all duration-400 ease-out border border-dashed border-stone-300 hover:border-stone-900/60 bg-white/70 hover:bg-stone-100/90 text-stone-700 shrink-0 cursor-pointer ${
                config.widthClass
              } ${config.heightClass}`}
              title="再次点击平滑收回重叠卡片"
            >
              <div className="w-10 h-10 rounded-full bg-stone-200 group-hover:bg-stone-900 group-hover:text-white flex items-center justify-center transition-colors shadow-2xs mb-2">
                <ChevronLeft className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-stone-900">平滑收回叠放</span>
              <span className="text-[10px] text-stone-500 text-center mt-1">
                还原 1/3 覆盖
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Selected Card Modal / Insight Sheet */}
      {selectedCard && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn"
          onClick={() => setSelectedCard(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-stone-200 space-y-4 animate-scaleUp"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-stone-100 text-stone-700 border border-stone-200">
                  {selectedCard.category || '智识卡片'}
                </span>
                {selectedCard.badge && (
                  <span className="text-xs text-stone-500 font-medium">
                    · {selectedCard.badge}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedCard(null)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500 hover:text-stone-900 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1.5">
              <h3 className="font-serif-editorial text-xl font-bold text-stone-900 tracking-tight">
                {selectedCard.name}
              </h3>
              {selectedCard.subname && (
                <p className="text-xs text-stone-500 font-medium">{selectedCard.subname}</p>
              )}
            </div>

            <p className="text-sm text-stone-700 leading-relaxed bg-stone-50 p-3.5 rounded-xl border border-stone-200/80">
              {selectedCard.description}
            </p>

            {selectedCard.meta && (
              <div className="flex items-center gap-2 text-xs text-stone-600">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>{selectedCard.meta}</span>
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedCard(null)}
                className="px-4 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

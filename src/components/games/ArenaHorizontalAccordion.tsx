import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Gamepad2,
  Trophy,
  Zap,
  Target,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Eye,
  Anchor,
  Users,
  Activity,
  HeartPulse,
  Shuffle,
  Gift,
  LifeBuoy,
  SearchCheck,
  Brain,
  CheckCircle2,
  Clock,
  Flame,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { gameAudio } from '../../utils/gameAudio';
import { GameDifficulty } from '../../data/difficulty';

export interface ArenaAccordionGameItem {
  id: string;
  number: string;
  nameZh: string;
  nameEn: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  conceptLearned: string;
  estimatedTime: string;
  accentColor: string;
  bgGradient: string;
  icon: React.ReactNode;
  imageUrl: string;
  baseScore: number;
}

// 1. 精选 5 大竞技场必玩核心实验
export const ARENA_FEATURED_GAMES: ArenaAccordionGameItem[] = [
  {
    id: 'first-impression',
    number: '01',
    nameZh: '第一眼判断',
    nameEn: 'Rapid Valuation & Mental Math',
    category: '认知启发',
    difficulty: 'Medium',
    description: '用3秒极速估值心算，识破日供低价、折上折与利息迷雾，穿透第一眼认知陷阱。',
    conceptLearned: '极速估值心算（Mental Math Heuristics）与去锚定估值法',
    estimatedTime: '75秒',
    accentColor: '#F59E0B',
    bgGradient: 'from-amber-950/90 via-stone-900 to-stone-950 text-white',
    icon: <Eye className="w-5 h-5 text-amber-400" />,
    imageUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=800&q=80',
    baseScore: 3200,
  },
  {
    id: 'anchoring-lab',
    number: '02',
    nameZh: '锚点实验室',
    nameEn: 'Anchoring & Adjustment Heuristic',
    category: '决策实验',
    difficulty: 'Medium',
    description: '体验第一个数字如何劫持后续估值，学习剥离价格先验锚并建立独立比较参照系。',
    conceptLearned: '锚定效应（Anchoring Effect）与去锚定理性评估法',
    estimatedTime: '90秒',
    accentColor: '#3B82F6',
    bgGradient: 'from-blue-950/90 via-stone-900 to-stone-950 text-white',
    icon: <Anchor className="w-5 h-5 text-blue-400" />,
    imageUrl: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=800&q=80',
    baseScore: 3200,
  },
  {
    id: 'majority-answer',
    number: '03',
    nameZh: '多数人的答案',
    nameEn: 'Conformity & Social Proof',
    category: '社会从众',
    difficulty: 'Hard',
    description: '面对强势群聊舆论与大众假象，敏锐甄别客观事实证据，练习不盲从的独立思考。',
    conceptLearned: '阿希从众效应（Asch Conformity）与群体压力抵抗力',
    estimatedTime: '100秒',
    accentColor: '#EC4899',
    bgGradient: 'from-pink-950/90 via-stone-900 to-stone-950 text-white',
    icon: <Users className="w-5 h-5 text-pink-400" />,
    imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
    baseScore: 3500,
  },
  {
    id: 'peak-end',
    number: '04',
    nameZh: '峰值与结尾',
    nameEn: 'Memory Heuristics & Kahneman Law',
    category: '记忆体验',
    difficulty: 'Medium',
    description: '作为体验设计师排列体验波形，直观感受高峰与收尾时刻如何决定全局记忆评价。',
    conceptLearned: '峰终定律（Peak-End Rule）与体验心理学设计',
    estimatedTime: '80秒',
    accentColor: '#F59E0B',
    bgGradient: 'from-orange-950/90 via-stone-900 to-stone-950 text-white',
    icon: <Activity className="w-5 h-5 text-orange-400" />,
    imageUrl: 'https://images.unsplash.com/photo-1518173946687-a4c8a383392e?auto=format&fit=crop&w=800&q=80',
    baseScore: 3000,
  },
  {
    id: 'falsification-challenge',
    number: '05',
    nameZh: '反证挑战',
    nameEn: 'Wason 2-4-6 & Popper Falsification',
    category: '逻辑反思',
    difficulty: 'Hard',
    description: '体验经典沃森2-4-6规则发现实验，主动寻找“黑天鹅”反例，打破求证偏执。',
    conceptLearned: '可证伪思维（Falsificationism）与确认偏误防御机制',
    estimatedTime: '110秒',
    accentColor: '#6366F1',
    bgGradient: 'from-indigo-950/90 via-stone-900 to-stone-950 text-white',
    icon: <SearchCheck className="w-5 h-5 text-indigo-400" />,
    imageUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80',
    baseScore: 4000,
  },
];

// 2. 决策偏误与理性博弈
export const ARENA_DECISION_GAMES: ArenaAccordionGameItem[] = [
  {
    id: 'zero-price-trap',
    number: '01',
    nameZh: '免费陷阱',
    nameEn: 'Zero-Price Effect & Mental Accounting',
    category: '决策偏差',
    difficulty: 'Hard',
    description: '识别“0元免费”如何劫持多巴胺神经决策，精准计算被忽视的隐性时间与机会成本。',
    conceptLearned: '零价格效应（Zero-Price Effect）与非理性心理账户',
    estimatedTime: '100秒',
    accentColor: '#10B981',
    bgGradient: 'from-emerald-950/90 via-stone-900 to-stone-950 text-white',
    icon: <Gift className="w-5 h-5 text-emerald-400" />,
    imageUrl: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=800&q=80',
    baseScore: 3600,
  },
  {
    id: 'mind-trap',
    number: '02',
    nameZh: '思维陷阱解密',
    nameEn: 'Cognitive Bias & Stroop Conflict',
    category: '抑制控制',
    difficulty: 'Hard',
    description: '破解大脑自动化的思维直觉捷径，化解斯特鲁普效应冲突与认知盲区。',
    conceptLearned: '双系统理论（System 1 vs System 2）与抑制控制（Inhibitory Control）',
    estimatedTime: '45秒',
    accentColor: '#E11D48',
    bgGradient: 'from-rose-950/90 via-stone-900 to-stone-950 text-white',
    icon: <Zap className="w-5 h-5 text-rose-400" />,
    imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80',
    baseScore: 5210,
  },
  {
    id: 'attribution-shift',
    number: '03',
    nameZh: '换位不读心',
    nameEn: 'Fundamental Attribution Error',
    category: '同理归因',
    difficulty: 'Medium',
    description: '打破“把一次偶发失误直接归咎为人品道德败坏”的心理习惯，发掘隐蔽情境。',
    conceptLearned: '基本归因错误（Fundamental Attribution Error）与同理心重构',
    estimatedTime: '90秒',
    accentColor: '#8B5CF6',
    bgGradient: 'from-purple-950/90 via-stone-900 to-stone-950 text-white',
    icon: <Shuffle className="w-5 h-5 text-purple-400" />,
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    baseScore: 3100,
  },
  {
    id: 'emotion-detective',
    number: '04',
    nameZh: '情绪侦探',
    nameEn: 'Affect Heuristic & Fact Parsing',
    category: '情绪解离',
    difficulty: 'Medium',
    description: '学习从职场争执与亲密沟通中，敏锐剥离主观情绪宣泄、无端推测与客观事实。',
    conceptLearned: '情绪启发（Affect Heuristic）与事实/推论精准分离技术',
    estimatedTime: '90秒',
    accentColor: '#EF4444',
    bgGradient: 'from-red-950/90 via-stone-900 to-stone-950 text-white',
    icon: <HeartPulse className="w-5 h-5 text-red-400" />,
    imageUrl: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&w=800&q=80',
    baseScore: 3400,
  },
];

// 3. 神经突触与极速注意力
export const ARENA_NEURAL_GAMES: ArenaAccordionGameItem[] = [
  {
    id: 'brain-rush',
    number: '01',
    nameZh: '注意力风暴',
    nameEn: 'Selective Attention Storm',
    category: '选择性注意',
    difficulty: 'Easy',
    description: '在高速视觉刺激与干扰物中保持绝对专注，训练神经反应时与选择性注意过滤网。',
    conceptLearned: '选择性注意与鸡尾酒会过滤机制（Broadbent Filter Model）',
    estimatedTime: '30秒',
    accentColor: '#10B981',
    bgGradient: 'from-emerald-950/90 via-stone-900 to-stone-950 text-white',
    icon: <Sparkles className="w-5 h-5 text-emerald-400" />,
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    baseScore: 12050,
  },
  {
    id: 'memory-lab',
    number: '02',
    nameZh: '记忆宫殿矩阵',
    nameEn: 'Spatial & Sequence Memory',
    category: '空间记忆',
    difficulty: 'Medium',
    description: '强化空间布局与序列记忆能力，训练工作记忆容量突破米勒 7±2 定律。',
    conceptLearned: '工作记忆容量与空间网格编码（Spatial Grid Cells）',
    estimatedTime: '60秒',
    accentColor: '#6C4CF1',
    bgGradient: 'from-indigo-950/90 via-stone-900 to-stone-950 text-white',
    icon: <Brain className="w-5 h-5 text-indigo-400" />,
    imageUrl: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=800&q=80',
    baseScore: 8450,
  },
  {
    id: 'micro-habit',
    number: '03',
    nameZh: '微习惯设计师',
    nameEn: 'Habit Loop & Choice Architecture',
    category: '行为工程',
    difficulty: 'Easy',
    description: '将宏大目标拆解为2分钟无痛微行动，巧妙配置环境提示与即时多巴胺闭环。',
    conceptLearned: '习惯回路（Habit Loop: 提示-渴求-反应-奖励）与环境选择架构',
    estimatedTime: '100秒',
    accentColor: '#14B8A6',
    bgGradient: 'from-teal-950/90 via-stone-900 to-stone-950 text-white',
    icon: <Sparkles className="w-5 h-5 text-teal-400" />,
    imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80',
    baseScore: 2900,
  },
  {
    id: 'bystander-breaker',
    number: '04',
    nameZh: '旁观者破局',
    nameEn: 'Bystander Effect & Responsibility Diffusion',
    category: '社会破局',
    difficulty: 'Hard',
    description: '在集体沉默与冷眼旁观的危急时刻，学习发出精确到人的点名指令，破除责任稀释。',
    conceptLearned: '旁观者效应（Bystander Effect）与多元无知破局指令法',
    estimatedTime: '90秒',
    accentColor: '#F97316',
    bgGradient: 'from-orange-950/90 via-stone-900 to-stone-950 text-white',
    icon: <LifeBuoy className="w-5 h-5 text-orange-400" />,
    imageUrl: 'https://images.unsplash.com/photo-1533038590840-1cde6e668a91?auto=format&fit=crop&w=800&q=80',
    baseScore: 3800,
  },
];

interface ArenaHorizontalAccordionProps {
  difficulty?: GameDifficulty;
  className?: string;
}

export const ArenaHorizontalAccordion: React.FC<ArenaHorizontalAccordionProps> = ({
  difficulty = 'Medium',
  className = '',
}) => {
  const navigate = useNavigate();
  const { user } = useApp();

  const [activeSet, setActiveSet] = useState<'featured' | 'decision' | 'neural'>('featured');

  const getSetItems = (set: 'featured' | 'decision' | 'neural') => {
    switch (set) {
      case 'decision':
        return ARENA_DECISION_GAMES;
      case 'neural':
        return ARENA_NEURAL_GAMES;
      case 'featured':
      default:
        return ARENA_FEATURED_GAMES;
    }
  };

  const currentItems = getSetItems(activeSet);

  // Active expanded item: null means all are equal narrow strips ("默认等宽窄条")
  const [activeId, setActiveId] = useState<string | null>(() => currentItems[0]?.id || null);

  // Staggered reveal state for content delay ("内容延迟淡入")
  const [contentRevealed, setContentRevealed] = useState<boolean>(true);
  const revealTimerRef = useRef<number | null>(null);

  const handleItemClick = (id: string) => {
    gameAudio.playTap();
    if (activeId === id) {
      // Toggle off to show all equal narrow bars
      setActiveId(null);
      setContentRevealed(false);
      return;
    }

    setContentRevealed(false);
    setActiveId(id);

    if (revealTimerRef.current) {
      window.clearTimeout(revealTimerRef.current);
    }

    // 180ms delay for content fade-in
    revealTimerRef.current = window.setTimeout(() => {
      setContentRevealed(true);
    }, 180);
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIdx = (index + 1) % currentItems.length;
      handleItemClick(currentItems[nextIdx].id);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIdx = (index - 1 + currentItems.length) % currentItems.length;
      handleItemClick(currentItems[prevIdx].id);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleItemClick(currentItems[index].id);
    }
  };

  const handleResetEqual = () => {
    gameAudio.playTap();
    setActiveId(null);
    setContentRevealed(false);
  };

  useEffect(() => {
    if (currentItems.length > 0) {
      setActiveId(currentItems[0].id);
      setContentRevealed(false);
      const timer = window.setTimeout(() => setContentRevealed(true), 180);
      return () => window.clearTimeout(timer);
    }
  }, [activeSet]);

  useEffect(() => {
    return () => {
      if (revealTimerRef.current) {
        window.clearTimeout(revealTimerRef.current);
      }
    };
  }, []);

  return (
    <section
      className={`rounded-3xl p-5 sm:p-7 md:p-8 space-y-5 bg-gradient-to-b from-[#141527] to-[#1B1A38] text-white border border-stone-800 shadow-xl overflow-hidden ${className}`}
    >
      {/* 1. Header Bar with Arena HUD Styling & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 font-bold">
              <Gamepad2 className="w-3.5 h-3.5 text-indigo-400" />
              ARENA HORIZONTAL ACCORDION
            </span>
            <span className="text-stone-600" aria-hidden="true">/</span>
            <span className="text-amber-300 font-sans font-bold">
              实验对决横向手风琴
            </span>
          </div>

          <h3 className="font-serif-editorial text-lg sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>心理学实验博弈全景展廊</span>
          </h3>
          <p className="text-xs text-stone-300/80 leading-relaxed max-w-xl">
            横向手风琴交互 · 默认等宽窄条 · 点击展开变宽并延迟淡入详情，其余同步收窄。
          </p>
        </div>

        {/* Set Selector Tabs & Equal Width Toggle */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-center shrink-0">
          <div className="flex items-center gap-1 p-1 bg-stone-900/90 rounded-xl border border-stone-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                gameAudio.playTap();
                setActiveSet('featured');
              }}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeSet === 'featured'
                  ? 'bg-amber-400 text-stone-950 font-bold shadow-xs'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800'
              }`}
            >
              必玩 5 大实验
            </button>
            <button
              type="button"
              onClick={() => {
                gameAudio.playTap();
                setActiveSet('decision');
              }}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeSet === 'decision'
                  ? 'bg-amber-400 text-stone-950 font-bold shadow-xs'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800'
              }`}
            >
              决策与博弈
            </button>
            <button
              type="button"
              onClick={() => {
                gameAudio.playTap();
                setActiveSet('neural');
              }}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeSet === 'neural'
                  ? 'bg-amber-400 text-stone-950 font-bold shadow-xs'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800'
              }`}
            >
              神经注意力
            </button>
          </div>

          <button
            type="button"
            onClick={handleResetEqual}
            title="全部恢复等宽窄条"
            className={`p-2 rounded-xl border text-xs font-medium transition-colors cursor-pointer flex items-center gap-1 ${
              activeId === null
                ? 'bg-amber-400 text-stone-950 border-amber-400 font-bold'
                : 'bg-stone-900 hover:bg-stone-800 text-stone-300 border-stone-800'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">等宽</span>
          </button>
        </div>
      </div>

      {/* 2. Horizontal Accordion Rail (竞技场横向手风琴主轨道) */}
      <div className="relative w-full h-[470px] sm:h-[500px] md:h-[530px] rounded-2xl bg-stone-950 p-2 sm:p-2.5 overflow-hidden flex flex-row gap-2 sm:gap-2.5 shadow-2xl border border-stone-800/90">
        {currentItems.map((item, index) => {
          const isCurrentActive = activeId === item.id;
          const isNoneActive = activeId === null;
          const userHighScore = user?.gameHighScores?.[item.id] || item.baseScore;
          const isCompleted = user?.completedGames?.includes(item.id);

          return (
            <div
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              tabIndex={0}
              role="button"
              aria-expanded={isCurrentActive}
              aria-label={`${item.nameZh} - ${isCurrentActive ? '已展开' : '点击展开'}`}
              className={`relative rounded-xl overflow-hidden cursor-pointer select-none transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                isNoneActive
                  ? 'flex-1 hover:flex-[1.2]' // All equal narrow bars by default
                  : isCurrentActive
                  ? 'flex-[4.5] sm:flex-[5] cursor-default' // Expanded wide item
                  : 'flex-1 min-w-[50px] sm:min-w-[62px] opacity-75 hover:opacity-100 hover:flex-[1.2]' // Remaining narrow strips
              }`}
            >
              {/* Background Photo & Glowing HUD Layer */}
              <div className="absolute inset-0 z-0">
                <img
                  src={item.imageUrl}
                  alt={item.nameZh}
                  referrerPolicy="no-referrer"
                  className={`w-full h-full object-cover transition-transform duration-700 ${
                    isCurrentActive ? 'scale-105' : 'scale-100 grayscale contrast-125'
                  }`}
                />
                <div
                  className={`absolute inset-0 bg-gradient-to-t ${item.bgGradient} transition-opacity duration-500 ${
                    isCurrentActive ? 'opacity-92' : 'opacity-95'
                  }`}
                />
              </div>

              {/* Accent Left Stripe with Glow */}
              <div
                className="absolute left-0 top-0 bottom-0 w-1 sm:w-1.5 z-20 transition-all duration-300"
                style={{
                  backgroundColor: item.accentColor,
                  boxShadow: isCurrentActive ? `0 0 16px ${item.accentColor}` : 'none',
                }}
              />

              {/* ============================================================
                  CASE A: NARROW STRIP VIEW (收窄状态下的立柱脊骨排版)
                  ============================================================ */}
              {!isCurrentActive && (
                <div className="relative z-10 w-full h-full flex flex-col justify-between items-center py-5 sm:py-6 px-1 text-center font-numeric">
                  {/* Top: Serial Number & Completion Dot */}
                  <div className="flex flex-col items-center gap-1.5">
                    <span className="text-[11px] font-mono tracking-widest text-stone-400 font-bold">
                      {item.number}
                    </span>
                    {isCompleted ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-xs" title="已通关" />
                    ) : (
                      <div className="w-2 h-0.5 rounded-full bg-stone-700" />
                    )}
                  </div>

                  {/* Middle: Rotated Vertical Spine Title */}
                  <div className="flex-1 flex items-center justify-center my-4 overflow-hidden">
                    <span
                      className="font-serif-editorial text-xs sm:text-sm font-bold text-stone-200 tracking-wider whitespace-nowrap"
                      style={{
                        writingMode: 'vertical-rl',
                        textOrientation: 'mixed',
                        letterSpacing: '0.15em',
                      }}
                    >
                      {item.nameZh}
                    </span>
                  </div>

                  {/* Bottom: Icon & Action Prompt */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white backdrop-blur-xs border border-white/10">
                      {item.icon}
                    </div>
                    <span className="text-[9px] font-mono text-stone-400 uppercase tracking-tighter">
                      EXPAND
                    </span>
                  </div>
                </div>
              )}

              {/* ============================================================
                  CASE B: EXPANDED WIDE VIEW (展开变宽并延迟淡入详情)
                  ============================================================ */}
              {isCurrentActive && (
                <div className="relative z-10 w-full h-full flex flex-col justify-between p-5 sm:p-7 md:p-8 overflow-y-auto no-scrollbar font-numeric">
                  {/* Top Row: Meta Kickers & Header */}
                  <div
                    className={`transition-all duration-500 ease-out space-y-2 ${
                      contentRevealed
                        ? 'opacity-100 translate-y-0'
                        : 'opacity-0 translate-y-2'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono font-bold text-amber-400 tracking-widest">
                          EXPERIMENT #{item.number}
                        </span>
                        <span className="text-stone-500" aria-hidden="true">/</span>
                        <span className="text-[11px] font-semibold text-stone-300">
                          {item.category}
                        </span>
                        <span className="text-stone-500" aria-hidden="true">/</span>
                        <span className="flex items-center gap-1 text-[11px] text-stone-300">
                          <Clock className="w-3 h-3 text-stone-400" />
                          <span>约 {item.estimatedTime}</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-stone-200 border border-white/15 text-[10.5px] font-semibold">
                          难度: {item.difficulty}
                        </span>
                        {isCompleted && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10.5px] font-bold">
                            <CheckCircle2 className="w-3 h-3" />
                            已通关
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Headline and English Name */}
                    <div>
                      <h4 className="font-serif-editorial text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
                        <span>{item.nameZh}</span>
                        <span className="text-xs sm:text-sm font-sans font-medium text-stone-400 hidden sm:inline">
                          ({item.nameEn})
                        </span>
                      </h4>
                    </div>
                  </div>

                  {/* Middle: Delayed Fade-in Details & Psychological Mechanism */}
                  <div
                    className={`transition-all duration-500 ease-out delay-100 my-4 space-y-3.5 max-w-2xl ${
                      contentRevealed
                        ? 'opacity-100 translate-y-0'
                        : 'opacity-0 translate-y-3'
                    }`}
                  >
                    {/* Mission Description */}
                    <p className="text-xs sm:text-sm text-stone-200 leading-relaxed font-sans">
                      {item.description}
                    </p>

                    {/* Psychological Concept Card */}
                    <div className="p-3.5 rounded-xl bg-stone-900/80 border border-stone-800 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-amber-300 font-bold">
                        <Brain className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>核心认知原理与学习目标 (Cognitive Heuristics)：</span>
                      </div>
                      <p className="text-xs text-stone-300 leading-relaxed font-sans pl-5">
                        {item.conceptLearned}
                      </p>
                    </div>

                    {/* Arena Reward & High Score Pill Row */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 space-y-0.5">
                        <span className="text-[10px] text-stone-400 block">个人最佳记录</span>
                        <span className="text-sm font-bold text-amber-300 flex items-center gap-1">
                          <Trophy className="w-3.5 h-3.5 text-amber-400" />
                          {userHighScore.toLocaleString()} 分
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 space-y-0.5">
                        <span className="text-[10px] text-stone-400 block">通关经验奖励</span>
                        <span className="text-sm font-bold text-indigo-300 flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5 text-indigo-400" />
                          +45 XP
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 space-y-0.5 col-span-2 sm:col-span-1">
                        <span className="text-[10px] text-stone-400 block">当前全局难度</span>
                        <span className="text-sm font-bold text-emerald-300 flex items-center gap-1">
                          <Flame className="w-3.5 h-3.5 text-emerald-400" />
                          {difficulty} (随机出题)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Row: Direct Play Action & Collapse */}
                  <div
                    className={`transition-all duration-500 ease-out delay-150 pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 ${
                      contentRevealed
                        ? 'opacity-100 translate-y-0'
                        : 'opacity-0 translate-y-2'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          gameAudio.playTap();
                          navigate(`/game/${item.id}`);
                        }}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-stone-950 font-extrabold text-xs flex items-center gap-2 transition-transform hover:scale-[1.02] active:scale-95 cursor-pointer shadow-lg shadow-amber-500/20"
                      >
                        <Gamepad2 className="w-4 h-4 text-stone-950" />
                        <span>立即开启实验对决</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleResetEqual();
                        }}
                        className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/15 transition-colors cursor-pointer"
                      >
                        收回等宽条
                      </button>
                    </div>

                    <div className="text-[11px] font-mono text-stone-400 flex items-center gap-1">
                      <span>支持键盘 ← → 切换</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 3. Bottom Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-stone-400 font-numeric">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span>
            当前展示:{' '}
            <strong className="text-white">
              {currentItems.find((i) => i.id === activeId)?.nameZh || '全部等宽条'}
            </strong>
          </span>
          <span aria-hidden="true">·</span>
          <span>共 {currentItems.length} 款实验</span>
        </div>

        <div className="text-[11px] text-stone-500">
          点击任意实验条目平滑展开详情，其余立柱同步收窄
        </div>
      </div>
    </section>
  );
};

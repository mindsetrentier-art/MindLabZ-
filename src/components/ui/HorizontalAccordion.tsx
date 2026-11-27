import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Brain,
  Sparkles,
  ArrowRight,
  Flame,
  Target,
  Trophy,
  Zap,
  BookOpen,
  Eye,
  CheckCircle2,
  Layers,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import { gameAudio } from '../../utils/gameAudio';

export interface HorizontalAccordionItem {
  id: string;
  number: string; // e.g. "01", "02"
  title: string;
  titleEn: string;
  category: string;
  tagline: string;
  description: string;
  experimentQuote?: string;
  keyTakeaway: string;
  accentColor: string; // e.g. "#D97706"
  bgGradient: string; // Tailwind class
  icon: React.ReactNode;
  imageUrl?: string;
  actionText?: string;
  actionRoute?: string;
  stats?: { label: string; value: string };
}

export type AccordionScenario = 'laws' | 'disciplines' | 'experiments';

// 1. 核心心理学定律预设 (Core Psychology Laws)
export const LAWS_ACCORDION_ITEMS: HorizontalAccordionItem[] = [
  {
    id: 'zeigarnik-effect',
    number: '01',
    title: '蔡加尼克效应',
    titleEn: 'Zeigarnik Effect',
    category: '记忆与动机',
    tagline: '未完成的任务在脑海中持久回响',
    description:
      '未完成的工作比已完成的工作更易被大脑清晰记忆。这种内在张力促使人本能渴望闭环，也是悬念叙事与任务拖延的核心神经机制。',
    experimentQuote: '“大脑对于中断之事的执念，远甚于功成身退的圆满。” — 布卢玛·蔡加尼克',
    keyTakeaway: '运用「微小第一步」打破拖延；在工作结束时故意留一个微小未完线索，助明日迅速进入心流。',
    accentColor: '#D97706',
    bgGradient: 'from-amber-950/90 via-stone-900 to-stone-950 text-white',
    icon: <Sparkles className="w-5 h-5 text-amber-400" />,
    imageUrl: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=800&q=80',
    actionText: '研习定律详析',
    actionRoute: '/law/zeigarnik-effect',
    stats: { label: '掌握门槛', value: 'Lv.1 核心' },
  },
  {
    id: 'confirmation-bias',
    number: '02',
    title: '确认偏误',
    titleEn: 'Confirmation Bias',
    category: '理性决策',
    tagline: '人们只看见自己早已相信之物',
    description:
      '大脑倾向于主动搜寻、偏爱并铭记能佐证原有假设的证据，同时轻率忽视乃至曲解相反的事实，这是理性讨论与科学探索的最大心智盲区。',
    experimentQuote: '“没有什么比自欺欺人更容易的了，因为人总是相信自己所渴望的。” — 德摩斯梯尼',
    keyTakeaway: '定期担任自己的反方辩友（Red Teaming），主动列出至少 3 条推翻当前判断的反例。',
    accentColor: '#4F46E5',
    bgGradient: 'from-indigo-950/95 via-stone-900 to-stone-950 text-white',
    icon: <Brain className="w-5 h-5 text-indigo-400" />,
    imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80',
    actionText: '开启去偏实验',
    actionRoute: '/game/mind-detective',
    stats: { label: '偏差纠正度', value: '88% 有效' },
  },
  {
    id: 'anchoring-effect',
    number: '03',
    title: '锚定效应',
    titleEn: 'Anchoring Effect',
    category: '行为经济学',
    tagline: '第一眼的信息铸成了无法自拔的锚',
    description:
      '面对未知估值时，大脑过度依赖接收到的第一条信息（哪怕该数字完全荒谬且无关），以此为锚进行不充分的调整，主导后续全部谈判与决策。',
    experimentQuote: '“思考的第一步一旦被定格，后续每一步都只是在锚的半径内打转。” — 丹尼尔·卡尼曼',
    keyTakeaway: '在谈判或定价前，先建立独立的客观价值坐标系，抵御对方首先抛出的锚定数字。',
    accentColor: '#059669',
    bgGradient: 'from-emerald-950/90 via-stone-900 to-stone-950 text-white',
    icon: <Target className="w-5 h-5 text-emerald-400" />,
    imageUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=800&q=80',
    actionText: '体验锚定实验',
    actionRoute: '/game/anchoring-lab',
    stats: { label: '影响深度', value: '全球认知广泛存在' },
  },
  {
    id: 'loss-aversion',
    number: '04',
    title: '损失厌恶',
    titleEn: 'Loss Aversion',
    category: '神经认知',
    tagline: '损失之痛两倍于同等所得之乐',
    description:
      '失去 100 元所带来的负面心理刺痛，大约需要赚取 200 到 250 元的正向愉悦才能勉强抵消。这种不对称使得人们在面临潜在损失时极其非理性。',
    experimentQuote: '“损失就像一根针，刺痛的感觉往往胜过手捧蜜糖的甜蜜。” — 阿莫斯·特沃斯基',
    keyTakeaway: '重新定义框架：将“可能蒙受的损失”转换为“为获取确定真相而支付的探索门票”。',
    accentColor: '#DC2626',
    bgGradient: 'from-rose-950/90 via-stone-900 to-stone-950 text-white',
    icon: <Flame className="w-5 h-5 text-rose-400" />,
    imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80',
    actionText: '进入损失博弈',
    actionRoute: '/game/mind-trap',
    stats: { label: '不对称系数', value: '2.1 ~ 2.5x' },
  },
  {
    id: 'peak-end-rule',
    number: '05',
    title: '峰终定律',
    titleEn: 'Peak-End Rule',
    category: '体验神经学',
    tagline: '记忆只由最极致的高潮与结尾裁决',
    description:
      '人类对一段经历的回忆评判，并不取决于过程的总时间长短，而是几乎完全由过程中的“峰值体验（最好或最差）”以及“终局结局”决定。',
    experimentQuote: '“持续一小时的平凡体验，在记忆的长河中远不如最后五分钟的温存明艳。”',
    keyTakeaway: '设计会议、演讲或日常工作时，在最后 5% 的时间策划一个高质感的精彩结尾。',
    accentColor: '#9333EA',
    bgGradient: 'from-purple-950/90 via-stone-900 to-stone-950 text-white',
    icon: <Trophy className="w-5 h-5 text-purple-400" />,
    imageUrl: 'https://images.unsplash.com/photo-1518173946687-a4c8a383392e?auto=format&fit=crop&w=800&q=80',
    actionText: '研习体验架构',
    actionRoute: '/law/peak-end-rule',
    stats: { label: '记忆权重大于', value: '75%' },
  },
];

// 2. 大脑五维训练预设 (Cognitive Disciplines)
export const DISCIPLINES_ACCORDION_ITEMS: HorizontalAccordionItem[] = [
  {
    id: 'working-memory',
    number: '01',
    title: '空间工作记忆',
    titleEn: 'Spatial Working Memory',
    category: '大脑核心',
    tagline: '大脑的信息暂存台与认知运算核心',
    description:
      '前额叶皮层对短时信息的暂存与多线程重组能力，直接决定了复杂逻辑推演、数学运算与多任务执行的带宽上限。',
    keyTakeaway: '运用视觉组块（Chunking）与记忆宫殿技术，将抽象符号具象化为空间节点。',
    accentColor: '#6366F1',
    bgGradient: 'from-indigo-950/90 via-stone-900 to-stone-950 text-white',
    icon: <Brain className="w-5 h-5 text-indigo-400" />,
    imageUrl: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=800&q=80',
    actionText: '进入记忆宫殿实验室',
    actionRoute: '/game/memory-lab',
    stats: { label: '训练带宽', value: '7±2 组块' },
  },
  {
    id: 'attention-focus',
    number: '02',
    title: '专注与抗干扰',
    titleEn: 'Focused Attention & Inhibition',
    category: '执行控制',
    tagline: '抑制本能直觉冲动的心智刹车系统',
    description:
      '前扣带回负责过滤感官杂音与自动反应。斯特鲁普效应正是通过颜色与词义的冲突，测试并锻炼大脑高级抑制控制力。',
    keyTakeaway: '在关键心流时段屏蔽环境微小刺激，锻炼对自动化念头的觉察与刹车。',
    accentColor: '#10B981',
    bgGradient: 'from-emerald-950/90 via-stone-900 to-stone-950 text-white',
    icon: <Zap className="w-5 h-5 text-emerald-400" />,
    imageUrl: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&w=800&q=80',
    actionText: '测试斯特鲁普抗扰',
    actionRoute: '/game/brain-rush',
    stats: { label: '神经响应', value: '<450ms' },
  },
  {
    id: 'critical-reasoning',
    number: '03',
    title: '批判与证伪反思',
    titleEn: 'Critical Falsification',
    category: '元认知',
    tagline: '寻找黑天鹅以摧毁脆弱的假说',
    description:
      '卡尔·波普尔证伪主义精髓：科学并非证明万物皆白，而是具备推翻自己的勇气。通过四卡片选择实验锻炼批判思考力。',
    keyTakeaway: '永远问自己：“什么样的新证据一旦出现，就能彻底证明我是错的？”',
    accentColor: '#F59E0B',
    bgGradient: 'from-amber-950/90 via-stone-900 to-stone-950 text-white',
    icon: <BookOpen className="w-5 h-5 text-amber-400" />,
    imageUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80',
    actionText: '四卡片证伪挑战',
    actionRoute: '/game/falsification-challenge',
    stats: { label: '通过率', value: '普通人群仅 10%' },
  },
  {
    id: 'speed-agility',
    number: '04',
    title: '敏捷神经反应',
    titleEn: 'Neural Processing Speed',
    category: '神经感知',
    tagline: '毫秒级感知决策与眼脑协同',
    description:
      '视觉信号经由视网膜神经节细胞到达枕叶视皮层，再传递至运动皮层做出行动，是衡量大脑生理年轻度与警觉度的金标准。',
    keyTakeaway: '通过高频短时刺激训练神经突触传导效率，提升应对突发状况的敏锐度。',
    accentColor: '#EC4899',
    bgGradient: 'from-pink-950/90 via-stone-900 to-stone-950 text-white',
    icon: <Target className="w-5 h-5 text-pink-400" />,
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    actionText: '第一眼判断实验',
    actionRoute: '/game/first-impression',
    stats: { label: '前沿速度', value: '250ms ~ 320ms' },
  },
];

// 3. 心理学里程碑实验预设 (Pioneering Experiments)
export const EXPERIMENTS_ACCORDION_ITEMS: HorizontalAccordionItem[] = [
  {
    id: 'skinner-box',
    number: '01',
    title: '斯金纳操作条件反射',
    titleEn: 'Operant Conditioning Chamber',
    category: '行为心理学',
    tagline: '可变比率奖励：现代成瘾算法的源头',
    description:
      '当鸽子按下操纵杆获得的食物奖励是不确定的（随机间歇强化）时，其行为频率达到极致且最难消退，这是老虎机与信息流下拉刷新的神经机制。',
    experimentQuote: '“教育是当所学的一切都被遗忘后，剩下的东西。” — B.F. 斯金纳',
    keyTakeaway: '戒除手机刷屏惯性：将无序随机的通知转化为固定时间段批量处理。',
    accentColor: '#3B82F6',
    bgGradient: 'from-blue-950/90 via-stone-900 to-stone-950 text-white',
    icon: <Layers className="w-5 h-5 text-blue-400" />,
    imageUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80',
    actionText: '进入微习惯实验',
    actionRoute: '/game/micro-habit',
    stats: { label: '行为强化率', value: '最高强度' },
  },
  {
    id: 'asch-conformity',
    number: '02',
    title: '阿希从众实验',
    titleEn: 'Asch Conformity Experiment',
    category: '社会心理学',
    tagline: '群体压力下，肉眼可见的线段长短也会被推翻',
    description:
      '面对毫无悬念的线段比对，当群体中所有演员都一致给出荒谬错误答案时，超过 75% 的真实受试者至少妥协了一次，甚至怀疑自己的眼睛。',
    experimentQuote: '“顺从的力量在于让理性的人在公开场合放弃自己的判断。” — 所罗门·阿希',
    keyTakeaway: '在重要决策会议中，推行“匿名投票”与“先发言者随机化”，免受群体极化霸凌。',
    accentColor: '#14B8A6',
    bgGradient: 'from-teal-950/90 via-stone-900 to-stone-950 text-white',
    icon: <Eye className="w-5 h-5 text-teal-400" />,
    imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
    actionText: '破除多数人从众',
    actionRoute: '/game/majority-answer',
    stats: { label: '从众发生率', value: '75% 至少 1 次' },
  },
  {
    id: 'marshmallow-test',
    number: '03',
    title: '斯坦福棉花糖实验',
    titleEn: 'Stanford Marshmallow Experiment',
    category: '发展与自控',
    tagline: '延迟满足：热心智冲动与冷心智反思的博弈',
    description:
      '面对当下的即时满足与等待 15 分钟后的双倍回报，能够通过转移注意力自控的儿童，在后续数十年的学业、健康与财富积累中展现出显著优势。',
    experimentQuote: '“自控力不是用意志力死磕，而是巧妙地改变心智表征。” — 沃尔特·米歇尔',
    keyTakeaway: '不要用意志硬抗诱惑：通过物理隔离或将诱惑重新表征为虚幻画面降低冲动。',
    accentColor: '#F97316',
    bgGradient: 'from-orange-950/90 via-stone-900 to-stone-950 text-white',
    icon: <Sparkles className="w-5 h-5 text-orange-400" />,
    imageUrl: 'https://images.unsplash.com/photo-1533038590840-1cde6e668a91?auto=format&fit=crop&w=800&q=80',
    actionText: '体验认知控制',
    actionRoute: '/quiz',
    stats: { label: '纵向追踪', value: '40 年跟踪研究' },
  },
];

interface HorizontalAccordionProps {
  items?: HorizontalAccordionItem[];
  defaultActiveId?: string;
  scenario?: AccordionScenario;
  showScenarioTabs?: boolean;
  className?: string;
  title?: string;
  subtitle?: string;
}

export const HorizontalAccordion: React.FC<HorizontalAccordionProps> = ({
  items: propItems,
  defaultActiveId,
  scenario: initialScenario = 'laws',
  showScenarioTabs = true,
  className = '',
  title = '心智定律与认知演进展廊',
  subtitle = '横向手风琴交互 · 默认等宽窄条 · 点击展开变宽并延迟淡入详情',
}) => {
  const navigate = useNavigate();
  const [scenario, setScenario] = useState<AccordionScenario>(initialScenario);

  // Active items determined by current scenario if propItems not custom
  const getScenarioItems = (sc: AccordionScenario) => {
    switch (sc) {
      case 'disciplines':
        return DISCIPLINES_ACCORDION_ITEMS;
      case 'experiments':
        return EXPERIMENTS_ACCORDION_ITEMS;
      case 'laws':
      default:
        return LAWS_ACCORDION_ITEMS;
    }
  };

  const currentItems = propItems || getScenarioItems(scenario);

  // Active item ID (if null, all are equal narrow width)
  const [activeId, setActiveId] = useState<string | null>(() => {
    if (defaultActiveId) return defaultActiveId;
    return currentItems[0]?.id || null;
  });

  // Staggered reveal state for inner content delay
  const [contentRevealed, setContentRevealed] = useState<boolean>(true);
  const revealTimerRef = useRef<number | null>(null);

  // Whenever active item changes, trigger a smooth delayed fade-in
  const handleItemClick = (id: string) => {
    gameAudio.playTap();
    if (activeId === id) {
      // Toggle off to show all equal narrow strips
      setActiveId(null);
      setContentRevealed(false);
      return;
    }

    // Set new active and trigger delayed content fade-in
    setContentRevealed(false);
    setActiveId(id);

    if (revealTimerRef.current) {
      window.clearTimeout(revealTimerRef.current);
    }

    // Delay content appearance so strip expansion completes smoothly first
    revealTimerRef.current = window.setTimeout(() => {
      setContentRevealed(true);
    }, 180);
  };

  // Keyboard navigation
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

  // Reset to all equal strips
  const handleResetEqual = () => {
    gameAudio.playTap();
    setActiveId(null);
    setContentRevealed(false);
  };

  useEffect(() => {
    // When scenario changes, default select first item
    if (currentItems.length > 0) {
      setActiveId(currentItems[0].id);
      setContentRevealed(false);
      const timer = window.setTimeout(() => setContentRevealed(true), 180);
      return () => window.clearTimeout(timer);
    }
  }, [scenario]);

  useEffect(() => {
    return () => {
      if (revealTimerRef.current) {
        window.clearTimeout(revealTimerRef.current);
      }
    };
  }, []);

  return (
    <section
      className={`editorial-card rounded-3xl p-5 sm:p-7 md:p-9 space-y-6 bg-white border border-stone-200/90 shadow-sm ${className}`}
    >
      {/* 1. Header with Editorial Kicker & Scenario Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200/80">
        <div>
          <span className="editorial-kicker text-[10px] text-amber-700 font-bold tracking-widest block mb-0.5">
            HORIZONTAL ACCORDION COMPONENT · 横向手风琴交互展廊
          </span>
          <h3 className="font-serif-editorial text-lg sm:text-2xl font-bold text-stone-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-600" />
            <span>{title}</span>
          </h3>
          <p className="text-xs text-stone-500 mt-1 leading-relaxed max-w-xl">
            {subtitle}
          </p>
        </div>

        {/* Action Controls & Scenario Tabs */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-center shrink-0">
          {showScenarioTabs && (
            <div className="flex items-center gap-1 p-1 bg-[#F2EEE6] rounded-xl border border-stone-200/80 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  gameAudio.playTap();
                  setScenario('laws');
                }}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  scenario === 'laws'
                    ? 'luxury-dark-btn'
                    : 'text-[#57514A] hover:text-[#181411] hover:bg-white/70'
                }`}
              >
                经典定律
              </button>
              <button
                type="button"
                onClick={() => {
                  gameAudio.playTap();
                  setScenario('disciplines');
                }}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  scenario === 'disciplines'
                    ? 'luxury-dark-btn'
                    : 'text-[#57514A] hover:text-[#181411] hover:bg-white/70'
                }`}
              >
                五维脑力
              </button>
              <button
                type="button"
                onClick={() => {
                  gameAudio.playTap();
                  setScenario('experiments');
                }}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  scenario === 'experiments'
                    ? 'luxury-dark-btn'
                    : 'text-[#57514A] hover:text-[#181411] hover:bg-white/70'
                }`}
              >
                名家实验
              </button>
            </div>
          )}

          {/* Equal Width Reset Button */}
          <button
            type="button"
            onClick={handleResetEqual}
            title="全部恢复等宽窄条"
            className={`p-2 rounded-xl border text-xs font-medium cursor-pointer flex items-center gap-1 ${
              activeId === null
                ? 'luxury-dark-btn'
                : 'luxury-surface-btn'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">等宽</span>
          </button>
        </div>
      </div>

      {/* 2. Horizontal Accordion Container (横向手风琴主轨道) */}
      <div className="relative w-full h-[460px] sm:h-[490px] md:h-[520px] rounded-2xl bg-stone-950 p-2 sm:p-2.5 overflow-hidden flex flex-row gap-2 sm:gap-2.5 shadow-xl border border-stone-800">
        {currentItems.map((item, index) => {
          const isCurrentActive = activeId === item.id;
          const isNoneActive = activeId === null;

          return (
            <div
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              tabIndex={0}
              role="button"
              aria-expanded={isCurrentActive}
              aria-label={`${item.title} - ${isCurrentActive ? '已展开' : '点击展开'}`}
              className={`relative rounded-xl overflow-hidden cursor-pointer select-none transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                isNoneActive
                  ? 'flex-1 hover:flex-[1.2]' // All equal narrow bars by default
                  : isCurrentActive
                  ? 'flex-[4.5] sm:flex-[5] cursor-default' // Expanded wide item
                  : 'flex-1 min-w-[52px] sm:min-w-[64px] opacity-75 hover:opacity-100 hover:flex-[1.2]' // Remaining narrow strips
              }`}
            >
              {/* Background Photo & Atmospheric Gradient */}
              <div className="absolute inset-0 z-0">
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className={`w-full h-full object-cover transition-transform duration-700 ${
                      isCurrentActive ? 'scale-105' : 'scale-100 grayscale contrast-125'
                    }`}
                  />
                )}
                {/* Deep Editorial Tint Layer */}
                <div
                  className={`absolute inset-0 bg-gradient-to-t ${item.bgGradient} transition-opacity duration-500 ${
                    isCurrentActive ? 'opacity-92' : 'opacity-95'
                  }`}
                />
              </div>

              {/* Accent Colored Left Stripe */}
              <div
                className="absolute left-0 top-0 bottom-0 w-1 sm:w-1.5 z-20 transition-all duration-300"
                style={{
                  backgroundColor: item.accentColor,
                  boxShadow: isCurrentActive ? `0 0 16px ${item.accentColor}` : 'none',
                }}
              />

              {/* ============================================================
                  CASE A: NARROW STRIP VIEW (收窄状态下的垂直脊骨排版)
                  ============================================================ */}
              {!isCurrentActive && (
                <div className="relative z-10 w-full h-full flex flex-col justify-between items-center py-5 sm:py-6 px-1 text-center font-numeric">
                  {/* Top: Serial Number */}
                  <div className="flex flex-col items-center gap-1.5">
                    <span className="text-[11px] font-mono tracking-widest text-stone-400 font-bold">
                      {item.number}
                    </span>
                    <div className="w-2 h-0.5 rounded-full bg-stone-600" />
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
                      {item.title}
                    </span>
                  </div>

                  {/* Bottom: Icon & Subtle Indicator */}
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
                  CASE B: EXPANDED WIDE VIEW (展开变宽并延迟淡入内容)
                  ============================================================ */}
              {isCurrentActive && (
                <div className="relative z-10 w-full h-full flex flex-col justify-between p-5 sm:p-7 md:p-8 overflow-y-auto no-scrollbar">
                  {/* Top Row: Meta Kicker, Title, Serial Number */}
                  <div
                    className={`transition-all duration-500 ease-out space-y-2.5 ${
                      contentRevealed
                        ? 'opacity-100 translate-y-0'
                        : 'opacity-0 translate-y-2'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono font-bold text-amber-400 tracking-widest">
                          ENTRY {item.number}
                        </span>
                        <span className="text-stone-500" aria-hidden="true">
                          /
                        </span>
                        <span className="text-[11px] font-semibold text-stone-300">
                          {item.category}
                        </span>
                      </div>

                      {item.stats && (
                        <div className="px-2.5 py-1 rounded-full bg-white/10 text-stone-200 border border-white/15 text-[11px] font-numeric font-medium backdrop-blur-xs">
                          {item.stats.label}:{' '}
                          <strong className="text-white font-bold">{item.stats.value}</strong>
                        </div>
                      )}
                    </div>

                    {/* Headline and English Subtitle */}
                    <div>
                      <h4 className="font-serif-editorial text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
                        <span>{item.title}</span>
                        <span className="text-sm font-sans font-medium text-stone-400 hidden sm:inline">
                          ({item.titleEn})
                        </span>
                      </h4>
                      <p className="text-sm font-medium text-amber-300/90 mt-1 font-serif-editorial italic">
                        “{item.tagline}”
                      </p>
                    </div>
                  </div>

                  {/* Middle Content: Delayed Fade-in Details */}
                  <div
                    className={`transition-all duration-500 ease-out delay-100 my-4 space-y-4 max-w-2xl ${
                      contentRevealed
                        ? 'opacity-100 translate-y-0'
                        : 'opacity-0 translate-y-3'
                    }`}
                  >
                    {/* Detailed Explanation */}
                    <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
                      {item.description}
                    </p>

                    {/* Famous Quote or Experiment Statement */}
                    {item.experimentQuote && (
                      <div className="p-3 sm:p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs text-xs sm:text-sm text-stone-200 italic font-serif-editorial border-l-2 border-l-amber-400">
                        {item.experimentQuote}
                      </div>
                    )}

                    {/* Core Practical Takeaway */}
                    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-stone-900/80 border border-stone-800 text-xs text-stone-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-white block mb-0.5">
                          心智应用策略 (Actionable Takeaway)：
                        </span>
                        <p className="text-stone-300 leading-relaxed">{item.keyTakeaway}</p>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Row: Direct Action Trigger & Switch Hint */}
                  <div
                    className={`transition-all duration-500 ease-out delay-150 pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 ${
                      contentRevealed
                        ? 'opacity-100 translate-y-0'
                        : 'opacity-0 translate-y-2'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {item.actionRoute && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            gameAudio.playTap();
                            navigate(item.actionRoute!);
                          }}
                          className="px-4 py-2 rounded-xl text-[#181411] font-bold text-xs flex items-center gap-1.5 transition-all hover:brightness-105 active:scale-95 cursor-pointer"
                          style={{
                            background: 'linear-gradient(135deg, #F0D28E 0%, #C8933B 100%)',
                            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.45), 0 6px 16px -4px rgba(212,166,86,0.4)',
                          }}
                        >
                          <span>{item.actionText || '立即探索'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleResetEqual();
                        }}
                        className="luxury-ghost-dark-btn px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                      >
                        收回为等宽条
                      </button>
                    </div>

                    <div className="text-[11px] font-mono text-stone-400 flex items-center gap-1">
                      <span>键盘方向键 ← → 切换条目</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 3. Bottom Indicator & Legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#6E675F] pt-1 font-numeric">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#157F5D]" />
          <span>当前展示: {currentItems.find((i) => i.id === activeId)?.title || '全部等宽条'}</span>
          <span aria-hidden="true">·</span>
          <span>共 {currentItems.length} 个条目</span>
        </div>

        <div className="flex items-center gap-1.5 text-stone-400">
          <span>点击任一窄条平滑展开，其余自动收窄</span>
        </div>
      </div>
    </section>
  );
};

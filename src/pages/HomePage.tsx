import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Flame,
  Play,
  Trophy,
  ArrowRight,
  BookOpen,
  Brain,
  Zap,
  HelpCircle,
  Target,
  CheckCircle2,
  PenLine,
  Feather,
  Plus,
  Layers,
  Wind,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MasteryRing } from '../components/ui/MasteryRing';
import { PsychologyLawCard } from '../components/cards/PsychologyLawCard';
import { GameCard } from '../components/cards/GameCard';
import { Skeleton, HomeHeroSkeleton, LawCardSkeleton, GameCardSkeleton } from '../components/ui/Skeleton';
import { PSYCHOLOGY_GAMES } from '../data/games';
import { OverlappingStack } from '../components/ui/OverlappingStack';
import {
  OverlappingStackLabModal,
  THINKER_ITEMS,
  MENTAL_MODEL_ITEMS,
} from '../components/ui/OverlappingStackLabModal';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const {
    user,
    laws,
    isDailyChallengeCompleted,
    setAiTutorOpen,
    journals,
    openComposerWithPreload,
    setBreathingOpen,
  } = useApp();
  const [isLoading, setIsLoading] = useState(true);
  const [isStackLabOpen, setIsStackLabOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  // Average mastery percentage across laws
  const masteryValues = Object.values(user.lawMasteryMap) as number[];
  const avgMastery = masteryValues.length > 0
    ? Math.round(masteryValues.reduce((a: number, b: number) => a + b, 0) / laws.length)
    : 35;

  // Featured Law of the Day (e.g. Zeigarnik Effect or random)
  const featuredLaw = laws.find(l => l.id === 'zeigarnik-effect') || laws[0];

  // Latest Journal Entry
  const latestJournal = journals && journals.length > 0 ? journals[0] : null;
  const todayIso = new Date().toISOString().split('T')[0];
  const hasLoggedToday = journals?.some((j) => j.date === todayIso);

  if (isLoading) {
    return (
      <div className="space-y-6 pb-6 animate-fadeIn">
        <HomeHeroSkeleton />
        <div className="grid grid-cols-2 gap-3.5">
          <Skeleton variant="card" className="min-h-[135px]" />
          <Skeleton variant="card" className="min-h-[135px]" />
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Skeleton className="w-36 h-5 rounded-lg" />
            <Skeleton className="w-20 h-4 rounded-md" />
          </div>
          <LawCardSkeleton />
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Skeleton className="w-36 h-5 rounded-lg" />
            <Skeleton className="w-16 h-4 rounded-md" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <GameCardSkeleton />
            <GameCardSkeleton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 sm:space-y-16 pb-16 animate-fadeIn">
      {/* 1. Top Editorial Lead Story / Issue Cover */}
      <section className="relative editorial-card rounded-2xl p-7 sm:p-10 md:p-12 overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 sm:gap-8 relative z-10">
          <div className="flex-1 space-y-4">
            {/* Clean Editorial Dateline & Issue Kicker */}
            <div className="flex items-center gap-2 text-xs text-stone-500 font-medium">
              <span className="editorial-kicker text-[10px] text-stone-700 tracking-widest">
                MindLabZ Review · Issue No. 100
              </span>
              <span className="text-stone-300" aria-hidden="true">/</span>
              <span className="font-serif-editorial italic text-stone-600">Cognitive Synthesis</span>
            </div>

            {/* Editorial Serif Lead Headline */}
            <h2 className="font-serif-editorial text-2xl sm:text-3xl md:text-4xl font-bold text-stone-900 tracking-tight leading-[1.2] text-balance">
              让思维摆脱直觉偏差的 <br className="hidden sm:inline" />
              10 分钟认知科学研习
            </h2>

            {/* Editorial Dek / Excerpt */}
            <p className="text-xs sm:text-sm text-stone-600 font-normal leading-relaxed max-w-xl">
              在信息碎片与直觉启发式主导的世界里，重新检视决策盲区与心智捷径。每日研习一条经典心理学定律，开启深度理性内化。
            </p>

            {/* Unboxed Metadata Line */}
            <div className="pt-1 flex items-center gap-3 text-xs text-stone-500 flex-wrap font-numeric">
              <span>连续研习 <strong className="font-semibold text-stone-900">{user.streak} 天</strong></span>
              <span className="text-stone-300" aria-hidden="true">·</span>
              <span>心智内化 <strong className="font-semibold text-stone-900">{user.lawsMastered.length} / {laws.length}</strong> 项</span>
              <span className="text-stone-300" aria-hidden="true">·</span>
              <span>累积经验 <strong className="font-semibold text-stone-900">{user.xp.toLocaleString()} XP</strong></span>
            </div>

            {/* Primary Action Button */}
            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={() => navigate('/challenge')}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 btn-tactile whitespace-nowrap ${
                  isDailyChallengeCompleted
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'chameleon-btn'
                }`}
              >
                {isDailyChallengeCompleted ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    <span>今日挑战已达成 · 报告已生成</span>
                  </>
                ) : (
                  <>
                    <Target className="w-4 h-4" />
                    <span>开启今日研习挑战 (+500 XP)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Mastery Ring Graphic (Editorial Accent) */}
          <div
            onClick={() => navigate('/progress')}
            className="cursor-pointer group shrink-0 transition-transform hover:scale-[1.02] self-start md:self-center p-4 rounded-2xl border border-stone-200/60 bg-[#FAF8F5]/80"
            title="查看完整能力图谱"
          >
            <div className="flex flex-col items-center gap-2">
              <MasteryRing percentage={avgMastery} size={116} strokeWidth={7} />
              <span className="text-[10px] font-medium text-stone-500 font-serif-editorial italic">
                Cognitive Map →
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Editorial Quad Feature Spread (Bento Columns) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
        {/* Cognitive Journal Feature */}
        <div
          onClick={() => navigate('/journal')}
          className="group editorial-card editorial-card-hover rounded-2xl p-6 sm:p-7 cursor-pointer flex flex-col justify-between min-h-[175px] bg-[#FAF8F5]/90 border-stone-300/80"
        >
          <div>
            <div className="flex justify-between items-start mb-3 text-xs">
              <span className="editorial-kicker text-[10px] text-stone-600 tracking-wider">
                Metacognition · 心智手记
              </span>
              <div className="w-8 h-8 rounded-lg bg-white border border-stone-200 flex items-center justify-center text-stone-800 group-hover:bg-stone-900 group-hover:text-white transition-colors">
                <PenLine className="w-4 h-4 stroke-[1.5]" />
              </div>
            </div>

            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-serif-editorial text-lg font-bold text-stone-900 group-hover:text-stone-700 transition-colors leading-snug">
                心智觉察手记
              </h3>
              {hasLoggedToday ? (
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-medium">
                  今日已觉察
                </span>
              ) : (
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-800 font-medium animate-pulse">
                  +50 XP
                </span>
              )}
            </div>

            <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
              CBT认知重构、情绪解离与心流复盘，沉淀为心智资产。
            </p>
          </div>

          <div className="pt-4 flex items-center text-xs font-semibold text-stone-900 group-hover:text-stone-700 gap-1 transition-colors">
            <span>{hasLoggedToday ? '查看手记流' : '撰写今日手记'}</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </div>
        </div>

        {/* Focused Breathing Feature */}
        <div
          onClick={() => setBreathingOpen(true)}
          className="group editorial-card editorial-card-hover rounded-2xl p-6 sm:p-7 cursor-pointer flex flex-col justify-between min-h-[175px] bg-[#FAF8F5]/90 border-stone-300/80"
        >
          <div>
            <div className="flex justify-between items-start mb-3 text-xs">
              <span className="editorial-kicker text-[10px] text-stone-600 tracking-wider">
                Somatic · 专注呼吸
              </span>
              <div className="w-8 h-8 rounded-lg bg-white border border-stone-200 flex items-center justify-center text-stone-800 group-hover:bg-stone-900 group-hover:text-white transition-colors">
                <Wind className="w-4 h-4 stroke-[1.5]" />
              </div>
            </div>

            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-serif-editorial text-lg font-bold text-stone-900 group-hover:text-stone-700 transition-colors leading-snug">
                专注呼吸调节
              </h3>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-100 text-indigo-800 font-medium">
                4-7-8 · 箱式
              </span>
            </div>

            <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
              柔和舒展收缩视觉节律，激活迷走神经刹车，重归平静。
            </p>
          </div>

          <div className="pt-4 flex items-center text-xs font-semibold text-stone-900 group-hover:text-stone-700 gap-1 transition-colors">
            <span>开启呼吸觉察</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </div>
        </div>

        {/* Rapid Quiz Feature */}
        <div
          onClick={() => navigate('/quiz')}
          className="group editorial-card editorial-card-hover rounded-2xl p-6 sm:p-7 cursor-pointer flex flex-col justify-between min-h-[175px]"
        >
          <div>
            <div className="flex justify-between items-start mb-3 text-xs">
              <span className="editorial-kicker text-[10px] text-stone-600 tracking-wider">
                Dialectics · 快速思辨
              </span>
              <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center text-stone-700 group-hover:bg-stone-900 group-hover:text-white transition-colors">
                <HelpCircle className="w-4 h-4 stroke-[1.5]" />
              </div>
            </div>

            <h3 className="font-serif-editorial text-lg font-bold text-stone-900 group-hover:text-stone-700 transition-colors leading-snug">
              心理快问快答
            </h3>
            <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
              10 道经典思辨问答，即时检验思维直觉与反直觉定律。
            </p>
          </div>

          <div className="pt-4 flex items-center text-xs font-semibold text-stone-900 group-hover:text-stone-700 gap-1 transition-colors">
            <span>开始速测</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </div>
        </div>

        {/* Cognitive Games Feature */}
        <div
          onClick={() => navigate('/games')}
          className="group editorial-card editorial-card-hover rounded-2xl p-6 sm:p-7 cursor-pointer flex flex-col justify-between min-h-[175px]"
        >
          <div>
            <div className="flex justify-between items-start mb-3 text-xs">
              <span className="editorial-kicker text-[10px] text-stone-600 tracking-wider">
                Laboratory · 交互实验
              </span>
              <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center text-stone-700 group-hover:bg-stone-900 group-hover:text-white transition-colors">
                <Brain className="w-4 h-4 stroke-[1.5]" />
              </div>
            </div>

            <h3 className="font-serif-editorial text-lg font-bold text-stone-900 group-hover:text-stone-700 transition-colors leading-snug">
              大脑训练竞技场
            </h3>
            <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
              5 款神经认知微实验（斯特鲁普效应、N-Back、决策偏差）。
            </p>
          </div>

          <div className="pt-4 flex items-center text-xs font-semibold text-stone-900 group-hover:text-stone-700 gap-1 transition-colors">
            <span>进入工坊</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </section>

      {/* 3. Daily Cognitive Journal Feature Section */}
      <section className="space-y-4">
        <div className="flex items-baseline justify-between pb-3 border-b border-stone-200">
          <div>
            <span className="editorial-kicker text-[10px] text-stone-500 block mb-0.5">
              01 · Daily Journal & Awareness
            </span>
            <h3 className="font-serif-editorial text-lg sm:text-xl font-bold text-stone-900 tracking-tight">
              每日心智手记与情绪觉察
            </h3>
          </div>
          <button
            onClick={() => navigate('/journal')}
            className="text-xs font-semibold text-stone-700 hover:text-stone-900 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>全部手记 ({journals.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {latestJournal ? (
          <div className="editorial-card rounded-2xl p-6 sm:p-8 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 font-medium border border-stone-200">
                  最近归档 · {latestJournal.date}
                </span>
                <span className="text-stone-500 font-serif-editorial">
                  情绪: {latestJournal.emotion.primary} (强度 {latestJournal.emotion.intensity}/10)
                </span>
              </div>
              <button
                onClick={() => openComposerWithPreload()}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-stone-900 text-white text-xs font-bold hover:bg-stone-800 transition-colors btn-tactile cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>撰写新条目 (+50 XP)</span>
              </button>
            </div>

            <h4
              onClick={() => navigate('/journal')}
              className="font-serif-editorial text-lg font-bold text-stone-900 hover:text-stone-600 transition-colors cursor-pointer"
            >
              {latestJournal.title}
            </h4>

            <p className="font-serif-editorial text-xs sm:text-sm text-stone-700 italic border-l-2 border-stone-800 pl-3 leading-relaxed line-clamp-2">
              “{latestJournal.structuredData.reframedPerspective ||
                latestJournal.structuredData.tomorrowAnchor ||
                latestJournal.structuredData.coreTakeaway ||
                Object.values(latestJournal.structuredData)[0] ||
                '已记录完整思辨觉察。'}”
            </p>
          </div>
        ) : (
          <div className="editorial-card rounded-2xl p-7 text-center space-y-4 bg-[#FAF8F5]">
            <div className="w-10 h-10 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center mx-auto text-stone-700">
              <PenLine className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <h4 className="font-serif-editorial text-base font-bold text-stone-900">
                今日情绪尚未觉察复盘
              </h4>
              <p className="text-xs text-stone-600 max-w-md mx-auto">
                记录内心的第一缕微澜，选用结构化心理学模板破除思维偏误。
              </p>
            </div>
            <button
              onClick={() => openComposerWithPreload()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900 text-white text-xs font-bold hover:bg-stone-800 transition-colors btn-tactile"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>开始今日记录 (+50 XP)</span>
            </button>
          </div>
        )}
      </section>

      {/* 3. Featured Psychology Law of the Day (Lead Column) */}
      <section className="space-y-5">
        <div className="flex items-baseline justify-between pb-3 border-b border-stone-200">
          <div>
            <span className="editorial-kicker text-[10px] text-stone-500 block mb-0.5">
              01 · Daily Principle
            </span>
            <h3 className="font-serif-editorial text-lg sm:text-xl font-bold text-stone-900 tracking-tight">
              今日精选心理学定律
            </h3>
          </div>
          <button
            onClick={() => navigate('/learn')}
            className="text-xs font-semibold text-stone-700 hover:text-stone-900 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>全部 {laws.length} 项定律</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {featuredLaw && <PsychologyLawCard law={featuredLaw} />}
      </section>

      {/* 4. Popular Cognitive Experiments (Laboratory Section) */}
      <section className="space-y-5">
        <div className="flex items-baseline justify-between pb-3 border-b border-stone-200">
          <div>
            <span className="editorial-kicker text-[10px] text-stone-500 block mb-0.5">
              02 · Interactive Experiments
            </span>
            <h3 className="font-serif-editorial text-lg sm:text-xl font-bold text-stone-900 tracking-tight">
              热门心智认知实验
            </h3>
          </div>
          <button
            onClick={() => navigate('/games')}
            className="text-xs font-semibold text-stone-700 hover:text-stone-900 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>探索全部实验</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {PSYCHOLOGY_GAMES.slice(0, 2).map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      </section>

      {/* 5. Interactive Overlapping Stack Feature (1/3 Overlap, Staggered Spread & Collapse) */}
      <section className="editorial-card rounded-2xl p-7 sm:p-9 space-y-6 bg-white border border-stone-200/90 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200/70">
          <div>
            <div className="flex items-center gap-2 text-xs text-stone-500 font-medium mb-1">
              <span className="editorial-kicker text-[10px] text-stone-700 tracking-widest">
                Interactive Stacking Component · 交互组件
              </span>
              <span className="text-stone-300">/</span>
              <span className="font-serif-editorial italic text-stone-600">Sequential Spread</span>
            </div>
            <h3 className="font-serif-editorial text-lg sm:text-xl font-bold text-stone-900 tracking-tight">
              认知学派思想家与先驱学者
            </h3>
            <p className="text-xs text-stone-600 mt-1 max-w-xl">
              元素默认互相压住 1/3，尾部聚拢剩余数量。点击即可依次优雅散开并显露学者姓名，再次点击平滑收回。
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            <button
              onClick={() => setIsStackLabOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200/80 text-stone-800 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-stone-600" />
              <span>调试工坊 (Lab)</span>
            </button>
          </div>
        </div>

        {/* Live OverlappingStack Component Instance */}
        <div className="pt-1">
          <OverlappingStack
            items={THINKER_ITEMS}
            maxVisible={4}
            overlapRatio={1 / 3}
            size="lg"
            layout="wrap"
            staggerMs={45}
            showToggleHint={true}
          />
        </div>
      </section>

      {/* 6. Editorial Epigram / Literary Reflection */}
      <section className="editorial-card rounded-2xl p-8 sm:p-10 text-center space-y-3 bg-[#FAF8F5]/80">
        <span className="editorial-kicker text-[10px] text-stone-500 tracking-widest block">
          04 · Thinker's Epigram · 认知哲思
        </span>
        <blockquote className="font-serif-editorial text-base sm:text-lg text-stone-800 italic max-w-2xl mx-auto leading-relaxed">
          “人类理性的局限并非智力的缺陷，而是演化赋予大脑在不确定世界中生存的启发式捷径。”
        </blockquote>
        <cite className="block text-xs text-stone-500 font-medium not-italic mt-2">
          — 赫伯特·西蒙（Herbert A. Simon）· 有限理性之父
        </cite>
      </section>

      {/* Interactive Overlapping Stack Lab Modal */}
      <OverlappingStackLabModal
        isOpen={isStackLabOpen}
        onClose={() => setIsStackLabOpen(false)}
      />
    </div>
  );
};

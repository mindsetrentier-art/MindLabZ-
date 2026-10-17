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
  Search,
  Compass,
  Palette,
  Shuffle,
  Star,
  Quote,
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
} from '../components/ui/OverlappingStackLabModal';
import { KineticCutoutHero } from '../components/ui/KineticCutoutHero';
import { AmbientSoundscapeControl } from '../components/ui/AmbientSoundscapeControl';
import { gameAudio } from '../utils/gameAudio';

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
  const [homeSearchQuery, setHomeSearchQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 120);
    return () => clearTimeout(timer);
  }, []);

  // Average mastery percentage across laws
  const masteryValues = Object.values(user.lawMasteryMap) as number[];
  const avgMastery =
    masteryValues.length > 0
      ? Math.round(masteryValues.reduce((a: number, b: number) => a + b, 0) / laws.length)
      : 35;

  // Featured Law of the Day (e.g. Zeigarnik Effect or first law)
  const featuredLaw = laws.find((l) => l.id === 'zeigarnik-effect') || laws[0];

  // Latest Journal Entry
  const latestJournal = journals && journals.length > 0 ? journals[0] : null;
  const todayIso = new Date().toISOString().split('T')[0];
  const hasLoggedToday = journals?.some((j) => j.date === todayIso);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!homeSearchQuery.trim()) return;
    gameAudio.playTap();
    navigate(`/search?q=${encodeURIComponent(homeSearchQuery.trim())}`);
  };

  const handleQuickKeyword = (kw: string) => {
    gameAudio.playTap();
    navigate(`/search?q=${encodeURIComponent(kw)}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-8 pb-8 animate-fadeIn max-w-5xl mx-auto">
        <HomeHeroSkeleton />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Skeleton variant="card" className="min-h-[140px]" />
          <Skeleton variant="card" className="min-h-[140px]" />
          <Skeleton variant="card" className="min-h-[140px]" />
          <Skeleton variant="card" className="min-h-[140px]" />
        </div>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Skeleton className="w-40 h-6 rounded-lg" />
            <Skeleton className="w-24 h-4 rounded-md" />
          </div>
          <LawCardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 sm:space-y-16 pb-20 animate-fadeIn max-w-5xl mx-auto">
      {/* 0. Grand Kinetic Cutout Typography Entrance: Custom/masterpiece photo revealed through letters with scroll zoom */}
      <section className="rounded-3xl overflow-hidden shadow-2xl border border-amber-400/35 bg-[#0B0918]">
        <KineticCutoutHero
          mainTitle="MINDLABZ"
          subtitle="智 心 堂 · 认知艺术典藏"
          tagline="ISSUE NO. 100 · THE ARCHITECTURE OF MIND"
          heightClass="min-h-[190vh]"
        />
      </section>

      {/* 1. Grand Museum Salon Cover & Curatorial Hero */}
      <section className="relative rounded-3xl overflow-hidden art-salon-canvas p-7 sm:p-10 md:p-12 text-white shadow-2xl transition-all">
        {/* Decorative Golden Fibonacci & Celestial Geometry */}
        <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
          <svg className="w-full h-full" viewBox="0 0 900 450" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="800" cy="120" r="280" stroke="#F59E0B" strokeWidth="1" strokeDasharray="6 8" />
            <circle cx="800" cy="120" r="180" stroke="#F59E0B" strokeWidth="1.2" />
            <circle cx="800" cy="120" r="110" stroke="#818CF8" strokeWidth="1.5" />
            <line x1="200" y1="0" x2="800" y2="450" stroke="#A855F7" strokeWidth="0.8" strokeDasharray="4 8" />
          </svg>
        </div>

        {/* Ambient Chromatic Glow */}
        <div className="absolute -top-24 -right-20 w-88 h-88 rounded-full bg-gradient-to-br from-amber-500/20 via-purple-600/25 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-20 w-88 h-88 rounded-full bg-gradient-to-tr from-indigo-600/30 via-emerald-500/15 to-transparent blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
          <div className="flex-1 space-y-4 max-w-2xl">
            {/* Museum Cover Rubric & Volume Index & Ambient Soundscape */}
            <div className="flex items-center justify-between gap-3 text-xs text-stone-300 font-mono flex-wrap">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/15 text-amber-300 border border-amber-300/30 font-semibold tracking-wider text-[11px] shadow-xs">
                  <Palette className="w-3.5 h-3.5 text-amber-400" />
                  <span>MINDLABZ · 认知艺术殿堂</span>
                </span>
                <span className="text-stone-500" aria-hidden="true">/</span>
                <span className="font-serif-editorial italic text-stone-300 text-xs">
                  Issue No. 100 · The Cognitive Architecture
                </span>
              </div>

              {/* Ambient Soundscape Switch for Deep Psychological Immersion */}
              <AmbientSoundscapeControl />
            </div>

            {/* High-End Serif Lead Headline */}
            <h1 className="font-serif-editorial text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-[1.2] drop-shadow-sm text-balance">
              在理性与感性的交界处， <br className="hidden sm:inline" />
              探索人类心智最精妙的认知光谱
            </h1>

            {/* Curatorial Dek / Lead Description */}
            <p className="text-xs sm:text-sm text-stone-300/90 font-normal leading-relaxed">
              穿透信息时代的主观偏误与直觉捷径。每日研习一条实证心理学定律，开启深度理性内化与心智艺术觉察。
            </p>

            {/* Quick Artistic Search Bar on Hero */}
            <form onSubmit={handleSearchSubmit} className="pt-2 max-w-xl">
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center text-amber-300 pointer-events-none">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={homeSearchQuery}
                  onChange={(e) => setHomeSearchQuery(e.target.value)}
                  placeholder="在 100 篇心智画廊与认知实验中探寻答案..."
                  className="w-full pl-11 pr-24 py-3 bg-white/10 hover:bg-white/15 focus:bg-white/20 backdrop-blur-md border border-white/20 focus:border-amber-400 rounded-2xl text-xs sm:text-sm text-white placeholder-stone-300 focus:outline-none transition-all shadow-inner"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-stone-950 font-bold text-xs hover:from-amber-300 hover:to-amber-400 transition-all cursor-pointer shadow-md"
                >
                  探索
                </button>
              </div>

              {/* Hot Search Quick Swatches */}
              <div className="flex items-center gap-1.5 pt-2.5 overflow-x-auto no-scrollbar text-[11px] text-stone-300">
                <span className="text-amber-300 font-semibold shrink-0 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  热门:
                </span>
                {['首因效应', '损失厌恶', '峰终定律', '黑天鹅理论', '蔡格尼克效应'].map((kw) => (
                  <button
                    type="button"
                    key={kw}
                    onClick={() => handleQuickKeyword(kw)}
                    className="px-2.5 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 text-stone-200 hover:text-white border border-white/10 transition-colors shrink-0 cursor-pointer"
                  >
                    {kw}
                  </button>
                ))}
              </div>
            </form>

            {/* Unboxed Metadata Stats */}
            <div className="pt-2 flex items-center gap-3 text-xs text-stone-300 flex-wrap font-numeric">
              <span className="flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span>连续研习:</span>
                <strong className="font-bold text-white">{user.streak} 天</strong>
              </span>
              <span className="text-stone-500" aria-hidden="true">·</span>
              <span className="flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                <span>心智内化:</span>
                <strong className="font-bold text-white">
                  {user.lawsMastered.length} / {laws.length}
                </strong>
                <span>项</span>
              </span>
              <span className="text-stone-500" aria-hidden="true">·</span>
              <span className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                <span>累积经验:</span>
                <strong className="font-bold text-amber-300">
                  {user.xp.toLocaleString()} XP
                </strong>
              </span>
            </div>

            {/* Daily Challenge Action Button */}
            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={() => {
                  gameAudio.playTap();
                  navigate('/challenge');
                }}
                className={`px-6 py-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 btn-tactile whitespace-nowrap shadow-lg cursor-pointer ${
                  isDailyChallengeCompleted
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 backdrop-blur-md'
                    : 'bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-stone-950 font-extrabold shadow-amber-500/30 hover:scale-[1.02]'
                }`}
              >
                {isDailyChallengeCompleted ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>今日研习已达成 · 报告已生成</span>
                  </>
                ) : (
                  <>
                    <Target className="w-4 h-4 text-stone-950" />
                    <span>开启今日心智挑战 (+500 XP)</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  gameAudio.playTap();
                  navigate('/search');
                }}
                className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>定律画廊</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Horological Mastery Dial (Astrological & Horology Accent) */}
          <div
            onClick={() => {
              gameAudio.playTap();
              navigate('/progress');
            }}
            className="cursor-pointer group shrink-0 transition-transform hover:scale-[1.03] self-start md:self-center p-5 rounded-3xl border border-amber-400/30 bg-gradient-to-b from-white/15 to-white/5 backdrop-blur-md shadow-xl"
            title="查看完整认知能力图谱"
          >
            <div className="flex flex-col items-center gap-2.5">
              <MasteryRing percentage={avgMastery} size={120} strokeWidth={8} />
              <div className="text-center">
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-300 block">
                  Cognitive Horizon
                </span>
                <span className="text-xs font-bold text-white flex items-center justify-center gap-1 mt-0.5 font-serif-editorial">
                  <span>心智图谱</span>
                  <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Quad Artistic Pavilions (四大艺术研习展翼) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
        {/* Pavilion 1: Metacognition Atelier (心智手记) */}
        <div
          onClick={() => {
            gameAudio.playTap();
            navigate('/journal');
          }}
          className="group art-calligraphy-paper rounded-2xl p-6 sm:p-7 cursor-pointer flex flex-col justify-between min-h-[190px] shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-400/10 rounded-full blur-xl pointer-events-none" />

          <div>
            <div className="flex justify-between items-start mb-3 text-xs">
              <span className="editorial-kicker text-[10px] text-stone-600 tracking-wider">
                ATELIER I · 心智手记
              </span>
              <div className="w-9 h-9 rounded-xl bg-white border border-stone-200/80 flex items-center justify-center text-stone-800 group-hover:bg-stone-900 group-hover:text-white transition-colors shadow-2xs">
                <PenLine className="w-4 h-4 stroke-[1.8]" />
              </div>
            </div>

            <div className="flex items-center gap-2 mb-1.5">
              <h3 className="font-serif-editorial text-lg font-bold text-stone-900 group-hover:text-amber-900 transition-colors leading-snug">
                心智觉察手记
              </h3>
              {hasLoggedToday ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                  今日已觉察
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-900 font-bold border border-amber-300 animate-pulse">
                  +50 XP
                </span>
              )}
            </div>

            <p className="text-xs text-stone-600 mt-1 leading-relaxed">
              CBT 认知重构、情绪解离与心流复盘，沉淀为心智觉察资产。
            </p>
          </div>

          <div className="pt-4 flex items-center text-xs font-bold text-stone-900 group-hover:text-amber-900 gap-1.5 transition-colors">
            <span>{hasLoggedToday ? '回顾手记画卷' : '挥毫今日觉察'}</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </div>
        </div>

        {/* Pavilion 2: Somatic Breath Wave (专注呼吸) */}
        <div
          onClick={() => {
            gameAudio.playTap();
            setBreathingOpen(true);
          }}
          className="group art-museum-mat art-zen-ripple rounded-2xl p-6 sm:p-7 cursor-pointer flex flex-col justify-between min-h-[190px] shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-400/15 rounded-full blur-xl pointer-events-none" />

          <div>
            <div className="flex justify-between items-start mb-3 text-xs">
              <span className="editorial-kicker text-[10px] text-stone-600 tracking-wider">
                ATELIER II · 专注呼吸
              </span>
              <div className="w-9 h-9 rounded-xl bg-white border border-stone-200/80 flex items-center justify-center text-stone-800 group-hover:bg-cyan-700 group-hover:text-white transition-colors shadow-2xs">
                <Wind className="w-4 h-4 stroke-[1.8]" />
              </div>
            </div>

            <div className="flex items-center gap-2 mb-1.5">
              <h3 className="font-serif-editorial text-lg font-bold text-stone-900 group-hover:text-cyan-900 transition-colors leading-snug">
                专注呼吸调节
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-cyan-100 text-cyan-800 font-bold border border-cyan-200">
                4-7-8 · 箱式
              </span>
            </div>

            <p className="text-xs text-stone-600 mt-1 leading-relaxed">
              柔和舒展黄金律视觉波形，激活迷走神经刹车，回归心流宁静。
            </p>
          </div>

          <div className="pt-4 flex items-center text-xs font-bold text-stone-900 group-hover:text-cyan-900 gap-1.5 transition-colors">
            <span>开启呼吸觉察</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </div>
        </div>

        {/* Pavilion 3: Socratic Dialectics (快速思辨) */}
        <div
          onClick={() => {
            gameAudio.playTap();
            navigate('/quiz');
          }}
          className="group art-socratic-stone rounded-2xl p-6 sm:p-7 cursor-pointer flex flex-col justify-between min-h-[190px] shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-400/10 rounded-full blur-xl pointer-events-none" />

          <div>
            <div className="flex justify-between items-start mb-3 text-xs">
              <span className="editorial-kicker text-[10px] text-stone-600 tracking-wider">
                ATELIER III · 苏格拉底思辨
              </span>
              <div className="w-9 h-9 rounded-xl bg-white border border-stone-200/80 flex items-center justify-center text-stone-800 group-hover:bg-stone-900 group-hover:text-white transition-colors shadow-2xs">
                <HelpCircle className="w-4 h-4 stroke-[1.8]" />
              </div>
            </div>

            <div className="flex items-center gap-2 mb-1.5">
              <h3 className="font-serif-editorial text-lg font-bold text-stone-900 group-hover:text-purple-900 transition-colors leading-snug">
                心理快问快答
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-100 text-purple-800 font-bold border border-purple-200">
                10 题速辨
              </span>
            </div>

            <p className="text-xs text-stone-600 mt-1 leading-relaxed">
              即时检验思维直觉与反直觉定律，洞察潜意识决策偏误。
            </p>
          </div>

          <div className="pt-4 flex items-center text-xs font-bold text-stone-900 group-hover:text-purple-900 gap-1.5 transition-colors">
            <span>开始快速思辨</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </div>
        </div>

        {/* Pavilion 4: Neural Arcade Matrix (认知竞技场) */}
        <div
          onClick={() => {
            gameAudio.playTap();
            navigate('/games');
          }}
          className="group art-cyber-jewel text-white rounded-2xl p-6 sm:p-7 cursor-pointer flex flex-col justify-between min-h-[190px] shadow-md hover:shadow-xl transition-all duration-300 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-br from-indigo-500/30 to-purple-500/30 rounded-full blur-xl pointer-events-none" />

          <div>
            <div className="flex justify-between items-start mb-3 text-xs">
              <span className="text-[10px] font-mono tracking-wider text-amber-300 font-bold">
                ATELIER IV · 认知竞技场
              </span>
              <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-300 group-hover:bg-amber-400 group-hover:text-stone-950 transition-colors shadow-inner">
                <Brain className="w-4 h-4 stroke-[2]" />
              </div>
            </div>

            <div className="flex items-center gap-2 mb-1.5">
              <h3 className="font-serif-editorial text-lg font-bold text-white group-hover:text-amber-200 transition-colors leading-snug">
                大脑训练竞技场
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30">
                10 款互动实验
              </span>
            </div>

            <p className="text-xs text-stone-300/90 mt-1 leading-relaxed">
              斯特鲁普、记忆宫殿、锚定实验与首因效应，配备发光机甲 HUD。
            </p>
          </div>

          <div className="pt-4 flex items-center text-xs font-bold text-amber-300 group-hover:text-amber-200 gap-1.5 transition-colors">
            <span>进入竞技舞台</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </section>

      {/* 3. Daily Cognitive Journal Feature Section */}
      <section className="space-y-4">
        <div className="flex items-baseline justify-between pb-3 border-b border-stone-200">
          <div>
            <span className="editorial-kicker text-[10px] text-stone-500 block mb-0.5">
              01 · Daily Journal & Reflection
            </span>
            <h3 className="font-serif-editorial text-lg sm:text-xl font-bold text-stone-900 tracking-tight">
              每日心智手记与觉察复盘
            </h3>
          </div>
          <button
            onClick={() => {
              gameAudio.playTap();
              navigate('/journal');
            }}
            className="text-xs font-semibold text-stone-700 hover:text-stone-900 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>全部手记 ({journals.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {latestJournal ? (
          <div className="art-museum-mat rounded-2xl p-6 sm:p-8 space-y-4 bg-gradient-to-br from-white to-[#FAF8F5]">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md bg-stone-100 text-stone-700 font-bold border border-stone-200 font-mono">
                  最近归档 · {latestJournal.date}
                </span>
                <span className="text-stone-600 font-serif-editorial">
                  情绪共鸣: <strong className="text-stone-900 font-semibold">{latestJournal.emotion.primary}</strong> (强度 {latestJournal.emotion.intensity}/10)
                </span>
              </div>
              <button
                onClick={() => {
                  gameAudio.playTap();
                  openComposerWithPreload();
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-stone-900 text-white text-xs font-bold hover:bg-stone-800 transition-colors btn-tactile cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>撰写新条目 (+50 XP)</span>
              </button>
            </div>

            <h4
              onClick={() => {
                gameAudio.playTap();
                navigate('/journal');
              }}
              className="font-serif-editorial text-lg font-bold text-stone-900 hover:text-amber-800 transition-colors cursor-pointer"
            >
              {latestJournal.title}
            </h4>

            <p className="font-serif-editorial text-xs sm:text-sm text-stone-700 italic border-l-2 border-stone-800 pl-3.5 leading-relaxed line-clamp-2">
              “{latestJournal.structuredData.reframedPerspective ||
                latestJournal.structuredData.tomorrowAnchor ||
                latestJournal.structuredData.coreTakeaway ||
                Object.values(latestJournal.structuredData)[0] ||
                '已记录完整思辨觉察。'}”
            </p>
          </div>
        ) : (
          <div className="art-museum-mat rounded-2xl p-8 text-center space-y-4 bg-gradient-to-br from-white to-[#FAF8F5]">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-700">
              <PenLine className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-serif-editorial text-base font-bold text-stone-900">
                今日情绪与思维尚未觉察复盘
              </h4>
              <p className="text-xs text-stone-600 max-w-md mx-auto leading-relaxed">
                记录内心的第一缕微澜，选用结构化心理学模板破除主观偏误。
              </p>
            </div>
            <button
              onClick={() => {
                gameAudio.playTap();
                openComposerWithPreload();
              }}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-stone-900 text-white text-xs font-bold hover:bg-stone-800 transition-colors btn-tactile cursor-pointer shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>开启今日记录 (+50 XP)</span>
            </button>
          </div>
        )}
      </section>

      {/* 4. Featured Psychology Law of the Day (Lead Column) */}
      <section className="space-y-5">
        <div className="flex items-baseline justify-between pb-3 border-b border-stone-200">
          <div>
            <span className="editorial-kicker text-[10px] text-stone-500 block mb-0.5">
              02 · Daily Masterpiece
            </span>
            <h3 className="font-serif-editorial text-lg sm:text-xl font-bold text-stone-900 tracking-tight">
              今日精选心智艺术典藏
            </h3>
          </div>
          <button
            onClick={() => {
              gameAudio.playTap();
              navigate('/search');
            }}
            className="text-xs font-semibold text-stone-700 hover:text-stone-900 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>探索全部 {laws.length} 篇画廊</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {featuredLaw && <PsychologyLawCard law={featuredLaw} />}
      </section>

      {/* 5. Popular Cognitive Experiments (Laboratory Section) */}
      <section className="space-y-5">
        <div className="flex items-baseline justify-between pb-3 border-b border-stone-200">
          <div>
            <span className="editorial-kicker text-[10px] text-stone-500 block mb-0.5">
              03 · Interactive Experiments
            </span>
            <h3 className="font-serif-editorial text-lg sm:text-xl font-bold text-stone-900 tracking-tight">
              热门心智认知实验工坊
            </h3>
          </div>
          <button
            onClick={() => {
              gameAudio.playTap();
              navigate('/games');
            }}
            className="text-xs font-semibold text-stone-700 hover:text-stone-900 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>进入竞技场 ({PSYCHOLOGY_GAMES.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {PSYCHOLOGY_GAMES.slice(0, 2).map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      </section>

      {/* 6. Interactive Overlapping Stack Feature: Thinker Gallery */}
      <section className="art-museum-mat rounded-2xl p-7 sm:p-9 space-y-6 bg-white border border-stone-200/90 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200/70">
          <div>
            <div className="flex items-center gap-2 text-xs text-stone-500 font-medium mb-1">
              <span className="editorial-kicker text-[10px] text-amber-700 font-bold tracking-widest">
                Curatorial Stacking Component · 先驱学者
              </span>
              <span className="text-stone-300">/</span>
              <span className="font-serif-editorial italic text-stone-600">Sequential Spread</span>
            </div>
            <h3 className="font-serif-editorial text-lg sm:text-xl font-bold text-stone-900 tracking-tight">
              认知学派思想家与先驱学者
            </h3>
            <p className="text-xs text-stone-600 mt-1 max-w-xl leading-relaxed">
              元素默认互相压住 1/3，尾部聚拢剩余数量。点击即可依次优雅散开并显露学者姓名，再次点击平滑收回。
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            <button
              onClick={() => {
                gameAudio.playTap();
                setIsStackLabOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200/80 text-stone-800 text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
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

      {/* 7. Museum Epigram Plaque (思想家金句艺术铭牌) */}
      <section className="relative rounded-3xl p-8 sm:p-10 text-center space-y-3.5 bg-gradient-to-b from-[#F9F7F2] to-[#F3EFE6] border border-amber-900/15 shadow-sm overflow-hidden">
        <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-700 flex items-center justify-center mx-auto mb-1">
          <Quote className="w-4 h-4 fill-amber-700" />
        </div>

        <span className="editorial-kicker text-[10px] text-stone-500 tracking-widest block font-bold">
          04 · Thinker's Epigram · 认知哲思
        </span>

        <blockquote className="font-serif-editorial text-base sm:text-lg text-stone-900 italic max-w-2xl mx-auto leading-relaxed">
          “人类理性的局限并非智力的缺陷，而是演化赋予大脑在不确定世界中生存的启发式捷径。”
        </blockquote>

        <cite className="block text-xs text-stone-600 font-medium not-italic mt-2">
          — 赫伯特·西蒙（Herbert A. Simon）· 诺贝尔经济学奖得主 · 有限理性之父
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

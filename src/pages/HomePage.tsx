import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
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
  Headphones,
  Bookmark,
  BookmarkCheck,
  Heart,
  Pin,
  Trash2,
  Bell,
  CalendarClock,
  Clock,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MasteryRing } from '../components/ui/MasteryRing';
import { PsychologyLawCard } from '../components/cards/PsychologyLawCard';
import { GameCard } from '../components/cards/GameCard';
import { Skeleton, HomeHeroSkeleton, LawCardSkeleton, GameCardSkeleton } from '../components/ui/Skeleton';
import { PSYCHOLOGY_GAMES } from '../data/games';
import { OverlappingStack, OverlappingCardStack } from '../components/ui/OverlappingStack';
import {
  OverlappingStackLabModal,
  THINKER_ITEMS,
} from '../components/ui/OverlappingStackLabModal';
import { KineticCutoutHero } from '../components/ui/KineticCutoutHero';
import { AmbientSoundscapeControl } from '../components/ui/AmbientSoundscapeControl';
import { HorizontalAccordion } from '../components/ui/HorizontalAccordion';
import { CityQuizMapView } from '../components/quiz/CityQuizMapView';
import {
  useCityQuizProgress,
  getUnlockedCityCount,
} from '../hooks/useCityQuizProgress';
import { WORLD_CAPITALS, POINTS_PER_CITY } from '../data/worldCapitals';
import {
  WORLD_CITATIONS,
  createShuffledCitationDeck,
} from '../data/worldCitations';
import { gameAudio } from '../utils/gameAudio';
import {
  LawPageBookmarkRecord,
  computeReadingProgressPercent,
  findReadingProgressForLaw,
  resolveBookLawById,
} from '../utils/lawReadingBookmarkHelpers';
import {
  deleteLawPageBookmark,
  subscribeToAllLawPageBookmarks,
} from '../services/lawReadingBookmarkService';
import { useReviewSchedule } from '../context/ReviewScheduleContext';
import {
  classifyReviewDueStatus,
  formatReviewCountdown,
} from '../utils/lawSpacedRepetition';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const {
    user,
    firebaseUser,
    laws,
    isDailyChallengeCompleted,
    setAiTutorOpen,
    journals,
    openComposerWithPreload,
    setBreathingOpen,
    toggleBookmark,
  } = useApp();
  const {
    schedules: reviewSchedules,
    dueSchedules,
    upcomingSchedules,
    masteredSchedules,
    dueCount: reviewDueCount,
    reviewNowMs,
    getScheduleForLaw,
  } = useReviewSchedule();
  const {
    progress: worldCityProgress,
    newlyUnlockedPointIndex,
    newlyUnlockedCityIndex,
    selectCity,
    selectPoint,
    selectChapter,
    setActiveCoordinates,
    resetAllProgress,
  } = useCityQuizProgress();
  const [isLoading, setIsLoading] = useState(true);
  const [isStackLabOpen, setIsStackLabOpen] = useState(false);
  const [homeSearchQuery, setHomeSearchQuery] = useState('');
  const [pageBookmarks, setPageBookmarks] = useState<LawPageBookmarkRecord[]>([]);
  const [bookmarkFilterTab, setBookmarkFilterTab] = useState<'all' | 'progress' | 'page-pin'>('all');

  // Non-repeating randomized shuffle-bag for 500 bilingual world citations (10s rotation)
  const citationDeckRef = useRef<number[]>(createShuffledCitationDeck());
  const citationCursorRef = useRef<number>(0);
  const [citationIndex, setCitationIndex] = useState<number>(
    () => citationDeckRef.current[0]
  );

  const advanceRandomCitation = useCallback(() => {
    const currentShown = citationDeckRef.current[citationCursorRef.current];
    const nextCursor = citationCursorRef.current + 1;

    if (nextCursor >= citationDeckRef.current.length) {
      citationDeckRef.current = createShuffledCitationDeck(currentShown);
      citationCursorRef.current = 0;
    } else {
      citationCursorRef.current = nextCursor;
    }

    setCitationIndex(citationDeckRef.current[citationCursorRef.current]);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 120);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const rotationTimer = setInterval(advanceRandomCitation, 10000);
    return () => clearInterval(rotationTimer);
  }, [advanceRandomCitation]);

  useEffect(() => {
    const unsubscribe = subscribeToAllLawPageBookmarks(
      firebaseUser?.uid,
      (records) => setPageBookmarks(records)
    );
    return () => unsubscribe();
  }, [firebaseUser?.uid]);

  const activeCitation = WORLD_CITATIONS[citationIndex] || WORLD_CITATIONS[0];

  // Average mastery percentage across laws with full defensive guarding
  const safeLawMasteryMap =
    user?.lawMasteryMap && typeof user.lawMasteryMap === 'object' ? user.lawMasteryMap : {};
  const masteryValues = Object.values(safeLawMasteryMap) as number[];
  const safeLaws = Array.isArray(laws) ? laws : [];
  const avgMastery =
    masteryValues.length > 0 && safeLaws.length > 0
      ? Math.round(
          masteryValues.reduce((a: number, b: number) => a + Number(b || 0), 0) / safeLaws.length
        )
      : 35;

  // Featured Law of the Day (e.g. Zeigarnik Effect or first law)
  const featuredLaw =
    safeLaws.find((l) => l.id === 'zeigarnik-effect') || safeLaws[0] || null;

  // Safe user profile properties
  const safeLawsMastered = Array.isArray(user?.lawsMastered) ? user.lawsMastered : [];
  const safeStreak = Number(user?.streak ?? 0);
  const safeXp = Number(user?.xp ?? 0);
  const safeFavoriteIds = Array.isArray(user?.bookmarks) ? user.bookmarks : [];
  const favoriteLaws = safeFavoriteIds
    .map((favId) => resolveBookLawById(safeLaws, favId))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  const progressBookmarks = pageBookmarks.filter((b) => b.bookmarkKind === 'progress');
  const pinBookmarks = pageBookmarks.filter((b) => b.bookmarkKind === 'page-pin');
  const displayedPageBookmarks =
    bookmarkFilterTab === 'all'
      ? pageBookmarks
      : pageBookmarks.filter((b) => b.bookmarkKind === bookmarkFilterTab);

  const handleRemovePageBookmark = async (bookmarkId: string) => {
    try {
      await deleteLawPageBookmark(firebaseUser?.uid, bookmarkId);
      setPageBookmarks((prev) => prev.filter((item) => item.id !== bookmarkId));
      gameAudio.playTap();
    } catch (err) {
      console.error('Failed to delete page bookmark from dashboard:', err);
    }
  };

  // Latest Journal Entry
  const safeJournals = Array.isArray(journals) ? journals : [];
  const latestJournal = safeJournals.length > 0 ? safeJournals[0] : null;
  const todayIso = new Date().toISOString().split('T')[0];
  const hasLoggedToday = safeJournals.some((j) => Boolean(j && j.date === todayIso));

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
      {/* 0. Grand Kinetic Cutout Typography Entrance */}
      <section className="rounded-3xl overflow-hidden shadow-2xl border border-[#D4A656]/30 bg-[#0D0B16]">
        <KineticCutoutHero
          mainTitle="MINDLABZ"
          subtitle="智 心 堂 · 认知艺术典藏"
          tagline="ISSUE NO. 100 · THE ARCHITECTURE OF MIND"
          heightClass="min-h-[125vh] sm:min-h-[180vh]"
        />
      </section>

      {/* 1. Grand Museum Salon Cover & Curatorial Hero */}
      <section className="relative rounded-3xl overflow-hidden art-salon-canvas p-5 sm:p-8 md:p-12 text-[#FAF8F5] shadow-2xl transition-all">
        {/* Decorative Golden Fibonacci & Celestial Geometry */}
        <div className="absolute inset-0 opacity-[0.11] pointer-events-none overflow-hidden">
          <svg className="w-full h-full" viewBox="0 0 900 450" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="800" cy="120" r="280" stroke="#D4A656" strokeWidth="0.9" strokeDasharray="6 8" />
            <circle cx="800" cy="120" r="180" stroke="#D4A656" strokeWidth="1.1" />
            <circle cx="800" cy="120" r="110" stroke="#7A6BBF" strokeWidth="1.3" />
            <line x1="200" y1="0" x2="800" y2="450" stroke="#9B8AD4" strokeWidth="0.7" strokeDasharray="4 8" />
          </svg>
        </div>

        {/* Ambient Mineral & Champagne Chromatic Glow */}
        <div className="absolute -top-24 -right-20 w-88 h-88 rounded-full bg-gradient-to-br from-[#D4A656]/18 via-[#5B45B8]/22 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-20 w-88 h-88 rounded-full bg-gradient-to-tr from-[#3E2C8A]/28 via-[#1E7A6D]/14 to-transparent blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
          <div className="flex-1 space-y-4 max-w-2xl">
            {/* Museum Cover Rubric & Volume Index & Ambient Soundscape */}
            <div className="flex items-center justify-between gap-3 text-xs text-stone-300 font-mono flex-wrap">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4A656]/12 text-[#F3D89E] border border-[#D4A656]/35 font-semibold tracking-wider text-[11px] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
                  <Palette className="w-3.5 h-3.5 text-[#E5C07B]" />
                  <span>MINDLABZ · 认知艺术殿堂</span>
                </span>
                <span className="text-stone-500" aria-hidden="true">/</span>
                <span className="font-serif-editorial italic text-stone-300/90 text-xs">
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
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center text-[#E5C07B] pointer-events-none">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={homeSearchQuery}
                  onChange={(e) => setHomeSearchQuery(e.target.value)}
                  placeholder="在 100 篇心智画廊与认知实验中探寻答案..."
                  className="w-full pl-11 pr-24 py-3 bg-white/[0.07] hover:bg-white/[0.11] focus:bg-white/[0.14] backdrop-blur-md border border-white/15 focus:border-[#D4A656]/70 rounded-2xl text-xs sm:text-sm text-[#FAF8F5] placeholder-stone-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A656]/40 transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.28)]"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-3.5 py-1.5 rounded-xl font-bold text-xs text-[#181411] transition-all cursor-pointer btn-tactile focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F3D89E]"
                  style={{
                    background: 'linear-gradient(135deg, #EDD08B 0%, #C8933B 100%)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.45), 0 4px 12px -2px rgba(212,166,86,0.35)',
                  }}
                >
                  探索
                </button>
              </div>

              {/* Hot Search Quick Swatches */}
              <div className="flex items-center gap-1.5 pt-2.5 overflow-x-auto no-scrollbar text-[11px] text-stone-300">
                <span className="text-[#E5C07B] font-semibold shrink-0 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  热门:
                </span>
                {['首因效应', '损失厌恶', '峰终定律', '黑天鹅理论', '蔡格尼克效应'].map((kw) => (
                  <button
                    type="button"
                    key={kw}
                    onClick={() => handleQuickKeyword(kw)}
                    className="px-2.5 py-0.5 rounded-lg bg-white/[0.06] hover:bg-[#D4A656]/18 text-stone-200 hover:text-[#F8E7C1] border border-white/12 hover:border-[#D4A656]/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-all shrink-0 cursor-pointer"
                  >
                    {kw}
                  </button>
                ))}
              </div>
            </form>

            {/* Unboxed Metadata Stats */}
            <div className="pt-2 flex items-center gap-3 text-xs text-stone-300 flex-wrap font-numeric">
              <span className="flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-[#E5C07B] fill-[#E5C07B]/85" />
                <span>连续研习:</span>
                <strong className="font-bold text-[#FAF8F5]">{safeStreak} 天</strong>
              </span>
              <span className="text-stone-500" aria-hidden="true">·</span>
              <span className="flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-[#9B8AD4]" />
                <span>心智内化:</span>
                <strong className="font-bold text-[#FAF8F5]">
                  {safeLawsMastered.length} / {safeLaws.length}
                </strong>
                <span>项</span>
              </span>
              <span className="text-stone-500" aria-hidden="true">·</span>
              <span className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-[#E5C07B] fill-[#E5C07B]/85" />
                <span>累积经验:</span>
                <strong className="font-bold text-[#F3D89E]">
                  {safeXp.toLocaleString()} XP
                </strong>
              </span>
            </div>

            {/* Daily Challenge & Pavilion Action Buttons (Wrapped & Harmonized) */}
            <div className="pt-2 flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => {
                  gameAudio.playTap();
                  navigate('/challenge');
                }}
                className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 btn-tactile whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F3D89E] ${
                  isDailyChallengeCompleted
                    ? 'bg-[#157F5D]/20 text-[#9CE3C8] border border-[#157F5D]/45 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]'
                    : 'text-[#181411] font-extrabold hover:brightness-105'
                }`}
                style={
                  isDailyChallengeCompleted
                    ? undefined
                    : {
                        background: 'linear-gradient(135deg, #F2D794 0%, #D4A656 52%, #B8842E 100%)',
                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.48), 0 10px 26px -6px rgba(212,166,86,0.42)',
                      }
                }
              >
                {isDailyChallengeCompleted ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-[#6EE7B7]" />
                    <span>今日研习已达成 · 报告已生成</span>
                  </>
                ) : (
                  <>
                    <Target className="w-4 h-4 text-[#181411]" />
                    <span>开启今日心智挑战 (+500 XP)</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  gameAudio.playTap();
                  navigate('/emotional-laws');
                }}
                className="luxury-ghost-dark-btn px-4 py-2.5 rounded-2xl text-xs font-semibold cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A656]/60"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#E5C07B]" />
                <span>情感50律典藏馆</span>
              </button>

              <button
                onClick={() => {
                  gameAudio.playTap();
                  navigate('/search');
                }}
                className="luxury-ghost-dark-btn px-4 py-2.5 rounded-2xl text-xs font-semibold cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A656]/60"
              >
                <span>心智全景画廊</span>
                <ArrowRight className="w-3.5 h-3.5 text-stone-300" />
              </button>

              <button
                type="button"
                onClick={() => {
                  gameAudio.playTap();
                  navigate('/focus-audio');
                }}
                className="luxury-ghost-dark-btn px-4 py-2.5 rounded-2xl text-xs font-semibold cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A656]/60"
              >
                <Headphones className="w-3.5 h-3.5 text-[#8AB4C8]" />
                <span>双耳节拍专注音频</span>
              </button>
            </div>
          </div>

          {/* Horological Mastery Dial (Astrological & Horology Accent) */}
          <div
            onClick={() => {
              gameAudio.playTap();
              navigate('/progress');
            }}
            className="cursor-pointer group shrink-0 transition-all duration-200 hover:scale-[1.02] self-start md:self-center p-5 rounded-3xl border border-[#D4A656]/30 bg-gradient-to-b from-white/[0.11] to-white/[0.03] backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_16px_36px_-10px_rgba(0,0,0,0.45)]"
            title="查看完整认知能力图谱"
          >
            <div className="flex flex-col items-center gap-2.5">
              <MasteryRing percentage={avgMastery} size={120} strokeWidth={8} />
              <div className="text-center">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#E5C07B] block">
                  Cognitive Horizon
                </span>
                <span className="text-xs font-bold text-[#FAF8F5] flex items-center justify-center gap-1 mt-0.5 font-serif-editorial">
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
          className="group art-calligraphy-paper rounded-2xl p-6 sm:p-7 cursor-pointer flex flex-col justify-between min-h-[190px] hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#D4A656]/12 rounded-full blur-xl pointer-events-none" />

          <div>
            <div className="flex justify-between items-start mb-3 text-xs">
              <span className="editorial-kicker text-[10px] text-[#6E675F] tracking-wider">
                ATELIER I · 心智手记
              </span>
              <div className="w-9 h-9 rounded-xl luxury-surface-btn flex items-center justify-center text-[#181411] group-hover:bg-[#181411] group-hover:text-[#FAF8F5] transition-colors">
                <PenLine className="w-4 h-4 stroke-[1.8]" />
              </div>
            </div>

            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <h3 className="font-serif-editorial text-lg font-bold text-[#181411] group-hover:text-[#8E5B13] transition-colors leading-snug">
                心智觉察手记
              </h3>
              {hasLoggedToday ? (
                <span className="luxury-badge-ink text-[#157F5D] border-[#157F5D]/25 bg-[#157F5D]/8">
                  今日已觉察
                </span>
              ) : (
                <span className="luxury-badge-ink text-[#8E5B13] border-[#D4A656]/45 bg-[#D4A656]/14">
                  +50 XP
                </span>
              )}
            </div>

            <p className="text-xs text-[#57514A] mt-1 leading-relaxed">
              CBT 认知重构、情绪解离与心流复盘，沉淀为心智觉察资产。
            </p>
          </div>

          <div className="pt-4 flex items-center text-xs font-bold text-[#181411] group-hover:text-[#8E5B13] gap-1.5 transition-colors">
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
          className="group art-museum-mat art-zen-ripple rounded-2xl p-6 sm:p-7 cursor-pointer flex flex-col justify-between min-h-[190px] transition-all duration-300 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#0F766E]/10 rounded-full blur-xl pointer-events-none" />

          <div>
            <div className="flex justify-between items-start mb-3 text-xs">
              <span className="editorial-kicker text-[10px] text-[#6E675F] tracking-wider">
                ATELIER II · 专注呼吸
              </span>
              <div className="w-9 h-9 rounded-xl luxury-surface-btn flex items-center justify-center text-[#181411] group-hover:bg-[#0F766E] group-hover:text-white transition-colors">
                <Wind className="w-4 h-4 stroke-[1.8]" />
              </div>
            </div>

            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <h3 className="font-serif-editorial text-lg font-bold text-[#181411] group-hover:text-[#0F766E] transition-colors leading-snug">
                专注呼吸调节
              </h3>
              <span className="luxury-badge-ink text-[#0F766E] border-[#0F766E]/25 bg-[#0F766E]/8">
                4-7-8 · 箱式
              </span>
            </div>

            <p className="text-xs text-[#57514A] mt-1 leading-relaxed">
              柔和舒展黄金律视觉波形，激活迷走神经刹车，回归心流宁静。
            </p>
          </div>

          <div className="pt-4 flex items-center text-xs font-bold text-[#181411] group-hover:text-[#0F766E] gap-1.5 transition-colors">
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
          className="group art-socratic-stone rounded-2xl p-6 sm:p-7 cursor-pointer flex flex-col justify-between min-h-[190px] hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#5B45B8]/10 rounded-full blur-xl pointer-events-none" />

          <div>
            <div className="flex justify-between items-start mb-3 text-xs">
              <span className="editorial-kicker text-[10px] text-[#6E675F] tracking-wider">
                ATELIER III · 苏格拉底思辨
              </span>
              <div className="w-9 h-9 rounded-xl luxury-surface-btn flex items-center justify-center text-[#181411] group-hover:bg-[#5B45B8] group-hover:text-white transition-colors">
                <HelpCircle className="w-4 h-4 stroke-[1.8]" />
              </div>
            </div>

            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <h3 className="font-serif-editorial text-lg font-bold text-[#181411] group-hover:text-[#4C389E] transition-colors leading-snug">
                心理快问快答
              </h3>
              <span className="luxury-badge-ink text-[#4C389E] border-[#5B45B8]/25 bg-[#5B45B8]/8">
                10 题速辨
              </span>
            </div>

            <p className="text-xs text-[#57514A] mt-1 leading-relaxed">
              即时检验思维直觉与反直觉定律，洞察潜意识决策偏误。
            </p>
          </div>

          <div className="pt-4 flex items-center text-xs font-bold text-[#181411] group-hover:text-[#4C389E] gap-1.5 transition-colors">
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
          className="group art-cyber-jewel text-[#FAF8F5] rounded-2xl p-6 sm:p-7 cursor-pointer flex flex-col justify-between min-h-[190px] hover:-translate-y-0.5 hover:shadow-xl transition-all duration-300 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-br from-[#5B45B8]/25 to-[#D4A656]/18 rounded-full blur-xl pointer-events-none" />

          <div>
            <div className="flex justify-between items-start mb-3 text-xs">
              <span className="text-[10px] font-mono tracking-wider text-[#E5C07B] font-bold">
                ATELIER IV · 认知竞技场
              </span>
              <div className="w-9 h-9 rounded-xl bg-white/[0.08] border border-white/15 flex items-center justify-center text-[#E5C07B] group-hover:bg-[#D4A656] group-hover:text-[#181411] transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]">
                <Brain className="w-4 h-4 stroke-[2]" />
              </div>
            </div>

            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <h3 className="font-serif-editorial text-lg font-bold text-[#FAF8F5] group-hover:text-[#F3D89E] transition-colors leading-snug">
                大脑训练竞技场
              </h3>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-[#D4A656]/15 text-[#F3D89E] font-semibold border border-[#D4A656]/30">
                互动实验
              </span>
            </div>

            <p className="text-xs text-stone-300/90 mt-1 leading-relaxed">
              斯特鲁普、记忆宫殿、锚定实验与首因效应，配备发光机甲 HUD。
            </p>
          </div>

          <div className="pt-4 flex items-center text-xs font-bold text-[#E5C07B] group-hover:text-[#F3D89E] gap-1.5 transition-colors">
            <span>进入竞技舞台</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </section>

      {/* 2B. Integrated City Quiz Cartographic Atlas (世界 50 国首都互动沙盘) */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-3 pb-3 border-b border-stone-200">
          <div>
            <span className="editorial-kicker text-[10px] text-amber-800 block mb-0.5">
              World Capitals Cognitive Atlas · 五十国首都心智沙盘
            </span>
            <h3 className="font-serif-editorial text-lg sm:text-xl font-bold text-stone-900 tracking-tight">
              世界首都闯关版图 · 当前坐标（{WORLD_CAPITALS[worldCityProgress.activeCityIndex]?.cityZh || '巴黎'} · 第{' '}
              {worldCityProgress.activePointIndex + 1}/{POINTS_PER_CITY} 站 · 第{' '}
              {worldCityProgress.activeChapterIndex + 1} 章 · 已解锁 {getUnlockedCityCount(worldCityProgress)}/{WORLD_CAPITALS.length} 城）
            </h3>
          </div>
          <button
            type="button"
            onClick={() => {
              gameAudio.playTap();
              navigate('/quiz');
            }}
            className="luxury-surface-btn px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer whitespace-nowrap"
          >
            <span>进入全屏思辨闯关</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <CityQuizMapView
          variant="dashboard"
          progress={worldCityProgress}
          newlyUnlockedPointIndex={newlyUnlockedPointIndex}
          newlyUnlockedCityIndex={newlyUnlockedCityIndex}
          playerAvatar={user?.avatar}
          playerName={user?.name}
          onSelectCity={selectCity}
          onSelectPoint={selectPoint}
          onSelectChapter={selectChapter}
          onStartChapterQuiz={(c, p, ch) => {
            setActiveCoordinates(c, p, ch);
            navigate(`/quiz?city=${c}&point=${p}&chapter=${ch}&autostart=1`);
          }}
          onResetAllProgress={resetAllProgress}
        />
      </section>

      {/* 2C. Reading Bookmarks & Favorite Laws Quick Access */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-3 pb-3 border-b border-stone-200/80">
          <div>
            <span className="editorial-kicker text-[10px] text-[#6E675F] block mb-0.5">
              Reading Desk &amp; Bookmarks · 典藏书签与收藏定律
            </span>
            <h3 className="font-serif-editorial text-lg sm:text-xl font-bold text-[#181411] tracking-tight">
              书页阅读进度与收藏定律快速入口
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                gameAudio.playTap();
                navigate('/review');
              }}
              className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 tabular-nums ${
                reviewDueCount > 0
                  ? 'luxury-dark-btn'
                  : 'luxury-surface-btn text-[#181411]'
              }`}
            >
              <CalendarClock
                className={`w-3.5 h-3.5 ${reviewDueCount > 0 ? 'text-[#D4A656]' : 'text-[#8E5B13]'}`}
                aria-hidden="true"
              />
              <span>
                {reviewDueCount > 0
                  ? `间隔复习 (${reviewDueCount} 条到期)`
                  : '间隔复习排期'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                gameAudio.playTap();
                navigate('/emotional-library');
              }}
              className="luxury-surface-btn px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#8E5B13]" />
              <span>进入典藏定律库</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Left Panel: Saved Reading Progress & Specific Page Pins */}
          <div className="art-museum-mat rounded-2xl p-5 sm:p-6 space-y-4 flex flex-col">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-200/80">
              <div className="flex items-center gap-2">
                <BookmarkCheck className="w-4 h-4 text-[#8E5B13] shrink-0" />
                <h4 className="font-serif-editorial text-base font-bold text-[#181411]">
                  书页阅读进度与页签
                </h4>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-numeric tabular-nums">
                {(
                  [
                    { key: 'all', label: `全部 ${pageBookmarks.length}` },
                    { key: 'progress', label: `进度 ${progressBookmarks.length}` },
                    { key: 'page-pin', label: `页签 ${pinBookmarks.length}` },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setBookmarkFilterTab(tab.key)}
                    className={`px-2 py-1 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      bookmarkFilterTab === tab.key
                        ? 'bg-[#181411] text-[#FAF8F5]'
                        : 'text-[#57514A] hover:bg-stone-200/70'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {displayedPageBookmarks.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-6 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#FAF4E8] border border-[#D4A656]/35 flex items-center justify-center text-[#8E5B13]">
                  <Bookmark className="w-4 h-4" />
                </div>
                <p className="text-xs text-[#57514A] max-w-xs leading-relaxed">
                  在任意定律书籍翻页阅读时点击“保存进度”或书页右上角书签，即可在此一键续读具体书页。
                </p>
                <button
                  type="button"
                  onClick={() => {
                    gameAudio.playTap();
                    navigate('/emotional-library');
                  }}
                  className="luxury-dark-btn px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0"
                >
                  前往翻阅定律书籍 →
                </button>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {displayedPageBookmarks.slice(0, 8).map((bm) => {
                  const pct = computeReadingProgressPercent(bm.pageIndex);
                  const isProgress = bm.bookmarkKind === 'progress';
                  return (
                    <div
                      key={bm.id}
                      className="p-3.5 rounded-xl bg-[#FAF7F1] border border-stone-200/85 flex items-start justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex items-center gap-2 text-[11px] font-numeric tabular-nums flex-wrap">
                          <span
                            className={`font-bold inline-flex items-center gap-1 ${
                              isProgress ? 'text-[#157F5D]' : 'text-[#961D38]'
                            }`}
                          >
                            {isProgress ? (
                              <BookmarkCheck className="w-3 h-3 shrink-0" />
                            ) : (
                              <Pin className="w-3 h-3 shrink-0" />
                            )}
                            <span>
                              {isProgress ? '阅读进度' : '页签'} · 第 {bm.pageIndex + 1} / 12 页
                            </span>
                          </span>
                          <span className="text-stone-400" aria-hidden="true">·</span>
                          <span className="text-[#6E675F] truncate">{bm.pageTitle}</span>
                        </div>

                        <div className="font-serif-editorial text-sm font-bold text-[#181411] truncate">
                          {bm.lawNameZh}
                        </div>

                        {bm.note && (
                          <p className="text-[11px] text-[#57514A] line-clamp-1">
                            {bm.note}
                          </p>
                        )}

                        <div className="flex items-center gap-2 pt-0.5">
                          <div className="flex-1 h-1 bg-[#EAE3D5] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#157F5D] rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-mono font-semibold text-[#57514A] tabular-nums shrink-0">
                            {pct}%
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            gameAudio.playTap();
                            navigate(`/law/${bm.lawId}?page=${bm.pageIndex + 1}`);
                          }}
                          className="luxury-dark-btn min-h-[34px] px-3 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer whitespace-nowrap shrink-0 tabular-nums"
                        >
                          续读第 {bm.pageIndex + 1} 页 →
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemovePageBookmark(bm.id)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6E675F] hover:text-[#961D38] hover:bg-stone-200/70 transition-colors cursor-pointer"
                          aria-label={`移除《${bm.lawNameZh}》第 ${bm.pageIndex + 1} 页书签`}
                          title="移除书签"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Panel: Favorite Laws Quick Access */}
          <div className="art-museum-mat rounded-2xl p-5 sm:p-6 space-y-4 flex flex-col">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-stone-200/80">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-[#961D38] fill-[#961D38]/20 shrink-0" />
                <h4 className="font-serif-editorial text-base font-bold text-[#181411]">
                  已收藏心理学定律
                </h4>
              </div>
              <span className="text-xs font-numeric tabular-nums font-semibold text-[#6E675F]">
                {favoriteLaws.length} 条藏品
              </span>
            </div>

            {favoriteLaws.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-6 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#FDF3F5] border border-[#961D38]/25 flex items-center justify-center text-[#961D38]">
                  <Heart className="w-4 h-4" />
                </div>
                <p className="text-xs text-[#57514A] max-w-xs leading-relaxed">
                  在定律库或书籍阅读器中点击“收藏定律”，即可在此建立你的专属心理学定律快速通道。
                </p>
                <button
                  type="button"
                  onClick={() => {
                    gameAudio.playTap();
                    navigate('/emotional-library');
                  }}
                  className="luxury-surface-btn px-4 py-2 rounded-xl text-xs font-semibold text-[#181411] cursor-pointer whitespace-nowrap shrink-0"
                >
                  浏览并收藏定律 →
                </button>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {favoriteLaws.slice(0, 8).map((favLaw) => {
                  const savedProg = findReadingProgressForLaw(pageBookmarks, favLaw.id);
                  const reviewSched = getScheduleForLaw(favLaw.id);
                  const reviewStatus = reviewSched
                    ? classifyReviewDueStatus(reviewSched, reviewNowMs)
                    : null;
                  const reviewLabel = reviewSched
                    ? formatReviewCountdown(reviewSched.nextReviewAtMs, reviewNowMs)
                    : null;
                  const targetUrl = savedProg
                    ? `/law/${favLaw.id}?page=${savedProg.pageIndex + 1}`
                    : `/law/${favLaw.id}`;
                  return (
                    <div
                      key={favLaw.id}
                      className="p-3.5 rounded-xl bg-[#FAF7F1] border border-stone-200/85 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2 text-[11px] font-numeric tabular-nums text-[#6E675F] flex-wrap">
                          <span className="font-bold text-[#8E5B13]">
                            {favLaw.codeId || 'LAW'}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{favLaw.categoryZh}心理学</span>
                          {savedProg && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-[#157F5D] font-semibold">
                                已读第 {savedProg.pageIndex + 1}/12 页
                              </span>
                            </>
                          )}
                          {reviewLabel && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span
                                className={`font-semibold ${
                                  reviewStatus === 'due'
                                    ? 'text-[#961D38]'
                                    : reviewStatus === 'mastered'
                                    ? 'text-[#157F5D]'
                                    : 'text-[#8E5B13]'
                                }`}
                              >
                                复习：{reviewLabel}
                              </span>
                            </>
                          )}
                        </div>
                        <div className="font-serif-editorial text-sm font-bold text-[#181411] truncate">
                          {favLaw.nameZh}
                        </div>
                        <div className="text-[11px] font-serif-editorial italic text-[#6E675F] truncate">
                          {favLaw.nameEn}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {reviewStatus === 'due' && (
                          <button
                            type="button"
                            onClick={() => {
                              gameAudio.playTap();
                              navigate(`/review?focus=${encodeURIComponent(favLaw.id)}`);
                            }}
                            className="luxury-dark-btn min-h-[34px] px-2.5 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer whitespace-nowrap shrink-0"
                          >
                            复习
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            gameAudio.playTap();
                            navigate(targetUrl);
                          }}
                          className="luxury-surface-btn min-h-[34px] px-3 py-1.5 rounded-lg text-[11px] font-semibold text-[#181411] cursor-pointer whitespace-nowrap shrink-0"
                        >
                          {savedProg ? `续读 P.${savedProg.pageIndex + 1} →` : '进入阅读 →'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            gameAudio.playTap();
                            toggleBookmark(favLaw.id);
                          }}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-[#961D38] hover:bg-[#FDF3F5] transition-colors cursor-pointer"
                          aria-label={`取消收藏《${favLaw.nameZh}》`}
                          title="取消收藏"
                        >
                          <Heart className="w-4 h-4 fill-[#961D38]" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Spaced Repetition Review Schedule Strip for Favorited Laws */}
        <div className="art-museum-mat rounded-2xl p-5 sm:p-6 border border-[#C8933B]/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-[#8E5B13] font-semibold tabular-nums flex-wrap">
              <Bell className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>SM-2 艾宾浩斯间隔复习日程</span>
              <span aria-hidden="true">·</span>
              <span className={reviewDueCount > 0 ? 'text-[#961D38]' : 'text-[#157F5D]'}>
                今日到期 {reviewDueCount} 条
              </span>
              <span aria-hidden="true">·</span>
              <span>已巩固 {masteredSchedules.length} / {reviewSchedules.length} 条</span>
            </div>
            <h4 className="font-serif-editorial text-base sm:text-lg font-bold text-[#181411]">
              {reviewDueCount > 0
                ? `你有 ${reviewDueCount} 条已收藏心理学定律到达最佳回忆复习点`
                : '所有已收藏定律均处于最佳记忆周期内'}
            </h4>
            <p className="text-xs text-[#57514A] leading-relaxed">
              {dueSchedules.length > 0
                ? `优先回顾：《${dueSchedules[0].lawNameZh}》${dueSchedules.length > 1 ? `、《${dueSchedules[1].lawNameZh}》等` : ''}。完成主动回忆评级后将自动演算下一次提醒日期。`
                : upcomingSchedules.length > 0
                ? `下一条将到期的定律：《${upcomingSchedules[0].lawNameZh}》（${formatReviewCountdown(upcomingSchedules[0].nextReviewAtMs, reviewNowMs)}）。`
                : '收藏任意心理学定律后，系统将自动为其编排 SM-2 记忆巩固时间表。'}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {upcomingSchedules.length > 0 && dueSchedules.length === 0 && (
              <span className="text-xs font-numeric tabular-nums text-[#6E675F] inline-flex items-center gap-1 mr-1">
                <Clock className="w-3.5 h-3.5 text-[#8E5B13]" aria-hidden="true" />
                <span>{formatReviewCountdown(upcomingSchedules[0].nextReviewAtMs, reviewNowMs)}</span>
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                gameAudio.playTap();
                navigate('/review');
              }}
              className="luxury-dark-btn min-h-[40px] px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <CalendarClock className="w-3.5 h-3.5 text-[#D4A656]" aria-hidden="true" />
              <span>{reviewDueCount > 0 ? `开始复习 (${reviewDueCount})` : '查看复习排期'}</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>

      {/* 3. Daily Cognitive Journal Feature Section */}
      <section className="space-y-4">
        <div className="flex items-baseline justify-between pb-3 border-b border-stone-200/80">
          <div>
            <span className="editorial-kicker text-[10px] text-[#6E675F] block mb-0.5">
              01 · Daily Journal & Reflection
            </span>
            <h3 className="font-serif-editorial text-lg sm:text-xl font-bold text-[#181411] tracking-tight">
              每日心智手记与觉察复盘
            </h3>
          </div>
          <button
            onClick={() => {
              gameAudio.playTap();
              navigate('/journal');
            }}
            className="luxury-surface-btn px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer"
          >
            <span>全部手记 ({safeJournals.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {latestJournal ? (
          <div className="art-museum-mat rounded-2xl p-6 sm:p-8 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="luxury-badge-ink">
                  最近归档 · {latestJournal.date || '今日'}
                </span>
                <span className="text-[#57514A] font-serif-editorial">
                  情绪共鸣: <strong className="text-[#181411] font-semibold">{latestJournal.emotion?.primary || '澄明通透'}</strong> (强度 {latestJournal.emotion?.intensity ?? 5}/10)
                </span>
              </div>
              <button
                onClick={() => {
                  gameAudio.playTap();
                  openComposerWithPreload();
                }}
                className="luxury-dark-btn inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer"
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
              className="font-serif-editorial text-lg font-bold text-[#181411] hover:text-[#8E5B13] transition-colors cursor-pointer"
            >
              {latestJournal.title || '无标题觉察手记'}
            </h4>

            <p className="font-serif-editorial text-xs sm:text-sm text-[#443F39] italic border-l-2 border-[#B88635]/60 pl-3.5 leading-relaxed line-clamp-2">
              “{latestJournal.structuredData?.reframedPerspective ||
                latestJournal.structuredData?.tomorrowAnchor ||
                latestJournal.structuredData?.coreTakeaway ||
                (latestJournal.structuredData && Object.values(latestJournal.structuredData)[0]) ||
                '已记录完整思辨觉察。'}”
            </p>
          </div>
        ) : (
          <div className="art-museum-mat rounded-2xl p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#D4A656]/12 border border-[#D4A656]/30 flex items-center justify-center mx-auto text-[#8E5B13]">
              <PenLine className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-serif-editorial text-base font-bold text-[#181411]">
                今日情绪与思维尚未觉察复盘
              </h4>
              <p className="text-xs text-[#57514A] max-w-md mx-auto leading-relaxed">
                记录内心的第一缕微澜，选用结构化心理学模板破除主观偏误。
              </p>
            </div>
            <button
              onClick={() => {
                gameAudio.playTap();
                openComposerWithPreload();
              }}
              className="luxury-dark-btn inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>开启今日记录 (+50 XP)</span>
            </button>
          </div>
        )}
      </section>

      {/* 4. Featured Psychology Law of the Day (Lead Column) */}
      <section className="space-y-5">
        <div className="flex items-baseline justify-between pb-3 border-b border-stone-200/80">
          <div>
            <span className="editorial-kicker text-[10px] text-[#6E675F] block mb-0.5">
              02 · Daily Masterpiece
            </span>
            <h3 className="font-serif-editorial text-lg sm:text-xl font-bold text-[#181411] tracking-tight">
              今日精选心智艺术典藏
            </h3>
          </div>
          <button
            onClick={() => {
              gameAudio.playTap();
              navigate('/search');
            }}
            className="luxury-surface-btn px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer"
          >
            <span>探索全部 {laws.length} 篇画廊</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {featuredLaw && <PsychologyLawCard law={featuredLaw} />}
      </section>

      {/* 5. Popular Cognitive Experiments (Laboratory Section) */}
      <section className="space-y-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2 pb-3 border-b border-stone-200/80">
          <div>
            <span className="editorial-kicker text-[10px] text-[#6E675F] block mb-0.5">
              03 · Interactive Experiments
            </span>
            <h3 className="font-serif-editorial text-lg sm:text-xl font-bold text-[#181411] tracking-tight">
              热门心智认知实验工坊
            </h3>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                gameAudio.playTap();
                navigate('/brain-gym');
              }}
              className="luxury-surface-btn px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Zap className="w-3.5 h-3.5 text-[#8E5B13]" />
              <span>Brain Gym 记忆反应</span>
            </button>
            <button
              onClick={() => {
                gameAudio.playTap();
                navigate('/games');
              }}
              className="luxury-surface-btn px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>进入竞技场 ({PSYCHOLOGY_GAMES.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {PSYCHOLOGY_GAMES.slice(0, 2).map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      </section>

      {/* Horizontal Accordion Component: MindLabZ Cognitive Canvas */}
      <HorizontalAccordion
        scenario="laws"
        showScenarioTabs={true}
        title="心智定律与认知演进展廊"
        subtitle="横向手风琴交互 · 默认等宽窄条 · 点击展开变宽并延迟淡入详情，其余同步收窄"
      />

      {/* 6. Interactive Overlapping Card Stack Feature: Multiverse Knowledge Deck */}
      <section className="art-museum-mat rounded-2xl p-4 sm:p-7 md:p-9 space-y-5 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200/70">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#6E675F] font-medium mb-1">
              <span className="editorial-kicker text-[10px] text-[#8E5B13] font-bold tracking-widest">
                Interactive Overlapping Card Deck · 重叠式卡片组件
              </span>
              <span className="text-stone-300">/</span>
              <span className="font-serif-editorial italic text-[#57514A]">1/3 叠放 · 展开显名 · 平滑收回</span>
            </div>
            <h3 className="font-serif-editorial text-lg sm:text-xl font-bold text-[#181411] tracking-tight">
              多维认知智识卡组（覆盖 1/3 · 3 张叠放 + 剩余余量）
            </h3>
            <p className="text-xs text-[#57514A] mt-1 max-w-xl leading-relaxed">
              卡片之间相互覆盖约三分之一；收起时显示前三张和 +N 剩余数量；点击后依次平滑展开并显示完整名称；再次点击平滑收回。
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            <button
              onClick={() => {
                gameAudio.playTap();
                setIsStackLabOpen(true);
              }}
              className="luxury-surface-btn inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-[#8E5B13]" />
              <span>调试工坊 (Lab)</span>
            </button>
          </div>
        </div>

        {/* Live OverlappingCardStack Component with all 4 scenarios */}
        <div className="pt-1">
          <OverlappingCardStack
            scenario="courses"
            maxVisible={3}
            overlapRatio={1 / 3}
            size="md"
            layout="row"
            showScenarioTabs={true}
          />
        </div>
      </section>

      {/* 7. Museum Epigram Plaque (世界哲思金句艺术铭牌) */}
      <section className="editorial-card editorial-card-hover relative rounded-3xl p-8 sm:p-10 text-center space-y-4 bg-gradient-to-b from-[#FAF7F1] to-[#F2ECE0] border border-[#B88635]/20 shadow-sm overflow-hidden">
        <div className="w-9 h-9 rounded-full bg-[#D4A656]/12 border border-[#D4A656]/25 text-[#8E5B13] flex items-center justify-center mx-auto shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
          <Quote className="w-4 h-4 fill-[#8E5B13]/85" />
        </div>

        <span className="editorial-kicker text-[10px] text-[#6E675F] tracking-widest block font-bold">
          04 · Sagesse du Monde · 世界哲思金句
        </span>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeCitation.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-3 max-w-2xl mx-auto"
          >
            <blockquote className="font-serif-editorial text-base sm:text-lg text-[#181411] italic leading-relaxed">
              « {activeCitation.fr} »
            </blockquote>

            <p className="font-serif-editorial text-sm sm:text-base text-[#443F39] leading-relaxed">
              “{activeCitation.zh}”
            </p>

            <cite className="block text-xs text-[#6E675F] font-medium not-italic pt-1">
              — {activeCitation.authorFr}（{activeCitation.authorZh}）· {activeCitation.region}
            </cite>
          </motion.div>
        </AnimatePresence>
      </section>

      {/* Interactive Overlapping Stack Lab Modal */}
      <OverlappingStackLabModal
        isOpen={isStackLabOpen}
        onClose={() => setIsStackLabOpen(false)}
      />
    </div>
  );
};

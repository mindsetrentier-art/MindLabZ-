import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Flame, Play, Trophy, ArrowRight, BookOpen, Brain, Zap, HelpCircle, Target, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MasteryRing } from '../components/ui/MasteryRing';
import { PsychologyLawCard } from '../components/cards/PsychologyLawCard';
import { GameCard } from '../components/cards/GameCard';
import { Skeleton, HomeHeroSkeleton, LawCardSkeleton, GameCardSkeleton } from '../components/ui/Skeleton';
import { PSYCHOLOGY_GAMES } from '../data/games';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, laws, isDailyChallengeCompleted, setAiTutorOpen } = useApp();
  const [isLoading, setIsLoading] = useState(true);

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
    <div className="space-y-7 pb-6 animate-fadeIn">
      {/* 1. Top Daily Progress & Brain Mastery Hero Card */}
      <div className="relative art-hero-surface rounded-3xl p-6 overflow-hidden">
        {/* Subtle Architectural Geometric SVG Rings */}
        <svg
          className="absolute -right-12 -top-12 w-56 h-56 opacity-25 pointer-events-none"
          viewBox="0 0 200 200"
          fill="none"
        >
          <circle cx="100" cy="100" r="85" stroke="#DDD6FE" strokeWidth="1" strokeDasharray="4 4" />
          <circle cx="100" cy="100" r="60" stroke="#C4B5FD" strokeWidth="1" />
          <circle cx="100" cy="15" r="3" fill="#8B5CF6" />
          <circle cx="40" cy="100" r="2.5" fill="#F59E0B" />
        </svg>

        <div className="flex items-center justify-between gap-4 relative z-10">
          <div className="flex-1 space-y-2.5">
            {/* Clean Editorial Kicker */}
            <div className="flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-[#10B981] shadow-[0_0_8px_#10B981]" />
              <span className="font-bold text-[#532CD8] tracking-wide">今日认知节律</span>
              <span className="text-[#CBD5E1]" aria-hidden="true">·</span>
              <span className="font-serif-editorial italic text-[#64748B]">Daily Synthesis</span>
            </div>

            <h2 className="text-[22px] font-extrabold text-[#18181B] tracking-tight leading-snug">
              让思维更通透的 <br />
              <span className="bg-gradient-to-r from-[#532CD8] via-[#6C4CF1] to-[#9333EA] bg-clip-text text-transparent">
                10 分钟认知科学研习
              </span>
            </h2>

            <p className="text-xs text-[#64748B] font-medium leading-relaxed font-numeric">
              连续研习 <strong className="text-[#D97706] font-bold">{user.streak} 天</strong>
              <span className="mx-1.5 text-[#CBD5E1]">·</span>
              定律内化 <strong className="text-[#532CD8] font-bold">{user.lawsMastered.length} / {laws.length}</strong> 项
            </p>

            <div className="pt-1.5 flex items-center gap-2">
              <button
                onClick={() => navigate('/challenge')}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 btn-tactile whitespace-nowrap ${
                  isDailyChallengeCompleted
                    ? 'bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]'
                    : 'chameleon-btn hover:scale-[1.02]'
                }`}
              >
                {isDailyChallengeCompleted ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>今日挑战已达成</span>
                  </>
                ) : (
                  <>
                    <Target className="w-4 h-4" />
                    <span>开启今日挑战 (+500 XP)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Mastery Ring Graphic */}
          <div
            onClick={() => navigate('/progress')}
            className="cursor-pointer group shrink-0 transition-transform hover:scale-105"
            title="查看完整能力图谱"
          >
            <MasteryRing percentage={avgMastery} size={116} strokeWidth={8} />
          </div>
        </div>
      </div>

      {/* 2. Asymmetric Layered Bento Quick Action Grid */}
      <div className="grid grid-cols-2 gap-3.5">
        {/* Rapid Quiz Entry - Deep Royal Artistic Card */}
        <div
          onClick={() => navigate('/quiz')}
          className="group relative art-dark-banner text-white rounded-3xl p-5 hover:-translate-y-0.5 transition-all cursor-pointer overflow-hidden flex flex-col justify-between min-h-[146px]"
        >
          {/* Subtle decorative geometry */}
          <svg
            className="absolute -bottom-6 -right-6 w-28 h-28 opacity-15 group-hover:scale-110 transition-transform pointer-events-none"
            viewBox="0 0 100 100"
            fill="none"
          >
            <circle cx="50" cy="50" r="42" stroke="white" strokeWidth="1.5" strokeDasharray="3 3" />
            <circle cx="50" cy="50" r="26" stroke="white" strokeWidth="1.5" />
          </svg>

          <div className="flex justify-between items-start relative z-10">
            <span className="text-[11px] font-bold text-[#FDE68A] tracking-wide">
              快速思辨 · 10 题
            </span>
            <div className="w-8 h-8 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center">
              <HelpCircle className="w-4 h-4 text-white" />
            </div>
          </div>

          <div className="relative z-10 my-2">
            <h3 className="text-base font-extrabold leading-tight tracking-tight">心理快问快答</h3>
            <p className="text-[11px] text-white/75 mt-1 font-serif-editorial italic">Rapid Cognitive Quiz</p>
          </div>

          <div className="flex items-center text-xs font-bold text-[#FDE68A] gap-1 relative z-10">
            <span>立即进入</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Cognitive Games Entry - Alabaster Layered Card */}
        <div
          onClick={() => navigate('/games')}
          className="group art-card art-card-hover rounded-3xl p-5 cursor-pointer overflow-hidden flex flex-col justify-between min-h-[146px]"
        >
          <div className="absolute inset-0 bg-neural-grid opacity-45 pointer-events-none" />

          <div className="flex justify-between items-start relative z-10">
            <span className="text-[11px] font-bold text-[#6C4CF1] tracking-wide">
              交互实验 · 5 款
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#F5F3FF] border border-[#DDD6FE] flex items-center justify-center">
              <Brain className="w-4 h-4 text-[#6C4CF1]" />
            </div>
          </div>

          <div className="relative z-10 my-2">
            <h3 className="text-base font-extrabold text-[#18181B] leading-tight tracking-tight group-hover:text-[#6C4CF1] transition-colors">
              大脑训练竞技场
            </h3>
            <p className="text-[11px] text-[#64748B] mt-1 font-serif-editorial italic">Cognitive Lab Arena</p>
          </div>

          <div className="flex items-center text-xs font-bold text-[#532CD8] gap-1 relative z-10">
            <span>探索实验</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* 3. Featured Psychology Law of the Day */}
      <div className="space-y-3.5">
        <div className="flex items-baseline justify-between px-0.5">
          <div>
            <span className="text-[11px] font-bold text-[#6C4CF1] font-numeric tracking-wider block">
              01 · DAILY PRINCIPLE
            </span>
            <h3 className="text-base font-extrabold text-[#18181B] tracking-tight">
              今日精选心理学定律
            </h3>
          </div>
          <button
            onClick={() => navigate('/learn')}
            className="text-xs font-bold text-[#532CD8] hover:text-[#6C4CF1] flex items-center gap-1 btn-tactile whitespace-nowrap"
          >
            <span>全部 {laws.length} 项定律</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {featuredLaw && <PsychologyLawCard law={featuredLaw} />}
      </div>

      {/* 4. Popular Cognitive Mini-Games */}
      <div className="space-y-3.5">
        <div className="flex items-baseline justify-between px-0.5">
          <div>
            <span className="text-[11px] font-bold text-[#6C4CF1] font-numeric tracking-wider block">
              02 · INTERACTIVE EXPERIMENTS
            </span>
            <h3 className="text-base font-extrabold text-[#18181B] tracking-tight">
              热门大脑认知实验
            </h3>
          </div>
          <button
            onClick={() => navigate('/games')}
            className="text-xs font-bold text-[#532CD8] hover:text-[#6C4CF1] flex items-center gap-1 btn-tactile whitespace-nowrap"
          >
            <span>进入竞技场</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PSYCHOLOGY_GAMES.slice(0, 2).map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      </div>
    </div>
  );
};

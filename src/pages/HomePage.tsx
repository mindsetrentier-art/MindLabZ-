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
    <div className="space-y-6 pb-6 animate-fadeIn">
      {/* 1. Top Daily Progress & Brain Mastery Hero Card */}
      <div className="relative bg-white rounded-3xl p-6 border border-[#E6E2F5] shadow-[0_4px_20px_-2px_rgba(108,76,241,0.05)] overflow-hidden">
        {/* Glow Accent */}
        <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-[#6C4CF1]/8 blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 space-y-2.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-[#EDE9FE] text-[#6C4CF1] border border-[#DDD6FE]">
                今日认知状态 · 极佳
              </span>
            </div>

            <h2 className="text-xl font-extrabold text-[#18181B] tracking-tight leading-snug">
              让大脑更清醒的 <br />
              <span className="text-[#6C4CF1]">10 分钟心理学训练</span>
            </h2>

            <p className="text-xs text-[#64748B] font-medium leading-relaxed">
              连续坚持 <strong className="text-[#F59E0B] font-bold">{user.streak} 天</strong> · 心理学定律掌握 <strong className="text-[#6C4CF1] font-bold">{user.lawsMastered.length} / {laws.length}</strong> 项
            </p>

            <div className="pt-1 flex items-center gap-2">
              <button
                onClick={() => navigate('/challenge')}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 btn-press ${
                  isDailyChallengeCompleted
                    ? 'bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]'
                    : 'bg-[#6C4CF1] hover:bg-[#532CD8] text-white shadow-[0_4px_15px_rgba(108,76,241,0.3)]'
                }`}
              >
                {isDailyChallengeCompleted ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>今日挑战已达成</span>
                  </>
                ) : (
                  <>
                    <Target className="w-3.5 h-3.5" />
                    <span>开始今日挑战 (+500 XP)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Mastery Ring Graphic */}
          <div 
            onClick={() => navigate('/progress')}
            className="cursor-pointer group shrink-0"
            title="查看完整能力图谱"
          >
            <MasteryRing percentage={avgMastery} size={110} strokeWidth={9} />
          </div>
        </div>
      </div>

      {/* 2. Quick Action Grid (快问快答 & 今日实验) */}
      <div className="grid grid-cols-2 gap-3.5">
        {/* Rapid Quiz Entry */}
        <div
          onClick={() => navigate('/quiz')}
          className="group relative bg-gradient-to-br from-[#6C4CF1] to-[#532CD8] text-white rounded-3xl p-4 shadow-[0_8px_25px_rgba(108,76,241,0.25)] hover:shadow-[0_12px_32px_rgba(108,76,241,0.35)] hover:-translate-y-0.5 transition-all cursor-pointer overflow-hidden flex flex-col justify-between min-h-[135px]"
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold px-2 py-0.5 bg-white/20 rounded-full backdrop-blur-md">
              ⚡ 快速自测
            </span>
            <HelpCircle className="w-5 h-5 text-white/80" />
          </div>

          <div>
            <h3 className="text-base font-bold leading-tight">心理快问快答</h3>
            <p className="text-[11px] text-white/80 mt-0.5">10 题连击极限挑战</p>
          </div>

          <div className="flex items-center text-[11px] font-bold text-[#FDE68A] gap-1">
            <span>开始速答</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Cognitive Games Entry */}
        <div
          onClick={() => navigate('/games')}
          className="group relative bg-white border border-[#E6E2F5] rounded-3xl p-4 shadow-[0_4px_20px_-2px_rgba(108,76,241,0.05)] hover:shadow-[0_8px_25px_rgba(108,76,241,0.1)] hover:border-[#6C4CF1]/30 hover:-translate-y-0.5 transition-all cursor-pointer overflow-hidden flex flex-col justify-between min-h-[135px]"
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold px-2 py-0.5 bg-[#EDE9FE] text-[#6C4CF1] rounded-full border border-[#DDD6FE]">
              🧠 认知微游戏
            </span>
            <Brain className="w-5 h-5 text-[#6C4CF1]" />
          </div>

          <div>
            <h3 className="text-base font-bold text-[#18181B] leading-tight group-hover:text-[#6C4CF1] transition-colors">大脑训练竞技场</h3>
            <p className="text-[11px] text-[#64748B] mt-0.5">5 款交互实验与挑战</p>
          </div>

          <div className="flex items-center text-[11px] font-bold text-[#6C4CF1] gap-1">
            <span>进入游戏库</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* 3. Featured Psychology Law of the Day */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#F59E0B]" />
            <h3 className="text-base font-bold text-[#18181B]">今日精选心理学定律</h3>
          </div>
          <button
            onClick={() => navigate('/learn')}
            className="text-xs font-bold text-[#6C4CF1] hover:underline flex items-center gap-0.5 btn-press"
          >
            <span>全部 20 项定律</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {featuredLaw && <PsychologyLawCard law={featuredLaw} />}
      </div>

      {/* 4. Popular Cognitive Mini-Games */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#6C4CF1]" />
            <h3 className="text-base font-bold text-[#18181B]">热门大脑训练游戏</h3>
          </div>
          <button
            onClick={() => navigate('/games')}
            className="text-xs font-bold text-[#6C4CF1] hover:underline flex items-center gap-0.5 btn-press"
          >
            <span>查看全部</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {PSYCHOLOGY_GAMES.slice(0, 2).map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      </div>
    </div>
  );
};

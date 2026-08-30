import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Flame, Star, ArrowLeft, Sparkles, Brain } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface TopHeaderProps {
  title?: string;
  showBack?: boolean;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ title, showBack }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setAiTutorOpen } = useApp();

  return (
    <header className="fixed top-0 z-40 w-full max-w-7xl mx-auto flex justify-between items-center px-4 h-16 glass-header pt-safe">
      <div className="flex items-center gap-3">
        {showBack ? (
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/90 hover:bg-[#F5F3FF] border border-[#E6E2F5] transition-all btn-tactile text-[#18181B] shadow-xs"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 text-[#6C4CF1]" />
          </button>
        ) : (
          <div 
            onClick={() => navigate('/profile')}
            className="relative group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#6C4CF1] to-[#A855F7] p-0.5 shadow-[0_2px_12px_rgba(108,76,241,0.2)] group-hover:scale-105 transition-transform">
              <div className="w-full h-full rounded-full overflow-hidden bg-white">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            {/* Online / Active Pulse Dot */}
            <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#10B981] border-2 border-white shadow-xs" />
          </div>
        )}

        <div className="flex flex-col">
          {title ? (
            <h1 className="text-base md:text-lg font-extrabold text-[#18181B] tracking-tight">{title}</h1>
          ) : (
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-black tracking-tight bg-gradient-to-r from-[#6C4CF1] via-[#7C3AED] to-[#532CD8] bg-clip-text text-transparent font-['Inter']">
                  MindLabZ
                </span>
                <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-md bg-[#EDE9FE] text-[#6C4CF1] border border-[#DDD6FE]">
                  PRO
                </span>
              </div>
              <span className="text-[11px] font-medium text-[#64748B] tracking-wide flex items-center gap-1">
                <span>智心堂</span>
                <span className="text-[#CBD5E1]">·</span>
                <span className="font-['Noto_Sans_SC']">认知科学研习舍</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Gamification Stats Capsules */}
      <div className="flex items-center gap-2">
        {/* Streak Capsule */}
        <div 
          onClick={() => navigate('/progress')}
          className="flex items-center gap-1.5 bg-white/95 rounded-full px-3 py-1 shadow-xs border border-[#FDE68A]/80 hover:border-[#F59E0B] transition-all btn-tactile cursor-pointer"
          title="连续研习天数"
        >
          <Flame className="w-3.5 h-3.5 text-[#F59E0B] fill-[#F59E0B] animate-pulse" />
          <span className="text-xs font-bold text-[#18181B] font-['Inter']">
            {user.streak} <span className="text-[10px] text-[#64748B] font-normal">天</span>
          </span>
        </div>

        {/* XP Capsule */}
        <div 
          onClick={() => navigate('/progress')}
          className="flex items-center gap-1.5 bg-white/95 rounded-full px-3 py-1 shadow-xs border border-[#DDD6FE]/90 hover:border-[#6C4CF1] transition-all btn-tactile cursor-pointer"
          title="大脑训练经验"
        >
          <Star className="w-3.5 h-3.5 text-[#6C4CF1] fill-[#6C4CF1]" />
          <span className="text-xs font-black text-[#6C4CF1] font-['Inter']">
            {user.xp.toLocaleString()} <span className="text-[10px] text-[#7C3AED] font-semibold">XP</span>
          </span>
        </div>

        {/* AI Tutor Icon */}
        <button
          onClick={() => setAiTutorOpen(true)}
          className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#6C4CF1] to-[#532CD8] text-white flex items-center justify-center shadow-[0_4px_14px_rgba(108,76,241,0.35)] hover:scale-105 transition-all btn-tactile"
          title="咨询 AI 导师"
        >
          <Sparkles className="w-4 h-4 text-white" />
        </button>
      </div>
    </header>
  );
};


import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Flame, Star, ArrowLeft, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ChameleonColorControl } from '../ui/ChameleonColorPopover';

interface TopHeaderProps {
  title?: string;
  showBack?: boolean;
  hasTopBar?: boolean;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ title, showBack, hasTopBar = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, firebaseUser, isSyncing, loginWithGoogle, setAiTutorOpen } = useApp();

  return (
    <header
      className={`fixed left-0 right-0 z-40 glass-header backdrop-blur-[20px] transition-all duration-300 ${
        hasTopBar ? 'top-11 pt-1' : 'top-0 pt-safe'
      }`}
    >
      <div className="w-full max-w-md md:max-w-xl lg:max-w-2xl mx-auto flex justify-between items-center gap-2 px-3.5 sm:px-4 h-16">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          {showBack ? (
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-2xl flex items-center justify-center glass-pill hover:bg-white/85 transition-all btn-tactile text-[#18181B]"
              aria-label="Back"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-[#6C4CF1]" />
            </button>
          ) : (
            <div
              onClick={() => navigate('/profile')}
              className="relative group cursor-pointer shrink-0"
              title={firebaseUser ? `已连接 Google 账号 (${firebaseUser.email || user.name})` : '前往个人中心连接 Firebase 云端'}
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-[#6C4CF1] to-[#A855F7] p-0.5 shadow-[0_4px_14px_rgba(108,76,241,0.22)] group-hover:scale-105 transition-transform">
                <div className="w-full h-full rounded-full overflow-hidden bg-white">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              {/* Online / Firebase Cloud Status Dot */}
              <div
                className={`absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full border-2 border-white shadow-xs ${
                  firebaseUser
                    ? isSyncing
                      ? 'bg-[#F59E0B] animate-pulse'
                      : 'bg-[#10B981]'
                    : 'bg-[#94A3B8]'
                }`}
              />
            </div>
          )}

          <div className="flex flex-col min-w-0">
            {title ? (
              <h1 className="font-serif-editorial text-[13px] sm:text-[15px] md:text-base font-bold tracking-[0.06em] bg-gradient-to-r from-[#1E1B4B] via-[#4C1D95] to-[#6C4CF1] bg-clip-text text-transparent whitespace-nowrap truncate leading-tight drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">
                {title}
              </h1>
            ) : (
              <div className="flex flex-col min-w-0">
                <span className="font-serif-editorial text-[14px] sm:text-base md:text-lg font-bold tracking-[0.04em] bg-gradient-to-r from-[#2E1065] via-[#532CD8] to-[#7C3AED] bg-clip-text text-transparent leading-tight whitespace-nowrap truncate">
                  MindLabZ · 智心堂
                </span>
                <span className="text-[10px] sm:text-[11px] font-medium text-[#64748B]/90 tracking-wider whitespace-nowrap truncate">
                  认知科学与心理学研习舍
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Gamification Stats & Quick Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Discreet 240-Color 30s Auto-Cycle Control */}
          <ChameleonColorControl />

          {/* Streak Action Button */}
          <button
            onClick={() => navigate('/progress')}
            className="flex items-center gap-1.5 glass-pill rounded-xl px-2.5 py-1.5 hover:bg-white/85 hover:border-[#F59E0B]/50 transition-all btn-tactile cursor-pointer"
            title="连续研习天数"
          >
            <Flame className="w-3.5 h-3.5 text-[#F59E0B] fill-[#F59E0B]" />
            <span className="text-xs font-bold text-[#18181B] font-numeric whitespace-nowrap">
              {user.streak} <span className="text-[10px] text-[#64748B] font-medium">天</span>
            </span>
          </button>

          {/* XP Action Button */}
          <button
            onClick={() => navigate('/progress')}
            className="flex items-center gap-1.5 glass-pill rounded-xl px-2.5 py-1.5 hover:bg-white/85 transition-all btn-tactile cursor-pointer chameleon-border-subtle"
            title="大脑训练经验"
          >
            <Star className="w-3.5 h-3.5 chameleon-text fill-current" />
            <span className="text-xs font-extrabold chameleon-text font-numeric whitespace-nowrap">
              {user.xp.toLocaleString()} <span className="text-[10px] opacity-85 font-semibold">XP</span>
            </span>
          </button>

          {/* AI Tutor Icon (Discreetly shifts color every 30s) */}
          <button
            onClick={() => setAiTutorOpen(true)}
            className="w-9 h-9 rounded-2xl chameleon-btn flex items-center justify-center hover:scale-105 transition-all btn-tactile"
            title="咨询 AI 导师"
          >
            <Sparkles className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};


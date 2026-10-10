import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Flame, Star, ArrowLeft, Sparkles, Wind } from 'lucide-react';
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
  const { user, firebaseUser, isSyncing, loginWithGoogle, setAiTutorOpen, setBreathingOpen } = useApp();

  return (
    <header
      className={`fixed left-0 right-0 z-40 glass-header backdrop-blur-md transition-all duration-300 ${
        hasTopBar ? 'top-11 pt-0.5' : 'top-0 pt-safe'
      }`}
    >
      <div className="w-full max-w-2xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto flex justify-between items-center gap-4 px-5 sm:px-8 md:px-10 lg:px-12 h-16">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {showBack ? (
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center bg-white border border-stone-200/80 hover:border-stone-400 transition-colors btn-tactile text-stone-800"
              aria-label="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          ) : (
            <div
              onClick={() => navigate('/profile')}
              className="relative group cursor-pointer shrink-0"
              title={firebaseUser ? `已连接 Google 账号 (${firebaseUser.email || user.name})` : '前往个人中心连接 Firebase 云端'}
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-stone-300/80 p-0.5 group-hover:border-stone-500 transition-colors">
                <div className="w-full h-full rounded-full overflow-hidden bg-stone-100">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              {/* Online / Firebase Cloud Status Dot (Minimalist) */}
              <div
                className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
                  firebaseUser
                    ? isSyncing
                      ? 'bg-amber-500'
                      : 'bg-emerald-600'
                    : 'bg-stone-400'
                }`}
              />
            </div>
          )}

          <div className="flex flex-col min-w-0">
            {title ? (
              <div className="flex items-center gap-2 min-w-0">
                <span className="editorial-kicker text-[10px] hidden sm:inline">Article /</span>
                <h1 className="font-serif-editorial text-[15px] sm:text-base md:text-lg font-bold text-stone-900 tracking-tight whitespace-nowrap truncate leading-tight">
                  {title}
                </h1>
              </div>
            ) : (
              <div className="flex flex-col min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="font-serif-editorial text-base sm:text-lg font-bold text-stone-900 tracking-tight whitespace-nowrap truncate leading-tight">
                    MindLabZ · 智心堂
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-stone-600 hidden md:inline">
                    No. 100
                  </span>
                </div>
                <span className="text-[10px] tracking-wider text-stone-700 font-medium whitespace-nowrap truncate mt-0.5">
                  认知科学与心理学研习 · 典藏特刊
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Gamification Stats & Quick Actions (Clean Unboxed Editorial Metadata) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Discreet 240-Color 30s Auto-Cycle Control */}
          <ChameleonColorControl />

          {/* Streak Indicator */}
          <button
            onClick={() => navigate('/progress')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-stone-200/50 transition-colors btn-tactile cursor-pointer text-stone-800"
            title="连续研习天数"
          >
            <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-600" />
            <span className="text-xs font-semibold font-numeric whitespace-nowrap">
              {user.streak} <span className="text-[10px] text-stone-600 font-normal">天</span>
            </span>
          </button>

          {/* XP Indicator */}
          <button
            onClick={() => navigate('/progress')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-stone-200/50 transition-colors btn-tactile cursor-pointer text-stone-800"
            title="大脑训练经验"
          >
            <Star className="w-3.5 h-3.5 text-stone-600 fill-stone-400" />
            <span className="text-xs font-semibold font-numeric whitespace-nowrap">
              {user.xp.toLocaleString()} <span className="text-[10px] text-stone-600 font-normal">XP</span>
            </span>
          </button>

          {/* Focused Breathing Quick Action */}
          <button
            onClick={() => setBreathingOpen(true)}
            className="w-8 h-8 rounded-full bg-white border border-stone-200/90 text-stone-700 hover:text-stone-900 hover:border-stone-400 flex items-center justify-center transition-transform hover:scale-105 btn-tactile cursor-pointer"
            title="开启专注呼吸觉察调节"
            aria-label="专注呼吸调节"
          >
            <Wind className="w-3.5 h-3.5" />
          </button>

          {/* AI Tutor Icon */}
          <button
            onClick={() => setAiTutorOpen(true)}
            className="w-8 h-8 rounded-full chameleon-btn flex items-center justify-center transition-transform hover:scale-105 btn-tactile"
            title="咨询 AI 认知导师"
          >
            <Sparkles className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};


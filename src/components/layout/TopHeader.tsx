import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Flame, Star, ArrowLeft, Sparkles, Wind, Cloud, Search } from 'lucide-react';
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
  const { user, firebaseUser, isSyncing, openAuthModal, openPwaModal, openSearchModal, setAiTutorOpen, setBreathingOpen } = useApp();

  return (
    <header
      className={`fixed left-0 right-0 z-40 glass-header backdrop-blur-md transition-all duration-300 ${
        hasTopBar ? 'top-9 sm:top-10 pt-0.5' : 'top-0 pt-safe'
      }`}
    >
      <div className="w-full max-w-2xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto flex justify-between items-center gap-2 sm:gap-4 px-3 sm:px-6 md:px-10 lg:px-12 h-14 sm:h-16">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
          {showBack ? (
            <button
              onClick={() => navigate(-1)}
              className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-full flex items-center justify-center luxury-surface-btn text-stone-800 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900"
              aria-label="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          ) : (
            <div
              onClick={() => navigate('/profile')}
              className="relative group cursor-pointer shrink-0"
              title={firebaseUser ? `已连接 Google 账号 (${firebaseUser.email || user?.name || 'Explorateur MindLabZ'})` : '前往个人中心连接 Firebase 云端'}
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-stone-300/80 p-0.5 group-hover:border-stone-500 transition-colors">
                <div className="w-full h-full rounded-full overflow-hidden bg-stone-100">
                  <img
                    src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80'}
                    alt={user?.name || 'Explorateur MindLabZ'}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              {/* Online / Firebase Cloud Status Dot (Minimalist) */}
              <div
                className={`absolute bottom-0 right-0 w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full border-2 border-white ${
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
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="editorial-kicker text-[10px] hidden sm:inline">Article /</span>
                <h1 className="font-serif-editorial text-[14px] sm:text-base md:text-lg font-bold text-stone-900 tracking-tight whitespace-nowrap truncate leading-tight">
                  {title}
                </h1>
              </div>
            ) : (
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div
                    onClick={openPwaModal}
                    className="w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg overflow-hidden border border-amber-400/40 p-0.5 bg-stone-900 shadow-xs cursor-pointer hover:scale-105 transition-transform shrink-0"
                    title="Installer l'icône de l'application sur votre écran d'accueil"
                  >
                    <img
                      src="/app-icon.png"
                      alt="MindLabZ App Icon"
                      className="w-full h-full object-cover rounded-xs sm:rounded-md"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <span className="font-serif-editorial text-sm sm:text-base md:text-lg font-bold text-stone-900 tracking-tight whitespace-nowrap truncate leading-tight">
                    MindLabZ · 智心堂
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-stone-600 hidden md:inline">
                    No. 100
                  </span>
                </div>
                <span className="text-[9.5px] sm:text-[10px] tracking-wider text-stone-600 font-medium whitespace-nowrap truncate mt-0.5">
                  认知科学与心理学研习 · 典藏特刊
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Gamification Stats & Quick Actions (Clean Unboxed Editorial Metadata & Luxury Small Buttons) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Global Lunr.js Search Trigger (Cmd/Ctrl + K) */}
          <button
            type="button"
            onClick={openSearchModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl luxury-surface-btn text-stone-800 cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900"
            title="全局全文检索定律库与竞技场 (⌘K / Ctrl+K)"
            aria-label="全局全文检索"
          >
            <Search className="w-3.5 h-3.5 text-[#A66C1E] shrink-0" />
            <span className="text-[11px] font-semibold hidden md:inline">检索</span>
            <span className="text-[10px] font-mono text-stone-400 hidden lg:inline">⌘K</span>
          </button>

          {/* Cloud Auth / Google Connection Trigger */}
          <button
            onClick={openAuthModal}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all btn-tactile cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 ${
              firebaseUser
                ? 'bg-gradient-to-b from-emerald-50/90 to-emerald-100/60 border-emerald-700/20 text-emerald-900 hover:border-emerald-700/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]'
                : 'luxury-surface-btn text-stone-700'
            }`}
            title={
              firebaseUser
                ? `Connecté à Firebase (${firebaseUser.email || 'Cloud Invité'})`
                : 'Se connecter avec Google / Firebase Cloud'
            }
            aria-label="Connexion Google Firebase"
          >
            <Cloud
              className={`w-3.5 h-3.5 ${
                firebaseUser
                  ? isSyncing
                    ? 'text-amber-600 animate-pulse'
                    : 'text-emerald-700'
                  : 'text-stone-500'
              }`}
            />
            <span className="text-[11px] font-semibold whitespace-nowrap hidden sm:inline">
              {firebaseUser
                ? firebaseUser.isAnonymous
                  ? 'Cloud Invité'
                  : 'Google Cloud'
                : 'Connexion'}
            </span>
          </button>

          {/* Discreet 240-Color 30s Auto-Cycle Control */}
          <ChameleonColorControl />

          {/* Streak Indicator */}
          <button
            onClick={() => navigate('/progress')}
            className="flex items-center gap-1 px-2 py-1.5 rounded-xl hover:bg-stone-900/[0.045] transition-colors btn-tactile cursor-pointer text-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900"
            title="连续研习天数"
          >
            <Flame className="w-3.5 h-3.5 text-[#B87314] fill-[#D4A656]" />
            <span className="text-xs font-semibold font-numeric whitespace-nowrap">
              {user.streak} <span className="text-[10px] text-stone-500 font-normal hidden sm:inline">天</span>
            </span>
          </button>

          {/* XP Indicator (Visible on medium screens and up) */}
          <button
            onClick={() => navigate('/progress')}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-stone-900/[0.045] transition-colors btn-tactile cursor-pointer text-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900"
            title="大脑训练经验"
          >
            <Star className="w-3.5 h-3.5 text-[#8A7F72] fill-[#D4A656]/55" />
            <span className="text-xs font-semibold font-numeric whitespace-nowrap">
              {user.xp.toLocaleString()} <span className="text-[10px] text-stone-500 font-normal">XP</span>
            </span>
          </button>

          {/* Focused Breathing Quick Action (Visible on tablet & desktop) */}
          <button
            onClick={() => setBreathingOpen(true)}
            className="hidden sm:flex w-8 h-8 rounded-full luxury-surface-btn text-stone-700 items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900"
            title="开启专注呼吸觉察调节"
            aria-label="专注呼吸调节"
          >
            <Wind className="w-3.5 h-3.5" />
          </button>

          {/* AI Tutor Icon */}
          <button
            onClick={() => setAiTutorOpen(true)}
            className="w-8 h-8 rounded-full chameleon-btn flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-stone-900"
            title="咨询 AI 认知导师"
            aria-label="咨询 AI 认知导师"
          >
            <Sparkles className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};


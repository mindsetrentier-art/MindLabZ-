import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { TopHeader } from './TopHeader';
import { TopGeoTimeWeatherBar } from './TopGeoTimeWeatherBar';
import { BottomNavigation } from './BottomNavigation';
import { AITutorModal } from '../ui/AITutorModal';
import { Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const location = useLocation();
  const { setAiTutorOpen } = useApp();
  const [geoBarVisible, setGeoBarVisible] = useState<boolean>(true);
  const [geoBarExpanded, setGeoBarExpanded] = useState<boolean>(false);

  // Determine if we should show back button or special title in header
  const getHeaderConfig = () => {
    const path = location.pathname;
    if (path === '/' || path === '') return { showBack: false };
    if (path === '/learn' || path === '/search') return { title: '心智定律库 · 艺术典藏', showBack: false };
    if (path === '/games') return { title: '认知训练游戏', showBack: false };
    if (path === '/quiz') return { title: '心理快问快答', showBack: false };
    if (path === '/progress') return { title: '认知能力图谱', showBack: true };
    if (path === '/assessment' || path === '/cognitive-assessment') return { title: '认知能力多维评估', showBack: true };
    if (path === '/profile') return { title: '个人中心', showBack: false };
    if (path.startsWith('/law/')) return { title: '心理学定律解析', showBack: true };
    if (path.startsWith('/game/')) return { title: '认知竞技场', showBack: true };
    if (path === '/challenge') return { title: '今日挑战', showBack: true };
    return { showBack: true };
  };

  const headerConfig = getHeaderConfig();
  const isPlayingGame = location.pathname.startsWith('/game/') || location.pathname === '/challenge';

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1C1917] flex flex-col items-center justify-start antialiased selection:bg-[#532CD8]/15 selection:text-[#532CD8] relative overflow-x-hidden">
      {/* 1. Subtle Editorial Paper Grain & Atmospheric Restraint */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute inset-0 bg-paper-grid opacity-70" />
      </div>

      {/* 2. Main Responsive Shell (Generous Whitespace & Editorial Balance) */}
      <div className="w-full max-w-2xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl min-h-screen flex flex-col relative z-10 bg-transparent pb-36">
        {/* Top Edge Bar: Date, Live Time, High-Precision GPS Location, Real-Time Weather & Temp (Auto-hides after 5s unless clicked) */}
        <TopGeoTimeWeatherBar
          onVisibilityChange={(visible, expanded) => {
            setGeoBarVisible(visible);
            setGeoBarExpanded(expanded);
          }}
        />

        {/* Top Header (Editorial Glass Header) */}
        <TopHeader
          title={headerConfig.title}
          showBack={headerConfig.showBack}
          hasTopBar={geoBarVisible}
        />

        {/* Dynamic Route Content with Generous Responsive Spacing */}
        <main
          className={`flex-1 w-full px-3.5 sm:px-6 md:px-10 lg:px-12 transition-all duration-300 ${
            geoBarVisible ? (geoBarExpanded ? 'pt-64' : 'pt-24 sm:pt-28') : 'pt-16 sm:pt-20'
          }`}
        >
          {children}
        </main>

        {/* Floating Action Button: AI Tutor Editorial Jewel (Mobile-Adaptive) */}
        {!isPlayingGame && (
          <button
            onClick={() => setAiTutorOpen(true)}
            className="fixed right-4 sm:right-6 md:right-10 bottom-20 sm:bottom-24 z-30 group flex items-center justify-center gap-1.5 sm:gap-2 w-11 h-11 sm:w-auto sm:h-auto sm:px-4 sm:py-2.5 rounded-full chameleon-btn transition-all btn-tactile shadow-lg border border-white/20 active:scale-95 cursor-pointer"
            title="咨询 AI 认知导师"
            aria-label="咨询 AI 认知导师"
          >
            <Sparkles className="w-4 h-4 shrink-0" />
            <span className="text-xs font-semibold tracking-wide hidden sm:inline">AI 认知导师</span>
          </button>
        )}

        {/* Bottom Navigation */}
        <BottomNavigation />

        {/* AI Tutor Modal Dialog */}
        <AITutorModal />
      </div>
    </div>
  );
};


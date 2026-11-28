import React, { useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { TopHeader } from './TopHeader';
import { TopGeoTimeWeatherBar } from './TopGeoTimeWeatherBar';
import { BottomNavigation } from './BottomNavigation';
import { AITutorModal } from '../ui/AITutorModal';
import { Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';

import { TopSummaryPullDrawer } from './TopSummaryPullDrawer';
import { DailyLawPushNotification } from './DailyLawPushNotification';
import { CognitiveWarmupModal } from './CognitiveWarmupModal';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const location = useLocation();
  const { setAiTutorOpen } = useApp();
  const [geoBarVisible, setGeoBarVisible] = useState<boolean>(true);
  const [geoBarExpanded, setGeoBarExpanded] = useState<boolean>(false);
  const [warmupDone, setWarmupDone] = useState<boolean>(false);

  const handleGeoVisibilityChange = useCallback((visible: boolean, expanded: boolean) => {
    setGeoBarVisible((prev) => (prev === visible ? prev : visible));
    setGeoBarExpanded((prev) => (prev === expanded ? prev : expanded));
  }, []);

  const handleWarmupComplete = useCallback(() => {
    setWarmupDone(true);
  }, []);

  // Determine if we should show back button or special title in header
  const getHeaderConfig = () => {
    const path = location.pathname;
    if (path === '/' || path === '') return { showBack: false };
    if (path === '/learn' || path === '/search') return { title: '心智定律库 · 艺术典藏', showBack: false };
    if (path === '/knowledge-graph') return { title: '心理定律知识图谱', showBack: true };
    if (path === '/games') return { title: '认知训练游戏', showBack: false };
    if (path === '/brain-gym') return { title: 'Brain Gym · 记忆与反应训练馆', showBack: true };
    if (path === '/quiz') return { title: '心理快问快答', showBack: false };
    if (path === '/progress') return { title: '认知能力图谱', showBack: true };
    if (path === '/assessment' || path === '/cognitive-assessment') return { title: '认知能力多维评估', showBack: true };
    if (path === '/profile') return { title: '个人中心', showBack: false };
    if (path.startsWith('/law/')) return { title: '心理学定律解析', showBack: true };
    if (path.startsWith('/game/')) return { title: '认知竞技场', showBack: true };
    if (path === '/challenge') return { title: '今日挑战', showBack: true };
    if (path === '/focus-audio') return { title: '专注声学实验室', showBack: true };
    if (path === '/review') return { title: '收藏定律 · 间隔复习排期', showBack: true };
    return { showBack: true };
  };

  const headerConfig = getHeaderConfig();
  const isPlayingGame = location.pathname.startsWith('/game/') || location.pathname === '/challenge';

  return (
    <div className="min-h-screen bg-[#F6F3EC] text-[#181411] flex flex-col items-center justify-start antialiased selection:bg-[#5B45B8]/15 selection:text-[#3E2C8A] relative overflow-x-hidden">
      {/* 1. Editorial Cotton-Paper Grain & Subtle Dynamic Chromatic Aura */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="absolute inset-x-0 top-0 h-[520px] transition-colors duration-1000"
          style={{
            background:
              'radial-gradient(ellipse 85% 380px at 50% -40px, var(--chameleon-soft), transparent 72%)',
          }}
        />
        <div className="absolute inset-0 bg-paper-grid opacity-65" />
      </div>

      {/* 2. Main Responsive Shell (Generous Whitespace & Editorial Balance) */}
      <div className="w-full max-w-2xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl min-h-screen flex flex-col relative z-10 bg-transparent pb-36">
        {/* Top Edge Bar: Date, Live Time, High-Precision GPS Location, Real-Time Weather & Temp (Auto-hides after 5s unless clicked) */}
        <TopGeoTimeWeatherBar onVisibilityChange={handleGeoVisibilityChange} />

        {/* Top Header (Editorial Glass Header) */}
        <TopHeader
          title={headerConfig.title}
          showBack={headerConfig.showBack}
          hasTopBar={geoBarVisible}
        />

        {/* Launch Cognitive Warmup (30-second Logic/Pattern Task right before Daily Law Notification) */}
        <CognitiveWarmupModal
          isPlayingGame={isPlayingGame}
          onComplete={handleWarmupComplete}
        />

        {/* Simulated Daily Push Notification ("Law of the Day") revealed right after Warmup */}
        <DailyLawPushNotification
          isPlayingGame={isPlayingGame}
          hasTopBar={geoBarVisible}
          canReveal={warmupDone}
        />

        {/* Dynamic Route Content with Generous Responsive Spacing */}
        <main
          className={`flex-1 w-full px-3.5 sm:px-6 md:px-10 lg:px-12 transition-all duration-300 ${
            geoBarVisible ? (geoBarExpanded ? 'pt-64' : 'pt-24 sm:pt-28') : 'pt-16 sm:pt-20'
          }`}
        >
          {/* Top Pull-Down Expandable Summary Drawer (收起为胶囊，下拉跟手展开并下移变暗) */}
          <TopSummaryPullDrawer isPlayingGame={isPlayingGame} />

          {/* Page Route Content */}
          <div className="relative w-full">
            {children}
          </div>
        </main>

        {/* Floating Action Button: AI Tutor Editorial Jewel (Mobile-Adaptive) */}
        {!isPlayingGame && (
          <button
            onClick={() => setAiTutorOpen(true)}
            className="fixed right-4 sm:right-6 md:right-10 bottom-20 sm:bottom-24 z-30 group flex items-center justify-center gap-1.5 sm:gap-2 w-11 h-11 sm:w-auto sm:h-auto sm:px-4 sm:py-2.5 rounded-full chameleon-btn transition-all btn-tactile shadow-lg cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-stone-900"
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


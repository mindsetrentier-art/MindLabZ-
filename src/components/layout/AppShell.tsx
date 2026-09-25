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
    if (path === '/') return { showBack: false };
    if (path === '/learn') return { title: '心理学定律库', showBack: false };
    if (path === '/games') return { title: '认知训练游戏', showBack: false };
    if (path === '/quiz') return { title: '心理快问快答', showBack: false };
    if (path === '/progress') return { title: '认知能力图谱', showBack: true };
    if (path === '/profile') return { title: '个人中心', showBack: false };
    if (path.startsWith('/law/')) return { title: '心理学定律解析', showBack: true };
    if (path.startsWith('/game/')) return { title: '认知竞技场', showBack: true };
    if (path === '/challenge') return { title: '今日挑战', showBack: true };
    return { showBack: true };
  };

  const headerConfig = getHeaderConfig();
  const isPlayingGame = location.pathname.startsWith('/game/') || location.pathname === '/challenge';

  return (
    <div className="min-h-screen bg-[#F7F5FD] text-[#18181B] flex flex-col items-center justify-start antialiased selection:bg-[#6C4CF1]/20 selection:text-[#6C4CF1] relative overflow-x-hidden">
      {/* 1. Atmospheric Ambient Gradients & Subtle Grid */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Soft Neural Grid Overlay */}
        <div className="absolute inset-0 bg-neural-grid opacity-55" />

        {/* Luminous Atmospheric Aura Blobs for Glass Refraction */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[720px] h-[380px] bg-gradient-to-b from-[#DDD6FE]/65 via-[#EDE9FE]/35 to-transparent rounded-full blur-[110px] animate-aura-pulse" />
        <div className="absolute top-[32%] -left-28 w-[420px] h-[420px] bg-gradient-to-tr from-[#6C4CF1]/10 to-[#A855F7]/6 rounded-full blur-[130px]" />
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[560px] h-[260px] bg-gradient-to-t from-[#DDD6FE]/50 via-[#FDE68A]/15 to-transparent rounded-full blur-[100px]" />
      </div>

      {/* 2. Main Responsive Shell */}
      <div className="w-full max-w-md md:max-w-xl lg:max-w-2xl min-h-screen flex flex-col relative z-10 bg-transparent pb-28">
        {/* Top Edge Bar: Date, Live Time, High-Precision GPS Location, Real-Time Weather & Temp (Auto-hides after 5s unless clicked) */}
        <TopGeoTimeWeatherBar
          onVisibilityChange={(visible, expanded) => {
            setGeoBarVisible(visible);
            setGeoBarExpanded(expanded);
          }}
        />

        {/* Top Header (Frosted Glass blur(20px)) */}
        <TopHeader
          title={headerConfig.title}
          showBack={headerConfig.showBack}
          hasTopBar={geoBarVisible}
        />

        {/* Dynamic Route Content */}
        <main
          className={`flex-1 w-full px-4 transition-all duration-300 ${
            geoBarVisible ? (geoBarExpanded ? 'pt-52' : 'pt-28') : 'pt-20'
          }`}
        >
          {children}
        </main>

        {/* Floating Action Button: AI Tutor Jewel (Discreetly shifts color every 30s) */}
        {!isPlayingGame && (
          <button
            onClick={() => setAiTutorOpen(true)}
            className="fixed right-5 bottom-24 z-30 group flex items-center gap-2.5 px-4 py-2.5 rounded-full chameleon-btn hover:scale-105 transition-all btn-tactile backdrop-blur-[20px]"
            title="咨询 AI 认知导师"
          >
            <div className="relative">
              <Sparkles className="w-4 h-4 transition-transform group-hover:rotate-12" />
            </div>
            <span className="text-xs font-bold tracking-tight">AI 认知导师</span>
          </button>
        )}

        {/* Bottom Navigation (Frosted Glass blur(20px)) */}
        <BottomNavigation />

        {/* AI Tutor Modal Dialog */}
        <AITutorModal />
      </div>
    </div>
  );
};


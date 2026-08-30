import React from 'react';
import { useLocation } from 'react-router-dom';
import { TopHeader } from './TopHeader';
import { BottomNavigation } from './BottomNavigation';
import { AITutorModal } from '../ui/AITutorModal';
import { Sparkles, Brain } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const location = useLocation();
  const { setAiTutorOpen } = useApp();

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
        <div className="absolute inset-0 bg-neural-grid opacity-60" />

        {/* Luminous Atmospheric Aura Blobs */}
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[420px] bg-gradient-to-b from-[#EDE9FE]/70 via-[#DDD6FE]/30 to-transparent rounded-full blur-[130px] animate-aura-pulse" />
        <div className="absolute top-[35%] -left-32 w-[450px] h-[450px] bg-gradient-to-tr from-[#6C4CF1]/8 to-[#A855F7]/5 rounded-full blur-[140px]" />
        <div className="absolute bottom-24 -right-32 w-[480px] h-[480px] bg-gradient-to-tl from-[#F59E0B]/8 to-[#EC4899]/5 rounded-full blur-[140px]" />
      </div>

      {/* 2. Main Responsive Shell */}
      <div className="w-full max-w-md md:max-w-xl lg:max-w-2xl min-h-screen flex flex-col relative z-10 bg-transparent pb-24">
        {/* Top Header */}
        <TopHeader title={headerConfig.title} showBack={headerConfig.showBack} />

        {/* Dynamic Route Content */}
        <main className="flex-1 w-full pt-20 px-4">
          {children}
        </main>

        {/* Floating Action Button: AI Tutor Jewel */}
        {!isPlayingGame && (
          <button
            onClick={() => setAiTutorOpen(true)}
            className="fixed right-5 bottom-24 z-30 group flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-gradient-to-r from-[#6C4CF1] via-[#7C3AED] to-[#532CD8] text-white shadow-[0_10px_28px_rgba(108,76,241,0.38)] hover:shadow-[0_14px_36px_rgba(108,76,241,0.48)] hover:scale-105 transition-all btn-tactile border border-white/30 backdrop-blur-md"
            title="咨询 AI 认知导师"
          >
            <div className="relative">
              <Sparkles className="w-4 h-4 text-[#FDE68A] transition-transform group-hover:rotate-12" />
              <div className="absolute -inset-1 bg-[#FDE68A]/30 rounded-full blur-xs opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="text-xs font-bold tracking-tight">AI 认知导师</span>
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


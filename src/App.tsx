import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { ThemeColorProvider } from './context/ThemeColorContext';
import { AppShell } from './components/layout/AppShell';
import { HomePage } from './pages/HomePage';
import { LearnPage } from './pages/LearnPage';
import { LawDetailPage } from './pages/LawDetailPage';
import { GamesPage } from './pages/GamesPage';
import { GamePlayPage } from './pages/GamePlayPage';
import { RapidQuizPage } from './pages/RapidQuizPage';
import { DailyChallengePage } from './pages/DailyChallengePage';
import { ProgressPage } from './pages/ProgressPage';
import { ProfilePage } from './pages/ProfilePage';
import { JournalPage } from './pages/JournalPage';
import { BreathingPage } from './pages/BreathingPage';
import { OnboardingModal } from './pages/OnboardingModal';
import { JournalComposerModal } from './components/journal/JournalComposerModal';
import { FocusedBreathingModal } from './components/breathing/FocusedBreathingModal';
import { GoogleAuthModal } from './components/auth/GoogleAuthModal';

const AppRoutes: React.FC = () => {
  const {
    user,
    composerOpen,
    setComposerOpen,
    composerPreload,
    breathingOpen,
    setBreathingOpen,
  } = useApp();
  const [showOnboarding, setShowOnboarding] = useState(false);

  return (
    <>
      <AppShell>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/learn" element={<LearnPage />} />
          <Route path="/law/:id" element={<LawDetailPage />} />
          <Route path="/journal" element={<JournalPage />} />
          <Route path="/breathing" element={<BreathingPage />} />
          <Route path="/games" element={<GamesPage />} />
          <Route path="/game/:id" element={<GamePlayPage />} />
          <Route path="/quiz" element={<RapidQuizPage />} />
          <Route path="/challenge" element={<DailyChallengePage />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </AppShell>

      <FocusedBreathingModal
        isOpen={breathingOpen}
        onClose={() => setBreathingOpen(false)}
      />

      <JournalComposerModal
        isOpen={composerOpen}
        onClose={() => setComposerOpen(false)}
        initialEntry={composerPreload}
      />

      <GoogleAuthModal />

      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
      />
    </>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <ThemeColorProvider>
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </ThemeColorProvider>
    </BrowserRouter>
  );
}

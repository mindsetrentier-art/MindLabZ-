import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { ThemeColorProvider } from './context/ThemeColorContext';
import { BiometricLockProvider, useBiometricLock } from './context/BiometricLockContext';
import { AppShell } from './components/layout/AppShell';
import { HomePage } from './pages/HomePage';
import { LearnPage } from './pages/LearnPage';
import { EmotionalLawsPage } from './pages/EmotionalLawsPage';
import { EmotionalLawsLibraryPage } from './pages/EmotionalLawsLibraryPage';
import { LawDetailPage } from './pages/LawDetailPage';
import { GamesPage } from './pages/GamesPage';
import { GamePlayPage } from './pages/GamePlayPage';
import { RapidQuizPage } from './pages/RapidQuizPage';
import { DailyChallengePage } from './pages/DailyChallengePage';
import { ProgressPage } from './pages/ProgressPage';
import { CognitiveAssessmentPage } from './pages/CognitiveAssessmentPage';
import { ProfilePage } from './pages/ProfilePage';
import { JournalPage } from './pages/JournalPage';
import { BreathingPage } from './pages/BreathingPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { OnboardingModal } from './pages/OnboardingModal';
import { JournalComposerModal } from './components/journal/JournalComposerModal';
import { FocusedBreathingModal } from './components/breathing/FocusedBreathingModal';
import { GoogleAuthModal } from './components/auth/GoogleAuthModal';
import { PwaInstallModal } from './components/pwa/PwaInstallModal';
import { PwaUpdateToast } from './components/pwa/PwaUpdateToast';
import { BiometricSetupModal } from './components/journal/BiometricSetupModal';
import { BadgeUnlockedModal } from './components/profile/BadgeUnlockedModal';
import { ErrorBoundary } from './components/ui/ErrorBoundary';

const AppRoutes: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    user,
    newUnlockedBadge,
    setNewUnlockedBadge,
    composerOpen,
    setComposerOpen,
    composerPreload,
    breathingOpen,
    setBreathingOpen,
    pwaModalOpen,
    setPwaModalOpen,
  } = useApp();
  const { showSetupModal, setShowSetupModal } = useBiometricLock();
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Seamless 404 Recovery: Check for redirect query params or session storage from static hosting
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const redirectParam = searchParams.get('redirect');
    const storedRedirect = sessionStorage.getItem('mindlabz_redirect_path');

    const targetPath = redirectParam ? decodeURIComponent(redirectParam) : storedRedirect;

    if (targetPath && targetPath !== '/' && targetPath.startsWith('/')) {
      sessionStorage.removeItem('mindlabz_redirect_path');
      navigate(targetPath, { replace: true });
    }
  }, [location.search, navigate]);

  return (
    <>
      <AppShell>
        <ErrorBoundary fallbackTitle="Page momentanément indisponible · 页面加载保护">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/learn" element={<LearnPage />} />
            <Route path="/search" element={<LearnPage />} />
            <Route path="/emotional-laws" element={<EmotionalLawsPage />} />
            <Route path="/emotional-library" element={<EmotionalLawsLibraryPage />} />
            <Route path="/emotional-laws-library" element={<EmotionalLawsLibraryPage />} />
            <Route path="/laws-library" element={<EmotionalLawsLibraryPage />} />
            <Route path="/law/:id" element={<LawDetailPage />} />
            <Route path="/journal" element={<JournalPage />} />
            <Route path="/breathing" element={<BreathingPage />} />
            <Route path="/games" element={<GamesPage />} />
            <Route path="/game/:id" element={<GamePlayPage />} />
            <Route path="/quiz" element={<RapidQuizPage />} />
            <Route path="/challenge" element={<DailyChallengePage />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/assessment" element={<CognitiveAssessmentPage />} />
            <Route path="/cognitive-assessment" element={<CognitiveAssessmentPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            {/* Universal 404 Recovery Route */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </ErrorBoundary>
      </AppShell>

      <PwaUpdateToast />

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

      <BiometricSetupModal
        isOpen={showSetupModal}
        onClose={() => setShowSetupModal(false)}
      />

      <PwaInstallModal
        isOpen={pwaModalOpen}
        onClose={() => setPwaModalOpen(false)}
      />

      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
      />

      <BadgeUnlockedModal
        badge={newUnlockedBadge}
        onClose={() => setNewUnlockedBadge(null)}
        onViewAll={() => {
          setNewUnlockedBadge(null);
          navigate('/profile');
        }}
      />
    </>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <ThemeColorProvider>
        <AppProvider>
          <BiometricLockProvider>
            <AppRoutes />
          </BiometricLockProvider>
        </AppProvider>
      </ThemeColorProvider>
    </BrowserRouter>
  );
}

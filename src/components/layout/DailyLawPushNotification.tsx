import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BellRing, ArrowRight, RefreshCw, Bookmark, Volume2, VolumeX, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PsychologyLaw } from '../../types';
import { drawNonRepeatingLawOrder } from '../../utils/aleatoricEngine';

interface DailyLawPushNotificationProps {
  isPlayingGame?: boolean;
  hasTopBar?: boolean;
  canReveal?: boolean;
}

interface StoredDailyPushState {
  dateKey: string;
  lawId: string;
  mutedDate?: string;
}

const STORAGE_KEY = 'mindlabz_daily_law_push_v1';
const LAUNCH_DELAY_MS = 320;
const AUTO_HIDE_MS = 16000;
const EXIT_DURATION_MS = 240;

function getLocalDateKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getFormattedDateLabel(): string {
  const now = new Date();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${m}月${d}日`;
}

function readStoredPushState(): StoredDailyPushState | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return {
        dateKey: typeof parsed.dateKey === 'string' ? parsed.dateKey : '',
        lawId: typeof parsed.lawId === 'string' ? parsed.lawId : '',
        mutedDate: typeof parsed.mutedDate === 'string' ? parsed.mutedDate : undefined,
      };
    }
  } catch {
    // ignore storage read error
  }
  return null;
}

function writeStoredPushState(state: StoredDailyPushState): void {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage quota error
  }
}

export const DailyLawPushNotification: React.FC<DailyLawPushNotificationProps> = ({
  isPlayingGame = false,
  hasTopBar = false,
  canReveal = true,
}) => {
  const navigate = useNavigate();
  const { laws, isBookmarked, toggleBookmark } = useApp();

  const [mounted, setMounted] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [lawOfTheDay, setLawOfTheDay] = useState<PsychologyLaw | null>(null);
  const [drawSeedKey, setDrawSeedKey] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const hasLaunchedRef = useRef(false);
  const launchTimerRef = useRef<number | null>(null);
  const exitTimerRef = useRef<number | null>(null);
  const autoHideTimerRef = useRef<number | null>(null);
  const remainingMsRef = useRef<number>(AUTO_HIDE_MS);
  const timerStartRef = useRef<number>(Date.now());

  const todayKey = useMemo(() => getLocalDateKey(), []);
  const dateLabel = useMemo(() => getFormattedDateLabel(), []);

  const stopSpeech = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  const clearAutoHideTimer = useCallback(() => {
    if (autoHideTimerRef.current !== null) {
      window.clearTimeout(autoHideTimerRef.current);
      autoHideTimerRef.current = null;
    }
  }, []);

  const dismissNotification = useCallback(
    (muteToday = false) => {
      clearAutoHideTimer();
      stopSpeech();
      setExiting(true);

      try {
        if (typeof window !== 'undefined' && muteToday) {
          const existing = readStoredPushState();
          writeStoredPushState({
            dateKey: existing?.dateKey || todayKey,
            lawId: existing?.lawId || lawOfTheDay?.id || '',
            mutedDate: todayKey,
          });
        }
      } catch {
        // ignore storage errors
      }

      if (exitTimerRef.current !== null) {
        window.clearTimeout(exitTimerRef.current);
      }
      exitTimerRef.current = window.setTimeout(() => {
        setMounted(false);
        setExiting(false);
      }, EXIT_DURATION_MS);
    },
    [clearAutoHideTimer, lawOfTheDay?.id, stopSpeech, todayKey]
  );

  // Pick or restore today's CSPRNG Law of the Day and reveal once warmup finishes
  useEffect(() => {
    if (!canReveal || hasLaunchedRef.current || laws.length === 0 || isPlayingGame) return;

    const stored = readStoredPushState();
    if (stored?.mutedDate === todayKey) {
      hasLaunchedRef.current = true;
      return;
    }

    let selectedLaw: PsychologyLaw | undefined;
    if (stored?.dateKey === todayKey && stored.lawId) {
      selectedLaw = laws.find((item) => item.id === stored.lawId);
    }

    if (!selectedLaw) {
      const drawn = drawNonRepeatingLawOrder(laws, 'daily-law-push', { markHeadCount: 1 });
      selectedLaw = drawn[0] || laws[0];
      if (selectedLaw) {
        writeStoredPushState({
          dateKey: todayKey,
          lawId: selectedLaw.id,
          mutedDate: stored?.mutedDate,
        });
      }
    }

    if (!selectedLaw) return;
    setLawOfTheDay(selectedLaw);

    launchTimerRef.current = window.setTimeout(() => {
      hasLaunchedRef.current = true;
      remainingMsRef.current = AUTO_HIDE_MS;
      timerStartRef.current = Date.now();
      setExiting(false);
      setMounted(true);
    }, LAUNCH_DELAY_MS);

    return () => {
      if (launchTimerRef.current !== null) {
        window.clearTimeout(launchTimerRef.current);
      }
    };
  }, [canReveal, laws, isPlayingGame, todayKey]);

  // Dismiss cleanly if user enters an immersive game arena
  useEffect(() => {
    if (isPlayingGame && mounted && !exiting) {
      dismissNotification(false);
    }
  }, [isPlayingGame, mounted, exiting, dismissNotification]);

  // Auto-dismiss timer with pause-on-hover/focus preservation
  useEffect(() => {
    if (!mounted || exiting) return;

    if (isPaused || isSpeaking) {
      const elapsed = Date.now() - timerStartRef.current;
      remainingMsRef.current = Math.max(1500, remainingMsRef.current - elapsed);
      clearAutoHideTimer();
      return;
    }

    timerStartRef.current = Date.now();
    clearAutoHideTimer();
    autoHideTimerRef.current = window.setTimeout(() => {
      dismissNotification(false);
    }, remainingMsRef.current);

    return () => {
      clearAutoHideTimer();
    };
  }, [mounted, exiting, isPaused, isSpeaking, drawSeedKey, clearAutoHideTimer, dismissNotification]);

  // Escape key dismissal
  useEffect(() => {
    if (!mounted) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        dismissNotification(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mounted, dismissNotification]);

  // Clean up speech & timers on unmount
  useEffect(() => {
    return () => {
      if (launchTimerRef.current !== null) window.clearTimeout(launchTimerRef.current);
      if (exitTimerRef.current !== null) window.clearTimeout(exitTimerRef.current);
      if (autoHideTimerRef.current !== null) window.clearTimeout(autoHideTimerRef.current);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleOpenLaw = () => {
    if (!lawOfTheDay) return;
    const targetId = lawOfTheDay.id;
    dismissNotification(false);
    navigate(`/law/${targetId}`);
  };

  const handleShuffleAnotherPush = () => {
    if (laws.length <= 1) return;
    stopSpeech();
    const candidates = lawOfTheDay ? laws.filter((item) => item.id !== lawOfTheDay.id) : laws;
    const drawn = drawNonRepeatingLawOrder(candidates, 'daily-law-push', { markHeadCount: 1 });
    const nextLaw = drawn[0];
    if (!nextLaw) return;

    setLawOfTheDay(nextLaw);
    writeStoredPushState({
      dateKey: todayKey,
      lawId: nextLaw.id,
    });
    remainingMsRef.current = AUTO_HIDE_MS;
    timerStartRef.current = Date.now();
    setExiting(false);
    setDrawSeedKey((prev) => prev + 1);
  };

  const handleToggleSpeech = () => {
    if (!lawOfTheDay || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (isSpeaking) {
      stopSpeech();
      return;
    }

    window.speechSynthesis.cancel();
    const text = `今日心智定律推送：${lawOfTheDay.nameZh}。${lawOfTheDay.shortExplanation}`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.98;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  if (!mounted || !lawOfTheDay) return null;

  const bookmarked = isBookmarked(lawOfTheDay.id);
  const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window;

  return (
    <aside
      role="status"
      aria-live="polite"
      aria-label={`每日心智推送：${lawOfTheDay.nameZh}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
      className={`fixed z-50 left-3 right-3 sm:left-auto sm:right-6 sm:w-[416px] pointer-events-auto transition-[top] duration-300 ${
        hasTopBar ? 'top-[6.25rem] sm:top-[6.75rem]' : 'top-[4.15rem] sm:top-[4.75rem]'
      }`}
    >
      <div
        key={drawSeedKey}
        className={`relative overflow-hidden bg-[#FDFBF7]/95 backdrop-blur-md border border-stone-200/90 shadow-[0_18px_48px_-14px_rgba(28,25,23,0.16)] rounded-xl ${
          exiting ? 'animate-daily-push-exit' : 'animate-daily-push-enter'
        }`}
      >
        {/* Top compositor countdown hairline */}
        <div className="h-[2px] w-full bg-stone-200/80 overflow-hidden">
          <div
            key={`bar-${drawSeedKey}`}
            className="h-full w-full bg-[#1C1917] animate-daily-push-countdown"
            style={{ animationPlayState: isPaused || isSpeaking || exiting ? 'paused' : 'running' }}
          />
        </div>

        <div className="px-3.5 py-2.5 sm:px-4 sm:py-3.5">
          {/* Row 1: Unboxed archival metadata kicker + Close */}
          <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
            <div className="flex items-center gap-1.5 min-w-0 text-[10px] sm:text-[11px] uppercase tracking-[0.12em] font-medium text-stone-500 font-numeric tabular-nums truncate">
              <BellRing className="w-3 h-3 text-[#532CD8] shrink-0" aria-hidden="true" />
              <span className="text-[#1C1917] font-semibold shrink-0">今日定律推送</span>
              <span aria-hidden="true">·</span>
              <span className="shrink-0">{dateLabel}</span>
              {lawOfTheDay.codeId && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="shrink-0">{lawOfTheDay.codeId}</span>
                </>
              )}
              <span aria-hidden="true" className="hidden sm:inline">·</span>
              <span className="hidden sm:inline truncate">{lawOfTheDay.categoryZh}</span>
            </div>

            <button
              type="button"
              onClick={() => dismissNotification(false)}
              className="w-7 h-7 -mr-1 rounded-lg flex items-center justify-center text-stone-500 hover:text-stone-900 hover:bg-stone-100/80 transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#532CD8]"
              aria-label="关闭每日推送"
              title="关闭"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Row 2: Law Headline & Insight (clickable to open law detail) */}
          <button
            type="button"
            onClick={handleOpenLaw}
            className="w-full text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#532CD8] rounded"
          >
            <div className="flex items-baseline gap-2 min-w-0">
              <h2 className="font-serif-editorial text-sm sm:text-[16px] font-bold text-[#1C1917] group-hover:text-[#532CD8] transition-colors truncate">
                {lawOfTheDay.nameZh}
              </h2>
              <span className="hidden sm:inline font-serif-editorial italic text-xs text-stone-500 truncate">
                {lawOfTheDay.nameEn}
              </span>
            </div>
            <p className="mt-0.5 sm:mt-1 text-xs sm:text-[13px] leading-snug sm:leading-relaxed text-stone-600 line-clamp-1 sm:line-clamp-2">
              “{lawOfTheDay.shortExplanation}”
            </p>
          </button>

          {/* Row 3: Action Strip */}
          <div className="mt-2 sm:mt-3 pt-2 sm:pt-2.5 border-t border-stone-200/70 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <button
                type="button"
                onClick={handleOpenLaw}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#1C1917] text-[#FAF8F5] hover:bg-[#532CD8] transition-colors text-[11px] sm:text-xs font-medium whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#532CD8]"
              >
                <span>研读解析</span>
                <ArrowRight className="w-3 h-3 shrink-0" />
              </button>

              <button
                type="button"
                onClick={handleShuffleAnotherPush}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white text-stone-700 hover:border-stone-400 hover:text-stone-900 transition-colors text-[11px] sm:text-xs font-medium whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#532CD8]"
                title="随机抽取另一条定律并模拟推送"
              >
                <RefreshCw className="w-3 h-3 shrink-0" />
                <span>换条推送</span>
              </button>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {canSpeak && (
                <button
                  type="button"
                  onClick={handleToggleSpeech}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#532CD8] ${
                    isSpeaking
                      ? 'bg-[#532CD8]/10 text-[#532CD8]'
                      : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                  aria-label={isSpeaking ? '停止朗读今日定律' : '朗读今日定律'}
                  title={isSpeaking ? '停止朗读' : '语音朗读'}
                >
                  {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
              )}

              <button
                type="button"
                onClick={() => toggleBookmark(lawOfTheDay.id)}
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#532CD8] ${
                  bookmarked
                    ? 'bg-amber-50 text-amber-700'
                    : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100'
                }`}
                aria-label={bookmarked ? '取消收藏今日定律' : '收藏今日定律'}
                title={bookmarked ? '已收藏' : '收藏定律'}
              >
                <Bookmark className={`w-3.5 h-3.5 ${bookmarked ? 'fill-current' : ''}`} />
              </button>

              <button
                type="button"
                onClick={() => dismissNotification(true)}
                className="hidden sm:inline-flex px-2 py-1 rounded text-[11px] text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#532CD8]"
                title="今日不再自动弹出推送"
              >
                今日静音
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

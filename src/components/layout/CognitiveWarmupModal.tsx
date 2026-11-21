import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Brain,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  RefreshCw,
  X,
  Compass,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  drawCognitiveWarmupTask,
  inferUserPracticeProfile,
  PatternTileSpec,
  PRACTICE_DOMAIN_META,
  PracticeDomainFocus,
  WarmupTask,
} from '../../utils/cognitiveWarmupTasks';
import { gameAudio } from '../../utils/gameAudio';

interface CognitiveWarmupModalProps {
  isPlayingGame?: boolean;
  onComplete: () => void;
}

interface WarmupStorageState {
  lastCompletedDate?: string;
  mutedDate?: string;
  streak: number;
  totalCompleted: number;
}

const STORAGE_KEY = 'mindlabz_cognitive_warmup_v1';
const WARMUP_SECONDS = 30;
const LAUNCH_DELAY_MS = 420;
const EXIT_DURATION_MS = 220;
const DAILY_XP_BONUS = 15;

const DOMAIN_FOCUS_OPTIONS: Array<{ id: 'auto' | PracticeDomainFocus; labelZh: string }> = [
  { id: 'auto', labelZh: '智能匹配' },
  { id: 'cognitive-bias', labelZh: '心理偏差' },
  { id: 'decision-science', labelZh: '决策科学' },
  { id: 'memory-pattern', labelZh: '模式记忆' },
  { id: 'social-emotion', labelZh: '情绪社会' },
];

function getLocalDateKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getYesterdayDateKey(): string {
  const now = new Date();
  now.setDate(now.getDate() - 1);
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function readWarmupState(): WarmupStorageState {
  try {
    if (typeof window === 'undefined') {
      return { streak: 0, totalCompleted: 0 };
    }
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { streak: 0, totalCompleted: 0 };
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return {
        lastCompletedDate:
          typeof parsed.lastCompletedDate === 'string' ? parsed.lastCompletedDate : undefined,
        mutedDate: typeof parsed.mutedDate === 'string' ? parsed.mutedDate : undefined,
        streak: typeof parsed.streak === 'number' ? parsed.streak : 0,
        totalCompleted: typeof parsed.totalCompleted === 'number' ? parsed.totalCompleted : 0,
      };
    }
  } catch {
    // ignore storage errors
  }
  return { streak: 0, totalCompleted: 0 };
}

function writeWarmupState(state: WarmupStorageState): void {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage errors
  }
}

const PatternGlyph: React.FC<{ tile: PatternTileSpec; size?: number }> = ({
  tile,
  size = 56,
}) => {
  const dotCoordinates: Record<PatternTileSpec['dotPos'], { cx: number; cy: number }> = {
    top: { cx: 32, cy: 9 },
    right: { cx: 55, cy: 32 },
    bottom: { cx: 32, cy: 55 },
    left: { cx: 9, cy: 32 },
  };

  const dot = dotCoordinates[tile.dotPos];
  const isSolid = tile.fill === 'solid';
  const isDouble = tile.fill === 'double';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className="shrink-0"
      aria-hidden="true"
    >
      <g transform={`rotate(${tile.rotation} 32 32)`}>
        {tile.shape === 'circle' && (
          <>
            <circle
              cx="32"
              cy="32"
              r="14"
              fill={isSolid ? '#1C1917' : 'none'}
              stroke="#1C1917"
              strokeWidth="2.4"
            />
            {isDouble && (
              <circle
                cx="32"
                cy="32"
                r="8.5"
                fill="none"
                stroke="#1C1917"
                strokeWidth="1.8"
              />
            )}
          </>
        )}

        {tile.shape === 'square' && (
          <>
            <rect
              x="19"
              y="19"
              width="26"
              height="26"
              rx="2"
              fill={isSolid ? '#1C1917' : 'none'}
              stroke="#1C1917"
              strokeWidth="2.4"
            />
            {isDouble && (
              <rect
                x="24.5"
                y="24.5"
                width="15"
                height="15"
                rx="1"
                fill="none"
                stroke="#1C1917"
                strokeWidth="1.8"
              />
            )}
          </>
        )}

        {tile.shape === 'triangle' && (
          <>
            <polygon
              points="32,16 47,44 17,44"
              fill={isSolid ? '#1C1917' : 'none'}
              stroke="#1C1917"
              strokeWidth="2.4"
              strokeLinejoin="round"
            />
            {isDouble && (
              <polygon
                points="32,24 40.5,39.5 23.5,39.5"
                fill="none"
                stroke="#1C1917"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
            )}
          </>
        )}

        {tile.shape === 'diamond' && (
          <>
            <polygon
              points="32,15 49,32 32,49 15,32"
              fill={isSolid ? '#1C1917' : 'none'}
              stroke="#1C1917"
              strokeWidth="2.4"
              strokeLinejoin="round"
            />
            {isDouble && (
              <polygon
                points="32,22 42,32 32,42 22,32"
                fill="none"
                stroke="#1C1917"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
            )}
          </>
        )}
      </g>

      <circle cx={dot.cx} cy={dot.cy} r="4" fill="#532CD8" />
    </svg>
  );
};

export const CognitiveWarmupModal: React.FC<CognitiveWarmupModalProps> = ({
  isPlayingGame = false,
  onComplete,
}) => {
  const { user, laws, addXP } = useApp();

  const [mounted, setMounted] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [selectedFocus, setSelectedFocus] = useState<'auto' | PracticeDomainFocus>('auto');
  const [task, setTask] = useState<WarmupTask | null>(null);
  const [roundSeed, setRoundSeed] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(WARMUP_SECONDS);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [xpAwardedThisSession, setXpAwardedThisSession] = useState(0);

  const hasFinishedRef = useRef(false);
  const launchTimerRef = useRef<number | null>(null);
  const exitTimerRef = useRef<number | null>(null);
  const countdownTimerRef = useRef<number | null>(null);

  const todayKey = useMemo(() => getLocalDateKey(), []);
  const yesterdayKey = useMemo(() => getYesterdayDateKey(), []);

  const practiceProfile = useMemo(
    () => inferUserPracticeProfile(user, laws),
    [user, laws]
  );

  const effectiveFocus: PracticeDomainFocus =
    selectedFocus === 'auto' ? practiceProfile.primaryFocus : selectedFocus;

  const finishWarmup = useCallback(
    (muteToday = false) => {
      if (hasFinishedRef.current) return;
      hasFinishedRef.current = true;

      if (countdownTimerRef.current !== null) {
        window.clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }

      if (muteToday) {
        const stored = readWarmupState();
        writeWarmupState({
          ...stored,
          mutedDate: todayKey,
        });
      }

      setExiting(true);
      if (exitTimerRef.current !== null) {
        window.clearTimeout(exitTimerRef.current);
      }
      exitTimerRef.current = window.setTimeout(() => {
        setMounted(false);
        setExiting(false);
        onComplete();
      }, EXIT_DURATION_MS);
    },
    [onComplete, todayKey]
  );

  // Schedule targeted launch warmup before DailyLawPushNotification
  useEffect(() => {
    if (hasFinishedRef.current || mounted || laws.length === 0) return;

    if (isPlayingGame) {
      hasFinishedRef.current = true;
      onComplete();
      return;
    }

    const stored = readWarmupState();
    if (stored.mutedDate === todayKey) {
      hasFinishedRef.current = true;
      onComplete();
      return;
    }

    const initialTask = drawCognitiveWarmupTask({
      focus: practiceProfile.primaryFocus,
      profile: practiceProfile,
    });
    setTask(initialTask);

    launchTimerRef.current = window.setTimeout(() => {
      setSecondsLeft(WARMUP_SECONDS);
      setSelectedIndex(null);
      setTimedOut(false);
      setExiting(false);
      setMounted(true);
    }, LAUNCH_DELAY_MS);

    return () => {
      if (launchTimerRef.current !== null) {
        window.clearTimeout(launchTimerRef.current);
      }
    };
  }, [isPlayingGame, laws.length, mounted, onComplete, practiceProfile, todayKey]);

  const isResolved = selectedIndex !== null || timedOut;

  // 30-second countdown interval while task is open and unanswered
  useEffect(() => {
    if (!mounted || exiting || isResolved) {
      if (countdownTimerRef.current !== null) {
        window.clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
      return;
    }

    countdownTimerRef.current = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (countdownTimerRef.current !== null) {
            window.clearInterval(countdownTimerRef.current);
            countdownTimerRef.current = null;
          }
          setTimedOut(true);
          gameAudio.playMistake();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownTimerRef.current !== null) {
        window.clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
    };
  }, [mounted, exiting, isResolved, roundSeed]);

  const handleSelectOption = useCallback(
    (index: number) => {
      if (!task || isResolved) return;
      setSelectedIndex(index);

      const isCorrect = index === task.correctIndex;
      if (isCorrect) {
        gameAudio.playSuccess();
        const stored = readWarmupState();
        const alreadyAwardedToday = stored.lastCompletedDate === todayKey;

        if (!alreadyAwardedToday) {
          const nextStreak =
            stored.lastCompletedDate === yesterdayKey ? stored.streak + 1 : 1;
          writeWarmupState({
            ...stored,
            lastCompletedDate: todayKey,
            streak: nextStreak,
            totalCompleted: stored.totalCompleted + 1,
          });
          addXP(DAILY_XP_BONUS, '每日定制认知热身');
          setXpAwardedThisSession(DAILY_XP_BONUS);
        } else {
          writeWarmupState({
            ...stored,
            totalCompleted: stored.totalCompleted + 1,
          });
        }
      } else {
        gameAudio.playMistake();
      }
    },
    [addXP, isResolved, task, todayKey, yesterdayKey]
  );

  const loadTaskForFocus = useCallback(
    (targetFocus: PracticeDomainFocus) => {
      const nextTask = drawCognitiveWarmupTask({
        focus: targetFocus,
        profile: practiceProfile,
        excludeDomain: task?.domain,
        excludeTaskId: task?.id,
      });
      setTask(nextTask);
      setSelectedIndex(null);
      setTimedOut(false);
      setSecondsLeft(WARMUP_SECONDS);
      setRoundSeed((prev) => prev + 1);
    },
    [practiceProfile, task?.domain, task?.id]
  );

  const handleAnotherWarmup = () => {
    gameAudio.playTap();
    loadTaskForFocus(effectiveFocus);
  };

  const handleChangeFocus = (nextMode: 'auto' | PracticeDomainFocus) => {
    if (selectedFocus === nextMode) return;
    gameAudio.playTap();
    setSelectedFocus(nextMode);
    const resolvedFocus = nextMode === 'auto' ? practiceProfile.primaryFocus : nextMode;
    loadTaskForFocus(resolvedFocus);
  };

  // Keyboard support: Escape skips, 1-4 selects options
  useEffect(() => {
    if (!mounted || exiting) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        finishWarmup(false);
        return;
      }
      if (!isResolved && ['1', '2', '3', '4'].includes(e.key)) {
        const idx = Number(e.key) - 1;
        if (task && idx < task.options.length) {
          handleSelectOption(idx);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mounted, exiting, isResolved, task, handleSelectOption, finishWarmup]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (launchTimerRef.current !== null) window.clearTimeout(launchTimerRef.current);
      if (exitTimerRef.current !== null) window.clearTimeout(exitTimerRef.current);
      if (countdownTimerRef.current !== null) window.clearInterval(countdownTimerRef.current);
    };
  }, []);

  if (!mounted || !task) return null;

  const isCorrect = selectedIndex === task.correctIndex;
  const isPatternGrid = Boolean(task.sequenceTiles && task.options.every((o) => o.tile));
  const activeDomainMeta = PRACTICE_DOMAIN_META[effectiveFocus];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cognitive-warmup-title"
      className={`fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-6 bg-[#1C1917]/35 backdrop-blur-[2px] transition-opacity duration-200 ${
        exiting ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div
        className={`relative w-full max-w-lg bg-[#FDFBF7] border border-stone-200 shadow-[0_24px_60px_-16px_rgba(28,25,23,0.22)] rounded-2xl overflow-hidden ${
          exiting ? 'animate-warmup-exit' : 'animate-warmup-enter'
        }`}
      >
        {/* Top 30-second GPU-composited countdown bar */}
        <div className="h-[3px] w-full bg-stone-200/80 overflow-hidden">
          <div
            key={`warmup-bar-${roundSeed}`}
            className="h-full w-full bg-[#532CD8] animate-warmup-countdown"
            style={{ animationPlayState: isResolved || exiting ? 'paused' : 'running' }}
          />
        </div>

        <div className="p-4 sm:p-6">
          {/* Header Kicker + Timer + Close */}
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-1.5 min-w-0 text-[11px] tracking-[0.06em] font-medium text-stone-500 truncate">
              <Brain className="w-3.5 h-3.5 text-[#532CD8] shrink-0" aria-hidden="true" />
              <span className="text-[#1C1917] font-semibold shrink-0">认知唤醒热身</span>
              <span aria-hidden="true">·</span>
              <span className="text-[#532CD8] font-semibold shrink-0">{task.focusLabelZh}</span>
              <span aria-hidden="true">·</span>
              <span className="truncate">{task.knowledgePoint}</span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div
                className={`inline-flex items-center gap-1 text-xs font-numeric tabular-nums font-semibold ${
                  secondsLeft <= 8 && !isResolved
                    ? 'text-[#BE123C]'
                    : 'text-stone-700'
                }`}
                aria-label={`剩余 ${secondsLeft} 秒`}
              >
                <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{String(secondsLeft).padStart(2, '0')}s</span>
              </div>

              <button
                type="button"
                onClick={() => finishWarmup(false)}
                className="w-8 h-8 -mr-1 rounded-lg flex items-center justify-center text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#532CD8]"
                aria-label="跳过热身并进入今日定律"
                title="跳过热身"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Targeted Practice Matching Context */}
          <div className="mb-3 flex items-start gap-1.5 text-[11px] sm:text-xs text-stone-600 leading-snug">
            <Compass className="w-3.5 h-3.5 text-[#532CD8] shrink-0 mt-0.5" aria-hidden="true" />
            <span>
              {selectedFocus === 'auto'
                ? practiceProfile.reasonText
                : `当前手动聚焦「${activeDomainMeta.labelZh}」：${activeDomainMeta.description}`}
            </span>
          </div>

          {/* Domain Focus Selector (Auto Match + 4 Practice Domains) */}
          <div className="mb-3.5 flex items-center gap-1 p-1 rounded-xl bg-stone-100/90 border border-stone-200/80 overflow-x-auto no-scrollbar">
            {DOMAIN_FOCUS_OPTIONS.map((opt) => {
              const active = selectedFocus === opt.id;
              const label =
                opt.id === 'auto'
                  ? `智能(${practiceProfile.matchedLabelZh})`
                  : opt.labelZh;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleChangeFocus(opt.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#532CD8] ${
                    active
                      ? 'bg-white text-[#1C1917] shadow-xs font-semibold'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Title & Prompt */}
          <h2
            id="cognitive-warmup-title"
            className="font-serif-editorial text-lg sm:text-xl font-bold text-[#1C1917] leading-snug"
            style={{ textWrap: 'balance' }}
          >
            {task.prompt}
          </h2>

          {/* Optional Sequence / Symbolic Sub-prompt */}
          {task.subPrompt && (
            <div className="mt-3 px-4 py-3 rounded-xl bg-white border border-stone-200/90 text-center font-numeric tabular-nums text-sm sm:text-base font-semibold tracking-wide text-[#1C1917]">
              {task.subPrompt}
            </div>
          )}

          {/* Optional Visual Pattern Sequence */}
          {task.sequenceTiles && (
            <div className="mt-3.5 grid grid-cols-4 gap-2 sm:gap-3">
              {task.sequenceTiles.map((tile, idx) => (
                <div
                  key={idx}
                  className="aspect-square rounded-xl bg-white border border-stone-200/90 flex items-center justify-center p-1.5"
                >
                  <PatternGlyph tile={tile} size={52} />
                </div>
              ))}
              <div className="aspect-square rounded-xl bg-stone-100/80 border border-dashed border-stone-300 flex items-center justify-center">
                <span className="font-serif-editorial text-xl font-bold text-stone-500">?</span>
              </div>
            </div>
          )}

          {/* Answer Options */}
          <div
            className={`mt-4 ${
              isPatternGrid
                ? 'grid grid-cols-4 gap-2 sm:gap-3'
                : 'grid grid-cols-1 sm:grid-cols-2 gap-2.5'
            }`}
          >
            {task.options.map((opt, idx) => {
              const isPicked = selectedIndex === idx;
              const isAnswer = idx === task.correctIndex;

              let stateStyle =
                'bg-white border-stone-200/90 text-[#1C1917] hover:border-[#532CD8]/60 hover:bg-stone-50';
              if (isResolved) {
                if (isAnswer) {
                  stateStyle = 'bg-emerald-50/90 border-emerald-600 text-emerald-950';
                } else if (isPicked && !isAnswer) {
                  stateStyle = 'bg-rose-50/90 border-rose-600 text-rose-950';
                } else {
                  stateStyle = 'bg-white/60 border-stone-200/60 text-stone-400';
                }
              }

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={isResolved}
                  onClick={() => handleSelectOption(idx)}
                  className={`relative rounded-xl border transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#532CD8] ${
                    isPatternGrid
                      ? 'aspect-square flex flex-col items-center justify-center p-1.5'
                      : 'px-3.5 py-2.5 min-h-[44px] flex items-center gap-2.5'
                  } ${stateStyle} ${isResolved ? 'cursor-default' : 'cursor-pointer'}`}
                  aria-label={`选项 ${idx + 1}${opt.tile ? '' : `：${opt.label}`}`}
                >
                  {isPatternGrid && opt.tile ? (
                    <>
                      <PatternGlyph tile={opt.tile} size={46} />
                      <span className="mt-0.5 text-[10px] font-numeric tabular-nums text-stone-500">
                        {idx + 1}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="w-5 h-5 rounded-md bg-stone-100 text-stone-600 text-xs font-numeric tabular-nums font-semibold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-xs sm:text-[13px] font-medium leading-snug">
                        {opt.label}
                      </span>
                    </>
                  )}
                </button>
              );
            })}
          </div>

          {/* Post-Answer Feedback & Explanation */}
          {isResolved && (
            <div className="mt-4 pt-3.5 border-t border-stone-200/80">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold">
                  {isCorrect ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" aria-hidden="true" />
                      <span className="text-emerald-800">逻辑校准完成 · 大脑已进入专注态</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-rose-700 shrink-0" aria-hidden="true" />
                      <span className="text-rose-800">
                        {timedOut ? '30 秒时间已到 · 已揭晓正解' : '思路略有偏差 · 校准完成'}
                      </span>
                    </>
                  )}
                </div>
                {xpAwardedThisSession > 0 && isCorrect && (
                  <span className="text-xs font-numeric tabular-nums font-semibold text-[#532CD8] shrink-0">
                    +{xpAwardedThisSession} XP
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-[13px] text-stone-600 leading-relaxed">
                {task.explanation}
              </p>
            </div>
          )}

          {/* Bottom Controls */}
          <div className="mt-4 pt-3 border-t border-stone-200/70 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAnotherWarmup}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-stone-200 bg-white text-stone-700 hover:border-stone-400 hover:text-stone-900 transition-colors text-xs font-medium whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#532CD8]"
              >
                <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                <span>换一题</span>
              </button>

              <button
                type="button"
                onClick={() => finishWarmup(true)}
                className="px-2.5 py-2 rounded-lg text-xs text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#532CD8]"
                title="今日不再自动弹出热身"
              >
                今日不再提醒
              </button>
            </div>

            <button
              type="button"
              onClick={() => finishWarmup(false)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1C1917] text-[#FAF8F5] hover:bg-[#532CD8] transition-colors text-xs font-medium whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#532CD8]"
            >
              <span>{isResolved ? '进入并接收今日定律' : '跳过热身'}</span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

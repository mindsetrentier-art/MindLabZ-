import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Play,
  RotateCcw,
  Zap,
} from 'lucide-react';
import { gameAudio } from '../../utils/gameAudio';
import {
  BRAIN_GYM_DIFFICULTIES,
  BrainGymDifficulty,
  BrainGymSessionInput,
  getReflexEvaluationBand,
  scoreReflexPulseSession,
} from '../../utils/brainGymHelpers';

interface ReflexPulseGameProps {
  difficulty: BrainGymDifficulty;
  onChangeDifficulty: (d: BrainGymDifficulty) => void;
  onSessionComplete: (session: Omit<BrainGymSessionInput, 'id' | 'userId'>) => void;
}

type GameState =
  | 'TITLE_MENU'
  | 'WAITING'
  | 'GO_SIGNAL'
  | 'TRIAL_FEEDBACK'
  | 'FALSE_START'
  | 'GAME_OVER';

const TOTAL_TRIALS = 5;

const DELAY_RANGES_MS: Record<BrainGymDifficulty, [number, number]> = {
  standard: [1400, 3400],
  intense: [1100, 3800],
  master: [900, 4400],
};

export const ReflexPulseGame: React.FC<ReflexPulseGameProps> = ({
  difficulty,
  onChangeDifficulty,
  onSessionComplete,
}) => {
  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [trialIndex, setTrialIndex] = useState(0);
  const [latencies, setLatencies] = useState<number[]>([]);
  const [lastLatency, setLastLatency] = useState<number | null>(null);
  const [falseStarts, setFalseStarts] = useState(0);
  const [summary, setSummary] = useState<{
    score: number;
    accuracy: number;
    avgReactionMs: number;
    bestReactionMs: number;
    xpEarned: number;
  } | null>(null);

  const goTimestampRef = useRef<number>(0);
  const falseStartLockUntilRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);
  const latenciesRef = useRef<number[]>([]);
  const falseStartsRef = useRef<number>(0);
  const trialIndexRef = useRef<number>(0);

  const clearTimers = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  const queueNextWait = useCallback(
    (nextTrial: number, currentDifficulty: BrainGymDifficulty) => {
      clearTimers();
      trialIndexRef.current = nextTrial;
      setTrialIndex(nextTrial);
      setLastLatency(null);
      setGameState('WAITING');

      const [minMs, maxMs] = DELAY_RANGES_MS[currentDifficulty];
      const randomDelay = minMs + Math.floor(Math.random() * (maxMs - minMs));

      timerRef.current = window.setTimeout(() => {
        goTimestampRef.current = performance.now();
        setGameState('GO_SIGNAL');
      }, randomDelay);
    },
    [clearTimers]
  );

  const startTraining = () => {
    clearTimers();
    latenciesRef.current = [];
    falseStartsRef.current = 0;
    trialIndexRef.current = 0;
    setLatencies([]);
    setFalseStarts(0);
    setLastLatency(null);
    setSummary(null);
    gameAudio.playTap();
    queueNextWait(0, difficulty);
  };

  const finishSession = useCallback(
    (finalLatencies: number[], totalFalseStarts: number) => {
      clearTimers();
      const scored = scoreReflexPulseSession({
        latenciesMs: finalLatencies,
        falseStarts: totalFalseStarts,
        difficulty,
      });

      setSummary(scored);
      setGameState('GAME_OVER');
      gameAudio.playVictory();

      onSessionComplete({
        gameId: 'reflex-pulse',
        gameTitle: '毫秒神经反应冲刺',
        category: 'reaction',
        difficulty,
        score: scored.score,
        accuracy: scored.accuracy,
        avgReactionMs: scored.avgReactionMs,
        bestReactionMs: scored.bestReactionMs,
        maxSpan: 0,
        roundsCompleted: finalLatencies.length,
        xpEarned: scored.xpEarned,
      });
    },
    [clearTimers, difficulty, onSessionComplete]
  );

  const handleTrigger = useCallback(() => {
    if (gameState === 'WAITING') {
      clearTimers();
      const nextFalseStarts = falseStartsRef.current + 1;
      falseStartsRef.current = nextFalseStarts;
      setFalseStarts(nextFalseStarts);
      falseStartLockUntilRef.current = performance.now() + 350;
      gameAudio.playMistake();
      setGameState('FALSE_START');
      return;
    }

    if (gameState === 'FALSE_START') {
      if (performance.now() < falseStartLockUntilRef.current) return;
      gameAudio.playTap();
      queueNextWait(trialIndexRef.current, difficulty);
      return;
    }

    if (gameState === 'GO_SIGNAL') {
      const elapsed = Math.max(1, Math.round(performance.now() - goTimestampRef.current));
      const nextLatencies = [...latenciesRef.current, elapsed];
      latenciesRef.current = nextLatencies;
      setLatencies(nextLatencies);
      setLastLatency(elapsed);
      gameAudio.playSuccess();
      setGameState('TRIAL_FEEDBACK');

      const completedTrial = trialIndexRef.current + 1;
      timerRef.current = window.setTimeout(() => {
        if (completedTrial >= TOTAL_TRIALS) {
          finishSession(nextLatencies, falseStartsRef.current);
        } else {
          queueNextWait(completedTrial, difficulty);
        }
      }, 1050);
    }
  }, [clearTimers, difficulty, finishSession, gameState, queueNextWait]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        if (
          gameState === 'WAITING' ||
          gameState === 'GO_SIGNAL' ||
          gameState === 'FALSE_START'
        ) {
          e.preventDefault();
          handleTrigger();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [gameState, handleTrigger]);

  if (gameState === 'TITLE_MENU') {
    return (
      <div className="rounded-2xl bg-[#141821] text-[#FAF8F5] p-6 sm:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="space-y-1.5">
            <div className="text-xs text-[#D4A656] font-mono tabular-nums">
              Psychomotor Vigilance · {TOTAL_TRIALS} Calibrated Trials
            </div>
            <h2 className="font-serif-editorial text-2xl font-bold text-white">
              毫秒神经反应冲刺（Reflex Pulse）
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed max-w-2xl">
              在不可预测的静默等待期保持视觉警觉。当中央触发靶点转为{' '}
              <strong className="text-emerald-300">翡翠绿激活信号</strong>{' '}
              时，在最短毫秒内点击靶区或按下 <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono">Space</kbd>。提前抢按将扣减稳定度。
            </p>
          </div>
          <div className="shrink-0">
            <button
              type="button"
              onClick={startTraining}
              className="min-h-[44px] px-6 py-2.5 rounded-xl font-bold text-xs text-[#181411] bg-[#E5C07B] hover:bg-[#EDD08B] transition-colors inline-flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Play className="w-4 h-4 fill-current" aria-hidden="true" />
              <span>开始 5 轮校准</span>
            </button>
          </div>
        </div>

        <div className="space-y-2.5">
          <div className="text-xs text-stone-400 font-medium">选择随机等待区间与计分倍率</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {BRAIN_GYM_DIFFICULTIES.map((d) => {
              const active = difficulty === d.id;
              const [minMs, maxMs] = DELAY_RANGES_MS[d.id];
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => {
                    gameAudio.playTap();
                    onChangeDifficulty(d.id);
                  }}
                  aria-pressed={active}
                  className={`p-3.5 rounded-xl text-left border transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#1F2736] border-[#D4A656] text-white'
                      : 'bg-white/[0.04] border-white/10 text-stone-300 hover:border-white/25'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold mb-1">
                    <span>{d.label}</span>
                    <span className="font-mono text-[#D4A656] tabular-nums">
                      {(minMs / 1000).toFixed(1)}–{(maxMs / 1000).toFixed(1)}s
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-400 leading-relaxed">{d.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'GAME_OVER' && summary) {
    const band = getReflexEvaluationBand(summary.avgReactionMs);
    return (
      <div className="rounded-2xl bg-[#141821] text-[#FAF8F5] p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <div className="text-xs font-mono text-[#D4A656]">
              Psychomotor Reflex Sprint · {band.label}
            </div>
            <h2 className="font-serif-editorial text-2xl font-bold text-white mt-1">
              毫秒级反应校准报告
            </h2>
            <p className="text-xs text-stone-400 mt-1">{band.note}</p>
          </div>
          <button
            type="button"
            onClick={startTraining}
            className="min-h-[44px] px-5 py-2.5 rounded-xl font-bold text-xs text-[#181411] bg-[#E5C07B] hover:bg-[#EDD08B] transition-colors inline-flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            <span>再来一轮</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-numeric tabular-nums">
          <div className="p-4 rounded-xl bg-white/[0.05] border border-white/10">
            <div className="text-[11px] text-stone-400">平均反应时</div>
            <div className="text-2xl font-bold text-emerald-400 mt-1">
              {summary.avgReactionMs} ms
            </div>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.05] border border-white/10">
            <div className="text-[11px] text-stone-400">最快单次峰值</div>
            <div className="text-2xl font-bold text-[#EDD08B] mt-1">
              {summary.bestReactionMs} ms
            </div>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.05] border border-white/10">
            <div className="text-[11px] text-stone-400">综合积分</div>
            <div className="text-2xl font-bold text-white mt-1">
              {summary.score.toLocaleString()}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.05] border border-white/10">
            <div className="text-[11px] text-stone-400">稳定度 / 经验</div>
            <div className="text-2xl font-bold text-white mt-1">
              {summary.accuracy}% · +{summary.xpEarned}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-2 pt-1 font-numeric tabular-nums">
          {latencies.map((ms, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-white/[0.04] border border-white/10 text-center"
            >
              <div className="text-[10px] text-stone-400">Trial {idx + 1}</div>
              <div className="text-sm font-bold text-white mt-0.5">{ms} ms</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-[#141821] text-[#FAF8F5] p-5 sm:p-7 space-y-6">
      {/* Unobtrusive HUD */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3.5 text-xs font-numeric tabular-nums">
        <div className="flex items-center gap-3 text-stone-300">
          <span className="font-bold text-white flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-[#D4A656]" aria-hidden="true" />
            <span>神经反应冲刺</span>
          </span>
          <span aria-hidden="true" className="text-stone-600">·</span>
          <span>
            第 <strong className="text-white">{Math.min(trialIndex + 1, TOTAL_TRIALS)}</strong> / {TOTAL_TRIALS} 轮
          </span>
        </div>

        <div className="flex items-center gap-4 text-stone-300">
          <span>
            抢按 <strong className={falseStarts > 0 ? 'text-rose-400' : 'text-stone-200'}>{falseStarts}</strong>
          </span>
          {latencies.length > 0 && (
            <span>
              均值{' '}
              <strong className="text-emerald-400">
                {Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)} ms
              </strong>
            </span>
          )}
        </div>
      </div>

      {/* Interactive Reflex Trigger Stage */}
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          handleTrigger();
        }}
        onTouchStart={(e) => {
          e.preventDefault();
          handleTrigger();
        }}
        className={`w-full min-h-[260px] sm:min-h-[300px] rounded-2xl border-2 p-6 flex flex-col items-center justify-center text-center gap-3 transition-colors duration-100 select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5C07B] ${
          gameState === 'GO_SIGNAL'
            ? 'bg-emerald-600 border-emerald-300 text-white shadow-[0_0_40px_rgba(16,185,129,0.35)]'
            : gameState === 'FALSE_START'
            ? 'bg-rose-950/80 border-rose-400 text-rose-100'
            : gameState === 'TRIAL_FEEDBACK'
            ? 'bg-[#1F2736] border-[#D4A656] text-white'
            : 'bg-[#1A202C] border-amber-500/40 text-stone-200'
        }`}
      >
        {gameState === 'WAITING' && (
          <>
            <div className="w-14 h-14 rounded-full border-2 border-amber-400/60 flex items-center justify-center text-amber-300">
              <Zap className="w-6 h-6" aria-hidden="true" />
            </div>
            <div className="font-serif-editorial text-2xl font-bold text-amber-200">
              静默等待绿色激活信号...
            </div>
            <p className="text-xs text-stone-400">
              切勿提前点击或按空格键
            </p>
          </>
        )}

        {gameState === 'GO_SIGNAL' && (
          <>
            <div className="w-16 h-16 rounded-full bg-white text-emerald-700 flex items-center justify-center shadow-lg">
              <Zap className="w-8 h-8 fill-current" aria-hidden="true" />
            </div>
            <div className="font-serif-editorial text-3xl font-extrabold tracking-wide">
              立即点击 / 按空格！
            </div>
            <p className="text-xs font-mono text-emerald-100">GO SIGNAL ACTIVE</p>
          </>
        )}

        {gameState === 'FALSE_START' && (
          <>
            <div className="w-14 h-14 rounded-full bg-rose-500/20 border border-rose-400 flex items-center justify-center text-rose-300">
              <AlertTriangle className="w-7 h-7" aria-hidden="true" />
            </div>
            <div className="font-serif-editorial text-2xl font-bold text-rose-200">
              提前抢按（False Start）
            </div>
            <p className="text-xs text-rose-200/80">
              点击此处或按空格键重新开始本轮等待
            </p>
          </>
        )}

        {gameState === 'TRIAL_FEEDBACK' && lastLatency !== null && (
          <>
            <CheckCircle2 className="w-10 h-10 text-emerald-400" aria-hidden="true" />
            <div className="text-4xl font-extrabold font-numeric tabular-nums text-[#EDD08B]">
              {lastLatency} ms
            </div>
            <p className="text-xs text-stone-300">
              {getReflexEvaluationBand(lastLatency).label} · 即将进入下一轮
            </p>
          </>
        )}
      </button>

      {/* Trial History Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 font-numeric tabular-nums">
          {Array.from({ length: TOTAL_TRIALS }, (_, idx) => {
            const val = latencies[idx];
            return (
              <div
                key={idx}
                className={`px-2.5 py-1 rounded-lg text-xs border ${
                  val
                    ? 'bg-emerald-500/15 border-emerald-400/30 text-emerald-200'
                    : idx === trialIndex
                    ? 'bg-white/10 border-white/25 text-white'
                    : 'bg-white/[0.03] border-white/10 text-stone-500'
                }`}
              >
                {val ? `${val}ms` : `#${idx + 1}`}
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => {
            clearTimers();
            setGameState('TITLE_MENU');
          }}
          className="min-h-[40px] px-4 py-2 rounded-xl text-xs font-medium text-stone-400 hover:text-white border border-white/10 cursor-pointer whitespace-nowrap shrink-0"
        >
          退出本轮
        </button>
      </div>
    </div>
  );
};

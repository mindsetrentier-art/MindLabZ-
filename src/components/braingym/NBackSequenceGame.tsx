import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Brain, CheckCircle2, RotateCcw, Play, Sparkles, Timer, XCircle } from 'lucide-react';
import { gameAudio } from '../../utils/gameAudio';
import {
  BRAIN_GYM_DIFFICULTIES,
  BrainGymDifficulty,
  BrainGymSessionInput,
  NBackStep,
  generateNBackSequence,
  scoreNBackSession,
} from '../../utils/brainGymHelpers';

interface NBackSequenceGameProps {
  difficulty: BrainGymDifficulty;
  onChangeDifficulty: (d: BrainGymDifficulty) => void;
  onSessionComplete: (session: Omit<BrainGymSessionInput, 'id' | 'userId'>) => void;
}

type GameState = 'TITLE_MENU' | 'PLAYING' | 'GAME_OVER';

const STEP_DURATION_MS: Record<BrainGymDifficulty, number> = {
  standard: 2200,
  intense: 1750,
  master: 1550,
};

const N_LEVEL_BY_DIFFICULTY: Record<BrainGymDifficulty, number> = {
  standard: 1,
  intense: 2,
  master: 3,
};

const SEQUENCE_LENGTH = 16;

export const NBackSequenceGame: React.FC<NBackSequenceGameProps> = ({
  difficulty,
  onChangeDifficulty,
  onSessionComplete,
}) => {
  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [steps, setSteps] = useState<NBackStep[]>([]);
  const [stepIdx, setStepIdx] = useState(0);
  const [respondedThisStep, setRespondedThisStep] = useState<'match' | 'nomatch' | null>(null);
  const [stepFeedback, setStepFeedback] = useState<'correct' | 'wrong' | null>(null);

  const [hits, setHits] = useState(0);
  const [correctRejections, setCorrectRejections] = useState(0);
  const [misses, setMisses] = useState(0);
  const [falseAlarms, setFalseAlarms] = useState(0);
  const [latencies, setLatencies] = useState<number[]>([]);
  const [summary, setSummary] = useState<{
    score: number;
    accuracy: number;
    avgReactionMs: number;
    xpEarned: number;
  } | null>(null);

  const stepStartRef = useRef<number>(0);
  const stepTimerRef = useRef<number | null>(null);
  const statsRef = useRef({
    hits: 0,
    correctRejections: 0,
    misses: 0,
    falseAlarms: 0,
    latencies: [] as number[],
    responded: null as 'match' | 'nomatch' | null,
  });

  const nLevel = N_LEVEL_BY_DIFFICULTY[difficulty];
  const stepDurationMs = STEP_DURATION_MS[difficulty];

  const clearTimers = useCallback(() => {
    if (stepTimerRef.current !== null) {
      window.clearTimeout(stepTimerRef.current);
      stepTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  const finishSession = useCallback(
    (finalStats: typeof statsRef.current, activeSteps: NBackStep[]) => {
      clearTimers();
      const validLat = finalStats.latencies.filter((n) => n > 0);
      const avgReactionMs =
        validLat.length > 0
          ? Math.round(validLat.reduce((a, b) => a + b, 0) / validLat.length)
          : 0;
      const scored = scoreNBackSession({
        hits: finalStats.hits,
        correctRejections: finalStats.correctRejections,
        misses: finalStats.misses,
        falseAlarms: finalStats.falseAlarms,
        nLevel,
        avgReactionMs,
        difficulty,
      });

      setSummary({
        score: scored.score,
        accuracy: scored.accuracy,
        avgReactionMs,
        xpEarned: scored.xpEarned,
      });
      setGameState('GAME_OVER');
      gameAudio.playVictory();

      onSessionComplete({
        gameId: 'nback-sequence',
        gameTitle: '工作记忆 N-Back 追踪',
        category: 'memory',
        difficulty,
        score: scored.score,
        accuracy: scored.accuracy,
        avgReactionMs,
        bestReactionMs: validLat.length > 0 ? Math.round(Math.min(...validLat)) : 0,
        maxSpan: nLevel,
        roundsCompleted: activeSteps.length,
        xpEarned: scored.xpEarned,
      });
    },
    [clearTimers, difficulty, nLevel, onSessionComplete]
  );

  const startTraining = useCallback(() => {
    clearTimers();
    const generated = generateNBackSequence(SEQUENCE_LENGTH, nLevel, 9, 0.36);
    statsRef.current = {
      hits: 0,
      correctRejections: 0,
      misses: 0,
      falseAlarms: 0,
      latencies: [],
      responded: null,
    };
    setSteps(generated);
    setStepIdx(0);
    setRespondedThisStep(null);
    setStepFeedback(null);
    setHits(0);
    setCorrectRejections(0);
    setMisses(0);
    setFalseAlarms(0);
    setLatencies([]);
    setSummary(null);
    setGameState('PLAYING');
    gameAudio.playSelect();
  }, [clearTimers, nLevel]);

  // Drive step progression
  useEffect(() => {
    if (gameState !== 'PLAYING' || steps.length === 0) return;

    const currentStep = steps[stepIdx];
    if (!currentStep) return;

    stepStartRef.current = performance.now();
    statsRef.current.responded = null;
    setRespondedThisStep(null);
    setStepFeedback(null);

    if (stepIdx < nLevel) {
      gameAudio.playTick();
    }

    stepTimerRef.current = window.setTimeout(() => {
      // Score step timeout if user did not manually press on an eligible step
      if (stepIdx >= nLevel && statsRef.current.responded === null) {
        if (currentStep.isMatch) {
          statsRef.current.misses += 1;
          setMisses(statsRef.current.misses);
        } else {
          statsRef.current.correctRejections += 1;
          setCorrectRejections(statsRef.current.correctRejections);
        }
      }

      const nextIndex = stepIdx + 1;
      if (nextIndex >= steps.length) {
        finishSession(statsRef.current, steps);
      } else {
        setStepIdx(nextIndex);
      }
    }, stepDurationMs);

    return () => clearTimers();
  }, [gameState, steps, stepIdx, nLevel, stepDurationMs, clearTimers, finishSession]);

  const handleResponse = useCallback(
    (choice: 'match' | 'nomatch') => {
      if (gameState !== 'PLAYING') return;
      if (stepIdx < nLevel || statsRef.current.responded !== null) return;
      const currentStep = steps[stepIdx];
      if (!currentStep) return;

      const latency = Math.max(80, Math.round(performance.now() - stepStartRef.current));
      statsRef.current.responded = choice;
      statsRef.current.latencies.push(latency);
      setRespondedThisStep(choice);
      setLatencies([...statsRef.current.latencies]);

      const isUserMatch = choice === 'match';
      const isRight = isUserMatch === currentStep.isMatch;

      if (isUserMatch && currentStep.isMatch) {
        statsRef.current.hits += 1;
        setHits(statsRef.current.hits);
      } else if (!isUserMatch && !currentStep.isMatch) {
        statsRef.current.correctRejections += 1;
        setCorrectRejections(statsRef.current.correctRejections);
      } else if (isUserMatch && !currentStep.isMatch) {
        statsRef.current.falseAlarms += 1;
        setFalseAlarms(statsRef.current.falseAlarms);
      } else {
        statsRef.current.misses += 1;
        setMisses(statsRef.current.misses);
      }

      setStepFeedback(isRight ? 'correct' : 'wrong');
      if (isRight) {
        gameAudio.playSuccess();
      } else {
        gameAudio.playMistake();
      }
    },
    [gameState, stepIdx, nLevel, steps]
  );

  // Keyboard shortcuts during active play (Space / M = Match, N = No Match)
  useEffect(() => {
    if (gameState !== 'PLAYING') return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key.toLowerCase() === 'm') {
        e.preventDefault();
        handleResponse('match');
      } else if (e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleResponse('nomatch');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [gameState, handleResponse]);

  const currentStep = steps[stepIdx];
  const isWarmupStep = stepIdx < nLevel;

  if (gameState === 'TITLE_MENU') {
    return (
      <div className="rounded-2xl bg-[#141821] text-[#FAF8F5] p-6 sm:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="space-y-1.5">
            <div className="text-xs text-[#D4A656] font-mono tabular-nums">
              {nLevel}-Back Working Memory · {SEQUENCE_LENGTH} Steps
            </div>
            <h2 className="font-serif-editorial text-2xl font-bold text-white">
              工作记忆 N-Back 空间追踪
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed max-w-2xl">
              观察 3×3 矩阵依次亮起的位置。从第 {nLevel + 1} 步起，判断当前方块是否与{' '}
              <strong className="text-[#EDD08B]">前第 {nLevel} 步</strong> 位于同一格。
            </p>
          </div>
          <div className="shrink-0">
            <button
              type="button"
              onClick={startTraining}
              className="min-h-[44px] px-6 py-2.5 rounded-xl font-bold text-xs text-[#181411] bg-[#E5C07B] hover:bg-[#EDD08B] transition-colors inline-flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Play className="w-4 h-4 fill-current" aria-hidden="true" />
              <span>开始训练</span>
            </button>
          </div>
        </div>

        <div className="space-y-2.5">
          <div className="text-xs text-stone-400 font-medium">选择记忆阶数与节奏难度</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {BRAIN_GYM_DIFFICULTIES.map((d) => {
              const active = difficulty === d.id;
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
                      {N_LEVEL_BY_DIFFICULTY[d.id]}-Back
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-400 leading-relaxed">{d.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-stone-300 pt-1">
          <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10">
            <strong className="text-white block mb-1">位置一致（Match）</strong>
            点击「位置一致」或按键盘 <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono">Space</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono">M</kbd> 键。
          </div>
          <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10">
            <strong className="text-white block mb-1">位置不同（Non-Match）</strong>
            点击「不匹配」或按 <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono">N</kbd> 键，若未点击则步末自动计为不匹配。
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'GAME_OVER' && summary) {
    return (
      <div className="rounded-2xl bg-[#141821] text-[#FAF8F5] p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <div className="text-xs font-mono text-[#D4A656]">
              N-Back Training Complete · {nLevel}-Back
            </div>
            <h2 className="font-serif-editorial text-2xl font-bold text-white mt-1">
              本轮工作记忆训练完成
            </h2>
          </div>
          <button
            type="button"
            onClick={startTraining}
            className="min-h-[44px] px-5 py-2.5 rounded-xl font-bold text-xs text-[#181411] bg-[#E5C07B] hover:bg-[#EDD08B] transition-colors inline-flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            <span>再练一轮</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-numeric tabular-nums">
          <div className="p-4 rounded-xl bg-white/[0.05] border border-white/10">
            <div className="text-[11px] text-stone-400">综合得分</div>
            <div className="text-2xl font-bold text-[#EDD08B] mt-1">{summary.score.toLocaleString()}</div>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.05] border border-white/10">
            <div className="text-[11px] text-stone-400">判断准确率</div>
            <div className="text-2xl font-bold text-emerald-400 mt-1">{summary.accuracy}%</div>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.05] border border-white/10">
            <div className="text-[11px] text-stone-400">平均响应速度</div>
            <div className="text-2xl font-bold text-white mt-1">
              {summary.avgReactionMs > 0 ? `${summary.avgReactionMs} ms` : '—'}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.05] border border-white/10">
            <div className="text-[11px] text-stone-400">获得经验值</div>
            <div className="text-2xl font-bold text-white mt-1">+{summary.xpEarned} XP</div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-stone-300 font-numeric tabular-nums pt-1">
          <div className="p-3 rounded-lg bg-white/[0.03] border border-white/10 flex justify-between">
            <span>精确命中</span>
            <strong className="text-emerald-400">{hits}</strong>
          </div>
          <div className="p-3 rounded-lg bg-white/[0.03] border border-white/10 flex justify-between">
            <span>正确排异</span>
            <strong className="text-white">{correctRejections}</strong>
          </div>
          <div className="p-3 rounded-lg bg-white/[0.03] border border-white/10 flex justify-between">
            <span>漏报</span>
            <strong className="text-amber-300">{misses}</strong>
          </div>
          <div className="p-3 rounded-lg bg-white/[0.03] border border-white/10 flex justify-between">
            <span>误报</span>
            <strong className="text-rose-400">{falseAlarms}</strong>
          </div>
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
            <Brain className="w-4 h-4 text-[#D4A656]" aria-hidden="true" />
            <span>{nLevel}-Back 记忆步进</span>
          </span>
          <span aria-hidden="true" className="text-stone-600">·</span>
          <span>
            进度 <strong className="text-white">{stepIdx + 1}</strong> / {steps.length}
          </span>
        </div>

        <div className="flex items-center gap-4 text-stone-300">
          <span>
            命中 <strong className="text-emerald-400">{hits}</strong>
          </span>
          <span>
            误报 <strong className="text-rose-400">{falseAlarms}</strong>
          </span>
          <span className="flex items-center gap-1 text-stone-400">
            <Timer className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{(stepDurationMs / 1000).toFixed(1)}s</span>
          </span>
        </div>
      </div>

      {/* Prompt status */}
      <div className="text-center space-y-1 min-h-[40px]">
        {isWarmupStep ? (
          <p className="text-xs sm:text-sm text-[#EDD08B] font-medium">
            热身记忆期：记住当前方块位置（{stepIdx + 1} / {nLevel}）
          </p>
        ) : stepFeedback === 'correct' ? (
          <p className="text-xs sm:text-sm text-emerald-400 font-semibold inline-flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
            <span>判断准确</span>
          </p>
        ) : stepFeedback === 'wrong' ? (
          <p className="text-xs sm:text-sm text-rose-400 font-semibold inline-flex items-center gap-1.5">
            <XCircle className="w-4 h-4" aria-hidden="true" />
            <span>偏差记录（已继续推进）</span>
          </p>
        ) : (
          <p className="text-xs sm:text-sm text-stone-300">
            当前亮起位置是否与 <strong className="text-white">前第 {nLevel} 步</strong> 相同？
          </p>
        )}
      </div>

      {/* 3x3 Spatial Matrix */}
      <div className="max-w-[290px] sm:max-w-[320px] mx-auto grid grid-cols-3 gap-3">
        {Array.from({ length: 9 }, (_, cellIdx) => {
          const isLit = currentStep?.cell === cellIdx;
          return (
            <div
              key={`${stepIdx}-${cellIdx}`}
              className={`aspect-square rounded-2xl border flex items-center justify-center transition-all duration-150 ${
                isLit
                  ? 'bg-[#D4A656] border-[#F3D89E] shadow-[0_0_24px_rgba(212,166,86,0.35)] scale-[1.02]'
                  : 'bg-[#1D2330] border-white/10'
              }`}
              aria-label={isLit ? `当前亮起格子 ${cellIdx + 1}` : `格子 ${cellIdx + 1}`}
            >
              {isLit && (
                <Sparkles className="w-6 h-6 text-[#181411]" aria-hidden="true" />
              )}
            </div>
          );
        })}
      </div>

      {/* Interactive Controls */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
        <button
          type="button"
          disabled={isWarmupStep || respondedThisStep !== null}
          onClick={() => handleResponse('match')}
          className={`min-h-[46px] px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-40 disabled:cursor-not-allowed ${
            respondedThisStep === 'match'
              ? 'bg-emerald-500 text-[#141821]'
              : 'bg-[#E5C07B] hover:bg-[#EDD08B] text-[#181411]'
          }`}
        >
          位置一致 (Space)
        </button>

        <button
          type="button"
          disabled={isWarmupStep || respondedThisStep !== null}
          onClick={() => handleResponse('nomatch')}
          className={`min-h-[46px] px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold border transition-colors cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-40 disabled:cursor-not-allowed ${
            respondedThisStep === 'nomatch'
              ? 'bg-white text-[#181411] border-white'
              : 'bg-white/[0.06] hover:bg-white/[0.12] text-white border-white/15'
          }`}
        >
          位置不同 (N)
        </button>

        <button
          type="button"
          onClick={() => setGameState('TITLE_MENU')}
          className="min-h-[46px] px-4 py-2.5 rounded-xl text-xs font-medium text-stone-400 hover:text-white border border-white/10 cursor-pointer whitespace-nowrap shrink-0"
        >
          退出本轮
        </button>
      </div>
    </div>
  );
};

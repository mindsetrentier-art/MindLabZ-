import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  CheckCircle2,
  Play,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { gameAudio } from '../../utils/gameAudio';
import {
  BRAIN_GYM_DIFFICULTIES,
  BrainGymDifficulty,
  BrainGymSessionInput,
  GoNoGoTrial,
  generateGoNoGoTrials,
  scoreGoNoGoSession,
} from '../../utils/brainGymHelpers';

interface GoNoGoGateGameProps {
  difficulty: BrainGymDifficulty;
  onChangeDifficulty: (d: BrainGymDifficulty) => void;
  onSessionComplete: (session: Omit<BrainGymSessionInput, 'id' | 'userId'>) => void;
}

type GameState = 'TITLE_MENU' | 'FIXATION' | 'STIMULUS' | 'GAME_OVER';

const TOTAL_TRIALS = 20;
const FIXATION_MS = 280;

const WINDOW_BY_DIFFICULTY: Record<BrainGymDifficulty, number> = {
  standard: 1350,
  intense: 1050,
  master: 820,
};

export const GoNoGoGateGame: React.FC<GoNoGoGateGameProps> = ({
  difficulty,
  onChangeDifficulty,
  onSessionComplete,
}) => {
  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [trials, setTrials] = useState<GoNoGoTrial[]>([]);
  const [trialIdx, setTrialIdx] = useState(0);
  const [feedback, setFeedback] = useState<{
    kind: 'hit' | 'withhold' | 'commission' | 'omission';
    label: string;
  } | null>(null);
  const [goHits, setGoHits] = useState(0);
  const [correctWithholds, setCorrectWithholds] = useState(0);
  const [commissionErrors, setCommissionErrors] = useState(0);
  const [omissionErrors, setOmissionErrors] = useState(0);
  const [summary, setSummary] = useState<{
    score: number;
    accuracy: number;
    avgReactionMs: number;
    bestReactionMs: number;
    xpEarned: number;
  } | null>(null);

  const timerRef = useRef<number | null>(null);
  const stimulusStartRef = useRef<number>(0);
  const respondedRef = useRef<boolean>(false);
  const stateRef = useRef({
    goHits: 0,
    correctWithholds: 0,
    commissionErrors: 0,
    omissionErrors: 0,
    goLatenciesMs: [] as number[],
    totalGo: 0,
    totalNoGo: 0,
  });
  const trialsRef = useRef<GoNoGoTrial[]>([]);
  const trialIdxRef = useRef<number>(0);

  const responseWindowMs = WINDOW_BY_DIFFICULTY[difficulty];

  const clearTimers = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  const finishSession = useCallback(() => {
    clearTimers();
    const s = stateRef.current;
    const scored = scoreGoNoGoSession({
      goLatenciesMs: s.goLatenciesMs,
      goHits: s.goHits,
      totalGo: s.totalGo,
      correctWithholds: s.correctWithholds,
      totalNoGo: s.totalNoGo,
      difficulty,
    });

    setSummary(scored);
    setGameState('GAME_OVER');
    gameAudio.playVictory();

    onSessionComplete({
      gameId: 'go-nogo-gate',
      gameTitle: 'Go / No-Go 抑制控制门',
      category: 'reaction',
      difficulty,
      score: scored.score,
      accuracy: scored.accuracy,
      avgReactionMs: scored.avgReactionMs,
      bestReactionMs: scored.bestReactionMs,
      maxSpan: 0,
      roundsCompleted: trialsRef.current.length,
      xpEarned: scored.xpEarned,
    });
  }, [clearTimers, difficulty, onSessionComplete]);

  const advanceOrFinish = useCallback(
    (nextIndex: number) => {
      if (nextIndex >= trialsRef.current.length) {
        finishSession();
        return;
      }

      clearTimers();
      trialIdxRef.current = nextIndex;
      setTrialIdx(nextIndex);
      setFeedback(null);
      respondedRef.current = false;
      setGameState('FIXATION');

      timerRef.current = window.setTimeout(() => {
        setGameState('STIMULUS');
        stimulusStartRef.current = performance.now();

        timerRef.current = window.setTimeout(() => {
          if (respondedRef.current) return;
          respondedRef.current = true;
          const activeTrial = trialsRef.current[nextIndex];
          if (activeTrial.type === 'go') {
            stateRef.current.omissionErrors += 1;
            setOmissionErrors(stateRef.current.omissionErrors);
            gameAudio.playMistake();
            setFeedback({ kind: 'omission', label: '超时漏按 (Omission)' });
          } else {
            stateRef.current.correctWithholds += 1;
            setCorrectWithholds(stateRef.current.correctWithholds);
            gameAudio.playTap();
            setFeedback({ kind: 'withhold', label: '抑制成功 · 稳住冲动' });
          }

          timerRef.current = window.setTimeout(() => {
            advanceOrFinish(nextIndex + 1);
          }, 210);
        }, responseWindowMs);
      }, FIXATION_MS);
    },
    [clearTimers, finishSession, responseWindowMs]
  );

  const startTraining = () => {
    clearTimers();
    const generated = generateGoNoGoTrials(TOTAL_TRIALS, 0.65);
    const totalGo = generated.filter((t) => t.type === 'go').length;
    const totalNoGo = generated.length - totalGo;

    trialsRef.current = generated;
    setTrials(generated);
    stateRef.current = {
      goHits: 0,
      correctWithholds: 0,
      commissionErrors: 0,
      omissionErrors: 0,
      goLatenciesMs: [],
      totalGo,
      totalNoGo,
    };
    setGoHits(0);
    setCorrectWithholds(0);
    setCommissionErrors(0);
    setOmissionErrors(0);
    setFeedback(null);
    setSummary(null);
    gameAudio.playTap();
    advanceOrFinish(0);
  };

  const handleStimulusPress = useCallback(() => {
    if (gameState !== 'STIMULUS' || respondedRef.current) return;
    respondedRef.current = true;
    clearTimers();

    const idx = trialIdxRef.current;
    const activeTrial = trialsRef.current[idx];
    if (!activeTrial) return;

    if (activeTrial.type === 'go') {
      const rt = Math.max(1, Math.round(performance.now() - stimulusStartRef.current));
      stateRef.current.goHits += 1;
      stateRef.current.goLatenciesMs.push(rt);
      setGoHits(stateRef.current.goHits);
      gameAudio.playSuccess();
      setFeedback({ kind: 'hit', label: `命中 +${rt} ms` });
    } else {
      stateRef.current.commissionErrors += 1;
      setCommissionErrors(stateRef.current.commissionErrors);
      gameAudio.playMistake();
      setFeedback({ kind: 'commission', label: '冲动误触 NO-GO 诱饵' });
    }

    timerRef.current = window.setTimeout(() => {
      advanceOrFinish(idx + 1);
    }, 240);
  }, [advanceOrFinish, clearTimers, gameState]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'STIMULUS') return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleStimulusPress();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [gameState, handleStimulusPress]);

  const currentTrial = trials[trialIdx];

  if (gameState === 'TITLE_MENU') {
    return (
      <div className="rounded-2xl bg-[#141821] text-[#FAF8F5] p-6 sm:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="space-y-1.5">
            <div className="text-xs text-[#D4A656] font-mono tabular-nums">
              Choice Reaction & Impulse Inhibition · {TOTAL_TRIALS} Trials
            </div>
            <h2 className="font-serif-editorial text-2xl font-bold text-white">
              Go / No-Go 抑制控制门
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed max-w-2xl">
              看到 <strong className="text-emerald-300">GO 圆形靶标</strong> 时立即点击或按空格；看到{' '}
              <strong className="text-rose-300">NO-GO 菱形警戒标</strong> 时必须按兵不动直至窗口结束。兼顾极速与前额叶冲动抑制。
            </p>
          </div>
          <div className="shrink-0">
            <button
              type="button"
              onClick={startTraining}
              className="min-h-[44px] px-6 py-2.5 rounded-xl font-bold text-xs text-[#181411] bg-[#E5C07B] hover:bg-[#EDD08B] transition-colors inline-flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Play className="w-4 h-4 fill-current" aria-hidden="true" />
              <span>开始 20 轮抑制测验</span>
            </button>
          </div>
        </div>

        <div className="space-y-2.5">
          <div className="text-xs text-stone-400 font-medium">选择反应窗口时长与刺激节奏</div>
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
                      {WINDOW_BY_DIFFICULTY[d.id]} ms
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-400 leading-relaxed">{d.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-stone-300">
          <div className="p-3.5 rounded-xl bg-emerald-950/35 border border-emerald-500/30 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-500/20 border-2 border-emerald-400 shrink-0" />
            <div>
              <strong className="text-emerald-300 block">GO 圆形信号</strong>
              立即点击面板或按 <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono">Space</kbd> 触发响应
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-rose-950/35 border border-rose-500/30 flex items-center gap-3">
            <div className="w-7 h-7 rotate-45 bg-rose-500/20 border-2 border-rose-400 shrink-0 mx-1" />
            <div>
              <strong className="text-rose-300 block">NO-GO 菱形信号</strong>
              双手离开按键，等待倒计时结束即可得分
            </div>
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
              Go / No-Go Impulse Gate · {TOTAL_TRIALS} Trials Complete
            </div>
            <h2 className="font-serif-editorial text-2xl font-bold text-white mt-1">
              选择反应与冲动抑制报告
            </h2>
          </div>
          <button
            type="button"
            onClick={startTraining}
            className="min-h-[44px] px-5 py-2.5 rounded-xl font-bold text-xs text-[#181411] bg-[#E5C07B] hover:bg-[#EDD08B] transition-colors inline-flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            <span>再测一轮</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-numeric tabular-nums">
          <div className="p-4 rounded-xl bg-white/[0.05] border border-white/10">
            <div className="text-[11px] text-stone-400">综合得分</div>
            <div className="text-2xl font-bold text-[#EDD08B] mt-1">
              {summary.score.toLocaleString()}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.05] border border-white/10">
            <div className="text-[11px] text-stone-400">综合准确率</div>
            <div className="text-2xl font-bold text-emerald-400 mt-1">{summary.accuracy}%</div>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.05] border border-white/10">
            <div className="text-[11px] text-stone-400">GO 平均反应</div>
            <div className="text-2xl font-bold text-white mt-1">
              {summary.avgReactionMs > 0 ? `${summary.avgReactionMs} ms` : '—'}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.05] border border-white/10">
            <div className="text-[11px] text-stone-400">最快单次 / 经验</div>
            <div className="text-2xl font-bold text-white mt-1">
              {summary.bestReactionMs > 0 ? `${summary.bestReactionMs}ms` : '—'} · +{summary.xpEarned}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-stone-300 font-numeric tabular-nums pt-1">
          <div className="p-3 rounded-lg bg-white/[0.03] border border-white/10 flex justify-between">
            <span>GO 命中</span>
            <strong className="text-emerald-400">{goHits}</strong>
          </div>
          <div className="p-3 rounded-lg bg-white/[0.03] border border-white/10 flex justify-between">
            <span>NO-GO 成功抑制</span>
            <strong className="text-white">{correctWithholds}</strong>
          </div>
          <div className="p-3 rounded-lg bg-white/[0.03] border border-white/10 flex justify-between">
            <span>冲动误触</span>
            <strong className="text-rose-400">{commissionErrors}</strong>
          </div>
          <div className="p-3 rounded-lg bg-white/[0.03] border border-white/10 flex justify-between">
            <span>超时漏按</span>
            <strong className="text-amber-300">{omissionErrors}</strong>
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
            <ShieldCheck className="w-4 h-4 text-[#D4A656]" aria-hidden="true" />
            <span>抑制控制门</span>
          </span>
          <span aria-hidden="true" className="text-stone-600">·</span>
          <span>
            刺激 <strong className="text-white">{trialIdx + 1}</strong> / {trials.length}
          </span>
        </div>

        <div className="flex items-center gap-4 text-stone-300">
          <span>
            命中 <strong className="text-emerald-400">{goHits}</strong>
          </span>
          <span>
            抑制 <strong className="text-white">{correctWithholds}</strong>
          </span>
          <span>
            误触 <strong className="text-rose-400">{commissionErrors}</strong>
          </span>
        </div>
      </div>

      {/* Main Stimulus Gate */}
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          handleStimulusPress();
        }}
        onTouchStart={(e) => {
          e.preventDefault();
          handleStimulusPress();
        }}
        className={`w-full min-h-[260px] sm:min-h-[300px] rounded-2xl border-2 p-6 flex flex-col items-center justify-center text-center gap-4 transition-colors duration-100 select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5C07B] ${
          gameState === 'FIXATION'
            ? 'bg-[#191F2B] border-white/10 text-stone-400'
            : currentTrial?.type === 'go'
            ? 'bg-emerald-950/65 border-emerald-400 text-emerald-50'
            : 'bg-rose-950/65 border-rose-400 text-rose-50'
        }`}
      >
        {gameState === 'FIXATION' ? (
          <div className="text-4xl font-light text-stone-500 select-none">+</div>
        ) : currentTrial?.type === 'go' ? (
          <>
            <div className="w-20 h-20 rounded-full bg-emerald-500/25 border-4 border-emerald-300 flex items-center justify-center shadow-[0_0_28px_rgba(16,185,129,0.3)]">
              <CheckCircle2 className="w-9 h-9 text-emerald-200" aria-hidden="true" />
            </div>
            <div className="font-serif-editorial text-2xl sm:text-3xl font-extrabold text-emerald-200">
              GO · 立即点击 / 空格
            </div>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rotate-45 bg-rose-500/25 border-4 border-rose-300 flex items-center justify-center shadow-[0_0_28px_rgba(244,63,94,0.3)] my-2">
              <ShieldAlert className="w-8 h-8 -rotate-45 text-rose-200" aria-hidden="true" />
            </div>
            <div className="font-serif-editorial text-2xl sm:text-3xl font-extrabold text-rose-200">
              NO-GO · 保持抑制勿按
            </div>
          </>
        )}

        <div className="min-h-[24px] text-xs font-mono tabular-nums">
          {feedback ? (
            <span
              className={`inline-flex items-center gap-1.5 font-semibold ${
                feedback.kind === 'hit' || feedback.kind === 'withhold'
                  ? 'text-emerald-300'
                  : 'text-rose-300'
              }`}
            >
              {feedback.kind === 'commission' || feedback.kind === 'omission' ? (
                <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
              )}
              <span>{feedback.label}</span>
            </span>
          ) : (
            <span className="text-stone-400">响应窗口 {responseWindowMs} ms</span>
          )}
        </div>
      </button>

      <div className="flex justify-end">
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

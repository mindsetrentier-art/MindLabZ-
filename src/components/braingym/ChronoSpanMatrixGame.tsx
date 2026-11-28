import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Brain, CheckCircle2, Play, RotateCcw, XCircle } from 'lucide-react';
import { gameAudio } from '../../utils/gameAudio';
import {
  BRAIN_GYM_DIFFICULTIES,
  BrainGymDifficulty,
  BrainGymSessionInput,
  generateChronoSpanTargets,
  scoreChronoSpanSession,
} from '../../utils/brainGymHelpers';

interface ChronoSpanMatrixGameProps {
  difficulty: BrainGymDifficulty;
  onChangeDifficulty: (d: BrainGymDifficulty) => void;
  onSessionComplete: (session: Omit<BrainGymSessionInput, 'id' | 'userId'>) => void;
}

type GameState = 'TITLE_MENU' | 'MEMORIZE' | 'RECALL' | 'ROUND_RESULT' | 'GAME_OVER';

const GRID_SIDE: Record<BrainGymDifficulty, number> = {
  standard: 4,
  intense: 4,
  master: 5,
};

const START_SPAN: Record<BrainGymDifficulty, number> = {
  standard: 4,
  intense: 5,
  master: 5,
};

const MEMORIZE_DURATION_MS: Record<BrainGymDifficulty, number> = {
  standard: 2200,
  intense: 1700,
  master: 1550,
};

const MAX_LIVES = 2;

export const ChronoSpanMatrixGame: React.FC<ChronoSpanMatrixGameProps> = ({
  difficulty,
  onChangeDifficulty,
  onSessionComplete,
}) => {
  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [span, setSpan] = useState(START_SPAN[difficulty]);
  const [targets, setTargets] = useState<number[]>([]);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [lives, setLives] = useState(MAX_LIVES);
  const [roundsCleared, setRoundsCleared] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [maxSpanAchieved, setMaxSpanAchieved] = useState(0);
  const [lastRoundPassed, setLastRoundPassed] = useState<boolean | null>(null);
  const [latencies, setLatencies] = useState<number[]>([]);
  const [summary, setSummary] = useState<{
    score: number;
    accuracy: number;
    maxSpan: number;
    xpEarned: number;
  } | null>(null);

  const recallStartRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);

  const gridSide = GRID_SIDE[difficulty];
  const totalCells = gridSide * gridSide;
  const isReverseMode = difficulty === 'master';

  const clearTimers = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  const launchRound = useCallback(
    (nextSpan: number, currentDifficulty: BrainGymDifficulty) => {
      clearTimers();
      const side = GRID_SIDE[currentDifficulty];
      const cellCount = side * side;
      const clampedSpan = Math.min(cellCount - 1, nextSpan);
      const generated = generateChronoSpanTargets(clampedSpan, cellCount);
      setSpan(clampedSpan);
      setTargets(generated);
      setUserSequence([]);
      setLastRoundPassed(null);
      setGameState('MEMORIZE');
      gameAudio.playTap();

      const viewMs = MEMORIZE_DURATION_MS[currentDifficulty] + clampedSpan * 220;
      timerRef.current = window.setTimeout(() => {
        setGameState('RECALL');
        recallStartRef.current = performance.now();
      }, viewMs);
    },
    [clearTimers]
  );

  const startTraining = () => {
    const startSpan = START_SPAN[difficulty];
    setLives(MAX_LIVES);
    setRoundsCleared(0);
    setTotalAttempts(0);
    setMaxSpanAchieved(0);
    setLatencies([]);
    setSummary(null);
    launchRound(startSpan, difficulty);
  };

  const concludeGame = (
    finalMaxSpan: number,
    finalCleared: number,
    finalAttempts: number,
    finalLatencies: number[]
  ) => {
    clearTimers();
    const avgReactionMs =
      finalLatencies.length > 0
        ? Math.round(finalLatencies.reduce((a, b) => a + b, 0) / finalLatencies.length)
        : 0;
    const scored = scoreChronoSpanSession({
      maxSpan: finalMaxSpan,
      roundsCleared: finalCleared,
      totalAttempts: finalAttempts,
      avgReactionMs,
      difficulty,
    });
    setSummary({
      score: scored.score,
      accuracy: scored.accuracy,
      maxSpan: finalMaxSpan,
      xpEarned: scored.xpEarned,
    });
    setGameState('GAME_OVER');
    gameAudio.playVictory();

    onSessionComplete({
      gameId: 'chrono-span',
      gameTitle: '顺逆序广度矩阵',
      category: 'memory',
      difficulty,
      score: scored.score,
      accuracy: scored.accuracy,
      avgReactionMs,
      bestReactionMs:
        finalLatencies.length > 0 ? Math.round(Math.min(...finalLatencies)) : 0,
      maxSpan: finalMaxSpan,
      roundsCompleted: finalAttempts,
      xpEarned: scored.xpEarned,
    });
  };

  const handleCellClick = (cellIdx: number) => {
    if (gameState !== 'RECALL' || userSequence.includes(cellIdx)) return;

    const expectedSequence = isReverseMode ? [...targets].reverse() : targets;
    const stepPos = userSequence.length;
    const isCorrectCell = expectedSequence[stepPos] === cellIdx;
    const nextSeq = [...userSequence, cellIdx];
    const nowLatency = Math.max(80, Math.round(performance.now() - recallStartRef.current));
    const nextLatencies = [...latencies, nowLatency];
    recallStartRef.current = performance.now();
    setLatencies(nextLatencies);

    if (!isCorrectCell) {
      gameAudio.playMistake();
      const nextAttempts = totalAttempts + 1;
      const nextLives = lives - 1;
      setUserSequence(nextSeq);
      setTotalAttempts(nextAttempts);
      setLives(nextLives);
      setLastRoundPassed(false);
      setGameState('ROUND_RESULT');

      timerRef.current = window.setTimeout(() => {
        if (nextLives <= 0) {
          concludeGame(maxSpanAchieved, roundsCleared, nextAttempts, nextLatencies);
        } else {
          launchRound(Math.max(START_SPAN[difficulty], span), difficulty);
        }
      }, 1150);
      return;
    }

    gameAudio.playSelect();
    setUserSequence(nextSeq);

    if (nextSeq.length === expectedSequence.length) {
      gameAudio.playSuccess();
      const nextCleared = roundsCleared + 1;
      const nextAttempts = totalAttempts + 1;
      const nextMaxSpan = Math.max(maxSpanAchieved, span);
      setRoundsCleared(nextCleared);
      setTotalAttempts(nextAttempts);
      setMaxSpanAchieved(nextMaxSpan);
      setLastRoundPassed(true);
      setGameState('ROUND_RESULT');

      const capSpan = Math.min(10, totalCells - 1);
      timerRef.current = window.setTimeout(() => {
        if (span >= capSpan) {
          concludeGame(nextMaxSpan, nextCleared, nextAttempts, nextLatencies);
        } else {
          launchRound(span + 1, difficulty);
        }
      }, 950);
    }
  };

  if (gameState === 'TITLE_MENU') {
    return (
      <div className="rounded-2xl bg-[#141821] text-[#FAF8F5] p-6 sm:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="space-y-1.5">
            <div className="text-xs text-[#D4A656] font-mono tabular-nums">
              {gridSide}×{gridSide} Spatial Matrix · {isReverseMode ? 'Reverse Recall' : 'Forward Recall'}
            </div>
            <h2 className="font-serif-editorial text-2xl font-bold text-white">
              顺逆序广度矩阵（Sequence Span）
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed max-w-2xl">
              编号节点将短暂显现在网格中。遮蔽后请按照{' '}
              <strong className="text-[#EDD08B]">
                {isReverseMode ? '从大到小的逆序（Reverse）' : '1 → 2 → 3 的顺向顺序'}
              </strong>{' '}
              依次点击复现。每通关一轮广度 +1，容错 {MAX_LIVES} 次。
            </p>
          </div>
          <button
            type="button"
            onClick={startTraining}
            className="min-h-[44px] px-6 py-2.5 rounded-xl font-bold text-xs text-[#181411] bg-[#E5C07B] hover:bg-[#EDD08B] transition-colors inline-flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Play className="w-4 h-4 fill-current" aria-hidden="true" />
            <span>开始测试</span>
          </button>
        </div>

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
                    {GRID_SIDE[d.id]}×{GRID_SIDE[d.id]} · {d.id === 'master' ? '逆序' : '顺序'}
                  </span>
                </div>
                <p className="text-[11px] text-stone-400 leading-relaxed">{d.description}</p>
              </button>
            );
          })}
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
              Chronological Span Complete
            </div>
            <h2 className="font-serif-editorial text-2xl font-bold text-white mt-1">
              本轮空间广度记录已归档
            </h2>
          </div>
          <button
            type="button"
            onClick={startTraining}
            className="min-h-[44px] px-5 py-2.5 rounded-xl font-bold text-xs text-[#181411] bg-[#E5C07B] hover:bg-[#EDD08B] transition-colors inline-flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            <span>再次挑战</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-numeric tabular-nums">
          <div className="p-4 rounded-xl bg-white/[0.05] border border-white/10">
            <div className="text-[11px] text-stone-400">最大成功广度</div>
            <div className="text-2xl font-bold text-[#EDD08B] mt-1">{summary.maxSpan} 节点</div>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.05] border border-white/10">
            <div className="text-[11px] text-stone-400">综合得分</div>
            <div className="text-2xl font-bold text-white mt-1">{summary.score.toLocaleString()}</div>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.05] border border-white/10">
            <div className="text-[11px] text-stone-400">回合准确率</div>
            <div className="text-2xl font-bold text-emerald-400 mt-1">{summary.accuracy}%</div>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.05] border border-white/10">
            <div className="text-[11px] text-stone-400">获得经验值</div>
            <div className="text-2xl font-bold text-white mt-1">+{summary.xpEarned} XP</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-[#141821] text-[#FAF8F5] p-5 sm:p-7 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3.5 text-xs font-numeric tabular-nums">
        <div className="flex items-center gap-3 text-stone-300">
          <span className="font-bold text-white flex items-center gap-1.5">
            <Brain className="w-4 h-4 text-[#D4A656]" aria-hidden="true" />
            <span>当前广度: {span} 节点</span>
          </span>
          <span aria-hidden="true" className="text-stone-600">·</span>
          <span className="text-[#EDD08B]">
            {isReverseMode ? '逆序复现 (Max → 1)' : '顺序复现 (1 → Max)'}
          </span>
        </div>

        <div className="flex items-center gap-4 text-stone-300">
          <span>
            已通关 <strong className="text-emerald-400">{roundsCleared}</strong>
          </span>
          <span>
            剩余容错 <strong className={lives === 1 ? 'text-rose-400' : 'text-white'}>{lives}</strong>
          </span>
        </div>
      </div>

      <div className="text-center min-h-[32px]">
        {gameState === 'MEMORIZE' && (
          <p className="text-xs sm:text-sm font-semibold text-[#EDD08B]">
            记忆阶段：牢记各个数字编号所在的空间坐标...
          </p>
        )}
        {gameState === 'RECALL' && (
          <p className="text-xs sm:text-sm font-semibold text-white">
            复现阶段：请按{' '}
            <span className="text-emerald-400">
              {isReverseMode ? '倒序（从最后一位至第 1 位）' : '正序（1 至 ' + span + '）'}
            </span>{' '}
            点击网格（已完成 {userSequence.length}/{targets.length}）
          </p>
        )}
        {gameState === 'ROUND_RESULT' && (
          <p
            className={`text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 ${
              lastRoundPassed ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {lastRoundPassed ? (
              <>
                <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                <span>序列完全匹配，广度升级！</span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4" aria-hidden="true" />
                <span>序位出现偏差，准备校准下一回合</span>
              </>
            )}
          </p>
        )}
      </div>

      <div
        className="mx-auto grid gap-2.5 sm:gap-3"
        style={{
          gridTemplateColumns: `repeat(${gridSide}, minmax(0, 1fr))`,
          maxWidth: gridSide === 5 ? '360px' : '320px',
        }}
      >
        {Array.from({ length: totalCells }, (_, cellIdx) => {
          const orderNum = targets.indexOf(cellIdx) + 1;
          const isTarget = orderNum > 0;
          const clickedOrder = userSequence.indexOf(cellIdx) + 1;
          const isClicked = clickedOrder > 0;

          const showNumber =
            (gameState === 'MEMORIZE' && isTarget) ||
            (gameState === 'ROUND_RESULT' && isTarget);

          return (
            <button
              key={cellIdx}
              type="button"
              disabled={gameState !== 'RECALL' || isClicked}
              onClick={() => handleCellClick(cellIdx)}
              aria-label={`网格节点 ${cellIdx + 1}`}
              className={`aspect-square min-h-[52px] rounded-xl border text-base sm:text-lg font-mono font-bold tabular-nums flex items-center justify-center transition-all duration-150 ${
                showNumber
                  ? 'bg-[#D4A656] border-[#F3D89E] text-[#181411]'
                  : isClicked
                  ? gameState === 'ROUND_RESULT' && !lastRoundPassed
                    ? 'bg-rose-500/80 border-rose-300 text-white'
                    : 'bg-emerald-500/85 border-emerald-300 text-[#141821]'
                  : gameState === 'RECALL'
                  ? 'bg-[#1D2330] hover:bg-[#273042] border-white/15 hover:border-[#D4A656]/60 text-transparent cursor-pointer'
                  : 'bg-[#1D2330] border-white/10 text-transparent'
              }`}
            >
              {showNumber ? orderNum : isClicked ? '✓' : ''}
            </button>
          );
        })}
      </div>

      <div className="flex justify-center pt-1">
        <button
          type="button"
          onClick={() => {
            clearTimers();
            setGameState('TITLE_MENU');
          }}
          className="min-h-[40px] px-4 py-2 rounded-xl text-xs font-medium text-stone-400 hover:text-white border border-white/10 cursor-pointer whitespace-nowrap shrink-0"
        >
          返回难度选择
        </button>
      </div>
    </div>
  );
};

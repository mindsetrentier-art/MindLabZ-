import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { RotateCcw, Zap, Trophy, Brain, Sparkles, CheckCircle2, Clock, Flame, Crown, Play, ShieldCheck, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { GameDifficulty, DIFFICULTY_CONFIGS, DIFFICULTY_LIST } from '../../data/difficulty';
import { DifficultySelector } from './DifficultySelector';
import { GameHeaderHud } from './GameHeaderHud';
import { gameAudio } from '../../utils/gameAudio';

export const MemoryLabGame: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { recordGameResult } = useApp();

  const urlDiff = searchParams.get('difficulty') as GameDifficulty | null;
  const initialDiff: GameDifficulty = urlDiff && DIFFICULTY_LIST.includes(urlDiff) ? urlDiff : '中';

  const [difficulty, setDifficulty] = useState<GameDifficulty>(initialDiff);
  const [level, setLevel] = useState(1);
  const [gridSize, setGridSize] = useState(3);
  const [targetCount, setTargetCount] = useState(3);
  const [activeTiles, setActiveTiles] = useState<number[]>([]);
  const [userSelected, setUserSelected] = useState<number[]>([]);
  const [gameState, setGameState] = useState<'intro' | 'memorize' | 'recall' | 'level_clear' | 'game_over'>('intro');
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const startTimeRef = useRef<number>(0);

  const diffConfig = DIFFICULTY_CONFIGS[difficulty];

  // Generate new pattern for current level with randomized positions
  const generateLevel = useCallback(() => {
    const totalTiles = gridSize * gridSize;
    const count = Math.min(targetCount, totalTiles - 1);
    const tiles: number[] = [];

    while (tiles.length < count) {
      const rand = Math.floor(Math.random() * totalTiles);
      if (!tiles.includes(rand)) {
        tiles.push(rand);
      }
    }

    setActiveTiles(tiles);
    setUserSelected([]);
    setGameState('memorize');

    // Memorization display duration adjusted by difficulty
    const durationMap: Record<GameDifficulty, number> = {
      '低': Math.max(1600, 2600 - level * 80),
      '中': Math.max(1200, 2000 - level * 90),
      '高': Math.max(900, 1400 - level * 70),
      '高级': Math.max(700, 1000 - level * 50),
    };

    const displayDuration = durationMap[difficulty];
    const timer = setTimeout(() => {
      setGameState('recall');
      startTimeRef.current = Date.now();
    }, displayDuration);

    return () => clearTimeout(timer);
  }, [gridSize, targetCount, level, difficulty]);

  const handleStartGame = (diff: GameDifficulty = difficulty) => {
    gameAudio.playSuccess();
    const initParams: Record<GameDifficulty, { grid: number; targets: number }> = {
      '低': { grid: 3, targets: 3 },
      '中': { grid: 3, targets: 4 },
      '高': { grid: 4, targets: 4 },
      '高级': { grid: 5, targets: 6 },
    };

    const p = initParams[diff];
    setLevel(1);
    setGridSize(p.grid);
    setTargetCount(p.targets);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setReactionTimes([]);
    setGameState('memorize');
  };

  useEffect(() => {
    if (gameState === 'memorize' && activeTiles.length === 0) {
      generateLevel();
    }
  }, [gameState, activeTiles.length, generateLevel]);

  const handleTileClick = (index: number) => {
    if (gameState !== 'recall' || userSelected.includes(index)) return;

    const reaction = Date.now() - startTimeRef.current;
    setReactionTimes((prev) => [...prev, reaction]);

    const newUserSelected = [...userSelected, index];
    setUserSelected(newUserSelected);

    // If incorrect tile chosen
    if (!activeTiles.includes(index)) {
      gameAudio.playMistake();
      setCombo(0);
      setGameState('game_over');
      return;
    }

    gameAudio.playTap();

    // Check if level completed
    const correctCount = newUserSelected.filter((t) => activeTiles.includes(t)).length;
    if (correctCount === activeTiles.length) {
      gameAudio.playSuccess();
      const newCombo = combo + 1;
      setCombo(newCombo);
      setMaxCombo((prev) => Math.max(prev, newCombo));

      const basePoints = 1000 + level * 250 + newCombo * 160;
      const earned = Math.round(basePoints * diffConfig.scoreMultiplier);
      setScore((prev) => prev + earned);
      setGameState('level_clear');

      setTimeout(() => {
        const nextLevel = level + 1;
        setLevel(nextLevel);

        // Scale grid difficulty according to difficulty level
        if (difficulty === '低') {
          if (nextLevel === 5) {
            setGridSize(4);
            setTargetCount(4);
          } else if (nextLevel === 9) {
            setGridSize(4);
            setTargetCount(6);
          } else {
            setTargetCount((prev) => Math.min(prev + 1, gridSize * gridSize - 2));
          }
        } else if (difficulty === '中') {
          if (nextLevel === 4) {
            setGridSize(4);
            setTargetCount(4);
          } else if (nextLevel === 7) {
            setGridSize(4);
            setTargetCount(6);
          } else if (nextLevel === 10) {
            setGridSize(5);
            setTargetCount(7);
          } else {
            setTargetCount((prev) => Math.min(prev + 1, gridSize * gridSize - 2));
          }
        } else if (difficulty === '高') {
          if (nextLevel === 3) {
            setGridSize(4);
            setTargetCount(6);
          } else if (nextLevel === 6) {
            setGridSize(5);
            setTargetCount(7);
          } else if (nextLevel === 9) {
            setGridSize(5);
            setTargetCount(9);
          } else {
            setTargetCount((prev) => Math.min(prev + 1, gridSize * gridSize - 2));
          }
        } else {
          // 高级
          if (nextLevel === 3) {
            setTargetCount(8);
          } else if (nextLevel === 6) {
            setTargetCount(10);
          } else if (nextLevel === 9) {
            setTargetCount(12);
          } else {
            setTargetCount((prev) => Math.min(prev + 1, gridSize * gridSize - 3));
          }
        }
      }, 900);
    }
  };

  useEffect(() => {
    if (gameState === 'level_clear') {
      const t = setTimeout(() => {
        generateLevel();
      }, 900);
      return () => clearTimeout(t);
    }
  }, [level, gameState, generateLevel]);

  const avgReactionTime = reactionTimes.length > 0
    ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
    : 450;

  const handleFinish = () => {
    const accuracy = level > 1 ? Math.min(100, Math.round((level / (level + 1)) * 100)) : 60;
    const earnedXp = Math.round((score / 20 + 100) * diffConfig.xpMultiplier);

    recordGameResult('memory-lab', {
      score,
      accuracy,
      reactionTime: avgReactionTime,
      xpGained: earnedXp,
      comboMax: maxCombo,
      conceptLearned: '工作记忆容量与空间网格编码（Spatial Grid Cells）',
      lawId: 'primacy-effect',
      difficulty,
    });

    navigate('/games');
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-[85vh] w-full max-w-lg mx-auto py-3 px-2 animate-fadeIn">
      {/* Header HUD */}
      <GameHeaderHud
        title="记忆宫殿矩阵"
        numberPrefix="CLASSIC"
        score={score}
        currentRound={level}
        totalRounds={12}
        difficulty={difficulty}
        comboCount={combo}
        onExit={() => (gameState === 'intro' ? navigate('/games') : setGameState('intro'))}
        onBack={() => (gameState === 'intro' ? navigate('/games') : setGameState('intro'))}
      />

      {gameState === 'intro' ? (
        /* Intro Arcade Pod */
        <div className="w-full game-arcade-card rounded-3xl p-6 sm:p-8 border-indigo-200/80 shadow-2xl space-y-6 relative overflow-hidden">
          {/* Ambient colorful glow */}
          <div className="absolute -top-16 -right-16 w-52 h-52 rounded-full bg-gradient-to-br from-indigo-500/30 to-purple-500/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-52 h-52 rounded-full bg-gradient-to-br from-cyan-500/20 to-indigo-500/25 blur-3xl pointer-events-none" />

          <div className="relative text-center space-y-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 text-white flex items-center justify-center mx-auto shadow-xl shadow-indigo-500/30 ring-4 ring-indigo-500/20 animate-subtleFloat">
              <Brain className="w-10 h-10 drop-shadow-md text-cyan-200" />
            </div>

            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-700 text-xs font-bold border border-indigo-200">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span>经典神经认知实验室</span>
              </div>
              <h2 className="text-2xl font-black text-stone-900 tracking-tight font-serif-editorial">
                Memory Lab · 记忆宫殿矩阵
              </h2>
              <p className="text-xs text-stone-600 leading-relaxed max-w-sm mx-auto">
                基于海马体与内嗅皮层<strong className="text-indigo-600 font-bold">空间网格编码（Grid Cells）</strong>机制。每轮随机生成高维发光阵列，测试瞬时组块记忆极限。
              </p>
            </div>
          </div>

          {/* Difficulty Setting */}
          <div className="space-y-2 pt-3 border-t border-indigo-100 text-left">
            <label className="text-xs font-bold text-stone-800 block text-center">
              选择空间网格挑战难度：
            </label>
            <DifficultySelector value={difficulty} onChange={setDifficulty} />
          </div>

          <button
            onClick={() => handleStartGame(difficulty)}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-sm shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2.5 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>启动神经网格测试（{difficulty}难度 · {diffConfig.multiplierText}）</span>
          </button>
        </div>
      ) : gameState === 'game_over' ? (
        /* Game Over Result */
        <div className="w-full game-arcade-card rounded-3xl p-6 sm:p-8 border-amber-200/80 shadow-2xl text-center space-y-6 animate-fadeIn relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-52 h-52 rounded-full bg-gradient-to-br from-amber-500/30 to-orange-500/20 blur-3xl pointer-events-none" />

          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 text-white flex items-center justify-center mx-auto shadow-xl shadow-amber-500/30 ring-4 ring-amber-500/20">
            <Trophy className="w-10 h-10 fill-white drop-shadow-md" />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-bold text-amber-600 tracking-wider uppercase">Session Report</span>
            <h2 className="text-2xl font-black text-stone-900 font-serif-editorial">
              记忆宫殿 · 战绩结算
            </h2>
            <p className="text-xs text-stone-600">
              【{difficulty}】难度 · 空间工作记忆推进至第 <strong className="text-indigo-600 font-bold">{level}</strong> 关！
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2.5 font-numeric">
            <div className="bg-gradient-to-b from-stone-50 to-stone-100 p-3.5 rounded-2xl border border-stone-200/90 shadow-sm">
              <span className="text-[10px] text-stone-500 font-bold block mb-1">总积分</span>
              <span className="text-lg font-black text-stone-900">{score}</span>
            </div>
            <div className="bg-gradient-to-b from-indigo-50 to-purple-50 p-3.5 rounded-2xl border border-indigo-200/80 shadow-sm">
              <span className="text-[10px] text-indigo-700 font-bold block mb-1">连击峰值</span>
              <span className="text-lg font-black text-indigo-600">{maxCombo} 轮</span>
            </div>
            <div className="bg-gradient-to-b from-emerald-50 to-teal-50 p-3.5 rounded-2xl border border-emerald-200/80 shadow-sm">
              <span className="text-[10px] text-emerald-700 font-bold block mb-1">平均反应</span>
              <span className="text-lg font-black text-emerald-600">{avgReactionTime} ms</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-50/60 to-purple-50/60 p-4 rounded-2xl text-left border border-indigo-200/60 space-y-1.5">
            <h4 className="text-xs font-bold text-indigo-950 flex items-center gap-1.5 font-serif-editorial">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              脑科学原理 · 空间网格编码（Grid Cells）
            </h4>
            <p className="text-[11px] text-stone-700 leading-relaxed">
              海马体与内嗅皮层的空间网格细胞在快速记忆点阵时会形成动态认知地图。随着难度提升与随机分布变换，大脑需要更强大的组块化（Chunking）能力以突破米勒 7±2 容量限制。
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => handleStartGame(difficulty)}
              className="flex-1 py-3.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-stone-200"
            >
              <RotateCcw className="w-4 h-4" />
              <span>重新挑战</span>
            </button>
            <button
              onClick={handleFinish}
              className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-stone-900 via-stone-800 to-indigo-950 hover:from-stone-800 hover:to-indigo-900 text-white font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>结算经验</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Playing Grid Screen */
        <div className="w-full flex flex-col items-center space-y-4 animate-fadeIn">
          {/* Level Header Status Bar */}
          <div className="w-full flex justify-between items-center text-xs font-numeric bg-white/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-stone-200/90 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black rounded-lg text-xs shadow-sm">
                LEVEL {level}
              </span>
              <span className="text-stone-700 font-bold">
                {gridSize}×{gridSize} 空间阵列
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-stone-600 font-bold">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>目标点位: <strong className="text-indigo-600 font-extrabold">{targetCount}</strong></span>
            </div>
          </div>

          {/* Prompt status */}
          <div className="text-xs font-black text-center py-1">
            {gameState === 'memorize' ? (
              <span className="text-indigo-600 animate-pulse flex items-center justify-center gap-1.5 bg-indigo-50 border border-indigo-200 px-4 py-2 rounded-xl shadow-sm">
                <Brain className="w-4 h-4 text-indigo-600" />
                正在点亮目标矩阵，请用海马体网格快速锁定发光方块！
              </span>
            ) : gameState === 'recall' ? (
              <span className="text-stone-800 flex items-center justify-center gap-1.5 bg-white border border-stone-200 px-4 py-2 rounded-xl shadow-sm">
                <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                点击复原记忆中的所有发光方块 ({userSelected.length} / {activeTiles.length})
              </span>
            ) : gameState === 'level_clear' ? (
              <span className="text-emerald-700 flex items-center justify-center gap-1.5 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl shadow-sm font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                完美复原！空间记忆回路同步，准备升级...
              </span>
            ) : null}
          </div>

          {/* Matrix Grid Canvas */}
          <div
            className="w-full max-w-sm aspect-square bg-gradient-to-b from-stone-900 to-slate-950 rounded-3xl p-5 border-2 border-indigo-500/30 shadow-2xl grid gap-3 relative overflow-hidden"
            style={{
              gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${gridSize}, minmax(0, 1fr))`,
            }}
          >
            {/* Ambient grid glow */}
            <div className="absolute inset-0 bg-radial-gradient from-indigo-500/10 via-transparent to-transparent pointer-events-none" />

            {Array.from({ length: gridSize * gridSize }).map((_, idx) => {
              const isTarget = activeTiles.includes(idx);
              const isSelected = userSelected.includes(idx);
              const isMemorizing = gameState === 'memorize';
              const isClear = gameState === 'level_clear';

              let tileClass = 'bg-stone-800/90 border-stone-700/80 hover:bg-stone-700/90 hover:border-indigo-400/50 shadow-inner';

              if (isMemorizing && isTarget) {
                tileClass = 'bg-gradient-to-br from-indigo-500 via-cyan-400 to-indigo-600 border-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.7)] scale-95 animate-pulse';
              } else if (isClear && isTarget) {
                tileClass = 'bg-gradient-to-br from-emerald-500 to-teal-400 border-emerald-300 text-white shadow-[0_0_18px_rgba(52,211,153,0.6)]';
              } else if (isSelected && isTarget) {
                tileClass = 'bg-gradient-to-br from-indigo-600 to-purple-600 border-indigo-300 text-white shadow-[0_0_16px_rgba(99,102,241,0.6)]';
              } else if (isSelected && !isTarget) {
                tileClass = 'bg-gradient-to-br from-rose-600 to-red-500 border-red-300 text-white shadow-[0_0_16px_rgba(244,63,94,0.6)] animate-shake';
              }

              return (
                <button
                  key={idx}
                  disabled={gameState !== 'recall' || isSelected}
                  onClick={() => handleTileClick(idx)}
                  className={`rounded-2xl border-2 transition-all duration-200 flex items-center justify-center cursor-pointer select-none active:scale-95 ${tileClass}`}
                >
                  {isSelected && isTarget && (
                    <CheckCircle2 className="w-5 h-5 text-white drop-shadow-md animate-scaleUp" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

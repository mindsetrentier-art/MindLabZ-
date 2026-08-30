import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RotateCcw, Zap, Trophy, Brain, Sparkles, CheckCircle2, Clock } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const MemoryLabGame: React.FC = () => {
  const navigate = useNavigate();
  const { recordGameResult } = useApp();

  const [level, setLevel] = useState(1);
  const [gridSize, setGridSize] = useState(3); // 3x3 to 5x5
  const [targetCount, setTargetCount] = useState(3);
  const [activeTiles, setActiveTiles] = useState<number[]>([]);
  const [userSelected, setUserSelected] = useState<number[]>([]);
  const [gameState, setGameState] = useState<'intro' | 'memorize' | 'recall' | 'level_clear' | 'game_over'>('intro');
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const startTimeRef = useRef<number>(0);

  // Generate new pattern for the current level
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

    // Memorization display timer (1.5s - 2.5s)
    const displayDuration = Math.max(1200, 2400 - level * 100);
    const timer = setTimeout(() => {
      setGameState('recall');
      startTimeRef.current = Date.now();
    }, displayDuration);

    return () => clearTimeout(timer);
  }, [gridSize, targetCount, level]);

  const handleStartGame = () => {
    setLevel(1);
    setGridSize(3);
    setTargetCount(3);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setReactionTimes([]);
    setGameState('memorize');
    generateLevel();
  };

  const handleTileClick = (index: number) => {
    if (gameState !== 'recall' || userSelected.includes(index)) return;

    const reaction = Date.now() - startTimeRef.current;
    setReactionTimes(prev => [...prev, reaction]);

    const newUserSelected = [...userSelected, index];
    setUserSelected(newUserSelected);

    // If incorrect tile chosen
    if (!activeTiles.includes(index)) {
      setCombo(0);
      setGameState('game_over');
      return;
    }

    // Check if level completed
    const correctCount = newUserSelected.filter(t => activeTiles.includes(t)).length;
    if (correctCount === activeTiles.length) {
      const newCombo = combo + 1;
      setCombo(newCombo);
      setMaxCombo(prev => Math.max(prev, newCombo));

      const points = 1000 + level * 200 + newCombo * 150;
      setScore(prev => prev + points);
      setGameState('level_clear');

      setTimeout(() => {
        const nextLevel = level + 1;
        setLevel(nextLevel);

        // Scale grid difficulty
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
          setTargetCount(prev => prev + 1);
        }
      }, 1000);
    }
  };

  useEffect(() => {
    if (gameState === 'level_clear') {
      const t = setTimeout(() => {
        generateLevel();
      }, 1000);
      return () => clearTimeout(t);
    }
  }, [level, gameState, generateLevel]);

  const avgReactionTime = reactionTimes.length > 0
    ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
    : 450;

  const handleFinish = () => {
    const accuracy = level > 1 ? Math.min(100, Math.round((level / (level + 1)) * 100)) : 60;
    const earnedXp = Math.round(score / 20) + 100;

    recordGameResult('memory-lab', {
      score,
      accuracy,
      reactionTime: avgReactionTime,
      xpGained: earnedXp,
      comboMax: maxCombo,
      conceptLearned: '工作记忆容量与空间网格编码（Spatial Grid Cells）',
      lawId: 'primacy-effect'
    });

    navigate('/games');
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-[80vh] w-full max-w-lg mx-auto py-2">
      {/* Top Controls */}
      <div className="w-full flex items-center justify-between mb-4">
        <button
          onClick={() => navigate('/games')}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#5E5D6D] hover:text-[#532CD8] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>退出游戏</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-[#F0EBFF] px-3 py-1 rounded-full text-xs font-bold text-[#532CD8]">
            <Zap className="w-3.5 h-3.5 fill-[#532CD8]" />
            <span>连击 x{combo}</span>
          </div>
          <div className="flex items-center gap-1 bg-white px-3 py-1 rounded-full text-xs font-bold text-[#1B192E] border border-[#E8E5F0]">
            <Trophy className="w-3.5 h-3.5 text-[#FFB72B] fill-[#FFB72B]" />
            <span>{score}</span>
          </div>
        </div>
      </div>

      {gameState === 'intro' ? (
        /* Intro Card */
        <div className="w-full bg-white rounded-3xl p-6 border border-white/80 shadow-[0_4px_25px_rgba(23,21,42,0.06)] text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-[#6C4CF1]/10 text-[#6C4CF1] flex items-center justify-center mx-auto shadow-inner">
            <Brain className="w-8 h-8" />
          </div>

          <h2 className="text-xl font-bold text-[#1B192E]">Memory Lab · 记忆宫殿矩阵</h2>
          <p className="text-xs text-[#5E5D6D] leading-relaxed max-w-sm mx-auto">
            认知科学研究发现，人类海马体具备强大的空间网格编码能力。记住在网格中发光的方块位置，并在它们熄灭后逐一准确复原！
          </p>

          <div className="bg-[#F6F1FF] rounded-2xl p-4 text-left border border-[#E4DFFD]">
            <h4 className="text-xs font-bold text-[#532CD8] mb-1.5">⚡ 挑战目标：</h4>
            <ul className="text-xs text-[#484555] space-y-1">
              <li>• 阶段1：观察紫色亮起方块并快速记忆</li>
              <li>• 阶段2：点击所有发光位置，连续全对触发连击</li>
              <li>• 突破米勒 7±2 工作记忆瓶颈，斩获高额 XP</li>
            </ul>
          </div>

          <button
            onClick={handleStartGame}
            className="w-full py-3.5 rounded-2xl bg-[#6C4CF1] hover:bg-[#532CD8] text-white font-bold text-sm shadow-md transition-all btn-press"
          >
            开始记忆训练
          </button>
        </div>
      ) : gameState === 'game_over' ? (
        /* Game Over Result */
        <div className="w-full bg-white rounded-3xl p-6 border border-white/80 shadow-xl text-center space-y-4 animate-fadeIn">
          <div className="w-16 h-16 rounded-3xl bg-[#FFB72B]/15 text-[#FFB72B] flex items-center justify-center mx-auto">
            <Trophy className="w-8 h-8 fill-[#FFB72B]" />
          </div>

          <h2 className="text-2xl font-black text-[#1B192E]">挑战结算</h2>
          <p className="text-xs text-[#5E5D6D]">
            你的空间工作记忆已突破到第 <strong className="text-[#532CD8] font-bold text-sm">{level}</strong> 关！
          </p>

          <div className="grid grid-cols-3 gap-2.5 my-4">
            <div className="bg-[#F6F1FF] p-3 rounded-2xl">
              <span className="text-[10px] text-[#5E5D6D] block">最终得分</span>
              <span className="text-base font-extrabold text-[#532CD8] font-['Inter']">{score}</span>
            </div>
            <div className="bg-[#F6F1FF] p-3 rounded-2xl">
              <span className="text-[10px] text-[#5E5D6D] block">最高连击</span>
              <span className="text-base font-extrabold text-[#FFB72B] font-['Inter']">{maxCombo} 次</span>
            </div>
            <div className="bg-[#F6F1FF] p-3 rounded-2xl">
              <span className="text-[10px] text-[#5E5D6D] block">平均反应</span>
              <span className="text-base font-extrabold text-[#00A699] font-['Inter']">{avgReactionTime} ms</span>
            </div>
          </div>

          <div className="bg-[#F0EBFF] p-4 rounded-2xl text-left border border-[#E4DFFD]">
            <h4 className="text-xs font-bold text-[#532CD8] flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-[#FFB72B]" />
              心理学收获 · 工作记忆容量
            </h4>
            <p className="text-[11px] text-[#484555] leading-relaxed">
              乔治·米勒在 1956 年提出人类工作记忆容量为 7±2 个信息块（Chunk）。通过网格空间分块归纳（Chunking），你能将杂乱信息组合压缩，大幅提升日常记忆与决策效率！
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleStartGame}
              className="flex-1 py-3 rounded-2xl bg-[#F0EBFF] text-[#532CD8] font-bold text-xs hover:bg-[#E4DFFD] transition-colors flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>再练一次</span>
            </button>
            <button
              onClick={handleFinish}
              className="flex-1 py-3 rounded-2xl bg-[#6C4CF1] hover:bg-[#532CD8] text-white font-bold text-xs shadow-md transition-all"
            >
              领取奖励并返回
            </button>
          </div>
        </div>
      ) : (
        /* Active Game Arena */
        <div className="w-full flex flex-col items-center space-y-4">
          <div className="flex items-center justify-between w-full px-2">
            <span className="text-xs font-bold text-[#5E5D6D]">
              第 <strong className="text-[#532CD8] text-sm">{level}</strong> 关 · 记忆 {targetCount} 个方块
            </span>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#F6F1FF] text-[#532CD8]">
              {gameState === 'memorize' ? '👀 记忆阶段...' : gameState === 'level_clear' ? '🎉 通关！' : '👉 点击所有发光方块'}
            </span>
          </div>

          {/* Matrix Grid */}
          <div
            className="p-4 bg-white rounded-3xl shadow-[0_8px_30px_rgba(108,76,241,0.08)] border border-white/90 grid gap-3 max-w-[360px] w-full aspect-square transition-all"
            style={{
              gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${gridSize}, minmax(0, 1fr))`
            }}
          >
            {Array.from({ length: gridSize * gridSize }).map((_, idx) => {
              const isTarget = activeTiles.includes(idx);
              const isSelected = userSelected.includes(idx);
              const showActive = gameState === 'memorize' && isTarget;
              const isCorrectSelection = gameState === 'recall' && isSelected && isTarget;
              const isWrongSelection = gameState === 'recall' && isSelected && !isTarget;

              return (
                <button
                  key={idx}
                  disabled={gameState !== 'recall' || isSelected}
                  onClick={() => handleTileClick(idx)}
                  className={`w-full h-full rounded-2xl transition-all duration-200 transform btn-press flex items-center justify-center ${
                    showActive
                      ? 'bg-[#6C4CF1] shadow-[0_0_15px_rgba(108,76,241,0.6)] scale-95 ring-4 ring-[#6C4CF1]/30'
                      : isCorrectSelection
                      ? 'bg-[#00A699] text-white shadow-md scale-95 ring-2 ring-[#00A699]/40'
                      : isWrongSelection
                      ? 'bg-red-500 text-white scale-95 animate-shake'
                      : 'bg-[#F0EBFF]/70 hover:bg-[#E4DFFD] border border-[#E8E5F0]'
                  }`}
                >
                  {isCorrectSelection && <CheckCircle2 className="w-5 h-5 text-white animate-scaleIn" />}
                </button>
              );
            })}
          </div>

          <p className="text-[11px] text-[#5E5D6D] text-center">
            {gameState === 'memorize'
              ? '方块发光中，请全神贯注在大脑中勾勒几何连线...'
              : '凭瞬时记忆准确点击每个方块！'}
          </p>
        </div>
      )}
    </div>
  );
};

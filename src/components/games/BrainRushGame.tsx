import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { RotateCcw, Zap, Trophy, Sparkles, ArrowLeft as ArrowLeftIcon, ArrowRight as ArrowRightIcon, Flame, ShieldCheck, Crown, AlertCircle, Play, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { GameDifficulty, DIFFICULTY_CONFIGS, DIFFICULTY_LIST } from '../../data/difficulty';
import { DifficultySelector } from './DifficultySelector';
import { GameHeaderHud } from './GameHeaderHud';
import { gameAudio } from '../../utils/gameAudio';

interface FlankerTrial {
  flankers: string[];
  targetDirection: 'left' | 'right';
  isCongruent: boolean;
  isInverted: boolean; // For expert mode: press opposite direction of center arrow
  centerIndex: number;
  symbolType: 'arrow' | 'diamond' | 'triangle';
}

export const BrainRushGame: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { recordGameResult } = useApp();

  const urlDiff = searchParams.get('difficulty') as GameDifficulty | null;
  const initialDiff: GameDifficulty = urlDiff && DIFFICULTY_LIST.includes(urlDiff) ? urlDiff : '中';

  const [difficulty, setDifficulty] = useState<GameDifficulty>(initialDiff);
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'game_over'>('intro');
  const [timeLeft, setTimeLeft] = useState(30);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [currentTrial, setCurrentTrial] = useState<FlankerTrial | null>(null);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [lastFeedback, setLastFeedback] = useState<'correct' | 'wrong' | null>(null);

  const trialStartRef = useRef<number>(0);
  const diffConfig = DIFFICULTY_CONFIGS[difficulty];

  // Generate trial according to difficulty
  const generateTrial = useCallback((diff: GameDifficulty = difficulty): FlankerTrial => {
    const targetDirection: 'left' | 'right' = Math.random() > 0.5 ? 'left' : 'right';

    // Incongruent probabilities: 低: 40%, 中: 70%, 高: 85%, 高级: 80% with 35% Inversion
    const incongruentProb: Record<GameDifficulty, number> = {
      '低': 0.4,
      '中': 0.7,
      '高': 0.85,
      '高级': 0.8,
    };

    const isCongruent = Math.random() > incongruentProb[diff];
    const flankerDirection = isCongruent ? targetDirection : (targetDirection === 'left' ? 'right' : 'left');

    const isInverted = diff === '高级' && Math.random() < 0.35;

    // Symbol counts: 低: 5, 中: 5, 高: 7, 高级: 7
    const count = (diff === '高' || diff === '高级') ? 7 : 5;
    const centerIndex = Math.floor(count / 2);

    const targetChar = targetDirection === 'left' ? '←' : '→';
    const flankerChar = flankerDirection === 'left' ? '←' : '→';

    // Distractor shapes for high/advanced
    const useDiamonds = (diff === '高' || diff === '高级') && Math.random() < 0.25;
    const flankerSymbol = useDiamonds ? '◆' : flankerChar;

    const flankers: string[] = [];
    for (let i = 0; i < count; i++) {
      if (i === centerIndex) {
        flankers.push(targetChar);
      } else {
        flankers.push(flankerSymbol);
      }
    }

    return {
      flankers,
      targetDirection,
      isCongruent,
      isInverted,
      centerIndex,
      symbolType: useDiamonds ? 'diamond' : 'arrow',
    };
  }, [difficulty]);

  const handleStart = (diff: GameDifficulty = difficulty) => {
    gameAudio.playSuccess();
    const timerMap: Record<GameDifficulty, number> = {
      '低': 40,
      '中': 30,
      '高': 24,
      '高级': 18,
    };

    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setCorrectCount(0);
    setWrongCount(0);
    setReactionTimes([]);
    setTimeLeft(timerMap[diff]);
    setGameState('playing');
    setCurrentTrial(generateTrial(diff));
    trialStartRef.current = Date.now();
  };

  // Timer
  useEffect(() => {
    if (gameState !== 'playing') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setGameState('game_over');
          gameAudio.playVictory();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState]);

  const handleRespond = (direction: 'left' | 'right') => {
    if (!currentTrial || gameState !== 'playing') return;

    const reaction = Date.now() - trialStartRef.current;
    setReactionTimes((prev) => [...prev, reaction]);

    // Check if correct: if inverted, correct answer is OPPOSITE direction
    const expectedDirection = currentTrial.isInverted
      ? (currentTrial.targetDirection === 'left' ? 'right' : 'left')
      : currentTrial.targetDirection;

    const isCorrect = direction === expectedDirection;

    if (isCorrect) {
      gameAudio.playTap();
      const newCombo = combo + 1;
      setCombo(newCombo);
      setMaxCombo((prev) => Math.max(prev, newCombo));
      setCorrectCount((prev) => prev + 1);

      // Speed bonus & congruence bonus
      const speedThreshold = difficulty === '高级' ? 300 : difficulty === '高' ? 350 : 450;
      const speedBonus = Math.max(0, Math.floor((speedThreshold - reaction) / 2));
      const conflictBonus = currentTrial.isCongruent ? 0 : 70;
      const invertBonus = currentTrial.isInverted ? 120 : 0;

      const basePoints = 200 + newCombo * 40 + speedBonus + conflictBonus + invertBonus;
      const earned = Math.round(basePoints * diffConfig.scoreMultiplier);

      setScore((prev) => prev + earned);
      setLastFeedback('correct');
    } else {
      gameAudio.playMistake();
      setCombo(0);
      setWrongCount((prev) => prev + 1);
      setLastFeedback('wrong');

      if (difficulty === '高') {
        setScore((prev) => Math.max(0, prev - 100));
      } else if (difficulty === '高级') {
        setScore((prev) => Math.max(0, prev - 250));
        setTimeLeft((prev) => Math.max(1, prev - 1));
      }
    }

    setTimeout(() => setLastFeedback(null), 200);

    // Next Trial with randomized generation
    setCurrentTrial(generateTrial(difficulty));
    trialStartRef.current = Date.now();
  };

  // Keyboard support for desktop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        handleRespond('left');
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        handleRespond('right');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, currentTrial, difficulty]);

  const avgReactionTime = reactionTimes.length > 0
    ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
    : 380;

  const handleFinish = () => {
    const total = correctCount + wrongCount;
    const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 50;
    const xpGained = Math.round((score / 20 + 120) * diffConfig.xpMultiplier);

    recordGameResult('brain-rush', {
      score,
      accuracy,
      reactionTime: avgReactionTime,
      xpGained,
      comboMax: maxCombo,
      conceptLearned: '选择性注意与干扰侧翼抑制（Flanker Inhibition & Selective Attention）',
      lawId: 'cocktail-party-effect',
      difficulty,
    });

    navigate('/games');
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-[85vh] w-full max-w-lg mx-auto py-3 px-2 animate-fadeIn">
      {/* Game Header HUD */}
      <GameHeaderHud
        title="注意力风暴"
        numberPrefix="CLASSIC"
        score={score}
        currentRound={correctCount}
        totalRounds={30}
        difficulty={difficulty}
        comboCount={combo}
        onExit={() => (gameState === 'playing' ? setGameState('intro') : navigate('/games'))}
        onBack={() => (gameState === 'playing' ? setGameState('intro') : navigate('/games'))}
      />

      {gameState === 'intro' ? (
        <div className="w-full game-arcade-card rounded-3xl p-6 sm:p-8 border-emerald-200/80 shadow-2xl space-y-6 relative overflow-hidden">
          {/* Ambient colorful glow */}
          <div className="absolute -top-16 -right-16 w-52 h-52 rounded-full bg-gradient-to-br from-emerald-500/30 to-teal-500/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-52 h-52 rounded-full bg-gradient-to-br from-amber-500/20 to-emerald-500/25 blur-3xl pointer-events-none" />

          <div className="relative text-center space-y-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700 text-white flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/30 ring-4 ring-emerald-500/20 animate-subtleFloat">
              <Zap className="w-10 h-10 drop-shadow-md text-amber-200 fill-amber-300" />
            </div>

            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 text-xs font-bold border border-emerald-200">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                <span>埃里克森侧翼专注任务</span>
              </div>
              <h2 className="text-2xl font-black text-stone-900 tracking-tight font-serif-editorial">
                Brain Rush · 注意力风暴
              </h2>
              <p className="text-xs text-stone-600 leading-relaxed max-w-sm mx-auto">
                极速锁定正中心目标，毫秒级抑制两侧视觉干扰与欺骗性箭头。训练前额叶执行控制网络与反应敏锐度。
              </p>
            </div>
          </div>

          {/* Difficulty Setting */}
          <div className="space-y-2 pt-3 border-t border-emerald-100 text-left">
            <label className="text-xs font-bold text-stone-800 block text-center">
              选择神经反应速度：
            </label>
            <DifficultySelector value={difficulty} onChange={setDifficulty} />
          </div>

          <button
            onClick={() => handleStart(difficulty)}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm shadow-xl shadow-emerald-600/30 transition-all flex items-center justify-center gap-2.5 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>启动注意力风暴（{difficulty}难度 · {diffConfig.multiplierText}）</span>
          </button>
        </div>
      ) : gameState === 'game_over' ? (
        <div className="w-full game-arcade-card rounded-3xl p-6 sm:p-8 border-amber-200/80 shadow-2xl text-center space-y-6 animate-fadeIn relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-52 h-52 rounded-full bg-gradient-to-br from-amber-500/30 to-emerald-500/20 blur-3xl pointer-events-none" />

          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 via-emerald-500 to-teal-600 text-white flex items-center justify-center mx-auto shadow-xl shadow-amber-500/30 ring-4 ring-amber-500/20">
            <Trophy className="w-10 h-10 fill-white drop-shadow-md" />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-bold text-amber-600 tracking-wider uppercase">Attention Report</span>
            <h2 className="text-2xl font-black text-stone-900 font-serif-editorial">
              神经反应结算
            </h2>
            <p className="text-xs text-stone-600 font-numeric">
              【{difficulty}】难度 · 命中 <strong className="text-emerald-600 font-bold">{correctCount}</strong> 次 / 失误 <strong className="text-rose-500 font-bold">{wrongCount}</strong> 次
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2.5 font-numeric">
            <div className="bg-gradient-to-b from-stone-50 to-stone-100 p-3.5 rounded-2xl border border-stone-200/90 shadow-sm">
              <span className="text-[10px] text-stone-500 font-bold block mb-1">总积分</span>
              <span className="text-lg font-black text-stone-900">{score}</span>
            </div>
            <div className="bg-gradient-to-b from-amber-50 to-orange-50 p-3.5 rounded-2xl border border-amber-200/80 shadow-sm">
              <span className="text-[10px] text-amber-700 font-bold block mb-1">最高连击</span>
              <span className="text-lg font-black text-amber-600">{maxCombo} 次</span>
            </div>
            <div className="bg-gradient-to-b from-emerald-50 to-teal-50 p-3.5 rounded-2xl border border-emerald-200/80 shadow-sm">
              <span className="text-[10px] text-emerald-700 font-bold block mb-1">平均反应</span>
              <span className="text-lg font-black text-emerald-600">{avgReactionTime} ms</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-50/70 to-teal-50/70 p-4 rounded-2xl text-left border border-emerald-200/60 space-y-1.5">
            <h4 className="text-xs font-bold text-emerald-950 flex items-center gap-1.5 font-serif-editorial">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              认知科学视角 · 空间注意力过滤机制
            </h4>
            <p className="text-[11px] text-stone-700 leading-relaxed">
              当侧翼刺激与目标冲突时，视觉顶叶与额叶网络对两侧干扰进行毫秒级主动抑制。随机刺激与规则变换锻炼了认知灵活性与前额叶执行控制网。
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => handleStart(difficulty)}
              className="flex-1 py-3.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-stone-200"
            >
              <RotateCcw className="w-4 h-4" />
              <span>重新出题</span>
            </button>
            <button
              onClick={handleFinish}
              className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-stone-900 via-stone-800 to-emerald-950 hover:from-stone-800 hover:to-emerald-900 text-white font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>结算经验</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Playing Arena */
        <div className="w-full flex flex-col items-center space-y-4 animate-fadeIn">
          {/* Timer & Velocity HUD */}
          <div className="w-full flex justify-between items-center bg-white/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-stone-200/90 shadow-sm font-numeric">
            <div className="flex items-center gap-2">
              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black transition-all ${
                  timeLeft <= 6
                    ? 'bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.6)] animate-pulse'
                    : 'bg-stone-900 text-white'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span>倒计时: {timeLeft}s</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-stone-600 font-bold">
              <span>命中: <strong className="text-emerald-600 font-extrabold">{correctCount}</strong></span>
              <span className="text-stone-300">/</span>
              <span>失误: <strong className="text-rose-500 font-extrabold">{wrongCount}</strong></span>
            </div>
          </div>

          {/* Warning / Indicator Banner */}
          <div className="text-xs text-center font-bold">
            {currentTrial?.isInverted ? (
              <span className="text-rose-600 flex items-center justify-center gap-1.5 bg-rose-50 px-4 py-2 rounded-xl border border-rose-300 animate-pulse shadow-sm">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                ⚠️ 逆向抑制警告：请按与中心箭头【完全相反】的方向！
              </span>
            ) : (
              <span className="text-stone-700 flex items-center justify-center gap-1.5 bg-white px-4 py-2 rounded-xl border border-stone-200 shadow-sm">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                专注目标：仅看【正中心】箭头，毫秒屏蔽两侧干扰
              </span>
            )}
          </div>

          {/* Flanker Visual Target Cockpit */}
          <div
            className={`w-full rounded-3xl p-8 sm:p-10 border-2 shadow-2xl flex items-center justify-center min-h-[180px] transition-all relative overflow-hidden ${
              currentTrial?.isInverted
                ? 'bg-gradient-to-b from-rose-950 via-slate-950 to-stone-950 border-rose-500/40 shadow-rose-500/10'
                : 'bg-gradient-to-b from-slate-900 via-stone-950 to-slate-950 border-emerald-500/30 shadow-emerald-500/10'
            }`}
          >
            {/* Ambient holographic pulse */}
            <div className="absolute inset-0 bg-radial-gradient from-emerald-500/10 via-transparent to-transparent pointer-events-none" />

            {currentTrial && (
              <div className="flex items-center justify-center gap-3 sm:gap-4 select-none">
                {currentTrial.flankers.map((char, idx) => {
                  const isCenter = idx === currentTrial.centerIndex;
                  return (
                    <span
                      key={idx}
                      className={`text-4xl sm:text-6xl font-black transition-all ${
                        isCenter
                          ? currentTrial.isInverted
                            ? 'text-rose-400 scale-125 px-3 py-1.5 bg-rose-950/80 rounded-2xl shadow-[0_0_25px_rgba(244,63,94,0.7)] border-2 border-rose-400 animate-pulse'
                            : 'text-amber-300 scale-125 px-3 py-1.5 bg-amber-500/20 rounded-2xl shadow-[0_0_25px_rgba(245,158,11,0.7)] border-2 border-amber-300 animate-subtleFloat'
                          : 'text-slate-600 opacity-40 hover:opacity-50'
                      }`}
                    >
                      {char}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Responsive Arcade Controller Buttons */}
          <div className="grid grid-cols-2 gap-3.5 sm:gap-4 w-full max-w-sm pt-2">
            <button
              onClick={() => handleRespond('left')}
              className="py-6 sm:py-7 rounded-2xl bg-white hover:bg-emerald-50/60 border-2 border-stone-200 hover:border-emerald-500/60 shadow-lg flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer group active:scale-95"
            >
              <div className="w-12 h-12 rounded-xl bg-stone-100 group-hover:bg-emerald-500 group-hover:text-white flex items-center justify-center text-stone-800 transition-colors shadow-sm">
                <ArrowLeftIcon className="w-7 h-7 group-hover:scale-110 transition-transform" />
              </div>
              <span className="text-xs font-black text-stone-900 group-hover:text-emerald-700">向左 (← 或 A)</span>
            </button>

            <button
              onClick={() => handleRespond('right')}
              className="py-6 sm:py-7 rounded-2xl bg-white hover:bg-emerald-50/60 border-2 border-stone-200 hover:border-emerald-500/60 shadow-lg flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer group active:scale-95"
            >
              <div className="w-12 h-12 rounded-xl bg-stone-100 group-hover:bg-emerald-500 group-hover:text-white flex items-center justify-center text-stone-800 transition-colors shadow-sm">
                <ArrowRightIcon className="w-7 h-7 group-hover:scale-110 transition-transform" />
              </div>
              <span className="text-xs font-black text-stone-900 group-hover:text-emerald-700">向右 (→ 或 D)</span>
            </button>
          </div>

          {lastFeedback && (
            <div
              className={`text-xs font-black px-4 py-1.5 rounded-full shadow-md animate-bounce ${
                lastFeedback === 'correct'
                  ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                  : 'bg-rose-500 text-white shadow-rose-500/30'
              }`}
            >
              {lastFeedback === 'correct' ? '🎯 锁定目标！' : '❌ 抑制失败！'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

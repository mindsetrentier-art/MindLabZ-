import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RotateCcw, Zap, Trophy, Sparkles, ArrowLeft as ArrowLeftIcon, ArrowRight as ArrowRightIcon } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface FlankerTrial {
  flankers: string[]; // e.g. ['<', '<', '<', '<', '<'] or ['>', '>', '<', '>', '>']
  targetDirection: 'left' | 'right';
  isCongruent: boolean; // whether flankers match target
}

export const BrainRushGame: React.FC = () => {
  const navigate = useNavigate();
  const { recordGameResult } = useApp();

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

  const generateTrial = (): FlankerTrial => {
    const targetDirection: 'left' | 'right' = Math.random() > 0.5 ? 'left' : 'right';
    const isCongruent = Math.random() > 0.5;
    const flankerDirection = isCongruent ? targetDirection : (targetDirection === 'left' ? 'right' : 'left');

    const targetChar = targetDirection === 'left' ? '←' : '→';
    const flankerChar = flankerDirection === 'left' ? '←' : '→';

    return {
      flankers: [flankerChar, flankerChar, targetChar, flankerChar, flankerChar],
      targetDirection,
      isCongruent
    };
  };

  const handleStart = () => {
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setCorrectCount(0);
    setWrongCount(0);
    setReactionTimes([]);
    setTimeLeft(30);
    setGameState('playing');
    setCurrentTrial(generateTrial());
    trialStartRef.current = Date.now();
  };

  // Timer
  useEffect(() => {
    if (gameState !== 'playing') return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setGameState('game_over');
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
    setReactionTimes(prev => [...prev, reaction]);

    const isCorrect = direction === currentTrial.targetDirection;

    if (isCorrect) {
      const newCombo = combo + 1;
      setCombo(newCombo);
      setMaxCombo(prev => Math.max(prev, newCombo));
      setCorrectCount(prev => prev + 1);

      // Speed bonus
      const speedBonus = Math.max(0, 250 - Math.floor(reaction / 5));
      const congruenceBonus = currentTrial.isCongruent ? 0 : 80;
      setScore(prev => prev + 200 + newCombo * 50 + speedBonus + congruenceBonus);
      setLastFeedback('correct');
    } else {
      setCombo(0);
      setWrongCount(prev => prev + 1);
      setLastFeedback('wrong');
    }

    setTimeout(() => setLastFeedback(null), 250);

    // Next Trial
    setCurrentTrial(generateTrial());
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
  }, [gameState, currentTrial]);

  const avgReactionTime = reactionTimes.length > 0
    ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
    : 380;

  const handleFinish = () => {
    const total = correctCount + wrongCount;
    const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 50;
    const xpGained = Math.round(score / 20) + 120;

    recordGameResult('brain-rush', {
      score,
      accuracy,
      reactionTime: avgReactionTime,
      xpGained,
      comboMax: maxCombo,
      conceptLearned: '选择性注意与干扰侧翼抑制（Flanker Inhibition & Selective Attention）',
      lawId: 'cocktail-party-effect'
    });

    navigate('/games');
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-[80vh] w-full max-w-lg mx-auto py-2">
      {/* Top Bar */}
      <div className="w-full flex items-center justify-between mb-4">
        <button
          onClick={() => navigate('/games')}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#5E5D6D] hover:text-[#532CD8] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>退出游戏</span>
        </button>

        <div className="flex items-center gap-3">
          {gameState === 'playing' && (
            <div className="flex items-center gap-1 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-xs font-bold font-['Inter']">
              <span>⚡ {timeLeft}s</span>
            </div>
          )}
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
        <div className="w-full bg-white rounded-3xl p-6 border border-white/80 shadow-[0_4px_25px_rgba(23,21,42,0.06)] text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-[#10B981]/10 text-[#10B981] flex items-center justify-center mx-auto shadow-inner">
            <Sparkles className="w-8 h-8" />
          </div>

          <h2 className="text-xl font-bold text-[#1B192E]">Brain Rush · 注意力风暴</h2>
          <p className="text-xs text-[#5E5D6D] leading-relaxed max-w-sm mx-auto">
            经典埃里克森侧翼任务（Eriksen Flanker Task）。在两旁干扰箭头的强烈视觉噪点中，精准捕捉并响应【正中心箭头】的朝向！
          </p>

          <div className="bg-[#ECFDF5] rounded-2xl p-4 text-left border border-[#A7F3D0]">
            <h4 className="text-xs font-bold text-[#059669] mb-1.5">🎯 游戏规则：</h4>
            <ul className="text-xs text-[#065F46] space-y-1.5">
              <li>• 屏幕将出现 5 个箭头，<strong>只看正中间的那 1 个</strong>！</li>
              <li>• 两侧箭头可能与中心一致（同质）或相反（冲突干扰）。</li>
              <li>• 按键盘 ← / → 或点击下方按钮迅速判断，30 秒挑战极致反应！</li>
            </ul>
          </div>

          <button
            onClick={handleStart}
            className="w-full py-3.5 rounded-2xl bg-[#10B981] hover:bg-[#059669] text-white font-bold text-sm shadow-md transition-all btn-press"
          >
            启动注意力风暴
          </button>
        </div>
      ) : gameState === 'game_over' ? (
        <div className="w-full bg-white rounded-3xl p-6 border border-white/80 shadow-xl text-center space-y-4 animate-fadeIn">
          <div className="w-16 h-16 rounded-3xl bg-[#FFB72B]/15 text-[#FFB72B] flex items-center justify-center mx-auto">
            <Trophy className="w-8 h-8 fill-[#FFB72B]" />
          </div>

          <h2 className="text-2xl font-black text-[#1B192E]">神经反应结算</h2>
          <p className="text-xs text-[#5E5D6D]">
            命中 <strong className="text-[#059669] font-bold">{correctCount}</strong> 次 / 失误 <strong className="text-red-500 font-bold">{wrongCount}</strong> 次
          </p>

          <div className="grid grid-cols-3 gap-2.5 my-4">
            <div className="bg-[#F6F1FF] p-3 rounded-2xl">
              <span className="text-[10px] text-[#5E5D6D] block">总积分</span>
              <span className="text-base font-extrabold text-[#532CD8] font-['Inter']">{score}</span>
            </div>
            <div className="bg-[#F6F1FF] p-3 rounded-2xl">
              <span className="text-[10px] text-[#5E5D6D] block">最高连击</span>
              <span className="text-base font-extrabold text-[#FFB72B] font-['Inter']">{maxCombo} 次</span>
            </div>
            <div className="bg-[#F6F1FF] p-3 rounded-2xl">
              <span className="text-[10px] text-[#5E5D6D] block">平均反应</span>
              <span className="text-base font-extrabold text-[#059669] font-['Inter']">{avgReactionTime} ms</span>
            </div>
          </div>

          <div className="bg-[#F0EBFF] p-4 rounded-2xl text-left border border-[#E4DFFD]">
            <h4 className="text-xs font-bold text-[#532CD8] flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-[#FFB72B]" />
              认知科学视角 · 空间注意力抑制
            </h4>
            <p className="text-[11px] text-[#484555] leading-relaxed">
              当侧翼刺激与目标冲突时，视觉皮层需通过顶叶与额叶网络对两侧干扰进行主动抑制。这种注意焦点的快速缩放与空间过滤能力，是高压多任务环境下抗干扰的核心大脑机能。
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleStart}
              className="flex-1 py-3 rounded-2xl bg-[#F0EBFF] text-[#532CD8] font-bold text-xs hover:bg-[#E4DFFD] transition-colors flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>再次训练</span>
            </button>
            <button
              onClick={handleFinish}
              className="flex-1 py-3 rounded-2xl bg-[#10B981] hover:bg-[#059669] text-white font-bold text-xs shadow-md transition-all"
            >
              完成并结算
            </button>
          </div>
        </div>
      ) : (
        /* Playing Arena */
        <div className="w-full flex flex-col items-center space-y-6">
          <div className="text-xs text-[#5E5D6D] font-medium">
            聚焦【正中央】箭头，忽略两侧干扰
          </div>

          {/* Flanker Display Card */}
          <div className="w-full bg-white rounded-3xl p-10 border border-white/90 shadow-[0_8px_30px_rgba(23,21,42,0.06)] flex items-center justify-center min-h-[160px]">
            {currentTrial && (
              <div className="flex items-center justify-center gap-2 select-none tracking-widest">
                {currentTrial.flankers.map((arrow, idx) => {
                  const isCenter = idx === 2;
                  return (
                    <span
                      key={idx}
                      className={`text-4xl md:text-5xl font-black transition-all ${
                        isCenter
                          ? 'text-[#532CD8] scale-125 px-2 py-1 bg-[#F0EBFF] rounded-xl shadow-inner border border-[#E4DFFD]'
                          : 'text-[#9CA3AF] opacity-60'
                      }`}
                    >
                      {arrow}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Large Tap Buttons for Mobile / Click */}
          <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
            <button
              onClick={() => handleRespond('left')}
              className="py-6 rounded-3xl bg-white hover:bg-[#F0EBFF] border-2 border-[#E4DFFD] hover:border-[#6C4CF1] shadow-md flex flex-col items-center justify-center gap-1 transition-all btn-press"
            >
              <ArrowLeftIcon className="w-8 h-8 text-[#532CD8]" />
              <span className="text-xs font-bold text-[#1B192E]">向左 (←)</span>
            </button>

            <button
              onClick={() => handleRespond('right')}
              className="py-6 rounded-3xl bg-white hover:bg-[#F0EBFF] border-2 border-[#E4DFFD] hover:border-[#6C4CF1] shadow-md flex flex-col items-center justify-center gap-1 transition-all btn-press"
            >
              <ArrowRightIcon className="w-8 h-8 text-[#532CD8]" />
              <span className="text-xs font-bold text-[#1B192E]">向右 (→)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

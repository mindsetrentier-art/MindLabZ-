import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RotateCcw, Zap, Trophy, Brain, Sparkles, AlertTriangle, CheckCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface StroopTrial {
  type: 'stroop';
  wordText: string;
  colorName: string; // The correct answer (the physical color of the font)
  colorCode: string; // Hex color
  options: string[];
}

interface ReflectionTrial {
  type: 'reflection';
  question: string;
  options: string[];
  correctIndex: number;
  intuitiveTrap: string;
  explanation: string;
}

type Trial = StroopTrial | ReflectionTrial;

const COLOR_MAP: Record<string, string> = {
  '红色': '#EF4444',
  '蓝色': '#3B82F6',
  '绿色': '#10B981',
  '黄色': '#EAB308',
  '紫色': '#8B5CF6'
};

const COLOR_NAMES = ['红色', '蓝色', '绿色', '黄色', '紫色'];

const REFLECTION_QUESTIONS: ReflectionTrial[] = [
  {
    type: 'reflection',
    question: '球棒和棒球总价 1.10 美元。球棒比棒球贵 1.00 美元。请问棒球多少钱？',
    options: ['0.10 美元', '0.05 美元', '0.01 美元', '0.15 美元'],
    correctIndex: 1,
    intuitiveTrap: '直觉答案 0.10 美元',
    explanation: 'System 1 会本能跳出 1.10 - 1.00 = 0.10；但若球是 0.10，球棒则是 1.10，总价将变成 1.20。正确答案：球 = 0.05，球棒 = 1.05。'
  },
  {
    type: 'reflection',
    question: '5 台机器花 5 分钟制造 5 个零件。那么 100 台机器制造 100 个零件需要多少分钟？',
    options: ['100 分钟', '5 分钟', '20 分钟', '50 分钟'],
    correctIndex: 1,
    intuitiveTrap: '直觉答案 100 分钟',
    explanation: '1 台机器制造 1 个零件需要 5 分钟。100 台机器并行工作，制造 100 个零件依然只需要 5 分钟。'
  },
  {
    type: 'reflection',
    question: '湖面上有一片睡莲，每天面积扩大一倍。若 48 天覆盖整个湖面，请问覆盖半个湖面是在第几天？',
    options: ['24 天', '47 天', '40 天', '36 天'],
    correctIndex: 1,
    intuitiveTrap: '直觉答案 24 天（直接除以2）',
    explanation: '因为每天翻倍，所以满湖的前一天（第 47 天）正好是半个湖面！'
  }
];

export const MindTrapGame: React.FC = () => {
  const navigate = useNavigate();
  const { recordGameResult } = useApp();

  const [gameState, setGameState] = useState<'intro' | 'playing' | 'game_over'>('intro');
  const [timeLeft, setTimeLeft] = useState(45);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [currentTrialIndex, setCurrentTrialIndex] = useState(0);
  const [trials, setTrials] = useState<Trial[]>([]);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [lastFeedback, setLastFeedback] = useState<'correct' | 'wrong' | null>(null);

  const trialStartRef = useRef<number>(0);

  // Generate randomized sequence of trials
  const generateTrials = () => {
    const list: Trial[] = [];

    // Mix 12 Stroop trials and 3 CRT reflection puzzles
    for (let i = 0; i < 15; i++) {
      if (i % 4 === 3 && REFLECTION_QUESTIONS.length > 0) {
        const q = REFLECTION_QUESTIONS[(i / 4) % REFLECTION_QUESTIONS.length];
        list.push(q);
      } else {
        const wordText = COLOR_NAMES[Math.floor(Math.random() * COLOR_NAMES.length)];
        // Ensure font color is different from wordText to create Stroop conflict!
        const remainingColors = COLOR_NAMES.filter(c => c !== wordText);
        const fontColor = remainingColors[Math.floor(Math.random() * remainingColors.length)];

        // Options
        const opts = [fontColor];
        const otherOptions = COLOR_NAMES.filter(c => c !== fontColor).sort(() => Math.random() - 0.5);
        opts.push(otherOptions[0], otherOptions[1]);
        opts.sort(() => Math.random() - 0.5);

        list.push({
          type: 'stroop',
          wordText,
          colorName: fontColor,
          colorCode: COLOR_MAP[fontColor],
          options: opts
        });
      }
    }
    return list;
  };

  const handleStart = () => {
    const newTrials = generateTrials();
    setTrials(newTrials);
    setCurrentTrialIndex(0);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setCorrectCount(0);
    setWrongCount(0);
    setReactionTimes([]);
    setTimeLeft(45);
    setGameState('playing');
    trialStartRef.current = Date.now();
  };

  // Timer Countdown
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

  const handleAnswer = (chosenOption: string | number) => {
    const reaction = Date.now() - trialStartRef.current;
    setReactionTimes(prev => [...prev, reaction]);

    const trial = trials[currentTrialIndex];
    let isCorrect = false;

    if (trial.type === 'stroop') {
      isCorrect = chosenOption === trial.colorName;
    } else {
      isCorrect = chosenOption === trial.correctIndex;
    }

    if (isCorrect) {
      const newCombo = combo + 1;
      setCombo(newCombo);
      setMaxCombo(prev => Math.max(prev, newCombo));
      setCorrectCount(prev => prev + 1);
      setScore(prev => prev + 250 + newCombo * 60 + Math.max(0, 200 - Math.floor(reaction / 10)));
      setLastFeedback('correct');
    } else {
      setCombo(0);
      setWrongCount(prev => prev + 1);
      setLastFeedback('wrong');
    }

    setTimeout(() => setLastFeedback(null), 300);

    if (currentTrialIndex < trials.length - 1) {
      setCurrentTrialIndex(prev => prev + 1);
      trialStartRef.current = Date.now();
    } else {
      setGameState('game_over');
    }
  };

  const avgReactionTime = reactionTimes.length > 0
    ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
    : 620;

  const handleFinish = () => {
    const total = correctCount + wrongCount;
    const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 50;
    const xpGained = Math.round(score / 15) + 120;

    recordGameResult('mind-trap', {
      score,
      accuracy,
      reactionTime: avgReactionTime,
      xpGained,
      comboMax: maxCombo,
      conceptLearned: '双系统理论（System 1 直觉 vs System 2 理性）与斯特鲁普冲突抑制',
      lawId: 'stroop-effect'
    });

    navigate('/games');
  };

  const currentTrial = trials[currentTrialIndex];

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
            <div className="flex items-center gap-1 bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-bold font-['Inter']">
              <span>⏱️ {timeLeft}s</span>
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
          <div className="w-16 h-16 rounded-3xl bg-[#E11D48]/10 text-[#E11D48] flex items-center justify-center mx-auto shadow-inner">
            <Zap className="w-8 h-8" />
          </div>

          <h2 className="text-xl font-bold text-[#1B192E]">Mind Trap · 思维陷阱解密</h2>
          <p className="text-xs text-[#5E5D6D] leading-relaxed max-w-sm mx-auto">
            人类大脑具有自动化捷径（System 1）。在面对字义与墨水颜色冲突（Stroop效应）及经典认知反思陷阱时，启动前扣带回（ACC）与理性分析（System 2）！
          </p>

          <div className="bg-[#FFF1F2] rounded-2xl p-4 text-left border border-[#FFE4E6]">
            <h4 className="text-xs font-bold text-[#E11D48] mb-1.5">⚡ 核心规则：</h4>
            <ul className="text-xs text-[#484555] space-y-1.5">
              <li>• <strong>辨识墨水颜色</strong>：忽略文字含义，仅点击该文字呈现的物理颜色！</li>
              <li>• <strong>突破反思陷阱</strong>：当遇到反直觉思考题时，切勿盲从第一本能！</li>
              <li>• 45 秒极速倒计时，保持高准确率斩获连击奖励。</li>
            </ul>
          </div>

          <button
            onClick={handleStart}
            className="w-full py-3.5 rounded-2xl bg-[#E11D48] hover:bg-[#BE123C] text-white font-bold text-sm shadow-md transition-all btn-press"
          >
            开始思维对抗
          </button>
        </div>
      ) : gameState === 'game_over' ? (
        <div className="w-full bg-white rounded-3xl p-6 border border-white/80 shadow-xl text-center space-y-4 animate-fadeIn">
          <div className="w-16 h-16 rounded-3xl bg-[#FFB72B]/15 text-[#FFB72B] flex items-center justify-center mx-auto">
            <Trophy className="w-8 h-8 fill-[#FFB72B]" />
          </div>

          <h2 className="text-2xl font-black text-[#1B192E]">挑战成绩</h2>
          <p className="text-xs text-[#5E5D6D]">
            已完成测试：正确 <strong className="text-[#00A699] font-bold">{correctCount}</strong> 题 / 错误 <strong className="text-red-500 font-bold">{wrongCount}</strong> 题
          </p>

          <div className="grid grid-cols-3 gap-2.5 my-4">
            <div className="bg-[#F6F1FF] p-3 rounded-2xl">
              <span className="text-[10px] text-[#5E5D6D] block">得分</span>
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
              认知科学深度解析 · 斯特鲁普与双系统
            </h4>
            <p className="text-[11px] text-[#484555] leading-relaxed">
              丹尼尔·卡尼曼在《思考，快与慢》中阐述：自动化阅读（System 1）速度极快，但容易掉入陷阱；而辨别物理墨水颜色需要前额叶皮层主动调动 System 2 进行抑制控制。日常多进行这种冲突训练，能显著强化决策时的批判性思考。
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleStart}
              className="flex-1 py-3 rounded-2xl bg-[#F0EBFF] text-[#532CD8] font-bold text-xs hover:bg-[#E4DFFD] transition-colors flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>重新挑战</span>
            </button>
            <button
              onClick={handleFinish}
              className="flex-1 py-3 rounded-2xl bg-[#6C4CF1] hover:bg-[#532CD8] text-white font-bold text-xs shadow-md transition-all"
            >
              收下战果并返回
            </button>
          </div>
        </div>
      ) : (
        /* Active Trial Arena */
        <div className="w-full flex flex-col items-center space-y-5">
          <div className="w-full bg-[#F6F1FF] h-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#E11D48] transition-all duration-300"
              style={{ width: `${((currentTrialIndex + 1) / trials.length) * 100}%` }}
            />
          </div>

          {currentTrial && currentTrial.type === 'stroop' ? (
            /* Stroop Question Screen */
            <div className="w-full bg-white rounded-3xl p-6 border border-white/90 shadow-[0_8px_30px_rgba(23,21,42,0.06)] text-center space-y-6">
              <div className="flex justify-between items-center text-xs text-[#5E5D6D]">
                <span>第 {currentTrialIndex + 1} / {trials.length} 题</span>
                <span className="text-[#E11D48] font-bold">请选择文字的【墨水颜色】</span>
              </div>

              {/* Stimulus Word */}
              <div className="py-8 my-2 rounded-2xl bg-[#FCFBFE] border border-[#F0EBFF] flex items-center justify-center">
                <span
                  className="text-5xl font-black tracking-wider transition-all duration-150 transform active:scale-95 select-none"
                  style={{ color: currentTrial.colorCode }}
                >
                  {currentTrial.wordText}
                </span>
              </div>

              {/* Color Options */}
              <div className="grid grid-cols-3 gap-3">
                {currentTrial.options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(opt)}
                    className="py-3.5 rounded-2xl bg-[#F6F1FF] hover:bg-[#6C4CF1] hover:text-white text-[#1B192E] font-bold text-sm border border-[#E8E5F0] transition-all duration-150 btn-press shadow-sm flex items-center justify-center gap-2"
                  >
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: COLOR_MAP[opt] }}
                    />
                    <span>{opt}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : currentTrial && currentTrial.type === 'reflection' ? (
            /* CRT Reflection Riddle */
            <div className="w-full bg-white rounded-3xl p-6 border border-white/90 shadow-[0_8px_30px_rgba(23,21,42,0.06)] space-y-5">
              <div className="flex justify-between items-center text-xs text-[#5E5D6D]">
                <span className="font-bold text-[#E11D48] flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  认知反思陷阱题 (CRT)
                </span>
                <span>第 {currentTrialIndex + 1} / {trials.length} 题</span>
              </div>

              <h3 className="text-base font-bold text-[#1B192E] leading-snug">
                {currentTrial.question}
              </h3>

              <div className="space-y-2.5">
                {currentTrial.options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(idx)}
                    className="w-full text-left p-3.5 rounded-2xl bg-[#F6F1FF] hover:bg-[#E4DFFD] hover:border-[#6C4CF1] border border-[#E8E5F0] transition-all text-xs font-semibold text-[#1B192E] btn-press"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {lastFeedback && (
            <div className={`text-xs font-bold px-3 py-1 rounded-full animate-bounce ${lastFeedback === 'correct' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
              {lastFeedback === 'correct' ? '🎯 正确！启动理性抑制' : '⚠️ 踩中直觉陷阱！'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

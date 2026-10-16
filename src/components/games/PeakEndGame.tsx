import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Activity, Sparkles, CheckCircle2, RotateCcw, ArrowRight, TrendingUp, Zap, Flame } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { GameDifficulty, DIFFICULTY_CONFIGS, DIFFICULTY_LIST } from '../../data/difficulty';
import { DifficultySelector } from './DifficultySelector';
import { GameDebriefModal, DebriefData } from './GameDebriefModal';
import { GameHeaderHud } from './GameHeaderHud';
import { gameAudio } from '../../utils/gameAudio';

interface JourneyStep {
  name: string;
  defaultScore: number;
}

export const PeakEndGame: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, recordGameResult } = useApp();

  const urlDiff = searchParams.get('difficulty') as GameDifficulty | null;
  const initialDiff: GameDifficulty = urlDiff && DIFFICULTY_LIST.includes(urlDiff) ? urlDiff : '中';

  const [difficulty, setDifficulty] = useState<GameDifficulty>(initialDiff);
  const [gameState, setGameState] = useState<'intro' | 'designing' | 'debrief'>('intro');

  const steps: JourneyStep[] = [
    { name: '1. 进店迎接与排队', defaultScore: 6 },
    { name: '2. 选座点单与就座', defaultScore: 6 },
    { name: '3. 主菜品尝 (潜在峰值)', defaultScore: 9 },
    { name: '4. 中场茶歇与环境', defaultScore: 6 },
    { name: '5. 结账离店 (结束时刻)', defaultScore: 9 },
  ];

  const [scores, setScores] = useState<number[]>([6, 6, 9, 6, 9]);

  const diffConfig = DIFFICULTY_CONFIGS[difficulty];
  const isFirstTime = !(user.completedGames?.includes('peak-end'));

  const peakScore = Math.max(...scores);
  const endScore = scores[scores.length - 1];
  const averageScore = Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1));
  const rememberedScore = Number(((peakScore + endScore) / 2).toFixed(1));
  const liveScore = Math.round((rememberedScore * 300 + 1000) * diffConfig.scoreMultiplier);

  const updateScore = (index: number, val: number) => {
    gameAudio.playTap();
    setScores(prev => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  };

  const handleStartGame = () => {
    gameAudio.playSuccess();
    setGameState('designing');
  };

  const handleFinish = () => {
    gameAudio.playVictory();
    const calculatedXp = isFirstTime
      ? Math.round(36 * diffConfig.xpMultiplier)
      : Math.round(10 * diffConfig.xpMultiplier);

    recordGameResult('peak-end', {
      score: liveScore,
      accuracy: 96,
      reactionTime: 880,
      xpGained: calculatedXp,
      comboMax: 5,
      conceptLearned: '峰终定律（Peak-End Rule）与体验心理学设计',
      lawId: 'peak-end-rule',
      difficulty,
    });

    setGameState('debrief');
  };

  const debriefData: DebriefData = {
    gameId: 'peak-end',
    gameTitle: '峰值与结尾',
    numberPrefix: '04',
    difficulty,
    score: liveScore,
    accuracy: 96,
    isFirstTime,
    xpEarned: isFirstTime ? Math.round(38 * diffConfig.xpMultiplier) : Math.round(10 * diffConfig.xpMultiplier),
    bestAnswerReview:
      '人类大脑不是精密的微积分计算机，不会对全程体验进行时间积分求平均。长久留在记忆中的印象，绝大多数取决于【体验最高峰（无论是极度愉快还是痛苦）】以及【体验结束瞬间的感觉】。',
    psychologicalMechanism:
      '诺贝尔经济学奖得主丹尼尔·卡尼曼通过大样本结肠镜检查实验证明：经历更长时间但最后几分钟痛觉平缓减弱的病患，其对整个手术的痛苦回忆，反而显著轻于时间虽短但在最痛一刻戛然而止的病患！峰终定律（Peak-End Rule）深刻主导了客户忠诚度与人生回忆。',
    actionableSummary: [
      '宜家（IKEA）1元甜筒法则：逛完全程疲惫不堪后，出口处的低价冰淇淋制造完美甜美收尾。',
      '工作报告与演讲设计：开头可以平实，但必须有一个令人惊叹的核心金句（峰值），并在结尾给出振奋人心的行动愿景（终点）。',
      '亲密关系修复：一次愉快的约会如果以争吵抢车位结尾，整晚回忆都会被染成灰色；始终保证离别时的一记拥抱与真诚微笑。',
    ],
  };

  if (gameState === 'intro') {
    return (
      <div className="flex flex-col items-center justify-start min-h-[85vh] w-full max-w-lg mx-auto py-4 px-2">
        <div className="w-full flex items-center justify-between mb-4">
          <button
            onClick={() => navigate('/games')}
            type="button"
            className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>返回竞技场</span>
          </button>
          <span className="text-xs font-mono font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
            GAME 04
          </span>
        </div>

        <div className="w-full game-arcade-card rounded-3xl p-6 sm:p-8 border-amber-200/90 shadow-xl space-y-6 relative overflow-hidden">
          {/* Ambient colorful glow */}
          <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-gradient-to-br from-amber-400/30 to-orange-600/20 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-gradient-to-br from-yellow-400/20 to-amber-500/20 blur-2xl pointer-events-none" />

          {/* Animated Activity Monogram */}
          <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 shadow-lg shadow-amber-500/30 animate-pulseGlow" />
            <Activity className="w-10 h-10 text-white relative z-10" />
          </div>

          <div className="text-center space-y-2 relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200">
              <Sparkles className="w-3.5 h-3.5" />
              <span>卡尼曼心理学 · 体验峰终定律</span>
            </div>
            <h1 className="font-serif-editorial text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
              04 · 峰值与结尾
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-sm mx-auto">
              探索一段旅程或服务的全局回忆为何完全不等于平均分。化身体验波形设计师，掌握打造令人终生难忘高光体验的秘籍。
            </p>
          </div>

          <div className="space-y-2 pt-2 border-t border-stone-200/60 text-left relative z-10">
            <div className="flex justify-between items-center text-xs font-bold text-stone-800">
              <span>选择体验工坊难度：</span>
              <span className="text-amber-600 font-numeric">{diffConfig.multiplierText} 积分收益</span>
            </div>
            <DifficultySelector value={difficulty} onChange={setDifficulty} />
          </div>

          <button
            onClick={handleStartGame}
            type="button"
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-600 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-sm shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 relative z-10 game-btn-tactile"
          >
            <Activity className="w-4 h-4 text-white" />
            <span>开始波形设计（{difficulty}难度 · {diffConfig.multiplierText} 积分加成）</span>
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'debrief') {
    return (
      <div className="py-4 px-2">
        <GameDebriefModal
          data={debriefData}
          onRestart={() => setGameState('designing')}
          onReturn={() => navigate('/games')}
        />
      </div>
    );
  }

  // Generate SVG curve points for the 5 steps
  const svgWidth = 320;
  const svgHeight = 100;
  const points = scores.map((s, idx) => {
    const x = 30 + idx * ((svgWidth - 60) / 4);
    const y = svgHeight - 15 - (s / 10) * (svgHeight - 30);
    return { x, y, score: s };
  });

  const pathD = points.reduce((acc, p, idx) => {
    if (idx === 0) return `M ${p.x} ${p.y}`;
    return `${acc} L ${p.x} ${p.y}`;
  }, '');

  return (
    <div className="flex flex-col items-center justify-start min-h-[85vh] w-full max-w-lg mx-auto py-2 px-2 animate-fadeIn space-y-4">
      {/* Game HUD */}
      <GameHeaderHud
        title="04 · 峰值与结尾"
        numberPrefix="04"
        difficulty={difficulty}
        score={liveScore}
        onExit={() => setGameState('intro')}
        accentColor="#F59E0B"
      />

      <div className="w-full game-arcade-card rounded-3xl p-6 border-amber-100 shadow-xl space-y-5 animate-fadeIn bg-white relative overflow-hidden">
        {/* Header Title */}
        <div className="space-y-1 border-b border-stone-200/70 pb-3">
          <span className="text-[10px] font-black text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 font-mono">
            EXPERIENCE WAVEFORM SIMULATOR
          </span>
          <h2 className="text-xl font-bold text-stone-900 font-serif-editorial">
            动态体验波形调音台
          </h2>
          <p className="text-xs text-stone-500 font-sans">
            实时滑动 5 个节点的体验体验值（1~10分），观察波形与大脑长久记忆的变化
          </p>
        </div>

        {/* Dynamic Interactive SVG Waveform Canvas */}
        <div className="p-4 bg-gradient-to-b from-stone-900 to-[#1C1929] rounded-2xl border border-stone-800 shadow-inner space-y-2 text-white">
          <div className="flex items-center justify-between text-[11px] font-mono text-stone-300">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              实时心智体验波形
            </span>
            <span className="text-amber-400 font-bold">卡尼曼回忆值: {rememberedScore} / 10</span>
          </div>

          <div className="relative w-full h-28 flex items-center justify-center">
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="waveGlow" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Area under curve */}
              <path
                d={`${pathD} L ${points[4].x} ${svgHeight} L ${points[0].x} ${svgHeight} Z`}
                fill="url(#waveGlow)"
              />

              {/* Glowing Line */}
              <path
                d={pathD}
                fill="none"
                stroke="#F59E0B"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Points */}
              {points.map((p, idx) => {
                const isPeak = p.score === peakScore;
                const isEnd = idx === 4;
                return (
                  <g key={idx}>
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={isPeak || isEnd ? 6.5 : 4.5}
                      fill={isPeak ? '#EF4444' : isEnd ? '#8B5CF6' : '#F59E0B'}
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                    <text
                      x={p.x}
                      y={p.y - 10}
                      fontSize="9"
                      fill="#ffffff"
                      textAnchor="middle"
                      fontWeight="bold"
                    >
                      {p.score}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
          <div className="flex justify-between text-[10px] text-stone-400 font-mono px-2">
            <span>进店排队</span>
            <span>选座就座</span>
            <span className="text-rose-400 font-bold">主菜(峰值)</span>
            <span>中场环境</span>
            <span className="text-purple-400 font-bold">结账(结尾)</span>
          </div>
        </div>

        {/* Live Calculation Metric Cards */}
        <div className="grid grid-cols-3 gap-2 text-center font-numeric">
          <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 shadow-2xs">
            <span className="text-[10px] text-stone-500 font-semibold block">全程数学平均</span>
            <span className="text-base font-black text-stone-700">{averageScore} 分</span>
          </div>

          <div className="p-3 bg-rose-50/80 rounded-2xl border border-rose-200 shadow-2xs">
            <span className="text-[10px] text-rose-800 font-semibold block">最高峰值 (Peak)</span>
            <span className="text-base font-black text-rose-700">{peakScore} 分</span>
          </div>

          <div className="p-3 bg-purple-50/80 rounded-2xl border border-purple-200 shadow-2xs">
            <span className="text-[10px] text-purple-800 font-semibold block">最终长久回忆分</span>
            <span className="text-base font-black text-purple-700">{rememberedScore} 分</span>
          </div>
        </div>

        {/* Sliders for the 5 points */}
        <div className="space-y-2.5 pt-1">
          {steps.map((step, idx) => (
            <div key={idx} className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-1.5 shadow-2xs">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-stone-800 font-sans">{step.name}</span>
                <span className="font-black text-amber-700 font-numeric bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                  {scores[idx]} 分
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={scores[idx]}
                onChange={(e) => updateScore(idx, Number(e.target.value))}
                className="w-full accent-amber-600 cursor-pointer h-2 bg-stone-200 rounded-lg"
              />
            </div>
          ))}
        </div>

        {/* Peak-End Equation Callout */}
        <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-amber-200 text-xs text-stone-700 space-y-1 shadow-2xs">
          <span className="font-bold text-stone-900 font-serif-editorial flex items-center gap-1">
            <Sparkles className="w-4 h-4 text-amber-600" />
            卡尼曼峰终定律：全局记忆回忆 ≈ (最高峰值 {peakScore} + 结尾时刻 {endScore}) ÷ 2 = {rememberedScore}
          </span>
          <p className="text-[11px] leading-relaxed text-stone-600 font-sans">
            试着把第 5 个节点（结尾）调低到 2 分，你会发现即便前 4 个节点体验再好，客户离开后回忆依然会被毁掉！
          </p>
        </div>

        <button
          onClick={handleFinish}
          type="button"
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-sm shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 game-btn-tactile"
        >
          <span>提交体验设计，生成研报</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

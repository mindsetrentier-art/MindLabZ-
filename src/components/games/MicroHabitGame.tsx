import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Sparkles, CheckCircle2, RotateCcw, ArrowRight, Zap, Target, Sliders, Check, Layers, Cpu } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { GameDifficulty, DIFFICULTY_CONFIGS, DIFFICULTY_LIST } from '../../data/difficulty';
import { DifficultySelector } from './DifficultySelector';
import { GameDebriefModal, DebriefData } from './GameDebriefModal';
import { GameHeaderHud } from './GameHeaderHud';
import { gameAudio } from '../../utils/gameAudio';

interface BigGoal {
  id: string;
  title: string;
  vaguePrompt: string;
  microActions: { text: string; frictionLevel: '极低 (2分钟定律)' | '适中' | '过高易放弃'; isOptimal: boolean }[];
  existingAnchors: string[];
  environmentTweaks: string[];
}

const GOALS_LIST: BigGoal[] = [
  {
    id: 'goal-fitness',
    title: '每天坚持体能训练保持精力',
    vaguePrompt: '“下周起，我每天下班都要去健身房举铁或者跑步 5 公里！”（往往坚持不到第 3 天）',
    microActions: [
      { text: '穿上跑鞋，做 1 次深蹲并走出家门 100 米', frictionLevel: '极低 (2分钟定律)', isOptimal: true },
      { text: '每天必须跑完 5 公里打卡', frictionLevel: '过高易放弃', isOptimal: false },
      { text: '做 50 个波比跳', frictionLevel: '适中', isOptimal: false },
    ],
    existingAnchors: [
      '每当我下班推开家门换下拖鞋后',
      '每当我洗完晨间脸刷完牙后',
      '每当我吃完晚餐放下碗筷后',
    ],
    environmentTweaks: [
      '前一天晚上把跑鞋和运动短裤直接放在床边显眼处',
      '把健身房年卡放进钱包最里面锁起来',
      '在玄关门把手上贴一个微深蹲便签',
    ],
  },
  {
    id: 'goal-reading',
    title: '重拾深度阅读与认知升级',
    vaguePrompt: '“今年一定要静下心读完 30 本厚砖头心理学名著！”（书买了一大堆在架子上吃灰）',
    microActions: [
      { text: '坐在沙发上，随手翻开第一页读满 2 个自然段', frictionLevel: '极低 (2分钟定律)', isOptimal: true },
      { text: '每天必须闭关精读 1 整章并写 500 字笔记', frictionLevel: '过高易放弃', isOptimal: false },
      { text: '每周挑一天狂读 5 小时', frictionLevel: '适中', isOptimal: false },
    ],
    existingAnchors: [
      '每当我倒好下午第一杯热茶后',
      '每当我晚上钻进被窝关掉大灯前',
      '每当我坐上早高峰地铁入座后',
    ],
    environmentTweaks: [
      '把正在读的书翻开直接扣在茶几中央，把电视遥控器藏在抽屉底',
      '手机设置飞行模式并放在另一个房间',
      '随身随包携带轻便开本纸质书',
    ],
  },
  {
    id: 'goal-focus',
    title: '开启深度专注，戒除手机信息瘾',
    vaguePrompt: '“明天起我上班再也不碰手机摸鱼，全天绝对专注！”（半小时后忍不住看红点）',
    microActions: [
      { text: '开启番茄钟 15 分钟专注，把手机屏幕朝下推开到手臂触碰不到处', frictionLevel: '极低 (2分钟定律)', isOptimal: true },
      { text: '直接注销所有社交软件账号', frictionLevel: '过高易放弃', isOptimal: false },
      { text: '全天靠纯意志力硬抗摸鱼冲动', frictionLevel: '适中', isOptimal: false },
    ],
    existingAnchors: [
      '每当我晨会结束坐定在办公桌前时',
      '每当我戴上降噪耳机的那一刻',
      '每当我打开工作电脑登录 IDE 时',
    ],
    environmentTweaks: [
      '把手机静音并放到视线完全不可见的背包侧袋（视线外即大脑外）',
      '关闭所有非紧急社群的浮窗弹窗提醒',
      '浏览器书签栏隐藏摸鱼新闻网站',
    ],
  },
];

export const MicroHabitGame: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, recordGameResult } = useApp();

  const urlDiff = searchParams.get('difficulty') as GameDifficulty | null;
  const initialDiff: GameDifficulty = urlDiff && DIFFICULTY_LIST.includes(urlDiff) ? urlDiff : '中';

  const [difficulty, setDifficulty] = useState<GameDifficulty>(initialDiff);
  const [gameState, setGameState] = useState<'intro' | 'step1' | 'step2' | 'step3' | 'debrief'>('intro');
  const [selectedGoalIdx, setSelectedGoalIdx] = useState(0);

  const [chosenMicroIdx, setChosenMicroIdx] = useState<number | null>(null);
  const [chosenAnchor, setChosenAnchor] = useState<string>('');
  const [chosenTweak, setChosenTweak] = useState<string>('');
  const [score, setScore] = useState(0);

  const diffConfig = DIFFICULTY_CONFIGS[difficulty];
  const isFirstTime = !(user.completedGames?.includes('micro-habit'));
  const currentGoal = GOALS_LIST[selectedGoalIdx];

  const startSession = (selectedDiff: GameDifficulty = difficulty) => {
    gameAudio.playSuccess();
    setSelectedGoalIdx(Math.floor(Math.random() * GOALS_LIST.length));
    setChosenMicroIdx(null);
    setChosenAnchor('');
    setChosenTweak('');
    setScore(0);
    setGameState('step1');
  };

  const handleFinishStep1 = (idx: number) => {
    gameAudio.playSelect();
    setChosenMicroIdx(idx);
    setScore(prev => prev + Math.round(900 * diffConfig.scoreMultiplier));
    setGameState('step2');
  };

  const handleFinishStep2 = (anchor: string) => {
    gameAudio.playSelect();
    setChosenAnchor(anchor);
    setScore(prev => prev + Math.round(1000 * diffConfig.scoreMultiplier));
    setGameState('step3');
  };

  const handleFinishStep3 = (tweak: string) => {
    gameAudio.playVictory();
    setChosenTweak(tweak);

    const calculatedXp = isFirstTime
      ? Math.round(38 * diffConfig.xpMultiplier)
      : Math.round(10 * diffConfig.xpMultiplier);

    const finalScore = Math.round(3000 * diffConfig.scoreMultiplier);
    setScore(finalScore);

    recordGameResult('micro-habit', {
      score: finalScore,
      accuracy: 98,
      reactionTime: 820,
      xpGained: calculatedXp,
      comboMax: 3,
      conceptLearned: '习惯回路（Habit Loop: 提示-渴求-反应-奖励）与环境选择架构',
      lawId: 'delay-discounting',
      difficulty,
    });

    setGameState('debrief');
  };

  const debriefData: DebriefData = {
    gameId: 'micro-habit',
    gameTitle: '微习惯设计师',
    numberPrefix: '08',
    difficulty,
    score,
    accuracy: 98,
    isFirstTime,
    xpEarned: isFirstTime ? Math.round(40 * diffConfig.xpMultiplier) : Math.round(10 * diffConfig.xpMultiplier),
    bestAnswerReview:
      '打造不可撼动习惯的黄金法则：【阻力降到 2 分钟以内、锚定在坚固的旧习惯之后、用物理环境消除摩擦】。绝不依赖不可靠的爆发性意志力，而是搭建自动化运行的行为管道。',
    psychologicalMechanism:
      '詹姆斯·克利尔在《原子习惯》与斯坦福福格行为模型（B = MAP：行为 = 动机 × 能力 × 提示）指出：动机是不可靠的波浪，能力阻力越低，行为越容易启动。当大脑执行一个行动耗费的前额叶能量小于阻力阈值时，神经可塑性回路将实现无意识自动化运转。',
    actionableSummary: [
      '“2分钟定律”：任何新习惯开始时，把它规模缩小到 2 分钟以内（读1页书、做1个俯卧撑）。',
      '“习惯叠加公式”：继【既有旧习惯】之后，我将执行【新微行动】。',
      '环境设计优于意志力：把好习惯的提示变得显而易见（置于眼前），把坏习惯的阻力增加到极度麻烦（隔绝在抽屉）。',
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
          <span className="text-xs font-mono font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
            GAME 08
          </span>
        </div>

        <div className="w-full game-arcade-card rounded-3xl p-6 sm:p-8 border-teal-200/90 shadow-xl space-y-6 relative overflow-hidden">
          {/* Ambient colorful glow */}
          <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-gradient-to-br from-teal-400/30 to-cyan-600/20 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-400/20 blur-2xl pointer-events-none" />

          {/* Animated Sparkles Monogram */}
          <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-600 shadow-lg shadow-teal-500/30 animate-pulseGlow" />
            <Sparkles className="w-10 h-10 text-white relative z-10" />
          </div>

          <div className="text-center space-y-2 relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200">
              <Zap className="w-3.5 h-3.5 text-teal-600" />
              <span>习惯回路 · 2分钟极低阻力设计</span>
            </div>
            <h1 className="font-serif-editorial text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
              08 · 微习惯设计师
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-sm mx-auto">
              告别靠死撑意志力带来的内耗挫败。亲手将模糊宏大的目标，解构为极低阻力、环境驱动的自动化复利飞轮。
            </p>
          </div>

          <div className="space-y-2 pt-2 border-t border-stone-200/60 text-left relative z-10">
            <div className="flex justify-between items-center text-xs font-bold text-stone-800">
              <span>选择设计工坊难度：</span>
              <span className="text-teal-600 font-numeric">{diffConfig.multiplierText} 积分收益</span>
            </div>
            <DifficultySelector value={difficulty} onChange={setDifficulty} />
          </div>

          <button
            onClick={() => startSession(difficulty)}
            type="button"
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-teal-500 via-emerald-600 to-cyan-600 hover:opacity-95 text-white font-bold text-sm shadow-lg shadow-teal-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 relative z-10 game-btn-tactile"
          >
            <Sparkles className="w-4 h-4 text-white" />
            <span>进入习惯回路工坊（{difficulty}难度 · {diffConfig.multiplierText} 积分加成）</span>
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
          onRestart={() => startSession(difficulty)}
          onReturn={() => navigate('/games')}
        />
      </div>
    );
  }

  // Step names & index mapping
  const currentStepNum = gameState === 'step1' ? 1 : gameState === 'step2' ? 2 : 3;

  return (
    <div className="flex flex-col items-center justify-start min-h-[85vh] w-full max-w-lg mx-auto py-2 px-2 animate-fadeIn space-y-4">
      {/* Game HUD */}
      <GameHeaderHud
        title="08 · 微习惯设计师"
        numberPrefix="08"
        difficulty={difficulty}
        score={score}
        currentRound={currentStepNum}
        totalRounds={3}
        onExit={() => setGameState('intro')}
        accentColor="#14B8A6"
      />

      <div className="w-full game-arcade-card rounded-3xl p-6 border-teal-100 shadow-xl space-y-5 animate-fadeIn bg-white relative overflow-hidden">
        {/* Goal Card */}
        <div className="p-4 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-2xl border border-teal-200 space-y-1 shadow-2xs">
          <span className="text-[10px] font-black text-teal-800 bg-teal-100/90 px-2 py-0.5 rounded-md font-mono">
            HABIT BLUEPRINT #{currentStepNum} / 3
          </span>
          <h2 className="text-lg font-bold text-stone-900 font-serif-editorial">
            {currentGoal.title}
          </h2>
          <p className="text-xs text-stone-600 italic font-serif-editorial">
            {currentGoal.vaguePrompt}
          </p>
        </div>

        {/* 3 Step Interactive Circuit Nodes Tracker */}
        <div className="flex items-center justify-between gap-1 p-2 bg-stone-50 rounded-2xl border border-stone-200 text-xs font-bold font-numeric">
          <div className={`flex-1 py-1.5 px-2 rounded-xl text-center transition-all ${currentStepNum >= 1 ? 'bg-teal-600 text-white shadow-xs' : 'text-stone-400'}`}>
            1. 阻力切割
          </div>
          <span className="text-stone-300">→</span>
          <div className={`flex-1 py-1.5 px-2 rounded-xl text-center transition-all ${currentStepNum >= 2 ? 'bg-teal-600 text-white shadow-xs' : 'text-stone-400'}`}>
            2. 习惯锚点
          </div>
          <span className="text-stone-300">→</span>
          <div className={`flex-1 py-1.5 px-2 rounded-xl text-center transition-all ${currentStepNum >= 3 ? 'bg-teal-600 text-white shadow-xs' : 'text-stone-400'}`}>
            3. 环境架构
          </div>
        </div>

        {/* STEP 1: Friction reduction */}
        {gameState === 'step1' && (
          <div className="space-y-3.5 animate-fadeIn">
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5 font-serif-editorial">
                <Target className="w-4 h-4 text-teal-600" />
                <span>第 1 步：动作阻力切割（2分钟定律）</span>
              </h4>
              <p className="text-xs text-stone-500 font-sans">
                请选择阻力极小、大脑最不可能找借口拒绝的【原子微行动】：
              </p>
            </div>

            <div className="space-y-2.5">
              {currentGoal.microActions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => handleFinishStep1(idx)}
                  type="button"
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between active:scale-98 shadow-2xs ${
                    action.isOptimal
                      ? 'bg-white hover:bg-teal-50 border-stone-200 hover:border-teal-400'
                      : 'bg-stone-50 hover:bg-stone-100 border-stone-200'
                  }`}
                >
                  <span className="text-xs sm:text-[13px] font-bold text-stone-800 font-sans">{action.text}</span>
                  <span className={`text-[10px] px-2.5 py-1 rounded-lg font-numeric font-bold shrink-0 ml-2 ${action.isOptimal ? 'bg-teal-100 text-teal-800' : 'bg-stone-200 text-stone-600'}`}>
                    {action.frictionLevel}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: Anchor identification */}
        {gameState === 'step2' && (
          <div className="space-y-3.5 animate-fadeIn">
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5 font-serif-editorial">
                <Layers className="w-4 h-4 text-teal-600" />
                <span>第 2 步：习惯叠加锚点（Habit Stacking）</span>
              </h4>
              <p className="text-xs text-stone-500 font-sans">
                挑选一个你每天都会稳定发生的【既有生活基石习惯】作为触发提示：
              </p>
            </div>

            <div className="space-y-2.5">
              {currentGoal.existingAnchors.map((anchor, idx) => (
                <button
                  key={idx}
                  onClick={() => handleFinishStep2(anchor)}
                  type="button"
                  className="w-full text-left p-4 rounded-2xl border-2 border-stone-200 hover:border-teal-400 bg-white hover:bg-teal-50 transition-all text-xs sm:text-[13px] font-bold text-stone-800 cursor-pointer flex items-center justify-between active:scale-98 shadow-2xs font-sans"
                >
                  <span>{anchor}</span>
                  <ArrowRight className="w-4 h-4 text-teal-600 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: Environmental architecture */}
        {gameState === 'step3' && (
          <div className="space-y-3.5 animate-fadeIn">
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5 font-serif-editorial">
                <Cpu className="w-4 h-4 text-teal-600" />
                <span>第 3 步：物理环境选择架构（Choice Architecture）</span>
              </h4>
              <p className="text-xs text-stone-500 font-sans">
                重新布置你的房间或桌面，让好习惯的阻力降至 0：
              </p>
            </div>

            <div className="space-y-2.5">
              {currentGoal.environmentTweaks.map((tweak, idx) => (
                <button
                  key={idx}
                  onClick={() => handleFinishStep3(tweak)}
                  type="button"
                  className="w-full text-left p-4 rounded-2xl border-2 border-stone-200 hover:border-teal-400 bg-white hover:bg-teal-50 transition-all text-xs sm:text-[13px] font-bold text-stone-800 cursor-pointer flex items-center justify-between active:scale-98 shadow-2xs font-sans"
                >
                  <span>{tweak}</span>
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

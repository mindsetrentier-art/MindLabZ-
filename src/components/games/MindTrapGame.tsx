import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { RotateCcw, Zap, Trophy, Brain, Sparkles, AlertTriangle, Flame, ShieldCheck, Crown, Play, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { GameDifficulty, DIFFICULTY_CONFIGS, DIFFICULTY_LIST, shuffleArray } from '../../data/difficulty';
import { DifficultySelector } from './DifficultySelector';
import { GameHeaderHud } from './GameHeaderHud';
import { gameAudio } from '../../utils/gameAudio';

interface StroopTrial {
  type: 'stroop';
  wordText: string;
  colorName: string; // The correct answer physical color of the font
  colorCode: string; // Hex color
  options: string[];
  instruction?: string;
  isInverted?: boolean; // For expert difficulty: answer is word meaning instead of font color
}

interface ReflectionTrial {
  type: 'reflection';
  question: string;
  options: string[];
  correctAnswer: string;
  intuitiveTrap: string;
  explanation: string;
}

type Trial = StroopTrial | ReflectionTrial;

const COLOR_MAP: Record<string, string> = {
  '红色': '#EF4444',
  '蓝色': '#3B82F6',
  '绿色': '#10B981',
  '黄色': '#EAB308',
  '紫色': '#8B5CF6',
  '橙色': '#F97316',
  '黑色': '#18181B',
};

const ALL_COLOR_NAMES = ['红色', '蓝色', '绿色', '黄色', '紫色', '橙色', '黑色'];

const ALL_REFLECTION_QUESTIONS: ReflectionTrial[] = [
  {
    type: 'reflection',
    question: '球棒和棒球总价 1.10 美元。球棒比棒球贵 1.00 美元。请问棒球多少钱？',
    options: ['0.05 美元', '0.10 美元', '0.01 美元', '0.15 美元'],
    correctAnswer: '0.05 美元',
    intuitiveTrap: '直觉答案 0.10 美元',
    explanation: 'System 1 会本能跳出 1.10 - 1.00 = 0.10；但若球是 0.10，球棒则是 1.10，总价将变成 1.20。正确：球 0.05，球棒 1.05。',
  },
  {
    type: 'reflection',
    question: '5 台机器花 5 分钟制造 5 个零件。那么 100 台机器制造 100 个零件需要多少分钟？',
    options: ['5 分钟', '100 分钟', '20 分钟', '50 分钟'],
    correctAnswer: '5 分钟',
    intuitiveTrap: '直觉答案 100 分钟',
    explanation: '1 台机器制造 1 个零件需要 5 分钟。100 台机器并行工作，制造 100 个零件依然只需要 5 分钟。',
  },
  {
    type: 'reflection',
    question: '湖面上有一片睡莲，每天面积扩大一倍。若 48 天覆盖整个湖面，请问覆盖半个湖面是在第几天？',
    options: ['第 47 天', '第 24 天', '第 40 天', '第 36 天'],
    correctAnswer: '第 47 天',
    intuitiveTrap: '直觉答案 24 天（直接除以 2）',
    explanation: '因为睡莲每天翻倍，所以在满湖的前一天（第 47 天）正好是半个湖面！',
  },
  {
    type: 'reflection',
    question: '你在跑步比赛中奋力加速，超过了第二名，那么你现在是第几名？',
    options: ['第二名', '第一名', '第三名', '第四名'],
    correctAnswer: '第二名',
    intuitiveTrap: '直觉答案 第一名',
    explanation: '你超过了第二名，你就取代了他原来的位置成为第二名，第一名依然在你的前方！',
  },
  {
    type: 'reflection',
    question: '三门问题（Monty Hall）：在 3 扇门中选 1 扇（1 扇有跑车，2 扇是山羊）。选定后主持人打开剩下两扇门中的一扇山羊门，并问你是否换门。数学上换门的中奖概率是：',
    options: ['2/3 (换门概率翻倍)', '1/2 (换不换都一样 50%)', '1/3 (坚持初选更高)', '1/4'],
    correctAnswer: '2/3 (换门概率翻倍)',
    intuitiveTrap: '直觉答案 50% 均等概率',
    explanation: '初选正确的概率仅为 1/3，车在另外两扇门之后的概率是 2/3。主持人排除一只羊后，所有 2/3 概率汇聚在剩下那扇门上！',
  },
  {
    type: 'reflection',
    question: '掷一枚均匀硬币，已经连续 5 次出现正面。那么第 6 次抛出正面的概率是：',
    options: ['50% (独立随机事件)', '远低于 50% (该出反面了)', '高于 50% (顺势而为)', '0%'],
    correctAnswer: '50% (独立随机事件)',
    intuitiveTrap: '赌徒谬误：直觉认为硬币有记忆要“平衡”',
    explanation: '每一次抛掷都是完全独立的统计事件，硬币没有任何记忆，正反面概率恒定为 50%。',
  },
  {
    type: 'reflection',
    question: '一列全电力驱动的动车正以 120km/h 速度向北疾驰，此时刮着强烈的西风。请问动车的烟雾往哪个方向飘？',
    options: ['根本没有烟雾 (电力动车)', '向东偏南', '向西偏北', '向正南'],
    correctAnswer: '根本没有烟雾 (电力动车)',
    intuitiveTrap: '直觉进入复杂的风向物理合成矢量运算',
    explanation: '题目明确指出是“全电力驱动的动车”，电车行驶中根本不产生任何煤烟！',
  },
  {
    type: 'reflection',
    question: '大医院每天出生 45 个婴儿，小医院每天出生 15 个婴儿。哪家医院更有可能在某天记录到超过 60% 是男婴？',
    options: ['小医院 (样本量小方差更大)', '大医院 (样本充足更稳定)', '两家概率完全相等', '无法预测'],
    correctAnswer: '小医院 (样本量小方差更大)',
    intuitiveTrap: '直觉答案 两家概率完全一样都是 50%',
    explanation: '大数定律表明：样本容量越小，偏离期望平均值（50%）产生极端波动的概率显著越高。',
  },
  {
    type: 'reflection',
    question: '父子遭遇严重车祸送医。急诊室主任一看到男孩惊呼：“我不能给他做手术，他是我的儿子！”已知主任不是男孩的父亲，主任是谁？',
    options: ['男孩的母亲', '继父', '毫无血缘关系的叔叔', '爷爷'],
    correctAnswer: '男孩的母亲',
    intuitiveTrap: '刻板印象自动将“外科主任”脑补为男性',
    explanation: '许多人受性别刻板印象禁锢陷入困惑，实际上急诊外科主任正是男孩的母亲！',
  },
  {
    type: 'reflection',
    question: '农场里有 17 只羊，除了 9 只以外其他全部病死了。请问农场现在还剩下几只活羊？',
    options: ['9 只', '8 只', '17 只', '0 只'],
    correctAnswer: '9 只',
    intuitiveTrap: '直觉下意识做减法 17 - 9 = 8',
    explanation: '仔细审题：“除了 9 只以外全部死了”，说明活着剩下的正好就是那 9 只！',
  },
];

export const MindTrapGame: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { recordGameResult } = useApp();

  const urlDiff = searchParams.get('difficulty') as GameDifficulty | null;
  const initialDiff: GameDifficulty = urlDiff && DIFFICULTY_LIST.includes(urlDiff) ? urlDiff : '中';

  const [difficulty, setDifficulty] = useState<GameDifficulty>(initialDiff);
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
  const diffConfig = DIFFICULTY_CONFIGS[difficulty];

  // Generate dynamic, randomized sequence based on difficulty
  const generateTrials = (diff: GameDifficulty) => {
    const list: Trial[] = [];

    const configMap: Record<GameDifficulty, { total: number; crtCount: number; timer: number; optionsCount: number; allowInverted: boolean }> = {
      '低': { total: 12, crtCount: 2, timer: 55, optionsCount: 3, allowInverted: false },
      '中': { total: 15, crtCount: 4, timer: 45, optionsCount: 3, allowInverted: false },
      '高': { total: 18, crtCount: 6, timer: 32, optionsCount: 4, allowInverted: false },
      '高级': { total: 20, crtCount: 7, timer: 25, optionsCount: 4, allowInverted: true },
    };

    const cfg = configMap[diff];
    const shuffledCrt = shuffleArray([...ALL_REFLECTION_QUESTIONS]);
    const crtSlice = shuffledCrt.slice(0, cfg.crtCount);

    const crtIndices = new Set<number>();
    while (crtIndices.size < crtSlice.length) {
      crtIndices.add(Math.floor(Math.random() * cfg.total));
    }

    let crtPtr = 0;
    for (let i = 0; i < cfg.total; i++) {
      if (crtIndices.has(i) && crtPtr < crtSlice.length) {
        const item = crtSlice[crtPtr++];
        const shuffledOpts = shuffleArray([...item.options]);
        list.push({
          ...item,
          options: shuffledOpts,
        });
      } else {
        const wordText = ALL_COLOR_NAMES[Math.floor(Math.random() * ALL_COLOR_NAMES.length)];
        const remainingColors = ALL_COLOR_NAMES.filter((c) => c !== wordText);
        const fontColor = remainingColors[Math.floor(Math.random() * remainingColors.length)];

        const isInverted = cfg.allowInverted && Math.random() < 0.35;
        const targetAnswer = isInverted ? wordText : fontColor;

        const distractors = ALL_COLOR_NAMES.filter((c) => c !== targetAnswer);
        const shuffledDistractors = shuffleArray(distractors).slice(0, cfg.optionsCount - 1);
        const options = shuffleArray([targetAnswer, ...shuffledDistractors]);

        list.push({
          type: 'stroop',
          wordText,
          colorName: targetAnswer,
          colorCode: COLOR_MAP[fontColor],
          options,
          isInverted,
          instruction: isInverted
            ? '🔥 逆向干扰模式：请选择文字本身的【字义】而非字体颜色！'
            : '⚡ 经典模式：请选择文字呈现的【墨水物理颜色】',
        });
      }
    }

    return { list, timer: cfg.timer };
  };

  const handleStart = (diff: GameDifficulty = difficulty) => {
    gameAudio.playSuccess();
    const { list, timer } = generateTrials(diff);
    setTrials(list);
    setCurrentTrialIndex(0);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setCorrectCount(0);
    setWrongCount(0);
    setReactionTimes([]);
    setTimeLeft(timer);
    setGameState('playing');
    trialStartRef.current = Date.now();
  };

  // Timer Countdown
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

  const handleAnswer = (chosenAnswer: string) => {
    const reaction = Date.now() - trialStartRef.current;
    setReactionTimes((prev) => [...prev, reaction]);

    const trial = trials[currentTrialIndex];
    let isCorrect = false;

    if (trial.type === 'stroop') {
      isCorrect = chosenAnswer === trial.colorName;
    } else {
      isCorrect = chosenAnswer === trial.correctAnswer;
    }

    if (isCorrect) {
      gameAudio.playSuccess();
      const newCombo = combo + 1;
      setCombo(newCombo);
      setMaxCombo((prev) => Math.max(prev, newCombo));
      setCorrectCount((prev) => prev + 1);

      const speedBonus = Math.max(0, 260 - Math.floor(reaction / 8));
      const basePoints = 260 + newCombo * 50 + speedBonus;
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

    setTimeout(() => setLastFeedback(null), 250);

    if (currentTrialIndex + 1 < trials.length) {
      setCurrentTrialIndex((prev) => prev + 1);
      trialStartRef.current = Date.now();
    } else {
      setGameState('game_over');
      gameAudio.playVictory();
    }
  };

  const avgReactionTime = reactionTimes.length > 0
    ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
    : 520;

  const handleFinish = () => {
    const total = correctCount + wrongCount;
    const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 50;
    const xpGained = Math.round((score / 15 + 130) * diffConfig.xpMultiplier);

    recordGameResult('mind-trap', {
      score,
      accuracy,
      reactionTime: avgReactionTime,
      xpGained,
      comboMax: maxCombo,
      conceptLearned: '双系统理论（System 1 直觉 vs System 2 理性）与斯特鲁普冲突抑制',
      lawId: 'stroop-effect',
      difficulty,
    });

    navigate('/games');
  };

  const currentTrial = trials[currentTrialIndex];

  return (
    <div className="flex flex-col items-center justify-start min-h-[85vh] w-full max-w-lg mx-auto py-3 px-2 animate-fadeIn">
      {/* Game Header HUD */}
      <GameHeaderHud
        title="思维陷阱解密"
        numberPrefix="CLASSIC"
        score={score}
        currentRound={currentTrialIndex + 1}
        totalRounds={trials.length || 15}
        difficulty={difficulty}
        comboCount={combo}
        onExit={() => (gameState === 'playing' ? setGameState('intro') : navigate('/games'))}
        onBack={() => (gameState === 'playing' ? setGameState('intro') : navigate('/games'))}
      />

      {gameState === 'intro' ? (
        <div className="w-full game-arcade-card rounded-3xl p-6 sm:p-8 border-rose-200/80 shadow-2xl space-y-6 relative overflow-hidden">
          {/* Ambient colorful glow */}
          <div className="absolute -top-16 -right-16 w-52 h-52 rounded-full bg-gradient-to-br from-rose-500/30 to-amber-500/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-52 h-52 rounded-full bg-gradient-to-br from-purple-500/20 to-rose-500/25 blur-3xl pointer-events-none" />

          <div className="relative text-center space-y-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-rose-500 via-amber-500 to-rose-600 text-white flex items-center justify-center mx-auto shadow-xl shadow-rose-500/30 ring-4 ring-rose-500/20 animate-subtleFloat">
              <Zap className="w-10 h-10 drop-shadow-md text-amber-200 fill-amber-300" />
            </div>

            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-700 text-xs font-bold border border-rose-200">
                <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                <span>双系统认知抑制训练</span>
              </div>
              <h2 className="text-2xl font-black text-stone-900 tracking-tight font-serif-editorial">
                Mind Trap · 思维陷阱解密
              </h2>
              <p className="text-xs text-stone-600 leading-relaxed max-w-sm mx-auto">
                结合斯特鲁普颜色干扰实验与高阶认知反思（CRT）陷阱题。逼迫前额叶启动 System 2 理性机制，粉碎直觉自动化盲从。
              </p>
            </div>
          </div>

          {/* Difficulty Setting */}
          <div className="space-y-2 pt-3 border-t border-rose-100 text-left">
            <label className="text-xs font-bold text-stone-800 block text-center">
              选择认知对抗强度：
            </label>
            <DifficultySelector value={difficulty} onChange={setDifficulty} />
          </div>

          <button
            onClick={() => handleStart(difficulty)}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-600 via-amber-600 to-rose-700 hover:from-rose-500 hover:to-amber-500 text-white font-black text-sm shadow-xl shadow-rose-600/30 transition-all flex items-center justify-center gap-2.5 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>开始思维陷阱挑战（{difficulty}难度 · {diffConfig.multiplierText}）</span>
          </button>
        </div>
      ) : gameState === 'game_over' ? (
        <div className="w-full game-arcade-card rounded-3xl p-6 sm:p-8 border-amber-200/80 shadow-2xl text-center space-y-6 animate-fadeIn relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-52 h-52 rounded-full bg-gradient-to-br from-amber-500/30 to-rose-500/20 blur-3xl pointer-events-none" />

          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 via-rose-500 to-amber-600 text-white flex items-center justify-center mx-auto shadow-xl shadow-amber-500/30 ring-4 ring-amber-500/20">
            <Trophy className="w-10 h-10 fill-white drop-shadow-md" />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-bold text-amber-600 tracking-wider uppercase">Debrief Report</span>
            <h2 className="text-2xl font-black text-stone-900 font-serif-editorial">
              思维挑战结语
            </h2>
            <p className="text-xs text-stone-600 font-numeric">
              【{difficulty}】难度 · 正确 <strong className="text-emerald-600 font-bold">{correctCount}</strong> / 错误 <strong className="text-rose-500 font-bold">{wrongCount}</strong>
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2.5 font-numeric">
            <div className="bg-gradient-to-b from-stone-50 to-stone-100 p-3.5 rounded-2xl border border-stone-200/90 shadow-sm">
              <span className="text-[10px] text-stone-500 font-bold block mb-1">最终得分</span>
              <span className="text-lg font-black text-stone-900">{score}</span>
            </div>
            <div className="bg-gradient-to-b from-rose-50 to-amber-50 p-3.5 rounded-2xl border border-rose-200/80 shadow-sm">
              <span className="text-[10px] text-rose-700 font-bold block mb-1">最高连击</span>
              <span className="text-lg font-black text-rose-600">{maxCombo} 次</span>
            </div>
            <div className="bg-gradient-to-b from-emerald-50 to-teal-50 p-3.5 rounded-2xl border border-emerald-200/80 shadow-sm">
              <span className="text-[10px] text-emerald-700 font-bold block mb-1">平均反应</span>
              <span className="text-lg font-black text-emerald-600">{avgReactionTime} ms</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-rose-50/70 to-amber-50/70 p-4 rounded-2xl text-left border border-rose-200/60 space-y-1.5">
            <h4 className="text-xs font-bold text-rose-950 flex items-center gap-1.5 font-serif-editorial">
              <Sparkles className="w-4 h-4 text-amber-500" />
              认知科学深度解析 · 斯特鲁普与双系统
            </h4>
            <p className="text-[11px] text-stone-700 leading-relaxed">
              自动化阅读（System 1）速度极快但本能轻信；辨识物理墨水与拆解直觉陷阱需要前额叶皮层主动调动 System 2 进行抑制控制。每次不同顺序的刺激训练，能有效防止自动化盲从。
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
              className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-stone-900 via-stone-800 to-rose-950 hover:from-stone-800 hover:to-rose-900 text-white font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>结算经验</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Active Trial Arena */
        <div className="w-full flex flex-col items-center space-y-4 animate-fadeIn">
          {/* Progress and Countdown Bar */}
          <div className="w-full flex justify-between items-center bg-white/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-stone-200/90 shadow-sm font-numeric">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-gradient-to-r from-rose-600 to-amber-600 text-white font-black rounded-lg text-xs shadow-sm">
                #{currentTrialIndex + 1} / {trials.length}
              </span>
              <div
                className={`flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-black ${
                  timeLeft <= 8 ? 'bg-rose-500 text-white animate-pulse' : 'bg-stone-900 text-white'
                }`}
              >
                <span>⏱️ {timeLeft}s</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-stone-600 font-bold">
              <span>正确: <strong className="text-emerald-600 font-extrabold">{correctCount}</strong></span>
              <span className="text-stone-300">/</span>
              <span>错误: <strong className="text-rose-500 font-extrabold">{wrongCount}</strong></span>
            </div>
          </div>

          {currentTrial && currentTrial.type === 'stroop' ? (
            /* Stroop Question Screen */
            <div className="w-full game-arcade-card rounded-3xl p-6 sm:p-7 border-rose-200/80 shadow-2xl text-center space-y-5">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-stone-500 font-mono">STROOP TASK</span>
                <span className={`${currentTrial.isInverted ? 'text-purple-600 font-black animate-pulse' : 'text-rose-600'}`}>
                  {currentTrial.instruction}
                </span>
              </div>

              {/* Stimulus Word Display */}
              <div className={`py-9 my-2 rounded-2xl border-2 flex items-center justify-center transition-all shadow-inner ${
                currentTrial.isInverted ? 'bg-purple-950/20 border-purple-300 shadow-purple-500/10' : 'bg-stone-900/90 border-stone-700/80'
              }`}>
                <span
                  className="text-5xl sm:text-6xl font-black tracking-widest transition-all select-none drop-shadow-md font-serif-editorial"
                  style={{ color: currentTrial.colorCode }}
                >
                  {currentTrial.wordText}
                </span>
              </div>

              {/* Color Options */}
              <div className={`grid gap-3 ${currentTrial.options.length === 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'}`}>
                {currentTrial.options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(opt)}
                    className="py-3.5 rounded-2xl bg-white hover:bg-rose-50 border-2 border-stone-200 hover:border-rose-400 text-stone-900 font-black text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm group active:scale-95"
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0 ring-2 ring-stone-200 group-hover:scale-125 transition-transform"
                      style={{ backgroundColor: COLOR_MAP[opt] }}
                    />
                    <span>{opt}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : currentTrial && currentTrial.type === 'reflection' ? (
            /* CRT Reflection Riddle */
            <div className="w-full game-arcade-card rounded-3xl p-6 sm:p-7 border-amber-200/80 shadow-2xl space-y-4">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-amber-600 flex items-center gap-1.5 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  认知反思陷阱题 (CRT)
                </span>
                <span className="text-stone-500 font-mono">System 2 激活</span>
              </div>

              <h3 className="text-sm sm:text-base font-extrabold text-stone-900 leading-snug font-serif-editorial p-1">
                {currentTrial.question}
              </h3>

              <div className="space-y-2.5 pt-1">
                {currentTrial.options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(opt)}
                    className="w-full text-left p-4 rounded-2xl bg-white hover:bg-amber-50/70 border-2 border-stone-200/90 hover:border-amber-400 text-stone-800 hover:text-stone-950 font-bold text-xs transition-all cursor-pointer shadow-sm active:scale-98"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {lastFeedback && (
            <div
              className={`text-xs font-black px-4 py-1.5 rounded-full shadow-md animate-bounce ${
                lastFeedback === 'correct'
                  ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                  : 'bg-rose-500 text-white shadow-rose-500/30'
              }`}
            >
              {lastFeedback === 'correct' ? '🎯 正确！启动理性抑制' : '⚠️ 踩中直觉陷阱！'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

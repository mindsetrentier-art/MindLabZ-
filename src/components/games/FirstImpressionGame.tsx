import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Eye,
  Sparkles,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Flame,
  Zap,
  Timer,
  Lightbulb,
  Calculator,
  Compass,
  TrendingUp,
  RotateCcw,
  Sliders,
  Target,
  Award,
  Layers,
  Scale
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { GameDifficulty } from '../../data/difficulty';
import { GameDebriefModal, DebriefData } from './GameDebriefModal';
import { GameHeaderHud } from './GameHeaderHud';
import { gameAudio } from '../../utils/gameAudio';
import { FirstImpressionGameIcon } from './FirstImpressionGameIcon';
import {
  ValuationOption,
  ValuationQuestion,
  MASTER_VALUATION_POOL,
  getUniqueSessionQuestions
} from '../../data/valuationQuestions';

export type GameLevel = '初级' | '中级' | '高级';

interface LevelConfig {
  id: GameLevel;
  name: string;
  badge: string;
  questionCount: number;
  timeLimitPerQ: number;
  scoreMultiplier: number;
  xpReward: number;
  description: string;
  accentColor: string;
}

const LEVEL_CONFIGS: Record<GameLevel, LevelConfig> = {
  '初级': {
    id: '初级',
    name: '初级 · 破锚启蒙',
    badge: '5 题',
    questionCount: 5,
    timeLimitPerQ: 15,
    scoreMultiplier: 1.0,
    xpReward: 35,
    description: '5 题精选热身。思考时间充裕，适合初识商业低价锚定与日费心算基础。',
    accentColor: '#10B981'
  },
  '中级': {
    id: '中级',
    name: '中级 · 量感实战',
    badge: '25 题',
    questionCount: 25,
    timeLimitPerQ: 11,
    scoreMultiplier: 1.6,
    xpReward: 90,
    description: '25 题深度攻坚。覆盖复利、折上折、时薪与年卡沉没，建立稳固心算直觉。',
    accentColor: '#F59E0B'
  },
  '高级': {
    id: '高级',
    name: '高级 · 宗师马拉松',
    badge: '50 题',
    questionCount: 50,
    timeLimitPerQ: 7,
    scoreMultiplier: 2.8,
    xpReward: 200,
    description: '50 题极限冲刺！全量题库非重复高能挑战，极速高压下炼就心算火眼金睛。',
    accentColor: '#EC4899'
  }
};

export const FirstImpressionGame: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, recordGameResult } = useApp();

  const urlDiff = searchParams.get('difficulty');
  const initialLevel: GameLevel = urlDiff === '高' ? '高级' : urlDiff === '中' ? '中级' : '初级';

  const [level, setLevel] = useState<GameLevel>(initialLevel);
  const [gameMode, setGameMode] = useState<'challenge' | 'practice'>('challenge');
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'revealed' | 'debrief'>('intro');

  // Challenge Mode states
  const [challengeQuestions, setChallengeQuestions] = useState<ValuationQuestion[]>([]);
  const [challengeIdx, setChallengeIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number>(15);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [correctAnswersCount, setCorrectAnswersCount] = useState<number>(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [milestoneNotice, setMilestoneNotice] = useState<string | null>(null);

  // Practice Mode states (Slider Estimation)
  const [practiceIdx, setPracticeIdx] = useState(0);
  const [sliderValue, setSliderValue] = useState<number>(MASTER_VALUATION_POOL[0].sliderDefault);
  const [practiceRevealed, setPracticeRevealed] = useState(false);
  const [practiceRecords, setPracticeRecords] = useState<Record<string, { estimate: number; errorPercent: number }>>({});

  const questionStartTimeRef = useRef<number>(Date.now());
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const currentLevelConfig = LEVEL_CONFIGS[level];
  const isFirstTime = !(user.completedGames?.includes('first-impression'));

  // Anti-repetition question generator
  const startChallengeSession = (selectedLevel: GameLevel = level) => {
    gameAudio.playSuccess();
    const config = LEVEL_CONFIGS[selectedLevel];

    // Read recently seen question IDs to ensure freshness
    let recentIds: string[] = [];
    try {
      const stored = sessionStorage.getItem('mindlabz_valuation_recent_ids');
      if (stored) recentIds = JSON.parse(stored);
    } catch {
      // ignore
    }

    const questions = getUniqueSessionQuestions(config.questionCount, recentIds);

    // Update recent IDs in session storage
    try {
      const updatedRecent = Array.from(new Set([...questions.map(q => q.id), ...recentIds])).slice(0, 100);
      sessionStorage.setItem('mindlabz_valuation_recent_ids', JSON.stringify(updatedRecent));
    } catch {
      // ignore
    }

    setChallengeQuestions(questions);
    setChallengeIdx(0);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setCorrectAnswersCount(0);
    setReactionTimes([]);
    setSelectedOptionId(null);
    setMilestoneNotice(null);

    setTimeLeft(config.timeLimitPerQ);
    questionStartTimeRef.current = Date.now();
    setGameMode('challenge');
    setGameState('playing');
  };

  const startPracticeMode = (idx = 0) => {
    gameAudio.playSelect();
    setPracticeIdx(idx);
    setSliderValue(MASTER_VALUATION_POOL[idx].sliderDefault);
    setPracticeRevealed(false);
    setGameMode('practice');
    setGameState('playing');
  };

  const currentChallengeQ = challengeQuestions[challengeIdx];
  const currentPracticeQ = MASTER_VALUATION_POOL[practiceIdx];

  // Countdown timer for challenge mode
  useEffect(() => {
    if (gameMode !== 'challenge' || gameState !== 'playing') {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      return;
    }

    timerIntervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
          handleChallengeTimeOut();
          return 0;
        }
        if (prev <= 3) {
          gameAudio.playTick();
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [gameMode, gameState, challengeIdx]);

  const handleChallengeTimeOut = () => {
    gameAudio.playMistake();
    setSelectedOptionId('TIMEOUT');
    setCombo(0);
    setReactionTimes(prev => [...prev, currentLevelConfig.timeLimitPerQ * 1000]);
    setGameState('revealed');
  };

  const handleSelectOption = (option: ValuationOption) => {
    if (gameState !== 'playing') return;
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    const reaction = Date.now() - questionStartTimeRef.current;
    setReactionTimes(prev => [...prev, reaction]);
    setSelectedOptionId(option.id);

    if (option.isCorrect) {
      const nextCombo = combo + 1;
      setCombo(nextCombo);
      if (nextCombo > maxCombo) setMaxCombo(nextCombo);
      setCorrectAnswersCount(prev => prev + 1);

      // Scoring with speed bonus and level multiplier
      const timeBonus = Math.max(0, Math.round((timeLeft / currentLevelConfig.timeLimitPerQ) * 350));
      const comboBonus = (nextCombo - 1) * 100;
      const roundScore = Math.round((500 + timeBonus + comboBonus) * currentLevelConfig.scoreMultiplier);
      setScore(prev => prev + roundScore);

      if (nextCombo >= 3) {
        gameAudio.playCombo();
      } else {
        gameAudio.playSuccess();
      }
    } else {
      setCombo(0);
      gameAudio.playMistake();
    }

    // Check milestones for 25 or 50 questions
    const nextIdx = challengeIdx + 1;
    if (currentLevelConfig.questionCount >= 25) {
      if (nextIdx === Math.floor(currentLevelConfig.questionCount / 2)) {
        setMilestoneNotice('🔥 半程达成！心算手感全面激活！');
      } else if (nextIdx === currentLevelConfig.questionCount - 5) {
        setMilestoneNotice('⚡ 最后 5 题冲刺！保持心智护盾！');
      }
    }

    setGameState('revealed');
  };

  const handleNextChallengeQuestion = () => {
    gameAudio.playTap();
    if (challengeIdx < challengeQuestions.length - 1) {
      setChallengeIdx(prev => prev + 1);
      setSelectedOptionId(null);
      setTimeLeft(currentLevelConfig.timeLimitPerQ);
      questionStartTimeRef.current = Date.now();
      setGameState('playing');
    } else {
      finishChallengeGame();
    }
  };

  const finishChallengeGame = () => {
    const accuracy = Math.round((correctAnswersCount / challengeQuestions.length) * 100);
    const avgReaction = reactionTimes.length > 0
      ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
      : 2500;

    const baseXP = isFirstTime ? currentLevelConfig.xpReward * 1.2 : currentLevelConfig.xpReward;
    const calculatedXp = Math.round(baseXP + (accuracy >= 80 ? 20 : 0));

    // Map level to GameDifficulty for persistent storage
    const diffMap: Record<GameLevel, GameDifficulty> = {
      '初级': '低',
      '中级': '中',
      '高级': '高'
    };

    recordGameResult('first-impression', {
      score,
      accuracy,
      reactionTime: avgReaction,
      xpGained: calculatedXp,
      comboMax: maxCombo,
      conceptLearned: `极速估值心算 · ${level}（${challengeQuestions.length}题非重复通关）`,
      lawId: 'primacy-effect',
      difficulty: diffMap[level]
    });

    setGameState('debrief');
  };

  // Practice Mode Actions
  const handleVerifyPractice = () => {
    const q = currentPracticeQ;
    const diff = Math.abs(sliderValue - q.targetValue);
    const errorPercent = Math.round((diff / Math.max(0.1, q.targetValue)) * 100);

    setPracticeRecords(prev => ({
      ...prev,
      [q.id]: { estimate: sliderValue, errorPercent }
    }));

    if (errorPercent <= 15) {
      gameAudio.playSuccess();
    } else {
      gameAudio.playSelect();
    }

    setPracticeRevealed(true);
  };

  const handleSwitchPracticeQuestion = (newIdx: number) => {
    gameAudio.playTap();
    setPracticeIdx(newIdx);
    setSliderValue(MASTER_VALUATION_POOL[newIdx].sliderDefault);
    setPracticeRevealed(false);
  };

  const handleStepSlider = (delta: number) => {
    gameAudio.playTap();
    const q = currentPracticeQ;
    const nextVal = Math.min(q.sliderMax, Math.max(q.sliderMin, Number((sliderValue + delta).toFixed(2))));
    setSliderValue(nextVal);
  };

  const debriefData: DebriefData = {
    gameId: 'first-impression',
    gameTitle: `第一眼判断 · 极速估值心算 (${level} · ${challengeQuestions.length || currentLevelConfig.questionCount}题)`,
    numberPrefix: '01',
    difficulty: level === '高级' ? '高' : level === '中级' ? '中' : '低',
    score,
    accuracy: Math.round((correctAnswersCount / (challengeQuestions.length || 1)) * 100),
    isFirstTime,
    xpEarned: Math.round(currentLevelConfig.xpReward),
    bestAnswerReview:
      `成功完成【${level} · ${challengeQuestions.length}题】全量无重复估值心算！你的直觉已建立牢固防御：日费速乘还原总价，折上折在脑海中小数连乘，72法则一秒估算复利，随时以真实时薪校准机会成本。`,
    psychologicalMechanism:
      '首因效应与锚定效应（Anchoring & Adjustment）揭示人类直觉系统（System 1）极易被眼前微小的低日供或折上折字眼劫持；极速估值心算正是用极简的心智启发法（Mental Heuristics），瞬间打破直觉惰性，激活系统二的理性护盾。',
    actionableSummary: [
      '日费年化法：看到“每天仅需X元”，第一反应永远乘上 30 再乘月数，瞬间将微小水滴还原成真实总支出海啸。',
      '折率连乘法：面对折上折与满减叠加，五八四十直接算出实付折率，绝不让商家优惠字眼制造伪低价狂欢。',
      '72法则复利速算：遇到任何年化复利，拿 72 除以收益率首数（如 72 ÷ 8 = 9年），口算 1 秒知晓翻倍周期。'
    ]
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameMode === 'challenge') {
        if (gameState === 'playing' && currentChallengeQ) {
          const key = e.key.toUpperCase();
          const map: Record<string, number> = { '1': 0, '2': 1, '3': 2, '4': 3, 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
          if (map[key] !== undefined && currentChallengeQ.options[map[key]]) {
            handleSelectOption(currentChallengeQ.options[map[key]]);
          }
        } else if (gameState === 'revealed' && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleNextChallengeQuestion();
        }
      } else if (gameMode === 'practice') {
        if (e.key === 'Enter' && !practiceRevealed) {
          e.preventDefault();
          handleVerifyPractice();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameMode, gameState, currentChallengeQ, practiceRevealed, sliderValue]);

  // ==========================================
  // INTRO SCREEN
  // ==========================================
  if (gameState === 'intro') {
    return (
      <div className="flex flex-col items-center justify-start min-h-[85vh] w-full max-w-lg mx-auto py-3 px-2">
        <div className="w-full flex items-center justify-between mb-3">
          <button
            onClick={() => navigate('/games')}
            className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>返回竞技场</span>
          </button>
          <span className="text-xs font-mono font-bold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/30">
            GAME 01 · 极速估值
          </span>
        </div>

        {/* Hero Card with Obsidian Canvas & Gold Aesthetics */}
        <div className="w-full art-salon-canvas rounded-3xl p-6 sm:p-7 art-gold-border shadow-2xl space-y-5 relative overflow-hidden">
          {/* Subtle Ambient Radial Lighting */}
          <div className="absolute -top-24 -right-24 w-60 h-60 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-60 h-60 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />

          {/* Exclusive Luxury Game Icon (出圈神级黑金图标) */}
          <div className="relative mx-auto flex items-center justify-center pt-1">
            <FirstImpressionGameIcon size={88} glow={true} />
          </div>

          <div className="text-center space-y-1.5 relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>边学 · 边玩 · 边体验 · 破除首因锚定</span>
            </div>
            <h1 className="font-serif-editorial text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              01 · 第一眼判断
            </h1>
            <p className="art-gold-text text-sm sm:text-base font-semibold">
              极速估值心算 · 穿透商业假象
            </p>
            <p className="text-xs sm:text-[13px] text-stone-300 leading-relaxed max-w-sm mx-auto pt-0.5 font-serif-editorial">
              为什么“每天只要8.8元”会让人误以为免费？“5折再8折”到底等于几折？
              用 3 秒极速心算心法，瞬间穿透营销包装，算出真实底价！
            </p>
          </div>

          {/* Mode Selector Segmented Tabs */}
          <div className="p-1 rounded-2xl bg-black/40 border border-white/10 flex gap-1 relative z-10">
            <button
              onClick={() => {
                gameAudio.playTap();
                setGameMode('challenge');
              }}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                gameMode === 'challenge'
                  ? 'bg-amber-500 text-stone-950 shadow-md font-extrabold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>⚡ 极速对决模式</span>
            </button>
            <button
              onClick={() => {
                gameAudio.playTap();
                setGameMode('practice');
              }}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                gameMode === 'practice'
                  ? 'bg-amber-500 text-stone-950 shadow-md font-extrabold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>🎯 心算量感练习</span>
            </button>
          </div>

          {/* CHALLENGE MODE: 3 LEVEL TIERS (初级 5题, 中级 25题, 高级 50题) */}
          {gameMode === 'challenge' ? (
            <div className="space-y-4 pt-1 text-left relative z-10">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold text-stone-200">
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-amber-400" />
                    <span>选择挑战题量与等级：</span>
                  </span>
                  <span className="text-[11px] text-amber-300 font-mono">
                    每次重玩全量非重复 🎲
                  </span>
                </div>

                {/* Level Selection Cards Grid */}
                <div className="grid grid-cols-3 gap-2">
                  {(['初级', '中级', '高级'] as GameLevel[]).map((lvlKey) => {
                    const cfg = LEVEL_CONFIGS[lvlKey];
                    const isSelected = level === lvlKey;
                    return (
                      <button
                        key={lvlKey}
                        onClick={() => {
                          gameAudio.playTap();
                          setLevel(lvlKey);
                        }}
                        className={`p-3 rounded-2xl border text-center transition-all cursor-pointer relative ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-400 text-white shadow-lg shadow-amber-500/20 ring-1 ring-amber-400/50 scale-102'
                            : 'bg-white/[0.04] border-white/10 text-stone-400 hover:bg-white/[0.08] hover:text-stone-200'
                        }`}
                      >
                        <span className="block text-[11px] font-mono font-bold text-amber-400">
                          {cfg.badge}
                        </span>
                        <h4 className="text-xs sm:text-sm font-bold text-white mt-0.5">
                          {lvlKey}
                        </h4>
                        <span className="block text-[10px] text-stone-400 mt-1">
                          每题 {cfg.timeLimitPerQ}s
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected Tier Description */}
              <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-amber-500/25 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-300">{currentLevelConfig.name}</span>
                  <span className="text-[11px] font-mono font-bold text-amber-400">
                    +{currentLevelConfig.xpReward} XP 奖励 · {currentLevelConfig.scoreMultiplier}× 积分
                  </span>
                </div>
                <p className="text-xs text-stone-300 leading-relaxed font-sans">
                  {currentLevelConfig.description}
                </p>
              </div>

              <button
                onClick={() => startChallengeSession(level)}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-black text-sm shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <Sparkles className="w-4 h-4 text-stone-950" />
                <span>开启 {level} 挑战（{currentLevelConfig.questionCount} 题全量非重复）</span>
              </button>
            </div>
          ) : (
            /* PRACTICE MODE INTRO */
            <div className="space-y-4 pt-1 text-left relative z-10">
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-400/10 to-transparent border border-amber-500/30 space-y-1.5">
                <div className="flex items-center gap-1.5 text-amber-300 text-xs font-bold">
                  <Target className="w-4 h-4 text-amber-400" />
                  <span>零时间压力 · 拖拽滑块建立手感</span>
                </div>
                <p className="text-xs text-stone-300 leading-relaxed font-sans">
                  无倒计时逼迫！自由拖拽滑块直觉估算真实数值，立即对比你的估值与实际真值的差距，建立对金钱、时间、利率的敏锐心算量感。
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-stone-300">
                <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 flex items-center gap-2">
                  <Scale className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>双标尺误差即时核验</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 flex items-center gap-2">
                  <Compass className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>掌握3秒极速心算法门</span>
                </div>
              </div>

              <button
                onClick={() => startPracticeMode(0)}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-black text-sm shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <Sliders className="w-4 h-4 text-stone-950" />
                <span>进入滑块量感练习（涵盖全部商业与生活核心场景）</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // DEBRIEF SCREEN
  // ==========================================
  if (gameState === 'debrief') {
    return (
      <div className="py-4 px-2">
        <GameDebriefModal
          data={debriefData}
          onRestart={() => startChallengeSession(level)}
          onReturn={() => navigate('/games')}
        />
      </div>
    );
  }

  // ==========================================
  // PRACTICE MODE (SLIDER ESTIMATION)
  // ==========================================
  if (gameMode === 'practice') {
    const q = currentPracticeQ;
    const diff = Math.abs(sliderValue - q.targetValue);
    const errorPercent = Math.round((diff / Math.max(0.1, q.targetValue)) * 100);

    const range = q.sliderMax - q.sliderMin;
    const userPct = Math.max(0, Math.min(100, ((sliderValue - q.sliderMin) / range) * 100));
    const targetPct = Math.max(0, Math.min(100, ((q.targetValue - q.sliderMin) / range) * 100));
    const trapPct = Math.max(0, Math.min(100, ((q.intuitionTrapValue - q.sliderMin) / range) * 100));

    let tierBadge = { text: '神准量感', color: 'bg-amber-400 text-stone-950 border-amber-300', desc: '误差 ≤ 5%！直觉与数学高度统一，心算大师级量感！' };
    if (errorPercent > 30) {
      tierBadge = { text: '被锚定偏差', color: 'bg-rose-500/20 text-rose-300 border-rose-500/50', desc: '误差 > 30%！第一眼直觉被宣传锚点严重带偏，注意下方心算心法！' };
    } else if (errorPercent > 15) {
      tierBadge = { text: '良好量感', color: 'bg-blue-500/20 text-blue-300 border-blue-500/50', desc: '误差 15%~30%！大方向准确，稍微受了细微锚定影响。' };
    } else if (errorPercent > 5) {
      tierBadge = { text: '优秀手感', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50', desc: '误差 5%~15%！精准捕捉到了数量级核心，具备成熟的估值手感！' };
    }

    const practicedCount = Object.keys(practiceRecords).length;

    return (
      <div className="flex flex-col items-center justify-start min-h-[85vh] w-full max-w-lg mx-auto py-2 px-2 animate-smoothFadeIn space-y-4">
        {/* Practice Top HUD */}
        <div className="w-full flex items-center justify-between px-1">
          <button
            onClick={() => setGameState('intro')}
            className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>模式选择</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/30">
              🎯 心算量感练习
            </span>
            <button
              onClick={() => startChallengeSession(level)}
              className="text-[11px] font-bold text-stone-300 hover:text-amber-300 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/15 transition-all cursor-pointer"
            >
              切至挑战 ⚡
            </button>
          </div>
        </div>

        {/* Question Selector Carousel Pills */}
        <div className="w-full overflow-x-auto no-scrollbar flex items-center gap-1.5 py-1 px-0.5">
          {MASTER_VALUATION_POOL.map((item, idx) => {
            const isCurrent = idx === practiceIdx;
            const isDone = practiceRecords[item.id] !== undefined;
            return (
              <button
                key={item.id}
                onClick={() => handleSwitchPracticeQuestion(idx)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all cursor-pointer border ${
                  isCurrent
                    ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-md font-black scale-102'
                    : isDone
                    ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40'
                    : 'bg-black/30 text-stone-400 border-white/10 hover:text-stone-200'
                }`}
              >
                <span>#{idx + 1} {item.title.split('：')[0]}</span>
                {isDone && <span className="ml-1 text-[10px]">✓</span>}
              </button>
            );
          })}
        </div>

        {/* Main Practice Card */}
        <div className="w-full art-salon-canvas rounded-3xl p-5 sm:p-6 art-gold-border shadow-2xl space-y-5 relative overflow-hidden text-stone-100">
          <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Card Header: Category & Practice Status */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3 relative z-10">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-bold text-amber-300 bg-amber-500/15 px-2.5 py-0.5 rounded-lg border border-amber-500/30">
                SCENARIO #{practiceIdx + 1} / {MASTER_VALUATION_POOL.length}
              </span>
              <span className="text-[11px] font-medium text-stone-300">
                {q.category} · {q.title}
              </span>
            </div>

            <div className="text-[11px] text-stone-400 font-mono">
              已练习: {practicedCount}/{MASTER_VALUATION_POOL.length}
            </div>
          </div>

          {/* Slogan Hook */}
          <div className="p-4 sm:p-5 rounded-2xl bg-black/40 border border-amber-500/30 shadow-inner space-y-2 relative z-10">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
              <Eye className="w-4 h-4 text-amber-400" />
              <span>第一眼诱人噱头（商业宣传标语）</span>
            </div>
            <h2 className="text-base sm:text-lg font-serif-editorial font-bold text-white tracking-wide leading-snug">
              {q.hookSlogan}
            </h2>
          </div>

          {/* Practice Prompt */}
          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-amber-300 relative z-10">
            <Sliders className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{q.practicePrompt}：</span>
          </div>

          {/* Interactive Slider Section */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.04] border border-white/15 space-y-4 relative z-10">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-stone-400 font-medium">你的直觉估值：</span>
              <span className="font-numeric text-2xl sm:text-3xl font-extrabold art-gold-text">
                {q.formatValue(sliderValue)}
              </span>
            </div>

            {/* Slider */}
            <div className="space-y-1.5">
              <input
                type="range"
                min={q.sliderMin}
                max={q.sliderMax}
                step={q.sliderStep}
                value={sliderValue}
                onChange={(e) => {
                  setSliderValue(Number(e.target.value));
                  if (practiceRevealed) setPracticeRevealed(false);
                }}
                className="w-full accent-amber-400 cursor-pointer h-2.5 bg-stone-800 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-stone-400 font-numeric">
                <span>下限: {q.formatValue(q.sliderMin)}</span>
                <span>上限: {q.formatValue(q.sliderMax)}</span>
              </div>
            </div>

            {/* Stepper Buttons */}
            <div className="flex items-center justify-between gap-1.5 pt-1">
              <span className="text-[10px] text-stone-400">微调步长：</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleStepSlider(-q.sliderStep * 5)}
                  className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-mono text-stone-300 border border-white/10 transition-colors cursor-pointer"
                >
                  -5x
                </button>
                <button
                  onClick={() => handleStepSlider(-q.sliderStep)}
                  className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-mono text-stone-300 border border-white/10 transition-colors cursor-pointer"
                >
                  -{q.sliderStep}
                </button>
                <button
                  onClick={() => handleStepSlider(q.sliderStep)}
                  className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-mono text-stone-300 border border-white/10 transition-colors cursor-pointer"
                >
                  +{q.sliderStep}
                </button>
                <button
                  onClick={() => handleStepSlider(q.sliderStep * 5)}
                  className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-mono text-stone-300 border border-white/10 transition-colors cursor-pointer"
                >
                  +5x
                </button>
              </div>
            </div>

            {/* Verify Button */}
            {!practiceRevealed ? (
              <button
                onClick={handleVerifyPractice}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <Target className="w-4 h-4 text-stone-950" />
                <span>锁定估值 · 核对心算量感与真值差距</span>
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setPracticeRevealed(false)}
                  className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-stone-200 font-bold text-xs border border-white/15 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>微调滑块重测</span>
                </button>
                <button
                  onClick={() => handleSwitchPracticeQuestion((practiceIdx + 1) % MASTER_VALUATION_POOL.length)}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 text-stone-950 font-black text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>练习下一题</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* CALIBRATION ANALYSIS */}
          {practiceRevealed && (
            <div className="space-y-4 pt-2 border-t border-white/15 animate-smoothFadeIn relative z-10">
              <div className="p-4 rounded-2xl bg-black/40 border border-white/15 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${tierBadge.color}`}>
                      {tierBadge.text}
                    </span>
                    <span className="text-xs text-stone-300 font-medium">
                      误差率: <strong className="font-numeric text-amber-300">{errorPercent}%</strong>
                    </span>
                  </div>
                  <span className="text-[11px] text-stone-400">
                    {diff === 0 ? '完全一致！' : sliderValue > q.targetValue ? `高估了 ${q.formatValue(diff)}` : `低估了 ${q.formatValue(diff)}`}
                  </span>
                </div>

                <p className="text-xs text-stone-300 leading-relaxed font-sans">
                  {tierBadge.desc}
                </p>

                {/* Dual-Marker Comparison Track */}
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <div className="flex justify-between text-[10px] text-stone-400">
                    <span>数值分布标尺对比：</span>
                    <span className="text-stone-300 font-mono">
                      你的估算 vs 真实真值
                    </span>
                  </div>

                  <div className="relative w-full h-8 bg-stone-900/80 rounded-xl border border-white/10 flex items-center px-2">
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-rose-500/70 z-10"
                      style={{ left: `${trapPct}%` }}
                    />
                    <div
                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-amber-400 shadow-md shadow-amber-500/50 z-20 flex items-center justify-center text-[9px] font-bold text-stone-950"
                      style={{ left: `${userPct}%` }}
                    >
                      你
                    </div>
                    <div
                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-emerald-400 shadow-md shadow-emerald-500/50 z-20 flex items-center justify-center text-[9px] font-bold text-stone-950"
                      style={{ left: `${targetPct}%` }}
                    >
                      真
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between text-[10px] pt-1">
                    <span className="flex items-center gap-1 text-amber-300">
                      <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                      你的估算: {q.formatValue(sliderValue)}
                    </span>
                    <span className="flex items-center gap-1 text-emerald-300 font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                      实际真值: {q.formatValue(q.targetValue)}
                    </span>
                    <span className="flex items-center gap-1 text-rose-400">
                      <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                      直觉锚点: {q.formatValue(q.intuitionTrapValue)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Cognitive Breakdown */}
              <div className="space-y-2.5 text-xs">
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-300">
                    <Eye className="w-3.5 h-3.5" />
                    <span>👁️ 大众第一眼直觉为什么会偏？</span>
                  </div>
                  <p className="text-stone-300 leading-relaxed font-sans">
                    {q.system1Trap}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-stone-200">
                    <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                    <span>💎 数学底层真值推导：</span>
                  </div>
                  <p className="text-stone-300 leading-relaxed font-sans">
                    {q.mathTruth}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-amber-400/15 to-transparent border border-amber-400/40 space-y-1 shadow-md">
                  <div className="flex items-center gap-1.5 font-black text-amber-300">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span className="tracking-wide">⚡【3秒极速心算妙招 · 建立量感】：</span>
                  </div>
                  <p className="text-amber-100 font-medium leading-relaxed font-sans">
                    {q.mentalShortcut}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // CHALLENGE MODE RENDER (5, 25, OR 50 QUESTIONS)
  // ==========================================
  const currentQ = currentChallengeQ;
  const progressPercent = Math.max(0, Math.min(100, (timeLeft / currentLevelConfig.timeLimitPerQ) * 100));
  const isTimeCritical = timeLeft <= 3;
  const overallProgressPct = Math.round(((challengeIdx + 1) / challengeQuestions.length) * 100);

  return (
    <div className="flex flex-col items-center justify-start min-h-[85vh] w-full max-w-lg mx-auto py-2 px-2 animate-smoothFadeIn space-y-3.5">
      {/* Top HUD with Game Icon */}
      <div className="w-full flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <FirstImpressionGameIcon size={32} glow={false} />
          <div>
            <h3 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
              <span>01 · 第一眼判断</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-amber-50 text-amber-800 border border-amber-300">
                {level} ({challengeQuestions.length}题)
              </span>
            </h3>
            <p className="text-[10px] text-stone-500 font-mono">
              第 {challengeIdx + 1} / {challengeQuestions.length} 关 · {overallProgressPct}%
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right">
            <span className="text-[10px] text-stone-400 block font-mono">积分</span>
            <span className="font-numeric font-extrabold text-amber-600 text-sm">
              {score.toLocaleString()}
            </span>
          </div>

          <button
            onClick={() => setGameState('intro')}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
            title="退出本局"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Game Stage Card */}
      {currentQ && (
        <div className="w-full art-salon-canvas rounded-3xl p-5 sm:p-6 art-gold-border shadow-2xl space-y-4 relative overflow-hidden text-stone-100">
          <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Top Status Bar */}
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5 relative z-10">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-bold text-amber-300 bg-amber-500/15 px-2.5 py-0.5 rounded-lg border border-amber-500/30">
                #{challengeIdx + 1} / {challengeQuestions.length}
              </span>
              <span className="text-[11px] font-medium text-stone-300">
                {currentQ.category}
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              {combo >= 2 && (
                <div className="flex items-center gap-1 text-xs font-black text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/40 animate-pulse">
                  <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>Combo x{combo}</span>
                </div>
              )}

              <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-numeric font-bold border transition-colors ${
                isTimeCritical
                  ? 'bg-rose-500/20 border-rose-500 text-rose-400 animate-pulse'
                  : 'bg-white/[0.06] border-white/15 text-amber-300'
              }`}>
                <Timer className="w-3.5 h-3.5" />
                <span>{timeLeft}s</span>
              </div>
            </div>
          </div>

          {/* Dynamic Countdown Gauge Bar */}
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden relative z-10">
            <div
              className={`h-full transition-all duration-300 ease-linear rounded-full ${
                isTimeCritical
                  ? 'bg-gradient-to-r from-rose-500 to-amber-500'
                  : 'bg-gradient-to-r from-amber-400 to-amber-200'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Milestone Toast Notice */}
          {milestoneNotice && (
            <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-400/50 text-center text-xs font-bold text-amber-300 animate-pulse relative z-10">
              {milestoneNotice}
            </div>
          )}

          {/* Scenario Headline Presentation */}
          <div className="space-y-2.5 relative z-10">
            <div className="p-4 sm:p-5 rounded-2xl bg-black/40 border border-amber-500/30 shadow-inner space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                <Eye className="w-4 h-4 text-amber-400" />
                <span>第一眼诱人噱头（商业宣传标语）</span>
              </div>
              <h2 className="text-base sm:text-lg font-serif-editorial font-bold text-white tracking-wide leading-snug">
                {currentQ.hookSlogan}
              </h2>
            </div>

            <div className="flex items-center gap-2 pt-0.5 text-xs sm:text-sm font-bold text-amber-300">
              <Calculator className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{currentQ.question}</span>
            </div>
          </div>

          {/* Option Buttons Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 relative z-10">
            {currentQ.options.map((option, idx) => {
              const keyLabel = ['A', 'B', 'C', 'D'][idx];
              const isSelected = selectedOptionId === option.id;
              const isRevealed = gameState === 'revealed';

              let btnStyle = 'bg-white/[0.05] hover:bg-white/[0.09] border-white/15 text-stone-200';

              if (isRevealed) {
                if (option.isCorrect) {
                  btnStyle = 'bg-emerald-950/70 border-emerald-400 text-emerald-200 ring-2 ring-emerald-500/40 shadow-lg shadow-emerald-900/30';
                } else if (isSelected && !option.isCorrect) {
                  btnStyle = 'bg-rose-950/70 border-rose-500 text-rose-200 ring-2 ring-rose-500/40';
                } else if (option.isIntuitionTrap) {
                  btnStyle = 'bg-amber-950/40 border-amber-500/40 text-amber-300/80';
                } else {
                  btnStyle = 'bg-black/20 border-white/5 text-stone-500 opacity-60';
                }
              }

              return (
                <button
                  key={option.id}
                  disabled={isRevealed}
                  onClick={() => handleSelectOption(option)}
                  className={`p-3.5 rounded-2xl border text-left transition-all relative cursor-pointer active:scale-98 flex items-start gap-2.5 ${btnStyle}`}
                >
                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-mono font-bold shrink-0 ${
                    isRevealed && option.isCorrect
                      ? 'bg-emerald-500 text-stone-950'
                      : isRevealed && isSelected && !option.isCorrect
                      ? 'bg-rose-500 text-white'
                      : 'bg-white/10 text-amber-300'
                  }`}>
                    {keyLabel}
                  </span>

                  <div className="flex-1 text-xs sm:text-[13px] leading-snug">
                    <span>{option.text}</span>
                    {isRevealed && option.isIntuitionTrap && (
                      <span className="block mt-1 text-[10px] text-amber-400 font-semibold">
                        ⚠️ 大众直觉最常中招的锚定陷阱
                      </span>
                    )}
                  </div>

                  {isRevealed && option.isCorrect && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 self-center" />
                  )}
                  {isRevealed && isSelected && !option.isCorrect && (
                    <XCircle className="w-5 h-5 text-rose-400 shrink-0 self-center" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Reveal & Mental Math Shortcut Card */}
          {gameState === 'revealed' && (
            <div className="space-y-3.5 pt-2 border-t border-white/15 animate-smoothFadeIn relative z-10">
              <div className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                selectedOptionId === currentQ.options.find(o => o.isCorrect)?.id
                  ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-300'
                  : 'bg-rose-500/15 border-rose-400/40 text-rose-300'
              }`}>
                <div className="flex items-center gap-2 text-xs font-bold">
                  {selectedOptionId === currentQ.options.find(o => o.isCorrect)?.id ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>估值精准！穿透第一眼错觉（+{Math.round((500 + (timeLeft / currentLevelConfig.timeLimitPerQ) * 350) * currentLevelConfig.scoreMultiplier)} 分）</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-rose-400" />
                      <span>直觉被锚定劫持！请看下方极速心算法门</span>
                    </>
                  )}
                </div>
                <span className="text-[11px] text-stone-400 font-mono">
                  耗时 {((currentLevelConfig.timeLimitPerQ - timeLeft)).toFixed(1)}s
                </span>
              </div>

              {/* 3-Point Breakdown */}
              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-300">
                    <Eye className="w-3.5 h-3.5" />
                    <span>👁️ 大众第一眼错觉（直觉陷阱）：</span>
                  </div>
                  <p className="text-stone-300 leading-relaxed font-sans">
                    {currentQ.system1Trap}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-stone-200">
                    <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                    <span>💎 数学真实底价（底层逻辑）：</span>
                  </div>
                  <p className="text-stone-300 leading-relaxed font-sans">
                    {currentQ.mathTruth}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-amber-400/15 to-transparent border border-amber-400/40 space-y-1 shadow-md">
                  <div className="flex items-center gap-1.5 font-black text-amber-300">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span className="tracking-wide">⚡【3秒极速心算妙招 · 边玩边学】：</span>
                  </div>
                  <p className="text-amber-100 font-medium leading-relaxed font-sans">
                    {currentQ.mentalShortcut}
                  </p>
                </div>
              </div>

              {/* Next / Finish Button */}
              <button
                onClick={handleNextChallengeQuestion}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-black text-xs sm:text-sm shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <span>
                  {challengeIdx < challengeQuestions.length - 1
                    ? `进入第 ${challengeIdx + 2} / ${challengeQuestions.length} 题（按 Enter 或空格键继续）`
                    : '完成全部心算挑战 · 查阅心智研报 🏆'}
                </span>
                <ArrowRight className="w-4 h-4 text-stone-950" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

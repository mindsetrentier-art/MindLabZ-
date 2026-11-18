import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Heart,
  Shuffle,
  Sparkles,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  Bookmark,
  Flame,
  ShieldCheck,
  Globe,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { GameDifficulty, DIFFICULTY_CONFIGS, DIFFICULTY_LIST } from '../../data/difficulty';
import { LoveDomainId } from '../../types';
import { LOVE_DOMAINS } from '../../data/lovePsychologyTypes';
import {
  AleatoricLoveQuestion,
  drawAleatoricLoveQuestions,
  getAleatoricStats,
  resetAleatoricDeck,
} from '../../utils/aleatoricEngine';
import { DifficultySelector } from './DifficultySelector';
import { GameHeaderHud } from './GameHeaderHud';
import { GameDebriefModal, DebriefData } from './GameDebriefModal';
import { gameAudio } from '../../utils/gameAudio';

const ROUND_SIZE = 12;

export const LoveAleatoricArenaGame: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, recordGameResult, updateLawMastery, isBookmarked, toggleBookmark } = useApp();

  const urlDiff = searchParams.get('difficulty') as GameDifficulty | null;
  const savedDiff = (() => {
    try {
      const val = localStorage.getItem('mindlabz_arena_difficulty') as GameDifficulty | null;
      return val && DIFFICULTY_LIST.includes(val) ? val : null;
    } catch {
      return null;
    }
  })();

  const initialDiff: GameDifficulty =
    urlDiff && DIFFICULTY_LIST.includes(urlDiff) ? urlDiff : savedDiff || '中';

  const [difficulty, setDifficulty] = useState<GameDifficulty>(initialDiff);
  const [selectedDomain, setSelectedDomain] = useState<LoveDomainId | 'all'>('all');
  const [phase, setPhase] = useState<'intro' | 'playing' | 'debrief'>('intro');

  const [questions, setQuestions] = useState<AleatoricLoveQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(25);
  const [deckStats, setDeckStats] = useState(() => getAleatoricStats());

  const reactionStartRef = useRef<number>(Date.now());
  const reactionTimesRef = useRef<number[]>([]);

  const diffConfig = DIFFICULTY_CONFIGS[difficulty];
  const isFirstTime = !(user.completedGames?.includes('love-aleatoric-arena'));

  const secondsPerQuestion =
    difficulty === '低' ? 35 : difficulty === '中' ? 28 : difficulty === '高' ? 22 : 16;

  const startSession = (overrideDiff: GameDifficulty = difficulty) => {
    gameAudio.playSuccess();
    const drawn = drawAleatoricLoveQuestions(ROUND_SIZE, {
      domainFilter: selectedDomain,
      arenaDifficulty: overrideDiff,
    });
    setQuestions(drawn);
    setCurrentIdx(0);
    setSelectedOpt(null);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setCorrectCount(0);
    setTimeLeft(secondsPerQuestion);
    reactionTimesRef.current = [];
    reactionStartRef.current = Date.now();
    setDeckStats(getAleatoricStats());
    setPhase('playing');
  };

  // Countdown tick during unanswered playing state
  useEffect(() => {
    if (phase !== 'playing' || selectedOpt !== null || questions.length === 0) {
      return;
    }
    const timer = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [phase, selectedOpt, currentIdx, questions.length]);

  // Handle timeout gracefully
  useEffect(() => {
    if (phase === 'playing' && timeLeft === 0 && selectedOpt === null && questions[currentIdx]) {
      gameAudio.playTap();
      setSelectedOpt(-1);
      setCombo(0);
    }
  }, [phase, timeLeft, selectedOpt, currentIdx, questions]);

  const currentQuestion = questions[currentIdx];

  const handleSelectOption = (optIdx: number) => {
    if (selectedOpt !== null || !currentQuestion) return;

    const elapsed = Math.max(250, Date.now() - reactionStartRef.current);
    reactionTimesRef.current.push(elapsed);
    setSelectedOpt(optIdx);

    const isCorrect = optIdx === currentQuestion.correctAnswer;
    const currentMastery = (user?.lawMasteryMap && user.lawMasteryMap[currentQuestion.law.id]) || 0;

    if (isCorrect) {
      gameAudio.playSuccess();
      const nextCombo = combo + 1;
      setCombo(nextCombo);
      setMaxCombo((prev) => Math.max(prev, nextCombo));
      setCorrectCount((prev) => prev + 1);

      const speedBonus = Math.round(timeLeft * 8);
      const comboBonus = nextCombo * 45;
      const pts = Math.round((240 + speedBonus + comboBonus) * diffConfig.scoreMultiplier);
      setScore((prev) => prev + pts);
      updateLawMastery(currentQuestion.law.id, Math.min(100, currentMastery + 25));
    } else {
      gameAudio.playTap();
      setCombo(0);
      updateLawMastery(currentQuestion.law.id, Math.min(100, currentMastery + 8));
    }
  };

  const handleNext = () => {
    gameAudio.playTap();
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
      setSelectedOpt(null);
      setTimeLeft(secondsPerQuestion);
      reactionStartRef.current = Date.now();
    } else {
      const accuracy = Math.round((correctCount / Math.max(1, questions.length)) * 100);
      const avgRt =
        reactionTimesRef.current.length > 0
          ? Math.round(
              reactionTimesRef.current.reduce((a, b) => a + b, 0) /
                reactionTimesRef.current.length
            )
          : 1200;
      const calculatedXp = isFirstTime
        ? Math.round((45 + Math.round(accuracy * 0.2)) * diffConfig.xpMultiplier)
        : Math.round(14 * diffConfig.xpMultiplier);

      recordGameResult('love-aleatoric-arena', {
        score,
        accuracy,
        reactionTime: avgRt,
        xpGained: calculatedXp,
        comboMax: maxCombo,
        conceptLearned: '696 条爱情心理学 · 零重复极致随机博弈',
        lawId: questions[0]?.law.id,
        difficulty,
      });

      setDeckStats(getAleatoricStats());
      setPhase('debrief');
    }
  };

  const handleResetDeck = () => {
    gameAudio.playTap();
    resetAleatoricDeck();
    setDeckStats(getAleatoricStats());
  };

  const accuracyPct =
    questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;

  const debriefData: DebriefData = {
    gameId: 'love-aleatoric-arena',
    gameTitle: '爱情心理学极速博弈',
    numberPrefix: '11',
    difficulty,
    score,
    accuracy: accuracyPct,
    isFirstTime,
    xpEarned: isFirstTime
      ? Math.round((45 + Math.round(accuracyPct * 0.2)) * diffConfig.xpMultiplier)
      : Math.round(14 * diffConfig.xpMultiplier),
    bestAnswerReview:
      '本局所有 12 道考题均由 CSPRNG 加密洗牌盒从 696 条爱情心理学词条 × 6 种思辨视角（共计 4,176 题卡）中实时抽选，已永久记入跨局防重复追踪队列，下一次开局绝不出现相同题卡。',
    psychologicalMechanism:
      '亲密关系决策容易滑向“浪漫投射”、“情绪启发”与“认知确认偏误”。通过跨场景随机变式训练，大脑能在无预设提示下敏锐分辨吸引机制、健康边界、冲突修复与控制预警信号。',
    actionableSummary: [
      `本轮已累积破译 ${deckStats.seenEncountersCount} / ${deckStats.totalUniqueEncounters} 张独特随机题卡。`,
      '亲密中的健康原则：理解心理模式是为了觉察自身需要与关系动向，而非贴标签或操控伴侣。',
      '遇到心仪或高难条目时可随时点击书签图标，直接收纳入个人定律收藏库复盘。',
    ],
  };

  if (phase === 'intro') {
    return (
      <div className="flex flex-col items-center justify-start min-h-[85vh] w-full max-w-2xl mx-auto py-4 px-2">
        <div className="w-full flex items-center justify-between mb-4">
          <button
            onClick={() => navigate('/games')}
            type="button"
            className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>返回竞技场</span>
          </button>
          <span className="text-xs font-mono font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
            GAME 11 · ALEATORIC 4,176 DECK
          </span>
        </div>

        <div className="w-full game-arcade-card rounded-3xl p-6 sm:p-8 border-rose-200/90 shadow-xl space-y-6 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-gradient-to-br from-rose-500/25 to-purple-600/20 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-56 h-56 rounded-full bg-gradient-to-tr from-amber-500/20 to-rose-400/20 blur-2xl pointer-events-none" />

          <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-rose-600 via-pink-600 to-amber-500 shadow-lg shadow-rose-500/30 animate-pulseGlow" />
            <Heart className="w-10 h-10 text-white fill-white/90 relative z-10" />
          </div>

          <div className="text-center space-y-2 relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-rose-800 bg-rose-50 border border-rose-200">
              <Shuffle className="w-3.5 h-3.5" />
              <span>极致 Aleatoric 零重复随机引擎 · 696 词条 × 6 变式</span>
            </div>
            <h1 className="font-serif-editorial text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
              爱情心理学极速博弈 · 全随机竞技场
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-lg mx-auto">
              每次进入自动启动 CSPRNG 真随机洗牌盒与跨局记忆屏蔽机制——同一张题卡绝不重复出现，近 60 题冷却锁确保同一词条也不连环撞题。
            </p>
          </div>

          {/* Live Anti-Repeat Deck Telemetry */}
          <div className="grid grid-cols-3 gap-2.5 text-center text-xs bg-stone-50/90 p-3.5 rounded-2xl border border-stone-200/80 relative z-10">
            <div>
              <span className="text-[10px] text-stone-500 block">总不重复题卡池</span>
              <strong className="font-numeric text-base font-black text-stone-900">
                {deckStats.totalUniqueEncounters.toLocaleString()} 张
              </strong>
            </div>
            <div>
              <span className="text-[10px] text-stone-500 block">已探索唯一题卡</span>
              <strong className="font-numeric text-base font-black text-rose-700">
                {deckStats.seenEncountersCount.toLocaleString()} 张
              </strong>
            </div>
            <div>
              <span className="text-[10px] text-stone-500 block">已覆盖定律词条</span>
              <strong className="font-numeric text-base font-black text-emerald-700">
                {deckStats.uniqueConceptsExplored} / {deckStats.totalConcepts}
              </strong>
            </div>
          </div>

          {/* 7 Domain Filter Selection */}
          <div className="space-y-2 pt-1 relative z-10">
            <div className="flex items-center justify-between text-xs font-bold text-stone-800">
              <span>选择随机抽题专题域：</span>
              {deckStats.seenEncountersCount > 0 && (
                <button
                  type="button"
                  onClick={handleResetDeck}
                  className="text-[11px] font-semibold text-stone-500 hover:text-stone-900 flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>重置洗牌记忆盒</span>
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => {
                  gameAudio.playTap();
                  setSelectedDomain('all');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  selectedDomain === 'all'
                    ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                    : 'bg-white text-stone-700 border-stone-200 hover:border-stone-400'
                }`}
              >
                全库 696 条融合乱斗
              </button>
              {LOVE_DOMAINS.map((dom) => (
                <button
                  key={dom.id}
                  type="button"
                  onClick={() => {
                    gameAudio.playTap();
                    setSelectedDomain(dom.id);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    selectedDomain === dom.id
                      ? 'bg-rose-700 text-white border-rose-700 shadow-xs'
                      : 'bg-white text-stone-700 border-stone-200 hover:border-stone-400'
                  }`}
                >
                  {dom.shortTitle}
                </button>
              ))}
            </div>
          </div>

          {/* Arena Difficulty Selector */}
          <div className="space-y-2 pt-2 border-t border-stone-200/60 text-left relative z-10">
            <div className="flex justify-between items-center text-xs font-bold text-stone-800">
              <span>选择竞技场难度：</span>
              <span className="text-rose-600 font-numeric">{diffConfig.multiplierText} 积分收益</span>
            </div>
            <DifficultySelector value={difficulty} onChange={setDifficulty} />
          </div>

          <button
            onClick={() => startSession(difficulty)}
            type="button"
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-600 via-pink-600 to-amber-600 hover:brightness-110 text-white font-bold text-sm shadow-lg shadow-rose-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 relative z-10 game-btn-tactile"
          >
            <Shuffle className="w-4 h-4 text-white" />
            <span>
              随机抽取 {ROUND_SIZE} 道全新不重复考题（{difficulty}难度）
            </span>
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'debrief') {
    return (
      <div className="max-w-2xl mx-auto py-4 px-2 space-y-4">
        <GameDebriefModal
          data={debriefData}
          onRestart={() => startSession(difficulty)}
          onReturn={() => navigate('/games')}
        />
      </div>
    );
  }

  if (!currentQuestion) {
    return null;
  }

  const bookmarked = isBookmarked(currentQuestion.law.id);
  const isAnswered = selectedOpt !== null;
  const isCorrect = selectedOpt === currentQuestion.correctAnswer;

  return (
    <div className="max-w-3xl mx-auto py-3 px-2 space-y-4">
      <GameHeaderHud
        title="爱情心理学 · 全随机零重复竞技场"
        numberPrefix="11"
        difficulty={difficulty}
        score={score}
        combo={combo}
        timeLeft={timeLeft}
        currentRound={currentIdx + 1}
        totalRounds={questions.length}
        onExit={() => setPhase('intro')}
        accentColor="#E11D48"
      />

      <div className="editorial-card rounded-3xl p-5 sm:p-8 space-y-5 border border-stone-200/90 shadow-lg">
        {/* Top Meta Bar: Template Variant, Code, City, Bookmark */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-200/70 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="px-2.5 py-1 rounded-lg bg-stone-900 text-amber-300 font-bold font-mono text-[11px]">
              {currentQuestion.law.codeId || 'LOVE'}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 font-bold text-[11px]">
              {currentQuestion.templateLabel}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-stone-100 text-stone-700 font-semibold text-[11px]">
              {currentQuestion.contextTag}
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 text-amber-800 text-[11px] font-medium">
              <Globe className="w-3 h-3" />
              {currentQuestion.assignedCityZh.split(' ')[0]}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {combo >= 2 && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-100 text-amber-900 font-bold text-[11px]">
                <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
                {combo} 连击
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                gameAudio.playTap();
                toggleBookmark(currentQuestion.law.id);
              }}
              className="p-2 rounded-xl border border-stone-200 hover:border-stone-400 bg-white text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
              title="收藏此条爱情心理学定律"
            >
              <Bookmark
                className={`w-4 h-4 ${bookmarked ? 'fill-amber-500 text-amber-500' : ''}`}
              />
            </button>
          </div>
        </div>

        {/* Question Prompt (scaled by .quiz-font-scope via .quiz-title-text) */}
        <h2 className="quiz-title-text font-serif-editorial font-bold text-stone-900 leading-relaxed">
          {currentQuestion.prompt}
        </h2>

        {/* Shuffled 4 Options */}
        <div className="space-y-3">
          {currentQuestion.options.map((optText, idx) => {
            const letter = ['A', 'B', 'C', 'D'][idx];
            const isSelected = selectedOpt === idx;
            const isTargetCorrect = idx === currentQuestion.correctAnswer;

            let cardStyle =
              'bg-white border-stone-200 hover:border-rose-400 hover:bg-rose-50/30 text-stone-800';
            if (isAnswered) {
              if (isTargetCorrect) {
                cardStyle = 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-2 ring-emerald-500/20';
              } else if (isSelected) {
                cardStyle = 'bg-rose-50 border-rose-500 text-rose-950';
              } else {
                cardStyle = 'bg-stone-50/70 border-stone-200/70 text-stone-400';
              }
            }

            return (
              <button
                key={`${currentQuestion.encounterKey}-opt-${idx}`}
                type="button"
                disabled={isAnswered}
                onClick={() => handleSelectOption(idx)}
                className={`w-full text-left p-4 sm:p-5 rounded-2xl border-2 transition-all flex items-start gap-3.5 cursor-pointer disabled:cursor-default ${cardStyle}`}
              >
                <span
                  className={`w-7 h-7 rounded-lg font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 ${
                    isAnswered && isTargetCorrect
                      ? 'bg-emerald-600 text-white'
                      : isAnswered && isSelected
                      ? 'bg-rose-600 text-white'
                      : 'bg-stone-100 text-stone-700'
                  }`}
                >
                  {letter}
                </span>
                <span className="quiz-option-text flex-1 font-medium leading-relaxed">
                  {optText}
                </span>
                {isAnswered && isTargetCorrect && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                )}
                {isAnswered && isSelected && !isTargetCorrect && (
                  <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                )}
              </button>
            );
          })}
        </div>

        {/* Immediate Debrief & Boundary Guidance */}
        {isAnswered && (
          <div className="rounded-2xl p-4 sm:p-5 bg-stone-900 text-white space-y-3 animate-fadeIn">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span
                className={`font-bold flex items-center gap-1.5 ${
                  selectedOpt === -1
                    ? 'text-amber-300'
                    : isCorrect
                    ? 'text-emerald-300'
                    : 'text-rose-300'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  {selectedOpt === -1
                    ? '超时！解析已展开'
                    : isCorrect
                    ? '判断精准！已累加掌握度'
                    : '触发误区校准'}
                </span>
              </span>
              <span className="text-stone-400 font-mono text-[11px]">
                {currentQuestion.law.nameZh} · {currentQuestion.law.nameEn}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-stone-200 leading-relaxed">
              {currentQuestion.explanation}
            </p>

            <div className="rounded-xl bg-white/10 border border-white/15 p-3 text-xs text-amber-200 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
              <div>
                <strong className="text-amber-300">健康边界提示：</strong>
                <span>{currentQuestion.healthyBoundary}</span>
              </div>
            </div>

            <div className="flex items-center justify-end pt-1">
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-110 text-stone-950 font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer shadow-md"
              >
                <span>{currentIdx < questions.length - 1 ? '抽取下一张全新题卡' : '查看本局防重复战报'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

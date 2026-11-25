import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Shuffle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  Bookmark,
  Flame,
  ShieldCheck,
  Layers,
  Heart,
  Compass,
  BookOpen,
  Keyboard,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { GameDifficulty, DIFFICULTY_CONFIGS, DIFFICULTY_LIST } from '../../data/difficulty';
import {
  LOVE100_PSYCHOLOGY_LAWS,
  LOVE100_PILLARS,
  LOVE100_CATEGORIES,
  LOVE100_CONTEXTS,
  LOVE100_PSYCHOLOGY_NOTE,
} from '../../data/love100PsychologyLaws';
import {
  AleatoricLove100Question,
  drawAleatoricLove100Questions,
  getLove100AleatoricStats,
  resetLove100AleatoricDeck,
} from '../../utils/aleatoricEngine';
import { DifficultySelector } from './DifficultySelector';
import { GameHeaderHud } from './GameHeaderHud';
import { GameDebriefModal, DebriefData } from './GameDebriefModal';
import { gameAudio } from '../../utils/gameAudio';

const ROUND_SIZE = 10;

export const Love100AleatoricArenaGame: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, recordGameResult, updateLawMastery, isBookmarked, toggleBookmark } = useApp();

  const urlDiff = searchParams.get('difficulty') as GameDifficulty | null;
  const urlPillar = searchParams.get('pillar');
  const urlContext = searchParams.get('context');
  const urlCategory = searchParams.get('category');

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
  const [selectedPillar, setSelectedPillar] = useState<string>(urlPillar || 'all');
  const [selectedContext, setSelectedContext] = useState<string>(urlContext || 'all');
  const [selectedCategory, setSelectedCategory] = useState<string>(urlCategory || 'all');
  const [phase, setPhase] = useState<'intro' | 'playing' | 'debrief'>('intro');

  const [questions, setQuestions] = useState<AleatoricLove100Question[]>([]);
  const [questionOutcomes, setQuestionOutcomes] = useState<Array<'correct' | 'wrong' | 'timeout'>>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(28);
  const [deckStats, setDeckStats] = useState(() => getLove100AleatoricStats());

  const reactionStartRef = useRef<number>(Date.now());
  const reactionTimesRef = useRef<number[]>([]);

  const diffConfig = DIFFICULTY_CONFIGS[difficulty];
  const isFirstTime = !(user.completedGames?.includes('love100-aleatoric-arena'));

  const secondsPerQuestion =
    difficulty === '低' ? 36 : difficulty === '中' ? 28 : difficulty === '高' ? 22 : 16;

  const visibleCategories = useMemo(
    () =>
      selectedPillar === 'all'
        ? LOVE100_CATEGORIES
        : LOVE100_CATEGORIES.filter((cat) => cat.pillarId === selectedPillar),
    [selectedPillar]
  );

  const matchingConceptCount = useMemo(() => {
    return LOVE100_PSYCHOLOGY_LAWS.filter((law) => {
      if (selectedPillar !== 'all' && law.love100Pillar !== selectedPillar) return false;
      if (selectedContext !== 'all' && law.love100Context !== selectedContext) return false;
      if (selectedCategory !== 'all' && law.love100Category !== selectedCategory) return false;
      return true;
    }).length;
  }, [selectedPillar, selectedContext, selectedCategory]);

  const masteryMap = user.lawMasteryMap || {};

  const startSession = (overrideDiff: GameDifficulty = difficulty) => {
    gameAudio.playSuccess();
    const drawn = drawAleatoricLove100Questions(ROUND_SIZE, {
      pillarFilter: selectedPillar,
      contextFilter: selectedContext,
      categoryFilter: selectedCategory,
      arenaDifficulty: overrideDiff,
    });
    setQuestions(drawn);
    setQuestionOutcomes([]);
    setCurrentIdx(0);
    setSelectedOpt(null);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setCorrectCount(0);
    setTimeLeft(secondsPerQuestion);
    reactionTimesRef.current = [];
    reactionStartRef.current = Date.now();
    setDeckStats(getLove100AleatoricStats());
    setPhase('playing');
  };

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

  useEffect(() => {
    if (phase === 'playing' && timeLeft === 0 && selectedOpt === null && questions[currentIdx]) {
      gameAudio.playTap();
      setSelectedOpt(-1);
      setCombo(0);
      setQuestionOutcomes((prev) => {
        const next = [...prev];
        next[currentIdx] = 'timeout';
        return next;
      });
    }
  }, [phase, timeLeft, selectedOpt, currentIdx, questions]);

  const currentQuestion = questions[currentIdx];

  const handleSelectOption = useCallback(
    (optIdx: number) => {
      if (selectedOpt !== null || !currentQuestion) return;

      const elapsed = Math.max(250, Date.now() - reactionStartRef.current);
      reactionTimesRef.current.push(elapsed);
      setSelectedOpt(optIdx);

      const isCorrect = optIdx === currentQuestion.correctAnswer;
      const currentMastery = (user?.lawMasteryMap && user.lawMasteryMap[currentQuestion.law.id]) || 0;

      setQuestionOutcomes((prev) => {
        const next = [...prev];
        next[currentIdx] = isCorrect ? 'correct' : 'wrong';
        return next;
      });

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
    },
    [selectedOpt, currentQuestion, user?.lawMasteryMap, currentIdx, combo, timeLeft, diffConfig.scoreMultiplier, updateLawMastery]
  );

  const handleNext = useCallback(() => {
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

      recordGameResult('love100-aleatoric-arena', {
        score,
        accuracy,
        reactionTime: avgRt,
        xpGained: calculatedXp,
        comboMax: maxCombo,
        conceptLearned: '100 条恋爱心理学核心理论、依恋沟通与亲密关系安全边界 · CSPRNG 零重复博弈',
        lawId: questions[0]?.law.id,
        difficulty,
      });

      setDeckStats(getLove100AleatoricStats());
      setPhase('debrief');
    }
  }, [currentIdx, questions, secondsPerQuestion, correctCount, isFirstTime, diffConfig.xpMultiplier, recordGameResult, score, maxCombo, difficulty]);

  useEffect(() => {
    if (phase !== 'playing' || !currentQuestion) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const key = e.key.toLowerCase();
      if (selectedOpt === null) {
        const keyMap: Record<string, number> = {
          '1': 0,
          '2': 1,
          '3': 2,
          '4': 3,
          a: 0,
          b: 1,
          c: 2,
          d: 3,
        };
        const idx = keyMap[key];
        if (idx !== undefined && idx < currentQuestion.options.length) {
          e.preventDefault();
          handleSelectOption(idx);
        }
      } else if (e.key === 'Enter' || e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [phase, currentQuestion, selectedOpt, handleSelectOption, handleNext]);

  const handleResetDeck = () => {
    gameAudio.playTap();
    resetLove100AleatoricDeck();
    setDeckStats(getLove100AleatoricStats());
  };

  const librarySyncUrl = useMemo(() => {
    const params = new URLSearchParams({ mode: 'love100' });
    if (selectedPillar !== 'all') params.set('pillar', selectedPillar);
    if (selectedContext !== 'all') params.set('context', selectedContext);
    if (selectedCategory !== 'all') params.set('love100Cat', selectedCategory);
    return `/learn?${params.toString()}`;
  }, [selectedPillar, selectedContext, selectedCategory]);

  const accuracyPct =
    questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;

  const debriefData: DebriefData = {
    gameId: 'love100-aleatoric-arena',
    gameTitle: '恋爱心理 · 100律亲密关系博弈',
    numberPrefix: '15',
    difficulty,
    score,
    accuracy: accuracyPct,
    isFirstTime,
    xpEarned: isFirstTime
      ? Math.round((45 + Math.round(accuracyPct * 0.2)) * diffConfig.xpMultiplier)
      : Math.round(14 * diffConfig.xpMultiplier),
    bestAnswerReview:
      '本局全部 10 道思辨题目均由 CSPRNG 加密真随机引擎从 100 张恋爱心理学知识卡 × 5 大命题视角（500 张防重题卡）实时洗牌抽取，跨局锁定已答记录。',
    psychologicalMechanism:
      '健康的亲密关系依靠安全回应、边界协商、情绪自我调节与认知去偏，而不是静态性格标签、盲目试探或控制索求。',
    actionableSummary: [
      `本轮已累计探索 ${deckStats.seenEncountersCount} / ${deckStats.totalUniqueEncounters} 张恋爱心理 100 律防重题卡。`,
      '关系边界：把具体情境与长期模式区分开，关注双方长期行动一致性与互相尊重。',
      '安全底线：亲密关系应建立在自愿、平等、尊重与安全之上；若存在暴力、威胁或强制控制，优先寻求安全支持。',
    ],
  };

  if (phase === 'intro') {
    return (
      <div className="max-w-3xl mx-auto space-y-6 pb-12 animate-fadeIn">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => {
              gameAudio.playTap();
              navigate('/games');
            }}
            className="flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-stone-900 bg-white px-3.5 py-2 rounded-xl border border-stone-200 shadow-2xs cursor-pointer transition-colors whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>返回竞技场大厅</span>
          </button>

          <button
            type="button"
            onClick={() => {
              gameAudio.playTap();
              navigate(librarySyncUrl);
            }}
            className="text-xs font-bold text-rose-900 hover:text-rose-950 bg-rose-50 px-3.5 py-2 rounded-xl border border-rose-200 cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>前往定律库同步研读当前筛选 →</span>
          </button>
        </div>

        <section className="rounded-3xl bg-gradient-to-br from-[#2B0C1C] via-[#261129] to-[#111827] text-white p-6 sm:p-8 border border-rose-400/30 shadow-2xl space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <span className="inline-flex items-center gap-1.5 text-rose-300 font-bold">
              <Heart className="w-3.5 h-3.5 fill-rose-400" />
              <span>#15 LOVE PSYCHOLOGY 100 · CSPRNG ARENA</span>
            </span>
            <span className="text-amber-300 font-bold tabular-nums">
              {deckStats.totalConcepts} 词条 × 5 视角 = {deckStats.totalUniqueEncounters} 题卡
            </span>
          </div>

          <h1 className="font-serif-editorial text-2xl sm:text-3xl font-extrabold leading-tight">
            恋爱心理学与亲密关系 · 100 律真随机博弈竞技场
          </h1>

          <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
            系统整理 4 大关系板块（依恋安全与情感联结、共情沟通与情绪调节、信任承诺与冲突修复、吸引机制与认知去偏）× 5 大相处情境（自我认识、恋爱初期、稳定关系、冲突情境、关系复盘）。每次开局均由{' '}
            <code className="text-rose-300">crypto.getRandomValues</code> 真随机洗牌。
          </p>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-[11px] text-rose-100 leading-relaxed">
            <strong className="text-amber-300">科普声明与安全边界：</strong>
            {LOVE100_PSYCHOLOGY_NOTE}
          </div>

          <div className="grid grid-cols-3 gap-2.5 pt-1 font-numeric">
            <div className="rounded-2xl bg-white/10 border border-white/15 p-3">
              <span className="text-[11px] text-stone-300 block">已破译防重题卡</span>
              <span className="text-lg font-extrabold text-amber-300 tabular-nums">
                {deckStats.seenEncountersCount} / {deckStats.totalUniqueEncounters}
              </span>
            </div>
            <div className="rounded-2xl bg-white/10 border border-white/15 p-3">
              <span className="text-[11px] text-stone-300 block">已覆盖恋爱心理卡</span>
              <span className="text-lg font-extrabold text-emerald-300 tabular-nums">
                {deckStats.uniqueConceptsExplored} / {deckStats.totalConcepts}
              </span>
            </div>
            <div className="rounded-2xl bg-white/10 border border-white/15 p-3 flex flex-col justify-between">
              <span className="text-[11px] text-stone-300 block">当前筛选可用题池</span>
              <span className="text-lg font-extrabold text-rose-200 tabular-nums">
                {matchingConceptCount} 律
              </span>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200/90 shadow-sm space-y-5">
          {/* 1. 4 Pillars Card Grid */}
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-rose-600" />
                <span>1. 选择 4 大核心亲密关系板块</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  gameAudio.playTap();
                  setSelectedPillar('all');
                  setSelectedCategory('all');
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  selectedPillar === 'all'
                    ? 'bg-stone-900 text-white border-stone-900'
                    : 'bg-stone-50 text-stone-700 border-stone-200 hover:border-stone-400'
                }`}
              >
                全部四大板块 (100 卡)
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {LOVE100_PILLARS.map((pillar, idx) => {
                const isSelected = selectedPillar === pillar.id;
                const pillarMastered = LOVE100_PSYCHOLOGY_LAWS.filter(
                  (l) => l.love100Pillar === pillar.id && (masteryMap[l.id] || 0) >= 80
                ).length;
                const subCats = LOVE100_CATEGORIES.filter((c) => c.pillarId === pillar.id)
                  .map((c) => c.label)
                  .join(' · ');

                return (
                  <button
                    key={pillar.id}
                    type="button"
                    onClick={() => {
                      gameAudio.playTap();
                      setSelectedPillar(isSelected ? 'all' : pillar.id);
                      setSelectedCategory('all');
                    }}
                    className={`rounded-2xl p-3.5 border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                      isSelected
                        ? 'bg-rose-50/75 border-rose-500 ring-1 ring-rose-500/20 shadow-xs'
                        : 'bg-stone-50/60 border-stone-200/80 hover:border-rose-300 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-stone-500 tabular-nums">
                      <span className="font-bold" style={{ color: pillar.color }}>
                        0{idx + 1} · {pillar.count} 卡
                      </span>
                      <span>精熟 {pillarMastered}/{pillar.count}</span>
                    </div>
                    <div className="font-serif-editorial text-sm font-bold text-stone-900 leading-snug">
                      {pillar.label}
                    </div>
                    <p className="text-[11px] text-stone-600 leading-relaxed line-clamp-1">
                      {subCats}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. 5 Contexts */}
          <div className="space-y-2 pt-3 border-t border-stone-100">
            <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-rose-600" />
              <span>2. 选择恋爱与相处应用情境（5 大情境）</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  gameAudio.playTap();
                  setSelectedContext('all');
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  selectedContext === 'all'
                    ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                    : 'bg-stone-50 text-stone-700 border-stone-200 hover:border-stone-400'
                }`}
              >
                全情境真随机混战
              </button>
              {LOVE100_CONTEXTS.map((ctx) => (
                <button
                  key={ctx.id}
                  type="button"
                  onClick={() => {
                    gameAudio.playTap();
                    setSelectedContext(selectedContext === ctx.id ? 'all' : ctx.id);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    selectedContext === ctx.id
                      ? 'text-white shadow-xs'
                      : 'bg-white text-stone-700 border-stone-200 hover:border-stone-400'
                  }`}
                  style={
                    selectedContext === ctx.id
                      ? { backgroundColor: ctx.color, borderColor: ctx.color }
                      : undefined
                  }
                >
                  {ctx.label} ({ctx.count})
                </button>
              ))}
            </div>
          </div>

          {/* 3. 7 Knowledge Categories */}
          <div className="space-y-2 pt-3 border-t border-stone-100">
            <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
              3. 知识类别精确筛选（{visibleCategories.length} 个子类）
            </h3>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => {
                  gameAudio.playTap();
                  setSelectedCategory('all');
                }}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border cursor-pointer whitespace-nowrap shrink-0 ${
                  selectedCategory === 'all'
                    ? 'bg-rose-700 text-white border-rose-700'
                    : 'bg-stone-50 text-stone-600 border-stone-200 hover:border-stone-400'
                }`}
              >
                全部类别
              </button>
              {visibleCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    gameAudio.playTap();
                    setSelectedCategory(selectedCategory === cat.id ? 'all' : cat.id);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border cursor-pointer whitespace-nowrap shrink-0 transition-colors ${
                    selectedCategory === cat.id
                      ? 'text-white'
                      : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
                  }`}
                  style={
                    selectedCategory === cat.id
                      ? { backgroundColor: cat.color, borderColor: cat.color }
                      : undefined
                  }
                >
                  {cat.label} ({cat.count})
                </button>
              ))}
            </div>
          </div>

          {/* 4. Difficulty */}
          <div className="space-y-2 pt-3 border-t border-stone-100">
            <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
              4. 调节思考时限与积分难度
            </h3>
            <DifficultySelector
              value={difficulty}
              onChange={(d) => {
                gameAudio.playTap();
                setDifficulty(d);
              }}
              showDetails={true}
            />
          </div>

          <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-stone-600 font-mono tabular-nums">
              匹配词条：<strong className="text-rose-700">{matchingConceptCount} 律</strong> ·{' '}
              防重题卡池：<strong className="text-stone-900">{matchingConceptCount * 5} 张</strong>
              {matchingConceptCount < ROUND_SIZE && (
                <span className="text-stone-500 ml-1">（不足 10 律时将自动互补凑齐 10 题）</span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2.5 ml-auto">
              {deckStats.seenEncountersCount > 0 && (
                <button
                  type="button"
                  onClick={handleResetDeck}
                  className="px-4 py-2.5 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-600 text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>重置防重洗牌盒</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => startSession(difficulty)}
                className="px-7 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all whitespace-nowrap shrink-0"
              >
                <Shuffle className="w-4 h-4" />
                <span>立即开启真随机 10 题博弈</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (phase === 'debrief') {
    return (
      <div className="max-w-3xl mx-auto py-4 px-2 space-y-6 pb-12 animate-fadeIn">
        <GameDebriefModal
          data={debriefData}
          onRestart={() => startSession(difficulty)}
          onReturn={() => navigate('/games')}
        />

        {questions.length > 0 && (
          <section className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200/90 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-100">
              <div>
                <h3 className="font-serif-editorial text-base sm:text-lg font-bold text-stone-900">
                  本局实战词条复盘与快捷收藏 ({questions.length} 题)
                </h3>
                <p className="text-xs text-stone-500">
                  点击任意词条进入图文解析页精读，或一键加入复习收藏夹
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  gameAudio.playTap();
                  navigate(librarySyncUrl);
                }}
                className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>前往定律库深化研读</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {questions.map((q, idx) => {
                const outcome = questionOutcomes[idx] || 'wrong';
                const masteredPct = masteryMap[q.law.id] || 0;
                const saved = isBookmarked(q.law.id);

                return (
                  <div
                    key={`${q.encounterKey}-${idx}`}
                    className="rounded-2xl p-3.5 border border-stone-200/90 bg-stone-50/50 flex flex-col justify-between gap-2.5"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2 text-[11px] font-mono">
                        <span className="font-bold text-rose-900">
                          {q.law.codeId} · {q.law.love100Category}
                        </span>
                        <span
                          className={`font-bold ${
                            outcome === 'correct'
                              ? 'text-emerald-700'
                              : outcome === 'timeout'
                              ? 'text-amber-700'
                              : 'text-rose-700'
                          }`}
                        >
                          {outcome === 'correct'
                            ? '精准掌握'
                            : outcome === 'timeout'
                            ? '思考超时'
                            : '需重点复盘'}
                        </span>
                      </div>
                      <h4 className="font-serif-editorial text-sm font-bold text-stone-900 leading-snug">
                        {q.law.nameZh}
                      </h4>
                      <p className="text-[11px] text-stone-600 line-clamp-2 leading-relaxed">
                        {q.law.shortExplanation}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-stone-200/70">
                      <span className="text-[11px] font-mono text-stone-500 tabular-nums">
                        当前掌握度：{masteredPct}%
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            gameAudio.playTap();
                            toggleBookmark(q.law.id);
                          }}
                          className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 text-stone-600 cursor-pointer"
                          title={saved ? '取消收藏' : '加入复习收藏'}
                        >
                          <Bookmark
                            className={`w-3.5 h-3.5 ${saved ? 'fill-amber-500 text-amber-500' : ''}`}
                          />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            gameAudio.playTap();
                            navigate(`/law/${q.law.id}`);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
                        >
                          <span>精读解析</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    );
  }

  if (!currentQuestion) return null;

  const bookmarked = isBookmarked(currentQuestion.law.id);
  const answered = selectedOpt !== null;
  const isCorrect = selectedOpt === currentQuestion.correctAnswer;

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-12 animate-fadeIn">
      <GameHeaderHud
        title="恋爱心理 · 100律 CSPRNG 博弈"
        numberPrefix="15"
        difficulty={difficulty}
        score={score}
        combo={combo}
        timeLeft={timeLeft}
        currentRound={currentIdx + 1}
        totalRounds={questions.length}
        onExit={() => setPhase('intro')}
        accentColor="#E11D48"
      />

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-lg space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-100 text-xs">
          <div className="flex flex-wrap items-center gap-2 font-mono">
            <span className="font-bold text-rose-900">
              {currentQuestion.law.codeId}
            </span>
            <span className="text-stone-300" aria-hidden="true">·</span>
            <span className="font-bold text-stone-700">{currentQuestion.templateLabel}</span>
            <span className="text-stone-300" aria-hidden="true">·</span>
            <span className="text-stone-500">{currentQuestion.contextTag}</span>
          </div>

          <div className="flex items-center gap-2">
            {combo >= 2 && (
              <span className="inline-flex items-center gap-1 font-numeric font-bold text-amber-700">
                <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                <span>{combo} 连胜</span>
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                gameAudio.playTap();
                toggleBookmark(currentQuestion.law.id);
              }}
              className="p-2 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-500 cursor-pointer shrink-0"
              title="收藏本条恋爱心理学词条"
            >
              <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-amber-500 text-amber-500' : ''}`} />
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="font-serif-editorial text-lg sm:text-xl font-bold text-stone-900 leading-snug">
            {currentQuestion.prompt}
          </h2>
          <p className="text-xs text-stone-500 font-mono">
            {currentQuestion.law.nameEn}
          </p>
        </div>

        <div className="space-y-2.5">
          {currentQuestion.options.map((opt, idx) => {
            const isPicked = selectedOpt === idx;
            const isRight = idx === currentQuestion.correctAnswer;

            let cls =
              'bg-stone-50 hover:bg-rose-50/50 border-stone-200 text-stone-800 hover:border-rose-300';
            if (answered) {
              if (isRight) {
                cls = 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold';
              } else if (isPicked) {
                cls = 'bg-rose-50 border-rose-400 text-rose-900';
              } else {
                cls = 'bg-stone-50/50 border-stone-200 text-stone-400 opacity-65';
              }
            }

            return (
              <button
                key={idx}
                type="button"
                disabled={answered}
                onClick={() => handleSelectOption(idx)}
                className={`w-full text-left px-4 py-3.5 rounded-2xl border-2 text-xs sm:text-sm transition-all flex items-start justify-between gap-3 cursor-pointer ${cls}`}
              >
                <span className="leading-relaxed">
                  <strong className="font-mono mr-2">{String.fromCharCode(65 + idx)}.</strong>
                  {opt}
                </span>
                <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                  {!answered && (
                    <span className="hidden sm:inline text-[10px] font-mono text-stone-400 tabular-nums">
                      [{idx + 1}]
                    </span>
                  )}
                  {answered && isRight && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
                  {answered && isPicked && !isRight && <XCircle className="w-5 h-5 text-rose-500 shrink-0" />}
                </div>
              </button>
            );
          })}
        </div>

        {!answered && (
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-stone-400 font-mono">
            <Keyboard className="w-3.5 h-3.5" />
            <span>快捷操作：数字键 1–4 或 A–D 选择答案 · 作答后按 Enter 进入下一题</span>
          </div>
        )}

        {answered && (
          <div className="space-y-3 pt-2 animate-fadeIn">
            <div
              className={`p-4 rounded-2xl border text-xs leading-relaxed space-y-1.5 ${
                isCorrect
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                  : 'bg-amber-50/80 border-amber-200 text-amber-950'
              }`}
            >
              <div className="font-bold flex items-center gap-1.5">
                {isCorrect ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>精准把握亲密心理学洞察！词条掌握度 +25%</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-rose-500" />
                    <span>{selectedOpt === -1 ? '思考超时' : '关系认知偏差'} · 重点复盘</span>
                  </>
                )}
              </div>
              <p>{currentQuestion.explanation}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-stone-700 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
              <div>
                <strong className="text-stone-900">尊重、边界与非诊断原则：</strong>
                <span>{currentQuestion.healthyBoundary}</span>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap shrink-0"
              >
                <span>{currentIdx < questions.length - 1 ? '下一道 CSPRNG 随机题' : '查看本局防重战绩总结'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

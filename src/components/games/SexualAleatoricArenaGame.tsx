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
  HeartHandshake,
  Compass,
  BookOpen,
  Keyboard,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { GameDifficulty, DIFFICULTY_CONFIGS, DIFFICULTY_LIST } from '../../data/difficulty';
import {
  SEXUAL_PSYCHOLOGY_LAWS,
  SEXUAL_PILLARS,
  SEXUAL_CATEGORIES,
  SEXUAL_CONTEXTS,
  SEXUAL_PSYCHOLOGY_NOTE,
} from '../../data/sexualPsychologyLaws';
import {
  AleatoricSexualQuestion,
  drawAleatoricSexualQuestions,
  getSexualAleatoricStats,
  resetSexualAleatoricDeck,
} from '../../utils/aleatoricEngine';
import { DifficultySelector } from './DifficultySelector';
import { GameHeaderHud } from './GameHeaderHud';
import { GameDebriefModal, DebriefData } from './GameDebriefModal';
import { gameAudio } from '../../utils/gameAudio';

const ROUND_SIZE = 10;

export const SexualAleatoricArenaGame: React.FC = () => {
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

  const [questions, setQuestions] = useState<AleatoricSexualQuestion[]>([]);
  const [questionOutcomes, setQuestionOutcomes] = useState<Array<'correct' | 'wrong' | 'timeout'>>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(28);
  const [deckStats, setDeckStats] = useState(() => getSexualAleatoricStats());

  const reactionStartRef = useRef<number>(Date.now());
  const reactionTimesRef = useRef<number[]>([]);

  const diffConfig = DIFFICULTY_CONFIGS[difficulty];
  const isFirstTime = !(user.completedGames?.includes('sexual-aleatoric-arena'));

  const secondsPerQuestion =
    difficulty === '低' ? 36 : difficulty === '中' ? 28 : difficulty === '高' ? 22 : 16;

  const visibleCategories = useMemo(
    () =>
      selectedPillar === 'all'
        ? SEXUAL_CATEGORIES
        : SEXUAL_CATEGORIES.filter((cat) => cat.pillarId === selectedPillar),
    [selectedPillar]
  );

  // Live filtered pool count matching selected Pillar/Context/Category
  const matchingConceptCount = useMemo(() => {
    return SEXUAL_PSYCHOLOGY_LAWS.filter((law) => {
      if (selectedPillar !== 'all' && law.sexualPillar !== selectedPillar) return false;
      if (selectedContext !== 'all' && law.sexualContext !== selectedContext) return false;
      if (selectedCategory !== 'all' && law.sexualCategory !== selectedCategory) return false;
      return true;
    }).length;
  }, [selectedPillar, selectedContext, selectedCategory]);

  const masteryMap = user.lawMasteryMap || {};

  const startSession = (overrideDiff: GameDifficulty = difficulty) => {
    gameAudio.playSuccess();
    const drawn = drawAleatoricSexualQuestions(ROUND_SIZE, {
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
    setDeckStats(getSexualAleatoricStats());
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

      recordGameResult('sexual-aleatoric-arena', {
        score,
        accuracy,
        reactionTime: avgRt,
        xpGained: calculatedXp,
        comboMax: maxCombo,
        conceptLearned: '100 条性心理学科学原理、知情同意边界与多元尊重 · CSPRNG 零重复博弈',
        lawId: questions[0]?.law.id,
        difficulty,
      });

      setDeckStats(getSexualAleatoricStats());
      setPhase('debrief');
    }
  }, [currentIdx, questions, secondsPerQuestion, correctCount, isFirstTime, diffConfig.xpMultiplier, recordGameResult, score, maxCombo, difficulty]);

  // Keyboard shortcuts during active gameplay: 1-4 or A-D to pick option, Enter/ArrowRight to advance
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
    resetSexualAleatoricDeck();
    setDeckStats(getSexualAleatoricStats());
  };

  const librarySyncUrl = useMemo(() => {
    const params = new URLSearchParams({ mode: 'sexual' });
    if (selectedPillar !== 'all') params.set('pillar', selectedPillar);
    if (selectedContext !== 'all') params.set('context', selectedContext);
    if (selectedCategory !== 'all') params.set('sexualCat', selectedCategory);
    return `/learn?${params.toString()}`;
  }, [selectedPillar, selectedContext, selectedCategory]);

  const accuracyPct =
    questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;

  const debriefData: DebriefData = {
    gameId: 'sexual-aleatoric-arena',
    gameTitle: '性心理 · 100律亲密与健康思辨',
    numberPrefix: '14',
    difficulty,
    score,
    accuracy: accuracyPct,
    isFirstTime,
    xpEarned: isFirstTime
      ? Math.round((45 + Math.round(accuracyPct * 0.2)) * diffConfig.xpMultiplier)
      : Math.round(14 * diffConfig.xpMultiplier),
    bestAnswerReview:
      '本局全部 10 道思辨题目均由 CSPRNG 加密真随机引擎从 100 条性心理学概念 × 5 大切入视角（500 张防重题卡）实时抽样洗牌，跨局锁定已答记录，绝不重复推送。',
    psychologicalMechanism:
      '现代性心理学强调「生理—心理—社会文化」三元交互、双控制兴奋/抑制模型以及持续且可撤回的知情同意原则，反对单一刻板模板与性羞耻污名。',
    actionableSummary: [
      `本轮已累计探索 ${deckStats.seenEncountersCount} / ${deckStats.totalUniqueEncounters} 张性心理防重题卡。`,
      '边界准则：持续、清晰、具体、自愿且可随时撤回的同意是一切健康亲密互动的基础。',
      '非诊断定位：本专题仅作循证心理科学教育，若存在持续性功能、性痛觉或心理困扰请及时寻求合格医疗或心理专业人员帮助。',
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
            className="text-xs font-bold text-purple-900 hover:text-purple-950 bg-purple-50 px-3.5 py-2 rounded-xl border border-purple-200 cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>前往定律库同步研读当前筛选 →</span>
          </button>
        </div>

        <section className="rounded-3xl bg-gradient-to-br from-[#1F0F2B] via-[#1C1433] to-[#111827] text-white p-6 sm:p-8 border border-purple-400/30 shadow-2xl space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <span className="inline-flex items-center gap-1.5 text-purple-300 font-bold">
              <HeartHandshake className="w-3.5 h-3.5" />
              <span>#14 SEXUAL PSYCHOLOGY · CSPRNG ARENA</span>
            </span>
            <span className="text-amber-300 font-bold tabular-nums">
              {deckStats.totalConcepts} 词条 × 5 视角 = {deckStats.totalUniqueEncounters} 题卡
            </span>
          </div>

          <h1 className="font-serif-editorial text-2xl sm:text-3xl font-extrabold leading-tight">
            性心理学与亲密健康 · 100 律真随机思辨竞技场
          </h1>

          <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
            系统整合 4 大核心板块（生理唤起与欲望机制、同意边界与亲密关系、自我认同与多元尊重、身心健康与社会文化）× 5 大实践观察场景。每次开局均由{' '}
            <code className="text-purple-300">crypto.getRandomValues</code> 实时真随机洗牌并避开近期已答概念。
          </p>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-[11px] text-purple-100 leading-relaxed">
            <strong className="text-amber-300">科学教育与健康支持说明：</strong>
            {SEXUAL_PSYCHOLOGY_NOTE}
          </div>

          <div className="grid grid-cols-3 gap-2.5 pt-1 font-numeric">
            <div className="rounded-2xl bg-white/10 border border-white/15 p-3">
              <span className="text-[11px] text-stone-300 block">已破译防重题卡</span>
              <span className="text-lg font-extrabold text-amber-300 tabular-nums">
                {deckStats.seenEncountersCount} / {deckStats.totalUniqueEncounters}
              </span>
            </div>
            <div className="rounded-2xl bg-white/10 border border-white/15 p-3">
              <span className="text-[11px] text-stone-300 block">已覆盖性心理词条</span>
              <span className="text-lg font-extrabold text-emerald-300 tabular-nums">
                {deckStats.uniqueConceptsExplored} / {deckStats.totalConcepts}
              </span>
            </div>
            <div className="rounded-2xl bg-white/10 border border-white/15 p-3 flex flex-col justify-between">
              <span className="text-[11px] text-stone-300 block">当前筛选可用题池</span>
              <span className="text-lg font-extrabold text-purple-200 tabular-nums">
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
                <Compass className="w-3.5 h-3.5 text-purple-700" />
                <span>1. 选择 4 大核心主题板块</span>
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
                全部四大板块 (100 律)
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {SEXUAL_PILLARS.map((pillar, idx) => {
                const isSelected = selectedPillar === pillar.id;
                const pillarMastered = SEXUAL_PSYCHOLOGY_LAWS.filter(
                  (l) => l.sexualPillar === pillar.id && (masteryMap[l.id] || 0) >= 80
                ).length;
                const subCats = SEXUAL_CATEGORIES.filter((c) => c.pillarId === pillar.id)
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
                        ? 'bg-purple-50/75 border-purple-500 ring-1 ring-purple-500/20 shadow-xs'
                        : 'bg-stone-50/60 border-stone-200/80 hover:border-purple-300 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-stone-500 tabular-nums">
                      <span className="font-bold" style={{ color: pillar.color }}>
                        0{idx + 1} · {pillar.count} 律
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
              <Layers className="w-3.5 h-3.5 text-purple-700" />
              <span>2. 选择实践与应用观察场景（5 大场景）</span>
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
                全场景真随机混战
              </button>
              {SEXUAL_CONTEXTS.map((ctx) => (
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

          {/* 3. 12 Fine Categories */}
          <div className="space-y-2 pt-3 border-t border-stone-100">
            <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
              3. 细分知识专题筛选（{visibleCategories.length} 个子分类）
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
                    ? 'bg-purple-800 text-white border-purple-800'
                    : 'bg-stone-50 text-stone-600 border-stone-200 hover:border-stone-400'
                }`}
              >
                全部专题
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
              匹配词条：<strong className="text-purple-800">{matchingConceptCount} 律</strong> ·{' '}
              防重题卡池：<strong className="text-stone-900">{matchingConceptCount * 5} 张</strong>
              {matchingConceptCount < ROUND_SIZE && (
                <span className="text-stone-500 ml-1">（不足 10 律时将自动从全库互补凑齐 10 题）</span>
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
                className="px-7 py-3.5 rounded-2xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all whitespace-nowrap shrink-0"
              >
                <Shuffle className="w-4 h-4" />
                <span>立即开启真随机 10 题思辨</span>
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

        {/* Encountered Concepts Recap & Quick Bookmark / Study Matrix */}
        {questions.length > 0 && (
          <section className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200/90 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-100">
              <div>
                <h3 className="font-serif-editorial text-base sm:text-lg font-bold text-stone-900">
                  本局实战词条复盘与快捷收藏 ({questions.length} 题)
                </h3>
                <p className="text-xs text-stone-500">
                  点击任意词条可进入图文解析页精读，或一键加入复习收藏夹
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  gameAudio.playTap();
                  navigate(librarySyncUrl);
                }}
                className="px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
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
                        <span className="font-bold text-purple-900">
                          {q.law.codeId} · {q.law.sexualCategory}
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
        title="性心理 · 100律 CSPRNG 思辨"
        numberPrefix="14"
        difficulty={difficulty}
        score={score}
        combo={combo}
        timeLeft={timeLeft}
        currentRound={currentIdx + 1}
        totalRounds={questions.length}
        onExit={() => setPhase('intro')}
        accentColor="#7E22CE"
      />

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-lg space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-100 text-xs">
          <div className="flex flex-wrap items-center gap-2 font-mono">
            <span className="font-bold text-purple-900">
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
              title="收藏本条性心理学词条"
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
              'bg-stone-50 hover:bg-purple-50/50 border-stone-200 text-stone-800 hover:border-purple-300';
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
                    <span>精准把握科学原则！词条掌握度 +25%</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-rose-500" />
                    <span>{selectedOpt === -1 ? '思考超时' : '认识偏差'} · 重点复盘</span>
                  </>
                )}
              </div>
              <p>{currentQuestion.explanation}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-stone-700 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
              <div>
                <strong className="text-stone-900">尊重、同意与科学边界：</strong>
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

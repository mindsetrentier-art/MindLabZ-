import React, { useState, useEffect, useRef } from 'react';
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
  ShieldAlert,
  Layers,
  Scale,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { GameDifficulty, DIFFICULTY_CONFIGS, DIFFICULTY_LIST } from '../../data/difficulty';
import {
  CRIMINAL_CATEGORIES,
  CRIMINAL_CONTEXTS,
  CRIMINAL_PSYCHOLOGY_NOTE,
} from '../../data/criminalPsychologyLaws';
import {
  AleatoricCriminalQuestion,
  drawAleatoricCriminalQuestions,
  getCriminalAleatoricStats,
  resetCriminalAleatoricDeck,
} from '../../utils/aleatoricEngine';
import { DifficultySelector } from './DifficultySelector';
import { GameHeaderHud } from './GameHeaderHud';
import { GameDebriefModal, DebriefData } from './GameDebriefModal';
import { gameAudio } from '../../utils/gameAudio';

const ROUND_SIZE = 10;

export const CriminalAleatoricArenaGame: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, recordGameResult, updateLawMastery, isBookmarked, toggleBookmark } = useApp();

  const urlDiff = searchParams.get('difficulty') as GameDifficulty | null;
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
  const [selectedContext, setSelectedContext] = useState<string>(urlContext || 'all');
  const [selectedCategory, setSelectedCategory] = useState<string>(urlCategory || 'all');
  const [phase, setPhase] = useState<'intro' | 'playing' | 'debrief'>('intro');

  const [questions, setQuestions] = useState<AleatoricCriminalQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(28);
  const [deckStats, setDeckStats] = useState(() => getCriminalAleatoricStats());

  const reactionStartRef = useRef<number>(Date.now());
  const reactionTimesRef = useRef<number[]>([]);

  const diffConfig = DIFFICULTY_CONFIGS[difficulty];
  const isFirstTime = !(user.completedGames?.includes('criminal-aleatoric-arena'));

  const secondsPerQuestion =
    difficulty === '低' ? 36 : difficulty === '中' ? 28 : difficulty === '高' ? 22 : 16;

  const startSession = (overrideDiff: GameDifficulty = difficulty) => {
    gameAudio.playSuccess();
    const drawn = drawAleatoricCriminalQuestions(ROUND_SIZE, {
      contextFilter: selectedContext,
      categoryFilter: selectedCategory,
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
    setDeckStats(getCriminalAleatoricStats());
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

      recordGameResult('criminal-aleatoric-arena', {
        score,
        accuracy,
        reactionTime: avgRt,
        xpGained: calculatedXp,
        comboMax: maxCombo,
        conceptLearned: '100 条犯罪心理学风险机制与非诊断伦理边界 · CSPRNG 零重复博弈',
        lawId: questions[0]?.law.id,
        difficulty,
      });

      setDeckStats(getCriminalAleatoricStats());
      setPhase('debrief');
    }
  };

  const handleResetDeck = () => {
    gameAudio.playTap();
    resetCriminalAleatoricDeck();
    setDeckStats(getCriminalAleatoricStats());
  };

  const accuracyPct =
    questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;

  const debriefData: DebriefData = {
    gameId: 'criminal-aleatoric-arena',
    gameTitle: '犯罪心理 · 100律行为剖析',
    numberPrefix: '13',
    difficulty,
    score,
    accuracy: accuracyPct,
    isFirstTime,
    xpEarned: isFirstTime
      ? Math.round((45 + Math.round(accuracyPct * 0.2)) * diffConfig.xpMultiplier)
      : Math.round(14 * diffConfig.xpMultiplier),
    bestAnswerReview:
      '本局全部 10 道题目均由 CSPRNG 硬件加密真随机引擎从 100 条犯罪心理学知识卡 × 5 大辨析视角（500 张独立题卡）实时抽样洗牌，并记录跨局防重冷却窗口，保证每次开局绝不重复。',
    psychologicalMechanism:
      '现代犯罪心理学强调多因素交互模型（个人特征、社会学习、环境机会与制度监督），明确反对单一因素决断论与机械性格标签化。',
    actionableSummary: [
      `本轮已累计探索 ${deckStats.seenEncountersCount} / ${deckStats.totalUniqueEncounters} 张犯罪心理防重题卡。`,
      '预防优先：关注家庭照护质量、校园归属、亲密安全边界与职场监督机制，构建早期保护性支持网络。',
      '科学红线：所有理论与研究概念仅用于理解机制和预防，不可单独用于临床诊断、个人犯罪预测、画像定罪或替代法律程序。',
    ],
  };

  if (phase === 'intro') {
    return (
      <div className="max-w-3xl mx-auto space-y-6 pb-12 animate-fadeIn">
        <div className="flex items-center justify-between gap-2">
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
              navigate('/learn?mode=criminal');
            }}
            className="text-xs font-bold text-rose-900 hover:text-rose-950 bg-rose-50 px-3.5 py-2 rounded-xl border border-rose-200 cursor-pointer whitespace-nowrap shrink-0"
          >
            查阅犯罪心理学 100 律图鉴 →
          </button>
        </div>

        <section className="rounded-3xl bg-gradient-to-br from-[#230E16] via-[#1C1628] to-[#111827] text-white p-6 sm:p-8 border border-rose-400/30 shadow-2xl space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <span className="inline-flex items-center gap-1.5 text-rose-300 font-bold">
              <Scale className="w-3.5 h-3.5" />
              <span>#13 CRIMINAL PSYCHOLOGY · CSPRNG ARENA</span>
            </span>
            <span className="text-amber-300 font-bold tabular-nums">
              {deckStats.totalConcepts} 词条 × 5 视角 = {deckStats.totalUniqueEncounters} 题卡
            </span>
          </div>

          <h1 className="font-serif-editorial text-2xl sm:text-3xl font-extrabold leading-tight">
            犯罪心理学 · 100 律行为机制与预防真随机竞技场
          </h1>

          <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
            全量汇集 4 大理论专题（基础理论、暴力与攻击、人格与个体差异、群体犯罪）× 5 大观察预防场景。每次开局均由浏览器加密随机生成器（<code className="text-rose-300">crypto.getRandomValues</code>）实时洗牌并剔除近期已答概念，彻底杜绝重复套题。
          </p>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-[11px] text-rose-100 leading-relaxed">
            <strong className="text-amber-300">科学伦理与非诊断说明：</strong>
            {CRIMINAL_PSYCHOLOGY_NOTE}
          </div>

          <div className="grid grid-cols-3 gap-2.5 pt-1 font-numeric">
            <div className="rounded-2xl bg-white/10 border border-white/15 p-3">
              <span className="text-[11px] text-stone-300 block">已破译防重题卡</span>
              <span className="text-lg font-extrabold text-amber-300 tabular-nums">
                {deckStats.seenEncountersCount} / {deckStats.totalUniqueEncounters}
              </span>
            </div>
            <div className="rounded-2xl bg-white/10 border border-white/15 p-3">
              <span className="text-[11px] text-stone-300 block">已覆盖犯罪心理词条</span>
              <span className="text-lg font-extrabold text-emerald-300 tabular-nums">
                {deckStats.uniqueConceptsExplored} / {deckStats.totalConcepts}
              </span>
            </div>
            <div className="rounded-2xl bg-white/10 border border-white/15 p-3 flex flex-col justify-between">
              <span className="text-[11px] text-stone-300 block">随机抽样引擎</span>
              <span className="text-xs font-bold text-rose-200 mt-1">CSPRNG 零重栈</span>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200/90 shadow-sm space-y-4">
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-rose-700" />
              <span>1. 选择观察与预防场景域（{CRIMINAL_CONTEXTS.length} 大场景）</span>
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
                全场景真随机混战 (100 律)
              </button>
              {CRIMINAL_CONTEXTS.map((ctx) => (
                <button
                  key={ctx.id}
                  type="button"
                  onClick={() => {
                    gameAudio.playTap();
                    setSelectedContext(ctx.id);
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

          <div className="space-y-2 pt-2 border-t border-stone-100">
            <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
              2. 精选核心理论领域（4 大领域）
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
                    ? 'bg-rose-800 text-white border-rose-800'
                    : 'bg-stone-50 text-stone-600 border-stone-200 hover:border-stone-400'
                }`}
              >
                全部 4 大领域 (100)
              </button>
              {CRIMINAL_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    gameAudio.playTap();
                    setSelectedCategory(cat.id);
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

          <div className="space-y-2 pt-2 border-t border-stone-100">
            <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
              3. 调节思考时限与积分难度
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

          <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
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
              className="flex-1 sm:flex-none ml-auto px-7 py-3.5 rounded-2xl bg-rose-800 hover:bg-rose-900 text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all whitespace-nowrap shrink-0"
            >
              <Shuffle className="w-4 h-4" />
              <span>立即开启真随机 10 题剖析</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
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

  if (!currentQuestion) return null;

  const bookmarked = isBookmarked(currentQuestion.law.id);
  const answered = selectedOpt !== null;
  const isCorrect = selectedOpt === currentQuestion.correctAnswer;

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-12 animate-fadeIn">
      <GameHeaderHud
        title="犯罪心理 · 100律 CSPRNG 剖析"
        numberPrefix="13"
        difficulty={difficulty}
        score={score}
        combo={combo}
        timeLeft={timeLeft}
        currentRound={currentIdx + 1}
        totalRounds={questions.length}
        onExit={() => setPhase('intro')}
        accentColor="#9F1239"
      />

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-lg space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-100 text-xs">
          <div className="flex flex-wrap items-center gap-2 font-mono">
            <span className="font-bold text-rose-900 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
              {currentQuestion.law.codeId}
            </span>
            <span className="font-bold text-stone-700">{currentQuestion.templateLabel}</span>
            <span className="text-stone-300" aria-hidden="true">·</span>
            <span className="text-stone-500">{currentQuestion.contextTag}</span>
          </div>

          <div className="flex items-center gap-2">
            {combo >= 2 && (
              <span className="inline-flex items-center gap-1 font-numeric font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
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
              title="收藏本条犯罪心理学词条"
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
                {answered && isRight && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />}
                {answered && isPicked && !isRight && <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />}
              </button>
            );
          })}
        </div>

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
                    <span>精准研判！词条掌握度 +25%</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-rose-500" />
                    <span>{selectedOpt === -1 ? '思考超时' : '认知研判偏差'} · 重点复盘</span>
                  </>
                )}
              </div>
              <p>{currentQuestion.explanation}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-stone-700 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
              <div>
                <strong className="text-stone-900">科学防误用警示：</strong>
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

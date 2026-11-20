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
  ShieldCheck,
  Layers,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { GameDifficulty, DIFFICULTY_CONFIGS, DIFFICULTY_LIST } from '../../data/difficulty';
import {
  REVERSE_CATEGORIES,
  REVERSE_PSYCHOLOGY_NOTE,
  REVERSE_SCENARIOS,
} from '../../data/reversePsychologyLaws';
import {
  AleatoricReverseQuestion,
  drawAleatoricReverseQuestions,
  getReverseAleatoricStats,
  resetReverseAleatoricDeck,
} from '../../utils/aleatoricEngine';
import { DifficultySelector } from './DifficultySelector';
import { GameHeaderHud } from './GameHeaderHud';
import { GameDebriefModal, DebriefData } from './GameDebriefModal';
import { gameAudio } from '../../utils/gameAudio';

const ROUND_SIZE = 10;

export const ReverseAleatoricArenaGame: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, recordGameResult, updateLawMastery, isBookmarked, toggleBookmark } = useApp();

  const urlDiff = searchParams.get('difficulty') as GameDifficulty | null;
  const urlScenario = searchParams.get('scenario');
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
  const [selectedScenario, setSelectedScenario] = useState<string>(urlScenario || 'all');
  const [selectedCategory, setSelectedCategory] = useState<string>(urlCategory || 'all');
  const [phase, setPhase] = useState<'intro' | 'playing' | 'debrief'>('intro');

  const [questions, setQuestions] = useState<AleatoricReverseQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(28);
  const [deckStats, setDeckStats] = useState(() => getReverseAleatoricStats());

  const reactionStartRef = useRef<number>(Date.now());
  const reactionTimesRef = useRef<number[]>([]);

  const diffConfig = DIFFICULTY_CONFIGS[difficulty];
  const isFirstTime = !(user.completedGames?.includes('reverse-aleatoric-arena'));

  const secondsPerQuestion =
    difficulty === '低' ? 36 : difficulty === '中' ? 28 : difficulty === '高' ? 22 : 16;

  const startSession = (overrideDiff: GameDifficulty = difficulty) => {
    gameAudio.playSuccess();
    const drawn = drawAleatoricReverseQuestions(ROUND_SIZE, {
      scenarioFilter: selectedScenario,
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
    setDeckStats(getReverseAleatoricStats());
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

      recordGameResult('reverse-aleatoric-arena', {
        score,
        accuracy,
        reactionTime: avgRt,
        xpGained: calculatedXp,
        comboMax: maxCombo,
        conceptLearned: '100 条逆向心理学与心理抗拒 · CSPRNG 零重复博弈',
        lawId: questions[0]?.law.id,
        difficulty,
      });

      setDeckStats(getReverseAleatoricStats());
      setPhase('debrief');
    }
  };

  const handleResetDeck = () => {
    gameAudio.playTap();
    resetReverseAleatoricDeck();
    setDeckStats(getReverseAleatoricStats());
  };

  const accuracyPct =
    questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;

  const debriefData: DebriefData = {
    gameId: 'reverse-aleatoric-arena',
    gameTitle: '逆向心理 · 100律极速博弈',
    numberPrefix: '12',
    difficulty,
    score,
    accuracy: accuracyPct,
    isFirstTime,
    xpEarned: isFirstTime
      ? Math.round((45 + Math.round(accuracyPct * 0.2)) * diffConfig.xpMultiplier)
      : Math.round(14 * diffConfig.xpMultiplier),
    bestAnswerReview:
      '本局所有 10 道题目均采用 CSPRNG（加密真随机）算法从 100 条逆向心理学词条 × 5 大思辨视角（共计 500 张题卡）中实时抽样，已自动记入跨局防重队列，下次开局绝不重复推送。',
    psychologicalMechanism:
      '心理抗拒（Psychological Reactance）源于个体的自由恢复动机。当人们感受到控制、威胁或强制施压时，注意力会从“事情本身的对错”转向“争夺选择主导权”。',
    actionableSummary: [
      `本轮已累积破译 ${deckStats.seenEncountersCount} / ${deckStats.totalUniqueEncounters} 张逆向心理防重题卡。`,
      '实战原则：用解释原因、提供真实有限选项与自主支持替代命令胁迫或虚假稀缺。',
      '伦理底线：逆向心理不是可保证奏效的操控公式，诚实沟通与尊重拒绝才具有长期复利。',
    ],
  };

  if (phase === 'intro') {
    return (
      <div className="max-w-3xl mx-auto space-y-6 pb-12 animate-fadeIn">
        <div className="flex items-center justify-between">
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
              navigate('/learn?mode=reverse');
            }}
            className="text-xs font-bold text-teal-800 hover:text-teal-950 bg-teal-50 px-3.5 py-2 rounded-xl border border-teal-200 cursor-pointer whitespace-nowrap shrink-0"
          >
            查阅逆向心理 100 律图鉴 →
          </button>
        </div>

        <section className="rounded-3xl bg-gradient-to-br from-[#0F2A2A] via-[#10212D] to-[#111827] text-white p-6 sm:p-8 border border-teal-400/30 shadow-2xl space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <span className="inline-flex items-center gap-1.5 text-teal-300 font-bold">
              <Shuffle className="w-3.5 h-3.5" />
              <span>#12 REVERSE PSYCHOLOGY · CSPRNG ARENA</span>
            </span>
            <span className="text-amber-300 font-bold tabular-nums">
              {deckStats.totalConcepts} 词条 × 5 视角 = {deckStats.totalUniqueEncounters} 题卡
            </span>
          </div>

          <h1 className="font-serif-editorial text-2xl sm:text-3xl font-extrabold leading-tight">
            逆向心理学 · 100 律极速零重复博弈
          </h1>

          <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
            系统接入全部 100 条「心理抗拒、自由威胁、禁果效应、双面信息与伦理边界」卡片。每次开局均通过浏览器硬件加密随机生成器（<code className="text-teal-300">crypto.getRandomValues</code>）实时洗牌并排除近期已做概念，彻底告别重复刷题。
          </p>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-[11px] text-teal-100 leading-relaxed">
            <strong className="text-amber-300">科学伦理注记：</strong>
            {REVERSE_PSYCHOLOGY_NOTE}
          </div>

          {/* Non-Repeat Deck Tracker */}
          <div className="grid grid-cols-3 gap-2.5 pt-1 font-numeric">
            <div className="rounded-2xl bg-white/10 border border-white/15 p-3">
              <span className="text-[11px] text-stone-300 block">已破译独立题卡</span>
              <span className="text-lg font-extrabold text-amber-300 tabular-nums">
                {deckStats.seenEncountersCount} / {deckStats.totalUniqueEncounters}
              </span>
            </div>
            <div className="rounded-2xl bg-white/10 border border-white/15 p-3">
              <span className="text-[11px] text-stone-300 block">已覆盖逆向词条</span>
              <span className="text-lg font-extrabold text-emerald-300 tabular-nums">
                {deckStats.uniqueConceptsExplored} / {deckStats.totalConcepts}
              </span>
            </div>
            <div className="rounded-2xl bg-white/10 border border-white/15 p-3 flex flex-col justify-between">
              <span className="text-[11px] text-stone-300 block">洗牌引擎</span>
              <span className="text-xs font-bold text-teal-200 mt-1">CSPRNG 零重栈</span>
            </div>
          </div>
        </section>

        {/* Scenario & Category Filters */}
        <section className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200/90 shadow-sm space-y-4">
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-teal-600" />
              <span>1. 选择挑战场景域（{REVERSE_SCENARIOS.length} 大沟通现场）</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  gameAudio.playTap();
                  setSelectedScenario('all');
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  selectedScenario === 'all'
                    ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                    : 'bg-stone-50 text-stone-700 border-stone-200 hover:border-stone-400'
                }`}
              >
                全场景随机混战 (100 律)
              </button>
              {REVERSE_SCENARIOS.map((sc) => (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => {
                    gameAudio.playTap();
                    setSelectedScenario(sc.id);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    selectedScenario === sc.id
                      ? 'text-white shadow-xs'
                      : 'bg-white text-stone-700 border-stone-200 hover:border-stone-400'
                  }`}
                  style={
                    selectedScenario === sc.id
                      ? { backgroundColor: sc.color, borderColor: sc.color }
                      : undefined
                  }
                >
                  {sc.label} ({sc.count})
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-stone-100">
            <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
              2. 精选理论机制分类（可选）
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
                    ? 'bg-teal-700 text-white border-teal-700'
                    : 'bg-stone-50 text-stone-600 border-stone-200 hover:border-stone-400'
                }`}
              >
                全部 12 机制分类
              </button>
              {REVERSE_CATEGORIES.map((cat) => (
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
              3. 调节神经反应时与积分难度
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
              className="flex-1 sm:flex-none ml-auto px-7 py-3.5 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all whitespace-nowrap shrink-0"
            >
              <Shuffle className="w-4 h-4" />
              <span>立即开启真随机 10 题对战</span>
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
        title="逆向心理 · 100律 CSPRNG 博弈"
        numberPrefix="12"
        difficulty={difficulty}
        score={score}
        combo={combo}
        timeLeft={timeLeft}
        currentRound={currentIdx + 1}
        totalRounds={questions.length}
        onExit={() => setPhase('intro')}
        accentColor="#0D9488"
      />

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-lg space-y-5">
        {/* Card Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-100 text-xs">
          <div className="flex flex-wrap items-center gap-2 font-mono">
            <span className="font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
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
              title="收藏本条逆向心理学词条"
            >
              <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-amber-500 text-amber-500' : ''}`} />
            </button>
          </div>
        </div>

        {/* Prompt */}
        <div className="space-y-2">
          <h2 className="font-serif-editorial text-lg sm:text-xl font-bold text-stone-900 leading-snug">
            {currentQuestion.prompt}
          </h2>
          <p className="text-xs text-stone-500 font-mono">
            {currentQuestion.law.nameEn}
          </p>
        </div>

        {/* Options */}
        <div className="space-y-2.5">
          {currentQuestion.options.map((opt, idx) => {
            const isPicked = selectedOpt === idx;
            const isRight = idx === currentQuestion.correctAnswer;

            let cls =
              'bg-stone-50 hover:bg-teal-50/60 border-stone-200 text-stone-800 hover:border-teal-300';
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

        {/* Feedback Explanation & Boundary */}
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
                    <span>精准破译！定律掌握度 +25%</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-rose-500" />
                    <span>{selectedOpt === -1 ? '思考超时' : '思考角度有偏差'} · 重点复盘</span>
                  </>
                )}
              </div>
              <p>{currentQuestion.explanation}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-stone-700 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
              <div>
                <strong className="text-stone-900">诚实沟通与自主边界：</strong>
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

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  HelpCircle,
  Zap,
  Trophy,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Sparkles,
  Clock,
  MapPin,
  AlertCircle,
  Globe,
  BookOpen,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import { useFontScale } from '../context/FontScaleContext';
import { FloatingFontScaleControl } from '../components/ui/FloatingFontScaleControl';
import {
  CityQuizMapView,
  buildStagesForCapital,
} from '../components/quiz/CityQuizMapView';
import {
  useCityQuizProgress,
  checkChapterUnlocked,
  getCompletedChaptersList,
} from '../hooks/useCityQuizProgress';
import {
  WORLD_CAPITALS,
  CHAPTERS_PER_POINT,
  QUESTIONS_PER_CHAPTER,
} from '../data/worldCapitals';
import {
  generateChapterQuestions,
  CityChapterQuestion,
} from '../utils/cityQuizGenerator';
import { gameAudio } from '../utils/gameAudio';

interface ActiveQuizSession {
  cityIndex: number;
  pointIndex: number;
  chapterIndex: number;
}

interface UnlockOutcome {
  unlockedNextChapter: number | null;
  unlockedNextPoint: number | null;
  unlockedNextCity: number | null;
}

const formatElapsed = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export const RapidQuizPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, recordQuizCompletion, triggerConfetti } = useApp();
  const { fontScale } = useFontScale();

  const {
    progress,
    newlyUnlockedPointIndex,
    newlyUnlockedCityIndex,
    selectCity,
    selectPoint,
    selectChapter,
    setActiveCoordinates,
    completeChapter,
    resetAllProgress,
    clearNewlyUnlocked,
  } = useCityQuizProgress();

  const [session, setSession] = useState<ActiveQuizSession>({
    cityIndex: progress.activeCityIndex,
    pointIndex: progress.activePointIndex,
    chapterIndex: progress.activeChapterIndex,
  });
  const [questions, setQuestions] = useState<CityChapterQuestion[]>(() =>
    generateChapterQuestions(
      progress.activeCityIndex,
      progress.activePointIndex,
      progress.activeChapterIndex
    )
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [wrongAttempts, setWrongAttempts] = useState<number[]>([]);
  const [hasFoundCorrect, setHasFoundCorrect] = useState(false);
  const [firstTryCorrectCount, setFirstTryCorrectCount] = useState(0);
  const [totalWrongClicks, setTotalWrongClicks] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [earnedXpLastRun, setEarnedXpLastRun] = useState(0);
  const [unlockOutcome, setUnlockOutcome] = useState<UnlockOutcome>({
    unlockedNextChapter: null,
    unlockedNextPoint: null,
    unlockedNextCity: null,
  });
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'completed'>('intro');

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef(progress);
  progressRef.current = progress;
  const handledAutostartRef = useRef<string | null>(null);

  const startChapterQuiz = useCallback(
    (cityIndex: number, pointIndex: number, chapterIndex: number) => {
      if (!checkChapterUnlocked(progressRef.current, cityIndex, pointIndex, chapterIndex)) {
        return;
      }
      setActiveCoordinates(cityIndex, pointIndex, chapterIndex);
      const chapterQuestions = generateChapterQuestions(
        cityIndex,
        pointIndex,
        chapterIndex
      );
      setSession({ cityIndex, pointIndex, chapterIndex });
      setQuestions(chapterQuestions);
      setCurrentIndex(0);
      setWrongAttempts([]);
      setHasFoundCorrect(false);
      setFirstTryCorrectCount(0);
      setTotalWrongClicks(0);
      setScore(0);
      setCombo(0);
      setMaxCombo(0);
      setElapsedSeconds(0);
      setUnlockOutcome({
        unlockedNextChapter: null,
        unlockedNextPoint: null,
        unlockedNextCity: null,
      });
      clearNewlyUnlocked();
      setGameState('playing');
    },
    [setActiveCoordinates, clearNewlyUnlocked]
  );

  // Support deep-linking directly into any unlocked (city, point, chapter) from Dashboard or URL
  useEffect(() => {
    const autostartParam = searchParams.get('autostart');
    if (autostartParam !== '1') {
      handledAutostartRef.current = null;
      return;
    }

    const searchKey = searchParams.toString();
    if (handledAutostartRef.current === searchKey) {
      return;
    }
    handledAutostartRef.current = searchKey;

    const latestProgress = progressRef.current;
    const cityParam = Number(searchParams.get('city') ?? latestProgress.activeCityIndex);
    const pointParam = Number(searchParams.get('point') ?? latestProgress.activePointIndex);
    const chapterParam = Number(
      searchParams.get('chapter') ?? latestProgress.activeChapterIndex
    );

    if (
      Number.isInteger(cityParam) &&
      Number.isInteger(pointParam) &&
      Number.isInteger(chapterParam) &&
      checkChapterUnlocked(latestProgress, cityParam, pointParam, chapterParam)
    ) {
      startChapterQuiz(cityParam, pointParam, chapterParam);
    }
    setSearchParams({}, { replace: true });
  }, [searchParams, startChapterQuiz, setSearchParams]);

  // Study timer during active chapter play (does not skip unanswered questions)
  useEffect(() => {
    if (gameState !== 'playing') return;
    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState]);

  const handleSelectOption = (idx: number) => {
    if (hasFoundCorrect || wrongAttempts.includes(idx)) return;
    gameAudio.playTap();

    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    const isCorrect = idx === currentQ.correctAnswer;

    if (isCorrect) {
      setHasFoundCorrect(true);
      const isFirstTry = wrongAttempts.length === 0;
      if (isFirstTry) {
        const newCombo = combo + 1;
        setCombo(newCombo);
        setMaxCombo((prev) => Math.max(prev, newCombo));
        setFirstTryCorrectCount((prev) => prev + 1);
        setScore((prev) => prev + 120 + newCombo * 25);
      } else {
        setCombo(0);
        setScore((prev) => prev + 60);
      }
    } else {
      setWrongAttempts((prev) => [...prev, idx]);
      setTotalWrongClicks((prev) => prev + 1);
      setCombo(0);
    }
  };

  const handleNext = () => {
    if (!hasFoundCorrect) return;
    gameAudio.playTap();

    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setWrongAttempts([]);
      setHasFoundCorrect(false);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      const activeStages = buildStagesForCapital(
        WORLD_CAPITALS[session.cityIndex] || WORLD_CAPITALS[0]
      );
      const stageReward = activeStages[session.pointIndex]?.xpReward || 120;
      const earnedXp = Math.round(score / 10) + stageReward;

      setEarnedXpLastRun(earnedXp);
      recordQuizCompletion(firstTryCorrectCount, questions.length, earnedXp);
      const outcome = completeChapter(
        session.cityIndex,
        session.pointIndex,
        session.chapterIndex,
        triggerConfetti
      );
      setUnlockOutcome(outcome);
      setGameState('completed');
    }
  };

  const activeCity = WORLD_CAPITALS[progress.activeCityIndex] || WORLD_CAPITALS[0];
  const activeCityStages = buildStagesForCapital(activeCity);
  const activeStage = activeCityStages[progress.activePointIndex] || activeCityStages[0];

  const sessionCity = WORLD_CAPITALS[session.cityIndex] || WORLD_CAPITALS[0];
  const sessionStages = buildStagesForCapital(sessionCity);
  const sessionStage = sessionStages[session.pointIndex] || sessionStages[0];

  const completedChsInActivePoint = getCompletedChaptersList(
    progress,
    progress.activeCityIndex,
    progress.activePointIndex
  );

  const currentQ = questions[currentIndex];
  const firstTryAccuracy =
    questions.length > 0 ? Math.round((firstTryCorrectCount / questions.length) * 100) : 100;

  return (
    <div
      className={`flex flex-col items-center justify-start min-h-[75vh] w-full mx-auto py-4 sm:py-6 animate-fadeIn transition-[max-width] duration-200 ${
        gameState === 'playing'
          ? fontScale === 'xlarge'
            ? 'max-w-4xl'
            : 'max-w-3xl'
          : 'max-w-5xl'
      }`}
    >
      {gameState === 'intro' ? (
        <>
          {/* Top Header / Folio */}
          <div className="w-full flex flex-wrap items-center justify-between gap-2 mb-6 pb-3 border-b border-stone-200/80 text-xs sm:text-sm text-stone-600">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="editorial-kicker text-[11px] sm:text-xs text-stone-800">
                World Capitals Dialectics · 五十国首都心智闯关
              </span>
            </div>

            <div className="flex items-center gap-3.5 font-numeric text-xs sm:text-sm tabular-nums">
              <div className="flex items-center gap-1 text-stone-700">
                <Zap className="w-4 h-4 text-amber-600 fill-amber-600" />
                <span>连击 x{combo}</span>
              </div>
              <div className="flex items-center gap-1 text-stone-900 font-semibold">
                <Trophy className="w-4 h-4 text-stone-700" />
                <span>{score} 分</span>
              </div>
            </div>
          </div>

          <div className="w-full space-y-6">
            {/* 50-Capital Atlas Map View with Strict Sequential Locks */}
            <CityQuizMapView
              progress={progress}
              newlyUnlockedPointIndex={newlyUnlockedPointIndex}
              newlyUnlockedCityIndex={newlyUnlockedCityIndex}
              playerAvatar={user?.avatar}
              playerName={user?.name}
              onSelectCity={selectCity}
              onSelectPoint={selectPoint}
              onSelectChapter={selectChapter}
              onStartChapterQuiz={startChapterQuiz}
              onResetAllProgress={resetAllProgress}
            />

            {/* Curriculum Summary Card */}
            <div
              className="w-full editorial-card rounded-2xl p-6 sm:p-8 text-center space-y-4 quiz-font-scope"
              data-quiz-font-scale={fontScale}
            >
              <div className="w-10 h-10 rounded-full bg-stone-100 text-stone-800 flex items-center justify-center mx-auto">
                <HelpCircle className="w-5 h-5 stroke-[1.5]" />
              </div>

              <div className="space-y-1.5">
                <h2 className="font-serif-editorial text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
                  {activeCity.cityZh} · {activeStage.districtZh} — 第 {progress.activeChapterIndex + 1} 章
                </h2>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-xl mx-auto">
                  全部 50 座世界首都、每城 8 大站点、每站 10 个锁定递进章节均采用严格解锁机制：必须答完每章全部{' '}
                  {QUESTIONS_PER_CHAPTER} 道问卷并找出唯一正确答案，方可解锁下一章、下一站点与下一座世界首都（当前站点已完成{' '}
                  {completedChsInActivePoint.length}/{CHAPTERS_PER_POINT} 章）。
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  startChapterQuiz(
                    progress.activeCityIndex,
                    progress.activePointIndex,
                    progress.activeChapterIndex
                  )
                }
                className="w-full max-w-sm mx-auto py-3.5 px-6 rounded-xl chameleon-btn font-semibold text-xs sm:text-sm tracking-wide transition-all cursor-pointer block btn-tactile"
              >
                开启 {activeCity.cityZh} · 第 {progress.activeChapterIndex + 1} 章 ({QUESTIONS_PER_CHAPTER} 题)
              </button>
            </div>
          </div>
        </>
      ) : gameState === 'completed' ? (
        <div className="w-full space-y-6 animate-fadeIn">
          {/* Top Header / Folio */}
          <div
            className="w-full flex flex-wrap items-center justify-between gap-2 mb-6 pb-3 border-b border-stone-200/80 text-xs sm:text-sm text-stone-600 quiz-font-scope"
            data-quiz-font-scale={fontScale}
          >
            <div className="flex items-center gap-2 flex-wrap">
              <span className="editorial-kicker text-[11px] sm:text-xs text-stone-800">
                World Capitals Dialectics · 五十国首都心智闯关
              </span>
            </div>

            <div className="flex items-center gap-3.5 font-numeric text-xs sm:text-sm tabular-nums">
              <div className="flex items-center gap-1 text-stone-700">
                <Zap className="w-4 h-4 text-amber-600 fill-amber-600" />
                <span>连击 x{combo}</span>
              </div>
              <div className="flex items-center gap-1 text-stone-900 font-semibold">
                <Trophy className="w-4 h-4 text-stone-700" />
                <span>{score} 分</span>
              </div>
            </div>
          </div>

          {/* Chapter Completion & Unlock Celebration Card */}
          <div
            className="w-full editorial-card rounded-2xl p-7 sm:p-9 text-center space-y-5 quiz-font-scope"
            data-quiz-font-scale={fontScale}
          >
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center mx-auto">
              <Trophy className="w-6 h-6 stroke-[1.5]" />
            </div>

            <div className="space-y-1.5">
              <span className="editorial-kicker text-[10px] text-emerald-700 font-bold tracking-widest block">
                {unlockOutcome.unlockedNextCity !== null
                  ? `NOUVELLE CAPITALE DÉBLOQUÉE · 新世界首都已解锁`
                  : unlockOutcome.unlockedNextPoint !== null
                  ? `NOUVEAU SECTEUR DÉBLOQUÉ · 新街区站点已解锁`
                  : unlockOutcome.unlockedNextChapter !== null
                  ? `CHAPITRE VALIDÉ · 已解锁第 ${unlockOutcome.unlockedNextChapter + 1} 章`
                  : `CHAPITRE ACCOMPLI · 本章 ${QUESTIONS_PER_CHAPTER}/${QUESTIONS_PER_CHAPTER} 题全数过关`}
              </span>
              <h2 className="font-serif-editorial text-2xl sm:text-3xl font-bold text-stone-900">
                {sessionCity.cityZh} · {sessionStage.districtZh} · 第 {session.chapterIndex + 1} 章通关
              </h2>
              <p className="text-xs sm:text-sm text-stone-600">
                全部{' '}
                <strong className="text-stone-900 font-semibold font-numeric">
                  {questions.length} / {questions.length}
                </strong>{' '}
                道题已找准正确答案 · 一次命中率{' '}
                <strong className="text-emerald-800 font-semibold font-numeric">
                  {firstTryAccuracy}%
                </strong>
                {totalWrongClicks > 0 && `（期间纠错 ${totalWrongClicks} 次）`}
              </p>

              {unlockOutcome.unlockedNextCity !== null && (
                <div className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs sm:text-sm font-semibold">
                  <Globe className="w-4 h-4 text-amber-700" />
                  <span>
                    恭喜！新世界首都地图「
                    {WORLD_CAPITALS[unlockOutcome.unlockedNextCity]?.cityZh} (
                    {WORLD_CAPITALS[unlockOutcome.unlockedNextCity]?.cityFr})」现已开启！
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-3 max-w-xl mx-auto">
              <div className="bg-[#FAF8F5] p-3.5 rounded-xl border border-stone-200/60">
                <span className="text-[11px] text-stone-500 font-medium block">本章答题</span>
                <span className="text-lg font-bold text-stone-900 font-numeric tabular-nums">
                  {questions.length}/{questions.length}
                </span>
              </div>
              <div className="bg-[#FAF8F5] p-3.5 rounded-xl border border-stone-200/60">
                <span className="text-[11px] text-stone-500 font-medium block">总得分</span>
                <span className="text-lg font-bold text-stone-900 font-numeric tabular-nums">
                  {score}
                </span>
              </div>
              <div className="bg-[#FAF8F5] p-3.5 rounded-xl border border-stone-200/60">
                <span className="text-[11px] text-stone-500 font-medium block">最高连击</span>
                <span className="text-lg font-bold text-stone-900 font-numeric tabular-nums">
                  {maxCombo} 次
                </span>
              </div>
              <div className="bg-[#FAF8F5] p-3.5 rounded-xl border border-stone-200/60">
                <span className="text-[11px] text-stone-500 font-medium block">获得经验</span>
                <span className="text-lg font-bold text-emerald-800 font-numeric tabular-nums">
                  +{earnedXpLastRun} XP
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-1 max-w-lg mx-auto">
              <button
                type="button"
                onClick={() =>
                  startChapterQuiz(
                    progress.activeCityIndex,
                    progress.activePointIndex,
                    progress.activeChapterIndex
                  )
                }
                className="flex-1 min-h-[44px] py-3 px-4 rounded-xl chameleon-btn font-semibold text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>
                  挑战下一目标：{activeCity.cityZh} · {activeStage.roman}.{' '}
                  第 {progress.activeChapterIndex + 1} 章
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setGameState('intro')}
                className="min-h-[44px] py-3 px-4 rounded-xl bg-white border border-stone-200 hover:border-stone-400 text-stone-800 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
              >
                切换地图
              </button>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="min-h-[44px] py-3 px-4 rounded-xl bg-white border border-stone-200 hover:border-stone-400 text-stone-800 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
              >
                返回首页
              </button>
            </div>
          </div>

          {/* Live Map Progression right after completing the 20-question chapter */}
          <CityQuizMapView
            progress={progress}
            newlyUnlockedPointIndex={newlyUnlockedPointIndex}
            newlyUnlockedCityIndex={newlyUnlockedCityIndex}
            playerAvatar={user?.avatar}
            playerName={user?.name}
            onSelectCity={selectCity}
            onSelectPoint={selectPoint}
            onSelectChapter={selectChapter}
            onStartChapterQuiz={startChapterQuiz}
            onResetAllProgress={resetAllProgress}
          />
        </div>
      ) : (
        /* Playing Question Arena: 20 Questionnaires, Must Find the Right Answer */
        <>
          <div
            className="w-full flex flex-col items-center space-y-5 quiz-font-scope"
            data-quiz-font-scale={fontScale}
          >
            {/* Top Header / Folio inside Quiz Font Scope */}
            <div className="w-full flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-200/80 text-xs sm:text-sm text-stone-600">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="editorial-kicker text-[11px] sm:text-xs text-stone-800">
                  World Capitals Dialectics · 五十国首都心智闯关
                </span>
                <span className="font-numeric font-semibold text-stone-700 tabular-nums">
                  第 {currentIndex + 1} / {questions.length} 题
                </span>
              </div>

              <div className="flex items-center gap-3.5 font-numeric text-xs sm:text-sm tabular-nums">
                <div className="flex items-center gap-1.5 text-stone-700 font-semibold">
                  <Clock className="w-4 h-4 text-stone-500" />
                  <span>{formatElapsed(elapsedSeconds)}</span>
                </div>
                <div className="flex items-center gap-1 text-stone-700">
                  <Zap className="w-4 h-4 text-amber-600 fill-amber-600" />
                  <span>连击 x{combo}</span>
                </div>
                <div className="flex items-center gap-1 text-stone-900 font-semibold">
                  <Trophy className="w-4 h-4 text-stone-700" />
                  <span>{score} 分</span>
                </div>
              </div>
            </div>

            {/* Active Capital / Point / Chapter Banner */}
            <div className="w-full flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 rounded-xl bg-stone-100/85 border border-stone-200/80 text-xs sm:text-sm">
              <div className="flex items-center gap-2 font-semibold text-stone-800 flex-wrap">
                <MapPin className="w-4 h-4 text-amber-700 shrink-0" />
                <span>
                  {sessionCity.cityZh} ({sessionCity.cityFr})
                </span>
                <span className="text-stone-400" aria-hidden="true">·</span>
                <span>
                  {sessionStage.roman}. {sessionStage.districtZh}
                </span>
                <span className="text-stone-400" aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1 text-amber-900">
                  <BookOpen className="w-3.5 h-3.5" />
                  第 {session.chapterIndex + 1} / {CHAPTERS_PER_POINT} 章
                </span>
              </div>
              <button
                type="button"
                onClick={() => setGameState('intro')}
                className="text-xs sm:text-sm font-medium text-stone-600 hover:text-stone-900 underline cursor-pointer whitespace-nowrap"
              >
                返回世界地图册
              </button>
            </div>

            {/* 20-Question Progress bar */}
            <div className="w-full space-y-1.5">
              <div className="flex items-center justify-between text-xs sm:text-sm text-stone-500 font-numeric tabular-nums">
                <span>本章必答进展 · 需找出每题唯一正确答案</span>
                <span className="font-semibold text-stone-800">
                  {currentIndex + (hasFoundCorrect ? 1 : 0)} / {questions.length} 题
                </span>
              </div>
              <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                <motion.div
                  className="h-full chameleon-bar"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${
                      ((currentIndex + (hasFoundCorrect ? 1 : 0.15)) / questions.length) * 100
                    }%`,
                  }}
                  transition={{ type: 'spring', stiffness: 140, damping: 20 }}
                />
              </div>
            </div>

            {currentQ && (
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentQ.id + '-' + currentIndex}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.2 }}
                  className="w-full editorial-card rounded-2xl p-6 sm:p-9 md:p-10 space-y-6 sm:space-y-7"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm sm:text-base pb-3.5 border-b border-stone-200/80">
                    <span className="font-serif-editorial italic text-stone-700 font-medium">
                      {currentQ.chapterTheme} · {currentQ.category}领域
                    </span>
                    <span className="text-stone-500 font-medium font-numeric tabular-nums">
                      第 {currentIndex + 1}/{questions.length} 题 · 难度 {currentQ.difficulty}
                    </span>
                  </div>

                  <h3 className="font-serif-editorial text-xl sm:text-2xl md:text-3xl font-bold text-stone-900 leading-relaxed">
                    {currentQ.question}
                  </h3>

                  {/* Gentle Retry Hint if user picked wrong option(s) before finding the correct answer */}
                  {!hasFoundCorrect && wrongAttempts.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-sm sm:text-base font-medium"
                    >
                      <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                      <span>
                        该选项有误 — 请继续思考并在其余选项中找出唯一正确答案，即可推进至下一题。
                      </span>
                    </motion.div>
                  )}

                  {/* Options */}
                  <div className="space-y-3.5">
                    {currentQ.options.map((opt, idx) => {
                      const isWrongTried = wrongAttempts.includes(idx);
                      const isCorrectOption = idx === currentQ.correctAnswer;
                      const showSuccess = hasFoundCorrect && isCorrectOption;
                      const isDisabled = hasFoundCorrect || isWrongTried;
                      const optionLetter = String.fromCharCode(65 + idx);

                      return (
                        <button
                          key={idx}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => handleSelectOption(idx)}
                          className={`w-full text-left p-4 sm:p-5 rounded-xl border-2 text-base sm:text-lg font-semibold leading-relaxed transition-colors flex items-center justify-between gap-3 ${
                            showSuccess
                              ? 'bg-emerald-50 border-emerald-400 text-emerald-950 cursor-default'
                              : isWrongTried
                              ? 'bg-rose-50/70 border-rose-300 text-rose-800/75 opacity-75 cursor-not-allowed'
                              : hasFoundCorrect
                              ? 'bg-stone-50 border-stone-200 text-stone-400 cursor-default'
                              : 'bg-white hover:bg-stone-50 border-stone-200 hover:border-stone-500 text-stone-900 cursor-pointer'
                          }`}
                        >
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <span
                              className={`min-w-[1.85rem] h-[1.85rem] sm:min-w-[2.1rem] sm:h-[2.1rem] px-1 rounded-lg flex items-center justify-center text-xs sm:text-sm font-mono font-bold shrink-0 mt-0.5 ${
                                showSuccess
                                  ? 'bg-emerald-600 text-white'
                                  : isWrongTried
                                  ? 'bg-rose-600 text-white'
                                  : 'bg-stone-100 text-stone-700'
                              }`}
                            >
                              {optionLetter}
                            </span>
                            <span className="min-w-0 flex-1 break-words">{opt}</span>
                          </div>
                          {showSuccess && (
                            <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-700 shrink-0 ml-2" />
                          )}
                          {isWrongTried && (
                            <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-rose-500 shrink-0 ml-2" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Explanation & Next button revealed once the correct answer is found */}
                  {hasFoundCorrect && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-5 sm:p-6 rounded-xl bg-[#FAF8F5] border border-stone-200/80 space-y-4"
                    >
                      <div className="flex items-center gap-2 text-sm sm:text-base font-bold text-stone-900 font-serif-editorial">
                        <Sparkles className="w-4 h-4 text-emerald-700" />
                        <span>已找到正确答案 · 理论解析与都市洞察</span>
                      </div>
                      <p className="text-base sm:text-lg text-stone-700 leading-relaxed">
                        {currentQ.explanation}
                      </p>
                      <button
                        type="button"
                        onClick={handleNext}
                        className="w-full mt-2 py-3.5 sm:py-4 chameleon-btn font-bold text-sm sm:text-base rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>
                          {currentIndex < questions.length - 1
                            ? `继续下一题 (${currentIndex + 2} / ${questions.length})`
                            : `完成第 ${session.chapterIndex + 1} 章 (${questions.length}/${questions.length}) 并解锁下一关`}
                        </span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </motion.div>
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </div>

          <FloatingFontScaleControl />
        </>
      )}
    </div>
  );
};


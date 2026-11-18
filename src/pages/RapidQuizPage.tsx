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
  BookOpen,
  Shuffle,
  RotateCcw,
  Lightbulb,
  Flame,
  Eye,
  ShieldAlert,
  Loader2,
  Wand2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import { useFontScale } from '../context/FontScaleContext';
import { FloatingFontScaleControl } from '../components/ui/FloatingFontScaleControl';
import {
  CityQuizMapView,
  buildStagesForCapital,
} from '../components/quiz/CityQuizMapView';
import { RapidQuizProgressBar } from '../components/quiz/RapidQuizProgressBar';
import { CapitalLevelCelebrationCard } from '../components/quiz/CapitalLevelCelebrationCard';
import { GlobalCognitiveRankCard } from '../components/quiz/GlobalCognitiveRankCard';
import { CognitiveStreakBadge } from '../components/quiz/CognitiveStreakBadge';
import {
  useCityQuizProgress,
  checkChapterUnlocked,
  checkChapterCompleted,
  checkCityCompleted,
  getCompletedChaptersList,
  getTotalCompletedChapters,
} from '../hooks/useCityQuizProgress';
import {
  WORLD_CAPITALS,
  CHAPTERS_PER_POINT,
  QUESTIONS_PER_CHAPTER,
} from '../data/worldCapitals';
import {
  generateChapterQuestions,
  getRapidQuizSequenceStats,
  resetRapidQuizSequenceHistory,
  CityChapterQuestion,
} from '../utils/cityQuizGenerator';
import {
  getRapidQuizAccuracyStats,
  recordRapidQuizAccuracyRun,
  submitRapidQuizRankToLeaderboard,
} from '../services/globalCognitiveRankService';
import {
  MAX_FOCUS_ENERGY,
  INITIAL_FOCUS_ENERGY,
  HINT_ENERGY_COST,
  FIRST_TRY_ENERGY_REWARD,
  STREAK_ENERGY_REWARD,
  CognitiveHintPayload,
  buildSocraticCognitiveHint,
} from '../utils/cognitiveHintGenerator';
import {
  getCognitiveStreakSummary,
  recordDailyQuizLevelForStreak,
} from '../services/cognitiveStreakService';
import {
  MICROEXPRESSION_QUIZ_SCENARIOS,
  generateMicroexpressionChallengeRun,
  pickRandomMicroexpressionScenarioItem,
} from '../data/microexpressionQuizScenarios';
import { generateAiMicroexpressionQuestion } from '../services/microexpressionAiService';
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
  const { user, firebaseUser, laws, recordQuizCompletion, updateLawMastery, triggerConfetti } =
    useApp();
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
  const [questions, setQuestions] = useState<CityChapterQuestion[]>([]);
  const [sequenceStats, setSequenceStats] = useState(() => getRapidQuizSequenceStats());
  const [accuracyStats, setAccuracyStats] = useState(() => getRapidQuizAccuracyStats());
  const [cognitiveStreak, setCognitiveStreak] = useState(() => getCognitiveStreakSummary());
  const [lastRunAccuracy, setLastRunAccuracy] = useState<number | null>(null);
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
  const [focusEnergy, setFocusEnergy] = useState(INITIAL_FOCUS_ENERGY);
  const [energyDeltaLabel, setEnergyDeltaLabel] = useState<string | null>(null);
  const [revealedHintsByIndex, setRevealedHintsByIndex] = useState<
    Record<number, CognitiveHintPayload>
  >({});
  const [unlockOutcome, setUnlockOutcome] = useState<UnlockOutcome>({
    unlockedNextChapter: null,
    unlockedNextPoint: null,
    unlockedNextCity: null,
  });
  const [quizMode, setQuizMode] = useState<'capital' | 'microexpressions' | 'ai-microexpression'>(
    'capital'
  );
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiRecentLawIds, setAiRecentLawIds] = useState<string[]>([]);
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'completed'>('intro');

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const energyDeltaTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressRef = useRef(progress);
  progressRef.current = progress;
  const handledAutostartRef = useRef<string | null>(null);

  const flashEnergyDelta = useCallback((label: string) => {
    setEnergyDeltaLabel(label);
    if (energyDeltaTimerRef.current) {
      clearTimeout(energyDeltaTimerRef.current);
    }
    energyDeltaTimerRef.current = setTimeout(() => {
      setEnergyDeltaLabel(null);
    }, 1800);
  }, []);

  useEffect(() => {
    return () => {
      if (energyDeltaTimerRef.current) {
        clearTimeout(energyDeltaTimerRef.current);
      }
    };
  }, []);

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
      setQuizMode('capital');
      setAiError(null);
      setSession({ cityIndex, pointIndex, chapterIndex });
      setQuestions(chapterQuestions);
      setSequenceStats(getRapidQuizSequenceStats());
      setCurrentIndex(0);
      setWrongAttempts([]);
      setHasFoundCorrect(false);
      setFirstTryCorrectCount(0);
      setTotalWrongClicks(0);
      setScore(0);
      setCombo(0);
      setMaxCombo(0);
      setElapsedSeconds(0);
      setFocusEnergy(INITIAL_FOCUS_ENERGY);
      setEnergyDeltaLabel(null);
      setRevealedHintsByIndex({});
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

  const startMicroexpressionQuiz = useCallback(
    (priorityLawId?: string) => {
      const microQuestions = generateMicroexpressionChallengeRun(priorityLawId);
      setQuizMode('microexpressions');
      setAiError(null);
      setQuestions(microQuestions);
      setSequenceStats(getRapidQuizSequenceStats());
      setCurrentIndex(0);
      setWrongAttempts([]);
      setHasFoundCorrect(false);
      setFirstTryCorrectCount(0);
      setTotalWrongClicks(0);
      setScore(0);
      setCombo(0);
      setMaxCombo(0);
      setElapsedSeconds(0);
      setFocusEnergy(INITIAL_FOCUS_ENERGY);
      setEnergyDeltaLabel(null);
      setRevealedHintsByIndex({});
      setUnlockOutcome({
        unlockedNextChapter: null,
        unlockedNextPoint: null,
        unlockedNextCity: null,
      });
      clearNewlyUnlocked();
      setGameState('playing');
    },
    [clearNewlyUnlocked]
  );

  const startAiMicroexpressionQuiz = useCallback(
    async (specificLawId?: string) => {
      if (aiGenerating) return;
      setAiGenerating(true);
      setAiError(null);
      try {
        const chosenLawId =
          specificLawId || pickRandomMicroexpressionScenarioItem(aiRecentLawIds).lawId;
        const aiQuestion = await generateAiMicroexpressionQuestion({
          lawId: chosenLawId,
          excludeLawIds: aiRecentLawIds,
        });
        setAiRecentLawIds((prev) =>
          [...prev.filter((id) => id !== aiQuestion.relatedLawId), aiQuestion.relatedLawId || chosenLawId].slice(
            -9
          )
        );
        setQuizMode('ai-microexpression');
        setQuestions([aiQuestion]);
        setSequenceStats(getRapidQuizSequenceStats());
        setCurrentIndex(0);
        setWrongAttempts([]);
        setHasFoundCorrect(false);
        setFirstTryCorrectCount(0);
        setTotalWrongClicks(0);
        setScore(0);
        setCombo(0);
        setMaxCombo(0);
        setElapsedSeconds(0);
        setFocusEnergy(INITIAL_FOCUS_ENERGY);
        setEnergyDeltaLabel(null);
        setRevealedHintsByIndex({});
        setUnlockOutcome({
          unlockedNextChapter: null,
          unlockedNextPoint: null,
          unlockedNextCity: null,
        });
        clearNewlyUnlocked();
        setGameState('playing');
      } catch (err: any) {
        setAiError(err?.message || 'AI 生成互动微表情诊断场景失败，请重试。');
      } finally {
        setAiGenerating(false);
      }
    },
    [aiGenerating, aiRecentLawIds, clearNewlyUnlocked]
  );

  const handleAppendNextAiQuestion = useCallback(async () => {
    if (aiGenerating) return;
    setAiGenerating(true);
    setAiError(null);
    try {
      const nextLaw = pickRandomMicroexpressionScenarioItem(aiRecentLawIds);
      const aiQuestion = await generateAiMicroexpressionQuestion({
        lawId: nextLaw.lawId,
        excludeLawIds: aiRecentLawIds,
      });
      setAiRecentLawIds((prev) =>
        [...prev.filter((id) => id !== aiQuestion.relatedLawId), aiQuestion.relatedLawId || nextLaw.lawId].slice(
          -9
        )
      );
      setQuestions((prev) => [...prev, aiQuestion]);
      setCurrentIndex((prev) => prev + 1);
      setWrongAttempts([]);
      setHasFoundCorrect(false);
    } catch (err: any) {
      setAiError(err?.message || 'AI 生成下一道微表情情感冲突场景失败，请重试。');
    } finally {
      setAiGenerating(false);
    }
  }, [aiGenerating, aiRecentLawIds]);

  const handleInjectAiQuestionIntoActiveQuiz = useCallback(async () => {
    if (aiGenerating) return;
    setAiGenerating(true);
    setAiError(null);
    try {
      const nextLaw = pickRandomMicroexpressionScenarioItem(aiRecentLawIds);
      const activeCityName =
        quizMode === 'capital'
          ? (WORLD_CAPITALS[session.cityIndex] || WORLD_CAPITALS[0]).cityZh
          : '';
      const aiQuestion = await generateAiMicroexpressionQuestion({
        lawId: nextLaw.lawId,
        excludeLawIds: aiRecentLawIds,
        cityContext: activeCityName,
      });
      setAiRecentLawIds((prev) =>
        [...prev.filter((id) => id !== aiQuestion.relatedLawId), aiQuestion.relatedLawId || nextLaw.lawId].slice(
          -9
        )
      );

      if (hasFoundCorrect) {
        const insertAt = currentIndex + 1;
        setQuestions((prev) => [
          ...prev.slice(0, insertAt),
          aiQuestion,
          ...prev.slice(insertAt),
        ]);
        setCurrentIndex(insertAt);
      } else {
        // Insert right at currentIndex so user diagnoses the fresh AI conflict immediately without losing the displaced item
        setQuestions((prev) => [
          ...prev.slice(0, currentIndex),
          aiQuestion,
          ...prev.slice(currentIndex),
        ]);
      }
      setWrongAttempts([]);
      setHasFoundCorrect(false);
    } catch (err: any) {
      setAiError(err?.message || 'AI 实时生成加试题失败，请重试。');
    } finally {
      setAiGenerating(false);
    }
  }, [aiGenerating, aiRecentLawIds, currentIndex, hasFoundCorrect, quizMode, session.cityIndex]);

  // Support deep-linking directly into any unlocked (city, point, chapter) or dedicated microexpression gauntlet
  useEffect(() => {
    const modeParam = searchParams.get('mode');
    const autostartParam = searchParams.get('autostart');
    if (modeParam !== 'microexpressions' && autostartParam !== '1') {
      handledAutostartRef.current = null;
      return;
    }

    const searchKey = searchParams.toString();
    if (handledAutostartRef.current === searchKey) {
      return;
    }
    handledAutostartRef.current = searchKey;

    if (modeParam === 'microexpressions') {
      const lawParam = searchParams.get('law') || undefined;
      startMicroexpressionQuiz(lawParam);
      setSearchParams({}, { replace: true });
      return;
    }

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
  }, [searchParams, startChapterQuiz, startMicroexpressionQuiz, setSearchParams]);

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
      if (currentQ.relatedLawId?.startsWith('ml-')) {
        updateLawMastery(currentQ.relatedLawId, isFirstTry ? 95 : 82);
      }
      if (isFirstTry) {
        const newCombo = combo + 1;
        setCombo(newCombo);
        setMaxCombo((prev) => Math.max(prev, newCombo));
        setFirstTryCorrectCount((prev) => prev + 1);
        setScore((prev) => prev + 120 + newCombo * 25);
        const energyGain = newCombo >= 3 ? STREAK_ENERGY_REWARD : FIRST_TRY_ENERGY_REWARD;
        setFocusEnergy((prev) => {
          const next = Math.min(MAX_FOCUS_ENERGY, prev + energyGain);
          if (next > prev) {
            flashEnergyDelta(`+${next - prev} 专注能量`);
          }
          return next;
        });
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

  const handleRequestCognitiveHint = () => {
    const activeQuestion = questions[currentIndex];
    if (
      !activeQuestion ||
      hasFoundCorrect ||
      revealedHintsByIndex[currentIndex] ||
      focusEnergy < HINT_ENERGY_COST
    ) {
      return;
    }
    gameAudio.playSelect();
    const linkedLaw = activeQuestion.relatedLawId
      ? laws.find((item) => item.id === activeQuestion.relatedLawId)
      : undefined;
    const hintPayload = buildSocraticCognitiveHint(
      activeQuestion,
      linkedLaw,
      WORLD_CAPITALS[session.cityIndex] || WORLD_CAPITALS[0]
    );
    setFocusEnergy((prev) => Math.max(0, prev - HINT_ENERGY_COST));
    flashEnergyDelta(`-${HINT_ENERGY_COST} 专注能量`);
    setRevealedHintsByIndex((prev) => ({
      ...prev,
      [currentIndex]: hintPayload,
    }));
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

      if (quizMode === 'microexpressions' || quizMode === 'ai-microexpression') {
        const earnedXp =
          quizMode === 'ai-microexpression'
            ? Math.round(score / 10) + Math.max(80, questions.length * 45)
            : Math.round(score / 10) + 180;
        setEarnedXpLastRun(earnedXp);
        gameAudio.playVictory();
        triggerConfetti();
        const updatedAccuracyStats = recordRapidQuizAccuracyRun(
          firstTryCorrectCount,
          questions.length
        );
        setAccuracyStats(updatedAccuracyStats);
        setCognitiveStreak(recordDailyQuizLevelForStreak());
        setLastRunAccuracy(
          questions.length > 0 ? Math.round((firstTryCorrectCount / questions.length) * 100) : 100
        );
        recordQuizCompletion(firstTryCorrectCount, questions.length, earnedXp);
        setGameState('completed');
        return;
      }

      const activeStages = buildStagesForCapital(
        WORLD_CAPITALS[session.cityIndex] || WORLD_CAPITALS[0]
      );
      const stageReward = activeStages[session.pointIndex]?.xpReward || 120;
      const earnedXp = Math.round(score / 10) + stageReward;

      setEarnedXpLastRun(earnedXp);
      gameAudio.playVictory();
      const updatedAccuracyStats = recordRapidQuizAccuracyRun(
        firstTryCorrectCount,
        questions.length
      );
      setAccuracyStats(updatedAccuracyStats);
      setCognitiveStreak(recordDailyQuizLevelForStreak());
      setLastRunAccuracy(
        questions.length > 0 ? Math.round((firstTryCorrectCount / questions.length) * 100) : 100
      );

      recordQuizCompletion(firstTryCorrectCount, questions.length, earnedXp);
      const wasChapterDoneBefore = checkChapterCompleted(
        progress,
        session.cityIndex,
        session.pointIndex,
        session.chapterIndex
      );
      const totalLevelsAfter =
        getTotalCompletedChapters(progress) + (wasChapterDoneBefore ? 0 : 1);
      let completedCapitalsCount = 0;
      for (let c = 0; c < WORLD_CAPITALS.length; c++) {
        if (checkCityCompleted(progress, c)) completedCapitalsCount++;
      }

      const outcome = completeChapter(
        session.cityIndex,
        session.pointIndex,
        session.chapterIndex,
        triggerConfetti
      );
      if (outcome.unlockedNextCity !== null) {
        completedCapitalsCount = Math.min(WORLD_CAPITALS.length, completedCapitalsCount + 1);
      }

      if (firebaseUser) {
        void submitRapidQuizRankToLeaderboard({
          userId: firebaseUser.uid,
          userName: user.name,
          userAvatar: user.avatar,
          userTitle: user.title,
          userLevel: user.level,
          levelsCompleted: totalLevelsAfter,
          capitalsCompleted: completedCapitalsCount,
          accuracy: updatedAccuracyStats.averageAccuracy,
          streak: user.streak,
        });
      }

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

            <div className="flex items-center gap-3.5 font-numeric text-xs sm:text-sm tabular-nums flex-wrap justify-end">
              <div className="flex items-center gap-1 text-stone-700">
                <Zap className="w-4 h-4 text-amber-600 fill-amber-600" />
                <span>连击 x{combo}</span>
              </div>
              <div className="flex items-center gap-1 text-stone-900 font-semibold">
                <Trophy className="w-4 h-4 text-stone-700" />
                <span>{score} 分</span>
              </div>
              <CognitiveStreakBadge streak={cognitiveStreak} />
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
                  全部 50 座世界首都、每城 8 大站点、每站 10 个锁定递进章节均采用严格解锁与{' '}
                  <strong className="text-stone-900">CSPRNG 防重复随机序列算法</strong>：串联{' '}
                  {sequenceStats.totalLoveLaws} 条心理学定律 + {sequenceStats.totalMicroLaws} 条微表情与面部动作实案（每关动态注入 2 道社会互动实案），每次作答与重玩均实时重构题序、思辨视角与选项排列（已探索{' '}
                  <strong className="text-rose-700 font-numeric">
                    {sequenceStats.seenVariantsCount.toLocaleString()} /{' '}
                    {sequenceStats.totalUniqueQuestionVariants.toLocaleString()}
                  </strong>{' '}
                  张不重复变式，当前站点已完成 {completedChsInActivePoint.length}/{CHAPTERS_PER_POINT} 章）。
                </p>
              </div>

              <div className="max-w-3xl mx-auto">
                <RapidQuizProgressBar
                  progress={progress}
                  cityIndex={progress.activeCityIndex}
                  pointIndex={progress.activePointIndex}
                  chapterIndex={progress.activeChapterIndex}
                  answeredInSequence={0}
                  totalInSequence={QUESTIONS_PER_CHAPTER}
                  mode="intro"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 max-w-md mx-auto">
                <button
                  type="button"
                  onClick={() =>
                    startChapterQuiz(
                      progress.activeCityIndex,
                      progress.activePointIndex,
                      progress.activeChapterIndex
                    )
                  }
                  className="w-full sm:flex-1 py-3.5 px-6 rounded-xl chameleon-btn font-semibold text-xs sm:text-sm tracking-wide transition-all cursor-pointer flex items-center justify-center gap-2 btn-tactile"
                >
                  <Shuffle className="w-4 h-4 shrink-0" />
                  <span>
                    开启 {activeCity.cityZh} · 第 {progress.activeChapterIndex + 1} 章 ({QUESTIONS_PER_CHAPTER} 题)
                  </span>
                </button>
                {sequenceStats.seenVariantsCount > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      gameAudio.playTap();
                      resetRapidQuizSequenceHistory();
                      setSequenceStats(getRapidQuizSequenceStats());
                    }}
                    className="py-3.5 px-4 rounded-xl bg-white border border-stone-200 hover:border-stone-400 text-stone-700 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                    title="清空防重复序列记忆，重置全部 50 城题序池"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>重置题序池</span>
                  </button>
                )}
              </div>
            </div>

            {/* Dedicated Microexpressions & Facial Action Social-Interaction Gauntlet (ML001-ML010) */}
            <section
              className="w-full editorial-card rounded-2xl p-6 sm:p-8 space-y-6 quiz-font-scope"
              data-quiz-font-scale={fontScale}
              aria-labelledby="microexpressions-gauntlet-heading"
            >
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-stone-200/80">
                <div className="space-y-2 max-w-2xl">
                  <div className="flex items-center gap-2 text-xs text-stone-500">
                    <Eye className="w-4 h-4 text-stone-800 shrink-0" aria-hidden="true" />
                    <span>Microexpressions and Facial Action</span>
                    <span aria-hidden="true">·</span>
                    <span>ML001–ML010 模拟社会互动专场</span>
                  </div>
                  <h2
                    id="microexpressions-gauntlet-heading"
                    className="font-serif-editorial text-xl sm:text-2xl font-bold text-stone-900 tracking-tight text-balance"
                  >
                    微表情与面部动作 · 10 律全真社会互动解码挑战
                  </h2>
                  <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                    逐一进入医院急诊、咨询室、发布会、评审会与职场沟通等真实叙事场景，在语境中识别对应的 FACS 动作单元（AU1 / AU2 / AU4 / AU5 / AU6 / AU12 / AU15）及现代情绪科学边界原则（Coles et al., 2019；Barrett et al., 2019）。
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    disabled={aiGenerating}
                    onClick={() => void startAiMicroexpressionQuiz()}
                    className="min-h-[44px] py-3 px-5 rounded-xl chameleon-btn font-semibold text-xs sm:text-sm whitespace-nowrap shrink-0 cursor-pointer inline-flex items-center justify-center gap-2 btn-tactile disabled:opacity-65 disabled:cursor-wait"
                  >
                    {aiGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
                        <span>AI 正在生成情感冲突诊断场景…</span>
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                        <span>AI 随机抽取定律生成冲突诊断题</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => startMicroexpressionQuiz()}
                    className="min-h-[44px] py-3 px-5 rounded-xl bg-white border border-stone-300 hover:border-stone-500 text-stone-900 font-semibold text-xs sm:text-sm whitespace-nowrap shrink-0 cursor-pointer inline-flex items-center justify-center gap-2"
                  >
                    <Shuffle className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>精选 10 律全套挑战 (10 题)</span>
                  </button>
                </div>
              </div>

              {aiError && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs sm:text-sm">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
                    <span>{aiError}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => void startAiMicroexpressionQuiz()}
                      className="px-3 py-1.5 rounded-lg bg-white border border-rose-300 hover:border-rose-500 text-rose-900 font-semibold text-xs cursor-pointer"
                    >
                      重试 AI 生成
                    </button>
                    <button
                      type="button"
                      onClick={() => setAiError(null)}
                      className="px-2.5 py-1.5 text-rose-700 hover:text-rose-950 text-xs cursor-pointer"
                    >
                      关闭
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {MICROEXPRESSION_QUIZ_SCENARIOS.map((item) => {
                  const masteryScore = user?.lawMasteryMap?.[item.lawId] ?? 0;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => startMicroexpressionQuiz(item.lawId)}
                      className="text-left p-4 rounded-xl bg-white border border-stone-200 hover:border-stone-500 hover:bg-[#FAF8F5] transition-colors flex flex-col justify-between gap-2.5 cursor-pointer group"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2 text-xs text-stone-500 font-numeric tabular-nums">
                          <span>
                            {item.codeId} · {item.category}排行 #{item.categoryRank} · {item.difficulty}
                          </span>
                          <span className="font-semibold text-stone-700">
                            {masteryScore > 0 ? `掌握度 ${masteryScore}%` : '待解码'}
                          </span>
                        </div>
                        <h3 className="font-serif-editorial text-base font-bold text-stone-900 group-hover:text-stone-950">
                          {item.narrativeTitle}
                        </h3>
                        <p className="text-xs text-stone-600 line-clamp-1">{item.setting}</p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs font-medium text-stone-700">
                        <span>身份线索：{item.actionUnitCode} 边界识别</span>
                        <span className="inline-flex items-center gap-1 text-stone-900 group-hover:translate-x-0.5 transition-transform whitespace-nowrap shrink-0">
                          <span>直达此实案</span>
                          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Global Cognitive Rank Comparison Card */}
            <GlobalCognitiveRankCard
              progress={progress}
              accuracyStats={accuracyStats}
              latestRunAccuracy={lastRunAccuracy}
            />
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

            <div className="flex items-center gap-3.5 font-numeric text-xs sm:text-sm tabular-nums flex-wrap justify-end">
              <div className="flex items-center gap-1 text-stone-700">
                <Zap className="w-4 h-4 text-amber-600 fill-amber-600" />
                <span>连击 x{combo}</span>
              </div>
              <div className="flex items-center gap-1 text-stone-900 font-semibold">
                <Trophy className="w-4 h-4 text-stone-700" />
                <span>{score} 分</span>
              </div>
              <CognitiveStreakBadge streak={cognitiveStreak} />
            </div>
          </div>

          {quizMode === 'microexpressions' || quizMode === 'ai-microexpression' ? (
            <div
              className="w-full editorial-card rounded-2xl p-6 sm:p-10 space-y-8 quiz-font-scope"
              data-quiz-font-scale={fontScale}
            >
              <div className="text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-900 flex items-center justify-center mx-auto">
                  <Eye className="w-6 h-6 stroke-[1.6]" aria-hidden="true" />
                </div>
                <div className="text-xs text-stone-500">
                  {quizMode === 'ai-microexpression'
                    ? 'AI Microexpression Conflict Diagnostics · AI 情感冲突微表情诊断报告'
                    : 'Microexpressions and Facial Action · ML001–ML010 全 10 律解码报告'}
                </div>
                <h2 className="font-serif-editorial text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight text-balance">
                  {quizMode === 'ai-microexpression'
                    ? 'AI 互动微表情情感冲突诊断完成'
                    : '微表情社会互动全真挑战完成'}
                </h2>
                <p className="text-xs sm:text-sm text-stone-600 max-w-xl mx-auto leading-relaxed">
                  {quizMode === 'ai-microexpression'
                    ? `你已完成 ${questions.length} 道由 AI 随机抽取 ML001–ML010 定律实时构建的角色情感冲突诊断场景，对应动作单元识别与掌握度已同步更新。`
                    : '你已完成全部 10 个真实社会互动情境（ML001–ML010）的面部动作单元识别与科学边界检验，相关定律掌握度已同步更新至定律图谱。'}
                </p>
              </div>

              {/* Core Performance Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="p-4 rounded-xl bg-[#FAF8F5] border border-stone-200/80 text-center space-y-1">
                  <div className="text-xs text-stone-500">首答准确率</div>
                  <div className="font-numeric tabular-nums text-xl sm:text-2xl font-bold text-stone-900">
                    {questions.length > 0
                      ? Math.round((firstTryCorrectCount / questions.length) * 100)
                      : 100}
                    %
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-[#FAF8F5] border border-stone-200/80 text-center space-y-1">
                  <div className="text-xs text-stone-500">本轮总分</div>
                  <div className="font-numeric tabular-nums text-xl sm:text-2xl font-bold text-stone-900">
                    {score}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-[#FAF8F5] border border-stone-200/80 text-center space-y-1">
                  <div className="text-xs text-stone-500">最高连击</div>
                  <div className="font-numeric tabular-nums text-xl sm:text-2xl font-bold text-stone-900">
                    x{maxCombo}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-[#FAF8F5] border border-stone-200/80 text-center space-y-1">
                  <div className="text-xs text-stone-500">耗用时长</div>
                  <div className="font-numeric tabular-nums text-xl sm:text-2xl font-bold text-stone-900">
                    {formatElapsed(elapsedSeconds)}
                  </div>
                </div>
                <div className="col-span-2 sm:col-span-1 p-4 rounded-xl bg-[#FAF8F5] border border-stone-200/80 text-center space-y-1">
                  <div className="text-xs text-stone-500">获得经验</div>
                  <div className="font-numeric tabular-nums text-xl sm:text-2xl font-bold text-emerald-700">
                    +{earnedXpLastRun} XP
                  </div>
                </div>
              </div>

              {/* Practiced Microexpression Laws & Category Ranks */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-stone-800 pb-2 border-b border-stone-200/80">
                  <span>本轮解码并同步掌握的微表情定律（共 {questions.length} 题）</span>
                  <span className="text-stone-500 font-normal">点击条目可详阅原理解析与科学文献</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {questions.map((q) => {
                    const lawId = q.relatedLawId || '';
                    const linkedLaw = laws.find((item) => item.id === lawId);
                    const mastery = user?.lawMasteryMap?.[lawId] ?? 82;
                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => lawId && navigate(`/law/${lawId}`)}
                        className="text-left p-3.5 rounded-xl bg-white border border-stone-200 hover:border-stone-400 transition-colors flex items-center justify-between gap-3 cursor-pointer"
                      >
                        <div className="min-w-0 space-y-0.5">
                          <div className="text-xs text-stone-500 font-numeric tabular-nums">
                            {q.microScenario?.codeId || linkedLaw?.codeId} ·{' '}
                            {q.microScenario?.actionUnitCode || linkedLaw?.actionUnitCode} ·{' '}
                            {q.microScenario?.categoryZh || linkedLaw?.categoryZh} #
                            {q.microScenario?.categoryRank || linkedLaw?.categoryRank}
                            {q.microScenario?.isAiGenerated ? ' · AI 场景' : ''}
                          </div>
                          <div className="text-sm font-semibold text-stone-900 truncate">
                            {linkedLaw?.nameZh || q.microScenario?.narrativeTitle}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 text-xs font-numeric tabular-nums text-emerald-700 font-semibold">
                          <span>掌握度 {mastery}%</span>
                          <ArrowRight className="w-3.5 h-3.5 text-stone-400" aria-hidden="true" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                {quizMode === 'ai-microexpression' ? (
                  <button
                    type="button"
                    disabled={aiGenerating}
                    onClick={() => void startAiMicroexpressionQuiz()}
                    className="w-full sm:w-auto min-h-[44px] py-3 px-6 rounded-xl chameleon-btn font-semibold text-xs sm:text-sm cursor-pointer inline-flex items-center justify-center gap-2 btn-tactile disabled:opacity-65 disabled:cursor-wait"
                  >
                    {aiGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
                        <span>正在生成新情感冲突场景…</span>
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                        <span>再生成一轮 AI 随机微表情诊断</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => startMicroexpressionQuiz()}
                    className="w-full sm:w-auto min-h-[44px] py-3 px-6 rounded-xl chameleon-btn font-semibold text-xs sm:text-sm cursor-pointer inline-flex items-center justify-center gap-2 btn-tactile"
                  >
                    <Shuffle className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>再刷全 10 律 (全新随机顺序)</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setGameState('intro')}
                  className="w-full sm:w-auto min-h-[44px] py-3 px-6 rounded-xl bg-white border border-stone-300 hover:border-stone-500 text-stone-800 font-semibold text-xs sm:text-sm cursor-pointer"
                >
                  返回五十国首都地图册
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="w-full sm:w-auto min-h-[44px] py-3 px-5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs sm:text-sm cursor-pointer"
                >
                  返回首页
                </button>
              </div>
            </div>
          ) : (
            /* Chapter / World-Capital Completion Celebratory Animation, Performance & Laws Learned Summary Card */
            <CapitalLevelCelebrationCard
              progress={progress}
              session={session}
              questions={questions}
              allLaws={laws}
              firstTryCorrectCount={firstTryCorrectCount}
              totalWrongClicks={totalWrongClicks}
              score={score}
              maxCombo={maxCombo}
              elapsedSeconds={elapsedSeconds}
              earnedXpLastRun={earnedXpLastRun}
              unlockOutcome={unlockOutcome}
              activeCity={activeCity}
              activeStage={activeStage}
              sessionCity={sessionCity}
              sessionStage={sessionStage}
              fontScale={fontScale}
              onChallengeNext={() =>
                startChapterQuiz(
                  progress.activeCityIndex,
                  progress.activePointIndex,
                  progress.activeChapterIndex
                )
              }
              onReplayChapter={() =>
                startChapterQuiz(
                  session.cityIndex,
                  session.pointIndex,
                  session.chapterIndex
                )
              }
              onSwitchMap={() => setGameState('intro')}
              onGoHome={() => navigate('/')}
              onInspectLaw={(lawId) => navigate(`/law/${lawId}`)}
            />
          )}

          {/* Global Cognitive Rank Comparison Card */}
          <GlobalCognitiveRankCard
            progress={progress}
            accuracyStats={accuracyStats}
            latestRunAccuracy={lastRunAccuracy}
          />

          {/* Live Map Progression right after completing a World Capital chapter */}
          {quizMode === 'capital' && (
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
          )}
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
                  {quizMode === 'ai-microexpression'
                    ? 'AI Microexpression Diagnostics · AI 情感冲突微表情实时诊断'
                    : quizMode === 'microexpressions'
                    ? 'Microexpressions Dialectics · 微表情社会互动全真解码'
                    : 'World Capitals Dialectics · 五十国首都心智闯关'}
                </span>
                <span className="font-numeric font-semibold text-stone-700 tabular-nums">
                  {quizMode === 'ai-microexpression'
                    ? `AI 实案第 ${currentIndex + 1} 题`
                    : `第 ${currentIndex + 1} / ${questions.length} 题`}
                </span>
              </div>

              <div className="flex items-center gap-3.5 font-numeric text-xs sm:text-sm tabular-nums flex-wrap justify-end">
                <div
                  className="flex items-center gap-1.5 text-amber-800 font-semibold"
                  title="首答命中可恢复专注能量，用于开启苏格拉底式认知提示"
                >
                  <Flame className="w-4 h-4 text-amber-600" />
                  <span>
                    专注能量 {focusEnergy}/{MAX_FOCUS_ENERGY}
                  </span>
                  {energyDeltaLabel && (
                    <span className="text-[11px] font-bold text-stone-900">
                      ({energyDeltaLabel})
                    </span>
                  )}
                </div>
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
                <CognitiveStreakBadge streak={cognitiveStreak} />
              </div>
            </div>

            {/* Active Capital or Microexpression Banner */}
            <div className="w-full flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 rounded-xl bg-stone-100/85 border border-stone-200/80 text-xs sm:text-sm">
              {quizMode === 'ai-microexpression' ? (
                <div className="flex items-center gap-2 font-semibold text-stone-800 flex-wrap">
                  <Wand2 className="w-4 h-4 text-amber-700 shrink-0" aria-hidden="true" />
                  <span>AI 互动微表情情感冲突诊断（随机 ML001–ML010）</span>
                  <span className="text-stone-400" aria-hidden="true">·</span>
                  <span className="text-stone-600 font-normal">
                    识别特定面部动作单元（AU）或背后心理原则
                  </span>
                </div>
              ) : quizMode === 'microexpressions' ? (
                <div className="flex items-center gap-2 font-semibold text-stone-800 flex-wrap">
                  <Eye className="w-4 h-4 text-amber-700 shrink-0" aria-hidden="true" />
                  <span>微表情与面部动作专场（ML001–ML010）</span>
                  <span className="text-stone-400" aria-hidden="true">·</span>
                  <span className="text-stone-600 font-normal">
                    FACS 肌肉解码与现代情绪边界
                  </span>
                </div>
              ) : (
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
                  <span className="hidden sm:inline-flex items-center gap-1 text-rose-700 text-[11px] font-medium">
                    <Shuffle className="w-3 h-3" />
                    <span>防重随机序 · 第{sequenceStats.totalRuns}轮</span>
                  </span>
                </div>
              )}
              <div className="flex items-center gap-3">
                {quizMode !== 'ai-microexpression' && (
                  <button
                    type="button"
                    disabled={aiGenerating}
                    onClick={() => void handleInjectAiQuestionIntoActiveQuiz()}
                    className="px-3 py-1.5 rounded-lg bg-white border border-stone-300 hover:border-stone-600 text-stone-800 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap disabled:opacity-60 disabled:cursor-wait"
                    title="从 ML001–ML010 随机抽选一条定律，实时由 AI 生成角色情感冲突微表情诊断题加入当前测验"
                  >
                    {aiGenerating ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                    ) : (
                      <Wand2 className="w-3.5 h-3.5 text-amber-700" aria-hidden="true" />
                    )}
                    <span>{aiGenerating ? '生成 AI 场景中…' : '+ AI 微表情情感冲突加试'}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setGameState('intro')}
                  className="text-xs sm:text-sm font-medium text-stone-600 hover:text-stone-900 underline cursor-pointer whitespace-nowrap"
                >
                  返回世界地图册
                </button>
              </div>
            </div>

            {aiError && (
              <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs sm:text-sm">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{aiError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAiError(null)}
                  className="self-end sm:self-auto px-2.5 py-1 rounded-md bg-white border border-rose-200 text-xs font-medium text-rose-800 hover:border-rose-400 cursor-pointer shrink-0"
                >
                  关闭提示
                </button>
              </div>
            )}

            {/* World-Capital Level, Microexpression Gauntlet, or AI Diagnostic Progress Indicator */}
            {quizMode === 'ai-microexpression' ? (
              <div className="w-full p-4 rounded-xl bg-white border border-stone-200/80 flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm text-stone-700">
                <span className="font-semibold">
                  AI 互动微表情情感冲突诊断 · 当前第 {currentIndex + 1} 题（已答对{' '}
                  {firstTryCorrectCount} 题首答命中）
                </span>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!hasFoundCorrect}
                  className="text-xs font-semibold text-stone-800 underline disabled:opacity-40 disabled:no-underline cursor-pointer disabled:cursor-not-allowed"
                >
                  结束本轮并查看诊断报告
                </button>
              </div>
            ) : quizMode === 'microexpressions' ? (
              <div className="w-full p-4 rounded-xl bg-white border border-stone-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs sm:text-sm text-stone-700">
                  <span className="font-semibold">
                    微表情全 10 律实案序列进度 · 第 {currentIndex + 1} / {questions.length} 题
                  </span>
                  <span className="font-numeric tabular-nums font-bold text-stone-900">
                    {questions.length > 0
                      ? Math.round(
                          ((currentIndex + (hasFoundCorrect ? 1 : 0)) / questions.length) * 100
                        )
                      : 0}
                    %
                  </span>
                </div>
                <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-stone-900 rounded-full transition-all duration-300"
                    style={{
                      width: `${
                        questions.length > 0
                          ? ((currentIndex + (hasFoundCorrect ? 1 : 0)) / questions.length) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            ) : (
              <RapidQuizProgressBar
                progress={progress}
                cityIndex={session.cityIndex}
                pointIndex={session.pointIndex}
                chapterIndex={session.chapterIndex}
                answeredInSequence={currentIndex + (hasFoundCorrect ? 1 : 0)}
                totalInSequence={questions.length}
                currentQuestionNumber={currentIndex + 1}
                mode="playing"
              />
            )}

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
                      {currentQ.microScenario
                        ? ` · 分类排行 #${currentQ.microScenario.categoryRank}`
                        : ''}
                    </span>
                    <span className="text-stone-500 font-medium font-numeric tabular-nums">
                      第 {currentIndex + 1}/{questions.length} 题 · 难度 {currentQ.difficulty}
                    </span>
                  </div>

                  {/* Simulated Social-Interaction Narrative Block for Microexpressions (ML001-ML010) */}
                  {currentQ.microScenario && (
                    <div className="p-5 sm:p-6 rounded-xl bg-[#FAF8F5] border border-stone-200/90 space-y-4">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 font-numeric tabular-nums">
                        <span className="font-semibold text-stone-800">
                          {currentQ.microScenario.isAiGenerated
                            ? `AI 生成互动微表情诊断 · ${currentQ.microScenario.codeId}`
                            : `模拟社会互动情境 · ${currentQ.microScenario.codeId}`}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>
                          {currentQ.microScenario.categoryZh}排行 #{currentQ.microScenario.categoryRank}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{currentQ.microScenario.setting}</span>
                      </div>

                      <h4 className="font-serif-editorial text-lg sm:text-xl font-bold text-stone-900">
                        {currentQ.microScenario.narrativeTitle}
                      </h4>

                      {currentQ.microScenario.conflictActors && (
                        <div className="text-xs sm:text-sm text-stone-800 bg-white px-3.5 py-2 rounded-lg border border-stone-200/80">
                          <span className="font-semibold text-stone-900">角色情感冲突：</span>
                          <span>{currentQ.microScenario.conflictActors}</span>
                        </div>
                      )}

                      <p className="text-sm sm:text-base text-stone-700 leading-relaxed">
                        {currentQ.microScenario.actorAction}
                      </p>

                      <div className="pt-3 border-t border-stone-200/70 space-y-2">
                        <div className="text-xs font-semibold text-stone-600">
                          可观察面部动作位移与现场情境线索
                        </div>
                        <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs sm:text-sm text-stone-800">
                          {currentQ.microScenario.observableFacialCues.map((cue, cueIdx) => (
                            <li
                              key={cueIdx}
                              className="px-3 py-2 rounded-lg bg-white border border-stone-200/80 leading-snug"
                            >
                              {cue}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  <h3 className="font-serif-editorial text-xl sm:text-2xl md:text-3xl font-bold text-stone-900 leading-relaxed text-balance">
                    {currentQ.question}
                  </h3>

                  {/* Cognitive Hint Action & Focus Energy Meter */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-xl bg-[#FAF8F5] border border-stone-200/80">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-stone-800 whitespace-nowrap shrink-0">
                        <Flame className="w-4 h-4 text-amber-600 shrink-0" aria-hidden="true" />
                        <span className="font-numeric tabular-nums">
                          Focus Energy · 专注能量 {focusEnergy}/{MAX_FOCUS_ENERGY}
                        </span>
                      </div>
                      <div
                        className="w-24 sm:w-28 h-2 bg-stone-200 rounded-full overflow-hidden shrink-0"
                        aria-label={`专注能量 ${focusEnergy} / ${MAX_FOCUS_ENERGY}`}
                      >
                        <div
                          className="h-full bg-amber-600 rounded-full transition-[width] duration-300"
                          style={{ width: `${(focusEnergy / MAX_FOCUS_ENERGY) * 100}%` }}
                        />
                      </div>
                      <span className="hidden md:inline text-xs text-stone-500 truncate">
                        首答命中 +{FIRST_TRY_ENERGY_REWARD}（连击 +{STREAK_ENERGY_REWARD}）
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleRequestCognitiveHint}
                      disabled={
                        hasFoundCorrect ||
                        Boolean(revealedHintsByIndex[currentIndex]) ||
                        focusEnergy < HINT_ENERGY_COST
                      }
                      className={`min-h-[40px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0 ${
                        revealedHintsByIndex[currentIndex]
                          ? 'bg-amber-50 border border-amber-200 text-amber-900 cursor-default'
                          : hasFoundCorrect || focusEnergy < HINT_ENERGY_COST
                          ? 'bg-stone-100 border border-stone-200 text-stone-400 cursor-not-allowed'
                          : 'bg-white border border-stone-300 hover:border-amber-600 hover:bg-amber-50/50 text-stone-900 cursor-pointer'
                      }`}
                    >
                      <Lightbulb className="w-4 h-4 text-amber-600 shrink-0" aria-hidden="true" />
                      <span>
                        {revealedHintsByIndex[currentIndex]
                          ? '已开启苏格拉底线索'
                          : focusEnergy < HINT_ENERGY_COST
                          ? `能量不足 (需 ${HINT_ENERGY_COST})`
                          : `Cognitive Hint · 认知提示 (-${HINT_ENERGY_COST} 能量)`}
                      </span>
                    </button>
                  </div>

                  {/* Socratic Cognitive Hint Reveal */}
                  <AnimatePresence>
                    {revealedHintsByIndex[currentIndex] && !hasFoundCorrect && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.2 }}
                        className="p-4 sm:p-5 rounded-xl bg-amber-50/75 border border-amber-200/90 space-y-2 text-left"
                      >
                        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-amber-950">
                          <Lightbulb className="w-4 h-4 text-amber-700 shrink-0" aria-hidden="true" />
                          <span>
                            苏格拉底式启发引导 · {revealedHintsByIndex[currentIndex].perspectiveLabel}
                          </span>
                        </div>
                        <p className="text-sm sm:text-base font-semibold text-stone-900 leading-relaxed">
                          {revealedHintsByIndex[currentIndex].guidingQuestion}
                        </p>
                        <p className="text-xs sm:text-sm text-stone-700 leading-relaxed">
                          {revealedHintsByIndex[currentIndex].cognitiveClue}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

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
                        <span>
                          {currentQ.microScenario
                            ? `已找到正确答案 · ${currentQ.microScenario.actionUnitCode} 解析与科学边界`
                            : '已找到正确答案 · 理论解析与都市洞察'}
                        </span>
                      </div>
                      <p className="text-base sm:text-lg text-stone-700 leading-relaxed">
                        {currentQ.explanation}
                      </p>
                      {currentQ.microScenario && (
                        <div className="flex items-start gap-2.5 px-4 py-3 rounded-lg bg-white border border-stone-200 text-xs sm:text-sm text-stone-700 leading-relaxed">
                          <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
                          <div>
                            <span className="font-semibold text-stone-900">科学限定边界：</span>
                            {currentQ.microScenario.scientificLimitation}
                          </div>
                        </div>
                      )}
                      {quizMode === 'ai-microexpression' ? (
                        <div className="flex flex-col sm:flex-row gap-2.5 mt-2">
                          <button
                            type="button"
                            disabled={aiGenerating}
                            onClick={() => void handleAppendNextAiQuestion()}
                            className="flex-1 py-3.5 sm:py-4 px-5 chameleon-btn font-bold text-sm sm:text-base rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-65 disabled:cursor-wait"
                          >
                            {aiGenerating ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
                                <span>正在随机抽取定律并生成下一情感冲突场景…</span>
                              </>
                            ) : (
                              <>
                                <Wand2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                                <span>AI 随机抽取下一定律，生成新冲突场景</span>
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            disabled={aiGenerating}
                            onClick={handleNext}
                            className="py-3.5 sm:py-4 px-5 bg-white border border-stone-300 hover:border-stone-500 text-stone-900 font-bold text-sm sm:text-base rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50"
                          >
                            <span>完成本轮并查看诊断报告</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={handleNext}
                          className="w-full mt-2 py-3.5 sm:py-4 chameleon-btn font-bold text-sm sm:text-base rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <span>
                            {currentIndex < questions.length - 1
                              ? `继续下一题 (${currentIndex + 2} / ${questions.length})`
                              : quizMode === 'microexpressions'
                              ? `完成微表情 10 律实案挑战 (${questions.length}/${questions.length}) 并生成报告`
                              : `完成第 ${session.chapterIndex + 1} 章 (${questions.length}/${questions.length}) 并解锁下一关`}
                          </span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      )}
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


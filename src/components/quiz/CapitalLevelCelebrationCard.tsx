import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Globe,
  ArrowRight,
  Shuffle,
  BookOpen,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Compass,
} from 'lucide-react';
import {
  WORLD_CAPITALS,
  QUESTIONS_PER_CHAPTER,
} from '../../data/worldCapitals';
import {
  WorldCityProgressState,
  checkCityCompleted,
} from '../../hooks/useCityQuizProgress';
import { CityChapterQuestion } from '../../utils/cityQuizGenerator';
import { PsychologyLaw } from '../../types';
import { getLoveLawsForCity } from '../../data/lovePsychologyCodex';
import { CityQuizStage } from './CityQuizMapView';
import { RapidQuizProgressBar } from './RapidQuizProgressBar';

export interface CapitalLevelUnlockOutcome {
  unlockedNextChapter: number | null;
  unlockedNextPoint: number | null;
  unlockedNextCity: number | null;
}

interface CapitalLevelCelebrationCardProps {
  progress: WorldCityProgressState;
  session: {
    cityIndex: number;
    pointIndex: number;
    chapterIndex: number;
  };
  questions: CityChapterQuestion[];
  allLaws: PsychologyLaw[];
  firstTryCorrectCount: number;
  totalWrongClicks: number;
  score: number;
  maxCombo: number;
  elapsedSeconds: number;
  earnedXpLastRun: number;
  unlockOutcome: CapitalLevelUnlockOutcome;
  activeCity: (typeof WORLD_CAPITALS)[number];
  activeStage: CityQuizStage;
  sessionCity: (typeof WORLD_CAPITALS)[number];
  sessionStage: CityQuizStage;
  fontScale: string;
  onChallengeNext: () => void;
  onReplayChapter: () => void;
  onSwitchMap: () => void;
  onGoHome: () => void;
  onInspectLaw: (lawId: string) => void;
}

const formatElapsed = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export const CapitalLevelCelebrationCard: React.FC<CapitalLevelCelebrationCardProps> = ({
  progress,
  session,
  questions,
  allLaws,
  firstTryCorrectCount,
  totalWrongClicks,
  score,
  maxCombo,
  elapsedSeconds,
  earnedXpLastRun,
  unlockOutcome,
  activeCity,
  activeStage,
  sessionCity,
  sessionStage,
  fontScale,
  onChallengeNext,
  onReplayChapter,
  onSwitchMap,
  onGoHome,
  onInspectLaw,
}) => {
  const [showAllLaws, setShowAllLaws] = useState(false);

  const isWholeCapitalCompleted = useMemo(
    () =>
      unlockOutcome.unlockedNextCity !== null ||
      checkCityCompleted(progress, session.cityIndex),
    [unlockOutcome.unlockedNextCity, progress, session.cityIndex]
  );

  const firstTryAccuracy =
    questions.length > 0 ? Math.round((firstTryCorrectCount / questions.length) * 100) : 100;

  // Deduplicate all psychology laws learned/practiced in this completed sequence
  const learnedLaws = useMemo(() => {
    const lawLookup = new Map<string, PsychologyLaw>();
    for (const law of allLaws) {
      lawLookup.set(law.id, law);
    }

    const seen = new Set<string>();
    const result: Array<{
      law: PsychologyLaw;
      isStationedInCapital: boolean;
    }> = [];

    for (const q of questions) {
      if (!q.relatedLawId || seen.has(q.relatedLawId)) continue;
      const found = lawLookup.get(q.relatedLawId);
      if (found) {
        seen.add(q.relatedLawId);
        result.push({
          law: found,
          isStationedInCapital: found.assignedCityIndex === session.cityIndex,
        });
      }
    }

    return result;
  }, [questions, allLaws, session.cityIndex]);

  const capitalStationedTotal = useMemo(
    () => getLoveLawsForCity(session.cityIndex).length,
    [session.cityIndex]
  );

  const capitalStationedLearnedCount = useMemo(
    () => learnedLaws.filter((item) => item.isStationedInCapital).length,
    [learnedLaws]
  );

  // Celebratory staggered confetti bursts synced with the capital's accent color
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    if (prefersReducedMotion) return;

    const palette = [
      sessionCity.palette.accent,
      '#F59E0B',
      '#059669',
      '#532CD8',
      '#E11D48',
    ];

    const t1 = window.setTimeout(() => {
      confetti({
        particleCount: isWholeCapitalCompleted ? 75 : 42,
        angle: 60,
        spread: 58,
        origin: { x: 0.12, y: 0.65 },
        colors: palette,
      });
    }, 180);

    const t2 = window.setTimeout(() => {
      confetti({
        particleCount: isWholeCapitalCompleted ? 75 : 42,
        angle: 120,
        spread: 58,
        origin: { x: 0.88, y: 0.65 },
        colors: palette,
      });
    }, 380);

    let t3: number | undefined;
    if (isWholeCapitalCompleted || unlockOutcome.unlockedNextPoint !== null) {
      t3 = window.setTimeout(() => {
        confetti({
          particleCount: 90,
          spread: 85,
          origin: { x: 0.5, y: 0.45 },
          colors: palette,
        });
      }, 650);
    }

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      if (t3 !== undefined) window.clearTimeout(t3);
    };
  }, [
    session.cityIndex,
    session.pointIndex,
    session.chapterIndex,
    sessionCity.palette.accent,
    isWholeCapitalCompleted,
    unlockOutcome.unlockedNextPoint,
  ]);

  const visibleLaws = showAllLaws ? learnedLaws : learnedLaws.slice(0, 6);

  const milestoneHeadline = isWholeCapitalCompleted
    ? unlockOutcome.unlockedNextCity !== null
      ? `CAPITALE MAÎTRISÉE · ${sessionCity.cityZh}全城贯通并解锁新首都`
      : `CAPITALE MAÎTRISÉE · ${sessionCity.cityZh}世界首都关卡圆满收官`
    : unlockOutcome.unlockedNextPoint !== null
    ? `NOUVEAU SECTEUR DÉBLOQUÉ · 新街区站点已解锁`
    : unlockOutcome.unlockedNextChapter !== null
    ? `CHAPITRE VALIDÉ · 已解锁第 ${unlockOutcome.unlockedNextChapter + 1} 章`
    : `CHAPITRE ACCOMPLI · 本章 ${QUESTIONS_PER_CHAPTER}/${QUESTIONS_PER_CHAPTER} 题全数过关`;

  return (
    <motion.section
      aria-label="世界首都关卡胜利总结与习得定律"
      initial={{ opacity: 0, y: 14, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
      className="w-full editorial-card rounded-2xl p-6 sm:p-9 space-y-7 quiz-font-scope relative overflow-hidden"
      data-quiz-font-scale={fontScale}
    >
      {/* Celebratory Animated Medallion & Milestone Header */}
      <div className="text-center space-y-3 pt-1">
        <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
          {/* Expanding concentric halo rings (compositor-only transform + opacity) */}
          <motion.span
            aria-hidden="true"
            className="absolute inset-0 rounded-full border-2"
            style={{ borderColor: sessionCity.palette.accent }}
            initial={{ scale: 0.65, opacity: 0.75 }}
            animate={{ scale: 1.55, opacity: 0 }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], repeat: 1 }}
          />
          <motion.span
            aria-hidden="true"
            className="absolute inset-2 rounded-full border border-amber-400/80"
            initial={{ scale: 0.7, opacity: 0.8 }}
            animate={{ scale: 1.38, opacity: 0 }}
            transition={{ duration: 1.2, delay: 0.18, ease: [0.16, 1, 0.3, 1], repeat: 1 }}
          />

          {/* Subtle orbital geometric sparks */}
          <motion.span
            aria-hidden="true"
            className="absolute -top-1 right-2 text-amber-500"
            initial={{ opacity: 0, scale: 0, y: 6 }}
            animate={{ opacity: [0, 1, 0.85], scale: [0.4, 1.15, 1], y: [6, -2, 0] }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <Sparkles className="w-4 h-4" />
          </motion.span>
          <motion.span
            aria-hidden="true"
            className="absolute bottom-1 -left-1 text-emerald-600"
            initial={{ opacity: 0, scale: 0, y: -4 }}
            animate={{ opacity: [0, 1, 0.85], scale: [0.4, 1.1, 1], y: [-4, 2, 0] }}
            transition={{ duration: 0.6, delay: 0.28 }}
          >
            <Compass className="w-4 h-4" />
          </motion.span>

          {/* Main Victory Emblem */}
          <motion.div
            initial={{ scale: 0.45, rotate: -14, opacity: 0 }}
            animate={{ scale: [0.45, 1.1, 1], rotate: [14, -4, 0], opacity: 1 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm border border-amber-200/80 bg-amber-50/90"
          >
            {isWholeCapitalCompleted ? (
              <Globe
                className="w-8 h-8 stroke-[1.6]"
                style={{ color: sessionCity.palette.accent }}
              />
            ) : (
              <Trophy className="w-8 h-8 text-amber-700 stroke-[1.6]" />
            )}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.14 }}
          className="space-y-1.5"
        >
          <span className="editorial-kicker text-[10px] sm:text-xs text-emerald-800 font-bold tracking-widest block">
            {milestoneHeadline}
          </span>
          <h2 className="font-serif-editorial text-2xl sm:text-3xl font-bold text-stone-900">
            {sessionCity.cityZh} ({sessionCity.cityFr}) · {sessionStage.districtZh} · 第{' '}
            {session.chapterIndex + 1} 章通关
          </h2>
          <p className="text-xs sm:text-sm text-stone-600">
            全部{' '}
            <strong className="text-stone-900 font-semibold font-numeric">
              {questions.length} / {questions.length}
            </strong>{' '}
            道题已精准攻克 · 一次命中率{' '}
            <strong className="text-emerald-800 font-semibold font-numeric">
              {firstTryAccuracy}%
            </strong>
            {totalWrongClicks > 0 && `（期间纠错 ${totalWrongClicks} 次）`}
          </p>
        </motion.div>

        {unlockOutcome.unlockedNextCity !== null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.25 }}
            className="mt-2 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs sm:text-sm font-semibold"
          >
            <Globe className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              恭喜通关整座首都关卡！新世界首都地图「
              {WORLD_CAPITALS[unlockOutcome.unlockedNextCity]?.cityZh} (
              {WORLD_CAPITALS[unlockOutcome.unlockedNextCity]?.cityFr})」现已开启！
            </span>
          </motion.div>
        )}
      </div>

      {/* World-Capital & Sequence Progress Summary Bar */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay: 0.18 }}
        className="max-w-3xl mx-auto"
      >
        <RapidQuizProgressBar
          progress={progress}
          cityIndex={session.cityIndex}
          pointIndex={session.pointIndex}
          chapterIndex={session.chapterIndex}
          answeredInSequence={questions.length}
          totalInSequence={questions.length}
          mode="completed"
        />
      </motion.div>

      {/* Performance Summary Grid */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.24 }}
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 max-w-4xl mx-auto text-center"
      >
        <div className="bg-[#FAF8F5] p-3 rounded-xl border border-stone-200/70">
          <span className="text-[11px] text-stone-500 font-medium block">本章答题</span>
          <span className="text-base sm:text-lg font-bold text-stone-900 font-numeric tabular-nums">
            {questions.length}/{questions.length}
          </span>
        </div>
        <div className="bg-[#FAF8F5] p-3 rounded-xl border border-stone-200/70">
          <span className="text-[11px] text-stone-500 font-medium block">一次命中率</span>
          <span className="text-base sm:text-lg font-bold text-emerald-800 font-numeric tabular-nums">
            {firstTryAccuracy}%
          </span>
        </div>
        <div className="bg-[#FAF8F5] p-3 rounded-xl border border-stone-200/70">
          <span className="text-[11px] text-stone-500 font-medium block">总得分</span>
          <span className="text-base sm:text-lg font-bold text-stone-900 font-numeric tabular-nums">
            {score}
          </span>
        </div>
        <div className="bg-[#FAF8F5] p-3 rounded-xl border border-stone-200/70">
          <span className="text-[11px] text-stone-500 font-medium block">最高连击</span>
          <span className="text-base sm:text-lg font-bold text-stone-900 font-numeric tabular-nums">
            {maxCombo} 次
          </span>
        </div>
        <div className="bg-[#FAF8F5] p-3 rounded-xl border border-stone-200/70">
          <span className="text-[11px] text-stone-500 font-medium block">通关用时</span>
          <span className="text-base sm:text-lg font-bold text-stone-900 font-numeric tabular-nums">
            {formatElapsed(elapsedSeconds)}
          </span>
        </div>
        <div className="bg-[#FAF8F5] p-3 rounded-xl border border-stone-200/70">
          <span className="text-[11px] text-stone-500 font-medium block">获得经验</span>
          <span className="text-base sm:text-lg font-bold text-emerald-800 font-numeric tabular-nums">
            +{earnedXpLastRun} XP
          </span>
        </div>
      </motion.div>

      {/* Laws Learned Summary Section */}
      {learnedLaws.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.34, delay: 0.3 }}
          className="max-w-4xl mx-auto text-left space-y-3.5 pt-2 border-t border-stone-200/80"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
            <div className="flex items-center gap-2 text-stone-900">
              <BookOpen
                className="w-4 h-4 shrink-0"
                style={{ color: sessionCity.palette.accent }}
                aria-hidden="true"
              />
              <h3 className="font-serif-editorial text-base sm:text-lg font-bold">
                本关研习与巩固的心理学定律 ({learnedLaws.length} 条)
              </h3>
            </div>
            <p className="text-xs text-stone-500 font-numeric tabular-nums">
              含 {sessionCity.cityZh} 驻守定律 {capitalStationedLearnedCount}/{capitalStationedTotal} 条 · 点击任意定律可查阅完整档案
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {visibleLaws.map(({ law, isStationedInCapital }, idx) => (
              <motion.button
                key={law.id}
                type="button"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, delay: 0.32 + idx * 0.03 }}
                onClick={() => onInspectLaw(law.id)}
                className="group w-full text-left p-3.5 rounded-xl bg-[#FAF8F5] hover:bg-white border border-stone-200/80 hover:border-stone-400 transition-colors cursor-pointer flex flex-col justify-between gap-2"
              >
                <div className="space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-sm text-stone-900 group-hover:text-stone-950 leading-snug">
                      {String(idx + 1).padStart(2, '0')}. {law.nameZh}
                    </span>
                    <ExternalLink
                      className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-700 shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="text-[11px] text-stone-500 flex items-center gap-1.5 flex-wrap">
                    <span>{law.nameEn}</span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {law.isMicroexpression
                        ? `微表情 (${law.actionUnitCode || law.codeId}) / ${law.categoryZh} #${law.categoryRank}`
                        : law.isLoveCodex
                        ? `爱情心理 / ${law.subTag || '关系'}`
                        : law.categoryZh}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {law.isMicroexpression
                        ? law.codeId
                        : isStationedInCapital
                        ? `${sessionCity.cityZh}驻守`
                        : law.assignedCityZh || '跨城联动'}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed line-clamp-2">
                  {law.healthyBoundary || law.keyTakeaway || law.shortExplanation}
                </p>
              </motion.button>
            ))}
          </div>

          {learnedLaws.length > 6 && (
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setShowAllLaws((prev) => !prev)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-stone-200 hover:border-stone-400 text-xs font-semibold text-stone-700 cursor-pointer transition-colors"
              >
                {showAllLaws ? (
                  <>
                    <ChevronUp className="w-3.5 h-3.5" />
                    <span>收起部分定律</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5" />
                    <span>展开查看全部 {learnedLaws.length} 条习得定律</span>
                  </>
                )}
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* Primary & Secondary Actions */}
      <div className="flex flex-wrap gap-3 pt-1 max-w-3xl mx-auto">
        <button
          type="button"
          onClick={onChallengeNext}
          className="flex-1 min-h-[44px] py-3 px-4 rounded-xl chameleon-btn font-semibold text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
        >
          <span>
            挑战下一目标：{activeCity.cityZh} · {activeStage.roman}. 第{' '}
            {progress.activeChapterIndex + 1} 章
          </span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={onReplayChapter}
          className="min-h-[44px] py-3 px-4 rounded-xl bg-rose-50 border border-rose-200 hover:border-rose-400 text-rose-800 font-semibold text-xs sm:text-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          title="使用全新防重随机序列重刷本章"
        >
          <Shuffle className="w-3.5 h-3.5" />
          <span>重刷本章 (新序列)</span>
        </button>
        <button
          type="button"
          onClick={onSwitchMap}
          className="min-h-[44px] py-3 px-4 rounded-xl bg-white border border-stone-200 hover:border-stone-400 text-stone-800 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
        >
          切换地图
        </button>
        <button
          type="button"
          onClick={onGoHome}
          className="min-h-[44px] py-3 px-4 rounded-xl bg-white border border-stone-200 hover:border-stone-400 text-stone-800 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
        >
          返回首页
        </button>
      </div>
    </motion.section>
  );
};

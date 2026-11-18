import React from 'react';
import { motion } from 'motion/react';
import { Globe, Layers, CheckCircle2 } from 'lucide-react';
import {
  WORLD_CAPITALS,
  POINTS_PER_CITY,
  CHAPTERS_PER_POINT,
  QUESTIONS_PER_CHAPTER,
} from '../../data/worldCapitals';
import { getCityLoveDifficultyTier } from '../../data/lovePsychologyTypes';
import {
  WorldCityProgressState,
  getCompletedChaptersList,
  checkChapterCompleted,
} from '../../hooks/useCityQuizProgress';
import { buildStagesForCapital } from './CityQuizMapView';

export interface RapidQuizProgressBarProps {
  progress: WorldCityProgressState;
  cityIndex: number;
  pointIndex: number;
  chapterIndex: number;
  answeredInSequence: number;
  totalInSequence: number;
  currentQuestionNumber?: number;
  mode: 'intro' | 'playing' | 'completed';
}

export const RapidQuizProgressBar: React.FC<RapidQuizProgressBarProps> = ({
  progress,
  cityIndex,
  pointIndex,
  chapterIndex,
  answeredInSequence,
  totalInSequence,
  currentQuestionNumber,
  mode,
}) => {
  const city = WORLD_CAPITALS[cityIndex] || WORLD_CAPITALS[0];
  const stages = buildStagesForCapital(city);
  const currentStage = stages[pointIndex] || stages[0];
  const tier = getCityLoveDifficultyTier(cityIndex);

  const safeTotalSequence = Math.max(1, totalInSequence);
  const clampedAnsweredSeq = Math.min(safeTotalSequence, Math.max(0, answeredInSequence));
  const isCurrentChapterRecordedComplete = checkChapterCompleted(
    progress,
    cityIndex,
    pointIndex,
    chapterIndex
  );

  // Per-district (8 points per capital) and city-level completion math
  let completedChaptersInCity = 0;
  let completedPointsInCity = 0;

  const districtSegments = stages.map((stage, idx) => {
    const completedChs = getCompletedChaptersList(progress, cityIndex, idx);
    completedChaptersInCity += completedChs.length;
    if (completedChs.length >= CHAPTERS_PER_POINT) {
      completedPointsInCity += 1;
    }

    const liveChapterFraction =
      mode === 'playing' && idx === pointIndex && !isCurrentChapterRecordedComplete
        ? clampedAnsweredSeq / safeTotalSequence
        : 0;

    const fillRatio = Math.min(
      1,
      (completedChs.length + liveChapterFraction) / CHAPTERS_PER_POINT
    );

    return {
      roman: stage.roman,
      districtZh: stage.districtZh,
      completedCount: completedChs.length,
      isComplete: completedChs.length >= CHAPTERS_PER_POINT,
      isActive: idx === pointIndex,
      fillRatio,
    };
  });

  const totalChaptersInCity = POINTS_PER_CITY * CHAPTERS_PER_POINT;
  const totalQuestionsInCity = totalChaptersInCity * QUESTIONS_PER_CHAPTER;
  const liveQuestionBonus =
    mode === 'playing' && !isCurrentChapterRecordedComplete ? clampedAnsweredSeq : 0;
  const effectiveCityQuestions = Math.min(
    totalQuestionsInCity,
    completedChaptersInCity * QUESTIONS_PER_CHAPTER + liveQuestionBonus
  );

  const cityPercentRaw = (effectiveCityQuestions / totalQuestionsInCity) * 100;
  const cityPercentLabel =
    cityPercentRaw >= 100
      ? '100'
      : cityPercentRaw === 0
      ? '0'
      : cityPercentRaw < 10
      ? cityPercentRaw.toFixed(1)
      : Math.round(cityPercentRaw).toString();

  const effectiveSeqCompleted =
    mode === 'intro' && isCurrentChapterRecordedComplete
      ? safeTotalSequence
      : clampedAnsweredSeq;
  const sequenceRatio = effectiveSeqCompleted / safeTotalSequence;
  const sequencePercent = Math.round(sequenceRatio * 100);

  return (
    <section
      aria-label="世界首都关卡与当前题序进度"
      className="w-full rounded-2xl bg-white border border-stone-200/85 p-4 sm:p-5 text-left space-y-4"
    >
      {/* Track 1: Current World-Capital-Themed Level Completion */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
          <div className="flex items-center gap-2 min-w-0 flex-wrap text-xs sm:text-sm text-stone-700">
            <Globe
              className="w-4 h-4 shrink-0"
              style={{ color: city.palette.accent }}
              aria-hidden="true"
            />
            <span className="font-semibold text-stone-900">
              首都关卡 #{city.index + 1}/50 · {city.cityZh} ({city.cityFr})
            </span>
            <span className="text-stone-300" aria-hidden="true">·</span>
            <span className="text-stone-600">{tier.labelZh}</span>
          </div>

          <div className="flex items-center gap-2 text-xs sm:text-sm font-numeric tabular-nums text-stone-600 shrink-0">
            <span>
              站区 {completedPointsInCity}/{POINTS_PER_CITY}
            </span>
            <span className="text-stone-300" aria-hidden="true">·</span>
            <span>
              章节 {completedChaptersInCity}/{totalChaptersInCity}
            </span>
            <span className="text-stone-300" aria-hidden="true">·</span>
            <span className="font-semibold text-stone-900">
              {effectiveCityQuestions.toLocaleString()} / {totalQuestionsInCity.toLocaleString()} 题 ({cityPercentLabel}%)
            </span>
          </div>
        </div>

        {/* 8-District Segmented Progress Track for Active World Capital */}
        <div
          role="progressbar"
          aria-label={`${city.cityZh} 首都关卡完成度`}
          aria-valuemin={0}
          aria-valuemax={totalQuestionsInCity}
          aria-valuenow={effectiveCityQuestions}
          className="grid grid-cols-8 gap-1.5"
        >
          {districtSegments.map((seg) => (
            <div key={seg.roman} className="space-y-1 min-w-0">
              <div
                className={`h-2 w-full rounded-full overflow-hidden ${
                  seg.isActive ? 'bg-stone-200 ring-1 ring-stone-300/80' : 'bg-stone-200/80'
                }`}
                title={`${seg.roman}. ${seg.districtZh} · ${seg.completedCount}/${CHAPTERS_PER_POINT} 章`}
              >
                <motion.div
                  className="h-full w-full rounded-full"
                  style={{
                    transformOrigin: 'left center',
                    backgroundColor: seg.isComplete
                      ? '#059669'
                      : seg.isActive
                      ? city.palette.accent
                      : '#78716c',
                  }}
                  initial={false}
                  animate={{ scaleX: seg.fillRatio }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
              <div
                className={`text-[10px] font-numeric tabular-nums text-center truncate ${
                  seg.isActive
                    ? 'font-bold text-stone-900'
                    : seg.isComplete
                    ? 'font-medium text-emerald-700'
                    : 'text-stone-400'
                }`}
              >
                {seg.roman}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="h-px bg-stone-200/70" />

      {/* Track 2: Current Chapter Sequence Progress (Answered / Total Questions in Sequence) */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs sm:text-sm">
          <div className="flex items-center gap-2 text-stone-700 min-w-0 flex-wrap">
            {mode === 'completed' || (mode === 'intro' && isCurrentChapterRecordedComplete) ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" aria-hidden="true" />
            ) : (
              <Layers className="w-4 h-4 text-stone-500 shrink-0" aria-hidden="true" />
            )}
            <span className="font-medium text-stone-800">
              {currentStage.roman}. {currentStage.districtZh} · 第 {chapterIndex + 1}/{CHAPTERS_PER_POINT} 章序列
            </span>
            <span className="text-stone-300" aria-hidden="true">·</span>
            <span className="text-stone-600 font-numeric tabular-nums">
              {mode === 'playing'
                ? `正在作答第 ${Math.min(
                    currentQuestionNumber ?? clampedAnsweredSeq + 1,
                    safeTotalSequence
                  )} / ${safeTotalSequence} 题`
                : mode === 'completed'
                ? `本轮题序已全部完成`
                : isCurrentChapterRecordedComplete
                ? `本章已过关 · 可重新随机题序复练`
                : `待开启 · 本章共 ${safeTotalSequence} 道题`}
            </span>
          </div>

          <div className="font-numeric tabular-nums font-semibold text-stone-900 shrink-0">
            {effectiveSeqCompleted} / {safeTotalSequence} 题 · {sequencePercent}%
          </div>
        </div>

        <div
          role="progressbar"
          aria-label="当前题序完成进度"
          aria-valuemin={0}
          aria-valuemax={safeTotalSequence}
          aria-valuenow={effectiveSeqCompleted}
          className="w-full bg-stone-200/90 h-2.5 rounded-full overflow-hidden"
        >
          <motion.div
            className="h-full w-full chameleon-bar rounded-full"
            style={{ transformOrigin: 'left center' }}
            initial={false}
            animate={{ scaleX: sequenceRatio }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
      </div>
    </section>
  );
};

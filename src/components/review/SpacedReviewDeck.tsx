import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useReviewSchedule } from '../../context/ReviewScheduleContext';
import { resolveBookLawById } from '../../utils/lawReadingBookmarkHelpers';
import {
  LawReviewScheduleRecord,
  RecallRating,
  formatReviewCountdown,
  previewNextIntervals,
} from '../../utils/lawSpacedRepetition';
import { gameAudio } from '../../utils/gameAudio';

interface SpacedReviewDeckProps {
  items: LawReviewScheduleRecord[];
  initialFocusLawId?: string | null;
  onCompleteAll?: () => void;
}

export const SpacedReviewDeck: React.FC<SpacedReviewDeckProps> = ({
  items,
  initialFocusLawId,
  onCompleteAll,
}) => {
  const navigate = useNavigate();
  const { laws } = useApp();
  const { reviewNowMs, submitReview, snoozeLaw } = useReviewSchedule();

  const [revealed, setRevealed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lastFeedback, setLastFeedback] = useState<string | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(
    initialFocusLawId || null
  );

  useEffect(() => {
    if (initialFocusLawId) {
      setFocusedId(initialFocusLawId);
      setRevealed(false);
    }
  }, [initialFocusLawId]);

  const activeSchedule = useMemo(() => {
    if (items.length === 0) return null;
    if (focusedId) {
      const match = items.find((i) => i.lawId === focusedId);
      if (match) return match;
    }
    return items[0];
  }, [items, focusedId]);

  const resolvedLaw = useMemo(() => {
    if (!activeSchedule) return undefined;
    return resolveBookLawById(laws, activeSchedule.lawId);
  }, [activeSchedule, laws]);

  const previews = useMemo(() => {
    if (!activeSchedule) return [];
    return previewNextIntervals(activeSchedule, reviewNowMs);
  }, [activeSchedule, reviewNowMs]);

  const handleRate = async (rating: RecallRating) => {
    if (!activeSchedule || submitting) return;
    setSubmitting(true);
    try {
      const updated = await submitReview(activeSchedule.lawId, rating);
      if (updated) {
        const label =
          rating === 'again'
            ? '已重设记忆脉冲 · 12 小时后巩固'
            : rating === 'hard'
            ? `已记录 · 下次复习：${formatReviewCountdown(updated.nextReviewAtMs, Date.now())}`
            : rating === 'good'
            ? `记忆已巩固 · 下次复习：${formatReviewCountdown(updated.nextReviewAtMs, Date.now())}`
            : `深度内化 · 下次复习：${formatReviewCountdown(updated.nextReviewAtMs, Date.now())}`;
        setLastFeedback(`《${activeSchedule.lawNameZh}》${label}`);
      }
      gameAudio.playSuccess();
      setRevealed(false);
      setFocusedId(null);
      if (items.length <= 1 && onCompleteAll) {
        onCompleteAll();
      }
    } catch (err) {
      console.error('Failed to submit spaced repetition review:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSnooze = async () => {
    if (!activeSchedule || submitting) return;
    setSubmitting(true);
    try {
      await snoozeLaw(activeSchedule.lawId, 2);
      setLastFeedback(`已暂缓《${activeSchedule.lawNameZh}》提醒 2 小时`);
      gameAudio.playTap();
      setRevealed(false);
      setFocusedId(null);
    } finally {
      setSubmitting(false);
    }
  };

  if (!activeSchedule) {
    return (
      <div className="art-museum-mat rounded-2xl p-6 sm:p-8 text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-[#EEF7F3] border border-[#157F5D]/30 flex items-center justify-center text-[#157F5D]">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div className="space-y-1.5">
          <h3 className="font-serif-editorial text-lg font-bold text-[#181411]">
            当前到期复习已全部完成
          </h3>
          <p className="text-xs sm:text-sm text-[#57514A] max-w-md mx-auto leading-relaxed">
            系统已根据你的每次回忆流畅度自动演算 SM-2 最优复习间隔，将在最佳记忆临界点再次唤醒提示。
          </p>
        </div>
        {lastFeedback && (
          <p className="text-xs font-semibold text-[#157F5D] tabular-nums">
            {lastFeedback}
          </p>
        )}
      </div>
    );
  }

  const ratingAccentMap: Record<RecallRating, string> = {
    again:
      'border-[#A82442]/35 bg-[#FDF4F6] text-[#8A1832] hover:border-[#A82442] hover:bg-[#FCE8ED]',
    hard:
      'border-[#B87314]/35 bg-[#FDF7EC] text-[#7A4B0C] hover:border-[#B87314] hover:bg-[#FAECD4]',
    good:
      'border-[#157F5D]/35 bg-[#EEF7F3] text-[#0E5940] hover:border-[#157F5D] hover:bg-[#DFF1E9]',
    easy:
      'border-[#4338A6]/35 bg-[#F2F1FC] text-[#32288A] hover:border-[#4338A6] hover:bg-[#E5E3FA]',
  };

  return (
    <div className="art-museum-mat rounded-2xl p-5 sm:p-7 space-y-5 border border-[#C8933B]/35">
      {lastFeedback && (
        <div
          role="status"
          className="px-3.5 py-2 rounded-xl bg-[#EEF7F3] border border-[#157F5D]/30 text-xs font-semibold text-[#0E5940] flex items-center gap-2"
        >
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">{lastFeedback}</span>
        </div>
      )}

      {/* Card Header Metadata (Unboxed, tabular-nums) */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-200/80 text-xs font-numeric tabular-nums text-[#6E675F]">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-[#8E5B13]">
            {resolvedLaw?.codeId || 'LAW'}
          </span>
          <span aria-hidden="true">·</span>
          <span>{activeSchedule.categoryZh}心理学</span>
          <span aria-hidden="true">·</span>
          <span className="text-[#181411] font-semibold">
            第 {activeSchedule.repetitions + 1} 轮复习
          </span>
          <span aria-hidden="true">·</span>
          <span>EF {activeSchedule.easeFactor.toFixed(2)}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="font-semibold text-[#961D38]">
            {formatReviewCountdown(activeSchedule.nextReviewAtMs, reviewNowMs)}
          </span>
          <span aria-hidden="true">·</span>
          <span>剩余 {items.length} 条</span>
        </div>
      </div>

      {/* Law Prompt Title */}
      <div className="space-y-2">
        <h3 className="font-serif-editorial text-xl sm:text-2xl font-bold text-[#181411] tracking-tight">
          {activeSchedule.lawNameZh}
        </h3>
        {activeSchedule.lawNameEn && (
          <p className="font-serif-editorial italic text-sm text-[#6E675F]">
            {activeSchedule.lawNameEn}
          </p>
        )}
        <p className="text-xs sm:text-sm text-[#57514A] leading-relaxed pt-1">
          主动回想：这条定律背后的认知/情绪触发机制是什么？现实互动中出现哪些信号时应触发边界防御？
        </p>
      </div>

      {/* Reveal / Hide Core Explanation & Anti-Manipulation Cue */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              gameAudio.playTap();
              setRevealed((prev) => !prev);
            }}
            className="luxury-dark-btn min-h-[42px] px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            {revealed ? (
              <>
                <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
                <span>收起核心解析</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-[#D4A656]" aria-hidden="true" />
                <span>核对核心解析</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              gameAudio.playTap();
              navigate(`/law/${activeSchedule.lawId}?page=1`);
            }}
            className="luxury-surface-btn min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-semibold text-[#181411] inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#8E5B13]" aria-hidden="true" />
            <span>翻阅典藏全书</span>
          </button>

          <button
            type="button"
            disabled={submitting}
            onClick={handleSnooze}
            className="luxury-surface-btn min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-semibold text-[#57514A] inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            title="暂缓 2 小时后再提醒这条定律"
          >
            <Clock className="w-3.5 h-3.5" aria-hidden="true" />
            <span>2 小时后提醒</span>
          </button>
        </div>

        {revealed && resolvedLaw && (
          <div className="rounded-xl bg-[#FAF7F1] border border-stone-200/90 p-4 sm:p-5 space-y-3 animate-fadeIn">
            <div className="space-y-1">
              <div className="text-[11px] font-mono uppercase tracking-wider text-[#8E5B13] font-semibold">
                Core Mechanism · 核心精义
              </div>
              <p className="text-sm text-[#181411] leading-relaxed font-medium">
                {resolvedLaw.shortExplanation}
              </p>
            </div>

            {resolvedLaw.keyTakeaway && (
              <div className="pt-2.5 border-t border-stone-200/80 space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#157F5D]">
                  <Sparkles className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>核心洞见与行动策略</span>
                </div>
                <p className="text-xs sm:text-sm text-[#3F3831] leading-relaxed">
                  {resolvedLaw.keyTakeaway}
                </p>
              </div>
            )}

            {resolvedLaw.antiManipulation && resolvedLaw.antiManipulation.length > 0 && (
              <div className="pt-2.5 border-t border-stone-200/80 space-y-1">
                <div className="text-[11px] font-semibold text-[#4338A6]">
                  防偏误/防御要诀
                </div>
                <p className="text-xs text-[#3F3831] leading-relaxed">
                  {resolvedLaw.antiManipulation[0]}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SM-2 Recall Quality Assessment Controls */}
      <div className="pt-2 border-t border-stone-200/80 space-y-2.5">
        <div className="flex items-center justify-between text-xs text-[#6E675F]">
          <span className="font-semibold text-[#181411]">
            评估本次回忆流畅度（自动演算下次最优复习间隔）
          </span>
          <span className="hidden sm:inline font-mono text-[11px]">
            SM-2 Spaced Repetition
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {previews.map((item) => (
            <button
              key={item.rating}
              type="button"
              disabled={submitting}
              onClick={() => handleRate(item.rating)}
              className={`min-h-[60px] p-3 rounded-xl border text-left transition-all cursor-pointer disabled:opacity-50 flex flex-col justify-between gap-1 ${ratingAccentMap[item.rating]}`}
            >
              <div className="flex items-center justify-between gap-1 w-full">
                <span className="text-xs sm:text-sm font-bold whitespace-nowrap">
                  {item.labelZh}
                </span>
                {item.rating === 'again' && (
                  <RotateCcw className="w-3.5 h-3.5 shrink-0 opacity-80" aria-hidden="true" />
                )}
              </div>
              <span className="text-[11px] font-mono font-semibold tabular-nums opacity-90 whitespace-nowrap">
                {item.intervalLabel}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

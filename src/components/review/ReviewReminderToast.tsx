import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, BellRing, Clock, X } from 'lucide-react';
import { useReviewSchedule } from '../../context/ReviewScheduleContext';
import { formatReviewCountdown } from '../../utils/lawSpacedRepetition';
import { gameAudio } from '../../utils/gameAudio';

export const ReviewReminderToast: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    eligibleNotificationSchedules,
    reviewNowMs,
    toastSnoozedUntilMs,
    dismissToastForHours,
    snoozeAllEligible,
  } = useReviewSchedule();

  const [hasInteracted, setHasInteracted] = useState(false);

  // Never show unprompted popup before user interacts with the app
  useEffect(() => {
    if (hasInteracted) return;
    const markInteracted = () => setHasInteracted(true);
    window.addEventListener('pointerdown', markInteracted, { once: true, passive: true });
    window.addEventListener('keydown', markInteracted, { once: true });
    return () => {
      window.removeEventListener('pointerdown', markInteracted);
      window.removeEventListener('keydown', markInteracted);
    };
  }, [hasInteracted]);

  const isSuppressedRoute =
    location.pathname.startsWith('/review') ||
    location.pathname.startsWith('/game/') ||
    location.pathname === '/challenge';

  const isSnoozed = toastSnoozedUntilMs > reviewNowMs;

  if (
    !hasInteracted ||
    isSuppressedRoute ||
    isSnoozed ||
    eligibleNotificationSchedules.length === 0
  ) {
    return null;
  }

  const primaryLaw = eligibleNotificationSchedules[0];
  const extraCount = eligibleNotificationSchedules.length - 1;

  return (
    <aside
      role="status"
      aria-live="polite"
      aria-label={`间隔复习提示：${primaryLaw.lawNameZh}`}
      className="fixed z-40 bottom-[5.25rem] sm:bottom-24 left-3 right-3 sm:left-6 sm:right-auto sm:w-[392px] pointer-events-auto animate-fadeIn"
    >
      <div className="rounded-2xl bg-[#FDFBF7]/96 backdrop-blur-md border border-[#C8933B]/45 shadow-[0_16px_44px_-14px_rgba(24,20,17,0.22)] px-4 py-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[11px] font-mono tabular-nums text-[#8E5B13] font-semibold min-w-0 truncate">
            <BellRing className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>最佳间隔复习提醒</span>
            <span aria-hidden="true">·</span>
            <span className="text-[#961D38]">
              {eligibleNotificationSchedules.length} 条待回顾
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              gameAudio.playTap();
              dismissToastForHours(4);
            }}
            className="w-7 h-7 -mr-1 rounded-lg flex items-center justify-center text-stone-500 hover:text-stone-900 hover:bg-stone-200/70 cursor-pointer shrink-0"
            aria-label="暂时收起复习提醒"
            title="暂时收起"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="font-serif-editorial text-sm font-bold text-[#181411] truncate">
              《{primaryLaw.lawNameZh}》
              {extraCount > 0 ? ` 等 ${eligibleNotificationSchedules.length} 项` : ''}
            </div>
            <div className="text-[11px] text-[#57514A] font-numeric tabular-nums truncate">
              {formatReviewCountdown(primaryLaw.nextReviewAtMs, reviewNowMs)} · {primaryLaw.categoryZh}心理学
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                gameAudio.playTap();
                dismissToastForHours(2);
                void snoozeAllEligible(2);
              }}
              className="min-h-[34px] px-2.5 py-1.5 rounded-xl border border-stone-200 bg-white text-[11px] font-semibold text-[#57514A] hover:text-[#181411] inline-flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
              title="2 小时后再次提醒"
            >
              <Clock className="w-3 h-3" aria-hidden="true" />
              <span>2h 后</span>
            </button>

            <button
              type="button"
              onClick={() => {
                gameAudio.playTap();
                navigate(`/review?focus=${encodeURIComponent(primaryLaw.lawId)}`);
              }}
              className="min-h-[34px] px-3 py-1.5 rounded-xl bg-[#181411] text-[#FAF8F5] hover:bg-[#8E5B13] transition-colors text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>立即复习</span>
              <ArrowRight className="w-3 h-3" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, BellOff, BookOpen, CalendarClock, Clock, ArrowRight } from 'lucide-react';
import { useReviewSchedule } from '../../context/ReviewScheduleContext';
import { formatReviewCountdown } from '../../utils/lawSpacedRepetition';
import { gameAudio } from '../../utils/gameAudio';

export const ReviewNotificationBell: React.FC = () => {
  const navigate = useNavigate();
  const {
    dueSchedules,
    eligibleNotificationSchedules,
    dueCount,
    reviewNowMs,
    browserPermission,
    browserNotificationsEnabled,
    requestBrowserNotifications,
    setBrowserNotificationsEnabled,
    snoozeLaw,
    snoozeAllEligible,
  } = useReviewSchedule();

  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    window.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const handleToggleBrowserNotify = async () => {
    gameAudio.playTap();
    if (browserPermission === 'granted') {
      setBrowserNotificationsEnabled(!browserNotificationsEnabled);
      return;
    }
    await requestBrowserNotifications();
  };

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => {
          gameAudio.playTap();
          setOpen((prev) => !prev);
        }}
        aria-expanded={open}
        aria-label={
          dueCount > 0
            ? `间隔复习提醒：${dueCount} 条收藏定律待复习`
            : '查看间隔复习排期与提醒'
        }
        title={
          dueCount > 0
            ? `间隔复习提醒：${dueCount} 条收藏定律已到达最优复习时间`
            : '间隔复习排期中心'
        }
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all btn-tactile cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 ${
          dueCount > 0
            ? 'bg-[#FDF4E7] border-[#C8933B]/45 text-[#7A4B0C] hover:border-[#C8933B]'
            : 'luxury-surface-btn text-stone-700'
        }`}
      >
        <Bell
          className={`w-3.5 h-3.5 shrink-0 ${
            dueCount > 0 ? 'text-[#8E5B13]' : 'text-stone-600'
          }`}
          aria-hidden="true"
        />
        <span className="text-[11px] font-semibold hidden md:inline">复习</span>
        {dueCount > 0 && (
          <span className="text-[11px] font-mono font-bold tabular-nums text-[#961D38]">
            {dueCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="间隔重复复习提醒中心"
          className="absolute right-0 mt-2 w-[320px] sm:w-[376px] rounded-2xl bg-[#FDFBF7] border border-stone-200 shadow-[0_20px_50px_-14px_rgba(24,20,17,0.22)] z-50 overflow-hidden animate-fadeIn"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-stone-200/80 flex items-center justify-between gap-2 bg-[#FAF6EE]">
            <div className="min-w-0">
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#8E5B13] font-semibold">
                Spaced Repetition Alerts
              </div>
              <div className="font-serif-editorial text-sm font-bold text-[#181411] tabular-nums">
                {dueCount > 0
                  ? `${dueCount} 条收藏定律待间隔复习`
                  : '暂无到期复习定律'}
              </div>
            </div>

            {eligibleNotificationSchedules.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  gameAudio.playTap();
                  void snoozeAllEligible(2);
                }}
                className="px-2.5 py-1 rounded-lg border border-stone-300/80 bg-white text-[11px] font-semibold text-[#57514A] hover:text-[#181411] cursor-pointer whitespace-nowrap shrink-0"
              >
                暂缓 2h
              </button>
            )}
          </div>

          {/* Due Items List */}
          <div className="max-h-72 overflow-y-auto divide-y divide-stone-200/70">
            {dueSchedules.length === 0 ? (
              <div className="px-4 py-6 text-center space-y-2">
                <CalendarClock
                  className="w-6 h-6 mx-auto text-[#8E5B13]"
                  aria-hidden="true"
                />
                <p className="text-xs text-[#57514A] leading-relaxed">
                  所有已收藏定律均处于最佳记忆间隔期内，可前往排期中心查看未来复习计划。
                </p>
              </div>
            ) : (
              dueSchedules.slice(0, 5).map((item) => {
                const isSnoozed = item.snoozedUntilMs > reviewNowMs;
                return (
                  <div
                    key={item.lawId}
                    className="px-4 py-3 space-y-2 hover:bg-[#FAF6EE]/60 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-[11px] font-mono text-[#6E675F] tabular-nums flex items-center gap-1.5">
                          <span className="text-[#961D38] font-semibold">
                            {formatReviewCountdown(item.nextReviewAtMs, reviewNowMs)}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{item.categoryZh}</span>
                          {isSnoozed && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-stone-500">已暂缓</span>
                            </>
                          )}
                        </div>
                        <div className="font-serif-editorial text-sm font-bold text-[#181411] truncate mt-0.5">
                          {item.lawNameZh}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            gameAudio.playTap();
                            setOpen(false);
                            navigate(`/review?focus=${encodeURIComponent(item.lawId)}`);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-[#181411] text-[#FAF8F5] text-[11px] font-semibold cursor-pointer whitespace-nowrap"
                        >
                          复习
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            gameAudio.playTap();
                            setOpen(false);
                            navigate(`/law/${item.lawId}?page=1`);
                          }}
                          className="w-7 h-7 rounded-lg border border-stone-200 bg-white flex items-center justify-center text-[#57514A] hover:text-[#181411] cursor-pointer"
                          title="打开典藏书页"
                          aria-label={`打开《${item.lawNameZh}》书页`}
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            gameAudio.playTap();
                            void snoozeLaw(item.lawId, 2);
                          }}
                          className="w-7 h-7 rounded-lg border border-stone-200 bg-white flex items-center justify-center text-[#57514A] hover:text-[#8E5B13] cursor-pointer"
                          title="暂缓 2 小时提醒"
                          aria-label={`暂缓《${item.lawNameZh}》2小时提醒`}
                        >
                          <Clock className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer: Browser Opt-In + Open Full Schedule */}
          <div className="px-4 py-2.5 border-t border-stone-200/80 bg-[#FAF6EE] flex items-center justify-between gap-2">
            {browserPermission !== 'unsupported' ? (
              <button
                type="button"
                onClick={handleToggleBrowserNotify}
                className="text-[11px] font-medium text-[#57514A] hover:text-[#181411] inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
              >
                {browserPermission === 'granted' && browserNotificationsEnabled ? (
                  <>
                    <Bell className="w-3.5 h-3.5 text-[#157F5D]" aria-hidden="true" />
                    <span>系统提醒：已开启</span>
                  </>
                ) : browserPermission === 'denied' ? (
                  <>
                    <BellOff className="w-3.5 h-3.5 text-stone-400" aria-hidden="true" />
                    <span>浏览器已拦截通知</span>
                  </>
                ) : (
                  <>
                    <Bell className="w-3.5 h-3.5 text-[#8E5B13]" aria-hidden="true" />
                    <span>开启浏览器定时提醒</span>
                  </>
                )}
              </button>
            ) : (
              <span className="text-[11px] text-stone-500">应用内定时提醒已启用</span>
            )}

            <button
              type="button"
              onClick={() => {
                gameAudio.playTap();
                setOpen(false);
                navigate('/review');
              }}
              className="text-xs font-bold text-[#8E5B13] hover:text-[#181411] inline-flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>复习排期中心</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  Bell,
  BellOff,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  Clock,
  Heart,
  Sparkles,
} from 'lucide-react';
import { useReviewSchedule } from '../context/ReviewScheduleContext';
import { SpacedReviewDeck } from '../components/review/SpacedReviewDeck';
import {
  classifyReviewDueStatus,
  formatIntervalDuration,
  formatReviewCountdown,
} from '../utils/lawSpacedRepetition';
import { gameAudio } from '../utils/gameAudio';

type FilterTab = 'all' | 'due' | 'upcoming' | 'mastered';

export const ReviewSchedulePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const focusLawId = searchParams.get('focus');

  const {
    schedules,
    dueSchedules,
    upcomingSchedules,
    masteredSchedules,
    dueCount,
    reviewNowMs,
    browserPermission,
    browserNotificationsEnabled,
    requestBrowserNotifications,
    setBrowserNotificationsEnabled,
    toggleLawNotifications,
    snoozeLaw,
  } = useReviewSchedule();

  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const totalReviewsCompleted = useMemo(
    () => schedules.reduce((sum, s) => sum + s.totalReviews, 0),
    [schedules]
  );

  const avgEaseFactor = useMemo(() => {
    if (schedules.length === 0) return '2.50';
    const avg =
      schedules.reduce((sum, s) => sum + s.easeFactor, 0) / schedules.length;
    return avg.toFixed(2);
  }, [schedules]);

  const displayedSchedules = useMemo(() => {
    if (activeTab === 'due') return dueSchedules;
    if (activeTab === 'upcoming') return upcomingSchedules;
    if (activeTab === 'mastered') return masteredSchedules;
    return schedules;
  }, [activeTab, schedules, dueSchedules, upcomingSchedules, masteredSchedules]);

  const handleToggleBrowserNotify = async () => {
    gameAudio.playTap();
    if (browserPermission === 'granted') {
      setBrowserNotificationsEnabled(!browserNotificationsEnabled);
      return;
    }
    await requestBrowserNotifications();
  };

  const handleFocusLawForReview = (lawId: string) => {
    gameAudio.playTap();
    setSearchParams({ focus: lawId });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 animate-fadeIn">
      {/* Header & Notification Control */}
      <section className="art-museum-mat rounded-3xl p-6 sm:p-8 border border-[#C8933B]/35 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#8E5B13] font-semibold">
              Spaced Repetition · SM-2 记忆巩固排期
            </div>
            <h1 className="font-serif-editorial text-2xl sm:text-3xl font-bold text-[#181411] tracking-tight">
              收藏心理学定律 · 智能间隔复习排期中心
            </h1>
            <p className="text-xs sm:text-sm text-[#57514A] leading-relaxed">
              基于 SM-2 艾宾浩斯记忆曲线算法，自动追踪每条已收藏定律的遗忘临界点。每次主动回忆评级都会实时演算下一次最佳复习时间并触发提醒。
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {browserPermission !== 'unsupported' && (
              <button
                type="button"
                onClick={handleToggleBrowserNotify}
                className={`min-h-[40px] px-3.5 py-2 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 transition-colors ${
                  browserPermission === 'granted' && browserNotificationsEnabled
                    ? 'bg-[#EEF7F3] border-[#157F5D]/35 text-[#0E5940]'
                    : 'luxury-surface-btn text-[#181411]'
                }`}
              >
                {browserPermission === 'granted' && browserNotificationsEnabled ? (
                  <>
                    <Bell className="w-3.5 h-3.5 text-[#157F5D]" aria-hidden="true" />
                    <span>系统级定时提醒已开启</span>
                  </>
                ) : browserPermission === 'denied' ? (
                  <>
                    <BellOff className="w-3.5 h-3.5 text-stone-400" aria-hidden="true" />
                    <span>浏览器通知已拦截</span>
                  </>
                ) : (
                  <>
                    <Bell className="w-3.5 h-3.5 text-[#8E5B13]" aria-hidden="true" />
                    <span>开启浏览器到期推送</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                gameAudio.playTap();
                navigate('/emotional-library');
              }}
              className="luxury-surface-btn min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-semibold text-[#181411] inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#8E5B13]" aria-hidden="true" />
              <span>浏览并收藏更多定律</span>
            </button>
          </div>
        </div>

        {/* Hairline Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-stone-200/80 font-numeric tabular-nums">
          <div className="p-3.5 rounded-xl bg-[#FAF7F1] border border-stone-200/80">
            <div className="text-[11px] text-[#6E675F]">今日到期待复习</div>
            <div className="text-xl sm:text-2xl font-bold text-[#961D38] mt-1">
              {dueCount} 条
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-[#FAF7F1] border border-stone-200/80">
            <div className="text-[11px] text-[#6E675F]">排期追踪藏品</div>
            <div className="text-xl sm:text-2xl font-bold text-[#181411] mt-1">
              {schedules.length} 条
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-[#FAF7F1] border border-stone-200/80">
            <div className="text-[11px] text-[#6E675F]">已深度巩固 (≥14天)</div>
            <div className="text-xl sm:text-2xl font-bold text-[#157F5D] mt-1">
              {masteredSchedules.length} 条
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-[#FAF7F1] border border-stone-200/80">
            <div className="text-[11px] text-[#6E675F]">累计复习 · 平均 EF</div>
            <div className="text-xl sm:text-2xl font-bold text-[#8E5B13] mt-1">
              {totalReviewsCompleted} 次 · {avgEaseFactor}
            </div>
          </div>
        </div>
      </section>

      {/* Active Recall Deck */}
      {schedules.length === 0 ? (
        <section className="art-museum-mat rounded-2xl p-8 text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-[#FDF3F5] border border-[#961D38]/25 flex items-center justify-center text-[#961D38]">
            <Heart className="w-5 h-5" />
          </div>
          <div className="space-y-1.5">
            <h2 className="font-serif-editorial text-lg font-bold text-[#181411]">
              暂无加入间隔复习的收藏定律
            </h2>
            <p className="text-xs sm:text-sm text-[#57514A] max-w-md mx-auto leading-relaxed">
              在心理定律库或典藏书籍阅读器中点击“收藏定律”，系统会自动为你生成专属的 SM-2 记忆巩固时间表。
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/emotional-library')}
            className="luxury-dark-btn min-h-[42px] px-5 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#D4A656]" aria-hidden="true" />
            <span>前往探索并收藏定律</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </section>
      ) : (
        <>
          <section aria-label="主动回忆复习卡片">
            <SpacedReviewDeck
              items={
                dueSchedules.length > 0
                  ? dueSchedules
                  : focusLawId
                  ? schedules.filter((s) => s.lawId === focusLawId)
                  : []
              }
              initialFocusLawId={focusLawId}
            />
          </section>

          {/* Complete Schedule Table / List */}
          <section className="art-museum-mat rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-200/80">
              <div className="flex items-center gap-2">
                <CalendarClock
                  className="w-4 h-4 text-[#8E5B13] shrink-0"
                  aria-hidden="true"
                />
                <h2 className="font-serif-editorial text-base sm:text-lg font-bold text-[#181411]">
                  收藏定律间隔复习时间表
                </h2>
              </div>

              <div
                className="flex flex-wrap items-center gap-1.5 text-xs font-numeric tabular-nums"
                role="tablist"
                aria-label="复习排期筛选"
              >
                {(
                  [
                    { key: 'all', label: `全部 ${schedules.length}` },
                    { key: 'due', label: `待复习 ${dueSchedules.length}` },
                    { key: 'upcoming', label: `巩固中 ${upcomingSchedules.length}` },
                    { key: 'mastered', label: `已掌握 ${masteredSchedules.length}` },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === tab.key}
                    onClick={() => {
                      gameAudio.playTap();
                      setActiveTab(tab.key);
                    }}
                    className={`min-h-[34px] px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      activeTab === tab.key
                        ? 'bg-[#181411] text-[#FAF8F5]'
                        : 'bg-[#FAF7F1] border border-stone-200 text-[#57514A] hover:text-[#181411]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {displayedSchedules.length === 0 ? (
              <div className="py-8 text-center text-xs sm:text-sm text-[#57514A]">
                当前筛选分组下暂无定律记录。
              </div>
            ) : (
              <div className="space-y-2.5">
                {displayedSchedules.map((sched) => {
                  const status = classifyReviewDueStatus(sched, reviewNowMs);
                  const countdown = formatReviewCountdown(
                    sched.nextReviewAtMs,
                    reviewNowMs
                  );
                  const isSnoozed = sched.snoozedUntilMs > reviewNowMs;

                  return (
                    <div
                      key={sched.lawId}
                      className="p-4 rounded-xl bg-[#FAF7F1] border border-stone-200/85 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2 text-[11px] font-numeric tabular-nums flex-wrap">
                          <span
                            className={`font-bold inline-flex items-center gap-1 ${
                              status === 'due'
                                ? 'text-[#961D38]'
                                : status === 'mastered'
                                ? 'text-[#157F5D]'
                                : 'text-[#8E5B13]'
                            }`}
                          >
                            {status === 'due' ? (
                              <Clock className="w-3 h-3 shrink-0" aria-hidden="true" />
                            ) : status === 'mastered' ? (
                              <CheckCircle2
                                className="w-3 h-3 shrink-0"
                                aria-hidden="true"
                              />
                            ) : (
                              <CalendarClock
                                className="w-3 h-3 shrink-0"
                                aria-hidden="true"
                              />
                            )}
                            <span>{countdown}</span>
                          </span>
                          <span className="text-stone-400" aria-hidden="true">
                            ·
                          </span>
                          <span className="text-[#57514A]">
                            {sched.categoryZh}心理学
                          </span>
                          <span className="text-stone-400" aria-hidden="true">
                            ·
                          </span>
                          <span className="text-[#6E675F]">
                            第 {sched.repetitions} 轮 · 当前间隔{' '}
                            {sched.intervalDays > 0
                              ? formatIntervalDuration(sched.intervalDays).replace('后', '')
                              : '首轮'}
                          </span>
                          <span className="text-stone-400" aria-hidden="true">
                            ·
                          </span>
                          <span className="text-[#6E675F]">
                            EF {sched.easeFactor.toFixed(2)}
                          </span>
                          {isSnoozed && (
                            <>
                              <span className="text-stone-400" aria-hidden="true">
                                ·
                              </span>
                              <span className="text-[#8E5B13] font-semibold">
                                提醒已暂缓
                              </span>
                            </>
                          )}
                        </div>

                        <div className="font-serif-editorial text-base font-bold text-[#181411] truncate">
                          {sched.lawNameZh}
                        </div>
                        {sched.lawNameEn && (
                          <div className="text-xs font-serif-editorial italic text-[#6E675F] truncate">
                            {sched.lawNameEn}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleFocusLawForReview(sched.lawId)}
                          className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0 ${
                            status === 'due'
                              ? 'luxury-dark-btn'
                              : 'luxury-surface-btn text-[#181411]'
                          }`}
                        >
                          {status === 'due' ? '立即复习' : '提前巩固'}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            gameAudio.playTap();
                            navigate(`/law/${sched.lawId}?page=1`);
                          }}
                          className="luxury-surface-btn min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold text-[#181411] cursor-pointer whitespace-nowrap shrink-0"
                        >
                          打开书籍 →
                        </button>

                        {status === 'due' && (
                          <button
                            type="button"
                            onClick={() => {
                              gameAudio.playTap();
                              void snoozeLaw(sched.lawId, 2);
                            }}
                            className="w-9 h-9 rounded-lg border border-stone-200 bg-white flex items-center justify-center text-[#57514A] hover:text-[#8E5B13] cursor-pointer"
                            title="暂缓 2 小时提醒"
                            aria-label={`暂缓《${sched.lawNameZh}》2小时提醒`}
                          >
                            <Clock className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            gameAudio.playTap();
                            void toggleLawNotifications(
                              sched.lawId,
                              !sched.notificationsEnabled
                            );
                          }}
                          className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${
                            sched.notificationsEnabled
                              ? 'border-[#C8933B]/40 bg-[#FAF4E8] text-[#8E5B13]'
                              : 'border-stone-200 bg-white text-stone-400 hover:text-stone-700'
                          }`}
                          aria-pressed={sched.notificationsEnabled}
                          aria-label={
                            sched.notificationsEnabled
                              ? `关闭《${sched.lawNameZh}》复习提醒`
                              : `开启《${sched.lawNameZh}》复习提醒`
                          }
                          title={
                            sched.notificationsEnabled
                              ? '定时提醒已开启（点击静音）'
                              : '定时提醒已关闭（点击开启）'
                          }
                        >
                          {sched.notificationsEnabled ? (
                            <Bell className="w-3.5 h-3.5" />
                          ) : (
                            <BellOff className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
};

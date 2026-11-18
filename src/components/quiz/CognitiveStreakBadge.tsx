import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Calendar, Check, Flame, Trophy } from 'lucide-react';
import { CognitiveStreakSummary } from '../../services/cognitiveStreakService';

interface CognitiveStreakBadgeProps {
  streak: CognitiveStreakSummary;
}

export const CognitiveStreakBadge: React.FC<CognitiveStreakBadgeProps> = ({ streak }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-label={`Cognitive Streak 每日认知连胜：当前连续 ${streak.currentStreak} 天`}
        className={`min-h-[40px] px-3 py-1.5 rounded-xl border inline-flex items-center gap-2.5 text-xs font-numeric tabular-nums transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
          streak.completedToday
            ? 'bg-emerald-50/90 border-emerald-300/90 text-emerald-950 hover:border-emerald-500'
            : streak.currentStreak > 0
            ? 'bg-amber-50/90 border-amber-300/90 text-amber-950 hover:border-amber-500'
            : 'bg-white border-stone-200/90 text-stone-700 hover:border-stone-400'
        }`}
      >
        <Flame
          className={`w-4 h-4 shrink-0 ${
            streak.completedToday
              ? 'text-emerald-700 fill-emerald-600/20'
              : streak.currentStreak > 0
              ? 'text-amber-600 fill-amber-500/25'
              : 'text-stone-500'
          }`}
          aria-hidden="true"
        />

        <span className="font-bold text-stone-900">
          {streak.currentStreak} 天连胜
        </span>

        {/* Compact 7-day bar visualizer directly inside the top-right badge */}
        <span
          className="hidden sm:inline-flex items-end gap-0.5 h-3.5"
          aria-hidden="true"
          title="近 7 日每日闯关打卡"
        >
          {streak.last7Days.map((day) => (
            <span
              key={day.dateKey}
              className={`w-1.5 rounded-full transition-colors ${
                day.completed
                  ? streak.completedToday
                    ? 'h-3.5 bg-emerald-600'
                    : 'h-3.5 bg-amber-600'
                  : day.isToday
                  ? 'h-2 bg-stone-400'
                  : 'h-1.5 bg-stone-300/80'
              }`}
            />
          ))}
        </span>

        <span className="text-stone-300 hidden md:inline" aria-hidden="true">
          ·
        </span>

        <span
          className={`hidden md:inline font-medium ${
            streak.completedToday ? 'text-emerald-800' : 'text-stone-600'
          }`}
        >
          {streak.completedToday ? '今日已打卡' : '今日待完成'}
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            role="dialog"
            aria-label="Cognitive Streak 7日打卡详情"
            className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-white border border-stone-200/90 shadow-lg p-4 space-y-4 z-40 text-left"
          >
            <div className="flex items-start justify-between gap-2 pb-3 border-b border-stone-200/75">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-stone-900">
                  <Calendar className="w-3.5 h-3.5 text-amber-700" aria-hidden="true" />
                  <span>Cognitive Streak · 每日心智连胜</span>
                </div>
                <p className="text-[11px] text-stone-500">
                  每日完成任意一章世界首都测验即可点亮当日节点
                </p>
              </div>
              <span className="text-xs font-bold font-numeric tabular-nums text-stone-900 shrink-0">
                {streak.currentStreak} 天
              </span>
            </div>

            {/* 7-Day Rolling Visualizer */}
            <div className="grid grid-cols-7 gap-1.5">
              {streak.last7Days.map((day) => (
                <div key={day.dateKey} className="flex flex-col items-center gap-1">
                  <span
                    className={`text-[10px] font-medium ${
                      day.isToday ? 'text-stone-900 font-bold' : 'text-stone-500'
                    }`}
                  >
                    {day.shortDayLabel}
                  </span>
                  <div
                    className={`w-8 h-8 rounded-xl border flex items-center justify-center text-[11px] font-numeric tabular-nums transition-colors ${
                      day.completed
                        ? 'bg-emerald-600 border-emerald-600 text-white font-bold'
                        : day.isToday
                        ? 'bg-amber-50 border-amber-300 text-amber-900 font-semibold'
                        : 'bg-[#FAF8F5] border-stone-200/80 text-stone-400'
                    }`}
                    title={`${day.dateKey}${day.completed ? ' · 已完成' : ' · 未完成'}`}
                  >
                    {day.completed ? (
                      <Check className="w-4 h-4 stroke-[2.2]" aria-hidden="true" />
                    ) : (
                      day.dayOfMonth
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Summary Strip */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-stone-200/75 text-center font-numeric tabular-nums">
              <div className="bg-[#FAF8F5] rounded-xl py-2 px-1.5 border border-stone-200/60">
                <span className="text-[10px] text-stone-500 block">当前连胜</span>
                <span className="text-sm font-bold text-stone-900">
                  {streak.currentStreak} 天
                </span>
              </div>
              <div className="bg-[#FAF8F5] rounded-xl py-2 px-1.5 border border-stone-200/60">
                <span className="text-[10px] text-stone-500 block flex items-center justify-center gap-0.5">
                  <Trophy className="w-2.5 h-2.5 text-amber-700" aria-hidden="true" />
                  历史最佳
                </span>
                <span className="text-sm font-bold text-stone-900">
                  {streak.bestStreak} 天
                </span>
              </div>
              <div className="bg-[#FAF8F5] rounded-xl py-2 px-1.5 border border-stone-200/60">
                <span className="text-[10px] text-stone-500 block">累计打卡</span>
                <span className="text-sm font-bold text-emerald-800">
                  {streak.totalActiveDays} 天
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

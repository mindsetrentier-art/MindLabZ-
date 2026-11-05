import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Flame,
  Star,
  Trophy,
  Target,
  Zap,
  BookOpen,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Wind,
  PenLine,
  Brain,
  ShieldCheck,
  CheckCircle2,
  Activity,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { gameAudio } from '../../utils/gameAudio';

interface TopSummaryPullDrawerProps {
  isPlayingGame?: boolean;
}

const MAIN_BAR_HEIGHT = 44; // 主组件高度 (保持不动)
const TRAY_PEEK_HEIGHT = 32; // 默认托盘露出一行的高度
const COLLAPSED_TOTAL_HEIGHT = MAIN_BAR_HEIGHT + TRAY_PEEK_HEIGHT; // 76px
const EXPANDED_TRAY_MIN_HEIGHT = 380; // 展开时深灰托盘的内容最小高度

export const TopSummaryPullDrawer: React.FC<TopSummaryPullDrawerProps> = ({
  isPlayingGame = false,
}) => {
  const navigate = useNavigate();
  const {
    user,
    journals,
    openComposerWithPreload,
    setBreathingOpen,
    isDailyChallengeCompleted,
  } = useApp();

  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragY, setDragY] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const trayRef = useRef<HTMLDivElement>(null);
  const dragStartYRef = useRef<number>(0);
  const startExpandedRef = useRef<boolean>(false);
  const panelContentRef = useRef<HTMLDivElement>(null);

  // Derived user statistics
  const streak = user?.streak ?? 0;
  const xp = user?.xp ?? 0;
  const level = user?.level ?? 1;
  const title = user?.title || '认知探索者';
  const lawsMasteredCount = Array.isArray(user?.lawsMastered) ? user.lawsMastered.length : 0;
  const journalCount = Array.isArray(journals) ? journals.length : 0;
  const cognitiveScore = user?.stats
    ? Math.round(
        (user.stats.memory +
          user.stats.attention +
          user.stats.reasoning +
          user.stats.knowledge +
          user.stats.decision) /
          5
      )
    : 86;

  // Next level threshold calculation
  const nextLevelXp = level * 200 + 1000;
  const currentLevelProgress = Math.min(100, Math.round(((xp % 500) / 500) * 100));

  // Determine dynamic expanded tray height
  const [targetTrayHeight, setTargetTrayHeight] = useState<number>(EXPANDED_TRAY_MIN_HEIGHT);
  const [overlayTop, setOverlayTop] = useState<number>(100);

  const updateOverlayPosition = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setOverlayTop(Math.max(0, Math.round(rect.bottom)));
    }
  }, []);

  useEffect(() => {
    if (panelContentRef.current) {
      const measured = panelContentRef.current.scrollHeight + 48;
      setTargetTrayHeight(Math.max(EXPANDED_TRAY_MIN_HEIGHT, measured));
    }
  }, [user, journals, isExpanded]);

  useEffect(() => {
    updateOverlayPosition();
    window.addEventListener('resize', updateOverlayPosition);
    window.addEventListener('scroll', updateOverlayPosition, { passive: true });
    return () => {
      window.removeEventListener('resize', updateOverlayPosition);
      window.removeEventListener('scroll', updateOverlayPosition);
    };
  }, [updateOverlayPosition, isExpanded]);

  // Calculate current tray rendered height
  let renderTrayHeight = isExpanded ? targetTrayHeight : TRAY_PEEK_HEIGHT;
  if (isDragging && dragY !== null) {
    if (startExpandedRef.current) {
      // Pulling up from expanded
      const newH = targetTrayHeight + dragY;
      renderTrayHeight = Math.max(TRAY_PEEK_HEIGHT, Math.min(targetTrayHeight + 30, newH));
    } else {
      // Pulling down from collapsed peek
      const newH = TRAY_PEEK_HEIGHT + dragY;
      if (newH > targetTrayHeight) {
        renderTrayHeight = targetTrayHeight + (newH - targetTrayHeight) * 0.25;
      } else {
        renderTrayHeight = Math.max(TRAY_PEEK_HEIGHT, newH);
      }
    }
  }

  // Normalized progress: 0 (collapsed peek) to 1 (expanded)
  const progress = Math.max(
    0,
    Math.min(
      1,
      (renderTrayHeight - TRAY_PEEK_HEIGHT) /
        (targetTrayHeight - TRAY_PEEK_HEIGHT || 1)
    )
  );

  // Total container height (main bar stays completely stationary at top)
  const totalContainerHeight = MAIN_BAR_HEIGHT + renderTrayHeight;

  // Toggle expand / collapse with crisp haptic/audio feedback
  const handleToggle = useCallback(() => {
    gameAudio.playTap();
    setIsExpanded((prev) => !prev);
  }, []);

  const handleCollapse = useCallback(() => {
    gameAudio.playTap();
    setIsExpanded(false);
  }, []);

  // Keyboard accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isExpanded) {
        setIsExpanded(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded]);

  // Pointer drag gestures for realistic follow-hand pull down on tray
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    const target = e.target as HTMLElement;
    if (
      target.closest('button:not([data-drag-handle="true"])') ||
      target.closest('a') ||
      target.closest('input')
    ) {
      return;
    }

    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // Ignore
    }

    setIsDragging(true);
    dragStartYRef.current = e.clientY;
    startExpandedRef.current = isExpanded;
    setDragY(0);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const currentY = e.clientY;
    const delta = currentY - dragStartYRef.current;
    setDragY(delta);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;

    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignore
    }

    setIsDragging(false);

    if (dragY !== null) {
      if (startExpandedRef.current) {
        // Dragging up to close
        if (dragY < -40 || progress < 0.65) {
          setIsExpanded(false);
          gameAudio.playTap();
        } else {
          setIsExpanded(true);
        }
      } else {
        // Dragging down to open
        if (dragY > 35 || progress > 0.15) {
          setIsExpanded(true);
          gameAudio.playTap();
        } else {
          setIsExpanded(false);
        }
      }
    }
    setDragY(null);
  };

  // If in active gameplay screen, hide summary drawer to preserve focus
  if (isPlayingGame) {
    return null;
  }

  return (
    <>
      {/* 1. Main Outer Container: Controls overall push-down of content below */}
      <div
        ref={containerRef}
        className="w-full mx-auto mb-3 select-none relative z-30"
        style={{
          height: `${totalContainerHeight}px`,
          transition: isDragging
            ? 'none'
            : 'height 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* ============================================================
            A. 主组件 (Main Component): 位置绝对保持不动 (Stationary at top: 0, z-20)
            ============================================================ */}
        <div
          onClick={!isDragging ? handleToggle : undefined}
          data-drag-handle="true"
          className="relative z-20 w-full h-11 px-3 sm:px-4 rounded-2xl bg-white border border-stone-200/90 shadow-sm flex items-center justify-between gap-2 cursor-pointer transition-all hover:border-stone-300"
          role="button"
          tabIndex={0}
          aria-expanded={isExpanded}
          aria-label={isExpanded ? '收起深灰明细托盘' : '展开深灰明细托盘'}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleToggle();
            }
          }}
        >
          {/* Left: Core Summary Metrics in an Editorial Line */}
          <div className="flex items-center gap-1.5 sm:gap-3 text-xs min-w-0 font-numeric text-stone-700">
            {/* Streak */}
            <div
              className="flex items-center gap-1 shrink-0 font-semibold text-stone-900"
              title="连续研习天数"
            >
              <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-600" />
              <span>{streak}天</span>
            </div>

            <span className="text-stone-300 hidden xs:inline" aria-hidden="true">
              ·
            </span>

            {/* XP */}
            <div
              className="flex items-center gap-1 shrink-0 font-semibold text-stone-800"
              title="经验值"
            >
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
              <span>{xp.toLocaleString()} XP</span>
            </div>

            <span className="text-stone-300 hidden sm:inline" aria-hidden="true">
              ·
            </span>

            {/* Laws Mastered */}
            <div
              className="hidden sm:flex items-center gap-1 shrink-0 text-emerald-800 font-semibold"
              title="已掌握心理学定律"
            >
              <Trophy className="w-3.5 h-3.5 text-emerald-600" />
              <span>{lawsMasteredCount} 项定律</span>
            </div>

            <span className="text-stone-300 hidden md:inline" aria-hidden="true">
              ·
            </span>

            {/* Cognitive Score */}
            <div
              className="hidden md:flex items-center gap-1 shrink-0 text-indigo-900 font-semibold"
              title="多维综合认知指数"
            >
              <Target className="w-3.5 h-3.5 text-indigo-600" />
              <span>指数 {cognitiveScore}</span>
            </div>

            <span className="text-stone-300 hidden lg:inline" aria-hidden="true">
              ·
            </span>

            {/* Metacognitive Journals */}
            <div
              className="hidden lg:flex items-center gap-1 shrink-0 text-stone-600 font-medium"
              title="个人心智手记篇数"
            >
              <PenLine className="w-3.5 h-3.5 text-stone-500" />
              <span>{journalCount} 篇手记</span>
            </div>
          </div>

          {/* Right: Interactive Pill Button */}
          <div className="flex items-center gap-1.5 shrink-0 pl-1">
            <span className="text-[10.5px] font-medium text-stone-500 hidden sm:inline tracking-tight">
              {isExpanded ? '点击收起托盘' : '深灰托盘明细'}
            </span>

            <div
              className={`flex items-center justify-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                isExpanded
                  ? 'bg-stone-900 text-white border-stone-900 shadow-2xs'
                  : 'bg-[#FAF8F5] text-stone-700 border-stone-300 hover:border-stone-500 hover:bg-stone-100'
              }`}
            >
              <span className="text-[10px] tracking-wider uppercase font-mono">
                {isExpanded ? '收起' : '展开'}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-300 ${
                  isExpanded ? 'rotate-180' : ''
                }`}
                style={{
                  transform: isDragging
                    ? `rotate(${Math.min(180, progress * 180)}deg)`
                    : undefined,
                }}
              />
            </div>
          </div>
        </div>

        {/* ============================================================
            B. 深灰托盘 (Dark Gray Tray): 垫在主组件下方 (z-10, 默认只露一行)
            ============================================================ */}
        <div
          ref={trayRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="absolute left-0 right-0 top-9 z-10 bg-[#1C1917] text-stone-100 rounded-b-2xl border-x border-b border-stone-800 shadow-xl overflow-hidden flex flex-col justify-between"
          style={{
            height: `${renderTrayHeight + 8}px`, // +8 covers the slight overlap under main bar
            transition: isDragging
              ? 'none'
              : 'height 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* 1. Peek Row Header (默认露出的这一行，位于主组件正下方) */}
          <div
            onClick={!isDragging ? handleToggle : undefined}
            data-drag-handle="true"
            className="w-full h-8 pt-1.5 px-3 sm:px-4 flex items-center justify-between gap-2 shrink-0 cursor-pointer bg-[#1C1917] border-b border-stone-800/80 hover:bg-stone-900 transition-colors"
            title={isExpanded ? '向上滑动或点击收起明细' : '点击或向下拉展开完整明细'}
          >
            {/* Peek Content: Sleek dark teaser info */}
            <div className="flex items-center gap-2 text-[11px] text-stone-300 min-w-0 font-numeric">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="font-semibold text-stone-100 truncate">
                ⚡ 认知状态: 优异 (心流专注)
              </span>
              <span className="text-stone-600 hidden xs:inline" aria-hidden="true">
                /
              </span>
              <span className="text-stone-400 hidden sm:inline truncate">
                五维神经雷达 · 准确率 92.4% · 反应时 380ms
              </span>
            </div>

            {/* Peek Hint Pill */}
            <div className="flex items-center gap-1 text-[10px] text-stone-400 font-mono tracking-wider shrink-0">
              <span className="hidden xs:inline">
                {isExpanded ? '收起明细' : '展开明细'}
              </span>
              <ChevronDown
                className={`w-3 h-3 text-stone-400 transition-transform duration-300 ${
                  isExpanded ? 'rotate-180 text-amber-400' : ''
                }`}
              />
            </div>
          </div>

          {/* 2. Expanded Details Content on Dark Gray Tray */}
          <div
            ref={panelContentRef}
            className={`flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-5 space-y-4 transition-opacity duration-200 ${
              progress > 0.08 ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            {/* Header: Level & Challenge on dark background */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-serif-editorial font-bold text-base shadow-xs shrink-0">
                  {level}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-serif-editorial text-sm font-bold text-stone-100">
                      {user?.name || 'Alex Chen'}
                    </h4>
                    <span className="text-xs font-semibold text-stone-400 font-numeric">
                      Level {level} · {title}
                    </span>
                  </div>
                  <div className="text-[11px] text-stone-400 flex items-center gap-2 mt-0.5 font-numeric">
                    <span>
                      距离 Lv.{level + 1} 还需 {(nextLevelXp - (xp % nextLevelXp)).toLocaleString()} XP
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="text-emerald-400 font-semibold">
                      {isDailyChallengeCompleted ? '✓ 今日挑战已达成' : '今日挑战待完成 (+80 XP)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* XP Progress Bar on Dark Gray */}
              <div className="sm:w-44 space-y-1">
                <div className="flex justify-between text-[10px] font-numeric text-stone-400">
                  <span>当前等级经验进度</span>
                  <span className="font-semibold text-stone-200">{currentLevelProgress}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-stone-800 border border-stone-700 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 via-amber-500 to-indigo-500 rounded-full transition-all duration-500"
                    style={{ width: `${currentLevelProgress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Grid of 6 Deep Quantitative Metric Tiles on Dark Gray */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-left">
              <div className="p-2.5 rounded-xl bg-stone-900/90 border border-stone-800 space-y-0.5">
                <div className="flex items-center justify-between text-[10.5px] text-stone-400">
                  <span>连续研习</span>
                  <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                </div>
                <div className="font-numeric text-base font-bold text-stone-100">
                  {streak} <span className="text-xs font-normal text-stone-400">天</span>
                </div>
                <div className="text-[9.5px] text-stone-500 truncate">心智惯性正在强化</div>
              </div>

              <div className="p-2.5 rounded-xl bg-stone-900/90 border border-stone-800 space-y-0.5">
                <div className="flex items-center justify-between text-[10.5px] text-stone-400">
                  <span>总训练经验</span>
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                </div>
                <div className="font-numeric text-base font-bold text-stone-100">
                  {xp.toLocaleString()} <span className="text-xs font-normal text-stone-400">XP</span>
                </div>
                <div className="text-[9.5px] text-stone-500 truncate">击败 82% 研习者</div>
              </div>

              <div className="p-2.5 rounded-xl bg-stone-900/90 border border-stone-800 space-y-0.5">
                <div className="flex items-center justify-between text-[10.5px] text-stone-400">
                  <span>掌握定律</span>
                  <Trophy className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="font-numeric text-base font-bold text-emerald-400">
                  {lawsMasteredCount} <span className="text-xs font-normal text-stone-400">/ 60</span>
                </div>
                <div className="text-[9.5px] text-stone-500 truncate">
                  掌握率 {Math.round((lawsMasteredCount / 60) * 100)}%
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-stone-900/90 border border-stone-800 space-y-0.5">
                <div className="flex items-center justify-between text-[10.5px] text-stone-400">
                  <span>综合指数</span>
                  <Activity className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <div className="font-numeric text-base font-bold text-indigo-300">
                  {cognitiveScore} <span className="text-xs font-normal text-stone-400">/ 100</span>
                </div>
                <div className="text-[9.5px] text-stone-500 truncate">脑力处于高位区间</div>
              </div>

              <div className="p-2.5 rounded-xl bg-stone-900/90 border border-stone-800 space-y-0.5">
                <div className="flex items-center justify-between text-[10.5px] text-stone-400">
                  <span>测试准确率</span>
                  <Target className="w-3.5 h-3.5 text-stone-400" />
                </div>
                <div className="font-numeric text-base font-bold text-stone-100">
                  92.4 <span className="text-xs font-normal text-stone-400">%</span>
                </div>
                <div className="text-[9.5px] text-stone-500 truncate">去直觉偏见敏锐</div>
              </div>

              <div className="p-2.5 rounded-xl bg-stone-900/90 border border-stone-800 space-y-0.5">
                <div className="flex items-center justify-between text-[10.5px] text-stone-400">
                  <span>情绪手记</span>
                  <PenLine className="w-3.5 h-3.5 text-stone-400" />
                </div>
                <div className="font-numeric text-base font-bold text-stone-100">
                  {journalCount} <span className="text-xs font-normal text-stone-400">篇</span>
                </div>
                <div className="text-[9.5px] text-stone-500 truncate">CBT 复盘已归档</div>
              </div>
            </div>

            {/* Five-Dimensional Cognitive Dimensions */}
            <div className="p-3 rounded-xl bg-stone-900/80 border border-stone-800 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                <span className="font-semibold text-stone-200 flex items-center gap-1.5">
                  <Brain className="w-3.5 h-3.5 text-indigo-400" />
                  <span>五维心智神经维度现状 (Cognitive Dimensions)</span>
                </span>
                <span className="text-[10px] text-stone-500">
                  经典心理实验表现加权
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 font-numeric">
                {[
                  { name: '工作记忆', val: user?.stats?.memory ?? 88, color: 'bg-indigo-500' },
                  { name: '专注抗扰', val: user?.stats?.attention ?? 92, color: 'bg-emerald-500' },
                  { name: '去偏决策', val: user?.stats?.decision ?? 85, color: 'bg-amber-500' },
                  { name: '批判推理', val: user?.stats?.reasoning ?? 80, color: 'bg-rose-500' },
                  { name: '心理定律', val: user?.stats?.knowledge ?? 78, color: 'bg-purple-500' },
                ].map((dim, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-[10.5px]">
                      <span className="text-stone-400">{dim.name}</span>
                      <span className="font-bold text-stone-200">{dim.val}%</span>
                    </div>
                    <div className="w-full h-1 rounded-full bg-stone-800 overflow-hidden">
                      <div
                        className={`h-full ${dim.color} rounded-full transition-all duration-500`}
                        style={{ width: `${dim.val}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions Dock on Dark Tray */}
            <div className="pt-0.5 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleCollapse();
                    navigate('/quiz');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 text-stone-950 hover:bg-amber-400 text-xs font-semibold flex items-center gap-1.5 transition-all btn-tactile cursor-pointer shadow-xs"
                >
                  <Zap className="w-3.5 h-3.5 fill-stone-950" />
                  <span>60秒心理快问快答</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleCollapse();
                    openComposerWithPreload();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-semibold flex items-center gap-1.5 transition-colors btn-tactile cursor-pointer"
                >
                  <PenLine className="w-3.5 h-3.5 text-stone-300" />
                  <span>记录今日情绪觉察</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleCollapse();
                    setBreathingOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-semibold flex items-center gap-1.5 transition-colors btn-tactile cursor-pointer"
                >
                  <Wind className="w-3.5 h-3.5 text-stone-300" />
                  <span>专注呼吸调节</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleCollapse();
                    navigate('/progress');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-semibold flex items-center gap-1.5 transition-colors btn-tactile cursor-pointer"
                >
                  <Activity className="w-3.5 h-3.5 text-stone-300" />
                  <span>能力演变图谱</span>
                </button>
              </div>

              {/* Close Button on Tray */}
              <button
                type="button"
                onClick={handleCollapse}
                className="text-xs font-semibold text-stone-400 hover:text-stone-100 flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-stone-800 transition-colors cursor-pointer shrink-0"
              >
                <span>收起托盘</span>
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 3. Bottom Drag Handle Grip Bar on Dark Tray */}
          <div
            onClick={!isDragging ? handleToggle : undefined}
            data-drag-handle="true"
            className="w-full h-3 bg-stone-900/90 border-t border-stone-800 flex items-center justify-center cursor-ns-resize hover:bg-stone-800 transition-colors shrink-0"
            title={isExpanded ? '向上滑动或点击收起托盘' : '向下拉动展开完整明细'}
          >
            <div
              className={`w-9 h-1 rounded-full transition-colors ${
                isDragging ? 'bg-amber-400' : 'bg-stone-700'
              }`}
            />
          </div>
        </div>
      </div>

      {/* 2. Downward Content Dimming Overlay (下方内容变暗) */}
      <div
        onClick={handleCollapse}
        className={`fixed inset-x-0 bottom-0 z-20 transition-opacity duration-300 ${
          isExpanded || progress > 0.05
            ? 'pointer-events-auto bg-stone-950/45 backdrop-blur-[1px]'
            : 'pointer-events-none opacity-0'
        }`}
        style={{
          top: `${overlayTop}px`,
          opacity: isDragging
            ? Math.min(0.48, progress * 0.48)
            : isExpanded
            ? 0.45
            : 0,
        }}
        aria-hidden="true"
      />
    </>
  );
};

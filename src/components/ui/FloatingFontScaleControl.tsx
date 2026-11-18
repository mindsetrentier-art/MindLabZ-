import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Type, Check, X, GripVertical, PanelLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FONT_SCALE_OPTIONS, QuizFontScale, useFontScale } from '../../context/FontScaleContext';
import { gameAudio } from '../../utils/gameAudio';

interface FloatingFontScaleControlProps {
  /** Optional variant for dark arena cards vs light paper pages */
  tone?: 'paper' | 'dark';
  /** Optional panel title */
  title?: string;
  /** Optional class override for positioning */
  className?: string;
}

interface BarPosition {
  x: number;
  y: number;
}

const STORAGE_KEY = 'mindlabz_floating_font_bar_pos_v1';
const AUTO_COLLAPSE_DELAY_MS = 5000;
const LEFT_DOCK_DEFAULT_X = 12;
const LEFT_SNAP_THRESHOLD = 52;
const DRAG_ACTIVATION_PX = 6;
const MIN_TOP_PX = 64;
const BOTTOM_CLEARANCE_PX = 136;

const clampPosition = (x: number, y: number, approxWidth = 148): BarPosition => {
  if (typeof window === 'undefined') {
    return { x: LEFT_DOCK_DEFAULT_X, y: 420 };
  }
  const maxX = Math.max(0, window.innerWidth - approxWidth);
  const maxY = Math.max(MIN_TOP_PX, window.innerHeight - BOTTOM_CLEARANCE_PX);
  return {
    x: Math.min(Math.max(0, Math.round(x)), maxX),
    y: Math.min(Math.max(MIN_TOP_PX, Math.round(y)), maxY),
  };
};

const getInitialPosition = (): BarPosition => {
  if (typeof window === 'undefined') {
    return { x: LEFT_DOCK_DEFAULT_X, y: 420 };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<BarPosition>;
      if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
        return clampPosition(parsed.x, parsed.y);
      }
    }
  } catch {
    // ignore storage read errors
  }
  return clampPosition(LEFT_DOCK_DEFAULT_X, window.innerHeight - 164);
};

export const FloatingFontScaleControl: React.FC<FloatingFontScaleControlProps> = ({
  tone = 'paper',
  title = '答题字号调节',
  className = '',
}) => {
  const { fontScale, setFontScale, currentOption } = useFontScale();
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [pos, setPos] = useState<BarPosition>(getInitialPosition);

  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const collapseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragStateRef = useRef<{
    pointerId: number;
    startClientX: number;
    startClientY: number;
    originX: number;
    originY: number;
    didDrag: boolean;
  } | null>(null);
  const suppressClickRef = useRef(false);

  const persistPosition = useCallback((nextPos: BarPosition) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextPos));
    } catch {
      // ignore storage errors
    }
  }, []);

  // Keep position clamped cleanly across viewport resizes / orientation changes
  useEffect(() => {
    const handleResize = () => {
      const btnWidth = buttonRef.current?.offsetWidth || 148;
      setPos((prev) => clampPosition(prev.x, prev.y, isCollapsed ? 40 : btnWidth));
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [isCollapsed]);

  // Auto-collapse after 5 seconds of inactivity onto the left edge (1cm x 2cm bar)
  useEffect(() => {
    if (collapseTimerRef.current) {
      clearTimeout(collapseTimerRef.current);
      collapseTimerRef.current = null;
    }

    if (isCollapsed || isOpen || isDragging) {
      return;
    }

    collapseTimerRef.current = setTimeout(() => {
      setIsOpen(false);
      setIsCollapsed(true);
    }, AUTO_COLLAPSE_DELAY_MS);

    return () => {
      if (collapseTimerRef.current) {
        clearTimeout(collapseTimerRef.current);
        collapseTimerRef.current = null;
      }
    };
  }, [isCollapsed, isOpen, isDragging, fontScale, pos.x, pos.y]);

  // Close popover on outside click or Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDownOutside = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('pointerdown', handlePointerDownOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDownOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleDockLeft = useCallback(() => {
    try {
      gameAudio.playTap();
    } catch {
      // ignore
    }
    setPos((prev) => {
      const next = clampPosition(LEFT_DOCK_DEFAULT_X, prev.y);
      persistPosition(next);
      return next;
    });
  }, [persistPosition]);

  const handleButtonPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    suppressClickRef.current = false;
    const activeX = isCollapsed ? 0 : pos.x;
    dragStateRef.current = {
      pointerId: e.pointerId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      originX: activeX,
      originY: pos.y,
      didDrag: false,
    };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore capture failure on synthetic events
    }
  };

  const handleButtonPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragStateRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;

    const dx = e.clientX - drag.startClientX;
    const dy = e.clientY - drag.startClientY;

    if (!drag.didDrag && Math.hypot(dx, dy) >= DRAG_ACTIVATION_PX) {
      drag.didDrag = true;
      suppressClickRef.current = true;
      setIsDragging(true);
      setIsOpen(false);
    }

    if (drag.didDrag) {
      const btnWidth = buttonRef.current?.offsetWidth || (isCollapsed ? 38 : 148);
      const nextPos = clampPosition(drag.originX + dx, drag.originY + dy, btnWidth);
      setPos(nextPos);
    }
  };

  const finishDrag = (e: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragStateRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;

    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // ignore
    }

    if (drag.didDrag) {
      const dx = e.clientX - drag.startClientX;
      const dy = e.clientY - drag.startClientY;
      const rawX = drag.originX + dx;
      const rawY = drag.originY + dy;
      const btnWidth = buttonRef.current?.offsetWidth || 148;
      // Snap cleanly to the left side when released near the left border
      const targetX = rawX <= LEFT_SNAP_THRESHOLD ? LEFT_DOCK_DEFAULT_X : rawX;
      const snapped = clampPosition(targetX, rawY, btnWidth);
      setPos(snapped);
      persistPosition(snapped);
      setIsDragging(false);
      // Reveal bar cleanly if pulled away from the left border while collapsed
      if (isCollapsed && rawX > LEFT_SNAP_THRESHOLD) {
        setIsCollapsed(false);
      }
    }

    dragStateRef.current = null;
  };

  const handleTriggerClick = () => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }

    try {
      gameAudio.playTap();
    } catch {
      // ignore
    }

    if (isCollapsed) {
      // Tap collapsed 1cm x 2cm left-edge bar -> reveal full bar
      setIsCollapsed(false);
      setPos((prev) => {
        const revealedX = prev.x < LEFT_DOCK_DEFAULT_X ? LEFT_DOCK_DEFAULT_X : prev.x;
        return clampPosition(revealedX, prev.y);
      });
      return;
    }

    setIsOpen((prev) => !prev);
  };

  const handleSelect = (scale: QuizFontScale) => {
    try {
      gameAudio.playTap();
    } catch {
      // ignore
    }
    setFontScale(scale);
  };

  const isDark = tone === 'dark';
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 400;
  const openBelow = pos.y < viewportHeight * 0.44;
  const alignRight = !isCollapsed && pos.x > viewportWidth * 0.52;

  const renderedLeft = isCollapsed && !isDragging ? 0 : pos.x;

  return (
    <div
      ref={containerRef}
      style={{
        left: `${renderedLeft}px`,
        top: `${pos.y}px`,
      }}
      className={`fixed z-40 no-print ${
        isDragging
          ? 'transition-none'
          : 'transition-[left,top] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]'
      } ${className}`}
    >
      {/* Expandable 3-Preset Font Scale Panel */}
      <AnimatePresence>
        {isOpen && !isCollapsed && (
          <motion.div
            role="dialog"
            aria-label="答题字体大小设置"
            initial={{ opacity: 0, y: openBelow ? -10 : 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: openBelow ? -8 : 8, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className={`absolute ${openBelow ? 'top-full mt-3' : 'bottom-full mb-3'} ${
              alignRight ? 'right-0' : 'left-0'
            } w-[min(calc(100vw-2rem),310px)] rounded-2xl p-3.5 border shadow-2xl backdrop-blur-xl ${
              isDark
                ? 'bg-stone-950/95 border-white/15 text-stone-100'
                : 'bg-white/96 border-stone-200/95 text-stone-900'
            }`}
          >
            {/* Panel Header */}
            <div
              className={`flex items-center justify-between gap-2 pb-2.5 mb-2.5 border-b ${
                isDark ? 'border-white/15' : 'border-stone-200/70'
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    isDark ? 'bg-white/10 text-indigo-300' : 'bg-stone-100 text-stone-800'
                  }`}
                >
                  <Type className="w-4 h-4" />
                </span>
                <div>
                  <div className="text-xs font-bold leading-tight">{title}</div>
                  <div
                    className={`text-[11px] leading-tight mt-0.5 ${
                      isDark ? 'text-stone-400' : 'text-stone-500'
                    }`}
                  >
                    可拖动位置 · 5秒无操作自动靠左收起
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {pos.x > LEFT_SNAP_THRESHOLD && (
                  <button
                    type="button"
                    onClick={handleDockLeft}
                    aria-label="靠左停靠"
                    title="移至左侧边缘"
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                      isDark
                        ? 'text-stone-400 hover:text-white hover:bg-white/10'
                        : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100'
                    }`}
                  >
                    <PanelLeft className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="关闭字号设置"
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                    isDark
                      ? 'text-stone-400 hover:text-white hover:bg-white/10'
                      : 'text-stone-400 hover:text-stone-800 hover:bg-stone-100'
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 3-Level Segmented Selector: 标准 / 大 / 特大 */}
            <div
              role="radiogroup"
              aria-label="字号等级选择"
              className={`grid grid-cols-3 gap-1.5 p-1 rounded-xl ${
                isDark ? 'bg-white/5 border border-white/10' : 'bg-stone-100/90 border border-stone-200/60'
              }`}
            >
              {FONT_SCALE_OPTIONS.map((option) => {
                const isActive = fontScale === option.id;
                const previewSizeClass =
                  option.id === 'standard'
                    ? 'text-sm'
                    : option.id === 'large'
                    ? 'text-base'
                    : 'text-lg';

                return (
                  <button
                    key={option.id}
                    type="button"
                    role="radio"
                    aria-checked={isActive}
                    onClick={() => handleSelect(option.id)}
                    className={`min-h-[54px] px-2 py-2 rounded-lg flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#532CD8] ${
                      isActive
                        ? isDark
                          ? 'bg-white text-stone-950 shadow-md font-bold'
                          : 'bg-white text-stone-950 shadow-sm border border-stone-200/80 font-bold'
                        : isDark
                        ? 'text-stone-300 hover:text-white hover:bg-white/10 font-medium'
                        : 'text-stone-600 hover:text-stone-900 hover:bg-white/60 font-medium'
                    }`}
                  >
                    <span className={`font-serif-editorial leading-none ${previewSizeClass}`}>
                      {option.previewText}
                    </span>
                    <span className="text-xs whitespace-nowrap flex items-center gap-1 mt-1">
                      <span>{option.label}</span>
                      {isActive && <Check className="w-3 h-3 text-[#532CD8]" />}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active Preset Readability Description */}
            <div
              className={`mt-2.5 px-2.5 py-2 rounded-xl flex items-center justify-between gap-2 text-[11px] ${
                isDark
                  ? 'bg-white/5 text-stone-300'
                  : 'bg-[#FAF8F5] border border-stone-200/60 text-stone-600'
              }`}
            >
              <span className="leading-snug">{currentOption.description}</span>
              <span
                className={`font-numeric font-bold shrink-0 px-1.5 py-0.5 rounded-md ${
                  isDark ? 'bg-white/10 text-stone-200' : 'bg-white text-stone-800 border border-stone-200/70'
                }`}
              >
                {currentOption.scaleHint}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Primary Trigger Button: Full Draggable Pill <-> 1cm x 2cm Left-Border Collapsed Bar */}
      <button
        ref={buttonRef}
        type="button"
        onPointerDown={handleButtonPointerDown}
        onPointerMove={handleButtonPointerMove}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
        onClick={handleTriggerClick}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={
          isCollapsed
            ? `展开字号调节栏（当前：${currentOption.label}）`
            : `调整答题字号，当前：${currentOption.label}（可拖动位置）`
        }
        title={
          isCollapsed
            ? `点击展开字号栏（当前：${currentOption.label}）`
            : `答题字号：${currentOption.label}（可拖动 · 5秒后收起至左侧边缘）`
        }
        className={`touch-none select-none overflow-hidden flex items-center justify-center backdrop-blur-md border shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#532CD8] ${
          isDragging ? 'cursor-grabbing scale-[1.03] shadow-2xl' : 'cursor-grab active:scale-[0.98]'
        } ${
          isDragging
            ? 'transition-none'
            : 'transition-[width,height,padding,border-radius,background-color,box-shadow,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]'
        } ${
          isCollapsed
            ? `w-[1cm] h-[2cm] min-w-0 min-h-0 p-0 rounded-l-none rounded-r-xl border-l-0 flex-col gap-1 ${
                isDark
                  ? 'bg-stone-900/92 hover:bg-stone-900 text-white border-white/25'
                  : 'bg-white/95 hover:bg-white text-stone-900 border-stone-300/90'
              }`
            : `min-h-[44px] pl-2.5 pr-3.5 py-2 rounded-full gap-2 ${
                isOpen
                  ? 'chameleon-btn border-white/25'
                  : isDark
                  ? 'bg-stone-900/90 hover:bg-stone-900 text-white border-white/20'
                  : 'bg-white/95 hover:bg-white text-stone-900 border-stone-200/90'
              }`
        }`}
      >
        {isCollapsed ? (
          <>
            <span
              aria-hidden="true"
              className={`w-1 h-4 rounded-full ${isDark ? 'bg-amber-400/80' : 'bg-stone-400/80'}`}
            />
            <span className="text-[11px] font-serif-editorial font-bold leading-none">Aa</span>
            <ChevronRight
              className={`w-3 h-3 ${isDark ? 'text-stone-300' : 'text-stone-500'}`}
              aria-hidden="true"
            />
          </>
        ) : (
          <>
            <GripVertical
              className={`w-3.5 h-3.5 shrink-0 -ml-0.5 ${
                isOpen ? 'text-white/70' : isDark ? 'text-stone-400' : 'text-stone-400'
              }`}
              aria-hidden="true"
            />
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-serif-editorial font-bold shrink-0 ${
                isOpen
                  ? 'bg-white/20 text-white'
                  : isDark
                  ? 'bg-white/12 text-white'
                  : 'bg-stone-100 text-stone-800'
              }`}
            >
              Aa
            </span>
            <span className="text-xs font-semibold whitespace-nowrap tracking-tight">
              字号 · {currentOption.label}
            </span>
          </>
        )}
      </button>
    </div>
  );
};

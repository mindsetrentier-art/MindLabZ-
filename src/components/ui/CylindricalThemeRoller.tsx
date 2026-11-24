import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Compass, Pause, Play, RotateCw } from 'lucide-react';
import { gameAudio } from '../../utils/gameAudio';

export interface CylindricalThemeItem {
  id: string;
  label: string;
  group: string;
  count?: number;
  countLabel?: string;
  subtitle?: string;
  accentColor: string;
  icon?: React.ReactNode;
}

export interface CylindricalThemeChangeMeta {
  isAuto?: boolean;
  source?: 'auto' | 'swipe' | 'drag' | 'click' | 'keyboard' | 'wheel';
}

interface CylindricalThemeRollerProps {
  items: CylindricalThemeItem[];
  activeId: string;
  onChange: (id: string, meta?: CylindricalThemeChangeMeta) => void;
  title?: string;
  variant?: 'library' | 'arena';
  autoPlay?: boolean;
  autoPlayIntervalMs?: number;
  className?: string;
}

const SLOT_DEG = 34;
const CYLINDER_RADIUS = 620;
const DRAG_PX_PER_SLOT = 185;
const SWIPE_MIN_DISTANCE_PX = 28;
const SWIPE_SNAP_DISTANCE_PX = 44;
const SWIPE_MIN_VELOCITY_PX_MS = 0.25;

function wrapIndex(idx: number, total: number): number {
  if (total <= 0) return 0;
  return ((idx % total) + total) % total;
}

/**
 * Computes shortest signed arc offset in (-total/2, total/2] so circular transitions
 * across the boundary (e.g. last -> first) rotate smoothly along the rim without teleporting.
 */
function getCircularOffset(idx: number, position: number, total: number): number {
  if (total <= 0) return 0;
  const raw = idx - position;
  const mod = ((raw % total) + total) % total;
  return mod > total / 2 ? mod - total : mod;
}

export const CylindricalThemeRoller: React.FC<CylindricalThemeRollerProps> = ({
  items,
  activeId,
  onChange,
  title = '分类滚筒索引 · 快速直达',
  variant = 'library',
  autoPlay = true,
  autoPlayIntervalMs = 5500,
  className = '',
}) => {
  const total = items.length;
  const activeIndex = Math.max(
    0,
    items.findIndex((item) => item.id === activeId)
  );

  // Continuously animated angular drum position driven by rAF along the circular arc
  const [renderPos, setRenderPos] = useState<number>(activeIndex);
  const [isDragging, setIsDragging] = useState(false);

  // Auto-rotation pause/stop state machine
  const [autoPlayStoppedByUser, setAutoPlayStoppedByUser] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isFocusWithin, setIsFocusWithin] = useState<boolean>(false);
  const [isInView, setIsInView] = useState<boolean>(true);
  const [isPageVisible, setIsPageVisible] = useState<boolean>(() =>
    typeof document !== 'undefined' ? !document.hidden : true
  );
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(() =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  );

  const rootRef = useRef<HTMLDivElement | null>(null);
  const renderPosRef = useRef<number>(activeIndex);
  const targetPosRef = useRef<number>(activeIndex);
  const angularVelRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);
  const autoTimerRef = useRef<number | null>(null);
  const autoPlayStoppedRef = useRef<boolean>(false);
  const suppressNextClickRef = useRef<boolean>(false);

  // Mouse/Pen pointer drag & flick tracking
  const dragRef = useRef<{
    active: boolean;
    pointerId: number | null;
    startX: number;
    startTime: number;
    lastX: number;
    lastTime: number;
    velocityX: number;
    startPos: number;
    movedPx: number;
    lastSlot: number;
  }>({
    active: false,
    pointerId: null,
    startX: 0,
    startTime: 0,
    lastX: 0,
    lastTime: 0,
    velocityX: 0,
    startPos: activeIndex,
    movedPx: 0,
    lastSlot: activeIndex,
  });

  // Dedicated native touch swipe tracking (avoids vertical scroll conflict & double-firing)
  const touchRef = useRef<{
    active: boolean;
    touchId: number | null;
    startX: number;
    startY: number;
    startTime: number;
    lastX: number;
    lastTime: number;
    velocityX: number;
    startPos: number;
    movedPx: number;
    lastSlot: number;
    axisLock: 'pending' | 'horizontal' | 'vertical';
  }>({
    active: false,
    touchId: null,
    startX: 0,
    startY: 0,
    startTime: 0,
    lastX: 0,
    lastTime: 0,
    velocityX: 0,
    startPos: activeIndex,
    movedPx: 0,
    lastSlot: activeIndex,
    axisLock: 'pending',
  });

  const clearAutoTimer = useCallback(() => {
    if (autoTimerRef.current !== null) {
      window.clearInterval(autoTimerRef.current);
      autoTimerRef.current = null;
    }
  }, []);

  /**
   * Synchronously halts any pending auto-rotation timer and marks auto-play stopped
   * upon user interaction so manual swipes/clicks never conflict with timers.
   */
  const stopAutoPlayFromInteraction = useCallback(() => {
    clearAutoTimer();
    if (!autoPlayStoppedRef.current) {
      autoPlayStoppedRef.current = true;
      setAutoPlayStoppedByUser(true);
    }
  }, [clearAutoTimer]);

  const stopAnimation = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const startAnimation = useCallback(() => {
    if (typeof window === 'undefined') return;

    if (prefersReducedMotion) {
      stopAnimation();
      angularVelRef.current = 0;
      renderPosRef.current = targetPosRef.current;
      setRenderPos(targetPosRef.current);
      return;
    }

    if (rafRef.current !== null) return;

    let lastTime = performance.now();

    const tick = (now: number) => {
      if (dragRef.current.active || (touchRef.current.active && touchRef.current.axisLock === 'horizontal')) {
        rafRef.current = null;
        return;
      }

      const dtSec = Math.min(0.032, Math.max(0.004, (now - lastTime) / 1000));
      lastTime = now;

      const diff = targetPosRef.current - renderPosRef.current;
      if (Math.abs(diff) < 0.0015 && Math.abs(angularVelRef.current) < 0.015) {
        angularVelRef.current = 0;
        renderPosRef.current = targetPosRef.current;
        setRenderPos(targetPosRef.current);
        rafRef.current = null;
        return;
      }

      // 2nd-order critically/slightly-underdamped spring physics preserving release velocity
      const stiffness = 175;
      const damping = 21;
      const accel = stiffness * diff - damping * angularVelRef.current;
      angularVelRef.current += accel * dtSec;
      const next = renderPosRef.current + angularVelRef.current * dtSec;

      renderPosRef.current = next;
      setRenderPos(next);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [prefersReducedMotion, stopAnimation]);

  useEffect(() => {
    return () => {
      stopAnimation();
      clearAutoTimer();
    };
  }, [stopAnimation, clearAutoTimer]);

  // Watch prefers-reduced-motion changes
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChangeMq = (ev: MediaQueryListEvent) => setPrefersReducedMotion(ev.matches);
    mq.addEventListener?.('change', onChangeMq);
    return () => mq.removeEventListener?.('change', onChangeMq);
  }, []);

  // Watch browser tab visibility so background tabs never cycle filters
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const onVisChange = () => setIsPageVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVisChange);
    return () => document.removeEventListener('visibilitychange', onVisChange);
  }, []);

  // Watch viewport visibility so reading content below the roller pauses auto-rotation
  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) {
          setIsInView(entry.isIntersecting);
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Smoothly align targetPosRef to shortest circular path whenever activeId changes externally
  useEffect(() => {
    if (dragRef.current.active || touchRef.current.active || total === 0) return;
    const delta = getCircularOffset(activeIndex, targetPosRef.current, total);
    if (Math.abs(delta) > 0.001) {
      targetPosRef.current = targetPosRef.current + delta;
      startAnimation();
    }
  }, [activeIndex, total, startAnimation]);

  // Keep latest activeId / items / onChange in refs so interval callback never uses stale closures
  const latestStateRef = useRef({ items, activeId, total, onChange });
  useEffect(() => {
    latestStateRef.current = { items, activeId, total, onChange };
  }, [items, activeId, total, onChange]);

  const isEffectivelyAutoPlaying =
    autoPlay &&
    !autoPlayStoppedByUser &&
    !isHovered &&
    !isFocusWithin &&
    !isDragging &&
    isInView &&
    isPageVisible &&
    !prefersReducedMotion &&
    total > 1;

  // Manage conflict-free auto-rotation interval
  useEffect(() => {
    clearAutoTimer();
    if (!isEffectivelyAutoPlaying) return;

    autoTimerRef.current = window.setInterval(() => {
      if (
        autoPlayStoppedRef.current ||
        dragRef.current.active ||
        touchRef.current.active
      ) {
        return;
      }
      const { items: curItems, activeId: curActiveId, total: curTotal, onChange: curOnChange } =
        latestStateRef.current;
      if (curTotal <= 1) return;

      const nextPos = Math.round(targetPosRef.current) + 1;
      targetPosRef.current = nextPos;
      startAnimation();

      const wrapped = wrapIndex(nextPos, curTotal);
      const target = curItems[wrapped];
      if (target && target.id !== curActiveId) {
        curOnChange(target.id, { isAuto: true, source: 'auto' });
      }
    }, Math.max(2500, autoPlayIntervalMs));

    return () => clearAutoTimer();
  }, [isEffectivelyAutoPlaying, autoPlayIntervalMs, clearAutoTimer, startAnimation]);

  const groups = useMemo(() => {
    const ordered: Array<{ name: string; firstId: string; count: number }> = [];
    const seen = new Map<string, number>();
    for (const item of items) {
      const existingIdx = seen.get(item.group);
      if (existingIdx === undefined) {
        seen.set(item.group, ordered.length);
        ordered.push({ name: item.group, firstId: item.id, count: 1 });
      } else {
        ordered[existingIdx].count += 1;
      }
    }
    return ordered;
  }, [items]);

  const activeItem = items[activeIndex] || items[0];

  const moveToTargetIndex = (
    targetIdx: number,
    source: CylindricalThemeChangeMeta['source'] = 'click'
  ) => {
    if (total === 0) return;
    stopAutoPlayFromInteraction();
    const wrapped = wrapIndex(targetIdx, total);
    const delta = getCircularOffset(wrapped, targetPosRef.current, total);
    targetPosRef.current = targetPosRef.current + delta;
    startAnimation();

    const target = items[wrapped];
    if (target && target.id !== activeId) {
      gameAudio.playSelect();
      onChange(target.id, { isAuto: false, source });
    }
  };

  const handleStep = (
    delta: -1 | 1,
    source: CylindricalThemeChangeMeta['source'] = 'click'
  ) => {
    if (total === 0) return;
    stopAutoPlayFromInteraction();
    const nextPos = Math.round(targetPosRef.current) + delta;
    targetPosRef.current = nextPos;
    startAnimation();

    const wrapped = wrapIndex(nextPos, total);
    const target = items[wrapped];
    if (target && target.id !== activeId) {
      gameAudio.playSelect();
      onChange(target.id, { isAuto: false, source });
    }
  };

  /**
   * Computes final snapped slot with inertial momentum coasting from drag/flick velocity.
   */
  const resolveSwipeTargetSlot = (
    startPos: number,
    currentRenderPos: number,
    totalDx: number,
    totalDt: number,
    instantVx: number
  ): { slot: number; didSwipeOrDrag: boolean; releaseVelSlotsSec: number } => {
    const avgVx = totalDx / Math.max(1, totalDt);
    const effectiveVx = Math.abs(instantVx) > Math.abs(avgVx) ? instantVx : avgVx;
    const releaseVelSlotsSec = (-effectiveVx * 1000) / DRAG_PX_PER_SLOT;
    const startSlot = Math.round(startPos);
    const draggedSlot = Math.round(currentRenderPos);

    const isFlick =
      Math.abs(totalDx) >= SWIPE_MIN_DISTANCE_PX &&
      Math.abs(effectiveVx) >= SWIPE_MIN_VELOCITY_PX_MS;
    const isClearSwipe = Math.abs(totalDx) >= SWIPE_SNAP_DISTANCE_PX;

    // Project multi-slot inertial momentum when flicked quickly
    if (isFlick) {
      const coastOffset = Math.max(-3, Math.min(3, Math.round(releaseVelSlotsSec * 0.22)));
      const fallbackDir = totalDx < 0 ? 1 : -1;
      const projectedSlot =
        coastOffset !== 0 ? Math.round(currentRenderPos + coastOffset) : startSlot + fallbackDir;
      return { slot: projectedSlot, didSwipeOrDrag: true, releaseVelSlotsSec };
    }

    if (draggedSlot !== startSlot) {
      return { slot: draggedSlot, didSwipeOrDrag: true, releaseVelSlotsSec };
    }

    if (isClearSwipe) {
      const direction = totalDx < 0 ? 1 : -1;
      return { slot: startSlot + direction, didSwipeOrDrag: true, releaseVelSlotsSec };
    }

    return { slot: startSlot, didSwipeOrDrag: false, releaseVelSlotsSec: releaseVelSlotsSec * 0.5 };
  };

  // --- Mouse / Pen Pointer Handlers (touch uses native touch events below) ---
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') return;
    if ((e.target as HTMLElement).closest('button[data-no-drag="true"]')) return;

    stopAutoPlayFromInteraction();
    stopAnimation();
    const now = performance.now();
    dragRef.current = {
      active: true,
      pointerId: e.pointerId,
      startX: e.clientX,
      startTime: now,
      lastX: e.clientX,
      lastTime: now,
      velocityX: 0,
      startPos: renderPosRef.current,
      movedPx: 0,
      lastSlot: Math.round(renderPosRef.current),
    };
    setIsDragging(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore if capture unsupported
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch' || !dragRef.current.active) return;
    const now = performance.now();
    const dx = e.clientX - dragRef.current.startX;
    const stepDt = Math.max(1, now - dragRef.current.lastTime);
    const instantVx = (e.clientX - dragRef.current.lastX) / stepDt;
    dragRef.current.velocityX = instantVx * 0.6 + dragRef.current.velocityX * 0.4;
    dragRef.current.lastX = e.clientX;
    dragRef.current.lastTime = now;
    dragRef.current.movedPx = Math.max(dragRef.current.movedPx, Math.abs(dx));

    const nextPos = dragRef.current.startPos - dx / DRAG_PX_PER_SLOT;
    const nearestSlot = Math.round(nextPos);
    if (nearestSlot !== dragRef.current.lastSlot) {
      dragRef.current.lastSlot = nearestSlot;
      gameAudio.playTap();
    }
    renderPosRef.current = nextPos;
    targetPosRef.current = nextPos;
    setRenderPos(nextPos);
  };

  const finishDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch' || !dragRef.current.active) return;
    const drag = dragRef.current;
    drag.active = false;
    setIsDragging(false);
    try {
      if (drag.pointerId !== null) {
        e.currentTarget.releasePointerCapture(drag.pointerId);
      }
    } catch {
      // ignore
    }

    const totalDx = drag.lastX - drag.startX;
    const totalDt = performance.now() - drag.startTime;
    const { slot, didSwipeOrDrag, releaseVelSlotsSec } = resolveSwipeTargetSlot(
      drag.startPos,
      renderPosRef.current,
      totalDx,
      totalDt,
      drag.velocityX
    );

    if (drag.movedPx > 8) {
      suppressNextClickRef.current = true;
      window.setTimeout(() => {
        suppressNextClickRef.current = false;
      }, 80);
    }

    angularVelRef.current = Math.max(-14, Math.min(14, releaseVelSlotsSec));

    if (didSwipeOrDrag) {
      targetPosRef.current = slot;
      startAnimation();

      const wrapped = wrapIndex(slot, total);
      const target = items[wrapped];
      if (target && target.id !== activeId) {
        gameAudio.playSelect();
        onChange(target.id, { isAuto: false, source: 'drag' });
      }
    } else {
      const delta = getCircularOffset(activeIndex, renderPosRef.current, total);
      targetPosRef.current = renderPosRef.current + delta;
      startAnimation();
    }
  };

  // --- Dedicated Touch Swipe Gesture Handlers (Swipe Left / Swipe Right) ---
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length !== 1) return;
    if ((e.target as HTMLElement).closest('button[data-no-drag="true"]')) return;

    stopAutoPlayFromInteraction();
    const touch = e.touches[0];
    const now = performance.now();

    touchRef.current = {
      active: true,
      touchId: touch.identifier,
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: now,
      lastX: touch.clientX,
      lastTime: now,
      velocityX: 0,
      startPos: renderPosRef.current,
      movedPx: 0,
      lastSlot: Math.round(renderPosRef.current),
      axisLock: 'pending',
    };
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const tState = touchRef.current;
    if (!tState.active || tState.touchId === null) return;

    let activeTouch: React.Touch | null = null;
    for (let i = 0; i < e.touches.length; i += 1) {
      if (e.touches[i].identifier === tState.touchId) {
        activeTouch = e.touches[i];
        break;
      }
    }
    if (!activeTouch) return;

    const dx = activeTouch.clientX - tState.startX;
    const dy = activeTouch.clientY - tState.startY;

    if (tState.axisLock === 'pending') {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      if (Math.abs(dy) > Math.abs(dx) * 1.15) {
        // Vertical scroll gesture: abort horizontal swipe and let page scroll cleanly
        tState.axisLock = 'vertical';
        tState.active = false;
        return;
      }
      tState.axisLock = 'horizontal';
      stopAnimation();
      setIsDragging(true);
    }

    if (tState.axisLock !== 'horizontal') return;

    const now = performance.now();
    const stepDt = Math.max(1, now - tState.lastTime);
    const instantVx = (activeTouch.clientX - tState.lastX) / stepDt;
    tState.velocityX = instantVx * 0.65 + tState.velocityX * 0.35;
    tState.lastX = activeTouch.clientX;
    tState.lastTime = now;
    tState.movedPx = Math.max(tState.movedPx, Math.abs(dx));

    const nextPos = tState.startPos - dx / DRAG_PX_PER_SLOT;
    const nearestSlot = Math.round(nextPos);
    if (nearestSlot !== tState.lastSlot) {
      tState.lastSlot = nearestSlot;
      gameAudio.playTap();
    }
    renderPosRef.current = nextPos;
    targetPosRef.current = nextPos;
    setRenderPos(nextPos);
  };

  const finishTouch = () => {
    const tState = touchRef.current;
    if (!tState.active) return;

    const wasHorizontal = tState.axisLock === 'horizontal';
    tState.active = false;
    tState.touchId = null;
    setIsDragging(false);

    if (!wasHorizontal) return;

    const totalDx = tState.lastX - tState.startX;
    const totalDt = performance.now() - tState.startTime;
    const { slot, didSwipeOrDrag, releaseVelSlotsSec } = resolveSwipeTargetSlot(
      tState.startPos,
      renderPosRef.current,
      totalDx,
      totalDt,
      tState.velocityX
    );

    if (tState.movedPx > 8) {
      suppressNextClickRef.current = true;
      window.setTimeout(() => {
        suppressNextClickRef.current = false;
      }, 120);
    }

    angularVelRef.current = Math.max(-14, Math.min(14, releaseVelSlotsSec));

    if (didSwipeOrDrag) {
      targetPosRef.current = slot;
      startAnimation();

      const wrapped = wrapIndex(slot, total);
      const target = items[wrapped];
      if (target && target.id !== activeId) {
        gameAudio.playSelect();
        onChange(target.id, { isAuto: false, source: 'swipe' });
      }
    } else {
      const delta = getCircularOffset(activeIndex, renderPosRef.current, total);
      targetPosRef.current = renderPosRef.current + delta;
      startAnimation();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      handleStep(-1, 'keyboard');
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      handleStep(1, 'keyboard');
    } else if (e.key === 'Home' && total > 0) {
      e.preventDefault();
      moveToTargetIndex(0, 'keyboard');
    } else if (e.key === 'End' && total > 0) {
      e.preventDefault();
      moveToTargetIndex(total - 1, 'keyboard');
    }
  };

  const handleToggleAutoPlay = () => {
    gameAudio.playTap();
    if (autoPlayStoppedByUser) {
      autoPlayStoppedRef.current = false;
      setAutoPlayStoppedByUser(false);
    } else {
      stopAutoPlayFromInteraction();
    }
  };

  const isArena = variant === 'arena';

  return (
    <div
      ref={rootRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocusWithin(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setIsFocusWithin(false);
        }
      }}
      className={`rounded-3xl border shadow-sm overflow-hidden select-none transition-colors ${
        isArena
          ? 'bg-gradient-to-b from-[#17162B] via-[#1C1B33] to-[#131324] border-stone-700/80 text-white'
          : 'bg-gradient-to-b from-[#FAF7F2] via-white to-[#F4EFE6] border-stone-200/90 text-stone-900'
      } ${className}`}
    >
      {/* Top Organized Category Group Index Bar (div:nth-of-type(1)) */}
      <div
        className={`px-4 py-2.5 border-b flex flex-wrap items-center justify-between gap-2 text-xs ${
          isArena ? 'border-white/10 bg-white/[0.03]' : 'border-stone-200/80 bg-stone-50/70'
        }`}
      >
        <div className="flex items-center gap-2 shrink-0">
          <Compass className={`w-3.5 h-3.5 ${isArena ? 'text-amber-300' : 'text-amber-700'}`} />
          <span
            className={`font-serif-editorial font-bold ${
              isArena ? 'text-stone-100' : 'text-stone-900'
            }`}
          >
            {title}
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-full">
          {groups.map((grp) => {
            const isActiveGroup = activeItem?.group === grp.name;
            return (
              <button
                key={grp.name}
                type="button"
                onClick={() => {
                  const targetIdx = items.findIndex((i) => i.id === grp.firstId);
                  if (targetIdx !== -1) moveToTargetIndex(targetIdx, 'click');
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isActiveGroup
                    ? isArena
                      ? 'bg-amber-400 text-stone-950 font-bold'
                      : 'bg-stone-900 text-amber-200 font-bold'
                    : isArena
                    ? 'bg-white/10 text-stone-300 hover:bg-white/15 hover:text-white'
                    : 'bg-white text-stone-600 border border-stone-200 hover:border-stone-400 hover:text-stone-900'
                }`}
              >
                {grp.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3D Cylindrical Drum Barrel Stage (div:nth-of-type(2)) */}
      <div
        role="listbox"
        tabIndex={0}
        aria-label={title}
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={finishTouch}
        onTouchCancel={finishTouch}
        onWheel={(e) => {
          if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 18) {
            e.preventDefault();
            handleStep(e.deltaX > 0 ? 1 : -1, 'wheel');
          }
        }}
        className={`relative h-[126px] sm:h-[136px] flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 overflow-hidden ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        style={{ perspective: '1200px', touchAction: 'pan-y' }}
      >
        {/* Left Vignette (div:nth-of-type(1)) */}
        <div
          className={`pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-32 z-20 ${
            isArena
              ? 'bg-gradient-to-r from-[#131324] via-[#131324]/85 to-transparent'
              : 'bg-gradient-to-r from-[#F4EFE6] via-[#F4EFE6]/85 to-transparent'
          }`}
        />
        {/* Right Vignette (div:nth-of-type(2)) */}
        <div
          className={`pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-32 z-20 ${
            isArena
              ? 'bg-gradient-to-l from-[#131324] via-[#131324]/85 to-transparent'
              : 'bg-gradient-to-l from-[#F4EFE6] via-[#F4EFE6]/85 to-transparent'
          }`}
        />

        {/* Center Highlight Aperture Frame (div:nth-of-type(3)) */}
        <div
          className={`pointer-events-none absolute w-[228px] sm:w-[274px] h-[90px] rounded-2xl border z-10 ${
            isArena
              ? 'border-amber-400/35 bg-white/[0.03]'
              : 'border-stone-900/15 bg-stone-900/[0.015]'
          }`}
        />

        {/* Left / Right Barrel Step Controls */}
        <button
          type="button"
          data-no-drag="true"
          onClick={() => handleStep(-1, 'click')}
          aria-label="向左转动滚筒"
          className={`absolute left-2 sm:left-3 z-30 w-9 h-9 rounded-full flex items-center justify-center border shadow-sm cursor-pointer transition-transform active:scale-90 ${
            isArena
              ? 'bg-stone-900/90 border-white/20 text-white hover:bg-stone-800'
              : 'bg-white/95 border-stone-300 text-stone-800 hover:bg-stone-100'
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <button
          type="button"
          data-no-drag="true"
          onClick={() => handleStep(1, 'click')}
          aria-label="向右转动滚筒"
          className={`absolute right-2 sm:right-3 z-30 w-9 h-9 rounded-full flex items-center justify-center border shadow-sm cursor-pointer transition-transform active:scale-90 ${
            isArena
              ? 'bg-stone-900/90 border-white/20 text-white hover:bg-stone-800'
              : 'bg-white/95 border-stone-300 text-stone-800 hover:bg-stone-100'
          }`}
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* 3D Cylinder Cards Facet Ring (div:nth-of-type(4)) */}
        <div
          className="relative w-full h-full flex items-center justify-center"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {items.map((item, idx) => {
            const offset = getCircularOffset(idx, renderPos, total);
            const absOffset = Math.abs(offset);
            const deg = offset * SLOT_DEG;
            const rad = (deg * Math.PI) / 180;
            const translateX = Math.sin(rad) * CYLINDER_RADIUS;
            const translateZ = (Math.cos(rad) - 1) * CYLINDER_RADIUS;
            const scale = Math.max(0.66, 1 - Math.pow(absOffset, 1.15) * 0.18);

            // Mutually exclusive focal threshold (< 0.36) guarantees at most one card is ever focal
            const isFocal = absOffset < 0.36;
            const isVisibleArc = absOffset <= 2.25;
            const opacity = !isVisibleArc
              ? 0
              : Math.max(0.14, 1 - Math.pow(absOffset, 1.32) * 0.42);

            const zIndex = isFocal ? 50 : Math.max(1, Math.round(40 - absOffset * 14));

            return (
              <button
                key={item.id}
                type="button"
                role="option"
                aria-selected={idx === activeIndex}
                aria-hidden={!isVisibleArc}
                tabIndex={isFocal ? 0 : -1}
                onClick={() => {
                  if (suppressNextClickRef.current) return;
                  if (dragRef.current.movedPx <= 8 && touchRef.current.movedPx <= 8) {
                    moveToTargetIndex(idx, 'click');
                  }
                }}
                className={`absolute w-[220px] sm:w-[264px] px-4 py-3 rounded-2xl border text-left focus:outline-none ${
                  isVisibleArc ? 'cursor-pointer' : 'pointer-events-none'
                } ${
                  isFocal
                    ? isArena
                      ? 'bg-stone-900 text-white border-amber-400/75 shadow-xl'
                      : 'bg-stone-900 text-white border-stone-900 shadow-xl'
                    : isArena
                    ? 'bg-[#23223F]/90 text-stone-300 border-white/15 hover:border-white/30'
                    : 'bg-white/95 text-stone-600 border-stone-200/80 hover:border-stone-400 shadow-xs'
                }`}
                style={{
                  zIndex,
                  opacity,
                  backfaceVisibility: 'hidden',
                  willChange: 'transform, opacity',
                  transform: `translate3d(${translateX.toFixed(1)}px, 0px, ${translateZ.toFixed(
                    1
                  )}px) rotateY(${deg.toFixed(1)}deg) scale(${scale.toFixed(3)})`,
                }}
              >
                {/* Accent Hairline */}
                <div
                  className="h-[2.5px] w-10 rounded-full mb-1.5"
                  style={{ backgroundColor: item.accentColor }}
                />

                {/* Single Clean Title Row */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {item.icon && (
                      <span
                        className="shrink-0"
                        style={{ color: isFocal ? '#FCD34D' : item.accentColor }}
                      >
                        {item.icon}
                      </span>
                    )}
                    <span className="font-serif-editorial font-bold text-xs sm:text-[13px] truncate">
                      {item.label}
                    </span>
                  </div>

                  {(item.count !== undefined || item.countLabel) && (
                    <span
                      className={`font-mono text-[10px] font-bold tabular-nums shrink-0 ${
                        isFocal
                          ? 'text-amber-300'
                          : isArena
                          ? 'text-stone-400'
                          : 'text-stone-500'
                      }`}
                    >
                      {item.countLabel ?? `(${item.count})`}
                    </span>
                  )}
                </div>

                {/* Single Subtle Descriptor (Only visible when centered as the single focal title) */}
                <div
                  className={`mt-1 text-[10px] truncate transition-opacity duration-150 ${
                    isFocal ? 'text-stone-300 opacity-100' : 'opacity-0'
                  }`}
                >
                  {item.subtitle || item.group}
                </div>
              </button>
            );
          })}
        </div>

        {/* Top & Bottom Cylindrical Rim Gradient Masks */}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-x-0 top-0 h-5 sm:h-6 z-20 ${
            isArena
              ? 'bg-gradient-to-b from-[#17162B] via-[#17162B]/70 to-transparent'
              : 'bg-gradient-to-b from-[#FAF7F2] via-[#FAF7F2]/70 to-transparent'
          }`}
        />
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-x-0 bottom-0 h-5 sm:h-6 z-20 ${
            isArena
              ? 'bg-gradient-to-t from-[#131324] via-[#131324]/70 to-transparent'
              : 'bg-gradient-to-t from-[#F4EFE6] via-[#F4EFE6]/70 to-transparent'
          }`}
        />
      </div>

      {/* Bottom Calibrated Drum Dial & Quick Jump Track (div:nth-of-type(3)) */}
      <div
        className={`px-4 py-2 border-t flex items-center justify-between gap-3 text-[11px] ${
          isArena ? 'border-white/10 bg-black/25' : 'border-stone-200/80 bg-stone-50/90'
        }`}
      >
        <span
          className={`hidden sm:inline-flex items-center gap-1.5 font-mono shrink-0 ${
            isArena ? 'text-stone-400' : 'text-stone-500'
          }`}
        >
          <RotateCw className="w-3 h-3" />
          <span>左右滑动 / 拖拽转动圆筒</span>
        </span>

        {/* Interactive Dot/Pill Dial */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar mx-auto sm:mx-0">
          {items.map((item, idx) => {
            const isActive = idx === activeIndex;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => moveToTargetIndex(idx, 'click')}
                title={`${item.group} · ${item.label}`}
                aria-label={`切换到 ${item.label}`}
                className={`h-2 rounded-full transition-all cursor-pointer shrink-0 ${
                  isActive
                    ? 'w-7'
                    : isArena
                    ? 'w-2 bg-white/25 hover:bg-white/50'
                    : 'w-2 bg-stone-300 hover:bg-stone-500'
                }`}
                style={isActive ? { backgroundColor: item.accentColor } : undefined}
              />
            );
          })}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {autoPlay && total > 1 && (
            <button
              type="button"
              data-no-drag="true"
              onClick={handleToggleAutoPlay}
              title={autoPlayStoppedByUser ? '点击恢复自动轮播' : '点击暂停自动轮播'}
              aria-label={autoPlayStoppedByUser ? '恢复自动轮播' : '暂停自动轮播'}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border transition-colors cursor-pointer ${
                autoPlayStoppedByUser
                  ? isArena
                    ? 'border-white/15 bg-white/5 text-stone-300 hover:bg-white/10'
                    : 'border-stone-200 bg-white text-stone-600 hover:border-stone-400'
                  : isHovered || isFocusWithin
                  ? isArena
                    ? 'border-amber-400/30 bg-amber-400/10 text-amber-200'
                    : 'border-amber-300 bg-amber-50 text-amber-800'
                  : isArena
                  ? 'border-amber-400/40 bg-amber-400/15 text-amber-300'
                  : 'border-stone-300 bg-stone-100 text-stone-700'
              }`}
            >
              {autoPlayStoppedByUser ? (
                <>
                  <Play className="w-2.5 h-2.5" />
                  <span>续播</span>
                </>
              ) : (
                <>
                  <Pause className="w-2.5 h-2.5" />
                  <span>{isHovered || isFocusWithin ? '已暂停' : '自动'}</span>
                </>
              )}
            </button>
          )}

          <span
            className={`font-mono tabular-nums font-bold ${
              isArena ? 'text-amber-300' : 'text-stone-700'
            }`}
          >
            {activeIndex + 1} / {total}
          </span>
        </div>
      </div>
    </div>
  );
};

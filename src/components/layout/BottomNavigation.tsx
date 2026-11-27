import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, BookOpen, PenLine, Gamepad2, User } from 'lucide-react';
import { gameAudio } from '../../utils/gameAudio';
import { FocusSoundscapePlayer } from '../audio/FocusSoundscapePlayer';

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: '探索', icon: Home },
  { to: '/learn', label: '定律库', icon: BookOpen },
  { to: '/journal', label: '心智手记', icon: PenLine },
  { to: '/games', label: '竞技场', icon: Gamepad2 },
  { to: '/profile', label: '我的', icon: User },
];

interface CapsuleGeometry {
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
}

interface CapsuleMotionState {
  scaleX: number;
  scaleY: number;
  origin: 'left center' | 'right center' | 'center center';
  phase: 'idle' | 'stretching' | 'settling';
}

const STRETCH_RELEASE_MS = 140;
const SETTLE_IDLE_MS = 400;

export const BottomNavigation: React.FC = () => {
  const location = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  const [capsuleGeom, setCapsuleGeom] = useState<CapsuleGeometry>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    opacity: 0,
  });

  const [motionState, setMotionState] = useState<CapsuleMotionState>({
    scaleX: 1,
    scaleY: 1,
    origin: 'center center',
    phase: 'idle',
  });

  const isInitialRef = useRef(true);
  const prevXRef = useRef<number | null>(null);
  const stretchTimerRef = useRef<number | null>(null);
  const settleTimerRef = useRef<number | null>(null);

  const getActiveIndex = useCallback((pathname: string): number => {
    if (pathname === '/') return 0;
    if (
      pathname.startsWith('/learn') ||
      pathname.startsWith('/knowledge-graph') ||
      pathname.startsWith('/law/') ||
      pathname.startsWith('/laws') ||
      pathname.startsWith('/search') ||
      pathname.startsWith('/emotional-')
    ) {
      return 1;
    }
    if (pathname.startsWith('/journal')) return 2;
    if (
      pathname.startsWith('/games') ||
      pathname.startsWith('/game/') ||
      pathname === '/challenge' ||
      pathname === '/quiz'
    ) {
      return 3;
    }
    if (
      pathname.startsWith('/profile') ||
      pathname.startsWith('/progress') ||
      pathname.startsWith('/assessment') ||
      pathname.startsWith('/cognitive-assessment')
    ) {
      return 4;
    }
    const idx = NAV_ITEMS.findIndex((it) => it.to !== '/' && pathname.startsWith(it.to));
    return idx !== -1 ? idx : 0;
  }, []);

  const activeIndex = getActiveIndex(location.pathname);

  const triggerDirectionalStretch = useCallback((deltaX: number) => {
    const absDelta = Math.abs(deltaX);
    if (absDelta < 4) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    if (stretchTimerRef.current !== null) {
      window.clearTimeout(stretchTimerRef.current);
      stretchTimerRef.current = null;
    }
    if (settleTimerRef.current !== null) {
      window.clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    }

    // Elongate along the movement axis proportional to travel distance
    const stretchX = Math.min(1.42, 1.16 + absDelta / 540);
    const squashY = Math.max(0.86, 1 - (stretchX - 1) * 0.34);
    // Anchor origin on the leading side so the trailing edge lags and stretches along travel direction
    const origin: CapsuleMotionState['origin'] =
      deltaX > 0 ? 'right center' : 'left center';

    setMotionState({
      scaleX: stretchX,
      scaleY: squashY,
      origin,
      phase: 'stretching',
    });

    stretchTimerRef.current = window.setTimeout(() => {
      setMotionState({
        scaleX: 1,
        scaleY: 1,
        origin,
        phase: 'settling',
      });

      settleTimerRef.current = window.setTimeout(() => {
        setMotionState({
          scaleX: 1,
          scaleY: 1,
          origin: 'center center',
          phase: 'idle',
        });
      }, SETTLE_IDLE_MS);
    }, STRETCH_RELEASE_MS);
  }, []);

  const updateCapsule = useCallback(
    (animateDirectional = false) => {
      if (!containerRef.current) return;
      const currentActiveIdx = getActiveIndex(location.pathname);
      const targetEl = itemRefs.current[currentActiveIdx];
      if (!targetEl) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const itemRect = targetEl.getBoundingClientRect();
      const nextX = Math.round(itemRect.left - containerRect.left);
      const nextY = Math.round(itemRect.top - containerRect.top);
      const nextWidth = Math.round(itemRect.width);
      const nextHeight = Math.round(itemRect.height);

      if (animateDirectional && !isInitialRef.current && prevXRef.current !== null) {
        const deltaX = nextX - prevXRef.current;
        if (Math.abs(deltaX) >= 4) {
          triggerDirectionalStretch(deltaX);
        }
      }

      prevXRef.current = nextX;

      setCapsuleGeom((prev) => {
        if (
          prev.x === nextX &&
          prev.y === nextY &&
          prev.width === nextWidth &&
          prev.height === nextHeight &&
          prev.opacity === 1
        ) {
          return prev;
        }
        return {
          x: nextX,
          y: nextY,
          width: nextWidth,
          height: nextHeight,
          opacity: 1,
        };
      });
    },
    [location.pathname, getActiveIndex, triggerDirectionalStretch]
  );

  useLayoutEffect(() => {
    updateCapsule(true);
    const timer = window.setTimeout(() => {
      isInitialRef.current = false;
    }, 60);
    return () => window.clearTimeout(timer);
  }, [updateCapsule]);

  useEffect(() => {
    const handleResize = () => {
      updateCapsule(false);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        updateCapsule(false);
      });
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      resizeObserver?.disconnect();
    };
  }, [updateCapsule]);

  useEffect(() => {
    return () => {
      if (stretchTimerRef.current !== null) window.clearTimeout(stretchTimerRef.current);
      if (settleTimerRef.current !== null) window.clearTimeout(settleTimerRef.current);
    };
  }, []);

  const innerTransition =
    motionState.phase === 'stretching'
      ? 'transform 135ms cubic-bezier(0.2, 0.9, 0.35, 1)'
      : motionState.phase === 'settling'
        ? 'transform 390ms cubic-bezier(0.22, 1.48, 0.44, 1)'
        : 'transform 180ms ease-out';

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pointer-events-auto glass-dock pb-[max(0.5rem,env(safe-area-inset-bottom))] transition-all">
      {/* Focus Soundscape Player */}
      <FocusSoundscapePlayer />

      <div
        ref={containerRef}
        className="flex justify-around items-center px-2 sm:px-6 md:px-10 lg:px-12 py-1.5 sm:py-2 max-w-2xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto relative"
      >
        {/* Translucent Glass Sliding Capsule Carrier (Glides to New Position + Elastic Rebound) */}
        <div
          aria-hidden="true"
          className="glass-nav-capsule-carrier absolute top-0 left-0 pointer-events-none z-0"
          style={{
            transform: `translate3d(${capsuleGeom.x}px, ${capsuleGeom.y}px, 0)`,
            width: `${capsuleGeom.width}px`,
            height: `${capsuleGeom.height}px`,
            opacity: capsuleGeom.opacity,
            willChange: 'transform, width',
            transitionProperty: isInitialRef.current ? 'none' : 'transform, width, height, opacity',
            transitionDuration: isInitialRef.current ? '0ms' : '460ms',
            transitionTimingFunction: 'cubic-bezier(0.26, 1.34, 0.42, 1)',
          }}
        >
          {/* Inner Frosted Glass Capsule (Stretches Along Travel Vector, Rebounds on Arrival, Specular Edge Rim) */}
          <div
            className="glass-nav-capsule relative w-full h-full rounded-full overflow-hidden"
            style={{
              transform: `scale3d(${motionState.scaleX}, ${motionState.scaleY}, 1)`,
              transformOrigin: motionState.origin,
              transition: isInitialRef.current ? 'none' : innerTransition,
              willChange: 'transform',
            }}
          >
            {/* Full-Perimeter Specular Rim Highlight */}
            <div className="glass-nav-capsule-rim" />

            {/* Soft Top Curvature Glint */}
            <div className="absolute inset-x-3 top-[1px] h-[35%] rounded-full bg-gradient-to-b from-white/55 to-transparent pointer-events-none" />
          </div>
        </div>

        {NAV_ITEMS.map((item, index) => {
          const Icon = item.icon;
          const isCurrent = activeIndex === index;
          return (
            <NavLink
              key={item.to}
              ref={(el) => {
                itemRefs.current[index] = el;
              }}
              to={item.to}
              onClick={() => {
                try {
                  gameAudio.playTap();
                } catch {
                  // ignore
                }
              }}
              className={`flex flex-col items-center justify-center min-w-[60px] sm:min-w-[74px] min-h-[44px] py-1.5 px-3.5 sm:px-5 rounded-full transition-colors duration-200 relative z-10 group active:scale-95 touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B45B8] ${
                isCurrent
                  ? 'text-stone-950 font-bold'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              <Icon
                className={`w-5 h-5 mb-0.5 transition-all duration-300 ${
                  isCurrent
                    ? 'stroke-[2.2px] text-stone-950 -translate-y-0.5 scale-105'
                    : 'stroke-[1.6px] text-stone-500 group-hover:text-stone-800'
                }`}
              />
              <span
                className={`text-[10px] tracking-tight whitespace-nowrap transition-colors duration-200 ${
                  isCurrent ? 'font-bold text-stone-950' : 'font-medium text-stone-500'
                }`}
              >
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

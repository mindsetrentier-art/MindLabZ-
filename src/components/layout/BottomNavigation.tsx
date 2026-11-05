import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, BookOpen, PenLine, Gamepad2, User } from 'lucide-react';
import { gameAudio } from '../../utils/gameAudio';

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

export const BottomNavigation: React.FC = () => {
  const location = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  const [highlightStyle, setHighlightStyle] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
    opacity: number;
  }>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    opacity: 0,
  });

  const isInitialRef = useRef(true);

  // Compute active item index from location.pathname accurately across sub-routes
  const getActiveIndex = useCallback((pathname: string): number => {
    if (pathname === '/') return 0;
    if (
      pathname.startsWith('/learn') ||
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

  const updateHighlight = useCallback(() => {
    if (!containerRef.current) return;
    const currentActiveIdx = getActiveIndex(location.pathname);
    const targetEl = itemRefs.current[currentActiveIdx];
    if (!targetEl) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const itemRect = targetEl.getBoundingClientRect();

    setHighlightStyle({
      x: Math.round(itemRect.left - containerRect.left),
      y: Math.round(itemRect.top - containerRect.top),
      width: Math.round(itemRect.width),
      height: Math.round(itemRect.height),
      opacity: 1,
    });
  }, [location.pathname, getActiveIndex]);

  useLayoutEffect(() => {
    updateHighlight();
    const timer = setTimeout(() => {
      isInitialRef.current = false;
    }, 60);
    return () => clearTimeout(timer);
  }, [updateHighlight]);

  useEffect(() => {
    const handleResize = () => {
      updateHighlight();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        updateHighlight();
      });
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      resizeObserver?.disconnect();
    };
  }, [updateHighlight]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pointer-events-auto glass-dock pb-[max(0.5rem,env(safe-area-inset-bottom))] transition-all">
      <div
        ref={containerRef}
        className="flex justify-around items-center px-2 sm:px-6 md:px-10 lg:px-12 py-1.5 sm:py-2.5 max-w-2xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto relative"
      >
        {/* Dynamic Sliding Elastic Rounded Highlight Pill with Spring Bounce */}
        <div
          aria-hidden="true"
          className="absolute top-0 left-0 rounded-2xl pointer-events-none z-0 bg-white/95 backdrop-blur-md border border-stone-200/90 shadow-[0_3px_14px_-2px_rgba(28,25,23,0.12),0_1px_3px_rgba(28,25,23,0.06)]"
          style={{
            transform: `translate3d(${highlightStyle.x}px, ${highlightStyle.y}px, 0)`,
            width: `${highlightStyle.width}px`,
            height: `${highlightStyle.height}px`,
            opacity: highlightStyle.opacity,
            transitionProperty: isInitialRef.current ? 'none' : 'transform, width, height, opacity',
            transitionDuration: isInitialRef.current ? '0ms' : '420ms',
            transitionTimingFunction: 'cubic-bezier(0.34, 1.45, 0.64, 1)',
          }}
        >
          {/* Subtle top reflection sheen & micro-accent */}
          <div className="absolute inset-x-2 top-0 h-[1px] bg-gradient-to-r from-transparent via-stone-900/10 to-transparent" />
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
              className={`flex flex-col items-center justify-center min-w-[50px] sm:min-w-[56px] min-h-[44px] py-1 px-2 sm:px-3 rounded-2xl transition-colors duration-200 relative z-10 group active:scale-95 touch-manipulation ${
                isCurrent
                  ? 'text-stone-950 font-bold'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              <Icon
                className={`w-5 h-5 mb-0.5 transition-all duration-300 ${
                  isCurrent
                    ? 'stroke-[2.2px] text-stone-950 -translate-y-0.5 scale-105'
                    : 'stroke-[1.6px] text-stone-400 group-hover:text-stone-700'
                }`}
              />
              <span
                className={`text-[10px] tracking-tight whitespace-nowrap transition-colors duration-200 ${
                  isCurrent ? 'font-bold text-stone-950' : 'font-medium text-stone-500'
                }`}
              >
                {item.label}
              </span>

              {/* Restrained Editorial Active Indicator Dot */}
              <span
                className={`w-1 h-1 rounded-full bg-stone-900 transition-all duration-300 mt-0.5 ${
                  isCurrent ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
                }`}
              />
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};


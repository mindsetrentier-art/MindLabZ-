import React, { useEffect, useRef, useState } from 'react';

export interface ViewportLawCardProps {
  id?: string;
  as?: 'article' | 'div';
  index?: number;
  isExpanded?: boolean;
  spotlightTick?: number;
  className?: string;
  children: React.ReactNode;
}

export const ViewportLawCard: React.FC<ViewportLawCardProps> = ({
  id,
  as = 'article',
  index = 0,
  isExpanded = false,
  spotlightTick = 0,
  className = '',
  children,
}) => {
  const cardRef = useRef<HTMLDivElement & HTMLElement>(null);
  const [inViewport, setInViewport] = useState<boolean>(() => {
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') {
      return true;
    }
    return false;
  });
  const [replayToggle, setReplayToggle] = useState(false);

  useEffect(() => {
    const el = cardRef.current;
    if (!el || inViewport) return;

    if (typeof IntersectionObserver === 'undefined') {
      setInViewport(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting || entry.intersectionRatio > 0) {
            setInViewport(true);
            observer.unobserve(entry.target);
            break;
          }
        }
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -28px 0px',
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [inViewport]);

  // Replay the subtle viewport sheen smoothly when explicitly drawn/focused via spotlightTick
  useEffect(() => {
    if (!spotlightTick) return;
    setInViewport(false);
    const raf = requestAnimationFrame(() => {
      setReplayToggle((prev) => !prev);
      setInViewport(true);
    });
    return () => cancelAnimationFrame(raf);
  }, [spotlightTick]);

  // Cap stagger delay neatly so scrolled-in cards feel crisp and immediate
  const staggerDelayMs = Math.min(index % 6, 5) * 42;

  const combinedClassName = [
    'editorial-card',
    'editorial-card-salon',
    'law-viewport-card',
    inViewport ? 'animate-fadeIn is-in-viewport' : 'law-viewport-pending',
    isExpanded ? 'is-expanded' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const style = {
    '--law-reveal-delay': `${staggerDelayMs}ms`,
  } as React.CSSProperties;

  const Tag = as;

  return (
    <Tag
      ref={cardRef as React.RefObject<any>}
      id={id}
      data-in-viewport={inViewport ? 'true' : 'false'}
      data-spotlight-cycle={replayToggle ? '1' : '0'}
      className={combinedClassName}
      style={style}
    >
      {children}
    </Tag>
  );
};

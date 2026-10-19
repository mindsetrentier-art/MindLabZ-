import React, { useState, useId } from 'react';
import { ChevronRight, ChevronLeft, Sparkles, Layers, Users } from 'lucide-react';

export interface OverlappingItem {
  id: string | number;
  name: string;
  subname?: string;
  avatar?: string;
  icon?: React.ReactNode;
  color?: string; // background accent color or gradient
  badge?: string; // small tag or mastery badge
  description?: string;
  onClick?: (item: OverlappingItem) => void;
}

export type OverlappingStackSize = 'sm' | 'md' | 'lg' | 'xl';
export type OverlappingStackVariant = 'avatar' | 'card' | 'badge';
export type OverlappingStackLayout = 'row' | 'wrap';

export interface OverlappingStackProps {
  /** Array of items to stack */
  items: OverlappingItem[];
  /** Maximum number of items visible before remaining badge (default: 4) */
  maxVisible?: number;
  /** Overlap ratio between elements: default is 1/3 (0.33333) as required */
  overlapRatio?: number;
  /** Size variant: 'sm' | 'md' | 'lg' | 'xl' */
  size?: OverlappingStackSize;
  /** Visual variant */
  variant?: OverlappingStackVariant;
  /** Layout when spread: 'row' (scrollable or inline) or 'wrap' */
  layout?: OverlappingStackLayout;
  /** Controlled expansion state */
  expanded?: boolean;
  /** Default expansion state if uncontrolled */
  defaultExpanded?: boolean;
  /** Callback when expanded state toggles */
  onToggle?: (isExpanded: boolean) => void;
  /** Stagger animation delay in milliseconds (default: 45ms) */
  staggerMs?: number;
  /** Whether to show a toggle indicator/button */
  showToggleHint?: boolean;
  /** Custom label for toggle hint */
  toggleHintLabel?: {
    collapsed?: string;
    expanded?: string;
  };
  /** Additional CSS classes */
  className?: string;
  /** Title or label for the stack group */
  title?: string;
  /** Subtitle for the stack group */
  subtitle?: string;
}

const SIZE_CONFIGS: Record<
  OverlappingStackSize,
  {
    boxSizePx: number;
    boxClass: string;
    textClass: string;
    subtextClass: string;
    badgeClass: string;
    avatarSizeClass: string;
    ringClass: string;
  }
> = {
  sm: {
    boxSizePx: 38,
    boxClass: 'w-[38px] h-[38px]',
    textClass: 'text-[11px]',
    subtextClass: 'text-[9px]',
    badgeClass: 'text-[9px] px-1 py-0.2',
    avatarSizeClass: 'w-[38px] h-[38px] text-xs',
    ringClass: 'ring-2 ring-white',
  },
  md: {
    boxSizePx: 50,
    boxClass: 'w-[50px] h-[50px]',
    textClass: 'text-xs',
    subtextClass: 'text-[10px]',
    badgeClass: 'text-[10px] px-1.5 py-0.5',
    avatarSizeClass: 'w-[50px] h-[50px] text-sm',
    ringClass: 'ring-2.5 ring-white',
  },
  lg: {
    boxSizePx: 64,
    boxClass: 'w-[64px] h-[64px]',
    textClass: 'text-sm font-semibold',
    subtextClass: 'text-xs',
    badgeClass: 'text-xs px-2 py-0.5',
    avatarSizeClass: 'w-[64px] h-[64px] text-base',
    ringClass: 'ring-3 ring-white',
  },
  xl: {
    boxSizePx: 80,
    boxClass: 'w-[80px] h-[80px]',
    textClass: 'text-base font-bold',
    subtextClass: 'text-xs',
    badgeClass: 'text-xs px-2.5 py-1',
    avatarSizeClass: 'w-[80px] h-[80px] text-xl',
    ringClass: 'ring-4 ring-white',
  },
};

export * from './OverlappingCardStack';

export const OverlappingStack: React.FC<OverlappingStackProps> = ({
  items,
  maxVisible = 3, // Shows first 3 items when collapsed + remainder count
  overlapRatio = 1 / 3, // Exactly one-third overlap as requested!
  size = 'md',
  variant = 'avatar',
  layout = 'row',
  expanded: controlledExpanded,
  defaultExpanded = false,
  onToggle,
  staggerMs = 45,
  showToggleHint = true,
  toggleHintLabel,
  className = '',
  title,
  subtitle,
}) => {
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const componentId = useId();

  const isControlled = controlledExpanded !== undefined;
  const isExpanded = isControlled ? controlledExpanded : internalExpanded;

  const handleToggle = () => {
    const next = !isExpanded;
    if (!isControlled) {
      setInternalExpanded(next);
    }
    onToggle?.(next);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
  };

  const config = SIZE_CONFIGS[size];
  const totalCount = items.length;

  // When collapsed, only show up to maxVisible items, plus the remainder counter at the end.
  // When expanded, reveal ALL items fanned out with their names.
  const visibleItems = isExpanded ? items : items.slice(0, maxVisible);
  const remainingCount = totalCount - maxVisible;
  const hasRemainder = !isExpanded && remainingCount > 0;

  // Overlap calculation:
  // Each element covers 1/3 of the element before it.
  // Hence negative margin = -1 * size * overlapRatio
  const overlapMarginPx = Math.round(config.boxSizePx * overlapRatio);

  return (
    <div className={`select-none ${className}`}>
      {/* Optional Header with Title & Interactive State Hint */}
      {(title || showToggleHint) && (
        <div className="flex items-center justify-between gap-3 mb-2.5">
          {title && (
            <div className="flex items-center gap-2">
              <span className="font-serif-editorial text-sm sm:text-base font-bold text-stone-900 tracking-tight">
                {title}
              </span>
              {subtitle && (
                <span className="text-xs text-stone-500 font-sans hidden sm:inline">
                  · {subtitle}
                </span>
              )}
            </div>
          )}

          {showToggleHint && (
            <button
              type="button"
              onClick={handleToggle}
              className="inline-flex items-center gap-1.5 text-[11px] font-medium text-stone-600 hover:text-stone-900 transition-colors py-1 px-2.5 rounded-lg bg-stone-100 hover:bg-stone-200/80 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400"
              aria-label={isExpanded ? '收起重叠元素' : '散开重叠元素并显示名称'}
            >
              <Layers className="w-3 h-3 text-stone-500" />
              <span>
                {isExpanded
                  ? toggleHintLabel?.expanded || '点击收回 (1/3重叠)'
                  : toggleHintLabel?.collapsed || `点击散开并显示名称 (${totalCount})`}
              </span>
              <span
                className={`inline-block transition-transform duration-300 ${
                  isExpanded ? 'rotate-90' : 'rotate-0'
                }`}
              >
                <ChevronRight className="w-3 h-3" />
              </span>
            </button>
          )}
        </div>
      )}

      {/* Main Interactive Container: Click to spread / Click again to collapse */}
      <div
        role="button"
        tabIndex={0}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        aria-expanded={isExpanded}
        aria-controls={`${componentId}-stack`}
        className={`group relative outline-none focus-visible:ring-2 focus-visible:ring-stone-800 rounded-2xl transition-all duration-300 p-2 -m-2 cursor-pointer ${
          isExpanded ? 'bg-stone-50/70' : 'hover:bg-stone-50/40'
        }`}
        title={isExpanded ? '再次点击收回叠放' : '点击依次散开并显示名称'}
      >
        <div
          id={`${componentId}-stack`}
          className={`flex items-start transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isExpanded
              ? layout === 'wrap'
                ? 'flex-wrap gap-4 sm:gap-5'
                : 'overflow-x-auto pb-2 scrollbar-none gap-3.5 sm:gap-4'
              : 'flex-row items-center overflow-visible'
          }`}
        >
          {visibleItems.map((item, index) => {
            // Sequential staggered delay calculation:
            // When expanding, items fan out one by one with `index * staggerMs`.
            // When collapsing, items retract back gracefully.
            const transitionDelayMs = isExpanded
              ? index * staggerMs
              : (visibleItems.length - 1 - index) * Math.max(15, staggerMs * 0.4);

            const isHovered = hoveredIndex === index;

            return (
              <div
                key={item.id}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={(e) => {
                  // If expanded and item has a specific click handler, trigger it without collapsing immediately
                  if (isExpanded && item.onClick) {
                    e.stopPropagation();
                    item.onClick(item);
                  }
                }}
                style={{
                  // Overlap: when collapsed, index > 0 elements have negative margin corresponding to 1/3 of element size
                  marginLeft: !isExpanded && index > 0 ? `-${overlapMarginPx}px` : '0px',
                  // Layering: higher index elements cover the previous element's 1/3
                  zIndex: isExpanded ? 1 : index + 1,
                  transitionDelay: `${transitionDelayMs}ms`,
                }}
                className={`relative flex flex-col items-center transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  isExpanded ? 'w-24 sm:w-28 text-center' : 'shrink-0'
                }`}
              >
                {/* Visual Avatar / Card Element */}
                <div
                  className={`relative flex items-center justify-center font-bold tracking-tight rounded-full transition-all duration-300 shadow-xs ${
                    config.boxClass
                  } ${config.ringClass} ${
                    item.color
                      ? item.color
                      : 'bg-gradient-to-br from-stone-800 to-stone-950 text-white'
                  } ${
                    isHovered
                      ? 'scale-110 -translate-y-1 shadow-md z-30 ring-stone-900'
                      : ''
                  }`}
                  style={{
                    backgroundColor: item.color?.startsWith('#') ? item.color : undefined,
                  }}
                >
                  {item.avatar ? (
                    <img
                      src={item.avatar}
                      alt={item.name}
                      className="w-full h-full object-cover rounded-full"
                      loading="lazy"
                    />
                  ) : item.icon ? (
                    <div className="flex items-center justify-center text-current">
                      {item.icon}
                    </div>
                  ) : (
                    <span className="font-serif-editorial leading-none">
                      {item.name.slice(0, 2)}
                    </span>
                  )}

                  {/* Badge in top right corner if defined (e.g. status or level) */}
                  {item.badge && !isExpanded && (
                    <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[9px] font-bold px-1 rounded-full shadow-xs">
                      {item.badge}
                    </span>
                  )}
                </div>

                {/* Name & Subtitle: Revealed when spread out ("依次散开并请示名称") */}
                <div
                  style={{
                    transitionDelay: isExpanded ? `${transitionDelayMs + 40}ms` : '0ms',
                  }}
                  className={`flex flex-col items-center transition-all duration-400 ease-out ${
                    isExpanded
                      ? 'opacity-100 mt-2 max-h-24 translate-y-0'
                      : 'opacity-0 max-h-0 -translate-y-2 pointer-events-none overflow-hidden'
                  }`}
                >
                  <span
                    className={`font-semibold text-stone-900 line-clamp-1 ${config.textClass}`}
                    title={item.name}
                  >
                    {item.name}
                  </span>

                  {item.subname && (
                    <span
                      className={`text-stone-500 font-normal line-clamp-1 mt-0.5 ${config.subtextClass}`}
                    >
                      {item.subname}
                    </span>
                  )}

                  {item.badge && (
                    <span className="mt-1 px-1.5 py-0.5 rounded-full bg-stone-100 text-stone-700 text-[9px] font-medium border border-stone-200">
                      {item.badge}
                    </span>
                  )}
                </div>

                {/* Hover Tooltip when Collapsed */}
                {!isExpanded && isHovered && (
                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-stone-900 text-white text-[10px] font-medium rounded shadow-lg whitespace-nowrap z-50 pointer-events-none animate-fadeIn">
                    {item.name}
                    {item.subname ? ` · ${item.subname}` : ''}
                  </div>
                )}
              </div>
            );
          })}

          {/* Tail Remainder Badge ("未尾显示剩余数量") */}
          {hasRemainder && (
            <div
              style={{
                // Continuous 1/3 overlap for the remaining count badge!
                marginLeft: `-${overlapMarginPx}px`,
                zIndex: visibleItems.length + 1,
              }}
              className={`relative flex items-center justify-center rounded-full bg-stone-100 text-stone-800 font-bold font-numeric transition-all duration-300 hover:bg-stone-200 hover:scale-105 shadow-xs cursor-pointer ${
                config.boxClass
              } ${config.ringClass} ${config.textClass}`}
              title={`还有 ${remainingCount} 个未展示，点击散开查看全部`}
            >
              <span>+{remainingCount}</span>
            </div>
          )}

          {/* When expanded, show a subtle "收回" retraction card at the tail */}
          {isExpanded && (
            <div
              style={{
                transitionDelay: `${visibleItems.length * staggerMs}ms`,
              }}
              className="flex flex-col items-center justify-center shrink-0 w-20 text-center py-2 transition-all duration-400 ease-out"
            >
              <div
                className={`flex items-center justify-center rounded-full bg-stone-200/80 text-stone-700 hover:bg-stone-900 hover:text-white transition-colors cursor-pointer shadow-xs ${config.boxClass} ${config.ringClass}`}
                title="点击收回叠放"
              >
                <ChevronLeft className="w-4 h-4" />
              </div>
              <span className="text-[10px] text-stone-500 font-medium mt-2">
                收回叠放
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

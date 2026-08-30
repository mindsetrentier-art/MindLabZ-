import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'card' | 'avatar' | 'rect' | 'circle';
  width?: string | number;
  height?: string | number;
  lines?: number;
  className?: string;
}

/**
 * Universal Reusable Skeleton Component
 * Powered by `.animate-shimmer` with subtle lavender-to-white gradients
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'rect',
  width,
  height,
  lines = 1,
  className = '',
  style,
  ...props
}) => {
  const inlineStyle: React.CSSProperties = {
    ...(width !== undefined ? { width: typeof width === 'number' ? `${width}px` : width } : {}),
    ...(height !== undefined ? { height: typeof height === 'number' ? `${height}px` : height } : {}),
    ...style,
  };

  // 1. Multi-line Text Variant
  if (variant === 'text' && lines > 1) {
    return (
      <div className={`space-y-2 ${className}`} aria-hidden="true" {...props}>
        {Array.from({ length: lines }).map((_, idx) => (
          <div
            key={idx}
            className={`animate-shimmer rounded-md h-4 ${
              idx === lines - 1 ? 'w-4/5' : 'w-full'
            }`}
            style={idx === lines - 1 && width ? inlineStyle : undefined}
          />
        ))}
      </div>
    );
  }

  // 2. Avatar / Circular Variant
  if (variant === 'avatar' || variant === 'circle') {
    return (
      <div
        className={`animate-shimmer rounded-full shrink-0 ${!width && !height ? 'w-10 h-10' : ''} ${className}`}
        style={inlineStyle}
        aria-hidden="true"
        {...props}
      />
    );
  }

  // 3. Card Shell Variant
  if (variant === 'card') {
    return (
      <div
        className={`bg-white rounded-3xl p-5 border border-[#E6E2F5] shadow-[0_4px_20px_-2px_rgba(108,76,241,0.05)] space-y-4 overflow-hidden relative ${className}`}
        style={inlineStyle}
        aria-hidden="true"
        {...props}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="w-16 h-5 rounded-full" />
            <Skeleton className="w-12 h-4 rounded-md" />
          </div>
          <Skeleton variant="avatar" className="w-8 h-8 rounded-2xl" />
        </div>
        <div className="space-y-2">
          <Skeleton className="w-3/4 h-5 rounded-lg" />
          <Skeleton className="w-1/2 h-3.5 rounded-md" />
        </div>
        <div className="p-3.5 bg-[#FAF9FF] rounded-2xl border border-[#E6E2F5] space-y-2">
          <Skeleton className="w-full h-3.5 rounded-md" />
          <Skeleton className="w-4/5 h-3.5 rounded-md" />
        </div>
      </div>
    );
  }

  // 4. Default Text (Single line) & Rectangles
  const defaultClasses =
    variant === 'text'
      ? 'h-4 rounded-md w-full'
      : 'rounded-xl';

  return (
    <div
      className={`animate-shimmer ${defaultClasses} ${className}`}
      style={inlineStyle}
      aria-hidden="true"
      {...props}
    />
  );
};

/**
 * Convenience Helper for Multi-line or Heading Skeletons
 */
export const SkeletonText: React.FC<{
  lines?: number;
  className?: string;
  lineHeightClass?: string;
}> = ({ lines = 3, className = '', lineHeightClass = 'h-3.5' }) => {
  return (
    <div className={`space-y-2 ${className}`} aria-hidden="true">
      {Array.from({ length: lines }).map((_, idx) => (
        <div
          key={idx}
          className={`animate-shimmer rounded-md ${lineHeightClass} ${
            idx === lines - 1 ? 'w-3/4' : 'w-full'
          }`}
        />
      ))}
    </div>
  );
};

/**
 * Convenience Helper for User & AI Avatars
 */
export const SkeletonAvatar: React.FC<{
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  shape?: 'circle' | 'squircle';
}> = ({ size = 'md', className = '', shape = 'circle' }) => {
  const sizeMap = {
    sm: 'w-7 h-7',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const shapeMap = {
    circle: 'rounded-full',
    squircle: 'rounded-2xl',
  };

  return (
    <div
      className={`animate-shimmer shrink-0 ${sizeMap[size]} ${shapeMap[shape]} ${className}`}
      aria-hidden="true"
    />
  );
};

/**
 * Skeleton Loader for Psychology Law Cards
 */
export const LawCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-3xl p-5 border border-[#E6E2F5] shadow-[0_4px_20px_-2px_rgba(108,76,241,0.05)] space-y-3.5 overflow-hidden relative">
      {/* Top badges */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="w-14 h-5 rounded-full" />
          <Skeleton className="w-10 h-4 rounded-md" />
        </div>
        <Skeleton variant="avatar" className="w-8 h-8 rounded-2xl" />
      </div>

      {/* Title & Subtitle */}
      <div className="space-y-1.5">
        <Skeleton className="w-3/5 h-6 rounded-lg" />
        <Skeleton className="w-2/5 h-3.5 rounded-md" />
      </div>

      {/* Quote / Short explanation box */}
      <div className="p-3 rounded-2xl bg-[#FAF9FF] border border-[#E6E2F5] space-y-2">
        <Skeleton className="w-full h-3.5 rounded-md" />
        <Skeleton className="w-4/5 h-3.5 rounded-md" />
      </div>

      {/* Footer info: Mastery and XP */}
      <div className="pt-2 border-t border-[#F5F3FF] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="w-16 h-2 rounded-full" />
          <Skeleton className="w-6 h-3 rounded-md" />
        </div>
        <div className="flex items-center gap-1.5">
          <Skeleton className="w-12 h-4 rounded-full" />
          <Skeleton variant="avatar" className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};

/**
 * Skeleton Loader for Mini Game Cards
 */
export const GameCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-3xl p-5 border border-[#E6E2F5] shadow-[0_4px_20px_-2px_rgba(108,76,241,0.05)] space-y-4 overflow-hidden relative">
      {/* Top badges */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="w-16 h-5 rounded-full" />
          <Skeleton className="w-12 h-4 rounded-md" />
        </div>
        <Skeleton className="w-16 h-4 rounded-full" />
      </div>

      {/* Icon & Title */}
      <div className="flex items-start gap-3.5">
        <Skeleton variant="avatar" shape="squircle" className="w-12 h-12 shrink-0" />
        <div className="flex-1 space-y-2 pt-1">
          <Skeleton className="w-3/4 h-5 rounded-lg" />
          <Skeleton className="w-1/2 h-3.5 rounded-md" />
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Skeleton className="w-full h-3.5 rounded-md" />
        <Skeleton className="w-5/6 h-3.5 rounded-md" />
      </div>

      {/* Button & Footer */}
      <div className="pt-2 border-t border-[#F5F3FF] flex items-center justify-between">
        <Skeleton className="w-20 h-4 rounded-md" />
        <Skeleton className="w-24 h-8 rounded-2xl" />
      </div>
    </div>
  );
};

/**
 * Skeleton Loader for Home Hero Banner & Mastery Ring
 */
export const HomeHeroSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-3xl p-6 border border-[#E6E2F5] shadow-[0_4px_20px_-2px_rgba(108,76,241,0.05)] overflow-hidden">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 space-y-3">
          <Skeleton className="w-28 h-5 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="w-4/5 h-6 rounded-lg" />
            <Skeleton className="w-3/5 h-6 rounded-lg" />
          </div>
          <Skeleton className="w-52 h-4 rounded-md" />
          <Skeleton className="w-36 h-9 rounded-2xl mt-2" />
        </div>
        <div className="shrink-0 flex items-center justify-center">
          <Skeleton variant="avatar" className="w-24 h-24" />
        </div>
      </div>
    </div>
  );
};

/**
 * Skeleton Loader for Law Detail Page
 */
export const LawDetailSkeleton: React.FC = () => {
  return (
    <div className="space-y-5 pb-8 animate-fadeIn">
      {/* Header Card */}
      <div className="bg-white rounded-3xl p-6 border border-[#E6E2F5] shadow-[0_4px_20px_-2px_rgba(108,76,241,0.05)] space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="w-24 h-6 rounded-full" />
          <div className="flex gap-2">
            <Skeleton variant="avatar" className="w-9 h-9" />
            <Skeleton variant="avatar" className="w-9 h-9" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="w-2/3 h-8 rounded-xl" />
          <Skeleton className="w-1/3 h-4 rounded-md" />
        </div>
        <div className="p-4 rounded-2xl bg-[#FAF9FF] border border-[#E6E2F5] space-y-2">
          <Skeleton className="w-full h-4 rounded-md" />
          <Skeleton className="w-4/5 h-4 rounded-md" />
        </div>
        <div className="pt-3 border-t border-[#F5F3FF] flex justify-between items-center">
          <Skeleton className="w-24 h-4 rounded-md" />
          <Skeleton className="w-32 h-3 rounded-full" />
        </div>
      </div>

      {/* Mechanism Card */}
      <div className="bg-white rounded-3xl p-6 border border-[#E6E2F5] space-y-3">
        <Skeleton className="w-36 h-5 rounded-lg" />
        <Skeleton className="w-full h-4 rounded-md" />
        <Skeleton className="w-full h-4 rounded-md" />
        <Skeleton className="w-3/4 h-4 rounded-md" />
      </div>

      {/* Real-life Scenario Card */}
      <div className="bg-white rounded-3xl p-6 border border-[#E6E2F5] space-y-3">
        <Skeleton className="w-32 h-5 rounded-lg" />
        <div className="p-4 rounded-2xl bg-[#FAF9FF] space-y-2">
          <Skeleton className="w-full h-4 rounded-md" />
          <Skeleton className="w-5/6 h-4 rounded-md" />
        </div>
      </div>
    </div>
  );
};

/**
 * Skeleton Loader for Cognitive Radar & Progress Metrics
 */
export const RadarSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-3xl p-6 border border-[#E6E2F5] shadow-[0_4px_20px_-2px_rgba(108,76,241,0.05)] space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton variant="avatar" className="w-4 h-4" />
          <Skeleton className="w-32 h-5 rounded-md" />
        </div>
        <Skeleton className="w-20 h-5 rounded-full" />
      </div>

      <div className="h-64 flex items-center justify-center">
        <div className="relative w-48 h-48 rounded-full border-2 border-dashed border-[#DDD6FE]/60 flex items-center justify-center animate-pulse">
          <div className="w-32 h-32 rounded-full border-2 border-dashed border-[#DDD6FE]/60 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-[#EDE9FE]/70" />
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Skeleton for AI Tutor Chat Response
 */
export const AITutorSkeleton: React.FC = () => {
  return (
    <div className="flex gap-2.5 justify-start items-start animate-fadeIn">
      <div className="w-8 h-8 rounded-xl bg-[#EDE9FE] flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
        <Skeleton variant="avatar" className="w-4 h-4" />
      </div>
      <div className="p-4 rounded-2xl max-w-[85%] bg-white border border-[#E6E2F5] rounded-tl-none shadow-xs space-y-2.5 flex-1">
        <div className="flex items-center gap-2 pb-1 border-b border-[#F5F3FF]">
          <Skeleton className="w-24 h-3.5 rounded-md" />
          <Skeleton className="w-12 h-3 rounded-full" />
        </div>
        <Skeleton className="w-full h-3.5 rounded-md" />
        <Skeleton className="w-11/12 h-3.5 rounded-md" />
        <Skeleton className="w-4/5 h-3.5 rounded-md" />
        <div className="pt-2 flex gap-2">
          <Skeleton className="w-16 h-4 rounded-md" />
          <Skeleton className="w-20 h-4 rounded-md" />
        </div>
      </div>
    </div>
  );
};

/**
 * Skeleton Loader for Quiz & Challenge Question Arena
 */
export const QuizQuestionSkeleton: React.FC = () => {
  return (
    <div className="w-full bg-white rounded-3xl p-6 border border-[#E6E2F5] shadow-[0_4px_20px_-2px_rgba(108,76,241,0.05)] space-y-5">
      <div className="flex items-center justify-between">
        <Skeleton className="w-16 h-5 rounded-full" />
        <Skeleton className="w-14 h-4 rounded-md" />
      </div>

      <div className="space-y-2">
        <Skeleton className="w-full h-5 rounded-lg" />
        <Skeleton className="w-4/5 h-5 rounded-lg" />
      </div>

      <div className="space-y-2.5 pt-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="w-full h-12 rounded-2xl" />
        ))}
      </div>
    </div>
  );
};

import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'card' | 'avatar' | 'rect' | 'circle';
  shape?: 'squircle' | 'circle' | 'rounded' | 'rect' | string;
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
  shape,
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
    <div className="bg-white rounded-3xl border border-stone-200/90 shadow-md space-y-4 overflow-hidden relative animate-stageEnter">
      {/* Top Radiant Shimmer Stripe */}
      <div className="h-2 w-full animate-artisticShimmer" />

      <div className="p-5 sm:p-6 space-y-4">
        {/* Top Badges */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="w-14 h-4 rounded-md" />
            <Skeleton className="w-12 h-3.5 rounded-md" />
          </div>
          <Skeleton className="w-20 h-4 rounded-md" />
        </div>

        {/* Icon & Title */}
        <div className="flex items-start gap-3.5">
          <Skeleton variant="avatar" shape="squircle" className="w-12 h-12 shrink-0 animate-artisticShimmer" />
          <div className="flex-1 space-y-2 pt-1">
            <Skeleton className="w-3/5 h-5 rounded-lg animate-artisticShimmer" />
            <Skeleton className="w-2/5 h-3.5 rounded-md" />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Skeleton className="w-full h-3.5 rounded-md" />
          <Skeleton className="w-4/5 h-3.5 rounded-md" />
        </div>

        {/* Scientific Mechanism Callout Box */}
        <div className="bg-stone-50 rounded-2xl p-3 border border-stone-200/60 space-y-1.5">
          <Skeleton className="w-28 h-3 rounded-md" />
          <Skeleton className="w-full h-3 rounded-md" />
        </div>

        {/* Action Footer Bar */}
        <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
          <Skeleton className="w-24 h-4 rounded-md" />
          <Skeleton className="w-28 h-9 rounded-xl animate-artisticShimmer" />
        </div>
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

/**
 * Artistic High-End Game Arena Stage Skeleton
 * Rendered during game loading, initialization, and seamless transitions
 */
export interface GameArenaStageSkeletonProps {
  gameTitle?: string;
  gameNumber?: string;
  gameCategory?: string;
  accentColor?: string;
}

export const GameArenaStageSkeleton: React.FC<GameArenaStageSkeletonProps> = ({
  gameTitle,
  gameNumber,
  gameCategory,
  accentColor = '#6366F1',
}) => {
  return (
    <div className="flex flex-col items-center justify-start min-h-[85vh] w-full max-w-lg mx-auto py-3 px-2 animate-stageEnter">
      {/* Top HUD Skeleton */}
      <div className="w-full game-hud-bar rounded-2xl p-2.5 sm:p-3 mb-4 flex items-center justify-between gap-2 border border-stone-200/90 shadow-sm bg-white/80 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl animate-artisticShimmer shrink-0" />
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              {gameNumber ? (
                <span
                  className="font-bold px-1.5 py-0.2 rounded text-[10px] text-white"
                  style={{ backgroundColor: accentColor }}
                >
                  #{gameNumber}
                </span>
              ) : (
                <div className="w-8 h-3.5 rounded animate-artisticShimmer" />
              )}
              <div className="w-16 h-3.5 rounded animate-artisticShimmer" />
            </div>
            {gameTitle ? (
              <span className="text-xs sm:text-sm font-bold text-stone-900 font-serif-editorial">
                {gameTitle}
              </span>
            ) : (
              <div className="w-24 h-4 rounded animate-artisticShimmer" />
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 font-numeric">
          <div className="w-8 h-8 rounded-xl animate-artisticShimmer shrink-0" />
          <div className="w-16 h-8 rounded-xl animate-artisticShimmer shrink-0" />
        </div>
      </div>

      {/* Main High-End Stage Pod */}
      <div className="w-full game-arcade-card rounded-3xl p-6 sm:p-8 border-indigo-200/80 shadow-2xl space-y-6 relative overflow-hidden bg-white/90 backdrop-blur-xl">
        {/* Ambient Aurora Orbs */}
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-gradient-to-br from-indigo-500/25 via-purple-500/20 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-gradient-to-tr from-cyan-500/20 via-indigo-500/20 to-transparent blur-3xl pointer-events-none" />

        {/* Center Gyroscopic Neural Node */}
        <div className="relative py-4 flex flex-col items-center justify-center text-center space-y-4">
          <div className="relative w-24 h-24 flex items-center justify-center">
            {/* Outer Gyro Ring */}
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-indigo-400/60 animate-gyroSpin" />
            {/* Inner Counter Ring */}
            <div className="absolute inset-2 rounded-full border-2 border-dotted border-purple-400/70 animate-gyroSpinReverse" />
            {/* Core Neural Glow Orb */}
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xl ring-4 ring-indigo-500/20 animate-pulseGlow"
              style={{
                backgroundColor: accentColor,
                boxShadow: `0 0 25px ${accentColor}66`,
              }}
            >
              <div className="w-5 h-5 rounded-full border-2 border-white/80 border-t-transparent animate-spin" />
            </div>
          </div>

          <div className="space-y-2 max-w-sm">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200/80 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
              <span>{gameCategory ? `${gameCategory}实验矩阵` : '认知竞技场实验室'}</span>
            </div>

            <h3 className="text-lg sm:text-xl font-black text-stone-900 tracking-tight font-serif-editorial">
              {gameTitle || '正在载入认知实验范式'}
            </h3>

            <p className="text-xs text-stone-500 font-numeric leading-relaxed">
              正在同步随机变量序列与神经抑制回路 · 四档难度自适应
            </p>
          </div>
        </div>

        {/* Interactive Option Cards Skeleton Preview */}
        <div className="space-y-3 pt-2">
          <div className="h-14 rounded-2xl animate-artisticShimmer border border-stone-200/70 shadow-xs" />
          <div className="h-14 rounded-2xl animate-artisticShimmer border border-stone-200/70 shadow-xs opacity-80" />
          <div className="h-14 rounded-2xl animate-artisticShimmer border border-stone-200/70 shadow-xs opacity-60" />
        </div>

        {/* Bottom Loading Status Bar */}
        <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400 font-numeric font-medium">
          <span className="flex items-center gap-1.5 text-indigo-600 font-bold">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            神经连接建立中
          </span>
          <span className="tracking-widest font-mono text-stone-500">MINDLABZ · ARENA</span>
        </div>
      </div>
    </div>
  );
};

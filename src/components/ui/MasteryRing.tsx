import React from 'react';

interface MasteryRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  showText?: boolean;
  className?: string;
}

export const MasteryRing: React.FC<MasteryRingProps> = ({
  percentage,
  size = 128,
  strokeWidth = 8,
  showText = true,
  className = ''
}) => {
  const outerRadius = (size - 4) / 2;
  const radius = (size - strokeWidth * 2.4) / 2;
  const innerRadius = radius - strokeWidth * 1.15;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={`relative flex items-center justify-center select-none ${className}`} style={{ width: size, height: size }}>
      {/* Soft ambient radial glow behind the ring */}
      <div className="absolute inset-2 rounded-full bg-gradient-to-tr from-[#6C4CF1]/12 via-[#A855F7]/8 to-transparent blur-md pointer-events-none" />

      <svg
        className="w-full h-full transform -rotate-90 origin-center relative z-10"
        viewBox={`0 0 ${size} ${size}`}
      >
        <defs>
          <linearGradient id="masteryGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="50%" stopColor="#6C4CF1" />
            <stop offset="100%" stopColor="#4320B8" />
          </linearGradient>
        </defs>

        {/* Outer Decorative Orbital Ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={outerRadius}
          fill="transparent"
          stroke="#DDD6FE"
          strokeWidth={1}
          strokeDasharray="2 4"
          className="opacity-80"
        />

        {/* Inner Subtle Structural Ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={innerRadius}
          fill="rgba(250, 249, 255, 0.75)"
          stroke="#EDE9FE"
          strokeWidth={1}
        />

        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="#EDE9FE"
          strokeWidth={strokeWidth}
        />

        {/* Animated Gradient Progress Ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="url(#masteryGradient)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out drop-shadow-[0_2px_8px_rgba(108,76,241,0.35)]"
        />
      </svg>
      {showText && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
          <div className="flex items-baseline">
            <span className="text-2xl font-extrabold tracking-tight text-[#3B1D9E] font-numeric">
              {Math.round(percentage)}
            </span>
            <span className="text-xs font-bold text-[#6C4CF1] ml-0.5">%</span>
          </div>
          <span className="text-[10px] font-semibold text-[#64748B] tracking-wider mt-0.5">
            综合掌握度
          </span>
        </div>
      )}
    </div>
  );
};

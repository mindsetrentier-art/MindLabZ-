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
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg
        className="w-full h-full transform -rotate-90 origin-center"
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="#E4DFFD"
          strokeWidth={strokeWidth}
          className="opacity-70"
        />
        {/* Animated Progress Ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="#6C4CF1"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out drop-shadow-[0_0_8px_rgba(108,76,241,0.4)]"
        />
      </svg>
      {showText && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold tracking-tight text-[#532CD8] font-['Inter']">
            {Math.round(percentage)}%
          </span>
          <span className="text-[11px] font-medium text-[#5E5D6D] tracking-wider uppercase">
            掌握度
          </span>
        </div>
      )}
    </div>
  );
};

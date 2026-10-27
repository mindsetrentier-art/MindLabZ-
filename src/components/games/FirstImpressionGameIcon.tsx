import React from 'react';

interface FirstImpressionGameIconProps {
  className?: string;
  size?: number;
  glow?: boolean;
}

/**
 * 01 · 第一眼判断 · 专属出圈神级黑金图标 (First Impression Icon)
 * 融合「洞察天眼」(穿透第一眼假象) +「极速闪电」(3秒估值心算) +「黄金比例量感罗盘」
 */
export const FirstImpressionGameIcon: React.FC<FirstImpressionGameIconProps> = ({
  className = '',
  size = 72,
  glow = true
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Ambient Pulsing Aura Glow */}
      {glow && (
        <div
          className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-amber-500/30 via-amber-400/20 to-purple-600/30 blur-xl animate-pulse"
          style={{ transform: 'scale(1.2)' }}
        />
      )}

      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 drop-shadow-xl"
      >
        <defs>
          {/* Obsidian Diamond Frame Gradient */}
          <linearGradient id="obsidianBevel" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2A244D" />
            <stop offset="45%" stopColor="#15122B" />
            <stop offset="100%" stopColor="#0B0918" />
          </linearGradient>

          {/* Liquid Gold Border Gradient */}
          <linearGradient id="liquidGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF1B8" />
            <stop offset="30%" stopColor="#F59E0B" />
            <stop offset="70%" stopColor="#D97706" />
            <stop offset="100%" stopColor="#78350F" />
          </linearGradient>

          {/* Electric Amber Lightning Gradient */}
          <linearGradient id="electricBolt" x1="0%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="35%" stopColor="#FDE68A" />
            <stop offset="85%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#B45309" />
          </linearGradient>

          {/* Eye Iris Gradient */}
          <radialGradient id="irisCore" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FDE68A" />
            <stop offset="40%" stopColor="#F59E0B" />
            <stop offset="85%" stopColor="#7C3AED" />
            <stop offset="100%" stopColor="#1E1B4B" />
          </radialGradient>

          {/* Soft Filter Glow */}
          <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer Fine-Jewelry Rounded Octagon Shield */}
        <rect
          x="10"
          y="10"
          width="100"
          height="100"
          rx="26"
          fill="url(#obsidianBevel)"
          stroke="url(#liquidGold)"
          strokeWidth="2.5"
        />

        {/* Inner Fine Geometric Compass Dial */}
        <circle
          cx="60"
          cy="60"
          r="42"
          stroke="#F59E0B"
          strokeWidth="1"
          strokeDasharray="2 4"
          strokeOpacity="0.4"
        />
        <circle
          cx="60"
          cy="60"
          r="36"
          stroke="#A855F7"
          strokeWidth="0.8"
          strokeOpacity="0.3"
        />

        {/* Outer Dial Compass Ticks (12, 3, 6, 9 o'clock) */}
        <line x1="60" y1="18" x2="60" y2="23" stroke="#FDE68A" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="60" y1="97" x2="60" y2="102" stroke="#FDE68A" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="18" y1="60" x2="23" y2="60" stroke="#FDE68A" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="97" y1="60" x2="102" y2="60" stroke="#FDE68A" strokeWidth="1.5" strokeLinecap="round" />

        {/* The Eye of Omniscience (洞察天眼 - 外眼轮廓) */}
        <path
          d="M26 60C34 44 48 37 60 37C72 37 86 44 94 60C86 76 72 83 60 83C48 83 34 76 26 60Z"
          fill="#141126"
          stroke="url(#liquidGold)"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />

        {/* Iris Core (金曜虹膜) */}
        <circle
          cx="60"
          cy="60"
          r="16"
          fill="url(#irisCore)"
          stroke="#FDE68A"
          strokeWidth="1.2"
        />

        {/* Golden Ratio Calibration Rings (心算量感环) */}
        <ellipse
          cx="60"
          cy="60"
          rx="12"
          ry="6"
          transform="rotate(30 60 60)"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="0.8"
          strokeOpacity="0.6"
        />

        {/* Inner Pupil (黑夜深核) */}
        <circle cx="60" cy="60" r="7.5" fill="#0A0718" />

        {/* The Rapid Mental Math Lightning Bolt (贯穿瞳孔的估值破局闪电) */}
        <path
          d="M62 26L48 57H59L54 84L76 50H63L68 26H62Z"
          fill="url(#electricBolt)"
          filter="url(#goldGlow)"
        />

        {/* Highlight Sparkles on the Eye (洞悉真实之光) */}
        <circle cx="56" cy="54" r="2.2" fill="#FFFFFF" />
        <circle cx="64" cy="66" r="1.2" fill="#FDE68A" />

        {/* Subtle Bottom Gold Roman Monogram 'I' (Game 01) */}
        <text
          x="60"
          y="103"
          textAnchor="middle"
          fill="#F59E0B"
          fontSize="9"
          fontFamily="serif"
          fontWeight="900"
          letterSpacing="0.1em"
          opacity="0.85"
        >
          VALUATION · 01
        </text>
      </svg>
    </div>
  );
};

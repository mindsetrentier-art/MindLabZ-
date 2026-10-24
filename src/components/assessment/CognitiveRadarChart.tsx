import React, { useState } from 'react';
import { Sparkles, Trophy, Brain, Zap, Target, Scale, Activity, Award, Info } from 'lucide-react';
import { CognitiveDomainAssessment } from '../../services/assessmentService';
import { gameAudio } from '../../utils/gameAudio';

interface CognitiveRadarChartProps {
  domains: CognitiveDomainAssessment[];
  overallCq: number;
  activeDomainId?: string | null;
  onSelectDomain?: (domainId: string) => void;
  comparisonMode?: 'none' | 'cohort' | 'master';
  onComparisonModeChange?: (mode: 'none' | 'cohort' | 'master') => void;
}

const DOMAIN_ICONS: Record<string, React.FC<{ className?: string }>> = {
  memory: Brain,
  logic: Zap,
  focus: Target,
  decision: Scale,
  speed: Activity,
  insight: Sparkles,
};

export const CognitiveRadarChart: React.FC<CognitiveRadarChartProps> = ({
  domains,
  overallCq,
  activeDomainId,
  onSelectDomain,
  comparisonMode = 'cohort',
  onComparisonModeChange,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // SVG Geometry parameters
  const size = 360;
  const center = size / 2;
  const radius = 125;
  const total = domains.length;

  const getCoordinates = (value: number, index: number, maxRadius: number = radius) => {
    // Start angle at top (-PI/2)
    const angle = (Math.PI * 2 / total) * index - Math.PI / 2;
    const r = (Math.max(10, Math.min(100, value)) / 100) * maxRadius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y, angle };
  };

  // Generate grid concentric polygons (20%, 40%, 60%, 80%, 100%)
  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];

  // User polygon points
  const userPoints = domains
    .map((d, i) => {
      const { x, y } = getCoordinates(d.score, i);
      return `${x},${y}`;
    })
    .join(' ');

  // Cohort comparison points
  const cohortPoints = domains
    .map((d, i) => {
      const { x, y } = getCoordinates(d.cohortAverage, i);
      return `${x},${y}`;
    })
    .join(' ');

  // Master benchmark points
  const masterPoints = domains
    .map((d, i) => {
      const { x, y } = getCoordinates(d.masterBenchmark, i);
      return `${x},${y}`;
    })
    .join(' ');

  const activeDomain = hoveredIndex !== null ? domains[hoveredIndex] : domains.find((d) => d.id === activeDomainId) || null;

  return (
    <div className="flex flex-col items-center select-none w-full">
      {/* Comparison Mode Switcher */}
      <div className="w-full flex flex-wrap items-center justify-between gap-2.5 pb-3 mb-2 border-b border-stone-200/80">
        <div className="flex items-center gap-1.5 text-xs text-stone-600 font-medium">
          <Info className="w-3.5 h-3.5 text-stone-400" />
          <span>对比标尺:</span>
        </div>

        <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-xl border border-stone-200 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              gameAudio.playTap();
              onComparisonModeChange?.('none');
            }}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              comparisonMode === 'none'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            仅看自己
          </button>
          <button
            type="button"
            onClick={() => {
              gameAudio.playTap();
              onComparisonModeChange?.('cohort');
            }}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              comparisonMode === 'cohort'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            <span className="w-2 h-0.5 bg-stone-400 rounded-full" />
            <span>常模均值 (68)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              gameAudio.playTap();
              onComparisonModeChange?.('master');
            }}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              comparisonMode === 'master'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            <span className="w-2 h-0.5 bg-amber-500 rounded-full" />
            <span>宗师标杆 (90+)</span>
          </button>
        </div>
      </div>

      {/* SVG Interactive Canvas */}
      <div className="relative w-full max-w-[380px] sm:max-w-[420px] aspect-square flex items-center justify-center p-2">
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="w-full h-full overflow-visible drop-shadow-sm"
        >
          <defs>
            {/* User Polygon Gradient */}
            <linearGradient id="userRadarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6C4CF1" stopOpacity="0.45" />
              <stop offset="50%" stopColor="#8B5CF6" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#EC4899" stopOpacity="0.45" />
            </linearGradient>

            {/* Glowing filter */}
            <filter id="radarGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* 1. Concentric Web Rings */}
          {gridLevels.map((lvl, lvlIdx) => {
            const ringPoints = domains
              .map((_, i) => {
                const { x, y } = getCoordinates(lvl * 100, i);
                return `${x},${y}`;
              })
              .join(' ');

            return (
              <g key={lvlIdx}>
                <polygon
                  points={ringPoints}
                  fill={lvlIdx % 2 === 0 ? '#FAF8F5' : '#F5F2EC'}
                  stroke="#E7E2D9"
                  strokeWidth="1"
                  strokeDasharray={lvlIdx === gridLevels.length - 1 ? 'none' : '3 3'}
                  className="transition-colors duration-300"
                />
                {/* Level Percentage Label on North axis */}
                {lvlIdx > 0 && (
                  <text
                    x={center + 5}
                    y={center - radius * lvl + 4}
                    fontSize="9"
                    fontFamily="monospace"
                    fill="#A8A29E"
                    className="select-none font-medium"
                  >
                    {Math.round(lvl * 100)}%
                  </text>
                )}
              </g>
            );
          })}

          {/* 2. Radial Axis Spokes */}
          {domains.map((d, i) => {
            const { x, y } = getCoordinates(100, i);
            const isHighlighted = activeDomain?.id === d.id;

            return (
              <line
                key={d.id}
                x1={center}
                y1={center}
                x2={x}
                y2={y}
                stroke={isHighlighted ? d.accentColor : '#D6D3CD'}
                strokeWidth={isHighlighted ? '2' : '1'}
                className="transition-all duration-300"
              />
            );
          })}

          {/* 3. Comparison Benchmark Polygon (Cohort or Master) */}
          {comparisonMode === 'cohort' && (
            <polygon
              points={cohortPoints}
              fill="none"
              stroke="#78716C"
              strokeWidth="1.8"
              strokeDasharray="4 4"
              className="transition-all duration-500 opacity-70"
            />
          )}

          {comparisonMode === 'master' && (
            <polygon
              points={masterPoints}
              fill="#F59E0B"
              fillOpacity="0.08"
              stroke="#D97706"
              strokeWidth="2"
              strokeDasharray="5 3"
              className="transition-all duration-500"
            />
          )}

          {/* 4. Main User Filled Radar Polygon */}
          <polygon
            points={userPoints}
            fill="url(#userRadarGradient)"
            stroke="#6C4CF1"
            strokeWidth="2.5"
            strokeLinejoin="round"
            filter="url(#radarGlow)"
            className="transition-all duration-500 ease-out"
          />

          {/* 5. Central Hub: CQ Score Circle */}
          <circle
            cx={center}
            cy={center}
            r="22"
            fill="#FFFFFF"
            stroke="#1C1917"
            strokeWidth="2"
            className="shadow-sm"
          />
          <text
            x={center}
            y={center - 3}
            textAnchor="middle"
            dominantBaseline="middle"
            fontFamily="monospace"
            fontSize="10"
            fill="#78716C"
            className="font-bold uppercase tracking-wider"
          >
            CQ
          </text>
          <text
            x={center}
            y={center + 8}
            textAnchor="middle"
            dominantBaseline="middle"
            fontFamily="serif"
            fontSize="12"
            fontWeight="bold"
            fill="#1C1917"
          >
            {overallCq}
          </text>

          {/* 6. Radar Vertices & Interactive Hit Targets */}
          {domains.map((d, i) => {
            const { x, y } = getCoordinates(d.score, i);
            const isHovered = hoveredIndex === i;
            const isSelected = activeDomainId === d.id;

            return (
              <g
                key={d.id}
                className="cursor-pointer group"
                onMouseEnter={() => {
                  setHoveredIndex(i);
                }}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => {
                  gameAudio.playTap();
                  onSelectDomain?.(d.id);
                }}
              >
                {/* Outer Touch Target Circle */}
                <circle cx={x} cy={y} r="18" fill="transparent" />

                {/* Animated Pulse Ring on Hover */}
                {(isHovered || isSelected) && (
                  <circle
                    cx={x}
                    cy={y}
                    r="12"
                    fill={d.accentColor}
                    fillOpacity="0.25"
                    className="animate-ping"
                  />
                )}

                {/* Vertex Point Node */}
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered || isSelected ? '7' : '5'}
                  fill="#FFFFFF"
                  stroke={d.accentColor}
                  strokeWidth={isHovered || isSelected ? '3.5' : '2.5'}
                  className="transition-all duration-200"
                />

                {/* Micro Score Callout */}
                <text
                  x={x}
                  y={y - 12}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="bold"
                  fontFamily="monospace"
                  fill="#1C1917"
                  className={`pointer-events-none transition-opacity duration-200 ${
                    isHovered || isSelected ? 'opacity-100 font-extrabold' : 'opacity-70'
                  }`}
                >
                  {d.score}
                </text>
              </g>
            );
          })}

          {/* 7. Outer Axis Labels with Icons */}
          {domains.map((d, i) => {
            // Place labels slightly outside 100% radius
            const { x, y, angle } = getCoordinates(118, i);
            const Icon = DOMAIN_ICONS[d.id] || Sparkles;
            const isSelected = activeDomain?.id === d.id;

            return (
              <g
                key={`label-${d.id}`}
                className="cursor-pointer transition-transform duration-200"
                onClick={() => {
                  gameAudio.playTap();
                  onSelectDomain?.(d.id);
                }}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Pill background */}
                <foreignObject
                  x={x - 48}
                  y={y - 18}
                  width="96"
                  height="36"
                  className="overflow-visible"
                >
                  <div
                    className={`flex items-center justify-center gap-1 px-2 py-1 rounded-xl border text-[11px] font-bold transition-all shadow-2xs whitespace-nowrap ${
                      isSelected
                        ? 'bg-stone-900 text-white border-stone-900 scale-105 shadow-sm'
                        : 'bg-white/95 text-stone-700 border-stone-200/90 hover:border-stone-400 hover:text-stone-900'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{d.nameZh.slice(0, 4)}</span>
                  </div>
                </foreignObject>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Floating Active Domain Card (Immediate Feedback when interacting) */}
      {activeDomain && (
        <div className="w-full mt-3 p-4 rounded-2xl bg-white border border-stone-200/90 shadow-sm animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: activeDomain.accentColor }}
              />
              <h4 className="font-serif-editorial font-bold text-base text-stone-900">
                {activeDomain.nameZh}
              </h4>
              <span className="text-xs font-mono text-stone-400">
                ({activeDomain.nameEn})
              </span>
            </div>

            <div className="flex items-center gap-2 font-numeric text-xs">
              <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] border ${activeDomain.tierBadgeColor}`}>
                {activeDomain.tier}
              </span>
              <span className="font-extrabold text-stone-900 text-sm">
                {activeDomain.score} <span className="text-[10px] text-stone-500 font-normal">/ 100</span>
              </span>
              <span className="text-stone-400">·</span>
              <span className="text-emerald-700 font-bold">
                超越 {activeDomain.percentile}% 同龄人群
              </span>
            </div>
          </div>

          <p className="text-xs text-stone-600 mt-2 leading-relaxed">
            {activeDomain.description}
          </p>

          {/* Contributing games badges */}
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5 pt-2 border-t border-stone-100 text-[11px]">
            <span className="text-stone-400 text-[10px] font-mono mr-1">游戏实操得分:</span>
            {activeDomain.contributingGames.map((g) => (
              <span
                key={g.gameId}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-stone-50 border border-stone-200 text-stone-700 font-numeric font-medium"
              >
                <span>{g.gameNameZh}</span>
                <strong className="text-stone-900 font-bold">
                  {g.score.toLocaleString()} 分
                </strong>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

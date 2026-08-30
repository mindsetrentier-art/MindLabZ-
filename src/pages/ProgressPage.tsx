import React, { useState } from 'react';
import { Trophy, Flame, Brain, Award, Star, CheckCircle2, Lock, Sparkles, TrendingUp, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { RadarSkeleton, Skeleton } from '../components/ui/Skeleton';

export const ProgressPage: React.FC = () => {
  const { user, laws, badges } = useApp();

  // Radar points calculation for 5 dimensions
  const stats = user.stats;
  const dimensions = [
    { key: 'memory', label: '空间记忆', value: stats.memory },
    { key: 'attention', label: '专注过滤', value: stats.attention },
    { key: 'reasoning', label: '逻辑反思', value: stats.reasoning },
    { key: 'knowledge', label: '心理广度', value: stats.knowledge },
    { key: 'decision', label: '决策理性', value: stats.decision },
  ];

  // SVG Radar Polygon generator
  const size = 200;
  const center = size / 2;
  const radius = 70;

  const getCoordinates = (value: number, index: number, total: number) => {
    const angle = (Math.PI * 2 / total) * index - Math.PI / 2;
    const r = (value / 100) * radius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y };
  };

  const points = dimensions
    .map((dim, i) => {
      const { x, y } = getCoordinates(dim.value, i, dimensions.length);
      return `${x},${y}`;
    })
    .join(' ');

  const gridCircles = [0.25, 0.5, 0.75, 1.0];

  return (
    <div className="space-y-6 pb-6 animate-fadeIn">
      {/* 1. Header Overview Card */}
      <div className="bg-gradient-to-r from-[#6C4CF1] to-[#532CD8] text-white rounded-3xl p-5 shadow-[0_8px_25px_rgba(108,76,241,0.25)]">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
              🧠 大脑认知图谱
            </span>
            <h2 className="text-lg font-black mt-1">Level {user.level} · {user.title}</h2>
          </div>
          <div className="text-right">
            <span className="text-xs text-white/80">总经验值</span>
            <p className="text-lg font-black font-['Inter']">{user.xp.toLocaleString()} XP</p>
          </div>
        </div>

        {/* Level XP progress bar */}
        <div>
          <div className="flex justify-between text-[11px] text-white/80 mb-1">
            <span>升级进度</span>
            <span>{user.xp % 400} / 400 XP</span>
          </div>
          <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#FFB72B] rounded-full transition-all duration-500"
              style={{ width: `${((user.xp % 400) / 400) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. Five-dimensional Cognitive Radar */}
      <div className="bg-white rounded-3xl p-6 border border-[#E6E2F5] shadow-[0_4px_20px_-2px_rgba(108,76,241,0.05)] space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#18181B] flex items-center gap-1.5">
            <Brain className="w-4 h-4 text-[#6C4CF1]" />
            五维大脑能力模型
          </h3>
          <span className="text-xs font-bold text-[#6C4CF1] bg-[#EDE9FE] border border-[#DDD6FE] px-2.5 py-0.5 rounded-full">
            综合评级：S 级
          </span>
        </div>

        <div className="flex flex-col items-center">
          <svg width={size} height={size} className="overflow-visible">
            {/* Background Grid Rings */}
            {gridCircles.map((scale, idx) => (
              <polygon
                key={idx}
                points={dimensions
                  .map((_, i) => {
                    const { x, y } = getCoordinates(100 * scale, i, dimensions.length);
                    return `${x},${y}`;
                  })
                  .join(' ')}
                fill="none"
                stroke="#E6E2F5"
                strokeWidth="1"
                strokeDasharray={idx === gridCircles.length - 1 ? 'none' : '3 3'}
              />
            ))}

            {/* Radar Lines to Vertexes */}
            {dimensions.map((_, i) => {
              const { x, y } = getCoordinates(100, i, dimensions.length);
              return (
                <line
                  key={i}
                  x1={center}
                  y1={center}
                  x2={x}
                  y2={y}
                  stroke="#E6E2F5"
                  strokeWidth="1"
                />
              );
            })}

            {/* User Stat Filled Polygon */}
            <polygon
              points={points}
              fill="rgba(108, 76, 241, 0.2)"
              stroke="#6C4CF1"
              strokeWidth="2.5"
              className="drop-shadow-[0_0_8px_rgba(108,76,241,0.25)] transition-all duration-700"
            />

            {/* Value dots & Labels */}
            {dimensions.map((dim, i) => {
              const { x, y } = getCoordinates(dim.value, i, dimensions.length);
              const labelPos = getCoordinates(125, i, dimensions.length);
              return (
                <g key={i}>
                  <circle cx={x} cy={y} r="4" fill="#6C4CF1" stroke="#fff" strokeWidth="1.5" />
                  <text
                    x={labelPos.x}
                    y={labelPos.y}
                    fontSize="10"
                    fontWeight="bold"
                    fill="#64748B"
                    textAnchor="middle"
                    dominantBaseline="central"
                  >
                    {dim.label} {dim.value}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* 3. 7-Day Activity Chart */}
      <div className="bg-white rounded-3xl p-6 border border-[#E6E2F5] shadow-[0_4px_20px_-2px_rgba(108,76,241,0.05)] space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#18181B] flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-[#F59E0B]" />
            本周学习与训练趋势
          </h3>
          <span className="text-xs font-semibold text-[#64748B]">连续打卡 7 天</span>
        </div>

        <div className="grid grid-cols-7 gap-2 pt-4 items-end h-32">
          {user.weeklyActivity.map((day, idx) => {
            const heightPercent = Math.min(100, Math.round((day.xp / 500) * 100));
            return (
              <div key={idx} className="flex flex-col items-center gap-1.5 h-full justify-end">
                <span className="text-[9px] font-bold text-[#6C4CF1] font-['Inter']">{day.xp}</span>
                <div className="w-full max-w-[28px] bg-[#EDE9FE] rounded-t-xl overflow-hidden h-20 flex items-end">
                  <div
                    className="w-full bg-gradient-to-t from-[#532CD8] to-[#6C4CF1] rounded-t-xl transition-all duration-500"
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>
                <span className="text-[10px] font-medium text-[#64748B]">{day.day}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Badges & Achievements Grid */}
      <div className="bg-white rounded-3xl p-6 border border-[#E6E2F5] shadow-[0_4px_20px_-2px_rgba(108,76,241,0.05)] space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#18181B] flex items-center gap-1.5">
            <Award className="w-4 h-4 text-[#F59E0B]" />
            成就勋章殿堂
          </h3>
          <span className="text-xs font-bold text-[#6C4CF1]">
            已解锁 {user.unlockedBadges.length} / {badges.length}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          {badges.map((badge) => {
            const isUnlocked = user.unlockedBadges.includes(badge.id);

            return (
              <div
                key={badge.id}
                className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${
                  isUnlocked
                    ? 'bg-[#FAF9FF] border-[#DDD6FE] shadow-xs'
                    : 'bg-[#F8F9FA] border-[#E6E2F5] opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-lg">
                      {badge.icon === 'flame' && '🔥'}
                      {badge.icon === 'target' && '🎯'}
                      {badge.icon === 'zap' && '⚡'}
                      {badge.icon === 'flask-conical' && '🧪'}
                      {badge.icon === 'crown' && '👑'}
                      {badge.icon === 'shield-check' && '🛡️'}
                    </span>
                    {isUnlocked ? (
                      <span className="text-[10px] font-bold text-[#059669] bg-[#ECFDF5] border border-[#A7F3D0] px-2 py-0.5 rounded-full">
                        已达成
                      </span>
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-[#94A3B8]" />
                    )}
                  </div>

                  <h4 className="text-xs font-bold text-[#18181B] mb-0.5">{badge.name}</h4>
                  <p className="text-[10px] text-[#64748B] leading-tight">{badge.description}</p>
                </div>

                <div className="mt-2 pt-2 border-t border-[#F5F3FF] flex justify-between items-center text-[10px]">
                  <span className="text-[#6C4CF1] font-bold font-['Inter']">+{badge.xpBonus} XP</span>
                  {isUnlocked && <span className="text-[#94A3B8] font-medium">{badge.unlockedAt || '已获得'}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

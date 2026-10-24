import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Trophy,
  Flame,
  Brain,
  Award,
  Star,
  CheckCircle2,
  Lock,
  Sparkles,
  TrendingUp,
  RefreshCw,
  FileDown,
  FileText,
  Printer,
  ArrowRight,
  Compass,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { RadarSkeleton, Skeleton } from '../components/ui/Skeleton';
import { DailyAiInsightWidget } from '../components/analytics/DailyAiInsightWidget';
import { ProgressPdfExportModal } from '../components/analytics/ProgressPdfExportModal';
import { gameAudio } from '../utils/gameAudio';

export const ProgressPage: React.FC = () => {
  const { user, laws, badges, journals, openComposerWithPreload } = useApp();
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  // Radar points calculation for 5 dimensions
  const stats = user?.stats || { memory: 80, attention: 80, reasoning: 80, knowledge: 80, decision: 80 };
  const dimensions = [
    { key: 'memory', label: '空间记忆', value: stats.memory ?? 80 },
    { key: 'attention', label: '专注过滤', value: stats.attention ?? 80 },
    { key: 'reasoning', label: '逻辑反思', value: stats.reasoning ?? 80 },
    { key: 'knowledge', label: '心理广度', value: stats.knowledge ?? 80 },
    { key: 'decision', label: '决策理性', value: stats.decision ?? 80 },
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
    <div className="space-y-8 sm:space-y-10 pb-12 animate-fadeIn max-w-4xl mx-auto">
      {/* 1. Header Editorial Atlas Masthead */}
      <section className="editorial-card rounded-2xl p-7 sm:p-9 md:p-10 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-4 border-b border-stone-200/80">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-stone-500 font-medium">
              <span className="editorial-kicker text-[10px] text-stone-700 tracking-widest">
                Cognitive Atlas · Issue No. 100
              </span>
              <span className="text-stone-300" aria-hidden="true">/</span>
              <span className="font-serif-editorial italic text-stone-600">Personal Analytics</span>
            </div>
            <h2 className="font-serif-editorial text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
              Level {user.level} · {user.title}
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 font-normal leading-relaxed">
              根据在 100 心理学定律研习、互动思辨实验及微测试中的实操表现，构建的多维神经认知能力图谱。
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
            <div className="text-left md:text-right font-numeric">
              <span className="text-xs text-stone-500 font-medium block">累计脑力经验</span>
              <p className="text-2xl font-bold text-stone-900 font-serif-editorial">{user.xp.toLocaleString()} <span className="text-xs font-normal text-stone-500 font-sans">XP</span></p>
            </div>

            {/* Export PDF Report Button */}
            <button
              onClick={() => {
                gameAudio.playTap();
                setIsPdfModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-95 shrink-0"
              title="生成可打印或保存的心理健康分析与训练进度 PDF 总结报告"
            >
              <FileDown className="w-4 h-4 text-amber-300" />
              <span>导出 PDF 评估报告</span>
            </button>
          </div>
        </div>

        {/* Level XP progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-stone-500 font-numeric">
            <span>下一等级晋升进度</span>
            <span className="font-semibold text-stone-800">{user.xp % 400} / 400 XP</span>
          </div>
          <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
            <div
              className="h-full chameleon-bar rounded-full"
              style={{ width: `${((user.xp % 400) / 400) * 100}%` }}
            />
          </div>
        </div>
      </section>

      {/* 2. Daily AI Deep Emotional Analysis & Mind Insight Summary */}
      <DailyAiInsightWidget
        entries={journals}
        onOpenComposer={openComposerWithPreload}
        onExportPdf={() => setIsPdfModalOpen(true)}
      />

      {/* 3. Five-dimensional Cognitive Radar */}
      <section className="editorial-card rounded-2xl p-7 sm:p-9 space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-stone-200/80">
          <div>
            <span className="editorial-kicker text-[10px] text-stone-500 block mb-0.5">
              01 · Neural Dimensions
            </span>
            <h3 className="font-serif-editorial text-lg sm:text-xl font-bold text-stone-900 flex items-center gap-2">
              <Brain className="w-4 h-4 text-stone-700" />
              五维大脑心智认知雷达
            </h3>
          </div>
          <span className="text-xs font-semibold text-stone-700 font-numeric">
            综合神经评级 · S 级
          </span>
        </div>

        <div className="flex flex-col items-center py-4">
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
                stroke="#E7E5E4"
                strokeWidth="1"
                strokeDasharray={idx === gridCircles.length - 1 ? 'none' : '2 2'}
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
                  stroke="#E7E5E4"
                  strokeWidth="1"
                />
              );
            })}

            {/* User Stat Filled Polygon */}
            <polygon
              points={points}
              fill="rgba(83, 44, 216, 0.12)"
              stroke="#532CD8"
              strokeWidth="2"
              className="transition-all duration-500"
            />

            {/* Value dots & Labels */}
            {dimensions.map((dim, i) => {
              const { x, y } = getCoordinates(dim.value, i, dimensions.length);
              const labelPos = getCoordinates(126, i, dimensions.length);
              return (
                <g key={i}>
                  <circle cx={x} cy={y} r="3.5" fill="#532CD8" stroke="#fff" strokeWidth="1.5" />
                  <text
                    x={labelPos.x}
                    y={labelPos.y}
                    fontSize="11"
                    fontWeight="500"
                    fill="#44403C"
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="font-numeric"
                  >
                    {dim.label} {dim.value}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Deep Dive Cognitive Assessment Banner */}
        <div className="pt-4 border-t border-stone-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-stone-900 to-indigo-950 text-white p-4 sm:p-5 rounded-xl shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded">深度测评</span>
              <span className="text-stone-300 text-xs">· 实时映射 10 款游戏实战战绩</span>
            </div>
            <h4 className="font-serif-editorial text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Compass className="w-4 h-4 text-amber-300" />
              六维认知能力深度雷达 & 心智原型报告
            </h4>
            <p className="text-xs text-stone-300 font-normal leading-relaxed">
              基于空间记忆、逻辑反思、瞬时专注、风险决策等真实得分，精准诊断你的心智原型与今日脑神经处方。
            </p>
          </div>
          <Link
            to="/assessment"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs shadow-md transition-all shrink-0 active:scale-95"
          >
            <span>进入多维评估雷达</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* 3. 7-Day Activity Chart */}
      <section className="editorial-card rounded-2xl p-7 sm:p-9 space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-stone-200/80">
          <div>
            <span className="editorial-kicker text-[10px] text-stone-500 block mb-0.5">
              02 · Rhythm & Routine
            </span>
            <h3 className="font-serif-editorial text-lg sm:text-xl font-bold text-stone-900 flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-600" />
              本周研习打卡与经验曲线
            </h3>
          </div>
          <span className="text-xs font-semibold text-stone-700 font-numeric">连续研习 {user.streak} 天</span>
        </div>

        <div className="grid grid-cols-7 gap-3 pt-4 items-end h-36 max-w-lg mx-auto">
          {(user?.weeklyActivity || []).map((day, idx) => {
            const heightPercent = Math.min(100, Math.round((day.xp / 500) * 100));
            return (
              <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end">
                <span className="text-[10px] font-semibold text-stone-600 font-numeric">{day.xp}</span>
                <div className="w-full max-w-[28px] bg-stone-100 rounded-t-lg overflow-hidden h-24 flex items-end border border-stone-200/60">
                  <div
                    className="w-full chameleon-bar rounded-t-lg transition-all duration-500"
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>
                <span className="text-[11px] font-medium text-stone-600">{day.day}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Badges & Achievements Grid */}
      <section className="editorial-card rounded-2xl p-7 sm:p-9 space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-stone-200/80">
          <div>
            <span className="editorial-kicker text-[10px] text-stone-500 block mb-0.5">
              03 · Honors & Distinctions
            </span>
            <h3 className="font-serif-editorial text-lg sm:text-xl font-bold text-stone-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-stone-700" />
              成就勋章展厅
            </h3>
          </div>
          <span className="text-xs font-semibold text-stone-700 font-numeric">
            已达成 {(user?.unlockedBadges || []).length} / {badges.length}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {badges.map((badge) => {
            const isUnlocked = (user?.unlockedBadges || []).includes(badge.id);

            return (
              <div
                key={badge.id}
                className={`p-4 rounded-xl border transition-colors flex flex-col justify-between ${
                  isUnlocked
                    ? 'bg-[#FAF8F5] border-stone-300/80'
                    : 'bg-white border-stone-200/70 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xl">
                      {badge.icon === 'flame' && '🔥'}
                      {badge.icon === 'target' && '🎯'}
                      {badge.icon === 'zap' && '⚡'}
                      {badge.icon === 'flask-conical' && '🧪'}
                      {badge.icon === 'crown' && '👑'}
                      {badge.icon === 'shield-check' && '🛡️'}
                    </span>
                    {isUnlocked ? (
                      <span className="text-[10px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                        已内化
                      </span>
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-stone-400" />
                    )}
                  </div>

                  <h4 className="text-xs font-bold text-stone-900 mb-1 font-serif-editorial">{badge.name}</h4>
                  <p className="text-xs text-stone-600 leading-relaxed">{badge.description}</p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-stone-200/70 flex justify-between items-center text-xs font-numeric">
                  <span className="text-stone-800 font-semibold">+{badge.xpBonus} XP</span>
                  {isUnlocked && <span className="text-stone-500 font-sans text-[11px]">{badge.unlockedAt || '已获得'}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. PDF Summary Report Export Modal */}
      <ProgressPdfExportModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        user={user}
        badges={badges}
        journals={journals}
      />
    </div>
  );
};

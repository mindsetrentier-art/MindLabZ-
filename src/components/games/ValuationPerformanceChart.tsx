import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Cell,
  Line,
  ComposedChart,
} from 'recharts';
import {
  Activity,
  Zap,
  Target,
  Clock,
  Compass,
  TrendingUp,
  BarChart3,
  Award,
  Sparkles,
  Info,
} from 'lucide-react';

export interface QuestionTrajectoryPoint {
  qIndex: number;
  questionTitle: string;
  reactionMs: number;
  reactionSeconds: number;
  isCorrect: boolean;
  cumulativeAccuracy: number;
  speedScore: number;
  comboAtMoment: number;
}

export interface ValuationSessionRecord {
  id: string;
  timestamp: string;
  dateStr: string;
  level: string;
  score: number;
  accuracy: number;
  avgReactionSec: number;
  avgReactionMs: number;
  maxCombo: number;
}

interface ValuationPerformanceChartProps {
  currentAccuracy: number;
  avgReactionMs: number;
  maxCombo: number;
  level: '初级' | '中级' | '高级';
  totalQuestions: number;
  trajectory: QuestionTrajectoryPoint[];
  historySessions?: ValuationSessionRecord[];
}

export const ValuationPerformanceChart: React.FC<ValuationPerformanceChartProps> = ({
  currentAccuracy,
  avgReactionMs,
  maxCombo,
  level,
  totalQuestions,
  trajectory,
  historySessions = [],
}) => {
  const [activeTab, setActiveTab] = useState<'radar' | 'bar' | 'history'>('bar');

  const avgReactionSec = Number((avgReactionMs / 1000).toFixed(2));

  // 1. Calculate Multi-Dimensional Cognitive Ratings (0 - 100)
  const cognitiveMetrics = useMemo(() => {
    // A. 准确度 (Accuracy Score)
    const accuracyScore = Math.min(100, Math.max(0, currentAccuracy));

    // B. 反应敏捷度 (Reaction Velocity Score: < 1.2s -> 98, < 2.0s -> 90, < 3.0s -> 80, < 5.0s -> 65, > 8.0s -> 45)
    let speedScore = 70;
    if (avgReactionSec <= 1.2) {
      speedScore = 98;
    } else if (avgReactionSec <= 2.0) {
      speedScore = Math.round(98 - ((avgReactionSec - 1.2) / 0.8) * 8);
    } else if (avgReactionSec <= 3.5) {
      speedScore = Math.round(90 - ((avgReactionSec - 2.0) / 1.5) * 12);
    } else if (avgReactionSec <= 6.0) {
      speedScore = Math.round(78 - ((avgReactionSec - 3.5) / 2.5) * 18);
    } else {
      speedScore = Math.max(30, Math.round(60 - ((avgReactionSec - 6.0) / 4.0) * 20));
    }

    // C. 连击抗压韧性 (Combo Resilience: comboMax vs totalQuestions)
    const comboRatio = maxCombo / Math.max(1, totalQuestions);
    const comboScore = Math.min(100, Math.round(comboRatio * 90 + (maxCombo >= 5 ? 10 : 0)));

    // D. 破锚洞察深度 (De-anchoring Depth: higher when accuracy is high even under tight time)
    const deanchoringScore = Math.min(
      100,
      Math.round(accuracyScore * 0.65 + speedScore * 0.35)
    );

    // E. 心算量感直觉 (Mental Estimation Handfeel: bonus for high difficulty tiers)
    const tierBonus = level === '高级' ? 15 : level === '中级' ? 8 : 0;
    const heuristicsScore = Math.min(
      100,
      Math.round(accuracyScore * 0.8 + tierBonus)
    );

    return {
      accuracyScore,
      speedScore,
      comboScore,
      deanchoringScore,
      heuristicsScore,
    };
  }, [currentAccuracy, avgReactionSec, maxCombo, totalQuestions, level]);

  // 2. Data for Radar Chart
  const radarData = useMemo(() => {
    return [
      {
        dimension: '准确度 (Accuracy)',
        current: cognitiveMetrics.accuracyScore,
        benchmark: 75,
        fullMark: 100,
      },
      {
        dimension: '反应速度 (Velocity)',
        current: cognitiveMetrics.speedScore,
        benchmark: 70,
        fullMark: 100,
      },
      {
        dimension: '连击抗压 (Stability)',
        current: cognitiveMetrics.comboScore,
        benchmark: 60,
        fullMark: 100,
      },
      {
        dimension: '去锚洞察 (De-anchor)',
        current: cognitiveMetrics.deanchoringScore,
        benchmark: 72,
        fullMark: 100,
      },
      {
        dimension: '心算量感 (Heuristics)',
        current: cognitiveMetrics.heuristicsScore,
        benchmark: 68,
        fullMark: 100,
      },
    ];
  }, [cognitiveMetrics]);

  // 3. Data for Question-by-Question Trajectory Bar & Line Chart
  const barChartData = useMemo(() => {
    if (!trajectory || trajectory.length === 0) {
      // Fallback synthetic steps if empty
      return [
        {
          name: '第1题',
          reactionSeconds: Math.max(0.8, avgReactionSec * 1.2),
          cumulativeAccuracy: currentAccuracy,
          isCorrect: true,
          speedRating: '敏捷',
          questionTitle: '估值初探',
        },
        {
          name: '第2题',
          reactionSeconds: Math.max(0.6, avgReactionSec * 0.9),
          cumulativeAccuracy: currentAccuracy,
          isCorrect: true,
          speedRating: '极速',
          questionTitle: '破除日费锚',
        },
      ];
    }

    return trajectory.map((item) => ({
      name: `Q${item.qIndex}`,
      fullLabel: `第 ${item.qIndex} 题`,
      reactionSeconds: item.reactionSeconds,
      cumulativeAccuracy: item.cumulativeAccuracy,
      isCorrect: item.isCorrect,
      speedScore: item.speedScore,
      speedRating:
        item.reactionSeconds <= 1.5
          ? '雷霆极速'
          : item.reactionSeconds <= 3.0
          ? '敏锐手感'
          : '审慎推导',
      questionTitle: item.questionTitle || `第 ${item.qIndex} 题`,
    }));
  }, [trajectory, avgReactionSec, currentAccuracy]);

  // Max reaction time for Bar Y-axis scaling
  const maxBarTime = useMemo(() => {
    if (!barChartData || barChartData.length === 0) return 5;
    const maxVal = Math.max(...barChartData.map((d) => d.reactionSeconds));
    return Math.max(3, Math.ceil(maxVal * 1.25));
  }, [barChartData]);

  // 4. Data for History Evolution Trajectory Chart
  const historyChartData = useMemo(() => {
    if (!historySessions || historySessions.length === 0) {
      return [
        {
          sessionName: '第 1 战',
          fullDate: '本局实测',
          accuracy: currentAccuracy,
          avgReactionSec,
          score: Math.round(cognitiveMetrics.accuracyScore * 20),
          level,
        },
      ];
    }

    return historySessions.slice(-6).map((item, idx) => ({
      sessionName: `第 ${idx + 1} 战`,
      fullDate: item.dateStr || item.timestamp,
      accuracy: item.accuracy,
      avgReactionSec: item.avgReactionSec || Number((item.avgReactionMs / 1000).toFixed(2)),
      score: item.score,
      level: item.level,
    }));
  }, [historySessions, currentAccuracy, avgReactionSec, cognitiveMetrics, level]);

  // Speed rating text and badges
  const speedLabel =
    avgReactionSec <= 1.5
      ? '⚡ 闪击神速'
      : avgReactionSec <= 2.8
      ? '🚀 敏锐高效'
      : avgReactionSec <= 5.0
      ? '🧘 稳健审慎'
      : '🐢 犹豫受制';

  const accuracyLabel =
    currentAccuracy >= 90
      ? '🎯 神准破局'
      : currentAccuracy >= 70
      ? '🛡️ 理性防御'
      : '👁️ 稍受锚定';

  return (
    <div className="w-full bg-gradient-to-b from-stone-900 via-stone-950 to-stone-900 border border-amber-500/35 rounded-2xl p-4 sm:p-5 text-white shadow-xl space-y-4 relative overflow-hidden">
      {/* Background Decorative Gold Accent */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header and Toggle Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3 relative z-10">
        <div className="text-left space-y-0.5">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs">
            <Activity className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="tracking-wide">双维心智能力演变轨迹</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">
              Recharts Analytics
            </span>
          </div>
          <h4 className="text-sm sm:text-base font-extrabold text-white font-serif-editorial">
            准确度 (Accuracy) × 反应速度 (Velocity) 综合研报
          </h4>
        </div>

        {/* Segmented Switcher Tabs */}
        <div className="p-1 rounded-xl bg-white/[0.06] border border-white/10 flex gap-1 self-start sm:self-center shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('bar')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'bar'
                ? 'bg-amber-400 text-stone-950 shadow-md font-extrabold'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>题目轨迹</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('radar')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'radar'
                ? 'bg-amber-400 text-stone-950 shadow-md font-extrabold'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>心智雷达</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'history'
                ? 'bg-amber-400 text-stone-950 shadow-md font-extrabold'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>历战演变</span>
          </button>
        </div>
      </div>

      {/* Core KPI Quick Pill Row */}
      <div className="grid grid-cols-3 gap-2 text-left relative z-10">
        <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 space-y-0.5">
          <div className="flex items-center gap-1 text-[11px] text-stone-400">
            <Target className="w-3 h-3 text-emerald-400" />
            <span>终局准确度</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-base sm:text-lg font-black font-numeric text-emerald-400">
              {currentAccuracy}%
            </span>
            <span className="text-[10px] text-stone-300 font-bold">{accuracyLabel}</span>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 space-y-0.5">
          <div className="flex items-center gap-1 text-[11px] text-stone-400">
            <Clock className="w-3 h-3 text-amber-400" />
            <span>平均耗时</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-base sm:text-lg font-black font-numeric text-amber-400">
              {avgReactionSec}s
            </span>
            <span className="text-[10px] text-stone-300 font-bold">{speedLabel}</span>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 space-y-0.5">
          <div className="flex items-center gap-1 text-[11px] text-stone-400">
            <Zap className="w-3 h-3 text-indigo-400" />
            <span>敏捷综合指数</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-base sm:text-lg font-black font-numeric text-indigo-300">
              {cognitiveMetrics.speedScore}
            </span>
            <span className="text-[10px] text-stone-400">/ 100 分</span>
          </div>
        </div>
      </div>

      {/* CHART CANVAS STAGE */}
      <div className="w-full h-64 sm:h-72 bg-black/40 rounded-xl border border-white/10 p-2 sm:p-3 relative z-10">
        {/* TAB 1: QUESTION TRAJECTORY (BAR + LINE COMPOSED CHART) */}
        {activeTab === 'bar' && (
          <div className="w-full h-full flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] text-stone-300 px-1 mb-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
                <span>柱高: 单题用时 (秒，越短越快)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-1 bg-amber-400 inline-block rounded-full" />
                <span>折线: 累计准确率轨迹 (%)</span>
              </span>
            </div>

            <div className="w-full flex-1 min-h-[190px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={barChartData}
                  margin={{ top: 10, right: 12, left: -18, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#a8a29e', fontSize: 10, fontWeight: 600 }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="time"
                    orientation="left"
                    domain={[0, maxBarTime]}
                    tick={{ fill: '#fbbf24', fontSize: 10 }}
                    axisLine={{ stroke: 'rgba(251,191,36,0.3)' }}
                    tickLine={false}
                    unit="s"
                  />
                  <YAxis
                    yAxisId="acc"
                    orientation="right"
                    domain={[0, 100]}
                    tick={{ fill: '#34d399', fontSize: 10 }}
                    axisLine={{ stroke: 'rgba(52,211,153,0.3)' }}
                    tickLine={false}
                    unit="%"
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const data = payload[0]?.payload;
                      if (!data) return null;
                      return (
                        <div className="bg-stone-900/95 border border-amber-400/60 rounded-xl p-2.5 text-xs text-white shadow-xl space-y-1 backdrop-blur-md">
                          <div className="flex items-center justify-between gap-3 font-bold text-amber-300">
                            <span>{data.fullLabel || data.name}</span>
                            <span
                              className={`px-1.5 py-0.2 rounded text-[10px] ${
                                data.isCorrect
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              }`}
                            >
                              {data.isCorrect ? '✓ 答对' : '✗ 超时/失误'}
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-300 font-sans line-clamp-1">
                            {data.questionTitle}
                          </p>
                          <div className="grid grid-cols-2 gap-2 text-[10px] pt-1 border-t border-white/10 font-mono">
                            <span className="text-amber-200">
                              耗时: <strong>{data.reactionSeconds}s</strong> ({data.speedRating})
                            </span>
                            <span className="text-emerald-300">
                              累计正确率: <strong>{data.cumulativeAccuracy}%</strong>
                            </span>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Bar
                    yAxisId="time"
                    dataKey="reactionSeconds"
                    name="答题用时"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={28}
                  >
                    {barChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.isCorrect
                            ? entry.reactionSeconds <= 2.0
                              ? '#F59E0B' // Fast correct
                              : '#10B981' // Medium correct
                            : '#F43F5E' // Mistake/Timeout
                        }
                      />
                    ))}
                  </Bar>
                  <Line
                    yAxisId="acc"
                    type="monotone"
                    dataKey="cumulativeAccuracy"
                    name="累计准确率"
                    stroke="#34D399"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#34D399', strokeWidth: 1, stroke: '#064e3b' }}
                    activeDot={{ r: 5, fill: '#F59E0B' }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* TAB 2: COGNITIVE RADAR CHART */}
        {activeTab === 'radar' && (
          <div className="w-full h-full flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] text-stone-300 px-1 mb-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                <span>实测五维能力 (金黄色)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-400/50 inline-block" />
                <span>常模参考基准 (虚线紫)</span>
              </span>
            </div>

            <div className="w-full flex-1 min-h-[190px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} outerRadius="72%">
                  <PolarGrid stroke="rgba(255,255,255,0.15)" />
                  <PolarAngleAxis
                    dataKey="dimension"
                    tick={{ fill: '#d6d3d1', fontSize: 10, fontWeight: 600 }}
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 100]}
                    tick={{ fill: '#78716c', fontSize: 8 }}
                    stroke="rgba(255,255,255,0.1)"
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const item = payload[0]?.payload;
                      if (!item) return null;
                      return (
                        <div className="bg-stone-900/95 border border-amber-400/60 rounded-xl p-2.5 text-xs text-white shadow-xl space-y-1 backdrop-blur-md">
                          <span className="font-bold text-amber-300">{item.dimension}</span>
                          <div className="text-[11px] space-y-0.5 font-numeric">
                            <p className="text-amber-200">
                              本局能力值: <strong>{item.current}</strong> / 100
                            </p>
                            <p className="text-indigo-300">
                              行业常模基准: <strong>{item.benchmark}</strong> / 100
                            </p>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Radar
                    name="常模参考"
                    dataKey="benchmark"
                    stroke="#818CF8"
                    fill="#6366F1"
                    fillOpacity={0.25}
                    strokeDasharray="3 3"
                  />
                  <Radar
                    name="实测得分"
                    dataKey="current"
                    stroke="#F59E0B"
                    fill="#F59E0B"
                    fillOpacity={0.5}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* TAB 3: CROSS-SESSION EVOLUTION CHART */}
        {activeTab === 'history' && (
          <div className="w-full h-full flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] text-stone-300 px-1 mb-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-1 bg-emerald-400 inline-block rounded-full" />
                <span>准确度进化轨迹 (%)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-1 bg-amber-400 inline-block rounded-full" />
                <span>平均耗时演化 (秒，越低越神速)</span>
              </span>
            </div>

            <div className="w-full flex-1 min-h-[190px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={historyChartData}
                  margin={{ top: 10, right: 12, left: -18, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
                  <XAxis
                    dataKey="sessionName"
                    tick={{ fill: '#a8a29e', fontSize: 10, fontWeight: 600 }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="acc"
                    orientation="left"
                    domain={[0, 100]}
                    tick={{ fill: '#34d399', fontSize: 10 }}
                    axisLine={{ stroke: 'rgba(52,211,153,0.3)' }}
                    tickLine={false}
                    unit="%"
                  />
                  <YAxis
                    yAxisId="time"
                    orientation="right"
                    domain={[0, maxBarTime]}
                    tick={{ fill: '#fbbf24', fontSize: 10 }}
                    axisLine={{ stroke: 'rgba(251,191,36,0.3)' }}
                    tickLine={false}
                    unit="s"
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const d = payload[0]?.payload;
                      if (!d) return null;
                      return (
                        <div className="bg-stone-900/95 border border-amber-400/60 rounded-xl p-2.5 text-xs text-white shadow-xl space-y-1 backdrop-blur-md">
                          <div className="flex items-center justify-between gap-3 font-bold text-amber-300">
                            <span>{d.sessionName}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">
                              {d.level}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[10px] pt-1 border-t border-white/10 font-mono">
                            <span className="text-emerald-300">
                              准确度: <strong>{d.accuracy}%</strong>
                            </span>
                            <span className="text-amber-200">
                              均时: <strong>{d.avgReactionSec}s</strong>
                            </span>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Bar
                    yAxisId="acc"
                    dataKey="accuracy"
                    name="准确度 (%)"
                    fill="#10B981"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={28}
                  />
                  <Line
                    yAxisId="time"
                    type="monotone"
                    dataKey="avgReactionSec"
                    name="平均用时 (秒)"
                    stroke="#F59E0B"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#F59E0B' }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Insight Explanatory Footer */}
      <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 flex items-start gap-2 text-left">
        <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p className="text-[11px] text-stone-300 leading-relaxed font-sans">
          {activeTab === 'bar' && (
            <span>
              <strong>题目轨迹解读</strong>：绿色柱代表答对耗时，红色柱代表失误/超时。折线反映随着题目推进，系统二思维护盾的建立稳定性。
            </span>
          )}
          {activeTab === 'radar' && (
            <span>
              <strong>五维雷达评估</strong>：结合准确度、反应速度与去锚深度。雷达覆盖面积越广，代表大脑在面对复杂商业诱惑时越具备即时看穿底价的心智从容感。
            </span>
          )}
          {activeTab === 'history' && (
            <span>
              <strong>历战进化分析</strong>：持续记录你历次通关的心算提速曲线。随着练习增多，反应速度与准确度将产生协同跃迁效应。
            </span>
          )}
        </p>
      </div>
    </div>
  );
};

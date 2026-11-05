import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sun,
  CloudSun,
  Cloud,
  CloudRain,
  CloudLightning,
  Sparkles,
  Compass,
  Eye,
  Droplets,
  Wind,
  Thermometer,
  Brain,
  ShieldAlert,
  CheckCircle2,
  Circle,
  RefreshCw,
  BookOpen,
  ArrowRight,
  Share2,
  Copy,
  ChevronDown,
  ChevronUp,
  Sliders,
  Calendar,
  Layers,
  Award,
  Zap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
} from 'recharts';
import {
  CognitiveJournalEntry,
  EmotionalWeatherReport,
  WeatherConditionType,
} from '../../types';
import {
  generateEmotionalWeatherReport,
  getCachedWeatherReport,
} from '../../services/aiJournalAnalysisService';
import { gameAudio } from '../../utils/gameAudio';
import { useApp } from '../../context/AppContext';

interface EmotionalWeatherWidgetProps {
  entries: CognitiveJournalEntry[];
}

export const EmotionalWeatherWidget: React.FC<EmotionalWeatherWidgetProps> = ({
  entries,
}) => {
  const navigate = useNavigate();
  const { triggerConfetti, laws, setActiveContextLaw } = useApp();

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [report, setReport] = useState<EmotionalWeatherReport | null>(() => {
    return getCachedWeatherReport(todayStr);
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [completedPrescriptions, setCompletedPrescriptions] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  // Filter entries for the chosen date
  const dateEntries = useMemo(() => {
    const list = entries.filter((e) => e.date === selectedDate);
    // If no entries on this specific date, fallback to all entries if user requested analysis
    return list.length > 0 ? list : entries.slice(0, 5);
  }, [entries, selectedDate]);

  // Available unique dates in user's journal archive
  const availableDates = useMemo(() => {
    const set = new Set<string>();
    set.add(todayStr);
    entries.forEach((e) => {
      if (e.date) set.add(e.date);
    });
    return Array.from(set).sort().reverse().slice(0, 7);
  }, [entries, todayStr]);

  const handleGenerateReport = async (overrideEntries?: CognitiveJournalEntry[]) => {
    setIsLoading(true);
    try {
      gameAudio.playTap();
    } catch {
      // ignore
    }
    try {
      const targetList = overrideEntries || dateEntries;
      const res = await generateEmotionalWeatherReport(targetList, selectedDate);
      setReport(res);
      triggerConfetti();
    } catch (err) {
      console.error('Failed to generate emotional weather report:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // If no report yet but entries exist, generate on mount or fetch cache
  useEffect(() => {
    const cached = getCachedWeatherReport(selectedDate);
    if (cached) {
      setReport(cached);
    } else if (dateEntries.length > 0 && !report) {
      handleGenerateReport(dateEntries);
    }
  }, [selectedDate]);

  const handleTogglePrescription = (id: string) => {
    try {
      gameAudio.playTap();
    } catch {
      // ignore
    }
    setCompletedPrescriptions((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      if (next.length > prev.length) {
        triggerConfetti();
      }
      return next;
    });
  };

  const handleCopySummary = async () => {
    if (!report) return;
    const text = `【智心堂 · 每日情绪气象图】(${report.date})\n气象状态：${report.conditionTitle}\n心境感悟：${report.conditionPoeticDesc}\n心智气压：${report.metrics.barometerHpa} hPa | 认知能见度：${report.metrics.visibilityKm}%\n认知科学每日反馈：${report.cognitiveFeedback}\n推荐心智定律：【${report.recommendedLaw.nameZh}】\n—— 来自 MindLabZ 认知科学实验室`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      triggerConfetti();
    } catch {
      // fallback
    }
  };

  const getWeatherIcon = (cond: WeatherConditionType) => {
    switch (cond) {
      case 'sunny':
        return <Sun className="w-8 h-8 text-amber-500 animate-spin-slow" />;
      case 'partly-cloudy':
        return <CloudSun className="w-8 h-8 text-amber-500" />;
      case 'overcast':
        return <Cloud className="w-8 h-8 text-stone-500" />;
      case 'foggy':
        return <Cloud className="w-8 h-8 text-indigo-400" />;
      case 'rainy':
        return <CloudRain className="w-8 h-8 text-cyan-500" />;
      case 'stormy':
        return <CloudLightning className="w-8 h-8 text-rose-500" />;
      case 'rainbow':
        return <Sparkles className="w-8 h-8 text-indigo-500" />;
      default:
        return <CloudSun className="w-8 h-8 text-amber-500" />;
    }
  };

  const getWeatherAuraClass = (cond: WeatherConditionType) => {
    switch (cond) {
      case 'sunny':
        return 'from-amber-500/15 via-yellow-500/5 to-transparent border-amber-300/40';
      case 'partly-cloudy':
        return 'from-cyan-500/15 via-amber-500/5 to-transparent border-stone-200';
      case 'rainbow':
        return 'from-indigo-500/15 via-purple-500/10 to-pink-500/5 border-indigo-200';
      case 'rainy':
        return 'from-blue-600/15 via-cyan-500/5 to-transparent border-blue-200';
      case 'stormy':
        return 'from-rose-600/15 via-purple-600/10 to-transparent border-rose-200';
      case 'foggy':
      case 'overcast':
      default:
        return 'from-stone-500/15 via-stone-400/5 to-transparent border-stone-200';
    }
  };

  const handleStudyLaw = (lawId: string) => {
    const found = laws.find(
      (l) =>
        l.id.toLowerCase() === lawId.toLowerCase() ||
        l.codeId?.toLowerCase() === lawId.toLowerCase()
    );
    if (found) {
      setActiveContextLaw(found);
      navigate(`/law/${found.id}`);
    } else {
      navigate('/learn');
    }
  };

  return (
    <section className="editorial-card rounded-2xl p-6 sm:p-8 md:p-9 space-y-6 bg-white border border-stone-200 shadow-sm transition-all relative overflow-hidden">
      {/* Background Decorative Paper Grid */}
      <div className="absolute inset-0 bg-paper-grid opacity-30 pointer-events-none" />

      {/* 1. Header Bar: Masthead, Date Switcher & Controls */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="editorial-kicker text-[10px] text-indigo-700 font-bold block">
              NEURO-METEOROLOGY · 认知科学情绪气象台
            </span>
            <span className="text-stone-300">|</span>
            <span className="text-[10px] font-mono text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              AI 模型解析就绪
            </span>
          </div>

          <h3 className="font-serif-editorial text-lg sm:text-2xl font-bold text-stone-900 flex items-center gap-2 mt-1">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <span>每日情绪气象图 · 认知科学反馈</span>
          </h3>
          <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">
            基于您记录的心情手记与反思文本，AI 自动绘制心理气象全景，提供认知神经机制解构与定制科学处方。
          </p>
        </div>

        {/* Date Selector & Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <div className="flex items-center bg-[#FAF8F5] p-1 rounded-xl border border-stone-200 text-xs">
            <Calendar className="w-3.5 h-3.5 text-stone-500 ml-1 mr-1.5" />
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent font-mono text-stone-800 text-xs font-semibold focus:outline-none cursor-pointer pr-1"
            >
              {availableDates.map((d) => (
                <option key={d} value={d}>
                  {d === todayStr ? `今日 (${d})` : d}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => handleGenerateReport()}
            disabled={isLoading}
            className="px-3.5 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
            title="通过 AI 重新分析生成气象图"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'AI 正在解析...' : '生成/刷新气象图'}</span>
          </button>

          <button
            onClick={() => setIsExpanded((prev) => !prev)}
            className="p-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
            title={isExpanded ? '收起气象卡' : '展开气象卡'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 2. Main Weather Body */}
      {isExpanded && (
        <div className="relative z-10 space-y-6 animate-fadeIn">
          {report ? (
            <>
              {/* 2.1 Hero Weather Banner Card */}
              <div
                className={`p-6 sm:p-8 rounded-3xl bg-gradient-to-br ${getWeatherAuraClass(
                  report.condition
                )} border transition-all space-y-5`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-white shadow-md border border-stone-200/80 flex items-center justify-center shrink-0">
                      {getWeatherIcon(report.condition)}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-stone-500">
                          {report.date} 内心天候
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/80 border border-stone-200 font-semibold text-stone-700 font-numeric">
                          分析基于 {report.analyzedEntriesCount} 篇手记
                        </span>
                      </div>

                      <h4 className="font-serif-editorial text-xl sm:text-2xl font-bold text-stone-900 mt-0.5">
                        {report.conditionTitle}
                      </h4>
                    </div>
                  </div>

                  {/* Share / Copy Summary Pill */}
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                      onClick={handleCopySummary}
                      className="px-3 py-1.5 rounded-xl bg-white/90 hover:bg-white border border-stone-200 text-stone-700 text-xs font-medium transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                    >
                      {copied ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-800 font-bold">已复制气象简报</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-stone-500" />
                          <span>复制每日气象简报</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <p className="font-serif-editorial text-sm sm:text-base text-stone-800 leading-relaxed italic bg-white/60 p-4 rounded-2xl border border-stone-200/50">
                  “{report.conditionPoeticDesc}”
                </p>

                {/* 2.2 5 Psychological Meteorological Gauges */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3 font-numeric text-xs">
                  {/* Gauge 1: Temperature */}
                  <div className="p-3.5 rounded-2xl bg-white/90 border border-stone-200/80 space-y-1">
                    <div className="flex items-center justify-between text-stone-500 text-[10px]">
                      <span>心灵感知温</span>
                      <Thermometer className="w-3.5 h-3.5 text-amber-600" />
                    </div>
                    <div className="font-serif-editorial font-bold text-lg text-stone-900">
                      {report.metrics.temperatureC.toFixed(1)}°C
                    </div>
                    <div className="text-[10px] text-stone-500">
                      {report.metrics.temperatureC > 27
                        ? '情绪处于微热唤醒'
                        : report.metrics.temperatureC < 20
                        ? '冷静沉着或蓄力'
                        : '恒温适宜舒展'}
                    </div>
                  </div>

                  {/* Gauge 2: Barometer */}
                  <div className="p-3.5 rounded-2xl bg-white/90 border border-stone-200/80 space-y-1">
                    <div className="flex items-center justify-between text-stone-500 text-[10px]">
                      <span>心智气压计</span>
                      <Compass className="w-3.5 h-3.5 text-indigo-600" />
                    </div>
                    <div className="font-serif-editorial font-bold text-lg text-stone-900">
                      {report.metrics.barometerHpa} <span className="text-xs font-normal">hPa</span>
                    </div>
                    <div className="text-[10px] text-stone-500">
                      {report.metrics.barometerHpa >= 1015
                        ? '高压稳定无波动'
                        : report.metrics.barometerHpa < 1005
                        ? '低压气旋需深呼吸'
                        : '标准平衡气压'}
                    </div>
                  </div>

                  {/* Gauge 3: Visibility */}
                  <div className="p-3.5 rounded-2xl bg-white/90 border border-stone-200/80 space-y-1">
                    <div className="flex items-center justify-between text-stone-500 text-[10px]">
                      <span>思维清晰能见度</span>
                      <Eye className="w-3.5 h-3.5 text-teal-600" />
                    </div>
                    <div className="font-serif-editorial font-bold text-lg text-stone-900">
                      {report.metrics.visibilityKm}%
                    </div>
                    <div className="text-[10px] text-stone-500">
                      {report.metrics.visibilityKm >= 80 ? '视野洞若观火' : '略有轻微认知迷雾'}
                    </div>
                  </div>

                  {/* Gauge 4: Humidity */}
                  <div className="p-3.5 rounded-2xl bg-white/90 border border-stone-200/80 space-y-1">
                    <div className="flex items-center justify-between text-stone-500 text-[10px]">
                      <span>情感敏感湿度</span>
                      <Droplets className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <div className="font-serif-editorial font-bold text-lg text-stone-900">
                      {report.metrics.humidityPercent}%
                    </div>
                    <div className="text-[10px] text-stone-500">
                      {report.metrics.humidityPercent > 70
                        ? '感性充沛敏锐'
                        : report.metrics.humidityPercent < 40
                        ? '偏理性克制'
                        : '温润平衡滋养'}
                    </div>
                  </div>

                  {/* Gauge 5: Wind Speed */}
                  <div className="p-3.5 rounded-2xl bg-white/90 border border-stone-200/80 space-y-1 col-span-2 sm:col-span-1">
                    <div className="flex items-center justify-between text-stone-500 text-[10px]">
                      <span>内在思绪风速</span>
                      <Wind className="w-3.5 h-3.5 text-cyan-600" />
                    </div>
                    <div className="font-serif-editorial font-bold text-lg text-stone-900">
                      {report.metrics.windSpeedKmh} <span className="text-xs font-normal">km/h</span>
                    </div>
                    <div className="text-[10px] text-stone-500">
                      {report.metrics.windSpeedKmh > 30 ? '心潮涌动活跃' : '清风徐来微澜'}
                    </div>
                  </div>
                </div>
              </div>

              {/* 2.3 Visual Cognitive Radar Chart & Emotional Spectrum */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                {/* 5-Dimensional Radar Chart (7 cols) */}
                <div className="lg:col-span-7 p-5 rounded-2xl bg-[#FAF8F5] border border-stone-200/90 space-y-3 flex flex-col justify-between">
                  <div className="flex items-center justify-between border-b border-stone-200/80 pb-2.5">
                    <div>
                      <span className="text-xs font-bold text-stone-900 block">
                        五维认知心智雷达图 (Cognitive Radar)
                      </span>
                      <span className="text-[10px] text-stone-500">
                        深青色为今日实测得分 · 灰色虚线为健康心智基准线
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-stone-400 bg-white px-2 py-0.5 rounded border border-stone-200">
                      Recharts
                    </span>
                  </div>

                  <div className="h-64 sm:h-72 w-full pt-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart
                        data={report.radarDimensions}
                        margin={{ top: 10, right: 25, bottom: 10, left: 25 }}
                      >
                        <PolarGrid stroke="#E7E5E4" strokeDasharray="3 3" />
                        <PolarAngleAxis
                          dataKey="dimension"
                          tick={{ fill: '#44403C', fontSize: 11, fontWeight: 600 }}
                        />
                        <PolarRadiusAxis
                          angle={30}
                          domain={[0, 100]}
                          stroke="#A8A29E"
                          tick={{ fontSize: 9, fill: '#78716C' }}
                        />
                        <Radar
                          name="今日得分"
                          dataKey="value"
                          stroke="#0D9488"
                          fill="#14B8A6"
                          fillOpacity={0.35}
                          strokeWidth={2}
                        />
                        <Radar
                          name="心智基准"
                          dataKey="benchmark"
                          stroke="#78716C"
                          fill="#D6D3D1"
                          fillOpacity={0.15}
                          strokeDasharray="4 4"
                          strokeWidth={1.5}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#FFFFFF',
                            borderColor: '#E7E5E4',
                            borderRadius: '12px',
                            fontSize: '11px',
                            boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
                          }}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Primary Emotions Distribution & Weather Origin (5 cols) */}
                <div className="lg:col-span-5 p-5 rounded-2xl bg-[#FAF8F5] border border-stone-200/90 space-y-4 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold text-stone-900 block pb-1 border-b border-stone-200/80">
                      情绪图谱光谱占比 (Dominant Spectrum)
                    </span>
                    <p className="text-[11px] text-stone-500 mt-1">
                      文本分析提炼出的当日主要情绪张力成分：
                    </p>
                  </div>

                  <div className="space-y-3 py-1">
                    {report.primaryEmotions.map((emo, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="flex items-center gap-1.5 text-stone-800">
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: emo.color }}
                            />
                            {emo.name}
                          </span>
                          <span className="font-mono text-stone-600 font-bold">
                            {emo.percentage}%
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-stone-200 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${emo.percentage}%`,
                              backgroundColor: emo.color,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Identified Biases Badge Box */}
                  <div className="p-3.5 rounded-xl bg-white border border-stone-200/80 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                      <span>侦测到的思维偏误倾向：</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {report.identifiedBiases.map((bias, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200/80"
                        >
                          ⚠️ {bias}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 2.4 Cognitive Neuroscience Mechanism & Feedback Panels */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Panel 1: Brain Science Mechanism */}
                <div className="p-5 sm:p-6 rounded-2xl bg-white border border-stone-200 space-y-2.5">
                  <div className="flex items-center gap-2 text-stone-900 font-serif-editorial font-bold text-sm sm:text-base border-b border-stone-100 pb-2">
                    <Brain className="w-4 h-4 text-indigo-600" />
                    <span>认知神经科学机制解构 (Neuro-Mechanism)</span>
                  </div>
                  <p className="text-xs text-stone-700 leading-relaxed text-justify">
                    {report.cognitiveMechanism}
                  </p>
                </div>

                {/* Panel 2: Cognitive Science Feedback */}
                <div className="p-5 sm:p-6 rounded-2xl bg-white border border-stone-200 space-y-2.5">
                  <div className="flex items-center gap-2 text-stone-900 font-serif-editorial font-bold text-sm sm:text-base border-b border-stone-100 pb-2">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>基于认知科学的每日反馈建议 (Daily Feedback)</span>
                  </div>
                  <p className="text-xs text-stone-700 leading-relaxed text-justify">
                    {report.cognitiveFeedback}
                  </p>
                </div>
              </div>

              {/* 2.5 Actionable Micro-Prescriptions Checklist */}
              <div className="p-5 sm:p-6 rounded-2xl bg-[#FAF8F5] border border-stone-200/90 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-emerald-600" />
                    <span className="font-serif-editorial font-bold text-stone-900 text-sm sm:text-base">
                      今日认知科学微干预处方 (Actionable Prescriptions)
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-stone-500">
                    已完成 {completedPrescriptions.length} /{' '}
                    {report.actionablePrescriptions.length} 项
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {report.actionablePrescriptions.map((act) => {
                    const isDone = completedPrescriptions.includes(act.id);
                    return (
                      <div
                        key={act.id}
                        onClick={() => handleTogglePrescription(act.id)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                          isDone
                            ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                            : 'bg-white border-stone-200 hover:border-stone-400 hover:shadow-xs'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono text-stone-400">
                              ~{act.estimatedMinutes} 分钟
                            </span>
                            {isDone ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : (
                              <Circle className="w-4 h-4 text-stone-300 hover:text-stone-500 shrink-0" />
                            )}
                          </div>
                          <h5
                            className={`font-serif-editorial font-bold text-xs ${
                              isDone ? 'line-through text-stone-500' : 'text-stone-900'
                            }`}
                          >
                            {act.title}
                          </h5>
                          <p className="text-[11px] text-stone-600 leading-snug">{act.desc}</p>
                        </div>

                        <div className="mt-2 pt-2 border-t border-stone-100 flex items-center justify-between text-[10px] text-stone-400">
                          <span>科学原理:</span>
                          <span className="font-medium text-stone-600 truncate max-w-[140px]">
                            {act.technique}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2.6 Recommended Mind Law Learning Entry */}
              {report.recommendedLaw && (
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-stone-900 to-indigo-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                  <div className="space-y-1">
                    <span className="editorial-kicker text-[10px] text-indigo-300 block">
                      RECOMMENDED MIND LAW · 契合今日气象的心理学定律
                    </span>
                    <h5 className="font-serif-editorial text-base sm:text-lg font-bold text-white flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-amber-400" />
                      <span>{report.recommendedLaw.nameZh}</span>
                    </h5>
                    <p className="text-xs text-stone-300 leading-relaxed max-w-xl">
                      {report.recommendedLaw.reason}
                    </p>
                  </div>

                  <button
                    onClick={() => handleStudyLaw(report.recommendedLaw.id)}
                    className="self-start sm:self-center px-4 py-2.5 rounded-xl bg-white hover:bg-stone-100 text-stone-900 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95"
                  >
                    <span>立刻研习该定律</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="py-12 px-6 rounded-2xl bg-[#FAF8F5] border border-stone-200 text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-white shadow-xs border border-stone-200 flex items-center justify-center text-indigo-600">
                <Sun className="w-7 h-7 animate-pulse" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h4 className="font-serif-editorial text-base font-bold text-stone-900">
                  今日心智气象待生成
                </h4>
                <p className="text-xs text-stone-500 leading-relaxed">
                  点击下方按钮，AI 将全面分析您在【{selectedDate}】记录的手记文本，投射为诗意与科学兼备的情绪气象图与每日反馈。
                </p>
              </div>

              <button
                onClick={() => handleGenerateReport()}
                disabled={isLoading}
                className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-all shadow-xs inline-flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-indigo-300" />
                <span>{isLoading ? '正在进行脑科学解析...' : '生成今日情绪气象图'}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Brain,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  RefreshCw,
  PenLine,
  CheckCircle2,
  Zap,
  Activity,
  Heart,
  Quote,
} from 'lucide-react';
import { CognitiveJournalEntry, DailyJournalAiInsight } from '../../types';
import { analyzeJournalEntry } from '../../services/aiJournalAnalysisService';
import { useApp } from '../../context/AppContext';
import { gameAudio } from '../../utils/gameAudio';

interface DailyAiInsightWidgetProps {
  entries: CognitiveJournalEntry[];
  onOpenComposer?: () => void;
}

export const DailyAiInsightWidget: React.FC<DailyAiInsightWidgetProps> = ({
  entries,
  onOpenComposer,
}) => {
  const navigate = useNavigate();
  const { openComposerWithPreload, saveJournal } = useApp();

  // Find latest entry with analysis or latest entry overall
  const latestEntryWithAnalysis = entries.find((e) => e.aiAnalysis);
  const latestEntry = entries.length > 0 ? entries[0] : null;

  const [activeAnalysis, setActiveAnalysis] = useState<DailyJournalAiInsight | null>(
    latestEntryWithAnalysis?.aiAnalysis || latestEntry?.aiAnalysis || null
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [completedActions, setCompletedActions] = useState<Record<number, boolean>>({});

  const handleTriggerAnalysis = async () => {
    if (!latestEntry) {
      if (onOpenComposer) onOpenComposer();
      else openComposerWithPreload();
      return;
    }

    gameAudio.playTap();
    setIsAnalyzing(true);
    try {
      const insight = await analyzeJournalEntry(latestEntry);
      setActiveAnalysis(insight);

      // Persist into current entry
      const updatedEntry: CognitiveJournalEntry = {
        ...latestEntry,
        aiAnalysis: insight,
      };
      await saveJournal(updatedEntry);
      gameAudio.playSuccess();
    } catch (err) {
      console.error('Failed to run manual analysis:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleAction = (index: number) => {
    gameAudio.playTap();
    setCompletedActions((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // If no journals recorded at all
  if (!latestEntry) {
    return (
      <section className="editorial-card rounded-2xl p-7 sm:p-9 space-y-5 border border-dashed border-stone-300">
        <div className="flex items-center justify-between pb-3 border-b border-stone-200/80">
          <div>
            <span className="editorial-kicker text-[10px] text-amber-700 block mb-0.5">
              AI Insight · 每日心智洞察
            </span>
            <h3 className="font-serif-editorial text-lg sm:text-xl font-bold text-stone-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              每日 AI 心理洞察摘要
            </h3>
          </div>
          <span className="text-xs text-stone-500 font-mono">待解锁</span>
        </div>

        <div className="py-6 text-center space-y-4 max-w-md mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-700 border border-amber-500/20 flex items-center justify-center mx-auto shadow-xs">
            <PenLine className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h4 className="font-serif-editorial font-bold text-stone-900 text-base">
              今日尚未记录心智手记
            </h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              记录一次情绪觉察、CBT思维重构或决策复盘后，AI 导师将即刻为您解构深层心理机制并生成专属每日心智洞察摘要。
            </p>
          </div>

          <button
            onClick={() => {
              gameAudio.playTap();
              if (onOpenComposer) onOpenComposer();
              else openComposerWithPreload();
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer active:scale-95"
          >
            <PenLine className="w-3.5 h-3.5 text-amber-400" />
            <span>开启今日心智手记记录</span>
          </button>
        </div>
      </section>
    );
  }

  // If entry exists but hasn't been analyzed yet
  const analysis = activeAnalysis;

  if (!analysis) {
    return (
      <section className="editorial-card rounded-2xl p-7 sm:p-9 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-stone-200/80">
          <div>
            <span className="editorial-kicker text-[10px] text-stone-500 block mb-0.5">
              AI Insight · 每日心智洞察
            </span>
            <h3 className="font-serif-editorial text-lg sm:text-xl font-bold text-stone-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              每日 AI 心理洞察摘要
            </h3>
          </div>
          <span className="text-xs text-stone-500 font-mono">最新手记: {latestEntry.title}</span>
        </div>

        <div className="py-6 text-center space-y-4 max-w-md mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center mx-auto shadow-xs">
            <Brain className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h4 className="font-serif-editorial font-bold text-stone-900 text-base">
              为手记【{latestEntry.title}】生成 AI 洞察
            </h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              点击下方按钮，由 Gemini 心理学模型对您记录的心智状态进行多维情感解构与机制复盘。
            </p>
          </div>

          <button
            onClick={handleTriggerAnalysis}
            disabled={isAnalyzing}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>AI 正在深度解构情感中...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>生成每日心理洞察摘要</span>
              </>
            )}
          </button>
        </div>
      </section>
    );
  }

  // Full Rich AI Emotional Analysis & Daily Insight Display
  return (
    <section className="editorial-card rounded-2xl p-7 sm:p-9 space-y-6">
      {/* 1. Header with Status & Re-Analyze */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-200/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="editorial-kicker text-[10px] text-stone-500">
              00 · Daily Psychological Insight
            </span>
            <span className="text-stone-300">/</span>
            <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200 font-mono text-[10px] font-semibold">
              Gemini AI 认知模型
            </span>
          </div>

          <h3 className="font-serif-editorial text-lg sm:text-xl font-bold text-stone-900 flex items-center gap-2 mt-1">
            <Sparkles className="w-4 h-4 text-amber-600" />
            每日 AI 心理洞察摘要
          </h3>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-[11px] text-stone-500 font-numeric">
            关联手记：<strong className="text-stone-800">{latestEntry.title}</strong>
          </span>

          <button
            onClick={handleTriggerAnalysis}
            disabled={isAnalyzing}
            className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-600 transition-colors cursor-pointer"
            title="重新触发 AI 深度解构"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin text-purple-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Emotional Valence & 4-Dimension Metric Indicators */}
      <div className="p-4 rounded-xl bg-stone-50/80 border border-stone-200/70 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-stone-500">情绪转化趋势：</span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
              <Activity className="w-3.5 h-3.5 text-emerald-600" />
              <span>{analysis.emotionalValence}</span>
            </span>
          </div>

          <div className="text-[11px] text-stone-500 font-mono">
            主导核心情绪: <strong className="text-stone-800">{analysis.emotionalDimensions.primaryEmotion}</strong>
          </div>
        </div>

        {/* 4 Quantitative Gauges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          {/* Intensity */}
          <div className="p-2.5 rounded-lg bg-white border border-stone-200/80 space-y-1">
            <div className="flex justify-between items-center text-[10px] text-stone-500 font-medium">
              <span>情绪唤醒度</span>
              <span className="font-numeric font-bold text-stone-800">
                {analysis.emotionalDimensions.intensityScore}/10
              </span>
            </div>
            <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all"
                style={{ width: `${analysis.emotionalDimensions.intensityScore * 10}%` }}
              />
            </div>
          </div>

          {/* Stress Level */}
          <div className="p-2.5 rounded-lg bg-white border border-stone-200/80 space-y-1">
            <div className="flex justify-between items-center text-[10px] text-stone-500 font-medium">
              <span>压力负载估测</span>
              <span className="font-numeric font-bold text-stone-800">
                {analysis.emotionalDimensions.stressLevel}/10
              </span>
            </div>
            <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-rose-500 rounded-full transition-all"
                style={{ width: `${analysis.emotionalDimensions.stressLevel * 10}%` }}
              />
            </div>
          </div>

          {/* Metacognitive Depth */}
          <div className="p-2.5 rounded-lg bg-white border border-stone-200/80 space-y-1">
            <div className="flex justify-between items-center text-[10px] text-stone-500 font-medium">
              <span>元认知觉察度</span>
              <span className="font-numeric font-bold text-purple-700">
                {analysis.emotionalDimensions.metacognitiveAwareness}/10
              </span>
            </div>
            <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-600 rounded-full transition-all"
                style={{ width: `${analysis.emotionalDimensions.metacognitiveAwareness * 10}%` }}
              />
            </div>
          </div>

          {/* Resilience Score */}
          <div className="p-2.5 rounded-lg bg-white border border-stone-200/80 space-y-1">
            <div className="flex justify-between items-center text-[10px] text-stone-500 font-medium">
              <span>心理韧性指数</span>
              <span className="font-numeric font-bold text-emerald-700">
                {analysis.emotionalDimensions.resilienceScore}/10
              </span>
            </div>
            <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-600 rounded-full transition-all"
                style={{ width: `${analysis.emotionalDimensions.resilienceScore * 10}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Curatorial Daily Insight Summary */}
      <div className="relative p-5 rounded-2xl bg-gradient-to-br from-amber-50/50 via-white to-purple-50/30 border border-amber-200/70 shadow-xs space-y-2.5">
        <div className="flex items-center gap-2 text-xs font-bold text-amber-900 font-serif-editorial">
          <Quote className="w-4 h-4 text-amber-600 fill-amber-200" />
          <span>今日深度心理洞察摘要</span>
        </div>

        <p className="text-xs sm:text-sm text-stone-700 font-normal leading-relaxed pl-6 border-l-2 border-amber-400">
          {analysis.dailyInsightSummary}
        </p>
      </div>

      {/* 4. Identified Cognitive Patterns & Distortions */}
      {analysis.cognitiveDistortionsIdentified?.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>识别出的思维图式与潜在偏误：</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {analysis.cognitiveDistortionsIdentified.map((distortion, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-stone-100 text-stone-800 border border-stone-200 text-xs font-medium"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span>{distortion}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 5. Underlying Psychological Mechanism */}
      <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80 space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-stone-900">
          <Brain className="w-3.5 h-3.5 text-purple-700" />
          <span>神经机制与认知原理解析：</span>
        </div>
        <p className="text-xs text-stone-600 leading-relaxed font-normal">
          {analysis.psychologicalMechanism}
        </p>
      </div>

      {/* 6. Actionable Micro-Practices Checklist */}
      {analysis.actionableMicroAdvice?.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-stone-900">
            <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
            <span>今日微行动建议（轻触标记已完成）：</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {analysis.actionableMicroAdvice.map((advice, idx) => {
              const isDone = !!completedActions[idx];
              return (
                <div
                  key={idx}
                  onClick={() => toggleAction(idx)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-2.5 select-none ${
                    isDone
                      ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900 line-through opacity-85'
                      : 'bg-white border-stone-200 text-stone-700 hover:border-stone-400 shadow-xs'
                  }`}
                >
                  <div className="pt-0.5 shrink-0">
                    <CheckCircle2
                      className={`w-4 h-4 ${
                        isDone ? 'text-emerald-600 fill-emerald-100' : 'text-stone-300'
                      }`}
                    />
                  </div>
                  <span className="leading-relaxed flex-1">{advice}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 7. Recommended Psychology Law of the Day */}
      {analysis.recommendedLawName && (
        <div className="pt-2 border-t border-stone-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-stone-600">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              今日对照研习建议：<strong className="text-stone-900 font-bold">{analysis.recommendedLawName}</strong>
            </span>
          </div>

          <button
            onClick={() => {
              gameAudio.playTap();
              if (analysis.recommendedLawId) {
                navigate(`/law/${analysis.recommendedLawId}`);
              } else {
                navigate('/learn');
              }
            }}
            className="inline-flex items-center gap-1 text-purple-700 hover:text-purple-900 font-bold hover:underline cursor-pointer"
          >
            <span>研习该定律并开启实验</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </section>
  );
};

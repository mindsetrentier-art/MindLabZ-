import React from 'react';
import { Activity, Flame, Heart, Sparkles, Brain, Compass } from 'lucide-react';
import { CognitiveJournalEntry } from '../../types';

interface JournalAnalyticsWidgetProps {
  entries: CognitiveJournalEntry[];
}

export const JournalAnalyticsWidget: React.FC<JournalAnalyticsWidgetProps> = ({ entries }) => {
  if (!entries || entries.length === 0) return null;

  // Compute metrics
  const totalEntries = entries.length;

  const valenceCounts = {
    positive: entries.filter((e) => e.emotion.valence === 'positive').length,
    neutral: entries.filter((e) => e.emotion.valence === 'neutral').length,
    challenging: entries.filter((e) => e.emotion.valence === 'challenging').length,
    mixed: entries.filter((e) => e.emotion.valence === 'mixed').length,
  };

  const avgIntensity = (
    entries.reduce((acc, cur) => acc + cur.emotion.intensity, 0) / (totalEntries || 1)
  ).toFixed(1);

  // Group by related psychology laws
  const lawCounts: Record<string, number> = {};
  entries.forEach((e) => {
    if (e.relatedLawName) {
      lawCounts[e.relatedLawName] = (lawCounts[e.relatedLawName] || 0) + 1;
    }
  });

  const topLaws = Object.entries(lawCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return (
    <section className="editorial-card rounded-2xl p-6 sm:p-8 space-y-6">
      {/* Folio Kicker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200/80 pb-4">
        <div>
          <span className="editorial-kicker text-[10px]">
            Metacognitive Atlas · 情绪天平与觉察罗盘
          </span>
          <h3 className="font-serif-editorial text-base sm:text-lg font-bold text-stone-900 tracking-tight">
            个人心智觉察全景统计
          </h3>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-stone-500">
          <Activity className="w-3.5 h-3.5 text-stone-600" />
          <span>累计已归档 {totalEntries} 篇心智手记</span>
        </div>
      </div>

      {/* Grid of Key Indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-4 rounded-xl bg-white border border-stone-200/80 space-y-1">
          <span className="text-[11px] text-stone-500 font-medium">手记总篇数</span>
          <div className="flex items-baseline gap-1">
            <span className="font-serif-editorial text-2xl font-bold text-stone-900">
              {totalEntries}
            </span>
            <span className="text-xs text-stone-500 font-serif-editorial">篇</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-4 rounded-xl bg-white border border-stone-200/80 space-y-1">
          <span className="text-[11px] text-stone-500 font-medium">平均情绪强度</span>
          <div className="flex items-baseline gap-1">
            <span className="font-serif-editorial text-2xl font-bold text-stone-900">
              {avgIntensity}
            </span>
            <span className="text-xs text-stone-500 font-serif-editorial">/ 10</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-4 rounded-xl bg-white border border-stone-200/80 space-y-1">
          <span className="text-[11px] text-stone-500 font-medium">正向/平和占比</span>
          <div className="flex items-baseline gap-1">
            <span className="font-serif-editorial text-2xl font-bold text-emerald-800">
              {Math.round(
                ((valenceCounts.positive + valenceCounts.neutral) / totalEntries) * 100
              )}
              %
            </span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-4 rounded-xl bg-white border border-stone-200/80 space-y-1">
          <span className="text-[11px] text-stone-500 font-medium">识别挑战情境</span>
          <div className="flex items-baseline gap-1">
            <span className="font-serif-editorial text-2xl font-bold text-stone-900">
              {valenceCounts.challenging}
            </span>
            <span className="text-xs text-stone-500 font-serif-editorial">次觉察</span>
          </div>
        </div>
      </div>

      {/* Valence Proportional Bar (Editorial Ribbon) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-stone-600">
          <span className="font-medium">情绪极性分布条 (Valence Distribution)</span>
          <span className="text-[11px] font-mono">
            {valenceCounts.positive} 舒展 · {valenceCounts.neutral} 平和 ·{' '}
            {valenceCounts.challenging} 挑战 · {valenceCounts.mixed} 复杂
          </span>
        </div>

        <div className="w-full h-2.5 rounded-full bg-stone-200 overflow-hidden flex">
          {valenceCounts.positive > 0 && (
            <div
              style={{ width: `${(valenceCounts.positive / totalEntries) * 100}%` }}
              className="bg-emerald-600 h-full transition-all"
              title={`正向舒展: ${valenceCounts.positive} 篇`}
            />
          )}
          {valenceCounts.neutral > 0 && (
            <div
              style={{ width: `${(valenceCounts.neutral / totalEntries) * 100}%` }}
              className="bg-teal-500 h-full transition-all"
              title={`平和中正: ${valenceCounts.neutral} 篇`}
            />
          )}
          {valenceCounts.challenging > 0 && (
            <div
              style={{ width: `${(valenceCounts.challenging / totalEntries) * 100}%` }}
              className="bg-rose-500 h-full transition-all"
              title={`挑战紧绷: ${valenceCounts.challenging} 篇`}
            />
          )}
          {valenceCounts.mixed > 0 && (
            <div
              style={{ width: `${(valenceCounts.mixed / totalEntries) * 100}%` }}
              className="bg-violet-500 h-full transition-all"
              title={`交织复杂: ${valenceCounts.mixed} 篇`}
            />
          )}
        </div>
      </div>

      {/* Top Laws Associated */}
      {topLaws.length > 0 && (
        <div className="pt-3 border-t border-stone-200/80 flex flex-wrap items-center gap-2">
          <span className="text-xs text-stone-500 font-medium">最常关联的心理法则:</span>
          {topLaws.map(([lawName, count]) => (
            <span
              key={lawName}
              className="px-2.5 py-1 rounded-lg bg-white border border-stone-200 text-stone-800 text-xs font-serif-editorial"
            >
              {lawName} <span className="font-mono text-stone-400">×{count}</span>
            </span>
          ))}
        </div>
      )}
    </section>
  );
};

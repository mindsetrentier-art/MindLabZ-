import React from 'react';
import {
  Sparkles,
  Loader2,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  BookOpen,
  Wand2,
  CheckCircle2,
  Target,
} from 'lucide-react';
import type {
  QuestionAttemptRecord,
  MicroexpressionDiagnosticResponse,
  RecommendedReviewLaw,
} from '../../services/microexpressionAiService';

interface MicroexpressionDiagnosticPanelProps {
  mlAttempts: QuestionAttemptRecord[];
  diagnosticResult: MicroexpressionDiagnosticResponse | null;
  loading: boolean;
  error: string | null;
  fontScale?: string;
  onRegenerate: () => void;
  onInspectLaw: (lawId: string) => void;
  onPracticeLaw: (lawId: string) => void;
}

const PRIORITY_LABELS: Record<RecommendedReviewLaw['priority'], { text: string; className: string }> = {
  high: {
    text: '重点复习',
    className: 'text-rose-700 bg-rose-50 border border-rose-200',
  },
  medium: {
    text: '巩固强化',
    className: 'text-amber-800 bg-amber-50 border border-amber-200',
  },
  consolidation: {
    text: '进阶拓展',
    className: 'text-stone-700 bg-stone-100 border border-stone-200',
  },
};

export const MicroexpressionDiagnosticPanel: React.FC<MicroexpressionDiagnosticPanelProps> = ({
  mlAttempts,
  diagnosticResult,
  loading,
  error,
  fontScale,
  onRegenerate,
  onInspectLaw,
  onPracticeLaw,
}) => {
  // Deterministic local error distribution while AI analysis loads or for factual review
  const localDistribution = React.useMemo(() => {
    const grouped = new Map<
      string,
      {
        lawId: string;
        codeId: string;
        actionUnitCode: string;
        category: string;
        titleZh: string;
        attemptsCount: number;
        firstTryCorrectCount: number;
        totalWrongAttempts: number;
        usedHintCount: number;
      }
    >();
    for (const item of mlAttempts) {
      const existing = grouped.get(item.lawId) || {
        lawId: item.lawId,
        codeId: item.codeId,
        actionUnitCode: item.actionUnitCode,
        category: item.category,
        titleZh: item.titleZh,
        attemptsCount: 0,
        firstTryCorrectCount: 0,
        totalWrongAttempts: 0,
        usedHintCount: 0,
      };
      existing.attemptsCount += 1;
      if (item.firstTryCorrect) existing.firstTryCorrectCount += 1;
      existing.totalWrongAttempts += item.wrongAttemptsCount;
      if (item.usedCognitiveHint) existing.usedHintCount += 1;
      grouped.set(item.lawId, existing);
    }
    return Array.from(grouped.values()).sort((a, b) => {
      if (b.totalWrongAttempts !== a.totalWrongAttempts) {
        return b.totalWrongAttempts - a.totalWrongAttempts;
      }
      return a.codeId.localeCompare(b.codeId);
    });
  }, [mlAttempts]);

  if (mlAttempts.length === 0) {
    return null;
  }

  const activeDistribution = diagnosticResult?.errorDistribution?.length
    ? diagnosticResult.errorDistribution
    : localDistribution;

  const totalMlWrong = activeDistribution.reduce((acc, item) => acc + item.totalWrongAttempts, 0);
  const totalMlFirstTry = activeDistribution.reduce(
    (acc, item) => acc + item.firstTryCorrectCount,
    0
  );
  const totalMlAttempts = activeDistribution.reduce((acc, item) => acc + item.attemptsCount, 0);

  return (
    <section
      className="w-full editorial-card rounded-2xl p-6 sm:p-8 space-y-6 quiz-font-scope"
      data-quiz-font-scale={fontScale}
      aria-labelledby="diagnostic-summary-heading"
    >
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-stone-200/80">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-stone-500">
            <Sparkles className="w-4 h-4 text-amber-700 shrink-0" aria-hidden="true" />
            <span>AI Diagnostic Summary · ML001–ML010 诊断总结</span>
            <span aria-hidden="true">·</span>
            <span className="font-numeric tabular-nums">
              覆盖 {activeDistribution.length} 条定律 / 首答命中 {totalMlFirstTry}/{totalMlAttempts} 题
            </span>
          </div>
          <h3
            id="diagnostic-summary-heading"
            className="font-serif-editorial text-xl sm:text-2xl font-bold text-stone-900 tracking-tight text-balance"
          >
            诊断总结 · AI 表现剖析与重点复习推荐
          </h3>
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={onRegenerate}
          className="min-h-[40px] px-4 py-2 rounded-xl bg-white border border-stone-300 hover:border-stone-500 text-stone-800 text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-60 disabled:cursor-wait"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
              <span>AI 分析错题分布中…</span>
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{diagnosticResult ? '重新生成诊断总结' : '生成 AI 诊断总结'}</span>
            </>
          )}
        </button>
      </div>

      {/* Deterministic Mistake Distribution Grid across tested ML001-ML010 laws */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm">
          <span className="font-semibold text-stone-800">
            ML001–ML010 实测错题分布追踪
          </span>
          <span className="text-stone-500 font-numeric tabular-nums">
            累计误选干扰项 {totalMlWrong} 次
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {activeDistribution.map((item) => {
            const hasErrors = item.totalWrongAttempts > 0;
            return (
              <button
                key={item.lawId}
                type="button"
                onClick={() => onInspectLaw(item.lawId)}
                className={`text-left p-3 rounded-xl border transition-colors cursor-pointer space-y-1.5 ${
                  hasErrors
                    ? 'bg-rose-50/50 border-rose-200 hover:border-rose-400'
                    : 'bg-[#FAF8F5] border-stone-200/80 hover:border-stone-400'
                }`}
              >
                <div className="flex items-center justify-between gap-1 text-xs font-numeric tabular-nums">
                  <span className="font-bold text-stone-900">{item.codeId}</span>
                  <span
                    className={
                      hasErrors ? 'font-semibold text-rose-700' : 'font-semibold text-emerald-700'
                    }
                  >
                    {hasErrors ? `误选 ${item.totalWrongAttempts} 次` : '首答命中'}
                  </span>
                </div>
                <div className="text-xs font-medium text-stone-800 truncate" title={item.titleZh}>
                  {item.titleZh}
                </div>
                <div className="text-[11px] text-stone-500 font-numeric tabular-nums truncate">
                  {item.actionUnitCode} · {item.category}
                  {item.usedHintCount > 0 ? ` · 用提示` : ''}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading State */}
      {loading && !diagnosticResult && (
        <div className="p-6 rounded-xl bg-[#FAF8F5] border border-stone-200/80 flex items-center gap-3 text-sm text-stone-700">
          <Loader2 className="w-5 h-5 animate-spin text-amber-700 shrink-0" aria-hidden="true" />
          <div className="space-y-0.5">
            <div className="font-semibold text-stone-900">
              正在调用 AI 深度分析你的 ML001–ML010 表现与错题分布…
            </div>
            <div className="text-xs text-stone-500">
              将结合误选干扰项规律，为你匹配需要重点复习的心理学定律与训练策略。
            </div>
          </div>
        </div>
      )}

      {/* Error State (explicit, never masked with fake outputs) */}
      {error && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs sm:text-sm">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={onRegenerate}
            className="self-end sm:self-auto px-3.5 py-1.5 rounded-lg bg-white border border-rose-300 hover:border-rose-500 text-rose-900 font-semibold text-xs cursor-pointer shrink-0"
          >
            重试 AI 分析
          </button>
        </div>
      )}

      {/* AI Diagnostic Narrative & Recommended Review Laws */}
      {diagnosticResult?.summary && (
        <div className="space-y-6">
          <div className="p-5 sm:p-6 rounded-xl bg-[#FAF8F5] border border-stone-200/90 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500">
              <span className="font-semibold text-stone-900">
                综合评估等级：{diagnosticResult.summary.overallLevelLabel}
              </span>
              <span className="font-numeric tabular-nums">
                AI 深度剖析 · {diagnosticResult.summary.recommendedLaws.length} 项重点复习推荐
              </span>
            </div>
            <h4 className="font-serif-editorial text-lg sm:text-xl font-bold text-stone-900 leading-snug">
              {diagnosticResult.summary.performanceHeadline}
            </h4>
            <p className="text-sm sm:text-base text-stone-700 leading-relaxed">
              {diagnosticResult.summary.diagnosticAnalysis}
            </p>
          </div>

          {/* Strengths & Error Pattern Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 sm:p-5 rounded-xl bg-white border border-stone-200/80 space-y-2.5">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-emerald-800">
                <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>已掌握的观察与推理优势</span>
              </div>
              <ul className="space-y-2 text-xs sm:text-sm text-stone-700 leading-relaxed">
                {diagnosticResult.summary.categoryStrengths.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-stone-400 font-numeric tabular-nums shrink-0">
                      0{idx + 1}.
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 sm:p-5 rounded-xl bg-white border border-stone-200/80 space-y-2.5">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-amber-900">
                <Target className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>错题分布揭示的认知盲区</span>
              </div>
              <ul className="space-y-2 text-xs sm:text-sm text-stone-700 leading-relaxed">
                {diagnosticResult.summary.errorPatternInsights.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-stone-400 font-numeric tabular-nums shrink-0">
                      0{idx + 1}.
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* AI-Recommended Laws for Targeted Review */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm font-semibold text-stone-800 pb-2 border-b border-stone-200/80">
              <span>根据错题分布自动推荐的重点复习心理学定律</span>
              <span className="text-stone-500 font-normal">
                支持直接查阅定律解析或启动 AI 专项重练
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {diagnosticResult.summary.recommendedLaws.map((rec) => {
                const badge = PRIORITY_LABELS[rec.priority] || PRIORITY_LABELS.medium;
                const isMlLaw = rec.lawId.startsWith('ml-');
                return (
                  <div
                    key={rec.lawId}
                    className="p-4 sm:p-5 rounded-xl bg-white border border-stone-200 flex flex-col justify-between gap-3.5"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-numeric tabular-nums text-stone-500">
                          {rec.codeId} · {rec.lawId}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[11px] font-semibold whitespace-nowrap shrink-0 ${badge.className}`}
                        >
                          {badge.text}
                        </span>
                      </div>

                      <h5 className="font-serif-editorial text-base sm:text-lg font-bold text-stone-900">
                        {rec.titleZh}
                      </h5>

                      <p className="text-xs sm:text-sm text-stone-700 leading-relaxed">
                        {rec.reason}
                      </p>

                      <div className="p-2.5 rounded-lg bg-[#FAF8F5] border border-stone-200/70 text-xs text-stone-700 leading-relaxed">
                        <span className="font-semibold text-stone-900">建议复习动作：</span>
                        {rec.reviewAction}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-100">
                      <button
                        type="button"
                        onClick={() => onInspectLaw(rec.lawId)}
                        className="flex-1 min-h-[38px] px-3 py-2 rounded-lg bg-white border border-stone-300 hover:border-stone-500 text-stone-800 text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                      >
                        <BookOpen className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        <span>查阅定律详情</span>
                      </button>
                      {isMlLaw && (
                        <button
                          type="button"
                          onClick={() => onPracticeLaw(rec.lawId)}
                          className="flex-1 min-h-[38px] px-3 py-2 rounded-lg chameleon-btn text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                        >
                          <Wand2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                          <span>AI 专项重练此律</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Next Step Advice */}
          {diagnosticResult.summary.nextStepAdvice && (
            <div className="px-4 py-3.5 rounded-xl bg-[#FAF8F5] border border-stone-200/80 flex items-start gap-2.5 text-xs sm:text-sm text-stone-700 leading-relaxed">
              <ArrowRight className="w-4 h-4 text-stone-800 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <span className="font-semibold text-stone-900">下阶段训练建议：</span>
                {diagnosticResult.summary.nextStepAdvice}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

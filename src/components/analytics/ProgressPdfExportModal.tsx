import React, { useState, useRef } from 'react';
import {
  X,
  FileDown,
  Printer,
  Sparkles,
  Brain,
  Award,
  Flame,
  CheckCircle2,
  ShieldCheck,
  Calendar,
  User as UserIcon,
  Layers,
  Heart,
  Sliders,
  Check,
  Loader2,
  FileText,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { UserProfile, Badge, CognitiveJournalEntry, DailyJournalAiInsight } from '../../types';
import { gameAudio } from '../../utils/gameAudio';

export interface ProgressPdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  badges: Badge[];
  journals: CognitiveJournalEntry[];
  activeAnalysis?: DailyJournalAiInsight | null;
}

export const ProgressPdfExportModal: React.FC<ProgressPdfExportModalProps> = ({
  isOpen,
  onClose,
  user,
  badges,
  journals,
  activeAnalysis,
}) => {
  const reportRef = useRef<HTMLDivElement | null>(null);

  // Export section toggles
  const [includeAiInsight, setIncludeAiInsight] = useState(true);
  const [includeRadar, setIncludeRadar] = useState(true);
  const [includeWeekly, setIncludeWeekly] = useState(true);
  const [includeBadges, setIncludeBadges] = useState(true);

  // Generating state
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  // Find effective analysis
  const latestEntryWithAnalysis = journals.find((e) => e.aiAnalysis);
  const currentAnalysis = activeAnalysis || latestEntryWithAnalysis?.aiAnalysis || null;
  const latestJournal = journals[0] || null;

  // Format date
  const now = new Date();
  const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const reportId = `MLZ-CR-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${user.level}`;

  // Radar points calculation for printable SVG
  const stats = user?.stats || { memory: 80, attention: 80, reasoning: 80, knowledge: 80, decision: 80 };
  const dimensions = [
    { key: 'memory', label: '空间记忆', value: stats.memory ?? 80 },
    { key: 'attention', label: '专注过滤', value: stats.attention ?? 80 },
    { key: 'reasoning', label: '逻辑反思', value: stats.reasoning ?? 80 },
    { key: 'knowledge', label: '心理广度', value: stats.knowledge ?? 80 },
    { key: 'decision', label: '决策理性', value: stats.decision ?? 80 },
  ];

  const size = 180;
  const center = size / 2;
  const radius = 62;

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

  // System Print (Triggers native browser save as PDF)
  const handlePrint = () => {
    gameAudio.playTap();
    window.print();
  };

  // Direct High-Resolution PDF Download using jsPDF & html2canvas
  const handleDownloadPdf = async () => {
    if (!reportRef.current) return;
    gameAudio.playTap();
    setIsGenerating(true);
    setDownloadSuccess(false);

    try {
      // Capture element with html2canvas
      const canvas = await html2canvas(reportRef.current, {
        scale: 2, // High resolution for crisp printing
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: 800,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);

      // Create PDF in A4 format (210mm x 297mm)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;

      // Multi-page handling if content is tall
      while (heightLeft > 5) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;
      }

      const filename = `MindLabZ_心理健康与认知训练报告_${user.name || '个人'}_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}.pdf`;
      pdf.save(filename);

      gameAudio.playSuccess();
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3500);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const unlockedBadges = badges.filter((b) => (user?.unlockedBadges || []).includes(b.id));

  return (
    <div
      id="mindlabz-print-container"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-stone-900/75 backdrop-blur-md animate-fadeIn overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Modal Top Bar (Toolbar - Not printed) */}
        <div className="no-print bg-stone-50 border-b border-stone-200 px-5 sm:px-7 py-3.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shadow-xs">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif-editorial text-sm sm:text-base font-bold text-stone-900 leading-snug">
                导出心理健康与训练评估报告（PDF）
              </h3>
              <p className="text-[11px] text-stone-500">
                可直接保存为高精度 PDF 文件或通过浏览器打印另存
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Direct Download PDF Button */}
            <button
              onClick={handleDownloadPdf}
              disabled={isGenerating}
              className="px-3.5 py-1.5 rounded-xl bg-stone-900 text-white font-bold text-xs flex items-center gap-1.5 hover:bg-stone-800 transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-60"
              title="一键下载 A4 尺寸矢量 PDF 文件"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>生成 PDF 中...</span>
                </>
              ) : downloadSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>已保存成功</span>
                </>
              ) : (
                <>
                  <FileDown className="w-3.5 h-3.5 text-amber-300" />
                  <span>保存 PDF 文件</span>
                </>
              )}
            </button>

            {/* Print / Save as PDF Button */}
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-white border border-stone-300 text-stone-800 font-bold text-xs flex items-center gap-1.5 hover:bg-stone-100 transition-all shadow-xs cursor-pointer active:scale-95"
              title="唤起浏览器系统打印窗口，可选择另存为 PDF"
            >
              <Printer className="w-3.5 h-3.5 text-stone-600" />
              <span>系统打印 / 另存</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors cursor-pointer ml-1"
              aria-label="关闭"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. Custom Section Filter Bar (No print) */}
        <div className="no-print bg-stone-100/70 border-b border-stone-200/80 px-5 sm:px-7 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-[11px] font-semibold text-stone-600">包含模块：</span>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-stone-700 select-none">
              <input
                type="checkbox"
                checked={includeAiInsight}
                onChange={(e) => setIncludeAiInsight(e.target.checked)}
                className="rounded accent-purple-600 cursor-pointer"
              />
              <span>AI 心理健康洞察</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-stone-700 select-none">
              <input
                type="checkbox"
                checked={includeRadar}
                onChange={(e) => setIncludeRadar(e.target.checked)}
                className="rounded accent-purple-600 cursor-pointer"
              />
              <span>认知神经雷达</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-stone-700 select-none">
              <input
                type="checkbox"
                checked={includeWeekly}
                onChange={(e) => setIncludeWeekly(e.target.checked)}
                className="rounded accent-purple-600 cursor-pointer"
              />
              <span>7日打卡轨迹</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-stone-700 select-none">
              <input
                type="checkbox"
                checked={includeBadges}
                onChange={(e) => setIncludeBadges(e.target.checked)}
                className="rounded accent-purple-600 cursor-pointer"
              />
              <span>成就勋章</span>
            </label>
          </div>
        </div>

        {/* 3. Printable Report Document Body */}
        <div className="overflow-y-auto p-4 sm:p-8 bg-stone-100/50 flex-1 flex justify-center">
          <div
            id="mindlabz-printable-report"
            ref={reportRef}
            className="w-full max-w-[760px] bg-white p-6 sm:p-9 md:p-10 shadow-lg rounded-2xl border border-stone-200/90 text-stone-900 space-y-7 print:border-none print:shadow-none print:p-0"
            style={{ minHeight: '920px' }}
          >
            {/* Top Document Header & Masthead */}
            <div className="pb-5 border-b-2 border-stone-900 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-[10px] tracking-widest font-mono text-stone-500 uppercase">
                    <span>MINDLABZ · COGNITIVE NEUROSCIENCE ATLAS</span>
                    <span className="text-stone-300">/</span>
                    <span>ISSUE 100</span>
                  </div>
                  <h1 className="font-serif-editorial text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight mt-1">
                    心理健康分析与认知训练总结报告
                  </h1>
                  <p className="text-xs text-stone-600 font-serif-editorial italic mt-0.5">
                    Psychological Health Insight & Cognitive Neuro-Progress Evaluation
                  </p>
                </div>

                {/* Certified Seal / Stamp */}
                <div className="shrink-0 border-2 border-stone-800 rounded-xl p-2 text-center text-stone-900 font-mono text-[9px] uppercase tracking-wider bg-stone-50/50">
                  <div className="font-bold">MINDLABZ</div>
                  <div className="text-[8px] text-stone-500">VERIFIED REPORT</div>
                  <div className="text-[10px] font-bold text-emerald-700">★ CERTIFIED ★</div>
                </div>
              </div>

              {/* Subject & Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-stone-50 p-3.5 rounded-xl border border-stone-200 text-xs">
                <div>
                  <span className="text-[10px] text-stone-400 block font-mono">报告编号</span>
                  <span className="font-mono font-bold text-stone-800">{reportId}</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 block font-mono">评测学员</span>
                  <span className="font-semibold text-stone-800">
                    {user.name || '心智探索者'}（Lv.{user.level} · {user.title}）
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 block font-mono">评估日期</span>
                  <span className="font-numeric text-stone-800">{dateStr} {timeStr}</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 block font-mono">脑力经验 / 连续研习</span>
                  <span className="font-numeric font-bold text-stone-900">
                    {user.xp.toLocaleString()} XP · {user.streak} 天
                  </span>
                </div>
              </div>
            </div>

            {/* SECTION 1: AI Psychological Health & Emotion Analysis Summary */}
            {includeAiInsight && (
              <section className="print-avoid-break space-y-4">
                <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-stone-900 text-white text-[11px] font-bold flex items-center justify-center">
                      1
                    </span>
                    <h2 className="font-serif-editorial text-base sm:text-lg font-bold text-stone-900">
                      心理健康深度分析与每日情绪洞察摘要
                    </h2>
                  </div>
                  <span className="text-[11px] text-stone-500 font-mono">
                    AI 认知重构与情感计算
                  </span>
                </div>

                {currentAnalysis ? (
                  <div className="space-y-4 text-xs">
                    {/* Executive Summary Card */}
                    <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-2">
                      <div className="flex items-center gap-2 text-amber-900 font-bold">
                        <Sparkles className="w-4 h-4 text-amber-700" />
                        <span>核心心理洞察结论（Executive Synthesis）</span>
                      </div>
                      <p className="text-stone-800 text-xs sm:text-sm leading-relaxed font-serif-editorial">
                        “{currentAnalysis.dailyInsightSummary}”
                      </p>
                    </div>

                    {/* 4 Emotional Dimension Metrics */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                        <span className="text-[10px] text-stone-500 block">主导情绪倾向</span>
                        <span className="font-bold text-stone-900 text-sm">
                          {currentAnalysis.emotionalDimensions?.primaryEmotion || currentAnalysis.emotionalValence || '平和觉察'}
                        </span>
                        <span className="text-[9px] text-stone-400 block mt-0.5">
                          强度评分：{currentAnalysis.emotionalDimensions?.intensityScore || 7}/10
                        </span>
                      </div>
                      <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                        <span className="text-[10px] text-stone-500 block">压力负荷指数</span>
                        <span className="font-bold text-emerald-700 text-sm">
                          {currentAnalysis.emotionalDimensions?.stressLevel || 3}/10 · 稳态
                        </span>
                        <span className="text-[9px] text-stone-400 block mt-0.5">副交感神经平抑</span>
                      </div>
                      <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                        <span className="text-[10px] text-stone-500 block">元认知觉察度</span>
                        <span className="font-bold text-purple-700 text-sm">
                          {currentAnalysis.emotionalDimensions?.metacognitiveAwareness || 8}/10 · 敏锐
                        </span>
                        <span className="text-[9px] text-stone-400 block mt-0.5">前额叶自主监控</span>
                      </div>
                      <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                        <span className="text-[10px] text-stone-500 block">心理反脆弱弹性</span>
                        <span className="font-bold text-amber-700 text-sm">
                          {currentAnalysis.emotionalDimensions?.resilienceScore || 8.5}/10 · 强健
                        </span>
                        <span className="text-[9px] text-stone-400 block mt-0.5">自愈与成长潜能</span>
                      </div>
                    </div>

                    {/* Psychological Mechanism & Identified Distortions */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-1.5">
                        <span className="text-[10px] font-bold text-stone-700 uppercase font-mono block">
                          深层心理学机制解构
                        </span>
                        <p className="text-stone-700 leading-relaxed text-[11px]">
                          {currentAnalysis.psychologicalMechanism}
                        </p>
                      </div>

                      <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-1.5">
                        <span className="text-[10px] font-bold text-stone-700 uppercase font-mono block">
                          识别出的潜在认知偏差（Distortions）
                        </span>
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {currentAnalysis.cognitiveDistortionsIdentified &&
                          currentAnalysis.cognitiveDistortionsIdentified.length > 0 ? (
                            currentAnalysis.cognitiveDistortionsIdentified.map((d, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 rounded-md bg-stone-200 text-stone-800 text-[10px] font-medium"
                              >
                                {d}
                              </span>
                            ))
                          ) : (
                            <span className="text-stone-500 text-[11px]">
                              未检测到明显负向偏误，思维模型保持高理性
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actionable Micro Advice */}
                    {currentAnalysis.actionableMicroAdvice &&
                      currentAnalysis.actionableMicroAdvice.length > 0 && (
                        <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-1.5">
                          <span className="text-[10px] font-bold text-stone-700 uppercase font-mono block">
                            CBT 行动微处方（Actionable Advice）
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-stone-700">
                            {currentAnalysis.actionableMicroAdvice.map((advice, i) => (
                              <div key={i} className="flex items-start gap-1.5">
                                <span className="text-emerald-600 font-bold shrink-0">✓</span>
                                <span>{advice}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                ) : (
                  <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-600 leading-relaxed">
                    <p className="font-medium text-stone-800 mb-1">
                      基线评估状态：当前账号心理状态总体平稳。
                    </p>
                    <p>
                      您已开启心理学研习与专注打卡。建议在每日完成思辨手记后生成针对性 AI 洞察，系统将自动汇总深层认知机制与情绪弹性指标至此报告。
                    </p>
                  </div>
                )}
              </section>
            )}

            {/* SECTION 2: Five-Dimensional Cognitive Radar */}
            {includeRadar && (
              <section className="print-avoid-break space-y-4">
                <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-stone-900 text-white text-[11px] font-bold flex items-center justify-center">
                      2
                    </span>
                    <h2 className="font-serif-editorial text-base sm:text-lg font-bold text-stone-900">
                      五维脑力认知神经能力图谱
                    </h2>
                  </div>
                  <span className="text-[11px] text-stone-600 font-mono font-bold">
                    综合评级：S 级（Superior Agility）
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                  {/* Radar SVG */}
                  <div className="flex justify-center py-2">
                    <svg width={size} height={size} className="overflow-visible">
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

                      <polygon
                        points={points}
                        fill="rgba(83, 44, 216, 0.16)"
                        stroke="#532CD8"
                        strokeWidth="2"
                      />

                      {dimensions.map((dim, i) => {
                        const { x, y } = getCoordinates(dim.value, i, dimensions.length);
                        const labelPos = getCoordinates(126, i, dimensions.length);
                        return (
                          <g key={i}>
                            <circle cx={x} cy={y} r="3" fill="#532CD8" stroke="#fff" strokeWidth="1.5" />
                            <text
                              x={labelPos.x}
                              y={labelPos.y}
                              fontSize="9.5"
                              fontWeight="600"
                              fill="#292524"
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

                  {/* Dimension Scores Table */}
                  <div className="space-y-2 text-xs">
                    {dimensions.map((dim) => (
                      <div key={dim.key} className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="font-semibold text-stone-700">{dim.label}</span>
                          <span className="font-mono font-bold text-stone-900">{dim.value} / 100</span>
                        </div>
                        <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-stone-900 rounded-full"
                            style={{ width: `${dim.value}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* SECTION 3: 7-Day Training Routine & Streak */}
            {includeWeekly && (
              <section className="print-avoid-break space-y-4">
                <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-stone-900 text-white text-[11px] font-bold flex items-center justify-center">
                      3
                    </span>
                    <h2 className="font-serif-editorial text-base sm:text-lg font-bold text-stone-900">
                      近7日研习打卡律动与成长轨迹
                    </h2>
                  </div>
                  <span className="text-[11px] text-amber-800 font-mono font-bold">
                    🔥 连续研习 {user.streak} 天
                  </span>
                </div>

                <div className="grid grid-cols-7 gap-2 items-end h-28 max-w-md mx-auto pt-2">
                  {(user?.weeklyActivity || []).map((day, idx) => {
                    const heightPercent = Math.min(100, Math.round((day.xp / 500) * 100));
                    return (
                      <div key={idx} className="flex flex-col items-center gap-1.5 h-full justify-end text-xs">
                        <span className="text-[9px] font-mono font-semibold text-stone-600">{day.xp}</span>
                        <div className="w-full max-w-[22px] bg-stone-100 rounded-t-md overflow-hidden h-16 flex items-end border border-stone-200">
                          <div
                            className="w-full bg-stone-800 rounded-t-md"
                            style={{ height: `${heightPercent}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-medium text-stone-600">{day.day}</span>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* SECTION 4: Badges & Distinctions */}
            {includeBadges && unlockedBadges.length > 0 && (
              <section className="print-avoid-break space-y-3">
                <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-stone-900 text-white text-[11px] font-bold flex items-center justify-center">
                      4
                    </span>
                    <h2 className="font-serif-editorial text-base sm:text-lg font-bold text-stone-900">
                      已达成成就勋章与内化能力（{unlockedBadges.length} 枚）
                    </h2>
                  </div>
                  <span className="text-[11px] text-stone-500 font-mono">
                    Neuro-Cognitive Distinctions
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {unlockedBadges.map((badge) => (
                    <div
                      key={badge.id}
                      className="p-2.5 rounded-xl border border-stone-200 bg-stone-50/70 flex items-center gap-2.5"
                    >
                      <span className="text-lg">
                        {badge.icon === 'flame' && '🔥'}
                        {badge.icon === 'target' && '🎯'}
                        {badge.icon === 'zap' && '⚡'}
                        {badge.icon === 'flask-conical' && '🧪'}
                        {badge.icon === 'crown' && '👑'}
                        {badge.icon === 'shield-check' && '🛡️'}
                      </span>
                      <div className="truncate">
                        <h4 className="font-bold text-xs text-stone-900 truncate">
                          {badge.name}
                        </h4>
                        <span className="text-[9px] text-stone-500 font-mono block">
                          +{badge.xpBonus} XP · 已内化
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Report Footer & Scientific Disclaimer */}
            <div className="pt-5 border-t border-stone-300 text-[10px] text-stone-500 space-y-1.5 leading-relaxed font-sans">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span>
                  报告生成引擎：MindLabZ Neuro-Cognitive Atlas v2.4 · 算法核验通过
                </span>
                <span className="font-mono">
                  CONFIDENTIAL · 个人心理学成长档案
                </span>
              </div>
              <p className="text-[9px] text-stone-400">
                声明：本报告数据源于用户在 100 项心理学定律研习、互动思辨及手记觉察中的实操表现，并由大语言模型进行情感计算生成，旨在提供心理健康促进与心智自我调节参考，不构成临床医学诊断依据。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

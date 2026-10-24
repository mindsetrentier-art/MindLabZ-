import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Brain,
  Zap,
  Target,
  Scale,
  Activity,
  Sparkles,
  Trophy,
  ArrowRight,
  TrendingUp,
  Award,
  RefreshCw,
  Printer,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Gamepad2,
  BookOpen,
  Info,
  Flame,
  ArrowUpRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { generateCognitiveAssessment, CognitiveDomainAssessment } from '../services/assessmentService';
import { CognitiveRadarChart } from '../components/assessment/CognitiveRadarChart';
import { gameAudio } from '../utils/gameAudio';

export const CognitiveAssessmentPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useApp();

  const [activeDomainId, setActiveDomainId] = useState<string | null>('memory');
  const [comparisonMode, setComparisonMode] = useState<'none' | 'cohort' | 'master'>('cohort');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Generate full cognitive assessment report based on current user game scores
  const report = useMemo(() => {
    return generateCognitiveAssessment(user);
  }, [user, user.gameHighScores, user.stats]);

  const handleRefresh = () => {
    gameAudio.playTap();
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 400);
  };

  const handlePrint = () => {
    gameAudio.playTap();
    window.print();
  };

  const activeDomainData = report.domains.find((d) => d.id === activeDomainId) || report.domains[0];

  return (
    <div className="space-y-8 sm:space-y-10 pb-16 animate-fadeIn max-w-5xl mx-auto">
      {/* 1. Editorial Masthead & Hero Folio Banner */}
      <section className="editorial-card rounded-3xl p-6 sm:p-9 md:p-10 space-y-6 bg-gradient-to-br from-[#FAF8F5] via-[#F6F3ED] to-[#EFEAE1] border border-stone-200/90 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-stone-300/80">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="editorial-kicker text-[10px] text-stone-800 font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-stone-200/80 border border-stone-300">
                Cognitive Performance Evaluation
              </span>
              <span className="text-stone-400">/</span>
              <span className="font-mono text-stone-600 text-[11px]">
                全维神经认知测评报告
              </span>
            </div>

            <h1 className="font-serif-editorial text-2xl sm:text-3xl md:text-4xl font-extrabold text-stone-900 tracking-tight leading-tight">
              认知能力多维评估与心智雷达
            </h1>

            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-sans">
              本报告基于您在 <strong>10 款心理学经典实验小游戏</strong> 与 <strong>日常心智手记反思</strong> 中的真实实操得分、反应速度与决策偏误抑制表现，由神经认知测评模型动态计算生成。
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap md:flex-col items-center md:items-end gap-2.5 shrink-0 print:hidden">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRefresh}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-stone-700 bg-white hover:bg-stone-50 border border-stone-300 rounded-xl transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
                title="重新评估最新游戏分数"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>刷新测评</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
                title="打印或保存为 PDF 评估档案"
              >
                <Printer className="w-3.5 h-3.5 text-amber-300" />
                <span>打印 / 导出档案</span>
              </button>
            </div>

            <div className="text-[11px] text-stone-500 font-mono">
              已纳评实验游戏: <strong className="text-stone-800">{report.totalGamesEvaluated}</strong> 款
            </div>
          </div>
        </div>

        {/* Cognitive Index & Archetype Header Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 font-numeric">
          {/* Card 1: Overall CQ Score */}
          <div className="p-4 rounded-2xl bg-white/90 border border-stone-200/90 shadow-2xs space-y-1">
            <span className="text-[11px] text-stone-500 font-medium block">
              综合认知商数 (CQ)
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-stone-900 font-serif-editorial">
                {report.overallCq}
              </span>
              <span className="text-xs text-stone-500">/ 100 分</span>
            </div>
            <div className="pt-1 flex items-center justify-between text-[11px]">
              <span className="font-semibold text-stone-700">{report.tier}</span>
              <span className="text-emerald-700 font-bold">超越 {report.percentileOverall}% 同龄探索者</span>
            </div>
          </div>

          {/* Card 2: Cognitive Archetype */}
          <div className="p-4 rounded-2xl bg-white/90 border border-stone-200/90 shadow-2xs space-y-1">
            <span className="text-[11px] text-stone-500 font-medium block">
              心智认知原型 (Archetype)
            </span>
            <div className="font-serif-editorial font-bold text-base text-stone-900 truncate">
              {report.archetype.title}
            </div>
            <p className="text-[11px] text-stone-500 font-sans line-clamp-1">
              {report.archetype.englishTitle}
            </p>
          </div>

          {/* Card 3: Top Strength Domain */}
          <div className="p-4 rounded-2xl bg-white/90 border border-stone-200/90 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-stone-500 font-medium">最高优势领域</span>
              <Award className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="font-serif-editorial font-bold text-base text-stone-900 truncate">
              {report.topStrength.nameZh}
            </div>
            <div className="text-[11px] text-stone-600 flex items-center gap-1 font-medium">
              得分 <strong className="text-amber-700 font-extrabold">{report.topStrength.score} 分</strong> · {report.topStrength.tier}
            </div>
          </div>

          {/* Card 4: Growth Opportunity Domain */}
          <div className="p-4 rounded-2xl bg-white/90 border border-stone-200/90 shadow-2xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-stone-500 font-medium">最需强化领域</span>
              <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
            </div>
            <div className="font-serif-editorial font-bold text-base text-stone-900 truncate">
              {report.growthOpportunity.nameZh}
            </div>
            <div className="text-[11px] text-stone-600 flex items-center gap-1 font-medium">
              得分 <strong className="text-indigo-700 font-extrabold">{report.growthOpportunity.score} 分</strong> · 提升空间显著
            </div>
          </div>
        </div>
      </section>

      {/* 2. Interactive Radar Chart & Archetype Analysis Cockpit */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (Radar Chart Visualizer): lg:col-span-7 */}
        <div className="lg:col-span-7 editorial-card rounded-3xl p-6 sm:p-8 space-y-4 bg-white border border-stone-200 flex flex-col items-center">
          <div className="w-full flex items-center justify-between pb-2 border-b border-stone-100">
            <div>
              <span className="editorial-kicker text-[10px] text-stone-400 block mb-0.5">
                VISUAL COGNITIVE RADAR MAP
              </span>
              <h3 className="font-serif-editorial text-lg sm:text-xl font-bold text-stone-900 flex items-center gap-2">
                <Brain className="w-4 h-4 text-indigo-600" />
                六维心智能力雷达图谱
              </h3>
            </div>
            <span className="text-[11px] font-mono text-stone-400">
              点触任意节点查看解析
            </span>
          </div>

          {/* The Radar SVG Component */}
          <CognitiveRadarChart
            domains={report.domains}
            overallCq={report.overallCq}
            activeDomainId={activeDomainId}
            onSelectDomain={(id) => setActiveDomainId(id)}
            comparisonMode={comparisonMode}
            onComparisonModeChange={(mode) => setComparisonMode(mode)}
          />
        </div>

        {/* Right Column (Archetype & Dominant Analysis): lg:col-span-5 */}
        <div className="lg:col-span-5 space-y-5">
          {/* Archetype Master Card */}
          <div className="editorial-card rounded-3xl p-6 sm:p-7 space-y-4 bg-gradient-to-br from-[#1C1A27] via-[#242132] to-[#161521] text-white border border-stone-800 shadow-md">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-mono font-bold border border-amber-400/30">
                <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                <span>COGNITIVE ARCHETYPE</span>
              </span>
              <span className="text-xs font-mono text-stone-400">
                主导机能
              </span>
            </div>

            <div className="space-y-1">
              <h3 className="font-serif-editorial text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-300">
                {report.archetype.title}
              </h3>
              <p className="text-xs text-stone-400 font-mono">
                {report.archetype.englishTitle}
              </p>
            </div>

            <p className="text-xs text-stone-300 leading-relaxed font-sans">
              {report.archetype.description}
            </p>

            <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 space-y-1.5">
              <span className="text-[10px] text-amber-300 font-mono uppercase tracking-wider block">
                心智座右铭 · Core Trait
              </span>
              <p className="text-xs text-white/90 font-serif-editorial italic">
                “{report.archetype.tagline}”
              </p>
            </div>

            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-stone-400">
              <span>优势领域组合:</span>
              <div className="flex items-center gap-1.5 font-bold text-amber-200">
                {report.archetype.dominantDomains.map((dom, i) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-white/10 border border-white/15 text-[11px]">
                    {dom}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Selected Domain Quick Prescription Callout */}
          <div className="editorial-card rounded-3xl p-6 space-y-3.5 bg-white border border-stone-200">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-stone-600" />
                <span>【{activeDomainData.nameZh}】专家提升建议</span>
              </span>
              <span className="text-[10px] font-mono text-stone-400">
                NEURO-TACTIC
              </span>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              {activeDomainData.keyAdvice}
            </p>

            <div className="pt-1">
              <button
                type="button"
                onClick={() => {
                  const targetGameId = activeDomainData.recommendedGameIds[0] || 'mind-trap';
                  navigate(`/game/${targetGameId}`);
                }}
                className="w-full py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
              >
                <span>立即针对此项开启专项训练</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Six Core Cognitive Domains Deep-Dive Matrix */}
      <section className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-stone-200">
          <div>
            <span className="editorial-kicker text-[10px] text-stone-500 block mb-0.5">
              DOMAIN DEEP-DIVE & GAME CORRELATION
            </span>
            <h3 className="font-serif-editorial text-xl font-bold text-stone-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-700" />
              六大认知维度详解与小游戏实操映射
            </h3>
          </div>
          <span className="text-xs text-stone-500 font-mono">
            点击卡片切换雷达聚焦点
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
          {report.domains.map((domain) => {
            const isSelected = activeDomainId === domain.id;

            return (
              <div
                key={domain.id}
                onClick={() => {
                  gameAudio.playTap();
                  setActiveDomainId(domain.id);
                }}
                className={`group editorial-card rounded-3xl p-5 sm:p-6 transition-all duration-300 cursor-pointer flex flex-col justify-between border ${
                  isSelected
                    ? 'bg-stone-900 text-white border-stone-900 shadow-md scale-[1.01]'
                    : 'bg-white text-stone-900 border-stone-200 hover:border-stone-400 hover:shadow-xs'
                }`}
              >
                {/* Header */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border"
                        style={{
                          backgroundColor: isSelected ? 'rgba(255,255,255,0.15)' : `${domain.accentColor}18`,
                          borderColor: isSelected ? 'rgba(255,255,255,0.25)' : `${domain.accentColor}40`,
                          color: isSelected ? '#FFFFFF' : domain.accentColor,
                        }}
                      >
                        {domain.id === 'memory' && <Brain className="w-4 h-4" />}
                        {domain.id === 'logic' && <Zap className="w-4 h-4" />}
                        {domain.id === 'focus' && <Target className="w-4 h-4" />}
                        {domain.id === 'decision' && <Scale className="w-4 h-4" />}
                        {domain.id === 'speed' && <Activity className="w-4 h-4" />}
                        {domain.id === 'insight' && <Sparkles className="w-4 h-4" />}
                      </div>
                      <div>
                        <h4 className="font-serif-editorial font-bold text-base leading-tight">
                          {domain.nameZh}
                        </h4>
                        <span className={`text-[10px] font-mono ${isSelected ? 'text-stone-300' : 'text-stone-400'}`}>
                          {domain.nameEn}
                        </span>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] border ${domain.tierBadgeColor}`}>
                      {domain.tier}
                    </span>
                  </div>

                  {/* Score Progress Bar */}
                  <div className="space-y-1.5 font-numeric">
                    <div className="flex items-baseline justify-between text-xs">
                      <span className={`text-[11px] ${isSelected ? 'text-stone-300' : 'text-stone-500'}`}>
                        当前能力指数
                      </span>
                      <span className="font-extrabold text-sm">
                        {domain.score} <span className="text-[10px] font-normal opacity-70">/ 100</span>
                      </span>
                    </div>
                    <div className={`w-full h-2 rounded-full overflow-hidden p-0.5 border ${isSelected ? 'bg-white/10 border-white/20' : 'bg-stone-100 border-stone-200'}`}>
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.max(5, domain.score)}%`,
                          backgroundColor: domain.accentColor,
                        }}
                      />
                    </div>
                  </div>

                  <p className={`text-xs leading-relaxed line-clamp-3 ${isSelected ? 'text-stone-300' : 'text-stone-600'}`}>
                    {domain.description}
                  </p>
                </div>

                {/* Contributing Games Breakdown */}
                <div className={`mt-4 pt-3 border-t ${isSelected ? 'border-white/15' : 'border-stone-100'} space-y-2`}>
                  <span className={`text-[10px] font-mono block ${isSelected ? 'text-stone-400' : 'text-stone-400'}`}>
                    映射游戏实操战绩:
                  </span>
                  <div className="space-y-1.5">
                    {domain.contributingGames.map((g) => (
                      <div
                        key={g.gameId}
                        className={`flex items-center justify-between text-[11px] p-2 rounded-xl border ${
                          isSelected
                            ? 'bg-white/5 border-white/10'
                            : 'bg-stone-50 border-stone-200/80'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          {g.gameNumber && (
                            <span className="font-mono text-[9px] px-1 py-0.5 rounded bg-black/10">
                              #{g.gameNumber}
                            </span>
                          )}
                          <span className="font-medium">{g.gameNameZh}</span>
                        </div>
                        <span className="font-numeric font-bold">
                          {g.score.toLocaleString()} 分
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Launch Game Link */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        gameAudio.playTap();
                        const targetId = domain.recommendedGameIds[0];
                        navigate(`/game/${targetId}`);
                      }}
                      className={`w-full py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors ${
                        isSelected
                          ? 'bg-white text-stone-900 hover:bg-stone-100'
                          : 'bg-stone-100 text-stone-800 hover:bg-stone-200'
                      }`}
                    >
                      <span>去练此项</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Targeted Training Prescription (处方级强化训练方案) */}
      <section className="editorial-card rounded-3xl p-6 sm:p-9 space-y-5 bg-white border border-stone-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200/80">
          <div>
            <span className="editorial-kicker text-[10px] text-amber-700 font-bold block mb-0.5">
              NEUROPLASTICITY TRAINING PRESCRIPTION
            </span>
            <h3 className="font-serif-editorial text-xl font-bold text-stone-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-600" />
              针对性神经强化训练建议 (今日优先推荐)
            </h3>
          </div>
          <span className="text-xs text-stone-500 font-mono">
            精准补齐短板 · 重构突触连接
          </span>
        </div>

        <p className="text-xs text-stone-600 leading-relaxed">
          根据大脑可塑性理论（Hebbian Plasticity），反复在特定边缘挑战区练习能显著增加前额叶突触棘密度。系统为您量身筛选了最能提振薄弱维度的 3 款实战实验：
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {report.recommendedTrainingPlan.map((plan, idx) => (
            <div
              key={plan.gameId}
              onClick={() => {
                gameAudio.playTap();
                navigate(`/game/${plan.gameId}`);
              }}
              className="p-5 rounded-2xl bg-stone-50 hover:bg-white border border-stone-200 hover:border-stone-400 hover:shadow-sm transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-stone-200 text-stone-700 font-bold">
                    推荐项目 0{idx + 1}
                  </span>
                  <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                    {plan.targetDomain}
                  </span>
                </div>

                <h4 className="font-serif-editorial font-bold text-base text-stone-900 group-hover:text-indigo-900 transition-colors">
                  {plan.gameNameZh}
                </h4>

                <p className="text-xs text-stone-600 leading-relaxed">
                  {plan.reason}
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs font-bold text-stone-800 group-hover:text-stone-950 border-t border-stone-200/80">
                <span>开启训练挑战 (+45 XP)</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Back to Arena / All Games Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-stone-100/80 border border-stone-200 print:hidden">
        <div className="flex items-center gap-3">
          <Gamepad2 className="w-5 h-5 text-stone-700 shrink-0" />
          <div className="text-xs">
            <span className="font-bold text-stone-900 block">
              准备好刷新您的各项能力分了吗？
            </span>
            <span className="text-stone-500">
              完成任何一款训练小游戏，雷达图谱将自动实时重新计算并更新。
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            gameAudio.playTap();
            navigate('/games');
          }}
          className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer active:scale-95 flex items-center gap-1.5"
        >
          <span>进入认知训练游戏竞技场</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

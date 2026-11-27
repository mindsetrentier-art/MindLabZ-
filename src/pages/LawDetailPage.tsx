import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Bookmark,
  BookOpen,
  Volume2,
  VolumeX,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Brain,
  Lightbulb,
  Play,
  MessageSquarePlus,
  ShieldAlert,
  Eye,
  Briefcase,
  HeartHandshake,
  ShoppingBag,
  Home,
  RefreshCw,
  Gamepad2,
  PenLine,
  Network,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useFontScale } from '../context/FontScaleContext';
import { FloatingFontScaleControl } from '../components/ui/FloatingFontScaleControl';
import { LawDetailSkeleton } from '../components/ui/Skeleton';
import { StructuredLawData, StructuredLawQuizItem } from '../types';
import { OverlappingStack, OverlappingItem } from '../components/ui/OverlappingStack';
import { THINKER_ITEMS } from '../components/ui/OverlappingStackLabModal';
import { KineticCutoutHero } from '../components/ui/KineticCutoutHero';
import { PSYCHOLOGY_GAMES } from '../data/games';
import { toggleLawSpeech, stopLawSpeech, useLawSpeech } from '../utils/lawSpeechEngine';
import { SilverSpeechText, LawVoiceToggleSwitch } from '../components/ui/SilverSpeechText';
import { LawBookReader } from '../components/law/LawBookReader';
import { buildLawBookCodex, getAdjacentLaws } from '../utils/lawBookFolioBuilder';

const READING_MODE_STORAGE_KEY = 'mindlabz_law_reading_mode_v1';

export const LawDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { fontScale } = useFontScale();
  const {
    laws,
    user,
    isBookmarked,
    toggleBookmark,
    updateLawMastery,
    addXP,
    setAiTutorOpen,
    setActiveContextLaw,
    triggerConfetti,
    openComposerWithPreload,
  } = useApp();

  const [isLoading, setIsLoading] = useState(true);

  // Structured Output data from POST /api/laws/generate
  const [structuredLaw, setStructuredLaw] = useState<StructuredLawData | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [structuredError, setStructuredError] = useState<string | null>(null);

  // Active case tab (4 Cases per law)
  const [activeCaseTab, setActiveCaseTab] = useState<'life' | 'workplace' | 'relationship' | 'business'>('life');

  // Interactive Law Mini-Game state
  const [selectedGameChoice, setSelectedGameChoice] = useState<'A' | 'B' | null>(null);

  // 3-Question Quiz state
  const [activeQuizIdx, setActiveQuizIdx] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});

  // Reading experience mode: 'book' (3D turning editorial codex) or 'scroll' (classic vertical view)
  const [readingMode, setReadingMode] = useState<'book' | 'scroll'>(() => {
    try {
      const saved = window.localStorage.getItem(READING_MODE_STORAGE_KEY);
      return saved === 'scroll' ? 'scroll' : 'book';
    } catch {
      return 'book';
    }
  });

  const handleSetReadingMode = (mode: 'book' | 'scroll') => {
    setReadingMode(mode);
    try {
      window.localStorage.setItem(READING_MODE_STORAGE_KEY, mode);
    } catch {
      // Ignore storage quota errors
    }
  };

  // Match law by slug id OR codeId (LAW001 - LAW100)
  const law = laws.find(
    (l) =>
      l.id.toLowerCase() === (id || '').toLowerCase() ||
      (l.codeId && l.codeId.toLowerCase() === (id || '').toLowerCase())
  );

  const codex = useMemo(
    () => (law ? buildLawBookCodex(law, structuredLaw) : null),
    [law, structuredLaw]
  );

  const adjacent = useMemo(
    () =>
      law
        ? getAdjacentLaws(laws, law.id)
        : { currentIndex: -1, totalCount: laws.length, prevLaw: null, nextLaw: null },
    [laws, law]
  );

  const { isSpeakingThisLaw, activeCpIndex, segments } = useLawSpeech(law?.id);

  const fetchStructuredLaw = async (lawCodeOrId: string, forceRefresh = false) => {
    try {
      setStructuredError(null);
      if (forceRefresh) setIsGeneratingAI(true);
      const res = await fetch('/api/laws/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          law_id: lawCodeOrId,
          force_refresh: forceRefresh,
        }),
      });
      if (!res.ok) {
        if (forceRefresh) {
          setStructuredError('深度结构化解析生成暂未成功，当前继续展示馆藏标准文本。');
        }
        return;
      }
      const data = await res.json();
      if (data?.law) {
        setStructuredLaw(data.law);
      }
    } catch (e) {
      console.error('Failed to fetch structured law data:', e);
      if (forceRefresh) {
        setStructuredError('网络连接波动，暂无法刷新深度解析，请稍后重试。');
      }
    } finally {
      setIsGeneratingAI(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    setStructuredLaw(null);
    setStructuredError(null);
    setSelectedGameChoice(null);
    setActiveQuizIdx(0);
    setQuizAnswers({});
    setActiveCaseTab('life');

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 150);

    if (
      law &&
      !law.isLoveCodex &&
      !law.isMicroexpression &&
      !law.isCriminalPsychology &&
      !law.isReversePsychology &&
      !law.isSexualPsychology &&
      !law.isLove100Psychology &&
      !law.isIntimateRelationship
    ) {
      void fetchStructuredLaw(law.codeId || law.id, false);
    }

    return () => {
      clearTimeout(timer);
      stopLawSpeech();
    };
  }, [id, law?.id]);

  if (isLoading) {
    return <LawDetailSkeleton />;
  }

  if (!law) {
    return (
      <div
        role="status"
        className="art-museum-mat rounded-3xl p-8 sm:p-10 text-center space-y-4 my-8 max-w-xl mx-auto"
      >
        <div className="w-12 h-12 rounded-2xl bg-[#FAF4E6] border border-[#D4A656]/35 flex items-center justify-center mx-auto text-[#8E5B13]">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="font-serif-editorial text-xl font-bold text-[#181411]">
          未在馆藏检索到该心理学定律
        </h2>
        <p className="text-xs text-[#6E675F] leading-relaxed">
          可能是编号或路径已更新，请返回定律库重新选择或检索目标条目。
        </p>
        <button
          type="button"
          onClick={() => navigate('/learn')}
          className="luxury-dark-btn min-h-[44px] px-5 py-2.5 text-xs font-bold rounded-xl cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A656]"
        >
          返回 500+ 心理学定律库
        </button>
      </div>
    );
  }

  const bookmarked = isBookmarked(law.id);
  const mastery = (user?.lawMasteryMap && user.lawMasteryMap[law.id]) || 0;

  // Merge Structured JSON fields with local law fallback seamlessly
  const displayDefinition = structuredLaw?.definition || law.shortExplanation;
  const displayMechanism = structuredLaw?.mechanism || `${law.detailedExplanation} ${law.whyItHappens}`;
  const cases = {
    life: structuredLaw?.real_life_case || law.realLifeExample,
    workplace: structuredLaw?.workplace_case || law.workplaceCase || law.realLifeExample,
    relationship: structuredLaw?.relationship_case || law.relationshipCase || law.realLifeExample,
    business: structuredLaw?.business_case || law.businessCase || law.realLifeExample,
  };
  const recognitionSignals = structuredLaw?.recognition_signals || law.recognitionSignals || [
    '依赖第一直觉快速下定论，忽略反面证据',
    '在情绪或时间压力下出现系统性判断偏移',
    '对既有观点过度确信，排斥外部独立基准',
  ];
  const antiManipulation = structuredLaw?.anti_manipulation || law.antiManipulation || [
    law.keyTakeaway,
    '启动“3秒元认知暂停”，刻意寻找至少2条反例',
    '引入客观数据与外部基准率（Outside View）进行交叉验证',
  ];

  // 3 Quiz items
  const quizList: StructuredLawQuizItem[] =
    structuredLaw?.quiz && structuredLaw.quiz.length > 0
      ? structuredLaw.quiz
      : [
          {
            question: law.question,
            options: law.answers,
            answer_index: law.correctAnswer,
            explanation: law.keyTakeaway,
          },
        ];

  const currentQuiz = quizList[activeQuizIdx] || quizList[0];
  const selectedQuizOption = quizAnswers[activeQuizIdx];
  const isCurrentQuizAnswered = selectedQuizOption !== undefined;

  // Mini-game data
  const lawGame = structuredLaw?.game || {
    title: `${law.nameZh} · 认知决策实验室`,
    type: 'scenario_choice',
    scenario: law.experimentSetup?.scenario || `当你身处受【${law.nameZh}】影响的高压情境时，你会如何决策？`,
    option_a: law.experimentSetup?.optionA.label || '顺应第一直觉快速做出反应',
    option_b: law.experimentSetup?.optionB.label || '启动系统2理性核查，引入反向证据',
    rational_choice: 'B',
    insight: law.experimentSetup?.insight || law.keyTakeaway,
  };

  const handleToggleAudio = () => {
    toggleLawSpeech({
      lawId: law.id,
      segments: [
        { key: 'title', text: law.nameZh, separator: '。' },
        { key: 'definition', text: displayDefinition, separator: '。' },
        { key: 'mechanism', text: displayMechanism, separator: '。' },
        { key: 'case', text: cases[activeCaseTab], separator: '。' },
      ],
    });
  };

  const handleGameChoice = (choice: 'A' | 'B') => {
    if (selectedGameChoice) return;
    setSelectedGameChoice(choice);
    const isRational = choice.toUpperCase() === (lawGame.rational_choice || 'B').toUpperCase();
    if (isRational) {
      updateLawMastery(law.id, Math.min(100, mastery + 15));
      addXP(30, '完成定律博弈实验');
      triggerConfetti();
    } else {
      updateLawMastery(law.id, Math.min(100, mastery + 5));
      addXP(10, '参与定律博弈实验');
    }
  };

  const handleQuizSelect = (optionIdx: number) => {
    if (isCurrentQuizAnswered) return;
    setQuizAnswers((prev) => ({ ...prev, [activeQuizIdx]: optionIdx }));

    if (optionIdx === currentQuiz.answer_index) {
      updateLawMastery(law.id, Math.min(100, mastery + 20));
      addXP(structuredLaw?.xp || law.xpReward || 25, '定律自测正确');
      triggerConfetti();
    }
  };

  const handleAskAITutor = () => {
    setActiveContextLaw(law);
    setAiTutorOpen(true);
  };

  // Related cognitive laws & models for OverlappingStack component
  const relatedLawItems: OverlappingItem[] = laws
    .filter((l) => l.id !== law.id && (l.categoryZh === law.categoryZh || l.chapter === law.chapter))
    .slice(0, 8)
    .map((l, idx) => {
      const colors = [
        'bg-indigo-600 text-white',
        'bg-stone-800 text-white',
        'bg-amber-600 text-white',
        'bg-teal-700 text-white',
        'bg-rose-700 text-white',
        'bg-purple-700 text-white',
        'bg-blue-800 text-white',
        'bg-emerald-700 text-white',
      ];
      return {
        id: l.id,
        name: l.nameZh,
        subname: l.nameEn || `${l.categoryZh}心理学`,
        badge: l.codeId,
        color: colors[idx % colors.length],
        onClick: () => navigate(`/law/${l.id}`),
      };
    });

  if (readingMode === 'book' && codex) {
    return (
      <>
        <LawBookReader
          law={law}
          codex={codex}
          adjacent={adjacent}
          relatedLawItems={relatedLawItems}
          mastery={mastery}
          bookmarked={bookmarked}
          structuredLaw={structuredLaw}
          isGeneratingAI={isGeneratingAI}
          structuredError={structuredError}
          activeCaseTab={activeCaseTab}
          setActiveCaseTab={setActiveCaseTab}
          selectedGameChoice={selectedGameChoice}
          onSelectGameChoice={handleGameChoice}
          activeQuizIdx={activeQuizIdx}
          setActiveQuizIdx={setActiveQuizIdx}
          quizAnswers={quizAnswers}
          onSelectQuizOption={handleQuizSelect}
          isSpeakingThisLaw={isSpeakingThisLaw}
          activeCpIndex={activeCpIndex}
          segments={segments}
          onToggleAudio={handleToggleAudio}
          onToggleBookmark={() => toggleBookmark(law.id)}
          onRefreshAI={() => fetchStructuredLaw(law.codeId || law.id, true)}
          onOpenJournal={() =>
            openComposerWithPreload({
              relatedLawId: law.id,
              relatedLawName: `${law.nameZh} (${law.nameEn})`,
              templateType: 'cbt-restructure',
              title: `关于【${law.nameZh}】的心智反思与觉察`,
              tags: [law.nameZh, law.categoryZh, '认知重构'],
            })
          }
          onOpenAITutor={handleAskAITutor}
          onSwitchToScrollMode={() => handleSetReadingMode('scroll')}
          fontScale={fontScale}
        />
        <FloatingFontScaleControl tone="paper" title="定律书籍字号调节" />
      </>
    );
  }

  return (
    <div
      className={`space-y-8 sm:space-y-10 pb-12 animate-fadeIn mx-auto transition-[max-width] duration-200 quiz-font-scope ${
        fontScale === 'xlarge' ? 'max-w-5xl' : 'max-w-4xl'
      }`}
      data-quiz-font-scale={fontScale}
    >
      {/* 0. Kinetic Cutout Typography Detail Header: Photo emerges from letterforms with scroll zoom */}
      <section className="rounded-3xl overflow-hidden shadow-2xl border border-[#D4A656]/30 bg-[#0D0B16]">
        <KineticCutoutHero
          mainTitle={law.nameZh}
          subtitle={`${law.codeId || 'LAW'} · ${law.nameEn}`}
          tagline={`${law.categoryZh}心理学 · 经典定律实证解析`}
          storageKey={`mindlabz_law_hero_${law.id}`}
          heightClass="min-h-[160vh]"
        />
      </section>

      {/* 1. Header Editorial Lead Article Cover */}
      <article className="editorial-card rounded-2xl p-6 sm:p-10 md:p-12 space-y-6">
        {/* Top Folio / Rubric */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200/80">
          <div className="flex items-center gap-2.5 text-xs text-[#6E675F] font-medium flex-wrap">
            {law.codeId && (
              <span className="luxury-badge-ink font-mono text-xs font-bold text-[#181411] tracking-wider tabular-nums">
                {law.codeId}
              </span>
            )}
            <span className="text-stone-300" aria-hidden="true">/</span>
            <span className="font-semibold text-[#181411]">
              {law.categoryZh}心理学
            </span>
            <span className="text-stone-300" aria-hidden="true">·</span>
            <span>难度 {structuredLaw?.difficulty || law.difficulty}</span>
            <span className="text-stone-300" aria-hidden="true">·</span>
            <span className="font-numeric font-medium text-[#2B2520]">
              证据等级 {structuredLaw?.evidence_level || law.evidenceLevel || 'A'}
            </span>
            {law.isLoveCodex && law.subTag && (
              <>
                <span className="text-stone-300" aria-hidden="true">·</span>
                <span className="px-2 py-0.5 rounded-md bg-[#FDF3F5] text-[#961D38] border border-[#A82442]/20 font-semibold">
                  爱情心理 · {law.subTag}
                </span>
              </>
            )}
            {law.assignedCityZh && (
              <>
                <span className="text-stone-300" aria-hidden="true">·</span>
                <span className="px-2 py-0.5 rounded-md bg-[#FAF6EC] text-[#8E5B13] border border-[#D4A656]/30 font-semibold">
                  驻守首都 · {law.assignedCityZh}
                </span>
              </>
            )}
            {law.isMicroexpression && (
              <>
                <span className="text-stone-300" aria-hidden="true">·</span>
                <span className="font-semibold text-[#4338A6] tabular-nums">
                  {law.categoryZh}分类排行第 {law.categoryRank || 1} 名 · 微表情总榜 #{law.microGlobalRank || 1}
                </span>
                {law.actionUnitCode && (
                  <>
                    <span className="text-stone-300" aria-hidden="true">·</span>
                    <span className="font-mono font-bold text-[#181411]">{law.actionUnitCode}</span>
                  </>
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <button
              type="button"
              onClick={() => fetchStructuredLaw(law.codeId || law.id, true)}
              disabled={isGeneratingAI}
              aria-busy={isGeneratingAI}
              className="luxury-surface-btn px-3 min-h-[40px] rounded-xl flex items-center gap-1.5 text-[#2B2520] text-xs font-semibold cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B45B8]/45"
              title="使用 Gemini 实时生成深度结构化内容"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingAI ? 'animate-spin' : ''}`} />
              <span>{isGeneratingAI ? '生成中...' : '深度解析'}</span>
            </button>

            <button
              type="button"
              onClick={handleToggleAudio}
              aria-pressed={isSpeakingThisLaw}
              aria-label={isSpeakingThisLaw ? '停止朗读本定律' : '语音朗读本定律'}
              className={`min-w-[40px] min-h-[40px] px-2.5 rounded-xl flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B45B8]/45 ${
                isSpeakingThisLaw
                  ? 'luxury-dark-btn'
                  : 'luxury-surface-btn text-[#2B2520]'
              }`}
              title="语音朗读"
            >
              {isSpeakingThisLaw ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => toggleBookmark(law.id)}
              aria-pressed={bookmarked}
              aria-label={bookmarked ? '取消收藏本定律' : '收藏本定律'}
              className={`luxury-surface-btn min-w-[40px] min-h-[40px] px-2.5 rounded-xl flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B45B8]/45 ${
                bookmarked ? 'border-[#C8933B]/45 bg-[#FAF4E6]' : 'text-[#2B2520]'
              }`}
              title={bookmarked ? '已收藏至心智藏品' : '收藏本定律'}
            >
              <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-[#C8933B] text-[#9E6B1E]' : ''}`} />
            </button>

            <button
              type="button"
              onClick={() => navigate(`/knowledge-graph?focus=${encodeURIComponent(law.id)}`)}
              aria-label="在知识图谱中定位本定律"
              className="luxury-surface-btn px-3 min-h-[40px] rounded-xl flex items-center gap-1.5 text-[#181411] text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B45B8]/45"
              title="在 500 律 D3 知识图谱中定位本定律"
            >
              <Network className="w-3.5 h-3.5 text-[#A66C1E]" />
              <span className="hidden sm:inline">图谱关联</span>
            </button>

            {/* Cognitive Journal quick action */}
            <button
              type="button"
              onClick={() =>
                openComposerWithPreload({
                  relatedLawId: law.id,
                  relatedLawName: `${law.nameZh} (${law.nameEn})`,
                  templateType: 'cbt-restructure',
                  title: `关于【${law.nameZh}】的心智反思与觉察`,
                  tags: [law.nameZh, law.categoryZh, '认知重构'],
                })
              }
              aria-label="记录关于本定律的觉察手记"
              className="luxury-dark-btn px-3 min-h-[40px] rounded-xl flex items-center gap-1.5 text-xs font-semibold cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A656]"
              title="对此定律记录心智觉察手记 (+50 XP)"
            >
              <PenLine className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">记录觉察手记</span>
            </button>

            <button
              type="button"
              onClick={() => handleSetReadingMode('book')}
              aria-label="切换至典藏书籍翻页阅读模式"
              className="luxury-surface-btn px-3 min-h-[40px] rounded-xl flex items-center gap-1.5 text-[#8E5B13] border-[#C8933B]/45 bg-[#FAF4E6] text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A656]"
              title="切换至沉浸式书籍翻页模式"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>书籍翻阅模式</span>
            </button>
          </div>
        </div>

        {structuredError && (
          <div
            role="alert"
            className="rounded-xl px-4 py-3 bg-[#FDF4F6] border border-[#A82442]/25 text-xs text-[#961D38] flex flex-wrap items-center justify-between gap-2"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{structuredError}</span>
            </div>
            <button
              type="button"
              onClick={() => fetchStructuredLaw(law.codeId || law.id, true)}
              className="luxury-surface-btn px-2.5 py-1 rounded-lg text-[11px] font-bold text-[#961D38] cursor-pointer"
            >
              重试解析
            </button>
          </div>
        )}

        {law.chapter && (
          <p className="text-xs text-[#6E675F] font-serif-editorial italic">
            Chapter Archive · {law.chapter}
          </p>
        )}

        <div className="space-y-2">
          <h1 className="font-serif-editorial text-2xl sm:text-3xl md:text-4xl font-bold text-[#181411] tracking-tight leading-tight">
            <SilverSpeechText
              text={law.nameZh}
              isSpeaking={isSpeakingThisLaw}
              activeCpIndex={activeCpIndex}
              segmentRange={segments.title}
            />
          </h1>
          <p className="font-serif-editorial italic text-[#6E675F] text-sm sm:text-base tracking-wide">
            {law.nameEn}
          </p>
        </div>

        {/* Literary Definition Quote Box */}
        <div className="bg-[#FAF7F1] border border-stone-200/75 border-l-[3px] border-l-[#C8933B] p-5 sm:p-6 rounded-r-xl">
          <p className="font-serif-editorial text-base sm:text-lg text-[#2B2520] leading-relaxed font-normal">
            “
            <SilverSpeechText
              text={displayDefinition}
              isSpeaking={isSpeakingThisLaw}
              activeCpIndex={activeCpIndex}
              segmentRange={segments.definition}
            />
            ”
          </p>
        </div>

        {/* Current Mastery, Reward Progress & Bottom-Right Voice Switch */}
        <div className="pt-4 border-t border-stone-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="text-[#6E675F]">
            当前心智内化度 · 研习奖励 <strong className="text-[#181411] font-numeric font-semibold">+{structuredLaw?.xp || law.xpReward || 20} XP</strong>
          </span>
          <div className="flex items-center gap-3 ml-auto flex-wrap justify-end">
            <div className="w-28 sm:w-36 h-1.5 bg-[#EFECE5] border border-stone-200/70 rounded-full overflow-hidden">
              <div
                className="h-full chameleon-bar rounded-full"
                style={{ width: `${mastery}%` }}
              />
            </div>
            <span className="font-numeric font-semibold text-[#181411]">{mastery}%</span>
            <LawVoiceToggleSwitch
              isOn={isSpeakingThisLaw}
              onToggle={handleToggleAudio}
              size="sm"
            />
          </div>
        </div>
      </article>

      {/* 2. Module 2: Cognitive & Neural Mechanism */}
      <section className="editorial-card rounded-2xl p-7 sm:p-10 space-y-4">
        <div>
          <span className="editorial-kicker text-[10px] text-stone-500 block mb-1">
            01 · Cognitive & Neural Mechanism
          </span>
          <h3 className="font-serif-editorial text-lg sm:text-xl font-bold text-stone-900 flex items-center gap-2">
            <Brain className="w-4 h-4 text-stone-700" />
            认知科学底层机制与神经根基
          </h3>
        </div>
        <p className="text-sm sm:text-base text-stone-700 leading-relaxed sm:leading-loose">
          <SilverSpeechText
            text={displayMechanism}
            isSpeaking={isSpeakingThisLaw}
            activeCpIndex={activeCpIndex}
            segmentRange={segments.mechanism}
          />
        </p>

        {/* Microexpression Scientific Attribution, Observable Signs & Limitations */}
        {law.isMicroexpression && (
          <div className="pt-4 border-t border-stone-200/80 space-y-4">
            {law.observableSigns && law.observableSigns.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-stone-800">可观察面部动作线索（Observable Signs）：</span>
                <p className="text-sm text-stone-700 font-medium">
                  {law.observableSigns.join('  ·  ')}
                </p>
              </div>
            )}

            {law.limitations && (
              <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200/80 space-y-1">
                <span className="text-xs font-bold text-rose-900">科学解释边界与误读警示（Limitations）：</span>
                <p className="text-sm text-rose-900/90 leading-relaxed">{law.limitations}</p>
              </div>
            )}

            {(law.researcher || law.sourceCitation) && (
              <div className="text-xs text-stone-500 flex flex-wrap items-center gap-x-3 gap-y-1">
                {law.researcher && (
                  <span>
                    <strong className="text-stone-700">核心研究者：</strong>
                    {law.researcher} ({law.studyYear})
                  </span>
                )}
                {law.sourceCitation && (
                  <span className="font-mono text-[11px] text-stone-500">
                    {law.sourceCitation}
                  </span>
                )}
              </div>
            )}
          </div>
        )}
        {/* Criminal Psychology Scientific & Legal Boundary Disclaimer */}
        {law.isCriminalPsychology && (
          <div className="pt-4 border-t border-stone-200/80 space-y-3">
            <div className="p-4 rounded-xl bg-rose-50/75 border border-rose-200/80 space-y-1.5">
              <span className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-800" />
                <span>科学使用边界与非诊断声明（{law.criminalCategory} · {law.criminalContext}）</span>
              </span>
              <p className="text-sm text-rose-950/90 leading-relaxed">
                {law.healthyBoundary || law.criminalLearningNote}
              </p>
              {law.limitations && (
                <p className="text-xs text-stone-600 leading-relaxed pt-1 border-t border-rose-200/60">
                  {law.limitations}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Sexual Psychology Scientific Consent & Non-Diagnostic Disclaimer */}
        {law.isSexualPsychology && (
          <div className="pt-4 border-t border-stone-200/80 space-y-3">
            <div className="p-4 rounded-xl bg-purple-50/75 border border-purple-200/80 space-y-1.5">
              <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-purple-800" />
                <span>科学教育、知情同意与非诊断声明（{law.sexualPillar} · {law.sexualCategory} · {law.sexualContext}）</span>
              </span>
              <p className="text-sm text-purple-950/90 leading-relaxed">
                {law.healthyBoundary || law.sexualLearningNote}
              </p>
              {law.limitations && (
                <p className="text-xs text-stone-600 leading-relaxed pt-1 border-t border-purple-200/60">
                  {law.limitations}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Intimate Relationships Scientific & Relational Safety Disclaimer */}
        {law.isIntimateRelationship && (
          <div className="pt-4 border-t border-stone-200/80 space-y-3">
            <div className="p-4 rounded-xl bg-rose-50/75 border border-rose-200/80 space-y-1.5">
              <span className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-800" />
                <span>亲密关系科普、自主平等与非诊断声明（{law.intimatePillar} · {law.intimateCategory} · {law.intimateContext}）</span>
              </span>
              <p className="text-sm text-rose-950/90 leading-relaxed">
                {law.healthyBoundary || law.intimateLearningNote}
              </p>
              {law.limitations && (
                <p className="text-xs text-stone-600 leading-relaxed pt-1 border-t border-rose-200/60">
                  {law.limitations}
                </p>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Dedicated Story Scenario Section for Microexpression Laws */}
      {law.storyScenario && (
        <section className="editorial-card rounded-2xl p-7 sm:p-10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-200/80">
            <div>
              <span className="editorial-kicker text-[10px] text-amber-700 block mb-1">
                Story Scenario · 沉浸式故事场景实案
              </span>
              <h3 className="font-serif-editorial text-lg sm:text-xl font-bold text-stone-900">
                {law.storyScenario.title}
              </h3>
            </div>
            <span className="text-xs text-stone-500 font-medium">
              {law.storyScenario.setting}
            </span>
          </div>

          <p className="text-sm sm:text-base text-stone-700 leading-relaxed sm:leading-loose">
            {law.storyScenario.narrative}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-stone-200/80 space-y-1.5">
              <span className="text-xs font-bold text-indigo-900">客观编码与解码拆解</span>
              <p className="text-xs sm:text-sm text-stone-700 leading-relaxed">
                {law.storyScenario.decodingBreakdown}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80 space-y-1.5">
              <span className="text-xs font-bold text-amber-900">故事带走的一句话法则</span>
              <p className="text-xs sm:text-sm text-amber-950 font-medium leading-relaxed">
                {law.storyScenario.takeaway}
              </p>
            </div>
          </div>

          {law.dispatchedGames && law.dispatchedGames.length > 0 && (
            <div className="pt-3 border-t border-stone-200/80 space-y-2.5">
              <span className="text-xs font-bold text-stone-800 block">
                该知识点已同步分派至以下认知竞技场小游戏（点击立即上手体验与解答）：
              </span>
              <div className="flex flex-wrap gap-2">
                {law.dispatchedGames.map((gid) => {
                  const g = PSYCHOLOGY_GAMES.find((item) => item.id === gid);
                  if (!g) return null;
                  return (
                    <button
                      key={gid}
                      onClick={() => navigate(`/game/${gid}`)}
                      className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Gamepad2 className="w-3.5 h-3.5 text-amber-400" />
                      <span>{g.nameZh}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      )}

      {/* 3. Module 3: 4 Real-World Cases */}
      <section className="editorial-card rounded-2xl p-7 sm:p-10 space-y-5">
        <div>
          <span className="editorial-kicker text-[10px] text-stone-500 block mb-1">
            02 · Panoramic Case Studies
          </span>
          <h3 className="font-serif-editorial text-lg sm:text-xl font-bold text-stone-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-stone-700" />
            四大核心应用场景案例
          </h3>
        </div>

        {/* 4 Case Tabs */}
        <div
          role="tablist"
          aria-label="四大核心应用场景"
          className="grid grid-cols-2 sm:grid-cols-4 gap-2 border-b border-stone-200/80 pb-3"
        >
          {[
            { key: 'life', label: '日常生活', icon: Home },
            { key: 'workplace', label: '职场协作', icon: Briefcase },
            { key: 'relationship', label: '亲密关系', icon: HeartHandshake },
            { key: 'business', label: '商业博弈', icon: ShoppingBag },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeCaseTab === tab.key;
            return (
              <button
                type="button"
                role="tab"
                aria-selected={active}
                key={tab.key}
                onClick={() => setActiveCaseTab(tab.key as any)}
                className={`min-h-[44px] py-2 px-3 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B45B8]/45 ${
                  active
                    ? 'luxury-dark-btn font-semibold'
                    : 'luxury-surface-btn text-[#57514A] hover:text-[#181411]'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div
          role="tabpanel"
          className="bg-[#FAF7F1] rounded-xl p-5 border border-stone-200/70 text-sm sm:text-base text-[#2B2520] leading-relaxed"
        >
          <SilverSpeechText
            text={cases[activeCaseTab]}
            isSpeaking={isSpeakingThisLaw}
            activeCpIndex={activeCpIndex}
            segmentRange={segments.case}
          />
        </div>
      </section>

      {/* 4. Module 4 & 5: Recognition Signals & Anti-Manipulation Defense */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recognition Signals */}
        <section className="editorial-card rounded-2xl p-6 sm:p-7 space-y-4">
          <div>
            <span className="editorial-kicker text-[10px] text-[#6E675F] block mb-1">
              03 · Recognition Signals
            </span>
            <h3 className="font-serif-editorial text-base sm:text-lg font-bold text-[#181411] flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-[#4338A6]" />
              三大触发识别信号
            </h3>
          </div>
          <ul className="space-y-2.5">
            {recognitionSignals.map((sig, idx) => (
              <li
                key={idx}
                className="p-3.5 rounded-xl bg-[#FAF7F1] border border-stone-200/70 text-sm text-[#2B2520] leading-relaxed flex items-start gap-2.5"
              >
                <span className="font-mono text-xs font-bold text-[#8E5B13] shrink-0 mt-0.5 tabular-nums">
                  0{idx + 1}
                </span>
                <span>{sig}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Anti-Manipulation */}
        <section className="editorial-card rounded-2xl p-6 sm:p-7 space-y-4">
          <div>
            <span className="editorial-kicker text-[10px] text-[#6E675F] block mb-1">
              04 · Defense Strategy
            </span>
            <h3 className="font-serif-editorial text-base sm:text-lg font-bold text-[#181411] flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-[#157F5D]" />
              反操控与破局防御
            </h3>
          </div>
          <ul className="space-y-2.5">
            {antiManipulation.map((defense, idx) => (
              <li
                key={idx}
                className="p-3.5 rounded-xl bg-[#FAF7F1] border border-stone-200/70 text-sm text-[#2B2520] leading-relaxed flex items-start gap-2.5"
              >
                <span className="text-[#157F5D] font-bold shrink-0 mt-0.5">✓</span>
                <span>{defense}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* 5. Module 6: Law Interactive Decision Mini-Game */}
      <section className="editorial-card rounded-2xl p-7 sm:p-10 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <span className="editorial-kicker text-[10px] text-[#6E675F] block mb-1">
              05 · Dialectical Decision Lab
            </span>
            <h3 className="font-serif-editorial text-lg sm:text-xl font-bold text-[#181411] flex items-center gap-2">
              <Gamepad2 className="w-4 h-4 text-[#5B45B8]" />
              {lawGame.title}
            </h3>
          </div>
          <span className="luxury-badge-ink font-numeric text-xs font-semibold text-[#8E5B13]">+30 XP</span>
        </div>

        <div className="bg-[#FAF7F1] p-5 sm:p-6 rounded-xl border border-stone-200/70 text-base sm:text-lg text-[#181411] leading-relaxed font-medium">
          {lawGame.scenario}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {(['A', 'B'] as const).map((choiceKey) => {
            const optionText = choiceKey === 'A' ? lawGame.option_a : lawGame.option_b;
            const isSelected = selectedGameChoice === choiceKey;
            const isRational = choiceKey === (lawGame.rational_choice || 'B').toUpperCase();

            return (
              <button
                type="button"
                key={choiceKey}
                onClick={() => handleGameChoice(choiceKey)}
                disabled={selectedGameChoice !== null}
                aria-pressed={isSelected}
                className={`min-h-[64px] p-4 sm:p-5 rounded-xl border-2 text-left text-sm sm:text-base font-semibold transition-all cursor-pointer disabled:cursor-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B45B8]/45 ${
                  selectedGameChoice === null
                    ? 'bg-white hover:bg-[#FAF7F1] border-stone-200 hover:border-[#D4A656]/60 text-[#181411]'
                    : isRational
                    ? 'bg-[#EEF7F3] border-[#157F5D]/60 text-[#0F5C43]'
                    : isSelected
                    ? 'bg-[#FAF4E6] border-[#C8933B]/60 text-[#7A5011]'
                    : 'bg-[#FAF8F4] border-stone-200/70 text-[#6E675F]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono font-bold text-xs sm:text-sm text-[#181411]">选项 {choiceKey}</span>
                  {selectedGameChoice !== null && isRational && (
                    <span className="text-xs font-semibold text-[#157F5D]">
                      系统2 理性解
                    </span>
                  )}
                </div>
                <p className="leading-relaxed">{optionText}</p>
              </button>
            );
          })}
        </div>

        {selectedGameChoice && (
          <div
            role="status"
            className="p-4 sm:p-5 rounded-xl bg-[#FAF7F1] border border-[#D4A656]/35 text-sm sm:text-base text-[#2B2520] leading-relaxed animate-fadeIn"
          >
            <strong className="block mb-1 font-semibold text-[#181411]">实验洞察与反思：</strong>
            {lawGame.insight}
          </div>
        )}
      </section>

      {/* 6. Module 7: 3-Question Structured Quiz */}
      <section className="editorial-card rounded-2xl p-7 sm:p-10 space-y-5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <span className="editorial-kicker text-[10px] text-[#6E675F] block mb-1">
              06 · Three-Step Dialectic Quiz
            </span>
            <h3 className="font-serif-editorial text-lg sm:text-xl font-bold text-[#181411]">
              定律深度思辨自测（{activeQuizIdx + 1} / {quizList.length}）
            </h3>
          </div>

          <div className="flex items-center gap-1.5 font-numeric text-xs">
            {quizList.map((_, idx) => (
              <button
                type="button"
                key={idx}
                onClick={() => setActiveQuizIdx(idx)}
                aria-label={`切换至第 ${idx + 1} 题`}
                aria-current={activeQuizIdx === idx ? 'step' : undefined}
                className={`min-w-[40px] min-h-[40px] rounded-xl text-xs font-bold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B45B8]/45 ${
                  activeQuizIdx === idx
                    ? 'luxury-dark-btn'
                    : quizAnswers[idx] !== undefined
                    ? 'bg-[#EEF7F3] text-[#157F5D] border border-[#157F5D]/30'
                    : 'luxury-surface-btn text-[#57514A]'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </div>

        <p className="font-serif-editorial text-lg sm:text-xl md:text-2xl font-bold text-[#181411] leading-relaxed">
          {currentQuiz.question}
        </p>

        <div className="space-y-3">
          {currentQuiz.options.map((ans, idx) => {
            const isSelected = selectedQuizOption === idx;
            const isCorrect = idx === currentQuiz.answer_index;
            const showSuccess = isCurrentQuizAnswered && isCorrect;
            const showWrong = isCurrentQuizAnswered && isSelected && !isCorrect;
            const optionLetter = String.fromCharCode(65 + idx);

            return (
              <button
                type="button"
                key={idx}
                disabled={isCurrentQuizAnswered}
                aria-pressed={isSelected}
                onClick={() => handleQuizSelect(idx)}
                className={`w-full min-h-[56px] text-left p-4 sm:p-5 rounded-xl text-base sm:text-lg font-semibold leading-relaxed border-2 transition-all flex items-center justify-between gap-3 cursor-pointer disabled:cursor-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B45B8]/45 ${
                  showSuccess
                    ? 'bg-[#EEF7F3] border-[#157F5D]/60 text-[#0F5C43]'
                    : showWrong
                    ? 'bg-[#FDF4F6] border-[#A82442]/50 text-[#961D38]'
                    : 'bg-white hover:bg-[#FAF7F1] border-stone-200 hover:border-[#D4A656]/60 text-[#181411]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-xs sm:text-sm font-mono font-bold shrink-0 mt-0.5 ${
                      showSuccess
                        ? 'bg-[#157F5D] text-white'
                        : showWrong
                        ? 'bg-[#A82442] text-white'
                        : 'bg-[#F1EDE4] text-[#2B2520]'
                    }`}
                  >
                    {optionLetter}
                  </span>
                  <span>{ans}</span>
                </div>
                {showSuccess && <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-[#157F5D] shrink-0" />}
                {showWrong && <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-[#A82442] shrink-0" />}
              </button>
            );
          })}
        </div>

        {isCurrentQuizAnswered && (
          <div
            role="status"
            className="p-4 sm:p-5 bg-[#FAF7F1] border border-stone-200/80 rounded-xl text-sm sm:text-base text-[#2B2520] space-y-3 animate-fadeIn"
          >
            <p className="leading-relaxed">
              <strong className="text-[#181411]">解析：</strong>
              {currentQuiz.explanation}
            </p>
            {activeQuizIdx < quizList.length - 1 && (
              <button
                type="button"
                onClick={() => setActiveQuizIdx((prev) => prev + 1)}
                className="luxury-dark-btn min-h-[44px] px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A656]"
              >
                继续下一题 ({activeQuizIdx + 2}/{quizList.length}) →
              </button>
            )}
          </div>
        )}
      </section>

      {/* 7. Module 8: Related Cognitive Laws & Thinkers Stack (1/3 Overlap Spread & Collapse) */}
      <section className="editorial-card rounded-2xl p-6 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200/70 pb-3">
          <div>
            <span className="editorial-kicker text-[10px] text-[#6E675F] block mb-0.5">
              07 · Related Principles & Observers
            </span>
            <h3 className="font-serif-editorial text-base sm:text-lg font-bold text-[#181411]">
              同领域关联思维模型与思辨巨擘
            </h3>
          </div>
          <span className="text-[11px] text-[#6E675F] font-sans">
            1/3 叠放 · 点击依次散开并显露名称
          </span>
        </div>

        <OverlappingStack
          items={relatedLawItems.length >= 4 ? relatedLawItems : THINKER_ITEMS}
          maxVisible={4}
          overlapRatio={1 / 3}
          size="md"
          layout="wrap"
          staggerMs={40}
          showToggleHint={true}
        />
      </section>

      {/* 8. Bottom Editorial Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          type="button"
          onClick={handleAskAITutor}
          className="luxury-surface-btn flex-1 min-h-[48px] py-3.5 px-4 rounded-xl text-[#181411] font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B45B8]/45"
        >
          <MessageSquarePlus className="w-4 h-4 text-[#4338A6]" />
          <span>向 AI 认知导师咨询深度案例</span>
        </button>

        <button
          type="button"
          onClick={() => navigate(`/game/${law.relatedGame}`)}
          className="flex-1 min-h-[48px] py-3.5 px-4 rounded-xl chameleon-btn font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A656]"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>进入认知竞技场实战演练</span>
        </button>
      </div>

      <FloatingFontScaleControl tone="paper" title="定律阅读与答题字号" />
    </div>
  );
};

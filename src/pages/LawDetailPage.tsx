import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Bookmark,
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
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { LawDetailSkeleton } from '../components/ui/Skeleton';
import { StructuredLawData, StructuredLawQuizItem } from '../types';
import { OverlappingStack, OverlappingItem } from '../components/ui/OverlappingStack';
import { THINKER_ITEMS } from '../components/ui/OverlappingStackLabModal';

export const LawDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Structured Output data from POST /api/laws/generate
  const [structuredLaw, setStructuredLaw] = useState<StructuredLawData | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // Active case tab (4 Cases per law)
  const [activeCaseTab, setActiveCaseTab] = useState<'life' | 'workplace' | 'relationship' | 'business'>('life');

  // Interactive Law Mini-Game state
  const [selectedGameChoice, setSelectedGameChoice] = useState<'A' | 'B' | null>(null);

  // 3-Question Quiz state
  const [activeQuizIdx, setActiveQuizIdx] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});

  // Match law by slug id OR codeId (LAW001 - LAW100)
  const law = laws.find(
    (l) =>
      l.id.toLowerCase() === (id || '').toLowerCase() ||
      (l.codeId && l.codeId.toLowerCase() === (id || '').toLowerCase())
  );

  const fetchStructuredLaw = async (lawCodeOrId: string, forceRefresh = false) => {
    try {
      if (forceRefresh) setIsGeneratingAI(true);
      const res = await fetch('/api/laws/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          law_id: lawCodeOrId,
          force_refresh: forceRefresh,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.law) {
          setStructuredLaw(data.law);
        }
      }
    } catch (e) {
      console.error('Failed to fetch structured law data:', e);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    setStructuredLaw(null);
    setSelectedGameChoice(null);
    setActiveQuizIdx(0);
    setQuizAnswers({});
    setActiveCaseTab('life');

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 150);

    if (law) {
      void fetchStructuredLaw(law.codeId || law.id, false);
    }

    return () => clearTimeout(timer);
  }, [id, law?.id]);

  if (isLoading) {
    return <LawDetailSkeleton />;
  }

  if (!law) {
    return (
      <div className="bg-white rounded-3xl p-8 text-center border border-[#E8E5F0] space-y-4 my-8">
        <h2 className="text-lg font-bold text-[#1B192E]">未找到该心理学定律</h2>
        <button
          onClick={() => navigate('/learn')}
          className="px-4 py-2 bg-[#6C4CF1] text-white text-xs font-bold rounded-xl"
        >
          返回 100 定律库
        </button>
      </div>
    );
  }

  const bookmarked = isBookmarked(law.id);
  const mastery = user.lawMasteryMap[law.id] || 0;

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
    if (!('speechSynthesis' in window)) {
      setIsPlayingAudio(!isPlayingAudio);
      return;
    }

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    } else {
      window.speechSynthesis.cancel();
      const textToRead = `${law.codeId || ''}，${law.nameZh}。${displayDefinition}。${displayMechanism}`;
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.lang = 'zh-CN';
      utterance.rate = 1.0;
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
      setIsPlayingAudio(true);
    }
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

  return (
    <div className="space-y-8 sm:space-y-10 pb-12 animate-fadeIn max-w-4xl mx-auto">
      {/* 1. Header Editorial Lead Article Cover */}
      <article className="editorial-card rounded-2xl p-7 sm:p-10 md:p-12 space-y-6">
        {/* Top Folio / Rubric */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200/80">
          <div className="flex items-center gap-2.5 text-xs text-stone-500 font-medium flex-wrap">
            {law.codeId && (
              <span className="font-mono text-xs font-bold text-stone-900 tracking-wider">
                {law.codeId}
              </span>
            )}
            <span className="text-stone-300" aria-hidden="true">/</span>
            <span className="font-semibold text-stone-800">
              {law.categoryZh}心理学
            </span>
            <span className="text-stone-300" aria-hidden="true">·</span>
            <span>难度 {structuredLaw?.difficulty || law.difficulty}</span>
            <span className="text-stone-300" aria-hidden="true">·</span>
            <span className="font-numeric font-medium text-stone-700">
              证据等级 {structuredLaw?.evidence_level || law.evidenceLevel || 'A'}
            </span>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => fetchStructuredLaw(law.codeId || law.id, true)}
              disabled={isGeneratingAI}
              className="px-3 h-8 rounded-lg flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200/80 text-stone-700 text-xs font-medium transition-colors cursor-pointer"
              title="使用 Gemini 实时生成深度结构化内容"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingAI ? 'animate-spin' : ''}`} />
              <span>{isGeneratingAI ? '生成中...' : '深度解析'}</span>
            </button>

            <button
              onClick={handleToggleAudio}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer border ${
                isPlayingAudio
                  ? 'bg-stone-900 text-white border-stone-900'
                  : 'bg-white text-stone-700 border-stone-200 hover:border-stone-400'
              }`}
              title="语音朗读"
            >
              {isPlayingAudio ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={() => toggleBookmark(law.id)}
              className="w-8 h-8 rounded-lg flex items-center justify-center bg-white text-stone-700 border border-stone-200 hover:border-stone-400 transition-colors cursor-pointer"
              title="收藏本定律"
            >
              <Bookmark className={`w-3.5 h-3.5 ${bookmarked ? 'fill-stone-900 text-stone-900' : ''}`} />
            </button>

            {/* Cognitive Journal quick action */}
            <button
              onClick={() =>
                openComposerWithPreload({
                  relatedLawId: law.id,
                  relatedLawName: `${law.nameZh} (${law.nameEn})`,
                  templateType: 'cbt-restructure',
                  title: `关于【${law.nameZh}】的心智反思与觉察`,
                  tags: [law.nameZh, law.categoryZh, '认知重构'],
                })
              }
              className="px-2.5 h-8 rounded-lg flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium transition-colors cursor-pointer btn-tactile"
              title="对此定律记录心智觉察手记 (+50 XP)"
            >
              <PenLine className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">记录觉察手记</span>
            </button>
          </div>
        </div>

        {law.chapter && (
          <p className="text-xs text-stone-500 font-serif-editorial italic">
            Chapter Archive · {law.chapter}
          </p>
        )}

        <div className="space-y-2">
          <h1 className="font-serif-editorial text-2xl sm:text-3xl md:text-4xl font-bold text-stone-900 tracking-tight leading-tight">
            {law.nameZh}
          </h1>
          <p className="font-serif-editorial italic text-stone-500 text-sm sm:text-base tracking-wide">
            {law.nameEn}
          </p>
        </div>

        {/* Literary Definition Quote Box */}
        <div className="bg-[#FAF8F5]/90 border-l-2 border-stone-900 p-5 sm:p-6 rounded-r-xl">
          <p className="font-serif-editorial text-sm sm:text-base text-stone-800 leading-relaxed font-normal">
            “{displayDefinition}”
          </p>
        </div>

        {/* Current Mastery & Reward Progress */}
        <div className="pt-4 border-t border-stone-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <span className="text-stone-500">
            当前心智内化度 · 研习奖励 <strong className="text-stone-800 font-numeric font-semibold">+{structuredLaw?.xp || law.xpReward || 20} XP</strong>
          </span>
          <div className="flex items-center gap-3">
            <div className="w-36 h-1 bg-stone-200 rounded-full overflow-hidden">
              <div
                className="h-full chameleon-bar rounded-full"
                style={{ width: `${mastery}%` }}
              />
            </div>
            <span className="font-numeric font-semibold text-stone-800">{mastery}%</span>
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
        <p className="text-xs sm:text-sm text-stone-700 leading-relaxed sm:leading-loose">
          {displayMechanism}
        </p>
      </section>

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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border-b border-stone-200/80 pb-3">
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
                key={tab.key}
                onClick={() => setActiveCaseTab(tab.key as any)}
                className={`py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  active
                    ? 'bg-stone-900 text-white font-semibold'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="bg-[#FAF8F5]/90 rounded-xl p-5 border border-stone-200/60 text-xs sm:text-sm text-stone-700 leading-relaxed">
          {cases[activeCaseTab]}
        </div>
      </section>

      {/* 4. Module 4 & 5: Recognition Signals & Anti-Manipulation Defense */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recognition Signals */}
        <section className="editorial-card rounded-2xl p-6 sm:p-7 space-y-4">
          <div>
            <span className="editorial-kicker text-[10px] text-stone-500 block mb-1">
              03 · Recognition Signals
            </span>
            <h3 className="font-serif-editorial text-base sm:text-lg font-bold text-stone-900 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-stone-700" />
              三大触发识别信号
            </h3>
          </div>
          <ul className="space-y-2.5">
            {recognitionSignals.map((sig, idx) => (
              <li
                key={idx}
                className="p-3.5 rounded-xl bg-[#FAF8F5] border border-stone-200/60 text-xs text-stone-700 leading-relaxed flex items-start gap-2.5"
              >
                <span className="font-mono text-xs font-bold text-stone-400 shrink-0 mt-0.5">
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
            <span className="editorial-kicker text-[10px] text-stone-500 block mb-1">
              04 · Defense Strategy
            </span>
            <h3 className="font-serif-editorial text-base sm:text-lg font-bold text-stone-900 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-stone-700" />
              反操控与破局防御
            </h3>
          </div>
          <ul className="space-y-2.5">
            {antiManipulation.map((defense, idx) => (
              <li
                key={idx}
                className="p-3.5 rounded-xl bg-[#FAF8F5] border border-stone-200/60 text-xs text-stone-700 leading-relaxed flex items-start gap-2.5"
              >
                <span className="text-emerald-700 font-bold shrink-0 mt-0.5">✓</span>
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
            <span className="editorial-kicker text-[10px] text-stone-500 block mb-1">
              05 · Dialectical Decision Lab
            </span>
            <h3 className="font-serif-editorial text-lg sm:text-xl font-bold text-stone-900 flex items-center gap-2">
              <Gamepad2 className="w-4 h-4 text-stone-700" />
              {lawGame.title}
            </h3>
          </div>
          <span className="font-numeric text-xs font-semibold text-stone-700">+30 XP</span>
        </div>

        <div className="bg-[#FAF8F5] p-5 rounded-xl border border-stone-200/60 text-xs sm:text-sm text-stone-800 leading-relaxed">
          {lawGame.scenario}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {(['A', 'B'] as const).map((choiceKey) => {
            const optionText = choiceKey === 'A' ? lawGame.option_a : lawGame.option_b;
            const isSelected = selectedGameChoice === choiceKey;
            const isRational = choiceKey === (lawGame.rational_choice || 'B').toUpperCase();

            return (
              <button
                key={choiceKey}
                onClick={() => handleGameChoice(choiceKey)}
                disabled={selectedGameChoice !== null}
                className={`p-4 rounded-xl border text-left text-xs font-medium transition-colors cursor-pointer ${
                  selectedGameChoice === null
                    ? 'bg-white hover:bg-stone-50 border-stone-200 text-stone-900'
                    : isRational
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-900'
                    : isSelected
                    ? 'bg-amber-50 border-amber-300 text-amber-900'
                    : 'bg-stone-50/60 border-stone-200 text-stone-500'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono font-bold text-xs text-stone-900">选项 {choiceKey}</span>
                  {selectedGameChoice !== null && isRational && (
                    <span className="text-[10px] font-medium text-emerald-800">
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
          <div className="p-4 rounded-xl bg-stone-100/80 border border-stone-200 text-xs text-stone-800 leading-relaxed animate-fadeIn">
            <strong className="block mb-1 font-semibold">实验洞察与反思：</strong>
            {lawGame.insight}
          </div>
        )}
      </section>

      {/* 6. Module 7: 3-Question Structured Quiz */}
      <section className="editorial-card rounded-2xl p-7 sm:p-10 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <span className="editorial-kicker text-[10px] text-stone-500 block mb-1">
              06 · Three-Step Dialectic Quiz
            </span>
            <h3 className="font-serif-editorial text-lg sm:text-xl font-bold text-stone-900">
              定律深度思辨自测（{activeQuizIdx + 1} / {quizList.length}）
            </h3>
          </div>

          <div className="flex items-center gap-1.5 font-numeric text-xs">
            {quizList.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveQuizIdx(idx)}
                className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  activeQuizIdx === idx
                    ? 'bg-stone-900 text-white'
                    : quizAnswers[idx] !== undefined
                    ? 'bg-emerald-100 text-emerald-900'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </div>

        <p className="text-xs sm:text-sm font-semibold text-stone-900 leading-relaxed">
          {currentQuiz.question}
        </p>

        <div className="space-y-2.5">
          {currentQuiz.options.map((ans, idx) => {
            const isSelected = selectedQuizOption === idx;
            const isCorrect = idx === currentQuiz.answer_index;
            const showSuccess = isCurrentQuizAnswered && isCorrect;
            const showWrong = isCurrentQuizAnswered && isSelected && !isCorrect;

            return (
              <button
                key={idx}
                disabled={isCurrentQuizAnswered}
                onClick={() => handleQuizSelect(idx)}
                className={`w-full text-left p-3.5 rounded-xl text-xs font-medium border transition-colors flex items-center justify-between cursor-pointer ${
                  showSuccess
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-900'
                    : showWrong
                    ? 'bg-rose-50 border-rose-300 text-rose-900'
                    : 'bg-white hover:bg-stone-50 border-stone-200 text-stone-900'
                }`}
              >
                <span>{ans}</span>
                {showSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />}
                {showWrong && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
              </button>
            );
          })}
        </div>

        {isCurrentQuizAnswered && (
          <div className="p-4 bg-stone-100/80 border border-stone-200 rounded-xl text-xs text-stone-800 space-y-2 animate-fadeIn">
            <p className="leading-relaxed">
              <strong>解析：</strong>
              {currentQuiz.explanation}
            </p>
            {activeQuizIdx < quizList.length - 1 && (
              <button
                onClick={() => setActiveQuizIdx((prev) => prev + 1)}
                className="px-4 py-2 rounded-lg bg-stone-900 text-white font-medium text-xs hover:bg-stone-800 transition-colors cursor-pointer"
              >
                继续下一题 ({activeQuizIdx + 2}/{quizList.length}) →
              </button>
            )}
          </div>
        )}
      </section>

      {/* 7. Module 8: Related Cognitive Laws & Thinkers Stack (1/3 Overlap Spread & Collapse) */}
      <section className="editorial-card rounded-2xl p-6 sm:p-8 space-y-4 bg-white border border-stone-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200/70 pb-3">
          <div>
            <span className="editorial-kicker text-[10px] text-stone-500 block mb-0.5">
              07 · Related Principles & Observers
            </span>
            <h3 className="font-serif-editorial text-base sm:text-lg font-bold text-stone-900">
              同领域关联思维模型与思辨巨擘
            </h3>
          </div>
          <span className="text-[11px] text-stone-500 font-sans">
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
          onClick={handleAskAITutor}
          className="flex-1 py-3.5 px-4 rounded-xl bg-white border border-stone-200 hover:border-stone-400 text-stone-800 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <MessageSquarePlus className="w-4 h-4 text-stone-700" />
          <span>向 AI 认知导师咨询深度案例</span>
        </button>

        <button
          onClick={() => navigate(`/game/${law.relatedGame}`)}
          className="flex-1 py-3.5 px-4 rounded-xl chameleon-btn font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>进入认知竞技场实战演练</span>
        </button>
      </div>
    </div>
  );
};

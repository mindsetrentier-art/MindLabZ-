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
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { LawDetailSkeleton } from '../components/ui/Skeleton';
import { StructuredLawData, StructuredLawQuizItem } from '../types';

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

  return (
    <div className="space-y-5 pb-8 animate-fadeIn">
      {/* 1. Header Editorial Card with Law Code (LAW001), Chapter, Titles & Actions */}
      <div className="art-hero-surface rounded-3xl p-6 relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-xs flex-wrap">
            {law.codeId && (
              <span className="font-extrabold font-numeric px-2.5 py-0.5 rounded-lg bg-[#532CD8] text-white">
                {law.codeId}
              </span>
            )}
            <span className="font-bold text-[#532CD8]">{law.categoryZh}心理学</span>
            <span className="text-[#CBD5E1]" aria-hidden="true">·</span>
            <span className="font-medium text-[#64748B]">{structuredLaw?.difficulty || law.difficulty}</span>
            <span className="text-[#CBD5E1]" aria-hidden="true">·</span>
            <span className="font-bold text-[#059669] font-numeric">
              证据等级 {structuredLaw?.evidence_level || law.evidenceLevel || 'A'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchStructuredLaw(law.codeId || law.id, true)}
              disabled={isGeneratingAI}
              className="px-2.5 h-9 rounded-2xl flex items-center gap-1 bg-[#FAF9FF] text-[#6C4CF1] border border-[#DDD6FE] hover:bg-[#EDE9FE] text-[11px] font-bold transition-colors btn-tactile"
              title="使用 Gemini Structured Output 实时生成深度结构化内容"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingAI ? 'animate-spin' : ''}`} />
              <span>{isGeneratingAI ? 'AI生成中...' : 'AI深度生成'}</span>
            </button>

            <button
              onClick={handleToggleAudio}
              className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-colors border btn-tactile ${
                isPlayingAudio
                  ? 'bg-[#6C4CF1] text-white border-[#6C4CF1] animate-pulse'
                  : 'bg-white text-[#6C4CF1] border-[#E6E2F5] hover:bg-[#EDE9FE]'
              }`}
              title="语音朗读"
            >
              {isPlayingAudio ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              onClick={() => toggleBookmark(law.id)}
              className="w-9 h-9 rounded-2xl flex items-center justify-center bg-white text-[#6C4CF1] border border-[#E6E2F5] hover:bg-[#EDE9FE] transition-colors btn-tactile"
              title="收藏"
            >
              <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-[#6C4CF1] text-[#6C4CF1]' : ''}`} />
            </button>
          </div>
        </div>

        {law.chapter && (
          <p className="text-[11px] font-bold text-[#6C4CF1] mb-1">
            所属章节：{law.chapter}
          </p>
        )}

        <h1 className="text-2xl font-extrabold text-[#18181B] tracking-tight mb-1">
          {law.nameZh}
        </h1>
        <p className="text-sm font-serif-editorial italic text-[#64748B] tracking-wide mb-4">
          {law.nameEn}
        </p>

        {/* Module 1: Core Definition Quote */}
        <div className="p-4 rounded-2xl bg-[#FAF9FF]/90 border-l-4 border-[#6C4CF1] text-xs font-medium text-[#18181B] leading-relaxed shadow-xs">
          “{displayDefinition}”
        </div>

        {/* Current Mastery & XP */}
        <div className="mt-4 pt-3 border-t border-[#EDE9FE] flex items-center justify-between">
          <span className="text-xs text-[#64748B] font-medium">
            当前定律内化度 · 奖励 <strong className="text-[#D97706] font-numeric">+{structuredLaw?.xp || law.xpReward || 20} XP</strong>
          </span>
          <div className="flex items-center gap-2.5">
            <div className="w-28 h-2 bg-[#EDE9FE] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#6C4CF1] to-[#532CD8] rounded-full transition-all duration-500"
                style={{ width: `${mastery}%` }}
              />
            </div>
            <span className="text-xs font-extrabold text-[#532CD8] font-numeric">{mastery}%</span>
          </div>
        </div>
      </div>

      {/* 2. Module 2: Cognitive & Neural Mechanism */}
      <div className="art-card rounded-3xl p-6 space-y-4">
        <div>
          <span className="text-[10px] font-bold text-[#6C4CF1] font-numeric tracking-wider block mb-1">
            01 · COGNITIVE & NEURAL MECHANISM
          </span>
          <h3 className="text-sm font-extrabold text-[#18181B] flex items-center gap-2 mb-2">
            <Brain className="w-4 h-4 text-[#6C4CF1]" />
            认知科学底层机制
          </h3>
          <p className="text-xs text-[#334155] leading-relaxed">
            {displayMechanism}
          </p>
        </div>
      </div>

      {/* 3. Module 3: 4 Real-World Cases (Life, Workplace, Relationship, Business) */}
      <div className="art-card rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-[#D97706] font-numeric tracking-wider block mb-0.5">
              02 · 4 PANORAMIC CASES
            </span>
            <h3 className="text-sm font-extrabold text-[#18181B] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#F59E0B]" />
              四大核心场景全息案例
            </h3>
          </div>
        </div>

        {/* 4 Case Category Tabs */}
        <div className="grid grid-cols-4 gap-1.5 bg-[#FAF9FF] p-1.5 rounded-2xl border border-[#EBE7F8]">
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
                className={`py-2 px-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-all btn-tactile ${
                  active
                    ? 'bg-[#6C4CF1] text-white shadow-xs'
                    : 'text-[#64748B] hover:text-[#18181B]'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="p-4 rounded-2xl bg-[#FFFBEB] border border-[#FEF3C7] text-xs text-[#475569] leading-relaxed animate-fadeIn">
          {cases[activeCaseTab]}
        </div>
      </div>

      {/* 4. Module 4 & 5: Recognition Signals & Anti-Manipulation Defense */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Recognition Signals */}
        <div className="art-card rounded-3xl p-5 space-y-3">
          <div>
            <span className="text-[10px] font-bold text-[#E11D48] font-numeric tracking-wider block mb-0.5">
              03 · RECOGNITION SIGNALS
            </span>
            <h3 className="text-sm font-extrabold text-[#18181B] flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-[#E11D48]" />
              3 大触发识别信号
            </h3>
          </div>
          <ul className="space-y-2">
            {recognitionSignals.map((sig, idx) => (
              <li
                key={idx}
                className="p-3 rounded-2xl bg-rose-50/70 border border-rose-100 text-xs text-[#334155] leading-relaxed flex items-start gap-2"
              >
                <span className="w-4 h-4 rounded-full bg-rose-200/80 text-rose-800 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5 font-numeric">
                  {idx + 1}
                </span>
                <span>{sig}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Anti-Manipulation */}
        <div className="art-card rounded-3xl p-5 space-y-3">
          <div>
            <span className="text-[10px] font-bold text-[#059669] font-numeric tracking-wider block mb-0.5">
              04 · ANTI-MANIPULATION
            </span>
            <h3 className="text-sm font-extrabold text-[#18181B] flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-[#10B981]" />
              反操控与防御指南
            </h3>
          </div>
          <ul className="space-y-2">
            {antiManipulation.map((defense, idx) => (
              <li
                key={idx}
                className="p-3 rounded-2xl bg-[#ECFDF5]/70 border border-[#A7F3D0] text-xs text-[#065F46] leading-relaxed flex items-start gap-2"
              >
                <span className="w-4 h-4 rounded-full bg-[#10B981] text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5 font-numeric">
                  ✓
                </span>
                <span>{defense}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 5. Module 6: Law Interactive Decision Mini-Game (law.game) */}
      <div className="art-card rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-[#6C4CF1] font-numeric tracking-wider block">
              05 · INTERACTIVE DECISION LAB
            </span>
            <h3 className="text-sm font-extrabold text-[#18181B] flex items-center gap-1.5">
              <Gamepad2 className="w-4 h-4 text-[#6C4CF1]" />
              {lawGame.title}
            </h3>
          </div>
          <span className="text-xs font-extrabold text-[#D97706] font-numeric">+30 XP</span>
        </div>

        <p className="text-xs text-[#334155] leading-relaxed bg-[#FAF9FF] p-4 rounded-2xl border border-[#EBE7F8]">
          {lawGame.scenario}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {(['A', 'B'] as const).map((choiceKey) => {
            const optionText = choiceKey === 'A' ? lawGame.option_a : lawGame.option_b;
            const isSelected = selectedGameChoice === choiceKey;
            const isRational =
              choiceKey === (lawGame.rational_choice || 'B').toUpperCase();

            return (
              <button
                key={choiceKey}
                onClick={() => handleGameChoice(choiceKey)}
                disabled={selectedGameChoice !== null}
                className={`p-4 rounded-2xl border text-left text-xs font-semibold transition-all btn-press ${
                  selectedGameChoice === null
                    ? 'bg-white hover:bg-[#F5F3FF] border-[#E6E2F5] text-[#18181B]'
                    : isRational
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-900'
                    : isSelected
                    ? 'bg-amber-50 border-amber-300 text-amber-900'
                    : 'bg-white/60 border-[#E6E2F5] text-[#64748B]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-extrabold text-[#532CD8]">方案 {choiceKey}</span>
                  {selectedGameChoice !== null && isRational && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white">
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
          <div className="p-4 rounded-2xl bg-[#FAF9FF] border border-[#DDD6FE] text-xs text-[#532CD8] leading-relaxed animate-fadeIn">
            <strong className="font-bold block mb-1">🔬 实验洞察：</strong>
            {lawGame.insight}
          </div>
        )}
      </div>

      {/* 6. Module 7: 3-Question Structured Quiz (law.quiz) */}
      <div className="art-card rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-[#6C4CF1] font-numeric tracking-wider block">
              06 · 3-STEP MASTERY QUIZ
            </span>
            <h3 className="text-sm font-extrabold text-[#18181B]">
              定律深度自测（第 {activeQuizIdx + 1} / {quizList.length} 题）
            </h3>
          </div>

          <div className="flex items-center gap-1.5">
            {quizList.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveQuizIdx(idx)}
                className={`w-6 h-6 rounded-lg text-[11px] font-extrabold font-numeric transition-all ${
                  activeQuizIdx === idx
                    ? 'bg-[#6C4CF1] text-white'
                    : quizAnswers[idx] !== undefined
                    ? 'bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]'
                    : 'bg-[#F5F3FF] text-[#64748B]'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </div>

        <p className="text-xs font-semibold text-[#18181B] leading-relaxed">
          {currentQuiz.question}
        </p>

        <div className="space-y-2">
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
                className={`w-full text-left p-3.5 rounded-2xl text-xs font-semibold border transition-all flex items-center justify-between btn-press ${
                  showSuccess
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-900 shadow-xs'
                    : showWrong
                    ? 'bg-rose-50 border-rose-300 text-rose-900'
                    : 'bg-[#FAF9FF] hover:bg-[#F5F3FF] border-[#E6E2F5] text-[#18181B]'
                }`}
              >
                <span>{ans}</span>
                {showSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                {showWrong && <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />}
              </button>
            );
          })}
        </div>

        {isCurrentQuizAnswered && (
          <div className="p-3.5 bg-[#FAF9FF] border border-[#E6E2F5] rounded-2xl text-xs text-[#532CD8] space-y-2 animate-fadeIn">
            <p className="font-medium leading-relaxed">
              💡 <strong>解析：</strong>
              {currentQuiz.explanation}
            </p>
            {activeQuizIdx < quizList.length - 1 && (
              <button
                onClick={() => setActiveQuizIdx((prev) => prev + 1)}
                className="px-4 py-2 rounded-xl bg-[#6C4CF1] text-white font-bold text-xs btn-press"
              >
                继续下一题 ({activeQuizIdx + 2}/{quizList.length}) →
              </button>
            )}
          </div>
        )}
      </div>

      {/* 7. Bottom Action Bar (Play Related Game & Ask AI Coach) */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={handleAskAITutor}
          className="flex-1 py-3.5 rounded-2xl bg-white border border-[#E6E2F5] hover:bg-[#FAF9FF] text-[#6C4CF1] font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 transition-all btn-press"
        >
          <MessageSquarePlus className="w-4 h-4 text-[#6C4CF1]" />
          <span>向 AI 心理教练提问</span>
        </button>

        <button
          onClick={() => navigate(`/game/${law.relatedGame}`)}
          className="flex-1 py-3.5 rounded-2xl bg-[#6C4CF1] hover:bg-[#532CD8] text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 transition-all btn-press"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>进入训练场实战演练</span>
        </button>
      </div>
    </div>
  );
};

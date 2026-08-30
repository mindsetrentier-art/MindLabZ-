import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Bookmark, Volume2, VolumeX, Sparkles, CheckCircle2, AlertCircle, ArrowRight, Brain, Lightbulb, Play, MessageSquarePlus, Share2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { LawDetailSkeleton } from '../components/ui/Skeleton';

export const LawDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { laws, user, isBookmarked, toggleBookmark, updateLawMastery, addXP, setAiTutorOpen, setActiveContextLaw, triggerConfetti } = useApp();

  const [isLoading, setIsLoading] = useState(true);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);

  const law = laws.find(l => l.id === id);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 180);
    return () => clearTimeout(timer);
  }, [id]);

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
          返回定律库
        </button>
      </div>
    );
  }

  const bookmarked = isBookmarked(law.id);
  const mastery = user.lawMasteryMap[law.id] || 0;

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
      const textToRead = `${law.nameZh}。${law.shortExplanation}。${law.detailedExplanation}`;
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.lang = 'zh-CN';
      utterance.rate = 1.0;
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
      setIsPlayingAudio(true);
    }
  };

  const handleAnswerSubmit = (index: number) => {
    if (isAnswerSubmitted) return;
    setSelectedAnswer(index);
    setIsAnswerSubmitted(true);

    if (index === law.correctAnswer) {
      updateLawMastery(law.id, Math.min(100, mastery + 20));
      addXP(50, '定律自测正确');
      triggerConfetti();
    }
  };

  const handleAskAITutor = () => {
    setActiveContextLaw(law);
    setAiTutorOpen(true);
  };

  return (
    <div className="space-y-5 pb-8 animate-fadeIn">
      {/* 1. Header Card with Titles, Category & Bookmark */}
      <div className="bg-white rounded-3xl p-6 border border-[#E6E2F5] shadow-[0_4px_20px_-2px_rgba(108,76,241,0.05)] relative overflow-hidden">
        {/* Top Badges */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#EDE9FE] text-[#6C4CF1] border border-[#DDD6FE]">
              {law.categoryZh}心理学
            </span>
            <span className="text-xs font-medium text-[#64748B] font-['Inter']">
              {law.difficulty} Level
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleAudio}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors border btn-press ${
                isPlayingAudio
                  ? 'bg-[#6C4CF1] text-white border-[#6C4CF1] animate-pulse'
                  : 'bg-[#FAF9FF] text-[#6C4CF1] border-[#E6E2F5] hover:bg-[#EDE9FE]'
              }`}
              title="语音朗读"
            >
              {isPlayingAudio ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              onClick={() => toggleBookmark(law.id)}
              className="w-9 h-9 rounded-full flex items-center justify-center bg-[#FAF9FF] text-[#6C4CF1] border border-[#E6E2F5] hover:bg-[#EDE9FE] transition-colors btn-press"
              title="收藏"
            >
              <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-[#6C4CF1] text-[#6C4CF1]' : ''}`} />
            </button>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-extrabold text-[#18181B] tracking-tight mb-1">
          {law.nameZh}
        </h1>
        <p className="text-xs font-semibold text-[#64748B] font-['Inter'] tracking-wide mb-4">
          {law.nameEn}
        </p>

        {/* Core Definition Quote */}
        <div className="p-4 rounded-2xl bg-[#FAF9FF] border-l-4 border-[#6C4CF1] text-xs font-medium text-[#18181B] leading-relaxed">
          “{law.shortExplanation}”
        </div>

        {/* Current Mastery */}
        <div className="mt-4 pt-3 border-t border-[#F5F3FF] flex items-center justify-between">
          <span className="text-xs text-[#64748B] font-medium">当前定律掌握度</span>
          <div className="flex items-center gap-2">
            <div className="w-28 h-2 bg-[#EDE9FE] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#6C4CF1] rounded-full transition-all duration-500"
                style={{ width: `${mastery}%` }}
              />
            </div>
            <span className="text-xs font-bold text-[#6C4CF1] font-['Inter']">{mastery}%</span>
          </div>
        </div>
      </div>

      {/* 2. Scientific Mechanism & Why it Happens */}
      <div className="bg-white rounded-3xl p-6 border border-[#E6E2F5] shadow-[0_4px_20px_-2px_rgba(108,76,241,0.05)] space-y-4">
        <div>
          <h3 className="text-sm font-bold text-[#18181B] flex items-center gap-2 mb-2">
            <Brain className="w-4 h-4 text-[#6C4CF1]" />
            认知科学底层原理
          </h3>
          <p className="text-xs text-[#475569] leading-relaxed">
            {law.detailedExplanation}
          </p>
        </div>

        <div className="p-3.5 bg-[#FAF9FF] rounded-2xl border border-[#E6E2F5]">
          <h4 className="text-xs font-bold text-[#6C4CF1] mb-1">⚡ 大脑为什么会这样？</h4>
          <p className="text-xs text-[#64748B] leading-relaxed">
            {law.whyItHappens}
          </p>
        </div>
      </div>

      {/* 3. Real-life Scenario & Practical Takeaway */}
      <div className="bg-white rounded-3xl p-6 border border-[#E6E2F5] shadow-[0_4px_20px_-2px_rgba(108,76,241,0.05)] space-y-4">
        <div>
          <h3 className="text-sm font-bold text-[#18181B] flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-[#F59E0B]" />
            现实生活生动案例
          </h3>
          <p className="text-xs text-[#475569] leading-relaxed bg-[#FFFBEB] p-3.5 rounded-2xl border border-[#FEF3C7]">
            {law.realLifeExample}
          </p>
        </div>

        <div>
          <h3 className="text-sm font-bold text-[#18181B] flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-[#10B981]" />
            实操破解与应用建议
          </h3>
          <p className="text-xs text-[#475569] leading-relaxed bg-[#ECFDF5] p-3.5 rounded-2xl border border-[#A7F3D0]">
            {law.keyTakeaway}
          </p>
        </div>
      </div>

      {/* 4. Interactive Self-Test Question */}
      <div className="bg-white rounded-3xl p-6 border border-[#E6E2F5] shadow-[0_4px_20px_-2px_rgba(108,76,241,0.05)] space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#18181B] flex items-center gap-2">
            <span>🎯 认知掌握度自测</span>
          </h3>
          <span className="text-[11px] font-bold text-[#6C4CF1] bg-[#EDE9FE] px-2 py-0.5 rounded-full border border-[#DDD6FE]">+50 XP</span>
        </div>

        <p className="text-xs font-semibold text-[#18181B] leading-relaxed">
          {law.question}
        </p>

        <div className="space-y-2">
          {law.answers.map((ans, idx) => {
            const isSelected = selectedAnswer === idx;
            const isCorrect = idx === law.correctAnswer;
            const showSuccess = isAnswerSubmitted && isCorrect;
            const showWrong = isAnswerSubmitted && isSelected && !isCorrect;

            return (
              <button
                key={idx}
                disabled={isAnswerSubmitted}
                onClick={() => handleAnswerSubmit(idx)}
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

        {isAnswerSubmitted && (
          <div className="p-3.5 bg-[#FAF9FF] border border-[#E6E2F5] rounded-2xl text-xs text-[#6C4CF1] font-medium animate-fadeIn">
            {selectedAnswer === law.correctAnswer
              ? '🎉 正确！你已经深刻理解了该定律的核心机制，掌握度已同步提升！'
              : `💡 思考一下：正确答案是【${law.answers[law.correctAnswer]}】。`}
          </div>
        )}
      </div>

      {/* 5. Bottom Action Bar (Play Related Game & Ask AI) */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={handleAskAITutor}
          className="flex-1 py-3.5 rounded-2xl bg-white border border-[#E6E2F5] hover:bg-[#FAF9FF] text-[#6C4CF1] font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 transition-all btn-press"
        >
          <MessageSquarePlus className="w-4 h-4 text-[#6C4CF1]" />
          <span>向 AI 导师提问</span>
        </button>

        <button
          onClick={() => navigate(`/game/${law.relatedGame}`)}
          className="flex-1 py-3.5 rounded-2xl bg-[#6C4CF1] hover:bg-[#532CD8] text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 transition-all btn-press"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>在游戏中实战演练</span>
        </button>
      </div>
    </div>
  );
};

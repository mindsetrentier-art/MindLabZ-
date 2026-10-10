import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  BookOpen,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Edit3,
  Trash2,
  Star,
  Brain,
  Waves,
  Feather,
  Scale,
  ArrowRight,
  MessageSquare,
} from 'lucide-react';
import { CognitiveJournalEntry, JournalTemplateType } from '../../types';
import { JOURNAL_TEMPLATES, EMOTION_PRESETS } from '../../data/journalTemplates';
import { useApp } from '../../context/AppContext';

interface JournalCardProps {
  entry: CognitiveJournalEntry;
  onEdit: (entry: CognitiveJournalEntry) => void;
  onDelete: (id: string) => void;
}

export const JournalCard: React.FC<JournalCardProps> = ({
  entry,
  onEdit,
  onDelete,
}) => {
  const navigate = useNavigate();
  const { setAiTutorOpen, setActiveContextLaw, laws } = useApp();
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState<boolean>(false);

  const templateMeta =
    JOURNAL_TEMPLATES.find((t) => t.id === entry.templateType) ||
    JOURNAL_TEMPLATES[0];

  const emotionPreset = EMOTION_PRESETS.find(
    (p) => p.nameZh === entry.emotion.primary
  );

  const getTemplateIcon = (id: JournalTemplateType) => {
    switch (id) {
      case 'cbt-restructure':
        return <Brain className="w-3.5 h-3.5" />;
      case 'flow-reflection':
        return <Waves className="w-3.5 h-3.5" />;
      case 'emotional-decentering':
        return <Feather className="w-3.5 h-3.5" />;
      case 'decision-debiasing':
        return <Scale className="w-3.5 h-3.5" />;
      case 'free-insight':
        return <Sparkles className="w-3.5 h-3.5" />;
    }
  };

  const handleConsultAITutor = () => {
    if (entry.relatedLawId) {
      const lawObj = laws.find((l) => l.id === entry.relatedLawId);
      if (lawObj) setActiveContextLaw(lawObj);
    }
    setAiTutorOpen(true);
  };

  // Find the primary reframed takeaway to show in compact view
  const primaryTakeaway =
    entry.structuredData.reframedPerspective ||
    entry.structuredData.tomorrowAnchor ||
    entry.structuredData.selfCompassion ||
    entry.structuredData.calibratedPrinciple ||
    entry.structuredData.coreTakeaway ||
    entry.structuredData.content ||
    Object.values(entry.structuredData)[0] ||
    '暂无详细记录';

  return (
    <article className="editorial-card rounded-2xl p-6 sm:p-7 md:p-8 space-y-5 transition-all hover:border-stone-400/80">
      {/* 1. Header Folio Stamp */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200/80 pb-3.5">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-mono text-stone-600">
            <Calendar className="w-3.5 h-3.5 text-stone-400" />
            <span>{entry.date}</span>
            {entry.time && (
              <>
                <span className="text-stone-300">·</span>
                <Clock className="w-3.5 h-3.5 text-stone-400" />
                <span>{entry.time}</span>
              </>
            )}
          </div>

          <span className="text-stone-300 text-xs hidden sm:inline">|</span>

          {/* Template Badge */}
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-stone-100 text-stone-700 text-xs font-medium border border-stone-200/70">
            {getTemplateIcon(entry.templateType)}
            <span>{templateMeta.title}</span>
          </span>
        </div>

        {/* Emotion Pill & Intensity */}
        <div className="flex items-center gap-2">
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
              emotionPreset
                ? emotionPreset.colorClass
                : 'bg-stone-100 text-stone-700 border-stone-300'
            }`}
          >
            {entry.emotion.primary}
            {entry.emotion.secondary && ` · ${entry.emotion.secondary}`}
          </span>
          <span className="text-xs font-numeric text-stone-600 font-medium">
            强度 {entry.emotion.intensity}/10
          </span>
        </div>
      </div>

      {/* 2. Title & Psychology Law Tag */}
      <div className="space-y-2">
        <h3 className="font-serif-editorial text-lg sm:text-xl font-bold text-stone-900 tracking-tight leading-snug">
          {entry.title}
        </h3>

        {entry.relatedLawId && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/law/${entry.relatedLawId}`)}
              className="inline-flex items-center gap-1.5 text-xs text-stone-700 hover:text-stone-900 font-medium px-2.5 py-1 rounded-lg bg-stone-100/90 hover:bg-stone-200/80 transition-colors border border-stone-200"
            >
              <BookOpen className="w-3.5 h-3.5 text-stone-500" />
              <span>关联定律: {entry.relatedLawName || entry.relatedLawId}</span>
              <ArrowRight className="w-3 h-3 text-stone-400" />
            </button>
          </div>
        )}
      </div>

      {/* 3. Pull-Quote Insight Summary (Editorial Style) */}
      <div className="p-4 sm:p-5 rounded-xl bg-[#FAF8F5] border-l-3 border-stone-900 text-stone-800 space-y-1">
        <span className="editorial-kicker text-[10px]">
          Key Metacognitive Insight / 核心认知顿悟
        </span>
        <p className="font-serif-editorial text-sm sm:text-[15px] leading-relaxed italic text-stone-900">
          “{primaryTakeaway}”
        </p>
      </div>

      {/* 4. Collapsible Structured Responses Grid */}
      {isExpanded && (
        <div className="pt-3 border-t border-stone-200/70 space-y-4 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templateMeta.defaultQuestions.map((q) => {
              const answer = entry.structuredData[q.key];
              if (!answer) return null;
              return (
                <div
                  key={q.key}
                  className="p-4 rounded-xl bg-white border border-stone-200/80 space-y-1.5"
                >
                  <span className="text-xs font-bold text-stone-700 block">
                    {q.label}
                  </span>
                  <p className="text-xs text-stone-800 leading-relaxed font-serif-editorial whitespace-pre-wrap">
                    {answer}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Lucidity Rating & Tags */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs border-t border-stone-100">
            <div className="flex items-center gap-1 text-amber-500">
              <span className="text-stone-500 mr-1">通透度:</span>
              {[...Array(entry.insightRating || 5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
              ))}
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {entry.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 text-[11px] font-mono"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. Footer Actions Bar */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs font-medium text-stone-600 hover:text-stone-900 flex items-center gap-1 btn-tactile py-1 px-2 rounded-lg hover:bg-stone-100 transition-colors"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              <span>收起完整答辩</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              <span>查看全部结构化复盘 ({Object.keys(entry.structuredData).length} 项)</span>
            </>
          )}
        </button>

        <div className="flex items-center gap-2">
          {/* Ask AI Tutor about this journal entry */}
          <button
            onClick={handleConsultAITutor}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-medium transition-colors btn-tactile"
            title="请 AI 认知导师进行心理学深度解读与赋能"
          >
            <Sparkles className="w-3.5 h-3.5 text-stone-700" />
            <span className="hidden sm:inline">AI 导师深度解读</span>
            <span className="sm:hidden">AI 解读</span>
          </button>

          {/* Edit Entry */}
          <button
            onClick={() => onEdit(entry)}
            className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors"
            title="编辑此手记"
          >
            <Edit3 className="w-4 h-4" />
          </button>

          {/* Delete Entry with confirmation popover */}
          {showConfirmDelete ? (
            <div className="flex items-center gap-1 animate-fadeIn">
              <button
                onClick={() => {
                  onDelete(entry.id);
                  setShowConfirmDelete(false);
                }}
                className="px-2 py-1 rounded bg-rose-600 text-white text-[11px] font-bold hover:bg-rose-700"
              >
                确认删除
              </button>
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="px-2 py-1 rounded bg-stone-200 text-stone-700 text-[11px]"
              >
                取消
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowConfirmDelete(true)}
              className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="删除此手记"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
};

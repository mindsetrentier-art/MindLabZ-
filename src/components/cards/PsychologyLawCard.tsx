import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, ChevronRight, CheckCircle2, Sparkles } from 'lucide-react';
import { PsychologyLaw, CategoryZh } from '../../types';
import { useApp } from '../../context/AppContext';
import { gameAudio } from '../../utils/gameAudio';

interface PsychologyLawCardProps {
  law: PsychologyLaw;
  compact?: boolean;
}

const CATEGORY_ART_PALETTE: Record<CategoryZh, { color: string; border: string; bgSoft: string; badgeText: string }> = {
  '认知': { color: '#6366F1', border: 'hover:border-indigo-400', bgSoft: 'bg-indigo-50/40', badgeText: 'text-indigo-700' },
  '记忆': { color: '#06B6D4', border: 'hover:border-cyan-400', bgSoft: 'bg-cyan-50/40', badgeText: 'text-cyan-700' },
  '决策': { color: '#10B981', border: 'hover:border-emerald-400', bgSoft: 'bg-emerald-50/40', badgeText: 'text-emerald-700' },
  '社会': { color: '#8B5CF6', border: 'hover:border-purple-400', bgSoft: 'bg-purple-50/40', badgeText: 'text-purple-700' },
  '情绪': { color: '#F43F5E', border: 'hover:border-rose-400', bgSoft: 'bg-rose-50/40', badgeText: 'text-rose-700' },
  '行为': { color: '#F59E0B', border: 'hover:border-amber-400', bgSoft: 'bg-amber-50/40', badgeText: 'text-amber-800' },
};

export const PsychologyLawCard: React.FC<PsychologyLawCardProps> = ({ law, compact = false }) => {
  const navigate = useNavigate();
  const { isBookmarked, toggleBookmark, user } = useApp();

  const bookmarked = isBookmarked(law.id);
  const mastery = user.lawMasteryMap[law.id] || 0;
  const isMastered = mastery >= 80;

  const palette = CATEGORY_ART_PALETTE[law.categoryZh] || {
    color: '#6366F1',
    border: 'hover:border-indigo-400',
    bgSoft: 'bg-indigo-50/40',
    badgeText: 'text-indigo-700',
  };

  const handleCardClick = () => {
    gameAudio.playTap();
    navigate(`/law/${law.id}`);
  };

  return (
    <article
      onClick={handleCardClick}
      className={`group art-museum-mat rounded-2xl p-6 sm:p-7 cursor-pointer relative overflow-hidden transition-all duration-300 ${palette.border}`}
    >
      {/* Top Chromatic Accent Ribbon */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px] opacity-80 group-hover:opacity-100 transition-opacity"
        style={{
          background: `linear-gradient(90deg, ${palette.color} 0%, transparent 80%)`,
        }}
      />

      {/* Top Editorial Rubric & Museum Catalog Code */}
      <div className="flex items-center justify-between gap-3 mb-3.5 pb-3 border-b border-stone-200/60">
        <div className="flex items-center gap-2 text-xs text-stone-600 flex-wrap">
          {law.codeId && (
            <span
              className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-stone-100 border border-stone-200/80 text-stone-900 tracking-wider shadow-2xs"
            >
              {law.codeId}
            </span>
          )}
          <span className="text-stone-300" aria-hidden="true">/</span>
          <span
            className="font-bold text-xs flex items-center gap-1.5"
            style={{ color: palette.color }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full inline-block"
              style={{ backgroundColor: palette.color }}
            />
            {law.categoryZh}展厅
          </span>
          <span className="text-stone-300" aria-hidden="true">·</span>
          <span className="text-[11px] text-stone-500 font-medium">{law.difficulty}</span>

          {law.xpReward && (
            <>
              <span className="text-stone-300" aria-hidden="true">·</span>
              <span className="font-numeric font-bold text-amber-700 text-[11px] flex items-center gap-0.5">
                <Sparkles className="w-3 h-3 text-amber-500 fill-amber-400" />
                +{law.xpReward} XP
              </span>
            </>
          )}

          {isMastered && (
            <>
              <span className="text-stone-300" aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 fill-emerald-600 text-white" />
                <span>已内化</span>
              </span>
            </>
          )}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            gameAudio.playTap();
            toggleBookmark(law.id);
          }}
          className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition-colors btn-tactile -mr-1"
          aria-label="收藏定律"
          title={bookmarked ? "已收藏至心智藏品" : "收藏本定律"}
        >
          <Bookmark
            className={`w-4 h-4 transition-transform duration-150 ${
              bookmarked ? 'fill-amber-500 text-amber-500 scale-110' : 'stroke-[1.6px]'
            }`}
          />
        </button>
      </div>

      {/* Main Headline & Subtitle */}
      <div className="mb-3.5">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-serif-editorial text-lg sm:text-xl font-bold text-stone-900 group-hover:text-stone-950 transition-colors leading-snug tracking-tight">
            {law.nameZh}
          </h3>
          {law.chapter && (
            <span className="text-[11px] font-medium text-stone-500 shrink-0 font-serif-editorial italic">
              {law.chapter}
            </span>
          )}
        </div>
        <p className="text-xs text-stone-500 font-serif-editorial italic tracking-wide mt-1">
          {law.nameEn}
        </p>
      </div>

      {/* Literary Definition / Pull Quote */}
      <div className={`mb-4.5 rounded-xl p-4 border border-stone-200/70 transition-colors ${palette.bgSoft}`}>
        <p className="text-xs sm:text-[13px] text-stone-700 leading-relaxed font-normal line-clamp-2">
          “{law.shortExplanation}”
        </p>
      </div>

      {/* Footer: Mastery Progress & Subtle Disclosure */}
      <div className="flex items-center justify-between pt-3 border-t border-stone-200/60 text-xs">
        <div className="flex items-center gap-3 flex-1 mr-4">
          <span className="text-[11px] text-stone-500 font-medium">心智内化</span>
          <div className="w-24 sm:w-32 h-1.5 bg-stone-100 border border-stone-200/60 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${mastery}%`,
                background: `linear-gradient(90deg, ${palette.color} 0%, #10B981 100%)`,
              }}
            />
          </div>
          <span className="font-numeric text-[11px] font-bold text-stone-700">{mastery}%</span>
        </div>

        <div className="flex items-center gap-1 text-xs font-bold text-stone-900 group-hover:translate-x-0.5 transition-transform shrink-0">
          <span className="font-serif-editorial">进入典藏解析</span>
          <ChevronRight className="w-3.5 h-3.5 text-stone-500 group-hover:text-stone-900" />
        </div>
      </div>
    </article>
  );
};

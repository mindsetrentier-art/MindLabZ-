import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, ChevronRight, CheckCircle2 } from 'lucide-react';
import { PsychologyLaw } from '../../types';
import { useApp } from '../../context/AppContext';

interface PsychologyLawCardProps {
  law: PsychologyLaw;
}

export const PsychologyLawCard: React.FC<PsychologyLawCardProps> = ({ law }) => {
  const navigate = useNavigate();
  const { isBookmarked, toggleBookmark, user } = useApp();

  const bookmarked = isBookmarked(law.id);
  const mastery = user.lawMasteryMap[law.id] || 0;
  const isMastered = mastery >= 80;

  return (
    <article
      onClick={() => navigate(`/law/${law.id}`)}
      className="group editorial-card editorial-card-hover rounded-2xl p-6 sm:p-7 cursor-pointer relative"
    >
      {/* Top Editorial Rubric / Unboxed Metadata */}
      <div className="flex items-center justify-between gap-3 mb-3 pb-3 border-b border-stone-200/60">
        <div className="flex items-center gap-2 text-xs text-stone-600 flex-wrap">
          {law.codeId && (
            <span className="font-mono text-[11px] font-semibold text-stone-900 tracking-wider">
              {law.codeId}
            </span>
          )}
          <span className="text-stone-300" aria-hidden="true">/</span>
          <span className="font-medium text-stone-900">
            {law.categoryZh}定律
          </span>
          <span className="text-stone-300" aria-hidden="true">·</span>
          <span>{law.difficulty}</span>
          {law.xpReward && (
            <>
              <span className="text-stone-300" aria-hidden="true">·</span>
              <span className="font-numeric font-medium text-amber-700">+{law.xpReward} XP</span>
            </>
          )}
          {isMastered && (
            <>
              <span className="text-stone-300" aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5 fill-emerald-600 text-white" />
                <span>已内化</span>
              </span>
            </>
          )}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleBookmark(law.id);
          }}
          className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition-colors btn-tactile -mr-1"
          aria-label="收藏定律"
          title="收藏本定律"
        >
          <Bookmark
            className={`w-4 h-4 ${bookmarked ? 'fill-stone-900 text-stone-900' : 'stroke-[1.6px]'}`}
          />
        </button>
      </div>

      {/* Main Headline & Subtitle */}
      <div className="mb-4">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-serif-editorial text-lg sm:text-xl font-bold text-stone-900 group-hover:text-[#532CD8] transition-colors leading-snug tracking-tight">
            {law.nameZh}
          </h3>
          {law.chapter && (
            <span className="text-[11px] font-medium text-stone-600 shrink-0 font-serif-editorial italic">
              {law.chapter}
            </span>
          )}
        </div>
        <p className="text-xs text-stone-600 font-serif-editorial italic tracking-wide mt-1">
          {law.nameEn}
        </p>
      </div>

      {/* Literary Definition / Pull Quote */}
      <div className="mb-5 bg-[#FAF8F5]/80 rounded-xl p-4 border border-stone-200/50">
        <p className="text-xs sm:text-[13px] text-stone-700 leading-relaxed font-normal line-clamp-2">
          “{law.shortExplanation}”
        </p>
      </div>

      {/* Footer: Mastery Progress & Subtle Disclosure */}
      <div className="flex items-center justify-between pt-3 border-t border-stone-200/60 text-xs">
        <div className="flex items-center gap-3 flex-1 mr-4">
          <span className="text-[11px] text-stone-600 font-medium">心智内化</span>
          <div className="w-24 sm:w-32 h-1 bg-stone-200 rounded-full overflow-hidden">
            <div
              className="h-full chameleon-bar rounded-full"
              style={{ width: `${mastery}%` }}
            />
          </div>
          <span className="font-numeric text-[11px] font-semibold text-stone-700">{mastery}%</span>
        </div>

        <div className="flex items-center gap-1 text-xs font-semibold text-stone-900 group-hover:text-[#532CD8] transition-colors shrink-0">
          <span>阅读解析</span>
          <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </article>
  );
};

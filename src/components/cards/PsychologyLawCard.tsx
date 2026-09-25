import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, ChevronRight, Sparkles, Brain, CheckCircle2 } from 'lucide-react';
import { PsychologyLaw } from '../../types';
import { useApp } from '../../context/AppContext';

interface PsychologyLawCardProps {
  law: PsychologyLaw;
}

const CATEGORY_THEMES: Record<string, { accent: string; text: string; bar: string; tint: string }> = {
  '记忆': { accent: '#6C4CF1', text: 'text-[#6C4CF1]', bar: 'bg-[#6C4CF1]', tint: 'from-[#6C4CF1]/8 to-transparent' },
  '认知': { accent: '#2563EB', text: 'text-[#2563EB]', bar: 'bg-[#2563EB]', tint: 'from-[#2563EB]/8 to-transparent' },
  '决策': { accent: '#D97706', text: 'text-[#D97706]', bar: 'bg-[#D97706]', tint: 'from-[#D97706]/8 to-transparent' },
  '社会': { accent: '#059669', text: 'text-[#059669]', bar: 'bg-[#059669]', tint: 'from-[#059669]/8 to-transparent' },
  '情绪': { accent: '#DB2777', text: 'text-[#DB2777]', bar: 'bg-[#DB2777]', tint: 'from-[#DB2777]/8 to-transparent' },
  '行为': { accent: '#7C3AED', text: 'text-[#7C3AED]', bar: 'bg-[#7C3AED]', tint: 'from-[#7C3AED]/8 to-transparent' },
};

export const PsychologyLawCard: React.FC<PsychologyLawCardProps> = ({ law }) => {
  const navigate = useNavigate();
  const { isBookmarked, toggleBookmark, user } = useApp();

  const bookmarked = isBookmarked(law.id);
  const mastery = user.lawMasteryMap[law.id] || 0;
  const isMastered = mastery >= 80;
  const theme = CATEGORY_THEMES[law.categoryZh] || CATEGORY_THEMES['认知'];

  return (
    <div
      onClick={() => navigate(`/law/${law.id}`)}
      className="group art-card art-card-hover rounded-3xl p-5 cursor-pointer overflow-hidden"
    >
      {/* Subtle top-left category wash */}
      <div className={`absolute top-0 left-0 w-48 h-28 bg-gradient-to-br ${theme.tint} pointer-events-none`} />

      {/* Left vertical artistic accent indicator */}
      <div className={`absolute left-0 top-6 bottom-6 w-1 rounded-r-full ${theme.bar} opacity-75 group-hover:opacity-100 transition-opacity`} />

      {/* Top row: Unboxed Editorial Metadata & Bookmark Action */}
      <div className="flex items-center justify-between mb-2.5 relative z-10">
        <div className="flex items-center gap-2 text-xs flex-wrap">
          {law.codeId && (
            <>
              <span className="font-extrabold font-numeric text-[11px] px-2 py-0.5 rounded-md bg-[#F5F3FF] text-[#532CD8] border border-[#DDD6FE]">
                {law.codeId}
              </span>
              <span className="text-[#CBD5E1]" aria-hidden="true">·</span>
            </>
          )}
          <span className={`font-bold tracking-wide ${theme.text}`}>
            {law.categoryZh}定律
          </span>
          <span className="text-[#CBD5E1]" aria-hidden="true">·</span>
          <span className="text-[#64748B] font-medium">
            {law.difficulty}
          </span>
          {law.xpReward && (
            <>
              <span className="text-[#CBD5E1]" aria-hidden="true">·</span>
              <span className="text-[#D97706] font-bold font-numeric">+{law.xpReward} XP</span>
            </>
          )}
          {isMastered && (
            <>
              <span className="text-[#CBD5E1]" aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1 font-bold text-[#059669]">
                <CheckCircle2 className="w-3.5 h-3.5 fill-[#10B981] text-white" />
                <span>已掌握</span>
              </span>
            </>
          )}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleBookmark(law.id);
          }}
          className="w-9 h-9 -mr-1 -mt-1 rounded-2xl flex items-center justify-center hover:bg-[#F5F3FF] text-[#64748B] hover:text-[#6C4CF1] transition-colors btn-tactile"
          aria-label="收藏定律"
        >
          <Bookmark
            className={`w-4 h-4 ${bookmarked ? 'fill-[#6C4CF1] text-[#6C4CF1]' : 'stroke-[1.8px]'}`}
          />
        </button>
      </div>

      {/* Main Titles with Editorial Serif Pairing */}
      <div className="mb-3 relative z-10">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-[17px] font-extrabold text-[#18181B] group-hover:text-[#6C4CF1] transition-colors leading-snug tracking-tight">
            {law.nameZh}
          </h3>
          {law.chapter && (
            <span className="text-[10px] font-semibold text-[#64748B] shrink-0">
              {law.chapter}
            </span>
          )}
        </div>
        <p className="text-xs text-[#64748B] font-serif-editorial italic tracking-wide mt-0.5">
          {law.nameEn}
        </p>
      </div>

      {/* Editorial Quote Block */}
      <div className="relative z-10 pl-3.5 py-2 mb-4 border-l-2 border-[#DDD6FE] bg-[#FAF9FF]/80 rounded-r-xl pr-3">
        <p className="text-xs text-[#334155] leading-relaxed line-clamp-2 font-medium">
          “{law.shortExplanation}”
        </p>
      </div>

      {/* Footer: Mastery Bar & Disclosure */}
      <div className="flex items-center justify-between pt-3 border-t border-[#F1EFFA] relative z-10">
        <div className="flex-1 mr-5">
          <div className="flex justify-between items-center text-[11px] mb-1.5">
            <span className="text-[#64748B] font-medium">认知内化度</span>
            <span className="font-extrabold chameleon-text font-numeric">{mastery}%</span>
          </div>
          <div className="w-full h-1.5 bg-[#EDE9FE] rounded-full overflow-hidden">
            <div
              className="h-full chameleon-bar rounded-full"
              style={{ width: `${mastery}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs font-bold chameleon-text group-hover:translate-x-0.5 transition-transform shrink-0">
          <span>研习</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};

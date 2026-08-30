import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, ChevronRight, Sparkles, Brain, CheckCircle2 } from 'lucide-react';
import { PsychologyLaw } from '../../types';
import { useApp } from '../../context/AppContext';

interface PsychologyLawCardProps {
  law: PsychologyLaw;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  '记忆': { bg: 'bg-[#EDE9FE]', text: 'text-[#6C4CF1]', border: 'border-[#DDD6FE]' },
  '认知': { bg: 'bg-[#EFF6FF]', text: 'text-[#2563EB]', border: 'border-[#DBEAFE]' },
  '决策': { bg: 'bg-[#FEF3C7]', text: 'text-[#D97706]', border: 'border-[#FDE68A]' },
  '社会': { bg: 'bg-[#ECFDF5]', text: 'text-[#059669]', border: 'border-[#A7F3D0]' },
  '情绪': { bg: 'bg-[#FDF2F8]', text: 'text-[#DB2777]', border: 'border-[#FBCFE8]' },
  '行为': { bg: 'bg-[#F5F3FF]', text: 'text-[#7C3AED]', border: 'border-[#DDD6FE]' },
};

export const PsychologyLawCard: React.FC<PsychologyLawCardProps> = ({ law }) => {
  const navigate = useNavigate();
  const { isBookmarked, toggleBookmark, user } = useApp();

  const bookmarked = isBookmarked(law.id);
  const mastery = user.lawMasteryMap[law.id] || 0;
  const isMastered = mastery >= 80;
  const colors = CATEGORY_COLORS[law.categoryZh] || CATEGORY_COLORS['认知'];

  return (
    <div
      onClick={() => navigate(`/law/${law.id}`)}
      className="group relative bg-white rounded-3xl p-5 border border-[#E6E2F5] shadow-[0_4px_20px_-2px_rgba(108,76,241,0.05)] hover:shadow-[0_12px_32px_-4px_rgba(108,76,241,0.12)] hover:border-[#6C4CF1]/30 hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden"
    >
      {/* Top row: Category Badge & Bookmark */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${colors.bg} ${colors.text} ${colors.border}`}>
            {law.categoryZh}
          </span>
          <span className="text-[11px] text-[#64748B] font-['Inter'] font-semibold">
            {law.difficulty}
          </span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleBookmark(law.id);
          }}
          className="w-8 h-8 rounded-2xl flex items-center justify-center hover:bg-[#F5F3FF] text-[#64748B] hover:text-[#6C4CF1] transition-colors btn-press"
          aria-label="Bookmark"
        >
          <Bookmark
            className={`w-4 h-4 ${bookmarked ? 'fill-[#6C4CF1] text-[#6C4CF1]' : 'stroke-[1.8px]'}`}
          />
        </button>
      </div>

      {/* Main Titles */}
      <div className="mb-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-[#18181B] group-hover:text-[#6C4CF1] transition-colors leading-snug">
            {law.nameZh}
          </h3>
          {isMastered && (
            <div className="flex items-center gap-1 text-[11px] font-bold text-[#10B981]">
              <CheckCircle2 className="w-3.5 h-3.5 fill-[#10B981] text-white" />
              <span>已掌握</span>
            </div>
          )}
        </div>
        <p className="text-xs text-[#64748B] font-['Inter'] font-medium mt-0.5">
          {law.nameEn}
        </p>
      </div>

      {/* Short Explanation */}
      <p className="text-xs text-[#475569] leading-relaxed line-clamp-2 mb-4">
        {law.shortExplanation}
      </p>

      {/* Footer: Mastery Bar & Arrow */}
      <div className="flex items-center justify-between pt-3 border-t border-[#F5F3FF]">
        <div className="flex-1 mr-4">
          <div className="flex justify-between items-center text-[10px] mb-1.5">
            <span className="text-[#64748B] font-medium">掌握进度</span>
            <span className="font-bold text-[#6C4CF1] font-['Inter']">{mastery}%</span>
          </div>
          <div className="w-full h-1.5 bg-[#EDE9FE] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#6C4CF1] to-[#532CD8] rounded-full transition-all duration-500"
              style={{ width: `${mastery}%` }}
            />
          </div>
        </div>

        <div className="w-7 h-7 rounded-2xl bg-[#F5F3FF] group-hover:bg-[#6C4CF1] text-[#6C4CF1] group-hover:text-white flex items-center justify-center transition-all shrink-0 shadow-xs">
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};

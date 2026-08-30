import React, { useState, useMemo, useEffect } from 'react';
import { Search, Bookmark, Filter, Sparkles, BookOpen, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PsychologyLawCard } from '../components/cards/PsychologyLawCard';
import { LawCardSkeleton } from '../components/ui/Skeleton';
import { CategoryZh } from '../types';

const CATEGORIES: Array<{ key: 'all' | CategoryZh; label: string }> = [
  { key: 'all', label: '全部' },
  { key: '认知', label: '认知' },
  { key: '记忆', label: '记忆' },
  { key: '决策', label: '决策' },
  { key: '社会', label: '社会' },
  { key: '情绪', label: '情绪' },
  { key: '行为', label: '行为' },
];

export const LearnPage: React.FC = () => {
  const { laws, user } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | CategoryZh>('all');
  const [onlyBookmarked, setOnlyBookmarked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Smooth skeleton transition on category change
  const handleCategoryChange = (catKey: 'all' | CategoryZh) => {
    if (selectedCategory === catKey) return;
    setIsLoading(true);
    setSelectedCategory(catKey);
    setTimeout(() => {
      setIsLoading(false);
    }, 240);
  };

  const filteredLaws = useMemo(() => {
    return laws.filter(law => {
      // Search filter
      const matchesSearch =
        law.nameZh.toLowerCase().includes(searchQuery.toLowerCase()) ||
        law.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        law.shortExplanation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        law.detailedExplanation.toLowerCase().includes(searchQuery.toLowerCase());

      // Category filter
      const matchesCategory = selectedCategory === 'all' || law.categoryZh === selectedCategory;

      // Bookmark filter
      const matchesBookmark = !onlyBookmarked || user.bookmarks.includes(law.id);

      return matchesSearch && matchesCategory && matchesBookmark;
    });
  }, [laws, searchQuery, selectedCategory, onlyBookmarked, user.bookmarks]);

  return (
    <div className="space-y-5 pb-6 animate-fadeIn">
      {/* Top Banner Stats */}
      <div className="bg-gradient-to-r from-[#6C4CF1] to-[#532CD8] text-white rounded-3xl p-5 shadow-[0_8px_25px_rgba(108,76,241,0.25)] flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
            🧠 现代心理学与认知科学库
          </span>
          <h2 className="text-lg font-extrabold mt-1.5 tracking-tight">系统破解大脑思维捷径</h2>
          <p className="text-xs text-white/85 mt-0.5">
            共收录 <strong>{laws.length}</strong> 项定律 · 已掌握 <strong className="text-[#FDE68A]">{user.lawsMastered.length}</strong> 项
          </p>
        </div>

        <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white shrink-0 shadow-inner">
          <BookOpen className="w-6 h-6" />
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-3">
        {/* Search Input Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索心理学定律、效应、生活场景..."
            className="w-full pl-10 pr-10 py-3 bg-white rounded-2xl border border-[#E6E2F5] text-xs font-medium text-[#18181B] placeholder-[#94A3B8] focus:outline-none focus:border-[#6C4CF1] focus:ring-2 focus:ring-[#6C4CF1]/15 shadow-xs transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#94A3B8] hover:text-[#18181B]"
            >
              ✕
            </button>
          )}
        </div>

        {/* Category Pills & Bookmarks Toggle */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => handleCategoryChange(cat.key)}
              className={`text-xs font-bold px-3.5 py-1.5 rounded-full transition-all shrink-0 border btn-press ${
                selectedCategory === cat.key
                  ? 'bg-[#6C4CF1] text-white border-[#6C4CF1] shadow-xs'
                  : 'bg-white text-[#64748B] border-[#E6E2F5] hover:bg-[#F5F3FF]'
              }`}
            >
              {cat.label}
            </button>
          ))}

          {/* Bookmarks Filter Button */}
          <button
            onClick={() => {
              setIsLoading(true);
              setOnlyBookmarked(prev => !prev);
              setTimeout(() => setIsLoading(false), 200);
            }}
            className={`text-xs font-bold px-3.5 py-1.5 rounded-full transition-all shrink-0 border flex items-center gap-1 btn-press ${
              onlyBookmarked
                ? 'bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]'
                : 'bg-white text-[#64748B] border-[#E6E2F5] hover:bg-[#F5F3FF]'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${onlyBookmarked ? 'fill-[#D97706]' : ''}`} />
            <span>已收藏 ({user.bookmarks.length})</span>
          </button>
        </div>
      </div>

      {/* Laws List */}
      <div className="space-y-3.5">
        {isLoading ? (
          <>
            <LawCardSkeleton />
            <LawCardSkeleton />
            <LawCardSkeleton />
          </>
        ) : filteredLaws.length > 0 ? (
          filteredLaws.map((law) => (
            <PsychologyLawCard key={law.id} law={law} />
          ))
        ) : (
          <div className="bg-white rounded-3xl p-10 text-center border border-[#E6E2F5] space-y-2 shadow-xs">
            <p className="text-sm font-bold text-[#18181B]">未找到匹配的心理学定律</p>
            <p className="text-xs text-[#64748B]">尝试更换搜索词或清除筛选条件</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setOnlyBookmarked(false);
              }}
              className="mt-2 px-4 py-2 rounded-2xl bg-[#EDE9FE] text-[#6C4CF1] text-xs font-bold hover:bg-[#DDD6FE] transition-colors btn-press"
            >
              重置所有筛选
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

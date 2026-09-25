import React, { useState, useMemo } from 'react';
import { Search, Bookmark, BookOpen, Layers } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PsychologyLawCard } from '../components/cards/PsychologyLawCard';
import { LawCardSkeleton } from '../components/ui/Skeleton';
import { CategoryZh } from '../types';
import { MINDLABZ_CHAPTERS } from '../data/laws';

const CATEGORIES: Array<{ key: 'all' | CategoryZh; label: string }> = [
  { key: 'all', label: '全部领域' },
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
  const [selectedChapter, setSelectedChapter] = useState<string>('all');
  const [onlyBookmarked, setOnlyBookmarked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleCategoryChange = (catKey: 'all' | CategoryZh) => {
    if (selectedCategory === catKey) return;
    setIsLoading(true);
    setSelectedCategory(catKey);
    setTimeout(() => {
      setIsLoading(false);
    }, 180);
  };

  const handleChapterChange = (chapter: string) => {
    if (selectedChapter === chapter) return;
    setIsLoading(true);
    setSelectedChapter(chapter);
    setTimeout(() => {
      setIsLoading(false);
    }, 180);
  };

  const filteredLaws = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return laws.filter((law) => {
      const matchesSearch =
        !q ||
        (law.codeId && law.codeId.toLowerCase().includes(q)) ||
        law.nameZh.toLowerCase().includes(q) ||
        law.nameEn.toLowerCase().includes(q) ||
        law.shortExplanation.toLowerCase().includes(q) ||
        law.detailedExplanation.toLowerCase().includes(q) ||
        (law.chapter && law.chapter.toLowerCase().includes(q));

      const matchesCategory = selectedCategory === 'all' || law.categoryZh === selectedCategory;
      const matchesChapter = selectedChapter === 'all' || law.chapter === selectedChapter;
      const matchesBookmark = !onlyBookmarked || user.bookmarks.includes(law.id);

      return matchesSearch && matchesCategory && matchesChapter && matchesBookmark;
    });
  }, [laws, searchQuery, selectedCategory, selectedChapter, onlyBookmarked, user.bookmarks]);

  return (
    <div className="space-y-5 pb-6 animate-fadeIn">
      {/* Top Artistic Banner */}
      <div className="relative art-dark-banner text-white rounded-3xl p-6 overflow-hidden flex items-center justify-between">
        <svg
          className="absolute -right-8 -bottom-10 w-40 h-40 opacity-15 pointer-events-none"
          viewBox="0 0 120 120"
          fill="none"
        >
          <circle cx="60" cy="60" r="50" stroke="white" strokeWidth="1.5" strokeDasharray="3 3" />
          <circle cx="60" cy="60" r="32" stroke="white" strokeWidth="1.5" />
        </svg>

        <div className="relative z-10">
          <div className="flex items-center gap-2 text-xs text-[#FDE68A] font-semibold">
            <span>MindLabZ 心理学知识引擎</span>
            <span className="opacity-50">·</span>
            <span className="font-serif-editorial italic">LAW001 – LAW100</span>
          </div>
          <h2 className="text-xl font-extrabold mt-1 tracking-tight">100 心理定律全景知识库</h2>
          <p className="text-xs text-white/85 mt-1 font-numeric">
            收录 <strong>{laws.length}</strong> 条定律 · <strong>10</strong> 大章节 · <strong>300</strong> 测验 · 已掌握 <strong className="text-[#FDE68A]">{user.lawsMastered.length}</strong> 条
          </p>
        </div>

        <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center text-white shrink-0 shadow-inner relative z-10">
          <BookOpen className="w-6 h-6" />
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-2.5">
        {/* Search Input Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#64748B] absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索编号(如 LAW001、LAW039)、中英文定律名、场景..."
            className="w-full pl-11 pr-10 py-3.5 art-card rounded-2xl text-xs font-medium text-[#18181B] placeholder-[#94A3B8] focus:outline-none focus:border-[#6C4CF1] focus:ring-2 focus:ring-[#6C4CF1]/15 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-[#94A3B8] hover:text-[#18181B]"
            >
              ✕
            </button>
          )}
        </div>

        {/* Interactive Category Filter Controls */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => handleCategoryChange(cat.key)}
              className={`text-xs font-bold px-3.5 py-2 rounded-xl transition-all shrink-0 border btn-tactile whitespace-nowrap ${
                selectedCategory === cat.key
                  ? 'bg-[#532CD8] text-white border-[#532CD8] shadow-[0_4px_12px_rgba(83,44,216,0.25)]'
                  : 'bg-white text-[#64748B] border-[#E6E2F5] hover:bg-[#F5F3FF] hover:text-[#18181B]'
              }`}
            >
              {cat.label}
            </button>
          ))}

          {/* Bookmarks Filter Button */}
          <button
            onClick={() => {
              setIsLoading(true);
              setOnlyBookmarked((prev) => !prev);
              setTimeout(() => setIsLoading(false), 180);
            }}
            className={`text-xs font-bold px-3.5 py-2 rounded-xl transition-all shrink-0 border flex items-center gap-1.5 btn-tactile whitespace-nowrap ${
              onlyBookmarked
                ? 'bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]'
                : 'bg-white text-[#64748B] border-[#E6E2F5] hover:bg-[#F5F3FF]'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${onlyBookmarked ? 'fill-[#D97706]' : ''}`} />
            <span className="font-numeric">已收藏 ({user.bookmarks.length})</span>
          </button>
        </div>

        {/* 10 Chapters Filter Row */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => handleChapterChange('all')}
            className={`text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all shrink-0 border flex items-center gap-1 btn-tactile whitespace-nowrap ${
              selectedChapter === 'all'
                ? 'bg-[#EDE9FE] text-[#532CD8] border-[#C4B5FD]'
                : 'bg-white/80 text-[#64748B] border-[#E6E2F5] hover:bg-[#FAF9FF]'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>全部10大章节 ({laws.length})</span>
          </button>
          {MINDLABZ_CHAPTERS.map((chap) => (
            <button
              key={chap}
              onClick={() => handleChapterChange(chap)}
              className={`text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all shrink-0 border btn-tactile whitespace-nowrap ${
                selectedChapter === chap
                  ? 'bg-[#EDE9FE] text-[#532CD8] border-[#C4B5FD]'
                  : 'bg-white/80 text-[#64748B] border-[#E6E2F5] hover:bg-[#FAF9FF]'
              }`}
            >
              {chap}
            </button>
          ))}
        </div>
      </div>

      {/* Filtered count indicator */}
      <div className="flex items-center justify-between px-1 text-[11px] text-[#64748B] font-medium">
        <span>
          当前展示 <strong className="text-[#532CD8] font-numeric">{filteredLaws.length}</strong> 条心理学定律
        </span>
        {(selectedCategory !== 'all' || selectedChapter !== 'all' || onlyBookmarked || searchQuery) && (
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setSelectedChapter('all');
              setOnlyBookmarked(false);
            }}
            className="text-[#6C4CF1] font-bold hover:underline"
          >
            清除筛选
          </button>
        )}
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
            <p className="text-xs text-[#64748B]">尝试搜索 LAW001 ~ LAW100 或更换章节筛选条件</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedChapter('all');
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

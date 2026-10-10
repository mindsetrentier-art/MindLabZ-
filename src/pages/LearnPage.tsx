import React, { useState, useMemo } from 'react';
import { Search, Bookmark, BookOpen, Layers } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PsychologyLawCard } from '../components/cards/PsychologyLawCard';
import { LawCardSkeleton } from '../components/ui/Skeleton';
import { VoiceTranscribeButton } from '../components/ui/VoiceTranscribeButton';
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
    <div className="space-y-8 sm:space-y-10 pb-8 animate-fadeIn">
      {/* Top Editorial Catalogue Masthead */}
      <section className="editorial-card rounded-2xl p-7 sm:p-9 md:p-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-stone-500 font-medium">
              <span className="editorial-kicker text-[10px] text-stone-700 tracking-widest">
                Catalogue Raisonné · 100 Cognitive Laws
              </span>
              <span className="text-stone-300" aria-hidden="true">/</span>
              <span className="font-serif-editorial italic text-stone-600">LAW001 – LAW100</span>
            </div>
            <h2 className="font-serif-editorial text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight leading-tight">
              100 心理学与思维定律全景知识库
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 font-normal leading-relaxed max-w-2xl">
              汇聚百条实证认知科学规律与行为心理学模型，涵盖记忆、决策启发式、社会认知与情绪动力机制。
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs text-stone-500 font-numeric shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-stone-200">
            <div>
              <span className="text-[10px] text-stone-600 block">收录定律</span>
              <span className="text-base font-bold text-stone-900 font-serif-editorial">{laws.length}</span>
            </div>
            <span className="text-stone-300">/</span>
            <div>
              <span className="text-[10px] text-stone-600 block">核心章节</span>
              <span className="text-base font-bold text-stone-900 font-serif-editorial">10</span>
            </div>
            <span className="text-stone-300">/</span>
            <div>
              <span className="text-[10px] text-stone-600 block">已内化掌握</span>
              <span className="text-base font-bold text-emerald-700 font-serif-editorial">{user.lawsMastered.length}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Search and Filters Section */}
      <section className="space-y-4">
        {/* Search Input Bar with Voice Transcription (gemini-3.5-transcribe) */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索编号 (如 LAW001)、中英文定律名或点击右侧麦克风语音搜索..."
              className="w-full pl-11 pr-10 py-3.5 bg-white border border-stone-200 rounded-xl text-xs sm:text-sm font-medium text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-700"
              >
                ✕
              </button>
            )}
          </div>
          <VoiceTranscribeButton
            onTranscript={(text) => setSearchQuery(text)}
            className="h-11 px-4 bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 rounded-xl"
          />
        </div>

        {/* Category Filter Controls */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => handleCategoryChange(cat.key)}
              className={`text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors shrink-0 whitespace-nowrap cursor-pointer ${
                selectedCategory === cat.key
                  ? 'bg-stone-900 text-white'
                  : 'bg-white text-stone-600 border border-stone-200 hover:border-stone-400'
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
            className={`text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors shrink-0 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              onlyBookmarked
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : 'bg-white text-stone-600 border border-stone-200 hover:border-stone-400'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${onlyBookmarked ? 'fill-amber-700' : ''}`} />
            <span className="font-numeric">收藏 ({user.bookmarks.length})</span>
          </button>
        </div>

        {/* 10 Chapters Filter Row */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
          <button
            onClick={() => handleChapterChange('all')}
            className={`text-[11px] font-medium px-3 py-1.5 rounded-lg transition-colors shrink-0 flex items-center gap-1 cursor-pointer ${
              selectedChapter === 'all'
                ? 'bg-stone-200 text-stone-900 font-bold'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200/70'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>全部章节 ({laws.length})</span>
          </button>
          {MINDLABZ_CHAPTERS.map((chap) => (
            <button
              key={chap}
              onClick={() => handleChapterChange(chap)}
              className={`text-[11px] font-medium px-3 py-1.5 rounded-lg transition-colors shrink-0 cursor-pointer ${
                selectedChapter === chap
                  ? 'bg-stone-200 text-stone-900 font-bold'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200/70'
              }`}
            >
              {chap}
            </button>
          ))}
        </div>
      </section>

      {/* Filtered Count Indicator */}
      <div className="flex items-center justify-between px-1 text-xs text-stone-500 font-medium">
        <span>
          检索结果 · <strong className="text-stone-900 font-numeric">{filteredLaws.length}</strong> 条定律
        </span>
        {(selectedCategory !== 'all' || selectedChapter !== 'all' || onlyBookmarked || searchQuery) && (
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setSelectedChapter('all');
              setOnlyBookmarked(false);
            }}
            className="text-stone-800 font-semibold hover:underline cursor-pointer"
          >
            重置筛选
          </button>
        )}
      </div>

      {/* Laws List (2-Column Editorial Grid on Tablets & Desktops) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
        {isLoading ? (
          <>
            <LawCardSkeleton />
            <LawCardSkeleton />
            <LawCardSkeleton />
            <LawCardSkeleton />
          </>
        ) : filteredLaws.length > 0 ? (
          filteredLaws.map((law) => (
            <PsychologyLawCard key={law.id} law={law} />
          ))
        ) : (
          <div className="col-span-full bg-white rounded-2xl p-12 text-center border border-stone-200 space-y-3">
            <h3 className="font-serif-editorial text-base font-bold text-stone-900">未检索到匹配的定律</h3>
            <p className="text-xs text-stone-500">
              请尝试更换中英文关键词、定律编号（如 LAW001）或清除筛选分类。
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedChapter('all');
                setOnlyBookmarked(false);
              }}
              className="px-4 py-2 bg-stone-900 text-white text-xs font-semibold rounded-xl hover:bg-stone-800 transition-colors cursor-pointer"
            >
              显示全部 100 定律
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

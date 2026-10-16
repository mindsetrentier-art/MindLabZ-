import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search,
  Bookmark,
  Sparkles,
  Compass,
  Flame,
  ArrowRight,
  Zap,
  CheckCircle2,
  SlidersHorizontal,
  Grid3X3,
  List,
  RotateCcw,
  Palette,
  Volume2,
  ChevronRight,
  X,
  Shuffle,
  Award,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PsychologyLawCard } from '../components/cards/PsychologyLawCard';
import { LawCardSkeleton } from '../components/ui/Skeleton';
import { VoiceTranscribeButton } from '../components/ui/VoiceTranscribeButton';
import { CategoryZh, PsychologyLaw } from '../types';
import { MINDLABZ_CHAPTERS } from '../data/laws';
import { gameAudio } from '../utils/gameAudio';

interface CategoryOption {
  key: 'all' | CategoryZh;
  label: string;
  salonTitle: string;
  en: string;
  color: string;
  gradient: string;
  borderActive: string;
  bgSoft: string;
}

const CATEGORIES: CategoryOption[] = [
  {
    key: 'all',
    label: '全部展厅',
    salonTitle: '全景大成馆',
    en: 'All Salons',
    color: '#1C1917',
    gradient: 'from-stone-900 via-stone-800 to-stone-950',
    borderActive: 'border-stone-900',
    bgSoft: 'bg-stone-100',
  },
  {
    key: '认知',
    label: '认知科学',
    salonTitle: '认知与理性厅',
    en: 'Cognition',
    color: '#4F46E5',
    gradient: 'from-indigo-600 via-indigo-700 to-indigo-900',
    borderActive: 'border-indigo-500',
    bgSoft: 'bg-indigo-50/70',
  },
  {
    key: '记忆',
    label: '记忆遗忘',
    salonTitle: '记忆宫殿厅',
    en: 'Memory',
    color: '#0891B2',
    gradient: 'from-cyan-600 via-teal-700 to-cyan-900',
    borderActive: 'border-cyan-500',
    bgSoft: 'bg-cyan-50/70',
  },
  {
    key: '决策',
    label: '决策博弈',
    salonTitle: '决策与概率厅',
    en: 'Decision',
    color: '#059669',
    gradient: 'from-emerald-600 via-emerald-700 to-emerald-900',
    borderActive: 'border-emerald-500',
    bgSoft: 'bg-emerald-50/70',
  },
  {
    key: '社会',
    label: '社会动能',
    salonTitle: '社会群体厅',
    en: 'Social',
    color: '#7C3AED',
    gradient: 'from-purple-600 via-purple-700 to-purple-900',
    borderActive: 'border-purple-500',
    bgSoft: 'bg-purple-50/70',
  },
  {
    key: '情绪',
    label: '情绪体验',
    salonTitle: '共情与感受厅',
    en: 'Emotion',
    color: '#E11D48',
    gradient: 'from-rose-600 via-rose-700 to-rose-900',
    borderActive: 'border-rose-500',
    bgSoft: 'bg-rose-50/70',
  },
  {
    key: '行为',
    label: '行为习惯',
    salonTitle: '行为动力厅',
    en: 'Behavior',
    color: '#D97706',
    gradient: 'from-amber-600 via-amber-700 to-amber-900',
    borderActive: 'border-amber-500',
    bgSoft: 'bg-amber-50/70',
  },
];

interface PopularSearchTag {
  text: string;
  category: CategoryZh;
  color: string;
}

const POPULAR_SEARCH_TAGS: PopularSearchTag[] = [
  { text: '首因效应', category: '认知', color: '#4F46E5' },
  { text: '锚定效应', category: '决策', color: '#059669' },
  { text: '损失厌恶', category: '行为', color: '#D97706' },
  { text: '峰终定律', category: '情绪', color: '#E11D48' },
  { text: '蔡格尼克效应', category: '记忆', color: '#0891B2' },
  { text: '从众效应', category: '社会', color: '#7C3AED' },
  { text: '黑天鹅理论', category: '决策', color: '#059669' },
  { text: '旁观者效应', category: '社会', color: '#7C3AED' },
];

export const LearnPage: React.FC = () => {
  const { laws, user } = useApp();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialQuery = searchParams.get('q') || '';
  const initialCategory = (searchParams.get('category') as CategoryZh) || 'all';

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<'all' | CategoryZh>(initialCategory);
  const [selectedChapter, setSelectedChapter] = useState<string>('all');
  const [onlyBookmarked, setOnlyBookmarked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'dossier'>('grid');

  // Epiphany random generator modal
  const [epiphanyLaw, setEpiphanyLaw] = useState<PsychologyLaw | null>(null);

  // Sync state if url param changes
  useEffect(() => {
    const urlQ = searchParams.get('q');
    if (urlQ !== null && urlQ !== searchQuery) {
      setSearchQuery(urlQ);
    }
  }, [searchParams]);

  const handleCategoryChange = (catKey: 'all' | CategoryZh) => {
    if (selectedCategory === catKey) return;
    gameAudio.playTap();
    setIsLoading(true);
    setSelectedCategory(catKey);
    setTimeout(() => {
      setIsLoading(false);
    }, 140);
  };

  const handleChapterChange = (chapter: string) => {
    if (selectedChapter === chapter) return;
    gameAudio.playTap();
    setIsLoading(true);
    setSelectedChapter(chapter);
    setTimeout(() => {
      setIsLoading(false);
    }, 140);
  };

  const handleTagClick = (tag: string) => {
    gameAudio.playTap();
    setSearchQuery(tag);
  };

  // Trigger random inspiring law discovery
  const handleRandomEpiphany = () => {
    if (!laws || laws.length === 0) return;
    gameAudio.playSuccess();
    const randomIndex = Math.floor(Math.random() * laws.length);
    const chosen = laws[randomIndex];
    setEpiphanyLaw(chosen);
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

  // Current active category config
  const currentCategoryObj = CATEGORIES.find((c) => c.key === selectedCategory) || CATEGORIES[0];

  return (
    <div className="space-y-8 sm:space-y-10 pb-16 animate-fadeIn max-w-5xl mx-auto">
      {/* 1. Artistic Salon Masthead: Museum Nocturne, Renaissance Gold Foil & Harmonic Spectrum */}
      <section className="relative rounded-3xl overflow-hidden shadow-2xl art-salon-canvas text-white p-7 sm:p-10 md:p-12 transition-all">
        {/* Subtle Decorative Golden Ratio Spiral & Celestial Constellation Watermark */}
        <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
          <svg className="w-full h-full" viewBox="0 0 800 400" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="700" cy="80" r="240" stroke="#F59E0B" strokeWidth="1" strokeDasharray="4 8" />
            <circle cx="700" cy="80" r="160" stroke="#F59E0B" strokeWidth="1" />
            <circle cx="700" cy="80" r="98" stroke="#F59E0B" strokeWidth="1.5" />
            <path d="M500,280 C600,100 750,20 850,20" stroke="#818CF8" strokeWidth="1.5" strokeDasharray="3 6" />
          </svg>
        </div>

        {/* Ambient Chromatic Glow Orbs */}
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-gradient-to-br from-amber-500/20 via-purple-600/25 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-20 w-80 h-80 rounded-full bg-gradient-to-tr from-indigo-600/25 via-emerald-500/15 to-transparent blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 sm:gap-8">
          <div className="space-y-3.5 max-w-2xl">
            {/* Museum Catalog Rubric */}
            <div className="flex items-center gap-2.5 text-xs font-mono">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/15 text-amber-300 border border-amber-300/35 font-semibold tracking-wider text-[11px] shadow-xs">
                <Palette className="w-3.5 h-3.5 text-amber-400" />
                <span>SALON DE PSYCHOLOGIE · 艺术典藏</span>
              </span>
              <span className="text-stone-500" aria-hidden="true">/</span>
              <span className="text-stone-300 font-serif-editorial italic font-sans">
                LAW001 – LAW100
              </span>
            </div>

            {/* High-Contrast Literary Headline */}
            <h1 className="font-serif-editorial text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-tight text-white drop-shadow-sm">
              100 心智定律与思维美学 · 全景画廊
            </h1>

            {/* Editorial Dek */}
            <p className="text-xs sm:text-sm text-stone-300/90 font-normal leading-relaxed">
              穿行于理性与感性的艺术展厅。系统汇聚认知偏误、行为博弈、社会动能与情绪共鸣的百道实证心智规律，支持双语、编号、多维展厅及语音口述探索。
            </p>

            {/* Curatorial Index Stats */}
            <div className="pt-1.5 flex items-center gap-4 text-xs font-numeric text-stone-300 flex-wrap">
              <span className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-indigo-400 shadow-xs shadow-indigo-400/50" />
                <span>馆藏卷轴:</span>
                <strong className="text-white font-bold">{laws.length} 篇</strong>
              </span>
              <span className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-xs shadow-emerald-400/50" />
                <span>心智展厅:</span>
                <strong className="text-white font-bold">6 大领域</strong>
              </span>
              <span className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-amber-400 shadow-xs shadow-amber-400/50" />
                <span>已内化掌握:</span>
                <strong className="text-amber-300 font-bold">{user.lawsMastered.length} 项</strong>
              </span>
            </div>
          </div>

          {/* Right Action: Epiphany Random Discovery Medal */}
          <div className="shrink-0 flex flex-col sm:flex-row md:flex-col items-center gap-3">
            <button
              onClick={handleRandomEpiphany}
              className="group p-5 rounded-3xl bg-gradient-to-b from-white/15 to-white/5 backdrop-blur-md border border-amber-400/30 hover:border-amber-300 flex flex-col items-center justify-center text-center space-y-1.5 shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer w-full sm:w-auto"
              title="随机启迪：抽选一条心智艺术定律"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 via-amber-300 to-amber-500 text-stone-950 flex items-center justify-center shadow-lg shadow-amber-500/30 group-hover:rotate-12 transition-transform">
                <Shuffle className="w-6 h-6 stroke-[2.2]" />
              </div>
              <span className="text-[10px] text-amber-200 font-mono tracking-widest uppercase">
                Random Epiphany
              </span>
              <span className="font-serif-editorial font-bold text-white text-sm flex items-center gap-1">
                <span>随机启迪</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. Artistic Search & Multimodal Query Console */}
      <section className="space-y-4">
        {/* Floating Museum Glass Search Bar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center text-stone-400 group-focus-within:text-amber-600 transition-colors pointer-events-none">
              <Search className="w-5 h-5" />
            </div>

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索编号（如 LAW001）、中英文定律名、心理学关键词..."
              className="w-full pl-12 pr-11 py-4 bg-white/95 backdrop-blur-xl border-2 border-stone-200/90 hover:border-stone-300 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 rounded-2xl text-xs sm:text-sm font-medium text-stone-900 placeholder-stone-400 focus:outline-none transition-all shadow-sm"
            />

            {searchQuery && (
              <button
                onClick={() => {
                  gameAudio.playTap();
                  setSearchQuery('');
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 hover:text-stone-800 text-xs flex items-center justify-center transition-colors cursor-pointer"
                title="清空检索"
              >
                ✕
              </button>
            )}
          </div>

          {/* Voice Search Button */}
          <VoiceTranscribeButton
            onTranscript={(text) => {
              gameAudio.playSuccess();
              setSearchQuery(text);
            }}
            className="h-14 px-5 bg-white border-2 border-stone-200 hover:border-amber-400 text-stone-700 hover:text-amber-700 hover:bg-amber-50/50 rounded-2xl shadow-sm transition-all flex items-center gap-2 cursor-pointer font-bold text-xs"
          />

          {/* View Mode Toggle: Grid vs Dossier */}
          <div className="hidden sm:flex items-center p-1 bg-white border-2 border-stone-200 rounded-2xl shadow-xs h-14">
            <button
              onClick={() => {
                gameAudio.playTap();
                setViewMode('grid');
              }}
              className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-400 hover:text-stone-700'
              }`}
              title="艺术画廊展卡视图"
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                gameAudio.playTap();
                setViewMode('dossier');
              }}
              className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                viewMode === 'dossier'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-400 hover:text-stone-700'
              }`}
              title="策展卷宗速览列表"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Hot Query Swatches: Colored Chromatic Badges */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 text-xs text-stone-600">
          <span className="text-[11px] font-bold text-stone-400 shrink-0 font-serif-editorial flex items-center gap-1 mr-1">
            <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>研习焦点:</span>
          </span>
          {POPULAR_SEARCH_TAGS.map((tag) => (
            <button
              key={tag.text}
              onClick={() => handleTagClick(tag.text)}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-stone-50 border border-stone-200/90 text-stone-700 hover:text-stone-900 text-[11px] font-medium transition-all shrink-0 cursor-pointer flex items-center gap-1.5 shadow-2xs hover:shadow-xs active:scale-95"
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: tag.color }}
              />
              <span>{tag.text}</span>
            </button>
          ))}
        </div>

        {/* 3. Gemstone Category Pavilion Controls */}
        <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar pb-1">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => handleCategoryChange(cat.key)}
                className={`text-xs font-bold px-4 py-2.5 rounded-2xl transition-all shrink-0 whitespace-nowrap cursor-pointer flex items-center gap-2 active:scale-95 shadow-xs ${
                  isSelected
                    ? 'text-white shadow-md'
                    : 'bg-white text-stone-700 border border-stone-200 hover:border-stone-400 hover:text-stone-900'
                }`}
                style={
                  isSelected
                    ? {
                        backgroundColor: cat.color,
                        boxShadow: `0 6px 16px -2px ${cat.color}65`,
                      }
                    : undefined
                }
              >
                {!isSelected && (
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
                    style={{ backgroundColor: cat.color }}
                  />
                )}
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] font-mono ${
                    isSelected ? 'opacity-80' : 'text-stone-400'
                  }`}
                >
                  ({cat.en})
                </span>
              </button>
            );
          })}

          {/* Bookmarks Filter Button */}
          <button
            onClick={() => {
              gameAudio.playTap();
              setIsLoading(true);
              setOnlyBookmarked((prev) => !prev);
              setTimeout(() => setIsLoading(false), 140);
            }}
            className={`text-xs font-bold px-4 py-2.5 rounded-2xl transition-all shrink-0 flex items-center gap-1.5 whitespace-nowrap cursor-pointer active:scale-95 ${
              onlyBookmarked
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                : 'bg-white text-stone-700 border border-stone-200 hover:border-stone-400'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${onlyBookmarked ? 'fill-white text-white' : 'text-stone-500'}`} />
            <span className="font-numeric">收藏馆藏 ({user.bookmarks.length})</span>
          </button>
        </div>

        {/* 4. Architectural Chapter Corridor Row */}
        <div className="bg-stone-50/90 p-2.5 rounded-2xl border border-stone-200/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
          <button
            onClick={() => handleChapterChange('all')}
            className={`text-[11px] font-bold px-3.5 py-2 rounded-xl transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              selectedChapter === 'all'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:bg-stone-200/70 hover:text-stone-900'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>全部卷册 ({laws.length})</span>
          </button>
          {MINDLABZ_CHAPTERS.map((chap, idx) => (
            <button
              key={chap}
              onClick={() => handleChapterChange(chap)}
              className={`text-[11px] font-medium px-3 py-2 rounded-xl transition-all shrink-0 cursor-pointer ${
                selectedChapter === chap
                  ? 'bg-stone-900 text-white font-bold shadow-xs'
                  : 'text-stone-600 hover:bg-stone-200/70 hover:text-stone-900'
              }`}
            >
              <span className="font-numeric text-[10px] text-amber-600 mr-1 font-bold">
                VOL.0{idx + 1}
              </span>
              <span>{chap}</span>
            </button>
          ))}
        </div>
      </section>

      {/* 5. Filtered Count & Active Status Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-xs text-stone-500 font-medium">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1.5 font-serif-editorial">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
            <span className="text-stone-600">策展收录结果:</span>
            <strong className="text-stone-900 font-numeric font-bold text-sm">
              {filteredLaws.length}
            </strong>
            <span className="text-stone-600">条经典定律</span>
          </span>

          {selectedCategory !== 'all' && (
            <span
              className="px-2.5 py-0.5 rounded-md text-[11px] font-bold text-white flex items-center gap-1"
              style={{ backgroundColor: currentCategoryObj.color }}
            >
              <span>{currentCategoryObj.salonTitle}</span>
              <button
                onClick={() => setSelectedCategory('all')}
                className="hover:opacity-80 cursor-pointer ml-0.5"
              >
                ✕
              </button>
            </span>
          )}

          {searchQuery && (
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1">
              <span>关键词: “{searchQuery}”</span>
              <button
                onClick={() => setSearchQuery('')}
                className="hover:text-amber-950 cursor-pointer ml-0.5"
              >
                ✕
              </button>
            </span>
          )}
        </div>

        {(selectedCategory !== 'all' || selectedChapter !== 'all' || onlyBookmarked || searchQuery) && (
          <button
            onClick={() => {
              gameAudio.playTap();
              setSearchQuery('');
              setSelectedCategory('all');
              setSelectedChapter('all');
              setOnlyBookmarked(false);
            }}
            className="text-stone-800 font-bold hover:underline cursor-pointer flex items-center gap-1 text-xs"
          >
            <RotateCcw className="w-3 h-3" />
            <span>重置所有筛选</span>
          </button>
        )}
      </div>

      {/* 6. Display Mode: Gallery Grid vs Dossier View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          {isLoading ? (
            <>
              <LawCardSkeleton />
              <LawCardSkeleton />
              <LawCardSkeleton />
              <LawCardSkeleton />
            </>
          ) : filteredLaws.length > 0 ? (
            filteredLaws.map((law, idx) => (
              <div
                key={law.id}
                className="animate-stageEnter"
                style={{ animationDelay: `${Math.min(idx * 25, 200)}ms` }}
              >
                <PsychologyLawCard law={law} />
              </div>
            ))
          ) : (
            <div className="col-span-full bg-white rounded-3xl p-12 text-center border-2 border-dashed border-stone-200 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600">
                <Search className="w-7 h-7" />
              </div>
              <h3 className="font-serif-editorial text-lg font-bold text-stone-900">
                在当前展厅未检索到匹配的定律
              </h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto leading-relaxed">
                建议尝试更换中英文关键词、编号（如 LAW001）或切换至“全部展厅”继续探索。
              </p>
              <button
                onClick={() => {
                  gameAudio.playTap();
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedChapter('all');
                  setOnlyBookmarked(false);
                }}
                className="px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md inline-flex items-center gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>重置并显示全部 100 篇典藏</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Dossier List Mode: Sleek High-End Archival View */
        <div className="space-y-3">
          {isLoading ? (
            <>
              <LawCardSkeleton />
              <LawCardSkeleton />
            </>
          ) : filteredLaws.length > 0 ? (
            filteredLaws.map((law) => {
              const mastery = user.lawMasteryMap[law.id] || 0;
              const isMastered = mastery >= 80;
              return (
                <div
                  key={law.id}
                  onClick={() => {
                    gameAudio.playTap();
                    navigate(`/law/${law.id}`);
                  }}
                  className="group bg-white hover:bg-stone-50/80 rounded-2xl p-4 sm:p-5 border border-stone-200/80 hover:border-amber-400/80 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs hover:shadow-xs"
                >
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <span className="font-mono text-xs font-bold px-2 py-1 rounded bg-stone-100 text-stone-800 shrink-0 mt-0.5">
                      {law.codeId || 'LAW'}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-serif-editorial text-base font-bold text-stone-900 group-hover:text-amber-800 transition-colors truncate">
                          {law.nameZh}
                        </h3>
                        <span className="text-xs text-stone-400 font-serif-editorial italic truncate">
                          {law.nameEn}
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 line-clamp-1 mt-0.5">
                        {law.shortExplanation}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center text-xs">
                    <span className="text-[11px] px-2 py-0.5 rounded bg-stone-100 text-stone-600 font-medium">
                      {law.categoryZh}
                    </span>
                    {isMastered && (
                      <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 fill-emerald-600 text-white" />
                        <span>已内化</span>
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-stone-900 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-white rounded-3xl p-10 text-center border border-stone-200">
              <p className="text-xs text-stone-500">未检索到匹配结果</p>
            </div>
          )}
        </div>
      )}

      {/* 7. Epiphany Modal (Random Inspirational Discovery Dialog) */}
      {epiphanyLaw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-3xl bg-white border border-amber-300 shadow-2xl p-7 sm:p-9 space-y-5 animate-stageEnter overflow-hidden">
            {/* Top gold ribbon */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-600" />

            <div className="flex items-center justify-between pb-3 border-b border-stone-200/80">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-amber-100 text-amber-800">
                  <Sparkles className="w-4 h-4" />
                </span>
                <span className="font-serif-editorial text-xs font-bold text-stone-900 tracking-wider uppercase">
                  今日心智灵感 · 随机启迪
                </span>
              </div>
              <button
                onClick={() => setEpiphanyLaw(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-800 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-mono font-bold px-2 py-0.5 rounded bg-stone-100 text-stone-900">
                  {epiphanyLaw.codeId}
                </span>
                <span className="text-stone-400">/</span>
                <span className="font-semibold text-amber-800">
                  {epiphanyLaw.categoryZh}展厅
                </span>
              </div>

              <h3 className="font-serif-editorial text-2xl font-bold text-stone-900 leading-snug">
                {epiphanyLaw.nameZh}
              </h3>
              <p className="text-xs text-stone-500 font-serif-editorial italic">
                {epiphanyLaw.nameEn}
              </p>

              <blockquote className="rounded-2xl p-4 bg-amber-50/70 border border-amber-200/80 font-serif-editorial text-xs sm:text-sm text-stone-800 leading-relaxed italic">
                “{epiphanyLaw.shortExplanation}”
              </blockquote>

              <p className="text-xs text-stone-600 leading-relaxed line-clamp-3">
                {epiphanyLaw.detailedExplanation}
              </p>
            </div>

            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                onClick={handleRandomEpiphany}
                className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-100 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>换一条启迪</span>
              </button>

              <button
                onClick={() => {
                  setEpiphanyLaw(null);
                  navigate(`/law/${epiphanyLaw.id}`);
                }}
                className="flex-1 px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>进入深度解析</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Search,
  ChevronDown,
  Bookmark,
  Share2,
  Heart,
  ShieldCheck,
  MessageSquare,
  Flame,
  Crown,
  BookOpen,
  Filter,
  Volume2,
  ArrowRight,
  ExternalLink,
  Award,
  Layers,
  Sparkle,
  Compass,
  CheckCircle2,
  Copy,
  Check,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  EMOTIONAL_PSYCHOLOGY_LAWS,
  EMOTIONAL_SECTIONS,
  EmotionalPsychologyLaw,
  EmotionalSectionMeta,
} from '../data/emotionalLaws';
import { gameAudio } from '../utils/gameAudio';

export const EmotionalLawsLibraryPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, toggleBookmark, isBookmarked } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<number | 'all'>('all');
  const [onlyBookmarked, setOnlyBookmarked] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(['emo-01', 'emo-11']));
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const SECTION_TABS = [
    { index: 'all' as const, label: '全部板块', en: 'All 50 Laws', range: '01-50', color: '#F59E0B' },
    { index: 1, label: '爱情与吸引力', en: 'Attraction', range: '01-10', color: '#F59E0B' },
    { index: 2, label: '依恋与情绪', en: 'Attachment', range: '11-20', color: '#EC4899' },
    { index: 3, label: '沟通与冲突', en: 'Communication', range: '21-30', color: '#8B5CF6' },
    { index: 4, label: '失恋与困局', en: 'Heartbreak', range: '31-40', color: '#06B6D4' },
    { index: 5, label: '成熟关系', en: 'Maturity', range: '41-50', color: '#10B981' },
  ];

  const handleSectionFilterChange = (secIndex: number | 'all') => {
    if (selectedSectionFilter === secIndex) return;
    gameAudio.playTap();
    setIsTransitioning(true);
    setSelectedSectionFilter(secIndex);
    setTimeout(() => {
      setIsTransitioning(false);
    }, 160);
  };

  // Toggle single accordion item
  const toggleExpand = (id: string) => {
    gameAudio.playSelect();
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Expand or collapse all items
  const handleToggleAll = (expand: boolean) => {
    gameAudio.playTap();
    if (expand) {
      setExpandedIds(new Set(EMOTIONAL_PSYCHOLOGY_LAWS.map((l) => l.id)));
    } else {
      setExpandedIds(new Set());
    }
  };

  // Copy takeaway to clipboard
  const handleCopyQuote = (law: EmotionalPsychologyLaw, e: React.MouseEvent) => {
    e.stopPropagation();
    gameAudio.playSuccess();
    const text = `【${law.titleZh} (${law.titleEn})】\n${law.corePrinciple}\n💡现实启示：${law.practicalTakeaways.summary}`;
    navigator.clipboard.writeText(text);
    setCopiedId(law.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Jump to specific section smoothly
  const scrollToSection = (secIndex: number) => {
    gameAudio.playTap();
    setSelectedSectionFilter('all');
    const el = document.getElementById(`section-frame-${secIndex}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Group laws by sections
  const groupedSections = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return EMOTIONAL_SECTIONS.map((sectionMeta) => {
      if (selectedSectionFilter !== 'all' && selectedSectionFilter !== sectionMeta.index) {
        return {
          meta: sectionMeta,
          laws: [],
        };
      }

      const sectionLaws = EMOTIONAL_PSYCHOLOGY_LAWS.filter((law) => {
        if (law.sectionIndex !== sectionMeta.index) return false;
        if (onlyBookmarked && !user.bookmarks.includes(law.id)) return false;
        if (!q) return true;

        return (
          law.titleZh.toLowerCase().includes(q) ||
          law.titleEn.toLowerCase().includes(q) ||
          law.corePrinciple.toLowerCase().includes(q) ||
          law.keywords.some((k) => k.toLowerCase().includes(q)) ||
          law.deepBreakdown.mechanism.toLowerCase().includes(q) ||
          law.lifeCase.scenario.toLowerCase().includes(q) ||
          law.practicalTakeaways.summary.toLowerCase().includes(q)
        );
      });

      return {
        meta: sectionMeta,
        laws: sectionLaws,
      };
    }).filter((group) => group.laws.length > 0 || (selectedSectionFilter === group.meta.index && !q && !onlyBookmarked));
  }, [searchQuery, selectedSectionFilter, onlyBookmarked, user.bookmarks]);

  const totalFilteredCount = useMemo(() => {
    return groupedSections.reduce((sum, g) => sum + g.laws.length, 0);
  }, [groupedSections]);

  const activeSectionMeta =
    typeof selectedSectionFilter === 'number'
      ? EMOTIONAL_SECTIONS[selectedSectionFilter - 1]
      : null;

  return (
    <div className="space-y-10 pb-24 animate-fadeIn max-w-5xl mx-auto px-2 sm:px-4 text-stone-100">
      {/* 1. Grand Masterpiece Header: Nocturne Gold Foil Canvas */}
      <section className="relative rounded-3xl overflow-hidden art-salon-canvas text-white p-7 sm:p-10 md:p-12 border border-amber-500/35 shadow-[0_25px_60px_rgba(0,0,0,0.8)] transition-all">
        {/* Subtle Decorative Golden Ratio Spiral & Celestial Geometry */}
        <div className="absolute inset-0 opacity-15 pointer-events-none overflow-hidden">
          <svg className="w-full h-full" viewBox="0 0 800 400" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="720" cy="70" r="260" stroke="#F59E0B" strokeWidth="1" strokeDasharray="3 7" />
            <circle cx="720" cy="70" r="180" stroke="#F59E0B" strokeWidth="1.2" />
            <circle cx="720" cy="70" r="100" stroke="#F59E0B" strokeWidth="1.5" />
            <path d="M420,320 C580,140 720,40 850,40" stroke="#F59E0B" strokeWidth="1.2" strokeDasharray="4 6" />
          </svg>
        </div>

        {/* Ambient Chromatic Glow Orbs */}
        <div className="absolute -top-24 -right-20 w-96 h-96 rounded-full bg-gradient-to-br from-amber-500/25 via-amber-600/15 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-20 w-96 h-96 rounded-full bg-gradient-to-tr from-purple-600/20 via-amber-500/15 to-transparent blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 sm:gap-8">
          <div className="space-y-4 max-w-2xl">
            {/* Museum Catalog Tag */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-400/30 font-semibold tracking-wider text-[11px] shadow-sm font-mono">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>BIBLIOTHÈQUE ÉMOTIONNELLE · 情感定律典藏大典</span>
              </span>
              <span className="text-stone-500" aria-hidden="true">/</span>
              <span className="text-stone-400 text-xs font-mono font-serif italic">
                50 条心智与依恋法则
              </span>
            </div>

            {/* High-Contrast Literary Headline */}
            <h1 className="font-serif-editorial text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-tight text-white drop-shadow-md">
              情感心理学 50 条定律 · 深度结构化典藏库
            </h1>

            {/* Editorial Dek */}
            <p className="text-xs sm:text-sm text-stone-300 font-normal leading-relaxed">
              深度理解爱情、人性、依恋与亲密关系。分置于五个艺术展框板块，每条定律均含核心原理、心理机制深度拆解、生活真实案例、现实行动启示与适用边界。
            </p>

            {/* Stats Index */}
            <div className="pt-1 flex items-center gap-3 sm:gap-4 text-xs font-numeric text-stone-300 flex-wrap">
              <span className="flex items-center gap-1.5 bg-white/5 border border-amber-400/20 px-3 py-1 rounded-xl">
                <span className="w-2 h-2 rounded-full bg-amber-400 shadow-xs shadow-amber-400/50" />
                <span className="text-stone-400">典藏板块:</span>
                <strong className="text-amber-200 font-bold">5 大核心架构</strong>
              </span>
              <span className="flex items-center gap-1.5 bg-white/5 border border-amber-400/20 px-3 py-1 rounded-xl">
                <span className="w-2 h-2 rounded-full bg-rose-400 shadow-xs shadow-rose-400/50" />
                <span className="text-stone-400">完整规律:</span>
                <strong className="text-white font-bold">50 条实证心智法则</strong>
              </span>
              <span className="flex items-center gap-1.5 bg-white/5 border border-amber-400/20 px-3 py-1 rounded-xl">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-xs shadow-emerald-400/50" />
                <span className="text-stone-400">已收藏:</span>
                <strong className="text-emerald-300 font-bold">{user.bookmarks.length} 条</strong>
              </span>
            </div>
          </div>

          {/* Quick Action Medal */}
          <div className="shrink-0 flex flex-col items-center gap-2">
            <button
              onClick={() => {
                gameAudio.playSuccess();
                const randomLaw = EMOTIONAL_PSYCHOLOGY_LAWS[Math.floor(Math.random() * EMOTIONAL_PSYCHOLOGY_LAWS.length)];
                setExpandedIds((prev) => new Set(prev).add(randomLaw.id));
                const el = document.getElementById(randomLaw.id);
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-stone-950 font-bold text-xs shadow-[0_0_20px_rgba(245,158,11,0.35)] hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 cursor-pointer border border-amber-200/40"
            >
              <Sparkles className="w-4 h-4 text-stone-950" />
              <span>抽选启迪规律</span>
            </button>
            <span className="text-[10px] text-stone-400 font-mono">
              点击任意定律面板展开深度解析
            </span>
          </div>
        </div>
      </section>

      {/* 2. Interactive Search & Section Quick Navigator */}
      <section className="space-y-4">
        {/* Search Bar with gold border focus */}
        <div className="relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center text-stone-400 group-focus-within:text-amber-400 transition-colors pointer-events-none">
            <Search className="w-5 h-5" />
          </div>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索 50 条情感定律：吊桥效应、曝光效应、依恋风格、非暴力沟通、边界..."
            className="w-full pl-12 pr-11 py-3.5 bg-stone-900/90 backdrop-blur-xl border border-stone-800 focus:border-amber-500/80 focus:ring-4 focus:ring-amber-500/10 rounded-2xl text-xs sm:text-sm font-medium text-white placeholder-stone-500 focus:outline-none transition-all shadow-inner"
          />

          {searchQuery && (
            <button
              onClick={() => {
                gameAudio.playTap();
                setSearchQuery('');
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white text-xs flex items-center justify-center transition-colors cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Section Navigation Tabs & Batch Accordion Expand */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Five Section Quick Filter Buttons with Descriptive Category Labels */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {SECTION_TABS.map((tab) => {
              const isSelected = selectedSectionFilter === tab.index;
              return (
                <button
                  key={String(tab.index)}
                  onClick={() => handleSectionFilterChange(tab.index)}
                  className={`text-xs font-bold px-3.5 py-2.5 rounded-2xl transition-all shrink-0 cursor-pointer flex items-center gap-2 active:scale-95 shadow-xs ${
                    isSelected
                      ? 'text-white shadow-lg'
                      : 'bg-stone-900/90 text-stone-400 border border-stone-800/90 hover:text-stone-200 hover:border-stone-700'
                  }`}
                  style={
                    isSelected
                      ? {
                          backgroundColor: tab.color,
                          boxShadow: `0 6px 18px -2px ${tab.color}70`,
                        }
                      : undefined
                  }
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: isSelected ? '#ffffff' : tab.color }}
                  />
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-stone-800 text-stone-500'
                    }`}
                  >
                    {tab.range}
                  </span>
                </button>
              );
            })}

            {/* Bookmark Filter Button */}
            <button
              onClick={() => {
                gameAudio.playTap();
                setIsTransitioning(true);
                setOnlyBookmarked((prev) => !prev);
                setTimeout(() => setIsTransitioning(false), 160);
              }}
              className={`text-xs font-bold px-3.5 py-2.5 rounded-2xl transition-all shrink-0 flex items-center gap-1.5 whitespace-nowrap cursor-pointer active:scale-95 ${
                onlyBookmarked
                  ? 'bg-amber-500 text-stone-950 font-bold shadow-md shadow-amber-500/30'
                  : 'bg-stone-900/90 text-stone-400 border border-stone-800/90 hover:text-stone-200'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${onlyBookmarked ? 'fill-stone-950 text-stone-950' : 'text-stone-400'}`} />
              <span className="font-numeric">收藏 ({user.bookmarks.length})</span>
            </button>
          </div>

          {/* Batch Accordion Actions */}
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto text-xs">
            <button
              onClick={() => handleToggleAll(true)}
              className="px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-800 hover:border-amber-500/50 text-stone-300 hover:text-amber-300 transition-all cursor-pointer font-mono text-[11px]"
            >
              全部展开
            </button>
            <button
              onClick={() => handleToggleAll(false)}
              className="px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-800 hover:border-stone-700 text-stone-400 hover:text-stone-200 transition-all cursor-pointer font-mono text-[11px]"
            >
              全部折叠
            </button>
          </div>
        </div>
      </section>

      {/* 3. Result Count & Active Filter Indication */}
      <div className="flex items-center justify-between text-xs text-stone-400 px-1 font-mono">
        <span className="flex items-center gap-2 flex-wrap">
          <span>展示篇目：</span>
          <strong className="text-amber-400 font-bold">{totalFilteredCount}</strong>
          <span>/ 50 条定律</span>

          {activeSectionMeta && (
            <span
              className="px-2 py-0.5 rounded-md text-[10px] font-bold text-white flex items-center gap-1 shadow-2xs"
              style={{ backgroundColor: activeSectionMeta.theme.primary }}
            >
              <span>{activeSectionMeta.title.split('：')[0]} · {activeSectionMeta.title.split('：')[1]?.replace(/的10条规律$/, '')}</span>
              <button
                onClick={() => handleSectionFilterChange('all')}
                className="hover:opacity-80 cursor-pointer ml-0.5"
                title="清除板块筛选"
              >
                ✕
              </button>
            </span>
          )}

          {onlyBookmarked && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500 text-stone-950 flex items-center gap-1 shadow-2xs">
              <span>仅看收藏</span>
              <button
                onClick={() => setOnlyBookmarked(false)}
                className="hover:opacity-80 cursor-pointer ml-0.5"
              >
                ✕
              </button>
            </span>
          )}
        </span>

        {(selectedSectionFilter !== 'all' || onlyBookmarked || searchQuery) && (
          <button
            onClick={() => {
              gameAudio.playTap();
              setSearchQuery('');
              setSelectedSectionFilter('all');
              setOnlyBookmarked(false);
            }}
            className="text-amber-400 font-bold hover:underline cursor-pointer flex items-center gap-1 text-xs"
          >
            <span>重置所有筛选</span>
          </button>
        )}
      </div>

      {/* Section Spotlight Hero Card when a specific section is chosen */}
      {activeSectionMeta && !searchQuery && (
        <div
          className="rounded-3xl p-5 sm:p-6 border shadow-2xl relative overflow-hidden animate-smoothFadeIn"
          style={{
            borderColor: `${activeSectionMeta.theme.primary}50`,
            background: `radial-gradient(circle at 10% 20%, ${activeSectionMeta.theme.primary}22 0%, rgba(12, 10, 9, 0.95) 70%)`,
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2">
                <span
                  className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider"
                  style={{
                    backgroundColor: `${activeSectionMeta.theme.primary}25`,
                    borderColor: `${activeSectionMeta.theme.primary}60`,
                    color: activeSectionMeta.theme.primary,
                  }}
                >
                  PART 0{activeSectionMeta.index} · {activeSectionMeta.en}
                </span>
                <span className="text-stone-500 text-xs">/</span>
                <span className="text-xs text-amber-300 font-mono">
                  涵盖定律：{activeSectionMeta.lawRange}（共 10 条法则）
                </span>
              </div>
              <h3 className="font-serif-editorial text-lg sm:text-xl font-bold text-white tracking-tight">
                {activeSectionMeta.title}
              </h3>
              <p className="text-xs text-stone-300 leading-relaxed font-serif italic">
                “{activeSectionMeta.subtitle}”
              </p>
              <p className="text-xs text-stone-400 leading-relaxed pt-0.5">
                {activeSectionMeta.description}
              </p>
            </div>

            <button
              onClick={() => handleSectionFilterChange('all')}
              className="shrink-0 px-4 py-2 rounded-xl bg-stone-900/90 hover:bg-stone-850 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-sm self-start sm:self-center"
            >
              <span>查看全部 5 大板块</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 4. Five Major Sections Showcase with Art Salon Canvas Frames & Smooth Fade-In */}
      <div
        key={`sections-container-${selectedSectionFilter}-${onlyBookmarked}`}
        className={`space-y-12 transition-all duration-300 ${
          isTransitioning ? 'opacity-0 translate-y-2' : 'animate-smoothFadeIn'
        }`}
      >
        {groupedSections.length === 0 ? (
          <div className="bg-stone-950/80 border border-stone-800/80 rounded-3xl p-12 text-center space-y-4">
            <Compass className="w-12 h-12 text-stone-600 mx-auto animate-pulse" />
            <div className="text-white font-serif text-lg">未检索到匹配的情感定律</div>
            <p className="text-xs text-stone-400 max-w-md mx-auto">
              未找到与当前筛选条件匹配的内容。请尝试切换其他板块或重置筛选。
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedSectionFilter('all');
                setOnlyBookmarked(false);
              }}
              className="px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold hover:bg-amber-500/30 transition-all cursor-pointer"
            >
              重置筛选查看全部
            </button>
          </div>
        ) : (
          groupedSections.map((group) => {
            const secMeta = group.meta;

            return (
              <section
                key={secMeta.index}
                id={`section-frame-${secMeta.index}`}
                className="relative rounded-3xl overflow-hidden art-salon-canvas p-6 sm:p-8 md:p-9 border border-amber-500/30 shadow-[0_15px_40px_rgba(0,0,0,0.6)] space-y-6 transition-all"
              >
                {/* Decorative Top Gold Edge Ribbon */}
                <div
                  className="absolute top-0 left-0 right-0 h-[3px]"
                  style={{
                    background: `linear-gradient(90deg, transparent 0%, ${secMeta.theme.primary} 50%, transparent 100%)`,
                  }}
                />

                {/* Section Masthead: Gilded Art Salon Exhibition Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-stone-800/80">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span
                        className="font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full border shadow-xs tracking-wider"
                        style={{
                          backgroundColor: `${secMeta.theme.primary}18`,
                          borderColor: `${secMeta.theme.primary}40`,
                          color: secMeta.theme.primary,
                        }}
                      >
                        PART 0{secMeta.index} · {secMeta.en}
                      </span>
                      <span className="text-stone-500 text-xs">/</span>
                      <span className="font-mono text-amber-300/80 text-xs">
                        收录规律：{secMeta.lawRange}
                      </span>
                    </div>

                    <h2 className="font-serif-editorial text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full inline-block"
                        style={{ backgroundColor: secMeta.theme.primary }}
                      />
                      <span>{secMeta.title}</span>
                    </h2>

                    <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-serif italic max-w-3xl">
                      “{secMeta.subtitle}”
                    </p>

                    <p className="text-xs text-stone-400/90 leading-relaxed max-w-3xl pt-0.5">
                      {secMeta.description}
                    </p>
                  </div>

                  {/* Right Index Badge */}
                  <div className="shrink-0 flex sm:flex-col items-center sm:items-end justify-between gap-2">
                    <span className="font-numeric text-xs px-3 py-1 rounded-xl bg-stone-900/90 border border-stone-800 text-stone-300">
                      本板块共 <strong className="text-amber-400 font-bold">{group.laws.length}</strong> 条
                    </span>
                  </div>
                </div>

                {/* Accordion Laws List inside this Section Frame */}
                <div className="space-y-3.5">
                  {group.laws.map((law) => {
                    const isExpanded = expandedIds.has(law.id);
                    const bookmarked = isBookmarked(law.id);

                    return (
                      <div
                        key={law.id}
                        id={law.id}
                        className={`group/card rounded-2xl transition-all duration-300 overflow-hidden relative ${
                          isExpanded
                            ? 'bg-gradient-to-b from-[#16120e] via-[#120f0d] to-[#0d0b0a] art-gold-border shadow-[0_12px_40px_rgba(245,158,11,0.18)] ring-1 ring-amber-400/40'
                            : 'bg-[#100d0b]/85 border border-stone-800/90 hover:art-gold-border hover:shadow-[0_8px_30px_rgba(245,158,11,0.12)]'
                        }`}
                      >
                        {/* Top Gilded Ribbon Accent */}
                        <div
                          className={`absolute top-0 left-0 right-0 h-[2px] transition-opacity duration-300 ${
                            isExpanded ? 'opacity-100' : 'opacity-40 group-hover/card:opacity-100'
                          }`}
                          style={{
                            background: `linear-gradient(90deg, transparent 0%, #F59E0B 40%, ${secMeta.theme.primary} 70%, transparent 100%)`,
                          }}
                        />

                        {/* 1. Accordion Title / Clickable Header */}
                        <div
                          onClick={() => toggleExpand(law.id)}
                          className="p-4 sm:p-5 flex items-start sm:items-center justify-between gap-4 cursor-pointer select-none"
                        >
                          <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                            {/* Gold Roman/Index Numbering Badge */}
                            <div
                              className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl shrink-0 flex flex-col items-center justify-center font-mono font-bold text-xs border art-gold-border bg-gradient-to-b from-amber-500/20 via-amber-400/10 to-transparent shadow-inner transition-transform group-hover/card:scale-105"
                            >
                              <span className="text-[9px] uppercase tracking-tighter text-amber-300/80">NO.</span>
                              <span className="text-sm font-extrabold leading-none art-gold-text">
                                {String(law.order).padStart(2, '0')}
                              </span>
                            </div>

                            {/* Titles and Keywords */}
                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-base sm:text-lg font-bold text-white font-serif tracking-tight group-hover/card:art-gold-text transition-colors">
                                  {law.titleZh}
                                </h3>
                                <span className="text-xs text-amber-200/70 font-serif-editorial italic hidden md:inline">
                                  ({law.titleEn})
                                </span>
                                {law.isDuplicateOfCore && (
                                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md art-gold-border bg-amber-500/15 text-amber-300 shadow-2xs">
                                    核心通识联动 · {law.duplicateCoreId}
                                  </span>
                                )}
                              </div>

                              {/* Teaser principle preview */}
                              <p className="text-xs text-stone-300/85 line-clamp-1 font-serif">
                                “{law.corePrinciple}”
                              </p>

                              {/* Keyword chips with gold hairline borders */}
                              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                                {law.keywords.map((kw, i) => (
                                  <span
                                    key={i}
                                    className="text-[10px] px-2 py-0.5 rounded-md bg-stone-900/90 border border-amber-500/20 text-amber-300/80 font-mono"
                                  >
                                    #{kw}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Right Controls: Bookmark, Copy, Chevron */}
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={(e) => handleCopyQuote(law, e)}
                              className="p-2 rounded-xl bg-stone-900/90 border border-stone-800 hover:art-gold-border text-stone-400 hover:text-amber-300 transition-all cursor-pointer shadow-xs"
                              title="复制启示金句"
                            >
                              {copiedId === law.id ? (
                                <Check className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                gameAudio.playTap();
                                toggleBookmark(law.id);
                              }}
                              className={`p-2 rounded-xl border transition-all cursor-pointer shadow-xs ${
                                bookmarked
                                  ? 'bg-amber-950/80 art-gold-border text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.35)]'
                                  : 'bg-stone-900/90 border-stone-800 text-stone-500 hover:art-gold-border hover:text-stone-300'
                              }`}
                              title={bookmarked ? '取消收藏' : '收藏此定律'}
                            >
                              <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-amber-400' : ''}`} />
                            </button>

                            <div
                              className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-all duration-300 ${
                                isExpanded
                                  ? 'rotate-180 bg-amber-500/15 art-gold-text art-gold-border shadow-xs'
                                  : 'bg-stone-900/80 border-stone-800 text-stone-400 group-hover/card:text-amber-300'
                              }`}
                            >
                              <ChevronDown className="w-4 h-4" />
                            </div>
                          </div>
                        </div>

                        {/* 2. Accordion Smooth Expandable Content Panel */}
                        <div className={`accordion-smooth-collapse ${isExpanded ? 'is-expanded' : ''}`}>
                          <div className="accordion-smooth-inner">
                            <div className="border-t border-amber-500/25 p-5 sm:p-7 md:p-8 space-y-6 text-stone-200 bg-gradient-to-b from-[#181410]/95 via-[#120e0b]/98 to-[#0a0807]">
                              {/* 1. Core Principle Master Plate */}
                              <div className="relative rounded-2xl p-5 sm:p-6 bg-gradient-to-r from-stone-900/90 via-amber-950/20 to-stone-900/90 art-gold-border shadow-[0_6px_25px_rgba(0,0,0,0.5)]">
                                <div className="text-[10px] font-mono tracking-widest art-gold-text font-bold uppercase flex items-center gap-1.5 mb-2.5">
                                  <Sparkle className="w-3.5 h-3.5 text-amber-400" />
                                  <span>核心定律原理 · CORE LAW PRINCIPLE</span>
                                </div>
                                <p className="text-sm sm:text-base text-amber-50/95 font-serif font-medium leading-relaxed tracking-wide drop-shadow-sm">
                                  “{law.corePrinciple}”
                                </p>
                              </div>

                              {/* 2. Deep Breakdown & Neural Mechanism */}
                              <div className="space-y-3.5">
                                <div className="text-xs font-mono art-gold-text uppercase tracking-wider flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
                                  <span className="font-bold">心理机制与认知逻辑拆解</span>
                                </div>
                                <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-sans pl-4 border-l-2 border-amber-500/70">
                                  {law.deepBreakdown.mechanism}
                                </p>

                                {law.deepBreakdown.insights.length > 0 && (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                    {law.deepBreakdown.insights.map((ins, i) => (
                                      <div
                                        key={i}
                                        className="p-3.5 rounded-xl bg-gradient-to-br from-stone-900/90 to-[#14100c] border art-gold-border text-xs text-stone-200 flex items-start gap-2.5 shadow-sm"
                                      >
                                        <span className="font-mono art-gold-text font-bold shrink-0 mt-0.5">
                                          0{i + 1}.
                                        </span>
                                        <span className="leading-relaxed">{ins}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* 3. Real-life Relationship Case */}
                              <div className="space-y-3 rounded-2xl p-5 sm:p-6 bg-gradient-to-br from-amber-950/15 via-stone-950/70 to-stone-950 border border-amber-500/30">
                                <div className="flex items-center gap-2 text-xs font-mono font-bold art-gold-text">
                                  <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400/40" />
                                  <span>真实生活与亲密关系案例：{law.lifeCase.title}</span>
                                </div>
                                <p className="text-xs sm:text-sm text-stone-200/90 leading-relaxed font-serif italic pl-3.5 border-l-2 border-amber-400/50">
                                  “{law.lifeCase.scenario}”
                                </p>
                                {law.lifeCase.analysis && (
                                  <div className="text-xs text-stone-300/80 pt-2 border-t border-stone-800/80 flex items-start gap-1.5">
                                    <strong className="art-gold-text font-mono shrink-0">案例心理透视:</strong>
                                    <span className="leading-relaxed">{law.lifeCase.analysis}</span>
                                  </div>
                                )}
                              </div>

                              {/* 4. Practical Takeaways & Key Distinction */}
                              <div className="space-y-3.5 p-5 sm:p-6 rounded-2xl bg-gradient-to-b from-amber-950/25 via-stone-950/80 to-stone-950 art-gold-border shadow-md">
                                <div className="flex items-center justify-between text-xs font-mono flex-wrap gap-2">
                                  <span className="font-bold art-gold-text flex items-center gap-1.5">
                                    <Award className="w-4 h-4 text-amber-400" />
                                    <span>现实行动启示与心智方案</span>
                                  </span>
                                  {law.practicalTakeaways.keyDistinction && (
                                    <span className="text-[11px] font-serif italic text-amber-200/90 bg-amber-500/15 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                                      ✦ {law.practicalTakeaways.keyDistinction}
                                    </span>
                                  )}
                                </div>

                                <p className="text-xs sm:text-sm text-amber-100 font-medium leading-relaxed font-serif">
                                  {law.practicalTakeaways.summary}
                                </p>

                                <div className="space-y-2.5 pt-1">
                                  {law.practicalTakeaways.actionablePoints.map((point, i) => (
                                    <div key={i} className="flex items-start gap-2.5 text-xs text-stone-200">
                                      <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                                      <span className="leading-relaxed">{point}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* 5. Boundary & Caveat */}
                              {law.boundary && (
                                <div className="text-xs text-amber-200/90 pl-3.5 border-l-2 border-amber-400 py-1.5 bg-amber-500/5 rounded-r-xl">
                                  <strong className="art-gold-text font-mono mr-1.5">适用边界与误区警示：</strong>
                                  <span className="leading-relaxed">{law.boundary}</span>
                                </div>
                              )}

                              {/* 6. Footer Actions: Close panel or Jump to quiz */}
                              <div className="pt-3 flex items-center justify-between gap-3 flex-wrap border-t border-stone-800/80">
                                <div className="text-[11px] text-amber-300/70 font-mono">
                                  馆藏编号：LAW-EMO-{String(law.order).padStart(2, '0')}
                                </div>

                                <div className="flex items-center gap-2.5">
                                  <button
                                    onClick={() => toggleExpand(law.id)}
                                    className="px-3.5 py-1.5 rounded-xl border border-stone-800 hover:art-gold-border text-stone-400 hover:text-amber-200 text-xs transition-all cursor-pointer font-mono"
                                  >
                                    收起面板
                                  </button>
                                  <button
                                    onClick={() => {
                                      gameAudio.playTap();
                                      navigate('/learn');
                                    }}
                                    className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:brightness-110 text-stone-950 font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95"
                                  >
                                    <span>在主画廊中研习 & 测验</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })
        )}
      </div>
    </div>
  );
};

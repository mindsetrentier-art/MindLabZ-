import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Search,
  ChevronDown,
  Bookmark,
  Heart,
  Crown,
  ArrowRight,
  Award,
  Sparkle,
  Compass,
  CheckCircle2,
  Copy,
  Check,
  SlidersHorizontal,
  X,
  RotateCcw,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useFontScale } from '../context/FontScaleContext';
import { FloatingFontScaleControl } from '../components/ui/FloatingFontScaleControl';
import {
  EMOTIONAL_PSYCHOLOGY_LAWS,
  EMOTIONAL_SECTIONS,
  EmotionalPsychologyLaw,
} from '../data/emotionalLaws';
import { DifficultyLevel, PsychologyLaw } from '../types';
import {
  LIBRARY_TAG_DEFINITIONS,
  LibraryTagId,
  getLawClassificationTags,
  getPrimaryTagLabel,
} from '../utils/lawTagClassifier';
import { gameAudio } from '../utils/gameAudio';
import {
  toggleLawSpeech,
  stopLawSpeech,
  useLawSpeech,
  LawSpeechSegment,
} from '../utils/lawSpeechEngine';
import { SilverSpeechText, LawVoiceToggleSwitch } from '../components/ui/SilverSpeechText';

type LibraryViewMode = 'corpus' | 'emotional-archive';
type DifficultyFilter = 'all' | DifficultyLevel;

const PAGE_BATCH_SIZE = 24;

export const EmotionalLawsLibraryPage: React.FC = () => {
  const navigate = useNavigate();
  const { laws, user, toggleBookmark, isBookmarked } = useApp();
  const { fontScale } = useFontScale();

  const [viewMode, setViewMode] = useState<LibraryViewMode>('corpus');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<LibraryTagId[]>([]);
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('all');
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<number | 'all'>('all');
  const [onlyBookmarked, setOnlyBookmarked] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [visibleLimit, setVisibleLimit] = useState(PAGE_BATCH_SIZE);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(['emo-01', 'emo-11']));
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { activeLawId, globalIsSpeaking, activeCpIndex, segments } = useLawSpeech();

  const SECTION_TABS = [
    { index: 'all' as const, label: '全部板块', en: 'All 50 Laws', range: '01-50', color: '#F59E0B' },
    { index: 1, label: '爱情与吸引力', en: 'Attraction', range: '01-10', color: '#F59E0B' },
    { index: 2, label: '依恋与情绪', en: 'Attachment', range: '11-20', color: '#EC4899' },
    { index: 3, label: '沟通与冲突', en: 'Communication', range: '21-30', color: '#8B5CF6' },
    { index: 4, label: '失恋与困局', en: 'Heartbreak', range: '31-40', color: '#06B6D4' },
    { index: 5, label: '成熟关系', en: 'Maturity', range: '41-50', color: '#10B981' },
  ];

  // Stop speech cleanly on unmount
  useEffect(() => {
    return () => {
      stopLawSpeech();
    };
  }, []);

  // Close mobile sidebar on Escape
  useEffect(() => {
    if (!mobileSidebarOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileSidebarOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileSidebarOpen]);

  // Precompute classification tags for all 500+ laws once
  const taggedCorpus = useMemo(() => {
    return laws.map((law) => ({
      law,
      tags: getLawClassificationTags(law),
      primaryTagLabel: getPrimaryTagLabel(law),
    }));
  }, [laws]);

  // Live per-tag counts across the entire 500+ laws corpus
  const tagCounts = useMemo(() => {
    const counts: Record<LibraryTagId, number> = {
      'criminal-psychology': 0,
      'sexual-psychology': 0,
      'reverse-psychology': 0,
      microexpressions: 0,
      'cognitive-bias': 0,
      'decision-making': 0,
      'love-attachment': 0,
      'social-dynamics': 0,
      'memory-recall': 0,
      'behavior-habit': 0,
    };
    for (const entry of taggedCorpus) {
      for (const t of entry.tags) {
        counts[t] += 1;
      }
    }
    return counts;
  }, [taggedCorpus]);

  // Filtered 500+ laws corpus
  const filteredCorpus = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return taggedCorpus.filter(({ law, tags }) => {
      if (selectedTags.length > 0 && !selectedTags.some((tag) => tags.includes(tag))) {
        return false;
      }
      if (difficultyFilter !== 'all' && law.difficulty !== difficultyFilter) {
        return false;
      }
      if (onlyBookmarked && !user.bookmarks.includes(law.id)) {
        return false;
      }
      if (!q) return true;

      return (
        law.nameZh.toLowerCase().includes(q) ||
        law.nameEn.toLowerCase().includes(q) ||
        (law.codeId && law.codeId.toLowerCase().includes(q)) ||
        law.shortExplanation.toLowerCase().includes(q) ||
        law.detailedExplanation.toLowerCase().includes(q) ||
        (law.chapter && law.chapter.toLowerCase().includes(q)) ||
        (law.subTag && law.subTag.toLowerCase().includes(q)) ||
        (law.reverseCategory && law.reverseCategory.toLowerCase().includes(q)) ||
        (law.actionUnitCode && law.actionUnitCode.toLowerCase().includes(q))
      );
    });
  }, [taggedCorpus, selectedTags, difficultyFilter, onlyBookmarked, searchQuery, user.bookmarks]);

  const visibleCorpus = useMemo(() => {
    return filteredCorpus.slice(0, visibleLimit);
  }, [filteredCorpus, visibleLimit]);

  // Filtered 50 Emotional Deep-Dive Archive
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
    }).filter(
      (group) =>
        group.laws.length > 0 ||
        (selectedSectionFilter === group.meta.index && !q && !onlyBookmarked)
    );
  }, [searchQuery, selectedSectionFilter, onlyBookmarked, user.bookmarks]);

  const totalEmotionalCount = useMemo(() => {
    return groupedSections.reduce((sum, g) => sum + g.laws.length, 0);
  }, [groupedSections]);

  const activeSectionMeta =
    typeof selectedSectionFilter === 'number'
      ? EMOTIONAL_SECTIONS[selectedSectionFilter - 1]
      : null;

  const hasActiveFilters =
    selectedTags.length > 0 ||
    difficultyFilter !== 'all' ||
    onlyBookmarked ||
    searchQuery.trim().length > 0 ||
    (viewMode === 'emotional-archive' && selectedSectionFilter !== 'all');

  const handleResetAllFilters = useCallback(() => {
    gameAudio.playTap();
    setSearchQuery('');
    setSelectedTags([]);
    setDifficultyFilter('all');
    setSelectedSectionFilter('all');
    setOnlyBookmarked(false);
    setVisibleLimit(PAGE_BATCH_SIZE);
  }, []);

  const handleToggleTag = useCallback((tagId: LibraryTagId) => {
    gameAudio.playTap();
    setViewMode('corpus');
    setVisibleLimit(PAGE_BATCH_SIZE);
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
  }, []);

  const handleSelectAllCorpus = useCallback(() => {
    gameAudio.playTap();
    setViewMode('corpus');
    setSelectedTags([]);
    setDifficultyFilter('all');
    setVisibleLimit(PAGE_BATCH_SIZE);
  }, []);

  const handleSectionFilterChange = useCallback((secIndex: number | 'all') => {
    gameAudio.playTap();
    setViewMode('emotional-archive');
    setSelectedSectionFilter(secIndex);
  }, []);

  const toggleExpand = useCallback((id: string) => {
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
  }, []);

  const handleToggleAllEmotional = (expand: boolean) => {
    gameAudio.playTap();
    if (expand) {
      setExpandedIds(new Set(EMOTIONAL_PSYCHOLOGY_LAWS.map((l) => l.id)));
    } else {
      setExpandedIds(new Set());
    }
  };

  const handleCopyEmotionalQuote = (law: EmotionalPsychologyLaw, e: React.MouseEvent) => {
    e.stopPropagation();
    gameAudio.playSuccess();
    const text = `【${law.titleZh} (${law.titleEn})】\n${law.corePrinciple}\n现实启示：${law.practicalTakeaways.summary}`;
    navigator.clipboard.writeText(text);
    setCopiedId(law.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyCorpusQuote = (law: PsychologyLaw, e: React.MouseEvent) => {
    e.stopPropagation();
    gameAudio.playSuccess();
    const text = `【${law.nameZh} (${law.nameEn})】\n${law.shortExplanation}\n实践要点：${law.keyTakeaway}`;
    navigator.clipboard.writeText(text);
    setCopiedId(law.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeakLaw = (law: PsychologyLaw, e: React.MouseEvent) => {
    e.stopPropagation();
    gameAudio.playTap();
    const speechSegments: LawSpeechSegment[] = [
      { key: 'title', text: law.nameZh, separator: '。' },
      { key: 'short', text: law.shortExplanation, separator: '。' },
    ];
    if (law.detailedExplanation) {
      speechSegments.push({ key: 'detail', text: law.detailedExplanation, separator: '。' });
    }
    if (law.realLifeExample) {
      speechSegments.push({ key: 'example', text: law.realLifeExample, separator: '。' });
    }
    const boundaryText = law.healthyBoundary || law.keyTakeaway;
    if (boundaryText) {
      speechSegments.push({ key: 'takeaway', text: boundaryText, separator: '。' });
    }
    const turnedOn = toggleLawSpeech({
      lawId: law.id,
      segments: speechSegments,
    });
    if (turnedOn) {
      setExpandedIds((prev) => new Set(prev).add(law.id));
    }
  };

  const handleSpeakEmotionalLaw = (law: EmotionalPsychologyLaw, e: React.MouseEvent) => {
    e.stopPropagation();
    gameAudio.playTap();
    const speechSegments: LawSpeechSegment[] = [
      { key: 'title', text: law.titleZh, separator: '。' },
      { key: 'core', text: law.corePrinciple, separator: '。' },
      { key: 'mechanism', text: law.deepBreakdown.mechanism, separator: '。' },
      { key: 'case', text: law.lifeCase.scenario, separator: '。' },
      { key: 'summary', text: law.practicalTakeaways.summary, separator: '。' },
    ];
    const turnedOn = toggleLawSpeech({
      lawId: law.id,
      segments: speechSegments,
    });
    if (turnedOn) {
      setExpandedIds((prev) => new Set(prev).add(law.id));
    }
  };

  const handleRandomDraw = () => {
    gameAudio.playSuccess();
    if (viewMode === 'corpus' && filteredCorpus.length > 0) {
      let idx = 0;
      if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
        const buf = new Uint32Array(1);
        window.crypto.getRandomValues(buf);
        idx = buf[0] % filteredCorpus.length;
      }
      const picked = filteredCorpus[idx].law;
      if (idx >= visibleLimit) {
        setVisibleLimit(idx + 6);
      }
      setExpandedIds((prev) => new Set(prev).add(picked.id));
      window.setTimeout(() => {
        document.getElementById(`corpus-${picked.id}`)?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 60);
      return;
    }

    let idx = 0;
    if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
      const buf = new Uint32Array(1);
      window.crypto.getRandomValues(buf);
      idx = buf[0] % EMOTIONAL_PSYCHOLOGY_LAWS.length;
    }
    const randomLaw = EMOTIONAL_PSYCHOLOGY_LAWS[idx];
    setExpandedIds((prev) => new Set(prev).add(randomLaw.id));
    document.getElementById(randomLaw.id)?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  };

  // Reusable Sidebar Contents (shared between Desktop Sticky Rail & Mobile Drawer)
  const renderSidebarContent = (isMobile = false) => (
    <div className="space-y-6">
      {/* Sidebar Masthead */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-stone-800/90">
        <div>
          <div className="text-[11px] uppercase tracking-[0.14em] font-semibold text-amber-400">
            馆藏分类导航
          </div>
          <p className="text-xs text-stone-400 mt-0.5 font-numeric tabular-nums">
            覆盖 {laws.length} 条心理学定律
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetAllFilters}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] text-amber-300 hover:bg-amber-500/15 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              title="重置所有筛选"
            >
              <RotateCcw className="w-3 h-3 shrink-0" />
              <span>重置</span>
            </button>
          )}
          {isMobile && (
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(false)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
              aria-label="关闭分类侧边栏"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Mode & All Corpus Entry */}
      <div className="space-y-1.5">
        <div className="text-[11px] font-medium text-stone-400 uppercase tracking-[0.12em] px-1">
          全部馆藏视图
        </div>
        <button
          type="button"
          onClick={() => {
            handleSelectAllCorpus();
            if (isMobile) setMobileSidebarOpen(false);
          }}
          className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer ${
            viewMode === 'corpus' && selectedTags.length === 0
              ? 'bg-amber-500/15 border border-amber-400/50 text-amber-200'
              : 'bg-stone-900/70 border border-stone-800/80 text-stone-300 hover:border-stone-700 hover:text-white'
          }`}
        >
          <span className="text-xs font-semibold truncate">全部心智定律 · All Laws</span>
          <span className="text-xs font-numeric tabular-nums text-stone-400 shrink-0">
            {laws.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            handleSectionFilterChange('all');
            if (isMobile) setMobileSidebarOpen(false);
          }}
          className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer ${
            viewMode === 'emotional-archive' && selectedSectionFilter === 'all'
              ? 'bg-amber-500/15 border border-amber-400/50 text-amber-200'
              : 'bg-stone-900/70 border border-stone-800/80 text-stone-300 hover:border-stone-700 hover:text-white'
          }`}
        >
          <span className="text-xs font-semibold truncate">情感 50 精讲 · 五大展框</span>
          <span className="text-xs font-numeric tabular-nums text-stone-400 shrink-0">
            {EMOTIONAL_PSYCHOLOGY_LAWS.length}
          </span>
        </button>
      </div>

      {/* Topic Tags Multi-Select Filter */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-medium text-stone-400 uppercase tracking-[0.12em]">
            专题标签筛选
          </span>
          <span className="text-[11px] text-stone-500">支持多选</span>
        </div>

        <div className="space-y-1.5">
          {LIBRARY_TAG_DEFINITIONS.map((tag) => {
            const active = viewMode === 'corpus' && selectedTags.includes(tag.id);
            const count = tagCounts[tag.id] || 0;

            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => handleToggleTag(tag.id)}
                className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl border text-left transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                  active
                    ? 'bg-amber-500/15 border-amber-400/60 text-white'
                    : 'bg-stone-950/60 border-stone-800/80 text-stone-300 hover:border-stone-700 hover:text-white'
                }`}
                title={tag.description}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 transition-colors ${
                      active
                        ? 'bg-amber-400 border-amber-400 text-stone-950'
                        : 'border-stone-600 bg-transparent'
                    }`}
                    aria-hidden="true"
                  >
                    {active && <Check className="w-3 h-3 stroke-[2.5]" />}
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold truncate">{tag.labelZh}</div>
                    <div className="text-[11px] text-stone-400 truncate">{tag.labelEn}</div>
                  </div>
                </div>

                <span
                  className={`text-xs font-numeric tabular-nums shrink-0 ${
                    active ? 'text-amber-300 font-semibold' : 'text-stone-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Emotional 5-Section Curated Navigation */}
      <div className="space-y-1.5 pt-2 border-t border-stone-800/80">
        <div className="text-[11px] font-medium text-stone-400 uppercase tracking-[0.12em] px-1">
          情感心理学五幕展框
        </div>
        <div className="space-y-1">
          {SECTION_TABS.slice(1).map((tab) => {
            const active =
              viewMode === 'emotional-archive' && selectedSectionFilter === tab.index;
            return (
              <button
                key={String(tab.index)}
                type="button"
                onClick={() => {
                  handleSectionFilterChange(tab.index);
                  if (isMobile) setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                  active
                    ? 'bg-stone-800 text-amber-200 border border-amber-500/40'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900/80 border border-transparent'
                }`}
              >
                <span className="text-xs truncate">
                  0{tab.index}. {tab.label}
                </span>
                <span className="text-[11px] font-numeric tabular-nums text-stone-500 shrink-0">
                  {tab.range}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Difficulty & Bookmarks Filter */}
      <div className="space-y-3 pt-2 border-t border-stone-800/80">
        {viewMode === 'corpus' && (
          <div className="space-y-1.5">
            <div className="text-[11px] font-medium text-stone-400 uppercase tracking-[0.12em] px-1">
              理解难度
            </div>
            <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-stone-950 border border-stone-800">
              {(['all', 'Easy', 'Medium', 'Hard'] as DifficultyFilter[]).map((diff) => {
                const active = difficultyFilter === diff;
                const label = diff === 'all' ? '全部' : diff;
                return (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => {
                      gameAudio.playTap();
                      setDifficultyFilter(diff);
                      setVisibleLimit(PAGE_BATCH_SIZE);
                    }}
                    className={`py-1.5 px-1 rounded-lg text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      active
                        ? 'bg-amber-500 text-stone-950 font-semibold'
                        : 'text-stone-400 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            gameAudio.playTap();
            setOnlyBookmarked((prev) => !prev);
            setVisibleLimit(PAGE_BATCH_SIZE);
          }}
          className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
            onlyBookmarked
              ? 'bg-amber-500 text-stone-950 border-amber-400'
              : 'bg-stone-900/70 text-stone-300 border-stone-800 hover:border-stone-700'
          }`}
        >
          <span className="inline-flex items-center gap-1.5">
            <Bookmark className={`w-3.5 h-3.5 ${onlyBookmarked ? 'fill-stone-950' : ''}`} />
            <span>仅看已收藏定律</span>
          </span>
          <span className="font-numeric tabular-nums">{user.bookmarks.length}</span>
        </button>
      </div>
    </div>
  );

  return (
    <div
      className="space-y-8 pb-24 animate-fadeIn max-w-7xl mx-auto px-1 sm:px-3 text-stone-100 quiz-font-scope"
      data-quiz-font-scale={fontScale}
    >
      {/* 1. Grand Masterpiece Header: Nocturne Gold Foil Canvas */}
      <section className="relative rounded-3xl overflow-hidden art-salon-canvas text-white p-6 sm:p-9 md:p-11 border border-amber-500/35 shadow-[0_25px_60px_rgba(0,0,0,0.75)]">
        <div className="absolute inset-0 opacity-15 pointer-events-none overflow-hidden">
          <svg className="w-full h-full" viewBox="0 0 800 400" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="720" cy="70" r="260" stroke="#F59E0B" strokeWidth="1" strokeDasharray="3 7" />
            <circle cx="720" cy="70" r="180" stroke="#F59E0B" strokeWidth="1.2" />
            <circle cx="720" cy="70" r="100" stroke="#F59E0B" strokeWidth="1.5" />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 sm:gap-8">
          <div className="space-y-3.5 max-w-3xl">
            {/* Unboxed Museum Metadata Kicker */}
            <div className="flex items-center gap-2 flex-wrap text-xs text-amber-300/90 font-medium tracking-wider uppercase">
              <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" aria-hidden="true" />
              <span>Bibliothèque MindLabZ · 心智与情感定律典藏大典</span>
              <span className="text-stone-500" aria-hidden="true">·</span>
              <span className="text-stone-300 font-numeric tabular-nums normal-case">
                收录 {laws.length} 条心理学定律
              </span>
            </div>

            <h1
              className="font-serif-editorial text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-tight text-white"
              style={{ textWrap: 'balance' }}
            >
              全库心理学定律分类索引与情感典藏馆
            </h1>

            <p className="text-xs sm:text-sm text-stone-300 font-normal leading-relaxed">
              支持通过左侧分类侧边栏按逆向心理学、微表情解码、认知偏误、决策博弈与亲密依恋等标签快速筛选 {laws.length}+ 条定律，或切换至「情感 50 精讲五大展框」深度研读。
            </p>

            {/* Clean Unboxed Stats Summary */}
            <div className="pt-1 flex items-center gap-3 sm:gap-4 text-xs font-numeric tabular-nums text-stone-300 flex-wrap">
              <span>
                全馆定律: <strong className="text-amber-300 font-bold">{laws.length} 条</strong>
              </span>
              <span className="text-stone-600" aria-hidden="true">·</span>
              <span>
                情感精讲展框: <strong className="text-white font-bold">50 条深度解析</strong>
              </span>
              <span className="text-stone-600" aria-hidden="true">·</span>
              <span>
                个人收藏: <strong className="text-emerald-300 font-bold">{user.bookmarks.length} 条</strong>
              </span>
            </div>
          </div>

          <div className="shrink-0 flex flex-col items-start md:items-end gap-2">
            <button
              type="button"
              onClick={handleRandomDraw}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-stone-950 font-bold text-xs shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:brightness-110 active:scale-95 transition-all inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer border border-amber-200/40"
            >
              <Sparkles className="w-4 h-4 text-stone-950 shrink-0" />
              <span>抽选启迪定律</span>
            </button>
            <span className="text-[11px] text-stone-400">
              点击任意定律面板展开深度原理
            </span>
          </div>
        </div>
      </section>

      {/* 2. Two-Column Layout: Categorization Sidebar + Main Library Content */}
      <div className="flex flex-col lg:flex-row items-start gap-6 lg:gap-8">
        {/* Desktop Sticky Categorization Sidebar */}
        <aside
          aria-label="定律分类侧边栏"
          className="hidden lg:block w-[280px] shrink-0 sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto no-scrollbar rounded-2xl art-salon-canvas border border-amber-500/25 p-4 shadow-[0_14px_40px_rgba(0,0,0,0.45)]"
        >
          {renderSidebarContent(false)}
        </aside>

        {/* Mobile Categorization Drawer */}
        {mobileSidebarOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="分类标签筛选"
            className="fixed inset-0 z-50 lg:hidden flex"
          >
            <div
              className="fixed inset-0 bg-black/65 backdrop-blur-[2px]"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <aside className="relative z-10 w-[84vw] max-w-xs h-full overflow-y-auto bg-[#120f0d] border-r border-amber-500/30 p-5 shadow-2xl">
              {renderSidebarContent(true)}
            </aside>
          </div>
        )}

        {/* Main Content Workspace */}
        <div className="flex-1 min-w-0 w-full space-y-5">
          {/* Search + View Switcher + Mobile Sidebar Trigger */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(true)}
                className="lg:hidden inline-flex items-center gap-1.5 px-3.5 py-3 rounded-2xl bg-stone-900 border border-amber-500/35 text-amber-300 text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
              >
                <SlidersHorizontal className="w-4 h-4 shrink-0" />
                <span>分类侧边栏</span>
                {selectedTags.length > 0 && (
                  <span className="font-numeric tabular-nums">({selectedTags.length})</span>
                )}
              </button>

              <div className="relative flex-1 min-w-0 group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-amber-400 transition-colors pointer-events-none">
                  <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setVisibleLimit(PAGE_BATCH_SIZE);
                  }}
                  placeholder={`检索 ${laws.length} 条定律（如：逆向心理、微表情、确认偏误、锚定效应、依恋）...`}
                  className="w-full pl-11 pr-10 py-3 bg-stone-900/95 border border-stone-800 focus:border-amber-500/80 focus:ring-2 focus:ring-amber-500/20 rounded-2xl text-xs sm:text-sm font-medium text-white placeholder-stone-500 focus:outline-none transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      gameAudio.playTap();
                      setSearchQuery('');
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs flex items-center justify-center cursor-pointer"
                    aria-label="清空搜索"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Mode Segmented Bar + Active Result Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-stone-900/95 border border-stone-800">
                <button
                  type="button"
                  onClick={() => {
                    gameAudio.playTap();
                    setViewMode('corpus');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    viewMode === 'corpus'
                      ? 'bg-amber-500 text-stone-950'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  全库索引 ({laws.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    gameAudio.playTap();
                    setViewMode('emotional-archive');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    viewMode === 'emotional-archive'
                      ? 'bg-amber-500 text-stone-950'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  情感 50 精讲展框
                </button>
              </div>

              <div className="flex items-center gap-2.5 text-xs text-stone-400 font-numeric tabular-nums flex-wrap">
                {viewMode === 'corpus' ? (
                  <span>
                    匹配结果：<strong className="text-amber-300">{filteredCorpus.length}</strong> / {laws.length} 条
                  </span>
                ) : (
                  <span>
                    展示篇目：<strong className="text-amber-300">{totalEmotionalCount}</strong> / 50 条
                  </span>
                )}

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleResetAllFilters}
                    className="text-amber-400 hover:text-amber-300 font-semibold underline cursor-pointer whitespace-nowrap shrink-0"
                  >
                    重置筛选
                  </button>
                )}
              </div>
            </div>

            {/* Active Topic Filter Strip (interactive removable buttons) */}
            {viewMode === 'corpus' && selectedTags.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap pt-0.5">
                <span className="text-xs text-stone-400">当前标签：</span>
                {selectedTags.map((tagId) => {
                  const def = LIBRARY_TAG_DEFINITIONS.find((d) => d.id === tagId);
                  if (!def) return null;
                  return (
                    <button
                      key={tagId}
                      type="button"
                      onClick={() => handleToggleTag(tagId)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-400/50 text-amber-200 text-xs font-medium hover:bg-amber-500/25 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <span>{def.labelZh} · {def.labelEn}</span>
                      <X className="w-3 h-3 shrink-0" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 3A. CORPUS VIEW: 500+ Filterable Laws */}
          {viewMode === 'corpus' ? (
            <div className="space-y-4">
              {filteredCorpus.length === 0 ? (
                <div className="bg-stone-950/85 border border-stone-800 rounded-3xl p-10 text-center space-y-4">
                  <Compass className="w-10 h-10 text-stone-500 mx-auto" />
                  <div className="text-white font-serif-editorial text-lg font-bold">
                    未检索到符合当前标签组合的定律
                  </div>
                  <p className="text-xs text-stone-400 max-w-md mx-auto">
                    请尝试减少侧边栏筛选标签、调整难度等级或清空搜索关键词。
                  </p>
                  <button
                    type="button"
                    onClick={handleResetAllFilters}
                    className="px-4 py-2 rounded-xl bg-amber-500 text-stone-950 text-xs font-bold hover:brightness-110 transition-all whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    显示全部 {laws.length} 条定律
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {visibleCorpus.map(({ law, primaryTagLabel }) => {
                      const isExpanded = expandedIds.has(law.id);
                      const bookmarked = isBookmarked(law.id);
                      const speaking = globalIsSpeaking && activeLawId === law.id;

                      return (
                        <article
                          key={law.id}
                          id={`corpus-${law.id}`}
                          className={`rounded-2xl transition-colors overflow-hidden relative ${
                            isExpanded
                              ? 'bg-gradient-to-b from-[#17130f] to-[#0e0b09] art-gold-border shadow-[0_12px_36px_rgba(245,158,11,0.14)]'
                              : 'bg-[#120f0c]/95 border border-stone-800/90 hover:border-amber-500/45'
                          }`}
                        >
                          {/* Clickable Accordion Header */}
                          <div
                            onClick={() => toggleExpand(law.id)}
                            className="p-4 sm:p-5 flex items-start justify-between gap-4 cursor-pointer select-none"
                          >
                            <div className="min-w-0 flex-1 space-y-1.5">
                              {/* Clean unboxed archival metadata */}
                              <div className="flex items-center gap-2 flex-wrap text-[11px] font-medium text-stone-400 font-numeric tabular-nums">
                                <span className="text-amber-300 font-semibold">
                                  {law.codeId || 'LAW'}
                                </span>
                                <span aria-hidden="true">·</span>
                                <span className="text-stone-300">{primaryTagLabel}</span>
                                <span aria-hidden="true">·</span>
                                <span>{law.categoryZh}</span>
                                <span aria-hidden="true">·</span>
                                <span>{law.difficulty}</span>
                                {law.actionUnitCode && (
                                  <>
                                    <span aria-hidden="true">·</span>
                                    <span className="text-amber-200">{law.actionUnitCode}</span>
                                  </>
                                )}
                              </div>

                              <div className="flex items-baseline gap-2.5 flex-wrap">
                                <h2 className="font-serif-editorial text-base sm:text-lg font-bold text-white tracking-tight">
                                  <SilverSpeechText
                                    text={law.nameZh}
                                    isSpeaking={speaking}
                                    activeCpIndex={activeCpIndex}
                                    segmentRange={segments.title}
                                    tone="dark"
                                  />
                                </h2>
                                <span className="text-xs text-amber-200/75 font-serif-editorial italic">
                                  {law.nameEn}
                                </span>
                              </div>

                              <p className={`text-xs sm:text-[13px] text-stone-300/90 leading-relaxed ${speaking ? '' : 'line-clamp-2'}`}>
                                “
                                <SilverSpeechText
                                  text={law.shortExplanation}
                                  isSpeaking={speaking}
                                  activeCpIndex={activeCpIndex}
                                  segmentRange={segments.short}
                                  tone="dark"
                                />
                                ”
                              </p>
                            </div>

                            {/* Action Icons */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={(e) => handleSpeakLaw(law, e)}
                                className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                                  speaking
                                    ? 'bg-amber-500/20 border-amber-400/50 text-amber-300'
                                    : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-amber-300 hover:border-stone-700'
                                }`}
                                title={speaking ? '停止朗读' : '语音朗读'}
                                aria-label={speaking ? '停止朗读' : '语音朗读'}
                              >
                                {speaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                              </button>

                              <button
                                type="button"
                                onClick={(e) => handleCopyCorpusQuote(law, e)}
                                className="p-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-400 hover:text-amber-300 hover:border-stone-700 transition-colors cursor-pointer"
                                title="复制启示金句"
                                aria-label="复制启示金句"
                              >
                                {copiedId === law.id ? (
                                  <Check className="w-4 h-4 text-emerald-400" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  gameAudio.playTap();
                                  toggleBookmark(law.id);
                                }}
                                className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                                  bookmarked
                                    ? 'bg-amber-950/80 border-amber-400/60 text-amber-300'
                                    : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200 hover:border-stone-700'
                                }`}
                                title={bookmarked ? '取消收藏' : '收藏此定律'}
                                aria-label={bookmarked ? '取消收藏' : '收藏此定律'}
                              >
                                <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-amber-400' : ''}`} />
                              </button>

                              <div
                                className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-transform duration-300 ${
                                  isExpanded
                                    ? 'rotate-180 bg-amber-500/15 border-amber-400/50 text-amber-300'
                                    : 'bg-stone-900 border-stone-800 text-stone-400'
                                }`}
                              >
                                <ChevronDown className="w-4 h-4" />
                              </div>
                            </div>
                          </div>

                          {/* Expandable Deep Analysis */}
                          <div className={`accordion-smooth-collapse ${isExpanded ? 'is-expanded' : ''}`}>
                            <div className="accordion-smooth-inner">
                              <div className="border-t border-stone-800/90 p-4 sm:p-6 space-y-4 bg-[#0d0b09]/95 text-stone-200">
                                <div className="space-y-1.5">
                                  <div className="text-[11px] uppercase tracking-[0.12em] text-amber-300 font-semibold">
                                    深度解析 · 心理机制
                                  </div>
                                  <p className="text-xs sm:text-sm text-stone-200 leading-relaxed">
                                    <SilverSpeechText
                                      text={law.detailedExplanation}
                                      isSpeaking={speaking}
                                      activeCpIndex={activeCpIndex}
                                      segmentRange={segments.detail}
                                      tone="dark"
                                    />
                                  </p>
                                  {law.whyItHappens && (
                                    <p className="text-xs text-stone-400 leading-relaxed pt-1">
                                      神经与认知成因：{law.whyItHappens}
                                    </p>
                                  )}
                                </div>

                                {law.realLifeExample && (
                                  <div className="p-3.5 sm:p-4 rounded-xl bg-stone-900/80 border border-stone-800 space-y-1">
                                    <div className="text-[11px] font-semibold text-amber-300">
                                      现实案例观察
                                    </div>
                                    <p className="text-xs sm:text-[13px] text-stone-300 leading-relaxed">
                                      <SilverSpeechText
                                        text={law.realLifeExample}
                                        isSpeaking={speaking}
                                        activeCpIndex={activeCpIndex}
                                        segmentRange={segments.example}
                                        tone="dark"
                                      />
                                    </p>
                                  </div>
                                )}

                                <div className="p-3.5 sm:p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-1.5">
                                  <div className="text-[11px] font-semibold text-amber-300">
                                    实践启示与元认知边界
                                  </div>
                                  <p className="text-xs sm:text-[13px] text-amber-100 leading-relaxed font-medium">
                                    <SilverSpeechText
                                      text={law.healthyBoundary || law.keyTakeaway}
                                      isSpeaking={speaking}
                                      activeCpIndex={activeCpIndex}
                                      segmentRange={segments.takeaway}
                                      tone="dark"
                                    />
                                  </p>
                                </div>

                                <div className="pt-2 flex items-center justify-between gap-3 flex-wrap border-t border-stone-800/80">
                                  <span className="text-[11px] text-stone-400 truncate max-w-md">
                                    {law.chapter || 'MindLabZ 心智档案馆'}
                                  </span>

                                  <div className="flex items-center gap-2 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => toggleExpand(law.id)}
                                      className="px-3 py-1.5 rounded-xl border border-stone-800 text-stone-400 hover:text-white text-xs whitespace-nowrap shrink-0 cursor-pointer"
                                    >
                                      收起
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        gameAudio.playTap();
                                        navigate(`/law/${law.id}`);
                                      }}
                                      className="px-4 py-1.5 rounded-xl bg-amber-500 hover:brightness-110 text-stone-950 font-bold text-xs inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                                    >
                                      <span>进入完整解析与测验</span>
                                      <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Always-visible Bottom-Right Voice Switch Footer */}
                          <div className="px-4 sm:px-5 py-2.5 border-t border-stone-800/70 bg-[#0c0907]/90 flex items-center justify-between gap-2">
                            <span className="text-[10.5px] text-stone-500 font-numeric">
                              {speaking ? '银字实时跟读定位中...' : '点击右下角开关，银字跟读此定律'}
                            </span>
                            <LawVoiceToggleSwitch
                              isOn={speaking}
                              onToggle={(e) => handleSpeakLaw(law, e)}
                              tone="dark"
                              size="sm"
                            />
                          </div>
                        </article>
                      );
                    })}
                  </div>

                  {/* Pagination / Load More */}
                  {visibleCorpus.length < filteredCorpus.length && (
                    <div className="pt-4 flex flex-col items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          gameAudio.playTap();
                          setVisibleLimit((prev) => prev + PAGE_BATCH_SIZE);
                        }}
                        className="px-6 py-2.5 rounded-xl bg-stone-900 border border-amber-500/40 text-amber-300 hover:bg-amber-500/15 transition-colors text-xs font-semibold font-numeric tabular-nums whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        加载更多定律（已显示 {visibleCorpus.length} / {filteredCorpus.length} 条）
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            /* 3B. CURATED 5-SECTION EMOTIONAL ARCHIVE (50 Deep-Dive Plates) */
            <div className="space-y-8">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                  {SECTION_TABS.map((tab) => {
                    const isSelected = selectedSectionFilter === tab.index;
                    return (
                      <button
                        key={String(tab.index)}
                        type="button"
                        onClick={() => handleSectionFilterChange(tab.index)}
                        className={`text-xs font-bold px-3.5 py-2 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-2 ${
                          isSelected
                            ? 'text-stone-950 bg-amber-400'
                            : 'bg-stone-900/90 text-stone-300 border border-stone-800 hover:border-stone-700'
                        }`}
                      >
                        <span>{tab.label}</span>
                        <span className="text-[11px] font-numeric tabular-nums opacity-80">
                          {tab.range}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 shrink-0 text-xs">
                  <button
                    type="button"
                    onClick={() => handleToggleAllEmotional(true)}
                    className="px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-800 hover:border-amber-500/50 text-stone-300 hover:text-amber-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer text-[11px]"
                  >
                    全部展开
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleAllEmotional(false)}
                    className="px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-800 hover:border-stone-700 text-stone-400 hover:text-stone-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer text-[11px]"
                  >
                    全部折叠
                  </button>
                </div>
              </div>

              {activeSectionMeta && !searchQuery && (
                <div
                  className="rounded-3xl p-5 sm:p-6 border relative overflow-hidden"
                  style={{
                    borderColor: `${activeSectionMeta.theme.primary}50`,
                    background: `radial-gradient(circle at 10% 20%, ${activeSectionMeta.theme.primary}20 0%, rgba(12, 10, 9, 0.95) 70%)`,
                  }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1.5 max-w-2xl">
                      <div className="text-xs text-amber-300 font-numeric">
                        PART 0{activeSectionMeta.index} · {activeSectionMeta.en} · 收录 {activeSectionMeta.lawRange}
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
                      type="button"
                      onClick={() => handleSectionFilterChange('all')}
                      className="shrink-0 px-4 py-2 rounded-xl bg-stone-900 text-amber-300 border border-amber-500/40 text-xs font-bold hover:bg-stone-800 transition-colors whitespace-nowrap cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <span>查看全部 5 大板块</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {groupedSections.length === 0 ? (
                <div className="bg-stone-950/80 border border-stone-800/80 rounded-3xl p-12 text-center space-y-4">
                  <Compass className="w-12 h-12 text-stone-600 mx-auto" />
                  <div className="text-white font-serif text-lg">未检索到匹配的情感定律</div>
                  <button
                    type="button"
                    onClick={handleResetAllFilters}
                    className="px-4 py-2 rounded-xl bg-amber-500 text-stone-950 text-xs font-bold hover:brightness-110 transition-all cursor-pointer"
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
                      className="relative rounded-3xl overflow-hidden art-salon-canvas p-5 sm:p-8 border border-amber-500/30 shadow-[0_15px_40px_rgba(0,0,0,0.55)] space-y-6"
                    >
                      <div
                        className="absolute top-0 left-0 right-0 h-[3px]"
                        style={{
                          background: `linear-gradient(90deg, transparent 0%, ${secMeta.theme.primary} 50%, transparent 100%)`,
                        }}
                      />

                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-stone-800/80">
                        <div className="space-y-2">
                          <div className="text-xs font-numeric text-amber-300/85">
                            PART 0{secMeta.index} · {secMeta.en} · 收录规律 {secMeta.lawRange}
                          </div>
                          <h2 className="font-serif-editorial text-xl sm:text-2xl font-bold text-white tracking-tight">
                            {secMeta.title}
                          </h2>
                          <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-serif italic max-w-3xl">
                            “{secMeta.subtitle}”
                          </p>
                          <p className="text-xs text-stone-400 leading-relaxed max-w-3xl">
                            {secMeta.description}
                          </p>
                        </div>

                        <span className="font-numeric tabular-nums text-xs px-3 py-1 rounded-xl bg-stone-900 border border-stone-800 text-stone-300 shrink-0 self-start">
                          本板块共 <strong className="text-amber-400 font-bold">{group.laws.length}</strong> 条
                        </span>
                      </div>

                      <div className="space-y-3.5">
                        {group.laws.map((law) => {
                          const isExpanded = expandedIds.has(law.id);
                          const bookmarked = isBookmarked(law.id);
                          const speakingEmo = globalIsSpeaking && activeLawId === law.id;

                          return (
                            <div
                              key={law.id}
                              id={law.id}
                              className={`group/card rounded-2xl transition-all duration-300 overflow-hidden relative ${
                                isExpanded
                                  ? 'bg-gradient-to-b from-[#16120e] via-[#120f0d] to-[#0d0b0a] art-gold-border shadow-[0_12px_40px_rgba(245,158,11,0.16)]'
                                  : 'bg-[#100d0b]/85 border border-stone-800/90 hover:border-amber-500/45'
                              }`}
                            >
                              <div
                                onClick={() => toggleExpand(law.id)}
                                className="p-4 sm:p-5 flex items-start sm:items-center justify-between gap-4 cursor-pointer select-none"
                              >
                                <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl shrink-0 flex flex-col items-center justify-center font-numeric font-bold text-xs border art-gold-border bg-amber-500/10">
                                    <span className="text-[9px] uppercase text-amber-300/80">NO.</span>
                                    <span className="text-sm font-extrabold leading-none art-gold-text">
                                      {String(law.order).padStart(2, '0')}
                                    </span>
                                  </div>

                                  <div className="min-w-0 flex-1 space-y-1">
                                    <div className="flex items-baseline gap-2 flex-wrap">
                                      <h3 className="text-base sm:text-lg font-bold text-white font-serif tracking-tight">
                                        <SilverSpeechText
                                          text={law.titleZh}
                                          isSpeaking={speakingEmo}
                                          activeCpIndex={activeCpIndex}
                                          segmentRange={segments.title}
                                          tone="dark"
                                        />
                                      </h3>
                                      <span className="text-xs text-amber-200/70 font-serif-editorial italic hidden md:inline">
                                        {law.titleEn}
                                      </span>
                                    </div>

                                    <p className={`text-xs text-stone-300/85 font-serif ${speakingEmo ? '' : 'line-clamp-1'}`}>
                                      “
                                      <SilverSpeechText
                                        text={law.corePrinciple}
                                        isSpeaking={speakingEmo}
                                        activeCpIndex={activeCpIndex}
                                        segmentRange={segments.core}
                                        tone="dark"
                                      />
                                      ”
                                    </p>

                                    <div className="text-[11px] text-amber-300/75 font-numeric truncate">
                                      {law.keywords.join(' · ')}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <button
                                    type="button"
                                    onClick={(e) => handleCopyEmotionalQuote(law, e)}
                                    className="p-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-400 hover:text-amber-300 transition-colors cursor-pointer"
                                    title="复制启示金句"
                                  >
                                    {copiedId === law.id ? (
                                      <Check className="w-4 h-4 text-emerald-400" />
                                    ) : (
                                      <Copy className="w-4 h-4" />
                                    )}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      gameAudio.playTap();
                                      toggleBookmark(law.id);
                                    }}
                                    className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                                      bookmarked
                                        ? 'bg-amber-950/80 art-gold-border text-amber-300'
                                        : 'bg-stone-900 border-stone-800 text-stone-500 hover:text-stone-300'
                                    }`}
                                    title={bookmarked ? '取消收藏' : '收藏此定律'}
                                  >
                                    <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-amber-400' : ''}`} />
                                  </button>

                                  <div
                                    className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-transform duration-300 ${
                                      isExpanded
                                        ? 'rotate-180 bg-amber-500/15 art-gold-text art-gold-border'
                                        : 'bg-stone-900 border-stone-800 text-stone-400'
                                    }`}
                                  >
                                    <ChevronDown className="w-4 h-4" />
                                  </div>
                                </div>
                              </div>

                              <div className={`accordion-smooth-collapse ${isExpanded ? 'is-expanded' : ''}`}>
                                <div className="accordion-smooth-inner">
                                  <div className="border-t border-amber-500/25 p-5 sm:p-7 space-y-5 text-stone-200 bg-[#0d0a08]">
                                    <div className="rounded-2xl p-4 sm:p-5 bg-stone-900/80 art-gold-border">
                                      <div className="text-[10px] tracking-widest art-gold-text font-bold uppercase flex items-center gap-1.5 mb-2">
                                        <Sparkle className="w-3.5 h-3.5 text-amber-400" />
                                        <span>核心定律原理 · CORE LAW PRINCIPLE</span>
                                      </div>
                                      <p className="text-sm sm:text-base text-amber-50 font-serif font-medium leading-relaxed">
                                        “
                                        <SilverSpeechText
                                          text={law.corePrinciple}
                                          isSpeaking={speakingEmo}
                                          activeCpIndex={activeCpIndex}
                                          segmentRange={segments.core}
                                          tone="dark"
                                        />
                                        ”
                                      </p>
                                    </div>

                                    <div className="space-y-3">
                                      <div className="text-xs art-gold-text uppercase tracking-wider font-bold">
                                        心理机制与认知逻辑拆解
                                      </div>
                                      <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
                                        <SilverSpeechText
                                          text={law.deepBreakdown.mechanism}
                                          isSpeaking={speakingEmo}
                                          activeCpIndex={activeCpIndex}
                                          segmentRange={segments.mechanism}
                                          tone="dark"
                                        />
                                      </p>

                                      {law.deepBreakdown.insights.length > 0 && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                          {law.deepBreakdown.insights.map((ins, i) => (
                                            <div
                                              key={i}
                                              className="p-3.5 rounded-xl bg-stone-900/90 border border-amber-500/20 text-xs text-stone-200 flex items-start gap-2.5"
                                            >
                                              <span className="font-numeric art-gold-text font-bold shrink-0">
                                                0{i + 1}.
                                              </span>
                                              <span className="leading-relaxed">{ins}</span>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>

                                    <div className="space-y-2.5 rounded-2xl p-4 sm:p-5 bg-stone-950/80 border border-amber-500/25">
                                      <div className="flex items-center gap-2 text-xs font-bold art-gold-text">
                                        <Heart className="w-3.5 h-3.5 text-rose-400" />
                                        <span>真实生活案例：{law.lifeCase.title}</span>
                                      </div>
                                      <p className="text-xs sm:text-sm text-stone-200 leading-relaxed font-serif italic">
                                        “
                                        <SilverSpeechText
                                          text={law.lifeCase.scenario}
                                          isSpeaking={speakingEmo}
                                          activeCpIndex={activeCpIndex}
                                          segmentRange={segments.case}
                                          tone="dark"
                                        />
                                        ”
                                      </p>
                                      {law.lifeCase.analysis && (
                                        <p className="text-xs text-stone-300/85 pt-2 border-t border-stone-800/80 leading-relaxed">
                                          <strong className="art-gold-text mr-1.5">案例心理透视：</strong>
                                          {law.lifeCase.analysis}
                                        </p>
                                      )}
                                    </div>

                                    <div className="space-y-3 p-4 sm:p-5 rounded-2xl bg-amber-950/20 art-gold-border">
                                      <div className="flex items-center justify-between text-xs flex-wrap gap-2">
                                        <span className="font-bold art-gold-text flex items-center gap-1.5">
                                          <Award className="w-4 h-4 text-amber-400" />
                                          <span>现实行动启示与心智方案</span>
                                        </span>
                                        {law.practicalTakeaways.keyDistinction && (
                                          <span className="text-[11px] font-serif italic text-amber-200">
                                            {law.practicalTakeaways.keyDistinction}
                                          </span>
                                        )}
                                      </div>

                                      <p className="text-xs sm:text-sm text-amber-100 font-medium leading-relaxed font-serif">
                                        <SilverSpeechText
                                          text={law.practicalTakeaways.summary}
                                          isSpeaking={speakingEmo}
                                          activeCpIndex={activeCpIndex}
                                          segmentRange={segments.summary}
                                          tone="dark"
                                        />
                                      </p>

                                      <div className="space-y-2 pt-1">
                                        {law.practicalTakeaways.actionablePoints.map((point, i) => (
                                          <div key={i} className="flex items-start gap-2 text-xs text-stone-200">
                                            <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                                            <span className="leading-relaxed">{point}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                    {law.boundary && (
                                      <div className="text-xs text-amber-200/90 p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20">
                                        <strong className="art-gold-text mr-1.5">适用边界与误区警示：</strong>
                                        <span className="leading-relaxed">{law.boundary}</span>
                                      </div>
                                    )}

                                    <div className="pt-3 flex items-center justify-between gap-3 flex-wrap border-t border-stone-800/80">
                                      <div className="text-[11px] text-amber-300/70 font-numeric">
                                        馆藏编号：LAW-EMO-{String(law.order).padStart(2, '0')}
                                      </div>

                                      <div className="flex items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={() => toggleExpand(law.id)}
                                          className="px-3.5 py-1.5 rounded-xl border border-stone-800 text-stone-400 hover:text-amber-200 text-xs whitespace-nowrap shrink-0 cursor-pointer"
                                        >
                                          收起面板
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            gameAudio.playTap();
                                            navigate('/learn');
                                          }}
                                          className="px-4 py-1.5 rounded-xl bg-amber-500 hover:brightness-110 text-stone-950 font-bold text-xs inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                                        >
                                          <span>在主画廊中研习 & 测验</span>
                                          <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Always-visible Bottom-Right Voice Switch Footer */}
                              <div className="px-4 sm:px-5 py-2.5 border-t border-stone-800/70 bg-[#0b0907]/90 flex items-center justify-between gap-2">
                                <span className="text-[10.5px] text-stone-500 font-numeric">
                                  {speakingEmo ? '银字实时跟读定位中...' : '打开右下角开关，语音朗读并银色高亮字迹'}
                                </span>
                                <LawVoiceToggleSwitch
                                  isOn={speakingEmo}
                                  onToggle={(e) => handleSpeakEmotionalLaw(law, e)}
                                  tone="dark"
                                  size="sm"
                                />
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
          )}
        </div>
      </div>

      <FloatingFontScaleControl tone="dark" title="情感定律库字号" />
    </div>
  );
};

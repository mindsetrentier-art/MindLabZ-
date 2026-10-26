import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Search,
  ChevronDown,
  ChevronUp,
  Bookmark,
  Share2,
  Compass,
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
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  EMOTIONAL_PSYCHOLOGY_LAWS,
  EMOTIONAL_SECTIONS,
  EmotionalPsychologyLaw,
} from '../data/emotionalLaws';
import { gameAudio } from '../utils/gameAudio';

export const EmotionalLawsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, toggleBookmark } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState<number | 'all'>('all');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(['emo-01'])); // First one expanded by default
  const [onlyBookmarked, setOnlyBookmarked] = useState(false);
  const [epiphanyLaw, setEpiphanyLaw] = useState<EmotionalPsychologyLaw | null>(null);

  // Toggle single accordion
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

  // Expand all or Collapse all
  const handleToggleAll = (expand: boolean) => {
    gameAudio.playTap();
    if (expand) {
      setExpandedIds(new Set(EMOTIONAL_PSYCHOLOGY_LAWS.map((l) => l.id)));
    } else {
      setExpandedIds(new Set());
    }
  };

  // Filtered laws
  const filteredLaws = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return EMOTIONAL_PSYCHOLOGY_LAWS.filter((law) => {
      const matchesSearch =
        !q ||
        law.titleZh.toLowerCase().includes(q) ||
        law.titleEn.toLowerCase().includes(q) ||
        law.corePrinciple.toLowerCase().includes(q) ||
        law.keywords.some((k) => k.toLowerCase().includes(q)) ||
        law.deepBreakdown.mechanism.toLowerCase().includes(q);

      const matchesSection = selectedSection === 'all' || law.sectionIndex === selectedSection;
      const matchesBookmark = !onlyBookmarked || user.bookmarks.includes(law.id);

      return matchesSearch && matchesSection && matchesBookmark;
    });
  }, [searchQuery, selectedSection, onlyBookmarked, user.bookmarks]);

  // Random epiphany discovery
  const triggerRandomEpiphany = () => {
    gameAudio.playSuccess();
    const randomIndex = Math.floor(Math.random() * EMOTIONAL_PSYCHOLOGY_LAWS.length);
    const chosen = EMOTIONAL_PSYCHOLOGY_LAWS[randomIndex];
    setEpiphanyLaw(chosen);
    setExpandedIds((prev) => new Set(prev).add(chosen.id));
  };

  return (
    <div className="space-y-8 sm:space-y-10 pb-20 animate-fadeIn max-w-5xl mx-auto">
      {/* 1. Grand Masterpiece Header: Museum Nocturne & Gold Foil Canvas */}
      <section className="relative rounded-3xl overflow-hidden art-salon-canvas text-white p-6 sm:p-10 md:p-12 border border-amber-500/30 shadow-[0_20px_50px_rgba(0,0,0,0.7)] transition-all">
        {/* Subtle Decorative Golden Ratio Geometry */}
        <div className="absolute inset-0 opacity-15 pointer-events-none overflow-hidden">
          <svg className="w-full h-full" viewBox="0 0 800 400" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="720" cy="70" r="260" stroke="#F59E0B" strokeWidth="1" strokeDasharray="3 7" />
            <circle cx="720" cy="70" r="180" stroke="#F59E0B" strokeWidth="1.2" />
            <circle cx="720" cy="70" r="100" stroke="#F59E0B" strokeWidth="1.5" />
            <path d="M450,300 C580,120 720,30 850,30" stroke="#EC4899" strokeWidth="1.2" strokeDasharray="4 6" />
          </svg>
        </div>

        {/* Ambient Chromatic Glow Orbs */}
        <div className="absolute -top-24 -right-20 w-96 h-96 rounded-full bg-gradient-to-br from-amber-500/25 via-rose-600/20 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-20 w-96 h-96 rounded-full bg-gradient-to-tr from-purple-600/25 via-emerald-500/15 to-transparent blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 sm:gap-8">
          <div className="space-y-4 max-w-2xl">
            {/* Museum Catalog Tag */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-400/30 font-semibold tracking-wider text-[11px] shadow-sm font-mono">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>SALON D'ÉMOTION · 情感心理学珍藏</span>
              </span>
              <span className="text-stone-500 text-xs">/</span>
              <span className="text-amber-200/80 text-xs font-mono tracking-widest uppercase">
                50 CORE LAWS · 全五部曲
              </span>
            </div>

            {/* Title with Gold Gradient Text */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-tight text-white font-serif">
              情感心理学 50 条定律 · 深度典藏馆
            </h1>

            {/* Editorial Dek */}
            <p className="text-xs sm:text-sm text-stone-300/90 leading-relaxed font-sans">
              深度理解爱情、人性、依恋与亲密关系。系统拆解心动机制、情绪依恋、冲突化解、丧失哀伤与长久滋养，提供科学心理学底层原理、生活实案与行动边界。
            </p>

            {/* Stats Badge Row */}
            <div className="pt-1 flex items-center gap-3 sm:gap-4 text-xs font-mono text-stone-300 flex-wrap">
              <span className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl backdrop-blur-xs">
                <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                <span>珍藏篇卷:</span>
                <strong className="text-amber-300 font-bold">50 篇</strong>
              </span>
              <span className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl backdrop-blur-xs">
                <span className="w-2 h-2 rounded-full bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
                <span>核心维度:</span>
                <strong className="text-rose-300 font-bold">5 大篇章</strong>
              </span>
              <span className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl backdrop-blur-xs">
                <span className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                <span>已收藏:</span>
                <strong className="text-purple-300 font-bold">
                  {user.bookmarks.filter((b) => b.startsWith('emo-')).length} 篇
                </strong>
              </span>
            </div>
          </div>

          {/* Action Button: Epiphany Random Discovery */}
          <div className="shrink-0 flex flex-col sm:flex-row md:flex-col items-center gap-3">
            <button
              onClick={triggerRandomEpiphany}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-stone-950 font-bold text-xs sm:text-sm shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer border border-amber-300/40"
            >
              <Sparkles className="w-4 h-4 text-stone-950 animate-pulse" />
              <span>抽签启示 · 随机顿悟</span>
            </button>

            <button
              onClick={() => navigate('/learn')}
              className="w-full sm:w-auto px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-stone-300 hover:text-white text-xs border border-white/15 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-stone-400" />
              <span>切换 100 心智全景馆</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* 2. Five Curated Sections Selector with Metallic Accent Frames */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-mono text-stone-400 tracking-wider uppercase flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5 text-amber-500" />
            <span>展厅篇章主题分类</span>
          </h2>
          <span className="text-xs text-stone-500 font-mono">
            {selectedSection === 'all' ? '当前：全部 50 律' : `当前：第 ${selectedSection} 篇章`}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
          <button
            onClick={() => {
              gameAudio.playTap();
              setSelectedSection('all');
            }}
            className={`p-3 rounded-2xl text-left border transition-all cursor-pointer relative overflow-hidden ${
              selectedSection === 'all'
                ? 'bg-stone-900 border-amber-400/80 shadow-[0_0_15px_rgba(245,158,11,0.25)] text-white'
                : 'bg-stone-950/40 border-stone-800 hover:border-stone-700 text-stone-400 hover:text-stone-200'
            }`}
          >
            <div className="text-[10px] font-mono tracking-widest text-stone-500 uppercase">ALL 50</div>
            <div className="font-bold text-xs mt-0.5 font-serif">全景大成</div>
            <div className="text-[10px] text-stone-500 mt-1">共 50 条定律</div>
            {selectedSection === 'all' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-400 to-amber-600" />
            )}
          </button>

          {EMOTIONAL_SECTIONS.map((sec) => {
            const isSelected = selectedSection === sec.index;
            return (
              <button
                key={sec.index}
                onClick={() => {
                  gameAudio.playTap();
                  setSelectedSection(sec.index);
                }}
                className={`p-3 rounded-2xl text-left border transition-all cursor-pointer relative overflow-hidden ${
                  isSelected
                    ? `bg-stone-900 ${sec.theme.border} ${sec.theme.glow} text-white`
                    : 'bg-stone-950/40 border-stone-800 hover:border-stone-700 text-stone-400 hover:text-stone-200'
                }`}
              >
                <div
                  className="text-[10px] font-mono tracking-widest font-semibold"
                  style={{ color: isSelected ? sec.theme.primary : '#78716c' }}
                >
                  PART {sec.index} · {sec.lawRange}
                </div>
                <div className="font-bold text-xs mt-0.5 line-clamp-1 font-serif text-stone-200">
                  {sec.title.split('：')[1] || sec.title}
                </div>
                <div className="text-[10px] text-stone-500 mt-1 line-clamp-1">{sec.en}</div>
                {isSelected && (
                  <div
                    className="absolute bottom-0 left-0 right-0 h-0.5"
                    style={{ backgroundColor: sec.theme.primary }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. Search Bar & Controls Bar with Metallic Framing */}
      <section className="bg-stone-950/80 border border-stone-800/80 rounded-2xl p-3 sm:p-4 shadow-xl backdrop-blur-md flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索 50 条定律名称、英文名、核心原理或关键词（如吊桥效应、多巴胺、依恋...）"
            className="w-full bg-stone-900/90 border border-stone-700/60 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-stone-500 focus:outline-hidden focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 transition-all font-sans"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white text-xs px-1.5 py-0.5 rounded-sm bg-stone-800"
            >
              清空
            </button>
          )}
        </div>

        {/* Filter Badges & Batch Actions */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-between md:justify-end">
          <button
            onClick={() => {
              gameAudio.playTap();
              setOnlyBookmarked(!onlyBookmarked);
            }}
            className={`px-3 py-2 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-all cursor-pointer ${
              onlyBookmarked
                ? 'bg-purple-950/60 border-purple-400 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${onlyBookmarked ? 'fill-purple-400' : ''}`} />
            <span>仅看已收藏</span>
          </button>

          <button
            onClick={() => handleToggleAll(true)}
            className="px-2.5 py-2 rounded-xl text-xs font-medium bg-stone-900 border border-stone-800 text-stone-300 hover:text-white hover:border-stone-700 transition-all cursor-pointer"
          >
            展开全部
          </button>

          <button
            onClick={() => handleToggleAll(false)}
            className="px-2.5 py-2 rounded-xl text-xs font-medium bg-stone-900 border border-stone-800 text-stone-300 hover:text-white hover:border-stone-700 transition-all cursor-pointer"
          >
            折叠全部
          </button>
        </div>
      </section>

      {/* 4. Filter Results Count Indicator */}
      <div className="flex items-center justify-between text-xs text-stone-400 px-1 font-mono">
        <span>
          展品展示：<strong className="text-amber-400">{filteredLaws.length}</strong> / 50 篇
        </span>
        <span className="text-[11px] text-stone-500">
          点击每一条定律展开深度拆解、案例与启示
        </span>
      </div>

      {/* 5. The 50 Laws Accordion Showcase */}
      <section className="space-y-4">
        {filteredLaws.length === 0 ? (
          <div className="bg-stone-950/60 border border-stone-800/80 rounded-3xl p-12 text-center space-y-4">
            <Compass className="w-12 h-12 text-stone-600 mx-auto animate-pulse" />
            <div className="text-white font-serif text-lg">暂无匹配的情感定律</div>
            <p className="text-xs text-stone-400 max-w-md mx-auto">
              未找到与 "{searchQuery}" 相关的定律。请尝试更换关键词，或切换全部篇章展厅。
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedSection('all');
                setOnlyBookmarked(false);
              }}
              className="px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold hover:bg-amber-500/30 transition-all cursor-pointer"
            >
              重置所有筛选
            </button>
          </div>
        ) : (
          filteredLaws.map((law) => {
            const isExpanded = expandedIds.has(law.id);
            const isBookmarked = user.bookmarks.includes(law.id);
            const sectionMeta = EMOTIONAL_SECTIONS[law.sectionIndex - 1];

            return (
              <div
                key={law.id}
                id={law.id}
                className={`group rounded-2xl transition-all duration-300 overflow-hidden border ${
                  isExpanded
                    ? 'bg-stone-950/95 border-amber-500/40 shadow-[0_10px_35px_rgba(0,0,0,0.6)] ring-1 ring-amber-500/20'
                    : 'bg-stone-950/60 border-stone-800/80 hover:border-stone-700/80 hover:bg-stone-900/40'
                }`}
              >
                {/* Accordion Header / Summary Bar */}
                <div
                  onClick={() => toggleExpand(law.id)}
                  className="p-4 sm:p-5 flex items-start sm:items-center justify-between gap-4 cursor-pointer select-none"
                >
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                    {/* Gilded Roman / Order Badge */}
                    <div
                      className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl shrink-0 flex flex-col items-center justify-center font-mono font-bold text-xs border shadow-inner transition-transform group-hover:scale-105"
                      style={{
                        backgroundColor: `${sectionMeta.theme.primary}15`,
                        borderColor: `${sectionMeta.theme.primary}40`,
                        color: sectionMeta.theme.primary,
                      }}
                    >
                      <span className="text-[9px] uppercase tracking-tighter opacity-70">LAW</span>
                      <span className="text-sm font-bold leading-none">
                        {String(law.order).padStart(2, '0')}
                      </span>
                    </div>

                    {/* Law Titles & Core Teaser */}
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-stone-800/90 text-stone-300 border border-stone-700/60 text-[10px]">
                          Part {law.sectionIndex} · {law.sectionTitle.split('：')[1]}
                        </span>
                        <h3 className="text-base sm:text-lg font-bold text-white font-serif tracking-tight group-hover:text-amber-300 transition-colors">
                          {law.titleZh}
                        </h3>
                        <span className="text-xs text-stone-400 font-mono italic hidden md:inline">
                          ({law.titleEn})
                        </span>
                      </div>

                      {/* Teaser principle preview */}
                      <p className="text-xs text-stone-300/80 line-clamp-1 font-sans">
                        {law.corePrinciple}
                      </p>

                      {/* Keywords pill row */}
                      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                        {law.keywords.map((kw, i) => (
                          <span
                            key={i}
                            className="text-[10px] px-2 py-0.5 rounded-full bg-stone-900 border border-stone-800 text-stone-400 font-mono"
                          >
                            #{kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Header Actions: Bookmark & Chevron */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        gameAudio.playTap();
                        toggleBookmark(law.id);
                      }}
                      className={`p-2 rounded-xl border transition-all cursor-pointer ${
                        isBookmarked
                          ? 'bg-purple-950/70 border-purple-400 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                          : 'bg-stone-900/80 border-stone-800 text-stone-500 hover:text-stone-300'
                      }`}
                      title={isBookmarked ? '取消收藏' : '收藏此定律'}
                    >
                      <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-purple-400' : ''}`} />
                    </button>

                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center border border-stone-800 text-stone-400 transition-transform duration-300 ${
                        isExpanded ? 'rotate-180 bg-amber-500/10 text-amber-300 border-amber-500/30' : 'bg-stone-900/60'
                      }`}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Collapsible Smooth Transition Body */}
                <div className={`accordion-smooth-collapse ${isExpanded ? 'is-expanded' : ''}`}>
                  <div className="accordion-smooth-inner">
                    <div className="border-t border-stone-800/80 p-5 sm:p-7 space-y-6 text-stone-200 bg-gradient-to-b from-stone-900/40 via-stone-950/70 to-stone-950">
                    {/* 1. Core Principle Master Plate */}
                    <div className="relative rounded-2xl p-4 sm:p-5 bg-gradient-to-r from-stone-900/90 via-stone-900/60 to-stone-900/90 border border-amber-500/30 shadow-md">
                      <div className="text-[10px] font-mono tracking-widest text-amber-400 font-bold uppercase flex items-center gap-1.5 mb-2">
                        <Sparkle className="w-3.5 h-3.5 text-amber-400" />
                        <span>核心原理 · CORE PRINCIPLE</span>
                      </div>
                      <p className="text-sm sm:text-base text-amber-100/95 font-medium leading-relaxed font-serif">
                        {law.corePrinciple}
                      </p>
                    </div>

                    {/* 2. Deep Breakdown & Neural Mechanism */}
                    <div className="space-y-3">
                      <div className="text-xs font-mono text-stone-400 uppercase tracking-wider flex items-center gap-2">
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                        <span>深度拆解 · 心理与神经机制</span>
                      </div>
                      <div className="bg-stone-900/40 border border-stone-800/80 rounded-2xl p-4 sm:p-5 space-y-3">
                        <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
                          {law.deepBreakdown.mechanism}
                        </p>
                        <div className="space-y-2 pt-2 border-t border-stone-800/60">
                          {law.deepBreakdown.insights.map((insight, idx) => (
                            <div key={idx} className="flex items-start gap-2.5 text-xs text-stone-300/90">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-1.5" />
                              <span className="leading-relaxed">{insight}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* 3. Real Life Case Study Frame */}
                    <div className="space-y-3">
                      <div className="text-xs font-mono text-stone-400 uppercase tracking-wider flex items-center gap-2">
                        <MessageSquare className="w-3.5 h-3.5 text-rose-400" />
                        <span>现实生活案例 · {law.lifeCase.title}</span>
                      </div>
                      <div className="bg-stone-900/30 border border-stone-800/70 rounded-2xl p-4 sm:p-5 space-y-2.5">
                        <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-sans">
                          {law.lifeCase.scenario}
                        </p>
                        {law.lifeCase.analysis && (
                          <div className="p-3 rounded-xl bg-stone-950/70 border border-white/5 text-xs text-rose-200/90 leading-relaxed">
                            <strong className="text-rose-300 font-semibold font-serif">深度解析：</strong>
                            {law.lifeCase.analysis}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 4. Practical Takeaways & Distinction */}
                    <div className="space-y-3">
                      <div className="text-xs font-mono text-stone-400 uppercase tracking-wider flex items-center gap-2">
                        <Award className="w-3.5 h-3.5 text-emerald-400" />
                        <span>现实启示与行动准则 · PRACTICAL TAKEAWAYS</span>
                      </div>
                      <div className="bg-stone-900/40 border border-stone-800/80 rounded-2xl p-4 sm:p-5 space-y-3">
                        <p className="text-xs sm:text-sm text-stone-200 font-medium">
                          {law.practicalTakeaways.summary}
                        </p>
                        <ul className="space-y-2 text-xs text-stone-300">
                          {law.practicalTakeaways.actionablePoints.map((pt, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-emerald-400 font-bold shrink-0">✓</span>
                              <span className="leading-relaxed">{pt}</span>
                            </li>
                          ))}
                        </ul>
                        {law.practicalTakeaways.keyDistinction && (
                          <div className="mt-2 pt-2.5 border-t border-stone-800 text-xs font-serif italic text-amber-200/90 bg-amber-500/5 p-3 rounded-xl border border-amber-500/20">
                            <strong>关键区别：</strong> {law.practicalTakeaways.keyDistinction}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 5. Boundary & Caveats (if present) */}
                    {law.boundary && (
                      <div className="bg-rose-950/20 border border-rose-500/20 rounded-2xl p-4 text-xs text-rose-200/80 leading-relaxed flex items-start gap-2.5">
                        <span className="text-rose-400 font-bold text-sm shrink-0">⚠️</span>
                        <div>
                          <strong className="text-rose-300">适用边界与提醒：</strong> {law.boundary}
                        </div>
                      </div>
                    )}

                    {/* 6. Deduplication & Cross-Linking to Core 100 Laws Lab */}
                    {law.isDuplicateOfCore && (
                      <div className="pt-2 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between flex-wrap gap-3">
                        <div className="text-xs text-amber-200 flex items-center gap-2 font-mono">
                          <Layers className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>
                            <strong>【规范去重】</strong>已收录于全景心智库「{law.duplicateCoreId} · {law.duplicateCoreName}」，不另增重复条目
                          </span>
                        </div>
                        <button
                          onClick={() => navigate(`/law/${law.duplicateCoreId}`)}
                          className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                        >
                          <span>体验认知决策实验室</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </section>

      {/* 6. Epiphany Modal Spotlight (When Random Epiphany is drawn) */}
      {epiphanyLaw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-3xl art-salon-canvas border border-amber-400/50 shadow-[0_0_50px_rgba(245,158,11,0.35)] p-6 sm:p-8 text-white space-y-5">
            {/* Close Button */}
            <button
              onClick={() => setEpiphanyLaw(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white flex items-center justify-center text-sm transition-colors cursor-pointer"
            >
              ✕
            </button>

            {/* Medal Icon & Title */}
            <div className="text-center space-y-2">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shadow-lg">
                <Sparkles className="w-7 h-7 animate-spin" />
              </div>
              <span className="text-[11px] font-mono tracking-widest text-amber-400 uppercase font-semibold">
                EPIPHANY ORACLE · 情感启示卡
              </span>
              <h3 className="text-xl sm:text-2xl font-bold font-serif text-white">
                {epiphanyLaw.titleZh}
              </h3>
              <p className="text-xs text-stone-400 font-mono italic">
                {epiphanyLaw.titleEn} · Part {epiphanyLaw.sectionIndex}
              </p>
            </div>

            {/* Principle Card */}
            <div className="p-4 rounded-2xl bg-stone-900/80 border border-amber-500/30 text-xs sm:text-sm text-stone-200 leading-relaxed font-serif">
              "{epiphanyLaw.corePrinciple}"
            </div>

            {/* Practical Point */}
            <div className="space-y-2 text-xs text-stone-300">
              <div className="font-bold text-amber-300 font-mono text-[11px] uppercase">
                ✦ 此时此刻的生活启示：
              </div>
              <p className="leading-relaxed bg-white/5 p-3 rounded-xl border border-white/5">
                {epiphanyLaw.practicalTakeaways.summary}
              </p>
            </div>

            {/* Modal Bottom Actions */}
            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                onClick={() => {
                  const targetEl = document.getElementById(epiphanyLaw.id);
                  setEpiphanyLaw(null);
                  if (targetEl) {
                    targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs hover:bg-amber-400 transition-all cursor-pointer text-center"
              >
                查看完整深度条目
              </button>
              <button
                onClick={triggerRandomEpiphany}
                className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-stone-200 text-xs transition-all cursor-pointer"
              >
                再抽一张
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

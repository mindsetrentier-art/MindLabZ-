import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  X,
  BookOpen,
  Gamepad2,
  ArrowRight,
  CornerDownLeft,
  Sparkles,
  Shuffle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  searchGlobalIndex,
  getGlobalIndexStats,
  SearchResultKind,
  GlobalSearchResult,
} from '../../utils/globalSearchIndex';
import { gameAudio } from '../../utils/gameAudio';

const QUICK_SEARCH_QUERIES = [
  '锚定效应',
  '知情同意',
  '犯罪心理',
  '心理抗拒',
  '微表情',
  '依恋',
  'SEX0101',
  'ML003',
];

const FEATURED_SHORTCUTS: Array<{
  title: string;
  meta: string;
  route: string;
  kind: SearchResultKind;
}> = [
  {
    title: '性心理学 100 律 · CSPRNG 真随机思辨',
    meta: '竞技场 · 4 大板块 × 5 场景',
    route: '/game/sexual-aleatoric-arena',
    kind: 'arena',
  },
  {
    title: '犯罪心理学 100 律 · 风险剖析竞技场',
    meta: '竞技场 · 4 大领域 × 5 观察场景',
    route: '/game/criminal-aleatoric-arena',
    kind: 'arena',
  },
  {
    title: '逆向心理学 100 律 · 心理抗拒实战',
    meta: '竞技场 · 12 类机制 × 5 沟通场景',
    route: '/game/reverse-aleatoric-arena',
    kind: 'arena',
  },
  {
    title: '心智定律库 · 全库检索与随听馆',
    meta: '定律库 · 1,100+ 中英双语条目',
    route: '/learn?mode=all',
    kind: 'law',
  },
];

export const GlobalSearchModal: React.FC = () => {
  const navigate = useNavigate();
  const { searchModalOpen, setSearchModalOpen } = useApp();
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<'all' | SearchResultKind>('all');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const indexStats = useMemo(() => getGlobalIndexStats(), []);

  // Global Cmd+K / Ctrl+K shortcut to toggle search modal
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchModalOpen(!searchModalOpen);
      } else if (e.key === 'Escape' && searchModalOpen) {
        e.preventDefault();
        setSearchModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [searchModalOpen, setSearchModalOpen]);

  // Autofocus input when opened
  useEffect(() => {
    if (searchModalOpen) {
      setActiveIndex(0);
      const timer = setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 30);
      return () => clearTimeout(timer);
    }
  }, [searchModalOpen]);

  const allHits = useMemo(() => {
    if (!query.trim()) return [];
    return searchGlobalIndex(query, { scope: 'all', limit: 60 });
  }, [query]);

  const lawHitsCount = useMemo(
    () => allHits.filter((item) => item.kind === 'law').length,
    [allHits]
  );
  const arenaHitsCount = useMemo(
    () => allHits.filter((item) => item.kind === 'arena').length,
    [allHits]
  );

  const visibleResults = useMemo(() => {
    if (scope === 'all') return allHits.slice(0, 36);
    return allHits.filter((item) => item.kind === scope).slice(0, 36);
  }, [allHits, scope]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, scope]);

  const handleSelectResult = useCallback(
    (item: GlobalSearchResult | { route: string }) => {
      gameAudio.playTap();
      setSearchModalOpen(false);
      navigate(item.route);
    },
    [navigate, setSearchModalOpen]
  );

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (visibleResults.length === 0) {
      if (e.key === 'Enter' && query.trim()) {
        e.preventDefault();
        setSearchModalOpen(false);
        navigate(`/learn?mode=all&q=${encodeURIComponent(query.trim())}`);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % visibleResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + visibleResults.length) % visibleResults.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = visibleResults[activeIndex] || visibleResults[0];
      if (target) {
        handleSelectResult(target);
      }
    }
  };

  // Keep active item scrolled into view on keyboard arrow navigation
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-result-index="${activeIndex}"]`);
    if (el instanceof HTMLElement) {
      el.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  if (!searchModalOpen) return null;

  const hasQuery = query.trim().length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-20 px-3 sm:px-6 bg-stone-950/55 backdrop-blur-xs animate-fadeIn"
      onClick={() => setSearchModalOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="全局 Lunr 全文检索"
    >
      <div
        className="w-full max-w-2xl bg-white rounded-2xl border border-stone-200/90 shadow-2xl overflow-hidden flex flex-col max-h-[82vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Search Input Row */}
        <div className="flex items-center gap-3 px-4 sm:px-5 py-3.5 border-b border-stone-200/80">
          <Search className="w-5 h-5 text-amber-700 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="搜索定律库或竞技场（如：锚定效应、知情同意、犯罪心理、SEX0101）…"
            className="flex-1 bg-transparent text-sm sm:text-base text-stone-900 placeholder-stone-400 focus:outline-none min-w-0"
            aria-label="全局搜索关键词"
          />
          {hasQuery && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="w-7 h-7 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center cursor-pointer shrink-0 transition-colors"
              aria-label="清空搜索"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setSearchModalOpen(false)}
            className="px-2 py-1 rounded-md border border-stone-200 text-[11px] font-mono text-stone-500 hover:text-stone-800 hover:border-stone-300 cursor-pointer whitespace-nowrap shrink-0"
          >
            ESC
          </button>
        </div>

        {/* Scope Filter Bar */}
        <div className="flex items-center justify-between gap-2 px-4 sm:px-5 py-2.5 bg-stone-50/90 border-b border-stone-200/70 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setScope('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 tabular-nums ${
                scope === 'all'
                  ? 'bg-stone-900 text-white'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
              }`}
            >
              全部 ({hasQuery ? allHits.length : indexStats.totalIndexed})
            </button>
            <button
              type="button"
              onClick={() => setScope('law')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 tabular-nums flex items-center gap-1.5 ${
                scope === 'law'
                  ? 'bg-amber-700 text-white'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>定律库 ({hasQuery ? lawHitsCount : indexStats.lawCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setScope('arena')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 tabular-nums flex items-center gap-1.5 ${
                scope === 'arena'
                  ? 'bg-indigo-700 text-white'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
              }`}
            >
              <Gamepad2 className="w-3.5 h-3.5" />
              <span>竞技场 ({hasQuery ? arenaHitsCount : indexStats.arenaCount})</span>
            </button>
          </div>

          <span className="text-[11px] font-mono text-stone-400 hidden sm:inline whitespace-nowrap shrink-0">
            Lunr.js 双语全文索引
          </span>
        </div>

        {/* Body: Empty State or Ranked Results */}
        <div ref={listRef} className="flex-1 overflow-y-auto divide-y divide-stone-100">
          {!hasQuery ? (
            <div className="p-4 sm:p-5 space-y-5">
              {/* Quick Suggestion Chips */}
              <div className="space-y-2">
                <div className="text-[11px] font-mono font-semibold text-stone-500 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>高频检索关键词</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_SEARCH_QUERIES.map((kw) => (
                    <button
                      key={kw}
                      type="button"
                      onClick={() => {
                        gameAudio.playTap();
                        setQuery(kw);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-stone-50 hover:bg-amber-50 border border-stone-200/90 hover:border-amber-300 text-xs font-medium text-stone-800 cursor-pointer transition-colors whitespace-nowrap shrink-0"
                    >
                      {kw}
                    </button>
                  ))}
                </div>
              </div>

              {/* Direct Arena & Library Shortcuts */}
              <div className="space-y-2">
                <div className="text-[11px] font-mono font-semibold text-stone-500 flex items-center gap-1.5">
                  <Shuffle className="w-3.5 h-3.5 text-indigo-600" />
                  <span>精选专题直达入口</span>
                </div>
                <div className="divide-y divide-stone-100 border border-stone-200/80 rounded-xl overflow-hidden">
                  {FEATURED_SHORTCUTS.map((sc) => (
                    <button
                      key={sc.route}
                      type="button"
                      onClick={() => handleSelectResult(sc)}
                      className="w-full px-3.5 py-3 flex items-center justify-between gap-3 text-left bg-white hover:bg-stone-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            sc.kind === 'arena'
                              ? 'bg-indigo-50 text-indigo-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {sc.kind === 'arena' ? (
                            <Gamepad2 className="w-4 h-4" />
                          ) : (
                            <BookOpen className="w-4 h-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs sm:text-sm font-bold text-stone-900 truncate">
                            {sc.title}
                          </div>
                          <div className="text-[11px] text-stone-500 truncate">{sc.meta}</div>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-stone-400 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : visibleResults.length === 0 ? (
            <div className="py-12 px-6 text-center space-y-2">
              <div className="text-sm font-bold text-stone-800 font-serif-editorial">
                未找到与「{query.trim()}」匹配的定律或竞技场项目
              </div>
              <p className="text-xs text-stone-500">
                可尝试输入核心词（如「偏误」「依恋」「同意」「犯罪」「逆向」或编号如「LAW001」「SEX0101」）。
              </p>
            </div>
          ) : (
            visibleResults.map((item, idx) => {
              const isSelected = idx === activeIndex;
              const isArena = item.kind === 'arena';

              return (
                <button
                  key={item.docId}
                  type="button"
                  data-result-index={idx}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => handleSelectResult(item)}
                  className={`w-full px-4 sm:px-5 py-3.5 flex items-start justify-between gap-3 text-left transition-colors cursor-pointer ${
                    isSelected ? 'bg-amber-50/75' : 'bg-white hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        isArena
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'bg-amber-50 text-amber-800'
                      }`}
                    >
                      {isArena ? (
                        <Gamepad2 className="w-4 h-4" />
                      ) : (
                        <BookOpen className="w-4 h-4" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono text-stone-500">
                        <span
                          className={`font-bold ${
                            isArena ? 'text-indigo-700' : 'text-amber-800'
                          }`}
                        >
                          {item.codeId}
                        </span>
                        <span className="text-stone-300" aria-hidden="true">·</span>
                        <span className="font-sans font-medium text-stone-600">
                          {item.category}
                        </span>
                        {item.subtitle && (
                          <>
                            <span className="text-stone-300 hidden sm:inline" aria-hidden="true">·</span>
                            <span className="hidden sm:inline truncate max-w-[200px] text-stone-400">
                              {item.subtitle}
                            </span>
                          </>
                        )}
                      </div>

                      <div className="font-serif-editorial text-sm font-bold text-stone-900 truncate">
                        {item.title}
                      </div>

                      {item.snippet && (
                        <p className="text-xs text-stone-600 leading-relaxed line-clamp-2">
                          {item.snippet}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-1 pt-2 text-stone-400">
                    {isSelected ? (
                      <CornerDownLeft className="w-4 h-4 text-amber-700" />
                    ) : (
                      <ArrowRight className="w-4 h-4" />
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-5 py-2.5 bg-stone-50 border-t border-stone-200/80 flex items-center justify-between gap-3 text-[11px] text-stone-500">
          <div className="hidden sm:flex items-center gap-3 font-mono">
            <span>↑↓ 选择</span>
            <span>·</span>
            <span>Enter 跳转</span>
            <span>·</span>
            <span>⌘K 随时呼出</span>
          </div>
          <div className="sm:hidden text-stone-500">点击条目直达详情或对局</div>

          {hasQuery && (
            <button
              type="button"
              onClick={() => {
                gameAudio.playTap();
                setSearchModalOpen(false);
                navigate(`/learn?mode=all&q=${encodeURIComponent(query.trim())}`);
              }}
              className="font-semibold text-amber-800 hover:text-amber-900 flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>在定律库中查看全部相关词条</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

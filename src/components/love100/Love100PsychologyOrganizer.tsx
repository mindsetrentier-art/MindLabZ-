import React, { useMemo } from 'react';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Compass,
  Heart,
  Layers,
  RotateCcw,
  ShieldCheck,
  Shuffle,
  Sparkles,
} from 'lucide-react';
import { DifficultyLevel, PsychologyLaw } from '../../types';
import {
  LOVE100_PSYCHOLOGY_LAWS,
  LOVE100_PILLARS,
  LOVE100_CATEGORIES,
  LOVE100_CONTEXTS,
  LOVE100_TOPICS,
  LOVE100_PSYCHOLOGY_NOTE,
} from '../../data/love100PsychologyLaws';
import { gameAudio } from '../../utils/gameAudio';

interface Love100PsychologyOrganizerProps {
  lawsMasteryMap?: Record<string, number>;
  selectedPillar: string;
  selectedContext: string;
  selectedCategory: string;
  selectedTopic: string;
  selectedDifficulty: 'all' | DifficultyLevel;
  matchedCount: number;
  onSelectPillar: (pillarId: string) => void;
  onSelectContext: (contextId: string) => void;
  onSelectCategory: (categoryId: string) => void;
  onSelectTopic: (topicId: string) => void;
  onSelectDifficulty: (difficulty: 'all' | DifficultyLevel) => void;
  onResetFilters: () => void;
  onLaunchArena: () => void;
}

const DIFFICULTY_OPTIONS: Array<{
  id: 'all' | DifficultyLevel;
  label: string;
  count: number;
}> = [
  { id: 'all', label: '全部难度', count: 100 },
  { id: 'Easy', label: '初级基础', count: 35 },
  { id: 'Medium', label: '中级深化', count: 35 },
  { id: 'Hard', label: '进阶思辨', count: 30 },
];

export const Love100PsychologyOrganizer: React.FC<Love100PsychologyOrganizerProps> = ({
  lawsMasteryMap = {},
  selectedPillar,
  selectedContext,
  selectedCategory,
  selectedTopic,
  selectedDifficulty,
  matchedCount,
  onSelectPillar,
  onSelectContext,
  onSelectCategory,
  onSelectTopic,
  onSelectDifficulty,
  onResetFilters,
  onLaunchArena,
}) => {
  const { totalMastered, pillarStats } = useMemo(() => {
    const isMastered = (law: PsychologyLaw) => (lawsMasteryMap[law.id] || 0) >= 80;
    const total = LOVE100_PSYCHOLOGY_LAWS.filter(isMastered).length;
    const byPillar: Record<string, number> = {};
    for (const pillar of LOVE100_PILLARS) {
      byPillar[pillar.id] = LOVE100_PSYCHOLOGY_LAWS.filter(
        (l) => l.love100Pillar === pillar.id && isMastered(l)
      ).length;
    }
    return { totalMastered: total, pillarStats: byPillar };
  }, [lawsMasteryMap]);

  const activeCategories = useMemo(
    () =>
      selectedPillar === 'all'
        ? LOVE100_CATEGORIES
        : LOVE100_CATEGORIES.filter((c) => c.pillarId === selectedPillar),
    [selectedPillar]
  );

  const activeTopics = useMemo(() => {
    return LOVE100_TOPICS.filter((t) => {
      if (selectedPillar !== 'all' && t.pillarId !== selectedPillar) return false;
      if (selectedCategory !== 'all' && t.category !== selectedCategory) return false;
      return true;
    });
  }, [selectedPillar, selectedCategory]);

  const hasAnyFilter =
    selectedPillar !== 'all' ||
    selectedContext !== 'all' ||
    selectedCategory !== 'all' ||
    selectedTopic !== 'all' ||
    selectedDifficulty !== 'all';

  const activeContextObj = LOVE100_CONTEXTS.find((c) => c.id === selectedContext);
  const activePillarObj = LOVE100_PILLARS.find((p) => p.id === selectedPillar);

  return (
    <section className="rounded-3xl bg-white border border-rose-200/90 shadow-sm overflow-hidden">
      {/* Structured Header & Two-Way Practice Action */}
      <div className="p-5 sm:p-6 bg-gradient-to-r from-[#FFF5F7] via-white to-[#FFF8F6] border-b border-rose-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-rose-900">
            <Heart className="w-4 h-4 text-rose-600 fill-rose-500/20 shrink-0" />
            <span className="font-bold">恋爱心理学 · 100 条核心理论与应用分类总库</span>
            <span className="text-stone-300" aria-hidden="true">·</span>
            <span className="text-stone-600 tabular-nums">
              4 大关系板块 / 7 知识类别 / 5 大相处情境 / 20 章
            </span>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed">
            {LOVE100_PSYCHOLOGY_NOTE}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="px-3.5 py-2 rounded-xl bg-white border border-stone-200 text-xs flex items-center gap-2 tabular-nums">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="text-stone-600">已掌握</span>
            <strong className="font-mono text-stone-900">
              {totalMastered} / {LOVE100_PSYCHOLOGY_LAWS.length}
            </strong>
          </div>

          <button
            type="button"
            onClick={() => {
              gameAudio.playSuccess();
              onLaunchArena();
            }}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>实战演练当前筛选 ({matchedCount} 律)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-5">
        {/* Step 1: 4 Structured Relational Pillar Cards Grid */}
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800">
              <Compass className="w-3.5 h-3.5 text-rose-600" />
              <span>1. 按 4 大亲密关系板块分栏定位</span>
            </div>

            {hasAnyFilter && (
              <button
                type="button"
                onClick={() => {
                  gameAudio.playTap();
                  onResetFilters();
                }}
                className="text-xs font-semibold text-rose-800 hover:text-rose-950 flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
              >
                <RotateCcw className="w-3 h-3" />
                <span>查看全部 100 卡</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {LOVE100_PILLARS.map((pillar, idx) => {
              const isSelected = selectedPillar === pillar.id;
              const mastered = pillarStats[pillar.id] || 0;
              const pct = Math.round((mastered / Math.max(1, pillar.count)) * 100);
              const subCats = LOVE100_CATEGORIES.filter((c) => c.pillarId === pillar.id);

              return (
                <div
                  key={pillar.id}
                  onClick={() => {
                    gameAudio.playSelect();
                    onSelectPillar(isSelected ? 'all' : pillar.id);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      gameAudio.playSelect();
                      onSelectPillar(isSelected ? 'all' : pillar.id);
                    }
                  }}
                  className={`rounded-2xl p-4 border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                    isSelected
                      ? 'bg-rose-50/75 border-rose-500 ring-1 ring-rose-500/20 shadow-xs'
                      : 'bg-stone-50/60 border-stone-200/80 hover:border-rose-300 hover:bg-white'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-stone-500 tabular-nums">
                      <span className="font-bold" style={{ color: pillar.color }}>
                        0{idx + 1} · {pillar.count} 卡
                      </span>
                      <span>掌握 {mastered}/{pillar.count}</span>
                    </div>

                    <h3 className="font-serif-editorial text-sm font-bold text-stone-900 leading-snug">
                      {pillar.label}
                    </h3>

                    <p className="text-[11px] text-stone-600 leading-relaxed line-clamp-2">
                      {pillar.description}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1">
                      {subCats.map((cat) => {
                        const catSelected = selectedCategory === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              gameAudio.playTap();
                              if (selectedPillar !== pillar.id) {
                                onSelectPillar(pillar.id);
                              }
                              onSelectCategory(catSelected ? 'all' : cat.id);
                            }}
                            className={`text-[10.5px] px-2 py-0.5 rounded-md border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                              catSelected
                                ? 'bg-rose-600 text-white border-rose-600 font-semibold'
                                : 'bg-white text-stone-700 border-stone-200 hover:border-rose-400'
                            }`}
                          >
                            {cat.label} ({cat.count})
                          </button>
                        );
                      })}
                    </div>

                    <div className="w-full h-1 rounded-full bg-stone-200/80 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.max(pct, mastered > 0 ? 6 : 0)}%`,
                          backgroundColor: pillar.color,
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 2: 5 Application Contexts & Difficulty Tier Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-3 border-t border-stone-100">
          <div className="lg:col-span-8 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800">
              <Layers className="w-3.5 h-3.5 text-rose-600" />
              <span>2. 按 5 大亲密相处与反思情境切换</span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              <button
                type="button"
                onClick={() => {
                  gameAudio.playSelect();
                  onSelectContext('all');
                }}
                className={`text-xs font-bold px-3.5 py-2 rounded-xl transition-all shrink-0 whitespace-nowrap cursor-pointer ${
                  selectedContext === 'all'
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-stone-50 text-stone-700 border border-stone-200 hover:border-stone-400'
                }`}
              >
                全情境 (100)
              </button>
              {LOVE100_CONTEXTS.map((ctx) => {
                const isSelected = selectedContext === ctx.id;
                return (
                  <button
                    key={ctx.id}
                    type="button"
                    onClick={() => {
                      gameAudio.playSelect();
                      onSelectContext(isSelected ? 'all' : ctx.id);
                    }}
                    className={`text-xs font-bold px-3.5 py-2 rounded-xl transition-all shrink-0 whitespace-nowrap cursor-pointer ${
                      isSelected
                        ? 'text-white shadow-xs'
                        : 'bg-white text-stone-700 border border-stone-200 hover:border-stone-400'
                    }`}
                    style={isSelected ? { backgroundColor: ctx.color } : undefined}
                  >
                    {ctx.label} ({ctx.count})
                  </button>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-4 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800">
              <Sparkles className="w-3.5 h-3.5 text-rose-600" />
              <span>3. 按学习难度进阶筛选</span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {DIFFICULTY_OPTIONS.map((opt) => {
                const isSelected = selectedDifficulty === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      gameAudio.playTap();
                      onSelectDifficulty(opt.id);
                    }}
                    className={`text-xs font-bold px-3 py-2 rounded-xl border transition-colors shrink-0 whitespace-nowrap cursor-pointer tabular-nums ${
                      isSelected
                        ? 'bg-rose-700 text-white border-rose-700'
                        : 'bg-white text-stone-700 border-stone-200 hover:border-stone-400'
                    }`}
                  >
                    {opt.label} ({opt.count})
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Step 3: 7 Categories + 20 Chapter Topics Finder */}
        <div className="pt-3 border-t border-stone-100 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800">
              <BookOpen className="w-3.5 h-3.5 text-rose-600" />
              <span>
                4. 按 7 大知识类别与 20 章核心概念定位
                {activePillarObj ? ` · ${activePillarObj.label}` : ''}
              </span>
            </div>
            <span className="text-[11px] text-stone-500 font-mono tabular-nums">
              共 {activeTopics.length} 章 · 每章含 5 种应用场景视角
            </span>
          </div>

          {selectedPillar === 'all' && (
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => {
                  gameAudio.playTap();
                  onSelectCategory('all');
                }}
                className={`text-[11px] font-bold px-3 py-1.5 rounded-lg border cursor-pointer whitespace-nowrap shrink-0 ${
                  selectedCategory === 'all'
                    ? 'bg-rose-700 text-white border-rose-700'
                    : 'bg-stone-50 text-stone-700 border-stone-200 hover:border-stone-400'
                }`}
              >
                全部 7 大知识类别
              </button>
              {activeCategories.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      gameAudio.playTap();
                      onSelectCategory(isSelected ? 'all' : cat.id);
                    }}
                    className={`text-[11px] font-bold px-3 py-1.5 rounded-lg border cursor-pointer whitespace-nowrap shrink-0 transition-colors ${
                      isSelected
                        ? 'text-white'
                        : 'bg-white text-stone-700 border-stone-200 hover:border-stone-400'
                    }`}
                    style={
                      isSelected
                        ? { backgroundColor: cat.color, borderColor: cat.color }
                        : undefined
                    }
                  >
                    {cat.label} ({cat.count})
                  </button>
                );
              })}
            </div>
          )}

          <div className="bg-stone-50/90 p-2.5 rounded-2xl border border-stone-200/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
            <button
              type="button"
              onClick={() => {
                gameAudio.playTap();
                onSelectTopic('all');
              }}
              className={`text-[11px] font-bold px-3 py-1.5 rounded-xl shrink-0 cursor-pointer whitespace-nowrap ${
                selectedTopic === 'all'
                  ? 'bg-stone-900 text-white'
                  : 'text-stone-600 hover:bg-stone-200/70'
              }`}
            >
              全部章节 ({activeTopics.length})
            </button>
            {activeTopics.map((topic) => (
              <button
                key={topic.id}
                type="button"
                onClick={() => {
                  gameAudio.playTap();
                  onSelectTopic(selectedTopic === topic.id ? 'all' : topic.id);
                }}
                className={`text-[11px] font-medium px-3 py-1.5 rounded-xl shrink-0 cursor-pointer whitespace-nowrap transition-colors ${
                  selectedTopic === topic.id
                    ? 'bg-rose-700 text-white font-bold'
                    : 'text-stone-700 hover:bg-white'
                }`}
              >
                {topic.chapter}
              </button>
            ))}
          </div>
        </div>

        {(activeContextObj || activePillarObj) && (
          <div className="rounded-2xl px-4 py-3 bg-rose-50/60 border border-rose-200/70 text-xs text-stone-700 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="text-rose-950">
                {activePillarObj ? activePillarObj.label : ''}
                {activePillarObj && activeContextObj ? ' · ' : ''}
                {activeContextObj ? `${activeContextObj.label}情境指引` : '板块学习提示'}：
              </strong>
              <span>
                {activeContextObj
                  ? activeContextObj.description
                  : activePillarObj?.description}
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

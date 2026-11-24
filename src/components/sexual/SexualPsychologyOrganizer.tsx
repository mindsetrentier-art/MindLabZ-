import React, { useMemo } from 'react';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Compass,
  HeartHandshake,
  Layers,
  RotateCcw,
  ShieldCheck,
  Shuffle,
  Sparkles,
} from 'lucide-react';
import { DifficultyLevel, PsychologyLaw } from '../../types';
import {
  SEXUAL_PSYCHOLOGY_LAWS,
  SEXUAL_PILLARS,
  SEXUAL_CATEGORIES,
  SEXUAL_CONTEXTS,
  SEXUAL_TOPICS,
  SEXUAL_PSYCHOLOGY_NOTE,
} from '../../data/sexualPsychologyLaws';
import { gameAudio } from '../../utils/gameAudio';

interface SexualPsychologyOrganizerProps {
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

export const SexualPsychologyOrganizer: React.FC<SexualPsychologyOrganizerProps> = ({
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
    const total = SEXUAL_PSYCHOLOGY_LAWS.filter(isMastered).length;
    const byPillar: Record<string, number> = {};
    for (const pillar of SEXUAL_PILLARS) {
      byPillar[pillar.id] = SEXUAL_PSYCHOLOGY_LAWS.filter(
        (l) => l.sexualPillar === pillar.id && isMastered(l)
      ).length;
    }
    return { totalMastered: total, pillarStats: byPillar };
  }, [lawsMasteryMap]);

  const activeCategories = useMemo(
    () =>
      selectedPillar === 'all'
        ? SEXUAL_CATEGORIES
        : SEXUAL_CATEGORIES.filter((c) => c.pillarId === selectedPillar),
    [selectedPillar]
  );

  const activeTopics = useMemo(() => {
    return SEXUAL_TOPICS.filter((t) => {
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

  const activeContextObj = SEXUAL_CONTEXTS.find((c) => c.id === selectedContext);
  const activePillarObj = SEXUAL_PILLARS.find((p) => p.id === selectedPillar);

  return (
    <section className="rounded-3xl bg-white border border-purple-200/90 shadow-sm overflow-hidden">
      {/* Structured Header & Two-Way Practice Action */}
      <div className="p-5 sm:p-6 bg-gradient-to-r from-[#F9F5FF] via-white to-[#F5F9FF] border-b border-purple-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-purple-900">
            <HeartHandshake className="w-4 h-4 text-purple-700 shrink-0" />
            <span className="font-bold">性心理学与亲密健康 · 100 律系统分栏总库</span>
            <span className="text-stone-300" aria-hidden="true">·</span>
            <span className="text-stone-600 tabular-nums">
              4 大主题板块 / 5 大场景 / 12 细分专题 / 20 章
            </span>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed">
            {SEXUAL_PSYCHOLOGY_NOTE}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="px-3.5 py-2 rounded-xl bg-white border border-stone-200 text-xs flex items-center gap-2 tabular-nums">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="text-stone-600">已掌握</span>
            <strong className="font-mono text-stone-900">
              {totalMastered} / {SEXUAL_PSYCHOLOGY_LAWS.length}
            </strong>
          </div>

          <button
            type="button"
            onClick={() => {
              gameAudio.playSuccess();
              onLaunchArena();
            }}
            className="px-4 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>实战演练当前筛选 ({matchedCount} 律)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-5">
        {/* Step 1: 4 Structured Pillar Cards Grid */}
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800">
              <Compass className="w-3.5 h-3.5 text-purple-700" />
              <span>1. 按 4 大核心主题板块分栏定位</span>
            </div>

            {hasAnyFilter && (
              <button
                type="button"
                onClick={() => {
                  gameAudio.playTap();
                  onResetFilters();
                }}
                className="text-xs font-semibold text-purple-800 hover:text-purple-950 flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
              >
                <RotateCcw className="w-3 h-3" />
                <span>查看全部 100 律</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {SEXUAL_PILLARS.map((pillar, idx) => {
              const isSelected = selectedPillar === pillar.id;
              const mastered = pillarStats[pillar.id] || 0;
              const pct = Math.round((mastered / Math.max(1, pillar.count)) * 100);
              const subCats = SEXUAL_CATEGORIES.filter((c) => c.pillarId === pillar.id);

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
                      ? 'bg-purple-50/70 border-purple-500 ring-1 ring-purple-500/20 shadow-xs'
                      : 'bg-stone-50/60 border-stone-200/80 hover:border-purple-300 hover:bg-white'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-stone-500 tabular-nums">
                      <span className="font-bold" style={{ color: pillar.color }}>
                        0{idx + 1} · {pillar.count} 律
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
                    {/* Sub-category quick jump links inside pillar box */}
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
                                ? 'bg-purple-700 text-white border-purple-700 font-semibold'
                                : 'bg-white text-stone-700 border-stone-200 hover:border-purple-400'
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
              <Layers className="w-3.5 h-3.5 text-purple-700" />
              <span>2. 按 5 大实践与应用观察场景切换</span>
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
                全场景 (100)
              </button>
              {SEXUAL_CONTEXTS.map((ctx) => {
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
              <Sparkles className="w-3.5 h-3.5 text-purple-700" />
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
                        ? 'bg-purple-800 text-white border-purple-800'
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

        {/* Step 3: 12 Categories + 20 Chapter Topics Finder */}
        <div className="pt-3 border-t border-stone-100 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800">
              <BookOpen className="w-3.5 h-3.5 text-purple-700" />
              <span>
                4. 按 20 章核心议题直达定位
                {activePillarObj ? ` · ${activePillarObj.label}` : ''}
              </span>
            </div>
            <span className="text-[11px] text-stone-500 font-mono tabular-nums">
              共 {activeTopics.length} 章 · 每章含 5 种应用场景视角
            </span>
          </div>

          {/* 12 Fine Categories Filter Strip */}
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
                    ? 'bg-purple-800 text-white border-purple-800'
                    : 'bg-stone-50 text-stone-700 border-stone-200 hover:border-stone-400'
                }`}
              >
                全部 12 细分专题
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

          {/* 20 Chapters Quick Grid */}
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
                    ? 'bg-purple-800 text-white font-bold'
                    : 'text-stone-700 hover:bg-white'
                }`}
              >
                {topic.chapter}
              </button>
            ))}
          </div>
        </div>

        {/* Contextual Guidance Footer Note */}
        {(activeContextObj || activePillarObj) && (
          <div className="rounded-2xl px-4 py-3 bg-purple-50/60 border border-purple-200/70 text-xs text-stone-700 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="text-purple-950">
                {activePillarObj ? activePillarObj.label : ''}
                {activePillarObj && activeContextObj ? ' · ' : ''}
                {activeContextObj ? `${activeContextObj.label}视角说明` : '板块学习提示'}：
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

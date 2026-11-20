import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  ArrowRight,
  Bookmark,
  Gamepad2,
  Network,
  Compass,
  X,
  ArrowLeft,
  CheckCircle2,
  GitBranch,
  BookOpen,
  HelpCircle,
  Route,
  Trash2,
  Eye,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CategoryZh } from '../types';
import { gameAudio } from '../utils/gameAudio';
import {
  buildLawKnowledgeGraph,
  CATEGORY_CLUSTER_META,
  GraphCorpusPreset,
  GraphRelationType,
  LawGraphNode,
  RELATION_META,
} from '../utils/knowledgeGraphBuilder';
import { LawKnowledgeGraphCanvas } from '../components/graph/LawKnowledgeGraphCanvas';
import { LawDeepDiveModal } from '../components/graph/LawDeepDiveModal';

interface ConceptTrailStep {
  nodeId: string;
  relationFromPrev?: GraphRelationType;
  reasonFromPrev?: string;
  quizPassed: boolean;
}

type ClickActionMode = 'deep-dive' | 'mini-quiz' | 'focus';

const PRESET_OPTIONS: Array<{ id: GraphCorpusPreset; label: string }> = [
  { id: 'curated-500', label: '500 核心图谱' },
  { id: 'all-laws', label: '全馆藏图谱' },
  { id: 'core-152', label: '经典与微表情' },
  { id: 'love-codex', label: '亲密关系图谱' },
];

const CATEGORY_TABS: Array<{ id: 'all' | CategoryZh; label: string }> = [
  { id: 'all', label: '全部维度' },
  { id: '认知', label: '认知' },
  { id: '记忆', label: '记忆' },
  { id: '决策', label: '决策' },
  { id: '行为', label: '行为' },
  { id: '情绪', label: '情绪' },
  { id: '社会', label: '社会' },
];

const RELATION_TABS: Array<{ id: 'all' | GraphRelationType; label: string }> = [
  { id: 'all', label: '全部关联' },
  { id: 'concept-bridge', label: '机制共鸣' },
  { id: 'chapter-lineage', label: '同章脉络' },
  { id: 'arena-synergy', label: '竞技场联动' },
];

const CLICK_MODE_OPTIONS: Array<{ id: ClickActionMode; label: string }> = [
  { id: 'deep-dive', label: '点击: 深潜弹窗' },
  { id: 'mini-quiz', label: '点击: 微测验' },
  { id: 'focus', label: '点击: 仅聚焦' },
];

export const KnowledgeGraphPage: React.FC = () => {
  const {
    laws,
    user,
    toggleBookmark,
    isBookmarked,
    addXP,
    updateLawMastery,
    triggerConfetti,
  } = useApp();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialFocusParam = searchParams.get('focus');

  const [preset, setPreset] = useState<GraphCorpusPreset>('curated-500');
  const [activeCategory, setActiveCategory] = useState<'all' | CategoryZh>('all');
  const [activeRelation, setActiveRelation] = useState<'all' | GraphRelationType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(initialFocusParam);
  const [focusSequence, setFocusSequence] = useState<number>(initialFocusParam ? 1 : 0);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  const [conceptTrail, setConceptTrail] = useState<ConceptTrailStep[]>(() =>
    initialFocusParam ? [{ nodeId: initialFocusParam, quizPassed: false }] : []
  );
  const [clickActionMode, setClickActionMode] = useState<ClickActionMode>('deep-dive');
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [modalInitialTab, setModalInitialTab] = useState<'deep-dive' | 'mini-quiz'>('deep-dive');

  const safeMasteryMap = useMemo(
    () => (user?.lawMasteryMap && typeof user.lawMasteryMap === 'object' ? user.lawMasteryMap : {}),
    [user?.lawMasteryMap]
  );

  const lawMap = useMemo(() => new Map(laws.map((l) => [l.id, l])), [laws]);

  // Build deterministic D3 graph dataset
  const graphData = useMemo(
    () =>
      buildLawKnowledgeGraph(
        laws,
        safeMasteryMap,
        user?.bookmarks || [],
        preset
      ),
    [laws, safeMasteryMap, user?.bookmarks, preset]
  );

  // If ?focus= targets a law missing from curated-500, switch automatically to all-laws
  useEffect(() => {
    if (!initialFocusParam) return;
    if (!graphData.nodeMap.has(initialFocusParam) && preset !== 'all-laws') {
      const target = laws.find(
        (l) =>
          l.id.toLowerCase() === initialFocusParam.toLowerCase() ||
          l.codeId?.toLowerCase() === initialFocusParam.toLowerCase()
      );
      if (target) {
        setPreset('all-laws');
        setSelectedNodeId(target.id);
        setFocusSequence((s) => s + 1);
        setConceptTrail([{ nodeId: target.id, quizPassed: false }]);
      }
    }
  }, [initialFocusParam, graphData.nodeMap, laws, preset]);

  const appendToConceptTrail = useCallback(
    (nodeId: string, relationFromPrev?: GraphRelationType, reasonFromPrev?: string) => {
      setConceptTrail((prev) => {
        if (prev.some((step) => step.nodeId === nodeId)) {
          return prev;
        }
        const next: ConceptTrailStep[] = [
          ...prev,
          { nodeId, relationFromPrev, reasonFromPrev, quizPassed: false },
        ];
        return next.length > 24 ? next.slice(-24) : next;
      });
    },
    []
  );

  const handleFocusNode = useCallback(
    (
      nodeId: string | null,
      opts?: {
        openModalTab?: 'deep-dive' | 'mini-quiz';
        relationFromPrev?: GraphRelationType;
        reasonFromPrev?: string;
      }
    ) => {
      gameAudio.playTap();
      setSelectedNodeId(nodeId);
      if (nodeId) {
        setFocusSequence((s) => s + 1);
        appendToConceptTrail(nodeId, opts?.relationFromPrev, opts?.reasonFromPrev);
        if (opts?.openModalTab) {
          setModalInitialTab(opts.openModalTab);
          setModalOpen(true);
        }
      }
      setShowSearchDropdown(false);
    },
    [appendToConceptTrail]
  );

  const handleCanvasSelectNode = useCallback(
    (nodeId: string | null) => {
      if (!nodeId) {
        setSelectedNodeId(null);
        return;
      }
      gameAudio.playTap();
      setSelectedNodeId(nodeId);
      appendToConceptTrail(nodeId);
      if (clickActionMode !== 'focus') {
        setModalInitialTab(clickActionMode);
        setModalOpen(true);
      }
    },
    [appendToConceptTrail, clickActionMode]
  );

  const handleOpenModalForNode = useCallback(
    (nodeId: string, tab: 'deep-dive' | 'mini-quiz') => {
      gameAudio.playTap();
      setSelectedNodeId(nodeId);
      appendToConceptTrail(nodeId);
      setModalInitialTab(tab);
      setModalOpen(true);
    },
    [appendToConceptTrail]
  );

  const handleJumpToNeighbor = useCallback(
    (neighborId: string, relationType: GraphRelationType, reason: string) => {
      const targetTab = modalOpen
        ? 'deep-dive'
        : clickActionMode !== 'focus'
          ? clickActionMode
          : undefined;
      handleFocusNode(neighborId, {
        relationFromPrev: relationType,
        reasonFromPrev: reason,
        openModalTab: targetTab,
      });
    },
    [handleFocusNode, modalOpen, clickActionMode]
  );

  const handleCompleteMiniQuiz = useCallback(
    (lawId: string, isCorrect: boolean) => {
      if (!isCorrect) return;
      const cur = safeMasteryMap[lawId] ?? 0;
      updateLawMastery(lawId, Math.min(100, cur + 15));
      addXP(25, '图谱概念微测验通关');
      triggerConfetti();
      setConceptTrail((prev) =>
        prev.map((step) => (step.nodeId === lawId ? { ...step, quizPassed: true } : step))
      );
    },
    [safeMasteryMap, updateLawMastery, addXP, triggerConfetti]
  );

  // Matching search results across active graph nodes
  const searchMatches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return graphData.nodes
      .filter(
        (n) =>
          n.nameZh.toLowerCase().includes(q) ||
          n.nameEn.toLowerCase().includes(q) ||
          n.codeId.toLowerCase().includes(q) ||
          n.mechanisms.some((m) => m.toLowerCase().includes(q))
      )
      .slice(0, 12);
  }, [searchQuery, graphData.nodes]);

  const searchHighlightIds = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return null;
    const allMatches = graphData.nodes.filter(
      (n) =>
        n.nameZh.toLowerCase().includes(q.toLowerCase()) ||
        n.nameEn.toLowerCase().includes(q.toLowerCase()) ||
        n.codeId.toLowerCase().includes(q.toLowerCase()) ||
        n.mechanisms.some((m) => m.toLowerCase().includes(q.toLowerCase()))
    );
    return new Set(allMatches.map((n) => n.id));
  }, [searchQuery, graphData.nodes]);

  const selectedNode: LawGraphNode | null = selectedNodeId
    ? graphData.nodeMap.get(selectedNodeId) || null
    : null;

  const selectedLaw = useMemo(
    () => (selectedNodeId ? lawMap.get(selectedNodeId) || null : null),
    [selectedNodeId, lawMap]
  );

  const selectedNeighbors = useMemo(() => {
    if (!selectedNode) return [];
    const raw = graphData.adjacency.get(selectedNode.id) || [];
    return raw
      .filter((item) => activeRelation === 'all' || item.relationType === activeRelation)
      .map((item) => ({
        ...item,
        node: graphData.nodeMap.get(item.neighborId)!,
      }))
      .filter((item) => Boolean(item.node))
      .sort((a, b) => b.weight - a.weight);
  }, [selectedNode, graphData, activeRelation]);

  const masteredCountInGraph = useMemo(
    () => graphData.nodes.filter((n) => n.isMastered).length,
    [graphData.nodes]
  );

  const conceptTrailIds = useMemo(
    () => conceptTrail.map((step) => step.nodeId),
    [conceptTrail]
  );

  const trailQuizPassedCount = useMemo(
    () => conceptTrail.filter((step) => step.quizPassed).length,
    [conceptTrail]
  );

  const activeTrailStepNumber = useMemo(() => {
    if (!selectedNodeId) return null;
    const idx = conceptTrail.findIndex((step) => step.nodeId === selectedNodeId);
    return idx >= 0 ? idx + 1 : null;
  }, [conceptTrail, selectedNodeId]);

  const handleResetAll = useCallback(() => {
    gameAudio.playTap();
    setActiveCategory('all');
    setActiveRelation('all');
    setSearchQuery('');
    setSelectedNodeId(null);
    setModalOpen(false);
    setConceptTrail([]);
    if (searchParams.has('focus')) {
      searchParams.delete('focus');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  return (
    <div className="space-y-6 pb-16 animate-fadeIn max-w-7xl mx-auto">
      {/* 1. Curatorial Header Bar */}
      <section className="bg-[#FBF9F4] rounded-2xl border border-[#D4CBB8] p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 font-medium">
              <button
                type="button"
                onClick={() => {
                  gameAudio.playTap();
                  navigate('/learn');
                }}
                className="inline-flex items-center gap-1 text-stone-700 hover:text-stone-950 font-semibold cursor-pointer whitespace-nowrap shrink-0"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>返回定律典藏馆</span>
              </button>
              <span aria-hidden="true" className="text-stone-300">·</span>
              <span className="font-numeric tabular-nums text-stone-700">
                {graphData.nodes.length} 个定律节点
              </span>
              <span aria-hidden="true" className="text-stone-300">·</span>
              <span className="font-numeric tabular-nums text-stone-700">
                {graphData.links.length} 条概念连接
              </span>
              <span aria-hidden="true" className="text-stone-300">·</span>
              <span className="font-numeric tabular-nums text-amber-800 font-semibold">
                已掌握 {masteredCountInGraph} 项
              </span>
            </div>

            <h1 className="font-serif-editorial text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
              MindLabZ 心理定律知识图谱
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-2xl">
              基于 D3 力导向语义网络，呈现心理学定律之间的底层机制共鸣、章节谱系与竞技场实训关联。单击节点或检索词条即可步入概念邻域。
            </p>
          </div>

          {/* Corpus Scope Switcher */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[#F2ECE0] border border-[#D4CBB8] overflow-x-auto no-scrollbar shrink-0 self-start lg:self-center">
            {PRESET_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  gameAudio.playTap();
                  setPreset(opt.id);
                  setSelectedNodeId(null);
                  setModalOpen(false);
                  setConceptTrail([]);
                }}
                className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  preset === opt.id
                    ? 'bg-stone-900 text-amber-50 shadow-2xs'
                    : 'text-stone-700 hover:text-stone-950 hover:bg-white/60'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Interactive Filter & Jump Toolbar */}
        <div className="pt-3 border-t border-stone-200/90 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          {/* Search & Instant Node Jump Combobox */}
          <div className="relative w-full xl:w-80 shrink-0">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onFocus={() => setShowSearchDropdown(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchDropdown(true);
              }}
              placeholder="检索定律名、编号或机制 (如 锚定)..."
              className="w-full min-h-[40px] pl-9 pr-9 py-2 rounded-xl bg-white border border-[#D4CBB8] text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-800"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setShowSearchDropdown(false);
                }}
                aria-label="清空检索"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md text-stone-400 hover:text-stone-800 flex items-center justify-center cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {showSearchDropdown && searchMatches.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 z-40 rounded-xl bg-[#FCF9F2] border border-[#C6B9A0] shadow-xl max-h-72 overflow-y-auto divide-y divide-stone-200/70">
                {searchMatches.map((node) => (
                  <button
                    key={node.id}
                    type="button"
                    onClick={() => handleFocusNode(node.id)}
                    className="w-full px-3.5 py-2.5 text-left hover:bg-white transition-colors flex items-center justify-between gap-2 cursor-pointer"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-stone-900 truncate">
                        {node.nameZh}
                      </div>
                      <div className="text-[10.5px] text-stone-500 truncate">
                        {node.codeId} · {node.categoryZh} · {node.mechanisms.slice(0, 2).join(' / ')}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-amber-800 shrink-0 tabular-nums">
                      {node.degree} 关联
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Domain & Relation Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1 p-1 rounded-xl bg-white border border-[#D4CBB8] overflow-x-auto no-scrollbar">
              {CATEGORY_TABS.map((cat) => {
                const isActive = activeCategory === cat.id;
                const catColor =
                  cat.id !== 'all' ? CATEGORY_CLUSTER_META[cat.id].color : '#1C1917';
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      gameAudio.playTap();
                      setActiveCategory(cat.id);
                    }}
                    className={`min-h-[32px] px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${
                      isActive
                        ? 'text-white'
                        : 'text-stone-600 hover:text-stone-950 hover:bg-stone-100'
                    }`}
                    style={isActive ? { backgroundColor: catColor } : undefined}
                  >
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-1 p-1 rounded-xl bg-white border border-[#D4CBB8] overflow-x-auto no-scrollbar">
              {RELATION_TABS.map((rel) => (
                <button
                  key={rel.id}
                  type="button"
                  onClick={() => {
                    gameAudio.playTap();
                    setActiveRelation(rel.id);
                  }}
                  className={`min-h-[32px] px-2.5 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    activeRelation === rel.id
                      ? 'bg-stone-900 text-amber-50 font-semibold'
                      : 'text-stone-600 hover:text-stone-950 hover:bg-stone-100'
                  }`}
                >
                  {rel.label}
                </button>
              ))}
            </div>

            {/* Click Mode Selector: Deep Dive Modal vs Mini-Quiz vs Focus Only */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-[#EFE9DC] border border-[#D4CBB8] overflow-x-auto no-scrollbar">
              {CLICK_MODE_OPTIONS.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => {
                    gameAudio.playTap();
                    setClickActionMode(mode.id);
                  }}
                  className={`min-h-[32px] px-2.5 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    clickActionMode === mode.id
                      ? 'bg-amber-900 text-amber-50 font-semibold'
                      : 'text-stone-700 hover:text-stone-950 hover:bg-white/70'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Concept Trail Ribbon */}
      <section className="bg-[#FBF9F4] rounded-2xl border border-[#D4CBB8] px-4 sm:px-5 py-3.5 shadow-xs space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-stone-900 inline-flex items-center gap-1.5">
              <Route className="w-4 h-4 text-amber-800" />
              <span>概念探索轨迹 (Concept Trail)</span>
            </span>
            <span className="text-stone-300" aria-hidden="true">·</span>
            <span className="font-numeric tabular-nums text-stone-600">
              已串联 {conceptTrail.length} 站
            </span>
            {conceptTrail.length > 0 && (
              <>
                <span className="text-stone-300" aria-hidden="true">·</span>
                <span className="font-numeric tabular-nums text-emerald-800 font-semibold">
                  微测验通关 {trailQuizPassedCount}/{conceptTrail.length}
                </span>
              </>
            )}
          </div>

          {conceptTrail.length > 0 && (
            <div className="flex items-center gap-2">
              {selectedNode && (
                <>
                  <button
                    type="button"
                    onClick={() => handleOpenModalForNode(selectedNode.id, 'deep-dive')}
                    className="min-h-[32px] px-3 py-1 rounded-lg bg-white hover:bg-stone-100 border border-[#D4CBB8] text-stone-900 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-amber-800" />
                    <span>深潜弹窗</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenModalForNode(selectedNode.id, 'mini-quiz')}
                    className="min-h-[32px] px-3 py-1 rounded-lg bg-stone-900 hover:bg-stone-800 text-amber-50 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-amber-300" />
                    <span>随堂微测验</span>
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => {
                  gameAudio.playTap();
                  setConceptTrail([]);
                }}
                className="min-h-[32px] px-2.5 py-1 rounded-lg bg-white hover:bg-rose-50 border border-[#D4CBB8] hover:border-rose-300 text-stone-600 hover:text-rose-800 text-xs font-medium inline-flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                title="清空概念探索轨迹"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>清空轨迹</span>
              </button>
            </div>
          )}
        </div>

        {conceptTrail.length === 0 ? (
          <p className="text-xs text-stone-500">
            点击下方图谱中的任意定律节点，即可点亮编号探索路径、记录概念跳转脉络，并弹窗进行深度解析或随堂微测验。
          </p>
        ) : (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            {conceptTrail.map((step, idx) => {
              const trailNode = graphData.nodeMap.get(step.nodeId);
              if (!trailNode) return null;
              const isCurrent = selectedNodeId === step.nodeId;
              const relLabel = step.relationFromPrev
                ? RELATION_META[step.relationFromPrev].label
                : null;
              return (
                <React.Fragment key={step.nodeId}>
                  {idx > 0 && (
                    <div className="flex flex-col items-center shrink-0 px-0.5">
                      {relLabel && (
                        <span className="text-[9.5px] text-amber-800 font-medium leading-none mb-0.5 whitespace-nowrap">
                          {relLabel}
                        </span>
                      )}
                      <ArrowRight className="w-3.5 h-3.5 text-amber-700" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      handleFocusNode(step.nodeId, {
                        openModalTab:
                          clickActionMode !== 'focus' ? clickActionMode : undefined,
                      })
                    }
                    className={`min-h-[36px] px-3 py-1.5 rounded-xl border text-left transition-colors cursor-pointer flex items-center gap-2 shrink-0 ${
                      isCurrent
                        ? 'bg-stone-900 border-stone-900 text-amber-50'
                        : 'bg-white hover:bg-[#F5EFE3] border-[#DED6C6] text-stone-800'
                    }`}
                    title={step.reasonFromPrev || trailNode.nameZh}
                  >
                    <span
                      className={`font-mono text-[10.5px] font-bold tabular-nums ${
                        isCurrent ? 'text-amber-300' : 'text-amber-800'
                      }`}
                    >
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <span className="text-xs font-semibold whitespace-nowrap">
                      {trailNode.nameZh}
                    </span>
                    {step.quizPassed && (
                      <CheckCircle2
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isCurrent ? 'text-emerald-400' : 'text-emerald-700'
                        }`}
                      />
                    )}
                  </button>
                </React.Fragment>
              );
            })}
          </div>
        )}
      </section>

      {/* 2. Two-Zone Educational Simulation Workspace: D3 Stage + Concept Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_370px] xl:grid-cols-[minmax(0,1fr)_395px] gap-5 items-stretch">
        {/* Left: Interactive D3 Force-Directed Canvas */}
        <LawKnowledgeGraphCanvas
          graphData={graphData}
          selectedNodeId={selectedNodeId}
          activeCategoryFilter={activeCategory}
          activeRelationFilter={activeRelation}
          searchHighlightIds={searchHighlightIds}
          conceptTrailIds={conceptTrailIds}
          focusSequence={focusSequence}
          onSelectNode={handleCanvasSelectNode}
          onResetFilters={handleResetAll}
        />

        {/* Right: Contextual Concept Explorer & Relation Inspector */}
        <aside className="bg-[#FBF9F4] rounded-2xl border border-[#D4CBB8] p-5 flex flex-col justify-between gap-4 lg:h-[640px]">
          {selectedNode ? (
            <>
              <div className="space-y-4 overflow-y-auto pr-1 flex-1">
                {/* Unboxed Museum Accession Metadata */}
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-stone-200/90">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-stone-600 font-numeric tabular-nums">
                    <span className="font-mono font-bold text-stone-900">
                      {selectedNode.codeId}
                    </span>
                    <span aria-hidden="true" className="text-stone-300">·</span>
                    <span
                      className="font-semibold"
                      style={{ color: CATEGORY_CLUSTER_META[selectedNode.categoryZh].color }}
                    >
                      {selectedNode.categoryZh}
                    </span>
                    <span aria-hidden="true" className="text-stone-300">·</span>
                    <span>{selectedNode.difficulty}</span>
                    {selectedNode.isMastered && (
                      <>
                        <span aria-hidden="true" className="text-stone-300">·</span>
                        <span className="text-emerald-800 font-semibold inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          已掌握
                        </span>
                      </>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedNodeId(null)}
                    className="text-xs text-stone-500 hover:text-stone-900 cursor-pointer shrink-0 whitespace-nowrap"
                    title="返回图谱概览"
                  >
                    返回总览
                  </button>
                </div>

                {/* Title & Core Definition */}
                <div className="space-y-1.5">
                  <h2 className="font-serif-editorial text-xl font-bold text-stone-900 leading-snug">
                    {selectedNode.nameZh}
                  </h2>
                  <p className="text-xs text-stone-500 italic font-serif-editorial">
                    {selectedNode.nameEn}
                  </p>
                  <p className="text-xs text-stone-700 leading-relaxed pt-1">
                    {selectedNode.shortExplanation}
                  </p>
                </div>

                {/* Mechanisms & Key Takeaway */}
                <div className="p-3.5 rounded-xl bg-white border border-[#DED6C6] space-y-2">
                  <div className="text-[11px] text-stone-500">
                    <span className="font-semibold text-stone-800">底层机制：</span>
                    <span>{selectedNode.mechanisms.join(' · ')}</span>
                  </div>
                  <div className="text-xs text-stone-700 leading-relaxed pt-1.5 border-t border-stone-200/70">
                    <span className="font-semibold text-amber-900">行动启示：</span>
                    {selectedNode.keyTakeaway}
                  </div>
                </div>

                {/* Interactive Connected Laws Explorer */}
                <div className="space-y-2.5 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-stone-900 inline-flex items-center gap-1.5">
                      <GitBranch className="w-3.5 h-3.5 text-amber-800" />
                      <span>关联概念网络</span>
                    </span>
                    <span className="font-numeric tabular-nums text-[11px] text-stone-500">
                      {selectedNeighbors.length} 条连接
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {selectedNeighbors.map((item, idx) => {
                      const relMeta = RELATION_META[item.relationType];
                      const catMeta = CATEGORY_CLUSTER_META[item.node.categoryZh];
                      return (
                          <button
                          key={`${item.node.id}-${idx}`}
                          type="button"
                          onClick={() =>
                            handleFocusNode(item.node.id, {
                              relationFromPrev: item.relationType,
                              reasonFromPrev: item.reason,
                            })
                          }
                          className="w-full p-2.5 rounded-xl bg-white hover:bg-[#F5EFE3] border border-[#E2DACB] hover:border-stone-500 text-left transition-colors cursor-pointer flex items-start justify-between gap-2.5 group"
                        >
                          <div className="min-w-0 space-y-0.5">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-900 group-hover:text-amber-900 truncate">
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: catMeta.color }}
                              />
                              <span className="truncate">{item.node.nameZh}</span>
                            </div>
                            <div className="text-[10.5px] text-stone-500 truncate">
                              <span className="font-medium" style={{ color: relMeta.color }}>
                                {relMeta.label}
                              </span>
                              <span className="mx-1 text-stone-300">·</span>
                              <span>{item.reason}</span>
                            </div>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-900 shrink-0 mt-1" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="pt-3 border-t border-stone-200/90 space-y-2 shrink-0">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenModalForNode(selectedNode.id, 'deep-dive')}
                    className="min-h-[40px] px-3 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-50 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-amber-300" />
                    <span>深潜弹窗</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenModalForNode(selectedNode.id, 'mini-quiz')}
                    className="min-h-[40px] px-3 py-2 rounded-xl bg-amber-900 hover:bg-amber-800 text-amber-50 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-amber-200" />
                    <span>随堂微测验</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      gameAudio.playTap();
                      navigate(`/law/${selectedNode.id}`);
                    }}
                    className="flex-1 min-h-[38px] px-3 py-1.5 rounded-xl bg-white hover:bg-stone-100 border border-[#D4CBB8] text-stone-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>完整典藏条目</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      gameAudio.playTap();
                      navigate(`/game/${selectedNode.relatedGame}`);
                    }}
                    className="min-h-[38px] px-3 py-1.5 rounded-xl bg-white hover:bg-stone-100 border border-[#D4CBB8] text-stone-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Gamepad2 className="w-3.5 h-3.5 text-amber-800" />
                    <span>竞技场</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      gameAudio.playTap();
                      toggleBookmark(selectedNode.id);
                    }}
                    aria-label="收藏该定律"
                    title={isBookmarked(selectedNode.id) ? '取消收藏' : '加入收藏'}
                    className={`min-h-[38px] min-w-[38px] rounded-xl border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                      isBookmarked(selectedNode.id)
                        ? 'bg-amber-50 border-amber-400 text-amber-700'
                        : 'bg-white border-[#D4CBB8] text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <Bookmark
                      className={`w-4 h-4 ${
                        isBookmarked(selectedNode.id) ? 'fill-amber-600 text-amber-600' : ''
                      }`}
                    />
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* Overview Mode: 6-Domain Breakdown + Top Centrality Hubs */
            <div className="space-y-5 overflow-y-auto pr-1 flex-1">
              <div className="space-y-1 pb-3 border-b border-stone-200/90">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900">
                  <Network className="w-4 h-4" />
                  <span>图谱全景导览</span>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  点击左侧任意定律圆点可透视其关联网络，或在下方直接聚焦高频枢纽定律。
                </p>
              </div>

              {/* 6-Domain Cluster Distribution */}
              <div className="space-y-2.5">
                <div className="text-xs font-semibold text-stone-900">六大心理维度分布</div>
                <div className="space-y-2">
                  {(Object.keys(CATEGORY_CLUSTER_META) as CategoryZh[]).map((cat) => {
                    const meta = CATEGORY_CLUSTER_META[cat];
                    const count = graphData.categoryCounts[cat] || 0;
                    const pct = Math.round((count / Math.max(1, graphData.nodes.length)) * 100);
                    const isActive = activeCategory === cat;

                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          gameAudio.playTap();
                          setActiveCategory((prev) => (prev === cat ? 'all' : cat));
                        }}
                        className={`w-full text-left p-2 rounded-lg border transition-colors cursor-pointer space-y-1 ${
                          isActive
                            ? 'bg-white border-stone-900'
                            : 'bg-white/60 border-transparent hover:border-[#D4CBB8] hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-stone-900 flex items-center gap-1.5">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: meta.color }}
                            />
                            <span>{meta.label}</span>
                          </span>
                          <span className="font-numeric tabular-nums text-[11px] text-stone-500">
                            {count} 律 · {pct}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-stone-200/80 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{ width: `${pct}%`, backgroundColor: meta.color }}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Top Bridge Hubs */}
              <div className="space-y-2.5 pt-2 border-t border-stone-200/90">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-stone-900 flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-amber-800" />
                    <span>跨界枢纽定律</span>
                  </span>
                  <span className="text-[11px] text-stone-500">按连接度排序</span>
                </div>

                <div className="space-y-1.5">
                  {graphData.topHubs.slice(0, 8).map((hub, idx) => (
                    <button
                      key={hub.id}
                      type="button"
                      onClick={() => handleFocusNode(hub.id)}
                      className="w-full px-3 py-2 rounded-xl bg-white hover:bg-[#F5EFE3] border border-[#E2DACB] hover:border-stone-500 text-left transition-colors cursor-pointer flex items-center justify-between gap-2 group"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono text-[11px] font-bold text-stone-400 tabular-nums shrink-0">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <span className="text-xs font-semibold text-stone-900 group-hover:text-amber-900 truncate">
                          {hub.nameZh}
                        </span>
                      </div>
                      <span className="text-[11px] font-numeric tabular-nums text-stone-500 shrink-0">
                        {hub.degree} 关联
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Node Deep Dive & Concept Mini-Quiz Modal */}
      <LawDeepDiveModal
        isOpen={modalOpen && Boolean(selectedLaw && selectedNode)}
        law={selectedLaw}
        graphNode={selectedNode}
        neighbors={selectedNeighbors}
        trailStepNumber={activeTrailStepNumber}
        isBookmarked={selectedNode ? isBookmarked(selectedNode.id) : false}
        initialTab={modalInitialTab}
        onClose={() => setModalOpen(false)}
        onToggleBookmark={toggleBookmark}
        onCompleteMiniQuiz={handleCompleteMiniQuiz}
        onJumpToNeighbor={handleJumpToNeighbor}
      />
    </div>
  );
};

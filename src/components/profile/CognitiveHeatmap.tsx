import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as d3 from 'd3';
import {
  Activity,
  ArrowRight,
  BookOpen,
  Compass,
  Gamepad2,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { CategoryZh, DifficultyLevel, PsychologyLaw, UserProfile } from '../../types';
import { PSYCHOLOGY_GAMES } from '../../data/games';
import { gameAudio } from '../../utils/gameAudio';

interface CognitiveHeatmapProps {
  user: UserProfile;
  laws: PsychologyLaw[];
}

type HeatmapViewMode = 'domains' | 'matrix';

type CollectionKey = 'classic' | 'love' | 'reverse' | 'criminal' | 'sexual' | 'micro';

interface HeatmapCell {
  key: string;
  rowId: string;
  rowLabel: string;
  colId: string;
  colLabel: string;
  totalCount: number;
  studiedCount: number;
  masteredCount: number;
  bookmarkedCount: number;
  avgStudiedScore: number;
  gameBonus: number;
  heatScore: number;
  statusLabel: string;
  sampleLaws: PsychologyLaw[];
  learnRoute: string;
  arenaRoute: string;
}

interface DomainRowSummary {
  id: string;
  label: string;
  totalCount: number;
  studiedCount: number;
  masteredCount: number;
  heatScore: number;
  learnRoute: string;
  arenaRoute: string;
}

const CORE_CATEGORIES: CategoryZh[] = ['认知', '记忆', '决策', '社会', '情绪', '行为'];

const COLLECTION_META: Array<{
  id: CollectionKey;
  label: string;
  shortLabel: string;
  learnRoute: string;
  arenaRoute: string;
}> = [
  {
    id: 'classic',
    label: '经典心智定律',
    shortLabel: '经典心智',
    learnRoute: '/learn?mode=classic',
    arenaRoute: '/game/psych-experiment',
  },
  {
    id: 'love',
    label: '爱情心理 696',
    shortLabel: '爱情 696',
    learnRoute: '/learn?mode=love',
    arenaRoute: '/game/love-aleatoric-arena',
  },
  {
    id: 'reverse',
    label: '逆向心理 100',
    shortLabel: '逆向 100',
    learnRoute: '/learn?mode=reverse',
    arenaRoute: '/game/reverse-aleatoric-arena',
  },
  {
    id: 'criminal',
    label: '犯罪心理 100',
    shortLabel: '犯罪 100',
    learnRoute: '/learn?mode=criminal',
    arenaRoute: '/game/criminal-aleatoric-arena',
  },
  {
    id: 'sexual',
    label: '性心理学 100',
    shortLabel: '性心理 100',
    learnRoute: '/learn?mode=sexual',
    arenaRoute: '/game/sexual-aleatoric-arena',
  },
  {
    id: 'micro',
    label: '微表情 FACS',
    shortLabel: '微表情',
    learnRoute: '/learn?mode=microexpressions',
    arenaRoute: '/game/emotion-detective',
  },
];

const CATEGORY_ARENA_ROUTE: Record<CategoryZh, string> = {
  认知: '/game/mind-trap',
  记忆: '/game/memory-lab',
  决策: '/game/anchoring-lab',
  社会: '/game/bystander-breaker',
  情绪: '/game/emotion-detective',
  行为: '/game/micro-habit',
};

const TIER_COLUMNS: Array<{ id: DifficultyLevel | 'ALL'; label: string }> = [
  { id: 'Easy', label: '初阶启蒙' },
  { id: 'Medium', label: '中阶思辨' },
  { id: 'Hard', label: '高阶深化' },
  { id: 'ALL', label: '综合掌握' },
];

function getLawCollection(law: PsychologyLaw): CollectionKey {
  if (law.isSexualPsychology) return 'sexual';
  if (law.isCriminalPsychology) return 'criminal';
  if (law.isReversePsychology) return 'reverse';
  if (law.isMicroexpression) return 'micro';
  if (law.isLoveCodex) return 'love';
  return 'classic';
}

function getEffectiveLawMastery(
  law: PsychologyLaw,
  masteryMap: Record<string, number>,
  masteredSet: Set<string>
): number {
  const mapped = masteryMap[law.id];
  if (typeof mapped === 'number' && !Number.isNaN(mapped)) {
    return Math.max(0, Math.min(100, mapped));
  }
  if (masteredSet.has(law.id)) {
    return 85;
  }
  return 0;
}

function getHeatStatusLabel(score: number, totalCount: number): string {
  if (totalCount === 0) return '无对应词条';
  if (score >= 70) return '深度精熟';
  if (score >= 40) return '稳步进阶';
  if (score > 0) return '初窥门径';
  return '待探索强化';
}

// Multi-stop semantic color scale: untrodden stone -> warm amber -> emerald -> deep forest
const HEAT_COLOR_SCALE = d3
  .scaleLinear<string>()
  .domain([0, 12, 38, 65, 85, 100])
  .range(['#F4F1EA', '#FDE68A', '#F59E0B', '#34D399', '#059669', '#064E3B'])
  .clamp(true);

function computeCellStats(
  lawsInCell: PsychologyLaw[],
  user: UserProfile,
  masteredSet: Set<string>,
  bookmarkSet: Set<string>,
  relatedGameCategoryOrId: { collection?: CollectionKey; category?: CategoryZh }
): {
  totalCount: number;
  studiedCount: number;
  masteredCount: number;
  bookmarkedCount: number;
  avgStudiedScore: number;
  gameBonus: number;
  heatScore: number;
} {
  const totalCount = lawsInCell.length;
  if (totalCount === 0) {
    return {
      totalCount: 0,
      studiedCount: 0,
      masteredCount: 0,
      bookmarkedCount: 0,
      avgStudiedScore: 0,
      gameBonus: 0,
      heatScore: 0,
    };
  }

  const masteryMap = user.lawMasteryMap || {};
  let studiedCount = 0;
  let masteredCount = 0;
  let bookmarkedCount = 0;
  let sumStudied = 0;

  for (const law of lawsInCell) {
    const val = getEffectiveLawMastery(law, masteryMap, masteredSet);
    if (val > 0) {
      studiedCount += 1;
      sumStudied += val;
    }
    if (val >= 80) {
      masteredCount += 1;
    }
    if (bookmarkSet.has(law.id)) {
      bookmarkedCount += 1;
    }
  }

  const avgStudiedScore = studiedCount > 0 ? Math.round(sumStudied / studiedCount) : 0;

  // Factor in verified arena gameplay activity for the matching domain
  const highScores = user.gameHighScores || {};
  let matchedGameSignal = 0;
  const col = relatedGameCategoryOrId.collection;
  const cat = relatedGameCategoryOrId.category;

  if (col === 'love' && (highScores['love-aleatoric-arena'] || 0) > 0) {
    matchedGameSignal = 1;
  } else if (col === 'reverse' && (highScores['reverse-aleatoric-arena'] || 0) > 0) {
    matchedGameSignal = 1;
  } else if (col === 'criminal' && (highScores['criminal-aleatoric-arena'] || 0) > 0) {
    matchedGameSignal = 1;
  } else if (col === 'sexual' && (highScores['sexual-aleatoric-arena'] || 0) > 0) {
    matchedGameSignal = 1;
  } else if (col === 'classic' || !col) {
    const matchingGames = PSYCHOLOGY_GAMES.filter((g) => {
      if (cat && g.category === cat) return true;
      if (cat === '记忆' && g.id === 'memory-lab') return true;
      if (cat === '决策' && (g.id === 'psych-experiment' || g.id === 'anchoring-lab')) return true;
      if (cat === '认知' && (g.id === 'mind-trap' || g.id === 'brain-rush')) return true;
      if (cat === '社会' && (g.id === 'bystander-breaker' || g.id === 'mind-detective')) return true;
      if (cat === '情绪' && g.id === 'emotion-detective') return true;
      if (cat === '行为' && g.id === 'micro-habit') return true;
      return false;
    });
    const activeScores = matchingGames.filter((g) => (highScores[g.id] || 0) > 0);
    if (activeScores.length > 0) {
      matchedGameSignal = Math.min(1, activeScores.length / Math.max(1, matchingGames.length) + 0.35);
    }
  }

  const gameBonus = Math.round(matchedGameSignal * 22);
  const coverageRatio = studiedCount / totalCount;
  const lawContribution =
    studiedCount > 0
      ? Math.pow(coverageRatio, 0.52) * avgStudiedScore + Math.min(14, masteredCount * 3)
      : 0;

  const bookmarkBonus = Math.min(8, bookmarkedCount * 3);
  const heatScore = Math.max(
    0,
    Math.min(
      100,
      masteredCount === totalCount
        ? 100
        : Math.round(lawContribution + gameBonus + bookmarkBonus)
    )
  );

  return {
    totalCount,
    studiedCount,
    masteredCount,
    bookmarkedCount,
    avgStudiedScore,
    gameBonus,
    heatScore,
  };
}

export const CognitiveHeatmap: React.FC<CognitiveHeatmapProps> = ({ user, laws }) => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<HeatmapViewMode>('domains');
  const [selectedCellKey, setSelectedCellKey] = useState<string | null>(null);
  const [hoveredCell, setHoveredCell] = useState<{
    cell: HeatmapCell;
    x: number;
    y: number;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(740);

  // Measure container width responsively so D3 SVG scales smoothly across mobile and desktop
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const updateWidth = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0) {
        setContainerWidth(Math.floor(rect.width));
      }
    };
    updateWidth();

    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(updateWidth);
      ro.observe(el);
      return () => ro.disconnect();
    }
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const masteredSet = useMemo(() => {
    const set = new Set<string>(Array.isArray(user.lawsMastered) ? user.lawsMastered : []);
    Object.entries(user.lawMasteryMap || {}).forEach(([id, score]) => {
      if (typeof score === 'number' && score >= 80) {
        set.add(id);
      }
    });
    return set;
  }, [user.lawsMastered, user.lawMasteryMap]);

  const bookmarkSet = useMemo(
    () => new Set<string>(Array.isArray(user.bookmarks) ? user.bookmarks : []),
    [user.bookmarks]
  );

  // Compute both datasets cleanly from live laws + user progress
  const { rows, cols, cells, domainSummaries } = useMemo<{
    rows: Array<{ id: string; label: string }>;
    cols: Array<{ id: string; label: string }>;
    cells: HeatmapCell[];
    domainSummaries: DomainRowSummary[];
  }>(() => {
    const safeLaws = Array.isArray(laws) ? laws : [];

    // 1. Domain summaries (11 Psychology Domains used for Insights + Domains mode)
    const domainSpecs: Array<{
      id: string;
      label: string;
      collection?: CollectionKey;
      category?: CategoryZh;
      learnRoute: string;
      arenaRoute: string;
      filter: (l: PsychologyLaw) => boolean;
    }> = [
      ...CORE_CATEGORIES.map((cat) => ({
        id: `classic-${cat}`,
        label: `经典 · ${cat}科学`,
        collection: 'classic' as CollectionKey,
        category: cat,
        learnRoute: `/learn?mode=classic&category=${encodeURIComponent(cat)}`,
        arenaRoute: CATEGORY_ARENA_ROUTE[cat],
        filter: (l: PsychologyLaw) => getLawCollection(l) === 'classic' && l.categoryZh === cat,
      })),
      {
        id: 'love',
        label: '爱情心理 696',
        collection: 'love',
        learnRoute: '/learn?mode=love',
        arenaRoute: '/game/love-aleatoric-arena',
        filter: (l) => getLawCollection(l) === 'love',
      },
      {
        id: 'reverse',
        label: '逆向心理 100',
        collection: 'reverse',
        learnRoute: '/learn?mode=reverse',
        arenaRoute: '/game/reverse-aleatoric-arena',
        filter: (l) => getLawCollection(l) === 'reverse',
      },
      {
        id: 'criminal',
        label: '犯罪心理 100',
        collection: 'criminal',
        learnRoute: '/learn?mode=criminal',
        arenaRoute: '/game/criminal-aleatoric-arena',
        filter: (l) => getLawCollection(l) === 'criminal',
      },
      {
        id: 'sexual',
        label: '性心理学 100',
        collection: 'sexual',
        learnRoute: '/learn?mode=sexual',
        arenaRoute: '/game/sexual-aleatoric-arena',
        filter: (l) => getLawCollection(l) === 'sexual',
      },
      {
        id: 'micro',
        label: '微表情 FACS',
        collection: 'micro',
        learnRoute: '/learn?mode=microexpressions',
        arenaRoute: '/game/emotion-detective',
        filter: (l) => getLawCollection(l) === 'micro',
      },
    ];

    const summaries: DomainRowSummary[] = [];
    const domainCells: HeatmapCell[] = [];

    for (const spec of domainSpecs) {
      const domainLaws = safeLaws.filter(spec.filter);
      const overallStats = computeCellStats(domainLaws, user, masteredSet, bookmarkSet, {
        collection: spec.collection,
        category: spec.category,
      });

      summaries.push({
        id: spec.id,
        label: spec.label,
        totalCount: overallStats.totalCount,
        studiedCount: overallStats.studiedCount,
        masteredCount: overallStats.masteredCount,
        heatScore: overallStats.heatScore,
        learnRoute: spec.learnRoute,
        arenaRoute: spec.arenaRoute,
      });

      for (const col of TIER_COLUMNS) {
        const subset =
          col.id === 'ALL'
            ? domainLaws
            : domainLaws.filter((l) => l.difficulty === col.id);
        const stats = computeCellStats(subset, user, masteredSet, bookmarkSet, {
          collection: spec.collection,
          category: spec.category,
        });

        domainCells.push({
          key: `domains::${spec.id}::${col.id}`,
          rowId: spec.id,
          rowLabel: spec.label,
          colId: col.id,
          colLabel: col.label,
          ...stats,
          statusLabel: getHeatStatusLabel(stats.heatScore, stats.totalCount),
          sampleLaws: subset.slice(0, 4),
          learnRoute: spec.learnRoute,
          arenaRoute: spec.arenaRoute,
        });
      }
    }

    if (viewMode === 'domains') {
      return {
        rows: domainSpecs.map((d) => ({ id: d.id, label: d.label })),
        cols: TIER_COLUMNS.map((c) => ({ id: c.id, label: c.label })),
        cells: domainCells,
        domainSummaries: summaries,
      };
    }

    // 2. Collection × Core Cognitive Category Matrix (6 Collections × 6 Dimensions)
    const matrixCells: HeatmapCell[] = [];
    for (const colMeta of COLLECTION_META) {
      const colLaws = safeLaws.filter((l) => getLawCollection(l) === colMeta.id);
      for (const cat of CORE_CATEGORIES) {
        const subset = colLaws.filter((l) => l.categoryZh === cat);
        const stats = computeCellStats(subset, user, masteredSet, bookmarkSet, {
          collection: colMeta.id,
          category: cat,
        });
        matrixCells.push({
          key: `matrix::${colMeta.id}::${cat}`,
          rowId: colMeta.id,
          rowLabel: colMeta.label,
          colId: cat,
          colLabel: `${cat}维度`,
          ...stats,
          statusLabel: getHeatStatusLabel(stats.heatScore, stats.totalCount),
          sampleLaws: subset.slice(0, 4),
          learnRoute:
            colMeta.id === 'classic'
              ? `/learn?mode=classic&category=${encodeURIComponent(cat)}`
              : colMeta.learnRoute,
          arenaRoute: colMeta.id === 'classic' ? CATEGORY_ARENA_ROUTE[cat] : colMeta.arenaRoute,
        });
      }
    }

    return {
      rows: COLLECTION_META.map((c) => ({ id: c.id, label: c.shortLabel })),
      cols: CORE_CATEGORIES.map((c) => ({ id: c, label: c })),
      cells: matrixCells,
      domainSummaries: summaries,
    };
  }, [laws, user, masteredSet, bookmarkSet, viewMode]);

  // Identify Top Mastery Domains and Domains Needing Attention
  const { strengths, attentionNeeded } = useMemo(() => {
    const valid = domainSummaries.filter((d) => d.totalCount > 0);
    const sortedDesc = [...valid].sort((a, b) => b.heatScore - a.heatScore);
    const sortedAsc = [...valid].sort((a, b) => a.heatScore - b.heatScore);

    return {
      strengths: sortedDesc.filter((d) => d.heatScore > 0).slice(0, 3),
      attentionNeeded: sortedAsc.slice(0, 3),
    };
  }, [domainSummaries]);

  const activeCell = useMemo(() => {
    if (selectedCellKey) {
      const found = cells.find((c) => c.key === selectedCellKey && c.totalCount > 0);
      if (found) return found;
    }
    // Default to highest-activity cell if available, otherwise first populated cell
    const sorted = [...cells].filter((c) => c.totalCount > 0).sort((a, b) => b.heatScore - a.heatScore);
    return sorted[0] || null;
  }, [cells, selectedCellKey]);

  // Render D3.js Heatmap SVG
  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl || containerWidth <= 0) return;

    const isCompact = containerWidth < 540;
    const margin = {
      top: 38,
      right: isCompact ? 8 : 16,
      bottom: 16,
      left: isCompact ? 96 : 124,
    };
    const rowHeight = viewMode === 'domains' ? (isCompact ? 38 : 42) : (isCompact ? 46 : 52);
    const innerWidth = Math.max(200, containerWidth - margin.left - margin.right);
    const innerHeight = rows.length * rowHeight;
    const totalHeight = innerHeight + margin.top + margin.bottom;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();
    svg
      .attr('viewBox', `0 0 ${containerWidth} ${totalHeight}`)
      .attr('width', containerWidth)
      .attr('height', totalHeight);

    // SVG pattern for empty structural intersections (no laws in that slice)
    const defs = svg.append('defs');
    const hatch = defs
      .append('pattern')
      .attr('id', 'mindlabz-heatmap-na-hatch')
      .attr('width', 8)
      .attr('height', 8)
      .attr('patternTransform', 'rotate(45 0 0)')
      .attr('patternUnits', 'userSpaceOnUse');
    hatch.append('rect').attr('width', 8).attr('height', 8).attr('fill', '#FAF8F5');
    hatch
      .append('line')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', 0)
      .attr('y2', 8)
      .attr('stroke', '#E7E5E4')
      .attr('stroke-width', 1.5);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = d3
      .scaleBand<string>()
      .domain(cols.map((c) => c.id))
      .range([0, innerWidth])
      .padding(0.08);

    const yScale = d3
      .scaleBand<string>()
      .domain(rows.map((r) => r.id))
      .range([0, innerHeight])
      .padding(0.12);

    // Top Column Axis Labels
    const xAxisGroup = g
      .append('g')
      .attr('class', 'x-axis')
      .selectAll('text')
      .data(cols)
      .enter()
      .append('text')
      .attr('x', (d) => (xScale(d.id) ?? 0) + xScale.bandwidth() / 2)
      .attr('y', -14)
      .attr('text-anchor', 'middle')
      .attr('fill', '#44403C')
      .attr('font-size', isCompact ? '11px' : '12px')
      .attr('font-weight', 600)
      .text((d) => d.label);

    void xAxisGroup;

    // Left Row Labels
    g.append('g')
      .attr('class', 'y-axis')
      .selectAll('text')
      .data(rows)
      .enter()
      .append('text')
      .attr('x', -10)
      .attr('y', (d) => (yScale(d.id) ?? 0) + yScale.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'end')
      .attr('fill', '#1C1917')
      .attr('font-size', isCompact ? '11px' : '12px')
      .attr('font-weight', 600)
      .text((d) => d.label);

    // Heatmap Cells
    const cellGroups = g
      .selectAll<SVGGElement, HeatmapCell>('g.heatmap-cell')
      .data(cells, (d) => d.key)
      .enter()
      .append('g')
      .attr('class', 'heatmap-cell')
      .attr(
        'transform',
        (d) => `translate(${xScale(d.colId) ?? 0},${yScale(d.rowId) ?? 0})`
      )
      .style('cursor', (d) => (d.totalCount > 0 ? 'pointer' : 'default'));

    const bw = xScale.bandwidth();
    const bh = yScale.bandwidth();
    const activeSelectionKey = activeCell?.key;

    const rects = cellGroups
      .append('rect')
      .attr('width', bw)
      .attr('height', bh)
      .attr('rx', 8)
      .attr('ry', 8)
      .attr('fill', (d) => {
        if (d.totalCount === 0) return 'url(#mindlabz-heatmap-na-hatch)';
        return prefersReducedMotion ? HEAT_COLOR_SCALE(d.heatScore) : '#F4F1EA';
      })
      .attr('stroke', (d) => {
        if (d.key === activeSelectionKey) return '#1C1917';
        return d.totalCount === 0 ? '#E7E5E4' : 'rgba(28, 25, 23, 0.08)';
      })
      .attr('stroke-width', (d) => (d.key === activeSelectionKey ? 2 : 1));

    if (!prefersReducedMotion) {
      rects
        .transition()
        .duration(340)
        .delay((_, i) => Math.min(i * 6, 180))
        .attr('fill', (d) =>
          d.totalCount === 0 ? 'url(#mindlabz-heatmap-na-hatch)' : HEAT_COLOR_SCALE(d.heatScore)
        );
    }

    // Primary Percentage Text inside Cell
    cellGroups
      .append('text')
      .attr('x', bw / 2)
      .attr('y', (d) => (d.totalCount > 0 && !isCompact && bh >= 36 ? bh / 2 - 4 : bh / 2))
      .attr('dy', '0.35em')
      .attr('text-anchor', 'middle')
      .attr('fill', (d) => {
        if (d.totalCount === 0) return '#A8A29E';
        return d.heatScore >= 62 ? '#FFFFFF' : '#1C1917';
      })
      .attr('font-size', isCompact ? '11px' : '12.5px')
      .attr('font-weight', 700)
      .style('font-variant-numeric', 'tabular-nums')
      .style('pointer-events', 'none')
      .text((d) => (d.totalCount === 0 ? '—' : `${d.heatScore}%`));

    // Secondary Mastery Ratio Sub-label (desktop & taller cells)
    if (!isCompact && bh >= 36) {
      cellGroups
        .append('text')
        .attr('x', bw / 2)
        .attr('y', bh / 2 + 11)
        .attr('dy', '0.3em')
        .attr('text-anchor', 'middle')
        .attr('fill', (d) => {
          if (d.totalCount === 0) return 'transparent';
          return d.heatScore >= 62 ? 'rgba(255,255,255,0.85)' : '#57534E';
        })
        .attr('font-size', '9.5px')
        .style('font-variant-numeric', 'tabular-nums')
        .style('pointer-events', 'none')
        .text((d) => (d.totalCount === 0 ? '' : `${d.masteredCount}/${d.totalCount}`));
    }

    // D3 Interactive Event Handlers
    cellGroups
      .on('mouseenter', function (_event, d) {
        if (d.totalCount === 0) return;
        d3.select(this)
          .select('rect')
          .attr('stroke', '#1C1917')
          .attr('stroke-width', 2);

        const cx = margin.left + (xScale(d.colId) ?? 0) + bw / 2;
        const cy = margin.top + (yScale(d.rowId) ?? 0);
        setHoveredCell({ cell: d, x: cx, y: cy });
      })
      .on('mouseleave', function (_event, d) {
        d3.select(this)
          .select('rect')
          .attr('stroke', d.key === activeSelectionKey ? '#1C1917' : 'rgba(28, 25, 23, 0.08)')
          .attr('stroke-width', d.key === activeSelectionKey ? 2 : 1);
        setHoveredCell(null);
      })
      .on('click', (_event, d) => {
        if (d.totalCount === 0) return;
        gameAudio.playTap();
        setSelectedCellKey(d.key);
      });
  }, [cells, rows, cols, containerWidth, viewMode, activeCell?.key]);

  return (
    <section className="editorial-card rounded-2xl p-6 sm:p-8 space-y-6 bg-white border border-stone-200/90">
      {/* Header & View Mode Segmented Switcher */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-stone-200/80">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-stone-500">
            <span className="editorial-kicker text-[10px] text-stone-600">
              D3.js Cognitive Heatmap
            </span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">全库 {laws.length} 律实时评估</span>
          </div>
          <h3 className="font-serif-editorial text-lg sm:text-xl font-bold text-stone-900 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>心理学全领域掌握热力图</span>
          </h3>
          <p className="text-xs text-stone-600 leading-relaxed max-w-2xl">
            基于定律精熟度、探索覆盖率与竞技场实操得分动态渲染，直观区分已内化的优势板块与尚待加强的心智盲区。
          </p>
        </div>

        {/* Interactive Mode Switcher */}
        <div
          className="inline-flex items-center p-1 bg-stone-100 rounded-xl border border-stone-200/70 shrink-0 self-start md:self-auto"
          role="tablist"
          aria-label="热力图分析视角切换"
        >
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'domains'}
            onClick={() => {
              gameAudio.playTap();
              setViewMode('domains');
              setSelectedCellKey(null);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              viewMode === 'domains'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            领域 × 难度阶梯
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'matrix'}
            onClick={() => {
              gameAudio.playTap();
              setViewMode('matrix');
              setSelectedCellKey(null);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              viewMode === 'matrix'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            专题 × 心智维度
          </button>
        </div>
      </div>

      {/* Mastery vs Attention Diagnostic Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Strengths / Mastery */}
        <div className="rounded-xl p-4 bg-[#FAF8F5] border border-stone-200/80 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span>已形成优势领域</span>
            </span>
            <span className="text-[11px] text-stone-500 font-numeric tabular-nums">
              {strengths.length > 0 ? `Top ${strengths.length}` : '待累计'}
            </span>
          </div>

          {strengths.length > 0 ? (
            <div className="divide-y divide-stone-200/70">
              {strengths.map((item) => (
                <div
                  key={item.id}
                  className="py-2 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-stone-900 truncate">{item.label}</div>
                    <div className="text-[11px] text-stone-500 font-numeric tabular-nums">
                      精熟 {item.masteredCount}/{item.totalCount} 律 · 综合指数 {item.heatScore}%
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      gameAudio.playTap();
                      navigate(item.learnRoute);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-50 border border-stone-200 hover:border-emerald-300 text-[11px] font-semibold text-stone-700 hover:text-emerald-800 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    巩固 →
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-stone-500 py-2">
              完成定律阅读或竞技场对局后，此处将自动点亮您的心智优势领域。
            </p>
          )}
        </div>

        {/* Attention Needed */}
        <div className="rounded-xl p-4 bg-[#FAF8F5] border border-stone-200/80 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span>建议重点强化领域</span>
            </span>
            <span className="text-[11px] text-stone-500 font-numeric tabular-nums">
              优先突破项
            </span>
          </div>

          <div className="divide-y divide-stone-200/70">
            {attentionNeeded.map((item) => (
              <div
                key={item.id}
                className="py-2 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="text-xs font-bold text-stone-900 truncate">{item.label}</div>
                  <div className="text-[11px] text-stone-500 font-numeric tabular-nums">
                    待开拓 {item.totalCount - item.studiedCount}/{item.totalCount} 律 · 当前 {item.heatScore}%
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      gameAudio.playTap();
                      navigate(item.learnRoute);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    去研习
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      gameAudio.playTap();
                      navigate(item.arenaRoute);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-amber-50 border border-stone-200 hover:border-amber-300 text-stone-700 text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    实战
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* D3.js Interactive SVG Heatmap Canvas */}
      <div className="space-y-3">
        <div
          ref={containerRef}
          className="relative w-full rounded-xl border border-stone-200/80 bg-[#FDFCF9] p-2 sm:p-4 overflow-hidden"
        >
          <svg
            ref={svgRef}
            className="w-full block select-none"
            role="img"
            aria-label="心理学领域掌握进度热力图"
          />

          {/* Floating D3 Hover Tooltip */}
          {hoveredCell && (
            <div
              className="pointer-events-none absolute z-20 px-3 py-2 rounded-xl bg-stone-900 text-white shadow-xl border border-stone-700 text-xs max-w-[230px] -translate-x-1/2 -translate-y-full"
              style={{
                left: `${Math.max(115, Math.min(containerWidth - 115, hoveredCell.x))}px`,
                top: `${Math.max(70, hoveredCell.y - 6)}px`,
              }}
            >
              <div className="font-bold text-amber-300 truncate">
                {hoveredCell.cell.rowLabel} · {hoveredCell.cell.colLabel}
              </div>
              <div className="text-[11px] text-stone-200 font-numeric tabular-nums mt-0.5">
                掌握指数 {hoveredCell.cell.heatScore}% · {hoveredCell.cell.statusLabel}
              </div>
              <div className="text-[10px] text-stone-400 font-numeric tabular-nums mt-0.5">
                精熟 {hoveredCell.cell.masteredCount} / 已学 {hoveredCell.cell.studiedCount} / 共 {hoveredCell.cell.totalCount} 律
              </div>
            </div>
          )}
        </div>

        {/* Continuous Color Scale Legend (Text + Numeric + Swatch) */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-[11px] text-stone-600">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-semibold text-stone-700">热度刻度：</span>
            <span className="inline-flex items-center gap-1.5 tabular-nums">
              <span className="w-3.5 h-3.5 rounded-sm bg-[#F4F1EA] border border-stone-300 inline-block" />
              <span>0% 待探索</span>
            </span>
            <span className="inline-flex items-center gap-1.5 tabular-nums">
              <span className="w-3.5 h-3.5 rounded-sm bg-[#FDE68A] border border-amber-300 inline-block" />
              <span>1–39% 初窥门径</span>
            </span>
            <span className="inline-flex items-center gap-1.5 tabular-nums">
              <span className="w-3.5 h-3.5 rounded-sm bg-[#34D399] inline-block" />
              <span>40–69% 稳步进阶</span>
            </span>
            <span className="inline-flex items-center gap-1.5 tabular-nums">
              <span className="w-3.5 h-3.5 rounded-sm bg-[#059669] inline-block" />
              <span>70–100% 深度精熟</span>
            </span>
          </div>
          <span className="text-stone-400 font-mono">点击任意热力格查看明细与直达入口</span>
        </div>
      </div>

      {/* Selected Cell Drill-Down Inspector */}
      {activeCell && (
        <div className="rounded-xl p-4 sm:p-5 bg-[#FAF8F5] border border-stone-200/90 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200/80">
            <div className="space-y-0.5">
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono text-stone-500 tabular-nums">
                <span className="font-bold text-stone-800">{activeCell.statusLabel}</span>
                <span aria-hidden="true">·</span>
                <span>掌握指数 {activeCell.heatScore}%</span>
                <span aria-hidden="true">·</span>
                <span>共 {activeCell.totalCount} 条定律</span>
              </div>
              <h4 className="font-serif-editorial text-base font-bold text-stone-900">
                {activeCell.rowLabel} — {activeCell.colLabel}
              </h4>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  gameAudio.playTap();
                  navigate(activeCell.learnRoute);
                }}
                className="px-3.5 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-300" />
                <span>进入定律库研习</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  gameAudio.playTap();
                  navigate(activeCell.arenaRoute);
                }}
                className="px-3.5 py-2 rounded-lg bg-white hover:bg-stone-100 border border-stone-300 text-stone-800 text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 transition-colors"
              >
                <Gamepad2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>竞技场实战</span>
              </button>
            </div>
          </div>

          {/* Numeric Breakdown Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-numeric tabular-nums">
            <div className="p-2.5 rounded-lg bg-white border border-stone-200/70">
              <span className="text-[11px] text-stone-500 block">已精熟 (≥80%)</span>
              <strong className="text-sm font-bold text-emerald-700">
                {activeCell.masteredCount} / {activeCell.totalCount} 律
              </strong>
            </div>
            <div className="p-2.5 rounded-lg bg-white border border-stone-200/70">
              <span className="text-[11px] text-stone-500 block">已学习词条</span>
              <strong className="text-sm font-bold text-stone-900">
                {activeCell.studiedCount} 律
              </strong>
            </div>
            <div className="p-2.5 rounded-lg bg-white border border-stone-200/70">
              <span className="text-[11px] text-stone-500 block">已学均分</span>
              <strong className="text-sm font-bold text-stone-900">
                {activeCell.avgStudiedScore > 0 ? `${activeCell.avgStudiedScore}%` : '—'}
              </strong>
            </div>
            <div className="p-2.5 rounded-lg bg-white border border-stone-200/70">
              <span className="text-[11px] text-stone-500 block">已收藏笔记</span>
              <strong className="text-sm font-bold text-amber-800">
                {activeCell.bookmarkedCount} 律
              </strong>
            </div>
          </div>

          {/* Sample Laws in Selected Cell */}
          {activeCell.sampleLaws.length > 0 && (
            <div className="space-y-2">
              <div className="text-[11px] font-mono text-stone-500 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-amber-700" />
                <span>代表性定律直达</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {activeCell.sampleLaws.map((law) => {
                  const score = getEffectiveLawMastery(
                    law,
                    user.lawMasteryMap || {},
                    masteredSet
                  );
                  return (
                    <button
                      key={law.id}
                      type="button"
                      onClick={() => {
                        gameAudio.playTap();
                        navigate(`/law/${law.id}`);
                      }}
                      className="p-2.5 rounded-lg bg-white hover:bg-amber-50/60 border border-stone-200/80 hover:border-amber-300 text-left flex items-center justify-between gap-2 cursor-pointer transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="text-[10px] font-mono text-stone-500 tabular-nums">
                          {law.codeId || law.id.toUpperCase()} · {score > 0 ? `掌握 ${score}%` : '未学习'}
                        </div>
                        <div className="text-xs font-bold text-stone-900 truncate">
                          {law.nameZh}
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

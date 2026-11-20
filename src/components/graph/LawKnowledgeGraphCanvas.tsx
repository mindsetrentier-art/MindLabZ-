import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as d3 from 'd3';
import { ZoomIn, ZoomOut, Maximize2, RotateCcw, Eye, EyeOff, Crosshair } from 'lucide-react';
import { CategoryZh } from '../../types';
import {
  CATEGORY_CLUSTER_META,
  GraphRelationType,
  LawGraphLink,
  LawGraphNode,
  LawKnowledgeGraphData,
  RELATION_META,
} from '../../utils/knowledgeGraphBuilder';

interface LawKnowledgeGraphCanvasProps {
  graphData: LawKnowledgeGraphData;
  selectedNodeId: string | null;
  activeCategoryFilter: 'all' | CategoryZh;
  activeRelationFilter: 'all' | GraphRelationType;
  searchHighlightIds: Set<string> | null;
  conceptTrailIds?: string[];
  focusSequence: number;
  onSelectNode: (nodeId: string | null) => void;
  onResetFilters?: () => void;
}

interface HoveredTooltipState {
  node: LawGraphNode;
  screenX: number;
  screenY: number;
}

const ALL_CATEGORIES: CategoryZh[] = ['认知', '记忆', '决策', '行为', '情绪', '社会'];

export const LawKnowledgeGraphCanvas: React.FC<LawKnowledgeGraphCanvasProps> = ({
  graphData,
  selectedNodeId,
  activeCategoryFilter,
  activeRelationFilter,
  searchHighlightIds,
  conceptTrailIds = [],
  focusSequence,
  onSelectNode,
  onResetFilters,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 860,
    height: 620,
  });
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [zoomPercent, setZoomPercent] = useState<number>(85);
  const [hoveredState, setHoveredState] = useState<HoveredTooltipState | null>(null);

  // Mutable simulation refs for 60fps Canvas rendering
  const simNodesRef = useRef<LawGraphNode[]>([]);
  const simLinksRef = useRef<LawGraphLink[]>([]);
  const simulationRef = useRef<d3.Simulation<LawGraphNode, LawGraphLink> | null>(null);
  const quadtreeRef = useRef<d3.Quadtree<LawGraphNode> | null>(null);
  const transformRef = useRef<d3.ZoomTransform>(d3.zoomIdentity);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<HTMLCanvasElement, unknown> | null>(null);

  const selectedIdRef = useRef<string | null>(selectedNodeId);
  const hoveredIdRef = useRef<string | null>(null);
  const categoryFilterRef = useRef<'all' | CategoryZh>(activeCategoryFilter);
  const relationFilterRef = useRef<'all' | GraphRelationType>(activeRelationFilter);
  const searchHighlightRef = useRef<Set<string> | null>(searchHighlightIds);
  const conceptTrailRef = useRef<string[]>(conceptTrailIds);
  const showLabelsRef = useRef<boolean>(showLabels);
  const onSelectNodeRef = useRef(onSelectNode);

  selectedIdRef.current = selectedNodeId;
  categoryFilterRef.current = activeCategoryFilter;
  relationFilterRef.current = activeRelationFilter;
  searchHighlightRef.current = searchHighlightIds;
  conceptTrailRef.current = conceptTrailIds;
  showLabelsRef.current = showLabels;
  onSelectNodeRef.current = onSelectNode;

  // Quick neighbor lookup set for O(1) hover/select glow checks
  const neighborLookup = useMemo(() => {
    const map = new Map<string, Set<string>>();
    graphData.adjacency.forEach((list, id) => {
      map.set(
        id,
        new Set(list.map((item) => item.neighborId))
      );
    });
    return map;
  }, [graphData]);
  const neighborLookupRef = useRef(neighborLookup);
  neighborLookupRef.current = neighborLookup;

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  // Responsive ResizeObserver
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 120 && rect.height > 120) {
        setDimensions({
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        });
      }
    };
    updateSize();

    const ro = new ResizeObserver(updateSize);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Core 60fps Canvas Paint Function
  const drawGraph = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const { width, height } = dimensions;
    const targetW = Math.round(width * dpr);
    const targetH = Math.round(height * dpr);
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // 1. Clean Archival Alabaster Background
    ctx.fillStyle = '#F7F4EC';
    ctx.fillRect(0, 0, width, height);

    const t = transformRef.current;
    ctx.translate(t.x, t.y);
    ctx.scale(t.k, t.k);

    const nodes = simNodesRef.current;
    const links = simLinksRef.current;
    const focusId = hoveredIdRef.current || selectedIdRef.current;
    const focusNeighbors = focusId ? neighborLookupRef.current.get(focusId) : null;
    const catFilter = categoryFilterRef.current;
    const relFilter = relationFilterRef.current;
    const searchSet = searchHighlightRef.current;

    // 2. Subtle Architectural Radial Grid & Domain Cluster Halos
    ctx.save();
    ctx.strokeStyle = 'rgba(120, 113, 108, 0.11)';
    ctx.lineWidth = 1 / t.k;
    [140, 265, 390].forEach((r) => {
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
    });

    ALL_CATEGORIES.forEach((cat) => {
      const meta = CATEGORY_CLUSTER_META[cat];
      const cx = Math.cos(meta.angleRad) * 250;
      const cy = Math.sin(meta.angleRad) * 250;
      const isCatDimmed = catFilter !== 'all' && catFilter !== cat;

      ctx.beginPath();
      ctx.arc(cx, cy, 128, 0, Math.PI * 2);
      ctx.fillStyle = isCatDimmed ? 'rgba(214, 211, 209, 0.04)' : meta.softFill;
      ctx.fill();

      ctx.strokeStyle = isCatDimmed
        ? 'rgba(120, 113, 108, 0.08)'
        : `${meta.color}28`;
      ctx.lineWidth = 1 / t.k;
      ctx.stroke();
    });
    ctx.restore();

    const isNodeVisibleInFilter = (node: LawGraphNode) => {
      if (catFilter !== 'all' && node.categoryZh !== catFilter) return false;
      if (searchSet && !searchSet.has(node.id)) return false;
      return true;
    };

    // 3. Semantic Relation Edges
    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      if (relFilter !== 'all' && link.relationType !== relFilter) continue;

      const s = link.source as LawGraphNode;
      const trg = link.target as LawGraphNode;
      if (s.x === undefined || s.y === undefined || trg.x === undefined || trg.y === undefined) {
        continue;
      }

      const sVis = isNodeVisibleInFilter(s);
      const tVis = isNodeVisibleInFilter(trg);
      const isConnectedToFocus = focusId && (s.id === focusId || trg.id === focusId);

      // Performance & legibility: when zoomed far out without focus, keep faint hairlines
      if (!isConnectedToFocus && (!sVis || !tVis)) {
        if (catFilter !== 'all' || searchSet) continue;
      }

      const relMeta = RELATION_META[link.relationType];
      ctx.beginPath();
      // Slight gentle curve so parallel connections read gracefully
      const mx = (s.x + trg.x) / 2;
      const my = (s.y + trg.y) / 2;
      const dx = trg.x - s.x;
      const dy = trg.y - s.y;
      const curveOffset = link.relationType === 'concept-bridge' ? 0.09 : link.relationType === 'arena-synergy' ? -0.09 : 0;
      const cx = mx - dy * curveOffset;
      const cy = my + dx * curveOffset;

      ctx.moveTo(s.x, s.y);
      ctx.quadraticCurveTo(cx, cy, trg.x, trg.y);

      if (isConnectedToFocus) {
        ctx.strokeStyle = relMeta.color;
        ctx.globalAlpha = 0.88;
        ctx.lineWidth = Math.max(1.5, 2.2 / Math.sqrt(t.k));
      } else if (focusId) {
        ctx.strokeStyle = 'rgba(120, 113, 108, 0.14)';
        ctx.globalAlpha = 0.18;
        ctx.lineWidth = 0.65 / Math.sqrt(t.k);
      } else {
        ctx.strokeStyle =
          link.relationType === 'concept-bridge'
            ? 'rgba(180, 83, 9, 0.22)'
            : link.relationType === 'arena-synergy'
            ? 'rgba(4, 120, 87, 0.18)'
            : 'rgba(87, 83, 78, 0.17)';
        ctx.globalAlpha = catFilter !== 'all' && !(sVis && tVis) ? 0.12 : 0.72;
        ctx.lineWidth = Math.max(0.55, 0.9 / Math.sqrt(t.k));
      }

      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // 3B. Concept Trail Illuminated Path Overlay
    const trailIds = conceptTrailRef.current;
    const simNodeLookup = new Map<string, LawGraphNode>();
    for (let i = 0; i < nodes.length; i++) {
      simNodeLookup.set(nodes[i].id, nodes[i]);
    }
    if (trailIds.length >= 2) {
      ctx.save();
      for (let i = 0; i < trailIds.length - 1; i++) {
        const a = simNodeLookup.get(trailIds[i]);
        const b = simNodeLookup.get(trailIds[i + 1]);
        if (!a || !b || a.x === undefined || a.y === undefined || b.x === undefined || b.y === undefined) {
          continue;
        }
        // Soft gold outer glow trail
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = 'rgba(217, 119, 6, 0.28)';
        ctx.lineWidth = Math.max(4.5, 6 / Math.sqrt(t.k));
        ctx.stroke();

        // Crisp amber dashed core trajectory
        ctx.beginPath();
        ctx.setLineDash([6 / Math.sqrt(t.k), 4 / Math.sqrt(t.k)]);
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = '#B45309';
        ctx.lineWidth = Math.max(1.8, 2.2 / Math.sqrt(t.k));
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.restore();
    }

    // 4. Law Nodes (Dual-Coded: Category Hue + Degree Radius + Mastery Gold Ring)
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (node.x === undefined || node.y === undefined) continue;

      const meta = CATEGORY_CLUSTER_META[node.categoryZh];
      const matchesFilter = isNodeVisibleInFilter(node);
      const isSelected = node.id === selectedIdRef.current;
      const isHovered = node.id === hoveredIdRef.current;
      const isNeighbor = focusNeighbors ? focusNeighbors.has(node.id) : false;

      let alpha = 1;
      if (focusId) {
        alpha = isSelected || isHovered || isNeighbor ? 1 : 0.16;
      } else if (!matchesFilter) {
        alpha = 0.14;
      }

      ctx.save();
      ctx.globalAlpha = alpha;

      const r =
        isSelected || isHovered
          ? node.radius * 1.45
          : isNeighbor
          ? node.radius * 1.18
          : node.radius;

      // Subtle outer selection / mastery ring
      if (isSelected || isHovered) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, r + 4.5, 0, Math.PI * 2);
        ctx.fillStyle = `${meta.color}22`;
        ctx.fill();
        ctx.strokeStyle = '#1C1917';
        ctx.lineWidth = 1.6 / Math.sqrt(t.k);
        ctx.stroke();
      } else if (node.isMastered) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, r + 2.4, 0, Math.PI * 2);
        ctx.strokeStyle = '#D97706';
        ctx.lineWidth = 1.25 / Math.sqrt(t.k);
        ctx.stroke();
      }

      // Main Node Circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
      ctx.fillStyle = meta.color;
      ctx.fill();

      ctx.strokeStyle = '#FCF9F2';
      ctx.lineWidth = Math.max(0.8, 1.15 / Math.sqrt(t.k));
      ctx.stroke();

      // Microexpression badge accent center dot
      if (node.isMicroexpression && r >= 5) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, Math.max(1.6, r * 0.34), 0, Math.PI * 2);
        ctx.fillStyle = '#FDE68A';
        ctx.fill();
      }

      ctx.restore();
    }

    // 4B. Concept Trail Step Badges (1, 2, 3...)
    if (trailIds.length > 0) {
      ctx.save();
      const badgeR = Math.max(6.5, 8.5 / Math.pow(t.k, 0.45));
      ctx.font = `700 ${Math.round(badgeR * 1.15)}px "Plus Jakarta Sans", monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      trailIds.forEach((tid, stepIdx) => {
        const node = simNodeLookup.get(tid);
        if (!node || node.x === undefined || node.y === undefined) return;
        const bx = node.x - node.radius * 0.85;
        const by = node.y - node.radius * 0.85;

        ctx.beginPath();
        ctx.arc(bx, by, badgeR, 0, Math.PI * 2);
        ctx.fillStyle = '#1C1917';
        ctx.fill();
        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 1.4 / Math.sqrt(t.k);
        ctx.stroke();

        ctx.fillStyle = '#FDE68A';
        ctx.fillText(String(stepIdx + 1), bx, by + 0.5);
      });
      ctx.restore();
    }

    // 5. Cluster Domain Titles (Always crisp at cluster perimeter)
    ctx.save();
    ALL_CATEGORIES.forEach((cat) => {
      const meta = CATEGORY_CLUSTER_META[cat];
      const labelDist = 376;
      const lx = Math.cos(meta.angleRad) * labelDist;
      const ly = Math.sin(meta.angleRad) * labelDist;
      const isDimmed = catFilter !== 'all' && catFilter !== cat;

      ctx.globalAlpha = isDimmed ? 0.25 : 0.92;
      const fontSize = Math.max(10, Math.min(15, 13 / Math.pow(t.k, 0.45)));
      ctx.font = `700 ${fontSize}px "Noto Serif SC", "Playfair Display", Georgia, serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = meta.color;
      ctx.fillText(`${meta.label}`, lx, ly - fontSize * 0.55);

      ctx.font = `600 ${Math.max(8, fontSize * 0.72)}px "Plus Jakarta Sans", sans-serif`;
      ctx.fillStyle = '#57534E';
      ctx.fillText(
        `${meta.en.toUpperCase()} · ${graphData.categoryCounts[cat] || 0}`,
        lx,
        ly + fontSize * 0.55
      );
    });
    ctx.restore();

    // 6. Adaptive Semantic Zoom Labels with Collision Culling
    if (showLabelsRef.current) {
      const placedBoxes: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
      const fontSize = Math.max(9.5, Math.min(12.5, 11 / Math.pow(t.k, 0.55)));
      ctx.font = `600 ${fontSize}px "Noto Sans SC", "Plus Jakarta Sans", sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';

      // Priority order: Selected/Hovered -> Focus Neighbors -> Bookmarked/Mastered -> Hubs -> Remaining on deep zoom
      const candidateLabels: LawGraphNode[] = [];
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const isFocused = n.id === focusId;
        const isNeighbor = focusNeighbors ? focusNeighbors.has(n.id) : false;

        if (isFocused || isNeighbor) {
          candidateLabels.push(n);
          continue;
        }
        if (focusId) continue; // Keep non-neighbor clutter away while inspecting an ego network!

        if (!isNodeVisibleInFilter(n)) continue;

        if (t.k < 0.78) {
          if (n.degree >= 9 || n.isMicroexpression) candidateLabels.push(n);
        } else if (t.k < 1.35) {
          if (n.degree >= 7 || n.isMastered || n.isBookmarked || n.isMicroexpression) {
            candidateLabels.push(n);
          }
        } else {
          candidateLabels.push(n);
        }
      }

      candidateLabels.sort((a, b) => {
        const aPrio = (a.id === focusId ? 1000 : focusNeighbors?.has(a.id) ? 500 : 0) + a.degree;
        const bPrio = (b.id === focusId ? 1000 : focusNeighbors?.has(b.id) ? 500 : 0) + b.degree;
        return bPrio - aPrio;
      });

      const maxLabelsToDraw = focusId ? 30 : t.k > 1.6 ? 110 : 42;
      let drawnCount = 0;

      for (let i = 0; i < candidateLabels.length && drawnCount < maxLabelsToDraw; i++) {
        const n = candidateLabels[i];
        if (n.x === undefined || n.y === undefined) continue;

        const text = n.nameZh;
        const textWidth = ctx.measureText(text).width;
        const padX = 4 / Math.sqrt(t.k);
        const boxH = (fontSize + 5) / 1;
        const lx = n.x + n.radius + 5 / Math.sqrt(t.k);
        const ly = n.y;

        const box = {
          x1: lx - padX,
          y1: ly - boxH / 2,
          x2: lx + textWidth + padX,
          y2: ly + boxH / 2,
        };

        // Check overlap except for primary focus node
        if (n.id !== focusId) {
          let collides = false;
          for (let b = 0; b < placedBoxes.length; b++) {
            const p = placedBoxes[b];
            if (box.x1 < p.x2 && box.x2 > p.x1 && box.y1 < p.y2 && box.y2 > p.y1) {
              collides = true;
              break;
            }
          }
          if (collides) continue;
        }

        placedBoxes.push(box);
        drawnCount++;

        // Soft parchment backing so labels read cleanly over hairlines
        ctx.fillStyle =
          n.id === focusId ? 'rgba(28, 25, 23, 0.92)' : 'rgba(251, 249, 244, 0.86)';
        ctx.fillRect(box.x1, box.y1, box.x2 - box.x1, box.y2 - box.y1);

        ctx.fillStyle = n.id === focusId ? '#FEF3C7' : '#1C1917';
        ctx.fillText(text, lx, ly);
      }
    }

    ctx.restore();
  }, [dimensions, graphData]);

  // Initialize & Pre-Settle D3 Force Simulation on Graph Data Changes
  useEffect(() => {
    const clonedNodes: LawGraphNode[] = graphData.nodes.map((n) => ({ ...n }));
    const clonedLinks: LawGraphLink[] = graphData.links.map((l) => ({ ...l }));

    simNodesRef.current = clonedNodes;
    simLinksRef.current = clonedLinks;

    const simulation = d3
      .forceSimulation<LawGraphNode>(clonedNodes)
      .force(
        'link',
        d3
          .forceLink<LawGraphNode, LawGraphLink>(clonedLinks)
          .id((d) => d.id)
          .distance((l) =>
            l.relationType === 'chapter-lineage'
              ? 36
              : l.relationType === 'arena-synergy'
              ? 68
              : 92
          )
          .strength((l) =>
            l.relationType === 'chapter-lineage'
              ? 0.28
              : l.relationType === 'concept-bridge'
              ? 0.14
              : 0.08
          )
      )
      .force('charge', d3.forceManyBody<LawGraphNode>().strength(-52).theta(0.92).distanceMax(320))
      .force('x', d3.forceX<LawGraphNode>((d) => d.clusterX).strength(0.24))
      .force('y', d3.forceY<LawGraphNode>((d) => d.clusterY).strength(0.24))
      .force(
        'collide',
        d3.forceCollide<LawGraphNode>((d) => d.radius + 3.5).iterations(1)
      )
      .stop();

    // Synchronous pre-settlement so the 500-node constellation renders calmly & legibly right away
    simulation.tick(135);
    simulationRef.current = simulation;

    quadtreeRef.current = d3
      .quadtree<LawGraphNode>()
      .x((d) => d.x ?? 0)
      .y((d) => d.y ?? 0)
      .addAll(clonedNodes);

    simulation.on('tick', () => {
      quadtreeRef.current = d3
        .quadtree<LawGraphNode>()
        .x((d) => d.x ?? 0)
        .y((d) => d.y ?? 0)
        .addAll(simNodesRef.current);
      drawGraph();
    });

    drawGraph();

    return () => {
      simulation.stop();
    };
  }, [graphData, drawGraph]);

  // Redraw immediately when filter/selection/labels change without re-running simulation
  useEffect(() => {
    drawGraph();
  }, [
    selectedNodeId,
    activeCategoryFilter,
    activeRelationFilter,
    searchHighlightIds,
    conceptTrailIds,
    showLabels,
    dimensions,
    drawGraph,
  ]);

  // Bind D3 Zoom, Pan, Node Drag, Hover Hit-Testing & Click Selection
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const findNodeAtScreenPos = (sx: number, sy: number): LawGraphNode | null => {
      const qt = quadtreeRef.current;
      if (!qt) return null;
      const [gx, gy] = transformRef.current.invert([sx, sy]);
      const hitRadius = 18 / Math.max(0.4, transformRef.current.k);
      const found = qt.find(gx, gy, hitRadius);
      return found ?? null;
    };

    const zoom = d3
      .zoom<HTMLCanvasElement, unknown>()
      .scaleExtent([0.28, 4.5])
      .filter((event) => {
        // Allow wheel zoom always; prevent pan when dragging directly over a node
        if (event.type === 'wheel') return true;
        if (event.type === 'mousedown' || event.type === 'touchstart') {
          const rect = canvas.getBoundingClientRect();
          const pt =
            event.type === 'touchstart' && (event as TouchEvent).touches[0]
              ? (event as TouchEvent).touches[0]
              : (event as MouseEvent);
          const sx = pt.clientX - rect.left;
          const sy = pt.clientY - rect.top;
          return !findNodeAtScreenPos(sx, sy);
        }
        return !event.button;
      })
      .on('zoom', (event) => {
        transformRef.current = event.transform;
        setZoomPercent(Math.round(event.transform.k * 100));
        drawGraph();
      });

    zoomBehaviorRef.current = zoom;

    const fitInitialTransform = d3.zoomIdentity
      .translate(dimensions.width / 2, dimensions.height / 2)
      .scale(Math.min(dimensions.width, dimensions.height) / 860);

    transformRef.current = fitInitialTransform;
    setZoomPercent(Math.round(fitInitialTransform.k * 100));

    const selection = d3.select(canvas);
    selection.call(zoom).call(zoom.transform, fitInitialTransform);

    // Interactive Node Dragging + Click Detection
    let draggedMoved = false;
    const drag = d3
      .drag<HTMLCanvasElement, unknown>()
      .container(canvas)
      .subject((event) => {
        const found = findNodeAtScreenPos(event.x, event.y);
        if (!found) return undefined;
        return { x: event.x, y: event.y, node: found };
      })
      .on('start', (event) => {
        draggedMoved = false;
        const subjectNode: LawGraphNode | undefined = event.subject?.node;
        if (!subjectNode || !simulationRef.current) return;
        if (!event.active) simulationRef.current.alphaTarget(0.22).restart();
        subjectNode.fx = subjectNode.x;
        subjectNode.fy = subjectNode.y;
      })
      .on('drag', (event) => {
        draggedMoved = true;
        const subjectNode: LawGraphNode | undefined = event.subject?.node;
        if (!subjectNode) return;
        const [gx, gy] = transformRef.current.invert([event.x, event.y]);
        subjectNode.fx = gx;
        subjectNode.fy = gy;
      })
      .on('end', (event) => {
        const subjectNode: LawGraphNode | undefined = event.subject?.node;
        if (!subjectNode || !simulationRef.current) return;
        if (!event.active) simulationRef.current.alphaTarget(0);
        subjectNode.fx = null;
        subjectNode.fy = null;
        if (!draggedMoved) {
          onSelectNodeRef.current(subjectNode.id);
        }
      });

    selection.call(drag);

    // Pointer hover & background click
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const found = findNodeAtScreenPos(sx, sy);
      const nextId = found ? found.id : null;
      if (hoveredIdRef.current !== nextId) {
        hoveredIdRef.current = nextId;
        canvas.style.cursor = found ? 'pointer' : 'grab';
        drawGraph();
      }
      if (found) {
        setHoveredState({ node: found, screenX: sx, screenY: sy });
      } else {
        setHoveredState(null);
      }
    };

    const handleMouseLeave = () => {
      hoveredIdRef.current = null;
      setHoveredState(null);
      drawGraph();
    };

    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const found = findNodeAtScreenPos(sx, sy);
      if (!found) {
        onSelectNodeRef.current(null);
      }
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    canvas.addEventListener('click', handleClick);

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      canvas.removeEventListener('click', handleClick);
      selection.on('.zoom', null);
      selection.on('.drag', null);
    };
  }, [dimensions.width, dimensions.height, drawGraph]);

  // Smooth Camera Pan & Zoom to Focused Node when focusSequence increments
  useEffect(() => {
    if (!selectedNodeId || focusSequence === 0) return;
    const canvas = canvasRef.current;
    const zoom = zoomBehaviorRef.current;
    if (!canvas || !zoom) return;

    const targetNode = simNodesRef.current.find((n) => n.id === selectedNodeId);
    if (!targetNode || targetNode.x === undefined || targetNode.y === undefined) return;

    const targetScale = Math.max(transformRef.current.k, 1.45);
    const nextTransform = d3.zoomIdentity
      .translate(dimensions.width / 2 - targetNode.x * targetScale, dimensions.height / 2 - targetNode.y * targetScale)
      .scale(targetScale);

    const sel = d3.select(canvas);
    if (prefersReducedMotion) {
      sel.call(zoom.transform, nextTransform);
    } else {
      sel.transition().duration(480).ease(d3.easeCubicOut).call(zoom.transform, nextTransform);
    }
  }, [selectedNodeId, focusSequence, dimensions.width, dimensions.height, prefersReducedMotion]);

  const handleFitAll = () => {
    const canvas = canvasRef.current;
    const zoom = zoomBehaviorRef.current;
    if (!canvas || !zoom) return;
    const fitScale = Math.min(dimensions.width, dimensions.height) / 860;
    const nextTransform = d3.zoomIdentity
      .translate(dimensions.width / 2, dimensions.height / 2)
      .scale(fitScale);
    const sel = d3.select(canvas);
    if (prefersReducedMotion) {
      sel.call(zoom.transform, nextTransform);
    } else {
      sel.transition().duration(380).call(zoom.transform, nextTransform);
    }
  };

  const handleZoomBy = (factor: number) => {
    const canvas = canvasRef.current;
    const zoom = zoomBehaviorRef.current;
    if (!canvas || !zoom) return;
    const sel = d3.select(canvas);
    if (prefersReducedMotion) {
      sel.call(zoom.scaleBy, factor);
    } else {
      sel.transition().duration(200).call(zoom.scaleBy, factor);
    }
  };

  const handleRecenterSelected = () => {
    if (!selectedNodeId) {
      handleFitAll();
      return;
    }
    const canvas = canvasRef.current;
    const zoom = zoomBehaviorRef.current;
    const targetNode = simNodesRef.current.find((n) => n.id === selectedNodeId);
    if (!canvas || !zoom || !targetNode || targetNode.x === undefined || targetNode.y === undefined) {
      handleFitAll();
      return;
    }
    const scale = Math.max(transformRef.current.k, 1.45);
    const nextTransform = d3.zoomIdentity
      .translate(dimensions.width / 2 - targetNode.x * scale, dimensions.height / 2 - targetNode.y * scale)
      .scale(scale);
    d3.select(canvas).transition().duration(360).call(zoom.transform, nextTransform);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[540px] sm:h-[600px] lg:h-[640px] rounded-2xl border border-[#D4CBB8] bg-[#F7F4EC] overflow-hidden shadow-xs"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block touch-none"
        aria-label="MindLabZ 心理学定律 D3 知识图谱交互画布"
      />

      {/* Top-Right Canvas Viewport Controls */}
      <div className="absolute top-3.5 right-3.5 z-20 flex items-center gap-1 bg-[#FCF9F2]/94 backdrop-blur-md p-1 rounded-xl border border-[#D4CBB8] shadow-xs">
        <button
          type="button"
          onClick={handleRecenterSelected}
          className="min-h-[34px] px-2.5 py-1 rounded-lg hover:bg-white text-xs font-medium text-stone-800 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          title="居中聚焦当前定律或全图"
        >
          <Crosshair className="w-3.5 h-3.5 text-amber-800" />
          <span className="hidden sm:inline">{selectedNodeId ? '聚焦节点' : '居中'}</span>
        </button>

        <span className="w-px h-4 bg-stone-300" aria-hidden="true" />

        <button
          type="button"
          onClick={() => handleZoomBy(0.78)}
          className="min-h-[34px] min-w-[34px] rounded-lg hover:bg-white text-stone-700 hover:text-stone-950 flex items-center justify-center transition-colors cursor-pointer"
          title="缩小图谱"
          aria-label="缩小图谱"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        <span className="text-[11px] font-mono font-semibold text-stone-700 px-1.5 tabular-nums hidden sm:inline">
          {zoomPercent}%
        </span>

        <button
          type="button"
          onClick={() => handleZoomBy(1.28)}
          className="min-h-[34px] min-w-[34px] rounded-lg hover:bg-white text-stone-700 hover:text-stone-950 flex items-center justify-center transition-colors cursor-pointer"
          title="放大图谱"
          aria-label="放大图谱"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={handleFitAll}
          className="min-h-[34px] min-w-[34px] rounded-lg hover:bg-white text-stone-700 hover:text-stone-950 flex items-center justify-center transition-colors cursor-pointer"
          title="全景视图"
          aria-label="全景视图"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>

        <span className="w-px h-4 bg-stone-300" aria-hidden="true" />

        <button
          type="button"
          onClick={() => setShowLabels((v) => !v)}
          className="min-h-[34px] px-2.5 py-1 rounded-lg hover:bg-white text-xs font-medium text-stone-700 hover:text-stone-950 flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          title={showLabels ? '隐藏节点文字标签' : '显示节点文字标签'}
        >
          {showLabels ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          <span className="hidden md:inline">{showLabels ? '标签开' : '标签关'}</span>
        </button>

        {onResetFilters && (activeCategoryFilter !== 'all' || activeRelationFilter !== 'all' || selectedNodeId) && (
          <button
            type="button"
            onClick={() => {
              onResetFilters();
              handleFitAll();
            }}
            className="min-h-[34px] px-2.5 py-1 rounded-lg hover:bg-white text-xs font-medium text-stone-700 hover:text-stone-950 flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            title="重置筛选与选择"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">重置</span>
          </button>
        )}
      </div>

      {/* Bottom-Left Quiet Architectural Legend (Zero Pulsing Dots / Zero Pills) */}
      <div className="absolute bottom-3.5 left-3.5 z-20 hidden sm:flex flex-wrap items-center gap-x-3.5 gap-y-1 px-3.5 py-2 rounded-xl bg-[#FCF9F2]/92 backdrop-blur-md border border-[#D4CBB8] text-[11px] text-stone-700 pointer-events-none">
        <span className="font-semibold text-stone-900">图例:</span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full border-2 border-amber-600 bg-stone-800 inline-block" />
          <span>已掌握 ≥80%</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3.5 h-0.5 bg-amber-700 inline-block" />
          <span>机制共鸣</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3.5 h-0.5 bg-indigo-700 inline-block" />
          <span>同章脉络</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3.5 h-0.5 bg-emerald-700 inline-block" />
          <span>竞技场联动</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3.5 h-0.5 border-t-2 border-dashed border-amber-700 inline-block" />
          <span>概念探索轨迹</span>
        </span>
      </div>

      {/* Hover Preview Card (Positioned cleanly near cursor without overflowing viewport) */}
      {hoveredState && (
        <div
          className="absolute z-30 pointer-events-none max-w-[260px] px-3.5 py-2.5 rounded-xl bg-[#1C1917]/95 text-stone-100 border border-amber-400/30 shadow-xl space-y-1"
          style={{
            left: `${Math.min(dimensions.width - 275, Math.max(12, hoveredState.screenX + 14))}px`,
            top: `${Math.min(dimensions.height - 130, Math.max(56, hoveredState.screenY - 12))}px`,
          }}
        >
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-amber-300 tabular-nums">
            <span>{hoveredState.node.codeId}</span>
            <span aria-hidden="true">·</span>
            <span>{hoveredState.node.categoryZh}</span>
            <span aria-hidden="true">·</span>
            <span>{hoveredState.node.degree} 条关联</span>
          </div>
          <div className="font-serif-editorial text-xs font-bold text-white leading-snug">
            {hoveredState.node.nameZh}
          </div>
          <div className="text-[10.5px] text-stone-300 line-clamp-2 leading-relaxed">
            {hoveredState.node.shortExplanation}
          </div>
        </div>
      )}
    </div>
  );
};

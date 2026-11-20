import * as d3 from 'd3';
import { CategoryZh, GameType, PsychologyLaw } from '../types';

export type GraphCorpusPreset = 'curated-500' | 'all-laws' | 'core-152' | 'love-codex';

export type GraphRelationType = 'concept-bridge' | 'chapter-lineage' | 'arena-synergy';

export interface LawGraphNode extends d3.SimulationNodeDatum {
  id: string;
  codeId: string;
  nameZh: string;
  nameEn: string;
  categoryZh: CategoryZh;
  chapter: string;
  difficulty: PsychologyLaw['difficulty'];
  shortExplanation: string;
  keyTakeaway: string;
  relatedGame: GameType;
  subTag?: string;
  loveDomainTitle?: string;
  isMicroexpression?: boolean;
  isLoveCodex?: boolean;
  mastery: number;
  isMastered: boolean;
  isBookmarked: boolean;
  mechanisms: string[];
  degree: number;
  radius: number;
  clusterX: number;
  clusterY: number;
}

export interface LawGraphLink extends d3.SimulationLinkDatum<LawGraphNode> {
  id: string;
  source: string | LawGraphNode;
  target: string | LawGraphNode;
  relationType: GraphRelationType;
  weight: number;
  reason: string;
}

export interface LawKnowledgeGraphData {
  nodes: LawGraphNode[];
  links: LawGraphLink[];
  nodeMap: Map<string, LawGraphNode>;
  adjacency: Map<string, Array<{ neighborId: string; relationType: GraphRelationType; reason: string; weight: number }>>;
  topHubs: LawGraphNode[];
  categoryCounts: Record<CategoryZh, number>;
}

export const CATEGORY_CLUSTER_META: Record<
  CategoryZh,
  {
    label: string;
    en: string;
    color: string;
    softFill: string;
    angleRad: number;
  }
> = {
  认知: {
    label: '认知科学',
    en: 'Cognition',
    color: '#4338CA',
    softFill: 'rgba(67, 56, 202, 0.06)',
    angleRad: -Math.PI / 2,
  },
  记忆: {
    label: '记忆与注意',
    en: 'Memory',
    color: '#0E7490',
    softFill: 'rgba(14, 116, 144, 0.06)',
    angleRad: -Math.PI / 6,
  },
  决策: {
    label: '决策博弈',
    en: 'Decision',
    color: '#047857',
    softFill: 'rgba(4, 120, 87, 0.06)',
    angleRad: Math.PI / 6,
  },
  行为: {
    label: '行为与习惯',
    en: 'Behavior',
    color: '#B45309',
    softFill: 'rgba(180, 83, 9, 0.06)',
    angleRad: Math.PI / 2,
  },
  情绪: {
    label: '情绪与共情',
    en: 'Emotion',
    color: '#BE123C',
    softFill: 'rgba(190, 18, 60, 0.06)',
    angleRad: (5 * Math.PI) / 6,
  },
  社会: {
    label: '社会动力',
    en: 'Social',
    color: '#6D28D9',
    softFill: 'rgba(109, 40, 217, 0.06)',
    angleRad: -(5 * Math.PI) / 6,
  },
};

export const RELATION_META: Record<
  GraphRelationType,
  {
    label: string;
    color: string;
    description: string;
  }
> = {
  'concept-bridge': {
    label: '机制共鸣',
    color: '#B45309',
    description: '跨越章节共享同一底层心理机制或认知概念',
  },
  'chapter-lineage': {
    label: '同章脉络',
    color: '#4338CA',
    description: '同一理论专题或相邻认知阶梯中的递进概念',
  },
  'arena-synergy': {
    label: '竞技场联动',
    color: '#047857',
    description: '在同一交互认知实验或训练关卡中协同出现',
  },
};

const MECHANISM_PATTERNS: Array<{ tag: string; keywords: string[] }> = [
  { tag: '启发式与捷径', keywords: ['启发', '捷径', '系统1', '直觉', 'heuristic'] },
  { tag: '认知偏误', keywords: ['偏误', '偏差', '错觉', '幻觉', 'bias', 'illusion'] },
  { tag: '锚定与参照', keywords: ['锚定', '参照', '基准', '比较', 'anchor', 'framing'] },
  { tag: '损失与沉没', keywords: ['损失', '沉没', '禀赋', '厌恶', '稀缺', 'loss', 'sunk'] },
  { tag: '工作记忆', keywords: ['记忆', '遗忘', '回忆', '组块', '提取', 'memory', 'zeigarnik'] },
  { tag: '注意力选择', keywords: ['注意', '专注', '盲视', '过滤', '鸡尾酒', 'attention'] },
  { tag: '依恋与安全基地', keywords: ['依恋', '安全感', '焦虑型', '回避型', 'attachment', '亲密'] },
  { tag: '个人边界', keywords: ['边界', '界限', '自主', '拒绝', '尊重', 'boundary'] },
  { tag: '情绪唤醒与调节', keywords: ['情绪', '焦虑', '愤怒', '悲伤', '平复', '调节', 'emotion'] },
  { tag: '面部动作编码', keywords: ['微表情', 'facs', '动作单元', 'au', '眉毛', '眼睑', '嘴角', '面部'] },
  { tag: '共情与倾听', keywords: ['共情', '倾听', '回应', '接纳', '理解', 'empathy'] },
  { tag: '冲突与修复', keywords: ['冲突', '争吵', '道歉', '修复', '冷战', '退缩', 'conflict'] },
  { tag: '社会认同与从众', keywords: ['从众', '群体', '社会认同', '规范', '旁观者', '权威', 'social'] },
  { tag: '互惠与说服', keywords: ['互惠', '承诺', '一致', '说服', '门槛', '富兰克林'] },
  { tag: '信任与背叛', keywords: ['信任', '坦诚', '怀疑', '猜忌', '安全', 'trust'] },
  { tag: '操纵防御', keywords: ['操纵', '煤气灯', '控制', 'pua', '贬低', 'guilt'] },
  { tag: '归因与投射', keywords: ['归因', '投射', '读心', '误判', '贴标签', 'attribution'] },
  { tag: '自我认知与元认知', keywords: ['元认知', '自尊', '自我', '反思', '达克', '盲区', 'dunning'] },
  { tag: '奖励与多巴胺', keywords: ['多巴胺', '奖励', '即时', '贴现', '成瘾', '期待', 'reward'] },
  { tag: '沟通表达', keywords: ['沟通', '表达', '对话', '非暴力', '指责', 'communication'] },
  { tag: '择偶与价值匹配', keywords: ['择偶', '价值观', '匹配', '吸引', '好感', 'attraction'] },
  { tag: '习惯与拖延', keywords: ['习惯', '拖延', '行动', '微习惯', 'habit', '执行'] },
  { tag: '峰终与体验评估', keywords: ['峰终', '体验', '高潮', '收尾', '满意度', 'peak'] },
  { tag: '证伪与批判推理', keywords: ['证伪', '反证', '概率', '样本', '逻辑', '逻辑推理'] },
];

function extractMechanisms(law: PsychologyLaw): string[] {
  const haystack = [
    law.nameZh,
    law.nameEn,
    law.shortExplanation,
    law.whyItHappens,
    law.keyTakeaway,
    law.subTag || '',
    law.chapter || '',
    law.loveDomainTitle || '',
  ]
    .join(' ')
    .toLowerCase();

  const matched: string[] = [];
  for (const pat of MECHANISM_PATTERNS) {
    if (pat.keywords.some((kw) => haystack.includes(kw))) {
      matched.push(pat.tag);
    }
  }
  if (matched.length === 0) {
    matched.push(`${law.categoryZh}核心规律`);
  }
  return matched.slice(0, 4);
}

/**
 * Selects the corpus subset cleanly.
 * 'curated-500' picks all 10 Microexpressions + all 142 Core & Emotional laws +
 * a stratified 348-law sample across all 7 Love Domains & 50 capitals = 500 laws.
 */
export function selectLawsForPreset(
  allLaws: PsychologyLaw[],
  preset: GraphCorpusPreset
): PsychologyLaw[] {
  if (preset === 'all-laws') {
    return allLaws;
  }
  if (preset === 'core-152') {
    return allLaws.filter((l) => !l.isLoveCodex);
  }
  if (preset === 'love-codex') {
    return allLaws.filter((l) => l.isLoveCodex || l.isMicroexpression);
  }

  // curated-500
  const microAndCore = allLaws.filter((l) => !l.isLoveCodex);
  const loveLaws = allLaws.filter((l) => l.isLoveCodex);
  const targetLoveCount = Math.max(0, 500 - microAndCore.length);
  if (loveLaws.length <= targetLoveCount) {
    return [...microAndCore, ...loveLaws];
  }

  // Stratified uniform sampling across loveLaws so all 7 domains & 50 cities stay represented
  const step = loveLaws.length / targetLoveCount;
  const sampledLove: PsychologyLaw[] = [];
  for (let i = 0; i < targetLoveCount; i++) {
    const idx = Math.min(loveLaws.length - 1, Math.floor(i * step));
    sampledLove.push(loveLaws[idx]);
  }
  return [...microAndCore, ...sampledLove];
}

export function buildLawKnowledgeGraph(
  allLaws: PsychologyLaw[],
  userMasteryMap: Record<string, number>,
  bookmarks: string[],
  preset: GraphCorpusPreset,
  clusterRadius = 250
): LawKnowledgeGraphData {
  const selectedLaws = selectLawsForPreset(allLaws, preset);
  const bookmarkSet = new Set(bookmarks);

  const categoryCounts: Record<CategoryZh, number> = {
    认知: 0,
    记忆: 0,
    决策: 0,
    行为: 0,
    情绪: 0,
    社会: 0,
  };

  const nodes: LawGraphNode[] = selectedLaws.map((law, i) => {
    const cat: CategoryZh = CATEGORY_CLUSTER_META[law.categoryZh] ? law.categoryZh : '认知';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;

    const clusterMeta = CATEGORY_CLUSTER_META[cat];
    const clusterX = Math.cos(clusterMeta.angleRad) * clusterRadius;
    const clusterY = Math.sin(clusterMeta.angleRad) * clusterRadius;

    // Deterministic golden-angle spiral offset inside cluster so initial layout settles cleanly
    const goldenAngle = i * 2.3999632;
    const localR = 16 + ((i * 19) % 105);
    const mastery = userMasteryMap[law.id] ?? law.mastery ?? 0;

    return {
      id: law.id,
      codeId: law.codeId || `LAW${String(i + 1).padStart(3, '0')}`,
      nameZh: law.nameZh,
      nameEn: law.nameEn,
      categoryZh: cat,
      chapter: law.chapter || `${cat}专题`,
      difficulty: law.difficulty,
      shortExplanation: law.shortExplanation,
      keyTakeaway: law.keyTakeaway,
      relatedGame: law.relatedGame,
      subTag: law.subTag,
      loveDomainTitle: law.loveDomainTitle,
      isMicroexpression: law.isMicroexpression,
      isLoveCodex: law.isLoveCodex,
      mastery,
      isMastered: mastery >= 80,
      isBookmarked: bookmarkSet.has(law.id),
      mechanisms: extractMechanisms(law),
      degree: 0,
      radius: 4.5,
      clusterX,
      clusterY,
      x: clusterX + Math.cos(goldenAngle) * localR,
      y: clusterY + Math.sin(goldenAngle) * localR,
    };
  });

  const nodeMap = new Map<string, LawGraphNode>();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  const links: LawGraphLink[] = [];
  const edgeKeys = new Set<string>();
  const nodeDegree = new Map<string, number>();

  const addLink = (
    aId: string,
    bId: string,
    relationType: GraphRelationType,
    weight: number,
    reason: string
  ) => {
    if (aId === bId) return;
    const pairKey = aId < bId ? `${aId}__${bId}` : `${bId}__${aId}`;
    if (edgeKeys.has(pairKey)) return;
    edgeKeys.add(pairKey);

    links.push({
      id: `${pairKey}__${relationType}`,
      source: aId,
      target: bId,
      relationType,
      weight,
      reason,
    });
    nodeDegree.set(aId, (nodeDegree.get(aId) || 0) + 1);
    nodeDegree.set(bId, (nodeDegree.get(bId) || 0) + 1);
  };

  // 1. Chapter & Domain Lineage (chain + local ring within same chapter/domain)
  const byChapter = new Map<string, LawGraphNode[]>();
  for (const n of nodes) {
    const key = n.chapter;
    const arr = byChapter.get(key) || [];
    arr.push(n);
    byChapter.set(key, arr);
  }
  byChapter.forEach((group, chap) => {
    for (let i = 0; i < group.length; i++) {
      if (i + 1 < group.length) {
        addLink(group[i].id, group[i + 1].id, 'chapter-lineage', 0.85, `同章脉络 · ${chap}`);
      }
      // Subtle triadic jump inside large chapters for cohesion
      if (i + 5 < group.length && i % 3 === 0) {
        addLink(group[i].id, group[i + 5].id, 'chapter-lineage', 0.65, `同章谱系 · ${chap}`);
      }
    }
  });

  // 2. Semantic Mechanism Cross-Bridges (connects concepts sharing psychological mechanisms)
  const byMechanism = new Map<string, LawGraphNode[]>();
  for (const n of nodes) {
    for (const mech of n.mechanisms) {
      const arr = byMechanism.get(mech) || [];
      arr.push(n);
      byMechanism.set(mech, arr);
    }
  }

  byMechanism.forEach((group, mech) => {
    if (group.length < 2) return;
    // Prioritize connecting Core/Microexpression hubs with Love/Emotional laws across categories
    const sorted = [...group].sort((a, b) => {
      const aScore = a.isMicroexpression ? 2 : !a.isLoveCodex ? 1 : 0;
      const bScore = b.isMicroexpression ? 2 : !b.isLoveCodex ? 1 : 0;
      return bScore - aScore;
    });

    const anchorPool = sorted.slice(0, Math.min(8, sorted.length));
    for (let i = 0; i < sorted.length; i++) {
      const node = sorted[i];
      if ((nodeDegree.get(node.id) || 0) >= 8) continue;

      // Connect adjacent concepts in the same mechanism bucket
      const partner = sorted[(i + 1) % sorted.length];
      if (partner && partner.id !== node.id && (nodeDegree.get(partner.id) || 0) < 12) {
        addLink(node.id, partner.id, 'concept-bridge', 1.0, `机制共鸣 · ${mech}`);
      }

      // Bridge non-anchor concepts to a balanced cross-category anchor (capped at 14 edges)
      if (i >= anchorPool.length && i % 2 === 0) {
        const anchor = anchorPool[i % anchorPool.length];
        if (
          anchor &&
          anchor.id !== node.id &&
          (nodeDegree.get(anchor.id) || 0) < 14 &&
          (anchor.categoryZh !== node.categoryZh || anchor.isMicroexpression || !anchor.isLoveCodex)
        ) {
          addLink(anchor.id, node.id, 'concept-bridge', 0.92, `跨库桥接 · ${mech}`);
        }
      }
    }
  });

  // 3. Arena Synergy (laws trained inside the same cognitive game module)
  const byGame = new Map<GameType, LawGraphNode[]>();
  for (const n of nodes) {
    const arr = byGame.get(n.relatedGame) || [];
    arr.push(n);
    byGame.set(n.relatedGame, arr);
  }
  const GAME_LABELS: Partial<Record<GameType, string>> = {
    'love-aleatoric-arena': '爱情概率竞技场',
    'reverse-aleatoric-arena': '逆向心理抗拒竞技场',
    'memory-lab': '空间记忆实验室',
    'mind-trap': '认知陷阱辨析',
    'brain-rush': '极速神经反应',
    'mind-detective': '微表情侦探社',
    'psych-experiment': '经典心理实验室',
    'first-impression': '第一印象雷达',
    'anchoring-lab': '锚定校准实验室',
    'majority-answer': '群体从众洞察',
    'peak-end': '峰终体验设计',
    'emotion-detective': '微情绪解码仪',
    'attribution-shift': '归因转换实验室',
    'zero-price-trap': '零元陷阱博弈',
    'micro-habit': '微习惯塑造场',
    'bystander-breaker': '旁观者破局场',
    'falsification-challenge': '科学证伪试炼场',
  };

  byGame.forEach((group, gameId) => {
    if (group.length < 2) return;
    const gameLabel = GAME_LABELS[gameId] || gameId;
    // Sparse deterministic stride so big arenas don't create dense hairballs
    const stride = group.length > 80 ? Math.floor(group.length / 24) : 2;
    for (let i = 0; i + 1 < group.length; i += Math.max(1, stride)) {
      const a = group[i];
      const b = group[(i + 1) % group.length];
      if ((nodeDegree.get(a.id) || 0) < 10 && (nodeDegree.get(b.id) || 0) < 10) {
        addLink(a.id, b.id, 'arena-synergy', 0.6, `竞技场协同 · ${gameLabel}`);
      }
    }
  });

  // Compute adjacency & final node visual degree/radius
  const adjacency: LawKnowledgeGraphData['adjacency'] = new Map();
  nodes.forEach((n) => adjacency.set(n.id, []));

  for (const link of links) {
    const sId = typeof link.source === 'string' ? link.source : link.source.id;
    const tId = typeof link.target === 'string' ? link.target : link.target.id;
    adjacency.get(sId)?.push({
      neighborId: tId,
      relationType: link.relationType,
      reason: link.reason,
      weight: link.weight,
    });
    adjacency.get(tId)?.push({
      neighborId: sId,
      relationType: link.relationType,
      reason: link.reason,
      weight: link.weight,
    });
  }

  for (const n of nodes) {
    const deg = adjacency.get(n.id)?.length || 0;
    n.degree = deg;
    const baseR = n.isMicroexpression ? 6.2 : !n.isLoveCodex ? 5.2 : 3.9;
    n.radius = Math.min(11.5, baseR + Math.sqrt(deg) * 0.85);
  }

  const topHubs = [...nodes]
    .sort((a, b) => b.degree - a.degree)
    .slice(0, 12);

  return {
    nodes,
    links,
    nodeMap,
    adjacency,
    topHubs,
    categoryCounts,
  };
}

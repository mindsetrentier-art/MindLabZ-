export type BrainGymGameId =
  | 'nback-sequence'
  | 'chrono-span'
  | 'reflex-pulse'
  | 'go-nogo-gate';

export type BrainGymCategory = 'memory' | 'reaction';

export type BrainGymDifficulty = 'standard' | 'intense' | 'master';

export interface BrainGymDifficultyMeta {
  id: BrainGymDifficulty;
  label: string;
  labelEn: string;
  multiplier: number;
  description: string;
}

export const BRAIN_GYM_DIFFICULTIES: BrainGymDifficultyMeta[] = [
  {
    id: 'standard',
    label: '标准基线',
    labelEn: 'Standard',
    multiplier: 1,
    description: '校准日常工作记忆容量与基础神经反应基线',
  },
  {
    id: 'intense',
    label: '进阶高阶',
    labelEn: 'Intense',
    multiplier: 1.35,
    description: '缩短刺激间隔与展示窗，提升认知负荷密度',
  },
  {
    id: 'master',
    label: '宗师极限',
    labelEn: 'Master',
    multiplier: 1.75,
    description: '高阶 3-Back / 逆序矩阵与毫秒级干扰抑制训练',
  },
];

export interface BrainGymGameMeta {
  id: BrainGymGameId;
  titleZh: string;
  titleEn: string;
  category: BrainGymCategory;
  categoryLabelZh: string;
  metricLabel: string;
  durationLabel: string;
  description: string;
  neuroscienceNote: string;
  assessmentDomains: string[];
}

export const BRAIN_GYM_GAMES: BrainGymGameMeta[] = [
  {
    id: 'nback-sequence',
    titleZh: '工作记忆 N-Back 追踪',
    titleEn: 'Spatial N-Back Tracker',
    category: 'memory',
    categoryLabelZh: '工作记忆',
    metricLabel: '命中率 · N-Back 阶数',
    durationLabel: '约 45 秒 · 16 步',
    description:
      '追踪 3×3 空间矩阵中依次闪现的坐标节点，判断当前亮起位置是否与 N 步前完全一致。',
    neuroscienceNote:
      '持续激活前额叶背外侧皮层（dlPFC），训练工作记忆的实时刷新与抗干扰保真度。',
    assessmentDomains: ['空间与工作记忆', '专注力与抗干扰'],
  },
  {
    id: 'chrono-span',
    titleZh: '顺逆序广度矩阵',
    titleEn: 'Chronological Sequence Span',
    category: 'memory',
    categoryLabelZh: '序贯记忆',
    metricLabel: '最大记忆广度 · 准确率',
    durationLabel: '渐进闯关 · 4 至 10 节点',
    description:
      '短时记忆空间网格中按顺序亮起的数字节点，在节点隐藏后按顺向（宗师难度为逆向）精确复现序列。',
    neuroscienceNote:
      '结合 Corsi 空间块任务与逆序工作记忆重组，拓展大脑的组块编码上限。',
    assessmentDomains: ['空间与工作记忆'],
  },
  {
    id: 'reflex-pulse',
    titleZh: '毫秒神经反应冲刺',
    titleEn: 'Psychomotor Reflex Sprint',
    category: 'reaction',
    categoryLabelZh: '纯反应速度',
    metricLabel: '平均延迟 (ms) · 最佳峰值',
    durationLabel: '5 轮精确校准',
    description:
      '在随机等待期内保持静态警觉，信号亮起的瞬间以最快速度点击或按下空格键完成神经触发。',
    neuroscienceNote:
      '测定视觉皮层至初级运动皮层的传导潜伏期与前扣带皮层警觉稳定性。',
    assessmentDomains: ['神经反应速度', '专注力与抗干扰'],
  },
  {
    id: 'go-nogo-gate',
    titleZh: 'Go / No-Go 抑制控制门',
    titleEn: 'Go / No-Go Impulse Gate',
    category: 'reaction',
    categoryLabelZh: '选择反应与抑制',
    metricLabel: '选择反应时 (ms) · 抑制准确率',
    durationLabel: '20 次高频刺激',
    description:
      '面对高频交替出现的执行信号（GO）与诱饵信号（NO-GO），极速响应目标同时强制刹住误触冲动。',
    neuroscienceNote:
      '评估基底核直接/间接通路与右额下回（rIFG）在高速态势下的冲动抑制效率。',
    assessmentDomains: ['神经反应速度', '专注力与抗干扰', '理性决策与去偏见'],
  },
];

export interface BrainGymSessionInput {
  id?: string;
  userId: string;
  gameId: BrainGymGameId;
  gameTitle: string;
  category: BrainGymCategory;
  difficulty: BrainGymDifficulty;
  score: number;
  accuracy: number;
  avgReactionMs: number;
  bestReactionMs: number;
  maxSpan: number;
  roundsCompleted: number;
  xpEarned: number;
}

export interface BrainGymSessionRecord extends Omit<BrainGymSessionInput, 'id'> {
  id: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface BrainGymSummaryStats {
  totalSessions: number;
  memorySessions: number;
  reactionSessions: number;
  bestReflexMs: number | null;
  peakSpan: number;
  averageAccuracy: number;
  highestScoreByGame: Partial<Record<BrainGymGameId, number>>;
}

export interface NBackStep {
  index: number;
  cell: number;
  isMatch: boolean;
}

export interface GoNoGoTrial {
  index: number;
  type: 'go' | 'nogo';
  label: string;
  symbol: 'circle' | 'diamond';
}

const VALID_GAME_IDS: ReadonlySet<BrainGymGameId> = new Set([
  'nback-sequence',
  'chrono-span',
  'reflex-pulse',
  'go-nogo-gate',
]);

const VALID_CATEGORIES: ReadonlySet<BrainGymCategory> = new Set([
  'memory',
  'reaction',
]);

const VALID_DIFFICULTIES: ReadonlySet<BrainGymDifficulty> = new Set([
  'standard',
  'intense',
  'master',
]);

export function isValidBrainGymId(id: unknown): id is string {
  return (
    typeof id === 'string' &&
    id.length >= 1 &&
    id.length <= 128 &&
    /^[a-zA-Z0-9_\-]+$/.test(id)
  );
}

export function generateBrainGymSessionId(): string {
  const randomPart = Math.random().toString(36).slice(2, 10);
  return `bg_${Date.now()}_${randomPart}`;
}

function clampFinite(value: unknown, min: number, max: number, fallback = 0): number {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.max(min, Math.min(max, Math.round(num)));
}

export function sanitizeBrainGymSessionInput(
  input: Partial<BrainGymSessionInput> & { userId?: string }
): Omit<BrainGymSessionRecord, 'createdAt' | 'updatedAt'> {
  const gameId: BrainGymGameId = VALID_GAME_IDS.has(input.gameId as BrainGymGameId)
    ? (input.gameId as BrainGymGameId)
    : 'nback-sequence';
  const meta = BRAIN_GYM_GAMES.find((g) => g.id === gameId) || BRAIN_GYM_GAMES[0];
  const category: BrainGymCategory = VALID_CATEGORIES.has(input.category as BrainGymCategory)
    ? (input.category as BrainGymCategory)
    : meta.category;
  const difficulty: BrainGymDifficulty = VALID_DIFFICULTIES.has(
    input.difficulty as BrainGymDifficulty
  )
    ? (input.difficulty as BrainGymDifficulty)
    : 'standard';

  const safeId = isValidBrainGymId(input.id)
    ? input.id
    : generateBrainGymSessionId();
  const safeUserId = isValidBrainGymId(input.userId)
    ? input.userId
    : 'guest_user';
  const rawTitle =
    typeof input.gameTitle === 'string' && input.gameTitle.trim().length > 0
      ? input.gameTitle.trim()
      : meta.titleZh;

  return {
    id: safeId,
    userId: safeUserId,
    gameId,
    gameTitle: rawTitle.slice(0, 80),
    category,
    difficulty,
    score: clampFinite(input.score, 0, 1_000_000, 0),
    accuracy: clampFinite(input.accuracy, 0, 100, 0),
    avgReactionMs: clampFinite(input.avgReactionMs, 0, 10_000, 0),
    bestReactionMs: clampFinite(input.bestReactionMs, 0, 10_000, 0),
    maxSpan: clampFinite(input.maxSpan, 0, 32, 0),
    roundsCompleted: clampFinite(input.roundsCompleted, 0, 200, 0),
    xpEarned: clampFinite(input.xpEarned, 0, 500, 0),
  };
}

export function getDifficultyMultiplier(difficulty: BrainGymDifficulty): number {
  return (
    BRAIN_GYM_DIFFICULTIES.find((d) => d.id === difficulty)?.multiplier ?? 1
  );
}

export function generateNBackSequence(
  length: number,
  nLevel: number,
  gridCount = 9,
  targetMatchRate = 0.35
): NBackStep[] {
  const safeLength = Math.max(nLevel + 2, Math.min(40, Math.round(length)));
  const safeGrid = Math.max(4, Math.min(25, Math.round(gridCount)));
  const steps: NBackStep[] = [];

  for (let i = 0; i < safeLength; i++) {
    if (i < nLevel) {
      const cell = Math.floor(Math.random() * safeGrid);
      steps.push({ index: i, cell, isMatch: false });
      continue;
    }

    const backCell = steps[i - nLevel].cell;
    // Guarantee at least some matches once eligible steps exist
    const existingMatches = steps.filter((s) => s.isMatch).length;
    const remaining = safeLength - i;
    const shouldForceMatch = existingMatches < 2 && remaining <= 3;
    const wantMatch = shouldForceMatch || Math.random() < targetMatchRate;

    if (wantMatch) {
      steps.push({ index: i, cell: backCell, isMatch: true });
    } else {
      let cell = Math.floor(Math.random() * safeGrid);
      if (cell === backCell) {
        cell = (cell + 1 + Math.floor(Math.random() * (safeGrid - 1))) % safeGrid;
      }
      steps.push({ index: i, cell, isMatch: false });
    }
  }

  return steps;
}

export function generateChronoSpanTargets(
  spanLength: number,
  totalCells: number
): number[] {
  const count = Math.max(1, Math.min(totalCells, Math.round(spanLength)));
  const pool = Array.from({ length: totalCells }, (_, idx) => idx);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = pool[i];
    pool[i] = pool[j];
    pool[j] = tmp;
  }
  return pool.slice(0, count);
}

export function generateGoNoGoTrials(
  totalTrials: number,
  goRatio = 0.65
): GoNoGoTrial[] {
  const count = Math.max(4, Math.min(60, Math.round(totalTrials)));
  const goTarget = Math.max(1, Math.min(count - 1, Math.round(count * goRatio)));
  const types: Array<'go' | 'nogo'> = [
    ...Array(goTarget).fill('go' as const),
    ...Array(count - goTarget).fill('nogo' as const),
  ];

  for (let i = types.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = types[i];
    types[i] = types[j];
    types[j] = tmp;
  }

  return types.map((type, index) => ({
    index,
    type,
    label: type === 'go' ? 'GO · 立即响应' : 'NO-GO · 保持抑制',
    symbol: type === 'go' ? 'circle' : 'diamond',
  }));
}

export function scoreNBackSession(params: {
  hits: number;
  correctRejections: number;
  misses: number;
  falseAlarms: number;
  nLevel: number;
  avgReactionMs: number;
  difficulty: BrainGymDifficulty;
}): { score: number; accuracy: number; xpEarned: number } {
  const evaluated =
    params.hits + params.correctRejections + params.misses + params.falseAlarms;
  const accuracy =
    evaluated > 0
      ? Math.round(((params.hits + params.correctRejections) / evaluated) * 100)
      : 0;
  const mult = getDifficultyMultiplier(params.difficulty);
  const speedBonus =
    params.avgReactionMs > 0
      ? Math.max(0, Math.round((1500 - params.avgReactionMs) * 0.45))
      : 0;
  const raw =
    (params.hits * 420 +
      params.correctRejections * 180 -
      params.falseAlarms * 140 -
      params.misses * 90 +
      params.nLevel * 500 +
      speedBonus) *
    mult;
  const score = Math.max(0, Math.round(raw));
  const xpEarned = Math.min(80, Math.max(18, Math.round(20 + accuracy * 0.38)));
  return { score, accuracy, xpEarned };
}

export function scoreChronoSpanSession(params: {
  maxSpan: number;
  roundsCleared: number;
  totalAttempts: number;
  avgReactionMs: number;
  difficulty: BrainGymDifficulty;
}): { score: number; accuracy: number; xpEarned: number } {
  const accuracy =
    params.totalAttempts > 0
      ? Math.min(
          100,
          Math.round((params.roundsCleared / params.totalAttempts) * 100)
        )
      : 0;
  const mult = getDifficultyMultiplier(params.difficulty);
  const score = Math.max(
    0,
    Math.round(
      (params.roundsCleared * 650 + params.maxSpan * 480 + accuracy * 18) * mult
    )
  );
  const xpEarned = Math.min(
    85,
    Math.max(20, Math.round(22 + params.roundsCleared * 6 + params.maxSpan * 2))
  );
  return { score, accuracy, xpEarned };
}

export function scoreReflexPulseSession(params: {
  latenciesMs: number[];
  falseStarts: number;
  difficulty: BrainGymDifficulty;
}): {
  score: number;
  accuracy: number;
  avgReactionMs: number;
  bestReactionMs: number;
  xpEarned: number;
} {
  const valid = params.latenciesMs.filter((ms) => Number.isFinite(ms) && ms > 0);
  if (valid.length === 0) {
    return {
      score: 0,
      accuracy: 0,
      avgReactionMs: 0,
      bestReactionMs: 0,
      xpEarned: 15,
    };
  }
  const sum = valid.reduce((a, b) => a + b, 0);
  const avgReactionMs = Math.round(sum / valid.length);
  const bestReactionMs = Math.round(Math.min(...valid));
  const totalPresses = valid.length + Math.max(0, params.falseStarts);
  const accuracy = Math.max(
    0,
    Math.min(100, Math.round((valid.length / totalPresses) * 100))
  );
  const mult = getDifficultyMultiplier(params.difficulty);
  // 160ms => ~8200 base pts, 250ms => ~5500, 400ms => ~2200
  const latencyComponent = Math.max(400, (650 - Math.min(600, avgReactionMs)) * 18);
  const consistencyPenalty = Math.max(0, params.falseStarts * 350);
  const score = Math.max(250, Math.round((latencyComponent - consistencyPenalty) * mult));
  const xpEarned = Math.min(
    75,
    Math.max(20, Math.round(22 + Math.max(0, 450 - avgReactionMs) * 0.12))
  );
  return { score, accuracy, avgReactionMs, bestReactionMs, xpEarned };
}

export function scoreGoNoGoSession(params: {
  goLatenciesMs: number[];
  goHits: number;
  totalGo: number;
  correctWithholds: number;
  totalNoGo: number;
  difficulty: BrainGymDifficulty;
}): {
  score: number;
  accuracy: number;
  avgReactionMs: number;
  bestReactionMs: number;
  xpEarned: number;
} {
  const totalTrials = params.totalGo + params.totalNoGo;
  const totalCorrect = params.goHits + params.correctWithholds;
  const accuracy =
    totalTrials > 0 ? Math.round((totalCorrect / totalTrials) * 100) : 0;

  const valid = params.goLatenciesMs.filter((ms) => Number.isFinite(ms) && ms > 0);
  const avgReactionMs =
    valid.length > 0
      ? Math.round(valid.reduce((a, b) => a + b, 0) / valid.length)
      : 0;
  const bestReactionMs =
    valid.length > 0 ? Math.round(Math.min(...valid)) : 0;

  const commissionErrors = Math.max(0, params.totalNoGo - params.correctWithholds);
  const speedBonus =
    avgReactionMs > 0 ? Math.max(0, (850 - Math.min(850, avgReactionMs)) * 5) : 0;
  const mult = getDifficultyMultiplier(params.difficulty);
  const score = Math.max(
    0,
    Math.round(
      (params.goHits * 280 +
        params.correctWithholds * 340 -
        commissionErrors * 220 +
        speedBonus) *
        mult
    )
  );
  const xpEarned = Math.min(80, Math.max(20, Math.round(20 + accuracy * 0.4)));
  return { score, accuracy, avgReactionMs, bestReactionMs, xpEarned };
}

export function computeBrainGymSummary(
  sessions: BrainGymSessionRecord[]
): BrainGymSummaryStats {
  if (!Array.isArray(sessions) || sessions.length === 0) {
    return {
      totalSessions: 0,
      memorySessions: 0,
      reactionSessions: 0,
      bestReflexMs: null,
      peakSpan: 0,
      averageAccuracy: 0,
      highestScoreByGame: {},
    };
  }

  let memorySessions = 0;
  let reactionSessions = 0;
  let bestReflexMs: number | null = null;
  let peakSpan = 0;
  let accuracySum = 0;
  const highestScoreByGame: Partial<Record<BrainGymGameId, number>> = {};

  for (const s of sessions) {
    if (s.category === 'memory') memorySessions += 1;
    if (s.category === 'reaction') reactionSessions += 1;
    accuracySum += Number(s.accuracy) || 0;

    if (s.bestReactionMs > 0) {
      bestReflexMs =
        bestReflexMs === null
          ? s.bestReactionMs
          : Math.min(bestReflexMs, s.bestReactionMs);
    }

    if (s.maxSpan > peakSpan) {
      peakSpan = s.maxSpan;
    }

    const prevBest = highestScoreByGame[s.gameId] ?? 0;
    if (s.score > prevBest) {
      highestScoreByGame[s.gameId] = s.score;
    }
  }

  return {
    totalSessions: sessions.length,
    memorySessions,
    reactionSessions,
    bestReflexMs,
    peakSpan,
    averageAccuracy: Math.round(accuracySum / sessions.length),
    highestScoreByGame,
  };
}

export function getReflexEvaluationBand(avgMs: number): {
  label: string;
  note: string;
} {
  if (avgMs <= 0) {
    return { label: '尚未校准', note: '完成一轮测试以采集神经响应基线。' };
  }
  if (avgMs < 200) {
    return {
      label: '竞技级神经传导',
      note: '动作电位与视动通路协调处于顶尖区间。',
    };
  }
  if (avgMs < 260) {
    return {
      label: '敏捷稳定状态',
      note: '前额叶警觉度良好，适合高专注思维推演。',
    };
  }
  if (avgMs < 340) {
    return {
      label: '日常稳健区间',
      note: '反应节奏平稳，持续练习可进一步缩短延迟。',
    };
  }
  return {
    label: '热身恢复期',
    note: '建议配合专注呼吸或再练一轮以唤醒警觉网络。',
  };
}

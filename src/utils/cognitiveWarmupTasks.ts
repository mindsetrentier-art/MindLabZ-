import { PSYCHOLOGY_GAMES } from '../data/games';
import { PsychologyLaw, UserProfile } from '../types';
import { cryptoRandom, cryptoShuffle } from './aleatoricEngine';

export type WarmupDomain = 'pattern-matrix' | 'number-sequence' | 'symbolic-cipher' | 'deductive-logic';

export type PracticeDomainFocus =
  | 'cognitive-bias'
  | 'decision-science'
  | 'memory-pattern'
  | 'social-emotion';

export interface PracticeDomainMeta {
  id: PracticeDomainFocus;
  labelZh: string;
  shortLabelZh: string;
  labelEn: string;
  description: string;
}

export const PRACTICE_DOMAIN_META: Record<PracticeDomainFocus, PracticeDomainMeta> = {
  'cognitive-bias': {
    id: 'cognitive-bias',
    labelZh: '心理偏差',
    shortLabelZh: '心理偏差',
    labelEn: 'Cognitive Bias',
    description: '聚焦确认偏误、合取谬误、系统1干扰与可证伪校验',
  },
  'decision-science': {
    id: 'decision-science',
    labelZh: '决策科学',
    shortLabelZh: '决策科学',
    labelEn: 'Decision Science',
    description: '聚焦期望值心算、基准率判断、去锚定与沉没成本剥离',
  },
  'memory-pattern': {
    id: 'memory-pattern',
    labelZh: '记忆与模式',
    shortLabelZh: '模式记忆',
    labelEn: 'Memory & Pattern',
    description: '聚焦工作记忆规律提取、图形矩阵推演与符号编码映射',
  },
  'social-emotion': {
    id: 'social-emotion',
    labelZh: '社会与情绪',
    shortLabelZh: '情绪社会',
    labelEn: 'Social & Emotion',
    description: '聚焦心理抗拒边界、归因换位、微表情线索与群体破局',
  },
};

export interface UserPracticeProfile {
  primaryFocus: PracticeDomainFocus;
  secondaryFocus: PracticeDomainFocus;
  scores: Record<PracticeDomainFocus, number>;
  matchedLabelZh: string;
  reasonText: string;
  anchorLawTitle?: string;
  hasHistory: boolean;
}

export interface PatternTileSpec {
  shape: 'circle' | 'square' | 'triangle' | 'diamond';
  fill: 'outline' | 'solid' | 'double';
  rotation: 0 | 90 | 180 | 270;
  dotPos: 'top' | 'right' | 'bottom' | 'left';
}

export interface WarmupTask {
  id: string;
  domain: WarmupDomain;
  domainLabelZh: string;
  focusDomain: PracticeDomainFocus;
  focusLabelZh: string;
  knowledgePoint: string;
  prompt: string;
  subPrompt?: string;
  sequenceTiles?: PatternTileSpec[];
  options: Array<{
    label: string;
    tile?: PatternTileSpec;
  }>;
  correctIndex: number;
  explanation: string;
}

const RECENT_TASKS_KEY = 'mindlabz_warmup_recent_v1';

function readRecentTaskIds(): string[] {
  try {
    if (typeof window === 'undefined') return [];
    const raw = window.localStorage.getItem(RECENT_TASKS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

function recordRecentTaskId(id: string): void {
  try {
    if (typeof window === 'undefined') return;
    const prev = readRecentTaskIds().filter((item) => item !== id);
    const next = [...prev, id].slice(-16);
    window.localStorage.setItem(RECENT_TASKS_KEY, JSON.stringify(next));
  } catch {
    // ignore storage errors
  }
}

function randInt(min: number, max: number): number {
  return min + Math.floor(cryptoRandom() * (max - min + 1));
}

function pickOne<T>(arr: readonly T[]): T {
  return arr[Math.floor(cryptoRandom() * arr.length)];
}

function serializeTile(tile: PatternTileSpec): string {
  return `${tile.shape}:${tile.fill}:${tile.rotation}:${tile.dotPos}`;
}

function mapLawToFocusDomain(law: PsychologyLaw): PracticeDomainFocus {
  if (law.category === 'decision') return 'decision-science';
  if (law.category === 'memory') return 'memory-pattern';
  if (law.category === 'social' || law.category === 'emotion' || law.isLoveCodex || law.isMicroexpression) {
    return 'social-emotion';
  }
  return 'cognitive-bias';
}

function mapGameToFocusDomain(gameId: string, gameCategory: string): PracticeDomainFocus {
  if (
    gameId === 'anchoring-lab' ||
    gameId === 'zero-price-trap' ||
    gameId === 'psych-experiment' ||
    gameCategory === '决策' ||
    gameCategory === '心理实验'
  ) {
    return 'decision-science';
  }
  if (
    gameId === 'memory-lab' ||
    gameId === 'peak-end' ||
    gameId === 'brain-rush' ||
    gameCategory === '记忆' ||
    gameCategory === '注意力'
  ) {
    return 'memory-pattern';
  }
  if (
    gameId === 'majority-answer' ||
    gameId === 'emotion-detective' ||
    gameId === 'attribution-shift' ||
    gameId === 'bystander-breaker' ||
    gameId === 'love-aleatoric-arena' ||
    gameCategory === '社会' ||
    gameCategory === '情绪'
  ) {
    return 'social-emotion';
  }
  return 'cognitive-bias';
}

/**
 * Infers the user's primary & secondary cognitive training domains from historical
 * law mastery, game completions, bookmarks, and onboarding goals.
 */
export function inferUserPracticeProfile(
  user: UserProfile,
  laws: PsychologyLaw[]
): UserPracticeProfile {
  const scores: Record<PracticeDomainFocus, number> = {
    'cognitive-bias': 0,
    'decision-science': 0,
    'memory-pattern': 0,
    'social-emotion': 0,
  };
  const anchorCandidates: Record<PracticeDomainFocus, string[]> = {
    'cognitive-bias': [],
    'decision-science': [],
    'memory-pattern': [],
    'social-emotion': [],
  };
  const practiceCounts: Record<PracticeDomainFocus, number> = {
    'cognitive-bias': 0,
    'decision-science': 0,
    'memory-pattern': 0,
    'social-emotion': 0,
  };

  const lawMap = new Map<string, PsychologyLaw>();
  for (const law of laws) {
    lawMap.set(law.id, law);
  }

  let hasConcretePractice = false;

  // 1. Law mastery history
  for (const [lawId, mastery] of Object.entries(user.lawMasteryMap || {})) {
    if (!mastery || mastery <= 0) continue;
    const law = lawMap.get(lawId);
    if (!law) continue;
    const domain = mapLawToFocusDomain(law);
    scores[domain] += 2 + Math.min(4, mastery / 25);
    practiceCounts[domain] += 1;
    anchorCandidates[domain].push(law.nameZh);
    hasConcretePractice = true;
  }

  for (const lawId of user.lawsMastered || []) {
    const law = lawMap.get(lawId);
    if (!law) continue;
    const domain = mapLawToFocusDomain(law);
    scores[domain] += 2.5;
    if (!anchorCandidates[domain].includes(law.nameZh)) {
      anchorCandidates[domain].push(law.nameZh);
      practiceCounts[domain] += 1;
    }
    hasConcretePractice = true;
  }

  // 2. Bookmarked laws indicate active study interest
  for (const lawId of user.bookmarks || []) {
    const law = lawMap.get(lawId);
    if (!law) continue;
    const domain = mapLawToFocusDomain(law);
    scores[domain] += 1.5;
    if (!anchorCandidates[domain].includes(law.nameZh)) {
      anchorCandidates[domain].push(law.nameZh);
    }
    hasConcretePractice = true;
  }

  // 3. Game completion & high-score history
  const gameCounts = user.gameCompletionCount || {};
  const gameScores = user.gameHighScores || {};
  for (const game of PSYCHOLOGY_GAMES) {
    const count = gameCounts[game.id] || 0;
    const high = gameScores[game.id] || 0;
    if (count <= 0 && high <= 0) continue;
    const domain = mapGameToFocusDomain(game.id, game.category);
    scores[domain] += Math.max(1, count) * 2.2 + (high > 0 ? 1 : 0);
    practiceCounts[domain] += Math.max(1, count);
    hasConcretePractice = true;
  }

  // 4. Selected goals baseline (if sparse history or reinforcing direction)
  for (const goal of user.selectedGoals || []) {
    if (goal === 'decision') scores['decision-science'] += 1.8;
    else if (goal === 'memory' || goal === 'speed') scores['memory-pattern'] += 1.8;
    else if (goal === 'attention' || goal === 'psychology') scores['cognitive-bias'] += 1.5;
  }

  // 5. Tie-break / cold-start using user cognitive stats
  const statTieBreaker: Record<PracticeDomainFocus, number> = {
    'cognitive-bias': (user.stats?.reasoning || 50) * 0.01,
    'decision-science': (user.stats?.decision || 50) * 0.01,
    'memory-pattern': ((user.stats?.memory || 50) + (user.stats?.attention || 50)) * 0.005,
    'social-emotion': (user.stats?.knowledge || 50) * 0.01,
  };

  const ranked = (Object.keys(scores) as PracticeDomainFocus[]).sort((a, b) => {
    const diff = scores[b] + statTieBreaker[b] - (scores[a] + statTieBreaker[a]);
    return diff;
  });

  const primaryFocus = ranked[0];
  const secondaryFocus = ranked[1];
  const meta = PRACTICE_DOMAIN_META[primaryFocus];
  const anchorLawTitle = anchorCandidates[primaryFocus][0];
  const domainPracticeTotal = practiceCounts[primaryFocus];

  let reasonText: string;
  if (hasConcretePractice && domainPracticeTotal > 0 && anchorLawTitle) {
    reasonText = `基于你在「${meta.labelZh}」领域的 ${domainPracticeTotal} 项练习记录（关联「${anchorLawTitle}」）动态匹配`;
  } else if (hasConcretePractice && domainPracticeTotal > 0) {
    reasonText = `基于你近期在「${meta.labelZh}」竞技与练习的 ${domainPracticeTotal} 条活跃轨迹定制`;
  } else if ((user.selectedGoals || []).length > 0) {
    reasonText = `结合你设定的「${meta.labelZh}」成长目标优先校准`;
  } else {
    reasonText = `围绕「${meta.labelZh}」核心脑力通路开启今日校准`;
  }

  return {
    primaryFocus,
    secondaryFocus,
    scores,
    matchedLabelZh: meta.labelZh,
    reasonText,
    anchorLawTitle,
    hasHistory: hasConcretePractice,
  };
}

function generatePatternMatrixTask(focusDomain: PracticeDomainFocus = 'memory-pattern'): WarmupTask {
  const shapes: PatternTileSpec['shape'][] = ['circle', 'square', 'triangle', 'diamond'];
  const fills: PatternTileSpec['fill'][] = ['outline', 'solid', 'double'];
  const dots: PatternTileSpec['dotPos'][] = ['top', 'right', 'bottom', 'left'];
  const rotations: PatternTileSpec['rotation'][] = [0, 90, 180, 270];

  const startShapeIdx = randInt(0, shapes.length - 1);
  const shapeStep = cryptoRandom() < 0.65 ? 1 : 2;
  const startFillIdx = randInt(0, fills.length - 1);
  const fillStep = cryptoRandom() < 0.7 ? 1 : 0;
  const startDotIdx = randInt(0, dots.length - 1);
  const dotStep = cryptoRandom() < 0.5 ? 1 : 3;
  const startRotIdx = randInt(0, rotations.length - 1);
  const rotStep = shapeStep === 1 ? 1 : 0;

  const makeTile = (step: number): PatternTileSpec => ({
    shape: shapes[(startShapeIdx + step * shapeStep) % shapes.length],
    fill: fills[(startFillIdx + step * fillStep) % fills.length],
    rotation: rotations[(startRotIdx + step * rotStep) % rotations.length],
    dotPos: dots[(startDotIdx + step * dotStep) % dots.length],
  });

  const seq = [makeTile(0), makeTile(1), makeTile(2)];
  const answer = makeTile(3);

  const usedSignatures = new Set<string>([serializeTile(answer)]);
  const distractors: PatternTileSpec[] = [];

  let guard = 0;
  while (distractors.length < 3 && guard < 40) {
    guard += 1;
    const candidate: PatternTileSpec = {
      shape: guard % 3 === 0 ? pickOne(shapes) : answer.shape,
      fill:
        guard % 2 === 0
          ? fills[(fills.indexOf(answer.fill) + randInt(1, 2)) % fills.length]
          : answer.fill,
      rotation: answer.rotation,
      dotPos: dots[(dots.indexOf(answer.dotPos) + randInt(1, 3)) % dots.length],
    };
    const sig = serializeTile(candidate);
    if (!usedSignatures.has(sig)) {
      usedSignatures.add(sig);
      distractors.push(candidate);
    }
  }

  const tagged = cryptoShuffle([
    { label: '模式匹配', tile: answer, isCorrect: true },
    ...distractors.map((tile) => ({ label: '干扰图形', tile, isCorrect: false })),
  ]);

  const shapeDesc = shapeStep === 1 ? '几何轮廓按圆→方→三角→菱形依次递进' : '几何轮廓每隔一项交替切换';
  const dotDesc = dotStep === 1 ? '标记点顺时针旋转 90°' : '标记点逆时针旋转 90°';
  const fillDesc = fillStep === 1 ? '，同时填充样式在空心、实心与双线框间循环' : '';

  return {
    id: `pattern-${serializeTile(answer)}`,
    domain: 'pattern-matrix',
    domainLabelZh: '视觉模式推演',
    focusDomain,
    focusLabelZh: PRACTICE_DOMAIN_META[focusDomain].labelZh,
    knowledgePoint: focusDomain === 'memory-pattern' ? '工作记忆视觉规则提取' : '非言语线索一致性识别',
    prompt: '观察前三个图形的演变规则，选出第 4 格应出现的图形：',
    sequenceTiles: seq,
    options: tagged.map(({ label, tile }) => ({ label, tile })),
    correctIndex: tagged.findIndex((item) => item.isCorrect),
    explanation: `规律解析：${shapeDesc}，且${dotDesc}${fillDesc}。`,
  };
}

function generateNumberSequenceTask(focusDomain: PracticeDomainFocus = 'memory-pattern'): WarmupTask {
  const variant = randInt(0, 3);
  let seq: number[] = [];
  let answer = 0;
  let explanation = '';

  if (variant === 0) {
    const start = randInt(2, 9);
    const firstDiff = randInt(2, 5);
    const stepDelta = randInt(2, 4);
    seq = [start];
    let curr = start;
    let diff = firstDiff;
    for (let i = 0; i < 4; i++) {
      curr += diff;
      if (i < 3) seq.push(curr);
      else answer = curr;
      diff += stepDelta;
    }
    explanation = `相邻差值依次递增 ${stepDelta}（+${firstDiff}, +${firstDiff + stepDelta}, +${firstDiff + 2 * stepDelta}, +${firstDiff + 3 * stepDelta}），因此下一项为 ${answer}。`;
  } else if (variant === 1) {
    const start = randInt(2, 5);
    const offset = pickOne([1, 2, 3, -1]);
    seq = [start];
    let curr = start;
    for (let i = 0; i < 4; i++) {
      curr = curr * 2 + offset;
      if (i < 3) seq.push(curr);
      else answer = curr;
    }
    const opStr = offset >= 0 ? `+ ${offset}` : `- ${Math.abs(offset)}`;
    explanation = `递推公式为「前一项 × 2 ${opStr}」，所以 ${seq[3]} × 2 ${opStr} = ${answer}。`;
  } else if (variant === 2) {
    const a = randInt(2, 6);
    const b = randInt(4, 9);
    const c = a + b;
    const d = b + c;
    answer = c + d;
    seq = [a, b, c, d];
    explanation = `从第 3 项起每一项等于前两项之和（${a}+${b}=${c}，${b}+${c}=${d}），故 ${c} + ${d} = ${answer}。`;
  } else {
    const base = randInt(2, 4);
    const k = randInt(1, 5);
    seq = [0, 1, 2, 3].map((i) => (base + i) * (base + i) + k);
    answer = (base + 4) * (base + 4) + k;
    explanation = `通项为 (${base}+n)² + ${k}，第 5 项为 ${base + 4}² + ${k} = ${answer}。`;
  }

  const used = new Set<number>([answer]);
  const distractorNums: number[] = [];
  const deltas = cryptoShuffle([-6, -4, -3, -2, -1, 1, 2, 3, 4, 6, 8]);
  for (const d of deltas) {
    if (distractorNums.length >= 3) break;
    const cand = answer + d;
    if (cand > 0 && !used.has(cand)) {
      used.add(cand);
      distractorNums.push(cand);
    }
  }

  const tagged = cryptoShuffle([
    { label: String(answer), isCorrect: true },
    ...distractorNums.map((n) => ({ label: String(n), isCorrect: false })),
  ]);

  return {
    id: `num-${seq.join('-')}`,
    domain: 'number-sequence',
    domainLabelZh: '数序逻辑推演',
    focusDomain,
    focusLabelZh: PRACTICE_DOMAIN_META[focusDomain].labelZh,
    knowledgePoint: focusDomain === 'decision-science' ? '数值规律与增量预测' : '序列工作记忆编码',
    prompt: '找出下列数字序列的生成规律，填入问号处的正确数字：',
    subPrompt: `${seq.join('  ·  ')}  ·  ?`,
    options: tagged.map((item) => ({ label: item.label })),
    correctIndex: tagged.findIndex((item) => item.isCorrect),
    explanation,
  };
}

function generateSymbolicCipherTask(focusDomain: PracticeDomainFocus = 'memory-pattern'): WarmupTask {
  const words = [
    'MIND',
    'FLOW',
    'CALM',
    'BIAS',
    'LOGIC',
    'FOCUS',
    'BRAIN',
    'TRUTH',
    'SPARK',
    'DEPTH',
  ] as const;
  const shift = pickOne([1, 2, -1]);
  const [sampleWord, targetWord] = cryptoShuffle(words).slice(0, 2);

  const shiftWord = (word: string, delta: number) =>
    word
      .split('')
      .map((ch) => {
        const code = ch.charCodeAt(0) - 65;
        const shifted = (code + delta + 26) % 26;
        return String.fromCharCode(65 + shifted);
      })
      .join('');

  const encodedSample = shiftWord(sampleWord, shift);
  const answer = shiftWord(targetWord, shift);

  const used = new Set<string>([answer]);
  const distractors: string[] = [];
  const altShifts = cryptoShuffle([shift + 1, shift - 1, -shift, shift + 2]);

  for (const s of altShifts) {
    if (distractors.length >= 3) break;
    const cand = shiftWord(targetWord, s);
    if (!used.has(cand)) {
      used.add(cand);
      distractors.push(cand);
    }
  }
  while (distractors.length < 3) {
    const tweaked =
      answer.slice(0, -1) +
      String.fromCharCode(65 + ((answer.charCodeAt(answer.length - 1) - 65 + distractors.length + 1) % 26));
    if (!used.has(tweaked)) {
      used.add(tweaked);
      distractors.push(tweaked);
    }
  }

  const tagged = cryptoShuffle([
    { label: answer, isCorrect: true },
    ...distractors.map((label) => ({ label, isCorrect: false })),
  ]);

  const directionDesc = shift > 0 ? `字母表向后平移 ${shift} 位` : `字母表向前平移 ${Math.abs(shift)} 位`;

  return {
    id: `cipher-${sampleWord}-${targetWord}-${shift}`,
    domain: 'symbolic-cipher',
    domainLabelZh: '符号编码映射',
    focusDomain,
    focusLabelZh: PRACTICE_DOMAIN_META[focusDomain].labelZh,
    knowledgePoint: focusDomain === 'cognitive-bias' ? '抑制直觉猜词 · 规则映射校验' : '符号工作记忆转换',
    prompt: `若采用相同字母映射规则，「${sampleWord}」对应「${encodedSample}」，则「${targetWord}」应映射为：`,
    subPrompt: `${sampleWord}  →  ${encodedSample}    |    ${targetWord}  →  ?`,
    options: tagged.map((item) => ({ label: item.label })),
    correctIndex: tagged.findIndex((item) => item.isCorrect),
    explanation: `编码规则为每个字母按${directionDesc}，逐字母替换即可得到 ${answer}。`,
  };
}

/**
 * Procedural quantitative decision-science tasks (expected value &去锚定).
 */
function generateProceduralDecisionTask(): WarmupTask {
  const mode = randInt(0, 1);

  if (mode === 0) {
    // Expected Value comparison against loss-aversion certainty bias
    const baseReward = pickOne([120, 160, 200, 240]);
    const loseAmount = Math.round(baseReward * 0.5);
    const ev = Math.round(0.5 * baseReward - 0.5 * loseAmount);
    const certainBonus = pickOne([10, 15, 20]);

    const tagged = cryptoShuffle([
      {
        label: `选择方案 A（期望净收益 +${ev} 元，高于固定收益 +${certainBonus} 元）`,
        isCorrect: true,
      },
      {
        label: `选择方案 B（虽然期望更低，但绝对安全等于收益最大）`,
        isCorrect: false,
      },
      {
        label: `两方案的长期数学期望完全相等`,
        isCorrect: false,
      },
      {
        label: `方案 A 一旦亏损便得不偿失，长期期望必为负数`,
        isCorrect: false,
      },
    ]);

    return {
      id: `decision-ev-${baseReward}-${certainBonus}`,
      domain: 'deductive-logic',
      domainLabelZh: '决策期待值心算',
      focusDomain: 'decision-science',
      focusLabelZh: PRACTICE_DOMAIN_META['decision-science'].labelZh,
      knowledgePoint: '前景理论与期望值理性校准',
      prompt: `在可重复 50 次的独立决策中：方案 A 有 50% 概率赢 ${baseReward} 元、50% 概率亏 ${loseAmount} 元；方案 B 确定获得 ${certainBonus} 元。从长期期望收益角度应选：`,
      subPrompt: `方案 A: 50% (+${baseReward}) / 50% (-${loseAmount})  |  方案 B: 100% (+${certainBonus})`,
      options: tagged.map((item) => ({ label: item.label })),
      correctIndex: tagged.findIndex((item) => item.isCorrect),
      explanation: `方案 A 数学期望 E = 0.5×${baseReward} - 0.5×${loseAmount} = +${ev} 元，显著高于方案 B 的 +${certainBonus} 元；抗拒“确定性偏误与损失厌恶”需依据长期期望权衡。`,
    };
  }

  // Procedural Anchoring / Discount Trap check
  const trueValue = pickOne([300, 400, 500]);
  const inflatedAnchor = trueValue * 4;
  const salePrice = Math.round(trueValue * 1.35);

  const tagged = cryptoShuffle([
    {
      label: `仍高出真实价值 ${salePrice - trueValue} 元，高标价只是心理锚点`,
      isCorrect: true,
    },
    {
      label: `相当于净赚了 ${inflatedAnchor - salePrice} 元折扣差价`,
      isCorrect: false,
    },
    {
      label: `折扣力度越大，代表商品内在客观价值越高`,
      isCorrect: false,
    },
    {
      label: `只要低于原价一半，就必然符合理性划算决策`,
      isCorrect: false,
    },
  ]);

  return {
    id: `decision-anchor-${trueValue}-${salePrice}`,
    domain: 'deductive-logic',
    domainLabelZh: '去锚定估值校验',
    focusDomain: 'decision-science',
    focusLabelZh: PRACTICE_DOMAIN_META['decision-science'].labelZh,
    knowledgePoint: '锚定效应防御与独立基准估值',
    prompt: `某商品客观实用价值约为 ${trueValue} 元，商家先标出“原价 ${inflatedAnchor} 元”，再打出“限时特惠 ${salePrice} 元”。理性估值结论是：`,
    subPrompt: `标称原价 ¥${inflatedAnchor} → 特惠价 ¥${salePrice}（客观参考价值 ¥${trueValue}）`,
    options: tagged.map((item) => ({ label: item.label })),
    correctIndex: tagged.findIndex((item) => item.isCorrect),
    explanation: `去锚定原则：忽略人为抬高的初始标价 ¥${inflatedAnchor}，直接对比现价 ¥${salePrice} 与真实价值 ¥${trueValue}，实际溢价 ${salePrice - trueValue} 元。`,
  };
}

interface CuratedLogicPuzzle {
  id: string;
  focusDomain: PracticeDomainFocus;
  knowledgePoint: string;
  prompt: string;
  subPrompt?: string;
  correctOption: string;
  distractors: [string, string, string];
  explanation: string;
}

const CURATED_DOMAIN_PUZZLES: CuratedLogicPuzzle[] = [
  // Cognitive Bias Focus
  {
    id: 'bias-wason-card',
    focusDomain: 'cognitive-bias',
    knowledgePoint: '确认偏误与可证伪思维',
    prompt: '桌上有四张卡片，一面是字母，一面是数字，现朝上分别为「E」「K」「4」「7」。为验证规则“若一面是元音字母，则另一面必为偶数”，最少需翻看哪两张？',
    subPrompt: '规则：元音字母 ⇒ 偶数',
    correctOption: '翻看「E」与「7」',
    distractors: ['翻看「E」与「4」', '翻看「K」与「7」', '只需翻看「E」'],
    explanation: '沃森选择任务（Wason Selection Task）：只需检验可能证伪规则的情形——“元音是否配了奇数（翻 E）”以及“奇数背后是否藏了元音（翻 7）”。',
  },
  {
    id: 'bias-conjunction',
    focusDomain: 'cognitive-bias',
    knowledgePoint: '合取谬误与代表性启发',
    prompt: '林女士性格内向、严谨细致，大学主修哲学并常关注社会公平议题。以下哪种判断违背概率公理（即陷入合取谬误）？',
    correctOption: '认为“林女士是银行出纳且积极参与公益社团”比“她是银行出纳”概率更高',
    distractors: [
      '认为“林女士是银行出纳”的概率大于或等于“她是银行出纳且喜爱阅读”',
      '要求先了解当地职业人口基准率再做主观推断',
      '两个联合事件同时发生的概率上限不会超过单个事件',
    ],
    explanation: '合取谬误（Conjunction Fallacy）：P(A 且 B) 永远不可能大于 P(A)，生动的刻板描写容易诱发系统1直觉错觉。',
  },
  {
    id: 'bias-contrapositive',
    focusDomain: 'cognitive-bias',
    knowledgePoint: '必要条件与逆否逻辑校准',
    prompt: '已知命题「只有主动寻找反例，才能突破确认偏误」为真，下列哪项必定成立？',
    correctOption: '如果未能主动寻找反例，就无法突破确认偏误',
    distractors: [
      '只要寻找过一次反例，就一定能完全消除偏误',
      '没有突破偏误，说明完全没有思考过任何信息',
      '所有直观判断都不受确认偏误影响',
    ],
    explanation: '「只有 P 才 Q」等价于「若非 P 则非 Q」。主动寻找反例（证伪）是突破确认偏误的必要条件。',
  },
  {
    id: 'bias-dunning-kruger',
    focusDomain: 'cognitive-bias',
    knowledgePoint: '达克效应与元认知校准',
    prompt: '新手在刚掌握某领域 10% 概念时往往比从业三年的专业者更自信，核心认知原因是什么？',
    correctOption: '缺乏评估自身盲区所需的元认知能力，误将局部规则当成全貌',
    distractors: [
      '新手的大脑记忆容量在早期阶段客观上高于资深专家',
      '资深从业者随经验积累反而遗忘了所有基础事实',
      '自信程度始终与真实专业能力呈严格线性正相关',
    ],
    explanation: '达克效应（Dunning-Kruger Effect）：能力不足者既缺少技能本身，也缺少识别自身不足的元认知尺度。',
  },

  // Decision Science Focus
  {
    id: 'decision-base-rate',
    focusDomain: 'decision-science',
    knowledgePoint: '贝叶斯基准率忽视防范',
    prompt: '某检测对真实说谎者的检出率是 90%，对诚实者的误报率是 10%。若人群中仅 5% 的人说谎，一名被检测为阳性的人真正说谎的概率接近：',
    correctOption: '约 32%（远低于 50%）',
    distractors: ['恰好 90%', '约 80% 左右', '约 50%'],
    explanation: '贝叶斯基准率效应：1000 人中 50 名说谎者检出 45 人，950 名诚实者误报 95 人，45/(45+95) ≈ 32.1%。',
  },
  {
    id: 'decision-sunk-cost',
    focusDomain: 'decision-science',
    knowledgePoint: '沉没成本谬误剥离',
    prompt: '你花 120 元买了两小时后开场的电影票，结果突发暴雨且片评极差，前往观影反而让你情绪更糟。理性决策应依据什么？',
    correctOption: '比较“去”与“不去”的未来边际体验，忽略已付的 120 元',
    distractors: [
      '既然已花 120 元，冒雨看完才能摊平心理损失',
      '只有当电影票超过 200 元时才值得坚持前往',
      '以已投入成本作为继续追加时间投入的依据',
    ],
    explanation: '沉没成本谬误识别：已经发生且不可回收的支出不应影响对未来净收益的理性权衡。',
  },
  {
    id: 'decision-framing',
    focusDomain: 'decision-science',
    knowledgePoint: '框架效应等价识别',
    prompt: '面对同一场手术：描述甲为“术后一个月存活率 90%”；描述乙为“术后一个月死亡率 10%”。决策者该如何应对两种描述引发的不同直觉？',
    correctOption: '识别二者在概率信息上完全等价，统一转为客观净概率对比',
    distractors: [
      '优先采纳正面百分比更高的描述甲作为安全依据',
      '因为提到“死亡率”，描述乙在医学统计上风险更大',
      '忽略概率数字本身，直接按语言措辞舒适度做决策',
    ],
    explanation: '框架效应（Framing Effect）：损失框架比收益框架更能激活杏仁核恐惧，理性决策需先做等价信息转译。',
  },

  // Social & Emotion Focus
  {
    id: 'social-reactance',
    focusDomain: 'social-emotion',
    knowledgePoint: '心理抗拒与自主支持沟通',
    prompt: '在逆向心理学与心理抗拒理论（Reactance Theory）中，为什么“命令式禁止”反而常常增强对方的尝试欲望？',
    correctOption: '强硬剥夺选择权触发自由威胁警报，诱发个体通过逆反恢复自主感',
    distractors: [
      '人类大脑天生只能听懂否定句式而无法理解肯定建议',
      '任何建议只要重复三遍以上就必然转化为强制性指令',
      '顺从他人指令不会消耗任何自我控制能量',
    ],
    explanation: '布雷姆心理抗拒理论：当行为自由感知受威胁时，被限制的选项主观吸引力上升（禁果效应）；提供自主选项反而降低抗拒。',
  },
  {
    id: 'social-attribution',
    focusDomain: 'social-emotion',
    knowledgePoint: '基本归因错误纠偏',
    prompt: '同事今天开会罕见迟到 10 分钟，若旁观者立刻认定“他这个人极其懒散不负责”，而同事自己解释“遇到地铁突发故障”，这种差异体现了：',
    correctOption: '行动者-观察者偏差与基本归因错误（高估性格，低估情境）',
    distractors: [
      '权威效应导致下属无条件服从管理层的时间安排',
      '曝光效应使得人们越熟悉越容易原谅他人迟到',
      '峰终定律让人只记得会议最后十分钟的讨论质量',
    ],
    explanation: '基本归因错误：评价他人行为时过度归因于稳定内在人格，评价自己失误时则更敏锐地看到外部情境压力。',
  },
  {
    id: 'social-bystander',
    focusDomain: 'social-emotion',
    knowledgePoint: '旁观者效应破局指令',
    prompt: '在公共场合发生突发紧急状况、周围有十几位路人围观却无人行动时，最能打破“责任扩散”的求助方式是：',
    correctOption: '明确点名并建立眼神接触：“穿蓝外套的先生，请您帮忙拨打 120！”',
    distractors: [
      '面向人群大声泛泛呼喊：“有没有人能帮帮忙啊！”',
      '先保持沉默等待人群中有人主动站出来协调',
      '向所有围观者同时解释事件的复杂背景原因',
    ],
    explanation: '旁观者效应破局法：将分散在群体中的模糊责任精准锁定到单一具体个体，即可消除多元无知与责任稀释。',
  },
  {
    id: 'social-microexpression-duchene',
    focusDomain: 'social-emotion',
    knowledgePoint: 'FACS 微表情与杜氏微笑校验',
    prompt: '在面部动作编码系统（FACS）中，区分“发自内心的真实愉悦微笑”与“礼貌性社交假笑”的关键肌肉联动线索是：',
    correctOption: '是否同时伴随眼轮匝肌收缩（AU6，眼角形成自然鱼尾纹）',
    distractors: [
      '嘴角上扬幅度是否达到露齿微笑的标准比例',
      '头部是否轻微向右侧倾斜超过 15 度',
      '微笑持续时间是否完整保持在 5 秒以上',
    ],
    explanation: '杜氏微笑（Duchenne Smile）：嘴角颧大肌（AU12）可受意识主动控制，而眼轮匝肌（AU6）通常只在真实积极情绪下自发收紧。',
  },
];

function generateCuratedDomainTask(
  focusDomain: PracticeDomainFocus,
  recentIds: string[],
  excludeTaskId?: string
): WarmupTask {
  const domainPool = CURATED_DOMAIN_PUZZLES.filter((p) => p.focusDomain === focusDomain);
  const fallbackPool = domainPool.length > 0 ? domainPool : CURATED_DOMAIN_PUZZLES;
  const freshPool = fallbackPool.filter(
    (p) => !recentIds.includes(p.id) && p.id !== excludeTaskId
  );
  const nonExcluded = fallbackPool.filter((p) => p.id !== excludeTaskId);
  const pool =
    freshPool.length > 0
      ? freshPool
      : nonExcluded.length > 0
        ? nonExcluded
        : fallbackPool;
  const picked = pickOne(pool);

  const tagged = cryptoShuffle([
    { label: picked.correctOption, isCorrect: true },
    ...picked.distractors.map((label) => ({ label, isCorrect: false })),
  ]);

  return {
    id: picked.id,
    domain: 'deductive-logic',
    domainLabelZh: '认知逻辑推理',
    focusDomain: picked.focusDomain,
    focusLabelZh: PRACTICE_DOMAIN_META[picked.focusDomain].labelZh,
    knowledgePoint: picked.knowledgePoint,
    prompt: picked.prompt,
    subPrompt: picked.subPrompt,
    options: tagged.map((item) => ({ label: item.label })),
    correctIndex: tagged.findIndex((item) => item.isCorrect),
    explanation: picked.explanation,
  };
}

export interface DrawWarmupOptions {
  focus?: PracticeDomainFocus;
  profile?: UserPracticeProfile;
  excludeDomain?: WarmupDomain;
  excludeTaskId?: string;
}

export function drawCognitiveWarmupTask(options?: DrawWarmupOptions | WarmupDomain): WarmupTask {
  const normalized: DrawWarmupOptions =
    typeof options === 'string' ? { excludeDomain: options } : options || {};

  const recentIds = readRecentTaskIds();
  const targetFocus: PracticeDomainFocus =
    normalized.focus ||
    normalized.profile?.primaryFocus ||
    pickOne(['cognitive-bias', 'decision-science', 'memory-pattern', 'social-emotion'] as const);

  let task: WarmupTask;

  switch (targetFocus) {
    case 'decision-science': {
      const roll = cryptoRandom();
      if (roll < 0.42) {
        task = generateProceduralDecisionTask();
      } else if (roll < 0.78) {
        task = generateCuratedDomainTask('decision-science', recentIds, normalized.excludeTaskId);
      } else {
        task = generateNumberSequenceTask('decision-science');
      }
      break;
    }
    case 'cognitive-bias': {
      const roll = cryptoRandom();
      if (roll < 0.72) {
        task = generateCuratedDomainTask('cognitive-bias', recentIds, normalized.excludeTaskId);
      } else {
        task = generateSymbolicCipherTask('cognitive-bias');
      }
      break;
    }
    case 'memory-pattern': {
      const modes: WarmupDomain[] = ['pattern-matrix', 'number-sequence', 'symbolic-cipher'];
      const filtered = normalized.excludeDomain
        ? modes.filter((m) => m !== normalized.excludeDomain)
        : modes;
      const chosen = pickOne(filtered.length > 0 ? filtered : modes);
      if (chosen === 'pattern-matrix') task = generatePatternMatrixTask('memory-pattern');
      else if (chosen === 'number-sequence') task = generateNumberSequenceTask('memory-pattern');
      else task = generateSymbolicCipherTask('memory-pattern');
      break;
    }
    case 'social-emotion':
    default: {
      const roll = cryptoRandom();
      if (roll < 0.75) {
        task = generateCuratedDomainTask('social-emotion', recentIds, normalized.excludeTaskId);
      } else {
        task = generatePatternMatrixTask('social-emotion');
      }
      break;
    }
  }

  recordRecentTaskId(task.id);
  return task;
}

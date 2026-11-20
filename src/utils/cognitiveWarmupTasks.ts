import { cryptoRandom, cryptoShuffle } from './aleatoricEngine';

export type WarmupDomain = 'pattern-matrix' | 'number-sequence' | 'symbolic-cipher' | 'deductive-logic';

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
    const next = [...prev, id].slice(-12);
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

function generatePatternMatrixTask(): WarmupTask {
  const shapes: PatternTileSpec['shape'][] = ['circle', 'square', 'triangle', 'diamond'];
  const fills: PatternTileSpec['fill'][] = ['outline', 'solid', 'double'];
  const dots: PatternTileSpec['dotPos'][] = ['top', 'right', 'bottom', 'left'];
  const rotations: PatternTileSpec['rotation'][] = [0, 90, 180, 270];

  const startShapeIdx = randInt(0, shapes.length - 1);
  const shapeStep = cryptoRandom() < 0.65 ? 1 : 2;
  const startFillIdx = randInt(0, fills.length - 1);
  const fillStep = cryptoRandom() < 0.7 ? 1 : 0;
  const startDotIdx = randInt(0, dots.length - 1);
  const dotStep = cryptoRandom() < 0.5 ? 1 : 3; // clockwise (+1) or counter-clockwise (+3 mod 4)
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
      shape:
        guard % 3 === 0
          ? pickOne(shapes)
          : answer.shape,
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
    prompt: '观察前三个图形的演变规则，选出第 4 格应出现的图形：',
    sequenceTiles: seq,
    options: tagged.map(({ label, tile }) => ({ label, tile })),
    correctIndex: tagged.findIndex((item) => item.isCorrect),
    explanation: `规律解析：${shapeDesc}，且${dotDesc}${fillDesc}。`,
  };
}

function generateNumberSequenceTask(): WarmupTask {
  const variant = randInt(0, 3);
  let seq: number[] = [];
  let answer = 0;
  let explanation = '';

  if (variant === 0) {
    // Second-order linear growth: diff increases by d each step
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
    // Geometric x2 + offset
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
    // Shifted Fibonacci: a_n = a_{n-1} + a_{n-2}
    const a = randInt(2, 6);
    const b = randInt(4, 9);
    const c = a + b;
    const d = b + c;
    answer = c + d;
    seq = [a, b, c, d];
    explanation = `从第 3 项起每一项等于前两项之和（${a}+${b}=${c}，${b}+${c}=${d}），故 ${c} + ${d} = ${answer}。`;
  } else {
    // Square + constant offset
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
    prompt: '找出下列数字序列的生成规律，填入问号处的正确数字：',
    subPrompt: `${seq.join('  ·  ')}  ·  ?`,
    options: tagged.map((item) => ({ label: item.label })),
    correctIndex: tagged.findIndex((item) => item.isCorrect),
    explanation,
  };
}

function generateSymbolicCipherTask(): WarmupTask {
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
    prompt: `若采用相同字母映射规则，「${sampleWord}」对应「${encodedSample}」，则「${targetWord}」应映射为：`,
    subPrompt: `${sampleWord}  →  ${encodedSample}    |    ${targetWord}  →  ?`,
    options: tagged.map((item) => ({ label: item.label })),
    correctIndex: tagged.findIndex((item) => item.isCorrect),
    explanation: `编码规则为每个字母按${directionDesc}，逐字母替换即可得到 ${answer}。`,
  };
}

interface CuratedLogicPuzzle {
  id: string;
  prompt: string;
  subPrompt?: string;
  correctOption: string;
  distractors: [string, string, string];
  explanation: string;
}

const CURATED_LOGIC_PUZZLES: CuratedLogicPuzzle[] = [
  {
    id: 'logic-contrapositive-1',
    prompt: '已知命题「只有保持专注，才能识别细微的情绪线索」为真，下列哪项必定成立？',
    correctOption: '如果未能保持专注，就无法识别细微情绪线索',
    distractors: [
      '只要保持专注，就一定能识别所有情绪线索',
      '没有识别出情绪线索，说明一定没有保持专注',
      '情绪线索是否细微，完全取决于环境噪音',
    ],
    explanation: '「只有 P 才 Q」等价于「若非 P 则非 Q」（必要条件逆否命题）。保持专注是必要条件，而非充分条件。',
  },
  {
    id: 'logic-base-rate-2',
    prompt: '某检测对真实说谎者的检出率是 90%，对诚实者的误报率是 10%。若人群中仅 5% 的人说谎，一名被检测为阳性的人真正说谎的概率接近：',
    correctOption: '约 32%（远低于 50%）',
    distractors: ['恰好 90%', '约 80% 左右', '约 50%'],
    explanation: '贝叶斯基准率效应：1000 人中 50 名说谎者检出 45 人，950 名诚实者误报 95 人，45/(45+95) ≈ 32.1%。',
  },
  {
    id: 'logic-syllogism-3',
    prompt: '已知「所有理性决策者都重视反事实检验」，且「部分心理学研究者是理性决策者」，由此必然能推出：',
    correctOption: '至少有部分心理学研究者重视反事实检验',
    distractors: [
      '所有心理学研究者都重视反事实检验',
      '重视反事实检验的人都是心理学研究者',
      '没有心理学研究者忽视反事实检验',
    ],
    explanation: '交集传递律：存在既属于“心理学研究者”又属于“理性决策者”的个体，而后者全集均包含“重视反事实检验”属性。',
  },
  {
    id: 'logic-conjunction-4',
    prompt: '林女士性格内向、严谨细致，大学主修哲学并常关注社会公平议题。以下哪种推断在概率上最不可能比另一项更高？',
    correctOption: '“林女士是银行出纳，且积极参与公益社团”概率大于“她是银行出纳”',
    distractors: [
      '“林女士是银行出纳”的概率大于或等于“她是银行出纳且喜爱阅读”',
      '两个独立事件的联合概率不会超过单个事件本身',
      '生动的性格描写常诱导人们忽略联合概率边界',
    ],
    explanation: '合取谬误（Conjunction Fallacy）：P(A 且 B) 永远不可能大于 P(A)，无论描述多符合直觉刻板印象。',
  },
  {
    id: 'logic-truth-liar-5',
    prompt: '甲说：“乙在说谎。” 乙说：“我们两人中至少有一人在说真话。” 若每人要么总说真话，要么总说假话，则：',
    correctOption: '乙说真话，甲在说谎',
    distractors: ['甲说真话，乙在说谎', '两人都在说真话', '两人都在说谎'],
    explanation: '若乙说假话，则“至少一人说真话”为假，推出两人都说假话；此时甲说“乙在说谎”却变成真话，矛盾！故乙必为真，甲为假。',
  },
  {
    id: 'logic-ordering-strict-v2',
    prompt: '四位参与者完成推理测试的用时排名：甲比乙快；乙比丙快；丁比甲快。请问第二快的是谁？',
    subPrompt: '甲快于乙  ·  乙快于丙  ·  丁快于甲',
    correctOption: '甲（排名：丁 → 甲 → 乙 → 丙）',
    distractors: ['丁', '乙', '丙'],
    explanation: '由已知传递关系直接可得唯一全序：丁最快，其次为甲，第三为乙，丙最慢。',
  },
  {
    id: 'logic-wason-card-7',
    prompt: '桌上有四张卡片，一面是字母，一面是数字，现朝上分别为「E」「K」「4」「7」。为验证规则“若一面是元音字母，则另一面必为偶数”，最少需翻看哪两张？',
    subPrompt: '规则：元音字母 ⇒ 偶数',
    correctOption: '翻看「E」与「7」',
    distractors: ['翻看「E」与「4」', '翻看「K」与「7」', '只需翻看「E」'],
    explanation: '沃森选择任务（Wason Selection Task）：只需检验可能证伪规则的情形——“元音是否配了奇数（翻 E）”以及“奇数背后是否藏了元音（翻 7）”。',
  },
  {
    id: 'logic-sunk-cost-8',
    prompt: '你花 120 元买了两小时后开场的电影票，结果突发暴雨且片评极差，前往观影反而让你情绪更糟。理性决策应依据什么？',
    correctOption: '比较“去”与“不去”的未来边际体验，忽略已付的 120 元',
    distractors: [
      '既然已花 120 元，冒雨看完才能摊平心理损失',
      '只有当电影票超过 200 元时才值得坚持前往',
      '以已投入成本作为继续追加时间投入的依据',
    ],
    explanation: '沉没成本谬误识别：已经发生且不可回收的支出不应影响对未来净收益的理性权衡。',
  },
];

function generateDeductiveLogicTask(recentIds: string[]): WarmupTask {
  const unseen = CURATED_LOGIC_PUZZLES.filter((p) => !recentIds.includes(p.id));
  const pool = unseen.length > 0 ? unseen : CURATED_LOGIC_PUZZLES;
  const picked = pickOne(pool);

  const tagged = cryptoShuffle([
    { label: picked.correctOption, isCorrect: true },
    ...picked.distractors.map((label) => ({ label, isCorrect: false })),
  ]);

  return {
    id: picked.id,
    domain: 'deductive-logic',
    domainLabelZh: '认知逻辑推理',
    prompt: picked.prompt,
    subPrompt: picked.subPrompt,
    options: tagged.map((item) => ({ label: item.label })),
    correctIndex: tagged.findIndex((item) => item.isCorrect),
    explanation: picked.explanation,
  };
}

export function drawCognitiveWarmupTask(excludeDomain?: WarmupDomain): WarmupTask {
  const recentIds = readRecentTaskIds();
  const allDomains: WarmupDomain[] = [
    'pattern-matrix',
    'number-sequence',
    'symbolic-cipher',
    'deductive-logic',
  ];
  const candidateDomains = excludeDomain
    ? allDomains.filter((d) => d !== excludeDomain)
    : allDomains;
  const chosenDomain = pickOne(candidateDomains);

  let task: WarmupTask;
  switch (chosenDomain) {
    case 'pattern-matrix':
      task = generatePatternMatrixTask();
      break;
    case 'number-sequence':
      task = generateNumberSequenceTask();
      break;
    case 'symbolic-cipher':
      task = generateSymbolicCipherTask();
      break;
    case 'deductive-logic':
    default:
      task = generateDeductiveLogicTask(recentIds);
      break;
  }

  recordRecentTaskId(task.id);
  return task;
}

import { DifficultyLevel, GameDifficulty, LoveDomainId, PsychologyLaw } from '../types';
import { LOVE_PSYCHOLOGY_LAWS } from '../data/lovePsychologyCodex';
import { LOVE_DOMAIN_MAP } from '../data/lovePsychologyTypes';
import { REVERSE_PSYCHOLOGY_LAWS } from '../data/reversePsychologyLaws';

export type AleatoricTemplateId =
  | 'principle-from-concept'
  | 'concept-from-principle'
  | 'boundary-from-concept'
  | 'scenario-diagnosis'
  | 'action-prescription'
  | 'domain-calibration';

export const ALEATORIC_TEMPLATES: AleatoricTemplateId[] = [
  'principle-from-concept',
  'concept-from-principle',
  'boundary-from-concept',
  'scenario-diagnosis',
  'action-prescription',
  'domain-calibration',
];

export interface AleatoricLoveQuestion {
  encounterKey: string; // `${law.id}::${templateId}`
  templateId: AleatoricTemplateId;
  templateLabel: string;
  law: PsychologyLaw;
  prompt: string;
  contextTag: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  healthyBoundary: string;
  assignedCityZh: string;
}

interface AleatoricStorageState {
  seenEncounters: string[];
  recentLawIds: string[];
  totalDraws: number;
  lastPlayedAt: string;
}

const STORAGE_KEY = 'mindlabz_love_aleatoric_deck_v1';
const RECENT_COOLDOWN_WINDOW = 60;

/**
 * Cryptographic-grade uniform random float in [0, 1).
 */
export function cryptoRandom(): number {
  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
    const buf = new Uint32Array(1);
    window.crypto.getRandomValues(buf);
    return buf[0] / 4294967296;
  }
  return Math.random();
}

/**
 * Unbiased CSPRNG Fisher-Yates shuffle.
 */
export function cryptoShuffle<T>(arr: readonly T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(cryptoRandom() * (i + 1));
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }
  return copy;
}

function loadDeckState(): AleatoricStorageState {
  try {
    if (typeof window === 'undefined') {
      return { seenEncounters: [], recentLawIds: [], totalDraws: 0, lastPlayedAt: '' };
    }
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        seenEncounters: Array.isArray(parsed.seenEncounters) ? parsed.seenEncounters : [],
        recentLawIds: Array.isArray(parsed.recentLawIds) ? parsed.recentLawIds : [],
        totalDraws: typeof parsed.totalDraws === 'number' ? parsed.totalDraws : 0,
        lastPlayedAt: typeof parsed.lastPlayedAt === 'string' ? parsed.lastPlayedAt : '',
      };
    }
  } catch {
    // ignore storage errors
  }
  return { seenEncounters: [], recentLawIds: [], totalDraws: 0, lastPlayedAt: '' };
}

function saveDeckState(state: AleatoricStorageState): void {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage quota errors
  }
}

export function resetAleatoricDeck(): void {
  saveDeckState({
    seenEncounters: [],
    recentLawIds: [],
    totalDraws: 0,
    lastPlayedAt: new Date().toISOString(),
  });
}

export function getAleatoricStats(): {
  totalConcepts: number;
  totalUniqueEncounters: number;
  seenEncountersCount: number;
  uniqueConceptsExplored: number;
  totalDraws: number;
} {
  const state = loadDeckState();
  const seenConcepts = new Set(state.seenEncounters.map((k) => k.split('::')[0]));
  return {
    totalConcepts: LOVE_PSYCHOLOGY_LAWS.length,
    totalUniqueEncounters: LOVE_PSYCHOLOGY_LAWS.length * ALEATORIC_TEMPLATES.length,
    seenEncountersCount: state.seenEncounters.length,
    uniqueConceptsExplored: seenConcepts.size,
    totalDraws: state.totalDraws,
  };
}

function pickContrastDistractors(
  target: PsychologyLaw,
  pool: PsychologyLaw[],
  count: number
): PsychologyLaw[] {
  const candidates = cryptoShuffle(pool.filter((l) => l.id !== target.id));
  const picked: PsychologyLaw[] = [];
  const usedNames = new Set<string>([target.nameZh]);

  // Prefer same subTag or same domain first for genuine cognitive challenge, plus cross-domain contrast
  const sameDomain = candidates.filter((c) => c.loveDomainId === target.loveDomainId);
  const diffDomain = candidates.filter((c) => c.loveDomainId !== target.loveDomainId);
  const prioritized = [...sameDomain.slice(0, 2), ...diffDomain];

  for (const item of prioritized) {
    if (picked.length >= count) break;
    if (!usedNames.has(item.nameZh)) {
      usedNames.add(item.nameZh);
      picked.push(item);
    }
  }

  for (const item of candidates) {
    if (picked.length >= count) break;
    if (!usedNames.has(item.nameZh)) {
      usedNames.add(item.nameZh);
      picked.push(item);
    }
  }

  return picked;
}

function shuffleOptions(correctText: string, distractorTexts: string[]): {
  options: string[];
  correctAnswer: number;
} {
  const cleanCorrect = correctText.trim();
  const uniqueWrong = Array.from(
    new Set(distractorTexts.map((d) => d.trim()).filter((d) => d && d !== cleanCorrect))
  ).slice(0, 3);

  while (uniqueWrong.length < 3) {
    uniqueWrong.push(`忽略边界并仅凭单一情绪做瞬间判断 (#${uniqueWrong.length + 1})`);
  }

  const tagged = cryptoShuffle([
    { text: cleanCorrect, ok: true },
    ...uniqueWrong.map((text) => ({ text, ok: false })),
  ]);

  return {
    options: tagged.map((t) => t.text),
    correctAnswer: tagged.findIndex((t) => t.ok),
  };
}

function materializeQuestion(
  law: PsychologyLaw,
  templateId: AleatoricTemplateId,
  referencePool: PsychologyLaw[]
): AleatoricLoveQuestion {
  const distractors = pickContrastDistractors(law, referencePool, 3);
  const domainMeta = law.loveDomainId ? LOVE_DOMAIN_MAP[law.loveDomainId] : undefined;
  const domainTitle = domainMeta?.shortTitle || law.loveDomainTitle || '爱情心理';
  const subTag = law.subTag || '关系';
  const boundary = law.healthyBoundary || law.keyTakeaway;
  const coreOnly = law.shortExplanation.split(/[；;]/)[0]?.trim() || law.shortExplanation;
  const encounterKey = `${law.id}::${templateId}`;
  const cityLabel = law.assignedCityZh || '世界首都探索站';

  if (templateId === 'principle-from-concept') {
    const { options, correctAnswer } = shuffleOptions(
      law.shortExplanation,
      distractors.map((d) => d.shortExplanation)
    );
    return {
      encounterKey,
      templateId,
      templateLabel: '核心机理辨析',
      law,
      prompt: `关于爱情心理学概念「${law.nameZh}（${law.nameEn}）」，以下哪项科学阐述最准确完整？`,
      contextTag: `${domainTitle} · ${subTag}`,
      options,
      correctAnswer,
      explanation: `【${law.codeId} · ${law.nameZh}】${law.shortExplanation}`,
      healthyBoundary: boundary,
      assignedCityZh: cityLabel,
    };
  }

  if (templateId === 'concept-from-principle') {
    const { options, correctAnswer } = shuffleOptions(
      `${law.nameZh} (${law.nameEn})`,
      distractors.map((d) => `${d.nameZh} (${d.nameEn})`)
    );
    return {
      encounterKey,
      templateId,
      templateLabel: '概念逆向定位',
      law,
      prompt: `在「${domainTitle}」领域中，哪一项心理学规律描述了：“${law.shortExplanation}”？`,
      contextTag: `${subTag} · ${law.difficulty}`,
      options,
      correctAnswer,
      explanation: `正解是「${law.nameZh}（${law.nameEn}）」。要点：${boundary}`,
      healthyBoundary: boundary,
      assignedCityZh: cityLabel,
    };
  }

  if (templateId === 'boundary-from-concept') {
    const { options, correctAnswer } = shuffleOptions(
      boundary,
      distractors.map((d) => d.healthyBoundary || d.keyTakeaway)
    );
    return {
      encounterKey,
      templateId,
      templateLabel: '健康边界校准',
      law,
      prompt: `当关系中涉及到「${law.nameZh}」（${coreOnly}）时，最关键的科学边界与自我保护警示是哪一条？`,
      contextTag: `边界防御 · ${subTag}`,
      options,
      correctAnswer,
      explanation: `掌握「${law.nameZh}」不仅要知道“${coreOnly}”，更要坚守边界：${boundary}`,
      healthyBoundary: boundary,
      assignedCityZh: cityLabel,
    };
  }

  if (templateId === 'scenario-diagnosis') {
    const { options, correctAnswer } = shuffleOptions(
      `${law.nameZh} — ${domainMeta?.shortTitle || subTag}`,
      distractors.map((d) => {
        const dm = d.loveDomainId ? LOVE_DOMAIN_MAP[d.loveDomainId] : undefined;
        return `${d.nameZh} — ${dm?.shortTitle || d.subTag || '关系'}`;
      })
    );
    return {
      encounterKey,
      templateId,
      templateLabel: '真实情境诊断',
      law,
      prompt: `【互动实战研判】两位伴侣在「${subTag}」课题上出现状况——研究表明“${coreOnly}”。这一现象直接对应哪条定律与所属类别？`,
      contextTag: `情境诊断 · ${cityLabel}`,
      options,
      correctAnswer,
      explanation: `该情境体现「${law.nameZh}（${domainTitle}）」：${law.shortExplanation}`,
      healthyBoundary: boundary,
      assignedCityZh: cityLabel,
    };
  }

  if (templateId === 'action-prescription') {
    const { options, correctAnswer } = shuffleOptions(
      `围绕「${law.nameZh}」采取校准：${boundary}`,
      distractors.map((d) => `围绕「${d.nameZh}」采取校准：${d.healthyBoundary || d.keyTakeaway}`)
    );
    return {
      encounterKey,
      templateId,
      templateLabel: '关系行动处方',
      law,
      prompt: `在面对「${law.nameZh}（${law.nameEn}）」考验的高压恋爱情境中，以下哪项行动处方最符合成熟心理健康准则？`,
      contextTag: `行动处方 · ${law.difficulty}`,
      options,
      correctAnswer,
      explanation: `「${law.nameZh}」提示我们：${law.shortExplanation}`,
      healthyBoundary: boundary,
      assignedCityZh: cityLabel,
    };
  }

  // domain-calibration
  const { options, correctAnswer } = shuffleOptions(
    `【${domainTitle} · ${subTag}】${law.nameZh}：${boundary}`,
    distractors.map((d) => {
      const dm = d.loveDomainId ? LOVE_DOMAIN_MAP[d.loveDomainId] : undefined;
      return `【${dm?.shortTitle || '情感心理'} · ${d.subTag || '关系'}】${d.nameZh}：${d.healthyBoundary || d.keyTakeaway}`;
    })
  );
  return {
    encounterKey,
    templateId,
    templateLabel: '全景分类映射',
    law,
    prompt: `针对核心现象「${coreOnly}」，下列哪项同时准确归类了它的心理学类别、概念名称与实操准则？`,
    contextTag: `全景分类 · ${law.codeId || ''}`,
    options,
    correctAnswer,
    explanation: `归属【${domainTitle} · ${subTag}】下的「${law.nameZh}」：${law.shortExplanation}`,
    healthyBoundary: boundary,
    assignedCityZh: cityLabel,
  };
}

function getAllowedDifficulties(arenaDiff?: GameDifficulty | 'all'): DifficultyLevel[] {
  if (!arenaDiff || arenaDiff === 'all') return ['Easy', 'Medium', 'Hard'];
  if (arenaDiff === '低') return ['Easy', 'Medium'];
  if (arenaDiff === '中') return ['Easy', 'Medium', 'Hard'];
  if (arenaDiff === '高') return ['Medium', 'Hard'];
  return ['Hard', 'Medium', 'Easy'];
}

/**
 * Extreme Non-Repeating Aleatoric Drawer for Arena.
 * Guarantees:
 * 1) Never draws any previously seen `(lawId::templateId)` encounter across sessions until deck exhaustion.
 * 2) Never draws the same `law.id` back-to-back or within recent cooldown window (60 items).
 * 3) Interleaves categories/subTags so successive questions feel genuinely diverse.
 * 4) Fresh CSPRNG Fisher-Yates shuffle on candidate queue, distractors, and [A, B, C, D] options.
 */
export function drawAleatoricLoveQuestions(
  count: number,
  options?: {
    domainFilter?: LoveDomainId | 'all';
    arenaDifficulty?: GameDifficulty | 'all';
    preferredTemplate?: AleatoricTemplateId;
  }
): AleatoricLoveQuestion[] {
  const domainFilter = options?.domainFilter || 'all';
  const allowedDiffs = getAllowedDifficulties(options?.arenaDifficulty);

  let pool = LOVE_PSYCHOLOGY_LAWS.filter((law) => {
    if (domainFilter !== 'all' && law.loveDomainId !== domainFilter) return false;
    if (!allowedDiffs.includes(law.difficulty)) return false;
    return true;
  });

  if (pool.length < count) {
    pool = LOVE_PSYCHOLOGY_LAWS.filter((law) =>
      domainFilter !== 'all' ? law.loveDomainId === domainFilter : true
    );
  }
  if (pool.length === 0) {
    pool = LOVE_PSYCHOLOGY_LAWS;
  }

  let state = loadDeckState();
  const seenSet = new Set(state.seenEncounters);
  const recentSet = new Set(state.recentLawIds);

  // Build all candidate (law, templateId) pairs for the filtered pool
  const templates = options?.preferredTemplate
    ? [options.preferredTemplate]
    : ALEATORIC_TEMPLATES;

  const buildUnseenPairs = (ignoreRecent: boolean) => {
    const pairs: Array<{ law: PsychologyLaw; templateId: AleatoricTemplateId }> = [];
    for (const law of pool) {
      if (!ignoreRecent && recentSet.has(law.id)) continue;
      for (const tpl of templates) {
        const key = `${law.id}::${tpl}`;
        if (!seenSet.has(key)) {
          pairs.push({ law, templateId: tpl });
        }
      }
    }
    return cryptoShuffle(pairs);
  };

  let unseenQueue = buildUnseenPairs(false);

  // If cooldown filtered too aggressively (e.g., narrow category filter), relax cooldown first
  if (unseenQueue.length < count) {
    unseenQueue = buildUnseenPairs(true);
  }

  // If the entire encounter universe for this filter has been conquered, recycle only stale keys for this pool
  if (unseenQueue.length < count) {
    const poolIds = new Set(pool.map((l) => l.id));
    state.seenEncounters = state.seenEncounters.filter((k) => !poolIds.has(k.split('::')[0]));
    seenSet.clear();
    state.seenEncounters.forEach((k) => seenSet.add(k));
    unseenQueue = buildUnseenPairs(false);
    if (unseenQueue.length < count) {
      unseenQueue = buildUnseenPairs(true);
    }
  }

  const chosen: Array<{ law: PsychologyLaw; templateId: AleatoricTemplateId }> = [];
  const chosenLawIdsInBatch = new Set<string>();
  let lastSubTag = '';

  // Pass 1: maximize subTag diversity and strictly unique concepts within the current batch
  for (const cand of unseenQueue) {
    if (chosen.length >= count) break;
    if (chosenLawIdsInBatch.has(cand.law.id)) continue;
    if (cand.law.subTag && cand.law.subTag === lastSubTag) continue;
    chosen.push(cand);
    chosenLawIdsInBatch.add(cand.law.id);
    lastSubTag = cand.law.subTag || '';
  }

  // Pass 2: fill any remaining slots if strict subTag alternation skipped candidates
  if (chosen.length < count) {
    for (const cand of unseenQueue) {
      if (chosen.length >= count) break;
      if (chosenLawIdsInBatch.has(cand.law.id)) continue;
      chosen.push(cand);
      chosenLawIdsInBatch.add(cand.law.id);
    }
  }

  // Fallback pass 3: if pool itself has fewer concepts than count
  if (chosen.length < count) {
    for (const cand of unseenQueue) {
      if (chosen.length >= count) break;
      const alreadySamePair = chosen.some(
        (c) => c.law.id === cand.law.id && c.templateId === cand.templateId
      );
      if (!alreadySamePair) {
        chosen.push(cand);
      }
    }
  }

  const nextRecent = [...state.recentLawIds];
  const results: AleatoricLoveQuestion[] = chosen.map(({ law, templateId }) => {
    const key = `${law.id}::${templateId}`;
    if (!seenSet.has(key)) {
      seenSet.add(key);
      state.seenEncounters.push(key);
    }
    nextRecent.push(law.id);
    return materializeQuestion(law, templateId, LOVE_PSYCHOLOGY_LAWS);
  });

  state.recentLawIds = nextRecent.slice(-RECENT_COOLDOWN_WINDOW);
  state.totalDraws += results.length;
  state.lastPlayedAt = new Date().toISOString();
  saveDeckState(state);

  return results;
}

// ============================================================================
// UNIVERSAL NON-REPEATING LIBRARY / LISTENING SHUFFLER (CSPRNG + Cross-Session)
// ============================================================================

const LIB_STORAGE_KEY = 'mindlabz_library_aleatoric_deck_v1';

interface LibraryDeckMap {
  [scopeKey: string]: {
    seenIds: string[];
    recentBatchIds: string[];
    shuffleCycles: number;
  };
}

function loadLibraryDeckMap(): LibraryDeckMap {
  try {
    if (typeof window === 'undefined') return {};
    const raw = window.localStorage.getItem(LIB_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    }
  } catch {
    // ignore storage errors
  }
  return {};
}

function saveLibraryDeckMap(map: LibraryDeckMap): void {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(LIB_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore quota errors
  }
}

/**
 * CSPRNG non-repeating ordering for Library / Listening Vault / Game Dispatch.
 * Guarantees unseen laws always appear before previously viewed ones in fresh random order;
 * records the leading head window (`markCount`) into persistent session storage so consecutive visits
 * never serve the same items at the top. Automatically recycles once the entire deck is explored.
 */
export function drawNonRepeatingLawOrder<T extends { id: string }>(
  pool: readonly T[],
  scopeKey: string,
  options?: { markHeadCount?: number; resetScope?: boolean }
): T[] {
  if (pool.length <= 1) return [...pool];
  const markHeadCount = options?.markHeadCount ?? Math.min(24, Math.max(4, Math.ceil(pool.length * 0.25)));

  const map = loadLibraryDeckMap();
  let scopeState = options?.resetScope
    ? { seenIds: [], recentBatchIds: [], shuffleCycles: 0 }
    : map[scopeKey] || { seenIds: [], recentBatchIds: [], shuffleCycles: 0 };

  const seenSet = new Set(scopeState.seenIds);
  const recentSet = new Set(scopeState.recentBatchIds);

  let unseen = pool.filter((item) => !seenSet.has(item.id));
  if (unseen.length === 0) {
    // Entire deck conquered -> reset seen history while keeping very recent cooldown to avoid edge repeat
    const poolIds = new Set(pool.map((p) => p.id));
    scopeState = {
      seenIds: scopeState.seenIds.filter((id) => !poolIds.has(id)),
      recentBatchIds: scopeState.recentBatchIds,
      shuffleCycles: (scopeState.shuffleCycles || 0) + 1,
    };
    unseen = [...pool];
  }

  // Partition unseen into fresh (not in immediate previous batch) vs cooldown
  const freshUnseen = cryptoShuffle(unseen.filter((item) => !recentSet.has(item.id)));
  const cooldownUnseen = cryptoShuffle(unseen.filter((item) => recentSet.has(item.id)));
  const seenRemainder = cryptoShuffle(pool.filter((item) => seenSet.has(item.id)));

  const ordered = [...freshUnseen, ...cooldownUnseen, ...seenRemainder];

  const newlyExposed = ordered.slice(0, markHeadCount).map((item) => item.id);
  const nextSeenSet = new Set(scopeState.seenIds);
  newlyExposed.forEach((id) => nextSeenSet.add(id));

  map[scopeKey] = {
    seenIds: Array.from(nextSeenSet),
    recentBatchIds: newlyExposed.slice(-30),
    shuffleCycles: scopeState.shuffleCycles || 0,
  };
  saveLibraryDeckMap(map);

  return ordered;
}

export function resetLibraryAleatoricScope(scopeKey?: string): void {
  if (!scopeKey) {
    saveLibraryDeckMap({});
    return;
  }
  const map = loadLibraryDeckMap();
  delete map[scopeKey];
  saveLibraryDeckMap(map);
}

// ============================================================================
// REVERSE PSYCHOLOGY 100 · CSPRNG NON-REPEATING ARENA ENGINE (500 ENCOUNTERS)
// ============================================================================

export type ReverseAleatoricTemplateId =
  | 'mechanism-core'
  | 'scenario-best-response'
  | 'manipulation-redline'
  | 'chapter-concept-match'
  | 'scenario-context-contrast';

export const REVERSE_ALEATORIC_TEMPLATES: ReverseAleatoricTemplateId[] = [
  'mechanism-core',
  'scenario-best-response',
  'manipulation-redline',
  'chapter-concept-match',
  'scenario-context-contrast',
];

export interface AleatoricReverseQuestion {
  encounterKey: string;
  templateId: ReverseAleatoricTemplateId;
  templateLabel: string;
  law: PsychologyLaw;
  prompt: string;
  contextTag: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  healthyBoundary: string;
}

const REVERSE_STORAGE_KEY = 'mindlabz_reverse_aleatoric_deck_v1';
const REVERSE_COOLDOWN_WINDOW = 30;

function loadReverseDeckState(): AleatoricStorageState {
  try {
    if (typeof window === 'undefined') {
      return { seenEncounters: [], recentLawIds: [], totalDraws: 0, lastPlayedAt: '' };
    }
    const raw = window.localStorage.getItem(REVERSE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        seenEncounters: Array.isArray(parsed.seenEncounters) ? parsed.seenEncounters : [],
        recentLawIds: Array.isArray(parsed.recentLawIds) ? parsed.recentLawIds : [],
        totalDraws: typeof parsed.totalDraws === 'number' ? parsed.totalDraws : 0,
        lastPlayedAt: typeof parsed.lastPlayedAt === 'string' ? parsed.lastPlayedAt : '',
      };
    }
  } catch {
    // ignore storage errors
  }
  return { seenEncounters: [], recentLawIds: [], totalDraws: 0, lastPlayedAt: '' };
}

function saveReverseDeckState(state: AleatoricStorageState): void {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(REVERSE_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota errors
  }
}

export function resetReverseAleatoricDeck(): void {
  saveReverseDeckState({
    seenEncounters: [],
    recentLawIds: [],
    totalDraws: 0,
    lastPlayedAt: new Date().toISOString(),
  });
}

export function getReverseAleatoricStats(): {
  totalConcepts: number;
  totalUniqueEncounters: number;
  seenEncountersCount: number;
  uniqueConceptsExplored: number;
  totalDraws: number;
} {
  const state = loadReverseDeckState();
  const seenConcepts = new Set(state.seenEncounters.map((k) => k.split('::')[0]));
  return {
    totalConcepts: REVERSE_PSYCHOLOGY_LAWS.length,
    totalUniqueEncounters: REVERSE_PSYCHOLOGY_LAWS.length * REVERSE_ALEATORIC_TEMPLATES.length,
    seenEncountersCount: state.seenEncounters.length,
    uniqueConceptsExplored: seenConcepts.size,
    totalDraws: state.totalDraws,
  };
}

function pickReverseDistractors(
  target: PsychologyLaw,
  pool: PsychologyLaw[],
  count: number
): PsychologyLaw[] {
  const candidates = cryptoShuffle(pool.filter((l) => l.id !== target.id));
  const picked: PsychologyLaw[] = [];
  const usedConcepts = new Set<string>([(target.chapter || '').trim()]);

  // Prefer distinct chapters so distractors represent contrasting reverse-psychology mechanisms
  for (const item of candidates) {
    if (picked.length >= count) break;
    const chap = (item.chapter || '').trim();
    if (!usedConcepts.has(chap)) {
      usedConcepts.add(chap);
      picked.push(item);
    }
  }

  for (const item of candidates) {
    if (picked.length >= count) break;
    if (!picked.some((p) => p.id === item.id)) {
      picked.push(item);
    }
  }

  return picked;
}

function materializeReverseQuestion(
  law: PsychologyLaw,
  templateId: ReverseAleatoricTemplateId,
  referencePool: PsychologyLaw[]
): AleatoricReverseQuestion {
  const distractors = pickReverseDistractors(law, referencePool, 3);
  const conceptName = law.nameZh.split('：')[0] || law.nameZh;
  const scenario = law.reverseScenario || '沟通实战';
  const categoryLabel = law.reverseCategory || '核心机制';
  const principle = law.reversePrinciple || law.whyItHappens || law.shortExplanation;
  const application = law.reverseApplication || law.realLifeExample;
  const boundary = law.healthyBoundary || law.keyTakeaway;
  const encounterKey = `${law.id}::${templateId}`;

  if (templateId === 'mechanism-core') {
    const { options, correctAnswer } = shuffleOptions(
      principle,
      distractors.map((d) => d.reversePrinciple || d.whyItHappens || d.shortExplanation)
    );
    return {
      encounterKey,
      templateId,
      templateLabel: '核心抗拒机制识别',
      law,
      prompt: `在逆向心理学「${conceptName}（${categoryLabel}）」中，以下哪项最准确解释了其底层心理机制？`,
      contextTag: `${law.codeId} · ${categoryLabel}`,
      options,
      correctAnswer,
      explanation: `【${law.codeId} · ${law.nameZh}】${principle}`,
      healthyBoundary: boundary,
    };
  }

  if (templateId === 'scenario-best-response') {
    const { options, correctAnswer } = shuffleOptions(
      application,
      distractors.map((d) => d.reverseApplication || d.realLifeExample)
    );
    return {
      encounterKey,
      templateId,
      templateLabel: '高情商自主沟通应对',
      law,
      prompt: `处于「${scenario}」现场并面临「${conceptName}」引发的抗拒风险时，以下哪项应对方案最稳妥有效？`,
      contextTag: `${scenario} · ${law.chapter || ''}`,
      options,
      correctAnswer,
      explanation: `在「${scenario}」中运用「${conceptName}」：${application}`,
      healthyBoundary: boundary,
    };
  }

  if (templateId === 'manipulation-redline') {
    const { options, correctAnswer } = shuffleOptions(
      law.answers[0],
      [
        `采用「${conceptName}」时只需隐藏真实意图并利用虚假稀缺施压即可`,
        `通过公开贬低、羞辱或假装不在乎强迫对方就范，效果最稳定可靠`,
        `只要套用固定反向话术，就能百分之百保证对方按自己的指令行动`,
      ]
    );
    return {
      encounterKey,
      templateId,
      templateLabel: '反操控与伦理边界判定',
      law,
      prompt: `关于「${law.nameZh}」的科学使用边界，下列哪项判断符合诚实沟通与心理自主原则？`,
      contextTag: `伦理边界 · ${categoryLabel}`,
      options,
      correctAnswer,
      explanation: `科学提醒：逆向心理不是稳定可保证奏效的操控术。${boundary}`,
      healthyBoundary: boundary,
    };
  }

  if (templateId === 'chapter-concept-match') {
    const { options, correctAnswer } = shuffleOptions(
      `${conceptName}（${categoryLabel}）`,
      distractors.map((d) => `${d.nameZh.split('：')[0]}（${d.reverseCategory || '心理机制'}）`)
    );
    return {
      encounterKey,
      templateId,
      templateLabel: '概念归位精准定位',
      law,
      prompt: `心理现象提示：“${principle}” 这一规律直接归属于哪一逆向心理学专题与分类？`,
      contextTag: `理论定位 · ${scenario}`,
      options,
      correctAnswer,
      explanation: `正解是「${conceptName}（${categoryLabel}）」。应用指引：${application}`,
      healthyBoundary: boundary,
    };
  }

  // scenario-context-contrast
  const { options, correctAnswer } = shuffleOptions(
    `【${scenario} · ${conceptName}】${law.answers[0]}`,
    distractors.map((d) => `【${d.reverseScenario || '通用场景'} · ${d.nameZh.split('：')[0]}】${d.answers[0]}`)
  );
  return {
    encounterKey,
    templateId,
    templateLabel: '跨场景实践策略匹配',
    law,
    prompt: `面对「${scenario}」中的自由受限与沟通拉锯问题，下列哪项「场景 × 原则 × 实操」匹配完全准确？`,
    contextTag: `${law.codeId} · 跨场景辨析`,
    options,
    correctAnswer,
    explanation: `「${law.nameZh}」对应策略：${application}`,
    healthyBoundary: boundary,
  };
}

/**
 * Draw CSPRNG non-repeating Reverse Psychology Arena questions across all 100 laws × 5 templates.
 */
export function drawAleatoricReverseQuestions(
  count: number,
  options?: {
    scenarioFilter?: string;
    categoryFilter?: string;
    arenaDifficulty?: GameDifficulty | 'all';
    gameIdFilter?: PsychologyLaw['relatedGame'];
  }
): AleatoricReverseQuestion[] {
  const scenarioFilter = options?.scenarioFilter || 'all';
  const categoryFilter = options?.categoryFilter || 'all';
  const allowedDiffs = getAllowedDifficulties(options?.arenaDifficulty);

  let pool = REVERSE_PSYCHOLOGY_LAWS.filter((law) => {
    if (scenarioFilter !== 'all' && law.reverseScenario !== scenarioFilter) return false;
    if (categoryFilter !== 'all' && law.reverseCategory !== categoryFilter) return false;
    if (
      options?.gameIdFilter &&
      law.relatedGame !== options.gameIdFilter &&
      !(law.dispatchedGames && law.dispatchedGames.includes(options.gameIdFilter))
    ) {
      return false;
    }
    if (!allowedDiffs.includes(law.difficulty)) return false;
    return true;
  });

  if (pool.length < count) {
    pool = REVERSE_PSYCHOLOGY_LAWS.filter((law) => {
      if (scenarioFilter !== 'all' && law.reverseScenario !== scenarioFilter) return false;
      if (categoryFilter !== 'all' && law.reverseCategory !== categoryFilter) return false;
      return true;
    });
  }
  if (pool.length === 0) {
    pool = REVERSE_PSYCHOLOGY_LAWS;
  }

  const state = loadReverseDeckState();
  const seenSet = new Set(state.seenEncounters);
  const recentSet = new Set(state.recentLawIds);

  const buildUnseenPairs = (ignoreRecent: boolean) => {
    const pairs: Array<{ law: PsychologyLaw; templateId: ReverseAleatoricTemplateId }> = [];
    for (const law of pool) {
      if (!ignoreRecent && recentSet.has(law.id)) continue;
      for (const tpl of REVERSE_ALEATORIC_TEMPLATES) {
        const key = `${law.id}::${tpl}`;
        if (!seenSet.has(key)) {
          pairs.push({ law, templateId: tpl });
        }
      }
    }
    return cryptoShuffle(pairs);
  };

  let unseenQueue = buildUnseenPairs(false);
  if (unseenQueue.length < count) {
    unseenQueue = buildUnseenPairs(true);
  }
  if (unseenQueue.length < count) {
    const poolIds = new Set(pool.map((l) => l.id));
    state.seenEncounters = state.seenEncounters.filter((k) => !poolIds.has(k.split('::')[0]));
    seenSet.clear();
    state.seenEncounters.forEach((k) => seenSet.add(k));
    unseenQueue = buildUnseenPairs(false);
    if (unseenQueue.length < count) {
      unseenQueue = buildUnseenPairs(true);
    }
  }

  const chosen: Array<{ law: PsychologyLaw; templateId: ReverseAleatoricTemplateId }> = [];
  const chosenLawIdsInBatch = new Set<string>();
  let lastScenario = '';

  // Pass 1: maximize scenario alternation & distinct laws within batch
  for (const cand of unseenQueue) {
    if (chosen.length >= count) break;
    if (chosenLawIdsInBatch.has(cand.law.id)) continue;
    if (cand.law.reverseScenario && cand.law.reverseScenario === lastScenario && pool.length > 5) continue;
    chosen.push(cand);
    chosenLawIdsInBatch.add(cand.law.id);
    lastScenario = cand.law.reverseScenario || '';
  }

  // Pass 2: relax scenario alternation if filtered narrowly
  if (chosen.length < count) {
    for (const cand of unseenQueue) {
      if (chosen.length >= count) break;
      if (chosenLawIdsInBatch.has(cand.law.id)) continue;
      chosen.push(cand);
      chosenLawIdsInBatch.add(cand.law.id);
    }
  }

  // Pass 3: allow multiple distinct template perspectives if pool is smaller than count
  if (chosen.length < count) {
    for (const cand of unseenQueue) {
      if (chosen.length >= count) break;
      if (!chosen.some((c) => c.law.id === cand.law.id && c.templateId === cand.templateId)) {
        chosen.push(cand);
      }
    }
  }

  const nextRecent = [...state.recentLawIds];
  const results = chosen.map(({ law, templateId }) => {
    const key = `${law.id}::${templateId}`;
    if (!seenSet.has(key)) {
      seenSet.add(key);
      state.seenEncounters.push(key);
    }
    nextRecent.push(law.id);
    return materializeReverseQuestion(law, templateId, REVERSE_PSYCHOLOGY_LAWS);
  });

  state.recentLawIds = nextRecent.slice(-REVERSE_COOLDOWN_WINDOW);
  state.totalDraws += results.length;
  state.lastPlayedAt = new Date().toISOString();
  saveReverseDeckState(state);

  return results;
}

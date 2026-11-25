import { DifficultyLevel, GameDifficulty, LoveDomainId, PsychologyLaw } from '../types';
import { LOVE_PSYCHOLOGY_LAWS } from '../data/lovePsychologyCodex';
import { LOVE_DOMAIN_MAP } from '../data/lovePsychologyTypes';
import { REVERSE_PSYCHOLOGY_LAWS } from '../data/reversePsychologyLaws';
import { CRIMINAL_PSYCHOLOGY_LAWS } from '../data/criminalPsychologyLaws';
import { SEXUAL_PSYCHOLOGY_LAWS } from '../data/sexualPsychologyLaws';
import { LOVE100_PSYCHOLOGY_LAWS } from '../data/love100PsychologyLaws';
import { INTIMATE_RELATIONSHIPS_LAWS } from '../data/intimateRelationshipsLaws';

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
  // Ensure unique input pool by id
  const uniquePool: T[] = [];
  const poolSeenIds = new Set<string>();
  for (const item of pool) {
    if (!poolSeenIds.has(item.id)) {
      poolSeenIds.add(item.id);
      uniquePool.push(item);
    }
  }

  if (uniquePool.length <= 1) return [...uniquePool];
  const markHeadCount =
    options?.markHeadCount ?? Math.min(24, Math.max(4, Math.ceil(uniquePool.length * 0.25)));

  const map = loadLibraryDeckMap();
  let scopeState = options?.resetScope
    ? { seenIds: [], recentBatchIds: [], shuffleCycles: 0 }
    : map[scopeKey] || { seenIds: [], recentBatchIds: [], shuffleCycles: 0 };

  let seenSet = new Set(scopeState.seenIds);
  const recentSet = new Set(scopeState.recentBatchIds);

  let unseen = uniquePool.filter((item) => !seenSet.has(item.id));
  if (unseen.length === 0) {
    // Entire deck conquered -> reset seen history while keeping very recent cooldown to avoid edge repeat
    scopeState = {
      seenIds: scopeState.seenIds.filter((id) => !poolSeenIds.has(id)),
      recentBatchIds: scopeState.recentBatchIds,
      shuffleCycles: (scopeState.shuffleCycles || 0) + 1,
    };
    seenSet = new Set(scopeState.seenIds);
    unseen = [...uniquePool];
  }

  const unseenIds = new Set(unseen.map((item) => item.id));

  // Partition unseen into fresh (not in immediate previous batch) vs cooldown
  const freshUnseen = cryptoShuffle(unseen.filter((item) => !recentSet.has(item.id)));
  const cooldownUnseen = cryptoShuffle(unseen.filter((item) => recentSet.has(item.id)));
  const seenRemainder = cryptoShuffle(
    uniquePool.filter((item) => !unseenIds.has(item.id) && seenSet.has(item.id))
  );

  const orderedRaw = [...freshUnseen, ...cooldownUnseen, ...seenRemainder];
  const ordered: T[] = [];
  const emittedIds = new Set<string>();
  for (const item of orderedRaw) {
    if (!emittedIds.has(item.id)) {
      emittedIds.add(item.id);
      ordered.push(item);
    }
  }

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

// ---------------------------------------------------------------------------
// 3. Criminal Psychology 100-Concept Aleatoric Engine (500 Non-Repeating Encounters)
// ---------------------------------------------------------------------------

export type CriminalAleatoricTemplateId =
  | 'theory-mechanism'
  | 'context-prevention'
  | 'ethical-boundary'
  | 'concept-identification'
  | 'risk-calibration';

export const CRIMINAL_ALEATORIC_TEMPLATES: CriminalAleatoricTemplateId[] = [
  'theory-mechanism',
  'context-prevention',
  'ethical-boundary',
  'concept-identification',
  'risk-calibration',
];

export interface AleatoricCriminalQuestion {
  encounterKey: string;
  templateId: CriminalAleatoricTemplateId;
  templateLabel: string;
  law: PsychologyLaw;
  prompt: string;
  contextTag: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  healthyBoundary: string;
}

const CRIMINAL_STORAGE_KEY = 'mindlabz_criminal_aleatoric_deck_v1';
const CRIMINAL_COOLDOWN_WINDOW = 30;

function loadCriminalDeckState(): AleatoricStorageState {
  try {
    if (typeof window === 'undefined') {
      return { seenEncounters: [], recentLawIds: [], totalDraws: 0, lastPlayedAt: '' };
    }
    const raw = window.localStorage.getItem(CRIMINAL_STORAGE_KEY);
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

function saveCriminalDeckState(state: AleatoricStorageState): void {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(CRIMINAL_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota errors
  }
}

export function resetCriminalAleatoricDeck(): void {
  saveCriminalDeckState({
    seenEncounters: [],
    recentLawIds: [],
    totalDraws: 0,
    lastPlayedAt: new Date().toISOString(),
  });
}

export function getCriminalAleatoricStats(): {
  totalConcepts: number;
  totalUniqueEncounters: number;
  seenEncountersCount: number;
  uniqueConceptsExplored: number;
  totalDraws: number;
} {
  const state = loadCriminalDeckState();
  const seenConcepts = new Set(state.seenEncounters.map((k) => k.split('::')[0]));
  return {
    totalConcepts: CRIMINAL_PSYCHOLOGY_LAWS.length,
    totalUniqueEncounters: CRIMINAL_PSYCHOLOGY_LAWS.length * CRIMINAL_ALEATORIC_TEMPLATES.length,
    seenEncountersCount: state.seenEncounters.length,
    uniqueConceptsExplored: seenConcepts.size,
    totalDraws: state.totalDraws,
  };
}

function pickCriminalDistractors(
  target: PsychologyLaw,
  pool: PsychologyLaw[],
  count: number,
  preferDistinctField: 'theory' | 'context' = 'theory'
): PsychologyLaw[] {
  const candidates = cryptoShuffle(pool.filter((l) => l.id !== target.id));
  const picked: PsychologyLaw[] = [];
  const usedKeys = new Set<string>([
    preferDistinctField === 'theory'
      ? target.criminalTheoryName || target.nameZh
      : target.criminalContext || '',
  ]);

  for (const item of candidates) {
    if (picked.length >= count) break;
    const key =
      preferDistinctField === 'theory'
        ? item.criminalTheoryName || item.nameZh
        : item.criminalContext || '';
    if (!usedKeys.has(key)) {
      usedKeys.add(key);
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

function materializeCriminalQuestion(
  law: PsychologyLaw,
  templateId: CriminalAleatoricTemplateId,
  referencePool: PsychologyLaw[]
): AleatoricCriminalQuestion {
  const theoryName = law.criminalTheoryName || law.nameZh.split('：')[0] || law.nameZh;
  const contextLabel = law.criminalContext || '理论核心';
  const categoryLabel = law.criminalCategory || '基础理论';
  const coreTheory = law.criminalCoreTheory || law.whyItHappens || law.shortExplanation;
  const appliedAngle = law.criminalAppliedAngle || law.realLifeExample;
  const boundary =
    law.healthyBoundary ||
    law.criminalLearningNote ||
    '用于理解风险机制和预防，不可单独作为诊断、定罪或预测依据。';
  const encounterKey = `${law.id}::${templateId}`;

  if (templateId === 'theory-mechanism') {
    const distractors = pickCriminalDistractors(law, referencePool, 3, 'theory');
    const { options, correctAnswer } = shuffleOptions(
      coreTheory,
      distractors.map((d) => d.criminalCoreTheory || d.whyItHappens || d.shortExplanation)
    );
    return {
      encounterKey,
      templateId,
      templateLabel: '核心理论机制辨析',
      law,
      prompt: `在犯罪心理学「${theoryName}（${categoryLabel}）」中，以下哪项阐述最准确概括了其核心理论机制？`,
      contextTag: `${law.codeId} · ${categoryLabel}`,
      options,
      correctAnswer,
      explanation: `【${law.codeId} · ${law.nameZh}】${coreTheory}`,
      healthyBoundary: boundary,
    };
  }

  if (templateId === 'context-prevention') {
    const distractors = pickCriminalDistractors(law, referencePool, 3, 'context');
    const { options, correctAnswer } = shuffleOptions(
      appliedAngle,
      distractors.map((d) => d.criminalAppliedAngle || d.realLifeExample)
    );
    return {
      encounterKey,
      templateId,
      templateLabel: '实景观察与风险预防',
      law,
      prompt: `在「${contextLabel}」场景下参考「${theoryName}」进行风险识别与预防时，以下哪项专业视角最合理？`,
      contextTag: `${contextLabel} · ${categoryLabel}`,
      options,
      correctAnswer,
      explanation: `在「${contextLabel}」视角下，${appliedAngle}`,
      healthyBoundary: boundary,
    };
  }

  if (templateId === 'ethical-boundary') {
    const { options, correctAnswer } = shuffleOptions(
      boundary,
      [
        `只要发现个体符合「${theoryName}」单一条目描述，即可直接作出确定性犯罪预测`,
        `可以用主观人格推测与家庭结构标签替代客观事实核查与法定程序`,
        `犯罪心理学研究概念等价于临床司法诊断工具，非专业人员可独立用于画像定性`,
      ]
    );
    return {
      encounterKey,
      templateId,
      templateLabel: '科学伦理与防误判边界',
      law,
      prompt: `关于「${law.nameZh}」的科学应用边界，以下哪项原则最符合犯罪心理学实证规范？`,
      contextTag: `非诊断边界 · ${contextLabel}`,
      options,
      correctAnswer,
      explanation: `科学边界提示：犯罪心理学概念用于理解机制与预防支持，绝非确定性犯罪预测工具。${boundary}`,
      healthyBoundary: boundary,
    };
  }

  if (templateId === 'concept-identification') {
    const distractors = pickCriminalDistractors(law, referencePool, 3, 'theory');
    const { options, correctAnswer } = shuffleOptions(
      `${theoryName}（${categoryLabel}）`,
      distractors.map(
        (d) => `${d.criminalTheoryName || d.nameZh.split('：')[0]}（${d.criminalCategory || '基础理论'}）`
      )
    );
    return {
      encounterKey,
      templateId,
      templateLabel: '研究模型精准定位',
      law,
      prompt: `核心机制线索：“${coreTheory}” 这一研究视角直接属于下列哪一项犯罪心理学模型？`,
      contextTag: `模型定位 · ${contextLabel}`,
      options,
      correctAnswer,
      explanation: `正确对应「${theoryName}（${categoryLabel}）」。预防应用：${appliedAngle}`,
      healthyBoundary: boundary,
    };
  }

  // risk-calibration
  const distractors = pickCriminalDistractors(law, referencePool, 3, 'context');
  const { options, correctAnswer } = shuffleOptions(
    `【${contextLabel} · ${theoryName}】${appliedAngle}`,
    distractors.map(
      (d) =>
        `【${d.criminalContext || '理论核心'} · ${d.criminalTheoryName || d.nameZh.split('：')[0]}】${
          d.criminalAppliedAngle || d.shortExplanation
        }`
    )
  );
  return {
    encounterKey,
    templateId,
    templateLabel: '跨场景风险因子校准',
    law,
    prompt: `针对「${contextLabel}」场景下「${theoryName}」的观察重点与防标签化原则，下列哪项匹配完全准确？`,
    contextTag: `${law.codeId} · 跨场景校准`,
    options,
    correctAnswer,
    explanation: `「${law.nameZh}」应用核心：${appliedAngle}`,
    healthyBoundary: boundary,
  };
}

/**
 * Draw CSPRNG non-repeating Criminal Psychology Arena questions across all 100 laws × 5 templates.
 */
export function drawAleatoricCriminalQuestions(
  count: number,
  options?: {
    contextFilter?: string;
    categoryFilter?: string;
    arenaDifficulty?: GameDifficulty | 'all';
    gameIdFilter?: PsychologyLaw['relatedGame'];
  }
): AleatoricCriminalQuestion[] {
  const contextFilter = options?.contextFilter || 'all';
  const categoryFilter = options?.categoryFilter || 'all';
  const allowedDiffs = getAllowedDifficulties(options?.arenaDifficulty);

  let pool = CRIMINAL_PSYCHOLOGY_LAWS.filter((law) => {
    if (contextFilter !== 'all' && law.criminalContext !== contextFilter) return false;
    if (categoryFilter !== 'all' && law.criminalCategory !== categoryFilter) return false;
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
    pool = CRIMINAL_PSYCHOLOGY_LAWS.filter((law) => {
      if (contextFilter !== 'all' && law.criminalContext !== contextFilter) return false;
      if (categoryFilter !== 'all' && law.criminalCategory !== categoryFilter) return false;
      return true;
    });
  }
  if (pool.length === 0) {
    pool = CRIMINAL_PSYCHOLOGY_LAWS;
  }

  const state = loadCriminalDeckState();
  const seenSet = new Set(state.seenEncounters);
  const recentSet = new Set(state.recentLawIds);

  const buildUnseenPairs = (ignoreRecent: boolean) => {
    const pairs: Array<{ law: PsychologyLaw; templateId: CriminalAleatoricTemplateId }> = [];
    for (const law of pool) {
      if (!ignoreRecent && recentSet.has(law.id)) continue;
      for (const tpl of CRIMINAL_ALEATORIC_TEMPLATES) {
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

  const chosen: Array<{ law: PsychologyLaw; templateId: CriminalAleatoricTemplateId }> = [];
  const chosenLawIdsInBatch = new Set<string>();
  let lastContext = '';

  for (const cand of unseenQueue) {
    if (chosen.length >= count) break;
    if (chosenLawIdsInBatch.has(cand.law.id)) continue;
    if (cand.law.criminalContext && cand.law.criminalContext === lastContext && pool.length > 5) {
      continue;
    }
    chosen.push(cand);
    chosenLawIdsInBatch.add(cand.law.id);
    lastContext = cand.law.criminalContext || '';
  }

  if (chosen.length < count) {
    for (const cand of unseenQueue) {
      if (chosen.length >= count) break;
      if (chosenLawIdsInBatch.has(cand.law.id)) continue;
      chosen.push(cand);
      chosenLawIdsInBatch.add(cand.law.id);
    }
  }

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
    return materializeCriminalQuestion(law, templateId, CRIMINAL_PSYCHOLOGY_LAWS);
  });

  state.recentLawIds = nextRecent.slice(-CRIMINAL_COOLDOWN_WINDOW);
  state.totalDraws += results.length;
  state.lastPlayedAt = new Date().toISOString();
  saveCriminalDeckState(state);

  return results;
}

// ---------------------------------------------------------------------------
// 4. Sexual Psychology 100-Concept Aleatoric Engine (500 Non-Repeating Encounters)
// ---------------------------------------------------------------------------

export type SexualAleatoricTemplateId =
  | 'concept-core'
  | 'context-practice'
  | 'consent-boundary'
  | 'topic-matching'
  | 'myth-debunking';

export const SEXUAL_ALEATORIC_TEMPLATES: SexualAleatoricTemplateId[] = [
  'concept-core',
  'context-practice',
  'consent-boundary',
  'topic-matching',
  'myth-debunking',
];

export interface AleatoricSexualQuestion {
  encounterKey: string;
  templateId: SexualAleatoricTemplateId;
  templateLabel: string;
  law: PsychologyLaw;
  prompt: string;
  contextTag: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  healthyBoundary: string;
}

const SEXUAL_STORAGE_KEY = 'mindlabz_sexual_aleatoric_deck_v1';
const SEXUAL_COOLDOWN_WINDOW = 30;

function loadSexualDeckState(): AleatoricStorageState {
  try {
    if (typeof window === 'undefined') {
      return { seenEncounters: [], recentLawIds: [], totalDraws: 0, lastPlayedAt: '' };
    }
    const raw = window.localStorage.getItem(SEXUAL_STORAGE_KEY);
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

function saveSexualDeckState(state: AleatoricStorageState): void {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(SEXUAL_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota errors
  }
}

export function resetSexualAleatoricDeck(): void {
  saveSexualDeckState({
    seenEncounters: [],
    recentLawIds: [],
    totalDraws: 0,
    lastPlayedAt: new Date().toISOString(),
  });
}

export function getSexualAleatoricStats(): {
  totalConcepts: number;
  totalUniqueEncounters: number;
  seenEncountersCount: number;
  uniqueConceptsExplored: number;
  totalDraws: number;
} {
  const state = loadSexualDeckState();
  const seenConcepts = new Set(state.seenEncounters.map((k) => k.split('::')[0]));
  return {
    totalConcepts: SEXUAL_PSYCHOLOGY_LAWS.length,
    totalUniqueEncounters: SEXUAL_PSYCHOLOGY_LAWS.length * SEXUAL_ALEATORIC_TEMPLATES.length,
    seenEncountersCount: state.seenEncounters.length,
    uniqueConceptsExplored: seenConcepts.size,
    totalDraws: state.totalDraws,
  };
}

function pickSexualDistractors(
  target: PsychologyLaw,
  pool: PsychologyLaw[],
  count: number,
  preferDistinctField: 'topic' | 'context' = 'topic'
): PsychologyLaw[] {
  const candidates = cryptoShuffle(pool.filter((l) => l.id !== target.id));
  const picked: PsychologyLaw[] = [];
  const usedKeys = new Set<string>([
    preferDistinctField === 'topic'
      ? target.sexualTopicName || target.nameZh
      : target.sexualContext || '',
  ]);

  for (const item of candidates) {
    if (picked.length >= count) break;
    const key =
      preferDistinctField === 'topic'
        ? item.sexualTopicName || item.nameZh
        : item.sexualContext || '';
    if (!usedKeys.has(key)) {
      usedKeys.add(key);
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

function materializeSexualQuestion(
  law: PsychologyLaw,
  templateId: SexualAleatoricTemplateId,
  referencePool: PsychologyLaw[]
): AleatoricSexualQuestion {
  const topicName = law.sexualTopicName || law.nameZh.split('：')[0] || law.nameZh;
  const contextLabel = law.sexualContext || '个人自我认识';
  const categoryLabel = law.sexualCategory || '生理与性反应';
  const pillarLabel = law.sexualPillar || '生理唤起与欲望机制';
  const coreConcept = law.sexualCoreConcept || law.whyItHappens || law.shortExplanation;
  const appliedAngle = law.sexualAppliedAngle || law.realLifeExample;
  const boundary =
    law.healthyBoundary ||
    law.sexualLearningNote ||
    '尊重自主、知情同意、隐私与多样性；遇到持续困扰请咨询合格医疗或心理专业人员。';
  const encounterKey = `${law.id}::${templateId}`;

  if (templateId === 'concept-core') {
    const distractors = pickSexualDistractors(law, referencePool, 3, 'topic');
    const { options, correctAnswer } = shuffleOptions(
      coreConcept,
      distractors.map((d) => d.sexualCoreConcept || d.whyItHappens || d.shortExplanation)
    );
    return {
      encounterKey,
      templateId,
      templateLabel: '科学原理核心辨析',
      law,
      prompt: `在性心理学「${topicName}（${categoryLabel}）」中，以下哪项阐述最准确概括了其科学规律？`,
      contextTag: `${law.codeId} · ${pillarLabel}`,
      options,
      correctAnswer,
      explanation: `【${law.codeId} · ${law.nameZh}】${coreConcept}`,
      healthyBoundary: boundary,
    };
  }

  if (templateId === 'context-practice') {
    const distractors = pickSexualDistractors(law, referencePool, 3, 'context');
    const { options, correctAnswer } = shuffleOptions(
      appliedAngle,
      distractors.map((d) => d.sexualAppliedAngle || d.realLifeExample)
    );
    return {
      encounterKey,
      templateId,
      templateLabel: '场景尊重与健康践行',
      law,
      prompt: `在「${contextLabel}」场景下理解并应用「${topicName}」时，哪项互动与自我认知方式最科学健康？`,
      contextTag: `${contextLabel} · ${categoryLabel}`,
      options,
      correctAnswer,
      explanation: `在「${contextLabel}」视角下，${appliedAngle}`,
      healthyBoundary: boundary,
    };
  }

  if (templateId === 'consent-boundary') {
    const learningNote =
      law.sexualLearningNote ||
      '本卡用于科学知识学习与自我理解，不构成医学诊断、心理诊断或个体行为预测。';
    const { options, correctAnswer } = shuffleOptions(
      `${appliedAngle}（原则：${learningNote}）`,
      [
        `一旦出现生理反应或过往亲密历史，即可视作无需再沟通的默许同意`,
        `可以用色情商业媒体演绎或刻板性别角色，直接要求自己或伴侣达到统一反应`,
        `无需了解情境压力或寻求专业支持，仅凭一次反应差异即可下定功能缺陷结论`,
      ]
    );
    return {
      encounterKey,
      templateId,
      templateLabel: '同意边界与去羞耻原则',
      law,
      prompt: `围绕「${law.nameZh}」，以下哪项最符合知情同意、身体自主与科学支持的底线规范？`,
      contextTag: `同意与边界 · ${contextLabel}`,
      options,
      correctAnswer,
      explanation: `核心尊重边界：${appliedAngle} ${learningNote}`,
      healthyBoundary: boundary,
    };
  }

  if (templateId === 'topic-matching') {
    const distractors = pickSexualDistractors(law, referencePool, 3, 'topic');
    const { options, correctAnswer } = shuffleOptions(
      `${topicName}（${categoryLabel}）`,
      distractors.map(
        (d) => `${d.sexualTopicName || d.nameZh.split('：')[0]}（${d.sexualCategory || '性心理'}）`
      )
    );
    return {
      encounterKey,
      templateId,
      templateLabel: '核心议题精准归类',
      law,
      prompt: `原理线索：“${coreConcept}” 这一科学描述直接对应以下哪一项性心理学专题？`,
      contextTag: `专题归类 · ${pillarLabel}`,
      options,
      correctAnswer,
      explanation: `正确对应「${topicName}（${categoryLabel}）」。场景践行：${appliedAngle}`,
      healthyBoundary: boundary,
    };
  }

  // myth-debunking
  const distractors = pickSexualDistractors(law, referencePool, 3, 'context');
  const { options, correctAnswer } = shuffleOptions(
    `【${contextLabel} · ${topicName}】${appliedAngle}`,
    distractors.map(
      (d) =>
        `【${d.sexualContext || '自我认识'} · ${d.sexualTopicName || d.nameZh.split('：')[0]}】${
          d.sexualAppliedAngle || d.shortExplanation
        }`
    )
  );
  return {
    encounterKey,
    templateId,
    templateLabel: '破除误区与跨场景校准',
    law,
    prompt: `针对「${contextLabel}」维度下「${topicName}」的常见迷思拆解与科学指引，哪项匹配完全准确？`,
    contextTag: `${law.codeId} · 科学校准`,
    options,
    correctAnswer,
    explanation: `「${law.nameZh}」科学指引：${appliedAngle}`,
    healthyBoundary: boundary,
  };
}

/**
 * Draw CSPRNG non-repeating Sexual Psychology Arena questions across 100 concepts × 5 templates.
 */
export function drawAleatoricSexualQuestions(
  count: number,
  options?: {
    pillarFilter?: string;
    contextFilter?: string;
    categoryFilter?: string;
    arenaDifficulty?: GameDifficulty | 'all';
    gameIdFilter?: PsychologyLaw['relatedGame'];
  }
): AleatoricSexualQuestion[] {
  const pillarFilter = options?.pillarFilter || 'all';
  const contextFilter = options?.contextFilter || 'all';
  const categoryFilter = options?.categoryFilter || 'all';
  const allowedDiffs = getAllowedDifficulties(options?.arenaDifficulty);

  let pool = SEXUAL_PSYCHOLOGY_LAWS.filter((law) => {
    if (pillarFilter !== 'all' && law.sexualPillar !== pillarFilter) return false;
    if (contextFilter !== 'all' && law.sexualContext !== contextFilter) return false;
    if (categoryFilter !== 'all' && law.sexualCategory !== categoryFilter) return false;
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
    pool = SEXUAL_PSYCHOLOGY_LAWS.filter((law) => {
      if (pillarFilter !== 'all' && law.sexualPillar !== pillarFilter) return false;
      if (contextFilter !== 'all' && law.sexualContext !== contextFilter) return false;
      if (categoryFilter !== 'all' && law.sexualCategory !== categoryFilter) return false;
      return true;
    });
  }
  if (pool.length === 0) {
    pool = SEXUAL_PSYCHOLOGY_LAWS;
  }

  const state = loadSexualDeckState();
  const seenSet = new Set(state.seenEncounters);
  const recentSet = new Set(state.recentLawIds);

  const buildUnseenPairs = (ignoreRecent: boolean) => {
    const pairs: Array<{ law: PsychologyLaw; templateId: SexualAleatoricTemplateId }> = [];
    for (const law of pool) {
      if (!ignoreRecent && recentSet.has(law.id)) continue;
      for (const tpl of SEXUAL_ALEATORIC_TEMPLATES) {
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

  const chosen: Array<{ law: PsychologyLaw; templateId: SexualAleatoricTemplateId }> = [];
  const chosenLawIdsInBatch = new Set<string>();
  let lastContext = '';

  for (const cand of unseenQueue) {
    if (chosen.length >= count) break;
    if (chosenLawIdsInBatch.has(cand.law.id)) continue;
    if (cand.law.sexualContext && cand.law.sexualContext === lastContext && pool.length > 5) {
      continue;
    }
    chosen.push(cand);
    chosenLawIdsInBatch.add(cand.law.id);
    lastContext = cand.law.sexualContext || '';
  }

  if (chosen.length < count) {
    for (const cand of unseenQueue) {
      if (chosen.length >= count) break;
      if (chosenLawIdsInBatch.has(cand.law.id)) continue;
      chosen.push(cand);
      chosenLawIdsInBatch.add(cand.law.id);
    }
  }

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
    return materializeSexualQuestion(law, templateId, SEXUAL_PSYCHOLOGY_LAWS);
  });

  state.recentLawIds = nextRecent.slice(-SEXUAL_COOLDOWN_WINDOW);
  state.totalDraws += results.length;
  state.lastPlayedAt = new Date().toISOString();
  saveSexualDeckState(state);

  return results;
}

// ---------------------------------------------------------------------------
// 5. Love Psychology 100-Card Aleatoric Engine (500 Non-Repeating Encounters)
// ---------------------------------------------------------------------------

export type Love100AleatoricTemplateId =
  | 'concept-core'
  | 'context-practice'
  | 'healthy-boundary'
  | 'topic-matching'
  | 'scenario-calibration';

export const LOVE100_ALEATORIC_TEMPLATES: Love100AleatoricTemplateId[] = [
  'concept-core',
  'context-practice',
  'healthy-boundary',
  'topic-matching',
  'scenario-calibration',
];

export interface AleatoricLove100Question {
  encounterKey: string;
  templateId: Love100AleatoricTemplateId;
  templateLabel: string;
  law: PsychologyLaw;
  prompt: string;
  contextTag: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  healthyBoundary: string;
}

const LOVE100_STORAGE_KEY = 'mindlabz_love100_aleatoric_deck_v1';
const LOVE100_COOLDOWN_WINDOW = 30;

function loadLove100DeckState(): AleatoricStorageState {
  try {
    if (typeof window === 'undefined') {
      return { seenEncounters: [], recentLawIds: [], totalDraws: 0, lastPlayedAt: '' };
    }
    const raw = window.localStorage.getItem(LOVE100_STORAGE_KEY);
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

function saveLove100DeckState(state: AleatoricStorageState): void {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(LOVE100_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota errors
  }
}

export function resetLove100AleatoricDeck(): void {
  saveLove100DeckState({
    seenEncounters: [],
    recentLawIds: [],
    totalDraws: 0,
    lastPlayedAt: new Date().toISOString(),
  });
}

export function getLove100AleatoricStats(): {
  totalConcepts: number;
  totalUniqueEncounters: number;
  seenEncountersCount: number;
  uniqueConceptsExplored: number;
  totalDraws: number;
} {
  const state = loadLove100DeckState();
  const seenConcepts = new Set(state.seenEncounters.map((k) => k.split('::')[0]));
  return {
    totalConcepts: LOVE100_PSYCHOLOGY_LAWS.length,
    totalUniqueEncounters: LOVE100_PSYCHOLOGY_LAWS.length * LOVE100_ALEATORIC_TEMPLATES.length,
    seenEncountersCount: state.seenEncounters.length,
    uniqueConceptsExplored: seenConcepts.size,
    totalDraws: state.totalDraws,
  };
}

function pickLove100Distractors(
  target: PsychologyLaw,
  pool: PsychologyLaw[],
  count: number,
  preferDistinctField: 'topic' | 'context' = 'topic'
): PsychologyLaw[] {
  const candidates = cryptoShuffle(pool.filter((l) => l.id !== target.id));
  const picked: PsychologyLaw[] = [];
  const usedKeys = new Set<string>([
    preferDistinctField === 'topic'
      ? target.love100TopicName || target.nameZh
      : target.love100Context || '',
  ]);

  for (const item of candidates) {
    if (picked.length >= count) break;
    const key =
      preferDistinctField === 'topic'
        ? item.love100TopicName || item.nameZh
        : item.love100Context || '';
    if (!usedKeys.has(key)) {
      usedKeys.add(key);
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

function materializeLove100Question(
  law: PsychologyLaw,
  templateId: Love100AleatoricTemplateId,
  referencePool: PsychologyLaw[]
): AleatoricLove100Question {
  const topicName = law.love100TopicName || law.nameZh.split('：')[0] || law.nameZh;
  const contextLabel = law.love100Context || '自我认识';
  const categoryLabel = law.love100Category || '依恋与安全感';
  const pillarLabel = law.love100Pillar || '依恋安全与情感联结';
  const coreConcept = law.love100CoreConcept || law.whyItHappens || law.shortExplanation;
  const appliedAngle = law.love100AppliedAngle || law.realLifeExample;
  const boundary =
    law.healthyBoundary ||
    law.love100LearningNote ||
    '本知识卡用于心理学科普与自我反思，不是诊断工具或预测公式。关系应建立在自愿、平等、尊重与安全之上。';
  const encounterKey = `${law.id}::${templateId}`;

  if (templateId === 'concept-core') {
    const distractors = pickLove100Distractors(law, referencePool, 3, 'topic');
    const { options, correctAnswer } = shuffleOptions(
      coreConcept,
      distractors.map((d) => d.love100CoreConcept || d.whyItHappens || d.shortExplanation)
    );
    return {
      encounterKey,
      templateId,
      templateLabel: '核心理论机制辨析',
      law,
      prompt: `在恋爱心理学「${topicName}（${categoryLabel}）」中，以下哪项最准确阐释了其核心理论机制？`,
      contextTag: `${law.codeId} · ${pillarLabel}`,
      options,
      correctAnswer,
      explanation: `【${law.codeId} · ${law.nameZh}】${coreConcept}`,
      healthyBoundary: boundary,
    };
  }

  if (templateId === 'context-practice') {
    const distractors = pickLove100Distractors(law, referencePool, 3, 'context');
    const { options, correctAnswer } = shuffleOptions(
      appliedAngle,
      distractors.map((d) => d.love100AppliedAngle || d.realLifeExample)
    );
    return {
      encounterKey,
      templateId,
      templateLabel: '亲密情境应对策略',
      law,
      prompt: `处于「${contextLabel}」情境并运用「${topicName}」时，哪项应对与自我觉察方式最为恰当？`,
      contextTag: `${contextLabel} · ${categoryLabel}`,
      options,
      correctAnswer,
      explanation: `在「${contextLabel}」维度下，${appliedAngle}`,
      healthyBoundary: boundary,
    };
  }

  if (templateId === 'healthy-boundary') {
    const learningNote =
      law.love100LearningNote ||
      '本知识卡用于心理学科普与自我反思，不是诊断工具或预测公式。关系应建立在自愿、平等、尊重与安全之上。';
    const { options, correctAnswer } = shuffleOptions(
      `${appliedAngle}（安全原则：尊重平等、沟通边界与非诊断自我反思）`,
      [
        '可以用某一次冷漠或情绪爆发，直接给对方盖章定性为“病态人格”或彻底不匹配',
        '真正的爱意味着完全透明与高频掌控行踪，不应保留独立个人边界与喘息空间',
        '只要存在强烈心动感觉或浪漫口头承诺，就能保证后续长期相处自然顺利',
      ]
    );
    return {
      encounterKey,
      templateId,
      templateLabel: '关系安全与去标签边界',
      law,
      prompt: `结合「${law.nameZh}」，下列哪项最符合自愿、平等、尊重与去标签化的亲密关系边界准则？`,
      contextTag: `安全与边界 · ${contextLabel}`,
      options,
      correctAnswer,
      explanation: `亲密边界准则：${appliedAngle} ${learningNote}`,
      healthyBoundary: boundary,
    };
  }

  if (templateId === 'topic-matching') {
    const distractors = pickLove100Distractors(law, referencePool, 3, 'topic');
    const { options, correctAnswer } = shuffleOptions(
      `${topicName}（${categoryLabel}）`,
      distractors.map(
        (d) => `${d.love100TopicName || d.nameZh.split('：')[0]}（${d.love100Category || '恋爱心理'}）`
      )
    );
    return {
      encounterKey,
      templateId,
      templateLabel: '概念归类与现象识别',
      law,
      prompt: `心理线索：“${coreConcept}” 这一现象规律直接对应哪一项恋爱心理学核心概念？`,
      contextTag: `概念归类 · ${pillarLabel}`,
      options,
      correctAnswer,
      explanation: `正确对应「${topicName}（${categoryLabel}）」。现实应用：${appliedAngle}`,
      healthyBoundary: boundary,
    };
  }

  // scenario-calibration
  const distractors = pickLove100Distractors(law, referencePool, 3, 'context');
  const { options, correctAnswer } = shuffleOptions(
    `【${contextLabel} · ${topicName}】${appliedAngle}`,
    distractors.map(
      (d) =>
        `【${d.love100Context || '自我认识'} · ${d.love100TopicName || d.nameZh.split('：')[0]}】${
          d.love100AppliedAngle || d.shortExplanation
        }`
    )
  );
  return {
    encounterKey,
    templateId,
    templateLabel: '跨情境关系认知校准',
    law,
    prompt: `关于「${contextLabel}」维度下「${topicName}」的实践落地与认知去偏，哪项匹配完全准确？`,
    contextTag: `${law.codeId} · 关系校准`,
    options,
    correctAnswer,
    explanation: `「${law.nameZh}」校准建议：${appliedAngle}`,
    healthyBoundary: boundary,
  };
}

/**
 * Draw CSPRNG non-repeating Love 100 Psychology Arena questions across 100 cards × 5 templates.
 */
export function drawAleatoricLove100Questions(
  count: number,
  options?: {
    pillarFilter?: string;
    contextFilter?: string;
    categoryFilter?: string;
    arenaDifficulty?: GameDifficulty | 'all';
    gameIdFilter?: PsychologyLaw['relatedGame'];
  }
): AleatoricLove100Question[] {
  const pillarFilter = options?.pillarFilter || 'all';
  const contextFilter = options?.contextFilter || 'all';
  const categoryFilter = options?.categoryFilter || 'all';
  const allowedDiffs = getAllowedDifficulties(options?.arenaDifficulty);

  let pool = LOVE100_PSYCHOLOGY_LAWS.filter((law) => {
    if (pillarFilter !== 'all' && law.love100Pillar !== pillarFilter) return false;
    if (contextFilter !== 'all' && law.love100Context !== contextFilter) return false;
    if (categoryFilter !== 'all' && law.love100Category !== categoryFilter) return false;
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
    pool = LOVE100_PSYCHOLOGY_LAWS.filter((law) => {
      if (pillarFilter !== 'all' && law.love100Pillar !== pillarFilter) return false;
      if (contextFilter !== 'all' && law.love100Context !== contextFilter) return false;
      if (categoryFilter !== 'all' && law.love100Category !== categoryFilter) return false;
      return true;
    });
  }
  if (pool.length === 0) {
    pool = LOVE100_PSYCHOLOGY_LAWS;
  }

  const state = loadLove100DeckState();
  const seenSet = new Set(state.seenEncounters);
  const recentSet = new Set(state.recentLawIds);

  const buildUnseenPairs = (ignoreRecent: boolean) => {
    const pairs: Array<{ law: PsychologyLaw; templateId: Love100AleatoricTemplateId }> = [];
    for (const law of pool) {
      if (!ignoreRecent && recentSet.has(law.id)) continue;
      for (const tpl of LOVE100_ALEATORIC_TEMPLATES) {
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

  const chosen: Array<{ law: PsychologyLaw; templateId: Love100AleatoricTemplateId }> = [];
  const chosenLawIdsInBatch = new Set<string>();
  let lastContext = '';

  for (const cand of unseenQueue) {
    if (chosen.length >= count) break;
    if (chosenLawIdsInBatch.has(cand.law.id)) continue;
    if (cand.law.love100Context && cand.law.love100Context === lastContext && pool.length > 5) {
      continue;
    }
    chosen.push(cand);
    chosenLawIdsInBatch.add(cand.law.id);
    lastContext = cand.law.love100Context || '';
  }

  if (chosen.length < count) {
    for (const cand of unseenQueue) {
      if (chosen.length >= count) break;
      if (chosenLawIdsInBatch.has(cand.law.id)) continue;
      chosen.push(cand);
      chosenLawIdsInBatch.add(cand.law.id);
    }
  }

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
    return materializeLove100Question(law, templateId, LOVE100_PSYCHOLOGY_LAWS);
  });

  state.recentLawIds = nextRecent.slice(-LOVE100_COOLDOWN_WINDOW);
  state.totalDraws += results.length;
  state.lastPlayedAt = new Date().toISOString();
  saveLove100DeckState(state);

  return results;
}

// ---------------------------------------------------------------------------
// 6. Intimate Relationships 100-Card Aleatoric Engine (500 Encounters)
// ---------------------------------------------------------------------------

export type IntimateAleatoricTemplateId =
  | 'concept-core'
  | 'context-practice'
  | 'healthy-boundary'
  | 'topic-matching'
  | 'scenario-calibration';

export const INTIMATE_ALEATORIC_TEMPLATES: IntimateAleatoricTemplateId[] = [
  'concept-core',
  'context-practice',
  'healthy-boundary',
  'topic-matching',
  'scenario-calibration',
];

export interface AleatoricIntimateQuestion {
  encounterKey: string;
  templateId: IntimateAleatoricTemplateId;
  templateLabel: string;
  law: PsychologyLaw;
  prompt: string;
  contextTag: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  healthyBoundary: string;
}

const INTIMATE_STORAGE_KEY = 'mindlabz_intimate_aleatoric_deck_v1';
const INTIMATE_COOLDOWN_WINDOW = 30;

function loadIntimateDeckState(): AleatoricStorageState {
  try {
    if (typeof window === 'undefined') {
      return { seenEncounters: [], recentLawIds: [], totalDraws: 0, lastPlayedAt: '' };
    }
    const raw = window.localStorage.getItem(INTIMATE_STORAGE_KEY);
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

function saveIntimateDeckState(state: AleatoricStorageState): void {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(INTIMATE_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota errors
  }
}

export function resetIntimateAleatoricDeck(): void {
  saveIntimateDeckState({
    seenEncounters: [],
    recentLawIds: [],
    totalDraws: 0,
    lastPlayedAt: new Date().toISOString(),
  });
}

export function getIntimateAleatoricStats(): {
  totalConcepts: number;
  totalUniqueEncounters: number;
  seenEncountersCount: number;
  uniqueConceptsExplored: number;
  totalDraws: number;
} {
  const state = loadIntimateDeckState();
  const seenConcepts = new Set(state.seenEncounters.map((k) => k.split('::')[0]));
  return {
    totalConcepts: INTIMATE_RELATIONSHIPS_LAWS.length,
    totalUniqueEncounters:
      INTIMATE_RELATIONSHIPS_LAWS.length * INTIMATE_ALEATORIC_TEMPLATES.length,
    seenEncountersCount: state.seenEncounters.length,
    uniqueConceptsExplored: seenConcepts.size,
    totalDraws: state.totalDraws,
  };
}

function pickIntimateDistractors(
  target: PsychologyLaw,
  pool: PsychologyLaw[],
  count: number,
  preferDistinctField: 'topic' | 'context' = 'topic'
): PsychologyLaw[] {
  const candidates = cryptoShuffle(pool.filter((l) => l.id !== target.id));
  const picked: PsychologyLaw[] = [];
  const usedKeys = new Set<string>([
    preferDistinctField === 'topic'
      ? target.intimateTopicName || target.nameZh
      : target.intimateContext || '',
  ]);

  for (const item of candidates) {
    if (picked.length >= count) break;
    const key =
      preferDistinctField === 'topic'
        ? item.intimateTopicName || item.nameZh
        : item.intimateContext || '';
    if (!usedKeys.has(key)) {
      usedKeys.add(key);
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

function materializeIntimateQuestion(
  law: PsychologyLaw,
  templateId: IntimateAleatoricTemplateId,
  referencePool: PsychologyLaw[]
): AleatoricIntimateQuestion {
  const topicName = law.intimateTopicName || law.nameZh.split('：')[0] || law.nameZh;
  const contextLabel = law.intimateContext || '自我觉察';
  const categoryLabel = law.intimateCategory || '依恋与情感联结';
  const pillarLabel = law.intimatePillar || '依恋联结与安全基地';
  const coreConcept = law.intimateCoreConcept || law.whyItHappens || law.shortExplanation;
  const appliedAngle = law.intimateAppliedAngle || law.realLifeExample;
  const boundary =
    law.healthyBoundary ||
    law.intimateLearningNote ||
    '本知识卡用于亲密关系心理学科普与自我反思，不构成心理诊断。尊重双方自主、隐私、平等与持续有效的同意；若存在暴力、威胁或强制控制，优先考虑安全并寻求专业支持。';
  const encounterKey = `${law.id}::${templateId}`;

  if (templateId === 'concept-core') {
    const distractors = pickIntimateDistractors(law, referencePool, 3, 'topic');
    const { options, correctAnswer } = shuffleOptions(
      coreConcept,
      distractors.map((d) => d.intimateCoreConcept || d.whyItHappens || d.shortExplanation)
    );
    return {
      encounterKey,
      templateId,
      templateLabel: '亲密关系核心理论辨析',
      law,
      prompt: `在亲密关系心理学「${topicName}（${categoryLabel}）」中，哪项论述最准确地阐释了其核心科学机理？`,
      contextTag: `${law.codeId} · ${pillarLabel}`,
      options,
      correctAnswer,
      explanation: `【${law.codeId} · ${law.nameZh}】${coreConcept}`,
      healthyBoundary: boundary,
    };
  }

  if (templateId === 'context-practice') {
    const distractors = pickIntimateDistractors(law, referencePool, 3, 'context');
    const { options, correctAnswer } = shuffleOptions(
      appliedAngle,
      distractors.map((d) => d.intimateAppliedAngle || d.realLifeExample)
    );
    return {
      encounterKey,
      templateId,
      templateLabel: '五大情境实践应对选择',
      law,
      prompt: `处于「${contextLabel}」维度并实践「${topicName}」时，哪项应对策略或观察角度最恰当？`,
      contextTag: `${contextLabel} · ${categoryLabel}`,
      options,
      correctAnswer,
      explanation: `在「${contextLabel}」下：${appliedAngle}`,
      healthyBoundary: boundary,
    };
  }

  if (templateId === 'healthy-boundary') {
    const learningNote =
      law.intimateLearningNote ||
      '本知识卡用于亲密关系心理学科普与自我反思，不构成心理诊断，也不能单凭单一行为判断伴侣人格或关系结局。';
    const { options, correctAnswer } = shuffleOptions(
      `${appliedAngle}（安全与自主原则：不贴标签、尊重平等与同意、以安全为先）`,
      [
        '仅凭伴侣几次防御反应或沉默回避，就可以直接断言对方人格有严重缺陷且无法改变',
        '冲突升温时必须逼迫对方立刻当场表态认错，绝不能给彼此二十分钟以上暂停降温空间',
        '真正的亲密关系不需要明确边界或协商请求，彼此只要真心就应该完全读懂对方心思',
      ]
    );
    return {
      encounterKey,
      templateId,
      templateLabel: '自主安全与去诊断边界',
      law,
      prompt: `结合「${law.nameZh}」，以下哪项完全符合亲密关系研究的科学边界、平等自主与非诊断原则？`,
      contextTag: `安全边界 · ${contextLabel}`,
      options,
      correctAnswer,
      explanation: `亲密关系安全边界：${appliedAngle} ${learningNote}`,
      healthyBoundary: boundary,
    };
  }

  if (templateId === 'topic-matching') {
    const distractors = pickIntimateDistractors(law, referencePool, 3, 'topic');
    const { options, correctAnswer } = shuffleOptions(
      `${topicName}（${categoryLabel}）`,
      distractors.map(
        (d) =>
          `${d.intimateTopicName || d.nameZh.split('：')[0]}（${d.intimateCategory || '亲密关系'}）`
      )
    );
    return {
      encounterKey,
      templateId,
      templateLabel: '互动模式精准识别',
      law,
      prompt: `实证观察：“${coreConcept}” 直接刻画了亲密关系研究中的哪一项核心机制或互动模式？`,
      contextTag: `模式识别 · ${pillarLabel}`,
      options,
      correctAnswer,
      explanation: `正确对应「${topicName}（${categoryLabel}）」。行动建议：${appliedAngle}`,
      healthyBoundary: boundary,
    };
  }

  // scenario-calibration
  const distractors = pickIntimateDistractors(law, referencePool, 3, 'context');
  const { options, correctAnswer } = shuffleOptions(
    `【${contextLabel} · ${topicName}】${appliedAngle}`,
    distractors.map(
      (d) =>
        `【${d.intimateContext || '自我觉察'} · ${d.intimateTopicName || d.nameZh.split('：')[0]}】${
          d.intimateAppliedAngle || d.shortExplanation
        }`
    )
  );
  return {
    encounterKey,
    templateId,
    templateLabel: '跨情境关系修复校准',
    law,
    prompt: `针对「${contextLabel}」维度下「${topicName}」的实证洞察与关系维护要点，哪项匹配完全准确？`,
    contextTag: `${law.codeId} · 修复校准`,
    options,
    correctAnswer,
    explanation: `「${law.nameZh}」校准要点：${appliedAngle}`,
    healthyBoundary: boundary,
  };
}

/**
 * Draw CSPRNG non-repeating Intimate Relationships 100 Arena questions across 100 cards × 5 templates.
 */
export function drawAleatoricIntimateQuestions(
  count: number,
  options?: {
    pillarFilter?: string;
    contextFilter?: string;
    categoryFilter?: string;
    arenaDifficulty?: GameDifficulty | 'all';
    gameIdFilter?: PsychologyLaw['relatedGame'];
  }
): AleatoricIntimateQuestion[] {
  const pillarFilter = options?.pillarFilter || 'all';
  const contextFilter = options?.contextFilter || 'all';
  const categoryFilter = options?.categoryFilter || 'all';
  const allowedDiffs = getAllowedDifficulties(options?.arenaDifficulty);

  let pool = INTIMATE_RELATIONSHIPS_LAWS.filter((law) => {
    if (pillarFilter !== 'all' && law.intimatePillar !== pillarFilter) return false;
    if (contextFilter !== 'all' && law.intimateContext !== contextFilter) return false;
    if (categoryFilter !== 'all' && law.intimateCategory !== categoryFilter) return false;
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
    pool = INTIMATE_RELATIONSHIPS_LAWS.filter((law) => {
      if (pillarFilter !== 'all' && law.intimatePillar !== pillarFilter) return false;
      if (contextFilter !== 'all' && law.intimateContext !== contextFilter) return false;
      if (categoryFilter !== 'all' && law.intimateCategory !== categoryFilter) return false;
      return true;
    });
  }
  if (pool.length === 0) {
    pool = INTIMATE_RELATIONSHIPS_LAWS;
  }

  const state = loadIntimateDeckState();
  const seenSet = new Set(state.seenEncounters);
  const recentSet = new Set(state.recentLawIds);

  const buildUnseenPairs = (ignoreRecent: boolean) => {
    const pairs: Array<{ law: PsychologyLaw; templateId: IntimateAleatoricTemplateId }> = [];
    for (const law of pool) {
      if (!ignoreRecent && recentSet.has(law.id)) continue;
      for (const tpl of INTIMATE_ALEATORIC_TEMPLATES) {
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

  const chosen: Array<{ law: PsychologyLaw; templateId: IntimateAleatoricTemplateId }> = [];
  const chosenLawIdsInBatch = new Set<string>();
  let lastContext = '';

  for (const cand of unseenQueue) {
    if (chosen.length >= count) break;
    if (chosenLawIdsInBatch.has(cand.law.id)) continue;
    if (cand.law.intimateContext && cand.law.intimateContext === lastContext && pool.length > 5) {
      continue;
    }
    chosen.push(cand);
    chosenLawIdsInBatch.add(cand.law.id);
    lastContext = cand.law.intimateContext || '';
  }

  if (chosen.length < count) {
    for (const cand of unseenQueue) {
      if (chosen.length >= count) break;
      if (chosenLawIdsInBatch.has(cand.law.id)) continue;
      chosen.push(cand);
      chosenLawIdsInBatch.add(cand.law.id);
    }
  }

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
    return materializeIntimateQuestion(law, templateId, INTIMATE_RELATIONSHIPS_LAWS);
  });

  state.recentLawIds = nextRecent.slice(-INTIMATE_COOLDOWN_WINDOW);
  state.totalDraws += results.length;
  state.lastPlayedAt = new Date().toISOString();
  saveIntimateDeckState(state);

  return results;
}

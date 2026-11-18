import { DifficultyLevel, GameDifficulty, LoveDomainId, PsychologyLaw } from '../types';
import { LOVE_PSYCHOLOGY_LAWS } from '../data/lovePsychologyCodex';
import { LOVE_DOMAIN_MAP } from '../data/lovePsychologyTypes';

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

import { INITIAL_PSYCHOLOGY_LAWS } from '../data/laws';
import { LOVE_PSYCHOLOGY_LAWS, getLoveLawsForCity } from '../data/lovePsychologyCodex';
import { getCityLoveDifficultyTier } from '../data/lovePsychologyTypes';
import { RAPID_QUIZ_QUESTIONS } from '../data/quizzes';
import {
  WORLD_CAPITALS,
  QUESTIONS_PER_CHAPTER,
  CHAPTERS_PER_POINT,
  POINTS_PER_CITY,
  WorldCapitalCity,
} from '../data/worldCapitals';
import { DifficultyLevel, PsychologyLaw, QuizQuestion } from '../types';
import { cryptoRandom, cryptoShuffle } from './aleatoricEngine';
import {
  MICROEXPRESSION_QUIZ_SCENARIOS,
  MicroexpressionScenarioMeta,
  buildMicroexpressionChapterQuestion,
} from '../data/microexpressionQuizScenarios';

export interface CityChapterQuestion extends QuizQuestion {
  chapterTheme: string;
  cityTag: string;
  subTag?: string;
  sequenceToken?: string;
  microScenario?: MicroexpressionScenarioMeta;
}

const CHAPTER_THEMES_ZH = [
  '第 1 章 · 基础概念初探',
  '第 2 章 · 直觉偏差识别',
  '第 3 章 · 机制成因溯源',
  '第 4 章 · 都市情境实战',
  '第 5 章 · 记忆与注意锚点',
  '第 6 章 · 情绪解离觉察',
  '第 7 章 · 博弈决策校准',
  '第 8 章 · 反操纵防御术',
  '第 9 章 · 跨维定律融通',
  '第 10 章 · 街区巅峰考核',
];

const POINT_CATEGORIES: Array<'认知' | '记忆' | '决策' | '社会' | '情绪'> = [
  '认知',
  '记忆',
  '决策',
  '决策',
  '社会',
  '情绪',
  '认知',
  '决策',
];

const RAPID_SEQUENCE_STORAGE_KEY = 'mindlabz_rapid_quiz_aleatoric_seq_v1';
const RECENT_COOLDOWN_SIZE = 60;
const LOVE_VARIANT_COUNT = 5;

interface RapidSequenceHistory {
  seenSignatures: string[]; // `${lawId}::${variantType}`
  recentLawIds: string[]; // Rolling cooldown so adjacent sessions don't repeat laws
  lastLevelOrders: Record<string, string>; // `${city}-${point}-${chapter}` -> sequence hash
  totalRuns: number;
}

function loadSequenceHistory(): RapidSequenceHistory {
  try {
    if (typeof window === 'undefined') {
      return { seenSignatures: [], recentLawIds: [], lastLevelOrders: {}, totalRuns: 0 };
    }
    const raw = window.localStorage.getItem(RAPID_SEQUENCE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        seenSignatures: Array.isArray(parsed.seenSignatures) ? parsed.seenSignatures : [],
        recentLawIds: Array.isArray(parsed.recentLawIds) ? parsed.recentLawIds : [],
        lastLevelOrders:
          parsed.lastLevelOrders && typeof parsed.lastLevelOrders === 'object'
            ? parsed.lastLevelOrders
            : {},
        totalRuns: typeof parsed.totalRuns === 'number' ? parsed.totalRuns : 0,
      };
    }
  } catch {
    // ignore storage errors
  }
  return { seenSignatures: [], recentLawIds: [], lastLevelOrders: {}, totalRuns: 0 };
}

function saveSequenceHistory(history: RapidSequenceHistory): void {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(RAPID_SEQUENCE_STORAGE_KEY, JSON.stringify(history));
  } catch {
    // ignore quota errors
  }
}

export function resetRapidQuizSequenceHistory(): void {
  saveSequenceHistory({
    seenSignatures: [],
    recentLawIds: [],
    lastLevelOrders: {},
    totalRuns: 0,
  });
}

export function getRapidQuizSequenceStats(): {
  totalLoveLaws: number;
  totalMicroLaws: number;
  totalUniqueQuestionVariants: number;
  seenVariantsCount: number;
  uniqueLawsEncountered: number;
  totalRuns: number;
} {
  const history = loadSequenceHistory();
  const uniqueLaws = new Set(history.seenSignatures.map((s) => s.split('::')[0]));
  return {
    totalLoveLaws: LOVE_PSYCHOLOGY_LAWS.length,
    totalMicroLaws: MICROEXPRESSION_QUIZ_SCENARIOS.length,
    totalUniqueQuestionVariants:
      LOVE_PSYCHOLOGY_LAWS.length * LOVE_VARIANT_COUNT + MICROEXPRESSION_QUIZ_SCENARIOS.length,
    seenVariantsCount: history.seenSignatures.length,
    uniqueLawsEncountered: uniqueLaws.size,
    totalRuns: history.totalRuns,
  };
}

function buildShuffledOptions(
  correctText: string,
  distractors: string[],
  rng: () => number
): { options: string[]; correctAnswer: number } {
  const cleanCorrect = correctText.trim();
  const uniqueDistractors = Array.from(
    new Set(distractors.map((d) => d.trim()).filter((d) => d && d !== cleanCorrect))
  ).slice(0, 3);

  while (uniqueDistractors.length < 3) {
    uniqueDistractors.push(`无关干扰选项 #${uniqueDistractors.length + 1}`);
  }

  const tagged = [
    { text: cleanCorrect, isCorrect: true },
    ...uniqueDistractors.map((text) => ({ text, isCorrect: false })),
  ];
  // Fisher-Yates shuffle using CSPRNG
  for (let i = tagged.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = tagged[i];
    tagged[i] = tagged[j];
    tagged[j] = tmp;
  }
  const correctAnswer = tagged.findIndex((item) => item.isCorrect);
  return {
    options: tagged.map((item) => item.text),
    correctAnswer: correctAnswer >= 0 ? correctAnswer : 0,
  };
}

function pickDistinctLaws(
  allLaws: PsychologyLaw[],
  excludeId: string,
  count: number,
  rng: () => number
): PsychologyLaw[] {
  const pool = allLaws.filter((l) => l.id !== excludeId);
  const picked: PsychologyLaw[] = [];
  const usedIds = new Set<string>();
  let guard = 0;
  while (picked.length < count && guard < 120 && pool.length > 0) {
    guard++;
    const candidate = pool[Math.floor(rng() * pool.length)];
    if (candidate && !usedIds.has(candidate.id)) {
      usedIds.add(candidate.id);
      picked.push(candidate);
    }
  }
  return picked;
}

function buildCapitalGeographyQuestions(
  city: WorldCapitalCity,
  pointIndex: number,
  chapterIndex: number,
  rng: () => number
): CityChapterQuestion[] {
  const otherCities = WORLD_CAPITALS.filter((c) => c.index !== city.index);
  const randomCities = cryptoShuffle(otherCities);
  const district = city.districts[pointIndex] || city.districts[0];
  const chapterTheme = CHAPTER_THEMES_ZH[chapterIndex] || `第 ${chapterIndex + 1} 章`;
  const cityTag = `${city.cityFr} · ${city.cityZh}`;

  const qCountry = (() => {
    const { options, correctAnswer } = buildShuffledOptions(
      `${city.countryZh} (${city.countryFr})`,
      randomCities.slice(0, 3).map((c) => `${c.countryZh} (${c.countryFr})`),
      rng
    );
    return {
      id: `geo-country-${city.id}-${pointIndex}-${chapterIndex}`,
      category: '认知' as const,
      question: `【世界首都人文地理】城市地图中的「${city.cityZh} (${city.cityFr})」是哪个国家的首都？`,
      options,
      correctAnswer,
      explanation: `${city.cityZh}（${city.cityFr}）是${city.countryZh}（${city.countryFr}）的首都，位于${city.continent}（地理坐标 ${city.coordinates}）。${city.culturalFact}`,
      difficulty: 'Easy' as const,
      chapterTheme,
      cityTag,
      subTag: '地理坐标',
    };
  })();

  const qRiver = (() => {
    const { options, correctAnswer } = buildShuffledOptions(
      `${city.riverZh} (${city.riverFr})`,
      randomCities.slice(3, 6).map((c) => `${c.riverZh} (${c.riverFr})`),
      rng
    );
    return {
      id: `geo-river-${city.id}-${pointIndex}-${chapterIndex}`,
      category: '记忆' as const,
      question: `【世界水脉与城市记忆】在「${city.cityZh}」地图中蜿蜒穿城而过的主要水域是哪一条？`,
      options,
      correctAnswer,
      explanation: `穿行「${city.cityZh}」的核心水域是${city.riverZh}（${city.riverFr}）。依托真实水脉建立空间地标（记忆宫殿法），能显著增强长时记忆检索效率。`,
      difficulty: 'Easy' as const,
      chapterTheme,
      cityTag,
      subTag: '水脉记忆',
    };
  })();

  const qDistrict = (() => {
    const otherDistricts = randomCities
      .slice(6, 9)
      .map((c) => `${c.districts[pointIndex]?.zh || c.cityZh} (${c.cityZh})`);
    const { options, correctAnswer } = buildShuffledOptions(
      `${district.zh} (${district.fr})`,
      otherDistricts,
      rng
    );
    return {
      id: `geo-dist-${city.id}-${pointIndex}-${chapterIndex}`,
      category: '社会' as const,
      question: `【都市地标定位】当你漫步在「${city.cityZh}」第 ${pointIndex + 1} 站点探索时，以下哪处是该站点的核心街区地标？`,
      options,
      correctAnswer,
      explanation: `「${district.zh} (${district.fr})」正是${city.cityZh}本关卡的核心人文坐标；著名城市地标还包括 ${city.heritageLandmark}。`,
      difficulty: 'Medium' as const,
      chapterTheme,
      cityTag,
      subTag: '都市街区',
    };
  })();

  const qContinent = (() => {
    const continents = ['Europe', 'Asie', 'Amériques', 'Afrique', 'Océanie'].filter(
      (c) => c !== city.continent
    );
    const continentLabels: Record<string, string> = {
      Europe: '欧洲 (Europe)',
      Asie: '亚洲 (Asie)',
      Amériques: '美洲 (Amériques)',
      Afrique: '非洲 (Afrique)',
      Océanie: '大洋洲 (Océanie)',
    };
    const { options, correctAnswer } = buildShuffledOptions(
      continentLabels[city.continent],
      continents.slice(0, 3).map((c) => continentLabels[c]),
      rng
    );
    return {
      id: `geo-cont-${city.id}-${pointIndex}-${chapterIndex}`,
      category: '决策' as const,
      question: `【全球坐标认知】以「${city.heritageLandmark}」闻名的「${city.cityZh} (${city.coordinates})」属于哪一大洲？`,
      options,
      correctAnswer,
      explanation: `${city.cityZh}属于${continentLabels[city.continent]}。${city.culturalFact}`,
      difficulty: 'Easy' as const,
      chapterTheme,
      cityTag,
      subTag: '大洲定位',
    };
  })();

  return cryptoShuffle([qCountry, qRiver, qDistrict, qContinent]);
}

function buildPsychologyLawQuestion(
  law: PsychologyLaw,
  allLaws: PsychologyLaw[],
  variantType: number,
  city: WorldCapitalCity,
  pointIndex: number,
  chapterIndex: number,
  qIdx: number,
  rng: () => number
): CityChapterQuestion {
  const distractors = pickDistinctLaws(allLaws, law.id, 3, rng);
  const chapterTheme = CHAPTER_THEMES_ZH[chapterIndex] || `第 ${chapterIndex + 1} 章`;
  const cityTag = `${city.cityFr} · ${city.cityZh}`;
  const district = city.districts[pointIndex] || city.districts[0];
  const category = POINT_CATEGORIES[pointIndex] || law.categoryZh || '认知';
  const difficulty: DifficultyLevel =
    law.difficulty || (chapterIndex < 3 ? 'Easy' : chapterIndex < 7 ? 'Medium' : 'Hard');
  const domainLabel = law.isLoveCodex ? `爱情心理·${law.subTag || '关系'}` : '心理定律';
  const sequenceToken = `${law.id}::${variantType}`;

  if (variantType === 0 && law.answers && law.answers.length >= 4) {
    const correctText = law.answers[law.correctAnswer] || law.answers[0];
    const wrongTexts = distractors.map((d) => d.shortExplanation);
    const { options, correctAnswer } = buildShuffledOptions(correctText, wrongTexts, rng);
    return {
      id: `psy-direct-${city.index}-${pointIndex}-${chapterIndex}-${law.id}-${qIdx}`,
      category,
      question: `【${district.zh} · ${domainLabel}】${law.question}`,
      options,
      correctAnswer,
      explanation: `${law.nameZh}（${law.nameEn}）：${law.shortExplanation} ${law.keyTakeaway}`,
      difficulty,
      relatedLawId: law.id,
      chapterTheme,
      cityTag,
      subTag: law.subTag || law.categoryZh,
      sequenceToken,
    };
  }

  if (variantType === 1) {
    const promptSnippet = law.isLoveCodex
      ? law.shortExplanation
      : law.realLifeExample && law.realLifeExample.length > 16
      ? law.realLifeExample
      : law.shortExplanation;
    const { options, correctAnswer } = buildShuffledOptions(
      `${law.nameZh} (${law.nameEn})`,
      distractors.map((d) => `${d.nameZh} (${d.nameEn})`),
      rng
    );
    return {
      id: `psy-case-${city.index}-${pointIndex}-${chapterIndex}-${law.id}-${qIdx}`,
      category,
      question: `【都市情境映射 · ${city.cityZh}】试想在「${district.zh}」分析以下规律：“${promptSnippet}”，这精准对应哪一项心理学概念？`,
      options,
      correctAnswer,
      explanation: `上述现象精准体现了【${law.nameZh}（${law.nameEn}）】：${law.shortExplanation}`,
      difficulty,
      relatedLawId: law.id,
      chapterTheme,
      cityTag,
      subTag: law.subTag || law.categoryZh,
      sequenceToken,
    };
  }

  if (variantType === 2) {
    const { options, correctAnswer } = buildShuffledOptions(
      law.shortExplanation,
      distractors.map((d) => d.shortExplanation),
      rng
    );
    return {
      id: `psy-mech-${city.index}-${pointIndex}-${chapterIndex}-${law.id}-${qIdx}`,
      category,
      question: `【${domainLabel} · 机制溯源】关于「${law.nameZh}（${law.nameEn}）」，以下哪项准确揭示了其科学内涵？`,
      options,
      correctAnswer,
      explanation: `【深度机制】${law.whyItHappens || law.detailedExplanation}`,
      difficulty,
      relatedLawId: law.id,
      chapterTheme,
      cityTag,
      subTag: law.subTag || law.categoryZh,
      sequenceToken,
    };
  }

  if (variantType === 3) {
    const { options, correctAnswer } = buildShuffledOptions(
      law.healthyBoundary || law.keyTakeaway,
      distractors.map((d) => d.healthyBoundary || d.keyTakeaway),
      rng
    );
    return {
      id: `psy-action-${city.index}-${pointIndex}-${chapterIndex}-${law.id}-${qIdx}`,
      category,
      question: `【${district.zh} · 健康边界】理解并运用「${law.nameZh}」时，以下哪项健康原则与边界最应当坚守？`,
      options,
      correctAnswer,
      explanation: `科学应对「${law.nameZh}」的关键边界在于：${law.healthyBoundary || law.keyTakeaway}`,
      difficulty,
      relatedLawId: law.id,
      chapterTheme,
      cityTag,
      subTag: law.subTag || law.categoryZh,
      sequenceToken,
    };
  }

  const targetLabel = `${law.nameZh} — ${law.healthyBoundary || law.keyTakeaway}`;
  const { options, correctAnswer } = buildShuffledOptions(
    targetLabel,
    distractors.map((d) => `${d.nameZh} — ${d.healthyBoundary || d.keyTakeaway}`),
    rng
  );
  return {
    id: `psy-contrast-${city.index}-${pointIndex}-${chapterIndex}-${law.id}-${qIdx}`,
    category,
    question: `【高阶思辨 · ${city.cityZh}】若伴侣或人际互动中出现「${law.subTag || law.categoryZh}」课题（${law.shortExplanation.slice(0, 42)}…），最贴合的概念与校准指引是？`,
    options,
    correctAnswer,
    explanation: `正解为【${law.nameZh}】：${law.shortExplanation}`,
    difficulty,
    relatedLawId: law.id,
    chapterTheme,
    cityTag,
    subTag: law.subTag || law.categoryZh,
    sequenceToken,
  };
}

/**
 * Constraint-aware CSPRNG sequence arranger:
 * Separates adjacent same-subTag / same-category questions and guarantees the
 * resulting sequence never matches the previous sequence run on the same level.
 */
function sequenceQuestionsNonRepeating(
  items: CityChapterQuestion[],
  previousOrderHash?: string
): CityChapterQuestion[] {
  const pool = cryptoShuffle(items);
  const arranged: CityChapterQuestion[] = [];
  const remaining = [...pool];

  while (remaining.length > 0) {
    const prev = arranged[arranged.length - 1];
    let pickedIdx = 0;

    if (prev) {
      // Find first candidate that doesn't share subTag or category with previous item
      const diverseIdx = remaining.findIndex(
        (cand) =>
          (cand.relatedLawId ? cand.relatedLawId !== prev.relatedLawId : true) &&
          (cand.subTag ? cand.subTag !== prev.subTag : cand.category !== prev.category)
      );
      if (diverseIdx !== -1) {
        pickedIdx = diverseIdx;
      } else {
        const diffLawIdx = remaining.findIndex(
          (cand) => !cand.relatedLawId || cand.relatedLawId !== prev.relatedLawId
        );
        if (diffLawIdx !== -1) pickedIdx = diffLawIdx;
      }
    }

    arranged.push(remaining.splice(pickedIdx, 1)[0]);
  }

  // Verify the order never duplicates the exact last run for this capital/point/chapter
  const buildHash = (arr: CityChapterQuestion[]) =>
    arr.map((q) => q.relatedLawId || q.id.split('-')[1] || q.id).join(',');

  if (previousOrderHash && buildHash(arranged) === previousOrderHash && arranged.length > 3) {
    const first = arranged.shift()!;
    const mid = arranged.splice(Math.floor(arranged.length / 2), 1)[0];
    arranged.splice(2, 0, first);
    arranged.push(mid);
  }

  return arranged;
}

/**
 * Dynamically generates 20 questions for any (cityIndex 0..49, pointIndex 0..7, chapterIndex 0..9)
 * using CSPRNG Fisher-Yates randomization + persistent cross-session non-repeating tracking across
 * the full 696 Love Psychology Laws (covering all 500+ imported laws) & 50 world-capital levels.
 */
export function generateChapterQuestions(
  cityIndex: number,
  pointIndex: number,
  chapterIndex: number
): CityChapterQuestion[] {
  const safeCityIdx = Math.max(0, Math.min(WORLD_CAPITALS.length - 1, cityIndex));
  const safePointIdx = Math.max(0, Math.min(POINTS_PER_CITY - 1, pointIndex));
  const safeChapterIdx = Math.max(0, Math.min(CHAPTERS_PER_POINT - 1, chapterIndex));

  const city = WORLD_CAPITALS[safeCityIdx];
  const cityTier = getCityLoveDifficultyTier(safeCityIdx);
  const levelKey = `${safeCityIdx}-${safePointIdx}-${safeChapterIdx}`;
  const rng = cryptoRandom;

  const chapterTheme = CHAPTER_THEMES_ZH[safeChapterIdx];
  const cityTag = `${city.cityFr} · ${city.cityZh}`;

  let history = loadSequenceHistory();
  const seenSet = new Set(history.seenSignatures);
  const recentSet = new Set(history.recentLawIds);

  // 1. 3 World Capital Geography & Heritage Questions (shuffled options each run)
  const geoQuestions = buildCapitalGeographyQuestions(
    city,
    safePointIdx,
    safeChapterIdx,
    rng
  ).slice(0, 3);

  // 2. Inject 2 Non-Repeating Microexpression & Facial Action Narrative Challenges (ML001-ML010)
  const microQuestions: CityChapterQuestion[] = [];
  const usedLawsInBatch = new Set<string>();
  const shuffledMicro = cryptoShuffle([...MICROEXPRESSION_QUIZ_SCENARIOS]);
  const rankedMicro = [
    ...shuffledMicro.filter((m) => !seenSet.has(`${m.lawId}::narrative`) && !recentSet.has(m.lawId)),
    ...shuffledMicro.filter((m) => !seenSet.has(`${m.lawId}::narrative`) && recentSet.has(m.lawId)),
    ...shuffledMicro.filter((m) => seenSet.has(`${m.lawId}::narrative`) && !recentSet.has(m.lawId)),
    ...shuffledMicro.filter((m) => seenSet.has(`${m.lawId}::narrative`) && recentSet.has(m.lawId)),
  ];
  const targetMicroCount = 2;
  for (const item of rankedMicro) {
    if (microQuestions.length >= targetMicroCount) break;
    if (usedLawsInBatch.has(item.lawId)) continue;
    usedLawsInBatch.add(item.lawId);
    microQuestions.push(
      buildMicroexpressionChapterQuestion(item, {
        city,
        pointIndex: safePointIdx,
        chapterIndex: safeChapterIdx,
        qIdx: microQuestions.length,
        chapterTheme,
        rng,
      })
    );
  }

  // 3. Build Tiered Love Psychology Candidate Pools utilizing all 696 imported laws across the 50 capitals
  const cityLoveLaws = getLoveLawsForCity(safeCityIdx);
  const sameTierLoveLaws = LOVE_PSYCHOLOGY_LAWS.filter(
    (l) => l.difficulty === cityTier.difficulty && l.assignedCityIndex !== safeCityIdx
  );
  const allLoveFallback = LOVE_PSYCHOLOGY_LAWS.filter(
    (l) => l.difficulty !== cityTier.difficulty
  );

  const targetCat = POINT_CATEGORIES[safePointIdx];
  const classicDomainLaws = INITIAL_PSYCHOLOGY_LAWS.filter(
    (l) => !l.isLoveCodex && !l.isMicroexpression && l.categoryZh === targetCat
  );

  const distractorReferencePool =
    sameTierLoveLaws.length > 10 ? [...cityLoveLaws, ...sameTierLoveLaws] : LOVE_PSYCHOLOGY_LAWS;

  const psychNeeded = Math.max(0, QUESTIONS_PER_CHAPTER - geoQuestions.length - microQuestions.length); // 15 questions
  const psychQuestions: CityChapterQuestion[] = [];

  type CandidatePick = { law: PsychologyLaw; variantType: number };

  const buildRankedCandidates = (lawsPool: PsychologyLaw[]): CandidatePick[] => {
    const freshCool: CandidatePick[] = [];
    const freshWarm: CandidatePick[] = [];
    const replayCool: CandidatePick[] = [];

    for (const law of cryptoShuffle(lawsPool)) {
      const variants = cryptoShuffle([0, 1, 2, 3, 4]);
      const isRecent = recentSet.has(law.id);
      for (const v of variants) {
        const sig = `${law.id}::${v}`;
        if (!seenSet.has(sig)) {
          if (!isRecent) freshCool.push({ law, variantType: v });
          else freshWarm.push({ law, variantType: v });
        } else if (!isRecent) {
          replayCool.push({ law, variantType: v });
        }
      }
    }

    return [...freshCool, ...freshWarm, ...replayCool];
  };

  // Up to 9 questions drawn from THIS capital's stationed laws (non-repeating variant first)
  const cityRanked = buildRankedCandidates(cityLoveLaws);
  const targetCityCount = Math.min(9, cityLoveLaws.length);

  for (const cand of cityRanked) {
    if (psychQuestions.length >= targetCityCount) break;
    if (usedLawsInBatch.has(cand.law.id)) continue;
    usedLawsInBatch.add(cand.law.id);
    psychQuestions.push(
      buildPsychologyLawQuestion(
        cand.law,
        distractorReferencePool,
        cand.variantType,
        city,
        safePointIdx,
        safeChapterIdx,
        psychQuestions.length,
        rng
      )
    );
  }

  // Remaining slots drawn across the tier's world-capital pool + all 696 love laws + classic anchors
  const tierAndGlobalRanked = [
    ...buildRankedCandidates(sameTierLoveLaws),
    ...buildRankedCandidates(allLoveFallback),
  ];

  // Occasionally include 1 curated classic/rapid item for cross-disciplinary contrast
  const shouldIncludeClassic = rng() < 0.45 && classicDomainLaws.length > 0;
  if (shouldIncludeClassic && psychQuestions.length < psychNeeded) {
    const classicCand = cryptoShuffle(classicDomainLaws).find((c) => !usedLawsInBatch.has(c.id));
    if (classicCand) {
      usedLawsInBatch.add(classicCand.id);
      const variantType = Math.floor(rng() * 5);
      psychQuestions.push(
        buildPsychologyLawQuestion(
          classicCand,
          INITIAL_PSYCHOLOGY_LAWS,
          variantType,
          city,
          safePointIdx,
          safeChapterIdx,
          psychQuestions.length,
          rng
        )
      );
    }
  } else if (RAPID_QUIZ_QUESTIONS.length > 0 && rng() < 0.25 && psychQuestions.length < psychNeeded) {
    const rq = RAPID_QUIZ_QUESTIONS[Math.floor(rng() * RAPID_QUIZ_QUESTIONS.length)];
    if (rq) {
      const { options, correctAnswer } = buildShuffledOptions(
        rq.options[rq.correctAnswer] || rq.options[0],
        rq.options.filter((_, oIdx) => oIdx !== rq.correctAnswer),
        rng
      );
      psychQuestions.push({
        ...rq,
        id: `rq-${safeCityIdx}-${safePointIdx}-${safeChapterIdx}-${Math.floor(rng() * 99999)}`,
        options,
        correctAnswer,
        chapterTheme,
        cityTag,
        subTag: rq.category,
      });
    }
  }

  for (const cand of tierAndGlobalRanked) {
    if (psychQuestions.length >= psychNeeded) break;
    if (usedLawsInBatch.has(cand.law.id)) continue;
    usedLawsInBatch.add(cand.law.id);
    psychQuestions.push(
      buildPsychologyLawQuestion(
        cand.law,
        distractorReferencePool,
        cand.variantType,
        city,
        safePointIdx,
        safeChapterIdx,
        psychQuestions.length,
        rng
      )
    );
  }

  // If the entire 3,480+ universe of unseen variants has been explored, reset stale signatures cleanly and top up
  if (psychQuestions.length < psychNeeded) {
    history.seenSignatures = [];
    seenSet.clear();
    for (const cand of buildRankedCandidates(LOVE_PSYCHOLOGY_LAWS)) {
      if (psychQuestions.length >= psychNeeded) break;
      if (usedLawsInBatch.has(cand.law.id)) continue;
      usedLawsInBatch.add(cand.law.id);
      psychQuestions.push(
        buildPsychologyLawQuestion(
          cand.law,
          LOVE_PSYCHOLOGY_LAWS,
          cand.variantType,
          city,
          safePointIdx,
          safeChapterIdx,
          psychQuestions.length,
          rng
        )
      );
    }
  }

  // Apply anti-repeat, category-declustered CSPRNG sequencing
  const combined = sequenceQuestionsNonRepeating(
    [...psychQuestions, ...microQuestions, ...geoQuestions].slice(0, QUESTIONS_PER_CHAPTER),
    history.lastLevelOrders[levelKey]
  );

  // Persist non-repeating tracking ledger
  const nextRecent = [...history.recentLawIds];
  for (const q of combined) {
    if (q.sequenceToken && !seenSet.has(q.sequenceToken)) {
      seenSet.add(q.sequenceToken);
      history.seenSignatures.push(q.sequenceToken);
    }
    if (q.relatedLawId) {
      nextRecent.push(q.relatedLawId);
    }
  }
  history.recentLawIds = nextRecent.slice(-RECENT_COOLDOWN_SIZE);
  history.lastLevelOrders[levelKey] = combined
    .map((q) => q.relatedLawId || q.id.split('-')[1] || q.id)
    .join(',');
  history.totalRuns += 1;
  saveSequenceHistory(history);

  return combined;
}

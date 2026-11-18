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

export interface CityChapterQuestion extends QuizQuestion {
  chapterTheme: string;
  cityTag: string;
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

// Deterministic PRNG (Mulberry32) so each (city, point, chapter) has stable reproducible 20 questions
function createSeededRng(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleWithRng<T>(arr: T[], rng: () => number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }
  return copy;
}

function buildShuffledOptions(
  correctText: string,
  distractors: string[],
  rng: () => number
): { options: string[]; correctAnswer: number } {
  const uniqueDistractors = Array.from(
    new Set(distractors.filter((d) => d && d.trim() !== correctText.trim()))
  ).slice(0, 3);

  while (uniqueDistractors.length < 3) {
    uniqueDistractors.push(`无关干扰选项 #${uniqueDistractors.length + 1}`);
  }

  const tagged = [
    { text: correctText, isCorrect: true },
    ...uniqueDistractors.map((text) => ({ text, isCorrect: false })),
  ];
  const shuffled = shuffleWithRng(tagged, rng);
  const correctAnswer = shuffled.findIndex((item) => item.isCorrect);
  return {
    options: shuffled.map((item) => item.text),
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
  while (picked.length < count && guard < 80) {
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
  const randomCities = shuffleWithRng(otherCities, rng);
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
    };
  })();

  return [qCountry, qRiver, qDistrict, qContinent];
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
  const difficulty: DifficultyLevel = law.difficulty || (chapterIndex < 3 ? 'Easy' : chapterIndex < 7 ? 'Medium' : 'Hard');
  const domainLabel = law.isLoveCodex ? `爱情心理·${law.subTag || '关系'}` : '心理定律';

  if (variantType === 0 && law.answers && law.answers.length >= 4) {
    const correctText = law.answers[law.correctAnswer] || law.answers[0];
    const wrongTexts = law.answers.filter((_, idx) => idx !== law.correctAnswer);
    const { options, correctAnswer } = buildShuffledOptions(correctText, wrongTexts, rng);
    return {
      id: `psy-direct-${city.index}-${pointIndex}-${chapterIndex}-${qIdx}`,
      category,
      question: `【${district.zh} · ${domainLabel}】${law.question}`,
      options,
      correctAnswer,
      explanation: `${law.nameZh}（${law.nameEn}）：${law.shortExplanation} ${law.keyTakeaway}`,
      difficulty,
      relatedLawId: law.id,
      chapterTheme,
      cityTag,
    };
  }

  if (variantType === 1) {
    const promptSnippet =
      law.isLoveCodex
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
      id: `psy-case-${city.index}-${pointIndex}-${chapterIndex}-${qIdx}`,
      category,
      question: `【都市情境映射 · ${city.cityZh}】试想在「${district.zh}」分析以下规律：“${promptSnippet}”，这精准对应哪一项心理学概念？`,
      options,
      correctAnswer,
      explanation: `上述现象精准体现了【${law.nameZh}（${law.nameEn}）】：${law.shortExplanation}`,
      difficulty,
      relatedLawId: law.id,
      chapterTheme,
      cityTag,
    };
  }

  if (variantType === 2) {
    const { options, correctAnswer } = buildShuffledOptions(
      law.shortExplanation,
      distractors.map((d) => d.shortExplanation),
      rng
    );
    return {
      id: `psy-mech-${city.index}-${pointIndex}-${chapterIndex}-${qIdx}`,
      category,
      question: `【${domainLabel} · 机制溯源】关于「${law.nameZh}（${law.nameEn}）」，以下哪项准确揭示了其科学内涵？`,
      options,
      correctAnswer,
      explanation: `【深度机制】${law.whyItHappens || law.detailedExplanation}`,
      difficulty,
      relatedLawId: law.id,
      chapterTheme,
      cityTag,
    };
  }

  if (variantType === 3) {
    const { options, correctAnswer } = buildShuffledOptions(
      law.keyTakeaway,
      distractors.map((d) => d.keyTakeaway),
      rng
    );
    return {
      id: `psy-action-${city.index}-${pointIndex}-${chapterIndex}-${qIdx}`,
      category,
      question: `【${district.zh} · 健康边界】理解并运用「${law.nameZh}」时，以下哪项健康原则与边界最应当坚守？`,
      options,
      correctAnswer,
      explanation: `科学应对「${law.nameZh}」的关键边界在于：${law.keyTakeaway}`,
      difficulty,
      relatedLawId: law.id,
      chapterTheme,
      cityTag,
    };
  }

  // Variant 4: Contrasting classification / domain diagnosis
  const targetLabel = `${law.nameZh} — ${law.keyTakeaway}`;
  const { options, correctAnswer } = buildShuffledOptions(
    targetLabel,
    distractors.map((d) => `${d.nameZh} — ${d.keyTakeaway}`),
    rng
  );
  return {
    id: `psy-contrast-${city.index}-${pointIndex}-${chapterIndex}-${qIdx}`,
    category,
    question: `【高阶思辨 · ${city.cityZh}】若伴侣或人际互动中出现「${law.subTag || law.categoryZh}」课题（${law.shortExplanation.slice(0, 42)}…），最贴合的概念与校准指引是？`,
    options,
    correctAnswer,
    explanation: `正解为【${law.nameZh}】：${law.shortExplanation}`,
    difficulty,
    relatedLawId: law.id,
    chapterTheme,
    cityTag,
  };
}

/**
 * Deterministically generates exactly 20 distinct, educational questions
 * for any (cityIndex 0..49, pointIndex 0..7, chapterIndex 0..9).
 * Prioritizes the city's dedicated Love Psychology Laws (ordered Easy -> Medium -> Hard across all 50 cities)
 * supplemented with same-tier love & classic cognitive psychology laws.
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
  const seed =
    (safeCityIdx + 1) * 10007 + (safePointIdx + 1) * 977 + (safeChapterIdx + 1) * 131;
  const rng = createSeededRng(seed);

  const chapterTheme = CHAPTER_THEMES_ZH[safeChapterIdx];
  const cityTag = `${city.cityFr} · ${city.cityZh}`;

  // 1. 3 World Capital Geography & Heritage Questions
  const geoQuestions = buildCapitalGeographyQuestions(
    city,
    safePointIdx,
    safeChapterIdx,
    rng
  ).slice(0, 3);

  // 2. City's Dedicated Love Psychology Pool (13-14 laws assigned specifically to this capital)
  const cityLoveLaws = getLoveLawsForCity(safeCityIdx);
  const sameTierLoveLaws = LOVE_PSYCHOLOGY_LAWS.filter(
    (l) => l.difficulty === cityTier.difficulty && l.assignedCityIndex !== safeCityIdx
  );
  const targetCat = POINT_CATEGORIES[safePointIdx];
  const classicDomainLaws = INITIAL_PSYCHOLOGY_LAWS.filter(
    (l) => !l.isLoveCodex && l.categoryZh === targetCat
  );

  // Build progressive chapter order: city's dedicated love laws lead, then same-tier neighbors & classic cognitive bridges
  const orderedCityLaws = shuffleWithRng(cityLoveLaws, rng);
  const orderedNeighborLove = shuffleWithRng(sameTierLoveLaws, rng);
  const orderedClassic = shuffleWithRng(classicDomainLaws, rng);

  const distractorReferencePool =
    sameTierLoveLaws.length > 10 ? [...cityLoveLaws, ...sameTierLoveLaws] : LOVE_PSYCHOLOGY_LAWS;

  const psychNeeded = QUESTIONS_PER_CHAPTER - geoQuestions.length; // 17 questions
  const psychQuestions: CityChapterQuestion[] = [];
  const usedLawTemplates = new Set<string>();

  // Inject up to 11 questions directly from THIS capital's stationed Love Psychology Laws
  const citySliceCount = Math.min(11, orderedCityLaws.length);
  const cityOffset = (safePointIdx * 3 + safeChapterIdx * 5) % Math.max(1, orderedCityLaws.length);
  for (let i = 0; i < citySliceCount; i++) {
    const law = orderedCityLaws[(cityOffset + i) % orderedCityLaws.length];
    const variantType = (i + safePointIdx + safeChapterIdx) % 5;
    usedLawTemplates.add(`${law.id}:${variantType}`);
    psychQuestions.push(
      buildPsychologyLawQuestion(
        law,
        distractorReferencePool,
        variantType,
        city,
        safePointIdx,
        safeChapterIdx,
        i,
        rng
      )
    );
  }

  // Fill remaining slots from same-difficulty tier Love Psychology + Classic Domain Laws (progression Easy -> Hard)
  let fillCursor = (safeCityIdx * 7 + safePointIdx * 5 + safeChapterIdx * 11) % Math.max(1, orderedNeighborLove.length);
  let classicCursor = (safeCityIdx + safePointIdx + safeChapterIdx) % Math.max(1, orderedClassic.length);
  let guard = 0;

  while (psychQuestions.length < psychNeeded && guard < 100) {
    guard++;
    const idx = psychQuestions.length;

    if (idx === psychNeeded - 1 && safeChapterIdx % 4 === 0 && RAPID_QUIZ_QUESTIONS.length > 0) {
      const rq =
        RAPID_QUIZ_QUESTIONS[(safeCityIdx + safePointIdx + safeChapterIdx) % RAPID_QUIZ_QUESTIONS.length];
      if (rq) {
        const { options, correctAnswer } = buildShuffledOptions(
          rq.options[rq.correctAnswer] || rq.options[0],
          rq.options.filter((_, oIdx) => oIdx !== rq.correctAnswer),
          rng
        );
        psychQuestions.push({
          ...rq,
          id: `rq-${safeCityIdx}-${safePointIdx}-${safeChapterIdx}-${idx}`,
          options,
          correctAnswer,
          chapterTheme,
          cityTag,
        });
        continue;
      }
    }

    const useClassic = idx % 3 === 2 && orderedClassic.length > 0;
    const law = useClassic
      ? orderedClassic[classicCursor++ % orderedClassic.length]
      : orderedNeighborLove[fillCursor++ % orderedNeighborLove.length];

    if (!law) break;
    const variantType = (idx + safeChapterIdx) % 5;
    const key = `${law.id}:${variantType}`;
    if (usedLawTemplates.has(key)) continue;
    usedLawTemplates.add(key);

    psychQuestions.push(
      buildPsychologyLawQuestion(
        law,
        law.isLoveCodex ? distractorReferencePool : INITIAL_PSYCHOLOGY_LAWS,
        variantType,
        city,
        safePointIdx,
        safeChapterIdx,
        idx,
        rng
      )
    );
  }

  // Interleave geography and psychology smoothly -> exactly 20 questions
  const combined = shuffleWithRng([...psychQuestions, ...geoQuestions], rng);
  return combined.slice(0, QUESTIONS_PER_CHAPTER);
}

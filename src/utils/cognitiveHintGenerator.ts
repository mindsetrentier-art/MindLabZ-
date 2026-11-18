import { PsychologyLaw } from '../types';
import { WorldCapitalCity } from '../data/worldCapitals';
import { CityChapterQuestion } from './cityQuizGenerator';
import { MICROEXPRESSION_QUIZ_SCENARIOS } from '../data/microexpressionQuizScenarios';

export const MAX_FOCUS_ENERGY = 100;
export const INITIAL_FOCUS_ENERGY = 60;
export const HINT_ENERGY_COST = 15;
export const FIRST_TRY_ENERGY_REWARD = 5;
export const STREAK_ENERGY_REWARD = 8;

export interface CognitiveHintPayload {
  perspectiveLabel: string;
  guidingQuestion: string;
  cognitiveClue: string;
}

/**
 * Ensures the generated hint never directly exposes the exact correct option text
 * or verbatim answer phrases.
 */
function scrubAnswerTerms(source: string, forbiddenTerms: Array<string | undefined>): string {
  let cleaned = (source || '').trim();
  for (const rawTerm of forbiddenTerms) {
    if (!rawTerm) continue;
    const term = rawTerm.trim();
    if (term.length < 2) continue;
    // Strip exact occurrence (case-insensitive)
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    cleaned = cleaned.replace(new RegExp(escaped, 'gi'), '「目标概念」');
  }
  return cleaned;
}

export function buildSocraticCognitiveHint(
  question: CityChapterQuestion,
  law: PsychologyLaw | undefined,
  city: WorldCapitalCity
): CognitiveHintPayload {
  const correctOption = question.options[question.correctAnswer] || '';
  const forbiddenBase = [
    correctOption,
    ...correctOption.split(/[()（）—·：:]/).map((s) => s.trim()).filter((s) => s.length >= 3),
  ];

  // 0. Microexpressions & Facial Action Narrative Challenges (ML001-ML010)
  if (question.microScenario) {
    const scenarioSpec = MICROEXPRESSION_QUIZ_SCENARIOS.find(
      (item) => item.lawId === question.relatedLawId
    );
    const forbiddenMicro = [
      ...forbiddenBase,
      question.microScenario.actionUnitCode,
      law?.actionUnitCode,
      law?.nameZh,
      law?.nameEn,
    ];
    return {
      perspectiveLabel: `微表情与动作编码引导 · ${question.microScenario.categoryZh} #${question.microScenario.categoryRank}`,
      guidingQuestion: scrubAnswerTerms(
        question.microScenario.socraticQuestion ||
          scenarioSpec?.socraticQuestion ||
          '先定位肌肉运动发生在眉内侧、眉梢外侧、上眼睑、眼周脸颊还是嘴角，再思考哪些非情绪性因素也会制造相同外观？',
        forbiddenMicro
      ),
      cognitiveClue: scrubAnswerTerms(
        question.microScenario.socraticClue ||
          scenarioSpec?.socraticClue ||
          question.microScenario.scientificLimitation ||
          '记住科学边界：客观肌肉位移本身不等于绝对测谎或唯一情绪定罪。',
        forbiddenMicro
      ),
    };
  }

  // 1. World Capital Geography Questions
  if (question.id.startsWith('geo-country-')) {
    return {
      perspectiveLabel: '空间与人文坐标线索',
      guidingQuestion: `先追问自己：${city.cityZh}（${city.coordinates}）身处哪一个大陆板块，其文明遗迹通常与哪个语系或地理区域相连？`,
      cognitiveClue: scrubAnswerTerms(
        `这座首都以「${city.heritageLandmark}」闻名，核心水脉为${city.riverZh}，隶属 ${city.continent} 板块——可先排除不属于该大洲的国家选项。`,
        [...forbiddenBase, city.countryZh, city.countryFr]
      ),
    };
  }

  if (question.id.startsWith('geo-river-')) {
    return {
      perspectiveLabel: '记忆宫殿水脉联想',
      guidingQuestion: `用「地点记忆法」回想一下：在 ${city.cityZh} 的城市中轴线与地标高地周边，贯穿城区的著名河流属于哪种地理名称风格？`,
      cognitiveClue: scrubAnswerTerms(
        `城市坐标 ${city.coordinates}，地标参照为「${city.heritageLandmark}」与「${city.hillLabel}」；注意辨别不同大洲水域名称的语言特征。`,
        [...forbiddenBase, city.riverZh, city.riverFr]
      ),
    };
  }

  if (question.id.startsWith('geo-dist-')) {
    return {
      perspectiveLabel: '都市街区定位推演',
      guidingQuestion: `对照选项里括号标明的城市线索：哪一个街区名称在文化语境与历史功能上真正属于「${city.cityZh}」？`,
      cognitiveClue: scrubAnswerTerms(
        `线索提示：${city.culturalFact} 可通过选项中非本市的干扰城市标记快速收窄范围。`,
        [...forbiddenBase, ...city.districts.map((d) => d.zh), ...city.districts.map((d) => d.fr)]
      ),
    };
  }

  if (question.id.startsWith('geo-cont-')) {
    const hemisphereLat = city.coordinates.includes('S') ? '南半球' : '北半球';
    const hemisphereLon = city.coordinates.includes('W') ? '西经区域' : '东经区域';
    return {
      perspectiveLabel: '经纬度半球排除法',
      guidingQuestion: `观察题干给出的坐标（${city.coordinates}）：它落在${hemisphereLat}与${hemisphereLon}，据此可以立即排除哪些大洲？`,
      cognitiveClue: scrubAnswerTerms(
        `该首都以「${city.heritageLandmark}」著称，结合经纬度分区与建筑文明风格即可锁定所属板块。`,
        [...forbiddenBase, city.continent]
      ),
    };
  }

  // 2. Psychology Law / Love Codex Questions
  if (law) {
    const domainTag = law.subTag || law.categoryZh || question.category;
    const forbiddenWithLaw = [...forbiddenBase, law.nameZh, law.nameEn];

    if (question.id.startsWith('psy-case-')) {
      const signalHint = law.recognitionSignals?.[0]
        ? scrubAnswerTerms(law.recognitionSignals[0], forbiddenWithLaw)
        : `留意情境中个体如何回应「${domainTag}」引发的隐性心理触发。`;
      const boundaryCue = scrubAnswerTerms(
        law.healthyBoundary || law.keyTakeaway || '',
        forbiddenWithLaw
      );
      return {
        perspectiveLabel: `情境映射 · ${domainTag}视角`,
        guidingQuestion: `试着用「机制匹配法」反问：题干描述的行为倾向，核心是源于注意偏移、情绪防御，还是关系互动中的「${domainTag}」失衡？`,
        cognitiveClue: `${signalHint}${boundaryCue ? ` 另一个区分线索：该课题的校准方向与「${boundaryCue.slice(0, 36)}${boundaryCue.length > 36 ? '…' : ''}」一致。` : ''}`,
      };
    }

    if (question.id.startsWith('psy-action-') || question.id.startsWith('psy-contrast-')) {
      const exampleCue = scrubAnswerTerms(
        law.realLifeExample || law.whyItHappens || '',
        forbiddenBase
      );
      return {
        perspectiveLabel: `苏格拉底边界辨析 · ${domainTag}`,
        guidingQuestion: `用「健康自主原则」逐一审视选项：哪一条既避免了情绪化武断或过度迎合，又为双方留出了坦诚核对与修复的空间？`,
        cognitiveClue:
          exampleCue ||
          `在「${domainTag}」课题中，成熟的心理边界通常强调可观察行为、明确表达需求与双向尊重，而非控制或回避。`,
      };
    }

    // psy-direct or psy-mech
    const signalClue = law.recognitionSignals?.[0]
      ? scrubAnswerTerms(law.recognitionSignals[0], forbiddenBase)
      : scrubAnswerTerms(law.realLifeExample || '', forbiddenBase);
    return {
      perspectiveLabel: `心理机制推演 · ${domainTag}`,
      guidingQuestion: `先问自己一个反向问题：如果一个人完全没有意识到「${law.nameZh}」，他在${domainTag}互动中最容易落入哪种直觉误区？`,
      cognitiveClue:
        signalClue ||
        `重点比对四个选项的因果链条：正确解释通常会精准指出该效应在「${domainTag}」中如何扭曲判断或塑造关系走向。`,
    };
  }

  // 3. Fallback General Socratic Nudge
  return {
    perspectiveLabel: `${question.category}思辨引导`,
    guidingQuestion: `先暂停 3 秒，把每个选项代回题干情境：哪一项最符合「长期可持续认知」与「非绝对化证据检验」？`,
    cognitiveClue: scrubAnswerTerms(
      `当前考查属于「${question.subTag || question.category}」维度（难度 ${question.difficulty}），请排除带有绝对化归因或偷换前提的干扰项。`,
      forbiddenBase
    ),
  };
}

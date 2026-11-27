import type { PsychologyLaw, StructuredLawData, StructuredLawQuizItem } from '../types';

export interface LawBookSpreadMeta {
  index: number;
  roman: string;
  titleZh: string;
  titleEn: string;
  leftPageLabel: string;
  rightPageLabel: string;
}

export interface LawBookCollectionTheme {
  id: string;
  collectionZh: string;
  collectionEn: string;
  accentHex: string;
  inkHighlightHex: string;
  sealLabel: string;
}

export interface LawBookBoundaryNotice {
  title: string;
  body: string;
  detail?: string;
  tone: 'amber' | 'rose' | 'indigo';
}

export interface LawBookCodex {
  theme: LawBookCollectionTheme;
  volumeNumberLabel: string;
  displayDefinition: string;
  displayMechanism: string;
  keyTakeaway: string;
  cases: {
    life: string;
    workplace: string;
    relationship: string;
    business: string;
  };
  recognitionSignals: string[];
  antiManipulation: string[];
  quizList: StructuredLawQuizItem[];
  game: {
    title: string;
    type: string;
    scenario: string;
    option_a: string;
    option_b: string;
    rational_choice: string;
    insight: string;
  };
  boundaryNotice: LawBookBoundaryNotice | null;
  domainDeepNotes: Array<{ label: string; value: string }>;
  spreads: LawBookSpreadMeta[];
}

export const BOOK_SPREAD_DEFINITIONS: LawBookSpreadMeta[] = [
  {
    index: 0,
    roman: 'I',
    titleZh: '扉页与精义',
    titleEn: 'Frontispiece & Essence',
    leftPageLabel: 'p. 1',
    rightPageLabel: 'p. 2',
  },
  {
    index: 1,
    roman: 'II',
    titleZh: '机制与实证',
    titleEn: 'Mechanism & Evidence',
    leftPageLabel: 'p. 3',
    rightPageLabel: 'p. 4',
  },
  {
    index: 2,
    roman: 'III',
    titleZh: '全景实案',
    titleEn: 'Panoramic Cases',
    leftPageLabel: 'p. 5',
    rightPageLabel: 'p. 6',
  },
  {
    index: 3,
    roman: 'IV',
    titleZh: '信号与防御',
    titleEn: 'Signals & Defense',
    leftPageLabel: 'p. 7',
    rightPageLabel: 'p. 8',
  },
  {
    index: 4,
    roman: 'V',
    titleZh: '博弈与自测',
    titleEn: 'Dialectic Lab & Quiz',
    leftPageLabel: 'p. 9',
    rightPageLabel: 'p. 10',
  },
  {
    index: 5,
    roman: 'VI',
    titleZh: '星图与续章',
    titleEn: 'Constellation & Next',
    leftPageLabel: 'p. 11',
    rightPageLabel: 'p. 12',
  },
];

export function resolveLawCollectionTheme(law: PsychologyLaw): LawBookCollectionTheme {
  if (law.isMicroexpression) {
    return {
      id: 'microexpression',
      collectionZh: '微表情解码档案',
      collectionEn: 'Microexpression & FACS Archive',
      accentHex: '#4338A6',
      inkHighlightHex: '#312E81',
      sealLabel: law.actionUnitCode ? `FACS · ${law.actionUnitCode}` : 'FACS · CODEX',
    };
  }
  if (law.isCriminalPsychology) {
    return {
      id: 'criminal',
      collectionZh: '犯罪心理学研习卷',
      collectionEn: 'Criminological Psychology Folio',
      accentHex: '#9F1239',
      inkHighlightHex: '#881337',
      sealLabel: law.criminalCategory || 'CRIMINAL · PSY',
    };
  }
  if (law.isReversePsychology) {
    return {
      id: 'reverse',
      collectionZh: '逆向心理与抗拒研究',
      collectionEn: 'Psychological Reactance Folio',
      accentHex: '#4F46E5',
      inkHighlightHex: '#3730A3',
      sealLabel: law.reverseCategory || 'REACTANCE',
    };
  }
  if (law.isSexualPsychology) {
    return {
      id: 'sexual',
      collectionZh: '性心理科学教育全书',
      collectionEn: 'Human Sexuality Science Folio',
      accentHex: '#7C3AED',
      inkHighlightHex: '#5B21B6',
      sealLabel: law.sexualCategory || 'CONSENT & SCIENCE',
    };
  }
  if (law.isIntimateRelationship) {
    return {
      id: 'intimate',
      collectionZh: '亲密关系100律典藏',
      collectionEn: 'Intimate Relationships Folio',
      accentHex: '#BE123C',
      inkHighlightHex: '#9F1239',
      sealLabel: law.intimateCategory || 'INTIMACY · 100',
    };
  }
  if (law.isLove100Psychology) {
    return {
      id: 'love100',
      collectionZh: '恋爱心理100精研卷',
      collectionEn: 'Romantic Dynamics Folio',
      accentHex: '#C2410C',
      inkHighlightHex: '#9A3412',
      sealLabel: law.love100Category || 'LOVE · 100',
    };
  }
  if (law.isLoveCodex) {
    return {
      id: 'love-codex',
      collectionZh: '情感与依恋法典',
      collectionEn: 'Attachment & Eros Codex',
      accentHex: '#961D38',
      inkHighlightHex: '#7F1D1D',
      sealLabel: law.assignedCityZh ? `驻守 · ${law.assignedCityZh}` : 'LOVE CODEX',
    };
  }
  if (law.id.startsWith('emo-')) {
    return {
      id: 'emotional-archive',
      collectionZh: '情绪与依恋珍藏版',
      collectionEn: 'Emotional & Relational Folio',
      accentHex: '#B45309',
      inkHighlightHex: '#92400E',
      sealLabel: 'EMOTIONAL ARCHIVE',
    };
  }
  return {
    id: 'classic',
    collectionZh: '经典认知科学大典',
    collectionEn: 'Classical Cognitive Canon',
    accentHex: '#A66C1E',
    inkHighlightHex: '#784D12',
    sealLabel: `${law.categoryZh} · CANON`,
  };
}

export function buildLawBookCodex(
  law: PsychologyLaw,
  structuredLaw?: StructuredLawData | null
): LawBookCodex {
  const theme = resolveLawCollectionTheme(law);
  const displayDefinition =
    (structuredLaw?.definition || law.shortExplanation || '').trim() ||
    `围绕【${law.nameZh}】的核心心理机制与人类认知倾向。`;

  const rawMechanism = structuredLaw?.mechanism
    ? structuredLaw.mechanism
    : [law.detailedExplanation, law.whyItHappens].filter(Boolean).join(' ');
  const displayMechanism =
    rawMechanism.trim() ||
    `【${law.nameZh}】揭示了大脑在信息加工与情绪反应中的典型启发式路径。`;

  const cases = {
    life:
      structuredLaw?.real_life_case ||
      law.realLifeExample ||
      `在日常判断与生活选择中，【${law.nameZh}】常以隐蔽的直觉惯性浮现。`,
    workplace:
      structuredLaw?.workplace_case ||
      law.workplaceCase ||
      law.realLifeExample ||
      `在团队协作、汇报决策与目标评估中，需警惕【${law.nameZh}】引发的系统性偏移。`,
    relationship:
      structuredLaw?.relationship_case ||
      law.relationshipCase ||
      law.realLifeExample ||
      `在伴侣与重要他人互动中，理解【${law.nameZh}】有助减少误判并建立安全沟通。`,
    business:
      structuredLaw?.business_case ||
      law.businessCase ||
      law.realLifeExample ||
      `在商业谈判、产品设计与长期信任构建中，【${law.nameZh}】影响受众的真实心理权重。`,
  };

  const recognitionSignals =
    structuredLaw?.recognition_signals && structuredLaw.recognition_signals.length > 0
      ? structuredLaw.recognition_signals
      : law.recognitionSignals && law.recognitionSignals.length > 0
      ? law.recognitionSignals
      : [
          '依赖第一直觉快速下定论，忽略反面证据',
          '在情绪波动或时间压力下出现系统性判断偏移',
          '对既有观点过度确信，排斥外部独立基准',
        ];

  const antiManipulation =
    structuredLaw?.anti_manipulation && structuredLaw.anti_manipulation.length > 0
      ? structuredLaw.anti_manipulation
      : law.antiManipulation && law.antiManipulation.length > 0
      ? law.antiManipulation
      : [
          law.keyTakeaway || `保持对【${law.nameZh}】的元认知觉察。`,
          '启动“3 秒元认知暂停”，刻意寻找至少 2 条反例',
          '引入客观数据与外部基准率（Outside View）交叉验证',
        ];

  const quizList: StructuredLawQuizItem[] =
    structuredLaw?.quiz && structuredLaw.quiz.length > 0
      ? structuredLaw.quiz
      : [
          {
            question:
              law.question ||
              `关于【${law.nameZh}（${law.nameEn}）】的核心特征，以下哪项最准确？`,
            options:
              law.answers && law.answers.length >= 2
                ? law.answers
                : [
                    displayDefinition,
                    '仅在极端异常环境下偶然出现，不具普遍规律',
                    '完全依靠主观臆想，无任何行为实证支持',
                    '与注意力和决策过程毫无关联',
                  ],
            answer_index:
              typeof law.correctAnswer === 'number' && law.correctAnswer >= 0
                ? law.correctAnswer
                : 0,
            explanation: law.keyTakeaway || displayDefinition,
          },
        ];

  const game = structuredLaw?.game || {
    title: `${law.nameZh} · 认知决策实验室`,
    type: 'scenario_choice',
    scenario:
      law.experimentSetup?.scenario ||
      `当你身处受【${law.nameZh}】影响的高压情境时，你会如何决策？`,
    option_a: law.experimentSetup?.optionA?.label || '顺应第一直觉快速做出反应',
    option_b:
      law.experimentSetup?.optionB?.label || '启动系统2理性核查，引入反向证据',
    rational_choice: 'B',
    insight: law.experimentSetup?.insight || law.keyTakeaway || displayDefinition,
  };

  let boundaryNotice: LawBookBoundaryNotice | null = null;
  if (law.isCriminalPsychology) {
    boundaryNotice = {
      title: `科学使用边界与非诊断声明（${law.criminalCategory || '犯罪心理学'}）`,
      body: law.healthyBoundary || law.criminalLearningNote || '',
      detail: law.limitations,
      tone: 'rose',
    };
  } else if (law.isSexualPsychology) {
    boundaryNotice = {
      title: `科学教育、知情同意与非诊断声明（${law.sexualCategory || '性心理学'}）`,
      body: law.healthyBoundary || law.sexualLearningNote || '',
      detail: law.limitations,
      tone: 'indigo',
    };
  } else if (law.isIntimateRelationship) {
    boundaryNotice = {
      title: `亲密关系科普、自主平等与非诊断声明（${law.intimateCategory || '亲密关系'}）`,
      body: law.healthyBoundary || law.intimateLearningNote || '',
      detail: law.limitations,
      tone: 'rose',
    };
  } else if (law.isMicroexpression && law.limitations) {
    boundaryNotice = {
      title: '科学解释边界与误读警示（Limitations）',
      body: law.limitations,
      tone: 'rose',
    };
  } else if (law.healthyBoundary) {
    boundaryNotice = {
      title: '健康关系边界与伦理提示',
      body: law.healthyBoundary,
      tone: 'amber',
    };
  } else if (law.isReversePsychology) {
    boundaryNotice = {
      title: `逆向心理研究伦理提示（${law.reverseCategory || '自主尊重'}）`,
      body:
        law.reverseApplication ||
        '逆向心理并非稳定可控的操控术，应以诚实沟通与尊重他人自主边界为前提。',
      tone: 'indigo',
    };
  }

  const domainDeepNotes: Array<{ label: string; value: string }> = [];
  if (law.reversePrinciple) {
    domainDeepNotes.push({ label: '核心心理机制', value: law.reversePrinciple });
  }
  if (law.reverseApplication) {
    domainDeepNotes.push({ label: '伦理应用建议', value: law.reverseApplication });
  }
  if (law.criminalCoreTheory) {
    domainDeepNotes.push({ label: '核心理论脉络', value: law.criminalCoreTheory });
  }
  if (law.criminalAppliedAngle) {
    domainDeepNotes.push({ label: '研究与预防视角', value: law.criminalAppliedAngle });
  }
  if (law.sexualCoreConcept) {
    domainDeepNotes.push({ label: '核心科学概念', value: law.sexualCoreConcept });
  }
  if (law.love100CoreConcept) {
    domainDeepNotes.push({ label: '恋爱动力学核心', value: law.love100CoreConcept });
  }
  if (law.intimateCoreConcept) {
    domainDeepNotes.push({ label: '亲密关系内核', value: law.intimateCoreConcept });
  }
  if (law.observableSigns && law.observableSigns.length > 0) {
    domainDeepNotes.push({
      label: '可观察面部线索（Observable Signs）',
      value: law.observableSigns.join('  ·  '),
    });
  }
  if (law.researcher) {
    domainDeepNotes.push({
      label: '核心实证文献',
      value: `${law.researcher}${law.studyYear ? ` (${law.studyYear})` : ''}${
        law.sourceCitation ? ` — ${law.sourceCitation}` : ''
      }`,
    });
  }

  return {
    theme,
    volumeNumberLabel: law.codeId || law.id.toUpperCase(),
    displayDefinition,
    displayMechanism,
    keyTakeaway: law.keyTakeaway || displayDefinition,
    cases,
    recognitionSignals,
    antiManipulation,
    quizList,
    game,
    boundaryNotice,
    domainDeepNotes,
    spreads: BOOK_SPREAD_DEFINITIONS,
  };
}

export interface AdjacentLawsResult {
  currentIndex: number;
  totalCount: number;
  prevLaw: PsychologyLaw | null;
  nextLaw: PsychologyLaw | null;
}

export function getAdjacentLaws(
  laws: PsychologyLaw[],
  currentLawId: string
): AdjacentLawsResult {
  if (!Array.isArray(laws) || laws.length === 0) {
    return { currentIndex: -1, totalCount: 0, prevLaw: null, nextLaw: null };
  }
  const normalizedTarget = (currentLawId || '').toLowerCase();
  const idx = laws.findIndex(
    (l) =>
      l.id.toLowerCase() === normalizedTarget ||
      (l.codeId && l.codeId.toLowerCase() === normalizedTarget)
  );
  if (idx === -1) {
    return { currentIndex: -1, totalCount: laws.length, prevLaw: null, nextLaw: null };
  }
  return {
    currentIndex: idx,
    totalCount: laws.length,
    prevLaw: idx > 0 ? laws[idx - 1] : null,
    nextLaw: idx < laws.length - 1 ? laws[idx + 1] : null,
  };
}

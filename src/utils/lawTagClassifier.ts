import { PsychologyLaw } from '../types';

export type LibraryTagId =
  | 'criminal-psychology'
  | 'sexual-psychology'
  | 'reverse-psychology'
  | 'microexpressions'
  | 'cognitive-bias'
  | 'decision-making'
  | 'love-attachment'
  | 'social-dynamics'
  | 'memory-recall'
  | 'behavior-habit';

export interface LibraryTagDefinition {
  id: LibraryTagId;
  labelZh: string;
  labelEn: string;
  description: string;
}

export const LIBRARY_TAG_DEFINITIONS: LibraryTagDefinition[] = [
  {
    id: 'criminal-psychology',
    labelZh: '犯罪心理学',
    labelEn: 'Criminal Psychology',
    description: '多因素风险模型、暴力攻击机制、道德脱离与预防边界',
  },
  {
    id: 'sexual-psychology',
    labelZh: '性心理学',
    labelEn: 'Sexual Psychology',
    description: '性反应周期、知情同意边界、身体意象与多元性健康科学',
  },
  {
    id: 'reverse-psychology',
    labelZh: '逆向心理学',
    labelEn: 'Reverse Psychology',
    description: '心理抗拒、自由威胁、反向框架与非强迫沟通',
  },
  {
    id: 'microexpressions',
    labelZh: '微表情解码',
    labelEn: 'Microexpressions',
    description: 'FACS 面部动作单元与瞬时情绪线索识别',
  },
  {
    id: 'cognitive-bias',
    labelZh: '认知偏误',
    labelEn: 'Cognitive Bias',
    description: '启发式捷径、系统性误判与思维盲区',
  },
  {
    id: 'decision-making',
    labelZh: '决策博弈',
    labelEn: 'Decision Making',
    description: '前景理论、锚定效应、沉没成本与概率权衡',
  },
  {
    id: 'love-attachment',
    labelZh: '亲密与依恋',
    labelEn: 'Love & Attachment',
    description: '依恋风格、吸引力机制、边界安全与关系修复',
  },
  {
    id: 'social-dynamics',
    labelZh: '社会动能',
    labelEn: 'Social Dynamics',
    description: '群体影响、社会认同、从众压力与权威效应',
  },
  {
    id: 'memory-recall',
    labelZh: '记忆遗忘',
    labelEn: 'Memory & Recall',
    description: '编码提取、峰终记忆与未完成张力规律',
  },
  {
    id: 'behavior-habit',
    labelZh: '行为习惯',
    labelEn: 'Behavior & Habit',
    description: '动机强化、习惯回路与跨情境行动触发',
  },
];

const COGNITIVE_PATTERN = /偏误|偏差|谬误|错觉|启发|归因|刻板|光环|投射|bias|heuristic|fallacy|illusion|stroop|dunning/i;
const DECISION_PATTERN = /决策|选择|锚定|沉没|损失|概率|博弈|前景|折扣|框架|机会成本|decision|choice|anchoring|prospect|sunk|framing/i;
const REVERSE_PATTERN = /逆向|抗拒|逆反|禁果|自由威胁|reactance|reverse/i;
const MICRO_PATTERN = /微表情|动作单元|facs|au\d+|microexpression/i;
const LOVE_PATTERN = /依恋|亲密|爱情|伴侣|吸引力|情感|沟通|共情|attachment|love|intimacy|relationship/i;

export function getLawClassificationTags(law: PsychologyLaw): LibraryTagId[] {
  const tags = new Set<LibraryTagId>();
  const haystack = [
    law.nameZh,
    law.nameEn,
    law.chapter || '',
    law.subTag || '',
    law.reverseCategory || '',
    law.shortExplanation,
  ].join(' ');

  if (law.isCriminalPsychology || /犯罪|暴力|攻击|道德脱离|精神病态|去人性化|责任分散/i.test(haystack)) {
    tags.add('criminal-psychology');
  }

  if (
    law.isSexualPsychology ||
    /性反应|性欲|性唤起|性同意|性健康|性取向|性别认同|性心理|身体意象|性幻想|性脚本|sexual|arousal|consent/i.test(
      haystack
    )
  ) {
    tags.add('sexual-psychology');
  }

  if (law.isReversePsychology || REVERSE_PATTERN.test(haystack)) {
    tags.add('reverse-psychology');
  }

  if (law.isMicroexpression || Boolean(law.actionUnitCode) || MICRO_PATTERN.test(haystack)) {
    tags.add('microexpressions');
  }

  if (
    law.category === 'cognitive' ||
    law.loveDomainId === 'cognition-bias' ||
    COGNITIVE_PATTERN.test(haystack)
  ) {
    tags.add('cognitive-bias');
  }

  if (law.category === 'decision' || DECISION_PATTERN.test(haystack)) {
    tags.add('decision-making');
  }

  if (
    law.isLoveCodex ||
    law.category === 'emotion' ||
    LOVE_PATTERN.test(haystack)
  ) {
    tags.add('love-attachment');
  }

  if (law.category === 'social') {
    tags.add('social-dynamics');
  }

  if (law.category === 'memory') {
    tags.add('memory-recall');
  }

  if (law.category === 'behavior') {
    tags.add('behavior-habit');
  }

  if (tags.size === 0) {
    tags.add('cognitive-bias');
  }

  return Array.from(tags);
}

export function getPrimaryTagLabel(law: PsychologyLaw): string {
  const tags = getLawClassificationTags(law);
  const first = LIBRARY_TAG_DEFINITIONS.find((def) => def.id === tags[0]);
  return first ? `${first.labelZh} · ${first.labelEn}` : law.categoryZh;
}

import type { DifficultyLevel } from '../types';

export interface MicroexpressionCatalogEntry {
  lawId: string;
  codeId: string;
  actionUnitCode: string;
  titleZh: string;
  titleEn: string;
  category: '认知' | '情绪' | '社会' | '行为';
  categoryRank: number;
  difficulty: DifficultyLevel;
  researcher: string;
  year: number;
  observableSigns: string[];
  corePrinciple: string;
  limitations: string;
  source: string;
}

export const MICROEXPRESSION_CATALOG: MicroexpressionCatalogEntry[] = [
  {
    lawId: 'ml-001',
    codeId: 'ML001',
    actionUnitCode: 'FACS 总纲',
    titleZh: '面部动作编码系统原理',
    titleEn: 'Facial Action Coding System',
    category: '认知',
    categoryRank: 1,
    difficulty: 'Easy',
    researcher: 'Paul Ekman and Wallace V. Friesen',
    year: 1978,
    observableSigns: ['眉部运动', '眼睑运动', '嘴部运动', '下颌运动'],
    corePrinciple:
      'FACS 是一种基于面部解剖学的观察和编码系统，将可见面部运动分解为动作单元（Action Units），只客观描述肌肉发生了什么动作，而不是直接读取人的思想或情绪。',
    limitations: '动作编码本身不能证明特定情绪、真实意图或是否在撒谎。',
    source: 'Ekman & Friesen, Facial Action Coding System, 1978',
  },
  {
    lawId: 'ml-002',
    codeId: 'ML002',
    actionUnitCode: 'AU1',
    titleZh: '眉毛内侧上提动作',
    titleEn: 'Inner Brow Raiser',
    category: '情绪',
    categoryRank: 1,
    difficulty: 'Easy',
    researcher: 'Paul Ekman and Wallace V. Friesen',
    year: 1978,
    observableSigns: ['眉毛内侧上移', '眉间区域形态改变'],
    corePrinciple:
      'FACS 将眉毛靠近鼻梁的内侧端上提编码为 AU1，涉及额肌内侧部分收缩。常见于担忧、悲伤或求助相关表情，但不能仅凭 AU1 判断一个人正在悲伤。',
    limitations: 'AU1 是动作描述，不是情绪诊断。',
    source: 'FACS, Ekman & Friesen, 1978',
  },
  {
    lawId: 'ml-003',
    codeId: 'ML003',
    actionUnitCode: 'AU2',
    titleZh: '眉毛外侧上提动作',
    titleEn: 'Outer Brow Raiser',
    category: '认知',
    categoryRank: 2,
    difficulty: 'Medium',
    researcher: 'Paul Ekman and Wallace V. Friesen',
    year: 1978,
    observableSigns: ['眉毛外侧上移', '眉形弧度改变'],
    corePrinciple:
      'FACS 将眉毛靠近太阳穴的外侧端上提编码为 AU2，主要由额肌外侧部分驱动。它可与其他动作组合出现，单独出现时不能确定惊讶、恐惧或怀疑。',
    limitations: '需要结合其他面部动作与具体对话情境。',
    source: 'FACS, Ekman & Friesen, 1978',
  },
  {
    lawId: 'ml-004',
    codeId: 'ML004',
    actionUnitCode: 'AU4',
    titleZh: '眉毛与眉间区域下压',
    titleEn: 'Brow Lowerer',
    category: '情绪',
    categoryRank: 2,
    difficulty: 'Easy',
    researcher: 'Paul Ekman and Wallace V. Friesen',
    year: 1978,
    observableSigns: ['眉毛向下移动', '眉间出现纵向皱纹'],
    corePrinciple:
      'FACS 将皱眉肌及相关肌肉牵引眉毛向中线向下移动编码为 AU4。它常见于专注、愤怒、困惑、强光刺激或高认知负荷任务等多种情境。',
    limitations: '皱眉不等于愤怒，也可能来自视觉调节或高负荷认知任务。',
    source: 'FACS, Ekman & Friesen, 1978',
  },
  {
    lawId: 'ml-005',
    codeId: 'ML005',
    actionUnitCode: 'AU5',
    titleZh: '上眼睑抬升动作',
    titleEn: 'Upper Lid Raiser',
    category: '认知',
    categoryRank: 3,
    difficulty: 'Medium',
    researcher: 'Paul Ekman and Wallace V. Friesen',
    year: 1978,
    observableSigns: ['上眼睑抬升', '眼睛睁开程度增加'],
    corePrinciple:
      'FACS 将提上睑肌收缩使上眼睑向眉弓抬升、眼睛睁大编码为 AU5。可与惊讶、恐惧或注意力突发改变同时出现，但不能独立确定情绪。',
    limitations: '环境光线、注视目标距离与个人眼睑结构均会影响外观。',
    source: 'FACS, Ekman & Friesen, 1978',
  },
  {
    lawId: 'ml-006',
    codeId: 'ML006',
    actionUnitCode: 'AU6',
    titleZh: '脸颊抬升与眼周动作',
    titleEn: 'Cheek Raiser',
    category: '情绪',
    categoryRank: 3,
    difficulty: 'Medium',
    researcher: 'Paul Ekman and Wallace V. Friesen',
    year: 1978,
    observableSigns: ['脸颊上提', '眼周皮肤收紧', '眼角形态改变'],
    corePrinciple:
      'FACS 将眼轮匝肌眼眶部收缩使脸颊上提、眼角皮肤收紧起纹编码为 AU6。虽常伴随愉悦性微笑，但也可被练习调用，并非判断真实快乐的绝对标准。',
    limitations: '年龄、眼部结构、强光眯眼及刻意表演均会影响 AU6 表现。',
    source: 'FACS, Ekman & Friesen, 1978',
  },
  {
    lawId: 'ml-007',
    codeId: 'ML007',
    actionUnitCode: 'AU12',
    titleZh: '嘴角上扬动作',
    titleEn: 'Lip Corner Puller',
    category: '社会',
    categoryRank: 2,
    difficulty: 'Easy',
    researcher: 'Paul Ekman and Wallace V. Friesen',
    year: 1978,
    observableSigns: ['嘴角向上移动', '唇部轮廓改变'],
    corePrinciple:
      'FACS 将颧大肌主导的嘴角向外上方提拉编码为 AU12。微笑常用于礼貌、社交沟通、尴尬缓冲或安抚，不能把所有微笑都视为快乐或赞同。',
    limitations: '仅凭 AU12 不足以区分愉悦微笑和礼貌社交微笑。',
    source: 'FACS, Ekman & Friesen, 1978',
  },
  {
    lawId: 'ml-008',
    codeId: 'ML008',
    actionUnitCode: 'AU15',
    titleZh: '嘴角向下拉动动作',
    titleEn: 'Lip Corner Depressor',
    category: '情绪',
    categoryRank: 4,
    difficulty: 'Easy',
    researcher: 'Paul Ekman and Wallace V. Friesen',
    year: 1978,
    observableSigns: ['嘴角向下移动', '嘴部轮廓改变'],
    corePrinciple:
      'FACS 将降口角肌下拉双侧嘴角编码为 AU15。在部分悲伤表情中可观察到，但也极易受说话咬字、习惯性静息面肌下垂及其他动作影响。',
    limitations: '不能仅凭嘴角下垂就推断悲伤、沮丧或失望。',
    source: 'FACS, Ekman & Friesen, 1978',
  },
  {
    lawId: 'ml-009',
    codeId: 'ML009',
    actionUnitCode: 'Meta (138 项研究)',
    titleZh: '面部反馈假说',
    titleEn: 'Facial Feedback Hypothesis',
    category: '行为',
    categoryRank: 1,
    difficulty: 'Hard',
    researcher: 'Nicholas A. Coles, Jeff T. Larsen and Heather C. Lench',
    year: 2019,
    observableSigns: ['面部肌肉活动变化', '主观情绪体验变化'],
    corePrinciple:
      '面部反馈假说认为面部肌肉活动产生的本体感觉反馈可微调主观情绪体验。2019 年涵盖 138 项研究（286 个效应量）的荟萃分析发现总体效应较小且因条件而异，不能视为确定的情绪控制开关。',
    limitations: '整体效应量较小且存在显著异质性，强笑无法替代实际压力处理。',
    source: 'Psychological Bulletin, DOI: 10.1037/bul0000194',
  },
  {
    lawId: 'ml-010',
    codeId: 'ML010',
    actionUnitCode: 'PSPI 解码边界综述',
    titleZh: '面部表情与情绪之间并非一一对应',
    titleEn: 'Facial Expression Emotion Mapping Limitation',
    category: '社会',
    categoryRank: 1,
    difficulty: 'Hard',
    researcher: 'Lisa Feldman Barrett, Ralph Adolphs et al.',
    year: 2019,
    observableSigns: ['同一情绪在不同情境下的多变面部动作', '同一面部动作在不同语境下的多重含义'],
    corePrinciple:
      'Barrett 等人（2019）发表于《PSPI》的综合综述指出，面部肌肉运动与情绪状态之间并非固定的一一对应密码本，同一情绪表达多变且高度依赖情境与文化，须以客观证据与语境优先。',
    limitations: '不存在跨文化、跨情境 100% 精准读心或测谎的固定表情字典。',
    source: 'PSPI, DOI: 10.1177/1529100619832930',
  },
];

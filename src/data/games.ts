import { GameDefinition } from '../types';

export const PSYCHOLOGY_GAMES: GameDefinition[] = [
  {
    id: 'memory-lab',
    name: 'Memory Lab',
    nameEn: 'Spatial & Sequence Memory',
    nameZh: '记忆宫殿矩阵',
    description: '强化空间布局与序列记忆能力，训练工作记忆容量（Working Memory）突破米勒 7±2 定律。',
    category: '记忆',
    difficulty: 'Medium',
    bestScore: 8450,
    icon: 'brain',
    estimatedTime: '60秒',
    conceptLearned: '工作记忆容量与空间网格编码（Spatial Grid Cells）',
    relatedLawId: 'primacy-effect',
    accentColor: '#6C4CF1'
  } as any,
  {
    id: 'mind-trap',
    name: 'Mind Trap',
    nameEn: 'Cognitive Bias & Stroop Conflict',
    nameZh: '思维陷阱解密',
    description: '破解大脑自动化的思维直觉捷径，化解斯特鲁普效应冲突与认知盲区。',
    category: '逻辑',
    difficulty: 'Hard',
    bestScore: 5210,
    icon: 'zap',
    estimatedTime: '45秒',
    conceptLearned: '双系统理论（System 1 vs System 2）与抑制控制（Inhibitory Control）',
    relatedLawId: 'stroop-effect',
    accentColor: '#E11D48'
  } as any,
  {
    id: 'brain-rush',
    name: 'Brain Rush',
    nameEn: 'Selective Attention Storm',
    nameZh: '注意力风暴',
    description: '在高速视觉刺激与干扰物中保持绝对专注，训练神经反应时与选择性注意过滤网。',
    category: '注意力',
    difficulty: 'Easy',
    bestScore: 12050,
    icon: 'sparkles',
    estimatedTime: '30秒',
    conceptLearned: '选择性注意与鸡尾酒会过滤机制（Broadbent Filter Model）',
    relatedLawId: 'cocktail-party-effect',
    accentColor: '#10B981'
  } as any,
  {
    id: 'mind-detective',
    name: 'Mind Detective',
    nameEn: 'Social Perception & Heuristics',
    nameZh: '心理侦探',
    description: '深入微表情、旁观者效应与光环效应伪装，从证人陈述与行为线索中辨析真实动机。',
    category: '决策',
    difficulty: 'Medium',
    bestScore: 6800,
    icon: 'search',
    estimatedTime: '90秒',
    conceptLearned: '社会知觉与启发式归因偏误（Attribution Bias）',
    relatedLawId: 'halo-effect',
    accentColor: '#F59E0B'
  } as any,
  {
    id: 'psych-experiment',
    name: 'Psych Experiment',
    nameEn: 'Interactive Classic Psychology Lab',
    nameZh: '经典心理实验模拟器',
    description: '亲身体验卡尼曼前景理论、选择过载、蔡格尼克效应等划时代行为经济学经典实验。',
    category: '心理实验',
    difficulty: 'Easy',
    bestScore: 9200,
    icon: 'flask-conical',
    estimatedTime: '120秒',
    conceptLearned: '行为经济学与前景理论（Prospect Theory）',
    relatedLawId: 'zeigarnik-effect',
    accentColor: '#3B82F6'
  } as any
];

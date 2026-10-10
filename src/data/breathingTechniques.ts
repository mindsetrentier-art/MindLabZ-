export type BreathingPhase = 'inhale' | 'hold-in' | 'exhale' | 'hold-out';

export interface BreathingPhaseConfig {
  phase: BreathingPhase;
  nameZh: string;
  nameEn: string;
  durationSec: number;
  promptZh: string;
  promptEn: string;
  colorClass: string;
}

export interface BreathingTechnique {
  id: string;
  nameZh: string;
  nameEn: string;
  subtitleZh: string;
  category: '放松减压' | '高度专注' | '情绪谐振' | '快速唤醒';
  badge: string;
  description: string;
  scientificOrigin: string;
  recommendedDurationMin: number; // e.g. 1, 3, 5
  phases: BreathingPhaseConfig[];
  totalCycleSec: number;
  benefits: string[];
}

export const BREATHING_TECHNIQUES: BreathingTechnique[] = [
  {
    id: '4-7-8',
    nameZh: '4-7-8 深度舒缓呼吸',
    nameEn: '4-7-8 Relaxing Breath',
    subtitleZh: '天然副交感神经镇静剂',
    category: '放松减压',
    badge: '减压助眠',
    description: '通过极度延长的呼气与深层屏息，向脑干发送安全信号，强效抑制战或逃反应，化解焦虑紧绷。',
    scientificOrigin: '哈佛医学院整合医学先驱安德鲁·韦尔（Dr. Andrew Weil）临床验证',
    recommendedDurationMin: 3,
    totalCycleSec: 19,
    benefits: ['迅速减缓心率与血压', '平息急性焦虑与杂念风暴', '促进入睡与深层身心放松'],
    phases: [
      {
        phase: 'inhale',
        nameZh: '吸气',
        nameEn: 'Inhale',
        durationSec: 4,
        promptZh: '用鼻子轻柔深吸，感受横膈膜与腹部自然隆起',
        promptEn: 'Breathe in quietly through nose',
        colorClass: 'from-teal-500 to-emerald-600',
      },
      {
        phase: 'hold-in',
        nameZh: '屏息',
        nameEn: 'Hold',
        durationSec: 7,
        promptZh: '安住于充盈的静谧中，感知内在能量与心跳',
        promptEn: 'Hold the breath peacefully',
        colorClass: 'from-amber-500 to-yellow-600',
      },
      {
        phase: 'exhale',
        nameZh: '呼气',
        nameEn: 'Exhale',
        durationSec: 8,
        promptZh: '嘴唇微张，发出温和的微风声，缓缓吐净全部杂念',
        promptEn: 'Whoosh completely through mouth',
        colorClass: 'from-indigo-500 to-violet-600',
      },
    ],
  },
  {
    id: 'box-breathing',
    nameZh: '4-4-4-4 箱式战术呼吸',
    nameEn: 'Box Breathing (Square)',
    subtitleZh: '特种部队战术高压冷静法',
    category: '高度专注',
    badge: '战术专注',
    description: '四个等长阶段构建稳定的四维心智屏障，迅速降低皮质醇水平，在压力风暴中重获沉着决断力。',
    scientificOrigin: '美军海豹突击队（Navy SEALs）核心高压自律心理训练法',
    recommendedDurationMin: 3,
    totalCycleSec: 16,
    benefits: ['高压环境下快速镇定', '提升执行功能与工作记忆', '平衡自主神经系统两端'],
    phases: [
      {
        phase: 'inhale',
        nameZh: '吸气',
        nameEn: 'Inhale',
        durationSec: 4,
        promptZh: '平稳深吸气，让充沛清新的空气盈满胸腔',
        promptEn: 'Inhale slowly and steadily',
        colorClass: 'from-blue-500 to-cyan-600',
      },
      {
        phase: 'hold-in',
        nameZh: '屏息',
        nameEn: 'Hold',
        durationSec: 4,
        promptZh: '保持胸腔充盈，平静注视当下的专注与澄澈',
        promptEn: 'Hold lungs full with composure',
        colorClass: 'from-indigo-500 to-blue-600',
      },
      {
        phase: 'exhale',
        nameZh: '呼气',
        nameEn: 'Exhale',
        durationSec: 4,
        promptZh: '匀速平缓呼出，释放多余的防御与紧绷',
        promptEn: 'Exhale smoothly and completely',
        colorClass: 'from-violet-500 to-purple-600',
      },
      {
        phase: 'hold-out',
        nameZh: '静息',
        nameEn: 'Rest',
        durationSec: 4,
        promptZh: '保持空虚停顿，体会内在虚怀若谷的定力',
        promptEn: 'Hold lungs empty in deep still',
        colorClass: 'from-stone-600 to-stone-800',
      },
    ],
  },
  {
    id: 'coherent-5-5',
    nameZh: '5.5s 共振相干呼吸',
    nameEn: 'Coherent Breathing (HRV)',
    subtitleZh: '心脑电生理谐振黄金节律',
    category: '情绪谐振',
    badge: '心率谐振',
    description: '每分钟约 5.5 次呼吸，让心率变异性（HRV）、血压波与大脑α波实现物理共振，进入最优心流状态。',
    scientificOrigin: '《呼吸的奇迹》（Breath）与心率变异性生物反馈医学研究',
    recommendedDurationMin: 5,
    totalCycleSec: 11,
    benefits: ['心率变异性（HRV）最大化', '优化脑供血与神经可塑性', '建立温和稳定的情绪基线'],
    phases: [
      {
        phase: 'inhale',
        nameZh: '吸气',
        nameEn: 'Inhale',
        durationSec: 5.5,
        promptZh: '悠长平滑吸气，如涨潮般让波澜缓缓扬起',
        promptEn: 'Slow rising tidal wave',
        colorClass: 'from-emerald-500 to-teal-600',
      },
      {
        phase: 'exhale',
        nameZh: '呼气',
        nameEn: 'Exhale',
        durationSec: 5.5,
        promptZh: '轻柔均匀呼出，如退潮般带走一切纷扰',
        promptEn: 'Gentle receding ebb tide',
        colorClass: 'from-teal-600 to-cyan-700',
      },
    ],
  },
  {
    id: 'vagus-4-2-6',
    nameZh: '4-2-6 迷走神经平复呼吸',
    nameEn: 'Vagus Nerve Reset (4-2-6)',
    subtitleZh: '认知手记与研习前的温柔预热',
    category: '情绪谐振',
    badge: '思绪温和',
    description: '温和延长呼气至吸气的 1.5 倍，启动心脏减速与迷走神经刹车，最适合在开启认知手记前清除心智噪音。',
    scientificOrigin: '多迷走神经理论（Polyvagal Theory, Stephen Porges）',
    recommendedDurationMin: 2,
    totalCycleSec: 12,
    benefits: ['阻断思维反刍与焦虑杂念', '提升主观幸福感与自悯心态', '心智手记与复盘的最佳预热'],
    phases: [
      {
        phase: 'inhale',
        nameZh: '吸气',
        nameEn: 'Inhale',
        durationSec: 4,
        promptZh: '深柔吸气，接纳当下的每一丝觉知',
        promptEn: 'Gently breathe in with openness',
        colorClass: 'from-amber-500 to-orange-600',
      },
      {
        phase: 'hold-in',
        nameZh: '静止',
        nameEn: 'Pause',
        durationSec: 2,
        promptZh: '短暂停留，允许身心完全放松',
        promptEn: 'Gentle pause in safety',
        colorClass: 'from-stone-500 to-stone-700',
      },
      {
        phase: 'exhale',
        nameZh: '呼气',
        nameEn: 'Exhale',
        durationSec: 6,
        promptZh: '悠长呼气，如同给大脑洗一个温暖的热水澡',
        promptEn: 'Long soothing outbreath',
        colorClass: 'from-rose-500 to-pink-600',
      },
    ],
  },
];

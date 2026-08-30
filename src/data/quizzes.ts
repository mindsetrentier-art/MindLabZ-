import { QuizQuestion } from '../types';

export const RAPID_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    category: '认知',
    question: '以下哪一项属于典型的“认知偏差（Cognitive Bias）”？',
    options: ['锚定效应', '光合作用', '万有引力', '牛顿第二定律'],
    correctAnswer: 0,
    explanation: '锚定效应是指在决策时过度依赖第一笔信息的心理学认知偏差，其他选项属于自然科学物理或生物学规律。',
    difficulty: 'Easy',
    relatedLawId: 'anchoring-effect'
  },
  {
    id: 'q2',
    category: '记忆',
    question: '为什么电视剧总在每一集最精彩处戛然而止让你整夜难忘？',
    options: ['蔡格尼克效应（未完成任务持续激活记忆）', '光环效应（主角太耀眼）', '破窗效应（剧情失控）', '从众效应（大家都在看）'],
    correctAnswer: 0,
    explanation: '蔡格尼克效应表明大脑对未闭环的任务保持极高神经张力与深刻记忆。',
    difficulty: 'Easy',
    relatedLawId: 'zeigarnik-effect'
  },
  {
    id: 'q3',
    category: '决策',
    question: '买了一张不好看的电影票，强忍恶心也要坐在电影院看完，体现了什么心理陷阱？',
    options: ['沉没成本谬误', '可得性启发', '近因效应', '首因效应'],
    correctAnswer: 0,
    explanation: '沉没成本是指已经发生且不可收回的付出，理性人应当看边际收益，而非为已经发生的损失继续买单。',
    difficulty: 'Easy',
    relatedLawId: 'sunk-cost-fallacy'
  },
  {
    id: 'q4',
    category: '决策',
    question: '某酸奶标明“95%脱脂”比标明“含5%脂肪”更受欢迎，这种现象被称为：',
    options: ['框架效应', '达克效应', '旁观者效应', '皮格马利翁效应'],
    correctAnswer: 0,
    explanation: '框架效应是指同一个客观事实仅仅因为表达方式（积极获益或消极损失）不同，引发截然相反的情绪与决策。',
    difficulty: 'Easy',
    relatedLawId: 'framing-effect'
  },
  {
    id: 'q5',
    category: '认知',
    question: '自己亲手拼装的宜家储物盒，即使装得歪歪扭扭也觉得比买现成的更好，属于：',
    options: ['宜家效应', '从众效应', '首因效应', '锚定效应'],
    correctAnswer: 0,
    explanation: '宜家效应揭示了人们对亲手投入劳动创造的物品会赋予远超其实际市场价值的情感溢价。',
    difficulty: 'Easy',
    relatedLawId: 'ikea-effect'
  },
  {
    id: 'q6',
    category: '社会',
    question: '在熙熙攘攘的广场上有人突发意外，周围目击者众多但往往无人主动上前救助，原因是：',
    options: ['旁观者效应与责任分散', '聚光灯效应', '沉没成本', '斯特鲁普效应'],
    correctAnswer: 0,
    explanation: '现场旁观者越多，每个人的个体责任感越被稀释（责任分散），叠加观察他人反应形成的多元无知。',
    difficulty: 'Medium',
    relatedLawId: 'bystander-effect'
  },
  {
    id: 'q7',
    category: '情绪',
    question: '宜家在顾客离开出口时提供极便宜的1元冰淇淋，给整趟购物体验画上圆满句号，符合：',
    options: ['峰终定律（Peak-End Rule）', '沉没成本', '光环效应', '首因效应'],
    correctAnswer: 0,
    explanation: '大脑记忆一段经历主要取决于峰值体验（Peak）和结尾体验（End），而非全过程的数学平均值。',
    difficulty: 'Medium',
    relatedLawId: 'peak-end-rule'
  },
  {
    id: 'q8',
    category: '认知',
    question: '“一知半解的人往往最盲目狂妄，高手往往谦逊谨慎”，这描述的认知心理曲线是：',
    options: ['达克效应（Dunning-Kruger Effect）', '蔡格尼克效应', '框架效应', '近因效应'],
    correctAnswer: 0,
    explanation: '达克效应指出缺乏元认知能力的新手无法识别自身的无知，因而身处“愚昧之巅”。',
    difficulty: 'Easy',
    relatedLawId: 'dunning-kruger-effect'
  },
  {
    id: 'q9',
    category: '社会',
    question: '衣服上不小心蹭到一滴微小墨渍，就感觉整个办公室的人都在盯着自己看，这属于：',
    options: ['聚光灯效应', '光环效应', '鸡尾酒会效应', '霍桑效应'],
    correctAnswer: 0,
    explanation: '聚光灯效应是自我中心偏误的表现，人们常常成倍高估外界对自己的关注度。',
    difficulty: 'Easy',
    relatedLawId: 'spotlight-effect'
  },
  {
    id: 'q10',
    category: '认知',
    question: '在嘈杂的晚宴上能立刻精准捕捉到远处有人叫自己的名字，这种神经注意机制是：',
    options: ['鸡尾酒会效应（选择性注意过滤）', '斯特鲁普冲突', '首因效应', '沉没成本'],
    correctAnswer: 0,
    explanation: '鸡尾酒会效应展现了大脑听觉皮层在无意识层面的高效背景分析与关键自指线索穿透能力。',
    difficulty: 'Medium',
    relatedLawId: 'cocktail-party-effect'
  },
  {
    id: 'q11',
    category: '决策',
    question: '丢了100块钱的痛苦需要捡到多少钱的快乐才能大致抵消？',
    options: ['约200~250元（损失厌恶不对称性）', '恰好100元', '50元', '1000元以上'],
    correctAnswer: 0,
    explanation: '前景理论测算人类损失厌恶系数约为2.0~2.5，对失去的敏感度远超同等收益。',
    difficulty: 'Medium',
    relatedLawId: 'loss-aversion'
  },
  {
    id: 'q12',
    category: '决策',
    question: '超市摆放24种果酱时试吃人数很多但购买率仅3%，精简到6种后果酱购买率飙升至30%，这是：',
    options: ['选择过载效应（Choice Overload）', '锚定效应', '从众效应', '首因效应'],
    correctAnswer: 0,
    explanation: '选项过多导致认知负荷超载与机会成本焦虑，引发分析瘫痪与决策回避。',
    difficulty: 'Easy',
    relatedLawId: 'choice-overload'
  }
];

export const DAILY_CHALLENGE_QUESTIONS: QuizQuestion[] = [
  ...RAPID_QUIZ_QUESTIONS.slice(0, 10)
];

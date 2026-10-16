import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, RotateCcw, Search, Sparkles, CheckCircle2, ShieldAlert, Award, FileText, Flame, ShieldCheck, Crown, Play, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { GameDifficulty, DIFFICULTY_CONFIGS, DIFFICULTY_LIST, shuffleArray } from '../../data/difficulty';
import { DifficultySelector } from './DifficultySelector';
import { GameHeaderHud } from './GameHeaderHud';
import { gameAudio } from '../../utils/gameAudio';

interface DetectiveCase {
  id: string;
  title: string;
  scenario: string;
  evidence: { icon: string; title: string; detail: string }[];
  question: string;
  options: { label: string; biasId: string; isCorrect: boolean; explanation: string }[];
  lawLearned: string;
  lawId: string;
}

const ALL_CASES: DetectiveCase[] = [
  {
    id: 'case-halo',
    title: '悬案：明星高管的投资疑云',
    scenario: '某科技公司在聘请了一位外表极具魅力、毕业于名校、谈吐风度翩翩的CEO之后，董事会几乎未经详细财务审计，便全票通过了他提出的一项高风险海外收购案。半年后该项目爆雷损失数亿元。',
    evidence: [
      { icon: '✨', title: '外貌与名校光环', detail: '董事会成员访谈时反复强调“他看起来就是那种不可多得的商业领袖”。' },
      { icon: '📑', title: '缺乏实质数据支撑', detail: '项目尽调报告中漏洞百出，但没有任何一位高管提出质疑。' },
      { icon: '👔', title: '单一特征扩散', detail: '大家潜意识认为谈吐自信者在财务风控上也一定极度严谨。' }
    ],
    question: '作为心理侦探，你判断董事会主要陷入了哪种社会心理学偏差？',
    options: [
      { label: '光环效应（Halo Effect）', biasId: 'halo-effect', isCorrect: true, explanation: '人们将外貌与风度的单一积极特征，无意识扩散到对其商业严谨度与道德操守的全面高评。' },
      { label: '蔡格尼克效应', biasId: 'zeigarnik-effect', isCorrect: false, explanation: '蔡格尼克效应涉及未完成任务的记忆唤醒，与人际评价偏差无关。' },
      { label: '选择过载效应', biasId: 'choice-overload', isCorrect: false, explanation: '本案并不存在选项过多导致瘫痪的情况。' },
      { label: '首因效应', biasId: 'primacy-effect', isCorrect: false, explanation: '首因效应虽然涉及初始印象，但本案核心机制是把表面魅力泛化到专业审计领域的光环投射。' }
    ],
    lawLearned: '光环效应与人际认知偏见',
    lawId: 'halo-effect'
  },
  {
    id: 'case-bystander',
    title: '悬案：大厦火警下的沉默走廊',
    scenario: '某写字楼突发火警警报，走廊中浓烟渐起。公共办公区有 40 名员工，大家虽然都听到了警报，但看到身边的同事依然坐在工位上敲键盘，所有人便都选择继续等待，最终延误了最佳逃生时间。',
    evidence: [
      { icon: '👥', title: '集体相互张望', detail: '每个人内心都很紧张，但都在观察别人的反应以评估严重性（多元无知）。' },
      { icon: '🌫️', title: '责任被稀释', detail: '“这么多人都在，真有危险肯定有人带头跑。”（责任分散）。' },
      { icon: '🔔', title: '从众抑制了主动行动', detail: '没人愿意成为第一个站起来显得惊慌失措的人。' }
    ],
    question: '这起延误逃生事件背后最核心的心理学机制是：',
    options: [
      { label: '旁观者效应与多元无知', biasId: 'bystander-effect', isCorrect: true, explanation: '在群体中，个体的责任被分散，同时受周围人镇定表象误导（多元无知），导致无人主动介入。' },
      { label: '近因效应', biasId: 'recency-effect', isCorrect: false, explanation: '近因效应关乎短期记忆序列位置，并非群体危机干预。' },
      { label: '沉没成本谬误', biasId: 'sunk-cost-fallacy', isCorrect: false, explanation: '本案不涉及已沉没不可收回的资金与努力追加。' },
      { label: '聚光灯效应', biasId: 'spotlight-effect', isCorrect: false, explanation: '聚光灯效应指高估他人对自己的注意，而本案是典型的群体责任分散与多元无知。' }
    ],
    lawLearned: '旁观者效应与危机干预心理',
    lawId: 'bystander-effect'
  },
  {
    id: 'case-sunk-cost',
    title: '悬案：濒临破产的代码黑洞',
    scenario: '某团队耗时 18 个月花光 200 万天使轮融资，市场数据表明用户留存为零。CTO明知产品没有未来，却抵押房产追加 100 万，坚称“已经付出了这么多心血，现在放弃就全打水漂了”。',
    evidence: [
      { icon: '⏳', title: '18个月沉没时光', detail: '团队最常挂在嘴边的话是“我们已经付出了这么多，绝不能中途放弃”。' },
      { icon: '💸', title: '200万既往投入', detail: '决策出发点不是未来期望盈利，而是对过去沉没资金的舍不得。' },
      { icon: '🚪', title: '理性止损缺失', detail: '未能认清过去的损失已经无法挽回，边际收益已为负数。' }
    ],
    question: 'CTO 在做出追加抵押房产决策时，被哪种认知陷阱套牢？',
    options: [
      { label: '沉没成本谬误（Sunk Cost Fallacy）', biasId: 'sunk-cost-fallacy', isCorrect: true, explanation: '被已经发生且不可收回的过去付出所绑架，在未来决策中持续做出非理性追加投入。' },
      { label: '斯特鲁普效应', biasId: 'stroop-effect', isCorrect: false, explanation: '斯特鲁普效应是颜色字义冲突的注意抑制，与长期投资决策无关。' },
      { label: '宜家效应', biasId: 'ikea-effect', isCorrect: false, explanation: '虽有自己动手付出的情感溢价，但驱动继续亏损决策的核心机制是沉没成本厌恶。' },
      { label: '达克效应', biasId: 'dunning-kruger', isCorrect: false, explanation: '达克效应是能力不足者过度自信，本案CTO已清楚产品不佳但因舍不得沉没成本而拒绝止损。' }
    ],
    lawLearned: '沉没成本谬误与止损智慧',
    lawId: 'sunk-cost-fallacy'
  },
  {
    id: 'case-anchoring',
    title: '悬案：专柜橱窗里的天价风衣',
    scenario: '奢侈品店门口橱窗赫然陈列着一件标价 38,888 元的手工大衣，进店顾客大多望而却步。然而，当顾客移步店内看到货架上一件标价 4,200 元的普通羊毛外套时，反而觉得“性价比极高”并欣然买单。',
    evidence: [
      { icon: '🏷️', title: '第一参考数字', detail: '38,888 元作为先验锚点牢牢钉在顾客心智中。' },
      { icon: '⚖️', title: '相对价值失真', detail: '4,200 元在绝对价格上并不便宜，但与 38,888 元对比时显得平易近人。' },
      { icon: '🎯', title: '非卖品战略', detail: '橱窗大衣实际上很少成交，其主要使命是调整进店顾客的心理参照系。' }
    ],
    question: '店内羊毛外套畅销主要归功于哪种启发式认知偏差？',
    options: [
      { label: '锚定效应（Anchoring Effect）', biasId: 'anchoring-effect', isCorrect: true, explanation: '第一眼看到的极高标价充当了心理锚点，后续的所有价值判断都受此前置数字的强烈牵引。' },
      { label: '巴纳姆效应', biasId: 'barnum-effect', isCorrect: false, explanation: '巴纳姆效应适用于模糊通用性格描述的自我认同，与定价锚定无关。' },
      { label: '蔡格尼克效应', biasId: 'zeigarnik-effect', isCorrect: false, explanation: '与未完成任务记忆机制无关。' },
      { label: '双盲偏差', biasId: 'double-blind', isCorrect: false, explanation: '双盲实验是科研方法，并非消费启发式锚定。' }
    ],
    lawLearned: '锚定效应与定价心理学',
    lawId: 'anchoring-effect'
  },
  {
    id: 'case-conjunction',
    title: '悬案：环保志愿者的职业之谜',
    scenario: '琳达 31 岁，单身、坦率且极度聪明。大学时主修哲学，曾深切关注歧视与社会正义，并多次参加反核抗议游行。受试者被问及琳达最可能是以下哪种情况？85% 的人选择了“琳达是一名银行出纳员并且积极参与女权运动”。',
    evidence: [
      { icon: '🧩', title: '描述引发具象联想', detail: '丰富的背景细节让“女权主义者”的形象极其生动典型。' },
      { icon: '📐', title: '概率基本公理违背', detail: '事件A与B同时发生的概率，绝不可能大于事件A单独发生的概率：P(出纳 ∩ 女权) ≤ P(出纳)。' },
      { icon: '🧠', title: '代表性启发式越界', detail: '大脑误将“描述的典型匹配度”当成了“统计学概率”。' }
    ],
    question: '大部分人在推断琳达的身份时陷入了卡尼曼著名的哪种统计逻辑陷阱？',
    options: [
      { label: '合取谬误（Conjunction Fallacy）', biasId: 'conjunction-fallacy', isCorrect: true, explanation: '人们直觉认为两个细节同时发生的“典型场景”更可能，却违背了交集概率不大于单项概率的基本公理。' },
      { label: '证实偏差', biasId: 'confirmation-bias', isCorrect: false, explanation: '证实偏差是只搜集支持自己的证据，而合取谬误是将复合概率与单一概率混淆。' },
      { label: '幸存者偏差', biasId: 'survivorship-bias', isCorrect: false, explanation: '幸存者偏差是只看到幸存样本，与条件交集概率判断无关。' },
      { label: '霍桑效应', biasId: 'hawthorne-effect', isCorrect: false, explanation: '霍桑效应是被观察引发的行为改变，并非统计概率直觉偏差。' }
    ],
    lawLearned: '合取谬误与代表性启发式',
    lawId: 'conjunction-fallacy'
  },
  {
    id: 'case-confirmation',
    title: '悬案：神奇保健品的铁粉群',
    scenario: '某群老年人购买了一款高价“量子酸碱平衡粉”。当新闻报道质检不合格、多位消费者喝了无效应后，群里铁粉不仅不退货，反而大量分享“邻居老张喝了睡眠变好”的个例，坚信“这一定是黑心同行在抹黑神药”。',
    evidence: [
      { icon: '🔍', title: '选择性采信证据', detail: '积极收集符合自己既有信念的个案，对官方严谨实验报告视而不见。' },
      { icon: '🛡️', title: '信念防御与逆火', detail: '面对明确的反驳证据，反而激发出更强烈的护短心态（逆火效应）。' },
      { icon: '🔒', title: '信息茧房强化', detail: '群内互相求证强化了单一声音，排斥外界一切质疑。' }
    ],
    question: '这一群体在面对负面铁证时表现出的认知防御机制属于：',
    options: [
      { label: '证实偏差与动机性推理（Confirmation Bias）', biasId: 'confirmation-bias', isCorrect: true, explanation: '先有主观预设立场，只寻找支持自身预设的论据，并系统性过滤甚至曲解反面事实。' },
      { label: '安慰剂效应', biasId: 'placebo-effect', isCorrect: false, explanation: '安慰剂能改善生理感觉，但在此处拒绝接受质检事实的心理根源是证实偏差。' },
      { label: '超限效应', biasId: 'over-limit', isCorrect: false, explanation: '刺激过多引发不耐烦，与选择性证实预设不同。' },
      { label: '皮格马利翁效应', biasId: 'pygmalion-effect', isCorrect: false, explanation: '期望促成成长效应，与信息筛选辩护无关。' }
    ],
    lawLearned: '证实偏差与科学批判思维',
    lawId: 'confirmation-bias'
  },
  {
    id: 'case-fundamental-attribution',
    title: '悬案：急诊室前的疯狂加塞客',
    scenario: '早高峰主干道上，一辆黑色轿车连按喇叭、强行变道加塞并闯红灯。后方司机愤怒地咒骂：“这人真是个毫无素质、自私透顶的流氓渣滓！”但实际上，这名司机后座躺着刚突发心梗呼吸微弱的母亲，正争分夺秒赶往急诊。',
    evidence: [
      { icon: '🚗', title: '内部性格定性', detail: '旁观司机瞬间将加塞行为归因于对方的人品败坏、道德低下。' },
      { icon: '🏥', title: '情境因素彻底被无视', detail: '没有人意识到加塞者可能正面临万分紧急的外部突发状况。' },
      { icon: '🪞', title: '双标归因反差', detail: '如果是自己紧急赶时间变道，通常会解释为“我真是遇到紧急情况”，而非“我是个坏人”。' }
    ],
    question: '后方司机在评价加塞者时陷入了哪种经典社会心理学偏误？',
    options: [
      { label: '基本归因偏误（Fundamental Attribution Error）', biasId: 'fundamental-attribution-error', isCorrect: true, explanation: '在解释他人行为时，过度强调性格品行等内在因素，而严重低估外部情境与突发环境的决定性作用。' },
      { label: '自利偏差', biasId: 'self-serving-bias', isCorrect: false, explanation: '自利偏差是给自己成功归功、失败甩锅；解释他人行为时归咎内在是基本归因错误。' },
      { label: '投射效应', biasId: 'projection-effect', isCorrect: false, explanation: '投射效应是将自身欲望投射给他人，本案核心是对他人的情境低估与品格高估。' },
      { label: '首因效应', biasId: 'primacy-effect', isCorrect: false, explanation: '与首要印象记忆强化无直接关联。' }
    ],
    lawLearned: '基本归因偏误与同理心觉察',
    lawId: 'fundamental-attribution-error'
  },
  {
    id: 'case-dunning-kruger',
    title: '悬案：涂柠檬汁的无遮面劫匪',
    scenario: '美国匹兹堡一名男子大白天未戴任何面具抢劫了两家银行，并在监控摄像头前得意微笑。当警方当天下午将其抓获时，他无比震惊地脱口而出：“不可能！我明明在全脸涂满了柠檬汁隐形墨水啊！”',
    evidence: [
      { icon: '🍋', title: '可笑的伪科学认知', detail: '他听说柠檬汁能作隐形墨水加热显影，竟愚蠢地推断涂在脸上就能让摄像头拍不到。' },
      { icon: '📷', title: '绝对盲目自信', detail: '在未经过任何严谨验证前，对自己的“隐形神计”深信不疑。' },
      { icon: '📉', title: '不知道自己不知道', detail: '认知能力的极度匮乏，直接剥夺了他识别自己愚蠢的元认知能力。' }
    ],
    question: '这名劫匪展现的正是心理学史上著名的哪种现象？',
    options: [
      { label: '达克效应（Dunning-Kruger Effect）', biasId: 'dunning-kruger', isCorrect: true, explanation: '能力最欠缺的人，往往最缺乏评估自身能力的元认知机制，从而产生荒谬的虚假优越感。' },
      { label: '霍桑效应', biasId: 'hawthorne-effect', isCorrect: false, explanation: '霍桑效应是被观察时表现提升，本案是因无知而产生的极端盲目自信。' },
      { label: '阿伦森效应', biasId: 'aronson-effect', isCorrect: false, explanation: '涉及评价递增与人际好感，并非认知盲区与自我评估。' },
      { label: '皮格马利翁效应', biasId: 'pygmalion-effect', isCorrect: false, explanation: '他人的积极期望影响成长，与愚昧自信无关。' }
    ],
    lawLearned: '达克效应与元认知谦卑',
    lawId: 'dunning-kruger'
  },
  {
    id: 'case-pygmalion',
    title: '悬案：随机构建的“神童实验”',
    scenario: '心理学家罗森塔尔走进一所小学，对全校学生做了一次测验，随后递给教师一份“最具学术爆发潜力神童名单”。八个月后重测，名单上的学生成绩飞速飙升。然而真相是：名单完全是研究者闭着眼睛随机抓阄编造的！',
    evidence: [
      { icon: '🎲', title: '名单完全随机产生', detail: '入选者在智商与天资上与普通同学毫无统计学差异。' },
      { icon: '🌱', title: '教师潜意识行为转变', detail: '老师对名单学生给予了更多微笑、更耐心的等待解答和积极肯定。' },
      { icon: '🌟', title: '期望内化为现实能力', detail: '学生接收到外界强烈的信任信号，自信心增强并最终真成了优等生。' }
    ],
    question: '这份随机名单能产生惊人学术蜕变的核心秘密是：',
    options: [
      { label: '皮格马利翁效应（Pygmalion / Rosenthal Effect）', biasId: 'pygmalion-effect', isCorrect: true, explanation: '权威者真诚的积极期望，会通过微妙的行为信号传递给受众，最终重塑其行为与自我认同使期望成真。' },
      { label: '罗密欧与朱丽叶效应', biasId: 'romeo-juliet', isCorrect: false, explanation: '涉及受阻挠反而越坚定的逆反心理，与教育期望转化机制不同。' },
      { label: '锚定效应', biasId: 'anchoring-effect', isCorrect: false, explanation: '并非价格或量化基准牵引，而是期望与积极心理暗示的力量。' },
      { label: '选择性注意', biasId: 'selective-attention', isCorrect: false, explanation: '虽然教师注意有偏重，但催化学生能力蜕变的是深层的期望实现机制。' }
    ],
    lawLearned: '皮格马利翁效应与正面期望塑形',
    lawId: 'pygmalion-effect'
  },
  {
    id: 'case-availability',
    title: '悬案：空难新闻后的恐慌公路',
    scenario: '一起重大民航客机空难被电视与社交媒体连续整周铺天盖地报道。随后一个月内，数百万人因为恐惧放弃乘坐飞机，改为开车长途出行。然而交通部统计数据显示：开车每百万人公里的死亡风险是民航客机的 65 倍以上。',
    evidence: [
      { icon: '📺', title: '画面生动鲜明易提取', detail: '空难烈火与残骸的影像极具视觉冲击力，能在大脑中被瞬间唤起。' },
      { icon: '🚗', title: '对日常危险视而不见', detail: '车祸发生太平凡以至于不具新闻价值，导致人们误以为公路更安全。' },
      { icon: '🧠', title: '直觉提取难易度主导概率', detail: '大脑错误地把“回忆一件事情的容易程度”当成了“现实中发生的真实概率”。' }
    ],
    question: '大众因生动新闻而高估飞机危险、做出非理性出行决策的心理机制是：',
    options: [
      { label: '可得性启发式（Availability Heuristic）', biasId: 'availability-heuristic', isCorrect: true, explanation: '容易被大脑提取、具有鲜明情绪唤醒度的事件，会被系统性高估其发生概率。' },
      { label: '斯特鲁普效应', biasId: 'stroop-effect', isCorrect: false, explanation: '颜色字义冲突的视觉抑制，与宏观概率估算无关。' },
      { label: '沉没成本谬误', biasId: 'sunk-cost-fallacy', isCorrect: false, explanation: '不涉及过去不可回收资金的舍不得追加。' },
      { label: '晕轮效应', biasId: 'halo-effect', isCorrect: false, explanation: '涉及单一人格特质扩散，并非概率提取偏差。' }
    ],
    lawLearned: '可得性启发式与理性风险评估',
    lawId: 'availability-heuristic'
  }
];

export const MindDetectiveGame: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { recordGameResult } = useApp();

  const urlDiff = searchParams.get('difficulty') as GameDifficulty | null;
  const initialDiff: GameDifficulty = urlDiff && DIFFICULTY_LIST.includes(urlDiff) ? urlDiff : '中';

  const [difficulty, setDifficulty] = useState<GameDifficulty>(initialDiff);
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'finished'>('intro');
  const [activeCases, setActiveCases] = useState<DetectiveCase[]>([]);
  const [currentCaseIndex, setCurrentCaseIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [revealedExplanation, setRevealedExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);

  const diffConfig = DIFFICULTY_CONFIGS[difficulty];

  // Prepare cases on game start based on difficulty with FULL RANDOMIZATION
  const startSession = (selectedDiff: GameDifficulty = difficulty) => {
    // Number of cases by difficulty: 低: 3, 中: 4, 高: 5, 高级: 6
    const countMap: Record<GameDifficulty, number> = {
      '低': 3,
      '中': 4,
      '高': 5,
      '高级': 6,
    };

    const caseCount = countMap[selectedDiff];
    // 1. Randomly shuffle the whole case bank
    const shuffledCases = shuffleArray(ALL_CASES);
    const selectedCases = shuffledCases.slice(0, caseCount);

    // 2. Randomly shuffle the options of each case so correct answer is never at fixed position
    // For '低', keep 3 options; for '中', keep 3 options; for '高' & '高级', keep all 4 options
    const processedCases = selectedCases.map((c) => {
      let opts = [...c.options];
      if (selectedDiff === '低' || selectedDiff === '中') {
        // Keep correct answer + 2 random distractors
        const correct = opts.find((o) => o.isCorrect)!;
        const distractors = shuffleArray(opts.filter((o) => !o.isCorrect)).slice(0, 2);
        opts = shuffleArray([correct, ...distractors]);
      } else {
        opts = shuffleArray(opts);
      }
      return {
        ...c,
        options: opts,
      };
    });

    setActiveCases(processedCases);
    setCurrentCaseIndex(0);
    setSelectedOption(null);
    setRevealedExplanation(false);
    setScore(0);
    setCorrectCount(0);
    setCombo(0);
    setMaxCombo(0);
    setGameState('playing');
    gameAudio.playSuccess();
  };

  const currentCase = activeCases[currentCaseIndex];

  const handleSelectOption = (idx: number) => {
    if (revealedExplanation || !currentCase) return;
    setSelectedOption(idx);
    setRevealedExplanation(true);

    const isCorrect = currentCase.options[idx].isCorrect;
    const basePts = 2000;

    if (isCorrect) {
      gameAudio.playSuccess();
      const nextCombo = combo + 1;
      setCombo(nextCombo);
      setMaxCombo((prev) => Math.max(prev, nextCombo));
      setCorrectCount((prev) => prev + 1);

      const earned = Math.round((basePts + nextCombo * 300) * diffConfig.scoreMultiplier);
      setScore((prev) => prev + earned);
    } else {
      gameAudio.playMistake();
      setCombo(0);
      // In 高 or 高级, wrong answer incurs slight penalty
      if (difficulty === '高') {
        setScore((prev) => Math.max(0, prev - 400));
      } else if (difficulty === '高级') {
        setScore((prev) => Math.max(0, prev - 800));
      }
    }
  };

  const handleNext = () => {
    gameAudio.playTap();
    if (currentCaseIndex < activeCases.length - 1) {
      setCurrentCaseIndex((prev) => prev + 1);
      setSelectedOption(null);
      setRevealedExplanation(false);
    } else {
      gameAudio.playVictory();
      setGameState('finished');
    }
  };

  const handleFinish = () => {
    gameAudio.playTap();
    const total = activeCases.length;
    const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 50;
    const xpGained = Math.round((score / 20 + 150) * diffConfig.xpMultiplier);

    recordGameResult('mind-detective', {
      score,
      accuracy,
      reactionTime: 1100,
      xpGained,
      comboMax: maxCombo,
      conceptLearned: '社会知觉与启发式归因偏误（Attribution Bias & Heuristics）',
      lawId: 'halo-effect',
      difficulty,
    });

    navigate('/games');
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-[85vh] w-full max-w-lg mx-auto py-3 px-2 animate-fadeIn">
      {/* Game Header HUD */}
      <GameHeaderHud
        title="心理侦探 · 案卷审理"
        numberPrefix="CLASSIC"
        score={score}
        currentRound={currentCaseIndex + 1}
        totalRounds={activeCases.length || 5}
        difficulty={difficulty}
        comboCount={combo}
        onExit={() => (gameState === 'intro' ? navigate('/games') : setGameState('intro'))}
        onBack={() => (gameState === 'intro' ? navigate('/games') : setGameState('intro'))}
      />

      {gameState === 'intro' ? (
        <div className="w-full game-arcade-card rounded-3xl p-6 sm:p-8 border-amber-200/80 shadow-2xl space-y-6 relative overflow-hidden">
          {/* Ambient colorful glow */}
          <div className="absolute -top-16 -right-16 w-52 h-52 rounded-full bg-gradient-to-br from-amber-500/30 to-orange-500/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-52 h-52 rounded-full bg-gradient-to-br from-stone-500/20 to-amber-500/25 blur-3xl pointer-events-none" />

          <div className="relative text-center space-y-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-600 to-amber-700 text-white flex items-center justify-center mx-auto shadow-xl shadow-amber-500/30 ring-4 ring-amber-500/20 animate-subtleFloat">
              <Search className="w-10 h-10 drop-shadow-md text-amber-100" />
            </div>

            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 text-xs font-bold border border-amber-200">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>社会认知与动机侦查</span>
              </div>
              <h2 className="text-2xl font-black text-stone-900 tracking-tight font-serif-editorial">
                心理侦探 · 案卷审理
              </h2>
              <p className="text-xs text-stone-600 leading-relaxed max-w-sm mx-auto">
                从 10 部经典社会心理学疑难悬案中随机抽题，拆解行为假象、排除光环偏见，锁定真正驱使行动的心理学机制。
              </p>
            </div>
          </div>

          {/* Difficulty Setting */}
          <div className="space-y-2 pt-3 border-t border-amber-100 text-left">
            <label className="text-xs font-bold text-stone-800 block text-center">
              选择案卷推理难度：
            </label>
            <DifficultySelector value={difficulty} onChange={setDifficulty} />
          </div>

          <button
            onClick={() => startSession(difficulty)}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-500 hover:to-orange-500 text-white font-black text-sm shadow-xl shadow-amber-600/30 transition-all flex items-center justify-center gap-2.5 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>开启案卷侦破（{difficulty}难度 · {diffConfig.multiplierText}）</span>
          </button>
        </div>
      ) : gameState === 'playing' && currentCase ? (
        <div className="w-full game-arcade-card rounded-3xl p-6 sm:p-7 border-amber-200/80 shadow-2xl space-y-5 animate-fadeIn">
          {/* Case Header */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-lg border border-amber-300 font-numeric">
                案卷 #{currentCaseIndex + 1} / {activeCases.length}
              </span>
              {combo > 1 && (
                <span className="text-xs font-black text-orange-600 animate-pulse font-numeric flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
                  {combo} 连击侦破
                </span>
              )}
            </div>
            <h2 className="text-xl font-black text-stone-900 font-serif-editorial">
              {currentCase.title}
            </h2>
            <div className="p-4 bg-gradient-to-br from-amber-50/60 to-stone-50 rounded-2xl border border-amber-200/70 mt-2.5 shadow-sm">
              <span className="text-xs font-bold text-amber-900 block mb-1">案情重现：</span>
              <p className="text-xs text-stone-700 leading-relaxed">
                {currentCase.scenario}
              </p>
            </div>
          </div>

          {/* Evidence Dossier */}
          <div>
            <h4 className="text-xs font-black text-stone-900 flex items-center gap-1.5 mb-2.5">
              <FileText className="w-4 h-4 text-amber-600" />
              <span>现场收集物证与行为口供</span>
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {currentCase.evidence.map((ev, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 bg-white/90 rounded-2xl border border-amber-200/60 shadow-sm text-xs hover:border-amber-400 transition-colors"
                >
                  <span className="text-xl shrink-0 p-1 bg-amber-50 rounded-xl">{ev.icon}</span>
                  <div>
                    <span className="font-extrabold text-stone-900 block font-serif-editorial">
                      {ev.title}
                    </span>
                    <span className="text-[11px] text-stone-600 leading-relaxed">
                      {ev.detail}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detective Question */}
          <div className="pt-2 border-t border-stone-200/60">
            <h3 className="text-xs sm:text-sm font-black text-stone-900 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center text-xs">🔍</span>
              <span>{currentCase.question}</span>
            </h3>

            <div className="space-y-2.5">
              {currentCase.options.map((opt, idx) => {
                const isSelected = selectedOption === idx;
                const showSuccess = revealedExplanation && opt.isCorrect;
                const showWrong = revealedExplanation && isSelected && !opt.isCorrect;

                return (
                  <button
                    key={idx}
                    disabled={revealedExplanation}
                    onClick={() => handleSelectOption(idx)}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center justify-between text-xs font-bold cursor-pointer active:scale-98 ${
                      showSuccess
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-950 shadow-md'
                        : showWrong
                        ? 'bg-rose-50 border-rose-500 text-rose-950 shadow-md'
                        : 'bg-white hover:bg-amber-50/60 border-stone-200 text-stone-800'
                    }`}
                  >
                    <span className="leading-relaxed">{opt.label}</span>
                    {showSuccess && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 ml-2 animate-scaleUp" />
                    )}
                    {showWrong && (
                      <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 ml-2 animate-shake" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Explanation Box on Reveal */}
          {revealedExplanation && selectedOption !== null && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50/70 to-orange-50/70 border border-amber-200/80 space-y-2.5 animate-fadeIn shadow-sm">
              <div className="flex items-center gap-1.5 text-xs font-black text-amber-950">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>侦探推理研判报告</span>
              </div>
              <p className="text-xs text-stone-700 leading-relaxed font-serif-editorial">
                {currentCase.options[selectedOption].explanation}
              </p>
              <button
                onClick={handleNext}
                className="w-full mt-2 py-3 bg-gradient-to-r from-stone-900 via-stone-800 to-amber-950 hover:from-stone-800 hover:to-amber-900 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>{currentCaseIndex < activeCases.length - 1 ? '审阅下一卷宗' : '查看结案评级'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Finished Screen */
        <div className="w-full game-arcade-card rounded-3xl p-6 sm:p-8 border-amber-200/80 shadow-2xl text-center space-y-6 animate-fadeIn relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-52 h-52 rounded-full bg-gradient-to-br from-amber-500/30 to-orange-500/20 blur-3xl pointer-events-none" />

          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-600 to-amber-700 text-white flex items-center justify-center mx-auto shadow-xl shadow-amber-500/30 ring-4 ring-amber-500/20">
            <Award className="w-10 h-10 drop-shadow-md text-amber-100" />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-bold text-amber-600 tracking-wider uppercase">Case Closed</span>
            <h2 className="text-2xl font-black text-stone-900 font-serif-editorial">
              心理侦探结案报告
            </h2>
            <p className="text-xs text-stone-600">
              完成【{difficulty}】难度案卷推理审理
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2.5 font-numeric">
            <div className="bg-gradient-to-b from-stone-50 to-stone-100 p-3.5 rounded-2xl border border-stone-200/90 shadow-sm">
              <span className="text-[10px] text-stone-500 font-bold block mb-1">侦破得分</span>
              <span className="text-lg font-black text-stone-900">{score}</span>
            </div>
            <div className="bg-gradient-to-b from-emerald-50 to-teal-50 p-3.5 rounded-2xl border border-emerald-200/80 shadow-sm">
              <span className="text-[10px] text-emerald-700 font-bold block mb-1">准确率</span>
              <span className="text-lg font-black text-emerald-600">
                {activeCases.length > 0 ? Math.round((correctCount / activeCases.length) * 100) : 0}%
              </span>
            </div>
            <div className="bg-gradient-to-b from-purple-50 to-indigo-50 p-3.5 rounded-2xl border border-purple-200/80 shadow-sm">
              <span className="text-[10px] text-purple-700 font-bold block mb-1">难度加成</span>
              <span className="text-lg font-black text-purple-600">{diffConfig.multiplierText}</span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => startSession(difficulty)}
              className="flex-1 py-3.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-stone-200"
            >
              <RotateCcw className="w-4 h-4" />
              <span>重新出题</span>
            </button>
            <button
              onClick={handleFinish}
              className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-stone-900 via-stone-800 to-amber-950 hover:from-stone-800 hover:to-amber-900 text-white font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>结算经验</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

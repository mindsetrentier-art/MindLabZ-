import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, RotateCcw, FlaskConical, Sparkles, CheckCircle2, TrendingUp, BarChart3, Users, Award, Play, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { GameDifficulty, DIFFICULTY_CONFIGS, DIFFICULTY_LIST, shuffleArray } from '../../data/difficulty';
import { DifficultySelector } from './DifficultySelector';
import { GameHeaderHud } from './GameHeaderHud';
import { gameAudio } from '../../utils/gameAudio';

interface LabChoice {
  key: string;
  label: string;
  biasDescription: string;
  globalPercentage: number;
}

interface LabExperiment {
  id: string;
  nameZh: string;
  nameEn: string;
  researcher: string;
  year: string;
  background: string;
  question: string;
  choices: LabChoice[];
  insight: string;
  lawId: string;
}

const ALL_EXPERIMENTS: LabExperiment[] = [
  {
    id: 'framing-lab',
    nameZh: '亚洲疾病框架实验',
    nameEn: 'Asian Disease Problem',
    researcher: '阿莫斯·特沃斯基 & 丹尼尔·卡尼曼',
    year: '1981',
    background: '某种罕见流行病爆发，预计将导致 600 人死亡。目前有两种救治方案供你决策：',
    question: '在【获益框架】下，你倾向于批准哪种救治方案？',
    choices: [
      {
        key: 'A',
        label: '方案甲：确定拯救 200 人的生命。',
        biasDescription: '多数人偏好确定性收益，厌恶冒险',
        globalPercentage: 72,
      },
      {
        key: 'B',
        label: '方案乙：有 1/3 概率 600 人全部获救，2/3 概率无人生还。',
        biasDescription: '数学期望完全相同（均为200人存活），属于风险博弈',
        globalPercentage: 28,
      },
    ],
    insight: '卡尼曼发现，面对正面获益表述时，72% 的人回避风险选择确定拯救；但当换成损失框架（“400人将确定死亡”）时，78% 的人会瞬间变成风险偏好者去赌一把！同一事实，框架操纵了决策。',
    lawId: 'framing-effect',
  },
  {
    id: 'jam-experiment',
    nameZh: '果酱选择过载实验',
    nameEn: 'Jam Choice Overload Experiment',
    researcher: '希娜·艾扬格 (Sheena Iyengar)',
    year: '2000',
    background: '在加州一家高档食品超市入口处，研究人员设立了两个不同的果酱免费品尝摊位：',
    question: '如果你是在该超市匆匆采买的顾客，你更有可能在哪种摊位最终完成购买？',
    choices: [
      {
        key: 'A',
        label: '摊位A：摆放 24 种琳琅满目的风味果酱（试吃人多但挑花了眼）',
        biasDescription: '选项过多引发“分析瘫痪”与机会成本焦虑，购买转化率仅 3%',
        globalPercentage: 18,
      },
      {
        key: 'B',
        label: '摊位B：精选 6 种经典招牌风味果酱（目标明确快速锁定）',
        biasDescription: '降低工作记忆负荷，购买转化率高出近 10 倍（高达 30%）',
        globalPercentage: 82,
      },
    ],
    insight: '真实实验中，24 款果酱吸引了 60% 客流但仅 3% 最终下单；而 6 款果酱仅吸引 40% 客流却促成 30% 购买！少即是多，过量选项会扼杀行动力。',
    lawId: 'choice-overload',
  },
  {
    id: 'loss-aversion-lab',
    nameZh: '硬币博弈与损失厌恶',
    nameEn: 'Coin Toss Loss Aversion',
    researcher: '理查德·塞勒 & 丹尼尔·卡尼曼',
    year: '1990',
    background: '面前有一枚质地均匀的硬币。抛出正面你将直接赢得 150 美元；抛出反面你将自掏腰包输掉 100 美元。该博弈的数学期望为正（+25 美元）。',
    question: '面对这一单次抛硬币博弈，你的真实决策是：',
    choices: [
      {
        key: 'A',
        label: '选择拒绝参与（害怕输掉 100 美元的痛苦）',
        biasDescription: '典型损失厌恶：失去 100 的痛觉需要 200~250 收益才能抚平',
        globalPercentage: 69,
      },
      {
        key: 'B',
        label: '选择果断接受（因为数学期望收益为正）',
        biasDescription: '完全基于理性概率数学期望做决策',
        globalPercentage: 31,
      },
    ],
    insight: '在期望值明显为正的情况下，仍有近 70% 的人拒绝参与。人类的损失厌恶系数约为 2.0~2.5。只有当赢面收益提高到 250 美元时，多数人才愿意承担 100 美元的损失风险。',
    lawId: 'loss-aversion',
  },
  {
    id: 'ultimatum-game',
    nameZh: '最后通牒博弈实验',
    nameEn: 'Ultimatum Game',
    researcher: '维尔纳·居特 (Werner Güth) 等',
    year: '1982',
    background: '研究者给提议者 100 美元，提议者可以任意划分这笔钱（比如提议给响应者 10 美元，自己留 90 美元）。如果响应者接受，两人按此分钱；若拒绝，100 美元全部被没收，两人皆得 0 元。',
    question: '如果你是响应者，面对提议者“分给你 10 美元、自己拿走 90 美元”的分配方案，你的反应是：',
    choices: [
      {
        key: 'A',
        label: '愤怒拒绝方案！宁可自己一分拿不到，也要让自私的提议者空手而归。',
        biasDescription: '利他惩罚与公平厌恶：人类愿意付出实质代价来惩罚不公者',
        globalPercentage: 64,
      },
      {
        key: 'B',
        label: '欣然接受 10 美元，因为 10 美元总比 0 美元好，能多拿一点是一点。',
        biasDescription: '新古典经济学“理性经济人”假设，但与真实人类行为严重不符',
        globalPercentage: 36,
      },
    ],
    insight: '经济学古典模型预测响应者只要能拿到大于0元就应接受。然而实验跨越数十个国家均显示：低于 20% 的不公分配方案被拒绝率超过一半！人类大脑进化出了保护社会合作公平的“利他惩罚神经回路”。',
    lawId: 'fairness-norm',
  },
  {
    id: 'trolley-dilemma',
    nameZh: '电车难题与天桥困境',
    nameEn: 'Trolley Problem & Footbridge Dilemma',
    researcher: '菲利帕·福特 & 朱迪斯·汤姆森',
    year: '1967/1985',
    background: '一辆失控的电车正冲向轨道上的 5 名工人。场景一：你可以拉动道岔把车引向只有 1 名工人的备用轨道；场景二：你站在天桥上，必须亲手把一个体型巨大的陌生人推下轨道才能逼停车拯救 5 人。',
    question: '在场景二（天桥亲手推人）中，你的道德直觉抉择是：',
    choices: [
      {
        key: 'A',
        label: '绝不推人！亲手杀害一个无辜者在道德上是不可接受的，哪怕能救 5 人。',
        biasDescription: '道义论道德直觉与情绪脑回路（杏仁核/腹内侧前额叶）强烈激活',
        globalPercentage: 86,
      },
      {
        key: 'B',
        label: '果断推下陌生人，因为 5 条生命在数量上大于 1 条生命。',
        biasDescription: '纯粹功利主义计算，在亲身物理侵害情境下极少人能下手',
        globalPercentage: 14,
      },
    ],
    insight: '拉动道岔救5牺牲1时，近 90% 的人同意；但亲手推人下桥救5牺牲1时，86% 的人坚决反对！神经伦理学fMRI揭示：亲手推人会强烈引爆负责恐惧与厌恶的边缘系统，压倒理性的功利算计。',
    lawId: 'moral-heuristics',
  },
  {
    id: 'asch-conformity',
    nameZh: '阿希从众线条实验',
    nameEn: 'Asch Conformity Experiment',
    researcher: '所罗门·阿希 (Solomon Asch)',
    year: '1951',
    background: '受试者被安排与 7 名“假受试者”（其实都是演员托儿）同坐一室，比对三条线条哪条与标准线一样长。在前两轮正常回答后，第 3 轮所有演员异口同声给出了一个一眼能看出错误的答案。',
    question: '轮到最后一位真受试者发言时，你预测有多少受试者至少有一次屈从群体选择了错误答案？',
    choices: [
      {
        key: 'A',
        label: '超过 75% 的真受试者在群体压力下，至少随大流指鹿为马选错一次！',
        biasDescription: '社会规范影响与信息从众：人害怕成为被孤立的异类',
        globalPercentage: 76,
      },
      {
        key: 'B',
        label: '绝大多数人（80%以上）会坚持自己的双眼，绝不违心妥协。',
        biasDescription: '过度相信人类在群体压力下的独立判断力',
        globalPercentage: 24,
      },
    ],
    insight: '在完全没有利益惩罚的情况下，高达 75% 的受试者至少有一次跟随群体给出了荒谬答案。这揭示了人类为了避免社交排斥，甚至会扭曲自己的视觉感知判断。',
    lawId: 'conformity-bias',
  },
  {
    id: 'milgram-obedience',
    nameZh: '米尔格兰姆权威服从实验',
    nameEn: 'Milgram Obedience Experiment',
    researcher: '斯坦利·米尔格兰姆 (Stanley Milgram)',
    year: '1961',
    background: '耶鲁大学实验室中，穿白大褂的研究员命令受试者：当隔壁房间的“学习者”背错单词时，按下面板施加电击，电压从 15V 一路升级到可能致死的 450V 危险电压。隔壁频频传来凄惨尖叫与求饶。',
    question: '在权威研究员冷酷一句“实验必须继续下去”的指令下，最终有多少比例普通人按到了最高 450V？',
    choices: [
      {
        key: 'A',
        label: '高达 65% 的普通受试者一路电击到了最高 450 伏特致命电压！',
        biasDescription: '对权威的代理状态转移：将道德责任转移给发令者',
        globalPercentage: 65,
      },
      {
        key: 'B',
        label: '只有不到 1% 的极端变态或冷血者才会电击到 450 伏特。',
        biasDescription: '在实验前，包括精神病学家在内的专家均预测只有 1% 会服从，结果大跌眼镜',
        globalPercentage: 35,
      },
    ],
    insight: '实验前精神病医生预测只有不到 1% 会执行到最后。然而现实残酷：65% 的普通公民在权威命令下按下了致死电压。恶的平庸性证明，普通人置身特定情境中都可能成为毁灭工具。',
    lawId: 'authority-bias',
  },
  {
    id: 'marshmallow-lab',
    nameZh: '斯坦福棉花糖实验',
    nameEn: 'Stanford Marshmallow Experiment',
    researcher: '沃尔特·米歇尔 (Walter Mischel)',
    year: '1972',
    background: '将 4 岁儿童单独留在桌前，放一颗棉花糖。研究员离开房间前告知：如果能等待 15 分钟不吃，就能额外获得第二颗棉花糖作为奖励。',
    question: '追踪数十年后，能够成功忍住 15 分钟不吃棉花糖的孩子在未来展现出的核心差异是：',
    choices: [
      {
        key: 'A',
        label: '展现出更卓越的延迟满足与前额叶执行抑制力，SAT成绩、健康与社会成就显著更高。',
        biasDescription: '延迟折扣抑制控制：抵御即时多巴胺诱惑的能力是人生长期复利的基础',
        globalPercentage: 78,
      },
      {
        key: 'B',
        label: '由于童年过于克制，成年后往往表现出更高的焦虑感与精神神经质。',
        biasDescription: '与实证研究相反，自控力良好的个体幸福感反而显著更高',
        globalPercentage: 22,
      },
    ],
    insight: '面对当下即时奖赏 vs 未来翻倍收益，能通过转移注意力、捂住眼睛等策略成功等待的孩子，展示出极强的前额叶抑制控制能力。这种自控力是跨越半生的长期竞争力。',
    lawId: 'delay-discounting',
  },
  {
    id: 'anchoring-wheel',
    nameZh: '幸运转盘与锚定偏见',
    nameEn: 'Wheel of Fortune Anchoring',
    researcher: '丹尼尔·卡尼曼 & 阿莫斯·特沃斯基',
    year: '1974',
    background: '受试者先观看一个 1 到 100 的轮盘抽奖，轮盘暗中被做手脚只停在 10 或 65。随后，研究人员立刻抛出一个完全无关的问题：“你估计联合国会员国中，非洲国家所占的百分比是多少？”',
    question: '转盘转出 10 和转出 65 的两组受试者，对非洲国家占比的预估平均值分别是多少？',
    choices: [
      {
        key: 'A',
        label: '转到 10 的组平均估 25%，而转到 65 的组平均估 45%！差了将近一倍！',
        biasDescription: '毫无关联的纯随机数字，也能像钢锚一样拖拽人们的定量评估',
        globalPercentage: 71,
      },
      {
        key: 'B',
        label: '两组估计完全一致（约 35%），因为大家知道转盘数字纯属无关噪音。',
        biasDescription: '高估了大脑过滤无关数字的能力',
        globalPercentage: 29,
      },
    ],
    insight: '即使受试者明确知道轮盘数字是随机的，转出 65 的组给出的估计依然比转出 10 的组高出近 20 个百分点！大脑总是以第一个遇到的数字为锚点向上或向下调整，且调整幅度往往严重不足。',
    lawId: 'anchoring-effect',
  },
  {
    id: 'invisible-gorilla',
    nameZh: '看不见的大猩猩实验',
    nameEn: 'The Invisible Gorilla Experiment',
    researcher: '克里斯托弗·查布利斯 & 丹尼尔·西蒙斯',
    year: '1999',
    background: '受试者观看一段视频，两队人员分别穿白衣和黑衣传递篮球。任务是：“数出白衣队员之间共传了多少次球”。视频播放过程中，一个穿着大猩猩全套玩偶服的人径直走到场地中央，面对镜头捶胸 9 秒钟后离开。',
    question: '在认真数传球次数的受试者中，有多少比例完全没有注意到这只大猩猩？',
    choices: [
      {
        key: 'A',
        label: '高达 50% 的成年人对眼皮底下走过的大猩猩彻底视而不见！',
        biasDescription: '非注意盲视（Inattentional Blindness）：注意力聚光灯之外的世界基本是黑暗的',
        globalPercentage: 81,
      },
      {
        key: 'B',
        label: '几乎 100% 的人都能看到，因为大猩猩体型巨大且逗留时间极长。',
        biasDescription: '直觉错觉：人们深信自己能敏锐看到视野中发生的一切异常',
        globalPercentage: 19,
      },
    ],
    insight: '当注意力高度集中在白衣传球这一项特定认知任务上时，一半的健康成年人完全看不见黑猩猩！我们不仅对身边的显著事实视而不见，而且更可怕的是，我们对自己“看不见”这一事实浑然不觉。',
    lawId: 'inattentional-blindness',
  },
];

export const PsychExperimentGame: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { recordGameResult, updateLawMastery } = useApp();

  const urlDiff = searchParams.get('difficulty') as GameDifficulty | null;
  const initialDiff: GameDifficulty = urlDiff && DIFFICULTY_LIST.includes(urlDiff) ? urlDiff : '中';

  const [difficulty, setDifficulty] = useState<GameDifficulty>(initialDiff);
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'completed'>('intro');
  const [activeExperiments, setActiveExperiments] = useState<LabExperiment[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userChoiceKey, setUserChoiceKey] = useState<string | null>(null);
  const [score, setScore] = useState(0);

  const diffConfig = DIFFICULTY_CONFIGS[difficulty];

  const startSession = (selectedDiff: GameDifficulty = difficulty) => {
    // Number of experiments by difficulty: 低: 3, 中: 4, 高: 5, 高级: 6
    const countMap: Record<GameDifficulty, number> = {
      '低': 3,
      '中': 4,
      '高': 5,
      '高级': 6,
    };
    const count = countMap[selectedDiff];

    // 1. Shuffle all experiments randomly
    const shuffledPool = shuffleArray(ALL_EXPERIMENTS);
    const selected = shuffledPool.slice(0, count);

    // 2. Randomly shuffle the choices of each experiment
    const processed = selected.map((exp) => ({
      ...exp,
      choices: shuffleArray(exp.choices),
    }));

    setActiveExperiments(processed);
    setCurrentIndex(0);
    setUserChoiceKey(null);
    setScore(0);
    setGameState('playing');
    gameAudio.playSuccess();
  };

  const exp = activeExperiments[currentIndex];

  const handleMakeChoice = (choiceKey: string) => {
    if (userChoiceKey !== null || !exp) return;
    setUserChoiceKey(choiceKey);
    gameAudio.playSelect();

    const basePts = 2500;
    const earned = Math.round(basePts * diffConfig.scoreMultiplier);
    setScore((prev) => prev + earned);

    if (exp.lawId) {
      updateLawMastery(exp.lawId, 95);
    }
  };

  const handleNext = () => {
    gameAudio.playTap();
    if (currentIndex < activeExperiments.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setUserChoiceKey(null);
    } else {
      gameAudio.playVictory();
      setGameState('completed');
    }
  };

  const handleFinish = () => {
    const xpGained = Math.round((score / 20 + 200) * diffConfig.xpMultiplier);

    recordGameResult('psych-experiment', {
      score,
      accuracy: 100,
      reactionTime: 950,
      xpGained,
      comboMax: activeExperiments.length,
      conceptLearned: '行为经济学与经典心理实验范式（Behavioral Economics & Paradigm）',
      lawId: exp?.lawId || 'framing-effect',
      difficulty,
    });

    navigate('/games');
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-[85vh] w-full max-w-lg mx-auto py-3 px-2 animate-fadeIn">
      {/* Game Header HUD */}
      <GameHeaderHud
        title="心理实验模拟器"
        numberPrefix="CLASSIC"
        score={score}
        currentRound={currentIndex + 1}
        totalRounds={activeExperiments.length || 5}
        difficulty={difficulty}
        onExit={() => (gameState === 'intro' ? navigate('/games') : setGameState('intro'))}
        onBack={() => (gameState === 'intro' ? navigate('/games') : setGameState('intro'))}
      />

      {gameState === 'intro' ? (
        <div className="w-full game-arcade-card rounded-3xl p-6 sm:p-8 border-blue-200/80 shadow-2xl space-y-6 relative overflow-hidden">
          {/* Ambient colorful glow */}
          <div className="absolute -top-16 -right-16 w-52 h-52 rounded-full bg-gradient-to-br from-blue-500/30 to-cyan-500/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-52 h-52 rounded-full bg-gradient-to-br from-indigo-500/20 to-blue-500/25 blur-3xl pointer-events-none" />

          <div className="relative text-center space-y-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-600 text-white flex items-center justify-center mx-auto shadow-xl shadow-blue-500/30 ring-4 ring-blue-500/20 animate-subtleFloat">
              <FlaskConical className="w-10 h-10 drop-shadow-md text-cyan-200" />
            </div>

            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-700 text-xs font-bold border border-blue-200">
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                <span>行为决策与经典实验范式</span>
              </div>
              <h2 className="text-2xl font-black text-stone-900 tracking-tight font-serif-editorial">
                经典心理实验模拟器
              </h2>
              <p className="text-xs text-stone-600 leading-relaxed max-w-sm mx-auto">
                沉浸式亲历卡尼曼框架效应、阿希从众、果酱选择过载等 10 部划时代实验。重现经典行为经济学抉择时刻。
              </p>
            </div>
          </div>

          {/* Difficulty Setting */}
          <div className="space-y-2 pt-3 border-t border-blue-100 text-left">
            <label className="text-xs font-bold text-stone-800 block text-center">
              选择实验探索深度：
            </label>
            <DifficultySelector value={difficulty} onChange={setDifficulty} />
          </div>

          <button
            onClick={() => startSession(difficulty)}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-black text-sm shadow-xl shadow-blue-600/30 transition-all flex items-center justify-center gap-2.5 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>进入心理学实验室（{difficulty}难度 · {diffConfig.multiplierText}）</span>
          </button>
        </div>
      ) : gameState === 'playing' && exp ? (
        <div className="w-full game-arcade-card rounded-3xl p-6 sm:p-7 border-blue-200/80 shadow-2xl space-y-5 animate-fadeIn">
          {/* Experiment Header */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200 font-numeric">
                实验 #{currentIndex + 1} / {activeExperiments.length}
              </span>
              <span className="text-[11px] text-stone-500 font-mono font-bold">
                {exp.researcher} ({exp.year})
              </span>
            </div>
            <h2 className="text-xl font-black text-stone-900 font-serif-editorial">
              {exp.nameZh}
            </h2>
            <p className="text-xs text-stone-500 font-mono italic mt-0.5">
              {exp.nameEn}
            </p>
          </div>

          {/* Background Scenario */}
          <div className="p-4 bg-gradient-to-br from-blue-50/50 to-indigo-50/40 rounded-2xl border border-blue-200/60 text-xs text-stone-700 leading-relaxed shadow-sm">
            <span className="font-bold text-blue-950 block mb-1 font-serif-editorial">
              🔬 实验情境设定：
            </span>
            {exp.background}
          </div>

          {/* Question / Dilemma */}
          <div className="pt-2 border-t border-stone-200/60">
            <h3 className="text-xs sm:text-sm font-black text-stone-900 mb-3.5 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-xs">🎯</span>
              <span>{exp.question}</span>
            </h3>

            {/* Randomized Choice Options */}
            <div className="space-y-3">
              {exp.choices.map((c) => {
                const isSelected = userChoiceKey === c.key;

                return (
                  <button
                    key={c.key}
                    disabled={userChoiceKey !== null}
                    onClick={() => handleMakeChoice(c.key)}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden active:scale-98 ${
                      isSelected
                        ? 'bg-blue-50 border-blue-500 text-blue-950 font-bold shadow-md shadow-blue-500/10'
                        : userChoiceKey !== null
                        ? 'bg-white/80 border-stone-200 text-stone-700'
                        : 'bg-white hover:bg-blue-50/50 border-stone-200 hover:border-blue-300 text-stone-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="text-xs sm:text-sm font-bold leading-relaxed">
                        {c.label}
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5 animate-scaleUp" />
                      )}
                    </div>

                    {/* Reveal Percentage Bar after choice */}
                    {userChoiceKey !== null && (
                      <div className="mt-3 pt-2.5 border-t border-stone-200/60 space-y-1.5 animate-fadeIn">
                        <div className="flex justify-between items-center text-xs font-numeric">
                          <span className="text-stone-500 font-medium">{c.biasDescription}</span>
                          <span className="font-extrabold text-blue-700">
                            {c.globalPercentage}% 受试者做出此抉择
                          </span>
                        </div>
                        <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-blue-600 to-cyan-500 h-2 rounded-full transition-all duration-700 shadow-sm"
                            style={{ width: `${c.globalPercentage}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Deep Insight Reveal */}
          {userChoiceKey !== null && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/70 to-blue-50/70 border border-blue-200/80 space-y-2.5 animate-fadeIn shadow-sm">
              <div className="flex items-center gap-1.5 text-xs font-black text-indigo-950">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>心理学核心洞察与规律</span>
              </div>
              <p className="text-xs text-stone-700 leading-relaxed font-serif-editorial">
                {exp.insight}
              </p>
              <button
                onClick={handleNext}
                className="w-full mt-2 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>{currentIndex < activeExperiments.length - 1 ? '进入下一实验范式' : '查看实验总结'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Completed Screen */
        <div className="w-full game-arcade-card rounded-3xl p-6 sm:p-8 border-blue-200/80 shadow-2xl text-center space-y-6 animate-fadeIn relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-52 h-52 rounded-full bg-gradient-to-br from-blue-500/30 to-indigo-500/20 blur-3xl pointer-events-none" />

          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-600 text-white flex items-center justify-center mx-auto shadow-xl shadow-blue-500/30 ring-4 ring-blue-500/20">
            <Award className="w-10 h-10 drop-shadow-md text-cyan-200" />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-bold text-blue-600 tracking-wider uppercase">Lab Complete</span>
            <h2 className="text-2xl font-black text-stone-900 font-serif-editorial">
              心理实验模拟完成
            </h2>
            <p className="text-xs text-stone-600">
              已完成【{difficulty}】难度随机经典实验探索
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2.5 font-numeric">
            <div className="bg-gradient-to-b from-stone-50 to-stone-100 p-3.5 rounded-2xl border border-stone-200/90 shadow-sm">
              <span className="text-[10px] text-stone-500 font-bold block mb-1">实验积分</span>
              <span className="text-lg font-black text-stone-900">{score}</span>
            </div>
            <div className="bg-gradient-to-b from-blue-50 to-cyan-50 p-3.5 rounded-2xl border border-blue-200/80 shadow-sm">
              <span className="text-[10px] text-blue-700 font-bold block mb-1">探索范式</span>
              <span className="text-lg font-black text-blue-600">{activeExperiments.length} 组</span>
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
              className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-stone-900 via-stone-800 to-blue-950 hover:from-stone-800 hover:to-blue-900 text-white font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
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

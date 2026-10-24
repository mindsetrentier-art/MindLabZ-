import { UserProfile, UserStats } from '../types';
import { PSYCHOLOGY_GAMES } from '../data/games';

export interface ContributingGameScore {
  gameId: string;
  gameNameZh: string;
  gameNumber?: string;
  score: number;
  benchmarkScore: number;
  percentage: number;
  category: string;
  accentColor: string;
}

export interface CognitiveDomainAssessment {
  id: 'memory' | 'logic' | 'focus' | 'decision' | 'speed' | 'insight';
  nameZh: string;
  nameEn: string;
  score: number; // 0 - 100
  tier: '宗师 (Master)' | '卓越 (Expert)' | '精进 (Proficient)' | '启蒙 (Developing)';
  tierBadgeColor: string;
  percentile: number; // e.g. 92%
  cohortAverage: number; // e.g. 68
  masterBenchmark: number; // e.g. 92
  description: string;
  neuroscienceMechanism: string;
  contributingGames: ContributingGameScore[];
  recommendedGameIds: string[];
  keyAdvice: string;
  accentColor: string;
  glowColor: string;
  iconName: string;
}

export interface OverallAssessmentReport {
  overallCq: number; // 0 - 100
  tier: string;
  archetype: {
    title: string;
    englishTitle: string;
    description: string;
    tagline: string;
    dominantDomains: string[];
  };
  percentileOverall: number;
  domains: CognitiveDomainAssessment[];
  topStrength: CognitiveDomainAssessment;
  growthOpportunity: CognitiveDomainAssessment;
  totalGamesEvaluated: number;
  recommendedTrainingPlan: {
    gameId: string;
    gameNameZh: string;
    targetDomain: string;
    reason: string;
    accentColor: string;
  }[];
}

/**
 * Calculates domain score based on game high scores, user stats, and benchmark milestones.
 */
function calculateDomainScore(
  baseStat: number,
  relevantGames: { id: string; weight: number; benchmark: number }[],
  gameHighScores: Record<string, number>
): { score: number; contributing: { id: string; score: number; benchmark: number; percentage: number }[] } {
  let weightedScoreSum = 0;
  let totalWeight = 0;
  const contributing: { id: string; score: number; benchmark: number; percentage: number }[] = [];

  // Consider base user stat (weight: 0.35)
  const safeBaseStat = Math.max(20, Math.min(100, Number(baseStat) || 75));
  weightedScoreSum += safeBaseStat * 0.35;
  totalWeight += 0.35;

  // Evaluate each relevant game
  relevantGames.forEach((item) => {
    const rawScore = Number(gameHighScores[item.id]) || 0;
    // Calculate fulfillment percentage against benchmark
    const fulfillment = Math.min(100, Math.round((rawScore / item.benchmark) * 100));
    // Score on 0-100 scale: if 0 games played, fallback to base stat floor
    const normalizedScore = rawScore > 0 ? Math.max(30, Math.min(100, fulfillment)) : Math.max(35, safeBaseStat * 0.8);
    
    weightedScoreSum += normalizedScore * item.weight;
    totalWeight += item.weight;

    contributing.push({
      id: item.id,
      score: rawScore,
      benchmark: item.benchmark,
      percentage: fulfillment,
    });
  });

  const finalScore = Math.round(weightedScoreSum / totalWeight);
  return { score: Math.max(10, Math.min(100, finalScore)), contributing };
}

/**
 * Maps score to tier label and visual badge color
 */
function getScoreTier(score: number): {
  tier: '宗师 (Master)' | '卓越 (Expert)' | '精进 (Proficient)' | '启蒙 (Developing)';
  tierBadgeColor: string;
} {
  if (score >= 88) return { tier: '宗师 (Master)', tierBadgeColor: 'bg-amber-400/20 text-amber-700 border-amber-300' };
  if (score >= 78) return { tier: '卓越 (Expert)', tierBadgeColor: 'bg-indigo-400/20 text-indigo-700 border-indigo-300' };
  if (score >= 65) return { tier: '精进 (Proficient)', tierBadgeColor: 'bg-emerald-400/20 text-emerald-700 border-emerald-300' };
  return { tier: '启蒙 (Developing)', tierBadgeColor: 'bg-stone-200/80 text-stone-700 border-stone-300' };
}

/**
 * Computes the cognitive archetype based on domain scores
 */
function determineArchetype(domains: { id: string; nameZh: string; score: number }[]): {
  title: string;
  englishTitle: string;
  description: string;
  tagline: string;
  dominantDomains: string[];
} {
  const sorted = [...domains].sort((a, b) => b.score - a.score);
  const top1 = sorted[0].id;
  const top2 = sorted[1].id;

  if (top1 === 'logic' && (top2 === 'decision' || top2 === 'focus')) {
    return {
      title: '严密逻辑架构师',
      englishTitle: 'Rigorous Analytical Architect',
      tagline: '善于化解直觉偏误，以无可辩驳的证据链与第一性原理重构世界',
      description: '您的大脑前额叶背外侧皮层抑制控制极为出色。面对复杂的欺骗性信息与思维直觉捷径，您总能迅速切换至慢思考系统，精准拆解谬误。',
      dominantDomains: ['逻辑反思', '理性决策'],
    };
  }

  if (top1 === 'memory' && (top2 === 'insight' || top2 === 'logic')) {
    return {
      title: '心智记忆宫殿宗师',
      englishTitle: 'Memory Palace Grandmaster',
      tagline: '大脑拥有卓越的空间检索网络与庞大的内隐心智模型图谱',
      description: '您的海马体突触编码能力与空间几何定位高度发达，能将零散的信息组块并迅速构建关联索引，在长程复盘与知识迁移中表现卓异。',
      dominantDomains: ['空间记忆', '元认知'],
    };
  }

  if (top1 === 'focus' || top1 === 'speed') {
    return {
      title: '敏锐直觉破局者',
      englishTitle: 'Agile Intuitive Navigator',
      tagline: '毫秒级感知外界微线索，在风暴般的信息洪流中坚守专注靶心',
      description: '您的前扣带皮层（ACC）与蓝斑核去甲肾上腺素系统协同极佳，能在高压情境下迅速过滤环境干扰，对关键信号拥有鹰隼般的微秒反应。',
      dominantDomains: ['专注抗扰', '反应敏捷'],
    };
  }

  if (top1 === 'decision') {
    return {
      title: '战略博弈哲学家',
      englishTitle: 'Strategic Game Theorist',
      tagline: '洞悉人性非理性暗流，在不确定性迷雾中作出最高期望值抉择',
      description: '您对先验锚定、群体从众与免费损失陷阱具有极高免疫力。在涉及机会成本与风险评估的场景中，总能保持冷峻客观的概率视角。',
      dominantDomains: ['理性决策', '逻辑思辨'],
    };
  }

  return {
    title: '全维均衡发展学者',
    englishTitle: 'Holistic Polymath Mind',
    tagline: '多维认知系统协同并进，展现出极高的大脑可塑性与认知韧性',
    description: '您的各项认知机能分布均衡，未出现明显短板。在多任务切换、知识内化与日常综合决策中具备极强的自适应协调潜质。',
    dominantDomains: ['全面协调', '深度反思'],
  };
}

/**
 * Main evaluation generator: takes user profile and returns complete cognitive assessment report.
 */
export function generateCognitiveAssessment(user: UserProfile): OverallAssessmentReport {
  const gameHighScores = user.gameHighScores || {};
  const stats: UserStats = user.stats || {
    memory: 80,
    attention: 80,
    reasoning: 80,
    knowledge: 80,
    decision: 80,
  };

  // 1. Memory Domain (记忆与空间回溯)
  const memoryCalc = calculateDomainScore(
    stats.memory,
    [
      { id: 'memory-lab', weight: 0.35, benchmark: 8000 },
      { id: 'peak-end', weight: 0.15, benchmark: 3000 },
      { id: 'first-impression', weight: 0.15, benchmark: 2600 },
    ],
    gameHighScores
  );

  // 2. Logic & Reasoning Domain (逻辑推演与可证伪反思)
  const logicCalc = calculateDomainScore(
    stats.reasoning,
    [
      { id: 'mind-trap', weight: 0.35, benchmark: 5000 },
      { id: 'falsification-challenge', weight: 0.15, benchmark: 3500 },
      { id: 'micro-habit', weight: 0.15, benchmark: 2800 },
    ],
    gameHighScores
  );

  // 3. Focus & Attention Domain (专注力与抗干扰选择)
  const focusCalc = calculateDomainScore(
    stats.attention,
    [
      { id: 'brain-rush', weight: 0.4, benchmark: 10000 },
      { id: 'emotion-detective', weight: 0.25, benchmark: 3000 },
    ],
    gameHighScores
  );

  // 4. Rational Decision Domain (理性决策与去偏见)
  const decisionCalc = calculateDomainScore(
    stats.decision,
    [
      { id: 'anchoring-lab', weight: 0.25, benchmark: 3000 },
      { id: 'majority-answer', weight: 0.2, benchmark: 3000 },
      { id: 'zero-price-trap', weight: 0.2, benchmark: 3200 },
    ],
    gameHighScores
  );

  // 5. Cognitive Speed Domain (神经反应与处理吞吐)
  const speedScore = Math.min(
    100,
    Math.round(
      (stats.attention * 0.4) +
      (Math.min(100, ((gameHighScores['brain-rush'] || 0) / 10000) * 100) * 0.35) +
      (Math.min(100, ((gameHighScores['mind-trap'] || 0) / 5000) * 100) * 0.25)
    )
  );

  // 6. Insight & Metacognition (元认知与心智深度)
  const insightScore = Math.min(
    100,
    Math.round(
      (stats.knowledge * 0.45) +
      (Math.min(100, (((user?.lawsMastered || []).length) / 15) * 100) * 0.35) +
      (Math.min(100, ((gameHighScores['attribution-shift'] || 0) / 3000) * 100) * 0.2)
    )
  );

  // Helper to map contributing games
  const getContributingGamesList = (items: { id: string; score: number; benchmark: number; percentage: number }[]): ContributingGameScore[] => {
    return items.map((item) => {
      const def = PSYCHOLOGY_GAMES.find((g) => g.id === item.id);
      return {
        gameId: item.id,
        gameNameZh: def?.nameZh || item.id,
        gameNumber: def?.numberPrefix,
        score: item.score,
        benchmarkScore: item.benchmark,
        percentage: item.percentage,
        category: def?.category || '认知训练',
        accentColor: def?.accentColor || '#6366F1',
      };
    });
  };

  const domainList: CognitiveDomainAssessment[] = [
    {
      id: 'memory',
      nameZh: '空间与工作记忆',
      nameEn: 'Working & Spatial Memory',
      score: memoryCalc.score,
      ...getScoreTier(memoryCalc.score),
      percentile: Math.min(99, Math.round(50 + (memoryCalc.score - 50) * 0.98)),
      cohortAverage: 68,
      masterBenchmark: 92,
      description: '衡量瞬间暂存信息组块、在头脑中操纵多维空间矩阵以及防范遗忘干扰的神经能力。',
      neuroscienceMechanism: '由海马体与前额叶外侧皮层协同构建，依赖空间网格细胞与长期增益突触增强效应 (LTP)。',
      contributingGames: getContributingGamesList(memoryCalc.contributing),
      recommendedGameIds: ['memory-lab', 'peak-end', 'first-impression'],
      keyAdvice: '采用艾宾浩斯组块法与空间挂钩策略，将抽象线索锚定在熟悉的场景以延展记忆广度。',
      accentColor: '#6C4CF1',
      glowColor: 'rgba(108, 76, 241, 0.4)',
      iconName: 'brain',
    },
    {
      id: 'logic',
      nameZh: '逻辑推理与证伪',
      nameEn: 'Logic & Falsification',
      score: logicCalc.score,
      ...getScoreTier(logicCalc.score),
      percentile: Math.min(99, Math.round(50 + (logicCalc.score - 50) * 0.96)),
      cohortAverage: 65,
      masterBenchmark: 90,
      description: '衡量识别斯特鲁普自动冲突、抑制优势思维直觉并主动寻找反例黑天鹅的能力。',
      neuroscienceMechanism: '前额叶背外侧皮层（DLPFC）的认知灵活性和执行功能，是克服认知盲区的中枢基石。',
      contributingGames: getContributingGamesList(logicCalc.contributing),
      recommendedGameIds: ['mind-trap', 'falsification-challenge', 'micro-habit'],
      keyAdvice: '在作出定论前，强制自己提出“至少两个颠覆当前结论的反证假设”，启动第二系统深度检视。',
      accentColor: '#E11D48',
      glowColor: 'rgba(225, 29, 72, 0.4)',
      iconName: 'zap',
    },
    {
      id: 'focus',
      nameZh: '专注力与抗干扰',
      nameEn: 'Focus & Selective Attention',
      score: focusCalc.score,
      ...getScoreTier(focusCalc.score),
      percentile: Math.min(99, Math.round(50 + (focusCalc.score - 50) * 0.97)),
      cohortAverage: 66,
      masterBenchmark: 94,
      description: '衡量在杂乱刺激中精确过滤噪音、维持警觉性并快速捕捉关键信号的神经自控力。',
      neuroscienceMechanism: '前扣带皮层（ACC）和顶叶注意力网络协同调节，抑制背景杂波并锁定高阶目标。',
      contributingGames: getContributingGamesList(focusCalc.contributing),
      recommendedGameIds: ['brain-rush', 'emotion-detective'],
      keyAdvice: '配合呼吸节律训练降低交感神经兴奋度，通过“视觉窄化专注”迅速击退思维游移。',
      accentColor: '#F59E0B',
      glowColor: 'rgba(245, 158, 11, 0.4)',
      iconName: 'target',
    },
    {
      id: 'decision',
      nameZh: '理性决策与去偏见',
      nameEn: 'Rational Decision Making',
      score: decisionCalc.score,
      ...getScoreTier(decisionCalc.score),
      percentile: Math.min(99, Math.round(50 + (decisionCalc.score - 50) * 0.95)),
      cohortAverage: 67,
      masterBenchmark: 91,
      description: '衡量摆脱先验锚定劫持、抵抗群体盲从压力并在面对“0元免费”诱惑时计算机会成本的能力。',
      neuroscienceMechanism: '腹内侧前额叶皮层（vmPFC）与脑岛交互，调和即时情绪冲动与长远效用期望值。',
      contributingGames: getContributingGamesList(decisionCalc.contributing),
      recommendedGameIds: ['anchoring-lab', 'majority-answer', 'zero-price-trap'],
      keyAdvice: '做重要抉择前使用“10-10-10原则”（10分钟、10个月、10年后的感受）剥离短视厌恶情绪。',
      accentColor: '#059669',
      glowColor: 'rgba(5, 150, 105, 0.4)',
      iconName: 'scale',
    },
    {
      id: 'speed',
      nameZh: '神经反应速度',
      nameEn: 'Information Processing Speed',
      score: speedScore,
      ...getScoreTier(speedScore),
      percentile: Math.min(99, Math.round(50 + (speedScore - 50) * 0.94)),
      cohortAverage: 64,
      masterBenchmark: 93,
      description: '衡量视觉-运动神经回路的毫秒级反应吞吐量与快速指令执行延迟。',
      neuroscienceMechanism: '髓鞘化程度与基底核多巴胺受体通路决定了动作电位传导速度与动作准备时间。',
      contributingGames: [
        {
          gameId: 'brain-rush',
          gameNameZh: 'Brain Rush 瞬时反应',
          score: gameHighScores['brain-rush'] || 0,
          benchmarkScore: 10000,
          percentage: Math.min(100, Math.round(((gameHighScores['brain-rush'] || 0) / 10000) * 100)),
          category: '反应训练',
          accentColor: '#3B82F6',
        },
      ],
      recommendedGameIds: ['brain-rush', 'mind-trap'],
      keyAdvice: '每日进行短时高频的 60 秒限时竞技，刺激神经轴突髓鞘增厚以缩短知觉传导延迟。',
      accentColor: '#0284C7',
      glowColor: 'rgba(2, 132, 199, 0.4)',
      iconName: 'activity',
    },
    {
      id: 'insight',
      nameZh: '元认知与反思深度',
      nameEn: 'Metacognitive Insight',
      score: insightScore,
      ...getScoreTier(insightScore),
      percentile: Math.min(99, Math.round(50 + (insightScore - 50) * 0.99)),
      cohortAverage: 69,
      masterBenchmark: 95,
      description: '衡量“审视自身思考过程”的觉察力、社会归因同理心与心理学通识内化度。',
      neuroscienceMechanism: '额极皮层（Frontopolar Cortex）与默认模式网络（DMN）调控自我参照与多维同理。',
      contributingGames: [
        {
          gameId: 'attribution-shift',
          gameNameZh: '换位不读心',
          score: gameHighScores['attribution-shift'] || 0,
          benchmarkScore: 3000,
          percentage: Math.min(100, Math.round(((gameHighScores['attribution-shift'] || 0) / 3000) * 100)),
          category: '社会认知',
          accentColor: '#8B5CF6',
        },
      ],
      recommendedGameIds: ['attribution-shift', 'bystander-breaker'],
      keyAdvice: '每天在心智手记中记录一次情绪觉察与归因复盘，将直觉经验转化为显性理论体系。',
      accentColor: '#9333EA',
      glowColor: 'rgba(147, 51, 234, 0.4)',
      iconName: 'sparkles',
    },
  ];

  // Overall CQ
  const overallCq = Math.round(
    domainList.reduce((sum, d) => sum + d.score, 0) / domainList.length
  );

  // Top strength and growth opportunity
  const sortedByScore = [...domainList].sort((a, b) => b.score - a.score);
  const topStrength = sortedByScore[0];
  const growthOpportunity = sortedByScore[sortedByScore.length - 1];

  const archetype = determineArchetype(domainList);
  const percentileOverall = Math.min(99, Math.round(50 + (overallCq - 50) * 0.97));

  // Determine tailored recommended training games
  const recommendedGamesMap = new Map<string, string>();
  growthOpportunity.recommendedGameIds.forEach((id) => {
    recommendedGamesMap.set(id, `补齐最需提升的【${growthOpportunity.nameZh}】短板`);
  });
  sortedByScore[sortedByScore.length - 2].recommendedGameIds.forEach((id) => {
    if (!recommendedGamesMap.has(id)) {
      recommendedGamesMap.set(id, `强化进阶项目`);
    }
  });

  const recommendedTrainingPlan = Array.from(recommendedGamesMap.entries())
    .slice(0, 3)
    .map(([gameId, reason]) => {
      const def = PSYCHOLOGY_GAMES.find((g) => g.id === gameId);
      return {
        gameId,
        gameNameZh: def?.nameZh || gameId,
        targetDomain: def?.category || '综合认知',
        reason,
        accentColor: def?.accentColor || '#6366F1',
      };
    });

  const totalGamesCount = Object.keys(gameHighScores).length;

  return {
    overallCq,
    tier: getScoreTier(overallCq).tier,
    archetype,
    percentileOverall,
    domains: domainList,
    topStrength,
    growthOpportunity,
    totalGamesEvaluated: totalGamesCount,
    recommendedTrainingPlan,
  };
}

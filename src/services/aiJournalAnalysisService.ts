import { CognitiveJournalEntry, DailyJournalAiInsight } from '../types';

const LATEST_INSIGHT_STORAGE_KEY = 'mindlabz_latest_daily_ai_insight_v1';

/**
 * Call the AI Deep Emotional Analysis API
 */
export async function analyzeJournalEntry(
  entry: CognitiveJournalEntry
): Promise<DailyJournalAiInsight> {
  try {
    const response = await fetch('/api/journal/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ entry }),
    });

    if (!response.ok) {
      throw new Error(`Analysis request failed with status: ${response.status}`);
    }

    const data = await response.json();
    if (data.analysis) {
      const insight: DailyJournalAiInsight = {
        ...data.analysis,
        analyzedAt: data.analysis.analyzedAt || new Date().toISOString(),
      };

      // Cache locally as latest insight
      try {
        localStorage.setItem(LATEST_INSIGHT_STORAGE_KEY, JSON.stringify(insight));
      } catch {
        // ignore
      }

      return insight;
    }
    throw new Error('Malformed response from analysis API');
  } catch (error) {
    console.warn('AI Journal Analysis fallback triggered:', error);

    // Dynamic heuristic fallback based on the entry's emotion state
    const isPositive = entry.emotion?.valence === 'positive';
    const isChallenging = entry.emotion?.valence === 'challenging';
    const primary = entry.emotion?.primary || '内省';

    const fallback: DailyJournalAiInsight = {
      emotionalValence: isPositive
        ? '心流充盈 · 正向理性构建'
        : isChallenging
        ? '情绪觉察 · 启动理性重构'
        : '中和平衡 · 客观心智觉知',
      emotionalDimensions: {
        primaryEmotion: primary,
        intensityScore: Math.min(10, Math.max(1, entry.emotion?.intensity || 6)),
        stressLevel: isChallenging ? 7 : isPositive ? 2 : 4,
        metacognitiveAwareness: 8,
        resilienceScore: isPositive ? 8 : 7,
      },
      cognitiveDistortionsIdentified: isChallenging
        ? ['负面滤镜偏误', '情绪推理（以主观感受代替客观证据）']
        : ['过早认知闭合倾向'],
      psychologicalMechanism:
        '手记书写促进了前额叶皮层对情绪中枢杏仁核的下行抑制。通过把混沌的内部体感转化为具象语言符号，您在生理层面实现了情绪降温，并建立了新的神经反射通路。',
      dailyInsightSummary: `在这篇手记中，您对【${entry.title}】展现出了高度宝贵的自我觉察。当情绪被命名并被审视时，它就失去了暗中操纵决策的神秘力量。您记录的感受是大脑根据过往经验快速生成的推论假设。今天的记录证明您已经具备了跳出第一直觉、开启元认知俯瞰的优秀心智素养。`,
      actionableMicroAdvice: [
        '深呼吸4次，感受脚底与地面的触碰，完成3秒身体着陆',
        '问自己：如果最好的朋友处于相同境遇，我会怎样对他说？',
        '今晚睡前列出今日3件即便微小但也真实发生的好事',
      ],
      recommendedLawId: isChallenging ? 'LAW017' : 'LAW005',
      recommendedLawName: isChallenging ? '情绪ABC理论' : '峰终定律',
      analyzedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem(LATEST_INSIGHT_STORAGE_KEY, JSON.stringify(fallback));
    } catch {
      // ignore
    }

    return fallback;
  }
}

/**
 * Retrieve cached latest AI Insight from localStorage if available
 */
export function getCachedLatestInsight(): DailyJournalAiInsight | null {
  try {
    const raw = localStorage.getItem(LATEST_INSIGHT_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }
  return null;
}

const WEATHER_REPORT_STORAGE_KEY_PREFIX = 'mindlabz_emotional_weather_report_';

/**
 * Generate or fetch the AI Emotional Weather Report for a specific day
 */
export async function generateEmotionalWeatherReport(
  entries: CognitiveJournalEntry[],
  targetDate: string = new Date().toISOString().split('T')[0]
): Promise<import('../types').EmotionalWeatherReport> {
  try {
    const response = await fetch('/api/journal/weather-analysis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        entries,
        targetDate,
      }),
    });

    if (!response.ok) {
      throw new Error(`Weather analysis API returned status: ${response.status}`);
    }

    const data = await response.json();
    if (data.report) {
      const report: import('../types').EmotionalWeatherReport = data.report;
      cacheWeatherReport(report);
      return report;
    }
    throw new Error('Malformed emotional weather report payload');
  } catch (error) {
    console.warn('AI Weather Analysis network error, falling back locally:', error);
    // Client-side fallback computation
    const safeEntries = Array.isArray(entries) ? entries : [];
    const hasChallenging = safeEntries.some((e) => e.emotion?.valence === 'challenging');
    const hasPositive = safeEntries.some((e) => e.emotion?.valence === 'positive');
    const avgIntensity =
      safeEntries.length > 0
        ? Math.round(
            safeEntries.reduce((acc, c) => acc + (c.emotion?.intensity || 5), 0) /
              safeEntries.length
          )
        : 5;

    let condition: import('../types').WeatherConditionType = 'partly-cloudy';
    let conditionTitle = '多云晴好 · 微风沉思';
    let conditionPoeticDesc =
      '内心气象如微风拂柳，理性前额叶自如监控思维流动，情绪如微漾清波，整体处于自我调和的舒适区间。';

    if (hasChallenging && hasPositive) {
      condition = 'rainbow';
      conditionTitle = '破云晴虹 · 认知重构明朗';
      conditionPoeticDesc =
        '虽经历思维阴霾或情绪张力，但通过及时的自我察觉与元认知重塑，内心正迎来雨后初霁的壮丽彩虹。';
    } else if (hasChallenging) {
      condition = 'stormy';
      conditionTitle = '雷暴微歇 · 情绪蓄能释压';
      conditionPoeticDesc =
        '边缘系统受到压力刺激，内在气压略有走低；此刻正是启动前额叶理性刹车、进行深呼吸着陆的关键窗口。';
    } else if (hasPositive) {
      condition = 'sunny';
      conditionTitle = '澄澈暖阳 · 高阶心流朗照';
      conditionPoeticDesc =
        '大脑奖励回路多巴胺充盈，心理防御低而好奇心高，思绪通透敏锐，适宜展开深度创作与高难度决策。';
    }

    const fallback: import('../types').EmotionalWeatherReport = {
      date: targetDate,
      condition,
      conditionTitle,
      conditionPoeticDesc,
      metrics: {
        barometerHpa: hasChallenging ? 1002 : hasPositive ? 1024 : 1014,
        visibilityKm: hasChallenging ? 68 : hasPositive ? 96 : 85,
        humidityPercent: Math.min(95, Math.max(25, avgIntensity * 9)),
        windSpeedKmh: Math.min(55, Math.max(8, avgIntensity * 5)),
        temperatureC: hasPositive ? 25.5 : hasChallenging ? 28.5 : 22.0,
      },
      radarDimensions: [
        { dimension: '认知清晰度', value: hasChallenging ? 65 : 88, benchmark: 70 },
        { dimension: '元认知觉察', value: 85, benchmark: 75 },
        { dimension: '情绪复原力', value: hasPositive ? 86 : 74, benchmark: 70 },
        { dimension: '内心平稳度', value: hasChallenging ? 60 : 82, benchmark: 65 },
        { dimension: '正向动能感', value: hasPositive ? 88 : 70, benchmark: 70 },
      ],
      primaryEmotions:
        safeEntries.length > 0
          ? [
              {
                name: safeEntries[0]?.emotion?.primary || '觉察',
                percentage: 55,
                color: '#10B981',
              },
              {
                name: safeEntries[1]?.emotion?.primary || '沉思',
                percentage: 30,
                color: '#6366F1',
              },
              { name: '平静', percentage: 15, color: '#F59E0B' },
            ]
          : [
              { name: '平静觉察', percentage: 60, color: '#10B981' },
              { name: '理性内省', percentage: 40, color: '#6366F1' },
            ],
      cognitiveMechanism:
        '基于认知神经科学，当您主动书写心情手记时，背外侧前额叶皮层（dlPFC）迅速介入并下调了杏仁核（Amygdala）的警报放电。将混沌的主观体感通过文字具象命名，直接削减了默认模式网络（DMN）的情绪反刍循环，促成生理层面的心智回稳。',
      identifiedBiases: hasChallenging
        ? ['情绪推理偏误（误将主观感受等同于客观现实）', '全或无二元思维']
        : ['过早认知闭合倾向'],
      cognitiveFeedback:
        '今日您的心智探索展现出了卓越的元认知韧性。不论外界天气如何瞬息万变，情绪从来不是需要被消灭的敌人，而是神经系统为您发来的加密信使。通过今日的客观书写，您已成功夺回了大脑系统二的决策方向盘。',
      actionablePrescriptions: [
        {
          id: 'act-1',
          title: '3秒神经着陆',
          desc: '深呼吸4拍并感受双脚触地，唤醒副交感神经',
          technique: '躯体感官 5-4-3-2-1 着陆法',
          estimatedMinutes: 2,
        },
        {
          id: 'act-2',
          title: '苏格拉底质疑',
          desc: '问自己：如果最信赖的导师在此，他会指出我的哪处盲点？',
          technique: '认知解离与第三人称旁观视角',
          estimatedMinutes: 3,
        },
        {
          id: 'act-3',
          title: '睡前突触巩固',
          desc: '今晚就寝前回想今日1件顺利完成的微小行动',
          technique: '神经可塑性正向强化记忆法',
          estimatedMinutes: 3,
        },
      ],
      recommendedLaw: {
        id: hasChallenging ? 'LAW017' : 'LAW005',
        nameZh: hasChallenging ? '情绪ABC理论' : '峰终定律',
        reason: hasChallenging
          ? '厘清触发事件（A）与内心信念（B）的差异，瓦解自动消极情绪（C）'
          : '用一个充满仪式感的积极收尾，为今日的心智体验画上圆满句号',
      },
      analyzedEntriesCount: safeEntries.length,
      generatedAt: new Date().toISOString(),
      isFallback: true,
    };

    cacheWeatherReport(fallback);
    return fallback;
  }
}

export function cacheWeatherReport(report: import('../types').EmotionalWeatherReport): void {
  try {
    const key = `${WEATHER_REPORT_STORAGE_KEY_PREFIX}${report.date}`;
    localStorage.setItem(key, JSON.stringify(report));
    localStorage.setItem(`${WEATHER_REPORT_STORAGE_KEY_PREFIX}latest`, JSON.stringify(report));
  } catch {
    // ignore
  }
}

export function getCachedWeatherReport(date?: string): import('../types').EmotionalWeatherReport | null {
  try {
    const key = date
      ? `${WEATHER_REPORT_STORAGE_KEY_PREFIX}${date}`
      : `${WEATHER_REPORT_STORAGE_KEY_PREFIX}latest`;
    const raw = localStorage.getItem(key);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }
  return null;
}


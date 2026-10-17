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

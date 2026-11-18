import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  Award,
  BarChart3,
  CheckCircle2,
  CloudUpload,
  Globe,
  LogIn,
  Target,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { WORLD_CAPITALS } from '../../data/worldCapitals';
import {
  WorldCityProgressState,
  checkCityCompleted,
  getTotalCompletedChapters,
} from '../../hooks/useCityQuizProgress';
import {
  buildGlobalRankComparison,
  GlobalCognitivePeer,
  RapidQuizAccuracyStats,
  submitRapidQuizRankToLeaderboard,
  subscribeRapidQuizCloudPeers,
} from '../../services/globalCognitiveRankService';

interface GlobalCognitiveRankCardProps {
  progress: WorldCityProgressState;
  accuracyStats: RapidQuizAccuracyStats;
  latestRunAccuracy?: number | null;
}

type ComparisonSortMode = 'composite' | 'levels' | 'accuracy';

export const GlobalCognitiveRankCard: React.FC<GlobalCognitiveRankCardProps> = ({
  progress,
  accuracyStats,
  latestRunAccuracy = null,
}) => {
  const { user, firebaseUser, openAuthModal } = useApp();
  const [sortMode, setSortMode] = useState<ComparisonSortMode>('composite');
  const [cloudPeers, setCloudPeers] = useState<GlobalCognitivePeer[]>([]);
  const [showAllPeers, setShowAllPeers] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const [brokenAvatars, setBrokenAvatars] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const unsubscribe = subscribeRapidQuizCloudPeers((peers) => {
      setCloudPeers(peers);
    });
    return () => unsubscribe();
  }, []);

  const userLevelsCompleted = useMemo(
    () => getTotalCompletedChapters(progress),
    [progress]
  );

  const userCapitalsCompleted = useMemo(() => {
    let count = 0;
    for (let c = 0; c < WORLD_CAPITALS.length; c++) {
      if (checkCityCompleted(progress, c)) count++;
    }
    return count;
  }, [progress]);

  const effectiveUserAccuracy = useMemo(() => {
    if (accuracyStats.runsCompleted > 0) {
      return accuracyStats.averageAccuracy;
    }
    if (typeof latestRunAccuracy === 'number') {
      return Math.max(0, Math.min(100, Math.round(latestRunAccuracy)));
    }
    return Math.max(60, Math.min(100, Math.round(user.stats?.knowledge || 78)));
  }, [accuracyStats, latestRunAccuracy, user.stats?.knowledge]);

  const currentUserId = firebaseUser?.uid || `local_${user.name || 'explorer'}`;

  const comparison = useMemo(
    () =>
      buildGlobalRankComparison({
        currentUserId,
        userName: user.name,
        userAvatar: user.avatar,
        userTitle: user.title,
        userLevelsCompleted,
        userCapitalsCompleted,
        userAccuracy: effectiveUserAccuracy,
        cloudPeers,
        sortMode,
      }),
    [
      currentUserId,
      user.name,
      user.avatar,
      user.title,
      userLevelsCompleted,
      userCapitalsCompleted,
      effectiveUserAccuracy,
      cloudPeers,
      sortMode,
    ]
  );

  const handleSyncToCloud = async () => {
    if (!firebaseUser) {
      openAuthModal();
      return;
    }
    setIsSyncing(true);
    setSyncNotice(null);
    const res = await submitRapidQuizRankToLeaderboard({
      userId: firebaseUser.uid,
      userName: user.name,
      userAvatar: user.avatar,
      userTitle: user.title,
      userLevel: user.level,
      levelsCompleted: userLevelsCompleted,
      capitalsCompleted: userCapitalsCompleted,
      accuracy: effectiveUserAccuracy,
      streak: user.streak,
    });
    setIsSyncing(false);
    if (res.syncedToCloud) {
      setSyncNotice('已将你的首都闯关数与准确率同步至全球云端排位榜。');
    } else {
      setSyncNotice('当前已保存在本地排位档案，请检查网络或稍后重试云端同步。');
    }
    window.setTimeout(() => setSyncNotice(null), 3500);
  };

  const maxLevelsScale = Math.max(
    1,
    comparison.topTenPercentLevels,
    comparison.cohortAvgLevels,
    userLevelsCompleted,
    50
  );

  const levelDelta = userLevelsCompleted - comparison.cohortAvgLevels;
  const accuracyDelta = effectiveUserAccuracy - comparison.cohortAvgAccuracy;

  // Ensure the user's own row is always visible in the compact view
  const displayedPeers = useMemo(() => {
    if (showAllPeers) return comparison.peers;
    const topFive = comparison.peers.slice(0, 5);
    const userInTopFive = topFive.some((p) => p.isCurrentUser);
    if (userInTopFive) return topFive;
    const userRow = comparison.peers.find((p) => p.isCurrentUser);
    return userRow ? [...topFive.slice(0, 4), userRow] : topFive;
  }, [comparison.peers, showAllPeers]);

  return (
    <section
      aria-label="Global Cognitive Rank"
      className="w-full editorial-card rounded-2xl p-6 sm:p-8 text-left space-y-6"
    >
      {/* Card Header & Primary Standing */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-stone-200/80">
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2 text-xs text-stone-600 flex-wrap">
            <span className="editorial-kicker text-[11px] text-stone-800">
              Global Cognitive Rank · 全球认知排位榜
            </span>
            <span className="text-stone-300" aria-hidden="true">·</span>
            <span className="font-numeric tabular-nums text-stone-600">
              {cloudPeers.length > 0
                ? `已接入 ${cloudPeers.length} 位云端同行 + 全球基准队列`
                : '全球基准队列实时比对'}
            </span>
          </div>

          <h2 className="font-serif-editorial text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
            世界首都闯关 · 全球心智战力对比
          </h2>

          <p className="text-xs sm:text-sm text-stone-600 font-numeric tabular-nums flex items-center gap-2 flex-wrap">
            <span>
              当前排位{' '}
              <strong className="text-stone-900 font-bold">
                第 {comparison.userRank} / {comparison.totalCohortSize} 名
              </strong>
            </span>
            <span className="text-stone-300" aria-hidden="true">·</span>
            <span>
              超越全球{' '}
              <strong className="text-emerald-800 font-bold">
                {comparison.percentile}%
              </strong>{' '}
              探索者
            </span>
            <span className="text-stone-300" aria-hidden="true">·</span>
            <span>
              已破 {userLevelsCompleted} 关（{userCapitalsCompleted}/50 首都）
            </span>
            <span className="text-stone-300" aria-hidden="true">·</span>
            <span>
              准确率 {effectiveUserAccuracy}%
              {accuracyStats.runsCompleted === 0 ? ' (预估基准)' : ''}
            </span>
          </p>
        </div>

        {/* Sort Segmented Tabs & Sync Action */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div
            role="tablist"
            aria-label="排位对比维度"
            className="inline-flex items-center gap-1 p-1 rounded-xl bg-stone-100 border border-stone-200/80"
          >
            {(
              [
                { id: 'composite', label: '综合排位' },
                { id: 'levels', label: '通关数' },
                { id: 'accuracy', label: '准确率' },
              ] as const
            ).map((tab) => {
              const active = sortMode === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSortMode(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleSyncToCloud}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-stone-200 hover:border-stone-400 text-xs font-semibold text-stone-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
          >
            {firebaseUser ? (
              <>
                <CloudUpload className="w-3.5 h-3.5 text-stone-700" />
                <span>{isSyncing ? '同步中...' : '同步云端排位'}</span>
              </>
            ) : (
              <>
                <LogIn className="w-3.5 h-3.5 text-stone-700" />
                <span>登录同步排名</span>
              </>
            )}
          </button>
        </div>
      </div>

      {syncNotice && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{syncNotice}</span>
        </div>
      )}

      {/* Dual Comparison Metric Panels: Levels Completed vs. Accuracy */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Metric 1: Levels Completed Comparison */}
        <div className="rounded-xl bg-[#FAF8F5] border border-stone-200/80 p-4 sm:p-5 space-y-3.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-stone-900">
              <BarChart3 className="w-4 h-4 text-amber-700 shrink-0" aria-hidden="true" />
              <h3 className="text-sm font-bold">已通关章节对比 · Levels Completed</h3>
            </div>
            <span
              className={`text-xs font-semibold font-numeric tabular-nums ${
                levelDelta >= 0 ? 'text-emerald-800' : 'text-stone-600'
              }`}
            >
              {levelDelta >= 0 ? `高于均值 +${levelDelta} 关` : `距均值 ${levelDelta} 关`}
            </span>
          </div>

          <div className="space-y-2.5 text-xs font-numeric tabular-nums">
            {/* You */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-stone-900 font-semibold">
                <span>你的战绩（{userCapitalsCompleted}/50 首都）</span>
                <span>{userLevelsCompleted} 关</span>
              </div>
              <div className="w-full h-2.5 bg-stone-200/90 rounded-full overflow-hidden">
                <motion.div
                  className="h-full w-full chameleon-bar rounded-full"
                  style={{ transformOrigin: 'left center' }}
                  initial={false}
                  animate={{
                    scaleX: Math.max(0.02, Math.min(1, userLevelsCompleted / maxLevelsScale)),
                  }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            </div>

            {/* Cohort Avg */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-stone-600">
                <span>全球队列平均</span>
                <span>{comparison.cohortAvgLevels} 关</span>
              </div>
              <div className="w-full h-2 bg-stone-200/80 rounded-full overflow-hidden">
                <div
                  className="h-full bg-stone-500 rounded-full transition-transform duration-300"
                  style={{
                    width: `${Math.max(
                      3,
                      Math.min(100, (comparison.cohortAvgLevels / maxLevelsScale) * 100)
                    )}%`,
                  }}
                />
              </div>
            </div>

            {/* Top 10% */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-stone-600">
                <span>全球前 10% 梯队标杆</span>
                <span>{comparison.topTenPercentLevels} 关</span>
              </div>
              <div className="w-full h-2 bg-stone-200/80 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-600 rounded-full transition-transform duration-300"
                  style={{
                    width: `${Math.max(
                      4,
                      Math.min(100, (comparison.topTenPercentLevels / maxLevelsScale) * 100)
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Metric 2: Accuracy Comparison */}
        <div className="rounded-xl bg-[#FAF8F5] border border-stone-200/80 p-4 sm:p-5 space-y-3.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-stone-900">
              <Target className="w-4 h-4 text-emerald-700 shrink-0" aria-hidden="true" />
              <h3 className="text-sm font-bold">首次命中准确率 · Accuracy</h3>
            </div>
            <span
              className={`text-xs font-semibold font-numeric tabular-nums ${
                accuracyDelta >= 0 ? 'text-emerald-800' : 'text-amber-800'
              }`}
            >
              {accuracyDelta >= 0 ? `高于均值 +${accuracyDelta}%` : `距均值 ${accuracyDelta}%`}
            </span>
          </div>

          <div className="space-y-2.5 text-xs font-numeric tabular-nums">
            {/* You */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-stone-900 font-semibold">
                <span>
                  你的准确率
                  {accuracyStats.runsCompleted > 0
                    ? `（已测 ${accuracyStats.runsCompleted} 章 · 最高 ${accuracyStats.bestAccuracy}%）`
                    : '（初始基准）'}
                </span>
                <span>{effectiveUserAccuracy}%</span>
              </div>
              <div className="w-full h-2.5 bg-stone-200/90 rounded-full overflow-hidden">
                <motion.div
                  className="h-full w-full bg-emerald-600 rounded-full"
                  style={{ transformOrigin: 'left center' }}
                  initial={false}
                  animate={{ scaleX: Math.max(0.02, effectiveUserAccuracy / 100) }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            </div>

            {/* Cohort Avg */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-stone-600">
                <span>全球队列平均</span>
                <span>{comparison.cohortAvgAccuracy}%</span>
              </div>
              <div className="w-full h-2 bg-stone-200/80 rounded-full overflow-hidden">
                <div
                  className="h-full bg-stone-500 rounded-full"
                  style={{ width: `${comparison.cohortAvgAccuracy}%` }}
                />
              </div>
            </div>

            {/* Top 10% */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-stone-600">
                <span>全球前 10% 梯队标杆</span>
                <span>{comparison.topTenPercentAccuracy}%</span>
              </div>
              <div className="w-full h-2 bg-stone-200/80 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-600 rounded-full"
                  style={{ width: `${comparison.topTenPercentAccuracy}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Peer Comparison Table */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs text-stone-500 px-1">
          <span className="flex items-center gap-1.5 font-medium text-stone-700">
            <Award className="w-3.5 h-3.5 text-amber-700" aria-hidden="true" />
            <span>全球同行位次参照</span>
          </span>
          <span className="font-numeric tabular-nums">已通关数 · 准确率</span>
        </div>

        <div className="divide-y divide-stone-200/75 rounded-xl border border-stone-200/85 bg-white overflow-hidden">
          {displayedPeers.map((peer) => {
            const actualRank =
              comparison.peers.findIndex((item) => item.id === peer.id && item.userId === peer.userId) + 1;
            const initials = (peer.userName || 'M').slice(0, 1).toUpperCase();
            const showFallbackAvatar = !peer.userAvatar || brokenAvatars[peer.id];

            return (
              <div
                key={`${peer.id}-${peer.userId}`}
                className={`flex items-center justify-between gap-3 px-3.5 sm:px-4 py-2.5 transition-colors ${
                  peer.isCurrentUser ? 'bg-stone-100/95' : 'hover:bg-[#FAF8F5]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`w-6 text-center font-numeric tabular-nums text-xs sm:text-sm shrink-0 ${
                      actualRank <= 3 || peer.isCurrentUser
                        ? 'font-bold text-stone-900'
                        : 'font-medium text-stone-500'
                    }`}
                  >
                    #{actualRank}
                  </span>

                  {showFallbackAvatar ? (
                    <div className="w-8 h-8 rounded-full bg-stone-200 text-stone-700 text-xs font-bold flex items-center justify-center shrink-0">
                      {initials}
                    </div>
                  ) : (
                    <img
                      src={peer.userAvatar}
                      alt={peer.userName}
                      referrerPolicy="no-referrer"
                      onError={() =>
                        setBrokenAvatars((prev) => ({ ...prev, [peer.id]: true }))
                      }
                      className="w-8 h-8 rounded-full object-cover border border-stone-200 shrink-0 bg-stone-100"
                    />
                  )}

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-stone-900 truncate">
                      <span className="truncate">{peer.userName}</span>
                      {peer.isCurrentUser && (
                        <>
                          <span className="text-stone-300" aria-hidden="true">·</span>
                          <span className="text-amber-800 text-xs font-bold shrink-0">
                            你当前位置
                          </span>
                        </>
                      )}
                    </div>
                    <div className="text-[11px] text-stone-500 flex items-center gap-1.5 truncate">
                      <span className="truncate">{peer.userTitle}</span>
                      {peer.capitalsCompleted > 0 && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-0.5 text-stone-600 shrink-0">
                            <Globe className="w-3 h-3" aria-hidden="true" />
                            <span>已贯通 {peer.capitalsCompleted} 城</span>
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right font-numeric tabular-nums shrink-0 pl-2">
                  <div className="text-xs sm:text-sm font-bold text-stone-900">
                    {peer.levelsCompleted} 关
                  </div>
                  <div className="text-[11px] text-emerald-800 font-medium">
                    准确率 {peer.accuracy}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {comparison.peers.length > 5 && (
          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => setShowAllPeers((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white border border-stone-200 hover:border-stone-400 text-xs font-semibold text-stone-700 cursor-pointer transition-colors"
            >
              {showAllPeers ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  <span>收起榜单</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  <span>查看全部 {comparison.peers.length} 位同行对比</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

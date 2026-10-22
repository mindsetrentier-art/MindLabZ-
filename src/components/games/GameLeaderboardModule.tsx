import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Crown,
  Medal,
  Flame,
  Zap,
  Sparkles,
  RefreshCw,
  Users,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  LogIn,
  UploadCloud,
  ShieldCheck,
  Gamepad2,
  Calendar,
} from 'lucide-react';
import {
  LeaderboardEntry,
  subscribeTodayLeaderboard,
  submitGameScoreToLeaderboard,
  getTodayDateString,
} from '../../services/leaderboardService';
import { useApp } from '../../context/AppContext';
import { PSYCHOLOGY_GAMES } from '../../data/games';

const LEADERBOARD_TABS = [
  { id: 'all', label: '🏆 今日综合总榜', shortName: '今日总榜' },
  { id: 'first-impression', label: '首因效应瞬时记忆', shortName: '首因记忆' },
  { id: 'anchoring-lab', label: '锚点实验室', shortName: '锚点估值' },
  { id: 'majority-answer', label: '多数人答案从众博弈', shortName: '从众博弈' },
  { id: 'peak-end', label: '峰终定律体验复盘', shortName: '峰终体验' },
  { id: 'emotion-detective', label: '情绪侦探微表情', shortName: '情绪侦探' },
  { id: 'zero-price-trap', label: '免费陷阱理性决策', shortName: '免费决策' },
  { id: 'falsification-challenge', label: '反证挑战四卡片', shortName: '四卡反证' },
  { id: 'micro-habit', label: '微习惯强化筑基', shortName: '微习惯' },
  { id: 'bystander-breaker', label: '旁观者责任破局', shortName: '责任破局' },
];

export const GameLeaderboardModule: React.FC = () => {
  const { user, firebaseUser, openAuthModal, triggerConfetti } = useApp();
  const [selectedGameTab, setSelectedGameTab] = useState<string>('all');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isSyncingScore, setIsSyncingScore] = useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const todayStr = getTodayDateString();

  // Subscribe to real-time updates from Firestore
  useEffect(() => {
    setIsRefreshing(true);
    const unsubscribe = subscribeTodayLeaderboard(
      selectedGameTab,
      (updatedList) => {
        setEntries(updatedList);
        setIsRefreshing(false);
      },
      () => {
        setIsRefreshing(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [selectedGameTab]);

  // Handle manual refresh
  const handleManualRefresh = () => {
    setIsRefreshing(true);
    const unsubscribe = subscribeTodayLeaderboard(selectedGameTab, (list) => {
      setEntries(list);
      setIsRefreshing(false);
    });
    setTimeout(() => {
      setIsRefreshing(false);
      unsubscribe();
    }, 800);
  };

  // Find user's current rank in this category
  const currentUserId = firebaseUser?.uid || user.name;
  const userRankIndex = entries.findIndex(
    (e) =>
      e.userId === currentUserId ||
      (firebaseUser?.uid && e.userId === firebaseUser.uid) ||
      e.userName === user.name
  );
  const userRank = userRankIndex >= 0 ? userRankIndex + 1 : null;
  const userScore = userRankIndex >= 0 ? entries[userRankIndex].score : null;

  // Manual button to submit / sync user's current top score to Firestore
  const handleSyncMyScore = async () => {
    setIsSyncingScore(true);
    setSyncFeedback(null);

    // Calculate score to push
    let scoreToSubmit = 0;
    let gameDisplayName = '今日综合总榜';

    if (selectedGameTab === 'all') {
      // Sum user's high scores
      scoreToSubmit = Object.values(user.gameHighScores || {}).reduce<number>(
        (a: number, b: unknown) => a + Number(b || 0),
        0
      );
      if (scoreToSubmit === 0) {
        scoreToSubmit = Math.max(380, (user.xp || 500) * 2);
      }
    } else {
      scoreToSubmit = Number(user.gameHighScores?.[selectedGameTab] || 850);
      const found = PSYCHOLOGY_GAMES.find((g) => g.id === selectedGameTab);
      if (found) gameDisplayName = found.nameZh || found.name;
    }

    const res = await submitGameScoreToLeaderboard({
      userId: firebaseUser?.uid || 'guest_user',
      userName: user.name || '智心学者',
      userAvatar: user.avatar,
      userTitle: user.title || '认知研习者',
      userLevel: user.level || 1,
      gameId: selectedGameTab,
      gameName: gameDisplayName,
      score: scoreToSubmit,
      accuracy: 95,
      streak: user.streak || 1,
    });

    setIsSyncingScore(false);

    if (res.success) {
      triggerConfetti();
      setSyncFeedback(
        `✓ 你的每日战绩 (${scoreToSubmit.toLocaleString()} 分) 已实时同步到云端排行榜！`
      );
      setTimeout(() => setSyncFeedback(null), 4000);
    } else {
      setSyncFeedback('成绩已保存在本地，登录后可同步至全球公榜。');
      setTimeout(() => setSyncFeedback(null), 4000);
    }
  };

  // Top 3 champions
  const top1 = entries[0];
  const top2 = entries[1];
  const top3 = entries[2];
  const restEntries = entries.slice(3, 20);

  return (
    <section className="relative rounded-3xl overflow-hidden border border-stone-800 bg-gradient-to-b from-[#131326] via-[#1A1838] to-[#121124] text-white p-5 sm:p-7 md:p-9 shadow-2xl space-y-6">
      {/* Background ambient neon glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 rounded-full bg-purple-500/15 blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 font-bold font-mono">
              <Trophy className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              DAILY ARENA LEADERBOARD
            </span>
            <span className="text-stone-500">/</span>
            <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Firebase Firestore 实时同步
            </span>
          </div>

          <h2 className="font-serif-editorial text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>每日认知竞技排行榜</span>
            <span className="text-xs font-numeric font-normal text-stone-400 px-2 py-0.5 rounded-md bg-white/5 border border-white/10">
              {todayStr}
            </span>
          </h2>
          <p className="text-xs text-stone-300 max-w-xl leading-relaxed">
            展示今日各认知实验与竞技小游戏的每日最高得分。每次通关游戏自动更新，与全球研习者同台切磋心智敏锐度。
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs text-stone-200 font-medium transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            title="刷新实时排行榜"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`}
            />
            <span>{isRefreshing ? '同步中...' : '刷新榜单'}</span>
          </button>

          <button
            type="button"
            onClick={handleSyncMyScore}
            disabled={isSyncingScore}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-500/25 cursor-pointer active:scale-95 disabled:opacity-50"
            title="上传你的今日最好成绩"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>{isSyncingScore ? '正在上传...' : '同步我的战绩'}</span>
          </button>
        </div>
      </div>

      {/* Sync Toast Feedback */}
      {syncFeedback && (
        <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs flex items-center justify-between gap-2 animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{syncFeedback}</span>
          </div>
          <button
            type="button"
            onClick={() => setSyncFeedback(null)}
            className="text-[10px] opacity-70 hover:opacity-100 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Game Filter Carousel Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {LEADERBOARD_TABS.map((tab) => {
          const isSelected = selectedGameTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedGameTab(tab.id)}
              type="button"
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 active:scale-95 ${
                isSelected
                  ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-stone-950 shadow-md shadow-amber-400/20 font-extrabold'
                  : 'bg-white/5 hover:bg-white/10 text-stone-300 border border-white/10'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Top 3 Champions Podium */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-2">
        {/* Rank 2 (Silver) */}
        {top2 && (
          <div className="order-2 sm:order-1 rounded-2xl bg-gradient-to-b from-stone-800/80 to-stone-900/90 border border-stone-600/50 p-4 text-center flex flex-col items-center justify-between relative shadow-lg group hover:border-stone-400 transition-all">
            <div className="w-full flex items-center justify-between text-xs text-stone-400 font-mono mb-2">
              <span className="inline-flex items-center gap-1 font-bold text-stone-300">
                <Medal className="w-4 h-4 text-stone-300" />
                NO. 2 亚军
              </span>
              <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-stone-300">
                🥈 SILVER
              </span>
            </div>

            <div className="relative my-2">
              <div className="w-16 h-16 rounded-full p-1 bg-gradient-to-tr from-stone-400 to-white shadow-md">
                <img
                  src={top2.userAvatar}
                  alt={top2.userName}
                  className="w-full h-full rounded-full object-cover bg-stone-800"
                />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-stone-300 text-stone-900 font-black text-xs flex items-center justify-center border-2 border-stone-900">
                2
              </div>
            </div>

            <div className="space-y-0.5 w-full">
              <h4 className="font-serif-editorial font-bold text-sm text-stone-100 truncate">
                {top2.userName}
              </h4>
              <p className="text-[11px] text-stone-400 truncate">{top2.userTitle}</p>
            </div>

            <div className="mt-3 pt-2.5 border-t border-white/10 w-full flex items-center justify-between text-xs font-numeric">
              <span className="text-stone-400 text-[10px]">今日战力</span>
              <span className="text-base font-black text-stone-200">
                {top2.score.toLocaleString()} <span className="text-[10px] text-stone-400 font-normal">分</span>
              </span>
            </div>
          </div>
        )}

        {/* Rank 1 (Gold Champion) */}
        {top1 && (
          <div className="order-1 sm:order-2 rounded-2xl bg-gradient-to-b from-amber-950/40 via-[#262016] to-[#1a1420] border-2 border-amber-400/80 p-5 text-center flex flex-col items-center justify-between relative shadow-xl shadow-amber-500/10 group sm:-translate-y-2">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-stone-950 text-[10px] font-black uppercase tracking-wider shadow-md flex items-center gap-1">
              <Crown className="w-3 h-3 fill-stone-950" />
              <span>今日冠军</span>
            </div>

            <div className="w-full flex items-center justify-between text-xs text-amber-300 font-mono mb-2 pt-1">
              <span className="inline-flex items-center gap-1 font-bold text-amber-300">
                🥇 NO. 1 魁首
              </span>
              <span className="text-[10px] bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded">
                GOLD
              </span>
            </div>

            <div className="relative my-2">
              <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-500 shadow-lg shadow-amber-400/30">
                <img
                  src={top1.userAvatar}
                  alt={top1.userName}
                  className="w-full h-full rounded-full object-cover bg-stone-800"
                />
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-amber-400 text-stone-950 font-black text-sm flex items-center justify-center border-2 border-stone-900 shadow-md">
                1
              </div>
            </div>

            <div className="space-y-0.5 w-full">
              <h4 className="font-serif-editorial font-extrabold text-base text-amber-200 truncate">
                {top1.userName}
              </h4>
              <p className="text-xs text-stone-300 truncate">{top1.userTitle}</p>
            </div>

            <div className="mt-3 pt-2.5 border-t border-amber-400/20 w-full flex items-center justify-between text-xs font-numeric">
              <span className="text-amber-300/80 text-[10px] font-medium flex items-center gap-1">
                <Flame className="w-3 h-3 text-amber-400 fill-amber-400" />
                连胜 {top1.streak} 天
              </span>
              <span className="text-lg font-black text-amber-300">
                {top1.score.toLocaleString()} <span className="text-[11px] text-amber-400/80 font-normal">分</span>
              </span>
            </div>
          </div>
        )}

        {/* Rank 3 (Bronze) */}
        {top3 && (
          <div className="order-3 sm:order-3 rounded-2xl bg-gradient-to-b from-[#221612]/80 to-[#191118]/90 border border-amber-700/50 p-4 text-center flex flex-col items-center justify-between relative shadow-lg group hover:border-amber-600 transition-all">
            <div className="w-full flex items-center justify-between text-xs text-amber-500 font-mono mb-2">
              <span className="inline-flex items-center gap-1 font-bold text-amber-500">
                <Medal className="w-4 h-4 text-amber-600" />
                NO. 3 季军
              </span>
              <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-amber-500">
                🥉 BRONZE
              </span>
            </div>

            <div className="relative my-2">
              <div className="w-16 h-16 rounded-full p-1 bg-gradient-to-tr from-amber-700 via-amber-600 to-amber-800 shadow-md">
                <img
                  src={top3.userAvatar}
                  alt={top3.userName}
                  className="w-full h-full rounded-full object-cover bg-stone-800"
                />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-700 text-white font-black text-xs flex items-center justify-center border-2 border-stone-900">
                3
              </div>
            </div>

            <div className="space-y-0.5 w-full">
              <h4 className="font-serif-editorial font-bold text-sm text-stone-100 truncate">
                {top3.userName}
              </h4>
              <p className="text-[11px] text-stone-400 truncate">{top3.userTitle}</p>
            </div>

            <div className="mt-3 pt-2.5 border-t border-white/10 w-full flex items-center justify-between text-xs font-numeric">
              <span className="text-stone-400 text-[10px]">今日战力</span>
              <span className="text-base font-black text-amber-400">
                {top3.score.toLocaleString()} <span className="text-[10px] text-stone-400 font-normal">分</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Ranks 4 to 20 List */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between text-[11px] font-mono text-stone-400 px-3">
          <span>位次 · 研习选手</span>
          <span>完成项目 · 今日得分</span>
        </div>

        <div className="divide-y divide-white/5 rounded-2xl bg-white/[0.03] border border-white/10 overflow-hidden">
          {restEntries.map((entry, idx) => {
            const rankNum = idx + 4;
            const isMe =
              entry.userId === currentUserId ||
              (firebaseUser?.uid && entry.userId === firebaseUser.uid) ||
              entry.userName === user.name;

            return (
              <div
                key={entry.id || idx}
                className={`flex items-center justify-between p-3 sm:px-4 hover:bg-white/[0.05] transition-colors ${
                  isMe ? 'bg-indigo-900/30 border-l-4 border-l-indigo-400' : ''
                }`}
              >
                {/* Left: Rank & Avatar & Details */}
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-numeric font-black text-sm text-stone-400 w-6 text-center shrink-0">
                    {rankNum}
                  </span>

                  <div className="w-9 h-9 rounded-full bg-stone-700 overflow-hidden shrink-0 border border-white/20">
                    <img
                      src={entry.userAvatar}
                      alt={entry.userName}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white truncate max-w-[140px] sm:max-w-[200px]">
                        {entry.userName}
                      </span>
                      {isMe && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-500 text-white font-mono">
                          YOU
                        </span>
                      )}
                      <span className="text-[10px] font-mono text-stone-400 hidden sm:inline">
                        Lv.{entry.userLevel}
                      </span>
                    </div>
                    <span className="text-[10px] text-stone-400 block truncate">
                      {entry.userTitle}
                    </span>
                  </div>
                </div>

                {/* Right: Accuracy & Score */}
                <div className="text-right shrink-0 font-numeric pl-2">
                  <div className="text-sm font-black text-amber-300">
                    {entry.score.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-stone-400 flex items-center justify-end gap-1">
                    <span>{entry.gameName}</span>
                    <span className="text-emerald-400">({entry.accuracy}%)</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* User's Sticky Floating Rank Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/80 via-purple-950/60 to-stone-900/90 border border-indigo-500/40 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-11 h-11 rounded-full object-cover border-2 border-indigo-400 shadow-md"
            />
            {userRank && userRank <= 3 && (
              <span className="absolute -top-1 -right-1 text-xs">
                {userRank === 1 ? '🥇' : userRank === 2 ? '🥈' : '🥉'}
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">{user.name}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 font-semibold">
                Lv.{user.level} · {user.title}
              </span>
            </div>

            <div className="text-[11px] text-stone-300 mt-0.5 flex items-center gap-2">
              <span>
                当前排位: {userRank ? <strong className="text-amber-300 font-bold">第 {userRank} 名</strong> : '今日尚未上榜'}
              </span>
              <span>·</span>
              <span>
                今日最高成绩: <strong className="text-emerald-300 font-bold font-numeric">{userScore ? userScore.toLocaleString() : (user.xp || 0).toLocaleString()} 分</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2 shrink-0">
          {!firebaseUser ? (
            <button
              type="button"
              onClick={openAuthModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-stone-100 text-stone-950 text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <LogIn className="w-3.5 h-3.5 text-indigo-600" />
              <span>登录 Google 永久锁榜</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSyncMyScore}
              disabled={isSyncingScore}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-indigo-600/30 active:scale-95 disabled:opacity-50"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>更新我的排位</span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

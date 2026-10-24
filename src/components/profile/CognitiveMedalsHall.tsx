import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Award,
  Crown,
  Medal,
  Trophy,
  Flame,
  Zap,
  Target,
  Lock,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  TrendingUp,
  X,
  Gamepad2,
  BookOpen,
} from 'lucide-react';
import { Badge, UserProfile } from '../../types';
import { BADGES_DATA } from '../../data/badges';
import {
  getBadgeProgress,
  getMedalTierDetails,
} from '../../services/badgeService';
import { gameAudio } from '../../utils/gameAudio';

interface CognitiveMedalsHallProps {
  user: UserProfile;
}

export const CognitiveMedalsHall: React.FC<CognitiveMedalsHallProps> = ({ user }) => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [activeModalBadge, setActiveModalBadge] = useState<Badge | null>(null);

  const unlockedSet = new Set(user?.unlockedBadges || []);
  const totalBadgesCount = BADGES_DATA.length;
  const unlockedCount = BADGES_DATA.filter((b) => unlockedSet.has(b.id)).length;
  const completionPercentage = Math.round((unlockedCount / totalBadgesCount) * 100);

  // Total XP gained from unlocked badges
  const totalBonusXpEarned = BADGES_DATA.filter((b) => unlockedSet.has(b.id)).reduce(
    (acc, b) => acc + (b.xpBonus || 0),
    0
  );

  // Filtered badges list
  const filteredBadges = BADGES_DATA.filter((badge) => {
    // Category filter
    if (selectedCategory !== 'all' && badge.category !== selectedCategory) {
      return false;
    }
    // Status filter
    const isUnlocked = unlockedSet.has(badge.id);
    if (selectedStatus === 'unlocked' && !isUnlocked) return false;
    if (selectedStatus === 'locked' && isUnlocked) return false;
    return true;
  });

  const handleBadgeClick = (badge: Badge) => {
    gameAudio.playTap();
    setActiveModalBadge(badge);
  };

  return (
    <section className="editorial-card rounded-2xl p-6 sm:p-8 md:p-9 space-y-6 bg-white border border-stone-200">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200/80">
        <div>
          <span className="editorial-kicker text-[10px] text-amber-700 font-bold block mb-0.5">
            COGNITIVE MEDAL SYSTEM · 认知勋章与心智荣誉殿堂
          </span>
          <h3 className="font-serif-editorial text-lg sm:text-2xl font-bold text-stone-900 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-600" />
            <span>认知勋章体系与心智成就殿堂</span>
          </h3>
          <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">
            在各心理学实验小游戏取得特定高分、保持连续训练天数或掌握定律体系时，自动解锁并镌刻对应精美勋章。
          </p>
        </div>

        {/* Top Badges Counter Badge */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="px-3.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200/90 text-amber-900 font-numeric text-xs font-bold flex items-center gap-1.5 shadow-2xs">
            <Award className="w-4 h-4 text-amber-600" />
            <span>已点亮 {unlockedCount} / {totalBadgesCount} 枚</span>
          </div>
        </div>
      </div>

      {/* 2. Visual Progress & Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-[#FAF8F5] border border-stone-200/90 font-numeric text-xs">
        <div className="space-y-1">
          <div className="flex justify-between text-stone-500 text-[11px]">
            <span>勋章点亮进度</span>
            <span className="font-bold text-stone-800">{completionPercentage}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-stone-200 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-500"
              style={{ width: `${Math.max(5, completionPercentage)}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-center gap-2 border-t sm:border-t-0 sm:border-l border-stone-200/80 pt-2 sm:pt-0 sm:pl-4">
          <span className="text-stone-500 text-[11px]">累计勋章经验收益</span>
          <span className="text-stone-900 font-extrabold text-sm flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            +{totalBonusXpEarned.toLocaleString()} XP
          </span>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2 border-t sm:border-t-0 sm:border-l border-stone-200/80 pt-2 sm:pt-0 sm:pl-4">
          <span className="text-stone-500 text-[11px]">当前殿堂境界</span>
          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
            {unlockedCount >= 10 ? '👑 宗师学阀' : unlockedCount >= 5 ? '💎 觉察先锋' : '🥇 初探门径'}
          </span>
        </div>
      </div>

      {/* 3. Filter Controls */}
      <div className="space-y-2.5">
        {/* Category Tabs */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {[
              { id: 'all', label: '全部勋章' },
              { id: 'game', label: '🎮 训练高分' },
              { id: 'streak', label: '🔥 连续毅力' },
              { id: 'knowledge', label: '🎯 定律内化' },
              { id: 'quiz', label: '⚡ 问答测验' },
            ].map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    gameAudio.playTap();
                    setSelectedCategory(cat.id);
                  }}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                    active
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'bg-[#FAF8F5] text-stone-600 hover:text-stone-900 border border-stone-200'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Status Sub-filter */}
          <div className="flex items-center gap-1 text-[11px] font-medium bg-[#FAF8F5] p-1 rounded-xl border border-stone-200 shrink-0">
            {[
              { id: 'all', label: '全部' },
              { id: 'unlocked', label: `已点亮 (${unlockedCount})` },
              { id: 'locked', label: `未解锁 (${totalBadgesCount - unlockedCount})` },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => {
                  gameAudio.playTap();
                  setSelectedStatus(st.id as any);
                }}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  selectedStatus === st.id
                    ? 'bg-white font-bold text-stone-900 shadow-2xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Badges Medal Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 pt-1">
        {filteredBadges.map((badge) => {
          const isUnlocked = unlockedSet.has(badge.id);
          const progress = getBadgeProgress(badge, user);
          const tierDetails = getMedalTierDetails(badge.tier);

          return (
            <div
              key={badge.id}
              onClick={() => handleBadgeClick(badge)}
              className={`group relative rounded-2xl p-4.5 border transition-all cursor-pointer flex flex-col justify-between ${
                isUnlocked
                  ? 'bg-white border-stone-300/90 shadow-sm hover:shadow-md hover:border-amber-400 hover:-translate-y-0.5'
                  : 'bg-[#FAF8F5]/80 border-stone-200/80 opacity-75 hover:opacity-100 hover:border-stone-300'
              }`}
            >
              <div>
                {/* Medal Top Row: Emblem & Tier Tag */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="relative">
                    <div
                      className={`w-12 h-12 rounded-full p-1 bg-gradient-to-tr ${tierDetails.glowGradient} shadow-md flex items-center justify-center border-2 ${
                        isUnlocked ? tierDetails.ringBorder : 'border-stone-300'
                      }`}
                    >
                      <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-xl">
                        {isUnlocked ? (
                          <span>
                            {badge.icon === 'crown' && '👑'}
                            {badge.icon === 'flame' && '🔥'}
                            {badge.icon === 'target' && '🎯'}
                            {badge.icon === 'zap' && '⚡'}
                            {badge.icon === 'shield-check' && '🛡️'}
                            {!['crown', 'flame', 'target', 'zap', 'shield-check'].includes(badge.icon) && '🏅'}
                          </span>
                        ) : (
                          <Lock className="w-4 h-4 text-stone-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border border-stone-200/80 ${tierDetails.badgeBg} ${tierDetails.badgeText}`}
                    >
                      {tierDetails.nameZh}
                    </span>
                    <span className="block text-[10px] text-stone-400 font-numeric mt-0.5">
                      +{badge.xpBonus} XP
                    </span>
                  </div>
                </div>

                {/* Badge Name & Description */}
                <h4 className="font-serif-editorial font-bold text-sm text-stone-900 group-hover:text-amber-800 transition-colors">
                  {badge.name}
                </h4>
                <p className="text-xs text-stone-600 mt-1 leading-relaxed line-clamp-2">
                  {badge.description}
                </p>
              </div>

              {/* Bottom Progress or Unlock Status */}
              <div className="mt-3 pt-2.5 border-t border-stone-100 text-xs">
                {isUnlocked ? (
                  <div className="flex items-center justify-between text-emerald-800 font-medium">
                    <span className="flex items-center gap-1 text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      已达成内化
                    </span>
                    <span className="text-[10px] text-stone-400 font-numeric">
                      {badge.unlockedAt || '已获得'}
                    </span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-stone-500 font-numeric">
                      <span>{progress.label}</span>
                      <span className="font-semibold text-stone-700">{progress.percentage}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-stone-200 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-stone-400 group-hover:bg-amber-500 transition-all duration-300"
                        style={{ width: `${progress.percentage}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. Detail Modal for a single Badge */}
      {activeModalBadge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-stone-200 space-y-6 text-center">
            <button
              onClick={() => setActiveModalBadge(null)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Medal Large Icon */}
            <div className="flex flex-col items-center justify-center pt-2">
              <div className="w-20 h-20 rounded-full p-2 bg-gradient-to-tr from-amber-400 to-yellow-300 shadow-xl flex items-center justify-center border-4 border-amber-300">
                <div className="w-full h-full rounded-full bg-stone-900 flex items-center justify-center text-3xl">
                  {activeModalBadge.icon === 'crown' && '👑'}
                  {activeModalBadge.icon === 'flame' && '🔥'}
                  {activeModalBadge.icon === 'target' && '🎯'}
                  {activeModalBadge.icon === 'zap' && '⚡'}
                  {activeModalBadge.icon === 'shield-check' && '🛡️'}
                  {!['crown', 'flame', 'target', 'zap', 'shield-check'].includes(activeModalBadge.icon) && '🏅'}
                </div>
              </div>

              <h3 className="font-serif-editorial text-xl font-bold text-stone-900 mt-3">
                {activeModalBadge.name}
              </h3>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 mt-1">
                {getMedalTierDetails(activeModalBadge.tier).nameZh} · {activeModalBadge.rarity || '稀有'}
              </span>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed max-w-sm mx-auto">
              {activeModalBadge.description}
            </p>

            {/* Criteria & Current Status Card */}
            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-stone-200 space-y-2 text-left text-xs font-numeric">
              <div className="flex justify-between text-stone-500">
                <span>解锁条件类型</span>
                <span className="font-bold text-stone-800">
                  {activeModalBadge.criteriaType === 'streak-days'
                    ? `连续完成 ${activeModalBadge.targetStreak} 天研习`
                    : activeModalBadge.criteriaType === 'game-score'
                    ? `${activeModalBadge.targetGameName || '训练游戏'} 达到 ${activeModalBadge.targetScore?.toLocaleString()} 分`
                    : activeModalBadge.criteriaType === 'laws-mastered'
                    ? `掌握 ${activeModalBadge.targetCount} 项定律`
                    : '达成特定认知里程碑'}
                </span>
              </div>

              <div className="flex justify-between text-stone-500 pt-1 border-t border-stone-200/80">
                <span>当前进度</span>
                <span className="font-bold text-stone-800">
                  {getBadgeProgress(activeModalBadge, user).label}
                </span>
              </div>

              <div className="flex justify-between text-stone-500 pt-1 border-t border-stone-200/80">
                <span>经验值赏金</span>
                <span className="font-extrabold text-amber-600">
                  +{activeModalBadge.xpBonus} XP
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2.5 pt-1">
              <button
                onClick={() => setActiveModalBadge(null)}
                className="flex-1 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-all cursor-pointer"
              >
                关闭
              </button>

              {activeModalBadge.criteriaType === 'game-score' && (
                <button
                  onClick={() => {
                    setActiveModalBadge(null);
                    navigate('/games');
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Gamepad2 className="w-3.5 h-3.5" />
                  <span>去竞技场冲分</span>
                </button>
              )}

              {activeModalBadge.criteriaType === 'laws-mastered' && (
                <button
                  onClick={() => {
                    setActiveModalBadge(null);
                    navigate('/learn');
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>去定律库研习</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

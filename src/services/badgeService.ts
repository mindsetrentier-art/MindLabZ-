import { Badge, UserProfile } from '../types';
import { BADGES_DATA } from '../data/badges';

export interface BadgeProgress {
  current: number;
  target: number;
  percentage: number;
  label: string;
}

/**
 * Checks all badge criteria against the current user profile state
 * and returns newly unlocked badges along with the updated user profile.
 */
export function evaluateAndUnlockBadges(user: UserProfile): {
  updatedUser: UserProfile;
  newBadges: Badge[];
} {
  const currentUnlockedIds = new Set(user.unlockedBadges || []);
  const newBadges: Badge[] = [];
  const todayStr = new Date().toISOString().split('T')[0];

  // Calculate total high scores across all games
  const totalGameScores = Object.values(user.gameHighScores || {}).reduce<number>(
    (sum, val) => sum + Number(val || 0),
    0
  );

  BADGES_DATA.forEach((badge) => {
    if (currentUnlockedIds.has(badge.id)) {
      return;
    }

    let isSatisfied = false;

    switch (badge.criteriaType) {
      case 'streak-days':
        if (badge.targetStreak && user.streak >= badge.targetStreak) {
          isSatisfied = true;
        }
        break;

      case 'game-score':
        if (badge.targetGameId === 'all') {
          if (badge.targetScore && totalGameScores >= badge.targetScore) {
            isSatisfied = true;
          }
        } else if (badge.targetGameId && badge.targetScore) {
          const userGameScore = Number(user.gameHighScores?.[badge.targetGameId] || 0);
          if (userGameScore >= badge.targetScore) {
            isSatisfied = true;
          }
        }
        break;

      case 'laws-mastered':
        if (badge.targetCount && user.lawsMastered.length >= badge.targetCount) {
          isSatisfied = true;
        }
        break;

      case 'total-games':
        if (badge.targetCount && user.totalGames >= badge.targetCount) {
          isSatisfied = true;
        }
        break;

      default:
        if (badge.id === 'quiz-centurion' && (user.totalQuizzes || 0) >= 100) {
          isSatisfied = true;
        }
        break;
    }

    if (isSatisfied) {
      currentUnlockedIds.add(badge.id);
      newBadges.push({
        ...badge,
        unlocked: true,
        unlockedAt: todayStr,
      });
    }
  });

  if (newBadges.length === 0) {
    return { updatedUser: user, newBadges: [] };
  }

  // Calculate total bonus XP gained from newly unlocked badges
  const totalBonusXP = newBadges.reduce((acc, b) => acc + (b.xpBonus || 0), 0);
  const nextXP = user.xp + totalBonusXP;
  const nextLevel = Math.max(user.level, Math.floor(nextXP / 400) + 1);

  const updatedUser: UserProfile = {
    ...user,
    unlockedBadges: Array.from(currentUnlockedIds),
    xp: nextXP,
    level: nextLevel,
  };

  return { updatedUser, newBadges };
}

/**
 * Calculates current progress towards unlocking a badge.
 */
export function getBadgeProgress(badge: Badge, user: UserProfile): BadgeProgress {
  if (user.unlockedBadges.includes(badge.id)) {
    return {
      current: 100,
      target: 100,
      percentage: 100,
      label: '已达成',
    };
  }

  switch (badge.criteriaType) {
    case 'streak-days': {
      const target = badge.targetStreak || 1;
      const current = Math.min(target, user.streak || 0);
      const percentage = Math.min(100, Math.round((current / target) * 100));
      return {
        current,
        target,
        percentage,
        label: `连续训练 ${current}/${target} 天`,
      };
    }

    case 'game-score': {
      const target = badge.targetScore || 1000;
      let current = 0;
      if (badge.targetGameId === 'all') {
        current = Object.values(user.gameHighScores || {}).reduce<number>(
          (sum, val) => sum + Number(val || 0),
          0
        );
      } else if (badge.targetGameId) {
        current = Number(user.gameHighScores?.[badge.targetGameId] || 0);
      }
      const clampedCurrent = Math.min(target, current);
      const percentage = Math.min(100, Math.round((clampedCurrent / target) * 100));
      return {
        current: clampedCurrent,
        target,
        percentage,
        label: `得分 ${clampedCurrent.toLocaleString()}/${target.toLocaleString()} 分`,
      };
    }

    case 'laws-mastered': {
      const target = badge.targetCount || 10;
      const current = Math.min(target, user.lawsMastered.length);
      const percentage = Math.min(100, Math.round((current / target) * 100));
      return {
        current,
        target,
        percentage,
        label: `掌握定律 ${current}/${target} 项`,
      };
    }

      case 'total-games': {
        const target = badge.targetCount || 10;
        const current = Math.min(target, user.totalGames || 0);
        const percentage = Math.min(100, Math.round((current / target) * 100));
        return {
          current,
          target,
          percentage,
          label: `完成训练 ${current}/${target} 次`,
        };
      }

      default:
        if (badge.id === 'quiz-centurion') {
          const target = 100;
          const current = Math.min(target, user.totalQuizzes || 0);
          return {
            current,
            target,
            percentage: Math.min(100, Math.round((current / target) * 100)),
            label: `完成测验 ${current}/${target} 题`,
          };
        }
        return {
          current: 0,
          target: 1,
          percentage: 0,
          label: '研习进阶中',
        };
    }
  }

/**
 * Visual metadata and styling helper for different medal tiers.
 */
export function getMedalTierDetails(tier?: string): {
  nameZh: string;
  badgeBg: string;
  badgeText: string;
  ringBorder: string;
  glowGradient: string;
  iconSymbol: string;
} {
  switch (tier) {
    case 'master':
      return {
        nameZh: '👑 宗师传说',
        badgeBg: 'bg-gradient-to-r from-amber-500/20 to-red-500/20',
        badgeText: 'text-amber-300 font-black',
        ringBorder: 'border-amber-400 shadow-lg shadow-amber-500/30',
        glowGradient: 'from-amber-400 via-yellow-300 to-red-500',
        iconSymbol: '👑',
      };
    case 'diamond':
      return {
        nameZh: '💎 钻石史诗',
        badgeBg: 'bg-gradient-to-r from-purple-500/20 to-indigo-500/20',
        badgeText: 'text-purple-300 font-extrabold',
        ringBorder: 'border-purple-400 shadow-md shadow-purple-500/25',
        glowGradient: 'from-purple-400 via-indigo-300 to-pink-400',
        iconSymbol: '💎',
      };
    case 'gold':
      return {
        nameZh: '🥇 黄金稀有',
        badgeBg: 'bg-amber-400/15',
        badgeText: 'text-amber-400 font-bold',
        ringBorder: 'border-amber-400/80 shadow-md shadow-amber-400/20',
        glowGradient: 'from-amber-400 to-yellow-500',
        iconSymbol: '🥇',
      };
    case 'silver':
      return {
        nameZh: '🥈 白银精良',
        badgeBg: 'bg-slate-300/15',
        badgeText: 'text-stone-300 font-bold',
        ringBorder: 'border-stone-400 shadow-sm',
        glowGradient: 'from-stone-300 to-stone-400',
        iconSymbol: '🥈',
      };
    case 'bronze':
    default:
      return {
        nameZh: '🥉 青铜基础',
        badgeBg: 'bg-amber-700/15',
        badgeText: 'text-amber-600 font-semibold',
        ringBorder: 'border-amber-700/60 shadow-xs',
        glowGradient: 'from-amber-700 to-amber-800',
        iconSymbol: '🥉',
      };
  }
}

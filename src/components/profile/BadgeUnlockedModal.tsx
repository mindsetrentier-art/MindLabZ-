import React from 'react';
import { Sparkles, Trophy, Award, Check, ArrowRight, X } from 'lucide-react';
import { Badge } from '../../types';
import { getMedalTierDetails } from '../../services/badgeService';

interface BadgeUnlockedModalProps {
  badge: Badge | null;
  onClose: () => void;
  onViewAll?: () => void;
}

export const BadgeUnlockedModal: React.FC<BadgeUnlockedModalProps> = ({
  badge,
  onClose,
  onViewAll,
}) => {
  if (!badge) return null;

  const tierDetails = getMedalTierDetails(badge.tier);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-sm sm:max-w-md bg-gradient-to-b from-[#18172E] via-[#1E1B38] to-[#121124] border-2 border-amber-400/80 rounded-3xl p-6 sm:p-8 text-center text-white shadow-2xl space-y-6 overflow-hidden">
        {/* Ambient Neon Radiance */}
        <div className="absolute -top-24 -left-24 w-60 h-60 rounded-full bg-amber-400/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-60 h-60 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-stone-400 hover:text-white transition-colors cursor-pointer"
          aria-label="关闭"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Floating Celebration Header */}
        <div className="space-y-1.5 pt-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-mono font-bold uppercase tracking-wider shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>NEW COGNITIVE MEDAL UNLOCKED</span>
          </div>

          <h3 className="font-serif-editorial text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-300 tracking-tight">
            恭喜解锁全新认知勋章！
          </h3>
        </div>

        {/* Central Luminous 3D Medal Emblem */}
        <div className="relative py-2 flex items-center justify-center">
          {/* Pulsing ring aura */}
          <div className="absolute w-32 h-32 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-200 opacity-20 blur-xl animate-pulse" />

          <div className={`relative w-28 h-28 rounded-full p-2 bg-gradient-to-tr ${tierDetails.glowGradient} shadow-2xl flex items-center justify-center border-4 ${tierDetails.ringBorder} transition-transform hover:scale-105 duration-300`}>
            <div className="w-full h-full rounded-full bg-stone-950 flex flex-col items-center justify-center p-2 text-center border border-white/20">
              <span className="text-4xl filter drop-shadow-md">
                {badge.icon === 'crown' && '👑'}
                {badge.icon === 'flame' && '🔥'}
                {badge.icon === 'target' && '🎯'}
                {badge.icon === 'zap' && '⚡'}
                {badge.icon === 'shield-check' && '🛡️'}
                {!['crown', 'flame', 'target', 'zap', 'shield-check'].includes(badge.icon) && '🏅'}
              </span>
              <span className={`text-[10px] mt-1 font-mono uppercase font-black ${tierDetails.badgeText}`}>
                {badge.rarity || '精良'}
              </span>
            </div>
          </div>
        </div>

        {/* Badge Metadata */}
        <div className="space-y-2 bg-white/5 p-4 rounded-2xl border border-white/10">
          <div className="flex items-center justify-center gap-2">
            <h4 className="font-serif-editorial text-xl font-bold text-white tracking-tight">
              {badge.name}
            </h4>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${tierDetails.badgeBg} ${tierDetails.badgeText} border border-white/10`}>
              {tierDetails.nameZh}
            </span>
          </div>

          <p className="text-xs text-stone-300 leading-relaxed font-normal">
            {badge.description}
          </p>

          <div className="pt-2 border-t border-white/10 flex items-center justify-around text-xs font-numeric">
            <div>
              <span className="text-stone-400 text-[10px] block">奖励加成</span>
              <span className="text-amber-300 font-extrabold text-sm">+{badge.xpBonus} XP</span>
            </div>
            <div className="w-px h-6 bg-white/10" />
            <div>
              <span className="text-stone-400 text-[10px] block">内化状态</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1 justify-center">
                <Check className="w-3.5 h-3.5" />
                已收入荣誉殿堂
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-stone-200 border border-white/20 text-xs font-bold transition-all cursor-pointer"
          >
            继续研习
          </button>

          {onViewAll && (
            <button
              onClick={() => {
                onClose();
                onViewAll();
              }}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-extrabold text-xs transition-all shadow-md shadow-amber-400/20 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>查看荣誉勋章展厅</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

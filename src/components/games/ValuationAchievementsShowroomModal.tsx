import React from 'react';
import { X, Trophy, Sparkles, CheckCircle2, Lock, Zap, Award, Target, Flame, Crown, ShieldCheck, Compass } from 'lucide-react';
import { VALUATION_ACHIEVEMENTS, ValuationAchievement } from '../../data/valuationAchievements';
import { getMedalTierDetails } from '../../services/badgeService';
import { gameAudio } from '../../utils/gameAudio';

interface ValuationAchievementsShowroomModalProps {
  unlockedBadgeIds: string[];
  onClose: () => void;
  gameHighScores?: Record<string, number>;
}

export const ValuationAchievementsShowroomModal: React.FC<ValuationAchievementsShowroomModalProps> = ({
  unlockedBadgeIds,
  onClose,
  gameHighScores = {},
}) => {
  const unlockedSet = new Set(unlockedBadgeIds);
  const unlockedCount = VALUATION_ACHIEVEMENTS.filter(a => unlockedSet.has(a.id)).length;
  const totalCount = VALUATION_ACHIEVEMENTS.length;
  const progressPercent = Math.round((unlockedCount / totalCount) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/80 backdrop-blur-md animate-smoothFadeIn">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-[#18162E] via-[#120F24] to-[#0A0815] border border-amber-400/50 rounded-3xl p-5 sm:p-6 text-white shadow-2xl space-y-4 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 -right-24 w-60 h-60 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 rounded-full bg-purple-500/15 blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3 relative z-10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <Trophy className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="font-serif-editorial text-lg font-bold text-white flex items-center gap-2">
                <span>极速估值 · 成就荣誉展厅</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 font-bold">
                  {unlockedCount} / {totalCount} 解锁
                </span>
              </h3>
              <p className="text-xs text-stone-400 font-serif-editorial">
                穿透初级、中级、高级与量感极限，点亮心智勋章
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-stone-400 hover:text-white transition-colors cursor-pointer"
            aria-label="关闭"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Gauge */}
        <div className="p-3 rounded-2xl bg-black/40 border border-white/10 space-y-1.5 shrink-0 relative z-10">
          <div className="flex justify-between text-xs">
            <span className="text-stone-300 font-medium">心算勋章殿堂完成度</span>
            <span className="font-numeric font-bold text-amber-300">{progressPercent}%</span>
          </div>
          <div className="w-full h-2 bg-stone-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Scrollable Badges Cards List */}
        <div className="overflow-y-auto space-y-3 pr-1 flex-1 relative z-10 no-scrollbar">
          {VALUATION_ACHIEVEMENTS.map((item) => {
            const isUnlocked = unlockedSet.has(item.id);
            const tierDetails = getMedalTierDetails(item.tier);

            return (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border transition-all relative overflow-hidden flex items-start gap-3.5 ${
                  isUnlocked
                    ? 'bg-gradient-to-r from-amber-500/10 via-white/[0.04] to-transparent border-amber-400/50 shadow-md'
                    : 'bg-white/[0.02] border-white/10 opacity-75'
                }`}
              >
                {/* Badge Icon Emblem */}
                <div
                  className={`w-14 h-14 rounded-2xl shrink-0 flex flex-col items-center justify-center p-1 border ${
                    isUnlocked
                      ? `bg-stone-950 border-amber-400/80 shadow-md shadow-amber-500/20`
                      : 'bg-stone-900/60 border-stone-800'
                  }`}
                >
                  <span className={`text-2xl filter ${isUnlocked ? 'drop-shadow-md' : 'grayscale opacity-50'}`}>
                    {item.iconSymbol}
                  </span>
                  <span className={`text-[8px] mt-0.5 font-mono uppercase font-black ${isUnlocked ? tierDetails.badgeText : 'text-stone-600'}`}>
                    {item.rarity}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h4 className={`text-sm font-bold ${isUnlocked ? 'text-white' : 'text-stone-400'} font-serif-editorial`}>
                        {item.name}
                      </h4>
                      {item.levelRequirement && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-white/10 text-amber-300 border border-white/15">
                          {item.levelRequirement}
                        </span>
                      )}
                    </div>

                    {isUnlocked ? (
                      <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1 shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        已达成
                      </span>
                    ) : (
                      <span className="text-[11px] text-stone-500 font-medium flex items-center gap-1 shrink-0">
                        <Lock className="w-3 h-3" />
                        待解锁
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-stone-300 leading-relaxed font-sans">
                    {item.description}
                  </p>

                  <div className="flex flex-wrap items-center justify-between text-[11px] pt-1 text-stone-400 border-t border-white/5">
                    <span className="text-amber-300 font-bold">
                      🎯 目标: {item.targetConditionText}
                    </span>
                    <span className="text-amber-400 font-mono font-extrabold flex items-center gap-0.5">
                      <Zap className="w-3 h-3 fill-amber-400" />
                      +{item.xpBonus} XP
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Button */}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 text-stone-200 border border-white/15 text-xs font-bold transition-all cursor-pointer relative z-10 shrink-0"
        >
          返回游戏
        </button>
      </div>
    </div>
  );
};

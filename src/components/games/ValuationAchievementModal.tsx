import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, Trophy, Award, Check, ArrowRight, X, Flame, Zap, ShieldCheck, Crown } from 'lucide-react';
import { ValuationAchievement } from '../../data/valuationAchievements';
import { getMedalTierDetails } from '../../services/badgeService';
import { gameAudio } from '../../utils/gameAudio';

interface ValuationAchievementModalProps {
  achievements: ValuationAchievement[];
  onClose: () => void;
  onViewShowroom?: () => void;
}

export const ValuationAchievementModal: React.FC<ValuationAchievementModalProps> = ({
  achievements,
  onClose,
  onViewShowroom,
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const activeAchievement = achievements[currentIdx] || achievements[0];

  useEffect(() => {
    if (!activeAchievement) return;

    // Play triumphant victory sound
    gameAudio.playVictory();

    // Celebration confetti canvas animation
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.parentElement?.clientWidth || 450;
    canvas.height = 360;

    const colors = ['#F59E0B', '#FDE68A', '#10B981', '#6366F1', '#EC4899', '#3B82F6', '#FFFFFF'];
    const particles = Array.from({ length: 60 }).map(() => ({
      x: canvas.width / 2,
      y: canvas.height / 2 - 20,
      vx: (Math.random() - 0.5) * 10,
      vy: (Math.random() - 0.7) * 9,
      size: Math.random() * 5 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1,
      rotation: Math.random() * 360,
      vRot: (Math.random() - 0.5) * 12,
    }));

    let animId: number;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let aliveCount = 0;

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.22; // gravity
        p.alpha -= 0.012;
        p.rotation += p.vRot;

        if (p.alpha > 0) {
          aliveCount++;
          ctx.save();
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.5);
          ctx.restore();
        }
      });

      if (aliveCount > 0) {
        animId = requestAnimationFrame(render);
      }
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [currentIdx, activeAchievement]);

  if (!activeAchievement) return null;

  const tierDetails = getMedalTierDetails(activeAchievement.tier);
  const hasMore = currentIdx < achievements.length - 1;

  const handleNext = () => {
    gameAudio.playTap();
    if (hasMore) {
      setCurrentIdx(prev => prev + 1);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md animate-smoothFadeIn">
      <div className="relative w-full max-w-sm sm:max-w-md bg-gradient-to-b from-[#18162E] via-[#120F24] to-[#0A0815] border-2 border-amber-400/80 rounded-3xl p-6 sm:p-7 text-center text-white shadow-2xl space-y-5 overflow-hidden">
        {/* Dynamic Confetti Canvas in Background */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none z-0 w-full h-full"
        />

        {/* Ambient Neon Glow */}
        <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full bg-amber-400/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 rounded-full bg-purple-500/25 blur-3xl pointer-events-none" />

        {/* Top Floating Badge & Close Button */}
        <div className="flex items-center justify-between relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[11px] font-mono font-black uppercase tracking-wider shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-spin" />
            <span>极速估值 · 突破解锁 {achievements.length > 1 ? `(${currentIdx + 1}/${achievements.length})` : ''}</span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-stone-400 hover:text-white transition-colors cursor-pointer"
            aria-label="关闭"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Hero Title */}
        <div className="space-y-1 relative z-10">
          <span className="text-[11px] font-mono font-bold tracking-widest text-amber-400/90 uppercase">
            {activeAchievement.levelRequirement ? `【${activeAchievement.levelRequirement}难度突破】` : '【心智突破】'}
          </span>
          <h3 className="font-serif-editorial text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-300 tracking-tight">
            恭喜斩获专属成就！
          </h3>
        </div>

        {/* Central 3D Luminous Emblem with Metallic Radiance */}
        <div className="relative py-2 flex items-center justify-center z-10">
          {/* Rotating halo background */}
          <div className="absolute w-36 h-36 rounded-full bg-gradient-to-tr from-amber-400/30 via-yellow-300/20 to-purple-600/30 blur-xl animate-pulse" />

          {/* Golden Medallion Body */}
          <div
            className={`relative w-28 h-28 rounded-full p-2 bg-gradient-to-tr ${tierDetails.glowGradient} shadow-2xl flex items-center justify-center border-4 ${tierDetails.ringBorder} transition-transform duration-300 hover:scale-105`}
          >
            <div className="w-full h-full rounded-full bg-stone-950 flex flex-col items-center justify-center p-2 text-center border border-white/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-radial from-amber-400/20 to-transparent pointer-events-none" />
              <span className="text-4xl filter drop-shadow-md select-none transform transition-transform hover:scale-110">
                {activeAchievement.iconSymbol || '🏅'}
              </span>
              <span className={`text-[10px] mt-1 font-mono uppercase font-black ${tierDetails.badgeText}`}>
                {activeAchievement.rarity || '稀有'}
              </span>
            </div>
          </div>
        </div>

        {/* Badge Metadata Box */}
        <div className="space-y-2.5 bg-black/40 p-4 rounded-2xl border border-amber-500/30 relative z-10 shadow-inner">
          <div className="flex items-center justify-center gap-2">
            <h4 className="font-serif-editorial text-lg sm:text-xl font-bold text-white tracking-tight">
              {activeAchievement.name}
            </h4>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${tierDetails.badgeBg} ${tierDetails.badgeText} border border-white/10 font-bold`}>
              {tierDetails.nameZh}
            </span>
          </div>

          <p className="text-xs text-stone-300 leading-relaxed font-sans">
            {activeAchievement.description}
          </p>

          {/* Inspirational Breakthrough Quote */}
          {activeAchievement.breakthroughQuote && (
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/25 text-[11px] text-amber-200 font-serif-editorial italic">
              {activeAchievement.breakthroughQuote}
            </div>
          )}

          {/* Bottom Rewards & Verification Bar */}
          <div className="pt-2 border-t border-white/10 flex items-center justify-around text-xs font-numeric">
            <div>
              <span className="text-stone-400 text-[10px] block">奖励加成</span>
              <span className="text-amber-300 font-extrabold text-sm flex items-center justify-center gap-0.5">
                <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                +{activeAchievement.xpBonus} XP
              </span>
            </div>
            <div className="w-px h-6 bg-white/10" />
            <div>
              <span className="text-stone-400 text-[10px] block">达成条件</span>
              <span className="text-emerald-400 font-bold text-[11px] flex items-center gap-1 justify-center">
                <Check className="w-3 h-3" />
                {activeAchievement.targetConditionText}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 relative z-10 pt-1">
          {hasMore ? (
            <button
              onClick={handleNext}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-black text-xs sm:text-sm shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <span>查看下一项突破 ({currentIdx + 2}/{achievements.length})</span>
              <ArrowRight className="w-4 h-4 text-stone-950" />
            </button>
          ) : (
            <>
              <button
                onClick={onClose}
                className="flex-1 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-stone-200 border border-white/20 text-xs font-bold transition-all cursor-pointer"
              >
                继续前行
              </button>

              {onViewShowroom && (
                <button
                  onClick={() => {
                    onClose();
                    onViewShowroom();
                  }}
                  className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-black text-xs transition-all shadow-md shadow-amber-400/20 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Trophy className="w-3.5 h-3.5" />
                  <span>查看成就总览</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

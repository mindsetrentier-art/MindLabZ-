import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trophy, Flame, Clock, Volume2, VolumeX, ShieldAlert, Sparkles } from 'lucide-react';
import { GameDifficulty, DIFFICULTY_CONFIGS } from '../../data/difficulty';
import { gameAudio } from '../../utils/gameAudio';

interface GameHeaderHudProps {
  title: string;
  numberPrefix?: string;
  difficulty: GameDifficulty;
  score: number;
  combo?: number;
  comboCount?: number;
  timeLeft?: number;
  currentRound?: number;
  totalRounds?: number;
  onExit?: () => void;
  onBack?: () => void;
  accentColor?: string;
  accentGradient?: string;
}

export const GameHeaderHud: React.FC<GameHeaderHudProps> = ({
  title,
  numberPrefix,
  difficulty,
  score,
  combo = 0,
  comboCount,
  timeLeft,
  currentRound,
  totalRounds,
  onExit,
  onBack,
  accentColor = '#6366F1',
}) => {
  const diffConfig = DIFFICULTY_CONFIGS[difficulty];
  const [isMuted, setIsMuted] = useState(() => gameAudio.getMuted());
  const [scorePop, setScorePop] = useState(false);
  const effectiveCombo = typeof comboCount === 'number' ? comboCount : combo;

  useEffect(() => {
    if (score > 0) {
      setScorePop(true);
      const timer = setTimeout(() => setScorePop(false), 300);
      return () => clearTimeout(timer);
    }
  }, [score]);

  const handleToggleSound = () => {
    const next = gameAudio.toggleMute();
    setIsMuted(next);
  };

  const handleExitClick = () => {
    gameAudio.playTap();
    if (onExit) {
      onExit();
    } else if (onBack) {
      onBack();
    }
  };

  return (
    <header className="w-full game-hud-bar rounded-2xl p-2.5 sm:p-3 mb-4 flex items-center justify-between gap-2 shadow-sm animate-fadeIn relative z-20 border border-stone-200/90">
      {/* Left: Exit & Title */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          onClick={handleExitClick}
          type="button"
          className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-all cursor-pointer shrink-0 active:scale-95 flex items-center gap-1 text-xs font-semibold"
          title="退出 / 重选"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">大厅</span>
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[10px] text-stone-400 font-numeric font-medium">
            {numberPrefix && (
              <span
                className="font-bold px-1.5 py-0.2 rounded text-[10px] text-white"
                style={{ backgroundColor: accentColor }}
              >
                #{numberPrefix}
              </span>
            )}
            <span className="text-stone-500 font-semibold truncate">
              {diffConfig.name}难度 ({diffConfig.multiplierText})
            </span>
            {typeof currentRound === 'number' && typeof totalRounds === 'number' && (
              <>
                <span className="text-stone-300">·</span>
                <span className="text-stone-600 font-bold font-numeric">
                  关卡 {currentRound}/{totalRounds}
                </span>
              </>
            )}
          </div>
          <h2 className="text-xs sm:text-sm font-bold text-stone-900 truncate font-serif-editorial">
            {title}
          </h2>
        </div>
      </div>

      {/* Right: Game HUD Status Badges */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 font-numeric text-xs">
        {/* Sound FX Button */}
        <button
          onClick={handleToggleSound}
          type="button"
          className={`p-1.5 sm:p-2 rounded-xl transition-all cursor-pointer active:scale-90 ${
            isMuted
              ? 'bg-stone-100 text-stone-400 hover:text-stone-600'
              : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
          }`}
          title={isMuted ? '开启音效' : '静音'}
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>

        {/* Timer countdown if active */}
        {typeof timeLeft === 'number' && (
          <div
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl font-bold transition-all shadow-xs ${
              timeLeft <= 6
                ? 'bg-rose-500 text-white animate-pulse shadow-rose-500/30'
                : 'bg-stone-900 text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{timeLeft}s</span>
          </div>
        )}

        {/* Combo Multiplier */}
        {effectiveCombo > 1 && (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black shadow-sm animate-pulse">
            <Flame className="w-3.5 h-3.5 fill-white text-white" />
            <span>x{effectiveCombo}</span>
          </div>
        )}

        {/* Glowing Score Ticker */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100/60 border border-amber-300 text-stone-900 font-bold shadow-xs transition-transform duration-200 ${
            scorePop ? 'scale-110 shadow-amber-300/50' : 'scale-100'
          }`}
        >
          <Trophy className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
          <span className="text-xs sm:text-sm font-black text-amber-950 font-numeric tracking-tight">
            {score.toLocaleString()}
          </span>
        </div>
      </div>
    </header>
  );
};

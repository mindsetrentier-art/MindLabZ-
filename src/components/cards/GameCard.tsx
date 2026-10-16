import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play, Trophy, Clock, Brain, Zap, Sparkles, Search, FlaskConical, Shuffle,
  Eye, Anchor, Users, Activity, HeartPulse, Gift, LifeBuoy, SearchCheck, CheckCircle2,
  ChevronRight, Award, Flame
} from 'lucide-react';
import { GameDefinition } from '../../types';
import { useApp } from '../../context/AppContext';
import { GameDifficulty, DIFFICULTY_CONFIGS } from '../../data/difficulty';
import { gameAudio } from '../../utils/gameAudio';

interface GameCardProps {
  game: GameDefinition;
  difficulty?: GameDifficulty;
}

const GAME_ICONS: Record<string, React.ElementType> = {
  'first-impression': Eye,
  'anchoring-lab': Anchor,
  'majority-answer': Users,
  'peak-end': Activity,
  'emotion-detective': HeartPulse,
  'attribution-shift': Shuffle,
  'zero-price-trap': Gift,
  'micro-habit': Sparkles,
  'bystander-breaker': LifeBuoy,
  'falsification-challenge': SearchCheck,
  'memory-lab': Brain,
  'mind-trap': Zap,
  'brain-rush': Sparkles,
  'mind-detective': Search,
  'psych-experiment': FlaskConical,
};

export const GameCard: React.FC<GameCardProps> = ({ game, difficulty = '中' }) => {
  const navigate = useNavigate();
  const { user } = useApp();
  const [isLaunching, setIsLaunching] = React.useState(false);

  const IconComponent = GAME_ICONS[game.id] || Brain;
  const highScore = (user?.gameHighScores && user.gameHighScores[game.id]) ? user.gameHighScores[game.id] : 0;
  const isCompleted = Boolean(user?.completedGames?.includes(game.id));
  const diffConfig = DIFFICULTY_CONFIGS[difficulty];
  const accentColor = game.accentColor || '#6366F1';

  const handleStartGame = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isLaunching) return;
    setIsLaunching(true);
    gameAudio.playTap();
    setTimeout(() => {
      navigate(`/game/${game.id}?difficulty=${encodeURIComponent(difficulty)}`);
    }, 140);
  };

  return (
    <article
      onClick={(e) => handleStartGame(e)}
      className={`group game-arcade-card rounded-3xl cursor-pointer flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 border ${
        isLaunching
          ? 'border-indigo-400 ring-2 ring-indigo-400/40 scale-[0.99] shadow-indigo-500/20 shadow-lg'
          : 'border-stone-200/90 hover:border-indigo-300/80 bg-white'
      }`}
    >
      {/* Top Ambient Radiant Glow Header with Game Accent */}
      <div
        className="h-2 w-full transition-all duration-300 group-hover:h-2.5"
        style={{
          background: `linear-gradient(90deg, ${accentColor} 0%, ${accentColor}99 60%, #FAF8F5 100%)`,
        }}
      />

      <div className="p-5 sm:p-6.5 flex-1 flex flex-col justify-between">
        <div>
          {/* Top Arcade Status Bar */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-200/60 text-xs">
            <div className="flex items-center gap-2">
              {game.numberPrefix ? (
                <span
                  className="font-mono font-black text-white px-2 py-0.5 rounded-lg text-[11px] shadow-xs"
                  style={{ backgroundColor: accentColor }}
                >
                  #{game.numberPrefix}
                </span>
              ) : (
                <span className="font-mono font-bold text-stone-700 bg-stone-100 px-2 py-0.5 rounded-lg text-[11px]">
                  ARCADE
                </span>
              )}
              <span className="font-semibold text-stone-900 text-xs">{game.category}训练</span>
              <span className="text-stone-300" aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1 font-numeric text-stone-500 text-[11px]">
                <Clock className="w-3 h-3 text-stone-400" />
                {game.estimatedTime}
              </span>
            </div>

            <div className="flex items-center gap-2 font-numeric text-xs">
              {isCompleted ? (
                <span className="text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-emerald-200 flex items-center gap-1 shadow-2xs">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  已通关 (+30~45XP)
                </span>
              ) : (
                <span className="text-indigo-700 bg-indigo-50/90 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-indigo-200 flex items-center gap-1 shadow-2xs">
                  <Sparkles className="w-3 h-3 text-indigo-600" />
                  首胜 +30~45 XP
                </span>
              )}

              {highScore > 0 && (
                <span className="text-xs font-black text-amber-900 flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200/80">
                  <Trophy className="w-3 h-3 text-amber-500 fill-amber-400" />
                  {(highScore ?? 0).toLocaleString()}
                </span>
              )}
            </div>
          </div>

          {/* Game Title & Tactile Glowing Monogram */}
          <div className="flex items-start gap-3.5 mb-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-md group-hover:scale-105 transition-transform duration-200"
              style={{
                backgroundColor: accentColor,
                boxShadow: `0 6px 18px -4px ${accentColor}55`,
              }}
            >
              <IconComponent className="w-6 h-6 text-white" />
            </div>

            <div className="min-w-0">
              <h3 className="font-serif-editorial text-base sm:text-lg font-bold text-stone-900 group-hover:text-stone-950 transition-colors leading-snug tracking-tight">
                {game.nameZh}
              </h3>
              <p className="text-xs text-stone-500 font-serif-editorial italic mt-0.5 truncate">
                {game.name}
              </p>
            </div>
          </div>

          {/* Description */}
          <p className="text-xs sm:text-[13px] text-stone-600 leading-relaxed mb-4">
            {game.description}
          </p>

          {/* Scientific Mechanism Callout */}
          <div className="bg-stone-50/90 rounded-2xl p-3.5 mb-4 border border-stone-200/60 group-hover:bg-[#FAF8F5] transition-colors">
            <span className="text-[11px] font-bold text-stone-900 block mb-0.5 font-serif-editorial flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accentColor }} />
              核心心理学机制
            </span>
            <p className="text-xs text-stone-600 font-normal leading-relaxed">
              {game.conceptLearned}
            </p>
          </div>
        </div>

        {/* Action Footer Bar */}
        <div className="pt-3.5 flex items-center justify-between border-t border-stone-200/60 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-stone-400 text-[11px] font-medium">难度加成:</span>
            <span className={`font-bold px-2 py-0.5 rounded-lg border text-[11px] ${diffConfig.bgLightClass} ${diffConfig.colorClass} ${diffConfig.borderClass}`}>
              {difficulty} ({diffConfig.multiplierText})
            </span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleStartGame(e);
            }}
            type="button"
            disabled={isLaunching}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-md group-hover:shadow-lg active:scale-95 cursor-pointer game-btn-tactile ${
              isLaunching ? 'opacity-90 scale-95' : ''
            }`}
            style={{
              backgroundColor: accentColor,
              boxShadow: `0 4px 14px -2px ${accentColor}60`,
            }}
          >
            {isLaunching ? (
              <>
                <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                <span>连接中...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{isCompleted ? '复盘巩固 (+8~11XP)' : '开启挑战 (+30~45XP)'}</span>
                <ChevronRight className="w-3.5 h-3.5 opacity-80" />
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
};

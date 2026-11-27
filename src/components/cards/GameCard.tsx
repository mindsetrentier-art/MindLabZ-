import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play, Trophy, Clock, Brain, Zap, Sparkles, Search, FlaskConical, Shuffle,
  Eye, Anchor, Users, Activity, HeartPulse, Heart, Gift, LifeBuoy, SearchCheck, CheckCircle2,
  ChevronRight, Award, Flame, Scale, HeartHandshake
} from 'lucide-react';
import { GameDefinition } from '../../types';
import { useApp } from '../../context/AppContext';
import { GameDifficulty, DIFFICULTY_CONFIGS } from '../../data/difficulty';
import { gameAudio } from '../../utils/gameAudio';
import { FirstImpressionGameIcon } from '../games/FirstImpressionGameIcon';

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
  'love-aleatoric-arena': Heart,
  'love100-aleatoric-arena': Heart,
  'intimate-aleatoric-arena': HeartHandshake,
  'reverse-aleatoric-arena': Shuffle,
  'criminal-aleatoric-arena': Scale,
  'sexual-aleatoric-arena': HeartHandshake,
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
  const accentColor = game.accentColor || '#4F46B8';

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
      className={`group art-museum-mat rounded-3xl cursor-pointer flex flex-col justify-between relative overflow-hidden transition-all duration-300 ${
        isLaunching
          ? 'border-[#5B45B8]/60 ring-2 ring-[#5B45B8]/25 scale-[0.99] shadow-lg'
          : ''
      }`}
    >
      {/* Top Ambient Radiant Glow Header with Game Accent */}
      <div
        className="h-[3px] w-full transition-all duration-300 opacity-85 group-hover:opacity-100"
        style={{
          background: `linear-gradient(90deg, ${accentColor} 0%, ${accentColor}90 55%, transparent 95%)`,
        }}
      />

      <div className="p-5 sm:p-6.5 flex-1 flex flex-col justify-between">
        <div>
          {/* Top Arcade Status Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-stone-200/60 text-xs">
            <div className="flex items-center gap-2">
              {game.numberPrefix ? (
                <span
                  className="font-mono font-bold text-[#FAF8F5] px-2 py-0.5 rounded-lg text-[11px]"
                  style={{
                    background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}DD 100%)`,
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.28), 0 2px 6px rgba(24,20,17,0.12)',
                  }}
                >
                  #{game.numberPrefix}
                </span>
              ) : (
                <span className="luxury-badge-ink text-[11px]">
                  ARCADE
                </span>
              )}
              <span className="font-semibold text-[#181411] text-xs">{game.category}训练</span>
              <span className="text-stone-300" aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1 font-numeric text-[#6E675F] text-[11px]">
                <Clock className="w-3 h-3 text-[#8E867D]" />
                {game.estimatedTime}
              </span>
            </div>

            <div className="flex items-center gap-2 font-numeric text-xs">
              {isCompleted ? (
                <span className="text-[#157F5D] bg-[#157F5D]/8 px-2.5 py-0.5 rounded-lg text-[10px] font-bold border border-[#157F5D]/25 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-[#157F5D]" />
                  已通关 (+30~45XP)
                </span>
              ) : (
                <span className="text-[#4F46B8] bg-[#4F46B8]/8 px-2.5 py-0.5 rounded-lg text-[10px] font-bold border border-[#4F46B8]/22 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#4F46B8]" />
                  首胜 +30~45 XP
                </span>
              )}

              {highScore > 0 && (
                <span className="text-xs font-bold text-[#8E5B13] flex items-center gap-1 bg-[#D4A656]/12 px-2 py-0.5 rounded-lg border border-[#D4A656]/30">
                  <Trophy className="w-3 h-3 text-[#C8933B] fill-[#D4A656]" />
                  {(highScore ?? 0).toLocaleString()}
                </span>
              )}
            </div>
          </div>

          {/* Game Title & Tactile Specular Monogram */}
          <div className="flex items-start gap-3.5 mb-3">
            {game.id === 'first-impression' ? (
              <FirstImpressionGameIcon size={48} glow={false} className="group-hover:scale-105 transition-transform duration-200" />
            ) : (
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-[#FAF8F5] shrink-0 group-hover:scale-105 transition-transform duration-200"
                style={{
                  background: `linear-gradient(145deg, ${accentColor} 0%, ${accentColor}D9 100%)`,
                  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.32), 0 8px 20px -5px ${accentColor}52`,
                }}
              >
                <IconComponent className="w-6 h-6 text-[#FAF8F5]" />
              </div>
            )}

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
        <div className="pt-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-stone-200/60 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-[#8E867D] text-[11px] font-medium">难度加成:</span>
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
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-[#FAF8F5] transition-all active:scale-95 cursor-pointer btn-tactile hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B45B8]/40 ${
              isLaunching ? 'opacity-90 scale-95' : ''
            }`}
            style={{
              background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}D4 100%)`,
              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.28), 0 6px 16px -4px ${accentColor}58`,
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

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Trophy, Clock, Brain, Zap, Sparkles, Search, FlaskConical } from 'lucide-react';
import { GameDefinition } from '../../types';
import { useApp } from '../../context/AppContext';

interface GameCardProps {
  game: GameDefinition;
}

const GAME_ICONS: Record<string, React.ElementType> = {
  'memory-lab': Brain,
  'mind-trap': Zap,
  'brain-rush': Sparkles,
  'mind-detective': Search,
  'psych-experiment': FlaskConical,
};

export const GameCard: React.FC<GameCardProps> = ({ game }) => {
  const navigate = useNavigate();
  const { user } = useApp();

  const IconComponent = GAME_ICONS[game.id] || Brain;
  const highScore = user.gameHighScores[game.id] || 0;

  return (
    <div
      onClick={() => navigate(`/game/${game.id}`)}
      className="group art-card art-card-hover rounded-3xl p-5 cursor-pointer overflow-hidden flex flex-col justify-between"
    >
      {/* Subtle Geometric Constellation Motif in Top-Right */}
      <svg
        className="absolute -top-6 -right-6 w-28 h-28 opacity-[0.08] group-hover:opacity-[0.15] transition-opacity pointer-events-none"
        viewBox="0 0 100 100"
        fill="none"
      >
        <circle cx="50" cy="50" r="40" stroke={game.accentColor || '#6C4CF1'} strokeWidth="1.5" strokeDasharray="3 3" />
        <circle cx="50" cy="50" r="24" stroke={game.accentColor || '#6C4CF1'} strokeWidth="1.5" />
        <circle cx="50" cy="26" r="3" fill={game.accentColor || '#6C4CF1'} />
        <circle cx="74" cy="50" r="3" fill={game.accentColor || '#6C4CF1'} />
      </svg>

      <div className="relative z-10">
        {/* Top Unboxed Metadata Row */}
        <div className="flex items-center justify-between mb-3.5 text-xs">
          <div className="flex items-center gap-1.5 text-[#64748B]">
            <span className="font-bold text-[#532CD8]">{game.category}训练</span>
            <span className="text-[#CBD5E1]" aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1 font-medium">
              <Clock className="w-3 h-3 text-[#94A3B8]" />
              {game.estimatedTime}
            </span>
          </div>

          <span className="text-xs font-bold text-[#D97706] flex items-center gap-1 font-numeric">
            <Trophy className="w-3.5 h-3.5 fill-[#F59E0B] text-[#F59E0B]" />
            {highScore > 0 ? highScore.toLocaleString() : '待创纪录'}
          </span>
        </div>

        {/* Game Title & Tactile Squircle Icon */}
        <div className="flex items-start gap-3.5 mb-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-[0_8px_18px_-4px_rgba(108,76,241,0.38)] shrink-0 group-hover:scale-105 transition-transform border border-white/25"
            style={{ background: `linear-gradient(135deg, ${game.accentColor || '#6C4CF1'}, #4320B8)` }}
          >
            <IconComponent className="w-6 h-6" />
          </div>

          <div>
            <h3 className="text-[17px] font-extrabold text-[#18181B] group-hover:text-[#6C4CF1] transition-colors leading-snug tracking-tight">
              {game.nameZh}
            </h3>
            <p className="text-xs text-[#64748B] font-serif-editorial italic mt-0.5">
              {game.name}
            </p>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-[#475569] leading-relaxed mb-3.5">
          {game.description}
        </p>

        {/* Scientific Concept Callout */}
        <div className="bg-[#FAF9FF] rounded-2xl p-3 mb-4 border border-[#EBE7F8]">
          <span className="text-[11px] font-bold text-[#532CD8] block mb-0.5">实验原理</span>
          <p className="text-[11px] text-[#475569] font-medium leading-relaxed">
            {game.conceptLearned}
          </p>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-3 flex items-center justify-between border-t border-[#F1EFFA] relative z-10">
        <span className="text-xs text-[#64748B] font-medium">
          难度评级 · <strong className="text-[#18181B] font-bold">{game.difficulty}</strong>
        </span>

        <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#6C4CF1] to-[#532CD8] hover:from-[#5B3BE0] hover:to-[#4320B8] text-white text-xs font-bold shadow-[0_4px_12px_rgba(108,76,241,0.25)] transition-all btn-tactile whitespace-nowrap">
          <Play className="w-3.5 h-3.5 fill-white" />
          <span>进入实验</span>
        </button>
      </div>
    </div>
  );
};

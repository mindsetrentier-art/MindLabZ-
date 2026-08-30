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
      className="group relative bg-white rounded-3xl p-5 border border-[#E6E2F5] shadow-[0_4px_20px_-2px_rgba(108,76,241,0.05)] hover:shadow-[0_12px_32px_-4px_rgba(108,76,241,0.12)] hover:border-[#6C4CF1]/30 hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-between"
    >
      {/* Background Subtle Accent Aura */}
      <div 
        className="absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl opacity-10 pointer-events-none -mr-8 -mt-8 transition-opacity group-hover:opacity-20"
        style={{ backgroundColor: game.accentColor || '#6C4CF1' }}
      />

      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#EDE9FE] text-[#6C4CF1] border border-[#DDD6FE]">
              {game.category}
            </span>
            <div className="flex items-center gap-1 text-[11px] text-[#64748B] font-medium">
              <Clock className="w-3 h-3 text-[#64748B]" />
              <span>{game.estimatedTime}</span>
            </div>
          </div>

          <span className="text-[11px] font-bold text-[#F59E0B] flex items-center gap-1 font-['Inter']">
            <Trophy className="w-3.5 h-3.5 fill-[#F59E0B] text-[#F59E0B]" />
            {highScore > 0 ? highScore.toLocaleString() : '新纪录待创'}
          </span>
        </div>

        {/* Game Title & Icon */}
        <div className="flex items-start gap-3.5 mb-3">
          <div 
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-[0_4px_12px_rgba(108,76,241,0.25)] shrink-0 group-hover:scale-105 transition-transform"
            style={{ background: `linear-gradient(135deg, ${game.accentColor || '#6C4CF1'}, #532CD8)` }}
          >
            <IconComponent className="w-6 h-6" />
          </div>

          <div>
            <h3 className="text-base font-bold text-[#18181B] group-hover:text-[#6C4CF1] transition-colors leading-snug">
              {game.nameZh}
            </h3>
            <p className="text-xs text-[#64748B] font-['Inter'] font-medium mt-0.5">
              {game.name}
            </p>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-[#475569] leading-relaxed mb-4">
          {game.description}
        </p>

        {/* Scientific Concept Tag */}
        <div className="bg-[#F5F3FF] rounded-2xl p-3 mb-4 border border-[#E6E2F5]">
          <span className="text-[10px] font-bold text-[#6C4CF1] block mb-1">🧠 认知科学原理：</span>
          <p className="text-[11px] text-[#475569] font-medium leading-relaxed">
            {game.conceptLearned}
          </p>
        </div>
      </div>

      {/* Action Button */}
      <div className="pt-2 flex items-center justify-between border-t border-[#F5F3FF]">
        <span className="text-xs text-[#64748B] font-medium">
          难度：<strong className="text-[#18181B] font-bold">{game.difficulty}</strong>
        </span>

        <button className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-[#6C4CF1] group-hover:bg-[#532CD8] text-white text-xs font-bold shadow-xs transition-all btn-press">
          <Play className="w-3.5 h-3.5 fill-white" />
          <span>立即挑战</span>
        </button>
      </div>
    </div>
  );
};

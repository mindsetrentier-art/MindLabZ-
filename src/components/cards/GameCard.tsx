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
    <article
      onClick={() => navigate(`/game/${game.id}`)}
      className="group editorial-card editorial-card-hover rounded-2xl p-6 sm:p-7 cursor-pointer flex flex-col justify-between"
    >
      <div>
        {/* Top Unboxed Metadata Row */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-200/60 text-xs">
          <div className="flex items-center gap-2 text-stone-500 font-medium">
            <span className="text-stone-900 font-semibold">{game.category}训练</span>
            <span className="text-stone-300" aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1 font-numeric">
              <Clock className="w-3 h-3 text-stone-400" />
              {game.estimatedTime}
            </span>
          </div>

          <span className="text-xs font-semibold text-stone-700 flex items-center gap-1 font-numeric">
            <Trophy className="w-3.5 h-3.5 text-amber-600 fill-amber-600" />
            {highScore > 0 ? highScore.toLocaleString() : '待创纪录'}
          </span>
        </div>

        {/* Game Title & Tactile Monogram */}
        <div className="flex items-start gap-3.5 mb-3">
          <div className="w-10 h-10 rounded-xl bg-stone-100 border border-stone-200/80 flex items-center justify-center text-stone-800 shrink-0 group-hover:border-stone-400 transition-colors">
            <IconComponent className="w-5 h-5 text-stone-700" />
          </div>

          <div>
            <h3 className="font-serif-editorial text-base sm:text-lg font-bold text-stone-900 group-hover:text-[#532CD8] transition-colors leading-snug tracking-tight">
              {game.nameZh}
            </h3>
            <p className="text-xs text-stone-500 font-serif-editorial italic mt-0.5">
              {game.name}
            </p>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs sm:text-[13px] text-stone-600 leading-relaxed mb-4">
          {game.description}
        </p>

        {/* Scientific Concept Callout */}
        <div className="bg-[#FAF8F5] rounded-xl p-3.5 mb-5 border border-stone-200/50">
          <span className="text-[11px] font-semibold text-stone-900 block mb-0.5 font-serif-editorial">实验原理</span>
          <p className="text-xs text-stone-600 font-normal leading-relaxed">
            {game.conceptLearned}
          </p>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-3.5 flex items-center justify-between border-t border-stone-200/60 text-xs">
        <span className="text-stone-500 font-medium">
          难度评级 · <strong className="text-stone-900 font-semibold">{game.difficulty}</strong>
        </span>

        <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl chameleon-btn text-xs font-bold transition-all btn-tactile whitespace-nowrap">
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>进入实验</span>
        </button>
      </div>
    </article>
  );
};

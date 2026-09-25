import React, { useState } from 'react';
import { GameCard } from '../components/cards/GameCard';
import { GameCardSkeleton } from '../components/ui/Skeleton';
import { PSYCHOLOGY_GAMES } from '../data/games';
import { Brain, Trophy, Zap, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';

const GAME_CATEGORIES = ['全部', '记忆', '逻辑', '注意力', '决策', '社会'];

export const GamesPage: React.FC = () => {
  const { user } = useApp();
  const [selectedCat, setSelectedCat] = useState('全部');
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectCat = (cat: string) => {
    if (selectedCat === cat) return;
    setIsLoading(true);
    setSelectedCat(cat);
    setTimeout(() => {
      setIsLoading(false);
    }, 220);
  };

  const filteredGames = selectedCat === '全部'
    ? PSYCHOLOGY_GAMES
    : PSYCHOLOGY_GAMES.filter(g => g.category === selectedCat);

  return (
    <div className="space-y-5 pb-6 animate-fadeIn">
      {/* Top Artistic Banner */}
      <div className="relative art-dark-banner text-white rounded-3xl p-6 overflow-hidden flex items-center justify-between">
        <svg
          className="absolute -right-8 -bottom-10 w-40 h-40 opacity-15 pointer-events-none"
          viewBox="0 0 120 120"
          fill="none"
        >
          <circle cx="60" cy="60" r="50" stroke="white" strokeWidth="1.5" strokeDasharray="4 4" />
          <circle cx="60" cy="60" r="30" stroke="white" strokeWidth="1.5" />
        </svg>

        <div className="relative z-10">
          <div className="flex items-center gap-2 text-xs text-[#FDE68A] font-semibold">
            <span>认知神经科学实验室</span>
            <span className="opacity-50">·</span>
            <span className="font-serif-editorial italic">Cognitive Arena</span>
          </div>
          <h2 className="text-xl font-extrabold mt-1 tracking-tight">短时专注 · 大脑机能训练</h2>
          <p className="text-xs text-white/80 mt-1 font-numeric">
            累计完成训练 <strong>{user.totalGames}</strong> 场 · 持续激活前额叶工作记忆
          </p>
        </div>

        <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center text-white shrink-0 shadow-inner relative z-10">
          <Zap className="w-6 h-6 fill-white" />
        </div>
      </div>

      {/* Interactive Category Filter Buttons */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {GAME_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => handleSelectCat(cat)}
            className={`text-xs font-bold px-3.5 py-2 rounded-xl transition-all shrink-0 border btn-tactile whitespace-nowrap ${
              selectedCat === cat
                ? 'bg-[#532CD8] text-white border-[#532CD8] shadow-[0_4px_12px_rgba(83,44,216,0.25)]'
                : 'bg-white text-[#64748B] border-[#E6E2F5] hover:bg-[#F5F3FF] hover:text-[#18181B]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Games List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading ? (
          <>
            <GameCardSkeleton />
            <GameCardSkeleton />
            <GameCardSkeleton />
            <GameCardSkeleton />
          </>
        ) : (
          filteredGames.map((game) => (
            <GameCard key={game.id} game={game} />
          ))
        )}
      </div>
    </div>
  );
};

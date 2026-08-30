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
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#6C4CF1] to-[#532CD8] text-white rounded-3xl p-5 shadow-[0_8px_25px_rgba(108,76,241,0.25)] flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
            ⚡ 认知科学微游戏竞技场
          </span>
          <h2 className="text-lg font-extrabold mt-1.5 tracking-tight">短时专注 · 大脑机能训练</h2>
          <p className="text-xs text-white/85 mt-0.5">
            已参与训练 <strong>{user.totalGames}</strong> 次 · 累计收获高额 XP
          </p>
        </div>

        <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white shrink-0 shadow-inner">
          <Zap className="w-6 h-6 fill-white" />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {GAME_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => handleSelectCat(cat)}
            className={`text-xs font-bold px-3.5 py-1.5 rounded-full transition-all shrink-0 border btn-press ${
              selectedCat === cat
                ? 'bg-[#6C4CF1] text-white border-[#6C4CF1] shadow-xs'
                : 'bg-white text-[#64748B] border-[#E6E2F5] hover:bg-[#F5F3FF]'
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

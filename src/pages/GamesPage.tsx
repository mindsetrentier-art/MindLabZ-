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
    <div className="space-y-8 sm:space-y-10 pb-12 animate-fadeIn max-w-5xl mx-auto">
      {/* Top Editorial Laboratory Masthead */}
      <section className="editorial-card rounded-2xl p-7 sm:p-9 md:p-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-stone-500 font-medium">
              <span className="editorial-kicker text-[10px] text-stone-700 tracking-widest">
                Cognitive Arena · Neuro-Lab
              </span>
              <span className="text-stone-300" aria-hidden="true">/</span>
              <span className="font-serif-editorial italic text-stone-600">Behavioral Experiments</span>
            </div>
            <h2 className="font-serif-editorial text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight leading-tight">
              短时专注与心智模型实验工坊
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 font-normal leading-relaxed max-w-2xl">
              结合斯特鲁普效应、N-Back 工作记忆与启发式决策偏差，在互动博弈中体察大脑思维边界并锻炼敏锐反思能力。
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs text-stone-500 font-numeric shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-stone-200">
            <div>
              <span className="text-[10px] text-stone-600 block">实验项目</span>
              <span className="text-base font-bold text-stone-900 font-serif-editorial">5 款</span>
            </div>
            <span className="text-stone-300">/</span>
            <div>
              <span className="text-[10px] text-stone-600 block">累计完成</span>
              <span className="text-base font-bold text-stone-900 font-serif-editorial">{user.totalGames} 场</span>
            </div>
          </div>
        </div>
      </section>

      {/* Category Filter Controls */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {GAME_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => handleSelectCat(cat)}
            className={`text-xs font-semibold px-4 py-2 rounded-xl transition-colors shrink-0 whitespace-nowrap cursor-pointer ${
              selectedCat === cat
                ? 'bg-stone-900 text-white'
                : 'bg-white text-stone-600 border border-stone-200 hover:border-stone-400'
            }`}
          >
            {cat === '全部' ? '全部实验' : `${cat}训练`}
          </button>
        ))}
      </div>

      {/* Games Grid (Spacious Editorial Layout) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-7">
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

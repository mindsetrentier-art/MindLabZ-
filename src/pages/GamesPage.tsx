import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameCard } from '../components/cards/GameCard';
import { GameCardSkeleton } from '../components/ui/Skeleton';
import { PSYCHOLOGY_GAMES } from '../data/games';
import { Brain, Trophy, Zap, Sparkles, Shuffle, ShieldCheck, Flame, Crown, CheckCircle2, Volume2, VolumeX, Gamepad2, Award } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { GameDifficulty, DEFAULT_DIFFICULTY, DIFFICULTY_LIST, DIFFICULTY_CONFIGS } from '../data/difficulty';
import { DifficultySelector } from '../components/games/DifficultySelector';
import { GameLeaderboardModule } from '../components/games/GameLeaderboardModule';
import { gameAudio } from '../utils/gameAudio';

const GAME_CATEGORIES = ['全部', '10款心理学小游戏', '认知', '决策', '社会', '情绪', '习惯', '记忆', '逻辑'];

export const GamesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useApp();
  const [selectedCat, setSelectedCat] = useState('全部');
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(() => gameAudio.getMuted());

  const [arenaDifficulty, setArenaDifficulty] = useState<GameDifficulty>(() => {
    try {
      const saved = localStorage.getItem('mindlabz_arena_difficulty') as GameDifficulty | null;
      if (saved && DIFFICULTY_LIST.includes(saved)) {
        return saved;
      }
    } catch {
      // ignore
    }
    return DEFAULT_DIFFICULTY;
  });

  const handleDifficultyChange = (newDiff: GameDifficulty) => {
    gameAudio.playTap();
    setArenaDifficulty(newDiff);
    try {
      localStorage.setItem('mindlabz_arena_difficulty', newDiff);
    } catch {
      // ignore
    }
  };

  const handleSelectCat = (cat: string) => {
    if (selectedCat === cat) return;
    gameAudio.playTap();
    setIsLoading(true);
    setSelectedCat(cat);
    setTimeout(() => {
      setIsLoading(false);
    }, 180);
  };

  const handleToggleSound = () => {
    const next = gameAudio.toggleMute();
    setIsMuted(next);
  };

  const filteredGames = selectedCat === '全部'
    ? PSYCHOLOGY_GAMES
    : selectedCat === '10款心理学小游戏'
    ? PSYCHOLOGY_GAMES.filter(g => Boolean(g.numberPrefix))
    : PSYCHOLOGY_GAMES.filter(g => g.category === selectedCat);

  const currentDiffConfig = DIFFICULTY_CONFIGS[arenaDifficulty];
  const completedCount = user.completedGames?.length || 0;
  const totalGamesCount = PSYCHOLOGY_GAMES.length;
  const completionPercentage = Math.round((completedCount / totalGamesCount) * 100);

  // Compute total high score across all arena games
  const totalHighScore = Object.values(user.gameHighScores || {}).reduce<number>((a, b) => a + Number(b || 0), 0);

  return (
    <div className="space-y-7 sm:space-y-9 pb-12 animate-fadeIn max-w-5xl mx-auto">
      {/* High-End Game Arena Hero Cockpit Banner */}
      <section className="relative rounded-3xl overflow-hidden shadow-xl border border-stone-800 bg-gradient-to-br from-[#121324] via-[#1A1938] to-[#251B4B] text-white p-6 sm:p-9 md:p-10">
        {/* Ambient Neon Aurora Orbs */}
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-gradient-to-br from-indigo-500/25 to-purple-600/30 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-gradient-to-tr from-pink-500/20 to-blue-500/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 font-bold">
                <Gamepad2 className="w-3.5 h-3.5 text-indigo-400" />
                COGNITIVE ARENA
              </span>
              <span className="text-stone-500" aria-hidden="true">/</span>
              <span className="text-amber-300/90 font-sans font-semibold">
                MindLabs 咨询堂 · 心智竞技工坊
              </span>
            </div>

            <h1 className="font-serif-editorial text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-tight text-white drop-shadow-sm">
              10 款心理学实验小游戏 & 认知竞技场
            </h1>

            <p className="text-xs sm:text-sm text-stone-300/90 font-normal leading-relaxed">
              涵盖首因效应、锚点实验室、多数人答案、峰终定律、情绪侦探、换位不读心、免费陷阱、微习惯、旁观者破局与反证挑战。<strong className="text-amber-300 font-bold">每次出题顺序全随机</strong>，四档难度自由调控，畅享游戏快感与认知觉醒。
            </p>

            {/* Quick Completion Progress Bar */}
            <div className="pt-2 max-w-md">
              <div className="flex items-center justify-between text-xs font-numeric mb-1.5">
                <span className="text-stone-300 font-semibold">
                  竞技场通关进度: <strong className="text-emerald-400">{completedCount}</strong> / {totalGamesCount} 款
                </span>
                <span className="text-indigo-300 font-bold">{completionPercentage}% 完成率</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden border border-white/10 p-0.5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 transition-all duration-500 shadow-sm"
                  style={{ width: `${Math.max(4, completionPercentage)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Right: User Arena Stats Cards & Audio Control */}
          <div className="flex flex-col gap-3 shrink-0 pt-2 md:pt-0">
            <div className="grid grid-cols-2 gap-2.5 font-numeric text-xs">
              <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex flex-col justify-between">
                <span className="text-[10px] text-stone-300 font-medium block">心智经验值</span>
                <span className="text-lg font-black text-amber-300 flex items-center gap-1">
                  <Zap className="w-4 h-4 fill-amber-400 text-amber-400" />
                  {(user?.xp ?? 0).toLocaleString()} XP
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex flex-col justify-between">
                <span className="text-[10px] text-stone-300 font-medium block">历史总分</span>
                <span className="text-lg font-black text-indigo-300 flex items-center gap-1">
                  <Trophy className="w-4 h-4 fill-indigo-400 text-indigo-400" />
                  {(totalHighScore ?? 0).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Cognitive Medals Showroom Quick Access Pill */}
            <button
              onClick={() => navigate('/profile')}
              type="button"
              className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/40 text-xs font-bold transition-all cursor-pointer active:scale-95 text-amber-200"
              title="前往个人资料页查看认知勋章荣誉殿堂"
            >
              <div className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-300" />
                <span>认知勋章荣誉展馆</span>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-amber-400/25 text-amber-100 font-extrabold">
                {user.unlockedBadges?.length || 0} 枚已解锁 →
              </span>
            </button>

            {/* Sound Toggle Pill */}
            <button
              onClick={handleToggleSound}
              type="button"
              className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-xs font-bold transition-all cursor-pointer active:scale-95"
            >
              <div className="flex items-center gap-2">
                {isMuted ? <VolumeX className="w-4 h-4 text-stone-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                <span>游戏合成音效</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-md ${isMuted ? 'bg-stone-800 text-stone-400' : 'bg-emerald-500/20 text-emerald-300'}`}>
                {isMuted ? '已静音' : '开启中'}
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Rewards Rules Notification Banner */}
      <section className="bg-gradient-to-r from-indigo-50/80 via-purple-50/60 to-amber-50/60 rounded-3xl p-5 border border-indigo-100/90 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/20">
            <Sparkles className="w-5 h-5 text-yellow-300" />
          </div>
          <div>
            <h4 className="font-bold text-stone-900 flex items-center gap-2 font-serif-editorial text-sm">
              <span>实战积分与通关奖励规则</span>
              <span className="text-[10px] font-sans font-bold text-indigo-700 bg-white px-2 py-0.5 rounded-full border border-indigo-200 shadow-2xs">
                浏览器本地实时保存
              </span>
            </h4>
            <p className="text-xs text-stone-600 mt-0.5 leading-relaxed">
              首次完成游戏并研读解析：<strong className="text-indigo-600 font-black">+30–45 XP</strong> · 重复复盘巩固：<strong className="text-emerald-600 font-black">+8–11 XP (原奖励 25%)</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 font-numeric text-xs font-semibold text-stone-700 bg-white/90 px-3.5 py-2 rounded-xl border border-stone-200/70 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>通关后可随时回溯最佳答案与底层原理解析</span>
        </div>
      </section>

      {/* Global Arena Difficulty Control Bar */}
      <section className="bg-white rounded-3xl p-5 sm:p-6.5 border border-stone-200/90 shadow-sm space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700">
              <Shuffle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-stone-900 font-serif-editorial flex items-center gap-2">
                <span>竞技场难度全局设定</span>
                <span className="text-[10px] font-sans font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  出题顺序全随机
                </span>
              </h3>
              <p className="text-[11px] text-stone-500">
                支持低、中、高、高级自由切换；进入任何小游戏将自动以此难度展开博弈
              </p>
            </div>
          </div>

          <div className="text-xs font-numeric font-semibold text-stone-600 shrink-0 bg-stone-50 px-3 py-1.5 rounded-xl border border-stone-200">
            当前难度加成: <span className="text-purple-600 font-black">{currentDiffConfig.multiplierText} 积分收益</span>
          </div>
        </div>

        <DifficultySelector
          value={arenaDifficulty}
          onChange={handleDifficultyChange}
          showDetails={true}
        />
      </section>

      {/* Real-Time Firebase Daily Arena Leaderboard */}
      <GameLeaderboardModule />

      {/* Category Filter Controls */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {GAME_CATEGORIES.map((cat) => {
          const isSelected = selectedCat === cat;
          return (
            <button
              key={cat}
              onClick={() => handleSelectCat(cat)}
              type="button"
              className={`text-xs font-bold px-4 py-2.5 rounded-2xl transition-all shrink-0 whitespace-nowrap cursor-pointer active:scale-95 ${
                isSelected
                  ? 'bg-stone-900 text-white shadow-md shadow-stone-900/15'
                  : 'bg-white text-stone-600 border border-stone-200 hover:border-stone-400 hover:text-stone-900'
              }`}
            >
              {cat === '全部'
                ? `全部项目 (${PSYCHOLOGY_GAMES.length}款)`
                : cat === '10款心理学小游戏'
                ? '🔥 10款经典小游戏'
                : `${cat}训练`}
            </button>
          );
        })}
      </div>

      {/* Games Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-7">
        {isLoading ? (
          <>
            <GameCardSkeleton />
            <GameCardSkeleton />
            <GameCardSkeleton />
            <GameCardSkeleton />
          </>
        ) : (
          filteredGames.map((game, idx) => (
            <div
              key={game.id}
              className="animate-stageEnter"
              style={{ animationDelay: `${Math.min(idx * 35, 210)}ms` }}
            >
              <GameCard game={game} difficulty={arenaDifficulty} />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

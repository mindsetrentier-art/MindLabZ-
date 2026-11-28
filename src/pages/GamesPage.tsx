import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameCard } from '../components/cards/GameCard';
import { GameCardSkeleton } from '../components/ui/Skeleton';
import { PSYCHOLOGY_GAMES } from '../data/games';
import { Brain, Trophy, Zap, Sparkles, Shuffle, ShieldCheck, Flame, Crown, CheckCircle2, Volume2, VolumeX, Gamepad2, Award, ArrowRight, Heart, RotateCcw, Eye, BookOpen, Scale, Layers, HeartHandshake, Search, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { searchArenaWithLunr } from '../utils/globalSearchIndex';
import { GameDifficulty, DEFAULT_DIFFICULTY, DIFFICULTY_LIST, DIFFICULTY_CONFIGS } from '../data/difficulty';
import { DifficultySelector } from '../components/games/DifficultySelector';
import { GameLeaderboardModule } from '../components/games/GameLeaderboardModule';
import { ArenaHorizontalAccordion } from '../components/games/ArenaHorizontalAccordion';
import { gameAudio } from '../utils/gameAudio';
import {
  getAleatoricStats,
  resetAleatoricDeck,
  getReverseAleatoricStats,
  resetReverseAleatoricDeck,
  getCriminalAleatoricStats,
  resetCriminalAleatoricDeck,
  getSexualAleatoricStats,
  resetSexualAleatoricDeck,
  getLove100AleatoricStats,
  resetLove100AleatoricDeck,
  getIntimateAleatoricStats,
  resetIntimateAleatoricDeck,
} from '../utils/aleatoricEngine';
import { MICROEXPRESSION_LAWS } from '../data/microexpressionLaws';
import { REVERSE_SCENARIOS, REVERSE_CATEGORIES } from '../data/reversePsychologyLaws';
import { CRIMINAL_CONTEXTS, CRIMINAL_CATEGORIES } from '../data/criminalPsychologyLaws';
import {
  SEXUAL_PSYCHOLOGY_LAWS,
  SEXUAL_PILLARS,
  SEXUAL_CONTEXTS,
  SEXUAL_CATEGORIES,
} from '../data/sexualPsychologyLaws';
import {
  LOVE100_PSYCHOLOGY_LAWS,
  LOVE100_PILLARS,
  LOVE100_CONTEXTS,
  LOVE100_CATEGORIES,
} from '../data/love100PsychologyLaws';
import {
  INTIMATE_RELATIONSHIPS_LAWS,
  INTIMATE_PILLARS,
  INTIMATE_CONTEXTS,
  INTIMATE_CATEGORIES,
} from '../data/intimateRelationshipsLaws';
import {
  CylindricalThemeRoller,
  CylindricalThemeItem,
  CylindricalThemeChangeMeta,
} from '../components/ui/CylindricalThemeRoller';
import {
  CylinderScrollList,
  CylinderScrollItem,
} from '../components/ui/CylinderScrollList';

export const GamesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, openSearchModal } = useApp();
  const [selectedCat, setSelectedCat] = useState('全部');
  const [arenaSearch, setArenaSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(() => gameAudio.getMuted());
  const [aleatoricStats, setAleatoricStats] = useState(() => getAleatoricStats());
  const [reverseStats, setReverseStats] = useState(() => getReverseAleatoricStats());
  const [criminalStats, setCriminalStats] = useState(() => getCriminalAleatoricStats());
  const [sexualStats, setSexualStats] = useState(() => getSexualAleatoricStats());
  const [love100Stats, setLove100Stats] = useState(() => getLove100AleatoricStats());
  const [intimateStats, setIntimateStats] = useState(() => getIntimateAleatoricStats());

  const arenaRollerItems: CylindricalThemeItem[] = useMemo(() => {
    const countFor = (cat: string) => {
      if (cat === '全部') return PSYCHOLOGY_GAMES.length;
      if (cat === '零重复随机博弈') {
        return PSYCHOLOGY_GAMES.filter(
          (g) =>
            g.id === 'love-aleatoric-arena' ||
            g.id === 'love100-aleatoric-arena' ||
            g.id === 'intimate-aleatoric-arena' ||
            g.id === 'reverse-aleatoric-arena' ||
            g.id === 'criminal-aleatoric-arena' ||
            g.id === 'sexual-aleatoric-arena'
        ).length;
      }
      if (cat === '心理学核心实验') {
        return PSYCHOLOGY_GAMES.filter((g) => Boolean(g.numberPrefix)).length;
      }
      return PSYCHOLOGY_GAMES.filter((g) => g.category === cat).length;
    };

    return [
      {
        id: '全部',
        label: '全部竞技项目',
        group: '总览与零重引擎',
        count: countFor('全部'),
        subtitle: '全实验室交互游戏',
        accentColor: '#F59E0B',
        icon: <Gamepad2 className="w-3.5 h-3.5" />,
      },
      {
        id: '零重复随机博弈',
        label: 'CSPRNG 零重复博弈',
        group: '总览与零重引擎',
        count: countFor('零重复随机博弈'),
        subtitle: '亲密100 · 恋爱100 · 性心理100 · 犯罪100',
        accentColor: '#10B981',
        icon: <Shuffle className="w-3.5 h-3.5" />,
      },
      {
        id: '亲密关系100',
        label: '亲密关系 100 律专场',
        group: '热点专题赛区',
        count: countFor('亲密关系100'),
        subtitle: '依恋安全 · 共同调节 · 冲突修复',
        accentColor: '#BE123C',
        icon: <HeartHandshake className="w-3.5 h-3.5" />,
      },
      {
        id: '恋爱心理100',
        label: '恋爱心理学 100 律专场',
        group: '热点专题赛区',
        count: countFor('恋爱心理100'),
        subtitle: '依恋 · 沟通 · 冲突修复',
        accentColor: '#E11D48',
        icon: <Heart className="w-3.5 h-3.5" />,
      },
      {
        id: '性心理',
        label: '性心理学专场',
        group: '热点专题赛区',
        count: countFor('性心理'),
        subtitle: '100 律亲密与健康思辨',
        accentColor: '#7E22CE',
        icon: <HeartHandshake className="w-3.5 h-3.5" />,
      },
      {
        id: '犯罪心理',
        label: '犯罪心理学专场',
        group: '热点专题赛区',
        count: countFor('犯罪心理'),
        subtitle: '100 律行为剖析与预防',
        accentColor: '#E11D48',
        icon: <Scale className="w-3.5 h-3.5" />,
      },
      {
        id: '心理学核心实验',
        label: '心理学核心实验',
        group: '热点专题赛区',
        count: countFor('心理学核心实验'),
        subtitle: '#01–#14 序列实验室',
        accentColor: '#6366F1',
        icon: <Sparkles className="w-3.5 h-3.5" />,
      },
      {
        id: '认知',
        label: '认知与逆向对抗',
        group: '心智维度赛区',
        count: countFor('认知'),
        subtitle: '第一印象 · 逆向心理100',
        accentColor: '#0D9488',
        icon: <Brain className="w-3.5 h-3.5" />,
      },
      {
        id: '决策',
        label: '决策与锚定博弈',
        group: '心智维度赛区',
        count: countFor('决策'),
        subtitle: '锚定 · 免费陷阱 · 侦探',
        accentColor: '#3B82F6',
        icon: <Layers className="w-3.5 h-3.5" />,
      },
      {
        id: '社会',
        label: '社会动能实验',
        group: '心智维度赛区',
        count: countFor('社会'),
        subtitle: '从众 · 归因 · 旁观破局',
        accentColor: '#8B5CF6',
        icon: <Zap className="w-3.5 h-3.5" />,
      },
      {
        id: '情绪',
        label: '情绪与依恋竞技',
        group: '心智维度赛区',
        count: countFor('情绪'),
        subtitle: '情绪侦探 · 爱情696阵',
        accentColor: '#EC4899',
        icon: <Heart className="w-3.5 h-3.5" />,
      },
      {
        id: '逻辑',
        label: '逻辑与证伪挑战',
        group: '认知基础域',
        count: countFor('逻辑'),
        subtitle: '反证挑战 · 思维陷阱',
        accentColor: '#4F46E5',
        icon: <CheckCircle2 className="w-3.5 h-3.5" />,
      },
      {
        id: '记忆',
        label: '记忆宫殿与峰终',
        group: '认知基础域',
        count: countFor('记忆'),
        subtitle: '空间编码 · 峰终体验',
        accentColor: '#06B6D4',
        icon: <Brain className="w-3.5 h-3.5" />,
      },
      {
        id: '习惯',
        label: '微习惯设计域',
        group: '认知基础域',
        count: countFor('习惯'),
        subtitle: '习惯回路 · 提示重构',
        accentColor: '#14B8A6',
        icon: <Sparkles className="w-3.5 h-3.5" />,
      },
      {
        id: '注意力',
        label: '选择性注意风暴',
        group: '认知基础域',
        count: countFor('注意力'),
        subtitle: '神经反应时过滤训练',
        accentColor: '#10B981',
        icon: <Eye className="w-3.5 h-3.5" />,
      },
      {
        id: '心理实验',
        label: '经典行为经济学',
        group: '认知基础域',
        count: countFor('心理实验'),
        subtitle: '前景理论实景模拟',
        accentColor: '#3B82F6',
        icon: <BookOpen className="w-3.5 h-3.5" />,
      },
    ];
  }, []);

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

  const handleSelectCat = (cat: string, meta?: CylindricalThemeChangeMeta) => {
    if (selectedCat === cat) return;
    if (!meta?.isAuto) {
      gameAudio.playTap();
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
      }, 180);
    }
    setSelectedCat(cat);
  };

  const handleToggleSound = () => {
    const next = gameAudio.toggleMute();
    setIsMuted(next);
  };

  const catFilteredGames = selectedCat === '全部'
    ? PSYCHOLOGY_GAMES
    : selectedCat === '零重复随机博弈'
    ? PSYCHOLOGY_GAMES.filter(
        (g) =>
          g.id === 'love-aleatoric-arena' ||
          g.id === 'love100-aleatoric-arena' ||
          g.id === 'intimate-aleatoric-arena' ||
          g.id === 'reverse-aleatoric-arena' ||
          g.id === 'criminal-aleatoric-arena' ||
          g.id === 'sexual-aleatoric-arena'
      )
    : selectedCat === '心理学核心实验' || selectedCat === '10款心理学小游戏'
    ? PSYCHOLOGY_GAMES.filter(g => Boolean(g.numberPrefix))
    : PSYCHOLOGY_GAMES.filter(g => g.category === selectedCat);

  const arenaLunrResults = useMemo(() => {
    const q = arenaSearch.trim();
    if (!q) return [];
    return searchArenaWithLunr(q, 24);
  }, [arenaSearch]);

  const filteredGames = useMemo(() => {
    const q = arenaSearch.trim();
    if (!q) return catFilteredGames;
    const matchedGameIds = new Map<string, number>();
    arenaLunrResults.forEach((res, idx) => {
      if (res.game) {
        matchedGameIds.set(res.game.id, idx);
      }
    });
    const qLower = q.toLowerCase();
    return catFilteredGames
      .filter(
        (g) =>
          matchedGameIds.has(g.id) ||
          g.nameZh.toLowerCase().includes(qLower) ||
          (g.nameEn && g.nameEn.toLowerCase().includes(qLower)) ||
          g.description.toLowerCase().includes(qLower) ||
          g.conceptLearned.toLowerCase().includes(qLower)
      )
      .sort(
        (a, b) =>
          (matchedGameIds.get(a.id) ?? 999) - (matchedGameIds.get(b.id) ?? 999)
      );
  }, [arenaSearch, arenaLunrResults, catFilteredGames]);

  const subArenaMatches = useMemo(
    () => arenaLunrResults.filter((r) => !r.game).slice(0, 8),
    [arenaLunrResults]
  );

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
              心理学实验小游戏 & 认知竞技场
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

            {/* Brain Gym Memory & Reflex Module Access */}
            <button
              onClick={() => {
                gameAudio.playTap();
                navigate('/brain-gym');
              }}
              type="button"
              className="luxury-ghost-dark-btn flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer active:scale-95 text-[#EDD08B]"
              title="前往 Brain Gym 进行工作记忆与毫秒反应训练"
            >
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-[#E5C07B]" />
                <span>Brain Gym · 记忆反应馆</span>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-[#D4A656]/20 text-[#F8E7C1] border border-[#D4A656]/35 font-semibold whitespace-nowrap shrink-0">
                4 项训练 →
              </span>
            </button>

            {/* Cognitive Assessment Radar Quick Access Pill */}
            <button
              onClick={() => navigate('/assessment')}
              type="button"
              className="luxury-ghost-dark-btn flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer active:scale-95 text-[#D2C9F8]"
              title="查看基于游戏得分生成的六维认知能力评估雷达与心智报告"
            >
              <div className="flex items-center gap-1.5">
                <Brain className="w-4 h-4 text-[#A594EE]" />
                <span>认知多维评估雷达</span>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-[#5B45B8]/30 text-[#E4DDFB] border border-[#8B7BE0]/30 font-semibold">
                全维测评 →
              </span>
            </button>

            {/* Cognitive Medals Showroom Quick Access Pill */}
            <button
              onClick={() => navigate('/profile')}
              type="button"
              className="luxury-ghost-dark-btn flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer active:scale-95 text-[#F3D89E]"
              title="前往个人资料页查看认知勋章荣誉殿堂"
            >
              <div className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-[#E5C07B]" />
                <span>认知勋章荣誉展馆</span>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-[#D4A656]/20 text-[#F8E7C1] border border-[#D4A656]/35 font-semibold">
                {user.unlockedBadges?.length || 0} 枚已解锁 →
              </span>
            </button>

            {/* Sound Toggle Pill */}
            <button
              onClick={handleToggleSound}
              type="button"
              className="luxury-ghost-dark-btn flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer active:scale-95"
            >
              <div className="flex items-center gap-2">
                {isMuted ? <VolumeX className="w-4 h-4 text-stone-400" /> : <Volume2 className="w-4 h-4 text-[#6EE7B7]" />}
                <span>游戏合成音效</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-md font-mono ${isMuted ? 'bg-white/10 text-stone-400' : 'bg-[#34A88B]/20 text-[#A7F3D0] border border-[#34A88B]/35'}`}>
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

      {/* Cognitive Assessment Radar Feature Banner */}
      <section className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-[#17162E] via-[#1E1B38] to-[#121124] text-white border border-indigo-500/30 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-indigo-500/25 border border-indigo-400/40 flex items-center justify-center shrink-0">
            <Brain className="w-6 h-6 text-indigo-300" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-300">
                COGNITIVE RADAR ASSESSMENT
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-200 border border-indigo-400/30">
                基于实战得分
              </span>
            </div>
            <h3 className="font-serif-editorial text-base sm:text-lg font-bold text-white">
              六维认知能力评估雷达与心智原型报告
            </h3>
            <p className="text-xs text-stone-300">
              综合测算记忆力、逻辑推理、专注抗扰、决策理性、反应速度与元认知。
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/assessment')}
          className="px-4 py-2.5 rounded-xl bg-white hover:bg-stone-100 text-stone-900 text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer active:scale-95 flex items-center gap-1.5"
        >
          <span>查看测评报告</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </section>

      {/* Real-Time Firebase Daily Arena Leaderboard */}
      <GameLeaderboardModule />

      {/* Featured Extreme Aleatoric Love Psychology Arena Launcher */}
      <section className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#2B0C1C] via-[#1B1230] to-[#111827] text-white p-5 sm:p-7 border border-rose-400/35 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-2 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/25 text-rose-200 border border-rose-400/40 font-bold">
              <Heart className="w-3 h-3 fill-rose-400 text-rose-400" />
              ALEATORIC LOVE ENGINE
            </span>
            <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-200 border border-amber-400/30 font-bold">
              {aleatoricStats.totalConcepts} 定律 × 6 视角 = {aleatoricStats.totalUniqueEncounters.toLocaleString()} 张防重题卡
            </span>
          </div>
          <h3 className="font-serif-editorial text-xl sm:text-2xl font-bold text-white">
            爱情心理学 · 极致零重复 Aleatoric 竞技场
          </h3>
          <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
            基于加密真随机洗牌盒与跨局冷却锁机制（60 题概念防重窗口 + {aleatoricStats.totalUniqueEncounters.toLocaleString()} 独立变式跟踪），无论尝试多少次开局，绝不重复推送同一张题卡。当前已探索{' '}
            <strong className="text-amber-300 font-numeric">
              {aleatoricStats.seenEncountersCount.toLocaleString()} / {aleatoricStats.totalUniqueEncounters.toLocaleString()}
            </strong>{' '}
            张题卡（覆盖 <strong className="text-emerald-300 font-numeric">{aleatoricStats.uniqueConceptsExplored}</strong> / {aleatoricStats.totalConcepts} 条词条）。
          </p>
        </div>

        <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              gameAudio.playSuccess();
              navigate(`/game/love-aleatoric-arena?difficulty=${encodeURIComponent(arenaDifficulty)}`);
            }}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 hover:brightness-110 text-white font-bold text-xs sm:text-sm shadow-lg shadow-rose-500/25 flex items-center justify-center gap-2 cursor-pointer active:scale-95 whitespace-nowrap"
          >
            <Shuffle className="w-4 h-4" />
            <span>立即开启全随机对战</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {aleatoricStats.seenEncountersCount > 0 && (
            <button
              type="button"
              onClick={() => {
                gameAudio.playTap();
                resetAleatoricDeck();
                setAleatoricStats(getAleatoricStats());
              }}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-stone-200 text-[11px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-3 h-3" />
              <span>重置全库防重洗牌盒</span>
            </button>
          )}
        </div>
      </section>

      {/* Featured Reverse Psychology 100 CSPRNG Arena & Scenario/Category Matrix */}
      <section className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#0F2A2A] via-[#132635] to-[#111827] text-white p-5 sm:p-7 border border-teal-400/35 shadow-xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
              <span className="inline-flex items-center gap-1.5 text-teal-300 font-bold">
                <Shuffle className="w-3.5 h-3.5" />
                <span>REVERSE PSYCHOLOGY · CSPRNG 100 DECK</span>
              </span>
              <span className="text-stone-500" aria-hidden="true">/</span>
              <span className="text-amber-300 font-bold tabular-nums">
                {reverseStats.totalConcepts} 词条 × 5 视角 = {reverseStats.totalUniqueEncounters} 张零重复题卡
              </span>
            </div>
            <h3 className="font-serif-editorial text-xl sm:text-2xl font-bold text-white">
              逆向心理学与心理抗拒 · 100 律真随机实战竞技场
            </h3>
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
              全量导入「心理抗拒、自由威胁、禁果效应、双面信息与伦理边界」20 章 × 5 大沟通场景。每次开局通过 CSPRNG 真随机洗牌并锁定跨局冷却队列，当前已探索{' '}
              <strong className="text-amber-300 font-numeric tabular-nums">
                {reverseStats.seenEncountersCount} / {reverseStats.totalUniqueEncounters}
              </strong>{' '}
              张题卡（覆盖 <strong className="text-emerald-300 font-numeric tabular-nums">{reverseStats.uniqueConceptsExplored}</strong> / {reverseStats.totalConcepts} 律）。
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                gameAudio.playSuccess();
                navigate(`/game/reverse-aleatoric-arena?difficulty=${encodeURIComponent(arenaDifficulty)}`);
              }}
              className="px-5 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs sm:text-sm shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95 whitespace-nowrap shrink-0 transition-colors"
            >
              <Shuffle className="w-4 h-4" />
              <span>开启逆向心理真随机对战</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  gameAudio.playTap();
                  navigate('/learn?mode=reverse');
                }}
                className="flex-1 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-teal-100 text-[11px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
              >
                <BookOpen className="w-3 h-3" />
                <span>定律随听馆查看 100 律</span>
              </button>

              {reverseStats.seenEncountersCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    gameAudio.playTap();
                    resetReverseAleatoricDeck();
                    setReverseStats(getReverseAleatoricStats());
                  }}
                  className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-stone-200 text-[11px] font-semibold flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
                  title="重置逆向心理防重洗牌盒"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>重置洗牌</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Fast Categorized Scenario Launchers */}
        <div className="pt-3 border-t border-white/10 grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="space-y-2">
            <span className="text-[11px] font-mono text-teal-300 font-bold block">
              按 5 大高频沟通场景一键随机挑战：
            </span>
            <div className="flex flex-wrap gap-1.5">
              {REVERSE_SCENARIOS.map((sc) => (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => {
                    gameAudio.playTap();
                    navigate(`/game/reverse-aleatoric-arena?scenario=${encodeURIComponent(sc.id)}&difficulty=${encodeURIComponent(arenaDifficulty)}`);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0"
                >
                  <span>{sc.label}</span>
                  <span className="text-[10px] font-mono text-teal-300 tabular-nums">{sc.count}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-mono text-amber-300 font-bold block">
              按 12 大心理机制分类直达：
            </span>
            <div className="flex flex-wrap gap-1.5">
              {REVERSE_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    gameAudio.playTap();
                    navigate(`/game/reverse-aleatoric-arena?category=${encodeURIComponent(cat.id)}&difficulty=${encodeURIComponent(arenaDifficulty)}`);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-black/25 hover:bg-white/15 border border-white/12 text-[11px] font-medium text-stone-200 hover:text-white cursor-pointer transition-colors whitespace-nowrap shrink-0"
                >
                  {cat.label} ({cat.count})
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Criminal Psychology 100 CSPRNG Arena & Context/Category Matrix */}
      <section className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#230E16] via-[#1C1628] to-[#111827] text-white p-5 sm:p-7 border border-rose-400/35 shadow-xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
              <span className="inline-flex items-center gap-1.5 text-rose-300 font-bold">
                <Scale className="w-3.5 h-3.5" />
                <span>CRIMINAL PSYCHOLOGY · CSPRNG 100 DECK</span>
              </span>
              <span className="text-stone-500" aria-hidden="true">/</span>
              <span className="text-amber-300 font-bold tabular-nums">
                {criminalStats.totalConcepts} 词条 × 5 视角 = {criminalStats.totalUniqueEncounters} 张零重复题卡
              </span>
            </div>
            <h3 className="font-serif-editorial text-xl sm:text-2xl font-bold text-white">
              犯罪心理学与风险预防 · 100 律真随机剖析竞技场
            </h3>
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
              全量导入「多因素犯罪模型、暴力与攻击机制、人格差异与群体责任分散」4 大领域 × 5 大观察预防场景。每次开局均执行 CSPRNG 真随机洗牌与跨局防重冷却，当前已破译{' '}
              <strong className="text-amber-300 font-numeric tabular-nums">
                {criminalStats.seenEncountersCount} / {criminalStats.totalUniqueEncounters}
              </strong>{' '}
              张题卡（覆盖 <strong className="text-emerald-300 font-numeric tabular-nums">{criminalStats.uniqueConceptsExplored}</strong> / {criminalStats.totalConcepts} 律）。
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                gameAudio.playSuccess();
                navigate(`/game/criminal-aleatoric-arena?difficulty=${encodeURIComponent(arenaDifficulty)}`);
              }}
              className="px-5 py-3 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-bold text-xs sm:text-sm shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95 whitespace-nowrap shrink-0 transition-colors"
            >
              <Shuffle className="w-4 h-4" />
              <span>开启犯罪心理真随机剖析</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  gameAudio.playTap();
                  navigate('/learn?mode=criminal');
                }}
                className="flex-1 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-rose-100 text-[11px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
              >
                <BookOpen className="w-3 h-3" />
                <span>定律随听馆查看 100 律</span>
              </button>

              {criminalStats.seenEncountersCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    gameAudio.playTap();
                    resetCriminalAleatoricDeck();
                    setCriminalStats(getCriminalAleatoricStats());
                  }}
                  className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-stone-200 text-[11px] font-semibold flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
                  title="重置犯罪心理防重洗牌盒"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>重置洗牌</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Fast Categorized Criminal Context & Domain Launchers */}
        <div className="pt-3 border-t border-white/10 grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="space-y-2">
            <span className="text-[11px] font-mono text-rose-300 font-bold block">
              按 5 大观察与预防场景一键真随机开局：
            </span>
            <div className="flex flex-wrap gap-1.5">
              {CRIMINAL_CONTEXTS.map((ctx) => (
                <button
                  key={ctx.id}
                  type="button"
                  onClick={() => {
                    gameAudio.playTap();
                    navigate(`/game/criminal-aleatoric-arena?context=${encodeURIComponent(ctx.id)}&difficulty=${encodeURIComponent(arenaDifficulty)}`);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0"
                >
                  <span>{ctx.label}</span>
                  <span className="text-[10px] font-mono text-rose-300 tabular-nums">{ctx.count}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-mono text-amber-300 font-bold block">
              按 4 大犯罪心理学核心领域直达：
            </span>
            <div className="flex flex-wrap gap-1.5">
              {CRIMINAL_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    gameAudio.playTap();
                    navigate(`/game/criminal-aleatoric-arena?category=${encodeURIComponent(cat.id)}&difficulty=${encodeURIComponent(arenaDifficulty)}`);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-black/25 hover:bg-white/15 border border-white/12 text-[11px] font-medium text-stone-200 hover:text-white cursor-pointer transition-colors whitespace-nowrap shrink-0"
                >
                  {cat.label} ({cat.count})
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Sexual Psychology 100 CSPRNG Arena & 4-Pillar Structured Matrix */}
      {(() => {
        const masteryMap = user.lawMasteryMap || {};
        const sexualMasteredCount = SEXUAL_PSYCHOLOGY_LAWS.filter(
          (l) => (masteryMap[l.id] || 0) >= 80
        ).length;
        const deckProgressPct = Math.round(
          (sexualStats.seenEncountersCount / Math.max(1, sexualStats.totalUniqueEncounters)) * 100
        );

        return (
          <section className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#1F0F2B] via-[#1C1433] to-[#111827] text-white p-5 sm:p-7 border border-purple-400/35 shadow-xl space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="space-y-2 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
                  <span className="inline-flex items-center gap-1.5 text-purple-300 font-bold">
                    <HeartHandshake className="w-3.5 h-3.5" />
                    <span>SEXUAL PSYCHOLOGY · CSPRNG 100 DECK</span>
                  </span>
                  <span className="text-stone-500" aria-hidden="true">/</span>
                  <span className="text-amber-300 font-bold tabular-nums">
                    {sexualStats.totalConcepts} 词条 × 5 视角 = {sexualStats.totalUniqueEncounters} 张防重题卡
                  </span>
                  <span className="text-stone-500" aria-hidden="true">·</span>
                  <span className="text-emerald-300 font-bold tabular-nums">
                    已精熟 {sexualMasteredCount} / {SEXUAL_PSYCHOLOGY_LAWS.length} 律
                  </span>
                </div>
                <h3 className="font-serif-editorial text-xl sm:text-2xl font-bold text-white">
                  性心理学与亲密健康 · 100 律真随机思辨竞技场
                </h3>
                <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
                  按 4 大核心板块与 5 大观察场景科学组织。每次开局均通过 CSPRNG 真随机洗牌并锁定防重队列，当前已探索{' '}
                  <strong className="text-amber-300 font-numeric tabular-nums">
                    {sexualStats.seenEncountersCount} / {sexualStats.totalUniqueEncounters}
                  </strong>{' '}
                  张题卡（覆盖 <strong className="text-emerald-300 font-numeric tabular-nums">{sexualStats.uniqueConceptsExplored}</strong> / {sexualStats.totalConcepts} 律）。
                </p>

                {/* CSPRNG Exploration Bar */}
                <div className="pt-1 space-y-1 max-w-md">
                  <div className="flex items-center justify-between text-[11px] font-mono text-stone-300 tabular-nums">
                    <span>CSPRNG 题库破译进度</span>
                    <span>{deckProgressPct}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-purple-400 via-fuchsia-400 to-amber-300 transition-all duration-500"
                      style={{ width: `${Math.max(deckProgressPct, sexualStats.seenEncountersCount > 0 ? 4 : 0)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    gameAudio.playSuccess();
                    navigate(`/game/sexual-aleatoric-arena?difficulty=${encodeURIComponent(arenaDifficulty)}`);
                  }}
                  className="px-5 py-3 rounded-xl bg-purple-700 hover:bg-purple-600 text-white font-bold text-xs sm:text-sm shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95 whitespace-nowrap shrink-0 transition-colors"
                >
                  <Shuffle className="w-4 h-4" />
                  <span>开启性心理真随机思辨</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      gameAudio.playTap();
                      navigate('/learn?mode=sexual');
                    }}
                    className="flex-1 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-purple-100 text-[11px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <BookOpen className="w-3 h-3" />
                    <span>定律库分类研读</span>
                  </button>

                  {sexualStats.seenEncountersCount > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        gameAudio.playTap();
                        resetSexualAleatoricDeck();
                        setSexualStats(getSexualAleatoricStats());
                      }}
                      className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-stone-200 text-[11px] font-semibold flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
                      title="重置性心理防重洗牌盒"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>重置洗牌</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 4-Pillar Structured Matrix Box inside Arena */}
            <div className="pt-3 border-t border-white/10 space-y-3">
              <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-purple-200">
                <span className="font-bold">4 大主题板块分栏直选 · 支持「竞技场实战」与「定律库研读」双向直连</span>
                <span className="text-stone-400 hidden sm:inline">4 Pillars × 25/20/30 律</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {SEXUAL_PILLARS.map((pillar, idx) => {
                  const pillarMastered = SEXUAL_PSYCHOLOGY_LAWS.filter(
                    (l) => l.sexualPillar === pillar.id && (masteryMap[l.id] || 0) >= 80
                  ).length;
                  const pillarPct = Math.round((pillarMastered / Math.max(1, pillar.count)) * 100);
                  const subCats = SEXUAL_CATEGORIES.filter((c) => c.pillarId === pillar.id);

                  return (
                    <div
                      key={pillar.id}
                      className="rounded-2xl bg-white/[0.06] border border-white/12 p-4 flex flex-col justify-between gap-3 hover:border-purple-300/45 transition-colors"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-purple-200 tabular-nums">
                          <span>0{idx + 1} · {pillar.count} 律</span>
                          <span className="text-emerald-300">精熟 {pillarMastered}/{pillar.count}</span>
                        </div>
                        <h4 className="font-serif-editorial text-sm font-bold text-white leading-snug">
                          {pillar.label}
                        </h4>
                        <p className="text-[11px] text-stone-300 leading-relaxed line-clamp-2">
                          {pillar.description}
                        </p>
                      </div>

                      <div className="space-y-2.5">
                        <div className="flex flex-wrap gap-1">
                          {subCats.map((cat) => (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => {
                                gameAudio.playTap();
                                navigate(
                                  `/game/sexual-aleatoric-arena?pillar=${encodeURIComponent(
                                    pillar.id
                                  )}&category=${encodeURIComponent(cat.id)}&difficulty=${encodeURIComponent(
                                    arenaDifficulty
                                  )}`
                                );
                              }}
                              className="text-[10px] px-2 py-0.5 rounded-md bg-black/25 hover:bg-purple-600/60 border border-white/10 text-stone-200 cursor-pointer whitespace-nowrap shrink-0 transition-colors"
                            >
                              {cat.label} · {cat.count}
                            </button>
                          ))}
                        </div>

                        <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.max(pillarPct, pillarMastered > 0 ? 6 : 0)}%`,
                              backgroundColor: pillar.color,
                            }}
                          />
                        </div>

                        <div className="flex items-center gap-1.5 pt-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              gameAudio.playSuccess();
                              navigate(
                                `/game/sexual-aleatoric-arena?pillar=${encodeURIComponent(
                                  pillar.id
                                )}&difficulty=${encodeURIComponent(arenaDifficulty)}`
                              );
                            }}
                            className="flex-1 px-2.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap shrink-0 transition-colors"
                          >
                            <span>练习此板块</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              gameAudio.playTap();
                              navigate(`/learn?mode=sexual&pillar=${encodeURIComponent(pillar.id)}`);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-purple-100 text-[11px] font-semibold cursor-pointer whitespace-nowrap shrink-0 transition-colors"
                          >
                            研读
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Fast 5 Contexts & 12 Fine Categories Launchers */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pt-2 border-t border-white/10">
                <div className="space-y-2">
                  <span className="text-[11px] font-mono text-amber-300 font-bold block">
                    按 5 大观察与应用场景直达练习：
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {SEXUAL_CONTEXTS.map((ctx) => (
                      <button
                        key={ctx.id}
                        type="button"
                        onClick={() => {
                          gameAudio.playTap();
                          navigate(
                            `/game/sexual-aleatoric-arena?context=${encodeURIComponent(
                              ctx.id
                            )}&difficulty=${encodeURIComponent(arenaDifficulty)}`
                          );
                        }}
                        className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0"
                      >
                        <span>{ctx.label}</span>
                        <span className="text-[10px] font-mono text-amber-300 tabular-nums">{ctx.count}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[11px] font-mono text-stone-300 font-bold block">
                    按 12 大细分知识专题快速切入：
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {SEXUAL_CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          gameAudio.playTap();
                          navigate(
                            `/game/sexual-aleatoric-arena?category=${encodeURIComponent(
                              cat.id
                            )}&difficulty=${encodeURIComponent(arenaDifficulty)}`
                          );
                        }}
                        className="px-2.5 py-1 rounded-lg bg-black/25 hover:bg-white/15 border border-white/12 text-[11px] font-medium text-stone-200 hover:text-white cursor-pointer transition-colors whitespace-nowrap shrink-0"
                      >
                        {cat.label} ({cat.count})
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        );
      })()}

      {/* Featured Love 100 Psychology CSPRNG Arena & 4-Pillar Structured Matrix */}
      {(() => {
        const masteryMap = user.lawMasteryMap || {};
        const love100MasteredCount = LOVE100_PSYCHOLOGY_LAWS.filter(
          (l) => (masteryMap[l.id] || 0) >= 80
        ).length;
        const deckProgressPct = Math.round(
          (love100Stats.seenEncountersCount / Math.max(1, love100Stats.totalUniqueEncounters)) * 100
        );

        return (
          <section className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#2B0C1C] via-[#261129] to-[#111827] text-white p-5 sm:p-7 border border-rose-400/35 shadow-xl space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="space-y-2 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
                  <span className="inline-flex items-center gap-1.5 text-rose-300 font-bold">
                    <Heart className="w-3.5 h-3.5 fill-rose-400" />
                    <span>LOVE PSYCHOLOGY 100 · CSPRNG DECK</span>
                  </span>
                  <span className="text-stone-500" aria-hidden="true">/</span>
                  <span className="text-amber-300 font-bold tabular-nums">
                    {love100Stats.totalConcepts} 词条 × 5 视角 = {love100Stats.totalUniqueEncounters} 张防重题卡
                  </span>
                  <span className="text-stone-500" aria-hidden="true">·</span>
                  <span className="text-emerald-300 font-bold tabular-nums">
                    已精熟 {love100MasteredCount} / {LOVE100_PSYCHOLOGY_LAWS.length} 卡
                  </span>
                </div>
                <h3 className="font-serif-editorial text-xl sm:text-2xl font-bold text-white">
                  恋爱心理学与亲密关系 · 100 律真随机博弈竞技场
                </h3>
                <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
                  按 4 大核心关系板块 × 7 大知识类别 × 5 大相处情境组织。每次开局均经 CSPRNG 真随机洗牌并锁定防重队列，当前已破译{' '}
                  <strong className="text-amber-300 font-numeric tabular-nums">
                    {love100Stats.seenEncountersCount} / {love100Stats.totalUniqueEncounters}
                  </strong>{' '}
                  张题卡（覆盖 <strong className="text-emerald-300 font-numeric tabular-nums">{love100Stats.uniqueConceptsExplored}</strong> / {love100Stats.totalConcepts} 卡）。
                </p>

                <div className="pt-1 space-y-1 max-w-md">
                  <div className="flex items-center justify-between text-[11px] font-mono text-stone-300 tabular-nums">
                    <span>CSPRNG 题库破译进度</span>
                    <span>{deckProgressPct}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-rose-400 via-pink-400 to-amber-300 transition-all duration-500"
                      style={{ width: `${Math.max(deckProgressPct, love100Stats.seenEncountersCount > 0 ? 4 : 0)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    gameAudio.playSuccess();
                    navigate(`/game/love100-aleatoric-arena?difficulty=${encodeURIComponent(arenaDifficulty)}`);
                  }}
                  className="px-5 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95 whitespace-nowrap shrink-0 transition-colors"
                >
                  <Shuffle className="w-4 h-4" />
                  <span>开启恋爱 100 律真随机博弈</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      gameAudio.playTap();
                      navigate('/learn?mode=love100');
                    }}
                    className="flex-1 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-rose-100 text-[11px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <BookOpen className="w-3 h-3" />
                    <span>定律库分类研读</span>
                  </button>

                  {love100Stats.seenEncountersCount > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        gameAudio.playTap();
                        resetLove100AleatoricDeck();
                        setLove100Stats(getLove100AleatoricStats());
                      }}
                      className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-stone-200 text-[11px] font-semibold flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
                      title="重置恋爱心理 100 律防重洗牌盒"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>重置洗牌</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 4-Pillar Structured Matrix Box inside Arena */}
            <div className="pt-3 border-t border-white/10 space-y-3">
              <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-rose-200">
                <span className="font-bold">4 大亲密关系板块分栏直选 · 支持「竞技场实战」与「定律库研读」双向直连</span>
                <span className="text-stone-400 hidden sm:inline">4 Pillars × 15/30/25/30 卡</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {LOVE100_PILLARS.map((pillar, idx) => {
                  const pillarMastered = LOVE100_PSYCHOLOGY_LAWS.filter(
                    (l) => l.love100Pillar === pillar.id && (masteryMap[l.id] || 0) >= 80
                  ).length;
                  const pillarPct = Math.round((pillarMastered / Math.max(1, pillar.count)) * 100);
                  const subCats = LOVE100_CATEGORIES.filter((c) => c.pillarId === pillar.id);

                  return (
                    <div
                      key={pillar.id}
                      className="rounded-2xl bg-white/[0.06] border border-white/12 p-4 flex flex-col justify-between gap-3 hover:border-rose-300/45 transition-colors"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-rose-200 tabular-nums">
                          <span>0{idx + 1} · {pillar.count} 卡</span>
                          <span className="text-emerald-300">精熟 {pillarMastered}/{pillar.count}</span>
                        </div>
                        <h4 className="font-serif-editorial text-sm font-bold text-white leading-snug">
                          {pillar.label}
                        </h4>
                        <p className="text-[11px] text-stone-300 leading-relaxed line-clamp-2">
                          {pillar.description}
                        </p>
                      </div>

                      <div className="space-y-2.5">
                        <div className="flex flex-wrap gap-1">
                          {subCats.map((cat) => (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => {
                                gameAudio.playTap();
                                navigate(
                                  `/game/love100-aleatoric-arena?pillar=${encodeURIComponent(
                                    pillar.id
                                  )}&category=${encodeURIComponent(cat.id)}&difficulty=${encodeURIComponent(
                                    arenaDifficulty
                                  )}`
                                );
                              }}
                              className="text-[10px] px-2 py-0.5 rounded-md bg-black/25 hover:bg-rose-600/60 border border-white/10 text-stone-200 cursor-pointer whitespace-nowrap shrink-0 transition-colors"
                            >
                              {cat.label} · {cat.count}
                            </button>
                          ))}
                        </div>

                        <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.max(pillarPct, pillarMastered > 0 ? 6 : 0)}%`,
                              backgroundColor: pillar.color,
                            }}
                          />
                        </div>

                        <div className="flex items-center gap-1.5 pt-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              gameAudio.playSuccess();
                              navigate(
                                `/game/love100-aleatoric-arena?pillar=${encodeURIComponent(
                                  pillar.id
                                )}&difficulty=${encodeURIComponent(arenaDifficulty)}`
                              );
                            }}
                            className="flex-1 px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap shrink-0 transition-colors"
                          >
                            <span>练习此板块</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              gameAudio.playTap();
                              navigate(`/learn?mode=love100&pillar=${encodeURIComponent(pillar.id)}`);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-rose-100 text-[11px] font-semibold cursor-pointer whitespace-nowrap shrink-0 transition-colors"
                          >
                            研读
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Fast 5 Contexts & 7 Knowledge Categories Launchers */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pt-2 border-t border-white/10">
                <div className="space-y-2">
                  <span className="text-[11px] font-mono text-amber-300 font-bold block">
                    按 5 大亲密相处情境直达练习：
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {LOVE100_CONTEXTS.map((ctx) => (
                      <button
                        key={ctx.id}
                        type="button"
                        onClick={() => {
                          gameAudio.playTap();
                          navigate(
                            `/game/love100-aleatoric-arena?context=${encodeURIComponent(
                              ctx.id
                            )}&difficulty=${encodeURIComponent(arenaDifficulty)}`
                          );
                        }}
                        className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0"
                      >
                        <span>{ctx.label}</span>
                        <span className="text-[10px] font-mono text-amber-300 tabular-nums">{ctx.count}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[11px] font-mono text-stone-300 font-bold block">
                    按 7 大知识类别快速切入：
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {LOVE100_CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          gameAudio.playTap();
                          navigate(
                            `/game/love100-aleatoric-arena?category=${encodeURIComponent(
                              cat.id
                            )}&difficulty=${encodeURIComponent(arenaDifficulty)}`
                          );
                        }}
                        className="px-2.5 py-1 rounded-lg bg-black/25 hover:bg-white/15 border border-white/12 text-[11px] font-medium text-stone-200 hover:text-white cursor-pointer transition-colors whitespace-nowrap shrink-0"
                      >
                        {cat.label} ({cat.count})
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        );
      })()}

      {/* Featured Intimate Relationships 100 CSPRNG Arena & 4-Pillar Structured Matrix */}
      {(() => {
        const masteryMap = user.lawMasteryMap || {};
        const intimateMasteredCount = INTIMATE_RELATIONSHIPS_LAWS.filter(
          (l) => (masteryMap[l.id] || 0) >= 80
        ).length;
        const deckProgressPct = Math.round(
          (intimateStats.seenEncountersCount / Math.max(1, intimateStats.totalUniqueEncounters)) * 100
        );

        return (
          <section className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#2B0C18] via-[#22162E] to-[#111827] text-white p-5 sm:p-7 border border-rose-400/35 shadow-xl space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="space-y-2 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
                  <span className="inline-flex items-center gap-1.5 text-rose-300 font-bold">
                    <HeartHandshake className="w-3.5 h-3.5" />
                    <span>INTIMATE RELATIONSHIPS 100 · CSPRNG DECK</span>
                  </span>
                  <span className="text-stone-500" aria-hidden="true">/</span>
                  <span className="text-amber-300 font-bold tabular-nums">
                    {intimateStats.totalConcepts} 词条 × 5 视角 = {intimateStats.totalUniqueEncounters} 张防重题卡
                  </span>
                  <span className="text-stone-500" aria-hidden="true">·</span>
                  <span className="text-emerald-300 font-bold tabular-nums">
                    已精熟 {intimateMasteredCount} / {INTIMATE_RELATIONSHIPS_LAWS.length} 卡
                  </span>
                </div>
                <h3 className="font-serif-editorial text-xl sm:text-2xl font-bold text-white">
                  亲密关系心理学 · 100 律安全联结与修复竞技场
                </h3>
                <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
                  按 4 大核心亲密关系板块 × 5 大知识类别 × 5 大相处情境组织。每次开局均经 CSPRNG 真随机洗牌并锁定防重队列，当前已破译{' '}
                  <strong className="text-amber-300 font-numeric tabular-nums">
                    {intimateStats.seenEncountersCount} / {intimateStats.totalUniqueEncounters}
                  </strong>{' '}
                  张题卡（覆盖 <strong className="text-emerald-300 font-numeric tabular-nums">{intimateStats.uniqueConceptsExplored}</strong> / {intimateStats.totalConcepts} 卡）。
                </p>

                <div className="pt-1 space-y-1 max-w-md">
                  <div className="flex items-center justify-between text-[11px] font-mono text-stone-300 tabular-nums">
                    <span>CSPRNG 题库破译进度</span>
                    <span>{deckProgressPct}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-400 transition-all duration-500"
                      style={{ width: `${Math.max(deckProgressPct, intimateStats.seenEncountersCount > 0 ? 4 : 0)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    gameAudio.playSuccess();
                    navigate(`/game/intimate-aleatoric-arena?difficulty=${encodeURIComponent(arenaDifficulty)}`);
                  }}
                  className="px-5 py-3 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-bold text-xs sm:text-sm shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95 whitespace-nowrap shrink-0 transition-colors"
                >
                  <Shuffle className="w-4 h-4" />
                  <span>开启亲密关系 100 律对战</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      gameAudio.playTap();
                      navigate('/learn?mode=intimate');
                    }}
                    className="flex-1 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-rose-100 text-[11px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <BookOpen className="w-3 h-3" />
                    <span>定律库分类研读</span>
                  </button>

                  {intimateStats.seenEncountersCount > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        gameAudio.playTap();
                        resetIntimateAleatoricDeck();
                        setIntimateStats(getIntimateAleatoricStats());
                      }}
                      className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-stone-200 text-[11px] font-semibold flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
                      title="重置亲密关系 100 律防重洗牌盒"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>重置洗牌</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 4-Pillar Structured Matrix Box inside Arena */}
            <div className="pt-3 border-t border-white/10 space-y-3">
              <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-rose-200">
                <span className="font-bold">4 大亲密关系板块分栏直选 · 支持「竞技场实战」与「定律库研读」双向直连</span>
                <span className="text-stone-400 hidden sm:inline">4 Pillars × 20/20/20/40 卡</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {INTIMATE_PILLARS.map((pillar, idx) => {
                  const pillarMastered = INTIMATE_RELATIONSHIPS_LAWS.filter(
                    (l) => l.intimatePillar === pillar.id && (masteryMap[l.id] || 0) >= 80
                  ).length;
                  const pillarPct = Math.round((pillarMastered / Math.max(1, pillar.count)) * 100);
                  const subCats = INTIMATE_CATEGORIES.filter((c) => c.pillarId === pillar.id);

                  return (
                    <div
                      key={pillar.id}
                      className="rounded-2xl bg-white/[0.06] border border-white/12 p-4 flex flex-col justify-between gap-3 hover:border-rose-300/45 transition-colors"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-rose-200 tabular-nums">
                          <span>0{idx + 1} · {pillar.count} 卡</span>
                          <span className="text-emerald-300">精熟 {pillarMastered}/{pillar.count}</span>
                        </div>
                        <h4 className="font-serif-editorial text-sm font-bold text-white leading-snug">
                          {pillar.label}
                        </h4>
                        <p className="text-[11px] text-stone-300 leading-relaxed line-clamp-2">
                          {pillar.description}
                        </p>
                      </div>

                      <div className="space-y-2.5">
                        <div className="flex flex-wrap gap-1">
                          {subCats.map((cat) => (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => {
                                gameAudio.playTap();
                                navigate(
                                  `/game/intimate-aleatoric-arena?pillar=${encodeURIComponent(
                                    pillar.id
                                  )}&category=${encodeURIComponent(cat.id)}&difficulty=${encodeURIComponent(
                                    arenaDifficulty
                                  )}`
                                );
                              }}
                              className="text-[10px] px-2 py-0.5 rounded-md bg-black/25 hover:bg-rose-600/60 border border-white/10 text-stone-200 cursor-pointer whitespace-nowrap shrink-0 transition-colors"
                            >
                              {cat.label} · {cat.count}
                            </button>
                          ))}
                        </div>

                        <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.max(pillarPct, pillarMastered > 0 ? 6 : 0)}%`,
                              backgroundColor: pillar.color,
                            }}
                          />
                        </div>

                        <div className="flex items-center gap-1.5 pt-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              gameAudio.playSuccess();
                              navigate(
                                `/game/intimate-aleatoric-arena?pillar=${encodeURIComponent(
                                  pillar.id
                                )}&difficulty=${encodeURIComponent(arenaDifficulty)}`
                              );
                            }}
                            className="flex-1 px-2.5 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-600 text-white text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap shrink-0 transition-colors"
                          >
                            <span>练习此板块</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              gameAudio.playTap();
                              navigate(`/learn?mode=intimate&pillar=${encodeURIComponent(pillar.id)}`);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-rose-100 text-[11px] font-semibold cursor-pointer whitespace-nowrap shrink-0 transition-colors"
                          >
                            研读
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Fast 5 Contexts & 5 Knowledge Categories Launchers */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pt-2 border-t border-white/10">
                <div className="space-y-2">
                  <span className="text-[11px] font-mono text-amber-300 font-bold block">
                    按 5 大亲密互动与复盘情境直达练习：
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {INTIMATE_CONTEXTS.map((ctx) => (
                      <button
                        key={ctx.id}
                        type="button"
                        onClick={() => {
                          gameAudio.playTap();
                          navigate(
                            `/game/intimate-aleatoric-arena?context=${encodeURIComponent(
                              ctx.id
                            )}&difficulty=${encodeURIComponent(arenaDifficulty)}`
                          );
                        }}
                        className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0"
                      >
                        <span>{ctx.label}</span>
                        <span className="text-[10px] font-mono text-amber-300 tabular-nums">{ctx.count}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[11px] font-mono text-stone-300 font-bold block">
                    按 5 大知识类别快速切入：
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {INTIMATE_CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          gameAudio.playTap();
                          navigate(
                            `/game/intimate-aleatoric-arena?category=${encodeURIComponent(
                              cat.id
                            )}&difficulty=${encodeURIComponent(arenaDifficulty)}`
                          );
                        }}
                        className="px-2.5 py-1 rounded-lg bg-black/25 hover:bg-white/15 border border-white/12 text-[11px] font-medium text-stone-200 hover:text-white cursor-pointer transition-colors whitespace-nowrap shrink-0"
                      >
                        {cat.label} ({cat.count})
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        );
      })()}

      {/* Arena Horizontal Accordion: Psychological Experiments Canvas */}
      <ArenaHorizontalAccordion difficulty={arenaDifficulty} />

      {/* Microexpressions ML001-ML010 Full Arena Dispatch Matrix */}
      <section className="editorial-card rounded-3xl p-5 sm:p-7 border border-indigo-200/80 bg-gradient-to-br from-[#F9F9FF] via-white to-[#F6F9FC] shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200/70 pb-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-indigo-700 font-bold">
              <Eye className="w-3.5 h-3.5 text-indigo-600" />
              <span>MIND LABS · MICROEXPRESSIONS DISPATCH</span>
              <span className="text-stone-300" aria-hidden="true">/</span>
              <span className="text-stone-600">Evidence Level A · 10 律全游戏分派</span>
            </div>
            <h2 className="font-serif-editorial text-xl sm:text-2xl font-bold text-stone-900">
              微表情与面部动作（ML001–ML010）竞技场分派矩阵
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-2xl">
              全部 10 条 FACS 动作单元与元分析定律已按「认知 / 情绪 / 社会 / 行为」分类排行，并分派至下列对应小游戏内。进入游戏即可阅读故事实案并完成随堂交互解答。
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              gameAudio.playTap();
              navigate('/learn?mode=microexpressions');
            }}
            className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-all shrink-0 cursor-pointer active:scale-95 flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>定律库看分类排行</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <CylinderScrollList className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {MICROEXPRESSION_LAWS.map((law) => {
            const mastery = user.lawMasteryMap?.[law.id] ?? 0;
            const gamesList = (law.dispatchedGames || [])
              .map((gid) => PSYCHOLOGY_GAMES.find((g) => g.id === gid))
              .filter((g): g is NonNullable<typeof g> => Boolean(g));

            return (
              <CylinderScrollItem key={law.id} radiusClass="rounded-2xl">
                <div className="rounded-2xl bg-white border border-stone-200/90 hover:border-indigo-300 p-4 space-y-2.5 transition-colors h-full">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
                        <span className="font-bold text-indigo-700">
                          {law.id.toUpperCase()}
                        </span>
                        <span className="text-stone-300" aria-hidden="true">·</span>
                        <span className="font-semibold text-stone-600">
                          {law.actionUnitCode}
                        </span>
                        <span className="text-stone-300" aria-hidden="true">·</span>
                        <span className="font-sans font-bold text-amber-800">
                          {law.categoryZh} #{law.categoryRank}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-stone-900 font-serif-editorial truncate">
                        {law.nameZh}
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={() => navigate(`/law/${law.id}`)}
                      className="text-[11px] font-numeric font-bold text-stone-600 hover:text-indigo-700 bg-stone-50 hover:bg-indigo-50 px-2 py-1 rounded-lg border border-stone-200 shrink-0 cursor-pointer transition-colors"
                      title="查看定律详细机制与完整故事场景"
                    >
                      掌握 {mastery}%
                    </button>
                  </div>

                  {law.storyScenario && (
                    <p className="text-[11px] text-stone-600 leading-relaxed line-clamp-1">
                      <span className="font-semibold text-stone-800">实案：</span>
                      {law.storyScenario.title}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {gamesList.map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => {
                          gameAudio.playTap();
                          navigate(`/game/${g.id}?difficulty=${encodeURIComponent(arenaDifficulty)}`);
                        }}
                        className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-indigo-50/70 hover:bg-indigo-600 text-indigo-800 hover:text-white border border-indigo-200/80 transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap shrink-0"
                      >
                        <span>{g.nameZh}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    ))}
                  </div>
                </div>
              </CylinderScrollItem>
            );
          })}
        </CylinderScrollList>
      </section>

      {/* Lunr.js Arena Quick Discovery Search Bar */}
      <section className="bg-white rounded-2xl p-3.5 sm:p-4 border border-stone-200/90 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={arenaSearch}
              onChange={(e) => setArenaSearch(e.target.value)}
              placeholder="Lunr 竞技场速搜：输入项目名、心理学机制或专项场景（如：锚定、同意、犯罪、第一印象）…"
              className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-stone-50 border border-stone-200/90 focus:bg-white focus:border-indigo-500 focus:outline-none text-xs sm:text-sm text-stone-900 placeholder-stone-400 transition-colors"
              aria-label="竞技场 Lunr 搜索"
            />
            {arenaSearch && (
              <button
                type="button"
                onClick={() => setArenaSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md bg-stone-200/70 hover:bg-stone-300 text-stone-600 flex items-center justify-center cursor-pointer"
                aria-label="清空竞技场搜索"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={openSearchModal}
            className="px-3.5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 transition-colors"
          >
            <Search className="w-3.5 h-3.5 text-amber-300" />
            <span>全库检索定律 + 竞技场 (⌘K)</span>
          </button>
        </div>

        {arenaSearch.trim() !== '' && subArenaMatches.length > 0 && (
          <div className="pt-2 border-t border-stone-100 space-y-2">
            <div className="text-[11px] font-mono font-semibold text-stone-500">
              直达匹配的子竞技场模式 ({subArenaMatches.length})
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {subArenaMatches.map((sub) => (
                <button
                  key={sub.docId}
                  type="button"
                  onClick={() => {
                    gameAudio.playTap();
                    const sep = sub.route.includes('?') ? '&' : '?';
                    navigate(`${sub.route}${sep}difficulty=${encodeURIComponent(arenaDifficulty)}`);
                  }}
                  className="p-2.5 rounded-xl bg-stone-50 hover:bg-indigo-50/70 border border-stone-200/80 hover:border-indigo-300 text-left flex items-center justify-between gap-2 transition-colors cursor-pointer"
                >
                  <div className="min-w-0">
                    <div className="text-[10px] font-mono font-bold text-indigo-700">
                      {sub.codeId} · {sub.category}
                    </div>
                    <div className="text-xs font-bold text-stone-900 truncate">{sub.title}</div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* 3D Cylindrical Drum Category Filter Controls */}
      <CylindricalThemeRoller
        title="竞技场分类滚筒导航 · 按训练维度速查"
        variant="arena"
        items={arenaRollerItems}
        activeId={selectedCat}
        onChange={handleSelectCat}
      />

      {/* Games Grid with 3D Cylindrical Vertical Scroll Perspective */}
      <CylinderScrollList className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-7">
        {isLoading ? (
          <>
            <GameCardSkeleton />
            <GameCardSkeleton />
            <GameCardSkeleton />
            <GameCardSkeleton />
          </>
        ) : (
          filteredGames.map((game, idx) => (
            <CylinderScrollItem key={game.id} radiusClass="rounded-3xl">
              <div
                className="animate-stageEnter h-full"
                style={{ animationDelay: `${Math.min(idx * 35, 210)}ms` }}
              >
                <GameCard game={game} difficulty={arenaDifficulty} />
              </div>
            </CylinderScrollItem>
          ))
        )}
      </CylinderScrollList>
    </div>
  );
};

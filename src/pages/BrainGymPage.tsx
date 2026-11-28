import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  Brain,
  Gamepad2,
  Grid3X3,
  Layers,
  ShieldCheck,
  Trash2,
  Zap,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { GameDifficulty } from '../types';
import { gameAudio } from '../utils/gameAudio';
import {
  BRAIN_GYM_GAMES,
  BrainGymCategory,
  BrainGymDifficulty,
  BrainGymGameId,
  BrainGymSessionInput,
  BrainGymSessionRecord,
  computeBrainGymSummary,
} from '../utils/brainGymHelpers';
import {
  deleteBrainGymSession,
  recordBrainGymSession,
  subscribeToBrainGymSessions,
} from '../services/brainGymService';
import { NBackSequenceGame } from '../components/braingym/NBackSequenceGame';
import { ChronoSpanMatrixGame } from '../components/braingym/ChronoSpanMatrixGame';
import { ReflexPulseGame } from '../components/braingym/ReflexPulseGame';
import { GoNoGoGateGame } from '../components/braingym/GoNoGoGateGame';

const GAME_ICON_MAP: Record<
  BrainGymGameId,
  React.ComponentType<{ className?: string }>
> = {
  'nback-sequence': Brain,
  'chrono-span': Grid3X3,
  'reflex-pulse': Zap,
  'go-nogo-gate': ShieldCheck,
};

const DIFFICULTY_TO_GAME_RESULT: Record<BrainGymDifficulty, GameDifficulty> = {
  standard: '中',
  intense: '高',
  master: '高级',
};

const DIFFICULTY_LABEL: Record<BrainGymDifficulty, string> = {
  standard: '标准基线',
  intense: '进阶高阶',
  master: '宗师极限',
};

function formatSessionTimestamp(raw: unknown): string {
  if (!raw) return '刚刚';
  let ms = 0;
  if (typeof raw === 'number') ms = raw;
  else if (typeof raw === 'string') ms = Date.parse(raw);
  else if (typeof raw === 'object' && raw !== null) {
    const maybe = raw as { toMillis?: () => number; seconds?: number };
    if (typeof maybe.toMillis === 'function') ms = maybe.toMillis();
    else if (typeof maybe.seconds === 'number') ms = maybe.seconds * 1000;
  }
  if (!ms || Number.isNaN(ms)) return '刚刚';
  const d = new Date(ms);
  return d.toLocaleString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const BrainGymPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, firebaseUser, recordGameResult } = useApp();

  const initialGameParam = searchParams.get('game') as BrainGymGameId | null;
  const isValidInitial = BRAIN_GYM_GAMES.some((g) => g.id === initialGameParam);

  const [activeGameId, setActiveGameId] = useState<BrainGymGameId>(
    isValidInitial && initialGameParam ? initialGameParam : 'nback-sequence'
  );
  const [difficulty, setDifficulty] = useState<BrainGymDifficulty>('standard');
  const [categoryFilter, setCategoryFilter] = useState<'all' | BrainGymCategory>('all');
  const [sessions, setSessions] = useState<BrainGymSessionRecord[]>([]);
  const [lastSavedNotice, setLastSavedNotice] = useState<string | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const unsub = subscribeToBrainGymSessions(
      firebaseUser?.uid,
      (loaded) => {
        setSessions(loaded);
      },
      (err) => {
        console.warn('Brain Gym ledger subscription warning:', err);
      }
    );
    return () => unsub();
  }, [firebaseUser?.uid]);

  useEffect(() => {
    const param = searchParams.get('game') as BrainGymGameId | null;
    if (param && BRAIN_GYM_GAMES.some((g) => g.id === param) && param !== activeGameId) {
      setActiveGameId(param);
    }
  }, [searchParams, activeGameId]);

  const summary = useMemo(() => computeBrainGymSummary(sessions), [sessions]);

  const visibleGames = useMemo(() => {
    if (categoryFilter === 'all') return BRAIN_GYM_GAMES;
    return BRAIN_GYM_GAMES.filter((g) => g.category === categoryFilter);
  }, [categoryFilter]);

  const activeGameMeta = useMemo(
    () => BRAIN_GYM_GAMES.find((g) => g.id === activeGameId) || BRAIN_GYM_GAMES[0],
    [activeGameId]
  );

  const handleSelectGame = (gameId: BrainGymGameId, scrollToStage = false) => {
    gameAudio.playTap();
    setActiveGameId(gameId);
    setSearchParams({ game: gameId }, { replace: true });
    if (scrollToStage && stageRef.current) {
      stageRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSessionComplete = async (
    payload: Omit<BrainGymSessionInput, 'id' | 'userId'>
  ) => {
    const meta = BRAIN_GYM_GAMES.find((g) => g.id === payload.gameId) || BRAIN_GYM_GAMES[0];
    try {
      const saved = await recordBrainGymSession(firebaseUser?.uid, payload);
      setSessions((prev) => [saved, ...prev.filter((item) => item.id !== saved.id)]);
      setLastSavedNotice(
        `已记录「${meta.titleZh}」得分 ${payload.score.toLocaleString()} 分，并同步至认知能力评估模型。`
      );
    } catch (err) {
      console.warn('Failed to persist Brain Gym session:', err);
    }

    recordGameResult(payload.gameId, {
      score: payload.score,
      accuracy: payload.accuracy,
      reactionTime: payload.avgReactionMs,
      xpGained: payload.xpEarned,
      comboMax: payload.maxSpan || payload.roundsCompleted,
      conceptLearned: meta.neuroscienceNote,
      difficulty: DIFFICULTY_TO_GAME_RESULT[payload.difficulty],
    });
  };

  const handleDeleteSession = async (sessionId: string) => {
    gameAudio.playTap();
    setSessions((prev) => prev.filter((item) => item.id !== sessionId));
    try {
      await deleteBrainGymSession(firebaseUser?.uid, sessionId);
    } catch (err) {
      console.warn('Failed to delete Brain Gym session:', err);
    }
  };

  return (
    <div className="space-y-8 pb-16 animate-fadeIn max-w-5xl mx-auto">
      {/* 1. Editorial Header & Assessment Link */}
      <section className="editorial-card rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-[#FAF8F5] via-[#F6F3ED] to-[#EFEAE1] border border-stone-200/90 space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-5 border-b border-stone-300/70 pb-5">
          <div className="space-y-2 max-w-2xl">
            <div className="text-xs font-mono text-[#8E5B13] font-semibold tracking-wider uppercase">
              Brain Gym · Working Memory & Psychomotor Speed
            </div>
            <h1 className="font-serif-editorial text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
              Brain Gym · 记忆与神经反应训练馆
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              四项标准化神经认知训练模块：结合空间 N-Back、顺逆序记忆广度、毫秒神经反应与 Go/No-Go 抑制控制门，所有成绩直接沉淀至个人档案并实时刷新六维认知雷达。
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                gameAudio.playTap();
                navigate('/assessment');
              }}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Brain className="w-3.5 h-3.5 text-[#EDD08B]" aria-hidden="true" />
              <span>查看认知雷达评估</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => {
                gameAudio.playTap();
                navigate('/games');
              }}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-white hover:bg-stone-50 text-stone-800 border border-stone-300 text-xs font-semibold transition-colors inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Gamepad2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>全部心理实验场</span>
            </button>
          </div>
        </div>

        {/* 4-Metric Personal Calibration Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 font-numeric tabular-nums">
          <div className="p-4 rounded-2xl bg-white/90 border border-stone-200/90">
            <span className="text-[11px] text-stone-500 block">最佳神经反应峰值</span>
            <div className="text-2xl font-extrabold text-stone-900 font-serif-editorial mt-1">
              {summary.bestReflexMs !== null ? `${summary.bestReflexMs} ms` : '—'}
            </div>
            <span className="text-[11px] text-stone-500">单次最低传导潜伏期</span>
          </div>

          <div className="p-4 rounded-2xl bg-white/90 border border-stone-200/90">
            <span className="text-[11px] text-stone-500 block">最高记忆广度 / 阶数</span>
            <div className="text-2xl font-extrabold text-stone-900 font-serif-editorial mt-1">
              {summary.peakSpan > 0 ? `${summary.peakSpan} 节点` : '—'}
            </div>
            <span className="text-[11px] text-stone-500">工作记忆单次容量峰值</span>
          </div>

          <div className="p-4 rounded-2xl bg-white/90 border border-stone-200/90">
            <span className="text-[11px] text-stone-500 block">累计完成训练</span>
            <div className="text-2xl font-extrabold text-stone-900 font-serif-editorial mt-1">
              {summary.totalSessions} 轮
            </div>
            <span className="text-[11px] text-stone-500">
              记忆 {summary.memorySessions} · 反应 {summary.reactionSessions}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white/90 border border-stone-200/90">
            <span className="text-[11px] text-stone-500 block">平均精准度</span>
            <div className="text-2xl font-extrabold text-emerald-700 font-serif-editorial mt-1">
              {summary.totalSessions > 0 ? `${summary.averageAccuracy}%` : '—'}
            </div>
            <span className="text-[11px] text-stone-500">
              记忆 {user.stats?.memory ?? 80} · 专注 {user.stats?.attention ?? 80}
            </span>
          </div>
        </div>
      </section>

      {/* 2. Training Module Directory */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-serif-editorial text-xl font-bold text-stone-900">
              选择训练项目
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              切换任意模块立即进入实操校准面板
            </p>
          </div>

          <div
            role="tablist"
            aria-label="训练类别筛选"
            className="inline-flex items-center p-1 rounded-xl bg-stone-200/75 border border-stone-300/70 gap-1"
          >
            {(
              [
                { id: 'all', label: '全部模块' },
                { id: 'memory', label: '记忆强化' },
                { id: 'reaction', label: '反应速度' },
              ] as const
            ).map((tab) => {
              const selected = categoryFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => {
                    gameAudio.playTap();
                    setCategoryFilter(tab.id);
                  }}
                  className={`min-h-[36px] px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    selected
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {visibleGames.map((game) => {
            const Icon = GAME_ICON_MAP[game.id];
            const isActive = activeGameId === game.id;
            const highScore = Math.max(
              summary.highestScoreByGame[game.id] ?? 0,
              user.gameHighScores?.[game.id] ?? 0
            );
            return (
              <button
                key={game.id}
                type="button"
                onClick={() => handleSelectGame(game.id, true)}
                aria-pressed={isActive}
                className={`p-5 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                  isActive
                    ? 'bg-[#141821] text-white border-[#D4A656] shadow-md'
                    : 'bg-white text-stone-900 border-stone-200 hover:border-stone-400'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div
                      className={`text-[11px] font-mono ${
                        isActive ? 'text-[#EDD08B]' : 'text-[#8E5B13]'
                      }`}
                    >
                      {game.categoryLabelZh} · {game.durationLabel}
                    </div>
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isActive
                          ? 'bg-[#D4A656] text-[#181411]'
                          : 'bg-stone-100 text-stone-800'
                      }`}
                    >
                      <Icon className="w-4 h-4" aria-hidden="true" />
                    </div>
                  </div>

                  <h3 className="font-serif-editorial text-lg font-bold leading-snug">
                    {game.titleZh}
                  </h3>
                  <p
                    className={`text-xs leading-relaxed ${
                      isActive ? 'text-stone-300' : 'text-stone-600'
                    }`}
                  >
                    {game.description}
                  </p>
                </div>

                <div
                  className={`pt-3 border-t flex items-center justify-between text-xs font-numeric tabular-nums ${
                    isActive
                      ? 'border-white/10 text-stone-300'
                      : 'border-stone-100 text-stone-500'
                  }`}
                >
                  <span>
                    最高分{' '}
                    <strong className={isActive ? 'text-[#EDD08B]' : 'text-stone-900'}>
                      {highScore > 0 ? highScore.toLocaleString() : '尚未挑战'}
                    </strong>
                  </span>
                  <span className="font-semibold">
                    {isActive ? '正在当前舞台激活' : '点击切换训练 →'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. Active Interactive Training Stage */}
      <section ref={stageRef} className="space-y-3 scroll-mt-24">
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2 text-xs text-stone-600">
            <Layers className="w-4 h-4 text-[#8E5B13]" aria-hidden="true" />
            <span className="font-semibold text-stone-900">{activeGameMeta.titleZh}</span>
            <span aria-hidden="true">·</span>
            <span>映射能力：{activeGameMeta.assessmentDomains.join(' / ')}</span>
          </div>
          <span className="text-xs font-mono text-stone-500">{activeGameMeta.metricLabel}</span>
        </div>

        {lastSavedNotice && (
          <div
            role="status"
            className="px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex flex-wrap items-center justify-between gap-2"
          >
            <span>{lastSavedNotice}</span>
            <button
              type="button"
              onClick={() => navigate('/assessment')}
              className="font-bold text-emerald-800 underline underline-offset-2 cursor-pointer whitespace-nowrap shrink-0"
            >
              前往雷达图谱查看变化
            </button>
          </div>
        )}

        {activeGameId === 'nback-sequence' && (
          <NBackSequenceGame
            difficulty={difficulty}
            onChangeDifficulty={setDifficulty}
            onSessionComplete={handleSessionComplete}
          />
        )}
        {activeGameId === 'chrono-span' && (
          <ChronoSpanMatrixGame
            difficulty={difficulty}
            onChangeDifficulty={setDifficulty}
            onSessionComplete={handleSessionComplete}
          />
        )}
        {activeGameId === 'reflex-pulse' && (
          <ReflexPulseGame
            difficulty={difficulty}
            onChangeDifficulty={setDifficulty}
            onSessionComplete={handleSessionComplete}
          />
        )}
        {activeGameId === 'go-nogo-gate' && (
          <GoNoGoGateGame
            difficulty={difficulty}
            onChangeDifficulty={setDifficulty}
            onSessionComplete={handleSessionComplete}
          />
        )}

        <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-stone-200/90 text-xs text-stone-600 flex items-start gap-2.5">
          <Activity className="w-4 h-4 text-[#8E5B13] shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <strong className="text-stone-900">神经科学机制：</strong>
            <span>{activeGameMeta.neuroscienceNote}</span>
          </div>
        </div>
      </section>

      {/* 4. Persisted Session Ledger */}
      <section className="editorial-card rounded-3xl p-6 sm:p-7 bg-white border border-stone-200 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200/80 pb-3.5">
          <div>
            <h2 className="font-serif-editorial text-lg font-bold text-stone-900">
              训练历史校准档案
            </h2>
            <p className="text-xs text-stone-500">
              每次完赛都会自动写入本地与云端记录，用于长期追踪神经反应时与工作记忆曲线
            </p>
          </div>
          <span className="text-xs font-mono text-stone-500 tabular-nums">
            共 {sessions.length} 条记录
          </span>
        </div>

        {sessions.length === 0 ? (
          <div className="py-10 text-center text-xs text-stone-500 space-y-2">
            <p>尚无 Brain Gym 训练记录。完成上方任意一轮记忆或反应测试，即可生成首条神经基线档案。</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {sessions.slice(0, 20).map((s) => (
              <div
                key={s.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-bold text-stone-900">{s.gameTitle}</span>
                    <span className="text-stone-400" aria-hidden="true">·</span>
                    <span className="text-stone-600">{DIFFICULTY_LABEL[s.difficulty]}</span>
                    <span className="text-stone-400" aria-hidden="true">·</span>
                    <span className="text-stone-500 font-mono">
                      {formatSessionTimestamp(s.createdAt)}
                    </span>
                  </div>
                  <div className="text-xs text-stone-500 font-numeric tabular-nums flex flex-wrap items-center gap-3">
                    <span>
                      得分 <strong className="text-stone-800">{s.score.toLocaleString()}</strong>
                    </span>
                    <span>
                      准确率 <strong className="text-emerald-700">{s.accuracy}%</strong>
                    </span>
                    {s.avgReactionMs > 0 && (
                      <span>
                        平均反应 <strong className="text-stone-800">{s.avgReactionMs} ms</strong>
                      </span>
                    )}
                    {s.maxSpan > 0 && (
                      <span>
                        记忆广度 <strong className="text-stone-800">{s.maxSpan}</strong>
                      </span>
                    )}
                    <span className="text-[#8E5B13]">+{s.xpEarned} XP</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteSession(s.id)}
                  className="min-h-[36px] px-3 py-1.5 rounded-lg text-xs text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors inline-flex items-center gap-1 self-start sm:self-center cursor-pointer whitespace-nowrap shrink-0"
                  aria-label={`删除 ${s.gameTitle} 训练记录`}
                >
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>移除</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

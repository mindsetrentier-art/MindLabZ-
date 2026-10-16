import React, { useEffect, useRef } from 'react';
import { Award, RotateCcw, CheckCircle2, Sparkles, BookOpen, ArrowRight, Zap, Trophy, ShieldCheck } from 'lucide-react';
import { GameDifficulty, DIFFICULTY_CONFIGS } from '../../data/difficulty';
import { gameAudio } from '../../utils/gameAudio';

export interface DebriefData {
  gameId: string;
  gameTitle: string;
  numberPrefix?: string;
  difficulty: GameDifficulty;
  score: number;
  accuracy: number;
  isFirstTime: boolean;
  xpEarned: number;
  bestAnswerReview: string;
  psychologicalMechanism: string;
  actionableSummary: string[];
}

interface GameDebriefModalProps {
  data: DebriefData;
  onRestart: () => void;
  onReturn: () => void;
}

export const GameDebriefModal: React.FC<GameDebriefModalProps> = ({
  data,
  onRestart,
  onReturn,
}) => {
  const diffConfig = DIFFICULTY_CONFIGS[data.difficulty];
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Play victory sound on mount
  useEffect(() => {
    gameAudio.playVictory();

    // Canvas celebration confetti
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.parentElement?.clientWidth || 400;
    canvas.height = 200;

    const colors = [diffConfig.accentHex, '#F59E0B', '#10B981', '#6366F1', '#EC4899', '#3B82F6'];
    const particles = Array.from({ length: 45 }).map(() => ({
      x: canvas.width / 2,
      y: canvas.height / 2,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.7) * 7,
      size: Math.random() * 5 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1,
      rotation: Math.random() * 360,
      vRot: (Math.random() - 0.5) * 10,
    }));

    let animId: number;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15; // gravity
        p.alpha -= 0.012;
        p.rotation += p.vRot;

        if (p.alpha > 0) {
          ctx.save();
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7);
          ctx.restore();
        }
      });

      if (particles.some((p) => p.alpha > 0)) {
        animId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [diffConfig.accentHex]);

  // Calculate dynamic rank
  const rank = data.accuracy >= 95 ? 'SSS' : data.accuracy >= 85 ? 'S' : data.accuracy >= 70 ? 'A' : 'B';
  const rankGradient =
    rank === 'SSS'
      ? 'from-amber-400 via-orange-500 to-yellow-300'
      : rank === 'S'
      ? 'from-violet-500 via-purple-600 to-indigo-500'
      : 'from-blue-500 to-cyan-500';

  const handleRestartClick = () => {
    gameAudio.playTap();
    onRestart();
  };

  const handleReturnClick = () => {
    gameAudio.playSuccess();
    onReturn();
  };

  return (
    <div className="w-full bg-white rounded-3xl p-5 sm:p-8 border border-stone-200/90 shadow-2xl text-center space-y-6 animate-fadeIn max-w-xl mx-auto relative overflow-hidden">
      {/* Background celebration canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-x-0 top-0 h-48 w-full pointer-events-none z-10"
      />

      {/* Ambient Radial Spotlight */}
      <div
        className="absolute -top-28 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl opacity-25 pointer-events-none"
        style={{ backgroundColor: diffConfig.accentHex }}
      />

      {/* Top Banner Tag */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-numeric font-bold bg-stone-100 text-stone-800 border border-stone-200 shadow-xs relative z-20">
        {data.numberPrefix && (
          <span
            className="text-white px-2 py-0.5 rounded-md text-[11px] font-black"
            style={{ backgroundColor: diffConfig.accentHex }}
          >
            #{data.numberPrefix}
          </span>
        )}
        <span>{data.gameTitle}</span>
        <span className="text-stone-300">·</span>
        <span className={diffConfig.colorClass}>{data.difficulty}难度</span>
        <span className="text-stone-300">·</span>
        <span className="text-amber-600 font-extrabold">{diffConfig.multiplierText} 加成</span>
      </div>

      {/* Holographic Victory Trophy Stage */}
      <div className="relative w-32 h-32 mx-auto flex items-center justify-center relative z-20">
        {/* Rotating Geometric Sunburst Ring */}
        <svg className="w-full h-full animate-spin-slow" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="47"
            fill="none"
            stroke={diffConfig.accentHex}
            strokeWidth="2"
            strokeDasharray="4 6"
            opacity="0.5"
          />
          <polygon
            points="50,6 94,80 6,80"
            fill="none"
            stroke={diffConfig.accentHex}
            strokeWidth="1.5"
            opacity="0.3"
            transform="rotate(45 50 50)"
          />
          <polygon
            points="50,6 94,80 6,80"
            fill="none"
            stroke="#F59E0B"
            strokeWidth="1.5"
            opacity="0.3"
            transform="rotate(105 50 50)"
          />
        </svg>

        {/* Center Glowing Rank Shield */}
        <div
          className="absolute inset-0 m-auto w-20 h-20 rounded-2xl flex flex-col items-center justify-center shadow-xl transform hover:scale-105 transition-transform"
          style={{
            background: `linear-gradient(135deg, ${diffConfig.accentHex} 0%, #1e1b4b 100%)`,
            border: '2px solid rgba(255,255,255,0.4)',
          }}
        >
          <Award className="w-8 h-8 text-yellow-300 drop-shadow-md" />
          <span className={`text-[11px] font-black tracking-wider text-white bg-clip-text`}>
            RANK {rank}
          </span>
        </div>
      </div>

      {/* Heading */}
      <div className="space-y-1 relative z-20">
        <h2 className="font-serif-editorial text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
          挑战通关 · 实验研报
        </h2>
        <p className="text-xs text-stone-500">
          心智模型已在实战博弈中完成检验，通关成就已永久沉淀
        </p>
      </div>

      {/* Score, Accuracy & XP Ticker Grid */}
      <div className="bg-gradient-to-br from-stone-50 to-stone-100/80 rounded-2xl p-4 border border-stone-200/90 grid grid-cols-3 gap-2.5 font-numeric text-left shadow-sm relative z-20">
        <div className="p-3 bg-white rounded-xl border border-stone-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] text-stone-500 font-semibold block">战绩积分</span>
          <span className="text-lg sm:text-2xl font-black text-stone-900 font-numeric">
            {data.score.toLocaleString()}
          </span>
        </div>

        <div className="p-3 bg-white rounded-xl border border-stone-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] text-stone-500 font-semibold block">洞察准确率</span>
          <span className="text-lg sm:text-2xl font-black text-emerald-600 font-numeric">
            {data.accuracy}%
          </span>
        </div>

        <div className="p-3 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between text-[10px] text-indigo-700 font-bold">
            <span>{data.isFirstTime ? '🌟 首胜奖励' : '🔄 复盘强化'}</span>
          </div>
          <span className="text-lg sm:text-2xl font-black text-indigo-700 flex items-center gap-1">
            <Zap className="w-4 h-4 fill-indigo-600 shrink-0" />
            +{data.xpEarned} XP
          </span>
        </div>
      </div>

      {/* 1. Best Practice Strategy */}
      <div className="bg-gradient-to-r from-amber-50/70 to-orange-50/50 p-4 sm:p-4.5 rounded-2xl border border-amber-200/80 text-left space-y-1.5 shadow-xs relative z-20">
        <div className="flex items-center gap-2 text-xs font-bold text-amber-900 font-serif-editorial">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>最佳策略与答案复盘（Best Strategy）</span>
        </div>
        <p className="text-xs text-stone-700 leading-relaxed font-sans">
          {data.bestAnswerReview}
        </p>
      </div>

      {/* 2. Psychological Mechanism */}
      <div className="bg-gradient-to-r from-indigo-50/80 to-purple-50/60 p-4 sm:p-4.5 rounded-2xl border border-indigo-200 text-left space-y-1.5 shadow-xs relative z-20">
        <div className="flex items-center gap-2 text-xs font-bold text-indigo-950 font-serif-editorial">
          <BookOpen className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>心理学底层原理解析（Mechanism & Theory）</span>
        </div>
        <p className="text-xs text-stone-700 leading-relaxed font-sans">
          {data.psychologicalMechanism}
        </p>
      </div>

      {/* 3. Actionable Takeaways */}
      <div className="bg-stone-50 p-4 sm:p-4.5 rounded-2xl border border-stone-200/80 text-left space-y-2 shadow-xs relative z-20">
        <div className="flex items-center gap-2 text-xs font-bold text-stone-900 font-serif-editorial">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
          <span>知行合一 · 知识总结与心智工具（Key Takeaways）</span>
        </div>
        <ul className="text-xs text-stone-600 space-y-1.5">
          {data.actionableSummary.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2 relative z-20">
        <button
          onClick={handleRestartClick}
          type="button"
          className="flex-1 py-3.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 border border-stone-200"
        >
          <RotateCcw className="w-4 h-4" />
          <span>再战一局（复盘巩固）</span>
        </button>

        <button
          onClick={handleReturnClick}
          type="button"
          className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-stone-900 via-indigo-950 to-purple-950 hover:opacity-95 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-900/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 game-btn-tactile"
        >
          <span>收下奖励，返回竞技场</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

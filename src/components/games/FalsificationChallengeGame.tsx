import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, SearchCheck, CheckCircle2, RotateCcw, AlertTriangle, ArrowRight, ShieldCheck, HelpCircle, Sparkles, Terminal, Flame } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { GameDifficulty, DIFFICULTY_CONFIGS, DIFFICULTY_LIST } from '../../data/difficulty';
import { DifficultySelector } from './DifficultySelector';
import { GameDebriefModal, DebriefData } from './GameDebriefModal';
import { GameHeaderHud } from './GameHeaderHud';
import { gameAudio } from '../../utils/gameAudio';

interface TestAttempt {
  nums: [number, number, number];
  matchesRule: boolean;
  isFalsificationTry: boolean;
}

export const FalsificationChallengeGame: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, recordGameResult } = useApp();

  const urlDiff = searchParams.get('difficulty') as GameDifficulty | null;
  const initialDiff: GameDifficulty = urlDiff && DIFFICULTY_LIST.includes(urlDiff) ? urlDiff : '中';

  const [difficulty, setDifficulty] = useState<GameDifficulty>(initialDiff);
  const [gameState, setGameState] = useState<'intro' | 'testing' | 'guess' | 'debrief'>('intro');

  const [n1, setN1] = useState<string>('8');
  const [n2, setN2] = useState<string>('10');
  const [n3, setN3] = useState<string>('12');

  const [history, setHistory] = useState<TestAttempt[]>([]);
  const [selectedHypothesis, setSelectedHypothesis] = useState<string | null>(null);
  const [score, setScore] = useState(0);

  const diffConfig = DIFFICULTY_CONFIGS[difficulty];
  const isFirstTime = !(user.completedGames?.includes('falsification-challenge'));

  const checkRule = (a: number, b: number, c: number): boolean => {
    return a < b && b < c;
  };

  const handleTestNumbers = (e: React.FormEvent) => {
    e.preventDefault();
    const a = parseFloat(n1);
    const b = parseFloat(n2);
    const c = parseFloat(n3);

    if (isNaN(a) || isNaN(b) || isNaN(c)) return;

    const matches = checkRule(a, b, c);
    const isEvenAdd2 = (b - a === 2) && (c - b === 2) && (a % 2 === 0);
    const isFalsification = !isEvenAdd2;

    if (matches) {
      gameAudio.playSuccess();
    } else {
      gameAudio.playMistake();
    }

    setHistory(prev => [
      { nums: [a, b, c], matchesRule: matches, isFalsificationTry: isFalsification },
      ...prev,
    ]);

    setN1('');
    setN2('');
    setN3('');
  };

  const handleChooseHypothesis = (hyp: string) => {
    setSelectedHypothesis(hyp);
    const isCorrect = hyp === 'any-increasing';
    const falsificationCount = history.filter(h => h.isFalsificationTry).length;

    if (isCorrect) {
      gameAudio.playVictory();
    } else {
      gameAudio.playMistake();
    }

    const calculatedXp = isFirstTime
      ? Math.round(40 * diffConfig.xpMultiplier)
      : Math.round(11 * diffConfig.xpMultiplier);

    const pts = Math.round(((isCorrect ? 2500 : 800) + falsificationCount * 300) * diffConfig.scoreMultiplier);
    setScore(pts);

    recordGameResult('falsification-challenge', {
      score: pts,
      accuracy: isCorrect ? 100 : 50,
      reactionTime: 890,
      xpGained: calculatedXp,
      comboMax: falsificationCount,
      conceptLearned: '可证伪思维（Falsificationism）与确认偏误防御机制',
      lawId: 'confirmation-bias',
      difficulty,
    });

    setGameState('debrief');
  };

  const debriefData: DebriefData = {
    gameId: 'falsification-challenge',
    gameTitle: '反证挑战',
    numberPrefix: '10',
    difficulty,
    score,
    accuracy: selectedHypothesis === 'any-increasing' ? 100 : 50,
    isFirstTime,
    xpEarned: isFirstTime ? Math.round(42 * diffConfig.xpMultiplier) : Math.round(11 * diffConfig.xpMultiplier),
    bestAnswerReview:
      '卡尔·波普尔（Karl Popper）的科学哲学真理：【一万只白天鹅不能证明所有天鹅都是白的，但只要一只黑天鹅就能彻底推翻假说】。在生活与投资中，主动寻找证伪反例，才能建立真正抗脆弱的底层认知。',
    psychologicalMechanism:
      '彼得·沃森（Peter Wason 1960）经典的 2-4-6 实验中，80% 的受试者初测全部失败！他们被脑海中的“偶数等差递增”直觉紧紧束缚，只测试支持自身假设的数字（如 8-10-12）。唯有敢于主动测试非偶数、不等差乃至倒序的探索者，才能打破确认偏误（Confirmation Bias）。',
    actionableSummary: [
      '“红队思维（Red Teaming）”：在推出新业务前，专门设法证明“这个项目为什么一定会死”。',
      '反直觉求证：当极度确信一个观点时，主动搜寻 3 篇高质量的反方论据并认真读完。',
      '在做重大投资决策前：列出必须满足的“止损与证伪边界”，而非只搜集看多新闻。',
    ],
  };

  if (gameState === 'intro') {
    return (
      <div className="flex flex-col items-center justify-start min-h-[85vh] w-full max-w-lg mx-auto py-4 px-2">
        <div className="w-full flex items-center justify-between mb-4">
          <button
            onClick={() => navigate('/games')}
            type="button"
            className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>返回竞技场</span>
          </button>
          <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
            GAME 10
          </span>
        </div>

        <div className="w-full game-arcade-card rounded-3xl p-6 sm:p-8 border-indigo-200/90 shadow-xl space-y-6 relative overflow-hidden">
          {/* Ambient colorful glow */}
          <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-gradient-to-br from-indigo-500/30 to-violet-600/20 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-gradient-to-br from-blue-500/20 to-indigo-400/20 blur-2xl pointer-events-none" />

          {/* Animated SearchCheck Monogram */}
          <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 shadow-lg shadow-indigo-500/30 animate-pulseGlow" />
            <SearchCheck className="w-10 h-10 text-white relative z-10" />
          </div>

          <div className="text-center space-y-2 relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-indigo-800 bg-indigo-50 border border-indigo-200">
              <Sparkles className="w-3.5 h-3.5" />
              <span>沃森 2-4-6 实验 · 可证伪科学思维</span>
            </div>
            <h1 className="font-serif-editorial text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
              10 · 反证挑战
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-sm mx-auto">
              体验心理学史上著名的沃森 2-4-6 规律发现实验。走出只搜集支持自己论据的舒适区，敢于寻找“黑天鹅”。
            </p>
          </div>

          <div className="space-y-2 pt-2 border-t border-stone-200/60 text-left relative z-10">
            <div className="flex justify-between items-center text-xs font-bold text-stone-800">
              <span>选择探索难度：</span>
              <span className="text-indigo-600 font-numeric">{diffConfig.multiplierText} 积分收益</span>
            </div>
            <DifficultySelector value={difficulty} onChange={setDifficulty} />
          </div>

          <button
            onClick={() => {
              gameAudio.playSuccess();
              setHistory([]);
              setSelectedHypothesis(null);
              setGameState('testing');
            }}
            type="button"
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:opacity-95 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 relative z-10 game-btn-tactile"
          >
            <SearchCheck className="w-4 h-4 text-white" />
            <span>启动反证实验（{difficulty}难度 · {diffConfig.multiplierText} 积分加成）</span>
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'debrief') {
    return (
      <div className="py-4 px-2">
        <GameDebriefModal
          data={debriefData}
          onRestart={() => {
            setHistory([]);
            setSelectedHypothesis(null);
            setGameState('testing');
          }}
          onReturn={() => navigate('/games')}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-start min-h-[85vh] w-full max-w-lg mx-auto py-2 px-2 animate-fadeIn space-y-4">
      {/* Game HUD */}
      <GameHeaderHud
        title="10 · 反证挑战"
        numberPrefix="10"
        difficulty={difficulty}
        score={score}
        combo={history.filter(h => h.isFalsificationTry).length}
        onExit={() => setGameState('intro')}
        accentColor="#4F46E5"
      />

      <div className="w-full game-arcade-card rounded-3xl p-6 border-indigo-100 shadow-xl space-y-5 animate-fadeIn bg-white relative overflow-hidden">
        {/* Initial Prompt Banner */}
        <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-200 space-y-2 shadow-2xs">
          <span className="text-[10px] font-black text-indigo-800 bg-indigo-100/90 px-2 py-0.5 rounded-md font-mono">
            WASON 2-4-6 SCIENTIFIC LAB
          </span>
          <div className="flex items-center justify-center gap-3 py-2 font-mono font-black text-2xl text-indigo-950">
            <span className="px-3.5 py-1 bg-white rounded-xl shadow-xs border border-indigo-200">2</span>
            <span>-</span>
            <span className="px-3.5 py-1 bg-white rounded-xl shadow-xs border border-indigo-200">4</span>
            <span>-</span>
            <span className="px-3.5 py-1 bg-white rounded-xl shadow-xs border border-indigo-200">6</span>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed text-center font-sans">
            上面这 3 个数字符合研究员心中的某条<strong>隐藏规律</strong>。你可以输入任意数字三元组测试，系统会告诉你是否符合规则。
          </p>
        </div>

        {gameState === 'testing' ? (
          <div className="space-y-4">
            {/* Input Form */}
            <form onSubmit={handleTestNumbers} className="p-4.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-3 shadow-2xs">
              <label className="text-xs font-bold text-stone-800 block font-serif-editorial">
                输入 3 个数字进行测试验证：
              </label>

              <div className="grid grid-cols-3 gap-2">
                <input
                  type="number"
                  placeholder="数字 1"
                  value={n1}
                  onChange={(e) => setN1(e.target.value)}
                  className="p-3 bg-white rounded-xl border border-stone-200 text-center font-mono text-base font-bold focus:border-indigo-600 focus:outline-none shadow-2xs"
                  required
                />
                <input
                  type="number"
                  placeholder="数字 2"
                  value={n2}
                  onChange={(e) => setN2(e.target.value)}
                  className="p-3 bg-white rounded-xl border border-stone-200 text-center font-mono text-base font-bold focus:border-indigo-600 focus:outline-none shadow-2xs"
                  required
                />
                <input
                  type="number"
                  placeholder="数字 3"
                  value={n3}
                  onChange={(e) => setN3(e.target.value)}
                  className="p-3 bg-white rounded-xl border border-stone-200 text-center font-mono text-base font-bold focus:border-indigo-600 focus:outline-none shadow-2xs"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-95 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-indigo-500/20 transition-all cursor-pointer active:scale-98 game-btn-tactile"
              >
                测试该序列是否符合隐藏规则
              </button>
            </form>

            {/* Test History List */}
            {history.length > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs text-stone-500 font-numeric">
                  <span>已完成测试记录 ({history.length} 次)：</span>
                  <span className="font-bold">
                    反向证伪探索: <strong className="text-indigo-600 font-black">{history.filter(h => h.isFalsificationTry).length}</strong> 次
                  </span>
                </div>

                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 no-scrollbar">
                  {history.map((h, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-2xl border-2 flex items-center justify-between text-xs font-mono font-bold ${
                        h.matchesRule
                          ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                          : 'bg-rose-50/80 border-rose-300 text-rose-950'
                      }`}
                    >
                      <span className="text-sm">
                        [{h.nums[0]}, {h.nums[1]}, {h.nums[2]}]
                      </span>
                      <span className="flex items-center gap-1 font-sans text-xs">
                        {h.matchesRule ? '符合规则 ✅' : '不符合 ❌'}
                        {h.isFalsificationTry && (
                          <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full font-bold ml-1 border border-indigo-200">
                            证伪探索
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => {
                gameAudio.playTap();
                setGameState('guess');
              }}
              type="button"
              className="w-full py-4 bg-gradient-to-r from-stone-900 via-indigo-950 to-purple-950 hover:opacity-95 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 game-btn-tactile"
            >
              <span>我已探明隐藏规律，提交终极假说</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* Final Guess Screen */
          <div className="space-y-4 animate-fadeIn">
            <h3 className="text-xs sm:text-sm font-bold text-stone-900 font-serif-editorial">
              根据你的实验与反例测试，你判断研究员心中的隐藏规律到底是什么？
            </h3>

            <div className="space-y-3">
              <button
                onClick={() => handleChooseHypothesis('even-add-2')}
                type="button"
                className="w-full text-left p-4 rounded-2xl border-2 border-stone-200 hover:border-indigo-400 bg-white hover:bg-stone-50 transition-all text-xs font-medium cursor-pointer active:scale-98 shadow-2xs"
              >
                <span className="font-bold text-stone-900 block mb-1">选项 A：每次递增 2 的连续偶数</span>
                <span className="text-stone-500 text-[11px]">80% 陷入确认偏误受试者的本能直觉答案</span>
              </button>

              <button
                onClick={() => handleChooseHypothesis('any-even')}
                type="button"
                className="w-full text-left p-4 rounded-2xl border-2 border-stone-200 hover:border-indigo-400 bg-white hover:bg-stone-50 transition-all text-xs font-medium cursor-pointer active:scale-98 shadow-2xs"
              >
                <span className="font-bold text-stone-900 block mb-1">选项 B：任意递增的偶数即可（无需等差）</span>
                <span className="text-stone-500 text-[11px]">依然默认局限于“偶数”的狭隘假说</span>
              </button>

              <button
                onClick={() => handleChooseHypothesis('any-increasing')}
                type="button"
                className="w-full text-left p-4 rounded-2xl border-2 border-indigo-400 bg-indigo-50/60 hover:bg-indigo-50 transition-all text-xs font-medium cursor-pointer active:scale-98 shadow-sm"
              >
                <span className="font-bold text-indigo-950 block mb-1 flex items-center gap-1">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  选项 C：任意严格递增的数字即可（无须偶数、无须等差）
                </span>
                <span className="text-emerald-700 text-[11px] font-bold">沃森实验的真实极简规则（科学可证伪性真相）</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

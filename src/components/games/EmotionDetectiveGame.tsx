import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, HeartPulse, CheckCircle2, RotateCcw, AlertCircle, ArrowRight, ShieldCheck, Tag, Sparkles, MessageSquare, Search } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { GameDifficulty, DIFFICULTY_CONFIGS, DIFFICULTY_LIST, shuffleArray } from '../../data/difficulty';
import { DifficultySelector } from './DifficultySelector';
import { GameDebriefModal, DebriefData } from './GameDebriefModal';
import { GameHeaderHud } from './GameHeaderHud';
import { gameAudio } from '../../utils/gameAudio';

type SentenceType = 'fact' | 'emotion' | 'speculation';

interface DialogueStatement {
  text: string;
  correctType: SentenceType;
  explanation: string;
}

interface DialogueCase {
  id: string;
  title: string;
  scene: string;
  statements: DialogueStatement[];
}

const CASES_POOL: DialogueCase[] = [
  {
    id: 'case-workplace',
    title: '项目复盘会议上的激烈交锋',
    scene: '产品上线后出现卡顿，运营负责人在复盘会上拍桌子发难：',
    statements: [
      {
        text: '“今天上午 10:15 支付接口平均响应时间达到 4.8 秒，超时率 12%。”',
        correctType: 'fact',
        explanation: '有具体时间、精确度量指标和客观系统日志记录，属于无可争议的客观事实。',
      },
      {
        text: '“你们技术团队根本没把这次大促放在心上，态度极其散漫！”',
        correctType: 'emotion',
        explanation: '包含强烈的主观攻击性评判与情绪宣泄，无法客观度量内心状态。',
      },
      {
        text: '“我怀疑某些开发人员故意不测边界值，想看我们运营出丑！”',
        correctType: 'speculation',
        explanation: '缺乏证据地对他人动机进行恶意读心臆测，属于典型的主观归因臆想。',
      },
      {
        text: '“本次提测的代码比原定计划晚提交了 48 小时。”',
        correctType: 'fact',
        explanation: 'Git 提交时间戳明确，属于客观事实。',
      },
    ],
  },
  {
    id: 'case-relationship',
    title: '深夜关于家务分工的伴侣争执',
    scene: '伴侣一方下班回家看到水槽里没洗的碗筷，情绪爆发：',
    statements: [
      {
        text: '“水槽里放了 3 个昨晚没洗的盘子和 2 个咖啡杯。”',
        correctType: 'fact',
        explanation: '清晰可清点的物理事实，不带主观攻击性。',
      },
      {
        text: '“你永远都是这么自私，从来不在乎这个家和我有多累！”',
        correctType: 'emotion',
        explanation: '使用“永远”、“从来不”等绝对化词汇宣泄不满情绪，属于非理性泛化。',
      },
      {
        text: '“你肯定是在办公室摸鱼玩手机，故意留着等我回来洗！”',
        correctType: 'speculation',
        explanation: '没有直接观察证据，擅自脑补他人行为动机的心智读心术。',
      },
    ],
  },
];

export const EmotionDetectiveGame: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, recordGameResult } = useApp();

  const urlDiff = searchParams.get('difficulty') as GameDifficulty | null;
  const initialDiff: GameDifficulty = urlDiff && DIFFICULTY_LIST.includes(urlDiff) ? urlDiff : '中';

  const [difficulty, setDifficulty] = useState<GameDifficulty>(initialDiff);
  const [gameState, setGameState] = useState<'intro' | 'classifying' | 'debrief'>('intro');
  const [cases, setCases] = useState<DialogueCase[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);

  // User selections: statement index -> chosen type
  const [userClassifications, setUserClassifications] = useState<Record<number, SentenceType>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const diffConfig = DIFFICULTY_CONFIGS[difficulty];
  const isFirstTime = !(user.completedGames?.includes('emotion-detective'));

  const startSession = (selectedDiff: GameDifficulty = difficulty) => {
    gameAudio.playSuccess();
    const shuffled = shuffleArray(CASES_POOL);
    setCases(shuffled);
    setCurrentIdx(0);
    setUserClassifications({});
    setIsSubmitted(false);
    setScore(0);
    setGameState('classifying');
  };

  const currentCase = cases[currentIdx];

  const handleSelect = (stmtIdx: number, type: SentenceType) => {
    if (isSubmitted) return;
    gameAudio.playTap();
    setUserClassifications(prev => ({
      ...prev,
      [stmtIdx]: type,
    }));
  };

  const handleSubmit = () => {
    if (!currentCase) return;
    let roundCorrect = 0;
    currentCase.statements.forEach((stmt, idx) => {
      if (userClassifications[idx] === stmt.correctType) {
        roundCorrect++;
      }
    });

    if (roundCorrect === currentCase.statements.length) {
      gameAudio.playSuccess();
    } else {
      gameAudio.playSelect();
    }

    const pts = Math.round((roundCorrect * 420 + 500) * diffConfig.scoreMultiplier);
    setScore(prev => prev + pts);
    setIsSubmitted(true);
  };

  const handleNext = () => {
    gameAudio.playTap();
    if (currentIdx < cases.length - 1) {
      setCurrentIdx(prev => prev + 1);
      setUserClassifications({});
      setIsSubmitted(false);
    } else {
      const calculatedXp = isFirstTime
        ? Math.round(38 * diffConfig.xpMultiplier)
        : Math.round(10 * diffConfig.xpMultiplier);

      recordGameResult('emotion-detective', {
        score,
        accuracy: 94,
        reactionTime: 850,
        xpGained: calculatedXp,
        comboMax: 4,
        conceptLearned: '情绪启发（Affect Heuristic）与事实/推论精准分离技术',
        lawId: 'halo-effect',
        difficulty,
      });

      setGameState('debrief');
    }
  };

  const debriefData: DebriefData = {
    gameId: 'emotion-detective',
    gameTitle: '情绪侦探',
    numberPrefix: '05',
    difficulty,
    score,
    accuracy: 94,
    isFirstTime,
    xpEarned: isFirstTime ? Math.round(40 * diffConfig.xpMultiplier) : Math.round(10 * diffConfig.xpMultiplier),
    bestAnswerReview:
      '非暴力沟通（NVC）与理性思维的核心基石：【观察而非评判，事实优于推论】。在任何激烈争执中，率先提取双方公认的客观物理事实（Fact），安抚并承认主观情绪（Emotion），明确叫停无端恶意读心（Speculation）。',
    psychologicalMechanism:
      '情绪启发（Affect Heuristic）指出：当杏仁核被恐惧或愤怒激活时，大脑会自动用情感好恶替代理性事实判断。人们常把对某个人的讨厌（情绪）合理化为对方一定在暗中加害自己（推测），最终把沟通演变为人身攻击死结。',
    actionableSummary: [
      '“摄像机法则”：只说出如果架设一台高清摄像机能拍摄到的物理画面，不添加情绪修饰词。',
      '在职场发火前使用公式：“当我看到【客观事实】时，我感到【具体情绪】，因为我需要【核心诉求】”。',
      '严禁使用“你总是 / 你从来不”等绝对化词汇，这必然引爆防御机制。',
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
          <span className="text-xs font-mono font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
            GAME 05
          </span>
        </div>

        <div className="w-full game-arcade-card rounded-3xl p-6 sm:p-8 border-rose-200/90 shadow-xl space-y-6 relative overflow-hidden">
          {/* Ambient colorful glow */}
          <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-gradient-to-br from-rose-500/30 to-red-600/20 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-gradient-to-br from-purple-500/20 to-rose-400/20 blur-2xl pointer-events-none" />

          {/* Animated HeartPulse Monogram */}
          <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-rose-500 to-red-600 shadow-lg shadow-rose-500/30 animate-pulseGlow" />
            <HeartPulse className="w-10 h-10 text-white relative z-10" />
          </div>

          <div className="text-center space-y-2 relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-rose-800 bg-rose-50 border border-rose-200">
              <Sparkles className="w-3.5 h-3.5" />
              <span>情绪启发 · 事实/推测精准剥离</span>
            </div>
            <h1 className="font-serif-editorial text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
              05 · 情绪侦探
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-sm mx-auto">
              在职场冲突与亲密关系中，将混乱的争吵精准解剖为【可验证事实】、【主观情绪宣泄】与【心智臆测】，重获沟通主动权。
            </p>
          </div>

          <div className="space-y-2 pt-2 border-t border-stone-200/60 text-left relative z-10">
            <div className="flex justify-between items-center text-xs font-bold text-stone-800">
              <span>选择侦探研判难度：</span>
              <span className="text-rose-600 font-numeric">{diffConfig.multiplierText} 积分收益</span>
            </div>
            <DifficultySelector value={difficulty} onChange={setDifficulty} />
          </div>

          <button
            onClick={() => startSession(difficulty)}
            type="button"
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-500 via-red-600 to-purple-600 hover:from-rose-600 hover:to-red-700 text-white font-bold text-sm shadow-lg shadow-rose-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 relative z-10 game-btn-tactile"
          >
            <HeartPulse className="w-4 h-4 text-white" />
            <span>进入事实解剖室（{difficulty}难度 · {diffConfig.multiplierText} 积分加成）</span>
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
          onRestart={() => startSession(difficulty)}
          onReturn={() => navigate('/games')}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-start min-h-[85vh] w-full max-w-lg mx-auto py-2 px-2 animate-fadeIn space-y-4">
      {/* Game HUD */}
      <GameHeaderHud
        title="05 · 情绪侦探"
        numberPrefix="05"
        difficulty={difficulty}
        score={score}
        currentRound={currentIdx + 1}
        totalRounds={cases.length}
        onExit={() => setGameState('intro')}
        accentColor="#EF4444"
      />

      {currentCase && (
        <div className="w-full game-arcade-card rounded-3xl p-6 border-rose-100 shadow-xl space-y-5 animate-fadeIn bg-white relative overflow-hidden">
          {/* Dialogue Case Header */}
          <div className="space-y-1.5 border-b border-stone-200/70 pb-3.5">
            <span className="text-[10px] font-black text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 font-mono">
              CASE #{currentIdx + 1} / {cases.length} · 冲突研判
            </span>
            <h2 className="text-xl font-bold text-stone-900 font-serif-editorial">
              {currentCase.title}
            </h2>
            <div className="text-xs text-stone-700 leading-relaxed bg-stone-50 p-3.5 rounded-2xl border border-stone-200/80 font-sans mt-2">
              {currentCase.scene}
            </div>
          </div>

          {/* Statements to classify */}
          <div className="space-y-3.5">
            {currentCase.statements.map((stmt, idx) => {
              const userChosen = userClassifications[idx];
              const isCorrect = isSubmitted && userChosen === stmt.correctType;

              return (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border-2 transition-all ${
                    isSubmitted
                      ? isCorrect
                        ? 'bg-emerald-50/70 border-emerald-300'
                        : 'bg-rose-50/70 border-rose-300'
                      : 'bg-stone-50/90 border-stone-200/80'
                  }`}
                >
                  <p className="text-xs sm:text-[13px] font-bold text-stone-900 mb-3 leading-snug">
                    {stmt.text}
                  </p>

                  {/* 3 Game-Themed Classification Buttons */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      disabled={isSubmitted}
                      onClick={() => handleSelect(idx, 'fact')}
                      className={`py-2 px-1 text-[11px] sm:text-xs rounded-xl font-bold transition-all cursor-pointer border ${
                        userChosen === 'fact'
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/25 scale-102'
                          : 'bg-white hover:bg-blue-50 text-stone-700 border-stone-200'
                      }`}
                    >
                      📊 客观事实 (Fact)
                    </button>

                    <button
                      type="button"
                      disabled={isSubmitted}
                      onClick={() => handleSelect(idx, 'emotion')}
                      className={`py-2 px-1 text-[11px] sm:text-xs rounded-xl font-bold transition-all cursor-pointer border ${
                        userChosen === 'emotion'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-500/25 scale-102'
                          : 'bg-white hover:bg-rose-50 text-stone-700 border-stone-200'
                      }`}
                    >
                      🔥 情绪宣泄 (Emotion)
                    </button>

                    <button
                      type="button"
                      disabled={isSubmitted}
                      onClick={() => handleSelect(idx, 'speculation')}
                      className={`py-2 px-1 text-[11px] sm:text-xs rounded-xl font-bold transition-all cursor-pointer border ${
                        userChosen === 'speculation'
                          ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-500/25 scale-102'
                          : 'bg-white hover:bg-purple-50 text-stone-700 border-stone-200'
                      }`}
                    >
                      💭 恶意臆测 (Spec)
                    </button>
                  </div>

                  {/* Explanation on submit */}
                  {isSubmitted && (
                    <div className="mt-3 pt-2.5 border-t border-stone-200/60 text-xs text-stone-700 leading-relaxed animate-fadeIn font-sans">
                      <strong className="text-stone-900">侦探解析：</strong> {stmt.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {!isSubmitted ? (
            <button
              disabled={Object.keys(userClassifications).length < currentCase.statements.length}
              onClick={handleSubmit}
              type="button"
              className={`w-full py-4 font-bold text-xs sm:text-sm rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 game-btn-tactile ${
                Object.keys(userClassifications).length === currentCase.statements.length
                  ? 'bg-gradient-to-r from-stone-900 to-indigo-950 text-white shadow-md'
                  : 'bg-stone-200 text-stone-400 cursor-not-allowed'
              }`}
            >
              <span>提交分类判定</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleNext}
              type="button"
              className="w-full py-4 bg-gradient-to-r from-rose-600 via-red-600 to-purple-600 hover:opacity-95 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer animate-fadeIn active:scale-98 game-btn-tactile"
            >
              <span>{currentIdx < cases.length - 1 ? '审理下一宗沟通案卷' : '完成实验生成研报'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

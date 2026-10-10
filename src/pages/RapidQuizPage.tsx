import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { HelpCircle, Zap, Trophy, ArrowRight, RotateCcw, CheckCircle2, XCircle, Sparkles, Clock } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { RAPID_QUIZ_QUESTIONS } from '../data/quizzes';

export const RapidQuizPage: React.FC = () => {
  const navigate = useNavigate();
  const { recordQuizCompletion } = useApp();

  const [questions, setQuestions] = useState(RAPID_QUIZ_QUESTIONS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'completed'>('intro');

  const timerRef = useRef<any>(null);

  const startQuiz = () => {
    // Shuffle and pick 10 questions
    const shuffled = [...RAPID_QUIZ_QUESTIONS].sort(() => Math.random() - 0.5).slice(0, 10);
    setQuestions(shuffled);
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setCorrectCount(0);
    setTimeLeft(15);
    setGameState('playing');
  };

  // 15-second per question countdown
  useEffect(() => {
    if (gameState !== 'playing' || isAnswered) return;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [gameState, isAnswered, currentIndex]);

  const handleTimeOut = () => {
    setIsAnswered(true);
    setCombo(0);
  };

  const handleSelectOption = (idx: number) => {
    if (isAnswered) return;
    clearInterval(timerRef.current);
    setSelectedOption(idx);
    setIsAnswered(true);

    const currentQ = questions[currentIndex];
    const isCorrect = idx === currentQ.correctAnswer;

    if (isCorrect) {
      const newCombo = combo + 1;
      setCombo(newCombo);
      setMaxCombo(prev => Math.max(prev, newCombo));
      setCorrectCount(prev => prev + 1);

      const timeBonus = timeLeft * 10;
      const points = 100 + newCombo * 25 + timeBonus;
      setScore(prev => prev + points);
    } else {
      setCombo(0);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setTimeLeft(15);
    } else {
      setGameState('completed');
    }
  };

  const handleFinish = () => {
    const earnedXp = Math.round(score / 4) + 100;
    recordQuizCompletion(correctCount, questions.length, earnedXp);
    navigate('/');
  };

  const currentQ = questions[currentIndex];

  return (
    <div className="flex flex-col items-center justify-start min-h-[75vh] w-full max-w-2xl mx-auto py-4 sm:py-6 animate-fadeIn">
      {/* Top Header / Folio */}
      <div className="w-full flex items-center justify-between mb-6 pb-3 border-b border-stone-200/80 text-xs text-stone-600">
        <div className="flex items-center gap-2">
          <span className="editorial-kicker text-[10px] text-stone-800">
            Dialectics · 快速思辨
          </span>
          {gameState === 'playing' && (
            <span className="font-numeric font-medium text-stone-500">
              ({currentIndex + 1} / {questions.length})
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 font-numeric text-xs">
          {gameState === 'playing' && (
            <div className="flex items-center gap-1 text-stone-700">
              <Clock className="w-3.5 h-3.5 text-stone-500" />
              <span>{timeLeft}s</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-stone-700">
            <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-600" />
            <span>连击 x{combo}</span>
          </div>
          <div className="flex items-center gap-1 text-stone-900 font-semibold">
            <Trophy className="w-3.5 h-3.5 text-stone-700" />
            <span>{score} 分</span>
          </div>
        </div>
      </div>

      {gameState === 'intro' ? (
        <div className="w-full editorial-card rounded-2xl p-8 sm:p-10 text-center space-y-6">
          <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-800 flex items-center justify-center mx-auto">
            <HelpCircle className="w-6 h-6 stroke-[1.5]" />
          </div>

          <div className="space-y-2">
            <h2 className="font-serif-editorial text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
              心理快问快答 · 思辨速测
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-md mx-auto">
              检验对实证心理学定律、启发式偏差与非理性行为的直觉洞察。每题限时 15 秒，连续答对可累积连击加成。
            </p>
          </div>

          <div className="bg-[#FAF8F5] rounded-xl p-5 text-left border border-stone-200/60 max-w-md mx-auto">
            <h4 className="text-xs font-semibold text-stone-900 mb-2 font-serif-editorial">测试规则说明：</h4>
            <ul className="text-xs text-stone-600 space-y-1.5 leading-relaxed">
              <li>• 共 10 道随机心理学与决策科学思辨题</li>
              <li>• 每题限时 15 秒，快速作答可享敏捷速度加分</li>
              <li>• 连续答对触发连击乘数，结算转化为脑力经验 (XP)</li>
            </ul>
          </div>

          <button
            onClick={startQuiz}
            className="w-full max-w-sm mx-auto py-3.5 px-6 rounded-xl chameleon-btn font-semibold text-xs tracking-wide transition-all cursor-pointer block"
          >
            开启今日思辨测试
          </button>
        </div>
      ) : gameState === 'completed' ? (
        <div className="w-full editorial-card rounded-2xl p-8 sm:p-10 text-center space-y-6 animate-fadeIn">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center mx-auto">
            <Trophy className="w-6 h-6 stroke-[1.5]" />
          </div>

          <div className="space-y-1">
            <h2 className="font-serif-editorial text-2xl sm:text-3xl font-bold text-stone-900">
              测试完成 · 认知结算报告
            </h2>
            <p className="text-xs sm:text-sm text-stone-600">
              答对率：<strong className="text-stone-900 font-semibold font-numeric">{Math.round((correctCount / questions.length) * 100)}%</strong> ({correctCount} / {questions.length} 题)
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 my-4 max-w-md mx-auto">
            <div className="bg-[#FAF8F5] p-4 rounded-xl border border-stone-200/60">
              <span className="text-[11px] text-stone-500 font-medium block">总得分</span>
              <span className="text-lg font-bold text-stone-900 font-numeric">{score}</span>
            </div>
            <div className="bg-[#FAF8F5] p-4 rounded-xl border border-stone-200/60">
              <span className="text-[11px] text-stone-500 font-medium block">最高连击</span>
              <span className="text-lg font-bold text-stone-900 font-numeric">{maxCombo} 次</span>
            </div>
            <div className="bg-[#FAF8F5] p-4 rounded-xl border border-stone-200/60">
              <span className="text-[11px] text-stone-500 font-medium block">获得经验</span>
              <span className="text-lg font-bold text-emerald-800 font-numeric">+{Math.round(score / 4) + 100} XP</span>
            </div>
          </div>

          <div className="flex gap-3 pt-2 max-w-md mx-auto">
            <button
              onClick={startQuiz}
              className="flex-1 py-3 rounded-xl bg-white border border-stone-200 hover:border-stone-400 text-stone-800 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>重新挑战</span>
            </button>
            <button
              onClick={handleFinish}
              className="flex-1 py-3 rounded-xl chameleon-btn font-semibold text-xs transition-all cursor-pointer"
            >
              录入经验并返回
            </button>
          </div>
        </div>
      ) : (
        /* Playing Question Arena */
        <div className="w-full flex flex-col items-center space-y-5">
          {/* Progress bar */}
          <div className="w-full bg-stone-200 h-1 rounded-full overflow-hidden">
            <div
              className="h-full chameleon-bar"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>

          <div className="w-full editorial-card rounded-2xl p-7 sm:p-9 space-y-6">
            <div className="flex items-center justify-between text-xs pb-3 border-b border-stone-200/80">
              <span className="font-serif-editorial italic text-stone-600">
                {currentQ.category}领域
              </span>
              <span className="text-stone-500">
                难度 · {currentQ.difficulty}
              </span>
            </div>

            <h3 className="font-serif-editorial text-base sm:text-lg md:text-xl font-bold text-stone-900 leading-snug">
              {currentQ.question}
            </h3>

            {/* Options */}
            <div className="space-y-3">
              {currentQ.options.map((opt, idx) => {
                const isSelected = selectedOption === idx;
                const isCorrect = idx === currentQ.correctAnswer;
                const showSuccess = isAnswered && isCorrect;
                const showWrong = isAnswered && isSelected && !isCorrect;

                return (
                  <button
                    key={idx}
                    disabled={isAnswered}
                    onClick={() => handleSelectOption(idx)}
                    className={`w-full text-left p-4 rounded-xl border text-xs sm:text-sm font-medium transition-colors flex items-center justify-between cursor-pointer ${
                      showSuccess
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-900'
                        : showWrong
                        ? 'bg-rose-50 border-rose-300 text-rose-900'
                        : 'bg-white hover:bg-stone-50 border-stone-200 text-stone-900'
                    }`}
                  >
                    <span>{opt}</span>
                    {showSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 ml-2" />}
                    {showWrong && <XCircle className="w-4 h-4 text-rose-600 shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>

            {/* Explanation card on answer */}
            {isAnswered && (
              <div className="p-4 rounded-xl bg-[#FAF8F5] border border-stone-200/80 space-y-3 animate-fadeIn">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-900 font-serif-editorial">
                  <Sparkles className="w-3.5 h-3.5 text-stone-600" />
                  <span>理论解析与反思</span>
                </div>
                <p className="text-xs sm:text-sm text-stone-700 leading-relaxed">
                  {currentQ.explanation}
                </p>
                <button
                  onClick={handleNext}
                  className="w-full mt-2 py-3 chameleon-btn font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>{currentIndex < questions.length - 1 ? '继续下一题' : '查看结算报告'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

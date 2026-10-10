import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, Trophy, Clock, ArrowRight, RotateCcw, CheckCircle2, XCircle, Sparkles, Zap } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DAILY_CHALLENGE_QUESTIONS } from '../data/quizzes';

export const DailyChallengePage: React.FC = () => {
  const navigate = useNavigate();
  const { completeDailyChallenge, isDailyChallengeCompleted } = useApp();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes total
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'completed'>('intro');

  const questions = DAILY_CHALLENGE_QUESTIONS;

  useEffect(() => {
    if (gameState !== 'playing') return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setGameState('completed');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState]);

  const handleStart = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setCorrectCount(0);
    setTimeLeft(180);
    setGameState('playing');
  };

  const handleSelectOption = (idx: number) => {
    if (isAnswered) return;
    setSelectedOption(idx);
    setIsAnswered(true);

    const currentQ = questions[currentIndex];
    if (idx === currentQ.correctAnswer) {
      setCorrectCount(prev => prev + 1);
      setScore(prev => prev + 200);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setGameState('completed');
      completeDailyChallenge();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const currentQ = questions[currentIndex];

  return (
    <div className="flex flex-col items-center justify-start min-h-[75vh] w-full max-w-2xl mx-auto py-4 sm:py-6 animate-fadeIn">
      {/* Top Folio Header */}
      <div className="w-full flex items-center justify-between mb-6 pb-3 border-b border-stone-200/80 text-xs text-stone-600">
        <div className="flex items-center gap-2">
          <span className="editorial-kicker text-[10px] text-stone-800">
            Daily Challenge · 今日特刊挑战
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
              <span>{formatTime(timeLeft)}</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-stone-900 font-semibold">
            <Trophy className="w-3.5 h-3.5 text-stone-700" />
            <span>{score} 分</span>
          </div>
        </div>
      </div>

      {gameState === 'intro' ? (
        <div className="w-full editorial-card rounded-2xl p-8 sm:p-10 text-center space-y-6">
          <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-800 flex items-center justify-center mx-auto">
            <Target className="w-6 h-6 stroke-[1.5]" />
          </div>

          <div className="space-y-2">
            <h2 className="font-serif-editorial text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
              今日认知挑战 · 3分钟极速自测
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-md mx-auto">
              每天投入 3 分钟，完成 10 道经典心理学与心智决策题目，点亮今日连续学习记录并赢取丰厚经验。
            </p>
          </div>

          <div className="bg-[#FAF8F5] rounded-xl p-5 text-left border border-stone-200/60 max-w-md mx-auto">
            <h4 className="text-xs font-semibold text-stone-900 mb-2 font-serif-editorial">今日挑战奖励细则：</h4>
            <ul className="text-xs text-stone-600 space-y-1.5 leading-relaxed">
              <li>• 完成即领 <strong className="text-stone-900 font-numeric">+500 XP</strong> 大脑训练经验</li>
              <li>• 延续连续研习天数（Streak +1）</li>
              <li>• 实时校准五维认知神经能力图谱</li>
            </ul>
          </div>

          <button
            onClick={handleStart}
            className="w-full max-w-sm mx-auto py-3.5 px-6 rounded-xl chameleon-btn font-semibold text-xs tracking-wide transition-all cursor-pointer block"
          >
            开启今日挑战特刊
          </button>
        </div>
      ) : gameState === 'completed' ? (
        <div className="w-full editorial-card rounded-2xl p-8 sm:p-10 text-center space-y-6 animate-fadeIn">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6 stroke-[1.5]" />
          </div>

          <div className="space-y-1">
            <h2 className="font-serif-editorial text-2xl sm:text-3xl font-bold text-stone-900">
              今日挑战达成 · 认知报告已归档
            </h2>
            <p className="text-xs sm:text-sm text-stone-600">
              答对率：<strong className="text-stone-900 font-semibold font-numeric">{Math.round((correctCount / questions.length) * 100)}%</strong> ({correctCount} / {questions.length} 题)
            </p>
          </div>

          <div className="bg-[#FAF8F5] p-5 rounded-xl text-left border border-stone-200/60 space-y-1.5 max-w-md mx-auto">
            <div className="flex justify-between items-center text-xs font-semibold text-stone-900">
              <span>今日挑战达成奖励</span>
              <span className="font-numeric text-emerald-800 font-bold">+500 XP</span>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              研习打卡成功！连续学习天数已刷新，前额叶工作回路已有效内化。
            </p>
          </div>

          <button
            onClick={() => navigate('/')}
            className="w-full max-w-sm mx-auto py-3.5 px-6 rounded-xl chameleon-btn font-semibold text-xs transition-all cursor-pointer block"
          >
            返回特刊首页
          </button>
        </div>
      ) : (
        /* Playing */
        <div className="w-full flex flex-col items-center space-y-5">
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
              <span className="text-stone-500 font-numeric">
                第 {currentIndex + 1} / {questions.length} 题
              </span>
            </div>

            <h3 className="font-serif-editorial text-base sm:text-lg md:text-xl font-bold text-stone-900 leading-snug">
              {currentQ.question}
            </h3>

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

            {isAnswered && (
              <div className="p-4 rounded-xl bg-[#FAF8F5] border border-stone-200/80 space-y-3 animate-fadeIn">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-900 font-serif-editorial">
                  <Sparkles className="w-3.5 h-3.5 text-stone-600" />
                  <span>核心理论解析</span>
                </div>
                <p className="text-xs sm:text-sm text-stone-700 leading-relaxed">
                  {currentQ.explanation}
                </p>
                <button
                  onClick={handleNext}
                  className="w-full mt-2 py-3 chameleon-btn font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>{currentIndex < questions.length - 1 ? '继续下一题' : '提交挑战报告'}</span>
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

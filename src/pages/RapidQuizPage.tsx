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
    <div className="flex flex-col items-center justify-start min-h-[80vh] w-full max-w-lg mx-auto py-2">
      {/* Top Header */}
      <div className="w-full flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-3 py-1 bg-[#EDE9FE] text-[#6C4CF1] border border-[#DDD6FE] rounded-full">
            快问快答 10 题
          </span>
          {gameState === 'playing' && (
            <span className="text-xs font-bold text-[#64748B]">
              {currentIndex + 1} / {questions.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          {gameState === 'playing' && (
            <div className="flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-full text-xs font-bold font-['Inter']">
              <Clock className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span>{timeLeft}s</span>
            </div>
          )}
          <div className="flex items-center gap-1 bg-[#EDE9FE] border border-[#DDD6FE] px-3 py-1 rounded-full text-xs font-bold text-[#6C4CF1]">
            <Zap className="w-3.5 h-3.5 fill-[#6C4CF1]" />
            <span>连击 x{combo}</span>
          </div>
          <div className="flex items-center gap-1 bg-white px-3 py-1 rounded-full text-xs font-bold text-[#18181B] border border-[#E6E2F5] shadow-xs">
            <Trophy className="w-3.5 h-3.5 text-[#F59E0B] fill-[#F59E0B]" />
            <span>{score}</span>
          </div>
        </div>
      </div>

      {gameState === 'intro' ? (
        <div className="w-full bg-white rounded-3xl p-6 border border-[#E6E2F5] shadow-[0_4px_20px_-2px_rgba(108,76,241,0.05)] text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-[#EDE9FE] text-[#6C4CF1] flex items-center justify-center mx-auto shadow-inner">
            <HelpCircle className="w-8 h-8" />
          </div>

          <h2 className="text-xl font-bold text-[#18181B]">心理快问快答 · 10 题速测</h2>
          <p className="text-xs text-[#64748B] leading-relaxed max-w-sm mx-auto">
            检验你对现代心理学、认知偏差与决策科学的掌握敏锐度。每题 15 秒限时，连击越高经验奖励越丰厚！
          </p>

          <div className="bg-[#FAF9FF] rounded-2xl p-4 text-left border border-[#E6E2F5]">
            <h4 className="text-xs font-bold text-[#6C4CF1] mb-1.5">⚡ 答题规则：</h4>
            <ul className="text-xs text-[#475569] space-y-1">
              <li>• 共 10 道随机精选题</li>
              <li>• 每题限时 15 秒，快速作答获得速度加分</li>
              <li>• 连续答对触发连击乘数，解锁高额 XP</li>
            </ul>
          </div>

          <button
            onClick={startQuiz}
            className="w-full py-3.5 rounded-2xl bg-[#6C4CF1] hover:bg-[#532CD8] text-white font-bold text-sm shadow-xs transition-all btn-press"
          >
            立即开始答题
          </button>
        </div>
      ) : gameState === 'completed' ? (
        <div className="w-full bg-white rounded-3xl p-6 border border-[#E6E2F5] shadow-[0_4px_20px_-2px_rgba(108,76,241,0.05)] text-center space-y-4 animate-fadeIn">
          <div className="w-16 h-16 rounded-3xl bg-[#FEF3C7] text-[#F59E0B] flex items-center justify-center mx-auto">
            <Trophy className="w-8 h-8 fill-[#F59E0B]" />
          </div>

          <h2 className="text-2xl font-black text-[#18181B]">竞答完成！</h2>
          <p className="text-xs text-[#64748B]">
            正确率：<strong className="text-[#059669] font-bold text-sm">{Math.round((correctCount / questions.length) * 100)}%</strong> ({correctCount} / {questions.length})
          </p>

          <div className="grid grid-cols-3 gap-2.5 my-4">
            <div className="bg-[#FAF9FF] p-3 rounded-2xl border border-[#E6E2F5]">
              <span className="text-[10px] text-[#64748B] font-medium block">总积分</span>
              <span className="text-base font-extrabold text-[#6C4CF1] font-['Inter']">{score}</span>
            </div>
            <div className="bg-[#FAF9FF] p-3 rounded-2xl border border-[#E6E2F5]">
              <span className="text-[10px] text-[#64748B] font-medium block">最高连击</span>
              <span className="text-base font-extrabold text-[#F59E0B] font-['Inter']">{maxCombo} 次</span>
            </div>
            <div className="bg-[#FAF9FF] p-3 rounded-2xl border border-[#E6E2F5]">
              <span className="text-[10px] text-[#64748B] font-medium block">获得经验</span>
              <span className="text-base font-extrabold text-[#10B981] font-['Inter']">+{Math.round(score / 4) + 100} XP</span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={startQuiz}
              className="flex-1 py-3 rounded-2xl bg-[#EDE9FE] text-[#6C4CF1] font-bold text-xs hover:bg-[#DDD6FE] transition-colors flex items-center justify-center gap-1.5 btn-press"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>再测一次</span>
            </button>
            <button
              onClick={handleFinish}
              className="flex-1 py-3 rounded-2xl bg-[#6C4CF1] hover:bg-[#532CD8] text-white font-bold text-xs shadow-xs transition-all btn-press"
            >
              领取经验并返回
            </button>
          </div>
        </div>
      ) : (
        /* Playing Question Arena */
        <div className="w-full flex flex-col items-center space-y-4">
          {/* Progress bar */}
          <div className="w-full bg-[#EDE9FE] h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#6C4CF1] transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>

          <div className="w-full bg-white rounded-3xl p-6 border border-[#E6E2F5] shadow-[0_4px_20px_-2px_rgba(108,76,241,0.05)] space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#EDE9FE] text-[#6C4CF1] border border-[#DDD6FE]">
                {currentQ.category}
              </span>
              <span className="text-[11px] text-[#64748B] font-medium">
                难度: {currentQ.difficulty}
              </span>
            </div>

            <h3 className="text-sm md:text-base font-bold text-[#18181B] leading-snug">
              {currentQ.question}
            </h3>

            {/* Options */}
            <div className="space-y-2.5">
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
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all text-xs font-semibold flex items-center justify-between btn-press ${
                      showSuccess
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-900 shadow-xs'
                        : showWrong
                        ? 'bg-rose-50 border-rose-300 text-rose-900'
                        : 'bg-[#FAF9FF] hover:bg-[#F5F3FF] border-[#E6E2F5] text-[#18181B]'
                    }`}
                  >
                    <span>{opt}</span>
                    {showSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 ml-2" />}
                    {showWrong && <XCircle className="w-4 h-4 text-rose-500 shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>

            {/* Explanation card on answer */}
            {isAnswered && (
              <div className="p-3.5 rounded-2xl bg-[#FAF9FF] border border-[#E6E2F5] space-y-2 animate-fadeIn">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#6C4CF1]">
                  <Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" />
                  <span>解析说明</span>
                </div>
                <p className="text-xs text-[#475569] leading-relaxed">
                  {currentQ.explanation}
                </p>
                <button
                  onClick={handleNext}
                  className="w-full mt-2 py-2.5 bg-[#6C4CF1] hover:bg-[#532CD8] text-white font-bold text-xs rounded-2xl shadow-xs transition-all flex items-center justify-center gap-1 btn-press"
                >
                  <span>{currentIndex < questions.length - 1 ? '下一题' : '查看结算报告'}</span>
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

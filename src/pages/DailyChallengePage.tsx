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
    <div className="flex flex-col items-center justify-start min-h-[80vh] w-full max-w-lg mx-auto py-2">
      {/* Top Header */}
      <div className="w-full flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-3 py-1 bg-[#6C4CF1] text-white rounded-full flex items-center gap-1">
            <Target className="w-3.5 h-3.5" />
            今日挑战 · 3分钟极速挑战
          </span>
        </div>

        <div className="flex items-center gap-3">
          {gameState === 'playing' && (
            <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-bold font-['Inter']">
              <Clock className="w-3.5 h-3.5 text-[#FFB72B]" />
              <span>{formatTime(timeLeft)}</span>
            </div>
          )}
          <div className="flex items-center gap-1 bg-white px-3 py-1 rounded-full text-xs font-bold text-[#1B192E] border border-[#E8E5F0]">
            <Trophy className="w-3.5 h-3.5 text-[#FFB72B] fill-[#FFB72B]" />
            <span>{score}</span>
          </div>
        </div>
      </div>

      {gameState === 'intro' ? (
        <div className="w-full bg-white rounded-3xl p-6 border border-white/80 shadow-[0_4px_25px_rgba(23,21,42,0.06)] text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-[#6C4CF1]/10 text-[#6C4CF1] flex items-center justify-center mx-auto shadow-inner">
            <Target className="w-8 h-8" />
          </div>

          <h2 className="text-xl font-bold text-[#1B192E]">今日挑战 · 3分钟极速自测</h2>
          <p className="text-xs text-[#5E5D6D] leading-relaxed max-w-sm mx-auto">
            每天只需要 3 分钟，完成 10 道心理学与认知思维实战题目，点亮今日连续打卡并赢取丰厚经验！
          </p>

          <div className="bg-[#F6F1FF] rounded-2xl p-4 text-left border border-[#E4DFFD]">
            <h4 className="text-xs font-bold text-[#532CD8] mb-1.5">⚡ 今日挑战奖励：</h4>
            <ul className="text-xs text-[#484555] space-y-1">
              <li>• 完成即领 <strong>+500 XP</strong> 大脑训练经验</li>
              <li>• 延续连续学习连击天数（Streak +1）</li>
              <li>• 实时更新个人五维认知雷达图谱</li>
            </ul>
          </div>

          <button
            onClick={handleStart}
            className="w-full py-3.5 rounded-2xl bg-[#6C4CF1] hover:bg-[#532CD8] text-white font-bold text-sm shadow-md transition-all btn-press"
          >
            开始今日挑战
          </button>
        </div>
      ) : gameState === 'completed' ? (
        <div className="w-full bg-white rounded-3xl p-6 border border-white/80 shadow-xl text-center space-y-4 animate-fadeIn">
          <div className="w-16 h-16 rounded-3xl bg-[#10B981]/15 text-[#059669] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-black text-[#1B192E]">今日挑战达成！</h2>
          <p className="text-xs text-[#5E5D6D]">
            正确率：<strong className="text-[#059669] font-bold text-sm">{Math.round((correctCount / questions.length) * 100)}%</strong> ({correctCount} / {questions.length})
          </p>

          <div className="bg-[#ECFDF5] p-4 rounded-2xl text-left border border-[#A7F3D0] space-y-1">
            <div className="flex justify-between items-center text-xs font-bold text-[#059669]">
              <span>今日挑战达成奖励</span>
              <span className="text-base font-bold text-[#059669] font-['Inter']">+500 XP 🔥</span>
            </div>
            <p className="text-[11px] text-[#065F46]">
              打卡成功！连续学习天数已刷新，大脑认知神经回路更加坚固。
            </p>
          </div>

          <button
            onClick={() => navigate('/')}
            className="w-full py-3.5 rounded-2xl bg-[#6C4CF1] hover:bg-[#532CD8] text-white font-bold text-xs shadow-md transition-all"
          >
            返回首页
          </button>
        </div>
      ) : (
        /* Playing */
        <div className="w-full flex flex-col items-center space-y-4">
          <div className="w-full bg-[#F6F1FF] h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#6C4CF1] transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>

          <div className="w-full bg-white rounded-3xl p-6 border border-white/90 shadow-[0_8px_30px_rgba(23,21,42,0.06)] space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#F0EBFF] text-[#532CD8]">
                {currentQ.category}
              </span>
              <span className="text-[11px] text-[#5E5D6D]">
                第 {currentIndex + 1} / {questions.length} 题
              </span>
            </div>

            <h3 className="text-sm md:text-base font-bold text-[#1B192E] leading-snug">
              {currentQ.question}
            </h3>

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
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-900 shadow-sm'
                        : showWrong
                        ? 'bg-red-50 border-red-400 text-red-900'
                        : 'bg-[#FCFBFE] hover:bg-[#F6F1FF] border-[#E8E5F0] text-[#1B192E]'
                    }`}
                  >
                    <span>{opt}</span>
                    {showSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 ml-2" />}
                    {showWrong && <XCircle className="w-4 h-4 text-red-500 shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>

            {isAnswered && (
              <div className="p-3.5 rounded-2xl bg-[#F6F1FF] border border-[#E4DFFD] space-y-2 animate-fadeIn">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#532CD8]">
                  <Sparkles className="w-3.5 h-3.5 text-[#FFB72B]" />
                  <span>核心解析</span>
                </div>
                <p className="text-xs text-[#484555] leading-relaxed">
                  {currentQ.explanation}
                </p>
                <button
                  onClick={handleNext}
                  className="w-full mt-2 py-2.5 bg-[#6C4CF1] hover:bg-[#532CD8] text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1"
                >
                  <span>{currentIndex < questions.length - 1 ? '下一题' : '提交挑战报告'}</span>
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

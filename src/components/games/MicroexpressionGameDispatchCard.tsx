import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, CheckCircle2, ChevronDown, ChevronUp, Eye, HelpCircle, XCircle } from 'lucide-react';
import { GameType, PsychologyLaw } from '../../types';
import { getMicroexpressionsForGame } from '../../data/microexpressionLaws';
import { useApp } from '../../context/AppContext';
import { gameAudio } from '../../utils/gameAudio';

interface MicroexpressionGameDispatchCardProps {
  gameId: GameType;
  theme?: 'dark' | 'light';
  compact?: boolean;
}

export const MicroexpressionGameDispatchCard: React.FC<MicroexpressionGameDispatchCardProps> = ({
  gameId,
  theme = 'light',
  compact = false,
}) => {
  const navigate = useNavigate();
  const { user, updateLawMastery, addXP } = useApp();
  const dispatchedLaws = getMicroexpressionsForGame(gameId);

  const [expandedLawId, setExpandedLawId] = useState<string | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});

  if (dispatchedLaws.length === 0) return null;

  const isDark = theme === 'dark';

  const handleToggleLaw = (id: string) => {
    gameAudio.playTap();
    setExpandedLawId((prev) => (prev === id ? null : id));
  };

  const handleAnswer = (law: PsychologyLaw, optionIdx: number) => {
    if (selectedAnswers[law.id] !== undefined) return;
    setSelectedAnswers((prev) => ({ ...prev, [law.id]: optionIdx }));
    const isCorrect = optionIdx === law.correctAnswer;
    const prevMastery = user?.lawMasteryMap?.[law.id] || 0;

    if (isCorrect) {
      gameAudio.playSuccess();
      updateLawMastery(law.id, Math.max(prevMastery, 95));
      addXP(20, `完成微表情实战解答 · ${law.codeId || law.nameZh}`);
    } else {
      gameAudio.playMistake();
      updateLawMastery(law.id, Math.max(prevMastery, 65));
      addXP(5, `参与微表情情境辨析 · ${law.codeId || law.nameZh}`);
    }
  };

  return (
    <div
      className={`w-full rounded-2xl border p-4 sm:p-5 text-left space-y-3 transition-all ${
        isDark
          ? 'bg-white/[0.05] border-white/15 text-stone-100'
          : 'bg-stone-50/90 border-stone-200/90 text-stone-900'
      }`}
    >
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-current/10">
        <div className="space-y-0.5">
          <div className={`flex items-center gap-2 text-[11px] font-mono font-bold ${isDark ? 'text-amber-300' : 'text-indigo-800'}`}>
            <Eye className="w-3.5 h-3.5 shrink-0" />
            <span>本关微表情心理学分派专题 · {dispatchedLaws.length} 项动作解码与情景解答</span>
          </div>
          {!compact && (
            <p className={`text-xs leading-relaxed ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>
              结合本游戏训练目标，展开下方分派定律即可体验真实故事场景并当场答题检验（答对立即同步提升定律掌握度 +20 XP）。
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => navigate('/learn?mode=microexpressions')}
          className={`text-[11px] font-semibold underline-offset-4 hover:underline whitespace-nowrap shrink-0 self-start sm:self-center cursor-pointer ${
            isDark ? 'text-amber-300' : 'text-indigo-700'
          }`}
        >
          查看微表情 10 律分类总榜 →
        </button>
      </div>

      {/* Dispatched Laws Interactive Accordion List */}
      <div className="space-y-2.5">
        {dispatchedLaws.map((law) => {
          const isOpen = expandedLawId === law.id;
          const mastery = user?.lawMasteryMap?.[law.id] || 0;
          const chosenIdx = selectedAnswers[law.id];
          const answered = chosenIdx !== undefined;
          const isCorrect = chosenIdx === law.correctAnswer;

          return (
            <div
              key={law.id}
              className={`rounded-xl border transition-all overflow-hidden ${
                isDark
                  ? 'bg-black/30 border-white/12'
                  : 'bg-white border-stone-200/80 shadow-2xs'
              }`}
            >
              <button
                type="button"
                onClick={() => handleToggleLaw(law.id)}
                className="w-full px-3.5 py-2.5 flex items-center justify-between gap-3 text-left cursor-pointer"
              >
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className={`flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] font-mono tabular-nums ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                    <span className={`font-bold ${isDark ? 'text-amber-300' : 'text-stone-900'}`}>
                      {law.codeId}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{law.actionUnitCode}</span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {law.categoryZh}分类排行 #{law.categoryRank}
                    </span>
                    {mastery >= 80 && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className={`font-sans font-bold ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
                          已掌握 {mastery}%
                        </span>
                      </>
                    )}
                  </div>
                  <div className={`text-xs sm:text-sm font-bold leading-snug ${isDark ? 'text-white' : 'text-stone-900'}`}>
                    {law.nameZh}
                    {law.storyScenario && (
                      <span className={`ml-2 text-[11px] font-normal ${isDark ? 'text-amber-200/80' : 'text-amber-800'}`}>
                        「{law.storyScenario.title}」
                      </span>
                    )}
                  </div>
                </div>

                <div className={`flex items-center gap-1 text-[11px] font-semibold shrink-0 whitespace-nowrap ${isDark ? 'text-amber-300' : 'text-indigo-700'}`}>
                  <span>{isOpen ? '收起体验' : '故事与答题'}</span>
                  {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {isOpen && (
                <div className={`px-3.5 pb-3.5 pt-2.5 border-t space-y-3 text-xs ${isDark ? 'border-white/10 text-stone-200' : 'border-stone-100 text-stone-700'}`}>
                  <p className="leading-relaxed">{law.shortExplanation}</p>

                  {law.storyScenario && (
                    <div className={`p-3 rounded-lg border space-y-1.5 ${isDark ? 'bg-amber-500/10 border-amber-400/25' : 'bg-amber-50/70 border-amber-200/80'}`}>
                      <div className={`flex items-center justify-between gap-2 font-bold ${isDark ? 'text-amber-300' : 'text-amber-900'}`}>
                        <span className="flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>故事场景 · {law.storyScenario.title}</span>
                        </span>
                        <span className="text-[10px] font-normal opacity-80">{law.storyScenario.setting}</span>
                      </div>
                      <p className="leading-relaxed">{law.storyScenario.narrative}</p>
                      <p className={`text-[11px] pt-0.5 ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>
                        <strong>解码要点：</strong>
                        {law.storyScenario.decodingBreakdown}
                      </p>
                    </div>
                  )}

                  {law.observableSigns && (
                    <div className={`text-[11px] ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>
                      <strong>可观察迹象：</strong>
                      {law.observableSigns.join(' · ')}
                    </div>
                  )}

                  {law.limitations && (
                    <div className={`p-2.5 rounded-lg border text-[11px] leading-relaxed ${isDark ? 'bg-rose-950/40 border-rose-400/25 text-rose-200' : 'bg-rose-50/80 border-rose-200 text-rose-900'}`}>
                      <strong>科学局限提醒：</strong>
                      {law.limitations}
                    </div>
                  )}

                  {/* Interactive Question */}
                  <div className={`pt-2 border-t space-y-2 ${isDark ? 'border-white/10' : 'border-stone-200/70'}`}>
                    <div className={`flex items-start gap-1.5 font-bold ${isDark ? 'text-white' : 'text-stone-900'}`}>
                      <HelpCircle className={`w-4 h-4 shrink-0 mt-0.5 ${isDark ? 'text-amber-400' : 'text-indigo-600'}`} />
                      <span>情境检验解答：{law.question}</span>
                    </div>

                    <div className="space-y-1.5">
                      {law.answers.map((opt, idx) => {
                        const isPicked = chosenIdx === idx;
                        const isRightOpt = idx === law.correctAnswer;

                        let btnCls = isDark
                          ? 'bg-white/5 hover:bg-white/10 border-white/15 text-stone-200'
                          : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-800';

                        if (answered) {
                          if (isRightOpt) {
                            btnCls = isDark
                              ? 'bg-emerald-950/70 border-emerald-400 text-emerald-100 font-bold'
                              : 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold';
                          } else if (isPicked) {
                            btnCls = isDark
                              ? 'bg-rose-950/70 border-rose-400 text-rose-100'
                              : 'bg-rose-50 border-rose-400 text-rose-900';
                          } else {
                            btnCls = isDark
                              ? 'bg-black/20 border-white/5 text-stone-500 opacity-60'
                              : 'bg-stone-50/50 border-stone-200 text-stone-400 opacity-70';
                          }
                        }

                        return (
                          <button
                            key={idx}
                            type="button"
                            disabled={answered}
                            onClick={() => handleAnswer(law, idx)}
                            className={`w-full text-left px-3 py-2 rounded-lg border text-xs transition-all flex items-center justify-between gap-2 cursor-pointer ${btnCls}`}
                          >
                            <span>
                              <strong className="font-mono mr-1.5">{String.fromCharCode(65 + idx)}.</strong>
                              {opt}
                            </span>
                            {answered && isRightOpt && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                            {answered && isPicked && !isRightOpt && <XCircle className="w-4 h-4 text-rose-500 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>

                    {answered && (
                      <div className={`p-2.5 rounded-lg text-[11px] leading-relaxed ${isDark ? 'bg-white/5 text-stone-200' : 'bg-stone-100 text-stone-800'}`}>
                        <strong className={isCorrect ? 'text-emerald-600' : 'text-amber-700'}>
                          {isCorrect ? '✓ 解码精准（+20 XP，定律内化度已更新）：' : '✕ 纠偏提示（+5 XP）：'}
                        </strong>
                        {law.keyTakeaway}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

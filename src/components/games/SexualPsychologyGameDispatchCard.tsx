import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  HeartHandshake,
  HelpCircle,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { GameType, PsychologyLaw } from '../../types';
import { getSexualLawsForGame, SEXUAL_PSYCHOLOGY_LAWS } from '../../data/sexualPsychologyLaws';
import { drawNonRepeatingLawOrder, cryptoShuffle } from '../../utils/aleatoricEngine';
import { useApp } from '../../context/AppContext';
import { gameAudio } from '../../utils/gameAudio';

interface SexualPsychologyGameDispatchCardProps {
  gameId: GameType;
  theme?: 'dark' | 'light';
  compact?: boolean;
}

const DISPATCH_LIMIT = 4;

export const SexualPsychologyGameDispatchCard: React.FC<SexualPsychologyGameDispatchCardProps> = ({
  gameId,
  theme = 'light',
  compact = false,
}) => {
  const navigate = useNavigate();
  const { user, updateLawMastery, addXP } = useApp();

  const [drawSeed, setDrawSeed] = useState(0);
  const [expandedLawId, setExpandedLawId] = useState<string | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});

  // CSPRNG non-repeating draw of Sexual Psychology cards matched to this Arena game
  const dispatchedBatch = useMemo(() => {
    const matched = getSexualLawsForGame(gameId);
    const pool = matched.length >= DISPATCH_LIMIT ? matched : SEXUAL_PSYCHOLOGY_LAWS;
    const ordered = drawNonRepeatingLawOrder(pool, `arena-sexual::${gameId}`, {
      markHeadCount: DISPATCH_LIMIT,
    });
    return ordered.slice(0, DISPATCH_LIMIT).map((law) => {
      const tagged = cryptoShuffle(
        law.answers.map((text, idx) => ({ text, isRight: idx === law.correctAnswer }))
      );
      return {
        law,
        shuffledAnswers: tagged.map((t) => t.text),
        shuffledCorrectIdx: tagged.findIndex((t) => t.isRight),
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId, drawSeed]);

  if (dispatchedBatch.length === 0) return null;

  const isDark = theme === 'dark';

  const handleReshuffleBatch = () => {
    gameAudio.playSuccess();
    setExpandedLawId(null);
    setSelectedAnswers({});
    setDrawSeed((s) => s + 1);
  };

  const handleToggleLaw = (id: string) => {
    gameAudio.playTap();
    setExpandedLawId((prev) => (prev === id ? null : id));
  };

  const handleAnswer = (law: PsychologyLaw, pickedIdx: number, correctIdx: number) => {
    if (selectedAnswers[law.id] !== undefined) return;
    setSelectedAnswers((prev) => ({ ...prev, [law.id]: pickedIdx }));
    const isCorrect = pickedIdx === correctIdx;
    const prevMastery = user?.lawMasteryMap?.[law.id] || 0;

    if (isCorrect) {
      gameAudio.playSuccess();
      updateLawMastery(law.id, Math.max(prevMastery, 92));
      addXP(15, `破译性心理学科学律卡 · ${law.codeId || law.nameZh}`);
    } else {
      gameAudio.playMistake();
      updateLawMastery(law.id, Math.max(prevMastery, 65));
      addXP(5, `研习性健康与同意边界 · ${law.codeId || law.nameZh}`);
    }
  };

  return (
    <div
      className={`w-full rounded-2xl border p-4 sm:p-5 text-left space-y-3 transition-all ${
        isDark
          ? 'bg-purple-950/35 border-purple-400/25 text-stone-100'
          : 'bg-purple-50/55 border-purple-200/90 text-stone-900'
      }`}
    >
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-current/10">
        <div className="space-y-0.5">
          <div className={`flex items-center gap-2 text-[11px] font-mono font-bold ${isDark ? 'text-purple-300' : 'text-purple-900'}`}>
            <HeartHandshake className="w-3.5 h-3.5 shrink-0" />
            <span>本关性心理学 · CSPRNG 随机防重分派 ({dispatchedBatch.length} 律)</span>
          </div>
          {!compact && (
            <p className={`text-xs leading-relaxed ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>
              已从 100 条性心理学与亲密健康卡中按本关主题真随机抽取 {dispatchedBatch.length} 条未做词条，绝不重复推送。
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          <button
            type="button"
            onClick={handleReshuffleBatch}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
              isDark
                ? 'bg-purple-500/20 border-purple-400/35 text-purple-200 hover:bg-purple-500/30'
                : 'bg-white border-purple-300 text-purple-900 hover:bg-purple-50'
            }`}
          >
            <RefreshCw className="w-3 h-3" />
            <span>换一批真随机题</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/learn?mode=sexual')}
            className={`text-[11px] font-semibold underline-offset-4 hover:underline whitespace-nowrap shrink-0 cursor-pointer ${
              isDark ? 'text-amber-300' : 'text-purple-900'
            }`}
          >
            100 律分类总库 →
          </button>
        </div>
      </div>

      {/* Dispatched Non-Repeating Sexual Psychology Laws */}
      <div className="space-y-2">
        {dispatchedBatch.map(({ law, shuffledAnswers, shuffledCorrectIdx }) => {
          const isOpen = expandedLawId === law.id;
          const mastery = user?.lawMasteryMap?.[law.id] || 0;
          const chosenIdx = selectedAnswers[law.id];
          const answered = chosenIdx !== undefined;
          const isCorrect = chosenIdx === shuffledCorrectIdx;

          return (
            <div
              key={law.id}
              className={`rounded-xl border transition-all overflow-hidden ${
                isDark
                  ? 'bg-black/30 border-white/12'
                  : 'bg-white border-stone-200/85 shadow-2xs'
              }`}
            >
              <button
                type="button"
                onClick={() => handleToggleLaw(law.id)}
                className="w-full px-3.5 py-2.5 flex items-center justify-between gap-3 text-left cursor-pointer"
              >
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className={`flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] font-mono tabular-nums ${isDark ? 'text-stone-400' : 'text-stone-500'}`}>
                    <span className={`font-bold ${isDark ? 'text-purple-300' : 'text-purple-900'}`}>
                      {law.codeId}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{law.sexualCategory}</span>
                    <span aria-hidden="true">·</span>
                    <span>{law.sexualContext}</span>
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
                  </div>
                </div>

                <div className={`flex items-center gap-1 text-[11px] font-semibold shrink-0 whitespace-nowrap ${isDark ? 'text-purple-300' : 'text-purple-800'}`}>
                  <span>{isOpen ? '收起剖析' : '原理与边界答题'}</span>
                  {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {isOpen && (
                <div className={`px-3.5 pb-3.5 pt-2.5 border-t space-y-3 text-xs ${isDark ? 'border-white/10 text-stone-200' : 'border-stone-100 text-stone-700'}`}>
                  {law.sexualCoreConcept && (
                    <p className="leading-relaxed">
                      <strong>科学原理核心：</strong>
                      {law.sexualCoreConcept}
                    </p>
                  )}

                  {law.sexualAppliedAngle && (
                    <div className={`p-3 rounded-lg border space-y-1 ${isDark ? 'bg-purple-500/10 border-purple-400/25' : 'bg-purple-50/70 border-purple-200/80'}`}>
                      <div className={`font-bold flex items-center gap-1.5 ${isDark ? 'text-purple-300' : 'text-purple-900'}`}>
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{law.sexualContext} · 实践与同意边界</span>
                      </div>
                      <p className="leading-relaxed">{law.sexualAppliedAngle}</p>
                    </div>
                  )}

                  {/* CSPRNG Shuffled Quiz */}
                  <div className={`pt-2 border-t space-y-2 ${isDark ? 'border-white/10' : 'border-stone-200/70'}`}>
                    <div className={`flex items-start gap-1.5 font-bold ${isDark ? 'text-white' : 'text-stone-900'}`}>
                      <HelpCircle className={`w-4 h-4 shrink-0 mt-0.5 ${isDark ? 'text-purple-400' : 'text-purple-700'}`} />
                      <span>{law.question}</span>
                    </div>

                    <div className="space-y-1.5">
                      {shuffledAnswers.map((opt, idx) => {
                        const isPicked = chosenIdx === idx;
                        const isRightOpt = idx === shuffledCorrectIdx;

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
                            onClick={() => handleAnswer(law, idx, shuffledCorrectIdx)}
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
                          {isCorrect ? '✓ 理解精准（+15 XP，词条掌握度已提升）：' : '✕ 科学边界提醒（+5 XP）：'}
                        </strong>
                        {law.healthyBoundary || law.keyTakeaway}
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

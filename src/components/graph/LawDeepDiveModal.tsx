import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  BookOpen,
  HelpCircle,
  CheckCircle2,
  XCircle,
  Bookmark,
  ArrowRight,
  Gamepad2,
  GitBranch,
  Award,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { PsychologyLaw } from '../../types';
import {
  CATEGORY_CLUSTER_META,
  GraphRelationType,
  LawGraphNode,
  RELATION_META,
} from '../../utils/knowledgeGraphBuilder';
import { gameAudio } from '../../utils/gameAudio';

export interface ConnectedNeighborPreview {
  node: LawGraphNode;
  relationType: GraphRelationType;
  reason: string;
  weight: number;
}

interface LawDeepDiveModalProps {
  isOpen: boolean;
  law: PsychologyLaw | null;
  graphNode: LawGraphNode | null;
  neighbors: ConnectedNeighborPreview[];
  trailStepNumber: number | null;
  isBookmarked: boolean;
  initialTab?: 'deep-dive' | 'mini-quiz';
  onClose: () => void;
  onToggleBookmark: (lawId: string) => void;
  onCompleteMiniQuiz: (lawId: string, isCorrect: boolean) => void;
  onJumpToNeighbor: (neighborId: string, relationType: GraphRelationType, reason: string) => void;
}

function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export const LawDeepDiveModal: React.FC<LawDeepDiveModalProps> = ({
  isOpen,
  law,
  graphNode,
  neighbors,
  trailStepNumber,
  isBookmarked,
  initialTab = 'deep-dive',
  onClose,
  onToggleBookmark,
  onCompleteMiniQuiz,
  onJumpToNeighbor,
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'deep-dive' | 'mini-quiz'>(initialTab);
  const [selectedAnswerIdx, setSelectedAnswerIdx] = useState<number | null>(null);
  const [selectedExpChoice, setSelectedExpChoice] = useState<'A' | 'B' | null>(null);

  // Reset quiz state whenever switching to a new law node
  useEffect(() => {
    setActiveTab(initialTab);
    setSelectedAnswerIdx(null);
    setSelectedExpChoice(null);
  }, [law?.id, initialTab]);

  // Escape key dismissal
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  // Deterministically shuffle quiz options so correctAnswer is not locked to index 0
  const shuffledQuiz = useMemo(() => {
    if (!law || !Array.isArray(law.answers) || law.answers.length === 0) {
      return { options: [] as string[], correctIndex: 0 };
    }
    const items = law.answers.map((text, origIdx) => ({
      text,
      isCorrect: origIdx === law.correctAnswer,
      sortKey: hashString(`${law.id}::${origIdx}::${text}`),
    }));
    items.sort((a, b) => a.sortKey - b.sortKey);
    return {
      options: items.map((i) => i.text),
      correctIndex: Math.max(
        0,
        items.findIndex((i) => i.isCorrect)
      ),
    };
  }, [law]);

  if (!isOpen || !law || !graphNode) return null;

  const catMeta = CATEGORY_CLUSTER_META[graphNode.categoryZh];
  const isAnswered = selectedAnswerIdx !== null;
  const isCorrect = isAnswered && selectedAnswerIdx === shuffledQuiz.correctIndex;

  const handleSelectQuizOption = (idx: number) => {
    if (isAnswered) return;
    setSelectedAnswerIdx(idx);
    const correct = idx === shuffledQuiz.correctIndex;
    if (correct) {
      gameAudio.playSuccess();
    } else {
      gameAudio.playTap();
    }
    onCompleteMiniQuiz(law.id, correct);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-950/60 backdrop-blur-xs animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="deep-dive-modal-title"
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] rounded-2xl bg-[#FBF9F4] border border-[#C6B9A0] shadow-2xl flex flex-col overflow-hidden">
        {/* Top Accent Rule */}
        <div className="h-1 w-full shrink-0" style={{ backgroundColor: catMeta.color }} />

        {/* Modal Header */}
        <div className="px-5 sm:px-7 pt-5 pb-4 border-b border-stone-200/90 space-y-3 shrink-0">
          <div className="flex items-center justify-between gap-3">
            {/* Unboxed Curatorial Accession Line */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-stone-600 font-numeric tabular-nums">
              {trailStepNumber !== null && (
                <>
                  <span className="font-semibold text-amber-800">
                    轨迹第 {String(trailStepNumber).padStart(2, '0')} 站
                  </span>
                  <span aria-hidden="true" className="text-stone-300">·</span>
                </>
              )}
              <span className="font-mono font-bold text-stone-900">{graphNode.codeId}</span>
              <span aria-hidden="true" className="text-stone-300">·</span>
              <span className="font-semibold" style={{ color: catMeta.color }}>
                {graphNode.categoryZh}领域
              </span>
              <span aria-hidden="true" className="text-stone-300">·</span>
              <span>难度 {law.difficulty}</span>
              <span aria-hidden="true" className="text-stone-300">·</span>
              <span>掌握度 {graphNode.mastery}%</span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  gameAudio.playTap();
                  onToggleBookmark(law.id);
                }}
                aria-label="收藏该定律"
                className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${
                  isBookmarked
                    ? 'bg-amber-50 border-amber-400 text-amber-700'
                    : 'bg-white border-[#D4CBB8] text-stone-600 hover:text-stone-950'
                }`}
                title={isBookmarked ? '取消收藏' : '加入收藏'}
              >
                <Bookmark
                  className={`w-4 h-4 ${isBookmarked ? 'fill-amber-600 text-amber-600' : ''}`}
                />
              </button>

              <button
                type="button"
                onClick={onClose}
                aria-label="关闭弹窗"
                className="w-9 h-9 rounded-lg bg-white border border-[#D4CBB8] text-stone-600 hover:text-stone-950 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <h2
              id="deep-dive-modal-title"
              className="font-serif-editorial text-xl sm:text-2xl font-bold text-stone-900 leading-snug"
            >
              {law.nameZh}
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 italic font-['Cormorant_Garamond','Playfair_Display',serif]">
              {law.nameEn}
              {law.actionUnitCode ? ` · ${law.actionUnitCode}` : ''}
            </p>
          </div>

          {/* Mode Tabs: Deep Dive vs Mini-Quiz */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[#EFE9DC] border border-[#D4CBB8] w-fit">
            <button
              type="button"
              onClick={() => {
                gameAudio.playTap();
                setActiveTab('deep-dive');
              }}
              className={`min-h-[36px] px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'deep-dive'
                  ? 'bg-stone-900 text-amber-50 shadow-2xs'
                  : 'text-stone-700 hover:text-stone-950'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>深度解析 (Deep Dive)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                gameAudio.playTap();
                setActiveTab('mini-quiz');
              }}
              className={`min-h-[36px] px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'mini-quiz'
                  ? 'bg-stone-900 text-amber-50 shadow-2xs'
                  : 'text-stone-700 hover:text-stone-950'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>随堂微测验 (+25 XP)</span>
            </button>
          </div>
        </div>

        {/* Scrollable Modal Body */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-5 flex-1">
          {activeTab === 'deep-dive' ? (
            <>
              {/* Core Principle & Mechanism */}
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-white border border-[#DED6C6] space-y-2">
                  <div className="text-xs font-semibold text-stone-900">核心释义</div>
                  <p className="text-sm text-stone-800 leading-relaxed font-medium">
                    {law.shortExplanation}
                  </p>
                  {law.detailedExplanation && law.detailedExplanation !== law.shortExplanation && (
                    <p className="text-xs text-stone-600 leading-relaxed pt-1 border-t border-stone-200/70">
                      {law.detailedExplanation}
                    </p>
                  )}
                </div>

                {/* Psychological Mechanism */}
                <div className="p-4 rounded-xl bg-[#F5F0E6] border border-[#DDD4C2] space-y-1.5">
                  <div className="text-xs font-semibold text-stone-900">底层心理机制</div>
                  <p className="text-xs text-stone-700 leading-relaxed">{law.whyItHappens}</p>
                </div>

                {/* Narrative Story Scenario (if Microexpression) or Real-Life Examples */}
                {law.storyScenario ? (
                  <div className="p-4 rounded-xl bg-white border border-[#DED6C6] space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-indigo-900">
                        故事场景：{law.storyScenario.title}
                      </span>
                      <span className="text-stone-500">{law.storyScenario.setting}</span>
                    </div>
                    <p className="text-xs text-stone-700 leading-relaxed">
                      {law.storyScenario.narrative}
                    </p>
                    <p className="text-xs text-stone-600 leading-relaxed pt-1.5 border-t border-stone-200/70">
                      <span className="font-semibold text-stone-800">微动作拆解：</span>
                      {law.storyScenario.decodingBreakdown}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-white border border-[#DED6C6] space-y-1">
                      <div className="text-[11px] font-semibold text-stone-900">生活实景</div>
                      <p className="text-xs text-stone-600 leading-relaxed">
                        {law.realLifeExample}
                      </p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-white border border-[#DED6C6] space-y-1">
                      <div className="text-[11px] font-semibold text-stone-900">
                        {law.isLoveCodex ? '亲密关系启示' : '行动关键备忘'}
                      </div>
                      <p className="text-xs text-stone-600 leading-relaxed">
                        {law.keyTakeaway}
                      </p>
                    </div>
                  </div>
                )}

                {/* Scientific Boundaries / Limitations */}
                {(law.limitations || (law.observableSigns && law.observableSigns.length > 0)) && (
                  <div className="p-3.5 rounded-xl bg-white border border-[#DED6C6] space-y-1.5 text-xs text-stone-600">
                    {law.observableSigns && law.observableSigns.length > 0 && (
                      <div>
                        <span className="font-semibold text-stone-800">可观察线索：</span>
                        <span>{law.observableSigns.join(' · ')}</span>
                      </div>
                    )}
                    {law.limitations && (
                      <div>
                        <span className="font-semibold text-amber-900">科学边界：</span>
                        <span>{law.limitations}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Next Hops along the Concept Trail */}
              {neighbors.length > 0 && (
                <div className="pt-2 border-t border-stone-200/90 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-stone-900 inline-flex items-center gap-1.5">
                      <GitBranch className="w-3.5 h-3.5 text-amber-800" />
                      <span>延续概念轨迹 · 探索关联定律</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        gameAudio.playTap();
                        setActiveTab('mini-quiz');
                      }}
                      className="text-xs font-semibold text-amber-800 hover:text-amber-950 cursor-pointer whitespace-nowrap"
                    >
                      做一道微测验检验理解 →
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {neighbors.slice(0, 4).map((item, idx) => {
                      const relMeta = RELATION_META[item.relationType];
                      const nCat = CATEGORY_CLUSTER_META[item.node.categoryZh];
                      return (
                        <button
                          key={`${item.node.id}-${idx}`}
                          type="button"
                          onClick={() =>
                            onJumpToNeighbor(item.node.id, item.relationType, item.reason)
                          }
                          className="p-3 rounded-xl bg-white hover:bg-[#F5EFE3] border border-[#DED6C6] hover:border-stone-600 text-left transition-colors cursor-pointer flex items-center justify-between gap-2 group"
                        >
                          <div className="min-w-0 space-y-0.5">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-900 truncate">
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: nCat.color }}
                              />
                              <span className="truncate">{item.node.nameZh}</span>
                            </div>
                            <div className="text-[10.5px] text-stone-500 truncate">
                              <span className="font-medium" style={{ color: relMeta.color }}>
                                {relMeta.label}
                              </span>
                              <span className="mx-1 text-stone-300">·</span>
                              <span>{item.reason}</span>
                            </div>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-900 shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Mini-Quiz Mode */
            <div className="space-y-5">
              {/* Part A: Core Concept Verification Question */}
              <div className="p-4 sm:p-5 rounded-xl bg-white border border-[#DED6C6] space-y-4">
                <div className="flex items-center justify-between text-xs text-stone-500">
                  <span className="font-semibold text-stone-900 inline-flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                    <span>概念辨析微测验</span>
                  </span>
                  <span className="font-numeric tabular-nums">答对奖励 +25 XP · +15% 掌握度</span>
                </div>

                <p className="font-serif-editorial text-sm sm:text-base font-bold text-stone-900 leading-relaxed">
                  {law.question}
                </p>

                <div className="space-y-2">
                  {shuffledQuiz.options.map((opt, idx) => {
                    const isPicked = selectedAnswerIdx === idx;
                    const isRightOpt = idx === shuffledQuiz.correctIndex;

                    let cardStyle =
                      'bg-[#FBF9F4] border-[#DED6C6] text-stone-800 hover:border-stone-700 hover:bg-white';
                    if (isAnswered) {
                      if (isRightOpt) {
                        cardStyle = 'bg-emerald-50 border-emerald-500 text-emerald-950 font-semibold';
                      } else if (isPicked) {
                        cardStyle = 'bg-rose-50 border-rose-400 text-rose-950';
                      } else {
                        cardStyle = 'bg-stone-100/70 border-stone-200 text-stone-400';
                      }
                    }

                    return (
                      <button
                        key={`opt-${idx}`}
                        type="button"
                        disabled={isAnswered}
                        onClick={() => handleSelectQuizOption(idx)}
                        className={`w-full p-3.5 rounded-xl border text-left text-xs sm:text-[13px] leading-relaxed transition-colors flex items-start justify-between gap-3 ${
                          !isAnswered ? 'cursor-pointer' : 'cursor-default'
                        } ${cardStyle}`}
                      >
                        <span className="flex items-start gap-2.5 min-w-0">
                          <span className="font-mono font-bold text-stone-500 shrink-0">
                            {String.fromCharCode(65 + idx)}.
                          </span>
                          <span>{opt}</span>
                        </span>
                        {isAnswered && isRightOpt && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                        )}
                        {isAnswered && isPicked && !isRightOpt && (
                          <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {isAnswered && (
                  <div
                    className={`p-3.5 rounded-xl border text-xs leading-relaxed space-y-1 ${
                      isCorrect
                        ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                        : 'bg-amber-50/90 border-amber-300 text-stone-800'
                    }`}
                  >
                    <div className="font-semibold flex items-center gap-1.5">
                      {isCorrect ? (
                        <>
                          <Award className="w-4 h-4 text-emerald-700" />
                          <span>回答准确！已点亮概念轨迹节点并记录 +25 XP</span>
                        </>
                      ) : (
                        <span>思路微调：请看核心原理回顾</span>
                      )}
                    </div>
                    <p>{law.keyTakeaway}</p>
                  </div>
                )}
              </div>

              {/* Part B: Interactive Thought Experiment (when available) */}
              {law.experimentSetup && (
                <div className="p-4 rounded-xl bg-[#F5F0E6] border border-[#DDD4C2] space-y-3">
                  <div className="text-xs font-semibold text-stone-900">
                    情境对照推演
                  </div>
                  <p className="text-xs text-stone-700 leading-relaxed">
                    {law.experimentSetup.scenario}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        gameAudio.playTap();
                        setSelectedExpChoice('A');
                      }}
                      className={`p-3 rounded-xl border text-left text-xs transition-colors cursor-pointer ${
                        selectedExpChoice === 'A'
                          ? 'bg-white border-amber-700 text-stone-900 font-semibold'
                          : 'bg-white/75 border-[#D4CBB8] text-stone-700 hover:bg-white'
                      }`}
                    >
                      A. {law.experimentSetup.optionA.label}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        gameAudio.playTap();
                        setSelectedExpChoice('B');
                      }}
                      className={`p-3 rounded-xl border text-left text-xs transition-colors cursor-pointer ${
                        selectedExpChoice === 'B'
                          ? 'bg-white border-emerald-700 text-stone-900 font-semibold'
                          : 'bg-white/75 border-[#D4CBB8] text-stone-700 hover:bg-white'
                      }`}
                    >
                      B. {law.experimentSetup.optionB.label}
                    </button>
                  </div>
                  {selectedExpChoice && (
                    <p className="text-xs text-stone-700 leading-relaxed pt-1 border-t border-stone-300/70 font-numeric tabular-nums">
                      {law.experimentSetup.insight}（约 {law.experimentSetup.globalChoicePercentageA}% 受试者直觉倾向 A）
                    </p>
                  )}
                </div>
              )}

              {/* Continue Concept Trail from Quiz */}
              {neighbors.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <span className="text-xs text-stone-600">
                    下一站推荐关联概念：
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      onJumpToNeighbor(
                        neighbors[0].node.id,
                        neighbors[0].relationType,
                        neighbors[0].reason
                      )
                    }
                    className="min-h-[38px] px-4 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-50 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <span>沿轨迹跳至「{neighbors[0].node.nameZh}」</span>
                    <ArrowRight className="w-3.5 h-3.5 text-amber-300" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 sm:px-7 py-3.5 border-t border-stone-200/90 bg-[#F4EFE4] flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                gameAudio.playTap();
                onClose();
                navigate(`/law/${law.id}`);
              }}
              className="min-h-[40px] px-4 py-2 rounded-xl bg-white hover:bg-stone-100 border border-[#C6B9A0] text-stone-900 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>打开完整典藏条目</span>
            </button>

            <button
              type="button"
              onClick={() => {
                gameAudio.playTap();
                onClose();
                navigate(`/game/${law.relatedGame}`);
              }}
              className="min-h-[40px] px-4 py-2 rounded-xl bg-white hover:bg-stone-100 border border-[#C6B9A0] text-stone-900 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Gamepad2 className="w-3.5 h-3.5 text-amber-800" />
              <span>去竞技场实战</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-50 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            返回图谱画布
          </button>
        </div>
      </div>
    </div>
  );
};

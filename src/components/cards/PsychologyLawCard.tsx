import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, ChevronRight, CheckCircle2, Sparkles, Heart, Eye, Gamepad2, BookOpen, ShieldCheck, Shuffle, Scale, HeartHandshake } from 'lucide-react';
import { PsychologyLaw, CategoryZh } from '../../types';
import { useApp } from '../../context/AppContext';
import { gameAudio } from '../../utils/gameAudio';
import { getLawEmotionalMapping } from '../../data/emotionalLaws';
import { PSYCHOLOGY_GAMES } from '../../data/games';
import { toggleLawSpeech, useLawSpeech, LawSpeechSegment } from '../../utils/lawSpeechEngine';
import { SilverSpeechText, LawVoiceToggleSwitch } from '../ui/SilverSpeechText';

interface PsychologyLawCardProps {
  law: PsychologyLaw;
  compact?: boolean;
}

const CATEGORY_ART_PALETTE: Record<CategoryZh, { color: string; border: string; bgSoft: string; badgeText: string }> = {
  '认知': { color: '#4F46B8', border: 'hover:border-[#4F46B8]/40', bgSoft: 'bg-[#4F46B8]/[0.035]', badgeText: 'text-[#4338A6]' },
  '记忆': { color: '#0F766E', border: 'hover:border-[#0F766E]/40', bgSoft: 'bg-[#0F766E]/[0.035]', badgeText: 'text-[#0F766E]' },
  '决策': { color: '#157F5D', border: 'hover:border-[#157F5D]/40', bgSoft: 'bg-[#157F5D]/[0.035]', badgeText: 'text-[#157F5D]' },
  '社会': { color: '#6D3EC4', border: 'hover:border-[#6D3EC4]/40', bgSoft: 'bg-[#6D3EC4]/[0.035]', badgeText: 'text-[#5E32B0]' },
  '情绪': { color: '#A82442', border: 'hover:border-[#A82442]/40', bgSoft: 'bg-[#A82442]/[0.035]', badgeText: 'text-[#961D38]' },
  '行为': { color: '#B06014', border: 'hover:border-[#B06014]/40', bgSoft: 'bg-[#B06014]/[0.035]', badgeText: 'text-[#8E4B0C]' },
};

export const PsychologyLawCard: React.FC<PsychologyLawCardProps> = ({ law, compact = false }) => {
  const navigate = useNavigate();
  const { isBookmarked, toggleBookmark, user } = useApp();

  const bookmarked = isBookmarked(law.id);
  const mastery = (user?.lawMasteryMap && user.lawMasteryMap[law.id]) || 0;
  const isMastered = mastery >= 80;

  const [expanded, setExpanded] = React.useState(false);
  const { isSpeakingThisLaw, activeCpIndex, segments } = useLawSpeech(law.id);

  const emotionalMeta = getLawEmotionalMapping(law);

  const mechanismText = law.whyItHappens || law.detailedExplanation;
  const caseText = law.relationshipCase || law.realLifeExample;

  const handleToggleSpeech = () => {
    gameAudio.playTap();
    const speechSegments: LawSpeechSegment[] = [
      { key: 'title', text: law.nameZh, separator: '。' },
      { key: 'short', text: law.shortExplanation, separator: '。' },
    ];
    if (mechanismText) {
      speechSegments.push({ key: 'mechanism', text: mechanismText, separator: '。' });
    }
    if (caseText) {
      speechSegments.push({ key: 'case', text: caseText, separator: '。' });
    }
    if (law.keyTakeaway) {
      speechSegments.push({ key: 'takeaway', text: law.keyTakeaway, separator: '。' });
    }

    const turnedOn = toggleLawSpeech({
      lawId: law.id,
      segments: speechSegments,
    });
    if (turnedOn && !expanded) {
      setExpanded(true);
    }
  };

  const palette = CATEGORY_ART_PALETTE[law.categoryZh] || {
    color: '#6366F1',
    border: 'hover:border-indigo-400',
    bgSoft: 'bg-indigo-50/40',
    badgeText: 'text-indigo-700',
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // If clicking a button, link or bookmark, don't trigger accordion
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('a')) {
      return;
    }
    gameAudio.playSelect();
    setExpanded((prev) => !prev);
  };

  const handleCardKeyDown = (e: React.KeyboardEvent) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      gameAudio.playSelect();
      setExpanded((prev) => !prev);
    }
  };

  const collectionAccent = emotionalMeta
    ? emotionalMeta.themeColor
    : law.isLoveCodex || law.isLove100Psychology || law.isIntimateRelationship
    ? '#A82442'
    : law.isReversePsychology
    ? '#0F766E'
    : law.isCriminalPsychology
    ? '#961D38'
    : law.isSexualPsychology
    ? '#6D3EC4'
    : palette.color;

  return (
    <article
      tabIndex={0}
      role="region"
      aria-label={`${law.codeId || ''} ${law.nameZh}`}
      aria-expanded={expanded}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      className={`group art-museum-mat rounded-2xl p-5 sm:p-7 cursor-pointer relative overflow-hidden transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B45B8]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F6F3EC] ${palette.border} ${
        expanded ? 'ring-1 ring-[#181411]/15 shadow-lg' : ''
      }`}
    >
      {/* Top Chromatic Accent Ribbon */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px] opacity-85 group-hover:opacity-100 transition-opacity"
        style={{
          background: `linear-gradient(90deg, ${collectionAccent} 0%, ${palette.color} 55%, transparent 92%)`,
        }}
      />

      {/* Top Editorial Rubric & Museum Catalog Code */}
      <div className="flex items-start justify-between gap-2.5 mb-3.5 pb-3 border-b border-stone-200/70">
        <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-stone-600 flex-wrap min-w-0 pt-0.5">
          {law.codeId && (
            <span className="luxury-badge-ink font-mono text-[11px] font-bold text-[#181411] tracking-wider tabular-nums">
              {law.codeId}
            </span>
          )}

          {emotionalMeta && (
            <span
              className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 rounded-md border"
              style={{
                backgroundColor: `${emotionalMeta.themeColor}10`,
                borderColor: `${emotionalMeta.themeColor}30`,
                color: emotionalMeta.themeColor,
              }}
              title={`情感心理学第 ${emotionalMeta.sectionIndex} 板块 · 第 ${emotionalMeta.order} 律`}
            >
              <Heart className="w-2.5 h-2.5 fill-current" />
              <span>情感 50 律 · {String(emotionalMeta.order).padStart(2, '0')}</span>
            </span>
          )}

          {law.isLoveCodex && law.subTag && (
            <span
              className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 rounded-md border bg-[#FDF3F5] text-[#961D38] border-[#A82442]/20"
              title={law.loveDomainTitle || '爱情心理学典藏'}
            >
              <Heart className="w-2.5 h-2.5 fill-current" />
              <span>爱情 · {law.subTag}</span>
            </span>
          )}

          {law.isMicroexpression && (
            <span
              className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 rounded-md border bg-[#F4F1FC] text-[#4338A6] border-[#5B45B8]/20 tabular-nums"
              title={law.microDomainTitle || '微表情与面部动作'}
            >
              <Eye className="w-2.5 h-2.5" />
              <span>
                {law.categoryZh} #{law.categoryRank || 1}
                {law.actionUnitCode ? ` · ${law.actionUnitCode}` : ''}
              </span>
            </span>
          )}

          {law.isReversePsychology && (
            <span
              className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 rounded-md border bg-[#F1F8F7] text-[#0F766E] border-[#0F766E]/20"
              title={`逆向心理学 · ${law.reverseCategory || ''} · ${law.reverseScenario || ''}`}
            >
              <Shuffle className="w-2.5 h-2.5" />
              <span>{law.reverseCategory}</span>
            </span>
          )}

          {law.isCriminalPsychology && (
            <span
              className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 rounded-md border bg-[#FDF3F5] text-[#961D38] border-[#A82442]/20"
              title={`犯罪心理学 · ${law.criminalCategory || ''} · ${law.criminalContext || ''}`}
            >
              <Scale className="w-2.5 h-2.5" />
              <span>{law.criminalCategory}</span>
            </span>
          )}

          {law.isSexualPsychology && (
            <span
              className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 rounded-md border bg-[#F7F3FC] text-[#5E32B0] border-[#6D3EC4]/20"
              title={`性心理学 · ${law.sexualPillar || ''} · ${law.sexualCategory || ''} · ${law.sexualContext || ''}`}
            >
              <HeartHandshake className="w-2.5 h-2.5" />
              <span>{law.sexualCategory}</span>
            </span>
          )}

          {law.isLove100Psychology && (
            <span
              className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 rounded-md border bg-[#FDF3F5] text-[#961D38] border-[#A82442]/20"
              title={`恋爱心理学 100 律 · ${law.love100Pillar || ''} · ${law.love100Category || ''} · ${law.love100Context || ''}`}
            >
              <Heart className="w-2.5 h-2.5 fill-[#A82442]/25 text-[#961D38]" />
              <span>{law.love100Category}</span>
            </span>
          )}

          {law.isIntimateRelationship && (
            <span
              className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 rounded-md border bg-[#FDF3F5] text-[#961D38] border-[#A82442]/20"
              title={`亲密关系心理学 100 律 · ${law.intimatePillar || ''} · ${law.intimateCategory || ''} · ${law.intimateContext || ''}`}
            >
              <HeartHandshake className="w-2.5 h-2.5 text-[#961D38]" />
              <span>{law.intimateCategory}</span>
            </span>
          )}

          <span className="text-stone-300" aria-hidden="true">/</span>
          <span
            className="font-semibold text-xs flex items-center gap-1.5"
            style={{ color: palette.color }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full inline-block"
              style={{ backgroundColor: palette.color }}
            />
            {law.categoryZh}展厅
          </span>

          <span className="text-stone-300" aria-hidden="true">·</span>
          <span
            className={`text-[10.5px] px-1.5 py-0.5 rounded font-semibold border ${
              law.difficulty === 'Easy'
                ? 'bg-[#157F5D]/8 text-[#157F5D] border-[#157F5D]/20'
                : law.difficulty === 'Medium'
                ? 'bg-[#A66C1E]/10 text-[#8E5B13] border-[#A66C1E]/25'
                : 'bg-[#A82442]/8 text-[#961D38] border-[#A82442]/20'
            }`}
          >
            {law.difficulty}
          </span>

          {law.assignedCityZh && (
            <span className="hidden sm:inline-flex items-center gap-1.5">
              <span className="text-stone-300" aria-hidden="true">·</span>
              <span className="luxury-badge-ink text-[10.5px] font-sans">
                {law.assignedCityZh.split(' ')[0]}
              </span>
            </span>
          )}

          {law.xpReward && (
            <>
              <span className="text-stone-300" aria-hidden="true">·</span>
              <span className="font-numeric font-bold text-[#8E5B13] text-[11px] flex items-center gap-0.5">
                <Sparkles className="w-3 h-3 text-[#C8933B] fill-[#D4A656]" />
                +{law.xpReward} XP
              </span>
            </>
          )}

          {isMastered && (
            <>
              <span className="text-stone-300" aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1 font-semibold text-[#157F5D] text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 fill-[#157F5D] text-white" />
                <span>已内化</span>
              </span>
            </>
          )}
        </div>

        <div className="flex items-center shrink-0 -mr-2 -my-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              gameAudio.playTap();
              toggleBookmark(law.id);
            }}
            aria-pressed={bookmarked}
            aria-label={bookmarked ? `取消收藏 ${law.nameZh}` : `收藏 ${law.nameZh}`}
            title={bookmarked ? '已收藏至心智藏品' : '收藏本定律'}
            className="w-11 h-11 rounded-full flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B45B8]/45"
          >
            <span
              className={`luxury-surface-btn w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                bookmarked ? 'border-[#C8933B]/45 bg-[#FAF4E6]' : 'text-[#6E675F] hover:text-[#181411]'
              }`}
            >
              <Bookmark
                className={`w-4 h-4 transition-transform duration-150 ${
                  bookmarked ? 'fill-[#C8933B] text-[#9E6B1E] scale-105' : 'stroke-[1.6px]'
                }`}
              />
            </span>
          </button>
        </div>
      </div>

      {/* Main Headline & Subtitle */}
      <div className="mb-3.5">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-serif-editorial text-lg sm:text-xl font-bold text-[#181411] group-hover:text-black transition-colors leading-snug tracking-tight">
            <SilverSpeechText
              text={law.nameZh}
              isSpeaking={isSpeakingThisLaw}
              activeCpIndex={activeCpIndex}
              segmentRange={segments.title}
            />
          </h3>
          {law.chapter && (
            <span className="text-[11px] font-medium text-[#6E675F] shrink-0 font-serif-editorial italic hidden sm:inline">
              {law.chapter}
            </span>
          )}
        </div>
        <p className="text-xs text-[#6E675F] font-serif-editorial italic tracking-wide mt-1">
          {law.nameEn}
        </p>
      </div>

      {/* Literary Definition / Pull Quote */}
      <div
        className={`mb-4 rounded-xl p-4 border border-stone-200/75 border-l-[3px] transition-colors ${palette.bgSoft}`}
        style={{ borderLeftColor: collectionAccent }}
      >
        <p className="text-xs sm:text-[13.5px] text-[#2B2520] leading-relaxed font-normal">
          “
          <SilverSpeechText
            text={law.shortExplanation}
            isSpeaking={isSpeakingThisLaw}
            activeCpIndex={activeCpIndex}
            segmentRange={segments.short}
          />
          ”
        </p>
      </div>

      {/* Smooth Expandable In-Place Law Accordion Panel */}
      <div className={`accordion-smooth-collapse ${expanded ? 'is-expanded' : ''}`}>
        <div className="accordion-smooth-inner">
          <div className="pt-3.5 pb-2 mb-3.5 border-t border-stone-200/75 space-y-3.5 text-xs text-[#3B342D]">
            {/* 1. Core Mechanism */}
            <div className="space-y-1">
              <span className="font-bold text-[#181411] font-mono text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: palette.color }} />
                <span>底层机制与认知逻辑</span>
              </span>
              <p className="text-[#4F4740] leading-relaxed font-sans pl-3 border-l-2 border-stone-200">
                <SilverSpeechText
                  text={mechanismText}
                  isSpeaking={isSpeakingThisLaw}
                  activeCpIndex={activeCpIndex}
                  segmentRange={segments.mechanism}
                />
              </p>
            </div>

            {/* 2. Real-life / Relationship Case */}
            {caseText && (
              <div className="space-y-1">
                <span className="font-bold text-[#181411] font-mono text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C8933B]" />
                  <span>生活与亲密关系实案</span>
                </span>
                <p className="text-[#4F4740] leading-relaxed font-sans pl-3 border-l-2 border-[#D4A656]/45">
                  <SilverSpeechText
                    text={caseText}
                    isSpeaking={isSpeakingThisLaw}
                    activeCpIndex={activeCpIndex}
                    segmentRange={segments.case}
                  />
                </p>
              </div>
            )}

            {/* Story Scenario & Observable Signs for Microexpression Laws */}
            {law.storyScenario && (
              <div className="p-3.5 rounded-xl bg-[#FAF6EC] border border-[#D4A656]/35 space-y-1.5">
                <div className="flex items-center justify-between gap-2 text-[11px] font-bold text-[#7A5011]">
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-[#A66C1E]" />
                    <span>故事场景 · {law.storyScenario.title}</span>
                  </span>
                  <span className="text-[10px] font-normal text-[#8E5B13]">
                    {law.storyScenario.setting}
                  </span>
                </div>
                <p className="text-[#3B342D] leading-relaxed font-sans">
                  {law.storyScenario.narrative}
                </p>
                {law.observableSigns && law.observableSigns.length > 0 && (
                  <p className="text-[11px] text-[#4F4740] pt-1">
                    <strong className="text-[#181411]">可观察特征：</strong>
                    {law.observableSigns.join(' · ')}
                  </p>
                )}
                {law.limitations && (
                  <p className="text-[11px] text-[#961D38]">
                    <strong>科学局限：</strong>
                    {law.limitations}
                  </p>
                )}
              </div>
            )}

            {/* Reverse Psychology Ethical Boundary & Communication Contrast */}
            {law.isReversePsychology && law.healthyBoundary && (
              <div className="p-3.5 rounded-xl bg-[#F2F8F7] border border-[#0F766E]/25 space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#0F766E]">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#0F766E]" />
                  <span>逆向心理 · 诚实沟通与自主权边界（{law.reverseScenario}）</span>
                </div>
                <p className="text-[11px] text-[#3B342D] leading-relaxed">
                  {law.healthyBoundary}
                </p>
              </div>
            )}

            {/* Criminal Psychology Non-Diagnostic Scientific Boundary */}
            {law.isCriminalPsychology && law.healthyBoundary && (
              <div className="p-3.5 rounded-xl bg-[#FDF4F6] border border-[#A82442]/25 space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#961D38]">
                  <Scale className="w-3.5 h-3.5 text-[#961D38]" />
                  <span>犯罪心理学 · 研究与预防边界（{law.criminalContext}）</span>
                </div>
                <p className="text-[11px] text-[#3B342D] leading-relaxed">
                  {law.healthyBoundary}
                </p>
              </div>
            )}

            {/* Sexual Psychology Consent & Non-Diagnostic Scientific Boundary */}
            {law.isSexualPsychology && law.healthyBoundary && (
              <div className="p-3.5 rounded-xl bg-[#F8F5FC] border border-[#6D3EC4]/25 space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#5E32B0]">
                  <HeartHandshake className="w-3.5 h-3.5 text-[#5E32B0]" />
                  <span>性心理学 · 知情同意与科学非诊断边界（{law.sexualContext}）</span>
                </div>
                <p className="text-[11px] text-[#3B342D] leading-relaxed">
                  {law.healthyBoundary}
                </p>
              </div>
            )}

            {/* Love 100 Psychology Non-Diagnostic & Relational Safety Boundary */}
            {law.isLove100Psychology && law.healthyBoundary && (
              <div className="p-3.5 rounded-xl bg-[#FDF4F6] border border-[#A82442]/25 space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#961D38]">
                  <Heart className="w-3.5 h-3.5 text-[#961D38] fill-[#A82442]/20" />
                  <span>恋爱心理学 100 律 · 平等边界与安全提示（{law.love100Context}）</span>
                </div>
                <p className="text-[11px] text-[#3B342D] leading-relaxed">
                  {law.healthyBoundary}
                </p>
              </div>
            )}

            {/* Intimate Relationships 100 Psychology Non-Diagnostic & Safety Boundary */}
            {law.isIntimateRelationship && law.healthyBoundary && (
              <div className="p-3.5 rounded-xl bg-[#FDF4F6] border border-[#A82442]/25 space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#961D38]">
                  <HeartHandshake className="w-3.5 h-3.5 text-[#961D38]" />
                  <span>亲密关系心理学 100 律 · 自主平等与安全提示（{law.intimateContext}）</span>
                </div>
                <p className="text-[11px] text-[#3B342D] leading-relaxed">
                  {law.healthyBoundary}
                </p>
              </div>
            )}

            {/* Dispatched Arena Games */}
            {law.dispatchedGames && law.dispatchedGames.length > 0 && (
              <div className="flex items-center flex-wrap gap-1.5 pt-0.5 text-[11px]">
                <span className="text-[#6E675F] font-semibold flex items-center gap-1 mr-1">
                  <Gamepad2 className="w-3.5 h-3.5 text-[#5B45B8]" />
                  <span>竞技场分派游戏:</span>
                </span>
                {law.dispatchedGames.map((gid) => {
                  const g = PSYCHOLOGY_GAMES.find((item) => item.id === gid);
                  if (!g) return null;
                  return (
                    <button
                      type="button"
                      key={gid}
                      onClick={(e) => {
                        e.stopPropagation();
                        gameAudio.playTap();
                        navigate(`/game/${gid}`);
                      }}
                      className="luxury-surface-btn min-h-[36px] px-3 py-1 rounded-lg text-[#4338A6] border-[#5B45B8]/25 hover:border-[#5B45B8]/50 font-medium cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B45B8]/40"
                    >
                      {g.nameZh} →
                    </button>
                  );
                })}
              </div>
            )}

            {/* 3. Actionable Takeaways */}
            {law.keyTakeaway && (
              <div className="p-3.5 rounded-xl bg-[#FAF8F4] border border-stone-200/85 text-[#181411] space-y-1">
                <span className="font-bold text-[#157F5D] font-mono text-[11px] flex items-center gap-1">
                  <span>✦ 现实行动启示：</span>
                </span>
                <p className="leading-relaxed">
                  <SilverSpeechText
                    text={law.keyTakeaway}
                    isSpeaking={isSpeakingThisLaw}
                    activeCpIndex={activeCpIndex}
                    segmentRange={segments.takeaway}
                  />
                </p>
              </div>
            )}

            {/* Card Actions: Enter 3D Lab / Test */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  gameAudio.playTap();
                  navigate(`/law/${law.id}`);
                }}
                className="luxury-dark-btn flex-1 min-w-[190px] min-h-[44px] py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A656]"
              >
                <span>进入认知决策实验室 & 测验</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  gameAudio.playTap();
                  setExpanded(false);
                }}
                className="luxury-surface-btn min-h-[44px] py-2.5 px-4 rounded-xl text-[#57514A] text-xs font-medium cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B45B8]/40"
              >
                收起速览
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer: Mastery Progress, Disclosure & Bottom-Right Voice Switch */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-stone-200/65 text-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-[11px] text-[#6E675F] font-medium shrink-0">心智内化</span>
          <div className="w-16 sm:w-24 h-1.5 bg-[#EFECE5] border border-stone-200/70 rounded-full overflow-hidden shrink-0">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${mastery}%`,
                background: `linear-gradient(90deg, ${palette.color} 0%, #157F5D 100%)`,
              }}
            />
          </div>
          <span className="font-numeric text-[11px] font-bold text-[#2B2520] shrink-0">{mastery}%</span>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-auto">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              gameAudio.playSelect();
              setExpanded((prev) => !prev);
            }}
            className="min-h-[36px] px-2 rounded-lg flex items-center gap-1 text-[11px] sm:text-xs font-bold text-[#2B2520] hover:text-[#8E5B13] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B45B8]/40"
          >
            <span className="font-serif-editorial">
              {expanded ? '收起详情' : '速读'}
            </span>
            <ChevronRight
              className={`w-3.5 h-3.5 text-[#6E675F] transition-transform duration-300 ${
                expanded ? 'rotate-90 text-[#A66C1E]' : 'group-hover:translate-x-0.5'
              }`}
            />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              gameAudio.playTap();
              navigate(`/law/${law.id}`);
            }}
            className="luxury-surface-btn min-h-[36px] px-2.5 rounded-lg text-[11px] font-semibold text-[#181411] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B45B8]/40"
            title={`进入《${law.nameZh}》完整专著与实验室`}
          >
            专著 →
          </button>

          <LawVoiceToggleSwitch
            isOn={isSpeakingThisLaw}
            onToggle={handleToggleSpeech}
            size="sm"
          />
        </div>
      </div>
    </article>
  );
};

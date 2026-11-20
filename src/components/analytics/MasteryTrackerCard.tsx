import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Lock,
  ArrowRight,
  Network,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { CategoryZh, PsychologyLaw, UserProfile } from '../../types';
import {
  CATEGORY_CLUSTER_META,
  selectLawsForPreset,
} from '../../utils/knowledgeGraphBuilder';
import { gameAudio } from '../../utils/gameAudio';

interface MasteryTrackerCardProps {
  user: UserProfile;
  laws: PsychologyLaw[];
}

interface MilestoneTier {
  id: 'quarter' | 'half' | 'three-quarters' | 'grandmaster';
  percent: 25 | 50 | 75 | 100;
  targetLaws: number;
  titleZh: string;
  titleEn: string;
  rewardName: string;
  rewardDetail: string;
  accentColor: string;
  surfaceTint: string;
  borderTint: string;
  ringStopStart: string;
  ringStopEnd: string;
}

const TOTAL_TARGET_LAWS = 500;

const MILESTONE_TIERS: MilestoneTier[] = [
  {
    id: 'quarter',
    percent: 25,
    targetLaws: 125,
    titleZh: '洞察学者',
    titleEn: 'Scholar Badge',
    rewardName: '青铜罗盘学者徽章',
    rewardDetail: '掌握 125 条核心心理定律，点亮第一重「洞察学者」金铜罗盘印记与档案绶带。',
    accentColor: '#9A3412',
    surfaceTint: 'bg-[#FBF5EF]',
    borderTint: 'border-[#D9B89C]',
    ringStopStart: '#B45309',
    ringStopEnd: '#D97706',
  },
  {
    id: 'half',
    percent: 50,
    targetLaws: 250,
    titleZh: '心智通识者',
    titleEn: 'Strategist Badge',
    rewardName: '翠玉星盘通识徽章',
    rewardDetail: '跨越 250 律半程里程碑，获得「心智通识者」双环星盘视觉徽章与跨维度认证。',
    accentColor: '#047857',
    surfaceTint: 'bg-[#F2F9F6]',
    borderTint: 'border-[#A7D7C5]',
    ringStopStart: '#047857',
    ringStopEnd: '#0E7490',
  },
  {
    id: 'three-quarters',
    percent: 75,
    targetLaws: 375,
    titleZh: '认知导师',
    titleEn: 'Luminary Master',
    rewardName: '紫金八芒导师徽章',
    rewardDetail: '攻克 375 条心理规律，晋升「认知导师」并解锁紫金八芒星视觉荣誉徽印。',
    accentColor: '#532CD8',
    surfaceTint: 'bg-[#F5F2FF]',
    borderTint: 'border-[#C4B5FD]',
    ringStopStart: '#532CD8',
    ringStopEnd: '#7C3AED',
  },
  {
    id: 'grandmaster',
    percent: 100,
    targetLaws: 500,
    titleZh: '百律大宗师',
    titleEn: 'Grandmaster Badge',
    rewardName: 'Grandmaster 黄金桂冠徽章',
    rewardDetail: '圆满掌握全部 500 条 MindLabZ 心理定律体系，加冕最高殿堂级「Grandmaster 大宗师」金冕印章。',
    accentColor: '#B45309',
    surfaceTint: 'bg-[#1C1917]',
    borderTint: 'border-[#D97706]',
    ringStopStart: '#F59E0B',
    ringStopEnd: '#D97706',
  },
];

const MilestoneEmblem: React.FC<{
  tierId: MilestoneTier['id'];
  unlocked: boolean;
  accentColor: string;
}> = ({ tierId, unlocked, accentColor }) => {
  const stroke = unlocked ? accentColor : '#A8A29E';
  const fillSoft = unlocked ? `${accentColor}1F` : 'rgba(168, 162, 158, 0.08)';
  const highlight = tierId === 'grandmaster' && unlocked ? '#FBBF24' : stroke;

  if (tierId === 'quarter') {
    // 25% Scholar Compass Crest
    return (
      <svg viewBox="0 0 48 48" className="w-10 h-10 shrink-0" aria-hidden="true">
        <circle cx="24" cy="24" r="20" fill={fillSoft} stroke={stroke} strokeWidth="1.5" />
        <circle cx="24" cy="24" r="15" fill="none" stroke={stroke} strokeWidth="0.9" strokeDasharray="2 2" />
        <polygon
          points="24,9 28,21 40,24 28,27 24,39 20,27 8,24 20,21"
          fill={unlocked ? stroke : 'none'}
          fillOpacity={unlocked ? 0.2 : 0}
          stroke={stroke}
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <circle cx="24" cy="24" r="3" fill={stroke} />
      </svg>
    );
  }

  if (tierId === 'half') {
    // 50% Strategist Astrolabe Crest
    return (
      <svg viewBox="0 0 48 48" className="w-10 h-10 shrink-0" aria-hidden="true">
        <circle cx="24" cy="24" r="20" fill={fillSoft} stroke={stroke} strokeWidth="1.5" />
        <ellipse cx="24" cy="24" rx="16" ry="7" transform="rotate(-30 24 24)" fill="none" stroke={stroke} strokeWidth="1.3" />
        <ellipse cx="24" cy="24" rx="16" ry="7" transform="rotate(30 24 24)" fill="none" stroke={stroke} strokeWidth="1.3" />
        <circle cx="24" cy="24" r="5" fill={unlocked ? stroke : 'none'} fillOpacity={unlocked ? 0.25 : 0} stroke={stroke} strokeWidth="1.4" />
        <circle cx="24" cy="24" r="2" fill={stroke} />
      </svg>
    );
  }

  if (tierId === 'three-quarters') {
    // 75% Luminary Master Octagram Seal
    return (
      <svg viewBox="0 0 48 48" className="w-10 h-10 shrink-0" aria-hidden="true">
        <circle cx="24" cy="24" r="20" fill={fillSoft} stroke={stroke} strokeWidth="1.5" />
        <rect x="13" y="13" width="22" height="22" rx="2" fill="none" stroke={stroke} strokeWidth="1.3" />
        <rect x="13" y="13" width="22" height="22" rx="2" transform="rotate(45 24 24)" fill="none" stroke={stroke} strokeWidth="1.3" />
        <circle cx="24" cy="24" r="4.5" fill={stroke} fillOpacity={unlocked ? 0.3 : 0.1} stroke={stroke} strokeWidth="1.2" />
      </svg>
    );
  }

  // 100% Grandmaster Crown & Laurel Seal
  return (
    <svg viewBox="0 0 48 48" className="w-10 h-10 shrink-0" aria-hidden="true">
      <circle
        cx="24"
        cy="24"
        r="20"
        fill={unlocked ? 'rgba(245, 158, 11, 0.18)' : fillSoft}
        stroke={highlight}
        strokeWidth="1.7"
      />
      <circle cx="24" cy="24" r="16.5" fill="none" stroke={highlight} strokeWidth="0.9" strokeDasharray="3 2" />
      <path
        d="M13 30 L15 18 L20.5 23 L24 14.5 L27.5 23 L33 18 L35 30 Z"
        fill={unlocked ? highlight : 'none'}
        fillOpacity={unlocked ? 0.32 : 0}
        stroke={highlight}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <line x1="14" y1="33.5" x2="34" y2="33.5" stroke={highlight} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
};

export const MasteryTrackerCard: React.FC<MasteryTrackerCardProps> = ({ user, laws }) => {
  const safeMasteryMap = useMemo(
    () => (user?.lawMasteryMap && typeof user.lawMasteryMap === 'object' ? user.lawMasteryMap : {}),
    [user?.lawMasteryMap]
  );

  // Curated 500-law atlas (10 Microexpressions + 142 Core & Emotional + 348 Love Codex = 500)
  const atlas500Laws = useMemo(
    () => selectLawsForPreset(laws, 'curated-500'),
    [laws]
  );

  const {
    masteredCount,
    inProgressCount,
    completionPct,
    categoryStats,
  } = useMemo(() => {
    const masteredSet = new Set<string>(Array.isArray(user?.lawsMastered) ? user.lawsMastered : []);
    Object.entries(safeMasteryMap).forEach(([lawId, val]) => {
      if (typeof val === 'number' && val >= 80) {
        masteredSet.add(lawId);
      }
    });

    const inProgSet = new Set<string>();
    Object.entries(safeMasteryMap).forEach(([lawId, val]) => {
      if (!masteredSet.has(lawId) && typeof val === 'number' && val > 0 && val < 80) {
        inProgSet.add(lawId);
      }
    });

    const cats: CategoryZh[] = ['认知', '记忆', '决策', '行为', '情绪', '社会'];
    const catMap: Record<CategoryZh, { total: number; mastered: number }> = {
      认知: { total: 0, mastered: 0 },
      记忆: { total: 0, mastered: 0 },
      决策: { total: 0, mastered: 0 },
      行为: { total: 0, mastered: 0 },
      情绪: { total: 0, mastered: 0 },
      社会: { total: 0, mastered: 0 },
    };

    atlas500Laws.forEach((law) => {
      const c: CategoryZh = catMap[law.categoryZh] ? law.categoryZh : '认知';
      catMap[c].total += 1;
      if (masteredSet.has(law.id)) {
        catMap[c].mastered += 1;
      }
    });

    const count = Math.min(TOTAL_TARGET_LAWS, masteredSet.size);
    const inProg = Math.min(TOTAL_TARGET_LAWS - count, inProgSet.size);
    const pct = Math.min(100, (count / TOTAL_TARGET_LAWS) * 100);

    return {
      masteredCount: count,
      inProgressCount: inProg,
      completionPct: pct,
      categoryStats: cats.map((cat) => ({
        category: cat,
        meta: CATEGORY_CLUSTER_META[cat],
        ...catMap[cat],
      })),
    };
  }, [user?.lawsMastered, safeMasteryMap, atlas500Laws]);

  // Highest unlocked milestone & default inspected milestone
  const highestUnlockedTier = useMemo(() => {
    const unlocked = MILESTONE_TIERS.filter((t) => completionPct >= t.percent);
    return unlocked.length > 0 ? unlocked[unlocked.length - 1] : null;
  }, [completionPct]);

  const nextTargetTier = useMemo(
    () => MILESTONE_TIERS.find((t) => completionPct < t.percent) || MILESTONE_TIERS[3],
    [completionPct]
  );

  const [inspectedTierId, setInspectedTierId] = useState<MilestoneTier['id']>(
    nextTargetTier.id
  );

  const inspectedTier = useMemo(
    () => MILESTONE_TIERS.find((t) => t.id === inspectedTierId) || MILESTONE_TIERS[0],
    [inspectedTierId]
  );

  // SVG Ring Geometry
  const svgSize = 232;
  const center = svgSize / 2;
  const radius = 84;
  const circumference = 2 * Math.PI * radius;
  const clampedMasteryRatio = Math.max(0, Math.min(1, masteredCount / TOTAL_TARGET_LAWS));
  const clampedActiveRatio = Math.max(
    clampedMasteryRatio,
    Math.min(1, (masteredCount + inProgressCount) / TOTAL_TARGET_LAWS)
  );
  const masteryDashOffset = circumference * (1 - clampedMasteryRatio);
  const activeDashOffset = circumference * (1 - clampedActiveRatio);

  // Outer dial 36 graduation ticks
  const dialTicks = useMemo(() => {
    return Array.from({ length: 40 }, (_, i) => {
      const angle = (i / 40) * Math.PI * 2 - Math.PI / 2;
      const isMajor = i % 10 === 0;
      const innerR = isMajor ? 99 : 101;
      const outerR = isMajor ? 107 : 105;
      return {
        x1: center + Math.cos(angle) * innerR,
        y1: center + Math.sin(angle) * innerR,
        x2: center + Math.cos(angle) * outerR,
        y2: center + Math.sin(angle) * outerR,
        isMajor,
      };
    });
  }, [center]);

  const activeRingStart = highestUnlockedTier?.ringStopStart || '#532CD8';
  const activeRingEnd = highestUnlockedTier?.ringStopEnd || '#7C3AED';

  const inspectedUnlocked = completionPct >= inspectedTier.percent;
  const lawsRemainingForInspected = Math.max(0, inspectedTier.targetLaws - masteredCount);
  const inspectedLocalPct = Math.min(
    100,
    Math.round((masteredCount / inspectedTier.targetLaws) * 100)
  );

  return (
    <section className="editorial-card rounded-2xl p-7 sm:p-9 space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-4 border-b border-stone-200/80">
        <div>
          <span className="editorial-kicker text-[10px] text-stone-500 block mb-0.5">
            01 · 500-Law Mastery Atlas
          </span>
          <h3 className="font-serif-editorial text-lg sm:text-xl font-bold text-stone-900">
            500 定律通识进度追踪与宗师授勋系统
          </h3>
        </div>
        <div className="flex items-center gap-2 text-xs text-stone-600 font-numeric tabular-nums">
          <span>
            当前段位：
            <strong className="text-stone-900 font-semibold">
              {highestUnlockedTier ? `${highestUnlockedTier.titleZh} (${highestUnlockedTier.titleEn})` : '认知启蒙研习生'}
            </strong>
          </span>
          <span aria-hidden="true" className="text-stone-300">·</span>
          <span className="text-amber-800 font-semibold">
            {masteredCount} / {TOTAL_TARGET_LAWS} 律
          </span>
        </div>
      </div>

      {/* Main Two-Column Mastery Stage: Circular Ring (Left) + 4 Milestone Rewards (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-[270px_minmax(0,1fr)] gap-7 items-center">
        {/* Left: Circular Progress Ring */}
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="relative w-[232px] h-[232px] flex items-center justify-center">
            <svg
              width={svgSize}
              height={svgSize}
              viewBox={`0 0 ${svgSize} ${svgSize}`}
              className="overflow-visible"
              role="img"
              aria-label={`已完成 500 条定律中的 ${masteredCount} 条，进度 ${completionPct.toFixed(1)}%`}
            >
              <defs>
                <linearGradient id="masteryRingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={activeRingStart} />
                  <stop offset="100%" stopColor={activeRingEnd} />
                </linearGradient>
              </defs>

              {/* Outer Astrolabe Calibration Ticks */}
              {dialTicks.map((tick, idx) => (
                <line
                  key={idx}
                  x1={tick.x1}
                  y1={tick.y1}
                  x2={tick.x2}
                  y2={tick.y2}
                  stroke={tick.isMajor ? '#A8A29E' : '#E7E5E4'}
                  strokeWidth={tick.isMajor ? 1.5 : 1}
                  strokeLinecap="round"
                />
              ))}

              {/* Base Track Ring */}
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke="#EFECE6"
                strokeWidth="12"
              />

              {/* Secondary Active Study Arc (Mastered + In-Progress > 0%) */}
              {inProgressCount > 0 && (
                <circle
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="none"
                  stroke="rgba(180, 83, 9, 0.24)"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={activeDashOffset}
                  transform={`rotate(-90 ${center} ${center})`}
                  style={{
                    transition: 'stroke-dashoffset 0.75s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                />
              )}

              {/* Primary Mastered Progress Arc */}
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke="url(#masteryRingGradient)"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={masteryDashOffset}
                transform={`rotate(-90 ${center} ${center})`}
                style={{
                  transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              />

              {/* Quadrant Milestone Markers at 25%, 50%, 75%, 100% */}
              {MILESTONE_TIERS.map((tier) => {
                const angle = (tier.percent / 100) * Math.PI * 2 - Math.PI / 2;
                const mx = center + Math.cos(angle) * radius;
                const my = center + Math.sin(angle) * radius;
                const lx = center + Math.cos(angle) * (radius + 31);
                const ly = center + Math.sin(angle) * (radius + 31);
                const isReached = completionPct >= tier.percent;
                const isInspected = inspectedTierId === tier.id;

                return (
                  <g
                    key={tier.id}
                    onClick={() => {
                      gameAudio.playTap();
                      setInspectedTierId(tier.id);
                    }}
                    className="cursor-pointer"
                  >
                    <circle
                      cx={mx}
                      cy={my}
                      r={isInspected ? 7.5 : 6}
                      fill={isReached ? tier.accentColor : '#FAF8F5'}
                      stroke={isReached ? '#FFFFFF' : '#C6B9A0'}
                      strokeWidth={isReached ? 2 : 1.5}
                    />
                    <text
                      x={lx}
                      y={ly}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize="10"
                      fontWeight={isReached || isInspected ? '700' : '600'}
                      fill={isReached ? tier.accentColor : '#78716C'}
                      className="font-numeric tabular-nums select-none"
                    >
                      {tier.percent}%
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Centered Numeric Display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-6">
              <span className="text-[10px] font-semibold tracking-widest uppercase text-stone-500">
                Mastery
              </span>
              <div className="font-serif-editorial text-3xl font-bold text-stone-900 font-numeric tabular-nums leading-tight mt-0.5">
                {completionPct.toFixed(1)}%
              </div>
              <div className="text-xs font-semibold text-stone-700 font-numeric tabular-nums mt-0.5">
                {masteredCount} / {TOTAL_TARGET_LAWS} 律
              </div>
              {inProgressCount > 0 && (
                <div className="text-[10.5px] text-amber-800 font-numeric tabular-nums mt-1">
                  +{inProgressCount} 律研习中
                </div>
              )}
            </div>
          </div>

          <p className="text-[11px] text-stone-500 text-center font-numeric tabular-nums">
            掌握标准：单个定律内化度达到 80% 即计入圆满掌握
          </p>
        </div>

        {/* Right: 4 Milestone Visual Rewards Grid + Selected Tier Spotlight */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {MILESTONE_TIERS.map((tier) => {
              const unlocked = completionPct >= tier.percent;
              const isSelected = inspectedTierId === tier.id;
              const isGrandmaster = tier.id === 'grandmaster';

              return (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => {
                    gameAudio.playTap();
                    setInspectedTierId(tier.id);
                  }}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3.5 ${
                    isGrandmaster && unlocked
                      ? 'bg-[#1C1917] border-amber-500 text-amber-50 shadow-md'
                      : isSelected
                        ? `${tier.surfaceTint} ${tier.borderTint} shadow-xs`
                        : unlocked
                          ? `${tier.surfaceTint} border-stone-300/80 hover:border-stone-400`
                          : 'bg-[#FAF8F5] border-stone-200/90 hover:border-stone-300'
                  }`}
                >
                  <MilestoneEmblem
                    tierId={tier.id}
                    unlocked={unlocked}
                    accentColor={tier.accentColor}
                  />

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-[11px] font-semibold font-numeric tabular-nums ${
                          isGrandmaster && unlocked
                            ? 'text-amber-300'
                            : unlocked
                              ? 'text-stone-800'
                              : 'text-stone-500'
                        }`}
                      >
                        {tier.percent}% · {tier.targetLaws} 律
                      </span>

                      {unlocked ? (
                        <CheckCircle2
                          className={`w-4 h-4 shrink-0 ${
                            isGrandmaster ? 'text-amber-400' : 'text-emerald-700'
                          }`}
                        />
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      )}
                    </div>

                    <div
                      className={`font-serif-editorial text-sm font-bold leading-snug ${
                        isGrandmaster && unlocked ? 'text-white' : 'text-stone-900'
                      }`}
                    >
                      {tier.titleZh}
                    </div>

                    <div
                      className={`text-[11px] truncate ${
                        isGrandmaster && unlocked ? 'text-stone-300' : 'text-stone-500'
                      }`}
                    >
                      {tier.rewardName}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected Milestone Reward Spotlight */}
          <div
            className={`p-4 rounded-xl border space-y-3 ${
              inspectedTier.id === 'grandmaster' && inspectedUnlocked
                ? 'bg-[#1C1917] border-amber-500/80 text-amber-50'
                : 'bg-[#F7F4EE] border-[#DFD7C8] text-stone-800'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <Sparkles
                  className="w-4 h-4 shrink-0"
                  style={{ color: inspectedTier.accentColor }}
                />
                <span>
                  {inspectedTier.percent}% 里程碑授勋：{inspectedTier.titleZh} ({inspectedTier.titleEn})
                </span>
              </div>
              <span
                className={`text-xs font-semibold font-numeric tabular-nums ${
                  inspectedUnlocked
                    ? 'text-emerald-700'
                    : inspectedTier.id === 'grandmaster' && inspectedUnlocked
                      ? 'text-amber-300'
                      : 'text-stone-600'
                }`}
              >
                {inspectedUnlocked
                  ? '荣誉徽章已点亮'
                  : `还差 ${lawsRemainingForInspected} 律解锁 (${inspectedLocalPct}%)`}
              </span>
            </div>

            <p
              className={`text-xs leading-relaxed ${
                inspectedTier.id === 'grandmaster' && inspectedUnlocked
                  ? 'text-stone-300'
                  : 'text-stone-600'
              }`}
            >
              {inspectedTier.rewardDetail}
            </p>

            {/* Progress Bar toward inspected milestone */}
            <div className="space-y-1.5">
              <div className="w-full h-1.5 rounded-full bg-stone-200/80 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${inspectedLocalPct}%`,
                    backgroundColor: inspectedTier.accentColor,
                  }}
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <span
                  className={`text-[11px] font-numeric tabular-nums ${
                    inspectedTier.id === 'grandmaster' && inspectedUnlocked
                      ? 'text-stone-400'
                      : 'text-stone-500'
                  }`}
                >
                  目标进度：{Math.min(masteredCount, inspectedTier.targetLaws)} / {inspectedTier.targetLaws} 律
                </span>

                <div className="flex items-center gap-2">
                  <Link
                    to="/knowledge-graph"
                    onClick={() => gameAudio.playTap()}
                    className="min-h-[36px] px-3 py-1.5 rounded-lg bg-white hover:bg-stone-100 border border-[#D4CBB8] text-stone-900 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                  >
                    <Network className="w-3.5 h-3.5 text-amber-800" />
                    <span>知识图谱通关</span>
                  </Link>
                  <Link
                    to="/learn"
                    onClick={() => gameAudio.playTap()}
                    className="min-h-[36px] px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-amber-50 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-amber-300" />
                    <span>前往研习</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom 6-Dimension Breakdown across the 500-Law Atlas */}
      <div className="pt-4 border-t border-stone-200/80 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-stone-900">六大心理维度掌握分布（500 核心律谱系）</span>
          <span className="text-[11px] text-stone-500 font-numeric tabular-nums">
            点击任意领域可前往图谱研习
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {categoryStats.map((item) => {
            const pct = item.total > 0 ? Math.round((item.mastered / item.total) * 100) : 0;
            return (
              <Link
                key={item.category}
                to="/knowledge-graph"
                onClick={() => gameAudio.playTap()}
                className="p-3 rounded-xl bg-[#FAF8F5] hover:bg-white border border-stone-200/90 hover:border-stone-400 transition-colors space-y-1.5 group"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-stone-900 group-hover:text-amber-900">
                    {item.category}
                  </span>
                  <span className="font-numeric tabular-nums text-[11px] text-stone-500">
                    {pct}%
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-stone-200/80 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: item.meta.color }}
                  />
                </div>
                <div className="text-[10.5px] text-stone-500 font-numeric tabular-nums">
                  {item.mastered} / {item.total} 律
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

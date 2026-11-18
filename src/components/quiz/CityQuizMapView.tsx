import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MapPin,
  Lock,
  CheckCircle2,
  Play,
  ArrowRight,
  Compass,
  Trophy,
  Zap,
  Brain,
  Target,
  Eye,
  Heart,
  Scale,
  RotateCcw,
  Crosshair,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Globe,
  ChevronLeft,
  ChevronRight,
  Search,
  BookOpen,
  X,
} from 'lucide-react';
import { gameAudio } from '../../utils/gameAudio';
import {
  WORLD_CAPITALS,
  WorldCapitalCity,
  ContinentName,
  POINTS_PER_CITY,
  CHAPTERS_PER_POINT,
  QUESTIONS_PER_CHAPTER,
} from '../../data/worldCapitals';
import {
  WorldCityProgressState,
  checkCityUnlocked,
  checkCityCompleted,
  checkPointUnlocked,
  checkPointCompleted,
  checkChapterUnlocked,
  checkChapterCompleted,
  getCompletedChaptersList,
  getCompletedPointsForCity,
  getUnlockedCityCount,
  getTotalCompletedChapters,
} from '../../hooks/useCityQuizProgress';
import { getLoveLawsForCity } from '../../data/lovePsychologyCodex';
import { getCityLoveDifficultyTier } from '../../data/lovePsychologyTypes';

export interface CityQuizStage {
  id: string;
  step: number;
  roman: string;
  districtFr: string;
  districtZh: string;
  sectorTag: string;
  category: '认知' | '记忆' | '决策' | '社会' | '情绪';
  subtitle: string;
  xpReward: number;
  accentColor: string;
  xOffsetPercent: number;
  mapX: number;
  mapY: number;
  plaquePlacement: 'right' | 'left' | 'top' | 'bottom';
  monumentType:
    | 'colonnade'
    | 'palace'
    | 'market'
    | 'etoile'
    | 'bridge'
    | 'conservatory'
    | 'observatory'
    | 'citadel';
  iconType: 'eye' | 'brain' | 'scale' | 'heart' | 'compass' | 'target' | 'zap' | 'trophy';
}

const BASE_STAGE_TEMPLATES: Omit<CityQuizStage, 'districtFr' | 'districtZh'>[] = [
  {
    id: 'stage-1',
    step: 1,
    roman: 'I',
    sectorTag: 'Secteur 01 · Entrée',
    category: '认知',
    subtitle: '感知过滤与第一眼认知偏差 · 10 章 × 20 题',
    xpReward: 120,
    accentColor: '#D97706',
    xOffsetPercent: 13,
    mapX: 145,
    mapY: 560,
    plaquePlacement: 'right',
    monumentType: 'colonnade',
    iconType: 'eye',
  },
  {
    id: 'stage-2',
    step: 2,
    roman: 'II',
    sectorTag: 'Secteur 02 · Mémoire',
    category: '记忆',
    subtitle: '蔡格尼克效应与工作记忆宫殿 · 10 章 × 20 题',
    xpReward: 150,
    accentColor: '#4F46E5',
    xOffsetPercent: 35,
    mapX: 395,
    mapY: 515,
    plaquePlacement: 'top',
    monumentType: 'palace',
    iconType: 'brain',
  },
  {
    id: 'stage-3',
    step: 3,
    roman: 'III',
    sectorTag: 'Secteur 03 · Marché',
    category: '决策',
    subtitle: '锚定效应与心理账户决策辨析 · 10 章 × 20 题',
    xpReward: 180,
    accentColor: '#059669',
    xOffsetPercent: 59,
    mapX: 660,
    mapY: 575,
    plaquePlacement: 'top',
    monumentType: 'market',
    iconType: 'compass',
  },
  {
    id: 'stage-4',
    step: 4,
    roman: 'IV',
    sectorTag: 'Secteur 04 · Carrefour',
    category: '决策',
    subtitle: '沉没成本谬误与框架效应逆转 · 10 章 × 20 题',
    xpReward: 200,
    accentColor: '#E11D48',
    xOffsetPercent: 83,
    mapX: 935,
    mapY: 520,
    plaquePlacement: 'left',
    monumentType: 'etoile',
    iconType: 'scale',
  },
  {
    id: 'stage-5',
    step: 5,
    roman: 'V',
    sectorTag: 'Secteur 05 · Traversée',
    category: '社会',
    subtitle: '旁观者效应破局与群体共振 · 10 章 × 20 题',
    xpReward: 220,
    accentColor: '#0D9488',
    xOffsetPercent: 76,
    mapX: 855,
    mapY: 365,
    plaquePlacement: 'right',
    monumentType: 'bridge',
    iconType: 'heart',
  },
  {
    id: 'stage-6',
    step: 6,
    roman: 'VI',
    sectorTag: 'Secteur 06 · Galerie',
    category: '情绪',
    subtitle: '峰终定律与情绪启发式冷静解离 · 10 章 × 20 题',
    xpReward: 250,
    accentColor: '#9333EA',
    xOffsetPercent: 62,
    mapX: 690,
    mapY: 215,
    plaquePlacement: 'bottom',
    monumentType: 'conservatory',
    iconType: 'zap',
  },
  {
    id: 'stage-7',
    step: 7,
    roman: 'VII',
    sectorTag: 'Secteur 07 · Observatoire',
    category: '认知',
    subtitle: '达克效应突破与反证思维试炼 · 10 章 × 20 题',
    xpReward: 280,
    accentColor: '#2563EB',
    xOffsetPercent: 39,
    mapX: 435,
    mapY: 190,
    plaquePlacement: 'bottom',
    monumentType: 'observatory',
    iconType: 'target',
  },
  {
    id: 'stage-8',
    step: 8,
    roman: 'VIII',
    sectorTag: 'Secteur 08 · Acropole',
    category: '决策',
    subtitle: '全景心理定律融会贯通终极通关 · 10 章 × 20 题',
    xpReward: 350,
    accentColor: '#B45309',
    xOffsetPercent: 16,
    mapX: 185,
    mapY: 165,
    plaquePlacement: 'right',
    monumentType: 'citadel',
    iconType: 'trophy',
  },
];

export const buildStagesForCapital = (city: WorldCapitalCity): CityQuizStage[] =>
  BASE_STAGE_TEMPLATES.map((tpl, idx) => ({
    ...tpl,
    districtFr: city.districts[idx]?.fr || `Quartier ${tpl.roman}`,
    districtZh: city.districts[idx]?.zh || `第 ${tpl.step} 街区`,
  }));

export const CITY_QUIZ_STAGES: CityQuizStage[] = buildStagesForCapital(WORLD_CAPITALS[0]);

interface CityQuizMapViewProps {
  progress: WorldCityProgressState;
  newlyUnlockedPointIndex?: number | null;
  newlyUnlockedCityIndex?: number | null;
  playerAvatar?: string;
  playerName?: string;
  onSelectCity: (cityIndex: number) => void;
  onSelectPoint: (pointIndex: number) => void;
  onSelectChapter: (chapterIndex: number) => void;
  onStartChapterQuiz: (cityIndex: number, pointIndex: number, chapterIndex: number) => void;
  onResetAllProgress?: () => void;
  variant?: 'full' | 'dashboard';
}

const WORLD_WIDTH = 1120;
const WORLD_HEIGHT = 700;

const CONTINENTS: Array<{ id: 'All' | ContinentName; label: string }> = [
  { id: 'All', label: '全部 50 国首都' },
  { id: 'Europe', label: 'Europe · 欧洲' },
  { id: 'Asie', label: 'Asie · 亚洲' },
  { id: 'Amériques', label: 'Amériques · 美洲' },
  { id: 'Afrique', label: 'Afrique · 非洲' },
  { id: 'Océanie', label: 'Océanie · 大洋洲' },
];

export const CityQuizMapView: React.FC<CityQuizMapViewProps> = ({
  progress,
  newlyUnlockedPointIndex = null,
  newlyUnlockedCityIndex = null,
  playerAvatar,
  playerName = 'Explorateur',
  onSelectCity,
  onSelectPoint,
  onSelectChapter,
  onStartChapterQuiz,
  onResetAllProgress,
  variant = 'full',
}) => {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const prevCityRef = useRef<number>(progress.activeCityIndex);
  const prevPointRef = useRef<number>(progress.activePointIndex);

  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(0.92);
  const [isDragging, setIsDragging] = useState(false);
  const [showAtlasModal, setShowAtlasModal] = useState(false);
  const [continentFilter, setContinentFilter] = useState<'All' | ContinentName>('All');
  const [citySearchQuery, setCitySearchQuery] = useState('');

  const dragStateRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    scrollLeft: number;
    scrollTop: number;
    moved: boolean;
  }>({
    active: false,
    startX: 0,
    startY: 0,
    scrollLeft: 0,
    scrollTop: 0,
    moved: false,
  });

  const activeCity = WORLD_CAPITALS[progress.activeCityIndex] || WORLD_CAPITALS[0];
  const cityStages = useMemo(() => buildStagesForCapital(activeCity), [activeCity]);
  const activePointIdx = progress.activePointIndex;
  const activeChapterIdx = progress.activeChapterIndex;
  const activeStage = cityStages[activePointIdx] || cityStages[0];
  const activeCityLoveTier = useMemo(
    () => getCityLoveDifficultyTier(activeCity.index),
    [activeCity.index]
  );
  const activeCityLoveLaws = useMemo(
    () => getLoveLawsForCity(activeCity.index),
    [activeCity.index]
  );

  const completedPointsInCity = useMemo(
    () => getCompletedPointsForCity(progress, activeCity.index),
    [progress, activeCity.index]
  );

  // Highest unlocked point index inside the currently viewed capital
  const unlockedPointIdxInCity = useMemo(() => {
    let maxUnlocked = 0;
    for (let p = 0; p < POINTS_PER_CITY; p++) {
      if (checkPointUnlocked(progress, activeCity.index, p)) {
        maxUnlocked = p;
      } else {
        break;
      }
    }
    return maxUnlocked;
  }, [progress, activeCity.index]);

  const unlockedCitiesCount = useMemo(() => getUnlockedCityCount(progress), [progress]);
  const totalCompletedChapters = useMemo(() => getTotalCompletedChapters(progress), [progress]);

  // Fit initial zoom proportionally
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const width = vp.clientWidth;
    if (width >= 940) {
      setZoomLevel(Number(Math.min(1, Math.max(0.84, width / WORLD_WIDTH)).toFixed(2)));
    } else {
      setZoomLevel(0.92);
    }
  }, []);

  // Build route curve through all 8 points
  const buildRoutePathD = useCallback(() => {
    const pts = cityStages;
    if (pts.length === 0) return '';
    let d = `M ${pts[0].mapX} ${pts[0].mapY}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      const dx = b.mapX - a.mapX;
      const dy = b.mapY - a.mapY;
      const c1x = a.mapX + dx * 0.42;
      const c1y = a.mapY + dy * 0.12;
      const c2x = a.mapX + dx * 0.58;
      const c2y = b.mapY - dy * 0.12;
      d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${b.mapX} ${b.mapY}`;
    }
    return d;
  }, [cityStages]);

  const fullRoutePathD = useMemo(() => buildRoutePathD(), [buildRoutePathD]);

  const progressRatio = useMemo(() => {
    if (cityStages.length <= 1) return 1;
    const segLengths: number[] = [];
    let totalLen = 0;
    for (let i = 0; i < cityStages.length - 1; i++) {
      const a = cityStages[i];
      const b = cityStages[i + 1];
      const dist = Math.hypot(b.mapX - a.mapX, b.mapY - a.mapY);
      segLengths.push(dist);
      totalLen += dist;
    }
    if (totalLen === 0) return 0;
    let covered = 0;
    for (let i = 0; i < unlockedPointIdxInCity && i < segLengths.length; i++) {
      covered += segLengths[i];
    }
    return Math.min(1, Math.max(0, covered / totalLen));
  }, [cityStages, unlockedPointIdxInCity]);

  const riverPathD =
    'M -30 392 C 210 330, 470 438, 720 385 C 860 355, 990 364, 1155 338';

  // Smooth 2D camera pan centering the target point
  const panToPoint = useCallback(
    (pointIndex: number, delayMs = 150, overrideZoom?: number) => {
      const timer = window.setTimeout(() => {
        const vp = viewportRef.current;
        const stage = cityStages[pointIndex];
        if (!vp || !stage) return;

        const effectiveZoom = overrideZoom ?? zoomLevel;
        const targetLeft = stage.mapX * effectiveZoom - vp.clientWidth / 2;
        const targetTop = stage.mapY * effectiveZoom - vp.clientHeight / 2;

        const maxLeft = Math.max(0, WORLD_WIDTH * effectiveZoom - vp.clientWidth);
        const maxTop = Math.max(0, WORLD_HEIGHT * effectiveZoom - vp.clientHeight);

        const clampedLeft = Math.min(maxLeft, Math.max(0, targetLeft));
        const clampedTop = Math.min(maxTop, Math.max(0, targetTop));

        const needsPan =
          Math.abs(vp.scrollLeft - clampedLeft) > 18 ||
          Math.abs(vp.scrollTop - clampedTop) > 18;

        if (needsPan) {
          setIsAutoScrolling(true);
          vp.scrollTo({
            left: clampedLeft,
            top: clampedTop,
            behavior: 'smooth',
          });
          window.setTimeout(() => {
            setIsAutoScrolling(false);
          }, 680);
        }
      }, delayMs);

      return timer;
    },
    [cityStages, zoomLevel]
  );

  // Auto-pan on active city change or point change
  useEffect(() => {
    const cityChanged = progress.activeCityIndex !== prevCityRef.current;
    const pointChanged = progress.activePointIndex !== prevPointRef.current;

    if (cityChanged || pointChanged) {
      prevCityRef.current = progress.activeCityIndex;
      prevPointRef.current = progress.activePointIndex;
      const timer = panToPoint(progress.activePointIndex, 160);
      return () => window.clearTimeout(timer);
    }
  }, [progress.activeCityIndex, progress.activePointIndex, panToPoint]);

  useEffect(() => {
    const timer = panToPoint(progress.activePointIndex, 180);
    return () => window.clearTimeout(timer);
  }, []);

  // Drag-to-pan handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;
    const vp = viewportRef.current;
    if (!vp) return;
    dragStateRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      scrollLeft: vp.scrollLeft,
      scrollTop: vp.scrollTop,
      moved: false,
    };
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStateRef.current.active) return;
    const vp = viewportRef.current;
    if (!vp) return;
    const dx = e.clientX - dragStateRef.current.startX;
    const dy = e.clientY - dragStateRef.current.startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      dragStateRef.current.moved = true;
    }
    vp.scrollLeft = dragStateRef.current.scrollLeft - dx;
    vp.scrollTop = dragStateRef.current.scrollTop - dy;
  };

  const handlePointerUp = () => {
    dragStateRef.current.active = false;
    setIsDragging(false);
  };

  const handleFitView = () => {
    gameAudio.playTap();
    const vp = viewportRef.current;
    if (!vp) return;
    const fitZoom = Number(
      Math.min(
        1.02,
        Math.max(0.62, Math.min(vp.clientWidth / WORLD_WIDTH, vp.clientHeight / WORLD_HEIGHT))
      ).toFixed(2)
    );
    setZoomLevel(fitZoom);
  };

  const handleZoomStep = (delta: number) => {
    gameAudio.playTap();
    setZoomLevel((prev) => {
      const next = Number(Math.min(1.45, Math.max(0.65, prev + delta)).toFixed(2));
      panToPoint(activePointIdx, 60, next);
      return next;
    });
  };

  const renderStageIcon = (iconType: CityQuizStage['iconType'], cls: string) => {
    switch (iconType) {
      case 'eye':
        return <Eye className={cls} />;
      case 'brain':
        return <Brain className={cls} />;
      case 'scale':
        return <Scale className={cls} />;
      case 'heart':
        return <Heart className={cls} />;
      case 'compass':
        return <Compass className={cls} />;
      case 'target':
        return <Target className={cls} />;
      case 'zap':
        return <Zap className={cls} />;
      case 'trophy':
        return <Trophy className={cls} />;
      default:
        return <MapPin className={cls} />;
    }
  };

  const completedChaptersInActivePoint = getCompletedChaptersList(
    progress,
    activeCity.index,
    activePointIdx
  );

  // Filtered 50-Capital Atlas list for browser drawer
  const filteredCapitals = useMemo(() => {
    const q = citySearchQuery.trim().toLowerCase();
    return WORLD_CAPITALS.filter((c) => {
      const matchesContinent = continentFilter === 'All' || c.continent === continentFilter;
      if (!matchesContinent) return false;
      if (!q) return true;
      return (
        c.cityFr.toLowerCase().includes(q) ||
        c.cityZh.toLowerCase().includes(q) ||
        c.countryFr.toLowerCase().includes(q) ||
        c.countryZh.toLowerCase().includes(q)
      );
    });
  }, [continentFilter, citySearchQuery]);

  // Curated Haussmannian blocks & parks
  const cityBlocks = [
    { x: 42, y: 445, w: 68, h: 48, courtyard: true },
    { x: 42, y: 505, w: 54, h: 52, courtyard: true },
    { x: 44, y: 618, w: 86, h: 42, courtyard: true },
    { x: 185, y: 432, w: 72, h: 44, courtyard: true },
    { x: 215, y: 612, w: 88, h: 46, courtyard: true },
    { x: 300, y: 425, w: 62, h: 48, courtyard: true },
    { x: 325, y: 590, w: 82, h: 52, courtyard: true },
    { x: 468, y: 438, w: 74, h: 46, courtyard: true },
    { x: 488, y: 520, w: 78, h: 54, courtyard: true },
    { x: 560, y: 625, w: 94, h: 38, courtyard: false },
    { x: 735, y: 442, w: 68, h: 44, courtyard: true },
    { x: 750, y: 585, w: 86, h: 52, courtyard: true },
    { x: 878, y: 608, w: 92, h: 46, courtyard: true },
    { x: 998, y: 426, w: 74, h: 58, courtyard: true },
    { x: 1005, y: 556, w: 70, h: 68, courtyard: true },
    { x: 48, y: 66, w: 76, h: 52, courtyard: true },
    { x: 46, y: 228, w: 84, h: 54, courtyard: true },
    { x: 155, y: 274, w: 96, h: 46, courtyard: true },
    { x: 288, y: 64, w: 78, h: 48, courtyard: true },
    { x: 342, y: 268, w: 66, h: 50, courtyard: true },
    { x: 522, y: 68, w: 84, h: 46, courtyard: true },
    { x: 528, y: 278, w: 78, h: 48, courtyard: true },
    { x: 765, y: 68, w: 86, h: 50, courtyard: true },
    { x: 792, y: 268, w: 72, h: 46, courtyard: true },
    { x: 904, y: 82, w: 94, h: 56, courtyard: true },
    { x: 954, y: 186, w: 98, h: 66, courtyard: true },
  ];

  const botanicalParks = [
    {
      name: "Parc de l'Attention",
      x: 222,
      y: 492,
      w: 92,
      h: 64,
      trees: [
        [238, 508],
        [258, 504],
        [296, 514],
        [244, 540],
        [284, 542],
      ],
    },
    {
      name: 'Jardin des Heuristiques',
      x: 584,
      y: 446,
      w: 112,
      h: 58,
      trees: [
        [602, 464],
        [626, 458],
        [676, 466],
        [612, 488],
        [662, 490],
      ],
    },
    {
      name: 'Square des Lumières',
      x: 266,
      y: 162,
      w: 84,
      h: 72,
      trees: [
        [282, 180],
        [332, 178],
        [288, 218],
        [326, 216],
        [308, 198],
      ],
    },
    {
      name: 'Bois de la Sérénité',
      x: 844,
      y: 168,
      w: 88,
      h: 74,
      trees: [
        [862, 186],
        [914, 184],
        [866, 224],
        [908, 226],
        [888, 206],
      ],
    },
  ];

  const secondaryStreets = [
    'M 0 475 L 365 445 L 620 480 L 1120 420',
    'M 0 605 L 395 628 L 780 610 L 1120 635',
    'M 118 355 L 145 560 L 165 700',
    'M 395 360 L 395 515 L 430 700',
    'M 660 385 L 660 575 L 675 700',
    'M 935 352 L 935 520 L 965 700',
    'M 0 132 L 435 124 L 840 136 L 1120 118',
    'M 0 258 L 540 264 L 1120 252',
    'M 185 0 L 185 165 L 222 365',
    'M 435 0 L 435 190 L 465 385',
    'M 690 0 L 690 215 L 705 382',
    'M 935 0 L 910 210 L 855 365',
  ];

  const canGoPrevCity =
    activeCity.index > 0 && checkCityUnlocked(progress, activeCity.index - 1);
  const canGoNextCity =
    activeCity.index < WORLD_CAPITALS.length - 1 &&
    checkCityUnlocked(progress, activeCity.index + 1);

  return (
    <div className="w-full space-y-4 sm:space-y-5">
      {/* 1. World Capital Atlas Header & Active Point + 10-Chapter Curriculum Panel */}
      <div className="editorial-card rounded-2xl p-5 sm:p-6 space-y-4">
        {/* Top Row: Current Capital Identity + 50-Capital Atlas Switcher */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 pb-4 border-b border-stone-200/80">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-sans uppercase tracking-wider text-amber-800 font-bold">
              <span>World Capitals Atlas</span>
              <span aria-hidden="true">·</span>
              <span className="font-numeric tabular-nums">
                Carte {String(activeCity.index + 1).padStart(2, '0')} / {WORLD_CAPITALS.length}
              </span>
              <span aria-hidden="true">·</span>
              <span>{activeCity.continent}</span>
              <span
                className={`px-2 py-0.5 rounded-md border text-[10px] font-bold normal-case tracking-normal ${activeCityLoveTier.badgeColor}`}
              >
                {activeCityLoveTier.labelZh} · 驻守 {activeCityLoveLaws.length} 条爱情心理定律
              </span>
              <span aria-hidden="true">·</span>
              <span className="text-stone-500 font-normal normal-case">
                已解锁 {unlockedCitiesCount} / {WORLD_CAPITALS.length} 座首都 · 累计通关 {totalCompletedChapters} 章
              </span>
            </div>

            <h2 className="font-serif-editorial text-xl sm:text-2xl font-bold text-stone-900 flex flex-wrap items-center gap-2">
              <Globe className="w-5 h-5 text-amber-700 shrink-0" />
              <span>
                {activeCity.cityZh} · {activeCity.cityFr}
              </span>
              <span className="text-sm font-sans font-medium text-stone-500">
                ({activeCity.countryZh} · {completedPointsInCity.length}/{POINTS_PER_CITY} 站点)
              </span>
            </h2>

            <p className="text-xs text-stone-600 leading-relaxed">
              {activeCity.culturalFact}
            </p>
            {activeCityLoveLaws.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-stone-600">
                <span className="font-semibold text-rose-700 flex items-center gap-1">
                  <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />
                  本城主修爱情心理：
                </span>
                {activeCityLoveLaws.slice(0, 5).map((law) => (
                  <span
                    key={law.id}
                    className="px-2 py-0.5 rounded-md bg-rose-50/90 text-rose-800 border border-rose-200/80 text-[10.5px]"
                  >
                    {law.nameZh}
                  </span>
                ))}
                {activeCityLoveLaws.length > 5 && (
                  <span className="text-[10.5px] text-stone-500">
                    等 {activeCityLoveLaws.length} 项（第 1–50 城难度由浅入深）
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Fluid Capital Navigation Controls */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="flex items-center rounded-xl border border-stone-200 bg-[#FAF8F5] p-0.5">
              <button
                type="button"
                disabled={!canGoPrevCity}
                onClick={() => {
                  if (!canGoPrevCity) return;
                  gameAudio.playTap();
                  onSelectCity(activeCity.index - 1);
                }}
                className={`min-h-[38px] min-w-[38px] rounded-lg flex items-center justify-center transition-colors ${
                  canGoPrevCity
                    ? 'text-stone-800 hover:bg-white cursor-pointer'
                    : 'text-stone-300 cursor-not-allowed'
                }`}
                title="切换至上一座已解锁首都"
                aria-label="上一座首都"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  gameAudio.playTap();
                  setShowAtlasModal((v) => !v);
                }}
                className="min-h-[38px] px-3 py-1.5 rounded-lg hover:bg-white text-xs font-bold text-stone-900 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Globe className="w-3.5 h-3.5 text-amber-700" />
                <span>50 国首都地图册</span>
              </button>

              <button
                type="button"
                disabled={!canGoNextCity}
                onClick={() => {
                  if (!canGoNextCity) return;
                  gameAudio.playTap();
                  onSelectCity(activeCity.index + 1);
                }}
                className={`min-h-[38px] min-w-[38px] rounded-lg flex items-center justify-center transition-colors ${
                  canGoNextCity
                    ? 'text-stone-800 hover:bg-white cursor-pointer'
                    : 'text-stone-300 cursor-not-allowed'
                }`}
                title={
                  canGoNextCity
                    ? '切换至下一座已解锁首都'
                    : `通关「${activeCity.cityZh}」全部 8 站点后解锁下一首都`
                }
                aria-label="下一座首都"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {onResetAllProgress && totalCompletedChapters > 0 && (
              <button
                type="button"
                onClick={() => {
                  gameAudio.playTap();
                  onResetAllProgress();
                }}
                className="min-h-[40px] px-3 py-2 rounded-xl bg-[#FAF8F5] hover:bg-stone-200/70 text-stone-700 border border-stone-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                title="重置所有首都、站点与章节进度"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>重置</span>
              </button>
            )}
          </div>
        </div>

        {/* Collapsible 50-Capital World Atlas Selector Drawer */}
        <AnimatePresence>
          {showAtlasModal && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="rounded-2xl bg-[#FAF8F5] border border-stone-200 p-4 space-y-3.5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
                  {CONTINENTS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        gameAudio.playTap();
                        setContinentFilter(c.id);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        continentFilter === c.id
                          ? 'bg-stone-900 text-white'
                          : 'bg-white text-stone-600 hover:text-stone-900 border border-stone-200'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1 sm:w-48">
                    <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={citySearchQuery}
                      onChange={(e) => setCitySearchQuery(e.target.value)}
                      placeholder="搜索首都或国家..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white border border-stone-200 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAtlasModal(false)}
                    aria-label="收起地图册"
                    className="w-8 h-8 rounded-lg bg-white border border-stone-200 flex items-center justify-center text-stone-500 hover:text-stone-900 cursor-pointer shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 max-h-64 overflow-y-auto pr-1">
                {filteredCapitals.map((city) => {
                  const isUnlocked = checkCityUnlocked(progress, city.index);
                  const isCompleted = checkCityCompleted(progress, city.index);
                  const isCurrent = city.index === activeCity.index;
                  const ptsDone = getCompletedPointsForCity(progress, city.index).length;
                  const prevCity = city.index > 0 ? WORLD_CAPITALS[city.index - 1] : null;

                  return (
                    <button
                      key={city.id}
                      type="button"
                      disabled={!isUnlocked}
                      onClick={() => {
                        if (!isUnlocked) return;
                        gameAudio.playTap();
                        onSelectCity(city.index);
                        setShowAtlasModal(false);
                      }}
                      title={
                        isUnlocked
                          ? `${city.cityZh} · ${city.countryZh} (${ptsDone}/${POINTS_PER_CITY} 站点)`
                          : `完成上一站「${prevCity?.cityZh || ''}」全部 8 个站点（80 章）即可解锁`
                      }
                      className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-1 ${
                        isCurrent
                          ? 'bg-stone-900 text-white border-stone-900 shadow-sm cursor-pointer'
                          : isCompleted
                          ? 'bg-emerald-50 text-emerald-950 border-emerald-300 hover:border-emerald-500 cursor-pointer'
                          : isUnlocked
                          ? 'bg-white text-stone-900 border-stone-200 hover:border-stone-500 cursor-pointer'
                          : 'bg-stone-100/75 text-stone-400 border-stone-200/60 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 text-[10px] font-mono tabular-nums">
                        <span className="flex items-center gap-1">
                          <span>#{String(city.index + 1).padStart(2, '0')}</span>
                          <span
                            className={`px-1 rounded text-[9px] font-sans font-bold ${
                              city.index < 17
                                ? isCurrent
                                  ? 'bg-emerald-500/30 text-emerald-200'
                                  : 'bg-emerald-100 text-emerald-800'
                                : city.index < 34
                                ? isCurrent
                                  ? 'bg-amber-500/30 text-amber-200'
                                  : 'bg-amber-100 text-amber-800'
                                : isCurrent
                                ? 'bg-rose-500/30 text-rose-200'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {city.index < 17 ? '初级' : city.index < 34 ? '中阶' : '高阶'}
                          </span>
                        </span>
                        {isCompleted ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : !isUnlocked ? (
                          <Lock className="w-3 h-3 text-stone-400 shrink-0" />
                        ) : (
                          <span className={isCurrent ? 'text-amber-300' : 'text-stone-500'}>
                            {ptsDone}/{POINTS_PER_CITY}
                          </span>
                        )}
                      </div>
                      <div className="font-serif-editorial text-xs font-bold truncate">
                        {city.cityZh}
                      </div>
                      <div
                        className={`text-[10px] truncate ${
                          isCurrent ? 'text-stone-300' : 'text-stone-500'
                        }`}
                      >
                        {city.cityFr} · {getLoveLawsForCity(city.index).length}律
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active District & 10-Chapter Progression Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeCity.id}-${activeStage.id}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="p-4 sm:p-5 rounded-xl bg-gradient-to-br from-[#FAF8F5] to-[#F2ECE1] border border-stone-200/90 space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-xs font-numeric text-stone-600">
                  <span className="font-semibold text-stone-900">
                    {activeCity.cityFr} · {activeStage.sectorTag}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{activeStage.category}领域</span>
                  <span aria-hidden="true">·</span>
                  <span>
                    本站点进度 {completedChaptersInActivePoint.length} / {CHAPTERS_PER_POINT} 章
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="text-emerald-800 font-bold">
                    +{activeStage.xpReward} XP / 章
                  </span>
                </div>
                <h3 className="font-serif-editorial text-base sm:text-xl font-bold text-stone-900">
                  {activeStage.roman}. {activeStage.districtZh}{' '}
                  <span className="text-xs sm:text-sm font-normal italic text-stone-500">
                    — {activeStage.districtFr}
                  </span>
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  每个站点包含 {CHAPTERS_PER_POINT} 个锁定递进章节，每章 {QUESTIONS_PER_CHAPTER} 道必答思辨题（答对全部 {QUESTIONS_PER_CHAPTER} 题解锁下一章）。
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  gameAudio.playTap();
                  onStartChapterQuiz(activeCity.index, activePointIdx, activeChapterIdx);
                }}
                className="min-h-[44px] px-5 py-2.5 rounded-xl chameleon-btn font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-sm btn-tactile whitespace-nowrap"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>
                  {variant === 'dashboard'
                    ? `进入第 ${activeChapterIdx + 1} 章 (${QUESTIONS_PER_CHAPTER}题)`
                    : `开启第 ${activeChapterIdx + 1} 章 · ${QUESTIONS_PER_CHAPTER} 题`}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 10-Chapter Sequential Unlock Grid (10 chapitres × 20 questionnaires) */}
            <div className="pt-3 border-t border-stone-200/70 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-stone-600">
                <span className="font-semibold text-stone-800 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-amber-700" />
                  <span>本站点 10 大进阶章节（每章 {QUESTIONS_PER_CHAPTER} 题）</span>
                </span>
                <span className="font-numeric tabular-nums text-stone-500">
                  已完成 {completedChaptersInActivePoint.length} / {CHAPTERS_PER_POINT} 章
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-1.5">
                {Array.from({ length: CHAPTERS_PER_POINT }, (_, chIdx) => {
                  const isChUnlocked = checkChapterUnlocked(
                    progress,
                    activeCity.index,
                    activePointIdx,
                    chIdx
                  );
                  const isChCompleted = checkChapterCompleted(
                    progress,
                    activeCity.index,
                    activePointIdx,
                    chIdx
                  );
                  const isChCurrent = chIdx === activeChapterIdx;

                  return (
                    <button
                      key={`ch-${chIdx}`}
                      type="button"
                      disabled={!isChUnlocked}
                      onClick={() => {
                        if (!isChUnlocked) return;
                        gameAudio.playTap();
                        onSelectChapter(chIdx);
                      }}
                      title={
                        isChUnlocked
                          ? `第 ${chIdx + 1} 章 · ${QUESTIONS_PER_CHAPTER} 道问卷（${
                              isChCompleted ? '已通关' : '已解锁'
                            }）`
                          : `答对第 ${chIdx} 章全部 ${QUESTIONS_PER_CHAPTER} 题后解锁`
                      }
                      className={`min-h-[44px] px-2 py-1.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-0.5 ${
                        isChCurrent
                          ? 'bg-stone-900 text-white border-stone-900 shadow-xs cursor-pointer'
                          : isChCompleted
                          ? 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:border-emerald-500 cursor-pointer'
                          : isChUnlocked
                          ? 'bg-white text-stone-900 border-stone-300 hover:border-stone-600 cursor-pointer'
                          : 'bg-stone-100/80 text-stone-400 border-stone-200/70 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center gap-1 text-[11px] font-numeric font-bold whitespace-nowrap">
                        <span>第{chIdx + 1}章</span>
                        {isChCompleted && (
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                        )}
                        {!isChUnlocked && <Lock className="w-2.5 h-2.5 text-stone-400 shrink-0" />}
                      </div>
                      <span
                        className={`text-[9.5px] font-mono tabular-nums ${
                          isChCurrent ? 'text-amber-300' : 'text-stone-500'
                        }`}
                      >
                        {isChCompleted ? '20/20' : `${QUESTIONS_PER_CHAPTER}题`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Horizontal District Itinerary Bar (I..VIII within current capital) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
          {cityStages.map((stage, idx) => {
            const isUnlocked = checkPointUnlocked(progress, activeCity.index, idx);
            const isCompleted = checkPointCompleted(progress, activeCity.index, idx);
            const isCurrent = idx === activePointIdx;
            const chDone = getCompletedChaptersList(progress, activeCity.index, idx).length;
            return (
              <button
                key={`${activeCity.id}-${stage.id}`}
                type="button"
                disabled={!isUnlocked}
                onClick={() => {
                  if (!isUnlocked) return;
                  gameAudio.playTap();
                  onSelectPoint(idx);
                }}
                title={
                  isUnlocked
                    ? `${stage.roman}. ${stage.districtZh} (${chDone}/${CHAPTERS_PER_POINT} 章)`
                    : `完成上一站点全部 ${CHAPTERS_PER_POINT} 章即可解锁`
                }
                className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all shrink-0 whitespace-nowrap border ${
                  isCurrent
                    ? 'bg-stone-900 text-white border-stone-900 font-bold shadow-xs cursor-pointer'
                    : isCompleted
                    ? 'bg-emerald-50/90 text-emerald-900 border-emerald-200 hover:border-emerald-400 cursor-pointer'
                    : isUnlocked
                    ? 'bg-white text-stone-800 border-stone-200 hover:border-stone-500 cursor-pointer'
                    : 'bg-stone-100/80 text-stone-400 border-stone-200/60 cursor-not-allowed'
                }`}
              >
                <span className="font-serif-editorial font-bold">{stage.roman}.</span>
                <span>{stage.districtZh}</span>
                <span
                  className={`text-[10px] font-mono tabular-nums ${
                    isCurrent ? 'text-amber-300' : 'text-stone-400'
                  }`}
                >
                  {chDone}/{CHAPTERS_PER_POINT}
                </span>
                {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                {!isUnlocked && <Lock className="w-3 h-3 text-stone-400 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Authentic Archival 2D Architectural City Map Frame */}
      <div
        className="editorial-card rounded-2xl overflow-hidden border border-stone-300/90 shadow-md relative"
        style={{ backgroundColor: activeCity.palette.paperMid }}
      >
        <div className="absolute inset-2 rounded-xl border border-stone-900/15 pointer-events-none z-20" />

        {/* Top-Left Cartographic Title Cartouche */}
        <div className="absolute top-4 left-4 z-30 flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[#FAF8F5]/92 backdrop-blur-md border border-stone-900/15 shadow-xs pointer-events-none">
          <Compass className="w-4 h-4 text-amber-800 shrink-0" />
          <div className="leading-tight">
            <div className="font-serif-editorial text-xs font-bold text-stone-900 tracking-wide">
              {activeCity.cityFr} · {activeCity.cityZh}
            </div>
            <div className="text-[10px] font-mono text-stone-500 tabular-nums">
              {activeCity.coordinates} · {activeCity.countryFr}
            </div>
          </div>
        </div>

        {/* Unlock Toast (Auto-Pan or New Capital Unlocked) */}
        <AnimatePresence>
          {(isAutoScrolling || newlyUnlockedCityIndex !== null) && (
            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.95 }}
              transition={{ duration: 0.18 }}
              className="absolute top-4 left-1/2 -translate-x-1/2 z-40 px-3.5 py-1.5 rounded-xl bg-stone-900/92 text-amber-200 text-xs font-semibold backdrop-blur-md shadow-lg flex items-center gap-1.5 pointer-events-none border border-amber-400/25 whitespace-nowrap"
            >
              <Compass className="w-3.5 h-3.5 text-amber-300" />
              <span>
                {newlyUnlockedCityIndex !== null
                  ? `新世界首都地图已解锁：${WORLD_CAPITALS[newlyUnlockedCityIndex]?.cityZh}`
                  : `正在定位至街区：${activeStage.districtZh}`}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top-Right Map Navigation Toolbar */}
        <div className="absolute top-4 right-4 z-30 flex items-center gap-1.5 bg-[#FAF8F5]/92 backdrop-blur-md p-1 rounded-xl border border-stone-900/15 shadow-xs">
          <button
            type="button"
            onClick={() => {
              gameAudio.playTap();
              panToPoint(activePointIdx, 20);
            }}
            className="min-h-[34px] px-2.5 py-1 rounded-lg hover:bg-white text-xs font-semibold text-stone-800 flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
            title="居中定位到当前坐标"
          >
            <Crosshair className="w-3.5 h-3.5 text-amber-700" />
            <span className="hidden sm:inline">定位</span>
          </button>

          <span className="w-px h-4 bg-stone-300/80" aria-hidden="true" />

          <button
            type="button"
            onClick={() => handleZoomStep(-0.18)}
            className="min-h-[34px] min-w-[34px] rounded-lg hover:bg-white text-stone-700 hover:text-stone-950 flex items-center justify-center transition-colors cursor-pointer"
            title="缩小地图"
            aria-label="缩小地图"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <span className="text-[11px] font-mono font-semibold text-stone-700 px-1 tabular-nums hidden sm:inline">
            {Math.round(zoomLevel * 100)}%
          </span>

          <button
            type="button"
            onClick={() => handleZoomStep(0.18)}
            className="min-h-[34px] min-w-[34px] rounded-lg hover:bg-white text-stone-700 hover:text-stone-950 flex items-center justify-center transition-colors cursor-pointer"
            title="放大街区细节"
            aria-label="放大街区细节"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleFitView}
            className="min-h-[34px] min-w-[34px] rounded-lg hover:bg-white text-stone-700 hover:text-stone-950 flex items-center justify-center transition-colors cursor-pointer"
            title="全景俯瞰全城"
            aria-label="全景俯瞰全城"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Bottom-Left Ornate Compass Rose & Scale Bar */}
        <div className="absolute bottom-4 left-4 z-30 flex items-end gap-2.5 pointer-events-none">
          <div className="w-11 h-11 rounded-full bg-[#FAF8F5]/92 backdrop-blur-md border border-stone-900/15 shadow-xs flex items-center justify-center">
            <svg viewBox="0 0 64 64" className="w-9 h-9">
              <circle
                cx="32"
                cy="32"
                r="26"
                fill="none"
                stroke="#78716C"
                strokeWidth="0.9"
                strokeDasharray="2 2"
              />
              <polygon points="32,7 36,28 32,32 28,28" fill="#B45309" />
              <polygon points="32,57 36,36 32,32 28,36" fill="#78716C" opacity="0.55" />
              <polygon points="7,32 28,28 32,32 28,36" fill="#78716C" opacity="0.4" />
              <polygon points="57,32 36,28 32,32 36,36" fill="#78716C" opacity="0.4" />
              <circle cx="32" cy="32" r="2.4" fill="#1C1917" />
              <text
                x="32"
                y="15"
                textAnchor="middle"
                fontSize="7"
                fontWeight="bold"
                fill="#1C1917"
                fontFamily="serif"
              >
                N
              </text>
            </svg>
          </div>

          <div className="px-2.5 py-1.5 rounded-lg bg-[#FAF8F5]/90 backdrop-blur-md border border-stone-900/12 text-[9.5px] font-mono text-stone-700 hidden sm:flex flex-col gap-0.5 tabular-nums">
            <div className="flex items-center justify-between gap-4">
              <span>0</span>
              <span>250m</span>
              <span>500m</span>
            </div>
            <div className="w-24 h-1.5 flex border border-stone-700/70 overflow-hidden">
              <div className="w-1/2 h-full bg-stone-800" />
              <div className="w-1/2 h-full bg-white" />
            </div>
          </div>
        </div>

        {/* Bottom-Right Subtle Cartographic Map Key */}
        <div className="absolute bottom-4 right-4 z-30 hidden md:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-[#FAF8F5]/90 backdrop-blur-md border border-stone-900/12 text-[10px] text-stone-700 pointer-events-none">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-700 inline-block" />
            <span>已通关 (10/10章)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-stone-900 ring-2 ring-amber-400 inline-block" />
            <span>当前坐标</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-stone-400" />
            <span>待解锁</span>
          </span>
        </div>

        {/* 2D Pan/Zoom Interactive Cartographic Viewport */}
        <div
          ref={viewportRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className={`relative w-full h-[460px] sm:h-[540px] lg:h-[580px] overflow-auto select-none touch-pan-x touch-pan-y ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          style={{ backgroundColor: activeCity.palette.paperMid }}
        >
          <div
            style={{
              width: `${Math.round(WORLD_WIDTH * zoomLevel)}px`,
              height: `${Math.round(WORLD_HEIGHT * zoomLevel)}px`,
            }}
            className="relative mx-auto"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCity.id}
                initial={{ opacity: 0.35 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0.35 }}
                transition={{ duration: 0.22 }}
                style={{
                  width: `${WORLD_WIDTH}px`,
                  height: `${WORLD_HEIGHT}px`,
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: 'top left',
                  background: `radial-gradient(ellipse at 52% 45%, ${activeCity.palette.paperFrom} 0%, ${activeCity.palette.paperMid} 58%, ${activeCity.palette.paperTo} 100%)`,
                }}
                className="relative overflow-hidden transition-transform duration-200 ease-out"
              >
                {/* True-Aspect SVG Cartographic Atlas Layers */}
                <svg
                  viewBox={`0 0 ${WORLD_WIDTH} ${WORLD_HEIGHT}`}
                  className="absolute inset-0 w-full h-full pointer-events-none"
                >
                  <defs>
                    <linearGradient
                      id={`waterGrad-${activeCity.id}`}
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="0%"
                    >
                      <stop offset="0%" stopColor={activeCity.palette.waterInner} />
                      <stop offset="50%" stopColor="#D3E5E1" />
                      <stop offset="100%" stopColor={activeCity.palette.waterInner} />
                    </linearGradient>

                    <linearGradient id="cityAtlasRouteGrad2" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#059669" />
                      <stop offset="48%" stopColor="#D97706" />
                      <stop offset="100%" stopColor="#4F46E5" />
                    </linearGradient>

                    <pattern
                      id="parkStipple"
                      width="10"
                      height="10"
                      patternUnits="userSpaceOnUse"
                    >
                      <circle cx="2" cy="2" r="0.6" fill="rgba(20, 83, 45, 0.14)" />
                      <circle cx="7" cy="7" r="0.6" fill="rgba(20, 83, 45, 0.1)" />
                    </pattern>

                    <path id="riverLabelCurve" d={riverPathD} />
                    <path id="boulevardSouthCurve" d="M 145 552 C 320 518, 480 555, 650 562" />
                    <path id="boulevardNorthCurve" d="M 225 152 C 420 180, 580 198, 700 210" />
                  </defs>

                  {/* LAYER 1: IGN Latitude/Longitude Graticule */}
                  <g opacity="0.45">
                    {[160, 320, 480, 640, 800, 960].map((gx, i) => (
                      <g key={`gx-${gx}`}>
                        <line
                          x1={gx}
                          y1={0}
                          x2={gx}
                          y2={WORLD_HEIGHT}
                          stroke="#78716C"
                          strokeWidth="0.6"
                          strokeDasharray="3 5"
                        />
                        <text x={gx + 6} y={24} fontSize="9" fontFamily="monospace" fill="#78716C">
                          {String.fromCharCode(65 + i)}
                        </text>
                      </g>
                    ))}
                    {[140, 280, 420, 560].map((gy, i) => (
                      <g key={`gy-${gy}`}>
                        <line
                          x1={0}
                          y1={gy}
                          x2={WORLD_WIDTH}
                          y2={gy}
                          stroke="#78716C"
                          strokeWidth="0.6"
                          strokeDasharray="3 5"
                        />
                        <text x={16} y={gy - 5} fontSize="9" fontFamily="monospace" fill="#78716C">
                          0{i + 1}
                        </text>
                      </g>
                    ))}
                  </g>

                  {/* LAYER 2: Topographic Elevation Contours */}
                  <g fill="none" stroke="rgba(161, 98, 7, 0.16)" strokeWidth="1">
                    <ellipse cx="195" cy="155" rx="165" ry="105" />
                    <ellipse cx="195" cy="155" rx="125" ry="78" />
                    <ellipse cx="195" cy="155" rx="85" ry="52" />
                    <ellipse cx="435" cy="182" rx="115" ry="72" />
                    <ellipse cx="435" cy="182" rx="76" ry="46" />
                    <path d="M 620 80 Q 790 155, 1080 120" strokeDasharray="4 4" />
                    <path d="M 650 55 Q 820 120, 1090 92" strokeDasharray="4 4" />
                  </g>
                  <text
                    x="110"
                    y="78"
                    fontSize="9"
                    fontFamily="serif"
                    fontStyle="italic"
                    fill="rgba(120, 53, 15, 0.6)"
                  >
                    {activeCity.hillLabel}
                  </text>
                  <text
                    x="412"
                    y="118"
                    fontSize="8.5"
                    fontFamily="serif"
                    fontStyle="italic"
                    fill="rgba(120, 53, 15, 0.55)"
                  >
                    {activeCity.heritageLandmark}
                  </text>

                  {/* LAYER 3: Secondary Street Network */}
                  <g fill="none" strokeLinecap="round" strokeLinejoin="round">
                    {secondaryStreets.map((d, idx) => (
                      <React.Fragment key={`st-${idx}`}>
                        <path d={d} stroke="rgba(28, 25, 23, 0.14)" strokeWidth="9" />
                        <path d={d} stroke="#FAF7F0" strokeWidth="7" />
                      </React.Fragment>
                    ))}
                  </g>

                  {/* LAYER 4: Urban Haussmannian Blocks */}
                  <g>
                    {cityBlocks.map((b, idx) => (
                      <g key={`blk-${idx}`}>
                        <rect
                          x={b.x}
                          y={b.y}
                          width={b.w}
                          height={b.h}
                          rx="3"
                          fill={activeCity.palette.blockFill}
                          stroke="rgba(28, 25, 23, 0.14)"
                          strokeWidth="1"
                        />
                        {b.courtyard && (
                          <rect
                            x={b.x + 11}
                            y={b.y + 10}
                            width={Math.max(10, b.w - 22)}
                            height={Math.max(10, b.h - 20)}
                            rx="1.5"
                            fill="#F7F3EA"
                            stroke="rgba(28, 25, 23, 0.08)"
                            strokeWidth="0.7"
                          />
                        )}
                      </g>
                    ))}
                  </g>

                  {/* LAYER 5: Botanical Gardens & Parks */}
                  <g>
                    {botanicalParks.map((park, idx) => (
                      <g key={`park-${idx}`}>
                        <rect
                          x={park.x}
                          y={park.y}
                          width={park.w}
                          height={park.h}
                          rx="12"
                          fill={activeCity.palette.parkFill}
                          stroke="rgba(21, 128, 61, 0.28)"
                          strokeWidth="1.2"
                        />
                        <rect
                          x={park.x}
                          y={park.y}
                          width={park.w}
                          height={park.h}
                          rx="12"
                          fill="url(#parkStipple)"
                        />
                        <path
                          d={`M ${park.x + 8} ${park.y + park.h / 2} Q ${
                            park.x + park.w / 2
                          } ${park.y + 12}, ${park.x + park.w - 8} ${park.y + park.h / 2}`}
                          fill="none"
                          stroke="rgba(255, 252, 245, 0.78)"
                          strokeWidth="2.2"
                        />
                        <circle
                          cx={park.x + park.w / 2}
                          cy={park.y + park.h / 2}
                          r="5.5"
                          fill="#BDD6D3"
                          stroke="rgba(28, 25, 23, 0.18)"
                          strokeWidth="0.8"
                        />
                        {park.trees.map(([tx, ty], ti) => (
                          <circle
                            key={`tree-${ti}`}
                            cx={tx}
                            cy={ty}
                            r="6.5"
                            fill="#A9C79E"
                            stroke="rgba(20, 83, 45, 0.25)"
                            strokeWidth="0.8"
                          />
                        ))}
                        <text
                          x={park.x + park.w / 2}
                          y={park.y + park.h - 7}
                          textAnchor="middle"
                          fontSize="8.5"
                          fontFamily="serif"
                          fontStyle="italic"
                          fill="#14532D"
                          opacity="0.78"
                        >
                          {park.name}
                        </text>
                      </g>
                    ))}
                  </g>

                  {/* LAYER 6: Capital City River + Stone Bridges */}
                  <g>
                    <path
                      d={riverPathD}
                      fill="none"
                      stroke="rgba(28, 25, 23, 0.18)"
                      strokeWidth="56"
                      strokeLinecap="round"
                    />
                    <path
                      d={riverPathD}
                      fill="none"
                      stroke="#F4EFE4"
                      strokeWidth="51"
                      strokeLinecap="round"
                    />
                    <path
                      d={riverPathD}
                      fill="none"
                      stroke={activeCity.palette.waterOuter}
                      strokeWidth="44"
                      strokeLinecap="round"
                    />
                    <path
                      d={riverPathD}
                      fill="none"
                      stroke={`url(#waterGrad-${activeCity.id})`}
                      strokeWidth="38"
                      strokeLinecap="round"
                    />
                    <path
                      d={riverPathD}
                      fill="none"
                      stroke="rgba(255, 255, 255, 0.55)"
                      strokeWidth="1.4"
                      strokeDasharray="14 20"
                      strokeLinecap="round"
                    />

                    <text
                      fontSize="10"
                      fontFamily="serif"
                      fontStyle="italic"
                      letterSpacing="2.4"
                      fill="#134E4A"
                      opacity="0.82"
                    >
                      <textPath href="#riverLabelCurve" startOffset="22%">
                        {activeCity.riverFr.toUpperCase()} · {activeCity.riverZh}
                      </textPath>
                    </text>

                    <g transform="translate(240, 356) rotate(-8)">
                      <rect
                        x="-13"
                        y="-30"
                        width="26"
                        height="60"
                        rx="3"
                        fill="#EDE5D5"
                        stroke="#57534E"
                        strokeWidth="1.2"
                      />
                      <line x1="-8" y1="-28" x2="-8" y2="28" stroke="#78716C" strokeWidth="0.9" />
                      <line x1="8" y1="-28" x2="8" y2="28" stroke="#78716C" strokeWidth="0.9" />
                    </g>

                    <g transform="translate(525, 402) rotate(5)">
                      <rect
                        x="-13"
                        y="-30"
                        width="26"
                        height="60"
                        rx="3"
                        fill="#EDE5D5"
                        stroke="#57534E"
                        strokeWidth="1.2"
                      />
                      <line x1="-8" y1="-28" x2="-8" y2="28" stroke="#78716C" strokeWidth="0.9" />
                      <line x1="8" y1="-28" x2="8" y2="28" stroke="#78716C" strokeWidth="0.9" />
                    </g>

                    <g transform="translate(855, 365) rotate(-10)">
                      <rect
                        x="-22"
                        y="-36"
                        width="44"
                        height="72"
                        rx="4"
                        fill="#F7F1E4"
                        stroke="#292524"
                        strokeWidth="1.5"
                      />
                      <path
                        d="M -22 -18 L -28 -24 M 22 -18 L 28 -24 M -22 18 L -28 24 M 22 18 L 28 24"
                        stroke="#57534E"
                        strokeWidth="1.5"
                      />
                      <line x1="-15" y1="-34" x2="-15" y2="34" stroke="#A8A29E" strokeWidth="1" />
                      <line x1="15" y1="-34" x2="15" y2="34" stroke="#A8A29E" strokeWidth="1" />
                    </g>
                  </g>

                  {/* LAYER 7: Grand Boulevard Route & Animated Progress */}
                  <g fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <path d={fullRoutePathD} stroke="rgba(28, 25, 23, 0.22)" strokeWidth="22" />
                    <path d={fullRoutePathD} stroke="#FFFFFF" strokeWidth="18" />
                    <path d={fullRoutePathD} stroke="#F3EDE0" strokeWidth="13" />
                    <path
                      d={fullRoutePathD}
                      stroke="rgba(120, 113, 108, 0.45)"
                      strokeWidth="2.2"
                      strokeDasharray="6 6"
                    />
                    <motion.path
                      d={fullRoutePathD}
                      stroke="url(#cityAtlasRouteGrad2)"
                      strokeWidth="5.5"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: progressRatio }}
                      transition={{
                        type: 'spring',
                        stiffness: 65,
                        damping: 18,
                        mass: 1,
                      }}
                    />
                  </g>

                  <text
                    fontSize="8.5"
                    fontFamily="sans-serif"
                    fontWeight="600"
                    letterSpacing="1.8"
                    fill="rgba(41, 37, 36, 0.6)"
                  >
                    <textPath href="#boulevardSouthCurve" startOffset="12%">
                      AVENUE DE {activeCity.cityFr.toUpperCase()} · 直觉思辨大道
                    </textPath>
                  </text>
                  <text
                    fontSize="8.5"
                    fontFamily="sans-serif"
                    fontWeight="600"
                    letterSpacing="1.8"
                    fill="rgba(41, 37, 36, 0.6)"
                  >
                    <textPath href="#boulevardNorthCurve" startOffset="16%">
                      BOULEVARD MÉTACOGNITIF · 元认知高地大道
                    </textPath>
                  </text>

                  {/* LAYER 8: Architectural Monument Plan Footprints */}
                  {cityStages.map((stage, idx) => {
                    const isUnlocked = checkPointUnlocked(progress, activeCity.index, idx);
                    const strokeCol = isUnlocked
                      ? 'rgba(28, 25, 23, 0.4)'
                      : 'rgba(120, 113, 108, 0.25)';
                    const fillCol = isUnlocked
                      ? 'rgba(255, 255, 255, 0.72)'
                      : 'rgba(235, 228, 215, 0.55)';
                    return (
                      <g
                        key={`monument-${stage.id}`}
                        transform={`translate(${stage.mapX}, ${stage.mapY})`}
                      >
                        <circle
                          cx="0"
                          cy="0"
                          r="36"
                          fill={fillCol}
                          stroke={strokeCol}
                          strokeWidth="1"
                          strokeDasharray="3 2"
                        />
                        {stage.monumentType === 'colonnade' && (
                          <g stroke={strokeCol} strokeWidth="1.1" fill="none">
                            <circle cx="0" cy="0" r="29" />
                            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
                              <circle
                                key={deg}
                                cx={Math.cos((deg * Math.PI) / 180) * 29}
                                cy={Math.sin((deg * Math.PI) / 180) * 29}
                                r="2"
                                fill="#D6CEBE"
                              />
                            ))}
                          </g>
                        )}
                        {stage.monumentType === 'palace' && (
                          <path
                            d="M -34 -24 L 34 -24 L 34 22 L 16 22 L 16 -8 L -16 -8 L -16 22 L -34 22 Z"
                            fill="#EAE2D3"
                            stroke={strokeCol}
                            strokeWidth="1.1"
                          />
                        )}
                        {stage.monumentType === 'market' && (
                          <polygon
                            points="0,-32 23,-23 32,0 23,23 0,32 -23,23 -32,0 -23,-23"
                            fill="#EAE2D3"
                            stroke={strokeCol}
                            strokeWidth="1.1"
                          />
                        )}
                        {stage.monumentType === 'etoile' && (
                          <g stroke={strokeCol} strokeWidth="1">
                            {[0, 60, 120, 180, 240, 300].map((deg) => (
                              <line
                                key={deg}
                                x1="0"
                                y1="0"
                                x2={Math.cos((deg * Math.PI) / 180) * 44}
                                y2={Math.sin((deg * Math.PI) / 180) * 44}
                              />
                            ))}
                            <circle cx="0" cy="0" r="28" fill="#FAF6ED" />
                          </g>
                        )}
                        {stage.monumentType === 'conservatory' && (
                          <g stroke={strokeCol} strokeWidth="1" fill="#E8EFE7">
                            <rect x="-32" y="-20" width="64" height="40" rx="18" />
                            <line x1="-26" y1="0" x2="26" y2="0" />
                            <line x1="0" y1="-20" x2="0" y2="20" />
                          </g>
                        )}
                        {stage.monumentType === 'observatory' && (
                          <g stroke={strokeCol} strokeWidth="1" fill="none">
                            <circle cx="0" cy="0" r="30" fill="#EAE4D8" />
                            <line x1="-38" y1="0" x2="38" y2="0" />
                            <line x1="0" y1="-38" x2="0" y2="38" />
                          </g>
                        )}
                        {stage.monumentType === 'citadel' && (
                          <g stroke={strokeCol} strokeWidth="1.1">
                            <polygon
                              points="0,-38 14,-24 34,-28 24,-10 38,6 20,16 24,34 0,26 -24,34 -20,16 -38,6 -24,-10 -34,-28 -14,-24"
                              fill="#E5DCCB"
                            />
                          </g>
                        )}
                      </g>
                    );
                  })}

                  <text
                    x="960"
                    y="54"
                    textAnchor="end"
                    fontSize="11"
                    fontFamily="serif"
                    fontStyle="italic"
                    letterSpacing="2.2"
                    fill="rgba(41, 37, 36, 0.45)"
                  >
                    RIVE NORD · {activeCity.cityFr.toUpperCase()}
                  </text>
                  <text
                    x="960"
                    y="668"
                    textAnchor="end"
                    fontSize="11"
                    fontFamily="serif"
                    fontStyle="italic"
                    letterSpacing="2.2"
                    fill="rgba(41, 37, 36, 0.45)"
                  >
                    RIVE SUD · {activeCity.countryFr.toUpperCase()}
                  </text>
                </svg>

                {/* INTERACTIVE HTML LAYER: Strictly Locked/Unlocked Point Pins & Explorer Token */}
                {cityStages.map((stage, idx) => {
                  const isUnlocked = checkPointUnlocked(progress, activeCity.index, idx);
                  const isCompleted = checkPointCompleted(progress, activeCity.index, idx);
                  const isCurrent = idx === activePointIdx;
                  const isJustUnlocked = newlyUnlockedPointIndex === idx;
                  const chDone = getCompletedChaptersList(
                    progress,
                    activeCity.index,
                    idx
                  ).length;

                  const plaquePosClass =
                    stage.plaquePlacement === 'right'
                      ? 'left-16 top-1/2 -translate-y-1/2 text-left'
                      : stage.plaquePlacement === 'left'
                      ? 'right-16 top-1/2 -translate-y-1/2 text-right'
                      : stage.plaquePlacement === 'top'
                      ? 'bottom-15 left-1/2 -translate-x-1/2 text-center'
                      : 'top-15 left-1/2 -translate-x-1/2 text-center';

                  return (
                    <div
                      key={`${activeCity.id}-${stage.id}`}
                      style={{
                        left: `${stage.mapX}px`,
                        top: `${stage.mapY}px`,
                      }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 z-10 flex items-center justify-center"
                    >
                      <AnimatePresence>
                        {isJustUnlocked && isUnlocked && (
                          <motion.div
                            key={`burst-${stage.id}`}
                            initial={{ scale: 0.7, opacity: 0.9 }}
                            animate={{ scale: 2.1, opacity: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.95, ease: 'easeOut' }}
                            className="absolute w-16 h-16 rounded-full pointer-events-none"
                            style={{
                              background: `radial-gradient(circle, ${stage.accentColor}55 0%, transparent 72%)`,
                            }}
                          />
                        )}
                      </AnimatePresence>

                      {/* Explorer Avatar Pin */}
                      {isCurrent && (
                        <motion.div
                          layoutId="city-quiz-player-token"
                          transition={{
                            type: 'spring',
                            stiffness: 220,
                            damping: 22,
                            mass: 0.85,
                          }}
                          className="absolute -top-11 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
                        >
                          <motion.div
                            animate={{ y: [0, -3.5, 0] }}
                            transition={{
                              duration: 2.2,
                              repeat: Infinity,
                              ease: 'easeInOut',
                            }}
                            className="flex flex-col items-center"
                          >
                            <div className="w-9 h-9 rounded-full border-2 border-white shadow-xl overflow-hidden bg-stone-900 flex items-center justify-center ring-2 ring-amber-500">
                              {playerAvatar ? (
                                <img
                                  src={playerAvatar}
                                  alt={playerName}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Compass className="w-4 h-4 text-amber-300" />
                              )}
                            </div>
                            <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-amber-500 -mt-0.5 drop-shadow-sm" />
                          </motion.div>
                        </motion.div>
                      )}

                      {/* Point Pin */}
                      <motion.button
                        type="button"
                        disabled={!isUnlocked}
                        onClick={() => {
                          if (!isUnlocked || dragStateRef.current.moved) return;
                          gameAudio.playTap();
                          onSelectPoint(idx);
                        }}
                        whileHover={isUnlocked ? { scale: 1.08 } : undefined}
                        whileTap={isUnlocked ? { scale: 0.94 } : undefined}
                        animate={
                          isJustUnlocked ? { scale: [0.88, 1.18, 1] } : { scale: 1 }
                        }
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        className={`relative w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors shadow-md ${
                          !isUnlocked
                            ? 'bg-[#EAE3D5] border-stone-300 text-stone-400 cursor-not-allowed'
                            : isCurrent
                            ? 'bg-stone-900 border-amber-400 text-white cursor-pointer shadow-xl ring-4 ring-amber-400/25'
                            : isCompleted
                            ? 'bg-emerald-700 border-emerald-100 text-white cursor-pointer'
                            : 'bg-white border-stone-800/85 text-stone-900 hover:border-amber-600 cursor-pointer'
                        }`}
                        title={
                          isUnlocked
                            ? `${stage.roman}. ${stage.districtZh} (${chDone}/${CHAPTERS_PER_POINT} 章)`
                            : `完成上一站点全部 ${CHAPTERS_PER_POINT} 章即可解锁`
                        }
                      >
                        <span
                          className={`absolute inset-1 rounded-full border pointer-events-none ${
                            isCurrent
                              ? 'border-amber-400/40'
                              : isCompleted
                              ? 'border-white/30'
                              : 'border-stone-900/10'
                          }`}
                        />

                        {!isUnlocked ? (
                          <Lock className="w-4 h-4 text-stone-400" />
                        ) : isCompleted && !isCurrent ? (
                          <CheckCircle2 className="w-4.5 h-4.5 text-white" />
                        ) : (
                          renderStageIcon(
                            stage.iconType,
                            `w-4.5 h-4.5 ${isCurrent ? 'text-amber-300' : 'text-stone-800'}`
                          )
                        )}

                        <span
                          className={`absolute -bottom-2 px-1.5 rounded-full text-[9px] font-serif-editorial font-bold border shadow-2xs ${
                            isCurrent
                              ? 'bg-amber-500 text-stone-950 border-white'
                              : isCompleted
                              ? 'bg-emerald-800 text-white border-emerald-100'
                              : isUnlocked
                              ? 'bg-stone-900 text-white border-white'
                              : 'bg-stone-300 text-stone-600 border-stone-100'
                          }`}
                        >
                          {stage.roman}
                        </span>
                      </motion.button>

                      {/* District Plaque */}
                      <button
                        type="button"
                        disabled={!isUnlocked}
                        onClick={() => {
                          if (!isUnlocked || dragStateRef.current.moved) return;
                          gameAudio.playTap();
                          onSelectPoint(idx);
                        }}
                        className={`absolute w-44 px-3 py-2 rounded-xl border backdrop-blur-md transition-all ${plaquePosClass} ${
                          isCurrent
                            ? 'bg-[#FAF8F5]/96 border-stone-900 shadow-lg cursor-pointer z-20'
                            : isUnlocked
                            ? 'bg-white/90 border-stone-300/95 hover:border-stone-700 shadow-xs cursor-pointer'
                            : 'bg-[#F5F1E8]/85 border-stone-300/60 opacity-75 cursor-not-allowed'
                        }`}
                      >
                        <div
                          className={`text-[9.5px] font-mono font-bold tracking-wider uppercase truncate flex items-center gap-1 ${
                            stage.plaquePlacement === 'left'
                              ? 'justify-end'
                              : stage.plaquePlacement === 'top' ||
                                stage.plaquePlacement === 'bottom'
                              ? 'justify-center'
                              : 'justify-start'
                          } ${
                            isCurrent
                              ? 'text-amber-800'
                              : isCompleted
                              ? 'text-emerald-800'
                              : 'text-stone-500'
                          }`}
                        >
                          <span>
                            {isCompleted
                              ? `Exploré · ${CHAPTERS_PER_POINT}/${CHAPTERS_PER_POINT}章`
                              : isCurrent
                              ? `Position · ${chDone}/${CHAPTERS_PER_POINT}章`
                              : isUnlocked
                              ? `Ouvert · ${chDone}/${CHAPTERS_PER_POINT}章`
                              : 'Verrouillé · 待解锁'}
                          </span>
                        </div>
                        <div className="font-serif-editorial text-xs font-bold text-stone-900 truncate mt-0.5">
                          {stage.districtZh}
                        </div>
                        <div className="text-[10px] text-stone-500 italic truncate font-serif-editorial">
                          {stage.districtFr}
                        </div>
                      </button>
                    </div>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

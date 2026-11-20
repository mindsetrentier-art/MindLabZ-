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
  Sparkles,
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
    accentColor: '#B45309',
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
    accentColor: '#3730A3',
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
    accentColor: '#047857',
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
    accentColor: '#9F1239',
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
    accentColor: '#0F766E',
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
    accentColor: '#6B21A8',
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
    accentColor: '#1E40AF',
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
    accentColor: '#92400E',
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

  // Curated Haussmannian urban blocks with classical courtyards
  const cityBlocks = [
    { x: 48, y: 448, w: 68, h: 48, courtyard: true },
    { x: 48, y: 508, w: 54, h: 52, courtyard: true },
    { x: 50, y: 616, w: 86, h: 40, courtyard: true },
    { x: 185, y: 432, w: 72, h: 44, courtyard: true },
    { x: 215, y: 612, w: 88, h: 44, courtyard: true },
    { x: 300, y: 425, w: 62, h: 48, courtyard: true },
    { x: 325, y: 590, w: 82, h: 52, courtyard: true },
    { x: 468, y: 438, w: 74, h: 46, courtyard: true },
    { x: 488, y: 520, w: 78, h: 54, courtyard: true },
    { x: 560, y: 620, w: 94, h: 36, courtyard: false },
    { x: 735, y: 442, w: 68, h: 44, courtyard: true },
    { x: 750, y: 585, w: 86, h: 52, courtyard: true },
    { x: 878, y: 608, w: 92, h: 44, courtyard: true },
    { x: 998, y: 426, w: 70, h: 58, courtyard: true },
    { x: 1002, y: 556, w: 68, h: 66, courtyard: true },
    { x: 52, y: 68, w: 76, h: 52, courtyard: true },
    { x: 52, y: 228, w: 84, h: 54, courtyard: true },
    { x: 155, y: 274, w: 96, h: 46, courtyard: true },
    { x: 288, y: 66, w: 78, h: 48, courtyard: true },
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
    'M 24 475 L 365 445 L 620 480 L 1096 420',
    'M 24 605 L 395 628 L 780 610 L 1096 635',
    'M 118 355 L 145 560 L 165 676',
    'M 395 360 L 395 515 L 430 676',
    'M 660 385 L 660 575 L 675 676',
    'M 935 352 L 935 520 L 965 676',
    'M 24 132 L 435 124 L 840 136 L 1096 118',
    'M 24 258 L 540 264 L 1096 252',
    'M 185 24 L 185 165 L 222 365',
    'M 435 24 L 435 190 L 465 385',
    'M 690 24 L 690 215 L 705 382',
    'M 935 24 L 910 210 L 855 365',
  ];

  const canGoPrevCity =
    activeCity.index > 0 && checkCityUnlocked(progress, activeCity.index - 1);
  const canGoNextCity =
    activeCity.index < WORLD_CAPITALS.length - 1 &&
    checkCityUnlocked(progress, activeCity.index + 1);

  return (
    <div className="w-full space-y-5 sm:space-y-6">
      {/* 1. Museum Exhibition Folio & Architectural Progression Panel */}
      <section className="relative bg-[#FBF9F4] rounded-2xl border border-[#D7CEBE] shadow-[0_14px_40px_-24px_rgba(28,25,23,0.28)] overflow-hidden">
        {/* Subtle engraved top brass rule */}
        <div
          className="h-1 w-full"
          style={{
            background: `linear-gradient(90deg, ${activeCity.palette.accent} 0%, #B45309 50%, ${activeCity.palette.waterOuter} 100%)`,
          }}
        />

        <div className="p-5 sm:p-7 space-y-5">
          {/* Curatorial Accession Header */}
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 pb-5 border-b border-stone-300/75">
            <div className="space-y-2 max-w-3xl">
              {/* Unboxed Museum Catalog Kicker */}
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] font-sans tracking-[0.16em] uppercase text-stone-500 font-semibold">
                <span className="text-amber-800">Grand Atlas des Capitales</span>
                <span aria-hidden="true" className="text-stone-300">·</span>
                <span className="font-numeric tabular-nums text-stone-700">
                  Folio {String(activeCity.index + 1).padStart(2, '0')} / {WORLD_CAPITALS.length}
                </span>
                <span aria-hidden="true" className="text-stone-300">·</span>
                <span>{activeCity.continent}</span>
                <span aria-hidden="true" className="text-stone-300">·</span>
                <span className="normal-case tracking-normal text-stone-700 font-medium">
                  {activeCityLoveTier.labelZh}（主修 {activeCityLoveLaws.length} 律）
                </span>
                <span aria-hidden="true" className="text-stone-300">·</span>
                <span className="normal-case tracking-normal text-stone-500 font-numeric tabular-nums">
                  已启封 {unlockedCitiesCount}/{WORLD_CAPITALS.length} 城 · 累计 {totalCompletedChapters} 章
                </span>
              </div>

              {/* Monumental Bilingual City Headline */}
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h2 className="font-serif-editorial text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
                  {activeCity.cityZh}
                </h2>
                <span className="font-['Cormorant_Garamond','Playfair_Display',Georgia,serif] italic text-lg sm:text-xl text-stone-500">
                  {activeCity.cityFr}
                </span>
                <span className="text-xs sm:text-sm font-sans text-stone-500 font-numeric tabular-nums">
                  — {activeCity.countryZh} · {activeCity.coordinates} · {completedPointsInCity.length}/{POINTS_PER_CITY} 坐标
                </span>
              </div>

              {/* Archival Cultural Annotation */}
              <p className="text-xs sm:text-[13px] text-stone-600 leading-relaxed max-w-2xl">
                {activeCity.culturalFact}
              </p>

              {/* Unboxed Curated Psychological Corpus Line */}
              {activeCityLoveLaws.length > 0 && (
                <div className="pt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[11.5px] text-stone-600">
                  <span className="font-semibold text-rose-800 inline-flex items-center gap-1 shrink-0">
                    <Heart className="w-3 h-3 fill-rose-700/20 text-rose-700" />
                    <span>馆藏恋爱心理学定律：</span>
                  </span>
                  <span className="text-stone-700 leading-relaxed">
                    {activeCityLoveLaws.slice(0, 5).map((law, i) => (
                      <React.Fragment key={law.id}>
                        {i > 0 && <span className="mx-1.5 text-stone-300">·</span>}
                        <span className="font-medium text-stone-800">{law.nameZh}</span>
                      </React.Fragment>
                    ))}
                    {activeCityLoveLaws.length > 5 && (
                      <span className="text-stone-500 ml-1.5 font-numeric tabular-nums">
                        等共 {activeCityLoveLaws.length} 项
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>

            {/* Museum Folio Navigation Controls */}
            <div className="flex flex-wrap items-center gap-2 shrink-0 self-start">
              <div className="inline-flex items-center rounded-lg border border-[#D4CBB8] bg-[#F5F0E6] p-0.5 shadow-2xs">
                <button
                  type="button"
                  disabled={!canGoPrevCity}
                  onClick={() => {
                    if (!canGoPrevCity) return;
                    gameAudio.playTap();
                    onSelectCity(activeCity.index - 1);
                  }}
                  className={`min-h-[36px] min-w-[36px] rounded-md flex items-center justify-center transition-colors ${
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
                  className="min-h-[36px] px-3 py-1.5 rounded-md hover:bg-white text-xs font-semibold text-stone-900 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Globe className="w-3.5 h-3.5 text-amber-800" />
                  <span>50 国典藏地图册</span>
                </button>

                <button
                  type="button"
                  disabled={!canGoNextCity}
                  onClick={() => {
                    if (!canGoNextCity) return;
                    gameAudio.playTap();
                    onSelectCity(activeCity.index + 1);
                  }}
                  className={`min-h-[36px] min-w-[36px] rounded-md flex items-center justify-center transition-colors ${
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
                  className="min-h-[38px] px-3 py-1.5 rounded-lg bg-[#F5F0E6] hover:bg-[#EBE3D3] text-stone-700 border border-[#D4CBB8] text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  title="重置所有首都、站点与章节进度"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>重置进度</span>
                </button>
              )}
            </div>
          </div>

          {/* Collapsible 50-Capital Archival Catalog Drawer */}
          <AnimatePresence>
            {showAtlasModal && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="rounded-xl bg-[#F4EFE4] border border-[#D4CBB8] p-4 space-y-3.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
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
                            ? 'bg-stone-900 text-amber-50'
                            : 'bg-[#FBF9F4] text-stone-700 hover:text-stone-950 border border-[#D4CBB8]'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative flex-1 sm:w-52">
                      <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={citySearchQuery}
                        onChange={(e) => setCitySearchQuery(e.target.value)}
                        placeholder="检索首都、国家或法文名..."
                        className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#FBF9F4] border border-[#D4CBB8] text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-700"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAtlasModal(false)}
                      aria-label="收起地图册"
                      className="w-8 h-8 rounded-lg bg-[#FBF9F4] border border-[#D4CBB8] flex items-center justify-center text-stone-600 hover:text-stone-950 cursor-pointer shrink-0"
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
                    const tierShort =
                      city.index < 17 ? 'I · 初阶' : city.index < 34 ? 'II · 中阶' : 'III · 高阶';

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
                        className={`p-2.5 rounded-lg border text-left transition-all flex flex-col justify-between gap-1 ${
                          isCurrent
                            ? 'bg-stone-900 text-amber-50 border-stone-900 shadow-xs cursor-pointer'
                            : isCompleted
                            ? 'bg-emerald-50/80 text-emerald-950 border-emerald-300 hover:border-emerald-600 cursor-pointer'
                            : isUnlocked
                            ? 'bg-[#FBF9F4] text-stone-900 border-[#D4CBB8] hover:border-stone-600 cursor-pointer'
                            : 'bg-stone-200/50 text-stone-400 border-stone-300/50 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 text-[10px] font-numeric tabular-nums">
                          <span className="flex items-center gap-1.5">
                            <span className="font-mono font-bold">
                              N°{String(city.index + 1).padStart(2, '0')}
                            </span>
                            <span
                              className={
                                isCurrent
                                  ? 'text-amber-300/90'
                                  : city.index < 17
                                  ? 'text-emerald-800'
                                  : city.index < 34
                                  ? 'text-amber-800'
                                  : 'text-rose-800'
                              }
                            >
                              {tierShort}
                            </span>
                          </span>
                          {isCompleted ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
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

          {/* Active District & 10-Chapter Exhibition Progression */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeCity.id}-${activeStage.id}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-4"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5 min-w-0">
                  {/* Engraved Roman District Crest */}
                  <div
                    className="w-12 h-12 rounded-xl border border-[#CBBFA8] bg-[#F3ECE0] flex flex-col items-center justify-center shrink-0 shadow-2xs"
                    style={{ borderColor: `${activeStage.accentColor}44` }}
                  >
                    <span
                      className="text-lg font-bold leading-none font-['Cinzel','Playfair_Display',serif]"
                      style={{ color: activeStage.accentColor }}
                    >
                      {activeStage.roman}
                    </span>
                    <span className="text-[8.5px] font-mono tracking-widest text-stone-500 uppercase mt-0.5">
                      {activeStage.category}
                    </span>
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] font-numeric tabular-nums text-stone-600">
                      <span className="font-semibold text-stone-900">
                        {activeCity.cityFr} · {activeStage.sectorTag}
                      </span>
                      <span aria-hidden="true" className="text-stone-300">·</span>
                      <span>
                        已修 {completedChaptersInActivePoint.length} / {CHAPTERS_PER_POINT} 章
                      </span>
                      <span aria-hidden="true" className="text-stone-300">·</span>
                      <span className="text-emerald-800 font-bold">
                        +{activeStage.xpReward} XP / 章
                      </span>
                    </div>

                    <h3 className="font-serif-editorial text-lg sm:text-xl font-bold text-stone-900 leading-snug">
                      {activeStage.districtZh}
                      <span className="ml-2.5 text-sm sm:text-base font-normal italic text-stone-500 font-['Cormorant_Garamond','Playfair_Display',Georgia,serif]">
                        {activeStage.districtFr}
                      </span>
                    </h3>

                    <p className="text-xs text-stone-600 leading-relaxed">
                      {activeStage.subtitle}（答对本章全部 {QUESTIONS_PER_CHAPTER} 题即可开启下一章）
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    gameAudio.playTap();
                    onStartChapterQuiz(activeCity.index, activePointIdx, activeChapterIdx);
                  }}
                  className="min-h-[44px] px-6 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-50 border border-amber-500/35 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-sm transition-colors whitespace-nowrap"
                >
                  <Play className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                  <span>
                    {variant === 'dashboard'
                      ? `进入第 ${activeChapterIdx + 1} 章 (${QUESTIONS_PER_CHAPTER}题)`
                      : `启程第 ${activeChapterIdx + 1} 章 · ${QUESTIONS_PER_CHAPTER} 题`}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-amber-300" />
                </button>
              </div>

              {/* 10-Chapter Brass & Parchment Catalog Plates */}
              <div className="pt-3.5 border-t border-stone-200/90 space-y-2.5">
                <div className="flex items-center justify-between text-[11px] text-stone-600">
                  <span className="font-semibold text-stone-800 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-amber-800" />
                    <span>街区十章典藏试炼（每章 {QUESTIONS_PER_CHAPTER} 道思辨题）</span>
                  </span>
                  <span className="font-numeric tabular-nums text-stone-500">
                    {completedChaptersInActivePoint.length} / {CHAPTERS_PER_POINT} 完成
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
                        className={`min-h-[44px] px-2 py-1.5 rounded-lg border text-center transition-all flex flex-col items-center justify-center gap-0.5 whitespace-nowrap ${
                          isChCurrent
                            ? 'bg-stone-900 text-amber-50 border-amber-500/60 shadow-xs cursor-pointer'
                            : isChCompleted
                            ? 'bg-emerald-50/90 text-emerald-950 border-emerald-300 hover:border-emerald-600 cursor-pointer'
                            : isChUnlocked
                            ? 'bg-white text-stone-900 border-[#D4CBB8] hover:border-stone-700 cursor-pointer'
                            : 'bg-[#F3EFE6] text-stone-400 border-stone-200/80 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex items-center gap-1 text-[11px] font-numeric font-bold whitespace-nowrap">
                          <span>第{chIdx + 1}章</span>
                          {isChCompleted && (
                            <CheckCircle2 className="w-3 h-3 text-emerald-700 shrink-0" />
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

          {/* Horizontal District Itinerary Timeline Rail (I..VIII) */}
          <div className="pt-2 border-t border-stone-200/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
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
                  className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all shrink-0 whitespace-nowrap border ${
                    isCurrent
                      ? 'bg-stone-900 text-amber-50 border-stone-900 font-semibold shadow-2xs cursor-pointer'
                      : isCompleted
                      ? 'bg-emerald-50/80 text-emerald-950 border-emerald-200 hover:border-emerald-500 cursor-pointer'
                      : isUnlocked
                      ? 'bg-white text-stone-800 border-[#D8D0C0] hover:border-stone-600 cursor-pointer'
                      : 'bg-[#F3EFE6] text-stone-400 border-stone-200/60 cursor-not-allowed'
                  }`}
                >
                  <span
                    className={`font-bold font-['Cinzel','Playfair_Display',serif] ${
                      isCurrent ? 'text-amber-300' : 'text-stone-700'
                    }`}
                  >
                    {stage.roman}.
                  </span>
                  <span>{stage.districtZh}</span>
                  <span
                    className={`text-[10px] font-mono tabular-nums ${
                      isCurrent ? 'text-amber-200/90' : 'text-stone-400'
                    }`}
                  >
                    {chDone}/{CHAPTERS_PER_POINT}
                  </span>
                  {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />}
                  {!isUnlocked && <Lock className="w-3 h-3 text-stone-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 2. Illuminated Beaux-Arts Copperplate & Watercolor Architectural Map */}
      <div
        className="relative rounded-2xl overflow-hidden border border-[#B9AE9A] shadow-[0_24px_60px_-28px_rgba(28,25,23,0.45)]"
        style={{ backgroundColor: activeCity.palette.paperMid }}
      >
        {/* Outer Architectural Double-Matte Frame */}
        <div className="absolute inset-1.5 rounded-xl border border-stone-900/20 pointer-events-none z-20" />
        <div className="absolute inset-3 rounded-lg border border-amber-900/15 pointer-events-none z-20" />

        {/* Top-Left Engraved Exhibition Cartouche */}
        <div className="absolute top-5 left-5 z-30 flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[#FCF9F2]/94 backdrop-blur-md border border-[#C6B9A0] shadow-[0_8px_24px_-8px_rgba(28,25,23,0.2)] pointer-events-none">
          <div className="w-8 h-8 rounded-full border border-amber-700/40 bg-[#F4ECE0] flex items-center justify-center shrink-0">
            <Compass className="w-4 h-4 text-amber-800" />
          </div>
          <div className="leading-tight">
            <div className="text-[9px] font-sans uppercase tracking-[0.2em] text-amber-800/90 font-bold">
              Plan Architectural · N°{String(activeCity.index + 1).padStart(2, '0')}
            </div>
            <div className="font-serif-editorial text-sm font-bold text-stone-900 tracking-wide">
              {activeCity.cityZh} ·{' '}
              <span className="italic font-semibold text-stone-700 font-['Cormorant_Garamond','Playfair_Display',serif]">
                {activeCity.cityFr}
              </span>
            </div>
            <div className="text-[10px] font-mono text-stone-500 tabular-nums mt-0.5">
              {activeCity.coordinates} · {activeCity.countryFr}
            </div>
          </div>
        </div>

        {/* Auto-Pan / Capital Unlock Toast */}
        <AnimatePresence>
          {(isAutoScrolling || newlyUnlockedCityIndex !== null) && (
            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.96 }}
              transition={{ duration: 0.18 }}
              className="absolute top-5 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-xl bg-stone-900/95 text-amber-100 text-xs font-semibold backdrop-blur-md shadow-xl flex items-center gap-2 pointer-events-none border border-amber-400/35 whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>
                {newlyUnlockedCityIndex !== null
                  ? `新世界首都典藏图谱已启封：${WORLD_CAPITALS[newlyUnlockedCityIndex]?.cityZh}`
                  : `相机正巡航至：${activeStage.districtZh}`}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top-Right Architectural Navigation HUD */}
        <div className="absolute top-5 right-5 z-30 flex items-center gap-1 bg-[#FCF9F2]/94 backdrop-blur-md p-1 rounded-xl border border-[#C6B9A0] shadow-[0_8px_24px_-8px_rgba(28,25,23,0.18)]">
          <button
            type="button"
            onClick={() => {
              gameAudio.playTap();
              panToPoint(activePointIdx, 20);
            }}
            className="min-h-[34px] px-2.5 py-1 rounded-lg hover:bg-white text-xs font-semibold text-stone-800 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            title="居中定位到当前坐标"
          >
            <Crosshair className="w-3.5 h-3.5 text-amber-800" />
            <span className="hidden sm:inline">归中定位</span>
          </button>

          <span className="w-px h-4 bg-stone-300" aria-hidden="true" />

          <button
            type="button"
            onClick={() => handleZoomStep(-0.18)}
            className="min-h-[34px] min-w-[34px] rounded-lg hover:bg-white text-stone-700 hover:text-stone-950 flex items-center justify-center transition-colors cursor-pointer"
            title="缩小地图"
            aria-label="缩小地图"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <span className="text-[11px] font-mono font-semibold text-stone-700 px-1.5 tabular-nums hidden sm:inline">
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

        {/* Bottom-Left 16-Point Brass Mariner's Compass Rose & Engraved Scale */}
        <div className="absolute bottom-5 left-5 z-30 flex items-end gap-2.5 pointer-events-none">
          <div className="w-14 h-14 rounded-full bg-[#FCF9F2]/94 backdrop-blur-md border border-[#C6B9A0] shadow-sm flex items-center justify-center">
            <svg viewBox="0 0 80 80" className="w-12 h-12">
              <circle
                cx="40"
                cy="40"
                r="34"
                fill="none"
                stroke="#8C7B65"
                strokeWidth="0.9"
              />
              <circle
                cx="40"
                cy="40"
                r="30"
                fill="none"
                stroke="#8C7B65"
                strokeWidth="0.7"
                strokeDasharray="1.5 2.5"
              />
              <circle
                cx="40"
                cy="40"
                r="16"
                fill="none"
                stroke="#B45309"
                strokeWidth="0.6"
                opacity="0.55"
              />
              {/* Ordinal diagonal rays */}
              <polygon points="40,40 20,20 35,34" fill="#9A8C7A" opacity="0.5" />
              <polygon points="40,40 60,20 46,35" fill="#9A8C7A" opacity="0.5" />
              <polygon points="40,40 60,60 45,46" fill="#9A8C7A" opacity="0.5" />
              <polygon points="40,40 20,60 34,45" fill="#9A8C7A" opacity="0.5" />
              {/* Cardinal shaded dual-tone needles */}
              <polygon points="40,8 44.5,35.5 40,40" fill="#B45309" />
              <polygon points="40,8 35.5,35.5 40,40" fill="#78350F" />
              <polygon points="40,72 44.5,44.5 40,40" fill="#A8A29E" />
              <polygon points="40,72 35.5,44.5 40,40" fill="#57534E" />
              <polygon points="72,40 44.5,35.5 40,40" fill="#78716C" />
              <polygon points="72,40 44.5,44.5 40,40" fill="#D6D3D1" />
              <polygon points="8,40 35.5,35.5 40,40" fill="#D6D3D1" />
              <polygon points="8,40 35.5,44.5 40,40" fill="#78716C" />
              <circle cx="40" cy="40" r="3" fill="#1C1917" stroke="#F59E0B" strokeWidth="1" />
              <text
                x="40"
                y="6.2"
                textAnchor="middle"
                fontSize="6.5"
                fontWeight="bold"
                fill="#78350F"
                fontFamily="Cinzel, Georgia, serif"
              >
                N
              </text>
              <text
                x="40"
                y="78.5"
                textAnchor="middle"
                fontSize="5.5"
                fill="#78716C"
                fontFamily="Cinzel, Georgia, serif"
              >
                S
              </text>
              <text
                x="76"
                y="42"
                textAnchor="middle"
                fontSize="5.5"
                fill="#78716C"
                fontFamily="Cinzel, Georgia, serif"
              >
                E
              </text>
              <text
                x="4"
                y="42"
                textAnchor="middle"
                fontSize="5.5"
                fill="#78716C"
                fontFamily="Cinzel, Georgia, serif"
              >
                O
              </text>
            </svg>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-[#FCF9F2]/92 backdrop-blur-md border border-[#C6B9A0] text-[9.5px] font-mono text-stone-700 hidden sm:flex flex-col gap-1 tabular-nums shadow-2xs">
            <div className="flex items-center justify-between gap-4 text-[9px] text-stone-600">
              <span>0</span>
              <span>250 m</span>
              <span>500 m</span>
            </div>
            <div className="w-28 h-1.5 flex border border-stone-800/80 overflow-hidden">
              <div className="w-1/4 h-full bg-stone-900" />
              <div className="w-1/4 h-full bg-amber-100" />
              <div className="w-1/4 h-full bg-stone-900" />
              <div className="w-1/4 h-full bg-amber-100" />
            </div>
          </div>
        </div>

        {/* Bottom-Right Museum Cartographic Legend */}
        <div className="absolute bottom-5 right-5 z-30 hidden md:flex items-center gap-4 px-3.5 py-2 rounded-xl bg-[#FCF9F2]/92 backdrop-blur-md border border-[#C6B9A0] text-[10.5px] text-stone-700 pointer-events-none shadow-2xs">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
            <span>全十章通关</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-amber-700" />
            <span>当前驻点</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-stone-400" />
            <span>未启封</span>
          </span>
        </div>

        {/* 2D Pan/Zoom Interactive Cartographic Viewport */}
        <div
          ref={viewportRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className={`relative w-full h-[470px] sm:h-[550px] lg:h-[600px] overflow-auto select-none touch-pan-x touch-pan-y ${
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
                  background: `radial-gradient(ellipse at 52% 45%, ${activeCity.palette.paperFrom} 0%, ${activeCity.palette.paperMid} 56%, ${activeCity.palette.paperTo} 100%)`,
                }}
                className="relative overflow-hidden transition-transform duration-200 ease-out"
              >
                {/* Copperplate & Watercolor Architectural SVG Atlas */}
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
                      <stop offset="50%" stopColor="#DCEAE7" />
                      <stop offset="100%" stopColor={activeCity.palette.waterInner} />
                    </linearGradient>

                    <linearGradient id="cityAtlasRouteGrad2" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#047857" />
                      <stop offset="48%" stopColor="#B45309" />
                      <stop offset="100%" stopColor="#4338CA" />
                    </linearGradient>

                    <radialGradient id="parchmentVignette" cx="50%" cy="50%" r="65%">
                      <stop offset="72%" stopColor="rgba(28, 25, 23, 0)" />
                      <stop offset="100%" stopColor="rgba(68, 55, 38, 0.14)" />
                    </radialGradient>

                    <pattern
                      id="parkStipple"
                      width="10"
                      height="10"
                      patternUnits="userSpaceOnUse"
                    >
                      <circle cx="2" cy="2" r="0.65" fill="rgba(20, 83, 45, 0.16)" />
                      <circle cx="7" cy="7" r="0.6" fill="rgba(20, 83, 45, 0.12)" />
                    </pattern>

                    <pattern
                      id="copperHatch"
                      width="8"
                      height="8"
                      patternUnits="userSpaceOnUse"
                      patternTransform="rotate(45)"
                    >
                      <line
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="8"
                        stroke="rgba(41, 37, 36, 0.08)"
                        strokeWidth="0.9"
                      />
                    </pattern>

                    <path id="riverLabelCurve" d={riverPathD} />
                    <path id="boulevardSouthCurve" d="M 145 552 C 320 518, 480 555, 650 562" />
                    <path id="boulevardNorthCurve" d="M 225 152 C 420 180, 580 198, 700 210" />
                  </defs>

                  {/* Soft Vintage Paper Vignette */}
                  <rect
                    x="0"
                    y="0"
                    width={WORLD_WIDTH}
                    height={WORLD_HEIGHT}
                    fill="url(#parchmentVignette)"
                  />

                  {/* LAYER 0: Double Engraved Copperplate Cartographic Neatline & Degree Scale */}
                  <g>
                    <rect
                      x="18"
                      y="18"
                      width={WORLD_WIDTH - 36}
                      height={WORLD_HEIGHT - 36}
                      fill="none"
                      stroke="rgba(68, 55, 38, 0.35)"
                      strokeWidth="1.2"
                    />
                    <rect
                      x="24"
                      y="24"
                      width={WORLD_WIDTH - 48}
                      height={WORLD_HEIGHT - 48}
                      fill="none"
                      stroke="rgba(68, 55, 38, 0.25)"
                      strokeWidth="0.8"
                    />
                    {/* Mitered Brass Corner Medallions */}
                    {[
                      [24, 24],
                      [WORLD_WIDTH - 24, 24],
                      [24, WORLD_HEIGHT - 24],
                      [WORLD_WIDTH - 24, WORLD_HEIGHT - 24],
                    ].map(([cx, cy], ci) => (
                      <g key={`corner-${ci}`}>
                        <circle
                          cx={cx}
                          cy={cy}
                          r="4.5"
                          fill="#FBF7EE"
                          stroke="#78350F"
                          strokeWidth="1"
                        />
                        <circle cx={cx} cy={cy} r="1.5" fill="#B45309" />
                      </g>
                    ))}
                  </g>

                  {/* LAYER 1: IGN Latitude/Longitude Engraved Graticule */}
                  <g opacity="0.48">
                    {[160, 320, 480, 640, 800, 960].map((gx, i) => (
                      <g key={`gx-${gx}`}>
                        <line
                          x1={gx}
                          y1={24}
                          x2={gx}
                          y2={WORLD_HEIGHT - 24}
                          stroke="#78716C"
                          strokeWidth="0.55"
                          strokeDasharray="3 5"
                        />
                        <line x1={gx} y1={18} x2={gx} y2={24} stroke="#57534E" strokeWidth="1.1" />
                        <line
                          x1={gx}
                          y1={WORLD_HEIGHT - 24}
                          x2={gx}
                          y2={WORLD_HEIGHT - 18}
                          stroke="#57534E"
                          strokeWidth="1.1"
                        />
                        <text
                          x={gx + 6}
                          y={38}
                          fontSize="9"
                          fontFamily="Cinzel, Georgia, serif"
                          fill="#6D6357"
                        >
                          {String.fromCharCode(65 + i)}
                        </text>
                      </g>
                    ))}
                    {[140, 280, 420, 560].map((gy, i) => (
                      <g key={`gy-${gy}`}>
                        <line
                          x1={24}
                          y1={gy}
                          x2={WORLD_WIDTH - 24}
                          y2={gy}
                          stroke="#78716C"
                          strokeWidth="0.55"
                          strokeDasharray="3 5"
                        />
                        <line x1={18} y1={gy} x2={24} y2={gy} stroke="#57534E" strokeWidth="1.1" />
                        <line
                          x1={WORLD_WIDTH - 24}
                          y1={gy}
                          x2={WORLD_WIDTH - 18}
                          y2={gy}
                          stroke="#57534E"
                          strokeWidth="1.1"
                        />
                        <text
                          x={30}
                          y={gy - 5}
                          fontSize="9"
                          fontFamily="Cinzel, Georgia, serif"
                          fill="#6D6357"
                        >
                          0{i + 1}
                        </text>
                      </g>
                    ))}
                  </g>

                  {/* LAYER 2: Topographic Relief Contours & Triangulation Marks */}
                  <g fill="none" stroke="rgba(146, 64, 14, 0.19)">
                    <ellipse cx="195" cy="155" rx="172" ry="110" strokeWidth="0.9" />
                    <ellipse
                      cx="195"
                      cy="155"
                      rx="142"
                      ry="90"
                      strokeWidth="0.7"
                      strokeDasharray="3 3"
                    />
                    <ellipse cx="195" cy="155" rx="112" ry="70" strokeWidth="0.9" />
                    <ellipse cx="195" cy="155" rx="80" ry="50" strokeWidth="0.8" />
                    <ellipse cx="435" cy="182" rx="124" ry="78" strokeWidth="0.9" />
                    <ellipse
                      cx="435"
                      cy="182"
                      rx="94"
                      ry="58"
                      strokeWidth="0.7"
                      strokeDasharray="4 3"
                    />
                    <ellipse cx="435" cy="182" rx="64" ry="38" strokeWidth="0.8" />
                    <path d="M 620 80 Q 790 155, 1080 120" strokeDasharray="4 4" strokeWidth="0.9" />
                    <path d="M 650 55 Q 820 120, 1090 92" strokeDasharray="4 4" strokeWidth="0.8" />
                    <path
                      d="M 780 615 Q 920 555, 1070 600"
                      strokeDasharray="3 4"
                      strokeWidth="0.8"
                    />
                  </g>
                  <g fill="rgba(120, 53, 15, 0.62)">
                    <polygon points="104,76 108,69 112,76" />
                    <text
                      x="118"
                      y="76"
                      fontSize="9.5"
                      fontFamily="Cormorant Garamond, Playfair Display, serif"
                      fontStyle="italic"
                    >
                      {activeCity.hillLabel} · 130m
                    </text>
                    <text
                      x="412"
                      y="114"
                      fontSize="9"
                      fontFamily="Cormorant Garamond, Playfair Display, serif"
                      fontStyle="italic"
                    >
                      {activeCity.heritageLandmark}
                    </text>
                  </g>

                  {/* LAYER 3: Secondary Urban Boulevard & Street Grid */}
                  <g fill="none" strokeLinecap="round" strokeLinejoin="round">
                    {secondaryStreets.map((d, idx) => (
                      <React.Fragment key={`st-${idx}`}>
                        <path d={d} stroke="rgba(41, 37, 36, 0.16)" strokeWidth="9.5" />
                        <path d={d} stroke="#FBF8F1" strokeWidth="7" />
                        <path
                          d={d}
                          stroke="rgba(120, 113, 108, 0.18)"
                          strokeWidth="0.8"
                          strokeDasharray="4 6"
                        />
                      </React.Fragment>
                    ))}
                  </g>

                  {/* LAYER 4: Engraved Haussmannian Blocks & Architectural Courtyards */}
                  <g>
                    {cityBlocks.map((b, idx) => (
                      <g key={`blk-${idx}`}>
                        {/* Subtle architectural drop-shadow offset */}
                        <rect
                          x={b.x + 2}
                          y={b.y + 2}
                          width={b.w}
                          height={b.h}
                          rx="2.5"
                          fill="rgba(28, 25, 23, 0.08)"
                        />
                        <rect
                          x={b.x}
                          y={b.y}
                          width={b.w}
                          height={b.h}
                          rx="2.5"
                          fill={activeCity.palette.blockFill}
                          stroke="rgba(41, 37, 36, 0.22)"
                          strokeWidth="0.9"
                        />
                        <rect
                          x={b.x}
                          y={b.y}
                          width={b.w}
                          height={b.h}
                          rx="2.5"
                          fill="url(#copperHatch)"
                        />
                        {b.courtyard && (
                          <rect
                            x={b.x + 11}
                            y={b.y + 10}
                            width={Math.max(10, b.w - 22)}
                            height={Math.max(10, b.h - 20)}
                            rx="1.5"
                            fill="#F9F5EB"
                            stroke="rgba(41, 37, 36, 0.14)"
                            strokeWidth="0.7"
                          />
                        )}
                      </g>
                    ))}
                  </g>

                  {/* LAYER 5: Botanical Parterre Gardens & Canopy Studies */}
                  <g>
                    {botanicalParks.map((park, idx) => (
                      <g key={`park-${idx}`}>
                        <rect
                          x={park.x}
                          y={park.y}
                          width={park.w}
                          height={park.h}
                          rx="10"
                          fill={activeCity.palette.parkFill}
                          stroke="rgba(20, 83, 45, 0.34)"
                          strokeWidth="1.1"
                        />
                        <rect
                          x={park.x + 3}
                          y={park.y + 3}
                          width={park.w - 6}
                          height={park.h - 6}
                          rx="8"
                          fill="none"
                          stroke="rgba(20, 83, 45, 0.18)"
                          strokeWidth="0.7"
                          strokeDasharray="2 2"
                        />
                        <rect
                          x={park.x}
                          y={park.y}
                          width={park.w}
                          height={park.h}
                          rx="10"
                          fill="url(#parkStipple)"
                        />
                        <path
                          d={`M ${park.x + 8} ${park.y + park.h / 2} Q ${
                            park.x + park.w / 2
                          } ${park.y + 12}, ${park.x + park.w - 8} ${park.y + park.h / 2}`}
                          fill="none"
                          stroke="rgba(255, 252, 245, 0.85)"
                          strokeWidth="2.4"
                        />
                        {/* Fountain Basin */}
                        <circle
                          cx={park.x + park.w / 2}
                          cy={park.y + park.h / 2}
                          r="7"
                          fill="#C7DFDC"
                          stroke="rgba(28, 25, 23, 0.25)"
                          strokeWidth="0.9"
                        />
                        <circle
                          cx={park.x + park.w / 2}
                          cy={park.y + park.h / 2}
                          r="3.2"
                          fill="#F5F0E6"
                          stroke="rgba(28, 25, 23, 0.2)"
                          strokeWidth="0.6"
                        />
                        {park.trees.map(([tx, ty], ti) => (
                          <g key={`tree-${ti}`}>
                            <circle cx={tx + 1.5} cy={ty + 1.5} r="6.2" fill="rgba(20,83,45,0.12)" />
                            <circle
                              cx={tx}
                              cy={ty}
                              r="6.2"
                              fill="#9EBE94"
                              stroke="rgba(20, 83, 45, 0.32)"
                              strokeWidth="0.8"
                            />
                            <circle cx={tx - 1.5} cy={ty - 1.5} r="2.2" fill="#BBD5B1" />
                          </g>
                        ))}
                        <text
                          x={park.x + park.w / 2}
                          y={park.y + park.h - 6}
                          textAnchor="middle"
                          fontSize="8.5"
                          fontFamily="Cormorant Garamond, Playfair Display, serif"
                          fontStyle="italic"
                          fill="#14532D"
                          opacity="0.86"
                        >
                          {park.name}
                        </text>
                      </g>
                    ))}
                  </g>

                  {/* LAYER 6: Capital River with Watercolor Embankments & Masonry Starling Bridges */}
                  <g>
                    <path
                      d={riverPathD}
                      fill="none"
                      stroke="rgba(28, 25, 23, 0.22)"
                      strokeWidth="58"
                      strokeLinecap="round"
                    />
                    <path
                      d={riverPathD}
                      fill="none"
                      stroke="#F6F1E6"
                      strokeWidth="53"
                      strokeLinecap="round"
                    />
                    <path
                      d={riverPathD}
                      fill="none"
                      stroke={activeCity.palette.waterOuter}
                      strokeWidth="46"
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
                      stroke="rgba(255, 255, 255, 0.45)"
                      strokeWidth="12"
                      strokeLinecap="round"
                    />
                    <path
                      d={riverPathD}
                      fill="none"
                      stroke="rgba(255, 255, 255, 0.72)"
                      strokeWidth="1.5"
                      strokeDasharray="16 22"
                      strokeLinecap="round"
                    />

                    <text
                      fontSize="10.5"
                      fontFamily="Cormorant Garamond, Playfair Display, serif"
                      fontStyle="italic"
                      letterSpacing="2.8"
                      fill="#134E4A"
                      opacity="0.86"
                    >
                      <textPath href="#riverLabelCurve" startOffset="22%">
                        {activeCity.riverFr.toUpperCase()} · {activeCity.riverZh}
                      </textPath>
                    </text>

                    {/* Western & Central Cutwater Stone Bridges */}
                    {[
                      { x: 240, y: 356, rot: -8 },
                      { x: 525, y: 402, rot: 5 },
                    ].map((br, bi) => (
                      <g key={`bridge-${bi}`} transform={`translate(${br.x}, ${br.y}) rotate(${br.rot})`}>
                        {/* Upstream/downstream masonry cutwater piers */}
                        <polygon
                          points="-20,-8 -13,-14 -13,14 -20,8"
                          fill="#D6CBB8"
                          stroke="#57534E"
                          strokeWidth="0.9"
                        />
                        <polygon
                          points="20,-8 13,-14 13,14 20,8"
                          fill="#D6CBB8"
                          stroke="#57534E"
                          strokeWidth="0.9"
                        />
                        <rect
                          x="-14"
                          y="-32"
                          width="28"
                          height="64"
                          rx="2.5"
                          fill="#F1EAD9"
                          stroke="#44403C"
                          strokeWidth="1.2"
                        />
                        <line x1="-9" y1="-30" x2="-9" y2="30" stroke="#78716C" strokeWidth="0.9" />
                        <line x1="9" y1="-30" x2="9" y2="30" stroke="#78716C" strokeWidth="0.9" />
                        <line
                          x1="0"
                          y1="-28"
                          x2="0"
                          y2="28"
                          stroke="#A8A29E"
                          strokeWidth="0.8"
                          strokeDasharray="3 3"
                        />
                      </g>
                    ))}

                    {/* Grand Pont Monumental (Stage V Site) */}
                    <g transform="translate(855, 365) rotate(-10)">
                      <polygon
                        points="-30,-10 -22,-18 -22,18 -30,10"
                        fill="#D8CEBC"
                        stroke="#44403C"
                        strokeWidth="1"
                      />
                      <polygon
                        points="30,-10 22,-18 22,18 30,10"
                        fill="#D8CEBC"
                        stroke="#44403C"
                        strokeWidth="1"
                      />
                      <rect
                        x="-22"
                        y="-38"
                        width="44"
                        height="76"
                        rx="3"
                        fill="#FAF4E8"
                        stroke="#292524"
                        strokeWidth="1.4"
                      />
                      <path
                        d="M -22 -20 L -29 -27 M 22 -20 L 29 -27 M -22 20 L -29 27 M 22 20 L 29 27"
                        stroke="#57534E"
                        strokeWidth="1.4"
                      />
                      <line x1="-15" y1="-36" x2="-15" y2="36" stroke="#A8A29E" strokeWidth="1" />
                      <line x1="15" y1="-36" x2="15" y2="36" stroke="#A8A29E" strokeWidth="1" />
                    </g>
                  </g>

                  {/* LAYER 7: Illuminated Promenade & Animated Journey Ribbon */}
                  <g fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <path d={fullRoutePathD} stroke="rgba(28, 25, 23, 0.24)" strokeWidth="23" />
                    <path d={fullRoutePathD} stroke="#FFFDF8" strokeWidth="19" />
                    <path d={fullRoutePathD} stroke="#F2EBD9" strokeWidth="13.5" />
                    <path
                      d={fullRoutePathD}
                      stroke="rgba(120, 113, 108, 0.42)"
                      strokeWidth="1.8"
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
                    fontFamily="Cinzel, Plus Jakarta Sans, sans-serif"
                    fontWeight="600"
                    letterSpacing="1.8"
                    fill="rgba(41, 37, 36, 0.62)"
                  >
                    <textPath href="#boulevardSouthCurve" startOffset="12%">
                      AVENUE DE {activeCity.cityFr.toUpperCase()} · 直觉思辨大道
                    </textPath>
                  </text>
                  <text
                    fontSize="8.5"
                    fontFamily="Cinzel, Plus Jakarta Sans, sans-serif"
                    fontWeight="600"
                    letterSpacing="1.8"
                    fill="rgba(41, 37, 36, 0.62)"
                  >
                    <textPath href="#boulevardNorthCurve" startOffset="16%">
                      BOULEVARD MÉTACOGNITIF · 元认知高地大道
                    </textPath>
                  </text>

                  {/* LAYER 8: Beaux-Arts Architectural Monument Plan Engravings */}
                  {cityStages.map((stage, idx) => {
                    const isUnlocked = checkPointUnlocked(progress, activeCity.index, idx);
                    const strokeCol = isUnlocked
                      ? 'rgba(28, 25, 23, 0.5)'
                      : 'rgba(120, 113, 108, 0.28)';
                    const goldCol = isUnlocked ? 'rgba(180, 83, 9, 0.48)' : 'rgba(120, 113, 108, 0.2)';
                    const fillCol = isUnlocked
                      ? 'rgba(255, 252, 245, 0.85)'
                      : 'rgba(235, 228, 215, 0.55)';
                    return (
                      <g
                        key={`monument-${stage.id}`}
                        transform={`translate(${stage.mapX}, ${stage.mapY})`}
                      >
                        <circle
                          cx="0"
                          cy="0"
                          r="40"
                          fill={fillCol}
                          stroke={goldCol}
                          strokeWidth="1"
                          strokeDasharray="3 2"
                        />
                        {stage.monumentType === 'colonnade' && (
                          <g stroke={strokeCol} strokeWidth="1" fill="none">
                            <circle cx="0" cy="0" r="32" />
                            <circle cx="0" cy="0" r="24" strokeDasharray="2 2" />
                            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
                              <circle
                                key={deg}
                                cx={Math.cos((deg * Math.PI) / 180) * 32}
                                cy={Math.sin((deg * Math.PI) / 180) * 32}
                                r="2.1"
                                fill="#E5DCCB"
                              />
                            ))}
                          </g>
                        )}
                        {stage.monumentType === 'palace' && (
                          <g>
                            <path
                              d="M -38 -26 L 38 -26 L 38 24 L 18 24 L 18 -8 L -18 -8 L -18 24 L -38 24 Z"
                              fill="#EDE4D3"
                              stroke={strokeCol}
                              strokeWidth="1.1"
                            />
                            <rect
                              x="-14"
                              y="-4"
                              width="28"
                              height="24"
                              fill="#FBF8F1"
                              stroke={goldCol}
                              strokeWidth="0.8"
                            />
                          </g>
                        )}
                        {stage.monumentType === 'market' && (
                          <g>
                            <polygon
                              points="0,-35 25,-25 35,0 25,25 0,35 -25,25 -35,0 -25,-25"
                              fill="#EDE4D3"
                              stroke={strokeCol}
                              strokeWidth="1.1"
                            />
                            <polygon
                              points="0,-24 17,-17 24,0 17,17 0,24 -17,17 -24,0 -17,-17"
                              fill="#FBF8F1"
                              stroke={goldCol}
                              strokeWidth="0.8"
                            />
                          </g>
                        )}
                        {stage.monumentType === 'etoile' && (
                          <g stroke={strokeCol} strokeWidth="1">
                            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
                              <line
                                key={deg}
                                x1="0"
                                y1="0"
                                x2={Math.cos((deg * Math.PI) / 180) * 48}
                                y2={Math.sin((deg * Math.PI) / 180) * 48}
                                strokeOpacity={deg % 60 === 0 ? 0.7 : 0.35}
                              />
                            ))}
                            <circle cx="0" cy="0" r="29" fill="#FAF6ED" />
                            <circle cx="0" cy="0" r="21" fill="none" stroke={goldCol} />
                          </g>
                        )}
                        {stage.monumentType === 'conservatory' && (
                          <g stroke={strokeCol} strokeWidth="1" fill="#E6EFE5">
                            <rect x="-35" y="-22" width="70" height="44" rx="20" />
                            <rect x="-26" y="-14" width="52" height="28" rx="14" fill="none" stroke={goldCol} />
                            <line x1="-30" y1="0" x2="30" y2="0" />
                            <line x1="0" y1="-22" x2="0" y2="22" />
                          </g>
                        )}
                        {stage.monumentType === 'observatory' && (
                          <g stroke={strokeCol} strokeWidth="1" fill="none">
                            <circle cx="0" cy="0" r="32" fill="#EDE6D8" />
                            <circle cx="0" cy="0" r="22" stroke={goldCol} strokeDasharray="2 2" />
                            <line x1="-42" y1="0" x2="42" y2="0" />
                            <line x1="0" y1="-42" x2="0" y2="42" />
                          </g>
                        )}
                        {stage.monumentType === 'citadel' && (
                          <g stroke={strokeCol} strokeWidth="1.1">
                            <polygon
                              points="0,-42 15,-25 38,-30 26,-10 42,6 22,17 26,38 0,28 -26,38 -22,17 -42,6 -26,-10 -38,-30 -15,-25"
                              fill="#E6DEC9"
                            />
                            <polygon
                              points="0,-28 10,-16 25,-20 17,-7 28,4 14,11 17,25 0,18 -17,25 -14,11 -28,4 -17,-7 -25,-20 -10,-16"
                              fill="#FAF5EB"
                              stroke={goldCol}
                            />
                          </g>
                        )}
                      </g>
                    );
                  })}

                  {/* Engraved Rive Nord / Rive Sud Watermark Inscriptions */}
                  <text
                    x="1058"
                    y="62"
                    textAnchor="end"
                    fontSize="11.5"
                    fontFamily="Cinzel, Cormorant Garamond, serif"
                    fontStyle="italic"
                    letterSpacing="2.6"
                    fill="rgba(41, 37, 36, 0.5)"
                  >
                    RIVE NORD · {activeCity.cityFr.toUpperCase()}
                  </text>
                  <text
                    x="1058"
                    y="658"
                    textAnchor="end"
                    fontSize="11.5"
                    fontFamily="Cinzel, Cormorant Garamond, serif"
                    fontStyle="italic"
                    letterSpacing="2.6"
                    fill="rgba(41, 37, 36, 0.5)"
                  >
                    RIVE SUD · {activeCity.countryFr.toUpperCase()}
                  </text>
                </svg>

                {/* INTERACTIVE HTML LAYER: Monumental Stage Pins, Explorer Medallion & Specimen Plaques */}
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

                      {/* Explorer Medallion Avatar Marker */}
                      {isCurrent && (
                        <motion.div
                          layoutId="city-quiz-player-token"
                          transition={{
                            type: 'spring',
                            stiffness: 220,
                            damping: 22,
                            mass: 0.85,
                          }}
                          className="absolute -top-12 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
                        >
                          <motion.div
                            animate={{ y: [0, -3.5, 0] }}
                            transition={{
                              duration: 2.4,
                              repeat: Infinity,
                              ease: 'easeInOut',
                            }}
                            className="flex flex-col items-center"
                          >
                            <div className="w-10 h-10 rounded-full border-2 border-[#FCF9F2] shadow-xl overflow-hidden bg-stone-900 flex items-center justify-center ring-2 ring-amber-600">
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
                            <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-amber-600 -mt-0.5 drop-shadow-sm" />
                          </motion.div>
                        </motion.div>
                      )}

                      {/* Circular Architectural Node Pin */}
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
                            ? 'bg-stone-900 border-amber-400 text-white cursor-pointer shadow-xl ring-4 ring-amber-500/20'
                            : isCompleted
                            ? 'bg-emerald-800 border-emerald-100 text-white cursor-pointer'
                            : 'bg-[#FCF9F2] border-stone-800/85 text-stone-900 hover:border-amber-700 cursor-pointer'
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
                              ? 'border-amber-400/45'
                              : isCompleted
                              ? 'border-white/30'
                              : 'border-stone-900/12'
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
                          className={`absolute -bottom-2 px-1.5 rounded-full text-[9px] font-bold border shadow-2xs font-['Cinzel','Playfair_Display',serif] ${
                            isCurrent
                              ? 'bg-amber-500 text-stone-950 border-white'
                              : isCompleted
                              ? 'bg-emerald-900 text-white border-emerald-100'
                              : isUnlocked
                              ? 'bg-stone-900 text-amber-50 border-white'
                              : 'bg-stone-300 text-stone-600 border-stone-100'
                          }`}
                        >
                          {stage.roman}
                        </span>
                      </motion.button>

                      {/* Archival Brass-Trimmed Specimen Plaque */}
                      <button
                        type="button"
                        disabled={!isUnlocked}
                        onClick={() => {
                          if (!isUnlocked || dragStateRef.current.moved) return;
                          gameAudio.playTap();
                          onSelectPoint(idx);
                        }}
                        className={`absolute w-46 px-3.5 py-2 rounded-lg border backdrop-blur-md transition-all ${plaquePosClass} ${
                          isCurrent
                            ? 'bg-[#FCF9F2]/96 border-stone-900 ring-1 ring-amber-600/35 shadow-[0_10px_28px_-10px_rgba(28,25,23,0.38)] cursor-pointer z-20'
                            : isUnlocked
                            ? 'bg-[#FCF9F2]/92 border-[#C8BCA6] hover:border-stone-800 shadow-xs cursor-pointer'
                            : 'bg-[#F3EEE4]/85 border-stone-300/65 opacity-75 cursor-not-allowed'
                        }`}
                      >
                        <div
                          className={`text-[9.5px] font-mono font-semibold tracking-wider uppercase truncate flex items-center gap-1 font-numeric tabular-nums ${
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
                        <div className="text-[10.5px] text-stone-500 italic truncate font-['Cormorant_Garamond','Playfair_Display',serif]">
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

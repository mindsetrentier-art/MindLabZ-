import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search,
  Bookmark,
  Sparkles,
  Compass,
  Flame,
  ArrowRight,
  Zap,
  CheckCircle2,
  SlidersHorizontal,
  Grid3X3,
  List,
  RotateCcw,
  Palette,
  Volume2,
  ChevronRight,
  X,
  Shuffle,
  Award,
  Heart,
  Crown,
  Sparkle,
  Layers,
  Eye,
  Network,
  Play,
  Pause,
  SkipForward,
  ShieldCheck,
  Scale,
  HeartHandshake,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useFontScale } from '../context/FontScaleContext';
import { FloatingFontScaleControl } from '../components/ui/FloatingFontScaleControl';
import { PsychologyLawCard } from '../components/cards/PsychologyLawCard';
import { LawCardSkeleton } from '../components/ui/Skeleton';
import { VoiceTranscribeButton } from '../components/ui/VoiceTranscribeButton';
import { CategoryZh, DifficultyLevel, LoveDomainId, PsychologyLaw } from '../types';
import { MINDLABZ_CHAPTERS } from '../data/laws';
import { gameAudio } from '../utils/gameAudio';
import { OverlappingCardStack } from '../components/ui/OverlappingCardStack';
import {
  drawNonRepeatingLawOrder,
  resetLibraryAleatoricScope,
} from '../utils/aleatoricEngine';
import {
  EMOTIONAL_SECTIONS,
  getLawEmotionalMapping,
} from '../data/emotionalLaws';
import {
  LOVE_DOMAINS,
  LOVE_PSYCHOLOGY_LAWS,
  LOVE_SUBTAGS,
} from '../data/lovePsychologyCodex';
import {
  MICROEXPRESSION_DOMAINS,
  MICROEXPRESSION_LAWS,
} from '../data/microexpressionLaws';
import {
  REVERSE_PSYCHOLOGY_LAWS,
  REVERSE_CATEGORIES,
  REVERSE_SCENARIOS,
  REVERSE_CHAPTERS,
  REVERSE_PSYCHOLOGY_NOTE,
} from '../data/reversePsychologyLaws';
import {
  CRIMINAL_PSYCHOLOGY_LAWS,
  CRIMINAL_CATEGORIES,
  CRIMINAL_CONTEXTS,
  CRIMINAL_THEORY_TOPICS,
  CRIMINAL_PSYCHOLOGY_NOTE,
} from '../data/criminalPsychologyLaws';
import {
  SEXUAL_PSYCHOLOGY_LAWS,
  SEXUAL_PILLARS,
} from '../data/sexualPsychologyLaws';
import {
  CylindricalThemeRoller,
  CylindricalThemeItem,
  CylindricalThemeChangeMeta,
} from '../components/ui/CylindricalThemeRoller';
import {
  CylinderScrollList,
  CylinderScrollItem,
} from '../components/ui/CylinderScrollList';
import { SexualPsychologyOrganizer } from '../components/sexual/SexualPsychologyOrganizer';
import { searchLawsWithLunr } from '../utils/globalSearchIndex';

interface CategoryOption {
  key: 'all' | CategoryZh;
  label: string;
  salonTitle: string;
  en: string;
  color: string;
  gradient: string;
  borderActive: string;
  bgSoft: string;
}

const CATEGORIES: CategoryOption[] = [
  {
    key: 'all',
    label: '全部展厅',
    salonTitle: '全景大成馆',
    en: 'All Salons',
    color: '#1C1917',
    gradient: 'from-stone-900 via-stone-800 to-stone-950',
    borderActive: 'border-stone-900',
    bgSoft: 'bg-stone-100',
  },
  {
    key: '认知',
    label: '认知科学',
    salonTitle: '认知与理性厅',
    en: 'Cognition',
    color: '#4F46E5',
    gradient: 'from-indigo-600 via-indigo-700 to-indigo-900',
    borderActive: 'border-indigo-500',
    bgSoft: 'bg-indigo-50/70',
  },
  {
    key: '记忆',
    label: '记忆遗忘',
    salonTitle: '记忆宫殿厅',
    en: 'Memory',
    color: '#0891B2',
    gradient: 'from-cyan-600 via-teal-700 to-cyan-900',
    borderActive: 'border-cyan-500',
    bgSoft: 'bg-cyan-50/70',
  },
  {
    key: '决策',
    label: '决策博弈',
    salonTitle: '决策与概率厅',
    en: 'Decision',
    color: '#059669',
    gradient: 'from-emerald-600 via-emerald-700 to-emerald-900',
    borderActive: 'border-emerald-500',
    bgSoft: 'bg-emerald-50/70',
  },
  {
    key: '社会',
    label: '社会动能',
    salonTitle: '社会群体厅',
    en: 'Social',
    color: '#7C3AED',
    gradient: 'from-purple-600 via-purple-700 to-purple-900',
    borderActive: 'border-purple-500',
    bgSoft: 'bg-purple-50/70',
  },
  {
    key: '情绪',
    label: '情绪体验',
    salonTitle: '共情与感受厅',
    en: 'Emotion',
    color: '#E11D48',
    gradient: 'from-rose-600 via-rose-700 to-rose-900',
    borderActive: 'border-rose-500',
    bgSoft: 'bg-rose-50/70',
  },
  {
    key: '行为',
    label: '行为习惯',
    salonTitle: '行为动力厅',
    en: 'Behavior',
    color: '#D97706',
    gradient: 'from-amber-600 via-amber-700 to-amber-900',
    borderActive: 'border-amber-500',
    bgSoft: 'bg-amber-50/70',
  },
];

interface PopularSearchTag {
  text: string;
  category: CategoryZh;
  color: string;
}

const POPULAR_SEARCH_TAGS: PopularSearchTag[] = [
  { text: '首因效应', category: '认知', color: '#4F46E5' },
  { text: '锚定效应', category: '决策', color: '#059669' },
  { text: '损失厌恶', category: '行为', color: '#D97706' },
  { text: '峰终定律', category: '情绪', color: '#E11D48' },
  { text: '蔡格尼克效应', category: '记忆', color: '#0891B2' },
  { text: '从众效应', category: '社会', color: '#7C3AED' },
  { text: '黑天鹅理论', category: '决策', color: '#059669' },
  { text: '旁观者效应', category: '社会', color: '#7C3AED' },
];

export type LibraryCurationMode =
  | 'all_corpus'
  | 'sexual_psychology'
  | 'criminal_psychology'
  | 'reverse_psychology'
  | 'love_codex'
  | 'emotional_sections'
  | 'microexpressions'
  | 'classic_domains';

export const LearnPage: React.FC = () => {
  const { laws, user } = useApp();
  const { fontScale } = useFontScale();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialQuery = searchParams.get('q') || '';
  const modeParam = searchParams.get('mode');
  const initialMode: LibraryCurationMode =
    modeParam === 'all'
      ? 'all_corpus'
      : modeParam === 'sexual' || modeParam === 'sexual_psychology'
      ? 'sexual_psychology'
      : modeParam === 'criminal' || modeParam === 'criminal_psychology'
      ? 'criminal_psychology'
      : modeParam === 'reverse' || modeParam === 'reverse_psychology'
      ? 'reverse_psychology'
      : modeParam === 'love'
      ? 'love_codex'
      : modeParam === 'classic'
      ? 'classic_domains'
      : modeParam === 'emotional'
      ? 'emotional_sections'
      : modeParam === 'microexpressions'
      ? 'microexpressions'
      : 'criminal_psychology';
  const isInitialSexual = initialMode === 'sexual_psychology';
  const initialCategory = isInitialSexual
    ? 'all'
    : ((searchParams.get('category') as CategoryZh) || 'all');
  const initialSectionParam = searchParams.get('section');
  const initialSection = initialSectionParam ? (Number(initialSectionParam) as number) || 'all' : 'all';
  const initialDifficultyParam = searchParams.get('difficulty');
  const initialDifficulty: 'all' | DifficultyLevel =
    initialDifficultyParam === 'Easy' ||
    initialDifficultyParam === 'Medium' ||
    initialDifficultyParam === 'Hard'
      ? initialDifficultyParam
      : 'all';

  const [curationMode, setCurationMode] = useState<LibraryCurationMode>(initialMode);
  const [sortMode, setSortMode] = useState<'aleatoric' | 'sequential'>('aleatoric');
  const [shuffleNonce, setShuffleNonce] = useState<number>(1);
  const [selectedSexualPillar, setSelectedSexualPillar] = useState<string>(
    isInitialSexual ? searchParams.get('pillar') || 'all' : 'all'
  );
  const [selectedSexualContext, setSelectedSexualContext] = useState<string>(
    isInitialSexual ? searchParams.get('context') || 'all' : 'all'
  );
  const [selectedSexualCategory, setSelectedSexualCategory] = useState<string>(
    isInitialSexual ? searchParams.get('sexualCat') || searchParams.get('category') || 'all' : 'all'
  );
  const [selectedSexualTopic, setSelectedSexualTopic] = useState<string>(
    isInitialSexual ? searchParams.get('topic') || 'all' : 'all'
  );
  const [selectedCriminalContext, setSelectedCriminalContext] = useState<string>('all');
  const [selectedCriminalCategory, setSelectedCriminalCategory] = useState<string>('all');
  const [selectedCriminalTheory, setSelectedCriminalTheory] = useState<string>('all');
  const [selectedReverseScenario, setSelectedReverseScenario] = useState<string>('all');
  const [selectedReverseCategory, setSelectedReverseCategory] = useState<string>('all');
  const [selectedReverseChapter, setSelectedReverseChapter] = useState<string>('all');
  const [selectedMicroCategory, setSelectedMicroCategory] = useState<'all' | '认知' | '情绪' | '社会' | '行为'>('all');
  const [selectedLoveDomain, setSelectedLoveDomain] = useState<'all' | LoveDomainId>('all');
  const [selectedLoveSubTag, setSelectedLoveSubTag] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'all' | DifficultyLevel>(initialDifficulty);
  const [visibleLimit, setVisibleLimit] = useState<number>(24);
  const [selectedEmotionalSection, setSelectedEmotionalSection] = useState<number | 'all'>(initialSection);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<'all' | CategoryZh>(initialCategory);
  const [selectedChapter, setSelectedChapter] = useState<string>('all');
  const [onlyBookmarked, setOnlyBookmarked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'dossier'>('grid');

  // Audio Listening Mode (随听朗读连播状态)
  const [audioPlayingIdx, setAudioPlayingIdx] = useState<number | null>(null);
  const [audioRate, setAudioRate] = useState<number>(1.0);

  // Epiphany random generator modal
  const [epiphanyLaw, setEpiphanyLaw] = useState<PsychologyLaw | null>(null);

  // Sync state if url param changes
  useEffect(() => {
    const urlQ = searchParams.get('q');
    if (urlQ !== null && urlQ !== searchQuery) {
      setSearchQuery(urlQ);
    }
    const urlMode = searchParams.get('mode');
    if (urlMode === 'all') {
      setCurationMode('all_corpus');
    } else if (urlMode === 'sexual' || urlMode === 'sexual_psychology') {
      setCurationMode('sexual_psychology');
      const p = searchParams.get('pillar');
      const ctx = searchParams.get('context');
      const cat = searchParams.get('sexualCat') || searchParams.get('category');
      const topic = searchParams.get('topic');
      const diff = searchParams.get('difficulty');
      if (p) setSelectedSexualPillar(p);
      if (ctx) setSelectedSexualContext(ctx);
      if (cat) setSelectedSexualCategory(cat);
      if (topic) setSelectedSexualTopic(topic);
      if (diff === 'Easy' || diff === 'Medium' || diff === 'Hard' || diff === 'all') {
        setSelectedDifficulty(diff);
      }
    } else if (urlMode === 'criminal' || urlMode === 'criminal_psychology') {
      setCurationMode('criminal_psychology');
    } else if (urlMode === 'reverse' || urlMode === 'reverse_psychology') {
      setCurationMode('reverse_psychology');
    } else if (urlMode === 'love') {
      setCurationMode('love_codex');
    } else if (urlMode === 'microexpressions') {
      setCurationMode('microexpressions');
    } else if (urlMode === 'classic') {
      setCurationMode('classic_domains');
    } else if (urlMode === 'emotional') {
      setCurationMode('emotional_sections');
    }
  }, [searchParams]);

  // Cleanup Web Speech API on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleCurationModeChange = (
    mode: LibraryCurationMode,
    meta?: CylindricalThemeChangeMeta
  ) => {
    if (curationMode === mode) return;
    if (!meta?.isAuto) {
      gameAudio.playTap();
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
      }, 140);
    }
    setCurationMode(mode);
    setVisibleLimit(24);
    setAudioPlayingIdx(null);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  const handleReshuffle = () => {
    gameAudio.playSuccess();
    setShuffleNonce((n) => n + 1);
    setSortMode('aleatoric');
    setAudioPlayingIdx(null);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  const handleLoveDomainChange = (domain: 'all' | LoveDomainId) => {
    if (selectedLoveDomain === domain) return;
    gameAudio.playSelect();
    setIsLoading(true);
    setSelectedLoveDomain(domain);
    setSelectedLoveSubTag('all');
    setVisibleLimit(24);
    setTimeout(() => {
      setIsLoading(false);
    }, 120);
  };

  const handleEmotionalSectionChange = (section: number | 'all') => {
    if (selectedEmotionalSection === section) return;
    gameAudio.playSelect();
    setIsLoading(true);
    setSelectedEmotionalSection(section);
    setVisibleLimit(24);
    setTimeout(() => {
      setIsLoading(false);
    }, 140);
  };

  const handleCategoryChange = (catKey: 'all' | CategoryZh) => {
    if (selectedCategory === catKey) return;
    gameAudio.playTap();
    setIsLoading(true);
    setSelectedCategory(catKey);
    setVisibleLimit(24);
    setTimeout(() => {
      setIsLoading(false);
    }, 140);
  };

  const handleChapterChange = (chapter: string) => {
    if (selectedChapter === chapter) return;
    gameAudio.playTap();
    setIsLoading(true);
    setSelectedChapter(chapter);
    setVisibleLimit(24);
    setTimeout(() => {
      setIsLoading(false);
    }, 140);
  };

  const handleTagClick = (tag: string) => {
    gameAudio.playTap();
    setSearchQuery(tag);
  };

  // Trigger CSPRNG non-repeating random inspiring law discovery
  const handleRandomEpiphany = () => {
    const pool =
      curationMode === 'sexual_psychology'
        ? SEXUAL_PSYCHOLOGY_LAWS
        : curationMode === 'criminal_psychology'
        ? CRIMINAL_PSYCHOLOGY_LAWS
        : curationMode === 'reverse_psychology'
        ? REVERSE_PSYCHOLOGY_LAWS
        : curationMode === 'love_codex'
        ? LOVE_PSYCHOLOGY_LAWS
        : laws;
    if (!pool || pool.length === 0) return;
    gameAudio.playSuccess();
    const drawn = drawNonRepeatingLawOrder(pool, `epiphany::${curationMode}`, {
      markHeadCount: 1,
    });
    setEpiphanyLaw(drawn[0]);
  };

  const baseModeLaws = useMemo(() => {
    const subset = laws.filter((law) => {
      if (onlyBookmarked && !user.bookmarks.includes(law.id)) return false;

      if (curationMode === 'all_corpus') {
        const matchesCategory = selectedCategory === 'all' || law.categoryZh === selectedCategory;
        const matchesDiff = selectedDifficulty === 'all' || law.difficulty === selectedDifficulty;
        return matchesCategory && matchesDiff;
      }

      if (curationMode === 'sexual_psychology') {
        if (!law.isSexualPsychology) return false;
        if (selectedSexualPillar !== 'all' && law.sexualPillar !== selectedSexualPillar) {
          return false;
        }
        if (selectedSexualContext !== 'all' && law.sexualContext !== selectedSexualContext) {
          return false;
        }
        if (selectedSexualCategory !== 'all' && law.sexualCategory !== selectedSexualCategory) {
          return false;
        }
        if (selectedSexualTopic !== 'all' && law.sexualTopicName !== selectedSexualTopic) {
          return false;
        }
        if (selectedDifficulty !== 'all' && law.difficulty !== selectedDifficulty) {
          return false;
        }
        return true;
      }

      if (curationMode === 'criminal_psychology') {
        if (!law.isCriminalPsychology) return false;
        if (selectedCriminalContext !== 'all' && law.criminalContext !== selectedCriminalContext) {
          return false;
        }
        if (selectedCriminalCategory !== 'all' && law.criminalCategory !== selectedCriminalCategory) {
          return false;
        }
        if (selectedCriminalTheory !== 'all' && law.criminalTheoryName !== selectedCriminalTheory) {
          return false;
        }
        return true;
      }

      if (curationMode === 'reverse_psychology') {
        if (!law.isReversePsychology) return false;
        if (selectedReverseScenario !== 'all' && law.reverseScenario !== selectedReverseScenario) {
          return false;
        }
        if (selectedReverseCategory !== 'all' && law.reverseCategory !== selectedReverseCategory) {
          return false;
        }
        if (selectedReverseChapter !== 'all' && law.chapter !== selectedReverseChapter) {
          return false;
        }
        return true;
      }

      if (curationMode === 'microexpressions') {
        if (!law.isMicroexpression) return false;
        if (selectedMicroCategory !== 'all' && law.categoryZh !== selectedMicroCategory) {
          return false;
        }
        return true;
      }

      if (curationMode === 'love_codex') {
        if (!law.isLoveCodex) return false;
        if (selectedLoveDomain !== 'all' && law.loveDomainId !== selectedLoveDomain) {
          return false;
        }
        if (selectedLoveSubTag !== 'all' && law.subTag !== selectedLoveSubTag) {
          return false;
        }
        if (selectedDifficulty !== 'all' && law.difficulty !== selectedDifficulty) {
          return false;
        }
        return true;
      }

      if (curationMode === 'emotional_sections') {
        const emoMeta = getLawEmotionalMapping(law);
        if (!emoMeta) return false;
        if (
          selectedEmotionalSection !== 'all' &&
          emoMeta.sectionIndex !== selectedEmotionalSection
        ) {
          return false;
        }
        return true;
      }

      if (law.isLoveCodex || law.isReversePsychology || law.isCriminalPsychology || law.isSexualPsychology) return false;
      const matchesCategory = selectedCategory === 'all' || law.categoryZh === selectedCategory;
      const matchesChapter = selectedChapter === 'all' || law.chapter === selectedChapter;
      return matchesCategory && matchesChapter;
    });

    if (sortMode === 'aleatoric') {
      return drawNonRepeatingLawOrder(
        subset,
        `library::${curationMode}::${selectedSexualPillar}::${selectedSexualContext}::${selectedSexualCategory}::${selectedSexualTopic}::${selectedDifficulty}::${selectedCriminalContext}::${selectedCriminalCategory}::${selectedCriminalTheory}::${selectedReverseScenario}::${selectedReverseCategory}::${selectedCategory}`,
        { markHeadCount: Math.min(24, Math.max(4, Math.ceil(subset.length * 0.25))) }
      );
    }

    return [...subset].sort((a, b) => {
      if (curationMode === 'microexpressions') {
        if (selectedMicroCategory !== 'all') {
          return (a.categoryRank || 99) - (b.categoryRank || 99);
        }
        return (a.microGlobalRank || 99) - (b.microGlobalRank || 99);
      }
      if (curationMode === 'emotional_sections') {
        const metaA = getLawEmotionalMapping(a);
        const metaB = getLawEmotionalMapping(b);
        const orderA = metaA ? metaA.order : 999;
        const orderB = metaB ? metaB.order : 999;
        return orderA - orderB;
      }
      return (a.codeId || '').localeCompare(b.codeId || '');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    laws,
    curationMode,
    sortMode,
    shuffleNonce,
    selectedSexualPillar,
    selectedSexualContext,
    selectedSexualCategory,
    selectedSexualTopic,
    selectedCriminalContext,
    selectedCriminalCategory,
    selectedCriminalTheory,
    selectedReverseScenario,
    selectedReverseCategory,
    selectedReverseChapter,
    selectedMicroCategory,
    selectedLoveDomain,
    selectedLoveSubTag,
    selectedDifficulty,
    selectedEmotionalSection,
    selectedCategory,
    selectedChapter,
    onlyBookmarked,
    user.bookmarks,
  ]);

  const filteredLaws = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return baseModeLaws;
    return searchLawsWithLunr(baseModeLaws, q);
  }, [baseModeLaws, searchQuery]);

  const rollerItems: CylindricalThemeItem[] = useMemo(
    () => [
      {
        id: 'all_corpus',
        label: '全库真随机总览',
        group: '总览全景',
        count: laws.length,
        subtitle: '全馆藏实时洗牌',
        accentColor: '#D97706',
        icon: <Sparkles className="w-3.5 h-3.5" />,
      },
      {
        id: 'sexual_psychology',
        label: '性心理学与亲密健康',
        group: '实战心理专题',
        count: SEXUAL_PSYCHOLOGY_LAWS.length,
        subtitle: '4 大板块 × 5 大场景',
        accentColor: '#7E22CE',
        icon: <HeartHandshake className="w-3.5 h-3.5" />,
      },
      {
        id: 'criminal_psychology',
        label: '犯罪心理学与预防',
        group: '实战心理专题',
        count: CRIMINAL_PSYCHOLOGY_LAWS.length,
        subtitle: '4 大理论 × 5 大场景',
        accentColor: '#9F1239',
        icon: <Scale className="w-3.5 h-3.5" />,
      },
      {
        id: 'reverse_psychology',
        label: '逆向心理学与抗拒',
        group: '实战心理专题',
        count: REVERSE_PSYCHOLOGY_LAWS.length,
        subtitle: '20 章 × 5 大沟通场景',
        accentColor: '#0D9488',
        icon: <Shuffle className="w-3.5 h-3.5" />,
      },
      {
        id: 'love_codex',
        label: '爱情心理学全书',
        group: '情感与关系',
        count: LOVE_PSYCHOLOGY_LAWS.length,
        subtitle: '7 大依恋与边界维度',
        accentColor: '#E11D48',
        icon: <Heart className="w-3.5 h-3.5" />,
      },
      {
        id: 'emotional_sections',
        label: '情感五大板块',
        group: '情感与关系',
        count: 50,
        subtitle: '01-50 发展脉络',
        accentColor: '#B45309',
        icon: <Crown className="w-3.5 h-3.5" />,
      },
      {
        id: 'microexpressions',
        label: '微表情与动作',
        group: '经典实证展厅',
        count: MICROEXPRESSION_LAWS.length,
        subtitle: 'FACS 动作单元排榜',
        accentColor: '#4338CA',
        icon: <Eye className="w-3.5 h-3.5" />,
      },
      {
        id: 'classic_domains',
        label: '经典六大展厅',
        group: '经典实证展厅',
        count: 142,
        subtitle: '认知 / 记忆 / 决策 / 社会',
        accentColor: '#1C1917',
        icon: <Layers className="w-3.5 h-3.5" />,
      },
    ],
    [laws.length]
  );

  // Continuous Web Speech Audio Queue Handler (听力库随听连播)
  const speakLawAt = (idx: number, rateOverride: number = audioRate) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (idx < 0 || idx >= filteredLaws.length) {
      window.speechSynthesis.cancel();
      setAudioPlayingIdx(null);
      return;
    }
    const targetLaw = filteredLaws[idx];
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(
      `第 ${idx + 1} 条，${targetLaw.codeId || ''}，${targetLaw.nameZh}。${targetLaw.shortExplanation}。实用边界：${targetLaw.keyTakeaway}`
    );
    utter.lang = 'zh-CN';
    utter.rate = rateOverride;
    utter.onend = () => {
      if (idx + 1 < filteredLaws.length) {
        setAudioPlayingIdx(idx + 1);
        speakLawAt(idx + 1, rateOverride);
      } else {
        setAudioPlayingIdx(null);
      }
    };
    utter.onerror = () => {
      setAudioPlayingIdx(null);
    };
    setAudioPlayingIdx(idx);
    window.speechSynthesis.speak(utter);
  };

  const handleToggleGlobalListen = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    gameAudio.playTap();
    if (audioPlayingIdx !== null) {
      window.speechSynthesis.cancel();
      setAudioPlayingIdx(null);
    } else if (filteredLaws.length > 0) {
      speakLawAt(0, audioRate);
    }
  };

  const visibleLaws = useMemo(
    () => filteredLaws.slice(0, visibleLimit),
    [filteredLaws, visibleLimit]
  );

  // Current active category config
  const currentCategoryObj = CATEGORIES.find((c) => c.key === selectedCategory) || CATEGORIES[0];
  const currentLoveDomainObj =
    selectedLoveDomain !== 'all'
      ? LOVE_DOMAINS.find((d) => d.id === selectedLoveDomain) || null
      : null;
  const currentEmotionalSectionObj =
    typeof selectedEmotionalSection === 'number'
      ? EMOTIONAL_SECTIONS[selectedEmotionalSection - 1]
      : null;

  return (
    <div
      className="space-y-8 sm:space-y-10 pb-16 animate-fadeIn max-w-5xl mx-auto quiz-font-scope"
      data-quiz-font-scale={fontScale}
    >
      {/* 1. Artistic Salon Masthead: Museum Nocturne, Renaissance Gold Foil & Harmonic Spectrum */}
      <section className="relative rounded-3xl overflow-hidden shadow-2xl art-salon-canvas text-white p-7 sm:p-10 md:p-12 transition-all">
        {/* Subtle Decorative Golden Ratio Spiral & Celestial Constellation Watermark */}
        <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
          <svg className="w-full h-full" viewBox="0 0 800 400" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="700" cy="80" r="240" stroke="#F59E0B" strokeWidth="1" strokeDasharray="4 8" />
            <circle cx="700" cy="80" r="160" stroke="#F59E0B" strokeWidth="1" />
            <circle cx="700" cy="80" r="98" stroke="#F59E0B" strokeWidth="1.5" />
            <path d="M500,280 C600,100 750,20 850,20" stroke="#818CF8" strokeWidth="1.5" strokeDasharray="3 6" />
          </svg>
        </div>

        {/* Ambient Chromatic Glow Orbs */}
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-gradient-to-br from-amber-500/20 via-purple-600/25 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-20 w-80 h-80 rounded-full bg-gradient-to-tr from-indigo-600/25 via-emerald-500/15 to-transparent blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 sm:gap-8">
          <div className="space-y-3.5 max-w-2xl">
            {/* Museum Catalog Rubric */}
            <div className="flex items-center gap-2.5 text-xs font-mono">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/15 text-amber-300 border border-amber-300/35 font-semibold tracking-wider text-[11px] shadow-xs">
                <Palette className="w-3.5 h-3.5 text-amber-400" />
                <span>SALON DE PSYCHOLOGIE · 艺术典藏</span>
              </span>
              <span className="text-stone-500" aria-hidden="true">/</span>
              <span className="text-stone-300 font-serif-editorial italic font-sans">
                SEX0101–SEX2005 · CRIM001–CRIM{CRIMINAL_PSYCHOLOGY_LAWS.length} · REV0101–REV2005 · ML001–ML010 · LAW001–LAW142 · LOVE001–LOVE{LOVE_PSYCHOLOGY_LAWS.length}
              </span>
            </div>

            {/* High-Contrast Literary Headline */}
            <h1 className="font-serif-editorial text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-tight text-white drop-shadow-sm">
              MindLabZ 全景心理学定律与随听典藏馆
            </h1>

            {/* Editorial Dek */}
            <p className="text-xs sm:text-sm text-stone-300/90 font-normal leading-relaxed">
              全量收录 {SEXUAL_PSYCHOLOGY_LAWS.length} 条性心理学与亲密健康词条（SEX）、{CRIMINAL_PSYCHOLOGY_LAWS.length} 条犯罪心理学理论与应用卡（CRIM）、{REVERSE_PSYCHOLOGY_LAWS.length} 条逆向心理学与心理抗拒词条（REV）、{MICROEXPRESSION_LAWS.length} 条微表情实证定律（ML）、142 条经典心智规律及 {LOVE_PSYCHOLOGY_LAWS.length} 条爱情心理学词条，配备 CSPRNG 零重复洗牌与语音随听连播。
            </p>

            {/* Curatorial Index Stats */}
            <div className="pt-1.5 flex items-center gap-4 text-xs font-numeric text-stone-300 flex-wrap">
              <span className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-indigo-400 shadow-xs shadow-indigo-400/50" />
                <span>馆藏卷轴:</span>
                <strong className="text-white font-bold">{laws.length} 篇</strong>
              </span>
              <span className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-xs shadow-emerald-400/50" />
                <span>心智展厅:</span>
                <strong className="text-white font-bold">6 大领域</strong>
              </span>
              <span className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-amber-400 shadow-xs shadow-amber-400/50" />
                <span>已内化掌握:</span>
                <strong className="text-amber-300 font-bold">{(user?.lawsMastered || []).length} 项</strong>
              </span>
            </div>
          </div>

          {/* Right Action: Epiphany Random Discovery Medal */}
          <div className="shrink-0 flex flex-col sm:flex-row md:flex-col items-center gap-3">
            <button
              onClick={handleRandomEpiphany}
              className="group p-5 rounded-3xl bg-gradient-to-b from-white/15 to-white/5 backdrop-blur-md border border-amber-400/30 hover:border-amber-300 flex flex-col items-center justify-center text-center space-y-1.5 shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer w-full sm:w-auto"
              title="随机启迪：抽选一条心智艺术定律"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 via-amber-300 to-amber-500 text-stone-950 flex items-center justify-center shadow-lg shadow-amber-500/30 group-hover:rotate-12 transition-transform">
                <Shuffle className="w-6 h-6 stroke-[2.2]" />
              </div>
              <span className="text-[10px] text-amber-200 font-mono tracking-widest uppercase">
                Random Epiphany
              </span>
              <span className="font-serif-editorial font-bold text-white text-sm flex items-center gap-1">
                <span>随机启迪</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                gameAudio.playTap();
                navigate('/knowledge-graph');
              }}
              className="px-4 py-2.5 rounded-2xl bg-amber-400/15 hover:bg-amber-400/25 text-amber-100 border border-amber-300/35 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 w-full sm:w-auto"
              title="以 D3 交互式力导向知识图谱探索 500 条心理学定律关联"
            >
              <Network className="w-4 h-4 text-amber-300" />
              <span>500 律知识图谱 (D3)</span>
            </button>
          </div>
        </div>
      </section>

      {/* Featured Hall Portal: 情感心理学 50 律典藏馆 */}
      <section className="relative rounded-2xl overflow-hidden art-salon-canvas p-5 sm:p-6 text-white border border-amber-500/35 shadow-xl transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 text-[10px] font-mono font-semibold tracking-wider uppercase">
                NEW · 深度特展
              </span>
              <span className="text-stone-400 text-xs font-serif italic">
                Salon d'Émotion
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white font-serif tracking-tight">
              情感心理学 50 条定律 · 深度典藏馆
            </h3>
            <p className="text-xs text-stone-300 leading-relaxed">
              涵盖爱情吸引、依恋模型、关系冲突、丧失疗愈与长久亲密五大板块。金属质感艺术折叠画框展厅，带你深度理解爱情与人性的底层心智。
            </p>
          </div>
          <button
            onClick={() => {
              gameAudio.playTap();
              navigate('/emotional-laws');
            }}
            className="shrink-0 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-bold text-xs shadow-[0_0_15px_rgba(245,158,11,0.35)] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer border border-amber-300/40"
          >
            <span>进入 50 律典藏馆</span>
            <ArrowRight className="w-4 h-4 text-stone-950" />
          </button>
        </div>
      </section>

      {/* Dedicated Showcase Box: 性心理学与亲密健康 100 律 · 4 大分类栏框 */}
      <section className="rounded-3xl bg-gradient-to-br from-[#231030] via-[#1C1433] to-[#111827] p-5 sm:p-6 text-white border border-purple-400/30 shadow-lg space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-purple-200">
              <HeartHandshake className="w-3.5 h-3.5 text-purple-300 shrink-0" />
              <span className="font-bold text-purple-200">SEX0101–SEX2005</span>
              <span className="text-stone-500" aria-hidden="true">·</span>
              <span className="text-amber-300 tabular-nums">4 大主题板块 · 5 大应用场景 · 100 律</span>
            </div>
            <h3 className="font-serif-editorial text-lg sm:text-xl font-bold text-white tracking-tight">
              性心理学与亲密健康 · 100 律结构化专馆
            </h3>
            <p className="text-xs text-stone-300 leading-relaxed">
              依据科学教育与知情同意原则系统归档，按 4 大核心板块与 5 大观察视角清晰分栏，支持定律随听研读与竞技场真随机实战直连。
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                gameAudio.playTap();
                setCurationMode('sexual_psychology');
                setSelectedSexualPillar('all');
                setSelectedSexualCategory('all');
                setSelectedSexualTopic('all');
                setVisibleLimit(24);
                setTimeout(() => {
                  document.getElementById('sexual-organizer')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 80);
              }}
              className="px-4 py-2.5 rounded-xl bg-white text-stone-900 hover:bg-purple-50 text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 transition-colors"
            >
              <span>展开 100 律分类总栏</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => {
                gameAudio.playSuccess();
                navigate('/game/sexual-aleatoric-arena');
              }}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 transition-colors"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>竞技场真随机演练</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
          {SEXUAL_PILLARS.map((pillar, idx) => {
            const isActivePillar =
              curationMode === 'sexual_psychology' && selectedSexualPillar === pillar.id;
            return (
              <button
                key={pillar.id}
                type="button"
                onClick={() => {
                  gameAudio.playSelect();
                  setCurationMode('sexual_psychology');
                  setSelectedSexualPillar(pillar.id);
                  setSelectedSexualCategory('all');
                  setSelectedSexualTopic('all');
                  setVisibleLimit(24);
                  setTimeout(() => {
                    document.getElementById('sexual-organizer')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }, 80);
                }}
                className={`text-left rounded-2xl p-3.5 border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                  isActivePillar
                    ? 'bg-white/15 border-amber-300/70'
                    : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-purple-300/50'
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-purple-200 tabular-nums">
                  <span>0{idx + 1} · {pillar.count} 律</span>
                  <ArrowRight className="w-3.5 h-3.5 text-purple-300" />
                </div>
                <div className="text-xs sm:text-sm font-bold text-white leading-snug">
                  {pillar.label}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. Artistic Search & Multimodal Query Console */}
      <section className="space-y-4">
        {/* Floating Museum Glass Search Bar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center text-stone-400 group-focus-within:text-amber-600 transition-colors pointer-events-none">
              <Search className="w-5 h-5" />
            </div>

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索编号（如 LAW001）、中英文定律名、心理学关键词..."
              className="w-full pl-12 pr-11 py-4 bg-white/95 backdrop-blur-xl border-2 border-stone-200/90 hover:border-stone-300 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 rounded-2xl text-xs sm:text-sm font-medium text-stone-900 placeholder-stone-400 focus:outline-none transition-all shadow-sm"
            />

            {searchQuery && (
              <button
                onClick={() => {
                  gameAudio.playTap();
                  setSearchQuery('');
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 hover:text-stone-800 text-xs flex items-center justify-center transition-colors cursor-pointer"
                title="清空检索"
              >
                ✕
              </button>
            )}
          </div>

          {/* Voice Search Button */}
          <VoiceTranscribeButton
            onTranscript={(text) => {
              gameAudio.playSuccess();
              setSearchQuery(text);
            }}
            className="h-14 px-5 bg-white border-2 border-stone-200 hover:border-amber-400 text-stone-700 hover:text-amber-700 hover:bg-amber-50/50 rounded-2xl shadow-sm transition-all flex items-center gap-2 cursor-pointer font-bold text-xs"
          />

          {/* View Mode Toggle: Grid vs Dossier + Knowledge Graph Portal */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden sm:flex items-center p-1 bg-white border-2 border-stone-200 rounded-2xl shadow-xs h-14">
              <button
                onClick={() => {
                  gameAudio.playTap();
                  setViewMode('grid');
                }}
                className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'text-stone-400 hover:text-stone-700'
                }`}
                title="艺术画廊展卡视图"
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  gameAudio.playTap();
                  setViewMode('dossier');
                }}
                className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                  viewMode === 'dossier'
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'text-stone-400 hover:text-stone-700'
                }`}
                title="策展卷宗速览列表"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                gameAudio.playTap();
                navigate('/knowledge-graph');
              }}
              className="h-14 px-4 bg-stone-900 hover:bg-stone-800 text-amber-100 border-2 border-stone-900 rounded-2xl shadow-sm transition-colors flex items-center gap-2 cursor-pointer font-semibold text-xs whitespace-nowrap shrink-0"
              title="打开 D3.js 交互式心理定律知识图谱"
            >
              <Network className="w-4 h-4 text-amber-300" />
              <span className="hidden md:inline">知识图谱</span>
            </button>
          </div>
        </div>

        {/* Hot Query Swatches: Colored Chromatic Badges */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 text-xs text-stone-600">
          <span className="text-[11px] font-bold text-stone-400 shrink-0 font-serif-editorial flex items-center gap-1 mr-1">
            <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>研习焦点:</span>
          </span>
          {POPULAR_SEARCH_TAGS.map((tag) => (
            <button
              key={tag.text}
              onClick={() => handleTagClick(tag.text)}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-stone-50 border border-stone-200/90 text-stone-700 hover:text-stone-900 text-[11px] font-medium transition-all shrink-0 cursor-pointer flex items-center gap-1.5 shadow-2xs hover:shadow-xs active:scale-95"
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: tag.color }}
              />
              <span>{tag.text}</span>
            </button>
          ))}
        </div>

        {/* Curatorial Taxonomy Switcher + CSPRNG True Shuffle & Audio Listening Bar */}
        <div className="space-y-3 pt-1">
          <CylindricalThemeRoller
            title="定律库专题滚筒导航 · 按类别归档速查"
            variant="library"
            items={rollerItems}
            activeId={curationMode}
            autoPlay={audioPlayingIdx === null && searchQuery.trim() === ''}
            onChange={(nextId, meta) =>
              handleCurationModeChange(nextId as LibraryCurationMode, meta)
            }
          />

          {/* CSPRNG Shuffle & Audio Listening Bar (随听图书馆控制台) */}
          <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-stone-200/90 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleReshuffle}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all whitespace-nowrap shrink-0 border ${
                  sortMode === 'aleatoric'
                    ? 'bg-teal-700 hover:bg-teal-800 text-white border-teal-700 shadow-xs'
                    : 'bg-stone-50 hover:bg-stone-100 text-stone-800 border-stone-200'
                }`}
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>CSPRNG 真随机洗牌换一批</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  gameAudio.playTap();
                  setSortMode((prev) => (prev === 'aleatoric' ? 'sequential' : 'aleatoric'));
                }}
                className="px-3 py-2 rounded-xl text-xs font-semibold bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200 cursor-pointer whitespace-nowrap shrink-0"
              >
                当前排序：{sortMode === 'aleatoric' ? '零重复真随机序' : '按编号顺序'}（点此切换）
              </button>

              {sortMode === 'aleatoric' && (
                <button
                  type="button"
                  onClick={() => {
                    gameAudio.playTap();
                    resetLibraryAleatoricScope();
                    setShuffleNonce((n) => n + 1);
                  }}
                  className="px-2.5 py-2 rounded-xl text-[11px] font-medium text-stone-500 hover:text-stone-800 hover:bg-stone-100 cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1"
                  title="清空跨会话已浏览顺序记录并彻底重洗全库"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>重置全库洗牌盒</span>
                </button>
              )}
            </div>

            {/* Web Speech Continuous Audio Listening Bar */}
            <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-stone-100">
              <button
                type="button"
                onClick={handleToggleGlobalListen}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all whitespace-nowrap shrink-0 ${
                  audioPlayingIdx !== null
                    ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs'
                    : 'bg-stone-900 hover:bg-stone-800 text-white shadow-xs'
                }`}
              >
                {audioPlayingIdx !== null ? (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    <span>暂停随听 ({audioPlayingIdx + 1}/{filteredLaws.length})</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-amber-300" />
                    <span>听力随听连播（当前随机队列）</span>
                    <Play className="w-3 h-3 fill-current" />
                  </>
                )}
              </button>

              {audioPlayingIdx !== null && (
                <button
                  type="button"
                  onClick={() => {
                    gameAudio.playTap();
                    const nextIdx = (audioPlayingIdx + 1) % Math.max(1, filteredLaws.length);
                    speakLawAt(nextIdx, audioRate);
                  }}
                  className="px-2.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
                  title="跳听下一条随机定律"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                  <span>下一条</span>
                </button>
              )}

              <select
                value={audioRate}
                onChange={(e) => {
                  const nextRate = Number(e.target.value);
                  setAudioRate(nextRate);
                  if (audioPlayingIdx !== null) {
                    speakLawAt(audioPlayingIdx, nextRate);
                  }
                }}
                aria-label="随听朗读语速"
                className="px-2.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-mono font-bold text-stone-700 cursor-pointer shrink-0"
              >
                <option value={0.9}>0.9× 慢听</option>
                <option value={1.0}>1.0× 常速</option>
                <option value={1.25}>1.25× 快听</option>
              </select>
            </div>
          </div>

          {audioPlayingIdx !== null && filteredLaws[audioPlayingIdx] && (
            <div className="rounded-xl px-3.5 py-2.5 bg-amber-50/90 border border-amber-200 flex items-center justify-between gap-3 text-xs">
              <div className="min-w-0 flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-amber-700 shrink-0" />
                <span className="font-mono font-bold text-amber-900 shrink-0">
                  {filteredLaws[audioPlayingIdx].codeId}
                </span>
                <span className="font-bold text-stone-900 truncate">
                  正在随听：{filteredLaws[audioPlayingIdx].nameZh}
                </span>
              </div>
              <button
                type="button"
                onClick={() => navigate(`/law/${filteredLaws[audioPlayingIdx].id}`)}
                className="text-xs font-bold text-amber-900 hover:underline whitespace-nowrap shrink-0 cursor-pointer"
              >
                进入图文解析 →
              </button>
            </div>
          )}
        </div>

        {/* 3. Category Controls depending on active Taxonomy Mode */}
        {curationMode === 'sexual_psychology' ? (
          <div id="sexual-organizer">
            <SexualPsychologyOrganizer
              lawsMasteryMap={user.lawMasteryMap}
              selectedPillar={selectedSexualPillar}
              selectedContext={selectedSexualContext}
              selectedCategory={selectedSexualCategory}
              selectedTopic={selectedSexualTopic}
              selectedDifficulty={selectedDifficulty}
              matchedCount={filteredLaws.length}
              onSelectPillar={(pillarId) => {
                setSelectedSexualPillar(pillarId);
                setSelectedSexualCategory('all');
                setSelectedSexualTopic('all');
                setVisibleLimit(24);
              }}
              onSelectContext={(contextId) => {
                setSelectedSexualContext(contextId);
                setVisibleLimit(24);
              }}
              onSelectCategory={(catId) => {
                setSelectedSexualCategory(catId);
                setSelectedSexualTopic('all');
                setVisibleLimit(24);
              }}
              onSelectTopic={(topicId) => {
                setSelectedSexualTopic(topicId);
                setVisibleLimit(24);
              }}
              onSelectDifficulty={(diff) => {
                setSelectedDifficulty(diff);
                setVisibleLimit(24);
              }}
              onResetFilters={() => {
                setSelectedSexualPillar('all');
                setSelectedSexualContext('all');
                setSelectedSexualCategory('all');
                setSelectedSexualTopic('all');
                setSelectedDifficulty('all');
                setVisibleLimit(24);
              }}
              onLaunchArena={() => {
                const params = new URLSearchParams();
                if (selectedSexualPillar !== 'all') params.set('pillar', selectedSexualPillar);
                if (selectedSexualContext !== 'all') params.set('context', selectedSexualContext);
                if (selectedSexualCategory !== 'all') params.set('category', selectedSexualCategory);
                const arenaDiff =
                  selectedDifficulty === 'Easy'
                    ? '低'
                    : selectedDifficulty === 'Medium'
                    ? '中'
                    : selectedDifficulty === 'Hard'
                    ? '高'
                    : '中';
                params.set('difficulty', arenaDiff);
                navigate(`/game/sexual-aleatoric-arena?${params.toString()}`);
              }}
            />
          </div>
        ) : curationMode === 'criminal_psychology' ? (
          <div className="space-y-4">
            {/* Scientific Non-Diagnostic Disclaimer Banner */}
            <div className="rounded-2xl p-4 bg-rose-50/85 border border-rose-200/90 text-xs text-rose-950 flex items-start gap-2.5 leading-relaxed">
              <Scale className="w-4 h-4 text-rose-800 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">犯罪心理学 100 律专题分类导航 · </strong>
                <span>{CRIMINAL_PSYCHOLOGY_NOTE}</span>
              </div>
            </div>

            {/* Axis 1: 5 Observation & Prevention Contexts */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-mono font-bold text-stone-500">
                ① 按 5 大观察与预防场景快速定位：
              </div>
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                <button
                  onClick={() => {
                    gameAudio.playSelect();
                    setSelectedCriminalContext('all');
                  }}
                  className={`text-xs font-bold px-4 py-2 rounded-xl transition-all shrink-0 whitespace-nowrap cursor-pointer ${
                    selectedCriminalContext === 'all'
                      ? 'bg-stone-900 text-white shadow-sm'
                      : 'bg-white text-stone-700 border border-stone-200 hover:border-stone-400'
                  }`}
                >
                  全部场景 ({CRIMINAL_PSYCHOLOGY_LAWS.length})
                </button>
                {CRIMINAL_CONTEXTS.map((ctx) => {
                  const isSelected = selectedCriminalContext === ctx.id;
                  return (
                    <button
                      key={ctx.id}
                      onClick={() => {
                        gameAudio.playSelect();
                        setSelectedCriminalContext(ctx.id);
                      }}
                      className={`text-xs font-bold px-3.5 py-2 rounded-xl transition-all shrink-0 whitespace-nowrap cursor-pointer ${
                        isSelected
                          ? 'text-white shadow-sm'
                          : 'bg-white text-stone-700 border border-stone-200 hover:border-stone-400'
                      }`}
                      style={isSelected ? { backgroundColor: ctx.color } : undefined}
                    >
                      {ctx.label} ({ctx.count})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Axis 2: 4 Core Theoretical Categories */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-mono font-bold text-stone-500">
                ② 按 4 大核心理论领域精准过滤：
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => {
                    gameAudio.playTap();
                    setSelectedCriminalCategory('all');
                  }}
                  className={`text-[11px] font-bold px-3 py-1.5 rounded-lg border cursor-pointer whitespace-nowrap shrink-0 ${
                    selectedCriminalCategory === 'all'
                      ? 'bg-rose-800 text-white border-rose-800'
                      : 'bg-white text-stone-700 border-stone-200 hover:border-stone-400'
                  }`}
                >
                  全部领域 (4)
                </button>
                {CRIMINAL_CATEGORIES.map((cat) => {
                  const isSelected = selectedCriminalCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        gameAudio.playTap();
                        setSelectedCriminalCategory(cat.id);
                      }}
                      className={`text-[11px] font-bold px-3 py-1.5 rounded-lg border cursor-pointer whitespace-nowrap shrink-0 transition-colors ${
                        isSelected
                          ? 'text-white'
                          : 'bg-white text-stone-700 border-stone-200 hover:border-stone-400'
                      }`}
                      style={
                        isSelected
                          ? { backgroundColor: cat.color, borderColor: cat.color }
                          : undefined
                      }
                    >
                      {cat.label} ({cat.count})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Axis 3: 20 Core Theory Topics Quick Selector */}
            <div className="bg-stone-50/90 p-2.5 rounded-2xl border border-stone-200/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
              <button
                onClick={() => {
                  gameAudio.playTap();
                  setSelectedCriminalTheory('all');
                }}
                className={`text-[11px] font-bold px-3 py-1.5 rounded-xl shrink-0 cursor-pointer whitespace-nowrap ${
                  selectedCriminalTheory === 'all'
                    ? 'bg-stone-900 text-white'
                    : 'text-stone-600 hover:bg-stone-200/70'
                }`}
              >
                全部 20 大核心理论 (5视角/题)
              </button>
              {CRIMINAL_THEORY_TOPICS.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => {
                    gameAudio.playTap();
                    setSelectedCriminalTheory(topic.id);
                  }}
                  className={`text-[11px] font-medium px-3 py-1.5 rounded-xl shrink-0 cursor-pointer whitespace-nowrap ${
                    selectedCriminalTheory === topic.id
                      ? 'bg-rose-800 text-white font-bold'
                      : 'text-stone-600 hover:bg-stone-200/70'
                  }`}
                >
                  {topic.titleZh}
                </button>
              ))}
            </div>
          </div>
        ) : curationMode === 'reverse_psychology' ? (
          <div className="space-y-4">
            {/* Scientific Disclaimer Banner */}
            <div className="rounded-2xl p-4 bg-teal-50/80 border border-teal-200/90 text-xs text-teal-950 flex items-start gap-2.5 leading-relaxed">
              <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">逆向心理学与心理抗拒 100 律分类导航 · </strong>
                <span>{REVERSE_PSYCHOLOGY_NOTE}</span>
              </div>
            </div>

            {/* Axis 1: 5 High-Frequency Scenarios */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-mono font-bold text-stone-500">
                ① 按 5 大沟通实战场景快速定位：
              </div>
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                <button
                  onClick={() => {
                    gameAudio.playSelect();
                    setSelectedReverseScenario('all');
                  }}
                  className={`text-xs font-bold px-4 py-2 rounded-xl transition-all shrink-0 whitespace-nowrap cursor-pointer ${
                    selectedReverseScenario === 'all'
                      ? 'bg-stone-900 text-white shadow-sm'
                      : 'bg-white text-stone-700 border border-stone-200 hover:border-stone-400'
                  }`}
                >
                  全部场景 ({REVERSE_PSYCHOLOGY_LAWS.length})
                </button>
                {REVERSE_SCENARIOS.map((sc) => {
                  const isSelected = selectedReverseScenario === sc.id;
                  return (
                    <button
                      key={sc.id}
                      onClick={() => {
                        gameAudio.playSelect();
                        setSelectedReverseScenario(sc.id);
                      }}
                      className={`text-xs font-bold px-3.5 py-2 rounded-xl transition-all shrink-0 whitespace-nowrap cursor-pointer ${
                        isSelected
                          ? 'text-white shadow-sm'
                          : 'bg-white text-stone-700 border border-stone-200 hover:border-stone-400'
                      }`}
                      style={isSelected ? { backgroundColor: sc.color } : undefined}
                    >
                      {sc.label} ({sc.count})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Axis 2: 12 Psychological Mechanism Categories */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-mono font-bold text-stone-500">
                ② 按 12 大核心机制分类精准过滤：
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => {
                    gameAudio.playTap();
                    setSelectedReverseCategory('all');
                  }}
                  className={`text-[11px] font-bold px-3 py-1.5 rounded-lg border cursor-pointer whitespace-nowrap shrink-0 ${
                    selectedReverseCategory === 'all'
                      ? 'bg-teal-800 text-white border-teal-800'
                      : 'bg-white text-stone-700 border-stone-200 hover:border-stone-400'
                  }`}
                >
                  全部分类 (12)
                </button>
                {REVERSE_CATEGORIES.map((cat) => {
                  const isSelected = selectedReverseCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        gameAudio.playTap();
                        setSelectedReverseCategory(cat.id);
                      }}
                      className={`text-[11px] font-bold px-3 py-1.5 rounded-lg border cursor-pointer whitespace-nowrap shrink-0 transition-colors ${
                        isSelected
                          ? 'text-white'
                          : 'bg-white text-stone-700 border-stone-200 hover:border-stone-400'
                      }`}
                      style={
                        isSelected
                          ? { backgroundColor: cat.color, borderColor: cat.color }
                          : undefined
                      }
                    >
                      {cat.label} ({cat.count})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Axis 3: 20 Chapters Quick Selector */}
            <div className="bg-stone-50/90 p-2.5 rounded-2xl border border-stone-200/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
              <button
                onClick={() => {
                  gameAudio.playTap();
                  setSelectedReverseChapter('all');
                }}
                className={`text-[11px] font-bold px-3 py-1.5 rounded-xl shrink-0 cursor-pointer whitespace-nowrap ${
                  selectedReverseChapter === 'all'
                    ? 'bg-stone-900 text-white'
                    : 'text-stone-600 hover:bg-stone-200/70'
                }`}
              >
                全部 20 章目录
              </button>
              {REVERSE_CHAPTERS.map((ch) => (
                <button
                  key={ch.chapter}
                  onClick={() => {
                    gameAudio.playTap();
                    setSelectedReverseChapter(ch.chapter);
                  }}
                  className={`text-[11px] font-medium px-3 py-1.5 rounded-xl shrink-0 cursor-pointer whitespace-nowrap ${
                    selectedReverseChapter === ch.chapter
                      ? 'bg-teal-800 text-white font-bold'
                      : 'text-stone-600 hover:bg-stone-200/70'
                  }`}
                >
                  {ch.chapter}
                </button>
              ))}
            </div>
          </div>
        ) : curationMode === 'microexpressions' ? (
          <div className="space-y-4">
            {/* Microexpression Category Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              <button
                onClick={() => {
                  gameAudio.playSelect();
                  setSelectedMicroCategory('all');
                }}
                className={`text-xs font-bold px-4 py-2.5 rounded-2xl transition-all shrink-0 whitespace-nowrap cursor-pointer flex items-center gap-2 active:scale-95 shadow-xs ${
                  selectedMicroCategory === 'all'
                    ? 'bg-stone-900 text-white shadow-md'
                    : 'bg-white text-stone-700 border border-stone-200 hover:border-stone-400'
                }`}
              >
                <Eye className="w-3.5 h-3.5 text-amber-500" />
                <span>全部微表情定律 ({MICROEXPRESSION_LAWS.length})</span>
              </button>

              {MICROEXPRESSION_DOMAINS.map((dom) => {
                const isSelected = selectedMicroCategory === dom.categoryZh;
                const count = MICROEXPRESSION_LAWS.filter((l) => l.categoryZh === dom.categoryZh).length;
                return (
                  <button
                    key={dom.id}
                    onClick={() => {
                      gameAudio.playSelect();
                      setSelectedMicroCategory(dom.categoryZh);
                    }}
                    className={`text-xs font-bold px-4 py-2.5 rounded-2xl transition-all shrink-0 whitespace-nowrap cursor-pointer flex items-center gap-2 active:scale-95 shadow-xs ${
                      isSelected
                        ? 'text-white shadow-md'
                        : 'bg-white text-stone-700 border border-stone-200 hover:border-stone-400 hover:text-stone-900'
                    }`}
                    style={isSelected ? { backgroundColor: dom.color } : undefined}
                  >
                    <span className="tabular-nums">{dom.categoryZh}分类排行 ({count})</span>
                  </button>
                );
              })}
            </div>

            {/* Category Ranking Matrix Summary Card */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/90 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-stone-200/70">
                <div>
                  <h3 className="font-serif-editorial text-sm sm:text-base font-bold text-stone-900">
                    微表情与面部动作十大定律 · 分类排行榜（ML001–ML010）
                  </h3>
                  <p className="text-xs text-stone-500">
                    按「认知、情绪、社会、行为」四大心理学分类依次排榜，每条均附完整故事场景、科学边界并已同步分派至竞技场小游戏。
                  </p>
                </div>
                <span className="text-[11px] font-mono text-stone-500 shrink-0 tabular-nums">
                  证据等级 A · 点击任一排行直达详情
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {MICROEXPRESSION_DOMAINS.filter(
                  (d) => selectedMicroCategory === 'all' || d.categoryZh === selectedMicroCategory
                ).map((dom) => {
                  const ranked = MICROEXPRESSION_LAWS.filter((l) => l.categoryZh === dom.categoryZh).sort(
                    (a, b) => (a.categoryRank || 99) - (b.categoryRank || 99)
                  );
                  return (
                    <div
                      key={dom.id}
                      className="rounded-xl p-3 bg-[#FAF8F5] border border-stone-200/80 space-y-2"
                    >
                      <div className="flex items-center justify-between border-b border-stone-200/70 pb-1.5">
                        <span className="text-xs font-bold" style={{ color: dom.color }}>
                          {dom.categoryZh}分类榜
                        </span>
                        <span className="text-[11px] font-mono text-stone-500 tabular-nums">
                          共 {ranked.length} 律
                        </span>
                      </div>
                      <ul className="space-y-1.5">
                        {ranked.map((item) => (
                          <li key={item.id}>
                            <button
                              type="button"
                              onClick={() => {
                                gameAudio.playTap();
                                navigate(`/law/${item.id}`);
                              }}
                              className="w-full text-left flex items-baseline gap-2 text-xs hover:text-indigo-700 transition-colors cursor-pointer"
                            >
                              <span
                                className="font-mono font-bold text-[11px] tabular-nums shrink-0"
                                style={{ color: dom.color }}
                              >
                                #{item.categoryRank}
                              </span>
                              <span className="font-semibold text-stone-800 truncate flex-1">
                                {item.nameZh}
                              </span>
                              <span className="font-mono text-[10px] text-stone-400 shrink-0">
                                {item.codeId}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : curationMode === 'love_codex' ? (
          <div className="space-y-3.5">
            {/* 7 Analyzed Love Psychology Domain Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              <button
                onClick={() => handleLoveDomainChange('all')}
                className={`text-xs font-bold px-4 py-2.5 rounded-2xl transition-all shrink-0 whitespace-nowrap cursor-pointer flex items-center gap-2 active:scale-95 shadow-xs ${
                  selectedLoveDomain === 'all'
                    ? 'bg-stone-900 text-rose-200 shadow-md border border-rose-400/40'
                    : 'bg-white text-stone-700 border border-stone-200 hover:border-stone-400 hover:text-stone-900'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${selectedLoveDomain === 'all' ? 'fill-rose-400 text-rose-400' : 'text-rose-500'}`} />
                <span>全部分类</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${selectedLoveDomain === 'all' ? 'bg-rose-400/20 text-rose-100' : 'bg-stone-100 text-stone-500'}`}>
                  {LOVE_PSYCHOLOGY_LAWS.length} 篇
                </span>
              </button>

              {LOVE_DOMAINS.map((dom) => {
                const isSelected = selectedLoveDomain === dom.id;
                const count = LOVE_PSYCHOLOGY_LAWS.filter((l) => l.loveDomainId === dom.id).length;
                return (
                  <button
                    key={dom.id}
                    onClick={() => handleLoveDomainChange(dom.id)}
                    className={`text-xs font-bold px-4 py-2.5 rounded-2xl transition-all shrink-0 whitespace-nowrap cursor-pointer flex items-center gap-2 active:scale-95 shadow-xs ${
                      isSelected
                        ? 'text-white shadow-md'
                        : 'bg-white text-stone-700 border border-stone-200 hover:border-stone-400 hover:text-stone-900'
                    }`}
                    style={
                      isSelected
                        ? { backgroundColor: dom.color, boxShadow: `0 6px 16px -2px ${dom.color}65` }
                        : undefined
                    }
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: isSelected ? '#ffffff' : dom.color }}
                    />
                    <span>{dom.shortTitle}</span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-500'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}

              <button
                onClick={() => {
                  gameAudio.playTap();
                  setIsLoading(true);
                  setOnlyBookmarked((prev) => !prev);
                  setTimeout(() => setIsLoading(false), 120);
                }}
                className={`text-xs font-bold px-4 py-2.5 rounded-2xl transition-all shrink-0 flex items-center gap-1.5 whitespace-nowrap cursor-pointer active:scale-95 ${
                  onlyBookmarked
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                    : 'bg-white text-stone-700 border border-stone-200 hover:border-stone-400'
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${onlyBookmarked ? 'fill-white text-white' : 'text-stone-500'}`} />
                <span className="font-numeric">收藏 ({user.bookmarks.length})</span>
              </button>
            </div>

            {/* Difficulty Progression + Sub-tag Filter Row */}
            <div className="bg-stone-50/90 p-3 rounded-2xl border border-stone-200/80 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-bold text-stone-500 mr-1">难度阶梯:</span>
                  {(['all', 'Easy', 'Medium', 'Hard'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => {
                        gameAudio.playTap();
                        setSelectedDifficulty(lvl);
                        setVisibleLimit(24);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        selectedDifficulty === lvl
                          ? 'bg-stone-900 text-white shadow-2xs'
                          : 'bg-white text-stone-600 border border-stone-200 hover:border-stone-400'
                      }`}
                    >
                      {lvl === 'all'
                        ? '全部难度'
                        : lvl === 'Easy'
                        ? '初级 Easy (首都 1-17)'
                        : lvl === 'Medium'
                        ? '中阶 Medium (首都 18-34)'
                        : '高阶 Hard (首都 35-50)'}
                    </button>
                  ))}
                </div>

                {currentLoveDomainObj && (
                  <span className="text-[11px] text-stone-600 font-medium">
                    {currentLoveDomainObj.description}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 border-t border-stone-200/70">
                <button
                  onClick={() => {
                    gameAudio.playTap();
                    setSelectedLoveSubTag('all');
                    setVisibleLimit(24);
                  }}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-lg shrink-0 cursor-pointer transition-all ${
                    selectedLoveSubTag === 'all'
                      ? 'bg-rose-700 text-white'
                      : 'bg-white text-stone-600 border border-stone-200 hover:border-stone-400'
                  }`}
                >
                  全部细分标签 ({LOVE_SUBTAGS.length})
                </button>
                {LOVE_SUBTAGS.filter((st) =>
                  currentLoveDomainObj ? currentLoveDomainObj.rawTags.includes(st.tag) : true
                ).map((st) => (
                  <button
                    key={st.tag}
                    onClick={() => {
                      gameAudio.playTap();
                      setSelectedLoveSubTag(st.tag);
                      setVisibleLimit(24);
                    }}
                    className={`text-[11px] font-medium px-2.5 py-1 rounded-lg shrink-0 cursor-pointer transition-all ${
                      selectedLoveSubTag === st.tag
                        ? 'bg-rose-700 text-white font-bold'
                        : 'bg-white text-stone-600 border border-stone-200 hover:border-stone-400'
                    }`}
                  >
                    {st.tag} ({st.count})
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : curationMode === 'emotional_sections' ? (
          <div className="space-y-3.5">
            {/* Five Major Sections Tabs Row */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              {/* All 50 Laws tab */}
              <button
                onClick={() => handleEmotionalSectionChange('all')}
                className={`text-xs font-bold px-4 py-2.5 rounded-2xl transition-all shrink-0 whitespace-nowrap cursor-pointer flex items-center gap-2 active:scale-95 shadow-xs ${
                  selectedEmotionalSection === 'all'
                    ? 'bg-stone-900 text-amber-300 shadow-md border border-amber-500/40'
                    : 'bg-white text-stone-700 border border-stone-200 hover:border-stone-400 hover:text-stone-900'
                }`}
              >
                <Crown className={`w-3.5 h-3.5 ${selectedEmotionalSection === 'all' ? 'text-amber-400' : 'text-stone-400'}`} />
                <span>全部板块</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${selectedEmotionalSection === 'all' ? 'bg-amber-400/20 text-amber-200' : 'bg-stone-100 text-stone-500'}`}>
                  50 篇
                </span>
              </button>

              {/* The Five Individual Section Tabs */}
              {EMOTIONAL_SECTIONS.map((sec) => {
                const isSelected = selectedEmotionalSection === sec.index;
                return (
                  <button
                    key={sec.index}
                    onClick={() => handleEmotionalSectionChange(sec.index)}
                    className={`text-xs font-bold px-4 py-2.5 rounded-2xl transition-all shrink-0 whitespace-nowrap cursor-pointer flex items-center gap-2 active:scale-95 shadow-xs ${
                      isSelected
                        ? 'text-white shadow-md'
                        : 'bg-white text-stone-700 border border-stone-200 hover:border-stone-400 hover:text-stone-900'
                    }`}
                    style={
                      isSelected
                        ? {
                            backgroundColor: sec.theme.primary,
                            boxShadow: `0 6px 16px -2px ${sec.theme.primary}65`,
                          }
                        : undefined
                    }
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
                      style={{
                        backgroundColor: isSelected ? '#ffffff' : sec.theme.primary,
                      }}
                    />
                    <span>{sec.title.split('：')[0]} · {sec.title.split('：')[1]?.replace(/的10条规律$/, '')}</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-500'
                      }`}
                    >
                      {sec.lawRange}
                    </span>
                  </button>
                );
              })}

              {/* Bookmarks Filter Button */}
              <button
                onClick={() => {
                  gameAudio.playTap();
                  setIsLoading(true);
                  setOnlyBookmarked((prev) => !prev);
                  setTimeout(() => setIsLoading(false), 140);
                }}
                className={`text-xs font-bold px-4 py-2.5 rounded-2xl transition-all shrink-0 flex items-center gap-1.5 whitespace-nowrap cursor-pointer active:scale-95 ${
                  onlyBookmarked
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                    : 'bg-white text-stone-700 border border-stone-200 hover:border-stone-400'
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${onlyBookmarked ? 'fill-white text-white' : 'text-stone-500'}`} />
                <span className="font-numeric">收藏 ({user.bookmarks.length})</span>
              </button>
            </div>

            {/* Section Curator Context Card when a specific section is chosen */}
            {currentEmotionalSectionObj ? (
              <div
                className="rounded-2xl p-4 sm:p-5 border transition-all space-y-2 bg-gradient-to-r"
                style={{
                  borderColor: `${currentEmotionalSectionObj.theme.primary}45`,
                  backgroundColor: `${currentEmotionalSectionObj.theme.primary}08`,
                }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span
                        className="font-mono font-bold px-2 py-0.5 rounded text-[10px]"
                        style={{
                          backgroundColor: `${currentEmotionalSectionObj.theme.primary}20`,
                          color: currentEmotionalSectionObj.theme.primary,
                        }}
                      >
                        PART {currentEmotionalSectionObj.index} · {currentEmotionalSectionObj.en}
                      </span>
                      <span className="text-stone-400">/</span>
                      <span className="font-mono text-stone-500 text-xs">
                        涵盖定律：{currentEmotionalSectionObj.lawRange}
                      </span>
                    </div>
                    <h3 className="font-serif-editorial text-base sm:text-lg font-bold text-stone-900">
                      {currentEmotionalSectionObj.title}
                    </h3>
                    <p className="text-xs text-stone-600 leading-relaxed max-w-2xl">
                      {currentEmotionalSectionObj.description}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      gameAudio.playTap();
                      navigate(`/emotional-laws?section=${currentEmotionalSectionObj.index}`);
                    }}
                    className="shrink-0 px-3.5 py-2 rounded-xl text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all hover:brightness-110 active:scale-95 cursor-pointer self-start sm:self-center"
                    style={{ backgroundColor: currentEmotionalSectionObj.theme.primary }}
                  >
                    <span>进入暗夜折叠特展馆</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-stone-50/80 rounded-xl px-4 py-2 border border-stone-200/70 text-xs text-stone-600 flex items-center justify-between gap-2 flex-wrap">
                <span className="flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                  <span>情感心理学 50 篇完整典藏 · 涵盖爱情吸引、依恋模型、关系冲突、丧失疗愈与长期亲密</span>
                </span>
                <span className="text-[11px] font-mono text-stone-500">
                  按序号 01 - 50 认知发展脉络排序
                </span>
              </div>
            )}
          </div>
        ) : (
          /* Classic Domains View: 6 Pavilions & Chapters */
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar pb-1">
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.key;
                return (
                  <button
                    key={cat.key}
                    onClick={() => handleCategoryChange(cat.key)}
                    className={`text-xs font-bold px-4 py-2.5 rounded-2xl transition-all shrink-0 whitespace-nowrap cursor-pointer flex items-center gap-2 active:scale-95 shadow-xs ${
                      isSelected
                        ? 'text-white shadow-md'
                        : 'bg-white text-stone-700 border border-stone-200 hover:border-stone-400 hover:text-stone-900'
                    }`}
                    style={
                      isSelected
                        ? {
                            backgroundColor: cat.color,
                            boxShadow: `0 6px 16px -2px ${cat.color}65`,
                          }
                        : undefined
                    }
                  >
                    {!isSelected && (
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
                        style={{ backgroundColor: cat.color }}
                      />
                    )}
                    <span>{cat.label}</span>
                    <span
                      className={`text-[10px] font-mono ${
                        isSelected ? 'opacity-80' : 'text-stone-400'
                      }`}
                    >
                      ({cat.en})
                    </span>
                  </button>
                );
              })}

              {/* Bookmarks Filter Button */}
              <button
                onClick={() => {
                  gameAudio.playTap();
                  setIsLoading(true);
                  setOnlyBookmarked((prev) => !prev);
                  setTimeout(() => setIsLoading(false), 140);
                }}
                className={`text-xs font-bold px-4 py-2.5 rounded-2xl transition-all shrink-0 flex items-center gap-1.5 whitespace-nowrap cursor-pointer active:scale-95 ${
                  onlyBookmarked
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                    : 'bg-white text-stone-700 border border-stone-200 hover:border-stone-400'
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${onlyBookmarked ? 'fill-white text-white' : 'text-stone-500'}`} />
                <span className="font-numeric">收藏馆藏 ({user.bookmarks.length})</span>
              </button>
            </div>

            {/* Architectural Chapter Corridor Row (Classical Pavilions) */}
            {curationMode === 'classic_domains' && (
              <div className="bg-stone-50/90 p-2.5 rounded-2xl border border-stone-200/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
                <button
                  onClick={() => handleChapterChange('all')}
                  className={`text-[11px] font-bold px-3.5 py-2 rounded-xl transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                    selectedChapter === 'all'
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'text-stone-600 hover:bg-stone-200/70 hover:text-stone-900'
                  }`}
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>全部卷册 (142)</span>
                </button>
                {MINDLABZ_CHAPTERS.map((chap, idx) => (
                  <button
                    key={chap}
                    onClick={() => handleChapterChange(chap)}
                    className={`text-[11px] font-medium px-3 py-2 rounded-xl transition-all shrink-0 cursor-pointer ${
                      selectedChapter === chap
                        ? 'bg-stone-900 text-white font-bold shadow-xs'
                        : 'text-stone-600 hover:bg-stone-200/70 hover:text-stone-900'
                    }`}
                  >
                    <span className="font-numeric text-[10px] text-amber-600 mr-1 font-bold">
                      VOL.0{idx + 1}
                    </span>
                    <span>{chap}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Interactive Overlapping Card Stack Deck: 课程分类 · 学习收藏 · 词汇集 */}
      <section className="bg-white/90 p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl border border-stone-200/90 shadow-2xs space-y-3">
        <OverlappingCardStack
          scenario="courses"
          maxVisible={3}
          overlapRatio={1 / 3}
          size="md"
          layout="row"
          showScenarioTabs={true}
        />
      </section>

      {/* 5. Filtered Count & Active Status Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-xs text-stone-500 font-medium">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1.5 font-serif-editorial">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span className="text-stone-600">策展收录结果:</span>
            <strong className="text-stone-900 font-numeric font-bold text-sm">
              {filteredLaws.length}
            </strong>
            <span className="text-stone-600">条经典定律</span>
          </span>

          {curationMode === 'emotional_sections' && currentEmotionalSectionObj && (
            <span
              className="px-2.5 py-0.5 rounded-md text-[11px] font-bold text-white flex items-center gap-1 shadow-2xs"
              style={{ backgroundColor: currentEmotionalSectionObj.theme.primary }}
            >
              <span>{currentEmotionalSectionObj.title.split('：')[0]} · {currentEmotionalSectionObj.title.split('：')[1]?.replace(/的10条规律$/, '')}</span>
              <button
                onClick={() => setSelectedEmotionalSection('all')}
                className="hover:opacity-80 cursor-pointer ml-0.5"
                title="清除板块筛选"
              >
                ✕
              </button>
            </span>
          )}

          {curationMode === 'classic_domains' && selectedCategory !== 'all' && (
            <span
              className="px-2.5 py-0.5 rounded-md text-[11px] font-bold text-white flex items-center gap-1"
              style={{ backgroundColor: currentCategoryObj.color }}
            >
              <span>{currentCategoryObj.salonTitle}</span>
              <button
                onClick={() => setSelectedCategory('all')}
                className="hover:opacity-80 cursor-pointer ml-0.5"
              >
                ✕
              </button>
            </span>
          )}

          {searchQuery && (
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1">
              <span>关键词: “{searchQuery}”</span>
              <button
                onClick={() => setSearchQuery('')}
                className="hover:text-amber-950 cursor-pointer ml-0.5"
              >
                ✕
              </button>
            </span>
          )}
        </div>

        {((curationMode === 'sexual_psychology'
          ? selectedSexualPillar !== 'all' ||
            selectedSexualContext !== 'all' ||
            selectedSexualCategory !== 'all' ||
            selectedSexualTopic !== 'all' ||
            selectedDifficulty !== 'all'
          : curationMode === 'criminal_psychology'
          ? selectedCriminalContext !== 'all' || selectedCriminalCategory !== 'all' || selectedCriminalTheory !== 'all'
          : curationMode === 'reverse_psychology'
          ? selectedReverseScenario !== 'all' || selectedReverseCategory !== 'all' || selectedReverseChapter !== 'all'
          : curationMode === 'love_codex'
          ? selectedLoveDomain !== 'all' || selectedLoveSubTag !== 'all' || selectedDifficulty !== 'all'
          : curationMode === 'emotional_sections'
          ? selectedEmotionalSection !== 'all'
          : curationMode === 'microexpressions'
          ? selectedMicroCategory !== 'all'
          : selectedCategory !== 'all' || selectedChapter !== 'all') ||
          onlyBookmarked ||
          searchQuery) && (
          <button
            onClick={() => {
              gameAudio.playTap();
              setSearchQuery('');
              setSelectedSexualPillar('all');
              setSelectedSexualContext('all');
              setSelectedSexualCategory('all');
              setSelectedSexualTopic('all');
              setSelectedCriminalContext('all');
              setSelectedCriminalCategory('all');
              setSelectedCriminalTheory('all');
              setSelectedReverseScenario('all');
              setSelectedReverseCategory('all');
              setSelectedReverseChapter('all');
              setSelectedMicroCategory('all');
              setSelectedLoveDomain('all');
              setSelectedLoveSubTag('all');
              setSelectedDifficulty('all');
              setSelectedEmotionalSection('all');
              setSelectedCategory('all');
              setSelectedChapter('all');
              setOnlyBookmarked(false);
              setVisibleLimit(24);
            }}
            className="text-stone-800 font-bold hover:underline cursor-pointer flex items-center gap-1 text-xs"
          >
            <RotateCcw className="w-3 h-3" />
            <span>重置所有筛选</span>
          </button>
        )}
      </div>

      {/* 6. Display Mode: Gallery Grid vs Dossier View */}
      {viewMode === 'grid' ? (
        <CylinderScrollList className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          {isLoading ? (
            <>
              <LawCardSkeleton />
              <LawCardSkeleton />
              <LawCardSkeleton />
              <LawCardSkeleton />
            </>
          ) : visibleLaws.length > 0 ? (
            <>
              {visibleLaws.map((law, idx) => (
                <CylinderScrollItem key={law.id} radiusClass="rounded-2xl">
                  <div
                    className="animate-stageEnter h-full"
                    style={{ animationDelay: `${Math.min(idx * 20, 180)}ms` }}
                  >
                    <PsychologyLawCard law={law} />
                  </div>
                </CylinderScrollItem>
              ))}
              {filteredLaws.length > visibleLaws.length && (
                <div className="col-span-full flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => {
                      gameAudio.playTap();
                      setVisibleLimit((prev) => prev + 24);
                    }}
                    className="px-6 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                  >
                    加载更多（已显示 {visibleLaws.length} / {filteredLaws.length} 条）
                  </button>
                  <button
                    onClick={() => {
                      gameAudio.playTap();
                      setVisibleLimit(filteredLaws.length);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-white border border-stone-300 hover:border-stone-500 text-stone-700 text-xs font-semibold transition-all cursor-pointer"
                  >
                    展开全部 {filteredLaws.length} 条
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="col-span-full bg-white rounded-3xl p-12 text-center border-2 border-dashed border-stone-200 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600">
                <Search className="w-7 h-7" />
              </div>
              <h3 className="font-serif-editorial text-lg font-bold text-stone-900">
                在当前展厅未检索到匹配的定律
              </h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto leading-relaxed">
                建议尝试更换中英文关键词、编号（如 LOVE001 或 LAW001）或切换至“全部分类”继续探索。
              </p>
              <button
                onClick={() => {
                  gameAudio.playTap();
                  setSearchQuery('');
                  setSelectedLoveDomain('all');
                  setSelectedLoveSubTag('all');
                  setSelectedDifficulty('all');
                  setSelectedCategory('all');
                  setSelectedChapter('all');
                  setOnlyBookmarked(false);
                }}
                className="px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md inline-flex items-center gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>重置筛选并显示全部典藏</span>
              </button>
            </div>
          )}
        </CylinderScrollList>
      ) : (
        /* Dossier List Mode: Sleek High-End Archival View */
        <CylinderScrollList className="space-y-3">
          {isLoading ? (
            <>
              <LawCardSkeleton />
              <LawCardSkeleton />
            </>
          ) : visibleLaws.length > 0 ? (
            <>
              {visibleLaws.map((law) => {
                const mastery = (user?.lawMasteryMap && user.lawMasteryMap[law.id]) || 0;
                const isMastered = mastery >= 80;
                return (
                  <CylinderScrollItem key={law.id} radiusClass="rounded-2xl">
                    <div
                      onClick={() => {
                        gameAudio.playTap();
                        navigate(`/law/${law.id}`);
                      }}
                      className="group bg-white hover:bg-stone-50/80 rounded-2xl p-4 sm:p-5 border border-stone-200/80 hover:border-amber-400/80 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-3.5 min-w-0 flex-1">
                        <span className="font-mono text-xs font-bold text-stone-800 shrink-0 mt-0.5 tabular-nums">
                          {law.codeId || 'LAW'}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-serif-editorial text-base font-bold text-stone-900 group-hover:text-amber-800 transition-colors truncate">
                              {law.nameZh}
                            </h3>
                            <span className="text-xs text-stone-400 font-serif-editorial italic truncate">
                              {law.nameEn}
                            </span>
                          </div>
                          <p className="text-xs text-stone-600 line-clamp-1 mt-0.5">
                            {law.shortExplanation}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center text-[11px] text-stone-600">
                        {law.subTag && (
                          <>
                            <span className="text-rose-700 font-medium">{law.subTag}</span>
                            <span className="text-stone-300" aria-hidden="true">·</span>
                          </>
                        )}
                        {law.assignedCityZh && (
                          <>
                            <span className="text-amber-800 font-medium">
                              {law.assignedCityZh.split(' ')[0]}
                            </span>
                            <span className="text-stone-300" aria-hidden="true">·</span>
                          </>
                        )}
                        <span className="font-medium text-stone-600">{law.categoryZh}</span>
                        {isMastered && (
                          <>
                            <span className="text-stone-300" aria-hidden="true">·</span>
                            <span className="text-emerald-700 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 fill-emerald-600 text-white" />
                              <span>已内化</span>
                            </span>
                          </>
                        )}
                        <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-stone-900 group-hover:translate-x-1 transition-all ml-1" />
                      </div>
                    </div>
                  </CylinderScrollItem>
                );
              })}
              {filteredLaws.length > visibleLaws.length && (
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => {
                      gameAudio.playTap();
                      setVisibleLimit((prev) => prev + 36);
                    }}
                    className="px-6 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                  >
                    加载更多（已显示 {visibleLaws.length} / {filteredLaws.length} 条）
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-3xl p-10 text-center border border-stone-200">
              <p className="text-xs text-stone-500">未检索到匹配结果</p>
            </div>
          )}
        </CylinderScrollList>
      )}

      {/* 7. Epiphany Modal (Random Inspirational Discovery Dialog) */}
      {epiphanyLaw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-3xl bg-white border border-amber-300 shadow-2xl p-7 sm:p-9 space-y-5 animate-stageEnter overflow-hidden">
            {/* Top gold ribbon */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-600" />

            <div className="flex items-center justify-between pb-3 border-b border-stone-200/80">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-amber-100 text-amber-800">
                  <Sparkles className="w-4 h-4" />
                </span>
                <span className="font-serif-editorial text-xs font-bold text-stone-900 tracking-wider uppercase">
                  今日心智灵感 · 随机启迪
                </span>
              </div>
              <button
                onClick={() => setEpiphanyLaw(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-800 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-mono font-bold px-2 py-0.5 rounded bg-stone-100 text-stone-900">
                  {epiphanyLaw.codeId}
                </span>
                <span className="text-stone-400">/</span>
                <span className="font-semibold text-amber-800">
                  {epiphanyLaw.categoryZh}展厅
                </span>
              </div>

              <h3 className="font-serif-editorial text-2xl font-bold text-stone-900 leading-snug">
                {epiphanyLaw.nameZh}
              </h3>
              <p className="text-xs text-stone-500 font-serif-editorial italic">
                {epiphanyLaw.nameEn}
              </p>

              <blockquote className="rounded-2xl p-4 bg-amber-50/70 border border-amber-200/80 font-serif-editorial text-xs sm:text-sm text-stone-800 leading-relaxed italic">
                “{epiphanyLaw.shortExplanation}”
              </blockquote>

              <p className="text-xs text-stone-600 leading-relaxed line-clamp-3">
                {epiphanyLaw.detailedExplanation}
              </p>
            </div>

            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                onClick={handleRandomEpiphany}
                className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-100 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>换一条启迪</span>
              </button>

              <button
                onClick={() => {
                  setEpiphanyLaw(null);
                  navigate(`/law/${epiphanyLaw.id}`);
                }}
                className="flex-1 px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>进入深度解析</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <FloatingFontScaleControl tone="paper" title="定律库字号调节" />
    </div>
  );
};

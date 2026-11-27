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
import { CognitiveFocusAudioPlayer } from '../components/audio/CognitiveFocusAudioPlayer';
import { PsychologyLawCard } from '../components/cards/PsychologyLawCard';
import { LawCardSkeleton } from '../components/ui/Skeleton';
import { VoiceTranscribeButton } from '../components/ui/VoiceTranscribeButton';
import { CategoryZh, DifficultyLevel, LoveDomainId, PsychologyLaw } from '../types';
import { MINDLABZ_CHAPTERS } from '../data/laws';
import { gameAudio } from '../utils/gameAudio';
import {
  startLawSpeech,
  stopLawSpeech,
  toggleLawSpeech,
  useLawSpeech,
  useLawSpeechPreferences,
  LawSpeechSegment,
} from '../utils/lawSpeechEngine';
import { SilverSpeechText, LawVoiceToggleSwitch } from '../components/ui/SilverSpeechText';
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
  LOVE100_PSYCHOLOGY_LAWS,
  LOVE100_PILLARS,
} from '../data/love100PsychologyLaws';
import {
  INTIMATE_RELATIONSHIPS_LAWS,
  INTIMATE_PILLARS,
} from '../data/intimateRelationshipsLaws';
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
import { Love100PsychologyOrganizer } from '../components/love100/Love100PsychologyOrganizer';
import { IntimatePsychologyOrganizer } from '../components/intimate/IntimatePsychologyOrganizer';
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
  | 'intimate_psychology'
  | 'love_100_psychology'
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
      : modeParam === 'intimate' || modeParam === 'intimate_psychology'
      ? 'intimate_psychology'
      : modeParam === 'love100' || modeParam === 'love_100_psychology'
      ? 'love_100_psychology'
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
  const isInitialLove100 = initialMode === 'love_100_psychology';
  const isInitialIntimate = initialMode === 'intimate_psychology';
  const initialCategory =
    isInitialSexual || isInitialLove100 || isInitialIntimate
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
  const [selectedLove100Pillar, setSelectedLove100Pillar] = useState<string>(
    isInitialLove100 ? searchParams.get('pillar') || 'all' : 'all'
  );
  const [selectedLove100Context, setSelectedLove100Context] = useState<string>(
    isInitialLove100 ? searchParams.get('context') || 'all' : 'all'
  );
  const [selectedLove100Category, setSelectedLove100Category] = useState<string>(
    isInitialLove100 ? searchParams.get('love100Cat') || searchParams.get('category') || 'all' : 'all'
  );
  const [selectedLove100Topic, setSelectedLove100Topic] = useState<string>(
    isInitialLove100 ? searchParams.get('topic') || 'all' : 'all'
  );
  const [selectedIntimatePillar, setSelectedIntimatePillar] = useState<string>(
    isInitialIntimate ? searchParams.get('pillar') || 'all' : 'all'
  );
  const [selectedIntimateContext, setSelectedIntimateContext] = useState<string>(
    isInitialIntimate ? searchParams.get('context') || 'all' : 'all'
  );
  const [selectedIntimateCategory, setSelectedIntimateCategory] = useState<string>(
    isInitialIntimate ? searchParams.get('intimateCat') || searchParams.get('category') || 'all' : 'all'
  );
  const [selectedIntimateTopic, setSelectedIntimateTopic] = useState<string>(
    isInitialIntimate ? searchParams.get('topic') || 'all' : 'all'
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
  const [speechPrefs, updateSpeechPrefs] = useLawSpeechPreferences();
  const audioRate = speechPrefs.rate;

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
    } else if (urlMode === 'intimate' || urlMode === 'intimate_psychology') {
      setCurationMode('intimate_psychology');
      const p = searchParams.get('pillar');
      const ctx = searchParams.get('context');
      const cat = searchParams.get('intimateCat') || searchParams.get('category');
      const topic = searchParams.get('topic');
      const diff = searchParams.get('difficulty');
      if (p) setSelectedIntimatePillar(p);
      if (ctx) setSelectedIntimateContext(ctx);
      if (cat) setSelectedIntimateCategory(cat);
      if (topic) setSelectedIntimateTopic(topic);
      if (diff === 'Easy' || diff === 'Medium' || diff === 'Hard' || diff === 'all') {
        setSelectedDifficulty(diff);
      }
    } else if (urlMode === 'love100' || urlMode === 'love_100_psychology') {
      setCurationMode('love_100_psychology');
      const p = searchParams.get('pillar');
      const ctx = searchParams.get('context');
      const cat = searchParams.get('love100Cat') || searchParams.get('category');
      const topic = searchParams.get('topic');
      const diff = searchParams.get('difficulty');
      if (p) setSelectedLove100Pillar(p);
      if (ctx) setSelectedLove100Context(ctx);
      if (cat) setSelectedLove100Category(cat);
      if (topic) setSelectedLove100Topic(topic);
      if (diff === 'Easy' || diff === 'Medium' || diff === 'Hard' || diff === 'all') {
        setSelectedDifficulty(diff);
      }
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
      stopLawSpeech();
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
    stopLawSpeech();
  };

  const handleReshuffle = () => {
    gameAudio.playSuccess();
    setShuffleNonce((n) => n + 1);
    setSortMode('aleatoric');
    setAudioPlayingIdx(null);
    stopLawSpeech();
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
      curationMode === 'intimate_psychology'
        ? INTIMATE_RELATIONSHIPS_LAWS
        : curationMode === 'love_100_psychology'
        ? LOVE100_PSYCHOLOGY_LAWS
        : curationMode === 'sexual_psychology'
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

      if (curationMode === 'intimate_psychology') {
        if (!law.isIntimateRelationship) return false;
        if (selectedIntimatePillar !== 'all' && law.intimatePillar !== selectedIntimatePillar) {
          return false;
        }
        if (selectedIntimateContext !== 'all' && law.intimateContext !== selectedIntimateContext) {
          return false;
        }
        if (selectedIntimateCategory !== 'all' && law.intimateCategory !== selectedIntimateCategory) {
          return false;
        }
        if (selectedIntimateTopic !== 'all' && law.intimateTopicName !== selectedIntimateTopic) {
          return false;
        }
        if (selectedDifficulty !== 'all' && law.difficulty !== selectedDifficulty) {
          return false;
        }
        return true;
      }

      if (curationMode === 'love_100_psychology') {
        if (!law.isLove100Psychology) return false;
        if (selectedLove100Pillar !== 'all' && law.love100Pillar !== selectedLove100Pillar) {
          return false;
        }
        if (selectedLove100Context !== 'all' && law.love100Context !== selectedLove100Context) {
          return false;
        }
        if (selectedLove100Category !== 'all' && law.love100Category !== selectedLove100Category) {
          return false;
        }
        if (selectedLove100Topic !== 'all' && law.love100TopicName !== selectedLove100Topic) {
          return false;
        }
        if (selectedDifficulty !== 'all' && law.difficulty !== selectedDifficulty) {
          return false;
        }
        return true;
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

      if (law.isLoveCodex || law.isReversePsychology || law.isCriminalPsychology || law.isSexualPsychology || law.isLove100Psychology || law.isIntimateRelationship) return false;
      const matchesCategory = selectedCategory === 'all' || law.categoryZh === selectedCategory;
      const matchesChapter = selectedChapter === 'all' || law.chapter === selectedChapter;
      return matchesCategory && matchesChapter;
    });

    if (sortMode === 'aleatoric') {
      return drawNonRepeatingLawOrder(
        subset,
        `library::${curationMode}::${selectedIntimatePillar}::${selectedIntimateContext}::${selectedIntimateCategory}::${selectedIntimateTopic}::${selectedLove100Pillar}::${selectedLove100Context}::${selectedLove100Category}::${selectedLove100Topic}::${selectedSexualPillar}::${selectedSexualContext}::${selectedSexualCategory}::${selectedSexualTopic}::${selectedDifficulty}::${selectedCriminalContext}::${selectedCriminalCategory}::${selectedCriminalTheory}::${selectedReverseScenario}::${selectedReverseCategory}::${selectedCategory}`,
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
    selectedIntimatePillar,
    selectedIntimateContext,
    selectedIntimateCategory,
    selectedIntimateTopic,
    selectedLove100Pillar,
    selectedLove100Context,
    selectedLove100Category,
    selectedLove100Topic,
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
        id: 'intimate_psychology',
        label: '亲密关系 100 律',
        group: '实战心理专题',
        count: INTIMATE_RELATIONSHIPS_LAWS.length,
        subtitle: '4 大板块 × 5 类别 × 5 情境',
        accentColor: '#BE123C',
        icon: <HeartHandshake className="w-3.5 h-3.5" />,
      },
      {
        id: 'love_100_psychology',
        label: '恋爱心理学 100 律',
        group: '实战心理专题',
        count: LOVE100_PSYCHOLOGY_LAWS.length,
        subtitle: '4 大板块 × 7 类别 × 5 情境',
        accentColor: '#E11D48',
        icon: <Heart className="w-3.5 h-3.5" />,
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

  // Continuous Web Speech Audio Queue Handler (听力库随听连播 — 同步触发银字高亮)
  const speakLawAt = (idx: number) => {
    if (idx < 0 || idx >= filteredLaws.length) {
      stopLawSpeech();
      setAudioPlayingIdx(null);
      return;
    }
    const targetLaw = filteredLaws[idx];
    const mechanismText = targetLaw.whyItHappens || targetLaw.detailedExplanation;
    const caseText = targetLaw.relationshipCase || targetLaw.realLifeExample;
    const speechSegments: LawSpeechSegment[] = [
      { key: 'title', text: targetLaw.nameZh, separator: '。' },
      { key: 'short', text: targetLaw.shortExplanation, separator: '。' },
    ];
    if (mechanismText) {
      speechSegments.push({ key: 'mechanism', text: mechanismText, separator: '。' });
    }
    if (caseText) {
      speechSegments.push({ key: 'case', text: caseText, separator: '。' });
    }
    if (targetLaw.keyTakeaway) {
      speechSegments.push({ key: 'takeaway', text: targetLaw.keyTakeaway, separator: '。' });
    }

    setAudioPlayingIdx(idx);
    startLawSpeech({
      lawId: targetLaw.id,
      segments: speechSegments,
      onComplete: () => {
        if (idx + 1 < filteredLaws.length) {
          speakLawAt(idx + 1);
        } else {
          setAudioPlayingIdx(null);
        }
      },
    });
  };

  const handleToggleGlobalListen = () => {
    gameAudio.playTap();
    if (audioPlayingIdx !== null) {
      stopLawSpeech();
      setAudioPlayingIdx(null);
    } else if (filteredLaws.length > 0) {
      speakLawAt(0);
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
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-gradient-to-br from-[#D4A656]/18 via-[#5B45B8]/22 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-20 w-80 h-80 rounded-full bg-gradient-to-tr from-[#3E2C8A]/25 via-[#157F5D]/14 to-transparent blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 sm:gap-8">
          <div className="space-y-3.5 max-w-2xl">
            {/* Museum Catalog Rubric */}
            <div className="flex items-center gap-2.5 text-xs font-mono">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4A656]/12 text-[#F3D89E] border border-[#D4A656]/35 font-semibold tracking-wider text-[11px] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
                <Palette className="w-3.5 h-3.5 text-[#E5C07B]" />
                <span>SALON DE PSYCHOLOGIE · 艺术典藏</span>
              </span>
              <span className="text-stone-500" aria-hidden="true">/</span>
              <span className="text-stone-300 font-serif-editorial italic font-sans">
                INT0101–INT2005 · LOVEPSY0101–LOVEPSY2005 · SEX0101–SEX2005 · CRIM001–CRIM{CRIMINAL_PSYCHOLOGY_LAWS.length} · REV0101–REV2005 · ML001–ML010 · LAW001–LAW142 · LOVE001–LOVE{LOVE_PSYCHOLOGY_LAWS.length}
              </span>
            </div>

            {/* High-Contrast Literary Headline */}
            <h1 className="font-serif-editorial text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-tight text-[#FAF8F5] drop-shadow-sm">
              MindLabZ 全景心理学定律与随听典藏馆
            </h1>

            {/* Editorial Dek */}
            <p className="text-xs sm:text-sm text-stone-300/90 font-normal leading-relaxed">
              全量收录 {INTIMATE_RELATIONSHIPS_LAWS.length} 条亲密关系心理学理论与应用卡（INT）、{LOVE100_PSYCHOLOGY_LAWS.length} 条恋爱心理学应用知识卡（LOVEPSY）、{SEXUAL_PSYCHOLOGY_LAWS.length} 条性心理学与亲密健康词条（SEX）、{CRIMINAL_PSYCHOLOGY_LAWS.length} 条犯罪心理学理论与应用卡（CRIM）、{REVERSE_PSYCHOLOGY_LAWS.length} 条逆向心理学与心理抗拒词条（REV）、{MICROEXPRESSION_LAWS.length} 条微表情实证定律（ML）、142 条经典心智规律及 {LOVE_PSYCHOLOGY_LAWS.length} 条爱情心理学词条，配备 CSPRNG 零重复洗牌与语音随听连播。
            </p>

            {/* Curatorial Index Stats */}
            <div className="pt-1.5 flex items-center gap-4 text-xs font-numeric text-stone-300 flex-wrap">
              <span className="flex items-center gap-1.5 bg-white/[0.06] border border-white/12 px-2.5 py-1 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-[#8B7BE0]" />
                <span>馆藏卷轴:</span>
                <strong className="text-[#FAF8F5] font-bold">{laws.length} 篇</strong>
              </span>
              <span className="flex items-center gap-1.5 bg-white/[0.06] border border-white/12 px-2.5 py-1 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-[#34A88B]" />
                <span>心智展厅:</span>
                <strong className="text-[#FAF8F5] font-bold">8 大领域</strong>
              </span>
              <span className="flex items-center gap-1.5 bg-white/[0.06] border border-white/12 px-2.5 py-1 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-[#E5C07B]" />
                <span>已内化掌握:</span>
                <strong className="text-[#F3D89E] font-bold">{(user?.lawsMastered || []).length} 项</strong>
              </span>
            </div>
          </div>

          {/* Right Action: Epiphany Random Discovery Medal */}
          <div className="shrink-0 flex flex-col sm:flex-row md:flex-col items-center gap-3">
            <button
              onClick={handleRandomEpiphany}
              className="group p-5 rounded-3xl bg-gradient-to-b from-white/[0.12] to-white/[0.03] backdrop-blur-md border border-[#D4A656]/35 hover:border-[#E5C07B]/75 flex flex-col items-center justify-center text-center space-y-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_16px_32px_-8px_rgba(0,0,0,0.45)] hover:scale-[1.03] active:scale-95 transition-all cursor-pointer w-full sm:w-auto"
              title="随机启迪：抽选一条心智艺术定律"
            >
              <div
                className="w-12 h-12 rounded-2xl text-[#181411] flex items-center justify-center group-hover:rotate-12 transition-transform"
                style={{
                  background: 'linear-gradient(135deg, #F2D794 0%, #D4A656 52%, #B8842E 100%)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.45), 0 8px 20px -4px rgba(212,166,86,0.42)',
                }}
              >
                <Shuffle className="w-6 h-6 stroke-[2.2]" />
              </div>
              <span className="text-[10px] text-[#E5C07B] font-mono tracking-widest uppercase">
                Random Epiphany
              </span>
              <span className="font-serif-editorial font-bold text-[#FAF8F5] text-sm flex items-center gap-1">
                <span>随机启迪</span>
                <Sparkles className="w-3.5 h-3.5 text-[#E5C07B]" />
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                gameAudio.playTap();
                navigate('/knowledge-graph');
              }}
              className="luxury-ghost-dark-btn px-4 py-2.5 rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap shrink-0 w-full sm:w-auto"
              title="以 D3 交互式力导向知识图谱探索 500 条心理学定律关联"
            >
              <Network className="w-4 h-4 text-[#E5C07B]" />
              <span>500 律知识图谱 (D3)</span>
            </button>
          </div>
        </div>
      </section>

      <CognitiveFocusAudioPlayer
        variant="compact"
        recommendedBinauralId="smr-14"
        taskContextLabel="定律精读与语音随听"
      />

      {/* Featured Hall Portal: 情感心理学 50 律典藏馆 */}
      <section className="relative rounded-2xl overflow-hidden art-salon-canvas p-5 sm:p-6 text-[#FAF8F5] border border-[#D4A656]/30 shadow-xl transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-[#D4A656]/15 text-[#F3D89E] border border-[#D4A656]/35 text-[10px] font-mono font-semibold tracking-wider uppercase">
                NEW · 深度特展
              </span>
              <span className="text-stone-400 text-xs font-serif italic">
                Salon d'Émotion
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-[#FAF8F5] font-serif tracking-tight">
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
            className="shrink-0 px-4 py-2.5 rounded-xl text-[#181411] font-bold text-xs hover:brightness-105 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, #F2D794 0%, #D4A656 52%, #B8842E 100%)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.45), 0 8px 20px -5px rgba(212,166,86,0.42)',
            }}
          >
            <span>进入 50 律典藏馆</span>
            <ArrowRight className="w-4 h-4 text-[#181411]" />
          </button>
        </div>
      </section>

      {/* Dedicated Showcase Box: 性心理学与亲密健康 100 律 · 4 大分类栏框 */}
      <section className="rounded-3xl bg-gradient-to-br from-[#1C1229] via-[#17132B] to-[#111524] p-5 sm:p-6 text-[#FAF8F5] border border-[#7C5AC2]/30 shadow-lg space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-purple-200">
              <HeartHandshake className="w-3.5 h-3.5 text-[#C0A6EB] shrink-0" />
              <span className="font-bold text-[#D9C7F5]">SEX0101–SEX2005</span>
              <span className="text-stone-500" aria-hidden="true">·</span>
              <span className="text-[#E5C07B] tabular-nums">4 大主题板块 · 5 大应用场景 · 100 律</span>
            </div>
            <h3 className="font-serif-editorial text-lg sm:text-xl font-bold text-[#FAF8F5] tracking-tight">
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
              className="luxury-surface-btn px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
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
              className="px-4 py-2.5 rounded-xl text-[#FAF8F5] text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 transition-all hover:brightness-110 active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #6D3EC4 0%, #522CA0 100%)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.28), 0 6px 16px -4px rgba(109,62,196,0.45)',
              }}
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

      {/* Dedicated Showcase Box: 恋爱心理学 100 律 · 4 大关系板块栏框 */}
      <section className="rounded-3xl bg-gradient-to-br from-[#2B0C1C] via-[#261129] to-[#111827] p-5 sm:p-6 text-white border border-rose-400/30 shadow-lg space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-rose-200">
              <Heart className="w-3.5 h-3.5 text-rose-300 fill-rose-400/50 shrink-0" />
              <span className="font-bold text-rose-200">LOVEPSY0101–LOVEPSY2005</span>
              <span className="text-stone-500" aria-hidden="true">·</span>
              <span className="text-amber-300 tabular-nums">4 大关系板块 · 7 大知识类别 · 5 大相处情境 · 100 律</span>
            </div>
            <h3 className="font-serif-editorial text-lg sm:text-xl font-bold text-white tracking-tight">
              恋爱心理学与亲密关系 · 100 律结构化专馆
            </h3>
            <p className="text-xs text-stone-300 leading-relaxed">
              将 20 个恋爱心理学核心概念系统映射到「自我认识、恋爱初期、稳定关系、冲突情境、关系复盘」五大情境，清晰归档于 4 大关系板块，支持随听研读与竞技场真随机实战直连。
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                gameAudio.playTap();
                setCurationMode('love_100_psychology');
                setSelectedLove100Pillar('all');
                setSelectedLove100Category('all');
                setSelectedLove100Topic('all');
                setVisibleLimit(24);
                setTimeout(() => {
                  document.getElementById('love100-organizer')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 80);
              }}
              className="luxury-surface-btn px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>展开 100 卡分类总栏</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => {
                gameAudio.playSuccess();
                navigate('/game/love100-aleatoric-arena');
              }}
              className="px-4 py-2.5 rounded-xl text-[#FAF8F5] text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 transition-all hover:brightness-110 active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #A82442 0%, #861B33 100%)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.28), 0 6px 16px -4px rgba(168,36,66,0.45)',
              }}
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>竞技场真随机博弈</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
          {LOVE100_PILLARS.map((pillar, idx) => {
            const isActivePillar =
              curationMode === 'love_100_psychology' && selectedLove100Pillar === pillar.id;
            return (
              <button
                key={pillar.id}
                type="button"
                onClick={() => {
                  gameAudio.playSelect();
                  setCurationMode('love_100_psychology');
                  setSelectedLove100Pillar(pillar.id);
                  setSelectedLove100Category('all');
                  setSelectedLove100Topic('all');
                  setVisibleLimit(24);
                  setTimeout(() => {
                    document.getElementById('love100-organizer')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }, 80);
                }}
                className={`text-left rounded-2xl p-3.5 border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                  isActivePillar
                    ? 'bg-white/15 border-amber-300/70'
                    : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-rose-300/50'
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-rose-200 tabular-nums">
                  <span>0{idx + 1} · {pillar.count} 卡</span>
                  <ArrowRight className="w-3.5 h-3.5 text-rose-300" />
                </div>
                <div className="text-xs sm:text-sm font-bold text-white leading-snug">
                  {pillar.label}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Dedicated Showcase Box: 亲密关系心理学 100 律 · 4 大关系板块栏框 */}
      <section className="rounded-3xl bg-gradient-to-br from-[#2B0C18] via-[#22162E] to-[#111827] p-5 sm:p-6 text-white border border-rose-400/30 shadow-lg space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-rose-200">
              <HeartHandshake className="w-3.5 h-3.5 text-rose-300 shrink-0" />
              <span className="font-bold text-rose-200">INT0101–INT2005</span>
              <span className="text-stone-500" aria-hidden="true">·</span>
              <span className="text-amber-300 tabular-nums">4 大核心板块 · 5 大知识类别 · 5 大相处情境 · 100 律</span>
            </div>
            <h3 className="font-serif-editorial text-lg sm:text-xl font-bold text-white tracking-tight">
              亲密关系心理学 · 100 律安全联结与冲突修复专馆
            </h3>
            <p className="text-xs text-stone-300 leading-relaxed">
              系统归档依恋安全基地、情绪可及与共同调节、积极倾听与回应感知、温和开场与修复尝试等 20 章核心理论，并横跨「自我觉察、日常沟通、冲突情境、长期关系、关系复盘」五大实战维度。
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                gameAudio.playTap();
                setCurationMode('intimate_psychology');
                setSelectedIntimatePillar('all');
                setSelectedIntimateCategory('all');
                setSelectedIntimateTopic('all');
                setVisibleLimit(24);
                setTimeout(() => {
                  document.getElementById('intimate-organizer')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 80);
              }}
              className="px-4 py-2.5 rounded-xl bg-white text-stone-900 hover:bg-rose-50 text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 transition-colors"
            >
              <span>展开 100 卡分类总栏</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => {
                gameAudio.playSuccess();
                navigate('/game/intimate-aleatoric-arena');
              }}
              className="px-4 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 transition-colors"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>竞技场真随机实战</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
          {INTIMATE_PILLARS.map((pillar, idx) => {
            const isActivePillar =
              curationMode === 'intimate_psychology' && selectedIntimatePillar === pillar.id;
            return (
              <button
                key={pillar.id}
                type="button"
                onClick={() => {
                  gameAudio.playSelect();
                  setCurationMode('intimate_psychology');
                  setSelectedIntimatePillar(pillar.id);
                  setSelectedIntimateCategory('all');
                  setSelectedIntimateTopic('all');
                  setVisibleLimit(24);
                  setTimeout(() => {
                    document.getElementById('intimate-organizer')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }, 80);
                }}
                className={`text-left rounded-2xl p-3.5 border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                  isActivePillar
                    ? 'bg-white/15 border-amber-300/70'
                    : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-rose-300/50'
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-rose-200 tabular-nums">
                  <span>0{idx + 1} · {pillar.count} 卡</span>
                  <ArrowRight className="w-3.5 h-3.5 text-rose-300" />
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
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 sm:gap-3">
          <div className="relative flex-1 min-w-[220px] group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center text-[#8B8278] group-focus-within:text-[#A66C1E] transition-colors pointer-events-none">
              <Search className="w-5 h-5" />
            </div>

            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="搜索心理学定律编号、名称或关键词"
              placeholder="搜索编号（如 LAW001）、中英文定律名、心理学关键词..."
              className="w-full h-14 pl-12 pr-12 bg-white/95 backdrop-blur-xl border border-stone-200/90 hover:border-stone-300 focus:border-[#C8933B] focus:ring-4 focus:ring-[#D4A656]/15 rounded-2xl text-xs sm:text-sm font-medium text-[#181411] placeholder-[#8B8278] focus:outline-none transition-all shadow-xs"
            />

            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  gameAudio.playTap();
                  setSearchQuery('');
                }}
                aria-label="清空检索关键词"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-xl flex items-center justify-center text-[#6E675F] hover:text-[#181411] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B45B8]/45"
                title="清空检索"
              >
                <span className="w-6 h-6 rounded-full bg-[#EFECE5] hover:bg-stone-200 text-xs flex items-center justify-center">
                  ✕
                </span>
              </button>
            )}
          </div>

          {/* Voice Search Button */}
          <VoiceTranscribeButton
            onTranscript={(text) => {
              gameAudio.playSuccess();
              setSearchQuery(text);
            }}
            className="luxury-surface-btn h-14 px-4 sm:px-5 hover:border-[#D4A656]/60 text-[#2B2520] hover:text-[#8E5B13] rounded-2xl transition-all flex items-center gap-2 cursor-pointer font-bold text-xs shrink-0"
          />

          {/* View Mode Toggle: Grid vs Dossier + Knowledge Graph Portal */}
          <div className="flex items-center gap-2 shrink-0 ml-auto sm:ml-0">
            <div
              role="group"
              aria-label="定律展示视图切换"
              className="flex items-center p-1 bg-white/95 border border-stone-200/90 rounded-2xl shadow-2xs h-14"
            >
              <button
                type="button"
                onClick={() => {
                  gameAudio.playTap();
                  setViewMode('grid');
                }}
                aria-pressed={viewMode === 'grid'}
                aria-label="切换至艺术画廊展卡视图"
                className={`min-w-[44px] h-11 px-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B45B8]/45 ${
                  viewMode === 'grid'
                    ? 'luxury-dark-btn'
                    : 'text-[#8B8278] hover:text-[#181411]'
                }`}
                title="艺术画廊展卡视图"
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  gameAudio.playTap();
                  setViewMode('dossier');
                }}
                aria-pressed={viewMode === 'dossier'}
                aria-label="切换至策展卷宗速览列表"
                className={`min-w-[44px] h-11 px-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B45B8]/45 ${
                  viewMode === 'dossier'
                    ? 'luxury-dark-btn'
                    : 'text-[#8B8278] hover:text-[#181411]'
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
              aria-label="打开 D3.js 交互式心理定律知识图谱"
              className="luxury-dark-btn h-14 px-4 rounded-2xl flex items-center gap-2 cursor-pointer font-semibold text-xs whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A656]"
              title="打开 D3.js 交互式心理定律知识图谱"
            >
              <Network className="w-4 h-4 text-[#E6B85C]" />
              <span className="hidden md:inline">知识图谱</span>
            </button>
          </div>
        </div>

        {/* Hot Query Swatches: Colored Chromatic Badges */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 text-xs text-[#6E675F]">
          <span className="text-[11px] font-bold text-[#8B8278] shrink-0 font-serif-editorial flex items-center gap-1 mr-1">
            <Flame className="w-3.5 h-3.5 text-[#C8933B] fill-[#D4A656]" />
            <span>研习焦点:</span>
          </span>
          {POPULAR_SEARCH_TAGS.map((tag) => (
            <button
              type="button"
              key={tag.text}
              onClick={() => handleTagClick(tag.text)}
              className="luxury-surface-btn min-h-[36px] px-3 py-1.5 rounded-xl text-[#2B2520] hover:text-[#181411] text-[11px] font-medium shrink-0 cursor-pointer flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B45B8]/40"
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
          <div className="art-museum-mat rounded-2xl p-3.5 sm:p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleReshuffle}
                aria-pressed={sortMode === 'aleatoric'}
                className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F766E]/45 ${
                  sortMode === 'aleatoric'
                    ? 'bg-[#0F766E] hover:bg-[#0D625B] text-white border border-[#0F766E] shadow-xs'
                    : 'luxury-surface-btn text-[#2B2520]'
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
                className="luxury-surface-btn min-h-[40px] px-3 py-2 rounded-xl text-xs font-semibold text-[#2B2520] cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B45B8]/40"
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
                  className="luxury-surface-btn min-h-[40px] px-3 py-2 rounded-xl text-[11px] font-medium text-[#57514A] hover:text-[#181411] cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B45B8]/40"
                  title="清空跨会话已浏览顺序记录并彻底重洗全库"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>重置全库洗牌盒</span>
                </button>
              )}
            </div>

            {/* Web Speech Continuous Audio Listening Bar */}
            <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-stone-200/70">
              <button
                type="button"
                onClick={handleToggleGlobalListen}
                aria-pressed={audioPlayingIdx !== null}
                className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A656] ${
                  audioPlayingIdx !== null
                    ? 'bg-[#B06014] hover:bg-[#96500E] text-white border border-[#B06014] shadow-xs'
                    : 'luxury-dark-btn'
                }`}
              >
                {audioPlayingIdx !== null ? (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    <span>暂停随听 ({audioPlayingIdx + 1}/{filteredLaws.length})</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-[#E6B85C]" />
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
                    speakLawAt(nextIdx);
                  }}
                  className="luxury-surface-btn min-h-[40px] px-3 py-2 rounded-xl text-[#181411] text-xs font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B45B8]/40"
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
                  updateSpeechPrefs({ rate: nextRate });
                }}
                aria-label="随听朗读语速 (0.5x 至 2.0x)"
                className="luxury-surface-btn min-h-[40px] px-3 py-2 rounded-xl text-xs font-mono font-bold text-[#181411] cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B45B8]/40"
              >
                <option value={0.5}>0.50× 慢听</option>
                <option value={0.75}>0.75× 精读</option>
                <option value={0.9}>0.90× 舒缓</option>
                <option value={1.0}>1.00× 常速</option>
                <option value={1.25}>1.25× 快听</option>
                <option value={1.5}>1.50× 速览</option>
                <option value={1.75}>1.75× 高速</option>
                <option value={2.0}>2.00× 极速</option>
              </select>
            </div>
          </div>

          {audioPlayingIdx !== null && filteredLaws[audioPlayingIdx] && (
            <div
              role="status"
              className="rounded-xl px-4 py-2.5 bg-[#FAF6EC] border border-[#D4A656]/45 flex items-center justify-between gap-3 text-xs"
            >
              <div className="min-w-0 flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-[#A66C1E] shrink-0" />
                <span className="luxury-badge-ink font-mono font-bold text-[#8E5B13] shrink-0">
                  {filteredLaws[audioPlayingIdx].codeId}
                </span>
                <span className="font-bold text-[#181411] truncate">
                  正在随听：{filteredLaws[audioPlayingIdx].nameZh}
                </span>
              </div>
              <button
                type="button"
                onClick={() => navigate(`/law/${filteredLaws[audioPlayingIdx].id}`)}
                className="min-h-[36px] px-2 text-xs font-bold text-[#8E5B13] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
              >
                进入图文解析 →
              </button>
            </div>
          )}
        </div>

        {/* 3. Category Controls depending on active Taxonomy Mode */}
        {curationMode === 'intimate_psychology' ? (
          <div id="intimate-organizer">
            <IntimatePsychologyOrganizer
              lawsMasteryMap={user.lawMasteryMap}
              selectedPillar={selectedIntimatePillar}
              selectedContext={selectedIntimateContext}
              selectedCategory={selectedIntimateCategory}
              selectedTopic={selectedIntimateTopic}
              selectedDifficulty={selectedDifficulty}
              matchedCount={filteredLaws.length}
              onSelectPillar={(pillarId) => {
                setSelectedIntimatePillar(pillarId);
                setSelectedIntimateCategory('all');
                setSelectedIntimateTopic('all');
                setVisibleLimit(24);
              }}
              onSelectContext={(contextId) => {
                setSelectedIntimateContext(contextId);
                setVisibleLimit(24);
              }}
              onSelectCategory={(catId) => {
                setSelectedIntimateCategory(catId);
                setSelectedIntimateTopic('all');
                setVisibleLimit(24);
              }}
              onSelectTopic={(topicId) => {
                setSelectedIntimateTopic(topicId);
                setVisibleLimit(24);
              }}
              onSelectDifficulty={(diff) => {
                setSelectedDifficulty(diff);
                setVisibleLimit(24);
              }}
              onResetFilters={() => {
                setSelectedIntimatePillar('all');
                setSelectedIntimateContext('all');
                setSelectedIntimateCategory('all');
                setSelectedIntimateTopic('all');
                setSelectedDifficulty('all');
                setVisibleLimit(24);
              }}
              onLaunchArena={() => {
                const params = new URLSearchParams();
                if (selectedIntimatePillar !== 'all') params.set('pillar', selectedIntimatePillar);
                if (selectedIntimateContext !== 'all') params.set('context', selectedIntimateContext);
                if (selectedIntimateCategory !== 'all') params.set('category', selectedIntimateCategory);
                const arenaDiff =
                  selectedDifficulty === 'Easy'
                    ? '低'
                    : selectedDifficulty === 'Medium'
                    ? '中'
                    : selectedDifficulty === 'Hard'
                    ? '高'
                    : '中';
                params.set('difficulty', arenaDiff);
                navigate(`/game/intimate-aleatoric-arena?${params.toString()}`);
              }}
            />
          </div>
        ) : curationMode === 'love_100_psychology' ? (
          <div id="love100-organizer">
            <Love100PsychologyOrganizer
              lawsMasteryMap={user.lawMasteryMap}
              selectedPillar={selectedLove100Pillar}
              selectedContext={selectedLove100Context}
              selectedCategory={selectedLove100Category}
              selectedTopic={selectedLove100Topic}
              selectedDifficulty={selectedDifficulty}
              matchedCount={filteredLaws.length}
              onSelectPillar={(pillarId) => {
                setSelectedLove100Pillar(pillarId);
                setSelectedLove100Category('all');
                setSelectedLove100Topic('all');
                setVisibleLimit(24);
              }}
              onSelectContext={(contextId) => {
                setSelectedLove100Context(contextId);
                setVisibleLimit(24);
              }}
              onSelectCategory={(catId) => {
                setSelectedLove100Category(catId);
                setSelectedLove100Topic('all');
                setVisibleLimit(24);
              }}
              onSelectTopic={(topicId) => {
                setSelectedLove100Topic(topicId);
                setVisibleLimit(24);
              }}
              onSelectDifficulty={(diff) => {
                setSelectedDifficulty(diff);
                setVisibleLimit(24);
              }}
              onResetFilters={() => {
                setSelectedLove100Pillar('all');
                setSelectedLove100Context('all');
                setSelectedLove100Category('all');
                setSelectedLove100Topic('all');
                setSelectedDifficulty('all');
                setVisibleLimit(24);
              }}
              onLaunchArena={() => {
                const params = new URLSearchParams();
                if (selectedLove100Pillar !== 'all') params.set('pillar', selectedLove100Pillar);
                if (selectedLove100Context !== 'all') params.set('context', selectedLove100Context);
                if (selectedLove100Category !== 'all') params.set('category', selectedLove100Category);
                const arenaDiff =
                  selectedDifficulty === 'Easy'
                    ? '低'
                    : selectedDifficulty === 'Medium'
                    ? '中'
                    : selectedDifficulty === 'Hard'
                    ? '高'
                    : '中';
                params.set('difficulty', arenaDiff);
                navigate(`/game/love100-aleatoric-arena?${params.toString()}`);
              }}
            />
          </div>
        ) : curationMode === 'sexual_psychology' ? (
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
                    ? 'text-[#181411] shadow-md'
                    : 'luxury-surface-btn'
                }`}
                style={
                  onlyBookmarked
                    ? {
                        background: 'linear-gradient(135deg, #F0D28E 0%, #C8933B 100%)',
                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.45), 0 6px 16px -4px rgba(212,166,86,0.42)',
                      }
                    : undefined
                }
              >
                <Bookmark className={`w-3.5 h-3.5 ${onlyBookmarked ? 'fill-[#181411] text-[#181411]' : 'text-[#6E675F]'}`} />
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
                    ? 'text-[#181411] shadow-md'
                    : 'luxury-surface-btn'
                }`}
                style={
                  onlyBookmarked
                    ? {
                        background: 'linear-gradient(135deg, #F0D28E 0%, #C8933B 100%)',
                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.45), 0 6px 16px -4px rgba(212,166,86,0.42)',
                      }
                    : undefined
                }
              >
                <Bookmark className={`w-3.5 h-3.5 ${onlyBookmarked ? 'fill-[#181411] text-[#181411]' : 'text-[#6E675F]'}`} />
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
                    ? 'text-[#181411] shadow-md'
                    : 'luxury-surface-btn'
                }`}
                style={
                  onlyBookmarked
                    ? {
                        background: 'linear-gradient(135deg, #F0D28E 0%, #C8933B 100%)',
                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.45), 0 6px 16px -4px rgba(212,166,86,0.42)',
                      }
                    : undefined
                }
              >
                <Bookmark className={`w-3.5 h-3.5 ${onlyBookmarked ? 'fill-[#181411] text-[#181411]' : 'text-[#6E675F]'}`} />
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

        {((curationMode === 'intimate_psychology'
          ? selectedIntimatePillar !== 'all' ||
            selectedIntimateContext !== 'all' ||
            selectedIntimateCategory !== 'all' ||
            selectedIntimateTopic !== 'all' ||
            selectedDifficulty !== 'all'
          : curationMode === 'love_100_psychology'
          ? selectedLove100Pillar !== 'all' ||
            selectedLove100Context !== 'all' ||
            selectedLove100Category !== 'all' ||
            selectedLove100Topic !== 'all' ||
            selectedDifficulty !== 'all'
          : curationMode === 'sexual_psychology'
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
              setSelectedIntimatePillar('all');
              setSelectedIntimateContext('all');
              setSelectedIntimateCategory('all');
              setSelectedIntimateTopic('all');
              setSelectedLove100Pillar('all');
              setSelectedLove100Context('all');
              setSelectedLove100Category('all');
              setSelectedLove100Topic('all');
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
                    type="button"
                    onClick={() => {
                      gameAudio.playTap();
                      setVisibleLimit((prev) => prev + 24);
                    }}
                    className="luxury-dark-btn min-h-[44px] px-6 py-2.5 rounded-xl text-xs font-bold cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A656]"
                  >
                    加载更多（已显示 {visibleLaws.length} / {filteredLaws.length} 条）
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      gameAudio.playTap();
                      setVisibleLimit(filteredLaws.length);
                    }}
                    className="luxury-surface-btn min-h-[44px] px-5 py-2.5 rounded-xl text-[#2B2520] text-xs font-semibold cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B45B8]/40"
                  >
                    展开全部 {filteredLaws.length} 条
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="col-span-full art-museum-mat rounded-3xl p-10 sm:p-12 text-center border-2 border-dashed border-stone-200 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-[#FAF4E6] border border-[#D4A656]/35 flex items-center justify-center mx-auto text-[#8E5B13]">
                <Search className="w-7 h-7" />
              </div>
              <h3 className="font-serif-editorial text-lg font-bold text-[#181411]">
                在当前展厅未检索到匹配的定律
              </h3>
              <p className="text-xs text-[#6E675F] max-w-sm mx-auto leading-relaxed">
                建议尝试更换中英文关键词、编号（如 LOVE001 或 LAW001）或切换至“全部分类”继续探索。
              </p>
              <button
                type="button"
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
                className="luxury-dark-btn min-h-[44px] px-6 py-2.5 text-xs font-bold rounded-xl cursor-pointer inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A656]"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>重置筛选并显示全部典藏</span>
              </button>
            </div>
          )}
        </CylinderScrollList>
      ) : (
        /* Dossier List Mode: Sleek High-End Archival View */
        <CylinderScrollList className="space-y-3.5">
          {isLoading ? (
            <>
              <LawCardSkeleton />
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
                    <LearnDossierLawRow
                      law={law}
                      mastery={mastery}
                      isMastered={isMastered}
                      onOpen={() => {
                        gameAudio.playTap();
                        navigate(`/law/${law.id}`);
                      }}
                    />
                  </CylinderScrollItem>
                );
              })}
              {filteredLaws.length > visibleLaws.length && (
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      gameAudio.playTap();
                      setVisibleLimit((prev) => prev + 36);
                    }}
                    className="luxury-dark-btn min-h-[44px] px-6 py-2.5 rounded-xl text-xs font-bold cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A656]"
                  >
                    加载更多（已显示 {visibleLaws.length} / {filteredLaws.length} 条）
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      gameAudio.playTap();
                      setVisibleLimit(filteredLaws.length);
                    }}
                    className="luxury-surface-btn min-h-[44px] px-5 py-2.5 rounded-xl text-[#2B2520] text-xs font-semibold cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B45B8]/40"
                  >
                    展开全部 {filteredLaws.length} 条
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="art-museum-mat rounded-3xl p-10 text-center border-2 border-dashed border-stone-200 space-y-3">
              <p className="font-serif-editorial text-base font-bold text-[#181411]">未检索到匹配卷宗</p>
              <p className="text-xs text-[#6E675F]">请调整关键词或重置展厅筛选条件。</p>
              <button
                type="button"
                onClick={() => {
                  gameAudio.playTap();
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedChapter('all');
                  setOnlyBookmarked(false);
                }}
                className="luxury-dark-btn min-h-[44px] px-5 py-2 rounded-xl text-xs font-bold cursor-pointer inline-flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>重置筛选</span>
              </button>
            </div>
          )}
        </CylinderScrollList>
      )}

      {/* 7. Epiphany Modal (Random Inspirational Discovery Dialog) */}
      {epiphanyLaw && (
        <EpiphanyLawModal
          epiphanyLaw={epiphanyLaw}
          onClose={() => {
            stopLawSpeech(epiphanyLaw.id);
            setEpiphanyLaw(null);
          }}
          onNext={handleRandomEpiphany}
          onNavigate={(id) => {
            stopLawSpeech(id);
            setEpiphanyLaw(null);
            navigate(`/law/${id}`);
          }}
        />
      )}

      <FloatingFontScaleControl tone="paper" title="定律库字号调节" />
    </div>
  );
};

const DOSSIER_DOMAIN_COLOR: Record<CategoryZh, string> = {
  '认知': '#4F46B8',
  '记忆': '#0F766E',
  '决策': '#157F5D',
  '社会': '#6D3EC4',
  '情绪': '#A82442',
  '行为': '#B06014',
};

const LearnDossierLawRow: React.FC<{
  law: PsychologyLaw;
  mastery: number;
  isMastered: boolean;
  onOpen: () => void;
}> = ({ law, mastery, isMastered, onOpen }) => {
  const { isSpeakingThisLaw, activeCpIndex, segments } = useLawSpeech(law.id);
  const emotionalMeta = getLawEmotionalMapping(law);
  const accentColor = emotionalMeta
    ? emotionalMeta.themeColor
    : law.isLoveCodex || law.isLove100Psychology || law.isIntimateRelationship
    ? '#A82442'
    : law.isReversePsychology
    ? '#0F766E'
    : law.isCriminalPsychology
    ? '#961D38'
    : law.isSexualPsychology
    ? '#6D3EC4'
    : DOSSIER_DOMAIN_COLOR[law.categoryZh] || '#5B45B8';

  const collectionBadge = emotionalMeta
    ? `情感 50 律 · ${String(emotionalMeta.order).padStart(2, '0')}`
    : law.isLove100Psychology
    ? law.love100Category
    : law.isIntimateRelationship
    ? law.intimateCategory
    : law.isReversePsychology
    ? law.reverseCategory
    : law.isCriminalPsychology
    ? law.criminalCategory
    : law.isSexualPsychology
    ? law.sexualCategory
    : law.isMicroexpression
    ? `${law.categoryZh} #${law.categoryRank || 1}`
    : law.subTag;

  const handleToggleSpeech = () => {
    gameAudio.playTap();
    const speechSegments: LawSpeechSegment[] = [
      { key: 'title', text: law.nameZh, separator: '。' },
      { key: 'short', text: law.shortExplanation, separator: '。' },
    ];
    if (law.keyTakeaway) {
      speechSegments.push({ key: 'takeaway', text: law.keyTakeaway, separator: '。' });
    }
    toggleLawSpeech({
      lawId: law.id,
      segments: speechSegments,
    });
  };

  return (
    <article
      tabIndex={0}
      role="button"
      aria-label={`进入《${law.nameZh}》专著详情`}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('button')) return;
        onOpen();
      }}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen();
        }
      }}
      className="group art-museum-mat rounded-2xl p-4 sm:p-5 pl-5 sm:pl-6 relative overflow-hidden cursor-pointer flex flex-col gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B45B8]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F6F3EC]"
    >
      {/* Left Vertical Archival Collection Spline */}
      <div
        aria-hidden="true"
        className="absolute top-0 bottom-0 left-0 w-1 opacity-80 group-hover:opacity-100 transition-opacity"
        style={{ backgroundColor: accentColor }}
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5">
        <div className="flex items-start gap-3.5 min-w-0 flex-1">
          <div className="flex flex-col items-start gap-1.5 shrink-0 pt-0.5">
            <span className="luxury-badge-ink font-mono text-xs font-bold text-[#181411] tabular-nums">
              {law.codeId || 'LAW'}
            </span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded font-semibold border ${
                law.difficulty === 'Easy'
                  ? 'bg-[#157F5D]/8 text-[#157F5D] border-[#157F5D]/20'
                  : law.difficulty === 'Medium'
                  ? 'bg-[#A66C1E]/10 text-[#8E5B13] border-[#A66C1E]/25'
                  : 'bg-[#A82442]/8 text-[#961D38] border-[#A82442]/20'
              }`}
            >
              {law.difficulty}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2 flex-wrap">
              <h3 className="font-serif-editorial text-base sm:text-lg font-bold text-[#181411] group-hover:text-black transition-colors">
                <SilverSpeechText
                  text={law.nameZh}
                  isSpeaking={isSpeakingThisLaw}
                  activeCpIndex={activeCpIndex}
                  segmentRange={segments.title}
                />
              </h3>
              <span className="text-xs text-[#6E675F] font-serif-editorial italic truncate max-w-full">
                {law.nameEn}
              </span>
            </div>

            <p className={`text-xs sm:text-[13px] text-[#3B342D] mt-1.5 leading-relaxed ${isSpeakingThisLaw ? '' : 'line-clamp-2'}`}>
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
        </div>

        <div className="flex items-center flex-wrap gap-2 shrink-0 md:justify-end text-[11px] text-[#6E675F]">
          {collectionBadge && (
            <span
              className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md border"
              style={{
                color: accentColor,
                borderColor: `${accentColor}30`,
                backgroundColor: `${accentColor}0D`,
              }}
            >
              {collectionBadge}
            </span>
          )}
          {law.assignedCityZh && (
            <span className="luxury-badge-ink text-[10.5px] font-sans">
              {law.assignedCityZh.split(' ')[0]}
            </span>
          )}
          <span
            className="font-semibold flex items-center gap-1"
            style={{ color: DOSSIER_DOMAIN_COLOR[law.categoryZh] || '#181411' }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: DOSSIER_DOMAIN_COLOR[law.categoryZh] || '#181411' }}
            />
            {law.categoryZh}展厅
          </span>

          {isMastered && (
            <span className="text-[#157F5D] font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 fill-[#157F5D] text-white" />
              <span>已内化</span>
            </span>
          )}
        </div>
      </div>

      {/* Bottom Dossier Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2.5 border-t border-stone-200/65">
        <div className="flex items-center gap-2 text-[11px]">
          <span className="text-[#6E675F]">内化进度</span>
          <div className="w-16 sm:w-24 h-1.5 bg-[#EFECE5] border border-stone-200/70 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${mastery}%`,
                background: `linear-gradient(90deg, ${accentColor} 0%, #157F5D 100%)`,
              }}
            />
          </div>
          <span className="font-numeric font-bold text-[#2B2520]">{mastery}%</span>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <LawVoiceToggleSwitch
            isOn={isSpeakingThisLaw}
            onToggle={handleToggleSpeech}
            size="sm"
          />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
            }}
            className="luxury-surface-btn min-h-[36px] px-3 rounded-lg text-[11px] font-bold text-[#181411] inline-flex items-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B45B8]/40"
          >
            <span>进入专著</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#6E675F] group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </article>
  );
};

const EpiphanyLawModal: React.FC<{
  epiphanyLaw: PsychologyLaw;
  onClose: () => void;
  onNext: () => void;
  onNavigate: (id: string) => void;
}> = ({ epiphanyLaw, onClose, onNext, onNavigate }) => {
  const { isSpeakingThisLaw, activeCpIndex, segments } = useLawSpeech(epiphanyLaw.id);

  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleToggleSpeech = () => {
    gameAudio.playTap();
    toggleLawSpeech({
      lawId: epiphanyLaw.id,
      segments: [
        { key: 'title', text: epiphanyLaw.nameZh, separator: '。' },
        { key: 'short', text: epiphanyLaw.shortExplanation, separator: '。' },
        { key: 'detail', text: epiphanyLaw.detailedExplanation, separator: '。' },
      ],
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="epiphany-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0D0B16]/65 backdrop-blur-sm animate-fadeIn"
    >
      <div className="relative w-full max-w-lg rounded-3xl art-museum-mat border border-[#D4A656]/45 shadow-2xl p-6 sm:p-8 space-y-5 animate-stageEnter overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#B88635] via-[#E6B85C] to-[#5B45B8]" />

        <div className="flex items-center justify-between pb-3 border-b border-stone-200/80">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-[#FAF4E6] border border-[#D4A656]/35 text-[#8E5B13]">
              <Sparkles className="w-4 h-4" />
            </span>
            <span className="font-serif-editorial text-xs font-bold text-[#181411] tracking-wider uppercase">
              今日心智灵感 · 随机启迪
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭随机启迪弹窗"
            className="w-11 h-11 -mr-2 rounded-full flex items-center justify-center text-[#6E675F] hover:text-[#181411] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B45B8]/45"
          >
            <span className="luxury-surface-btn w-8 h-8 rounded-full flex items-center justify-center">
              <X className="w-4 h-4" />
            </span>
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="luxury-badge-ink font-mono font-bold text-[#181411]">
              {epiphanyLaw.codeId}
            </span>
            <span className="text-stone-300" aria-hidden="true">/</span>
            <span className="font-semibold text-[#8E5B13]">
              {epiphanyLaw.categoryZh}展厅
            </span>
          </div>

          <h3 id="epiphany-modal-title" className="font-serif-editorial text-2xl font-bold text-[#181411] leading-snug">
            <SilverSpeechText
              text={epiphanyLaw.nameZh}
              isSpeaking={isSpeakingThisLaw}
              activeCpIndex={activeCpIndex}
              segmentRange={segments.title}
            />
          </h3>
          <p className="text-xs text-[#6E675F] font-serif-editorial italic">
            {epiphanyLaw.nameEn}
          </p>

          <blockquote className="rounded-xl p-4 bg-[#FAF7F1] border border-stone-200/75 border-l-[3px] border-l-[#C8933B] font-serif-editorial text-xs sm:text-sm text-[#2B2520] leading-relaxed italic">
            “
            <SilverSpeechText
              text={epiphanyLaw.shortExplanation}
              isSpeaking={isSpeakingThisLaw}
              activeCpIndex={activeCpIndex}
              segmentRange={segments.short}
            />
            ”
          </blockquote>

          <p className={`text-xs text-[#4F4740] leading-relaxed ${isSpeakingThisLaw ? '' : 'line-clamp-3'}`}>
            <SilverSpeechText
              text={epiphanyLaw.detailedExplanation}
              isSpeaking={isSpeakingThisLaw}
              activeCpIndex={activeCpIndex}
              segmentRange={segments.detail}
            />
          </p>

          <div className="flex justify-end pt-1">
            <LawVoiceToggleSwitch
              isOn={isSpeakingThisLaw}
              onToggle={handleToggleSpeech}
              size="sm"
            />
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onNext}
            className="luxury-surface-btn min-h-[44px] px-4 py-2.5 rounded-xl text-[#2B2520] text-xs font-bold cursor-pointer flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B45B8]/40"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>换一条启迪</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate(epiphanyLaw.id)}
            className="luxury-dark-btn flex-1 min-h-[44px] px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A656]"
          >
            <span>进入深度解析</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

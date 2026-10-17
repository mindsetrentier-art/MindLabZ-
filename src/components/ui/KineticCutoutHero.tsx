import React, { useState, useEffect, useRef, useId, useMemo, useCallback } from 'react';
import {
  Sparkles,
  Upload,
  RotateCcw,
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  Palette,
  Eye,
  Type,
  Layout,
  AlignLeft,
  AlignCenter,
  Wand2,
  Sliders,
  Move,
  Layers,
  Image as ImageIcon,
  Headphones,
} from 'lucide-react';
import { gameAudio } from '../../utils/gameAudio';
import { ambientSound } from '../../utils/ambientSoundEngine';
import { AmbientSoundscapeControl } from './AmbientSoundscapeControl';

export interface MasterpieceCanvas {
  id: string;
  title: string;
  artist: string;
  era: string;
  description: string;
  url: string;
  accentColor: string;
}

export const MASTERPIECE_CANVASES: MasterpieceCanvas[] = [
  {
    id: 'cosmic-synapse',
    title: '星夜冥思 · 宇宙神经湍流',
    artist: '文森特·梵高 & 现代天文望远镜',
    era: '后印象派 / 宇宙深空',
    description: '深邃紫晶与旋涡星系，如同大脑神经突触在思维瞬间迸发的电信号。',
    url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1600&q=85',
    accentColor: '#818CF8',
  },
  {
    id: 'impression-monet',
    title: '睡莲流光 · 晨曦意识之池',
    artist: '克劳德·莫奈 精神回响',
    era: '印象主义 / 自然诗篇',
    description: '光斑流泻在水面与静谧林间，隐喻心理学中潜意识涌动的感知微澜。',
    url: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1600&q=85',
    accentColor: '#34D399',
  },
  {
    id: 'great-wave',
    title: '神奈川冲浪里 · 峰终心潮',
    artist: '葛饰北斋 (Hokusai)',
    era: '浮世绘 / 东方美学',
    description: '狂暴巨浪与静穆富士山形成绝妙对峙，象征认知理性驾驭惊涛骇浪。',
    url: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?auto=format&fit=crop&w=1600&q=85',
    accentColor: '#38BDF8',
  },
  {
    id: 'vitruvian-pantheon',
    title: '神殿穹顶 · 达芬奇理性黄金律',
    artist: '列奥纳多·达芬奇 & 古典万神殿',
    era: '文艺复兴 / 理性启蒙',
    description: '罗马穹顶透下的一束神圣光柱，象征有限理性在探求终极秩序的秩序美感。',
    url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1600&q=85',
    accentColor: '#F59E0B',
  },
  {
    id: 'alpine-thinker',
    title: '巅峰俯瞰 · 思想者的沉思',
    artist: '阿尔卑斯暮霭 & 哲人冥想',
    era: '浪漫主义 / 崇高美学',
    description: '暮色下陡峭的雪山巨岩，喻示心理学先驱站在认知之巅凝视心灵深渊。',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=85',
    accentColor: '#F43F5E',
  },
  {
    id: 'neural-network',
    title: '脑机晶曜 · 突触电光脉冲',
    artist: '当代生物计算艺术',
    era: '前沿认知科学 / 赛博美学',
    description: '亿万神经纤维流转着淡金与极光蓝的荧光，记录每一次理性决策的诞生。',
    url: 'https://images.unsplash.com/photo-1507499739999-097706ad8914?auto=format&fit=crop&w=1600&q=85',
    accentColor: '#A855F7',
  },
];

export type HeroFontStyle =
  | 'playfair'
  | 'cinzel'
  | 'cinzel-dec'
  | 'cormorant'
  | 'noto-serif'
  | 'mashan'
  | 'zhimang'
  | 'xiaowei'
  | 'kaiti'
  | 'longcang'
  | 'impact'
  | 'bebas'
  | 'noto-sans'
  | 'montserrat'
  | 'syne'
  | 'mono'
  | string;

export type HeroLayoutAlignment = 'center' | 'left' | 'staggered' | 'compact';
export type HeroFocalAlignment = 'center' | 'top' | 'bottom';
export type HeroFontCategory = 'all' | 'serif' | 'calligraphy' | 'poster' | 'geometric' | 'avantgarde';

export interface HeroDiyConfig {
  mainTitle: string;
  subtitle: string;
  tagline: string;
  fontStyle: HeroFontStyle;
  layoutAlignment: HeroLayoutAlignment;
  focalAlignment: HeroFocalAlignment;
  imageUrl: string;
  presetId: string;
  customUploaded: boolean;
}

export interface FontOption {
  id: string;
  name: string;
  category: 'serif' | 'calligraphy' | 'poster' | 'geometric' | 'avantgarde';
  categoryLabel: string;
  sub: string;
  family: string;
  weight: number | string;
  letterSpacing: number;
  previewText: string;
  description: string;
}

export const FONT_OPTIONS: FontOption[] = [
  // 1. 经典衬线体与人文典籍
  {
    id: 'playfair',
    name: '古典宋体 · 沉思典藏',
    category: 'serif',
    categoryLabel: '经典衬线',
    sub: 'Classical Editorial Serif',
    family: "'Playfair Display', 'Noto Serif SC', 'Songti SC', Georgia, serif",
    weight: 900,
    letterSpacing: 6,
    previewText: '雅致沉思',
    description: '融合宋代刻本风骨与欧洲文艺复兴刊刻美学，端庄崇高。',
  },
  {
    id: 'cinzel',
    name: '威尼斯古白 · 帝国碑铭',
    category: 'serif',
    categoryLabel: '经典衬线',
    sub: 'Venetian Imperial Antiqua',
    family: "'Cinzel', 'Playfair Display', serif",
    weight: 900,
    letterSpacing: 8,
    previewText: 'IMPERIAL',
    description: '源于古罗马图拉真凯旋柱雕刻碑铭，自带庄严神圣光环。',
  },
  {
    id: 'cinzel-dec',
    name: '皇家花体 · 鎏金纹饰',
    category: 'serif',
    categoryLabel: '经典衬线',
    sub: 'Cinzel Decorative Floral',
    family: "'Cinzel Decorative', 'Cinzel', serif",
    weight: 900,
    letterSpacing: 6,
    previewText: 'ROYALTY',
    description: '带有宫廷羽翼与藤蔓旋涡装饰的古典花体，极度华丽典雅。',
  },
  {
    id: 'cormorant',
    name: '巴黎文艺 · 诗学加拉蒙',
    category: 'serif',
    categoryLabel: '经典衬线',
    sub: 'Cormorant Garamond Classical',
    family: "'Cormorant Garamond', 'Playfair Display', 'Songti SC', serif",
    weight: 700,
    letterSpacing: 6,
    previewText: 'RENAISSANCE',
    description: '源于16世纪法国加拉蒙印书名体，线条纤秀灵动，极具法国文学沙龙韵致。',
  },
  {
    id: 'noto-serif',
    name: '思源宋体 · 文人正风',
    category: 'serif',
    categoryLabel: '经典衬线',
    sub: 'Heritage Songti Scholar',
    family: "'Noto Serif SC', 'Songti SC', serif",
    weight: 900,
    letterSpacing: 6,
    previewText: '格物致知',
    description: '纯正传统东方文人案头字风，横轻竖重，笔力劲道透纸。',
  },

  // 2. 东方意境与名家书法体
  {
    id: 'mashan',
    name: '行云草楷 · 泼墨淋漓',
    category: 'calligraphy',
    categoryLabel: '东方书法',
    sub: 'Ma Shan Zheng Dynamic Brush',
    family: "'Ma Shan Zheng', 'STKaiti', cursive, serif",
    weight: 700,
    letterSpacing: 8,
    previewText: '气吞山河',
    description: '苍劲雄健的毛笔大草楷书，墨韵挥洒，从字形中透射出山川磅礴气魄。',
  },
  {
    id: 'zhimang',
    name: '洒脱行书 · 文人意绪',
    category: 'calligraphy',
    categoryLabel: '东方书法',
    sub: 'Zhi Mang Xing Cursive',
    family: "'Zhi Mang Xing', 'Kaiti SC', cursive, serif",
    weight: 400,
    letterSpacing: 6,
    previewText: '行云流水',
    description: '飘逸灵动、如风拂拂的书法行草，呈现内敛深邃的心智流动。',
  },
  {
    id: 'longcang',
    name: '狂草写意 · 孤鹜落霞',
    category: 'calligraphy',
    categoryLabel: '东方书法',
    sub: 'Long Cang Wild Cursive',
    family: "'Long Cang', 'Ma Shan Zheng', 'STKaiti', cursive, serif",
    weight: 400,
    letterSpacing: 8,
    previewText: '天地玄黄',
    description: '挥斥方遒的狂草写意之作，笔断意连，透光如山川灵气倾泻。',
  },
  {
    id: 'xiaowei',
    name: '金石隶意 · 古朴摩崖',
    category: 'calligraphy',
    categoryLabel: '东方书法',
    sub: 'XiaoWei Archaic Bronze',
    family: "'ZCOOL XiaoWei', 'Noto Serif SC', serif",
    weight: 400,
    letterSpacing: 8,
    previewText: '静虚观复',
    description: '兼具汉碑汉隶遗风与当代写意的古朴字体，端严而静穆。',
  },
  {
    id: 'kaiti',
    name: '钟王正楷 · 澄明至纯',
    category: 'calligraphy',
    categoryLabel: '东方书法',
    sub: 'Classical Orthodox Kaiti',
    family: "'STKaiti', 'Kaiti SC', serif",
    weight: 700,
    letterSpacing: 8,
    previewText: '明心见性',
    description: '正大气象的传统中正楷书，宁静致远，骨力清峻。',
  },

  // 3. 巨幅力量与现代海报黑体
  {
    id: 'impact',
    name: '巨幕超黑 · 极强透光',
    category: 'poster',
    categoryLabel: '现代海报',
    sub: 'Ultra Heavy Monumental',
    family: "'Impact', 'Plus Jakarta Sans', -apple-system, sans-serif",
    weight: 900,
    letterSpacing: 4,
    previewText: 'BOLD FORCE',
    description: '笔画极粗且笔触极宽，底图穿透面积达最大化，视觉张力极强。',
  },
  {
    id: 'bebas',
    name: '先锋高挑 · 艺术双年展',
    category: 'poster',
    categoryLabel: '现代海报',
    sub: 'Bebas Neue Display Sans',
    family: "'Bebas Neue', 'Plus Jakarta Sans', sans-serif",
    weight: 900,
    letterSpacing: 8,
    previewText: 'AVANT-GARDE',
    description: '高耸挺拔的现代主义压缩大字海报，充满建筑结构雕塑感。',
  },
  {
    id: 'noto-sans',
    name: '思源极黑 · 当代美术馆',
    category: 'poster',
    categoryLabel: '现代海报',
    sub: 'Noto Sans Contemporary Black',
    family: "'Noto Sans SC', sans-serif",
    weight: 900,
    letterSpacing: 5,
    previewText: '理性重构',
    description: '当代美术馆视觉导视专属极黑体，纯粹理性，锋芒毕露。',
  },

  // 4. 包豪斯与前卫未来流派
  {
    id: 'montserrat',
    name: '包豪斯极简 · 黄金圆弧',
    category: 'geometric',
    categoryLabel: '几何前卫',
    sub: 'Bauhaus Pure Geometric',
    family: "'Montserrat', 'Plus Jakarta Sans', sans-serif",
    weight: 900,
    letterSpacing: 8,
    previewText: 'GEOMETRY',
    description: '纯粹几何圆形与直角构成的现代主义旗帜，干净利落。',
  },
  {
    id: 'syne',
    name: '达利解构 · 先锋雕塑体',
    category: 'avantgarde',
    categoryLabel: '几何前卫',
    sub: 'Syne Sculptural Display',
    family: "'Syne', 'Montserrat', sans-serif",
    weight: 800,
    letterSpacing: 6,
    previewText: 'SCULPTURE',
    description: '带有超现实解构切角的巴黎先锋字体，专为高级艺术期刊打造。',
  },
  {
    id: 'mono',
    name: '赛博等宽 · 脑机神经元',
    category: 'avantgarde',
    categoryLabel: '几何前卫',
    sub: 'Cyber Neuromorphic Mono',
    family: "'JetBrains Mono', 'Courier New', monospace",
    weight: 800,
    letterSpacing: 4,
    previewText: 'NEURAL//01',
    description: '等宽字符矩阵，宛如脑机接口中神经电脉冲与计算哲学的碰撞。',
  },
];

interface InspirationalPreset {
  label: string;
  mainTitle: string;
  subtitle: string;
  tagline: string;
}

const INSPIRATIONAL_PRESETS: InspirationalPreset[] = [
  {
    label: '心智觉察',
    mainTitle: '心智觉察',
    subtitle: '洞 见 真 理 · 觉 察 内 在',
    tagline: 'METACONSCIOUSNESS · PERCEPTION OF MIND',
  },
  {
    label: '静水流深',
    mainTitle: '静水流深',
    subtitle: '止 语 澄 心 · 洞 察 细 微',
    tagline: 'STILL WATERS RUN DEEP · CLARITY & INSIGHT',
  },
  {
    label: 'FOCUS & FLOW',
    mainTitle: 'FOCUS',
    subtitle: 'ENTER THE FLOW OF CONSCIOUSNESS',
    tagline: 'HIGH COGNITIVE STATE · MINDLABZ SALON',
  },
  {
    label: '致虚守静',
    mainTitle: '致虚极',
    subtitle: '守 静 笃 · 万 物 并 作 吾 以 观 复',
    tagline: 'DAO OF COGNITION · REVERSE ILLUSION',
  },
  {
    label: 'THINK DEEP',
    mainTitle: 'THINK',
    subtitle: 'THE ARCHITECTURE OF HUMAN THOUGHT',
    tagline: 'RATIONAL INQUIRY · VOL. 100 REVIEW',
  },
  {
    label: '黑天鹅破局',
    mainTitle: 'ANTIFRAGILE',
    subtitle: '在 不 确 定 性 中 进 化 认 知',
    tagline: 'BEYOND THE BLACK SWAN · LOGIC & BIAS',
  },
];

interface KineticCutoutHeroProps {
  mainTitle?: string;
  subtitle?: string;
  tagline?: string;
  defaultImage?: string;
  storageKey?: string;
  heightClass?: string;
  enableImagePicker?: boolean;
  onExploreClick?: () => void;
}

export const KineticCutoutHero: React.FC<KineticCutoutHeroProps> = ({
  mainTitle = 'MINDLABZ',
  subtitle = '智 心 堂 · 认知艺术典藏',
  tagline = 'MINDLABZ · COLLECTION DES PRINCIPES',
  defaultImage,
  storageKey = 'mindlabz_hero_custom_image',
  heightClass = 'min-h-[190vh]',
  enableImagePicker = true,
  onExploreClick,
}) => {
  const rawId = useId();
  const maskId = `knockout-mask-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const diyStorageKey = `${storageKey}_diy_config_v2`;

  // Master DIY config state
  const [diyConfig, setDiyConfig] = useState<HeroDiyConfig>(() => {
    try {
      const saved = localStorage.getItem(diyStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          mainTitle: parsed.mainTitle || mainTitle,
          subtitle: parsed.subtitle !== undefined ? parsed.subtitle : subtitle,
          tagline: parsed.tagline || tagline,
          fontStyle: parsed.fontStyle || 'playfair',
          layoutAlignment: parsed.layoutAlignment || 'center',
          focalAlignment: parsed.focalAlignment || 'center',
          imageUrl: parsed.imageUrl || defaultImage || MASTERPIECE_CANVASES[0].url,
          presetId: parsed.presetId || 'cosmic-synapse',
          customUploaded: !!parsed.customUploaded,
        };
      }
    } catch (e) {
      // fallback
    }
    return {
      mainTitle,
      subtitle,
      tagline,
      fontStyle: 'playfair',
      layoutAlignment: 'center',
      focalAlignment: 'center',
      imageUrl: defaultImage || MASTERPIECE_CANVASES[0].url,
      presetId: 'cosmic-synapse',
      customUploaded: false,
    };
  });

  // Modal temporary edit state
  const [editingConfig, setEditingConfig] = useState<HeroDiyConfig>(diyConfig);

  const [progress, setProgress] = useState(0);
  const [isManualControl, setIsManualControl] = useState(false);
  const [isDiyStudioOpen, setIsDiyStudioOpen] = useState(false);
  const [activeStudioTab, setActiveStudioTab] = useState<'text' | 'font' | 'layout' | 'image'>('text');
  const [uploadToast, setUploadToast] = useState<string | null>(null);

  // Floating quick font switcher menu state & category filter
  const [isFontMenuOpen, setIsFontMenuOpen] = useState(false);
  const [fontMenuCategory, setFontMenuCategory] = useState<HeroFontCategory>('all');

  const handleQuickFontSelect = (fontId: string) => {
    gameAudio.playTap();
    const updated = {
      ...diyConfig,
      fontStyle: fontId,
    };
    setDiyConfig(updated);
    setEditingConfig(updated);
    try {
      localStorage.setItem(diyStorageKey, JSON.stringify(updated));
    } catch (e) {
      // ignore
    }
    const fontName = FONT_OPTIONS.find((f) => f.id === fontId)?.name.split('·')[0].trim() || '新字形';
    setUploadToast(`已即时应用艺术字形：${fontName}`);
    setTimeout(() => setUploadToast(null), 2400);
  };

  const handlePrevFont = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    gameAudio.playTap();
    const currentIndex = FONT_OPTIONS.findIndex((f) => f.id === diyConfig.fontStyle);
    const prevIndex = (currentIndex - 1 + FONT_OPTIONS.length) % FONT_OPTIONS.length;
    const targetFont = FONT_OPTIONS[prevIndex];
    handleQuickFontSelect(targetFont.id);
  };

  const handleNextFont = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    gameAudio.playTap();
    const currentIndex = FONT_OPTIONS.findIndex((f) => f.id === diyConfig.fontStyle);
    const nextIndex = (currentIndex + 1) % FONT_OPTIONS.length;
    const targetFont = FONT_OPTIONS[nextIndex];
    handleQuickFontSelect(targetFont.id);
  };

  const handleQuickDiyTextChange = (text: string) => {
    const updated = {
      ...diyConfig,
      mainTitle: text,
    };
    setDiyConfig(updated);
    setEditingConfig((prev) => ({ ...prev, mainTitle: text }));
    try {
      localStorage.setItem(diyStorageKey, JSON.stringify(updated));
    } catch (e) {
      // ignore
    }
  };

  const filteredMenuFonts = useMemo(() => {
    if (fontMenuCategory === 'all') return FONT_OPTIONS;
    return FONT_OPTIONS.filter((f) => f.category === fontMenuCategory);
  }, [fontMenuCategory]);

  // Right-edge auto-retracting control handle & 5-second inactivity timer
  const [isControlVisible, setIsControlVisible] = useState(false);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  const resetHideTimer = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }
    setIsControlVisible(true);
    hideTimerRef.current = setTimeout(() => {
      setIsControlVisible(false);
    }, 5000);
  }, []);

  const closeControlImmediately = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }
    setIsControlVisible(false);
  }, []);

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  // Sync scroll position to calculate progress (0 to 1)
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (isManualControl) return;
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (!containerRef.current) {
            ticking = false;
            return;
          }
          const rect = containerRef.current.getBoundingClientRect();
          const windowHeight = window.innerHeight;
          const totalDist = rect.height - windowHeight;
          if (totalDist > 0) {
            const scrolled = -rect.top;
            const raw = Math.max(0, Math.min(1, scrolled / totalDist));
            setProgress(raw);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isManualControl]);

  // Handle local user photo upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('请上传有效的图片文件 (JPG, PNG, WebP等)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setEditingConfig((prev) => ({
          ...prev,
          imageUrl: result,
          presetId: 'custom',
          customUploaded: true,
        }));
        gameAudio.playSuccess();
        setUploadToast('图片已加载！可在右侧预览并在点击“保存并应用”后持久化。');
        setTimeout(() => setUploadToast(null), 3500);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyDiy = () => {
    gameAudio.playSuccess();
    setDiyConfig(editingConfig);
    try {
      localStorage.setItem(diyStorageKey, JSON.stringify(editingConfig));
    } catch (err) {
      console.warn('LocalStorage save error:', err);
    }
    setIsDiyStudioOpen(false);
    setUploadToast('专属艺术 DIY 设置已保存！');
    setTimeout(() => setUploadToast(null), 2500);
  };

  const handleResetToDefaults = () => {
    gameAudio.playTap();
    const defaultConfig: HeroDiyConfig = {
      mainTitle,
      subtitle,
      tagline,
      fontStyle: 'playfair',
      layoutAlignment: 'center',
      focalAlignment: 'center',
      imageUrl: defaultImage || MASTERPIECE_CANVASES[0].url,
      presetId: 'cosmic-synapse',
      customUploaded: false,
    };
    setEditingConfig(defaultConfig);
    setDiyConfig(defaultConfig);
    try {
      localStorage.removeItem(diyStorageKey);
    } catch {
      // ignore
    }
    setUploadToast('已恢复 MindLabZ 策展默认设置！');
    setTimeout(() => setUploadToast(null), 2500);
  };

  // Toggle full expand or contract
  const handleToggleExpand = () => {
    gameAudio.playTap();
    setIsManualControl(true);
    setProgress((prev) => (prev > 0.5 ? 0 : 1));
    setTimeout(() => {
      setIsManualControl(false);
    }, 1200);
  };

  // Current font style config
  const currentFont = FONT_OPTIONS.find((f) => f.id === diyConfig.fontStyle) || FONT_OPTIONS[0];

  // Dynamic font size math based on title length
  const titleText = diyConfig.mainTitle || 'MINDLABZ';
  const charLen = titleText.length;
  // Compute optimized font size so short words look monumental and long words fit without overflow
  const dynamicFontSize = useMemo(() => {
    if (charLen <= 4) return 145;
    if (charLen <= 6) return 130;
    if (charLen <= 8) return 110;
    if (charLen <= 12) return 92;
    return Math.max(54, Math.round(920 / charLen));
  }, [charLen]);

  // Scale formula: smooth exponential growth from 1 to 32
  const scale = 1 + Math.pow(progress, 1.45) * 31;

  // Multi-plane parallax offset calculations
  // Plane 1: Background image translation & zoom
  const imageParallaxY = -progress * 70; // moves up slightly to create counter-depth
  const imageScale = 1.06 + progress * 0.26; // slowly zooms in

  // Plane 2: Floating stardust & celestial rings parallax
  const dustParallaxY = -progress * 140;
  const dustScale = 1 + progress * 0.45;

  // Fade out the overlay at the very end (from progress 0.86 to 1.0) for seamless 100% full-screen photo display
  const overlayOpacity = progress < 0.86 ? 1 : Math.max(0, 1 - (progress - 0.86) / 0.14);

  // SVG aspect ratio focal alignment
  const svgPreserveAspectRatio = useMemo(() => {
    if (diyConfig.focalAlignment === 'top') return 'xMidYMin slice';
    if (diyConfig.focalAlignment === 'bottom') return 'xMidYMax slice';
    return 'xMidYMid slice';
  }, [diyConfig.focalAlignment]);

  // Coordinates based on layout alignment
  const layoutCoords = useMemo(() => {
    switch (diyConfig.layoutAlignment) {
      case 'left':
        return {
          titleX: 180,
          subX: 180,
          textAnchor: 'start' as const,
        };
      case 'staggered':
        return {
          titleX: 600,
          subX: 600,
          textAnchor: 'middle' as const,
        };
      case 'compact':
        return {
          titleX: 600,
          subX: 600,
          textAnchor: 'middle' as const,
        };
      case 'center':
      default:
        return {
          titleX: 600,
          subX: 600,
          textAnchor: 'middle' as const,
        };
    }
  }, [diyConfig.layoutAlignment]);

  const currentCanvas = MASTERPIECE_CANVASES.find((m) => m.url === diyConfig.imageUrl);

  return (
    <div ref={containerRef} className={`relative w-full ${heightClass}`}>
      {/* Sticky Fullscreen Stage */}
      <div className="sticky top-0 h-[88vh] sm:h-[92vh] md:h-screen w-full overflow-hidden bg-[#0A0914] select-none flex flex-col justify-center items-center">
        {/* SVG Multi-Plane Mask Cutout Typography Canvas */}
        <div className="absolute inset-0 w-full h-full">
          <svg
            className="w-full h-full block"
            viewBox="0 0 1200 700"
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              <mask id={maskId}>
                {/* 1. White base: makes dark surface opaque */}
                <rect x="0" y="0" width="1200" height="700" fill="white" />

                {/* 2. Scalable Knockout Typography Stencil */}
                <g
                  style={{
                    transformOrigin: '600px 350px',
                    transform: `scale(${scale})`,
                    transition: isManualControl ? 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
                  }}
                >
                  {diyConfig.layoutAlignment === 'staggered' && titleText.length >= 4 ? (
                    // Staggered Deconstructive Layout (Two offset lines)
                    <>
                      <text
                        x="480"
                        y="300"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="black"
                        fontFamily={currentFont.family}
                        fontWeight={currentFont.weight}
                        fontSize={dynamicFontSize * 0.9}
                        letterSpacing={currentFont.letterSpacing}
                      >
                        {titleText.slice(0, Math.ceil(titleText.length / 2))}
                      </text>
                      <text
                        x="720"
                        y="390"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="black"
                        fontFamily={currentFont.family}
                        fontWeight={currentFont.weight}
                        fontSize={dynamicFontSize * 0.9}
                        letterSpacing={currentFont.letterSpacing}
                      >
                        {titleText.slice(Math.ceil(titleText.length / 2))}
                      </text>
                    </>
                  ) : (
                    // Single-line Monumental Main Cutout Title
                    <text
                      x={layoutCoords.titleX}
                      y="330"
                      textAnchor={layoutCoords.textAnchor}
                      dominantBaseline="middle"
                      fill="black"
                      fontFamily={currentFont.family}
                      fontWeight={currentFont.weight}
                      fontSize={dynamicFontSize}
                      letterSpacing={currentFont.letterSpacing}
                    >
                      {titleText}
                    </text>
                  )}

                  {/* Elegant Secondary Cutout Subtitle */}
                  {diyConfig.subtitle && (
                    <text
                      x={layoutCoords.subX}
                      y={diyConfig.layoutAlignment === 'staggered' ? '460' : '425'}
                      textAnchor={layoutCoords.textAnchor}
                      dominantBaseline="middle"
                      fill="black"
                      fontFamily={currentFont.family}
                      fontWeight="700"
                      fontSize={Math.max(20, Math.min(34, Math.round(dynamicFontSize * 0.28)))}
                      letterSpacing={Math.max(4, currentFont.letterSpacing * 1.4)}
                    >
                      {diyConfig.subtitle}
                    </text>
                  )}
                </g>
              </mask>
            </defs>

            {/* LAYER 1: Underlying Full-Bleed Masterpiece Artwork with Multi-plane 3D Scroll Parallax */}
            <image
              href={diyConfig.imageUrl}
              x="0"
              y="0"
              width="1200"
              height="700"
              preserveAspectRatio={svgPreserveAspectRatio}
              style={{
                transformOrigin: '600px 350px',
                transform: `translate3d(0, ${imageParallaxY}px, 0) scale(${imageScale})`,
                transition: isManualControl ? 'transform 0.4s ease-out' : 'none',
              }}
            />

            {/* LAYER 2: Ethereal Stardust & Sacred Fibonacci Constellation Plane with Intermediate Parallax */}
            <g
              style={{
                transformOrigin: '600px 350px',
                transform: `translate3d(0, ${dustParallaxY}px, 0) scale(${dustScale})`,
                opacity: Math.max(0, 0.45 * (1 - progress * 1.8)),
                pointerEvents: 'none',
              }}
            >
              <circle cx="200" cy="180" r="1.5" fill="#FDE68A" />
              <circle cx="1020" cy="140" r="2" fill="#FDE68A" />
              <circle cx="380" cy="540" r="1.2" fill="#FDE68A" />
              <circle cx="880" cy="520" r="1.8" fill="#FDE68A" />
              <circle cx="600" cy="350" r="260" stroke="#F59E0B" strokeWidth="0.8" strokeDasharray="6 12" fill="none" opacity="0.3" />
              <circle cx="600" cy="350" r="420" stroke="#818CF8" strokeWidth="0.6" strokeDasharray="4 16" fill="none" opacity="0.25" />
            </g>

            {/* LAYER 3: Top Nocturnal Obsidian Surface with Knockout Mask applied */}
            <rect
              x="0"
              y="0"
              width="1200"
              height="700"
              fill="#0B0918"
              mask={`url(#${maskId})`}
              style={{
                opacity: overlayOpacity,
                transition: isManualControl ? 'opacity 0.4s ease-out' : 'none',
              }}
            />

            {/* LAYER 4: Micro-beveled Gold Foil Contour Rim around the cutout letters (Sculpted Luxury Depth) */}
            <g
              style={{
                transformOrigin: '600px 350px',
                transform: `scale(${scale})`,
                opacity: Math.max(0, (1 - progress * 2.2) * 0.4),
                pointerEvents: 'none',
                transition: isManualControl ? 'transform 0.4s ease-out' : 'none',
              }}
            >
              <text
                x={layoutCoords.titleX}
                y="330"
                textAnchor={layoutCoords.textAnchor}
                dominantBaseline="middle"
                fill="none"
                stroke="#FDE68A"
                strokeWidth="1.2"
                fontFamily={currentFont.family}
                fontWeight={currentFont.weight}
                fontSize={dynamicFontSize}
                letterSpacing={currentFont.letterSpacing}
              >
                {titleText}
              </text>
            </g>
          </svg>
        </div>

        {/* Top Fine Art Header Bar on Viewport with Floating Font & DIY Controls */}
        <div
          className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-auto transition-opacity duration-300"
          style={{ opacity: isFontMenuOpen ? 1 : Math.max(0.7, 1 - progress * 0.4) }}
        >
          {/* Tagline Badge */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-white text-xs shadow-md">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="font-mono text-[11px] tracking-wider text-amber-200 truncate max-w-[150px] sm:max-w-none">
              {diyConfig.tagline || tagline}
            </span>
          </div>

          {/* Top Right Floating Action Pod */}
          <div className="flex items-center gap-2 relative">
            {/* 0. Ambient Soundscape Switch (静谧森林 / 禅意空间) */}
            <AmbientSoundscapeControl />

            {/* 1. Sleek Floating Font Switcher Capsule Menu */}
            <div className="relative">
              {/* Floating Trigger Capsule with Quick Step Arrows */}
              <div className="flex items-center rounded-full bg-black/75 hover:bg-black/90 backdrop-blur-xl border border-amber-400/40 shadow-xl p-0.5 text-white text-xs transition-all">
                <button
                  onClick={handlePrevFont}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-stone-300 hover:text-amber-300 hover:bg-white/10 transition-colors cursor-pointer"
                  title="切换上一款艺术字形"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => {
                    gameAudio.playTap();
                    setIsFontMenuOpen((prev) => !prev);
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    isFontMenuOpen
                      ? 'bg-amber-400 text-stone-950 shadow-md ring-2 ring-amber-400/40'
                      : 'text-amber-200 hover:text-white'
                  }`}
                  title="展开高端艺术字库悬浮菜单 (16款预设)"
                >
                  <Type className={`w-3.5 h-3.5 ${isFontMenuOpen ? 'text-stone-950' : 'text-amber-400'}`} />
                  <span className="max-w-[80px] sm:max-w-none truncate font-serif-editorial">
                    {currentFont.name.split('·')[0].trim()}
                  </span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                      isFontMenuOpen ? 'bg-black/20 text-stone-950' : 'bg-amber-400/20 text-amber-300'
                    }`}
                  >
                    16款
                  </span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${isFontMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                <button
                  onClick={handleNextFont}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-stone-300 hover:text-amber-300 hover:bg-white/10 transition-colors cursor-pointer"
                  title="切换下一款艺术字形"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Outside click overlay */}
              {isFontMenuOpen && (
                <div
                  className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px]"
                  onClick={() => setIsFontMenuOpen(false)}
                />
              )}

              {/* Floating Typography Menu Popover Drawer */}
              {isFontMenuOpen && (
                <div className="absolute right-0 top-11 z-50 w-[330px] sm:w-[410px] rounded-3xl bg-[#0E0C20]/98 backdrop-blur-2xl border border-amber-400/60 shadow-2xl p-4 sm:p-5 space-y-3.5 text-white animate-stageEnter">
                  {/* Menu Header */}
                  <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center border border-amber-300/30">
                        <Type className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-serif-editorial font-bold text-xs sm:text-sm text-white">
                            高端艺术字形库
                          </h4>
                          <span className="px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 text-[10px] font-mono border border-amber-400/30">
                            16 PRESETS
                          </span>
                        </div>
                        <p className="text-[10px] text-stone-400 mt-0.5">即点即切 · 实时观察字形透光美学与字韵</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsFontMenuOpen(false)}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-stone-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                      title="关闭菜单"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Category Filter Tabs */}
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-[11px]">
                    {[
                      { id: 'all', label: '全部 (16)' },
                      { id: 'serif', label: '经典衬线 (5)' },
                      { id: 'calligraphy', label: '东方书法 (5)' },
                      { id: 'poster', label: '现代海报 (3)' },
                      { id: 'geometric', label: '几何前卫 (3)' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => {
                          gameAudio.playTap();
                          setFontMenuCategory(tab.id as HeroFontCategory);
                        }}
                        className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-all cursor-pointer ${
                          fontMenuCategory === tab.id
                            ? 'bg-amber-400 text-stone-950 shadow-xs'
                            : 'bg-white/10 text-stone-300 hover:bg-white/15'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Font Cards List (Scrollable) */}
                  <div className="max-h-[260px] overflow-y-auto space-y-2 pr-1 no-scrollbar">
                    {filteredMenuFonts.map((f) => {
                      const isSelected = diyConfig.fontStyle === f.id;
                      return (
                        <div
                          key={f.id}
                          onClick={() => handleQuickFontSelect(f.id)}
                          className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-3 group ${
                            isSelected
                              ? 'bg-amber-400/20 border-amber-400 ring-1 ring-amber-400/40 shadow-md'
                              : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-amber-400/40'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-white group-hover:text-amber-200 transition-colors">
                                {f.name}
                              </span>
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/10 text-stone-300">
                                {f.categoryLabel}
                              </span>
                            </div>
                            <div
                              className="text-base sm:text-lg font-bold text-amber-200 truncate mt-1 tracking-wider"
                              style={{ fontFamily: f.family, fontWeight: f.weight }}
                            >
                              {titleText || f.previewText}
                            </div>
                            <p className="text-[10px] text-stone-400 line-clamp-1 mt-0.5">
                              {f.description}
                            </p>
                          </div>

                          <div className="shrink-0 flex items-center justify-center">
                            {isSelected ? (
                              <div className="w-5 h-5 rounded-full bg-amber-400 text-stone-950 flex items-center justify-center shadow-xs">
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded-full border border-white/20 group-hover:border-amber-400/60" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Enhanced DIY Creative Quick Bar */}
                  <div className="pt-2.5 border-t border-white/10 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-stone-300 font-medium flex items-center gap-1">
                        <Wand2 className="w-3 h-3 text-amber-400" />
                        <span>实时 DIY 标语 / 您的名字：</span>
                      </span>
                      <button
                        onClick={() => {
                          gameAudio.playTap();
                          setIsFontMenuOpen(false);
                          setEditingConfig(diyConfig);
                          setIsDiyStudioOpen(true);
                        }}
                        className="text-amber-300 hover:text-amber-200 font-bold hover:underline cursor-pointer flex items-center gap-0.5"
                      >
                        <span>进阶工坊</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        value={diyConfig.mainTitle}
                        onChange={(e) => handleQuickDiyTextChange(e.target.value)}
                        placeholder="输入您的专属标语，如：心智觉察、静水流深..."
                        maxLength={24}
                        className="w-full px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 focus:border-amber-400 text-xs text-white placeholder-stone-400 focus:outline-none transition-all"
                      />
                    </div>

                    {/* Quick Preset Chips */}
                    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-0.5">
                      {['MINDLABZ', '心智觉察', '静水流深', 'FOCUS', '致虚极', 'ANTIFRAGILE'].map((chip) => (
                        <button
                          key={chip}
                          onClick={() => {
                            gameAudio.playTap();
                            handleQuickDiyTextChange(chip);
                          }}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-mono shrink-0 transition-colors cursor-pointer ${
                            diyConfig.mainTitle === chip
                              ? 'bg-amber-400 text-stone-950 font-bold'
                              : 'bg-white/10 hover:bg-white/20 text-stone-300'
                          }`}
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Artistic DIY Studio & Image Trigger Button */}
            {enableImagePicker && (
              <button
                onClick={() => {
                  gameAudio.playTap();
                  setEditingConfig(diyConfig);
                  setIsDiyStudioOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/25 via-white/15 to-purple-500/25 hover:from-amber-500/35 hover:to-purple-500/35 backdrop-blur-md border border-amber-300/50 text-white text-xs font-bold transition-all cursor-pointer shadow-xl active:scale-95 group"
              >
                <Wand2 className="w-3.5 h-3.5 text-amber-300 group-hover:rotate-12 transition-transform" />
                <span className="text-amber-100 hidden sm:inline">创意 DIY 工坊</span>
                <span className="text-amber-100 sm:hidden">DIY</span>
                <span className="px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 text-[10px] font-mono border border-amber-300/30">
                  PRO
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Ambient Foreground Framing Aura & Hint (Disappears as photo zooms full screen) */}
        <div
          className="relative z-10 pointer-events-none flex flex-col items-center justify-between h-full py-16 px-6 text-center transition-opacity duration-300"
          style={{ opacity: Math.max(0, 1 - progress * 2) }}
        >
          {/* Subtle upper quote */}
          <div className="text-xs text-amber-200/80 font-serif-editorial italic tracking-widest uppercase">
            ✦ L'Art de la Pensée · 雕镂之光 · 凝视心智 ✦
          </div>

          {/* Centered Decorative Watermark Rings */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-15">
            <div className="w-[520px] h-[520px] rounded-full border border-amber-400/30" />
            <div className="w-[720px] h-[720px] rounded-full border border-purple-400/20" />
          </div>

          {/* Bottom Kinetic Scroll Guidance & Indicator */}
          <div className="space-y-2 pointer-events-auto">
            <div className="flex items-center justify-center gap-2 text-xs font-mono text-stone-300">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>下滑：字形视差放大铺满全屏</span>
              <span className="text-stone-500">·</span>
              <span>上滑：照片深邃收回字里</span>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-stone-400 animate-bounce">
              <ChevronDown className="w-4 h-4 text-amber-300" />
            </div>
          </div>
        </div>

        {/* Right-Edge Auto-Retracting Compact Control Handle (5s Inactivity Timer) */}
        <div
          className="absolute right-0 bottom-8 sm:bottom-12 z-30 transition-all duration-300"
          onMouseEnter={resetHideTimer}
          onMouseMove={resetHideTimer}
        >
          {isControlVisible ? (
            /* Expanded Sleek Cockpit on Right Edge */
            <div
              className="mr-2 sm:mr-4 flex items-center gap-2.5 px-3.5 py-1.5 rounded-2xl bg-black/85 backdrop-blur-xl border border-amber-400/50 shadow-2xl text-white text-xs animate-fadeIn"
              onMouseEnter={resetHideTimer}
            >
              {/* Zoom Progress Percent */}
              <div className="flex items-center gap-1.5 font-mono text-[11px] text-amber-200">
                <Eye className="w-3.5 h-3.5 text-amber-400" />
                <span className="w-9 text-right font-bold">{Math.round(progress * 100)}%</span>
              </div>

              {/* Compact Interactive Manual Scrubber */}
              <input
                type="range"
                min="0"
                max="1"
                step="0.005"
                value={progress}
                onChange={(e) => {
                  setIsManualControl(true);
                  setProgress(parseFloat(e.target.value));
                  resetHideTimer();
                }}
                onMouseUp={() => {
                  setIsManualControl(false);
                  resetHideTimer();
                }}
                onTouchEnd={() => {
                  setIsManualControl(false);
                  resetHideTimer();
                }}
                className="w-20 sm:w-28 accent-amber-400 cursor-pointer h-1.5 bg-white/20 rounded-lg appearance-none"
                title="手动拖拽文字视差放大比例"
              />

              {/* One-Click Fullscreen / Contract Button */}
              <button
                onClick={() => {
                  handleToggleExpand();
                  resetHideTimer();
                }}
                className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 border border-white/20 text-white transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                title={progress > 0.5 ? '收回至字形' : '一键全屏铺满'}
              >
                {progress > 0.5 ? (
                  <Minimize2 className="w-3.5 h-3.5 text-amber-300" />
                ) : (
                  <Maximize2 className="w-3.5 h-3.5 text-amber-300" />
                )}
              </button>

              {/* Quick Ambient Soundscape Toggle */}
              <button
                onClick={() => {
                  gameAudio.playTap();
                  ambientSound.togglePlay();
                  resetHideTimer();
                }}
                className={`p-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1 active:scale-95 ${
                  ambientSound.isPlaying()
                    ? 'bg-emerald-500/25 border-emerald-400 text-emerald-300 shadow-emerald-500/20 shadow-xs'
                    : 'bg-white/10 hover:bg-white/20 border-white/20 text-stone-300'
                }`}
                title="开启/暂停环境音景 (静谧森林 / 禅意空间)"
              >
                <Headphones className="w-3.5 h-3.5" />
                <span className="text-[10px] hidden sm:inline font-bold">音景</span>
              </button>

              {/* Quick Floating Font Menu Trigger */}
              <button
                onClick={() => {
                  gameAudio.playTap();
                  setIsFontMenuOpen((prev) => !prev);
                  resetHideTimer();
                }}
                className="p-1.5 rounded-lg bg-amber-400/20 hover:bg-amber-400/35 border border-amber-300/40 text-amber-300 transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                title="切换高端艺术字体 (16款预设)"
              >
                <Type className="w-3.5 h-3.5" />
                <span className="text-[10px] hidden sm:inline font-bold">字形</span>
              </button>

              {/* Quick DIY Studio Trigger */}
              <button
                onClick={() => {
                  gameAudio.playTap();
                  setEditingConfig(diyConfig);
                  setIsDiyStudioOpen(true);
                  resetHideTimer();
                }}
                className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 border border-white/20 text-white transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                title="打开创意 DIY 工坊"
              >
                <Wand2 className="w-3.5 h-3.5 text-amber-300" />
                <span className="text-[10px] hidden sm:inline font-bold">DIY</span>
              </button>

              {/* Quick Retract / Hide Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  gameAudio.playTap();
                  closeControlImmediately();
                }}
                className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer ml-0.5"
                title="收回并隐形至右侧边缘"
              >
                <ChevronRight className="w-4 h-4 text-amber-300/80" />
              </button>
            </div>
          ) : (
            /* Collapsed 1cm Rectangular Micro Handle on Right Edge */
            <button
              onClick={() => {
                gameAudio.playTap();
                resetHideTimer();
              }}
              onMouseEnter={resetHideTimer}
              onTouchStart={resetHideTimer}
              className="w-[12px] hover:w-[16px] h-[38px] rounded-l-md bg-black/45 hover:bg-black/85 backdrop-blur-md border-l border-y border-amber-400/60 shadow-lg cursor-pointer transition-all duration-200 flex items-center justify-center group active:scale-95"
              title="轻触或移入展开控制手柄（5秒后自动隐形收回）"
              aria-label="展开控制手柄"
            >
              <span className="w-[3px] h-[18px] rounded-full bg-amber-400/80 group-hover:bg-amber-300 transition-all shadow-xs" />
            </button>
          )}
        </div>
      </div>

      {/* Hidden File Input for local user photo upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Toast Notification */}
      {uploadToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-2xl bg-stone-900 text-white border border-amber-400/60 shadow-2xl flex items-center gap-2 animate-fadeIn text-xs">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{uploadToast}</span>
        </div>
      )}

      {/* ========================================================
          Masterpiece Artisan Atelier: Creative DIY Studio Modal
         ======================================================== */}
      {isDiyStudioOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-3xl rounded-3xl bg-[#121024] border border-amber-400/50 shadow-2xl p-5 sm:p-8 space-y-6 text-white animate-stageEnter max-h-[92vh] overflow-y-auto no-scrollbar">
            {/* Top Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-400/20 to-purple-500/20 border border-amber-300/40 flex items-center justify-center text-amber-300 shadow-md">
                  <Wand2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif-editorial text-lg sm:text-xl font-bold text-white">
                      私人专属创意 DIY 工坊
                    </h3>
                    <span className="px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 text-[10px] font-mono border border-amber-300/30">
                      CUSTOM STUDIO
                    </span>
                  </div>
                  <p className="text-xs text-stone-300 mt-0.5">
                    定制专属于您的镂空大标题、字体风格、排版构图与私人底图，打造沉浸式心智入口。
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsDiyStudioOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Live Interactive Cutout Preview Box */}
            <div className="rounded-2xl p-4 bg-black/50 border border-white/15 space-y-2">
              <div className="flex items-center justify-between text-xs text-stone-400">
                <span className="font-mono text-[11px] text-amber-300 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" />
                  <span>实时效果动态预演 (Live Preview)</span>
                </span>
                <span className="text-[11px] text-stone-400">
                  当前字体: {FONT_OPTIONS.find((f) => f.id === editingConfig.fontStyle)?.name}
                </span>
              </div>

              <div className="h-32 sm:h-36 w-full rounded-xl overflow-hidden relative border border-white/10 bg-[#0B0918]">
                {/* Simulated SVG Cutout Preview */}
                <svg className="w-full h-full" viewBox="0 0 800 240" preserveAspectRatio="xMidYMid slice">
                  <defs>
                    <mask id="preview-mask">
                      <rect x="0" y="0" width="800" height="240" fill="white" />
                      <text
                        x={editingConfig.layoutAlignment === 'left' ? '120' : '400'}
                        y="110"
                        textAnchor={editingConfig.layoutAlignment === 'left' ? 'start' : 'middle'}
                        dominantBaseline="middle"
                        fill="black"
                        fontFamily={FONT_OPTIONS.find((f) => f.id === editingConfig.fontStyle)?.family}
                        fontWeight="900"
                        fontSize={Math.max(38, Math.min(76, Math.round(520 / Math.max(3, editingConfig.mainTitle.length))))}
                        letterSpacing="4"
                      >
                        {editingConfig.mainTitle || 'MINDLABZ'}
                      </text>
                      {editingConfig.subtitle && (
                        <text
                          x={editingConfig.layoutAlignment === 'left' ? '120' : '400'}
                          y="160"
                          textAnchor={editingConfig.layoutAlignment === 'left' ? 'start' : 'middle'}
                          dominantBaseline="middle"
                          fill="black"
                          fontFamily={FONT_OPTIONS.find((f) => f.id === editingConfig.fontStyle)?.family}
                          fontWeight="700"
                          fontSize="18"
                          letterSpacing="6"
                        >
                          {editingConfig.subtitle}
                        </text>
                      )}
                    </mask>
                  </defs>

                  <image
                    href={editingConfig.imageUrl}
                    x="0"
                    y="0"
                    width="800"
                    height="240"
                    preserveAspectRatio={
                      editingConfig.focalAlignment === 'top'
                        ? 'xMidYMin slice'
                        : editingConfig.focalAlignment === 'bottom'
                        ? 'xMidYMax slice'
                        : 'xMidYMid slice'
                    }
                  />

                  <rect x="0" y="0" width="800" height="240" fill="#0B0918" mask="url(#preview-mask)" />
                </svg>
              </div>
            </div>

            {/* Studio Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto no-scrollbar text-xs">
              <button
                onClick={() => {
                  gameAudio.playTap();
                  setActiveStudioTab('text');
                }}
                className={`px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeStudioTab === 'text'
                    ? 'bg-amber-400 text-stone-950 shadow-md'
                    : 'bg-white/5 hover:bg-white/10 text-stone-300'
                }`}
              >
                <Type className="w-3.5 h-3.5" />
                <span>1. 标语与名称 DIY</span>
              </button>

              <button
                onClick={() => {
                  gameAudio.playTap();
                  setActiveStudioTab('font');
                }}
                className={`px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeStudioTab === 'font'
                    ? 'bg-amber-400 text-stone-950 shadow-md'
                    : 'bg-white/5 hover:bg-white/10 text-stone-300'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>2. 艺术字体选择</span>
              </button>

              <button
                onClick={() => {
                  gameAudio.playTap();
                  setActiveStudioTab('layout');
                }}
                className={`px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeStudioTab === 'layout'
                    ? 'bg-amber-400 text-stone-950 shadow-md'
                    : 'bg-white/5 hover:bg-white/10 text-stone-300'
                }`}
              >
                <Layout className="w-3.5 h-3.5" />
                <span>3. 构图排版与焦点</span>
              </button>

              <button
                onClick={() => {
                  gameAudio.playTap();
                  setActiveStudioTab('image');
                }}
                className={`px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeStudioTab === 'image'
                    ? 'bg-amber-400 text-stone-950 shadow-md'
                    : 'bg-white/5 hover:bg-white/10 text-stone-300'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>4. 艺术底图与上传</span>
              </button>
            </div>

            {/* TAB 1: Text & Slogan DIY */}
            {activeStudioTab === 'text' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-amber-200 flex items-center gap-1.5">
                    <span>大标题雕镂文字 (Main Cutout Title)</span>
                    <span className="text-[10px] text-stone-400 font-normal">支持中英文、姓名、座右铭</span>
                  </label>
                  <input
                    type="text"
                    value={editingConfig.mainTitle}
                    onChange={(e) => setEditingConfig({ ...editingConfig, mainTitle: e.target.value })}
                    placeholder="例如: MINDLABZ、心智觉察、YOUR NAME..."
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-stone-400 focus:outline-none focus:border-amber-400 font-bold text-base"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-amber-200">
                    副标题 / 沉思引语 (Subtitle)
                  </label>
                  <input
                    type="text"
                    value={editingConfig.subtitle}
                    onChange={(e) => setEditingConfig({ ...editingConfig, subtitle: e.target.value })}
                    placeholder="例如: 智心堂 · 认知艺术典藏、私人心智研习所..."
                    className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-stone-400 focus:outline-none focus:border-amber-400 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-300">
                    顶部卷标徽志 (Top Rubric Tagline)
                  </label>
                  <input
                    type="text"
                    value={editingConfig.tagline}
                    onChange={(e) => setEditingConfig({ ...editingConfig, tagline: e.target.value })}
                    placeholder="例如: MINDLABZ · COLLECTION DES PRINCIPES..."
                    className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-stone-400 focus:outline-none focus:border-amber-400 text-xs font-mono"
                  />
                </div>

                {/* 1-Click Inspirational Quotes */}
                <div className="pt-2 space-y-2">
                  <span className="text-xs text-stone-400 font-bold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>灵感锦囊：一键套用经典哲思标语</span>
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {INSPIRATIONAL_PRESETS.map((item) => (
                      <button
                        key={item.label}
                        onClick={() => {
                          gameAudio.playTap();
                          setEditingConfig({
                            ...editingConfig,
                            mainTitle: item.mainTitle,
                            subtitle: item.subtitle,
                            tagline: item.tagline,
                          });
                        }}
                        className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-amber-400/20 hover:text-amber-300 border border-white/15 text-xs text-stone-300 transition-all cursor-pointer active:scale-95"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Font Selection */}
            {activeStudioTab === 'font' && (
              <div className="space-y-4 animate-fadeIn">
                <p className="text-xs text-stone-300">
                  精心预设 16 款兼具镂空遮罩表现力与高级艺术气质的字体（经典衬线、东方名家书法、现代海报、前卫几何），透射出截然不同的心智艺术氛围：
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {FONT_OPTIONS.map((f) => {
                    const isSelected = editingConfig.fontStyle === f.id;
                    return (
                      <div
                        key={f.id}
                        onClick={() => {
                          gameAudio.playTap();
                          setEditingConfig({ ...editingConfig, fontStyle: f.id });
                        }}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between gap-2 ${
                          isSelected
                            ? 'bg-amber-400/15 border-amber-400 ring-2 ring-amber-400/30'
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-white">{f.name}</span>
                          {isSelected && <Check className="w-4 h-4 text-amber-400" />}
                        </div>
                        <span className="text-[11px] text-stone-400 font-serif-editorial">{f.sub}</span>
                        <div
                          className="pt-2 text-xl font-bold tracking-wider text-amber-200"
                          style={{ fontFamily: f.family, fontWeight: f.weight }}
                        >
                          {editingConfig.mainTitle || 'MINDLABZ'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 3: Layout Alignment & Focal Positioning */}
            {activeStudioTab === 'layout' && (
              <div className="space-y-5 animate-fadeIn">
                {/* Layout Alignment Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-amber-200 flex items-center gap-1.5">
                    <Layout className="w-3.5 h-3.5" />
                    <span>自动排布位置构图 (Layout Composition)</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      { id: 'center', label: '中正大成', sub: '经典正中对齐', icon: AlignCenter },
                      { id: 'left', label: '黄金左偏', sub: '前沿杂志排版', icon: AlignLeft },
                      { id: 'staggered', label: '错落解构', sub: '双层诗意律动', icon: Move },
                      { id: 'compact', label: '紧凑宽幕', sub: '影画全景聚拢', icon: Maximize2 },
                    ].map((opt) => {
                      const isSelected = editingConfig.layoutAlignment === opt.id;
                      const Icon = opt.icon;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => {
                            gameAudio.playTap();
                            setEditingConfig({
                              ...editingConfig,
                              layoutAlignment: opt.id as HeroLayoutAlignment,
                            });
                          }}
                          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-amber-400 text-stone-950 font-bold border-amber-400 shadow-md'
                              : 'bg-white/5 border-white/10 hover:bg-white/10 text-stone-300'
                          }`}
                        >
                          <Icon className="w-4 h-4 mb-1.5" />
                          <div className="text-xs font-bold">{opt.label}</div>
                          <div className={`text-[10px] ${isSelected ? 'text-stone-800' : 'text-stone-400'}`}>
                            {opt.sub}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Focal Alignment for Background Image */}
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <label className="text-xs font-bold text-amber-200 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5" />
                    <span>底图焦点定位优化 (Focal Point Alignment)</span>
                  </label>
                  <p className="text-[11px] text-stone-400">
                    针对不同比例照片（如手机人像竖图、全景横图），智能决定图片在字形视窗中的锚定重心：
                  </p>
                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      { id: 'center', label: '智能居中', desc: '全景通用视角' },
                      { id: 'top', label: '主体偏上', desc: '适合人像/天空/穹顶' },
                      { id: 'bottom', label: '主体偏下', desc: '适合山峦/水面/前景' },
                    ].map((foc) => {
                      const isSelected = editingConfig.focalAlignment === foc.id;
                      return (
                        <button
                          key={foc.id}
                          onClick={() => {
                            gameAudio.playTap();
                            setEditingConfig({
                              ...editingConfig,
                              focalAlignment: foc.id as HeroFocalAlignment,
                            });
                          }}
                          className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-purple-600 text-white font-bold border-purple-400 shadow-md'
                              : 'bg-white/5 border-white/10 hover:bg-white/10 text-stone-300'
                          }`}
                        >
                          <div className="text-xs font-bold">{foc.label}</div>
                          <div className="text-[10px] text-stone-300/80 mt-0.5">{foc.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: Masterpieces & User Image Upload */}
            {activeStudioTab === 'image' && (
              <div className="space-y-5 animate-fadeIn">
                {/* Local Photo Upload CTA */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-purple-900/40 via-indigo-900/30 to-amber-900/30 border border-amber-400/35 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">从本地上传您的私人照片</h4>
                      <p className="text-xs text-stone-300 mt-0.5">
                        支持任意格式高清照片，自动适配字形并持久化保留。
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-bold text-xs transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer shrink-0 active:scale-95"
                  >
                    <Upload className="w-4 h-4" />
                    <span>选择手机/电脑图片</span>
                  </button>
                </div>

                {/* Masterpieces Grid */}
                <div className="space-y-2.5">
                  <span className="text-xs font-bold text-amber-200">
                    或从 6 幅世界级大师名作中自由挑选：
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {MASTERPIECE_CANVASES.map((canvas) => {
                      const isSelected = editingConfig.imageUrl === canvas.url;
                      return (
                        <div
                          key={canvas.id}
                          onClick={() => {
                            gameAudio.playTap();
                            setEditingConfig({
                              ...editingConfig,
                              imageUrl: canvas.url,
                              presetId: canvas.id,
                              customUploaded: false,
                            });
                          }}
                          className={`p-2.5 rounded-2xl border cursor-pointer transition-all flex gap-3 ${
                            isSelected
                              ? 'bg-white/15 border-amber-400 ring-2 ring-amber-400/40'
                              : 'bg-white/5 border-white/10 hover:bg-white/10'
                          }`}
                        >
                          <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 relative bg-black/40">
                            <img src={canvas.url} alt={canvas.title} className="w-full h-full object-cover" />
                            {isSelected && (
                              <div className="absolute inset-0 bg-amber-500/30 flex items-center justify-center">
                                <Check className="w-4 h-4 text-white stroke-[3]" />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1 flex flex-col justify-center">
                            <h4 className="font-bold text-xs text-white truncate">{canvas.title}</h4>
                            <span className="text-[10px] text-amber-300 font-serif-editorial truncate mt-0.5">
                              {canvas.artist}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Modal Bottom Action Controls */}
            <div className="pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-white/10">
              <button
                onClick={handleResetToDefaults}
                className="px-4 py-2 rounded-xl text-stone-400 hover:text-white hover:bg-white/10 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>恢复出厂设置</span>
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsDiyStudioOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-white/20 text-stone-300 hover:bg-white/10 text-xs font-bold transition-colors cursor-pointer"
                >
                  取消
                </button>

                <button
                  onClick={handleApplyDiy}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-extrabold text-xs transition-all shadow-xl cursor-pointer flex items-center gap-2 active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>保存并应用专属 DIY 效果</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

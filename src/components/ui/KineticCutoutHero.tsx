import React, { useState, useEffect, useRef, useId } from 'react';
import {
  Sparkles,
  Upload,
  Image as ImageIcon,
  RotateCcw,
  Maximize2,
  Minimize2,
  ChevronDown,
  X,
  Check,
  Palette,
  Sliders,
  Eye,
} from 'lucide-react';
import { gameAudio } from '../../utils/gameAudio';

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

interface KineticCutoutHeroProps {
  mainTitle: string;
  subtitle?: string;
  tagline?: string;
  defaultImage?: string;
  storageKey?: string;
  heightClass?: string;
  enableImagePicker?: boolean;
  onExploreClick?: () => void;
}

export const KineticCutoutHero: React.FC<KineticCutoutHeroProps> = ({
  mainTitle,
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

  // Active artwork image url
  const [activeImage, setActiveImage] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return saved;
    } catch {
      // fallback
    }
    return defaultImage || MASTERPIECE_CANVASES[0].url;
  });

  // Current canvas metadata
  const [selectedPresetId, setSelectedPresetId] = useState<string>(() => {
    const match = MASTERPIECE_CANVASES.find((m) => m.url === activeImage);
    return match ? match.id : 'custom';
  });

  const [progress, setProgress] = useState(0);
  const [isManualControl, setIsManualControl] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [uploadToast, setUploadToast] = useState<string | null>(null);

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
        try {
          localStorage.setItem(storageKey, result);
        } catch (err) {
          console.warn('LocalStorage full, loaded for current session:', err);
        }
        setActiveImage(result);
        setSelectedPresetId('custom');
        gameAudio.playSuccess();
        setUploadToast('自定义艺术底图已上传并即时应用！');
        setTimeout(() => setUploadToast(null), 3000);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPreset = (canvas: MasterpieceCanvas) => {
    gameAudio.playTap();
    setActiveImage(canvas.url);
    setSelectedPresetId(canvas.id);
    try {
      localStorage.setItem(storageKey, canvas.url);
    } catch {
      // ignore
    }
  };

  const handleResetToDefault = () => {
    gameAudio.playTap();
    const fallback = defaultImage || MASTERPIECE_CANVASES[0].url;
    setActiveImage(fallback);
    setSelectedPresetId(MASTERPIECE_CANVASES[0].id);
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
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

  // Scale formula: smooth exponential growth from 1 to 32
  // At progress = 0: scale = 1
  // At progress = 1: scale = 32 (letter cuts expand completely beyond screen boundaries)
  const scale = 1 + Math.pow(progress, 1.45) * 31;

  // Fade out the overlay at the very end (from progress 0.85 to 1.0) for seamless 100% full-screen photo display
  const overlayOpacity = progress < 0.85 ? 1 : Math.max(0, 1 - (progress - 0.85) / 0.15);

  const currentCanvas = MASTERPIECE_CANVASES.find((m) => m.id === selectedPresetId);

  return (
    <div ref={containerRef} className={`relative w-full ${heightClass}`}>
      {/* Sticky Fullscreen Stage */}
      <div className="sticky top-0 h-[88vh] sm:h-[92vh] md:h-screen w-full overflow-hidden bg-[#0A0914] select-none flex flex-col justify-center items-center">
        {/* SVG Mask Cutout Typography Canvas */}
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

                {/* 2. Black scalable knockout text: cuts a stencil through the surface */}
                <g
                  style={{
                    transformOrigin: '600px 350px',
                    transform: `scale(${scale})`,
                    transition: isManualControl ? 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
                  }}
                >
                  {/* Monumental Main Cutout Title */}
                  <text
                    x="600"
                    y="330"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="black"
                    fontFamily="'Playfair Display', 'Noto Serif SC', 'Songti SC', Georgia, serif"
                    fontWeight="900"
                    fontSize="130"
                    letterSpacing="8"
                  >
                    {mainTitle}
                  </text>

                  {/* Elegant Secondary Cutout Subtitle */}
                  {subtitle && (
                    <text
                      x="600"
                      y="420"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="black"
                      fontFamily="'Playfair Display', 'Noto Serif SC', 'Plus Jakarta Sans', sans-serif"
                      fontWeight="700"
                      fontSize="36"
                      letterSpacing="12"
                    >
                      {subtitle}
                    </text>
                  )}
                </g>
              </mask>
            </defs>

            {/* Underlying Full-Bleed Masterpiece Artwork */}
            <image
              href={activeImage}
              x="0"
              y="0"
              width="1200"
              height="700"
              preserveAspectRatio="xMidYMid slice"
              style={{
                transformOrigin: '600px 350px',
                transform: `scale(${1 + progress * 0.12})`,
                transition: isManualControl ? 'transform 0.4s ease-out' : 'none',
              }}
            />

            {/* Top Nocturnal Obsidian Surface with Knockout Mask applied */}
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
          </svg>
        </div>

        {/* Top Fine Art Header Bar on Viewport */}
        <div
          className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-auto transition-opacity duration-300"
          style={{ opacity: Math.max(0.2, 1 - progress * 1.5) }}
        >
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="font-mono text-[11px] tracking-wider text-amber-200">
              {tagline}
            </span>
          </div>

          {enableImagePicker && (
            <button
              onClick={() => {
                gameAudio.playTap();
                setIsPickerOpen(true);
              }}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 via-white/15 to-amber-500/20 hover:bg-white/25 backdrop-blur-md border border-amber-300/40 text-white text-xs font-semibold transition-all cursor-pointer shadow-lg active:scale-95 group"
            >
              <Palette className="w-3.5 h-3.5 text-amber-300 group-hover:rotate-45 transition-transform" />
              <span className="text-amber-100">更换/上传底图</span>
            </button>
          )}
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
              <span>下滑：文字放大铺满全屏</span>
              <span className="text-stone-500">·</span>
              <span>上滑：照片收回字里</span>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-stone-400 animate-bounce">
              <ChevronDown className="w-4 h-4 text-amber-300" />
            </div>
          </div>
        </div>

        {/* Bottom Floating Interactive Control Cockpit */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 px-4 py-2 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/20 shadow-2xl text-white text-xs">
          {/* Zoom Progress Percent */}
          <div className="flex items-center gap-2 font-mono text-[11px] text-amber-200">
            <Eye className="w-3.5 h-3.5 text-amber-400" />
            <span className="w-12 text-right">{Math.round(progress * 100)}%</span>
          </div>

          {/* Interactive Manual Scrubber */}
          <input
            type="range"
            min="0"
            max="1"
            step="0.005"
            value={progress}
            onChange={(e) => {
              setIsManualControl(true);
              setProgress(parseFloat(e.target.value));
            }}
            onMouseUp={() => setIsManualControl(false)}
            onTouchEnd={() => setIsManualControl(false)}
            className="w-24 sm:w-36 accent-amber-400 cursor-pointer h-1.5 bg-white/20 rounded-lg appearance-none"
            title="手动拖拽文字镂空放大比例"
          />

          {/* One-Click Fullscreen / Contract Button */}
          <button
            onClick={handleToggleExpand}
            className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 border border-white/20 text-white transition-all cursor-pointer flex items-center gap-1 active:scale-95"
            title={progress > 0.5 ? '收回至字形' : '一键全屏铺满'}
          >
            {progress > 0.5 ? (
              <>
                <Minimize2 className="w-3.5 h-3.5 text-amber-300" />
                <span className="text-[10px] hidden sm:inline">收回</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-amber-300" />
                <span className="text-[10px] hidden sm:inline">全屏</span>
              </>
            )}
          </button>

          {/* Current Canvas Badge */}
          <div className="hidden md:flex items-center gap-1.5 pl-2 border-l border-white/20 text-[11px] text-stone-300">
            <span className="truncate max-w-[140px]">
              {selectedPresetId === 'custom' ? '自定义照片' : currentCanvas?.title || '艺术画卷'}
            </span>
          </div>
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

      {/* Art Canvases & Custom Photo Upload Modal */}
      {isPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-2xl rounded-3xl bg-[#121024] border border-amber-400/40 shadow-2xl p-6 sm:p-8 space-y-6 text-white animate-stageEnter max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-300/40 flex items-center justify-center text-amber-300 shadow-md">
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif-editorial text-lg sm:text-xl font-bold text-white">
                    艺术底图与自选照片设置
                  </h3>
                  <p className="text-xs text-stone-300 mt-0.5">
                    选择大师艺术典藏，或从手机/电脑上传您专属的照片透过大标题呈现。
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsPickerOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Custom Upload Trigger Block */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-900/40 via-indigo-900/30 to-amber-900/30 border border-amber-400/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-amber-300 shrink-0">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">上传您自己的私人照片</h4>
                  <p className="text-xs text-stone-300 mt-0.5">
                    支持任意风景、艺术摄影或人像，将在本地自动持久化保存。
                  </p>
                </div>
              </div>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-bold text-xs transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer shrink-0 active:scale-95"
              >
                <Upload className="w-4 h-4" />
                <span>选择本地图片</span>
              </button>
            </div>

            {/* Curated Masterpiece Canvases Gallery */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-stone-300">
                <span className="font-serif-editorial font-bold text-amber-200">
                  ✦ 精选世界大师艺术画卷 (6 幅典藏)
                </span>
                {selectedPresetId === 'custom' && (
                  <button
                    onClick={handleResetToDefault}
                    className="text-stone-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>恢复默认画作</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {MASTERPIECE_CANVASES.map((canvas) => {
                  const isSelected = activeImage === canvas.url;
                  return (
                    <div
                      key={canvas.id}
                      onClick={() => handleSelectPreset(canvas)}
                      className={`group relative rounded-2xl p-3 border overflow-hidden cursor-pointer transition-all duration-200 flex gap-3 ${
                        isSelected
                          ? 'bg-white/15 border-amber-400 ring-2 ring-amber-400/40 shadow-lg'
                          : 'bg-white/5 border-white/10 hover:border-white/30 hover:bg-white/10'
                      }`}
                    >
                      {/* Thumbnail with text preview */}
                      <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 relative bg-black/40">
                        <img
                          src={canvas.url}
                          alt={canvas.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {isSelected && (
                          <div className="absolute inset-0 bg-amber-500/30 flex items-center justify-center">
                            <Check className="w-5 h-5 text-white stroke-[3]" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1 flex flex-col justify-between py-0.5">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: canvas.accentColor }}
                            />
                            <h4 className="font-bold text-xs text-white truncate">
                              {canvas.title}
                            </h4>
                          </div>
                          <span className="text-[10px] text-amber-200/80 block mt-0.5 font-serif-editorial truncate">
                            {canvas.artist} · {canvas.era}
                          </span>
                        </div>

                        <p className="text-[11px] text-stone-300 line-clamp-1 mt-1">
                          {canvas.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-white/10">
              <button
                onClick={() => setIsPickerOpen(false)}
                className="px-6 py-2.5 rounded-xl bg-white text-stone-900 font-bold text-xs hover:bg-stone-200 transition-colors cursor-pointer shadow-md"
              >
                完成设置
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  Volume1,
  Play,
  Pause,
  CloudRain,
  Trees,
  Radio,
  Waves,
  Sparkles,
  Compass,
  Headphones,
  Sliders,
  Check,
  ShieldCheck,
  Flame,
  Zap,
  Info,
  ChevronRight,
  Maximize2,
  RotateCcw,
} from 'lucide-react';
import {
  ambientSound,
  SOUNDSCAPE_PRESETS,
  SoundscapeInfo,
} from '../../utils/ambientSoundEngine';
import { gameAudio } from '../../utils/gameAudio';

export interface MeditationAudioLibraryProps {
  className?: string;
  variant?: 'full-shelf' | 'modal' | 'compact-card';
  isOpen?: boolean;
  onClose?: () => void;
  onSoundscapeChange?: (soundscapeId: string, isPlaying: boolean) => void;
}

export const MeditationAudioLibrary: React.FC<MeditationAudioLibraryProps> = ({
  className = '',
  variant = 'full-shelf',
  isOpen = false,
  onClose,
  onSoundscapeChange,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(ambientSound.isPlaying());
  const [activeId, setActiveId] = useState<string>(ambientSound.getActiveSoundscapeId());
  const [volume, setVolume] = useState<number>(ambientSound.getVolume());
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [prevVolume, setPrevVolume] = useState<number>(volume || 0.65);
  const [autoSync, setAutoSync] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('mindlabz_ambient_autosync');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'all' | 'nature' | 'mindfulness' | 'focus'>('all');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Subscribe to ambientSound changes
  useEffect(() => {
    const unsubscribe = ambientSound.subscribe((playing, currentId, vol) => {
      setIsPlaying(playing);
      setActiveId(currentId);
      setVolume(vol);
      onSoundscapeChange?.(currentId, playing);
    });
    return unsubscribe;
  }, [onSoundscapeChange]);

  const showToast = (text: string) => {
    setToastMsg(text);
    setTimeout(() => {
      setToastMsg((prev) => (prev === text ? null : prev));
    }, 2400);
  };

  const handleToggleMasterPlay = () => {
    gameAudio.playTap();
    const next = ambientSound.togglePlay();
    if (next) {
      showToast(`已开始播放：${activeSoundscape.name.split('·')[0].trim()}`);
    } else {
      showToast('已暂停背景冥想音效');
    }
  };

  const handleSelectSoundscape = (soundscape: SoundscapeInfo) => {
    gameAudio.playTap();
    ambientSound.play(soundscape.id);
    showToast(`已选用并播放：${soundscape.name}`);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (val > 0) setIsMuted(false);
    ambientSound.setVolume(val);
  };

  const handleToggleMute = () => {
    gameAudio.playTap();
    if (isMuted || volume === 0) {
      const restored = prevVolume > 0 ? prevVolume : 0.65;
      setVolume(restored);
      setIsMuted(false);
      ambientSound.setVolume(restored);
    } else {
      setPrevVolume(volume);
      setIsMuted(true);
      ambientSound.setVolume(0);
    }
  };

  const handleToggleAutoSync = () => {
    gameAudio.playTap();
    const next = !autoSync;
    setAutoSync(next);
    try {
      localStorage.setItem('mindlabz_ambient_autosync', String(next));
    } catch {
      // ignore
    }
    showToast(next ? '已开启：呼吸开始时自动同步播放背景音' : '已关闭呼吸自动联动');
  };

  const activeSoundscape =
    SOUNDSCAPE_PRESETS.find((s) => s.id === activeId) || SOUNDSCAPE_PRESETS[0];

  const getPresetIcon = (iconName: SoundscapeInfo['iconName'], className: string) => {
    switch (iconName) {
      case 'rain':
        return <CloudRain className={className} />;
      case 'forest':
        return <Trees className={className} />;
      case 'whitenoise':
        return <Radio className={className} />;
      case 'ocean':
        return <Waves className={className} />;
      case 'zen':
        return <Sparkles className={className} />;
      case 'cosmic':
        return <Compass className={className} />;
      default:
        return <Headphones className={className} />;
    }
  };

  // Curated category filter
  const filteredPresets = SOUNDSCAPE_PRESETS.filter((p) => {
    if (activeCategoryFilter === 'nature') {
      return p.id === 'rain' || p.id === 'forest' || p.id === 'ocean';
    }
    if (activeCategoryFilter === 'focus') {
      return p.id === 'whitenoise' || p.id === 'cosmic';
    }
    if (activeCategoryFilter === 'mindfulness') {
      return p.id === 'zen' || p.id === 'forest' || p.id === 'rain';
    }
    return true;
  });

  const content = (
    <div className="space-y-6">
      {/* Toast popup */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900/95 text-stone-100 text-xs px-4 py-2.5 rounded-xl shadow-2xl border border-stone-700/60 backdrop-blur-md animate-fadeIn flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-stone-500 font-medium mb-1">
            <span className="editorial-kicker text-[10px] text-stone-700 tracking-widest">
              Acoustic Mindfulness · 背景冥想音频库
            </span>
            <span className="text-stone-300">/</span>
            <span className="font-serif-editorial italic text-stone-600">
              Procedural Soundscapes
            </span>
          </div>
          <h3 className="font-serif-editorial text-lg sm:text-xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
            <Headphones className="w-5 h-5 text-stone-700 stroke-[1.8]" />
            <span>专注冥想自然环境音（Ambient Soundscape）</span>
          </h3>
          <p className="text-xs text-stone-600 mt-1 max-w-xl">
            精选雨声、森林、白噪音等高沉浸自然声景，平抑交感神经紧张反应，让呼吸训练深层入境。
          </p>
        </div>

        {/* Master Control Capsule */}
        <div className="flex items-center gap-3 shrink-0 self-start sm:self-center bg-stone-100/90 border border-stone-200 p-2 rounded-2xl">
          {/* Master Play/Pause Toggle */}
          <button
            onClick={handleToggleMasterPlay}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95 ${
              isPlaying
                ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                : 'bg-stone-900 text-white hover:bg-stone-800'
            }`}
            title={isPlaying ? '暂停环境音' : '播放当前选中的环境音'}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>暂停音效</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>播放音景</span>
              </>
            )}
          </button>

          {/* Volume Control */}
          <div className="flex items-center gap-2 px-1">
            <button
              onClick={handleToggleMute}
              className="text-stone-500 hover:text-stone-800 transition-colors p-1 rounded-lg hover:bg-stone-200/60 cursor-pointer"
              title={volume === 0 || isMuted ? '解除静音' : '静音'}
            >
              {volume === 0 || isMuted ? (
                <VolumeX className="w-4 h-4 text-stone-400" />
              ) : volume < 0.5 ? (
                <Volume1 className="w-4 h-4 text-stone-600" />
              ) : (
                <Volume2 className="w-4 h-4 text-stone-700" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.02"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-16 sm:w-20 accent-emerald-600 cursor-pointer h-1.5 bg-stone-300 rounded-lg"
              title={`音量: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
            />
            <span className="text-[10px] font-mono font-semibold text-stone-500 w-7">
              {Math.round((isMuted ? 0 : volume) * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Auto-Sync Switch */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl">
          {[
            { id: 'all', label: '全部音景 (6)' },
            { id: 'nature', label: '自然生态 (雨声/森林/海浪)' },
            { id: 'focus', label: '深度专注 (白噪音/Alpha波)' },
            { id: 'mindfulness', label: '正念静心 (颂钵/雨声)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                gameAudio.playTap();
                setActiveCategoryFilter(tab.id as typeof activeCategoryFilter);
              }}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer font-medium text-[11px] ${
                activeCategoryFilter === tab.id
                  ? 'bg-white text-stone-900 font-bold shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Breathing Auto-Sync Toggle Button */}
        <button
          onClick={handleToggleAutoSync}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
            autoSync
              ? 'bg-emerald-50/80 border-emerald-300 text-emerald-800 shadow-xs'
              : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
          }`}
          title="呼吸练习开始时自动伴随背景环境音"
        >
          <div
            className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${
              autoSync ? 'bg-emerald-600 text-white' : 'bg-stone-300 text-stone-600'
            }`}
          >
            {autoSync ? '✓' : ''}
          </div>
          <span className="text-[11px]">与呼吸训练自动起止联动</span>
        </button>
      </div>

      {/* Soundscape Presets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredPresets.map((preset) => {
          const isCurrentActive = activeId === preset.id;
          const isCurrentPlaying = isCurrentActive && isPlaying;

          return (
            <div
              key={preset.id}
              onClick={() => handleSelectSoundscape(preset)}
              className={`group relative p-4 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col justify-between ${
                isCurrentActive
                  ? 'bg-gradient-to-br from-stone-900 to-stone-950 text-white border-stone-800 shadow-xl ring-2 ring-emerald-500/30'
                  : 'bg-white hover:bg-stone-50/80 text-stone-800 border-stone-200/90 shadow-xs hover:border-stone-300 hover:shadow-md'
              }`}
            >
              {/* Top Row: Icon + Name + Active Equalizer / Status */}
              <div>
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                        isCurrentActive
                          ? 'bg-white/15 text-white shadow-inner'
                          : 'bg-stone-100 group-hover:bg-stone-200/80 text-stone-700'
                      }`}
                      style={{
                        color: isCurrentActive ? preset.accentColor : undefined,
                      }}
                    >
                      {getPresetIcon(preset.iconName, 'w-5 h-5')}
                    </div>
                    <div>
                      <h4 className="font-serif-editorial text-sm font-bold tracking-tight leading-snug">
                        {preset.name}
                      </h4>
                      <span
                        className={`text-[10px] font-mono tracking-wide ${
                          isCurrentActive ? 'text-stone-400' : 'text-stone-400'
                        }`}
                      >
                        {preset.subtitle}
                      </span>
                    </div>
                  </div>

                  {/* Badge & Playing Indicator */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full font-semibold ${
                        isCurrentActive
                          ? 'bg-white/20 text-stone-200'
                          : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      {preset.tag}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p
                  className={`text-[11px] leading-relaxed line-clamp-2 mt-1 ${
                    isCurrentActive ? 'text-stone-300' : 'text-stone-600'
                  }`}
                >
                  {preset.description}
                </p>
              </div>

              {/* Bottom Row: Action and Sound Status */}
              <div
                className={`mt-4 pt-3 flex items-center justify-between border-t text-xs ${
                  isCurrentActive ? 'border-white/10' : 'border-stone-100'
                }`}
              >
                {/* Visualizer bars or status label */}
                <div className="flex items-center gap-2">
                  {isCurrentPlaying ? (
                    <div className="flex items-center gap-1 h-3.5">
                      <span className="w-1 bg-emerald-400 rounded-full animate-soundWave1" />
                      <span className="w-1 bg-emerald-400 rounded-full animate-soundWave2" />
                      <span className="w-1 bg-emerald-400 rounded-full animate-soundWave3" />
                      <span className="w-1 bg-emerald-400 rounded-full animate-soundWave4" />
                      <span className="text-[10px] font-bold text-emerald-400 ml-1">
                        正在播放
                      </span>
                    </div>
                  ) : isCurrentActive ? (
                    <span className="text-[10px] text-stone-400 font-mono">
                      已选中 · 待播放
                    </span>
                  ) : (
                    <span className="text-[10px] text-stone-400 font-mono">
                      点击选用
                    </span>
                  )}
                </div>

                {/* Instant Play Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isCurrentActive && isPlaying) {
                      gameAudio.playTap();
                      ambientSound.stop();
                      showToast(`已暂停：${preset.name.split('·')[0].trim()}`);
                    } else {
                      handleSelectSoundscape(preset);
                    }
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                    isCurrentPlaying
                      ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-400/40'
                      : isCurrentActive
                      ? 'bg-white/10 text-white hover:bg-white/20'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                  }`}
                >
                  {isCurrentPlaying ? (
                    <>
                      <Pause className="w-3 h-3 fill-current" />
                      <span>暂停</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 fill-current" />
                      <span>{isCurrentActive ? '播放' : '选用'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Scientific Neuro-Acoustic Box */}
      <div className="editorial-card rounded-2xl p-5 bg-gradient-to-r from-stone-50 via-emerald-50/30 to-amber-50/20 border border-stone-200/90 text-xs text-stone-700 space-y-2">
        <div className="flex items-center gap-2 font-bold text-stone-900">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>神经声学共振原理（Neuro-Acoustic Somatic Coupling）</span>
        </div>
        <p className="text-[11px] text-stone-600 leading-relaxed">
          实验表明，自然粉红噪声与环境音（如持续落雨、风吹松针、温和白噪音）可有效衰减前额叶由于突发背景杂音产生的「定向反射应激反应（Orienting Reflex）」，促使脑电波自高频 Beta 波平缓过渡至 8~12Hz 的 Alpha 波，与深长呼吸形成身心双重协同共振。
        </p>
        <div className="flex flex-wrap items-center gap-2 text-[10px] text-stone-500 pt-1 font-mono">
          <span className="bg-white/80 px-2 py-0.5 rounded border border-stone-200">
            🌧️ 细雨：阻隔外界杂音
          </span>
          <span className="bg-white/80 px-2 py-0.5 rounded border border-stone-200">
            🌲 松风：激活副交感迷走
          </span>
          <span className="bg-white/80 px-2 py-0.5 rounded border border-stone-200">
            📻 白噪：建立无干扰专注结界
          </span>
          <span className="bg-white/80 px-2 py-0.5 rounded border border-stone-200">
            🧘 颂钵：432Hz共振
          </span>
        </div>
      </div>
    </div>
  );

  if (variant === 'modal') {
    if (!isOpen) return null;
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-stone-900/65 backdrop-blur-md animate-fadeIn overflow-y-auto"
        onClick={onClose}
      >
        <div
          className="relative w-full max-w-3xl bg-[#FAF8F5] rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-auto p-6 sm:p-8 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-end pb-2">
            <button
              onClick={onClose}
              className="text-stone-500 hover:text-stone-900 p-1.5 rounded-full hover:bg-stone-200/60 transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>
          {content}
        </div>
      </div>
    );
  }

  return (
    <section className={`editorial-card rounded-3xl p-6 sm:p-8 bg-[#FAF8F5] border border-stone-200 ${className}`}>
      {content}
    </section>
  );
};

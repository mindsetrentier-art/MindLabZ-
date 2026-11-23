import React, { useState, useEffect, useRef } from 'react';
import {
  Headphones,
  Play,
  Pause,
  Volume2,
  Volume1,
  VolumeX,
  CloudRain,
  Trees,
  Waves,
  Sparkles,
  Radio,
  Compass,
  Bell,
  BellOff,
  X,
} from 'lucide-react';
import {
  ambientSound,
  SOUNDSCAPE_PRESETS,
  SoundscapeInfo,
} from '../../utils/ambientSoundEngine';
import { breathingAudio } from '../../utils/breathingAudio';
import { gameAudio } from '../../utils/gameAudio';

interface BreathingAudioGuideOverlayProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

export const BreathingAudioGuideOverlay: React.FC<BreathingAudioGuideOverlayProps> = ({
  isOpen,
  onOpen,
  onClose,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(ambientSound.isPlaying());
  const [activeId, setActiveId] = useState<string>(ambientSound.getActiveSoundscapeId());
  const [volume, setVolume] = useState<number>(ambientSound.getVolume());
  const [isMuted, setIsMuted] = useState<boolean>(ambientSound.getVolume() === 0);
  const [guideChimeMuted, setGuideChimeMuted] = useState<boolean>(breathingAudio.getMuted());
  const prevVolumeRef = useRef<number>(ambientSound.getVolume() || 0.65);

  useEffect(() => {
    const unsubscribe = ambientSound.subscribe((playing, currentId, vol) => {
      setIsPlaying(playing);
      setActiveId(currentId);
      setVolume(vol);
      setIsMuted(vol === 0);
      if (vol > 0) {
        prevVolumeRef.current = vol;
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const activePreset =
    SOUNDSCAPE_PRESETS.find((item) => item.id === activeId) || SOUNDSCAPE_PRESETS[0];

  const renderPresetIcon = (iconName: SoundscapeInfo['iconName'], className: string) => {
    switch (iconName) {
      case 'rain':
        return <CloudRain className={className} aria-hidden="true" />;
      case 'forest':
        return <Trees className={className} aria-hidden="true" />;
      case 'ocean':
        return <Waves className={className} aria-hidden="true" />;
      case 'zen':
        return <Sparkles className={className} aria-hidden="true" />;
      case 'whitenoise':
        return <Radio className={className} aria-hidden="true" />;
      case 'cosmic':
      default:
        return <Compass className={className} aria-hidden="true" />;
    }
  };

  const handleTogglePlay = () => {
    gameAudio.playTap();
    ambientSound.togglePlay();
  };

  const handleSelectPreset = (preset: SoundscapeInfo) => {
    gameAudio.playTap();
    ambientSound.play(preset.id);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextVol = parseFloat(e.target.value);
    setVolume(nextVol);
    setIsMuted(nextVol === 0);
    if (nextVol > 0) {
      prevVolumeRef.current = nextVol;
    }
    ambientSound.setVolume(nextVol);
  };

  const handleToggleMute = () => {
    gameAudio.playTap();
    if (isMuted || volume === 0) {
      const restored = prevVolumeRef.current > 0 ? prevVolumeRef.current : 0.65;
      setVolume(restored);
      setIsMuted(false);
      ambientSound.setVolume(restored);
    } else {
      prevVolumeRef.current = volume;
      setVolume(0);
      setIsMuted(true);
      ambientSound.setVolume(0);
    }
  };

  const handleToggleGuideChimes = () => {
    gameAudio.playTap();
    const nextMuted = !guideChimeMuted;
    breathingAudio.setMuted(nextMuted);
    setGuideChimeMuted(nextMuted);
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => {
          gameAudio.playTap();
          onOpen();
        }}
        className="fixed left-3.5 sm:left-6 md:left-10 bottom-20 sm:bottom-24 z-30 h-11 px-3.5 rounded-full bg-[#FDFBF7]/92 backdrop-blur-xl border border-stone-200/90 shadow-[0_10px_28px_-8px_rgba(28,25,23,0.18)] text-[#1C1917] hover:border-stone-400 transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#532CD8]"
        aria-label="打开音频引导面板"
      >
        <Headphones className="w-4 h-4 text-[#0F766E] shrink-0" aria-hidden="true" />
        <span className="text-xs font-semibold">
          {isPlaying && !isMuted
            ? activePreset.name.split('·')[0].trim()
            : 'Audio Guide'}
        </span>
      </button>
    );
  }

  const effectivePercent = Math.round((isMuted ? 0 : volume) * 100);

  return (
    <>
      {/* Subtle mobile backdrop for clean dismissal */}
      <div
        className="fixed inset-0 z-30 bg-[#1C1917]/20 backdrop-blur-[1px] sm:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        role="region"
        aria-label="Audio Guide 自然声景引导"
        className="fixed z-40 left-3.5 right-3.5 bottom-20 sm:left-6 sm:right-auto md:left-10 sm:bottom-24 sm:w-[348px] bg-[#FDFBF7]/95 backdrop-blur-xl border border-stone-200/90 shadow-[0_20px_50px_-14px_rgba(28,25,23,0.22)] rounded-2xl overflow-hidden animate-fadeIn"
      >
        <div className="p-4 space-y-3.5">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-stone-200/80">
            <div className="flex items-center gap-2 min-w-0">
              <Headphones className="w-4 h-4 text-[#0F766E] shrink-0" aria-hidden="true" />
              <div className="min-w-0">
                <div className="text-xs font-bold text-[#1C1917] truncate">
                  Audio Guide · 自然声景引导
                </div>
                <div className="text-[11px] text-stone-500 truncate">
                  {activePreset.subtitle}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                gameAudio.playTap();
                onClose();
              }}
              className="w-8 h-8 -mr-1 rounded-lg flex items-center justify-center text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#532CD8]"
              aria-label="收起 Audio Guide 浮层"
              title="收起"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Active Track + Play/Pause Control */}
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs font-semibold text-[#1C1917] truncate">
                {activePreset.name}
              </div>
              <div className="text-[11px] text-stone-500 truncate">
                {isPlaying && !isMuted ? '正在播放自然环绕声景' : '已暂停 · 点击播放开始放松'}
              </div>
            </div>

            <button
              type="button"
              onClick={handleTogglePlay}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#532CD8] ${
                isPlaying
                  ? 'bg-[#0F766E] text-white hover:bg-[#0D9488]'
                  : 'bg-[#1C1917] text-[#FAF8F5] hover:bg-[#0F766E]'
              }`}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current shrink-0" />
                  <span>暂停声景</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current shrink-0" />
                  <span>播放声景</span>
                </>
              )}
            </button>
          </div>

          {/* Nature Soundscape Selector Grid */}
          <div className="grid grid-cols-2 gap-1.5">
            {SOUNDSCAPE_PRESETS.map((preset) => {
              const selected = activeId === preset.id;
              const shortTitle = preset.name.split('·')[0].trim();

              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`px-2.5 py-2 rounded-xl border text-left transition-colors flex items-center gap-2 min-w-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#532CD8] ${
                    selected
                      ? 'bg-[#0F766E]/10 border-[#0F766E] text-[#1C1917] font-semibold'
                      : 'bg-white border-stone-200/80 text-stone-700 hover:border-stone-400 hover:text-[#1C1917]'
                  }`}
                >
                  {renderPresetIcon(
                    preset.iconName,
                    `w-3.5 h-3.5 shrink-0 ${
                      selected ? 'text-[#0F766E]' : 'text-stone-500'
                    }`
                  )}
                  <span className="text-xs truncate">{shortTitle}</span>
                </button>
              );
            })}
          </div>

          {/* Volume Control Slider & Mute */}
          <div className="pt-2 border-t border-stone-200/80 space-y-2.5">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleToggleMute}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-600 hover:text-[#1C1917] hover:bg-stone-100 transition-colors shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#532CD8]"
                aria-label={isMuted ? '恢复音量' : '静音'}
                title={isMuted ? '恢复音量' : '静音'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-rose-600" />
                ) : volume < 0.5 ? (
                  <Volume1 className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>

              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                aria-label="自然声景音量调节"
                className="flex-1 h-1.5 bg-stone-200 rounded-full appearance-none cursor-pointer accent-[#0F766E]"
              />

              <span className="w-9 text-right text-xs font-numeric tabular-nums font-semibold text-stone-700 shrink-0">
                {effectivePercent}%
              </span>
            </div>

            {/* Breathing Phase Bell Guide Toggle */}
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="text-stone-600">吸气 / 屏息 / 呼气提示音</span>
              <button
                type="button"
                onClick={handleToggleGuideChimes}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#532CD8] ${
                  !guideChimeMuted
                    ? 'bg-white border-stone-300 text-[#1C1917]'
                    : 'bg-stone-100 border-stone-200 text-stone-500'
                }`}
              >
                {!guideChimeMuted ? (
                  <>
                    <Bell className="w-3 h-3 text-[#0F766E] shrink-0" />
                    <span>已开启</span>
                  </>
                ) : (
                  <>
                    <BellOff className="w-3 h-3 shrink-0" />
                    <span>已静音</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

import React, { useState, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  Volume1,
  Trees,
  Sparkles,
  Waves,
  Compass,
  CloudRain,
  ChevronDown,
  X,
  Play,
  Pause,
  Headphones,
  Sliders,
  Check,
} from 'lucide-react';
import { ambientSound, SOUNDSCAPE_PRESETS, SoundscapeInfo } from '../../utils/ambientSoundEngine';
import { gameAudio } from '../../utils/gameAudio';

interface AmbientSoundscapeControlProps {
  className?: string;
  variant?: 'floating-capsule' | 'inline-card' | 'minimal-pill';
}

export const AmbientSoundscapeControl: React.FC<AmbientSoundscapeControlProps> = ({
  className = '',
  variant = 'floating-capsule',
}) => {
  const [isPlaying, setIsPlaying] = useState(ambientSound.isPlaying());
  const [activeId, setActiveId] = useState(ambientSound.getActiveSoundscapeId());
  const [volume, setVolume] = useState(ambientSound.getVolume());
  const [isOpen, setIsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = ambientSound.subscribe((playing, currentId, vol) => {
      setIsPlaying(playing);
      setActiveId(currentId);
      setVolume(vol);
    });
    return unsubscribe;
  }, []);

  const activeSoundscape =
    SOUNDSCAPE_PRESETS.find((s) => s.id === activeId) || SOUNDSCAPE_PRESETS[0];

  const handleTogglePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    gameAudio.playTap();
    const nextState = ambientSound.togglePlay();
    if (nextState) {
      showToast(`已开启环境音景：${activeSoundscape.name.split('·')[0].trim()}`);
    } else {
      showToast('已暂停背景环境音景');
    }
  };

  const handleSelectSoundscape = (soundscape: SoundscapeInfo) => {
    gameAudio.playTap();
    ambientSound.play(soundscape.id);
    showToast(`已切换至：${soundscape.name}`);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    ambientSound.setVolume(val);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2500);
  };

  const getIcon = (iconName: SoundscapeInfo['iconName'], className: string) => {
    switch (iconName) {
      case 'forest':
        return <Trees className={className} />;
      case 'zen':
        return <Sparkles className={className} />;
      case 'ocean':
        return <Waves className={className} />;
      case 'cosmic':
        return <Compass className={className} />;
      case 'rain':
        return <CloudRain className={className} />;
      default:
        return <Headphones className={className} />;
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* 1. Main Floating Capsule Switch */}
      <div
        className={`flex items-center rounded-full backdrop-blur-xl border transition-all duration-300 shadow-xl p-0.5 text-xs ${
          isPlaying
            ? 'bg-black/80 hover:bg-black/95 border-emerald-400/60 text-white shadow-emerald-500/20'
            : 'bg-black/65 hover:bg-black/85 border-white/20 text-stone-300'
        }`}
      >
        {/* Play / Pause Quick Action */}
        <button
          onClick={handleTogglePlay}
          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
            isPlaying
              ? 'bg-emerald-500 text-stone-950 hover:bg-emerald-400 shadow-xs'
              : 'bg-white/10 text-stone-300 hover:text-white hover:bg-white/20'
          }`}
          title={isPlaying ? '暂停环境音景' : '开启环境音景（静谧森林 / 禅意空间）'}
          aria-label={isPlaying ? '暂停环境音景' : '开启环境音景'}
        >
          {isPlaying ? (
            <Pause className="w-3.5 h-3.5 fill-current" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current translate-x-0.5" />
          )}
        </button>

        {/* Info Capsule Trigger for Popover */}
        <button
          onClick={() => {
            gameAudio.playTap();
            setIsOpen((prev) => !prev);
          }}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold cursor-pointer transition-colors"
          title="选择环境音景与调节音量"
        >
          {isPlaying ? (
            /* Animated Equalizer Wavebars */
            <div className="flex items-center gap-0.5 h-3.5 px-0.5">
              <span className="w-0.5 bg-emerald-400 rounded-full animate-soundWave1" />
              <span className="w-0.5 bg-emerald-400 rounded-full animate-soundWave2" />
              <span className="w-0.5 bg-emerald-400 rounded-full animate-soundWave3" />
              <span className="w-0.5 bg-emerald-400 rounded-full animate-soundWave4" />
            </div>
          ) : (
            <Headphones className="w-3.5 h-3.5 text-stone-400" />
          )}

          <span
            className={`font-serif-editorial truncate max-w-[85px] sm:max-w-none ${
              isPlaying ? 'text-emerald-300 font-bold' : 'text-stone-300'
            }`}
          >
            {isPlaying ? activeSoundscape.name.split('·')[0].trim() : '环境音景'}
          </span>

          <span
            className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
              isPlaying
                ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30'
                : 'bg-white/10 text-stone-400'
            }`}
          >
            {isPlaying ? 'ON' : 'OFF'}
          </span>

          <ChevronDown
            className={`w-3 h-3 text-stone-400 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>
      </div>

      {/* Outside click backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/35 backdrop-blur-[1px]"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* 2. Floating Popover Drawer / Soundscape Selector */}
      {isOpen && (
        <div className="absolute right-0 top-11 z-50 w-[320px] sm:w-[380px] rounded-3xl bg-[#0D0B1C]/98 backdrop-blur-2xl border border-emerald-400/40 shadow-2xl p-4 sm:p-5 space-y-4 text-white animate-stageEnter">
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center border border-emerald-400/30">
                <Headphones className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-serif-editorial font-bold text-xs sm:text-sm text-white">
                    心智沉浸 · 环境音景
                  </h4>
                  <span className="px-1.5 py-0.2 rounded bg-emerald-400/20 text-emerald-300 text-[10px] font-mono border border-emerald-400/30">
                    5 SCAPES
                  </span>
                </div>
                <p className="text-[10px] text-stone-400 mt-0.5">
                  滑动镂空标题与研习心理学时 · 置身深邃沉浸声场
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 rounded-full flex items-center justify-center text-stone-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="关闭"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Master Switch & Volume Slider */}
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleTogglePlay}
                  className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isPlaying
                      ? 'bg-emerald-500 text-stone-950 shadow-md'
                      : 'bg-white/10 text-stone-300 hover:bg-white/20'
                  }`}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-3 h-3 fill-current" />
                      <span>播放中</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 fill-current" />
                      <span>开启音景</span>
                    </>
                  )}
                </button>
                <span className="text-[11px] text-stone-400 font-mono">
                  {isPlaying ? activeSoundscape.name.split('·')[0].trim() : '已静音'}
                </span>
              </div>

              <div className="flex items-center gap-1.5 font-mono text-[11px] text-emerald-300">
                {volume === 0 ? (
                  <VolumeX className="w-3.5 h-3.5 text-stone-500" />
                ) : volume < 0.5 ? (
                  <Volume1 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span>{Math.round(volume * 100)}%</span>
              </div>
            </div>

            {/* Volume Range Slider */}
            <div className="flex items-center gap-2 pt-0.5">
              <VolumeX className="w-3 h-3 text-stone-500 shrink-0" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.02"
                value={volume}
                onChange={handleVolumeChange}
                className="w-full h-1.5 bg-white/15 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                title="音景音量调节"
              />
              <Volume2 className="w-3 h-3 text-stone-400 shrink-0" />
            </div>
          </div>

          {/* Soundscape Preset Cards */}
          <div className="space-y-2 max-h-[250px] overflow-y-auto no-scrollbar pr-0.5">
            {SOUNDSCAPE_PRESETS.map((item) => {
              const isSelected = activeId === item.id;
              const isCurrentPlaying = isSelected && isPlaying;

              return (
                <div
                  key={item.id}
                  onClick={() => handleSelectSoundscape(item)}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 group ${
                    isSelected
                      ? 'bg-emerald-500/15 border-emerald-400/80 ring-1 ring-emerald-400/30 shadow-md'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                      isSelected
                        ? 'bg-emerald-500/25 border-emerald-400 text-emerald-300'
                        : 'bg-white/5 border-white/10 text-stone-400 group-hover:text-stone-200'
                    }`}
                  >
                    {getIcon(item.iconName, 'w-4 h-4')}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`font-bold text-xs ${
                            isSelected ? 'text-white' : 'text-stone-200 group-hover:text-white'
                          }`}
                        >
                          {item.name}
                        </span>
                      </div>
                      <span
                        className="text-[9px] px-1.5 py-0.2 rounded font-mono"
                        style={{
                          backgroundColor: `${item.accentColor}25`,
                          color: item.accentColor,
                          borderColor: `${item.accentColor}40`,
                        }}
                      >
                        {item.tag}
                      </span>
                    </div>

                    <p className="text-[10px] text-stone-400 line-clamp-2 mt-1 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {/* Active Indicator */}
                  <div className="shrink-0 pt-0.5">
                    {isCurrentPlaying ? (
                      <div className="flex items-center gap-0.5 h-3">
                        <span className="w-0.5 bg-emerald-400 rounded-full animate-soundWave1" />
                        <span className="w-0.5 bg-emerald-400 rounded-full animate-soundWave2" />
                        <span className="w-0.5 bg-emerald-400 rounded-full animate-soundWave3" />
                      </div>
                    ) : isSelected ? (
                      <div className="w-4 h-4 rounded-full bg-emerald-500/30 border border-emerald-400 flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-emerald-300" />
                      </div>
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-white/20 group-hover:border-white/40" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Mini Toast notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-stone-900/95 text-white border border-emerald-400/60 shadow-2xl flex items-center gap-2 animate-fadeIn text-xs">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

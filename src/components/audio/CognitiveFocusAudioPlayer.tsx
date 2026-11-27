import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  Pause,
  Volume2,
  Volume1,
  VolumeX,
  Headphones,
  CloudRain,
  Waves,
  Wind,
  Flame,
  AudioWaveform,
  RotateCcw,
  SlidersHorizontal,
  ChevronDown,
  ArrowUpRight,
  Timer,
  BookmarkPlus,
} from 'lucide-react';
import {
  BINAURAL_PRESETS,
  NATURE_PRESETS,
  BinauralPresetId,
  NaturePresetId,
  FocusAudioSnapshot,
  cognitiveFocusAudio,
} from '../../utils/cognitiveFocusAudio';
import { gameAudio } from '../../utils/gameAudio';

interface CognitiveFocusAudioPlayerProps {
  variant?: 'studio' | 'compact';
  className?: string;
  recommendedBinauralId?: BinauralPresetId;
  taskContextLabel?: string;
  onBookmarkTimestamp?: () => void;
}

const TIMER_PRESETS = [
  { minutes: 15, label: '15m' },
  { minutes: 25, label: '25m' },
  { minutes: 45, label: '45m' },
  { minutes: 0, label: '连续' },
];

const formatSeconds = (totalSeconds: number): string => {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const renderNatureIcon = (id: NaturePresetId, cls: string) => {
  switch (id) {
    case 'canopy-rain':
      return <CloudRain className={cls} aria-hidden="true" />;
    case 'ocean-tide':
      return <Waves className={cls} aria-hidden="true" />;
    case 'alpine-stream':
      return <Wind className={cls} aria-hidden="true" />;
    case 'night-hearth':
      return <Flame className={cls} aria-hidden="true" />;
    default:
      return <AudioWaveform className={cls} aria-hidden="true" />;
  }
};

export const CognitiveFocusAudioPlayer: React.FC<CognitiveFocusAudioPlayerProps> = ({
  variant = 'studio',
  className = '',
  recommendedBinauralId,
  taskContextLabel,
  onBookmarkTimestamp,
}) => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [snap, setSnap] = useState<FocusAudioSnapshot>(() => cognitiveFocusAudio.getSnapshot());
  const [compactExpanded, setCompactExpanded] = useState(false);

  useEffect(() => {
    return cognitiveFocusAudio.subscribe(setSnap);
  }, []);

  const activeBinaural =
    BINAURAL_PRESETS.find((p) => p.id === snap.binauralPresetId) || BINAURAL_PRESETS[0];
  const activeNature =
    NATURE_PRESETS.find((n) => n.id === snap.naturePresetId) || NATURE_PRESETS[0];
  const recommendedPreset = recommendedBinauralId
    ? BINAURAL_PRESETS.find((p) => p.id === recommendedBinauralId)
    : undefined;

  // Real-time stereo oscilloscope & beat interference canvas (studio variant)
  useEffect(() => {
    if (variant !== 'studio') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    let rafId: number | null = null;
    let phase = 0;
    const binCount = cognitiveFocusAudio.getAnalyserBinCount();
    const timeBuf = new Uint8Array(new ArrayBuffer(binCount * 2));

    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const cssW = canvas.clientWidth || 480;
      const cssH = canvas.clientHeight || 136;

      if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
        canvas.width = Math.round(cssW * dpr);
        canvas.height = Math.round(cssH * dpr);
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, cssW, cssH);

      // Subtle calibration grid lines
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.14)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, cssH * 0.5);
      ctx.lineTo(cssW, cssH * 0.5);
      ctx.moveTo(0, cssH * 0.25);
      ctx.lineTo(cssW, cssH * 0.25);
      ctx.moveTo(0, cssH * 0.75);
      ctx.lineTo(cssW, cssH * 0.75);
      for (let gx = cssW * 0.25; gx < cssW; gx += cssW * 0.25) {
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, cssH);
      }
      ctx.stroke();

      const hasLiveSignal = cognitiveFocusAudio.getTimeDomainData(timeBuf);

      // Beat interference reference envelope (left & right phase offset visualization)
      const beatRatio = Math.max(1, snap.beatHz / 8);
      const ampMod = snap.isPlaying && !snap.isMuted ? 0.34 : 0.18;

      ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      for (let x = 0; x <= cssW; x += 3) {
        const normX = x / cssW;
        const leftWave = Math.sin(normX * Math.PI * 10 + phase);
        const rightWave = Math.sin(normX * Math.PI * (10 + beatRatio * 0.45) + phase * 1.08);
        const y = cssH / 2 + ((leftWave + rightWave) * 0.5) * (cssH * ampMod);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Primary synthesized output signal (real AnalyserNode time-domain when active)
      ctx.strokeStyle = snap.isPlaying && !snap.isMuted ? activeBinaural.accentColor : '#94A3B8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (hasLiveSignal) {
        const step = cssW / timeBuf.length;
        for (let i = 0; i < timeBuf.length; i++) {
          const sample = (timeBuf[i] - 128) / 128;
          const x = i * step;
          const y = cssH / 2 + sample * (cssH * 0.42);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
      } else {
        for (let x = 0; x <= cssW; x += 2) {
          const normX = x / cssW;
          const y =
            cssH / 2 +
            Math.sin(normX * Math.PI * 6 + phase * 0.7) *
              Math.cos(normX * Math.PI * beatRatio * 0.35) *
              (cssH * 0.14);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
      ctx.restore();

      if (!prefersReducedMotion) {
        phase += snap.isPlaying && !snap.isMuted ? 0.045 : 0.012;
        rafId = window.requestAnimationFrame(draw);
      }
    };

    draw();
    return () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
    };
  }, [variant, snap.isPlaying, snap.isMuted, snap.beatHz, activeBinaural.accentColor]);

  const handleTogglePlay = () => {
    gameAudio.playTap();
    cognitiveFocusAudio.togglePlay();
  };

  const rightFreqHz = (snap.carrierHz + snap.beatHz).toFixed(1);
  const leftFreqHz = snap.carrierHz.toFixed(1);
  const activeTimerLabel =
    snap.timerDurationSec > 0 ? formatSeconds(snap.timerRemainingSec) : '连续播放';

  // =========================================================================
  // COMPACT VARIANT (Designed to sit quietly inside Cognitive Tasks)
  // =========================================================================
  if (variant === 'compact') {
    const needsRecommendationApply =
      recommendedPreset && snap.binauralPresetId !== recommendedPreset.id;

    return (
      <section
        aria-label="认知任务双耳节拍与自然声景播放器"
        className={`rounded-2xl bg-white border border-stone-200/90 shadow-xs text-stone-900 ${className}`}
      >
        <div className="px-3.5 sm:px-4 py-2.5 flex flex-wrap items-center justify-between gap-2.5">
          {/* Transport + Live Signal Label */}
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={handleTogglePlay}
              className={`min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#532CD8] ${
                snap.isPlaying
                  ? 'bg-stone-900 text-white hover:bg-stone-800'
                  : 'bg-stone-100 text-stone-900 hover:bg-stone-200 border border-stone-200'
              }`}
              aria-label={snap.isPlaying ? '暂停专注音频' : '开启专注音频'}
            >
              {snap.isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current shrink-0" aria-hidden="true" />
                  <span>暂停音频</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current shrink-0" aria-hidden="true" />
                  <span>专注声场</span>
                </>
              )}
            </button>

            <div className="min-w-0 flex flex-col">
              <div className="flex items-center gap-2 text-xs font-medium text-stone-800 truncate">
                <span className="font-mono tabular-nums font-semibold text-sky-700">
                  Δf {snap.beatHz.toFixed(1)} Hz
                </span>
                <span className="text-stone-300" aria-hidden="true">·</span>
                <span className="truncate">{activeBinaural.bandLabel}</span>
                <span className="text-stone-300 hidden sm:inline" aria-hidden="true">·</span>
                <span className="hidden sm:inline truncate text-stone-600">
                  {activeNature.nameZh}
                </span>
              </div>
              <div className="text-[11px] text-stone-500 font-mono tabular-nums flex items-center gap-2">
                <span>{snap.isPlaying ? '● 声场运行中' : '○ 待机'}</span>
                <span aria-hidden="true">/</span>
                <span>{activeTimerLabel}</span>
                {taskContextLabel && (
                  <>
                    <span className="hidden md:inline" aria-hidden="true">·</span>
                    <span className="hidden md:inline font-sans text-stone-500 truncate">
                      {taskContextLabel}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Quick Presets & Expand Mixer */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {needsRecommendationApply && recommendedPreset && (
              <button
                type="button"
                onClick={() => {
                  gameAudio.playTap();
                  cognitiveFocusAudio.setBinauralPreset(recommendedPreset.id);
                  if (!snap.isPlaying) cognitiveFocusAudio.play();
                }}
                className="px-2.5 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-800 text-[11px] font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors"
                title={`为当前认知任务切换至推荐脑波：${recommendedPreset.nameZh}`}
              >
                推荐 {recommendedPreset.beatHz}Hz
              </button>
            )}

            {/* Quick Brainwave Selector (Desktop) */}
            <div className="hidden lg:flex items-center gap-1 p-0.5 rounded-lg bg-stone-100 border border-stone-200/80">
              {BINAURAL_PRESETS.map((preset) => {
                const active = snap.binauralPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      gameAudio.playTap();
                      cognitiveFocusAudio.setBinauralPreset(preset.id);
                    }}
                    className={`px-2 py-1 rounded-md text-[11px] font-mono tabular-nums font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    {preset.beatHz}Hz
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => {
                gameAudio.playTap();
                setCompactExpanded((prev) => !prev);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-700 text-xs font-medium flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0 transition-colors"
              aria-expanded={compactExpanded}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span className="hidden sm:inline">混音调节</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  compactExpanded ? 'rotate-180' : ''
                }`}
                aria-hidden="true"
              />
            </button>

            <button
              type="button"
              onClick={() => {
                gameAudio.playTap();
                navigate('/focus-audio');
              }}
              className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer shrink-0"
              title="打开完整专注声学实验室"
              aria-label="打开完整专注声学实验室"
            >
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Expandable Quick Mixer & Preset Shelf */}
        {compactExpanded && (
          <div className="px-4 pb-4 pt-3 border-t border-stone-200/80 bg-stone-50/70 space-y-3.5 rounded-b-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Binaural Band Row */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-stone-600">
                  <span className="font-semibold text-stone-800">双耳脑波频段</span>
                  <span className="font-mono tabular-nums text-[11px]">
                    {Math.round(snap.binauralMix * 100)}%
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {BINAURAL_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        gameAudio.playTap();
                        cognitiveFocusAudio.setBinauralPreset(p.id);
                      }}
                      className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                        snap.binauralPresetId === p.id
                          ? 'bg-stone-900 border-stone-900 text-white'
                          : 'bg-white border-stone-200 text-stone-700 hover:border-stone-400'
                      }`}
                    >
                      {p.nameZh}
                    </button>
                  ))}
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.02"
                  value={snap.binauralMix}
                  onChange={(e) => cognitiveFocusAudio.setBinauralMix(parseFloat(e.target.value))}
                  aria-label="双耳节拍音量"
                  className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
                />
              </div>

              {/* Nature Soundscape Row */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-stone-600">
                  <span className="font-semibold text-stone-800">自然声景底噪</span>
                  <span className="font-mono tabular-nums text-[11px]">
                    {snap.naturePresetId === 'none' ? '已关闭' : `${Math.round(snap.natureMix * 100)}%`}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {NATURE_PRESETS.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => {
                        gameAudio.playTap();
                        cognitiveFocusAudio.setNaturePreset(n.id);
                      }}
                      className={`px-2.5 py-1 rounded-lg border text-xs font-medium inline-flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                        snap.naturePresetId === n.id
                          ? 'bg-stone-900 border-stone-900 text-white'
                          : 'bg-white border-stone-200 text-stone-700 hover:border-stone-400'
                      }`}
                    >
                      {renderNatureIcon(n.id, 'w-3 h-3')}
                      <span>{n.nameZh}</span>
                    </button>
                  ))}
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.02"
                  disabled={snap.naturePresetId === 'none'}
                  value={snap.naturePresetId === 'none' ? 0 : snap.natureMix}
                  onChange={(e) => cognitiveFocusAudio.setNatureMix(parseFloat(e.target.value))}
                  aria-label="自然声景音量"
                  className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-teal-600 disabled:opacity-40"
                />
              </div>
            </div>

            {/* Bottom Row: Master Volume + Session Timer */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-200/70 text-xs">
              <div className="flex items-center gap-2 min-w-[180px] flex-1 max-w-xs">
                <button
                  type="button"
                  onClick={() => cognitiveFocusAudio.toggleMute()}
                  className="p-1 rounded-md text-stone-600 hover:text-stone-900 cursor-pointer"
                  aria-label={snap.isMuted ? '解除静音' : '静音'}
                >
                  {snap.isMuted || snap.masterVolume === 0 ? (
                    <VolumeX className="w-4 h-4 text-rose-600" />
                  ) : snap.masterVolume < 0.5 ? (
                    <Volume1 className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.02"
                  value={snap.isMuted ? 0 : snap.masterVolume}
                  onChange={(e) => cognitiveFocusAudio.setMasterVolume(parseFloat(e.target.value))}
                  aria-label="主输出音量"
                  className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-stone-900"
                />
                <span className="font-mono tabular-nums text-[11px] text-stone-600 w-9 text-right">
                  {Math.round((snap.isMuted ? 0 : snap.masterVolume) * 100)}%
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <Timer className="w-3.5 h-3.5 text-stone-500 shrink-0" aria-hidden="true" />
                {TIMER_PRESETS.map((t) => {
                  const selected = snap.timerDurationSec === t.minutes * 60;
                  return (
                    <button
                      key={t.minutes}
                      type="button"
                      onClick={() => {
                        gameAudio.playTap();
                        cognitiveFocusAudio.setTimerDuration(t.minutes);
                      }}
                      className={`px-2 py-1 rounded-md text-[11px] font-mono tabular-nums transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                        selected
                          ? 'bg-stone-900 text-white font-semibold'
                          : 'bg-white border border-stone-200 text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </section>
    );
  }

  // =========================================================================
  // STUDIO VARIANT (Full Precision Cognitive Acoustic Workstation)
  // =========================================================================
  return (
    <section
      aria-label="Cognitive Focus Audio Studio"
      className={`rounded-2xl bg-white border border-stone-200 shadow-sm overflow-hidden text-stone-900 ${className}`}
    >
      {/* 1. Top Telemetry Ribbon */}
      <div className="px-4 sm:px-6 py-3 bg-stone-50 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap text-xs">
          <span
            className={`font-mono font-semibold ${
              snap.isPlaying ? 'text-emerald-700' : 'text-stone-500'
            }`}
          >
            {snap.isPlaying ? '● Signal Active' : '○ Standby'}
          </span>
          <span className="text-stone-300" aria-hidden="true">/</span>
          <span className="font-mono tabular-nums text-stone-700">
            Δf {snap.beatHz.toFixed(1)} Hz · L {leftFreqHz} Hz · R {rightFreqHz} Hz
          </span>
          <span className="text-stone-300 hidden md:inline" aria-hidden="true">/</span>
          <span className="text-stone-600 hidden md:inline">
            {activeBinaural.bandLabel} + {activeNature.nameZh}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono tabular-nums">
          <span className="text-stone-500">Elapsed {formatSeconds(snap.sessionElapsedSec)}</span>
          <span className="text-stone-300" aria-hidden="true">·</span>
          <span className="font-semibold text-stone-900">
            Session {activeTimerLabel}
          </span>
          {onBookmarkTimestamp && (
            <button
              type="button"
              onClick={onBookmarkTimestamp}
              className="px-2.5 py-1 rounded-lg bg-white border border-stone-200 hover:border-stone-400 text-stone-700 hover:text-stone-950 font-sans text-[11px] font-medium inline-flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              title="标记当前专注时间戳"
              aria-label="标记当前专注时间戳"
            >
              <BookmarkPlus className="w-3.5 h-3.5 text-sky-700 shrink-0" aria-hidden="true" />
              <span>标记时间点</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              gameAudio.playTap();
              cognitiveFocusAudio.resetTimer();
            }}
            className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-200/70 transition-colors cursor-pointer"
            title="重置专注计时器"
            aria-label="重置专注计时器"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Asymmetric Split Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-stone-200">
        {/* Left Control & Oscilloscope Viewport (7 cols) */}
        <div className="lg:col-span-7 p-5 sm:p-6 space-y-6">
          {/* Header & Primary Transport */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs text-stone-500 font-medium">
                Cognitive Acoustic Entrainment · 双耳节拍与自然声景工作台
              </div>
              <h2 className="font-serif-editorial text-xl sm:text-2xl font-bold text-stone-900 tracking-tight text-balance">
                {activeBinaural.nameZh}
              </h2>
              <p className="text-xs text-stone-600 leading-relaxed">
                {activeBinaural.cognitiveTasks}
              </p>
            </div>

            <button
              type="button"
              onClick={handleTogglePlay}
              className={`min-h-[44px] px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#532CD8] ${
                snap.isPlaying
                  ? 'bg-stone-900 text-white hover:bg-stone-800'
                  : 'bg-sky-700 text-white hover:bg-sky-800'
              }`}
            >
              {snap.isPlaying ? (
                <>
                  <Pause className="w-4 h-4 fill-current shrink-0" aria-hidden="true" />
                  <span>暂停声场</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current shrink-0" aria-hidden="true" />
                  <span>开启专注声场</span>
                </>
              )}
            </button>
          </div>

          {/* Live Acoustic Oscilloscope Stage */}
          <div className="rounded-xl bg-[#0B0F17] border border-stone-800 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between text-[11px] font-mono text-stone-400">
              <span>STEREO PHASE INTERFERENCE SCOPE</span>
              <span className="tabular-nums text-sky-400">
                L {leftFreqHz} Hz / R {rightFreqHz} Hz
              </span>
            </div>
            <canvas
              ref={canvasRef}
              className="w-full h-32 block cursor-crosshair"
              aria-label="Stereo binaural and nature waveform scope"
            />
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-stone-400 pt-1 border-t border-stone-800/80">
              <span className="flex items-center gap-1.5">
                <Headphones className="w-3.5 h-3.5 text-sky-400 shrink-0" aria-hidden="true" />
                <span>双耳节拍需佩戴立体声耳机以实现左右耳物理差频；自然声景适配所有扬声器</span>
              </span>
              <span className="font-mono tabular-nums text-stone-300">
                FFT 256
              </span>
            </div>
          </div>

          {/* Dual-Layer Mixer & Frequency Calibration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Binaural Mix */}
            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-stone-800">双耳节拍强度</span>
                <span className="font-mono tabular-nums font-semibold text-sky-700">
                  {Math.round(snap.binauralMix * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.02"
                value={snap.binauralMix}
                onChange={(e) => cognitiveFocusAudio.setBinauralMix(parseFloat(e.target.value))}
                aria-label="双耳节拍音量"
                className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-sky-700"
              />
              <div className="text-[11px] text-stone-500">
                调至 0% 可切换为纯自然环境白噪模式
              </div>
            </div>

            {/* Nature Bed Mix */}
            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-stone-800">自然声景底噪</span>
                <span className="font-mono tabular-nums font-semibold text-teal-700">
                  {snap.naturePresetId === 'none'
                    ? '0%'
                    : `${Math.round(snap.natureMix * 100)}%`}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.02"
                disabled={snap.naturePresetId === 'none'}
                value={snap.naturePresetId === 'none' ? 0 : snap.natureMix}
                onChange={(e) => cognitiveFocusAudio.setNatureMix(parseFloat(e.target.value))}
                aria-label="自然声景音量"
                className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-teal-700 disabled:opacity-40"
              />
              <div className="text-[11px] text-stone-500 truncate">
                {activeNature.acousticProfile}
              </div>
            </div>

            {/* Fine Δf Beat Frequency Scrubber */}
            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-stone-800">目标脑波差频 (Δf)</span>
                <span className="font-mono tabular-nums font-semibold text-stone-900">
                  {snap.beatHz.toFixed(1)} Hz
                </span>
              </div>
              <input
                type="range"
                min="4"
                max="45"
                step="0.5"
                value={snap.beatHz}
                onChange={(e) => cognitiveFocusAudio.setBeatFrequency(parseFloat(e.target.value))}
                aria-label="微调目标差频频率"
                className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-stone-900"
              />
              <div className="flex justify-between text-[10px] font-mono text-stone-500">
                <span>4 Hz θ</span>
                <span>10 Hz α</span>
                <span>18 Hz β</span>
                <span>40 Hz γ</span>
              </div>
            </div>

            {/* Carrier Tone Scrubber */}
            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-stone-800">基底载波频率 (Carrier)</span>
                <span className="font-mono tabular-nums font-semibold text-stone-900">
                  {snap.carrierHz} Hz
                </span>
              </div>
              <input
                type="range"
                min="120"
                max="280"
                step="1"
                value={snap.carrierHz}
                onChange={(e) =>
                  cognitiveFocusAudio.setCarrierFrequency(parseInt(e.target.value, 10))
                }
                aria-label="调整载波基准频率"
                className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-stone-900"
              />
              <div className="flex justify-between text-[10px] font-mono text-stone-500">
                <span>120 Hz 深沉</span>
                <span>174 Hz 柔和</span>
                <span>280 Hz 明亮</span>
              </div>
            </div>
          </div>

          {/* Master Volume & Focus Timer Bar */}
          <div className="pt-3 border-t border-stone-200 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 flex-1 min-w-[200px] max-w-sm">
              <button
                type="button"
                onClick={() => {
                  gameAudio.playTap();
                  cognitiveFocusAudio.toggleMute();
                }}
                className="p-2 rounded-lg border border-stone-200 hover:border-stone-400 text-stone-700 transition-colors cursor-pointer"
                aria-label={snap.isMuted ? '解除静音' : '静音'}
              >
                {snap.isMuted || snap.masterVolume === 0 ? (
                  <VolumeX className="w-4 h-4 text-rose-600" />
                ) : snap.masterVolume < 0.5 ? (
                  <Volume1 className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <span className="text-xs font-medium text-stone-600 whitespace-nowrap">总音量</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.02"
                value={snap.isMuted ? 0 : snap.masterVolume}
                onChange={(e) => cognitiveFocusAudio.setMasterVolume(parseFloat(e.target.value))}
                aria-label="主输出音量"
                className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-stone-900"
              />
              <span className="font-mono tabular-nums text-xs font-semibold text-stone-800 w-10 text-right">
                {Math.round((snap.isMuted ? 0 : snap.masterVolume) * 100)}%
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-stone-600 mr-1 whitespace-nowrap">
                专注时段
              </span>
              {TIMER_PRESETS.map((preset) => {
                const selected = snap.timerDurationSec === preset.minutes * 60;
                return (
                  <button
                    key={preset.minutes}
                    type="button"
                    onClick={() => {
                      gameAudio.playTap();
                      cognitiveFocusAudio.setTimerDuration(preset.minutes);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono tabular-nums font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      selected
                        ? 'bg-stone-900 text-white'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Selector Rack: Binaural Beats + Nature Soundscapes (5 cols) */}
        <div className="lg:col-span-5 bg-stone-50/50 p-5 sm:p-6 space-y-6">
          {/* Section A: Binaural Brainwave Bands */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                01. Binaural Brainwave Presets
              </h3>
              <span className="text-[11px] font-mono text-stone-500">5 Bands</span>
            </div>

            <div className="space-y-1.5">
              {BINAURAL_PRESETS.map((preset) => {
                const isSelected = snap.binauralPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      gameAudio.playTap();
                      cognitiveFocusAudio.setBinauralPreset(preset.id);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl border transition-colors cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-white border-stone-900 shadow-2xs'
                        : 'bg-white/70 border-stone-200 hover:border-stone-400 hover:bg-white'
                    }`}
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2 text-xs font-semibold text-stone-900">
                        <span className="truncate">{preset.nameZh}</span>
                        <span className="text-stone-300" aria-hidden="true">·</span>
                        <span className="text-stone-500 font-normal truncate">
                          {preset.bandLabel}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 truncate">
                        {preset.cognitiveTasks}
                      </p>
                    </div>
                    <span
                      className={`font-mono tabular-nums text-xs font-bold shrink-0 ${
                        isSelected ? 'text-sky-700' : 'text-stone-500'
                      }`}
                    >
                      {preset.beatHz.toFixed(0)} Hz
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section B: Nature Soundscapes */}
          <div className="space-y-2.5 pt-2 border-t border-stone-200/80">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                02. Procedural Nature Beds
              </h3>
              <span className="text-[11px] font-mono text-stone-500">Stereo Synthesis</span>
            </div>

            <div className="space-y-1.5">
              {NATURE_PRESETS.map((nature) => {
                const isSelected = snap.naturePresetId === nature.id;
                return (
                  <button
                    key={nature.id}
                    type="button"
                    onClick={() => {
                      gameAudio.playTap();
                      cognitiveFocusAudio.setNaturePreset(nature.id);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl border transition-colors cursor-pointer flex items-start gap-3 ${
                      isSelected
                        ? 'bg-white border-stone-900 shadow-2xs'
                        : 'bg-white/70 border-stone-200 hover:border-stone-400 hover:bg-white'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected
                          ? 'bg-stone-900 text-white'
                          : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      {renderNatureIcon(nature.id, 'w-4 h-4')}
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-stone-900 truncate">
                          {nature.nameZh}
                        </span>
                        <span className="text-[11px] text-stone-500 font-mono shrink-0">
                          {nature.name}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 leading-relaxed line-clamp-1">
                        {nature.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

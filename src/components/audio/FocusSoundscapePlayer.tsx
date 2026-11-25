import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Volume1,
  CloudRain,
  Compass,
  Waves,
  Sparkles,
  ChevronUp,
  Headphones,
  Check,
  X,
  ArrowUpRight,
} from 'lucide-react';
import {
  FOCUS_SOUNDSCAPE_TRACKS,
  FocusSoundscapeTrack,
  getSoundscapeWavUrl,
} from '../../utils/focusSoundscapeAudio';
import { cognitiveFocusAudio } from '../../utils/cognitiveFocusAudio';
import { gameAudio } from '../../utils/gameAudio';

const STORAGE_KEYS = {
  TRACK_ID: 'mindlabz_focus_soundscape_track_id',
  VOLUME: 'mindlabz_focus_soundscape_volume',
  MUTED: 'mindlabz_focus_soundscape_muted',
};

const AUTO_HIDE_DELAY_MS = 5000;

export const FocusSoundscapePlayer: React.FC = () => {
  const navigate = useNavigate();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Web Audio API Analyser refs (created once per audio element)
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const rafRef = useRef<number | null>(null);

  // Stored state
  const [activeTrackId, setActiveTrackId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TRACK_ID);
      if (saved && FOCUS_SOUNDSCAPE_TRACKS.some((t) => t.id === saved)) {
        return saved;
      }
    } catch {
      // fallback
    }
    return 'rainy-forest';
  });

  const [volume, setVolume] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.VOLUME);
      if (saved !== null) {
        const val = parseFloat(saved);
        if (!isNaN(val) && val >= 0 && val <= 1) return val;
      }
    } catch {
      // fallback
    }
    return 0.65;
  });

  const [isMuted, setIsMuted] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.MUTED) === 'true';
    } catch {
      return false;
    }
  });

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [currentAudioSrc, setCurrentAudioSrc] = useState<string>('');
  const [isLoadingAudio, setIsLoadingAudio] = useState<boolean>(false);

  // Auto-collapse every 5 seconds into a 0.2cm mini bar; tap to reappear
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [remainingMs, setRemainingMs] = useState<number>(AUTO_HIDE_DELAY_MS);
  const lastActivityRef = useRef<number>(Date.now());

  const activeTrack =
    FOCUS_SOUNDSCAPE_TRACKS.find((t) => t.id === activeTrackId) ||
    FOCUS_SOUNDSCAPE_TRACKS[0];

  // Reset the 5-second auto-collapse timer on any user interaction
  const resetAutoHideTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    setRemainingMs(AUTO_HIDE_DELAY_MS);
  }, []);

  // Reappear from 0.2cm mini bar
  const handleRestoreBar = useCallback(() => {
    gameAudio.playTap();
    setIsCollapsed(false);
    resetAutoHideTimer();
  }, [resetAutoHideTimer]);

  // 5-second countdown interval to auto-collapse the bar when drawer is closed
  useEffect(() => {
    if (isCollapsed || isDrawerOpen) return;

    lastActivityRef.current = Date.now();
    setRemainingMs(AUTO_HIDE_DELAY_MS);

    const intervalId = window.setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;
      const left = Math.max(0, AUTO_HIDE_DELAY_MS - elapsed);
      setRemainingMs(left);
      if (left <= 0) {
        setIsCollapsed(true);
      }
    }, 100);

    return () => window.clearInterval(intervalId);
  }, [isCollapsed, isDrawerOpen]);

  // Initialize Web Audio API AnalyserNode connected to the HTML5 <audio> element
  const ensureAudioAnalyser = useCallback(() => {
    const audioEl = audioRef.current;
    if (!audioEl || typeof window === 'undefined') return;

    try {
      if (!audioCtxRef.current) {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        if (!AudioCtx) return;
        audioCtxRef.current = new AudioCtx();
      }

      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume().catch(() => {});
      }

      if (!analyserRef.current) {
        const analyser = audioCtxRef.current.createAnalyser();
        // 512 FFT gives ~86Hz resolution per bin so bins 0..24 capture all 50Hz-2kHz ambient textures
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.82;
        analyserRef.current = analyser;
      }

      if (!sourceNodeRef.current) {
        const source = audioCtxRef.current.createMediaElementSource(audioEl);
        source.connect(analyserRef.current);
        analyserRef.current.connect(audioCtxRef.current.destination);
        sourceNodeRef.current = source;
      }
    } catch (err) {
      console.warn('Web Audio analyser setup notice:', err);
    }
  }, []);

  // Canvas Frequency Visualizer Loop reacting to live AnalyserNode frequency data
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || isCollapsed) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const barCount = 20;
    const smoothedBars = new Float32Array(barCount);

    const renderFrame = () => {
      const dpr = window.devicePixelRatio || 1;
      const cssWidth = canvas.clientWidth || 100;
      const cssHeight = canvas.clientHeight || 24;

      if (
        canvas.width !== Math.round(cssWidth * dpr) ||
        canvas.height !== Math.round(cssHeight * dpr)
      ) {
        canvas.width = Math.round(cssWidth * dpr);
        canvas.height = Math.round(cssHeight * dpr);
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, cssWidth, cssHeight);

      let freqData: Uint8Array | null = null;
      if (analyserRef.current && isPlaying && !isMuted) {
        freqData = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(freqData);
      }

      const gap = 2;
      const barWidth = Math.max(2, (cssWidth - gap * (barCount - 1)) / barCount);
      const centerY = cssHeight / 2;

      for (let i = 0; i < barCount; i++) {
        let targetNorm = 0.08; // Gentle resting baseline

        if (freqData && isPlaying && !isMuted) {
          // Focus on bins 0..23 (0Hz ~ 2064Hz) where ambient audio energy concentrates
          const binIndex = Math.min(freqData.length - 1, Math.floor((i / barCount) * 24));
          const rawVal = freqData[binIndex] / 255;
          // Boost delicate ambient signal slightly while capping at 1.0
          targetNorm = Math.max(0.1, Math.min(1, Math.pow(rawVal, 0.78) * 1.15));
        }

        // Smooth interpolation for silky liquid bar response
        smoothedBars[i] += (targetNorm - smoothedBars[i]) * 0.28;
        const h = Math.max(2.5, smoothedBars[i] * (cssHeight - 4));
        const x = i * (barWidth + gap);
        const y = centerY - h / 2;

        // Color reflects active track accent when playing, muted stone when idle
        if (isPlaying && !isMuted) {
          ctx.fillStyle = activeTrack.accentColor;
          ctx.globalAlpha = 0.45 + smoothedBars[i] * 0.55;
        } else {
          ctx.fillStyle = '#78716c';
          ctx.globalAlpha = 0.35;
        }

        // Draw rounded vertical pill bar
        const radius = Math.min(barWidth / 2, h / 2);
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, h, radius);
        ctx.fill();
      }

      ctx.restore();
      rafRef.current = requestAnimationFrame(renderFrame);
    };

    rafRef.current = requestAnimationFrame(renderFrame);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isPlaying, isMuted, isCollapsed, activeTrack.accentColor]);

  // Load and generate the WAV audio URL for the HTML5 <audio> element
  const loadTrackAudio = useCallback(async (trackId: string, autoPlay = false) => {
    setIsLoadingAudio(true);
    try {
      const wavUrl = await getSoundscapeWavUrl(trackId);
      setCurrentAudioSrc(wavUrl);

      if (audioRef.current) {
        audioRef.current.src = wavUrl;
        audioRef.current.load();
        if (autoPlay) {
          const playPromise = audioRef.current.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => setIsPlaying(true))
              .catch((err) => {
                console.warn('Autoplay prevented by browser:', err);
                setIsPlaying(false);
              });
          }
        }
      }
    } catch (err) {
      console.error('Failed to load focus soundscape WAV:', err);
    } finally {
      setIsLoadingAudio(false);
    }
  }, []);

  // Initialize track on mount
  useEffect(() => {
    loadTrackAudio(activeTrackId, false);
  }, [activeTrackId, loadTrackAudio]);

  // Sync volume with HTML5 Audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
    try {
      localStorage.setItem(STORAGE_KEYS.VOLUME, String(volume));
      localStorage.setItem(STORAGE_KEYS.MUTED, String(isMuted));
    } catch {
      // ignore
    }
  }, [volume, isMuted]);

  // Toggle Play / Pause on the HTML5 <audio> element
  const handleTogglePlay = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    gameAudio.playTap();
    resetAutoHideTimer();

    if (!audioRef.current) return;

    // Ensure Web Audio analyser is initialized on user gesture
    ensureAudioAnalyser();

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      cognitiveFocusAudio.pause();
      if (!currentAudioSrc) {
        await loadTrackAudio(activeTrackId, true);
      } else {
        try {
          await audioRef.current.play();
          setIsPlaying(true);
        } catch (err) {
          console.warn('Playback error:', err);
          setIsPlaying(false);
        }
      }
    }
  };

  // Switch soundscape track
  const handleSelectTrack = async (track: FocusSoundscapeTrack) => {
    gameAudio.playTap();
    resetAutoHideTimer();
    setActiveTrackId(track.id);
    try {
      localStorage.setItem(STORAGE_KEYS.TRACK_ID, track.id);
    } catch {
      // ignore
    }

    if (isPlaying) {
      ensureAudioAnalyser();
    }

    const wasPlaying = isPlaying;
    await loadTrackAudio(track.id, wasPlaying);
  };

  // Volume slider change handler
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    resetAutoHideTimer();
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (val > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  // Mute toggle handler
  const handleToggleMute = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    gameAudio.playTap();
    resetAutoHideTimer();
    setIsMuted((prev) => !prev);
  };

  // Icon helper
  const renderTrackIcon = (icon: FocusSoundscapeTrack['icon'], cls: string) => {
    switch (icon) {
      case 'rain':
        return <CloudRain className={cls} />;
      case 'space':
        return <Compass className={cls} />;
      case 'ocean':
        return <Waves className={cls} />;
      case 'zen':
        return <Sparkles className={cls} />;
      default:
        return <Headphones className={cls} />;
    }
  };

  const countdownProgress = Math.max(
    0,
    Math.min(100, (remainingMs / AUTO_HIDE_DELAY_MS) * 100)
  );

  return (
    <div
      className="relative w-full z-40"
      onMouseMove={!isCollapsed ? resetAutoHideTimer : undefined}
      onTouchStart={!isCollapsed ? resetAutoHideTimer : undefined}
    >
      {/* ============================================================
          1. The HTML5 Audio Element (Always Mounted)
          ============================================================ */}
      <audio
        ref={audioRef}
        loop
        preload="auto"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(() => {});
          }
        }}
      />

      {/* ============================================================
          2. First Div Child: Sophisticated Transparent Soundscape Bar
             Matches CSS selector 1: ... > nav > div:nth-of-type(1) > div:nth-of-type(1)
             Collapses every 5s into a sleek 0.2cm mini-bar; tap to restore!
          ============================================================ */}
      <div
        onClick={isCollapsed ? handleRestoreBar : undefined}
        role={isCollapsed ? 'button' : undefined}
        tabIndex={isCollapsed ? 0 : undefined}
        aria-label={
          isCollapsed ? 'Appuyer pour réafficher la barre Focus Soundscape' : undefined
        }
        onKeyDown={
          isCollapsed
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleRestoreBar();
                }
              }
            : undefined
        }
        style={
          isCollapsed
            ? { height: '0.2cm', minHeight: '0.2cm' }
            : undefined
        }
        className={`w-full relative overflow-hidden bg-transparent backdrop-blur-md transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] font-numeric ${
          isCollapsed
            ? 'cursor-pointer border-t border-stone-900/15 hover:bg-stone-900/5 flex items-center justify-center group'
            : 'border-t border-stone-900/10 text-stone-900 px-3 sm:px-6 md:px-10 lg:px-12 py-1.5 sm:py-2 flex items-center justify-between gap-2 text-xs'
        }`}
      >
        {isCollapsed ? (
          /* ---- 0.2cm Sleek Mini Bar State ---- */
          <div className="w-full h-full flex items-center justify-center px-4 relative">
            {/* Subtle centered pill indicator inside the 0.2cm bar */}
            <div className="flex items-center gap-1.5">
              <span
                className={`h-[2px] w-10 rounded-full transition-all duration-300 group-hover:w-16 ${
                  isPlaying && !isMuted
                    ? 'bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.6)]'
                    : 'bg-stone-400/80 group-hover:bg-stone-700'
                }`}
              />
              {isPlaying && !isMuted && (
                <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </div>
          </div>
        ) : (
          /* ---- Full Sophisticated Transparent Soundscape Bar ---- */
          <>
            {/* Subtle top 5-second auto-collapse countdown hairline */}
            <div
              className="absolute top-0 left-0 h-[1.5px] bg-gradient-to-r from-stone-900/35 via-amber-500/60 to-transparent transition-[width] duration-100 pointer-events-none"
              style={{ width: isDrawerOpen ? '100%' : `${countdownProgress}%` }}
              aria-hidden="true"
            />

            {/* Left: Track Information & Drawer Toggle */}
            <div
              onClick={() => {
                resetAutoHideTimer();
                setIsDrawerOpen((prev) => !prev);
              }}
              className="flex items-center gap-2 sm:gap-2.5 min-w-0 cursor-pointer group hover:opacity-90 transition-opacity"
              title="点击切换环境音景 (Rainy Forest / Deep Space / Ocean Waves...)"
            >
              <div className="w-7 h-7 rounded-lg bg-stone-900/5 border border-stone-900/10 flex items-center justify-center shrink-0 group-hover:border-stone-900/25 transition-colors">
                {renderTrackIcon(
                  activeTrack.icon,
                  `w-3.5 h-3.5 ${
                    isPlaying && !isMuted ? 'text-amber-600' : 'text-stone-700'
                  }`
                )}
              </div>

              <div className="min-w-0 flex flex-col leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono tracking-wider text-amber-700 font-bold uppercase hidden xs:inline">
                    FOCUS
                  </span>
                  <span className="font-semibold text-stone-900 text-xs truncate">
                    {activeTrack.name}
                  </span>
                  <span className="text-[10px] text-stone-500 hidden md:inline truncate">
                    ({activeTrack.nameZh.split('·')[0].trim()})
                  </span>
                </div>
                <span className="text-[10px] text-stone-500 truncate">
                  {isPlaying && !isMuted
                    ? '正在播放 · 实时频谱'
                    : '点击展开音景选单'}
                </span>
              </div>

              <ChevronUp
                className={`w-3.5 h-3.5 text-stone-500 transition-transform duration-300 ml-0.5 ${
                  isDrawerOpen ? 'rotate-180 text-stone-900' : ''
                }`}
              />
            </div>

            {/* Center: Canvas Frequency Visualizer + Play / Pause Toggle */}
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              {/* Live Audio Frequency Canvas Visualizer */}
              <div
                className="flex items-center px-1.5 sm:px-2 py-1 rounded-full bg-stone-900/[0.04] border border-stone-900/10"
                title="音频频谱实时可视化 (Canvas Frequency Visualizer)"
              >
                <canvas
                  ref={canvasRef}
                  className="w-12 sm:w-20 md:w-24 h-5 block"
                  aria-label="Audio frequency visualizer"
                />
              </div>

              <button
                type="button"
                onClick={handleTogglePlay}
                disabled={isLoadingAudio}
                className={`px-2.5 sm:px-3.5 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-bold transition-all btn-tactile cursor-pointer shadow-xs ${
                  isPlaying
                    ? 'bg-stone-900 text-amber-300 hover:bg-stone-800 shadow-stone-900/15'
                    : 'bg-stone-900/8 hover:bg-stone-900/15 text-stone-900 border border-stone-900/15'
                }`}
                title={isPlaying ? '暂停环境音景 (Pause)' : '开启环境音景 (Play)'}
                aria-label={isPlaying ? '暂停环境音景' : '开启环境音景'}
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-3.5 h-3.5 fill-current" />
                    <span className="hidden sm:inline">暂停</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    <span className="hidden sm:inline">播放</span>
                  </>
                )}
              </button>
            </div>

            {/* Right: Volume Slider and Mute Toggle */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                type="button"
                onClick={handleToggleMute}
                className="p-1 rounded-lg text-stone-600 hover:text-stone-950 transition-colors cursor-pointer"
                title={isMuted ? '解除静音' : '静音'}
                aria-label={isMuted ? '解除静音' : '静音'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-rose-600" />
                ) : volume < 0.5 ? (
                  <Volume1 className="w-4 h-4 text-stone-700" />
                ) : (
                  <Volume2 className="w-4 h-4 text-stone-700" />
                )}
              </button>

              <div className="flex items-center gap-1.5">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-14 sm:w-24 md:w-28 h-1.5 bg-stone-900/15 rounded-full appearance-none cursor-pointer accent-stone-900"
                  title={`音量: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
                  aria-label="音景音量滑动条"
                />
                <span className="text-[10px] font-mono text-stone-600 w-7 text-right hidden sm:inline">
                  {Math.round((isMuted ? 0 : volume) * 100)}%
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ============================================================
          3. Expanded Track Selection Tray (Positioned Above Bar)
          ============================================================ */}
      {isDrawerOpen && !isCollapsed && (
        <div
          className="absolute bottom-full left-0 right-0 bg-[#1C1917]/95 border-t border-stone-800 text-stone-100 p-4 sm:p-5 space-y-4 animate-fadeIn shadow-2xl backdrop-blur-xl"
          style={{ maxHeight: '70vh', overflowY: 'auto' }}
        >
          {/* Drawer Header */}
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-stone-800">
            <div className="flex items-center gap-2">
              <Headphones className="w-4 h-4 text-amber-400" />
              <span className="font-serif-editorial text-sm font-bold text-stone-100">
                专注环境音景库 · Focus Soundscapes
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  gameAudio.playTap();
                  setIsDrawerOpen(false);
                  navigate('/focus-audio');
                }}
                className="px-2.5 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/35 text-sky-200 text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0 transition-colors"
              >
                <span>双耳节拍工作台</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsDrawerOpen(false);
                  resetAutoHideTimer();
                }}
                className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
                title="收起音景选择面板"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <p className="text-xs text-stone-400 leading-relaxed">
            基于认知神经科学声学原理，为深度心流研习提供沉浸背景声，掩蔽外界突发杂音：
          </p>

          {/* Soundscape Track Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
            {FOCUS_SOUNDSCAPE_TRACKS.map((track) => {
              const isSelected = activeTrackId === track.id;
              return (
                <button
                  key={track.id}
                  type="button"
                  onClick={() => handleSelectTrack(track)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                    isSelected
                      ? 'bg-stone-800/90 border-amber-400/80 shadow-md ring-1 ring-amber-400/50'
                      : 'bg-stone-900/80 border-stone-800 hover:bg-stone-800/60 hover:border-stone-700'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{
                          backgroundColor: `${track.accentColor}20`,
                          color: track.accentColor,
                        }}
                      >
                        {renderTrackIcon(track.icon, 'w-4 h-4')}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-stone-100 flex items-center gap-1">
                          <span>{track.name}</span>
                          {isSelected && isPlaying && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          )}
                        </div>
                        <div className="text-[10px] text-stone-400 font-mono">
                          {track.category}
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-amber-400 shrink-0" />
                    )}
                  </div>

                  <p className="text-[11px] text-stone-400 line-clamp-2 leading-relaxed">
                    {track.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

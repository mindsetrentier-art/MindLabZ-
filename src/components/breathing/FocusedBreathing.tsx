import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Sparkles,
  Heart,
  Wind,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldAlert,
  ChevronDown,
  BookOpen,
  Headphones,
  CloudRain,
  Trees,
  Radio,
  Waves,
  Music,
  Compass,
} from 'lucide-react';
import {
  BREATHING_TECHNIQUES,
  BreathingTechnique,
  BreathingPhase,
} from '../../data/breathingTechniques';
import { breathingAudio } from '../../utils/breathingAudio';
import {
  ambientSound,
  SOUNDSCAPE_PRESETS,
  SoundscapeInfo,
} from '../../utils/ambientSoundEngine';
import { MeditationAudioLibrary } from './MeditationAudioLibrary';
import { useApp } from '../../context/AppContext';

export interface FocusedBreathingProps {
  initialTechniqueId?: string;
  onComplete?: (sessionStats: {
    durationSec: number;
    cyclesCompleted: number;
    techniqueName: string;
  }) => void;
  onNavigateToJournal?: (summaryText: string) => void;
  className?: string;
  standalone?: boolean;
}

export const FocusedBreathing: React.FC<FocusedBreathingProps> = ({
  initialTechniqueId = '4-7-8',
  onComplete,
  onNavigateToJournal,
  className = '',
  standalone = false,
}) => {
  const { addXP, triggerConfetti, openComposerWithPreload } = useApp();

  // Selected technique
  const [techniqueId, setTechniqueId] = useState<string>(initialTechniqueId);
  const technique = useMemo(
    () => BREATHING_TECHNIQUES.find((t) => t.id === techniqueId) || BREATHING_TECHNIQUES[0],
    [techniqueId]
  );

  // Target session duration in minutes (1, 2, 3, 5, or 0 for free infinite)
  const [targetMinutes, setTargetMinutes] = useState<number>(3);
  const targetSeconds = targetMinutes * 60;

  // Running state
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  // Audio mute state
  const [isMuted, setIsMuted] = useState<boolean>(breathingAudio.getMuted());

  // Animation & loop state
  const [phaseIndex, setPhaseIndex] = useState<number>(0);
  const [phaseElapsedSec, setPhaseElapsedSec] = useState<number>(0);
  const [totalElapsedSec, setTotalElapsedSec] = useState<number>(0);
  const [cyclesCompleted, setCyclesCompleted] = useState<number>(0);

  // Pre-session emotional check-in
  const [preState, setPreState] = useState<string>('紧绷杂念');
  const [postState, setPostState] = useState<string>('澄澈宁静');

  // Ambient Background Meditation Soundscape State
  const [isAmbientPlaying, setIsAmbientPlaying] = useState<boolean>(ambientSound.isPlaying());
  const [activeAmbientId, setActiveAmbientId] = useState<string>(ambientSound.getActiveSoundscapeId());
  const [ambientVolume, setAmbientVolume] = useState<number>(ambientSound.getVolume());
  const [isAudioLibraryOpen, setIsAudioLibraryOpen] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = ambientSound.subscribe((playing, currentId, vol) => {
      setIsAmbientPlaying(playing);
      setActiveAmbientId(currentId);
      setAmbientVolume(vol);
    });
    return unsubscribe;
  }, []);

  const currentAmbientPreset =
    SOUNDSCAPE_PRESETS.find((s) => s.id === activeAmbientId) || SOUNDSCAPE_PRESETS[0];

  const handleSelectAmbient = (id: string) => {
    if (activeAmbientId === id && isAmbientPlaying) {
      ambientSound.stop();
    } else {
      ambientSound.play(id);
    }
  };

  const getPresetSmallIcon = (iconName: SoundscapeInfo['iconName'], className: string) => {
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

  // References for RAF loop
  const animFrameRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);
  const stateRef = useRef({
    isRunning: false,
    phaseIndex: 0,
    phaseElapsedSec: 0,
    totalElapsedSec: 0,
    cyclesCompleted: 0,
    technique,
    targetSeconds,
  });

  // Keep stateRef in sync with mutable values
  useEffect(() => {
    stateRef.current.isRunning = isRunning;
    stateRef.current.technique = technique;
    stateRef.current.targetSeconds = targetSeconds;
  }, [isRunning, technique, targetSeconds]);

  const currentPhase = technique.phases[phaseIndex] || technique.phases[0];
  const phaseDuration = currentPhase.durationSec;
  const phaseProgress = Math.min(1, phaseElapsedSec / phaseDuration);

  // Calculate gentle breathing expansion scale:
  // Inhale: 0.58 -> 1.0 (smooth gentle expansion)
  // Hold-in: 1.0 -> 1.02 (gentle full holding)
  // Exhale: 1.0 -> 0.58 (smooth gentle contraction)
  // Hold-out: 0.58 -> 0.58 (steady resting emptiness)
  const sphereScale = useMemo(() => {
    const minScale = 0.56;
    const maxScale = 1.0;
    const phaseType = currentPhase.phase;

    if (phaseType === 'inhale') {
      // Ease out sine
      const eased = Math.sin((phaseProgress * Math.PI) / 2);
      return minScale + (maxScale - minScale) * eased;
    } else if (phaseType === 'hold-in') {
      // Subtle pulse during hold
      return maxScale + Math.sin(phaseProgress * Math.PI) * 0.02;
    } else if (phaseType === 'exhale') {
      // Ease in-out sine contraction
      const eased = Math.cos((phaseProgress * Math.PI) / 2);
      return minScale + (maxScale - minScale) * eased;
    } else {
      // hold-out / rest
      return minScale;
    }
  }, [currentPhase.phase, phaseProgress]);

  // Handle phase audio chime
  const triggerPhaseAudio = (phase: BreathingPhase) => {
    if (phase === 'inhale') {
      breathingAudio.playInhaleChime();
    } else if (phase === 'hold-in') {
      breathingAudio.playHoldChime();
    } else if (phase === 'exhale') {
      breathingAudio.playExhaleChime();
    } else {
      breathingAudio.playHoldChime();
    }
  };

  // High precision timer loop using requestAnimationFrame
  useEffect(() => {
    const loop = (timestamp: number) => {
      if (!lastTimestampRef.current) {
        lastTimestampRef.current = timestamp;
      }
      const deltaSec = (timestamp - lastTimestampRef.current) / 1000;
      lastTimestampRef.current = timestamp;

      if (stateRef.current.isRunning) {
        const curTech = stateRef.current.technique;
        let curPhaseIdx = stateRef.current.phaseIndex;
        let curPhaseElapsed = stateRef.current.phaseElapsedSec + deltaSec;
        let curTotalElapsed = stateRef.current.totalElapsedSec + deltaSec;
        let curCycles = stateRef.current.cyclesCompleted;

        const currentPhaseObj = curTech.phases[curPhaseIdx];
        const curDuration = currentPhaseObj.durationSec;

        if (curPhaseElapsed >= curDuration) {
          curPhaseElapsed -= curDuration;
          curPhaseIdx += 1;

          if (curPhaseIdx >= curTech.phases.length) {
            curPhaseIdx = 0;
            curCycles += 1;
            setCyclesCompleted(curCycles);
            stateRef.current.cyclesCompleted = curCycles;
          }

          // Update phase index & trigger chime
          setPhaseIndex(curPhaseIdx);
          stateRef.current.phaseIndex = curPhaseIdx;
          triggerPhaseAudio(curTech.phases[curPhaseIdx].phase);
        }

        setPhaseElapsedSec(curPhaseElapsed);
        stateRef.current.phaseElapsedSec = curPhaseElapsed;

        setTotalElapsedSec(curTotalElapsed);
        stateRef.current.totalElapsedSec = curTotalElapsed;

        // Check if target duration reached (when targetSeconds > 0)
        if (
          stateRef.current.targetSeconds > 0 &&
          curTotalElapsed >= stateRef.current.targetSeconds
        ) {
          // Completed session!
          setIsRunning(false);
          setIsCompleted(true);
          stateRef.current.isRunning = false;
          breathingAudio.playCompleteGong();
          triggerConfetti();
          addXP(50, '完成专注呼吸神经调节');
          onComplete?.({
            durationSec: Math.round(curTotalElapsed),
            cyclesCompleted: curCycles,
            techniqueName: curTech.nameZh,
          });
          return;
        }
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [triggerConfetti, addXP, onComplete]);

  // Handle Play / Pause
  const handleTogglePlay = () => {
    if (isCompleted) {
      handleReset();
      return;
    }

    if (!isRunning) {
      // Starting
      lastTimestampRef.current = null;
      setIsRunning(true);
      // Play initial chime for current phase
      triggerPhaseAudio(currentPhase.phase);

      // Auto-sync background ambient soundscape if configured
      try {
        const autoSync = localStorage.getItem('mindlabz_ambient_autosync') !== 'false';
        if (autoSync && !ambientSound.isPlaying()) {
          ambientSound.play();
        }
      } catch {
        // ignore
      }
    } else {
      setIsRunning(false);
    }
  };

  // Handle Reset
  const handleReset = () => {
    setIsRunning(false);
    setIsCompleted(false);
    setPhaseIndex(0);
    setPhaseElapsedSec(0);
    setTotalElapsedSec(0);
    setCyclesCompleted(0);
    lastTimestampRef.current = null;
    stateRef.current.phaseIndex = 0;
    stateRef.current.phaseElapsedSec = 0;
    stateRef.current.totalElapsedSec = 0;
    stateRef.current.cyclesCompleted = 0;
  };

  // Toggle Mute
  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    breathingAudio.setMuted(next);
  };

  // Change Technique
  const handleSelectTechnique = (id: string) => {
    setTechniqueId(id);
    handleReset();
  };

  // Bridge to Cognitive Journal
  const handleBridgeToJournal = () => {
    const journalText = `【专注呼吸训练复盘】使用「${technique.nameZh}」进行了 ${Math.round(
      totalElapsedSec / 60
    )} 分钟呼吸觉察（完成 ${cyclesCompleted} 次呼吸循环）。练习前状态：${preState}；练习后状态：${postState}。心率与思绪已恢复深层澄澈。`;

    if (onNavigateToJournal) {
      onNavigateToJournal(journalText);
    } else {
      openComposerWithPreload({
        templateType: 'flow-reflection',
        title: `专注呼吸心境复盘 · ${technique.nameZh}`,
        emotion: {
          primary: '澄澈平静',
          intensity: 8,
          valence: 'positive',
          energyLevel: 2,
        },
        structuredData: {
          deepFocusTrigger: `${technique.nameZh} 神经调节呼吸法`,
          timeWarpState: `完成 ${cyclesCompleted} 次呼吸循环，专注进入副交感放松波`,
          coreTakeaway: `从「${preState}」回归「${postState}」，身心重获内在掌控力与沉静空间。`,
        },
      });
    }
  };

  // Seconds countdown in current phase
  const secondsLeftInPhase = Math.max(1, Math.ceil(phaseDuration - phaseElapsedSec));

  return (
    <div className={`space-y-6 sm:space-y-8 ${className}`}>
      {/* 1. Top Folio & Technique Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-stone-500 font-medium mb-1">
            <span className="editorial-kicker text-[10px] text-stone-700 tracking-widest">
              Somatic Mindfulness · 躯体觉察工坊
            </span>
            <span className="text-stone-300">/</span>
            <span className="font-serif-editorial italic text-stone-600">
              Autonomic Regulation
            </span>
          </div>
          <h2 className="font-serif-editorial text-xl sm:text-2xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
            <Wind className="w-5 h-5 text-stone-700 stroke-[1.7]" />
            <span>专注呼吸觉察（Focused Breathing）</span>
          </h2>
          <p className="text-xs text-stone-600 mt-1 max-w-xl">
            温和扩张与收缩的视觉节律，激活副交感神经系统迷走神经刹车，重获内心澄澈。
          </p>
        </div>

        {/* Audio Mute & Ambient Soundscape & Duration Pills */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-center shrink-0">
          {/* Ambient Soundscape Quick Pill */}
          <button
            onClick={() => setIsAudioLibraryOpen(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
              isAmbientPlaying
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-xs'
                : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
            }`}
            title="点击打开背景冥想音频库（雨声、森林、白噪音等）"
          >
            {isAmbientPlaying ? (
              <div className="flex items-center gap-0.5 h-3">
                <span className="w-0.5 bg-emerald-500 rounded-full animate-soundWave1" />
                <span className="w-0.5 bg-emerald-500 rounded-full animate-soundWave2" />
                <span className="w-0.5 bg-emerald-500 rounded-full animate-soundWave3" />
              </div>
            ) : (
              <Headphones className="w-3.5 h-3.5 text-stone-500" />
            )}
            <span className="text-[11px] font-semibold">
              {currentAmbientPreset ? currentAmbientPreset.name.split('·')[0].trim() : '自然音景'}
            </span>
            <span
              className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                isAmbientPlaying ? 'bg-emerald-600 text-white' : 'bg-stone-100 text-stone-400'
              }`}
            >
              {isAmbientPlaying ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Technique Chime Mute */}
          <button
            onClick={handleToggleMute}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              isMuted
                ? 'bg-stone-100 text-stone-400 border-stone-200'
                : 'bg-white text-stone-800 border-stone-200 hover:bg-stone-50'
            }`}
            title={isMuted ? '点击开启禅磬声效' : '点击静音'}
            aria-label={isMuted ? '开启提示音' : '静音'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Target duration selector */}
          <div className="flex items-center bg-stone-100 p-1 rounded-xl text-xs font-semibold">
            {[1, 3, 5].map((m) => (
              <button
                key={m}
                disabled={isRunning}
                onClick={() => {
                  setTargetMinutes(m);
                  handleReset();
                }}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  targetMinutes === m
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-500 hover:text-stone-800 disabled:opacity-50'
                }`}
              >
                {m}分钟
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Technique Selection Segmented Tabs */}
      {!isRunning && !isCompleted && (
        <div className="space-y-2">
          <label className="text-xs font-semibold text-stone-700 block">
            选择心智调节节律：
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {BREATHING_TECHNIQUES.map((tech) => (
              <button
                key={tech.id}
                onClick={() => handleSelectTechnique(tech.id)}
                className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                  technique.id === tech.id
                    ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                    : 'bg-white text-stone-800 border-stone-200 hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span>{tech.nameZh.split(' ')[0]}</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded-full font-medium ${
                      technique.id === tech.id
                        ? 'bg-stone-800 text-stone-200'
                        : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    {tech.badge}
                  </span>
                </div>
                <p
                  className={`text-[10px] line-clamp-1 ${
                    technique.id === tech.id ? 'text-stone-300' : 'text-stone-500'
                  }`}
                >
                  {tech.subtitleZh}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 2.5 Quick Ambient Meditation Sound Bar */}
      <div className="bg-white/80 p-3 sm:p-4 rounded-2xl border border-stone-200/90 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Headphones className="w-4 h-4 text-stone-700" />
            <span className="text-xs font-bold text-stone-800">
              背景冥想自然环境音（Ambient Soundscape）：
            </span>
            <span className="text-[10px] text-stone-500 hidden sm:inline">
              轻触即刻切换自然声景，提升专注沉浸感
            </span>
          </div>

          <button
            onClick={() => setIsAudioLibraryOpen(true)}
            className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>音频库详情</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {SOUNDSCAPE_PRESETS.map((preset) => {
            const isCurrentActive = activeAmbientId === preset.id;
            const isCurrentPlaying = isCurrentActive && isAmbientPlaying;

            return (
              <button
                key={preset.id}
                onClick={() => handleSelectAmbient(preset.id)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isCurrentActive
                    ? isCurrentPlaying
                      ? 'bg-stone-900 text-white border-stone-800 shadow-sm ring-2 ring-emerald-500/40'
                      : 'bg-stone-800 text-stone-100 border-stone-700'
                    : 'bg-white hover:bg-stone-50 text-stone-800 border-stone-200 hover:border-stone-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div
                    className="p-1 rounded-lg bg-stone-100 text-stone-800"
                    style={{
                      backgroundColor: isCurrentActive ? 'rgba(255,255,255,0.15)' : undefined,
                      color: isCurrentActive ? preset.accentColor : undefined,
                    }}
                  >
                    {getPresetSmallIcon(preset.iconName, 'w-3.5 h-3.5')}
                  </div>
                  {isCurrentPlaying ? (
                    <div className="flex items-center gap-0.5 h-2.5">
                      <span className="w-0.5 bg-emerald-400 rounded-full animate-soundWave1" />
                      <span className="w-0.5 bg-emerald-400 rounded-full animate-soundWave2" />
                      <span className="w-0.5 bg-emerald-400 rounded-full animate-soundWave3" />
                    </div>
                  ) : isCurrentActive ? (
                    <span className="text-[9px] text-stone-400 font-mono">待播放</span>
                  ) : null}
                </div>
                <div className="text-xs font-bold leading-tight truncate">
                  {preset.name.split('·')[0].trim()}
                </div>
                <div
                  className={`text-[9px] truncate ${
                    isCurrentActive ? 'text-stone-300' : 'text-stone-500'
                  }`}
                >
                  {preset.tag}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. The Core Respiration Visualizer Card */}
      <div className="relative editorial-card rounded-3xl p-6 sm:p-10 md:p-12 overflow-hidden flex flex-col items-center justify-center min-h-[380px] sm:min-h-[440px] bg-gradient-to-b from-stone-50/80 to-[#FAF8F5]">
        {/* Background Ambient Resonant Ripple Ring */}
        <div
          style={{
            transform: `scale(${sphereScale * 1.35})`,
            transition: 'transform 0.12s linear',
            opacity: isRunning ? 0.25 : 0.12,
          }}
          className="absolute w-72 h-72 sm:w-88 sm:h-88 rounded-full bg-gradient-to-tr from-stone-400 via-indigo-200 to-teal-200 blur-2xl pointer-events-none"
        />

        {/* Concentric Guide Grid Circle */}
        <div className="absolute w-64 h-64 sm:w-80 sm:h-80 rounded-full border border-dashed border-stone-300/80 pointer-events-none" />
        <div className="absolute w-44 h-44 sm:w-56 sm:h-56 rounded-full border border-stone-200/60 pointer-events-none" />

        {/* Interactive Breathing Sphere & Orb Visualizer */}
        <div className="relative z-10 flex flex-col items-center justify-center my-6">
          <div
            style={{
              transform: `scale(${sphereScale})`,
              transition: 'transform 0.1s linear',
            }}
            className="relative flex items-center justify-center w-56 h-56 sm:w-68 sm:h-68 rounded-full shadow-xl transition-shadow duration-500"
          >
            {/* SVG Circular Phase Progress Arc */}
            <svg
              className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none"
              viewBox="0 0 100 100"
            >
              <circle
                cx="50"
                cy="50"
                r="46"
                fill="none"
                stroke="#E7E5E4"
                strokeWidth="2.5"
              />
              <circle
                cx="50"
                cy="50"
                r="46"
                fill="none"
                stroke={isRunning ? '#1C1917' : '#A8A29E'}
                strokeWidth="3.5"
                strokeDasharray={2 * Math.PI * 46}
                strokeDashoffset={2 * Math.PI * 46 * (1 - phaseProgress)}
                strokeLinecap="round"
                className="transition-all duration-75"
              />
            </svg>

            {/* Inner Organic Radial Gradient Orb */}
            <div
              className={`w-44 h-44 sm:w-56 sm:h-56 rounded-full flex flex-col items-center justify-center text-center p-4 transition-all duration-700 bg-gradient-to-br ${
                isRunning
                  ? currentPhase.colorClass
                  : 'from-stone-800 via-stone-900 to-black text-white'
              } text-white shadow-2xl backdrop-blur-md`}
            >
              {/* Core State Typographic Indicator */}
              <span className="text-[11px] font-mono tracking-widest uppercase opacity-80 mb-1">
                {currentPhase.nameEn}
              </span>

              <h3 className="font-serif-editorial text-3xl sm:text-4xl font-bold tracking-tight">
                {isRunning ? currentPhase.nameZh : '准备就绪'}
              </h3>

              {/* Large Countdown Seconds */}
              {isRunning && (
                <div className="font-mono text-xl sm:text-2xl font-bold tracking-tight mt-1 opacity-90 animate-fadeIn">
                  {secondsLeftInPhase} <span className="text-xs font-sans font-normal opacity-70">秒</span>
                </div>
              )}

              {/* Cycle Count Indicator */}
              {isRunning && (
                <span className="text-[10px] opacity-75 font-numeric mt-1">
                  第 {cyclesCompleted + 1} 轮循环
                </span>
              )}
            </div>
          </div>

          {/* Dynamic Guiding Prompt Below Circle */}
          <div className="mt-8 text-center max-w-md px-4 min-h-[50px] flex flex-col items-center justify-center">
            <p className="font-serif-editorial text-sm sm:text-base font-medium text-stone-800 leading-relaxed transition-all duration-300">
              {isRunning
                ? currentPhase.promptZh
                : `点击下方按钮开始，建议佩戴耳机配合禅磬音效，全程跟随圆环扩张轻柔吸气、收缩缓慢呼气。`}
            </p>
            {isRunning && (
              <span className="text-[11px] text-stone-400 font-sans mt-0.5">
                {currentPhase.promptEn}
              </span>
            )}
          </div>
        </div>

        {/* Floating Controls at Bottom of Card */}
        <div className="relative z-10 flex items-center gap-4 mt-2">
          {/* Primary Play / Pause Toggle Button */}
          <button
            onClick={handleTogglePlay}
            className={`px-7 py-3 rounded-2xl font-bold text-sm flex items-center gap-2.5 transition-all shadow-md btn-tactile cursor-pointer ${
              isRunning
                ? 'bg-stone-200 text-stone-800 hover:bg-stone-300'
                : 'bg-stone-900 text-white hover:bg-stone-800'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>暂停呼吸</span>
              </>
            ) : isCompleted ? (
              <>
                <RotateCcw className="w-4 h-4" />
                <span>再次练习</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>开启 {targetMinutes} 分钟专注呼吸</span>
              </>
            )}
          </button>

          {/* Reset Button */}
          {(isRunning || totalElapsedSec > 0) && (
            <button
              onClick={handleReset}
              className="p-3 rounded-2xl bg-white border border-stone-200 text-stone-700 hover:bg-stone-100 transition-colors btn-tactile cursor-pointer"
              title="重置练习"
              aria-label="重置练习"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Real-time Session Elapsed & Remaining Bar */}
        {isRunning && (
          <div className="mt-6 flex items-center gap-4 text-xs font-numeric text-stone-500 font-medium">
            <span>
              已进行：{Math.floor(totalElapsedSec / 60)}:
              {String(Math.floor(totalElapsedSec % 60)).padStart(2, '0')}
            </span>
            <span className="text-stone-300">·</span>
            <span>已完成循环：{cyclesCompleted} 次</span>
            <span className="text-stone-300">·</span>
            <span>
              剩余：{Math.max(0, Math.floor((targetSeconds - totalElapsedSec) / 60))}:
              {String(Math.max(0, Math.floor((targetSeconds - totalElapsedSec) % 60))).padStart(
                2,
                '0'
              )}
            </span>
          </div>
        )}
      </div>

      {/* 4. Session Completion Modal / Card */}
      {isCompleted && (
        <div className="editorial-card rounded-2xl p-6 sm:p-8 bg-emerald-50/80 border border-emerald-200 space-y-4 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-serif-editorial text-lg font-bold text-stone-900">
                专注呼吸调节达成 · 副交感神经已唤醒
              </h4>
              <p className="text-xs text-stone-600">
                恭喜完成 {targetMinutes} 分钟的 {technique.nameZh}，心率变异性恢复谐振，思维重归澄澈。已奖励 +50 XP。
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-2 text-xs">
            <div className="bg-white p-3 rounded-xl border border-stone-200">
              <span className="text-stone-400 block text-[10px]">总计时长</span>
              <span className="font-serif-editorial text-base font-bold text-stone-900">
                {targetMinutes} 分钟
              </span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-stone-200">
              <span className="text-stone-400 block text-[10px]">呼吸循环</span>
              <span className="font-serif-editorial text-base font-bold text-stone-900">
                {cyclesCompleted} 轮
              </span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-stone-200">
              <span className="text-stone-400 block text-[10px]">调节模式</span>
              <span className="font-semibold text-stone-900 line-clamp-1">
                {technique.badge}
              </span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-stone-200">
              <span className="text-stone-400 block text-[10px]">认知经验</span>
              <span className="font-serif-editorial text-base font-bold text-emerald-700">
                +50 XP
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleBridgeToJournal}
              className="flex-1 py-3 px-4 rounded-xl bg-stone-900 text-white font-semibold text-xs flex items-center justify-center gap-2 hover:bg-stone-800 transition-colors btn-tactile cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              <span>将此刻感悟沉淀至心智手记 (+50 XP)</span>
            </button>
            <button
              onClick={handleReset}
              className="py-3 px-5 rounded-xl bg-white border border-stone-300 text-stone-800 font-semibold text-xs hover:bg-stone-50 transition-colors btn-tactile cursor-pointer"
            >
              再次开始一轮
            </button>
          </div>
        </div>
      )}

      {/* 5. Scientific Background & Physiological Mechanism */}
      <div className="editorial-card rounded-2xl p-6 sm:p-7 space-y-3 bg-white border border-stone-200">
        <div className="flex items-center gap-2 text-xs font-semibold text-stone-800">
          <ShieldAlert className="w-4 h-4 text-stone-700" />
          <span>神经生理学机制（Neurophysiological Mechanism）</span>
        </div>
        <p className="text-xs text-stone-600 leading-relaxed">
          {technique.description}
        </p>
        <div className="flex items-center gap-2 text-[11px] text-stone-500 pt-1 font-serif-editorial italic">
          <span>来源依据：{technique.scientificOrigin}</span>
        </div>
      </div>

      {/* 6. Modal Ambient Audio Library */}
      <MeditationAudioLibrary
        variant="modal"
        isOpen={isAudioLibraryOpen}
        onClose={() => setIsAudioLibraryOpen(false)}
      />
    </div>
  );
};

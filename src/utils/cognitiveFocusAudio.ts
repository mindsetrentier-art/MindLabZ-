/**
 * Cognitive Focus Audio Engine (Real-Time Stereo Web Audio Synthesis)
 *
 * Dual-layer acoustic synthesis engineered for deep concentration during cognitive tasks:
 *  1. True Stereo Binaural Beats (Discrete Left f_L and Right f_R = f_L + Δf via StereoPannerNode)
 *  2. Continuous Procedural Stereo Nature Soundscapes (Decorrelated L/R Pink & Brown Noise + Filter LFOs)
 *  3. Real-Time AnalyserNode Waveform & Spectrum Telemetry + Focus Session Timer
 *
 * 100% client-side Web Audio API — zero external audio URLs, zero looping seam clicks.
 */

import { ambientSound } from './ambientSoundEngine';

export type BinauralPresetId =
  | 'gamma-40'
  | 'beta-18'
  | 'smr-14'
  | 'alpha-10'
  | 'theta-6';

export type NaturePresetId =
  | 'canopy-rain'
  | 'ocean-tide'
  | 'alpine-stream'
  | 'night-hearth'
  | 'none';

export interface BinauralPreset {
  id: BinauralPresetId;
  bandLabel: string;
  name: string;
  nameZh: string;
  beatHz: number;
  carrierHz: number;
  cognitiveUse: string;
  cognitiveTasks: string;
  accentColor: string;
}

export interface NaturePreset {
  id: NaturePresetId;
  name: string;
  nameZh: string;
  acousticProfile: string;
  description: string;
  accentColor: string;
  /** Effective rhythmic modulation / pulse cadence in beats per minute */
  bpm: number;
  bpmLabel: string;
  /** Synthesized acoustic passband / spectrum bounds in Hz */
  minHz: number;
  maxHz: number;
  frequencyRangeLabel: string;
  modulationSummary: string;
}

export const BINAURAL_PRESETS: BinauralPreset[] = [
  {
    id: 'gamma-40',
    bandLabel: 'Gamma γ',
    name: '40 Hz Gamma Peak',
    nameZh: '40 Hz 伽马峰值',
    beatHz: 40.0,
    carrierHz: 210,
    cognitiveUse: 'Working memory binding & rapid cognitive synthesis',
    cognitiveTasks: '高强度推理 · 信息整合 · 限时心智博弈',
    accentColor: '#0284C7',
  },
  {
    id: 'beta-18',
    bandLabel: 'Mid-Beta β',
    name: '18 Hz Analytical Beta',
    nameZh: '18 Hz 逻辑贝塔',
    beatHz: 18.0,
    carrierHz: 192,
    cognitiveUse: 'Sustained executive focus & analytical deduction',
    cognitiveTasks: '逻辑校验 · 复杂决策 · 严谨推演',
    accentColor: '#4F46E5',
  },
  {
    id: 'smr-14',
    bandLabel: 'SMR Low-β',
    name: '14 Hz Calm Alertness',
    nameZh: '14 Hz 稳定心流',
    beatHz: 14.0,
    carrierHz: 180,
    cognitiveUse: 'Calm, jitter-free sustained reading & comprehension',
    cognitiveTasks: '定律精读 · 深度理解 · 抗干扰研习',
    accentColor: '#0D9488',
  },
  {
    id: 'alpha-10',
    bandLabel: 'Alpha α',
    name: '10 Hz Associative Alpha',
    nameZh: '10 Hz 联想阿尔法',
    beatHz: 10.0,
    carrierHz: 174,
    cognitiveUse: 'Relaxed memory encoding & associative recall',
    cognitiveTasks: '知识连结 · 记忆巩固 · 概念内化',
    accentColor: '#D97706',
  },
  {
    id: 'theta-6',
    bandLabel: 'Theta θ',
    name: '6 Hz Insight Theta',
    nameZh: '6 Hz 顿悟西塔',
    beatHz: 6.0,
    carrierHz: 136.1,
    cognitiveUse: 'Creative incubation & reflective metacognition',
    cognitiveTasks: '灵感孵化 · 复盘反思 · 正念手记',
    accentColor: '#7C3AED',
  },
];

export const NATURE_PRESETS: NaturePreset[] = [
  {
    id: 'canopy-rain',
    name: 'Canopy Rainfall',
    nameZh: '林间细雨',
    acousticProfile: 'Decorrelated stereo pink rain (190–1830 Hz)',
    description: '宽频柔化雨幕声床，温和掩蔽突发性环境人声与键盘噪音。',
    accentColor: '#0284C7',
    bpm: 8.4,
    bpmLabel: '8.4 BPM (0.14 Hz 雨势呼吸起伏)',
    minHz: 190,
    maxHz: 1830,
    frequencyRangeLabel: '190 Hz – 1,830 Hz',
    modulationSummary: 'Pink Noise · HP 190 Hz / LP 1550±280 Hz',
  },
  {
    id: 'ocean-tide',
    name: 'Deep Ocean Tide',
    nameZh: '深海长潮',
    acousticProfile: '0.09 Hz rhythmic surf swell (40–510 Hz)',
    description: '贴合 11 秒深呼吸节律的低频海潮涌动，稳定自主神经节奏。',
    accentColor: '#0D9488',
    bpm: 5.4,
    bpmLabel: '5.4 BPM (0.09 Hz 潮汐长波周期)',
    minHz: 40,
    maxHz: 510,
    frequencyRangeLabel: '40 Hz – 510 Hz',
    modulationSummary: 'Brown Noise Swell · LP 340±170 Hz',
  },
  {
    id: 'alpine-stream',
    name: 'Alpine Wind & Stream',
    nameZh: '山涧松风',
    acousticProfile: 'Stereo brook & pine canopy resonance (320–2400 Hz)',
    description: '清澈溪流泛音与舒缓林风交织，适合长时间伏案阅读与思考。',
    accentColor: '#059669',
    bpm: 11.4,
    bpmLabel: '11.4 BPM (0.19 Hz 溪风带通扫频)',
    minHz: 320,
    maxHz: 2400,
    frequencyRangeLabel: '320 Hz – 2,400 Hz',
    modulationSummary: 'Pink Bandpass · Fc 760±240 Hz (Q 0.85)',
  },
  {
    id: 'night-hearth',
    name: 'Hearth & Brown Noise',
    nameZh: '暖炉棕噪',
    acousticProfile: 'Warm brown noise (30–340 Hz) + ember crackles',
    description: '低沉温暖的布朗噪声底噪与微弱余烬声，降低听觉疲劳。',
    accentColor: '#D97706',
    bpm: 51,
    bpmLabel: '51 BPM (余烬随机轻响平均脉动)',
    minHz: 30,
    maxHz: 3300,
    frequencyRangeLabel: '30 Hz – 340 Hz (底噪) / 3.3 kHz (余烬)',
    modulationSummary: 'Brown LP 340 Hz + Triangle Embers',
  },
  {
    id: 'none',
    name: 'Pure Binaural Only',
    nameZh: '纯双耳节拍',
    acousticProfile: 'Nature bed muted (pure dual-sine carrier)',
    description: '关闭自然环境声床，仅保留纯净左右耳正弦载波差频信号。',
    accentColor: '#64748B',
    bpm: 0,
    bpmLabel: '0 BPM (稳态连续正弦载波)',
    minHz: 120,
    maxHz: 325,
    frequencyRangeLabel: '纯载波窄带 (无环境白噪)',
    modulationSummary: 'Stereo Sine L/R Only (0 dB Nature Floor)',
  },
];

export interface SoundscapeAcousticTelemetry {
  soundscapeId: NaturePresetId;
  soundscapeNameZh: string;
  soundscapeNameEn: string;
  bpm: number;
  bpmDisplay: string;
  bpmDetail: string;
  minHz: number;
  maxHz: number;
  frequencyRangeDisplay: string;
  binauralRangeDisplay: string;
  combinedSpectrumDisplay: string;
  modulationSummary: string;
  accentColor: string;
}

export function getSoundscapeAcousticTelemetry(
  snap: Pick<FocusAudioSnapshot, 'naturePresetId' | 'carrierHz' | 'beatHz'>
): SoundscapeAcousticTelemetry {
  const nature =
    NATURE_PRESETS.find((n) => n.id === snap.naturePresetId) || NATURE_PRESETS[0];
  const leftHz = Math.round(snap.carrierHz);
  const rightHz = Number((snap.carrierHz + snap.beatHz).toFixed(1));
  const binauralRangeDisplay = `${leftHz} Hz – ${rightHz} Hz`;

  const effectiveMinHz =
    nature.id === 'none' ? leftHz : Math.min(nature.minHz, leftHz);
  const effectiveMaxHz =
    nature.id === 'none' ? rightHz : Math.max(nature.maxHz, rightHz);

  const formatHz = (hz: number) =>
    hz >= 1000 ? `${hz.toLocaleString('en-US')} Hz` : `${hz} Hz`;

  return {
    soundscapeId: nature.id,
    soundscapeNameZh: nature.nameZh,
    soundscapeNameEn: nature.name,
    bpm: nature.bpm,
    bpmDisplay: nature.bpm === 0 ? '0 BPM' : `${nature.bpm} BPM`,
    bpmDetail: nature.bpmLabel,
    minHz: effectiveMinHz,
    maxHz: effectiveMaxHz,
    frequencyRangeDisplay:
      nature.id === 'none'
        ? binauralRangeDisplay
        : `${formatHz(nature.minHz)} – ${formatHz(nature.maxHz)}`,
    binauralRangeDisplay,
    combinedSpectrumDisplay: `${formatHz(effectiveMinHz)} – ${formatHz(Math.round(effectiveMaxHz))}`,
    modulationSummary: nature.modulationSummary,
    accentColor: nature.accentColor,
  };
}


export interface FocusAudioSnapshot {
  isPlaying: boolean;
  binauralPresetId: BinauralPresetId;
  naturePresetId: NaturePresetId;
  beatHz: number;
  carrierHz: number;
  masterVolume: number;
  binauralMix: number;
  natureMix: number;
  isMuted: boolean;
  timerDurationSec: number; // 0 = continuous
  timerRemainingSec: number;
  sessionElapsedSec: number;
}

export interface FocusSessionBookmarkInput {
  id: string;
  userId: string;
  label: string;
  timestampSec: number;
  binauralPresetId: BinauralPresetId;
  naturePresetId: NaturePresetId;
  beatHz: number;
  carrierHz: number;
  binauralMix: number;
  natureMix: number;
  masterVolume: number;
  timerDurationSec: number;
}

export interface FocusSessionBookmark extends FocusSessionBookmarkInput {
  createdAt?: unknown;
  updatedAt?: unknown;
}

export const MAX_BOOKMARK_LABEL_LEN = 80;
export const MAX_SESSION_TIMESTAMP_SEC = 86400;
export const MAX_TIMER_DURATION_SEC = 14400;

export function clampSessionTimestamp(seconds: number): number {
  if (typeof seconds !== 'number' || !Number.isFinite(seconds)) return 0;
  return Math.max(0, Math.min(MAX_SESSION_TIMESTAMP_SEC, Math.round(seconds)));
}

export function formatSessionTimestamp(totalSeconds: number): string {
  const safeSec = clampSessionTimestamp(totalSeconds);
  const hours = Math.floor(safeSec / 3600);
  const mins = Math.floor((safeSec % 3600) / 60);
  const secs = safeSec % 60;
  if (hours > 0) {
    return `${hours}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function sanitizeBookmarkLabel(label: string, fallback = '专注声场书签'): string {
  const cleaned = (typeof label === 'string' ? label : '').trim().replace(/\s+/g, ' ');
  if (!cleaned) {
    return fallback.trim().slice(0, MAX_BOOKMARK_LABEL_LEN) || '专注声场书签';
  }
  return cleaned.slice(0, MAX_BOOKMARK_LABEL_LEN);
}

export function computeRemainingFromElapsed(
  elapsedSec: number,
  timerDurationSec: number
): number {
  const safeDur = Math.max(0, Math.min(MAX_TIMER_DURATION_SEC, Math.round(timerDurationSec || 0)));
  if (safeDur <= 0) return 0;
  const safeElapsed = clampSessionTimestamp(elapsedSec);
  if (safeElapsed <= 0) return safeDur;
  const mod = safeElapsed % safeDur;
  return mod === 0 ? safeDur : safeDur - mod;
}

export function buildBookmarkSegmentFromSnapshot(
  snap: FocusAudioSnapshot,
  customLabel?: string
): Omit<FocusSessionBookmarkInput, 'id' | 'userId'> {
  const validBinaural =
    BINAURAL_PRESETS.find((p) => p.id === snap.binauralPresetId) || BINAURAL_PRESETS[0];
  const validNature =
    NATURE_PRESETS.find((n) => n.id === snap.naturePresetId) || NATURE_PRESETS[0];

  const timestampSec = clampSessionTimestamp(snap.sessionElapsedSec);
  const beatHz = Math.max(4, Math.min(45, Number((snap.beatHz || validBinaural.beatHz).toFixed(1))));
  const carrierHz = Math.max(100, Math.min(320, Math.round(snap.carrierHz || validBinaural.carrierHz)));
  const binauralMix = Math.max(0, Math.min(1, Number((snap.binauralMix ?? 0.42).toFixed(2))));
  const natureMix = Math.max(0, Math.min(1, Number((snap.natureMix ?? 0.72).toFixed(2))));
  const masterVolume = Math.max(0, Math.min(1, Number((snap.masterVolume ?? 0.68).toFixed(2))));
  const timerDurationSec = Math.max(
    0,
    Math.min(MAX_TIMER_DURATION_SEC, Math.round(snap.timerDurationSec || 0))
  );

  const defaultLabel = `${validBinaural.nameZh} · ${validNature.nameZh} @ ${formatSessionTimestamp(timestampSec)}`;

  return {
    label: sanitizeBookmarkLabel(customLabel || '', defaultLabel),
    timestampSec,
    binauralPresetId: validBinaural.id,
    naturePresetId: validNature.id,
    beatHz,
    carrierHz,
    binauralMix,
    natureMix,
    masterVolume,
    timerDurationSec,
  };
}

const STORAGE_KEY = 'mindlabz_cognitive_focus_audio_v1';

type SnapshotListener = (snapshot: FocusAudioSnapshot) => void;

class CognitiveFocusAudioEngine {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private masterGain: GainNode | null = null;
  private binauralLayerGain: GainNode | null = null;
  private natureLayerGain: GainNode | null = null;

  private leftOsc: OscillatorNode | null = null;
  private rightOsc: OscillatorNode | null = null;
  private leftPanner: StereoPannerNode | null = null;
  private rightPanner: StereoPannerNode | null = null;
  private natureCleanup: (() => void) | null = null;
  private timerIntervalId: number | null = null;

  private listeners = new Set<SnapshotListener>();

  private state: FocusAudioSnapshot = {
    isPlaying: false,
    binauralPresetId: 'gamma-40',
    naturePresetId: 'canopy-rain',
    beatHz: 40.0,
    carrierHz: 210,
    masterVolume: 0.68,
    binauralMix: 0.42,
    natureMix: 0.72,
    isMuted: false,
    timerDurationSec: 25 * 60,
    timerRemainingSec: 25 * 60,
    sessionElapsedSec: 0,
  };

  constructor() {
    this.hydrateFromStorage();
  }

  private hydrateFromStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<FocusAudioSnapshot>;
      const validBinaural = BINAURAL_PRESETS.some((p) => p.id === parsed.binauralPresetId)
        ? (parsed.binauralPresetId as BinauralPresetId)
        : 'gamma-40';
      const validNature = NATURE_PRESETS.some((n) => n.id === parsed.naturePresetId)
        ? (parsed.naturePresetId as NaturePresetId)
        : 'canopy-rain';

      const timerDur =
        typeof parsed.timerDurationSec === 'number' && parsed.timerDurationSec >= 0
          ? parsed.timerDurationSec
          : 25 * 60;

      this.state = {
        ...this.state,
        binauralPresetId: validBinaural,
        naturePresetId: validNature,
        beatHz:
          typeof parsed.beatHz === 'number' && parsed.beatHz >= 4 && parsed.beatHz <= 45
            ? Number(parsed.beatHz.toFixed(1))
            : this.state.beatHz,
        carrierHz:
          typeof parsed.carrierHz === 'number' && parsed.carrierHz >= 100 && parsed.carrierHz <= 320
            ? Math.round(parsed.carrierHz)
            : this.state.carrierHz,
        masterVolume:
          typeof parsed.masterVolume === 'number'
            ? Math.max(0, Math.min(1, parsed.masterVolume))
            : this.state.masterVolume,
        binauralMix:
          typeof parsed.binauralMix === 'number'
            ? Math.max(0, Math.min(1, parsed.binauralMix))
            : this.state.binauralMix,
        natureMix:
          typeof parsed.natureMix === 'number'
            ? Math.max(0, Math.min(1, parsed.natureMix))
            : this.state.natureMix,
        isMuted: Boolean(parsed.isMuted),
        timerDurationSec: timerDur,
        timerRemainingSec: timerDur,
      };
    } catch {
      // Ignore storage parse failure
    }
  }

  private persist(): void {
    if (typeof window === 'undefined') return;
    try {
      const toStore = {
        binauralPresetId: this.state.binauralPresetId,
        naturePresetId: this.state.naturePresetId,
        beatHz: this.state.beatHz,
        carrierHz: this.state.carrierHz,
        masterVolume: this.state.masterVolume,
        binauralMix: this.state.binauralMix,
        natureMix: this.state.natureMix,
        isMuted: this.state.isMuted,
        timerDurationSec: this.state.timerDurationSec,
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
    } catch {
      // Ignore storage quota failure
    }
  }

  public getSnapshot(): FocusAudioSnapshot {
    return { ...this.state };
  }

  public subscribe(listener: SnapshotListener): () => void {
    this.listeners.add(listener);
    listener(this.getSnapshot());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(): void {
    const snap = this.getSnapshot();
    this.listeners.forEach((fn) => fn(snap));
  }

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();

      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-12, this.ctx.currentTime);
      this.compressor.knee.setValueAtTime(18, this.ctx.currentTime);
      this.compressor.ratio.setValueAtTime(4, this.ctx.currentTime);
      this.compressor.attack.setValueAtTime(0.01, this.ctx.currentTime);
      this.compressor.release.setValueAtTime(0.25, this.ctx.currentTime);

      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.84;

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);

      this.binauralLayerGain = this.ctx.createGain();
      this.natureLayerGain = this.ctx.createGain();

      this.binauralLayerGain.connect(this.masterGain);
      this.natureLayerGain.connect(this.masterGain);
      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.compressor);
      this.compressor.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private updateGains(): void {
    if (!this.ctx || !this.masterGain || !this.binauralLayerGain || !this.natureLayerGain) return;
    const now = this.ctx.currentTime;
    const effectiveMaster =
      this.state.isPlaying && !this.state.isMuted ? this.state.masterVolume : 0;

    // Gentle psychoacoustic scaling: pure sine binaural waves feel loud if raw > 0.25
    const scaledBinaural = this.state.binauralMix * 0.22;
    const scaledNature =
      this.state.naturePresetId === 'none' ? 0 : this.state.natureMix * 0.78;

    this.masterGain.gain.setTargetAtTime(effectiveMaster, now, 0.045);
    this.binauralLayerGain.gain.setTargetAtTime(scaledBinaural, now, 0.045);
    this.natureLayerGain.gain.setTargetAtTime(scaledNature, now, 0.06);
  }

  private startBinauralNodes(): void {
    const ctx = this.ctx;
    if (!ctx || !this.binauralLayerGain) return;

    this.stopBinauralNodes();

    const now = ctx.currentTime;
    const leftOsc = ctx.createOscillator();
    const rightOsc = ctx.createOscillator();
    leftOsc.type = 'sine';
    rightOsc.type = 'sine';

    leftOsc.frequency.setValueAtTime(this.state.carrierHz, now);
    rightOsc.frequency.setValueAtTime(this.state.carrierHz + this.state.beatHz, now);

    const leftPanner = ctx.createStereoPanner();
    const rightPanner = ctx.createStereoPanner();
    leftPanner.pan.setValueAtTime(-1, now);
    rightPanner.pan.setValueAtTime(1, now);

    leftOsc.connect(leftPanner);
    rightOsc.connect(rightPanner);
    leftPanner.connect(this.binauralLayerGain);
    rightPanner.connect(this.binauralLayerGain);

    leftOsc.start(now);
    rightOsc.start(now);

    this.leftOsc = leftOsc;
    this.rightOsc = rightOsc;
    this.leftPanner = leftPanner;
    this.rightPanner = rightPanner;
  }

  private stopBinauralNodes(): void {
    try {
      this.leftOsc?.stop();
      this.leftOsc?.disconnect();
    } catch {
      // ignore
    }
    try {
      this.rightOsc?.stop();
      this.rightOsc?.disconnect();
    } catch {
      // ignore
    }
    try {
      this.leftPanner?.disconnect();
      this.rightPanner?.disconnect();
    } catch {
      // ignore
    }
    this.leftOsc = null;
    this.rightOsc = null;
    this.leftPanner = null;
    this.rightPanner = null;
  }

  private createStereoNoiseBuffer(
    ctx: AudioContext,
    seconds: number,
    color: 'pink' | 'brown'
  ): AudioBuffer {
    const sampleRate = ctx.sampleRate;
    const frames = sampleRate * seconds;
    const buffer = ctx.createBuffer(2, frames, sampleRate);

    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch);
      if (color === 'pink') {
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < frames; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.969 * b2 + white * 0.153852;
          b3 = 0.8665 * b3 + white * 0.3104856;
          b4 = 0.55 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.016898;
          data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.075;
          b6 = white * 0.115926;
        }
      } else {
        let lastOut = 0;
        for (let i = 0; i < frames; i++) {
          const white = Math.random() * 2 - 1;
          lastOut = (lastOut + 0.02 * white) / 1.02;
          data[i] = lastOut * 2.1;
        }
      }
      // Crossfade first & last 4096 samples for truly click-free looping
      const fadeLen = Math.min(4096, Math.floor(frames / 8));
      for (let i = 0; i < fadeLen; i++) {
        const t = i / fadeLen;
        const endIdx = frames - fadeLen + i;
        const blended = data[endIdx] * (1 - t) + data[i] * t;
        data[i] = blended;
        data[endIdx] = blended;
      }
    }

    return buffer;
  }

  private startNatureNodes(): void {
    const ctx = this.ctx;
    if (!ctx || !this.natureLayerGain) return;

    this.stopNatureNodes();

    const preset = this.state.naturePresetId;
    if (preset === 'none') {
      return;
    }

    const now = ctx.currentTime;
    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(0.001, now);
    subGain.gain.linearRampToValueAtTime(1.0, now + 0.35);
    subGain.connect(this.natureLayerGain);

    const stopHandles: Array<() => void> = [];

    if (preset === 'canopy-rain') {
      const noiseBuf = this.createStereoNoiseBuffer(ctx, 8, 'pink');
      const src = ctx.createBufferSource();
      src.buffer = noiseBuf;
      src.loop = true;

      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.setValueAtTime(190, now);

      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(1550, now);

      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(0.14, now);
      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(280, now);
      lfo.connect(lfoGain);
      lfoGain.connect(lp.frequency);

      src.connect(hp);
      hp.connect(lp);
      lp.connect(subGain);

      src.start(now);
      lfo.start(now);

      stopHandles.push(() => {
        src.stop();
        lfo.stop();
        src.disconnect();
        hp.disconnect();
        lp.disconnect();
        lfo.disconnect();
        lfoGain.disconnect();
      });
    } else if (preset === 'ocean-tide') {
      const noiseBuf = this.createStereoNoiseBuffer(ctx, 8, 'brown');
      const src = ctx.createBufferSource();
      src.buffer = noiseBuf;
      src.loop = true;

      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(340, now);

      const swellGain = ctx.createGain();
      swellGain.gain.setValueAtTime(0.55, now);

      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(0.09, now); // ~11.1s ocean wave breath cycle
      const lfoAmp = ctx.createGain();
      lfoAmp.gain.setValueAtTime(0.38, now);
      const lfoFilter = ctx.createGain();
      lfoFilter.gain.setValueAtTime(170, now);

      lfo.connect(lfoAmp);
      lfoAmp.connect(swellGain.gain);
      lfo.connect(lfoFilter);
      lfoFilter.connect(lp.frequency);

      src.connect(lp);
      lp.connect(swellGain);
      swellGain.connect(subGain);

      src.start(now);
      lfo.start(now);

      stopHandles.push(() => {
        src.stop();
        lfo.stop();
        src.disconnect();
        lp.disconnect();
        swellGain.disconnect();
        lfo.disconnect();
        lfoAmp.disconnect();
        lfoFilter.disconnect();
      });
    } else if (preset === 'alpine-stream') {
      const noiseBuf = this.createStereoNoiseBuffer(ctx, 8, 'pink');
      const src = ctx.createBufferSource();
      src.buffer = noiseBuf;
      src.loop = true;

      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(760, now);
      bp.Q.setValueAtTime(0.85, now);

      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(0.19, now);
      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(240, now);
      lfo.connect(lfoGain);
      lfoGain.connect(bp.frequency);

      src.connect(bp);
      bp.connect(subGain);

      src.start(now);
      lfo.start(now);

      stopHandles.push(() => {
        src.stop();
        lfo.stop();
        src.disconnect();
        bp.disconnect();
        lfo.disconnect();
        lfoGain.disconnect();
      });
    } else {
      // night-hearth: Warm brown noise bed + subtle organic ember crackles
      const noiseBuf = this.createStereoNoiseBuffer(ctx, 8, 'brown');
      const src = ctx.createBufferSource();
      src.buffer = noiseBuf;
      src.loop = true;

      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(340, now);

      const baseBedGain = ctx.createGain();
      baseBedGain.gain.setValueAtTime(0.9, now);

      src.connect(lp);
      lp.connect(baseBedGain);
      baseBedGain.connect(subGain);
      src.start(now);

      let crackleTimer: number | null = null;
      const scheduleCrackle = () => {
        crackleTimer = window.setTimeout(() => {
          if (!this.state.isPlaying || this.state.naturePresetId !== 'night-hearth' || !this.ctx) {
            return;
          }
          try {
            const t = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const panner = this.ctx.createStereoPanner();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(1400 + Math.random() * 1900, t);
            panner.pan.setValueAtTime((Math.random() * 2 - 1) * 0.75, t);
            gain.gain.setValueAtTime(0.001, t);
            gain.gain.linearRampToValueAtTime(0.03 + Math.random() * 0.035, t + 0.004);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);

            osc.connect(gain);
            gain.connect(panner);
            panner.connect(subGain);
            osc.start(t);
            osc.stop(t + 0.05);
          } catch {
            // ignore
          }
          scheduleCrackle();
        }, 450 + Math.random() * 1450);
      };
      scheduleCrackle();

      stopHandles.push(() => {
        if (crackleTimer !== null) window.clearTimeout(crackleTimer);
        src.stop();
        src.disconnect();
        lp.disconnect();
        baseBedGain.disconnect();
      });
    }

    this.natureCleanup = () => {
      stopHandles.forEach((fn) => {
        try {
          fn();
        } catch {
          // ignore
        }
      });
      try {
        subGain.disconnect();
      } catch {
        // ignore
      }
    };
  }

  private stopNatureNodes(): void {
    if (this.natureCleanup) {
      this.natureCleanup();
      this.natureCleanup = null;
    }
  }

  private playCompletionChime(): void {
    const ctx = this.ctx;
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(528, now);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 2.5);
    } catch {
      // ignore
    }
  }

  private startSessionTicker(): void {
    this.stopSessionTicker();
    if (typeof window === 'undefined') return;
    this.timerIntervalId = window.setInterval(() => {
      if (!this.state.isPlaying) return;
      const nextElapsed = this.state.sessionElapsedSec + 1;
      if (this.state.timerDurationSec > 0) {
        const nextRem = Math.max(0, this.state.timerRemainingSec - 1);
        this.state = {
          ...this.state,
          sessionElapsedSec: nextElapsed,
          timerRemainingSec: nextRem,
        };
        if (nextRem <= 0) {
          this.pause();
          this.playCompletionChime();
          this.state = {
            ...this.state,
            timerRemainingSec: this.state.timerDurationSec,
          };
        }
      } else {
        this.state = {
          ...this.state,
          sessionElapsedSec: nextElapsed,
        };
      }
      this.emit();
    }, 1000);
  }

  private stopSessionTicker(): void {
    if (this.timerIntervalId !== null && typeof window !== 'undefined') {
      window.clearInterval(this.timerIntervalId);
      this.timerIntervalId = null;
    }
  }

  public play(): void {
    // Prevent overlapping with legacy ambientSound singleton
    try {
      if (ambientSound.isPlaying()) {
        ambientSound.stop();
      }
    } catch {
      // ignore
    }

    const ctx = this.ensureContext();
    if (!ctx) return;

    this.state = {
      ...this.state,
      isPlaying: true,
      timerRemainingSec:
        this.state.timerDurationSec > 0 && this.state.timerRemainingSec <= 0
          ? this.state.timerDurationSec
          : this.state.timerRemainingSec,
    };

    this.startBinauralNodes();
    this.startNatureNodes();
    this.updateGains();
    this.startSessionTicker();
    this.emit();
  }

  public pause(): void {
    if (!this.state.isPlaying) return;
    this.state = { ...this.state, isPlaying: false };
    this.updateGains();
    this.stopSessionTicker();

    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        if (!this.state.isPlaying) {
          this.stopBinauralNodes();
          this.stopNatureNodes();
        }
      }, 180);
    } else {
      this.stopBinauralNodes();
      this.stopNatureNodes();
    }

    this.emit();
  }

  public togglePlay(): boolean {
    if (this.state.isPlaying) {
      this.pause();
      return false;
    }
    this.play();
    return true;
  }

  public setBinauralPreset(id: BinauralPresetId): void {
    const preset = BINAURAL_PRESETS.find((p) => p.id === id);
    if (!preset) return;

    this.state = {
      ...this.state,
      binauralPresetId: preset.id,
      beatHz: preset.beatHz,
      carrierHz: preset.carrierHz,
    };

    if (this.ctx && this.leftOsc && this.rightOsc) {
      const now = this.ctx.currentTime;
      this.leftOsc.frequency.setTargetAtTime(preset.carrierHz, now, 0.05);
      this.rightOsc.frequency.setTargetAtTime(preset.carrierHz + preset.beatHz, now, 0.05);
    }

    this.persist();
    this.emit();
  }

  public setBeatFrequency(beatHz: number): void {
    const clamped = Math.max(4, Math.min(45, Number(beatHz.toFixed(1))));
    this.state = { ...this.state, beatHz: clamped };
    if (this.ctx && this.rightOsc) {
      this.rightOsc.frequency.setTargetAtTime(
        this.state.carrierHz + clamped,
        this.ctx.currentTime,
        0.04
      );
    }
    this.persist();
    this.emit();
  }

  public setCarrierFrequency(carrierHz: number): void {
    const clamped = Math.max(100, Math.min(320, Math.round(carrierHz)));
    this.state = { ...this.state, carrierHz: clamped };
    if (this.ctx && this.leftOsc && this.rightOsc) {
      const now = this.ctx.currentTime;
      this.leftOsc.frequency.setTargetAtTime(clamped, now, 0.04);
      this.rightOsc.frequency.setTargetAtTime(clamped + this.state.beatHz, now, 0.04);
    }
    this.persist();
    this.emit();
  }

  public setNaturePreset(id: NaturePresetId): void {
    this.state = { ...this.state, naturePresetId: id };
    if (this.state.isPlaying && this.ctx) {
      this.startNatureNodes();
      this.updateGains();
    }
    this.persist();
    this.emit();
  }

  public setMasterVolume(val: number): void {
    const clamped = Math.max(0, Math.min(1, val));
    this.state = {
      ...this.state,
      masterVolume: clamped,
      isMuted: clamped > 0 ? false : this.state.isMuted,
    };
    this.updateGains();
    this.persist();
    this.emit();
  }

  public setBinauralMix(val: number): void {
    const clamped = Math.max(0, Math.min(1, val));
    this.state = { ...this.state, binauralMix: clamped };
    this.updateGains();
    this.persist();
    this.emit();
  }

  public setNatureMix(val: number): void {
    const clamped = Math.max(0, Math.min(1, val));
    this.state = { ...this.state, natureMix: clamped };
    this.updateGains();
    this.persist();
    this.emit();
  }

  public toggleMute(): void {
    this.state = { ...this.state, isMuted: !this.state.isMuted };
    this.updateGains();
    this.persist();
    this.emit();
  }

  public setTimerDuration(minutes: number): void {
    const sec = Math.max(0, Math.round(minutes * 60));
    this.state = {
      ...this.state,
      timerDurationSec: sec,
      timerRemainingSec: sec,
    };
    this.persist();
    this.emit();
  }

  public resetTimer(): void {
    this.state = {
      ...this.state,
      timerRemainingSec: this.state.timerDurationSec,
      sessionElapsedSec: 0,
    };
    this.emit();
  }

  public seekSessionTimestamp(timestampSec: number): void {
    const safeSec = clampSessionTimestamp(timestampSec);
    this.state = {
      ...this.state,
      sessionElapsedSec: safeSec,
      timerRemainingSec: computeRemainingFromElapsed(safeSec, this.state.timerDurationSec),
    };
    this.persist();
    this.emit();
  }

  public applySessionBookmark(
    segment: Omit<FocusSessionBookmarkInput, 'id' | 'userId' | 'label'>,
    options?: { autoPlay?: boolean }
  ): void {
    const validBinaural = BINAURAL_PRESETS.some((p) => p.id === segment.binauralPresetId)
      ? segment.binauralPresetId
      : 'gamma-40';
    const validNature = NATURE_PRESETS.some((n) => n.id === segment.naturePresetId)
      ? segment.naturePresetId
      : 'canopy-rain';

    const beatHz = Math.max(4, Math.min(45, Number((segment.beatHz || 14).toFixed(1))));
    const carrierHz = Math.max(100, Math.min(320, Math.round(segment.carrierHz || 180)));
    const binauralMix = Math.max(0, Math.min(1, segment.binauralMix ?? 0.42));
    const natureMix = Math.max(0, Math.min(1, segment.natureMix ?? 0.72));
    const masterVolume = Math.max(0, Math.min(1, segment.masterVolume ?? 0.68));
    const timerDurationSec = Math.max(
      0,
      Math.min(MAX_TIMER_DURATION_SEC, Math.round(segment.timerDurationSec || 0))
    );
    const timestampSec = clampSessionTimestamp(segment.timestampSec);
    const natureChanged = validNature !== this.state.naturePresetId;
    const autoPlay = options?.autoPlay !== false;

    this.state = {
      ...this.state,
      binauralPresetId: validBinaural,
      naturePresetId: validNature,
      beatHz,
      carrierHz,
      binauralMix,
      natureMix,
      masterVolume,
      isMuted: autoPlay && masterVolume > 0 ? false : this.state.isMuted,
      timerDurationSec,
      sessionElapsedSec: timestampSec,
      timerRemainingSec: computeRemainingFromElapsed(timestampSec, timerDurationSec),
    };

    if (this.state.isPlaying && this.ctx) {
      if (this.leftOsc && this.rightOsc) {
        const now = this.ctx.currentTime;
        this.leftOsc.frequency.setTargetAtTime(carrierHz, now, 0.04);
        this.rightOsc.frequency.setTargetAtTime(carrierHz + beatHz, now, 0.04);
      }
      if (natureChanged) {
        this.startNatureNodes();
      }
      this.updateGains();
    } else if (autoPlay) {
      this.play();
    }

    this.persist();
    this.emit();
  }

  public getTimeDomainData(target: Uint8Array<ArrayBuffer>): boolean {
    if (!this.analyser || !this.state.isPlaying || this.state.isMuted) return false;
    this.analyser.getByteTimeDomainData(target);
    return true;
  }

  public getFrequencyData(target: Uint8Array<ArrayBuffer>): boolean {
    if (!this.analyser || !this.state.isPlaying || this.state.isMuted) return false;
    this.analyser.getByteFrequencyData(target);
    return true;
  }

  public getAnalyserBinCount(): number {
    return this.analyser?.frequencyBinCount || 128;
  }
}

export const cognitiveFocusAudio = new CognitiveFocusAudioEngine();

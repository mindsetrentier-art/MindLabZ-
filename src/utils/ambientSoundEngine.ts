// Ambient Soundscape Procedural Audio Engine for MindLabZ
// High-fidelity, zero external asset dependencies, zero network latency
// Uses Web Audio API for continuous procedural synthesis (Tranquil Forest, Zen Space, Ocean Waves, Cosmic Alpha, Mindful Rain)

export interface SoundscapeInfo {
  id: string;
  name: string;
  subtitle: string;
  tag: string;
  description: string;
  accentColor: string;
  iconName: 'forest' | 'zen' | 'ocean' | 'cosmic' | 'rain' | 'whitenoise';
}

export const SOUNDSCAPE_PRESETS: SoundscapeInfo[] = [
  {
    id: 'rain',
    name: '静心细雨 · 润物无声',
    subtitle: 'Mindful Gentle Rainfall',
    tag: '沉浸专注',
    description: '淅淅沥沥的屋檐细雨，阻隔外界杂音干扰，创造温润安静的心理学研习结界。',
    accentColor: '#38BDF8',
    iconName: 'rain',
  },
  {
    id: 'forest',
    name: '静谧森林 · 松风鸟语',
    subtitle: 'Tranquil Pine Forest & Birdsong',
    tag: '自然治愈',
    description: '轻柔林梢微风穿林而过，伴随清脆婉转的远山鸟鸣，唤醒副交感神经安宁感。',
    accentColor: '#10B981',
    iconName: 'forest',
  },
  {
    id: 'whitenoise',
    name: '纯净心流 · 柔和白噪',
    subtitle: 'Pure Soft White & Pink Noise',
    tag: '专注抗扰',
    description: '平缓恒定的宽频柔和白噪音与粉红噪声，阻断周边突发杂音干扰，帮助前额叶迅速进入无干扰呼吸专注。',
    accentColor: '#94A3B8',
    iconName: 'whitenoise',
  },
  {
    id: 'ocean',
    name: '深海心澜 · 潮汐舒缓',
    subtitle: 'Ocean Waves & Tidal Breathing',
    tag: '潮汐节律',
    description: '深邃舒缓的海浪涨退潮声，契合人类心跳呼吸周期的0.1Hz自然韵律。',
    accentColor: '#06B6D4',
    iconName: 'ocean',
  },
  {
    id: 'zen',
    name: '禅意空间 · 颂钵清音',
    subtitle: 'Zen Temple Singing Bowl & Chime',
    tag: '正念冥想',
    description: '432Hz 黄金律藏音颂钵长音回荡，泛音涟漪层叠，营造深度专注与心智内省空间。',
    accentColor: '#F59E0B',
    iconName: 'zen',
  },
  {
    id: 'cosmic',
    name: '星空冥想 · Alpha脑波',
    subtitle: 'Cosmic Alpha Binaural Waves',
    tag: '深度心流',
    description: '柔和双耳差频诱导 10Hz Alpha 专注脑波，置身浩瀚星空冥想，助推高效认知训练。',
    accentColor: '#8B5CF6',
    iconName: 'cosmic',
  },
];

type StateChangeListener = (isPlaying: boolean, activeId: string, volume: number) => void;

class AmbientSoundEngine {
  private ctx: AudioContext | null = null;
  private isPlayingState: boolean = false;
  private activeSoundscapeId: string = 'forest';
  private masterGain: GainNode | null = null;
  private volume: number = 0.65;
  private listeners: Set<StateChangeListener> = new Set();

  // Active soundscape generator nodes
  private currentNodes: {
    stop: () => void;
  } | null = null;

  // Intermittent timer for bird chirps or temple chimes
  private timerRef: number | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const savedId = localStorage.getItem('mindlabz_ambient_soundscape_id');
        if (savedId && SOUNDSCAPE_PRESETS.some((s) => s.id === savedId)) {
          this.activeSoundscapeId = savedId;
        }
        const savedVol = localStorage.getItem('mindlabz_ambient_volume');
        if (savedVol !== null) {
          const parsed = parseFloat(savedVol);
          if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
            this.volume = parsed;
          }
        }
      } catch {
        // ignore
      }
    }
  }

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public subscribe(listener: StateChangeListener): () => void {
    this.listeners.add(listener);
    // initial state call
    listener(this.isPlayingState, this.activeSoundscapeId, this.volume);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l(this.isPlayingState, this.activeSoundscapeId, this.volume));
  }

  public isPlaying(): boolean {
    return this.isPlayingState;
  }

  public getActiveSoundscapeId(): string {
    return this.activeSoundscapeId;
  }

  public getVolume(): number {
    return this.volume;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
    try {
      localStorage.setItem('mindlabz_ambient_volume', String(this.volume));
    } catch {
      // ignore
    }
    this.notify();
  }

  public togglePlay(): boolean {
    if (this.isPlayingState) {
      this.stop();
      return false;
    } else {
      this.play(this.activeSoundscapeId);
      return true;
    }
  }

  public play(soundscapeId?: string) {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    if (soundscapeId) {
      this.activeSoundscapeId = soundscapeId;
      try {
        localStorage.setItem('mindlabz_ambient_soundscape_id', soundscapeId);
      } catch {
        // ignore
      }
    }

    // Stop current nodes with crossfade
    if (this.currentNodes) {
      try {
        this.currentNodes.stop();
      } catch {
        // ignore
      }
      this.currentNodes = null;
    }
    if (this.timerRef !== null) {
      window.clearInterval(this.timerRef);
      this.timerRef = null;
    }

    // Start synthesized soundscape
    this.currentNodes = this.buildSoundscape(this.activeSoundscapeId);
    this.isPlayingState = true;
    this.notify();
  }

  public stop() {
    if (this.currentNodes) {
      try {
        this.currentNodes.stop();
      } catch {
        // ignore
      }
      this.currentNodes = null;
    }
    if (this.timerRef !== null) {
      window.clearInterval(this.timerRef);
      this.timerRef = null;
    }
    this.isPlayingState = false;
    this.notify();
  }

  /**
   * Procedural Audio Synthesizers for each soundscape
   */
  private buildSoundscape(id: string): { stop: () => void } {
    if (!this.ctx || !this.masterGain) {
      return { stop: () => {} };
    }

    switch (id) {
      case 'rain':
        return this.createRainSoundscape();
      case 'forest':
        return this.createForestSoundscape();
      case 'whitenoise':
        return this.createWhiteNoiseSoundscape();
      case 'zen':
        return this.createZenSoundscape();
      case 'ocean':
        return this.createOceanSoundscape();
      case 'cosmic':
        return this.createCosmicSoundscape();
      default:
        return this.createRainSoundscape();
    }
  }

  /**
   * Helper: Generate a continuous noise buffer
   */
  private createNoiseBuffer(seconds: number = 4): AudioBuffer {
    if (!this.ctx) throw new Error('No audio context');
    const sampleRate = this.ctx.sampleRate;
    const bufferSize = sampleRate * seconds;
    const buffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);

    // Pink-like smooth noise (Paul Kellet's filtered noise method)
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
    return buffer;
  }

  /**
   * 1. TRANQUIL FOREST: Whispering wind + intermittent procedural birdsong
   */
  private createForestSoundscape(): { stop: () => void } {
    if (!this.ctx || !this.masterGain) return { stop: () => {} };
    const ctx = this.ctx;

    const soundGain = ctx.createGain();
    soundGain.gain.setValueAtTime(0.001, ctx.currentTime);
    soundGain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 1.2);
    soundGain.connect(this.masterGain);

    // Wind Generator
    const noiseBuffer = this.createNoiseBuffer(5);
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    // Filter to simulate tree rustle
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(450, ctx.currentTime);
    filter.Q.setValueAtTime(1.8, ctx.currentTime);

    // Gentle LFO for wind gust breathing
    const lfo = ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.12, ctx.currentTime); // 8 second cycle
    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(220, ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    noiseSource.connect(filter);
    filter.connect(soundGain);

    noiseSource.start();
    lfo.start();

    // Intermittent Bird Chirp Generator
    const playBirdChirp = () => {
      if (!this.isPlayingState || !this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const baseFreq = 2200 + Math.random() * 800;
        const osc = this.ctx.createOscillator();
        const chirpGain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.35, now + 0.06);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.95, now + 0.14);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.2, now + 0.22);

        chirpGain.gain.setValueAtTime(0.001, now);
        chirpGain.gain.linearRampToValueAtTime(0.06, now + 0.04);
        chirpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);

        osc.connect(chirpGain);
        chirpGain.connect(soundGain);

        osc.start(now);
        osc.stop(now + 0.28);
      } catch {
        // ignore
      }
    };

    // Schedule random bird songs every 4 to 9 seconds
    const scheduleNextBird = () => {
      const delay = 4000 + Math.random() * 5000;
      this.timerRef = window.setTimeout(() => {
        playBirdChirp();
        if (Math.random() > 0.5) {
          setTimeout(playBirdChirp, 320); // double chirp
        }
        scheduleNextBird();
      }, delay);
    };
    scheduleNextBird();

    return {
      stop: () => {
        try {
          soundGain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.8);
          setTimeout(() => {
            try {
              noiseSource.stop();
              lfo.stop();
              soundGain.disconnect();
            } catch {
              // ignore
            }
          }, 850);
        } catch {
          // ignore
        }
      },
    };
  }

  /**
   * 2. ZEN SPACE: Tibetan Singing Bowl drone + Temple bell overtone shimmer (432Hz harmonic)
   */
  private createZenSoundscape(): { stop: () => void } {
    if (!this.ctx || !this.masterGain) return { stop: () => {} };
    const ctx = this.ctx;

    const soundGain = ctx.createGain();
    soundGain.gain.setValueAtTime(0.001, ctx.currentTime);
    soundGain.gain.linearRampToValueAtTime(0.38, ctx.currentTime + 1.5);
    soundGain.connect(this.masterGain);

    // Fundamental Meditative Drone (108Hz Sacred Ratio & 216Hz & 432Hz)
    const freqs = [108, 216, 432, 648];
    const oscillators: OscillatorNode[] = [];

    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      // Subtle vibrato
      const vibrato = ctx.createOscillator();
      vibrato.frequency.setValueAtTime(0.18 + idx * 0.05, ctx.currentTime);
      const vibratoGain = ctx.createGain();
      vibratoGain.gain.setValueAtTime(1.2 + idx, ctx.currentTime);
      vibrato.connect(vibratoGain);
      vibratoGain.connect(osc.frequency);

      const amp = idx === 0 ? 0.22 : idx === 1 ? 0.16 : 0.07;
      oscGain.gain.setValueAtTime(amp, ctx.currentTime);

      osc.connect(oscGain);
      oscGain.connect(soundGain);

      osc.start();
      vibrato.start();
      oscillators.push(osc);
      oscillators.push(vibrato);
    });

    // Periodic Tibetan Singing Bowl Strike (Every 11 seconds)
    const playSingingBowlStrike = () => {
      if (!this.isPlayingState || !this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const strikeOsc = this.ctx.createOscillator();
        const strikeGain = this.ctx.createGain();

        strikeOsc.type = 'sine';
        strikeOsc.frequency.setValueAtTime(432, now); // Natural Tuning A=432Hz

        strikeGain.gain.setValueAtTime(0.001, now);
        strikeGain.gain.linearRampToValueAtTime(0.18, now + 0.1);
        strikeGain.gain.exponentialRampToValueAtTime(0.0001, now + 7.5); // long reverberant tail

        strikeOsc.connect(strikeGain);
        strikeGain.connect(soundGain);

        strikeOsc.start(now);
        strikeOsc.stop(now + 8.0);
      } catch {
        // ignore
      }
    };

    playSingingBowlStrike();
    this.timerRef = window.setInterval(playSingingBowlStrike, 11000);

    return {
      stop: () => {
        try {
          soundGain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 1.0);
          setTimeout(() => {
            try {
              oscillators.forEach((o) => o.stop());
              soundGain.disconnect();
            } catch {
              // ignore
            }
          }, 1100);
        } catch {
          // ignore
        }
      },
    };
  }

  /**
   * 3. DEEP OCEAN: Rhythmic surf swell with slow 0.1Hz breathing rhythm
   */
  private createOceanSoundscape(): { stop: () => void } {
    if (!this.ctx || !this.masterGain) return { stop: () => {} };
    const ctx = this.ctx;

    const soundGain = ctx.createGain();
    soundGain.gain.setValueAtTime(0.001, ctx.currentTime);
    soundGain.gain.linearRampToValueAtTime(0.42, ctx.currentTime + 1.2);
    soundGain.connect(this.masterGain);

    const noiseBuffer = this.createNoiseBuffer(6);
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(320, ctx.currentTime);

    // Ocean Swell LFO
    const swellLfo = ctx.createOscillator();
    swellLfo.frequency.setValueAtTime(0.09, ctx.currentTime); // ~11s wave cycle
    const swellGain = ctx.createGain();
    swellGain.gain.setValueAtTime(0.15, ctx.currentTime);
    swellLfo.connect(swellGain);

    const waveGain = ctx.createGain();
    waveGain.gain.setValueAtTime(0.2, ctx.currentTime);
    swellGain.connect(waveGain.gain);

    noiseSource.connect(lowpass);
    lowpass.connect(waveGain);
    waveGain.connect(soundGain);

    noiseSource.start();
    swellLfo.start();

    return {
      stop: () => {
        try {
          soundGain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.8);
          setTimeout(() => {
            try {
              noiseSource.stop();
              swellLfo.stop();
              soundGain.disconnect();
            } catch {
              // ignore
            }
          }, 850);
        } catch {
          // ignore
        }
      },
    };
  }

  /**
   * 4. COSMIC ALPHA WAVES: Ethereal space synth + 10Hz binaural beat for focus
   */
  private createCosmicSoundscape(): { stop: () => void } {
    if (!this.ctx || !this.masterGain) return { stop: () => {} };
    const ctx = this.ctx;

    const soundGain = ctx.createGain();
    soundGain.gain.setValueAtTime(0.001, ctx.currentTime);
    soundGain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 1.5);
    soundGain.connect(this.masterGain);

    // Carrier & Binaural Offset (216Hz + 226Hz = 10Hz Alpha Wave)
    const oscLeft = ctx.createOscillator();
    const oscRight = ctx.createOscillator();
    const subOsc = ctx.createOscillator();

    oscLeft.type = 'sine';
    oscLeft.frequency.setValueAtTime(216, ctx.currentTime);

    oscRight.type = 'sine';
    oscRight.frequency.setValueAtTime(226, ctx.currentTime); // 10Hz difference

    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(108, ctx.currentTime);

    const leftGain = ctx.createGain();
    const rightGain = ctx.createGain();
    const subGain = ctx.createGain();

    leftGain.gain.setValueAtTime(0.18, ctx.currentTime);
    rightGain.gain.setValueAtTime(0.18, ctx.currentTime);
    subGain.gain.setValueAtTime(0.08, ctx.currentTime);

    oscLeft.connect(leftGain);
    oscRight.connect(rightGain);
    subOsc.connect(subGain);

    leftGain.connect(soundGain);
    rightGain.connect(soundGain);
    subGain.connect(soundGain);

    oscLeft.start();
    oscRight.start();
    subOsc.start();

    return {
      stop: () => {
        try {
          soundGain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 1.0);
          setTimeout(() => {
            try {
              oscLeft.stop();
              oscRight.stop();
              subOsc.stop();
              soundGain.disconnect();
            } catch {
              // ignore
            }
          }, 1050);
        } catch {
          // ignore
        }
      },
    };
  }

  /**
   * 5. MINDFUL RAIN: Gentle steady rain shower with droplet textures
   */
  private createRainSoundscape(): { stop: () => void } {
    if (!this.ctx || !this.masterGain) return { stop: () => {} };
    const ctx = this.ctx;

    const soundGain = ctx.createGain();
    soundGain.gain.setValueAtTime(0.001, ctx.currentTime);
    soundGain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 1.2);
    soundGain.connect(this.masterGain);

    const noiseBuffer = this.createNoiseBuffer(5);
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    // Filter for pleasant indoor rain tone
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, ctx.currentTime);

    noiseSource.connect(filter);
    filter.connect(soundGain);
    noiseSource.start();

    return {
      stop: () => {
        try {
          soundGain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.8);
          setTimeout(() => {
            try {
              noiseSource.stop();
              soundGain.disconnect();
            } catch {
              // ignore
            }
          }, 850);
        } catch {
          // ignore
        }
      },
    };
  }

  /**
   * 6. PURE WHITE & PINK NOISE: Soothing wideband noise bed for deep focus & acoustic masking
   */
  private createWhiteNoiseSoundscape(): { stop: () => void } {
    if (!this.ctx || !this.masterGain) return { stop: () => {} };
    const ctx = this.ctx;

    const soundGain = ctx.createGain();
    soundGain.gain.setValueAtTime(0.001, ctx.currentTime);
    soundGain.gain.linearRampToValueAtTime(0.32, ctx.currentTime + 1.2);
    soundGain.connect(this.masterGain);

    const noiseBuffer = this.createNoiseBuffer(5);
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    // Dual cascade filters to shape into warm, gentle pink-white sound without harsh hiss
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(850, ctx.currentTime);
    lowpass.Q.setValueAtTime(0.65, ctx.currentTime);

    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.setValueAtTime(75, ctx.currentTime);

    noiseSource.connect(highpass);
    highpass.connect(lowpass);
    lowpass.connect(soundGain);
    noiseSource.start();

    return {
      stop: () => {
        try {
          soundGain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.8);
          setTimeout(() => {
            try {
              noiseSource.stop();
              soundGain.disconnect();
            } catch {
              // ignore
            }
          }, 850);
        } catch {
          // ignore
        }
      },
    };
  }
}

export const ambientSound = new AmbientSoundEngine();

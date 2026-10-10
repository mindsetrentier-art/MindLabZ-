// Web Audio API harmonic sound generator for breathing guidance
// No external assets required; generates warm Tibetan singing bowl / soft meditative chimes.

class BreathingSoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    // Check saved preference
    const saved = localStorage.getItem('mindlabz_breathing_muted');
    if (saved !== null) {
      this.isMuted = saved === 'true';
    }
  }

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    localStorage.setItem('mindlabz_breathing_muted', String(muted));
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Warm Tibetan bell chime for Inhale phase (432Hz fundamental + soft octave overtones)
   */
  public playInhaleChime() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const fundamental = 432; // A = 432Hz natural frequency

      // Fundamental oscillator
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(fundamental, now);

      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.18, now + 0.08);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 2.2);

      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);

      // Soft harmonic overtone (864Hz)
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(fundamental * 2, now);

      gain2.gain.setValueAtTime(0, now);
      gain2.gain.linearRampToValueAtTime(0.06, now + 0.04);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 2.3);
      osc2.stop(now + 1.6);
    } catch {
      // Audio autoplay policy catch
    }
  }

  /**
   * High pure crystal chime for Hold phase (540Hz)
   */
  public playHoldChime() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const freq = 540;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 1.9);
    } catch {
      // Ignore
    }
  }

  /**
   * Low grounding bass bowl for Exhale phase (288Hz)
   */
  public playExhaleChime() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const freq = 288;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      // Gentle pitch downglide simulating deep sigh of relief
      osc.frequency.exponentialRampToValueAtTime(260, now + 1.5);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.16, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 2.6);
    } catch {
      // Ignore
    }
  }

  /**
   * Triumph meditative gong when session successfully completes
   */
  public playCompleteGong() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const chords = [360, 432, 540, 720];

      chords.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.15);

        gain.gain.setValueAtTime(0, now + idx * 0.15);
        gain.gain.linearRampToValueAtTime(0.14, now + idx * 0.15 + 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.15 + 3.0);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.15);
        osc.stop(now + idx * 0.15 + 3.2);
      });
    } catch {
      // Ignore
    }
  }
}

export const breathingAudio = new BreathingSoundEngine();

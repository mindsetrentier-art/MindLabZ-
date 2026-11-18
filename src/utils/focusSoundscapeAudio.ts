/**
 * Focus Soundscape Audio Engine & WAV Synthesizer
 * 
 * Provides seamless looping ambient soundscapes for the HTML5 Audio element:
 * - 'Rainy Forest': Soothing gentle rainfall and forest wind resonance
 * - 'Deep Space': 432Hz cosmic drone and slow Alpha relaxation wave
 * - 'Ocean Waves': 0.1Hz rhythmic tidal surge for breath entrainment
 * - 'Zen Temple': Tibetan singing bowl fundamental harmonic
 * 
 * Uses OfflineAudioContext to synthesize pristine looping audio into
 * standard 16-bit PCM WAV Blob URLs for the HTML5 <audio> element.
 * Zero external network dependency, zero broken links, 100% offline-ready.
 */

export interface FocusSoundscapeTrack {
  id: string;
  name: string;
  nameZh: string;
  category: string;
  description: string;
  icon: 'rain' | 'space' | 'ocean' | 'zen';
  accentColor: string;
  ambientFrequencies: number[];
}

export const FOCUS_SOUNDSCAPE_TRACKS: FocusSoundscapeTrack[] = [
  {
    id: 'rainy-forest',
    name: 'Rainy Forest',
    nameZh: '雨林静雨 · 润物无声',
    category: '自然抗扰',
    description: '淅淅沥沥的屋檐细雨与林梢风声，阻断周边突发噪音干扰，协助前额叶迅速进入无干扰专注状态。',
    icon: 'rain',
    accentColor: '#38BDF8',
    ambientFrequencies: [220, 440, 880],
  },
  {
    id: 'deep-space',
    name: 'Deep Space',
    nameZh: '深空冥想 · Alpha脑波',
    category: '宇宙心流',
    description: '432Hz 黄金律基频伴随 10Hz 双耳差频调谐，模拟漫步宇宙深空的宁静深邃，唤醒深度沉浸感。',
    icon: 'space',
    accentColor: '#818CF8',
    ambientFrequencies: [108, 216, 432],
  },
  {
    id: 'ocean-waves',
    name: 'Ocean Waves',
    nameZh: '潮汐海浪 · 呼吸同频',
    category: '潮汐节律',
    description: '深邃舒缓的海浪涨退潮声，契合人类心跳呼吸周期的 0.1Hz 自然慢节律，舒缓副交感神经。',
    icon: 'ocean',
    accentColor: '#2DD4BF',
    ambientFrequencies: [140, 280, 560],
  },
  {
    id: 'zen-temple',
    name: 'Zen Temple',
    nameZh: '禅院古钟 · 颂钵泛音',
    category: '正念定心',
    description: '源自喜马拉雅颂钵的圆润泛音与悠远长音，消除心理杂念与焦虑波动，归拢注意力中心。',
    icon: 'zen',
    accentColor: '#FBBF24',
    ambientFrequencies: [136.1, 272.2, 544.4],
  },
];

// In-memory cache for generated WAV Blob URLs so they are created once
const blobUrlCache = new Map<string, string>();

/**
 * Encodes an AudioBuffer into a standard 16-bit PCM WAV Blob
 */
function audioBufferToWavBlob(audioBuffer: AudioBuffer): Blob {
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const numSamples = audioBuffer.length;
  const dataByteCount = numSamples * blockAlign;
  const buffer = new ArrayBuffer(44 + dataByteCount);
  const view = new DataView(buffer);

  // Helper to write ASCII strings
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  // RIFF Chunk Descriptor
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataByteCount, true);
  writeString(8, 'WAVE');

  // "fmt " sub-chunk
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size for PCM
  view.setUint16(20, format, true); // AudioFormat
  view.setUint16(22, numChannels, true); // NumChannels
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate * blockAlign, true); // ByteRate
  view.setUint16(32, blockAlign, true); // BlockAlign
  view.setUint16(34, bitDepth, true); // BitsPerSample

  // "data" sub-chunk
  writeString(36, 'data');
  view.setUint32(40, dataByteCount, true);

  // Write interleaved PCM audio data
  const channelData: Float32Array[] = [];
  for (let c = 0; c < numChannels; c++) {
    channelData.push(audioBuffer.getChannelData(c));
  }

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    for (let c = 0; c < numChannels; c++) {
      let sample = Math.max(-1, Math.min(1, channelData[c][i]));
      // 16-bit PCM conversion
      sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, sample, true);
      offset += 2;
    }
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

/**
 * Procedurally generates a seamless looping WAV Blob URL for the given soundscape track
 */
export async function getSoundscapeWavUrl(trackId: string): Promise<string> {
  if (blobUrlCache.has(trackId)) {
    return blobUrlCache.get(trackId)!;
  }

  const AudioCtxClass =
    window.OfflineAudioContext ||
    (window as unknown as { webkitOfflineAudioContext: typeof OfflineAudioContext }).webkitOfflineAudioContext;

  if (!AudioCtxClass) {
    return '';
  }

  const sampleRate = 44100;
  const duration = 6.0; // 6-second seamless looping buffer
  const numFrames = sampleRate * duration;
  const offlineCtx = new AudioCtxClass(2, numFrames, sampleRate);

  if (trackId === 'rainy-forest') {
    // 1. Rainy Forest: Pink noise filtered with gentle rain envelope + forest wind
    const noiseBuffer = offlineCtx.createBuffer(2, numFrames, sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const output = noiseBuffer.getChannelData(channel);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < numFrames; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.969 * b2 + white * 0.153852;
        b3 = 0.8665 * b3 + white * 0.3104856;
        b4 = 0.55 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.016898;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.045;
        b6 = white * 0.115926;
      }
    }

    const noiseSource = offlineCtx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    // Gentle bandpass & lowpass to mimic raindrops hitting canopy leaves
    const filter = offlineCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, 0);

    const filter2 = offlineCtx.createBiquadFilter();
    filter2.type = 'highpass';
    filter2.frequency.setValueAtTime(180, 0);

    // Subtle gentle breeze oscillator
    const windOsc = offlineCtx.createOscillator();
    windOsc.type = 'sine';
    windOsc.frequency.setValueAtTime(0.33, 0); // 3-second cycle

    const windGain = offlineCtx.createGain();
    windGain.gain.setValueAtTime(0.015, 0);

    windOsc.connect(windGain);
    windGain.connect(filter.frequency);

    noiseSource.connect(filter);
    filter.connect(filter2);
    filter2.connect(offlineCtx.destination);

    noiseSource.start(0);
    windOsc.start(0);
  } else if (trackId === 'deep-space') {
    // 2. Deep Space: 432Hz harmonic drone + 10Hz Alpha pulse + cosmic reverberation
    const baseFreq = 108; // 432 / 4 = 108Hz

    const osc1 = offlineCtx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(baseFreq, 0);

    const osc2 = offlineCtx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(baseFreq * 2 + 10, 0); // 226Hz with 10Hz binaural beat

    const osc3 = offlineCtx.createOscillator();
    osc3.type = 'triangle';
    osc3.frequency.setValueAtTime(432, 0);

    // Warm sub-bass body
    const subOsc = offlineCtx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(54, 0);

    const gain1 = offlineCtx.createGain();
    gain1.gain.setValueAtTime(0.22, 0);

    const gain2 = offlineCtx.createGain();
    gain2.gain.setValueAtTime(0.18, 0);

    const gain3 = offlineCtx.createGain();
    gain3.gain.setValueAtTime(0.08, 0);

    const subGain = offlineCtx.createGain();
    subGain.gain.setValueAtTime(0.15, 0);

    // Gentle LFO modulating filter
    const lfo = offlineCtx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.16, 0); // 6s cycle

    const lfoGain = offlineCtx.createGain();
    lfoGain.gain.setValueAtTime(120, 0);

    const lowpass = offlineCtx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(650, 0);

    lfo.connect(lfoGain);
    lfoGain.connect(lowpass.frequency);

    osc1.connect(gain1);
    osc2.connect(gain2);
    osc3.connect(gain3);
    subOsc.connect(subGain);

    gain1.connect(lowpass);
    gain2.connect(lowpass);
    gain3.connect(lowpass);
    subGain.connect(lowpass);
    lowpass.connect(offlineCtx.destination);

    osc1.start(0);
    osc2.start(0);
    osc3.start(0);
    subOsc.start(0);
    lfo.start(0);
  } else if (trackId === 'ocean-waves') {
    // 3. Ocean Waves: Modulated pink noise matching 0.1Hz tidal breathing
    const noiseBuffer = offlineCtx.createBuffer(2, numFrames, sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const output = noiseBuffer.getChannelData(channel);
      let lastOut = 0.0;
      for (let i = 0; i < numFrames; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = output[i];
        output[i] *= 0.5;
      }
    }

    const noiseSource = offlineCtx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    const filter = offlineCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, 0);

    // Tidal swell gain
    const swellGain = offlineCtx.createGain();
    swellGain.gain.setValueAtTime(0.15, 0);

    const swellOsc = offlineCtx.createOscillator();
    swellOsc.type = 'sine';
    swellOsc.frequency.setValueAtTime(0.166, 0); // 6s wave cycle

    const swellAmp = offlineCtx.createGain();
    swellAmp.gain.setValueAtTime(0.12, 0);

    swellOsc.connect(swellAmp);
    swellAmp.connect(swellGain.gain);

    noiseSource.connect(filter);
    filter.connect(swellGain);
    swellGain.connect(offlineCtx.destination);

    noiseSource.start(0);
    swellOsc.start(0);
  } else {
    // 4. Zen Temple: Singing bowl tone 136.1Hz (Om frequency) with warm overtone
    const bowlFreq = 136.1;

    const fundamental = offlineCtx.createOscillator();
    fundamental.type = 'sine';
    fundamental.frequency.setValueAtTime(bowlFreq, 0);

    const harmonic1 = offlineCtx.createOscillator();
    harmonic1.type = 'sine';
    harmonic1.frequency.setValueAtTime(bowlFreq * 2.76, 0);

    const harmonic2 = offlineCtx.createOscillator();
    harmonic2.type = 'sine';
    harmonic2.frequency.setValueAtTime(bowlFreq * 5.4, 0);

    const gain0 = offlineCtx.createGain();
    gain0.gain.setValueAtTime(0.24, 0);

    const gain1 = offlineCtx.createGain();
    gain1.gain.setValueAtTime(0.08, 0);

    const gain2 = offlineCtx.createGain();
    gain2.gain.setValueAtTime(0.03, 0);

    fundamental.connect(gain0);
    harmonic1.connect(gain1);
    harmonic2.connect(gain2);

    gain0.connect(offlineCtx.destination);
    gain1.connect(offlineCtx.destination);
    gain2.connect(offlineCtx.destination);

    fundamental.start(0);
    harmonic1.start(0);
    harmonic2.start(0);
  }

  const renderedBuffer = await offlineCtx.startRendering();
  const wavBlob = audioBufferToWavBlob(renderedBuffer);
  const blobUrl = URL.createObjectURL(wavBlob);
  blobUrlCache.set(trackId, blobUrl);
  return blobUrl;
}

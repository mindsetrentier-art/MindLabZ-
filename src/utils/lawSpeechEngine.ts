import { useEffect, useState } from 'react';
import {
  buildTtsCacheKey,
  getOfflineChunkBlob,
  putOfflineChunkBlob,
  putOfflineLawManifest,
  hasOfflineChunk,
} from './offlineAudioCache';

export type LawVoicePresetId = 'gentle_female' | 'wise_male' | 'calm_bass' | 'system_default';

export type HighlightMarkerStyle = 'underline' | 'star' | 'dot' | 'sparkle' | 'none';

export interface HighlightMarkerMeta {
  id: HighlightMarkerStyle;
  label: string;
  symbol: string;
  sub: string;
}

export const HIGHLIGHT_MARKER_OPTIONS: HighlightMarkerMeta[] = [
  {
    id: 'underline',
    label: '流光银线',
    symbol: '━',
    sub: '字底银色流光线顺滑随行',
  },
  {
    id: 'star',
    label: '星芒标记',
    symbol: '✦',
    sub: '四角银星轻盈悬停于当前字上方',
  },
  {
    id: 'dot',
    label: '微光圆点',
    symbol: '•',
    sub: '温润珍珠圆点柔和点亮跟读位置',
  },
  {
    id: 'sparkle',
    label: '星辉闪烁',
    symbol: '✧',
    sub: '镂空星辉标点伴随韵律轻巧律动',
  },
  {
    id: 'none',
    label: '纯净银辉',
    symbol: '◌',
    sub: '仅保留液体流光银渐变色彩，无额外符号',
  },
];

export interface VoicePresetMeta {
  id: LawVoicePresetId;
  label: string;
  sub: string;
  pitch: number;
  rateMultiplier: number;
  sampleScript: string;
}

export const VOICE_PRESETS: VoicePresetMeta[] = [
  {
    id: 'gentle_female',
    label: '温婉女声',
    sub: '自然真人感 · 柔和共情，贴近日常叙事语调',
    pitch: 1.06,
    rateMultiplier: 1.0,
    sampleScript: '你好，我是温婉女声，将用柔和细腻的人声语调陪你研习每一条心理定律。',
  },
  {
    id: 'wise_male',
    label: '睿智男声',
    sub: '自然真人感 · 清晰笃定，适合认知与博弈拆解',
    pitch: 0.92,
    rateMultiplier: 1.0,
    sampleScript: '你好，我是睿智男声，用自然清晰的谈话节奏为你拆解认知与行为规律。',
  },
  {
    id: 'calm_bass',
    label: '沉稳低音',
    sub: '自然真人感 · 醇厚从容，适合深夜沉浸倾听',
    pitch: 0.8,
    rateMultiplier: 0.94,
    sampleScript: '你好，我是沉稳低音，以从容醇厚的声线伴你进入深度思辨与倾听。',
  },
  {
    id: 'system_default',
    label: '清朗原声',
    sub: '自然均衡人声 · 离线时自动切换设备本地语音',
    pitch: 1.0,
    rateMultiplier: 1.0,
    sampleScript: '你好，正在为你演示自然均衡的高清语音导读与流体银字跟随效果。',
  },
];

export interface LawSpeechPreferences {
  voicePreset: LawVoicePresetId;
  customVoiceURI: string;
  rate: number;
  smoothHighlight: boolean;
  highlightMarker: HighlightMarkerStyle;
}

const PREFS_STORAGE_KEY = 'mindlabz_law_speech_prefs_v1';

const DEFAULT_PREFERENCES: LawSpeechPreferences = {
  voicePreset: 'gentle_female',
  customVoiceURI: '',
  rate: 1.0,
  smoothHighlight: true,
  highlightMarker: 'underline',
};

function loadPreferences(): LawSpeechPreferences {
  if (typeof window === 'undefined') return { ...DEFAULT_PREFERENCES };
  try {
    const raw = window.localStorage.getItem(PREFS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PREFERENCES };
    const parsed = JSON.parse(raw) as Partial<LawSpeechPreferences>;
    const validPreset = VOICE_PRESETS.some((p) => p.id === parsed.voicePreset)
      ? (parsed.voicePreset as LawVoicePresetId)
      : DEFAULT_PREFERENCES.voicePreset;
    const validMarker = HIGHLIGHT_MARKER_OPTIONS.some((m) => m.id === parsed.highlightMarker)
      ? (parsed.highlightMarker as HighlightMarkerStyle)
      : DEFAULT_PREFERENCES.highlightMarker;
    const clampedRate =
      typeof parsed.rate === 'number' && !Number.isNaN(parsed.rate)
        ? Math.min(1.6, Math.max(0.65, Number(parsed.rate.toFixed(2))))
        : DEFAULT_PREFERENCES.rate;

    return {
      voicePreset: validPreset,
      customVoiceURI: typeof parsed.customVoiceURI === 'string' ? parsed.customVoiceURI : '',
      rate: clampedRate,
      smoothHighlight:
        typeof parsed.smoothHighlight === 'boolean'
          ? parsed.smoothHighlight
          : DEFAULT_PREFERENCES.smoothHighlight,
      highlightMarker: validMarker,
    };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

let preferences: LawSpeechPreferences = loadPreferences();
type PrefListener = (prefs: LawSpeechPreferences) => void;
const prefListeners = new Set<PrefListener>();

export function getLawSpeechPreferences(): LawSpeechPreferences {
  return preferences;
}

export function updateLawSpeechPreferences(
  partial: Partial<LawSpeechPreferences>
): LawSpeechPreferences {
  const nextRate =
    typeof partial.rate === 'number' && !Number.isNaN(partial.rate)
      ? Math.min(1.6, Math.max(0.65, Number(partial.rate.toFixed(2))))
      : preferences.rate;

  const nextPreset =
    partial.voicePreset && VOICE_PRESETS.some((p) => p.id === partial.voicePreset)
      ? partial.voicePreset
      : preferences.voicePreset;

  const nextMarker =
    partial.highlightMarker && HIGHLIGHT_MARKER_OPTIONS.some((m) => m.id === partial.highlightMarker)
      ? partial.highlightMarker
      : preferences.highlightMarker;

  preferences = {
    ...preferences,
    ...partial,
    voicePreset: nextPreset,
    rate: nextRate,
    highlightMarker: nextMarker,
  };

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(preferences));
    } catch {
      // ignore storage quota errors
    }
  }

  // Keep active playback rate & brushstroke timing synchronized live if speed changes mid-reading
  if (typeof partial.rate === 'number' && snapshot.isSpeaking) {
    const activePresetMeta =
      VOICE_PRESETS.find((p) => p.id === preferences.voicePreset) || VOICE_PRESETS[0];
    const liveRate = Math.min(1.8, Math.max(0.6, preferences.rate * activePresetMeta.rateMultiplier));
    snapshot = { ...snapshot, rate: liveRate };
    syncBrushTimingCssVars(liveRate);
    if (activeAudioEl) {
      try {
        activeAudioEl.playbackRate = liveRate;
      } catch {
        // ignore unsupported rate assignment
      }
    }
    notify();
  }

  for (const listener of prefListeners) {
    listener(preferences);
  }
  return preferences;
}

export function useLawSpeechPreferences(): [
  LawSpeechPreferences,
  (partial: Partial<LawSpeechPreferences>) => void
] {
  const [state, setState] = useState<LawSpeechPreferences>(preferences);

  useEffect(() => {
    const handler: PrefListener = (next) => setState(next);
    prefListeners.add(handler);
    setState(preferences);
    return () => {
      prefListeners.delete(handler);
    };
  }, []);

  return [state, updateLawSpeechPreferences];
}

export function getChineseVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
  const all = window.speechSynthesis.getVoices() || [];
  return all.filter((v) => v.lang.toLowerCase().startsWith('zh'));
}

export function useAvailableChineseVoices(): SpeechSynthesisVoice[] {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>(() => getChineseVoices());

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const refresh = () => setVoices(getChineseVoices());
    refresh();
    window.speechSynthesis.addEventListener?.('voiceschanged', refresh);
    return () => {
      window.speechSynthesis.removeEventListener?.('voiceschanged', refresh);
    };
  }, []);

  return voices;
}

export interface LawSpeechSegment {
  key: string;
  text: string;
  separator?: string;
}

export interface SegmentRange {
  key: string;
  startCp: number;
  endCp: number;
}

export interface LawSpeechSnapshot {
  activeLawId: string | null;
  isSpeaking: boolean;
  activeCpIndex: number;
  activeRangeLength: number;
  segments: Record<string, SegmentRange>;
  rate: number;
}

export interface StartLawSpeechOptions {
  lawId: string;
  segments: LawSpeechSegment[];
  rate?: number;
  presetOverride?: LawVoicePresetId;
  customVoiceURIOverride?: string;
  onComplete?: () => void;
  onStop?: () => void;
}

type Listener = (snapshot: LawSpeechSnapshot) => void;

const listeners = new Set<Listener>();

let sessionCounter = 0;
let activeTimer: ReturnType<typeof setInterval> | null = null;
let activeKeepAliveTimer: ReturnType<typeof setInterval> | null = null;
let activeWatchdogTimer: ReturnType<typeof setTimeout> | null = null;
let activeLaunchTimer: ReturnType<typeof setTimeout> | null = null;
let activeRafId: number | null = null;
let activeAudioEl: HTMLAudioElement | null = null;
let activeAbortController: AbortController | null = null;
let currentOnComplete: (() => void) | undefined;
let currentOnStop: (() => void) | undefined;

// Client-side Blob URL LRU cache for instant replays of Neural TTS samples & laws
const CLIENT_AUDIO_CACHE_LIMIT = 80;
const clientBlobCache = new Map<string, string>();
const clientPendingFetch = new Map<string, Promise<string | null>>();

let snapshot: LawSpeechSnapshot = {
  activeLawId: null,
  isSpeaking: false,
  activeCpIndex: -1,
  activeRangeLength: 1,
  segments: {},
  rate: preferences.rate,
};

function syncBrushTimingCssVars(playbackRate: number) {
  if (typeof document === 'undefined') return;
  const clamped = Math.max(0.65, Math.min(1.6, playbackRate || 1.0));
  const brushMs = Math.round(230 / clamped);
  const trailMs = Math.round(340 / clamped);
  const markerMs = Math.round(680 / clamped);
  const rootStyle = document.documentElement.style;
  rootStyle.setProperty('--tts-brush-ms', `${brushMs}ms`);
  rootStyle.setProperty('--tts-trail-ms', `${trailMs}ms`);
  rootStyle.setProperty('--tts-marker-ms', `${markerMs}ms`);
}

export function getActiveSpeechRate(): number {
  return snapshot.isSpeaking ? snapshot.rate : preferences.rate;
}

function notify() {
  for (const listener of listeners) {
    listener(snapshot);
  }
}

function getCharWeight(ch: string): number {
  if (!ch) return 0.15;
  if (/[。！？；\n]/.test(ch)) return 2.4;
  if (/[，,、：:.!?;]/.test(ch)) return 1.4;
  if (/[\s“”"‘’'「」『』《》〈〉()（）\[\]【】—\-·•]/.test(ch)) return 0.12;
  if (/[\u4e00-\u9fff\u3400-\u4dbf]/.test(ch)) return 1.0;
  return 0.45;
}

/**
 * Normalizes punctuation & symbols for TTS so words inside brackets or separated
 * by slashes/dots are NEVER skipped or mispronounced by either Neural TTS or Web Speech.
 */
export function normalizeDisplayChunkForSpeech(raw: string): string {
  return raw
    .replace(/([\u4e00-\u9fff])\s*\/\s*([\u4e00-\u9fff])/g, '$1与$2')
    .replace(/\s*\/\s*/g, '，')
    .replace(/[·•・]/g, '，')
    .replace(/[【】「」『』《》〈〉\[\]]/g, ' ')
    .replace(/\s*&\s*/g, ' 和 ')
    .replace(/\s*\+\s*/g, ' 加 ')
    .replace(/[ \t\r\n]+/g, ' ')
    .replace(/[，,]{2,}/g, '，')
    .replace(/[。]{2,}/g, '。')
    .trim();
}

function hasSpeakableCharacters(text: string): boolean {
  return /[\u4e00-\u9fff\u3400-\u4dbfA-Za-z0-9]/.test(text);
}

function pickVoiceAndPitch(prefs: LawSpeechPreferences): {
  voice: SpeechSynthesisVoice | null;
  pitch: number;
  effectiveRate: number;
} {
  const presetMeta =
    VOICE_PRESETS.find((p) => p.id === prefs.voicePreset) || VOICE_PRESETS[0];

  const baseRate = prefs.rate || 1.0;
  const effectiveRate = Math.min(1.8, Math.max(0.6, baseRate * presetMeta.rateMultiplier));

  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return { voice: null, pitch: presetMeta.pitch, effectiveRate };
  }

  const allVoices = window.speechSynthesis.getVoices() || [];
  const zhCN = allVoices.filter((v) => v.lang.toLowerCase().startsWith('zh-cn'));
  const zhAny = allVoices.filter((v) => v.lang.toLowerCase().startsWith('zh'));
  const pool = zhCN.length > 0 ? zhCN : zhAny;

  if (prefs.customVoiceURI) {
    const exact = allVoices.find((v) => v.voiceURI === prefs.customVoiceURI);
    if (exact) {
      return { voice: exact, pitch: presetMeta.pitch, effectiveRate };
    }
  }

  if (pool.length === 0) {
    return { voice: null, pitch: presetMeta.pitch, effectiveRate };
  }

  const femaleRegex = /xiaoxiao|xiaoyi|ting-ting|tingting|meijia|sin-ji|yaoyao|huihui|female|woman|女/i;
  const maleRegex = /yunxi|yunyang|yunjian|kangkang|dann|male|man|男/i;

  if (prefs.voicePreset === 'gentle_female') {
    const female =
      pool.find((v) => /natural|neural/i.test(v.name) && femaleRegex.test(v.name)) ||
      pool.find((v) => femaleRegex.test(v.name) && v.localService) ||
      pool.find((v) => femaleRegex.test(v.name)) ||
      pool.find((v) => /natural|neural/i.test(v.name)) ||
      pool[0];
    return { voice: female || null, pitch: presetMeta.pitch, effectiveRate };
  }

  if (prefs.voicePreset === 'wise_male' || prefs.voicePreset === 'calm_bass') {
    const male =
      pool.find((v) => /natural|neural/i.test(v.name) && maleRegex.test(v.name)) ||
      pool.find((v) => maleRegex.test(v.name) && v.localService) ||
      pool.find((v) => maleRegex.test(v.name));
    if (male) {
      return {
        voice: male,
        pitch: prefs.voicePreset === 'calm_bass' ? 0.86 : 0.98,
        effectiveRate,
      };
    }
    const fallback =
      pool.find((v) => /natural|neural/i.test(v.name)) ||
      pool.find((v) => v.localService) ||
      pool[0];
    return { voice: fallback || null, pitch: presetMeta.pitch, effectiveRate };
  }

  const defaultVoice =
    pool.find((v) => /natural|neural/i.test(v.name)) ||
    pool.find((v) => v.localService) ||
    pool[0];
  return { voice: defaultVoice || null, pitch: 1.0, effectiveRate };
}

function clearPlaybackResources() {
  if (activeTimer !== null) {
    clearInterval(activeTimer);
    activeTimer = null;
  }
  if (activeKeepAliveTimer !== null) {
    clearInterval(activeKeepAliveTimer);
    activeKeepAliveTimer = null;
  }
  if (activeWatchdogTimer !== null) {
    clearTimeout(activeWatchdogTimer);
    activeWatchdogTimer = null;
  }
  if (activeLaunchTimer !== null) {
    clearTimeout(activeLaunchTimer);
    activeLaunchTimer = null;
  }
  if (activeRafId !== null) {
    cancelAnimationFrame(activeRafId);
    activeRafId = null;
  }
  if (activeAbortController) {
    try {
      activeAbortController.abort();
    } catch {
      // ignore
    }
    activeAbortController = null;
  }
  if (activeAudioEl) {
    try {
      activeAudioEl.onended = null;
      activeAudioEl.onerror = null;
      activeAudioEl.pause();
      activeAudioEl.removeAttribute('src');
      activeAudioEl.load();
    } catch {
      // ignore
    }
    activeAudioEl = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore browser cancel quirk
    }
  }
}

function buildScriptAndMaps(segments: LawSpeechSegment[]) {
  let fullScript = '';
  const codepoints: string[] = [];
  const segmentMap: Record<string, SegmentRange> = {};

  const appendString = (str: string) => {
    const chars = Array.from(str);
    for (const ch of chars) {
      codepoints.push(ch);
    }
    fullScript += str;
  };

  segments.forEach((seg, idx) => {
    const cleanText = (seg.text || '').trim();
    if (!cleanText) return;

    const startCp = codepoints.length;
    appendString(cleanText);
    const endCp = codepoints.length;

    segmentMap[seg.key] = {
      key: seg.key,
      startCp,
      endCp,
    };

    if (idx < segments.length - 1) {
      const sep = seg.separator ?? '。';
      if (sep) appendString(sep);
    }
  });

  const cumWeights = new Float64Array(codepoints.length + 1);
  for (let i = 0; i < codepoints.length; i++) {
    cumWeights[i + 1] = cumWeights[i] + getCharWeight(codepoints[i]);
  }

  return {
    fullScript,
    codepoints,
    segmentMap,
    cumWeights,
  };
}

export interface SpeechChunk {
  startCp: number;
  endCp: number;
  displaySlice: string;
  spokenText: string;
  startWeight: number;
  endWeight: number;
}

/**
 * Splits fullScript into sentence-aligned chunks with exact [startCp, endCp) mapping
 * so neither Neural TTS nor Web Speech hits length limits or drops words.
 */
function buildSpeechChunks(
  codepoints: string[],
  cumWeights: Float64Array,
  startFromCp: number,
  firstMaxCp: number,
  subsequentMaxCp: number
): SpeechChunk[] {
  const chunks: SpeechChunk[] = [];
  const total = codepoints.length;
  let cursor = startFromCp;

  while (cursor < total) {
    const maxLen = chunks.length === 0 ? firstMaxCp : subsequentMaxCp;
    let end = Math.min(total, cursor + maxLen);

    if (end < total) {
      // Prefer major sentence ending near target length
      let splitAt = -1;
      for (let i = end - 1; i >= cursor + Math.floor(maxLen * 0.35); i--) {
        if (/[。！？；.!?\n]/.test(codepoints[i])) {
          splitAt = i + 1;
          break;
        }
      }
      // Fallback to clause pause punctuation
      if (splitAt === -1) {
        for (let i = end - 1; i >= cursor + Math.floor(maxLen * 0.3); i--) {
          if (/[，,、：:\s]/.test(codepoints[i])) {
            splitAt = i + 1;
            break;
          }
        }
      }
      if (splitAt > cursor) {
        end = splitAt;
      }
    }

    const displaySlice = codepoints.slice(cursor, end).join('');
    const spokenText = normalizeDisplayChunkForSpeech(displaySlice);
    if (spokenText && hasSpeakableCharacters(spokenText)) {
      chunks.push({
        startCp: cursor,
        endCp: end,
        displaySlice,
        spokenText,
        startWeight: cumWeights[cursor],
        endWeight: cumWeights[end],
      });
    } else if (chunks.length > 0) {
      // Absorb trailing punctuation cleanly into the previous chunk's range
      const prev = chunks[chunks.length - 1];
      prev.endCp = end;
      prev.displaySlice += displaySlice;
      prev.endWeight = cumWeights[end];
    }

    cursor = end;
  }

  return chunks;
}

function findCpByWeight(cumWeights: Float64Array, targetWeight: number, minCp = 0, maxCp?: number): number {
  const upperBound = Math.min(cumWeights.length - 2, maxCp ?? cumWeights.length - 2);
  if (upperBound < minCp) return Math.max(0, minCp);
  let lo = Math.max(0, minCp);
  let hi = upperBound;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (cumWeights[mid] <= targetWeight) {
      lo = mid;
    } else {
      hi = mid - 1;
    }
  }
  return Math.max(minCp, Math.min(upperBound, lo));
}

function base64ToWavBlob(base64: string, mimeType: string): Blob {
  const clean = base64.includes(',') ? base64.split(',')[1] : base64;
  const binaryString = atob(clean);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType || 'audio/wav' });
}

function memoizeClientBlobUrl(cacheKey: string, blob: Blob): string {
  const blobUrl = URL.createObjectURL(blob);
  if (clientBlobCache.size >= CLIENT_AUDIO_CACHE_LIMIT) {
    const oldestKey = clientBlobCache.keys().next().value;
    if (oldestKey) {
      const oldUrl = clientBlobCache.get(oldestKey);
      clientBlobCache.delete(oldestKey);
      if (oldUrl && activeAudioEl?.src !== oldUrl) {
        try {
          URL.revokeObjectURL(oldUrl);
        } catch {
          // ignore
        }
      }
    }
  }
  clientBlobCache.set(cacheKey, blobUrl);
  return blobUrl;
}

function fetchNeuralTtsBlobUrl(
  text: string,
  preset: LawVoicePresetId,
  signal?: AbortSignal,
  persistToOfflineDb = false
): Promise<string | null> {
  const cacheKey = buildTtsCacheKey(preset, text);
  const cached = clientBlobCache.get(cacheKey);
  if (cached) {
    clientBlobCache.delete(cacheKey);
    clientBlobCache.set(cacheKey, cached);
    return Promise.resolve(cached);
  }

  const inflight = clientPendingFetch.get(cacheKey);
  if (inflight) {
    return inflight;
  }

  const promise = (async () => {
    // 1. Always check persistent on-device IndexedDB first (works 100% offline!)
    const offlineBlob = await getOfflineChunkBlob(cacheKey);
    if (offlineBlob) {
      return memoizeClientBlobUrl(cacheKey, offlineBlob);
    }

    // 2. If offline and not cached on-device, return null immediately for Web Speech fallback
    const isOnline = typeof navigator === 'undefined' || navigator.onLine !== false;
    if (!isOnline) {
      return null;
    }

    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => timeoutController.abort(), 9000);
    const onExternalAbort = () => timeoutController.abort();
    signal?.addEventListener('abort', onExternalAbort, { once: true });

    try {
      const resp = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, preset }),
        signal: timeoutController.signal,
      });
      if (!resp.ok) {
        return null;
      }
      const data = await resp.json();
      if (!data?.audioBase64) {
        return null;
      }
      const resolvedMime = data.mimeType || 'audio/wav';
      const blob = base64ToWavBlob(data.audioBase64, resolvedMime);

      if (persistToOfflineDb) {
        await putOfflineChunkBlob({
          cacheKey,
          preset,
          text,
          mimeType: resolvedMime,
          blob,
          sizeBytes: blob.size,
          updatedAt: Date.now(),
        });
      }

      return memoizeClientBlobUrl(cacheKey, blob);
    } catch {
      return null;
    } finally {
      clearTimeout(timeoutId);
      signal?.removeEventListener('abort', onExternalAbort);
      clientPendingFetch.delete(cacheKey);
    }
  })();

  clientPendingFetch.set(cacheKey, promise);
  return promise;
}

export interface SpeechLawSourceLike {
  id: string;
  nameZh: string;
  shortExplanation: string;
  whyItHappens?: string;
  detailedExplanation?: string;
  relationshipCase?: string;
  realLifeExample?: string;
  keyTakeaway?: string;
}

export function buildLawSpeechSegmentsFromLaw(law: SpeechLawSourceLike): LawSpeechSegment[] {
  const mechanismText = law.whyItHappens || law.detailedExplanation;
  const caseText = law.relationshipCase || law.realLifeExample;
  const speechSegments: LawSpeechSegment[] = [
    { key: 'title', text: law.nameZh, separator: '。' },
    { key: 'short', text: law.shortExplanation, separator: '。' },
  ];
  if (mechanismText) {
    speechSegments.push({ key: 'mechanism', text: mechanismText, separator: '。' });
  }
  if (caseText) {
    speechSegments.push({ key: 'case', text: caseText, separator: '。' });
  }
  if (law.keyTakeaway) {
    speechSegments.push({ key: 'takeaway', text: law.keyTakeaway, separator: '。' });
  }
  return speechSegments;
}

export function buildNeuralChunksForSegments(segments: LawSpeechSegment[]): SpeechChunk[] {
  const { fullScript, codepoints, cumWeights } = buildScriptAndMaps(segments);
  if (!fullScript || codepoints.length === 0) return [];
  return buildSpeechChunks(codepoints, cumWeights, 0, 105, 210);
}

export interface PreloadLawAudioResult {
  ok: boolean;
  lawId: string;
  totalBytes: number;
  cachedChunks: number;
  totalChunks: number;
  error?: string;
}

/**
 * Downloads and persists all Neural TTS audio chunks for a law into IndexedDB
 * so it can be played offline in low-connectivity environments.
 */
export async function preloadLawAudio(options: {
  lawId: string;
  lawTitle: string;
  segments: LawSpeechSegment[];
  preset?: LawVoicePresetId;
  signal?: AbortSignal;
  onChunkProgress?: (completed: number, total: number) => void;
}): Promise<PreloadLawAudioResult> {
  const preset = options.preset ?? getLawSpeechPreferences().voicePreset;
  const chunks = buildNeuralChunksForSegments(options.segments);

  if (chunks.length === 0) {
    return {
      ok: false,
      lawId: options.lawId,
      totalBytes: 0,
      cachedChunks: 0,
      totalChunks: 0,
      error: '无可用朗读文本',
    };
  }

  let totalBytes = 0;
  let cachedChunks = 0;
  const chunkKeys: string[] = [];

  for (let i = 0; i < chunks.length; i++) {
    if (options.signal?.aborted) {
      return {
        ok: false,
        lawId: options.lawId,
        totalBytes,
        cachedChunks,
        totalChunks: chunks.length,
        error: 'aborted',
      };
    }

    const chunk = chunks[i];
    const cacheKey = buildTtsCacheKey(preset, chunk.spokenText);
    chunkKeys.push(cacheKey);

    let blob = await getOfflineChunkBlob(cacheKey);
    if (!blob) {
      const isOnline = typeof navigator === 'undefined' || navigator.onLine !== false;
      if (!isOnline) {
        return {
          ok: false,
          lawId: options.lawId,
          totalBytes,
          cachedChunks,
          totalChunks: chunks.length,
          error: '当前离线，无法下载新音频',
        };
      }

      const timeoutController = new AbortController();
      const timeoutId = setTimeout(() => timeoutController.abort(), 12000);
      const onExternalAbort = () => timeoutController.abort();
      options.signal?.addEventListener('abort', onExternalAbort, { once: true });

      try {
        const resp = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: chunk.spokenText, preset }),
          signal: timeoutController.signal,
        });
        if (!resp.ok) {
          return {
            ok: false,
            lawId: options.lawId,
            totalBytes,
            cachedChunks,
            totalChunks: chunks.length,
            error: `语音生成服务暂不可用 (${resp.status})`,
          };
        }
        const data = await resp.json();
        if (!data?.audioBase64) {
          return {
            ok: false,
            lawId: options.lawId,
            totalBytes,
            cachedChunks,
            totalChunks: chunks.length,
            error: '模型返回空音频',
          };
        }
        const mimeType = data.mimeType || 'audio/wav';
        blob = base64ToWavBlob(data.audioBase64, mimeType);
        await putOfflineChunkBlob({
          cacheKey,
          preset,
          text: chunk.spokenText,
          mimeType,
          blob,
          sizeBytes: blob.size,
          updatedAt: Date.now(),
        });
        memoizeClientBlobUrl(cacheKey, blob);
      } catch (err: any) {
        return {
          ok: false,
          lawId: options.lawId,
          totalBytes,
          cachedChunks,
          totalChunks: chunks.length,
          error: err?.name === 'AbortError' ? '请求超时或已取消' : '网络请求失败',
        };
      } finally {
        clearTimeout(timeoutId);
        options.signal?.removeEventListener('abort', onExternalAbort);
      }
    }

    totalBytes += blob.size;
    cachedChunks += 1;
    options.onChunkProgress?.(cachedChunks, chunks.length);
  }

  await putOfflineLawManifest({
    lawId: options.lawId,
    lawTitle: options.lawTitle,
    preset,
    chunkKeys,
    totalBytes,
    cachedAt: Date.now(),
  });

  return {
    ok: true,
    lawId: options.lawId,
    totalBytes,
    cachedChunks,
    totalChunks: chunks.length,
  };
}

export async function isLawPreloadedForPreset(
  segments: LawSpeechSegment[],
  preset: LawVoicePresetId
): Promise<boolean> {
  const chunks = buildNeuralChunksForSegments(segments);
  if (chunks.length === 0) return false;
  for (const c of chunks) {
    const exists = await hasOfflineChunk(buildTtsCacheKey(preset, c.spokenText));
    if (!exists) return false;
  }
  return true;
}

export function stopLawSpeech(onlyIfLawId?: string) {
  if (onlyIfLawId && snapshot.activeLawId !== onlyIfLawId) {
    return;
  }
  sessionCounter += 1;
  clearPlaybackResources();

  const stopCb = currentOnStop;
  currentOnComplete = undefined;
  currentOnStop = undefined;

  snapshot = {
    activeLawId: null,
    isSpeaking: false,
    activeCpIndex: -1,
    activeRangeLength: 1,
    segments: {},
    rate: preferences.rate,
  };
  notify();
  if (stopCb) stopCb();
}

export function startLawSpeech({
  lawId,
  segments,
  rate,
  presetOverride,
  customVoiceURIOverride,
  onComplete,
  onStop,
}: StartLawSpeechOptions) {
  sessionCounter += 1;
  const mySession = sessionCounter;

  clearPlaybackResources();
  const prevStop = currentOnStop;
  currentOnComplete = onComplete;
  currentOnStop = onStop;
  if (prevStop) prevStop();

  const basePrefs = getLawSpeechPreferences();
  const effectivePrefs: LawSpeechPreferences = {
    ...basePrefs,
    voicePreset: presetOverride ?? basePrefs.voicePreset,
    customVoiceURI:
      typeof customVoiceURIOverride === 'string'
        ? customVoiceURIOverride
        : presetOverride
        ? ''
        : basePrefs.customVoiceURI,
  };

  const presetMeta =
    VOICE_PRESETS.find((p) => p.id === effectivePrefs.voicePreset) || VOICE_PRESETS[0];
  const resolvedRate =
    typeof rate === 'number'
      ? rate
      : Math.min(1.8, Math.max(0.6, (effectivePrefs.rate || 1.0) * presetMeta.rateMultiplier));

  const { fullScript, codepoints, segmentMap, cumWeights } = buildScriptAndMaps(segments);
  const totalCp = codepoints.length;

  if (!fullScript || totalCp === 0) {
    snapshot = {
      activeLawId: null,
      isSpeaking: false,
      activeCpIndex: -1,
      activeRangeLength: 1,
      segments: {},
      rate: resolvedRate,
    };
    notify();
    return;
  }

  snapshot = {
    activeLawId: lawId,
    isSpeaking: true,
    activeCpIndex: 0,
    activeRangeLength: 1,
    segments: segmentMap,
    rate: resolvedRate,
  };
  syncBrushTimingCssVars(resolvedRate);
  notify();

  const finishPlayback = () => {
    if (mySession !== sessionCounter) return;
    const doneCb = currentOnComplete;
    stopLawSpeech(lawId);
    if (doneCb) doneCb();
  };

  /**
   * Bug-fixed, sentence-chunked Web Speech fallback engine:
   * - Separates cancel() and speak() by 50ms to avoid Chrome/Safari silent swallow bug
   * - Splits utterances into <=62 char chunks to prevent >150-char silent cutoffs
   * - Normalizes symbols without dropping enclosed words
   * - Uses watchdog timer + resume() keep-alive so no chunk stalls
   */
  const playViaWebSpeechFromCp = (startFromCp: number) => {
    if (mySession !== sessionCounter) return;

    const webChunks = buildSpeechChunks(codepoints, cumWeights, startFromCp, 58, 62);
    if (webChunks.length === 0) {
      finishPlayback();
      return;
    }

    const hasSpeechApi = typeof window !== 'undefined' && 'speechSynthesis' in window;
    if (!hasSpeechApi) {
      // Pure visual silent timer fallback if device has zero speech API
      let startTime = performance.now();
      const baseWeight = cumWeights[startFromCp];
      const totalRemainingWeight = cumWeights[totalCp] - baseWeight;
      activeTimer = setInterval(() => {
        if (mySession !== sessionCounter) return;
        const elapsedSec = (performance.now() - startTime) / 1000;
        const estWeight = baseWeight + elapsedSec * 4.5 * Math.max(0.5, resolvedRate);
        if (estWeight >= cumWeights[totalCp] + 0.3 && totalRemainingWeight >= 0) {
          finishPlayback();
          return;
        }
        const nextCp = findCpByWeight(cumWeights, estWeight, startFromCp, totalCp - 1);
        if (nextCp !== snapshot.activeCpIndex) {
          snapshot = { ...snapshot, activeCpIndex: nextCp, activeRangeLength: 1 };
          notify();
        }
      }, 40);
      return;
    }

    // Brief async gap after cancel() prevents Chromium/Safari from cancelling the new utterance
    activeLaunchTimer = setTimeout(() => {
      if (mySession !== sessionCounter) return;

      const { voice, pitch, effectiveRate } = pickVoiceAndPitch(effectivePrefs);
      const speechRate = typeof rate === 'number' ? rate : effectiveRate;

      try {
        window.speechSynthesis.resume();
      } catch {
        // ignore
      }

      // Keep Chrome speech engine alive on longer laws
      activeKeepAliveTimer = setInterval(() => {
        if (mySession !== sessionCounter) return;
        try {
          if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
          }
        } catch {
          // ignore
        }
      }, 8000);

      let chunkIdx = 0;

      const speakNextWebChunk = () => {
        if (mySession !== sessionCounter) return;
        if (activeTimer !== null) {
          clearInterval(activeTimer);
          activeTimer = null;
        }
        if (activeWatchdogTimer !== null) {
          clearTimeout(activeWatchdogTimer);
          activeWatchdogTimer = null;
        }

        if (chunkIdx >= webChunks.length) {
          finishPlayback();
          return;
        }

        const chunk = webChunks[chunkIdx];
        const utter = new SpeechSynthesisUtterance(chunk.spokenText);
        utter.lang = voice?.lang || 'zh-CN';
        utter.rate = speechRate;
        utter.pitch = pitch;
        if (voice) {
          utter.voice = voice;
        }

        const chunkWeightSpan = Math.max(0.5, chunk.endWeight - chunk.startWeight);
        const estimatedMs = Math.max(
          900,
          (chunkWeightSpan / (4.4 * Math.max(0.5, speechRate))) * 1000
        );

        let chunkStartedAt = performance.now();
        let lastBoundaryAt = 0;
        let lastBoundaryCp = chunk.startCp;
        let lastBoundaryNextCp = Math.min(chunk.endCp - 1, chunk.startCp + 1);
        let settled = false;

        const advanceChunk = () => {
          if (settled || mySession !== sessionCounter) return;
          settled = true;
          chunkIdx += 1;
          speakNextWebChunk();
        };

        snapshot = {
          ...snapshot,
          activeCpIndex: chunk.startCp,
          activeRangeLength: 1,
        };
        notify();

        activeTimer = setInterval(() => {
          if (mySession !== sessionCounter || settled) return;
          const now = performance.now();
          let nextCp = snapshot.activeCpIndex;

          if (lastBoundaryAt > 0 && now - lastBoundaryAt < 1100) {
            const span = Math.max(1, lastBoundaryNextCp - lastBoundaryCp);
            const msPerChar = 200 / Math.max(0.5, speechRate);
            const step = Math.min(span - 1, Math.floor((now - lastBoundaryAt) / msPerChar));
            nextCp = Math.min(chunk.endCp - 1, lastBoundaryCp + step);
          } else {
            const frac = Math.min(0.98, Math.max(0, (now - chunkStartedAt) / estimatedMs));
            const targetW = chunk.startWeight + frac * chunkWeightSpan;
            nextCp = findCpByWeight(cumWeights, targetW, chunk.startCp, chunk.endCp - 1);
          }

          if (nextCp !== snapshot.activeCpIndex) {
            snapshot = { ...snapshot, activeCpIndex: nextCp, activeRangeLength: 1 };
            notify();
          }
        }, 38);

        utter.onstart = () => {
          if (mySession !== sessionCounter || settled) return;
          chunkStartedAt = performance.now();
        };

        utter.onboundary = (event: SpeechSynthesisEvent) => {
          if (mySession !== sessionCounter || settled) return;
          const now = performance.now();
          const spokenIdx = typeof event.charIndex === 'number' ? event.charIndex : 0;
          const spokenLen =
            typeof event.charLength === 'number' && event.charLength > 0 ? event.charLength : 1;

          const spokenTotal = Math.max(1, chunk.spokenText.length);
          const fracStart = Math.min(0.99, Math.max(0, spokenIdx / spokenTotal));
          const fracEnd = Math.min(1, Math.max(fracStart, (spokenIdx + spokenLen) / spokenTotal));

          const mappedStart = findCpByWeight(
            cumWeights,
            chunk.startWeight + fracStart * chunkWeightSpan,
            chunk.startCp,
            chunk.endCp - 1
          );
          const mappedEnd = findCpByWeight(
            cumWeights,
            chunk.startWeight + fracEnd * chunkWeightSpan,
            mappedStart,
            chunk.endCp - 1
          );

          lastBoundaryAt = now;
          lastBoundaryCp = mappedStart;
          lastBoundaryNextCp = Math.max(mappedStart + 1, mappedEnd + 1);

          snapshot = {
            ...snapshot,
            activeCpIndex: mappedStart,
            activeRangeLength: 1,
          };
          notify();
        };

        utter.onend = () => {
          advanceChunk();
        };

        utter.onerror = (ev) => {
          if (mySession !== sessionCounter || settled) return;
          if (ev.error === 'canceled' || ev.error === 'interrupted') {
            return;
          }
          if (ev.error === 'not-allowed') {
            stopLawSpeech(lawId);
            return;
          }
          advanceChunk();
        };

        // Safety watchdog in case browser forgets to fire onend on a chunk
        activeWatchdogTimer = setTimeout(() => {
          advanceChunk();
        }, Math.max(4500, estimatedMs + 3500));

        try {
          window.speechSynthesis.speak(utter);
        } catch {
          advanceChunk();
        }
      };

      speakNextWebChunk();
    }, 50);
  };

  // Attempt Neural TTS (which resolves persistent IndexedDB offline cache first, then /api/tts online)
  // unless user explicitly selected an OS local customVoiceURI.
  const shouldUseNeuralTts = !effectivePrefs.customVoiceURI;

  if (!shouldUseNeuralTts) {
    playViaWebSpeechFromCp(0);
    return;
  }

  // Pipelined Human Neural TTS path: short first chunk (<105 chars) for sub-second start,
  // longer fluent chunks (<210 chars) prefetched seamlessly in background.
  const neuralChunks = buildSpeechChunks(codepoints, cumWeights, 0, 105, 210);
  if (neuralChunks.length === 0) {
    finishPlayback();
    return;
  }

  const abortController = new AbortController();
  activeAbortController = abortController;

  const prefetchPromises = new Map<number, Promise<string | null>>();
  const ensureChunkAudio = (idx: number): Promise<string | null> => {
    if (idx < 0 || idx >= neuralChunks.length) return Promise.resolve(null);
    let existing = prefetchPromises.get(idx);
    if (!existing) {
      existing = fetchNeuralTtsBlobUrl(
        neuralChunks[idx].spokenText,
        effectivePrefs.voicePreset,
        abortController.signal
      );
      prefetchPromises.set(idx, existing);
    }
    return existing;
  };

  // Start fetching chunk 0 (and chunk 1 immediately if short enough)
  void ensureChunkAudio(0);
  if (neuralChunks.length > 1) {
    void ensureChunkAudio(1);
  }

  const playNeuralChunk = async (idx: number) => {
    if (mySession !== sessionCounter) return;
    if (idx >= neuralChunks.length) {
      finishPlayback();
      return;
    }

    const chunk = neuralChunks[idx];
    // Prefetch next chunk in background while current plays
    if (idx + 1 < neuralChunks.length) {
      void ensureChunkAudio(idx + 1);
    }

    const blobUrl = await ensureChunkAudio(idx);
    if (mySession !== sessionCounter) return;

    if (!blobUrl) {
      // Seamless fallback to bug-fixed chunked Web Speech from this exact point
      playViaWebSpeechFromCp(chunk.startCp);
      return;
    }

    const audio = new Audio(blobUrl);
    activeAudioEl = audio;
    audio.playbackRate = resolvedRate;
    if ('preservesPitch' in audio) {
      (audio as HTMLAudioElement & { preservesPitch: boolean }).preservesPitch = true;
    }

    const chunkWeightSpan = Math.max(0.5, chunk.endWeight - chunk.startWeight);
    const estDurationSec = Math.max(0.8, chunkWeightSpan / (4.4 * Math.max(0.5, resolvedRate)));

    const syncHighlightLoop = () => {
      if (mySession !== sessionCounter || activeAudioEl !== audio) return;
      const dur = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : estDurationSec;
      const frac = Math.min(1, Math.max(0, audio.currentTime / dur));
      const targetWeight = chunk.startWeight + frac * chunkWeightSpan;
      const nextCp = findCpByWeight(cumWeights, targetWeight, chunk.startCp, chunk.endCp - 1);

      if (nextCp !== snapshot.activeCpIndex) {
        snapshot = {
          ...snapshot,
          activeCpIndex: nextCp,
          activeRangeLength: 1,
        };
        notify();
      }
      activeRafId = requestAnimationFrame(syncHighlightLoop);
    };

    audio.onended = () => {
      if (mySession !== sessionCounter) return;
      if (activeRafId !== null) {
        cancelAnimationFrame(activeRafId);
        activeRafId = null;
      }
      void playNeuralChunk(idx + 1);
    };

    audio.onerror = () => {
      if (mySession !== sessionCounter) return;
      if (activeRafId !== null) {
        cancelAnimationFrame(activeRafId);
        activeRafId = null;
      }
      playViaWebSpeechFromCp(chunk.startCp);
    };

    try {
      snapshot = {
        ...snapshot,
        activeCpIndex: chunk.startCp,
        activeRangeLength: 1,
      };
      notify();
      await audio.play();
      if (mySession !== sessionCounter) return;
      activeRafId = requestAnimationFrame(syncHighlightLoop);
    } catch {
      if (mySession !== sessionCounter) return;
      playViaWebSpeechFromCp(chunk.startCp);
    }
  };

  void playNeuralChunk(0);
}

export function toggleLawSpeech(options: StartLawSpeechOptions): boolean {
  if (snapshot.isSpeaking && snapshot.activeLawId === options.lawId) {
    stopLawSpeech(options.lawId);
    return false;
  }
  startLawSpeech(options);
  return true;
}

export function useLawSpeech(lawId?: string) {
  const [state, setState] = useState<LawSpeechSnapshot>(snapshot);

  useEffect(() => {
    const handler: Listener = (next) => {
      setState(next);
    };
    listeners.add(handler);
    setState(snapshot);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  const isSpeakingThisLaw = Boolean(lawId && state.isSpeaking && state.activeLawId === lawId);

  return {
    isSpeakingThisLaw,
    globalIsSpeaking: state.isSpeaking,
    activeLawId: state.activeLawId,
    activeCpIndex: isSpeakingThisLaw ? state.activeCpIndex : -1,
    activeRangeLength: isSpeakingThisLaw ? state.activeRangeLength : 0,
    segments: isSpeakingThisLaw ? state.segments : {},
    rate: isSpeakingThisLaw ? state.rate : preferences.rate,
  };
}

import React, { useMemo } from 'react';
import { Volume2 } from 'lucide-react';
import {
  HighlightMarkerStyle,
  SegmentRange,
  useLawSpeechPreferences,
} from '../../utils/lawSpeechEngine';

interface SilverSpeechTextProps {
  text: string;
  isSpeaking: boolean;
  activeCpIndex: number;
  segmentRange?: SegmentRange;
  tone?: 'light' | 'dark';
  smoothTransition?: boolean;
  markerStyle?: HighlightMarkerStyle;
  className?: string;
}

interface WordSpan {
  start: number;
  end: number;
  isWordLike: boolean;
}

interface SegmenterLike {
  segment(input: string): Iterable<{ segment: string; index: number; isWordLike?: boolean }>;
}

/**
 * Tokenizes text into word-aligned codepoint spans using Intl.Segmenter('zh-CN')
 * when supported, falling back cleanly to CJK / Latin word runs.
 * Only executed for the single actively spoken card.
 */
function tokenizeWordSpans(text: string, chars: string[]): {
  spans: WordSpan[];
  cpToWordIdx: Int32Array;
} {
  const cpToWordIdx = new Int32Array(chars.length);
  cpToWordIdx.fill(-1);
  const spans: WordSpan[] = [];

  if (!text || chars.length === 0) {
    return { spans, cpToWordIdx };
  }

  // Build UTF-16 offset -> codepoint index lookup
  const utf16ToCp = new Map<number, number>();
  let u16 = 0;
  for (let cp = 0; cp < chars.length; cp++) {
    utf16ToCp.set(u16, cp);
    u16 += chars[cp].length;
  }
  utf16ToCp.set(u16, chars.length);

  const IntlAny = Intl as unknown as {
    Segmenter?: new (
      locale: string,
      options: { granularity: 'word' }
    ) => SegmenterLike;
  };

  if (typeof IntlAny?.Segmenter === 'function') {
    try {
      const segmenter = new IntlAny.Segmenter('zh-CN', { granularity: 'word' });
      for (const seg of segmenter.segment(text)) {
        const start = utf16ToCp.get(seg.index) ?? 0;
        const end = utf16ToCp.get(seg.index + seg.segment.length) ?? start + Array.from(seg.segment).length;
        if (end <= start) continue;
        const wordIdx = spans.length;
        const isWordLike = Boolean(seg.isWordLike);
        spans.push({ start, end, isWordLike });
        for (let i = start; i < end && i < chars.length; i++) {
          cpToWordIdx[i] = wordIdx;
        }
      }
      if (spans.length > 0) {
        return { spans, cpToWordIdx };
      }
    } catch {
      // Fallback below if browser throws on locale
    }
  }

  // Regex fallback: group Latin/numeric words, pairs of CJK glyphs, whitespace, or punctuation
  const tokenRegex = /[A-Za-z0-9'’-]+|[\u4e00-\u9fff\u3400-\u4dbf]{1,2}|\s+|./g;
  let match: RegExpExecArray | null;
  while ((match = tokenRegex.exec(text)) !== null) {
    const start = utf16ToCp.get(match.index) ?? 0;
    const end = utf16ToCp.get(match.index + match[0].length) ?? chars.length;
    if (end <= start) continue;
    const wordIdx = spans.length;
    const isWordLike = /[A-Za-z0-9\u4e00-\u9fff\u3400-\u4dbf]/.test(match[0]);
    spans.push({ start, end, isWordLike });
    for (let i = start; i < end && i < chars.length; i++) {
      cpToWordIdx[i] = wordIdx;
    }
  }

  return { spans, cpToWordIdx };
}

function renderActiveMarker(marker: HighlightMarkerStyle, tone: 'light' | 'dark', ch: string) {
  if (!ch || /^\s+$/.test(ch) || marker === 'none') return null;

  if (marker === 'underline') {
    return <span className="law-tts-marker-underline" aria-hidden="true" />;
  }

  const symbol = marker === 'star' ? '✦' : marker === 'dot' ? '•' : '✧';
  const toneClass =
    tone === 'dark' ? 'law-tts-marker-symbol-dark' : 'law-tts-marker-symbol-light';

  return (
    <span className={`law-tts-marker-symbol ${toneClass}`} aria-hidden="true">
      {symbol}
    </span>
  );
}

/**
 * Renders law text plainly when idle (zero DOM overhead across 1,300+ cards),
 * and switches to calligraphic fluid brushstroke silver tracking synchronized
 * with live playback speed while spoken aloud.
 */
export const SilverSpeechText: React.FC<SilverSpeechTextProps> = ({
  text,
  isSpeaking,
  activeCpIndex,
  segmentRange,
  tone = 'light',
  smoothTransition,
  markerStyle,
  className,
}) => {
  const [prefs] = useLawSpeechPreferences();
  const isSmooth = typeof smoothTransition === 'boolean' ? smoothTransition : prefs.smoothHighlight;
  const activeMarker = markerStyle ?? prefs.highlightMarker;

  const tokenized = useMemo(() => {
    if (!isSpeaking) return null;
    const chars = Array.from(text || '');
    const { spans, cpToWordIdx } = tokenizeWordSpans(text || '', chars);
    return { chars, spans, cpToWordIdx };
  }, [isSpeaking, text]);

  if (!isSpeaking || !segmentRange || activeCpIndex < 0 || !tokenized) {
    return className ? <span className={className}>{text}</span> : <>{text}</>;
  }

  const { chars, spans, cpToWordIdx } = tokenized;
  const localIdx = activeCpIndex - segmentRange.startCp;
  const isBeforeSegment = activeCpIndex < segmentRange.startCp;
  const isAfterSegment = activeCpIndex >= segmentRange.endCp;
  const transitionModeClass = isSmooth ? 'law-tts-smooth' : 'law-tts-instant';

  if (isBeforeSegment) {
    return className ? <span className={className}>{text}</span> : <>{text}</>;
  }

  if (isAfterSegment) {
    const readClass = tone === 'dark' ? 'text-slate-300/90' : 'text-slate-500';
    return (
      <span className={`${transitionModeClass} ${readClass} law-tts-read-char ${className || ''}`}>
        {text}
      </span>
    );
  }

  const activeWordIdx =
    localIdx >= 0 && localIdx < cpToWordIdx.length ? cpToWordIdx[localIdx] : -1;
  const activeWord = activeWordIdx >= 0 ? spans[activeWordIdx] : null;
  const wStart = activeWord && activeWord.isWordLike ? activeWord.start : localIdx;
  const wEnd = activeWord && activeWord.isWordLike ? activeWord.end : localIdx + 1;

  const isDark = tone === 'dark';
  const readCharClass = isDark ? 'text-slate-300/90 law-tts-read-char' : 'text-slate-500 law-tts-read-char';
  const activeCharClass = isDark ? 'law-tts-silver-active-dark' : 'law-tts-silver-active-light';
  const wordInkClass = isDark ? 'law-tts-brush-word-ink-dark' : 'law-tts-brush-word-ink-light';
  const wordUpcomingClass = isDark
    ? 'law-tts-brush-word-upcoming-dark'
    : 'law-tts-brush-word-upcoming-light';
  const brushTipClass = isDark ? 'law-tts-brush-tip-dark' : 'law-tts-brush-tip-light';
  const tail1Class = isDark ? 'law-tts-brush-tail-1-dark' : 'law-tts-brush-tail-1-light';
  const tail2Class = isDark ? 'law-tts-brush-tail-2-dark' : 'law-tts-brush-tail-2-light';

  return (
    <span className={`law-tts-brush-root ${transitionModeClass} ${className || ''}`}>
      {chars.map((ch, idx) => {
        if (idx === localIdx) {
          return (
            <span key={idx} className={activeCharClass} data-tts-active="true">
              {renderActiveMarker(activeMarker, tone, ch)}
              {ch}
            </span>
          );
        }

        if (isSmooth && !/^\s+$/.test(ch)) {
          // Leading feathered brush nib just ahead of the active character
          if (idx === localIdx + 1) {
            return (
              <span key={idx} className={brushTipClass}>
                {ch}
              </span>
            );
          }

          // Remaining characters inside the currently voiced word softly prepare for the stroke
          if (idx > localIdx + 1 && idx < wEnd) {
            return (
              <span key={idx} className={wordUpcomingClass}>
                {ch}
              </span>
            );
          }

          // Already voiced characters within the same word retain wet silver ink continuity
          if (idx >= wStart && idx < localIdx) {
            return (
              <span key={idx} className={wordInkClass}>
                {ch}
              </span>
            );
          }

          // Calligraphic fading ink trail ("feibai") across the 2 chars trailing behind
          const distBehind = localIdx - idx;
          if (distBehind === 1) {
            return (
              <span key={idx} className={tail1Class}>
                {ch}
              </span>
            );
          }
          if (distBehind === 2) {
            return (
              <span key={idx} className={tail2Class}>
                {ch}
              </span>
            );
          }
        }

        if (idx < localIdx) {
          return (
            <span key={idx} className={readCharClass}>
              {ch}
            </span>
          );
        }

        return <React.Fragment key={idx}>{ch}</React.Fragment>;
      })}
    </span>
  );
};

interface LawVoiceToggleSwitchProps {
  isOn: boolean;
  onToggle: (e: React.MouseEvent) => void;
  tone?: 'light' | 'dark';
  size?: 'sm' | 'md';
  label?: string;
}

/**
 * Tactile bottom-right ON/OFF voice reading switch for every psychology law.
 */
export const LawVoiceToggleSwitch: React.FC<LawVoiceToggleSwitchProps> = ({
  isOn,
  onToggle,
  tone = 'light',
  size = 'md',
  label,
}) => {
  const isCompact = size === 'sm';
  const isDark = tone === 'dark';

  const containerStyle = isOn
    ? isDark
      ? 'bg-slate-800/90 border-slate-300/60 text-slate-100 shadow-[0_0_14px_rgba(203,213,225,0.28)]'
      : 'bg-slate-900 border-slate-400/80 text-slate-100 shadow-[0_4px_14px_rgba(15,23,42,0.18)]'
    : isDark
    ? 'bg-stone-900/90 border-stone-700/80 text-stone-300 hover:border-slate-400/50 hover:text-white'
    : 'bg-stone-50/95 border-stone-200/90 text-stone-700 hover:border-slate-400 hover:bg-white';

  const trackStyle = isOn
    ? 'bg-gradient-to-r from-slate-400 via-slate-200 to-slate-300 border-slate-200/80'
    : isDark
    ? 'bg-stone-700 border-stone-600'
    : 'bg-stone-200 border-stone-300/80';

  const thumbStyle = isOn
    ? isCompact
      ? 'translate-x-3.5 bg-slate-900 shadow-xs'
      : 'translate-x-4 bg-slate-900 shadow-xs'
    : 'translate-x-0.5 bg-white shadow-xs';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isOn}
      aria-label={isOn ? '关闭语音朗读定律' : '打开开关语音朗读定律'}
      title={isOn ? '关闭语音朗读（停止银字跟读）' : '打开开关 · 语音朗读并银色高亮正在阅读的文字'}
      onClick={(e) => {
        e.stopPropagation();
        onToggle(e);
      }}
      className={`inline-flex items-center gap-2 rounded-full border transition-all duration-200 cursor-pointer select-none shrink-0 btn-tactile ${
        isCompact ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-xs'
      } ${containerStyle}`}
    >
      {isOn ? (
        <span className="flex items-end gap-[2px] h-3 w-3.5 justify-center shrink-0" aria-hidden="true">
          <span className="w-[2px] rounded-full bg-slate-200 animate-soundWave1" />
          <span className="w-[2px] rounded-full bg-slate-300 animate-soundWave2" />
          <span className="w-[2px] rounded-full bg-slate-100 animate-soundWave3" />
        </span>
      ) : (
        <Volume2 className={`${isCompact ? 'w-3 h-3' : 'w-3.5 h-3.5'} shrink-0 opacity-75`} />
      )}

      <span className={`font-medium whitespace-nowrap ${isOn ? 'text-slate-100' : ''}`}>
        {label || (isOn ? '银字朗读中' : '语音朗读')}
      </span>

      <span
        className={`relative inline-flex items-center rounded-full border transition-colors duration-200 shrink-0 ${
          isCompact ? 'w-7 h-4' : 'w-8 h-4.5'
        } ${trackStyle}`}
      >
        <span
          className={`inline-block rounded-full transition-transform duration-200 ${
            isCompact ? 'w-3 h-3' : 'w-3.5 h-3.5'
          } ${thumbStyle}`}
        />
      </span>
    </button>
  );
};

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AudioWaveform, Play, Pause, VolumeX } from 'lucide-react';
import {
  BINAURAL_PRESETS,
  NATURE_PRESETS,
  FocusAudioSnapshot,
  cognitiveFocusAudio,
} from '../../utils/cognitiveFocusAudio';
import { gameAudio } from '../../utils/gameAudio';

const BAR_COUNT = 32;
const STAGE_HEIGHT_PX = 144;

type VisualizerMode = 'spectrum' | 'symmetric';

interface BandSummary {
  low: number;
  mid: number;
  high: number;
  peakHzLabel: string;
}

/**
 * Logarithmic bin-to-bar mapping across the Web Audio AnalyserNode spectrum
 * (fftSize = 256 -> 128 bins up to ~22-24kHz) concentrating resolution across
 * 100 Hz – 5.5 kHz where binaural carriers and natural acoustic soundscapes live.
 */
function buildBarBinRanges(binCount: number): Array<{ start: number; end: number }> {
  const maxBin = Math.min(binCount - 1, 48);
  const ranges: Array<{ start: number; end: number }> = [];
  for (let i = 0; i < BAR_COUNT; i++) {
    const t0 = i / BAR_COUNT;
    const t1 = (i + 1) / BAR_COUNT;
    const b0 = Math.floor(Math.pow(t0, 1.45) * maxBin);
    const b1 = Math.max(b0, Math.floor(Math.pow(t1, 1.45) * maxBin));
    ranges.push({ start: b0, end: Math.min(maxBin, b1) });
  }
  return ranges;
}

const BAND_SHORT_LABELS = ['80Hz', '250Hz', '650Hz', '1.4k', '3.2k', '6kHz'];

export const AmbientSoundscapeVisualizer: React.FC = () => {
  const [snap, setSnap] = useState<FocusAudioSnapshot>(() => cognitiveFocusAudio.getSnapshot());
  const [mode, setMode] = useState<VisualizerMode>('spectrum');
  const [bands, setBands] = useState<BandSummary>({
    low: 0,
    mid: 0,
    high: 0,
    peakHzLabel: '—',
  });

  const barRefs = useRef<Array<HTMLDivElement | null>>([]);
  const capRefs = useRef<Array<HTMLDivElement | null>>([]);
  const lowMeterRef = useRef<HTMLDivElement | null>(null);
  const midMeterRef = useRef<HTMLDivElement | null>(null);
  const highMeterRef = useRef<HTMLDivElement | null>(null);
  const peakHoldLevelsRef = useRef<Float32Array>(new Float32Array(BAR_COUNT));

  useEffect(() => {
    return cognitiveFocusAudio.subscribe(setSnap);
  }, []);

  const activeBinaural =
    BINAURAL_PRESETS.find((p) => p.id === snap.binauralPresetId) || BINAURAL_PRESETS[0];
  const activeNature =
    NATURE_PRESETS.find((n) => n.id === snap.naturePresetId) || NATURE_PRESETS[0];

  const barIndices = useMemo(() => Array.from({ length: BAR_COUNT }, (_, i) => i), []);

  useEffect(() => {
    const binCount = cognitiveFocusAudio.getAnalyserBinCount();
    const freqData = new Uint8Array(binCount);
    const barRanges = buildBarBinRanges(binCount);
    const peakHold = peakHoldLevelsRef.current;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    let rafId = 0;
    let lastFrameAt = 0;
    let lastUiTextAt = 0;
    const minFrameMs = prefersReducedMotion ? 110 : 16;

    const tick = (now: number) => {
      if (now - lastFrameAt < minFrameMs) {
        rafId = requestAnimationFrame(tick);
        return;
      }
      lastFrameAt = now;

      const isActive = cognitiveFocusAudio.getFrequencyData(freqData);
      let lowSum = 0;
      let midSum = 0;
      let highSum = 0;
      let maxBarLevel = 0;
      let maxBarIdx = 0;

      for (let i = 0; i < BAR_COUNT; i++) {
        let level = 0.05;
        if (isActive) {
          const { start, end } = barRanges[i];
          let sum = 0;
          let count = 0;
          for (let b = start; b <= end; b++) {
            sum += freqData[b] || 0;
            count += 1;
          }
          const avgByte = count > 0 ? sum / count : 0;
          // Mild acoustic tilt boost for upper frequencies so pink/brown roll-off still animates crisply
          const tiltBoost = 1 + (i / BAR_COUNT) * 0.42;
          level = Math.min(1, Math.max(0.05, Math.pow((avgByte / 255) * tiltBoost, 0.88)));
        }

        if (level > peakHold[i]) {
          peakHold[i] = level;
        } else {
          peakHold[i] = Math.max(level, peakHold[i] - 0.018);
        }

        const barEl = barRefs.current[i];
        if (barEl) {
          barEl.style.setProperty('--eq-scale', level.toFixed(3));
          const opacity = isActive ? Math.min(1, 0.42 + level * 0.58) : 0.28;
          barEl.style.setProperty('--eq-opacity', opacity.toFixed(2));
        }

        const capEl = capRefs.current[i];
        if (capEl) {
          const capOffsetPx = -(peakHold[i] * (STAGE_HEIGHT_PX - 12));
          capEl.style.setProperty('--eq-cap-y', `${capOffsetPx.toFixed(1)}px`);
          capEl.style.setProperty('--eq-cap-opacity', isActive ? '0.9' : '0.2');
        }

        if (i < 9) lowSum += level;
        else if (i < 21) midSum += level;
        else highSum += level;

        if (level > maxBarLevel) {
          maxBarLevel = level;
          maxBarIdx = i;
        }
      }

      const lowAvg = Math.min(1, lowSum / 9);
      const midAvg = Math.min(1, midSum / 12);
      const highAvg = Math.min(1, highSum / 11);

      lowMeterRef.current?.style.setProperty('--eq-band', (isActive ? lowAvg : 0.04).toFixed(3));
      midMeterRef.current?.style.setProperty('--eq-band', (isActive ? midAvg : 0.04).toFixed(3));
      highMeterRef.current?.style.setProperty('--eq-band', (isActive ? highAvg : 0.04).toFixed(3));

      if (now - lastUiTextAt > 140) {
        lastUiTextAt = now;
        const approxHz = Math.round(90 * Math.pow(65, maxBarIdx / (BAR_COUNT - 1)));
        setBands({
          low: isActive ? Math.round(lowAvg * 100) : 0,
          mid: isActive ? Math.round(midAvg * 100) : 0,
          high: isActive ? Math.round(highAvg * 100) : 0,
          peakHzLabel: isActive ? `${approxHz} Hz` : '—',
        });
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [snap.isPlaying, snap.isMuted, mode]);

  const handleTogglePlay = () => {
    gameAudio.playTap();
    cognitiveFocusAudio.togglePlay();
  };

  return (
    <section
      aria-label="实时环境声景频谱均衡器"
      className="rounded-2xl bg-[#0B111E] text-slate-100 border border-slate-800/90 p-5 sm:p-6 space-y-4 shadow-[0_18px_40px_-14px_rgba(15,23,42,0.45)]"
    >
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 text-[11px] font-mono text-sky-300/90 flex-wrap">
            <AudioWaveform className="w-3.5 h-3.5 text-sky-400 shrink-0" aria-hidden="true" />
            <span>AMBIENT SOUNDSCAPE VISUALIZER</span>
            <span aria-hidden="true">·</span>
            <span>{snap.isMuted ? '已静音' : snap.isPlaying ? '实时频谱响应中' : '待机监听'}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-300 flex-wrap">
            <span className="font-semibold text-white">{activeBinaural.nameZh}</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>{activeNature.nameZh}</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="font-mono tabular-nums text-sky-300">
              {snap.beatHz.toFixed(1)} Hz 差频
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Mode Switcher */}
          <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-900 border border-slate-800">
            <button
              type="button"
              onClick={() => {
                gameAudio.playSelect();
                setMode('spectrum');
              }}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                mode === 'spectrum'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              频谱柱形
            </button>
            <button
              type="button"
              onClick={() => {
                gameAudio.playSelect();
                setMode('symmetric');
              }}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                mode === 'symmetric'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              对称声场
            </button>
          </div>

          <button
            type="button"
            onClick={handleTogglePlay}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              snap.isPlaying
                ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                : 'bg-sky-500 hover:bg-sky-400 text-slate-950'
            }`}
          >
            {snap.isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5" aria-hidden="true" />
                <span>暂停声景</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
                <span>启动可视化声景</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Real-Time CSS Equalizer Bars Stage */}
      <div className="relative rounded-xl bg-slate-950/90 border border-slate-800/80 px-3 sm:px-4 pt-4 pb-3 overflow-hidden">
        <div
          className={`eq-visualizer-stage relative h-36 flex gap-1 sm:gap-1.5 ${
            mode === 'symmetric' ? 'items-center' : 'items-end'
          }`}
        >
          {barIndices.map((idx) => {
            const barToneClass =
              idx < 9
                ? 'from-sky-500 via-cyan-400 to-slate-100'
                : idx < 21
                ? 'from-indigo-500 via-sky-400 to-teal-200'
                : 'from-teal-500 via-emerald-300 to-white';

            return (
              <div
                key={idx}
                className={`relative flex-1 h-full flex justify-center ${
                  mode === 'symmetric' ? 'items-center' : 'items-end'
                }`}
              >
                <div
                  ref={(el) => {
                    barRefs.current[idx] = el;
                  }}
                  className={`w-full rounded-t-sm ${
                    mode === 'symmetric'
                      ? 'h-[86%] rounded-b-sm eq-visualizer-bar-symmetric'
                      : 'h-full eq-visualizer-bar'
                  } bg-gradient-to-t ${barToneClass}`}
                />
                {mode === 'spectrum' && (
                  <div
                    ref={(el) => {
                      capRefs.current[idx] = el;
                    }}
                    className="eq-visualizer-cap absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-slate-100 pointer-events-none"
                  />
                )}
              </div>
            );
          })}

          {(!snap.isPlaying || snap.isMuted) && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="px-3 py-1.5 rounded-lg bg-slate-900/85 border border-slate-700/80 text-[11px] text-slate-300 flex items-center gap-1.5 backdrop-blur-xs">
                {snap.isMuted ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
                    <span>当前处于静音状态，取消静音后实时显示频率动态</span>
                  </>
                ) : (
                  <span>点击「启动可视化声景」或下方播放器即可看到实时音频频谱响应</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Frequency Axis Ticks */}
        <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono tabular-nums text-slate-500">
          {BAND_SHORT_LABELS.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
      </div>

      {/* Live Tri-Band Acoustic Energy Readouts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-0.5 text-xs">
        <div className="rounded-xl bg-slate-900/75 border border-slate-800/80 p-3 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>低频载波 (Sub/Bass)</span>
            <span className="font-mono tabular-nums text-sky-300 font-semibold">{bands.low}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              ref={lowMeterRef}
              className="eq-band-meter-fill h-full w-full rounded-full bg-sky-400"
            />
          </div>
        </div>

        <div className="rounded-xl bg-slate-900/75 border border-slate-800/80 p-3 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>中频声床 (Mid/Warm)</span>
            <span className="font-mono tabular-nums text-indigo-300 font-semibold">
              {bands.mid}%
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              ref={midMeterRef}
              className="eq-band-meter-fill h-full w-full rounded-full bg-indigo-400"
            />
          </div>
        </div>

        <div className="rounded-xl bg-slate-900/75 border border-slate-800/80 p-3 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>高频泛音 (Air/Detail)</span>
            <span className="font-mono tabular-nums text-teal-300 font-semibold">
              {bands.high}%
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              ref={highMeterRef}
              className="eq-band-meter-fill h-full w-full rounded-full bg-teal-400"
            />
          </div>
        </div>

        <div className="rounded-xl bg-slate-900/75 border border-slate-800/80 p-3 flex flex-col justify-between">
          <span className="text-[11px] text-slate-400">主导声学峰值频段</span>
          <span className="font-mono tabular-nums text-sm font-bold text-white">
            {bands.peakHzLabel}
          </span>
        </div>
      </div>
    </section>
  );
};

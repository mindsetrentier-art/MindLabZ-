import React, { useEffect, useState } from 'react';
import { Activity, Gauge, Radio } from 'lucide-react';
import {
  BINAURAL_PRESETS,
  FocusAudioSnapshot,
  cognitiveFocusAudio,
  getSoundscapeAcousticTelemetry,
} from '../../utils/cognitiveFocusAudio';

export const SoundscapeAcousticMetrics: React.FC = () => {
  const [snap, setSnap] = useState<FocusAudioSnapshot>(() => cognitiveFocusAudio.getSnapshot());

  useEffect(() => {
    return cognitiveFocusAudio.subscribe(setSnap);
  }, []);

  const telemetry = getSoundscapeAcousticTelemetry(snap);
  const activeBinaural =
    BINAURAL_PRESETS.find((p) => p.id === snap.binauralPresetId) || BINAURAL_PRESETS[0];

  return (
    <section
      aria-label="当前声景 BPM 与频率范围参数面板"
      className="rounded-2xl bg-white border border-stone-200 overflow-hidden shadow-2xs"
    >
      <div className="px-5 py-3 bg-[#FAF8F5] border-b border-stone-200/80 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: telemetry.accentColor }}
            aria-hidden="true"
          />
          <span className="text-[11px] font-mono uppercase tracking-wider text-stone-500">
            ACTIVE SOUNDSCAPE TELEMETRY
          </span>
          <span className="text-stone-300" aria-hidden="true">
            ·
          </span>
          <span className="text-xs font-semibold text-stone-900 truncate">
            {telemetry.soundscapeNameZh} ({telemetry.soundscapeNameEn})
          </span>
        </div>

        <span className="text-[11px] font-mono text-stone-500">
          {telemetry.modulationSummary}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-stone-200/80">
        {/* Metric 1: Soundscape BPM / Cadence */}
        <div className="p-5 space-y-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-stone-500">
            <Gauge className="w-3.5 h-3.5 text-sky-700 shrink-0" aria-hidden="true" />
            <span>声景节律速率 (BPM)</span>
          </div>
          <div
            data-testid="soundscape-bpm-value"
            className="font-mono tabular-nums text-2xl font-bold text-stone-950 tracking-tight"
          >
            {telemetry.bpmDisplay}
          </div>
          <p className="text-[11px] text-stone-600 leading-snug">{telemetry.bpmDetail}</p>
        </div>

        {/* Metric 2: Soundscape Frequency Range */}
        <div className="p-5 space-y-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-stone-500">
            <Activity className="w-3.5 h-3.5 text-teal-700 shrink-0" aria-hidden="true" />
            <span>声景频率范围 (Frequency Range)</span>
          </div>
          <div
            data-testid="soundscape-freq-range-value"
            className="font-mono tabular-nums text-2xl font-bold text-stone-950 tracking-tight"
          >
            {telemetry.frequencyRangeDisplay}
          </div>
          <p className="text-[11px] text-stone-600 leading-snug">
            合成总频带：{telemetry.combinedSpectrumDisplay}
          </p>
        </div>

        {/* Metric 3: Binaural Carrier + Beat Sync */}
        <div className="p-5 space-y-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-stone-500">
            <Radio className="w-3.5 h-3.5 text-indigo-700 shrink-0" aria-hidden="true" />
            <span>叠加双耳差频 ({activeBinaural.bandLabel})</span>
          </div>
          <div className="font-mono tabular-nums text-2xl font-bold text-stone-950 tracking-tight">
            {snap.beatHz.toFixed(1)} Hz
          </div>
          <p className="text-[11px] font-mono tabular-nums text-stone-600 leading-snug">
            左右耳载波：{telemetry.binauralRangeDisplay}
          </p>
        </div>
      </div>
    </section>
  );
};

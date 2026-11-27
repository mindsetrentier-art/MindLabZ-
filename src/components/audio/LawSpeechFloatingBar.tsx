import React, { useState } from 'react';
import { Gauge, Minus, Plus, Square, ChevronDown, ChevronUp } from 'lucide-react';
import {
  MAX_PLAYBACK_RATE,
  MIN_PLAYBACK_RATE,
  clampPlaybackRate,
  stopLawSpeech,
  useLawSpeech,
  useLawSpeechPreferences,
} from '../../utils/lawSpeechEngine';
import { gameAudio } from '../../utils/gameAudio';

const FLOATING_SPEED_PRESETS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

/**
 * Floating audio player speed bar (0.5x - 2.0x) visible whenever any law narration is playing.
 * Dynamically updates audio playbackRate and synchronizes the Silver Reading Highlight
 * brushstroke CSS transition variables in real time.
 */
export const LawSpeechFloatingBar: React.FC = () => {
  const { globalIsSpeaking, activeTitle, rate } = useLawSpeech();
  const [prefs, updatePrefs] = useLawSpeechPreferences();
  const [expanded, setExpanded] = useState(false);

  if (!globalIsSpeaking) {
    return null;
  }

  const effectiveRate = clampPlaybackRate(rate || prefs.rate || 1.0);
  const brushDurationMs = Math.round(230 / effectiveRate);

  const applyRate = (next: number) => {
    const clamped = clampPlaybackRate(next);
    updatePrefs({ rate: clamped });
  };

  return (
    <aside
      aria-label="语音导读播放倍速控制器"
      className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-1.5rem)] max-w-md pointer-events-auto animate-fadeIn"
    >
      <div className="rounded-2xl bg-stone-900/95 text-stone-100 border border-slate-400/40 shadow-[0_14px_38px_-8px_rgba(15,23,42,0.48)] backdrop-blur-md px-3.5 py-2.5 space-y-2.5">
        {/* Compact Primary Row */}
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="flex items-end gap-[2px] h-3.5 w-4 justify-center shrink-0"
              aria-hidden="true"
            >
              <span className="w-[2px] rounded-full bg-slate-200 animate-soundWave1" />
              <span className="w-[2px] rounded-full bg-slate-300 animate-soundWave2" />
              <span className="w-[2px] rounded-full bg-slate-100 animate-soundWave3" />
            </span>

            <div className="min-w-0">
              <div className="text-xs font-semibold text-white truncate">
                {activeTitle || '正在导读心理学定律'}
              </div>
              <div className="text-[10.5px] text-slate-300 font-numeric tabular-nums flex items-center gap-1.5">
                <span>银锋笔触 {brushDurationMs}ms</span>
                <span aria-hidden="true">·</span>
                <span>实时同步</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Step-Down Button */}
            <button
              type="button"
              onClick={() => {
                gameAudio.playTap();
                applyRate(prefs.rate - 0.1);
              }}
              disabled={prefs.rate <= MIN_PLAYBACK_RATE}
              aria-label="降低播放语速"
              title="减速 0.1x"
              className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 disabled:opacity-40 text-slate-200 transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              <Minus className="w-3 h-3" />
            </button>

            {/* Expand Fine Speed Slider / Preset Toggle */}
            <button
              type="button"
              onClick={() => {
                gameAudio.playTap();
                setExpanded((v) => !v);
              }}
              aria-expanded={expanded}
              aria-label="展开 0.5x 至 2.0x 倍速面板"
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-500/40 text-xs font-numeric tabular-nums font-bold text-slate-100 inline-flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Gauge className="w-3 h-3 text-slate-300" />
              <span>{prefs.rate.toFixed(2)}x</span>
              {expanded ? (
                <ChevronDown className="w-3 h-3 text-slate-400" />
              ) : (
                <ChevronUp className="w-3 h-3 text-slate-400" />
              )}
            </button>

            {/* Step-Up Button */}
            <button
              type="button"
              onClick={() => {
                gameAudio.playTap();
                applyRate(prefs.rate + 0.1);
              }}
              disabled={prefs.rate >= MAX_PLAYBACK_RATE}
              aria-label="提高播放语速"
              title="加速 0.1x"
              className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 disabled:opacity-40 text-slate-200 transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              <Plus className="w-3 h-3" />
            </button>

            {/* Stop Reading Button */}
            <button
              type="button"
              onClick={() => {
                gameAudio.playTap();
                stopLawSpeech();
              }}
              aria-label="停止语音朗读"
              title="停止朗读"
              className="p-1.5 rounded-lg bg-slate-200 hover:bg-white text-stone-900 transition-colors cursor-pointer shrink-0 ml-0.5"
            >
              <Square className="w-3 h-3 fill-current" />
            </button>
          </div>
        </div>

        {/* Expanded 0.5x - 2.0x Speed Drawer */}
        {expanded && (
          <div className="pt-2 border-t border-stone-800 space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="text-[10.5px] font-numeric tabular-nums text-slate-400 shrink-0">
                0.50x
              </span>
              <input
                type="range"
                min={MIN_PLAYBACK_RATE}
                max={MAX_PLAYBACK_RATE}
                step={0.05}
                value={prefs.rate}
                aria-label="实时调节语音与笔触高亮速度"
                onChange={(e) => applyRate(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-stone-700 rounded-full appearance-none cursor-pointer accent-slate-200"
              />
              <span className="text-[10.5px] font-numeric tabular-nums text-slate-400 shrink-0">
                2.00x
              </span>
            </div>

            <div className="grid grid-cols-6 gap-1">
              {FLOATING_SPEED_PRESETS.map((presetRate) => {
                const active = Math.abs(prefs.rate - presetRate) < 0.03;
                return (
                  <button
                    key={presetRate}
                    type="button"
                    onClick={() => {
                      gameAudio.playSelect();
                      applyRate(presetRate);
                    }}
                    className={`py-1 rounded-md text-[10.5px] font-numeric tabular-nums font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      active
                        ? 'bg-slate-200 text-stone-900'
                        : 'bg-stone-800 text-slate-300 hover:bg-stone-700 hover:text-white'
                    }`}
                  >
                    {presetRate}x
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

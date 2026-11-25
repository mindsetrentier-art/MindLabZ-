import React, { useEffect } from 'react';
import { Volume2, Gauge, Sparkles, Sliders, RotateCcw, Play, Square } from 'lucide-react';
import {
  VOICE_PRESETS,
  HIGHLIGHT_MARKER_OPTIONS,
  LawVoicePresetId,
  HighlightMarkerStyle,
  useLawSpeechPreferences,
  useAvailableChineseVoices,
  useLawSpeech,
  toggleLawSpeech,
  startLawSpeech,
  stopLawSpeech,
} from '../../utils/lawSpeechEngine';
import { SilverSpeechText, LawVoiceToggleSwitch } from '../ui/SilverSpeechText';
import { FavoriteAudioPreloader } from './FavoriteAudioPreloader';
import { gameAudio } from '../../utils/gameAudio';

const PREVIEW_LAW_ID = 'settings-voice-preview';
const PREVIEW_TITLE = '语音导读与银字跟随试听';
const PREVIEW_BODY =
  '心流与洞察并非被动等待的运气，而是当专注倾听、理性思辨与客观心理学规律同频共振时，大脑自然涌现的澄明秩序。';

const SAMPLE_PREFIX = 'settings-voice-sample-';
const CUSTOM_VOICE_SAMPLE_ID = 'settings-voice-custom-sample';

const SPEED_PRESETS = [
  { rate: 0.75, label: '0.75x 慢速精读' },
  { rate: 0.9, label: '0.90x 沉静伴读' },
  { rate: 1.0, label: '1.00x 标准语速' },
  { rate: 1.2, label: '1.20x 高效略读' },
  { rate: 1.4, label: '1.40x 极速复习' },
];

export const VoiceReadingPreferencesSection: React.FC = () => {
  const [prefs, updatePrefs] = useLawSpeechPreferences();
  const chineseVoices = useAvailableChineseVoices();
  const {
    isSpeakingThisLaw: isPreviewSpeaking,
    activeCpIndex: previewCpIndex,
    segments: previewSegments,
  } = useLawSpeech(PREVIEW_LAW_ID);
  const { activeLawId, globalIsSpeaking, activeCpIndex: globalCpIndex, segments: globalSegments } =
    useLawSpeech();

  useEffect(() => {
    return () => {
      stopLawSpeech();
    };
  }, []);

  const activePreset =
    VOICE_PRESETS.find((p) => p.id === prefs.voicePreset) || VOICE_PRESETS[0];

  const activeAuditionPreset =
    globalIsSpeaking && activeLawId?.startsWith(SAMPLE_PREFIX)
      ? VOICE_PRESETS.find((p) => `${SAMPLE_PREFIX}${p.id}` === activeLawId) || null
      : null;

  const isCustomVoiceSamplePlaying =
    globalIsSpeaking && activeLawId === CUSTOM_VOICE_SAMPLE_ID;

  const triggerPreviewRestartIfPlaying = () => {
    if (!isPreviewSpeaking) return;
    window.setTimeout(() => {
      startLawSpeech({
        lawId: PREVIEW_LAW_ID,
        segments: [
          { key: 'title', text: PREVIEW_TITLE, separator: '。' },
          { key: 'body', text: PREVIEW_BODY, separator: '。' },
        ],
      });
    }, 30);
  };

  const handleSelectPreset = (presetId: LawVoicePresetId) => {
    gameAudio.playSelect();
    updatePrefs({ voicePreset: presetId, customVoiceURI: '' });
    triggerPreviewRestartIfPlaying();
  };

  const handleAuditionPreset = (presetId: LawVoicePresetId, e: React.MouseEvent) => {
    e.stopPropagation();
    gameAudio.playTap();
    const presetMeta = VOICE_PRESETS.find((p) => p.id === presetId);
    if (!presetMeta) return;

    const sampleId = `${SAMPLE_PREFIX}${presetId}`;
    // Also select the auditioned preset so user immediately locks in the timbre if desired
    updatePrefs({ voicePreset: presetId, customVoiceURI: '' });

    toggleLawSpeech({
      lawId: sampleId,
      presetOverride: presetId,
      customVoiceURIOverride: '',
      segments: [{ key: 'sample', text: presetMeta.sampleScript, separator: '' }],
    });
  };

  const handleAuditionCustomVoice = () => {
    gameAudio.playTap();
    const selectedVoice = chineseVoices.find((v) => v.voiceURI === prefs.customVoiceURI);
    const script = selectedVoice
      ? `你好，正在使用系统中文声库 ${selectedVoice.name} 为你朗读心理学定律示例。`
      : '你好，正在使用当前系统自动匹配的中文声库为你朗读心理学定律示例。';

    toggleLawSpeech({
      lawId: CUSTOM_VOICE_SAMPLE_ID,
      customVoiceURIOverride: prefs.customVoiceURI,
      segments: [{ key: 'sample', text: script, separator: '' }],
    });
  };

  const handleSpeedChange = (newRate: number) => {
    updatePrefs({ rate: newRate });
    triggerPreviewRestartIfPlaying();
  };

  const handleToggleSmoothHighlight = () => {
    gameAudio.playTap();
    updatePrefs({ smoothHighlight: !prefs.smoothHighlight });
  };

  const handleSelectMarker = (markerId: HighlightMarkerStyle) => {
    gameAudio.playSelect();
    updatePrefs({ highlightMarker: markerId });
  };

  const handleTogglePreviewSpeech = () => {
    gameAudio.playTap();
    toggleLawSpeech({
      lawId: PREVIEW_LAW_ID,
      segments: [
        { key: 'title', text: PREVIEW_TITLE, separator: '。' },
        { key: 'body', text: PREVIEW_BODY, separator: '。' },
      ],
    });
  };

  const handleResetDefaults = () => {
    gameAudio.playTap();
    updatePrefs({
      voicePreset: 'gentle_female',
      customVoiceURI: '',
      rate: 1.0,
      smoothHighlight: true,
      highlightMarker: 'underline',
    });
    triggerPreviewRestartIfPlaying();
  };

  return (
    <section
      id="voice-reading-preferences"
      className="editorial-card rounded-2xl p-7 sm:p-9 space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-200/80">
        <div>
          <span className="editorial-kicker text-[10px] text-stone-500 block mb-0.5">
            Voice Guide Preferences · 听觉学习引擎
          </span>
          <h3 className="font-serif-editorial text-lg sm:text-xl font-bold text-stone-900 flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-slate-700" />
            <span>语音导读偏好</span>
          </h3>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-800 text-xs font-medium font-numeric tabular-nums">
            <span>{activePreset.label}</span>
            <span className="text-slate-400">·</span>
            <span>{prefs.rate.toFixed(2)}x</span>
          </span>

          <button
            type="button"
            onClick={handleResetDefaults}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
            title="恢复语音导读默认偏好"
          >
            <RotateCcw className="w-3 h-3" />
            <span>恢复默认</span>
          </button>
        </div>
      </div>

      {/* 1. TTS Voice Persona Picker with Direct Per-Voice Sample Audition */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <span className="text-xs font-semibold text-stone-900 block">
              自然人声发音人选择与演示试听
            </span>
            <span className="text-[11px] text-stone-500">
              默认启用自然真人感神经网络语音导读，断网或指定系统声库时无缝接管且自动完整断句朗读不漏字
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {VOICE_PRESETS.map((preset) => {
            const active = prefs.voicePreset === preset.id && !prefs.customVoiceURI;
            const isAuditioning =
              globalIsSpeaking && activeLawId === `${SAMPLE_PREFIX}${preset.id}`;

            return (
              <div
                key={preset.id}
                role="button"
                tabIndex={0}
                onClick={() => handleSelectPreset(preset.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelectPreset(preset.id);
                  }
                }}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                  active
                    ? 'bg-stone-900 border-stone-900 text-white shadow-xs'
                    : 'bg-[#FAF8F5] border-stone-200 text-stone-800 hover:border-slate-400 hover:bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold">{preset.label}</span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        active
                          ? 'bg-slate-200 shadow-[0_0_8px_rgba(226,232,240,0.85)]'
                          : 'bg-stone-300'
                      }`}
                    />
                  </div>
                  <p
                    className={`text-[11px] mt-1 leading-snug ${
                      active ? 'text-stone-300' : 'text-stone-500'
                    }`}
                  >
                    {preset.sub}
                  </p>
                </div>

                {/* Audio Sample Audition Button */}
                <button
                  type="button"
                  onClick={(e) => handleAuditionPreset(preset.id, e)}
                  aria-label={`${isAuditioning ? '停止试听' : '试听'}${preset.label}演示音频`}
                  className={`w-full py-1.5 px-2.5 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                    isAuditioning
                      ? active
                        ? 'bg-slate-200 text-stone-900 border-slate-100 shadow-xs'
                        : 'bg-slate-900 text-white border-slate-700 shadow-xs'
                      : active
                      ? 'bg-stone-800 hover:bg-stone-700 text-slate-100 border-stone-700'
                      : 'bg-white hover:bg-stone-100 text-stone-700 border-stone-200/90'
                  }`}
                >
                  {isAuditioning ? (
                    <>
                      <span className="flex items-end gap-[2px] h-2.5 w-3 justify-center shrink-0" aria-hidden="true">
                        <span className={`w-[2px] rounded-full animate-soundWave1 ${active ? 'bg-stone-900' : 'bg-slate-200'}`} />
                        <span className={`w-[2px] rounded-full animate-soundWave2 ${active ? 'bg-stone-700' : 'bg-slate-300'}`} />
                        <span className={`w-[2px] rounded-full animate-soundWave3 ${active ? 'bg-stone-900' : 'bg-slate-100'}`} />
                      </span>
                      <Square className="w-2.5 h-2.5 fill-current shrink-0" />
                      <span>停止试听</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-2.5 h-2.5 fill-current shrink-0" />
                      <span>试听示例</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Active Sample Audition Transcript Banner */}
        {activeAuditionPreset && (
          <div className="p-3.5 rounded-xl bg-slate-900 text-slate-100 border border-slate-700/80 flex items-start justify-between gap-3 animate-fadeIn">
            <div className="space-y-1 min-w-0">
              <div className="text-[10.5px] font-mono text-slate-300 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-200 animate-pulse" />
                <span>正在播放「{activeAuditionPreset.label}」演示音频 · 音色示范</span>
              </div>
              <p className="text-xs leading-relaxed text-slate-100">
                “
                <SilverSpeechText
                  text={activeAuditionPreset.sampleScript}
                  isSpeaking={true}
                  activeCpIndex={globalCpIndex}
                  segmentRange={globalSegments.sample}
                  tone="dark"
                />
                ”
              </p>
            </div>
            <button
              type="button"
              onClick={() => stopLawSpeech()}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-[11px] font-medium text-slate-200 shrink-0 cursor-pointer"
            >
              停止
            </button>
          </div>
        )}

        {/* Optional System Chinese Voice Override + Audition */}
        {chineseVoices.length > 0 && (
          <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs bg-[#FAF8F5] p-3 rounded-xl border border-stone-200/80">
            <label htmlFor="mindlabz-tts-voice-select" className="text-[11px] text-stone-600 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-stone-500 shrink-0" />
              <span>系统本地语音库指定（共检测到 {chineseVoices.length} 个中文声库）：</span>
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              <select
                id="mindlabz-tts-voice-select"
                value={prefs.customVoiceURI}
                onChange={(e) => {
                  gameAudio.playSelect();
                  updatePrefs({ customVoiceURI: e.target.value });
                  triggerPreviewRestartIfPlaying();
                }}
                className="px-3 py-1.5 rounded-lg bg-white border border-stone-200 text-xs text-stone-800 font-medium focus:outline-none focus:border-stone-500 max-w-xs cursor-pointer"
              >
                <option value="">自动匹配所选发音人（推荐）</option>
                {chineseVoices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleAuditionCustomVoice}
                className={`px-3 py-1.5 rounded-lg border text-[11px] font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                  isCustomVoiceSamplePlaying
                    ? 'bg-stone-900 text-white border-stone-900'
                    : 'bg-white hover:bg-stone-100 text-stone-800 border-stone-200'
                }`}
              >
                {isCustomVoiceSamplePlaying ? (
                  <>
                    <Square className="w-3 h-3 fill-current" />
                    <span>停止试听</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 fill-current" />
                    <span>试听此声库</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. Reading Speed Control */}
      <div className="space-y-3 pt-2 border-t border-stone-100">
        <div className="flex items-center justify-between gap-2">
          <div>
            <span className="text-xs font-semibold text-stone-900 flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-stone-700" />
              <span>阅读语速调节</span>
            </span>
            <span className="text-[11px] text-stone-500 block mt-0.5">
              支持 0.70x 至 1.50x 无级调节，银色字迹高亮频率将自动同步匹配语速
            </span>
          </div>
          <span className="font-numeric tabular-nums text-sm font-bold text-stone-900 px-2.5 py-1 rounded-lg bg-[#FAF8F5] border border-stone-200">
            {prefs.rate.toFixed(2)}x
          </span>
        </div>

        <div className="space-y-2.5">
          <input
            type="range"
            min={0.7}
            max={1.5}
            step={0.05}
            value={prefs.rate}
            aria-label="调节阅读语速"
            onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-stone-200 rounded-full appearance-none cursor-pointer accent-stone-900"
          />

          <div className="flex flex-wrap gap-1.5">
            {SPEED_PRESETS.map((item) => {
              const isSelected = Math.abs(prefs.rate - item.rate) < 0.02;
              return (
                <button
                  key={item.rate}
                  type="button"
                  onClick={() => {
                    gameAudio.playTap();
                    handleSpeedChange(item.rate);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium font-numeric tabular-nums border transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-stone-900 text-white border-stone-900'
                      : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400 hover:text-stone-900'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Smooth Silver Highlight Transition & Selectable Marker Symbol */}
      <div className="space-y-4 pt-3 border-t border-stone-100">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <span className="text-xs font-semibold text-stone-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-slate-600" />
              <span>“流光银笔触”词间运笔平滑过渡</span>
            </span>
            <span className="text-[11px] text-stone-500 block leading-relaxed">
              开启后在词与词之间呈现如毛笔运墨般的银辉顺滑扫掠，并随语速（{prefs.rate.toFixed(2)}x）实时同步节奏；关闭后采用瞬时切换。
            </span>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={prefs.smoothHighlight}
            aria-label="开启或关闭银色阅读高亮的平滑过渡动画"
            onClick={handleToggleSmoothHighlight}
            className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 border ${
              prefs.smoothHighlight
                ? 'bg-slate-800 border-slate-500 shadow-[0_0_10px_rgba(148,163,184,0.35)]'
                : 'bg-stone-200 border-stone-300'
            }`}
          >
            <span
              className={`w-4 h-4 rounded-full absolute top-0.5 transition-all duration-200 ${
                prefs.smoothHighlight
                  ? 'left-6 bg-gradient-to-br from-white via-slate-200 to-slate-400 shadow-xs'
                  : 'left-1 bg-white shadow-xs'
              }`}
            />
          </button>
        </div>

        {/* Reading Follow Symbol Selector */}
        <div className="space-y-2">
          <div>
            <span className="text-xs font-semibold text-stone-900 block">
              阅读跟随标记样式（线型 / 星芒 / 圆点等自选）
            </span>
            <span className="text-[11px] text-stone-500">
              挑选随语音同步流动的视觉导读符号，让视线跟随更清晰自然
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {HIGHLIGHT_MARKER_OPTIONS.map((opt) => {
              const selected = prefs.highlightMarker === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelectMarker(opt.id)}
                  title={opt.sub}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                    selected
                      ? 'bg-stone-900 border-stone-900 text-white shadow-xs'
                      : 'bg-[#FAF8F5] border-stone-200 text-stone-800 hover:border-slate-400 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-xs font-bold">{opt.label}</span>
                    <span
                      className={`text-sm font-bold leading-none ${
                        selected ? 'text-slate-200' : 'text-slate-500'
                      }`}
                    >
                      {opt.symbol}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] leading-snug line-clamp-1 ${
                      selected ? 'text-stone-300' : 'text-stone-500'
                    }`}
                  >
                    {opt.sub}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Live Interactive Preview Card */}
      <div className="rounded-2xl p-4 sm:p-5 bg-[#FAF8F5] border border-stone-200/90 space-y-3">
        <div className="flex items-center justify-between gap-2 text-[11px] text-stone-500 flex-wrap">
          <span className="font-mono uppercase tracking-wider font-semibold text-stone-600">
            LIVE PREVIEW · 完整定律语境与流体银字试听台
          </span>
          <span className="text-[10.5px]">
            {prefs.smoothHighlight ? '流体波纹：开启' : '瞬时切换'} ·{' '}
            {HIGHLIGHT_MARKER_OPTIONS.find((m) => m.id === prefs.highlightMarker)?.label || '流光银线'}
          </span>
        </div>

        <div className="space-y-1.5">
          <h4 className="font-serif-editorial text-sm sm:text-base font-bold text-stone-900">
            <SilverSpeechText
              text={PREVIEW_TITLE}
              isSpeaking={isPreviewSpeaking}
              activeCpIndex={previewCpIndex}
              segmentRange={previewSegments.title}
            />
          </h4>
          <p className="text-xs sm:text-[13px] text-stone-700 leading-relaxed">
            “
            <SilverSpeechText
              text={PREVIEW_BODY}
              isSpeaking={isPreviewSpeaking}
              activeCpIndex={previewCpIndex}
              segmentRange={previewSegments.body}
            />
            ”
          </p>
        </div>

        <div className="flex items-center justify-end pt-2 border-t border-stone-200/70">
          <LawVoiceToggleSwitch
            isOn={isPreviewSpeaking}
            onToggle={handleTogglePreviewSpeech}
            size="sm"
            label={isPreviewSpeaking ? '正在试听（银字同步中）' : '试听当前完整设置'}
          />
        </div>
      </div>

      {/* 5. Offline Preload Audio for Bookmarked Favorite Laws */}
      <FavoriteAudioPreloader />
    </section>
  );
};

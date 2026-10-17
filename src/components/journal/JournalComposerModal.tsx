import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Brain,
  Waves,
  Feather,
  Scale,
  Check,
  Tag,
  Star,
  ChevronRight,
  BookOpen,
  Info,
  Sliders,
  Calendar,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  CognitiveJournalEntry,
  JournalTemplateType,
  EmotionValence,
} from '../../types';
import {
  JOURNAL_TEMPLATES,
  EMOTION_PRESETS,
  EmotionPresetOption,
} from '../../data/journalTemplates';
import { analyzeJournalEntry } from '../../services/aiJournalAnalysisService';

interface JournalComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEntry?: Partial<CognitiveJournalEntry> | null;
}

export const JournalComposerModal: React.FC<JournalComposerModalProps> = ({
  isOpen,
  onClose,
  initialEntry,
}) => {
  const { saveJournal, laws, firebaseUser } = useApp();

  const [templateType, setTemplateType] = useState<JournalTemplateType>(
    initialEntry?.templateType || 'cbt-restructure'
  );
  const [title, setTitle] = useState(initialEntry?.title || '');
  const [date, setDate] = useState(
    initialEntry?.date || new Date().toISOString().split('T')[0]
  );
  const [time, setTime] = useState(
    initialEntry?.time ||
      new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  );

  // Emotion state
  const [selectedPreset, setSelectedPreset] = useState<EmotionPresetOption>(() => {
    const found = EMOTION_PRESETS.find(
      (p) => p.nameZh === initialEntry?.emotion?.primary
    );
    return found || EMOTION_PRESETS[0];
  });
  const [customPrimary, setCustomPrimary] = useState(
    initialEntry?.emotion?.primary || EMOTION_PRESETS[0].nameZh
  );
  const [secondaryEmotion, setSecondaryEmotion] = useState(
    initialEntry?.emotion?.secondary || ''
  );
  const [intensity, setIntensity] = useState<number>(
    initialEntry?.emotion?.intensity || 5
  );
  const [valence, setValence] = useState<EmotionValence>(
    initialEntry?.emotion?.valence || 'positive'
  );
  const [energyLevel, setEnergyLevel] = useState<number>(
    initialEntry?.emotion?.energyLevel || 3
  );

  // Psychology law linkage
  const [relatedLawId, setRelatedLawId] = useState<string>(
    initialEntry?.relatedLawId || ''
  );
  const [relatedLawSearch, setRelatedLawSearch] = useState<string>('');
  const [showLawPicker, setShowLawPicker] = useState<boolean>(false);

  // Structured fields data
  const [structuredData, setStructuredData] = useState<Record<string, string>>(
    initialEntry?.structuredData || {}
  );

  // Tags & Rating
  const [tags, setTags] = useState<string[]>(
    initialEntry?.tags || ['认知觉察']
  );
  const [newTagInput, setNewTagInput] = useState<string>('');
  const [insightRating, setInsightRating] = useState<number>(
    initialEntry?.insightRating || 5
  );

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Synchronize when initialEntry changes
  useEffect(() => {
    if (initialEntry) {
      if (initialEntry.templateType) setTemplateType(initialEntry.templateType);
      if (initialEntry.title) setTitle(initialEntry.title);
      if (initialEntry.date) setDate(initialEntry.date);
      if (initialEntry.time) setTime(initialEntry.time);
      if (initialEntry.relatedLawId) setRelatedLawId(initialEntry.relatedLawId);
      if (initialEntry.structuredData) setStructuredData(initialEntry.structuredData);
      if (initialEntry.tags) setTags(initialEntry.tags);
      if (initialEntry.insightRating) setInsightRating(initialEntry.insightRating);

      if (initialEntry.emotion) {
        const found = EMOTION_PRESETS.find(
          (p) => p.nameZh === initialEntry.emotion?.primary
        );
        if (found) {
          setSelectedPreset(found);
          setCustomPrimary(found.nameZh);
        } else if (initialEntry.emotion.primary) {
          setCustomPrimary(initialEntry.emotion.primary);
        }
        setIntensity(initialEntry.emotion.intensity || 5);
        setValence(initialEntry.emotion.valence || 'positive');
        if (initialEntry.emotion.secondary) setSecondaryEmotion(initialEntry.emotion.secondary);
        if (initialEntry.emotion.energyLevel) setEnergyLevel(initialEntry.emotion.energyLevel);
      }
    } else {
      // Default reset
      setTitle('');
      setDate(new Date().toISOString().split('T')[0]);
      setTime(new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }));
      setStructuredData({});
      setTags(['认知觉察']);
    }
  }, [initialEntry, isOpen]);

  if (!isOpen) return null;

  const currentTemplate =
    JOURNAL_TEMPLATES.find((t) => t.id === templateType) || JOURNAL_TEMPLATES[0];

  const selectedLawObj = laws.find((l) => l.id === relatedLawId);

  const filteredLaws = laws
    .filter((l) => {
      if (!relatedLawSearch.trim()) return true;
      const q = relatedLawSearch.toLowerCase();
      return (
        l.nameZh.toLowerCase().includes(q) ||
        l.nameEn.toLowerCase().includes(q) ||
        (l.codeId && l.codeId.toLowerCase().includes(q))
      );
    })
    .slice(0, 8);

  const handlePresetSelect = (preset: EmotionPresetOption) => {
    setSelectedPreset(preset);
    setCustomPrimary(preset.nameZh);
    setValence(preset.valence);
    setEnergyLevel(preset.defaultEnergy);
  };

  const handleFieldChange = (key: string, value: string) => {
    setStructuredData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleAddTag = () => {
    const clean = newTagInput.trim();
    if (clean && !tags.includes(clean) && tags.length < 8) {
      setTags([...tags, clean]);
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setErrorMsg('请为这篇认知手记起一个清晰的主题或题目');
      return;
    }

    setIsSubmitting(true);
    try {
      const entryPayload: CognitiveJournalEntry = {
        id: initialEntry?.id || `journal-${Date.now()}`,
        userId: firebaseUser?.uid || 'guest-user',
        date,
        time,
        title: cleanTitle,
        templateType,
        emotion: {
          primary: customPrimary || selectedPreset.nameZh,
          secondary: secondaryEmotion.trim() || undefined,
          intensity,
          valence,
          energyLevel,
        },
        relatedLawId: selectedLawObj?.id || undefined,
        relatedLawName: selectedLawObj
          ? `${selectedLawObj.nameZh} (${selectedLawObj.nameEn})`
          : undefined,
        structuredData,
        tags: tags.length > 0 ? tags : ['认知觉察'],
        insightRating,
      };

      // Trigger AI deep emotional analysis module right upon recording
      try {
        const analysis = await analyzeJournalEntry(entryPayload);
        entryPayload.aiAnalysis = analysis;
      } catch (aiErr) {
        console.warn('AI emotional analysis fallback on submit:', aiErr);
      }

      await saveJournal(entryPayload);
      setIsSubmitting(false);
      onClose();
    } catch (err: any) {
      console.error('Failed to save journal:', err);
      setErrorMsg(err?.message || '保存失败，请检查网络或配置');
      setIsSubmitting(false);
    }
  };

  const getTemplateIcon = (id: JournalTemplateType) => {
    switch (id) {
      case 'cbt-restructure':
        return <Brain className="w-4 h-4" />;
      case 'flow-reflection':
        return <Waves className="w-4 h-4" />;
      case 'emotional-decentering':
        return <Feather className="w-4 h-4" />;
      case 'decision-debiasing':
        return <Scale className="w-4 h-4" />;
      case 'free-insight':
        return <Sparkles className="w-4 h-4" />;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-6 bg-stone-900/60 backdrop-blur-md animate-fadeIn overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl my-auto bg-[#FAF8F5] rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Folio Header */}
        <div className="px-6 sm:px-8 py-5 border-b border-stone-200 bg-white flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="editorial-kicker text-[10px]">
                Cognitive Journal · Vol. IV
              </span>
              <span className="text-[10px] text-stone-400 font-mono">/</span>
              <span className="text-[10px] text-stone-500 font-serif-editorial italic">
                {firebaseUser ? 'Firestore Cloud Synced' : 'Local Storage Mode'}
              </span>
            </div>
            <h2 className="font-serif-editorial text-xl sm:text-2xl font-bold text-stone-900 tracking-tight mt-0.5">
              {initialEntry?.id ? '编辑心智手记' : '撰写认知觉察手记'}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors btn-tactile"
            aria-label="关闭"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Template Archetype Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-600">
                1. 选择心智结构模版 · Template Archetype
              </label>
              <span className="text-[11px] text-stone-600">
                {currentTemplate.badge}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-2.5">
              {JOURNAL_TEMPLATES.map((tpl) => {
                const isSelected = templateType === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => {
                      setTemplateType(tpl.id);
                    }}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all btn-tactile ${
                      isSelected
                        ? 'bg-stone-900 border-stone-900 text-white shadow-xs'
                        : 'bg-white border-stone-200 text-stone-700 hover:border-stone-400'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center mb-1.5 ${
                        isSelected
                          ? 'bg-white/15 text-white'
                          : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      {getTemplateIcon(tpl.id)}
                    </div>
                    <span className="text-xs font-bold leading-tight line-clamp-1">
                      {tpl.title}
                    </span>
                    <span
                      className={`text-[9px] mt-0.5 line-clamp-1 ${
                        isSelected ? 'text-stone-300' : 'text-stone-600'
                      }`}
                    >
                      {tpl.titleEn.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>

            <p className="text-xs text-stone-700 italic font-serif-editorial bg-stone-100/70 p-3 rounded-xl border border-stone-200/70">
              “{currentTemplate.description}”
            </p>
          </div>

          {/* 2. Title & Date / Time */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-600">
                手记主旨 · Headline
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例如：关于演讲前的聚光灯效应与自动思维重构..."
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-900 placeholder:text-stone-400 text-sm focus:outline-hidden focus:border-stone-900 focus:ring-1 focus:ring-stone-900 font-serif-editorial font-bold transition-all"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-600">
                记录日期 · Date & Time
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-900 text-xs font-mono focus:outline-hidden focus:border-stone-900"
                />
                <input
                  type="text"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  placeholder="14:30"
                  className="w-20 px-2 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-900 text-xs font-mono text-center focus:outline-hidden focus:border-stone-900"
                />
              </div>
            </div>
          </div>

          {/* 3. Emotional State Axis (Primary, Secondary, Intensity, Valence, Energy) */}
          <div className="space-y-4 p-5 rounded-2xl bg-white border border-stone-200">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <span className="editorial-kicker text-[10px]">
                  Emotional Coordinate
                </span>
                <h3 className="text-sm font-bold text-stone-900 font-serif-editorial">
                  2. 情绪与觉察坐标轴
                </h3>
              </div>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${selectedPreset.colorClass}`}
              >
                {selectedPreset.nameZh} · {selectedPreset.nameEn}
              </span>
            </div>

            {/* Emotional Preset Pills */}
            <div className="space-y-2">
              <span className="text-[11px] text-stone-600">
                选择当下的主要情绪质感：
              </span>
              <div className="flex flex-wrap gap-2">
                {EMOTION_PRESETS.map((preset) => {
                  const isCur = selectedPreset.nameZh === preset.nameZh;
                  return (
                    <button
                      key={preset.nameZh}
                      type="button"
                      onClick={() => handlePresetSelect(preset)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all btn-tactile ${
                        isCur
                          ? `${preset.colorClass} ring-2 ring-stone-900/10 font-bold shadow-xs`
                          : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300'
                      }`}
                    >
                      {preset.nameZh}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Valence & Sub-Mood */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-stone-600">
                  情绪极性效价 (Valence)
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(
                    [
                      { id: 'positive', label: '正向舒展' },
                      { id: 'neutral', label: '平静中和' },
                      { id: 'challenging', label: '挑战紧绷' },
                      { id: 'mixed', label: '复杂交织' },
                    ] as const
                  ).map((val) => (
                    <button
                      key={val.id}
                      type="button"
                      onClick={() => setValence(val.id)}
                      className={`py-1.5 text-[11px] rounded-lg border text-center transition-all ${
                        valence === val.id
                          ? 'bg-stone-900 border-stone-900 text-white font-bold'
                          : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                      }`}
                    >
                      {val.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-stone-600">
                  微小副情绪 / 内心旁白标签
                </label>
                <input
                  type="text"
                  value={secondaryEmotion}
                  onChange={(e) => setSecondaryEmotion(e.target.value)}
                  placeholder="例如：冒充者错觉、反刍内耗、释怀沉淀..."
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50/50 text-xs text-stone-900 focus:outline-hidden focus:border-stone-900"
                />
              </div>
            </div>

            {/* Sliders: Intensity & Energy Level */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-stone-100">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-stone-600 font-medium">
                    感受强度 (Intensity)
                  </span>
                  <span className="font-numeric font-bold text-stone-900">
                    {intensity} / 10 ·{' '}
                    {intensity <= 3
                      ? '轻微漪涟'
                      : intensity <= 6
                      ? '中度体验'
                      : intensity <= 8
                      ? '强烈冲击'
                      : '极度汹涌'}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={intensity}
                  onChange={(e) => setIntensity(Number(e.target.value))}
                  className="w-full accent-stone-900 cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-stone-600 font-medium">
                    心智能量级别 (Energy Level)
                  </span>
                  <span className="font-numeric font-bold text-stone-900">
                    {energyLevel} / 5 ·{' '}
                    {energyLevel === 1
                      ? '低能休眠'
                      : energyLevel === 2
                      ? '缓步静息'
                      : energyLevel === 3
                      ? '适度均衡'
                      : energyLevel === 4
                      ? '敏锐活跃'
                      : '充沛高能'}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={energyLevel}
                  onChange={(e) => setEnergyLevel(Number(e.target.value))}
                  className="w-full accent-stone-900 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* 4. Link Psychology Law (Optional Educational Anchor) */}
          <div className="space-y-3 p-5 rounded-2xl bg-white border border-stone-200">
            <div className="flex items-center justify-between">
              <div>
                <span className="editorial-kicker text-[10px]">
                  Cognitive Science Linkage
                </span>
                <h3 className="text-sm font-bold text-stone-900 font-serif-editorial">
                  3. 关联心理学定律与心智模型 (可选)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowLawPicker(!showLawPicker)}
                className="text-xs text-stone-600 hover:text-stone-900 font-medium flex items-center gap-1 underline"
              >
                {selectedLawObj ? '更改关联定律' : '选择定律'}
              </button>
            </div>

            {selectedLawObj ? (
              <div className="p-3.5 rounded-xl bg-stone-100 border border-stone-200 flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white border border-stone-200 flex items-center justify-center shrink-0 mt-0.5 text-stone-800">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold text-stone-600">
                        {selectedLawObj.codeId || 'LAW'}
                      </span>
                      <h4 className="text-xs font-bold text-stone-900">
                        {selectedLawObj.nameZh} · {selectedLawObj.nameEn}
                      </h4>
                    </div>
                    <p className="text-[11px] text-stone-600 mt-0.5 line-clamp-2">
                      {selectedLawObj.shortExplanation}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setRelatedLawId('')}
                  className="text-stone-400 hover:text-stone-700 text-xs shrink-0"
                >
                  解除
                </button>
              </div>
            ) : (
              <p className="text-xs text-stone-600">
                将今天的情绪体验与心理学定律（如确认偏误、聚光灯效应、沉没成本等）进行锚定，能帮助大脑更快识破心智陷阱。
              </p>
            )}

            {/* Inline Law Picker Dropdown */}
            {showLawPicker && (
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2.5 animate-fadeIn">
                <input
                  type="text"
                  value={relatedLawSearch}
                  onChange={(e) => setRelatedLawSearch(e.target.value)}
                  placeholder="搜索心理学定律名称或编号..."
                  className="w-full px-3 py-1.5 rounded-lg border border-stone-300 bg-white text-xs text-stone-900 focus:outline-hidden focus:border-stone-900"
                />
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {filteredLaws.map((law) => (
                    <div
                      key={law.id}
                      onClick={() => {
                        setRelatedLawId(law.id);
                        setShowLawPicker(false);
                      }}
                      className={`p-2 rounded-lg cursor-pointer flex items-center justify-between text-xs transition-colors ${
                        relatedLawId === law.id
                          ? 'bg-stone-900 text-white'
                          : 'hover:bg-white text-stone-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] opacity-70">
                          {law.codeId}
                        </span>
                        <span className="font-medium">{law.nameZh}</span>
                        <span className="text-[10px] opacity-60">
                          {law.nameEn}
                        </span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 opacity-50" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 5. Structured Questions according to Template */}
          <div className="space-y-5 p-5 sm:p-6 rounded-2xl bg-white border border-stone-200">
            <div className="border-b border-stone-100 pb-3">
              <span className="editorial-kicker text-[10px]">
                Guided Dialectic Inquiries
              </span>
              <h3 className="text-sm font-bold text-stone-900 font-serif-editorial">
                4. {currentTemplate.title} · 结构化思辨指引
              </h3>
            </div>

            <div className="space-y-5">
              {currentTemplate.defaultQuestions.map((q, idx) => {
                const val = structuredData[q.key] || '';
                return (
                  <div key={q.key} className="space-y-1.5">
                    <div className="flex items-baseline justify-between">
                      <label className="text-xs font-bold text-stone-900">
                        {idx + 1}. {q.label}
                      </label>
                      {q.hint && (
                        <span className="text-[10px] text-stone-600 hidden sm:inline">
                          {q.hint}
                        </span>
                      )}
                    </div>
                    <textarea
                      rows={3}
                      value={val}
                      onChange={(e) => handleFieldChange(q.key, e.target.value)}
                      placeholder={q.placeholder}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50/40 text-stone-800 placeholder:text-stone-400 text-xs leading-relaxed focus:outline-hidden focus:border-stone-900 focus:bg-white transition-all font-serif-editorial"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* 6. Tags & Insight Lucidity Rating */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-2xl bg-white border border-stone-200">
            {/* Tags */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-stone-500" />
                标签分类 (Tags)
              </label>
              <div className="flex flex-wrap gap-1.5 min-h-[32px]">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 text-stone-700 text-xs border border-stone-200"
                  >
                    #{t}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="text-stone-400 hover:text-stone-700 ml-0.5"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-1.5 pt-1">
                <input
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="添加标签..."
                  className="flex-1 px-3 py-1.5 rounded-lg border border-stone-300 text-xs focus:outline-hidden focus:border-stone-900"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-xs font-medium text-stone-700"
                >
                  添加
                </button>
              </div>
            </div>

            {/* Lucidity Rating */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                觉察通透感 (Insight Rating)
              </label>
              <p className="text-[11px] text-stone-600">
                评估完成本次记录后，内心的澄明度与认知重构体验：
              </p>
              <div className="flex items-center gap-2 pt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setInsightRating(star)}
                    className="p-1.5 rounded-lg hover:bg-stone-100 transition-colors btn-tactile"
                  >
                    <Star
                      className={`w-5 h-5 transition-transform hover:scale-110 ${
                        star <= insightRating
                          ? 'text-amber-500 fill-amber-500'
                          : 'text-stone-300'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-bold font-numeric text-stone-700 ml-2">
                  {insightRating} 星 ·{' '}
                  {insightRating === 5
                    ? '彻底释怀通透'
                    : insightRating >= 4
                    ? '重获清晰视角'
                    : '逐步平息理顺'}
                </span>
              </div>
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="px-6 sm:px-8 py-4 border-t border-stone-200 bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-[11px] text-stone-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>保存后 AI 自动深度解构情绪，同步生成每日洞察至【进度】页面 · +50 XP</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-medium text-stone-600 hover:bg-stone-100 transition-colors"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-stone-900 text-white text-xs font-bold hover:bg-stone-800 transition-colors shadow-xs flex items-center gap-2 btn-tactile disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>AI 正在深度解构情感与心智...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>保存并生成 AI 心理洞察 (+50 XP)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

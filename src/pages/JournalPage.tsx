import React, { useState, useMemo } from 'react';
import {
  PenTool,
  Plus,
  Search,
  Filter,
  Sparkles,
  Brain,
  Waves,
  Feather,
  Scale,
  Calendar,
  Heart,
  BookOpen,
  Info,
  Wind,
  Lock,
  ShieldCheck,
  Fingerprint,
  ScanFace,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useBiometricLock } from '../context/BiometricLockContext';
import { CognitiveJournalEntry, JournalTemplateType, EmotionValence } from '../types';
import { JournalCard } from '../components/journal/JournalCard';
import { JournalAnalyticsWidget } from '../components/journal/JournalAnalyticsWidget';
import { JournalComposerModal } from '../components/journal/JournalComposerModal';
import { BiometricVaultLockScreen } from '../components/journal/BiometricVaultLockScreen';
import { JOURNAL_TEMPLATES } from '../data/journalTemplates';

export const JournalPage: React.FC = () => {
  const {
    journals,
    deleteJournal,
    composerOpen,
    setComposerOpen,
    composerPreload,
    openComposerWithPreload,
    firebaseUser,
    setBreathingOpen,
  } = useApp();

  const {
    isEnabled: isBiometricEnabled,
    isLocked: isBiometricLocked,
    biometricLabel,
    biometricIcon,
    lockVault,
    setShowSetupModal,
  } = useBiometricLock();

  const [editingEntry, setEditingEntry] = useState<CognitiveJournalEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTemplateFilter, setSelectedTemplateFilter] = useState<string>('all');
  const [selectedValenceFilter, setSelectedValenceFilter] = useState<string>('all');

  // If biometric vault is enabled and locked, show the secure Apple-grade lock screen
  if (isBiometricEnabled && isBiometricLocked) {
    return <BiometricVaultLockScreen />;
  }

  const handleOpenNew = (templateId?: JournalTemplateType) => {
    openComposerWithPreload(templateId ? { templateType: templateId } : {});
  };

  const handleEdit = (entry: CognitiveJournalEntry) => {
    openComposerWithPreload(entry);
  };

  const handleDelete = async (id: string) => {
    await deleteJournal(id);
  };

  // Filtered entries
  const filteredEntries = useMemo(() => {
    return journals.filter((entry) => {
      // Template filter
      if (selectedTemplateFilter !== 'all' && entry.templateType !== selectedTemplateFilter) {
        return false;
      }
      // Valence filter
      if (selectedValenceFilter !== 'all' && entry.emotion.valence !== selectedValenceFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = entry.title.toLowerCase().includes(q);
        const matchesPrimary = entry.emotion.primary.toLowerCase().includes(q);
        const matchesLaw = (entry.relatedLawName || '').toLowerCase().includes(q);
        const matchesTags = entry.tags.some((t) => t.toLowerCase().includes(q));
        const matchesContent = Object.values(entry.structuredData).some((v) =>
          String(v).toLowerCase().includes(q)
        );
        return matchesTitle || matchesPrimary || matchesLaw || matchesTags || matchesContent;
      }
      return true;
    });
  }, [journals, selectedTemplateFilter, selectedValenceFilter, searchQuery]);

  return (
    <div className="space-y-6 sm:space-y-8 pb-16 animate-fadeIn max-w-5xl mx-auto">
      {/* 0. Biometric Privacy Banner */}
      {isBiometricEnabled ? (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-emerald-50/90 border border-emerald-200/90 text-emerald-900 text-xs shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span className="font-bold">
              隐私保险箱已安全解锁 · 受 {biometricLabel} 与硬件芯片实时保护
            </span>
          </div>

          <button
            onClick={() => lockVault()}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white hover:bg-emerald-100/60 border border-emerald-300 text-emerald-950 font-bold text-xs transition-colors shadow-2xs cursor-pointer active:scale-95"
            title="立即重新锁定心智手记"
          >
            <Lock className="w-3.5 h-3.5 text-emerald-700" />
            <span>立即上锁</span>
          </button>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-stone-900 via-stone-850 to-indigo-950 text-white shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
              {biometricIcon === 'faceid' ? (
                <ScanFace className="w-5 h-5 text-indigo-200" />
              ) : (
                <Fingerprint className="w-5 h-5 text-indigo-200" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                <span>保护您的心理反思隐私：开启 {biometricLabel}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 font-mono">
                  WebAuthn
                </span>
              </div>
              <p className="text-[11px] text-stone-300 mt-0.5">
                利用设备安全芯片（FaceID/TouchID）加锁，敏感心智手记离开应用即自动保护。
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowSetupModal(true)}
            className="self-start sm:self-center px-4 py-2 rounded-xl bg-white text-stone-900 text-xs font-bold hover:bg-stone-100 transition-all shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>开启生物识别保护</span>
          </button>
        </div>
      )}

      {/* 1. Magazine Masthead & Lead Deck */}
      <section className="editorial-card rounded-2xl p-7 sm:p-10 md:p-12 space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-b border-stone-200/80 pb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="editorial-kicker text-[11px]">
                COGNITIVE ARCHIVE · VOL. IV / METACONSCIOUS JOURNAL
              </span>
              <span className="text-stone-300">|</span>
              <span className="text-xs font-serif-editorial text-stone-500 italic">
                {firebaseUser ? '云端 Firestore 同步中' : '本地安全离线模式'}
              </span>
            </div>

            <h1 className="font-serif-editorial text-2xl sm:text-3xl md:text-4xl font-bold text-stone-900 tracking-tight leading-tight">
              心智手记 · 情绪觉察与认知重构
            </h1>

            <p className="font-serif-editorial text-sm sm:text-base text-stone-700 leading-relaxed max-w-2xl">
              以苏格拉底式的严谨审查思维偏差，以正念的温和接纳当下情绪。将每日波动的无形心绪，通过认知心理学结构化模版沉淀为理性通透的心智资产。
            </p>
          </div>

          {/* Quick CTA Button */}
          <div className="shrink-0 flex sm:flex-col items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={() => handleOpenNew()}
              className="flex-1 sm:flex-none sm:w-full px-5 py-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 btn-tactile cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>撰写心智手记 (+50 XP)</span>
            </button>
            <button
              onClick={() => setBreathingOpen(true)}
              className="flex-1 sm:flex-none sm:w-full px-4 py-2.5 rounded-xl bg-white hover:bg-stone-50 border border-stone-200 text-stone-800 text-xs font-semibold transition-all shadow-xs flex items-center justify-center gap-2 btn-tactile cursor-pointer"
              title="开启专注呼吸平复思绪"
            >
              <Wind className="w-3.5 h-3.5 text-stone-700" />
              <span>先进行专注呼吸调节</span>
            </button>
          </div>
        </div>

        {/* 5 Bespoke Template Quick Launch Buttons */}
        <div className="space-y-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-600 block">
            快速选用结构化模版启动：
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {JOURNAL_TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => handleOpenNew(tpl.id)}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-stone-200 hover:border-stone-400 hover:shadow-xs transition-all text-left btn-tactile group"
              >
                <div className="w-7 h-7 rounded-lg bg-stone-100 group-hover:bg-stone-900 group-hover:text-white text-stone-700 flex items-center justify-center shrink-0 transition-colors">
                  {tpl.id === 'cbt-restructure' && <Brain className="w-3.5 h-3.5" />}
                  {tpl.id === 'flow-reflection' && <Waves className="w-3.5 h-3.5" />}
                  {tpl.id === 'emotional-decentering' && <Feather className="w-3.5 h-3.5" />}
                  {tpl.id === 'decision-debiasing' && <Scale className="w-3.5 h-3.5" />}
                  {tpl.id === 'free-insight' && <Sparkles className="w-3.5 h-3.5" />}
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-stone-800 block truncate leading-tight">
                    {tpl.title}
                  </span>
                  <span className="text-[10px] text-stone-600 truncate block mt-0.5">
                    {tpl.badge}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 2. Emotional Landscape & Metacognitive Analytics */}
      <JournalAnalyticsWidget entries={journals} />

      {/* 3. Search & Filter Bar */}
      <section className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索手记主旨、情绪质感、标签或反思正文..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200/90 bg-white text-xs text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:border-stone-900 focus:ring-1 focus:ring-stone-900 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 text-xs"
              >
                清空
              </button>
            )}
          </div>

          {/* Template Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { id: 'all', label: '全部模版' },
              { id: 'cbt-restructure', label: 'CBT 重构' },
              { id: 'flow-reflection', label: '心流复盘' },
              { id: 'emotional-decentering', label: '情绪解离' },
              { id: 'decision-debiasing', label: '决策去偏差' },
              { id: 'free-insight', label: '自由顿悟' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTemplateFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all btn-tactile ${
                  selectedTemplateFilter === tab.id
                    ? 'bg-stone-900 text-white font-bold'
                    : 'bg-white border border-stone-200 text-stone-600 hover:border-stone-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sub-Filter for Valence */}
        <div className="flex items-center gap-2 text-xs text-stone-600">
          <span className="font-medium">极性筛选:</span>
          {[
            { id: 'all', label: '全部' },
            { id: 'positive', label: '正向舒展' },
            { id: 'neutral', label: '平静中和' },
            { id: 'challenging', label: '挑战紧绷' },
            { id: 'mixed', label: '复杂交织' },
          ].map((v) => (
            <button
              key={v.id}
              onClick={() => setSelectedValenceFilter(v.id)}
              className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                selectedValenceFilter === v.id
                  ? 'bg-stone-300 text-stone-900 font-bold'
                  : 'hover:text-stone-900 text-stone-600'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </section>

      {/* 4. Journal Entries Feed */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-stone-200/80 pb-3">
          <div className="flex items-baseline gap-2">
            <h2 className="font-serif-editorial text-lg font-bold text-stone-900 tracking-tight">
              手记归档流 (Journal Archive Stream)
            </h2>
            <span className="text-xs text-stone-600 font-numeric">
              共 {filteredEntries.length} 篇手记
            </span>
          </div>

          <span className="text-[11px] text-stone-600 font-mono">
            CHRONOLOGICAL FEED
          </span>
        </div>

        {filteredEntries.length > 0 ? (
          <div className="space-y-6">
            {filteredEntries.map((entry) => (
              <JournalCard
                key={entry.id}
                entry={entry}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <div className="editorial-card rounded-2xl p-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center mx-auto text-stone-600">
              <PenTool className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-serif-editorial text-base font-bold text-stone-900">
                暂无符合筛选的心智手记
              </h3>
              <p className="text-xs text-stone-600 max-w-md mx-auto">
                记录内心的第一缕微澜，开启苏格拉底式的思辨之旅。选择上方模版撰写你的第一篇手记吧。
              </p>
            </div>
            <button
              onClick={() => handleOpenNew()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900 text-white text-xs font-bold hover:bg-stone-800 transition-colors btn-tactile"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>立即撰写手记</span>
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Cpu,
  FileCode2,
  FileText,
  FolderCheck,
  Layers,
  Loader2,
  Play,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Terminal,
  X,
  AlertTriangle,
  Copy,
  Check,
  Ban,
} from 'lucide-react';
import type {
  AgentWorkingContextResult,
  SkillCategoryId,
  SkillDetailResponse,
  SkillsInventoryResponse,
  SkillWithStatus,
} from '../types/skills';

const TASK_PRESETS = [
  {
    label: 'Sécurité API & QA',
    task: 'Auditer la sécurité d’une route API Express, prévenir le path traversal et ajouter des tests de non-régression',
  },
  {
    label: 'UI Motion & i18n',
    task: 'Concevoir une animation fluide accessible WCAG et multilingue (français, anglais, chinois)',
  },
  {
    label: 'Audio & TTS IA',
    task: 'Optimiser la synchronisation audio mot à mot, le timbre TTS et l’export de sous-titres',
  },
  {
    label: 'Requête hors-sujet',
    task: 'Quelle est la météo à Lyon aujourd’hui ?',
  },
];

export const SkillsAdminPage: React.FC = () => {
  const navigate = useNavigate();

  const [inventory, setInventory] = useState<SkillsInventoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<SkillCategoryId | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Skill Markdown Inspector Modal state
  const [inspectingDetail, setInspectingDetail] = useState<SkillDetailResponse | null>(null);
  const [inspectLoading, setInspectLoading] = useState(false);
  const [inspectError, setInspectError] = useState<string | null>(null);

  // Task Selection & Genuine Context Loader Tester state
  const [taskInput, setTaskInput] = useState(TASK_PRESETS[0].task);
  const [maxSkills, setMaxSkills] = useState<number>(3);
  const [contextLoading, setContextLoading] = useState(false);
  const [contextResult, setContextResult] = useState<AgentWorkingContextResult | null>(null);
  const [contextError, setContextError] = useState<string | null>(null);
  const [showRawPrompt, setShowRawPrompt] = useState(true);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const fetchInventory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/skills');
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data: SkillsInventoryResponse = await res.json();
      setInventory(data);
    } catch (err: any) {
      setError(String(err?.message || 'Impossible de charger skills/index.json'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleToggleSkill = async (skill: SkillWithStatus) => {
    const nextEnabled = !skill.enabled;
    setTogglingId(skill.id);
    setError(null);
    try {
      const res = await fetch(`/api/skills/${encodeURIComponent(skill.id)}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: nextEnabled }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      const updated: SkillsInventoryResponse = await res.json();
      setInventory(updated);
      // Re-run active context test if one was already executed so honesty stays strictly synchronized
      if (contextResult && taskInput.trim()) {
        runContextSelection(taskInput, maxSkills);
      }
    } catch (err: any) {
      setError(`Échec de mise à jour pour ${skill.id} : ${String(err?.message || err)}`);
    } finally {
      setTogglingId(null);
    }
  };

  const handleInspectSkill = async (skillId: string) => {
    setInspectLoading(true);
    setInspectError(null);
    setInspectingDetail(null);
    try {
      const res = await fetch(`/api/skills/${encodeURIComponent(skillId)}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      const detail: SkillDetailResponse = await res.json();
      setInspectingDetail(detail);
    } catch (err: any) {
      setInspectError(String(err?.message || err));
    } finally {
      setInspectLoading(false);
    }
  };

  const runContextSelection = async (taskText: string, limit: number) => {
    const trimmed = taskText.trim();
    if (!trimmed) {
      setContextError('Saisissez une description de tâche pour tester la sélection réelle.');
      return;
    }
    setContextLoading(true);
    setContextError(null);
    try {
      const res = await fetch('/api/skills/select-and-load', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: trimmed, maxSkills: limit }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      const data: AgentWorkingContextResult = await res.json();
      setContextResult(data);
    } catch (err: any) {
      setContextError(String(err?.message || err));
    } finally {
      setContextLoading(false);
    }
  };

  const handleCopyPromptBlock = async () => {
    if (!contextResult?.agentSystemPromptBlock) return;
    try {
      await navigator.clipboard.writeText(contextResult.agentSystemPromptBlock);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    } catch {
      // Clipboard API fallback ignored safely
    }
  };

  const filteredSkills = useMemo(() => {
    if (!inventory) return [];
    const q = searchQuery.trim().toLowerCase();
    return inventory.skills.filter((skill) => {
      if (selectedCategory !== 'all' && skill.category !== selectedCategory) return false;
      if (statusFilter === 'enabled' && !skill.enabled) return false;
      if (statusFilter === 'disabled' && skill.enabled) return false;
      if (!q) return true;
      return (
        skill.id.toLowerCase().includes(q) ||
        skill.name.toLowerCase().includes(q) ||
        skill.description.toLowerCase().includes(q) ||
        skill.categoryLabel.toLowerCase().includes(q) ||
        skill.keywords.some((k) => k.toLowerCase().includes(q))
      );
    });
  }, [inventory, selectedCategory, statusFilter, searchQuery]);

  const groupedByCategory = useMemo(() => {
    if (!inventory) return [];
    return inventory.categories
      .map((cat) => ({
        category: cat,
        items: filteredSkills.filter((s) => s.category === cat.id),
      }))
      .filter((group) => group.items.length > 0);
  }, [inventory, filteredSkills]);

  return (
    <div className="space-y-8 pb-12 animate-fadeIn">
      {/* Editorial Admin Header */}
      <section className="editorial-card rounded-2xl p-6 sm:p-8 bg-white border border-stone-200 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Retour aux paramètres
          </button>

          <button
            type="button"
            onClick={fetchInventory}
            disabled={loading}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-stone-200 bg-[#FAF8F5] text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Recharger depuis skills/index.json
          </button>
        </div>

        <div className="space-y-2">
          <span className="editorial-kicker text-[10px] text-amber-800 font-bold tracking-widest block">
            AI STUDIO MASTER SKILLS · ADMINISTRATION & CONTEXTE AGENT
          </span>
          <h1 className="font-serif-editorial text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
            Registre central des 20 compétences
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 max-w-3xl leading-relaxed">
            Les Skills sont des fichiers d’instructions Markdown (<code className="font-mono text-[11px] bg-stone-100 px-1 py-0.5 rounded">SKILL.md</code>),
            et non des outils exécutables. Seules les compétences activées et réellement lues depuis le disque sont injectées dans le contexte de l’agent.
          </p>
        </div>

        {/* Clean Unboxed Telemetry Summary */}
        {inventory && (
          <div className="pt-3 border-t border-stone-200/80 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-stone-700 font-numeric">
            <span>
              <strong className="text-stone-950 font-semibold">{inventory.totalCount}</strong> compétences répertoriées
            </span>
            <span className="text-stone-300">·</span>
            <span>
              <strong className="text-emerald-700 font-semibold">{inventory.enabledCount}</strong> activées
            </span>
            <span className="text-stone-300">·</span>
            <span>
              <strong className="text-stone-900 font-semibold">{inventory.verifiedOnDiskCount}/{inventory.totalCount}</strong>{' '}
              fichiers SKILL.md vérifiés sur disque
            </span>
            <span className="text-stone-300">·</span>
            <span className="inline-flex items-center gap-1 text-stone-700">
              <FolderCheck className="w-3.5 h-3.5 text-amber-700" />
              <strong className="font-semibold">{inventory.originalsPreservedCount}/{inventory.totalCount}</strong> originaux préservés
            </span>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}
      </section>

      {/* Task-Based Skill Selector & Genuine Context Loader */}
      <section className="editorial-card rounded-2xl p-6 sm:p-8 bg-white border border-stone-200 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4 pb-3 border-b border-stone-200/80">
          <div>
            <span className="editorial-kicker text-[10px] text-stone-500 block mb-0.5">
              CHARGEMENT DYNAMIQUE SÉLECTIF · POST /api/skills/select-and-load
            </span>
            <h2 className="font-serif-editorial text-lg sm:text-xl font-bold text-stone-900 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-amber-700" />
              Sélecteur de Skills & Contexte Agent réel
            </h2>
          </div>

          <div className="flex items-center gap-2 text-xs text-stone-600">
            <label htmlFor="max-skills-select" className="font-medium">
              Plafond par requête :
            </label>
            <select
              id="max-skills-select"
              value={maxSkills}
              onChange={(e) => setMaxSkills(Number(e.target.value))}
              className="px-2.5 py-1 rounded-lg border border-stone-200 bg-[#FAF8F5] text-stone-900 font-semibold text-xs focus:outline-none focus:border-stone-500"
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  Max {n} Skill{n > 1 ? 's' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Presets */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-medium text-stone-500 mr-1">Exemples :</span>
          {TASK_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => {
                setTaskInput(preset.task);
                runContextSelection(preset.task, maxSkills);
              }}
              className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-[#FAF8F5] hover:bg-stone-100 text-stone-700 border border-stone-200 transition-colors cursor-pointer"
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Task Input Bar */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <input
            type="text"
            value={taskInput}
            onChange={(e) => setTaskInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                runContextSelection(taskInput, maxSkills);
              }
            }}
            placeholder="Décrivez une tâche (ex : Auditer la sécurité d'une API et écrire des tests)..."
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#FAF8F5] border border-stone-200 text-xs sm:text-sm text-stone-900 focus:outline-none focus:border-stone-600"
          />
          <button
            type="button"
            onClick={() => runContextSelection(taskInput, maxSkills)}
            disabled={contextLoading}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 shrink-0 whitespace-nowrap"
          >
            {contextLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
            Sélectionner & Charger depuis le disque
          </button>
        </div>

        {contextError && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
            {contextError}
          </div>
        )}

        {/* Context Loading Verification Output */}
        {contextResult && (
          <div className="space-y-4 pt-2">
            {/* Honesty Banner */}
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                contextResult.hasVerifiedLoadedContext
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                  : 'bg-[#FAF8F5] border-stone-200 text-stone-800'
              }`}
            >
              {contextResult.hasVerifiedLoadedContext ? (
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              ) : (
                <Sparkles className="w-4 h-4 text-stone-500 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <p className="font-semibold">{contextResult.honestyNotice}</p>
                <p className="text-[11px] opacity-80">
                  Évaluation sur {contextResult.evaluatedSkillsCount} compétences ({contextResult.enabledSkillsCount} activées) ·{' '}
                  Contexte réel chargé : <strong className="font-numeric">{contextResult.totalLoadedBytes} octets</strong>
                </p>
              </div>
            </div>

            {/* Loaded Skills List */}
            {contextResult.loadedSkills.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {contextResult.loadedSkills.map((loaded) => (
                  <div
                    key={loaded.id}
                    className="p-3.5 rounded-xl border border-stone-200 bg-[#FAF8F5]/80 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500 block">
                          {loaded.categoryLabel} · Score {loaded.score}
                        </span>
                        <h3 className="text-xs font-bold text-stone-900">{loaded.name}</h3>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
                        <CheckCircle2 className="w-3 h-3" />
                        Disque lu
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-600 leading-snug">{loaded.matchedReason}</p>
                    <div className="text-[10px] font-mono text-stone-500 pt-1 border-t border-stone-200/70 flex items-center justify-between">
                      <span>{loaded.bytesLoaded} o · {loaded.lineCount} lignes</span>
                      <span>sha:{loaded.sha256Prefix}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Excluded Disabled Skills (Proof disabled state prevents injection) */}
            {contextResult.excludedDisabledSkills.length > 0 && (
              <div className="p-3.5 rounded-xl border border-amber-200/80 bg-amber-50/50 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900">
                  <Ban className="w-3.5 h-3.5 text-amber-700" />
                  Compétences pertinentes exclues car désactivées ({contextResult.excludedDisabledSkills.length})
                </div>
                <div className="space-y-1">
                  {contextResult.excludedDisabledSkills.map((ex) => (
                    <div key={ex.id} className="text-[11px] text-amber-900/90 flex flex-wrap items-center gap-2">
                      <span className="font-mono font-semibold">{ex.id}</span>
                      <span className="text-amber-700">·</span>
                      <span>{ex.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Real Assembled Agent Prompt Context */}
            {contextResult.agentSystemPromptBlock && (
              <div className="rounded-xl border border-stone-200 overflow-hidden bg-stone-950 text-stone-100">
                <div className="px-4 py-2.5 bg-stone-900 border-b border-stone-800 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRawPrompt((v) => !v)}
                    className="inline-flex items-center gap-2 text-[11px] font-mono text-stone-200 hover:text-white cursor-pointer"
                  >
                    <Terminal className="w-3.5 h-3.5 text-amber-400" />
                    <span>
                      Contexte système injecté à l’agent ({contextResult.totalLoadedBytes} octets) ·{' '}
                      {showRawPrompt ? 'Masquer' : 'Afficher'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyPromptBlock}
                    className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 transition-colors cursor-pointer"
                  >
                    {copiedPrompt ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copiedPrompt ? 'Copié' : 'Copier'}
                  </button>
                </div>

                {showRawPrompt && (
                  <pre className="p-4 text-[11px] leading-relaxed font-mono text-stone-200 whitespace-pre-wrap max-h-80 overflow-y-auto">
                    {contextResult.agentSystemPromptBlock}
                  </pre>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Catalog Filters & Category Directory */}
      <section className="space-y-5">
        <div className="editorial-card rounded-2xl p-5 bg-white border border-stone-200 space-y-4">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filtrer par nom, ID, description ou mot-clé..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#FAF8F5] border border-stone-200 text-xs text-stone-900 focus:outline-none focus:border-stone-500"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              {(['all', 'enabled', 'disabled'] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-lg font-medium border transition-colors cursor-pointer ${
                    statusFilter === status
                      ? 'bg-stone-900 text-white border-stone-900'
                      : 'bg-[#FAF8F5] text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  {status === 'all' ? 'Tous statuts' : status === 'enabled' ? 'Activées' : 'Désactivées'}
                </button>
              ))}
            </div>
          </div>

          {/* Category Tabs */}
          {inventory && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-stone-900 text-white border-stone-900'
                    : 'bg-[#FAF8F5] text-stone-700 border-stone-200 hover:bg-stone-100'
                }`}
              >
                Toutes ({inventory.totalCount})
              </button>
              {inventory.categories.map((cat) => {
                const count = inventory.skills.filter((s) => s.category === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                      selectedCategory === cat.id
                        ? 'bg-stone-900 text-white border-stone-900'
                        : 'bg-[#FAF8F5] text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {cat.label} ({count})
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {loading && !inventory ? (
          <div className="editorial-card rounded-2xl p-10 text-center bg-white border border-stone-200">
            <Loader2 className="w-6 h-6 animate-spin text-stone-500 mx-auto mb-2" />
            <p className="text-xs text-stone-500">Lecture du registre skills/index.json et vérification disque…</p>
          </div>
        ) : groupedByCategory.length === 0 ? (
          <div className="editorial-card rounded-2xl p-10 text-center bg-white border border-stone-200">
            <p className="text-sm font-semibold text-stone-800">Aucune compétence ne correspond à ces filtres.</p>
          </div>
        ) : (
          groupedByCategory.map(({ category, items }) => (
            <div key={category.id} className="space-y-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2 px-1">
                <div>
                  <h2 className="font-serif-editorial text-lg font-bold text-stone-900 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-amber-700" />
                    {category.label}
                    <span className="text-xs font-sans font-normal text-stone-500">
                      · {items.length} compétence{items.length > 1 ? 's' : ''}
                    </span>
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">{category.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {items.map((skill) => {
                  const isBusy = togglingId === skill.id;
                  return (
                    <article
                      key={skill.id}
                      className={`rounded-2xl p-5 border transition-colors bg-white flex flex-col justify-between gap-4 ${
                        skill.enabled
                          ? 'border-stone-200'
                          : 'border-stone-200/70 bg-stone-50/70 opacity-85'
                      }`}
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 text-[11px] font-mono text-stone-500">
                              <span>#{String(skill.order).padStart(2, '0')}</span>
                              <span>·</span>
                              <span className="truncate">{skill.id}</span>
                            </div>
                            <h3 className="font-serif-editorial text-base font-bold text-stone-900 mt-0.5">
                              {skill.name}
                            </h3>
                          </div>

                          {/* Enable / Disable Toggle Switch */}
                          <button
                            type="button"
                            role="switch"
                            aria-checked={skill.enabled}
                            aria-label={`${skill.enabled ? 'Désactiver' : 'Activer'} la compétence ${skill.name}`}
                            disabled={isBusy}
                            onClick={() => handleToggleSkill(skill)}
                            className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-colors cursor-pointer shrink-0 disabled:opacity-50 ${
                              skill.enabled
                                ? 'bg-stone-900 text-white border-stone-900 hover:bg-stone-800'
                                : 'bg-white text-stone-600 border-stone-300 hover:bg-stone-100'
                            }`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                skill.enabled ? 'bg-emerald-400' : 'bg-stone-300'
                              }`}
                            />
                            {isBusy ? 'Mise à jour…' : skill.enabled ? 'Activée' : 'Désactivée'}
                          </button>
                        </div>

                        <p className="text-xs text-stone-700 leading-relaxed">{skill.description}</p>
                      </div>

                      <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                        <div className="flex items-center gap-2 text-stone-500 font-numeric">
                          {skill.disk.fileExists ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              SKILL.md ({skill.disk.bytes} o)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-rose-700 font-medium">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              Fichier absent
                            </span>
                          )}
                          <span className="text-stone-300">·</span>
                          <span title={skill.originalAttachmentPath}>
                            {skill.disk.originalPreserved ? 'Original préservé' : 'Original non trouvé'}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleInspectSkill(skill.id)}
                          className="inline-flex items-center gap-1 font-semibold text-stone-800 hover:text-amber-800 transition-colors cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          Inspecter SKILL.md
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </section>

      {/* SKILL.md Real Disk Inspection Modal */}
      {(inspectLoading || inspectError || inspectingDetail) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 bg-[#FAF8F5] border-b border-stone-200 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <span className="text-[10px] font-mono uppercase tracking-widest text-stone-500 block">
                  Lecture directe depuis le disque · GET /api/skills/{inspectingDetail?.skill.id || ''}
                </span>
                <h3 className="font-serif-editorial text-lg font-bold text-stone-900 truncate flex items-center gap-2">
                  <FileCode2 className="w-4 h-4 text-amber-700 shrink-0" />
                  {inspectingDetail?.skill.name || 'Chargement…'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setInspectingDetail(null);
                  setInspectError(null);
                }}
                aria-label="Fermer l'inspecteur"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-500 hover:bg-stone-200/70 hover:text-stone-900 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              {inspectLoading && (
                <div className="py-10 text-center text-xs text-stone-500">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                  Lecture du fichier SKILL.md sur disque…
                </div>
              )}

              {inspectError && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                  {inspectError}
                </div>
              )}

              {inspectingDetail && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-[#FAF8F5] p-3.5 rounded-xl border border-stone-200">
                    <div>
                      <span className="text-stone-500 block text-[10px] uppercase">Chemin actif</span>
                      <span className="font-mono text-stone-900">{inspectingDetail.skill.path}</span>
                    </div>
                    <div>
                      <span className="text-stone-500 block text-[10px] uppercase">Fichier original préservé</span>
                      <span className="font-mono text-stone-700">
                        {inspectingDetail.skill.originalAttachmentPath}
                      </span>
                    </div>
                    <div>
                      <span className="text-stone-500 block text-[10px] uppercase">Statut disque</span>
                      <span className="font-semibold text-emerald-700">
                        {inspectingDetail.loadedFromDisk
                          ? `Lu depuis le disque (${inspectingDetail.skill.disk.bytes} octets · ${inspectingDetail.skill.disk.lineCount} lignes)`
                          : 'Non chargé (fichier absent)'}
                      </span>
                    </div>
                    <div>
                      <span className="text-stone-500 block text-[10px] uppercase">Empreinte SHA-256</span>
                      <span className="font-mono text-stone-800">
                        {inspectingDetail.skill.disk.sha256Prefix || '—'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-stone-700 block mb-1.5">
                      Contenu exact du fichier SKILL.md (frontmatter YAML + instructions) :
                    </span>
                    <pre className="p-4 rounded-xl bg-stone-950 text-stone-100 text-xs font-mono leading-relaxed whitespace-pre-wrap overflow-x-auto">
                      {inspectingDetail.rawMarkdown}
                    </pre>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

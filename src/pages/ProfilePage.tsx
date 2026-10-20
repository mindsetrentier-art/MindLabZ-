import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Flame, Star, Trophy, Bookmark, Settings, RotateCcw, Sparkles, Shield, ShieldCheck, Heart, HelpCircle, Check, Info, Cloud, LogIn, LogOut, CheckCircle2, Database, RefreshCw, ExternalLink, KeyRound, Users, UserPlus, Copy, PenLine, ArrowRight } from 'lucide-react';
import { doc, getDocFromServer } from 'firebase/firestore';
import { db, diagnoseFirebaseAuthError, AuthErrorDiagnostic } from '../firebase';
import firebaseConfig from '../../firebase-applet-config.json';
import { useApp } from '../context/AppContext';
import { OverlappingCardStack } from '../components/ui/OverlappingCardStack';

const GOAL_OPTIONS = [
  '空间与序列记忆 (Memory)',
  '专注力与抗干扰 (Attention)',
  '理性决策与去偏见 (Decision)',
  '心理学经典理论 (Psychology)',
  '批判性反思 (Reasoning)',
  '敏捷神经反应 (Speed)'
];

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const {
    user,
    firebaseUser,
    activeAccountEmail,
    savedAccounts,
    authReady,
    isSyncing,
    authDiagnostic,
    setAuthDiagnostic,
    authLoading,
    openAuthModal,
    openPwaModal,
    loginWithGoogle,
    loginWithGoogleRedirect,
    switchGoogleAccount,
    loginAsCustomUser,
    switchSavedAccount,
    logout,
    updateGoals,
    resetProgress,
    triggerConfetti,
    journals,
    openComposerWithPreload,
  } = useApp();

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticEnabled, setHapticEnabled] = useState(true);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [selectedGoals, setSelectedGoals] = useState<string[]>(user.selectedGoals || []);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [copiedDomain, setCopiedDomain] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [dbPingStatus, setDbPingStatus] = useState<'idle' | 'testing' | 'online' | 'error'>('idle');
  const [dbPingLatency, setDbPingLatency] = useState<number | null>(null);
  const [showFirebaseGuide, setShowFirebaseGuide] = useState<boolean>(true);

  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';

  useEffect(() => {
    setSelectedGoals(user.selectedGoals || []);
  }, [user.selectedGoals]);

  const handleTestFirestoreConnection = async () => {
    setDbPingStatus('testing');
    const t0 = performance.now();
    try {
      await getDocFromServer(doc(db, 'test', 'connection'));
      setDbPingLatency(Math.round(performance.now() - t0));
      setDbPingStatus('online');
    } catch (err: any) {
      const msg = String(err?.message || '');
      if (!msg.includes('the client is offline')) {
        setDbPingLatency(Math.round(performance.now() - t0));
        setDbPingStatus('online');
      } else {
        setDbPingStatus('error');
      }
    }
  };

  useEffect(() => {
    handleTestFirestoreConnection();
  }, []);

  const toggleGoal = (goal: string) => {
    setSelectedGoals(prev =>
      prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]
    );
  };

  const handleSaveGoals = () => {
    updateGoals(selectedGoals);
    setShowGoalModal(false);
    triggerConfetti();
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle('popup');
      triggerConfetti();
    } catch {
      // Diagnostic is already handled by AppContext
    }
  };

  const handleGoogleRedirectLogin = async () => {
    try {
      await loginWithGoogleRedirect();
    } catch {
      // Diagnostic is already handled by AppContext
    }
  };

  const handleSwitchGoogleAccount = async () => {
    try {
      await switchGoogleAccount();
      triggerConfetti();
    } catch {
      // Diagnostic is already handled by AppContext
    }
  };

  const handleCopyHostname = () => {
    if (!currentHostname) return;
    navigator.clipboard.writeText(currentHostname).catch(() => {});
    setCopiedDomain(true);
    setTimeout(() => setCopiedDomain(false), 2500);
  };

  const handleCustomUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim() && !customEmail.trim()) return;
    loginAsCustomUser(customName, customEmail);
    setCustomName('');
    setCustomEmail('');
    setShowAddUserForm(false);
    setAuthDiagnostic(null);
    triggerConfetti();
  };

  const handleLogout = async () => {
    setAuthDiagnostic(null);
    await logout();
  };

  return (
    <div className="space-y-8 sm:space-y-10 pb-12 animate-fadeIn max-w-4xl mx-auto">
      {/* 1. Profile Avatar & Hero Card */}
      <section className="editorial-card rounded-2xl p-7 sm:p-10 space-y-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-6 border-b border-stone-200/80">
          <div className="w-20 h-20 rounded-full border border-stone-300 p-0.5 relative shrink-0">
            <div className="w-full h-full rounded-full overflow-hidden bg-stone-100">
              <img
                src={user.avatar}
                alt={user.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            {firebaseUser && (
              <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-emerald-600 border-2 border-white flex items-center justify-center" title="Firebase 云端已连接">
                <Check className="w-3 h-3 text-white stroke-[3px]" />
              </div>
            )}
          </div>

          <div className="space-y-1 text-center sm:text-left flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-2">
              <h2 className="font-serif-editorial text-2xl font-bold text-stone-900">{user.name}</h2>
              <span className="text-xs font-semibold text-stone-600 font-numeric">
                Level {user.level} · {user.title}
              </span>
            </div>
            {(firebaseUser?.email || activeAccountEmail) && (
              <p className="text-xs text-stone-500 font-numeric">
                {firebaseUser?.email || activeAccountEmail}
              </p>
            )}
          </div>
        </div>

        {/* Mini Stats Row (Unboxed Editorial Typography) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-1 text-center font-numeric">
          <div className="p-3 rounded-xl bg-[#FAF8F5] border border-stone-200/60">
            <span className="text-[11px] text-stone-500 block mb-1">连续研习</span>
            <span className="text-base font-bold text-stone-900 flex items-center justify-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-600" />
              {user.streak} 天
            </span>
          </div>
          <div className="p-3 rounded-xl bg-[#FAF8F5] border border-stone-200/60">
            <span className="text-[11px] text-stone-500 block mb-1">总经验值</span>
            <span className="text-base font-bold text-stone-900 flex items-center justify-center gap-1">
              <Star className="w-3.5 h-3.5 text-stone-600 fill-stone-400" />
              {user.xp.toLocaleString()} XP
            </span>
          </div>
          <div className="p-3 rounded-xl bg-[#FAF8F5] border border-stone-200/60">
            <span className="text-[11px] text-stone-500 block mb-1">掌握定律</span>
            <span className="text-base font-bold text-emerald-800 flex items-center justify-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-emerald-700" />
              {user.lawsMastered.length} 项
            </span>
          </div>
          <div
            onClick={() => navigate('/journal')}
            className="p-3 rounded-xl bg-[#FAF8F5] border border-stone-200/60 cursor-pointer hover:border-stone-400 transition-colors group"
            title="查看心智手记"
          >
            <span className="text-[11px] text-stone-500 block mb-1 group-hover:text-stone-900">心智手记</span>
            <span className="text-base font-bold text-stone-900 flex items-center justify-center gap-1">
              <PenLine className="w-3.5 h-3.5 text-stone-700" />
              {journals.length} 篇
            </span>
          </div>
        </div>

        {/* Firebase Authentication & Multi-User Cloud Sync Bar */}
        <div className="space-y-4 pt-2 text-left">
          {!authReady ? (
            <div className="text-xs text-stone-500 py-3 text-center">
              Vérification de la connexion Firebase Cloud... (正在检测云端连接状态...)
            </div>
          ) : firebaseUser ? (
            <div className="bg-[#FAF8F5] border border-stone-200 rounded-xl p-4 sm:p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Cloud className="w-4 h-4 text-emerald-700 shrink-0" />
                  <div>
                    <span className="text-xs font-semibold text-stone-900 block">
                      {isSyncing
                        ? 'Synchronisation Firestore en cours... (正在同步...)'
                        : 'Synchronisation Firebase Active · 云端实时同步已开启'}
                    </span>
                    <span className="text-[11px] text-stone-500 block">
                      Connecté : {firebaseUser.email || user.name} · UID: {firebaseUser.uid.slice(0, 8)}...
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={openAuthModal}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-stone-900 text-white hover:bg-stone-800 text-xs font-medium transition-colors cursor-pointer"
                    title="Ouvrir l'assistant de synchronisation et transfert"
                  >
                    <Cloud className="w-3.5 h-3.5" />
                    <span>Gérer Cloud & Sync</span>
                  </button>
                  <button
                    onClick={handleSwitchGoogleAccount}
                    disabled={authLoading}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white text-stone-800 hover:bg-stone-50 border border-stone-200 text-xs font-medium transition-colors cursor-pointer"
                    title="Connecter un autre compte Google"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Autre compte</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white text-stone-600 hover:text-rose-700 border border-stone-200 text-xs font-medium transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Déconnexion</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#FAF8F5] border border-stone-200 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-stone-900">
                  <Cloud className="w-4 h-4 text-stone-700" />
                  <span>Connexion Google Auth Multi-Utilisateurs · 连接云端</span>
                </div>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-stone-200 text-stone-700 font-mono">
                  Multi-Comptes
                </span>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                Chaque utilisateur peut se connecter avec son propre compte Google (fenêtre de choix de compte activée) pour synchroniser son profil dans <strong>Cloud Firestore</strong>.
              </p>

              {/* Diagnostic Box if error */}
              {authDiagnostic && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 space-y-2 text-xs">
                  <div className="font-semibold text-rose-800 flex items-center justify-between">
                    <span>⚠️ {authDiagnostic.titleFr}</span>
                    <span className="font-mono text-[10px] opacity-80">{authDiagnostic.code}</span>
                  </div>
                  <p className="text-rose-700 leading-relaxed">{authDiagnostic.messageFr}</p>

                  {currentHostname && (
                    <div className="p-2.5 rounded-lg bg-white border border-rose-200 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[10px] text-stone-500 block">
                          Domaine actuel à autoriser dans Firebase Console :
                        </span>
                        <code className="text-xs font-mono font-bold text-stone-900 break-all">
                          {currentHostname}
                        </code>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyHostname}
                        className="px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 font-medium text-xs flex items-center gap-1 shrink-0 cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copiedDomain ? 'Copié !' : 'Copier'}</span>
                      </button>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    <a
                      href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/settings`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-rose-200 text-rose-800 font-medium text-xs hover:bg-rose-100"
                    >
                      <span>Ouvrir Firebase Auth → Authorized Domains</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <button
                      type="button"
                      onClick={() => setShowAddUserForm(true)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-stone-900 text-white font-medium text-xs cursor-pointer"
                    >
                      <UserPlus className="w-3 h-3" />
                      <span>Connexion directe par Email/Nom</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <button
                  onClick={handleGoogleLogin}
                  disabled={authLoading}
                  className="w-full py-2.5 px-3 rounded-xl chameleon-btn text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>
                    {authLoading
                      ? 'Ouverture de Google...'
                      : 'Se connecter avec Google (Pop-up)'}
                  </span>
                </button>

                <button
                  onClick={handleGoogleRedirectLogin}
                  disabled={authLoading}
                  className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-stone-50 text-stone-800 border border-stone-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  title="Utiliser la redirection complète si les pop-ups sont bloqués sur mobile"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Mode Redirection (Sans Pop-up)</span>
                </button>
              </div>

              <button
                type="button"
                onClick={openAuthModal}
                className="w-full py-2.5 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Assistant de Connexion Multi-Appareils & Diagnostic</span>
              </button>
            </div>
          )}

          {/* Multi-User Profile Switcher */}
          <div className="bg-white border border-stone-200 rounded-xl p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 font-semibold text-stone-900">
                <Users className="w-4 h-4 text-stone-700" />
                <span>Comptes Utilisateurs & Changement de Profil</span>
              </div>
              <button
                type="button"
                onClick={() => setShowAddUserForm((prev) => !prev)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 font-medium text-xs transition-colors cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{showAddUserForm ? 'Fermer' : '+ Autre utilisateur'}</span>
              </button>
            </div>

            {showAddUserForm && (
              <form
                onSubmit={handleCustomUserSubmit}
                className="p-3.5 rounded-xl bg-[#FAF8F5] border border-stone-200 space-y-2.5 animate-fadeIn"
              >
                <div className="text-xs font-medium text-stone-800">
                  Connecter un nouvel utilisateur (Profil dédié immédiat)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Nom ou Prénom (ex: Marie Laurent)"
                    className="px-3 py-2 rounded-lg bg-white border border-stone-200 text-xs text-stone-900 focus:outline-none focus:border-stone-500"
                  />
                  <input
                    type="email"
                    required
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    placeholder="Email Google (ex: marie@gmail.com)"
                    className="px-3 py-2 rounded-lg bg-white border border-stone-200 text-xs text-stone-900 focus:outline-none focus:border-stone-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 rounded-lg chameleon-btn text-xs font-semibold cursor-pointer"
                >
                  Activer ce compte utilisateur
                </button>
              </form>
            )}

            {/* List of Saved Accounts */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pt-1">
              {savedAccounts.map((acc) => {
                const isCurrent =
                  (activeAccountEmail &&
                    activeAccountEmail.toLowerCase() === acc.email.toLowerCase()) ||
                  (!activeAccountEmail && user.name === acc.name);
                return (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => {
                      switchSavedAccount(acc);
                      triggerConfetti();
                    }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-left shrink-0 transition-colors cursor-pointer ${
                      isCurrent
                        ? 'bg-stone-900 border-stone-900 text-white font-medium'
                        : 'bg-[#FAF8F5] border-stone-200 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    <img
                      src={acc.avatar}
                      alt={acc.name}
                      referrerPolicy="no-referrer"
                      className="w-6 h-6 rounded-full object-cover bg-white"
                    />
                    <div className="min-w-0">
                      <div className="text-xs truncate max-w-[120px] leading-tight">
                        {acc.name}
                      </div>
                      <div className={`text-[10px] truncate max-w-[120px] ${isCurrent ? 'text-stone-300' : 'text-stone-500'}`}>
                        {acc.email}
                      </div>
                    </div>
                    {isCurrent && <Check className="w-3.5 h-3.5 text-white shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Firebase & Firestore Diagnostic & Guide Card */}
          <div className="bg-white border border-stone-200 rounded-xl p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 font-semibold text-stone-900">
                <Database className="w-4 h-4 text-stone-700" />
                <span>Diagnostic Firebase & Firestore</span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    dbPingStatus === 'online'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : dbPingStatus === 'testing'
                      ? 'bg-amber-50 text-amber-800'
                      : 'bg-rose-50 text-rose-700'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      dbPingStatus === 'online'
                        ? 'bg-emerald-600'
                        : dbPingStatus === 'testing'
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                  />
                  {dbPingStatus === 'online'
                    ? `En ligne (${dbPingLatency ?? 45}ms)`
                    : dbPingStatus === 'testing'
                    ? 'Test...'
                    : 'Hors ligne'}
                </span>
                <button
                  type="button"
                  onClick={handleTestFirestoreConnection}
                  className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
                  title="Tester la liaison Firestore en direct"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${dbPingStatus === 'testing' ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-[#FAF8F5] p-3 rounded-lg border border-stone-200/80">
              <div>
                <span className="text-stone-500 block text-[10px]">Projet Firebase (Project ID)</span>
                <span className="font-mono font-semibold text-stone-900">{firebaseConfig.projectId}</span>
              </div>
              <div>
                <span className="text-stone-500 block text-[10px]">Collection Utilisateur</span>
                <span className="font-mono font-semibold text-stone-900">
                  /users/{firebaseUser ? firebaseUser.uid.slice(0, 10) + '...' : '{userId}'}
                </span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-stone-500 block text-[10px]">Base Firestore (Database ID)</span>
                <span className="font-mono text-stone-700 break-all text-[11px]">
                  {firebaseConfig.firestoreDatabaseId}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowFirebaseGuide((v) => !v)}
                className="text-xs text-stone-700 hover:text-stone-900 font-medium cursor-pointer"
              >
                {showFirebaseGuide ? 'Masquer le guide Firebase ▲' : 'Voir où et comment relier Firebase ▼'}
              </button>
              <a
                href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/firestore/databases/${firebaseConfig.firestoreDatabaseId}/data`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-stone-700 hover:text-stone-900 font-medium"
              >
                <span>Ouvrir la Console Firebase</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {showFirebaseGuide && (
              <div className="pt-3 border-t border-stone-200 space-y-2 text-xs text-stone-600 leading-relaxed">
                <p className="font-semibold text-stone-900">
                  Où et comment fonctionne la liaison Firebase dans MindLabZ :
                </p>
                <p>
                  <strong>1. Dans l’application :</strong> Cliquez sur le bouton <em>« Se connecter avec Google (Firebase Auth) »</em> ci-dessus pour lier votre compte.
                </p>
                <p>
                  <strong>2. Fichier de configuration :</strong> <code className="bg-stone-100 px-1 rounded">/firebase-applet-config.json</code> contient les clés du projet <code className="bg-stone-100 px-1 rounded">{firebaseConfig.projectId}</code> et l’identifiant exact de la base Firestore.
                </p>
                <p>
                  <strong>3. Initialisation & Sécurité :</strong> <code className="bg-stone-100 px-1 rounded">src/firebase.ts</code> initialise Auth + Firestore, <code className="bg-stone-100 px-1 rounded">src/context/AppContext.tsx</code> synchronise automatiquement vos progrès en temps réel, et <code className="bg-stone-100 px-1 rounded">/firestore.rules</code> protège vos données.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* App Icon & Desktop Installation (PWA) Showcase Card */}
      <section className="editorial-card rounded-2xl p-6 sm:p-8 space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-stone-200/80">
          <div>
            <span className="editorial-kicker text-[10px] text-stone-500 block mb-0.5">
              OFFICIAL APPLICATION ICON · PWA ÉCRAN D'ACCUEIL
            </span>
            <h3 className="font-serif-editorial text-lg sm:text-xl font-bold text-stone-900">
              Icône de l'Application & Installation sur le Bureau
            </h3>
          </div>
          <button
            onClick={openPwaModal}
            className="chameleon-btn text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Installer l'icône sur le bureau / mobile</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl bg-[#FAF8F5] border border-stone-200/80">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl p-1 bg-stone-900 border border-amber-400/40 shadow-md shrink-0 overflow-hidden group cursor-pointer" onClick={openPwaModal}>
            <img
              src="/app-icon.png"
              alt="Icône MindLabZ"
              className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="space-y-1.5 text-center sm:text-left flex-1 min-w-0">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="font-serif-editorial text-base font-bold text-stone-900">MindLabZ · 智心堂</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-200 text-stone-800">iOS & Android Ready</span>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Emblème minimaliste haut de gamme en or brossé et ardoise matte, optimisé pour les écrans tactiles et le bureau de votre téléphone. L'icône se lance directement en mode application autonome (PWA).
            </p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
              <button
                onClick={openPwaModal}
                className="text-xs font-semibold text-stone-800 hover:text-stone-950 underline cursor-pointer"
              >
                Guide d'installation pour iPhone (Safari) et Android (Chrome) →
              </button>
              <span className="text-stone-300">·</span>
              <a
                href="/app-icon.png"
                download="MindLabZ-App-Icon.png"
                className="text-xs text-stone-600 hover:text-stone-900 font-medium cursor-pointer"
              >
                Télécharger l'image HD (1024px)
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Cognitive Journal Archive Card */}
      <section className="editorial-card rounded-2xl p-7 sm:p-9 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-stone-200/80">
          <div>
            <span className="editorial-kicker text-[10px] text-stone-500 block mb-0.5">
              Metacognitive Logs · 心智手记
            </span>
            <h3 className="font-serif-editorial text-lg sm:text-xl font-bold text-stone-900 flex items-center gap-2">
              <PenLine className="w-4 h-4 text-stone-700" />
              个人情绪觉察与认知手记 ({journals.length} 篇)
            </h3>
          </div>
          <button
            onClick={() => navigate('/journal')}
            className="text-xs font-semibold text-stone-800 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>进入手记流</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {journals.length > 0 ? (
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-mono text-stone-500 block">
                  最新一条 · {journals[0].date} ({journals[0].emotion.primary})
                </span>
                <h4 className="font-serif-editorial font-bold text-stone-900 text-sm mt-0.5">
                  {journals[0].title}
                </h4>
              </div>
              <button
                onClick={() => openComposerWithPreload()}
                className="px-3.5 py-1.5 rounded-lg bg-stone-900 text-white text-xs font-bold hover:bg-stone-800 transition-colors shrink-0 btn-tactile cursor-pointer"
              >
                + 撰写新手记 (+50 XP)
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-[#FAF8F5] text-center space-y-2">
            <p className="text-xs text-stone-600">
              尚无归档手记。运用 CBT 认知重构与心流复盘，记录每日情绪与洞察。
            </p>
            <button
              onClick={() => openComposerWithPreload()}
              className="px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-bold hover:bg-stone-800 transition-colors btn-tactile cursor-pointer"
            >
              立即开启第一篇记录 (+50 XP)
            </button>
          </div>
        )}
      </section>

      {/* Overlapping Card Stack Deck: 个人资料与荣誉成就卡片 */}
      <section className="editorial-card rounded-2xl p-4 sm:p-7 md:p-9 space-y-4 bg-white border border-stone-200">
        <div className="pb-2 border-b border-stone-200/80">
          <span className="editorial-kicker text-[10px] text-amber-700 font-bold block mb-0.5">
            HONOR DECK · 重叠式卡片展馆
          </span>
          <h3 className="font-serif-editorial text-lg sm:text-xl font-bold text-stone-900 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-600" />
            荣誉徽章与成就卡组（1/3 叠放 · 点击依次展开）
          </h3>
          <p className="text-xs text-stone-500 mt-1">
            卡片之间相互覆盖约 1/3，收起时显示前 3 张及剩余余量；点击后依次平滑展开并显示详细成就名称与等级，再次点击平滑收回。
          </p>
        </div>

        <div className="pt-1">
          <OverlappingCardStack
            scenario="profile"
            maxVisible={3}
            overlapRatio={1 / 3}
            size="md"
            layout="row"
            showScenarioTabs={true}
          />
        </div>
      </section>

      {/* 2. Training Goals Section */}
      <section className="editorial-card rounded-2xl p-7 sm:p-9 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-stone-200/80">
          <div>
            <span className="editorial-kicker text-[10px] text-stone-500 block mb-0.5">
              Target Disciplines
            </span>
            <h3 className="font-serif-editorial text-lg sm:text-xl font-bold text-stone-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-stone-700" />
              个人认知研习与训练目标
            </h3>
          </div>
          <button
            onClick={() => setShowGoalModal(true)}
            className="text-xs font-semibold text-stone-800 hover:underline cursor-pointer"
          >
            编辑目标
          </button>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {selectedGoals.map((goal, idx) => (
            <span
              key={idx}
              className="text-xs px-3.5 py-1.5 rounded-lg bg-[#FAF8F5] text-stone-800 border border-stone-200 font-medium"
            >
              ✓ {goal}
            </span>
          ))}
        </div>
      </section>

      {/* 3. Settings & Preferences */}
      <section className="editorial-card rounded-2xl p-7 sm:p-9 space-y-5">
        <div className="pb-3 border-b border-stone-200/80">
          <span className="editorial-kicker text-[10px] text-stone-500 block mb-0.5">
            Preferences & Controls
          </span>
          <h3 className="font-serif-editorial text-lg sm:text-xl font-bold text-stone-900 flex items-center gap-2">
            <Settings className="w-4 h-4 text-stone-700" />
            应用交互偏好与数据设置
          </h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-1 border-b border-stone-100">
            <div>
              <span className="text-xs font-semibold text-stone-900 block">实验音效反馈</span>
              <span className="text-[11px] text-stone-500">答对连击与完成提示音</span>
            </div>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                soundEnabled ? 'bg-stone-900' : 'bg-stone-200'
              }`}
            >
              <div
                className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${
                  soundEnabled ? 'left-5' : 'left-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-stone-100">
            <div>
              <span className="text-xs font-semibold text-stone-900 block">触觉震动反馈</span>
              <span className="text-[11px] text-stone-500">按钮轻触感与微交互响应</span>
            </div>
            <button
              onClick={() => setHapticEnabled(!hapticEnabled)}
              className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                hapticEnabled ? 'bg-stone-900' : 'bg-stone-200'
              }`}
            >
              <div
                className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${
                  hapticEnabled ? 'left-5' : 'left-1'
                }`}
              />
            </button>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-rose-700 block">重置学习进度</span>
              <span className="text-[11px] text-stone-500">清空本地经验值与成就记录</span>
            </div>
            <button
              onClick={() => setShowResetConfirm(true)}
              className="text-xs font-semibold px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors cursor-pointer"
            >
              重置数据
            </button>
          </div>
        </div>
      </section>

      {/* 4. Product Principles & Philosophy Banner */}
      <section className="editorial-card rounded-2xl p-6 sm:p-8 text-center space-y-2 bg-[#FAF8F5]/80">
        <span className="editorial-kicker text-[10px] text-stone-500 tracking-widest block">
          MindLabZ · 智心堂 刊印声明
        </span>
        <p className="text-xs text-stone-600 leading-relaxed max-w-md mx-auto">
          融合现代认知神经科学与行为心理学实验，非医疗诊断用途。旨在协助每位研习者照见大脑心智捷径，培植理智与反思力。
        </p>
      </section>

      {/* Goal Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm bg-white rounded-2xl p-7 shadow-2xl border border-stone-200 space-y-4">
            <h3 className="font-serif-editorial text-lg font-bold text-stone-900">定制你的认知训练目标</h3>
            <p className="text-xs text-stone-500">
              选择你最希望提升的大脑机能领域：
            </p>

            <div className="space-y-2">
              {GOAL_OPTIONS.map((g, idx) => {
                const isSelected = selectedGoals.includes(g);
                return (
                  <button
                    key={idx}
                    onClick={() => toggleGoal(g)}
                    className={`w-full text-left p-3 rounded-xl text-xs font-medium border transition-colors flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-stone-900 border-stone-900 text-white'
                        : 'bg-[#FAF8F5] border-stone-200 text-stone-800 hover:bg-stone-100'
                    }`}
                  >
                    <span>{g}</span>
                    {isSelected && <Check className="w-4 h-4 text-white" />}
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleSaveGoals}
              className="w-full py-3 chameleon-btn font-semibold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
            >
              保存训练目标
            </button>
          </div>
        </div>
      )}

      {/* Reset Confirmation Dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm bg-white rounded-2xl p-7 shadow-2xl border border-stone-200 space-y-4 text-center">
            <h3 className="font-serif-editorial text-base font-bold text-rose-700">确定要重置所有研习数据吗？</h3>
            <p className="text-xs text-stone-500">
              这将会恢复默认的等级、积分和掌握度数据。
            </p>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2.5 bg-stone-100 text-stone-700 font-semibold text-xs rounded-xl border border-stone-200 hover:bg-stone-200 cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={() => {
                  resetProgress();
                  setShowResetConfirm(false);
                }}
                className="flex-1 py-2.5 bg-rose-600 text-white font-semibold text-xs rounded-xl hover:bg-rose-700 cursor-pointer"
              >
                确认重置
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

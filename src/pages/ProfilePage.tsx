import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Flame, Star, Trophy, Bookmark, Settings, RotateCcw, Sparkles, Shield, Heart, HelpCircle, Check, Info, Cloud, LogIn, LogOut, CheckCircle2, Database, RefreshCw, ExternalLink, KeyRound, Users, UserPlus, Copy } from 'lucide-react';
import { doc, getDocFromServer } from 'firebase/firestore';
import { db, diagnoseFirebaseAuthError, AuthErrorDiagnostic } from '../firebase';
import firebaseConfig from '../../firebase-applet-config.json';
import { useApp } from '../context/AppContext';

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
    loginWithGoogle,
    loginWithGoogleRedirect,
    switchGoogleAccount,
    loginAsCustomUser,
    switchSavedAccount,
    logout,
    updateGoals,
    resetProgress,
    triggerConfetti,
  } = useApp();

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticEnabled, setHapticEnabled] = useState(true);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [selectedGoals, setSelectedGoals] = useState<string[]>(user.selectedGoals || []);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [authDiagnostic, setAuthDiagnostic] = useState<AuthErrorDiagnostic | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
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
    setAuthDiagnostic(null);
    setAuthLoading(true);
    try {
      await loginWithGoogle();
      triggerConfetti();
    } catch (err) {
      setAuthDiagnostic(diagnoseFirebaseAuthError(err));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleRedirectLogin = async () => {
    setAuthDiagnostic(null);
    setAuthLoading(true);
    try {
      await loginWithGoogleRedirect();
    } catch (err) {
      setAuthDiagnostic(diagnoseFirebaseAuthError(err));
      setAuthLoading(false);
    }
  };

  const handleSwitchGoogleAccount = async () => {
    setAuthDiagnostic(null);
    setAuthLoading(true);
    try {
      await switchGoogleAccount();
      triggerConfetti();
    } catch (err) {
      setAuthDiagnostic(diagnoseFirebaseAuthError(err));
    } finally {
      setAuthLoading(false);
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
    <div className="space-y-5 pb-6 animate-fadeIn">
      {/* 1. Profile Avatar & Hero Card */}
      <div className="art-hero-surface rounded-3xl p-6 text-center space-y-3.5 relative overflow-hidden">
        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#6C4CF1] to-[#A855F7] p-0.5 mx-auto shadow-[0_8px_24px_rgba(108,76,241,0.22)] relative">
          <div className="w-full h-full rounded-full overflow-hidden bg-white">
            <img
              src={user.avatar}
              alt={user.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
          {firebaseUser && (
            <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-[#10B981] border-2 border-white flex items-center justify-center shadow-xs" title="Firebase 云端已连接">
              <Check className="w-3.5 h-3.5 text-white stroke-[3px]" />
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-center gap-2">
            <h2 className="text-lg font-extrabold text-[#18181B]">{user.name}</h2>
            <span className="text-xs font-extrabold text-[#532CD8] font-numeric">
              Lv.{user.level}
            </span>
          </div>
          <p className="text-xs text-[#6C4CF1] font-semibold mt-0.5">{user.title}</p>
          {(firebaseUser?.email || activeAccountEmail) && (
            <p className="text-[11px] text-[#64748B] font-numeric mt-0.5">
              {firebaseUser?.email || activeAccountEmail}
            </p>
          )}
        </div>

        {/* Firebase Authentication & Multi-User Cloud Sync Bar (Bilingual FR / ZH) */}
        <div className="pt-2 space-y-3 text-left">
          {!authReady ? (
            <div className="text-xs text-[#64748B] py-2 text-center">
              Vérification de la connexion Firebase Cloud... (正在检测云端连接状态...)
            </div>
          ) : firebaseUser ? (
            <div className="bg-[#ECFDF5]/90 border border-[#A7F3D0] rounded-2xl p-3.5 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-[#059669] shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-[#065F46] block">
                      {isSyncing
                        ? 'Synchronisation Firestore en cours... (正在同步...)'
                        : 'Synchronisation Firebase Active · 云端实时同步已开启'}
                    </span>
                    <span className="text-[10px] text-[#059669] block">
                      Connecté : {firebaseUser.email || user.name} · UID: {firebaseUser.uid.slice(0, 8)}...
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleSwitchGoogleAccount}
                    disabled={authLoading}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white text-[#532CD8] hover:bg-[#F5F3FF] border border-[#A7F3D0] text-xs font-bold transition-colors btn-tactile whitespace-nowrap cursor-pointer"
                    title="Connecter un autre compte Google"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Autre compte Google</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white text-[#475569] hover:text-rose-600 border border-[#D1FAE5] text-xs font-bold transition-colors btn-tactile whitespace-nowrap cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Déconnexion</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#FAF9FF] border border-[#DDD6FE] rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#532CD8]">
                  <Cloud className="w-4 h-4 text-[#6C4CF1]" />
                  <span>Connexion Google Auth Multi-Utilisateurs · 连接云端</span>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#EDE9FE] text-[#6C4CF1]">
                  Multi-Comptes Actif
                </span>
              </div>
              <p className="text-[11px] text-[#64748B] leading-relaxed">
                Chaque utilisateur peut se connecter avec son propre compte Google (fenêtre de choix de compte activée) pour synchroniser son profil dans <strong>Cloud Firestore</strong>.
              </p>

              {/* Detailed Diagnostic Box if Google Auth Popup or Domain encounters an error */}
              {authDiagnostic && (
                <div className="p-3 rounded-xl bg-rose-50/90 border border-rose-200 space-y-2 text-[11px]">
                  <div className="font-extrabold text-rose-700 flex items-center justify-between">
                    <span>⚠️ {authDiagnostic.titleFr}</span>
                    <span className="font-mono text-[10px] opacity-80">{authDiagnostic.code}</span>
                  </div>
                  <p className="text-rose-600 leading-relaxed">{authDiagnostic.messageFr}</p>

                  {currentHostname && (
                    <div className="p-2 rounded-lg bg-white border border-rose-200 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[10px] text-[#64748B] block">
                          Domaine actuel à autoriser dans Firebase Console :
                        </span>
                        <code className="text-[11px] font-mono font-bold text-[#18181B] break-all">
                          {currentHostname}
                        </code>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyHostname}
                        className="px-2.5 py-1.5 rounded-lg bg-[#F5F3FF] hover:bg-[#EDE9FE] text-[#532CD8] font-bold text-[10px] flex items-center gap-1 shrink-0 cursor-pointer"
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
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-rose-200 text-rose-700 font-bold text-[10px] hover:bg-rose-100"
                    >
                      <span>Ouvrir Firebase Auth → Authorized Domains</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <button
                      type="button"
                      onClick={() => setShowAddUserForm(true)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#532CD8] text-white font-bold text-[10px] cursor-pointer"
                    >
                      <UserPlus className="w-3 h-3" />
                      <span>Connexion directe par Email/Nom</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  onClick={handleGoogleLogin}
                  disabled={authLoading}
                  className="w-full py-2.5 px-3 rounded-xl chameleon-btn text-xs font-bold flex items-center justify-center gap-2 transition-all btn-tactile cursor-pointer"
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
                  className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-[#F5F3FF] text-[#532CD8] border border-[#C4B5FD] text-xs font-bold flex items-center justify-center gap-2 transition-all btn-tactile cursor-pointer"
                  title="Utiliser la redirection complète si les pop-ups sont bloqués sur mobile"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Mode Redirection (Mobile / Sans Pop-up)</span>
                </button>
              </div>
            </div>
          )}

          {/* Multi-User Profile Switcher & Direct Account Login (Works for all users on any browser/domain) */}
          <div className="bg-white/95 border border-[#E6E2F5] rounded-2xl p-3.5 space-y-2.5 text-xs">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 font-extrabold text-[#18181B]">
                <Users className="w-4 h-4 text-[#6C4CF1]" />
                <span>Comptes Utilisateurs & Changement de Profil</span>
              </div>
              <button
                type="button"
                onClick={() => setShowAddUserForm((prev) => !prev)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#F5F3FF] hover:bg-[#EDE9FE] text-[#532CD8] font-bold text-[11px] transition-colors cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{showAddUserForm ? 'Fermer' : '+ Autre utilisateur'}</span>
              </button>
            </div>

            {showAddUserForm && (
              <form
                onSubmit={handleCustomUserSubmit}
                className="p-3 rounded-xl bg-[#FAF9FF] border border-[#DDD6FE] space-y-2.5 animate-fadeIn"
              >
                <div className="text-[11px] font-bold text-[#532CD8]">
                  Connecter un nouvel utilisateur (Profil dédié immédiat)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Nom ou Prénom (ex: Marie Laurent)"
                    className="px-3 py-2 rounded-xl bg-white border border-[#E6E2F5] text-xs text-[#18181B] focus:outline-none focus:border-[#6C4CF1]"
                  />
                  <input
                    type="email"
                    required
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    placeholder="Email Google (ex: marie@gmail.com)"
                    className="px-3 py-2 rounded-xl bg-white border border-[#E6E2F5] text-xs text-[#18181B] focus:outline-none focus:border-[#6C4CF1]"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 rounded-xl chameleon-btn text-xs font-bold cursor-pointer"
                >
                  Activer ce compte utilisateur
                </button>
              </form>
            )}

            {/* List of Saved Accounts for 1-Click Switching */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pt-0.5">
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
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-left shrink-0 transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-[#EDE9FE] border-[#6C4CF1] text-[#532CD8] font-bold shadow-2xs'
                        : 'bg-[#FAF9FF] border-[#E6E2F5] text-[#475569] hover:bg-[#F5F3FF]'
                    }`}
                  >
                    <img
                      src={acc.avatar}
                      alt={acc.name}
                      referrerPolicy="no-referrer"
                      className="w-6 h-6 rounded-full object-cover bg-white border border-white"
                    />
                    <div className="min-w-0">
                      <div className="text-[11px] truncate max-w-[110px] leading-tight">
                        {acc.name}
                      </div>
                      <div className="text-[9px] text-[#64748B] truncate max-w-[110px]">
                        {acc.email}
                      </div>
                    </div>
                    {isCurrent && <Check className="w-3.5 h-3.5 text-[#6C4CF1] shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Firebase & Firestore Diagnostic & Guide Card */}
          <div className="bg-white/95 border border-[#E6E2F5] rounded-2xl p-3.5 space-y-2.5 text-xs">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 font-extrabold text-[#18181B]">
                <Database className="w-4 h-4 text-[#6C4CF1]" />
                <span>Diagnostic Firebase & Firestore</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    dbPingStatus === 'online'
                      ? 'bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]'
                      : dbPingStatus === 'testing'
                      ? 'bg-[#FEF3C7] text-[#D97706]'
                      : 'bg-rose-50 text-rose-600'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      dbPingStatus === 'online'
                        ? 'bg-[#10B981]'
                        : dbPingStatus === 'testing'
                        ? 'bg-[#F59E0B] animate-ping'
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
                  className="p-1 rounded-lg bg-[#F5F3FF] hover:bg-[#EDE9FE] text-[#6C4CF1] transition-colors cursor-pointer"
                  title="Tester la liaison Firestore en direct"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${dbPingStatus === 'testing' ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] bg-[#FAF9FF] p-2.5 rounded-xl border border-[#EDE9FE]">
              <div>
                <span className="text-[#64748B] block text-[10px]">Projet Firebase (Project ID)</span>
                <span className="font-mono font-bold text-[#18181B]">{firebaseConfig.projectId}</span>
              </div>
              <div>
                <span className="text-[#64748B] block text-[10px]">Collection Utilisateur</span>
                <span className="font-mono font-bold text-[#532CD8]">
                  /users/{firebaseUser ? firebaseUser.uid.slice(0, 10) + '...' : '{userId}'}
                </span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-[#64748B] block text-[10px]">Base Firestore (Database ID)</span>
                <span className="font-mono font-semibold text-[#334155] break-all text-[10px]">
                  {firebaseConfig.firestoreDatabaseId}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowFirebaseGuide((v) => !v)}
                className="text-[11px] font-bold text-[#6C4CF1] hover:underline cursor-pointer"
              >
                {showFirebaseGuide ? 'Masquer le guide Firebase ▲' : 'Voir où et comment relier Firebase ▼'}
              </button>
              <a
                href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/firestore/databases/${firebaseConfig.firestoreDatabaseId}/data`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#532CD8] hover:underline"
              >
                <span>Ouvrir la Console Firebase</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {showFirebaseGuide && (
              <div className="pt-2 border-t border-[#EDE9FE] space-y-1.5 text-[11px] text-[#475569] leading-relaxed">
                <p className="font-bold text-[#18181B]">
                  Où et comment fonctionne la liaison Firebase dans MindLabZ :
                </p>
                <p>
                  <strong>1. Dans l’application (Onglet « 我的 / Profil » ou Avatar en haut à gauche) :</strong> Cliquez sur le bouton <em>« Se connecter avec Google (Firebase Auth) »</em> ci-dessus pour lier votre compte.
                </p>
                <p>
                  <strong>2. Fichier de configuration :</strong> <code className="bg-[#F1F5F9] px-1 rounded">/firebase-applet-config.json</code> contient les clés du projet <code className="bg-[#F1F5F9] px-1 rounded">{firebaseConfig.projectId}</code> et l’identifiant exact de la base Firestore.
                </p>
                <p>
                  <strong>3. Initialisation & Sécurité :</strong> <code className="bg-[#F1F5F9] px-1 rounded">src/firebase.ts</code> initialise Auth + Firestore, <code className="bg-[#F1F5F9] px-1 rounded">src/context/AppContext.tsx</code> synchronise automatiquement vos progrès en temps réel via <code className="bg-[#F1F5F9] px-1 rounded">onSnapshot</code> et <code className="bg-[#F1F5F9] px-1 rounded">setDoc</code>, et <code className="bg-[#F1F5F9] px-1 rounded">/firestore.rules</code> protège vos données.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Mini Stats Row */}
        <div className="grid grid-cols-3 gap-2.5 pt-3 border-t border-[#EDE9FE]">
          <div className="bg-white/90 p-3 rounded-2xl border border-[#EBE7F8]">
            <span className="text-[10px] text-[#64748B] font-medium block">连击打卡</span>
            <span className="text-sm font-extrabold text-[#D97706] font-numeric flex items-center justify-center gap-1 mt-0.5">
              <Flame className="w-3.5 h-3.5 fill-[#F59E0B] text-[#F59E0B]" />
              {user.streak} 天
            </span>
          </div>
          <div className="bg-white/90 p-3 rounded-2xl border border-[#EBE7F8]">
            <span className="text-[10px] text-[#64748B] font-medium block">总经验值</span>
            <span className="text-sm font-extrabold text-[#532CD8] font-numeric flex items-center justify-center gap-1 mt-0.5">
              <Star className="w-3.5 h-3.5 fill-[#6C4CF1] text-[#6C4CF1]" />
              {user.xp.toLocaleString()}
            </span>
          </div>
          <div className="bg-white/90 p-3 rounded-2xl border border-[#EBE7F8]">
            <span className="text-[10px] text-[#64748B] font-medium block">掌握定律</span>
            <span className="text-sm font-extrabold text-[#059669] font-numeric flex items-center justify-center gap-1 mt-0.5">
              <Trophy className="w-3.5 h-3.5 fill-[#10B981] text-[#10B981]" />
              {user.lawsMastered.length} 项
            </span>
          </div>
        </div>
      </div>

      {/* 2. Training Goals Section */}
      <div className="bg-white rounded-3xl p-5 border border-[#E6E2F5] shadow-[0_4px_20px_-2px_rgba(108,76,241,0.05)] space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-[#18181B] flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#6C4CF1]" />
            当前认知训练目标
          </h3>
          <button
            onClick={() => setShowGoalModal(true)}
            className="text-xs text-[#6C4CF1] font-bold hover:underline btn-press"
          >
            编辑目标
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {selectedGoals.map((goal, idx) => (
            <span
              key={idx}
              className="text-xs px-3 py-1 rounded-full bg-[#EDE9FE] text-[#6C4CF1] border border-[#DDD6FE] font-medium"
            >
              ✓ {goal}
            </span>
          ))}
        </div>
      </div>

      {/* 3. Settings & Preferences */}
      <div className="bg-white rounded-3xl p-5 border border-[#E6E2F5] shadow-[0_4px_20px_-2px_rgba(108,76,241,0.05)] space-y-4">
        <h3 className="text-xs font-bold text-[#18181B] flex items-center gap-1.5">
          <Settings className="w-4 h-4 text-[#64748B]" />
          应用设置与偏好
        </h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between py-1 border-b border-[#F5F3FF]">
            <div>
              <span className="text-xs font-semibold text-[#18181B] block">游戏音效反馈</span>
              <span className="text-[10px] text-[#64748B]">答对连击与结算提示音</span>
            </div>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                soundEnabled ? 'bg-[#6C4CF1]' : 'bg-[#E2E8F0]'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                  soundEnabled ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-[#F5F3FF]">
            <div>
              <span className="text-xs font-semibold text-[#18181B] block">触觉震动反馈</span>
              <span className="text-[10px] text-[#64748B]">按钮与错误轻触感</span>
            </div>
            <button
              onClick={() => setHapticEnabled(!hapticEnabled)}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                hapticEnabled ? 'bg-[#6C4CF1]' : 'bg-[#E2E8F0]'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                  hapticEnabled ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-rose-600 block">重置学习进度</span>
              <span className="text-[10px] text-[#64748B]">清空本地经验值与成就记录</span>
            </div>
            <button
              onClick={() => setShowResetConfirm(true)}
              className="text-xs font-bold px-3 py-1.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl hover:bg-rose-100 transition-colors btn-press"
            >
              重置数据
            </button>
          </div>
        </div>
      </div>

      {/* 4. Product Principles & Philosophy Banner */}
      <div className="bg-[#FAF9FF] rounded-3xl p-5 border border-[#E6E2F5] space-y-2 text-center">
        <span className="text-[11px] font-bold text-[#6C4CF1] flex items-center justify-center gap-1">
          <Info className="w-3.5 h-3.5" />
          MindLabZ · 智心堂 产品原则
        </span>
        <p className="text-[11px] text-[#64748B] leading-relaxed max-w-xs mx-auto">
          融合现代认知心理学与微交互游戏，非医疗诊断用途，旨在帮助每个人看清大脑思维捷径，拥抱更清醒的理性决策。
        </p>
      </div>

      {/* Goal Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-[#E6E2F5] space-y-4">
            <h3 className="text-base font-bold text-[#18181B]">定制你的认知训练目标</h3>
            <p className="text-xs text-[#64748B]">
              选择你最希望提升的大脑机能领域：
            </p>

            <div className="space-y-2">
              {GOAL_OPTIONS.map((g, idx) => {
                const isSelected = selectedGoals.includes(g);
                return (
                  <button
                    key={idx}
                    onClick={() => toggleGoal(g)}
                    className={`w-full text-left p-3 rounded-2xl text-xs font-semibold border transition-all flex items-center justify-between btn-press ${
                      isSelected
                        ? 'bg-[#EDE9FE] border-[#6C4CF1] text-[#6C4CF1]'
                        : 'bg-[#FAF9FF] border-[#E6E2F5] text-[#18181B]'
                    }`}
                  >
                    <span>{g}</span>
                    {isSelected && <Check className="w-4 h-4 text-[#6C4CF1]" />}
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleSaveGoals}
              className="w-full py-3 bg-[#6C4CF1] hover:bg-[#532CD8] text-white font-bold text-xs rounded-2xl shadow-xs transition-all btn-press"
            >
              保存训练目标
            </button>
          </div>
        </div>
      )}

      {/* Reset Confirmation Dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-[#E6E2F5] space-y-4 text-center">
            <h3 className="text-base font-bold text-rose-600">确定要重置所有学习数据吗？</h3>
            <p className="text-xs text-[#64748B]">
              这将会恢复默认的等级、积分和掌握度数据。
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2.5 bg-[#F5F3FF] text-[#64748B] font-bold text-xs rounded-2xl border border-[#E6E2F5] btn-press"
              >
                取消
              </button>
              <button
                onClick={() => {
                  resetProgress();
                  setShowResetConfirm(false);
                }}
                className="flex-1 py-2.5 bg-rose-600 text-white font-bold text-xs rounded-2xl btn-press shadow-xs"
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

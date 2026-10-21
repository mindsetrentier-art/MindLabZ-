import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Flame, Star, Trophy, Bookmark, Settings, RotateCcw, Sparkles, Shield, ShieldCheck, Heart, HelpCircle, Check, Info, Cloud, LogIn, LogOut, CheckCircle2, Database, RefreshCw, ExternalLink, KeyRound, Users, UserPlus, Copy, PenLine, ArrowRight, Lock, Unlock, Fingerprint, ScanFace } from 'lucide-react';
import { doc, getDocFromServer } from 'firebase/firestore';
import { db, diagnoseFirebaseAuthError, AuthErrorDiagnostic } from '../firebase';
import firebaseConfig from '../../firebase-applet-config.json';
import { useApp } from '../context/AppContext';
import { useBiometricLock } from '../context/BiometricLockContext';
import { OverlappingCardStack } from '../components/ui/OverlappingCardStack';
import { setupNetlifyBadgeRemover } from '../utils/netlifyBadgeRemover';

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

  // Biometric Lock Context & state
  const {
    isSupported: isBiometricSupported,
    isPlatformAvailable: isBiometricPlatformAvailable,
    biometricLabel,
    biometricIcon,
    isEnabled: isBiometricEnabled,
    isLocked: isBiometricLocked,
    hasCredential,
    hasFallbackPin,
    autoLockSetting,
    setAutoLockSetting,
    lockVault,
    unlockVault,
    unlockWithBiometrics,
    disableBiometricLock,
    updateFallbackPin,
    testBiometricPrompt,
    setShowSetupModal,
  } = useBiometricLock();

  const [testStatus, setTestStatus] = useState<{
    testing: boolean;
    message: string | null;
    success?: boolean;
  }>({ testing: false, message: null });
  const [showChangePinModal, setShowChangePinModal] = useState(false);
  const [showDisableConfirmModal, setShowDisableConfirmModal] = useState(false);
  const [disablePinInput, setDisablePinInput] = useState('');
  const [disablePinError, setDisablePinError] = useState<string | null>(null);

  const [oldPinInput, setOldPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmNewPinInput, setConfirmNewPinInput] = useState('');
  const [changePinError, setChangePinError] = useState<string | null>(null);
  const [changePinSuccess, setChangePinSuccess] = useState<string | null>(null);
  const [netlifyCleanSuccess, setNetlifyCleanSuccess] = useState<boolean>(false);

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

  const handleTestBiometrics = async () => {
    setTestStatus({ testing: true, message: null });
    const res = await testBiometricPrompt();
    setTestStatus({ testing: false, message: res.message, success: res.success });
    if (res.success) {
      triggerConfetti();
    }
  };

  const handleDisableConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setDisablePinError(null);
    const ok = await disableBiometricLock(disablePinInput);
    if (ok) {
      setShowDisableConfirmModal(false);
      setDisablePinInput('');
      setDisablePinError(null);
      triggerConfetti();
    } else {
      setDisablePinError('密码验证错误，无法停用隐私保护。');
    }
  };

  const handleChangePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangePinError(null);
    setChangePinSuccess(null);
    if (newPinInput.length < 4) {
      setChangePinError('新密码至少需要 4 位字符');
      return;
    }
    if (newPinInput !== confirmNewPinInput) {
      setChangePinError('两次输入的新密码不一致，请核对');
      return;
    }
    const ok = await updateFallbackPin(oldPinInput, newPinInput);
    if (ok) {
      setChangePinSuccess('备用安全密码已成功修改');
      triggerConfetti();
      setTimeout(() => {
        setShowChangePinModal(false);
        setOldPinInput('');
        setNewPinInput('');
        setConfirmNewPinInput('');
        setChangePinError(null);
        setChangePinSuccess(null);
      }, 1200);
    } else {
      setChangePinError('原安全密码验证失败，请重新输入');
    }
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

      {/* Biometric Privacy Vault & WebAuthn Section */}
      <section className="editorial-card rounded-2xl p-7 sm:p-9 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-stone-200/80">
          <div>
            <span className="editorial-kicker text-[10px] text-stone-500 block mb-0.5">
              W3C WEBAUTHN SPECIFICATION · 芯片级隐私安全隔区
            </span>
            <h3 className="font-serif-editorial text-lg sm:text-xl font-bold text-stone-900 flex items-center gap-2">
              {biometricIcon === 'faceid' ? (
                <ScanFace className="w-5 h-5 text-indigo-700" />
              ) : (
                <Fingerprint className="w-5 h-5 text-indigo-700" />
              )}
              <span>心智手记生物识别保险箱 ({biometricLabel})</span>
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {isBiometricEnabled ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                已开启实时防护
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-stone-100 text-stone-600 border border-stone-200">
                未启用保护
              </span>
            )}
          </div>
        </div>

        <p className="text-xs text-stone-600 leading-relaxed">
          采用现代 Web Authentication (WebAuthn) API 规范，将心理觉察与认知日记锁定于您本机的硬件芯片中。支持 Apple Face ID、Touch ID、Windows Hello 或指纹传感器验证，防止未经授权的翻阅。
        </p>

        {/* Status & Quick Diagnostic Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Card 1: Hardware Authenticator */}
          <div className="p-4 rounded-xl bg-[#FAF8F5] border border-stone-200/90 space-y-1.5">
            <div className="flex items-center justify-between text-stone-500 text-[10px] font-mono">
              <span>HARDWARE SENSOR</span>
              <ShieldCheck className={`w-3.5 h-3.5 ${isBiometricPlatformAvailable ? 'text-emerald-600' : 'text-stone-400'}`} />
            </div>
            <div className="font-serif-editorial font-bold text-sm text-stone-900">
              {isBiometricPlatformAvailable ? `支持 ${biometricLabel}` : '数字安全 PIN 码模式'}
            </div>
            <div className="text-[11px] text-stone-500">
              {isBiometricPlatformAvailable
                ? '检测到本机芯片安全隔区 (Secure Enclave / TPM)'
                : '设备未检测到平台生物传感器，使用加盐密码保护'}
            </div>
          </div>

          {/* Card 2: Vault Lock Status */}
          <div className="p-4 rounded-xl bg-[#FAF8F5] border border-stone-200/90 space-y-1.5">
            <div className="flex items-center justify-between text-stone-500 text-[10px] font-mono">
              <span>CURRENT STATUS</span>
              {isBiometricEnabled ? (
                isBiometricLocked ? (
                  <Lock className="w-3.5 h-3.5 text-amber-600" />
                ) : (
                  <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                )
              ) : (
                <Lock className="w-3.5 h-3.5 text-stone-400" />
              )}
            </div>
            <div className="font-serif-editorial font-bold text-sm text-stone-900">
              {isBiometricEnabled
                ? isBiometricLocked
                  ? '已处于锁定状态'
                  : '已解锁 (活动会话)'
                : '未锁定 (开放状态)'}
            </div>
            <div className="text-[11px] text-stone-500">
              {isBiometricEnabled
                ? isBiometricLocked
                  ? '需生物或 PIN 认证才能进入手记'
                  : '当前可正常查阅手记'
                : '所有心智手记处于公开浏览状态'}
            </div>
          </div>

          {/* Card 3: Credential Registry */}
          <div className="p-4 rounded-xl bg-[#FAF8F5] border border-stone-200/90 space-y-1.5">
            <div className="flex items-center justify-between text-stone-500 text-[10px] font-mono">
              <span>SECURITY CREDENTIAL</span>
              <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
            </div>
            <div className="font-serif-editorial font-bold text-sm text-stone-900">
              {hasCredential ? '硬件公钥已注册' : hasFallbackPin ? '仅 PIN 密码保护' : '未配置安全凭证'}
            </div>
            <div className="text-[11px] text-stone-500">
              {hasCredential
                ? '公钥验证在本地芯片完成'
                : '建议配置 WebAuthn 硬件公钥与备用 PIN'}
            </div>
          </div>
        </div>

        {/* Master Controls & Test Row */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="font-serif-editorial font-bold text-stone-900 text-sm">
                生物识别防护与保险箱控制
              </h4>
              <p className="text-xs text-stone-500">
                管理主开关、立即锁闭保险箱或测试本机生物识别响应
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {!isBiometricEnabled ? (
                <button
                  type="button"
                  onClick={() => setShowSetupModal(true)}
                  className="px-4 py-2 rounded-xl bg-stone-900 text-white hover:bg-stone-800 text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer btn-tactile"
                >
                  {biometricIcon === 'faceid' ? (
                    <ScanFace className="w-4 h-4 text-indigo-300" />
                  ) : (
                    <Fingerprint className="w-4 h-4 text-indigo-300" />
                  )}
                  <span>开启 {biometricLabel} 保护</span>
                </button>
              ) : (
                <>
                  {isBiometricLocked ? (
                    <button
                      type="button"
                      onClick={() => unlockWithBiometrics()}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer btn-tactile"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      <span>立即验证解锁</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => lockVault()}
                      className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer btn-tactile"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>立即锁定手记</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowChangePinModal(true)}
                    className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-stone-600" />
                    <span>修改 PIN 码</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowDisableConfirmModal(true)}
                    className="px-3 py-2 rounded-xl bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>停用保险箱</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Test Platform Authenticator Button */}
          <div className="pt-2 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-stone-800 block">
                硬件传感器连通性测试
              </span>
              <span className="text-[11px] text-stone-500 block">
                直接调用浏览器的 WebAuthn 平台认证弹窗，测试 {biometricLabel} 传感响应
              </span>
            </div>

            <button
              type="button"
              onClick={handleTestBiometrics}
              disabled={testStatus.testing}
              className="px-3.5 py-2 rounded-xl bg-[#FAF8F5] hover:bg-stone-200/80 border border-stone-300 text-stone-800 text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer shrink-0 disabled:opacity-50"
            >
              {testStatus.testing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-stone-600" />
              ) : biometricIcon === 'faceid' ? (
                <ScanFace className="w-3.5 h-3.5 text-indigo-600" />
              ) : (
                <Fingerprint className="w-3.5 h-3.5 text-indigo-600" />
              )}
              <span>{testStatus.testing ? '正在等待传感器...' : `测试 ${biometricLabel} 硬件响应`}</span>
            </button>
          </div>

          {/* Test Status Banner */}
          {testStatus.message && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 animate-fadeIn ${
                testStatus.success
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <ShieldCheck
                  className={`w-4 h-4 shrink-0 ${
                    testStatus.success ? 'text-emerald-600' : 'text-amber-600'
                  }`}
                />
                <span>{testStatus.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setTestStatus({ testing: false, message: null })}
                className="text-[11px] opacity-70 hover:opacity-100 underline cursor-pointer"
              >
                关闭
              </button>
            </div>
          )}
        </div>

        {/* Auto-Lock Settings Row */}
        {isBiometricEnabled && (
          <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF8F5] border border-stone-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-stone-900 block">
                  自动锁定策略 (Auto-Lock Strategy)
                </span>
                <span className="text-[11px] text-stone-500">
                  选择手记在切屏或闲置多久后自动上锁
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'always', label: '立即锁定', sub: '切出标签或切屏时' },
                { id: '5m', label: '5 分钟后', sub: '闲置无交互 5 分钟' },
                { id: '15m', label: '15 分钟后', sub: '闲置无交互 15 分钟' },
                { id: 'never', label: '仅手动锁定', sub: '不自动锁定' },
              ].map((opt) => {
                const isCurrent = autoLockSetting === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setAutoLockSetting(opt.id as any)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-stone-900 text-white border-stone-900 shadow-2xs font-semibold'
                        : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    <div className="text-xs">{opt.label}</div>
                    <div
                      className={`text-[10px] mt-0.5 ${
                        isCurrent ? 'text-stone-300' : 'text-stone-400'
                      }`}
                    >
                      {opt.sub}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Security & Zero-Knowledge Trust Note */}
        <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/70 flex items-start gap-3 text-xs text-stone-600">
          <Shield className="w-4 h-4 text-stone-500 shrink-0 mt-0.5" />
          <div className="leading-relaxed space-y-0.5">
            <span className="font-semibold text-stone-800 block">零知识加密设计 · 纯本地硬件验证</span>
            <p className="text-[11px] text-stone-500">
              根据 W3C Web Authentication 规范，生物特征（指纹、面容）始终严格留存于设备硬件安全芯片（Apple Secure Enclave / Android Titan / Windows TPM）内。MindLabZ 云端绝不接收或存储任何生物特征或明文 PIN。
            </p>
          </div>
        </div>
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

          <div className="flex items-center justify-between py-1 border-b border-stone-100">
            <div>
              <span className="text-xs font-semibold text-stone-900 block">清除 Netlify / 底部遮挡标识</span>
              <span className="text-[11px] text-stone-500">
                自动清除外部平台注入的 "POWERED BY Netlify" 浮层，确保底部导航无遮挡
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setupNetlifyBadgeRemover();
                setNetlifyCleanSuccess(true);
                triggerConfetti();
                setTimeout(() => setNetlifyCleanSuccess(false), 3000);
              }}
              className="text-xs font-semibold px-3 py-1.5 bg-[#FAF8F5] hover:bg-stone-200 text-stone-800 border border-stone-300 rounded-lg transition-colors cursor-pointer shrink-0"
            >
              {netlifyCleanSuccess ? '✓ 已深度清除' : '立即清除遮挡'}
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

      {/* Change Fallback PIN Modal */}
      {showChangePinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm bg-white rounded-2xl p-6 sm:p-7 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif-editorial text-base font-bold text-stone-900 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-stone-700" />
                修改备用安全 PIN 码
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowChangePinModal(false);
                  setChangePinError(null);
                  setChangePinSuccess(null);
                }}
                className="text-stone-400 hover:text-stone-700 text-xs cursor-pointer"
              >
                取消
              </button>
            </div>

            <p className="text-xs text-stone-500 leading-relaxed">
              备用密码用于在生物识别无法响应时解锁心智手记。
            </p>

            <form onSubmit={handleChangePinSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] font-medium text-stone-600 block mb-1">
                  当前原安全密码
                </label>
                <input
                  type="password"
                  required
                  value={oldPinInput}
                  onChange={(e) => setOldPinInput(e.target.value)}
                  placeholder="输入当前使用的 PIN 码"
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-900 focus:outline-none focus:border-stone-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-stone-600 block mb-1">
                  新安全密码 (至少 4 位)
                </label>
                <input
                  type="password"
                  required
                  value={newPinInput}
                  onChange={(e) => setNewPinInput(e.target.value)}
                  placeholder="输入新的安全 PIN 码"
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-900 focus:outline-none focus:border-stone-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-stone-600 block mb-1">
                  再次确认新密码
                </label>
                <input
                  type="password"
                  required
                  value={confirmNewPinInput}
                  onChange={(e) => setConfirmNewPinInput(e.target.value)}
                  placeholder="再次输入新 PIN 码"
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-900 focus:outline-none focus:border-stone-500"
                />
              </div>

              {changePinError && (
                <div className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                  {changePinError}
                </div>
              )}

              {changePinSuccess && (
                <div className="text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  <span>{changePinSuccess}</span>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowChangePinModal(false)}
                  className="flex-1 py-2.5 bg-stone-100 text-stone-700 font-semibold text-xs rounded-xl border border-stone-200 hover:bg-stone-200 cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 chameleon-btn text-xs font-semibold rounded-xl cursor-pointer"
                >
                  确认保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Disable Vault Confirmation Dialog */}
      {showDisableConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm bg-white rounded-2xl p-6 sm:p-7 shadow-2xl border border-stone-200 space-y-4">
            <h3 className="font-serif-editorial text-base font-bold text-rose-700 flex items-center gap-2">
              <Lock className="w-4 h-4 text-rose-600" />
              停用心智手记生物识别保险箱
            </h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              停用后，所有心智手记将无需 {biometricLabel} 或 PIN 即可直接查阅。请输入安全密码确认操作：
            </p>

            <form onSubmit={handleDisableConfirm} className="space-y-3">
              <input
                type="password"
                required
                autoFocus
                value={disablePinInput}
                onChange={(e) => setDisablePinInput(e.target.value)}
                placeholder="输入当前安全密码"
                className="w-full px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-900 focus:outline-none focus:border-stone-500"
              />

              {disablePinError && (
                <div className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                  {disablePinError}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowDisableConfirmModal(false);
                    setDisablePinInput('');
                    setDisablePinError(null);
                  }}
                  className="flex-1 py-2.5 bg-stone-100 text-stone-700 font-semibold text-xs rounded-xl border border-stone-200 hover:bg-stone-200 cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl cursor-pointer"
                >
                  确认解除
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

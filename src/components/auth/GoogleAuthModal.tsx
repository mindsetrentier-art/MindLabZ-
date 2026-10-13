import React, { useState, useEffect } from 'react';
import {
  X,
  Cloud,
  Check,
  AlertTriangle,
  Copy,
  ExternalLink,
  Smartphone,
  Laptop,
  RefreshCw,
  LogOut,
  UserPlus,
  Users,
  ShieldCheck,
  Zap,
  ArrowRight,
  Download,
  Upload,
  Info,
} from 'lucide-react';
import { useApp, LocalUserAccount } from '../../context/AppContext';
import {
  getCurrentHostname,
  isMobileBrowser,
  isInAppBrowser,
  isInIframe,
  checkConnectivityDiagnostic,
  ConnectivityDiagnostic,
} from '../../firebase';
import firebaseConfig from '../../../firebase-applet-config.json';

export const GoogleAuthModal: React.FC = () => {
  const {
    user,
    firebaseUser,
    activeAccountEmail,
    savedAccounts,
    authModalOpen,
    closeAuthModal,
    authDiagnostic,
    setAuthDiagnostic,
    authLoading,
    authToastMessage,
    setAuthToastMessage,
    loginWithGoogle,
    loginWithGoogleRedirect,
    loginAsGuestCloud,
    loginAsCustomUser,
    switchSavedAccount,
    exportProfileDataJson,
    importProfileDataJson,
    logout,
    isSyncing,
  } = useApp();

  const [copiedDomain, setCopiedDomain] = useState(false);
  const [copiedExport, setCopiedExport] = useState(false);
  const [showImportBox, setShowImportBox] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [showCustomUserForm, setShowCustomUserForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [activeTab, setActiveTab] = useState<'google' | 'diagnostic' | 'transfer' | 'switch'>('google');
  const [connectivity, setConnectivity] = useState<ConnectivityDiagnostic | null>(null);
  const [isCheckingPing, setIsCheckingPing] = useState(false);

  const hostname = getCurrentHostname();
  const isMobile = isMobileBrowser();
  const inAppBrowser = isInAppBrowser();
  const inIframe = isInIframe();

  const runConnectivityCheck = async () => {
    setIsCheckingPing(true);
    try {
      const diag = await checkConnectivityDiagnostic();
      setConnectivity(diag);
    } catch (e) {
      console.warn('Ping check notice:', e);
    } finally {
      setIsCheckingPing(false);
    }
  };

  useEffect(() => {
    if (authModalOpen) {
      void runConnectivityCheck();
    }
  }, [authModalOpen]);

  if (!authModalOpen) return null;

  const handleCopyHostname = () => {
    if (!hostname) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(hostname).then(() => {
          setCopiedDomain(true);
          setTimeout(() => setCopiedDomain(false), 2500);
        });
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = hostname;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setCopiedDomain(true);
        setTimeout(() => setCopiedDomain(false), 2500);
      }
    } catch {
      // fallback
    }
  };

  const handleExportData = () => {
    const jsonStr = exportProfileDataJson();
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(jsonStr).then(() => {
          setCopiedExport(true);
          setTimeout(() => setCopiedExport(false), 2500);
        });
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = jsonStr;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setCopiedExport(true);
        setTimeout(() => setCopiedExport(false), 2500);
      }
    } catch {
      // ignore
    }
  };

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importJsonText.trim()) return;
    const ok = importProfileDataJson(importJsonText);
    if (ok) {
      setImportJsonText('');
      setShowImportBox(false);
    }
  };

  const handleCustomUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim() && !customEmail.trim()) return;
    loginAsCustomUser(customName, customEmail);
    setCustomName('');
    setCustomEmail('');
    setShowCustomUserForm(false);
  };

  const handleDirectPopupLogin = async () => {
    try {
      await loginWithGoogle('popup');
    } catch {
      // Diagnostic set by AppContext
    }
  };

  const handleDirectRedirectLogin = async () => {
    try {
      await loginWithGoogleRedirect();
    } catch {
      // Diagnostic set by AppContext
    }
  };

  const handleGuestCloudLogin = async () => {
    try {
      await loginAsGuestCloud();
    } catch {
      // Diagnostic set by AppContext
    }
  };

  const isCurrentDomainAuthorized =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.endsWith('.firebaseapp.com') ||
    hostname.endsWith('.web.app');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-stone-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#FCFBF9] border border-stone-200 rounded-2xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-scaleUp">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-stone-200/80 flex items-start justify-between gap-4 bg-white">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="editorial-kicker text-[10px] tracking-widest text-stone-600">
                FIREBASE & GOOGLE AUTHENTICATION
              </span>
              <span className="text-stone-300">|</span>
              <span className="text-[10px] font-mono text-stone-500">v1.2</span>
            </div>
            <h2 className="font-serif-editorial text-xl sm:text-2xl font-bold text-stone-900 leading-tight">
              Connexion Cloud & Multi-Appareils
            </h2>
            <p className="text-xs text-stone-600">
              Synchronisez vos données d'apprentissage sur tous vos téléphones, tablettes et ordinateurs.
            </p>
          </div>
          <button
            onClick={closeAuthModal}
            className="w-8 h-8 rounded-full border border-stone-200 hover:border-stone-400 bg-stone-50 hover:bg-stone-100 flex items-center justify-center text-stone-600 hover:text-stone-900 transition-colors shrink-0 cursor-pointer"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Pills & Tabs */}
        <div className="px-5 sm:px-6 pt-3 pb-2 bg-[#F9F7F4] border-b border-stone-200/60 flex flex-wrap items-center justify-between gap-2">
          {/* Current Auth Status Badge */}
          <div className="flex items-center gap-2">
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                firebaseUser
                  ? isSyncing
                    ? 'bg-amber-500 animate-pulse'
                    : 'bg-emerald-600'
                  : 'bg-stone-400'
              }`}
            />
            <span className="text-xs font-semibold text-stone-800">
              {firebaseUser
                ? firebaseUser.isAnonymous
                  ? 'Session Cloud Invité Active'
                  : `Connecté : ${firebaseUser.email || user.name}`
                : activeAccountEmail
                ? `Profil Local : ${activeAccountEmail}`
                : 'Mode Local Hors-ligne'}
            </span>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('google')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'google'
                  ? 'bg-stone-900 text-white'
                  : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200/80'
              }`}
            >
              Connexion
            </button>
            <button
              onClick={() => setActiveTab('diagnostic')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                activeTab === 'diagnostic'
                  ? 'bg-stone-900 text-white'
                  : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200/80'
              }`}
            >
              Diagnostic
              {authDiagnostic && <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />}
            </button>
            <button
              onClick={() => setActiveTab('transfer')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'transfer'
                  ? 'bg-stone-900 text-white'
                  : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200/80'
              }`}
            >
              Transfert
            </button>
            <button
              onClick={() => setActiveTab('switch')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'switch'
                  ? 'bg-stone-900 text-white'
                  : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200/80'
              }`}
            >
              Profils
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-left">
          {/* Global Toast / Feedback */}
          {authToastMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between gap-2 animate-fadeIn">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{authToastMessage}</span>
              </div>
              <button
                onClick={() => setAuthToastMessage(null)}
                className="text-emerald-700 hover:text-emerald-900 text-xs cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {/* Warning banner: In-App Browser (Instagram, WhatsApp, TikTok...) */}
          {inAppBrowser && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 space-y-1.5 text-xs text-amber-900">
              <div className="font-semibold flex items-center gap-1.5 text-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Navigateur intégré détecté (In-App Browser)</span>
              </div>
              <p className="leading-relaxed">
                Google bloque la connexion OAuth dans les navigateurs intégrés (Instagram, WhatsApp, Facebook, LinkedIn...).
              </p>
              <div className="font-medium text-amber-800 pt-0.5">
                👉 Touchez le menu de l'application (les 3 points <strong>⋮</strong> ou <strong>⋯</strong>) et choisissez <strong>« Ouvrir dans Safari »</strong> ou <strong>« Ouvrir dans Chrome »</strong>.
              </div>
            </div>
          )}

          {/* Notice banner: If inside iframe */}
          {inIframe && (
            <div className="p-3 rounded-xl bg-stone-100 border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-stone-700">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-stone-600 shrink-0" />
                <span>Application ouverte dans un cadre intégré (iframe).</span>
              </div>
              <a
                href={window.location.href}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded-lg bg-stone-900 text-white font-medium text-xs flex items-center gap-1 shrink-0 justify-center hover:bg-stone-800 transition-colors"
              >
                <span>Ouvrir en plein écran</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {/* TAB 1: GOOGLE AUTH */}
          {activeTab === 'google' && (
            <div className="space-y-4">
              {/* Connected State Actions */}
              {firebaseUser ? (
                <div className="p-4 rounded-xl bg-white border border-stone-200 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full border border-stone-300 p-0.5 overflow-hidden bg-stone-100 shrink-0">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover rounded-full"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-stone-900 truncate">
                        {user.name}
                      </div>
                      <div className="text-[11px] text-stone-500 font-mono truncate">
                        {firebaseUser.email || `Session Cloud (${firebaseUser.uid.slice(0, 10)}...)`}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-semibold shrink-0">
                      <ShieldCheck className="w-3 h-3 text-emerald-700" />
                      <span>Cloud Actif</span>
                    </div>
                  </div>

                  <p className="text-xs text-stone-600 leading-relaxed border-t border-stone-100 pt-2.5">
                    Vos scores, progression dans les 100 lois, tests cognitifs et entrées du Journal Réflexif sont synchronisés en temps réel dans votre base Firestore.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={handleDirectPopupLogin}
                      disabled={authLoading}
                      className="py-2.5 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Changer de compte Google</span>
                    </button>
                    <button
                      onClick={logout}
                      className="py-2.5 px-3 rounded-xl bg-white hover:bg-rose-50 text-stone-600 hover:text-rose-700 border border-stone-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Se déconnecter</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Non-Connected State: 2 Google Options + 1 Instant Cloud Option */
                <div className="space-y-4">
                  <div className="bg-white border border-stone-200 rounded-xl p-4 sm:p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-900">
                        1. Connexion avec votre compte Google
                      </span>
                      {isMobile ? (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 flex items-center gap-1">
                          <Smartphone className="w-3 h-3" />
                          <span>Mobile détecté</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 flex items-center gap-1">
                          <Laptop className="w-3 h-3" />
                          <span>Ordinateur</span>
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-stone-600 leading-relaxed">
                      Sélectionnez le mode adapté à votre appareil. Sur téléphone, le mode redirection évite le blocage des pop-ups de Safari ou Chrome.
                    </p>

                    <div className="space-y-2.5 pt-1">
                      {/* Mobile-recommended mode */}
                      <button
                        onClick={handleDirectRedirectLogin}
                        disabled={authLoading}
                        className={`w-full py-3 px-4 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                          isMobile
                            ? 'chameleon-btn'
                            : 'bg-white hover:bg-stone-50 border border-stone-300 text-stone-900'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Smartphone className="w-4 h-4 shrink-0" />
                          <div className="text-left">
                            <div className="font-bold">Mode Redirection (Sans Pop-up)</div>
                            <div className="text-[10px] opacity-80">
                              Navigue directement vers Google puis revient sur MindLabZ
                            </div>
                          </div>
                        </div>
                        {isMobile && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/20 uppercase tracking-wider shrink-0">
                            Conseillé
                          </span>
                        )}
                      </button>

                      {/* Desktop-friendly popup mode */}
                      <button
                        onClick={handleDirectPopupLogin}
                        disabled={authLoading}
                        className={`w-full py-3 px-4 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                          !isMobile
                            ? 'chameleon-btn'
                            : 'bg-white hover:bg-stone-50 border border-stone-200 text-stone-900'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Laptop className="w-4 h-4 shrink-0" />
                          <div className="text-left">
                            <div className="font-bold">Mode Fenêtre Pop-up (Sélection de compte)</div>
                            <div className="text-[10px] opacity-80">
                              Ouvre une boîte de dialogue pour choisir votre compte
                            </div>
                          </div>
                        </div>
                        {!isMobile && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/20 uppercase tracking-wider shrink-0">
                            Conseillé
                          </span>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Immediate Cloud Session Fallback (Zero Domain-Blocked Guarantee) */}
                  <div className="bg-[#FAF8F5] border border-amber-200/80 rounded-xl p-4 sm:p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-950">
                        <Zap className="w-4 h-4 text-amber-700" />
                        <span>2. Synchronisation Cloud Immédiate (Sans attente)</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                        Anti-Blocage
                      </span>
                    </div>

                    <p className="text-xs text-stone-600 leading-relaxed">
                      Si vous utilisez un nouveau téléphone ou un site externe dont le domaine n'est pas encore whitelisté dans Firebase Auth, activez une session cloud instantanée. Vos données seront sauvegardées sur Firestore sans blocage.
                    </p>

                    <button
                      onClick={handleGuestCloudLogin}
                      disabled={authLoading}
                      className="w-full py-2.5 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <Cloud className="w-4 h-4" />
                      <span>Activer la session Cloud Firestore immédiate</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DIAGNOSTIC & DOMAIN CONFIGURATION */}
          {activeTab === 'diagnostic' && (
            <div className="space-y-4">
              {/* Detailed error banner if diagnostic exists */}
              {authDiagnostic ? (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-rose-900">⚠️ {authDiagnostic.titleFr}</span>
                    <span className="font-mono text-[10px] bg-white px-2 py-0.5 rounded border border-rose-200 text-rose-800">
                      {authDiagnostic.code}
                    </span>
                  </div>
                  <p className="text-rose-800 leading-relaxed">{authDiagnostic.messageFr}</p>
                  <div className="text-rose-900 font-semibold pt-1">
                    Solution recommandée : {authDiagnostic.recommendedActionFr}
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Aucune erreur active enregistrée. La pile Firebase fonctionne normalement.</span>
                </div>
              )}

              {/* Current Domain Box & Firebase Console Quick Link */}
              <div className="bg-white border border-stone-200 rounded-xl p-4 sm:p-5 space-y-3 text-xs">
                <div className="font-bold text-stone-900 flex items-center justify-between">
                  <span>Configuration du Domaine dans Firebase Console</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                      isCurrentDomainAuthorized
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {isCurrentDomainAuthorized ? 'Domaine Standard' : 'Domaine à vérifier'}
                  </span>
                </div>

                <p className="text-stone-600 leading-relaxed">
                  Pour que Google Authentification autorise la connexion depuis un autre téléphone ou un autre site, ce nom de domaine doit figurer dans la liste des <strong>Authorized domains</strong> de votre projet Firebase.
                </p>

                {/* Hostname display with copy button */}
                <div className="p-3 rounded-lg bg-[#FAF8F5] border border-stone-200 flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] text-stone-500 block">Nom de domaine actuel :</span>
                    <code className="text-xs font-mono font-bold text-stone-900 break-all select-all">
                      {hostname || 'window.location.hostname'}
                    </code>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyHostname}
                    className="px-3 py-1.5 rounded-lg bg-white border border-stone-300 hover:bg-stone-50 text-stone-800 font-medium text-xs flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedDomain ? 'Copié !' : 'Copier'}</span>
                  </button>
                </div>

                {/* Step-by-Step Instructions */}
                <div className="space-y-1.5 pt-1 text-[11px] text-stone-600">
                  <div className="font-semibold text-stone-800 text-xs">Étapes pour autoriser :</div>
                  <ol className="list-decimal list-inside space-y-1 pl-1">
                    <li>Cliquez sur le bouton ci-dessous pour ouvrir les réglages Firebase Authentication.</li>
                    <li>
                      Dans la section <strong>Authorized domains</strong>, cliquez sur <strong>Add domain</strong>.
                    </li>
                    <li>
                      Collez le domaine copié (<code className="font-mono font-bold">{hostname}</code>) et validez.
                    </li>
                  </ol>
                </div>

                <a
                  href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/settings`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <span>Ouvrir Firebase Console → Paramètres d'authentification</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Real-time Connectivity Ping Card */}
              <div className="bg-white border border-stone-200 rounded-xl p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-900">Vérification de connectivité serveur</span>
                  <button
                    onClick={runConnectivityCheck}
                    disabled={isCheckingPing}
                    className="flex items-center gap-1 text-[11px] text-stone-600 hover:text-stone-900 cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${isCheckingPing ? 'animate-spin' : ''}`} />
                    <span>Tester à nouveau</span>
                  </button>
                </div>

                {connectivity && (
                  <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                    <div className="p-2 rounded bg-stone-50 border border-stone-200/80">
                      <span className="text-stone-500 block text-[10px]">Serveur Firestore</span>
                      <span className="font-bold text-emerald-800">
                        {connectivity.firestoreStatus === 'online'
                          ? `En ligne (${connectivity.firestorePingMs} ms)`
                          : 'Hors ligne'}
                      </span>
                    </div>
                    <div className="p-2 rounded bg-stone-50 border border-stone-200/80">
                      <span className="text-stone-500 block text-[10px]">Projet Firebase</span>
                      <span className="font-bold text-stone-800 truncate block">
                        {connectivity.projectId}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: DATA TRANSFER & CROSS-DEVICE EXPORT/IMPORT */}
          {activeTab === 'transfer' && (
            <div className="space-y-4">
              <div className="bg-white border border-stone-200 rounded-xl p-4 sm:p-5 space-y-3 text-xs">
                <div className="font-bold text-stone-900 flex items-center gap-2">
                  <Download className="w-4 h-4 text-stone-700" />
                  <span>Transférer votre progression vers un autre téléphone ou site</span>
                </div>

                <p className="text-stone-600 leading-relaxed">
                  Vous pouvez copier l'instantané de votre profil (XP, niveau, 100 lois maîtrisées, badges et entrées du Journal) pour l'importer instantanément sur un autre appareil sans passer par Google Auth.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={handleExportData}
                    className="py-2.5 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedExport ? 'Données copiées !' : 'Copier mes données (JSON)'}</span>
                  </button>

                  <button
                    onClick={() => setShowImportBox((prev) => !prev)}
                    className="py-2.5 px-3 rounded-xl bg-white hover:bg-stone-50 border border-stone-300 text-stone-800 font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{showImportBox ? 'Masquer l’importation' : 'Importer sur cet appareil'}</span>
                  </button>
                </div>

                {showImportBox && (
                  <form onSubmit={handleImportSubmit} className="space-y-2 pt-2 animate-fadeIn">
                    <label className="text-[11px] font-semibold text-stone-700 block">
                      Collez ci-dessous le texte JSON exporté depuis votre autre appareil :
                    </label>
                    <textarea
                      rows={4}
                      value={importJsonText}
                      onChange={(e) => setImportJsonText(e.target.value)}
                      placeholder='{"mindlabzVersion": "1.0", "user": { ... }, ...}'
                      className="w-full p-2.5 rounded-lg bg-stone-50 border border-stone-300 font-mono text-[10px] text-stone-900 focus:outline-none focus:border-stone-500"
                    />
                    <button
                      type="submit"
                      className="w-full py-2 rounded-lg chameleon-btn text-xs font-semibold cursor-pointer"
                    >
                      Valider et restaurer la progression
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: MULTI-PROFILE & LOCAL SWITCHER */}
          {activeTab === 'switch' && (
            <div className="space-y-4 text-xs">
              <div className="bg-white border border-stone-200 rounded-xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-900">
                    Comptes & Profils enregistrés sur cet appareil
                  </span>
                  <button
                    onClick={() => setShowCustomUserForm((prev) => !prev)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 font-medium text-xs cursor-pointer transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{showCustomUserForm ? 'Annuler' : '+ Nouveau profil'}</span>
                  </button>
                </div>

                {showCustomUserForm && (
                  <form
                    onSubmit={handleCustomUserSubmit}
                    className="p-3.5 rounded-xl bg-[#FAF8F5] border border-stone-200 space-y-2.5 animate-fadeIn"
                  >
                    <div className="text-xs font-semibold text-stone-800">
                      Créer ou activer un profil utilisateur local immédiat
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        required
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        placeholder="Nom ou Prénom (ex: Sarah Thomas)"
                        className="px-3 py-2 rounded-lg bg-white border border-stone-300 text-xs text-stone-900 focus:outline-none focus:border-stone-500"
                      />
                      <input
                        type="email"
                        required
                        value={customEmail}
                        onChange={(e) => setCustomEmail(e.target.value)}
                        placeholder="Adresse email (ex: sarah@mindlabz.app)"
                        className="px-3 py-2 rounded-lg bg-white border border-stone-300 text-xs text-stone-900 focus:outline-none focus:border-stone-500"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2 rounded-lg chameleon-btn text-xs font-semibold cursor-pointer"
                    >
                      Enregistrer et basculer sur ce compte
                    </button>
                  </form>
                )}

                <div className="space-y-2 pt-1">
                  {savedAccounts.map((account) => {
                    const isCurrent =
                      (firebaseUser?.email && firebaseUser.email.toLowerCase() === account.email.toLowerCase()) ||
                      (activeAccountEmail && activeAccountEmail.toLowerCase() === account.email.toLowerCase());

                    return (
                      <div
                        key={account.id}
                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                          isCurrent
                            ? 'bg-stone-50 border-stone-400'
                            : 'bg-white border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={account.avatar}
                            alt={account.name}
                            className="w-8 h-8 rounded-full object-cover border border-stone-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="font-semibold text-stone-900 truncate">
                              {account.name}
                            </div>
                            <div className="text-[10px] text-stone-500 font-mono truncate">
                              {account.email}
                            </div>
                          </div>
                        </div>

                        {isCurrent ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-semibold shrink-0">
                            Actif
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => switchSavedAccount(account)}
                            className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-medium cursor-pointer transition-colors shrink-0"
                          >
                            Activer
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-stone-200/80 bg-white flex items-center justify-between gap-3">
          <div className="text-[11px] text-stone-500 font-numeric">
            ID Base Firestore : <code className="font-mono">{firebaseConfig.firestoreDatabaseId.slice(0, 18)}...</code>
          </div>
          <button
            onClick={closeAuthModal}
            className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

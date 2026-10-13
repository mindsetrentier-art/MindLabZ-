import React, { useState, useEffect } from 'react';
import {
  X,
  Smartphone,
  Download,
  Share2,
  PlusSquare,
  Check,
  Sparkles,
  ExternalLink,
  Laptop,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface PwaInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PwaInstallModal: React.FC<PwaInstallModalProps> = ({ isOpen, onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    // Detect platform
    const ua = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(ua);
    const androidDevice = /android/.test(ua);
    setIsIOS(iosDevice);
    setIsAndroid(androidDevice);

    // Check if already in standalone mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    if (isStandalone) {
      setIsInstalled(true);
    }

    // Listen to Chromium install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
        onClose();
      }
      setDeferredPrompt(null);
    }
  };

  const handleCopyAppUrl = () => {
    navigator.clipboard.writeText(window.location.href).catch(() => {});
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-stone-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#FCFBF9] border border-stone-200 rounded-2xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-scaleUp text-left">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-stone-200/80 flex items-start justify-between gap-4 bg-white">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="editorial-kicker text-[10px] tracking-widest text-stone-600">
                INSTALLATION ÉCRAN D'ACCUEIL & BUREAU
              </span>
              <span className="text-stone-300">|</span>
              <span className="text-[10px] font-mono text-stone-500">Android & iOS</span>
            </div>
            <h2 className="font-serif-editorial text-xl sm:text-2xl font-bold text-stone-900 leading-tight">
              Icône de l'Application MindLabZ
            </h2>
            <p className="text-xs text-stone-600">
              Affichez l'emblème doré minimaliste et élégant directement sur l'écran d'accueil de votre téléphone ou de votre ordinateur.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-stone-200 hover:border-stone-400 bg-stone-50 hover:bg-stone-100 flex items-center justify-center text-stone-600 hover:text-stone-900 transition-colors shrink-0 cursor-pointer"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Icon Showcase Card (Phone Homescreen Preview) */}
          <div className="p-5 rounded-2xl bg-gradient-to-b from-[#1C1917] to-[#292524] text-white shadow-lg flex flex-col sm:flex-row items-center gap-5 border border-stone-800">
            <div className="relative group shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl p-1 bg-gradient-to-tr from-amber-500/40 via-stone-400/20 to-amber-200/40 shadow-xl border border-amber-400/30 overflow-hidden">
                <img
                  src="/app-icon.png"
                  alt="Icône MindLabZ"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover rounded-xl shadow-inner transition-transform group-hover:scale-105"
                />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-500 border-2 border-stone-900 flex items-center justify-center shadow-md">
                <Sparkles className="w-3 h-3 text-stone-900" />
              </div>
            </div>

            <div className="space-y-1.5 text-center sm:text-left flex-1 min-w-0">
              <div className="text-[11px] font-mono uppercase tracking-wider text-amber-400/90 font-medium">
                Design Minimaliste & Sophistiqué
              </div>
              <h3 className="font-serif-editorial text-lg font-bold text-white leading-tight">
                MindLabZ · 智心堂
              </h3>
              <p className="text-xs text-stone-300 leading-relaxed">
                Emblème doré haute couture représentant l'architecture neuronale et la clarté d'esprit, certifié pour écrans Retina et OLED.
              </p>
              <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <a
                  href="/app-icon.png"
                  download="MindLabZ-Icon.png"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-[11px] font-medium border border-stone-700 transition-colors"
                >
                  <Download className="w-3 h-3" />
                  <span>Télécharger en HD (1024px)</span>
                </a>
              </div>
            </div>
          </div>

          {/* Already installed banner */}
          {isInstalled && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>
                L'application est déjà lancée en mode autonome (sur votre bureau ou écran d'accueil).
              </span>
            </div>
          )}

          {/* Direct 1-Click Install Button (Chromium / Android) */}
          {deferredPrompt && (
            <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 space-y-2">
              <div className="font-bold text-xs text-amber-950 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-amber-700" />
                <span>Installation automatique en 1 clic disponible</span>
              </div>
              <p className="text-xs text-amber-900 leading-relaxed">
                Votre navigateur supporte l'installation immédiate de l'icône sur votre écran d'accueil.
              </p>
              <button
                onClick={handleInstallClick}
                className="w-full py-2.5 px-4 rounded-xl chameleon-btn text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-transform active:scale-95"
              >
                <span>Installer MindLabZ sur l'écran d'accueil</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* iOS Safari Guide (iPhone & iPad) */}
          <div className="bg-white border border-stone-200 rounded-xl p-4 sm:p-5 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-stone-900 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-stone-700" />
                <span>Guide pour iPhone & iPad (Safari iOS)</span>
              </span>
              {isIOS && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-stone-100 text-stone-800">
                  Votre appareil
                </span>
              )}
            </div>

            <p className="text-stone-600 leading-relaxed">
              Sur iOS, Apple permet d'épingler l'application avec son icône dorée haute fidélité en 3 gestes simples :
            </p>

            <div className="space-y-2.5 pt-1 font-sans">
              <div className="flex items-start gap-3 p-2.5 rounded-lg bg-[#FAF8F5] border border-stone-200/70">
                <div className="w-6 h-6 rounded-full bg-stone-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  1
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-stone-900">
                    Touchez l'icône de Partage dans Safari
                  </div>
                  <div className="text-stone-500 text-[11px]">
                    Située dans la barre du bas sur iPhone (un carré avec une flèche vers le haut <Share2 className="w-3 h-3 inline text-stone-700" />).
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-lg bg-[#FAF8F5] border border-stone-200/70">
                <div className="w-6 h-6 rounded-full bg-stone-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  2
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-stone-900">
                    Faites défiler et touchez « Sur l'écran d'accueil »
                  </div>
                  <div className="text-stone-500 text-[11px] flex items-center gap-1">
                    <PlusSquare className="w-3 h-3 text-stone-700" />
                    <span>L'option s'appelle « Sur l'écran d'accueil » (Add to Home Screen).</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-lg bg-[#FAF8F5] border border-stone-200/70">
                <div className="w-6 h-6 rounded-full bg-stone-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  3
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-stone-900">
                    Confirmez en touchant « Ajouter »
                  </div>
                  <div className="text-stone-500 text-[11px]">
                    L'icône dorée MindLabZ apparaîtra immédiatement sur votre bureau iOS parmi vos autres applications.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Android Chrome Guide */}
          <div className="bg-white border border-stone-200 rounded-xl p-4 sm:p-5 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-stone-900 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-stone-700" />
                <span>Guide pour Android (Chrome / Samsung Internet)</span>
              </span>
              {isAndroid && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-stone-100 text-stone-800">
                  Votre appareil
                </span>
              )}
            </div>

            <p className="text-stone-600 leading-relaxed">
              Si le bouton d'installation directe n'apparaît pas :
            </p>

            <ol className="list-decimal list-inside space-y-1.5 pl-1 text-[11px] text-stone-700">
              <li>Touchez le menu des options de Chrome (les <strong>3 points ⋮</strong> en haut à droite).</li>
              <li>Sélectionnez <strong>« Ajouter à l'écran d'accueil »</strong> ou <strong>« Installer l'application »</strong>.</li>
              <li>Validez : l'icône s'ajoute à votre écran d'accueil avec son format squircle et son splash screen.</li>
            </ol>
          </div>

          {/* Desktop Mac / Windows Guide */}
          <div className="bg-white border border-stone-200 rounded-xl p-4 space-y-2 text-xs">
            <div className="font-bold text-stone-900 flex items-center gap-2">
              <Laptop className="w-4 h-4 text-stone-700" />
              <span>Sur ordinateur (Mac / PC avec Chrome, Edge ou Safari)</span>
            </div>
            <p className="text-stone-600 leading-relaxed">
              Dans la barre d'adresse de votre navigateur, cliquez sur la petite icône d'installation <strong>(ordinateur avec une flèche vers le bas)</strong> pour installer l'application sur votre bureau macOS ou Windows.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-stone-200/80 bg-white flex items-center justify-between gap-3">
          <button
            onClick={handleCopyAppUrl}
            className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{copiedLink ? 'Lien copié !' : 'Partager l’adresse'}</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Terminé
          </button>
        </div>
      </div>
    </div>
  );
};

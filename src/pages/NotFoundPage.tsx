import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, ArrowLeft, RotateCw, Compass, BookOpen, PenLine, Gamepad2, User } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleHardRefresh = () => {
    // Clear any stuck redirect flags and safely reload to home
    sessionStorage.removeItem('mindlabz_redirect_path');
    window.location.href = '/';
  };

  const quickLinks = [
    { label: 'Accueil / 探索', to: '/', icon: Home },
    { label: 'Lois & Principes / 定律库', to: '/learn', icon: BookOpen },
    { label: 'Journal / 心智手记', to: '/journal', icon: PenLine },
    { label: 'Arène Cognitive / 竞技场', to: '/games', icon: Gamepad2 },
    { label: 'Profil / 个人中心', to: '/profile', icon: User },
  ];

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center py-10 px-4 text-center animate-fadeIn">
      <div className="max-w-md w-full bg-white border border-stone-200/90 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
        {/* Emblem Badge */}
        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-700 shadow-sm">
          <Compass className="w-8 h-8 stroke-[1.8]" />
        </div>

        {/* Title & Editorial Description */}
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2">
            <span className="editorial-kicker text-[10px] tracking-widest text-stone-500 uppercase">
              RÉCUPÉRATION DE NAVIGATION · 404
            </span>
          </div>
          <h1 className="font-serif-editorial text-2xl sm:text-3xl font-bold text-stone-900 leading-tight">
            Page Introuvable
          </h1>
          <p className="text-xs text-stone-600 leading-relaxed max-w-sm mx-auto">
            L'adresse demandée <code className="px-1.5 py-0.5 rounded bg-stone-100 font-mono text-[11px] text-amber-800 break-all">{location.pathname}</code> n'a pas pu être chargée ou a été actualisée.
          </p>
        </div>

        {/* Direct Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
          <button
            onClick={() => navigate('/')}
            className="flex-1 py-3 px-4 rounded-xl chameleon-btn text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-transform active:scale-95"
          >
            <Home className="w-4 h-4" />
            <span>Retour à l'accueil</span>
          </button>

          <button
            onClick={() => navigate(-1)}
            className="py-3 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Page précédente</span>
          </button>
        </div>

        {/* Secondary recovery action */}
        <div className="pt-2 border-t border-stone-100 flex items-center justify-center">
          <button
            onClick={handleHardRefresh}
            className="text-[11px] text-stone-500 hover:text-stone-800 flex items-center gap-1.5 transition-colors cursor-pointer py-1"
          >
            <RotateCw className="w-3 h-3" />
            <span>Actualiser l'application en toute sécurité</span>
          </button>
        </div>

        {/* Quick Direct Destination Access */}
        <div className="text-left pt-2">
          <div className="text-[10px] font-mono uppercase tracking-wider text-stone-400 mb-2 text-center">
            Accès rapide aux rubriques
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {quickLinks.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.to}
                  onClick={() => navigate(item.to)}
                  className="flex items-center gap-2 p-2 rounded-lg bg-stone-50 hover:bg-stone-100 text-stone-700 hover:text-stone-900 text-xs text-left transition-colors cursor-pointer border border-stone-100"
                >
                  <Icon className="w-3.5 h-3.5 text-stone-500" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

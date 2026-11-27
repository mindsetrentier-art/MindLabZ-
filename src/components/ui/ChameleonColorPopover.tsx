import React, { useState, useRef, useEffect } from 'react';
import { Palette, Play, Pause, SkipForward, Check, X } from 'lucide-react';
import { useThemeColor, ColorFilterMode } from '../../context/ThemeColorContext';

export const ChameleonColorControl: React.FC = () => {
  const {
    currentColor,
    totalColors,
    filterMode,
    setFilterMode,
    isAutoCycling,
    setIsAutoCycling,
    secondsRemaining,
    nextColor,
    selectColorById,
    filteredPalette,
  } = useThemeColor();

  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  const filterOptions: Array<{ id: ColorFilterMode; label: string; count: number }> = [
    { id: 'all', label: 'Toutes', count: 240 },
    { id: 'foncee', label: 'Minéral', count: 80 },
    { id: 'fluo', label: 'Éclat', count: 80 },
    { id: 'spectre', label: 'Satin', count: 80 },
  ];

  return (
    <div className="relative" ref={containerRef}>
      {/* Discreet Color Swatch Button in Header */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-1.5 glass-pill rounded-xl px-2.5 py-1.5 hover:border-stone-400/60 transition-all btn-tactile cursor-pointer chameleon-border-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900"
        title={`Couleur dynamique (${currentColor.code}/${totalColors}) : ${currentColor.nameFr} · Changement auto toutes les 30s`}
      >
        <span
          className="w-3.5 h-3.5 rounded-full shrink-0 border border-white/90 shadow-xs transition-colors duration-700"
          style={{
            background: `linear-gradient(135deg, ${currentColor.primary}, ${currentColor.secondary})`,
            boxShadow: `0 0 8px ${currentColor.glow}`,
          }}
        />
        <span className="hidden sm:inline text-[10px] font-bold font-numeric text-stone-700">
          {currentColor.code}
        </span>
        <span className="text-[10px] font-numeric font-semibold text-stone-500">
          {isAutoCycling ? `${secondsRemaining}s` : 'Pause'}
        </span>
      </button>

      {/* Discreet Popover for inspecting the 240 curated gallery nuances */}
      {open && (
        <div className="fixed sm:absolute right-3 sm:right-0 top-16 sm:top-full mt-2 w-[calc(100vw-24px)] max-w-sm sm:w-88 rounded-2xl bg-[#FDFBF7]/95 backdrop-blur-[22px] border border-stone-200/90 shadow-[0_22px_52px_-12px_rgba(24,20,17,0.22)] p-4 z-50 animate-fadeIn max-h-[85vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-stone-200/80">
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center shadow-xs border border-white/25"
                style={{
                  background: `linear-gradient(135deg, ${currentColor.primary}, ${currentColor.secondary})`,
                  color: currentColor.onPrimary,
                }}
              >
                <Palette className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-xs font-bold text-stone-900">
                  240 Nuances Galerie (Auto 30s)
                </div>
                <div className="text-[10px] text-stone-500">
                  Teintes chromatiques raffinées pour boutons & accents
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-1 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-200/50 transition-colors cursor-pointer"
              aria-label="Fermer la palette"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Active Color Info & Controls */}
          <div className="py-2.5 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-stone-900 truncate">
                  {currentColor.nameFr}
                </span>
                <span className="text-[10px] font-numeric font-semibold text-stone-500">
                  ({currentColor.code}/240)
                </span>
              </div>
              <div className="text-[10px] text-stone-500 flex items-center gap-1.5">
                <span>{currentColor.categoryLabelFr}</span>
                <span>·</span>
                <span className="font-mono">{currentColor.primary}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsAutoCycling(!isAutoCycling)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg luxury-surface-btn text-[11px] font-semibold cursor-pointer"
                title={isAutoCycling ? 'Mettre en pause le cycle 30s' : 'Activer le cycle 30s'}
              >
                {isAutoCycling ? (
                  <>
                    <Pause className="w-3 h-3" />
                    <span className="font-numeric">{secondsRemaining}s</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3" />
                    <span>Auto 30s</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={nextColor}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer chameleon-btn"
                title="Passer immédiatement à la couleur suivante"
              >
                <SkipForward className="w-3 h-3" />
                <span>Suivante</span>
              </button>
            </div>
          </div>

          {/* 30-second progress bar preview */}
          <div className="h-1 w-full rounded-full bg-stone-200/70 overflow-hidden mb-3">
            <div
              className="h-full chameleon-bar"
              style={{
                width: `${isAutoCycling ? ((30 - secondsRemaining) / 30) * 100 : 100}%`,
              }}
            />
          </div>

          {/* Category Filter Tabs */}
          <div className="grid grid-cols-4 gap-1 p-1 bg-stone-100/80 border border-stone-200/70 rounded-xl mb-2.5">
            {filterOptions.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterMode(tab.id)}
                className={`py-1 px-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                  filterMode === tab.id
                    ? 'bg-white text-stone-900 shadow-2xs border border-stone-200/60'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                <div>{tab.label}</div>
                <div className="text-[9px] font-numeric opacity-75">{tab.count}</div>
              </button>
            ))}
          </div>

          {/* 240-Color Swatch Grid */}
          <div className="max-h-40 overflow-y-auto pr-1 grid grid-cols-10 gap-1.5 pt-1">
            {filteredPalette.map((color) => {
              const isSelected = color.id === currentColor.id;
              return (
                <button
                  key={color.id}
                  type="button"
                  onClick={() => selectColorById(color.id)}
                  title={`${color.code} · ${color.nameFr} (${color.categoryLabelFr})`}
                  className={`w-6 h-6 rounded-lg flex items-center justify-center transition-transform cursor-pointer ${
                    isSelected ? 'scale-110 ring-2 ring-[#18181B] ring-offset-1' : 'hover:scale-110'
                  }`}
                  style={{
                    background: `linear-gradient(135deg, ${color.primary}, ${color.secondary})`,
                  }}
                >
                  {isSelected && (
                    <Check
                      className="w-3 h-3"
                      style={{ color: color.onPrimary }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { CHAMELEON_PALETTE_240, ChameleonColor, ColorCategory } from '../data/colorPalette240';

export type ColorFilterMode = 'all' | ColorCategory;

interface ThemeColorContextType {
  currentColor: ChameleonColor;
  colorIndex: number;
  totalColors: number;
  filterMode: ColorFilterMode;
  setFilterMode: (mode: ColorFilterMode) => void;
  isAutoCycling: boolean;
  setIsAutoCycling: (auto: boolean) => void;
  secondsRemaining: number;
  nextColor: () => void;
  selectColorById: (id: number) => void;
  filteredPalette: ChameleonColor[];
}

const ThemeColorContext = createContext<ThemeColorContextType | undefined>(undefined);

const CYCLE_INTERVAL_SECONDS = 30;

/**
 * Custom hook that cycles through the predefined array of 200+ (240) distinct color themes
 * every 30 seconds and dynamically updates '--chameleon-primary' and '--chameleon-secondary'
 * (along with companion glow/border variables) on the document root.
 */
export function useChameleonThemeCycle(initialThemes: ChameleonColor[] = CHAMELEON_PALETTE_240) {
  const [filterMode, setFilterMode] = useState<ColorFilterMode>('all');
  const [currentId, setCurrentId] = useState<number>(initialThemes[0]?.id ?? 1);
  const [isAutoCycling, setIsAutoCycling] = useState<boolean>(true);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(CYCLE_INTERVAL_SECONDS);

  const filteredPalette = useMemo(() => {
    if (filterMode === 'all') return initialThemes;
    return initialThemes.filter((c) => c.category === filterMode);
  }, [filterMode, initialThemes]);

  const currentColor = useMemo(() => {
    return (
      initialThemes.find((c) => c.id === currentId) ||
      filteredPalette[0] ||
      initialThemes[0]
    );
  }, [currentId, filteredPalette, initialThemes]);

  const colorIndex = useMemo(() => {
    const idx = filteredPalette.findIndex((c) => c.id === currentColor.id);
    return idx >= 0 ? idx : 0;
  }, [filteredPalette, currentColor]);

  const nextColor = useCallback(() => {
    setSecondsRemaining(CYCLE_INTERVAL_SECONDS);
    setCurrentId((prevId) => {
      const idx = filteredPalette.findIndex((c) => c.id === prevId);
      const nextIdx = idx >= 0 ? (idx + 1) % filteredPalette.length : 0;
      return filteredPalette[nextIdx].id;
    });
  }, [filteredPalette]);

  const selectColorById = useCallback((id: number) => {
    setCurrentId(id);
    setSecondsRemaining(CYCLE_INTERVAL_SECONDS);
  }, []);

  // Keep currentId valid if filterMode changes
  useEffect(() => {
    if (!filteredPalette.some((c) => c.id === currentId)) {
      setCurrentId(filteredPalette[0]?.id || 1);
    }
  }, [filterMode, filteredPalette, currentId]);

  // Cycle through the 200+ distinct color themes every 30 seconds
  useEffect(() => {
    if (!isAutoCycling) return;

    const timer = window.setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          setCurrentId((currId) => {
            const idx = filteredPalette.findIndex((c) => c.id === currId);
            const nextIdx = idx >= 0 ? (idx + 1) % filteredPalette.length : 0;
            return filteredPalette[nextIdx].id;
          });
          return CYCLE_INTERVAL_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isAutoCycling, filteredPalette]);

  // Dynamically update CSS variables '--chameleon-primary' and '--chameleon-secondary'
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--chameleon-primary', currentColor.primary);
    root.style.setProperty('--chameleon-secondary', currentColor.secondary);
    root.style.setProperty('--chameleon-glow', currentColor.glow);
    root.style.setProperty('--chameleon-soft', currentColor.soft);
    root.style.setProperty('--chameleon-border', currentColor.border);
    root.style.setProperty('--chameleon-on-primary', currentColor.onPrimary);
  }, [currentColor]);

  return {
    currentColor,
    colorIndex,
    totalColors: initialThemes.length,
    filterMode,
    setFilterMode,
    isAutoCycling,
    setIsAutoCycling,
    secondsRemaining,
    nextColor,
    selectColorById,
    filteredPalette,
  };
}

export const ThemeColorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const themeCycleState = useChameleonThemeCycle(CHAMELEON_PALETTE_240);

  return (
    <ThemeColorContext.Provider value={themeCycleState}>
      {children}
    </ThemeColorContext.Provider>
  );
};

export const useThemeColor = (): ThemeColorContextType => {
  const ctx = useContext(ThemeColorContext);
  if (!ctx) {
    throw new Error('useThemeColor must be used within a ThemeColorProvider');
  }
  return ctx;
};

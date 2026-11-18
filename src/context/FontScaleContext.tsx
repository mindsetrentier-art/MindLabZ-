import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';

export type QuizFontScale = 'standard' | 'large' | 'xlarge';

export interface FontScaleOption {
  id: QuizFontScale;
  label: string;
  shortLabel: string;
  previewText: string;
  scaleHint: string;
  description: string;
}

export const FONT_SCALE_OPTIONS: FontScaleOption[] = [
  {
    id: 'standard',
    label: '标准',
    shortLabel: '标准',
    previewText: 'Aa',
    scaleHint: '1.0×',
    description: '均衡适中，适合常规屏幕阅读',
  },
  {
    id: 'large',
    label: '大',
    shortLabel: '大字',
    previewText: 'Aa',
    scaleHint: '1.18×',
    description: '字距更舒展，缓解阅读疲劳',
  },
  {
    id: 'xlarge',
    label: '特大',
    shortLabel: '特大',
    previewText: 'Aa',
    scaleHint: '1.35×',
    description: '醒目大字号，清晰舒适易聚焦',
  },
];

const STORAGE_KEY = 'mindlabz_quiz_font_scale_v1';

interface FontScaleContextValue {
  fontScale: QuizFontScale;
  setFontScale: (scale: QuizFontScale) => void;
  cycleFontScale: () => void;
  currentOption: FontScaleOption;
}

const FontScaleContext = createContext<FontScaleContextValue | undefined>(undefined);

const isValidScale = (value: unknown): value is QuizFontScale =>
  value === 'standard' || value === 'large' || value === 'xlarge';

export const FontScaleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [fontScale, setFontScaleState] = useState<QuizFontScale>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (isValidScale(saved)) {
        return saved;
      }
    } catch {
      // ignore storage errors
    }
    return 'standard';
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, fontScale);
    } catch {
      // ignore storage errors
    }
  }, [fontScale]);

  const setFontScale = useCallback((scale: QuizFontScale) => {
    setFontScaleState(scale);
  }, []);

  const cycleFontScale = useCallback(() => {
    setFontScaleState((prev) => {
      if (prev === 'standard') return 'large';
      if (prev === 'large') return 'xlarge';
      return 'standard';
    });
  }, []);

  const currentOption = useMemo(
    () => FONT_SCALE_OPTIONS.find((opt) => opt.id === fontScale) ?? FONT_SCALE_OPTIONS[0],
    [fontScale]
  );

  const value = useMemo(
    () => ({
      fontScale,
      setFontScale,
      cycleFontScale,
      currentOption,
    }),
    [fontScale, setFontScale, cycleFontScale, currentOption]
  );

  return <FontScaleContext.Provider value={value}>{children}</FontScaleContext.Provider>;
};

export const useFontScale = (): FontScaleContextValue => {
  const ctx = useContext(FontScaleContext);
  if (!ctx) {
    throw new Error('useFontScale must be used within a FontScaleProvider');
  }
  return ctx;
};

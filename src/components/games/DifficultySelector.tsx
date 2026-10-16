import React from 'react';
import { GameDifficulty, DIFFICULTY_CONFIGS, DIFFICULTY_LIST } from '../../data/difficulty';
import { Sparkles, ShieldCheck, Flame, Crown, Info } from 'lucide-react';
import { gameAudio } from '../../utils/gameAudio';

interface DifficultySelectorProps {
  value: GameDifficulty;
  onChange: (diff: GameDifficulty) => void;
  compact?: boolean;
  showDetails?: boolean;
  className?: string;
}

const DIFFICULTY_ICONS: Record<GameDifficulty, React.ElementType> = {
  '低': ShieldCheck,
  '中': Sparkles,
  '高': Flame,
  '高级': Crown,
};

export const DifficultySelector: React.FC<DifficultySelectorProps> = ({
  value,
  onChange,
  compact = false,
  showDetails = true,
  className = '',
}) => {
  const currentConfig = DIFFICULTY_CONFIGS[value];

  const handleSelect = (diff: GameDifficulty) => {
    gameAudio.playTap();
    onChange(diff);
  };

  if (compact) {
    return (
      <div className={`inline-flex items-center p-1 bg-stone-100 rounded-xl border border-stone-200/80 ${className}`}>
        {DIFFICULTY_LIST.map((diff) => {
          const isSelected = value === diff;
          const conf = DIFFICULTY_CONFIGS[diff];
          return (
            <button
              key={diff}
              type="button"
              onClick={() => handleSelect(diff)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                isSelected
                  ? 'bg-stone-900 text-white shadow-sm'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
              }`}
              title={`${conf.name} (${conf.multiplierText} 积分加成)`}
            >
              <span>{diff}</span>
              {isSelected && (
                <span className="text-[10px] opacity-80 font-numeric">
                  {conf.multiplierText}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* 4 Segmented Difficulty Tabs */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2 p-1 bg-stone-100 rounded-2xl border border-stone-200/80">
        {DIFFICULTY_LIST.map((diff) => {
          const isSelected = value === diff;
          const conf = DIFFICULTY_CONFIGS[diff];
          const Icon = DIFFICULTY_ICONS[diff];

          return (
            <button
              key={diff}
              type="button"
              onClick={() => handleSelect(diff)}
              className={`flex flex-col items-center justify-center py-2.5 sm:py-3 px-1 sm:px-2 rounded-xl transition-all cursor-pointer relative ${
                isSelected
                  ? 'bg-white text-stone-900 shadow-md border border-stone-300'
                  : 'text-stone-500 hover:text-stone-800 hover:bg-stone-200/50'
              }`}
            >
              <div className="flex items-center gap-1">
                <Icon
                  className={`w-3.5 h-3.5 ${
                    isSelected ? conf.colorClass : 'text-stone-400'
                  }`}
                />
                <span className="text-xs sm:text-sm font-bold font-serif-editorial">
                  {diff}
                </span>
              </div>

              <span
                className={`text-[10px] mt-0.5 font-numeric font-medium px-1.5 py-0.2 rounded-md ${
                  isSelected
                    ? `${conf.bgLightClass} ${conf.colorClass}`
                    : 'text-stone-400'
                }`}
              >
                {conf.multiplierText}
              </span>

              {isSelected && (
                <div
                  className="absolute -bottom-1 w-5 h-0.5 rounded-full"
                  style={{ backgroundColor: conf.accentHex }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Difficulty Clarification Card */}
      {showDetails && (
        <div
          className={`rounded-xl p-3 sm:p-3.5 border transition-all text-xs flex items-start gap-2.5 ${currentConfig.bgLightClass} ${currentConfig.borderClass}`}
        >
          <Info className={`w-4 h-4 shrink-0 mt-0.5 ${currentConfig.colorClass}`} />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`font-bold font-serif-editorial ${currentConfig.colorClass}`}>
                {currentConfig.name}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/80 font-numeric font-semibold text-stone-700 border border-stone-200/50">
                积分与经验加成 {currentConfig.multiplierText}
              </span>
            </div>
            <p className="text-stone-600 dark:text-stone-300 leading-relaxed text-[11px] sm:text-xs">
              {currentConfig.description}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

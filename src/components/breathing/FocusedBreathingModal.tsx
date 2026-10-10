import React from 'react';
import { X, Wind, Sparkles } from 'lucide-react';
import { FocusedBreathing } from './FocusedBreathing';

interface FocusedBreathingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTechniqueId?: string;
  onNavigateToJournal?: (summaryText: string) => void;
}

export const FocusedBreathingModal: React.FC<FocusedBreathingModalProps> = ({
  isOpen,
  onClose,
  initialTechniqueId = '4-7-8',
  onNavigateToJournal,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-stone-900/60 backdrop-blur-md animate-fadeIn overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-[#FAF8F5] rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Floating Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 z-20 p-2 rounded-full bg-white/80 hover:bg-white text-stone-600 hover:text-stone-900 shadow-xs border border-stone-200/80 transition-all cursor-pointer"
          aria-label="关闭"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8 md:p-10">
          <FocusedBreathing
            initialTechniqueId={initialTechniqueId}
            onNavigateToJournal={(text) => {
              onClose();
              onNavigateToJournal?.(text);
            }}
          />
        </div>
      </div>
    </div>
  );
};

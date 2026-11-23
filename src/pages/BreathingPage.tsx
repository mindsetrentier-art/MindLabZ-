import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Headphones } from 'lucide-react';
import { FocusedBreathing } from '../components/breathing/FocusedBreathing';
import { MeditationAudioLibrary } from '../components/breathing/MeditationAudioLibrary';
import { BreathingAudioGuideOverlay } from '../components/breathing/BreathingAudioGuideOverlay';
import { gameAudio } from '../utils/gameAudio';

export const BreathingPage: React.FC = () => {
  const navigate = useNavigate();
  const [audioGuideOpen, setAudioGuideOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return window.innerWidth >= 768;
  });

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-16 animate-fadeIn">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs font-semibold text-stone-600 hover:text-stone-900 transition-colors py-1.5 px-3 rounded-lg hover:bg-stone-100 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" />
          <span>返回</span>
        </button>

        <div className="flex items-center gap-3">
          <span className="text-xs text-stone-500 hidden sm:inline">
            MindLabZ Somatic Regulation
          </span>
          <button
            type="button"
            onClick={() => {
              gameAudio.playTap();
              setAudioGuideOpen((prev) => !prev);
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#532CD8] ${
              audioGuideOpen
                ? 'bg-[#0F766E] border-[#0F766E] text-white'
                : 'bg-white border-stone-200 text-stone-700 hover:border-stone-400'
            }`}
          >
            <Headphones className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>Audio Guide</span>
          </button>
        </div>
      </div>

      {/* Main Breathing Component */}
      <FocusedBreathing
        standalone={true}
        onNavigateToJournal={() => navigate('/journal')}
      />

      {/* Dedicated Meditation Soundscape Audio Library */}
      <MeditationAudioLibrary variant="full-shelf" />

      {/* Simple Floating Audio Guide Overlay */}
      <BreathingAudioGuideOverlay
        isOpen={audioGuideOpen}
        onOpen={() => setAudioGuideOpen(true)}
        onClose={() => setAudioGuideOpen(false)}
      />
    </div>
  );
};

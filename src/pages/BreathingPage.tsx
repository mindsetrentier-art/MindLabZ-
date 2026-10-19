import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Sparkles, Brain } from 'lucide-react';
import { FocusedBreathing } from '../components/breathing/FocusedBreathing';
import { MeditationAudioLibrary } from '../components/breathing/MeditationAudioLibrary';

export const BreathingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-16 animate-fadeIn">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs font-semibold text-stone-600 hover:text-stone-900 transition-colors py-1.5 px-3 rounded-lg hover:bg-stone-100 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>返回</span>
        </button>

        <div className="text-xs text-stone-500 font-mono">
          MindLabZ Somatic Regulation
        </div>
      </div>

      {/* Main Breathing Component */}
      <FocusedBreathing
        standalone={true}
        onNavigateToJournal={() => navigate('/journal')}
      />

      {/* Dedicated Meditation Soundscape Audio Library */}
      <MeditationAudioLibrary variant="full-shelf" />
    </div>
  );
};

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Sparkles, Brain } from 'lucide-react';
import { FocusedBreathing } from '../components/breathing/FocusedBreathing';

export const BreathingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16 animate-fadeIn">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-xs font-semibold text-stone-600 hover:text-stone-900 transition-colors py-1.5 px-3 rounded-lg hover:bg-stone-100 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>返回</span>
      </button>

      {/* Main Breathing Component */}
      <FocusedBreathing
        standalone={true}
        onNavigateToJournal={() => navigate('/journal')}
      />
    </div>
  );
};

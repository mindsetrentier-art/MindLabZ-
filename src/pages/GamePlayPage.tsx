import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MemoryLabGame } from '../components/games/MemoryLabGame';
import { MindTrapGame } from '../components/games/MindTrapGame';
import { BrainRushGame } from '../components/games/BrainRushGame';
import { MindDetectiveGame } from '../components/games/MindDetectiveGame';
import { PsychExperimentGame } from '../components/games/PsychExperimentGame';

export const GamePlayPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  switch (id) {
    case 'memory-lab':
      return <MemoryLabGame />;
    case 'mind-trap':
      return <MindTrapGame />;
    case 'brain-rush':
      return <BrainRushGame />;
    case 'mind-detective':
      return <MindDetectiveGame />;
    case 'psych-experiment':
      return <PsychExperimentGame />;
    default:
      return (
        <div className="bg-white rounded-3xl p-8 text-center border border-[#E8E5F0] space-y-4 my-8">
          <h2 className="text-lg font-bold text-[#1B192E]">游戏未找到</h2>
          <button
            onClick={() => navigate('/games')}
            className="px-4 py-2 bg-[#6C4CF1] text-white text-xs font-bold rounded-xl"
          >
            返回游戏库
          </button>
        </div>
      );
  }
};

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PSYCHOLOGY_GAMES } from '../data/games';
import { GameArenaStageSkeleton } from '../components/ui/Skeleton';

// 经典小游戏
import { MemoryLabGame } from '../components/games/MemoryLabGame';
import { MindTrapGame } from '../components/games/MindTrapGame';
import { BrainRushGame } from '../components/games/BrainRushGame';
import { MindDetectiveGame } from '../components/games/MindDetectiveGame';
import { PsychExperimentGame } from '../components/games/PsychExperimentGame';

// 10 经典心理学小游戏组件
import { FirstImpressionGame } from '../components/games/FirstImpressionGame';
import { AnchoringLabGame } from '../components/games/AnchoringLabGame';
import { MajorityAnswerGame } from '../components/games/MajorityAnswerGame';
import { PeakEndGame } from '../components/games/PeakEndGame';
import { EmotionDetectiveGame } from '../components/games/EmotionDetectiveGame';
import { AttributionShiftGame } from '../components/games/AttributionShiftGame';
import { ZeroPriceTrapGame } from '../components/games/ZeroPriceTrapGame';
import { MicroHabitGame } from '../components/games/MicroHabitGame';
import { BystanderBreakerGame } from '../components/games/BystanderBreakerGame';
import { FalsificationChallengeGame } from '../components/games/FalsificationChallengeGame';

export const GamePlayPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isTransitioning, setIsTransitioning] = useState(true);

  const currentGame = PSYCHOLOGY_GAMES.find((g) => g.id === id);

  // Micro-interaction transition when mounting or switching games
  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => {
      setIsTransitioning(false);
    }, 280);
    return () => clearTimeout(timer);
  }, [id]);

  if (isTransitioning && currentGame) {
    return (
      <GameArenaStageSkeleton
        gameTitle={currentGame.nameZh}
        gameNumber={currentGame.numberPrefix}
        gameCategory={currentGame.category}
        accentColor={currentGame.accentColor}
      />
    );
  }

  const renderGameComponent = () => {
    switch (id) {
      // 10 款认知与行为心理学小游戏 (01 - 10)
      case 'first-impression':
        return <FirstImpressionGame />;
      case 'anchoring-lab':
        return <AnchoringLabGame />;
      case 'majority-answer':
        return <MajorityAnswerGame />;
      case 'peak-end':
        return <PeakEndGame />;
      case 'emotion-detective':
        return <EmotionDetectiveGame />;
      case 'attribution-shift':
        return <AttributionShiftGame />;
      case 'zero-price-trap':
        return <ZeroPriceTrapGame />;
      case 'micro-habit':
        return <MicroHabitGame />;
      case 'bystander-breaker':
        return <BystanderBreakerGame />;
      case 'falsification-challenge':
        return <FalsificationChallengeGame />;

      // 经典竞技场实验室
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
          <div className="bg-white rounded-3xl p-8 text-center border border-stone-200 space-y-4 my-8 max-w-md mx-auto">
            <h2 className="text-lg font-bold text-stone-900 font-serif-editorial">实验未找到</h2>
            <p className="text-xs text-stone-500">
              该实验编号不存在或已归档，请返回竞技场主目录选择。
            </p>
            <button
              onClick={() => navigate('/games')}
              className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              返回竞技场实验室
            </button>
          </div>
        );
    }
  };

  return (
    <div key={id} className="animate-stageEnter w-full">
      {renderGameComponent()}
    </div>
  );
};

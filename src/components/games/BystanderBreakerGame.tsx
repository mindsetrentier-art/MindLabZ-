import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, LifeBuoy, CheckCircle2, RotateCcw, AlertTriangle, ArrowRight, ShieldCheck, Megaphone, Sparkles, Siren, Flame } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { GameDifficulty, DIFFICULTY_CONFIGS, DIFFICULTY_LIST, shuffleArray } from '../../data/difficulty';
import { DifficultySelector } from './DifficultySelector';
import { GameDebriefModal, DebriefData } from './GameDebriefModal';
import { GameHeaderHud } from './GameHeaderHud';
import { gameAudio } from '../../utils/gameAudio';

interface CommandOption {
  text: string;
  isEffective: boolean;
  responsibilityLock: number; // 0% to 100%
  crowdReaction: string;
}

interface BystanderScenario {
  id: string;
  title: string;
  emergency: string;
  crowdState: string;
  options: CommandOption[];
}

const SCENARIOS_POOL: BystanderScenario[] = [
  {
    id: 'scen-subway',
    title: '早高峰早班地铁车厢突发昏厥',
    emergency: '早高峰挤满乘客的地铁车厢中，一名年轻乘客突然面色惨白倒地抽搐，呼吸微弱。',
    crowdState: '车厢内约 40 名乘客，所有人都在惊恐观望，有人默默后退，但没有一个人主动打电话或上前。',
    options: [
      {
        text: '“大家快帮帮他啊！救命啊，谁来救救他！”',
        isEffective: false,
        responsibilityLock: 15,
        crowdReaction: '所有人都在等“别人”先动，责任被分散在 40 个人身上，现场一片死寂。',
      },
      {
        text: '“有医生吗？现场有没有会急救的专业人士？”',
        isEffective: false,
        responsibilityLock: 30,
        crowdReaction: '大家面面相觑，没有人敢主动站出来承担医疗风险。',
      },
      {
        text: '“穿灰色风衣拿雨伞的先生，请你立刻拨打 120 急救！左边戴耳机的女士，请立刻按下车厢端部的红色紧急求助按钮！”',
        isEffective: true,
        responsibilityLock: 98,
        crowdReaction: '被直接点名的两位乘客立刻清醒，责任明确锁定，一人掏手机拨号，一人迅速按响紧急报警器！',
      },
    ],
  },
  {
    id: 'scen-office',
    title: '开放式办公区突发严重异物窒息',
    emergency: '午餐时间，一名同事吃话梅不慎滑入气管，双手死死卡住喉咙（海姆立克标志动作），面部已青紫。',
    crowdState: '工位区有 20 多人围了过来，大家交头接耳焦急询问“你怎么了”，但没人采取行动。',
    options: [
      {
        text: '“快来人拿水给他喝！大家想想办法！”',
        isEffective: false,
        responsibilityLock: 20,
        crowdReaction: '给窒息者喂水可能导致更严重的吸入性肺水肿，盲目指令加剧危险。',
      },
      {
        text: '“王磊！你力气大，从背后抱住他用海姆立克手法连续冲击上腹部！李姐，你负责给前台打内部急救电话！”',
        isEffective: true,
        responsibilityLock: 100,
        crowdReaction: '指定具体姓名与具体物理动作，王磊立刻上前环抱冲击，第 3 次冲击将异物成功咳出！',
      },
    ],
  },
];

export const BystanderBreakerGame: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, recordGameResult } = useApp();

  const urlDiff = searchParams.get('difficulty') as GameDifficulty | null;
  const initialDiff: GameDifficulty = urlDiff && DIFFICULTY_LIST.includes(urlDiff) ? urlDiff : '中';

  const [difficulty, setDifficulty] = useState<GameDifficulty>(initialDiff);
  const [gameState, setGameState] = useState<'intro' | 'acting' | 'result' | 'debrief'>('intro');
  const [scenarios, setScenarios] = useState<BystanderScenario[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);

  const diffConfig = DIFFICULTY_CONFIGS[difficulty];
  const isFirstTime = !(user.completedGames?.includes('bystander-breaker'));

  const startSession = (selectedDiff: GameDifficulty = difficulty) => {
    gameAudio.playSuccess();
    const shuffled = shuffleArray(SCENARIOS_POOL).map(s => ({
      ...s,
      options: shuffleArray(s.options),
    }));
    setScenarios(shuffled);
    setCurrentIdx(0);
    setSelectedIdx(null);
    setScore(0);
    setCorrectCount(0);
    setGameState('acting');
  };

  const scen = scenarios[currentIdx];

  const handleSelectOption = (idx: number) => {
    setSelectedIdx(idx);
    const chosen = scen.options[idx];
    if (chosen.isEffective) {
      gameAudio.playSuccess();
      const pts = Math.round(1500 * diffConfig.scoreMultiplier);
      setScore(prev => prev + pts);
      setCorrectCount(prev => prev + 1);
    } else {
      gameAudio.playMistake();
    }
    setGameState('result');
  };

  const handleNext = () => {
    gameAudio.playTap();
    if (currentIdx < scenarios.length - 1) {
      setCurrentIdx(prev => prev + 1);
      setSelectedIdx(null);
      setGameState('acting');
    } else {
      const calculatedXp = isFirstTime
        ? Math.round(40 * diffConfig.xpMultiplier)
        : Math.round(10 * diffConfig.xpMultiplier);

      recordGameResult('bystander-breaker', {
        score,
        accuracy: Math.round((correctCount / scenarios.length) * 100),
        reactionTime: 840,
        xpGained: calculatedXp,
        comboMax: correctCount,
        conceptLearned: '旁观者效应（Bystander Effect）与多元无知破局指令法',
        lawId: 'bystander-effect',
        difficulty,
      });

      setGameState('debrief');
    }
  };

  const debriefData: DebriefData = {
    gameId: 'bystander-breaker',
    gameTitle: '旁观者破局',
    numberPrefix: '09',
    difficulty,
    score,
    accuracy: scenarios.length > 0 ? Math.round((correctCount / scenarios.length) * 100) : 100,
    isFirstTime,
    xpEarned: isFirstTime ? Math.round(42 * diffConfig.xpMultiplier) : Math.round(10 * diffConfig.xpMultiplier),
    bestAnswerReview:
      '危急时刻打破集体沉默的最高法则：【指定单人、指明特征、指定明确物理动作】。绝不对着空气呼喊“来个人”，而是把全场 100% 的注意力和责任直接钉在某一个个体身上。',
    psychologicalMechanism:
      '达利与拉塔奈经典实验发现：单人在场时求助成功率达 85%，而当人数增加到 5 人以上时，成功率暴跌至 31%。其底层是两大心理机制在作祟：责任分散（Diffusion of Responsibility，别人会动）和多元无知（Pluralistic Ignorance，别人不动说明事不严重）。',
    actionableSummary: [
      '“指向性点名法则”：“穿红衣服戴眼镜的大哥，就是你，请帮我拨打 110！”',
      '作为求助者：主动瓦解多元无知，大声挑明危险现状：“我现在心脏剧痛无法呼吸，这很危险！”',
      '在职场任务分派中同样适用：邮件抄送 10 个人等于无人负责；必须指名道姓主负责人。',
    ],
  };

  if (gameState === 'intro') {
    return (
      <div className="flex flex-col items-center justify-start min-h-[85vh] w-full max-w-lg mx-auto py-4 px-2">
        <div className="w-full flex items-center justify-between mb-4">
          <button
            onClick={() => navigate('/games')}
            type="button"
            className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>返回竞技场</span>
          </button>
          <span className="text-xs font-mono font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
            GAME 09
          </span>
        </div>

        <div className="w-full game-arcade-card rounded-3xl p-6 sm:p-8 border-orange-200/90 shadow-xl space-y-6 relative overflow-hidden">
          {/* Ambient colorful glow */}
          <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-gradient-to-br from-orange-500/30 to-red-600/20 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-400/20 blur-2xl pointer-events-none" />

          {/* Animated LifeBuoy Monogram */}
          <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-orange-500 to-red-600 shadow-lg shadow-orange-500/30 animate-pulseGlow" />
            <LifeBuoy className="w-10 h-10 text-white relative z-10" />
          </div>

          <div className="text-center space-y-2 relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-orange-800 bg-orange-50 border border-orange-200">
              <Siren className="w-3.5 h-3.5 text-orange-600" />
              <span>旁观者效应 · 责任分散破局指令</span>
            </div>
            <h1 className="font-serif-editorial text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
              09 · 旁观者破局
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-sm mx-auto">
              面对集体冷漠与无助围观，如何发出掷地有声的定向指令，瞬间刺破责任稀释的心理死局。
            </p>
          </div>

          <div className="space-y-2 pt-2 border-t border-stone-200/60 text-left relative z-10">
            <div className="flex justify-between items-center text-xs font-bold text-stone-800">
              <span>选择救援情境难度：</span>
              <span className="text-orange-600 font-numeric">{diffConfig.multiplierText} 积分收益</span>
            </div>
            <DifficultySelector value={difficulty} onChange={setDifficulty} />
          </div>

          <button
            onClick={() => startSession(difficulty)}
            type="button"
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-500 via-red-500 to-amber-600 hover:opacity-95 text-white font-bold text-sm shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 relative z-10 game-btn-tactile"
          >
            <LifeBuoy className="w-4 h-4 text-white" />
            <span>开启破局指令（{difficulty}难度 · {diffConfig.multiplierText} 积分加成）</span>
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'debrief') {
    return (
      <div className="py-4 px-2">
        <GameDebriefModal
          data={debriefData}
          onRestart={() => startSession(difficulty)}
          onReturn={() => navigate('/games')}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-start min-h-[85vh] w-full max-w-lg mx-auto py-2 px-2 animate-fadeIn space-y-4">
      {/* Game HUD */}
      <GameHeaderHud
        title="09 · 旁观者破局"
        numberPrefix="09"
        difficulty={difficulty}
        score={score}
        combo={correctCount}
        currentRound={currentIdx + 1}
        totalRounds={scenarios.length}
        onExit={() => setGameState('intro')}
        accentColor="#F97316"
      />

      {scen && (
        <div className="w-full game-arcade-card rounded-3xl p-6 border-orange-100 shadow-xl space-y-5 animate-fadeIn bg-white relative overflow-hidden">
          {/* Emergency Incident Banner */}
          <div className="space-y-2 border-b border-stone-200/70 pb-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-md border border-rose-200 font-mono flex items-center gap-1">
                <Siren className="w-3.5 h-3.5 animate-pulse text-rose-600" />
                EMERGENCY ALERT #{currentIdx + 1} / {scenarios.length}
              </span>
            </div>

            <h2 className="text-xl font-bold text-stone-900 font-serif-editorial">
              {scen.title}
            </h2>

            <div className="p-3.5 bg-rose-50/70 rounded-2xl border border-rose-200 space-y-1">
              <span className="text-[11px] font-bold text-rose-900 block font-serif-editorial">
                现场危急状况：
              </span>
              <p className="text-xs text-stone-800 leading-relaxed font-sans">
                {scen.emergency}
              </p>
            </div>

            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-600 font-sans">
              <strong>现场人群心理状态：</strong>{scen.crowdState}
            </div>
          </div>

          {/* Action Choice Buttons */}
          <div className="space-y-3 pt-1">
            <h4 className="text-xs font-bold text-stone-900 font-serif-editorial flex items-center gap-1.5">
              <Megaphone className="w-4 h-4 text-orange-600" />
              <span>你立刻喊出的破局指令：</span>
            </h4>

            <div className="grid grid-cols-1 gap-3">
              {scen.options.map((opt, idx) => {
                const isSelected = selectedIdx === idx;
                return (
                  <button
                    key={idx}
                    disabled={gameState === 'result'}
                    onClick={() => handleSelectOption(idx)}
                    type="button"
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                      isSelected
                        ? opt.isEffective
                          ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-semibold shadow-md shadow-emerald-500/15'
                          : 'bg-rose-50 border-rose-400 text-rose-950 font-semibold shadow-md shadow-rose-500/15'
                        : 'bg-white hover:bg-stone-50 border-stone-200 text-stone-800 hover:border-orange-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs sm:text-[13px] font-bold leading-snug font-sans">{opt.text}</span>
                      {isSelected && (
                        opt.isEffective ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                        )
                      )}
                    </div>

                    {gameState === 'result' && (
                      <div className="mt-3 pt-2.5 border-t border-stone-200/70 text-xs space-y-1 animate-fadeIn font-sans">
                        <div className="flex items-center gap-2">
                          <span className="text-stone-500 font-medium">责任锁定率:</span>
                          <span className={`font-bold font-numeric ${opt.isEffective ? 'text-emerald-600 font-black' : 'text-rose-600'}`}>
                            {opt.responsibilityLock}%
                          </span>
                        </div>
                        <p className="text-stone-600 leading-relaxed font-normal">{opt.crowdReaction}</p>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {gameState === 'result' && (
            <button
              onClick={handleNext}
              type="button"
              className="w-full py-4 bg-gradient-to-r from-orange-600 via-amber-600 to-red-600 hover:opacity-95 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 game-btn-tactile animate-fadeIn"
            >
              <span>{currentIdx < scenarios.length - 1 ? '审视下一个危机场景' : '完成实验生成研报'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

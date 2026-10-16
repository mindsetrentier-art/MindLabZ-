import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Shuffle, CheckCircle2, RotateCcw, AlertTriangle, ArrowRight, ShieldCheck, Sparkles, Unlock, Lock } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { GameDifficulty, DIFFICULTY_CONFIGS, DIFFICULTY_LIST, shuffleArray } from '../../data/difficulty';
import { DifficultySelector } from './DifficultySelector';
import { GameDebriefModal, DebriefData } from './GameDebriefModal';
import { GameHeaderHud } from './GameHeaderHud';
import { gameAudio } from '../../utils/gameAudio';

interface AttributionScenario {
  id: string;
  triggerEvent: string;
  internalBlame: string;
  hiddenContext: {
    clue: string;
    details: string;
  }[];
  empathyShiftReasoning: string;
}

const SCENARIOS_POOL: AttributionScenario[] = [
  {
    id: 'scen-late-report',
    triggerEvent: '核心合作搭档在周五下午 5 点截止日前未交付汇报 PPT，且电话无人接听。',
    internalBlame: '特质归因直觉：“他就是一个拖延、散漫、毫无契约精神的人！”',
    hiddenContext: [
      { clue: '突发外部技术阻碍', details: '下午 3 点机房电源发生短路跳闸，本地未保存的文件损坏，他正带电脑在紧急数据恢复中心排队。' },
      { clue: '过往一贯表现', details: '过去 12 个月内，他连续 40 次项目全部提前交付，从未发生过违约。' },
      { clue: '突发家庭紧急状况', details: '其独居年迈父亲半小时前在卫生间摔倒送急诊，他当时正手忙脚乱在急救车上。' },
    ],
    empathyShiftReasoning: '基本归因错误让我们在他人犯错时迅速归咎于对方人品败坏，而在自己犯错时则归咎于情境身不由己。看到隐藏情境后，愤怒瞬间转化为理解与建设性支持。',
  },
  {
    id: 'scen-unread-msg',
    triggerEvent: '发了一条诚恳的长微信给挚友探讨合作，两天过去显示“已读”却无任何回复。',
    internalBlame: '特质归因直觉：“他发达了就看不起我了，故意冷落我装高傲！”',
    hiddenContext: [
      { clue: '信息接收时的物理状态', details: '在赶高铁安检时匆匆点开看了一眼，随后手机没电关机，进站后被领导连打 3 个长途电话打断。' },
      { clue: '沉重的心理负荷', details: '他极其看重你的提议，觉得在手机上草率回复两句很不尊重，打算周末专门留出 1 小时用电脑认真梳理复信。' },
    ],
    empathyShiftReasoning: '已读不回绝大多数时候只是注意力被现实突发事件打断或重视慎重的表现，盲目读心只会消耗珍贵的友谊。',
  },
  {
    id: 'scen-driver-cut',
    triggerEvent: '高架桥上一辆白色私家车突然不打转向灯强行超车变道，差点造成追尾。',
    internalBlame: '特质归因直觉：“真是个毫无道德底线的马路杀手，活该被吊销驾照！”',
    hiddenContext: [
      { clue: '车内紧急人员救助', details: '车后座妻子羊水破裂大出血，临产孕妇生命垂危，丈夫正心急如焚赶往妇产医院。' },
      { clue: '视线与反光镜盲区', details: '该车右后视镜刚刚被路过货车刮碰变形，驾驶员视角存在严重盲区。' },
    ],
    empathyShiftReasoning: '在马路上，我们总是把别人的变道归因于“流氓自私”，却把自己的变道解释为“我确实赶急事”。',
  },
];

export const AttributionShiftGame: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, recordGameResult } = useApp();

  const urlDiff = searchParams.get('difficulty') as GameDifficulty | null;
  const initialDiff: GameDifficulty = urlDiff && DIFFICULTY_LIST.includes(urlDiff) ? urlDiff : '中';

  const [difficulty, setDifficulty] = useState<GameDifficulty>(initialDiff);
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'debrief'>('intro');
  const [scenarios, setScenarios] = useState<AttributionScenario[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [revealedClues, setRevealedClues] = useState<number[]>([]);
  const [score, setScore] = useState(0);

  const diffConfig = DIFFICULTY_CONFIGS[difficulty];
  const isFirstTime = !(user.completedGames?.includes('attribution-shift'));

  const startSession = (selectedDiff: GameDifficulty = difficulty) => {
    gameAudio.playSuccess();
    const count = selectedDiff === '低' ? 1 : selectedDiff === '中' ? 2 : 3;
    const shuffled = shuffleArray(SCENARIOS_POOL).slice(0, count);
    setScenarios(shuffled);
    setCurrentIdx(0);
    setRevealedClues([]);
    setScore(0);
    setGameState('playing');
  };

  const scen = scenarios[currentIdx];

  const handleRevealClue = (idx: number) => {
    if (!revealedClues.includes(idx)) {
      gameAudio.playSelect();
      const next = [...revealedClues, idx];
      setRevealedClues(next);
      if (scen && next.length === scen.hiddenContext.length) {
        gameAudio.playSuccess();
      }
    }
  };

  const handleNext = () => {
    gameAudio.playTap();
    const pts = Math.round((1200 + revealedClues.length * 300) * diffConfig.scoreMultiplier);
    const newScore = score + pts;
    setScore(newScore);

    if (currentIdx < scenarios.length - 1) {
      setCurrentIdx(prev => prev + 1);
      setRevealedClues([]);
    } else {
      const calculatedXp = isFirstTime
        ? Math.round(38 * diffConfig.xpMultiplier)
        : Math.round(10 * diffConfig.xpMultiplier);

      recordGameResult('attribution-shift', {
        score: newScore,
        accuracy: 95,
        reactionTime: 860,
        xpGained: calculatedXp,
        comboMax: 3,
        conceptLearned: '基本归因错误（Fundamental Attribution Error）与同理心重构',
        lawId: 'fundamental-attribution-error',
        difficulty,
      });

      setGameState('debrief');
    }
  };

  const debriefData: DebriefData = {
    gameId: 'attribution-shift',
    gameTitle: '换位不读心',
    numberPrefix: '06',
    difficulty,
    score,
    accuracy: 95,
    isFirstTime,
    xpEarned: isFirstTime ? Math.round(40 * diffConfig.xpMultiplier) : Math.round(10 * diffConfig.xpMultiplier),
    bestAnswerReview:
      '面对他人的冒犯或异常行为，最佳心智策略是【汉隆剃刀原则（Hanlon\'s Razor）：能用疏忽或外部情境解释的，绝不轻易归咎于恶意】。主动探寻外部因果，停止自我折磨的负面读心。',
    psychologicalMechanism:
      '基本归因错误（Fundamental Attribution Error）是人类最普遍的认知顽疾：评价他人时高估内在性格、低估情境压力；评价自己时则反之。克服这一偏差能使人的人际情绪内耗瞬间降低 80% 以上。',
    actionableSummary: [
      '“3个善意假设法”：每当想指责别人时，强迫自己列出 3 种可能导致该行为的客观不可抗力情境。',
      '把“他为什么这么针对我”替换为“他究竟遭遇了什么困境”：焦点从自我防御转向同理探索。',
      '直接核对事实，不暗自揣摩：“我注意到昨天的方案还没收到，是否遇到了什么突发卡点？我能帮上什么？”',
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
          <span className="text-xs font-mono font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
            GAME 06
          </span>
        </div>

        <div className="w-full game-arcade-card rounded-3xl p-6 sm:p-8 border-purple-200/90 shadow-xl space-y-6 relative overflow-hidden">
          {/* Ambient colorful glow */}
          <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-gradient-to-br from-purple-500/30 to-violet-600/20 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-400/20 blur-2xl pointer-events-none" />

          {/* Animated Shuffle Monogram */}
          <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-600 shadow-lg shadow-purple-500/30 animate-pulseGlow" />
            <Shuffle className="w-10 h-10 text-white relative z-10" />
          </div>

          <div className="text-center space-y-2 relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-purple-800 bg-purple-50 border border-purple-200">
              <Sparkles className="w-3.5 h-3.5" />
              <span>基本归因错误 · 同理心重构</span>
            </div>
            <h1 className="font-serif-editorial text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
              06 · 换位不读心
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-sm mx-auto">
              拒绝只凭一次违约或冒犯直接判处别人死刑。翻开对方真实的外部压力底牌，实现从愤怒指责到成熟沟通的跨越。
            </p>
          </div>

          <div className="space-y-2 pt-2 border-t border-stone-200/60 text-left relative z-10">
            <div className="flex justify-between items-center text-xs font-bold text-stone-800">
              <span>选择训练难度：</span>
              <span className="text-purple-600 font-numeric">{diffConfig.multiplierText} 积分收益</span>
            </div>
            <DifficultySelector value={difficulty} onChange={setDifficulty} />
          </div>

          <button
            onClick={() => startSession(difficulty)}
            type="button"
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:opacity-95 text-white font-bold text-sm shadow-lg shadow-purple-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 relative z-10 game-btn-tactile"
          >
            <Shuffle className="w-4 h-4 text-white" />
            <span>开启归因翻转（{difficulty}难度 · {diffConfig.multiplierText} 积分加成）</span>
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
        title="06 · 换位不读心"
        numberPrefix="06"
        difficulty={difficulty}
        score={score}
        currentRound={currentIdx + 1}
        totalRounds={scenarios.length}
        onExit={() => setGameState('intro')}
        accentColor="#8B5CF6"
      />

      {scen && (
        <div className="w-full game-arcade-card rounded-3xl p-6 border-purple-100 shadow-xl space-y-5 animate-fadeIn bg-white relative overflow-hidden">
          {/* Scenario Trigger Card */}
          <div className="p-4 bg-gradient-to-r from-rose-50 to-orange-50 rounded-2xl border border-rose-200 space-y-1.5 shadow-2xs">
            <span className="text-[10px] font-black text-rose-800 bg-rose-100/90 px-2 py-0.5 rounded-md font-mono">
              TRIGGER EVENT #{currentIdx + 1} / {scenarios.length}
            </span>
            <p className="text-xs sm:text-[13px] font-bold text-stone-900 leading-snug font-sans">
              {scen.triggerEvent}
            </p>
          </div>

          {/* Internal Blame Callout */}
          <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 text-xs text-stone-600 italic font-serif-editorial">
            {scen.internalBlame}
          </div>

          {/* Clues Flip Cards */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-stone-900 flex items-center justify-between font-serif-editorial">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-600" />
                点击翻开隐藏在背后的客观真实情境：
              </span>
              <span className="text-[11px] font-numeric text-purple-600 font-bold">
                已翻开 {revealedClues.length} / {scen.hiddenContext.length}
              </span>
            </h4>

            <div className="space-y-2.5">
              {scen.hiddenContext.map((c, idx) => {
                const isRevealed = revealedClues.includes(idx);
                return (
                  <div
                    key={idx}
                    onClick={() => handleRevealClue(idx)}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                      isRevealed
                        ? 'bg-purple-50/80 border-purple-300 shadow-xs'
                        : 'bg-stone-50 hover:bg-stone-100 border-stone-200/90 border-dashed text-stone-400 hover:border-purple-300'
                    }`}
                  >
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-purple-950 flex items-center gap-1.5">
                        {isRevealed ? (
                          <Unlock className="w-3.5 h-3.5 text-purple-600" />
                        ) : (
                          <Lock className="w-3.5 h-3.5 text-stone-400" />
                        )}
                        线索 #{idx + 1}：{c.clue}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-stone-200">
                        {isRevealed ? '已探明' : '点击解锁'}
                      </span>
                    </div>

                    {isRevealed ? (
                      <p className="text-xs text-stone-700 leading-relaxed mt-2 animate-fadeIn font-sans">
                        {c.details}
                      </p>
                    ) : (
                      <div className="py-2 text-center text-xs text-stone-400 font-medium">
                        🔒 锁定中（点击透视客观不可抗力情境）
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Empathy Shift Callout */}
          {revealedClues.length === scen.hiddenContext.length && (
            <div className="p-4.5 bg-emerald-50/90 rounded-2xl border-2 border-emerald-300 text-xs text-emerald-950 space-y-1.5 animate-fadeIn shadow-2xs">
              <span className="font-bold flex items-center gap-1.5 font-serif-editorial text-sm text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>换位归因达成：停止无端恶意读心</span>
              </span>
              <p className="text-xs text-stone-700 leading-relaxed font-sans">
                {scen.empathyShiftReasoning}
              </p>
            </div>
          )}

          <button
            disabled={revealedClues.length < scen.hiddenContext.length}
            onClick={handleNext}
            type="button"
            className={`w-full py-4 font-bold text-xs sm:text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 game-btn-tactile ${
              revealedClues.length === scen.hiddenContext.length
                ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 text-white'
                : 'bg-stone-200 text-stone-400 cursor-not-allowed'
            }`}
          >
            <span>{currentIdx < scenarios.length - 1 ? '审视下一个冲突场景' : '完成实验生成研报'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Gift, CheckCircle2, RotateCcw, AlertTriangle, ArrowRight, ShieldCheck, DollarSign, Sparkles, ShoppingBag, Flame } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { GameDifficulty, DIFFICULTY_CONFIGS, DIFFICULTY_LIST, shuffleArray } from '../../data/difficulty';
import { DifficultySelector } from './DifficultySelector';
import { GameDebriefModal, DebriefData } from './GameDebriefModal';
import { GameHeaderHud } from './GameHeaderHud';
import { gameAudio } from '../../utils/gameAudio';

interface ZeroPriceChoice {
  label: string;
  isFreeBait: boolean;
  isOptimal: boolean;
  costBreakdown: string;
  opportunityCost: string;
}

interface ZeroPriceScenario {
  id: string;
  title: string;
  context: string;
  choices: ZeroPriceChoice[];
  rationalInsight: string;
}

const SCENARIOS_POOL: ZeroPriceScenario[] = [
  {
    id: 'scen-chocolate',
    title: '巧克力的零价格魔咒（丹·艾瑞里经典实验）',
    context: '摊位前同时摆放两款巧克力任你选购：顶级手工瑞士莲（原价 3.20 元）和普通量产好时水滴（原价 0.50 元）。',
    choices: [
      {
        label: '选项 A：花费 0.14 元购买价值 3.20 元的瑞士莲（直降 3.06 元）',
        isFreeBait: false,
        isOptimal: true,
        costBreakdown: '花 1 毛 4 享受顶级美味，净剩余价值高达 3.06 元！',
        opportunityCost: '理性最优决策：边际收益远超成本。',
      },
      {
        label: '选项 B：免费 0 元直接领取价值 0.50 元的好时水滴（直降 0.50 元）',
        isFreeBait: true,
        isOptimal: false,
        costBreakdown: '虽然花了 0 元，但净剩余价值仅有 0.50 元。',
        opportunityCost: '为了 0 元放弃了性价比高出 6 倍的顶级享受。',
      },
    ],
    rationalInsight: '丹·艾瑞里实验中：当两款都是收费时（如 0.15元 vs 0.01元），73% 的人选择瑞士莲；但只要将好时降价 1 分钱变成“0元”，高达 69% 的人会瞬间叛变转投免费！“免费”不是一个普通折扣，而是对大脑理性的多巴胺电击。',
  },
  {
    id: 'scen-shipping',
    title: '网购免运费的凑单黑洞',
    context: '你在网购急需的一本书（标价 39 元），结账提示：“满 99 元包邮，否则需支付 8 元基础运费”。',
    choices: [
      {
        label: '方案 A：果断直接支付 8 元运费，总计支付 47 元完成订单。',
        isFreeBait: false,
        isOptimal: true,
        costBreakdown: '实际支出 47 元，收到了 100% 需要的书籍，无冗余闲置。',
        opportunityCost: '用 8 元买到了干净高效，没有浪费 60 元买垃圾。',
      },
      {
        label: '方案 B：再凑 68 元买一件不怎么需要的网红香薰加湿器，享受“免运费”！',
        isFreeBait: true,
        isOptimal: false,
        costBreakdown: '为了省 8 元运费，实际多掏了 68 元现金，总支出高达 107 元！',
        opportunityCost: '香薰机在角落吃灰，纯属本末倒置。',
      },
    ],
    rationalInsight: '商家极其深谙心理账户与零价格效应：消费者极度厌恶纯粹的运费支出（认为运费是沉没损失），为了避免这种痛感，宁愿额外花费数倍现金去购买不需要的实体商品。',
  },
  {
    id: 'scen-free-gift',
    title: '烈日下排队 40 分钟免费领毛绒玩具',
    context: '商场中庭人山人海，只要排队 40 分钟并扫码关注 5 个公众号，就能“免费”领取一个批发价 8 元的玩偶。',
    choices: [
      {
        label: '方案 A：果断离开，去书店或咖啡厅专注阅读与休息。',
        isFreeBait: false,
        isOptimal: true,
        costBreakdown: '节约 40 分钟宝贵精力与防范个人隐私泄露。',
        opportunityCost: '时间按时薪折算价值远超 8 元玩偶。',
      },
      {
        label: '方案 B：加入长队，反正闲着也是闲着，不领白不领！',
        isFreeBait: true,
        isOptimal: false,
        costBreakdown: '消耗 40 分钟体力，手机被垃圾营销短信轰炸。',
        opportunityCost: '“免费”隐形盗走了最稀缺的时间与注意力资产。',
      },
    ],
    rationalInsight: '天下最贵的东西往往标价免费。真正的成本从来不是货币数字，而是注意力与时间机会成本。',
  },
];

export const ZeroPriceTrapGame: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, recordGameResult } = useApp();

  const urlDiff = searchParams.get('difficulty') as GameDifficulty | null;
  const initialDiff: GameDifficulty = urlDiff && DIFFICULTY_LIST.includes(urlDiff) ? urlDiff : '中';

  const [difficulty, setDifficulty] = useState<GameDifficulty>(initialDiff);
  const [gameState, setGameState] = useState<'intro' | 'choosing' | 'revealed' | 'debrief'>('intro');
  const [scenarios, setScenarios] = useState<ZeroPriceScenario[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedChoiceIdx, setSelectedChoiceIdx] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);

  const diffConfig = DIFFICULTY_CONFIGS[difficulty];
  const isFirstTime = !(user.completedGames?.includes('zero-price-trap'));

  const startSession = (selectedDiff: GameDifficulty = difficulty) => {
    gameAudio.playSuccess();
    const count = selectedDiff === '低' ? 1 : selectedDiff === '中' ? 2 : 3;
    const shuffled = shuffleArray(SCENARIOS_POOL).slice(0, count);
    const processed = shuffled.map(s => ({
      ...s,
      choices: shuffleArray(s.choices),
    }));
    setScenarios(processed);
    setCurrentIdx(0);
    setSelectedChoiceIdx(null);
    setScore(0);
    setCorrectCount(0);
    setGameState('choosing');
  };

  const scen = scenarios[currentIdx];

  const handleChoose = (idx: number) => {
    setSelectedChoiceIdx(idx);
    const chosen = scen.choices[idx];
    if (chosen.isOptimal) {
      gameAudio.playSuccess();
      const pts = Math.round(1500 * diffConfig.scoreMultiplier);
      setScore(prev => prev + pts);
      setCorrectCount(prev => prev + 1);
    } else {
      gameAudio.playMistake();
    }
    setGameState('revealed');
  };

  const handleNext = () => {
    gameAudio.playTap();
    if (currentIdx < scenarios.length - 1) {
      setCurrentIdx(prev => prev + 1);
      setSelectedChoiceIdx(null);
      setGameState('choosing');
    } else {
      const calculatedXp = isFirstTime
        ? Math.round(38 * diffConfig.xpMultiplier)
        : Math.round(10 * diffConfig.xpMultiplier);

      recordGameResult('zero-price-trap', {
        score,
        accuracy: Math.round((correctCount / scenarios.length) * 100),
        reactionTime: 920,
        xpGained: calculatedXp,
        comboMax: correctCount,
        conceptLearned: '零价格效应（Zero-Price Effect）与非理性心理账户',
        lawId: 'sunk-cost-fallacy',
        difficulty,
      });

      setGameState('debrief');
    }
  };

  const debriefData: DebriefData = {
    gameId: 'zero-price-trap',
    gameTitle: '免费陷阱',
    numberPrefix: '07',
    difficulty,
    score,
    accuracy: scenarios.length > 0 ? Math.round((correctCount / scenarios.length) * 100) : 100,
    isFirstTime,
    xpEarned: isFirstTime ? Math.round(40 * diffConfig.xpMultiplier) : Math.round(10 * diffConfig.xpMultiplier),
    bestAnswerReview:
      '面对任何“免费（0元）”诱惑时，最佳思维模型是【把时间、隐私与闲置成本折现计算】。问自己：“如果这件东西标价 10 元，我还会要它吗？”如果不会，立刻转身离开。',
    psychologicalMechanism:
      '零价格效应（Zero-Price Effect）证明，0 与 1 之间不仅是 1 个单位的差值，而是在大脑中触发完全不同的认知回路。普通价格会激发“收益 vs 损失”的权衡；但“0元”会让损失风险彻底消失，直接引爆无脑抢购冲动。',
    actionableSummary: [
      '“免费试用防反噬”：绑卡免费试用前，立即在手机日历设置倒计时前 2 天取消提醒。',
      '坚决不为了凑单免运费买多余垃圾：宁可付 8 元运费，也绝不多花 50 元买无用闲置。',
      '尊重自己的注意力资产：排长队领鸡蛋或低质赠品，是在以极低时薪出卖不可逆的生命时间。',
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
          <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            GAME 07
          </span>
        </div>

        <div className="w-full game-arcade-card rounded-3xl p-6 sm:p-8 border-emerald-200/90 shadow-xl space-y-6 relative overflow-hidden">
          {/* Ambient colorful glow */}
          <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-gradient-to-br from-emerald-500/30 to-teal-600/20 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-gradient-to-br from-amber-400/20 to-emerald-400/20 blur-2xl pointer-events-none" />

          {/* Animated Gift Monogram */}
          <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30 animate-pulseGlow" />
            <Gift className="w-10 h-10 text-white relative z-10" />
          </div>

          <div className="text-center space-y-2 relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200">
              <Sparkles className="w-3.5 h-3.5" />
              <span>零价格效应 · 机会成本觉醒</span>
            </div>
            <h1 className="font-serif-editorial text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
              07 · 免费陷阱
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-sm mx-auto">
              体验“0元免费”如何悄无声息瘫痪大脑的理性算力。看清隐藏在免费背后的隐性代价，学会像经济学家一样思考机会成本。
            </p>
          </div>

          <div className="space-y-2 pt-2 border-t border-stone-200/60 text-left relative z-10">
            <div className="flex justify-between items-center text-xs font-bold text-stone-800">
              <span>选择训练难度：</span>
              <span className="text-emerald-600 font-numeric">{diffConfig.multiplierText} 积分收益</span>
            </div>
            <DifficultySelector value={difficulty} onChange={setDifficulty} />
          </div>

          <button
            onClick={() => startSession(difficulty)}
            type="button"
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-700 hover:opacity-95 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 relative z-10 game-btn-tactile"
          >
            <Gift className="w-4 h-4 text-white" />
            <span>开启决策攻防（{difficulty}难度 · {diffConfig.multiplierText} 积分加成）</span>
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
        title="07 · 免费陷阱"
        numberPrefix="07"
        difficulty={difficulty}
        score={score}
        combo={correctCount}
        currentRound={currentIdx + 1}
        totalRounds={scenarios.length}
        onExit={() => setGameState('intro')}
        accentColor="#10B981"
      />

      {scen && (
        <div className="w-full game-arcade-card rounded-3xl p-6 border-emerald-100 shadow-xl space-y-5 animate-fadeIn bg-white relative overflow-hidden">
          {/* Scenario Header */}
          <div className="space-y-1.5 border-b border-stone-200/70 pb-3.5">
            <span className="text-[10px] font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 font-mono">
              ZERO-PRICE DILEMMA #{currentIdx + 1} / {scenarios.length}
            </span>
            <h2 className="text-xl font-bold text-stone-900 font-serif-editorial">
              {scen.title}
            </h2>
            <div className="text-xs text-stone-700 leading-relaxed bg-stone-50 p-3.5 rounded-2xl border border-stone-200/80 font-sans mt-2">
              {scen.context}
            </div>
          </div>

          {/* Choices */}
          <div className="space-y-3 pt-1">
            <h4 className="text-xs font-bold text-stone-900 font-serif-editorial">
              面对诱惑，你的理性决策是：
            </h4>

            <div className="grid grid-cols-1 gap-3">
              {scen.choices.map((c, idx) => {
                const isSelected = selectedChoiceIdx === idx;
                return (
                  <button
                    key={idx}
                    disabled={gameState === 'revealed'}
                    onClick={() => handleChoose(idx)}
                    type="button"
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                      isSelected
                        ? c.isOptimal
                          ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-semibold shadow-md shadow-emerald-500/15'
                          : 'bg-rose-50 border-rose-400 text-rose-950 font-semibold shadow-md shadow-rose-500/15'
                        : 'bg-white hover:bg-stone-50 border-stone-200 text-stone-800 hover:border-emerald-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs sm:text-[13px] font-bold leading-snug font-sans">{c.label}</span>
                      {isSelected && (
                        c.isOptimal ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                        )
                      )}
                    </div>

                    {gameState === 'revealed' && (
                      <div className="mt-3 pt-2.5 border-t border-stone-200/70 text-xs space-y-1 animate-fadeIn font-sans">
                        <div className="text-stone-700 font-medium"><strong>成本收益核算：</strong>{c.costBreakdown}</div>
                        <div className="text-stone-500 text-[11px] font-normal">{c.opportunityCost}</div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Rational Insight Reveal */}
          {gameState === 'revealed' && (
            <div className="p-4.5 rounded-2xl bg-[#FAF8F5] border border-amber-200 space-y-2 text-xs text-stone-700 animate-fadeIn shadow-2xs">
              <span className="font-bold text-stone-900 block font-serif-editorial flex items-center gap-1.5 text-sm">
                <Sparkles className="w-4 h-4 text-amber-600" />
                行为经济学深度解析：
              </span>
              <p className="leading-relaxed font-sans">
                {scen.rationalInsight}
              </p>

              <button
                onClick={handleNext}
                type="button"
                className="w-full mt-3 py-4 bg-gradient-to-r from-stone-900 to-emerald-950 hover:opacity-95 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 game-btn-tactile"
              >
                <span>{currentIdx < scenarios.length - 1 ? '审视下一个消费情境' : '完成实验生成研报'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

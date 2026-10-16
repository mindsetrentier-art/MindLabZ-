import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Anchor, Sparkles, CheckCircle2, RotateCcw, AlertCircle, ArrowRight, DollarSign, TrendingUp, Compass, Award } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { GameDifficulty, DIFFICULTY_CONFIGS, DIFFICULTY_LIST, shuffleArray } from '../../data/difficulty';
import { DifficultySelector } from './DifficultySelector';
import { GameDebriefModal, DebriefData } from './GameDebriefModal';
import { GameHeaderHud } from './GameHeaderHud';
import { gameAudio } from '../../utils/gameAudio';

interface AnchoringItem {
  id: string;
  title: string;
  category: string;
  description: string;
  anchorType: 'high' | 'low';
  anchorValue: number;
  anchorContext: string;
  actualMarketValue: number;
  minRange: number;
  maxRange: number;
  unit: string;
  debiasingHint: string;
}

const ITEMS_POOL: AnchoringItem[] = [
  {
    id: 'item-watch',
    title: '1970年代经典机械腕表（非贵金属款）',
    category: '古董收藏',
    description: '一枚保存完好、走时精准的瑞士古董机械腕表，具备经典计时功能与原装盘面。',
    anchorType: 'high',
    anchorValue: 128000,
    anchorContext: '某高端拍卖行画册在醒目封面上推荐了一块同年代特殊联名款，拍出了 128,000 元天价。',
    actualMarketValue: 18500,
    minRange: 5000,
    maxRange: 150000,
    unit: '元',
    debiasingHint: '天价拍卖款往往包含罕见的特定编号溢价，普通款应只按机芯型号与品相折算真实残值。',
  },
  {
    id: 'item-server',
    title: '高配 AI 训练 GPU 服务器集群（单月算力租金）',
    category: '科技硬件',
    description: '包含 8 张 H100 80GB 顶级算力加速卡的高性能独立服务器，包含高速带宽与电力托管。',
    anchorType: 'low',
    anchorValue: 4800,
    anchorContext: '某轻量级云厂商首页横幅广告打出：“云主机低至 4,800 元/月起抢购”。',
    actualMarketValue: 32000,
    minRange: 2000,
    maxRange: 60000,
    unit: '元/月',
    debiasingHint: '“起步价”通常只代表单卡或低配虚拟分片，8卡高规独立整机的硬件折旧与电费成本远超几千元。',
  },
  {
    id: 'item-apartment',
    title: '欧洲核心艺术街区 35㎡ 精装顶层公寓（单月租金）',
    category: '不动产租售',
    description: '位于市中心历史保护建筑顶层，带法式露台、全套智能家电，距离地铁步行 3 分钟。',
    anchorType: 'high',
    anchorValue: 24000,
    anchorContext: '同楼另一间由好莱坞明星短租过的同户型套房在 Airbnb 上标价折合 24,000 元/月。',
    actualMarketValue: 11500,
    minRange: 4000,
    maxRange: 30000,
    unit: '元/月',
    debiasingHint: '短租民宿包含高频布草与平台高额抽成，不能直接作为长租房产的月均公允估值锚点。',
  },
  {
    id: 'item-suit',
    title: '纯手工剪裁双面羊绒定制风衣',
    category: '高端服饰',
    description: '选用顶级内蒙古白山羊绒原料，耗时 48 工时由老师傅手工缝制。',
    anchorType: 'low',
    anchorValue: 1200,
    anchorContext: '某电商直播间主播高喊：“羊绒大衣破价宠粉，今天工厂直出只要 1,200 元！”',
    actualMarketValue: 6800,
    minRange: 800,
    maxRange: 15000,
    unit: '元',
    debiasingHint: '真正的优质纯羊绒仅面料原料成本即高达数千元，千元低价通常严重混纺或掺杂化纤。',
  },
];

export const AnchoringLabGame: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, recordGameResult } = useApp();

  const urlDiff = searchParams.get('difficulty') as GameDifficulty | null;
  const initialDiff: GameDifficulty = urlDiff && DIFFICULTY_LIST.includes(urlDiff) ? urlDiff : '中';

  const [difficulty, setDifficulty] = useState<GameDifficulty>(initialDiff);
  const [gameState, setGameState] = useState<'intro' | 'estimating' | 'revealed' | 'debrief'>('intro');
  const [items, setItems] = useState<AnchoringItem[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userEstimate, setUserEstimate] = useState<number>(10000);
  const [score, setScore] = useState(0);
  const [totalDeviations, setTotalDeviations] = useState<number[]>([]);

  const diffConfig = DIFFICULTY_CONFIGS[difficulty];
  const isFirstTime = !(user.completedGames?.includes('anchoring-lab'));

  const startSession = (selectedDiff: GameDifficulty = difficulty) => {
    gameAudio.playSuccess();
    const count = selectedDiff === '低' ? 2 : selectedDiff === '中' ? 3 : 4;
    const shuffled = shuffleArray(ITEMS_POOL).slice(0, count);
    setItems(shuffled);
    setCurrentIdx(0);
    setUserEstimate(Math.round((shuffled[0].minRange + shuffled[0].maxRange) / 2));
    setScore(0);
    setTotalDeviations([]);
    setGameState('estimating');
  };

  const currentItem = items[currentIdx];

  const handleEstimateChange = (val: number) => {
    setUserEstimate(val);
  };

  const handleEstimateSubmit = () => {
    if (!currentItem) return;
    gameAudio.playSelect();

    // Calculate accuracy: error relative to actual market value
    const errorRatio = Math.abs(userEstimate - currentItem.actualMarketValue) / currentItem.actualMarketValue;
    const accuracyPct = Math.max(0, Math.round((1 - Math.min(1, errorRatio)) * 100));

    // Anchor pull: how close user estimate was dragged towards the anchor
    const anchorDistance = Math.abs(currentItem.anchorValue - currentItem.actualMarketValue);
    const userToActual = Math.abs(userEstimate - currentItem.actualMarketValue);
    const pullRatio = Math.min(100, Math.round((userToActual / (anchorDistance || 1)) * 100));

    setTotalDeviations(prev => [...prev, pullRatio]);

    const pts = Math.round((accuracyPct * 16 + 750) * diffConfig.scoreMultiplier);
    setScore(prev => prev + pts);
    setGameState('revealed');
  };

  const handleNextItem = () => {
    gameAudio.playTap();
    if (currentIdx < items.length - 1) {
      const nextIdx = currentIdx + 1;
      setCurrentIdx(nextIdx);
      setUserEstimate(Math.round((items[nextIdx].minRange + items[nextIdx].maxRange) / 2));
      setGameState('estimating');
    } else {
      const calculatedXp = isFirstTime
        ? Math.round(38 * diffConfig.xpMultiplier)
        : Math.round(10 * diffConfig.xpMultiplier);

      recordGameResult('anchoring-lab', {
        score,
        accuracy: 92,
        reactionTime: 920,
        xpGained: calculatedXp,
        comboMax: items.length,
        conceptLearned: '锚定效应（Anchoring Effect）与去锚定理性评估法',
        lawId: 'anchoring-effect',
        difficulty,
      });

      setGameState('debrief');
    }
  };

  const debriefData: DebriefData = {
    gameId: 'anchoring-lab',
    gameTitle: '锚点实验室',
    numberPrefix: '02',
    difficulty,
    score,
    accuracy: 92,
    isFirstTime,
    xpEarned: isFirstTime ? Math.round(38 * diffConfig.xpMultiplier) : Math.round(10 * diffConfig.xpMultiplier),
    bestAnswerReview:
      '面对任何前置标价或数字信息时，最佳策略是【主动去锚，自下而上重构估值】。绝不把对方的第一句话当成议价起点，而是列出基础边际成本，独立设定心理价格底线。',
    psychologicalMechanism:
      '特沃斯基与卡尼曼发现，大脑面对未知信息时会本能依赖最近出现的数据作为参照点（Anchor），然后进行极度保守的不足调整（Insufficient Adjustment）。哪怕是幸运轮盘摇出的纯随机数字，也能系统性扭曲受试者的数字预估。',
    actionableSummary: [
      '在商务谈判中“抢先抛出锚点”或“直接击碎虚假锚”：若对方给出荒谬高价，直接拒绝基于该数字谈判。',
      '倒推边际成本：算力、房租、定制大衣都有物理成本下限，不被浮夸故事或噱头低价蒙蔽。',
      '建立“平行独立估值清单”：在查阅市场标价前，先自己盲测写下一个理性公允价格区间。',
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
          <span className="text-xs font-mono font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
            GAME 02
          </span>
        </div>

        <div className="w-full game-arcade-card rounded-3xl p-6 sm:p-8 border-sky-200/90 shadow-xl space-y-6 relative overflow-hidden">
          {/* Ambient colorful glow */}
          <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-gradient-to-br from-sky-400/30 to-blue-600/20 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-gradient-to-br from-amber-400/20 to-sky-400/20 blur-2xl pointer-events-none" />

          {/* Animated Anchor Monogram */}
          <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 shadow-lg shadow-sky-500/30 animate-pulseGlow" />
            <Anchor className="w-10 h-10 text-white relative z-10" />
          </div>

          <div className="text-center space-y-2 relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-sky-700 bg-sky-50 border border-sky-200">
              <Sparkles className="w-3.5 h-3.5" />
              <span>锚定效应 · 价格估值实测</span>
            </div>
            <h1 className="font-serif-editorial text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
              02 · 锚点实验室
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-sm mx-auto">
              体验第一个接触的价格数字如何像钢锚一样拖拽你的判断。通过实测估值与真实公允价值的对比，掌握打破认知束缚的去锚法。
            </p>
          </div>

          <div className="space-y-2 pt-2 border-t border-stone-200/60 text-left relative z-10">
            <div className="flex justify-between items-center text-xs font-bold text-stone-800">
              <span>选择挑战难度：</span>
              <span className="text-sky-600 font-numeric">{diffConfig.multiplierText} 积分收益</span>
            </div>
            <DifficultySelector value={difficulty} onChange={setDifficulty} />
          </div>

          <button
            onClick={() => startSession(difficulty)}
            type="button"
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold text-sm shadow-lg shadow-sky-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 relative z-10 game-btn-tactile"
          >
            <Anchor className="w-4 h-4 text-white" />
            <span>进入估值实验室（{difficulty}难度 · {diffConfig.multiplierText} 积分加成）</span>
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
      {/* Game Header HUD */}
      <GameHeaderHud
        title="02 · 锚点实验室"
        numberPrefix="02"
        difficulty={difficulty}
        score={score}
        currentRound={currentIdx + 1}
        totalRounds={items.length}
        onExit={() => setGameState('intro')}
        accentColor="#0284C7"
      />

      {currentItem && (
        <div className="w-full game-arcade-card rounded-3xl p-6 border-sky-100 shadow-xl space-y-5 animate-fadeIn relative overflow-hidden bg-white">
          {/* Item Header */}
          <div className="border-b border-stone-200/70 pb-3.5 space-y-1.5">
            <span className="text-[10px] font-black text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200 font-mono">
              VALUATION #{currentIdx + 1} / {items.length} · {currentItem.category}
            </span>
            <h2 className="text-xl font-bold text-stone-900 font-serif-editorial">
              {currentItem.title}
            </h2>
            <p className="text-xs text-stone-600 leading-relaxed font-sans">
              {currentItem.description}
            </p>
          </div>

          {/* Anchor Clue Exposure Box */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-300 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
              <Anchor className="w-4 h-4 text-amber-600" />
              <span>你无意中接触到的前置参考信息（潜意识锚点）：</span>
            </div>
            <p className="text-xs text-stone-700 leading-relaxed font-sans">
              {currentItem.anchorContext}
            </p>
            <div className="pt-1 flex items-center justify-between">
              <span className="text-xs text-stone-500 font-medium">先验锚定标价：</span>
              <span className="text-base font-black text-amber-900 font-numeric bg-amber-100/80 px-2.5 py-0.5 rounded-lg border border-amber-300">
                {currentItem.anchorValue.toLocaleString()} {currentItem.unit}
              </span>
            </div>
          </div>

          {/* Estimating View */}
          {gameState === 'estimating' ? (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-4.5 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-stone-800">请给出你的独立估值（滑动估价）：</span>
                  <span className="text-lg font-black text-sky-600 font-numeric bg-sky-50 px-2.5 py-0.5 rounded-lg border border-sky-200">
                    {userEstimate.toLocaleString()} {currentItem.unit}
                  </span>
                </div>

                <input
                  type="range"
                  min={currentItem.minRange}
                  max={currentItem.maxRange}
                  step={Math.round((currentItem.maxRange - currentItem.minRange) / 100)}
                  value={userEstimate}
                  onChange={(e) => handleEstimateChange(Number(e.target.value))}
                  className="w-full accent-sky-600 cursor-pointer h-2 bg-stone-200 rounded-lg"
                />

                <div className="flex justify-between text-[10px] text-stone-400 font-numeric font-medium">
                  <span>最低标尺 {currentItem.minRange.toLocaleString()} {currentItem.unit}</span>
                  <span>最高标尺 {currentItem.maxRange.toLocaleString()} {currentItem.unit}</span>
                </div>
              </div>

              <button
                onClick={handleEstimateSubmit}
                type="button"
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold text-sm shadow-md shadow-sky-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 game-btn-tactile"
              >
                <span>锁定估值，揭晓市场真相</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* Revealed Comparison Screen */
            <div className="space-y-4 animate-fadeIn">
              <div className="grid grid-cols-2 gap-3 font-numeric text-center">
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 shadow-2xs">
                  <span className="text-[10px] text-stone-500 font-semibold block">你的独立估值</span>
                  <span className="text-lg font-black text-stone-900 mt-1 block">
                    {userEstimate.toLocaleString()} {currentItem.unit}
                  </span>
                </div>
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-300 shadow-2xs">
                  <span className="text-[10px] text-emerald-700 font-semibold block">真实市场公允价</span>
                  <span className="text-lg font-black text-emerald-700 mt-1 block">
                    {currentItem.actualMarketValue.toLocaleString()} {currentItem.unit}
                  </span>
                </div>
              </div>

              {/* Debiasing Insight Box */}
              <div className="p-4.5 bg-[#FAF8F5] rounded-2xl border border-amber-200 space-y-1.5 text-xs text-stone-700 shadow-2xs">
                <div className="flex items-center gap-1.5 font-bold text-stone-900 font-serif-editorial">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>去锚定破局深度复盘：</span>
                </div>
                <p className="leading-relaxed font-sans">
                  {currentItem.debiasingHint}
                </p>
              </div>

              <button
                onClick={handleNextItem}
                type="button"
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-stone-900 via-slate-900 to-indigo-950 hover:opacity-95 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 game-btn-tactile"
              >
                <span>{currentIdx < items.length - 1 ? '审视下一个估值标的' : '生成实验研报'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

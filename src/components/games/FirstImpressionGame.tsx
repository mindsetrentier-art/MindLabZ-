import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Eye, Sparkles, CheckCircle2, RotateCcw, AlertTriangle, ArrowRight, ShieldCheck, Flame, UserCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { GameDifficulty, DIFFICULTY_CONFIGS, DIFFICULTY_LIST, shuffleArray } from '../../data/difficulty';
import { DifficultySelector } from './DifficultySelector';
import { GameDebriefModal, DebriefData } from './GameDebriefModal';
import { GameHeaderHud } from './GameHeaderHud';
import { gameAudio } from '../../utils/gameAudio';

interface ProfileCase {
  id: string;
  name: string;
  role: string;
  themeColor: string;
  gradientBg: string;
  initialImpression: {
    description: string;
    firstTags: string[];
    apparentFlaw: string;
  };
  hiddenTruths: {
    fact: string;
    context: string;
    revealedCategory: '专业操守' | '高压困境' | '真实日常';
  }[];
  idealConclusion: string;
}

const CASES_POOL: ProfileCase[] = [
  {
    id: 'case-tech-lead',
    name: '林越 · Vincent',
    role: '高级分布式系统架构师',
    themeColor: '#6366F1',
    gradientBg: 'from-indigo-500/20 via-purple-500/10 to-transparent',
    initialImpression: {
      description: '入职第一周晨会总是迟到 5 分钟，说话语速极快且面无表情。在技术方案评审时直接当面打断同事：“这个实现逻辑很业余”。被多名新同事私下吐槽“极度傲慢且冷血”。',
      firstTags: ['傲慢自负', '不尊重同事', '极难沟通'],
      apparentFlaw: '缺乏团队亲和力与同理心',
    },
    hiddenTruths: [
      {
        fact: '清晨 6 点在重症监护室给母亲喂流食',
        context: '母亲刚做完心脏搭桥手术，每天清晨天不亮去医院换药交代医嘱，赶去公司路上从未吃过早饭。',
        revealedCategory: '高压困境',
      },
      {
        fact: '深夜默默修复线上致命 SQL 注入漏洞',
        context: '入职第 3 天通宵修复系统隐患，并在合并日志里将表彰署上了全组所有初级工程师的名字。',
        revealedCategory: '真实日常',
      },
      {
        fact: '阿斯伯格认知特质：对代码纯粹性极度偏执',
        context: '对技术逻辑严谨性有生理性执着，对人际世故极不敏感，绝无针对贬低他人的主观恶意。',
        revealedCategory: '专业操守',
      },
    ],
    idealConclusion: '林越并非傲慢，而是身处重压且属于纯技术思维特质的高效工程师。初印象被首因效应（面无表情+打断）彻底放大。',
  },
  {
    id: 'case-designer',
    name: '苏夏 · Summer',
    role: '自由职业资深交互设计师',
    themeColor: '#EC4899',
    gradientBg: 'from-pink-500/20 via-rose-500/10 to-transparent',
    initialImpression: {
      description: '初次线下提案时身穿褪色卫衣，随身帆布包磨破了角，手捧一杯廉价速溶咖啡，且迟迟不拿出版面精美的画册，被甲方初评“缺乏职业体面、很不靠谱”。',
      firstTags: ['衣着随意', '准备仓促', '业余不专业'],
      apparentFlaw: '外在包装与高端品牌不匹配',
    },
    hiddenTruths: [
      {
        fact: '连续三年斩获红点至尊与 iF 金奖',
        context: '其主导的视障无障碍医疗 App 曾帮助全球 80 万视障患者在线就诊，是业内顶尖专家。',
        revealedCategory: '专业操守',
      },
      {
        fact: '刚从偏远山区乡村小学支教回城',
        context: '在乡村小学免费设计并改造了 3 所模块化多媒体图书角，刚下高铁便直奔会议现场。',
        revealedCategory: '高压困境',
      },
      {
        fact: '坚守极简生活哲学与无物欲追求',
        context: '奉行“作品比外表发声更响”的信念，把 70% 咨询收入捐助给乡村儿童美育基金。',
        revealedCategory: '真实日常',
      },
    ],
    idealConclusion: '外表的质朴随意被反向晕轮效应投射为“专业能力业余”。当拆解开其真实履历与生活信念，初印象的荒谬不攻自破。',
  },
  {
    id: 'case-manager',
    name: '程峰 · Frank',
    role: '项目交付总监',
    themeColor: '#3B82F6',
    gradientBg: 'from-blue-500/20 via-cyan-500/10 to-transparent',
    initialImpression: {
      description: '首次接洽时谈吐极为圆滑，热情洋溢，满口答应“两周内无条件搞定全部定制需求”，给团队第一直觉是“信口开河的油腻老油条销售”。',
      firstTags: ['画大饼', '浮夸油滑', '言过其实'],
      apparentFlaw: '缺乏做实事的严谨性',
    },
    hiddenTruths: [
      {
        fact: '手里储备了 3 套成熟经过实测的通用脚手架',
        context: '敢于承诺并非信口开河，而是他在过去类似项目沉淀了 90% 的自动化成熟模块。',
        revealedCategory: '专业操守',
      },
      {
        fact: '以保护团队不受外部高压甩锅著称',
        context: '对客户极力维护关系是为了给后台开发团队争取免受频繁需求变动干扰的纯净缓冲期。',
        revealedCategory: '真实日常',
      },
      {
        fact: '曾经因为过分死板诚实失去大单导致前团队解散',
        context: '深知商业沟通中建立前期信心的重要性，学会了在保持交付底线的同时提供高度情绪价值。',
        revealedCategory: '高压困境',
      },
    ],
    idealConclusion: '将善于人际润滑与商业信心建立者标签化为“油滑”，是典型的直觉确认偏误。深入其底牌才能看清其专业交付护城河。',
  },
];

export const FirstImpressionGame: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, recordGameResult } = useApp();

  const urlDiff = searchParams.get('difficulty') as GameDifficulty | null;
  const initialDiff: GameDifficulty = urlDiff && DIFFICULTY_LIST.includes(urlDiff) ? urlDiff : '中';

  const [difficulty, setDifficulty] = useState<GameDifficulty>(initialDiff);
  const [gameState, setGameState] = useState<'intro' | 'step1' | 'step2' | 'step3' | 'debrief'>('intro');
  const [activeCases, setActiveCases] = useState<ProfileCase[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);

  const [initialRating, setInitialRating] = useState<number>(2);
  const [revealedFacts, setRevealedFacts] = useState<number[]>([]);
  const [finalRating, setFinalRating] = useState<number>(4);
  const [score, setScore] = useState(0);

  const diffConfig = DIFFICULTY_CONFIGS[difficulty];
  const isFirstTime = !(user.completedGames?.includes('first-impression'));

  const startSession = (selectedDiff: GameDifficulty = difficulty) => {
    gameAudio.playSuccess();
    const count = selectedDiff === '低' ? 1 : selectedDiff === '中' ? 2 : 3;
    const shuffled = shuffleArray(CASES_POOL).slice(0, count);
    setActiveCases(shuffled);
    setCurrentIdx(0);
    setInitialRating(2);
    setRevealedFacts([]);
    setFinalRating(4);
    setScore(0);
    setGameState('step1');
  };

  const currentCase = activeCases[currentIdx];

  const handleFinishStep1 = () => {
    gameAudio.playTap();
    setGameState('step2');
  };

  const toggleRevealFact = (idx: number) => {
    if (!revealedFacts.includes(idx)) {
      gameAudio.playSelect();
      setRevealedFacts(prev => [...prev, idx]);
    }
  };

  const handleFinishStep2 = () => {
    gameAudio.playTap();
    setGameState('step3');
  };

  const handleFinishCase = () => {
    gameAudio.playSuccess();
    const shift = Math.abs(finalRating - initialRating);
    const roundScore = Math.round((1400 + shift * 450 + revealedFacts.length * 250) * diffConfig.scoreMultiplier);
    const newTotalScore = score + roundScore;
    setScore(newTotalScore);

    if (currentIdx < activeCases.length - 1) {
      setCurrentIdx(prev => prev + 1);
      setInitialRating(2);
      setRevealedFacts([]);
      setFinalRating(4);
      setGameState('step1');
    } else {
      const calculatedXp = isFirstTime
        ? Math.round(38 * diffConfig.xpMultiplier)
        : Math.round(10 * diffConfig.xpMultiplier);

      recordGameResult('first-impression', {
        score: newTotalScore,
        accuracy: 96,
        reactionTime: 820,
        xpGained: calculatedXp,
        comboMax: activeCases.length,
        conceptLearned: '首因效应（Primacy Effect）与确认偏误的延迟判断策略',
        lawId: 'primacy-effect',
        difficulty,
      });

      setGameState('debrief');
    }
  };

  const debriefData: DebriefData = {
    gameId: 'first-impression',
    gameTitle: '第一眼判断',
    numberPrefix: '01',
    difficulty,
    score,
    accuracy: 95,
    isFirstTime,
    xpEarned: isFirstTime ? Math.round(40 * diffConfig.xpMultiplier) : Math.round(10 * diffConfig.xpMultiplier),
    bestAnswerReview:
      '面对初次接触的人或事物，最高阶的心智策略是【延迟定论，保持观察】。承认第一眼直觉仅仅是一种“神经自动化假说”，在收集到至少 3 个独立情境事实前，绝不下盖棺定论。',
    psychologicalMechanism:
      '首因效应（Primacy Effect）揭示最先输入的大脑信息会占据显著的记忆优势；叠加确认偏误（Confirmation Bias），大脑会本能过滤与初印象矛盾的事实，只搜集符合初印象的线索，从而陷入严重认知闭环。',
    actionableSummary: [
      '建立“72小时观察冷静期”：在职场面试、新同事合作或相亲初识中，强制延迟做出人格品质定性。',
      '主动寻找“反向线索”：问自己“如果他是相反的人，他在什么情境下也会做出这个行为？”',
      '区分“一次性行为”与“内在品格”：迟到或寡言是一次性行为模式，不等于冷血与傲慢。',
    ],
  };

  // INTRO SCREEN
  if (gameState === 'intro') {
    return (
      <div className="flex flex-col items-center justify-start min-h-[85vh] w-full max-w-lg mx-auto py-4 px-2">
        <div className="w-full flex items-center justify-between mb-4">
          <button
            onClick={() => navigate('/games')}
            className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>返回竞技场</span>
          </button>
          <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
            GAME 01
          </span>
        </div>

        {/* Hero Game Card with Vibrant Radiant Aura */}
        <div className="w-full game-arcade-card rounded-3xl p-6 sm:p-8 border-indigo-200/80 shadow-xl space-y-6 relative overflow-hidden">
          {/* Ambient colorful glow */}
          <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-gradient-to-br from-indigo-500/30 to-purple-500/20 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-gradient-to-br from-pink-500/20 to-indigo-500/20 blur-2xl pointer-events-none" />

          {/* Animated Eye Monogram */}
          <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 shadow-lg shadow-indigo-500/30 animate-pulseGlow" />
            <Eye className="w-10 h-10 text-white relative z-10" />
          </div>

          <div className="text-center space-y-2 relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200">
              <Sparkles className="w-3.5 h-3.5" />
              <span>首因效应 · 破除初印象偏误</span>
            </div>
            <h1 className="font-serif-editorial text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
              01 · 第一眼判断
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-sm mx-auto">
              前 3 秒看到的特征，真能代表人品全貌吗？进入人物心理实测，从表面瑕疵到底层真相，打破过早下定论的认知枷锁。
            </p>
          </div>

          {/* Difficulty Setting */}
          <div className="space-y-2 pt-2 border-t border-stone-200/60 text-left relative z-10">
            <div className="flex justify-between items-center text-xs font-bold text-stone-800">
              <span>选择挑战难度：</span>
              <span className="text-indigo-600 font-numeric">{diffConfig.multiplierText} 积分收益</span>
            </div>
            <DifficultySelector value={difficulty} onChange={setDifficulty} />
          </div>

          <button
            onClick={() => startSession(difficulty)}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-sm shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 relative z-10 game-btn-tactile"
          >
            <Eye className="w-4 h-4 text-white" />
            <span>开启探索（{difficulty}难度 · {diffConfig.multiplierText} 积分加成）</span>
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
      {/* HUD Header */}
      <GameHeaderHud
        title="01 · 第一眼判断"
        numberPrefix="01"
        difficulty={difficulty}
        score={score}
        onExit={() => setGameState('intro')}
      />

      {currentCase && (
        <div className="w-full game-arcade-card rounded-3xl p-6 border-stone-200/90 shadow-xl space-y-5 animate-fadeIn relative overflow-hidden">
          {/* Subtle gradient backdrop header */}
          <div className={`absolute top-0 left-0 right-0 h-32 bg-gradient-to-b ${currentCase.gradientBg} pointer-events-none`} />

          {/* Character Header */}
          <div className="flex items-start justify-between border-b border-stone-200/70 pb-4 relative z-10">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200 font-mono">
                CASE #{currentIdx + 1} / {activeCases.length}
              </span>
              <h2 className="text-xl font-bold text-stone-900 font-serif-editorial">
                {currentCase.name}
              </h2>
              <p className="text-xs text-stone-500 font-serif-editorial">
                身份职务：{currentCase.role}
              </p>
            </div>

            {/* Glowing Geometric Avatar */}
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-md shadow-indigo-500/20"
              style={{ backgroundColor: currentCase.themeColor }}
            >
              <UserCheck className="w-7 h-7" />
            </div>
          </div>

          {/* STEP 1: First Impression Exposure */}
          {gameState === 'step1' && (
            <div className="space-y-4 animate-fadeIn relative z-10">
              <div className="bg-amber-500/10 p-4 rounded-2xl border border-amber-300 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>阶段一：初次接触现场记录（前 3 秒印象）</span>
                </div>
                <p className="text-xs sm:text-[13px] text-stone-700 leading-relaxed font-sans">
                  {currentCase.initialImpression.description}
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-800 block mb-2">
                  大脑本能浮现的第一印象标签：
                </label>
                <div className="flex flex-wrap gap-2">
                  {currentCase.initialImpression.firstTags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 bg-rose-50 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 shadow-xs"
                    >
                      🏷️ {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Initial Rating Slider with Color Fill */}
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-stone-800">此时你对该人物的第一印象好感：</span>
                  <span className="font-numeric font-extrabold text-indigo-600 text-sm">
                    {initialRating} 分 / 5 分
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={initialRating}
                  onChange={(e) => setInitialRating(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer h-2 bg-stone-200 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-stone-400 font-numeric">
                  <span>1分 (极度负面/排斥)</span>
                  <span>3分 (中立)</span>
                  <span>5分 (极度信任/欣赏)</span>
                </div>
              </div>

              <button
                onClick={handleFinishStep1}
                className="w-full py-3.5 bg-gradient-to-r from-stone-900 to-indigo-950 hover:from-stone-800 hover:to-indigo-900 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer game-btn-tactile"
              >
                <span>锁定初印象，去翻开其真实日常底牌</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 2: Hidden Truths Flip-Cards */}
          {gameState === 'step2' && (
            <div className="space-y-4 animate-fadeIn relative z-10">
              <div className="text-xs text-stone-600 font-medium flex items-center justify-between">
                <span>点击下列卡片翻看被忽视的<strong className="text-stone-900">生活日常与背景真相</strong>：</span>
                <span className="font-numeric font-bold text-indigo-600">
                  {revealedFacts.length} / {currentCase.hiddenTruths.length}
                </span>
              </div>

              <div className="space-y-3">
                {currentCase.hiddenTruths.map((truth, idx) => {
                  const isRevealed = revealedFacts.includes(idx);
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleRevealFact(idx)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer transform active:scale-98 ${
                        isRevealed
                          ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-300 shadow-sm'
                          : 'bg-stone-50 hover:bg-stone-100 border-stone-200 border-dashed'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-indigo-700 bg-white px-2.5 py-0.5 rounded-lg border border-indigo-200 shadow-xs">
                          {truth.revealedCategory}
                        </span>
                        <span className={`text-[11px] font-bold font-numeric ${isRevealed ? 'text-emerald-700' : 'text-indigo-600'}`}>
                          {isRevealed ? '✅ 已解锁真相' : '👉 点击翻开'}
                        </span>
                      </div>

                      {isRevealed ? (
                        <div className="mt-2.5 space-y-1 animate-fadeIn">
                          <h4 className="text-xs sm:text-sm font-bold text-stone-900">
                            {truth.fact}
                          </h4>
                          <p className="text-xs text-stone-600 leading-relaxed">
                            {truth.context}
                          </p>
                        </div>
                      ) : (
                        <div className="py-2.5 text-center text-xs text-stone-400 font-medium flex items-center justify-center gap-1.5">
                          <span>🔒 隐藏的情境背景与客观事实（点击解锁）</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <button
                disabled={revealedFacts.length < currentCase.hiddenTruths.length}
                onClick={handleFinishStep2}
                className={`w-full py-3.5 font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer game-btn-tactile ${
                  revealedFacts.length === currentCase.hiddenTruths.length
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white'
                    : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                }`}
              >
                <span>全部事实翻开完毕，重新客观评估</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 3: Re-evaluation & Contrast */}
          {gameState === 'step3' && (
            <div className="space-y-4 animate-fadeIn relative z-10">
              <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-200 text-xs text-indigo-950 space-y-1">
                <span className="font-bold block font-serif-editorial">
                  💡 心智对比：第一印象 vs 全景全貌
                </span>
                <p className="text-stone-600 leading-relaxed">
                  你最初在缺乏信息时打出了 <strong className="text-stone-900">{initialRating} 分</strong>。现在结合生活重压与真实能力，请给出你当下的全面判断：
                </p>
              </div>

              {/* Final Rating Slider */}
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-stone-800">全面了解后的客观评分：</span>
                  <span className="font-numeric font-extrabold text-emerald-600 text-sm">{finalRating} 分 / 5 分</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={finalRating}
                  onChange={(e) => setFinalRating(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer h-2 bg-stone-200 rounded-lg"
                />
              </div>

              {/* Case Conclusion Callout */}
              <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-stone-200/80 text-xs text-stone-600 leading-relaxed">
                <span className="font-bold text-stone-900 block mb-0.5">心理学研判总结：</span>
                {currentCase.idealConclusion}
              </div>

              <button
                onClick={handleFinishCase}
                className="w-full py-3.5 bg-gradient-to-r from-stone-900 to-indigo-950 hover:from-stone-800 hover:to-indigo-900 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer game-btn-tactile"
              >
                <span>{currentIdx < activeCases.length - 1 ? '审阅下一位人物' : '完成实验，生成结题研报'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

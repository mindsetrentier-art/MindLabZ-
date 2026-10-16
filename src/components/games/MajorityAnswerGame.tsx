import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Users, CheckCircle2, RotateCcw, AlertTriangle, ArrowRight, ShieldAlert, FileText, Sparkles, Flame, UserCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { GameDifficulty, DIFFICULTY_CONFIGS, DIFFICULTY_LIST, shuffleArray } from '../../data/difficulty';
import { DifficultySelector } from './DifficultySelector';
import { GameDebriefModal, DebriefData } from './GameDebriefModal';
import { GameHeaderHud } from './GameHeaderHud';
import { gameAudio } from '../../utils/gameAudio';

interface ConformityScenario {
  id: string;
  topic: string;
  context: string;
  majorityChoice: string;
  majorityPercentage: number;
  majorityReasoning: string;
  evidenceItems: string[];
  rationalChoice: string;
  rationalReasoning: string;
}

const SCENARIOS_POOL: ConformityScenario[] = [
  {
    id: 'scen-meeting',
    topic: '新产品发版前夕的严重并发死锁',
    context: '上线前 3 小时，技术团队在压测中发现偶发性数据死锁。在跨部门紧急会议上，8 位业务与运营总监急于保住季度 KPI，异口同声表决：“概率只有 0.1%，先上线！有问题下周热修复就行，别耽误全员庆功会！”',
    majorityChoice: '跟随绝大多数总监意见，直接强行按时上线',
    majorityPercentage: 88,
    majorityReasoning: '全场 8 位资深高管都支持上线，没人愿意做破坏全员欢庆气氛的“刺头”。',
    evidenceItems: [
      '底层日志表明，高并发下死锁会产生级联雪崩，导致财务账户金额回滚失败。',
      '类似架构的竞品曾因同样问题强行上线，导致核心数据库崩溃停服 18 小时并被监管立案罚款。',
    ],
    rationalChoice: '坚守底线，顶住压力果断叫停，修复致命死锁后再上线',
    rationalReasoning: '阿希从众实验证明：群体一致性会让人产生“既然大家都这么说应该没事”的虚假安全感。然而客观事实规律绝不以投票人数为转移。',
  },
  {
    id: 'scen-investment',
    topic: '狂热投资社群中的高收益庞氏局',
    context: '在拥有数千人的投资圈子里，某“去中心化无风险套利理财”承诺年化 36% 稳定收益。群里每天上百条截屏炫耀提现成功，大V群主甚至讽刺质疑者“认知太低、不懂区块链红利”。',
    majorityChoice: '跟风跟投，既然群里数千人都赚了，再不投就错过暴富红利',
    majorityPercentage: 82,
    majorityReasoning: '周围所有人都在狂热参与并提供“提现证据”，不跟似乎成了保守的边缘人。',
    evidenceItems: [
      '没有底层真实商业现金流的借贷模式，高收益完全依赖后来者的本金垫付。',
      '智能合约代码审计报告中存在管理员无条件提权后门。',
    ],
    rationalChoice: '坚决不参与，并警示身边朋友识别庞氏骗局',
    rationalReasoning: '社会证明（Social Proof）在信息不透明时极易引发羊群效应。成百上千人相信的谎言依然是谎言。',
  },
  {
    id: 'scen-medical',
    topic: '传统伪科学土方与现代循证医学冲突',
    context: '某亲友患有早期糖尿病，家族群里所有长辈轮番劝说：“别吃降糖药，西药伤肝肾！天天喝苦瓜泡水加偏方草药，张大爷就是这么根治的，全村老人都在喝！”',
    majorityChoice: '依从家族长辈多数人建议，停药改喝偏方草药',
    majorityPercentage: 79,
    majorityReasoning: '家族数十位长辈群情激昂推荐，违背他们会被扣上“不孝、不听老人言”的帽子。',
    evidenceItems: [
      '早期正规二甲双胍等药物具备海量随机双盲对照（RCT）三期临床试验数据证实安全有效。',
      '偏方草药重金属含量未经检验，长期服用可能导致不可逆的药物性肝衰竭与严重肾纤维化。',
    ],
    rationalChoice: '遵医嘱规范治疗，温和拒绝群体偏方压力',
    rationalReasoning: '医学决策必须基于循证证据等级，而非个案故事与群体情感绑架。',
  },
];

export const MajorityAnswerGame: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, recordGameResult } = useApp();

  const urlDiff = searchParams.get('difficulty') as GameDifficulty | null;
  const initialDiff: GameDifficulty = urlDiff && DIFFICULTY_LIST.includes(urlDiff) ? urlDiff : '中';

  const [difficulty, setDifficulty] = useState<GameDifficulty>(initialDiff);
  const [gameState, setGameState] = useState<'intro' | 'question' | 'result' | 'debrief'>('intro');
  const [scenarios, setScenarios] = useState<ConformityScenario[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userChoice, setUserChoice] = useState<'majority' | 'rational' | null>(null);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);

  const diffConfig = DIFFICULTY_CONFIGS[difficulty];
  const isFirstTime = !(user.completedGames?.includes('majority-answer'));

  const startSession = (selectedDiff: GameDifficulty = difficulty) => {
    gameAudio.playSuccess();
    const count = selectedDiff === '低' ? 1 : selectedDiff === '中' ? 2 : 3;
    const shuffled = shuffleArray(SCENARIOS_POOL).slice(0, count);
    setScenarios(shuffled);
    setCurrentIdx(0);
    setUserChoice(null);
    setScore(0);
    setCorrectCount(0);
    setGameState('question');
  };

  const scen = scenarios[currentIdx];

  const handleMakeChoice = (choice: 'majority' | 'rational') => {
    setUserChoice(choice);
    if (choice === 'rational') {
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
      setUserChoice(null);
      setGameState('question');
    } else {
      const calculatedXp = isFirstTime
        ? Math.round(38 * diffConfig.xpMultiplier)
        : Math.round(10 * diffConfig.xpMultiplier);

      recordGameResult('majority-answer', {
        score,
        accuracy: scenarios.length > 0 ? Math.round((correctCount / scenarios.length) * 100) : 100,
        reactionTime: 980,
        xpGained: calculatedXp,
        comboMax: correctCount,
        conceptLearned: '阿希从众效应（Asch Conformity）与群体压力抵抗力',
        lawId: 'social-proof',
        difficulty,
      });

      setGameState('debrief');
    }
  };

  const debriefData: DebriefData = {
    gameId: 'majority-answer',
    gameTitle: '多数人的答案',
    numberPrefix: '03',
    difficulty,
    score,
    accuracy: scenarios.length > 0 ? Math.round((correctCount / scenarios.length) * 100) : 100,
    isFirstTime,
    xpEarned: isFirstTime ? Math.round(40 * diffConfig.xpMultiplier) : Math.round(10 * diffConfig.xpMultiplier),
    bestAnswerReview:
      '面对群体压倒性共识时，最佳策略是【诉诸硬证据，不做盲从人】。敢于成为阿希实验中那个说出皇帝没穿衣服的孩子，用可验证的数据取代人情从众。',
    psychologicalMechanism:
      '阿希从众实验（Asch Conformity）表明，当周围所有人都指鹿为马时，超过 75% 的人至少会违心地妥协一次。社会证明会欺骗大脑：让人把“人多的意见”误判为“大概率正确的事实”。',
    actionableSummary: [
      '警惕“群体狂热与道德审判”：当全员都在喊冲且禁止质疑时，往往是巨大灾难的前兆。',
      '在团队会议中指定一名“红队反方（Devil\'s Advocate）”：专门负责从反面挑刺，瓦解阿希效应。',
      '把“大家都这么做”换成“客观因果律是什么”：真理永远由实证检验决定，而非点赞数量。',
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
          <span className="text-xs font-mono font-bold text-pink-600 bg-pink-50 px-2 py-0.5 rounded-full border border-pink-200">
            GAME 03
          </span>
        </div>

        <div className="w-full game-arcade-card rounded-3xl p-6 sm:p-8 border-pink-200/90 shadow-xl space-y-6 relative overflow-hidden">
          {/* Ambient colorful glow */}
          <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-gradient-to-br from-pink-500/30 to-rose-600/20 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 blur-2xl pointer-events-none" />

          {/* Animated Users Monogram */}
          <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-600 shadow-lg shadow-pink-500/30 animate-pulseGlow" />
            <Users className="w-10 h-10 text-white relative z-10" />
          </div>

          <div className="text-center space-y-2 relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-pink-700 bg-pink-50 border border-pink-200">
              <Sparkles className="w-3.5 h-3.5" />
              <span>阿希从众实验 · 社会证明博弈</span>
            </div>
            <h1 className="font-serif-editorial text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
              03 · 多数人的答案
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-sm mx-auto">
              当身边 80% 的人都做出了同一个选择，你是否有勇气查验证据做出独立判断？在这个模拟场中锻炼不盲从的理性骨气。
            </p>
          </div>

          <div className="space-y-2 pt-2 border-t border-stone-200/60 text-left relative z-10">
            <div className="flex justify-between items-center text-xs font-bold text-stone-800">
              <span>选择挑战难度：</span>
              <span className="text-pink-600 font-numeric">{diffConfig.multiplierText} 积分收益</span>
            </div>
            <DifficultySelector value={difficulty} onChange={setDifficulty} />
          </div>

          <button
            onClick={() => startSession(difficulty)}
            type="button"
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-600 to-purple-600 hover:from-pink-600 hover:to-rose-700 text-white font-bold text-sm shadow-lg shadow-pink-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 relative z-10 game-btn-tactile"
          >
            <Users className="w-4 h-4 text-white" />
            <span>开始从众对抗（{difficulty}难度 · {diffConfig.multiplierText} 积分加成）</span>
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
        title="03 · 多数人的答案"
        numberPrefix="03"
        difficulty={difficulty}
        score={score}
        combo={correctCount}
        currentRound={currentIdx + 1}
        totalRounds={scenarios.length}
        onExit={() => setGameState('intro')}
        accentColor="#EC4899"
      />

      {scen && (
        <div className="w-full game-arcade-card rounded-3xl p-6 border-pink-100 shadow-xl space-y-5 animate-fadeIn bg-white relative overflow-hidden">
          {/* Scenario Header */}
          <div className="space-y-1.5 border-b border-stone-200/70 pb-3.5">
            <span className="text-[10px] font-black text-pink-700 bg-pink-50 px-2 py-0.5 rounded-md border border-pink-200 font-mono">
              CONFORMITY PRESSURE #{currentIdx + 1} / {scenarios.length}
            </span>
            <h2 className="text-xl font-bold text-stone-900 font-serif-editorial">
              {scen.topic}
            </h2>
            <div className="text-xs text-stone-700 leading-relaxed bg-stone-50 p-3.5 rounded-2xl border border-stone-200/80 font-sans mt-2">
              {scen.context}
            </div>
          </div>

          {/* Social Proof Pressure Meter Banner */}
          <div className="p-4 bg-gradient-to-r from-rose-50 to-pink-50 rounded-2xl border border-rose-200 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-rose-950 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-rose-600" />
                群聊多数人压倒性意见：
              </span>
              <span className="font-numeric font-black text-rose-600 bg-rose-100/90 px-2.5 py-0.5 rounded-lg border border-rose-300">
                {scen.majorityPercentage}% 压倒性支持
              </span>
            </div>
            <p className="text-xs text-stone-700 font-sans italic">
              “{scen.majorityReasoning}”
            </p>
          </div>

          {/* Hidden Facts / Evidences */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5 font-serif-editorial">
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>实验室可验证的客观数据证据：</span>
            </h4>
            <div className="space-y-2">
              {scen.evidenceItems.map((item, idx) => (
                <div key={idx} className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80 text-xs text-stone-700 flex items-start gap-2 shadow-2xs font-sans">
                  <span className="text-indigo-600 font-bold shrink-0">证据 #{idx + 1}</span>
                  <span className="leading-relaxed">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Options */}
          {gameState === 'question' ? (
            <div className="space-y-3 pt-2 border-t border-stone-200/70">
              <h4 className="text-xs font-bold text-stone-900">
                面对群体压力，你的真实抉择：
              </h4>
              <div className="grid grid-cols-1 gap-2.5">
                <button
                  onClick={() => handleMakeChoice('majority')}
                  type="button"
                  className="w-full text-left p-4 rounded-2xl border-2 border-stone-200 hover:border-rose-400 bg-white hover:bg-rose-50/30 transition-all text-xs cursor-pointer active:scale-98 shadow-xs"
                >
                  <span className="font-black text-stone-900 block mb-1">选项 A：跟随多数人（阿希从众）</span>
                  <span className="text-stone-600 leading-relaxed">{scen.majorityChoice}</span>
                </button>

                <button
                  onClick={() => handleMakeChoice('rational')}
                  type="button"
                  className="w-full text-left p-4 rounded-2xl border-2 border-indigo-200 hover:border-indigo-500 bg-indigo-50/50 hover:bg-indigo-50 transition-all text-xs cursor-pointer active:scale-98 shadow-xs"
                >
                  <span className="font-black text-indigo-950 block mb-1 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    选项 B：坚持证据独立判断（理性破局）
                  </span>
                  <span className="text-stone-700 leading-relaxed">{scen.rationalChoice}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Result Reveal */
            <div className="space-y-4 pt-2 border-t border-stone-200/70 animate-fadeIn">
              <div className={`p-4.5 rounded-2xl border ${userChoice === 'rational' ? 'bg-emerald-50 border-emerald-300 text-emerald-950' : 'bg-rose-50 border-rose-300 text-rose-950'} space-y-1.5 shadow-2xs`}>
                <div className="flex items-center gap-1.5 text-xs font-bold font-serif-editorial">
                  {userChoice === 'rational' ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="text-sm">出色！你顶住了强大的阿希从众压力 (+{Math.round(1500 * diffConfig.scoreMultiplier)}分)</span>
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                      <span className="text-sm">落入从众陷阱！屈从了多数人的错误偏误</span>
                    </>
                  )}
                </div>
                <p className="text-xs leading-relaxed opacity-95 font-sans">
                  {scen.rationalReasoning}
                </p>
              </div>

              <button
                onClick={handleNext}
                type="button"
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-stone-900 via-purple-950 to-pink-950 hover:opacity-95 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 game-btn-tactile"
              >
                <span>{currentIdx < scenarios.length - 1 ? '审阅下一个从众情境' : '查看实验总结研报'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

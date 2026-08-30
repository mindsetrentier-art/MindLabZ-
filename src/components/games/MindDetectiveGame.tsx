import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RotateCcw, Search, Sparkles, CheckCircle2, ShieldAlert, Award, FileText, UserCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface DetectiveCase {
  id: string;
  title: string;
  scenario: string;
  evidence: { icon: string; title: string; detail: string }[];
  question: string;
  options: { label: string; biasId: string; isCorrect: boolean; explanation: string }[];
  lawLearned: string;
  lawId: string;
}

const CASES: DetectiveCase[] = [
  {
    id: 'case-1',
    title: '悬案一：明星高管的投资疑云',
    scenario: '某科技公司在聘请了一位外表极具魅力、毕业于世界顶级名校、谈吐风度翩翩的CEO之后，董事会几乎未经详细财务审计，便全票通过了他提出的一项风险极高的海外收购案。半年后该项目爆雷损失数亿元。',
    evidence: [
      { icon: '✨', title: '外貌与名校光环', detail: '董事会成员在访谈中反复强调“他看起来就是那种不可多得的商业领袖”。' },
      { icon: '📑', title: '缺乏实质数据支撑', detail: '项目尽调报告中漏洞百出，但没有任何一位高管提出质疑。' },
      { icon: '👔', title: '单一特征扩散', detail: '大家潜意识认为谈吐自信者在财务风控上也一定极度严谨。' }
    ],
    question: '作为心理侦探，你判断董事会主要陷入了哪种社会心理学偏差？',
    options: [
      { label: '光环效应（Halo Effect）', biasId: 'halo-effect', isCorrect: true, explanation: '人们将外貌与风度的单一积极特征，无意识扩散到对其商业严谨度与道德操守的全面高评。' },
      { label: '蔡格尼克效应', biasId: 'zeigarnik-effect', isCorrect: false, explanation: '蔡格尼克效应涉及未完成任务的记忆唤醒，与人际评价偏差无关。' },
      { label: '选择过载效应', biasId: 'choice-overload', isCorrect: false, explanation: '本案并不存在选项过多导致瘫痪的情况。' }
    ],
    lawLearned: '光环效应与人际认知偏见',
    lawId: 'halo-effect'
  },
  {
    id: 'case-2',
    title: '悬案二：大厦火警警报下的沉默走廊',
    scenario: '某写字楼 18 层突发火灾警报，走廊中浓烟渐起。公共办公区有 40 名员工，大家虽然都听到了警报，但看到身边的同事依然坐在工位上敲键盘，所有人便都选择继续等待，最终延误了长达 8 分钟的最佳逃生时间。',
    evidence: [
      { icon: '👥', title: '集体相互张望', detail: '每个人内心都很紧张，但都在观察别人的反应（多元无知）。' },
      { icon: '🌫️', title: '责任被稀释', detail: '“这么多人都在，真有危险肯定有人带头跑。”（责任分散）。' },
      { icon: '🔔', title: '从众抑制了主动行动', detail: '没人愿意成为第一个站起来显得惊慌失措的人。' }
    ],
    question: '这起延误逃生事件背后最核心的心理学机制是：',
    options: [
      { label: '旁观者效应与从众心理', biasId: 'bystander-effect', isCorrect: true, explanation: '在群体中，个体的责任被分散，同时受周围人镇定表象误导（多元无知），导致无人主动介入。' },
      { label: '近因效应', biasId: 'recency-effect', isCorrect: false, explanation: '近因效应关乎短期记忆序列位置，并非群体危机干预。' },
      { label: '沉没成本谬误', biasId: 'sunk-cost-fallacy', isCorrect: false, explanation: '本案不涉及已沉没不可收回的资金与努力追加。' }
    ],
    lawLearned: '旁观者效应与危机干预心理',
    lawId: 'bystander-effect'
  },
  {
    id: 'case-3',
    title: '悬案三：濒临破产的代码黑洞',
    scenario: '某初创团队开发一款社交软件，耗时 18 个月并花光了 200 万天使轮融资。市场数据显示同类产品已饱和且用户留存为零。CTO明知继续开发毫无希望，却依然抵押房产追加投入 100 万，坚持“不能让前 18 个月的心血白费”。',
    evidence: [
      { icon: '⏳', title: '18个月沉没时光', detail: '团队最常挂在嘴边的话是“我们已经付出了这么多，现在放弃就全打水漂了”。' },
      { icon: '💸', title: '200万既往投入', detail: '决策出发点不是未来期望盈利，而是对过去沉没资金的心疼。' },
      { icon: '🚪', title: '理性止损缺失', detail: '未能认清过去的损失已经无法挽回，边际收益已为负数。' }
    ],
    question: 'CTO 在做出追加抵押房产决策时，被哪种认知陷阱套牢？',
    options: [
      { label: '沉没成本谬误（Sunk Cost Fallacy）', biasId: 'sunk-cost-fallacy', isCorrect: true, explanation: '被已经发生且不可收回的过去付出所绑架，在未来决策中持续做出非理性追加投入。' },
      { label: '斯特鲁普效应', biasId: 'stroop-effect', isCorrect: false, explanation: '斯特鲁普效应是颜色字义冲突的注意抑制，与长期投资决策无关。' },
      { label: '宜家效应', biasId: 'ikea-effect', isCorrect: false, explanation: '虽有自己动手付出的情感溢价，但驱动继续亏损决策的核心机制是沉没成本厌恶。' }
    ],
    lawLearned: '沉没成本谬误与止损智慧',
    lawId: 'sunk-cost-fallacy'
  }
];

export const MindDetectiveGame: React.FC = () => {
  const navigate = useNavigate();
  const { recordGameResult } = useApp();

  const [currentCaseIndex, setCurrentCaseIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [revealedExplanation, setRevealedExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<'playing' | 'finished'>('playing');

  const currentCase = CASES[currentCaseIndex];

  const handleSelectOption = (idx: number) => {
    if (revealedExplanation) return;
    setSelectedOption(idx);
    setRevealedExplanation(true);

    const isCorrect = currentCase.options[idx].isCorrect;
    if (isCorrect) {
      setScore(prev => prev + 2500);
    }
  };

  const handleNext = () => {
    if (currentCaseIndex < CASES.length - 1) {
      setCurrentCaseIndex(prev => prev + 1);
      setSelectedOption(null);
      setRevealedExplanation(false);
    } else {
      setGameState('finished');
    }
  };

  const handleFinish = () => {
    const accuracy = Math.round((score / (CASES.length * 2500)) * 100);
    const xpGained = Math.round(score / 20) + 150;

    recordGameResult('mind-detective', {
      score,
      accuracy,
      reactionTime: 1200,
      xpGained,
      comboMax: 3,
      conceptLearned: '社会知觉与启发式归因偏误（Attribution Bias & Heuristics）',
      lawId: 'halo-effect'
    });

    navigate('/games');
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-[80vh] w-full max-w-lg mx-auto py-2">
      {/* Top Bar */}
      <div className="w-full flex items-center justify-between mb-4">
        <button
          onClick={() => navigate('/games')}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#5E5D6D] hover:text-[#532CD8] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>退出侦探案卷</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-3 py-1 bg-[#FEF3C7] text-[#D97706] rounded-full flex items-center gap-1">
            <Search className="w-3.5 h-3.5" />
            案件 {currentCaseIndex + 1} / {CASES.length}
          </span>
          <span className="text-xs font-bold px-3 py-1 bg-white border border-[#E8E5F0] rounded-full text-[#532CD8]">
            积分: {score}
          </span>
        </div>
      </div>

      {gameState === 'playing' ? (
        <div className="w-full bg-white rounded-3xl p-6 border border-white/90 shadow-[0_8px_30px_rgba(23,21,42,0.06)] space-y-5">
          {/* Case Header */}
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-black uppercase text-[#D97706] tracking-wider bg-[#FEF3C7] px-2 py-0.5 rounded-md">
                PSYCH CASE #{currentCaseIndex + 1}
              </span>
              <h2 className="text-lg font-bold text-[#1B192E]">{currentCase.title}</h2>
            </div>
            <p className="text-xs text-[#484555] leading-relaxed bg-[#FCFBFE] p-3.5 rounded-2xl border border-[#F0EBFF]">
              {currentCase.scenario}
            </p>
          </div>

          {/* Evidence Dossier */}
          <div>
            <h4 className="text-xs font-bold text-[#1B192E] flex items-center gap-1.5 mb-2.5">
              <FileText className="w-4 h-4 text-[#D97706]" />
              心理侦探案情卷宗线索
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {currentCase.evidence.map((ev, idx) => (
                <div key={idx} className="flex items-start gap-2.5 p-2.5 bg-[#F6F1FF] rounded-xl border border-[#E4DFFD]">
                  <span className="text-base shrink-0">{ev.icon}</span>
                  <div>
                    <span className="text-xs font-bold text-[#532CD8] block">{ev.title}</span>
                    <span className="text-[11px] text-[#5E5D6D]">{ev.detail}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detective Question */}
          <div className="pt-2 border-t border-[#F0EBFF]">
            <h3 className="text-sm font-bold text-[#1B192E] mb-3">
              🔍 {currentCase.question}
            </h3>

            <div className="space-y-2.5">
              {currentCase.options.map((opt, idx) => {
                const isSelected = selectedOption === idx;
                const showSuccess = revealedExplanation && opt.isCorrect;
                const showWrong = revealedExplanation && isSelected && !opt.isCorrect;

                return (
                  <button
                    key={idx}
                    disabled={revealedExplanation}
                    onClick={() => handleSelectOption(idx)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all duration-200 flex items-center justify-between text-xs font-semibold btn-press ${
                      showSuccess
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-900 shadow-sm'
                        : showWrong
                        ? 'bg-red-50 border-red-400 text-red-900'
                        : 'bg-[#FDFCFE] hover:bg-[#F6F1FF] border-[#E8E5F0] text-[#1B192E]'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {showSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 ml-2" />}
                    {showWrong && <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Explanation Box on Reveal */}
          {revealedExplanation && selectedOption !== null && (
            <div className="p-4 rounded-2xl bg-[#F0EBFF] border border-[#E4DFFD] space-y-2 animate-fadeIn">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#532CD8]">
                <Sparkles className="w-4 h-4 text-[#FFB72B]" />
                <span>侦探推理研判报告</span>
              </div>
              <p className="text-xs text-[#484555] leading-relaxed">
                {currentCase.options[selectedOption].explanation}
              </p>
              <button
                onClick={handleNext}
                className="w-full mt-2 py-2.5 bg-[#6C4CF1] hover:bg-[#532CD8] text-white font-bold text-xs rounded-xl shadow-sm transition-all"
              >
                {currentCaseIndex < CASES.length - 1 ? '审阅下一卷宗' : '查看结案评级'}
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Finished Screen */
        <div className="w-full bg-white rounded-3xl p-6 border border-white/80 shadow-xl text-center space-y-4 animate-fadeIn">
          <div className="w-16 h-16 rounded-3xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center mx-auto">
            <Award className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-black text-[#1B192E]">心理侦探结案</h2>
          <p className="text-xs text-[#5E5D6D]">
            已成功侦破所有经典社会心理学与启发式认知偏差案件！
          </p>

          <div className="bg-[#F6F1FF] p-4 rounded-2xl text-left border border-[#E4DFFD] space-y-1">
            <div className="flex justify-between items-center text-xs font-bold text-[#532CD8]">
              <span>最终侦探评分</span>
              <span className="text-base text-[#1B192E] font-['Inter']">{score} 积分</span>
            </div>
            <p className="text-[11px] text-[#5E5D6D]">
              社会心理学洞察力大幅提升，已解锁“认知猎手”称号。
            </p>
          </div>

          <button
            onClick={handleFinish}
            className="w-full py-3 rounded-2xl bg-[#6C4CF1] hover:bg-[#532CD8] text-white font-bold text-xs shadow-md transition-all"
          >
            领取积分并返回
          </button>
        </div>
      )}
    </div>
  );
};

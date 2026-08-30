import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RotateCcw, FlaskConical, Sparkles, CheckCircle2, TrendingUp, BarChart3, Users } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface LabExperiment {
  id: string;
  nameZh: string;
  nameEn: string;
  researcher: string;
  year: string;
  background: string;
  question: string;
  choiceA: { label: string; biasDescription: string };
  choiceB: { label: string; rationalDescription: string };
  globalPercentageA: number;
  globalPercentageB: number;
  insight: string;
  lawId: string;
}

const EXPERIMENTS: LabExperiment[] = [
  {
    id: 'framing-lab',
    nameZh: '亚洲疾病框架实验',
    nameEn: 'Asian Disease Problem',
    researcher: '阿莫斯·特沃斯基 & 丹尼尔·卡尼曼',
    year: '1981',
    background: '某种罕见流行病爆发，预计将导致 600 人死亡。目前有两种救治方案供你决策：',
    question: '在【获益框架】下，你倾向于批准哪种救治方案？',
    choiceA: {
      label: '方案甲：确定拯救 200 人的生命。',
      biasDescription: '多数人偏好确定性收益，厌恶冒险'
    },
    choiceB: {
      label: '方案乙：有 1/3 概率 600 人全部获救，2/3 概率无人生还。',
      rationalDescription: '数学期望完全相同（均为200人存活）'
    },
    globalPercentageA: 72,
    globalPercentageB: 28,
    insight: '卡尼曼发现，面对正面获益表述时，72% 的人回避风险选择确定拯救；但当换成损失框架（“400人将确定死亡”）时，78% 的人会瞬间变成风险偏好者去赌一把！同一事实，框架操纵了决策。',
    lawId: 'framing-effect'
  },
  {
    id: 'jam-experiment',
    nameZh: '果酱选择过载实验',
    nameEn: 'Jam Choice Overload Experiment',
    researcher: '希娜·艾扬格 (Sheena Iyengar)',
    year: '2000',
    background: '在加州一家高档食品超市入口处，研究人员设立了两个不同的果酱免费品尝摊位：',
    question: '如果你是在该超市匆匆采买的顾客，你更有可能在哪种摊位最终完成购买？',
    choiceA: {
      label: '摊位A：摆放 24 种琳琅满目的风味果酱（试吃人多但挑花了眼）',
      biasDescription: '选项过多引发“分析瘫痪”与机会成本焦虑'
    },
    choiceB: {
      label: '摊位B：精选 6 种经典招牌风味果酱（目标明确快速锁定）',
      rationalDescription: '降低工作记忆负荷，购买转化率高出近 10 倍'
    },
    globalPercentageA: 18,
    globalPercentageB: 82,
    insight: '真实实验中，24 款果酱吸引了 60% 客流但仅 3% 最终下单；而 6 款果酱仅吸引 40% 客流却促成 30% 购买！少即是多，过量选项会扼杀行动力。',
    lawId: 'choice-overload'
  },
  {
    id: 'loss-aversion-lab',
    nameZh: '硬币博弈与损失厌恶',
    nameEn: 'Coin Toss Loss Aversion',
    researcher: '理查德·塞勒 & 丹尼尔·卡尼曼',
    year: '1990',
    background: '面前有一枚质地均匀的硬币。抛出正面你将直接赢得 150 美元；抛出反面你将自掏腰包输掉 100 美元。该博弈的数学期望为正（+25 美元）。',
    question: '面对这一单次抛硬币博弈，你的真实决策是：',
    choiceA: {
      label: '选择拒绝参与（害怕输掉 100 美元的痛苦）',
      biasDescription: '典型损失厌恶：失去 100 的痛觉需要 200+ 收益才能抚平'
    },
    choiceB: {
      label: '选择果断接受（因为数学期望收益为正）',
      rationalDescription: '基于理性概率期望做决策'
    },
    globalPercentageA: 69,
    globalPercentageB: 31,
    insight: '在期望值明显为正的情况下，仍有近 70% 的人拒绝参与。人类的损失厌恶系数约为 2.0~2.5。只有当赢面收益提高到 250 美元时，多数人才愿意承担 100 美元的损失风险。',
    lawId: 'loss-aversion'
  }
];

export const PsychExperimentGame: React.FC = () => {
  const navigate = useNavigate();
  const { recordGameResult, updateLawMastery } = useApp();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [userChoice, setUserChoice] = useState<'A' | 'B' | null>(null);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<'playing' | 'completed'>('playing');

  const exp = EXPERIMENTS[currentIndex];

  const handleMakeChoice = (choice: 'A' | 'B') => {
    setUserChoice(choice);
    setScore(prev => prev + 3000);
    updateLawMastery(exp.lawId, 95);
  };

  const handleNext = () => {
    if (currentIndex < EXPERIMENTS.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setUserChoice(null);
    } else {
      setGameState('completed');
    }
  };

  const handleFinish = () => {
    recordGameResult('psych-experiment', {
      score,
      accuracy: 100,
      reactionTime: 950,
      xpGained: 450,
      comboMax: 3,
      conceptLearned: '行为经济学与前景理论（Prospect Theory & Behavioral Economics）',
      lawId: 'zeigarnik-effect'
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
          <span>退出实验室</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-3 py-1 bg-[#EFF6FF] text-[#2563EB] rounded-full flex items-center gap-1">
            <FlaskConical className="w-3.5 h-3.5" />
            实验 {currentIndex + 1} / {EXPERIMENTS.length}
          </span>
        </div>
      </div>

      {gameState === 'playing' ? (
        <div className="w-full bg-white rounded-3xl p-6 border border-white/90 shadow-[0_8px_30px_rgba(23,21,42,0.06)] space-y-5">
          {/* Header */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#2563EB]">
                {exp.year} 年 · 诺贝尔奖经典实验
              </span>
            </div>
            <h2 className="text-lg font-bold text-[#1B192E]">{exp.nameZh}</h2>
            <p className="text-xs text-[#5E5D6D] font-medium">{exp.nameEn} · {exp.researcher}</p>
          </div>

          {/* Background Scenario */}
          <div className="p-4 rounded-2xl bg-[#FCFBFE] border border-[#F0EBFF] text-xs text-[#484555] leading-relaxed">
            <strong className="text-[#532CD8] block mb-1">🔬 实验背景：</strong>
            {exp.background}
          </div>

          {/* Decision Buttons */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#1B192E]">{exp.question}</h4>

            <button
              disabled={userChoice !== null}
              onClick={() => handleMakeChoice('A')}
              className={`w-full text-left p-4 rounded-2xl border transition-all text-xs font-semibold btn-press ${
                userChoice === 'A'
                  ? 'bg-[#F0EBFF] border-[#6C4CF1] text-[#532CD8] ring-2 ring-[#6C4CF1]/20'
                  : 'bg-white hover:bg-[#F6F1FF] border-[#E8E5F0] text-[#1B192E]'
              }`}
            >
              {exp.choiceA.label}
            </button>

            <button
              disabled={userChoice !== null}
              onClick={() => handleMakeChoice('B')}
              className={`w-full text-left p-4 rounded-2xl border transition-all text-xs font-semibold btn-press ${
                userChoice === 'B'
                  ? 'bg-[#F0EBFF] border-[#6C4CF1] text-[#532CD8] ring-2 ring-[#6C4CF1]/20'
                  : 'bg-white hover:bg-[#F6F1FF] border-[#E8E5F0] text-[#1B192E]'
              }`}
            >
              {exp.choiceB.label}
            </button>
          </div>

          {/* Poll Comparison & Scientific Insight upon choosing */}
          {userChoice && (
            <div className="p-4 rounded-2xl bg-[#F6F1FF] border border-[#E4DFFD] space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#532CD8] flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-[#FFB72B]" />
                  全球被试选择分布对比
                </span>
                <span className="text-[11px] text-[#5E5D6D]">你的选择：选项 {userChoice}</span>
              </div>

              {/* Bar comparison */}
              <div className="space-y-2 text-xs">
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span>选项 A ({exp.choiceA.biasDescription})</span>
                    <strong className="text-[#6C4CF1] font-bold">{exp.globalPercentageA}%</strong>
                  </div>
                  <div className="w-full h-2 bg-white rounded-full overflow-hidden">
                    <div className="h-full bg-[#6C4CF1] rounded-full" style={{ width: `${exp.globalPercentageA}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span>选项 B ({exp.choiceB.rationalDescription})</span>
                    <strong className="text-[#00A699] font-bold">{exp.globalPercentageB}%</strong>
                  </div>
                  <div className="w-full h-2 bg-white rounded-full overflow-hidden">
                    <div className="h-full bg-[#00A699] rounded-full" style={{ width: `${exp.globalPercentageB}%` }} />
                  </div>
                </div>
              </div>

              {/* Psychological Insight */}
              <div className="pt-2 border-t border-[#E8E5F0]/60">
                <p className="text-[11px] text-[#484555] leading-relaxed">
                  💡 <strong className="text-[#1B192E]">认知科学洞察：</strong>{exp.insight}
                </p>
              </div>

              <button
                onClick={handleNext}
                className="w-full mt-2 py-2.5 bg-[#6C4CF1] hover:bg-[#532CD8] text-white font-bold text-xs rounded-xl shadow-sm transition-all"
              >
                {currentIndex < EXPERIMENTS.length - 1 ? '进行下一项实验' : '完成实验并领取报告'}
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Completed Screen */
        <div className="w-full bg-white rounded-3xl p-6 border border-white/80 shadow-xl text-center space-y-4 animate-fadeIn">
          <div className="w-16 h-16 rounded-3xl bg-[#3B82F6]/15 text-[#2563EB] flex items-center justify-center mx-auto">
            <FlaskConical className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-black text-[#1B192E]">实验报告已归档</h2>
          <p className="text-xs text-[#5E5D6D]">
            恭喜！你已亲身探索了 3 大诺贝尔奖级别的经典行为心理学实验！
          </p>

          <div className="bg-[#F6F1FF] p-4 rounded-2xl text-left border border-[#E4DFFD]">
            <h4 className="text-xs font-bold text-[#532CD8] mb-1">🎯 获得成就 · 实验家</h4>
            <p className="text-[11px] text-[#5E5D6D]">
              不仅学到了理论，更通过第一人称体验洞悉了人类决策的深层心理机制。
            </p>
          </div>

          <button
            onClick={handleFinish}
            className="w-full py-3 rounded-2xl bg-[#6C4CF1] hover:bg-[#532CD8] text-white font-bold text-xs shadow-md transition-all"
          >
            收下成就并返回
          </button>
        </div>
      )}
    </div>
  );
};

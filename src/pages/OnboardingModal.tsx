import React, { useState } from 'react';
import { Brain, Sparkles, Target, Flame, ArrowRight, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';

const GOALS = [
  { id: 'memory', title: '突破工作记忆瓶颈 (Memory)', desc: '克服遗忘曲线与信息过载' },
  { id: 'attention', title: '专注力与抗干扰 (Attention)', desc: '在信息噪点中保持绝对聚焦' },
  { id: 'decision', title: '理性决策与去偏见 (Decision)', desc: '识别锚定效应、框架效应与沉没成本' },
  { id: 'psychology', title: '心理学经典规律 (Knowledge)', desc: '系统掌握20大影响行为的核心定律' },
  { id: 'speed', title: '敏捷反应与反思 (Speed)', desc: '强化前额叶抑制控制与双系统协调' },
];

export const OnboardingModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { completeOnboarding, triggerConfetti } = useApp();
  const [step, setStep] = useState(1);
  const [selectedGoals, setSelectedGoals] = useState<string[]>(['memory', 'decision', 'psychology']);

  if (!isOpen) return null;

  const toggleGoal = (id: string) => {
    setSelectedGoals(prev =>
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    );
  };

  const handleFinish = () => {
    completeOnboarding(selectedGoals);
    triggerConfetti();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-white/80 overflow-hidden relative space-y-5">
        {/* Step indicator */}
        <div className="flex justify-between items-center text-xs text-[#5E5D6D]">
          <span className="font-bold text-[#532CD8] tracking-wide">MINDLABZ 智心堂</span>
          <span>步骤 {step} / 3</span>
        </div>

        {/* Step 1: Welcome & Value Proposition */}
        {step === 1 && (
          <div className="text-center space-y-4 py-2 animate-fadeIn">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#6C4CF1] to-[#532CD8] text-white flex items-center justify-center mx-auto shadow-lg shadow-[#6C4CF1]/30">
              <Brain className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-black text-[#1B192E] tracking-tight">
                边玩边学，真正理解大脑
              </h2>
              <p className="text-xs text-[#5E5D6D] max-w-xs mx-auto leading-relaxed">
                告别枯燥教科书。融合认知科学、经典心理学实验与轻量微游戏，助你拥有更敏锐的洞察力。
              </p>
            </div>

            <div className="bg-[#F6F1FF] rounded-2xl p-4 text-left border border-[#E4DFFD] space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#532CD8]">
                <Sparkles className="w-4 h-4 text-[#FFB72B]" />
                <span>你将获得：</span>
              </div>
              <ul className="text-xs text-[#484555] space-y-1">
                <li>• 20 项经典心理学定律与生活破局指南</li>
                <li>• 5 大即开即玩的大脑认知训练微游戏</li>
                <li>• 专属 AI 心理学导师随时答疑解惑</li>
              </ul>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full py-3.5 bg-[#6C4CF1] hover:bg-[#532CD8] text-white font-bold text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 btn-press"
            >
              <span>开始定制我的训练方案</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 2: Training Goal Selection */}
        {step === 2 && (
          <div className="space-y-4 animate-fadeIn">
            <div className="text-center space-y-1">
              <h3 className="text-xl font-extrabold text-[#1B192E]">设定你的核心提升目标</h3>
              <p className="text-xs text-[#5E5D6D]">请选择 1~3 项你最希望锻炼的认知机能：</p>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {GOALS.map((g) => {
                const isSelected = selectedGoals.includes(g.id);
                return (
                  <button
                    key={g.id}
                    onClick={() => toggleGoal(g.id)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between text-xs font-semibold btn-press ${
                      isSelected
                        ? 'bg-[#F0EBFF] border-[#6C4CF1] text-[#532CD8] ring-2 ring-[#6C4CF1]/20'
                        : 'bg-[#FCFBFE] border-[#E8E5F0] text-[#1B192E]'
                    }`}
                  >
                    <div>
                      <span className="block font-bold">{g.title}</span>
                      <span className="text-[11px] text-[#5E5D6D] font-normal">{g.desc}</span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-[#6C4CF1] shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setStep(3)}
              disabled={selectedGoals.length === 0}
              className="w-full py-3.5 bg-[#6C4CF1] hover:bg-[#532CD8] disabled:opacity-40 text-white font-bold text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 btn-press"
            >
              <span>下一步：养成每日微习惯</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 3: Habit Commitment & Start */}
        {step === 3 && (
          <div className="text-center space-y-4 py-2 animate-fadeIn">
            <div className="w-16 h-16 rounded-3xl bg-[#FFB72B]/15 text-[#FFB72B] flex items-center justify-center mx-auto shadow-inner">
              <Flame className="w-8 h-8 fill-[#FFB72B]" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-extrabold text-[#1B192E]">每天只需要 10 分钟</h3>
              <p className="text-xs text-[#5E5D6D] max-w-xs mx-auto">
                心理学与神经科学证明，持续的微量日常刺激远胜于偶尔一次的疲劳刷题。
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] text-left space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#059669]">
                <Target className="w-4 h-4" />
                <span>新手启动大礼包已就绪：</span>
              </div>
              <ul className="text-xs text-[#065F46] space-y-1">
                <li>• 初始赠送 <strong>+1,250 XP</strong> 与 Lv.12 进阶状态</li>
                <li>• 点亮连续 7 天连学勋章</li>
                <li>• 畅享全部 20 大心理学定律与 5 款认知游戏</li>
              </ul>
            </div>

            <button
              onClick={handleFinish}
              className="w-full py-3.5 bg-[#6C4CF1] hover:bg-[#532CD8] text-white font-bold text-sm rounded-2xl shadow-lg shadow-[#6C4CF1]/30 transition-all flex items-center justify-center gap-2 btn-press"
            >
              <span>开启我的认知科学之旅</span>
              <Sparkles className="w-4 h-4 text-[#FFB72B]" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

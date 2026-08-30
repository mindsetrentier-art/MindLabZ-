import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Flame, Star, Trophy, Bookmark, Settings, RotateCcw, Sparkles, Shield, Heart, HelpCircle, Check, Info } from 'lucide-react';
import { useApp } from '../context/AppContext';

const GOAL_OPTIONS = [
  '空间与序列记忆 (Memory)',
  '专注力与抗干扰 (Attention)',
  '理性决策与去偏见 (Decision)',
  '心理学经典理论 (Psychology)',
  '批判性反思 (Reasoning)',
  '敏捷神经反应 (Speed)'
];

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, resetProgress, triggerConfetti } = useApp();

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticEnabled, setHapticEnabled] = useState(true);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [selectedGoals, setSelectedGoals] = useState<string[]>(user.selectedGoals || []);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const toggleGoal = (goal: string) => {
    setSelectedGoals(prev =>
      prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]
    );
  };

  const handleSaveGoals = () => {
    setShowGoalModal(false);
    triggerConfetti();
  };

  return (
    <div className="space-y-5 pb-6 animate-fadeIn">
      {/* 1. Profile Avatar & Card */}
      <div className="bg-white rounded-3xl p-6 border border-[#E6E2F5] shadow-[0_4px_20px_-2px_rgba(108,76,241,0.05)] text-center space-y-3 relative overflow-hidden">
        <div className="w-20 h-20 rounded-full bg-[#EDE9FE] mx-auto overflow-hidden border-4 border-white shadow-md relative">
          <img
            src={user.avatar}
            alt={user.name}
            className="w-full h-full object-cover"
          />
        </div>

        <div>
          <div className="flex items-center justify-center gap-1.5">
            <h2 className="text-lg font-bold text-[#18181B]">{user.name}</h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#6C4CF1] text-white">
              Lv.{user.level}
            </span>
          </div>
          <p className="text-xs text-[#6C4CF1] font-semibold mt-0.5">{user.title}</p>
        </div>

        {/* Mini Stats Row */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#F5F3FF]">
          <div className="bg-[#FAF9FF] p-2.5 rounded-2xl border border-[#E6E2F5]">
            <span className="text-[10px] text-[#64748B] font-medium block">连击打卡</span>
            <span className="text-sm font-bold text-[#F59E0B] font-['Inter'] flex items-center justify-center gap-0.5 mt-0.5">
              <Flame className="w-3.5 h-3.5 fill-[#F59E0B]" />
              {user.streak} 天
            </span>
          </div>
          <div className="bg-[#FAF9FF] p-2.5 rounded-2xl border border-[#E6E2F5]">
            <span className="text-[10px] text-[#64748B] font-medium block">总经验值</span>
            <span className="text-sm font-bold text-[#6C4CF1] font-['Inter'] flex items-center justify-center gap-0.5 mt-0.5">
              <Star className="w-3.5 h-3.5 fill-[#6C4CF1]" />
              {user.xp}
            </span>
          </div>
          <div className="bg-[#FAF9FF] p-2.5 rounded-2xl border border-[#E6E2F5]">
            <span className="text-[10px] text-[#64748B] font-medium block">掌握定律</span>
            <span className="text-sm font-bold text-[#10B981] font-['Inter'] flex items-center justify-center gap-0.5 mt-0.5">
              <Trophy className="w-3.5 h-3.5 fill-[#10B981]" />
              {user.lawsMastered.length} 项
            </span>
          </div>
        </div>
      </div>

      {/* 2. Training Goals Section */}
      <div className="bg-white rounded-3xl p-5 border border-[#E6E2F5] shadow-[0_4px_20px_-2px_rgba(108,76,241,0.05)] space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-[#18181B] flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#6C4CF1]" />
            当前认知训练目标
          </h3>
          <button
            onClick={() => setShowGoalModal(true)}
            className="text-xs text-[#6C4CF1] font-bold hover:underline btn-press"
          >
            编辑目标
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {selectedGoals.map((goal, idx) => (
            <span
              key={idx}
              className="text-xs px-3 py-1 rounded-full bg-[#EDE9FE] text-[#6C4CF1] border border-[#DDD6FE] font-medium"
            >
              ✓ {goal}
            </span>
          ))}
        </div>
      </div>

      {/* 3. Settings & Preferences */}
      <div className="bg-white rounded-3xl p-5 border border-[#E6E2F5] shadow-[0_4px_20px_-2px_rgba(108,76,241,0.05)] space-y-4">
        <h3 className="text-xs font-bold text-[#18181B] flex items-center gap-1.5">
          <Settings className="w-4 h-4 text-[#64748B]" />
          应用设置与偏好
        </h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between py-1 border-b border-[#F5F3FF]">
            <div>
              <span className="text-xs font-semibold text-[#18181B] block">游戏音效反馈</span>
              <span className="text-[10px] text-[#64748B]">答对连击与结算提示音</span>
            </div>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                soundEnabled ? 'bg-[#6C4CF1]' : 'bg-[#E2E8F0]'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                  soundEnabled ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-[#F5F3FF]">
            <div>
              <span className="text-xs font-semibold text-[#18181B] block">触觉震动反馈</span>
              <span className="text-[10px] text-[#64748B]">按钮与错误轻触感</span>
            </div>
            <button
              onClick={() => setHapticEnabled(!hapticEnabled)}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                hapticEnabled ? 'bg-[#6C4CF1]' : 'bg-[#E2E8F0]'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                  hapticEnabled ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-rose-600 block">重置学习进度</span>
              <span className="text-[10px] text-[#64748B]">清空本地经验值与成就记录</span>
            </div>
            <button
              onClick={() => setShowResetConfirm(true)}
              className="text-xs font-bold px-3 py-1.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl hover:bg-rose-100 transition-colors btn-press"
            >
              重置数据
            </button>
          </div>
        </div>
      </div>

      {/* 4. Product Principles & Philosophy Banner */}
      <div className="bg-[#FAF9FF] rounded-3xl p-5 border border-[#E6E2F5] space-y-2 text-center">
        <span className="text-[11px] font-bold text-[#6C4CF1] flex items-center justify-center gap-1">
          <Info className="w-3.5 h-3.5" />
          MindLabZ · 智心堂 产品原则
        </span>
        <p className="text-[11px] text-[#64748B] leading-relaxed max-w-xs mx-auto">
          融合现代认知心理学与微交互游戏，非医疗诊断用途，旨在帮助每个人看清大脑思维捷径，拥抱更清醒的理性决策。
        </p>
      </div>

      {/* Goal Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-[#E6E2F5] space-y-4">
            <h3 className="text-base font-bold text-[#18181B]">定制你的认知训练目标</h3>
            <p className="text-xs text-[#64748B]">
              选择你最希望提升的大脑机能领域：
            </p>

            <div className="space-y-2">
              {GOAL_OPTIONS.map((g, idx) => {
                const isSelected = selectedGoals.includes(g);
                return (
                  <button
                    key={idx}
                    onClick={() => toggleGoal(g)}
                    className={`w-full text-left p-3 rounded-2xl text-xs font-semibold border transition-all flex items-center justify-between btn-press ${
                      isSelected
                        ? 'bg-[#EDE9FE] border-[#6C4CF1] text-[#6C4CF1]'
                        : 'bg-[#FAF9FF] border-[#E6E2F5] text-[#18181B]'
                    }`}
                  >
                    <span>{g}</span>
                    {isSelected && <Check className="w-4 h-4 text-[#6C4CF1]" />}
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleSaveGoals}
              className="w-full py-3 bg-[#6C4CF1] hover:bg-[#532CD8] text-white font-bold text-xs rounded-2xl shadow-xs transition-all btn-press"
            >
              保存训练目标
            </button>
          </div>
        </div>
      )}

      {/* Reset Confirmation Dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-[#E6E2F5] space-y-4 text-center">
            <h3 className="text-base font-bold text-rose-600">确定要重置所有学习数据吗？</h3>
            <p className="text-xs text-[#64748B]">
              这将会恢复默认的等级、积分和掌握度数据。
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2.5 bg-[#F5F3FF] text-[#64748B] font-bold text-xs rounded-2xl border border-[#E6E2F5] btn-press"
              >
                取消
              </button>
              <button
                onClick={() => {
                  resetProgress();
                  setShowResetConfirm(false);
                }}
                className="flex-1 py-2.5 bg-rose-600 text-white font-bold text-xs rounded-2xl btn-press shadow-xs"
              >
                确认重置
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

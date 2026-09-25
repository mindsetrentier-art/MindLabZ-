import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Flame, Star, Trophy, Bookmark, Settings, RotateCcw, Sparkles, Shield, Heart, HelpCircle, Check, Info, Cloud, LogIn, LogOut, CheckCircle2 } from 'lucide-react';
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
  const { user, firebaseUser, authReady, isSyncing, loginWithGoogle, logout, updateGoals, resetProgress, triggerConfetti } = useApp();

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticEnabled, setHapticEnabled] = useState(true);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [selectedGoals, setSelectedGoals] = useState<string[]>(user.selectedGoals || []);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    setSelectedGoals(user.selectedGoals || []);
  }, [user.selectedGoals]);

  const toggleGoal = (goal: string) => {
    setSelectedGoals(prev =>
      prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]
    );
  };

  const handleSaveGoals = () => {
    updateGoals(selectedGoals);
    setShowGoalModal(false);
    triggerConfetti();
  };

  const handleGoogleLogin = async () => {
    setAuthError(null);
    setAuthLoading(true);
    try {
      await loginWithGoogle();
      triggerConfetti();
    } catch (err) {
      setAuthError('Google 登录未完成或被取消，请重试。');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    setAuthError(null);
    await logout();
  };

  return (
    <div className="space-y-5 pb-6 animate-fadeIn">
      {/* 1. Profile Avatar & Hero Card */}
      <div className="art-hero-surface rounded-3xl p-6 text-center space-y-3.5 relative overflow-hidden">
        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#6C4CF1] to-[#A855F7] p-0.5 mx-auto shadow-[0_8px_24px_rgba(108,76,241,0.22)] relative">
          <div className="w-full h-full rounded-full overflow-hidden bg-white">
            <img
              src={user.avatar}
              alt={user.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
          {firebaseUser && (
            <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-[#10B981] border-2 border-white flex items-center justify-center shadow-xs" title="Firebase 云端已连接">
              <Check className="w-3.5 h-3.5 text-white stroke-[3px]" />
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-center gap-2">
            <h2 className="text-lg font-extrabold text-[#18181B]">{user.name}</h2>
            <span className="text-xs font-extrabold text-[#532CD8] font-numeric">
              Lv.{user.level}
            </span>
          </div>
          <p className="text-xs text-[#6C4CF1] font-semibold mt-0.5">{user.title}</p>
          {firebaseUser?.email && (
            <p className="text-[11px] text-[#64748B] font-numeric mt-0.5">{firebaseUser.email}</p>
          )}
        </div>

        {/* Firebase Authentication & Cloud Sync Bar */}
        <div className="pt-2">
          {!authReady ? (
            <div className="text-xs text-[#64748B] py-2">正在检测云端连接状态...</div>
          ) : firebaseUser ? (
            <div className="flex items-center justify-between bg-[#ECFDF5]/80 border border-[#A7F3D0] rounded-2xl px-4 py-2.5">
              <div className="flex items-center gap-2 text-left">
                <Cloud className="w-4 h-4 text-[#059669] shrink-0" />
                <div>
                  <span className="text-xs font-bold text-[#065F46] block">
                    {isSyncing ? '正在同步至 Firestore...' : 'Firebase 云端实时同步已开启'}
                  </span>
                  <span className="text-[10px] text-[#059669]">学习进度、收藏与最高分已安全备份</span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white text-[#475569] hover:text-rose-600 border border-[#D1FAE5] text-xs font-bold transition-colors btn-tactile whitespace-nowrap"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>退出</span>
              </button>
            </div>
          ) : (
            <div className="bg-[#FAF9FF] border border-[#DDD6FE] rounded-2xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#532CD8]">
                <Cloud className="w-4 h-4 text-[#6C4CF1]" />
                <span>连接 Firebase 云端账号</span>
              </div>
              <p className="text-[11px] text-[#64748B] leading-relaxed">
                使用 Google 账号登录，将您的认知训练进度、定律掌握度与高分纪录实时保存至 Firestore 云数据库。
              </p>
              {authError && (
                <p className="text-[11px] text-rose-600 font-medium">{authError}</p>
              )}
              <button
                onClick={handleGoogleLogin}
                disabled={authLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#532CD8] to-[#6C4CF1] hover:from-[#4320B8] hover:to-[#5B3BE0] text-white text-xs font-bold shadow-[0_6px_16px_rgba(108,76,241,0.28)] flex items-center justify-center gap-2 transition-all btn-tactile"
              >
                <LogIn className="w-4 h-4" />
                <span>{authLoading ? '正在连接 Google...' : '使用 Google 账号登录并同步'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Mini Stats Row */}
        <div className="grid grid-cols-3 gap-2.5 pt-3 border-t border-[#EDE9FE]">
          <div className="bg-white/90 p-3 rounded-2xl border border-[#EBE7F8]">
            <span className="text-[10px] text-[#64748B] font-medium block">连击打卡</span>
            <span className="text-sm font-extrabold text-[#D97706] font-numeric flex items-center justify-center gap-1 mt-0.5">
              <Flame className="w-3.5 h-3.5 fill-[#F59E0B] text-[#F59E0B]" />
              {user.streak} 天
            </span>
          </div>
          <div className="bg-white/90 p-3 rounded-2xl border border-[#EBE7F8]">
            <span className="text-[10px] text-[#64748B] font-medium block">总经验值</span>
            <span className="text-sm font-extrabold text-[#532CD8] font-numeric flex items-center justify-center gap-1 mt-0.5">
              <Star className="w-3.5 h-3.5 fill-[#6C4CF1] text-[#6C4CF1]" />
              {user.xp.toLocaleString()}
            </span>
          </div>
          <div className="bg-white/90 p-3 rounded-2xl border border-[#EBE7F8]">
            <span className="text-[10px] text-[#64748B] font-medium block">掌握定律</span>
            <span className="text-sm font-extrabold text-[#059669] font-numeric flex items-center justify-center gap-1 mt-0.5">
              <Trophy className="w-3.5 h-3.5 fill-[#10B981] text-[#10B981]" />
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

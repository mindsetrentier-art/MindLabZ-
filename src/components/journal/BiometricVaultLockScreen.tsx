import React, { useState, useEffect } from 'react';
import {
  Fingerprint,
  ScanFace,
  ShieldCheck,
  Lock,
  KeyRound,
  ArrowRight,
  AlertCircle,
  Sparkles,
  ShieldAlert,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { useBiometricLock } from '../../context/BiometricLockContext';

export const BiometricVaultLockScreen: React.FC = () => {
  const {
    biometricLabel,
    biometricIcon,
    unlockWithBiometrics,
    unlockWithPin,
    isAuthenticating,
    lastError,
    hasFallbackPin,
    isPlatformAvailable,
  } = useBiometricLock();

  const [usePinMode, setUsePinMode] = useState<boolean>(!isPlatformAvailable);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [submittingPin, setSubmittingPin] = useState<boolean>(false);
  const [autoPrompted, setAutoPrompted] = useState<boolean>(false);

  // Auto-trigger biometric prompt on screen load once if platform authenticator is available
  useEffect(() => {
    if (!autoPrompted && isPlatformAvailable && !usePinMode) {
      setAutoPrompted(true);
      // Brief timeout to let the screen mount gracefully
      const timer = setTimeout(() => {
        unlockWithBiometrics();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [autoPrompted, isPlatformAvailable, usePinMode, unlockWithBiometrics]);

  const handleBiometricClick = async () => {
    const success = await unlockWithBiometrics();
    if (!success) {
      // If biometrics failed or was canceled, offer easy PIN option
      setUsePinMode(true);
    }
  };

  const handlePinSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pinInput || pinInput.trim().length < 4) {
      setPinError('请输入至少 4 位备用密码');
      return;
    }
    setSubmittingPin(true);
    setPinError(null);
    const success = await unlockWithPin(pinInput.trim());
    setSubmittingPin(false);
    if (!success) {
      setPinError('安全密码不匹配，请重试');
      setPinInput('');
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-6 px-3 sm:px-6">
      <div className="w-full max-w-lg bg-white/95 backdrop-blur-[24px] border border-stone-200/90 rounded-3xl shadow-[0_20px_60px_-15px_rgba(28,25,23,0.12),0_1px_3px_rgba(28,25,23,0.04)] p-7 sm:p-10 space-y-7 relative overflow-hidden animate-fadeIn">
        {/* Subtle Ambient Decorative Gradient */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-transparent rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-gradient-to-tr from-amber-500/10 via-orange-500/5 to-transparent rounded-full blur-2xl pointer-events-none" />

        {/* Top Kicker & Secure Badge */}
        <div className="flex items-center justify-between border-b border-stone-200/70 pb-4">
          <div className="flex items-center gap-1.5 text-[11px] font-mono tracking-wider text-stone-600 font-bold uppercase">
            <Lock className="w-3.5 h-3.5 text-indigo-700" />
            <span>BIOMETRIC VAULT · 隐私保险箱</span>
          </div>

          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            <span>WebAuthn FIDO2</span>
          </span>
        </div>

        {/* Visual Biometric Emblem */}
        <div className="text-center space-y-4 pt-1">
          <div className="relative inline-flex items-center justify-center">
            {/* Pulsing Outer Rings */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#6C4CF1]/20 to-indigo-400/20 animate-ping opacity-30" />
            <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-tr from-stone-900 via-stone-800 to-indigo-950 text-white flex items-center justify-center shadow-lg border border-white/20">
              {biometricIcon === 'faceid' ? (
                <ScanFace className="w-10 h-10 text-indigo-200 animate-pulse" />
              ) : (
                <Fingerprint className="w-10 h-10 text-indigo-200 animate-pulse" />
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <h2 className="font-serif-editorial text-2xl font-bold text-stone-900 tracking-tight">
              心智手记已受安全加锁
            </h2>
            <p className="font-serif-editorial text-xs sm:text-sm text-stone-600 leading-relaxed max-w-sm mx-auto">
              此处包含深层情绪日记、苏格拉底认知重构与思维偏误剖析。已通过 {biometricLabel} 与硬件级隔离芯片保护。
            </p>
          </div>
        </div>

        {/* Action Panel: Biometric Prompt vs Fallback PIN */}
        {!usePinMode ? (
          <div className="space-y-4">
            <button
              onClick={handleBiometricClick}
              disabled={isAuthenticating}
              className="w-full py-3.5 px-6 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white text-sm font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2.5 active:scale-[0.98] cursor-pointer disabled:opacity-60"
            >
              {isAuthenticating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-indigo-300" />
                  <span>正在调起 {biometricLabel} 传感器...</span>
                </>
              ) : (
                <>
                  {biometricIcon === 'faceid' ? (
                    <ScanFace className="w-4 h-4 text-indigo-300" />
                  ) : (
                    <Fingerprint className="w-4 h-4 text-indigo-300" />
                  )}
                  <span>使用 {biometricLabel} 快速解锁</span>
                </>
              )}
            </button>

            {hasFallbackPin && (
              <button
                type="button"
                onClick={() => setUsePinMode(true)}
                className="w-full py-2.5 text-xs font-semibold text-stone-600 hover:text-stone-900 transition-colors flex items-center justify-center gap-1.5"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>改用备用安全密码 (PIN) 解锁</span>
              </button>
            )}

            {lastError && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>{lastError}</span>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-700 block">
                输入备用安全密码 (PIN)：
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  autoFocus
                  maxLength={12}
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    setPinError(null);
                  }}
                  placeholder="请输入 4-12 位安全密码..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50/50 text-sm font-mono tracking-widest text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:border-stone-900 focus:bg-white transition-all"
                />
              </div>
              {pinError && (
                <p className="text-xs text-rose-600 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>{pinError}</span>
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 pt-1">
              {isPlatformAvailable && (
                <button
                  type="button"
                  onClick={() => setUsePinMode(false)}
                  className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition-colors"
                >
                  返回 {biometricLabel}
                </button>
              )}

              <button
                type="submit"
                disabled={submittingPin || pinInput.length < 4}
                className="flex-1 py-2.5 px-5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {submittingPin ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <span>验证密码并解锁</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Security & Privacy Principles Guarantee Footer */}
        <div className="pt-3 border-t border-stone-200/70 text-[11px] text-stone-600 space-y-1.5 font-mono">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span>端到端本地验证：私钥永不离开设备硬件安全隔区 (Secure Enclave)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span>零数据上报：服务器无权接触您的生物面容或指纹特征原始数据</span>
          </div>
        </div>
      </div>
    </div>
  );
};

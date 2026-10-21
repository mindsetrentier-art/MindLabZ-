import React, { useState } from 'react';
import {
  X,
  Fingerprint,
  ScanFace,
  ShieldCheck,
  KeyRound,
  Check,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Lock,
} from 'lucide-react';
import { useBiometricLock } from '../../context/BiometricLockContext';
import { useApp } from '../../context/AppContext';

interface BiometricSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BiometricSetupModal: React.FC<BiometricSetupModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    biometricLabel,
    biometricIcon,
    isPlatformAvailable,
    enableBiometricLock,
    isEnabled,
  } = useBiometricLock();

  const { triggerConfetti } = useApp();

  const [pin, setPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [step, setStep] = useState<'intro' | 'pin' | 'biometric' | 'success'>('intro');

  if (!isOpen) return null;

  const handleStartSetup = () => {
    setStep('pin');
    setError(null);
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < 4) {
      setError('安全密码至少需要 4 位字符或数字');
      return;
    }
    if (pin !== confirmPin) {
      setError('两次输入的密码不一致，请核对');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    // Call enableBiometricLock: sets PIN & prompts WebAuthn registration
    const res = await enableBiometricLock(pin, isPlatformAvailable);
    setIsSubmitting(false);

    if (res.success) {
      setStep('success');
      triggerConfetti();
    } else {
      setError(res.error || '开启生物识别验证失败');
    }
  };

  const handleClose = () => {
    setStep('intro');
    setPin('');
    setConfirmPin('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md bg-white border border-stone-200 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 relative overflow-hidden">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors"
          aria-label="关闭"
        >
          <X className="w-4 h-4" />
        </button>

        {/* STEP 1: Intro */}
        {step === 'intro' && (
          <div className="space-y-6 text-center pt-2">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-stone-900 via-stone-800 to-indigo-900 text-white flex items-center justify-center mx-auto shadow-md">
              {biometricIcon === 'faceid' ? (
                <ScanFace className="w-8 h-8 text-indigo-200" />
              ) : (
                <Fingerprint className="w-8 h-8 text-indigo-200" />
              )}
            </div>

            <div className="space-y-2">
              <h3 className="font-serif-editorial text-xl font-bold text-stone-900">
                开启心智手记 {biometricLabel} 保护
              </h3>
              <p className="font-serif-editorial text-xs sm:text-sm text-stone-600 leading-relaxed">
                心智手记沉淀了您最敏感的私人心理思绪与认知复盘。通过 Web Authentication API，每次访问手记均需通过您的设备生物识别安全解锁。
              </p>
            </div>

            {/* Feature List */}
            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80 text-left space-y-2 text-xs">
              <div className="flex items-center gap-2 text-stone-800 font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>硬件级安全隔区 (Secure Enclave / TPM) 隔离</span>
              </div>
              <div className="flex items-center gap-2 text-stone-800 font-semibold">
                <KeyRound className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>配备备用安全密码，避免生物识别临时失灵</span>
              </div>
              <div className="flex items-center gap-2 text-stone-800 font-semibold">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <span>支持离开应用即自动上锁，守护私密心境</span>
              </div>
            </div>

            <button
              onClick={handleStartSetup}
              className="w-full py-3 px-6 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer btn-tactile"
            >
              <span>开始设置安全锁</span>
            </button>
          </div>
        )}

        {/* STEP 2: PIN Setup & WebAuthn Enrollment */}
        {step === 'pin' && (
          <form onSubmit={handlePinSubmit} className="space-y-5">
            <div className="space-y-1">
              <h3 className="font-serif-editorial text-lg font-bold text-stone-900">
                设置备用安全密码 (PIN)
              </h3>
              <p className="text-xs text-stone-500">
                在生物识别不便使用或换用无面容/指纹设备时，此密码作为您的解密凭证。
              </p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700 block">
                  设置 4-12 位安全密码：
                </label>
                <input
                  type="password"
                  required
                  autoFocus
                  maxLength={12}
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value);
                    setError(null);
                  }}
                  placeholder="例如：6 位数字或字母..."
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50/50 text-sm font-mono tracking-widest text-stone-900 focus:outline-hidden focus:border-stone-900 focus:bg-white transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700 block">
                  确认安全密码：
                </label>
                <input
                  type="password"
                  required
                  maxLength={12}
                  value={confirmPin}
                  onChange={(e) => {
                    setConfirmPin(e.target.value);
                    setError(null);
                  }}
                  placeholder="再次输入上述安全密码..."
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50/50 text-sm font-mono tracking-widest text-stone-900 focus:outline-hidden focus:border-stone-900 focus:bg-white transition-all"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStep('intro')}
                className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold"
              >
                上一步
              </button>
              <button
                type="submit"
                disabled={isSubmitting || pin.length < 4 || confirmPin.length < 4}
                className="flex-1 py-2.5 px-5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>正在调起 {biometricLabel} 绑定...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-300" />
                    <span>启用并绑定 {biometricLabel}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Success */}
        {step === 'success' && (
          <div className="space-y-6 text-center pt-2">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-xs">
              <Check className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h3 className="font-serif-editorial text-xl font-bold text-stone-900">
                生物识别隐私保护已成功激活
              </h3>
              <p className="font-serif-editorial text-xs sm:text-sm text-stone-600 leading-relaxed">
                您的心智手记现已受到 {biometricLabel} 与备用密码的双重硬件级保护。
              </p>
            </div>

            <button
              onClick={handleClose}
              className="w-full py-3 px-6 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-all shadow-xs"
            >
              完成并返回
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

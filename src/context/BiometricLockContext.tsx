import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import {
  isWebAuthnSupported,
  isPlatformAuthenticatorAvailable,
  detectBiometricLabel,
  registerBiometricCredential,
  authenticateBiometricCredential,
  hashSecurityPin,
} from '../services/biometricAuthService';

export type AutoLockTimeout = 'always' | '5m' | '15m' | 'never';

interface BiometricLockContextType {
  isSupported: boolean;
  isPlatformAvailable: boolean;
  biometricLabel: string;
  biometricIcon: 'faceid' | 'touchid' | 'fingerprint' | 'shield';
  isEnabled: boolean;
  isLocked: boolean;
  hasCredential: boolean;
  hasFallbackPin: boolean;
  autoLockSetting: AutoLockTimeout;
  isAuthenticating: boolean;
  lastError: string | null;
  showSetupModal: boolean;
  setShowSetupModal: (open: boolean) => void;
  // Actions
  unlockWithBiometrics: () => Promise<boolean>;
  unlockWithPin: (pin: string) => Promise<boolean>;
  lockVault: () => void;
  unlockVault: () => void;
  enableBiometricLock: (
    pin: string,
    enrollWebAuthn?: boolean
  ) => Promise<{ success: boolean; error?: string }>;
  disableBiometricLock: (pin: string) => Promise<boolean>;
  updateFallbackPin: (oldPin: string, newPin: string) => Promise<boolean>;
  setAutoLockSetting: (setting: AutoLockTimeout) => void;
  testBiometricPrompt: () => Promise<{ success: boolean; message: string }>;
}

const STORAGE_KEYS = {
  ENABLED: 'mindlabz_biometric_vault_enabled',
  CREDENTIAL_ID: 'mindlabz_biometric_credential_id',
  PIN_HASH: 'mindlabz_biometric_pin_hash',
  AUTO_LOCK: 'mindlabz_biometric_autolock',
};

const BiometricLockContext = createContext<BiometricLockContextType | null>(null);

export const BiometricLockProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isSupported, setIsSupported] = useState<boolean>(() => isWebAuthnSupported());
  const [isPlatformAvailable, setIsPlatformAvailable] = useState<boolean>(false);
  const [biometricInfo] = useState(() => detectBiometricLabel());

  // Stored preferences
  const [isEnabled, setIsEnabled] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEYS.ENABLED) === 'true';
  });

  // Vault locked state: if enabled, vault is locked by default upon session entry
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEYS.ENABLED) === 'true';
  });

  const [hasCredential, setHasCredential] = useState<boolean>(() => {
    return !!localStorage.getItem(STORAGE_KEYS.CREDENTIAL_ID);
  });

  const [hasFallbackPin, setHasFallbackPin] = useState<boolean>(() => {
    return !!localStorage.getItem(STORAGE_KEYS.PIN_HASH);
  });

  const [autoLockSetting, setAutoLockSettingState] = useState<AutoLockTimeout>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AUTO_LOCK);
    if (saved === 'always' || saved === '5m' || saved === '15m' || saved === 'never') {
      return saved;
    }
    return 'always';
  });

  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [showSetupModal, setShowSetupModal] = useState<boolean>(false);

  const lastActivityRef = useRef<number>(Date.now());

  // Check hardware platform authenticator on mount
  useEffect(() => {
    let isMounted = true;
    isPlatformAuthenticatorAvailable().then((available) => {
      if (isMounted) {
        setIsPlatformAvailable(available);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Update activity timestamp on interaction
  const recordActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  useEffect(() => {
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    const handler = () => recordActivity();
    events.forEach((evt) => window.addEventListener(evt, handler, { passive: true }));
    return () => {
      events.forEach((evt) => window.removeEventListener(evt, handler));
    };
  }, [recordActivity]);

  // Handle visibility change and auto-lock timeout
  useEffect(() => {
    if (!isEnabled) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        if (autoLockSetting === 'always') {
          setIsLocked(true);
        }
      } else if (document.visibilityState === 'visible') {
        const elapsedMinutes = (Date.now() - lastActivityRef.current) / (1000 * 60);
        if (autoLockSetting === 'always') {
          setIsLocked(true);
        } else if (autoLockSetting === '5m' && elapsedMinutes >= 5) {
          setIsLocked(true);
        } else if (autoLockSetting === '15m' && elapsedMinutes >= 15) {
          setIsLocked(true);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isEnabled, autoLockSetting]);

  // Set auto-lock timeout
  const setAutoLockSetting = useCallback((setting: AutoLockTimeout) => {
    setAutoLockSettingState(setting);
    localStorage.setItem(STORAGE_KEYS.AUTO_LOCK, setting);
  }, []);

  // Lock vault manually
  const lockVault = useCallback(() => {
    setIsLocked(true);
    setLastError(null);
  }, []);

  // Unlock vault manually (in session)
  const unlockVault = useCallback(() => {
    setIsLocked(false);
    setLastError(null);
    lastActivityRef.current = Date.now();
  }, []);

  // Unlock using Biometrics (Face ID / Touch ID / WebAuthn)
  const unlockWithBiometrics = useCallback(async (): Promise<boolean> => {
    setIsAuthenticating(true);
    setLastError(null);
    try {
      const storedCredentialId = localStorage.getItem(STORAGE_KEYS.CREDENTIAL_ID);
      const res = await authenticateBiometricCredential(storedCredentialId);
      if (res.success) {
        setIsLocked(false);
        lastActivityRef.current = Date.now();
        setIsAuthenticating(false);
        return true;
      } else {
        setLastError(res.error || '生物识别验证失败');
        setIsAuthenticating(false);
        return false;
      }
    } catch (err: any) {
      setLastError(err.message || '生物识别验证异常');
      setIsAuthenticating(false);
      return false;
    }
  }, []);

  // Unlock using Fallback PIN
  const unlockWithPin = useCallback(async (pin: string): Promise<boolean> => {
    const storedHash = localStorage.getItem(STORAGE_KEYS.PIN_HASH);
    if (!storedHash) {
      // If no PIN has been set yet, accept and initialize
      const newHash = await hashSecurityPin(pin);
      localStorage.setItem(STORAGE_KEYS.PIN_HASH, newHash);
      setHasFallbackPin(true);
      setIsLocked(false);
      lastActivityRef.current = Date.now();
      return true;
    }

    const inputHash = await hashSecurityPin(pin);
    if (inputHash === storedHash) {
      setIsLocked(false);
      setLastError(null);
      lastActivityRef.current = Date.now();
      return true;
    } else {
      setLastError('备用安全密码错误，请重新输入。');
      return false;
    }
  }, []);

  // Enable Biometric Lock (Sets PIN and optionally registers WebAuthn credential)
  const enableBiometricLock = useCallback(
    async (
      pin: string,
      enrollWebAuthn = true
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        if (!pin || pin.trim().length < 4) {
          return { success: false, error: '备用安全密码至少需要 4 位数字或字符。' };
        }

        const pinHash = await hashSecurityPin(pin.trim());
        localStorage.setItem(STORAGE_KEYS.PIN_HASH, pinHash);
        setHasFallbackPin(true);

        if (enrollWebAuthn && isSupported) {
          const regRes = await registerBiometricCredential();
          if (regRes.success && regRes.credentialId) {
            localStorage.setItem(STORAGE_KEYS.CREDENTIAL_ID, regRes.credentialId);
            setHasCredential(true);
          } else if (regRes.error) {
            console.warn('[WebAuthn Enrollment Warning]:', regRes.error);
            // Even if hardware enrollment was canceled, PIN protection is enabled!
          }
        }

        localStorage.setItem(STORAGE_KEYS.ENABLED, 'true');
        setIsEnabled(true);
        setIsLocked(false); // keep unlocked right after setup
        lastActivityRef.current = Date.now();
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message || '开启生物识别隐私锁失败。' };
      }
    },
    [isSupported]
  );

  // Disable Biometric Lock (Requires PIN verification)
  const disableBiometricLock = useCallback(async (pin: string): Promise<boolean> => {
    const storedHash = localStorage.getItem(STORAGE_KEYS.PIN_HASH);
    if (storedHash) {
      const inputHash = await hashSecurityPin(pin);
      if (inputHash !== storedHash) {
        setLastError('密码验证失败，无法解除锁定。');
        return false;
      }
    }

    localStorage.removeItem(STORAGE_KEYS.ENABLED);
    setIsEnabled(false);
    setIsLocked(false);
    setLastError(null);
    return true;
  }, []);

  // Update fallback PIN
  const updateFallbackPin = useCallback(
    async (oldPin: string, newPin: string): Promise<boolean> => {
      const storedHash = localStorage.getItem(STORAGE_KEYS.PIN_HASH);
      if (storedHash) {
        const inputHash = await hashSecurityPin(oldPin);
        if (inputHash !== storedHash) {
          setLastError('原安全密码错误。');
          return false;
        }
      }
      if (!newPin || newPin.trim().length < 4) {
        setLastError('新密码至少需要 4 位。');
        return false;
      }
      const newHash = await hashSecurityPin(newPin.trim());
      localStorage.setItem(STORAGE_KEYS.PIN_HASH, newHash);
      setHasFallbackPin(true);
      setLastError(null);
      return true;
    },
    []
  );

  // Test Biometric Verification prompt
  const testBiometricPrompt = useCallback(async (): Promise<{
    success: boolean;
    message: string;
  }> => {
    if (!isSupported) {
      return { success: false, message: '当前设备不支持 Web Authentication API。' };
    }
    const res = await authenticateBiometricCredential(
      localStorage.getItem(STORAGE_KEYS.CREDENTIAL_ID)
    );
    if (res.success) {
      return {
        success: true,
        message: `${biometricInfo.name} 硬件级安全验证成功！传感器工作正常。`,
      };
    } else {
      return {
        success: false,
        message: res.error || '验证未通过或已取消。',
      };
    }
  }, [isSupported, biometricInfo.name]);

  return (
    <BiometricLockContext.Provider
      value={{
        isSupported,
        isPlatformAvailable,
        biometricLabel: biometricInfo.name,
        biometricIcon: biometricInfo.icon,
        isEnabled,
        isLocked,
        hasCredential,
        hasFallbackPin,
        autoLockSetting,
        isAuthenticating,
        lastError,
        showSetupModal,
        setShowSetupModal,
        unlockWithBiometrics,
        unlockWithPin,
        lockVault,
        unlockVault,
        enableBiometricLock,
        disableBiometricLock,
        updateFallbackPin,
        setAutoLockSetting,
        testBiometricPrompt,
      }}
    >
      {children}
    </BiometricLockContext.Provider>
  );
};

export const useBiometricLock = (): BiometricLockContextType => {
  const context = useContext(BiometricLockContext);
  if (!context) {
    throw new Error('useBiometricLock must be used within a BiometricLockProvider');
  }
  return context;
};

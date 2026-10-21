/**
 * Biometric Authentication Service utilizing the Web Authentication API (WebAuthn / FIDO2)
 * Supports FaceID, TouchID, Windows Hello, and Android Biometrics for private journal encryption and locking.
 */

export interface BiometricCapability {
  isSupported: boolean;
  isPlatformAuthenticatorAvailable: boolean;
  deviceLabel: string;
  deviceIcon: 'faceid' | 'touchid' | 'fingerprint' | 'shield';
}

/**
 * Checks whether the Web Authentication API is supported in current environment
 */
export function isWebAuthnSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.PublicKeyCredential !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    typeof navigator.credentials !== 'undefined' &&
    typeof navigator.credentials.create === 'function' &&
    typeof navigator.credentials.get === 'function'
  );
}

/**
 * Checks whether a platform authenticator (Face ID, Touch ID, Windows Hello, Android Biometrics) is available
 */
export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  if (!isWebAuthnSupported()) return false;
  if (typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable !== 'function') {
    return false;
  }
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch (err) {
    console.warn('[WebAuthn] Platform authenticator check failed:', err);
    return false;
  }
}

/**
 * Detects device platform for personalized branding (Face ID vs Touch ID vs Windows Hello vs Fingerprint)
 */
export function detectBiometricLabel(): {
  name: string;
  icon: 'faceid' | 'touchid' | 'fingerprint' | 'shield';
} {
  if (typeof navigator === 'undefined') {
    return { name: 'Face ID / Touch ID', icon: 'faceid' };
  }

  const ua = navigator.userAgent || '';
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isMac = /Macintosh|Mac OS X/i.test(ua) && !isIOS;
  const isAndroid = /Android/i.test(ua);
  const isWindows = /Windows/i.test(ua);

  if (isIOS) {
    return { name: 'Face ID / Touch ID', icon: 'faceid' };
  }
  if (isMac) {
    return { name: 'Touch ID', icon: 'touchid' };
  }
  if (isAndroid) {
    return { name: '指纹 / 面部识别', icon: 'fingerprint' };
  }
  if (isWindows) {
    return { name: 'Windows Hello', icon: 'faceid' };
  }
  return { name: '生物识别 (Face ID / Touch ID)', icon: 'fingerprint' };
}

/**
 * Helper to convert ArrayBuffer to Base64
 */
function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Helper to convert Base64 to Uint8Array
 */
function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Generates cryptographic challenge
 */
function generateChallenge(): Uint8Array {
  const array = new Uint8Array(32);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(array);
  } else {
    for (let i = 0; i < 32; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  return array;
}

/**
 * Hashes a security fallback PIN using SHA-256
 */
export async function hashSecurityPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`mindlabz_vault_salt_${pin.trim()}`);
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    return bufferToBase64(hashBuffer);
  }
  // Basic deterministic fallback if WebCrypto is unavailable
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = (hash << 5) - hash + data[i];
    hash |= 0;
  }
  return `hash_${Math.abs(hash)}`;
}

/**
 * Registers a new biometric credential via navigator.credentials.create()
 */
export async function registerBiometricCredential(
  userId = 'user_vault',
  userName = 'MindLabZ User',
  displayName = '心智堂 心理手记保险箱'
): Promise<{ success: boolean; credentialId?: string; error?: string }> {
  if (!isWebAuthnSupported()) {
    return {
      success: false,
      error: '当前浏览器或运行环境不支持 Web Authentication API。',
    };
  }

  try {
    const challenge = generateChallenge();
    const userIdBytes = new TextEncoder().encode(userId);

    const creationOptions: PublicKeyCredentialCreationOptions = {
      challenge,
      rp: {
        name: 'MindLabZ · 心智堂 隐私保险箱',
      },
      user: {
        id: userIdBytes,
        name: userName,
        displayName: displayName,
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' }, // ES256 (standard for Face ID / Touch ID / Android)
        { alg: -257, type: 'public-key' }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform', // Hardware device biometric authenticator
        userVerification: 'required', // Enforces FaceID / TouchID / device biometric verification
        residentKey: 'preferred',
      },
      timeout: 60000,
      attestation: 'none',
    };

    const credential = (await navigator.credentials.create({
      publicKey: creationOptions,
    })) as PublicKeyCredential | null;

    if (!credential) {
      return { success: false, error: '生物识别凭证创建被取消。' };
    }

    const credentialId = bufferToBase64(credential.rawId);
    return { success: true, credentialId };
  } catch (err: any) {
    console.warn('[WebAuthn Registration Error]:', err);
    if (err.name === 'NotAllowedError') {
      return {
        success: false,
        error: '用户取消了生物识别验证，或系统未授予生物识别权限。',
      };
    }
    if (err.name === 'SecurityError') {
      return {
        success: false,
        error: '环境安全策略限制，请在 HTTPS 或安全域中运行。',
      };
    }
    return {
      success: false,
      error: err.message || '生物识别登记失败，请检查设备是否已设置锁屏密码与指纹/面容。',
    };
  }
}

/**
 * Authenticates / unlocks via navigator.credentials.get()
 */
export async function authenticateBiometricCredential(
  credentialId?: string | null
): Promise<{ success: boolean; error?: string }> {
  if (!isWebAuthnSupported()) {
    return {
      success: false,
      error: '当前浏览器不支持 Web Authentication API。',
    };
  }

  try {
    const challenge = generateChallenge();

    const requestOptions: PublicKeyCredentialRequestOptions = {
      challenge,
      timeout: 60000,
      userVerification: 'required',
    };

    if (credentialId) {
      try {
        requestOptions.allowCredentials = [
          {
            id: base64ToUint8Array(credentialId),
            type: 'public-key',
            transports: ['internal'],
          },
        ];
      } catch {
        // Fallback without allowCredentials if parsing failed
      }
    }

    const assertion = await navigator.credentials.get({
      publicKey: requestOptions,
    });

    if (!assertion) {
      return { success: false, error: '生物识别验证未通过。' };
    }

    return { success: true };
  } catch (err: any) {
    console.warn('[WebAuthn Authentication Error]:', err);
    if (err.name === 'NotAllowedError') {
      return {
        success: false,
        error: '生物识别验证被取消或超时。您可尝试重新验证，或使用备用密码。',
      };
    }
    return {
      success: false,
      error: err.message || '生物识别验证失败。',
    };
  }
}

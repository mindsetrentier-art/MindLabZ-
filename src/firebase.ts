import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  signInAnonymously,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  inMemoryPersistence,
  UserCredential,
} from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with the provisioned named database ID
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Initialize Firebase Authentication & Google Provider
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Always prompt account selection so different users can log in and switch accounts cleanly
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Ensure Auth persistence works across all browsers, mobile webviews, and iframe policies
async function initAuthPersistence() {
  try {
    await setPersistence(auth, browserLocalPersistence);
  } catch {
    try {
      await setPersistence(auth, browserSessionPersistence);
    } catch {
      try {
        await setPersistence(auth, inMemoryPersistence);
      } catch {
        // Ignore if persistence is already locked
      }
    }
  }
}
void initAuthPersistence();

// Check for any pending redirect sign-in result on boot with comprehensive error reporting
export interface RedirectSignInOutcome {
  credential: UserCredential | null;
  error: any | null;
}

export async function checkPendingRedirectSignIn(): Promise<RedirectSignInOutcome> {
  try {
    const cred = await getRedirectResult(auth);
    return { credential: cred, error: null };
  } catch (err) {
    console.warn('Redirect sign-in notice / error:', err);
    return { credential: null, error: err };
  }
}

// Environment & Device Helpers for Cross-Device / Mobile Compatibility
export function isMobileBrowser(): boolean {
  if (typeof window === 'undefined' || !window.navigator) return false;
  const ua = window.navigator.userAgent || window.navigator.vendor || '';
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(ua);
}

export function isInAppBrowser(): boolean {
  if (typeof window === 'undefined' || !window.navigator) return false;
  const ua = window.navigator.userAgent || '';
  return /FBAN|FBAV|Instagram|Line|MicroMessenger|WhatsApp|LinkedInApp|Twitter|ByteDance/i.test(ua);
}

export function isInIframe(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

export function getCurrentHostname(): string {
  if (typeof window === 'undefined') return '';
  return window.location.hostname || '';
}

export function getCurrentOrigin(): string {
  if (typeof window === 'undefined') return '';
  return window.location.origin || '';
}

// Standardized Firestore Operation Types & Error Handler
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface AuthErrorDiagnostic {
  code: string;
  titleFr: string;
  messageFr: string;
  hostname: string;
  isDomainError: boolean;
  isPopupError: boolean;
  isInAppBrowserError: boolean;
  isCookieError: boolean;
  recommendedActionFr: string;
}

export function diagnoseFirebaseAuthError(err: any): AuthErrorDiagnostic {
  const code = String(err?.code || err?.message || 'unknown');
  const hostname = getCurrentHostname();

  if (code.includes('auth/unauthorized-domain')) {
    return {
      code: 'auth/unauthorized-domain',
      titleFr: 'Domaine non autorisé dans Firebase Auth',
      messageFr: `Votre application ou téléphone accède au site depuis "${hostname}". Firebase bloque la connexion Google car ce domaine n'est pas encore déclaré dans les domaines autorisés de votre projet Firebase.`,
      hostname,
      isDomainError: true,
      isPopupError: false,
      isInAppBrowserError: false,
      isCookieError: false,
      recommendedActionFr: `Copiez "${hostname}" et ajoutez-le dans Firebase Console → Authentication → Paramètres → Domaines autorisés, ou utilisez la Synchronisation Cloud Immédiate ci-dessous.`,
    };
  }

  if (
    code.includes('auth/popup-blocked') ||
    code.includes('auth/cancelled-popup-request') ||
    code.includes('auth/operation-not-supported-in-this-environment')
  ) {
    return {
      code,
      titleFr: 'Fenêtre pop-up Google bloquée par le navigateur',
      messageFr:
        'Votre navigateur mobile ou desktop bloque les fenêtres pop-up. Sur téléphone (Safari iOS / Android), il est recommandé d’utiliser la connexion par Redirection.',
      hostname,
      isDomainError: false,
      isPopupError: true,
      isInAppBrowserError: false,
      isCookieError: false,
      recommendedActionFr:
        'Cliquez sur « Mode Redirection (Recommandé sur mobile) » pour vous connecter sans pop-up.',
    };
  }

  if (code.includes('auth/disallowed_useragent') || isInAppBrowser()) {
    return {
      code: 'auth/disallowed_useragent',
      titleFr: 'Navigateur intégré non pris en charge (In-App WebView)',
      messageFr:
        'Google OAuth bloque les connexions depuis les navigateurs intégrés à des applications externes (Instagram, WhatsApp, Facebook, LinkedIn, etc.) pour des raisons de sécurité.',
      hostname,
      isDomainError: false,
      isPopupError: false,
      isInAppBrowserError: true,
      isCookieError: false,
      recommendedActionFr:
        'Touchez les options (⋮ ou ⋯) de votre application et choisissez « Ouvrir dans Safari » ou « Ouvrir dans Chrome ».',
    };
  }

  if (code.includes('auth/popup-closed-by-user')) {
    return {
      code: 'auth/popup-closed-by-user',
      titleFr: 'Sélection de compte Google interrompue',
      messageFr:
        'La fenêtre de sélection de compte a été fermée avant la fin de l’authentification.',
      hostname,
      isDomainError: false,
      isPopupError: false,
      isInAppBrowserError: false,
      isCookieError: false,
      recommendedActionFr:
        'Cliquez à nouveau sur le bouton de connexion Google pour choisir votre compte.',
    };
  }

  if (code.includes('auth/third-party-cookies-blocked') || code.includes('auth/web-storage-unsupported')) {
    return {
      code,
      titleFr: 'Cookies tiers ou stockage bloqués',
      messageFr:
        'Votre navigateur bloque les cookies tiers nécessaires à Google Auth dans cet environnement ou cette iframe.',
      hostname,
      isDomainError: false,
      isPopupError: true,
      isInAppBrowserError: false,
      isCookieError: true,
      recommendedActionFr:
        'Ouvrez le site dans un nouvel onglet autonome ou activez les cookies tiers dans les réglages de votre navigateur.',
    };
  }

  if (code.includes('auth/network-request-failed')) {
    return {
      code: 'auth/network-request-failed',
      titleFr: 'Erreur réseau de communication avec Google',
      messageFr:
        'Impossible de contacter les serveurs Firebase Authentication. Vérifiez votre connexion Internet.',
      hostname,
      isDomainError: false,
      isPopupError: false,
      isInAppBrowserError: false,
      isCookieError: false,
      recommendedActionFr: 'Vérifiez votre connexion Wi-Fi ou mobile et réessayez.',
    };
  }

  return {
    code,
    titleFr: 'Erreur de connexion Google Auth',
    messageFr: `Détail technique (${code}) : Vérifiez que le fournisseur Google est activé et que le domaine "${hostname}" est autorisé dans Firebase.`,
    hostname,
    isDomainError: code.includes('unauthorized') || code.includes('domain'),
    isPopupError: true,
    isInAppBrowserError: false,
    isCookieError: false,
    recommendedActionFr: `Vérifiez l’activation de Google Provider dans Firebase Console pour le projet "${firebaseConfig.projectId}".`,
  };
}

export async function signInWithGoogle() {
  googleProvider.setCustomParameters({
    prompt: 'select_account',
  });
  return signInWithPopup(auth, googleProvider);
}

export async function signInWithGoogleRedirect() {
  googleProvider.setCustomParameters({
    prompt: 'select_account',
  });
  return signInWithRedirect(auth, googleProvider);
}

export async function signInAsGuestCloud() {
  return signInAnonymously(auth);
}

export async function logOutFirebase() {
  return signOut(auth);
}

export interface ConnectivityDiagnostic {
  isConfigured: boolean;
  projectId: string;
  hostname: string;
  firestorePingMs: number | null;
  firestoreStatus: 'online' | 'offline' | 'error' | 'testing';
  isAuthInitialized: boolean;
  currentUserId: string | null;
  currentUserEmail: string | null;
  isAnonymous: boolean;
}

export async function checkConnectivityDiagnostic(): Promise<ConnectivityDiagnostic> {
  const hostname = getCurrentHostname();
  const current = auth.currentUser;
  const result: ConnectivityDiagnostic = {
    isConfigured: Boolean(firebaseConfig.projectId && firebaseConfig.apiKey),
    projectId: firebaseConfig.projectId,
    hostname,
    firestorePingMs: null,
    firestoreStatus: 'testing',
    isAuthInitialized: Boolean(auth),
    currentUserId: current?.uid || null,
    currentUserEmail: current?.email || null,
    isAnonymous: current?.isAnonymous || false,
  };

  const t0 = performance.now();
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    result.firestorePingMs = Math.round(performance.now() - t0);
    result.firestoreStatus = 'online';
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (!msg.includes('the client is offline')) {
      // Permission denied or not-found still proves network connectivity to Firestore server
      result.firestorePingMs = Math.round(performance.now() - t0);
      result.firestoreStatus = 'online';
    } else {
      result.firestoreStatus = 'offline';
    }
  }

  return result;
}


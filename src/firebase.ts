import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
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

// Check for any pending redirect sign-in result on boot
export async function checkPendingRedirectSignIn(): Promise<UserCredential | null> {
  try {
    return await getRedirectResult(auth);
  } catch (err) {
    console.warn('Redirect sign-in check notice:', err);
    return null;
  }
}

// Validate connection to Firestore on boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
void testConnection();

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
}

export function diagnoseFirebaseAuthError(err: any): AuthErrorDiagnostic {
  const code = String(err?.code || err?.message || 'unknown');
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';

  if (code.includes('auth/unauthorized-domain')) {
    return {
      code: 'auth/unauthorized-domain',
      titleFr: 'Domaine non autorisé dans Firebase Auth',
      messageFr: `Pour que tous les utilisateurs puissent se connecter depuis cette adresse, ajoutez le domaine "${hostname}" dans Firebase Console → Authentication → Settings → Authorized domains.`,
      hostname,
      isDomainError: true,
      isPopupError: false,
    };
  }

  if (
    code.includes('auth/popup-blocked') ||
    code.includes('auth/cancelled-popup-request') ||
    code.includes('auth/operation-not-supported-in-this-environment')
  ) {
    return {
      code,
      titleFr: 'Fenêtre pop-up bloquée par le navigateur',
      messageFr:
        'Votre navigateur ou appareil mobile a bloqué la fenêtre pop-up Google. Autorisez les pop-ups ou utilisez le bouton « Connexion par Redirection » / « Changer de profil » ci-dessous.',
      hostname,
      isDomainError: false,
      isPopupError: true,
    };
  }

  if (code.includes('auth/popup-closed-by-user')) {
    return {
      code: 'auth/popup-closed-by-user',
      titleFr: 'Fenêtre de connexion fermée',
      messageFr:
        'La fenêtre de sélection de compte Google a été fermée avant la fin de la connexion. Cliquez à nouveau pour choisir votre compte.',
      hostname,
      isDomainError: false,
      isPopupError: false,
    };
  }

  if (code.includes('auth/third-party-cookies-blocked') || code.includes('auth/web-storage-unsupported')) {
    return {
      code,
      titleFr: 'Cookies tiers restreints dans ce navigateur',
      messageFr:
        'Votre navigateur bloque les cookies tiers dans cet aperçu intégré. Ouvrez l’application dans un nouvel onglet ou utilisez le sélecteur multi-utilisateurs ci-dessous.',
      hostname,
      isDomainError: false,
      isPopupError: true,
    };
  }

  return {
    code,
    titleFr: 'Erreur de connexion Google Auth',
    messageFr: `Détail technique (${code}) : Vérifiez que le fournisseur Google est activé et que le domaine "${hostname}" est autorisé dans Firebase Authentication.`,
    hostname,
    isDomainError: true,
    isPopupError: true,
  };
}

export async function signInWithGoogle() {
  // Always ensure account chooser is shown for multi-user support
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

export async function logOutFirebase() {
  return signOut(auth);
}

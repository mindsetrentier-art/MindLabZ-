/**
 * Firestore Security Rules Test Specification (Dirty Dozen Verification)
 * Verifies that all 12 adversarial payloads in security_spec.md return PERMISSION_DENIED.
 */

export interface SecurityTestCase {
  id: number;
  name: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  path: string;
  auth: { uid: string; email_verified: boolean } | null;
  payload?: Record<string, unknown>;
  expectedResult: 'PERMISSION_DENIED' | 'ALLOWED';
}

const VALID_BASE_PAYLOAD = {
  uid: 'user_A',
  name: 'Alex Chen',
  avatar: 'https://example.com/avatar.png',
  title: '认知探索者',
  level: 12,
  xp: 1250,
  streak: 7,
  lastActiveDate: '2026-09-25',
  totalGames: 86,
  totalQuizzes: 42,
  quizPoints: 1860,
  lawsMastered: ['zeigarnik-effect'],
  lawMasteryMap: { 'zeigarnik-effect': 85 },
  bookmarks: ['zeigarnik-effect'],
  gameHighScores: { 'memory-lab': 8450 },
  unlockedBadges: ['streak-7'],
  selectedGoals: ['Memory'],
  hasCompletedOnboarding: true,
  isDailyChallengeCompleted: false,
  stats: {
    memory: 82,
    attention: 88,
    reasoning: 75,
    knowledge: 90,
    decision: 84,
  },
  weeklyActivity: [],
  createdAt: '__SERVER_TIMESTAMP__',
  updatedAt: '__SERVER_TIMESTAMP__',
};

export const DIRTY_DOZEN_TESTS: SecurityTestCase[] = [
  {
    id: 1,
    name: 'Identity Spoofing on Create (uid mismatch)',
    operation: 'create',
    path: '/users/user_A',
    auth: { uid: 'user_A', email_verified: true },
    payload: { ...VALID_BASE_PAYLOAD, uid: 'user_B' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Cross-User Write Attempt',
    operation: 'update',
    path: '/users/user_B',
    auth: { uid: 'user_A', email_verified: true },
    payload: { ...VALID_BASE_PAYLOAD, uid: 'user_B' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Unverified Email Write Attempt',
    operation: 'create',
    path: '/users/user_A',
    auth: { uid: 'user_A', email_verified: false },
    payload: VALID_BASE_PAYLOAD,
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Shadow Field Injection on Create (isAdmin: true)',
    operation: 'create',
    path: '/users/user_A',
    auth: { uid: 'user_A', email_verified: true },
    payload: { ...VALID_BASE_PAYLOAD, isAdmin: true },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Shadow Field Injection on Update (hackedXP)',
    operation: 'update',
    path: '/users/user_A',
    auth: { uid: 'user_A', email_verified: true },
    payload: { ...VALID_BASE_PAYLOAD, hackedXP: 999999 },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Immutable createdAt Tampering on Update',
    operation: 'update',
    path: '/users/user_A',
    auth: { uid: 'user_A', email_verified: true },
    payload: { ...VALID_BASE_PAYLOAD, createdAt: '2099-01-01T00:00:00Z' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Immutable uid Tampering on Update',
    operation: 'update',
    path: '/users/user_A',
    auth: { uid: 'user_A', email_verified: true },
    payload: { ...VALID_BASE_PAYLOAD, uid: 'user_C' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Forged Client Timestamp on Update',
    operation: 'update',
    path: '/users/user_A',
    auth: { uid: 'user_A', email_verified: true },
    payload: { ...VALID_BASE_PAYLOAD, updatedAt: '2020-01-01T00:00:00Z' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'String Overflow Poisoning (name > 100 chars)',
    operation: 'update',
    path: '/users/user_A',
    auth: { uid: 'user_A', email_verified: true },
    payload: { ...VALID_BASE_PAYLOAD, name: 'A'.repeat(250) },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Unbounded Array Overflow (bookmarks > 50 items)',
    operation: 'update',
    path: '/users/user_A',
    auth: { uid: 'user_A', email_verified: true },
    payload: { ...VALID_BASE_PAYLOAD, bookmarks: Array.from({ length: 60 }, (_, i) => `law-${i}`) },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Value Poisoning on Numeric Stats (negative XP / out-of-range stats)',
    operation: 'update',
    path: '/users/user_A',
    auth: { uid: 'user_A', email_verified: true },
    payload: { ...VALID_BASE_PAYLOAD, xp: -500 },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Cross-User Read & Collection Enumeration',
    operation: 'get',
    path: '/users/user_B',
    auth: { uid: 'user_A', email_verified: true },
    expectedResult: 'PERMISSION_DENIED',
  },
];

export type CategoryType = 'cognitive' | 'memory' | 'social' | 'decision' | 'behavior' | 'emotion';

export type CategoryZh = '认知' | '记忆' | '社会' | '决策' | '行为' | '情绪';

export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';

export interface StructuredLawQuizItem {
  question: string;
  options: string[];
  answer_index: number;
  explanation: string;
}

export interface StructuredLawGame {
  title: string;
  type: string;
  scenario: string;
  option_a: string;
  option_b: string;
  rational_choice: string;
  insight: string;
}

export interface StructuredLawData {
  id: string;
  title_zh: string;
  title_en: string;
  category?: string;
  chapter?: string;
  definition: string;
  mechanism: string;
  real_life_case: string;
  workplace_case: string;
  relationship_case: string;
  business_case: string;
  recognition_signals: string[];
  anti_manipulation: string[];
  quiz: StructuredLawQuizItem[];
  game: StructuredLawGame;
  difficulty: DifficultyLevel;
  xp: number;
  evidence_level: string;
}

export interface PsychologyLaw {
  id: string;
  codeId?: string; // e.g. LAW001 - LAW100
  chapter?: string;
  xpReward?: number;
  evidenceLevel?: string;
  nameZh: string;
  nameEn: string;
  category: CategoryType;
  categoryZh: CategoryZh;
  shortExplanation: string;
  detailedExplanation: string;
  whyItHappens: string;
  realLifeExample: string;
  workplaceCase?: string;
  relationshipCase?: string;
  businessCase?: string;
  recognitionSignals?: string[];
  antiManipulation?: string[];
  keyTakeaway: string;
  question: string;
  answers: string[];
  correctAnswer: number;
  difficulty: DifficultyLevel;
  mastery: number; // 0 - 100
  relatedGame: GameType;
  icon: string;
  experimentSetup?: {
    scenario: string;
    optionA: { label: string; biasDescription?: string; rationalDescription?: string; description?: string };
    optionB: { label: string; rationalDescription?: string; biasDescription?: string; description?: string };
    globalChoicePercentageA: number;
    insight: string;
  };
}

export type GameType = 
  | 'memory-lab' 
  | 'mind-trap' 
  | 'brain-rush' 
  | 'mind-detective' 
  | 'psych-experiment'
  | 'first-impression'
  | 'anchoring-lab'
  | 'majority-answer'
  | 'peak-end'
  | 'emotion-detective'
  | 'attribution-shift'
  | 'zero-price-trap'
  | 'micro-habit'
  | 'bystander-breaker'
  | 'falsification-challenge';

export interface GameDefinition {
  id: GameType;
  name: string;
  nameEn?: string;
  nameZh: string;
  description: string;
  category: '记忆' | '注意力' | '速度' | '逻辑' | '决策' | '心理实验' | '认知' | '情绪' | '习惯' | '社会';
  difficulty: DifficultyLevel;
  bestScore: number;
  icon: string;
  estimatedTime: string;
  conceptLearned: string;
  relatedLawId?: string;
  accentColor: string;
  numberPrefix?: string; // e.g. "01", "02" ... "10"
}

export type GameDifficulty = '低' | '中' | '高' | '高级';

export interface GameResult {
  score: number;
  accuracy: number; // e.g. 95%
  reactionTime: number; // e.g. 240ms
  xpGained: number;
  comboMax: number;
  conceptLearned: string;
  lawId?: string;
  difficulty?: GameDifficulty;
}

export interface QuizQuestion {
  id: string;
  category: CategoryZh;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: DifficultyLevel;
  relatedLawId?: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  category: 'streak' | 'knowledge' | 'game' | 'quiz' | 'mastery';
  xpBonus: number;
  color: string;
}

export interface UserStats {
  memory: number; // 0 - 100
  attention: number;
  reasoning: number;
  knowledge: number;
  decision: number;
}

export interface DayActivity {
  day: string; // e.g. '周一'
  date: string;
  minutes: number;
  xp: number;
  completed: boolean;
}

export interface UserProfile {
  name: string;
  avatar: string;
  title: string;
  level: number;
  xp: number;
  streak: number;
  lastActiveDate: string;
  totalGames: number;
  totalQuizzes: number;
  quizPoints: number;
  lawsMastered: string[]; // law IDs
  lawMasteryMap: Record<string, number>; // law ID -> mastery %
  bookmarks: string[]; // law IDs
  gameHighScores: Record<string, number>; // gameId -> high score
  unlockedBadges: string[]; // badge IDs
  selectedGoals: string[];
  hasCompletedOnboarding: boolean;
  stats: UserStats;
  weeklyActivity: DayActivity[];
  completedGames?: string[];
  gameCompletionCount?: Record<string, number>;
}

export type JournalTemplateType =
  | 'cbt-restructure'
  | 'flow-reflection'
  | 'emotional-decentering'
  | 'decision-debiasing'
  | 'free-insight';

export type EmotionValence = 'positive' | 'neutral' | 'challenging' | 'mixed';

export interface JournalEmotionState {
  primary: string;
  secondary?: string;
  intensity: number; // 1 - 10
  valence: EmotionValence;
  energyLevel?: number; // 1 - 5
}

export interface CognitiveJournalEntry {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  title: string;
  templateType: JournalTemplateType;
  emotion: JournalEmotionState;
  relatedLawId?: string;
  relatedLawName?: string;
  structuredData: Record<string, string>;
  tags: string[];
  insightRating?: number; // 1 - 5
  createdAt?: any;
  updatedAt?: any;
}

export interface JournalTemplateMeta {
  id: JournalTemplateType;
  title: string;
  titleEn: string;
  description: string;
  badge: string;
  iconName: string;
  defaultQuestions: {
    key: string;
    label: string;
    placeholder: string;
    hint?: string;
  }[];
}


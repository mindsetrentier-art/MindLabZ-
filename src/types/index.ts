export type CategoryType = 'cognitive' | 'memory' | 'social' | 'decision' | 'behavior' | 'emotion';

export type CategoryZh = '认知' | '记忆' | '社会' | '决策' | '行为' | '情绪';

export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';

export interface PsychologyLaw {
  id: string;
  nameZh: string;
  nameEn: string;
  category: CategoryType;
  categoryZh: CategoryZh;
  shortExplanation: string;
  detailedExplanation: string;
  whyItHappens: string;
  realLifeExample: string;
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
  | 'psych-experiment';

export interface GameDefinition {
  id: GameType;
  name: string;
  nameZh: string;
  description: string;
  category: '记忆' | '注意力' | '速度' | '逻辑' | '决策' | '心理实验';
  difficulty: DifficultyLevel;
  bestScore: number;
  icon: string;
  estimatedTime: string;
  conceptLearned: string;
  relatedLawId?: string;
  accentColor: string;
}

export interface GameResult {
  score: number;
  accuracy: number; // e.g. 95%
  reactionTime: number; // e.g. 240ms
  xpGained: number;
  comboMax: number;
  conceptLearned: string;
  lawId?: string;
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
}

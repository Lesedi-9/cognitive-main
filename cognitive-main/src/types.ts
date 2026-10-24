export type UserRole = 'student' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  studentId?: string;
  institution?: string;
  department?: string;
  createdAt: string;
  lastLoginAt: string;
}

export type CognitiveState = 'optimal_flow' | 'overloaded' | 'disengaged' | 'underchallenged';
export type ScaffoldLevel = 'standard' | 'simplified_scaffold' | 'visual_guided' | 'advanced_stretch';

export interface Question {
  id: string;
  text: string;
  targetConcept: string;
  difficulty: 'introductory' | 'intermediate' | 'advanced';
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  scaffoldHint: string;
  baselineExpectedSeconds: number; // Theoretical baseline response time for cognitive comparison
}

export interface LearningModule {
  id: string;
  code: string;
  title: string;
  academicDiscipline: string;
  description: string;
  estimatedMinutes: number;
  prerequisites: string[];
  learningOutcomes: string[];
  questions: Question[];
  createdAt: string;
}

export type EventType =
  | 'session_start'
  | 'question_viewed'
  | 'choice_selected'
  | 'choice_changed'
  | 'hesitation_detected'
  | 'hint_requested'
  | 'answer_submitted'
  | 'retry_attempt'
  | 'scaffold_triggered'
  | 'reading_scroll'
  | 'session_completed';

export interface InteractionEvent {
  id: string;
  userId: string;
  sessionId: string;
  moduleId: string;
  questionId?: string;
  timestamp: string;
  eventType: EventType;
  details: string;
  timeSpentMs: number;
  cognitiveLoadEstimate?: number; // 0 - 100
}

export interface QuestionResponse {
  questionId: string;
  selectedOptionIndex: number;
  isCorrect: boolean;
  responseTimeMs: number;
  hesitationCount: number;
  attemptsCount: number;
  hintUsed: boolean;
  cognitiveLoadScore: number;
  adaptationAction?: string;
  /** Self-rated certainty before submitting: 1 = guessing, 2 = fairly sure, 3 = certain. */
  confidence?: 1 | 2 | 3;
}

export interface CognitiveMetrics {
  averageResponseTimeMs: number;
  errorFrequencyRate: number; // 0.0 to 1.0
  totalHesitations: number;
  cognitiveLoadIndex: number; // 0 to 100
  engagementScore: number; // 0 to 100
  predictedState: CognitiveState;
  recommendedScaffold: ScaffoldLevel;
}

export interface LearningSession {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  moduleId: string;
  moduleTitle: string;
  startedAt: string;
  completedAt?: string;
  status: 'in_progress' | 'completed';
  currentQuestionIndex: number;
  activeDifficulty: 'introductory' | 'intermediate' | 'advanced';
  totalDwellTimeMs: number;
  responses: QuestionResponse[];
  adaptationHistory: {
    timestamp: string;
    trigger: string;
    actionTaken: string;
    previousLevel: string;
    newLevel: string;
  }[];
  finalMetrics?: CognitiveMetrics;
}

export interface SystemSettings {
  responseTimeHesitationThresholdMs: number; // Default 15000 ms
  highErrorThresholdCount: number; // Default 2 consecutive errors
  autoScaffoldEnabled: boolean;
  adaptiveDifficultyScaling: boolean;
  minDwellTimeAlertSec: number; // Default 3 sec (guessing detection)
}

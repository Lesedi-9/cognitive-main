import { Question, QuestionResponse, CognitiveMetrics, CognitiveState, ScaffoldLevel } from '../types';

export interface AdaptationAssessment {
  cognitiveLoadIndex: number; // 0 - 100
  state: CognitiveState;
  recommendedScaffold: ScaffoldLevel;
  triggerReason: string;
  suggestedAction: string;
  isScaffoldRequired: boolean;
  stepDownDifficulty: boolean;
  stepUpDifficulty: boolean;
}

/**
 * Calculates real-time cognitive metrics based on interaction patterns:
 * - Response latency relative to question baseline
 * - Hesitation (choice toggling, distractor lingering)
 * - Error recurrence (consecutive mistakes, retry patterns)
 */
export function evaluateCognitiveLoad(params: {
  question: Question;
  responseTimeMs: number;
  hesitationCount: number;
  attemptsCount: number;
  isCorrect: boolean;
  previousResponses: QuestionResponse[];
}): AdaptationAssessment {
  const { question, responseTimeMs, hesitationCount, attemptsCount, isCorrect, previousResponses } = params;
  const baselineMs = question.baselineExpectedSeconds * 1000;
  
  // 1. Latency Factor (Normalized 0 to 100)
  const timeRatio = responseTimeMs / (baselineMs || 20000);
  let timeScore = 50;
  if (timeRatio > 2.0) {
    timeScore = Math.min(100, 50 + (timeRatio - 2.0) * 25);
  } else if (timeRatio < 0.3) {
    // Unusually fast (possible guessing or high fluency)
    timeScore = isCorrect ? 20 : 70;
  } else {
    timeScore = 30 + (timeRatio / 2.0) * 35;
  }

  // 2. Hesitation Factor (0 to 100)
  const hesitationScore = Math.min(100, hesitationCount * 28);

  // 3. Error Recurrence Factor (0 to 100)
  const recentErrors = previousResponses.slice(-3).filter(r => !r.isCorrect).length;
  const currentErrorWeight = isCorrect ? 0 : 50;
  const retryPenalty = Math.max(0, attemptsCount - 1) * 25;
  const errorScore = Math.min(100, currentErrorWeight + retryPenalty + (recentErrors * 15));

  // Weighted Cognitive Load Index (CLT model)
  const rawCLI = (timeScore * 0.40) + (errorScore * 0.35) + (hesitationScore * 0.25);
  const cognitiveLoadIndex = Math.round(Math.max(5, Math.min(100, rawCLI)));

  // Determine Cognitive State
  let state: CognitiveState = 'optimal_flow';
  let recommendedScaffold: ScaffoldLevel = 'standard';
  let triggerReason = 'Cognitive interaction parameters within optimal flow bounds.';
  let suggestedAction = 'Proceed with standard curriculum sequence.';
  let isScaffoldRequired = false;
  let stepDownDifficulty = false;
  let stepUpDifficulty = false;

  if (cognitiveLoadIndex >= 70 || attemptsCount >= 2 || (!isCorrect && hesitationCount >= 2)) {
    state = 'overloaded';
    recommendedScaffold = 'simplified_scaffold';
    isScaffoldRequired = true;
    stepDownDifficulty = true;
    triggerReason = `High cognitive load detected (CLI: ${cognitiveLoadIndex}/100) with elevated latency (${Math.round(responseTimeMs / 1000)}s) and ${hesitationCount} option hesitations.`;
    suggestedAction = 'Trigger constructivist scaffolding: activate structured conceptual hint and decompose question into sub-steps.';
  } else if (timeRatio < 0.35 && isCorrect && hesitationCount === 0 && previousResponses.slice(-2).every(r => r.isCorrect)) {
    state = 'underchallenged';
    recommendedScaffold = 'advanced_stretch';
    stepUpDifficulty = true;
    triggerReason = `Rapid mastery identified (Response time: ${(responseTimeMs / 1000).toFixed(1)}s vs baseline ${question.baselineExpectedSeconds}s with 0 errors).`;
    suggestedAction = 'Accelerate instructional pathway to advanced analytical concepts.';
  } else if (timeRatio > 2.5 && isCorrect) {
    state = 'overloaded';
    recommendedScaffold = 'visual_guided';
    triggerReason = `Correct outcome achieved, but elevated processing latency (${(responseTimeMs / 1000).toFixed(1)}s) indicates high working memory demand.`;
    suggestedAction = 'Present visual conceptual breakdown to reinforce schema consolidation.';
  }

  return {
    cognitiveLoadIndex,
    state,
    recommendedScaffold,
    triggerReason,
    suggestedAction,
    isScaffoldRequired,
    stepDownDifficulty,
    stepUpDifficulty,
  };
}

/**
 * Calculates aggregate cognitive metrics across a learning session.
 */
export function aggregateSessionMetrics(responses: QuestionResponse[]): CognitiveMetrics {
  if (responses.length === 0) {
    return {
      averageResponseTimeMs: 0,
      errorFrequencyRate: 0,
      totalHesitations: 0,
      cognitiveLoadIndex: 0,
      engagementScore: 100,
      predictedState: 'optimal_flow',
      recommendedScaffold: 'standard',
    };
  }

  const totalTime = responses.reduce((acc, r) => acc + r.responseTimeMs, 0);
  const averageResponseTimeMs = Math.round(totalTime / responses.length);
  
  const incorrectCount = responses.filter(r => !r.isCorrect).length;
  const errorFrequencyRate = Number((incorrectCount / responses.length).toFixed(2));

  const totalHesitations = responses.reduce((acc, r) => acc + r.hesitationCount, 0);
  
  const averageCLI = Math.round(
    responses.reduce((acc, r) => acc + r.cognitiveLoadScore, 0) / responses.length
  );

  // Engagement score: rewards continuous interaction, penalizes extreme idle or erratic guessing
  let engagementScore = 88;
  if (averageCLI > 75) engagementScore -= 15; // High strain
  if (errorFrequencyRate > 0.6) engagementScore -= 12;

  let predictedState: CognitiveState = 'optimal_flow';
  let recommendedScaffold: ScaffoldLevel = 'standard';

  if (averageCLI >= 68 || errorFrequencyRate >= 0.5) {
    predictedState = 'overloaded';
    recommendedScaffold = 'simplified_scaffold';
  } else if (averageCLI <= 35 && errorFrequencyRate === 0) {
    predictedState = 'underchallenged';
    recommendedScaffold = 'advanced_stretch';
  }

  return {
    averageResponseTimeMs,
    errorFrequencyRate,
    totalHesitations,
    cognitiveLoadIndex: averageCLI,
    engagementScore: Math.max(20, Math.min(100, engagementScore)),
    predictedState,
    recommendedScaffold,
  };
}

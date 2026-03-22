// ============================================================================
// WEALTHCLAUDE FINANCIAL ASSESSMENT SYSTEM
// Main Export Index
// ============================================================================

// Types
export * from './types';

// Questions
export { financialPersonalityQuestions } from './questions/test1-financial-personality';
export { financialHealthQuestions } from './questions/test2-financial-health';
export { investmentProfileQuestions } from './questions/test3-investment-profile';
export { moneyMindsetQuestions } from './questions/test4-money-mindset';

// Factors & Benchmarks
export { 
  factors, 
  getFactorById, 
  getAllFactors, 
  getFactorsByDifficulty,
  getEasyWins,
  getHardChanges,
  getBenchmarkForUser 
} from './factors';

// Tests
export {
  tests,
  getTestById,
  getRequiredTests,
  getOptionalTests,
  getAllTestsOrdered,
  getTotalEstimatedTime,
  getTotalQuestionCount
} from './tests';

// Scoring
export {
  calculateFactorScores,
  calculatePersonalityTraits,
  determinePersonalityType,
  getPersonalityDescription,
  extractFinancialMetrics,
  recommendGoalPath,
  getPriorityFactors,
  getEasyWinFactors,
  getHardChangeFactors,
  calculateAssessment,
  getQuestionById,
  getQuestionsByTest,
  allQuestions
} from './scoring';

// Plan Generation
export {
  validateTimeline,
  generateSafePath,
  generateAggressivePath,
  generateFinancialPlan
} from './plan-generator';

// ----------------------------------------------------------------------------
// CONVENIENCE FUNCTIONS
// ----------------------------------------------------------------------------

import { Question, TestId } from './types';
import { financialPersonalityQuestions } from './questions/test1-financial-personality';
import { financialHealthQuestions } from './questions/test2-financial-health';
import { investmentProfileQuestions } from './questions/test3-investment-profile';
import { moneyMindsetQuestions } from './questions/test4-money-mindset';

/**
 * Get all questions for a specific test
 */
export const getTestQuestions = (testId: TestId): Question[] => {
  switch (testId) {
    case 'financial_personality':
      return financialPersonalityQuestions;
    case 'financial_health':
      return financialHealthQuestions;
    case 'investment_profile':
      return investmentProfileQuestions;
    case 'money_mindset':
      return moneyMindsetQuestions;
    default:
      return [];
  }
};

/**
 * Get total question count across all tests
 */
export const getTotalQuestions = (): number => {
  return (
    financialPersonalityQuestions.length +
    financialHealthQuestions.length +
    investmentProfileQuestions.length +
    moneyMindsetQuestions.length
  );
};

/**
 * Get assessment summary stats
 */
export const getAssessmentStats = () => ({
  totalTests: 4,
  requiredTests: 2,
  optionalTests: 2,
  totalQuestions: getTotalQuestions(),
  requiredQuestions: financialPersonalityQuestions.length + financialHealthQuestions.length,
  optionalQuestions: investmentProfileQuestions.length + moneyMindsetQuestions.length,
  estimatedMinutesQuick: 9,
  estimatedMinutesFull: 14,
  scoringFactors: 10
});

// Log stats on import (for development)
if (process.env.NODE_ENV === 'development') {
  console.log('📊 WealthClaude Assessment System loaded:', getAssessmentStats());
}

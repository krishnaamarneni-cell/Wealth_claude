// ============================================================================
// SCORING ALGORITHM
// Calculates factor scores, personality type, and generates complete results
// ============================================================================

import {
  Question,
  UserResponse,
  FactorId,
  FactorScore,
  PersonalityType,
  AssessmentResult,
  GoalPath,
  TestId
} from './types';

import { factors, getBenchmarkForUser } from './factors';
import { financialPersonalityQuestions } from './questions/test1-financial-personality';
import { financialHealthQuestions } from './questions/test2-financial-health';
import { investmentProfileQuestions } from './questions/test3-investment-profile';
import { moneyMindsetQuestions } from './questions/test4-money-mindset';

// ----------------------------------------------------------------------------
// QUESTION REGISTRY
// ----------------------------------------------------------------------------

const allQuestions: Question[] = [
  ...financialPersonalityQuestions,
  ...financialHealthQuestions,
  ...investmentProfileQuestions,
  ...moneyMindsetQuestions
];

const questionMap: Record<string, Question> = {};
allQuestions.forEach(q => {
  questionMap[q.id] = q;
});

export const getQuestionById = (id: string): Question | undefined => questionMap[id];

export const getQuestionsByTest = (testId: TestId): Question[] => {
  return allQuestions.filter(q => q.testId === testId);
};

// ----------------------------------------------------------------------------
// SCORE CALCULATION
// ----------------------------------------------------------------------------

interface FactorScoreAccumulator {
  totalWeightedScore: number;
  totalWeight: number;
  questionCount: number;
}

/**
 * Calculate raw factor scores from user responses
 */
export const calculateFactorScores = (
  responses: UserResponse[],
  userAgeGroup: string,
  userIncomeGroup: string
): FactorScore[] => {
  // Initialize accumulators for each factor
  const factorAccumulators: Record<FactorId, FactorScoreAccumulator> = {
    savings_discipline: { totalWeightedScore: 0, totalWeight: 0, questionCount: 0 },
    debt_management: { totalWeightedScore: 0, totalWeight: 0, questionCount: 0 },
    financial_planning: { totalWeightedScore: 0, totalWeight: 0, questionCount: 0 },
    spending_control: { totalWeightedScore: 0, totalWeight: 0, questionCount: 0 },
    investment_readiness: { totalWeightedScore: 0, totalWeight: 0, questionCount: 0 },
    risk_tolerance: { totalWeightedScore: 0, totalWeight: 0, questionCount: 0 },
    financial_literacy: { totalWeightedScore: 0, totalWeight: 0, questionCount: 0 },
    emergency_preparedness: { totalWeightedScore: 0, totalWeight: 0, questionCount: 0 },
    future_orientation: { totalWeightedScore: 0, totalWeight: 0, questionCount: 0 },
    money_wellness: { totalWeightedScore: 0, totalWeight: 0, questionCount: 0 }
  };

  // Process each response
  responses.forEach(response => {
    const question = getQuestionById(response.questionId);
    if (!question) return;

    let score = 0;

    // Get score based on question type
    if (question.type === 'slider') {
      score = Number(response.answer);
    } else if (question.options) {
      const selectedOption = question.options.find(opt => opt.id === response.answer);
      if (selectedOption) {
        score = selectedOption.value;

        // Check for factor-specific impacts
        if (selectedOption.factorImpact) {
          Object.entries(selectedOption.factorImpact).forEach(([factorId, impactScore]) => {
            const fid = factorId as FactorId;
            if (factorAccumulators[fid]) {
              factorAccumulators[fid].totalWeightedScore += (impactScore as number) * question.weight;
              factorAccumulators[fid].totalWeight += question.weight;
              factorAccumulators[fid].questionCount += 1;
            }
          });
          return; // Skip default factor assignment
        }
      }
    } else if (question.rangeOptions) {
      const selectedRange = question.rangeOptions.find(opt => opt.id === response.answer);
      if (selectedRange) {
        score = selectedRange.score;
      }
    }

    // Apply score to all factors this question affects
    question.factors.forEach(factorId => {
      if (factorAccumulators[factorId]) {
        factorAccumulators[factorId].totalWeightedScore += score * question.weight;
        factorAccumulators[factorId].totalWeight += question.weight;
        factorAccumulators[factorId].questionCount += 1;
      }
    });
  });

  // Calculate final scores and compare to benchmarks
  const factorScores: FactorScore[] = Object.entries(factorAccumulators).map(([factorId, acc]) => {
    const fid = factorId as FactorId;
    const rawScore = acc.totalWeight > 0 
      ? Math.round(acc.totalWeightedScore / acc.totalWeight) 
      : 50; // Default to 50 if no data

    const benchmarks = getBenchmarkForUser(fid, userAgeGroup, userIncomeGroup);

    const percentile = calculatePercentile(rawScore, benchmarks.general);

    return {
      factorId: fid,
      score: rawScore,
      maxScore: 100,
      percentile,
      benchmarkComparison: {
        vsGeneral: rawScore - benchmarks.general,
        vsAgeGroup: rawScore - benchmarks.byAge,
        vsIncomeGroup: rawScore - benchmarks.byIncome
      },
      status: getScoreStatus(rawScore)
    };
  });

  return factorScores;
};

/**
 * Calculate percentile (simplified - assumes normal distribution)
 */
const calculatePercentile = (score: number, mean: number, stdDev: number = 15): number => {
  const zScore = (score - mean) / stdDev;
  // Simplified percentile calculation
  const percentile = Math.round(50 + (zScore * 20));
  return Math.max(1, Math.min(99, percentile));
};

/**
 * Determine status label based on score
 */
const getScoreStatus = (score: number): 'excellent' | 'good' | 'average' | 'needs_work' | 'critical' => {
  if (score >= 80) return 'excellent';
  if (score >= 65) return 'good';
  if (score >= 45) return 'average';
  if (score >= 25) return 'needs_work';
  return 'critical';
};

// ----------------------------------------------------------------------------
// PERSONALITY TYPE DETERMINATION
// ----------------------------------------------------------------------------

interface PersonalityTraits {
  spenderVsSaver: number;
  riskTolerance: number;
  presentVsFuture: number;
  emotionalVsRational: number;
  impulsiveVsDeliberate: number;
}

/**
 * Calculate personality traits from factor scores
 */
export const calculatePersonalityTraits = (factorScores: FactorScore[]): PersonalityTraits => {
  const getScore = (id: FactorId): number => {
    return factorScores.find(f => f.factorId === id)?.score || 50;
  };

  // Spender (-100) vs Saver (+100)
  const spenderVsSaver = (
    (getScore('savings_discipline') - 50) * 2 +
    (getScore('spending_control') - 50) * 2
  ) / 2;

  // Risk Tolerance (0 to 100)
  const riskTolerance = getScore('risk_tolerance');

  // Present (-100) vs Future (+100)
  const presentVsFuture = (getScore('future_orientation') - 50) * 2;

  // Emotional (-100) vs Rational (+100)
  const emotionalVsRational = (
    (getScore('money_wellness') - 50) * 1.5 +
    (getScore('financial_planning') - 50) * 0.5
  );

  // Impulsive (-100) vs Deliberate (+100)
  const impulsiveVsDeliberate = (getScore('spending_control') - 50) * 2;

  return {
    spenderVsSaver: Math.round(Math.max(-100, Math.min(100, spenderVsSaver))),
    riskTolerance: Math.round(riskTolerance),
    presentVsFuture: Math.round(Math.max(-100, Math.min(100, presentVsFuture))),
    emotionalVsRational: Math.round(Math.max(-100, Math.min(100, emotionalVsRational))),
    impulsiveVsDeliberate: Math.round(Math.max(-100, Math.min(100, impulsiveVsDeliberate)))
  };
};

/**
 * Determine personality type from traits
 */
export const determinePersonalityType = (traits: PersonalityTraits): PersonalityType => {
  const { spenderVsSaver, riskTolerance, presentVsFuture, emotionalVsRational } = traits;

  // Decision tree for personality types
  if (spenderVsSaver > 30 && riskTolerance < 40) {
    return 'security_seeker'; // Saves a lot, avoids risk
  }
  
  if (spenderVsSaver > 30 && riskTolerance > 60 && presentVsFuture > 20) {
    return 'growth_investor'; // Saves, takes calculated risks, future-focused
  }
  
  if (spenderVsSaver > 20 && presentVsFuture > 30) {
    return 'cautious_saver'; // Saves well, plans ahead, moderate risk
  }
  
  if (Math.abs(spenderVsSaver) < 30 && riskTolerance >= 40 && riskTolerance <= 70) {
    return 'balanced_planner'; // Balanced approach overall
  }
  
  if (spenderVsSaver < -20 && presentVsFuture < -20) {
    return 'spontaneous_spender'; // Spends, present-focused
  }
  
  if (riskTolerance > 75) {
    return 'risk_taker'; // High risk tolerance regardless of other traits
  }
  
  if (emotionalVsRational < -30) {
    return 'money_avoider'; // Emotional about money, tends to avoid
  }
  
  return 'balanced_planner'; // Default
};

/**
 * Get personality type description
 */
export const getPersonalityDescription = (type: PersonalityType): string => {
  const descriptions: Record<PersonalityType, string> = {
    cautious_saver: 'You prioritize security and steadily build wealth through consistent saving. You prefer proven strategies over risky ventures and plan carefully for the future.',
    balanced_planner: 'You take a measured approach to money, balancing enjoyment today with planning for tomorrow. You make thoughtful decisions and adapt to circumstances.',
    growth_investor: 'You\'re focused on building wealth and willing to take calculated risks to achieve higher returns. You think long-term and see money as a tool for growth.',
    spontaneous_spender: 'You live in the moment and enjoy spending on experiences and things that bring immediate joy. Saving feels restrictive, and you trust things will work out.',
    risk_taker: 'You\'re comfortable with high-risk, high-reward scenarios. You see volatility as opportunity and aren\'t afraid to make bold financial moves.',
    money_avoider: 'You tend to avoid thinking about money because it causes stress or anxiety. Financial decisions feel overwhelming, and you may procrastinate on money matters.',
    security_seeker: 'Your primary goal is financial safety. You prioritize having a strong safety net and avoid any risk that could threaten your security.'
  };
  
  return descriptions[type];
};

// ----------------------------------------------------------------------------
// FINANCIAL METRICS EXTRACTION
// ----------------------------------------------------------------------------

interface FinancialMetrics {
  monthlyIncome: number;
  monthlyExpenses: number;
  totalDebt: number;
  monthlySavings: number;
  emergencyFundMonths: number;
  debtToIncomeRatio: number;
  savingsRate: number;
}

/**
 * Extract financial metrics from responses
 */
export const extractFinancialMetrics = (responses: UserResponse[]): FinancialMetrics => {
  const getResponseValue = (questionId: string): string | number | undefined => {
    return responses.find(r => r.questionId === questionId)?.answer;
  };

  const getRangeMidpoint = (questionId: string, question: Question): number => {
    const answer = getResponseValue(questionId);
    if (!answer || !question.rangeOptions) return 0;
    const range = question.rangeOptions.find(r => r.id === answer);
    return range?.midpoint || 0;
  };

  // Get income
  const incomeQuestion = getQuestionById('fh_01');
  const monthlyIncome = incomeQuestion ? getRangeMidpoint('fh_01', incomeQuestion) : 5000;

  // Get expenses
  const expensesQuestion = getQuestionById('fh_02');
  const monthlyExpenses = expensesQuestion ? getRangeMidpoint('fh_02', expensesQuestion) : 4000;

  // Get debt
  const debtQuestion = getQuestionById('fh_08');
  const totalDebt = debtQuestion ? getRangeMidpoint('fh_08', debtQuestion) : 0;

  // Calculate derived metrics
  const monthlySavings = Math.max(0, monthlyIncome - monthlyExpenses);
  
  // Get emergency fund from response
  const efAnswer = getResponseValue('fh_12');
  const emergencyFundMonths = efAnswer ? {
    'a': 15, // 12+
    'b': 9,  // 6-12
    'c': 4.5, // 3-6
    'd': 2,   // 1-3
    'e': 0.5, // less than 1
    'f': 0    // trouble immediately
  }[efAnswer as string] || 0 : 0;

  // Get monthly debt payments
  const debtPaymentQuestion = getQuestionById('fh_09');
  const monthlyDebtPayments = debtPaymentQuestion ? getRangeMidpoint('fh_09', debtPaymentQuestion) : 0;

  // Calculate ratios
  const debtToIncomeRatio = monthlyIncome > 0 
    ? Math.round((monthlyDebtPayments / monthlyIncome) * 100) 
    : 0;

  const savingsRate = monthlyIncome > 0 
    ? Math.round((monthlySavings / monthlyIncome) * 100) 
    : 0;

  return {
    monthlyIncome,
    monthlyExpenses,
    totalDebt,
    monthlySavings,
    emergencyFundMonths,
    debtToIncomeRatio,
    savingsRate
  };
};

// ----------------------------------------------------------------------------
// GOAL PATH RECOMMENDATION
// ----------------------------------------------------------------------------

/**
 * Recommend goal path based on assessment results
 */
export const recommendGoalPath = (
  factorScores: FactorScore[],
  metrics: FinancialMetrics
): GoalPath => {
  const getScore = (id: FactorId): number => {
    return factorScores.find(f => f.factorId === id)?.score || 50;
  };

  // Priority 1: If debt-to-income is high, recommend debt freedom
  if (metrics.debtToIncomeRatio > 35 || metrics.totalDebt > 20000) {
    return 'debt_freedom';
  }

  // Priority 2: If emergency fund is low, recommend general wellness
  if (getScore('emergency_preparedness') < 40) {
    return 'general_wellness';
  }

  // Priority 3: If high saver with low investment, recommend investing
  if (getScore('savings_discipline') > 60 && getScore('investment_readiness') < 45) {
    return 'investment_starter';
  }

  // Priority 4: If overall strong, recommend FIRE
  const overallScore = factorScores.reduce((sum, f) => sum + f.score, 0) / factorScores.length;
  if (overallScore > 65 && getScore('future_orientation') > 60) {
    return 'fire';
  }

  // Default: general wellness
  return 'general_wellness';
};

/**
 * Identify priority factors (top 3 to improve)
 */
export const getPriorityFactors = (factorScores: FactorScore[]): FactorId[] => {
  return [...factorScores]
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map(f => f.factorId);
};

/**
 * Identify easy wins (low-hanging fruit)
 */
export const getEasyWinFactors = (factorScores: FactorScore[]): FactorId[] => {
  const easyFactors: FactorId[] = ['financial_planning', 'financial_literacy'];
  return factorScores
    .filter(f => easyFactors.includes(f.factorId) && f.score < 70)
    .map(f => f.factorId);
};

/**
 * Identify hard changes needed
 */
export const getHardChangeFactors = (factorScores: FactorScore[]): FactorId[] => {
  const hardFactors: FactorId[] = ['debt_management', 'risk_tolerance', 'money_wellness'];
  return factorScores
    .filter(f => hardFactors.includes(f.factorId) && f.score < 50)
    .map(f => f.factorId);
};

// ----------------------------------------------------------------------------
// MAIN ASSESSMENT CALCULATOR
// ----------------------------------------------------------------------------

interface AssessmentInput {
  userId: string;
  responses: UserResponse[];
  testsCompleted: TestId[];
  userAge: number;
  userIncomeRange: string;
}

/**
 * Calculate complete assessment result
 */
export const calculateAssessment = (input: AssessmentInput): AssessmentResult => {
  const { userId, responses, testsCompleted, userAge, userIncomeRange } = input;

  // Determine user groups for benchmarking
  const ageGroup = getAgeGroup(userAge);
  const incomeGroup = getIncomeGroup(userIncomeRange);

  // Calculate factor scores
  const factorScores = calculateFactorScores(responses, ageGroup, incomeGroup);

  // Calculate overall score (weighted average)
  const overallScore = Math.round(
    factorScores.reduce((sum, f) => sum + f.score, 0) / factorScores.length
  );

  // Calculate personality
  const traits = calculatePersonalityTraits(factorScores);
  const personalityType = determinePersonalityType(traits);

  // Extract financial metrics
  const financialMetrics = extractFinancialMetrics(responses);

  // Calculate rankings
  const rankings = {
    overallPercentile: calculatePercentile(overallScore, 50),
    vsAgeGroup: calculatePercentile(overallScore, factors.savings_discipline.benchmarks.byAge[ageGroup] || 50),
    vsIncomeGroup: calculatePercentile(overallScore, factors.savings_discipline.benchmarks.byIncome[incomeGroup] || 50)
  };

  // Get recommendations
  const recommendedGoalPath = recommendGoalPath(factorScores, financialMetrics);
  const priorityFactors = getPriorityFactors(factorScores);
  const easyWins = getEasyWinFactors(factorScores);
  const hardChanges = getHardChangeFactors(factorScores);

  return {
    id: generateAssessmentId(),
    userId,
    completedAt: new Date(),
    testsCompleted,
    responses,
    overallScore,
    factorScores,
    personalityType,
    personalityTraits: traits,
    financialMetrics,
    rankings,
    recommendedGoalPath,
    priorityFactors,
    easyWins,
    hardChanges
  };
};

// ----------------------------------------------------------------------------
// HELPER FUNCTIONS
// ----------------------------------------------------------------------------

const getAgeGroup = (age: number): string => {
  if (age < 25) return '18-24';
  if (age < 35) return '25-34';
  if (age < 45) return '35-44';
  if (age < 55) return '45-54';
  if (age < 65) return '55-64';
  return '65+';
};

const getIncomeGroup = (incomeRange: string): string => {
  // Map income ranges to benchmark groups
  const mapping: Record<string, string> = {
    'a': 'under_25k',
    'b': '25k-50k',
    'c': '50k-75k',
    'd': '75k-100k',
    'e': '100k-150k',
    'f': '100k-150k',
    'g': 'over_150k'
  };
  return mapping[incomeRange] || '50k-75k';
};

const generateAssessmentId = (): string => {
  return `asmt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Export all functions
export {
  allQuestions,
  questionMap
};

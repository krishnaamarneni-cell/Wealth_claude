// ============================================================================
// PLAN GENERATOR
// Timeline validation and two-path plan generation (Safe vs Aggressive)
// ============================================================================

import {
  FinancialPlan,
  TimelineValidation,
  PlanPath,
  MonthlyMilestone,
  WeeklyAction,
  Checkpoint,
  ContingencyPlan,
  GoalPath,
  AssessmentResult
} from './types';

// ----------------------------------------------------------------------------
// TIMELINE VALIDATION
// ----------------------------------------------------------------------------

interface TimelineInput {
  goalPath: GoalPath;
  targetMonths: number;
  metrics: AssessmentResult['financialMetrics'];
  factorScores: AssessmentResult['factorScores'];
}

/**
 * Validate if the user's desired timeline is achievable
 */
export const validateTimeline = (input: TimelineInput): TimelineValidation => {
  const { goalPath, targetMonths, metrics } = input;

  // Calculate minimum realistic timeline based on goal
  const realisticMonths = calculateRealisticTimeline(goalPath, metrics);
  
  // Calculate required monthly sacrifice
  const requiredMonthlySacrifice = calculateRequiredSacrifice(goalPath, targetMonths, metrics);
  
  // Determine feasibility
  const feasibilityScore = calculateFeasibilityScore(targetMonths, realisticMonths, metrics);
  
  // Determine risk level
  const riskLevel = determineRiskLevel(targetMonths, realisticMonths, requiredMonthlySacrifice, metrics);
  
  // Check if achievable
  const isAchievable = feasibilityScore > 25 && requiredMonthlySacrifice <= metrics.monthlyIncome * 0.7;

  // Generate assumptions and warnings
  const assumptions = generateAssumptions(goalPath, metrics);
  const warnings = generateWarnings(targetMonths, realisticMonths, riskLevel, metrics);

  return {
    requestedMonths: targetMonths,
    isAchievable,
    realisticMonths,
    feasibilityScore,
    requiredMonthlySacrifice,
    riskLevel,
    assumptions,
    warnings
  };
};

/**
 * Calculate realistic timeline based on goal and finances
 */
const calculateRealisticTimeline = (
  goalPath: GoalPath,
  metrics: AssessmentResult['financialMetrics']
): number => {
  const { totalDebt, monthlySavings, monthlyIncome, monthlyExpenses } = metrics;
  
  // Available monthly amount (comfortable - 20% of income towards goal)
  const comfortableMonthly = monthlyIncome * 0.2;
  
  switch (goalPath) {
    case 'debt_freedom':
      if (totalDebt === 0) return 0;
      // Realistic: Pay with 20% of income
      return Math.ceil(totalDebt / comfortableMonthly);
    
    case 'fire':
      // FIRE requires 25x annual expenses
      const fireNumber = monthlyExpenses * 12 * 25;
      const currentSavings = monthlySavings * 6; // Assume 6 months already saved
      const remaining = fireNumber - currentSavings;
      // With 7% annual returns and savings rate
      return Math.ceil(remaining / (monthlySavings * 12 * 1.5)); // Simplified
    
    case 'investment_starter':
      // Build first $10,000 investment portfolio
      const targetInvestment = 10000;
      return Math.ceil(targetInvestment / comfortableMonthly);
    
    case 'emergency_preparedness':
    case 'general_wellness':
      // Build 6-month emergency fund
      const targetEmergency = monthlyExpenses * 6;
      const currentEmergency = metrics.emergencyFundMonths * monthlyExpenses;
      const needed = targetEmergency - currentEmergency;
      return Math.ceil(needed / comfortableMonthly);
    
    default:
      return 12; // Default 1 year
  }
};

/**
 * Calculate monthly sacrifice required for target timeline
 */
const calculateRequiredSacrifice = (
  goalPath: GoalPath,
  targetMonths: number,
  metrics: AssessmentResult['financialMetrics']
): number => {
  const { totalDebt, monthlyExpenses, emergencyFundMonths } = metrics;
  
  if (targetMonths <= 0) return 0;
  
  switch (goalPath) {
    case 'debt_freedom':
      return Math.ceil(totalDebt / targetMonths);
    
    case 'emergency_preparedness':
    case 'general_wellness':
      const targetEmergency = monthlyExpenses * 6;
      const currentEmergency = emergencyFundMonths * monthlyExpenses;
      const needed = Math.max(0, targetEmergency - currentEmergency);
      return Math.ceil(needed / targetMonths);
    
    case 'investment_starter':
      return Math.ceil(10000 / targetMonths);
    
    default:
      return metrics.monthlySavings * 1.5;
  }
};

/**
 * Calculate feasibility score (0-100)
 */
const calculateFeasibilityScore = (
  targetMonths: number,
  realisticMonths: number,
  metrics: AssessmentResult['financialMetrics']
): number => {
  if (realisticMonths === 0) return 100; // Already achieved
  
  const ratio = targetMonths / realisticMonths;
  
  // Base score from timeline ratio
  let score = 0;
  if (ratio >= 1) {
    score = 90 + (ratio - 1) * 10; // Easier than realistic
  } else if (ratio >= 0.75) {
    score = 70 + (ratio - 0.75) * 80;
  } else if (ratio >= 0.5) {
    score = 40 + (ratio - 0.5) * 120;
  } else if (ratio >= 0.25) {
    score = 10 + (ratio - 0.25) * 120;
  } else {
    score = ratio * 40;
  }
  
  // Adjust for financial buffer
  const buffer = metrics.monthlySavings / metrics.monthlyIncome;
  if (buffer > 0.3) score += 5;
  if (buffer < 0.1) score -= 10;
  
  return Math.round(Math.max(0, Math.min(100, score)));
};

/**
 * Determine risk level
 */
const determineRiskLevel = (
  targetMonths: number,
  realisticMonths: number,
  requiredSacrifice: number,
  metrics: AssessmentResult['financialMetrics']
): 'low' | 'medium' | 'high' | 'very_high' => {
  const sacrificeRatio = requiredSacrifice / metrics.monthlyIncome;
  const timelineRatio = targetMonths / realisticMonths;
  
  if (timelineRatio >= 1 && sacrificeRatio <= 0.2) return 'low';
  if (timelineRatio >= 0.75 && sacrificeRatio <= 0.35) return 'medium';
  if (timelineRatio >= 0.5 && sacrificeRatio <= 0.5) return 'high';
  return 'very_high';
};

/**
 * Generate assumptions
 */
const generateAssumptions = (
  goalPath: GoalPath,
  metrics: AssessmentResult['financialMetrics']
): string[] => {
  const assumptions: string[] = [
    'Your income remains stable throughout the plan',
    'No major unexpected expenses occur',
  ];
  
  if (goalPath === 'debt_freedom') {
    assumptions.push('Interest rates remain constant');
    assumptions.push('No new debt is taken on during the plan');
  }
  
  if (metrics.savingsRate < 15) {
    assumptions.push('You can reduce current discretionary spending');
  }
  
  return assumptions;
};

/**
 * Generate warnings
 */
const generateWarnings = (
  targetMonths: number,
  realisticMonths: number,
  riskLevel: string,
  metrics: AssessmentResult['financialMetrics']
): string[] => {
  const warnings: string[] = [];
  
  if (targetMonths < realisticMonths * 0.5) {
    warnings.push('This timeline is very aggressive - consider a longer timeframe');
  }
  
  if (riskLevel === 'high' || riskLevel === 'very_high') {
    warnings.push('High sacrifice required - little room for unexpected expenses');
  }
  
  if (metrics.emergencyFundMonths < 1) {
    warnings.push('Build a small emergency fund first to avoid plan derailment');
  }
  
  if (metrics.debtToIncomeRatio > 50) {
    warnings.push('Consider debt consolidation to reduce monthly payments');
  }
  
  return warnings;
};

// ----------------------------------------------------------------------------
// PLAN PATH GENERATION
// ----------------------------------------------------------------------------

/**
 * Generate the Safe & Steady path
 */
export const generateSafePath = (
  goalPath: GoalPath,
  metrics: AssessmentResult['financialMetrics']
): PlanPath => {
  const realisticMonths = calculateRealisticTimeline(goalPath, metrics);
  const timelineMonths = Math.ceil(realisticMonths * 1.2); // 20% buffer
  const monthlyPayment = calculateRequiredSacrifice(goalPath, timelineMonths, metrics);
  
  const totalCost = calculateTotalCost(goalPath, timelineMonths, monthlyPayment, metrics);
  const quickCost = calculateTotalCost(goalPath, Math.ceil(realisticMonths * 0.6), monthlyPayment * 1.5, metrics);
  const interestSaved = quickCost - totalCost;
  
  const monthlyBreakdown = generateMonthlyBreakdown(goalPath, timelineMonths, monthlyPayment, metrics);
  const weeklyActions = generateWeeklyActions(goalPath, 'safe');
  
  return {
    type: 'safe_steady',
    name: 'Safe & Steady',
    timelineMonths,
    monthlyPayment,
    totalCost,
    interestSaved: Math.max(0, -interestSaved), // Interest saved vs aggressive
    lifestyleImpact: 'minimal',
    riskLevel: 'low',
    pros: [
      'Room for unexpected expenses',
      'Less stressful - sustainable pace',
      'Keeps emergency fund intact',
      'Better work-life balance'
    ],
    cons: [
      'Takes longer to achieve goal',
      'May pay more interest over time',
      'Progress feels slower'
    ],
    monthlyBreakdown,
    weeklyActions
  };
};

/**
 * Generate the Fast & Aggressive path
 */
export const generateAggressivePath = (
  goalPath: GoalPath,
  targetMonths: number,
  metrics: AssessmentResult['financialMetrics']
): PlanPath => {
  const realisticMonths = calculateRealisticTimeline(goalPath, metrics);
  const timelineMonths = Math.min(targetMonths, Math.ceil(realisticMonths * 0.6));
  const monthlyPayment = calculateRequiredSacrifice(goalPath, timelineMonths, metrics);
  
  const totalCost = calculateTotalCost(goalPath, timelineMonths, monthlyPayment, metrics);
  const slowCost = calculateTotalCost(goalPath, Math.ceil(realisticMonths * 1.2), monthlyPayment * 0.6, metrics);
  const interestSaved = slowCost - totalCost;
  
  const lifestyleImpact = determineLifestyleImpact(monthlyPayment, metrics);
  
  const monthlyBreakdown = generateMonthlyBreakdown(goalPath, timelineMonths, monthlyPayment, metrics);
  const weeklyActions = generateWeeklyActions(goalPath, 'aggressive');
  
  return {
    type: 'fast_aggressive',
    name: 'Fast & Aggressive',
    timelineMonths,
    monthlyPayment,
    totalCost,
    interestSaved: Math.max(0, interestSaved),
    lifestyleImpact,
    riskLevel: 'high',
    pros: [
      'Achieve goal much faster',
      'Save money on interest',
      'Build momentum and motivation',
      'Freedom sooner'
    ],
    cons: [
      'Very tight budget required',
      'No room for unexpected expenses',
      'May need to use emergency fund',
      'High stress potential'
    ],
    monthlyBreakdown,
    weeklyActions
  };
};

const calculateTotalCost = (
  goalPath: GoalPath,
  months: number,
  monthlyPayment: number,
  metrics: AssessmentResult['financialMetrics']
): number => {
  if (goalPath === 'debt_freedom') {
    // Simplified interest calculation (assume 18% APR average)
    const principal = metrics.totalDebt;
    const monthlyRate = 0.18 / 12;
    const totalPaid = monthlyPayment * months;
    const interest = totalPaid - principal;
    return Math.round(totalPaid);
  }
  return Math.round(monthlyPayment * months);
};

const determineLifestyleImpact = (
  monthlyPayment: number,
  metrics: AssessmentResult['financialMetrics']
): 'minimal' | 'moderate' | 'significant' | 'severe' => {
  const ratio = monthlyPayment / metrics.monthlyIncome;
  if (ratio <= 0.2) return 'minimal';
  if (ratio <= 0.35) return 'moderate';
  if (ratio <= 0.5) return 'significant';
  return 'severe';
};

const generateMonthlyBreakdown = (
  goalPath: GoalPath,
  months: number,
  monthlyPayment: number,
  metrics: AssessmentResult['financialMetrics']
): MonthlyMilestone[] => {
  const milestones: MonthlyMilestone[] = [];
  let remaining = goalPath === 'debt_freedom' ? metrics.totalDebt : monthlyPayment * months;
  let totalPaid = 0;
  
  for (let month = 1; month <= months; month++) {
    totalPaid += monthlyPayment;
    remaining = Math.max(0, remaining - monthlyPayment);
    const percentComplete = Math.round((totalPaid / (monthlyPayment * months)) * 100);
    
    const milestone: MonthlyMilestone = {
      month,
      payment: monthlyPayment,
      remainingDebt: Math.round(remaining),
      totalPaid: Math.round(totalPaid),
      percentComplete
    };
    
    // Add milestone labels
    if (percentComplete === 25) milestone.milestone = '25% Complete - Great start!';
    else if (percentComplete === 50) milestone.milestone = 'Halfway there! 🎉';
    else if (percentComplete === 75) milestone.milestone = '75% - The finish line is in sight!';
    else if (month === months) milestone.milestone = 'GOAL ACHIEVED! 🏆';
    
    milestones.push(milestone);
  }
  
  return milestones;
};

const generateWeeklyActions = (
  goalPath: GoalPath,
  pathType: 'safe' | 'aggressive'
): WeeklyAction[] => {
  const actions: WeeklyAction[] = [];
  
  // Week 1-2: Setup
  actions.push({
    week: 1,
    action: 'Set up automatic payment transfers on payday',
    category: 'setup'
  });
  actions.push({
    week: 1,
    action: 'List all debts/goals with amounts and interest rates',
    category: 'setup'
  });
  
  if (pathType === 'aggressive') {
    actions.push({
      week: 2,
      action: 'Cancel non-essential subscriptions (Netflix, Spotify, gym)',
      category: 'optimize'
    });
    actions.push({
      week: 2,
      action: 'Sell unused items online for extra cash',
      category: 'optimize'
    });
  }
  
  // Week 3-4: First payments
  actions.push({
    week: 3,
    action: 'Make first planned payment',
    category: 'payment'
  });
  actions.push({
    week: 4,
    action: 'Review first month spending - find additional savings',
    category: 'review'
  });
  
  return actions;
};

// ----------------------------------------------------------------------------
// COMPLETE PLAN GENERATION
// ----------------------------------------------------------------------------

/**
 * Generate complete financial plan with both paths
 */
export const generateFinancialPlan = (
  assessment: AssessmentResult,
  goalPath: GoalPath,
  targetDate: Date
): FinancialPlan => {
  const targetMonths = Math.ceil(
    (targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30)
  );
  
  // Validate timeline
  const timelineValidation = validateTimeline({
    goalPath,
    targetMonths,
    metrics: assessment.financialMetrics,
    factorScores: assessment.factorScores
  });
  
  // Generate both paths
  const safePath = generateSafePath(goalPath, assessment.financialMetrics);
  const aggressivePath = generateAggressivePath(goalPath, targetMonths, assessment.financialMetrics);
  
  // Generate checkpoints
  const checkpoints = generateCheckpoints(goalPath, safePath.timelineMonths);
  
  // Generate contingencies
  const contingencyPlans = generateContingencyPlans(goalPath);
  
  return {
    id: `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    assessmentId: assessment.id,
    userId: assessment.userId,
    goalPath,
    createdAt: new Date(),
    goalDescription: getGoalDescription(goalPath),
    targetDate,
    timelineValidation,
    safePath,
    aggressivePath,
    chosenPath: 'safe_steady', // Default, user can change
    checkpoints,
    contingencyPlans
  };
};

const getGoalDescription = (goalPath: GoalPath): string => {
  const descriptions: Record<GoalPath, string> = {
    debt_freedom: 'Become completely debt-free',
    fire: 'Achieve Financial Independence / Early Retirement',
    investment_starter: 'Build your first investment portfolio',
    tax_optimization: 'Optimize your tax situation',
    home_purchase: 'Save for a home down payment',
    general_wellness: 'Improve overall financial health'
  };
  return descriptions[goalPath];
};

const generateCheckpoints = (goalPath: GoalPath, totalMonths: number): Checkpoint[] => {
  const checkpoints: Checkpoint[] = [];
  
  // Monthly checkpoints for first 3 months
  for (let month = 1; month <= 3; month++) {
    checkpoints.push({
      month,
      description: `Month ${month} review`,
      targetMetric: 'Payment made on time',
      targetValue: 100,
      status: 'pending'
    });
  }
  
  // Quarterly checkpoints after
  const quarters = Math.ceil(totalMonths / 3);
  for (let q = 1; q <= quarters; q++) {
    const month = q * 3;
    if (month > 3 && month <= totalMonths) {
      checkpoints.push({
        month,
        description: `Quarter ${q} milestone`,
        targetMetric: 'Progress percentage',
        targetValue: Math.round((month / totalMonths) * 100),
        status: 'pending'
      });
    }
  }
  
  // Final checkpoint
  checkpoints.push({
    month: totalMonths,
    description: '🎉 GOAL ACHIEVED',
    targetMetric: 'Goal completion',
    targetValue: 100,
    status: 'pending'
  });
  
  return checkpoints;
};

const generateContingencyPlans = (goalPath: GoalPath): ContingencyPlan[] => {
  const plans: ContingencyPlan[] = [
    {
      trigger: 'Miss a monthly payment',
      action: 'Make up the payment within 2 weeks by reducing discretionary spending',
      impact: 'Extends timeline by 0.5 months'
    },
    {
      trigger: 'Unexpected expense ($500+)',
      action: 'Pause extra payments for 1 month, cover expense, resume next month',
      impact: 'Extends timeline by 1 month'
    },
    {
      trigger: 'Income reduction (job loss, hours cut)',
      action: 'Immediately switch to Safe & Steady path at minimum payments',
      impact: 'May significantly extend timeline - reassess in 1 month'
    },
    {
      trigger: 'Falling behind by 2+ months',
      action: 'Schedule plan reassessment - adjust timeline to match reality',
      impact: 'New realistic timeline will be calculated'
    }
  ];
  
  if (goalPath === 'debt_freedom') {
    plans.push({
      trigger: 'Interest rate increase',
      action: 'Look into debt consolidation or balance transfer options',
      impact: 'May reduce monthly payments or total interest'
    });
  }
  
  return plans;
};

export default generateFinancialPlan;

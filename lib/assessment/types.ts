// ============================================================================
// WEALTHCLAUDE FINANCIAL ASSESSMENT SYSTEM - TYPE DEFINITIONS
// ============================================================================

// ----------------------------------------------------------------------------
// CORE TYPES
// ----------------------------------------------------------------------------

export type QuestionType = 
  | 'multiple_choice'
  | 'slider'
  | 'agree_scale'
  | 'yes_no'
  | 'range_selector'
  | 'scenario'
  | 'number_input';

export type FactorId = 
  | 'savings_discipline'
  | 'debt_management'
  | 'financial_planning'
  | 'spending_control'
  | 'investment_readiness'
  | 'risk_tolerance'
  | 'financial_literacy'
  | 'emergency_preparedness'
  | 'future_orientation'
  | 'money_wellness';

export type PersonalityType = 
  | 'cautious_saver'
  | 'balanced_planner'
  | 'growth_investor'
  | 'spontaneous_spender'
  | 'risk_taker'
  | 'money_avoider'
  | 'security_seeker';

export type TestId = 
  | 'financial_personality'
  | 'financial_health'
  | 'investment_profile'
  | 'money_mindset';

export type GoalPath = 
  | 'debt_freedom'
  | 'fire'
  | 'investment_starter'
  | 'tax_optimization'
  | 'home_purchase'
  | 'general_wellness';

export type PlanType = 'safe_steady' | 'fast_aggressive';

// ----------------------------------------------------------------------------
// QUESTION TYPES
// ----------------------------------------------------------------------------

export interface QuestionOption {
  id: string;
  text: string;
  value: number; // Score value for this option
  factorImpact?: Partial<Record<FactorId, number>>; // Override default factor mapping
}

export interface SliderConfig {
  min: number;
  max: number;
  step: number;
  labels?: { value: number; label: string }[];
}

export interface RangeOption {
  id: string;
  label: string;
  minValue: number;
  maxValue: number;
  midpoint: number; // Used for calculations
  score: number;
}

export interface Question {
  id: string;
  testId: TestId;
  text: string;
  description?: string;
  type: QuestionType;
  options?: QuestionOption[];
  sliderConfig?: SliderConfig;
  rangeOptions?: RangeOption[];
  factors: FactorId[]; // Which factors this question affects
  weight: number; // Importance weight (1-3)
  required: boolean;
  category?: string; // For grouping in UI
}

// ----------------------------------------------------------------------------
// TEST TYPES
// ----------------------------------------------------------------------------

export interface Test {
  id: TestId;
  name: string;
  description: string;
  shortDescription: string;
  icon: string;
  estimatedMinutes: number;
  questionCount: number;
  isRequired: boolean;
  factors: FactorId[];
  order: number;
}

// ----------------------------------------------------------------------------
// FACTOR & SCORING TYPES
// ----------------------------------------------------------------------------

export interface Factor {
  id: FactorId;
  name: string;
  description: string;
  icon: string;
  maxScore: 100;
  benchmarks: BenchmarkData;
  difficultyToImprove: 'easy' | 'medium' | 'hard';
  improvementTips: string[];
}

export interface BenchmarkData {
  general: number; // General population average
  byAge: Record<string, number>; // e.g., "25-34": 65
  byIncome: Record<string, number>; // e.g., "$50k-$75k": 70
}

export interface FactorScore {
  factorId: FactorId;
  score: number;
  maxScore: 100;
  percentile: number;
  benchmarkComparison: {
    vsGeneral: number;
    vsAgeGroup: number;
    vsIncomeGroup: number;
  };
  status: 'excellent' | 'good' | 'average' | 'needs_work' | 'critical';
}

// ----------------------------------------------------------------------------
// USER RESPONSE TYPES
// ----------------------------------------------------------------------------

export interface UserResponse {
  questionId: string;
  answer: string | number | boolean;
  timestamp: Date;
}

export interface TestResult {
  testId: TestId;
  responses: UserResponse[];
  completedAt: Date;
  timeSpentSeconds: number;
}

// ----------------------------------------------------------------------------
// ASSESSMENT RESULT TYPES
// ----------------------------------------------------------------------------

export interface AssessmentResult {
  id: string;
  userId: string;
  completedAt: Date;
  
  // Test completion
  testsCompleted: TestId[];
  
  // Raw data
  responses: UserResponse[];
  
  // Calculated scores
  overallScore: number;
  factorScores: FactorScore[];
  
  // Personality analysis
  personalityType: PersonalityType;
  personalityTraits: {
    spenderVsSaver: number; // -100 to +100 (negative = spender)
    riskTolerance: number; // 0 to 100
    presentVsFuture: number; // -100 to +100 (negative = present)
    emotionalVsRational: number; // -100 to +100 (negative = emotional)
    impulsiveVsDeliberate: number; // -100 to +100 (negative = impulsive)
  };
  
  // Financial health metrics
  financialMetrics: {
    monthlyIncome: number;
    monthlyExpenses: number;
    totalDebt: number;
    monthlySavings: number;
    emergencyFundMonths: number;
    debtToIncomeRatio: number;
    savingsRate: number;
  };
  
  // Rankings
  rankings: {
    overallPercentile: number;
    vsAgeGroup: number;
    vsIncomeGroup: number;
  };
  
  // Recommendations
  recommendedGoalPath: GoalPath;
  priorityFactors: FactorId[]; // Top 3 factors to improve
  easyWins: FactorId[]; // Factors that are easy to improve
  hardChanges: FactorId[]; // Factors that need significant effort
}

// ----------------------------------------------------------------------------
// PLAN TYPES
// ----------------------------------------------------------------------------

export interface TimelineValidation {
  requestedMonths: number;
  isAchievable: boolean;
  realisticMonths: number;
  feasibilityScore: number; // 0-100
  requiredMonthlySacrifice: number;
  riskLevel: 'low' | 'medium' | 'high' | 'very_high';
  assumptions: string[];
  warnings: string[];
}

export interface PlanPath {
  type: PlanType;
  name: string;
  timelineMonths: number;
  monthlyPayment: number;
  totalCost: number;
  interestSaved: number;
  lifestyleImpact: 'minimal' | 'moderate' | 'significant' | 'severe';
  riskLevel: 'low' | 'medium' | 'high' | 'very_high';
  pros: string[];
  cons: string[];
  monthlyBreakdown: MonthlyMilestone[];
  weeklyActions: WeeklyAction[];
}

export interface MonthlyMilestone {
  month: number;
  payment: number;
  remainingDebt: number;
  totalPaid: number;
  percentComplete: number;
  milestone?: string;
}

export interface WeeklyAction {
  week: number;
  action: string;
  category: 'setup' | 'payment' | 'review' | 'optimize';
  completed?: boolean;
}

export interface FinancialPlan {
  id: string;
  assessmentId: string;
  userId: string;
  goalPath: GoalPath;
  createdAt: Date;
  
  // User's goal
  goalDescription: string;
  targetDate: Date;
  
  // Timeline analysis
  timelineValidation: TimelineValidation;
  
  // Two paths
  safePath: PlanPath;
  aggressivePath: PlanPath;
  
  // Chosen path
  chosenPath: PlanType;
  
  // Milestones
  checkpoints: Checkpoint[];
  
  // Contingencies
  contingencyPlans: ContingencyPlan[];
}

export interface Checkpoint {
  month: number;
  description: string;
  targetMetric: string;
  targetValue: number;
  status: 'pending' | 'achieved' | 'missed';
}

export interface ContingencyPlan {
  trigger: string;
  action: string;
  impact: string;
}

// ----------------------------------------------------------------------------
// PDF REPORT TYPES
// ----------------------------------------------------------------------------

export interface ReportData {
  assessment: AssessmentResult;
  plan: FinancialPlan;
  generatedAt: Date;
  
  // Formatted data for PDF
  executiveSummary: {
    overallScore: number;
    scoreLabel: string;
    personalityType: string;
    keyFindings: string[];
    recommendedFocus: string;
  };
  
  factorBreakdown: {
    factorId: FactorId;
    name: string;
    score: number;
    marketAvg: number;
    gap: number;
    difficulty: string;
    status: string;
  }[];
  
  comparisonData: {
    metric: string;
    userValue: string;
    marketAvg: string;
    rank: string;
  }[];
  
  priorityMatrix: {
    easyHighImpact: string[];
    hardHighImpact: string[];
    easyLowImpact: string[];
    hardLowImpact: string[];
  };
  
  actionPlan: {
    thirtyDayActions: string[];
    ninetyDayGoals: string[];
    twelveMonthTargets: string[];
  };
}

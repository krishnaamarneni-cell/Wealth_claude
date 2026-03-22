// ============================================================================
// FACTOR DEFINITIONS WITH BENCHMARK DATA
// 10 Scoring Factors with market comparison data
// ============================================================================

import { Factor, FactorId } from './types';

export const factors: Record<FactorId, Factor> = {
  // ----------------------------------------------------------------------------
  // 1. SAVINGS DISCIPLINE
  // ----------------------------------------------------------------------------
  savings_discipline: {
    id: 'savings_discipline',
    name: 'Savings Discipline',
    description: 'Your consistency and commitment to saving money regularly. Measures automatic savings habits, savings rate, and resistance to dipping into savings.',
    icon: '💰',
    maxScore: 100,
    difficultyToImprove: 'medium',
    benchmarks: {
      general: 52, // General US population average
      byAge: {
        '18-24': 35,
        '25-34': 48,
        '35-44': 55,
        '45-54': 60,
        '55-64': 65,
        '65+': 70
      },
      byIncome: {
        'under_25k': 25,
        '25k-50k': 40,
        '50k-75k': 55,
        '75k-100k': 62,
        '100k-150k': 70,
        'over_150k': 78
      }
    },
    improvementTips: [
      'Set up automatic transfers on payday - "pay yourself first"',
      'Start with just 1% and increase by 1% every month',
      'Use separate accounts for different savings goals',
      'Treat savings like a non-negotiable bill'
    ]
  },

  // ----------------------------------------------------------------------------
  // 2. DEBT MANAGEMENT
  // ----------------------------------------------------------------------------
  debt_management: {
    id: 'debt_management',
    name: 'Debt Management',
    description: 'How well you manage and reduce debt. Includes debt-to-income ratio, payment consistency, and strategic debt payoff approach.',
    icon: '📊',
    maxScore: 100,
    difficultyToImprove: 'hard',
    benchmarks: {
      general: 48,
      byAge: {
        '18-24': 55, // Less debt typically
        '25-34': 40, // Student loans, starting careers
        '35-44': 42, // Mortgages, family expenses
        '45-54': 50,
        '55-64': 58,
        '65+': 72
      },
      byIncome: {
        'under_25k': 35,
        '25k-50k': 42,
        '50k-75k': 50,
        '75k-100k': 55,
        '100k-150k': 62,
        'over_150k': 70
      }
    },
    improvementTips: [
      'List all debts with interest rates - attack highest rate first',
      'Consider debt consolidation if you have many small debts',
      'Pay more than minimum whenever possible',
      'Avoid taking on new debt while paying off existing debt',
      'Call creditors to negotiate lower interest rates'
    ]
  },

  // ----------------------------------------------------------------------------
  // 3. FINANCIAL PLANNING
  // ----------------------------------------------------------------------------
  financial_planning: {
    id: 'financial_planning',
    name: 'Financial Planning',
    description: 'Your approach to budgeting, goal-setting, and financial organization. Includes having written budgets, specific goals, and tracking expenses.',
    icon: '🎯',
    maxScore: 100,
    difficultyToImprove: 'easy',
    benchmarks: {
      general: 45,
      byAge: {
        '18-24': 30,
        '25-34': 42,
        '35-44': 50,
        '45-54': 52,
        '55-64': 55,
        '65+': 48
      },
      byIncome: {
        'under_25k': 35,
        '25k-50k': 42,
        '50k-75k': 48,
        '75k-100k': 55,
        '100k-150k': 60,
        'over_150k': 58
      }
    },
    improvementTips: [
      'Start with a simple 50/30/20 budget (needs/wants/savings)',
      'Use a free budgeting app to track expenses automatically',
      'Set 3 specific financial goals with deadlines',
      'Review your budget weekly for the first month',
      'Schedule monthly "money dates" to review progress'
    ]
  },

  // ----------------------------------------------------------------------------
  // 4. SPENDING CONTROL
  // ----------------------------------------------------------------------------
  spending_control: {
    id: 'spending_control',
    name: 'Spending Control',
    description: 'Your ability to control impulse purchases and stick to planned spending. Measures deliberate vs impulsive spending behavior.',
    icon: '🛒',
    maxScore: 100,
    difficultyToImprove: 'medium',
    benchmarks: {
      general: 50,
      byAge: {
        '18-24': 38,
        '25-34': 45,
        '35-44': 52,
        '45-54': 55,
        '55-64': 60,
        '65+': 68
      },
      byIncome: {
        'under_25k': 45, // Often forced to be careful
        '25k-50k': 48,
        '50k-75k': 50,
        '75k-100k': 52,
        '100k-150k': 50,
        'over_150k': 48 // More temptation with higher income
      }
    },
    improvementTips: [
      'Implement a 24-48 hour waiting period for non-essential purchases',
      'Unsubscribe from marketing emails and unfollow brands on social media',
      'Use cash for discretionary spending to feel the money leaving',
      'Create a "fun money" budget so you can spend guilt-free within limits',
      'Before buying, ask: "Do I need this, or do I just want it right now?"'
    ]
  },

  // ----------------------------------------------------------------------------
  // 5. INVESTMENT READINESS
  // ----------------------------------------------------------------------------
  investment_readiness: {
    id: 'investment_readiness',
    name: 'Investment Readiness',
    description: 'Your knowledge and action around investing. Includes investment experience, portfolio diversity, and active vs passive approach.',
    icon: '📈',
    maxScore: 100,
    difficultyToImprove: 'medium',
    benchmarks: {
      general: 42,
      byAge: {
        '18-24': 25,
        '25-34': 40,
        '35-44': 48,
        '45-54': 55,
        '55-64': 58,
        '65+': 52
      },
      byIncome: {
        'under_25k': 18,
        '25k-50k': 30,
        '50k-75k': 45,
        '75k-100k': 58,
        '100k-150k': 68,
        'over_150k': 78
      }
    },
    improvementTips: [
      'Start with your employer 401(k) - get the full match first',
      'Open a Roth IRA and set up automatic monthly contributions',
      'Begin with low-cost index funds - they outperform most active funds',
      'Read one investing book (try "The Simple Path to Wealth")',
      'Don\'t wait to invest - time in market beats timing the market'
    ]
  },

  // ----------------------------------------------------------------------------
  // 6. RISK TOLERANCE
  // ----------------------------------------------------------------------------
  risk_tolerance: {
    id: 'risk_tolerance',
    name: 'Risk Tolerance',
    description: 'Your comfort level with financial risk and market volatility. Neither high nor low is inherently better - it should match your goals and timeline.',
    icon: '🛡️',
    maxScore: 100,
    difficultyToImprove: 'hard',
    benchmarks: {
      general: 50, // This is neutral - 50 means "balanced"
      byAge: {
        '18-24': 65, // Can afford more risk with time
        '25-34': 60,
        '35-44': 55,
        '45-54': 50,
        '55-64': 42,
        '65+': 35
      },
      byIncome: {
        'under_25k': 40,
        '25k-50k': 45,
        '50k-75k': 50,
        '75k-100k': 55,
        '100k-150k': 60,
        'over_150k': 65
      }
    },
    improvementTips: [
      'Risk tolerance is personal - there\'s no "right" level',
      'Ensure your risk matches your investment timeline',
      'If you can\'t sleep during market drops, reduce risk',
      'Diversification reduces risk without sacrificing all returns',
      'Remember: higher risk doesn\'t guarantee higher returns'
    ]
  },

  // ----------------------------------------------------------------------------
  // 7. FINANCIAL LITERACY
  // ----------------------------------------------------------------------------
  financial_literacy: {
    id: 'financial_literacy',
    name: 'Financial Literacy',
    description: 'Your understanding of financial concepts like compound interest, diversification, debt, and investing fundamentals.',
    icon: '🧠',
    maxScore: 100,
    difficultyToImprove: 'easy',
    benchmarks: {
      general: 48,
      byAge: {
        '18-24': 35,
        '25-34': 45,
        '35-44': 52,
        '45-54': 55,
        '55-64': 55,
        '65+': 50
      },
      byIncome: {
        'under_25k': 35,
        '25k-50k': 42,
        '50k-75k': 50,
        '75k-100k': 58,
        '100k-150k': 65,
        'over_150k': 70
      }
    },
    improvementTips: [
      'Read one personal finance book per quarter',
      'Listen to finance podcasts during commute (try "The Money Guy Show")',
      'Take a free online course (Coursera, Khan Academy)',
      'Follow reputable finance content creators',
      'Join a money-focused community or subreddit'
    ]
  },

  // ----------------------------------------------------------------------------
  // 8. EMERGENCY PREPAREDNESS
  // ----------------------------------------------------------------------------
  emergency_preparedness: {
    id: 'emergency_preparedness',
    name: 'Emergency Preparedness',
    description: 'Your safety net for unexpected expenses. Measures emergency fund size relative to monthly expenses.',
    icon: '⚡',
    maxScore: 100,
    difficultyToImprove: 'medium',
    benchmarks: {
      general: 40,
      byAge: {
        '18-24': 22,
        '25-34': 35,
        '35-44': 42,
        '45-54': 48,
        '55-64': 55,
        '65+': 60
      },
      byIncome: {
        'under_25k': 18,
        '25k-50k': 32,
        '50k-75k': 42,
        '75k-100k': 52,
        '100k-150k': 62,
        'over_150k': 72
      }
    },
    improvementTips: [
      'Start with a $1,000 "starter" emergency fund',
      'Build to 1 month of expenses, then 3, then 6',
      'Keep emergency fund in high-yield savings account',
      'Only use for true emergencies - not planned expenses',
      'Replenish immediately after any withdrawal'
    ]
  },

  // ----------------------------------------------------------------------------
  // 9. FUTURE ORIENTATION
  // ----------------------------------------------------------------------------
  future_orientation: {
    id: 'future_orientation',
    name: 'Future Orientation',
    description: 'How much you prioritize long-term financial security over immediate gratification. Includes retirement planning and long-term thinking.',
    icon: '🔮',
    maxScore: 100,
    difficultyToImprove: 'medium',
    benchmarks: {
      general: 45,
      byAge: {
        '18-24': 30,
        '25-34': 42,
        '35-44': 50,
        '45-54': 55,
        '55-64': 62,
        '65+': 58
      },
      byIncome: {
        'under_25k': 32,
        '25k-50k': 40,
        '50k-75k': 48,
        '75k-100k': 55,
        '100k-150k': 62,
        'over_150k': 68
      }
    },
    improvementTips: [
      'Calculate your "retirement number" - make it concrete',
      'Use a retirement calculator to see the power of starting now',
      'Visualize your future self - write a letter from 65-year-old you',
      'Automate retirement contributions so you don\'t have to decide monthly',
      'Increase contributions by 1% each year or with each raise'
    ]
  },

  // ----------------------------------------------------------------------------
  // 10. MONEY WELLNESS
  // ----------------------------------------------------------------------------
  money_wellness: {
    id: 'money_wellness',
    name: 'Money Wellness',
    description: 'Your emotional relationship with money. Measures financial anxiety, confidence, and psychological wellbeing around finances.',
    icon: '😌',
    maxScore: 100,
    difficultyToImprove: 'hard',
    benchmarks: {
      general: 48,
      byAge: {
        '18-24': 42,
        '25-34': 45,
        '35-44': 48,
        '45-54': 50,
        '55-64': 55,
        '65+': 60
      },
      byIncome: {
        'under_25k': 32,
        '25k-50k': 42,
        '50k-75k': 50,
        '75k-100k': 58,
        '100k-150k': 62,
        'over_150k': 60 // Money doesn't always buy peace
      }
    },
    improvementTips: [
      'Practice gratitude - appreciate what you have while working toward more',
      'Separate your self-worth from your net worth',
      'Address money avoidance - ignorance increases anxiety',
      'Consider talking to a financial therapist if money causes significant stress',
      'Celebrate small financial wins to build positive associations'
    ]
  }
};

// ----------------------------------------------------------------------------
// HELPER FUNCTIONS
// ----------------------------------------------------------------------------

export const getFactorById = (id: FactorId): Factor => factors[id];

export const getAllFactors = (): Factor[] => Object.values(factors);

export const getFactorsByDifficulty = (difficulty: 'easy' | 'medium' | 'hard'): Factor[] => {
  return Object.values(factors).filter(f => f.difficultyToImprove === difficulty);
};

export const getEasyWins = (): Factor[] => getFactorsByDifficulty('easy');
export const getHardChanges = (): Factor[] => getFactorsByDifficulty('hard');

export const getBenchmarkForUser = (
  factorId: FactorId,
  ageGroup: string,
  incomeGroup: string
): { general: number; byAge: number; byIncome: number } => {
  const factor = factors[factorId];
  return {
    general: factor.benchmarks.general,
    byAge: factor.benchmarks.byAge[ageGroup] || factor.benchmarks.general,
    byIncome: factor.benchmarks.byIncome[incomeGroup] || factor.benchmarks.general
  };
};

export default factors;

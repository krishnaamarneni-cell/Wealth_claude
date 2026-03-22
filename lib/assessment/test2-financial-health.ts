// ============================================================================
// TEST 2: FINANCIAL HEALTH CHECK
// 15 Questions | ~5 minutes | REQUIRED
// Covers: Savings Discipline, Debt Management, Financial Planning, Emergency Preparedness
// ============================================================================

import { Question, TestId } from './types';

const TEST_ID: TestId = 'financial_health';

export const financialHealthQuestions: Question[] = [
  // ----------------------------------------------------------------------------
  // INCOME & EXPENSES (Questions 1-4)
  // ----------------------------------------------------------------------------
  {
    id: 'fh_01',
    testId: TEST_ID,
    text: 'What is your monthly income (after taxes)?',
    description: 'Include all sources: salary, side income, investments, etc.',
    type: 'range_selector',
    category: 'Income',
    factors: ['financial_planning'], // Used for calculations, not scoring
    weight: 1,
    required: true,
    rangeOptions: [
      { id: 'a', label: 'Less than $2,000', minValue: 0, maxValue: 1999, midpoint: 1500, score: 50 },
      { id: 'b', label: '$2,000 - $3,500', minValue: 2000, maxValue: 3499, midpoint: 2750, score: 50 },
      { id: 'c', label: '$3,500 - $5,000', minValue: 3500, maxValue: 4999, midpoint: 4250, score: 50 },
      { id: 'd', label: '$5,000 - $7,500', minValue: 5000, maxValue: 7499, midpoint: 6250, score: 50 },
      { id: 'e', label: '$7,500 - $10,000', minValue: 7500, maxValue: 9999, midpoint: 8750, score: 50 },
      { id: 'f', label: '$10,000 - $15,000', minValue: 10000, maxValue: 14999, midpoint: 12500, score: 50 },
      { id: 'g', label: 'More than $15,000', minValue: 15000, maxValue: 50000, midpoint: 20000, score: 50 }
    ]
  },
  {
    id: 'fh_02',
    testId: TEST_ID,
    text: 'What is your total monthly expenses?',
    description: 'Include rent/mortgage, utilities, food, transportation, subscriptions, etc.',
    type: 'range_selector',
    category: 'Expenses',
    factors: ['spending_control', 'financial_planning'],
    weight: 1,
    required: true,
    rangeOptions: [
      { id: 'a', label: 'Less than $1,500', minValue: 0, maxValue: 1499, midpoint: 1000, score: 50 },
      { id: 'b', label: '$1,500 - $2,500', minValue: 1500, maxValue: 2499, midpoint: 2000, score: 50 },
      { id: 'c', label: '$2,500 - $4,000', minValue: 2500, maxValue: 3999, midpoint: 3250, score: 50 },
      { id: 'd', label: '$4,000 - $6,000', minValue: 4000, maxValue: 5999, midpoint: 5000, score: 50 },
      { id: 'e', label: '$6,000 - $8,000', minValue: 6000, maxValue: 7999, midpoint: 7000, score: 50 },
      { id: 'f', label: '$8,000 - $12,000', minValue: 8000, maxValue: 11999, midpoint: 10000, score: 50 },
      { id: 'g', label: 'More than $12,000', minValue: 12000, maxValue: 50000, midpoint: 15000, score: 50 }
    ]
  },
  {
    id: 'fh_03',
    testId: TEST_ID,
    text: 'What percentage of your expenses are "wants" vs "needs"?',
    description: 'Needs = housing, food, utilities, healthcare. Wants = entertainment, dining out, subscriptions.',
    type: 'multiple_choice',
    category: 'Expenses',
    factors: ['spending_control', 'financial_planning'],
    weight: 2,
    required: true,
    options: [
      { id: 'a', text: '90%+ needs, less than 10% wants', value: 100 },
      { id: 'b', text: '70-90% needs, 10-30% wants', value: 80 },
      { id: 'c', text: '50-70% needs, 30-50% wants', value: 50 },
      { id: 'd', text: '30-50% needs, 50-70% wants', value: 25 },
      { id: 'e', text: 'Less than 30% needs, 70%+ wants', value: 0 }
    ]
  },
  {
    id: 'fh_04',
    testId: TEST_ID,
    text: 'Do you know exactly where your money goes each month?',
    type: 'multiple_choice',
    category: 'Expenses',
    factors: ['financial_planning', 'spending_control'],
    weight: 2,
    required: true,
    options: [
      { id: 'a', text: 'Yes, I track every expense', value: 100 },
      { id: 'b', text: 'Mostly - I track main categories', value: 75 },
      { id: 'c', text: 'Somewhat - I have a general idea', value: 50 },
      { id: 'd', text: 'Not really - I check when worried', value: 25 },
      { id: 'e', text: 'No idea - money just disappears', value: 0 }
    ]
  },

  // ----------------------------------------------------------------------------
  // SAVINGS (Questions 5-7)
  // ----------------------------------------------------------------------------
  {
    id: 'fh_05',
    testId: TEST_ID,
    text: 'What percentage of your income do you save each month?',
    type: 'multiple_choice',
    category: 'Savings',
    factors: ['savings_discipline', 'future_orientation'],
    weight: 3,
    required: true,
    options: [
      { id: 'a', text: '30% or more', value: 100 },
      { id: 'b', text: '20-29%', value: 85 },
      { id: 'c', text: '10-19%', value: 65 },
      { id: 'd', text: '5-9%', value: 40 },
      { id: 'e', text: '1-4%', value: 20 },
      { id: 'f', text: '0% - I don\'t save', value: 0 },
      { id: 'g', text: 'Negative - I spend more than I earn', value: 0 }
    ]
  },
  {
    id: 'fh_06',
    testId: TEST_ID,
    text: 'Do you have automatic savings set up?',
    type: 'multiple_choice',
    category: 'Savings',
    factors: ['savings_discipline', 'financial_planning'],
    weight: 2,
    required: true,
    options: [
      { id: 'a', text: 'Yes, automatic transfers on payday', value: 100 },
      { id: 'b', text: 'Yes, but I sometimes skip months', value: 60 },
      { id: 'c', text: 'No, but I manually save consistently', value: 70 },
      { id: 'd', text: 'No, I save when I have extra', value: 30 },
      { id: 'e', text: 'No, I haven\'t set up any savings', value: 0 }
    ]
  },
  {
    id: 'fh_07',
    testId: TEST_ID,
    text: 'How often do you dip into your savings for non-emergencies?',
    type: 'multiple_choice',
    category: 'Savings',
    factors: ['savings_discipline', 'spending_control'],
    weight: 2,
    required: true,
    options: [
      { id: 'a', text: 'Never - savings are untouchable', value: 100 },
      { id: 'b', text: 'Rarely - only once or twice a year', value: 75 },
      { id: 'c', text: 'Sometimes - a few times a year', value: 50 },
      { id: 'd', text: 'Often - monthly', value: 20 },
      { id: 'e', text: 'Constantly - savings never last', value: 0 }
    ]
  },

  // ----------------------------------------------------------------------------
  // DEBT (Questions 8-11)
  // ----------------------------------------------------------------------------
  {
    id: 'fh_08',
    testId: TEST_ID,
    text: 'What is your total debt (excluding mortgage)?',
    description: 'Include credit cards, car loans, student loans, personal loans, etc.',
    type: 'range_selector',
    category: 'Debt',
    factors: ['debt_management'],
    weight: 3,
    required: true,
    rangeOptions: [
      { id: 'a', label: 'No debt ($0)', minValue: 0, maxValue: 0, midpoint: 0, score: 100 },
      { id: 'b', label: '$1 - $5,000', minValue: 1, maxValue: 5000, midpoint: 2500, score: 80 },
      { id: 'c', label: '$5,001 - $15,000', minValue: 5001, maxValue: 15000, midpoint: 10000, score: 60 },
      { id: 'd', label: '$15,001 - $30,000', minValue: 15001, maxValue: 30000, midpoint: 22500, score: 40 },
      { id: 'e', label: '$30,001 - $50,000', minValue: 30001, maxValue: 50000, midpoint: 40000, score: 25 },
      { id: 'f', label: '$50,001 - $100,000', minValue: 50001, maxValue: 100000, midpoint: 75000, score: 15 },
      { id: 'g', label: 'More than $100,000', minValue: 100001, maxValue: 500000, midpoint: 150000, score: 5 }
    ]
  },
  {
    id: 'fh_09',
    testId: TEST_ID,
    text: 'What is your total monthly debt payments (excluding mortgage)?',
    type: 'range_selector',
    category: 'Debt',
    factors: ['debt_management'],
    weight: 2,
    required: true,
    rangeOptions: [
      { id: 'a', label: 'No debt payments ($0)', minValue: 0, maxValue: 0, midpoint: 0, score: 100 },
      { id: 'b', label: '$1 - $200', minValue: 1, maxValue: 200, midpoint: 100, score: 80 },
      { id: 'c', label: '$201 - $500', minValue: 201, maxValue: 500, midpoint: 350, score: 60 },
      { id: 'd', label: '$501 - $1,000', minValue: 501, maxValue: 1000, midpoint: 750, score: 40 },
      { id: 'e', label: '$1,001 - $2,000', minValue: 1001, maxValue: 2000, midpoint: 1500, score: 25 },
      { id: 'f', label: 'More than $2,000', minValue: 2001, maxValue: 10000, midpoint: 3000, score: 10 }
    ]
  },
  {
    id: 'fh_10',
    testId: TEST_ID,
    text: 'How do you manage your debt payments?',
    type: 'multiple_choice',
    category: 'Debt',
    factors: ['debt_management', 'financial_planning'],
    weight: 2,
    required: true,
    options: [
      { id: 'a', text: 'I have no debt', value: 100 },
      { id: 'b', text: 'I pay more than minimum and have a payoff plan', value: 90 },
      { id: 'c', text: 'I pay more than minimum when I can', value: 65 },
      { id: 'd', text: 'I pay minimum payments consistently', value: 45 },
      { id: 'e', text: 'I sometimes miss minimum payments', value: 15 },
      { id: 'f', text: 'I\'m behind on payments', value: 0 }
    ]
  },
  {
    id: 'fh_11',
    testId: TEST_ID,
    text: 'Do you know the interest rates on all your debts?',
    type: 'multiple_choice',
    category: 'Debt',
    factors: ['debt_management', 'financial_literacy'],
    weight: 1,
    required: true,
    options: [
      { id: 'a', text: 'Yes, I know all rates and prioritize highest first', value: 100 },
      { id: 'b', text: 'Yes, I know all rates', value: 80 },
      { id: 'c', text: 'I know some of them', value: 50 },
      { id: 'd', text: 'I have a rough idea', value: 30 },
      { id: 'e', text: 'No idea what my rates are', value: 10 }
    ]
  },

  // ----------------------------------------------------------------------------
  // EMERGENCY FUND & PLANNING (Questions 12-15)
  // ----------------------------------------------------------------------------
  {
    id: 'fh_12',
    testId: TEST_ID,
    text: 'If you lost your income today, how many months could you survive on savings?',
    type: 'multiple_choice',
    category: 'Emergency Fund',
    factors: ['emergency_preparedness', 'savings_discipline'],
    weight: 3,
    required: true,
    options: [
      { id: 'a', text: '12+ months', value: 100 },
      { id: 'b', text: '6-12 months', value: 90 },
      { id: 'c', text: '3-6 months', value: 70 },
      { id: 'd', text: '1-3 months', value: 40 },
      { id: 'e', text: 'Less than 1 month', value: 15 },
      { id: 'f', text: 'I would be in trouble immediately', value: 0 }
    ]
  },
  {
    id: 'fh_13',
    testId: TEST_ID,
    text: 'Do you have a separate, dedicated emergency fund?',
    type: 'multiple_choice',
    category: 'Emergency Fund',
    factors: ['emergency_preparedness', 'financial_planning'],
    weight: 2,
    required: true,
    options: [
      { id: 'a', text: 'Yes, fully funded (6+ months expenses)', value: 100 },
      { id: 'b', text: 'Yes, partially funded (3-6 months)', value: 75 },
      { id: 'c', text: 'Yes, but small (1-3 months)', value: 50 },
      { id: 'd', text: 'No dedicated fund, but I have savings', value: 30 },
      { id: 'e', text: 'No emergency fund', value: 0 }
    ]
  },
  {
    id: 'fh_14',
    testId: TEST_ID,
    text: 'Do you have a written budget or spending plan?',
    type: 'multiple_choice',
    category: 'Planning',
    factors: ['financial_planning'],
    weight: 2,
    required: true,
    options: [
      { id: 'a', text: 'Yes, detailed and I review it weekly', value: 100 },
      { id: 'b', text: 'Yes, and I review it monthly', value: 85 },
      { id: 'c', text: 'Yes, but I don\'t follow it strictly', value: 50 },
      { id: 'd', text: 'No written budget, but I have mental limits', value: 35 },
      { id: 'e', text: 'No budget at all', value: 10 }
    ]
  },
  {
    id: 'fh_15',
    testId: TEST_ID,
    text: 'Do you have specific financial goals with target dates?',
    type: 'multiple_choice',
    category: 'Planning',
    factors: ['financial_planning', 'future_orientation'],
    weight: 2,
    required: true,
    options: [
      { id: 'a', text: 'Yes, multiple written goals with deadlines', value: 100 },
      { id: 'b', text: 'Yes, a few goals with rough timelines', value: 70 },
      { id: 'c', text: 'I have goals but no specific dates', value: 45 },
      { id: 'd', text: 'Vague goals like "save more"', value: 25 },
      { id: 'e', text: 'No financial goals', value: 0 }
    ]
  }
];

export default financialHealthQuestions;

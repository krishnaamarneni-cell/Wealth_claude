// ============================================================================
// TEST 3: INVESTMENT PROFILE
// 12 Questions | ~3 minutes | OPTIONAL
// Covers: Investment Readiness, Financial Literacy, Risk Tolerance (deeper)
// ============================================================================

import { Question, TestId } from './types';

const TEST_ID: TestId = 'investment_profile';

export const investmentProfileQuestions: Question[] = [
  // ----------------------------------------------------------------------------
  // FINANCIAL LITERACY (Questions 1-4)
  // ----------------------------------------------------------------------------
  {
    id: 'ip_01',
    testId: TEST_ID,
    text: 'What does "compound interest" mean?',
    type: 'multiple_choice',
    category: 'Financial Literacy',
    factors: ['financial_literacy'],
    weight: 2,
    required: true,
    options: [
      { id: 'a', text: 'Interest calculated on initial principal only', value: 0 },
      { id: 'b', text: 'Interest calculated on principal plus accumulated interest', value: 100 },
      { id: 'c', text: 'A type of high-interest savings account', value: 10 },
      { id: 'd', text: 'Interest paid by the government on bonds', value: 10 },
      { id: 'e', text: 'I\'m not sure', value: 0 }
    ]
  },
  {
    id: 'ip_02',
    testId: TEST_ID,
    text: 'If the interest rate rises, what typically happens to bond prices?',
    type: 'multiple_choice',
    category: 'Financial Literacy',
    factors: ['financial_literacy', 'investment_readiness'],
    weight: 2,
    required: true,
    options: [
      { id: 'a', text: 'They go up', value: 0 },
      { id: 'b', text: 'They go down', value: 100 },
      { id: 'c', text: 'They stay the same', value: 10 },
      { id: 'd', text: 'It depends on the bond type', value: 40 },
      { id: 'e', text: 'I don\'t know', value: 0 }
    ]
  },
  {
    id: 'ip_03',
    testId: TEST_ID,
    text: 'What is diversification in investing?',
    type: 'multiple_choice',
    category: 'Financial Literacy',
    factors: ['financial_literacy', 'investment_readiness'],
    weight: 2,
    required: true,
    options: [
      { id: 'a', text: 'Putting all money in the best-performing stock', value: 0 },
      { id: 'b', text: 'Spreading investments across different assets to reduce risk', value: 100 },
      { id: 'c', text: 'Investing only in different industries', value: 40 },
      { id: 'd', text: 'Changing investments frequently', value: 10 },
      { id: 'e', text: 'I\'m not sure', value: 0 }
    ]
  },
  {
    id: 'ip_04',
    testId: TEST_ID,
    text: 'What is an index fund?',
    type: 'multiple_choice',
    category: 'Financial Literacy',
    factors: ['financial_literacy', 'investment_readiness'],
    weight: 1,
    required: true,
    options: [
      { id: 'a', text: 'A fund that tries to beat the market through active management', value: 20 },
      { id: 'b', text: 'A fund that tracks a market index like S&P 500', value: 100 },
      { id: 'c', text: 'A type of savings account with index-linked interest', value: 10 },
      { id: 'd', text: 'A government-backed investment', value: 10 },
      { id: 'e', text: 'I don\'t know', value: 0 }
    ]
  },

  // ----------------------------------------------------------------------------
  // INVESTMENT EXPERIENCE (Questions 5-7)
  // ----------------------------------------------------------------------------
  {
    id: 'ip_05',
    testId: TEST_ID,
    text: 'What is your current investment experience?',
    type: 'multiple_choice',
    category: 'Experience',
    factors: ['investment_readiness'],
    weight: 2,
    required: true,
    options: [
      { id: 'a', text: 'Expert - I actively trade and manage a diverse portfolio', value: 100 },
      { id: 'b', text: 'Experienced - I have investments and understand them', value: 80 },
      { id: 'c', text: 'Intermediate - I have some investments but learning', value: 60 },
      { id: 'd', text: 'Beginner - I have only basic investments (401k, etc.)', value: 40 },
      { id: 'e', text: 'None - I have never invested', value: 15 }
    ]
  },
  {
    id: 'ip_06',
    testId: TEST_ID,
    text: 'What types of investments do you currently have? (Select most advanced)',
    type: 'multiple_choice',
    category: 'Experience',
    factors: ['investment_readiness', 'risk_tolerance'],
    weight: 2,
    required: true,
    options: [
      { id: 'a', text: 'None - only savings account', value: 10 },
      { id: 'b', text: '401k/IRA only (employer retirement accounts)', value: 40 },
      { id: 'c', text: 'Mutual funds or ETFs', value: 60 },
      { id: 'd', text: 'Individual stocks', value: 75 },
      { id: 'e', text: 'Options, crypto, or alternative investments', value: 90 }
    ]
  },
  {
    id: 'ip_07',
    testId: TEST_ID,
    text: 'How often do you review and rebalance your investments?',
    type: 'multiple_choice',
    category: 'Experience',
    factors: ['investment_readiness', 'financial_planning'],
    weight: 1,
    required: true,
    options: [
      { id: 'a', text: 'I don\'t have investments to review', value: 20 },
      { id: 'b', text: 'Never - I set and forget', value: 30 },
      { id: 'c', text: 'Annually', value: 70 },
      { id: 'd', text: 'Quarterly', value: 85 },
      { id: 'e', text: 'Monthly or more frequently', value: 80 }
    ]
  },

  // ----------------------------------------------------------------------------
  // RISK CAPACITY & TOLERANCE (Questions 8-12)
  // ----------------------------------------------------------------------------
  {
    id: 'ip_08',
    testId: TEST_ID,
    text: 'What is your investment time horizon?',
    type: 'multiple_choice',
    category: 'Risk Assessment',
    factors: ['risk_tolerance', 'future_orientation'],
    weight: 2,
    required: true,
    options: [
      { id: 'a', text: 'Less than 2 years', value: 20 },
      { id: 'b', text: '2-5 years', value: 40 },
      { id: 'c', text: '5-10 years', value: 60 },
      { id: 'd', text: '10-20 years', value: 80 },
      { id: 'e', text: '20+ years', value: 100 }
    ]
  },
  {
    id: 'ip_09',
    testId: TEST_ID,
    text: 'Your portfolio drops 30% in a market crash. When do you need this money?',
    type: 'scenario',
    category: 'Risk Assessment',
    factors: ['risk_tolerance'],
    weight: 3,
    required: true,
    options: [
      { id: 'a', text: 'Within 1 year - I\'m in trouble', value: 10 },
      { id: 'b', text: '1-3 years - I\'m worried', value: 30 },
      { id: 'c', text: '3-5 years - I have time', value: 55 },
      { id: 'd', text: '5-10 years - Not concerned', value: 75 },
      { id: 'e', text: '10+ years - Great buying opportunity', value: 100 }
    ]
  },
  {
    id: 'ip_10',
    testId: TEST_ID,
    text: 'Which statement best describes your investment philosophy?',
    type: 'multiple_choice',
    category: 'Risk Assessment',
    factors: ['risk_tolerance', 'investment_readiness'],
    weight: 2,
    required: true,
    options: [
      { id: 'a', text: 'Preserve capital at all costs - I can\'t afford losses', value: 15 },
      { id: 'b', text: 'Minimize risk - I prefer stability over growth', value: 35 },
      { id: 'c', text: 'Balance - I want growth but with reasonable risk', value: 60 },
      { id: 'd', text: 'Growth focused - I accept volatility for higher returns', value: 80 },
      { id: 'e', text: 'Aggressive growth - I maximize returns despite high risk', value: 100 }
    ]
  },
  {
    id: 'ip_11',
    testId: TEST_ID,
    text: 'How much of your savings are you willing to invest in the stock market?',
    type: 'multiple_choice',
    category: 'Risk Assessment',
    factors: ['risk_tolerance', 'investment_readiness'],
    weight: 2,
    required: true,
    options: [
      { id: 'a', text: '0% - None, it\'s too risky', value: 10 },
      { id: 'b', text: '10-25% - A small portion', value: 35 },
      { id: 'c', text: '25-50% - A moderate amount', value: 55 },
      { id: 'd', text: '50-75% - Majority of my savings', value: 75 },
      { id: 'e', text: '75-100% - Almost everything', value: 95 }
    ]
  },
  {
    id: 'ip_12',
    testId: TEST_ID,
    text: 'Which best describes how you\'d feel if your investments dropped 20%?',
    type: 'multiple_choice',
    category: 'Risk Assessment',
    factors: ['risk_tolerance', 'money_wellness'],
    weight: 2,
    required: true,
    options: [
      { id: 'a', text: 'I\'d lose sleep and want to sell immediately', value: 10 },
      { id: 'b', text: 'I\'d be very worried but probably hold', value: 35 },
      { id: 'c', text: 'I\'d be uncomfortable but trust the process', value: 60 },
      { id: 'd', text: 'I\'d be okay - volatility is normal', value: 80 },
      { id: 'e', text: 'I\'d be excited to buy more at lower prices', value: 100 }
    ]
  }
];

export default investmentProfileQuestions;

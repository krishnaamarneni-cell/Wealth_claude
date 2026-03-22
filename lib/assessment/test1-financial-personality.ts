// ============================================================================
// TEST 1: FINANCIAL PERSONALITY
// 15 Questions | ~4 minutes | REQUIRED
// Covers: Risk Tolerance, Spending Control, Future Orientation, Money Wellness
// ============================================================================

import { Question, TestId } from './types';

const TEST_ID: TestId = 'financial_personality';

export const financialPersonalityQuestions: Question[] = [
  // ----------------------------------------------------------------------------
  // SPENDING BEHAVIOR (Questions 1-4)
  // ----------------------------------------------------------------------------
  {
    id: 'fp_01',
    testId: TEST_ID,
    text: 'You receive an unexpected $1,000. What is your first instinct?',
    type: 'scenario',
    category: 'Spending Behavior',
    factors: ['spending_control', 'savings_discipline', 'future_orientation'],
    weight: 3,
    required: true,
    options: [
      { 
        id: 'a', 
        text: 'Save all of it for emergencies or future goals', 
        value: 100,
        factorImpact: { spending_control: 100, savings_discipline: 100, future_orientation: 90 }
      },
      { 
        id: 'b', 
        text: 'Save most of it, treat yourself to something small', 
        value: 75,
        factorImpact: { spending_control: 75, savings_discipline: 80, future_orientation: 70 }
      },
      { 
        id: 'c', 
        text: 'Split it 50/50 between savings and spending', 
        value: 50,
        factorImpact: { spending_control: 50, savings_discipline: 50, future_orientation: 50 }
      },
      { 
        id: 'd', 
        text: 'Spend most of it - you deserve a reward', 
        value: 25,
        factorImpact: { spending_control: 25, savings_discipline: 20, future_orientation: 30 }
      },
      { 
        id: 'e', 
        text: 'Spend it all immediately on something you\'ve wanted', 
        value: 0,
        factorImpact: { spending_control: 0, savings_discipline: 0, future_orientation: 10 }
      }
    ]
  },
  {
    id: 'fp_02',
    testId: TEST_ID,
    text: 'How often do you make purchases you later regret?',
    type: 'multiple_choice',
    category: 'Spending Behavior',
    factors: ['spending_control'],
    weight: 2,
    required: true,
    options: [
      { id: 'a', text: 'Never or rarely', value: 100 },
      { id: 'b', text: 'A few times a year', value: 75 },
      { id: 'c', text: 'Monthly', value: 50 },
      { id: 'd', text: 'Weekly', value: 25 },
      { id: 'e', text: 'Multiple times a week', value: 0 }
    ]
  },
  {
    id: 'fp_03',
    testId: TEST_ID,
    text: 'When you see something you want but don\'t need, you typically:',
    type: 'multiple_choice',
    category: 'Spending Behavior',
    factors: ['spending_control', 'future_orientation'],
    weight: 2,
    required: true,
    options: [
      { id: 'a', text: 'Walk away without a second thought', value: 100 },
      { id: 'b', text: 'Add it to a wishlist and wait 30 days', value: 85 },
      { id: 'c', text: 'Think about it for a few days, then decide', value: 65 },
      { id: 'd', text: 'Buy it if it\'s on sale', value: 35 },
      { id: 'e', text: 'Buy it immediately - life is short', value: 10 }
    ]
  },
  {
    id: 'fp_04',
    testId: TEST_ID,
    text: 'I often buy things just because they\'re on sale, even if I don\'t need them.',
    type: 'agree_scale',
    category: 'Spending Behavior',
    factors: ['spending_control'],
    weight: 2,
    required: true,
    options: [
      { id: 'a', text: 'Strongly Disagree', value: 100 },
      { id: 'b', text: 'Disagree', value: 75 },
      { id: 'c', text: 'Neutral', value: 50 },
      { id: 'd', text: 'Agree', value: 25 },
      { id: 'e', text: 'Strongly Agree', value: 0 }
    ]
  },

  // ----------------------------------------------------------------------------
  // RISK TOLERANCE (Questions 5-8)
  // ----------------------------------------------------------------------------
  {
    id: 'fp_05',
    testId: TEST_ID,
    text: 'If you had $10,000 to invest, which option would you choose?',
    type: 'scenario',
    category: 'Risk Tolerance',
    factors: ['risk_tolerance', 'investment_readiness'],
    weight: 3,
    required: true,
    options: [
      { 
        id: 'a', 
        text: 'Keep it in a savings account (safe, low returns)', 
        value: 10,
        factorImpact: { risk_tolerance: 10, investment_readiness: 20 }
      },
      { 
        id: 'b', 
        text: 'Government bonds or CDs (very safe, modest returns)', 
        value: 30,
        factorImpact: { risk_tolerance: 30, investment_readiness: 40 }
      },
      { 
        id: 'c', 
        text: 'Mix of stocks and bonds (balanced risk and reward)', 
        value: 60,
        factorImpact: { risk_tolerance: 60, investment_readiness: 70 }
      },
      { 
        id: 'd', 
        text: 'Mostly stocks with some bonds (higher risk, higher potential)', 
        value: 80,
        factorImpact: { risk_tolerance: 80, investment_readiness: 85 }
      },
      { 
        id: 'e', 
        text: 'All stocks or crypto (highest risk, highest potential)', 
        value: 100,
        factorImpact: { risk_tolerance: 100, investment_readiness: 75 }
      }
    ]
  },
  {
    id: 'fp_06',
    testId: TEST_ID,
    text: 'Your investment drops 20% in a month. What do you do?',
    type: 'scenario',
    category: 'Risk Tolerance',
    factors: ['risk_tolerance', 'money_wellness'],
    weight: 3,
    required: true,
    options: [
      { id: 'a', text: 'Panic and sell everything immediately', value: 0 },
      { id: 'b', text: 'Sell some to reduce risk', value: 25 },
      { id: 'c', text: 'Hold steady and wait it out', value: 60 },
      { id: 'd', text: 'See it as a buying opportunity - invest more', value: 100 },
      { id: 'e', text: 'I would never invest in something that could drop', value: 10 }
    ]
  },
  {
    id: 'fp_07',
    testId: TEST_ID,
    text: 'Rate your comfort level with financial risk.',
    type: 'slider',
    category: 'Risk Tolerance',
    factors: ['risk_tolerance'],
    weight: 2,
    required: true,
    sliderConfig: {
      min: 0,
      max: 100,
      step: 10,
      labels: [
        { value: 0, label: 'I avoid all risk' },
        { value: 50, label: 'Moderate risk is okay' },
        { value: 100, label: 'High risk doesn\'t scare me' }
      ]
    }
  },
  {
    id: 'fp_08',
    testId: TEST_ID,
    text: 'Would you rather have a guaranteed $1,000 or a 50% chance of $2,500?',
    type: 'multiple_choice',
    category: 'Risk Tolerance',
    factors: ['risk_tolerance'],
    weight: 2,
    required: true,
    options: [
      { id: 'a', text: 'Definitely the guaranteed $1,000', value: 20 },
      { id: 'b', text: 'Probably the guaranteed $1,000', value: 40 },
      { id: 'c', text: 'Hard to decide - it\'s a coin flip', value: 60 },
      { id: 'd', text: 'Probably take the 50% chance', value: 80 },
      { id: 'e', text: 'Definitely take the 50% chance', value: 100 }
    ]
  },

  // ----------------------------------------------------------------------------
  // FUTURE ORIENTATION (Questions 9-11)
  // ----------------------------------------------------------------------------
  {
    id: 'fp_09',
    testId: TEST_ID,
    text: 'When you think about money, your focus is primarily on:',
    type: 'multiple_choice',
    category: 'Future Orientation',
    factors: ['future_orientation'],
    weight: 2,
    required: true,
    options: [
      { id: 'a', text: 'Today - making sure current needs are met', value: 20 },
      { id: 'b', text: 'This month - paying upcoming bills', value: 40 },
      { id: 'c', text: 'This year - achieving annual goals', value: 60 },
      { id: 'd', text: '5+ years - building long-term wealth', value: 85 },
      { id: 'e', text: 'Retirement - securing my future decades away', value: 100 }
    ]
  },
  {
    id: 'fp_10',
    testId: TEST_ID,
    text: 'I regularly think about and plan for my retirement.',
    type: 'agree_scale',
    category: 'Future Orientation',
    factors: ['future_orientation', 'financial_planning'],
    weight: 2,
    required: true,
    options: [
      { id: 'a', text: 'Strongly Agree', value: 100 },
      { id: 'b', text: 'Agree', value: 75 },
      { id: 'c', text: 'Neutral', value: 50 },
      { id: 'd', text: 'Disagree', value: 25 },
      { id: 'e', text: 'Strongly Disagree', value: 0 }
    ]
  },
  {
    id: 'fp_11',
    testId: TEST_ID,
    text: '"I\'d rather enjoy my money now than save for an uncertain future."',
    type: 'agree_scale',
    category: 'Future Orientation',
    factors: ['future_orientation', 'spending_control'],
    weight: 2,
    required: true,
    options: [
      { id: 'a', text: 'Strongly Disagree', value: 100 },
      { id: 'b', text: 'Disagree', value: 75 },
      { id: 'c', text: 'Neutral', value: 50 },
      { id: 'd', text: 'Agree', value: 25 },
      { id: 'e', text: 'Strongly Agree', value: 0 }
    ]
  },

  // ----------------------------------------------------------------------------
  // MONEY WELLNESS & DECISION MAKING (Questions 12-15)
  // ----------------------------------------------------------------------------
  {
    id: 'fp_12',
    testId: TEST_ID,
    text: 'How do you feel when you check your bank account?',
    type: 'multiple_choice',
    category: 'Money Wellness',
    factors: ['money_wellness'],
    weight: 2,
    required: true,
    options: [
      { id: 'a', text: 'Confident and in control', value: 100 },
      { id: 'b', text: 'Generally okay, sometimes pleasantly surprised', value: 75 },
      { id: 'c', text: 'Neutral - it is what it is', value: 50 },
      { id: 'd', text: 'Slightly anxious', value: 25 },
      { id: 'e', text: 'I avoid checking because it stresses me out', value: 0 }
    ]
  },
  {
    id: 'fp_13',
    testId: TEST_ID,
    text: 'When making a big financial decision, you typically:',
    type: 'multiple_choice',
    category: 'Money Wellness',
    factors: ['money_wellness', 'financial_planning'],
    weight: 2,
    required: true,
    options: [
      { id: 'a', text: 'Research extensively, create pros/cons list, sleep on it', value: 100 },
      { id: 'b', text: 'Do some research, consult trusted people', value: 80 },
      { id: 'c', text: 'Think about it briefly, then go with your gut', value: 50 },
      { id: 'd', text: 'Decide quickly - too much thinking causes paralysis', value: 30 },
      { id: 'e', text: 'Avoid the decision as long as possible', value: 10 }
    ]
  },
  {
    id: 'fp_14',
    testId: TEST_ID,
    text: 'How often do you discuss money with friends or family?',
    type: 'multiple_choice',
    category: 'Money Wellness',
    factors: ['money_wellness', 'financial_literacy'],
    weight: 1,
    required: true,
    options: [
      { id: 'a', text: 'Regularly - it\'s a normal topic', value: 80 },
      { id: 'b', text: 'Sometimes - when relevant', value: 70 },
      { id: 'c', text: 'Rarely - only when necessary', value: 50 },
      { id: 'd', text: 'Almost never - money is private', value: 40 },
      { id: 'e', text: 'Never - it\'s taboo in my circle', value: 30 }
    ]
  },
  {
    id: 'fp_15',
    testId: TEST_ID,
    text: 'When you hear about a "hot" investment opportunity, you:',
    type: 'multiple_choice',
    category: 'Money Wellness',
    factors: ['risk_tolerance', 'spending_control', 'financial_literacy'],
    weight: 2,
    required: true,
    options: [
      { id: 'a', text: 'Ignore it - if it sounds too good, it probably is', value: 70 },
      { id: 'b', text: 'Research it thoroughly before considering', value: 100 },
      { id: 'c', text: 'Ask others if they\'re investing before deciding', value: 50 },
      { id: 'd', text: 'Invest a small amount to not miss out (FOMO)', value: 30 },
      { id: 'e', text: 'Jump in quickly before the opportunity passes', value: 10 }
    ]
  }
];

export default financialPersonalityQuestions;

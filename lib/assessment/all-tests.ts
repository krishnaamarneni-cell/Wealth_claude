// ============================================================================
// WealthClaude Financial Assessment - All Tests & Questions
// Location: src/lib/assessment/all-tests.ts
// ============================================================================

export interface QuestionOption {
  value: string
  label: string
  score: number
}

export interface Question {
  id: string
  text: string
  type: "single" | "scale" | "multiple"
  options?: QuestionOption[]
  min?: number
  max?: number
  labels?: { min: string; max: string }
}

export interface Test {
  id: string
  name: string
  description: string
  icon: string // Lucide icon name
  questions: Question[]
  timeEstimate: string
  category: "core" | "specialized"
}

// ============================================================================
// Problem Type to Tests Mapping
// ============================================================================

export const problemToTests: Record<string, string[]> = {
  debt: ["financial_health", "debt_management", "money_mindset"],
  investments: ["financial_personality", "investment_profile", "money_mindset"],
  retirement: ["retirement_readiness", "investment_profile", "financial_health"],
  budgeting: ["budget_cashflow", "financial_personality", "financial_health"],
  complete_checkup: [
    "financial_personality",
    "financial_health",
    "investment_profile",
    "money_mindset",
    "debt_management",
    "retirement_readiness",
    "budget_cashflow",
    "income_career",
    "insurance_protection"
  ]
}

// ============================================================================
// TEST 1: Financial Personality (15 questions)
// ============================================================================

export const financialPersonalityTest: Test = {
  id: "financial_personality",
  name: "Financial Personality",
  description: "Discover your money mindset and behavioral patterns",
  icon: "Brain",
  timeEstimate: "4 min",
  category: "core",
  questions: [
    {
      id: "fp1",
      text: "When you receive unexpected money (bonus, gift, tax refund), what's your first instinct?",
      type: "single",
      options: [
        { value: "save_all", label: "Save all of it", score: 5 },
        { value: "save_most", label: "Save most, spend a little", score: 4 },
        { value: "split", label: "Split 50/50 between saving and spending", score: 3 },
        { value: "spend_most", label: "Spend most, save a little", score: 2 },
        { value: "spend_all", label: "Treat myself - I deserve it!", score: 1 }
      ]
    },
    {
      id: "fp2",
      text: "How often do you check your bank account or financial apps?",
      type: "single",
      options: [
        { value: "daily", label: "Daily or multiple times a day", score: 5 },
        { value: "weekly", label: "A few times a week", score: 4 },
        { value: "biweekly", label: "Once a week or so", score: 3 },
        { value: "rarely", label: "Only when I need to", score: 2 },
        { value: "avoid", label: "I avoid looking - it stresses me out", score: 1 }
      ]
    },
    {
      id: "fp3",
      text: "How would you describe your approach to budgeting?",
      type: "single",
      options: [
        { value: "detailed", label: "I track every expense in detail", score: 5 },
        { value: "general", label: "I have a general budget I try to follow", score: 4 },
        { value: "mental", label: "I keep a rough mental note", score: 3 },
        { value: "none", label: "I don't really budget", score: 1 }
      ]
    },
    {
      id: "fp4",
      text: "When making a major purchase, how do you typically decide?",
      type: "single",
      options: [
        { value: "research", label: "Extensive research, price comparison, wait for sales", score: 5 },
        { value: "some_research", label: "Some research, but don't overthink it", score: 4 },
        { value: "impulse", label: "If I want it and can afford it, I buy it", score: 2 },
        { value: "emotional", label: "I often buy on impulse and regret later", score: 1 }
      ]
    },
    {
      id: "fp5",
      text: "How comfortable are you discussing money with friends or family?",
      type: "scale",
      min: 1,
      max: 5,
      labels: { min: "Very uncomfortable", max: "Very comfortable" }
    },
    {
      id: "fp6",
      text: "When you see something you want but don't need, what do you typically do?",
      type: "single",
      options: [
        { value: "never_buy", label: "Walk away - I only buy what I need", score: 5 },
        { value: "wait", label: "Wait a few days to see if I still want it", score: 4 },
        { value: "consider", label: "Consider if it fits my budget", score: 3 },
        { value: "buy", label: "Buy it if I can afford it", score: 2 },
        { value: "buy_anyway", label: "Buy it even if I shouldn't", score: 1 }
      ]
    },
    {
      id: "fp7",
      text: "How do you feel when you think about your financial future?",
      type: "single",
      options: [
        { value: "confident", label: "Confident and excited", score: 5 },
        { value: "optimistic", label: "Cautiously optimistic", score: 4 },
        { value: "neutral", label: "Neutral - I don't think about it much", score: 3 },
        { value: "worried", label: "Somewhat worried", score: 2 },
        { value: "anxious", label: "Anxious or stressed", score: 1 }
      ]
    },
    {
      id: "fp8",
      text: "How often do you set financial goals?",
      type: "single",
      options: [
        { value: "always", label: "I always have clear financial goals", score: 5 },
        { value: "sometimes", label: "I set goals occasionally", score: 4 },
        { value: "rarely", label: "Rarely - I go with the flow", score: 2 },
        { value: "never", label: "I've never set financial goals", score: 1 }
      ]
    },
    {
      id: "fp9",
      text: "Rate your financial discipline:",
      type: "scale",
      min: 1,
      max: 5,
      labels: { min: "Not disciplined", max: "Very disciplined" }
    },
    {
      id: "fp10",
      text: "When friends suggest expensive activities, what do you typically do?",
      type: "single",
      options: [
        { value: "decline", label: "Suggest a cheaper alternative", score: 5 },
        { value: "consider", label: "Go if it fits my budget", score: 4 },
        { value: "sometimes", label: "Sometimes say yes even if I shouldn't", score: 2 },
        { value: "always", label: "Always say yes - FOMO is real", score: 1 }
      ]
    },
    {
      id: "fp11",
      text: "How do you handle bills and recurring payments?",
      type: "single",
      options: [
        { value: "auto", label: "Everything is automated and organized", score: 5 },
        { value: "manual", label: "I pay manually but always on time", score: 4 },
        { value: "sometimes_late", label: "Sometimes I forget and pay late", score: 2 },
        { value: "often_late", label: "I often miss payments", score: 1 }
      ]
    },
    {
      id: "fp12",
      text: "What's your relationship with credit cards?",
      type: "single",
      options: [
        { value: "full", label: "Pay in full every month", score: 5 },
        { value: "mostly", label: "Usually pay in full", score: 4 },
        { value: "minimum", label: "Pay minimum or a bit more", score: 2 },
        { value: "maxed", label: "Cards are often maxed out", score: 1 }
      ]
    },
    {
      id: "fp13",
      text: "How do you approach sales and discounts?",
      type: "single",
      options: [
        { value: "planned", label: "Only buy if I already planned to", score: 5 },
        { value: "research", label: "Research to see if it's a real deal", score: 4 },
        { value: "tempted", label: "Often buy things I didn't plan to", score: 2 },
        { value: "cant_resist", label: "Can't resist a good sale", score: 1 }
      ]
    },
    {
      id: "fp14",
      text: "How often do you compare prices before buying?",
      type: "scale",
      min: 1,
      max: 5,
      labels: { min: "Never", max: "Always" }
    },
    {
      id: "fp15",
      text: "How would you describe your spending habits overall?",
      type: "single",
      options: [
        { value: "frugal", label: "Very frugal - I save wherever possible", score: 5 },
        { value: "balanced", label: "Balanced - I spend mindfully", score: 4 },
        { value: "moderate", label: "Moderate - could be better", score: 3 },
        { value: "spender", label: "I tend to spend freely", score: 2 },
        { value: "overspender", label: "I often overspend", score: 1 }
      ]
    }
  ]
}

// ============================================================================
// TEST 2: Financial Health (15 questions)
// ============================================================================

export const financialHealthTest: Test = {
  id: "financial_health",
  name: "Financial Health Check",
  description: "Assess your current financial situation and stability",
  icon: "HeartPulse",
  timeEstimate: "5 min",
  category: "core",
  questions: [
    {
      id: "fh1",
      text: "How many months of expenses do you have saved in an emergency fund?",
      type: "single",
      options: [
        { value: "none", label: "No emergency fund", score: 1 },
        { value: "less_1", label: "Less than 1 month", score: 2 },
        { value: "1_3", label: "1-3 months", score: 3 },
        { value: "3_6", label: "3-6 months", score: 4 },
        { value: "more_6", label: "More than 6 months", score: 5 }
      ]
    },
    {
      id: "fh2",
      text: "What percentage of your income do you typically save each month?",
      type: "single",
      options: [
        { value: "none", label: "0% - I spend everything", score: 1 },
        { value: "low", label: "1-10%", score: 2 },
        { value: "moderate", label: "11-20%", score: 3 },
        { value: "good", label: "21-30%", score: 4 },
        { value: "excellent", label: "More than 30%", score: 5 }
      ]
    },
    {
      id: "fh3",
      text: "How would you describe your current debt situation?",
      type: "single",
      options: [
        { value: "none", label: "No debt at all", score: 5 },
        { value: "mortgage", label: "Only mortgage or student loans", score: 4 },
        { value: "manageable", label: "Some credit card debt, but manageable", score: 3 },
        { value: "concerning", label: "Significant debt that concerns me", score: 2 },
        { value: "overwhelming", label: "Overwhelming debt", score: 1 }
      ]
    },
    {
      id: "fh4",
      text: "Do you have any investments outside of retirement accounts?",
      type: "single",
      options: [
        { value: "diverse", label: "Yes, diversified portfolio", score: 5 },
        { value: "some", label: "Yes, some stocks or funds", score: 4 },
        { value: "starting", label: "Just getting started", score: 3 },
        { value: "none_want", label: "No, but I want to start", score: 2 },
        { value: "none", label: "No investments", score: 1 }
      ]
    },
    {
      id: "fh5",
      text: "Rate your confidence in managing your finances:",
      type: "scale",
      min: 1,
      max: 5,
      labels: { min: "Not confident", max: "Very confident" }
    },
    {
      id: "fh6",
      text: "Do you have adequate insurance coverage (health, life, etc.)?",
      type: "single",
      options: [
        { value: "comprehensive", label: "Yes, comprehensive coverage", score: 5 },
        { value: "basic", label: "Basic coverage", score: 3 },
        { value: "minimal", label: "Minimal coverage", score: 2 },
        { value: "none", label: "No insurance", score: 1 }
      ]
    },
    {
      id: "fh7",
      text: "How is your retirement savings progress?",
      type: "single",
      options: [
        { value: "ahead", label: "On track or ahead", score: 5 },
        { value: "contributing", label: "Contributing regularly", score: 4 },
        { value: "some", label: "Some savings, not consistent", score: 3 },
        { value: "behind", label: "Behind where I should be", score: 2 },
        { value: "none", label: "No retirement savings", score: 1 }
      ]
    },
    {
      id: "fh8",
      text: "How often do you review your financial situation?",
      type: "single",
      options: [
        { value: "weekly", label: "Weekly", score: 5 },
        { value: "monthly", label: "Monthly", score: 4 },
        { value: "quarterly", label: "Quarterly", score: 3 },
        { value: "yearly", label: "Yearly", score: 2 },
        { value: "never", label: "Rarely or never", score: 1 }
      ]
    },
    {
      id: "fh9",
      text: "What's your credit score range?",
      type: "single",
      options: [
        { value: "excellent", label: "Excellent (750+)", score: 5 },
        { value: "good", label: "Good (700-749)", score: 4 },
        { value: "fair", label: "Fair (650-699)", score: 3 },
        { value: "poor", label: "Poor (below 650)", score: 2 },
        { value: "unknown", label: "I don't know", score: 1 }
      ]
    },
    {
      id: "fh10",
      text: "Rate your overall financial health:",
      type: "scale",
      min: 1,
      max: 5,
      labels: { min: "Poor", max: "Excellent" }
    },
    {
      id: "fh11",
      text: "Do you have a will or estate plan?",
      type: "single",
      options: [
        { value: "complete", label: "Yes, complete and updated", score: 5 },
        { value: "basic", label: "Basic will only", score: 3 },
        { value: "planning", label: "Planning to create one", score: 2 },
        { value: "none", label: "No estate planning", score: 1 }
      ]
    },
    {
      id: "fh12",
      text: "How do you handle unexpected expenses?",
      type: "single",
      options: [
        { value: "emergency", label: "Use emergency fund", score: 5 },
        { value: "savings", label: "Dip into other savings", score: 4 },
        { value: "credit", label: "Use credit card", score: 2 },
        { value: "borrow", label: "Borrow from family/friends", score: 1 },
        { value: "struggle", label: "Really struggle", score: 1 }
      ]
    },
    {
      id: "fh13",
      text: "Do you have income from multiple sources?",
      type: "single",
      options: [
        { value: "multiple", label: "Yes, diversified income", score: 5 },
        { value: "side", label: "Main job + side income", score: 4 },
        { value: "single", label: "Single income source", score: 3 },
        { value: "unstable", label: "Unstable income", score: 1 }
      ]
    },
    {
      id: "fh14",
      text: "How prepared are you for a major financial emergency?",
      type: "scale",
      min: 1,
      max: 5,
      labels: { min: "Not prepared", max: "Very prepared" }
    },
    {
      id: "fh15",
      text: "Do you track your net worth?",
      type: "single",
      options: [
        { value: "monthly", label: "Yes, monthly", score: 5 },
        { value: "quarterly", label: "Yes, quarterly", score: 4 },
        { value: "yearly", label: "Yes, yearly", score: 3 },
        { value: "no", label: "No, I don't track it", score: 1 }
      ]
    }
  ]
}

// ============================================================================
// TEST 3: Investment Profile (12 questions)
// ============================================================================

export const investmentProfileTest: Test = {
  id: "investment_profile",
  name: "Investment Profile",
  description: "Understand your risk tolerance and investment style",
  icon: "TrendingUp",
  timeEstimate: "3 min",
  category: "specialized",
  questions: [
    {
      id: "ip1",
      text: "How would you react if your investments dropped 20% in a month?",
      type: "single",
      options: [
        { value: "buy_more", label: "Buy more - great opportunity", score: 5 },
        { value: "hold", label: "Hold steady - stay the course", score: 4 },
        { value: "worried", label: "Feel worried but wait", score: 3 },
        { value: "sell_some", label: "Sell some to reduce risk", score: 2 },
        { value: "sell_all", label: "Sell everything", score: 1 }
      ]
    },
    {
      id: "ip2",
      text: "What's your investment time horizon?",
      type: "single",
      options: [
        { value: "long", label: "20+ years", score: 5 },
        { value: "medium_long", label: "10-20 years", score: 4 },
        { value: "medium", label: "5-10 years", score: 3 },
        { value: "short", label: "1-5 years", score: 2 },
        { value: "very_short", label: "Less than 1 year", score: 1 }
      ]
    },
    {
      id: "ip3",
      text: "How knowledgeable are you about investing?",
      type: "scale",
      min: 1,
      max: 5,
      labels: { min: "Beginner", max: "Expert" }
    },
    {
      id: "ip4",
      text: "Which best describes your investment strategy?",
      type: "single",
      options: [
        { value: "aggressive", label: "Aggressive growth - high risk, high reward", score: 5 },
        { value: "growth", label: "Growth focused - some risk acceptable", score: 4 },
        { value: "balanced", label: "Balanced - mix of growth and stability", score: 3 },
        { value: "conservative", label: "Conservative - preserve capital", score: 2 },
        { value: "very_conservative", label: "Very conservative - minimal risk", score: 1 }
      ]
    },
    {
      id: "ip5",
      text: "Do you understand asset allocation and diversification?",
      type: "single",
      options: [
        { value: "expert", label: "Yes, I actively manage my allocation", score: 5 },
        { value: "understand", label: "Yes, I understand the concepts", score: 4 },
        { value: "basic", label: "Basic understanding", score: 3 },
        { value: "limited", label: "Limited understanding", score: 2 },
        { value: "no", label: "No, not really", score: 1 }
      ]
    },
    {
      id: "ip6",
      text: "Have you invested during a market downturn before?",
      type: "single",
      options: [
        { value: "yes_bought", label: "Yes, I bought more", score: 5 },
        { value: "yes_held", label: "Yes, I held steady", score: 4 },
        { value: "yes_sold", label: "Yes, I sold some", score: 2 },
        { value: "no_experience", label: "No experience yet", score: 3 }
      ]
    },
    {
      id: "ip7",
      text: "How comfortable are you with investment volatility?",
      type: "scale",
      min: 1,
      max: 5,
      labels: { min: "Very uncomfortable", max: "Very comfortable" }
    },
    {
      id: "ip8",
      text: "What types of investments do you hold?",
      type: "single",
      options: [
        { value: "diverse", label: "Stocks, bonds, real estate, alternatives", score: 5 },
        { value: "stocks_bonds", label: "Stocks and bonds", score: 4 },
        { value: "stocks_only", label: "Mostly stocks/ETFs", score: 3 },
        { value: "savings", label: "Mostly savings accounts", score: 2 },
        { value: "none", label: "No investments", score: 1 }
      ]
    },
    {
      id: "ip9",
      text: "Do you reinvest dividends and returns?",
      type: "single",
      options: [
        { value: "always", label: "Always reinvest", score: 5 },
        { value: "mostly", label: "Mostly reinvest", score: 4 },
        { value: "sometimes", label: "Sometimes", score: 3 },
        { value: "no", label: "No, I take the cash", score: 2 }
      ]
    },
    {
      id: "ip10",
      text: "How often do you review your investment portfolio?",
      type: "single",
      options: [
        { value: "weekly", label: "Weekly or more", score: 4 },
        { value: "monthly", label: "Monthly", score: 5 },
        { value: "quarterly", label: "Quarterly", score: 4 },
        { value: "yearly", label: "Yearly", score: 3 },
        { value: "never", label: "Rarely or never", score: 1 }
      ]
    },
    {
      id: "ip11",
      text: "Do you have a written investment plan?",
      type: "single",
      options: [
        { value: "detailed", label: "Yes, detailed plan", score: 5 },
        { value: "basic", label: "Yes, basic plan", score: 4 },
        { value: "mental", label: "Mental plan only", score: 3 },
        { value: "no", label: "No plan", score: 1 }
      ]
    },
    {
      id: "ip12",
      text: "Rate your overall investment readiness:",
      type: "scale",
      min: 1,
      max: 5,
      labels: { min: "Not ready", max: "Very ready" }
    }
  ]
}

// ============================================================================
// TEST 4: Money Mindset (10 questions)
// ============================================================================

export const moneyMindsetTest: Test = {
  id: "money_mindset",
  name: "Money Mindset",
  description: "Explore your relationship with money and beliefs",
  icon: "Lightbulb",
  timeEstimate: "2 min",
  category: "core",
  questions: [
    {
      id: "mm1",
      text: "How do you feel about money in general?",
      type: "single",
      options: [
        { value: "positive", label: "Money is a tool for freedom", score: 5 },
        { value: "neutral", label: "Money is necessary", score: 3 },
        { value: "complicated", label: "I have mixed feelings", score: 2 },
        { value: "negative", label: "Money causes stress", score: 1 }
      ]
    },
    {
      id: "mm2",
      text: "Do you believe you can build significant wealth?",
      type: "single",
      options: [
        { value: "definitely", label: "Definitely - I'm on my way", score: 5 },
        { value: "probably", label: "Probably with the right strategy", score: 4 },
        { value: "maybe", label: "Maybe, but it's hard", score: 3 },
        { value: "unlikely", label: "Unlikely for someone like me", score: 2 },
        { value: "no", label: "No, wealth isn't for me", score: 1 }
      ]
    },
    {
      id: "mm3",
      text: "How did your family talk about money growing up?",
      type: "single",
      options: [
        { value: "open", label: "Openly and positively", score: 5 },
        { value: "practical", label: "Practically when needed", score: 4 },
        { value: "avoided", label: "Topic was avoided", score: 2 },
        { value: "negative", label: "With stress or negativity", score: 1 }
      ]
    },
    {
      id: "mm4",
      text: "Do you feel you deserve financial success?",
      type: "scale",
      min: 1,
      max: 5,
      labels: { min: "Not really", max: "Absolutely" }
    },
    {
      id: "mm5",
      text: "How do you handle financial setbacks?",
      type: "single",
      options: [
        { value: "learn", label: "Learn and move forward", score: 5 },
        { value: "adapt", label: "Adapt and try again", score: 4 },
        { value: "struggle", label: "Struggle but recover", score: 3 },
        { value: "defeated", label: "Feel defeated", score: 1 }
      ]
    },
    {
      id: "mm6",
      text: "Do you compare your finances to others?",
      type: "single",
      options: [
        { value: "never", label: "Never - I focus on my own journey", score: 5 },
        { value: "rarely", label: "Rarely", score: 4 },
        { value: "sometimes", label: "Sometimes", score: 3 },
        { value: "often", label: "Often, and it affects me", score: 1 }
      ]
    },
    {
      id: "mm7",
      text: "How important is financial independence to you?",
      type: "scale",
      min: 1,
      max: 5,
      labels: { min: "Not important", max: "Top priority" }
    },
    {
      id: "mm8",
      text: "Do you believe your income can grow significantly?",
      type: "single",
      options: [
        { value: "definitely", label: "Yes, I'm actively working on it", score: 5 },
        { value: "probably", label: "Yes, with effort", score: 4 },
        { value: "maybe", label: "Maybe, depends on circumstances", score: 3 },
        { value: "limited", label: "Limited by my situation", score: 2 },
        { value: "no", label: "No, it's mostly fixed", score: 1 }
      ]
    },
    {
      id: "mm9",
      text: "How do you feel about asking for a raise or negotiating salary?",
      type: "single",
      options: [
        { value: "confident", label: "Confident - I know my worth", score: 5 },
        { value: "comfortable", label: "Comfortable doing it", score: 4 },
        { value: "nervous", label: "Nervous but I do it", score: 3 },
        { value: "avoid", label: "I tend to avoid it", score: 2 },
        { value: "never", label: "I've never done it", score: 1 }
      ]
    },
    {
      id: "mm10",
      text: "Rate your overall money mindset:",
      type: "scale",
      min: 1,
      max: 5,
      labels: { min: "Scarcity mindset", max: "Abundance mindset" }
    }
  ]
}

// ============================================================================
// TEST 5: Debt Management (12 questions) - NEW
// ============================================================================

export const debtManagementTest: Test = {
  id: "debt_management",
  name: "Debt Management",
  description: "Evaluate your debt situation and payoff strategy",
  icon: "CreditCard",
  timeEstimate: "3 min",
  category: "specialized",
  questions: [
    {
      id: "dm1",
      text: "What types of debt do you currently have?",
      type: "single",
      options: [
        { value: "none", label: "No debt", score: 5 },
        { value: "mortgage_only", label: "Only mortgage", score: 5 },
        { value: "student_only", label: "Only student loans", score: 4 },
        { value: "mixed_good", label: "Mortgage + student loans", score: 4 },
        { value: "credit_cards", label: "Credit card debt", score: 2 },
        { value: "multiple", label: "Multiple types including high-interest", score: 1 }
      ]
    },
    {
      id: "dm2",
      text: "What is your total debt (excluding mortgage)?",
      type: "single",
      options: [
        { value: "none", label: "No debt", score: 5 },
        { value: "low", label: "Under $5,000", score: 4 },
        { value: "moderate", label: "$5,000 - $20,000", score: 3 },
        { value: "high", label: "$20,000 - $50,000", score: 2 },
        { value: "very_high", label: "Over $50,000", score: 1 }
      ]
    },
    {
      id: "dm3",
      text: "Do you know the interest rates on all your debts?",
      type: "single",
      options: [
        { value: "all", label: "Yes, I know all of them", score: 5 },
        { value: "most", label: "I know most of them", score: 4 },
        { value: "some", label: "I know some of them", score: 2 },
        { value: "none", label: "I don't really know", score: 1 }
      ]
    },
    {
      id: "dm4",
      text: "Do you have a debt payoff strategy?",
      type: "single",
      options: [
        { value: "detailed", label: "Yes, detailed plan with timeline", score: 5 },
        { value: "general", label: "General plan to pay it off", score: 4 },
        { value: "minimum", label: "Just paying minimums for now", score: 2 },
        { value: "none", label: "No strategy", score: 1 }
      ]
    },
    {
      id: "dm5",
      text: "How much of your income goes to debt payments each month?",
      type: "single",
      options: [
        { value: "none", label: "0% - no debt", score: 5 },
        { value: "low", label: "Under 10%", score: 5 },
        { value: "moderate", label: "10-20%", score: 4 },
        { value: "high", label: "20-35%", score: 2 },
        { value: "very_high", label: "Over 35%", score: 1 }
      ]
    },
    {
      id: "dm6",
      text: "Have you ever missed a debt payment in the last year?",
      type: "single",
      options: [
        { value: "never", label: "Never", score: 5 },
        { value: "once", label: "Once or twice", score: 3 },
        { value: "several", label: "Several times", score: 2 },
        { value: "regularly", label: "Regularly", score: 1 }
      ]
    },
    {
      id: "dm7",
      text: "Are you currently adding to your debt or paying it down?",
      type: "single",
      options: [
        { value: "paying_fast", label: "Aggressively paying down", score: 5 },
        { value: "paying_slow", label: "Slowly paying down", score: 4 },
        { value: "stable", label: "Staying about the same", score: 3 },
        { value: "growing", label: "It's growing", score: 1 }
      ]
    },
    {
      id: "dm8",
      text: "Have you considered debt consolidation or refinancing?",
      type: "single",
      options: [
        { value: "done", label: "Yes, I've already done it", score: 5 },
        { value: "researching", label: "Currently researching options", score: 4 },
        { value: "considered", label: "Thought about it", score: 3 },
        { value: "no", label: "Haven't considered it", score: 2 }
      ]
    },
    {
      id: "dm9",
      text: "How stressed are you about your debt?",
      type: "scale",
      min: 1,
      max: 5,
      labels: { min: "Extremely stressed", max: "Not stressed at all" }
    },
    {
      id: "dm10",
      text: "Do you have any debt in collections?",
      type: "single",
      options: [
        { value: "no", label: "No", score: 5 },
        { value: "past", label: "In the past, but resolved", score: 3 },
        { value: "yes", label: "Yes, currently", score: 1 }
      ]
    },
    {
      id: "dm11",
      text: "What's your approach to using credit cards going forward?",
      type: "single",
      options: [
        { value: "avoid", label: "Avoid them completely", score: 4 },
        { value: "emergency", label: "Only for emergencies", score: 4 },
        { value: "controlled", label: "Use responsibly, pay in full", score: 5 },
        { value: "regular", label: "Use regularly, sometimes carry balance", score: 2 }
      ]
    },
    {
      id: "dm12",
      text: "How motivated are you to become debt-free?",
      type: "scale",
      min: 1,
      max: 5,
      labels: { min: "Not motivated", max: "Extremely motivated" }
    }
  ]
}

// ============================================================================
// TEST 6: Retirement Readiness (12 questions) - NEW
// ============================================================================

export const retirementReadinessTest: Test = {
  id: "retirement_readiness",
  name: "Retirement Readiness",
  description: "Assess your preparation for retirement",
  icon: "Umbrella",
  timeEstimate: "3 min",
  category: "specialized",
  questions: [
    {
      id: "rr1",
      text: "At what age do you plan to retire?",
      type: "single",
      options: [
        { value: "early", label: "Before 55 (early retirement)", score: 5 },
        { value: "standard", label: "55-65", score: 4 },
        { value: "late", label: "65-70", score: 3 },
        { value: "very_late", label: "After 70", score: 2 },
        { value: "never", label: "Haven't thought about it", score: 1 }
      ]
    },
    {
      id: "rr2",
      text: "Do you contribute to any retirement accounts (401k, IRA, etc.)?",
      type: "single",
      options: [
        { value: "max", label: "Yes, maxing out contributions", score: 5 },
        { value: "match", label: "Yes, at least employer match", score: 4 },
        { value: "some", label: "Yes, but less than I should", score: 3 },
        { value: "no", label: "No retirement contributions", score: 1 }
      ]
    },
    {
      id: "rr3",
      text: "How much do you have saved for retirement currently?",
      type: "single",
      options: [
        { value: "substantial", label: "On track or ahead of goals", score: 5 },
        { value: "moderate", label: "Some savings, making progress", score: 4 },
        { value: "little", label: "Just getting started", score: 3 },
        { value: "none", label: "No retirement savings", score: 1 }
      ]
    },
    {
      id: "rr4",
      text: "Have you calculated how much you need for retirement?",
      type: "single",
      options: [
        { value: "detailed", label: "Yes, detailed calculation with advisor", score: 5 },
        { value: "estimate", label: "Yes, rough estimate", score: 4 },
        { value: "no", label: "No, haven't calculated", score: 2 }
      ]
    },
    {
      id: "rr5",
      text: "Do you have income sources planned for retirement (Social Security, pension, etc.)?",
      type: "single",
      options: [
        { value: "multiple", label: "Multiple income sources planned", score: 5 },
        { value: "some", label: "Some sources identified", score: 4 },
        { value: "ss_only", label: "Counting on Social Security mainly", score: 2 },
        { value: "none", label: "Haven't planned this", score: 1 }
      ]
    },
    {
      id: "rr6",
      text: "How will you handle healthcare costs in retirement?",
      type: "single",
      options: [
        { value: "planned", label: "Have a plan and savings for it", score: 5 },
        { value: "medicare", label: "Counting on Medicare", score: 3 },
        { value: "uncertain", label: "Uncertain about this", score: 2 },
        { value: "no_plan", label: "Haven't thought about it", score: 1 }
      ]
    },
    {
      id: "rr7",
      text: "Will you have your home paid off by retirement?",
      type: "single",
      options: [
        { value: "yes", label: "Yes, already paid off or will be", score: 5 },
        { value: "likely", label: "Likely yes", score: 4 },
        { value: "uncertain", label: "Uncertain", score: 3 },
        { value: "no", label: "Probably not", score: 2 },
        { value: "rent", label: "I rent, no mortgage", score: 3 }
      ]
    },
    {
      id: "rr8",
      text: "Rate your knowledge of retirement planning:",
      type: "scale",
      min: 1,
      max: 5,
      labels: { min: "Very limited", max: "Very knowledgeable" }
    },
    {
      id: "rr9",
      text: "Do you have a target retirement lifestyle in mind?",
      type: "single",
      options: [
        { value: "detailed", label: "Yes, detailed vision with budget", score: 5 },
        { value: "general", label: "General idea", score: 4 },
        { value: "vague", label: "Vague thoughts", score: 2 },
        { value: "none", label: "Haven't thought about it", score: 1 }
      ]
    },
    {
      id: "rr10",
      text: "Are you accounting for inflation in your retirement planning?",
      type: "single",
      options: [
        { value: "yes", label: "Yes, factored into my calculations", score: 5 },
        { value: "somewhat", label: "Somewhat aware of it", score: 3 },
        { value: "no", label: "No, haven't considered it", score: 1 }
      ]
    },
    {
      id: "rr11",
      text: "Do you have a plan for what you'll do in retirement?",
      type: "single",
      options: [
        { value: "clear", label: "Clear vision with activities planned", score: 5 },
        { value: "ideas", label: "Some ideas", score: 4 },
        { value: "relax", label: "Just want to relax", score: 3 },
        { value: "none", label: "Haven't thought about it", score: 2 }
      ]
    },
    {
      id: "rr12",
      text: "How confident are you about your retirement readiness?",
      type: "scale",
      min: 1,
      max: 5,
      labels: { min: "Not confident", max: "Very confident" }
    }
  ]
}

// ============================================================================
// TEST 7: Budget & Cash Flow (12 questions) - NEW
// ============================================================================

export const budgetCashflowTest: Test = {
  id: "budget_cashflow",
  name: "Budget & Cash Flow",
  description: "Analyze your spending patterns and cash management",
  icon: "Wallet",
  timeEstimate: "3 min",
  category: "specialized",
  questions: [
    {
      id: "bc1",
      text: "Do you know exactly how much you spend each month?",
      type: "single",
      options: [
        { value: "exact", label: "Yes, I track everything", score: 5 },
        { value: "approximate", label: "Roughly, within a few hundred", score: 4 },
        { value: "vague", label: "Vague idea", score: 2 },
        { value: "no", label: "No idea", score: 1 }
      ]
    },
    {
      id: "bc2",
      text: "Do you use a budgeting app or system?",
      type: "single",
      options: [
        { value: "app", label: "Yes, a budgeting app (YNAB, Mint, etc.)", score: 5 },
        { value: "spreadsheet", label: "Spreadsheet or manual tracking", score: 4 },
        { value: "mental", label: "Mental budget only", score: 2 },
        { value: "none", label: "No budget system", score: 1 }
      ]
    },
    {
      id: "bc3",
      text: "At the end of the month, you typically have:",
      type: "single",
      options: [
        { value: "surplus", label: "Money left over that I save/invest", score: 5 },
        { value: "break_even", label: "Just about break even", score: 3 },
        { value: "short", label: "Come up a little short", score: 2 },
        { value: "debt", label: "Often need credit to cover expenses", score: 1 }
      ]
    },
    {
      id: "bc4",
      text: "How well do you know your fixed monthly expenses?",
      type: "single",
      options: [
        { value: "complete", label: "I have a complete list with amounts", score: 5 },
        { value: "most", label: "I know most of them", score: 4 },
        { value: "some", label: "I know the big ones", score: 3 },
        { value: "unsure", label: "Not really sure", score: 1 }
      ]
    },
    {
      id: "bc5",
      text: "What percentage of your income goes to housing?",
      type: "single",
      options: [
        { value: "low", label: "Under 25%", score: 5 },
        { value: "moderate", label: "25-30%", score: 4 },
        { value: "high", label: "30-40%", score: 3 },
        { value: "very_high", label: "Over 40%", score: 1 }
      ]
    },
    {
      id: "bc6",
      text: "How often do you review your subscriptions and recurring charges?",
      type: "single",
      options: [
        { value: "monthly", label: "Monthly", score: 5 },
        { value: "quarterly", label: "Every few months", score: 4 },
        { value: "yearly", label: "Once a year", score: 3 },
        { value: "never", label: "Rarely or never", score: 1 }
      ]
    },
    {
      id: "bc7",
      text: "Do you categorize your spending (food, entertainment, etc.)?",
      type: "single",
      options: [
        { value: "detailed", label: "Yes, detailed categories with limits", score: 5 },
        { value: "basic", label: "Basic categories", score: 4 },
        { value: "no", label: "No categorization", score: 1 }
      ]
    },
    {
      id: "bc8",
      text: "How do you handle irregular expenses (car repairs, medical bills)?",
      type: "single",
      options: [
        { value: "sinking", label: "I have sinking funds set aside", score: 5 },
        { value: "emergency", label: "Use emergency fund", score: 4 },
        { value: "savings", label: "Pull from regular savings", score: 3 },
        { value: "credit", label: "Use credit cards", score: 1 }
      ]
    },
    {
      id: "bc9",
      text: "Rate your awareness of where your money goes:",
      type: "scale",
      min: 1,
      max: 5,
      labels: { min: "No awareness", max: "Complete awareness" }
    },
    {
      id: "bc10",
      text: "Do you have specific savings goals with target amounts?",
      type: "single",
      options: [
        { value: "multiple", label: "Yes, multiple goals with amounts", score: 5 },
        { value: "one", label: "One or two goals", score: 4 },
        { value: "vague", label: "Vague goals", score: 2 },
        { value: "none", label: "No specific goals", score: 1 }
      ]
    },
    {
      id: "bc11",
      text: "How often do you experience 'where did my money go?' moments?",
      type: "single",
      options: [
        { value: "never", label: "Never - I always know", score: 5 },
        { value: "rarely", label: "Rarely", score: 4 },
        { value: "sometimes", label: "Sometimes", score: 2 },
        { value: "often", label: "Often", score: 1 }
      ]
    },
    {
      id: "bc12",
      text: "Do you plan for upcoming expenses in advance?",
      type: "scale",
      min: 1,
      max: 5,
      labels: { min: "Never plan ahead", max: "Always plan ahead" }
    }
  ]
}

// ============================================================================
// TEST 8: Income & Career (10 questions) - NEW
// ============================================================================

export const incomeCareerTest: Test = {
  id: "income_career",
  name: "Income & Career",
  description: "Evaluate your earning potential and career trajectory",
  icon: "Briefcase",
  timeEstimate: "2 min",
  category: "specialized",
  questions: [
    {
      id: "ic1",
      text: "How satisfied are you with your current income?",
      type: "scale",
      min: 1,
      max: 5,
      labels: { min: "Very unsatisfied", max: "Very satisfied" }
    },
    {
      id: "ic2",
      text: "What's your income trajectory over the past 3 years?",
      type: "single",
      options: [
        { value: "growing_fast", label: "Growing significantly (20%+ increase)", score: 5 },
        { value: "growing", label: "Growing steadily (10-20%)", score: 4 },
        { value: "stable", label: "Relatively stable", score: 3 },
        { value: "declining", label: "Declining", score: 1 }
      ]
    },
    {
      id: "ic3",
      text: "Do you have skills that are in high demand?",
      type: "single",
      options: [
        { value: "highly", label: "Yes, highly sought after", score: 5 },
        { value: "somewhat", label: "Somewhat in demand", score: 4 },
        { value: "average", label: "Average demand", score: 3 },
        { value: "low", label: "Low demand", score: 1 }
      ]
    },
    {
      id: "ic4",
      text: "Do you invest in professional development?",
      type: "single",
      options: [
        { value: "regularly", label: "Regularly - courses, certifications, etc.", score: 5 },
        { value: "sometimes", label: "Sometimes", score: 4 },
        { value: "rarely", label: "Rarely", score: 2 },
        { value: "never", label: "Never", score: 1 }
      ]
    },
    {
      id: "ic5",
      text: "Do you have additional income streams beyond your main job?",
      type: "single",
      options: [
        { value: "multiple", label: "Yes, multiple streams", score: 5 },
        { value: "one", label: "One side income", score: 4 },
        { value: "exploring", label: "Exploring options", score: 3 },
        { value: "none", label: "No additional income", score: 2 }
      ]
    },
    {
      id: "ic6",
      text: "How easily could you find a similar or better job?",
      type: "single",
      options: [
        { value: "easily", label: "Very easily - I get offers regularly", score: 5 },
        { value: "confident", label: "Confident I could", score: 4 },
        { value: "moderate", label: "It would take some effort", score: 3 },
        { value: "difficult", label: "It would be difficult", score: 1 }
      ]
    },
    {
      id: "ic7",
      text: "Do you negotiate your salary and benefits?",
      type: "single",
      options: [
        { value: "always", label: "Always, successfully", score: 5 },
        { value: "usually", label: "Usually try to", score: 4 },
        { value: "sometimes", label: "Sometimes", score: 3 },
        { value: "never", label: "Never", score: 1 }
      ]
    },
    {
      id: "ic8",
      text: "What's your job security level?",
      type: "single",
      options: [
        { value: "very_secure", label: "Very secure", score: 5 },
        { value: "secure", label: "Fairly secure", score: 4 },
        { value: "uncertain", label: "Uncertain", score: 2 },
        { value: "at_risk", label: "At risk", score: 1 }
      ]
    },
    {
      id: "ic9",
      text: "Do you have a career growth plan?",
      type: "single",
      options: [
        { value: "detailed", label: "Yes, detailed plan with timeline", score: 5 },
        { value: "general", label: "General direction", score: 4 },
        { value: "vague", label: "Vague ideas", score: 2 },
        { value: "none", label: "No plan", score: 1 }
      ]
    },
    {
      id: "ic10",
      text: "Rate your potential for income growth:",
      type: "scale",
      min: 1,
      max: 5,
      labels: { min: "Limited potential", max: "High potential" }
    }
  ]
}

// ============================================================================
// TEST 9: Insurance & Protection (8 questions) - NEW
// ============================================================================

export const insuranceProtectionTest: Test = {
  id: "insurance_protection",
  name: "Insurance & Protection",
  description: "Review your financial safety net and protection",
  icon: "Shield",
  timeEstimate: "2 min",
  category: "specialized",
  questions: [
    {
      id: "ins1",
      text: "Do you have health insurance?",
      type: "single",
      options: [
        { value: "comprehensive", label: "Yes, comprehensive plan", score: 5 },
        { value: "basic", label: "Yes, basic plan", score: 4 },
        { value: "hdhp", label: "High-deductible plan with HSA", score: 4 },
        { value: "minimal", label: "Minimal coverage", score: 2 },
        { value: "none", label: "No health insurance", score: 1 }
      ]
    },
    {
      id: "ins2",
      text: "Do you have life insurance?",
      type: "single",
      options: [
        { value: "adequate", label: "Yes, adequate coverage", score: 5 },
        { value: "some", label: "Yes, but probably not enough", score: 3 },
        { value: "employer", label: "Only through employer", score: 3 },
        { value: "none", label: "No life insurance", score: 1 },
        { value: "not_needed", label: "Don't need it (no dependents)", score: 4 }
      ]
    },
    {
      id: "ins3",
      text: "Do you have disability insurance?",
      type: "single",
      options: [
        { value: "yes", label: "Yes, long-term disability", score: 5 },
        { value: "employer", label: "Through employer only", score: 3 },
        { value: "short_term", label: "Short-term only", score: 2 },
        { value: "none", label: "No disability insurance", score: 1 }
      ]
    },
    {
      id: "ins4",
      text: "Do you have auto insurance with adequate coverage?",
      type: "single",
      options: [
        { value: "full", label: "Full coverage with umbrella", score: 5 },
        { value: "standard", label: "Standard full coverage", score: 4 },
        { value: "minimum", label: "State minimum only", score: 2 },
        { value: "none", label: "No car / no insurance", score: 3 }
      ]
    },
    {
      id: "ins5",
      text: "Do you have homeowners/renters insurance?",
      type: "single",
      options: [
        { value: "comprehensive", label: "Yes, comprehensive coverage", score: 5 },
        { value: "basic", label: "Yes, basic coverage", score: 4 },
        { value: "none", label: "No coverage", score: 1 }
      ]
    },
    {
      id: "ins6",
      text: "Do you have an umbrella liability policy?",
      type: "single",
      options: [
        { value: "yes", label: "Yes", score: 5 },
        { value: "considering", label: "Considering getting one", score: 3 },
        { value: "no", label: "No", score: 2 }
      ]
    },
    {
      id: "ins7",
      text: "When did you last review your insurance coverage?",
      type: "single",
      options: [
        { value: "recently", label: "Within the last year", score: 5 },
        { value: "few_years", label: "1-3 years ago", score: 3 },
        { value: "long_ago", label: "Over 3 years ago", score: 2 },
        { value: "never", label: "Never reviewed", score: 1 }
      ]
    },
    {
      id: "ins8",
      text: "Rate your confidence in your insurance protection:",
      type: "scale",
      min: 1,
      max: 5,
      labels: { min: "Not protected", max: "Well protected" }
    }
  ]
}

// ============================================================================
// Export All Tests
// ============================================================================

export const allTests: Test[] = [
  financialPersonalityTest,
  financialHealthTest,
  investmentProfileTest,
  moneyMindsetTest,
  debtManagementTest,
  retirementReadinessTest,
  budgetCashflowTest,
  incomeCareerTest,
  insuranceProtectionTest
]

export const getTestById = (id: string): Test | undefined => {
  return allTests.find(t => t.id === id)
}

export const getTestsForProblem = (problemType: string): Test[] => {
  const testIds = problemToTests[problemType] || []
  return testIds.map(id => getTestById(id)).filter((t): t is Test => t !== undefined)
}

/**
 * Builds a compact financial snapshot from PortfolioContext data.
 * This gets sent to the LLM as context so it can answer personal finance questions.
 * We strip unnecessary fields and keep it token-efficient.
 */

interface PortfolioSnapshot {
  portfolio: {
    totalValue: number
    totalCost: number
    totalGain: number
    totalGainPercent: number
    todayGain: number
    todayGainPercent: number
    holdingsCount: number
  }
  holdings: Array<{
    symbol: string
    shares: number
    avgCost: number
    currentPrice: number
    marketValue: number
    gain: number
    gainPercent: number
    sector: string
    allocation: number
  }>
  allocation: {
    bySector: Record<string, number>
    topHoldings: Array<{ symbol: string; allocation: number }>
  }
  risk: {
    concentration: number
    diversificationScore: number
    valueAtRisk: number
  }
  performance: {
    todayReturn: number
    returns: Record<string, number>
  }
  income: {
    totalDividends: number
    dividendYield: number
  }
  tax: {
    shortTermGains: number
    longTermGains: number
    estimatedTaxLiability: number
  }
  benchmarks: {
    vsSP500: number
    vsNASDAQ: number
  }
  alerts: {
    rebalanceNeeded: boolean
    portfolioDrift: number
  }
  behavior: {
    tradingStyle: string
    averagePositionSize: number
  }
}

export interface FinancialSnapshot {
  portfolio: PortfolioSnapshot
  debts: Array<{
    name: string
    type: string
    balance: number
    apr: number
    minPayment: number
  }>
  goals: Array<{
    name: string
    type: string
    targetAmount: number
    currentAmount: number
    targetDate: string
  }>
  financialProfile: {
    riskTolerance: string
    annualIncome: number
    monthlyExpenses: number
    taxBracket: number
  } | null
}

/**
 * Extract a compact snapshot from the PortfolioContext data.
 * Called on the frontend before sending to the API route.
 */
export function buildPortfolioSnapshot(ctx: any): PortfolioSnapshot {
  return {
    portfolio: {
      totalValue: ctx.portfolioValue ?? 0,
      totalCost: ctx.totalCost ?? 0,
      totalGain: ctx.totalGain ?? 0,
      totalGainPercent: ctx.totalGainPercent ?? 0,
      todayGain: ctx.performance?.todayReturn?.value ?? 0,
      todayGainPercent: ctx.performance?.todayReturn?.percent ?? 0,
      holdingsCount: ctx.holdings?.length ?? 0,
    },
    holdings: (ctx.holdings ?? []).map((h: any) => ({
      symbol: h.symbol,
      shares: h.shares,
      avgCost: h.avgCost,
      currentPrice: h.currentPrice,
      marketValue: h.marketValue,
      gain: h.totalGain,
      gainPercent: h.totalGainPercent,
      sector: h.sector,
      allocation: h.allocation,
    })),
    allocation: {
      bySector: ctx.allocation?.bySector ?? {},
      topHoldings: ctx.allocation?.topHoldings ?? [],
    },
    risk: {
      concentration: ctx.risk?.concentration ?? 0,
      diversificationScore: ctx.risk?.diversificationScore ?? 0,
      valueAtRisk: ctx.risk?.valueAtRisk ?? 0,
    },
    performance: {
      todayReturn: ctx.performance?.todayReturn?.percent ?? 0,
      returns: ctx.performance?.returns ?? {},
    },
    income: {
      totalDividends: ctx.income?.totalDividends ?? 0,
      dividendYield: ctx.income?.dividendYield ?? 0,
    },
    tax: {
      shortTermGains: ctx.tax?.shortTermGains ?? 0,
      longTermGains: ctx.tax?.longTermGains ?? 0,
      estimatedTaxLiability: ctx.tax?.estimatedTaxLiability ?? 0,
    },
    benchmarks: {
      vsSP500: ctx.benchmarks?.vsSP500?.difference ?? 0,
      vsNASDAQ: ctx.benchmarks?.vsNASDAQ?.difference ?? 0,
    },
    alerts: {
      rebalanceNeeded: ctx.alerts?.rebalanceNeeded ?? false,
      portfolioDrift: ctx.alerts?.portfolioDrift ?? 0,
    },
    behavior: {
      tradingStyle: ctx.behavior?.tradingStyle ?? 'Unknown',
      averagePositionSize: ctx.behavior?.averagePositionSize ?? 0,
    },
  }
}
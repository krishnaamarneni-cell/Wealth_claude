// lib/dividend-calculator.ts

import { DividendData } from './dividend-service';

export interface HoldingInfo {
  shares: number;
  avgCost: number;
  purchaseDate: string;
}

export interface DividendMetrics {
  // Current metrics
  currentYield: number;
  yieldOnCost: number;
  annualDividend: number;
  annualIncome: number;
  frequency: string;
  lastDividendAmount: number;
  
  // Future estimates
  nextExDate: string;
  nextPayDate: string;
  nextEstimatedAmount: number;
  
  // Growth
  growthRate1Y: number;
  growthRate3Y: number;
  growthRate5Y: number;
  
  // Historical totals
  totalReceived2024: number;
  totalReceived2025: number;
  totalReceivedAllTime: number;
  
  // Projections
  projected2026Income: number;
  projected5YearIncome: number;
  
  // DRIP
  dripShares: number;
  dripValue: number;
}

export class DividendCalculator {
  /**
   * Calculate all dividend metrics for a holding
   */
  static calculateMetrics(
    holding: HoldingInfo,
    dividendHistory: DividendData[],
    currentPrice: number
  ): DividendMetrics {
    const { shares, avgCost, purchaseDate } = holding;

    // Sort dividends by date (newest first)
    const sortedDividends = [...dividendHistory].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Annual dividend (TTM - Trailing Twelve Months)
    const annualDividend = this.calculateAnnualDividend(sortedDividends);

    // Current yield
    const currentYield = currentPrice > 0 
      ? (annualDividend / currentPrice) * 100 
      : 0;

    // Yield on cost (based on YOUR purchase price)
    const yieldOnCost = avgCost > 0 
      ? (annualDividend / avgCost) * 100 
      : 0;

    // Annual income
    const annualIncome = shares * annualDividend;

    // Frequency
    const frequency = this.determineFrequency(sortedDividends);

    // Growth rates
    const growthRate1Y = this.calculateGrowthRate(sortedDividends, 1);
    const growthRate3Y = this.calculateGrowthRate(sortedDividends, 3);
    const growthRate5Y = this.calculateGrowthRate(sortedDividends, 5);

    // Historical totals
    const totals = this.calculateHistoricalTotals(
      sortedDividends, 
      shares, 
      purchaseDate
    );

    // Next dividend estimates
    const nextDividend = this.estimateNextDividend(sortedDividends, frequency);

    // Projections
    const projections = this.calculateProjections(
      annualIncome, 
      growthRate5Y
    );

    // DRIP calculation
    const drip = this.calculateDRIP(sortedDividends, shares, currentPrice, purchaseDate);

    return {
      currentYield: parseFloat(currentYield.toFixed(2)),
      yieldOnCost: parseFloat(yieldOnCost.toFixed(2)),
      annualDividend: parseFloat(annualDividend.toFixed(2)),
      annualIncome: parseFloat(annualIncome.toFixed(2)),
      frequency,
      lastDividendAmount: sortedDividends[0]?.amount || 0,
      nextExDate: nextDividend.exDate,
      nextPayDate: nextDividend.payDate,
      nextEstimatedAmount: parseFloat(nextDividend.amount.toFixed(2)),
      growthRate1Y: parseFloat(growthRate1Y.toFixed(2)),
      growthRate3Y: parseFloat(growthRate3Y.toFixed(2)),
      growthRate5Y: parseFloat(growthRate5Y.toFixed(2)),
      ...totals,
      ...projections,
      ...drip
    };
  }

  /**
   * Calculate annual dividend (TTM - Trailing Twelve Months)
   */
  static calculateAnnualDividend(dividends: DividendData[]): number {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const ttmDividends = dividends.filter(d => 
      new Date(d.date) >= oneYearAgo
    );

    return ttmDividends.reduce((sum, d) => sum + d.amount, 0);
  }

  /**
   * Determine dividend frequency
   */
  static determineFrequency(dividends: DividendData[]): string {
    if (dividends.length < 2) return "Unknown";

    const recentDividends = dividends.slice(0, 4);
    const avgDaysBetween = this.calculateAvgDaysBetween(recentDividends);

    if (avgDaysBetween < 40) return "Monthly";
    if (avgDaysBetween < 100) return "Quarterly";
    if (avgDaysBetween < 200) return "Semi-Annual";
    return "Annual";
  }

  /**
   * Calculate average days between dividends
   */
  static calculateAvgDaysBetween(dividends: DividendData[]): number {
    if (dividends.length < 2) return 0;

    let totalDays = 0;
    for (let i = 0; i < dividends.length - 1; i++) {
      const date1 = new Date(dividends[i].date);
      const date2 = new Date(dividends[i + 1].date);
      totalDays += Math.abs(date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24);
    }

    return totalDays / (dividends.length - 1);
  }

  /**
   * Calculate YoY growth rate
   */
  static calculateGrowthRate(dividends: DividendData[], years: number): number {
    const requiredDividends = years * 4; // Quarterly dividends
    if (dividends.length < requiredDividends) return 0;

    const recentDiv = dividends[0]?.amount || 0;
    const oldDiv = dividends[years * 4 - 1]?.amount || 0;

    if (oldDiv === 0) return 0;

    return ((recentDiv - oldDiv) / oldDiv) * 100;
  }

  /**
   * Calculate historical dividend totals
   */
  static calculateHistoricalTotals(
    dividends: DividendData[], 
    shares: number, 
    purchaseDate: string
  ): {
    totalReceived2024: number;
    totalReceived2025: number;
    totalReceivedAllTime: number;
  } {
    const purchaseDateObj = new Date(purchaseDate);

    let total2024 = 0;
    let total2025 = 0;
    let totalAllTime = 0;

    dividends.forEach(div => {
      const divDate = new Date(div.date);
      const divYear = divDate.getFullYear();
      const amount = div.amount * shares;

      // Only count dividends after purchase date
      if (divDate >= purchaseDateObj) {
        totalAllTime += amount;

        if (divYear === 2024) total2024 += amount;
        if (divYear === 2025) total2025 += amount;
      }
    });

    return {
      totalReceived2024: parseFloat(total2024.toFixed(2)),
      totalReceived2025: parseFloat(total2025.toFixed(2)),
      totalReceivedAllTime: parseFloat(totalAllTime.toFixed(2))
    };
  }

  /**
   * Estimate next dividend dates
   */
  static estimateNextDividend(
    dividends: DividendData[], 
    frequency: string
  ): { exDate: string; payDate: string; amount: number } {
    if (dividends.length === 0) {
      return { exDate: "Unknown", payDate: "Unknown", amount: 0 };
    }

    const lastDiv = dividends[0];
    const lastExDate = new Date(lastDiv.date);
    const lastPayDate = new Date(lastDiv.payDate);

    // Calculate average days between ex-date and pay-date
    const daysToPayment = Math.abs(
      (lastPayDate.getTime() - lastExDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Estimate next ex-date based on frequency
    let daysToAdd = 90;  // Default quarterly
    if (frequency === "Monthly") daysToAdd = 30;
    if (frequency === "Semi-Annual") daysToAdd = 180;
    if (frequency === "Annual") daysToAdd = 365;

    const nextExDate = new Date(lastExDate);
    nextExDate.setDate(nextExDate.getDate() + daysToAdd);

    const nextPayDate = new Date(nextExDate);
    nextPayDate.setDate(nextPayDate.getDate() + daysToPayment);

    return {
      exDate: nextExDate.toISOString().split('T')[0],
      payDate: nextPayDate.toISOString().split('T')[0],
      amount: lastDiv.amount
    };
  }

  /**
   * Calculate future projections
   */
  static calculateProjections(
    annualIncome: number, 
    growthRate: number
  ): {
    projected2026Income: number;
    projected5YearIncome: number;
  } {
    const growth = growthRate / 100;

    // 2026 projection (full year with growth)
    const projected2026 = annualIncome * (1 + growth);

    // 5-year projection with compound growth
    let projected5Year = 0;
    for (let year = 1; year <= 5; year++) {
      projected5Year += annualIncome * Math.pow(1 + growth, year);
    }

    return {
      projected2026Income: parseFloat(projected2026.toFixed(2)),
      projected5YearIncome: parseFloat(projected5Year.toFixed(2))
    };
  }

  /**
   * Calculate DRIP (Dividend Reinvestment Plan) impact
   */
  static calculateDRIP(
    dividends: DividendData[],
    initialShares: number,
    currentPrice: number,
    purchaseDate: string
  ): { dripShares: number; dripValue: number } {
    const purchaseDateObj = new Date(purchaseDate);
    let totalShares = initialShares;
    let additionalShares = 0;

    // Simulate reinvesting each dividend
    dividends.forEach(div => {
      const divDate = new Date(div.date);
      
      if (divDate >= purchaseDateObj) {
        const dividendAmount = totalShares * div.amount;
        const sharesAdded = dividendAmount / currentPrice; // Simplified (should use price at div date)
        additionalShares += sharesAdded;
        totalShares += sharesAdded;
      }
    });

    const dripValue = additionalShares * currentPrice;

    return {
      dripShares: parseFloat(additionalShares.toFixed(4)),
      dripValue: parseFloat(dripValue.toFixed(2))
    };
  }
}

// lib/dividend-recognizer.ts
// Recognizes manually added transactions and calculates received/forecasted dividends

import { DividendService, DividendData } from './dividend-service';
import { DividendCalculator, HoldingInfo, DividendMetrics } from './dividend-calculator';
import { Transaction, Holding } from './transaction-types';

export interface RecognizedDividendData {
  holding: Holding;
  purchaseDate: string;
  receivedDividends: DividendData[];
  receivedTotal: number;
  forecastedDividends: DividendData[];
  forecastedTotal: number;
  metrics: DividendMetrics;
  source: 'api' | 'yield-based';
}

export class DividendRecognizer {
  /**
   * Recognize a manually added transaction and calculate its dividend data
   */
  static async recognizeTransaction(
    transaction: Transaction,
    holding: Holding,
    currentPrice: number
  ): Promise<RecognizedDividendData> {
    console.log(`[v0] Recognizing transaction for ${transaction.symbol} on ${transaction.date}`);

    let receivedDividends: DividendData[] = [];
    let source: 'api' | 'yield-based' = 'api';

    // Step 1: Try to fetch dividend history via API
    try {
      console.log(`[v0] Fetching dividend history from API for ${transaction.symbol}...`);
      const response = await DividendService.fetchDividendData(transaction.symbol);
      
      if (response.data && response.data.length > 0) {
        // Filter dividends from purchase date onwards
        receivedDividends = response.data.filter(d => 
          new Date(d.date) >= new Date(transaction.date)
        );
        console.log(`[v0] API returned ${receivedDividends.length} dividends since purchase`);
      } else {
        throw new Error('No dividend data from API');
      }
    } catch (error) {
      console.log(`[v0] API failed: ${error}. Falling back to yield-based calculation.`);
      source = 'yield-based';
      
      // Step 2: Fallback to yield-based calculation
      if (holding.dividendYield && holding.dividendYield > 0) {
        receivedDividends = this.generateYieldBasedDividends(
          transaction.symbol,
          transaction.date,
          holding.dividendYield,
          new Date()
        );
        console.log(`[v0] Generated ${receivedDividends.length} yield-based received dividends`);
      }
    }

    // Step 3: Calculate future/forecasted dividends based on yield
    const forecastedDividends = this.generateForecastedDividends(
      transaction.symbol,
      new Date(),
      holding.dividendYield || 0,
      12 // 12 months forward
    );
    console.log(`[v0] Generated ${forecastedDividends.length} forecasted dividends`);

    // Calculate totals
    const receivedTotal = receivedDividends.reduce((sum, d) => sum + (d.amount * holding.shares), 0);
    const forecastedTotal = forecastedDividends.reduce((sum, d) => sum + (d.amount * holding.shares), 0);

    // Calculate metrics
    const holdingInfo: HoldingInfo = {
      shares: holding.shares,
      avgCost: holding.avgCost,
      purchaseDate: transaction.date
    };

    const metrics = DividendCalculator.calculateMetrics(
      holdingInfo,
      receivedDividends,
      currentPrice
    );

    console.log(`[v0] Recognition complete: Received $${receivedTotal.toFixed(2)}, Forecasted $${forecastedTotal.toFixed(2)}`);

    return {
      holding,
      purchaseDate: transaction.date,
      receivedDividends,
      receivedTotal,
      forecastedDividends,
      forecastedTotal,
      metrics,
      source
    };
  }

  /**
   * Generate yield-based received dividends (past payments)
   * Assumes quarterly payments on standard months (Mar, Jun, Sep, Dec)
   */
  static generateYieldBasedDividends(
    symbol: string,
    purchaseDate: string,
    dividendYield: number,
    upToDate: Date
  ): DividendData[] {
    const result: DividendData[] = [];
    const purchase = new Date(purchaseDate);
    
    const annualDividend = dividendYield;
    const quarterlyDividend = annualDividend / 4;
    const quarterMonths = [3, 6, 9, 12]; // Mar, Jun, Sep, Dec

    console.log(`[v0] Generating yield-based dividends: annual=${(annualDividend * 100).toFixed(2)}%, quarterly=${quarterlyDividend.toFixed(4)}`);

    // Start from first possible quarter after purchase
    let currentDate = new Date(purchase);
    const startMonth = quarterMonths.find(m => m >= purchase.getMonth() + 1) || quarterMonths[0];
    currentDate.setMonth(startMonth - 1);
    currentDate.setDate(15);

    // If start month is before purchase month, move to next year
    if (currentDate < purchase) {
      currentDate.setFullYear(currentDate.getFullYear() + 1);
      currentDate.setMonth(startMonth - 1);
    }

    // Generate quarterly dividends until upToDate
    while (currentDate <= upToDate) {
      result.push({
        date: currentDate.toISOString().split('T')[0],
        amount: quarterlyDividend,
        adjustedAmount: quarterlyDividend,
        declarationDate: this.addDays(currentDate, -30).toISOString().split('T')[0],
        recordDate: this.addDays(currentDate, -15).toISOString().split('T')[0],
        payDate: this.addDays(currentDate, 20).toISOString().split('T')[0],
        currency: 'USD'
      });

      // Move to next quarter
      const currentMonth = currentDate.getMonth() + 1;
      const nextQuarter = quarterMonths.find(m => m > currentMonth) || quarterMonths[0];
      const daysToAdd = (nextQuarter - currentMonth + 12) % 12;
      
      if (daysToAdd === 0) {
        currentDate.setFullYear(currentDate.getFullYear() + 1);
        currentDate.setMonth(quarterMonths[0] - 1);
      } else {
        currentDate.setMonth(currentDate.getMonth() + 3);
      }
    }

    return result;
  }

  /**
   * Generate forecasted future dividends (next 12 months)
   */
  static generateForecastedDividends(
    symbol: string,
    fromDate: Date,
    dividendYield: number,
    monthsForward: number
  ): DividendData[] {
    const result: DividendData[] = [];
    
    if (dividendYield <= 0) {
      console.log(`[v0] No forecasts: yield is ${dividendYield}`);
      return result;
    }

    const annualDividend = dividendYield;
    const quarterlyDividend = annualDividend / 4;
    const quarterMonths = [3, 6, 9, 12];

    console.log(`[v0] Forecasting: quarterly dividend = $${quarterlyDividend.toFixed(4)}`);

    // Find next quarterly ex-date
    let currentDate = new Date(fromDate);
    const currentMonth = currentDate.getMonth() + 1;
    const nextQuarterMonth = quarterMonths.find(m => m > currentMonth) || quarterMonths[0];
    
    if (nextQuarterMonth === quarterMonths[0]) {
      currentDate.setFullYear(currentDate.getFullYear() + 1);
    }
    currentDate.setMonth(nextQuarterMonth - 1, 15);

    const endDate = new Date(fromDate);
    endDate.setMonth(endDate.getMonth() + monthsForward);

    // Generate quarterly forecasts
    while (currentDate <= endDate && result.length < 4) {
      result.push({
        date: currentDate.toISOString().split('T')[0],
        amount: quarterlyDividend,
        adjustedAmount: quarterlyDividend,
        declarationDate: this.addDays(currentDate, -30).toISOString().split('T')[0],
        recordDate: this.addDays(currentDate, -15).toISOString().split('T')[0],
        payDate: this.addDays(currentDate, 20).toISOString().split('T')[0],
        currency: 'USD'
      });

      currentDate.setMonth(currentDate.getMonth() + 3);
    }

    return result;
  }

  /**
   * Helper to add days to a date
   */
  static addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }
}

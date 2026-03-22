// =============================================================================
// API Route: /api/assessment/pdf
// Generates PDF report for an assessment
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { spawn } from 'child_process';
import { writeFile, readFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// =============================================================================
// GET Handler - Generate PDF for assessment
// =============================================================================

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const assessmentId = searchParams.get('id');
    const userId = searchParams.get('userId');

    if (!assessmentId) {
      return NextResponse.json(
        { success: false, error: 'assessmentId required' },
        { status: 400 }
      );
    }

    // 1. Fetch assessment data from Supabase
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessment_results')
      .select(`
        *,
        financial_plans (*),
        user_profiles (full_name, age, income_range)
      `)
      .eq('id', assessmentId)
      .single();

    if (assessmentError || !assessment) {
      return NextResponse.json(
        { success: false, error: 'Assessment not found' },
        { status: 404 }
      );
    }

    // 2. Prepare data for PDF generation
    const reportData = prepareReportData(assessment);

    // 3. Generate PDF using Python script
    const pdfBuffer = await generatePdfWithPython(reportData);

    // 4. Return PDF as response
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="WealthClaude_Report_${assessmentId.slice(0, 8)}.pdf"`,
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}

// =============================================================================
// POST Handler - Generate PDF with custom data (admin use)
// =============================================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    
    // Validate admin access (implement your auth check here)
    // const isAdmin = await checkAdminAccess(request);
    // if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { assessmentId, userId } = body;

    if (!assessmentId) {
      return NextResponse.json(
        { success: false, error: 'assessmentId required' },
        { status: 400 }
      );
    }

    // Fetch and generate (same as GET)
    const { data: assessment, error } = await supabase
      .from('assessment_results')
      .select(`
        *,
        financial_plans (*),
        user_profiles (full_name, age, income_range)
      `)
      .eq('id', assessmentId)
      .single();

    if (error || !assessment) {
      return NextResponse.json(
        { success: false, error: 'Assessment not found' },
        { status: 404 }
      );
    }

    const reportData = prepareReportData(assessment);
    const pdfBuffer = await generatePdfWithPython(reportData);

    // Optionally save to storage
    if (body.saveToStorage) {
      const fileName = `reports/${userId || assessment.user_id}/${assessmentId}.pdf`;
      
      const { error: uploadError } = await supabase.storage
        .from('assessment-reports')
        .upload(fileName, pdfBuffer, {
          contentType: 'application/pdf',
          upsert: true
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
      }
    }

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="WealthClaude_Report_${assessmentId.slice(0, 8)}.pdf"`
      }
    });

  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}

// =============================================================================
// Helper: Prepare report data from Supabase records
// =============================================================================

interface AssessmentRecord {
  id: string;
  user_id: string;
  overall_score: number;
  personality_type: string;
  personality_traits: any;
  factor_scores: any[];
  financial_metrics: any;
  rankings: any;
  priority_factors: string[];
  easy_wins: string[];
  hard_changes: string[];
  recommended_goal_path: string;
  created_at: string;
  financial_plans?: any[];
  user_profiles?: {
    full_name?: string;
    age?: number;
    income_range?: string;
  };
}

function prepareReportData(assessment: AssessmentRecord): any {
  const plan = assessment.financial_plans?.[0] || {};
  const user = assessment.user_profiles || {};
  
  // Map factor IDs to display info
  const factorInfo: Record<string, { name: string; icon: string; difficulty: string }> = {
    'savings_discipline': { name: 'Savings Discipline', icon: '💰', difficulty: 'medium' },
    'debt_management': { name: 'Debt Management', icon: '📊', difficulty: 'hard' },
    'financial_planning': { name: 'Financial Planning', icon: '🎯', difficulty: 'easy' },
    'spending_control': { name: 'Spending Control', icon: '🛒', difficulty: 'medium' },
    'investment_readiness': { name: 'Investment Readiness', icon: '📈', difficulty: 'medium' },
    'risk_tolerance': { name: 'Risk Tolerance', icon: '🛡️', difficulty: 'hard' },
    'financial_literacy': { name: 'Financial Literacy', icon: '🧠', difficulty: 'easy' },
    'emergency_preparedness': { name: 'Emergency Preparedness', icon: '⚡', difficulty: 'medium' },
    'future_orientation': { name: 'Future Orientation', icon: '🔮', difficulty: 'medium' },
    'money_wellness': { name: 'Money Wellness', icon: '😌', difficulty: 'hard' }
  };

  const tips: Record<string, string> = {
    'financial_planning': 'Start with a simple 50/30/20 budget',
    'financial_literacy': 'Read one personal finance book this month',
    'savings_discipline': 'Set up automatic transfers on payday',
    'spending_control': 'Use the 24-hour rule before purchases',
    'debt_management': 'List all debts and attack highest interest first',
    'money_wellness': 'Schedule weekly money check-ins',
    'risk_tolerance': 'Diversify investments to match your comfort',
    'emergency_preparedness': 'Build a $1,000 starter emergency fund',
    'investment_readiness': 'Open a retirement account this week',
    'future_orientation': 'Calculate your retirement number'
  };

  // Format factor scores
  const factorScores = (assessment.factor_scores || []).map((fs: any) => ({
    id: fs.factorId,
    name: factorInfo[fs.factorId]?.name || fs.factorId,
    icon: factorInfo[fs.factorId]?.icon || '●',
    score: fs.score,
    status: fs.status,
    benchmark_diff: fs.benchmarkComparison?.vsGeneral || 0,
    difficulty: factorInfo[fs.factorId]?.difficulty || 'medium'
  }));

  // Format easy wins and hard changes
  const easyWins = (assessment.easy_wins || []).map((fid: string) => ({
    factor: factorInfo[fid]?.name || fid,
    tip: tips[fid] || 'Focus on improving this area'
  }));

  const hardChanges = (assessment.hard_changes || []).map((fid: string) => ({
    factor: factorInfo[fid]?.name || fid,
    tip: tips[fid] || 'This requires sustained effort'
  }));

  // Income range mapping
  const incomeRanges: Record<string, string> = {
    'a': 'Under $25,000',
    'b': '$25,000 - $50,000',
    'c': '$50,000 - $75,000',
    'd': '$75,000 - $100,000',
    'e': '$100,000 - $150,000',
    'f': '$150,000+',
    'g': '$150,000+'
  };

  const metrics = assessment.financial_metrics || {};
  const rankings = assessment.rankings || {};
  const timeline = plan.timeline_validation || {};
  const safePath = plan.safe_path || {};
  const aggressivePath = plan.aggressive_path || {};

  return {
    user_name: user.full_name || 'User',
    user_age: user.age || 30,
    user_income_range: incomeRanges[user.income_range || 'c'] || '$50,000 - $75,000',
    report_date: new Date().toISOString(),

    overall_score: assessment.overall_score,
    personality_type: assessment.personality_type,
    personality_description: getPersonalityDescription(assessment.personality_type),

    factor_scores: factorScores,

    monthly_income: metrics.monthlyIncome || 5000,
    monthly_expenses: metrics.monthlyExpenses || 4000,
    total_debt: metrics.totalDebt || 0,
    savings_rate: metrics.savingsRate || 10,
    emergency_fund_months: metrics.emergencyFundMonths || 2,
    debt_to_income: metrics.debtToIncomeRatio || 30,

    overall_percentile: rankings.overallPercentile || 50,
    vs_age_percentile: rankings.vsAgeGroup || 50,
    vs_income_percentile: rankings.vsIncomeGroup || 50,

    priority_factors: assessment.priority_factors || [],
    easy_wins: easyWins,
    hard_changes: hardChanges,

    goal_path: plan.goal_path || assessment.recommended_goal_path || 'general_wellness',
    goal_description: plan.goal_description || 'Improve financial health',
    target_months: timeline.requestedMonths || 12,
    realistic_months: timeline.realisticMonths || 18,
    feasibility_score: timeline.feasibilityScore || 70,

    safe_path: {
      timeline_months: safePath.timelineMonths || 24,
      monthly_payment: safePath.monthlyPayment || 500,
      total_cost: safePath.totalCost || 12000,
      interest_saved: safePath.interestSaved || 0,
      lifestyle_impact: safePath.lifestyleImpact || 'minimal',
      risk_level: safePath.riskLevel || 'low',
      pros: safePath.pros || ['Room for unexpected expenses', 'Less stressful'],
      cons: safePath.cons || ['Takes longer'],
      monthly_breakdown: safePath.monthlyBreakdown || [],
      weekly_actions: safePath.weeklyActions || []
    },

    aggressive_path: {
      timeline_months: aggressivePath.timelineMonths || 12,
      monthly_payment: aggressivePath.monthlyPayment || 1000,
      total_cost: aggressivePath.totalCost || 12000,
      interest_saved: aggressivePath.interestSaved || 1500,
      lifestyle_impact: aggressivePath.lifestyleImpact || 'significant',
      risk_level: aggressivePath.riskLevel || 'high',
      pros: aggressivePath.pros || ['Faster goal achievement', 'Save on interest'],
      cons: aggressivePath.cons || ['Tight budget required'],
      monthly_breakdown: aggressivePath.monthlyBreakdown || [],
      weekly_actions: aggressivePath.weeklyActions || []
    },

    chosen_path: plan.chosen_path || 'safe_steady',

    milestones: plan.checkpoints || [
      { month: 1, description: 'First payment complete', target: '100%' },
      { month: 3, description: 'Quarter 1 milestone', target: '25%' },
      { month: 6, description: 'Halfway checkpoint', target: '50%' },
      { month: 12, description: 'Year 1 complete', target: '100%' }
    ],

    contingencies: plan.contingency_plans || [
      { trigger: 'Miss a monthly payment', action: 'Make it up within 2 weeks' },
      { trigger: 'Unexpected expense ($500+)', action: 'Pause extra payments for 1 month' },
      { trigger: 'Income reduction', action: 'Switch to minimum payments' }
    ]
  };
}

function getPersonalityDescription(type: string): string {
  const descriptions: Record<string, string> = {
    'cautious_saver': 'You prioritize security and steadily build wealth through consistent saving.',
    'balanced_planner': 'You take a measured approach to money, balancing enjoyment today with planning for tomorrow.',
    'growth_investor': 'You\'re focused on building wealth and willing to take calculated risks.',
    'spontaneous_spender': 'You live in the moment and enjoy spending on experiences.',
    'risk_taker': 'You\'re comfortable with high-risk, high-reward scenarios.',
    'money_avoider': 'You tend to avoid thinking about money because it causes stress.',
    'security_seeker': 'Your primary goal is financial safety with a strong safety net.'
  };
  return descriptions[type] || 'Your financial personality is unique.';
}

// =============================================================================
// Helper: Generate PDF using Python subprocess
// =============================================================================

async function generatePdfWithPython(reportData: any): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    const tempId = randomUUID();
    const dataPath = join(tmpdir(), `report_data_${tempId}.json`);
    const outputPath = join(tmpdir(), `report_${tempId}.pdf`);

    try {
      // Write data to temp file
      await writeFile(dataPath, JSON.stringify(reportData));

      // Path to Python script (adjust based on your deployment)
      const scriptPath = join(process.cwd(), 'src/lib/pdf/generate-from-json.py');

      // Spawn Python process
      const python = spawn('python3', [scriptPath, dataPath, outputPath]);

      let stderr = '';
      
      python.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      python.on('close', async (code) => {
        try {
          if (code !== 0) {
            console.error('Python script error:', stderr);
            reject(new Error(`Python script failed with code ${code}`));
            return;
          }

          // Read generated PDF
          const pdfBuffer = await readFile(outputPath);
          
          // Cleanup temp files
          await unlink(dataPath).catch(() => {});
          await unlink(outputPath).catch(() => {});

          resolve(pdfBuffer);
        } catch (err) {
          reject(err);
        }
      });

      python.on('error', (err) => {
        reject(err);
      });

    } catch (err) {
      // Cleanup on error
      await unlink(dataPath).catch(() => {});
      await unlink(outputPath).catch(() => {});
      reject(err);
    }
  });
}

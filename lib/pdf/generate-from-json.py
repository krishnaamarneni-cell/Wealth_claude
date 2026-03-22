#!/usr/bin/env python3
"""
Generate PDF report from JSON data file.
Called by Next.js API route.

Usage:
    python generate-from-json.py <input.json> <output.pdf>
"""

import sys
import json
from datetime import datetime
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from report_generator import ReportData, generate_report


def main():
    if len(sys.argv) != 3:
        print("Usage: python generate-from-json.py <input.json> <output.pdf>", file=sys.stderr)
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2]

    # Read JSON data
    with open(input_path, 'r') as f:
        data = json.load(f)

    # Parse date
    report_date = datetime.now()
    if 'report_date' in data:
        try:
            report_date = datetime.fromisoformat(data['report_date'].replace('Z', '+00:00'))
        except:
            pass

    # Create ReportData object
    report_data = ReportData(
        user_name=data.get('user_name', 'User'),
        user_age=data.get('user_age', 30),
        user_income_range=data.get('user_income_range', '$50,000 - $75,000'),
        report_date=report_date,

        overall_score=data.get('overall_score', 50),
        personality_type=data.get('personality_type', 'balanced_planner'),
        personality_description=data.get('personality_description', ''),

        factor_scores=data.get('factor_scores', []),

        monthly_income=data.get('monthly_income', 5000),
        monthly_expenses=data.get('monthly_expenses', 4000),
        total_debt=data.get('total_debt', 0),
        savings_rate=data.get('savings_rate', 10),
        emergency_fund_months=data.get('emergency_fund_months', 2),
        debt_to_income=data.get('debt_to_income', 30),

        overall_percentile=data.get('overall_percentile', 50),
        vs_age_percentile=data.get('vs_age_percentile', 50),
        vs_income_percentile=data.get('vs_income_percentile', 50),

        priority_factors=data.get('priority_factors', []),
        easy_wins=data.get('easy_wins', []),
        hard_changes=data.get('hard_changes', []),

        goal_path=data.get('goal_path', 'general_wellness'),
        goal_description=data.get('goal_description', 'Improve financial health'),
        target_months=data.get('target_months', 12),
        realistic_months=data.get('realistic_months', 18),
        feasibility_score=data.get('feasibility_score', 70),

        safe_path=data.get('safe_path', {}),
        aggressive_path=data.get('aggressive_path', {}),
        chosen_path=data.get('chosen_path', 'safe_steady'),

        milestones=data.get('milestones', []),
        contingencies=data.get('contingencies', [])
    )

    # Generate PDF
    generate_report(report_data, output_path)
    print(f"✓ Report generated: {output_path}")


if __name__ == '__main__':
    main()

"""
WealthClaude Financial Assessment - PDF Report Generator
Generates a 10-page KPMG-style professional financial report

Dependencies:
    pip install reportlab --break-system-packages
"""

import math
from datetime import datetime
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, 
    PageBreak, Image, KeepTogether, ListFlowable, ListItem,
    Flowable, HRFlowable
)
from reportlab.graphics.shapes import Drawing, Circle, Line, Polygon, String, Rect
from reportlab.graphics.charts.piecharts import Pie
from reportlab.graphics.charts.barcharts import VerticalBarChart, HorizontalBarChart
from reportlab.graphics import renderPDF
from reportlab.pdfgen import canvas


# =============================================================================
# COLOR PALETTE (Professional KPMG-style)
# =============================================================================

class Colors:
    PRIMARY = colors.HexColor('#10b981')      # Emerald green
    PRIMARY_DARK = colors.HexColor('#059669')
    PRIMARY_LIGHT = colors.HexColor('#d1fae5')
    
    SECONDARY = colors.HexColor('#3b82f6')    # Blue
    SECONDARY_LIGHT = colors.HexColor('#dbeafe')
    
    ACCENT = colors.HexColor('#8b5cf6')       # Purple
    WARNING = colors.HexColor('#f59e0b')      # Amber
    DANGER = colors.HexColor('#ef4444')       # Red
    
    TEXT_PRIMARY = colors.HexColor('#1e293b')
    TEXT_SECONDARY = colors.HexColor('#64748b')
    TEXT_MUTED = colors.HexColor('#94a3b8')
    
    BG_LIGHT = colors.HexColor('#f8fafc')
    BG_MEDIUM = colors.HexColor('#e2e8f0')
    BORDER = colors.HexColor('#cbd5e1')
    
    WHITE = colors.white
    BLACK = colors.black


# =============================================================================
# CUSTOM STYLES
# =============================================================================

def get_custom_styles():
    """Create custom paragraph styles for the report"""
    styles = getSampleStyleSheet()
    
    # Title styles
    styles.add(ParagraphStyle(
        name='ReportTitle',
        parent=styles['Title'],
        fontSize=28,
        textColor=Colors.TEXT_PRIMARY,
        spaceAfter=20,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    ))
    
    styles.add(ParagraphStyle(
        name='SectionTitle',
        parent=styles['Heading1'],
        fontSize=18,
        textColor=Colors.PRIMARY_DARK,
        spaceBefore=20,
        spaceAfter=12,
        fontName='Helvetica-Bold'
    ))
    
    styles.add(ParagraphStyle(
        name='SubsectionTitle',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=Colors.TEXT_PRIMARY,
        spaceBefore=15,
        spaceAfter=8,
        fontName='Helvetica-Bold'
    ))
    
    # Body styles
    styles.add(ParagraphStyle(
        name='ReportBody',
        parent=styles['Normal'],
        fontSize=10,
        textColor=Colors.TEXT_PRIMARY,
        leading=14,
        alignment=TA_JUSTIFY
    ))
    
    styles.add(ParagraphStyle(
        name='SmallText',
        parent=styles['Normal'],
        fontSize=8,
        textColor=Colors.TEXT_SECONDARY,
        leading=10
    ))
    
    styles.add(ParagraphStyle(
        name='Highlight',
        parent=styles['Normal'],
        fontSize=11,
        textColor=Colors.PRIMARY_DARK,
        fontName='Helvetica-Bold'
    ))
    
    styles.add(ParagraphStyle(
        name='ScoreDisplay',
        parent=styles['Normal'],
        fontSize=48,
        textColor=Colors.PRIMARY,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    ))
    
    styles.add(ParagraphStyle(
        name='MetricValue',
        parent=styles['Normal'],
        fontSize=24,
        textColor=Colors.TEXT_PRIMARY,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    ))
    
    styles.add(ParagraphStyle(
        name='MetricLabel',
        parent=styles['Normal'],
        fontSize=9,
        textColor=Colors.TEXT_SECONDARY,
        alignment=TA_CENTER
    ))
    
    styles.add(ParagraphStyle(
        name='CenterText',
        parent=styles['Normal'],
        fontSize=10,
        textColor=Colors.TEXT_PRIMARY,
        alignment=TA_CENTER
    ))
    
    styles.add(ParagraphStyle(
        name='Footer',
        parent=styles['Normal'],
        fontSize=8,
        textColor=Colors.TEXT_MUTED,
        alignment=TA_CENTER
    ))
    
    return styles


# =============================================================================
# CUSTOM FLOWABLES
# =============================================================================

class ScoreCircle(Flowable):
    """Draw a circular score indicator"""
    
    def __init__(self, score: int, size: float = 120, label: str = "Overall Score"):
        Flowable.__init__(self)
        self.score = score
        self.size = size
        self.label = label
        self.width = size
        self.height = size + 30
    
    def draw(self):
        c = self.canv
        cx = self.size / 2
        cy = self.size / 2 + 20
        radius = self.size / 2 - 10
        
        # Background circle
        c.setStrokeColor(Colors.BG_MEDIUM)
        c.setLineWidth(8)
        c.circle(cx, cy, radius)
        
        # Progress arc
        c.setStrokeColor(Colors.PRIMARY)
        c.setLineWidth(8)
        
        # Draw arc (simplified - full arc drawing would need path)
        angle = (self.score / 100) * 360
        c.arc(cx - radius, cy - radius, cx + radius, cy + radius, 90, -angle)
        
        # Score text
        c.setFillColor(Colors.TEXT_PRIMARY)
        c.setFont('Helvetica-Bold', 36)
        c.drawCentredString(cx, cy - 10, str(self.score))
        
        c.setFont('Helvetica', 10)
        c.setFillColor(Colors.TEXT_SECONDARY)
        c.drawCentredString(cx, cy - 30, "out of 100")
        
        # Label
        c.setFont('Helvetica', 10)
        c.drawCentredString(cx, 5, self.label)


class RadarChart(Flowable):
    """Draw a radar/spider chart for factor scores"""
    
    def __init__(self, factors: List[Dict], size: float = 250):
        Flowable.__init__(self)
        self.factors = factors
        self.size = size
        self.width = size
        self.height = size
    
    def draw(self):
        c = self.canv
        cx = self.size / 2
        cy = self.size / 2
        radius = self.size / 2 - 40
        n = len(self.factors)
        
        # Draw grid circles
        c.setStrokeColor(Colors.BG_MEDIUM)
        c.setLineWidth(0.5)
        for level in [0.2, 0.4, 0.6, 0.8, 1.0]:
            c.circle(cx, cy, radius * level)
        
        # Draw radial lines and labels
        angles = []
        for i, factor in enumerate(self.factors):
            angle = (2 * math.pi * i / n) - math.pi / 2
            angles.append(angle)
            
            # Radial line
            x2 = cx + radius * math.cos(angle)
            y2 = cy + radius * math.sin(angle)
            c.line(cx, cy, x2, y2)
            
            # Label
            lx = cx + (radius + 20) * math.cos(angle)
            ly = cy + (radius + 20) * math.sin(angle)
            c.setFont('Helvetica', 7)
            c.setFillColor(Colors.TEXT_SECONDARY)
            
            # Emoji/icon would be text here
            icon = factor.get('icon', '●')
            c.drawCentredString(lx, ly, icon)
        
        # Draw data polygon
        points = []
        for i, factor in enumerate(self.factors):
            score = factor.get('score', 50) / 100
            angle = angles[i]
            x = cx + radius * score * math.cos(angle)
            y = cy + radius * score * math.sin(angle)
            points.append((x, y))
        
        # Fill polygon
        if points:
            c.setFillColor(Colors.PRIMARY_LIGHT)
            c.setStrokeColor(Colors.PRIMARY)
            c.setLineWidth(2)
            
            path = c.beginPath()
            path.moveTo(points[0][0], points[0][1])
            for x, y in points[1:]:
                path.lineTo(x, y)
            path.close()
            c.drawPath(path, fill=1, stroke=1)
            
            # Draw points
            c.setFillColor(Colors.PRIMARY)
            for x, y in points:
                c.circle(x, y, 4, fill=1)


class MetricBox(Flowable):
    """Draw a metric box with value and label"""
    
    def __init__(self, value: str, label: str, sublabel: str = "", 
                 color: colors.Color = Colors.PRIMARY, width: float = 120):
        Flowable.__init__(self)
        self.value = value
        self.label = label
        self.sublabel = sublabel
        self.color = color
        self.width = width
        self.height = 80
    
    def draw(self):
        c = self.canv
        
        # Background
        c.setFillColor(Colors.BG_LIGHT)
        c.setStrokeColor(Colors.BORDER)
        c.roundRect(0, 0, self.width, self.height, 8, fill=1, stroke=1)
        
        # Value
        c.setFillColor(self.color)
        c.setFont('Helvetica-Bold', 24)
        c.drawCentredString(self.width / 2, 45, self.value)
        
        # Label
        c.setFillColor(Colors.TEXT_SECONDARY)
        c.setFont('Helvetica', 9)
        c.drawCentredString(self.width / 2, 25, self.label)
        
        # Sublabel
        if self.sublabel:
            c.setFont('Helvetica', 7)
            c.setFillColor(Colors.TEXT_MUTED)
            c.drawCentredString(self.width / 2, 12, self.sublabel)


class ProgressBar(Flowable):
    """Draw a horizontal progress bar"""
    
    def __init__(self, value: int, max_value: int = 100, 
                 width: float = 200, height: float = 12,
                 color: colors.Color = Colors.PRIMARY,
                 show_value: bool = True):
        Flowable.__init__(self)
        self.value = value
        self.max_value = max_value
        self.bar_width = width
        self.bar_height = height
        self.color = color
        self.show_value = show_value
        self.width = width + (40 if show_value else 0)
        self.height = height
    
    def draw(self):
        c = self.canv
        
        # Background
        c.setFillColor(Colors.BG_MEDIUM)
        c.roundRect(0, 0, self.bar_width, self.bar_height, 4, fill=1, stroke=0)
        
        # Progress
        progress_width = (self.value / self.max_value) * self.bar_width
        c.setFillColor(self.color)
        c.roundRect(0, 0, progress_width, self.bar_height, 4, fill=1, stroke=0)
        
        # Value text
        if self.show_value:
            c.setFillColor(Colors.TEXT_PRIMARY)
            c.setFont('Helvetica-Bold', 10)
            c.drawString(self.bar_width + 10, 2, str(self.value))


# =============================================================================
# REPORT DATA STRUCTURES
# =============================================================================

@dataclass
class ReportData:
    """Data structure for report generation"""
    # User info
    user_name: str
    user_age: int
    user_income_range: str
    report_date: datetime
    
    # Overall results
    overall_score: int
    personality_type: str
    personality_description: str
    
    # Factor scores
    factor_scores: List[Dict]  # [{id, name, score, icon, status, benchmark_diff}]
    
    # Financial metrics
    monthly_income: float
    monthly_expenses: float
    total_debt: float
    savings_rate: float
    emergency_fund_months: float
    debt_to_income: float
    
    # Rankings
    overall_percentile: int
    vs_age_percentile: int
    vs_income_percentile: int
    
    # Recommendations
    priority_factors: List[str]
    easy_wins: List[Dict]  # [{factor, tip}]
    hard_changes: List[Dict]
    
    # Goal & Plan
    goal_path: str
    goal_description: str
    target_months: int
    realistic_months: int
    feasibility_score: int
    
    # Two paths
    safe_path: Dict
    aggressive_path: Dict
    chosen_path: str
    
    # Milestones
    milestones: List[Dict]  # [{month, description, target}]
    
    # Contingencies
    contingencies: List[Dict]  # [{trigger, action}]


# =============================================================================
# PAGE HEADER/FOOTER
# =============================================================================

def add_page_number(canvas, doc):
    """Add page numbers and footer to each page"""
    canvas.saveState()
    
    # Footer line
    canvas.setStrokeColor(Colors.BORDER)
    canvas.setLineWidth(0.5)
    canvas.line(50, 40, letter[0] - 50, 40)
    
    # Page number
    canvas.setFont('Helvetica', 8)
    canvas.setFillColor(Colors.TEXT_MUTED)
    page_num = canvas.getPageNumber()
    canvas.drawCentredString(letter[0] / 2, 25, f"Page {page_num}")
    
    # Confidential notice
    canvas.drawString(50, 25, "CONFIDENTIAL")
    
    # WealthClaude branding
    canvas.drawRightString(letter[0] - 50, 25, "WealthClaude Financial Assessment")
    
    canvas.restoreState()


# =============================================================================
# REPORT SECTIONS
# =============================================================================

def create_cover_page(data: ReportData, styles) -> List:
    """Page 1: Cover page with executive summary"""
    elements = []
    
    # Spacer for visual balance
    elements.append(Spacer(1, 1.5 * inch))
    
    # Title
    elements.append(Paragraph("Financial Health Assessment", styles['ReportTitle']))
    elements.append(Paragraph("Comprehensive Analysis Report", styles['CenterText']))
    elements.append(Spacer(1, 0.5 * inch))
    
    # Score circle (centered)
    score_table = Table([[ScoreCircle(data.overall_score)]], 
                        colWidths=[6*inch])
    score_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    elements.append(score_table)
    elements.append(Spacer(1, 0.3 * inch))
    
    # Personality type
    elements.append(Paragraph(
        f"Your Money Personality: <b>{data.personality_type.replace('_', ' ').title()}</b>",
        styles['CenterText']
    ))
    elements.append(Spacer(1, 0.5 * inch))
    
    # Key metrics row
    metrics = [
        MetricBox(f"{data.overall_percentile}th", "Overall Rank", "percentile"),
        MetricBox(f"{data.savings_rate}%", "Savings Rate", "of income"),
        MetricBox(f"{data.emergency_fund_months:.1f}", "Emergency Fund", "months"),
        MetricBox(f"{data.debt_to_income}%", "Debt-to-Income", "ratio"),
    ]
    
    metrics_table = Table([metrics], colWidths=[1.4*inch] * 4)
    metrics_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    elements.append(metrics_table)
    elements.append(Spacer(1, 0.5 * inch))
    
    # User info box
    info_data = [
        ['Prepared For:', data.user_name],
        ['Report Date:', data.report_date.strftime('%B %d, %Y')],
        ['Age Group:', f"{data.user_age} years"],
        ['Income Bracket:', data.user_income_range],
    ]
    
    info_table = Table(info_data, colWidths=[1.5*inch, 3*inch])
    info_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), Colors.BG_LIGHT),
        ('TEXTCOLOR', (0, 0), (0, -1), Colors.TEXT_SECONDARY),
        ('TEXTCOLOR', (1, 0), (1, -1), Colors.TEXT_PRIMARY),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('PADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, Colors.BORDER),
    ]))
    elements.append(info_table)
    
    elements.append(PageBreak())
    return elements


def create_factor_breakdown(data: ReportData, styles) -> List:
    """Page 2: Factor Breakdown with radar chart"""
    elements = []
    
    elements.append(Paragraph("10-Factor Analysis", styles['SectionTitle']))
    elements.append(Paragraph(
        "Your financial health is measured across 10 key factors. "
        "Each score is compared to market benchmarks for your demographic.",
        styles['ReportBody']
    ))
    elements.append(Spacer(1, 0.3 * inch))
    
    # Radar chart (centered)
    radar = RadarChart(data.factor_scores, size=220)
    radar_table = Table([[radar]], colWidths=[6*inch])
    radar_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ]))
    elements.append(radar_table)
    elements.append(Spacer(1, 0.3 * inch))
    
    # Factor scores table
    elements.append(Paragraph("Detailed Factor Scores", styles['SubsectionTitle']))
    
    table_data = [['Factor', 'Score', 'Status', 'vs Market', 'Difficulty']]
    
    for factor in data.factor_scores:
        icon = factor.get('icon', '●')
        name = factor.get('name', '')
        score = factor.get('score', 0)
        status = factor.get('status', 'average').title()
        diff = factor.get('benchmark_diff', 0)
        difficulty = factor.get('difficulty', 'medium').title()
        
        diff_str = f"+{diff}" if diff > 0 else str(diff)
        
        table_data.append([
            f"{icon} {name}",
            str(score),
            status,
            diff_str,
            difficulty
        ])
    
    factor_table = Table(table_data, colWidths=[2.2*inch, 0.8*inch, 1*inch, 0.9*inch, 0.9*inch])
    factor_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), Colors.PRIMARY),
        ('TEXTCOLOR', (0, 0), (-1, 0), Colors.WHITE),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('PADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, Colors.BORDER),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [Colors.WHITE, Colors.BG_LIGHT]),
    ]))
    elements.append(factor_table)
    
    elements.append(PageBreak())
    return elements


def create_benchmark_comparison(data: ReportData, styles) -> List:
    """Page 3: Benchmark Comparison"""
    elements = []
    
    elements.append(Paragraph("Market Benchmark Comparison", styles['SectionTitle']))
    elements.append(Paragraph(
        "See how your financial metrics compare to others in your age group, "
        "income bracket, and the general population.",
        styles['ReportBody']
    ))
    elements.append(Spacer(1, 0.3 * inch))
    
    # Comparison metrics table
    elements.append(Paragraph("Your Numbers vs Market Average", styles['SubsectionTitle']))
    
    comparison_data = [
        ['Metric', 'You', 'Market Avg', 'Your Rank'],
        ['Monthly Income', f"${data.monthly_income:,.0f}", '$4,200', 
         f"Top {100 - data.vs_income_percentile}%" if data.vs_income_percentile > 50 else f"Bottom {data.vs_income_percentile}%"],
        ['Savings Rate', f"{data.savings_rate}%", '8%', 
         'Above Avg' if data.savings_rate > 8 else 'Below Avg'],
        ['Debt-to-Income', f"{data.debt_to_income}%", '36%',
         'Better' if data.debt_to_income < 36 else 'Worse'],
        ['Emergency Fund', f"{data.emergency_fund_months:.1f} mo", '2.1 mo',
         'Above Avg' if data.emergency_fund_months > 2.1 else 'Below Avg'],
        ['Total Debt', f"${data.total_debt:,.0f}", '$38,000',
         'Better' if data.total_debt < 38000 else 'Higher'],
    ]
    
    comp_table = Table(comparison_data, colWidths=[1.8*inch, 1.3*inch, 1.3*inch, 1.3*inch])
    comp_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), Colors.SECONDARY),
        ('TEXTCOLOR', (0, 0), (-1, 0), Colors.WHITE),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (1, 1), (1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
        ('PADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, Colors.BORDER),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [Colors.WHITE, Colors.BG_LIGHT]),
    ]))
    elements.append(comp_table)
    elements.append(Spacer(1, 0.4 * inch))
    
    # Percentile rankings
    elements.append(Paragraph("Your Percentile Rankings", styles['SubsectionTitle']))
    
    ranking_boxes = [
        MetricBox(f"{data.overall_percentile}th", "vs Everyone", "General Population", Colors.PRIMARY),
        MetricBox(f"{data.vs_age_percentile}th", "vs Age Group", f"Ages {data.user_age//10*10}-{data.user_age//10*10+9}", Colors.SECONDARY),
        MetricBox(f"{data.vs_income_percentile}th", "vs Income", data.user_income_range, Colors.ACCENT),
    ]
    
    ranking_table = Table([ranking_boxes], colWidths=[1.8*inch] * 3)
    ranking_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    elements.append(ranking_table)
    
    elements.append(PageBreak())
    return elements


def create_priority_matrix(data: ReportData, styles) -> List:
    """Page 4: Easy Wins vs Hard Changes"""
    elements = []
    
    elements.append(Paragraph("Priority Matrix", styles['SectionTitle']))
    elements.append(Paragraph(
        "Focus your efforts where they'll have the most impact. "
        "Start with Easy Wins to build momentum, then tackle Hard Changes for lasting improvement.",
        styles['ReportBody']
    ))
    elements.append(Spacer(1, 0.3 * inch))
    
    # Easy Wins section
    elements.append(Paragraph("🎯 Easy Wins (Start Here)", styles['SubsectionTitle']))
    elements.append(Paragraph(
        "These improvements are relatively easy to implement and will show quick results:",
        styles['ReportBody']
    ))
    elements.append(Spacer(1, 0.1 * inch))
    
    for win in data.easy_wins[:4]:
        elements.append(Paragraph(
            f"<b>{win['factor']}</b>: {win['tip']}",
            styles['ReportBody']
        ))
        elements.append(Spacer(1, 0.05 * inch))
    
    elements.append(Spacer(1, 0.3 * inch))
    
    # Hard Changes section
    elements.append(Paragraph("💪 Hard Changes (Long-term Focus)", styles['SubsectionTitle']))
    elements.append(Paragraph(
        "These require more effort but will transform your financial health:",
        styles['ReportBody']
    ))
    elements.append(Spacer(1, 0.1 * inch))
    
    for change in data.hard_changes[:4]:
        elements.append(Paragraph(
            f"<b>{change['factor']}</b>: {change['tip']}",
            styles['ReportBody']
        ))
        elements.append(Spacer(1, 0.05 * inch))
    
    elements.append(Spacer(1, 0.3 * inch))
    
    # Priority factors summary
    elements.append(Paragraph("Your Top 3 Priority Areas", styles['SubsectionTitle']))
    
    priority_data = [[f"#{i+1}", factor.replace('_', ' ').title()] 
                     for i, factor in enumerate(data.priority_factors[:3])]
    
    priority_table = Table(priority_data, colWidths=[0.5*inch, 4*inch])
    priority_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), Colors.PRIMARY),
        ('TEXTCOLOR', (0, 0), (0, -1), Colors.WHITE),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('PADDING', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 0.5, Colors.BORDER),
    ]))
    elements.append(priority_table)
    
    elements.append(PageBreak())
    return elements


def create_timeline_analysis(data: ReportData, styles) -> List:
    """Page 5: Timeline Feasibility Analysis"""
    elements = []
    
    elements.append(Paragraph("Timeline Feasibility Analysis", styles['SectionTitle']))
    elements.append(Paragraph(
        f"Your goal: <b>{data.goal_description}</b>",
        styles['ReportBody']
    ))
    elements.append(Spacer(1, 0.3 * inch))
    
    # Feasibility score
    feasibility_color = Colors.PRIMARY if data.feasibility_score >= 70 else \
                        Colors.WARNING if data.feasibility_score >= 40 else Colors.DANGER
    
    feasibility_box = MetricBox(
        f"{data.feasibility_score}%", 
        "Feasibility Score",
        "Likelihood of success",
        feasibility_color,
        width=150
    )
    
    feas_table = Table([[feasibility_box]], colWidths=[6*inch])
    feas_table.setStyle(TableStyle([('ALIGN', (0, 0), (-1, -1), 'CENTER')]))
    elements.append(feas_table)
    elements.append(Spacer(1, 0.3 * inch))
    
    # Timeline comparison
    elements.append(Paragraph("Timeline Comparison", styles['SubsectionTitle']))
    
    timeline_data = [
        ['', 'Your Target', 'Realistic Estimate', 'Difference'],
        ['Timeline', f"{data.target_months} months", f"{data.realistic_months} months", 
         f"{data.target_months - data.realistic_months:+d} months"],
        ['End Date', 
         (datetime.now().replace(day=1) + 
          __import__('datetime').timedelta(days=data.target_months*30)).strftime('%b %Y'),
         (datetime.now().replace(day=1) + 
          __import__('datetime').timedelta(days=data.realistic_months*30)).strftime('%b %Y'),
         '-'],
    ]
    
    timeline_table = Table(timeline_data, colWidths=[1.2*inch, 1.5*inch, 1.5*inch, 1.2*inch])
    timeline_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), Colors.SECONDARY),
        ('TEXTCOLOR', (0, 0), (-1, 0), Colors.WHITE),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
        ('PADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, Colors.BORDER),
    ]))
    elements.append(timeline_table)
    elements.append(Spacer(1, 0.3 * inch))
    
    # Key assumptions
    elements.append(Paragraph("Key Assumptions", styles['SubsectionTitle']))
    assumptions = [
        "Your income remains stable throughout the plan",
        "No major unexpected expenses occur",
        "Interest rates remain constant",
        "You maintain the committed monthly payment"
    ]
    for assumption in assumptions:
        elements.append(Paragraph(f"• {assumption}", styles['ReportBody']))
    
    elements.append(PageBreak())
    return elements


def create_path_comparison(data: ReportData, styles) -> List:
    """Page 6: Two Paths Compared"""
    elements = []
    
    elements.append(Paragraph("Two Paths Compared", styles['SectionTitle']))
    elements.append(Paragraph(
        "Compare the Safe & Steady approach with the Fast & Aggressive option. "
        "Each has trade-offs - choose what fits your lifestyle.",
        styles['ReportBody']
    ))
    elements.append(Spacer(1, 0.3 * inch))
    
    safe = data.safe_path
    aggressive = data.aggressive_path
    
    # Comparison table
    comparison_data = [
        ['Metric', '🛡️ Safe & Steady', '⚡ Fast & Aggressive'],
        ['Timeline', f"{safe['timeline_months']} months", f"{aggressive['timeline_months']} months"],
        ['Monthly Payment', f"${safe['monthly_payment']:,.0f}", f"${aggressive['monthly_payment']:,.0f}"],
        ['Total Cost', f"${safe['total_cost']:,.0f}", f"${aggressive['total_cost']:,.0f}"],
        ['Interest Saved', f"${safe['interest_saved']:,.0f}", f"${aggressive['interest_saved']:,.0f}"],
        ['Lifestyle Impact', safe['lifestyle_impact'].title(), aggressive['lifestyle_impact'].title()],
        ['Risk Level', safe['risk_level'].title(), aggressive['risk_level'].title()],
    ]
    
    comp_table = Table(comparison_data, colWidths=[1.8*inch, 2*inch, 2*inch])
    comp_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), Colors.TEXT_PRIMARY),
        ('BACKGROUND', (1, 0), (1, 0), Colors.SECONDARY),
        ('BACKGROUND', (2, 0), (2, 0), Colors.WARNING),
        ('TEXTCOLOR', (0, 0), (-1, 0), Colors.WHITE),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
        ('PADDING', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 0.5, Colors.BORDER),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [Colors.WHITE, Colors.BG_LIGHT]),
    ]))
    elements.append(comp_table)
    elements.append(Spacer(1, 0.3 * inch))
    
    # Pros and cons
    elements.append(Paragraph("Safe & Steady - Pros", styles['SubsectionTitle']))
    for pro in safe.get('pros', [])[:3]:
        elements.append(Paragraph(f"✓ {pro}", styles['ReportBody']))
    
    elements.append(Spacer(1, 0.2 * inch))
    elements.append(Paragraph("Fast & Aggressive - Pros", styles['SubsectionTitle']))
    for pro in aggressive.get('pros', [])[:3]:
        elements.append(Paragraph(f"✓ {pro}", styles['ReportBody']))
    
    elements.append(Spacer(1, 0.3 * inch))
    
    # Your choice
    chosen = "Safe & Steady" if data.chosen_path == 'safe_steady' else "Fast & Aggressive"
    elements.append(Paragraph(
        f"<b>Your Selected Path: {chosen}</b>",
        styles['Highlight']
    ))
    
    elements.append(PageBreak())
    return elements


def create_detailed_plan(data: ReportData, styles) -> List:
    """Page 7: Chosen Path Detailed Plan"""
    elements = []
    
    chosen_path = data.safe_path if data.chosen_path == 'safe_steady' else data.aggressive_path
    path_name = "Safe & Steady" if data.chosen_path == 'safe_steady' else "Fast & Aggressive"
    
    elements.append(Paragraph(f"Your {path_name} Plan", styles['SectionTitle']))
    elements.append(Paragraph(
        f"Detailed breakdown of your {chosen_path['timeline_months']}-month plan "
        f"to achieve {data.goal_description.lower()}.",
        styles['ReportBody']
    ))
    elements.append(Spacer(1, 0.3 * inch))
    
    # Key metrics
    metrics = [
        MetricBox(f"${chosen_path['monthly_payment']:,.0f}", "Monthly Payment", "required"),
        MetricBox(f"{chosen_path['timeline_months']}", "Months", "to goal"),
        MetricBox(f"${chosen_path['total_cost']:,.0f}", "Total Cost", "overall"),
    ]
    
    metrics_table = Table([metrics], colWidths=[1.8*inch] * 3)
    metrics_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ]))
    elements.append(metrics_table)
    elements.append(Spacer(1, 0.3 * inch))
    
    # Monthly breakdown (first 6 months)
    elements.append(Paragraph("Monthly Breakdown (First 6 Months)", styles['SubsectionTitle']))
    
    breakdown_data = [['Month', 'Payment', 'Remaining', 'Progress']]
    monthly = chosen_path.get('monthly_breakdown', [])
    
    for m in monthly[:6]:
        breakdown_data.append([
            f"Month {m['month']}",
            f"${m['payment']:,.0f}",
            f"${m['remaining_debt']:,.0f}",
            f"{m['percent_complete']}%"
        ])
    
    breakdown_table = Table(breakdown_data, colWidths=[1.2*inch, 1.2*inch, 1.5*inch, 1*inch])
    breakdown_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), Colors.PRIMARY),
        ('TEXTCOLOR', (0, 0), (-1, 0), Colors.WHITE),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
        ('PADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, Colors.BORDER),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [Colors.WHITE, Colors.BG_LIGHT]),
    ]))
    elements.append(breakdown_table)
    elements.append(Spacer(1, 0.3 * inch))
    
    # Weekly actions
    elements.append(Paragraph("First Month Actions", styles['SubsectionTitle']))
    weekly_actions = chosen_path.get('weekly_actions', [
        {'week': 1, 'action': 'Set up automatic payment transfers'},
        {'week': 1, 'action': 'List all debts with interest rates'},
        {'week': 2, 'action': 'Review and reduce subscriptions'},
        {'week': 3, 'action': 'Make first planned payment'},
        {'week': 4, 'action': 'Review progress and adjust if needed'},
    ])
    
    for action in weekly_actions[:5]:
        elements.append(Paragraph(
            f"Week {action['week']}: {action['action']}",
            styles['ReportBody']
        ))
    
    elements.append(PageBreak())
    return elements


def create_milestones(data: ReportData, styles) -> List:
    """Page 8: Milestones & Checkpoints"""
    elements = []
    
    elements.append(Paragraph("Milestones & Checkpoints", styles['SectionTitle']))
    elements.append(Paragraph(
        "Track your progress with these key milestones. "
        "Celebrate each one - they mark real progress toward your goal!",
        styles['ReportBody']
    ))
    elements.append(Spacer(1, 0.3 * inch))
    
    # Milestones table
    milestone_data = [['Month', 'Milestone', 'Target', 'Status']]
    
    for milestone in data.milestones:
        milestone_data.append([
            f"Month {milestone['month']}",
            milestone['description'],
            milestone.get('target', '-'),
            '⏳ Pending'
        ])
    
    milestone_table = Table(milestone_data, colWidths=[1*inch, 2.5*inch, 1.5*inch, 0.8*inch])
    milestone_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), Colors.ACCENT),
        ('TEXTCOLOR', (0, 0), (-1, 0), Colors.WHITE),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('ALIGN', (3, 0), (3, -1), 'CENTER'),
        ('PADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, Colors.BORDER),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [Colors.WHITE, Colors.BG_LIGHT]),
    ]))
    elements.append(milestone_table)
    elements.append(Spacer(1, 0.4 * inch))
    
    # Progress tracking tips
    elements.append(Paragraph("Progress Tracking Tips", styles['SubsectionTitle']))
    tips = [
        "Schedule monthly 'money dates' to review your progress",
        "Update your tracking spreadsheet after each payment",
        "Celebrate milestones - even small wins matter!",
        "If you miss a target, don't give up - adjust and continue",
        "Share your progress with an accountability partner"
    ]
    
    for tip in tips:
        elements.append(Paragraph(f"• {tip}", styles['ReportBody']))
    
    elements.append(PageBreak())
    return elements


def create_contingencies(data: ReportData, styles) -> List:
    """Page 9: Warning Signs & Contingency Plans"""
    elements = []
    
    elements.append(Paragraph("Warning Signs & Contingency Plans", styles['SectionTitle']))
    elements.append(Paragraph(
        "Life happens. Here's what to do when things don't go as planned. "
        "Having a backup plan keeps you on track even during setbacks.",
        styles['ReportBody']
    ))
    elements.append(Spacer(1, 0.3 * inch))
    
    # Contingency table
    contingency_data = [['⚠️ If This Happens...', '✓ Do This']]
    
    for contingency in data.contingencies:
        contingency_data.append([
            contingency['trigger'],
            contingency['action']
        ])
    
    contingency_table = Table(contingency_data, colWidths=[2.8*inch, 3*inch])
    contingency_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), Colors.WARNING),
        ('TEXTCOLOR', (0, 0), (-1, 0), Colors.WHITE),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('PADDING', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 0.5, Colors.BORDER),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [Colors.WHITE, Colors.BG_LIGHT]),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    elements.append(contingency_table)
    elements.append(Spacer(1, 0.4 * inch))
    
    # Warning signs
    elements.append(Paragraph("Watch For These Warning Signs", styles['SubsectionTitle']))
    warnings = [
        "Missing 2+ consecutive monthly payments",
        "Emergency fund drops below 1 month of expenses",
        "Taking on new debt while paying off existing debt",
        "Feeling stressed or anxious about the plan consistently",
        "Major life changes (job loss, health issues, family changes)"
    ]
    
    for warning in warnings:
        elements.append(Paragraph(f"⚡ {warning}", styles['ReportBody']))
    
    elements.append(Spacer(1, 0.3 * inch))
    elements.append(Paragraph(
        "<b>Remember:</b> If you hit a major roadblock, it's okay to pause and reassess. "
        "A revised realistic plan is better than an abandoned aggressive one.",
        styles['ReportBody']
    ))
    
    elements.append(PageBreak())
    return elements


def create_next_steps(data: ReportData, styles) -> List:
    """Page 10: Next Steps & Follow-Up"""
    elements = []
    
    elements.append(Paragraph("Next Steps & Follow-Up", styles['SectionTitle']))
    elements.append(Paragraph(
        "Your financial transformation starts now. Here's your action plan for the next 30, 90, and 365 days.",
        styles['ReportBody']
    ))
    elements.append(Spacer(1, 0.3 * inch))
    
    # 30-day actions
    elements.append(Paragraph("📅 Next 30 Days", styles['SubsectionTitle']))
    thirty_day_actions = [
        "Set up automatic payment transfers from your paycheck",
        "Create or update your budget with the new payment amounts",
        "Open a dedicated savings account for your emergency fund",
        "Cancel 2-3 subscriptions you don't actively use",
        "Make your first planned payment"
    ]
    
    for i, action in enumerate(thirty_day_actions, 1):
        elements.append(Paragraph(f"  {i}. {action}", styles['ReportBody']))
    
    elements.append(Spacer(1, 0.2 * inch))
    
    # 90-day goals
    elements.append(Paragraph("📊 90-Day Goals", styles['SubsectionTitle']))
    ninety_day_goals = [
        "Complete 3 consecutive monthly payments",
        "Build your emergency fund to at least 1 month of expenses",
        "Reduce one major expense category by 10%",
        "Review and refinance any high-interest debt"
    ]
    
    for goal in ninety_day_goals:
        elements.append(Paragraph(f"  ☐ {goal}", styles['ReportBody']))
    
    elements.append(Spacer(1, 0.2 * inch))
    
    # 12-month targets
    elements.append(Paragraph("🎯 12-Month Targets", styles['SubsectionTitle']))
    twelve_month = [
        f"Reach {min(50, data.target_months // 2 * 100 // data.target_months)}% of your goal",
        "Increase your savings rate by at least 5%",
        "Build emergency fund to 3+ months",
        "Start or increase retirement contributions"
    ]
    
    for target in twelve_month:
        elements.append(Paragraph(f"  ☐ {target}", styles['ReportBody']))
    
    elements.append(Spacer(1, 0.4 * inch))
    
    # Check-in reminder
    check_in_date = (datetime.now() + __import__('datetime').timedelta(days=30)).strftime('%B %d, %Y')
    elements.append(Paragraph("📆 Your Next Check-In", styles['SubsectionTitle']))
    elements.append(Paragraph(
        f"Schedule your first progress review for <b>{check_in_date}</b>. "
        "Log back into WealthClaude to update your progress and get refreshed recommendations.",
        styles['ReportBody']
    ))
    
    elements.append(Spacer(1, 0.4 * inch))
    
    # Closing message
    elements.append(HRFlowable(width="100%", thickness=1, color=Colors.BORDER))
    elements.append(Spacer(1, 0.2 * inch))
    elements.append(Paragraph(
        "<i>This report was generated by WealthClaude's AI-powered financial assessment system. "
        "For personalized advice, consult with a licensed financial advisor.</i>",
        styles['SmallText']
    ))
    elements.append(Spacer(1, 0.1 * inch))
    elements.append(Paragraph(
        "© 2025 WealthClaude. All rights reserved.",
        styles['Footer']
    ))
    
    return elements


# =============================================================================
# MAIN REPORT GENERATOR
# =============================================================================

def generate_report(data: ReportData, output_path: str = None) -> bytes:
    """
    Generate the complete 10-page PDF report.
    
    Args:
        data: ReportData object with all assessment results
        output_path: Optional file path to save PDF (if None, returns bytes)
    
    Returns:
        PDF as bytes if output_path is None, otherwise None
    """
    
    # Create buffer or file
    if output_path:
        doc = SimpleDocTemplate(
            output_path,
            pagesize=letter,
            rightMargin=50,
            leftMargin=50,
            topMargin=50,
            bottomMargin=60
        )
        buffer = None
    else:
        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=50,
            leftMargin=50,
            topMargin=50,
            bottomMargin=60
        )
    
    # Get styles
    styles = get_custom_styles()
    
    # Build story (all pages)
    story = []
    
    # Page 1: Cover / Executive Summary
    story.extend(create_cover_page(data, styles))
    
    # Page 2: Factor Breakdown
    story.extend(create_factor_breakdown(data, styles))
    
    # Page 3: Benchmark Comparison
    story.extend(create_benchmark_comparison(data, styles))
    
    # Page 4: Easy Wins vs Hard Changes
    story.extend(create_priority_matrix(data, styles))
    
    # Page 5: Timeline Feasibility
    story.extend(create_timeline_analysis(data, styles))
    
    # Page 6: Two Paths Compared
    story.extend(create_path_comparison(data, styles))
    
    # Page 7: Chosen Path Detailed Plan
    story.extend(create_detailed_plan(data, styles))
    
    # Page 8: Milestones
    story.extend(create_milestones(data, styles))
    
    # Page 9: Contingencies
    story.extend(create_contingencies(data, styles))
    
    # Page 10: Next Steps
    story.extend(create_next_steps(data, styles))
    
    # Build PDF
    doc.build(story, onFirstPage=add_page_number, onLaterPages=add_page_number)
    
    if buffer:
        buffer.seek(0)
        return buffer.getvalue()
    
    return None


# =============================================================================
# HELPER: Create ReportData from Assessment Result
# =============================================================================

def create_report_data_from_assessment(assessment_result: Dict, plan: Dict, user_name: str = "User") -> ReportData:
    """
    Convert assessment result and plan into ReportData for PDF generation.
    
    Args:
        assessment_result: Dictionary from calculateAssessment()
        plan: Dictionary from generateFinancialPlan()
        user_name: User's display name
    
    Returns:
        ReportData object ready for PDF generation
    """
    
    # Extract factor scores
    factor_scores = []
    factor_icons = {
        'savings_discipline': '💰',
        'debt_management': '📊',
        'financial_planning': '🎯',
        'spending_control': '🛒',
        'investment_readiness': '📈',
        'risk_tolerance': '🛡️',
        'financial_literacy': '🧠',
        'emergency_preparedness': '⚡',
        'future_orientation': '🔮',
        'money_wellness': '😌'
    }
    
    factor_names = {
        'savings_discipline': 'Savings Discipline',
        'debt_management': 'Debt Management',
        'financial_planning': 'Financial Planning',
        'spending_control': 'Spending Control',
        'investment_readiness': 'Investment Readiness',
        'risk_tolerance': 'Risk Tolerance',
        'financial_literacy': 'Financial Literacy',
        'emergency_preparedness': 'Emergency Preparedness',
        'future_orientation': 'Future Orientation',
        'money_wellness': 'Money Wellness'
    }
    
    for fs in assessment_result.get('factorScores', []):
        factor_id = fs.get('factorId', '')
        factor_scores.append({
            'id': factor_id,
            'name': factor_names.get(factor_id, factor_id),
            'icon': factor_icons.get(factor_id, '●'),
            'score': fs.get('score', 50),
            'status': fs.get('status', 'average'),
            'benchmark_diff': fs.get('benchmarkComparison', {}).get('vsGeneral', 0),
            'difficulty': 'medium'  # Would come from factors definition
        })
    
    # Extract financial metrics
    metrics = assessment_result.get('financialMetrics', {})
    
    # Extract easy wins and hard changes
    easy_wins = []
    hard_changes = []
    
    easy_factor_ids = assessment_result.get('easyWins', [])
    hard_factor_ids = assessment_result.get('hardChanges', [])
    
    tips = {
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
    }
    
    for fid in easy_factor_ids:
        easy_wins.append({
            'factor': factor_names.get(fid, fid),
            'tip': tips.get(fid, 'Focus on improving this area')
        })
    
    for fid in hard_factor_ids:
        hard_changes.append({
            'factor': factor_names.get(fid, fid),
            'tip': tips.get(fid, 'This requires sustained effort')
        })
    
    # Extract plan data
    safe_path = plan.get('safePath', {})
    aggressive_path = plan.get('aggressivePath', {})
    timeline = plan.get('timelineValidation', {})
    
    # Build milestones
    milestones = plan.get('checkpoints', [])
    if not milestones:
        milestones = [
            {'month': 1, 'description': 'First payment complete', 'target': '100%'},
            {'month': 3, 'description': 'Quarter 1 milestone', 'target': '25%'},
            {'month': 6, 'description': 'Halfway checkpoint', 'target': '50%'},
            {'month': 9, 'description': 'Quarter 3 milestone', 'target': '75%'},
            {'month': 12, 'description': 'Year 1 complete', 'target': '100%'}
        ]
    
    # Build contingencies
    contingencies = plan.get('contingencyPlans', [])
    if not contingencies:
        contingencies = [
            {'trigger': 'Miss a monthly payment', 'action': 'Make it up within 2 weeks'},
            {'trigger': 'Unexpected expense ($500+)', 'action': 'Pause extra payments for 1 month'},
            {'trigger': 'Income reduction', 'action': 'Switch to minimum payments'},
            {'trigger': 'Falling behind 2+ months', 'action': 'Reassess and adjust timeline'}
        ]
    
    return ReportData(
        user_name=user_name,
        user_age=30,  # Would come from user profile
        user_income_range='$50,000 - $75,000',
        report_date=datetime.now(),
        
        overall_score=assessment_result.get('overallScore', 50),
        personality_type=assessment_result.get('personalityType', 'balanced_planner'),
        personality_description="Your money personality description here.",
        
        factor_scores=factor_scores,
        
        monthly_income=metrics.get('monthlyIncome', 5000),
        monthly_expenses=metrics.get('monthlyExpenses', 4000),
        total_debt=metrics.get('totalDebt', 15000),
        savings_rate=metrics.get('savingsRate', 12),
        emergency_fund_months=metrics.get('emergencyFundMonths', 2.5),
        debt_to_income=metrics.get('debtToIncomeRatio', 28),
        
        overall_percentile=assessment_result.get('rankings', {}).get('overallPercentile', 55),
        vs_age_percentile=assessment_result.get('rankings', {}).get('vsAgeGroup', 60),
        vs_income_percentile=assessment_result.get('rankings', {}).get('vsIncomeGroup', 52),
        
        priority_factors=assessment_result.get('priorityFactors', []),
        easy_wins=easy_wins,
        hard_changes=hard_changes,
        
        goal_path=plan.get('goalPath', 'general_wellness'),
        goal_description=plan.get('goalDescription', 'Improve financial health'),
        target_months=timeline.get('requestedMonths', 12),
        realistic_months=timeline.get('realisticMonths', 18),
        feasibility_score=timeline.get('feasibilityScore', 70),
        
        safe_path={
            'timeline_months': safe_path.get('timelineMonths', 24),
            'monthly_payment': safe_path.get('monthlyPayment', 500),
            'total_cost': safe_path.get('totalCost', 12000),
            'interest_saved': safe_path.get('interestSaved', 0),
            'lifestyle_impact': safe_path.get('lifestyleImpact', 'minimal'),
            'risk_level': safe_path.get('riskLevel', 'low'),
            'pros': safe_path.get('pros', ['Room for unexpected expenses', 'Less stressful']),
            'cons': safe_path.get('cons', ['Takes longer']),
            'monthly_breakdown': safe_path.get('monthlyBreakdown', []),
            'weekly_actions': safe_path.get('weeklyActions', [])
        },
        aggressive_path={
            'timeline_months': aggressive_path.get('timelineMonths', 12),
            'monthly_payment': aggressive_path.get('monthlyPayment', 1000),
            'total_cost': aggressive_path.get('totalCost', 12000),
            'interest_saved': aggressive_path.get('interestSaved', 1500),
            'lifestyle_impact': aggressive_path.get('lifestyleImpact', 'significant'),
            'risk_level': aggressive_path.get('riskLevel', 'high'),
            'pros': aggressive_path.get('pros', ['Faster goal achievement', 'Save on interest']),
            'cons': aggressive_path.get('cons', ['Tight budget required']),
            'monthly_breakdown': aggressive_path.get('monthlyBreakdown', []),
            'weekly_actions': aggressive_path.get('weeklyActions', [])
        },
        chosen_path=plan.get('chosenPath', 'safe_steady'),
        
        milestones=milestones,
        contingencies=contingencies
    )


# =============================================================================
# CLI USAGE
# =============================================================================

if __name__ == '__main__':
    # Example usage with sample data
    sample_data = ReportData(
        user_name="John Smith",
        user_age=32,
        user_income_range="$50,000 - $75,000",
        report_date=datetime.now(),
        
        overall_score=67,
        personality_type="balanced_planner",
        personality_description="You take a measured approach to money, balancing enjoyment today with planning for tomorrow.",
        
        factor_scores=[
            {'id': 'savings_discipline', 'name': 'Savings Discipline', 'icon': '💰', 'score': 72, 'status': 'good', 'benchmark_diff': 8, 'difficulty': 'medium'},
            {'id': 'debt_management', 'name': 'Debt Management', 'icon': '📊', 'score': 55, 'status': 'average', 'benchmark_diff': -3, 'difficulty': 'hard'},
            {'id': 'financial_planning', 'name': 'Financial Planning', 'icon': '🎯', 'score': 68, 'status': 'good', 'benchmark_diff': 12, 'difficulty': 'easy'},
            {'id': 'spending_control', 'name': 'Spending Control', 'icon': '🛒', 'score': 61, 'status': 'average', 'benchmark_diff': 5, 'difficulty': 'medium'},
            {'id': 'investment_readiness', 'name': 'Investment Readiness', 'icon': '📈', 'score': 78, 'status': 'good', 'benchmark_diff': 18, 'difficulty': 'medium'},
            {'id': 'risk_tolerance', 'name': 'Risk Tolerance', 'icon': '🛡️', 'score': 65, 'status': 'good', 'benchmark_diff': 5, 'difficulty': 'hard'},
            {'id': 'financial_literacy', 'name': 'Financial Literacy', 'icon': '🧠', 'score': 82, 'status': 'excellent', 'benchmark_diff': 22, 'difficulty': 'easy'},
            {'id': 'emergency_preparedness', 'name': 'Emergency Prep', 'icon': '⚡', 'score': 48, 'status': 'average', 'benchmark_diff': -5, 'difficulty': 'medium'},
            {'id': 'future_orientation', 'name': 'Future Orientation', 'icon': '🔮', 'score': 71, 'status': 'good', 'benchmark_diff': 11, 'difficulty': 'medium'},
            {'id': 'money_wellness', 'name': 'Money Wellness', 'icon': '😌', 'score': 58, 'status': 'average', 'benchmark_diff': 2, 'difficulty': 'hard'},
        ],
        
        monthly_income=5500,
        monthly_expenses=4200,
        total_debt=18000,
        savings_rate=14,
        emergency_fund_months=2.3,
        debt_to_income=32,
        
        overall_percentile=62,
        vs_age_percentile=58,
        vs_income_percentile=65,
        
        priority_factors=['emergency_preparedness', 'debt_management', 'money_wellness'],
        easy_wins=[
            {'factor': 'Financial Planning', 'tip': 'Start with a simple 50/30/20 budget'},
            {'factor': 'Financial Literacy', 'tip': 'Read one personal finance book this month'},
        ],
        hard_changes=[
            {'factor': 'Debt Management', 'tip': 'List all debts and attack highest interest first'},
            {'factor': 'Money Wellness', 'tip': 'Address money anxiety with weekly check-ins'},
        ],
        
        goal_path='debt_freedom',
        goal_description='Become debt-free',
        target_months=18,
        realistic_months=24,
        feasibility_score=72,
        
        safe_path={
            'timeline_months': 28,
            'monthly_payment': 650,
            'total_cost': 18200,
            'interest_saved': 0,
            'lifestyle_impact': 'minimal',
            'risk_level': 'low',
            'pros': ['Room for unexpected expenses', 'Less stressful', 'Keeps emergency fund intact'],
            'cons': ['Takes longer', 'More interest paid'],
            'monthly_breakdown': [
                {'month': 1, 'payment': 650, 'remaining_debt': 17350, 'percent_complete': 4},
                {'month': 2, 'payment': 650, 'remaining_debt': 16700, 'percent_complete': 7},
                {'month': 3, 'payment': 650, 'remaining_debt': 16050, 'percent_complete': 11},
                {'month': 4, 'payment': 650, 'remaining_debt': 15400, 'percent_complete': 14},
                {'month': 5, 'payment': 650, 'remaining_debt': 14750, 'percent_complete': 18},
                {'month': 6, 'payment': 650, 'remaining_debt': 14100, 'percent_complete': 22},
            ],
            'weekly_actions': []
        },
        aggressive_path={
            'timeline_months': 15,
            'monthly_payment': 1200,
            'total_cost': 18000,
            'interest_saved': 1800,
            'lifestyle_impact': 'significant',
            'risk_level': 'high',
            'pros': ['Faster freedom', 'Save on interest', 'Build momentum'],
            'cons': ['Tight budget', 'No room for errors', 'May use emergency fund'],
            'monthly_breakdown': [
                {'month': 1, 'payment': 1200, 'remaining_debt': 16800, 'percent_complete': 7},
                {'month': 2, 'payment': 1200, 'remaining_debt': 15600, 'percent_complete': 13},
                {'month': 3, 'payment': 1200, 'remaining_debt': 14400, 'percent_complete': 20},
                {'month': 4, 'payment': 1200, 'remaining_debt': 13200, 'percent_complete': 27},
                {'month': 5, 'payment': 1200, 'remaining_debt': 12000, 'percent_complete': 33},
                {'month': 6, 'payment': 1200, 'remaining_debt': 10800, 'percent_complete': 40},
            ],
            'weekly_actions': []
        },
        chosen_path='safe_steady',
        
        milestones=[
            {'month': 1, 'description': 'First payment complete', 'target': '4%'},
            {'month': 3, 'description': 'Quarter 1 - 10% paid', 'target': '10%'},
            {'month': 6, 'description': 'Halfway to halfway!', 'target': '22%'},
            {'month': 9, 'description': 'One-third complete', 'target': '33%'},
            {'month': 12, 'description': 'Year 1 milestone', 'target': '44%'},
            {'month': 18, 'description': '18-month checkpoint', 'target': '66%'},
            {'month': 24, 'description': 'Almost there!', 'target': '88%'},
            {'month': 28, 'description': 'DEBT FREE! 🎉', 'target': '100%'},
        ],
        
        contingencies=[
            {'trigger': 'Miss a monthly payment', 'action': 'Make it up within 2 weeks by reducing discretionary spending'},
            {'trigger': 'Unexpected expense ($500+)', 'action': 'Pause extra payments for 1 month, cover expense, resume'},
            {'trigger': 'Income reduction (job loss)', 'action': 'Switch to minimum payments immediately'},
            {'trigger': 'Falling behind by 2+ months', 'action': 'Schedule plan reassessment with new timeline'},
            {'trigger': 'Interest rate increase', 'action': 'Look into debt consolidation or balance transfer'},
        ]
    )
    
    # Generate PDF
    output_file = '/home/claude/wealthclaude-assessment/sample_report.pdf'
    generate_report(sample_data, output_file)
    print(f"✓ Report generated: {output_file}")

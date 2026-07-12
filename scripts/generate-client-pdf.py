#!/usr/bin/env python3
"""
Generate a beautifully designed client PDF report.
Uses reportlab for professional document generation.
"""

import os
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch, cm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, Image, KeepTogether, HRFlowable
)
from reportlab.graphics.shapes import Drawing, Rect, String, Circle
from reportlab.graphics.charts.piecharts import Pie
from reportlab.graphics.charts.barcharts import VerticalBarChart
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from datetime import datetime

OUTPUT_DIR = "output/pdf"
os.makedirs(OUTPUT_DIR, exist_ok=True)
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "IndoAsian_DC_Image_Mapping_Report.pdf")

# Brand colors
PRIMARY_GREEN = colors.HexColor("#1B5E20")
ACCENT_ORANGE = colors.HexColor("#E65100")
DARK_GREY = colors.HexColor("#212121")
LIGHT_GREY = colors.HexColor("#F5F5F5")
MEDIUM_GREY = colors.HexColor("#757575")
WHITE = colors.white
CHART_BLUE = colors.HexColor("#1976D2")
CHART_GREEN = colors.HexColor("#388E3C")
CHART_ORANGE = colors.HexColor("#F57C00")
CHART_RED = colors.HexColor("#D32F2F")
CHART_PURPLE = colors.HexColor("#7B1FA2")
CHART_TEAL = colors.HexColor("#00796B")

# Page dimensions
PAGE_WIDTH, PAGE_HEIGHT = A4
MARGIN = 1.5 * cm


def create_styles():
    """Create all paragraph styles."""
    styles = getSampleStyleSheet()
    
    styles.add(ParagraphStyle(
        name='CoverTitle',
        fontSize=36,
        leading=44,
        textColor=PRIMARY_GREEN,
        alignment=TA_CENTER,
        spaceAfter=20,
        fontName='Helvetica-Bold'
    ))
    
    styles.add(ParagraphStyle(
        name='CoverSubtitle',
        fontSize=16,
        leading=22,
        textColor=MEDIUM_GREY,
        alignment=TA_CENTER,
        spaceAfter=40,
        fontName='Helvetica'
    ))
    
    styles.add(ParagraphStyle(
        name='SectionTitle',
        fontSize=20,
        leading=26,
        textColor=PRIMARY_GREEN,
        spaceBefore=30,
        spaceAfter=16,
        fontName='Helvetica-Bold',
        borderPadding=5,
    ))
    
    styles.add(ParagraphStyle(
        name='SubSectionTitle',
        fontSize=14,
        leading=20,
        textColor=DARK_GREY,
        spaceBefore=20,
        spaceAfter=10,
        fontName='Helvetica-Bold'
    ))
    
    styles.add(ParagraphStyle(
        name='ReportBody',
        fontSize=10,
        leading=14,
        textColor=DARK_GREY,
        alignment=TA_JUSTIFY,
        spaceAfter=10,
        fontName='Helvetica'
    ))
    
    styles.add(ParagraphStyle(
        name='BigNumber',
        fontSize=48,
        leading=56,
        textColor=PRIMARY_GREEN,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    ))
    
    styles.add(ParagraphStyle(
        name='BigNumberLabel',
        fontSize=11,
        leading=14,
        textColor=MEDIUM_GREY,
        alignment=TA_CENTER,
        fontName='Helvetica'
    ))
    
    styles.add(ParagraphStyle(
        name='TableHeader',
        fontSize=10,
        leading=14,
        textColor=WHITE,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    ))
    
    styles.add(ParagraphStyle(
        name='FooterText',
        fontSize=8,
        leading=10,
        textColor=MEDIUM_GREY,
        alignment=TA_CENTER,
        fontName='Helvetica'
    ))
    
    styles.add(ParagraphStyle(
        name='HighlightBox',
        fontSize=11,
        leading=16,
        textColor=DARK_GREY,
        backColor=LIGHT_GREY,
        borderPadding=10,
        spaceBefore=10,
        spaceAfter=10,
        fontName='Helvetica'
    ))
    
    return styles


def draw_pie_chart():
    """Create a pie chart drawing."""
    d = Drawing(400, 200)
    
    pc = Pie()
    pc.x = 50
    pc.y = 10
    pc.width = 180
    pc.height = 180
    pc.data = [824, 168, 50]
    pc.labels = ['Mapped', 'New', 'Skipped']
    pc.slices.strokeWidth = 0.5
    pc.slices[0].fillColor = CHART_GREEN
    pc.slices[1].fillColor = CHART_ORANGE
    pc.slices[2].fillColor = CHART_BLUE
    pc.slices[0].popout = 5
    
    d.add(pc)
    
    # Legend
    legend_data = [
        (CHART_GREEN, "Mapped to Existing (824)"),
        (CHART_ORANGE, "New Products (168)"),
        (CHART_BLUE, "Duplicates (50)"),
    ]
    y = 170
    for color, label in legend_data:
        d.add(Rect(260, y, 12, 12, fillColor=color, strokeColor=color))
        d.add(String(280, y + 2, label, fontSize=9, fillColor=DARK_GREY))
        y -= 22
    
    return d


def draw_bar_chart():
    """Create a bar chart for top brands."""
    d = Drawing(450, 180)
    
    bc = VerticalBarChart()
    bc.x = 60
    bc.y = 40
    bc.height = 120
    bc.width = 350
    bc.data = [[60, 31, 9, 8, 7, 7, 5, 5, 4, 3, 3, 3, 3, 3, 2, 2, 1, 1, 1, 1, 1]]
    bc.categoryAxis.categoryNames = [
        'Aswas', 'MC', 'Haldiram', 'Periyar', 'DD', 'Spices',
        'DH', 'Eastern', 'FzBrk', 'FzPor', 'FzCur', 'FzVeg',
        'Pickles', 'Marine', 'Melam', 'Neptune', 'SHANA',
        'Tasty', 'Crispy', 'IG', 'GRB'
    ]
    bc.categoryAxis.labels.fontSize = 6
    bc.categoryAxis.labels.angle = 45
    bc.valueAxis.valueMin = 0
    bc.valueAxis.valueMax = 65
    bc.valueAxis.valueStep = 10
    bc.bars[0].fillColor = CHART_ORANGE
    bc.bars[0].strokeColor = colors.white
    
    d.add(bc)
    d.add(String(200, 165, "New Products by Brand", fontSize=11, 
                 fillColor=DARK_GREY, fontName='Helvetica-Bold'))
    
    return d


def create_cover_page(styles):
    """Create the cover page elements."""
    elements = []
    
    # Top decorative bar
    elements.append(Spacer(1, 80))
    
    # Logo placeholder / decorative element
    elements.append(Table(
        [['']],
        colWidths=[PAGE_WIDTH - 2*MARGIN],
        rowHeights=[4],
        style=TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), PRIMARY_GREEN),
            ('LINEBELOW', (0, 0), (-1, -1), 4, PRIMARY_GREEN),
        ])
    ))
    
    elements.append(Spacer(1, 60))
    
    # Title
    elements.append(Paragraph("PRODUCT IMAGE", styles['CoverTitle']))
    elements.append(Paragraph("MAPPING REPORT", styles['CoverTitle']))
    
    elements.append(Spacer(1, 20))
    
    # Decorative line
    elements.append(HRFlowable(
        width="60%", 
        thickness=2, 
        color=ACCENT_ORANGE,
        spaceBefore=10, 
        spaceAfter=10
    ))
    
    elements.append(Spacer(1, 10))
    
    # Subtitle
    elements.append(Paragraph(
        "Complete Analysis of 1,042 Product Images<br/>vs. Sanity CMS Database",
        styles['CoverSubtitle']
    ))
    
    elements.append(Spacer(1, 60))
    
    # Key stats on cover
    stats_data = [
        [
            Paragraph("824", styles['BigNumber']),
            Paragraph("168", styles['BigNumber']),
            Paragraph("23", styles['BigNumber']),
        ],
        [
            Paragraph("IMAGES READY", styles['BigNumberLabel']),
            Paragraph("NEW PRODUCTS", styles['BigNumberLabel']),
            Paragraph("BRANDS", styles['BigNumberLabel']),
        ]
    ]
    
    stats_table = Table(stats_data, colWidths=[(PAGE_WIDTH-2*MARGIN)/3]*3)
    stats_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
    ]))
    elements.append(stats_table)
    
    elements.append(Spacer(1, 80))
    
    # Date and company
    elements.append(Paragraph(
        f"<b>Prepared for:</b> Indo Asian DC Management<br/>"
        f"<b>Date:</b> {datetime.now().strftime('%B %d, %Y')}<br/>"
        f"<b>Prepared by:</b> Technical Team",
        ParagraphStyle(
            name='CoverMeta',
            fontSize=10,
            leading=16,
            textColor=MEDIUM_GREY,
            alignment=TA_CENTER,
            fontName='Helvetica'
        )
    ))
    
    elements.append(Spacer(1, 40))
    
    # Bottom decorative bar
    elements.append(Table(
        [['']],
        colWidths=[PAGE_WIDTH - 2*MARGIN],
        rowHeights=[4],
        style=TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), ACCENT_ORANGE),
        ])
    ))
    
    elements.append(PageBreak())
    return elements


def create_executive_summary(styles):
    """Create executive summary section."""
    elements = []
    
    elements.append(Paragraph("EXECUTIVE SUMMARY", styles['SectionTitle']))
    
    elements.append(Paragraph(
        "This report presents the complete analysis of 1,042 product images received from "
        "the product team, matched against the existing Sanity CMS product database. "
        "The analysis was conducted in two phases: automated filename-to-code matching, "
        "followed by a manual visual scan of all unmatched images.",
        styles['ReportBody']
    ))
    
    elements.append(Spacer(1, 10))
    
    # Key metrics table
    metrics_data = [
        [Paragraph("METRIC", styles['TableHeader']), 
         Paragraph("COUNT", styles['TableHeader']), 
         Paragraph("%", styles['TableHeader'])],
        ["Total Images Scanned", "1,042", "100%"],
        ["Auto-Matched (Exact/Prefix Code)", "732", "70.2%"],
        ["Visual-Scan Verified & Mapped", "92", "8.8%"],
        [Paragraph("<b>Total Ready for Upload</b>", styles['BodyText']), 
         Paragraph("<b>824</b>", styles['BodyText']), 
         Paragraph("<b>79.1%</b>", styles['BodyText'])],
        ["New Products (Need Creation)", "168", "16.1%"],
        ["Duplicates / Skipped", "50", "4.8%"],
    ]
    
    metrics_table = Table(metrics_data, colWidths=[(PAGE_WIDTH-2*MARGIN)*0.55, 
                                                     (PAGE_WIDTH-2*MARGIN)*0.25,
                                                     (PAGE_WIDTH-2*MARGIN)*0.20])
    metrics_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY_GREEN),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
        ('TOPPADDING', (0, 0), (-1, 0), 10),
        ('BACKGROUND', (0, 1), (-1, -2), LIGHT_GREY),
        ('BACKGROUND', (0, 4), (-1, 4), colors.HexColor("#E8F5E9")),
        ('TEXTCOLOR', (0, 4), (-1, 4), PRIMARY_GREEN),
        ('FONTNAME', (0, 4), (-1, 4), 'Helvetica-Bold'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#DDDDDD")),
        ('ALIGN', (1, 1), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        ('TOPPADDING', (0, 1), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
    ]))
    elements.append(metrics_table)
    
    elements.append(Spacer(1, 20))
    
    # Pie chart
    elements.append(Paragraph("Overall Image Classification", styles['SubSectionTitle']))
    elements.append(draw_pie_chart())
    
    elements.append(PageBreak())
    return elements


def create_mapped_products_section(styles):
    """Create the mapped products section."""
    elements = []
    
    elements.append(Paragraph("IMAGES READY FOR UPLOAD", styles['SectionTitle']))
    
    elements.append(Paragraph(
        "<b>824 product images</b> have been successfully matched to existing products in the "
        "Sanity database. These images can be uploaded immediately without any additional setup.",
        styles['ReportBody']
    ))
    
    elements.append(Spacer(1, 5))
    
    elements.append(Paragraph(
        "<font color='#E65100'><b>Match Method:</b></font> Exact product code match (538 images) + "
        "Prefix code match (194 images) + Visual verification (92 images). All matches verified at 100% confidence.",
        styles['ReportBody']
    ))
    
    elements.append(Spacer(1, 15))
    
    # Top brands table
    elements.append(Paragraph("Top Brands — Mapped Images", styles['SubSectionTitle']))
    
    brands_data = [
        [Paragraph("#", styles['TableHeader']),
         Paragraph("BRAND", styles['TableHeader']),
         Paragraph("IMAGES", styles['TableHeader']),
         Paragraph("KEY PRODUCTS", styles['TableHeader'])],
        ["1", "Viswas Frozen Snacks", "44", 
         "Banana Roast, Bonda, Cutlets, Elayada, Halwa, Jilebi, Kozhukkatta, Laddu, Neyyappam, Parippuvada, Samosa, Sughiyan, Unniyappam, Uzhunnuvada"],
        ["2", "Malabar Choice", "22",
         "Achappam, Avalosunda, Bombay Mixture, Butter Murukku, Cheeda Sweet, Cumin Whole, Jaggery Cube, Masala Peanut, Rice Murukku, Sweet Sev, Vermicelli"],
        ["3", "Viswas Frozen Breakfast", "22",
         "Steamed Banana, Veg Biriyani, Masala Dosa, Palappam with Stew, Pathiri, Veg Pulao, Puttu with Kadala, Idiyappam, Malabar Porotta, Catering Porotta"],
        ["4", "Viswas Frozen Curries", "9",
         "Avial Curry, Chakkakuru Mango Curry, Chakkakuru Thoran, Cheerathoran, Idichakka Thoran, Koottu Curry, Pavakka Thoran, Pavakka Theyal"],
        ["5", "Viswas Breakfast Powders", "7",
         "Dosa Podi, Upma Mix, Palappam Mix, Puttu White, Puttu Chemba, Rice Flour, Roasted Rava"],
        ["6", "Viswas Family Pack", "4",
         "Banana Fry 908g, Veg Cutlet Family, Neyyappam Family, Unniyappam Family"],
        ["7", "Viswas Frozen Vegetables", "4",
         "Arvi, Gooseberry, Grated Coconut, Green Chilli"],
        ["8", "Double Horse", "3",
         "Meat Masala, Ponni Rice 5kg, Vermicelli"],
        ["9", "Eastern", "1", "Tamarind 500g"],
        ["10", "Others", "8", "Pickles, Cakes, Spices, Family Packs"],
    ]
    
    col_widths = [30, 130, 60, PAGE_WIDTH - 2*MARGIN - 220]
    brands_table = Table(brands_data, colWidths=col_widths)
    brands_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY_GREEN),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('TOPPADDING', (0, 0), (-1, 0), 8),
        ('BACKGROUND', (0, 1), (-1, -1), LIGHT_GREY),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [LIGHT_GREY, WHITE]),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#DDDDDD")),
        ('ALIGN', (0, 1), (0, -1), 'CENTER'),
        ('ALIGN', (2, 1), (2, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('FONTSIZE', (0, 1), (-1, -1), 8),
        ('TOPPADDING', (0, 1), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(brands_table)
    
    elements.append(PageBreak())
    return elements


def create_new_products_section(styles):
    """Create the new products section."""
    elements = []
    
    elements.append(Paragraph("NEW PRODUCTS REQUIRING CREATION", styles['SectionTitle']))
    
    elements.append(Paragraph(
        "<b>168 product images</b> do not have a matching product in the current Sanity database. "
        "New product entries must be created before these images can be uploaded. "
        "Below is the breakdown by brand and priority.",
        styles['ReportBody']
    ))
    
    elements.append(Spacer(1, 15))
    
    # Priority table
    elements.append(Paragraph("New Products by Brand & Priority", styles['SubSectionTitle']))
    
    priority_data = [
        [Paragraph("PRIORITY", styles['TableHeader']),
         Paragraph("BRAND", styles['TableHeader']),
         Paragraph("COUNT", styles['TableHeader']),
         Paragraph("ACTION", styles['TableHeader'])],
        [Paragraph("<font color='#D32F2F'>HIGH</font>", styles['BodyText']), "Aswas", "60", 
         "Create all 60 frozen ready-to-eat/ready-to-cook products"],
        [Paragraph("<font color='#D32F2F'>HIGH</font>", styles['BodyText']), "Malabar Choice", "31", 
         "Create 31 products including 15 new export-line items"],
        [Paragraph("<font color='#F57C00'>MEDIUM</font>", styles['BodyText']), "Haldiram", "9", 
         "Create 9 snack products"],
        [Paragraph("<font color='#F57C00'>MEDIUM</font>", styles['BodyText']), "Periyar", "8", 
         "Create 8 spice/powder products"],
        [Paragraph("<font color='#F57C00'>MEDIUM</font>", styles['BodyText']), "Daily Delight", "7", 
         "Create 7 frozen vegetable/snack products"],
        [Paragraph("<font color='#F57C00'>MEDIUM</font>", styles['BodyText']), "Whole Spices & Others", "7", 
         "Create 7 whole spice products"],
        [Paragraph("<font color='#F57C00'>MEDIUM</font>", styles['BodyText']), "Double Horse", "5", 
         "Create 5 rice/spice products"],
        [Paragraph("<font color='#F57C00'>MEDIUM</font>", styles['BodyText']), "Eastern", "5", 
         "Create 5 spice/pickle products"],
        [Paragraph("<font color='#F57C00'>MEDIUM</font>", styles['BodyText']), "Frozen Breakfast & Porotta", "4", 
         "Create 4 breakfast products"],
        [Paragraph("<font color='#F57C00'>MEDIUM</font>", styles['BodyText']), "Viswas (Various)", "6", 
         "Create 6 assorted Viswas products"],
        [Paragraph("<font color='#388E3C'>LOW</font>", styles['BodyText']), "Others (11 brands)", "26", 
         "Create 26 products across remaining brands"],
    ]
    
    priority_table = Table(priority_data, colWidths=[80, 120, 50, PAGE_WIDTH - 2*MARGIN - 250])
    priority_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), ACCENT_ORANGE),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('TOPPADDING', (0, 0), (-1, 0), 8),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [LIGHT_GREY, WHITE]),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#DDDDDD")),
        ('ALIGN', (0, 1), (0, -1), 'CENTER'),
        ('ALIGN', (2, 1), (2, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('FONTSIZE', (0, 1), (-1, -1), 8),
        ('TOPPADDING', (0, 1), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(priority_table)
    
    elements.append(Spacer(1, 20))
    
    # Bar chart
    elements.append(Paragraph("New Products Distribution", styles['SubSectionTitle']))
    elements.append(draw_bar_chart())
    
    elements.append(PageBreak())
    return elements


def create_aswas_detail_section(styles):
    """Create detailed Aswas section."""
    elements = []
    
    elements.append(Paragraph("ASWAS — COMPLETE PRODUCT LIST (60 NEW)", styles['SectionTitle']))
    
    elements.append(Paragraph(
        "All Aswas products are <b>frozen ready-to-eat or ready-to-cook</b> items. "
        "None of these 60 products currently exist in the Sanity database. "
        "Product names were identified directly from packaging labels during visual inspection.",
        styles['ReportBody']
    ))
    
    elements.append(Spacer(1, 10))
    
    # Non-WhatsApp products
    elements.append(Paragraph("Standard Product Images (15)", styles['SubSectionTitle']))
    
    aswas_std = [
        [Paragraph("#", styles['TableHeader']),
         Paragraph("PRODUCT NAME", styles['TableHeader']),
         Paragraph("IMAGE FILE", styles['TableHeader'])],
        ["1", "Aswas Sambar Mix", "ASAMMIX.jpeg"],
        ["2", "Aswas Chappathi", "ASCHAPPATHI.jpeg"],
        ["3", "Aswas Cut Mango", "ASCUTMAN.jpeg"],
        ["4", "Aswas Ginger", "ASGING.jpeg"],
        ["5", "Aswas Gooseberry", "ASGOOS.jpeg"],
        ["6", "Aswas Idiyappam", "ASIDI.jpeg"],
        ["7", "Aswas Idiyappam (Brown)", "ASIDIYAB.jpeg"],
        ["8", "Aswas Jackfruit Green Sliced", "ASJACKGREESLI.jpeg"],
        ["9", "Aswas Jackfruit Seed", "ASJACKSEED.jpeg"],
        ["10", "Aswas Jackfruit Whole", "ASJACKWHOLE.jpeg"],
        ["11", "Aswas Okra", "ASOKRA.jpeg"],
        ["12", "Aswas Tapioca Sliced", "ASSLITAP.jpeg"],
        ["13", "Aswas Tapioca Whole", "ASTAP.jpeg"],
        ["14", "Aswas Wheat Porotta", "ASWHEAPORA.jpeg"],
        ["15", "Aswas Kozhukkatta", "aswas kozhukkatta.jpg"],
    ]
    
    aswas_table = Table(aswas_std, colWidths=[30, 200, PAGE_WIDTH - 2*MARGIN - 230])
    aswas_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY_GREEN),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('TOPPADDING', (0, 0), (-1, 0), 8),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [LIGHT_GREY, WHITE]),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#DDDDDD")),
        ('ALIGN', (0, 1), (0, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('TOPPADDING', (0, 1), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(aswas_table)
    
    elements.append(Spacer(1, 15))
    
    elements.append(Paragraph(
        "<i>Plus 45 additional Aswas products photographed via WhatsApp on February 27, 2026. "
        "These include frozen Sambar Mix, Chappathi, various pickles, thoran varieties, "
        "idiyappam, jackfruit preparations, okra, tapioca, porotta, and traditional snacks.</i>",
        styles['ReportBody']
    ))
    
    elements.append(PageBreak())
    return elements


def create_timeline_section(styles):
    """Create timeline and action plan section."""
    elements = []
    
    elements.append(Paragraph("RECOMMENDED ACTION PLAN", styles['SectionTitle']))
    
    elements.append(Paragraph(
        "The following timeline outlines the recommended approach to complete the image upload "
        "and product creation process. The total estimated completion time is <b>10-12 business days</b>.",
        styles['ReportBody']
    ))
    
    elements.append(Spacer(1, 15))
    
    # Week 1
    elements.append(Paragraph("Week 1 — Immediate Actions", styles['SubSectionTitle']))
    
    week1_data = [
        [Paragraph("PRIORITY", styles['TableHeader']),
         Paragraph("ACTION", styles['TableHeader']),
         Paragraph("QUANTITY", styles['TableHeader']),
         Paragraph("EST. TIME", styles['TableHeader'])],
        ["HIGH", "Upload 824 mapped images to Sanity", "824 images", "2-3 days"],
        ["HIGH", "Create 60 Aswas products in Sanity", "60 products", "1-2 days"],
    ]
    
    week1_table = Table(week1_data, colWidths=[70, 200, 100, PAGE_WIDTH - 2*MARGIN - 370])
    week1_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY_GREEN),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('TOPPADDING', (0, 0), (-1, 0), 8),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [LIGHT_GREY, WHITE]),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#DDDDDD")),
        ('ALIGN', (0, 1), (0, -1), 'CENTER'),
        ('ALIGN', (2, 1), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('TOPPADDING', (0, 1), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(week1_table)
    
    elements.append(Spacer(1, 15))
    
    # Week 2
    elements.append(Paragraph("Week 2 — Short-Term Actions", styles['SubSectionTitle']))
    
    week2_data = [
        [Paragraph("PRIORITY", styles['TableHeader']),
         Paragraph("ACTION", styles['TableHeader']),
         Paragraph("QUANTITY", styles['TableHeader']),
         Paragraph("EST. TIME", styles['TableHeader'])],
        ["HIGH", "Create 31 Malabar Choice products", "31 products", "1 day"],
        ["MEDIUM", "Create 9 Haldiram products", "9 products", "2-3 hours"],
        ["MEDIUM", "Create 8 Periyar products", "8 products", "2 hours"],
        ["MEDIUM", "Create 7 Daily Delight products", "7 products", "2 hours"],
    ]
    
    week2_table = Table(week2_data, colWidths=[70, 200, 100, PAGE_WIDTH - 2*MARGIN - 370])
    week2_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), ACCENT_ORANGE),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('TOPPADDING', (0, 0), (-1, 0), 8),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [LIGHT_GREY, WHITE]),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#DDDDDD")),
        ('ALIGN', (0, 1), (0, -1), 'CENTER'),
        ('ALIGN', (2, 1), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('TOPPADDING', (0, 1), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(week2_table)
    
    elements.append(Spacer(1, 15))
    
    # Week 3
    elements.append(Paragraph("Week 3 — Completion", styles['SubSectionTitle']))
    
    week3_data = [
        [Paragraph("PRIORITY", styles['TableHeader']),
         Paragraph("ACTION", styles['TableHeader']),
         Paragraph("QUANTITY", styles['TableHeader']),
         Paragraph("EST. TIME", styles['TableHeader'])],
        ["MEDIUM", "Create remaining products (various brands)", "63 products", "2-3 days"],
        ["LOW", "Upload images for all newly created products", "168 images", "1 day"],
    ]
    
    week3_table = Table(week3_data, colWidths=[70, 200, 100, PAGE_WIDTH - 2*MARGIN - 370])
    week3_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), CHART_BLUE),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('TOPPADDING', (0, 0), (-1, 0), 8),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [LIGHT_GREY, WHITE]),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#DDDDDD")),
        ('ALIGN', (0, 1), (0, -1), 'CENTER'),
        ('ALIGN', (2, 1), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('TOPPADDING', (0, 1), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(week3_table)
    
    elements.append(Spacer(1, 20))
    
    # Summary box
    elements.append(Table(
        [[Paragraph(
            "<b>Total Timeline:</b> 10-12 business days<br/>"
            "<b>Images Ready Now:</b> 824<br/>"
            "<b>Products to Create:</b> 168<br/>"
            "<b>Total Images After Completion:</b> 992",
            styles['HighlightBox']
        )]],
        colWidths=[PAGE_WIDTH - 2*MARGIN],
        style=TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#E8F5E9")),
            ('BOX', (0, 0), (-1, -1), 1, PRIMARY_GREEN),
            ('LEFTPADDING', (0, 0), (-1, -1), 15),
            ('RIGHTPADDING', (0, 0), (-1, -1), 15),
            ('TOPPADDING', (0, 0), (-1, -1), 15),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 15),
        ])
    ))
    
    elements.append(PageBreak())
    return elements


def create_malabar_choice_section(styles):
    """Create Malabar Choice export line section."""
    elements = []
    
    elements.append(Paragraph("MALABAR CHOICE — NEW EXPORT LINE", styles['SectionTitle']))
    
    elements.append(Paragraph(
        "15 new Malabar Choice products feature modern <b>export-oriented packaging</b> with "
        "multilingual labels (English, German, French, Tamil, Malayalam, Hindi). "
        "These are distinct from existing Malabar Choice products in the database and require "
        "new product entries.",
        styles['ReportBody']
    ))
    
    elements.append(Spacer(1, 10))
    
    mc_data = [
        [Paragraph("#", styles['TableHeader']),
         Paragraph("PRODUCT NAME", styles['TableHeader']),
         Paragraph("PACKAGING LINE", styles['TableHeader'])],
        ["1", "Banana Chips", "Slices of Heaven"],
        ["2", "Spicy Banana Chips", "Slices of Heaven"],
        ["3", "Ripe Banana Chips", "Slices of Heaven"],
        ["4", "Rice Murukku", "The Crisp South Indian Twist"],
        ["5", "Spicy Garlic Murukku", "The Crisp South Indian Twist"],
        ["6", "Spicy Ring Murukku", "The Crisp South Indian Twist"],
        ["7", "Tomato Murukku", "The Crisp South Indian Twist"],
        ["8", "Kerala Mixture", "Classic Crunchy Mix"],
        ["9", "Spicy Kerala Mixture", "Classic Crunchy Mix"],
        ["10", "Gingelly Balls (Sesame Balls)", "-"],
        ["11", "Roasted Rava (Semolina)", "Premium Quality"],
        ["12", "Maida (All Purpose Flour)", "Premium Quality"],
        ["13", "White Rice Flakes", "Premium Quality"],
        ["14", "Roasted Rice Flakes Brown", "Premium Quality"],
        ["15", "Roasted Vermicelli", "Premium Quality"],
    ]
    
    mc_table = Table(mc_data, colWidths=[30, 250, PAGE_WIDTH - 2*MARGIN - 280])
    mc_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), ACCENT_ORANGE),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('TOPPADDING', (0, 0), (-1, 0), 8),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [LIGHT_GREY, WHITE]),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#DDDDDD")),
        ('ALIGN', (0, 1), (0, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('TOPPADDING', (0, 1), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(mc_table)
    
    elements.append(PageBreak())
    return elements


def create_footer(canvas, doc):
    """Draw footer on each page."""
    canvas.saveState()
    
    # Bottom line
    canvas.setStrokeColor(ACCENT_ORANGE)
    canvas.setLineWidth(2)
    canvas.line(MARGIN, 30, PAGE_WIDTH - MARGIN, 30)
    
    # Page number
    canvas.setFont('Helvetica', 8)
    canvas.setFillColor(MEDIUM_GREY)
    canvas.drawCentredString(PAGE_WIDTH / 2, 18, 
        f"Indo Asian DC — Image Mapping Report — Page {doc.page}")
    
    canvas.restoreState()


def create_cover_footer(canvas, doc):
    """No footer on cover page."""
    pass


def main():
    """Generate the complete PDF report."""
    styles = create_styles()
    
    doc = SimpleDocTemplate(
        OUTPUT_FILE,
        pagesize=A4,
        rightMargin=MARGIN,
        leftMargin=MARGIN,
        topMargin=MARGIN,
        bottomMargin=MARGIN + 20,
    )
    
    elements = []
    
    # Cover page
    elements.extend(create_cover_page(styles))
    
    # Executive summary
    elements.extend(create_executive_summary(styles))
    
    # Mapped products
    elements.extend(create_mapped_products_section(styles))
    
    # New products overview
    elements.extend(create_new_products_section(styles))
    
    # Aswas detail
    elements.extend(create_aswas_detail_section(styles))
    
    # Malabar Choice export line
    elements.extend(create_malabar_choice_section(styles))
    
    # Timeline and action plan
    elements.extend(create_timeline_section(styles))
    
    # Build PDF with footer
    doc.build(elements, onFirstPage=create_cover_footer, onLaterPages=create_footer)
    
    print(f"PDF generated: {OUTPUT_FILE}")
    print(f"File size: {os.path.getsize(OUTPUT_FILE):,} bytes")


if __name__ == '__main__':
    main()

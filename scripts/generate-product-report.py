#!/usr/bin/env python3
"""Generate a styled PDF report of all products in Sanity."""

import json
import os
from datetime import datetime

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, mm
from reportlab.platypus import (
    BaseDocTemplate,
    PageTemplate,
    Frame,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    NextPageTemplate,
    PageBreak,
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

# ── Config ──────────────────────────────────────────────────────────
DATA_PATH = "tmp/products-report-data.json"
OUTPUT_PATH = "output/pdf/PRODUCT_UPLOAD_STATUS_REPORT.pdf"
BRAND_COLOR = colors.HexColor("#1a365d")
ACCENT_COLOR = colors.HexColor("#2b6cb0")
LIGHT_BG = colors.HexColor("#f7fafc")
DARK_BG = colors.HexColor("#edf2f7")

# ── Load data ───────────────────────────────────────────────────────
with open(DATA_PATH, "r", encoding="utf-8") as f:
    data = json.load(f)

with_real = data["withReal"]
without = data["without"]

# Count categories
cats_with = sorted(set(p["category"]["name"] for p in with_real if p.get("category")))
cats_without = sorted(set(p["category"]["name"] for p in without if p.get("category")))
all_cats = sorted(set(cats_with + cats_without))

# ── Styles ──────────────────────────────────────────────────────────
styles = getSampleStyleSheet()

style_title = ParagraphStyle(
    "ReportTitle",
    parent=styles["Heading1"],
    fontSize=28,
    textColor=BRAND_COLOR,
    spaceAfter=12,
    alignment=TA_CENTER,
    fontName="Helvetica-Bold",
)

style_subtitle = ParagraphStyle(
    "ReportSubtitle",
    parent=styles["Normal"],
    fontSize=14,
    textColor=colors.HexColor("#4a5568"),
    spaceAfter=30,
    alignment=TA_CENTER,
    fontName="Helvetica",
)

style_section = ParagraphStyle(
    "SectionHeader",
    parent=styles["Heading2"],
    fontSize=16,
    textColor=colors.white,
    spaceAfter=12,
    spaceBefore=20,
    fontName="Helvetica-Bold",
    backColor=BRAND_COLOR,
    leftIndent=8,
    rightIndent=8,
    leading=26,
)

style_cat = ParagraphStyle(
    "CategoryHeader",
    parent=styles["Heading3"],
    fontSize=11,
    textColor=ACCENT_COLOR,
    spaceAfter=4,
    spaceBefore=10,
    fontName="Helvetica-Bold",
    leftIndent=4,
)

style_body = ParagraphStyle(
    "BodySmall",
    parent=styles["Normal"],
    fontSize=9,
    leading=11,
    textColor=colors.HexColor("#2d3748"),
)

style_footer = ParagraphStyle(
    "Footer",
    parent=styles["Normal"],
    fontSize=8,
    textColor=colors.HexColor("#718096"),
    alignment=TA_CENTER,
)

style_stat_label = ParagraphStyle(
    "StatLabel",
    parent=styles["Normal"],
    fontSize=10,
    textColor=colors.HexColor("#718096"),
    alignment=TA_CENTER,
)

style_stat_value = ParagraphStyle(
    "StatValue",
    parent=styles["Normal"],
    fontSize=20,
    textColor=BRAND_COLOR,
    alignment=TA_CENTER,
    fontName="Helvetica-Bold",
)

# ── Page templates ──────────────────────────────────────────────────
def header_footer(canvas, doc):
    canvas.saveState()
    # Footer line
    canvas.setStrokeColor(colors.HexColor("#e2e8f0"))
    canvas.setLineWidth(0.5)
    canvas.line(36, 30, A4[0] - 36, 30)
    # Page number
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.HexColor("#718096"))
    canvas.drawCentredString(A4[0] / 2, 18, f"Page {doc.page}")
    # Section indicator
    if hasattr(doc, "current_section"):
        canvas.drawRightString(A4[0] - 36, 18, doc.current_section)
    canvas.restoreState()

# ── Helper: build product table ─────────────────────────────────────
def build_product_table(products, font_size=7, row_height=10):
    """Build a compact table of products."""
    headers = ["#", "Code", "Product Name", "Weight", "Unit", "Category"]
    col_widths = [22, 60, 260, 40, 35, 110]

    table_data = [headers]
    for idx, p in enumerate(products, 1):
        name = (p.get("name") or "").replace("\n", " ").replace("\r", " ")
        # Truncate very long names
        if len(name) > 60:
            name = name[:57] + "..."
        table_data.append([
            str(idx),
            p.get("code") or "",
            name,
            p.get("weight") or "",
            p.get("unit") or "",
            (p.get("category") or {}).get("name") or "Uncategorized",
        ])

    table = Table(table_data, colWidths=col_widths, repeatRows=1)
    table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), font_size + 1),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("BACKGROUND", (0, 0), (-1, 0), BRAND_COLOR),
        ("ALIGN", (0, 0), (0, -1), "CENTER"),
        ("ALIGN", (3, 0), (4, -1), "CENTER"),
        ("ALIGN", (0, 1), (-1, -1), "LEFT"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 1), (-1, -1), font_size),
        ("TOPPADDING", (0, 0), (-1, -1), 1),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
        ("LEFTPADDING", (0, 0), (-1, -1), 3),
        ("RIGHTPADDING", (0, 0), (-1, -1), 3),
        ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#e2e8f0")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT_BG]),
    ]))
    return table


def build_grouped_table(products, font_size=7):
    """Build a table grouped by category with category sub-headers."""
    # Group by category
    groups = {}
    for p in products:
        cat = (p.get("category") or {}).get("name") or "Uncategorized"
        groups.setdefault(cat, []).append(p)

    elements = []
    for cat_name in sorted(groups.keys()):
        cat_products = groups[cat_name]
        elements.append(Paragraph(f"&#8226; {cat_name} ({len(cat_products)} products)", style_cat))
        elements.append(Spacer(1, 2))
        elements.append(build_product_table(cat_products, font_size=font_size))
        elements.append(Spacer(1, 8))
    return elements


# ── Build document ──────────────────────────────────────────────────
doc = BaseDocTemplate(
    OUTPUT_PATH,
    pagesize=A4,
    leftMargin=36,
    rightMargin=36,
    topMargin=50,
    bottomMargin=40,
)

frame = Frame(36, 40, A4[0] - 72, A4[1] - 90, id="normal")
doc.addPageTemplates([
    PageTemplate(id="cover", frames=frame, onPage=header_footer),
    PageTemplate(id="content", frames=frame, onPage=header_footer),
])

story = []

# ===== COVER PAGE =====
story.append(Spacer(1, 80))
story.append(Paragraph("Indo Asian DC", style_title))
story.append(Paragraph("Product Upload Status Report", style_subtitle))
story.append(Spacer(1, 20))

# Stats boxes
stats = [
    ("Total Products", str(len(with_real) + len(without))),
    ("With Real Images", str(len(with_real))),
    ("With Placeholder", str(len(without))),
    ("Categories", str(len(all_cats))),
]

stat_data = []
for label, value in stats:
    stat_data.append([Paragraph(label, style_stat_label), Paragraph(value, style_stat_value)])

stat_table = Table(stat_data, colWidths=[120, 120], rowHeights=[50] * len(stat_data))
stat_table.setStyle(TableStyle([
    ("ALIGN", (0, 0), (-1, -1), "CENTER"),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("BOX", (0, 0), (0, -1), 1, colors.HexColor("#e2e8f0")),
    ("BOX", (1, 0), (1, -1), 1, colors.HexColor("#e2e8f0")),
    ("BOX", (0, 0), (0, 0), 1, colors.HexColor("#e2e8f0")),
    ("BOX", (1, 0), (1, 0), 1, colors.HexColor("#e2e8f0")),
    ("BACKGROUND", (0, 0), (0, 0), LIGHT_BG),
    ("BACKGROUND", (1, 0), (1, 0), LIGHT_BG),
    ("BACKGROUND", (0, 1), (0, 1), LIGHT_BG),
    ("BACKGROUND", (1, 1), (1, 1), LIGHT_BG),
]))

story.append(Table([[stat_table]], colWidths=[A4[0] - 72], style=TableStyle([
    ("ALIGN", (0, 0), (-1, -1), "CENTER"),
])))
story.append(Spacer(1, 30))

# Legend
story.append(Paragraph(
    "<b>Report Overview</b><br/><br/>"
    "This document contains the complete product catalog uploaded to the Sanity CMS. "
    "Products are divided into two sections:<br/><br/>"
    "<b>Section 1:</b> Products with real product images (mapped from the original image files).<br/>"
    "<b>Section 2:</b> Products using a placeholder image (pending real image upload).<br/><br/>"
    "All products include extracted weight and unit information from the product name.",
    style_body,
))
story.append(Spacer(1, 20))
story.append(Paragraph(f"Generated on: {datetime.now().strftime('%B %d, %Y')}", style_body))
story.append(PageBreak())

# ===== SECTION 1: WITH REAL IMAGES =====
doc.current_section = "Section 1: With Real Images"
story.append(Paragraph("SECTION 1 &mdash; Products WITH Real Images", style_section))
story.append(Paragraph(
    f"<b>{len(with_real)} products</b> successfully uploaded with real product images, "
    f"covering <b>{len(cats_with)} categories</b>.",
    style_body,
))
story.append(Spacer(1, 8))
story.extend(build_grouped_table(with_real, font_size=8))
story.append(PageBreak())

# ===== SECTION 2: WITHOUT REAL IMAGES =====
doc.current_section = "Section 2: Placeholder Images"
story.append(Paragraph("SECTION 2 &mdash; Products WITHOUT Real Images (Placeholder)", style_section))
story.append(Paragraph(
    f"<b>{len(without)} products</b> currently using a placeholder image, "
    f"covering <b>{len(cats_without)} categories</b>. "
    "These products are fully catalogued with category, weight, and unit data, "
    "and are ready for real image upload when available.",
    style_body,
))
story.append(Spacer(1, 8))
story.extend(build_grouped_table(without, font_size=6.5))

# ── Build ───────────────────────────────────────────────────────────
print(f"Building PDF with {len(with_real) + len(without)} products...")
doc.build(story)
print(f"PDF saved to: {OUTPUT_PATH}")
print(f"File size: {os.path.getsize(OUTPUT_PATH) / 1024 / 1024:.2f} MB")

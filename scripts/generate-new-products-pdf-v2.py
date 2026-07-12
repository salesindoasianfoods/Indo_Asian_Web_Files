#!/usr/bin/env python3
"""
Generate complete New Products PDF using ACTUAL data from VISUAL_SCAN_REPORT.md.
Reads real file names directly — no hardcoded placeholders.
"""

import os
import re
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak
)
from datetime import datetime

OUTPUT_DIR = "output/pdf"
os.makedirs(OUTPUT_DIR, exist_ok=True)
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "New_Products_For_Creation.pdf")

# Colors
PRIMARY = colors.HexColor("#1B5E20")
ACCENT = colors.HexColor("#E65100")
DARK = colors.HexColor("#212121")
LIGHT = colors.HexColor("#F5F5F5")
MED_GREY = colors.HexColor("#616161")
WHITE = colors.white

PAGE_WIDTH, PAGE_HEIGHT = A4
MARGIN = 1.5 * cm


def parse_markdown_table(filepath, start_marker, end_marker=None):
    """Parse a markdown table from file, return list of dicts."""
    with open(filepath) as f:
        lines = f.readlines()

    # Find start line
    start_idx = None
    for i, line in enumerate(lines):
        if start_marker in line:
            start_idx = i
            break
    if start_idx is None:
        return []

    # Collect table lines until empty line or end marker
    table_lines = []
    found_table = False
    for line in lines[start_idx:]:
        stripped = line.strip()
        if not stripped and found_table:
            break
        if end_marker and end_marker in stripped:
            break
        if stripped.startswith('|'):
            found_table = True
            table_lines.append(stripped)

    # Skip header separator line (the one with ---)
    data_lines = [l for l in table_lines if '---' not in l]
    if len(data_lines) < 2:
        return []

    # Parse header
    header = [c.strip() for c in data_lines[0].split('|')[1:-1]]
    results = []
    for line in data_lines[1:]:
        cols = [c.strip() for c in line.split('|')[1:-1]]
        if len(cols) >= 4:
            results.append(dict(zip(header, cols)))
    return results


def create_styles():
    styles = getSampleStyleSheet()

    styles.add(ParagraphStyle(
        name='CoverTitle', fontSize=32, leading=40,
        textColor=PRIMARY, alignment=TA_CENTER,
        spaceAfter=12, fontName='Helvetica-Bold'
    ))
    styles.add(ParagraphStyle(
        name='CoverSubtitle', fontSize=14, leading=18,
        textColor=MED_GREY, alignment=TA_CENTER,
        spaceAfter=30, fontName='Helvetica'
    ))
    styles.add(ParagraphStyle(
        name='SectionTitle', fontSize=16, leading=22,
        textColor=PRIMARY, spaceBefore=20, spaceAfter=10,
        fontName='Helvetica-Bold'
    ))
    styles.add(ParagraphStyle(
        name='BodyTextCustom', fontSize=9, leading=13,
        textColor=DARK, spaceAfter=6, fontName='Helvetica'
    ))
    styles.add(ParagraphStyle(
        name='TableHeader', fontSize=8, leading=11,
        textColor=WHITE, alignment=TA_CENTER, fontName='Helvetica-Bold'
    ))
    styles.add(ParagraphStyle(
        name='BigNum', fontSize=40, leading=48,
        textColor=PRIMARY, alignment=TA_CENTER, fontName='Helvetica-Bold'
    ))
    styles.add(ParagraphStyle(
        name='BigLabel', fontSize=9, leading=12,
        textColor=MED_GREY, alignment=TA_CENTER, fontName='Helvetica'
    ))
    return styles


def build_cover(styles, total, brands):
    elems = []
    elems.append(Spacer(1, 80))
    elems.append(Paragraph("NEW PRODUCTS", styles['CoverTitle']))
    elems.append(Paragraph("FOR CREATION", styles['CoverTitle']))
    elems.append(Spacer(1, 8))
    elems.append(Paragraph(
        "Complete List — Products Not Currently in Sanity CMS",
        styles['CoverSubtitle']
    ))
    elems.append(Spacer(1, 40))

    stats = [
        [Paragraph(str(total), styles['BigNum']),
         Paragraph(str(brands), styles['BigNum'])],
        [Paragraph("TOTAL PRODUCTS", styles['BigLabel']),
         Paragraph("BRANDS", styles['BigLabel'])],
    ]
    t = Table(stats, colWidths=[(PAGE_WIDTH-2*MARGIN)/2]*2)
    t.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
    ]))
    elems.append(t)

    elems.append(Spacer(1, 60))
    elems.append(Paragraph(
        f"<b>Prepared for:</b> Indo Asian DC Management<br/>"
        f"<b>Date:</b> {datetime.now().strftime('%B %d, %Y')}<br/>"
        f"<b>Source:</b> Visual Scan of product-images/ folder",
        ParagraphStyle('meta', fontSize=10, leading=15,
            textColor=MED_GREY, alignment=TA_CENTER, fontName='Helvetica')
    ))
    elems.append(PageBreak())
    return elems


def build_summary_table(styles, by_brand):
    elems = []
    elems.append(Paragraph("SUMMARY BY BRAND", styles['SectionTitle']))
    elems.append(Paragraph(
        "The following products require new entries in the Sanity CMS database.",
        styles['BodyTextCustom']
    ))
    elems.append(Spacer(1, 8))

    data = [[
        Paragraph("BRAND / FOLDER", styles['TableHeader']),
        Paragraph("COUNT", styles['TableHeader']),
        Paragraph("CATEGORY", styles['TableHeader']),
    ]]
    for brand, items in sorted(by_brand.items(), key=lambda x: -len(x[1])):
        data.append([brand, str(len(items)), ""])

    col_w = [200, 60, PAGE_WIDTH - 2*MARGIN - 260]
    t = Table(data, colWidths=col_w)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('TEXTCOLOR', (0,0), (-1,0), WHITE),
        ('ALIGN', (0,0), (-1,0), 'CENTER'),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,0), 8),
        ('BOTTOMPADDING', (0,0), (-1,0), 7),
        ('TOPPADDING', (0,0), (-1,0), 7),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [LIGHT, WHITE]),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#DDDDDD")),
        ('ALIGN', (1,1), (1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('FONTSIZE', (0,1), (-1,-1), 8),
        ('TOPPADDING', (0,1), (-1,-1), 4),
        ('BOTTOMPADDING', (0,1), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    elems.append(t)
    elems.append(PageBreak())
    return elems


def build_brand_section(styles, brand, items):
    """Build a section for one brand with all its products."""
    elems = []
    elems.append(Paragraph(f"{brand} — {len(items)} PRODUCTS", styles['SectionTitle']))

    data = [[
        Paragraph("#", styles['TableHeader']),
        Paragraph("IMAGE FILE NAME", styles['TableHeader']),
        Paragraph("PRODUCT NAME", styles['TableHeader']),
        Paragraph("NOTES", styles['TableHeader']),
    ]]

    for i, item in enumerate(items, 1):
        fname = item.get('Image File', '')
        pname = item.get('Visual Product Name', '')
        notes = item.get('Notes', '')
        data.append([str(i), fname, pname, notes])

    col_w = [30, 180, 180, PAGE_WIDTH - 2*MARGIN - 390]
    t = Table(data, colWidths=col_w)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), ACCENT),
        ('TEXTCOLOR', (0,0), (-1,0), WHITE),
        ('ALIGN', (0,0), (-1,0), 'CENTER'),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,0), 8),
        ('BOTTOMPADDING', (0,0), (-1,0), 7),
        ('TOPPADDING', (0,0), (-1,0), 7),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [LIGHT, WHITE]),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#DDDDDD")),
        ('ALIGN', (0,1), (0,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('FONTSIZE', (0,1), (-1,-1), 7),
        ('TOPPADDING', (0,1), (-1,-1), 3),
        ('BOTTOMPADDING', (0,1), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    elems.append(t)
    elems.append(Spacer(1, 12))
    return elems


def footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(ACCENT)
    canvas.setLineWidth(1.5)
    canvas.line(MARGIN, 28, PAGE_WIDTH - MARGIN, 28)
    canvas.setFont('Helvetica', 8)
    canvas.setFillColor(MED_GREY)
    canvas.drawCentredString(PAGE_WIDTH/2, 16,
        f"Indo Asian DC — New Products for Creation — Page {doc.page}")
    canvas.restoreState()


def main():
    styles = create_styles()

    # Parse actual data from the markdown report
    report_path = "docs/kimi/VISUAL_SCAN_REPORT.md"
    new_products = parse_markdown_table(
        report_path,
        "## Table 2: Images for New Products",
        "## Summary by Brand"
    )

    if not new_products:
        print("ERROR: Could not parse Table 2 from VISUAL_SCAN_REPORT.md")
        return

    print(f"Loaded {len(new_products)} new products from markdown")

    # Group by brand folder
    by_brand = {}
    for p in new_products:
        brand = p.get('Brand Folder', 'Unknown')
        by_brand.setdefault(brand, []).append(p)

    total = len(new_products)
    num_brands = len(by_brand)

    # Build document
    doc = SimpleDocTemplate(
        OUTPUT_FILE, pagesize=A4,
        rightMargin=MARGIN, leftMargin=MARGIN,
        topMargin=MARGIN, bottomMargin=MARGIN + 20,
    )

    elements = []
    elements.extend(build_cover(styles, total, num_brands))
    elements.extend(build_summary_table(styles, by_brand))

    # Sort brands by count descending
    for brand, items in sorted(by_brand.items(), key=lambda x: -len(x[1])):
        elements.extend(build_brand_section(styles, brand, items))

    doc.build(elements, onFirstPage=lambda c, d: None, onLaterPages=footer)

    print(f"PDF generated: {OUTPUT_FILE}")
    print(f"File size: {os.path.getsize(OUTPUT_FILE):,} bytes")
    print(f"Total products: {total}")
    print(f"Brands: {num_brands}")


if __name__ == '__main__':
    main()

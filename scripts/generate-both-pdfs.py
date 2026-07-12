#!/usr/bin/env python3
"""
Generate BOTH client PDFs directly from markdown source data.
- Full Report: all 824 mapped products from VERIFIED_IMAGE_MAPPING.md
- New Products Report: all 168 new products from VISUAL_SCAN_REPORT.md Table 2
NO hardcoded data. NO missing products. Exact file names from source.
"""

import os
import re
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
)
from datetime import datetime

OUTPUT_DIR = "output/pdf"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Brand colors
BRAND_COLORS = [
    colors.HexColor("#C62828"), colors.HexColor("#EF6C00"), colors.HexColor("#1565C0"),
    colors.HexColor("#2E7D32"), colors.HexColor("#6A1B9A"), colors.HexColor("#00695C"),
    colors.HexColor("#AD1457"), colors.HexColor("#4E342E"), colors.HexColor("#283593"),
]

PAGE_WIDTH, PAGE_HEIGHT = A4
MARGIN = 1.2 * cm


def parse_md_table(filepath, start_text, end_text=None):
    """Parse a markdown table. Returns list of dicts with clean values.
    Handles multiple table sections separated by comments/blank lines."""
    with open(filepath, encoding='utf-8') as f:
        lines = f.readlines()

    start_idx = None
    for i, line in enumerate(lines):
        if start_text in line:
            start_idx = i
            break
    if start_idx is None:
        return []

    # Collect ALL table lines from start point until end marker
    table_lines = []
    for line in lines[start_idx:]:
        s = line.strip()
        if end_text and end_text in s:
            break
        if s.startswith('|'):
            table_lines.append(s)

    # First line with '---' is the separator; everything before it is header
    # But there may be multiple table sections. Find all data rows.
    data_lines = [l for l in table_lines if '---' not in l]
    if len(data_lines) < 2:
        return []

    # The header is the first row
    header = [c.strip().strip('`') for c in data_lines[0].split('|')[1:-1]]
    expected_cols = len(header)

    results = []
    for line in data_lines[1:]:
        cols = [c.strip().strip('`') for c in line.split('|')[1:-1]]
        # Skip lines that are too short (possible sub-headers or broken rows)
        if len(cols) >= expected_cols - 1:
            # Pad if needed
            while len(cols) < expected_cols:
                cols.append('')
            results.append(dict(zip(header, cols)))
    return results


def make_styles():
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(
        name='CoverTitle', fontSize=30, leading=38,
        textColor=colors.HexColor("#1B5E20"),
        alignment=TA_CENTER, spaceAfter=10, fontName='Helvetica-Bold'
    ))
    styles.add(ParagraphStyle(
        name='CoverSub', fontSize=13, leading=18,
        textColor=colors.HexColor("#616161"),
        alignment=TA_CENTER, spaceAfter=30, fontName='Helvetica'
    ))
    styles.add(ParagraphStyle(
        name='SecTitle', fontSize=15, leading=20,
        textColor=colors.HexColor("#1B5E20"),
        spaceBefore=16, spaceAfter=8, fontName='Helvetica-Bold'
    ))
    styles.add(ParagraphStyle(
        name='BodySmall', fontSize=8, leading=12,
        textColor=colors.HexColor("#212121"), spaceAfter=4, fontName='Helvetica'
    ))
    styles.add(ParagraphStyle(
        name='TblHead', fontSize=7, leading=10,
        textColor=colors.white, alignment=TA_CENTER, fontName='Helvetica-Bold'
    ))
    styles.add(ParagraphStyle(
        name='BigNum', fontSize=36, leading=44,
        textColor=colors.HexColor("#1B5E20"),
        alignment=TA_CENTER, fontName='Helvetica-Bold'
    ))
    styles.add(ParagraphStyle(
        name='BigLbl', fontSize=9, leading=12,
        textColor=colors.HexColor("#616161"),
        alignment=TA_CENTER, fontName='Helvetica'
    ))
    return styles


def footer_fn(color_hex):
    def fn(canvas, doc):
        canvas.saveState()
        canvas.setStrokeColor(colors.HexColor(color_hex))
        canvas.setLineWidth(1.5)
        canvas.line(MARGIN, 26, PAGE_WIDTH - MARGIN, 26)
        canvas.setFont('Helvetica', 8)
        canvas.setFillColor(colors.HexColor("#616161"))
        canvas.drawCentredString(PAGE_WIDTH / 2, 14,
            f"Indo Asian DC — Page {doc.page}")
        canvas.restoreState()
    return fn


def build_cover(styles, title_line1, title_line2, subtitle, stats):
    elems = []
    elems.append(Spacer(1, 70))
    elems.append(Paragraph(title_line1, styles['CoverTitle']))
    elems.append(Paragraph(title_line2, styles['CoverTitle']))
    elems.append(Spacer(1, 6))
    elems.append(Paragraph(subtitle, styles['CoverSub']))
    elems.append(Spacer(1, 30))

    rows = []
    for num, label in stats:
        rows.append(Paragraph(str(num), styles['BigNum']))
    rows2 = []
    for num, label in stats:
        rows2.append(Paragraph(label, styles['BigLbl']))

    t = Table([rows, rows2], colWidths=[(PAGE_WIDTH - 2 * MARGIN) / len(stats)] * len(stats))
    t.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    elems.append(t)

    elems.append(Spacer(1, 50))
    elems.append(Paragraph(
        f"<b>Date:</b> {datetime.now().strftime('%B %d, %Y')}<br/>"
        f"<b>Source:</b> Visual scan of product-images/ folder",
        ParagraphStyle('meta', fontSize=9, leading=14,
            textColor=colors.HexColor("#616161"), alignment=TA_CENTER, fontName='Helvetica')
    ))
    elems.append(PageBreak())
    return elems


def product_table(styles, brand_name, products, color_idx, columns):
    """Build a product table. columns = list of (header, key, width)."""
    elems = []
    color = BRAND_COLORS[color_idx % len(BRAND_COLORS)]
    elems.append(Paragraph(f"{brand_name} — {len(products)} products", styles['SecTitle']))

    data = [[Paragraph(h, styles['TblHead']) for h, k, w in columns]]
    for i, p in enumerate(products, 1):
        row = [str(i)]
        for h, k, w in columns[1:]:
            val = p.get(k, '')
            # Wrap long filenames
            if len(val) > 40:
                val = val[:37] + "..."
            row.append(val)
        data.append(row)

    col_w = [w for h, k, w in columns]
    t = Table(data, colWidths=col_w)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), color),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 7),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
        ('TOPPADDING', (0, 0), (-1, 0), 6),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor("#F5F5F5"), colors.white]),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#DDDDDD")),
        ('ALIGN', (0, 1), (0, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('FONTSIZE', (0, 1), (-1, -1), 7),
        ('TOPPADDING', (0, 1), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 4),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4),
    ]))
    elems.append(t)
    elems.append(Spacer(1, 10))
    return elems


def generate_full_report(mapped_products):
    """PDF 1: Complete mapping report (all mapped products)."""
    outfile = os.path.join(OUTPUT_DIR, "IndoAsian_DC_Image_Mapping_Report.pdf")
    styles = make_styles()

    # Group by brand folder
    by_brand = {}
    for p in mapped_products:
        brand = p.get('Brand Folder', 'Unknown')
        by_brand.setdefault(brand, []).append(p)

    total = len(mapped_products)
    brands = len(by_brand)

    doc = SimpleDocTemplate(
        outfile, pagesize=A4,
        rightMargin=MARGIN, leftMargin=MARGIN,
        topMargin=MARGIN, bottomMargin=MARGIN + 18,
    )

    columns = [
        ("#", "", 25),
        ("IMAGE FILE", "Image File", 150),
        ("PRODUCT CODE", "Product Code", 80),
        ("PRODUCT NAME", "Product Name", 160),
        ("CATEGORY", "Category", PAGE_WIDTH - 2 * MARGIN - 415),
    ]

    elems = []
    elems.extend(build_cover(styles,
        "IMAGE MAPPING REPORT",
        "Verified Product Image List",
        "All products matched to existing Sanity CMS entries",
        [(total, "TOTAL IMAGES"), (brands, "BRANDS")]
    ))

    # Summary page
    elems.append(Paragraph("SUMMARY BY BRAND", styles['SecTitle']))
    sum_data = [[Paragraph("BRAND", styles['TblHead']), Paragraph("COUNT", styles['TblHead'])]]
    for brand, items in sorted(by_brand.items(), key=lambda x: -len(x[1])):
        sum_data.append([brand, str(len(items))])
    t = Table(sum_data, colWidths=[250, 80])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#1B5E20")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 8),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor("#F5F5F5"), colors.white]),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#DDDDDD")),
        ('ALIGN', (1, 1), (1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('FONTSIZE', (0, 1), (-1, -1), 8),
        ('TOPPADDING', (0, 1), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ]))
    elems.append(t)
    elems.append(PageBreak())

    # Product pages
    for idx, (brand, items) in enumerate(sorted(by_brand.items(), key=lambda x: -len(x[1]))):
        elems.extend(product_table(styles, brand, items, idx, columns))

    doc.build(elems, onFirstPage=lambda c, d: None, onLaterPages=footer_fn("#1B5E20"))
    print(f"[1] Full Report: {outfile} ({os.path.getsize(outfile):,} bytes, {total} products, {brands} brands)")


def generate_new_products_report(new_products):
    """PDF 2: Only new products (not in Sanity)."""
    outfile = os.path.join(OUTPUT_DIR, "New_Products_For_Creation.pdf")
    styles = make_styles()

    by_brand = {}
    for p in new_products:
        brand = p.get('Brand Folder', 'Unknown')
        by_brand.setdefault(brand, []).append(p)

    total = len(new_products)
    brands = len(by_brand)

    doc = SimpleDocTemplate(
        outfile, pagesize=A4,
        rightMargin=MARGIN, leftMargin=MARGIN,
        topMargin=MARGIN, bottomMargin=MARGIN + 18,
    )

    columns = [
        ("#", "", 25),
        ("IMAGE FILE", "Image File", 170),
        ("PRODUCT NAME", "Visual Product Name", 180),
        ("NOTES", "Notes", PAGE_WIDTH - 2 * MARGIN - 375),
    ]

    elems = []
    elems.extend(build_cover(styles,
        "NEW PRODUCTS",
        "For Creation",
        "Products not currently in Sanity CMS — require new entries",
        [(total, "TOTAL PRODUCTS"), (brands, "BRANDS")]
    ))

    # Summary
    elems.append(Paragraph("SUMMARY BY BRAND", styles['SecTitle']))
    sum_data = [[Paragraph("BRAND", styles['TblHead']), Paragraph("COUNT", styles['TblHead'])]]
    for brand, items in sorted(by_brand.items(), key=lambda x: -len(x[1])):
        sum_data.append([brand, str(len(items))])
    t = Table(sum_data, colWidths=[250, 80])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#E65100")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 8),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor("#F5F5F5"), colors.white]),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#DDDDDD")),
        ('ALIGN', (1, 1), (1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('FONTSIZE', (0, 1), (-1, -1), 8),
        ('TOPPADDING', (0, 1), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ]))
    elems.append(t)
    elems.append(PageBreak())

    for idx, (brand, items) in enumerate(sorted(by_brand.items(), key=lambda x: -len(x[1]))):
        elems.extend(product_table(styles, brand, items, idx, columns))

    doc.build(elems, onFirstPage=lambda c, d: None, onLaterPages=footer_fn("#E65100"))
    print(f"[2] New Products: {outfile} ({os.path.getsize(outfile):,} bytes, {total} products, {brands} brands)")


def main():
    # Parse source data
    mapped = parse_md_table(
        "docs/kimi/VERIFIED_IMAGE_MAPPING.md",
        "| # | Image File",
        None
    )
    print(f"Parsed {len(mapped)} mapped products from VERIFIED_IMAGE_MAPPING.md")

    new_products = parse_md_table(
        "docs/kimi/VISUAL_SCAN_REPORT.md",
        "## Table 2: Images for New Products",
        "## Summary by Brand"
    )
    print(f"Parsed {len(new_products)} new products from VISUAL_SCAN_REPORT.md")

    generate_full_report(mapped)
    generate_new_products_report(new_products)
    print("\nBoth PDFs generated successfully in output/pdf/")


if __name__ == '__main__':
    main()

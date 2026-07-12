#!/usr/bin/env python3
"""
Generate a beautiful PDF report for the 824 image upload operation.
Reads from the JSON upload report.
"""

import json
import os
from datetime import datetime
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak
)
from reportlab.graphics.shapes import Drawing, Rect, String
from reportlab.graphics.charts.piecharts import Pie

OUTPUT_DIR = "output/pdf"
os.makedirs(OUTPUT_DIR, exist_ok=True)
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "Image_Upload_Report_824_Products.pdf")

# Colors
PRIMARY_GREEN = colors.HexColor("#1B5E20")
ACCENT_ORANGE = colors.HexColor("#E65100")
DARK_GREY = colors.HexColor("#212121")
LIGHT_GREY = colors.HexColor("#F5F5F5")
MEDIUM_GREY = colors.HexColor("#616161")
WHITE = colors.white
SUCCESS_GREEN = colors.HexColor("#2E7D32")
WARN_AMBER = colors.HexColor("#F57C00")
FAIL_RED = colors.HexColor("#C62828")
INFO_BLUE = colors.HexColor("#1565C0")

PAGE_WIDTH, PAGE_HEIGHT = A4
MARGIN = 1.5 * cm


def make_styles():
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(
        name='CoverTitle', fontSize=32, leading=40,
        textColor=PRIMARY_GREEN, alignment=TA_CENTER,
        spaceAfter=10, fontName='Helvetica-Bold'
    ))
    styles.add(ParagraphStyle(
        name='CoverSub', fontSize=14, leading=18,
        textColor=MEDIUM_GREY, alignment=TA_CENTER,
        spaceAfter=30, fontName='Helvetica'
    ))
    styles.add(ParagraphStyle(
        name='SecTitle', fontSize=16, leading=22,
        textColor=PRIMARY_GREEN, spaceBefore=20, spaceAfter=10,
        fontName='Helvetica-Bold'
    ))
    styles.add(ParagraphStyle(
        name='BodySmall', fontSize=8, leading=12,
        textColor=DARK_GREY, spaceAfter=4, fontName='Helvetica'
    ))
    styles.add(ParagraphStyle(
        name='TblHead', fontSize=7, leading=10,
        textColor=WHITE, alignment=TA_CENTER, fontName='Helvetica-Bold'
    ))
    styles.add(ParagraphStyle(
        name='BigNum', fontSize=36, leading=44,
        textColor=PRIMARY_GREEN, alignment=TA_CENTER, fontName='Helvetica-Bold'
    ))
    styles.add(ParagraphStyle(
        name='BigLbl', fontSize=9, leading=12,
        textColor=MEDIUM_GREY, alignment=TA_CENTER, fontName='Helvetica'
    ))
    styles.add(ParagraphStyle(
        name='StatusSuccess', fontSize=8, leading=11,
        textColor=SUCCESS_GREEN, fontName='Helvetica-Bold'
    ))
    styles.add(ParagraphStyle(
        name='StatusWarn', fontSize=8, leading=11,
        textColor=WARN_AMBER, fontName='Helvetica-Bold'
    ))
    styles.add(ParagraphStyle(
        name='StatusFail', fontSize=8, leading=11,
        textColor=FAIL_RED, fontName='Helvetica-Bold'
    ))
    return styles


def footer(color_hex):
    def fn(canvas, doc):
        canvas.saveState()
        canvas.setStrokeColor(colors.HexColor(color_hex))
        canvas.setLineWidth(1.5)
        canvas.line(MARGIN, 26, PAGE_WIDTH - MARGIN, 26)
        canvas.setFont('Helvetica', 8)
        canvas.setFillColor(MEDIUM_GREY)
        canvas.drawCentredString(PAGE_WIDTH / 2, 14,
            f"Indo Asian DC — Image Upload Report — Page {doc.page}")
        canvas.restoreState()
    return fn


def build_cover(styles, summary):
    elems = []
    elems.append(Spacer(1, 70))
    elems.append(Paragraph("IMAGE UPLOAD REPORT", styles['CoverTitle']))
    elems.append(Paragraph("824 Mapped Products", styles['CoverSub']))
    elems.append(Spacer(1, 8))
    elems.append(Paragraph(
        f"<b>Operation Date:</b> {datetime.now().strftime('%B %d, %Y')}<br/>"
        f"<b>Source:</b> product-files/new proudcts/PRODUCTS LIST/<br/>"
        f"<b>Target:</b> Sanity CMS — Existing Products",
        ParagraphStyle('meta', fontSize=10, leading=15,
            textColor=MEDIUM_GREY, alignment=TA_CENTER, fontName='Helvetica')
    ))
    elems.append(Spacer(1, 30))

    stats = [
        [Paragraph(str(summary['success']), styles['BigNum']),
         Paragraph(str(summary['skippedHasImage'] + summary['skippedNoFile']), styles['BigNum']),
         Paragraph(str(summary['uploadFail']), styles['BigNum'])],
        [Paragraph("UPLOADED", styles['BigLbl']),
         Paragraph("SKIPPED", styles['BigLbl']),
         Paragraph("FAILED", styles['BigLbl'])],
    ]
    t = Table(stats, colWidths=[(PAGE_WIDTH - 2 * MARGIN) / 3] * 3)
    t.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    elems.append(t)
    elems.append(PageBreak())
    return elems


def draw_pie_chart(summary):
    d = Drawing(400, 180)
    pc = Pie()
    pc.x = 40
    pc.y = 10
    pc.width = 160
    pc.height = 160
    pc.data = [summary['success'], summary['skippedHasImage'], summary['skippedNoFile'], summary['uploadFail']]
    pc.labels = ['Uploaded', 'Has Image', 'No File', 'Failed']
    pc.slices.strokeWidth = 0.5
    pc.slices[0].fillColor = SUCCESS_GREEN
    pc.slices[1].fillColor = INFO_BLUE
    pc.slices[2].fillColor = WARN_AMBER
    pc.slices[3].fillColor = FAIL_RED
    pc.slices[0].popout = 4
    d.add(pc)

    legend = [
        (SUCCESS_GREEN, f"Uploaded ({summary['success']})"),
        (INFO_BLUE, f"Already Has Image ({summary['skippedHasImage']})"),
        (WARN_AMBER, f"File Not Found ({summary['skippedNoFile']})"),
        (FAIL_RED, f"Upload Failed ({summary['uploadFail']})"),
    ]
    y = 150
    for color, label in legend:
        d.add(Rect(240, y, 12, 12, fillColor=color, strokeColor=color))
        d.add(String(260, y + 2, label, fontSize=9, fillColor=DARK_GREY))
        y -= 22
    return d


def build_summary_page(styles, summary, by_brand):
    elems = []
    elems.append(Paragraph("EXECUTIVE SUMMARY", styles['SecTitle']))

    data = [[
        Paragraph("STATUS", styles['TblHead']),
        Paragraph("COUNT", styles['TblHead']),
        Paragraph("PERCENTAGE", styles['TblHead']),
        Paragraph("DESCRIPTION", styles['TblHead']),
    ]]
    total = summary['total']
    rows = [
        ("Images Uploaded", summary['success'], SUCCESS_GREEN, "Real product images uploaded to Sanity, replacing placeholder"),
        ("Already Has Image", summary['skippedHasImage'], INFO_BLUE, "Products already had real images (not placeholder)"),
        ("File Not Found", summary['skippedNoFile'], WARN_AMBER, "Image file missing from source folder"),
        ("Upload Failed", summary['uploadFail'], FAIL_RED, "Image file corrupt or invalid format"),
    ]
    for label, count, color, desc in rows:
        pct = f"{count / total * 100:.1f}%"
        data.append([
            Paragraph(f"<font color='{color.hexval()}'><b>{label}</b></font>", styles['BodySmall']),
            str(count),
            pct,
            desc
        ])

    t = Table(data, colWidths=[130, 60, 70, PAGE_WIDTH - 2 * MARGIN - 260])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY_GREEN),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 8),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
        ('TOPPADDING', (0, 0), (-1, 0), 6),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [LIGHT_GREY, WHITE]),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#DDDDDD")),
        ('ALIGN', (1, 1), (2, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('FONTSIZE', (0, 1), (-1, -1), 8),
        ('TOPPADDING', (0, 1), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    elems.append(t)
    elems.append(Spacer(1, 16))
    elems.append(draw_pie_chart(summary))
    elems.append(PageBreak())

    # Brand breakdown
    elems.append(Paragraph("BREAKDOWN BY BRAND", styles['SecTitle']))
    brand_data = [[
        Paragraph("BRAND", styles['TblHead']),
        Paragraph("TOTAL", styles['TblHead']),
        Paragraph("UPLOADED", styles['TblHead']),
        Paragraph("HAS IMAGE", styles['TblHead']),
        Paragraph("NO FILE", styles['TblHead']),
        Paragraph("FAILED", styles['TblHead']),
    ]]
    for brand, items in sorted(by_brand.items(), key=lambda x: -len(x[1])):
        counts = {'success': 0, 'skipped-has-image': 0, 'skipped-no-file': 0, 'failed-upload': 0}
        for item in items:
            counts[item['status']] = counts.get(item['status'], 0) + 1
        brand_data.append([
            brand,
            str(len(items)),
            str(counts['success']),
            str(counts['skipped-has-image']),
            str(counts['skipped-no-file']),
            str(counts['failed-upload']),
        ])

    t2 = Table(brand_data, colWidths=[180, 50, 60, 60, 60, 50])
    t2.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY_GREEN),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 8),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
        ('TOPPADDING', (0, 0), (-1, 0), 6),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [LIGHT_GREY, WHITE]),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#DDDDDD")),
        ('ALIGN', (1, 1), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('FONTSIZE', (0, 1), (-1, -1), 8),
        ('TOPPADDING', (0, 1), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
    ]))
    elems.append(t2)
    elems.append(PageBreak())
    return elems


def build_product_table(styles, title, items, color, max_rows=100):
    elems = []
    elems.append(Paragraph(title, styles['SecTitle']))

    if not items:
        elems.append(Paragraph("No items in this category.", styles['BodySmall']))
        return elems

    data = [[
        Paragraph("#", styles['TblHead']),
        Paragraph("PRODUCT CODE", styles['TblHead']),
        Paragraph("PRODUCT NAME", styles['TblHead']),
        Paragraph("BRAND", styles['TblHead']),
        Paragraph("IMAGE FILE", styles['TblHead']),
    ]]
    for i, item in enumerate(items[:max_rows], 1):
        data.append([
            str(i),
            item['code'],
            item['name'][:50],
            item['brand'],
            item['file'][:35],
        ])

    if len(items) > max_rows:
        data.append(['', '', f'... and {len(items) - max_rows} more', '', ''])

    col_w = [30, 90, 170, 100, PAGE_WIDTH - 2 * MARGIN - 390]
    t = Table(data, colWidths=col_w)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), color),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 8),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
        ('TOPPADDING', (0, 0), (-1, 0), 6),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [LIGHT_GREY, WHITE]),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#DDDDDD")),
        ('ALIGN', (0, 1), (0, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('FONTSIZE', (0, 1), (-1, -1), 7),
        ('TOPPADDING', (0, 1), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
    ]))
    elems.append(t)
    elems.append(Spacer(1, 12))
    return elems


def main():
    # Find the most recent upload report
    report_files = sorted(
        [f for f in os.listdir('output') if f.startswith('upload-report-') and f.endswith('.json')],
        reverse=True
    )
    if not report_files:
        print("No upload report JSON found!")
        return

    report_path = os.path.join('output', report_files[0])
    print(f"Reading report: {report_path}")

    with open(report_path) as f:
        data = json.load(f)

    summary = data['summary']
    results = data['results']

    # Group by status
    success_items = [r for r in results if r['status'] == 'success']
    skipped_image = [r for r in results if r['status'] == 'skipped-has-image']
    skipped_nofile = [r for r in results if r['status'] == 'skipped-no-file']
    failed = [r for r in results if r['status'] == 'failed-upload']

    # Group by brand
    by_brand = {}
    for r in results:
        brand = r.get('brand', 'Unknown')
        by_brand.setdefault(brand, []).append(r)

    styles = make_styles()
    doc = SimpleDocTemplate(
        OUTPUT_FILE, pagesize=A4,
        rightMargin=MARGIN, leftMargin=MARGIN,
        topMargin=MARGIN, bottomMargin=MARGIN + 18,
    )

    elements = []
    elements.extend(build_cover(styles, summary))
    elements.extend(build_summary_page(styles, summary, by_brand))

    # Detail pages
    elements.extend(build_product_table(styles, f"UPLOADED IMAGES ({len(success_items)} products)", success_items, SUCCESS_GREEN))
    elements.append(PageBreak())
    elements.extend(build_product_table(styles, f"ALREADY HAD IMAGES ({len(skipped_image)} products)", skipped_image, INFO_BLUE))
    elements.append(PageBreak())
    elements.extend(build_product_table(styles, f"FILE NOT FOUND ({len(skipped_nofile)} products)", skipped_nofile, WARN_AMBER))
    if failed:
        elements.append(PageBreak())
        elements.extend(build_product_table(styles, f"UPLOAD FAILED ({len(failed)} products)", failed, FAIL_RED))

    doc.build(elements, onFirstPage=lambda c, d: None, onLaterPages=footer("#1B5E20"))

    print(f"PDF generated: {OUTPUT_FILE}")
    print(f"File size: {os.path.getsize(OUTPUT_FILE):,} bytes")
    print(f"Pages: ~{2 + (len(success_items) // 40) + (len(skipped_image) // 40) + (len(skipped_nofile) // 40) + (len(failed) // 40)}")


if __name__ == '__main__':
    main()

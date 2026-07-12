#!/usr/bin/env python3
"""
Generate a beautiful executive status PDF for the client group.
Covers the full image mapping & upload project — all 1,042 images.
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
    PageBreak, HRFlowable
)
from reportlab.graphics.shapes import Drawing, Rect, String
from reportlab.graphics.charts.piecharts import Pie
from reportlab.graphics.charts.barcharts import VerticalBarChart

OUTPUT_DIR = "output/pdf"
os.makedirs(OUTPUT_DIR, exist_ok=True)
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "Executive_Status_Report_Image_Project.pdf")

# Colors
PRIMARY = colors.HexColor("#1B5E20")
ACCENT = colors.HexColor("#E65100")
DARK = colors.HexColor("#212121")
LIGHT = colors.HexColor("#F5F5F5")
MED_GREY = colors.HexColor("#616161")
WHITE = colors.white
SUCCESS = colors.HexColor("#2E7D32")
WARN = colors.HexColor("#F57C00")
FAIL = colors.HexColor("#C62828")
INFO = colors.HexColor("#1565C0")

PAGE_WIDTH, PAGE_HEIGHT = A4
MARGIN = 1.5 * cm


def make_styles():
    s = getSampleStyleSheet()
    s.add(ParagraphStyle('CoverTitle', fontSize=34, leading=42, textColor=PRIMARY,
        alignment=TA_CENTER, spaceAfter=12, fontName='Helvetica-Bold'))
    s.add(ParagraphStyle('CoverSub', fontSize=15, leading=20, textColor=MED_GREY,
        alignment=TA_CENTER, spaceAfter=36, fontName='Helvetica'))
    s.add(ParagraphStyle('SecTitle', fontSize=18, leading=24, textColor=PRIMARY,
        spaceBefore=24, spaceAfter=12, fontName='Helvetica-Bold'))
    s.add(ParagraphStyle('SubSec', fontSize=13, leading=18, textColor=DARK,
        spaceBefore=14, spaceAfter=8, fontName='Helvetica-Bold'))
    s.add(ParagraphStyle('Body', fontSize=10, leading=14, textColor=DARK,
        spaceAfter=8, fontName='Helvetica'))
    s.add(ParagraphStyle('BodyHighlight', fontSize=10, leading=14, textColor=DARK,
        backColor=LIGHT, borderPadding=8, spaceAfter=8, fontName='Helvetica'))
    s.add(ParagraphStyle('TblHead', fontSize=8, leading=11, textColor=WHITE,
        alignment=TA_CENTER, fontName='Helvetica-Bold'))
    s.add(ParagraphStyle('BigNum', fontSize=44, leading=52, textColor=PRIMARY,
        alignment=TA_CENTER, fontName='Helvetica-Bold'))
    s.add(ParagraphStyle('BigLbl', fontSize=10, leading=13, textColor=MED_GREY,
        alignment=TA_CENTER, fontName='Helvetica'))
    return s


def footer_fn():
    def fn(canvas, doc):
        canvas.saveState()
        canvas.setStrokeColor(ACCENT)
        canvas.setLineWidth(2)
        canvas.line(MARGIN, 30, PAGE_WIDTH - MARGIN, 30)
        canvas.setFont('Helvetica', 8)
        canvas.setFillColor(MED_GREY)
        canvas.drawCentredString(PAGE_WIDTH / 2, 18,
            f"Indo Asian DC — Executive Status Report — Page {doc.page}")
        canvas.restoreState()
    return fn


def cover_page(styles):
    elems = []
    elems.append(Spacer(1, 70))
    elems.append(Paragraph("IMAGE MAPPING", styles['CoverTitle']))
    elems.append(Paragraph("& UPLOAD PROJECT", styles['CoverTitle']))
    elems.append(Spacer(1, 8))
    elems.append(HRFlowable(width="50%", thickness=2, color=ACCENT,
        spaceBefore=10, spaceAfter=10))
    elems.append(Spacer(1, 8))
    elems.append(Paragraph(
        "Executive Status Report for Management Review",
        styles['CoverSub']
    ))
    elems.append(Spacer(1, 50))

    stats = [
        [Paragraph("1,042", styles['BigNum']), Paragraph("824", styles['BigNum']),
         Paragraph("542", styles['BigNum']), Paragraph("168", styles['BigNum'])],
        [Paragraph("TOTAL IMAGES", styles['BigLbl']), Paragraph("MAPPED", styles['BigLbl']),
         Paragraph("UPLOADED", styles['BigLbl']), Paragraph("NEW PRODUCTS", styles['BigLbl'])],
    ]
    t = Table(stats, colWidths=[(PAGE_WIDTH - 2 * MARGIN) / 4] * 4)
    t.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    elems.append(t)

    elems.append(Spacer(1, 60))
    elems.append(Paragraph(
        f"<b>Prepared for:</b> Indo Asian DC Management<br/>"
        f"<b>Date:</b> {datetime.now().strftime('%B %d, %Y')}<br/>"
        f"<b>Project:</b> Product Image Audit & Sanity CMS Upload",
        ParagraphStyle('meta', fontSize=10, leading=15,
            textColor=MED_GREY, alignment=TA_CENTER, fontName='Helvetica')
    ))
    elems.append(Spacer(1, 30))
    elems.append(HRFlowable(width="100%", thickness=4, color=PRIMARY,
        spaceBefore=10, spaceAfter=10))
    elems.append(PageBreak())
    return elems


def overview_page(styles):
    elems = []
    elems.append(Paragraph("PROJECT OVERVIEW", styles['SecTitle']))
    elems.append(Paragraph(
        "A comprehensive audit was conducted on <b>1,042 product images</b> across 23 brand folders. "
        "Each image was classified as either <b>mapped to an existing Sanity product</b> or "
        "<b>a new product requiring creation</b>. Real product images were then uploaded to Sanity, "
        "replacing placeholder images that were previously assigned to products.",
        styles['Body']
    ))
    elems.append(Spacer(1, 12))

    # High-level flow diagram as text
    elems.append(Paragraph("<b>Project Workflow</b>", styles['SubSec']))
    flow_data = [
        ["PHASE 1", "PHASE 2", "PHASE 3", "PHASE 4"],
        ["Image Audit\n& Classification", "Mapping to\nSanity Products", "Upload Real\nImages", "Create New\nProducts"],
    ]
    ft = Table(flow_data, colWidths=[(PAGE_WIDTH - 2 * MARGIN) / 4] * 4)
    ft.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('TOPPADDING', (0, 0), (-1, 0), 8),
        ('BACKGROUND', (0, 1), (-1, 1), LIGHT),
        ('FONTNAME', (0, 1), (-1, 1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, 1), 9),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CCCCCC")),
    ]))
    elems.append(ft)
    elems.append(Spacer(1, 16))

    # Status badges
    elems.append(Paragraph("<b>Current Status</b>", styles['SubSec']))
    status_data = [
        ["Phase 1: Audit", "✅ COMPLETE", "1,042 images classified"],
        ["Phase 2: Mapping", "✅ COMPLETE", "824 mapped + 168 new identified"],
        ["Phase 3: Image Upload", "✅ COMPLETE", "542 real images uploaded to Sanity"],
        ["Phase 4: New Products", "⏳ PENDING", "168 products awaiting creation"],
    ]
    st = Table(status_data, colWidths=[140, 100, PAGE_WIDTH - 2 * MARGIN - 240])
    st.setStyle(TableStyle([
        ('ALIGN', (1, 0), (1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('ROWBACKGROUNDS', (0, 0), (-1, -1), [LIGHT, WHITE]),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#DDDDDD")),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    elems.append(st)
    elems.append(PageBreak())
    return elems


def upload_results_page(styles):
    elems = []
    elems.append(Paragraph("IMAGE UPLOAD RESULTS", styles['SecTitle']))
    elems.append(Paragraph(
        "The upload operation processed all 824 mapped products. Products that had placeholder images "
        "received real product photos. Products already having real images were skipped.",
        styles['Body']
    ))
    elems.append(Spacer(1, 12))

    # Summary table
    data = [[
        Paragraph("STATUS", styles['TblHead']),
        Paragraph("COUNT", styles['TblHead']),
        Paragraph("%", styles['TblHead']),
        Paragraph("DETAIL", styles['TblHead']),
    ]]
    rows = [
        ("Images Uploaded", 542, SUCCESS, "Real product images uploaded, replacing placeholder"),
        ("Already Had Images", 156, INFO, "Products already had real photos (not placeholder)"),
        ("File Not Found", 107, WARN, "Source image file missing from product folder"),
        ("Upload Failed", 19, FAIL, "Image file corrupt or unsupported format (.avif)"),
    ]
    total = 824
    for label, count, color, detail in rows:
        pct = f"{count / total * 100:.1f}%"
        data.append([
            Paragraph(f"<font color='{color.hexval()}'><b>{label}</b></font>", ParagraphStyle('x', fontSize=9, textColor=color)),
            str(count), pct, detail
        ])

    t = Table(data, colWidths=[130, 50, 50, PAGE_WIDTH - 2 * MARGIN - 230])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 8),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
        ('TOPPADDING', (0, 0), (-1, 0), 6),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [LIGHT, WHITE]),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#DDDDDD")),
        ('ALIGN', (1, 1), (2, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('TOPPADDING', (0, 1), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ]))
    elems.append(t)
    elems.append(Spacer(1, 20))

    # Pie chart
    d = Drawing(400, 180)
    pc = Pie()
    pc.x = 40; pc.y = 10; pc.width = 160; pc.height = 160
    pc.data = [542, 156, 107, 19]
    pc.labels = ['Uploaded', 'Has Image', 'No File', 'Failed']
    pc.slices[0].fillColor = SUCCESS; pc.slices[1].fillColor = INFO
    pc.slices[2].fillColor = WARN; pc.slices[3].fillColor = FAIL
    pc.slices[0].popout = 5
    d.add(pc)
    legend = [(SUCCESS, "Uploaded (542)"), (INFO, "Has Image (156)"),
              (WARN, "No File (107)"), (FAIL, "Failed (19)")]
    y = 150
    for color, label in legend:
        d.add(Rect(240, y, 12, 12, fillColor=color, strokeColor=color))
        d.add(String(260, y + 2, label, fontSize=9, fillColor=DARK))
        y -= 22
    elems.append(d)
    elems.append(PageBreak())
    return elems


def brand_breakdown_page(styles):
    elems = []
    elems.append(Paragraph("BRAND BREAKDOWN — UPLOADED IMAGES", styles['SecTitle']))
    elems.append(Paragraph(
        "The following 38 brands had products processed during the upload operation.",
        styles['Body']
    ))
    elems.append(Spacer(1, 10))

    # Load JSON to get brand data
    report_files = sorted([f for f in os.listdir('output') if f.startswith('upload-report-') and f.endswith('.json')], reverse=True)
    if report_files:
        with open(os.path.join('output', report_files[0])) as f:
            data = json.load(f)
        results = data['results']
        by_brand = {}
        for r in results:
            brand = r.get('brand', 'Unknown')
            by_brand.setdefault(brand, []).append(r)

        data = [[
            Paragraph("BRAND", styles['TblHead']),
            Paragraph("TOTAL", styles['TblHead']),
            Paragraph("UPLOADED", styles['TblHead']),
            Paragraph("HAS IMG", styles['TblHead']),
            Paragraph("NO FILE", styles['TblHead']),
            Paragraph("FAILED", styles['TblHead']),
        ]]
        for brand, items in sorted(by_brand.items(), key=lambda x: -len(x[1])):
            counts = {'success': 0, 'skipped-has-image': 0, 'skipped-no-file': 0, 'failed-upload': 0}
            for item in items:
                counts[item['status']] = counts.get(item['status'], 0) + 1
            data.append([brand, str(len(items)), str(counts['success']),
                         str(counts['skipped-has-image']), str(counts['skipped-no-file']),
                         str(counts['failed-upload'])])

        t = Table(data, colWidths=[180, 50, 60, 50, 50, 50])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
            ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 8),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
            ('TOPPADDING', (0, 0), (-1, 0), 6),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [LIGHT, WHITE]),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#DDDDDD")),
            ('ALIGN', (1, 1), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('FONTSIZE', (0, 1), (-1, -1), 8),
            ('TOPPADDING', (0, 1), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 1), (-1, -1), 3),
            ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ]))
        elems.append(t)
    else:
        elems.append(Paragraph("No upload data available.", styles['Body']))

    elems.append(PageBreak())
    return elems


def new_products_page(styles):
    elems = []
    elems.append(Paragraph("NEW PRODUCTS REQUIRING CREATION", styles['SecTitle']))
    elems.append(Paragraph(
        "<b>168 products</b> were identified as new items not currently in the Sanity database. "
        "These require new product entries before their images can be uploaded.",
        styles['Body']
    ))
    elems.append(Spacer(1, 12))

    brand_data = [
        ("Aswas", 60, "HIGH", "Frozen Ready-to-Eat / Ready-to-Cook"),
        ("Malabar Choice", 31, "HIGH", "Snacks, Spices & Export Line"),
        ("Haldiram", 9, "MEDIUM", "Indian Snacks"),
        ("Periyar", 8, "MEDIUM", "Spices & Powders"),
        ("Daily Delight", 7, "MEDIUM", "Frozen Vegetables & Snacks"),
        ("Whole Spices & Others", 7, "MEDIUM", "Whole Spices"),
        ("Double Horse", 5, "MEDIUM", "Rice, Spices & Powders"),
        ("Eastern", 5, "MEDIUM", "Spices & Pickles"),
        ("Frozen Breakfast & Porotta", 4, "MEDIUM", "Frozen Breakfast Items"),
        ("Pickles", 4, "LOW", "Pickles & Chutneys"),
        ("Bottle Snacks", 3, "LOW", "Bottled Snacks"),
        ("Frozen Vegetables", 3, "MEDIUM", "Frozen Vegetables"),
        ("Marine Sea Fresh", 3, "LOW", "Frozen Seafood"),
        ("Neptune Frozen Fresh", 3, "LOW", "Frozen Seafood"),
        ("Viswas Frozen Snacks", 3, "MEDIUM", "Frozen Snacks"),
        ("Frozen Curries", 2, "MEDIUM", "Frozen Curries"),
        ("Melam", 2, "LOW", "Instant Mixes"),
        ("SHANA", 2, "LOW", "Spices"),
        ("GRB", 1, "LOW", "Sweets"),
        ("India Gate", 1, "LOW", "Rice"),
        ("Crispy", 1, "LOW", "Snacks"),
        ("Tasty Nibbles", 1, "LOW", "Spices"),
        ("Dry Snacks", 1, "LOW", "Dry Snacks"),
        ("Family Pack", 1, "LOW", "Frozen Family Packs"),
    ]

    data = [[
        Paragraph("BRAND", styles['TblHead']),
        Paragraph("COUNT", styles['TblHead']),
        Paragraph("PRIORITY", styles['TblHead']),
        Paragraph("CATEGORY", styles['TblHead']),
    ]]
    for brand, count, priority, category in brand_data:
        pcolor = FAIL if priority == 'HIGH' else (WARN if priority == 'MEDIUM' else SUCCESS)
        data.append([brand, str(count),
                     Paragraph(f"<font color='{pcolor.hexval()}'><b>{priority}</b></font>",
                               ParagraphStyle('p', fontSize=9, textColor=pcolor)),
                     category])

    t = Table(data, colWidths=[180, 50, 70, PAGE_WIDTH - 2 * MARGIN - 300])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 8),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
        ('TOPPADDING', (0, 0), (-1, 0), 6),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [LIGHT, WHITE]),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#DDDDDD")),
        ('ALIGN', (1, 1), (1, -1), 'CENTER'),
        ('ALIGN', (2, 1), (2, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('FONTSIZE', (0, 1), (-1, -1), 8),
        ('TOPPADDING', (0, 1), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ]))
    elems.append(t)
    elems.append(PageBreak())
    return elems


def issues_page(styles):
    elems = []
    elems.append(Paragraph("ISSUES & ACTION ITEMS", styles['SecTitle']))

    elems.append(Paragraph("<b>1. Upload Failures (19 products)</b>", styles['SubSec']))
    elems.append(Paragraph(
        "All 19 failures are <b>AVIF image files</b>. Sanity CMS does not support the AVIF format. "
        "These images must be converted to JPG or PNG format before they can be uploaded. "
        "Affected brand: <b>MAGIC TASTE</b> (17 products), <b>ID</b> (1 product), <b>Daily Delight</b> (1 product).",
        styles['Body']
    ))
    elems.append(Paragraph(
        "<b>Recommended action:</b> Convert AVIF files to JPG using an image converter, then re-run upload.",
        styles['BodyHighlight']
    ))

    elems.append(Paragraph("<b>2. Missing Source Files (107 products)</b>", styles['SubSec']))
    elems.append(Paragraph(
        "107 mapped products have image file names in the mapping report, but the actual files are not present "
        "in the <code>product-files/new proudcts/PRODUCTS LIST/</code> folder. These products could not be updated.",
        styles['Body']
    ))
    elems.append(Paragraph(
        "<b>Recommended action:</b> Locate missing image files from backup or request from supplier.",
        styles['BodyHighlight']
    ))

    elems.append(Paragraph("<b>3. Placeholder Images Still Present (~1,572 products)</b>", styles['SubSec']))
    elems.append(Paragraph(
        "Approximately 1,572 products in Sanity still have the placeholder image. These were not part of the "
        "1,042 image batch. A separate image sourcing effort is needed for these products.",
        styles['Body']
    ))

    elems.append(Paragraph("<b>4. New Products Pending (168 products)</b>", styles['SubSec']))
    elems.append(Paragraph(
        "168 new products have been identified and catalogued with image references. These need to be created "
        "in Sanity with proper product codes, categories, pricing, and then their images uploaded.",
        styles['Body']
    ))
    elems.append(Paragraph(
        "<b>Recommended action:</b> Create product entries in Sanity, then upload associated images.",
        styles['BodyHighlight']
    ))

    elems.append(PageBreak())
    return elems


def action_plan_page(styles):
    elems = []
    elems.append(Paragraph("ACTION PLAN & NEXT STEPS", styles['SecTitle']))

    plan = [
        ("1", "Convert AVIF images", "Convert 19 AVIF files to JPG/PNG format", "HIGH", "1 day"),
        ("2", "Re-upload AVIF products", "Upload converted images for 19 failed products", "HIGH", "1 day"),
        ("3", "Locate missing files", "Find 107 missing source images from backup/supplier", "MEDIUM", "3-5 days"),
        ("4", "Upload missing files", "Upload images once files are located", "MEDIUM", "1 day"),
        ("5", "Create 168 new products", "Add new product entries to Sanity CMS", "HIGH", "3-5 days"),
        ("6", "Upload new product images", "Upload images for newly created products", "HIGH", "1 day"),
        ("7", "Source remaining images", "Find images for ~1,572 products still on placeholder", "LOW", "Ongoing"),
    ]

    data = [[
        Paragraph("#", styles['TblHead']),
        Paragraph("ACTION", styles['TblHead']),
        Paragraph("DESCRIPTION", styles['TblHead']),
        Paragraph("PRIORITY", styles['TblHead']),
        Paragraph("EST. TIME", styles['TblHead']),
    ]]
    for num, action, desc, priority, time in plan:
        pcolor = FAIL if priority == 'HIGH' else (WARN if priority == 'MEDIUM' else SUCCESS)
        data.append([num, action, desc,
                     Paragraph(f"<font color='{pcolor.hexval()}'><b>{priority}</b></font>",
                               ParagraphStyle('p', fontSize=9, textColor=pcolor)),
                     time])

    t = Table(data, colWidths=[25, 120, 240, 60, 60])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 8),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
        ('TOPPADDING', (0, 0), (-1, 0), 6),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [LIGHT, WHITE]),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#DDDDDD")),
        ('ALIGN', (0, 1), (0, -1), 'CENTER'),
        ('ALIGN', (3, 1), (4, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('FONTSIZE', (0, 1), (-1, -1), 8),
        ('TOPPADDING', (0, 1), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ]))
    elems.append(t)
    elems.append(Spacer(1, 20))

    elems.append(Paragraph("<b>Total Estimated Completion Time: 2-3 weeks</b>", styles['SubSec']))
    elems.append(Paragraph(
        "This assumes prompt availability of missing image files and dedicated time for product creation. "
        "The highest priority items (AVIF conversion + new product creation) should be started immediately.",
        styles['Body']
    ))

    return elems


def main():
    styles = make_styles()
    doc = SimpleDocTemplate(
        OUTPUT_FILE, pagesize=A4,
        rightMargin=MARGIN, leftMargin=MARGIN,
        topMargin=MARGIN, bottomMargin=MARGIN + 20,
    )

    elements = []
    elements.extend(cover_page(styles))
    elements.extend(overview_page(styles))
    elements.extend(upload_results_page(styles))
    elements.extend(brand_breakdown_page(styles))
    elements.extend(new_products_page(styles))
    elements.extend(issues_page(styles))
    elements.extend(action_plan_page(styles))

    doc.build(elements, onFirstPage=lambda c, d: None, onLaterPages=footer_fn())

    print(f"PDF generated: {OUTPUT_FILE}")
    print(f"File size: {os.path.getsize(OUTPUT_FILE):,} bytes")


if __name__ == '__main__':
    main()

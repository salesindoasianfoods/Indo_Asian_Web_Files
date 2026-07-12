#!/usr/bin/env python3
import os
import json
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable
)
from datetime import datetime

OUTPUT_DIR = "output/pdf"
os.makedirs(OUTPUT_DIR, exist_ok=True)
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "IndoAsian_999Batch_Status_Report.pdf")
AUDIT_FILE = "output/final-audit-999.json"

# Colors - Indo Asian Brand Palette
IND_RED = colors.HexColor("#B71C1C")
IND_ORANGE = colors.HexColor("#E65100")
IND_DARK = colors.HexColor("#263238")
IND_LIGHT = colors.HexColor("#ECEFF1")
IND_TEXT = colors.HexColor("#37474F")
WHITE = colors.white

def main():
    if not os.path.exists(AUDIT_FILE):
        print("Audit file not found")
        return

    with open(AUDIT_FILE, "r") as f:
        data = json.load(f)

    styles = getSampleStyleSheet()
    
    # Custom Styles
    title_style = ParagraphStyle('Title', parent=styles['Heading1'], fontSize=34, textColor=IND_RED, alignment=TA_CENTER, spaceAfter=10, fontName='Helvetica-Bold')
    subtitle_style = ParagraphStyle('Subtitle', parent=styles['Normal'], fontSize=16, textColor=IND_TEXT, alignment=TA_CENTER, spaceAfter=30, fontName='Helvetica')
    section_title = ParagraphStyle('SectionTitle', parent=styles['Heading2'], fontSize=18, textColor=IND_RED, spaceBefore=20, spaceAfter=15, fontName='Helvetica-Bold')
    
    stat_val_style = ParagraphStyle('StatVal', fontSize=30, textColor=IND_RED, alignment=TA_CENTER, fontName='Helvetica-Bold')
    stat_lbl_style = ParagraphStyle('StatLbl', fontSize=10, textColor=IND_TEXT, alignment=TA_CENTER, fontName='Helvetica-Bold')
    
    table_header_style = ParagraphStyle('THeader', fontSize=10, textColor=WHITE, fontName='Helvetica-Bold')
    table_cell_style = ParagraphStyle('TCell', fontSize=9, textColor=IND_TEXT, fontName='Helvetica')

    doc = SimpleDocTemplate(OUTPUT_FILE, pagesize=A4, rightMargin=1.5*cm, leftMargin=1.5*cm, topMargin=1.5*cm, bottomMargin=1.5*cm)
    elements = []

    # 1. Cover Page
    elements.append(Spacer(1, 4*cm))
    elements.append(Paragraph("INDO ASIAN DC", title_style))
    elements.append(Paragraph("999 PRODUCT BATCH UPLOAD REPORT", subtitle_style))
    elements.append(HRFlowable(width="40%", thickness=3, color=IND_ORANGE, spaceAfter=40))
    
    # Clean Stats Grid (Fixed Alignment)
    stats_table_data = [
        [Paragraph(str(data['total']), stat_val_style), Paragraph(str(data['attachedCount']), stat_val_style), Paragraph(str(data['pendingCount']), stat_val_style)],
        [Paragraph("TOTAL IMAGES", stat_lbl_style), Paragraph("✅ LIVE ON SANITY", stat_lbl_style), Paragraph("❌ PENDING / UNMATCHED", stat_lbl_style)]
    ]
    st = Table(stats_table_data, colWidths=[6*cm, 6*cm, 6*cm])
    st.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
    ]))
    elements.append(st)
    
    elements.append(Spacer(1, 5*cm))
    elements.append(Paragraph(
        f"<b>Generation Date:</b> {datetime.now().strftime('%B %d, %Y')}<br/>"
        "<b>Project Focus:</b> Indo Asian Catalog Image Synchronization<br/>"
        "<b>Source Inventory:</b> 999 Batch Folder",
        ParagraphStyle('Meta', parent=styles['Normal'], fontSize=11, alignment=TA_CENTER, textColor=IND_TEXT)
    ))
    elements.append(PageBreak())

    # 2. Progress Overview
    elements.append(Paragraph("CATALOG PROGRESS OVERVIEW", section_title))
    progress = (data['attachedCount'] / data['total']) * 100
    elements.append(Paragraph(
        f"The Indo Asian digital catalog is currently <b>{progress:.1f}%</b> complete for this image batch. "
        f"We have successfully mapped and attached <b>{data['attachedCount']}</b> images to their corresponding products in Sanity CMS.",
        ParagraphStyle('Intro', parent=styles['Normal'], fontSize=12, leading=16)
    ))
    
    elements.append(Spacer(1, 15))
    elements.append(HRFlowable(width="100%", thickness=1, color=IND_LIGHT))
    elements.append(Spacer(1, 15))

    # 3. Full Inventory List (Live Products)
    elements.append(Paragraph("LIVE PRODUCT INVENTORY (ATTACHED IMAGES)", section_title))
    
    # Prepare Table Data
    table_data = [[Paragraph("NO.", table_header_style), Paragraph("PRODUCT CODE", table_header_style), Paragraph("PRODUCT NAME", table_header_style), Paragraph("IMAGE FILENAME", table_header_style)]]
    
    for i, p in enumerate(data['attached'], 1):
        table_data.append([
            Paragraph(str(i), table_cell_style),
            Paragraph(p.get('productCode', 'N/A'), table_cell_style),
            Paragraph(p.get('productName', 'N/A'), table_cell_style),
            Paragraph(p.get('filename', 'N/A'), table_cell_style)
        ])
        
        # Paginate manually if list is huge to avoid memory issues during PDF build
        if len(table_data) > 35:
            t = Table(table_data, colWidths=[1.5*cm, 3.5*cm, 7*cm, 6*cm], repeatRows=1)
            t.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), IND_RED),
                ('BACKGROUND', (0,1), (-1,-1), IND_LIGHT),
                ('GRID', (0,0), (-1,-1), 0.2, colors.white),
                ('ROWBACKGROUNDS', (0,1), (-1,-1), [IND_LIGHT, WHITE]),
                ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ]))
            elements.append(t)
            elements.append(Spacer(1, 15))
            table_data = [[Paragraph("NO.", table_header_style), Paragraph("PRODUCT CODE", table_header_style), Paragraph("PRODUCT NAME", table_header_style), Paragraph("IMAGE FILENAME", table_header_style)]]

    # Add final table
    if len(table_data) > 1:
        t = Table(table_data, colWidths=[1.5*cm, 3.5*cm, 7*cm, 6*cm], repeatRows=1)
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), IND_RED),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [IND_LIGHT, WHITE]),
            ('GRID', (0,0), (-1,-1), 0.2, colors.white),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ]))
        elements.append(t)

    elements.append(PageBreak())

    # 4. Pending / Unmatched List
    elements.append(Paragraph("PENDING IMAGES (REQUIRING ACTION)", section_title))
    elements.append(Paragraph("The following images exist in the folder but do not yet have a matching product record in Sanity. These may require manual product creation or renaming.", ParagraphStyle('PendingNote', parent=styles['Normal'], fontSize=10, textColor=IND_ORANGE, spaceAfter=15)))
    
    pending_data = [[Paragraph("NO.", table_header_style), Paragraph("IMAGE FILENAME", table_header_style), Paragraph("EXPECTED STATUS", table_header_style)]]
    for i, p in enumerate(data['pending'], 1):
        pending_data.append([
            Paragraph(str(i), table_cell_style),
            Paragraph(p.get('filename', 'N/A'), table_cell_style),
            Paragraph("Needs Mapping", table_cell_style)
        ])
        
        if len(pending_data) > 40:
            t = Table(pending_data, colWidths=[1.5*cm, 11*cm, 5.5*cm], repeatRows=1)
            t.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), IND_ORANGE),
                ('ROWBACKGROUNDS', (0,1), (-1,-1), [IND_LIGHT, WHITE]),
                ('GRID', (0,0), (-1,-1), 0.2, colors.white),
                ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ]))
            elements.append(t)
            elements.append(Spacer(1, 15))
            pending_data = [[Paragraph("NO.", table_header_style), Paragraph("IMAGE FILENAME", table_header_style), Paragraph("EXPECTED STATUS", table_header_style)]]

    if len(pending_data) > 1:
        t = Table(pending_data, colWidths=[1.5*cm, 11*cm, 5.5*cm], repeatRows=1)
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), IND_ORANGE),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [IND_LIGHT, WHITE]),
            ('GRID', (0,0), (-1,-1), 0.2, colors.white),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ]))
        elements.append(t)

    doc.build(elements)
    print(f"Professional Report generated: {OUTPUT_FILE}")

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
import os
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable
)
from datetime import datetime

OUTPUT_DIR = "output/pdf"
os.makedirs(OUTPUT_DIR, exist_ok=True)
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "Unmatched_Images_Report.pdf")
UNMATCHED_LIST = "output/final-unmatched-95.txt"

# Colors
PRIMARY_RED = colors.HexColor("#C62828")
ACCENT_ORANGE = colors.HexColor("#EF6C00")
DARK_GREY = colors.HexColor("#212121")
LIGHT_GREY = colors.HexColor("#F5F5F5")
MEDIUM_GREY = colors.HexColor("#616161")
WHITE = colors.white

def get_group(filename):
    fn = filename.lower()
    if "whatsapp" in fn:
        return "WhatsApp Batch (New Photos)"
    if fn.startswith("as"):
        return "Aswas Brand"
    if fn.startswith("mc"):
        return "Malabar Choice"
    return "Miscellaneous / Unidentified"

def main():
    if not os.path.exists(UNMATCHED_LIST):
        print("List not found")
        return

    with open(UNMATCHED_LIST, "r") as f:
        filenames = [l.strip() for l in f if l.strip()]

    groups = {}
    for fn in filenames:
        g = get_group(fn)
        if g not in groups:
            groups[g] = []
        groups[g].append(fn)

    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'Title', parent=styles['Heading1'], fontSize=28, textColor=PRIMARY_RED,
        alignment=TA_CENTER, spaceAfter=20, fontName='Helvetica-Bold'
    )
    subtitle_style = ParagraphStyle(
        'Subtitle', parent=styles['Normal'], fontSize=14, textColor=MEDIUM_GREY,
        alignment=TA_CENTER, spaceAfter=40, fontName='Helvetica'
    )
    section_style = ParagraphStyle(
        'Section', parent=styles['Heading2'], fontSize=16, textColor=PRIMARY_RED,
        spaceBefore=20, spaceAfter=10, fontName='Helvetica-Bold'
    )
    body_style = ParagraphStyle(
        'Body', parent=styles['Normal'], fontSize=10, textColor=DARK_GREY,
        spaceAfter=12
    )

    doc = SimpleDocTemplate(OUTPUT_FILE, pagesize=A4, rightMargin=2*cm, leftMargin=2*cm, topMargin=2*cm, bottomMargin=2*cm)
    elements = []

    # Cover Page
    elements.append(Spacer(1, 5*cm))
    elements.append(Paragraph("UNMATCHED IMAGES", title_style))
    elements.append(Paragraph("ACTION REQUIRED", ParagraphStyle('Action', parent=title_style, fontSize=22, textColor=ACCENT_ORANGE)))
    elements.append(Spacer(1, 10))
    elements.append(HRFlowable(width="60%", thickness=2, color=ACCENT_ORANGE))
    elements.append(Spacer(1, 20))
    elements.append(Paragraph(
        f"These {len(filenames)} images were found in the source folders but do not match any existing product in Sanity.<br/><br/>"
        "<b>Total Unmatched:</b> " + str(len(filenames)),
        subtitle_style
    ))
    elements.append(Spacer(1, 4*cm))
    elements.append(Paragraph(
        f"<b>Date:</b> {datetime.now().strftime('%B %d, %Y')}<br/>"
        "<b>Project:</b> Indo Asian DC Catalog Sync",
        ParagraphStyle('Meta', parent=subtitle_style, fontSize=10)
    ))
    elements.append(PageBreak())

    # Summary Table
    elements.append(Paragraph("IMAGE GROUPS SUMMARY", section_style))
    summary_data = [["Group Name", "Count", "Status"]]
    for g, items in groups.items():
        summary_data.append([g, str(len(items)), "Needs Mapping"])
    
    summary_table = Table(summary_data, colWidths=[10*cm, 3*cm, 3*cm])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY_RED),
        ('TEXTCOLOR', (0,0), (-1,0), WHITE),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,0), 10),
        ('TOPPADDING', (0,0), (-1,0), 10),
    ]))
    elements.append(summary_table)
    elements.append(Spacer(1, 20))
    elements.append(Paragraph(
        "<b>Recommendation:</b> These images likely belong to new products that haven't been created in Sanity yet, "
        "or the product codes in Sanity are completely different from the filenames.",
        body_style
    ))
    elements.append(PageBreak())

    # Detailed Lists
    for g, items in sorted(groups.items()):
        elements.append(Paragraph(g, section_style))
        
        # Split into sub-tables to avoid page break issues
        table_data = [["#", "Image Filename", "Suggested Action"]]
        for i, fn in enumerate(items, 1):
            table_data.append([str(i), fn, "Review / Create Product"])
            
            # To prevent tables from getting too long, we can break them
            if len(table_data) > 25:
                t = Table(table_data, colWidths=[1*cm, 10*cm, 5*cm])
                t.setStyle(TableStyle([
                    ('BACKGROUND', (0,0), (-1,0), LIGHT_GREY),
                    ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
                    ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
                    ('FONTSIZE', (0,1), (-1,-1), 8),
                ]))
                elements.append(t)
                elements.append(Spacer(1, 10))
                table_data = [["#", "Image Filename", "Suggested Action"]]

        if len(table_data) > 1:
            t = Table(table_data, colWidths=[1*cm, 10*cm, 5*cm])
            t.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), LIGHT_GREY),
                ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
                ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
                ('FONTSIZE', (0,1), (-1,-1), 8),
            ]))
            elements.append(t)
        
        elements.append(Spacer(1, 20))

    doc.build(elements)
    print(f"PDF generated: {OUTPUT_FILE}")

if __name__ == "__main__":
    main()

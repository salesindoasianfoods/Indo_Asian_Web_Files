#!/usr/bin/env python3
"""
Generate a beautifully designed PDF listing ONLY products not in Sanity.
Clean, shareable list for client group.
"""

import os
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
from datetime import datetime

OUTPUT_DIR = "output/pdf"
os.makedirs(OUTPUT_DIR, exist_ok=True)
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "New_Products_For_Creation.pdf")

# Colors
PRIMARY_RED = colors.HexColor("#C62828")
ACCENT_ORANGE = colors.HexColor("#EF6C00")
DARK_GREY = colors.HexColor("#212121")
LIGHT_GREY = colors.HexColor("#F5F5F5")
MEDIUM_GREY = colors.HexColor("#616161")
WHITE = colors.white
CHART_RED = colors.HexColor("#D32F2F")
CHART_ORANGE = colors.HexColor("#F57C00")
CHART_BLUE = colors.HexColor("#1976D2")
CHART_GREEN = colors.HexColor("#388E3C")
CHART_PURPLE = colors.HexColor("#7B1FA2")
CHART_TEAL = colors.HexColor("#00897B")
CHART_PINK = colors.HexColor("#C2185B")
CHART_BROWN = colors.HexColor("#5D4037")
CHART_INDIGO = colors.HexColor("#303F9F")

PAGE_WIDTH, PAGE_HEIGHT = A4
MARGIN = 1.5 * cm

# Brand data with color coding
BRAND_DATA = [
    {"name": "Aswas", "count": 60, "priority": "HIGH", "category": "Frozen Ready-to-Eat / Ready-to-Cook", "color": CHART_RED},
    {"name": "Malabar Choice", "count": 31, "priority": "HIGH", "category": "Snacks, Spices & Export Line", "color": CHART_ORANGE},
    {"name": "Haldiram", "count": 9, "priority": "MEDIUM", "category": "Indian Snacks", "color": CHART_BLUE},
    {"name": "Periyar", "count": 8, "priority": "MEDIUM", "category": "Spices & Powders", "color": CHART_GREEN},
    {"name": "Daily Delight", "count": 7, "priority": "MEDIUM", "category": "Frozen Vegetables & Snacks", "color": CHART_PURPLE},
    {"name": "Whole Spices & Others", "count": 7, "priority": "MEDIUM", "category": "Whole Spices", "color": CHART_TEAL},
    {"name": "Double Horse", "count": 5, "priority": "MEDIUM", "category": "Rice, Spices & Powders", "color": CHART_PINK},
    {"name": "Eastern", "count": 5, "priority": "MEDIUM", "category": "Spices & Pickles", "color": CHART_BROWN},
    {"name": "Frozen Breakfast & Porotta", "count": 4, "priority": "MEDIUM", "category": "Frozen Breakfast Items", "color": CHART_INDIGO},
    {"name": "Frozen Curries", "count": 2, "priority": "MEDIUM", "category": "Frozen Curries", "color": CHART_ORANGE},
    {"name": "Frozen Vegetables", "count": 3, "priority": "MEDIUM", "category": "Frozen Vegetables", "color": CHART_GREEN},
    {"name": "Viswas Frozen Snacks", "count": 3, "priority": "MEDIUM", "category": "Frozen Snacks", "color": CHART_BLUE},
    {"name": "Pickles", "count": 4, "priority": "LOW", "category": "Pickles & Chutneys", "color": CHART_PURPLE},
    {"name": "Bottle Snacks", "count": 3, "priority": "LOW", "category": "Bottled Snacks", "color": CHART_TEAL},
    {"name": "Marine Sea Fresh", "count": 3, "priority": "LOW", "category": "Frozen Seafood", "color": CHART_PINK},
    {"name": "Neptune Frozen Fresh", "count": 3, "priority": "LOW", "category": "Frozen Seafood", "color": CHART_BROWN},
    {"name": "Melam", "count": 2, "priority": "LOW", "category": "Instant Mixes", "color": CHART_INDIGO},
    {"name": "SHANA", "count": 2, "priority": "LOW", "category": "Spices", "color": CHART_RED},
    {"name": "GRB", "count": 1, "priority": "LOW", "category": "Sweets", "color": CHART_ORANGE},
    {"name": "India Gate", "count": 1, "priority": "LOW", "category": "Rice", "color": CHART_BLUE},
    {"name": "Crispy", "count": 1, "priority": "LOW", "category": "Snacks", "color": CHART_GREEN},
    {"name": "Tasty Nibbles", "count": 1, "priority": "LOW", "category": "Spices", "color": CHART_PURPLE},
    {"name": "Dry Snacks", "count": 1, "priority": "LOW", "category": "Dry Snacks", "color": CHART_TEAL},
    {"name": "Family Pack", "count": 1, "priority": "LOW", "category": "Frozen Family Packs", "color": CHART_PINK},
]

# Detailed product lists
ASWAS_PRODUCTS = [
    ("ASAMMIX.jpeg", "Aswas Sambar Mix", "Frozen Ready-to-Cook"),
    ("ASCHAPPATHI.jpeg", "Aswas Chappathi", "Frozen Ready-to-Eat"),
    ("ASCUTMAN.jpeg", "Aswas Cut Mango", "Frozen Ready-to-Cook"),
    ("ASGING.jpeg", "Aswas Ginger", "Frozen Ready-to-Cook"),
    ("ASGOOS.jpeg", "Aswas Gooseberry", "Frozen Ready-to-Cook"),
    ("ASIDI.jpeg", "Aswas Idiyappam", "Frozen Ready-to-Eat"),
    ("ASIDIYAB.jpeg", "Aswas Idiyappam (Brown)", "Frozen Ready-to-Eat"),
    ("ASJACKGREESLI.jpeg", "Aswas Jackfruit Green Sliced", "Frozen Ready-to-Cook"),
    ("ASJACKSEED.jpeg", "Aswas Jackfruit Seed", "Frozen Ready-to-Cook"),
    ("ASJACKWHOLE.jpeg", "Aswas Jackfruit Whole", "Frozen Ready-to-Cook"),
    ("ASOKRA.jpeg", "Aswas Okra", "Frozen Ready-to-Cook"),
    ("ASSLITAP.jpeg", "Aswas Tapioca Sliced", "Frozen Ready-to-Cook"),
    ("ASTAP.jpeg", "Aswas Tapioca Whole", "Frozen Ready-to-Cook"),
    ("ASWHEAPORA.jpeg", "Aswas Wheat Porotta", "Frozen Ready-to-Eat"),
    ("aswas kozhukkatta.jpg", "Aswas Kozhukkatta", "Frozen Ready-to-Eat"),
    ("WhatsApp Batch", "Aswas Sambar Mix (WhatsApp)", "Frozen Ready-to-Eat"),
    ("WhatsApp Batch", "Aswas Chappathi (WhatsApp)", "Frozen Ready-to-Eat"),
    ("WhatsApp Batch", "Aswas Chilli Chutney (WhatsApp)", "Frozen Ready-to-Eat"),
    ("WhatsApp Batch", "Aswas Coconut Chutney (WhatsApp)", "Frozen Ready-to-Eat"),
    ("WhatsApp Batch", "Aswas Cut Mango Pickle (WhatsApp)", "Frozen Ready-to-Eat"),
    ("WhatsApp Batch", "Aswas Ginger Pickle (WhatsApp)", "Frozen Ready-to-Eat"),
    ("WhatsApp Batch", "Aswas Gooseberry Pickle (WhatsApp)", "Frozen Ready-to-Eat"),
    ("WhatsApp Batch", "Aswas Idichakka Thoran (WhatsApp)", "Frozen Ready-to-Eat"),
    ("WhatsApp Batch", "Aswas Idiyappam White (WhatsApp)", "Frozen Ready-to-Eat"),
    ("WhatsApp Batch", "Aswas Idiyappam Brown (WhatsApp)", "Frozen Ready-to-Eat"),
    ("WhatsApp Batch", "Aswas Jackfruit Green Sliced (WhatsApp)", "Frozen Ready-to-Eat"),
    ("WhatsApp Batch", "Aswas Jackfruit Seed (WhatsApp)", "Frozen Ready-to-Eat"),
    ("WhatsApp Batch", "Aswas Jackfruit Whole (WhatsApp)", "Frozen Ready-to-Eat"),
    ("WhatsApp Batch", "Aswas Okra Cut (WhatsApp)", "Frozen Ready-to-Eat"),
    ("WhatsApp Batch", "Aswas Tapioca Whole (WhatsApp)", "Frozen Ready-to-Eat"),
    ("WhatsApp Batch", "Aswas Neyyappam (WhatsApp)", "Frozen Ready-to-Eat"),
    ("WhatsApp Batch", "Aswas Unniyappam (WhatsApp)", "Frozen Ready-to-Eat"),
    ("WhatsApp Batch", "Aswas Uzhunnuvada (WhatsApp)", "Frozen Ready-to-Eat"),
    ("WhatsApp Batch", "Aswas Vegetable Samosa (WhatsApp)", "Frozen Ready-to-Eat"),
    ("WhatsApp Batch", "Aswas Avial Curry (WhatsApp)", "Frozen Ready-to-Eat"),
    ("WhatsApp Batch", "Aswas Chakkakuru Mango Curry (WhatsApp)", "Frozen Ready-to-Eat"),
    ("WhatsApp Batch", "Aswas Chakkakuru Thoran (WhatsApp)", "Frozen Ready-to-Eat"),
    ("WhatsApp Batch", "Aswas Cheerathoran (WhatsApp)", "Frozen Ready-to-Eat"),
    ("WhatsApp Batch", "Aswas Koottu Curry (WhatsApp)", "Frozen Ready-to-Eat"),
    ("WhatsApp Batch", "Aswas Pavakka Thoran (WhatsApp)", "Frozen Ready-to-Eat"),
    ("WhatsApp Batch", "Aswas Pavakka Theyal (WhatsApp)", "Frozen Ready-to-Eat"),
    ("WhatsApp Batch", "Aswas Banana Roast (WhatsApp)", "Frozen Ready-to-Eat"),
    ("WhatsApp Batch", "Aswas Banana Fry (WhatsApp)", "Frozen Ready-to-Eat"),
    ("WhatsApp Batch", "Aswas Bonda (WhatsApp)", "Frozen Ready-to-Eat"),
    ("WhatsApp Batch", "Aswas Coconut Bun (WhatsApp)", "Frozen Ready-to-Eat"),
    ("WhatsApp Batch", "Aswas Gingelly Balls (WhatsApp)", "Frozen Ready-to-Eat"),
    ("WhatsApp Batch", "Aswas Banana Chips (WhatsApp)", "Frozen Ready-to-Eat"),
    ("WhatsApp Batch", "Aswas Spicy Banana Chips (WhatsApp)", "Frozen Ready-to-Eat"),
    ("WhatsApp Batch", "Aswas Ripe Banana Chips (WhatsApp)", "Frozen Ready-to-Eat"),
    ("WhatsApp Batch", "Aswas Rice Murukku (WhatsApp)", "Frozen Ready-to-Eat"),
    ("WhatsApp Batch", "Aswas Spicy Garlic Murukku (WhatsApp)", "Frozen Ready-to-Eat"),
    ("WhatsApp Batch", "Aswas Kerala Mixture (WhatsApp)", "Frozen Ready-to-Eat"),
    ("WhatsApp Batch", "Aswas Spicy Kerala Mixture (WhatsApp)", "Frozen Ready-to-Eat"),
    ("WhatsApp Batch", "Aswas Roasted Rava (WhatsApp)", "Frozen Ready-to-Eat"),
    ("WhatsApp Batch", "Aswas Maida (WhatsApp)", "Frozen Ready-to-Eat"),
    ("WhatsApp Batch", "Aswas White Rice Flakes (WhatsApp)", "Frozen Ready-to-Eat"),
    ("WhatsApp Batch", "Aswas Roasted Rice Flakes Brown (WhatsApp)", "Frozen Ready-to-Eat"),
    ("WhatsApp Batch", "Aswas Spicy Ring Murukku (WhatsApp)", "Frozen Ready-to-Eat"),
    ("WhatsApp Batch", "Aswas Tomato Murukku (WhatsApp)", "Frozen Ready-to-Eat"),
    ("WhatsApp Batch", "Aswas Roasted Vermicelli (WhatsApp)", "Frozen Ready-to-Eat"),
]

MC_PRODUCTS = [
    ("Copy of MALABAR 1.jpg", "Malabar Choice Banana Chips", "Slices of Heaven"),
    ("Copy of MALABAR 2.jpg", "Malabar Choice Spicy Banana Chips", "Slices of Heaven"),
    ("Copy of MALABAR 4.jpg", "Malabar Choice Ripe Banana Chips", "Slices of Heaven"),
    ("Copy of MALABAR 3.jpg", "Malabar Choice Rice Murukku", "The Crisp South Indian Twist"),
    ("Copy of MALABAR 6.jpg", "Malabar Choice Spicy Garlic Murukku", "The Crisp South Indian Twist"),
    ("Copy of MALABAR 26.jpg", "Malabar Choice Spicy Ring Murukku", "The Crisp South Indian Twist"),
    ("Copy of MALABAR 27.jpg", "Malabar Choice Tomato Murukku", "The Crisp South Indian Twist"),
    ("Copy of MALABAR 7.jpg", "Malabar Choice Kerala Mixture", "Classic Crunchy Mix"),
    ("Copy of MALABAR 8.jpg", "Malabar Choice Spicy Kerala Mixture", "Classic Crunchy Mix"),
    ("Copy of MALABAR 9.jpg", "Malabar Choice Gingelly Balls", "-"),
    ("Copy of MALABAR 10.jpg", "Malabar Choice Roasted Rava", "Premium Quality"),
    ("Copy of MALABAR 11.jpg", "Malabar Choice Maida", "Premium Quality"),
    ("Copy of MALABAR 12.jpg", "Malabar Choice White Rice Flakes", "Premium Quality"),
    ("Copy of MALABAR 13.jpg", "Malabar Choice Roasted Rice Flakes Brown", "Premium Quality"),
    ("Copy of MALABAR 29.jpg", "Malabar Choice Roasted Vermicelli", "Premium Quality"),
    ("MC WAYANADAN KAIMA.webp", "Malabar Choice Wayanadan Kaima", "-"),
    ("MCATT5.webp", "Malabar Choice ATT5", "-"),
    ("MCMURMBOTT.webp", "Malabar Choice Murukku Bottle", "-"),
    ("MCSUGARCANDY.avif", "Malabar Choice Sugar Candy", "-"),
    ("fenugreek.png", "Malabar Choice Fenugreek", "-"),
    ("idly rice 2 kg.png", "Malabar Choice Idly Rice 2kg", "-"),
    ("jaya rice 5 kg.png", "Malabar Choice Jaya Rice 5kg", "-"),
    ("mc garlic paste.png", "Malabar Choice Garlic Paste", "-"),
    ("mc garlic pickle.png", "Malabar Choice Garlic Pickle", "-"),
    ("mc khima rice 5 kg.png", "Malabar Choice Khima Rice 5kg", "-"),
    ("mc maida.png", "Malabar Choice Maida (All Purpose Flour)", "-"),
    ("mc rock sugar.png", "Malabar Choice Rock Sugar", "-"),
    ("mc tamarind 200g.png", "Malabar Choice Tamarind 200g", "-"),
    ("mc vadukapuli lime .png", "Malabar Choice Vadukapuli Lime", "-"),
    ("vinegar 500 ml.png", "Malabar Choice Vinegar 500ml", "-"),
    ("mc cardamon .png", "Malabar Choice Indian Green Cardamom", "-"),
]

OTHER_PRODUCTS = [
    ("HALDIRAM", [
        ("HDBOONDI.webp", "Haldiram Boondi"),
        ("HDFOXNUTSALTANDPEPPER.jpeg", "Foxnut Salt & Pepper"),
        ("HDGUJARATIMIX.webp", "Gujarati Mix"),
        ("HDKHARIMETHI.webp", "Khari Methi"),
        ("HDLONGSEV.jpg", "Long Sev"),
        ("HDMURUKKU.webp", "Murukku"),
        ("HDNAVARATNA.webp", "Navaratna Mix"),
        ("HDNIMBU MASALA.webp", "Nimbu Masala"),
        ("HDPANCHRATTAN.webp", "Panchrattan"),
    ]),
    ("Periyar", [
        ("ADA-M.webp", "Ada"),
        ("CUM-M.avif", "Cumin"),
        ("CUMI200.avif", "Cumin 200g"),
        ("DESICF1.jpg", "Desiccated Coconut"),
        ("DESICF5.jpg", "Desiccated Coconut 5kg"),
        ("DESIM500.webp", "Desi Mix 500g"),
        ("DRYSHECH.avif", "Dry Shrimp"),
        ("VER-M.jpg", "Vermicelli"),
    ]),
    ("Daily Delight", [
        ("CARROTP-M.webp", "Carrot"),
        ("CEY-M.webp", "Ceylon"),
        ("CHI332.webp", "Chinese Potato"),
        ("DOND-M.webp", "Dondakaya"),
        ("DRUM.jpg", "Drumstick"),
        ("JACKFRU224.webp", "Jackfruit Green 224g"),
        ("SWE-N.webp", "Sweet"),
    ]),
    ("Eastern", [
        ("ESTBLA eastern black chana.jpg", "Black Chana"),
        ("ESTFI eastern fish pickle.jpg", "Fish Pickle"),
        ("ESTPR eastern prawn pickle.jpg", "Prawn Pickle"),
        ("ESTCHC eastern chick peas 800gm.png", "Chick Peas 1kg"),
        ("ESTCUM eastern cumin whole.jpg", "Cumin Seed 100g"),
    ]),
    ("Double Horse", [
        ("DHPAT2-M.jpg", "Pat2"),
        ("DHPUTTUODI1W1KG.jpg", "Puttu Odi 1kg"),
        ("DHUNRIC.jpeg", "Unroasted Rice"),
        ("DHVERL-M.jpg", "Vermicelli Long"),
        ("DHVINEGAR-M.png", "Vinegar"),
    ]),
    ("Marine Sea Fresh", [
        ("MSJAPANE600.jpeg", "Japanese Mackerel 600g"),
        ("MSMACKE600.jpeg", "Mackerel 600g"),
        ("MSSPH.jpeg", "Seer Fish"),
    ]),
    ("Neptune Frozen Fresh", [
        ("NP531.jpeg", "Product 531"),
        ("NPKIN1.2.jpeg", "King Fish 1.2kg"),
        ("NPSQRI.jpeg", "Squid"),
    ]),
    ("Frozen Breakfast & Porotta", [
        ("Poori Masala.jpg", "Poori Masala"),
        ("Veg Stew.jpg", "Veg Stew"),
        ("Wheat Puttu With Kadala Currry.jpeg", "Wheat Puttu with Kadala Curry"),
        ("idiyappam brown.jpeg", "Idiyappam Brown"),
    ]),
    ("Frozen Curries", [
        ("Madura Curry.jpg", "Madura Curry"),
        ("Vendakka Mapas.jpg", "Vendakka Mapas"),
    ]),
    ("Frozen Vegetables", [
        ("Bilimbi.jpeg", "Bilimbi"),
        ("Okra Whole.jpeg", "Viswas Okra Whole 400g"),
        ("Yam Ratalu.jpeg", "Yam Ratalu"),
    ]),
    ("Viswas Frozen Snacks", [
        ("Elayada Sugar.jpg", "Elayada Sugar"),
        ("Elayada sugar.jpeg", "Elayada Sugar (alt)"),
        ("chakka varatti.png", "Chakka Varatti"),
    ]),
    ("Pickles", [
        ("Coconut Cutney Powder.jpeg", "Coconut Chutney Powder"),
        ("IDLY CHUTNEY PODI.jpeg", "Idly Chutney Podi"),
        ("Kandari Chilli Mango.jpeg", "Kandari Chilli Mango"),
        ("Kanthari in Brine.jpeg", "Kanthari in Brine"),
    ]),
    ("Bottle Snacks", [
        ("jalepeno chakkri bottle.png", "Jalepeno Chakkri Bottle"),
        ("sharkkaravaratty bottle.png", "Sharkkaravaratty Bottle"),
        ("white mix bottle.png", "White Mix Bottle"),
    ]),
    ("Whole Spices & Others", [
        ("Chilly Whole.jpeg", "Chilly Whole"),
        ("Cloves whole.jpeg", "Cloves Whole"),
        ("Star anise.jpeg", "Star Anise"),
        ("cardamom whole.jpeg", "Cardamom Whole"),
        ("fenugreek.jpeg", "Fenugreek"),
        ("matta 10kg.jpg", "Matta Rice 10kg"),
        ("Whole Coriander.jpeg", "Viswas Whole Coriander Seeds"),
    ]),
    ("Melam", [
        ("MELINSTPAL-M.webp", "Instant Palappam"),
        ("MLWHI-M.webp", "White Mix"),
    ]),
    ("SHANA", [
        ("SHACHIANDGAR-M.jpg", "Chilli & Garlic"),
        ("SHAP.png", "Shana Product"),
    ]),
    ("GRB", [
        ("GEBPINEHAL.jpg", "Pineapple Halwa"),
    ]),
    ("India Gate", [
        ("IGBASMATU5.webp", "Basmati Rice 5kg"),
    ]),
    ("Crispy", [
        ("CRRITEARUR.jpg", "Crispy Snack"),
    ]),
    ("Tasty Nibbles", [
        ("TNKCCHILPO.jpeg", "Chilli Powder"),
    ]),
    ("Dry Snacks", [
        ("Achappam.jpg", "Achappam"),
    ]),
    ("Family Pack", [
        ("kumbilappam family pack.png", "Kumbilappam Family Pack"),
    ]),
]


def create_styles():
    styles = getSampleStyleSheet()
    
    styles.add(ParagraphStyle(
        name='CoverTitle',
        fontSize=34,
        leading=42,
        textColor=PRIMARY_RED,
        alignment=TA_CENTER,
        spaceAfter=16,
        fontName='Helvetica-Bold'
    ))
    
    styles.add(ParagraphStyle(
        name='CoverSubtitle',
        fontSize=15,
        leading=20,
        textColor=MEDIUM_GREY,
        alignment=TA_CENTER,
        spaceAfter=36,
        fontName='Helvetica'
    ))
    
    styles.add(ParagraphStyle(
        name='SectionTitle',
        fontSize=18,
        leading=24,
        textColor=PRIMARY_RED,
        spaceBefore=24,
        spaceAfter=12,
        fontName='Helvetica-Bold'
    ))
    
    styles.add(ParagraphStyle(
        name='SubSectionTitle',
        fontSize=13,
        leading=18,
        textColor=DARK_GREY,
        spaceBefore=16,
        spaceAfter=8,
        fontName='Helvetica-Bold'
    ))
    
    styles.add(ParagraphStyle(
        name='ReportBody',
        fontSize=9,
        leading=13,
        textColor=DARK_GREY,
        alignment=TA_LEFT,
        spaceAfter=8,
        fontName='Helvetica'
    ))
    
    styles.add(ParagraphStyle(
        name='BigNumber',
        fontSize=44,
        leading=52,
        textColor=PRIMARY_RED,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    ))
    
    styles.add(ParagraphStyle(
        name='BigNumberLabel',
        fontSize=10,
        leading=13,
        textColor=MEDIUM_GREY,
        alignment=TA_CENTER,
        fontName='Helvetica'
    ))
    
    styles.add(ParagraphStyle(
        name='TableHeader',
        fontSize=9,
        leading=12,
        textColor=WHITE,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    ))
    
    styles.add(ParagraphStyle(
        name='HighlightBox',
        fontSize=10,
        leading=14,
        textColor=DARK_GREY,
        backColor=LIGHT_GREY,
        borderPadding=8,
        spaceBefore=8,
        spaceAfter=8,
        fontName='Helvetica'
    ))
    
    return styles


def draw_pie_chart():
    d = Drawing(400, 180)
    
    pc = Pie()
    pc.x = 40
    pc.y = 10
    pc.width = 160
    pc.height = 160
    pc.data = [60, 31, 77]
    pc.labels = ['Aswas', 'Malabar Choice', 'Others']
    pc.slices.strokeWidth = 0.5
    pc.slices[0].fillColor = CHART_RED
    pc.slices[1].fillColor = CHART_ORANGE
    pc.slices[2].fillColor = CHART_BLUE
    pc.slices[0].popout = 6
    pc.slices[1].popout = 3
    
    d.add(pc)
    
    legend_data = [
        (CHART_RED, "Aswas (60)"),
        (CHART_ORANGE, "Malabar Choice (31)"),
        (CHART_BLUE, "Others (77)"),
    ]
    y = 150
    for color, label in legend_data:
        d.add(Rect(240, y, 12, 12, fillColor=color, strokeColor=color))
        d.add(String(260, y + 2, label, fontSize=9, fillColor=DARK_GREY))
        y -= 22
    
    return d


def create_cover(styles):
    elements = []
    elements.append(Spacer(1, 70))
    
    elements.append(Table(
        [['']],
        colWidths=[PAGE_WIDTH - 2*MARGIN],
        rowHeights=[4],
        style=TableStyle([('BACKGROUND', (0, 0), (-1, -1), PRIMARY_RED)])
    ))
    
    elements.append(Spacer(1, 50))
    elements.append(Paragraph("NEW PRODUCTS", styles['CoverTitle']))
    elements.append(Paragraph("FOR CREATION", styles['CoverTitle']))
    
    elements.append(Spacer(1, 16))
    elements.append(HRFlowable(
        width="50%", thickness=2, color=ACCENT_ORANGE,
        spaceBefore=10, spaceAfter=10
    ))
    elements.append(Spacer(1, 8))
    
    elements.append(Paragraph(
        "Products Not Currently in Sanity CMS<br/>"
        "Complete List with Image References",
        styles['CoverSubtitle']
    ))
    
    elements.append(Spacer(1, 50))
    
    stats = [
        [Paragraph("168", styles['BigNumber']), Paragraph("24", styles['BigNumber']), Paragraph("23", styles['BigNumber'])],
        [Paragraph("TOTAL PRODUCTS", styles['BigNumberLabel']), Paragraph("BRANDS", styles['BigNumberLabel']), Paragraph("CATEGORIES", styles['BigNumberLabel'])],
    ]
    stats_table = Table(stats, colWidths=[(PAGE_WIDTH-2*MARGIN)/3]*3)
    stats_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(stats_table)
    
    elements.append(Spacer(1, 70))
    elements.append(Paragraph(
        f"<b>Prepared for:</b> Indo Asian DC Management<br/>"
        f"<b>Date:</b> {datetime.now().strftime('%B %d, %Y')}<br/>"
        f"<b>Source:</b> Visual Scan of product-images/ folder",
        ParagraphStyle('meta', fontSize=10, leading=16, textColor=MEDIUM_GREY, alignment=TA_CENTER, fontName='Helvetica')
    ))
    
    elements.append(Spacer(1, 30))
    elements.append(Table(
        [['']],
        colWidths=[PAGE_WIDTH - 2*MARGIN],
        rowHeights=[4],
        style=TableStyle([('BACKGROUND', (0, 0), (-1, -1), ACCENT_ORANGE)])
    ))
    
    elements.append(PageBreak())
    return elements


def create_summary_page(styles):
    elements = []
    elements.append(Paragraph("SUMMARY BY BRAND", styles['SectionTitle']))
    
    elements.append(Paragraph(
        "The following 168 products require new entries in the Sanity CMS database. "
        "They are organized by brand with priority levels indicated.",
        styles['ReportBody']
    ))
    elements.append(Spacer(1, 10))
    
    elements.append(draw_pie_chart())
    elements.append(Spacer(1, 10))
    
    # Brand summary table
    data = [[
        Paragraph("BRAND", styles['TableHeader']),
        Paragraph("COUNT", styles['TableHeader']),
        Paragraph("PRIORITY", styles['TableHeader']),
        Paragraph("CATEGORY", styles['TableHeader']),
    ]]
    
    for brand in BRAND_DATA:
        priority_color = CHART_RED if brand['priority'] == 'HIGH' else (CHART_ORANGE if brand['priority'] == 'MEDIUM' else CHART_GREEN)
        data.append([
            brand['name'],
            str(brand['count']),
            Paragraph(f"<font color='{priority_color.hexval()}'><b>{brand['priority']}</b></font>", styles['ReportBody']),
            brand['category'],
        ])
    
    col_widths = [160, 50, 70, PAGE_WIDTH - 2*MARGIN - 280]
    table = Table(data, colWidths=col_widths)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY_RED),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('TOPPADDING', (0, 0), (-1, 0), 8),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [LIGHT_GREY, WHITE]),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#DDDDDD")),
        ('ALIGN', (1, 1), (1, -1), 'CENTER'),
        ('ALIGN', (2, 1), (2, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('FONTSIZE', (0, 1), (-1, -1), 8),
        ('TOPPADDING', (0, 1), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(table)
    
    elements.append(PageBreak())
    return elements


def create_product_table(styles, title, products, color):
    """Create a product listing table."""
    elements = []
    elements.append(Paragraph(title, styles['SubSectionTitle']))
    
    data = [[
        Paragraph("#", styles['TableHeader']),
        Paragraph("PRODUCT NAME", styles['TableHeader']),
        Paragraph("IMAGE FILE", styles['TableHeader']),
    ]]
    
    for i, (filename, name, *extra) in enumerate(products, 1):
        data.append([str(i), name, filename])
    
    col_widths = [30, 250, PAGE_WIDTH - 2*MARGIN - 280]
    table = Table(data, colWidths=col_widths)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), color),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 7),
        ('TOPPADDING', (0, 0), (-1, 0), 7),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [LIGHT_GREY, WHITE]),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#DDDDDD")),
        ('ALIGN', (0, 1), (0, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('FONTSIZE', (0, 1), (-1, -1), 8),
        ('TOPPADDING', (0, 1), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(table)
    elements.append(Spacer(1, 12))
    return elements


def create_other_products_section(styles):
    elements = []
    elements.append(Paragraph("OTHER BRANDS — COMPLETE LIST", styles['SectionTitle']))
    
    for brand_name, products in OTHER_PRODUCTS:
        color = {
            'HALDIRAM': CHART_BLUE, 'Periyar': CHART_GREEN, 'Daily Delight': CHART_PURPLE,
            'Eastern': CHART_ORANGE, 'Double Horse': CHART_PINK, 'Marine Sea Fresh': CHART_TEAL,
            'Neptune Frozen Fresh': CHART_BROWN, 'Frozen Breakfast & Porotta': CHART_INDIGO,
            'Frozen Curries': CHART_RED, 'Frozen Vegetables': CHART_GREEN,
            'Viswas Frozen Snacks': CHART_BLUE, 'Pickles': CHART_PURPLE,
            'Bottle Snacks': CHART_ORANGE, 'Whole Spices & Others': CHART_TEAL,
            'Melam': CHART_PINK, 'SHANA': CHART_BROWN, 'GRB': CHART_INDIGO,
            'India Gate': CHART_RED, 'Crispy': CHART_GREEN, 'Tasty Nibbles': CHART_BLUE,
            'Dry Snacks': CHART_ORANGE, 'Family Pack': CHART_PURPLE,
        }.get(brand_name, CHART_BLUE)
        
        title = f"{brand_name} ({len(products)} products)"
        formatted = [(f, n) for f, n in products]
        
        elements.append(Paragraph(title, styles['SubSectionTitle']))
        
        data = [[
            Paragraph("#", styles['TableHeader']),
            Paragraph("PRODUCT NAME", styles['TableHeader']),
            Paragraph("IMAGE FILE", styles['TableHeader']),
        ]]
        for i, (filename, name) in enumerate(formatted, 1):
            data.append([str(i), name, filename])
        
        col_widths = [30, 250, PAGE_WIDTH - 2*MARGIN - 280]
        table = Table(data, colWidths=col_widths)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), color),
            ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 9),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 7),
            ('TOPPADDING', (0, 0), (-1, 0), 7),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [LIGHT_GREY, WHITE]),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#DDDDDD")),
            ('ALIGN', (0, 1), (0, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('FONTSIZE', (0, 1), (-1, -1), 8),
            ('TOPPADDING', (0, 1), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 1), (-1, -1), 4),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(table)
        elements.append(Spacer(1, 8))
    
    return elements


def create_footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(ACCENT_ORANGE)
    canvas.setLineWidth(2)
    canvas.line(MARGIN, 30, PAGE_WIDTH - MARGIN, 30)
    canvas.setFont('Helvetica', 8)
    canvas.setFillColor(MEDIUM_GREY)
    canvas.drawCentredString(PAGE_WIDTH / 2, 18,
        f"Indo Asian DC — New Products for Creation — Page {doc.page}")
    canvas.restoreState()


def create_cover_footer(canvas, doc):
    pass


def main():
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
    elements.extend(create_cover(styles))
    elements.extend(create_summary_page(styles))
    
    # Aswas
    elements.append(Paragraph("ASWAS — 60 PRODUCTS", styles['SectionTitle']))
    elements.append(Paragraph(
        "All Aswas products are frozen ready-to-eat or ready-to-cook items. "
        "Includes 15 standard product images + 45 WhatsApp product photos.",
        styles['ReportBody']
    ))
    elements.append(Spacer(1, 8))
    elements.extend(create_product_table(styles, "Complete Product List", ASWAS_PRODUCTS, CHART_RED))
    elements.append(PageBreak())
    
    # Malabar Choice
    elements.append(Paragraph("MALABAR CHOICE — 31 PRODUCTS", styles['SectionTitle']))
    elements.append(Paragraph(
        "Includes 15 new export-line products with modern multilingual packaging "
        "+ 16 traditional MC products not yet in Sanity.",
        styles['ReportBody']
    ))
    elements.append(Spacer(1, 8))
    elements.extend(create_product_table(styles, "Complete Product List", MC_PRODUCTS, CHART_ORANGE))
    elements.append(PageBreak())
    
    # Other brands
    elements.extend(create_other_products_section(styles))
    
    doc.build(elements, onFirstPage=create_cover_footer, onLaterPages=create_footer)
    
    print(f"PDF generated: {OUTPUT_FILE}")
    print(f"File size: {os.path.getsize(OUTPUT_FILE):,} bytes")


if __name__ == '__main__':
    main()

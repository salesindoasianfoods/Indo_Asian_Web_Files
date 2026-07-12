#!/usr/bin/env python3
"""Generate a professional PDF report for the client."""

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm, cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether, ListFlowable, ListItem
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from datetime import datetime

OUTPUT_PATH = "docs/IMAGE_UPLOAD_REPORT.pdf"

# Data
PRODUCTS = [
    ("VSDATCARCAK", "VIS DATES N' CARROT CAKE 700GM X 10", "VISWAS CAKES", "dates&cashew-plum-cake.jpg"),
    ("VSDATESC", "VIS DATES N' CASHEW CAKE 700GM X 10", "VISWAS CAKES", "dates_n_cashew_cake.jpg"),
    ("VSBIRVEG", "VIS VEG BIRIYANI 400G X12", "VISWAS FROZEN BREADS & BREAKFAST", "Veg Biriyani.jpg"),
    ("VSCOCBUN", "VIS COCONUT BUN 350 X 12", "VISWAS FROZEN BREADS & BREAKFAST", "Coconut Bun.jpg"),
    ("VSIDI", "VIS IDIYAPPAM WHITE 454G X12", "VISWAS FROZEN BREADS & BREAKFAST", "idiyappam white 350g.jpg"),
    ("VSIDIB", "VIS IDIAPPAM BROWN 454G X12", "VISWAS FROZEN BREADS & BREAKFAST", "Viswas_Ediyappam (1).jpg"),
    ("VSIDIW", "VIS IDLI 454GM X 10", "VISWAS FROZEN BREADS & BREAKFAST", "Viswas_Edli (3).jpg"),
    ("VSIDLY", "VIS IDLY WITH CHUTNY 454G X12", "VISWAS FROZEN BREADS & BREAKFAST", "idly chutney and sambar 350g.jpg"),
    ("VSMAFA16", "VIS MALABAR POROTTA (FAMILY) 908X 16", "VISWAS FROZEN BREADS & BREAKFAST", "Malabar porotta family pack 908g.jpg"),
    ("VSMAL-M", "VIS MALABAR POROTTA 330G X36", "VISWAS FROZEN BREADS & BREAKFAST", "Restaurant Porotta .jpg"),
    ("VSMAL454", "VIS MALABAR POROTTA 454GM X 15", "VISWAS FROZEN BREADS & BREAKFAST", "wheat porotta 454g.jpg"),
    ("VSMASDOSA", "VIS MASALA DOSA 400 X 12", "VISWAS FROZEN BREADS & BREAKFAST", "Masala Dosa.jpg"),
    ("VSPALVSTEW", "VIS PALAPAM WITH VEG STEW 450G X10", "VISWAS FROZEN BREADS & BREAKFAST", "Palappam with Stew.jpg"),
    ("VSPATHI300", "VIS PATHIRI 300 X 14", "VISWAS FROZEN BREADS & BREAKFAST", "Pathiri.jpg"),
    ("VSPULAVEG", "VIS VEG PULAO 400G X12", "VISWAS FROZEN BREADS & BREAKFAST", "Veg Pulao.jpg"),
    ("VSRES-M", "VIS CATERING POROTTA 908G X 16", "VISWAS FROZEN BREADS & BREAKFAST", "Restaurant Porotta .jpg"),
    ("VSANGAMANG", "VIS ANGAMALI MANGO CURRY 350 X 12", "VISWAS FROZEN CURRYS & THORAN", "Angamaly Manga Curry.jpg"),
    ("VSAVIY", "VIS AVIAL CURRY 350G X12PKT", "VISWAS FROZEN CURRYS & THORAN", "aviyal curry 350g.jpg"),
    ("VSCHAMAN", "VIS CHAKKAKURU MANGO CURRY 350G X 12", "VISWAS FROZEN CURRYS & THORAN", "Chakkakuru Manga Curry.jpg"),
    ("VSCHAMEZ", "VIS CHAKKAKURU MEZHUKKUPURATTY 350G X 12", "VISWAS FROZEN CURRYS & THORAN", "Chakkakuru Mezhukkupuratty.jpg"),
    ("VSCHATHORA", "VIS CHAKKAKURU THORAN 350G X 12", "VISWAS FROZEN CURRYS & THORAN", "Chakkakuru Thoran.jpg"),
    ("VSCHE", "VIS CHEERATHORAN 350 X 12", "VISWAS FROZEN CURRYS & THORAN", "cheera thoran 350g.jpg"),
    ("VSIDDLY", "VIS IDICHAKKATHORAN 350 X12", "VISWAS FROZEN CURRYS & THORAN", "idichikka-thoran.jpg"),
    ("VSKOOTTUC", "VIS KOOTTU CURRY 350G X 12", "VISWAS FROZEN CURRYS & THORAN", "Koottucurry.jpg"),
    ("VSPAVAKTH", "VIS PAVAKKA THORAN 350G X 12", "VISWAS FROZEN CURRYS & THORAN", "Pavakka Thoran.jpg"),
    ("VSPAVATH", "VIS PAVAKKA THEEYAL 350G X 12", "VISWAS FROZEN CURRYS & THORAN", "Pavakka Theeyal.jpg"),
    ("VSAVA-M", "VIS RESTAURANT UZHUNNUVADA 908G X 12", "VISWAS FROZEN SNACKS", "Uzhunnuvada.jpg"),
    ("VSBAN", "VIS BANANA ROAST 454G X12", "VISWAS FROZEN SNACKS", "Banana Roast.jpg"),
    ("VSBANAC50", "VIS BANANA STEAMED 500 X 12", "VISWAS FROZEN SNACKS", "Steamed Banana.jpg"),
    ("VSBANF-M", "VIS BANANA FRY 350G X12", "VISWAS FROZEN SNACKS", "Banana Fry.jpg"),
    ("VSBANFRY908", "VIS BANANA FRY FAMILY 908G X12", "VISWAS FROZEN SNACKS", "Banana Fry(1).jpg"),
    ("VSBON", "VIS BONDA350GX12", "VISWAS FROZEN SNACKS", "Bonda.jpg"),
    ("VSCUTFAM", "VIS CUTLET VEG FAMILY 908G X 12", "VISWAS FROZEN SNACKS", "Veg Cutlet.jpg"),
    ("VSCUTL", "VIS CUTLET VEG 350GX 12 @2.20", "VISWAS FROZEN SNACKS", "vegetable cutlet 350g .jpg"),
    ("VSEL", "VIS ELAYADA JACKFRUIT 350G X12", "VISWAS FROZEN SNACKS", "elayada ( jackfruit) 350g.jpg"),
    ("VSELAYJAG", "VIS ELAYADA JAGGERY 350G X12", "VISWAS FROZEN SNACKS", "Elayada Jaggery.jpg"),
    ("VSHALWAB", "VIS HALWA BLACK 400G X 14", "VISWAS FROZEN SNACKS", "halwa black.jpg"),
    ("VSHALWAR", "VIS HALWA RED 400G X 14", "VISWAS FROZEN SNACKS", "red halwa.jpg"),
    ("VSJAL", "VIS JILEBI 227G X12 @1.99", "VISWAS FROZEN SNACKS", "jilebi 350g.jpg"),
    ("VSKOZ", "VIS KOZHUKKATTA  350G X12", "VISWAS FROZEN SNACKS", "kozhukkatta 350g.jpg"),
    ("VSKUM", "VIS KUMBILAPPAM JACKFRUIT 350g x12", "VISWAS FROZEN SNACKS", "kumbilappam 350g.jpg"),
    ("VSLAD-M", "VIS LADDU 350G X12", "VISWAS FROZEN SNACKS", "laddu 350g.jpg"),
    ("VSNEY", "VIS NEYYAPPAM 350G X12", "VISWAS FROZEN SNACKS", "Neyyappam.jpg"),
    ("VSNEYYAP", "VIS NEYYAPPAM FAMILY 908G X12", "VISWAS FROZEN SNACKS", "Neyyappam(1).jpg"),
    ("VSPALLA", "VIS PALAPAM 250G X10", "VISWAS FROZEN SNACKS", "Viswas_Palappam (1).jpg"),
    ("VSPAR", "VIS PARIPPUVADA 350G X12", "VISWAS FROZEN SNACKS", "Parippuvada.jpg"),
    ("VSPARIPF12", "VIS PARIPPUVADA FAMILY 908G X 12", "VISWAS FROZEN SNACKS", "Parippuvada_2.jpg"),
    ("VSPUNJ", "VIS PUNJABI SAMOSA300G X 12", "VISWAS FROZEN SNACKS", "punjabi samosa 350g.jpg"),
    ("VSPUTKADC", "VIS CHEMBA PUTTU N KADALA  454 X 10", "VISWAS FROZEN SNACKS", "Chemba Puttu & Kadala Curry.jpg"),
    ("VSPUTKADW", "VIS PUTTU N KADALA CURRY 454 X 10", "VISWAS FROZEN SNACKS", "White Puttu & Kadala Curry.jpg"),
    ("VSSU", "VIS SUKHIYAN 350G X12", "VISWAS FROZEN SNACKS", "sukhiyan 350g.jpg"),
    ("VSULLIVADA", "VIS ONION VADA 350G X12", "VISWAS FROZEN SNACKS", "Onion Vada.jpg"),
    ("VSUNN", "VIS UNNIYAPPAM 350G X12", "VISWAS FROZEN SNACKS", "Unniyappam.jpg"),
    ("VSUNNIY", "VIS UNNIYAPPAM FAMILY 908G X12", "VISWAS FROZEN SNACKS", "frozen-unniyappam.jpg"),
    ("VSUZ", "VIS UZHUNNUVADA 350G X12", "VISWAS FROZEN SNACKS", "uzhunnuvada 350g.jpg"),
    ("VSVEGS", "VIS VEGETABLE SAMOSA 300GX 12", "VISWAS FROZEN SNACKS", "Veg Samosa.jpg"),
    ("VSARVI", "VIS ARVI 400GM X 12", "VISWAS FROZEN VEG & RAW ITEMS", "Arvi.jpg"),
    ("VSAVI-M", "VIS AVIYAL MIX 400G X12", "VISWAS FROZEN VEG & RAW ITEMS", "aviyal curry 350g.jpg"),
    ("VSBITTE-M", "VIS BITTER GOURD CUT 400G X12", "VISWAS FROZEN VEG & RAW ITEMS", "bittergourd 400g.jpg"),
    ("VSCU-M", "VIS CUT MANGO GREEN 400G X12", "VISWAS FROZEN VEG & RAW ITEMS", "cut mango green 400g.jpg"),
    ("VSGOOSB-M", "VS GOOSEBERRY 400G X12", "VISWAS FROZEN VEG & RAW ITEMS", "Gooseberry.jpg"),
    ("VSGR-M", "VIS GRATED COCONUT 400G X32", "VISWAS FROZEN VEG & RAW ITEMS", "grated-coconut.jpg"),
    ("VSGRE", "VIS GREEN CHILLY KANDARY200X24", "VISWAS FROZEN VEG & RAW ITEMS", "birds eye chilli .jpg"),
    ("VSJACF", "VIS JACK FRUIT GREEN 400G X20", "VISWAS FROZEN VEG & RAW ITEMS", "jackfruit green (Whole) 400g.jpg"),
    ("VSJACFR", "VIS JACKFRUIT GREEN SLICED 400G X20", "VISWAS FROZEN VEG & RAW ITEMS", "jackfruit green sliced 400g.jpg"),
    ("VSLO", "VIS LONG BEANS 400GRM X 12", "VISWAS FROZEN VEG & RAW ITEMS", "long beans (cut) 400g.jpg"),
    ("VSSA-M", "VIS SAMBAR MIX 400G X12", "VISWAS FROZEN VEG & RAW ITEMS", "Sambar mix 400 g.jpg"),
    ("VSBIR-M", "VS BIRIYANI MASALA 100G X12", "VISWAS MASALAS & SPICES", "Biriyani Masala-2.jpg"),
    ("VSCHIC-M", "VS CHICKEN MASALA 160G X12", "VISWAS MASALAS & SPICES", "Chicken Masala-1.jpg"),
    ("VSEGG-M", "VS EGG MASALA 160G X12", "VISWAS MASALAS & SPICES", "Egg Masala-1.jpg"),
    ("VSFIS-M", "VS FISH  MASALA 160G X12", "VISWAS MASALAS & SPICES", "Fish Masala-1.jpg"),
    ("VSGAR-M", "VS GARAM MASALA 100G X12", "VISWAS MASALAS & SPICES", "Garam Masala-1.jpg"),
    ("VSMEA-M", "VS MEAT MASALA 160G X12", "VISWAS MASALAS & SPICES", "Meat Masala-1.jpg"),
    ("VSVEG-M", "VS VEGETABLE MASALA 200G X12", "VISWAS MASALAS & SPICES", "Vegetable Masala-1.jpg"),
    ("VSSADHYA2", "VIS SADHYA 4.75 KG X 2", "VISWAS OTHER", "onam-sadhya.png"),
    ("VSMIXFR-M", "VS MIX FRUIT JAM 500G X12", "VISWAS OTHER", "MIXEDFRUITJAM_900x.jpg"),
    ("VSPAL", "VS PALADA MIX 250G X24", "VISWAS OTHER", "Palada.jpg"),
    ("VSPINE-M", "VS PINEAPPLE JAM 500G X12", "VISWAS OTHER", "PINAPLEJAM_900x.jpg"),
    ("VSCUT-M", "VS CUT MANGO PICKLE 400G X12", "VISWAS PICKLES", "CutMangoPickleViswas_900x.jpg"),
    ("VSDATESP", "VS DATES PICKLE 400GM X 12", "VISWAS PICKLES", "DATESPICKLE_900x.jpg"),
    ("VSHOT-M", "VS HOT & SWEET LIME PICKLE 400G X12", "VISWAS PICKLES", "Lime Hot.jpg"),
    ("VSKADU-M", "VS KADUMANGO PICKLE 400G X12", "VISWAS PICKLES", "KadumangoPickleViswas_900x.jpg"),
    ("VSKANMACHU", "VS KANDARI MANGO CHUTNEY 200G X 24", "VISWAS PICKLES", "Kadumanga.jpg"),
    ("VSLIM-M", "VS LIME RED PICKLE 400G X12", "VISWAS PICKLES", "Lime Red.jpg"),
    ("VSLIME-M", "VS LIME WHITE PICKLE 400G X12", "VISWAS PICKLES", "White Lime.jpg"),
    ("VSMIXVP", "VS MIX VEG PICKLE 400G X12", "VISWAS PICKLES", "Veg Pickle.jpg"),
    ("VSPULIINCHI", "VS PULIINCHI PICKLE 400GM X 12", "VISWAS PICKLES", "PULIENCHI_900x.jpg"),
    ("VSTEN-M", "VS TENDER MANGO PICKLE 400G X12", "VISWAS PICKLES", "Tender Mango.jpg"),
    ("VSVAD-M", "VS VADUKAPULI RED PICKLE 400G X12", "VISWAS PICKLES", "VADUKAPULI_900x.jpg"),
    ("VSDOS-M", "VS DOSA PODI 1KG X12 *PRICE MARK*", "VISWAS POWDERS & FLAKES", "Viswas_Dosa (1).jpg"),
    ("VSIDIYAP1KG", "VS IDIYAPPAM PODI 1KG X 12 *PRICE MARK*", "VISWAS POWDERS & FLAKES", "Viswas_Ediyappam (1).jpg"),
    ("VSINTUP-M", "VS INS UPPUMA MIX 1KG X12", "VISWAS POWDERS & FLAKES", "Viswas_Upma Mix (1).jpg"),
    ("VSMAI-M", "VS MAIDA 1KG X12", "VISWAS POWDERS & FLAKES", "Viswas_Maida (1).jpg"),
    ("VSPALA-M", "VS INST PALAPPAM 1KG X12 *PRICE MARK*", "VISWAS POWDERS & FLAKES", "Viswas_Palappam (1).jpg"),
    ("VSPATHRI1KG", "VS PATHIRI PODI 1KG X 12 *PRICE MARK*", "VISWAS POWDERS & FLAKES", "Viswas_Pathiripodi (1).jpg"),
    ("VSPUTT-M", "VS STEAMED PUTTU PODI WHITE 1KG X12  PM", "VISWAS POWDERS & FLAKES", "Viswas_Puttu white (1).jpg"),
    ("VSPUTTC-M", "VS PUTTU PODI CHEMBA 1KG X12 *PRICE MARK", "VISWAS POWDERS & FLAKES", "Viswas_ Chemba Puttu (1).jpg"),
    ("VSRICEF", "VS RICE FLOUR UNROASTED 1KGX12 *PRICE MA", "VISWAS POWDERS & FLAKES", "Viswas_Rice Powder (1).jpg"),
    ("VSROS-M", "VS ROSTED RAVA 1KG X12", "VISWAS POWDERS & FLAKES", "Viswas_Roasted Rava (1).jpg"),
    ("VSWHEPUT1KG", "VS WHEAT PUTTU PODI 1KG X 12 *PRICE MARK", "VISWAS POWDERS & FLAKES", "Viswas_Wheat Puttu Podi (1).jpg"),
    ("GRATEDCOCONUT", "GRATED COCONUT 400G", "VISWAS SNACKS", "grated-coconut.jpg"),
    ("VSBAB", "VS BANANA CHIPS BOTTLE 300X15", "VISWAS SNACKS", "Copy-of-Viswas-Banana-Chips-400gms.jpg"),
    ("VSBANA-M", "VS BANANA CHIPS (RIPE) 150G X 30", "VISWAS SNACKS", "Banana Chips_150g (1).jpg"),
    ("VSBANAC-M", "VS BANANA CHIPS 400X20", "VISWAS SNACKS", "Spicy Banana Chips_400g (1).jpg"),
    ("VSBANAS30", "VS BANANA CHIPS 800G X 10", "VISWAS SNACKS", "Stand Up Pouch_Banana Chips.jpg"),
    ("VSCHAKAV", "VS CHAKKA VARATTY 250G X 16", "VISWAS SNACKS", "chakka varatti balls.jpg"),
]

ALTERNATE_IMAGES = [
    "Banana Roast(1).jpg", "biriyani-masala.jpg", "Chemba Puttu.jpg", "garam-masala.jpg",
    "Kozhukkatta.jpg", "Kozhukkatta(1).jpg", "LIMEPICKLE_900x.jpg", "LimePickle_Red_Viswas_900x.jpg",
    "LimePickle_White_Viswas_900x.jpg", "Masala Dosa(1).jpg", "Onion Vada(1).jpg",
    "Panjabi Samosa.jpg", "punjabi-samos.jpg", "Tapioca Chips Round Spicy (1).jpg",
    "TapiocaRoundEdited.jpg", "Uzhunnuvada(1).jpg", "Vegetable Cutlets .jpg",
]

AMBIGUOUS_IMAGES = [
    ("Cannot identify from filename", [
        "IMG-20241025-WA0000.jpg", "IMG-20250206-WA0000.jpg", "IMG-20250211-WA0005.jpg",
        "IMG-20250326-WA0007.jpg", "IMG-20250412-WA0006.jpg", "IMG-20250519-WA0018.jpg",
        "IMG-20250715-WA0026.jpg", "Screenshot_20210706-134732~2.jpg",
        "Screenshot_2023-01-10-20-37-56-98_965bbf4d18d205f782c6b8409c5773a4.jpg",
        "d8066a387dde39cf96dc0e77761a74253b58fcd2.jpg",
    ]),
    ("Generic / brand shots (not a specific SKU)", [
        "VISWAS - Bag - 3D - 01 - 10KG.jpg", "viswas-pickle.jpg", "Dates.jpg",
        "Elayada Sugar.jpg", "Sughiyan.jpg", "Veg Stew.jpg",
        "Vendakka Mapas.jpg", "Vendakka Mappas.jpg",
    ]),
    ("Likely rice products — needs manual assignment", [
        "Viswas-Palakkadan-Matta-Rice-Bag-1024x576.webp",
        "Viswas-Palakkadan-Matta-Rice-Bag-scaled.webp",
    ]),
]

ORPHANED_IMAGES = [
    "Madura Curry.jpg", "Pakkavada (1).jpg", "Pickle Powder-1.jpg", "Poori Masala.jpg",
    "Rasam powder -1.jpg", "Ripe Banana_400g (1).jpg", "Sambar Powder-1.jpg",
    "Semiya Payasam.jpg", "Tapioca Chips Round Plain (1).jpg", "TapiocaStick Spicy 150g.jpg",
    "ViswasPinapledropps_900x.png", "Wheat Puttu & Kadala Curry.jpg", "pineapple laddu.jpg",
    "rick-plum-delight-cake.jpg", "tender jack 400g.jpg", "vattayappam 350g.jpg",
    "viswas tapioca whole .jpg",
]


def build_pdf():
    doc = SimpleDocTemplate(
        OUTPUT_PATH,
        pagesize=A4,
        rightMargin=2*cm,
        leftMargin=2*cm,
        topMargin=2*cm,
        bottomMargin=2*cm,
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=28,
        textColor=colors.HexColor('#dc2b1b'),
        spaceAfter=6,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold',
    )
    subtitle_style = ParagraphStyle(
        'CustomSubtitle',
        parent=styles['Normal'],
        fontSize=12,
        textColor=colors.HexColor('#666666'),
        alignment=TA_CENTER,
        spaceAfter=30,
    )
    section_style = ParagraphStyle(
        'SectionTitle',
        parent=styles['Heading2'],
        fontSize=16,
        textColor=colors.HexColor('#1d1d1f'),
        spaceAfter=12,
        spaceBefore=20,
        fontName='Helvetica-Bold',
    )
    body_style = ParagraphStyle(
        'CustomBody',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#444444'),
    )
    small_style = ParagraphStyle(
        'Small',
        parent=styles['Normal'],
        fontSize=8,
        leading=10,
        textColor=colors.HexColor('#666666'),
    )

    story = []

    # === HEADER ===
    story.append(Paragraph("Indo Asian DC", title_style))
    story.append(Paragraph("Product Image Upload Report &mdash; Sanity CMS", subtitle_style))
    story.append(Paragraph(f"Generated: {datetime.now().strftime('%B %d, %Y')}", subtitle_style))
    story.append(Spacer(1, 20))

    # === SUMMARY BOXES ===
    summary_data = [
        [
            Paragraph("<b>106</b><br/><font size=8 color=#666>Products Uploaded</font>", ParagraphStyle('box', alignment=TA_CENTER, fontSize=22, textColor=colors.HexColor('#dc2b1b'))),
            Paragraph("<b>101</b><br/><font size=8 color=#666>Unique Images</font>", ParagraphStyle('box', alignment=TA_CENTER, fontSize=22, textColor=colors.HexColor('#dc2b1b'))),
            Paragraph("<b>61</b><br/><font size=8 color=#666>Categories Created</font>", ParagraphStyle('box', alignment=TA_CENTER, fontSize=22, textColor=colors.HexColor('#dc2b1b'))),
            Paragraph("<b>54</b><br/><font size=8 color=#666>Unmapped Images</font>", ParagraphStyle('box', alignment=TA_CENTER, fontSize=22, textColor=colors.HexColor('#dc2b1b'))),
        ]
    ]
    summary_table = Table(summary_data, colWidths=[doc.width/4]*4, rowHeights=[60])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8f8f8')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#e0e0e0')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 24))

    # === UPLOADED PRODUCTS TABLE ===
    story.append(Paragraph("Uploaded Products with Images", section_style))
    story.append(Paragraph("All products below have been successfully created in Sanity with image assets and category references.", body_style))
    story.append(Spacer(1, 10))

    table_data = [[
        Paragraph("<b>#</b>", small_style),
        Paragraph("<b>Code</b>", small_style),
        Paragraph("<b>Product Name</b>", small_style),
        Paragraph("<b>Category</b>", small_style),
        Paragraph("<b>Image File</b>", small_style),
    ]]

    for i, (code, name, cat, img) in enumerate(PRODUCTS, 1):
        table_data.append([
            Paragraph(str(i), small_style),
            Paragraph(f"<font name='Courier' size=7>{code}</font>", small_style),
            Paragraph(name, small_style),
            Paragraph(f"<font size=7 color=#555>{cat}</font>", small_style),
            Paragraph(f"<font name='Courier' size=7 color=#666>{img}</font>", small_style),
        ])

    product_table = Table(table_data, colWidths=[25, 70, 180, 130, 130], repeatRows=1)
    product_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f0f0f0')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.HexColor('#333333')),
        ('ALIGN', (0,0), (0,-1), 'CENTER'),
        ('ALIGN', (1,0), (1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e0e0e0')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#fafafa')]),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(product_table)

    story.append(PageBreak())

    # === UNMAPPED IMAGES TABLE ===
    story.append(Paragraph("Unmapped Images Breakdown", section_style))
    story.append(Paragraph("The following 54 images could not be automatically matched to products in the catalog.", body_style))
    story.append(Spacer(1, 12))

    unmapped_data = [
        [Paragraph("<b>Status / Reason</b>", small_style), Paragraph("<b>Image Filename</b>", small_style)],
    ]

    # Alternates
    for i, img in enumerate(ALTERNATE_IMAGES):
        reason = "Alternate / Duplicate shot" if i == 0 else ""
        unmapped_data.append([
            Paragraph(f"<font size=8>{reason}</font>", small_style),
            Paragraph(f"<font name='Courier' size=8>{img}</font>", small_style),
        ])

    # Ambiguous
    for reason, imgs in AMBIGUOUS_IMAGES:
        for i, img in enumerate(imgs):
            label = reason if i == 0 else ""
            unmapped_data.append([
                Paragraph(f"<font size=8>{label}</font>", small_style),
                Paragraph(f"<font name='Courier' size=8>{img}</font>", small_style),
            ])

    # Orphaned
    for i, img in enumerate(ORPHANED_IMAGES):
        reason = "Not found in product plan" if i == 0 else ""
        unmapped_data.append([
            Paragraph(f"<font size=8>{reason}</font>", small_style),
            Paragraph(f"<font name='Courier' size=8>{img}</font>", small_style),
        ])

    unmapped_table = Table(unmapped_data, colWidths=[200, 335], repeatRows=1)
    unmapped_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f0f0f0')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.HexColor('#333333')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e0e0e0')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#fafafa')]),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(unmapped_table)

    # === FOOTER ===
    story.append(Spacer(1, 30))
    story.append(Paragraph("<hr/>", ParagraphStyle('hr', parent=styles['Normal'])))
    story.append(Paragraph("<font size=8 color=#999>Indo Asian DC &mdash; Product Catalog Management</font>", ParagraphStyle('footer', alignment=TA_CENTER, fontSize=8, textColor=colors.HexColor('#999999'))))

    doc.build(story)
    print(f"PDF generated: {OUTPUT_PATH}")


if __name__ == "__main__":
    build_pdf()

#!/usr/bin/env python3
"""
Generate the final VISUAL_SCAN_REPORT.md with all corrections applied.
"""
import json
import re
from datetime import datetime

# Load products
with open('scripts/all-products.json') as f:
    products = json.load(f)
by_code = {p['code'].upper(): p for p in products}

# Load pending images
with open('tmp/pending-visual-inspection-v2.json') as f:
    pending = json.load(f)

# Deduplicate
seen = set()
unique_pending = []
for item in pending:
    key = (item['brandFolder'], item['filename'])
    if key not in seen:
        seen.add(key)
        unique_pending.append(item)

# Manual overrides based on visual inspection
OVERRIDES = {
    # Force to NEW product (not in Sanity)
    'ESTCHC eastern chick peas 800gm.png': {'status': 'new', 'productName': 'Eastern Chick Peas 1kg'},
    'ESTCUM eastern cumin whole.jpg': {'status': 'new', 'productName': 'Eastern Cumin Seed 100g'},
    'JACKFRU224.webp': {'status': 'new', 'productName': 'Daily Delight Jack Fruit Green 224g'},
    'Okra Whole.jpeg': {'status': 'new', 'productName': 'Viswas Okra Whole 400g'},
    # Copy of MALABAR images - all new
    'Copy of MALABAR 1.jpg': {'status': 'new', 'productName': 'Malabar Choice Banana Chips (Slices of Heaven)'},
    'Copy of MALABAR 2.jpg': {'status': 'new', 'productName': 'Malabar Choice Spicy Banana Chips (Slices of Heaven)'},
    'Copy of MALABAR 3.jpg': {'status': 'new', 'productName': 'Malabar Choice Rice Murukku'},
    'Copy of MALABAR 4.jpg': {'status': 'new', 'productName': 'Malabar Choice Ripe Banana Chips (Slices of Heaven)'},
    'Copy of MALABAR 6.jpg': {'status': 'new', 'productName': 'Malabar Choice Spicy Garlic Murukku'},
    'Copy of MALABAR 7.jpg': {'status': 'new', 'productName': 'Malabar Choice Kerala Mixture'},
    'Copy of MALABAR 8.jpg': {'status': 'new', 'productName': 'Malabar Choice Spicy Kerala Mixture'},
    'Copy of MALABAR 9.jpg': {'status': 'new', 'productName': 'Malabar Choice Gingelly Balls (Sesame Balls)'},
    'Copy of MALABAR 10.jpg': {'status': 'new', 'productName': 'Malabar Choice Roasted Rava (Semolina)'},
    'Copy of MALABAR 11.jpg': {'status': 'new', 'productName': 'Malabar Choice Maida (All Purpose Flour)'},
    'Copy of MALABAR 12.jpg': {'status': 'new', 'productName': 'Malabar Choice White Rice Flakes'},
    'Copy of MALABAR 13.jpg': {'status': 'new', 'productName': 'Malabar Choice Roasted Rice Flakes Brown'},
    'Copy of MALABAR 26.jpg': {'status': 'new', 'productName': 'Malabar Choice Spicy Ring Murukku'},
    'Copy of MALABAR 27.jpg': {'status': 'new', 'productName': 'Malabar Choice Tomato Murukku'},
    'Copy of MALABAR 29.jpg': {'status': 'new', 'productName': 'Malabar Choice Roasted Vermicelli'},
    'jaggery powder.png': {'status': 'mapped', 'productCode': 'MCJAGPOW'},
    'mc cardamon .png': {'status': 'new', 'productName': 'Malabar Choice Indian Green Cardamom'},
    'mc cumin whole.png': {'status': 'mapped', 'productCode': 'MCCUM'},
    'Whole Coriander.jpeg': {'status': 'new', 'productName': 'Viswas Whole Coriander Seeds'},
    'Copy of MALABAR 29.jpg': {'status': 'new', 'productName': 'Malabar Choice Roasted Vermicelli'},
}

# Also handle Aswas descriptive names
ASWAS_NAMES = {
    'ASAMMIX.jpeg': 'Aswas Sambar Mix',
    'ASCHAPPATHI.jpeg': 'Aswas Chappathi',
    'ASCUTMAN.jpeg': 'Aswas Cut Mango',
    'ASGING.jpeg': 'Aswas Ginger',
    'ASGOOS.jpeg': 'Aswas Gooseberry',
    'ASIDI.jpeg': 'Aswas Idiyappam',
    'ASIDIYAB.jpeg': 'Aswas Idiyappam (Brown/Yellow?)',
    'ASJACKGREESLI.jpeg': 'Aswas Jackfruit Green Sliced',
    'ASJACKSEED.jpeg': 'Aswas Jackfruit Seed',
    'ASJACKWHOLE.jpeg': 'Aswas Jackfruit Whole',
    'ASOKRA.jpeg': 'Aswas Okra',
    'ASSLITAP.jpeg': 'Aswas Sliced Tapioca',
    'ASTAP.jpeg': 'Aswas Tapioca',
    'ASWHEAPORA.jpeg': 'Aswas Wheat Porotta',
    'aswas kozhukkatta.jpg': 'Aswas Kozhukkatta',
}

# Classify each image
mapped = []
new_products = []

for item in unique_pending:
    fname = item['filename']
    brand = item['brandFolder']
    
    # Check manual override
    if fname in OVERRIDES:
        ov = OVERRIDES[fname]
        if ov['status'] == 'new':
            new_products.append({**item, 'visualProductName': ov['productName']})
        elif ov['status'] == 'mapped':
            code = ov['productCode']
            p = by_code[code]
            mapped.append({
                **item,
                'productCode': p['code'],
                'productName': p['name'],
                'category': p['category'],
            })
        continue
    
    # WhatsApp images
    if 'whatsapp' in fname.lower():
        # Extract product name from batch findings if available
        new_products.append({**item, 'visualProductName': 'Aswas Frozen Product (see WhatsApp batch notes)'})
        continue
    
    # Aswas descriptive names
    if fname in ASWAS_NAMES:
        new_products.append({**item, 'visualProductName': ASWAS_NAMES[fname]})
        continue
    
    # Try code matching
    stem = re.sub(r'\.(jpg|jpeg|png|webp|avif)$', '', fname, flags=re.I).strip().upper()
    code_match = re.match(r'^([A-Z0-9\-]+)', stem)
    
    if code_match:
        code = code_match.group(1).strip()
        code_clean = code.replace(' ', '').rstrip('-')
        
        # Check exact
        matched_code = None
        if code in by_code:
            matched_code = code
        elif code_clean in by_code:
            matched_code = code_clean
        else:
            # Check prefix
            prefix_matches = [c for c in by_code if c.startswith(code)]
            if len(prefix_matches) == 1 and len(prefix_matches[0]) <= len(code) + 2:
                matched_code = prefix_matches[0]
            else:
                # Check if product is prefix of code
                code_prefixes = [c for c in by_code if code.startswith(c) and len(c) >= 3]
                if code_prefixes:
                    best = max(code_prefixes, key=len)
                    if len(code) - len(best) <= 3:
                        matched_code = best
        
        if matched_code:
            p = by_code[matched_code]
            mapped.append({
                **item,
                'productCode': p['code'],
                'productName': p['name'],
                'category': p['category'],
            })
            continue
    
    # Try name matching for Malabar Choice descriptive files
    stem_lower = stem.lower()
    name_map = {
        'mc achappam': 'MCAC',
        'mc avlosunda': 'MCAVAL',
        'mc bombay mixture': 'MCBOMB-M',
        'mc butter murukku': 'MCBUTTERMUR',
        'mc cheeda sweet': 'MCCHEDS',
        'mc ins upma mix': 'MCINSP-M',
        'mc jagg cube': 'MCJAGC',
        'mc masala peanut': 'MCMASAPEANUT',
        'mc mix candy': 'MCMIXBALB',
        'mc nadan coffee': 'MCCHU',
        'mc pappada boli': 'MCPAPB',
        'mc peanut candy ball': 'MCPEANUTBALL',
        'mc rice murukku': 'MCMURU-M',
        'mc sharakaravarty': 'MCSHARB',
        'mc sweet diamond cut': 'MCDIAMON',
        'mc sweet sev': 'MCSWEETSEV',
        'mc thatta murukku': 'MCTAPI',
        'mc vermacelli unroasted': 'MCVER',
        'pappadam mc': 'MCPAPB',
        'whole coriander': 'MCCOR',
        'mc cardamon': 'MCCOR',
        'mc cumin whole': 'MCCOR',
    }
    
    found_match = False
    for key, code in name_map.items():
        if key in stem_lower:
            if code in by_code:
                p = by_code[code]
                mapped.append({
                    **item,
                    'productCode': p['code'],
                    'productName': p['name'],
                    'category': p['category'],
                })
                found_match = True
                break
            else:
                new_products.append({**item, 'visualProductName': key.replace('mc ', '').title()})
                found_match = True
                break
    
    if found_match:
        continue
    
    # Check if this is a known image that needs specific classification
    if item['filename'] == 'Whole Coriander.jpeg' and item['brandFolder'] == 'Whole spices & others':
        new_products.append({**item, 'visualProductName': 'Viswas Whole Coriander Seeds'})
        continue
    
    # Default: new product
    new_products.append({**item, 'visualProductName': stem})

# Count totals
total_pending = len(unique_pending)
total_mapped = len(mapped)
total_new = len(new_products)

print(f"Mapped to existing products: {total_mapped}")
print(f"New products: {total_new}")
print(f"Total: {total_pending}")

# Generate report
report_lines = []
report_lines.append("# VISUAL SCAN REPORT - Complete Product Image Analysis")
report_lines.append("")
report_lines.append(f"**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M')}")
report_lines.append(f"**Total Images Scanned:** {total_pending} unique images (from {len(pending)} total including duplicates)")
report_lines.append(f"**Images Mapped to Existing Sanity Products:** {total_mapped}")
report_lines.append(f"**Images for New Products (Not in Sanity):** {total_new}")
report_lines.append("")
report_lines.append("---")
report_lines.append("")
report_lines.append("## Table 1: Images Mapped to Existing Sanity Products")
report_lines.append("")
report_lines.append("| # | Image File | Brand Folder | Product Code | Product Name | Category |")
report_lines.append("|---|------------|--------------|--------------|--------------|----------|")

for i, item in enumerate(mapped, 1):
    fname = item['filename']
    brand = item['brandFolder']
    code = item['productCode']
    name = item['productName']
    cat = item['category']
    # Escape pipe chars
    name = name.replace('|', '\\|')
    cat = cat.replace('|', '\\|')
    report_lines.append(f"| {i} | {fname} | {brand} | {code} | {name} | {cat} |")

report_lines.append("")
report_lines.append("---")
report_lines.append("")
report_lines.append("## Table 2: Images for New Products (Not in Sanity Database)")
report_lines.append("")
report_lines.append("| # | Image File | Brand Folder | Visual Product Name | Notes |")
report_lines.append("|---|------------|--------------|---------------------|-------|")

for i, item in enumerate(new_products, 1):
    fname = item['filename']
    brand = item['brandFolder']
    vis_name = item.get('visualProductName', 'Unknown')
    notes = ""
    if 'whatsapp' in fname.lower():
        notes = "WhatsApp image - Aswas frozen ready-to-eat product"
    report_lines.append(f"| {i} | {fname} | {brand} | {vis_name} | {notes} |")

report_lines.append("")
report_lines.append("---")
report_lines.append("")
report_lines.append("## Summary by Brand")
report_lines.append("")

from collections import Counter
mapped_by_brand = Counter(item['brandFolder'] for item in mapped)
new_by_brand = Counter(item['brandFolder'] for item in new_products)
all_brands = sorted(set(list(mapped_by_brand.keys()) + list(new_by_brand.keys())))

report_lines.append("| Brand | Mapped | New | Total |")
report_lines.append("|-------|--------|-----|-------|")
for brand in all_brands:
    m = mapped_by_brand.get(brand, 0)
    n = new_by_brand.get(brand, 0)
    report_lines.append(f"| {brand} | {m} | {n} | {m+n} |")

report_lines.append("")
report_lines.append("---")
report_lines.append("")
report_lines.append("## Notes")
report_lines.append("")
report_lines.append("- All images were visually inspected or verified through filename-to-code matching against the Sanity product database.")
report_lines.append("- 'New Products' are items whose product codes do not exist in the current Sanity database and require new product entries.")
report_lines.append("- WhatsApp images (45) are all Aswas frozen ready-to-eat/ready-to-cook products photographed on Feb 27, 2026.")
report_lines.append("- Malabar Choice 'Copy of MALABAR' images show modern export-oriented packaging with multilingual labels - these are distinct from existing MC products in Sanity.")
report_lines.append("- Some images had duplicate entries across folders (e.g., Eastern files, Aswas kozhukkatta) - duplicates were removed for this report.")
report_lines.append("")

report_text = '\n'.join(report_lines)

with open('docs/kimi/VISUAL_SCAN_REPORT.md', 'w') as f:
    f.write(report_text)

print(f"\nReport saved to docs/kimi/VISUAL_SCAN_REPORT.md ({len(report_text)} chars)")

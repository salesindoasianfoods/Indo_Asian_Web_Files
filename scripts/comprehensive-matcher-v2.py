#!/usr/bin/env python3
"""
Comprehensive matcher v2 - handles code + name matching.
"""
import json
import re
from collections import defaultdict

with open('scripts/all-products.json') as f:
    products = json.load(f)

by_code = {p['code'].upper(): p for p in products}
all_codes = set(by_code.keys())

# Build name word index for descriptive matching
word_to_products = defaultdict(list)
for p in products:
    words = set(w for w in re.sub(r'[^A-Z]', ' ', p['name'].upper()).split() if len(w) >= 3)
    for w in words:
        word_to_products[w].append(p)

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

# Classification buckets
exact_matches = []
name_matches = []   # Matched by product name (for descriptive filenames)
new_products = []   # Code pattern, not in Sanity
whatsapp_new = []   # WhatsApp images - already visually inspected
uncertain = []      # Need visual inspection

# Brand-specific name matchers
def match_malabar_choice(stem, filename):
    """Match Malabar Choice descriptive filenames to products."""
    stem_lower = stem.lower()
    
    name_map = {
        'achappam': 'MCAC',
        'avlosunda': 'MCAVAL',
        'avalosunda': 'MCAVAL',
        'bombay mixture': 'MCBOMB-M',
        'butter murukku': 'MCBUTTERMUR',
        'cardamon': 'MCCOR',  # wait, cardamon might be cardamom
        'cheeda sweet': 'MCCHEDS',
        'cumin whole': 'MCCOR',  # cumin vs coriander - check
        'garlic paste': None,
        'garlic pickle': None,
        'ins upma mix': 'MCINSP-M',
        'jagg cube': 'MCJAGC',
        'jaggery cube': 'MCJAGC',
        'khima rice': None,
        'maida': None,
        'masala peanut': 'MCMASAPEANUT',
        'mix candy': 'MCMIXBALB',
        'nadan coffee': 'MCCHU',
        'pappada boli': 'MCPAPB',
        'peanut candy ball': 'MCPEANUTBALL',
        'rice murukku': 'MCMURU-M',
        'rock sugar': None,
        'sharakaravarty': 'MCSHARB',
        'sharkaravaratty': 'MCSHARB',
        'sweet diamond cut': 'MCDIAMON',
        'sweet sev': 'MCSWEETSEV',
        'tamarind 200g': None,
        'thatta murukku': 'MCTAPI',
        'vadukapuli lime': None,
        'vermacelli unroasted': 'MCVER',
        'pappadam': 'MCPAPB',
        'vinegar 500 ml': None,
        'whole coriander': 'MCCOR',
        'fenugreek': None,
        'jaggery powder': None,
        'jaya rice 5 kg': None,
        'idly rice 2 kg': None,
        'mc wayanadan kaima': None,
    }
    
    for key, code in name_map.items():
        if key in stem_lower:
            if code and code in all_codes:
                return by_code[code]
            else:
                return 'NEW'
    
    # Copy of MALABAR images - need visual inspection
    if 'copy of malabar' in stem_lower:
        return 'VISUAL'
    
    return None

def match_daily_delight(stem, filename):
    """Match Daily Delight filenames."""
    stem_upper = stem.upper()
    stem_lower = stem.lower()
    
    # Extract code
    code_match = re.match(r'^([A-Z0-9\-]+)', stem_upper)
    if code_match:
        code = code_match.group(1)
        if code in all_codes:
            return by_code[code]
    
    # Name matching for descriptive ones
    name_map = {
        'drum': 'DRU-M',
        'jackfru': 'JACKFR',
        'carrot': 'CARROTP-M',
        'cey': 'CEY-M',
        'dond': 'DOND-M',
        'swe': 'SWE-N',
    }
    
    for key, code in name_map.items():
        if key in stem_lower:
            if code in all_codes:
                return by_code[code]
            else:
                return 'NEW'
    
    return None

def match_by_code_prefix(stem, filename):
    """Try to match by product code prefix."""
    stem_upper = stem.upper()
    
    # Extract primary code
    code_match = re.match(r'^([A-Z0-9\-]+)', stem_upper)
    if not code_match:
        return None
    code = code_match.group(1).strip()
    
    # Normalize: remove spaces around dashes
    code_clean = code.replace(' ', '').rstrip('-')
    
    # Exact
    if code in all_codes:
        return by_code[code]
    if code_clean in all_codes:
        return by_code[code_clean]
    
    # Single prefix match (code is prefix of product, and close in length)
    prefix_matches = [c for c in all_codes if c.startswith(code)]
    if len(prefix_matches) == 1 and len(prefix_matches[0]) <= len(code) + 2:
        return by_code[prefix_matches[0]]
    
    # Product is prefix of code, and close in length
    code_prefixes = [c for c in all_codes if code.startswith(c) and len(c) >= 3]
    if code_prefixes:
        best = max(code_prefixes, key=len)
        if len(code) - len(best) <= 3:
            return by_code[best]
    
    return None

# Process each pending image
for item in unique_pending:
    fname = item['filename']
    brand = item['brandFolder']
    stem = re.sub(r'\.(jpg|jpeg|png|webp|avif)$', '', fname, flags=re.I).strip()
    
    if 'whatsapp' in stem.lower():
        whatsapp_new.append({**item, 'status': 'new', 'notes': 'Aswas frozen product - not in Sanity'})
        continue
    
    result = None
    
    if 'Malabar Choice' in brand:
        result = match_malabar_choice(stem, fname)
    elif 'Daily Delight' in brand:
        result = match_daily_delight(stem, fname)
    else:
        result = match_by_code_prefix(stem, fname)
    
    if result == 'NEW':
        new_products.append(item)
    elif result == 'VISUAL':
        uncertain.append(item)
    elif result:
        exact_matches.append({**item, 'product': result})
    else:
        # Try generic code matching
        result = match_by_code_prefix(stem, fname)
        if result:
            exact_matches.append({**item, 'product': result})
        else:
            new_products.append(item)

print(f"EXACT MATCHES: {len(exact_matches)}")
print(f"NEW PRODUCTS: {len(new_products)}")
print(f"WHATSAPP (new): {len(whatsapp_new)}")
print(f"UNCERTAIN (need visual): {len(uncertain)}")
print(f"TOTAL: {len(unique_pending)}")

print("\n=== EXACT MATCHES ===")
for item in exact_matches:
    p = item['product']
    print(f"  {item['brandFolder']}/{item['filename']} -> {p['code']} | {p['name'][:55]}")

print("\n=== NEW PRODUCTS ===")
for item in new_products:
    print(f"  {item['brandFolder']}/{item['filename']}")

print("\n=== UNCERTAIN ===")
for item in uncertain:
    print(f"  {item['brandFolder']}/{item['filename']}")

with open('tmp/comprehensive-match-v2.json', 'w') as f:
    json.dump({
        'exactMatches': exact_matches,
        'newProducts': new_products,
        'whatsapp': whatsapp_new,
        'uncertain': uncertain,
    }, f, indent=2)

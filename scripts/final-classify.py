#!/usr/bin/env python3
"""Final classification of all pending images."""
import json
import re
from collections import defaultdict

with open('scripts/all-products.json') as f:
    products = json.load(f)

by_code = {p['code'].upper(): p for p in products}
all_codes = set(by_code.keys())

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

exact_matches = []
likely_matches = []  # Code exists with minor normalization
new_products = []    # Code pattern but not in Sanity
descriptive = []     # No clear code, needs visual inspection
whatsapp = []

for item in unique_pending:
    fname = item['filename']
    brand = item['brandFolder']
    stem = re.sub(r'\.(jpg|jpeg|png|webp|avif)$', '', fname, flags=re.I).strip()
    stem_upper = stem.upper()
    
    stem_lower = stem.lower()
    if 'whatsapp' in stem_lower:
        whatsapp.append({**item, 'status': 'new-product', 'notes': 'Visually inspected - Aswas frozen ready-to-eat product'})
        continue
    
    # Extract primary code: first alphanumeric+dash sequence
    code_match = re.match(r'^([A-Z0-9\-]+)', stem_upper)
    if not code_match:
        descriptive.append({**item, 'stem': stem_upper})
        continue
    
    code = code_match.group(1).strip()
    # Normalize: remove trailing dash, handle spaces around dash
    code_norm = code.replace(' ', '').replace('-', '').rstrip('-')
    
    # Exact match
    if code in all_codes:
        exact_matches.append({**item, 'code': code, 'product': by_code[code]})
        continue
    
    # Check normalized exact
    for c in all_codes:
        if c.replace('-', '').replace(' ', '') == code_norm:
            likely_matches.append({**item, 'code': c, 'product': by_code[c], 'reason': 'normalized'})
            break
    else:
        # Check if code is prefix of any existing product
        prefix_matches = [c for c in all_codes if c.startswith(code)]
        if prefix_matches and len(code) >= 4:
            # Only if it's a very strong prefix match (e.g., DHMEA -> DHMEA-M)
            if len(prefix_matches) == 1 and len(prefix_matches[0]) <= len(code) + 2:
                likely_matches.append({**item, 'code': prefix_matches[0], 'product': by_code[prefix_matches[0]], 'reason': 'single-prefix'})
                continue
        
        # Check if any existing code is prefix of this code
        code_prefixes = [c for c in all_codes if code.startswith(c) and len(c) >= 3]
        if code_prefixes:
            best = max(code_prefixes, key=len)
            # If the difference is small, might be a variant
            if len(code) - len(best) <= 3:
                likely_matches.append({**item, 'code': best, 'product': by_code[best], 'reason': f'code-starts-with-{best}'})
                continue
        
        # No match found - new product
        new_products.append({**item, 'extractedCode': code})

print(f"EXACT MATCHES: {len(exact_matches)}")
print(f"LIKELY MATCHES: {len(likely_matches)}")
print(f"NEW PRODUCTS: {len(new_products)}")
print(f"DESCRIPTIVE (needs visual): {len(descriptive)}")
print(f"WHATSAPP (already inspected): {len(whatsapp)}")
print(f"TOTAL UNIQUE: {len(unique_pending)}")

print("\n=== EXACT MATCHES ===")
for item in exact_matches:
    p = item['product']
    print(f"  {item['brandFolder']}/{item['filename']} -> {p['code']} | {p['name'][:55]}")

print("\n=== LIKELY MATCHES ===")
for item in likely_matches:
    p = item['product']
    print(f"  [{item['reason']}] {item['brandFolder']}/{item['filename']} -> {p['code']} | {p['name'][:55]}")

print("\n=== NEW PRODUCTS (sample) ===")
for item in new_products[:30]:
    print(f"  {item['brandFolder']}/{item['filename']} (code: {item['extractedCode']})")
if len(new_products) > 30:
    print(f"  ... and {len(new_products) - 30} more")

print("\n=== DESCRIPTIVE ===")
for item in descriptive:
    print(f"  {item['brandFolder']}/{item['filename']} (stem: {item['stem']})")

# Save
with open('tmp/final-classification.json', 'w') as f:
    json.dump({
        'exactMatches': exact_matches,
        'likelyMatches': likely_matches,
        'newProducts': new_products,
        'descriptive': descriptive,
        'whatsapp': whatsapp,
    }, f, indent=2)

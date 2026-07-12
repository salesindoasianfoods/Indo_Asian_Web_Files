#!/usr/bin/env python3
"""
Comprehensive image-to-product matcher - optimized.
"""

import json
import re
from collections import defaultdict

# Load products
with open('scripts/all-products.json', 'r') as f:
    products = json.load(f)

by_code = {p['code'].upper(): p for p in products}

# Sort codes by length (longest first) for prefix matching
codes_sorted = sorted(by_code.items(), key=lambda x: -len(x[0]))

# Build name word index
name_index = defaultdict(list)
for p in products:
    words = set(w for w in re.sub(r'[^A-Z]', ' ', p['name'].upper()).split() if len(w) >= 4)
    for w in words:
        name_index[w].append(p)

# Load pending
with open('tmp/pending-visual-inspection-v2.json', 'r') as f:
    pending = json.load(f)

results = []
no_match = []

for item in pending:
    filename = item['filename']
    brand = item['brandFolder']
    f_upper = filename.upper()
    f_stem = re.sub(r'\.(jpg|jpeg|png|webp|avif)$', '', f_upper, flags=re.I).strip()
    
    matched = False
    match_type = None
    product_code = None
    product_name = None
    confidence = 0
    
    # Strategy 1: Exact code match
    if f_stem in by_code:
        p = by_code[f_stem]
        results.append({
            'filename': filename, 'brand': brand, 'matchType': 'exact-code',
            'productCode': p['code'], 'productName': p['name'], 'confidence': 100,
        })
        continue
    
    # Strategy 2: Prefix match (using pre-sorted codes)
    found = False
    for code, p in codes_sorted:
        if f_stem.startswith(code):
            results.append({
                'filename': filename, 'brand': brand, 'matchType': 'prefix-code',
                'productCode': p['code'], 'productName': p['name'], 'confidence': 95,
            })
            found = True
            break
    if found:
        continue
    
    # Strategy 3: Embedded code (only codes >= 4 chars)
    found = False
    for code, p in codes_sorted:
        if len(code) < 4:
            continue
        pattern = r'(^|[^A-Z0-9])' + re.escape(code) + r'($|[^A-Z0-9])'
        if re.search(pattern, f_upper):
            results.append({
                'filename': filename, 'brand': brand, 'matchType': 'embedded-code',
                'productCode': p['code'], 'productName': p['name'], 'confidence': 90,
            })
            found = True
            break
    if found:
        continue
    
    # Strategy 4: Name keyword overlap
    f_words = set(w for w in re.sub(r'[^A-Z]', ' ', f_upper).split() if len(w) >= 4)
    candidates = defaultdict(int)
    for w in f_words:
        for p in name_index.get(w, []):
            candidates[p['code']] += 1
    
    best_score = 0
    best_product = None
    for code, count in candidates.items():
        p = by_code[code]
        p_words = set(w for w in re.sub(r'[^A-Z]', ' ', p['name'].upper()).split() if len(w) >= 4)
        if p_words:
            score = count / max(len(f_words), len(p_words))
            if score > best_score and score >= 0.4:
                best_score = score
                best_product = p
    
    if best_product:
        results.append({
            'filename': filename, 'brand': brand, 'matchType': 'name-keyword',
            'productCode': best_product['code'], 'productName': best_product['name'],
            'confidence': int(best_score * 80),
        })
    else:
        no_match.append({'filename': filename, 'brand': brand})

print(f"Matched: {len(results)}")
print(f"No match: {len(no_match)}")

by_match_type = defaultdict(list)
for r in results:
    by_match_type[r['matchType']].append(r)

for mt, items in sorted(by_match_type.items(), key=lambda x: -len(x[1])):
    print(f"\n=== {mt} ({len(items)}) ===")
    for item in items:
        print(f"  [{item['confidence']}%] {item['brand']}/{item['filename']} -> {item['productCode']} ({item['productName'][:55]})")

print(f"\n=== NO MATCH ({len(no_match)}) ===")
for item in no_match:
    print(f"  {item['brand']}/{item['filename']}")

with open('tmp/comprehensive-match-results.json', 'w') as f:
    json.dump({'matched': results, 'noMatch': no_match}, f, indent=2)

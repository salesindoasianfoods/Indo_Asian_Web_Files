#!/usr/bin/env python3
"""Fast matcher - exact and prefix only."""
import json
import re
from collections import defaultdict

with open('scripts/all-products.json') as f:
    products = json.load(f)

by_code = {p['code'].upper(): p for p in products}
codes_by_len = sorted(by_code.keys(), key=len, reverse=True)

with open('tmp/pending-visual-inspection-v2.json') as f:
    pending = json.load(f)

matched = []
no_match = []

for item in pending:
    fname = item['filename']
    brand = item['brandFolder']
    stem = re.sub(r'\.(jpg|jpeg|png|webp|avif)$', '', fname, flags=re.I).strip().upper()
    
    # Exact
    if stem in by_code:
        p = by_code[stem]
        matched.append({'filename': fname, 'brand': brand, 'type': 'exact', 'code': p['code'], 'name': p['name']})
        continue
    
    # Prefix
    found = False
    for code in codes_by_len:
        if stem.startswith(code):
            p = by_code[code]
            matched.append({'filename': fname, 'brand': brand, 'type': 'prefix', 'code': p['code'], 'name': p['name']})
            found = True
            break
    if found:
        continue
    
    no_match.append({'filename': fname, 'brand': brand, 'stem': stem})

print(f"Matched: {len(matched)}")
by_type = defaultdict(list)
for m in matched:
    by_type[m['type']].append(m)
for t, items in by_type.items():
    print(f"  {t}: {len(items)}")
print(f"No match: {len(no_match)}")

if no_match:
    print("\n=== NO MATCH ===")
    for item in no_match:
        print(f"  {item['brand']}/{item['filename']} (stem: {item['stem']})")

with open('tmp/fast-match-results.json', 'w') as f:
    json.dump({'matched': matched, 'noMatch': no_match}, f, indent=2)

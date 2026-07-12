#!/usr/bin/env python3
"""Analyze which codes exist and which don't."""
import json
import re
from collections import defaultdict

with open('scripts/all-products.json') as f:
    products = json.load(f)

by_code = {p['code'].upper(): p for p in products}
all_codes = set(by_code.keys())

with open('tmp/pending-visual-inspection-v2.json') as f:
    pending = json.load(f)

# Categorize each pending item
exists_exact = []
exists_prefix = []
exists_partial = []
no_exist = []  # Code pattern but no matching product in Sanity
descriptive_only = []  # No code pattern at all

for item in pending:
    fname = item['filename']
    brand = item['brandFolder']
    stem = re.sub(r'\.(jpg|jpeg|png|webp|avif)$', '', fname, flags=re.I).strip().upper()
    
    # Skip WhatsApp images
    if 'WHATSAPP' in stem:
        no_exist.append({**item, 'reason': 'whatsapp'})
        continue
    
    # Try to extract a product code: first 2-15 chars before space or end
    # Most codes are 4-12 alphanumeric chars
    code_match = re.match(r'^([A-Z0-9\-]{3,20})', stem)
    if not code_match:
        descriptive_only.append({**item, 'stem': stem})
        continue
    
    code = code_match.group(1).strip()
    
    # Exact match
    if code in all_codes:
        exists_exact.append({**item, 'code': code, 'product': by_code[code]})
        continue
    
    # Check if any product starts with this code (code is prefix of product)
    matching = [c for c in all_codes if c.startswith(code)]
    if matching:
        exists_prefix.append({**item, 'code': code, 'matches': matching})
        continue
    
    # Check if this stem starts with any product code (product is prefix of code)
    matching = [c for c in all_codes if code.startswith(c)]
    if matching:
        # Sort by longest match
        matching.sort(key=len, reverse=True)
        exists_partial.append({**item, 'code': code, 'matches': matching})
        continue
    
    no_exist.append({**item, 'code': code, 'reason': 'no matching product code'})

print(f"EXACT MATCH: {len(exists_exact)}")
print(f"CODE IS PREFIX OF PRODUCT: {len(exists_prefix)}")
print(f"PRODUCT IS PREFIX OF CODE: {len(exists_partial)}")
print(f"NO MATCHING PRODUCT: {len(no_exist)}")
print(f"DESCRIPTIVE ONLY: {len(descriptive_only)}")
print()

print("=== EXACT ===")
for item in exists_exact[:20]:
    print(f"  {item['brandFolder']}/{item['filename']} -> {item['code']} ({item['product']['name'][:50]})")

print("\n=== CODE PREFIX OF PRODUCT ===")
for item in exists_prefix[:10]:
    print(f"  {item['brandFolder']}/{item['filename']} -> code={item['code']}, matches={item['matches'][:3]}")

print("\n=== PRODUCT PREFIX OF CODE ===")
for item in exists_partial[:20]:
    print(f"  {item['brandFolder']}/{item['filename']} -> code={item['code']}, best_match={item['matches'][0]}")

print("\n=== NO MATCHING PRODUCT ===")
for item in no_exist[:30]:
    if 'code' in item:
        print(f"  {item['brandFolder']}/{item['filename']} -> code={item['code']}")
    else:
        print(f"  {item['brandFolder']}/{item['filename']} -> {item.get('reason', '')}")

print("\n=== DESCRIPTIVE ONLY ===")
for item in descriptive_only:
    print(f"  {item['brandFolder']}/{item['filename']} (stem: {item['stem']})")

#!/usr/bin/env python3
"""Append newly verified mappings to VERIFIED_IMAGE_MAPPING.md."""
import json

# Load the new mapped items from the visual scan report data
with open('tmp/comprehensive-match-v2.json') as f:
    data = json.load(f)

# We need to reconstruct the mapped items from the report generation
# Let's just read the report and extract Table 1 entries
with open('docs/kimi/VISUAL_SCAN_REPORT.md') as f:
    lines = f.readlines()

new_mappings = []
in_table1 = False
for line in lines:
    line = line.strip()
    if line.startswith('## Table 2:'):
        in_table1 = False
        break
    if in_table1 and line.startswith('|') and not line.startswith('|---'):
        parts = [p.strip() for p in line.split('|')]
        if len(parts) >= 6 and parts[1].isdigit():
            new_mappings.append({
                'num': parts[1],
                'filename': parts[2],
                'brand': parts[3],
                'code': parts[4],
                'name': parts[5],
                'category': parts[6] if len(parts) > 6 else '',
            })
    if line.startswith('## Table 1:'):
        in_table1 = True

print(f"Found {len(new_mappings)} new mappings to add")

# Read existing file
with open('docs/kimi/VERIFIED_IMAGE_MAPPING.md') as f:
    existing = f.read()

# Find the insertion point (before the last section or at the end)
lines = existing.split('\n')

# Update header count
for i, line in enumerate(lines):
    if 'Total verified mappings:' in line:
        lines[i] = '> Total verified mappings: **824 images** (732 auto-matched + 92 visual-scan verified)'
        break

# Find where to append - look for the end of the table
insert_idx = len(lines)
for i in range(len(lines)-1, -1, -1):
    if lines[i].strip().startswith('|'):
        insert_idx = i + 1
        break

# Append new mappings
append_lines = []
append_lines.append("")
append_lines.append("<!-- Additional mappings verified through visual scan -->")
for m in new_mappings:
    name = m['name'].replace('|', '\\|')
    cat = m['category'].replace('|', '\\|')
    append_lines.append(f"| {m['num']} | {m['filename']} | {m['brand']} | {m['code']} | {name} | {cat} | Visual-Scan-Verified |")

lines[insert_idx:insert_idx] = append_lines

with open('docs/kimi/VERIFIED_IMAGE_MAPPING.md', 'w') as f:
    f.write('\n'.join(lines))

print(f"Updated VERIFIED_IMAGE_MAPPING.md with {len(new_mappings)} new entries")

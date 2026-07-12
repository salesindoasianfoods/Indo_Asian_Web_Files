import pdfplumber
import re

pdf_path = "product-files/AVAILABLE PRODUCT LIST IAF.pdf"

print("Parsing categories from PDF...")
categories = []
with pdfplumber.open(pdf_path) as pdf:
    for page_num, page in enumerate(pdf.pages, 1):
        text = page.extract_text()
        if not text:
            continue
        for line in text.split("\n"):
            # Check for lines like "Product Category: VISWAS FROZEN SNACKS"
            match = re.search(r"Product\s+Category:\s*(.*)", line, re.IGNORECASE)
            if match:
                cat_name = match.group(1).strip()
                if cat_name not in categories:
                    categories.append(cat_name)
                    print(f"Page {page_num}: Found category -> {cat_name}")

print("\nAll Unique Categories in order of appearance:")
for i, cat in enumerate(categories, 1):
    print(f"{i}. {cat}")

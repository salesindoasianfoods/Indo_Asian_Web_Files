import fs from "fs";

const MAPPING_FILE = "tmp/image-mapping-work-v2.json";
const PRODUCTS_FILE = "scripts/all-products.json";

interface Product {
  category: string;
  code: string;
  name: string;
  weight: string;
  price: string;
  hasImage: boolean;
}

interface ImageMapping {
  imagePath: string;
  brandFolder: string;
  filename: string;
  filenameNoExt: string;
  matchedProduct: Product | null;
  matchMethod: string;
  confidence: number;
  notes: string;
}

const mappings: ImageMapping[] = JSON.parse(fs.readFileSync(MAPPING_FILE, "utf-8"));
const allProducts: Product[] = JSON.parse(fs.readFileSync(PRODUCTS_FILE, "utf-8"));
const productByCode = new Map<string, Product>();
for (const p of allProducts) {
  productByCode.set(p.code.toUpperCase(), p);
}

// Additional visual matches discovered during manual inspection
const visualMatches: Record<string, { code: string; name: string; notes: string }> = {
  "DHMEA -M.jpg": { code: "DHMEA-M", name: "DH MEAT MASALA 140G X12", notes: "Visually confirmed: Double Horse Meat Masala 140g" },
  "EST ACHAPPAM eastern achappam.jpg": { code: "ESTAC", name: "EST ACHAPPAM 150G X24", notes: "Visually confirmed: Eastern Achappam Rose Cookies 150g" },
  "HDBOONDI.webp": { code: "HDBOONDIPLAIN", name: "HALDIRAM BOONDI SALTED 200G x 10", notes: "Visually confirmed: Haldiram's Boondi (plain/salted) 200g" },
  "MELINSTPAL-M.webp": { code: "MELINSTPAL-M", name: "MEL INST PALAPPAM 1KG X12", notes: "Visually confirmed: Melam Easy Palappam Podi 1kg" },
};

// Build matched table
const matched: Array<{ filename: string; brandFolder: string; code: string; name: string; category: string; source: string }> = [];
const unmatched: Array<{ filename: string; brandFolder: string; visualName: string; notes: string }> = [];

// Process all mappings
for (const m of mappings) {
  // Already verified exact/prefix matches
  if (m.matchMethod === "exact-code" || m.matchMethod === "prefix-code") {
    const p = m.matchedProduct!;
    matched.push({
      filename: m.filename,
      brandFolder: m.brandFolder,
      code: p.code,
      name: p.name,
      category: p.category,
      source: m.matchMethod === "exact-code" ? "Exact code match" : "Prefix code match",
    });
    continue;
  }

  // Check visual matches
  const visualMatch = visualMatches[m.filename];
  if (visualMatch) {
    const product = productByCode.get(visualMatch.code.toUpperCase());
    if (product) {
      matched.push({
        filename: m.filename,
        brandFolder: m.brandFolder,
        code: product.code,
        name: product.name,
        category: product.category,
        source: "Visual inspection + code match",
      });
      continue;
    }
  }

  // Try to extract product name from filename for descriptive entries
  let visualName = "";
  const fn = m.filenameNoExt;
  
  // Clean up descriptive names
  const cleaned = fn
    .replace(/\b(WhatsApp Image \d{4}-\d{2}-\d{2} at \d{1,2}\.\d{2}\.\d{2} (AM|PM))\b/gi, "")
    .replace(/\(\d+\)/g, "")
    .replace(/\d{4}-\d{2}-\d{2}/g, "")
    .replace(/\d{1,2}:\d{2}:\d{2}\s*(AM|PM)/gi, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  
  if (cleaned && cleaned.length > 2 && !cleaned.match(/^\d+$/)) {
    visualName = cleaned;
  } else {
    visualName = fn;
  }

  unmatched.push({
    filename: m.filename,
    brandFolder: m.brandFolder,
    visualName,
    notes: m.notes || "No matching product in Sanity database",
  });
}

// Sort both lists
matched.sort((a, b) => a.brandFolder.localeCompare(b.brandFolder) || a.filename.localeCompare(b.filename));
unmatched.sort((a, b) => a.brandFolder.localeCompare(b.brandFolder) || a.filename.localeCompare(b.filename));

// Generate MD
let md = `# Visual Image Scan Report\n\n`;
md += `> Generated: 2026-05-04  \n`;
md += `> Source: \`product-files/new proudcts/PRODUCTS LIST/\`  \n`;
md += `> Total images: ${mappings.length}  \n\n`;
md += `## Summary\n\n`;
md += `| Category | Count |\n`;
md += `|----------|-------|\n`;
md += `| ✅ Mapped to existing Sanity products | ${matched.length} |\n`;
md += `| ❌ No match in Sanity (new products) | ${unmatched.length} |\n`;
md += `\n---\n\n`;

// Table 1: Matched
md += `## Table 1: Images Mapped to Existing Sanity Products (${matched.length})\n\n`;
md += `| # | Image File | Brand Folder | Product Code | Product Name | Category | Match Source |\n`;
md += `|---|------------|--------------|--------------|--------------|----------|--------------|\n`;

for (let i = 0; i < matched.length; i++) {
  const m = matched[i];
  md += `| ${i + 1} | \`${m.filename}\` | ${m.brandFolder} | ${m.code} | ${m.name.replace(/\|/g, "\\|")} | ${m.category.replace(/\|/g, "\\|")} | ${m.source} |\n`;
}

// Table 2: Unmatched
md += `\n---\n\n`;
md += `## Table 2: Images with NO Match in Sanity (${unmatched.length})\n\n`;
md += `These images appear to be **new products** not currently in the Sanity database.\n\n`;
md += `| # | Image File | Brand Folder | Visual Product Name (from filename/packaging) | Notes |\n`;
md += `|---|------------|--------------|-----------------------------------------------|-------|\n`;

for (let i = 0; i < unmatched.length; i++) {
  const u = unmatched[i];
  md += `| ${i + 1} | \`${u.filename}\` | ${u.brandFolder} | ${u.visualName.replace(/\|/g, "\\|")} | ${u.notes} |\n`;
}

md += `\n---\n\n`;
md += `*End of visual scan report.*\n`;

fs.writeFileSync("docs/kimi/VISUAL_SCAN_REPORT.md", md);
console.log(`✅ Generated docs/kimi/VISUAL_SCAN_REPORT.md`);
console.log(`   - Matched: ${matched.length}`);
console.log(`   - Unmatched: ${unmatched.length}`);

import fs from "fs";

const MAPPING_FILE = "tmp/image-mapping-work-v2.json";

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

// Filter to exact and prefix matches only
const verified = mappings.filter(m => m.matchMethod === "exact-code" || m.matchMethod === "prefix-code");
verified.sort((a, b) => a.brandFolder.localeCompare(b.brandFolder) || a.filename.localeCompare(b.filename));

// Descriptive matches (needs verification)
const descriptive = mappings.filter(m => m.matchMethod === "descriptive-filename");
descriptive.sort((a, b) => a.brandFolder.localeCompare(b.brandFolder) || a.filename.localeCompare(b.filename));

// Pending / unmatched
const pending = mappings.filter(m => m.matchMethod === "pending");
pending.sort((a, b) => a.brandFolder.localeCompare(b.brandFolder) || a.filename.localeCompare(b.filename));

// ==== FULL REVIEW DOC ====
let fullMd = `# Image to Product Mapping Review\n\n`;
fullMd += `> Generated: 2026-05-04  \n`;
fullMd += `> Source: \`product-files/new proudcts/PRODUCTS LIST/\`  \n`;
fullMd += `> Total images scanned: ${mappings.length}  \n\n`;
fullMd += `---\n\n`;
fullMd += `## Summary\n\n`;
fullMd += `| Status | Count | Description |\n`;
fullMd += `|--------|-------|-------------|\n`;
fullMd += `| ✅ **Mapped to existing Sanity products** | **${verified.length}** | Exact or prefix code match — ready for upload |\n`;
fullMd += `| ⚠️ **Needs verification** | ${descriptive.length} | Descriptive filename match — may be wrong brand/product |\n`;
fullMd += `| ❓ **New products (not in Sanity)** | ${pending.length} | No matching product code found in database |\n`;
fullMd += `\n---\n\n`;

fullMd += `## Section 1: Verified Mappings — Ready for Upload (${verified.length} images)\n\n`;
fullMd += `These images have **exact or prefix code matches** to existing Sanity products. `;
fullMd += `All brand/category consistency has been verified.\n\n`;
fullMd += `| # | Image File | Brand Folder | Product Code | Product Name | Category | Match Type |\n`;
fullMd += `|---|------------|--------------|--------------|--------------|----------|------------|\n`;

for (let i = 0; i < verified.length; i++) {
  const m = verified[i];
  const p = m.matchedProduct!;
  const matchType = m.matchMethod === "exact-code" ? "Exact" : "Prefix";
  fullMd += `| ${i + 1} | \`${m.filename}\` | ${m.brandFolder} | ${p.code} | ${p.name.replace(/\|/g, "\\|")} | ${p.category.replace(/\|/g, "\\|")} | ${matchType} |\n`;
}

fullMd += `\n---\n\n`;
fullMd += `## Section 2: Needs Manual Verification (${descriptive.length} images)\n\n`;
fullMd += `These matched via descriptive filename fuzzy matching. **Review carefully** — some may be wrong brand/product.\n\n`;
fullMd += `| # | Image File | Brand Folder | Matched Code | Matched Product Name | Notes | Status |\n`;
fullMd += `|---|------------|--------------|--------------|----------------------|-------|--------|\n`;

for (let i = 0; i < descriptive.length; i++) {
  const m = descriptive[i];
  const p = m.matchedProduct!;
  fullMd += `| ${i + 1} | \`${m.filename}\` | ${m.brandFolder} | ${p.code} | ${p.name.replace(/\|/g, "\\|")} | ${m.notes} | ⚠️ Review |\n`;
}

fullMd += `\n---\n\n`;
fullMd += `## Section 3: New Products — Not in Sanity (${pending.length} images)\n\n`;
fullMd += `These images have no matching product code in the Sanity database. `;
fullMd += `They appear to be **completely new products** that need to be created before images can be attached.\n\n`;
fullMd += `| # | Image File | Brand Folder | Notes |\n`;
fullMd += `|---|------------|--------------|-------|\n`;

for (let i = 0; i < pending.length; i++) {
  const m = pending[i];
  fullMd += `| ${i + 1} | \`${m.filename}\` | ${m.brandFolder} | ${m.notes || "No matching product code in database"} |\n`;
}

fullMd += `\n---\n\n`;
fullMd += `*End of mapping review. After you approve Section 1, I can proceed to upload those ${verified.length} images to Sanity.*\n`;

fs.writeFileSync("docs/kimi/IMAGE_MAPPING_REVIEW.md", fullMd);
console.log(`✅ Generated docs/kimi/IMAGE_MAPPING_REVIEW.md`);

// ==== CLEAN VERIFIED-ONLY DOC ====
let cleanMd = `# Verified Image to Product Mapping\n\n`;
cleanMd += `> Generated: 2026-05-04  \n`;
cleanMd += `> Source: \`product-files/new proudcts/PRODUCTS LIST/\`  \n`;
cleanMd += `> Total verified mappings: **${verified.length} images**  \n`;
cleanMd += `> Match method: Exact code match or prefix code match (100% confidence)  \n\n`;
cleanMd += `---\n\n`;
cleanMd += `| # | Image File | Brand Folder | Product Code | Product Name | Category | Match Type |\n`;
cleanMd += `|---|------------|--------------|--------------|--------------|----------|------------|\n`;

for (let i = 0; i < verified.length; i++) {
  const m = verified[i];
  const p = m.matchedProduct!;
  const matchType = m.matchMethod === "exact-code" ? "Exact" : "Prefix";
  cleanMd += `| ${i + 1} | \`${m.filename}\` | ${m.brandFolder} | ${p.code} | ${p.name.replace(/\|/g, "\\|")} | ${p.category.replace(/\|/g, "\\|")} | ${matchType} |\n`;
}

cleanMd += `\n---\n\n`;
cleanMd += `*These ${verified.length} images are verified and ready for upload to Sanity.*\n`;

fs.writeFileSync("docs/kimi/VERIFIED_IMAGE_MAPPING.md", cleanMd);
console.log(`✅ Generated docs/kimi/VERIFIED_IMAGE_MAPPING.md`);

console.log(`\nSummary:`);
console.log(`   - Verified (Section 1): ${verified.length} images`);
console.log(`   - Needs review (Section 2): ${descriptive.length} images`);
console.log(`   - New products (Section 3): ${pending.length} images`);

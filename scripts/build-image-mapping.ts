import fs from "fs";
import path from "path";

const IMAGE_DIR = "product-files/new proudcts/PRODUCTS LIST";
const PRODUCTS_FILE = "scripts/products-without-images.json";
const OUTPUT_FILE = "tmp/image-mapping-work.json";

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
  matchMethod: "exact-code" | "partial-code" | "fuzzy-name" | "visual-inspection" | "pending";
  confidence: number; // 0-100
  notes: string;
}

// Load products
const products: Product[] = JSON.parse(fs.readFileSync(PRODUCTS_FILE, "utf-8"));
const productByCode = new Map<string, Product>();
const productByName = new Map<string, Product>();
for (const p of products) {
  productByCode.set(p.code.toUpperCase(), p);
  productByName.set(p.name.toUpperCase(), p);
}

// Scan all images
function scanImages(dir: string, brandFolder: string): ImageMapping[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const results: ImageMapping[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...scanImages(fullPath, entry.name));
    } else if (/\.(jpg|jpeg|png|webp|avif|gif)$/i.test(entry.name)) {
      const filenameNoExt = entry.name.replace(/\.[^.]+$/, "");
      results.push({
        imagePath: fullPath,
        brandFolder,
        filename: entry.name,
        filenameNoExt,
        matchedProduct: null,
        matchMethod: "pending",
        confidence: 0,
        notes: "",
      });
    }
  }

  return results;
}

console.log("Scanning image directories...");
const mappings = scanImages(IMAGE_DIR, "ROOT");
console.log(`Found ${mappings.length} images`);

// Phase 1: Exact code matches
let exactMatches = 0;
for (const m of mappings) {
  const codeKey = m.filenameNoExt.toUpperCase();
  if (productByCode.has(codeKey)) {
    m.matchedProduct = productByCode.get(codeKey)!;
    m.matchMethod = "exact-code";
    m.confidence = 100;
    m.notes = "Exact filename-to-code match";
    exactMatches++;
  }
}

// Phase 2: Partial code matches (code contained in filename)
let partialMatches = 0;
for (const m of mappings) {
  if (m.matchMethod !== "pending") continue;
  const fnUpper = m.filenameNoExt.toUpperCase();
  
  for (const [code, product] of productByCode) {
    if (code.length < 3) continue;
    if (fnUpper.includes(code) || code.includes(fnUpper)) {
      m.matchedProduct = product;
      m.matchMethod = "partial-code";
      m.confidence = 75;
      m.notes = `Partial match: code '${code}' ~ filename '${m.filenameNoExt}'`;
      partialMatches++;
      break;
    }
  }
}

// Phase 3: Fuzzy name matching for descriptive filenames
let fuzzyMatches = 0;
for (const m of mappings) {
  if (m.matchMethod !== "pending") continue;
  const fnUpper = m.filenameNoExt.toUpperCase();
  
  // Clean up filename for name matching
  const cleaned = fnUpper
    .replace(/\b(WHATSAPP|IMAGE|PHOTO|DOWNLOAD|COPY|NEW|PIC)\b/g, "")
    .replace(/\d{4}-\d{2}-\d{2}/g, "") // dates
    .replace(/\d{1,2}:\d{2}:\d{2}\s*(AM|PM)/g, "")
    .replace(/\([^)]*\)/g, "")
    .replace(/\s+/g, " ")
    .trim();
  
  if (cleaned.length < 3) continue;
  
  // Try to find product name match
  for (const [name, product] of productByName) {
    // Simple word overlap scoring
    const nameWords = name.split(/\s+/).filter(w => w.length > 2);
    const fnWords = cleaned.split(/\s+/).filter(w => w.length > 2);
    const overlap = nameWords.filter(w => fnWords.includes(w));
    
    if (overlap.length >= Math.min(3, nameWords.length) && overlap.length >= 2) {
      m.matchedProduct = product;
      m.matchMethod = "fuzzy-name";
      m.confidence = 60;
      m.notes = `Fuzzy name match: words [${overlap.join(", ")}] found in filename`;
      fuzzyMatches++;
      break;
    }
  }
}

const pending = mappings.filter(m => m.matchMethod === "pending").length;

console.log(`\n=== MATCHING SUMMARY ===`);
console.log(`Exact code matches:     ${exactMatches}`);
console.log(`Partial code matches:   ${partialMatches}`);
console.log(`Fuzzy name matches:     ${fuzzyMatches}`);
console.log(`Pending visual inspect: ${pending}`);
console.log(`Total:                  ${mappings.length}`);

// Save work file
fs.mkdirSync("tmp", { recursive: true });
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(mappings, null, 2));
console.log(`\nSaved working file to ${OUTPUT_FILE}`);

// Save pending list for visual inspection
const pendingList = mappings.filter(m => m.matchMethod === "pending");
fs.writeFileSync("tmp/pending-visual-inspection.json", JSON.stringify(pendingList, null, 2));
console.log(`Saved ${pendingList.length} pending images to tmp/pending-visual-inspection.json`);

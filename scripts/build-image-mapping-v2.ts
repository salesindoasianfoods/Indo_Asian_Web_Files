import fs from "fs";
import path from "path";

const IMAGE_DIR = "product-files/new proudcts/PRODUCTS LIST";
const PRODUCTS_FILE = "scripts/products-without-images.json";
const OUTPUT_FILE = "tmp/image-mapping-work-v2.json";

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
  matchMethod: "exact-code" | "prefix-code" | "brand-prefix-code" | "descriptive-filename" | "visual-inspection" | "pending" | "unmatched";
  confidence: number;
  notes: string;
}

// Load products
const products: Product[] = JSON.parse(fs.readFileSync(PRODUCTS_FILE, "utf-8"));
const productByCode = new Map<string, Product>();
const productByCodeParts = new Map<string, Product[]>(); // for multi-word codes
for (const p of products) {
  productByCode.set(p.code.toUpperCase(), p);
  
  // Also index by first part of hyphenated codes
  const parts = p.code.toUpperCase().split(/[-_\s]/);
  if (parts.length > 1) {
    const key = parts[0];
    if (!productByCodeParts.has(key)) productByCodeParts.set(key, []);
    productByCodeParts.get(key)!.push(p);
  }
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

// Phase 2: Prefix code matches (code at start of filename, min 4 chars)
let prefixMatches = 0;
for (const m of mappings) {
  if (m.matchMethod !== "pending") continue;
  const fnUpper = m.filenameNoExt.toUpperCase();
  
  // Try each code as prefix
  for (const [code, product] of productByCode) {
    if (code.length < 4) continue;
    // Code must be at very start of filename
    if (fnUpper.startsWith(code)) {
      // Make sure it's not a substring of a longer code
      const remainder = fnUpper.slice(code.length);
      // Remainder should start with non-alphanumeric or be empty
      if (remainder.length === 0 || !/[A-Z0-9]/.test(remainder[0])) {
        m.matchedProduct = product;
        m.matchMethod = "prefix-code";
        m.confidence = 95;
        m.notes = `Prefix match: '${code}' at start of '${m.filenameNoExt}'`;
        prefixMatches++;
        break;
      }
    }
  }
}

// Phase 3: Brand prefix + code matches
// e.g., "ASCHAPPATHI" -> "CHAPPATHI" might not be a code, but "ASCHAPPATHI" should match
// We already handled prefix matches above. Now handle cases where brand uses different prefix.
let brandPrefixMatches = 0;
for (const m of mappings) {
  if (m.matchMethod !== "pending") continue;
  const fnUpper = m.filenameNoExt.toUpperCase();
  
  // Known brand prefixes
  const brandPrefixes: Record<string, string> = {
    "AS": "Aswas",
    "EST": "Eastern",
    "DH": "Double Horse",
    "DHP": "Double Horse",
    "VS": "Viswas",
    "VSD": "Viswas",
    "ML": "Malabar Choice",
    "MC": "MC",
    "TN": "Tasty Nibbles",
    "TB": "Town Bus",
    "SH": "Shana",
    "CR": "Crispy",
    "IG": "India Gate",
    "MEL": "Melam",
    "PER": "Periyar",
    "DD": "Daily Delight",
    "NF": "Neptune",
    "MF": "Marine Fresh",
    "SAR": "Saras",
    "PUL": "Pluvera",
    "PLU": "Pluvera",
    "TYJ": "TYJ",
    "MAG": "Maggi",
    "PAR": "Parle",
    "ID ": "ID",
    "HAL": "Haldiram",
  };
  
  for (const [prefix, brandName] of Object.entries(brandPrefixes)) {
    if (fnUpper.startsWith(prefix)) {
      const possibleCode = fnUpper;
      // Try exact match first
      if (productByCode.has(possibleCode)) {
        const product = productByCode.get(possibleCode)!;
        m.matchedProduct = product;
        m.matchMethod = "brand-prefix-code";
        m.confidence = 90;
        m.notes = `Brand prefix match: '${prefix}' -> ${product.code}`;
        brandPrefixMatches++;
        break;
      }
      
      // Try the rest after prefix as code
      const afterPrefix = fnUpper.slice(prefix.length);
      if (afterPrefix.length >= 3) {
        // Try exact match of remainder
        if (productByCode.has(afterPrefix)) {
          const product = productByCode.get(afterPrefix)!;
          m.matchedProduct = product;
          m.matchMethod = "brand-prefix-code";
          m.confidence = 85;
          m.notes = `Brand prefix split: '${prefix}' + '${afterPrefix}' -> ${product.code}`;
          brandPrefixMatches++;
          break;
        }
      }
    }
  }
}

// Phase 4: Descriptive filename matching for obvious cases
// e.g., "eastern fish pickle.jpg" or "Viswas_Roasted Rava (1).jpg"
let descriptiveMatches = 0;
for (const m of mappings) {
  if (m.matchMethod !== "pending") continue;
  let fnUpper = m.filenameNoExt.toUpperCase();
  
  // Remove common noise words
  fnUpper = fnUpper
    .replace(/\b(WHATSAPP|IMAGE|PHOTO|DOWNLOAD|COPY|NEW|PIC|PICTURE)\b/g, "")
    .replace(/\d{4}-\d{2}-\d{2}/g, "")
    .replace(/\d{1,2}:\d{2}:\d{2}\s*(AM|PM)/g, "")
    .replace(/\([^)]*\)/g, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  
  if (fnUpper.length < 5) continue;
  
  // Try to find products in the same brand folder with matching words
  const fnWords = fnUpper.split(/\s+/).filter(w => w.length > 2);
  if (fnWords.length < 2) continue;
  
  // Filter products by brand folder if possible
  const brandFolderUpper = m.brandFolder.toUpperCase();
  let candidateProducts = products;
  
  // Brand folder heuristic mapping
  const folderToBrand: Record<string, string[]> = {
    "ASWAS": ["ASWAS"],
    "EASTERN": ["EASTERN"],
    "DOUBLE HORSE": ["DOUBLE HORSE"],
    "VISWAS": ["VISWAS"],
    "DAILY DELIGHT": ["DAILY DELIGHT"],
    "MALABAR CHOICE": ["MALABAR CHOICE"],
    "HALDIRAM": ["HALDIRAM"],
    "MELAM": ["MELAM"],
    "PERIYAR": ["PERIYAR"],
    "SHANA": ["SHANA"],
    "TOWN BUS": ["TOWN BUS"],
    "INDIA GATE": ["INDIA GATE"],
    "CRISPY": ["CRISPY"],
    "TASTY NIBBLES": ["TASTY NIBBLES"],
    "SARAS": ["SARAS"],
    "MARINE SEA FRESH": ["MARINE FRESH", "AQUA FRESH"],
    "NEPTUNE FROZEN FRESH": ["NEPTUNE"],
  };
  
  const brandKeywords = folderToBrand[brandFolderUpper];
  if (brandKeywords) {
    candidateProducts = products.filter(p => 
      brandKeywords.some(kw => p.category.toUpperCase().includes(kw) || p.name.toUpperCase().includes(kw))
    );
  }
  
  let bestMatch: Product | null = null;
  let bestScore = 0;
  
  for (const product of candidateProducts) {
    const nameWords = product.name.toUpperCase().split(/\s+/).filter(w => w.length > 2);
    const overlap = fnWords.filter(w => nameWords.includes(w) || product.name.toUpperCase().includes(w));
    const score = overlap.length;
    
    if (score > bestScore && score >= 2) {
      bestScore = score;
      bestMatch = product;
    }
  }
  
  if (bestMatch && bestScore >= 3) {
    m.matchedProduct = bestMatch;
    m.matchMethod = "descriptive-filename";
    m.confidence = 70;
    m.notes = `Descriptive match: ${bestScore} word overlap in filename`;
    descriptiveMatches++;
  }
}

const pending = mappings.filter(m => m.matchMethod === "pending").length;
const unmatched = mappings.filter(m => m.matchMethod === "unmatched").length;

console.log(`\n=== MATCHING SUMMARY ===`);
console.log(`Exact code matches:       ${exactMatches}`);
console.log(`Prefix code matches:      ${prefixMatches}`);
console.log(`Brand prefix matches:     ${brandPrefixMatches}`);
console.log(`Descriptive matches:      ${descriptiveMatches}`);
console.log(`Pending visual inspect:   ${pending}`);
console.log(`Total:                    ${mappings.length}`);

// Save work file
fs.mkdirSync("tmp", { recursive: true });
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(mappings, null, 2));
console.log(`\nSaved working file to ${OUTPUT_FILE}`);

// Save pending list for visual inspection
const pendingList = mappings.filter(m => m.matchMethod === "pending");
fs.writeFileSync("tmp/pending-visual-inspection-v2.json", JSON.stringify(pendingList, null, 2));
console.log(`Saved ${pendingList.length} pending images to tmp/pending-visual-inspection-v2.json`);

// Generate review MD for auto-matched items
const autoMatched = mappings.filter(m => m.confidence >= 70);
let md = `# Image Mapping Review\n\n`;
md += `Generated: ${new Date().toISOString()}\n\n`;
md += `## Auto-Matched Images (${autoMatched.length})\n\n`;
md += `| # | Image File | Brand Folder | Method | Confidence | Product Code | Product Name | Status |\n`;
md += `|---|------------|--------------|--------|------------|--------------|--------------|--------|\n`;

for (let i = 0; i < autoMatched.length; i++) {
  const m = autoMatched[i];
  const p = m.matchedProduct!;
  md += `| ${i + 1} | ${m.filename} | ${m.brandFolder} | ${m.matchMethod} | ${m.confidence}% | ${p.code} | ${p.name} | ✅ |\n`;
}

md += `\n## Pending Visual Inspection (${pendingList.length})\n\n`;
md += `| # | Image File | Brand Folder | Notes | Status |\n`;
md += `|---|------------|--------------|-------|--------|\n`;

for (let i = 0; i < pendingList.length; i++) {
  const m = pendingList[i];
  md += `| ${i + 1} | ${m.filename} | ${m.brandFolder} | ${m.notes} | ⏳ |\n`;
}

fs.writeFileSync("tmp/IMAGE_MAPPING_REVIEW.md", md);
console.log(`Saved review doc to tmp/IMAGE_MAPPING_REVIEW.md`);

import fs from "fs";
import path from "path";

const IMAGE_DIR = "product-files/new proudcts/PRODUCTS LIST";
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

// Load existing mappings
const mappings: ImageMapping[] = JSON.parse(fs.readFileSync(MAPPING_FILE, "utf-8"));

// Get all unmatched (not exact-code or prefix-code)
const unmatched = mappings.filter(m => m.matchMethod !== "exact-code" && m.matchMethod !== "prefix-code");

// Also do a fresh filesystem scan to get accurate paths
function scanImages(dir: string, relPath: string): Array<{fullPath: string, relPath: string, filename: string, brandFolder: string}> {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const results: Array<{fullPath: string, relPath: string, filename: string, brandFolder: string}> = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const currentRelPath = path.join(relPath, entry.name);
    if (entry.isDirectory()) {
      results.push(...scanImages(fullPath, currentRelPath));
    } else if (/\.(jpg|jpeg|png|webp|avif|gif)$/i.test(entry.name)) {
      // Brand folder is the first directory in the relative path
      const parts = relPath.split(/[\\/]/);
      const brandFolder = parts[0] || "ROOT";
      results.push({ fullPath, relPath: currentRelPath, filename: entry.name, brandFolder });
    }
  }

  return results;
}

const fsImages = scanImages(IMAGE_DIR, "");

// Create a map from filename to correct path
const filenameToPath = new Map<string, string>();
for (const img of fsImages) {
  filenameToPath.set(img.filename, img.fullPath);
}

// Build output with correct paths
const output = unmatched.map(m => {
  const correctPath = filenameToPath.get(m.filename);
  return {
    filename: m.filename,
    brandFolder: m.brandFolder,
    imagePath: correctPath || m.imagePath,
    currentMatchMethod: m.matchMethod,
    currentMatchedCode: m.matchedProduct?.code || null,
    currentMatchedName: m.matchedProduct?.name || null,
    visualProductName: "",
    visualBrand: "",
    visualWeight: "",
    matchedSanityCode: "",
    matchedSanityName: "",
    status: "pending" as string,
    notes: "",
  };
});

output.sort((a, b) => a.brandFolder.localeCompare(b.brandFolder) || a.filename.localeCompare(b.filename));

fs.writeFileSync("tmp/visual-scan-work.json", JSON.stringify(output, null, 2));
console.log(`Total unmatched images to visually inspect: ${output.length}`);

// Print summary by folder
const folderCounts = new Map<string, number>();
for (const item of output) {
  folderCounts.set(item.brandFolder, (folderCounts.get(item.brandFolder) || 0) + 1);
}
console.log("\nBy brand folder:");
for (const [folder, count] of [...folderCounts.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${folder}: ${count}`);
}

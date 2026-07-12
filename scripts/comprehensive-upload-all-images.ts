import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { createClient } from "@sanity/client";
import { config } from "dotenv";

config({ path: ".env.local" });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  token: process.env.NEXT_PUBLIC_SANITY_EDIT_TOKEN!,
  apiVersion: "2024-04-01",
  useCdn: false,
});

const PLACEHOLDER_REF = "image-392ae88a5edcfe8b29b5e84dffd03ba833be05e9-900x1200-jpg";
const IMAGE_BASE_DIR = "product-files/new proudcts/PRODUCTS LIST";
const COMPRESSED_DIR = "output/compressed-all";

// ─── Build recursive file map ──────────────────────────────────────────────

const fileMap = new Map<string, { path: string; brand: string }>();
function walkDir(dir: string, brand: string = "") {
  for (const entry of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walkDir(fullPath, brand || entry);
    } else if (/\.(jpg|jpeg|png|webp|avif)$/i.test(entry)) {
      if (!fileMap.has(entry.toLowerCase())) {
        fileMap.set(entry.toLowerCase(), { path: fullPath, brand: brand || path.basename(dir) });
      }
    }
  }
}
walkDir(IMAGE_BASE_DIR);

// ─── Fetch all Sanity products ─────────────────────────────────────────────

interface SanityProduct {
  _id: string;
  code?: string;
  name?: string;
  assetRef?: string;
  image?: any;
}

async function fetchAllProducts(): Promise<SanityProduct[]> {
  const all: SanityProduct[] = [];
  let offset = 0;
  while (true) {
    const batch = await client.fetch<SanityProduct[]>(
      `*[_type == "product"] [_id > $lastId] | order(_id asc) [0...1000] { _id, code, name, "assetRef": image.asset._ref }`,
      { lastId: offset === 0 ? "" : all[all.length - 1]._id }
    );
    if (batch.length === 0) break;
    all.push(...batch);
    offset += batch.length;
    if (batch.length < 1000) break;
  }
  return all;
}

// ─── Matching logic ────────────────────────────────────────────────────────

function normalizeCode(str: string): string {
  return str
    .toUpperCase()
    .replace(/\.[^.]+$/, "") // remove extension
    .replace(/\s*\(\s*WhatsApp\s*\)/gi, "")
    .replace(/\s*copy\s*of\s*/gi, "")
    .replace(/[^A-Z0-9]/g, "");
}

function buildProductLookup(products: SanityProduct[]) {
  const byCode = new Map<string, SanityProduct[]>();
  const byName = new Map<string, SanityProduct[]>();

  for (const p of products) {
    if (p.code) {
      const code = p.code.toUpperCase().trim();
      if (!byCode.has(code)) byCode.set(code, []);
      byCode.get(code)!.push(p);
    }
    if (p.name) {
      const name = p.name.toUpperCase().trim();
      if (!byName.has(name)) byName.set(name, []);
      byName.get(name)!.push(p);
    }
  }

  return { byCode, byName };
}

function findMatch(
  filename: string,
  lookup: { byCode: Map<string, SanityProduct[]>; byName: Map<string, SanityProduct[]> }
): SanityProduct | null {
  const base = path.basename(filename, path.extname(filename));

  // 1. Exact code match
  const codeNorm = normalizeCode(base);
  if (lookup.byCode.has(codeNorm)) {
    return lookup.byCode.get(codeNorm)![0];
  }

  // 2. Substring code match (e.g., filename contains product code)
  for (const [code, products] of lookup.byCode) {
    if (codeNorm.includes(code) || code.includes(codeNorm)) {
      return products[0];
    }
  }

  // 3. Name match (filename contains product name words)
  const nameWords = base.toUpperCase().split(/[^A-Z0-9]+/).filter(w => w.length >= 3);
  for (const [name, products] of lookup.byName) {
    const matchCount = nameWords.filter(w => name.includes(w)).length;
    if (matchCount >= Math.max(2, nameWords.length * 0.5)) {
      return products[0];
    }
  }

  return null;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function compressImage(inputPath: string, outputPath: string): boolean {
  try {
    const stats = fs.statSync(inputPath);
    const sizeKb = stats.size / 1024;
    const ext = path.extname(inputPath).toLowerCase();
    const quality = sizeKb < 80 ? "2" : "5";
    const vf = ext === ".png"
      ? "scale='min(1200,iw)':-1,format=rgba,geq=r='p(X,Y)':a='255'"
      : "scale='min(1200,iw)':-1";

    execSync(
      `ffmpeg -y -hide_banner -loglevel error -i "${inputPath}" -vf "${vf}" -q:v ${quality} "${outputPath}"`,
      { timeout: 30000 }
    );
    return fs.existsSync(outputPath);
  } catch (e) {
    return false;
  }
}

async function uploadImage(filePath: string, filename: string): Promise<string> {
  const buffer = fs.readFileSync(filePath);
  const asset = await client.assets.upload("image", buffer, { filename });
  return asset._id;
}

async function attachImage(productId: string, assetId: string) {
  await client.patch(productId).set({
    image: { _type: "image", asset: { _type: "reference", _ref: assetId } },
  }).commit();
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  fs.mkdirSync(COMPRESSED_DIR, { recursive: true });

  console.log("=".repeat(80));
  console.log("COMPREHENSIVE UPLOAD — ALL REMAINING IMAGES");
  console.log("=".repeat(80));

  // Get all images
  const allImages = Array.from(fileMap.entries());
  console.log(`\nTotal images found: ${allImages.length}`);

  // Get all Sanity products
  console.log("Fetching all Sanity products...");
  const products = await fetchAllProducts();
  console.log(`Fetched ${products.length} products`);

  const lookup = buildProductLookup(products);

  // Track results
  let success = 0;
  let skippedHasImage = 0;
  let noMatch = 0;
  let compressFail = 0;
  let uploadFail = 0;
  let patchFail = 0;
  const uploadedAssets = new Map<string, string>();
  const results: any[] = [];

  for (let i = 0; i < allImages.length; i++) {
    const [filename, info] = allImages[i];
    const progress = `[${String(i + 1).padStart(4)}/${allImages.length}]`;
    process.stdout.write(`\r${progress} ${filename.slice(0, 40).padEnd(42)}`);

    if (i > 0 && i % 30 === 0) {
      process.stdout.write("  (pausing)...");
      await new Promise((r) => setTimeout(r, 2000));
    }

    // Find matching product
    const match = findMatch(filename, lookup);
    if (!match) {
      noMatch++;
      results.push({ filename, status: "no-match" });
      continue;
    }

    // Check if already has real image
    const assetRef = match.assetRef;
    if (assetRef && assetRef !== PLACEHOLDER_REF) {
      skippedHasImage++;
      results.push({ filename, status: "skipped-has-image", productCode: match.code, productId: match._id });
      continue;
    }

    // Compress
    const baseName = path.basename(filename, path.extname(filename));
    const compressedPath = path.join(COMPRESSED_DIR, `${baseName}.jpg`);
    const compressed = compressImage(info.path, compressedPath);
    if (!compressed || !fs.existsSync(compressedPath)) {
      compressFail++;
      results.push({ filename, status: "compress-failed", productCode: match.code, productId: match._id });
      continue;
    }

    // Upload (or reuse)
    let assetId: string;
    if (uploadedAssets.has(filename)) {
      assetId = uploadedAssets.get(filename)!;
    } else {
      try {
        assetId = await uploadImage(compressedPath, `${baseName}.jpg`);
        uploadedAssets.set(filename, assetId);
      } catch (err: any) {
        uploadFail++;
        results.push({ filename, status: "upload-failed", productCode: match.code, productId: match._id, error: err.message });
        continue;
      }
    }

    // Patch
    try {
      await attachImage(match._id, assetId);
      success++;
      results.push({ filename, status: "success", productCode: match.code, productId: match._id, assetId });
    } catch (err: any) {
      patchFail++;
      results.push({ filename, status: "patch-failed", productCode: match.code, productId: match._id, assetId, error: err.message });
    }
  }

  process.stdout.write("\n");

  console.log("\n" + "=".repeat(80));
  console.log("COMPREHENSIVE UPLOAD RESULTS");
  console.log("=".repeat(80));
  console.log(`Success:            ${success}`);
  console.log(`Skipped (has img):  ${skippedHasImage}`);
  console.log(`No match in Sanity: ${noMatch}`);
  console.log(`Compress failed:    ${compressFail}`);
  console.log(`Upload failed:      ${uploadFail}`);
  console.log(`Patch failed:       ${patchFail}`);
  console.log(`Total images:       ${allImages.length}`);
  console.log(`Unique uploads:     ${uploadedAssets.size}`);

  const reportPath = `output/comprehensive-upload-report-${Date.now()}.json`;
  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        summary: { success, skippedHasImage, noMatch, compressFail, uploadFail, patchFail, total: allImages.length, uniqueUploads: uploadedAssets.size },
        results,
      },
      null,
      2
    )
  );
  console.log(`\nReport saved: ${reportPath}`);
}

main().catch(console.error);

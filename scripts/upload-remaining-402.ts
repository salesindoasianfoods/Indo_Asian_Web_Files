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
const COMPRESSED_DIR = "output/compressed-remaining";

// Build file map
const fileMap = new Map<string, string>();
function walkDir(dir: string) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath);
    } else if (/\.(jpg|jpeg|png|webp|avif)$/i.test(entry.name)) {
      if (!fileMap.has(entry.name.toLowerCase())) {
        fileMap.set(entry.name.toLowerCase(), fullPath);
      }
    }
  }
}
walkDir(IMAGE_BASE_DIR);

// Load remaining images
const remainingImages: string[] = JSON.parse(fs.readFileSync("output/remaining-images.json", "utf-8"));

// Fetch all Sanity products with codes
async function fetchProducts() {
  return client.fetch<{ _id: string; code?: string; name?: string; image?: any }[]>(
    '*[_type == "product" && defined(code)] { _id, code, name, "assetRef": image.asset._ref }'
  );
}

function normalizeCode(str: string): string {
  return str.toUpperCase().replace(/\.[^.]+$/, "").replace(/[^A-Z0-9]/g, "");
}

function findMatch(filename: string, products: any[]) {
  const codeNorm = normalizeCode(filename);
  // Exact code match
  for (const p of products) {
    if (p.code && normalizeCode(p.code) === codeNorm) return p;
  }
  // Substring match
  for (const p of products) {
    if (p.code && (codeNorm.includes(normalizeCode(p.code)) || normalizeCode(p.code).includes(codeNorm))) return p;
  }
  // Name word match
  const words = codeNorm.match(/[A-Z]{3,}/g) || [];
  for (const p of products) {
    if (p.name) {
      const pName = p.name.toUpperCase().replace(/[^A-Z0-9]/g, "");
      const matches = words.filter(w => pName.includes(w)).length;
      if (matches >= 2) return p;
    }
  }
  return null;
}

function compress(inputPath: string, outputPath: string): boolean {
  try {
    const stats = fs.statSync(inputPath);
    const quality = stats.size / 1024 < 80 ? "2" : "5";
    const ext = path.extname(inputPath).toLowerCase();
    const vf = ext === ".png" ? "scale='min(1200,iw)':-1,format=rgba,geq=r='p(X,Y)':a='255'" : "scale='min(1200,iw)':-1";
    execSync(`ffmpeg -y -hide_banner -loglevel error -i "${inputPath}" -vf "${vf}" -q:v ${quality} "${outputPath}"`, { timeout: 30000 });
    return fs.existsSync(outputPath);
  } catch { return false; }
}

async function upload(filePath: string, filename: string) {
  const buffer = fs.readFileSync(filePath);
  const asset = await client.assets.upload("image", buffer, { filename });
  return asset._id;
}

async function patch(productId: string, assetId: string) {
  await client.patch(productId).set({ image: { _type: "image", asset: { _type: "reference", _ref: assetId } } }).commit();
}

async function main() {
  fs.mkdirSync(COMPRESSED_DIR, { recursive: true });
  console.log(`Processing ${remainingImages.length} remaining images...`);

  const products = await fetchProducts();
  console.log(`Loaded ${products.length} Sanity products`);

  let success = 0, skipped = 0, noMatch = 0, fail = 0;
  const uploadedAssets = new Map<string, string>();
  const results: any[] = [];

  for (let i = 0; i < remainingImages.length; i++) {
    const filename = remainingImages[i];
    process.stdout.write(`\r[${i + 1}/${remainingImages.length}] ${filename.slice(0, 35).padEnd(37)}`);
    if (i > 0 && i % 30 === 0) { process.stdout.write(" (pause)..."); await new Promise(r => setTimeout(r, 2000)); }

    const srcPath = fileMap.get(filename);
    if (!srcPath) { noMatch++; results.push({ filename, status: "no-file" }); continue; }

    const match = findMatch(filename, products);
    if (!match) { noMatch++; results.push({ filename, status: "no-match" }); continue; }

    if (match.assetRef && match.assetRef !== PLACEHOLDER_REF) {
      skipped++; results.push({ filename, status: "skipped-has-image", code: match.code });
      continue;
    }

    const baseName = path.basename(filename, path.extname(filename));
    const outPath = path.join(COMPRESSED_DIR, `${baseName}.jpg`);
    if (!compress(srcPath, outPath)) { fail++; results.push({ filename, status: "compress-fail", code: match.code }); continue; }

    let assetId: string;
    if (uploadedAssets.has(filename)) {
      assetId = uploadedAssets.get(filename)!;
    } else {
      try { assetId = await upload(outPath, `${baseName}.jpg`); uploadedAssets.set(filename, assetId); }
      catch (e: any) { fail++; results.push({ filename, status: "upload-fail", code: match.code, error: e.message }); continue; }
    }

    try { await patch(match._id, assetId); success++; results.push({ filename, status: "success", code: match.code, assetId }); }
    catch (e: any) { fail++; results.push({ filename, status: "patch-fail", code: match.code, error: e.message }); }
  }

  process.stdout.write("\n");
  console.log("\n=== RESULTS ===");
  console.log(`Success: ${success}`);
  console.log(`Skipped (has image): ${skipped}`);
  console.log(`No match / no file: ${noMatch}`);
  console.log(`Failed: ${fail}`);
  console.log(`Total: ${remainingImages.length}`);

  fs.writeFileSync(`output/remaining-upload-report-${Date.now()}.json`, JSON.stringify({ summary: { success, skipped, noMatch, fail, total: remainingImages.length }, results }, null, 2));
}

main().catch(console.error);

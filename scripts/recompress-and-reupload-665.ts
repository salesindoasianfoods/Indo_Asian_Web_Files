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
const COMPRESSED_DIR = "output/compressed-665";

// Build recursive file map
const fileMap = new Map<string, string>();
function walkDir(dir: string) {
  for (const entry of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (/\.(jpg|jpeg|png|webp|avif)$/i.test(entry)) {
      if (!fileMap.has(entry)) {
        fileMap.set(entry, fullPath);
      }
    }
  }
}
walkDir(IMAGE_BASE_DIR);

// ─── Load all product codes we need to re-compress ──────────────────────────

const allCodes = new Set<string>();
const codeToInfo = new Map<string, { code: string; name: string; file: string; brand: string }>();

// 1. Main upload report: 542 successes
const mainReport = JSON.parse(fs.readFileSync("output/upload-report-1778009082150.json", "utf-8"));
for (const r of mainReport.results) {
  if (r.status === "success") {
    allCodes.add(r.code);
    codeToInfo.set(r.code, { code: r.code, name: r.name, file: r.file, brand: r.brand });
  }
}

// 2. Main upload report: 107 skipped-no-file (these were retried later)
for (const r of mainReport.results) {
  if (r.status === "skipped-no-file" && r.productId) {
    allCodes.add(r.code);
    if (!codeToInfo.has(r.code)) {
      codeToInfo.set(r.code, { code: r.code, name: r.name, file: r.file, brand: r.brand });
    }
  }
}

// 3. Converted batch: 19 successes
const convReport = JSON.parse(fs.readFileSync("output/upload-report-converted-1778127486301.json", "utf-8"));
for (const r of convReport.results) {
  // These were already compressed — skip them from recompression
  allCodes.delete(r.code);
  codeToInfo.delete(r.code);
}

// 4. Fix-117 batch: already compressed — skip
const fixReport = JSON.parse(fs.readFileSync("output/fix-117-report-1778129873098.json", "utf-8"));
for (const r of fixReport.results) {
  if (r.status === "success" || r.status === "skipped-has-image") {
    allCodes.delete(r.code);
    codeToInfo.delete(r.code);
  }
}

const targetCodes = Array.from(allCodes);
console.log(`Total products to re-compress & re-upload: ${targetCodes.length}`);

// ─── Sanity helpers ─────────────────────────────────────────────────────────

async function fetchProduct(code: string) {
  return client.fetch<{ _id: string; name: string; image?: any } | null>(
    `*[_type == "product" && code == $code][0] { _id, name, image }`,
    { code }
  );
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
    console.error(`\nCompression failed for ${inputPath}:`, e);
    return false;
  }
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  fs.mkdirSync(COMPRESSED_DIR, { recursive: true });

  console.log("=".repeat(80));
  console.log("RE-COMPRESS & RE-UPLOAD 665 PRODUCTS");
  console.log("=".repeat(80));

  let success = 0;
  let skippedHasImage = 0;
  let noFile = 0;
  let compressFail = 0;
  let uploadFail = 0;
  let patchFail = 0;
  let productNotFound = 0;
  let alreadyCompressed = 0;

  const uploadedAssets = new Map<string, string>();
  const results: any[] = [];

  for (let i = 0; i < targetCodes.length; i++) {
    const code = targetCodes[i];
    const info = codeToInfo.get(code)!;
    const progress = `[${String(i + 1).padStart(4)}/${targetCodes.length}]`;
    process.stdout.write(`\r${progress} ${code.padEnd(15)} ${info.name.slice(0, 35).padEnd(37)}`);

    if (i > 0 && i % 30 === 0) {
      process.stdout.write("  (pausing)...");
      await new Promise((r) => setTimeout(r, 2000));
    }

    // 1. Find source image
    const srcPath = fileMap.get(info.file);
    if (!srcPath || !fs.existsSync(srcPath)) {
      // Try recursive search by filename only
      let found = false;
      for (const [fname, fpath] of fileMap.entries()) {
        if (fname.toLowerCase() === info.file.toLowerCase()) {
          found = true;
          break;
        }
      }
      if (!found) {
        noFile++;
        results.push({ code, name: info.name, file: info.file, status: "no-file" });
        continue;
      }
    }
    const actualSrc = srcPath || Array.from(fileMap.entries()).find(([k]) => k.toLowerCase() === info.file.toLowerCase())?.[1];
    if (!actualSrc) {
      noFile++;
      results.push({ code, name: info.name, file: info.file, status: "no-file" });
      continue;
    }

    // 2. Fetch product
    const product = await fetchProduct(code);
    if (!product) {
      productNotFound++;
      results.push({ code, name: info.name, file: info.file, status: "product-not-found" });
      continue;
    }

    // 3. Skip if still has placeholder (shouldn't happen, but safety check)
    const assetRef = product.image?.asset?._ref;
    if (!assetRef || assetRef === PLACEHOLDER_REF) {
      // Product currently has no image or placeholder — we need to upload
      // Continue with upload
    }

    // Check if current asset is already a compressed one (skip if so)
    // We can't easily tell, so we'll just re-upload everything in the target list

    // 4. Compress
    const baseName = path.basename(info.file, path.extname(info.file));
    const compressedPath = path.join(COMPRESSED_DIR, `${baseName}.jpg`);
    const compressed = compressImage(actualSrc, compressedPath);
    if (!compressed || !fs.existsSync(compressedPath)) {
      compressFail++;
      results.push({ code, name: info.name, file: info.file, status: "compress-failed", productId: product._id });
      continue;
    }

    // 5. Upload (or reuse cached)
    let assetId: string;
    const cacheKey = info.file;
    if (uploadedAssets.has(cacheKey)) {
      assetId = uploadedAssets.get(cacheKey)!;
    } else {
      try {
        assetId = await uploadImage(compressedPath, `${baseName}.jpg`);
        uploadedAssets.set(cacheKey, assetId);
      } catch (err: any) {
        uploadFail++;
        results.push({ code, name: info.name, file: info.file, status: "upload-failed", productId: product._id, error: err.message });
        continue;
      }
    }

    // 6. Patch
    try {
      await attachImage(product._id, assetId);
      success++;
      results.push({ code, name: info.name, file: info.file, status: "success", productId: product._id, assetId });
    } catch (err: any) {
      patchFail++;
      results.push({ code, name: info.name, file: info.file, status: "patch-failed", productId: product._id, assetId, error: err.message });
    }
  }

  process.stdout.write("\n");

  console.log("\n" + "=".repeat(80));
  console.log("RE-COMPRESSION RESULTS");
  console.log("=".repeat(80));
  console.log(`Success:            ${success}`);
  console.log(`Skipped (has img):  ${skippedHasImage}`);
  console.log(`No source file:     ${noFile}`);
  console.log(`Compress failed:    ${compressFail}`);
  console.log(`Upload failed:      ${uploadFail}`);
  console.log(`Patch failed:       ${patchFail}`);
  console.log(`Product not found:  ${productNotFound}`);
  console.log(`Already compressed: ${alreadyCompressed}`);
  console.log(`Total targeted:     ${targetCodes.length}`);
  console.log(`Unique uploads:     ${uploadedAssets.size}`);

  const reportPath = `output/recompress-665-report-${Date.now()}.json`;
  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        summary: { success, skippedHasImage, noFile, compressFail, uploadFail, patchFail, productNotFound, total: targetCodes.length, uniqueUploads: uploadedAssets.size },
        results,
      },
      null,
      2
    )
  );
  console.log(`\nReport saved: ${reportPath}`);
}

main().catch(console.error);

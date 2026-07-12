import fs from "fs";
import path from "path";
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

const IMAGE_BASE_DIR = "product-files/new proudcts/PRODUCTS LIST";
const REPORT_FILE = "output/upload-report-1778009082150.json";
const PLACEHOLDER_REF = "image-392ae88a5edcfe8b29b5e84dffd03ba833be05e9-900x1200-jpg";

// Build a map of all files across all brand folders
const fileMap = new Map<string, string>();
for (const brand of fs.readdirSync(IMAGE_BASE_DIR)) {
  const brandPath = path.join(IMAGE_BASE_DIR, brand);
  if (!fs.statSync(brandPath).isDirectory()) continue;
  for (const root of walkSync(brandPath)) {
    for (const f of fs.readdirSync(root)) {
      const fpath = path.join(root, f);
      if (fs.statSync(fpath).isFile() && !fileMap.has(f)) {
        fileMap.set(f, fpath);
      }
    }
  }
}

function* walkSync(dir: string): Generator<string> {
  yield dir;
  for (const d of fs.readdirSync(dir)) {
    const full = path.join(dir, d);
    if (fs.statSync(full).isDirectory()) {
      yield* walkSync(full);
    }
  }
}

async function fetchProductByCode(code: string) {
  return client.fetch<{ _id: string; image?: any } | null>(
    `*[_type == "product" && code == $code][0] { _id, image }`,
    { code }
  );
}

async function uploadImage(filePath: string, filename: string): Promise<string> {
  const buffer = fs.readFileSync(filePath);
  const asset = await client.assets.upload("image", buffer, { filename });
  return asset._id;
}

async function attachImageToProduct(productId: string, assetId: string) {
  await client.patch(productId).set({
    image: { _type: "image", asset: { _type: "reference", _ref: assetId } }
  }).commit();
}

async function main() {
  const report = JSON.parse(fs.readFileSync(REPORT_FILE, "utf-8"));
  const skipped = report.results.filter((r: any) => r.status === "skipped-no-file");

  console.log(`Found ${skipped.length} skipped products to retry\n`);

  let success = 0;
  let stillMissing = 0;
  let failed = 0;
  const uploadedAssets = new Map<string, string>();

  for (let i = 0; i < skipped.length; i++) {
    const item = skipped[i];
    process.stdout.write(`\r[${i + 1}/${skipped.length}] ${item.code}`);

    if (i > 0 && i % 50 === 0) {
      process.stdout.write("  (pausing)...");
      await new Promise(r => setTimeout(r, 2000));
    }

    // Find the file
    const imagePath = fileMap.get(item.file);
    if (!imagePath) {
      stillMissing++;
      continue;
    }

    // Fetch product
    const product = await fetchProductByCode(item.code);
    if (!product) {
      stillMissing++;
      continue;
    }

    // Skip if already has real image
    const assetRef = product.image?.asset?._ref;
    if (assetRef && assetRef !== PLACEHOLDER_REF) {
      stillMissing++;
      continue;
    }

    // Upload image (or reuse cached asset)
    let assetId: string;
    if (uploadedAssets.has(item.file)) {
      assetId = uploadedAssets.get(item.file)!;
    } else {
      try {
        assetId = await uploadImage(imagePath, item.file);
        uploadedAssets.set(item.file, assetId);
      } catch (err: any) {
        failed++;
        continue;
      }
    }

    // Patch product
    try {
      await attachImageToProduct(product._id, assetId);
      success++;
    } catch (err: any) {
      failed++;
    }
  }

  process.stdout.write("\n\n");
  console.log("=".repeat(60));
  console.log("RETRY RESULTS");
  console.log("=".repeat(60));
  console.log(`Success:        ${success}`);
  console.log(`Still missing:  ${stillMissing}`);
  console.log(`Failed:         ${failed}`);
  console.log(`Total retried:  ${skipped.length}`);
  console.log("=".repeat(60));
}

main().catch(console.error);

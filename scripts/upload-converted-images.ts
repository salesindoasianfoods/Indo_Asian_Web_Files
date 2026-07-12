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

const CONVERTED_DIR = "output/converted";
const REPORT_FILE = "output/upload-report-1778009082150.json";
const PLACEHOLDER_REF = "image-392ae88a5edcfe8b29b5e84dffd03ba833be05e9-900x1200-jpg";

// Map product code -> converted filename
const CONVERTED_MAP: Record<string, string> = {
  KOR: "KOR.jpg",
  IDCOFFEELIQ10: "IDCOFFEELIQ10.jpg",
  MTBEECUTL: "MTBEECUTL.jpg",
  MTBEEFC: "MTBEEFC.jpg",
  MTBEPI: "MTBEPI.jpg",
  MTBUTTCHI: "MTBUTTCHI.jpg",
  MTCB: "MTCB.jpg",
  MTCHCU: "MTCHCU.jpg",
  MTCHILLCH: "MTCHILLCH.jpg",
  MTFISHBI: "MTFISHBI.jpg",
  MTFISHCUT: "MTFISHCUT.jpg",
  MTFISHPIC: "MTFISHPIC.jpg",
  MTKAPPB: "MTKAPPB.jpg",
  MTKINFCU: "MTKINFCU.jpg",
  MTMUTB: "MTMUTB.jpg",
  MTMUTCU: "MTMUTCU.jpg",
  MTPMC: "MTPMC.jpg",
  MTPRAWBR: "MTPRAWBR.jpg",
  MTPRAWPIC: "MTPRAWPIC.jpg",
};

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
    image: { _type: "image", asset: { _type: "reference", _ref: assetId } },
  }).commit();
}

async function main() {
  const report = JSON.parse(fs.readFileSync(REPORT_FILE, "utf-8"));
  const failed = report.results.filter((r: any) => r.status === "failed-upload");

  // Only process the ones we have converted
  const toProcess = failed.filter((r: any) => CONVERTED_MAP[r.code]);
  console.log(`Found ${failed.length} failed uploads, ${toProcess.length} have converted files ready\n`);

  let success = 0;
  let skippedHasImage = 0;
  let failedUpload = 0;
  let failedPatch = 0;
  const uploadedAssets = new Map<string, string>();

  for (let i = 0; i < toProcess.length; i++) {
    const item = toProcess[i];
    const convertedFile = CONVERTED_MAP[item.code];
    const filePath = path.join(CONVERTED_DIR, convertedFile);

    process.stdout.write(`\r[${String(i + 1).padStart(2)}/${toProcess.length}] ${item.code} -> ${convertedFile}`);

    if (!fs.existsSync(filePath)) {
      failedUpload++;
      continue;
    }

    // Fetch product
    const product = await fetchProductByCode(item.code);
    if (!product) {
      failedUpload++;
      continue;
    }

    // Skip if already has real image (not placeholder)
    const assetRef = product.image?.asset?._ref;
    if (assetRef && assetRef !== PLACEHOLDER_REF) {
      skippedHasImage++;
      continue;
    }

    // Upload image (or reuse cached asset)
    let assetId: string;
    if (uploadedAssets.has(convertedFile)) {
      assetId = uploadedAssets.get(convertedFile)!;
    } else {
      try {
        assetId = await uploadImage(filePath, convertedFile);
        uploadedAssets.set(convertedFile, assetId);
      } catch (err: any) {
        failedUpload++;
        continue;
      }
    }

    // Patch product
    try {
      await attachImageToProduct(product._id, assetId);
      success++;
    } catch (err: any) {
      failedPatch++;
    }
  }

  process.stdout.write("\n\n");
  console.log("=".repeat(60));
  console.log("CONVERTED IMAGE UPLOAD RESULTS");
  console.log("=".repeat(60));
  console.log(`Success:          ${success}`);
  console.log(`Skipped (has img):${skippedHasImage}`);
  console.log(`Upload failed:    ${failedUpload}`);
  console.log(`Patch failed:     ${failedPatch}`);
  console.log(`Total processed:  ${toProcess.length}`);
  console.log(`Unique uploads:   ${uploadedAssets.size}`);
  console.log("=".repeat(60));

  // Save mini-report
  const reportPath = `output/upload-report-converted-${Date.now()}.json`;
  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        summary: { success, skippedHasImage, failedUpload, failedPatch, total: toProcess.length },
        results: toProcess.map((r: any) => ({
          code: r.code,
          name: r.name,
          file: CONVERTED_MAP[r.code],
          originalFile: r.file,
          brand: r.brand,
        })),
      },
      null,
      2
    )
  );
  console.log(`\nReport saved: ${reportPath}`);
}

main().catch(console.error);

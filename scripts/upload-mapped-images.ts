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
const MAPPING_FILE = "docs/kimi/VERIFIED_IMAGE_MAPPING.md";

interface Mapping {
  rowNum: number;
  imageFile: string;
  brandFolder: string;
  productCode: string;
  productName: string;
  category: string;
  matchType: string;
}

interface UploadResult {
  mapping: Mapping;
  status: "success" | "skipped-has-image" | "skipped-no-file" | "failed-upload" | "failed-patch" | "product-not-found";
  productId?: string;
  assetId?: string;
  error?: string;
}

// ─── Parse the verified mapping markdown ───────────────────────────────────

function parseMappingFile(): Mapping[] {
  const content = fs.readFileSync(MAPPING_FILE, "utf-8");
  const lines = content.split("\n");

  const mappings: Mapping[] = [];
  let inTable = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("| # ") && trimmed.includes("Image File")) {
      inTable = true;
      continue;
    }
    if (!inTable) continue;
    if (trimmed.includes("---")) continue;
    if (!trimmed.startsWith("|")) {
      // blank line or comment ends table section
      continue;
    }

    const cells = trimmed
      .split("|")
      .map((c) => c.trim().replace(/^`/, "").replace(/`$/, ""))
      .filter((c) => c !== "");

    if (cells.length < 7) continue;

    mappings.push({
      rowNum: parseInt(cells[0], 10) || 0,
      imageFile: cells[1],
      brandFolder: cells[2],
      productCode: cells[3],
      productName: cells[4],
      category: cells[5],
      matchType: cells[6],
    });
  }

  return mappings;
}

// ─── Sanity helpers ────────────────────────────────────────────────────────

async function fetchProductByCode(code: string): Promise<{ _id: string; image?: any } | null> {
  const result = await client.fetch<{ _id: string; image?: any } | null>(
    `*[_type == "product" && code == $code][0] { _id, image }`,
    { code }
  );
  return result;
}

async function uploadImage(filePath: string, filename: string): Promise<string> {
  const buffer = fs.readFileSync(filePath);
  const asset = await client.assets.upload("image", buffer, { filename });
  return asset._id;
}

async function attachImageToProduct(productId: string, assetId: string): Promise<void> {
  await client
    .patch(productId)
    .set({
      image: {
        _type: "image",
        asset: {
          _type: "reference",
          _ref: assetId,
        },
      },
    })
    .commit();
}

// ─── Main ──────────────────────────────────────────────────────────────────

async function main() {
  console.log("=".repeat(80));
  console.log("UPLOAD MAPPED IMAGES TO SANITY");
  console.log("=".repeat(80));

  const mappings = parseMappingFile();
  console.log(`\nParsed ${mappings.length} mappings from ${MAPPING_FILE}\n`);

  const results: UploadResult[] = [];
  let successCount = 0;
  let skippedHasImage = 0;
  let skippedNoFile = 0;
  let productNotFound = 0;
  let uploadFail = 0;
  let patchFail = 0;

  // Track uploaded images to avoid duplicate uploads (same file used for multiple products)
  const uploadedAssets = new Map<string, string>();

  for (let i = 0; i < mappings.length; i++) {
    const m = mappings[i];
    const progress = `[${String(i + 1).padStart(4)}/${mappings.length}]`;
    process.stdout.write(`\r${progress} ${m.productCode.padEnd(12)} ${m.imageFile.slice(0, 40).padEnd(42)}`);

    // Rate limit: small pause every 50 items
    if (i > 0 && i % 50 === 0) {
      process.stdout.write(`  (pausing for rate limit)...`);
      await new Promise((r) => setTimeout(r, 2000));
    }

    try {
      // 1. Find product in Sanity
      const product = await fetchProductByCode(m.productCode);
      if (!product) {
        productNotFound++;
        results.push({ mapping: m, status: "product-not-found" });
        continue;
      }

      // 2. Skip only if already has a REAL image (not the placeholder)
      const PLACEHOLDER_REF = "image-392ae88a5edcfe8b29b5e84dffd03ba833be05e9-900x1200-jpg";
      const assetRef = product.image?.asset?._ref;
      if (assetRef && assetRef !== PLACEHOLDER_REF) {
        skippedHasImage++;
        results.push({ mapping: m, status: "skipped-has-image", productId: product._id });
        continue;
      }

      // 3. Resolve image file path
      const imagePath = path.join(IMAGE_BASE_DIR, m.brandFolder, m.imageFile);
      if (!fs.existsSync(imagePath)) {
        skippedNoFile++;
        results.push({ mapping: m, status: "skipped-no-file", productId: product._id });
        continue;
      }

      // 4. Upload image (or reuse cached asset)
      let assetId: string;
      const cacheKey = `${m.brandFolder}/${m.imageFile}`;
      if (uploadedAssets.has(cacheKey)) {
        assetId = uploadedAssets.get(cacheKey)!;
      } else {
        try {
          assetId = await uploadImage(imagePath, m.imageFile);
          uploadedAssets.set(cacheKey, assetId);
        } catch (err: any) {
          uploadFail++;
          results.push({ mapping: m, status: "failed-upload", productId: product._id, error: err.message });
          continue;
        }
      }

      // 5. Patch product with image
      try {
        await attachImageToProduct(product._id, assetId);
        successCount++;
        results.push({ mapping: m, status: "success", productId: product._id, assetId });
      } catch (err: any) {
        patchFail++;
        results.push({ mapping: m, status: "failed-patch", productId: product._id, assetId, error: err.message });
      }
    } catch (err: any) {
      // Unexpected error
      results.push({ mapping: m, status: "failed-patch", error: err.message });
      patchFail++;
    }
  }

  process.stdout.write("\n");

  // ─── Print report ───────────────────────────────────────────────────────
  console.log("\n" + "=".repeat(80));
  console.log("COMPLETION REPORT");
  console.log("=".repeat(80));

  console.log(`\n${"Status".padEnd(22)} ${"Count".padStart(6)}`);
  console.log("-".repeat(30));
  console.log(`Success               ${String(successCount).padStart(6)}`);
  console.log(`Skipped (has image)   ${String(skippedHasImage).padStart(6)}`);
  console.log(`Skipped (no file)     ${String(skippedNoFile).padStart(6)}`);
  console.log(`Product not found     ${String(productNotFound).padStart(6)}`);
  console.log(`Upload failed         ${String(uploadFail).padStart(6)}`);
  console.log(`Patch failed          ${String(patchFail).padStart(6)}`);
  console.log("-".repeat(30));
  console.log(`Total processed       ${String(mappings.length).padStart(6)}`);
  console.log(`Unique images uploaded ${String(uploadedAssets.size).padStart(5)}`);

  // ─── Failure details ────────────────────────────────────────────────────
  const failures = results.filter(
    (r) => r.status === "failed-upload" || r.status === "failed-patch" || r.status === "product-not-found"
  );
  if (failures.length > 0) {
    console.log("\n" + "-".repeat(80));
    console.log("FAILURE DETAILS");
    console.log("-".repeat(80));
    for (const f of failures) {
      console.log(`${f.mapping.productCode.padEnd(12)} ${f.status.padEnd(20)} ${f.error || ""}`);
    }
  }

  // ─── Save JSON report ───────────────────────────────────────────────────
  const reportPath = `output/upload-report-${Date.now()}.json`;
  fs.mkdirSync("output", { recursive: true });
  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        summary: {
          total: mappings.length,
          success: successCount,
          skippedHasImage,
          skippedNoFile,
          productNotFound,
          uploadFail,
          patchFail,
          uniqueImagesUploaded: uploadedAssets.size,
        },
        results: results.map((r) => ({
          code: r.mapping.productCode,
          name: r.mapping.productName,
          file: r.mapping.imageFile,
          brand: r.mapping.brandFolder,
          status: r.status,
          productId: r.productId,
          assetId: r.assetId,
          error: r.error,
        })),
      },
      null,
      2
    )
  );
  console.log(`\nDetailed JSON report saved: ${reportPath}`);
  console.log("=".repeat(80));
}

main().catch((err) => {
  console.error("\nFatal error:", err);
  process.exit(1);
});

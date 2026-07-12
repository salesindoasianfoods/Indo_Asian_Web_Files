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

const PLAN_PATH = "docs/plan/PRODUCT_UPLOAD_PLAN.md";
const IMAGE_DIR = "product-files/viswas-products-compressed";

interface ProductRow {
  category: string;
  code: string;
  name: string;
  weight: string;
  price: string;
  imageFilename: string;
}

interface UploadResult {
  product: ProductRow;
  productId?: string;
  assetId?: string;
  error?: string;
}

function parsePlan(): ProductRow[] {
  const content = fs.readFileSync(PLAN_PATH, "utf-8");
  const lines = content.split("\n");

  const products: ProductRow[] = [];
  let currentCategory = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Detect category header
    if (line.startsWith("### ")) {
      currentCategory = line.replace("### ", "").trim();
      continue;
    }

    // Skip non-data table rows
    if (!line.startsWith("|")) continue;
    if (line.includes("Code") && line.includes("Product Name")) continue;
    if (line.replace(/\|/g, "").trim().replace(/-/g, "").trim() === "") continue;

    const cells = line
      .split("|")
      .map((c) => c.trim())
      .filter((c) => c !== "");

    if (cells.length < 6) continue;

    const code = cells[1];
    const name = cells[2];
    const weight = cells[3];
    const price = cells[4];
    const imageCell = cells[5];

    // Skip rows with no image
    if (imageCell === "—") continue;

    // Extract image filename from backticks
    const match = imageCell.match(/`([^`]+)`/);
    if (!match) continue;

    const imageFilename = match[1].trim();

    products.push({
      category: currentCategory,
      code,
      name,
      weight,
      price,
      imageFilename,
    });
  }

  return products;
}

async function fetchCategories(): Promise<Map<string, string>> {
  const query = `*[_type == "category"] { _id, name }`;
  const categories = await client.fetch<{ _id: string; name: string }[]>(query);
  const map = new Map<string, string>();
  for (const cat of categories) {
    map.set(cat.name, cat._id);
  }
  return map;
}

async function uploadImage(filename: string): Promise<string | undefined> {
  const filePath = path.join(IMAGE_DIR, filename);
  if (!fs.existsSync(filePath)) {
    return undefined;
  }

  const buffer = fs.readFileSync(filePath);
  const asset = await client.assets.upload("image", buffer, {
    filename,
  });

  return asset._id;
}

async function createProduct(
  product: ProductRow,
  categoryId: string | undefined,
  assetId: string | undefined
): Promise<string> {
  const doc: any = {
    _type: "product",
    name: product.name,
  };

  if (product.code) doc.code = product.code;
  if (product.weight) doc.weight = product.weight;
  if (product.price) doc.price = product.price;

  if (categoryId) {
    doc.category = {
      _type: "reference",
      _ref: categoryId,
    };
  }

  if (assetId) {
    doc.image = {
      _type: "image",
      asset: {
        _type: "reference",
        _ref: assetId,
      },
    };
  }

  const result = await client.create(doc);
  return result._id;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

async function main() {
  console.log("Parsing product plan...");
  const products = parsePlan();
  console.log(`Found ${products.length} products with images\n`);

  console.log("Fetching categories from Sanity...");
  const categoryMap = await fetchCategories();
  console.log(`Found ${categoryMap.size} categories in Sanity\n`);

  // Track uploaded images to avoid re-uploading duplicates
  const uploadedImages = new Map<string, string>();

  const results: UploadResult[] = [];
  let successCount = 0;
  let failCount = 0;
  let missingImageCount = 0;

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    process.stdout.write(`\r[${i + 1}/${products.length}] ${product.code} — ${product.name.slice(0, 40)}`);

    try {
      // Find or upload image
      let assetId: string | undefined;
      if (uploadedImages.has(product.imageFilename)) {
        assetId = uploadedImages.get(product.imageFilename);
      } else {
        const imagePath = path.join(IMAGE_DIR, product.imageFilename);
        if (fs.existsSync(imagePath)) {
          assetId = await uploadImage(product.imageFilename);
          if (assetId) {
            uploadedImages.set(product.imageFilename, assetId);
          }
        } else {
          missingImageCount++;
        }
      }

      // Find category
      const categoryId = categoryMap.get(product.category);

      // Create product
      const productId = await createProduct(product, categoryId, assetId);

      results.push({ product, productId, assetId });
      successCount++;
    } catch (err: any) {
      results.push({ product, error: err.message });
      failCount++;
    }
  }

  console.log("\n\n" + "=".repeat(90));
  console.log("UPLOAD REPORT");
  console.log("=".repeat(90));

  console.log(`\n${"Code".padEnd(18)} ${"Name".padEnd(35)} ${"Category".padEnd(30)} ${"Status".padStart(8)}`);
  console.log("-".repeat(90));

  for (const r of results) {
    const status = r.error ? "FAIL" : "OK";
    const name = r.product.name.slice(0, 34).padEnd(35);
    const cat = r.product.category.slice(0, 29).padEnd(30);
    console.log(`${r.product.code.padEnd(18)} ${name} ${cat} ${status.padStart(8)}`);
    if (r.error) {
      console.log(`  → Error: ${r.error}`);
    }
  }

  console.log("-".repeat(90));
  console.log(`\nSUMMARY:`);
  console.log(`  Total products found:     ${products.length}`);
  console.log(`  Successfully created:     ${successCount}`);
  console.log(`  Failed:                   ${failCount}`);
  console.log(`  Missing image files:      ${missingImageCount}`);
  console.log(`  Unique images uploaded:   ${uploadedImages.size}`);
  console.log(`  Total image bytes saved:  See compression report`);
  console.log("=".repeat(90));
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

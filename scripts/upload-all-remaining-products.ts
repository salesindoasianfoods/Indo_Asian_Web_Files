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

const IMAGE_PATH = "product-files/viswas-products-compressed/biriyani-masala.jpg";
const PRODUCTS_JSON = "scripts/products-without-images.json";

function extractUnit(name: string): string | undefined {
  const match = name.match(/\b[xX]\s*(\d+)\b/);
  if (match) return `X${match[1]}`;
  return undefined;
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

async function uploadPlaceholderImage(): Promise<string> {
  console.log("Uploading placeholder image...");
  const buffer = fs.readFileSync(IMAGE_PATH);
  const asset = await client.assets.upload("image", buffer, {
    filename: "biriyani-masala.jpg",
  });
  console.log(`Placeholder image uploaded: ${asset._id}\n`);
  return asset._id;
}

interface ProductRow {
  category: string;
  code: string;
  name: string;
  weight: string;
  price: string;
}

async function createProduct(
  product: ProductRow,
  categoryId: string | undefined,
  assetId: string
): Promise<string> {
  const doc: any = {
    _type: "product",
    name: product.name,
  };

  if (product.code) doc.code = product.code;
  if (product.weight) doc.weight = product.weight;
  if (product.price) doc.price = product.price;

  const unit = extractUnit(product.name);
  if (unit) doc.unit = unit;

  if (categoryId) {
    doc.category = {
      _type: "reference",
      _ref: categoryId,
    };
  }

  doc.image = {
    _type: "image",
    asset: {
      _type: "reference",
      _ref: assetId,
    },
  };

  const result = await client.create(doc);
  return result._id;
}

async function main() {
  console.log("Loading products...");
  const products: ProductRow[] = JSON.parse(fs.readFileSync(PRODUCTS_JSON, "utf-8"));
  console.log(`Found ${products.length} products to upload\n`);

  const categoryMap = await fetchCategories();
  console.log(`Found ${categoryMap.size} categories\n`);

  const assetId = await uploadPlaceholderImage();

  let successCount = 0;
  let failCount = 0;
  const failed: Array<{ product: ProductRow; error: string }> = [];

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    process.stdout.write(`\r[${i + 1}/${products.length}] ${product.code.padEnd(15)} ${product.name.slice(0, 40)}`);

    try {
      const categoryId = categoryMap.get(product.category);
      await createProduct(product, categoryId, assetId);
      successCount++;
    } catch (err: any) {
      failCount++;
      failed.push({ product, error: err.message });
      process.stdout.write(`\n  ✗ Failed: ${err.message}\n`);
    }

    // Small delay every 50 products to avoid rate limiting
    if (i > 0 && i % 50 === 0) {
      await new Promise((r) => setTimeout(r, 100));
    }
  }

  console.log("\n\n" + "=".repeat(80));
  console.log("UPLOAD REPORT");
  console.log("=".repeat(80));
  console.log(`Total products:   ${products.length}`);
  console.log(`Successfully created: ${successCount}`);
  console.log(`Failed:           ${failCount}`);

  if (failed.length > 0) {
    console.log("\nFailed products:");
    for (const f of failed) {
      console.log(`  ${f.product.code} — ${f.error}`);
    }
  }
  console.log("=".repeat(80));
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

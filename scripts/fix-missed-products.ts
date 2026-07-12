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

// The images we know were missed
const MISSED_IMAGES = new Set([
  "Angamaly Manga Curry.jpg",
  "Chemba Puttu & Kadala Curry.jpg",
  "Coconut Bun.jpg",
  "Copy-of-Viswas-Banana-Chips-400gms.jpg",
  "Malabar porotta family pack 908g.jpg",
  "Masala Dosa.jpg",
  "Pathiri.jpg",
  "Spicy Banana Chips_400g (1).jpg",
  "Steamed Banana.jpg",
  "White Puttu & Kadala Curry.jpg",
  "birds eye chilli .jpg",
  "cheera thoran 350g.jpg",
  "idichikka-thoran.jpg",
]);

interface ProductRow {
  category: string;
  code: string;
  name: string;
  weight: string;
  price: string;
  imageFilename: string;
}

function parsePlan(): ProductRow[] {
  const content = fs.readFileSync(PLAN_PATH, "utf-8");
  const lines = content.split("\n");

  const products: ProductRow[] = [];
  let currentCategory = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith("### ")) {
      currentCategory = line.replace("### ", "").trim();
      continue;
    }

    if (!line.startsWith("|")) continue;
    if (line.includes("Code") && line.includes("Product Name")) continue;
    if (line.replace(/\|/g, "").trim().replace(/-/g, "").trim() === "") continue;

    // Split by | but preserve empty cells
    const cells = line.split("|").map((c) => c.trim());
    // Remove first and last empty cells from leading/trailing |
    const trimmedCells = cells.slice(1, -1);

    if (trimmedCells.length < 6) continue;

    const code = trimmedCells[1];
    const name = trimmedCells[2];
    const weight = trimmedCells[3];
    const price = trimmedCells[4];
    const imageCell = trimmedCells[5];

    if (imageCell === "—") continue;

    const match = imageCell.match(/`([^`]+)`/);
    if (!match) continue;

    const imageFilename = match[1].trim();

    if (MISSED_IMAGES.has(imageFilename)) {
      products.push({
        category: currentCategory,
        code,
        name,
        weight,
        price,
        imageFilename,
      });
    }
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
  if (!fs.existsSync(filePath)) return undefined;

  const buffer = fs.readFileSync(filePath);
  const asset = await client.assets.upload("image", buffer, { filename });
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
    doc.category = { _type: "reference", _ref: categoryId };
  }

  if (assetId) {
    doc.image = {
      _type: "image",
      asset: { _type: "reference", _ref: assetId },
    };
  }

  const result = await client.create(doc);
  return result._id;
}

async function main() {
  console.log("Finding missed products...");
  const products = parsePlan();
  console.log(`Found ${products.length} missed products\n`);

  const categoryMap = await fetchCategories();

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    process.stdout.write(`\r[${i + 1}/${products.length}] ${product.code} — ${product.name.slice(0, 40)}`);

    try {
      const assetId = await uploadImage(product.imageFilename);
      const categoryId = categoryMap.get(product.category);
      const productId = await createProduct(product, categoryId, assetId);
      console.log(`\n  ✓ Created: ${productId}`);
    } catch (err: any) {
      console.log(`\n  ✗ Failed: ${err.message}`);
    }
  }

  console.log("\n\nDone!");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

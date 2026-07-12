import fs from "fs";

const PLAN_PATH = "docs/plan/PRODUCT_UPLOAD_PLAN.md";
const content = fs.readFileSync(PLAN_PATH, "utf-8");
const lines = content.split("\n");

interface Product {
  category: string;
  code: string;
  name: string;
  weight: string;
  price: string;
  hasImage: boolean;
}

let currentCategory = "";
const allProducts: Product[] = [];
const seenCodes = new Set<string>();

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();

  if (line.startsWith("### ")) {
    currentCategory = line.replace("### ", "").trim();
    continue;
  }

  if (!line.startsWith("|")) continue;
  if (line.includes("Code") && line.includes("Product Name")) continue;
  if (line.replace(/\|/g, "").trim().replace(/-/g, "").trim() === "") continue;

  const cells = line.split("|").map((c) => c.trim());
  const dataCells = cells.slice(1, -1);
  if (dataCells.length < 6) continue;

  const code = dataCells[1];
  const name = dataCells[2];
  const weight = dataCells[3];
  const price = dataCells[4];
  const imageCell = dataCells[5];

  // Skip header rows
  if (!code || code === "Code" || code === "#") continue;
  // Product codes are typically alphanumeric
  if (!/^[A-Z0-9][A-Z0-9\-_]*$/i.test(code)) continue;
  // Name should be reasonable
  if (!name || name.length < 3) continue;
  // Price should look like a number (allow 0.00)
  const priceStr = price.replace(/[^0-9.]/g, "");
  const priceNum = parseFloat(priceStr);
  if (isNaN(priceNum)) continue;

  // Skip duplicates by code
  if (seenCodes.has(code)) continue;
  seenCodes.add(code);

  const hasImage = imageCell !== "—" && imageCell.includes("`");

  allProducts.push({ category: currentCategory, code, name, weight, price, hasImage });
}

const withImage = allProducts.filter((p) => p.hasImage);
const withoutImage = allProducts.filter((p) => !p.hasImage);

console.log(`TOTAL: ${allProducts.length}`);
console.log(`With images: ${withImage.length}`);
console.log(`Without images: ${withoutImage.length}`);

// Save to JSON for inspection
fs.writeFileSync("scripts/all-products.json", JSON.stringify(allProducts, null, 2));
fs.writeFileSync("scripts/products-without-images.json", JSON.stringify(withoutImage, null, 2));

console.log("\nSaved to scripts/all-products.json and scripts/products-without-images.json");

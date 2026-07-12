import fs from "fs";

const PLAN_PATH = "docs/plan/PRODUCT_UPLOAD_PLAN.md";
const IMAGE_DIR = "product-files/viswas-products-compressed";

const allImages = fs.readdirSync(IMAGE_DIR)
  .filter(f => /\.(jpg|jpeg|png|webp|gif)$/i.test(f))
  .sort();

const content = fs.readFileSync(PLAN_PATH, "utf-8");
const lines = content.split("\n");

// Find all image references in the plan
const mappedImages = new Set<string>();
const mappedProducts: Array<{ code: string; name: string; category: string; image: string; line: number }> = [];

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

  const cells = line.split("|").map(c => c.trim());
  const dataCells = cells.slice(1, -1);
  if (dataCells.length < 6) continue;

  const code = dataCells[1];
  const name = dataCells[2];
  const imageCell = dataCells[5];

  if (imageCell === "—") continue;
  const match = imageCell.match(/`([^`]+)`/);
  if (!match) continue;

  const imageFilename = match[1].trim();
  mappedImages.add(imageFilename);
  mappedProducts.push({ code, name, category: currentCategory, image: imageFilename, line: i + 1 });
}

// Find unused images
const unusedImages = allImages.filter(img => !mappedImages.has(img));

console.log("=".repeat(90));
console.log("FULL IMAGE AUDIT REPORT");
console.log("=".repeat(90));
console.log(`\nTotal images in folder:     ${allImages.length}`);
console.log(`Images mapped to products:  ${mappedImages.size}`);
console.log(`Products with images:       ${mappedProducts.length}`);
console.log(`Unused images:              ${unusedImages.length}`);

// Categorize unused images
console.log("\n" + "=".repeat(90));
console.log("UNUSED IMAGES BREAKDOWN");
console.log("=".repeat(90));

const categories: Record<string, string[]> = {
  "In 'Duplicate/Alternate Images' section (alternate shot)": [],
  "In 'Unmatched Images' section (ambiguous/unidentifiable)": [],
  "Found in plan tables but parser missed": [],
  "Not found anywhere in plan": [],
};

for (const img of unusedImages) {
  const baseName = img.replace(/\.(jpg|jpeg|png|webp|gif)$/i, "");
  
  // Check section 5 (Unmatched)
  const inUnmatched = lines.some((l, idx) => 
    idx >= 5010 && idx <= 5035 && (l.includes(img) || l.includes(baseName))
  );
  
  // Check section 6 (Duplicates)
  const inDuplicates = lines.some((l, idx) => 
    idx >= 5036 && idx <= 5060 && (l.includes(img) || l.includes(baseName))
  );
  
  // Check if found anywhere else in plan
  const foundInPlan = lines.some(l => l.includes(img) || l.includes(baseName));
  
  if (inDuplicates) {
    categories["In 'Duplicate/Alternate Images' section (alternate shot)"].push(img);
  } else if (inUnmatched) {
    categories["In 'Unmatched Images' section (ambiguous/unidentifiable)"].push(img);
  } else if (foundInPlan) {
    categories["Found in plan tables but parser missed"].push(img);
  } else {
    categories["Not found anywhere in plan"].push(img);
  }
}

for (const [cat, imgs] of Object.entries(categories)) {
  if (imgs.length === 0) continue;
  console.log(`\n--- ${cat} (${imgs.length}) ---`);
  imgs.forEach(img => console.log(`  • ${img}`));
}

// List ALL mapped products for reference
console.log("\n" + "=".repeat(90));
console.log(`ALL ${mappedProducts.length} MAPPED PRODUCTS`);
console.log("=".repeat(90));
mappedProducts.forEach(p => {
  console.log(`  ${p.code.padEnd(15)} ${p.image.padEnd(45)} ${p.name.slice(0, 40)}`);
});

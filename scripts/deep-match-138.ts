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

const UNMATCHED_FILE = "output/unmatched-138.txt";
const PLACEHOLDER_REF = "image-392ae88a5edcfe8b29b5e84dffd03ba833be05e9-900x1200-jpg";

// Noise words to ignore during matching
const NOISE = new Set(["FROZEN", "CHOICE", "ASWAS", "PRODUCT", "IMAGE", "INDO", "ASIAN", "PACK", "BATCH", "COPY", "JPG", "JPEG", "PNG", "WEBP", "AVIF"]);

function getTokens(str: string): string[] {
  return str
    .toUpperCase()
    .split(/[^A-Z0-9]+/)
    .filter(word => word.length >= 3 && !NOISE.has(word));
}

async function main() {
  if (!fs.existsSync(UNMATCHED_FILE)) {
    console.error("Unmatched file not found!");
    return;
  }

  const unmatched = fs.readFileSync(UNMATCHED_FILE, "utf-8").split("\n").filter(l => l.trim());
  console.log(`Analyzing ${unmatched.length} unmatched images...`);

  console.log("Fetching products with placeholders from Sanity...");
  const products = await client.fetch<{ _id: string; name: string; code?: string; image?: any }[]>(
    `*[_type == "product" && (image.asset._ref == $placeholder || !defined(image))] { _id, name, code, image }`,
    { placeholder: PLACEHOLDER_REF }
  );
  console.log(`Found ${products.length} products to check.`);

  const potentialMatches: any[] = [];

  for (const filename of unmatched) {
    const fileTokens = getTokens(filename);
    if (fileTokens.length === 0) continue;

    for (const product of products) {
      const nameTokens = getTokens(product.name);
      const codeTokens = product.code ? getTokens(product.code) : [];
      
      const intersection = fileTokens.filter(t => nameTokens.includes(t) || codeTokens.includes(t));
      
      // Heuristic: 2 or more shared keywords is a strong potential match
      if (intersection.length >= 2 || (intersection.length === 1 && intersection[0].length >= 6)) {
        potentialMatches.push({
          filename,
          productName: product.name,
          productCode: product.code,
          productId: product._id,
          matchedKeywords: intersection
        });
        // Limit to first match for now to avoid noise
        break; 
      }
    }
  }

  console.log(`\nFound ${potentialMatches.length} potential matches!`);
  
  const reportPath = "output/potential-matches-138.json";
  fs.writeFileSync(reportPath, JSON.stringify(potentialMatches, null, 2));
  console.log(`Report saved to ${reportPath}`);

  // Display some examples
  potentialMatches.slice(0, 10).forEach(m => {
    console.log(`- ${m.filename}  =>  ${m.productName} (${m.productCode}) [Matches: ${m.matchedKeywords.join(", ")}]`);
  });
}

main().catch(console.error);

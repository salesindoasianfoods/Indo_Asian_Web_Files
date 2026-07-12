import { createClient } from "@sanity/client";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config({ path: ".env.local" });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  token: process.env.NEXT_PUBLIC_SANITY_EDIT_TOKEN!,
  apiVersion: "2024-04-01",
  useCdn: false,
});

const productsToUpload = [
  { code: "TNANCHOVYMARINATED", name: "TASTY NIBBLES ANCHOVY MARINATED 284G X 12", price: "39.49" },
  { code: "TNANGMANGOFRO", name: "TASTY NIBBLES ANGAMALY MANGO CURRY 284G X 12", price: "26.28" },
  { code: "TNCHAKKAMANGOFRO", name: "TASTY NIBBLES CHAKKAKURU MANGO CURRY 284G X 12", price: "26.28" },
  { code: "TNFISHBIRIYANIMAHI", name: "TASTY NIBBLES FISH BIRIYANI (MAHI MAHI) 284G X 12", price: "38.99" },
  { code: "TNFISHMANGOCURRY", name: "TASTY NIBBLES FISH MANGO CURRY 284G X 12", price: "52.49" },
  { code: "TNFISHMASALA", name: "TASTY NIBBLES FISH MASALA 284G X 12", price: "52.49" },
  { code: "TNFISHMOILEEMAHI", name: "TASTY NIBBLES FISH MOILEE (MAHI MAHI) 284G X 12", price: "52.49" },
  { code: "TNFISHPOLLICHATHU", name: "TASTY NIBBLES FISH POLLICHATHU 284G X 12", price: "52.49" },
  { code: "TNFISHROAST", name: "TASTY NIBBLES FISH ROAST 284G X 12", price: "52.49" },
  { code: "TNKERALAFISHCOCONUTMILK", name: "TASTY NIBBLES KERALA FISH CURRY WITH COCONUT MILK 284G X 12", price: "42.99" },
  { code: "TNKERALAFISHSHAPILECURRY", name: "TASTY NIBBLES FISH CURRY SHAPPILE CURRY 284G X 12", price: "39.49" },
  { code: "TNKILIMEENCLEANED", name: "TASTY NIBBLES KILIMEEN CLEANED 600G X 15", price: "47.85" },
  { code: "TNKINGFISHCURRY", name: "TASTY NIBBLES KING FISH CURRY 284G X 12", price: "58.20" },
  { code: "TNKOOTUCURRYFRO", name: "TASTY NIBBLES KOOTTU CURRY 284G X 12", price: "26.28" },
  { code: "TNMACKERELMARINATED", name: "TASTY NIBBLES MACKEREL MARINATED (15-16) 284G X 12", price: "40.68" },
  { code: "TNMACKERELMULAKITTATHU", name: "TASTY NIBBLES MACKEREL MULAKITTATHU 284G X 12", price: "39.49" },
  { code: "TNPRAWNBIRIYANI", name: "TASTY NIBBLES PRAWN BIRIYANI 284G X 12", price: "38.99" },
  { code: "TNPRAWNMANGOCURRY", name: "TASTY NIBBLES PRAWN MANGO CURRY 284G X 12", price: "42.99" },
  { code: "TNPRAWNROAST", name: "TASTY NIBBLES PRAWN ROAST 284G X 12", price: "52.49" },
  { code: "TNSAILFISHCURRYCUT", name: "TASTY NIBBLES SAIL FISH CURRY CUT 600G X 15", price: "65.99" },
  { code: "TNSARDINEMARINATED", name: "TASTY NIBBLES SARDINE MARINATED 284G X 12", price: "39.49" },
  { code: "TNSARDINEMULAKITTATHU", name: "TASTY NIBBLES SARDINE MULAKITTATHU 284G X 12", price: "39.49" },
];

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
}

function extractWeight(name: string): string | undefined {
  const patterns = [
    { regex: /(\d+(?:\.\d+)?)\s*(?:KG|KGS|KILO|KILOGRAM)(?=[^A-Z]|X|$)/i, unit: "KG" },
    { regex: /(\d+(?:\.\d+)?)\s*(?:GRAM|GRM|GM|GR|G)(?=[^A-Z]|X|$)/i, unit: "G" },
    { regex: /(\d+(?:\.\d+)?)\s*(?:ML|MILLILITER|MILLILITRE)(?=[^A-Z]|X|$)/i, unit: "ML" },
  ];
  for (const p of patterns) {
    const m = name.match(p.regex);
    if (m) {
      const num = parseFloat(m[1]);
      if (num > 0) return `${m[1]}${p.unit}`;
    }
  }
  return undefined;
}

function extractUnit(name: string): string | undefined {
  const match = name.match(/\b[xX]\s*(\d+)\b/);
  if (match) return `X${match[1]}`;
  return undefined;
}

async function main() {
  console.log("Starting upload of Tasty Nibbles products...");

  // 1. Fetch the category ID for TASTY NIBBLES
  const categoryName = "TASTY NIBBLES";
  const category = await client.fetch(
    `*[_type == "category" && name == $categoryName][0] { _id, name }`,
    { categoryName }
  );

  if (!category) {
    console.error(`[ERROR] Category "${categoryName}" not found in Sanity. Please create it first.`);
    process.exit(1);
  }
  console.log(`Found category: ${category.name} (ID: ${category._id})`);

  // 2. Fetch existing products with these codes to prevent duplicates
  const codes = productsToUpload.map(p => p.code);
  const existingProducts = await client.fetch(
    `*[_type == "product" && code in $codes] { _id, code }`,
    { codes }
  );
  const existingCodesMap = new Map(existingProducts.map((p: any) => [p.code, p._id]));

  console.log(`Checking existing products in Sanity: ${existingProducts.length} already exist.`);

  // 3. Create or update products
  for (const product of productsToUpload) {
    const computedWeight = extractWeight(product.name);
    const computedUnit = extractUnit(product.name);
    const generatedSlug = slugify(product.name);

    const doc: any = {
      _type: "product",
      name: product.name,
      code: product.code,
      weight: computedWeight,
      unit: computedUnit,
      price: product.price,
      slug: {
        _type: "slug",
        current: generatedSlug,
      },
      category: {
        _type: "reference",
        _ref: category._id,
      },
    };

    const existingId = existingCodesMap.get(product.code);
    if (existingId) {
      console.log(`Product with code "${product.code}" already exists (ID: ${existingId}). Updating...`);
      // Update existing document (overwrite fields except image, or merge if needed)
      // Since user said leave as no image, let's check if the existing one has image.
      // We do not overwrite the image, but update all other fields.
      await client
        .patch(existingId)
        .set({
          name: doc.name,
          weight: doc.weight,
          unit: doc.unit,
          price: doc.price,
          slug: doc.slug,
          category: doc.category,
        })
        .commit();
      console.log(`  ✓ Updated product: ${product.name}`);
    } else {
      console.log(`Creating new product with code "${product.code}"...`);
      const result = await client.create(doc);
      console.log(`  ✓ Created product (ID: ${result._id}): ${product.name}`);
    }
  }

  console.log("\nAll products successfully processed.");
}

main().catch(console.error);

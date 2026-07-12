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

function extractUnit(name: string): string | undefined {
  // Match patterns like X12, X 12, x12, x 12, X36, X 36, etc.
  const match = name.match(/\b[xX]\s*(\d+)\b/);
  if (match) {
    return `X${match[1]}`;
  }
  return undefined;
}

async function main() {
  console.log("Fetching existing products...");
  const products = await client.fetch<{ _id: string; name: string; unit?: string }[]>(
    `*[_type == "product" && defined(image)] { _id, name, unit }`
  );

  console.log(`Found ${products.length} existing products with images\n`);

  let updated = 0;
  let skipped = 0;

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const unit = extractUnit(p.name);

    if (!unit) {
      skipped++;
      continue;
    }

    // Skip if already has the same unit
    if (p.unit === unit) {
      skipped++;
      continue;
    }

    try {
      await client.patch(p._id).set({ unit }).commit();
      process.stdout.write(`\r[${i + 1}/${products.length}] Updated ${p._id} → unit: ${unit}`);
      updated++;
    } catch (err: any) {
      console.error(`\n✗ Failed ${p._id}: ${err.message}`);
    }
  }

  console.log(`\n\nDone! Updated: ${updated}, Skipped: ${skipped}`);
}

main().catch(console.error);

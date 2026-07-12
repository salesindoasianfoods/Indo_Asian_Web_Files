import { createClient } from "@sanity/client";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const client = createClient({
  projectId: "lz2bjis5",
  dataset: "production",
  token: process.env.NEXT_PUBLIC_SANITY_EDIT_TOKEN2,
  apiVersion: "2024-01-01",
  useCdn: false,
});

function extractWeight(name: string): string | undefined {
  const patterns = [
    { regex: /(\d+(?:\.\d+)?)\s*(?:KG|KGS|KILO|KILOGRAM)(?=[^A-Z]|X|$)/i, unit: "KG" },
    { regex: /(\d+(?:\.\d+)?)\s*(?:GRAM|GRM|GM|GR|G)(?=[^A-Z]|X|$)/i, unit: "G" },
    { regex: /(\d+(?:\.\d+)?)\s*(?:ML|MILLILITER|MILLILITRE)(?=[^A-Z]|X|$)/i, unit: "ML" },
    { regex: /(\d+(?:\.\d+)?)\s*(?:LTR|LITRE|LITER|LIT|L)(?=[^A-Z]|X|$)/i, unit: "L" },
    { regex: /(\d+(?:\.\d+)?)\s+L\b/i, unit: "L" },
    { regex: /(\d+(?:\.\d+)?)\s*(?:OZ|OUNCE)(?=[^A-Z]|X|$)/i, unit: "OZ" },
    { regex: /(\d+(?:\.\d+)?)\s*(?:LB|LBS|POUND)(?=[^A-Z]|X|$)/i, unit: "LB" },
  ];
  for (const p of patterns) {
    const m = name.match(p.regex);
    if (m) return `${m[1]}${p.unit}`;
  }
  const implicit = name.match(/(\d{2,4})\s*[Xx]\s*(\d{1,2})(?!\d)/);
  if (implicit) {
    const num = parseInt(implicit[1]);
    if (num >= 10 && num <= 5000) return `${num}G`;
  }
  return undefined;
}

function extractUnit(name: string): string | undefined {
  const mUnitWeight = name.match(
    /(\d+)[Xx](\d+(?:\.\d+)?)\s*(?:G|GM|GRM|GRAM|KG|ML|LTR|LIT|L|OZ|LB|LBS)/i
  );
  if (mUnitWeight) {
    const unitNum = parseInt(mUnitWeight[1]);
    const weightNum = parseFloat(mUnitWeight[2]);
    if (unitNum < weightNum && unitNum <= 100) return `X${unitNum}`;
  }

  const mWeightUnitLetters = name.match(
    /\b(\d+(?:\.\d+)?)\s*(?:G|GM|GRM|GRAM|KG|ML|LTR|LIT|L|OZ|LB|LBS)?[Xx](\d+)(?=[A-Z])/i
  );
  if (mWeightUnitLetters) {
    const afterX = parseInt(mWeightUnitLetters[2]);
    if (afterX <= 100) return `X${afterX}`;
  }

  const m2 = name.match(/\b(\d+)\s*[Xx]\s*\d{3,}/i);
  if (m2) return `X${m2[1]}`;

  const m1 = name.match(/(?:^|[^A-Z\d]|[GMLTS])[Xx]\s*(\d+)(?!\d)/i);
  if (m1) return `X${m1[1]}`;

  const m3 = name.match(/\b(\d+)\s*[Xx]\s*(\d{1,2})(?!\d)/);
  if (m3) return `X${m3[2]}`;

  const mNoX = name.match(
    /\b\d+(?:\.\d+)?\s*(?:G|GM|GRM|GRAM|KG|ML|LTR|LIT|L)\s+(\d{1,3})\b/i
  );
  if (mNoX) return `X${mNoX[1]}`;

  const m4 = name.match(/\b(\d+)\s*(?:PC|PCS|PACK|PKT|PKTS|BTL|BOTTLE|BOX)\b/i);
  if (m4) return `X${m4[1]}`;

  return undefined;
}

async function main() {
  console.log("Fetching all products...");
  const products: any[] = await client.fetch(
    `*[_type == "product"]{_id, name, code, weight, unit}`
  );
  console.log(`Total products: ${products.length}`);

  let weightUpdates = 0;
  let unitUpdates = 0;
  let bothUpdates = 0;
  let skipped = 0;
  let failed = 0;
  const fixed: string[] = [];

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const computedWeight = extractWeight(p.name);
    const computedUnit = extractUnit(p.name);

    const needsWeightUpdate =
      computedWeight !== undefined && computedWeight !== p.weight;
    const needsUnitUpdate =
      computedUnit !== undefined && computedUnit !== p.unit;

    if (!needsWeightUpdate && !needsUnitUpdate) {
      skipped++;
      continue;
    }

    const patch: any = {};
    if (needsWeightUpdate) patch.weight = computedWeight;
    if (needsUnitUpdate) patch.unit = computedUnit;

    try {
      await client.patch(p._id).set(patch).commit();
      if (needsWeightUpdate) weightUpdates++;
      if (needsUnitUpdate) unitUpdates++;
      if (needsWeightUpdate && needsUnitUpdate) bothUpdates++;
      fixed.push(`${p.code || "?"}: ${p.name.slice(0, 50)} → weight=${computedWeight}, unit=${computedUnit}`);
      process.stdout.write(`\r[${i + 1}/${products.length}] Updated ${weightUpdates + unitUpdates} fields...`);
    } catch (err: any) {
      failed++;
      console.log(`\n✗ Failed: ${p.code} — ${err.message}`);
    }
  }

  console.log("\n\n================================================================================");
  console.log("UPDATE REPORT v2");
  console.log("================================================================================");
  console.log(`Total products scanned: ${products.length}`);
  console.log(`Weight-only updates:    ${weightUpdates - bothUpdates}`);
  console.log(`Unit-only updates:      ${unitUpdates - bothUpdates}`);
  console.log(`Both updated:           ${bothUpdates}`);
  console.log(`Total fields updated:   ${weightUpdates + unitUpdates}`);
  console.log(`Skipped (no change):    ${skipped}`);
  console.log(`Failed:                 ${failed}`);
  console.log("================================================================================");

  console.log("\nSample fixes:");
  fixed.slice(0, 25).forEach((f) => console.log("  " + f));
  if (fixed.length > 25) console.log(`  ... and ${fixed.length - 25} more`);
}

main();

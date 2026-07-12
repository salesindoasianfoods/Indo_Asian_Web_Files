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
    { regex: /\b(\d+(?:\.\d+)?)\s*(?:KG|KGS|KILO|KILOGRAM)(?=[^A-Z]|X|$)/i, unit: "KG" },
    { regex: /\b(\d+(?:\.\d+)?)\s*(?:GRAM|GRM|GM|GR|G)(?=[^A-Z]|X|$)/i, unit: "G" },
    { regex: /\b(\d+(?:\.\d+)?)\s*(?:ML|MILLILITER|MILLILITRE)(?=[^A-Z]|X|$)/i, unit: "ML" },
    { regex: /\b(\d+(?:\.\d+)?)\s*(?:LTR|LITRE|LITER)(?=[^A-Z]|X|$)/i, unit: "L" },
    { regex: /\b(\d+(?:\.\d+)?)\s+L\b/i, unit: "L" },
    { regex: /\b(\d+(?:\.\d+)?)\s*(?:OZ|OUNCE)(?=[^A-Z]|X|$)/i, unit: "OZ" },
    { regex: /\b(\d+(?:\.\d+)?)\s*(?:LB|POUND)(?=[^A-Z]|X|$)/i, unit: "LB" },
  ];
  for (const p of patterns) {
    const m = name.match(p.regex);
    if (m) return `${m[1]}${p.unit}`;
  }
  // Implicit: number before X-unit where after-X is 1-2 digits (weight X unit pattern)
  const implicit = name.match(/\b(\d{2,4})\s*[Xx]\s*(\d{1,2})\b/);
  if (implicit) {
    const num = parseInt(implicit[1]);
    if (num >= 10 && num <= 5000) return `${num}G`;
  }
  return undefined;
}

function extractUnit(name: string): string | undefined {
  // UNIT X WEIGHT: small number before X, large number after (e.g. 10 X 800GM)
  const m2 = name.match(/\b(\d+)\s*[Xx]\s*\d{3,}/i);
  if (m2) return `X${m2[1]}`;

  // X before digits — allow weight-unit letters (G,M,L) before X for cases like GX20, GMX10
  const m1 = name.match(/(?:^|[^A-Z\d]|[GML])[Xx]\s*(\d+)(?!\d)/i);
  if (m1) return `X${m1[1]}`;

  // WEIGHT X UNIT: number before X, small number after (e.g. 350 X 12, 908X 16)
  const m3 = name.match(/\b(\d+)\s*[Xx]\s*(\d{1,2})\b/);
  if (m3) return `X${m3[2]}`;

  // PCS/PACK/PKT/BTL/BOX patterns
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

    // no delay needed — most products are skipped
  }

  console.log("\n\n================================================================================");
  console.log("UPDATE REPORT");
  console.log("================================================================================");
  console.log(`Total products scanned: ${products.length}`);
  console.log(`Weight-only updates:    ${weightUpdates - bothUpdates}`);
  console.log(`Unit-only updates:      ${unitUpdates - bothUpdates}`);
  console.log(`Both updated:           ${bothUpdates}`);
  console.log(`Total fields updated:   ${weightUpdates + unitUpdates}`);
  console.log(`Skipped (no change):    ${skipped}`);
  console.log(`Failed:                 ${failed}`);
  console.log("================================================================================");

  // Show some examples
  console.log("\nSample fixes:");
  fixed.slice(0, 20).forEach((f) => console.log("  " + f));
  if (fixed.length > 20) console.log(`  ... and ${fixed.length - 20} more`);
}

main();

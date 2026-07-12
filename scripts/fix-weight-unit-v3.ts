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
    if (m) {
      const num = parseFloat(m[1]);
      if (num > 0) return `${m[1]}${p.unit}`;
    }
  }
  // Implicit: number before X-unit where after-X is 1-2 digits
  const implicit = name.match(/(\d{2,4})\s*[Xx]\s*(\d{1,2})(?!\d)/);
  if (implicit) {
    const num = parseInt(implicit[1]);
    // Skip if there's another X nearby (e.g. inchX50X40)
    const idx = name.toUpperCase().indexOf(implicit[0].toUpperCase());
    const before = name.slice(Math.max(0, idx - 8), idx).toUpperCase();
    if (before.includes('X') || before.includes('INCH') || before.includes('MM') || before.includes('CM')) return undefined;
    if (num >= 10 && num <= 5000) return `${num}G`;
  }
  return undefined;
}

function extractUnit(name: string): string | undefined {
  // Pattern: UNIT X WEIGHT where weight has explicit unit
  const mUnitWeight = name.match(
    /(\d+)[Xx](\d+(?:\.\d+)?)\s*(?:GRAM|GRM|GM|G|KG|ML|LTR|LIT|L|OZ|LB|LBS)(?![A-Z])/i
  );
  if (mUnitWeight) {
    const unitNum = parseInt(mUnitWeight[1]);
    if (unitNum <= 200) return `X${unitNum}`;
  }

  // Pattern: WEIGHT X UNIT where after-X has letters (e.g. 250X10BTL)
  const mWeightUnitLetters = name.match(
    /\b(\d+(?:\.\d+)?)\s*(?:G|GM|GRM|GRAM|KG|ML|LTR|LIT|L|OZ|LB|LBS)?[Xx](\d+)(?=[A-Z])/i
  );
  if (mWeightUnitLetters) {
    const afterX = parseInt(mWeightUnitLetters[2]);
    if (afterX <= 100) return `X${afterX}`;
  }

  // UNIT X WEIGHT: small number before X, large number after
  const m2 = name.match(/\b(\d+)\s*[Xx]\s*\d{3,}/i);
  if (m2) return `X${m2[1]}`;

  // X before digits
  const m1 = name.match(/(?:^|[^A-Z\d]|[GMLTS])[Xx]\s*(\d+)(?!\d)/i);
  if (m1) return `X${m1[1]}`;

  // WEIGHT X UNIT: number before X, small number after
  const m3 = name.match(/(\d+)\s*[Xx]\s*(\d{1,2})(?!\d)/);
  if (m3) return `X${m3[2]}`;

  // WEIGHT + number without X — but NOT if followed by . or , (price)
  const mNoX = name.match(
    /\b\d+(?:\.\d+)?\s*(?:G|GM|GRM|GRAM|KG|ML|LTR|LIT|L)\s+(\d{1,3})\b(?![\.,\d])/i
  );
  if (mNoX) return `X${mNoX[1]}`;

  // PCS/PACK/PKT/BTL/BOX
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
  let unitRemovals = 0;
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

    // Also fix bad existing units that came from prices
    let needsUnitRemoval = false;
    if (p.unit && /^X\d+$/.test(p.unit)) {
      const unitNum = parseInt(p.unit.replace("X", ""));
      // If unit looks like it came from a price (e.g. X42 from 42.99) and there's no real X pattern
      const hasRealXPattern = /[Xx]\s*\d+/.test(p.name);
      const hasPriceLike = new RegExp(`\\b${unitNum}\\.\\d{2}\\b`).test(p.name);
      if (hasPriceLike && computedUnit !== p.unit) {
        needsUnitRemoval = true;
      }
    }

    if (!needsWeightUpdate && !needsUnitUpdate && !needsUnitRemoval) {
      skipped++;
      continue;
    }

    const patch: any = {};
    if (needsWeightUpdate) patch.weight = computedWeight;
    if (needsUnitUpdate) patch.unit = computedUnit;
    if (needsUnitRemoval) patch.unit = null;

    try {
      await client.patch(p._id).set(patch).commit();
      if (needsWeightUpdate) weightUpdates++;
      if (needsUnitUpdate) unitUpdates++;
      if (needsUnitRemoval) unitRemovals++;
      if (needsWeightUpdate && (needsUnitUpdate || needsUnitRemoval)) bothUpdates++;
      fixed.push(`${p.code || "?"}: ${p.name.slice(0, 50)} → weight=${computedWeight}, unit=${computedUnit}${needsUnitRemoval ? " [REMOVED BAD UNIT]" : ""}`);
      process.stdout.write(`\r[${i + 1}/${products.length}] Updated ${weightUpdates + unitUpdates + unitRemovals} fields...`);
    } catch (err: any) {
      failed++;
      console.log(`\n✗ Failed: ${p.code} — ${err.message}`);
    }
  }

  console.log("\n\n================================================================================");
  console.log("UPDATE REPORT v3");
  console.log("================================================================================");
  console.log(`Total products scanned: ${products.length}`);
  console.log(`Weight updates:         ${weightUpdates}`);
  console.log(`Unit updates:           ${unitUpdates}`);
  console.log(`Unit removals (bad):    ${unitRemovals}`);
  console.log(`Total changes:          ${weightUpdates + unitUpdates + unitRemovals}`);
  console.log(`Skipped (no change):    ${skipped}`);
  console.log(`Failed:                 ${failed}`);
  console.log("================================================================================");

  if (fixed.length > 0) {
    console.log("\nFixes applied:");
    fixed.slice(0, 30).forEach((f) => console.log("  " + f));
    if (fixed.length > 30) console.log(`  ... and ${fixed.length - 30} more`);
  }
}

main();

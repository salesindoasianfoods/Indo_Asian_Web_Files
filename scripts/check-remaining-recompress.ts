import { createClient } from "@sanity/client";
import { config } from "dotenv";
import fs from "fs";

config({ path: ".env.local" });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  token: process.env.NEXT_PUBLIC_SANITY_EDIT_TOKEN!,
  apiVersion: "2024-04-01",
  useCdn: false,
});

const PLACEHOLDER_REF = "image-392ae88a5edcfe8b29b5e84dffd03ba833be05e9-900x1200-jpg";

const allCodes = new Set<string>();
const mainReport = JSON.parse(fs.readFileSync("output/upload-report-1778009082150.json", "utf-8"));
for (const r of mainReport.results) {
  if (r.status === "success") allCodes.add(r.code);
  if (r.status === "skipped-no-file" && r.productId) allCodes.add(r.code);
}
const conv = JSON.parse(fs.readFileSync("output/upload-report-converted-1778127486301.json", "utf-8"));
for (const r of conv.results) allCodes.delete(r.code);
const fix = JSON.parse(fs.readFileSync("output/fix-117-report-1778129873098.json", "utf-8"));
for (const r of fix.results) {
  if (r.status === "success" || r.status === "skipped-has-image") allCodes.delete(r.code);
}

const codes = Array.from(allCodes);
console.log("Total targets:", codes.length);

async function main() {
  // Batch in chunks of 200 to avoid query size limits
  let hasRealImage = 0;
  let hasPlaceholder = 0;
  let noImage = 0;
  const remaining: string[] = [];
  const foundCodes = new Set<string>();

  for (let i = 0; i < codes.length; i += 200) {
    const chunk = codes.slice(i, i + 200);
    const products = await client.fetch(
      '*[_type == "product" && code in $codes] { code, "assetRef": image.asset._ref }',
      { codes: chunk }
    );

    for (const p of products) {
      foundCodes.add(p.code);
      const ref = p.assetRef;
      if (!ref) {
        noImage++;
        remaining.push(p.code);
      } else if (ref === PLACEHOLDER_REF) {
        hasPlaceholder++;
        remaining.push(p.code);
      } else {
        hasRealImage++;
      }
    }
  }

  const notFound = codes.filter((c) => !foundCodes.has(c));
  for (const c of notFound) remaining.push(c);

  console.log("Has real image:", hasRealImage);
  console.log("Has placeholder:", hasPlaceholder);
  console.log("No image at all:", noImage);
  console.log("Not found in Sanity:", notFound.length);
  console.log("Remaining to process:", remaining.length);

  fs.writeFileSync("output/recompress-remaining-codes.json", JSON.stringify(remaining, null, 2));
}

main().catch(console.error);

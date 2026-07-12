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

const PLACEHOLDER_REF = "image-392ae88a5edcfe8b29b5e84dffd03ba833be05e9-900x1200-jpg";

async function main() {
  const total = await client.fetch('count(*[_type == "product"])');
  const withPlaceholder = await client.fetch(
    'count(*[_type == "product" && image.asset._ref == $ref])',
    { ref: PLACEHOLDER_REF }
  );
  const withRealImage = await client.fetch(
    'count(*[_type == "product" && defined(image.asset._ref) && image.asset._ref != $ref])',
    { ref: PLACEHOLDER_REF }
  );
  const withNoImage = await client.fetch(
    'count(*[_type == "product" && !defined(image.asset._ref)])'
  );

  console.log("========================================");
  console.log("CURRENT SANITY STATUS");
  console.log("========================================");
  console.log("Total products:        ", total);
  console.log("With real image:       ", withRealImage);
  console.log("With placeholder:      ", withPlaceholder);
  console.log("With no image at all:  ", withNoImage);
  console.log("----------------------------------------");
  console.log("Image coverage:        ", ((withRealImage / total) * 100).toFixed(1) + "%");

  // Also count total image assets in Sanity
  const totalAssets = await client.fetch('count(*[_type == "sanity.imageAsset"])');
  console.log("Total image assets:    ", totalAssets);
}

main().catch(console.error);

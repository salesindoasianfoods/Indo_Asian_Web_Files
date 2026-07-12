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
async function main() {
  const products = await client.fetch(
    '*[_type == "product" && (name match "GARAM MASALA" || name match "GARLIC PICKLE" || name match "GINGER CURRY")]{_id, name, code, "imageUrl": image.asset->url, "imageRef": image.asset._ref}'
  );
  console.log(JSON.stringify(products, null, 2));
}
main().catch(console.error);

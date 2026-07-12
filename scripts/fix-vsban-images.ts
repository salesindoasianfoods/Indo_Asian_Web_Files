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

const WRONG_IMAGE_REF = "image-369dc5fb189dad61bc74375c6412c11dcc531764-256x267-png";
const CORRECT_BANANA_REF = "image-5d73267b76912e1fb70e22873c874f078e221c4a-1200x900-jpg";

async function main() {
  const products = await client.fetch(
    '*[_type == "product" && image.asset._ref == $ref]{_id, name, code}',
    { ref: WRONG_IMAGE_REF }
  );
  console.log(`Found ${products.length} products using wrong image:`);
  products.forEach((p: any) => console.log(`  - ${p._id}: ${p.name} (code: ${p.code})`));
}
main().catch(console.error);

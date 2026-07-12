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
  console.log("Searching for products with placeholder image...");
  const products = await client.fetch<any[]>(
    `*[_type == "product" && image.asset._ref == $placeholder] { _id, name }`,
    { placeholder: PLACEHOLDER_REF }
  );

  console.log(`Found ${products.length} products with placeholder image.`);

  if (products.length === 0) return;

  console.log("Removing image field from these products...");
  const transaction = client.transaction();
  
  for (const p of products) {
    transaction.patch(p._id, { unset: ["image"] });
  }

  try {
    await transaction.commit();
    console.log("Successfully removed all placeholders from Sanity.");
  } catch (err: any) {
    console.error("Failed to remove placeholders:", err.message);
  }
}

main().catch(console.error);

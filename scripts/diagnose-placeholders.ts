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
  // Find ALL unique image assets with how many products reference them
  const assets = await client.fetch<any[]>(
    `*[_type == "sanity.imageAsset"] {
      _id,
      originalFilename,
      url,
      "refCount": count(*[_type == "product" && image.asset._ref == ^._id])
    } | order(refCount desc) [0...30]`
  );

  console.log("\nTop image assets by product reference count:");
  for (const a of assets) {
    if (a.refCount > 0) {
      console.log(`  [${a.refCount}x] ${a.originalFilename} → ${a._id}`);
    }
  }

  // Also check: how many products still have an image defined?
  const withImage = await client.fetch<number>(`count(*[_type == "product" && defined(image.asset)])`);
  const noImage = await client.fetch<number>(`count(*[_type == "product" && !defined(image.asset)])`);
  
  console.log(`\nProducts WITH image: ${withImage}`);
  console.log(`Products WITHOUT image: ${noImage}`);
}

main().catch(console.error);

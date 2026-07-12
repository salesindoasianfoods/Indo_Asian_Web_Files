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
  const assets = await client.fetch<any[]>("*[_type == 'sanity.imageAsset'] { originalFilename }");
  console.log(JSON.stringify(assets.slice(0, 50), null, 2));
}

main().catch(console.error);

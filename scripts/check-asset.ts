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
  const asset = await client.fetch(
    '*[_id == "image-5d73267b76912e1fb70e22873c874f078e221c4a-1200x900-jpg"][0]{_id, originalFilename, url}'
  );
  console.log("Asset on JgNZwVoOE3fVRWVQtDe9FM:", JSON.stringify(asset, null, 2));

  const wrongAsset = await client.fetch(
    '*[_id == "image-369dc5fb189dad61bc74375c6412c11dcc531764-256x267-png"][0]{_id, originalFilename, url}'
  );
  console.log("\nWrong image asset:", JSON.stringify(wrongAsset, null, 2));
}
main().catch(console.error);

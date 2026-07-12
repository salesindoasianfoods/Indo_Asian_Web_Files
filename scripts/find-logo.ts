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
  // Find image assets that might be the logo
  const assets = await client.fetch(
    '*[_type == "sanity.imageAsset" && (originalFilename match "*logo*" || originalFilename match "*indo*" || originalFilename match "*asian*")]{_id, originalFilename, url}'
  );
  console.log("Logo-like assets:", JSON.stringify(assets, null, 2));
}
main().catch(console.error);

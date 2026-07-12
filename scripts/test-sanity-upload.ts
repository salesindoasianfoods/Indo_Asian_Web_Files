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
  // Check Sanity file upload endpoint
  const url = `https://${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}.api.sanity.io/v2024-04-01/assets/files/${process.env.NEXT_PUBLIC_SANITY_DATASET}`;
  console.log("Upload endpoint:", url);
}
main().catch(console.error);

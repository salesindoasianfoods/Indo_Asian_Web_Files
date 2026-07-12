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
  const p = await client.fetch('*[_type == "product" && _id == "454ff278-8c47-4a71-b2d5-855d877be0d3"][0]{name, "imageRef": image.asset._ref}');
  console.log(p);
}
main().catch(console.error);

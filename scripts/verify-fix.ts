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
  const ids = [
    "802984a3-282b-4e38-9d4e-02e00419d37f",
    "1ae81407-f115-4e34-a09d-02e8765666b3",
    "232a590e-1b80-4df7-92cd-02ad8f10e61f",
    "5d990719-0405-444a-84f3-2e8d1eed844f",
    "fc4ff9fe-fd43-46da-8f05-f9b5ed218e62"
  ];
  for (const id of ids) {
    const p = await client.fetch('*[_type == "product" && _id == $id][0]{name, "imageRef": image.asset._ref}', { id });
    console.log(id + ": " + (p?.imageRef || "NO IMAGE") + " | " + p?.name);
  }
}
main().catch(console.error);

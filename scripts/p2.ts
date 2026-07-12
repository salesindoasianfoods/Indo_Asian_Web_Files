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
client.patch("1ae81407-f115-4e34-a09d-02e8765666b3").unset(["image"]).commit()
  .then(() => console.log("OK 1ae81407"))
  .catch(e => { console.error("FAIL", e.message); process.exit(1); });

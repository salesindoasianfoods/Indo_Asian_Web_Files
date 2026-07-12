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
client.patch("232a590e-1b80-4df7-92cd-02ad8f10e61f").unset(["image"]).commit()
  .then(() => console.log("OK 232a590e"))
  .catch(e => { console.error("FAIL", e.message); process.exit(1); });

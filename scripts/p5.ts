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
client.patch("fc4ff9fe-fd43-46da-8f05-f9b5ed218e62").unset(["image"]).commit()
  .then(() => console.log("OK fc4ff9fe"))
  .catch(e => { console.error("FAIL", e.message); process.exit(1); });

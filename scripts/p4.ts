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
client.patch("5d990719-0405-444a-84f3-2e8d1eed844f").unset(["image"]).commit()
  .then(() => console.log("OK 5d990719"))
  .catch(e => { console.error("FAIL", e.message); process.exit(1); });

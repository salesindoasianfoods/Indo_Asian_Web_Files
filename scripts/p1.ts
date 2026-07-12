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
client.patch("802984a3-282b-4e38-9d4e-02e00419d37f")
  .set({ image: { _type: "image", asset: { _type: "reference", _ref: "image-5d73267b76912e1fb70e22873c874f078e221c4a-1200x900-jpg" } } })
  .commit()
  .then(() => console.log("OK 802984a3"))
  .catch(e => { console.error("FAIL", e.message); process.exit(1); });

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
  const CORRECT_BANANA_REF = "image-5d73267b76912e1fb70e22873c874f078e221c4a-1200x900-jpg";
  const testId = "454ff278-8c47-4a71-b2d5-855d877be0d3";
  
  console.log("Starting patch for", testId);
  try {
    const result = await client.patch(testId).set({
      image: { _type: "image", asset: { _type: "reference", _ref: CORRECT_BANANA_REF } }
    }).commit();
    console.log("Patch result:", result._id);
  } catch (err: any) {
    console.error("Patch failed:", err.message);
  }
}
main().catch(console.error);

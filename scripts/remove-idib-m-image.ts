import { createClient } from "@sanity/client";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "lz2bjis5",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2023-05-03",
  useCdn: false,
  token: "skWTJsP8SBitTXqNjnnINgLcN3xEofn88wOJoa1OGAuJcfDXCH4bs3j0JXkj6WJs48WuzslRAL6iQOyEpaz7zObyCyCA55cfiXiVFSUEZAAhrBXp67dexkjeU1LAYsEbM0lyCI8KcWhE1lw5me35FomcayMpeRK3VvmWGEoLtZ637kRN3Pzp",
});

async function main() {
  try {
    const products = await client.fetch(`*[_type == "product" && code == "IDIB-M"]`);
    if (products.length === 0) {
      console.log("Product not found");
      return;
    }
    const product = products[0];
    console.log(`Found product: ${product.name} (Code: ${product.code}), removing image...`);
    
    await client
      .patch(product._id)
      .unset(["image"])
      .commit();
      
    console.log("Successfully removed image from Sanity!");
  } catch (error) {
    console.error("Error:", error);
  }
}

main();

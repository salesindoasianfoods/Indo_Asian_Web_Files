import { createClient } from "@sanity/client";

const client = createClient({
  projectId: "lz2bjis5",
  dataset: "production",
  token: "skWTJsP8SBitTXqNjnnINgLcN3xEofn88wOJoa1OGAuJcfDXCH4bs3j0JXkj6WJs48WuzslRAL6iQOyEpaz7zObyCyCA55cfiXiVFSUEZAAhrBXp67dexkjeU1LAYsEbM0lyCI8KcWhE1lw5me35FomcayMpeRK3VvmWGEoLtZ637kRN3Pzp",
  apiVersion: "2024-04-01",
  useCdn: false,
});

async function main() {
  console.log("Searching for CROCKER H/ON GGS IF 700G X20 (CROC7-M)...");
  const product = await client.fetch('*[_type == "product" && code == "CROC7-M"][0]');
  
  if (!product) {
    console.error("Could not find the product with code CROC7-M.");
    return;
  }
  
  console.log(`Found product: ${product.name} (ID: ${product._id}). Deleting...`);
  
  await client.delete(product._id);
  
  console.log("Successfully deleted the product!");
}

main().catch(console.error);

import { createClient } from "@sanity/client";

const client = createClient({
  projectId: "lz2bjis5",
  dataset: "production",
  token: "skWTJsP8SBitTXqNjnnINgLcN3xEofn88wOJoa1OGAuJcfDXCH4bs3j0JXkj6WJs48WuzslRAL6iQOyEpaz7zObyCyCA55cfiXiVFSUEZAAhrBXp67dexkjeU1LAYsEbM0lyCI8KcWhE1lw5me35FomcayMpeRK3VvmWGEoLtZ637kRN3Pzp",
  apiVersion: "2024-04-01",
  useCdn: false,
});

async function main() {
  console.log("Finding VISWAS SNACKS category...");
  
  const targetCategory = await client.fetch('*[_type == "category" && name == "VISWAS SNACKS"][0]');
  if (!targetCategory) {
    console.error("Could not find VISWAS SNACKS category!");
    return;
  }
  
  console.log(`Found category ID: ${targetCategory._id}`);
  
  console.log("Finding Finally candy product...");
  const product = await client.fetch('*[_type == "product" && name match "FINALLY CANDY*"][0]');
  if (!product) {
    console.error("Could not find product matching FINALLY CANDY!");
    return;
  }
  
  console.log(`Found product: ${product.name} (Code: ${product.code})`);
  
  console.log("Patching product category...");
  await client.patch(product._id).set({
    category: {
      _type: "reference",
      _ref: targetCategory._id,
    }
  }).commit();
  
  console.log("Successfully moved 'Finally candy 200gx30' to VISWAS SNACKS!");
}

main().catch(console.error);

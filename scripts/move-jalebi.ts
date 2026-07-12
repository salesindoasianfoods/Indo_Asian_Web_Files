import { createClient } from "@sanity/client";

const client = createClient({
  projectId: "lz2bjis5",
  dataset: "production",
  token: "skWTJsP8SBitTXqNjnnINgLcN3xEofn88wOJoa1OGAuJcfDXCH4bs3j0JXkj6WJs48WuzslRAL6iQOyEpaz7zObyCyCA55cfiXiVFSUEZAAhrBXp67dexkjeU1LAYsEbM0lyCI8KcWhE1lw5me35FomcayMpeRK3VvmWGEoLtZ637kRN3Pzp",
  apiVersion: "2024-04-01",
  useCdn: false,
});

async function main() {
  console.log("Finding JALEBI YELLOW product...");
  const product = await client.fetch('*[_type == "product" && code == "JAL-Y"][0]');
  
  if (!product) {
    console.error("Could not find product with code JAL-Y.");
    return;
  }
  
  console.log(`Found product: ${product.name} (ID: ${product._id})`);
  
  console.log("Finding frozen snacks categories...");
  const categories = await client.fetch('*[_type == "category" && name match "*FROZEN SNACKS*"]{_id, name}');
  
  if (categories.length === 0) {
    console.error("Could not find any frozen snacks category.");
    return;
  }
  
  // Try to find VISWAS FROZEN SNACKS, fallback to the first one found
  const targetCategory = categories.find((c: any) => c.name.includes("VISWAS")) || categories[0];
  
  console.log(`Moving ${product.name} to ${targetCategory.name}...`);
  await client.patch(product._id).set({
    category: { _type: "reference", _ref: targetCategory._id }
  }).commit();
  
  console.log("Successfully moved!");
}

main().catch(console.error);

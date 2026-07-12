import { createClient } from "@sanity/client";

const client = createClient({
  projectId: "lz2bjis5",
  dataset: "production",
  token: "skWTJsP8SBitTXqNjnnINgLcN3xEofn88wOJoa1OGAuJcfDXCH4bs3j0JXkj6WJs48WuzslRAL6iQOyEpaz7zObyCyCA55cfiXiVFSUEZAAhrBXp67dexkjeU1LAYsEbM0lyCI8KcWhE1lw5me35FomcayMpeRK3VvmWGEoLtZ637kRN3Pzp",
  apiVersion: "2024-04-01",
  useCdn: false,
});

async function main() {
  console.log("Finding target category...");
  const picklesCategory = await client.fetch('*[_type == "category" && name == "VISWAS PICKLES"][0]');
  
  if (!picklesCategory) {
    throw new Error("Target category not found!");
  }
  
  console.log("Finding product...");
  const product = await client.fetch('*[_type == "product" && code == "VSVADU-M"][0]');
  
  if (!product) {
    throw new Error("Product VSVADU-M not found!");
  }
  
  console.log(`Patching ${product.name} to VISWAS PICKLES...`);
  await client.patch(product._id).set({
    category: { _type: "reference", _ref: picklesCategory._id }
  }).commit();
  
  console.log("Successfully moved the product!");
}

main().catch(console.error);

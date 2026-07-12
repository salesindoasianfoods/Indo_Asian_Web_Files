import { createClient } from "@sanity/client";

const client = createClient({
  projectId: "lz2bjis5",
  dataset: "production",
  token: "skWTJsP8SBitTXqNjnnINgLcN3xEofn88wOJoa1OGAuJcfDXCH4bs3j0JXkj6WJs48WuzslRAL6iQOyEpaz7zObyCyCA55cfiXiVFSUEZAAhrBXp67dexkjeU1LAYsEbM0lyCI8KcWhE1lw5me35FomcayMpeRK3VvmWGEoLtZ637kRN3Pzp",
  apiVersion: "2024-04-01",
  useCdn: false,
});

async function main() {
  console.log("Finding MANGO JAM product...");
  const products = await client.fetch('*[_type == "product" && name match "MANGO JAM*"]{_id, name, code, "categoryName": category->name}');
  
  if (products.length === 0) {
    console.error("Could not find MANGO JAM product!");
    return;
  }
  
  console.log("Found products:");
  products.forEach((p: any) => console.log(`- ${p.name} (${p.code}) [Current: ${p.categoryName}]`));
  
  console.log("\nFinding pickle categories...");
  const categories = await client.fetch('*[_type == "category" && name match "*PICKLE*"]{_id, name}');
  console.log(categories.map((c: any) => c.name).join(", "));
  
  // Pick the best match (or ask user if ambiguous)
  const targetCategory = categories.find((c: any) => c.name.includes("VISWAS")) || categories[0];
  
  if (!targetCategory) {
    console.log("No pickle category found!");
    return;
  }
  
  console.log(`\nMoving ${products[0].name} to ${targetCategory.name}...`);
  await client.patch(products[0]._id).set({
    category: { _type: "reference", _ref: targetCategory._id }
  }).commit();
  
  console.log("Successfully moved!");
}

main().catch(console.error);

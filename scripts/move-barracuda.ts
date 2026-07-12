import { createClient } from "@sanity/client";

const client = createClient({
  projectId: "lz2bjis5",
  dataset: "production",
  token: "skWTJsP8SBitTXqNjnnINgLcN3xEofn88wOJoa1OGAuJcfDXCH4bs3j0JXkj6WJs48WuzslRAL6iQOyEpaz7zObyCyCA55cfiXiVFSUEZAAhrBXp67dexkjeU1LAYsEbM0lyCI8KcWhE1lw5me35FomcayMpeRK3VvmWGEoLtZ637kRN3Pzp",
  apiVersion: "2024-04-01",
  useCdn: false,
});

async function main() {
  console.log("Searching for Barracuda product...");
  const products = await client.fetch('*[_type == "product" && (name match "*BARACCUDA*" || name match "*BARRACUDA*")]{_id, name, code, "categoryName": category->name}');
  
  if (products.length === 0) {
    console.error("Could not find any Barracuda product.");
    return;
  }
  
  console.log("Found products:");
  products.forEach((p: any) => console.log(`- ${p.name} (${p.code}) [Current: ${p.categoryName}]`));
  
  if (products.length !== 1) {
    console.log("Multiple products found. Please specify which one to move, or we can move all of them if they are all barracuda steaks.");
  }
  
  // Find a good fish category based on the name of the product
  let targetCategoryName = "FISH FROZEN OTHER"; // default fallback
  
  if (products[0].name.startsWith("DD ")) targetCategoryName = "DAILY DELIGHT FISH";
  if (products[0].name.startsWith("VS ")) targetCategoryName = "VISWAS MASALAS & SPICES"; // wait, usually VISWAS FISH doesn't exist, we saw VISWAS FROZEN VEG & RAW ITEMS
  
  // Let's just find "FISH FROZEN OTHER" and use it for now unless we need to check all fish categories.
  const categories = await client.fetch('*[_type == "category" && name match "*FISH*"]{_id, name}');
  console.log("\nAvailable Fish Categories:");
  categories.forEach((c: any) => console.log(`- ${c.name}`));
  
  // Select a reasonable default category from available ones
  const targetCategory = categories.find((c: any) => c.name === "FISH FROZEN OTHER") || categories[0];
  
  if (!targetCategory) {
    console.error("No fish category found!");
    return;
  }
  
  console.log(`\nMoving ${products[0].name} to ${targetCategory.name}...`);
  await client.patch(products[0]._id).set({
    category: { _type: "reference", _ref: targetCategory._id }
  }).commit();
  
  console.log("Successfully moved!");
}

main().catch(console.error);

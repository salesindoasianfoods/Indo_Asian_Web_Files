import { createClient } from "@sanity/client";

const client = createClient({
  projectId: "lz2bjis5",
  dataset: "production",
  token: "skWTJsP8SBitTXqNjnnINgLcN3xEofn88wOJoa1OGAuJcfDXCH4bs3j0JXkj6WJs48WuzslRAL6iQOyEpaz7zObyCyCA55cfiXiVFSUEZAAhrBXp67dexkjeU1LAYsEbM0lyCI8KcWhE1lw5me35FomcayMpeRK3VvmWGEoLtZ637kRN3Pzp",
  apiVersion: "2024-04-01",
  useCdn: false,
});

async function main() {
  console.log("Searching for DRY YELLOW STRIPE product...");
  const products = await client.fetch('*[_type == "product" && name match "*YELLOW STRIPE*"]{_id, name, code, "categoryName": category->name}');
  
  if (products.length === 0) {
    console.error("Could not find the product.");
  } else {
    console.log("Found products:");
    products.forEach((p: any) => console.log(`- ${p.name} (${p.code}) [Current: ${p.categoryName}]`));
  }
  
  console.log("\nAvailable Fish or Dry categories:");
  const categories = await client.fetch('*[_type == "category" && (name match "*FISH*" || name match "*DRY*")]{_id, name}');
  categories.forEach((c: any) => console.log(`- ${c.name}`));
}

main().catch(console.error);

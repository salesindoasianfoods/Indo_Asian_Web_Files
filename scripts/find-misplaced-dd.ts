import { createClient } from "@sanity/client";

const client = createClient({
  projectId: "lz2bjis5",
  dataset: "production",
  token: "skWTJsP8SBitTXqNjnnINgLcN3xEofn88wOJoa1OGAuJcfDXCH4bs3j0JXkj6WJs48WuzslRAL6iQOyEpaz7zObyCyCA55cfiXiVFSUEZAAhrBXp67dexkjeU1LAYsEbM0lyCI8KcWhE1lw5me35FomcayMpeRK3VvmWGEoLtZ637kRN3Pzp",
  apiVersion: "2024-04-01",
  useCdn: false,
});

async function main() {
  console.log("Fetching all products...");
  const products = await client.fetch('*[_type == "product"]{_id, name, code, "categoryName": category->name}');
  
  // Filter for products that start with DD
  const ddProducts = products.filter((p: any) => 
    (p.name && p.name.toUpperCase().startsWith("DD ")) || 
    (p.code && p.code.toUpperCase().startsWith("DD")) ||
    (p.name && p.name.toUpperCase().startsWith("DAILY DELIGHT"))
  );

  console.log(`Found ${ddProducts.length} total Daily Delight / DD products.`);

  // Find misplaced ones (where category doesn't start with "DAILY DELIGHT")
  const misplaced = ddProducts.filter((p: any) => {
    const cat = p.categoryName ? p.categoryName.toUpperCase() : "";
    return !cat.startsWith("DAILY DELIGHT");
  });

  console.log(`\nFound ${misplaced.length} misplaced products:\n`);
  
  misplaced.forEach((p: any, i: number) => {
    console.log(`${i + 1}. ${p.name} (Code: ${p.code})`);
    console.log(`   - Current Category: ${p.categoryName || "NONE"}`);
  });
}

main().catch(console.error);

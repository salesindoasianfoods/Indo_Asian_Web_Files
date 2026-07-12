import { createClient } from "@sanity/client";

const client = createClient({
  projectId: "lz2bjis5",
  dataset: "production",
  token: "skWTJsP8SBitTXqNjnnINgLcN3xEofn88wOJoa1OGAuJcfDXCH4bs3j0JXkj6WJs48WuzslRAL6iQOyEpaz7zObyCyCA55cfiXiVFSUEZAAhrBXp67dexkjeU1LAYsEbM0lyCI8KcWhE1lw5me35FomcayMpeRK3VvmWGEoLtZ637kRN3Pzp",
  apiVersion: "2024-04-01",
  useCdn: false,
});

async function main() {
  const products = await client.fetch('*[_type == "product"]{_id, name, code, "categoryName": category->name}');
  
  // Broader search: anywhere in name or code
  const possibleDD = products.filter((p: any) => {
    const n = p.name ? p.name.toUpperCase() : "";
    const c = p.code ? p.code.toUpperCase() : "";
    return n.includes("DAILY DELIGHT") || 
           n.includes(" DD ") || 
           n.startsWith("DD ") || 
           n.startsWith("DD") || 
           c.includes("DD");
  });

  const misplaced = possibleDD.filter((p: any) => {
    const cat = p.categoryName ? p.categoryName.toUpperCase() : "";
    return !cat.startsWith("DAILY DELIGHT");
  });

  console.log(`Found ${misplaced.length} potentially misplaced products out of ${possibleDD.length} broad matches:\n`);
  
  misplaced.forEach((p: any, i: number) => {
    console.log(`${i + 1}. ${p.name} (Code: ${p.code}) - Cat: ${p.categoryName || "NONE"}`);
  });
}

main().catch(console.error);

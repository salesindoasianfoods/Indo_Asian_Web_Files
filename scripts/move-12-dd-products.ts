import { createClient } from "@sanity/client";

const client = createClient({
  projectId: "lz2bjis5",
  dataset: "production",
  token: "skWTJsP8SBitTXqNjnnINgLcN3xEofn88wOJoa1OGAuJcfDXCH4bs3j0JXkj6WJs48WuzslRAL6iQOyEpaz7zObyCyCA55cfiXiVFSUEZAAhrBXp67dexkjeU1LAYsEbM0lyCI8KcWhE1lw5me35FomcayMpeRK3VvmWGEoLtZ637kRN3Pzp",
  apiVersion: "2024-04-01",
  useCdn: false,
});

async function main() {
  console.log("Fetching target categories...");
  
  const categoriesToFetch = [
    "DAILY DELIGHT OTHER",
    "DAILY DELIGHT SNACKS",
    "DAILY DELIGHT VEG & RAW FOODS",
    "DAILY DELIGHT FISH"
  ];
  
  const fetchedCats = await client.fetch('*[_type == "category" && name in $cats]{_id, name}', { cats: categoriesToFetch });
  
  const catsMap: Record<string, string> = {};
  fetchedCats.forEach((c: any) => catsMap[c.name] = c._id);
  
  for (const cat of categoriesToFetch) {
    if (!catsMap[cat]) throw new Error(`Category not found: ${cat}`);
  }

  const moves = [
    { code: "JAGGP", catName: "DAILY DELIGHT OTHER" },
    { code: "ADAPRA", catName: "DAILY DELIGHT OTHER" },
    { code: "BANACB", catName: "DAILY DELIGHT SNACKS" },
    { code: "JACKF9", catName: "DAILY DELIGHT VEG & RAW FOODS" },
    { code: "GRE-M", catName: "DAILY DELIGHT VEG & RAW FOODS" },
    { code: "WHITFIS", catName: "DAILY DELIGHT FISH" },
    { code: "SAILFISHCU", catName: "DAILY DELIGHT FISH" },
    { code: "WHEATLAD", catName: "DAILY DELIGHT SNACKS" },
    { code: "FISHB-M", catName: "DAILY DELIGHT OTHER" },
    { code: "PAKKA-M", catName: "DAILY DELIGHT SNACKS" },
    { code: "SOL", catName: "DAILY DELIGHT FISH" },
    { code: "PLUM-M", catName: "DAILY DELIGHT OTHER" }
  ];

  const codes = moves.map(m => m.code);
  
  console.log("Fetching the 12 products...");
  const products = await client.fetch('*[_type == "product" && code in $codes]{_id, name, code}', { codes });
  
  if (products.length !== 12) {
    console.warn(`Expected 12 products, but found ${products.length}! Proceeding with found products...`);
  }
  
  console.log("Preparing transaction...");
  const transaction = client.transaction();
  
  for (const move of moves) {
    const product = products.find((p: any) => p.code === move.code);
    if (!product) {
      console.warn(`Product not found for code: ${move.code}`);
      continue;
    }
    
    console.log(`Patching ${product.name} to ${move.catName}...`);
    transaction.patch(product._id, (p: any) => 
      p.set({ category: { _type: "reference", _ref: catsMap[move.catName] } })
    );
  }
  
  console.log("Committing transaction...");
  await transaction.commit();
  console.log("Successfully moved all products!");
}

main().catch(console.error);

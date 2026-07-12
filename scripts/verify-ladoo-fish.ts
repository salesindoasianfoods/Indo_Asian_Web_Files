import { createClient } from "@sanity/client";

const client = createClient({
  projectId: "lz2bjis5",
  dataset: "production",
  token: "skWTJsP8SBitTXqNjnnINgLcN3xEofn88wOJoa1OGAuJcfDXCH4bs3j0JXkj6WJs48WuzslRAL6iQOyEpaz7zObyCyCA55cfiXiVFSUEZAAhrBXp67dexkjeU1LAYsEbM0lyCI8KcWhE1lw5me35FomcayMpeRK3VvmWGEoLtZ637kRN3Pzp",
  apiVersion: "2024-04-01",
  useCdn: false,
});

async function main() {
  console.log("Checking current categories...");
  const ladoo = await client.fetch('*[_type == "product" && code == "WHEATLAD"][0]{name, "categoryName": category->name}');
  const fish = await client.fetch('*[_type == "product" && code == "WHITFIS"][0]{name, "categoryName": category->name}');
  
  if (ladoo) {
    console.log(`- ${ladoo.name} is currently in: ${ladoo.categoryName}`);
  }
  
  if (fish) {
    console.log(`- ${fish.name} is currently in: ${fish.categoryName}`);
  }
}

main().catch(console.error);

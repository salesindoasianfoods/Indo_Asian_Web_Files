import { createClient } from "@sanity/client";

const client = createClient({
  projectId: "lz2bjis5",
  dataset: "production",
  token: "skWTJsP8SBitTXqNjnnINgLcN3xEofn88wOJoa1OGAuJcfDXCH4bs3j0JXkj6WJs48WuzslRAL6iQOyEpaz7zObyCyCA55cfiXiVFSUEZAAhrBXp67dexkjeU1LAYsEbM0lyCI8KcWhE1lw5me35FomcayMpeRK3VvmWGEoLtZ637kRN3Pzp",
  apiVersion: "2024-04-01",
  useCdn: false,
});

async function main() {
  console.log("Finding target categories...");
  const fishCategory = await client.fetch('*[_type == "category" && name == "FISH FROZEN OTHER"][0]');
  const ddFishCategory = await client.fetch('*[_type == "category" && name == "DAILY DELIGHT FISH"][0]');
  
  if (!fishCategory || !ddFishCategory) {
    throw new Error("Categories not found!");
  }

  console.log("Finding products...");
  const meenpeera = await client.fetch('*[_type == "product" && code == "MEENSA-M"][0]');
  const sailFish = await client.fetch('*[_type == "product" && code == "SAILFISHCU"][0]');
  
  const transaction = client.transaction();

  if (meenpeera) {
    console.log(`Patching ${meenpeera.name} to FISH FROZEN OTHER...`);
    transaction.patch(meenpeera._id, (p: any) => 
      p.set({ category: { _type: "reference", _ref: fishCategory._id } })
    );
  } else {
    console.warn("MEENPEERA SARDINE not found.");
  }

  if (sailFish) {
    console.log(`Patching ${sailFish.name} to DAILY DELIGHT FISH (just in case)...`);
    transaction.patch(sailFish._id, (p: any) => 
      p.set({ category: { _type: "reference", _ref: ddFishCategory._id } })
    );
  }

  console.log("Committing transaction...");
  await transaction.commit();
  console.log("Successfully moved the products!");
}

main().catch(console.error);

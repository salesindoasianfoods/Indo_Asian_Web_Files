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
  const otherItemsCategory = await client.fetch('*[_type == "category" && name == "OTHER ITEMS"][0]');
  const picklesCategory = await client.fetch('*[_type == "category" && name == "VISWAS PICKLES"][0]');
  
  if (!otherItemsCategory || !picklesCategory) {
    throw new Error("Target categories not found!");
  }
  
  console.log("Finding products...");
  const dryTrevally = await client.fetch('*[_type == "product" && code == "DRYYELLOW"][0]');
  const jackFruitJam = await client.fetch('*[_type == "product" && name match "JACK FRUIT JAM*"][0]');
  
  const transaction = client.transaction();

  if (dryTrevally) {
    console.log(`Patching ${dryTrevally.name} to OTHER ITEMS...`);
    transaction.patch(dryTrevally._id, (p: any) => 
      p.set({ category: { _type: "reference", _ref: otherItemsCategory._id } })
    );
  } else {
    console.warn("DRY YELLOW STRIPE TRVAELLY not found.");
  }

  if (jackFruitJam) {
    console.log(`Patching ${jackFruitJam.name} to VISWAS PICKLES...`);
    transaction.patch(jackFruitJam._id, (p: any) => 
      p.set({ category: { _type: "reference", _ref: picklesCategory._id } })
    );
  } else {
    console.warn("JACK FRUIT JAM not found.");
  }

  console.log("Committing transaction...");
  await transaction.commit();
  console.log("Successfully moved the products!");
}

main().catch(console.error);
